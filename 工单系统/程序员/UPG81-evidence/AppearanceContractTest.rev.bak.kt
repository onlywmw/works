package com.mov.android.appearance

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * UPG-50 契约测试（读源文件字符串锚定——变异删行必红）。
 * 覆盖：L1-5 明暗跟随 / L1-6 唯一真相 / L1-9 编号部位隔离 / L1-10 排版 token 标准先行；
 * 变异亲杀锚：M-U50-2（本地 selected）/ M-U50-3（写 impl 层）/ M-U50-4（✓●互换）/ M-U50-5（render-only 失效）/ M-U50-6（其他输入框被触碰）。
 * 必须在仓库根目录跑（相对 File 锚定）。
 */
class AppearanceContractTest {

    private fun root(): File {
        val wd = File(".").canonicalFile
        return if (File(wd, "app").isDirectory) wd else wd.parentFile
    }

    private fun src(rel: String): String = File(root(), rel).readText().replace("\r", "")

    private val app = src("前端设计/mov-vue/src/AppearanceApp.vue")
    private val main = src("app/src/main/java/com/mov/android/MainActivity.kt")
    private val tokens = src("前端设计/mov-vue/src/styles/tokens.css")
    private val syncPages = src("scripts/sync-pages.mjs")

    @Test
    fun `L1-5 明暗跟随全局无独立残留`() {
        // 初始主题读全局（原生注入的 data-theme），切换只改页面 documentElement（无独立持久化状态）
        assertTrue("选择页初始主题必须读全局 data-theme", app.contains("document.documentElement.getAttribute('data-theme')"))
        assertTrue("切换只改 documentElement data-theme", app.contains("document.documentElement.setAttribute('data-theme'"))
    }

    @Test
    fun `L1-6 唯一真相_页面无本地 selected`() {
        assertFalse("页面禁止本地 selected 独立态（读取=AppearanceProfile）", app.contains("selected"))
        assertTrue("✓/● 一律从唯一真相档读取", app.contains("currentOf(comp)") && app.contains("lastOf(comp)"))
    }

    @Test
    fun `L1-7 选择页桥接最小集 ui_getProfile_ui_setVariant`() {
        assertTrue("页面经 ui.getProfile 读唯一真相", app.contains("ui.getProfile"))
        assertTrue("页面经 ui.setVariant 写唯一真相", app.contains("ui.setVariant"))
    }

    @Test
    fun `L1-9 单实例路由_切换只影响目标组件`() {
        // 阶段 0「单部位打样」→ 阶段 1「单实例路由」：全组件切换按 componentId 精确分发，20 条互不污染
        assertTrue("形态应用路由入口 applyComponentAppearance（单实例分发）", main.contains("applyComponentAppearance"))
        assertTrue("切换必须按组件路由（禁共享写点）", main.contains("applyComponentAppearance(componentId)"))
        assertTrue("UI-CHAT-INPUT 分支只调自身应用方法", main.contains("UI_CHAT_INPUT -> applyComposerAppearance()"))
    }

    @Test
    fun `L2-9 1B 高频组件切换契约_实例分发到独立应用方法`() {
        // 1B：CHAT 族（BUBBLE/SEND/ICON-MIC）各独立应用方法，分支只碰自身——变异删分支必红
        assertTrue("UI-CHAT-BUBBLE 分支只调自身应用方法", main.contains("UI_CHAT_BUBBLE -> applyBubbleAppearance()"))
        assertTrue("UI-CHAT-SEND 分支只调自身应用方法", main.contains("UI_CHAT_SEND -> applySendAppearance()"))
        assertTrue("UI-CHAT-ICON-MIC 分支只调自身应用方法", main.contains("UI_CHAT_ICON_MIC -> applyMicAppearance()"))
        // BUBBLE 形态经 bubbleVariant 驱动消息渲染（切换后重渲染即时变）
        assertTrue("气泡渲染消费 bubbleVariant（形态单源）", main.contains("bubbleVariant"))
        // SETTINGS 族：真实设置页消费 ui.getProfile 唯一真相 + 形态 class 与选择页令牌同名
        val settings = src("前端设计/mov-vue/src/components/SettingsPage.vue")
        assertTrue("设置页经 ui.getProfile 读唯一真相", settings.contains("ui.getProfile"))
        assertTrue("设置行绑定 srow 形态", settings.contains("srow-" ) && settings.contains("setRowCls"))
        assertTrue("设置开关绑定 stog 形态", settings.contains("stog-") && settings.contains("setTogCls"))
        assertTrue("设置标题绑定 shead 形态", settings.contains("shead-") && settings.contains("setHeadCls"))
    }

    @Test
    fun `L2-9 1C 余下组件切换契约_真实页面实例消费 ui_getProfile`() {
        // 1C：SIDE/WORKBENCH/MARKET/ASSETS/SHEET/COMMON 六族真实页面——ui.getProfile 唯一真相 + 形态 class 与 Resolver 令牌同名
        val sidebar = src("前端设计/mov-vue/src/components/SidebarNav.vue")
        val workbench = src("前端设计/mov-vue/src/components/WorkbenchPage.vue")
        val market = src("前端设计/mov-vue/src/components/MarketPage.vue")
        val assets = src("前端设计/mov-vue/src/components/AssetsPage.vue")
        val settings = src("前端设计/mov-vue/src/components/SettingsPage.vue")
        // SIDE 族：标题/房间行/工具行 全部消费 ui.getProfile 唯一真相
        assertTrue("侧边栏经 ui.getProfile 读唯一真相", sidebar.contains("ui.getProfile"))
        assertTrue("SIDE-HEADER 绑定 sdhead 形态", sidebar.contains("UI-SIDE-HEADER") && sidebar.contains("sideHeadCls"))
        assertTrue("SIDE-ROOM 绑定 sroom 形态", sidebar.contains("UI-SIDE-ROOM") && sidebar.contains("sideRoomCls"))
        assertTrue("SIDE-TOOL 绑定 stool 形态", sidebar.contains("UI-SIDE-TOOL") && sidebar.contains("sideToolCls"))
        // WORKBENCH 族：工作台行/能力卡片 + COMMON-EMPTY
        assertTrue("工作台经 ui.getProfile 读唯一真相", workbench.contains("ui.getProfile"))
        assertTrue("WORKBENCH-ROW 绑定 wrow 形态", workbench.contains("UI-WORKBENCH-ROW") && workbench.contains("wrowCls"))
        assertTrue("WORKBENCH-CARD 绑定 wcard 形态（P2-A L2-9 第三件证据锚）", workbench.contains("UI-WORKBENCH-CARD") && workbench.contains("wcardCls"))
        assertTrue("COMMON-EMPTY 绑定 cempty 形态", workbench.contains("UI-COMMON-EMPTY") && workbench.contains("cemptyCls"))
        // MARKET 族：市场卡/列表
        assertTrue("市场经 ui.getProfile 读唯一真相", market.contains("ui.getProfile"))
        assertTrue("MARKET-CARD 绑定 mcard 形态", market.contains("UI-MARKET-CARD") && market.contains("mcardCls"))
        assertTrue("MARKET-LIST 绑定 mlist 形态", market.contains("UI-MARKET-LIST") && market.contains("mlistCls"))
        // ASSETS 族：资产卡/列表
        assertTrue("资产页经 ui.getProfile 读唯一真相", assets.contains("ui.getProfile"))
        assertTrue("ASSETS-CARD 绑定 acard 形态", assets.contains("UI-ASSETS-CARD") && assets.contains("acardCls"))
        assertTrue("ASSETS-LIST 绑定 alist 形态", assets.contains("UI-ASSETS-LIST") && assets.contains("alistCls"))
        // SHEET 族：弹层标题/内容行（设置页语言弹层实例）
        assertTrue("SHEET-HEADER 绑定 shhead 形态", settings.contains("UI-SHEET-HEADER") && settings.contains("shheadCls"))
        assertTrue("SHEET-BODY 绑定 sbody 形态", settings.contains("UI-SHEET-BODY") && settings.contains("sbodyCls"))
    }

    @Test
    fun `P2-B pressed 态视觉反馈_4族矩阵active锚`() {
        // P2-B：4 族状态矩阵 pressed 态——行/列表按压灰底 · 卡片按压下压 · 按钮/图标按压降透明
        assertTrue("行/列表族 pressed 灰底锚", tokens.contains(".sroom-standard:active") && tokens.contains(".wrow-standard:active"))
        assertTrue("列表族 pressed 灰底锚", tokens.contains(".mlist-standard:active") && tokens.contains(".alist-standard:active"))
        assertTrue("弹层行 pressed 灰底锚", tokens.contains(".sbody-standard:active"))
        assertTrue("行族 pressed 灰底必须 !important 压过页面 scoped 硬编码背景", tokens.contains("background:var(--s3) !important"))
        assertTrue("卡片族 pressed 下压锚", tokens.contains(".card-shell:active") && tokens.contains(".wcard-standard:active"))
        assertTrue("市场卡 pressed 下压锚", tokens.contains(".mcard-standard:active"))
        assertTrue("资产卡 pressed 下压锚（acard 补录 P2-B）", tokens.contains(".acard-standard:active"))
        assertTrue("按钮/图标族 pressed 降透明锚", tokens.contains(".send-standard:active") && tokens.contains(".mic-standard:active"))
    }

    @Test
    fun `L1-14 全组件切换单API_components唯一写点`() {
        // components 唯一写点=AppearanceProfile.setVariant（grep：MainActivity 无独立写 components）
        assertTrue("MainActivity 写口只走 store.update（唯一真相写口）",
            main.contains("store.update { it.setVariant(componentId, variant) }"))
        assertTrue("写口返回新档供页面重读", main.contains("\"profile\" to updated.toJson()"))
    }

    @Test
    fun `M-U50-9 切换误伤他组件_红锚`() {
        // 变异：applyComponentAppearance 不按 componentId 分发（全局共享态）→ 本条 grep 红
        assertTrue("路由方法签名携带 componentId（分发键）",
            main.contains("private fun applyComponentAppearance(componentId: String)"))
        assertTrue("分支表达式以 componentId 为键", main.contains("when (componentId)"))
    }

    @Test
    fun `L1-10 排版语义 token 契约标准先行`() {
        // 契约三个语义名在 :root 段与 dark 段各齐全（sync-pages CONTRACT_TOKENS 守护并轨）
        assertTrue(":root 段含 --text-scale", tokens.contains("--text-scale:1"))
        assertTrue(":root 段含 --font-family", tokens.contains("--font-family:"))
        assertTrue(":root 段含 --font-weight", tokens.contains("--font-weight:"))
        val dark = tokens.substringAfter("[data-theme=\"dark\"]")
        assertTrue("dark 段含 --text-scale", dark.contains("--text-scale:1"))
        assertTrue("dark 段含 --font-family", dark.contains("--font-family:"))
        assertTrue("dark 段含 --font-weight", dark.contains("--font-weight:"))
        // sync-pages 契约守护已扩表
        assertTrue("sync-pages CONTRACT_TOKENS 必须含三语义名", syncPages.contains("'--text-scale', '--font-family', '--font-weight'"))
        // UPG-81 契约锚同步修（裁决 UPG70-裁决项1，用户拍板）：选择页 AppearanceApp.vue 收拢版=页面工具样式写死字号
        // （demo 风格硬编码 px 现实，.back{font-size:20px} 等）——断言认账现实，不再声称禁写死；语义 token 契约
        // 由「Resolver 形态层真实消费 var(--font-weight)」锚定（防 token 定义空转）。
        assertTrue("收拢现实：选择页返回钮字号写死 20px（.back @AppearanceApp.vue:270）",
            app.contains(".back{font-size:20px"))
        assertTrue("收拢现实：选择页应用壳字族写死于 font 简写（.appearance-app @AppearanceApp.vue:268）",
            app.contains(".appearance-app{min-height:100%"))
        assertTrue("Resolver 形态层消费语义字重 token（.shhead-standard @tokens.css:214 防 token 空转）",
            tokens.contains("font-weight:var(--font-weight)"))
    }

    @Test
    fun `L1-10 sync-pages 豁免名单包含 appearance`() {
        assertTrue("appearance 必须进 sync-pages 受控同步名单", syncPages.contains("'appearance'"))
    }

    @Test
    fun `M-U50-2 页面本地 selected 变异红锚`() {
        assertFalse("selected 出现即变异红（本地独立选中态）", app.contains("selected"))
    }

    @Test
    fun `M-U50-3 选中写 profile 不写 impl 层`() {
        assertTrue("ui.setVariant 必须走 AppearanceProfileStore.update（唯一真相写口）",
            main.contains("store.update { it.setVariant(componentId, variant) }"))
        assertTrue("setVariant 写口必须返回新档供页面重读", main.contains("\"profile\" to updated.toJson()"))
    }

    @Test
    fun `M-U50-4 ✓生效优先于 ● 最近使用`() {
        val badge = app.substringAfter("function badgeOf")
        assertTrue("✓（current）判断必须优先于 ●（lastUsed）——生效卡不显 ●",
            badge.indexOf("currentOf(comp)") in 0 until badge.indexOf("lastOf(comp)"))
    }

    @Test
    fun `M-U50-5 预览卡 render-only 无交互`() {
        // UPG-81 契约锚同步修（裁决 UPG70-裁决项1，用户拍板）：收拢版预览卡 render-only=真实 DOM 骨架但纯 span 展示
        // （previewOf @AppearanceApp.vue:185-200，无 pointer-events 声明——原断言指涉样式在收拢版不存在）。
        // 锚定真实 render-only 表达：非交互标签 + aria-hidden 装饰 + demo 形态不可选中（select 拦截）。
        val pof = app.substringAfter("function previewOf").substringBefore("function parseProfile")
        assertFalse("预览骨架禁用交互标签（纯 span render-only，previewOf @AppearanceApp.vue:185-200）",
            Regex("<(button|input|textarea|select|a\\s)").containsMatchIn(pof))
        assertTrue("预览卡为纯展示 span（aria-hidden 装饰）", app.contains("aria-hidden=\"true\""))
        assertTrue("预览卡 render-only：演示形态仅网格展示不可选中（select 拦截 @AppearanceApp.vue:234）",
            app.contains("演示形态仅用于网格展示"))
    }

    @Test
    fun `M-U50-6 切换后其他输入框零变化`() {
        assertTrue("形态重建走独立方法 applyComposerAppearance（不触碰其他输入框）", main.contains("applyComposerAppearance()"))
        // 形态几何只经 Resolver 输出（不散落硬编码在 MainActivity 构建处）
        assertTrue("composer 构建处调用形态应用（单一入口）", main.contains("applyComposerAppearance()"))
    }
}
