package com.hermes.dsh.tools

/**
 * UPG-76：资金面（MONEY）工具判定——永不预批/永不进批准清单/执行到该步实时逐笔确认（红线段）。
 *
 * 判定源 = toolName 前缀/精确名单（注册表现仅 payment.pay，登记纪律同 OnlyOnceTools）：
 * 新增资金流出类 handler 时同步登记本表；read 型支付查询（pay.query 等——非资金流出）不判 MONEY。
 * 判定口径只紧不松：无法识别但疑似资金面（payment.* 前缀兜底）按 MONEY 拦——宁多拦不直出。
 */
object MoneyTools {

    /** 资金流出执行面精确名单（新增登记纪律见头注）。 */
    val TOOLS = setOf(
        "payment.pay",
        "pay",
        "transfer",
    )

    /** payment.* 前缀兜底（未来新增支付 handler 天然入 MONEY 面，无需等登记）。 */
    private val PREFIXES = listOf("payment.")

    fun isMoney(toolName: String): Boolean {
        val n = toolName.replace('_', '.')
        return TOOLS.contains(n) || PREFIXES.any { n.startsWith(it) }
    }
}
