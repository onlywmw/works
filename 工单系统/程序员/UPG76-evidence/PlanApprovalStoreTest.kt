package com.hermes.dsh.tools

import com.hermes.mov.exec.approval.CanonicalCodec
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * UPG-76 预审单批准清单（PlanApprovalStore §8.3）——纯 JVM 机制层测试。
 *
 * 契约（对齐执行引擎 v0.4 §8.3 双状态机，不接线 exec-engine 运行时）：
 * - 命中放行 + 原子扣减（HIT 一次后同键耗尽 → RUNS_EXHAUSTED）
 * - 计划外（未登记/未批准）→ MISS（fail-closed 方向转 ASK）
 * - 过期 = EXPIRED ≠ REJECTED（不复活；重跑 = 新单）；consume 主动发现过期也返回 EXPIRED
 * - 单次执行：runsLeft=1，防批量批准后被循环重放
 * - only-once / MONEY 永不入簿（approve 抛异常）且 consume 防御直返 MISS
 * - Group 生命周期迁移：pending → partially_decided / completed / stale / expired
 * - 键 = toolName + canonical(args) 指纹（复用 mov-exec-engine CanonicalCodec，禁第三份 canonical）
 */
class PlanApprovalStoreTest {

    private fun store() = PlanApprovalStore()
    private fun args(vararg kv: Pair<String, Any?>) = kv.toMap()

    private fun approveAll(g: PlanApprovalStore, groupId: String, tool: String, a: Map<String, Any?>) {
        g.createPlan(groupId, runId = null, ttlMs = 60_000L)
        g.submitDecision(groupId, listOf(PlanApprovalStore.StepAction.Approve(tool, a)))
    }

    // ==================== 命中放行 + 扣减 / 单次执行 ====================

    @Test
    fun `命中放行并原子扣减_耗尽后同键转RUNS_EXHAUSTED`() {
        val s = store()
        val a = args("cmd" to "ls")
        approveAll(s, "g1", "shell.exec", a)
        assertEquals(PlanApprovalStore.Consume.HIT, s.consumeIfApproved("shell.exec", a))
        // 单次执行：runsLeft=1 扣减耗尽 → 同调用转新 ASK（防批量批准后被循环重放）
        assertEquals(PlanApprovalStore.Consume.RUNS_EXHAUSTED, s.consumeIfApproved("shell.exec", a))
        assertEquals(PlanApprovalStore.Consume.RUNS_EXHAUSTED, s.consumeIfApproved("shell.exec", a))
    }

    // ==================== 计划外 → MISS / 已决否 → DENIED ====================

    @Test
    fun `计划外未登记返回MISS`() {
        val s = store()
        val a = args("cmd" to "ls")
        // 从未建单/从未批准 → 真计划外
        assertEquals(PlanApprovalStore.Consume.MISS, s.consumeIfApproved("shell.exec", a))
    }

    @Test
    fun `单上被拒步骤执行期命中为DENIED不重复弹窗`() {
        val s = store()
        val a = args("cmd" to "ls")
        // 建单但该步骤在单上被拒 → 已决否 DENIED（用户已在预审单否过 → 执行期不重复打扰；「阻断下游」语义）
        s.createPlan("g1", runId = null, ttlMs = 60_000L)
        s.submitDecision("g1", listOf(PlanApprovalStore.StepAction.Reject("shell.exec", a)))
        assertEquals(PlanApprovalStore.Consume.DENIED, s.consumeIfApproved("shell.exec", a))
        assertEquals(PlanApprovalStore.Consume.DENIED, s.consumeIfApproved("shell.exec", a))
    }

    @Test
    fun `同工具不同参数为不同键_未批准参数MISS`() {
        val s = store()
        val approved = args("cmd" to "ls")
        val other = args("cmd" to "rm -rf /") // 同工具、不同参数 → 键不同
        approveAll(s, "g1", "shell.exec", approved)
        assertEquals(PlanApprovalStore.Consume.HIT, s.consumeIfApproved("shell.exec", approved))
        // 参数指纹隔离：改了参数 = 计划外 = 转新 ASK（不因「同工具已批」放行）
        assertEquals(PlanApprovalStore.Consume.MISS, s.consumeIfApproved("shell.exec", other))
    }

    @Test
    fun `参数键等价_映射顺序无关canonical稳定命中`() {
        val s = store()
        val a1 = java.util.LinkedHashMap<String, Any?>().apply { put("b", 2); put("a", 1) }
        val a2 = java.util.LinkedHashMap<String, Any?>().apply { put("a", 1); put("b", 2) }
        assertEquals("canonical 键应对映射顺序不敏感", s.argHashOf(a1), s.argHashOf(a2))
        approveAll(s, "g1", "shell.exec", a1)
        assertEquals(PlanApprovalStore.Consume.HIT, s.consumeIfApproved("shell.exec", a2))
    }

    // ==================== 过期 = EXPIRED ≠ REJECTED（不复活） ====================

    @Test
    fun `已过期节点consume返回EXPIRED且不复活`() {
        val s = store()
        val a = args("cmd" to "ls")
        // 负 ttl → 批准即过期（approved node expiresAt = 创建时 now + ttl）
        s.createPlan("g1", runId = null, ttlMs = -1000L)
        s.submitDecision("g1", listOf(PlanApprovalStore.StepAction.Approve("shell.exec", a)))
        assertEquals(PlanApprovalStore.Consume.EXPIRED, s.consumeIfApproved("shell.exec", a))
        // 不复活：node 已被翻 EXPIRED → 后续不再放行（要跑 = 重新出单 §6.3）
        assertEquals(PlanApprovalStore.Consume.MISS, s.consumeIfApproved("shell.exec", a))
    }

    // ==================== only-once / MONEY 红线 ====================

    @Test
    fun `onlyonce永不入簿且consume防御MISS`() {
        val s = store()
        val a = args("key" to "k1")
        s.createPlan("g1", runId = null, ttlMs = 60_000L)
        val ex = assertThrows(IllegalArgumentException::class.java) {
            s.submitDecision("g1", listOf(PlanApprovalStore.StepAction.Approve("vault.get", a)))
        }
        assertTrue("红线消息失配: ${ex.message}", ex.message!!.contains("only-once"))
        // 防御：即便状态异常（绕过入簿），consume 对 only-once 直返 MISS（fail-closed 方向转 ASK）
        assertEquals(PlanApprovalStore.Consume.MISS, s.consumeIfApproved("vault.get", a))
    }

    @Test
    fun `MONEY永不入簿且consume防御MISS`() {
        val s = store()
        val a = args("amount" to 100)
        s.createPlan("g1", runId = null, ttlMs = 60_000L)
        // payment.pay 现金流出：永不预批（入簿即拒——红线 require 触发，非「未建单」误捕获）
        val ex = assertThrows(IllegalArgumentException::class.java) {
            s.submitDecision("g1", listOf(PlanApprovalStore.StepAction.Approve("payment.pay", a)))
        }
        assertTrue("红线消息失配: ${ex.message}", ex.message!!.contains("MONEY"))
        assertEquals(PlanApprovalStore.Consume.MISS, s.consumeIfApproved("payment.pay", a))
        // payment.* 前缀兜底同样拦
        assertEquals(PlanApprovalStore.Consume.MISS, s.consumeIfApproved("payment.query", a))
    }

    // ==================== Group 双状态机迁移（§8.3） ====================

    @Test
    fun `Group迁移_pending经部分批准到partially_decided_收口completed`() {
        val s = store()
        s.createPlan("g1", runId = "run-1", ttlMs = 60_000L)
        assertEquals(PlanApprovalStore.GroupStatus.PENDING, s.groupStatus("g1"))
        // 部分同意：勾选批 + 未勾拒 → partially_decided（已批项可执行、被拒项不执行）
        val next = s.submitDecision(
            "g1",
            listOf(
                PlanApprovalStore.StepAction.Approve("shell.exec", args("cmd" to "ls")),
                PlanApprovalStore.StepAction.Reject("http.post", args("url" to "https://x")),
            ),
        )
        assertEquals(PlanApprovalStore.GroupStatus.PARTIALLY_DECIDED, next)
        assertEquals(PlanApprovalStore.GroupStatus.PARTIALLY_DECIDED, s.groupStatus("g1"))
        // 全拒 → completed（无可执行）
        s.createPlan("g2", runId = null, ttlMs = 60_000L)
        assertEquals(
            PlanApprovalStore.GroupStatus.COMPLETED,
            s.submitDecision("g2", listOf(PlanApprovalStore.StepAction.Reject("http.post", args("url" to "https://x")))),
        )
        // 收口 → completed（终态）
        s.finalize("g1")
        assertEquals(PlanApprovalStore.GroupStatus.COMPLETED, s.groupStatus("g1"))
    }

    @Test
    fun `Group_收口后不可再裁决_重复建单拒绝`() {
        val s = store()
        approveAll(s, "g1", "shell.exec", args("cmd" to "ls"))
        s.finalize("g1")
        assertThrows(IllegalArgumentException::class.java) {
            s.submitDecision("g1", listOf(PlanApprovalStore.StepAction.Approve("device.timer", args())))
        }
        // 重复建单拒绝
        assertThrows(IllegalArgumentException::class.java) {
            s.createPlan("g1", runId = null, ttlMs = 60_000L)
        }
    }

    @Test
    fun `Group_markStale使已批节点全STALE不可执行`() {
        val s = store()
        val a = args("cmd" to "ls")
        approveAll(s, "g1", "shell.exec", a)
        s.markStale("g1")
        assertEquals(PlanApprovalStore.GroupStatus.STALE, s.groupStatus("g1"))
        // 策略面异常后整单 stale：approved 授权全部失效不可执行（§6.6）
        assertEquals(PlanApprovalStore.Consume.MISS, s.consumeIfApproved("shell.exec", a))
        val nodes = s.nodesOf("g1")
        assertTrue(nodes.all { it.status == PlanApprovalStore.NodeStatus.STALE })
    }

    @Test
    fun `Group_超时自动expired_组内approved全失效`() {
        val s = store()
        val a = args("cmd" to "ls")
        s.createPlan("g1", runId = null, ttlMs = 60_000L)
        s.submitDecision("g1", listOf(PlanApprovalStore.StepAction.Approve("shell.exec", a)))
        // 时间越过整单 TTL → expirePassedGroups 推进 expired（挂账单超时自动关单）
        s.expirePassedGroups(now = System.currentTimeMillis() + 120_000L)
        assertEquals(PlanApprovalStore.GroupStatus.EXPIRED, s.groupStatus("g1"))
        assertEquals(PlanApprovalStore.Consume.MISS, s.consumeIfApproved("shell.exec", a))
    }

    @Test
    fun `blockStep写入blocked_执行绑定DENIED`() {
        val s = store()
        val a = args("cmd" to "ls")
        s.createPlan("g1", runId = null, ttlMs = 60_000L)
        // 依赖被拒步骤的下游 = blocked（本步骤不执行、授权不入簿）→ 执行期命中 = 已决否 DENIED（阻断下游）
        s.blockStep("g1", "shell.exec", a)
        assertEquals(PlanApprovalStore.Consume.DENIED, s.consumeIfApproved("shell.exec", a))
    }

    // ==================== 键指纹（canonical 复用） ====================

    @Test
    fun `nodeKey由tool与参数哈希构成_可区分工具`() {
        val s = store()
        val k1 = s.nodeKeyOf("shell.exec", args("cmd" to "ls"))
        val k2 = s.nodeKeyOf("shell.exec", args("cmd" to "pwd"))
        val k3 = s.nodeKeyOf("device.timer", args("cmd" to "ls"))
        assertNotNull(k1)
        assertNotEquals("参数不同键应变", k1, k2)
        assertNotEquals("工具不同键应变", k1, k3)
        // 与引擎 CanonicalCodec 同源（sha256 定长 64 hex）
        assertEquals(64, k1!!.substringAfter(' ').length)
    }

    @Test
    fun `argHash与engine CanonicalCodec一致性_同一canonical源`() {
        val s = store()
        val a = args("b" to 2, "a" to 1)
        val h = s.argHashOf(a)
        assertEquals(64, h.length)
        // 端到端：engine CanonicalCodec.canonicalHash 直接对等价 JObj 得同值（验证复用而非第三份 canonical）
        val node = com.hermes.mov.exec.json.JsonNode.JObj(
            java.util.LinkedHashMap<String, com.hermes.mov.exec.json.JsonNode>().apply {
                put("a", com.hermes.mov.exec.json.JsonNode.JNum("1"))
                put("b", com.hermes.mov.exec.json.JsonNode.JNum("2"))
            },
        )
        assertEquals(h, CanonicalCodec.canonicalHash(CanonicalCodec.canonical(node)))
    }
}
