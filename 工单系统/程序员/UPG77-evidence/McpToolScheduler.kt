package com.hermes.dsh.tools

import com.hermes.dsh.llm.ContentBlock
import com.hermes.dsh.llm.formatToolError

/**
 * PermissionGuard —— 权限门核心（决策 E4）。
 *
 * 挂在工具执行前：guard(toolName, args, mode) → allow / deny / ask。
 *
 * 三条铁律：
 * 1. 模式切换只归用户 UI——agent 不可自切（setMode 由外部显式调用）
 * 2. 默认 strict
 * 3. 系统底线护栏：读凭据/卸应用/改安全设置——任何模式永远 deny
 */
class PermissionGuard {

    /** 权限模式（对齐成熟 agent：默认权限 / 允许完全访问）。 */
    enum class Mode { DEFAULT_PERMISSION, FULL_ACCESS }

    enum class Decision { ALLOW, DENY, ASK }

    data class GuardResult(
        val decision: Decision,
        val reason: String? = null,
    )

    @Volatile
    var currentMode: Mode = Mode.DEFAULT_PERMISSION
        private set

    /**
     * goal 模式开关（2026-08-25 用户拍板）：关 = 每步写操作都弹窗确认——
     * 无害级（三级分诊自动放行）失效，所有写类走 ASK。红线段（deny/sensitive）不受影响。
     */
    @Volatile
    var harmlessAutoAllow: Boolean = true

    /** 切换模式（只由 UI/外部显式调用——agent 不可自切）。 */
    fun setMode(mode: Mode): Boolean {
        currentMode = mode
        return true
    }

    /** 单源查询（V68-5）：PermissionGuard 不维护代码内名单，改读生成数据 PermissionRegistryData.entries（唯一事实源=docs/ApprovalRegistry.json）。 */
    private fun entry(name: String): PermissionRegistryData.Entry? =
        PermissionRegistryData.entries[name]

    /** 系统底线护栏：category == system_baseline，任何模式永远 deny。 */
    private fun isSystemBaseline(name: String): Boolean =
        entry(name)?.category == "system_baseline"

    /**
     * MOV 公共工作区路径判定（file.write 无害级前置）：
     * 相对路径（或 /sdcard/Download/MOV/、/sdcard/MOV/ 公共前缀）→ 工作区内；
     * 绝对路径（非公共前缀）、`..` 越界、反斜杠 → 越界（实质级 ask）。
     */
    private fun isMovWorkspacePath(path: String?): Boolean {
        val raw = (path ?: "").trim()
        if (raw.isEmpty()) return false
        if (raw.contains("\\")) return false
        if (!raw.startsWith("/")) {
            // 相对路径：handler 按 MOV 公共目录相对解析 → 工作区内（仍拦 .. 越界）
            if (raw.startsWith("../") || raw.contains("/../")) return false
            return true
        }
        // 绝对路径：仅允许 MOV 公共前缀（旧 /sdcard/MOV/ 与新 /sdcard/Download/MOV/）
        var rel = raw.trimStart('/')
        rel = rel.removePrefix("sdcard/Download/MOV/").removePrefix("sdcard/MOV/")
        if (rel == raw.trimStart('/')) return false // 其它绝对路径 → 越界
        if (rel.isBlank() || rel.startsWith("../") || rel.contains("/../")) return false
        return true
    }

    /**
     * 无害级判定：注册表 harmless 标记（human-authored：可恢复/无外部成本的写类软放行）
     * 且 goal 模式开启才软放行；file.write 追加工作区路径校验 + private 凭据写除外
     * （UPG-28：obsidian.file.write 无 harmless 标记 → 任意路径形态全 ASK，不误捕）。
     */
    private fun isHarmless(name: String, args: Map<String, Any?>): Boolean {
        if (!harmlessAutoAllow) return false
        val e = entry(name) ?: return false
        if (!e.harmless) return false
        if (name == "file.write") {
            if ((args["private"] as? Boolean) == true) return false // 凭据写 → 实质级
            return isMovWorkspacePath(args["path"] as? String)
        }
        return true
    }

    /**
     * UPG-23：权限级单源访问器（只读）——同 guard 判定顺序，返回 "free"|"ask"|"gate"。
     * 名单内容单一来源=PermissionRegistryData.entries（前端只消费 tier 字符串，不消费工具名清单）。
     * 未登记工具 → "ask"（V68-1 UNKNOWN→ASK fail-closed）。
     * 注意：file.write 的 harmless 特判依赖 args（private/工作区路径）——tier 无 args 时保守回 ask。
     */
    fun permissionTier(tool: String): String = when {
        isSystemBaseline(tool) -> "gate"
        entry(tool)?.approvalMode == "gate" -> "gate"
        isHarmless(tool, emptyMap()) -> "free"
        entry(tool)?.approvalMode == "ask" -> "ask"
        entry(tool) == null -> "ask"
        else -> "free"
    }

    /**
     * UPG-53 场景2 锚辅助：需要大白话确认文案的工具名全集（ask/gate 级，含防御名单）。
     * 铁律不变——**权限判定以注册表为唯一事实源**，此方法只返回只读名字集供
     * UI 文案覆盖断言（ApprovalHumanTextTest），不构成第二判定源、不供权限分支使用。
     */
    fun toolsRequiringConfirmation(): Set<String> =
        PermissionRegistryData.entries.filter { it.value.approvalMode != "free" }.keys

    /**
     * 高危子集：即使 open 模式也 ASK（大神安全项：open 全放行不能覆盖任意代码执行/凭据路径写）。
     * - shell.exec：任意代码执行
     * - 参数含 credentials/ 或 secrets/ 路径的写：凭据泄露
     */
    private fun isHighRisk(name: String, args: Map<String, Any?>): Boolean {
        if (name.contains("shell.exec")) return true
        val path = args["path"] as? String ?: ""
        val url = args["url"] as? String ?: ""
        return path.contains("credentials") || path.contains("secrets")
            || url.contains("credentials") || url.contains("secrets")
    }


    /**
     * 工具执行前检查。
     * @return ALLOW 放行 / DENY 拦截（附原因）/ ASK 需人工确认。
     */
    fun guard(toolName: String, args: Map<String, Any?>): GuardResult {
        val name = toolName
        // 铁律 3：系统底线——任何模式永远 deny
        if (isSystemBaseline(name)) {
            return GuardResult(Decision.DENY, "系统底线护栏：$name 任何模式不可执行")
        }
        return when (currentMode) {
            // 默认权限：只读放行，写类请求允许，敏感拦截，未登记 fail-closed ASK（V68-1）
            Mode.DEFAULT_PERMISSION -> {
                val e = entry(name)
                when {
                    e == null -> GuardResult(Decision.ASK, "默认权限：$name 未登记，请求允许")
                    e.approvalMode == "gate" -> GuardResult(Decision.DENY, "默认权限：敏感工具 $name 已拦截")
                    isHarmless(name, args) -> {
                        // B 方案三级分诊：无害级（可恢复/无外部成本）自动放行——弹窗减量拆弹
                        GuardResult(Decision.ALLOW, "无害级自动放行：$name")
                    }
                    e.approvalMode == "ask" -> GuardResult(Decision.ASK, "默认权限：$name 超出安全范围，请求允许")
                    else -> GuardResult(Decision.ALLOW)
                }
            }
            // 允许完全访问：登记工具放行（除底线 + 高危子集）；未登记 fail-closed ASK（V68-8①）
            Mode.FULL_ACCESS -> {
                if (isHighRisk(name, args)) {
                    GuardResult(Decision.ASK, "高危操作（open 模式也需确认）：$name")
                } else if (entry(name) == null) {
                    // V68-8 ①：open/FULL_ACCESS 下未登记（UNKNOWN）仍 ASK——AI 自切模式不能绕过登记闸（W2 洞完整版）
                    GuardResult(Decision.ASK, "open 模式：$name 未登记，请求允许")
                } else {
                    GuardResult(Decision.ALLOW)
                }
            }
        }
    }

    /**
     * UPG-77 A1：统一审批判定入口（单源化——对话面 dispatch 与 MCP 面 tools/call 共用，消除双写）。
     * guard() 结果之上叠加 only-once 强制 ASK 覆写：任何模式下 only-once 工具
     * （vault.get/browser.* 明文敏感面）即便被 ALLOW 也升级为 ASK——每弹当场确认，不随 open/无害豁免直出明文。
     * DENY 优先（系统底线护栏任何模式生效）。only-once 覆写只紧不松：若未来某 only-once 工具被登记为
     * harmless/free，此处仍保证不直出（变异锚：删除覆写 → FULL_ACCESS only-once→ASK 断言红）。
     */
    fun decide(toolName: String, args: Map<String, Any?>): GuardResult {
        val g = guard(toolName, args)
        if (g.decision == Decision.DENY) return g
        if (OnlyOnceTools.isOnlyOnce(toolName) && g.decision == Decision.ALLOW) {
            return GuardResult(Decision.ASK, "仅当次确认：$toolName（明文敏感面不随 open 豁免）")
        }
        return g
    }
}

/**
 * McpToolScheduler —— agent 工具调度器（含权限门）。
 * 执行前过 PermissionGuard（铁律 3 系统底线护栏强制生效）。
 */
class McpToolScheduler(
    private val handlers: Map<String, (Map<String, Any?>) -> Any?>,
    private val guard: PermissionGuard = PermissionGuard(),
    /** D4 审批服务（可空：未装配 = ASK 一律 fail-closed 拒绝）。 */
    private val approvalService: ApprovalService? = null,
) : ToolRuntimeScheduler {

    override suspend fun prepare(exec: ToolExecutionInput): ScheduledToolPreparation {
        return ScheduledToolPreparation.Dispatch(MockToolRunContext(exec))
    }

    /** 仅 UI 操作的工具（AI 不可调——铁律 1：AI 不能自切权限/自批自己）。名单统一点实名存储，与比较侧同名规范化。
     *  vault.peek 系：页面本地免审批明文/缩略图出口，AI 读取个人信息明文只能走 vault.get（审批门控）。
     *  UPG-68 验收 MEDIUM-2：补齐 asset.credPeek/asset.peekPhoto/vault.credPeek/vault.peekPhoto——
     *  明文/影像出口收编硬拒名单（纵深：宿主 allowedTools 未注入=null 时 AI 直调也在此被拒，非单点依赖宿主）。 */
    private val uiOnlyTools = setOf(
        "permission.set_mode", "permission.approve", "permission.deny", "presentation.set_mode",
        "vault.peek", "vault.peekPhoto", "vault.credPeek",
        "asset.credPeek", "asset.peekPhoto",
    ).map { it.replace('_', '.') }

    /** E3：当前工具面白名单（由装配方按呈现模式注入；null=不校验=全量）。不在白名单的工具 → TOOL_NOT_FOUND 塌缩。 */
    var allowedTools: Set<String>? = null

    /** UPG-27：宿主工具全集（可选注入；塌缩分支三分语义——已塌缩[全集有、白名单无] vs 真未知[全集无]）。null=不区分（维持原语义）。 */
    var knownTools: Set<String>? = null

    /** UPG-27：真未知分支的近邻提示（命名空间感知：段匹配优先→编辑距离；dsh 层自包含不依赖宿主生成器）。 */
    private fun nearHint(name: String, known: Set<String>?): String {
        val pool = known ?: return ""
        if (pool.isEmpty()) return ""
        fun ed(a: String, b: String): Int {
            val dp = Array(a.length + 1) { i -> IntArray(b.length + 1) { j -> if (i == 0) j else if (j == 0) i else 0 } }
            for (i in 1..a.length) for (j in 1..b.length) {
                dp[i][j] = if (a[i - 1] == b[j - 1]) dp[i - 1][j - 1]
                else 1 + minOf(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
            }
            return dp[a.length][b.length]
        }
        val seg = name.substringBefore('.').lowercase()
        val top = pool.map { k ->
            val kSeg = k.substringBefore('.').lowercase()
            (if (kSeg != seg) 1000 else 0) + ed(name.lowercase(), k.lowercase()) * 10 + kotlin.math.abs(k.length - name.length)
        }.zip(pool).filter { it.second != name }.sortedBy { it.first }.take(3).map { it.second }
        return if (top.isEmpty()) "" else "（近邻候选: " + top.joinToString(", ") + "——用 tool.help 核对后再调，不要臆造）"
    }

    override suspend fun dispatch(exec: ToolRunContext): ScheduledToolDispatch {
        val name = exec.name.replace('_', '.')
        // 铁律 1：AI 硬调仅 UI 工具 → 拒绝（即使绕过工具面）
        if (uiOnlyTools.any { name.contains(it) }) {
            return ScheduledToolDispatch.FinalResult(
                ToolExecutionResult.Failure(
                    content = listOf(ContentBlock.Text(formatToolError("UI_ONLY_TOOL", "$name 仅用户 UI 可操作（铁律 1：AI 不可自切/自批）"))),
                    error = ToolFailure("ui-only tool", ToolErrorInfo("UiOnlyTool", "UI_ONLY_TOOL")),
                ),
            )
        }
        // E3：工具面塌缩——不在当前呈现模式工具面的工具，即使 handler 存在也拒绝（呈现收缩必须约束执行层）
        val allowed = allowedTools
        if (allowed != null && name !in allowed && exec.name !in allowed) {
            // UPG-27：三分语义——knownTools 含此工具 = 已塌缩（存在但不在直呼面，指引 shell.exec/tool.help）；
            // 否则真未知（TOOL_NOT_FOUND + 命名空间感知近邻）。声明层（SDK 节错误三分）与执行层同口径。
            val known = knownTools
            if (known != null && (name in known || exec.name in known)) {
                return ScheduledToolDispatch.FinalResult(
                    ToolExecutionResult.Failure(
                        content = listOf(ContentBlock.Text(formatToolError(
                            "TOOL_COLLAPSED",
                            "$name 存在但不在当前模式直呼面——code 模式经 shell.exec 间接调用它（SDK 目录即清单），或先 tool.help 查其文档确认参数",
                        ))),
                        error = ToolFailure("collapsed tool", ToolErrorInfo("CollapsedToolError", "TOOL_COLLAPSED")),
                    ),
                )
            }
            return ScheduledToolDispatch.FinalResult(
                ToolExecutionResult.Failure(
                    content = listOf(ContentBlock.Text(formatToolError(
                        "TOOL_NOT_FOUND",
                        "未知工具: ${exec.name}" + nearHint(exec.name, known),
                    ))),
                    error = ToolFailure("unknown tool", ToolErrorInfo("ToolNotFoundError", "TOOL_NOT_FOUND")),
                ),
            )
        }
        val handler = handlers[name] ?: handlers[exec.name]
        if (handler == null) {
            return ScheduledToolDispatch.FinalResult(
                ToolExecutionResult.Failure(
                    content = listOf(ContentBlock.Text(formatToolError("TOOL_NOT_FOUND", "未知工具: ${exec.name}"))),
                    error = ToolFailure("unknown tool", ToolErrorInfo("ToolNotFoundError", "TOOL_NOT_FOUND")),
                ),
            )
        }
        // E1 scope 校验：调用方作用域（当前 main）∩ 工具作用域
        if (!com.hermes.dsh.tools.ToolRegistry.allowedIn(name, setOf("main"))) {
            return ScheduledToolDispatch.FinalResult(
                ToolExecutionResult.Failure(
                    content = listOf(ContentBlock.Text(formatToolError("SCOPE_DENIED", "$name 不在当前作用域"))),
                    error = ToolFailure("scope denied", ToolErrorInfo("ScopeDenied", "SCOPE_DENIED")),
                ),
            )
        }
        // 权限门：执行前检查（铁律 3 系统底线强制）
        val args = (exec.arguments as? Map<String, Any?>) ?: emptyMap()
        // UPG-77 A1：统一判定入口（guard + only-once 强制 ASK 覆写单源化——McpServer 面共用 guard.decide，
        // 不再各自叠加 only-once if；变异锚：删除覆写 → 对话面 FULL_ACCESS only-once→ASK 断言红）
        val g = guard.decide(name, args)
        if (g.decision == PermissionGuard.Decision.DENY) {
            val reason = g.reason ?: "权限拦截"
            return ScheduledToolDispatch.FinalResult(
                ToolExecutionResult.Failure(
                    content = listOf(ContentBlock.Text(formatToolError("PERMISSION_DENIED", "权限拦截: $reason"))),
                    error = ToolFailure(reason, ToolErrorInfo("PermissionDenied", "PERMISSION_DENIED")),
                ),
            )
        }
        if (g.decision == PermissionGuard.Decision.ASK) {
            // D4 审批：审计 + 回答者（UI 弹窗）→ allowed-once 执行 / 其余拒绝
            val approval = approvalService
            val outcome = if (approval != null) {
                try {
                    approval.request(name, g.reason, args)
                } catch (e: Throwable) {
                    // 协程取消不是故障：必须向上传播，不得吞掉降级为 unavailable
                    if (e is kotlinx.coroutines.CancellationException) throw e
                    // 防御：审批服务异常不打断 dispatch → fail-closed
                    android.util.Log.e("ApprovalService", "审批请求异常: ${e.message}")
                    com.hermes.dsh.tools.ApprovalService.Companion.OUTCOME_UNAVAILABLE
                }
            } else {
                // 无审批服务（未装配）→ fail-closed 拒绝
                com.hermes.dsh.tools.ApprovalService.Companion.OUTCOME_UNAVAILABLE
            }
            // UPG-68 D 收口 + UPG-77 A1：outcome→放行判定单源化（ApprovalService.isGranted——only-once
            // 只接受 allowed-once，其余 turn/remembered 放行）。McpServer 面共用同一判定，消除双写。
            val allowed = com.hermes.dsh.tools.ApprovalService.isGranted(name, outcome)
            if (!allowed) {
                val reason = g.reason ?: "需要人工确认"
                return ScheduledToolDispatch.FinalResult(
                    ToolExecutionResult.Failure(
                        content = listOf(ContentBlock.Text(formatToolError("APPROVAL_DENIED", "审批未通过（$outcome）: $reason"))),
                        error = ToolFailure(reason, ToolErrorInfo("ApprovalDenied", "APPROVAL_DENIED")),
                    ),
                )
            }
        }
        val exclusive = !com.hermes.dsh.tools.ToolRegistry.isParallel(name, args)
        val entered = exclusive && com.hermes.dsh.tools.ToolRegistry.exclusiveEnter()
        if (exclusive && !entered) {
            return ScheduledToolDispatch.FinalResult(
                ToolExecutionResult.Failure(
                    content = listOf(ContentBlock.Text(formatToolError("BUSY", "$name 正在执行（exclusive 屏障）"))),
                    error = ToolFailure("busy", ToolErrorInfo("ToolBusy", "BUSY")),
                ),
            )
        }
        return try {
            val value = handler(args)
            ScheduledToolDispatch.FinalResult(
                ToolExecutionResult.Success(
                    content = listOf(ContentBlock.Text(value?.toString() ?: "")),
                ),
            )
        } catch (e: Exception) {
            ScheduledToolDispatch.FinalResult(
                ToolExecutionResult.Failure(
                    content = listOf(ContentBlock.Text("工具执行失败: ${e.message}")),
                    error = ToolFailure(e.message ?: "tool error", ToolErrorInfo("ToolError", "TOOL_EXECUTION_FAILED")),
                ),
            )
        } finally {
            if (exclusive && entered) com.hermes.dsh.tools.ToolRegistry.exclusiveExit()
        }
    }

    override suspend fun finalize(exec: ToolRunContext, result: ToolExecutionResult): ToolExecutionResult {
        return result
    }

    override fun finish(exec: ToolRunContext, result: ToolExecutionResult): ToolExecutionResult {
        return result
    }
}
