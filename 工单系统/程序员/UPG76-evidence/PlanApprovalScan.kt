package com.hermes.dsh.tools

/**
 * UPG-76 阶段二：预审单扫描编排（纯 JVM 机制件——schemas/allowedTools 同源收缩与出单门槛，
 * 变异锚 4 亲杀载体：扫描期 READ-only 工具面 + ≥2 审批级才出单）。
 *
 * 语义对齐方案 v2 钉子 3「机制性只读不是提示词保证」：
 *  - [readOnlyToolNames]：扫描期工具面 = 只读。写/敏感/支付工具在扫描期对 LLM 不可见（schemas）
 *    也不可执行（allowedTools 同集合）——fail-closed：未登记工具（categoryOf 返回 null）视为未知，
 *    一律不放进扫描面（UNKNOWN→ASK 语义同 guard，宁缺勿放）。
 *  - 只读判定 = category=="read" 且 approvalMode=="free"（免弹窗的纯只读；ask 级敏感读
 *    asset.credPeek/vault.peek 系不上扫描面——扫描轮零副作用，不顺手读明文）。
 *  - [gradeOf] 审批级分级：MONEY（MoneyTools 精确/前缀）→ MONEY；写/敏感（category
 *    write/sensitive）→ WRITE；read/free → READ。未登记 → READ（扫描面反正不含）。
 *  - [shouldIssuePlanSheet] 出单门槛：审批级（WRITE/MONEY）步骤 ≥2 才出预审单；
 *    0/1 步走现行弹窗（UPG-75 通道）——防「事事一张单」比碎片弹窗更难用。
 *
 * 本对象只承载机制面判定，不做 UI / 不入簿（入簿 = PlanApprovalStore.submitDecision）。
 * MainActivity 单点过滤处（rebuildAgentTools）只调用 [readOnlyToolNames]，禁止私设第二份判定。
 */
object PlanApprovalScan {

    enum class Grade { READ, WRITE, MONEY }

    /** 扫描面收缩谓词（MainActivity:7797-7823 单点过滤的数据源——schemas 与 allowedTools 同源）。 */
    fun isScanSafe(name: String, categoryOf: (String) -> String?, approvalModeOf: (String) -> String?): Boolean {
        if (OnlyOnceTools.isOnlyOnce(name)) return false // 明文敏感面：扫描期也不可见
        return categoryOf(name) == "read" && approvalModeOf(name) == "free"
    }

    /** 扫描期工具名集合（调用方只此一处；变异锚 4：删除本过滤 → 扫描面 schemas/allowedTools 双面无写类断言红）。 */
    fun readOnlyToolNames(
        all: Collection<String>,
        categoryOf: (String) -> String?,
        approvalModeOf: (String) -> String?,
    ): List<String> = all.filter { isScanSafe(it, categoryOf, approvalModeOf) }

    /**
     * 审批级分级（单步骤出单判定用）：
     *  - MONEY（MoneyTools 判定，payment.pay 等）→ MONEY——永不预批，执行到该步实时逐笔确认；
     *  - category write/sensitive（含 gate 敏感）→ WRITE——可上单、可预批；
     *  - 其余（read / 未登记）→ READ——不上单只推进度。
     */
    fun gradeOf(name: String, categoryOf: (String) -> String?): Grade {
        if (MoneyTools.isMoney(name)) return Grade.MONEY
        return when (categoryOf(name)) {
            "write", "sensitive" -> Grade.WRITE
            else -> Grade.READ
        }
    }

    /** 出单门槛：审批级（WRITE/MONEY）步骤数 ≥2 才出预审单（0/1 走现行弹窗）。 */
    fun approvalGradeCount(steps: List<String>, categoryOf: (String) -> String?): Int =
        steps.count { gradeOf(it, categoryOf) != Grade.READ }

    fun shouldIssuePlanSheet(steps: List<String>, categoryOf: (String) -> String?): Boolean =
        approvalGradeCount(steps, categoryOf) >= 2
}
