package com.hermes.dsh.tools

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * UPG-76 阶段二：预审单扫描编排（PlanApprovalScan）——纯 JVM 机制层测试（变异锚 4 亲杀载体）。
 *
 * 契约（语义对齐方案 v2 钉子 3「机制性只读不是提示词保证」）：
 * - 扫描面收缩：category=="read" && approvalMode=="free" && !only-once 才可见——
 *   写/sensitive/ask 级敏感读/未登记一律不放（fail-closed：宁缺勿放，扫描轮零副作用不顺手读明文）
 * - gradeOf 审批级分级：MONEY（MoneyTools 精确/前缀）→ MONEY；write/sensitive → WRITE；read/未登记 → READ
 * - shouldIssuePlanSheet 出单门槛：审批级（WRITE/MONEY）步骤 ≥2 才出预审单（0/1 走现行弹窗 UPG-75 通道）
 * - 全登记表快照不变量（变异锚 4 亲杀）：对生产 PermissionRegistryData.entries 全量跑扫描过滤，
 *   扫描面成员 100% 为 free/read 且非 only-once；任一过滤层被删除 → 断言必红。
 */
class PlanApprovalScanTest {

    /** 真实登记表子集快照（name → (approvalMode, category)），镜像 PermissionRegistryData 对应项语义。 */
    private val REG: Map<String, Pair<String, String>> = mapOf(
        // free/read 纯只读 —— 应上扫描面
        "account.me" to ("free" to "read"),
        "http.get" to ("free" to "read"),
        "file.read" to ("free" to "read"),
        "vault.list" to ("free" to "read"),
        "device.appList" to ("free" to "read"),
        "search" to ("free" to "read"),
        "md.render" to ("free" to "read"),
        // free/read 高危登记 —— 免弹窗纯只读仍上扫描面（读面不新增明文暴露：正常模式本就免批准可调）
        "vault.peek" to ("free" to "read"),
        // ask 级敏感读 —— 不上扫描面（扫描轮零副作用，不顺手读明文）
        "asset.credPeek" to ("ask" to "read"),
        "asset.peekPhoto" to ("ask" to "read"),
        "vault.get" to ("ask" to "read"), // only-once 双重排除
        // 写类 —— 不上扫描面
        "shell.exec" to ("ask" to "write"),
        "http.post" to ("ask" to "write"),
        "file.write" to ("ask" to "write"),
        "device.timer" to ("ask" to "write"),
        "account.logout" to ("ask" to "write"),
        // free/write（写类被误标 free 的防御用例）—— 依然不上扫描面（锚 4：去掉 read 过滤 → 此工具进面 → 红）
        "credential.setKey" to ("free" to "write"),
        // sensitive/gate —— 不上扫描面
        "payment.pay" to ("gate" to "sensitive"), // MONEY 资金流出
        "sms.read" to ("gate" to "sensitive"),
        "contact.read" to ("gate" to "sensitive"),
    )

    private fun categoryOf(name: String): String? = REG[name]?.second
    private fun approvalModeOf(name: String): String? = REG[name]?.first

    // ==================== 扫描面收缩 ====================

    @Test
    fun `扫描面收缩_只含free纯只读_写敏感ask读与未登记全部排除`() {
        val all = REG.keys.toList()
        val scan = PlanApprovalScan.readOnlyToolNames(all, ::categoryOf, ::approvalModeOf)
        assertTrue("free/read 该入面: account.me", scan.contains("account.me"))
        assertTrue("free/read 该入面: file.read", scan.contains("file.read"))
        assertTrue("free/read 高危登记仍入面（免弹窗纯只读）: vault.peek", scan.contains("vault.peek"))
        // 写类一律不上面
        assertFalse("写类不得上面: shell.exec", scan.contains("shell.exec"))
        assertFalse("free/write 误标防御不得上面: credential.setKey", scan.contains("credential.setKey"))
        // sensitive 不上面
        assertFalse("sensitive 不得上面: payment.pay", scan.contains("payment.pay"))
        assertFalse("sensitive 不得上面: sms.read", scan.contains("sms.read"))
        // ask 级敏感读不上面（扫描轮零副作用）
        assertFalse("ask 敏感读不得上面: asset.credPeek", scan.contains("asset.credPeek"))
        assertFalse("only-once 敏感读不得上面: vault.get", scan.contains("vault.get"))
    }

    @Test
    fun `未登记工具fail_closed不入面`() {
        // UNKNOWN 未登记（不在 REG → 两查找 null）→ 一律不进扫描面（宁缺勿放，同 guard UNKNOWN→ASK 语义）；
        // 已登记 free/read 照常入面（证明排除的是未登记而非名单整体）
        val mixed = listOf("unknown.tool", "account.me", "no.such")
        val scan = PlanApprovalScan.readOnlyToolNames(mixed, ::categoryOf, ::approvalModeOf)
        assertEquals(listOf("account.me"), scan)
    }

    @Test
    fun `onlyonce防registry误标双保险_即使登记谎称free只读也排除`() {
        // 若某 only-once 工具被登记为 free/read（谎报），only-once 层仍把它挡在扫描面外（belt-and-suspenders）
        val lying: Map<String, String> = mapOf(
            "vault.get" to "free",
            "browser.fillForm" to "free",
            "account.me" to "free",
        )
        assertFalse(
            "only-once 即使 registry 谎称 free 也不入面: vault.get",
            PlanApprovalScan.isScanSafe("vault.get", { "read" }, { lying["vault.get"] }),
        )
        assertFalse(
            "only-once 未登记只读名也不入面: browser.fillForm",
            PlanApprovalScan.isScanSafe("browser.fillForm", { "read" }, { lying["browser.fillForm"] }),
        )
        assertTrue(
            "非 only-once free/read 正常入面",
            PlanApprovalScan.isScanSafe("account.me", { "read" }, { lying["account.me"] }),
        )
    }

    // ==================== gradeOf 审批级分级 ====================

    @Test
    fun `gradeOf分级_MONEY最高_write与sensitive为WRITE_read为READ`() {
        // MONEY：精确名单 + payment.* 前缀兜底 → 永不预批
        assertEquals(PlanApprovalScan.Grade.MONEY, PlanApprovalScan.gradeOf("payment.pay", ::categoryOf))
        assertEquals(PlanApprovalScan.Grade.MONEY, PlanApprovalScan.gradeOf("pay", ::categoryOf))
        assertEquals(PlanApprovalScan.Grade.MONEY, PlanApprovalScan.gradeOf("transfer", ::categoryOf))
        assertEquals("payment.* 前缀兜底", PlanApprovalScan.Grade.MONEY, PlanApprovalScan.gradeOf("payment.query", ::categoryOf))
        // 写类 → WRITE（可上单可预批）
        assertEquals(PlanApprovalScan.Grade.WRITE, PlanApprovalScan.gradeOf("shell.exec", ::categoryOf))
        assertEquals(PlanApprovalScan.Grade.WRITE, PlanApprovalScan.gradeOf("http.post", ::categoryOf))
        // sensitive（含读面敏感）→ WRITE（需要审批 ≠ 写语义）
        assertEquals(PlanApprovalScan.Grade.WRITE, PlanApprovalScan.gradeOf("sms.read", ::categoryOf))
        assertEquals(PlanApprovalScan.Grade.WRITE, PlanApprovalScan.gradeOf("contact.read", ::categoryOf))
        // read / 未登记 → READ（不上单只推进度）
        assertEquals(PlanApprovalScan.Grade.READ, PlanApprovalScan.gradeOf("account.me", ::categoryOf))
        assertEquals(PlanApprovalScan.Grade.READ, PlanApprovalScan.gradeOf("http.get", ::categoryOf))
        assertEquals(PlanApprovalScan.Grade.READ, PlanApprovalScan.gradeOf("unknown.tool", { null }))
    }

    // ==================== 出单门槛（≥2 审批级步骤） ====================

    @Test
    fun `出单门槛_审批级步骤大于等于2才出单`() {
        val s = PlanApprovalScan
        // 0/1 步审批级 → 不出单（走现行弹窗 UPG-75 通道，防「事事一张单」）
        assertFalse(s.shouldIssuePlanSheet(listOf("account.me", "http.get"), ::categoryOf))
        assertFalse(s.shouldIssuePlanSheet(listOf("shell.exec"), ::categoryOf))
        assertFalse(s.shouldIssuePlanSheet(listOf("payment.pay"), ::categoryOf)) // 单步 MONEY 实时逐笔
        assertFalse(s.shouldIssuePlanSheet(listOf("unknown.tool"), { null }))
        // ≥2 步审批级（WRITE/MONEY）→ 出预审单
        assertTrue(s.shouldIssuePlanSheet(listOf("shell.exec", "file.write"), ::categoryOf))
        assertTrue(s.shouldIssuePlanSheet(listOf("http.post", "device.timer", "account.me"), ::categoryOf))
        assertTrue("MONEY 计审批级", s.shouldIssuePlanSheet(listOf("shell.exec", "payment.pay"), ::categoryOf))
        // 计数只数审批级，read/未登记只推进度
        assertEquals(2, s.approvalGradeCount(listOf("shell.exec", "http.post", "account.me"), ::categoryOf))
        assertEquals(1, s.approvalGradeCount(listOf("shell.exec", "account.me"), ::categoryOf))
        assertEquals(0, s.approvalGradeCount(listOf("account.me", "unknown.tool"), { null }))
    }

    // ==================== 全登记表快照不变量（变异锚 4 亲杀） ====================

    @Test
    fun `全登记表快照_扫描面成员全部为free纯只读且非onlyonce`() {
        // 对生产数据全量跑扫描过滤（不手工挑样本）——扫描面 schemas/allowedTools 同源收缩的纯 JVM 亲杀载体。
        // 变异锚 4：去掉 category=="read" 过滤层 → free/write（如 credential.setKey）混入扫描面 → 本断言必红。
        val all = PermissionRegistryData.entries.keys
        val scan = PlanApprovalScan.readOnlyToolNames(
            all,
            { PermissionRegistryData.entries[it]?.category },
            { PermissionRegistryData.entries[it]?.approvalMode },
        )
        assertTrue("扫描面非空（大量 free/read 工具应入面）", scan.isNotEmpty())
        for (name in scan) {
            val e = PermissionRegistryData.entries[name]
            assertTrue("扫描面出现登记为 ${e?.approvalMode}/${e?.category} 的工具: $name", e != null)
            assertEquals("扫描面非 free/read: $name", "free", e!!.approvalMode)
            assertEquals("扫描面含写/敏感: $name", "read", e.category)
            assertFalse("扫描面出现 only-once: $name", OnlyOnceTools.isOnlyOnce(name))
        }
        // 代表性反面/正面锚
        assertFalse(scan.contains("shell.exec"))
        assertFalse(scan.contains("payment.pay"))
        assertFalse(scan.contains("asset.credPeek"))
        assertFalse(scan.contains("sms.read"))
        assertTrue(scan.contains("account.me"))
        assertTrue(scan.contains("file.read"))
    }
}
