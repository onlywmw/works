package com.hermes.dsh.tools

import com.hermes.dsh.session.Session
import com.hermes.dsh.session.SessionEvent
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withTimeoutOrNull

/**
 * D4 审批服务（dsh user-approval 对齐）：
 * - 审计：approval/asked + approval/decided 成对进日志（turn 内）
 * - 回答者：单回答者（UI 弹窗）；null = fail-closed 'unavailable'
 * - FIFO 单队列（UPG-75 A1）：请求入队、同一时刻只展示队首一条；队首决出/超时 → 自动切下一条（无丢失）
 * - 展示期超时：60s 无响应 → 'cancelled'（fail-closed）；排队中不计时（无静默队列丢请求）
 * - A2 待办投影：pendingCount/pendingList/presentingRequestId 供「审批待办」列表/顶栏角标同源读取；
 *   complete(requestId, answer) = 外部决策入口（列表允许/拒绝），first-win 与展示侧决策 CAS 竞争
 * - A3 渠道统一：本服务 = 唯一决策/审计源；前台弹窗/后台通知/待办列表都是同一队列的不同投影
 * - 隐式 turn：无 open turn 时自开最小 turn（MCP 直调无 turn 上下文）
 * - outcome 只有 'allowed-once' 是授权（一次性，不持续）
 *
 * UPG-68 安全语义零改动：only-once / fail-closed / 豁免顺序（turn→goal→remembered）原样保留。
 */
class ApprovalService(
    private val sessionProvider: () -> Session?,
) {
    companion object {
        const val OUTCOME_ALLOWED_ONCE = "allowed-once"
        const val OUTCOME_ALLOWED_TURN = "allowed-turn"
        const val OUTCOME_ALLOWED_GOAL = "allowed-goal"
        /** UPG-53 场景7：持久化同类记住命中（越用越顺——非本 turn/goal 新授权，是历史偏好的再消费）。 */
        const val OUTCOME_ALLOWED_REMEMBERED = "allowed-remembered"
        const val OUTCOME_REJECTED = "rejected"
        const val OUTCOME_CANCELLED = "cancelled"
        const val OUTCOME_UNAVAILABLE = "unavailable"
        const val TIMEOUT_MS = 60_000L

        /**
         * UPG-77 A1：outcome → 放行判定（单源化——对话面 dispatch 与 MCP 面 tools/call 共用）。
         * only-once 工具（vault.get/browser.* 明文敏感面）只接受 allowed-once；其余工具
         * turn/remembered 豁免同样放行。goal outcome 不在放行列（与 UPG-68 收口语义精确等价，不改动）。
         */
        fun isGranted(toolName: String, outcome: String): Boolean {
            val onceOk = outcome == OUTCOME_ALLOWED_ONCE
            val otherOk = outcome == OUTCOME_ALLOWED_TURN || outcome == OUTCOME_ALLOWED_REMEMBERED
            return if (OnlyOnceTools.isOnlyOnce(toolName)) onceOk else onceOk || otherOk
        }
    }

    /** B 方案三键回答 2026-08-24 用户拍板：允许本轮 / 允许本次 / 拒绝；UPG-07 批 2 扩四键：允许本目标。 */
    enum class Answer { ALLOW_TURN, ALLOW_GOAL, ALLOW_ONCE, REJECT }

    /** 待审批信息（回答者展示用：工具名 + 参数摘要脱敏在展示层做）。 */
    data class PendingInfo(
        val requestId: String,
        val toolName: String,
        val reason: String?,
        val args: Map<String, Any?>,
    )

    /** A2/A3 待办列表投影（同源队列快照；position/total 为快照当下值）。 */
    data class PendingView(
        val requestId: String,
        val toolName: String,
        val reason: String?,
        val args: Map<String, Any?>,
        val submittedAtMillis: Long,
        val position: Int,
        val total: Int,
    )

    /**
     * 回答者：ALLOW_TURN=本轮允许（同类不再问）/ ALLOW_ONCE=允许本次 / REJECT=拒绝 / null=不处理（fail-closed）。
     * 由 UI 装配（AlertDialog 三键）；无回答者 = unavailable。
     * UPG-75：answerer 只服务「正展示的队首」一次；返回即代表该 pending 已有首决（不重入）。
     */
    @Volatile
    var answerer: (suspend (PendingInfo) -> Answer?)? = null

    /** 展示侧超时（默认 60s；JVM 测试可缩小注入）。A4：只对「正在展示」的 pending 计时，排队不计时。 */
    @Volatile
    var timeoutMs: Long = TIMEOUT_MS

    /** A2 角标/待办实时刷新钩子：队列未决数变化时回调（count = 未决 pending 数）。 */
    @Volatile
    var onQueueChanged: ((Int) -> Unit)? = null

    /**
     * A2：当「正展示中」的 pending 被 [complete] 抢先决策时触发——展示层据此关闭当前弹窗/通知
     * （防双决策源重叠：外部决策 first-win 后，展示侧返回须被忽略而非覆盖）。
     */
    @Volatile
    var presentationCanceller: (() -> Unit)? = null

    /**
     * B 方案「允许本轮」允许集：turn 号 → 已放行的工具名（规范化）。turn 边界由日志 open/close 决定。
     * 纯本地内存（重启即失——安全方向）；超出上限时整体清空（失败方向=多弹窗，可接受）。
     */
    private val turnAllowSet = java.util.concurrent.ConcurrentHashMap<Int, MutableSet<String>>()

    /**
     * UPG-07 批 2：当前活跃目标 id 提供者（仅 ACTIVE 提供——ARMED/COMPLETED = goal 失效回收）。
     * 由宿主装配（MainActivity 从 GoalDomain 取）；null = 无活跃目标（goal 豁免不可用）。
     */
    @Volatile
    var goalIdProvider: (() -> String?)? = null

    /**
     * UPG-53 场景7「越用越顺」：持久化同类记住查询（SharedPreferences 背后由装配层注入）。
     * 写入侧已由 [ApprovalRemember.canRemember] 拦 gate 级（敏感/底线永不豁免）；此处只消费。
     * null = 未装配（豁免不启用）。
     */
    @Volatile
    var rememberedCheck: ((String) -> Boolean)? = null

    /**
     * UPG-07 批 2「允许本目标」允许集：goal id → 已放行的工具名（规范化）。
     * 同 turnAllowSet 策略：纯本地内存（重启即失——安全方向）；上限时整体清空（失败方向=多弹窗）。
     * goal 失效回收靠目标提供者实时校验（COMPLETED/ARMED 不再提供 → 豁免自然失效）。
     */
    private val goalAllowSet = java.util.concurrent.ConcurrentHashMap<String, MutableSet<String>>()

    /** 当前活跃 goal 是否已放行该工具；命中返回 goal id（无活跃目标/null = 未命中）。 */
    private fun allowThisGoal(toolName: String): String? {
        val goalId = goalIdProvider?.invoke() ?: return null
        return if (goalAllowSet[goalId]?.contains(toolName.normalizedToolKey()) == true) goalId else null
    }

    /** 记录「允许本目标」的结果（active goal 存活期同工具后续直接放行）。 */
    private fun rememberGoalAllowed(toolName: String, goalId: String) {
        if (goalAllowSet.size > 100) goalAllowSet.clear()
        goalAllowSet.computeIfAbsent(goalId) { java.util.concurrent.ConcurrentHashMap.newKeySet() }
            .add(toolName.normalizedToolKey())
    }

    private fun allowThisTurn(toolName: String, turn: Int): Boolean =
        turnAllowSet[turn]?.contains(toolName.normalizedToolKey()) == true

    /** 工具名规范化（与 guard/调度侧一致的子串匹配口径：_ 与 . 归一）。 */
    private fun String.normalizedToolKey(): String = replace('_', '.')

    /** 记录「允许本轮」的结果（同 turn 同工具后续直接放行）。 */
    private fun rememberTurnAllowed(toolName: String, turn: Int) {
        if (turnAllowSet.size > 100) turnAllowSet.clear()
        turnAllowSet.computeIfAbsent(turn) { java.util.concurrent.ConcurrentHashMap.newKeySet() }
            .add(toolName.normalizedToolKey())
    }

    /** 当前 open turn 号：扫描日志找到最后 TurnStart；无 open → lastTurn+1（与 ensureTurn 同口径）。 */
    private fun openTurnOrNext(session: Session): Pair<Int, Boolean> {
        var last = 0
        for (index in session.events.indices.reversed()) {
            when (session.events[index]) {
                is SessionEvent.TurnStart ->
                    return (session.events[index] as SessionEvent.TurnStart).turn to false
                is SessionEvent.TurnEnd -> {
                    last = (session.events[index] as SessionEvent.TurnEnd).turn
                    break
                }
                else -> {}
            }
        }
        val turn = last + 1
        session.append("turn/start", mapOf("turn" to turn))
        return turn to true
    }

    // ==================== UPG-75 A1/A2/A3：FIFO 队列 + 单点展示 + 待办投影 ====================

    /**
     * 单条待审批（FIFO 节点）。决策 first-win（UPG-73 ApprovalBook 纪律）：
     * 展示侧 answerer 返回、外部 complete()、展示超时——三者以 CAS 竞争，仅首个写入者生效。
     */
    private class ApprovalPending(
        val requestId: String,
        val info: PendingInfo,
        val turn: Int,
        val submittedAtMillis: Long,
    ) {
        val decidedFlag = java.util.concurrent.atomic.AtomicBoolean(false)
        /** 首决答案；null + decided = 超时/取消（answerer 返回 null / 无人应答 / 队列空兜底）。 */
        val answerRef = java.util.concurrent.atomic.AtomicReference<Answer?>(null)

        /** first-win：已决则返回 false。返回 true = 本调用是首个决策写入者。 */
        fun tryDecide(answer: Answer?): Boolean {
            if (!decidedFlag.compareAndSet(false, true)) return false
            answerRef.set(answer)
            return true
        }
    }

    /** FIFO 队列（队首=下一个应展示项）；byId 供待办/complete 按 id 寻址。 */
    private val fifo = java.util.concurrent.ConcurrentLinkedQueue<ApprovalPending>()
    private val byId = java.util.concurrent.ConcurrentHashMap<String, ApprovalPending>()

    /** 展示串行闸：同一时刻至多一个 pending 在展示（由调用方协程轮流持有驱动，无外部 scope）。 */
    private val driveMutex = kotlinx.coroutines.sync.Mutex()

    /** 正展示中的 requestId（无 = 当前无弹窗/通知）。 */
    @Volatile
    private var presenting: String? = null

    /** 未决 pending 数（A2 角标；已决待清理项不计）。 */
    fun pendingCount(): Int {
        var n = 0
        for (p in fifo) if (!p.decidedFlag.get()) n++
        return n
    }

    /** A2 待办列表投影（FIFO 序、仅未决项、附当下位次）。 */
    fun pendingList(): List<PendingView> {
        val undecided = fifo.filter { !it.decidedFlag.get() }
        return undecided.mapIndexed { i, p ->
            PendingView(
                requestId = p.requestId,
                toolName = p.info.toolName,
                reason = p.info.reason,
                args = p.info.args,
                submittedAtMillis = p.submittedAtMillis,
                position = i + 1,
                total = undecided.size,
            )
        }
    }

    /** 正展示中的 requestId（无展示 = null）。 */
    fun presentingRequestId(): String? = presenting

    /**
     * A2/A3 外部决策入口（待办列表「允许/拒绝」/「全部本轮允许」；通知按钮经 answerer 不绕本入口）。
     * first-win：仅当该 pending 尚未被展示侧/超时决定时生效。
     * 若决定的是正展示中的那条 → 触发 [presentationCanceller]（展示层关闭当前弹窗/通知，防双源重叠）。
     */
    fun complete(requestId: String, answer: Answer): Boolean {
        val p = byId[requestId] ?: return false
        if (!p.tryDecide(answer)) return false
        if (presenting == requestId) presentationCanceller?.invoke()
        notifyQueueChanged()
        return true
    }

    /**
     * A2「全部本轮允许」：把当前所有未决、非 only-once 的 pending 统一按「本轮允许」决策
     * （ALLOW_TURN → 同 turn 同工具后续不再问）。
     * UPG-68 红线：only-once 工具（vault.get/browser.*）每弹当场确认——不得批量放行，跳过由用户逐条允许。
     * @return 本次批量决策条数（only-once 遗留不计入）。
     */
    fun allowAllThisTurn(): Int {
        var decided = 0
        for (view in pendingList()) {
            if (OnlyOnceTools.isOnlyOnce(view.toolName)) continue
            if (complete(view.requestId, Answer.ALLOW_TURN)) decided++
        }
        return decided
    }

    private fun notifyQueueChanged() {
        onQueueChanged?.invoke(pendingCount())
    }

    /** 取出队首未决项；顺带清掉队首已决（展示结束/外部决策后待回收）项，防卡队首。 */
    private fun nextUndecided(): ApprovalPending? {
        while (true) {
            val head = fifo.peek() ?: return null
            if (!head.decidedFlag.get()) return head
            fifo.poll()
            byId.remove(head.requestId)
        }
    }

    /** 串行驱动：直到「自己的 pending」有首决为止，依次展示队首（先来者优先，FIFO 不跳队）。 */
    private suspend fun driveUntilDecided(mine: ApprovalPending) {
        driveMutex.withLock {
            while (!mine.decidedFlag.get()) {
                val head = nextUndecided() ?: break // 队列已空（含自身被外部清走）→ 兜底取消
                present(head)
            }
        }
        // 空队列兜底：从未被展示且无外部决策 → 标记取消（防队列/请求永久悬挂）
        if (!mine.decidedFlag.get()) mine.tryDecide(null)
    }

    /**
     * 展示单个 pending（队首）：置 presenting → answerer 一次 → first-win 写入。
     * 超时只在此处发生（A4：60s fail-closed；排队等待不计时 = 无静默丢请求）。
     */
    private suspend fun present(p: ApprovalPending) {
        presenting = p.requestId
        val answer = try {
            val a = answerer
            if (a == null) null else withTimeoutOrNull(timeoutMs) { a(p.info) }
        } catch (e: kotlinx.coroutines.CancellationException) {
            throw e
        } catch (t: Throwable) {
            // 回答者异常（Activity 销毁等）→ fail-closed 视同未答复（审计 decided=cancelled 不断裂）
            android.util.Log.e("ApprovalService", "回答者异常: ${t.message}")
            null
        }
        p.tryDecide(answer)
        if (presenting == p.requestId) presenting = null
    }

    /** answer → outcome（UPG-68 映射原样保留；only-once 工具豁免记忆虽写但队首豁免检查跳过——审计一致）。 */
    private fun resolveOutcome(p: ApprovalPending, toolName: String, turn: Int): String = when (p.answerRef.get()) {
        Answer.ALLOW_ONCE -> {
            android.util.Log.i("ApprovalService", "决策: once $toolName")
            OUTCOME_ALLOWED_ONCE
        }
        Answer.ALLOW_TURN -> {
            android.util.Log.i("ApprovalService", "决策: turn $toolName turn=$turn")
            rememberTurnAllowed(toolName, turn)
            OUTCOME_ALLOWED_TURN
        }
        Answer.ALLOW_GOAL -> {
            val goalId = goalIdProvider?.invoke()
            if (goalId == null) {
                android.util.Log.w("ApprovalService", "无活跃 goal 却允许本目标: $toolName（防御拒绝）")
                OUTCOME_REJECTED
            } else {
                android.util.Log.i("ApprovalService", "决策: goal $toolName goal=$goalId")
                rememberGoalAllowed(toolName, goalId)
                OUTCOME_ALLOWED_GOAL
            }
        }
        Answer.REJECT -> {
            android.util.Log.i("ApprovalService", "决策: reject $toolName")
            OUTCOME_REJECTED
        }
        null -> {
            android.util.Log.i("ApprovalService", "决策: 超时/取消 $toolName（fail-closed）")
            OUTCOME_CANCELLED
        }
    }

    /**
     * 请求审批。返回 outcome（allowed-once / rejected / cancelled / unavailable）。
     * @param toolName 工具名（审计 + 展示）
     * @param reason 拦截原因（审计）
     * @param args 工具参数（展示摘要）
     */
    suspend fun request(toolName: String, reason: String?, args: Map<String, Any?>): String {
        val session = sessionProvider() ?: return OUTCOME_UNAVAILABLE
        val requestId = "appr-${System.nanoTime()}"

        // 隐式 turn：审计对必须 turn 包裹（对齐 B3 崩溃语义——无 turn 的裸事件会被当崩溃尾丢弃）
        val (turn, openedTurn) = openTurnOrNext(session)

        // B 方案「允许本轮」：同 turn 同工具已放行 → 不再弹窗（审计照落，outcome=allowed-turn）
        // UPG-61：每弹 only-once 工具（vault.get/browser.*）不吃任何豁免——handler 只认 allowed-once，
        // 豁免命中会造成「UI 承诺不再问、实际继续拒」的承诺与行为矛盾；跳过豁免=审计与 handler 完全一致
        val onlyOnce = OnlyOnceTools.isOnlyOnce(toolName)
        if (!onlyOnce && allowThisTurn(toolName, turn)) {
            android.util.Log.i("ApprovalService", "turn 豁免命中: $toolName turn=$turn")
            session.append("approval/asked", mapOf("requestId" to requestId, "toolName" to toolName, "reason" to "本轮已允许($turn)"))
            session.append("approval/decided", mapOf("requestId" to requestId, "outcome" to OUTCOME_ALLOWED_TURN))
            if (openedTurn) closeTurn(session, turn)
            return OUTCOME_ALLOWED_TURN
        }

        // UPG-07 批 2「允许本目标」：活跃 ACTIVE goal 已放行工具 → 不再弹窗（goal 寿命=豁免寿命）
        val goalId = if (onlyOnce) null else allowThisGoal(toolName)
        if (goalId != null) {
            android.util.Log.i("ApprovalService", "goal 豁免命中: $toolName goal=$goalId")
            session.append("approval/asked", mapOf("requestId" to requestId, "toolName" to toolName, "reason" to "本目标已允许(goal=$goalId)"))
            session.append("approval/decided", mapOf("requestId" to requestId, "outcome" to OUTCOME_ALLOWED_GOAL))
            if (openedTurn) closeTurn(session, turn)
            return OUTCOME_ALLOWED_GOAL
        }

        // UPG-53 场景7「越用越顺」：用户此前勾选「记住此偏好」的同类工具 → 不再弹窗（审计照落，outcome=allowed-remembered）。
        // 写入侧 canRemember 已拦 gate 级；此处只查——即使被恶意置入也不弹窗不提权（gate 级在 guard 层另有 DENY/ASK 铁闸）。
        if (!onlyOnce && rememberedCheck?.invoke(toolName) == true) {
            android.util.Log.i("ApprovalService", "记住偏好命中: $toolName")
            session.append("approval/asked", mapOf("requestId" to requestId, "toolName" to toolName, "reason" to "已记住同类偏好"))
            session.append("approval/decided", mapOf("requestId" to requestId, "outcome" to OUTCOME_ALLOWED_REMEMBERED))
            if (openedTurn) closeTurn(session, turn)
            return OUTCOME_ALLOWED_REMEMBERED
        }

        // 审计 asked（成对的第一半）
        session.append(
            "approval/asked",
            mapOf(
                "requestId" to requestId,
                "toolName" to toolName,
                "reason" to (reason ?: ""),
            ),
        )

        // 无回答者（未装配/已销毁）→ fail-closed unavailable（不排队——无人会来展示）
        if (answerer == null) {
            session.append("approval/decided", mapOf("requestId" to requestId, "outcome" to OUTCOME_UNAVAILABLE))
            if (openedTurn) closeTurn(session, turn)
            return OUTCOME_UNAVAILABLE
        }

        // FIFO 入队（UPG-75 A1：所有请求都进队等待，绝不静默拒绝/丢弃）
        val pending = ApprovalPending(
            requestId = requestId,
            info = PendingInfo(requestId, toolName, reason, args),
            turn = turn,
            submittedAtMillis = System.currentTimeMillis(),
        )
        fifo.add(pending)
        byId[requestId] = pending
        notifyQueueChanged()

        val outcome: String
        try {
            driveUntilDecided(pending)
            outcome = resolveOutcome(pending, toolName, turn)
        } catch (e: kotlinx.coroutines.CancellationException) {
            // 调用方协程取消：不得吞掉。若本 pending 尚未决，标记取消 + 审计，防队列/足迹悬挂
            if (pending.tryDecide(null)) {
                session.append("approval/decided", mapOf("requestId" to requestId, "outcome" to OUTCOME_CANCELLED))
                if (openedTurn) closeTurn(session, turn)
            }
            throw e
        } finally {
            fifo.remove(pending)
            byId.remove(requestId)
            notifyQueueChanged()
        }

        // 审计 decided（成对的第二半）
        session.append(
            "approval/decided",
            mapOf("requestId" to requestId, "outcome" to outcome),
        )

        // 若自开了隐式 turn，闭合它
        if (openedTurn) {
            closeTurn(session, turn)
        }
        return outcome
    }

    /** 确保日志处于 open turn：返回自开的 turn 号（0 = 已有 open turn，调用方不需闭合）。 */
    private fun ensureTurn(session: Session): Int {
        var lastTurn = 0
        for (index in session.events.indices.reversed()) {
            when (session.events[index]) {
                is SessionEvent.TurnStart -> return 0 // 已有 open turn
                is SessionEvent.TurnEnd -> {
                    lastTurn = session.events[index].let { (it as SessionEvent.TurnEnd).turn }
                    break
                }
                else -> {}
            }
        }
        // 无 open turn：自开最小 turn（dsh 建议：审计对必须 turn 包裹——裸事件会被当崩溃尾丢弃）
        val turn = lastTurn + 1
        session.append("turn/start", mapOf("turn" to turn))
        return turn
    }

    private fun closeTurn(session: Session, turn: Int) {
        // reason 必须是 TurnEndReason 对象（Session.append 落盘时强转；传 Map 会 ClassCastException）
        session.append("turn/end", mapOf("turn" to turn, "reason" to com.hermes.dsh.session.TurnEndReason.Interrupted))
    }
}
