# UPG-20 交付：聊天页 chips 气泡改造 v2（切换模型 + MCP 工具）

- **分支/hash**：`feat/upg20` `9b91f60`（基线 main 3b6df4a，转派接手后 --ff-only 快进）
- **日期**：2026-08-28
- **登记**：工单表 E21/H21、工单库 UPG-20 卡（先表后库）；报告落 `程序员\交付报告\`
- **Token/KV 申报**：模型/effort 切换影响后续请求（装配快照 :3767 消费 chatModePref+ModelRegistry.current，与气泡写入同一数据源）；MCP 气泡 v1 只读零写操作；Chips UI 改动不影响 Token 面其他字段
- **已登记两个表** ✅

## 现象/工单口径

v2 定稿（demo 三轮确认）：chips 行两枚 chip（「切换模型」「MCP 工具」）上方小气泡浮层（~236dp、圆角 14、轻阴影），两级交互；原「快速 ▾」模式 chip 并入切换模型；「拍照 OCR」「总结文件」chip 移除；chips 统一宽度横滑。

## 根因/设计（本单是改造，无缺陷根因；记录三个实现决策）

1. **模型切换键**：气泡选择写 `modelStore.setDefault(id)+syncModelRegistry()`——与 ModelSheet 页 `model.setDefault` 完全同键同链（红线「禁平行体系」）；契约锚 `ModelPickKeyContractTest` 源码断言+变异亲杀。
2. **MCP 数据面**：`McpMarket` 新增只读 `bubbleOverview()`（store 全集+mounted 实挂工具，**零网络**不做 healthCheck，UI 线程安全）；组状态=有实挂工具为启用；二级工具名 `toolShortName` 剥 `ext.<tag>.` 前缀。
3. **前向解耦**：modelStore(:13xx)/market(:16xx) 声明在 chips 区(:5xx) 之后（onCreate 顺序块）——provider 模式注入（`applyModelPick`/`modelRowsProvider`/`mcpOverviewProvider`），点击时取运行实例。

## 修法（实现清单）

- `MainActivity.kt`：旧「快速 ▾」模式抽屉整段替换为两级气泡（showModelBubble/showMcpBubble+openBubble）；气泡 PopupWindow（236dp/圆角14/elevation10/锚 chip 上方/水平跟随防越界 clamp/点外关/互斥）；chipsRow 包 HorizontalScrollView（隐藏滚动条）；两 chip 定宽 118dp 等宽；chip 文案 `模型名 · 模式 ▾`。
- `ChatChips.kt`（新，纯函数层）：modelRows/mcpGroupRows/toolShortName/chipLabel——UI 薄壳，数据整形可测。
- `McpMarket.kt`：+`bubbleOverview()`（只读）。
- goal/审批 chip 图标随旧 UI 移除，**goalModePref 业务与存储不动**（:3767 装配快照消费点保留，默认值 true）；恢复入口建议后续小单。
- 拍照 OCR/总结文件 chip 移除；`onCameraClick` 本体保留（composer 相机入口在用）。
- 不动 markstream/room.html（冻结项）✓；视觉黑白灰（isDark 双态）✓。

## 复验（全部实跑留痕）

| 项 | 结果 | 证据 |
|---|---|---|
| L1 编译 | `compileDebugKotlin`+`assembleDebug` BUILD SUCCESSFUL | gradle 输出（APK 19:51 出包，badging 已核） |
| L1 全量 | `testDebugUnitTest --rerun-tasks` **264/0/0** | app/build/test-results（UPG-19 基线 246+新增 18：ChatChipsTest 8+ModelPickKeyContractTest 3+McpMarketTest bubbleOverview 1 等） |
| L1 断言 | 契约：气泡写 `modelStore.setDefault` 同键；注入块禁平行 prefs；气泡链真实 invoke | ModelPickKeyContractTest 3 案绿 |
| **变异** | `applyModelPick` 改独立键（chatModePrefs 直写）→ **2 案必红**；还原→绿 | 变异跑留痕（MUTATED→FAILED→还原 SUCCESSFUL） |
| L2-① chips | 两枚 chip 容器实测 **各 309px=118dp 等宽**；HSV 结构+隐藏滚动条 | uiautomator bounds（[63,2113][372,2189]/[393,2113][702,2189]） |
| L2-② 模型气泡 | 一级 3 真实模型（当前 ✓+「deepseek · deepseek-v4-flash · 当前:快速」副文字；免 key 株未出现=keyName 非空正确）；二级「‹ Pro」+两模式行；点深度思考→气泡收起+chip 同步 | dump 全文+截图 upg20_l1/l2.png |
| L2-③ MCP 气泡 | 一级「暂无已安装工具包」（设备实况）+「打开工具市场」；tap→**MarketPageActivity topResumed** ✓ | dump+截图 upg20_mcp.png |
| L2-④ 互斥/跟随 | MCP 气泡开→点模型 chip→MCP 关（互斥）；气泡锚 chip 上方水平跟随+防越界（openBubble clamp）；点外关闭 ✓ | dump 对照 |
| L2-⑤ ModelSheet 对账 | **数据面铁证**：气泡切换后 root 实读 `model_store.json` isDefault=deepseek-v4-pro（ModelSheet 的 model.list 同文件同键同 ModelStore 实例） | 设备文件实读 |
| L3 journal 对账 | **未跑——转复核项**：设备 credentials 无 deepseek_key（AndroidKeyStore 加密无法离线注入），发送未触达装配快照（logcat 无 MOV-Mode）。代码路径闭环：:3767 装配读 chatModePref+ModelRegistry.current=气泡写的同源；恢复通道：配 key 环境发消息看 `MOV-Mode` log（mode/model/effort 三字段） | 如实申报，绝不假绿 |
| 门控链路 | PrivacyGate→登录页→MainActivity 链路实测通（root 注入 agreed+token 后直跳主界面） | dump |

## L2 补充说明

- PopupWindow focusable 的标准行为：点对方 chip **首击只关旧泡**（外点不穿透），二击开新泡——工单④「互斥」硬性满足（两泡不可能同开），demo 的「直切」体验差异已在报告申报。
- 「免费」标实现为「免 key」标（真实数据无 free 字段；keyName 空=免配置可用，如 Ollama）——不编造字段，申报差异。
- 设备 MCP 未装包 → 气泡空态「暂无已安装工具包」+市场入口（诚实空态，与 market 实况一致）。

## 撞车/协作注记

- 本单转派接手（用户拍板 @18:35，原认领 C 07:45 零提交 11h）；表 E21/H21+工单库已注记。
- 同日本会话先交付 UPG-19 R1（fa8fdd1+2c6b777+82a5322）；C 主线在 UPG-17（926d70b+1f532cb 进展正常），两线无文件交集。
- worktree gradle.properties 补四属性（UPG-16 挂账临时解法，gitignore 不入库）。

---

## R1 追加修复（feat/upg20 0f1b303 @22:35，验收通过后核查反馈、合 main 前主动修，待复验）

验收核查三缺陷（气泡空态假「›」/「打开工具市场」行裁切/空态死文案）+ 自查两连带：

1. **假「›」**：bubbleOpt else 分支条件化——onClick==null 的纯展示行（三处空态）不再带箭头。
2. **裁切**：openBubble 增加 `refit`（shell.re-measure + `popup.update(anchor, xoff, yoff, w, h)` 重锚到 chip 上方）；MCP 异步渲染回调与二级切换尾部均调用；并修 goL1 回一级用空占位缓存的连带缺陷（loadedGroups 回填最新数据）。
3. **空态引导**：MCP 空态改「暂无已安装工具包，去市场看看」可点直达市场（装机实证 MarketPageActivity resumed）。
4. **时序回归修正（自查）**：R1 初版重构把 build 挪到 measure/锚定之后，同步路径窗口=空壳高度（模型气泡只渲染首行）——build 恢复至 measure 前，装机实测 3 行全渲。
5. **顺手小修**（核查建议选项一并入收尾）：room.list 放行当前空房间 `filter { !it.blank || it.id == curId }`——新建后侧栏立即可见「新对话（当前）」，发消息后 markNonBlank 换真名，空房复用逻辑不变；Vue 侧栏视觉转复核（WebView 层 uiautomator 不可达）。

**复验**：L1 复跑 264/0/0 绿；装机：MCP 气泡内容齐全（空态引导+箭头合理+市场行完整在场）、空态点击跳市场实证、模型气泡 3 行全渲+切换链回归绿（chip 同步+json isDefault=pro 实读）。证据 R1 两图入 `证据数据\UPG-20\`。**已登记两个表**（表 H21 注记 + 工单库卡 R1 段）。

---

## R2 修复（feat/upg20 a126756 @23:05，设计师落账用户实测两条，待复验）

1. **模型二级气泡悬空**：showModelBubble 的 build 回调 `_` 丢弃 refit——一级(3行)→二级(2行)不重锚，底边悬空。修：refit 接回 + renderL1/renderL2 尾部重锚。**装机实证**：二级标题 y=1761 vs 一级 y=1637（窗口收缩 124px≈一行高、底部贴 chip 上沿）=重锚正确表现。
2. **黑块+不灵（疑 popup 裸窗口）**：预防性消除最大嫌疑源——MCP 气泡 Thread 异步渲染改**同步**（bubbleOverview 本地小文件读主线程微秒级，空壳窗口期不复存在，两气泡时序一致=同步渲染+refit 兜底）。若 R1 复测后仍现黑块再深挖（logcat 通道已在，设计师侧）。
3. L1 全量绿；装机复验：模型 L1 3 行/L2 二级完整+refit 实证/MCP 直出内容。

**已登记两个表**（表 H21 注记 + 工单库卡 R2 段）。
