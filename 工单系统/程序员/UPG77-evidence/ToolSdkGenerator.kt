package com.mov.android

import com.hermes.dsh.tools.ToolSchemaLike
import com.hermes.dsh.budget.ContextBudget
import kotlin.math.ceil

/**
 * UPG-27：Code Mode SDK 提示节 + tool.help 文档 **同源生成器**（纯函数，JVM 可测）。
 *
 * 红线 6：SDK 节与 tool.help 文档同源生成（数据源 = 登记层单源 ToolSchemaLike 投影），
 * 禁手写/硬编码任何工具文档；「可直呼面」声明文本由 codeTools 集合生成
 * （同谓词纪律 dsh index.ts:859-861：prompt 声明面 = rebuildAgentTools 执行拦截面，同源 codeTools）。
 * 红线 2：权限标注一律经 permissionTier 单源访问器取 tier 字符串，名单本体不进 AI 面。
 * 红线 7：Token 上限一律 tokens 口径（estimateTokens 加权，UPG-07 批 1）；summary 源超限 fail-loud 不静默截断。
 */
object ToolSdkGenerator {

    /** 目录层短描述 token 上限（summary 源超限 fail-loud；过渡口径=description 截断+标注，见 [shortDescription]）。 */
    const val SUMMARY_TOKEN_LIMIT = 18
    /** tool.help 单次返回上限（tokens；超长摘要先行=输出预算内裁剪的定义行为）。 */
    const val TOOL_HELP_TOKEN_LIMIT = 1500
    /** 目录层 token 预算（目标 ≤3K）。 */
    const val DIRECTORY_TOKEN_BUDGET = 3000

    /** SDK 节产物：text=注入文本；version=成员+指纹派生；members=目录层成员（版本元数据入配置态用）。 */
    data class SdkSection(val text: String, val version: String, val members: List<String>, val tokens: Int)

    private fun tokens(s: String): Int = ContextBudget.estimateTokens(s)

    /**
     * 目录层短描述（过渡口径）：summary 覆盖源（登记层批 3 落地后经 [summaryOverride] 接入）超限 fail-loud；
     * 无覆盖源 = description 首句截断 + 「（描述待补全）」逐条标注（定义行为，非静默截断）；
     * 模板串回落（未登记）→ 「（无描述，待登记）」。
     */
    fun shortDescription(name: String, entry: ToolSchemaLike?, summaryOverride: Map<String, String> = emptyMap()): String {
        summaryOverride[name]?.let { s ->
            if (tokens(s) > SUMMARY_TOKEN_LIMIT) {
                throw IllegalArgumentException(
                    "summary 超限 fail-loud: $name = ${tokens(s)} tokens > $SUMMARY_TOKEN_LIMIT（红线 7：不静默截断）",
                )
            }
            return s
        }
        val raw = entry?.description ?: ""
        if (raw.isBlank() || raw == "MOV 工具: $name") return "（无描述，待登记）"
        // 过渡口径：取首句（分号/句号/括号前截断），超预算再加省略号+标注
        val first = raw.split('；', '。', '（').first().trim()
        return if (tokens(first) <= SUMMARY_TOKEN_LIMIT) first else {
            var cut = first
            while (cut.isNotEmpty() && tokens(cut) > SUMMARY_TOKEN_LIMIT) cut = cut.dropLast(1)
            cut.trimEnd() + "…（描述待补全）"
        }
    }

    /**
     * 命名空间感知近邻（tool.help TOOL_NOT_FOUND 与调度器真未知分支共用口径）：
     * ① 段匹配优先（file./browser./obsidian. 等前缀段一致者）→ ② 段内编辑距离升序 → ③ 全局编辑距离；≤[limit] 条。
     */
    fun nearSuggestions(name: String, known: Collection<String>, limit: Int = 3): List<String> {
        if (name.isBlank() || known.isEmpty()) return emptyList()
        val seg = name.substringBefore('.').lowercase()
        fun ed(a: String, b: String): Int {
            val dp = Array(a.length + 1) { i -> IntArray(b.length + 1) { j -> if (i == 0) j else if (j == 0) i else 0 } }
            for (i in 1..a.length) for (j in 1..b.length) {
                dp[i][j] = if (a[i - 1] == b[j - 1]) dp[i - 1][j - 1]
                else 1 + minOf(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
            }
            return dp[a.length][b.length]
        }
        val scored = known.map { k ->
            val kSeg = k.substringBefore('.').lowercase()
            val dist = ed(name.lowercase(), k.lowercase())
            // 排序键：段不匹配 +1000（保底）；段匹配按编辑距离；加微小长度差 tie-break
            (if (kSeg != seg) 1000 else 0) + dist * 10 + kotlin.math.abs(k.length - name.length)
        }
        return known.zip(scored).filter { it.first != name }.sortedBy { it.second }
            .take(limit).map { it.first }
    }

    /**
     * tool.help 文档（件 2；与 buildSdkSection 同数据源同渲染语义——红线 6 同源）。
     * 入参契约（handler 层校验后传入）：names 非空精确名列表。
     * 返回：ok=true + docs[]（每项 name/description/parameters/output/permissionTier）
     *      或 ok=false + code=TOOL_NOT_FOUND + nearSuggestions[] / code=INVALID_ARGS + message。
     * 超长摘要先行：单名文档超 TOOL_HELP_TOKEN_LIMIT → 裁 parameters 字段说明段 + truncated 标注（输出预算内裁剪）。
     */
    fun toolHelpDoc(
        names: List<String>,
        registry: Map<String, ToolSchemaLike>,
        tierOf: (String) -> String,
    ): Map<String, Any?> {
        if (names.isEmpty() || names.any { it.isBlank() }) {
            return mapOf(
                "ok" to false, "code" to "INVALID_ARGS",
                "error" to "name/names 不能为空（传精确工具名，如 file.read；多个用 names 数组）",
                "hint" to "字段不符：name（单个工具名）/names（批量精确名数组）二选一；用 tool.help 查不到自身——工具名清单见 SDK 目录层",
            )
        }
        val missing = names.filter { registry[it] == null }
        if (missing.isNotEmpty()) {
            return mapOf(
                "ok" to false, "code" to "TOOL_NOT_FOUND",
                "error" to "未知工具: " + missing.joinToString(","),
                "nearSuggestions" to missing.flatMap { nearSuggestions(it, registry.keys) }.distinct(),
                "hint" to "未命中报最接近候选；不要臆造工具名，用候选名重试或从目录层核对",
            )
        }
        var truncated = false
        val docs = names.map { n ->
            val e = registry[n]!!
            var doc = mapOf(
                "name" to n,
                "description" to e.description,
                "parameters" to e.parameters,
                "output" to outputHint(e),
                "permissionTier" to tierOf(n),
            )
            if (names.size == 1 && tokens(jsonLike(doc)) > TOOL_HELP_TOKEN_LIMIT) {
                truncated = true
                doc = mapOf(
                    "name" to n,
                    "description" to e.description,
                    "parameters" to paramsBrief(e),
                    "output" to outputHint(e),
                    "permissionTier" to tierOf(n),
                    "truncated" to true,
                    "hint" to "文档超 ${TOOL_HELP_TOKEN_LIMIT} tokens 已摘要先行（字段说明压缩）；可按字段级再查",
                )
            }
            doc
        }
        val out = linkedMapOf<String, Any?>("ok" to true, "docs" to docs)
        if (truncated) out["truncated"] = true
        return out
    }

    /**
     * output 声明（UPG-27 R1 诚实化）：**恒「待登记」标注**——output 结构化声明批 3 清偿在途（批 1 实测 22/22 缺），
     * 禁用输入参数键冒充顶层返回键（0efda79 曾用 properties 键编造「顶层返回键含: path」，验收 P2 打回）。
     * ToolDefinition.output（Builtin/Scene 实物）为 render 投影、schema=null，无结构化顶层键可声明。
     */
    private fun outputHint(e: ToolSchemaLike): String = "（output 声明待登记——批 3 清偿在途）"

    /** 字段说明压缩（超长摘要先行用）：仅字段名+类型，丢 description。 */
    private fun paramsBrief(e: ToolSchemaLike): Map<String, Any?> {
        val props = (e.parameters["properties"] as? Map<*, *>) ?: emptyMap<Any?, Any?>()
        val brief = props.entries.associate { (k, v) ->
            val t = (v as? Map<*, *>)?.get("type") ?: "string"
            k to mapOf("type" to t)
        }
        return mapOf("type" to "object", "properties" to brief, "required" to (e.parameters["required"] ?: emptyList<String>()))
    }

    private fun jsonLike(m: Map<String, Any?>): String = m.entries.joinToString(",") { (k, v) -> "$k=$v" }

    /** 签名行：name(p: type, …) [required: …]（登记层 parameters 派生；无参 → name()）。 */
    fun signatureOf(e: ToolSchemaLike): String {
        val props = e.parameters["properties"] as? Map<*, *> ?: return e.name + "()"
        val required = (e.parameters["required"] as? List<*>)?.map { it.toString() } ?: emptyList()
        val ps = props.entries.joinToString(", ") { (k, v) ->
            val t = (v as? Map<*, *>)?.get("type") ?: "any"
            "$k: $t" + (if (k in required) "" else "?")
        }
        return e.name + "(" + ps + ")"
    }

    /**
     * 件 1：code 模式 SDK 提示节（目录层 + 常用集签名层 + 调用范式全路径判例 + 双门如实 + 三分声明）。
     * 声明文本由 [directTools]（codeTools）集合生成——改 codeTools 声明自动同步（同谓词：执行拦截同源此集合）。
     * 确定性生成：同输入同输出 → 会话内每轮文本一致（版本冻结语义，请求前缀恒定）。
     */
    fun buildSdkSection(
        registry: Map<String, ToolSchemaLike>,
        faceTools: List<String>,
        directTools: Collection<String>,
        frequent: List<String>,
        tierOf: (String) -> String,
        modelId: String,
        modelLabel: String,
        approvalMode: String,
    ): SdkSection {
        val members = faceTools.sorted()
        val direct = directTools.sorted()
        val sb = StringBuilder()

        // ① 直呼声明（由 codeTools 生成，禁模板手写；先于工具指引——dsh COLLAPSE_SECTION_ORDER）
        sb.append("【Code 模式工具面】\n")
        sb.append("可直呼工具（直接作为工具调用）：").append(direct.joinToString(", ")).append("。\n")
        sb.append("除上述直呼工具外，目录列表中的其他工具**不可直呼**——它们是可经 shell.exec 间接调用的工具，不是可直呼面。\n\n")

        // ② 目录层（全量在面工具 name+短描述；≤3K tokens 预算内逐条渲染）
        sb.append("【工具目录】（").append(members.size).append(" 个，均可经 shell.exec 间接调用）\n")
        var dirTokens = 0
        for (n in members) {
            val line = "- " + n + "：" + shortDescription(n, registry[n]) + "（权限：" + tierOf(n) + "）\n"
            dirTokens += tokens(line)
            sb.append(line)
        }
        sb.append("（目录层 ").append(dirTokens).append(" tokens / 预算 ").append(DIRECTORY_TOKEN_BUDGET).append("）\n\n")

        // ③ 签名层（常用集 ∩ 在面；冷启动常用集可空——诚实声明待频次积累）
        val sigMembers = frequent.filter { it in members }.ifEmpty { emptyList() }
        sb.append("【常用集签名】\n")
        if (sigMembers.isEmpty()) {
            sb.append("（暂无频次数据——可用 tool.help 查任意工具的完整签名与字段说明）\n")
        } else {
            for (n in sigMembers) {
                val e = registry[n] ?: continue
                sb.append("- ").append(signatureOf(e)).append("（权限：").append(tierOf(n)).append("）\n")
            }
        }
        sb.append("\n")

        // ④ 调用范式 + 全路径判例（读类无害工具示例，无副作用可复现；token=运行时注入变量占位）
        sb.append("【调用范式】shell.exec 经本机 MCP 面（127.0.0.1:8389，JSON-RPC tools/call）间接调用目录内任意工具。\n")
        sb.append("判例（完整可复制；token 为运行时注入变量，勿硬编码）：\n")
        sb.append("  shell.exec command='curl -s -X POST http://127.0.0.1:8389/ -H \"Authorization: Bearer \$MOV_MCP_TOKEN\" -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"file.read\",\"arguments\":{\"path\":\"notes/todo.md\"}}}'\n")
        sb.append("转义口径：command 值用单引号包裹（内层 JSON 双引号无需转义）；JSON 字符串值本身含单引号时写作 '\\''（例：path 值含单引号 → '…\\''…'）；中文直接写无需转义。\n\n")

        // ⑤ 权限双门（如实，不粉饰；approvalMode 由宿主 permissionGuard 当前态传入）
        sb.append("【权限双门（如实）】外层 shell.exec 每次调用都会弹窗确认（任意代码执行恒 ASK，不受审批策略影响）；内层工具按权限级再过一道门：标 ask 的工具经本机 MCP 面调用时进入 App 内实时审批——前台弹窗/后台通知确认，调用同步等待用户决策（至多 60s，超时 fail-closed 拒绝，不产生待批清单外条目）；标 harmless 的读类免批直出。only-once 工具（vault.get/browser.click 等明文敏感面）任何模式（含 open 全权）下都需当次确认、不吃豁免。当前审批策略：").append(approvalMode).append("。SDK 不提供也不描述任何绕过双门的方式。\n")
        sb.append("当前模型：").append(modelId).append("（").append(modelLabel).append("）。\n\n")

        // ⑥ 错误三分与自纠（声明层；执行层由调度器 knownTools 同口径实现）
        sb.append("【错误三分与自纠】\n")
        sb.append("1) 已塌缩（TOOL_COLLAPSED）：调用了存在但不在当前模式直呼面的工具 → 它不在直呼面但大概率在目录里，改走 shell.exec 间接调用（目录即清单），或 tool.help 查其文档确认参数。\n")
        sb.append("2) 真未知（TOOL_NOT_FOUND）：工具不存在 → 会附 nearSuggestions 近邻候选，用候选名经 tool.help 核对后再调；不要臆造工具名。\n")
        sb.append("3) INVALID_ARGS：参数不符 → 会指出问题字段，用 tool.help 查该工具字段说明后修正重试；长尾工具凭目录名猜参数是此类错误主因，先查再调。\n")

        val text = sb.toString()
        val version = sdkVersion(members, sigMembers, registry)
        return SdkSection(text = text, version = version, members = members, tokens = tokens(text))
    }

    /** SDK 版本派生（成员名单+常用集+登记层指纹的 hash 前 8 位；版本元数据由宿主入配置态，文本零落盘）。 */
    fun sdkVersion(members: List<String>, frequent: List<String>, registry: Map<String, ToolSchemaLike>): String {
        val fp = registry.entries.sortedBy { it.key }.joinToString("|") { (k, v) -> k + ":" + v.description.length + ":" + (v.parameters["properties"] as? Map<*, *>)?.size }
        val payload = members.joinToString(",") + "#" + frequent.sorted().joinToString(",") + "#" + fp
        val dig = java.security.MessageDigest.getInstance("SHA-256").digest(payload.toByteArray(Charsets.UTF_8))
        return "sdk-" + dig.take(4).joinToString("") { "%02x".format(it) }
    }
}
