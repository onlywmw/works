package com.hermes.dsh.tools

import com.hermes.mov.exec.approval.CanonicalCodec
import com.hermes.mov.exec.json.JsonNode
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

/**
 * UPG-76：PlanApproval 批准清单存储（工具级落地；语义对齐执行引擎 v0.4 §8.3，不接线 exec-engine 运行时）。
 *
 * §8.3 Group 双状态机：pending → partially_decided → completed | expired | stale
 *             Node    ：approved | rejected | blocked | expired | stale
 *
 * 职责边界：
 *  - 只承载「授权 + 执行绑定查询」；「出单」「审批单 UI」= 阶段二调用方（本类纯 JVM 机制层，零 UI）。
 *  - 执行绑定：ApprovalService.request 在 remembered 豁免后、FIFO 弹窗前查 [consumeIfApproved]——
 *    命中放行 + 扣减（跳过弹窗）；未命中（计划外 / 耗尽 / 过期）落原 FIFO = 当场转新 ASK。
 *  - 键 = toolName + CanonicalCodec(canonical(args)) 参数指纹（复用 mov-exec-engine，禁第三份 canonical）。
 *  - 红线段：only-once 工具（OnlyOnceTools）永不入簿/永不被消费；MONEY 类（MoneyTools）永不入簿/永不被消费
 *    （执行到该步实时逐笔确认）——入簿拒绝 = 失败关闭（抛异常），查询防御 = MISS（fail-closed 方向转 ASK）。
 *  - 时效：授权绑 TTL；过期 = EXPIRED ≠ REJECTED，不可执行、不复活，要跑 = 重新出单（§6.3）。
 *  - 单次执行：每条授权 runsLeft=1，扣减耗尽 → 同调用转新 ASK（防批量批准后被循环重放）。
 *
 * 线程安全：nodes 走 ConcurrentHashMap.compute 单桶原子扣减（首决胜纪律同 ApprovalBook §P29）；group 只读字段。
 */
class PlanApprovalStore {

    enum class GroupStatus { PENDING, PARTIALLY_DECIDED, COMPLETED, EXPIRED, STALE }

    enum class NodeStatus { APPROVED, REJECTED, BLOCKED, EXPIRED, STALE }

    /** 授权节点（执行簿最小单元）。runsLeft=0 = 授权已耗尽（不存在即 MISS→转新 ASK）。 */
    data class Node(
        val nodeKey: String,
        val toolName: String,
        val argHash: String,
        val status: NodeStatus,
        val runsLeft: Int,
        val expiresAtMillis: Long,
    )

    /** 单（一个审批单 = 一个 Group）；status 变迁见头注 §8.3。 */
    data class Group(
        val groupId: String,
        val runId: String?,
        val status: GroupStatus,
        val createdAtMillis: Long,
        val expiresAtMillis: Long,
    )

    /** consumeIfApproved 结果：HIT=放行；DENIED=清单内已决否；其余=未放行（调用方落 FIFO 转新 ASK）。 */
    sealed interface Consume {
        /** 命中且在授权次数内 → 放行 + 扣减。 */
        data object HIT : Consume
        /**
         * 清单内已决否（节点 REJECTED/BLOCKED——审批单上该步被拒/被阻断）→ 不重复弹窗，
         * 调用方映射 OUTCOME_REJECTED（「阻断下游」语义，§8.1 断下游；已执行项不可撤回）。
         * 与 MISS 区分：MISS=真计划外（未登记/未建单/无节点）→ 当场转新 ASK；DENIED=用户已在单上否过 → 不再打扰。
         */
        data object DENIED : Consume
        /** 计划外/未授权/未登记。 */
        data object MISS : Consume
        /** 授权已耗尽（单次执行被重放）→ 同调用转新 ASK。 */
        data object RUNS_EXHAUSTED : Consume
        /** 已过期（EXPIRED ≠ REJECTED，不复活）→ 要跑 = 重新出单。 */
        data object EXPIRED : Consume
    }

    /** 单步裁决（审批单勾选）：Approve=授权一次；Reject=拒绝（该步不执行）。 */
    sealed interface StepAction {
        data class Approve(val toolName: String, val args: Map<String, Any?>) : StepAction
        data class Reject(val toolName: String, val args: Map<String, Any?>) : StepAction
    }

    private val groups = ConcurrentHashMap<String, Group>()
    private val nodes = ConcurrentHashMap<String, Node>()

    // ==================== Group 生命周期（§8.3） ====================

    /** 新开一张单（PENDING；TTL 决定整单时效）。 */
    fun createPlan(groupId: String, runId: String?, ttlMs: Long): GroupStatus {
        val now = System.currentTimeMillis()
        val prev = groups.putIfAbsent(
            groupId,
            Group(groupId, runId, GroupStatus.PENDING, now, now + ttlMs),
        )
        require(prev == null) { "groupId=$groupId 已存在，重复建单拒绝" }
        return GroupStatus.PENDING
    }

    /**
     * 用户裁决提交（部分同意 = 勾选批 + 未勾拒）。同批动作落簿后推进 Group 状态：
     *  - 存在 approved → partially_decided（已批项可执行、被拒项不执行）；全拒（无 approved）→ completed（无可执行）。
     * 调用方在整单处理收口时显式 [finalize] 为 completed；策略面异常走 [markStale]；超时由 [expirePassedGroups]。
     */
    fun submitDecision(groupId: String, actions: List<StepAction>): GroupStatus {
        val g = groups[groupId] ?: throw IllegalArgumentException("groupId=$groupId 未建单")
        require(g.status == GroupStatus.PENDING || g.status == GroupStatus.PARTIALLY_DECIDED) {
            "单已收口（${g.status}），不可再裁决"
        }
        var approved = 0
        for (action in actions) {
            when (action) {
                is StepAction.Approve -> {
                    approveNode(g, action.toolName, action.args)
                    approved++
                }
                is StepAction.Reject -> {
                    rejectNode(g, action.toolName, action.args)
                }
            }
        }
        val next = if (approved == 0) GroupStatus.COMPLETED else GroupStatus.PARTIALLY_DECIDED
        groups[groupId] = g.copy(status = next)
        return next
    }

    /** 依赖被拒步骤的下游 = blocked（§8.1 断下游；本步骤不执行、授权不入簿）。 */
    fun blockStep(groupId: String, toolName: String, args: Map<String, Any?>) {
        val g = groups[groupId] ?: throw IllegalArgumentException("groupId=$groupId 未建单")
        val key = nodeKeyOf(toolName, args) ?: return
        nodes.compute(key) { _, n -> n ?: Node(key, toolName.normalized(), argHashOf(args), NodeStatus.BLOCKED, 0, g.expiresAtMillis) }
    }

    /** 整单裁决/执行收口 → completed（终态）。 */
    fun finalize(groupId: String) {
        val g = groups[groupId] ?: return
        groups[groupId] = g.copy(status = GroupStatus.COMPLETED)
    }

    /** 策略面异常/授权后环境变化 → 整单 STALE（approved 授权全部失效不可执行；§6.6 工具级）。 */
    fun markStale(groupId: String) {
        val g = groups[groupId] ?: return
        groups[groupId] = g.copy(status = GroupStatus.STALE)
        for (key in nodes.keys) {
            nodes.computeIfPresent(key) { _, n ->
                if (n.status == NodeStatus.APPROVED) n.copy(status = NodeStatus.STALE) else n
            }
        }
    }

    /** 整单超时 → EXPIRED + 组内 approved 全 expired（不复活；重跑 = 新单）。 */
    fun expirePassedGroups(now: Long = System.currentTimeMillis()) {
        for (g in groups.values) {
            if ((g.status == GroupStatus.PENDING || g.status == GroupStatus.PARTIALLY_DECIDED) && now >= g.expiresAtMillis) {
                groups[g.groupId] = g.copy(status = GroupStatus.EXPIRED)
                for (key in nodes.keys) {
                    nodes.computeIfPresent(key) { _, n ->
                        if (n.status == NodeStatus.APPROVED) n.copy(status = NodeStatus.EXPIRED) else n
                    }
                }
            }
        }
    }

    // ==================== 执行绑定查询 ====================

    /**
     * 执行绑定（ApprovalService.request 下沉点）：键命中且 approved、未过期、次数未耗尽 → HIT + 原子扣减；
     * 清单内已决否（REJECTED/BLOCKED 节点——审批单上该步被拒/被阻断）→ DENIED（不重复弹窗）；
     * only-once / MONEY 防御直返 MISS（双保险——入簿已拒）。其余（计划外/耗尽/过期/STALE）未放行 =
     * 调用方落 FIFO 转新 ASK（DENIED 除外——那是用户已在单上否过，不打扰）。
     */
    fun consumeIfApproved(toolName: String, args: Map<String, Any?>): Consume {
        if (OnlyOnceTools.isOnlyOnce(toolName) || MoneyTools.isMoney(toolName)) return Consume.MISS
        val key = nodeKeyOf(toolName, args) ?: return Consume.MISS
        val now = System.currentTimeMillis()
        val holder = arrayOfNulls<Consume>(1)
        nodes.computeIfPresent(key) { _, n ->
            when {
                n.status == NodeStatus.APPROVED && now >= n.expiresAtMillis -> {
                    holder[0] = Consume.EXPIRED; n.copy(status = NodeStatus.EXPIRED)
                }
                n.status == NodeStatus.APPROVED && n.runsLeft <= 0 -> { holder[0] = Consume.RUNS_EXHAUSTED; n }
                n.status == NodeStatus.APPROVED -> { holder[0] = Consume.HIT; n.copy(runsLeft = n.runsLeft - 1) }
                n.status == NodeStatus.REJECTED || n.status == NodeStatus.BLOCKED -> { holder[0] = Consume.DENIED; n }
                // 已翻 EXPIRED / STALE 的节点后续 = 死节点（视同缺席，不复活）→ MISS 转新 ASK（首次发现过期才返 EXPIRED）
                else -> { holder[0] = Consume.MISS; n }
            }
        }
        return holder[0] ?: Consume.MISS
    }

    fun groupStatus(groupId: String): GroupStatus? = groups[groupId]?.status

    fun nodesOf(groupId: String): List<Node> {
        val g = groups[groupId] ?: return emptyList()
        return nodes.values.filter { it.expiresAtMillis == g.expiresAtMillis }.toList()
    }

    // ==================== 私有 ====================

    private fun approveNode(g: Group, toolName: String, args: Map<String, Any?>) {
        require(!OnlyOnceTools.isOnlyOnce(toolName)) { "only-once 工具不吃清单：$toolName（UPG-68 红线）" }
        require(!MoneyTools.isMoney(toolName)) { "MONEY 类永不预批：$toolName" }
        val key = nodeKeyOf(toolName, args) ?: throw IllegalArgumentException("参数指纹失败: $toolName")
        nodes.compute(key) { _, prev ->
            val n = Node(key, toolName.normalized(), argHashOf(args), NodeStatus.APPROVED, 1, g.expiresAtMillis)
            if (prev == null) n
            else if (prev.status == NodeStatus.EXPIRED || prev.status == NodeStatus.STALE) n
            else prev // 已 approved/rejected/blocked 不覆写（首决胜）
        }
    }

    private fun rejectNode(g: Group, toolName: String, args: Map<String, Any?>) {
        val key = nodeKeyOf(toolName, args) ?: return
        nodes.compute(key) { _, prev ->
            if (prev == null) Node(key, toolName.normalized(), argHashOf(args), NodeStatus.REJECTED, 0, g.expiresAtMillis) else prev
        }
    }

    private fun String.normalized(): String = replace('_', '.')

    // ==================== 参数指纹（复用 mov-exec-engine CanonicalCodec；禁第三份 canonical） ====================

    /** 节点键 = 规范化 toolName + NUL + canonical(args) sha256。 */
    fun nodeKeyOf(toolName: String, args: Map<String, Any?>): String? = try {
        toolName.normalized() + ' ' + argHashOf(args)
    } catch (e: Throwable) {
        null // canonical 拒绝（非有限数等）→ 未命中 fail-closed（转 ASK），不造键
    }

    fun argHashOf(args: Map<String, Any?>): String {
        val node = toJsonNode(args) as? JsonNode.JObj ?: JsonNode.JObj(java.util.LinkedHashMap())
        return CanonicalCodec.canonicalHash(CanonicalCodec.canonical(node))
    }

    /** 业务参数（Map<String, Any?>）→ engine JsonNode 树（plain JSON 值；canonical 化在 engine 内）。 */
    private fun toJsonNode(v: Any?): JsonNode = when (v) {
        null -> JsonNode.JNull
        is String -> JsonNode.JStr(v)
        is Boolean -> JsonNode.JBool(v)
        is Int -> JsonNode.JNum(v.toString())
        is Long -> JsonNode.JNum(v.toString())
        is Double -> JsonNode.JNum(v.toString())
        is Float -> JsonNode.JNum(v.toString())
        is Number -> JsonNode.JNum(v.toString())
        is Map<*, *> -> JsonNode.JObj(java.util.LinkedHashMap<String, JsonNode>().apply {
            for ((k, value) in v) this[k.toString()] = toJsonNode(value)
        })
        is List<*> -> JsonNode.JArr(v.map { toJsonNode(it) })
        is JSONObject -> JsonNode.JObj(java.util.LinkedHashMap<String, JsonNode>().apply {
            for (it in v.keys()) this[it.toString()] = toJsonNode(v.opt(it.toString()))
        })
        is JSONArray -> JsonNode.JArr((0 until v.length()).map { toJsonNode(v.opt(it)) })
        else -> JsonNode.JStr(v.toString()) // 兜底（未知类型按文本，canonical 稳定即可）
    }
}
