package com.hermes.dsh.tools

import com.hermes.dsh.brand.SessionId
import com.hermes.dsh.session.Session
import com.hermes.dsh.session.SessionEvent
import com.hermes.dsh.session.SessionHeader
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * UPG-76 预审单执行绑定下沉（request() 内：remembered 豁免之后、FIFO 弹窗之前）。
 *
 * 契约：
 * - 命中（清单内 approved + 未过期 + 次数未耗尽）→ 放行 + 扣减，跳过弹窗（answerer 不被调用）；outcome=allowed-plan
 * - 审计成对：命中路径同样落 approval/asked + approval/decided（outcome=allowed-plan）
 * - 耗尽（同键二次请求）→ 不静默放行，落 FIFO 当场转新 ASK（answerer 弹窗，用户实时决策）
 * - 计划外（未登记）→ 落 FIFO 转新 ASK
 * - only-once / MONEY：即便装配 planStore 也不被清单放行（转 ASK 弹窗）
 * - 未装配 planStore（null）→ 行为与 UPG-75 完全一致（全走 FIFO）
 */
class PlanApprovalBindingTest {

    private fun newSession(id: String = "upg76-binding"): Session {
        val sid = SessionId(id)
        return Session.create(sid, header = SessionHeader(id = sid, createdAt = 1000L))
    }

    private fun decidedOutcomes(session: Session): List<String> =
        session.events.filterIsInstance<SessionEvent.ApprovalDecided>().map { it.outcome }

    // ==================== 命中：放行 + 扣减 + 跳过弹窗 ====================

    @Test
    fun `清单命中放行跳过弹窗且审计成对`() = runBlocking {
        val session = newSession()
        val service = ApprovalService { session }
        val store = PlanApprovalStore()
        service.planStore = store
        // 预审：shell.exec + 该参数 → approved
        val a = linkedMapOf("cmd" to "ls")
        store.createPlan("g1", runId = null, ttlMs = 60_000L)
        store.submitDecision("g1", listOf(PlanApprovalStore.StepAction.Approve("shell.exec", a)))
        var shown = 0
        service.answerer = {
            shown++ // 命中放行不该弹窗
            ApprovalService.Answer.ALLOW_ONCE
        }
        val outcome = service.request("shell.exec", "安全拦截", a)
        assertEquals("预审命中应放行且不弹窗", ApprovalService.OUTCOME_ALLOWED_PLAN, outcome)
        assertEquals("命中放行却弹窗（弹窗本应跳过）", 0, shown)
        assertEquals("审计 asked 未落", 1, session.events.filterIsInstance<SessionEvent.ApprovalAsked>().size)
        assertEquals("审计 decided 未落", listOf(ApprovalService.OUTCOME_ALLOWED_PLAN), decidedOutcomes(session))
        // 扣减实证：清单已消费一次，同键再请求 → 不再预审放行
        val second = service.request("shell.exec", "安全拦截", a)
        assertEquals("耗尽后应转 ASK", ApprovalService.OUTCOME_ALLOWED_ONCE, second)
        assertEquals("耗尽后转 ASK 应弹窗", 1, shown)
    }

    // ==================== 计划外 / 耗尽 → 落 FIFO 转新 ASK ====================

    @Test
    fun `计划外工具请求落FIFO弹窗实时决策`() = runBlocking {
        val session = newSession()
        val service = ApprovalService { session }
        val store = PlanApprovalStore()
        service.planStore = store
        // 预审只批了 device.timer，shell.exec 不在清单
        store.createPlan("g1", runId = null, ttlMs = 60_000L)
        store.submitDecision(
            "g1",
            listOf(PlanApprovalStore.StepAction.Approve("device.timer", linkedMapOf("tag" to "tick"))),
        )
        var shown = mutableListOf<String>()
        service.answerer = { info ->
            synchronized(shown) { shown.add(info.toolName) }
            ApprovalService.Answer.ALLOW_ONCE
        }
        val outcome = service.request("shell.exec", "计划外", linkedMapOf("cmd" to "ls"))
        assertEquals("计划外应转新 ASK 由用户实时决策", ApprovalService.OUTCOME_ALLOWED_ONCE, outcome)
        synchronized(shown) { assertEquals(listOf("shell.exec"), shown.toList()) }
    }

    @Test
    fun `耗尽同键转ASK_与清单外等价_不因已批过而再次放行`() = runBlocking {
        val session = newSession()
        val service = ApprovalService { session }
        val store = PlanApprovalStore()
        service.planStore = store
        val a = linkedMapOf("cmd" to "ls")
        store.createPlan("g1", runId = null, ttlMs = 60_000L)
        store.submitDecision("g1", listOf(PlanApprovalStore.StepAction.Approve("shell.exec", a)))
        var shown = 0
        service.answerer = {
            shown++
            ApprovalService.Answer.ALLOW_ONCE
        }
        // 第一次命中（不弹窗），第二次耗尽 → 转 ASK 弹窗
        assertEquals(ApprovalService.OUTCOME_ALLOWED_PLAN, service.request("shell.exec", "r1", a))
        assertEquals(ApprovalService.OUTCOME_ALLOWED_ONCE, service.request("shell.exec", "r2", a))
        // 第三次（已无授权残留）仍走 FIFO → 用户逐次确认
        assertEquals(ApprovalService.OUTCOME_ALLOWED_ONCE, service.request("shell.exec", "r3", a))
        assertEquals("每次耗尽后都该弹窗一次（不得静默重放）", 2, shown)
    }

    // ==================== only-once / MONEY 红线：装配清单也不放行 ====================

    @Test
    fun `isGranted对onlyonce拒绝plan与turn_outcome`() {
        // UPG-76 变异锚 3：清单/豁免放行 only-once 必拒（vault.get/browser.* 每弹当场确认——UPG-68 红线不破）
        assertFalse(ApprovalService.isGranted("vault.get", ApprovalService.OUTCOME_ALLOWED_PLAN))
        assertFalse(ApprovalService.isGranted("vault.get", ApprovalService.OUTCOME_ALLOWED_TURN))
        assertFalse(ApprovalService.isGranted("vault.get", ApprovalService.OUTCOME_ALLOWED_REMEMBERED))
        // 非 only-once 工具：预审单放行成立
        assertTrue(ApprovalService.isGranted("shell.exec", ApprovalService.OUTCOME_ALLOWED_PLAN))
        assertTrue(ApprovalService.isGranted("shell.exec", ApprovalService.OUTCOME_ALLOWED_ONCE))
    }

    @Test
    fun `onlyonce即使装配planStore也不走清单放行_转ASK弹窗`() = runBlocking {
        val session = newSession()
        val service = ApprovalService { session }
        val store = PlanApprovalStore()
        service.planStore = store
        // 入簿侧拒绝（红线），这里验证即使 store 异常残留也防御
        var shown = 0
        service.answerer = {
            shown++
            ApprovalService.Answer.ALLOW_ONCE
        }
        val outcome = service.request("vault.get", "敏感面", linkedMapOf("key" to "k"))
        assertEquals("only-once 只能 allowed-once 实时逐笔", ApprovalService.OUTCOME_ALLOWED_ONCE, outcome)
        assertEquals(1, shown)
    }

    @Test
    fun `MONEY即使装配planStore也永不预批放行_实时逐笔确认`() = runBlocking {
        val session = newSession()
        val service = ApprovalService { session }
        val store = PlanApprovalStore()
        service.planStore = store
        var shown = 0
        service.answerer = {
            shown++
            ApprovalService.Answer.ALLOW_ONCE
        }
        val outcome = service.request("payment.pay", "资金流出", linkedMapOf("amount" to 100))
        assertEquals("MONEY 永不预批：outcome 不可能 allowed-plan", ApprovalService.OUTCOME_ALLOWED_ONCE, outcome)
        assertEquals("MONEY 必须实时逐笔弹窗", 1, shown)
        // 审计应无 allowed-plan 痕迹
        assertTrue(decidedOutcomes(session).none { it == ApprovalService.OUTCOME_ALLOWED_PLAN })
    }

    // ==================== 单上已决否（DENIED）/ planner 钩子两径 ====================

    @Test
    fun `单上被拒步骤执行期返回rejected且不重复弹窗`() = runBlocking {
        val session = newSession()
        val service = ApprovalService { session }
        val store = PlanApprovalStore()
        service.planStore = store
        val a = linkedMapOf("cmd" to "ls")
        // 计划补全轮出单后用户在单上否掉 shell.exec（该步不执行）→ 执行期同调用 = 已决否
        store.createPlan("g1", runId = null, ttlMs = 60_000L)
        store.submitDecision("g1", listOf(PlanApprovalStore.StepAction.Reject("shell.exec", a)))
        var shown = 0
        service.answerer = {
            shown++ // 单上已决否 → 不该再弹窗打扰（「阻断下游」语义）
            ApprovalService.Answer.ALLOW_ONCE
        }
        val outcome = service.request("shell.exec", "预审已否", a)
        assertEquals("单上被拒应直接 rejected（不重复询问）", ApprovalService.OUTCOME_REJECTED, outcome)
        assertEquals("已决否却再弹窗（应阻断下游不打扰）", 0, shown)
        // 审计 decided=rejected（被拒语义清晰，非 allowed-plan 痕迹）
        assertEquals(listOf(ApprovalService.OUTCOME_REJECTED), decidedOutcomes(session))
    }

    @Test
    fun `planner钩子出单且本步获批_经清单放行不弹窗`() = runBlocking {
        val session = newSession()
        val service = ApprovalService { session }
        val store = PlanApprovalStore()
        service.planStore = store
        val a = linkedMapOf("cmd" to "ls")
        // 宿主 planner：首个审批级 ASK → 计划补全轮 → ≥2 出单（本步列进单并获批——模拟用户勾选本步）
        service.preApprovalPlanner = { info ->
            store.createPlan("g1", runId = null, ttlMs = 60_000L)
            store.submitDecision("g1", listOf(PlanApprovalStore.StepAction.Approve(info.toolName, info.args)))
        }
        var shown = 0
        service.answerer = {
            shown++
            ApprovalService.Answer.ALLOW_ONCE
        }
        val outcome = service.request("shell.exec", "办事请求", a)
        assertEquals("planner 出单并获批 → allowed-plan", ApprovalService.OUTCOME_ALLOWED_PLAN, outcome)
        assertEquals("出单获批步骤不应走 FIFO 弹窗", 0, shown)
    }

    @Test
    fun `planner未出单_本步回退现行FIFO单步弹窗`() = runBlocking {
        val session = newSession()
        val service = ApprovalService { session }
        val store = PlanApprovalStore()
        service.planStore = store
        val a = linkedMapOf("cmd" to "ls")
        // 宿主 planner：计划补全轮判恰好 1 个审批级 / 未达门槛 → 不出单 → 本步照 UPG-75 单步弹窗
        service.preApprovalPlanner = {}
        var shown = 0
        service.answerer = {
            shown++
            ApprovalService.Answer.ALLOW_ONCE
        }
        val outcome = service.request("shell.exec", "单步", a)
        assertEquals("未出单应回退现行弹窗", ApprovalService.OUTCOME_ALLOWED_ONCE, outcome)
        assertEquals("未出单应走 FIFO 弹窗一次", 1, shown)
    }

    @Test
    fun `planner不作用于onlyonce与MONEY_实时逐笔弹窗`() = runBlocking {
        val session = newSession()
        val service = ApprovalService { session }
        val store = PlanApprovalStore()
        service.planStore = store
        var planned = 0
        // 若 planner 被误触发（只读面本不该出现 only-once/MONEY），此处计数防御
        service.preApprovalPlanner = {
            planned++
        }
        var shown = 0
        service.answerer = {
            shown++
            ApprovalService.Answer.ALLOW_ONCE
        }
        assertEquals(ApprovalService.OUTCOME_ALLOWED_ONCE, service.request("vault.get", "敏感", linkedMapOf("key" to "k")))
        assertEquals(ApprovalService.OUTCOME_ALLOWED_ONCE, service.request("payment.pay", "资金", linkedMapOf("amount" to 100)))
        assertEquals("only-once/MONEY 永不经 planner", 0, planned)
        assertEquals("都应实时逐笔弹窗", 2, shown)
    }

    // ==================== 未装配（null）：行为与 UPG-75 一致 ====================

    @Test
    fun `planStore未装配时全走FIFO弹窗_无预审放行`() = runBlocking {
        val session = newSession()
        val service = ApprovalService { session }
        // planStore 默认 null（UPG-75 存量行为）
        var shown = 0
        service.answerer = {
            shown++
            ApprovalService.Answer.ALLOW_ONCE
        }
        val outcome = service.request("shell.exec", "r", linkedMapOf("cmd" to "ls"))
        assertEquals(ApprovalService.OUTCOME_ALLOWED_ONCE, outcome)
        assertEquals(1, shown)
        assertTrue(decidedOutcomes(session).none { it == ApprovalService.OUTCOME_ALLOWED_PLAN })
    }
}
