package com.hermes.mov.mcp

import com.hermes.mov.tools.MovQueryTools

/**
 * McpServer —— 本地 MCP 服务器（对外接口，决策 25：McpServer = 对外唯一通道）。
 *
 * Streamable HTTP 风格：POST / → JSON-RPC（initialize / tools/list / tools/call）。
 * 工具源：MOV 移植的 mov.* 查询工具（roomList/journalTail）+ 内置工具。
 * PC/Android 通用（MiniHttpServer，纯 Java Socket）。
 *
 * 源：MOV-APP main `McpServer.java`（2026-08-18 移植成 Kotlin）
 */
class McpServer(
    private val port: Int = 8389,
    private val token: String? = null,
    private val queryTools: MovQueryTools? = null,
    private val guard: com.hermes.dsh.tools.PermissionGuard? = null,
    private val approvalService: com.hermes.dsh.tools.ApprovalService? = null,
) {
    private var server: MiniHttpServer? = null
    /** 共享工具执行线程池（cached：按需建线程，空闲 60s 自动回收——避免每次调用新建池导致线程泄漏）。 */
    @Volatile
    private var toolExecutor = java.util.concurrent.Executors.newCachedThreadPool()

    data class ToolSpec(
        val name: String,
        val description: String,
        val inputSchema: Map<String, Any?> = mapOf("type" to "object", "properties" to mapOf<String, Any?>()),
        val handler: (Map<String, Any?>) -> Any?,
    )

    /** 已注册工具。 */
    private val tools = LinkedHashMap<String, ToolSpec>()

    /** 注册一个工具。 */
    fun addTool(spec: ToolSpec) {
        tools[spec.name] = spec
    }

    /** 移除一个工具（市场热摘除用，契约第六节）。返回该工具是否存在并被移除。 */
    fun removeTool(name: String): Boolean = tools.remove(name) != null

    /** 启动服务器。 */
    fun start() {
        // stop() 会 shutdown 线程池；重启时必须重建，否则工具执行抛 RejectedExecutionException
        if (toolExecutor.isShutdown) {
            toolExecutor = java.util.concurrent.Executors.newCachedThreadPool()
        }
        val http = MiniHttpServer(port) { req -> handle(req) }
        http.start()
        server = http
    }

    fun stop() {
        server?.stop()
        server = null
        // 资源管理规范：显式释放工具执行线程池（cached 池空闲自动回收，但 stop/start 重建时显式 shutdown 更干净）
        try {
            toolExecutor.shutdown()
        } catch (_: Exception) {
        }
    }

    val running: Boolean get() = server != null

    /** 处理一个 HTTP 请求（JSON-RPC）。 */
    private fun handle(req: MiniHttpServer.HttpRequest): MiniHttpServer.HttpResponse {
        return try {
            // 鉴权：token 校验
            if (token != null) {
                val auth = req.header("Authorization") ?: ""
                if (auth != "Bearer $token") {
                    return MiniHttpServer.HttpResponse(
                        401, body = """{"jsonrpc":"2.0","error":{"code":-32001,"message":"unauthorized"}}""",
                    )
                }
            }
            if (req.method != "POST") {
                return MiniHttpServer.HttpResponse(405, body = """{"error":"POST required"}""")
            }
            val parsed = MiniJson.parseObject(req.body)
            val method = parsed["method"] as? String ?: ""
            val id = parsed["id"]
            // JSON-RPC 错误对象（非空时走顶层 "error" 字段，而不是包进 "result"）
            var rpcError: Map<String, Any?>? = null
            val result = when (method) {
                "initialize" -> mapOf(
                    "protocolVersion" to "2024-11-05",
                    "capabilities" to mapOf("tools" to mapOf<String, Any?>()),
                    "serverInfo" to mapOf("name" to "mov-mcp", "version" to "0.1.0"),
                )
                "tools/list" -> mapOf(
                    "tools" to tools.values.map { spec ->
                        mapOf(
                            "name" to spec.name,
                            "description" to spec.description,
                            "inputSchema" to spec.inputSchema,
                        )
                    },
                )
                "tools/call" -> {
                    val params = parsed["params"] as? Map<*, *> ?: emptyMap<Any?, Any?>()
                    val name = params["name"] as? String ?: ""
                    val argsMap = params["arguments"] as? Map<*, *> ?: emptyMap<Any?, Any?>()
                    val args = HashMap<String, Any?>()
                    for ((k, v) in argsMap) args[k.toString()] = v
                    val spec = tools[name]
                    // 权限门：MCP 入口同样过统一判定入口（UPG-77 A1 guard.decide——only-once 强制 ASK 覆写单源化，对话面共用）
                    val denied = guard?.let { g ->
                        val gr = g.decide(name, args)
                        if (gr.decision == com.hermes.dsh.tools.PermissionGuard.Decision.ALLOW) {
                            null
                        } else if (gr.decision == com.hermes.dsh.tools.PermissionGuard.Decision.DENY) {
                            mapOf(
                                "content" to listOf(mapOf("type" to "text", "text" to com.hermes.dsh.llm.formatToolError("PERMISSION_DENIED", "权限拦截: ${gr.reason ?: "denied"}"))),
                                "isError" to true,
                            )
                        } else {
                            // UPG-77 A2：ASK → 路由 ApprovalService.request（同一 FIFO/呈现/审计；HTTP 同步等待
                            // 至多 60s fail-closed——不再产生 req-N 死信，permission.approve/deny 死面已退役）。
                            // runBlocking bridge：MiniHttpServer 每连接独立线程（非主线程），answerer（UI 弹窗/通知）
                            // 走主线程 runOnUiThread，两线不互锁；审批结果在 HTTP 响应内同步返回。
                            val outcome = try {
                                val appr = approvalService
                                if (appr == null) com.hermes.dsh.tools.ApprovalService.Companion.OUTCOME_UNAVAILABLE
                                else kotlinx.coroutines.runBlocking { appr.request(name, gr.reason, args) }
                            } catch (_: Throwable) {
                                // 审批服务异常/连接中断 → fail-closed 拒绝（不直出明文）
                                com.hermes.dsh.tools.ApprovalService.Companion.OUTCOME_UNAVAILABLE
                            }
                            if (com.hermes.dsh.tools.ApprovalService.isGranted(name, outcome)) {
                                null // 审批放行 → 下方执行 handler
                            } else {
                                mapOf(
                                    "content" to listOf(mapOf("type" to "text", "text" to com.hermes.dsh.llm.formatToolError("APPROVAL_DENIED", "审批未通过（$outcome）: ${gr.reason ?: name}"))),
                                    "isError" to true,
                                )
                            }
                        }
                    }
                    if (denied != null) {
                        denied
                    } else if (spec == null) {
                        mapOf(
                            "content" to listOf(mapOf("type" to "text", "text" to com.hermes.dsh.llm.formatToolError("TOOL_NOT_FOUND", "未知工具: $name"))),
                            "isError" to true,
                        )
                    } else {
                        // 工具超时（dsh 对齐：MCP 直调同样应用工具自声明超时）
                        val declaredMs = com.hermes.dsh.tools.ToolTimeoutRegistry.declaredMs(name)
                        if (declaredMs == null) {
                            try {
                                val value = spec.handler(args)
                                mapOf(
                                    "content" to listOf(mapOf("type" to "text", "text" to (value?.toString() ?: ""))),
                                    "isError" to false,
                                )
                            } catch (e: Exception) {
                                mapOf(
                                    "content" to listOf(mapOf("type" to "text", "text" to "错误: ${e.message}")),
                                    "isError" to true,
                                )
                            }
                        } else {
                            val future = toolExecutor.submit<Any?> {
                                spec.handler(args)
                            }
                            try {
                                val value = future.get(declaredMs, java.util.concurrent.TimeUnit.MILLISECONDS)
                                mapOf(
                                    "content" to listOf(mapOf("type" to "text", "text" to (value?.toString() ?: ""))),
                                    "isError" to false,
                                )
                            } catch (e: java.util.concurrent.TimeoutException) {
                                future.cancel(true)
                                com.hermes.dsh.tools.ToolAbortHooks.fire(name)
                                mapOf(
                                    "content" to listOf(mapOf("type" to "text", "text" to "工具超时（${declaredMs}ms）: $name")),
                                    "isError" to true,
                                )
                            } catch (e: Exception) {
                                future.cancel(true)
                                mapOf(
                                    "content" to listOf(mapOf("type" to "text", "text" to "错误: ${e.message}")),
                                    "isError" to true,
                                )
                            } finally {
                                future.cancel(true)
                            }
                        }
                    }
                }
                else -> {
                    rpcError = mapOf("code" to -32601, "message" to "方法不存在: $method")
                    null
                }
            }
            // 区分 JSON-RPC 两条路径：成功 → "result"，失败 → 顶层 "error"（{"jsonrpc","id","error":{code,message}}）
            val err = rpcError
            val resp = if (err != null) {
                mapOf("jsonrpc" to "2.0", "id" to id, "error" to err)
            } else {
                mapOf("jsonrpc" to "2.0", "id" to id, "result" to result)
            }
            MiniHttpServer.HttpResponse(200, body = stringifyObject(resp))
        } catch (e: Exception) {
            // message 必须经 MiniJson.quote 转义——直接插值会被引号/换行破坏 JSON 结构
            MiniHttpServer.HttpResponse(
                500, body = """{"jsonrpc":"2.0","error":{"code":-32603,"message":${MiniJson.quote(e.message ?: "internal error")}}}""",
            )
        }
    }

}
