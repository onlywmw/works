package com.hermes.mov.mcp

import com.hermes.dsh.brand.SessionId
import com.hermes.dsh.session.Session
import com.hermes.dsh.session.SessionHeader
import com.hermes.dsh.session.SessionEvent
import com.hermes.dsh.tools.ApprovalService
import com.hermes.dsh.tools.PermissionGuard
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * UPG-77：MCP 面（tools/call）审批判定单源化 + 死信面消除（JVM 变异锚亲杀）。
 *
 * 契约：
 * - FULL_ACCESS（open）下 MCP 面调 only-once（vault.get）不直出明文——拒绝/超时 fail-closed；
 *   当次允许（allowed-once）才放行（变异锚1/2 MCP 侧亲杀：恢复直查 guard / 删除 decide 覆写 → 直出明文 → 红）
 * - default 下 MCP 面 ASK 路由 ApprovalService.request：HTTP 同步等待真实审批结果、足迹 asked+decided 成对
 *   （变异锚3 亲杀：ASK 分支恢复 registerPending + APPROVAL_REQUIRED req-N → 本测试红）
 * - ASK 响应不再含 req-N / APPROVAL_REQUIRED 死信格式
 */
class McpServerApprovalTest {

    private fun newSession(id: String = "upg77-mcp"): Session {
        val sid = SessionId(id)
        return Session.create(sid, header = SessionHeader(id = sid, createdAt = 1000L))
    }

    private fun freePort(): Int =
        java.net.ServerSocket().use { s ->
            s.reuseAddress = true
            s.bind(java.net.InetSocketAddress("127.0.0.1", 0))
            s.localPort
        }

    /** 起一个带 vault.get handler 的 MCP 服务器（明文标识 PLAINTEXT-123 用于直出断言）。 */
    private fun startServer(session: Session, guard: PermissionGuard): Triple<McpServer, ApprovalService, Int> {
        val port = freePort()
        val service = ApprovalService { session }
        val server = McpServer(port = port, token = null, guard = guard, approvalService = service)
        server.addTool(McpServer.ToolSpec(
            name = "vault.get",
            description = "test vault.get",
            inputSchema = mapOf("type" to "object", "properties" to mapOf<String, Any?>()),
            handler = { mapOf("ok" to true, "secret" to "PLAINTEXT-123") },
        ))
        server.start()
        return Triple(server, service, port)
    }

    private fun call(port: Int, method: String, name: String): String {
        val url = java.net.URL("http://127.0.0.1:$port/")
        val c = url.openConnection() as java.net.HttpURLConnection
        try {
            c.requestMethod = "POST"
            c.doOutput = true
            c.setRequestProperty("Content-Type", "application/json")
            val body = """{"jsonrpc":"2.0","id":1,"method":"$method","params":{"name":"$name","arguments":{}}}"""
            c.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            return c.inputStream.bufferedReader(Charsets.UTF_8).readText()
        } finally {
            c.disconnect()
        }
    }

    // ==================== FULL_ACCESS（open）only-once 不直出 ====================

    @Test
    fun `MCP面 FULL_ACCESS only-once vault_get 拒绝不直出 当次允许才明文`() {
        val session = newSession("upg77-open")
        val guard = PermissionGuard()
        guard.setMode(PermissionGuard.Mode.FULL_ACCESS) // open 全权模式
        val (server, service, port) = startServer(session, guard)
        try {
            // 用户拒绝 → fail-closed：响应拒绝文案、无明文
            // （变异亲杀：恢复直查 guard.guard() 或删除 decide 的 only-once 覆写 → FULL_ACCESS 直出明文 → 红）
            service.answerer = { ApprovalService.Answer.REJECT }
            val deniedBody = call(port, "tools/call", "vault.get")
            assertTrue("open only-once 拒绝后仍直出明文（伪放行——变异亲杀失败）", !deniedBody.contains("PLAINTEXT-123"))
            assertTrue("拒绝应返回审批未通过", deniedBody.contains("审批未通过"))
            // 当次允许（allowed-once）→ 明文放行（证明门是 ASK 弹窗而非直接 DENY/直出）
            service.answerer = { ApprovalService.Answer.ALLOW_ONCE }
            val okBody = call(port, "tools/call", "vault.get")
            assertTrue("open only-once 当次允许后未放行明文（ASK 门控异常）", okBody.contains("PLAINTEXT-123"))
            // 足迹：两次调用均真实弹审 asked+decided 成对（不是免弹直出）
            assertEquals(2, session.events.filterIsInstance<SessionEvent.ApprovalAsked>().size)
            assertEquals(2, session.events.filterIsInstance<SessionEvent.ApprovalDecided>().size)
            assertTrue(
                "vault.get 足迹缺 allowed-once",
                session.events.filterIsInstance<SessionEvent.ApprovalDecided>().any { it.outcome == ApprovalService.OUTCOME_ALLOWED_ONCE },
            )
        } finally {
            server.stop()
        }
    }

    // ==================== default ASK 路由 ApprovalService ====================

    @Test
    fun `MCP面 default ask 路由 ApprovalService 允许返回明文且无req死信`() {
        val session = newSession("upg77-default")
        val guard = PermissionGuard() // 默认权限模式
        val (server, service, port) = startServer(session, guard)
        try {
            service.answerer = { ApprovalService.Answer.ALLOW_ONCE }
            val body = call(port, "tools/call", "vault.get")
            assertTrue("default ask 放行未返回明文（MCP 面审批未生效）", body.contains("PLAINTEXT-123"))
            // 死信消除：不再返回 APPROVAL_REQUIRED + req-N（变异亲杀：ASK 分支恢复 registerPending → 红）
            assertTrue("响应含 req- 死信 requestId（A2 死信未消除）", !body.contains("req-"))
            assertTrue("响应含 APPROVAL_REQUIRED（旧死信格式残留）", !body.contains("APPROVAL_REQUIRED"))
            assertTrue(
                "审批足迹无 allowed-once",
                session.events.filterIsInstance<SessionEvent.ApprovalDecided>().any { it.outcome == ApprovalService.OUTCOME_ALLOWED_ONCE },
            )
        } finally {
            server.stop()
        }
    }

    @Test
    fun `MCP面 default ask 超时 fail-closed 拒绝 不留req且足迹cancelled`() {
        val session = newSession("upg77-timeout")
        val guard = PermissionGuard()
        val (server, service, port) = startServer(session, guard)
        try {
            val gate = kotlinx.coroutines.CompletableDeferred<Unit>()
            service.timeoutMs = 200 // 测试注入短展示超时
            service.answerer = {
                gate.await() // 永不答复 → 由展示超时 fail-closed 接管
                ApprovalService.Answer.ALLOW_ONCE
            }
            val body = call(port, "tools/call", "vault.get")
            assertTrue("超时应 fail-closed 拒绝（未返回审批未通过）", body.contains("审批未通过"))
            assertTrue("超时拒绝仍直出明文", !body.contains("PLAINTEXT-123"))
            assertTrue("超时拒绝含 req- 死信", !body.contains("req-"))
            assertTrue(
                "足迹无 cancelled",
                session.events.filterIsInstance<SessionEvent.ApprovalDecided>().any { it.outcome == ApprovalService.OUTCOME_CANCELLED },
            )
            gate.complete(Unit) // 收尾释放，防悬挂
        } finally {
            server.stop()
        }
    }
}
