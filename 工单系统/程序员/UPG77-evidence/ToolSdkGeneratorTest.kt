package com.mov.android

import com.hermes.mov.browser.BrowserMcpTools
import com.hermes.mov.tools.BuiltinMcpTools
import com.hermes.mov.tools.SceneTools
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * UPG-27 L1 契约（v1.2.1 验收口径）：
 * - SDK 生成纯函数：目录层短描述/常用集签名/调用范式全路径判例（含转义样例+双门标注）/未登记工具不出现
 * - tool.help 契约：已登记→三件套；不存在→TOOL_NOT_FOUND+命名空间感知近邻；入参空→INVALID_ARGS
 * - 同源断言：改登记层某工具描述 → SDK 节与 tool.help 输出同步变化（紧凑/完整两渲染语义一致）
 * - 塌缩语义三分：已塌缩（TOOL_COLLAPSED）/真未知（TOOL_NOT_FOUND+近邻）/INVALID_ARGS 可区分且都带指引
 * - 声明生成化：改 codeTools 集合 → 声明文本自动同步（禁模板手写）
 * - token 口径：目录层/判例/文档一律 tokens（estimateTokens 加权）且上限断言
 * 变异亲杀锚：M1 删 SDK 装配 / M2 tool.help 空返回 / M3 同源改单面（变异跑见交付报告）。
 */
class ToolSdkGeneratorTest {

    private val registry = MainActivity.buildToolRegistry(
        builtin = BuiltinMcpTools.all(),
        scene = SceneTools.all(),
        provider = DeviceProvider.allMeta() + ObsidianProvider.allMeta(),
        browser = BrowserMcpTools.TOOLS,
    )

    /** code 模式在面工具模拟（直呼面 + 一批可间接调用工具）。 */
    private val faceTools = listOf("shell.exec", "tool.help", "file.read", "memory.search", "device.network", "obsidian.file.read")
    private val direct = setOf("shell.exec", "tool.help")
    private val tierOf = { n: String -> if (n in setOf("file.read", "memory.search", "tool.help", "device.network", "obsidian.file.read")) "harmless" else "ask" }

    private fun build(directTools: Set<String> = direct, frequent: List<String> = emptyList()) =
        ToolSdkGenerator.buildSdkSection(
            registry = registry, faceTools = faceTools, directTools = directTools,
            frequent = frequent, tierOf = tierOf,
            modelId = "deepseek-v4", modelLabel = "DeepSeek V4", approvalMode = "ask",
        )

    @Test
    fun `SDK 节结构完整——直呼声明 工具目录 判例 双门 三分`() {
        val sdk = build()
        // 声明生成化：直呼面文本由 codeTools 生成
        assertTrue("声明缺直呼面清单", sdk.text.contains("shell.exec, tool.help"))
        assertTrue("声明缺「不可直呼」语义（目录=间接调用非直呼面）", sdk.text.contains("不可直呼") && sdk.text.contains("间接调用"))
        // 目录层：全量在面工具都在 + 未登记工具不出现
        for (n in faceTools) assertTrue("目录缺 $n", sdk.text.contains("- " + n + "："))
        assertFalse("未登记工具不得出现", sdk.text.contains("nonexistent.tool"))
        // 判例：全路径（shell.exec→MCP）+ token 占位 + 转义样例
        assertTrue("判例缺全路径包装", sdk.text.contains("tools/call") && sdk.text.contains("shell.exec command="))
        assertTrue("判例 token 须为运行时注入变量占位（红线 5）", sdk.text.contains("Bearer \$MOV_MCP_TOKEN"))
        assertTrue("判例缺转义口径样例", sdk.text.contains("转义口径"))
        // 双门如实（UPG-77 A3：纠偏后的真实语义——ask 类经 MCP 面走 App 内实时审批 60s fail-closed；
        // only-once 任何模式当次确认；不得再承诺「再弹一次」旧虚假文案——防回归锚）
        assertTrue("双门语义缺失", sdk.text.contains("双门") && sdk.text.contains("恒 ASK"))
        assertTrue("A3 实时审批语义缺失", sdk.text.contains("实时审批") && sdk.text.contains("fail-closed"))
        assertTrue("A3 only-once 当次确认缺失", sdk.text.contains("only-once") && sdk.text.contains("当次确认"))
        assertFalse("A3 虚假承诺回潮（再弹一次）", sdk.text.contains("再弹"))
        // 三分声明
        for (code in listOf("TOOL_COLLAPSED", "TOOL_NOT_FOUND", "INVALID_ARGS")) {
            assertTrue("三分声明缺 $code", sdk.text.contains(code))
        }
        // token 口径：目录层预算内 + 文本 tokens 可计量（禁 KB 无从测——tokens 数字在案）
        assertTrue("目录层超预算", sdk.text.contains("tokens / 预算"))
        assertTrue("SDK 节合计超 7K tokens 目标（实际 ${sdk.tokens}）", sdk.tokens <= 7000)
    }

    @Test
    fun `声明生成化——改 codeTools 集合声明文本自动同步`() {
        val sdk1 = build(directTools = setOf("shell.exec", "tool.help"))
        val sdk2 = build(directTools = setOf("shell.exec"))
        assertTrue(sdk1.text.contains("shell.exec, tool.help"))
        assertFalse("移除 tool.help 后声明应自动同步", sdk2.text.contains("shell.exec, tool.help"))
        assertTrue(sdk2.text.contains("shell.exec"))
    }

    @Test
    fun `tool help 契约——已登记三件套 不存在近邻 入参空 INVALID_ARGS`() {
        // 已登记：完整文档（description/parameters/output/tier 同源）
        val ok = ToolSdkGenerator.toolHelpDoc(listOf("file.read"), registry, tierOf)
        assertEquals(true, ok["ok"])
        val doc = (ok["docs"] as List<*>)[0] as Map<*, *>
        assertEquals("file.read", doc["name"])
        assertEquals("desc 对账", BuiltinMcpTools.all().first { it.name == "file.read" }.description, doc["description"])
        assertTrue("缺 permissionTier", (doc["permissionTier"] as String).isNotBlank())
        // 不存在：TOOL_NOT_FOUND + 命名空间感知近邻
        val miss = ToolSdkGenerator.toolHelpDoc(listOf("file.redd"), registry, tierOf)
        assertEquals(false, miss["ok"])
        assertEquals("TOOL_NOT_FOUND", miss["code"])
        val near = miss["nearSuggestions"] as List<*>
        assertTrue("近邻应含 file.read（段内编辑距离）", near.contains("file.read"))
        // 入参空：INVALID_ARGS + 指引
        val invalid = ToolSdkGenerator.toolHelpDoc(emptyList(), registry, tierOf)
        assertEquals(false, invalid["ok"])
        assertEquals("INVALID_ARGS", invalid["code"])
        assertTrue((invalid["hint"] as String).contains("tool.help"))
    }

    @Test
    fun `同源断言——改登记层描述 SDK 节与 tool help 同步变化`() {
        // 登记层实例同源改造：file.read 描述加后缀
        val mutated = HashMap(registry)
        val orig = registry["file.read"]!!
        mutated["file.read"] = object : com.hermes.dsh.tools.ToolSchemaLike {
            override val name = orig.name
            override val description = "同源测试前缀：" + orig.description
            override val parameters = orig.parameters
        }
        val sdkA = ToolSdkGenerator.buildSdkSection(
            registry = registry, faceTools = faceTools, directTools = direct,
            frequent = emptyList(), tierOf = tierOf, modelId = "m", modelLabel = "m", approvalMode = "ask",
        )
        val sdkB = ToolSdkGenerator.buildSdkSection(
            registry = mutated, faceTools = faceTools, directTools = direct,
            frequent = emptyList(), tierOf = tierOf, modelId = "m", modelLabel = "m", approvalMode = "ask",
        )
        println("A 行=" + sdkA.text.lines().filter { it.contains("file.read：") }.joinToString()); println("B 行=" + sdkB.text.lines().filter { it.contains("file.read：") }.joinToString())
        assertTrue("SDK 节未随登记层同步（同源断裂）", sdkA.text != sdkB.text)
        val helpA = ToolSdkGenerator.toolHelpDoc(listOf("file.read"), registry, tierOf)
        val helpB = ToolSdkGenerator.toolHelpDoc(listOf("file.read"), mutated, tierOf)
        assertTrue("tool.help 未随登记层同步（同源断裂）", helpA != helpB)
        // 版本随内容变化（版本化冻结的版本派生）
        assertTrue("版本未随登记层变化", sdkA.version != sdkB.version)
    }

    @Test
    fun `三分执行层——调度器塌缩分支 已塌缩与真未知可区分`() {
        val scheduler = com.hermes.dsh.tools.McpToolScheduler(emptyMap())
        scheduler.allowedTools = setOf("shell.exec", "tool.help")
        scheduler.knownTools = setOf("shell.exec", "tool.help", "camera.capture", "file.read")
        // 已塌缩：camera.capture 在全集、不在 code 直呼面 → TOOL_COLLAPSED + 指引（走 dispatch 实证）
        val collapsedDispatch = kotlinx.coroutines.runBlocking { scheduler.dispatch(testExec("camera.capture")) }
        val cf = (collapsedDispatch as com.hermes.dsh.tools.ScheduledToolDispatch.FinalResult).result as com.hermes.dsh.tools.ToolExecutionResult.Failure
        assertTrue("已塌缩应报 TOOL_COLLAPSED（实际 ${cf.error!!.info.code}）", cf.error!!.info.code == "TOOL_COLLAPSED")
        assertTrue(cf.content[0].toString().contains("shell.exec"))
        // 真未知：camera.captur 全集无 → TOOL_NOT_FOUND + 近邻（camera.capture 段内）
        val unknownDispatch = kotlinx.coroutines.runBlocking { scheduler.dispatch(testExec("camera.captur")) }
        val uf = (unknownDispatch as com.hermes.dsh.tools.ScheduledToolDispatch.FinalResult).result as com.hermes.dsh.tools.ToolExecutionResult.Failure
        assertTrue("真未知应报 TOOL_NOT_FOUND（实际 ${uf.error!!.info.code}）", uf.error!!.info.code == "TOOL_NOT_FOUND")
        assertTrue("真未知应附近邻候选", uf.content[0].toString().contains("近邻候选"))
    }

    private fun testExec(name: String): com.hermes.dsh.tools.ToolRunContext {
        return com.hermes.dsh.tools.MockToolRunContext(
            com.hermes.dsh.tools.ToolExecutionInput(
                callId = com.hermes.dsh.brand.CallId("test-" + System.nanoTime()),
                name = name,
                arguments = emptyMap<String, Any?>(),
                signal = object : com.hermes.dsh.tools.AbortSignal {
                    override val aborted = false
                },
            ),
        )
    }

    @Test
    fun `summary 源超限 fail loud（红线 7）`() {
        val long = "这行摘要远超十八个 token 的限制因为它是故意写得很长很长的一段中文摘要文本用来触发上限"
        val e = runCatching { ToolSdkGenerator.shortDescription("x", null, summaryOverride = mapOf("x" to long)) }
        assertTrue("summary 超限应 fail-loud", e.isFailure)
        // 过渡口径：description 截断+标注（定义行为，非 fail）
        val short = ToolSdkGenerator.shortDescription("device.network", registry["device.network"])
        assertTrue(short.isNotEmpty())
    }

    @Test
    fun `常用集签名层——frequent 在面才签 冷启动空态诚实声明`() {
        val withFreq = build(frequent = listOf("file.read", "memory.search", "nonexistent.tool"))
        assertTrue("签名层应含 file.read 签名", withFreq.text.contains("file.read(path: string)"))
        assertFalse("不在面工具不得进签名层", withFreq.text.contains("nonexistent.tool("))
        val cold = build(frequent = emptyList())
        assertTrue("冷启动空态应诚实声明待积累", cold.text.contains("暂无频次数据"))
    }

    @Test
    fun `tool help output 诚实化——恒待登记标注 禁输入键冒充（R1 P2 锁死）`() {
        for (n in listOf("file.read", "device.network", "obsidian.vault.detect")) {
            val ok = ToolSdkGenerator.toolHelpDoc(listOf(n), registry, tierOf)
            val doc = (ok["docs"] as List<*>)[0] as Map<*, *>
            val out = doc["output"] as String
            assertTrue("$n output 应恒「待登记」标注（诚实化）", out.contains("待登记"))
            assertFalse("$n output 编造形态回潮（输入键冒充顶层返回键）", out.contains("顶层返回键含"))
        }
    }

    @Test
    fun `P3 对账——nearSuggestions 与调度器 nearHint 同输入同候选（双实现同步锁）`() {
        // 调度器 nearHint 是 private——经 dispatch 真未知错误文本提取近邻，与生成器 nearSuggestions 对账
        val scheduler = com.hermes.dsh.tools.McpToolScheduler(emptyMap())
        scheduler.allowedTools = setOf("shell.exec", "tool.help")
        scheduler.knownTools = registry.keys
        val dispatch = kotlinx.coroutines.runBlocking { scheduler.dispatch(testExec("file.redd")) }
        val text = ((dispatch as com.hermes.dsh.tools.ScheduledToolDispatch.FinalResult).result
            as com.hermes.dsh.tools.ToolExecutionResult.Failure).content[0].toString()
        val gen = ToolSdkGenerator.nearSuggestions("file.redd", registry.keys)
        assertTrue("生成器近邻不应为空", gen.isNotEmpty())
        assertTrue(
            "双实现漂移：生成器 top1=${gen.first()} 未出现在调度器错误文本（P3 对账断言）",
            text.contains(gen.first()),
        )
    }
}
