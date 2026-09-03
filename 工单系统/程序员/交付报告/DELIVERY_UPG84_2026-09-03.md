# UPG-84 · 模式收敛 5→2 · 交付报告

| 项 | 值 |
|---|---|
| 单号 | STD-UPG-84（派单 v2，content_sha256=b279e978，认领登记在案） |
| 标题 | 工具面呈现模式收敛：五模式退役 → 经典/极简两态框架（A1-A5） |
| 签字程序员 | Claude（wmw0027） |
| 认领 | 2026-09-03 08:04 · worktree `mov-upg84` · branch `feat/upg84` |
| 基线 | origin/main `5cf546d`（UPG-79 已合入） |
| 交付 | 2026-09-03 · APK `app/build/outputs/apk/debug/app-debug.apk`（56.1MB） |
| 改动量 | 16 文件，+287 / −755（净 −468 行） |

---

## 〇、交付绑定（P0-2）

- delivery_id: **DEL-UPG84-20260903-001**
- code_commit_sha: `e95472f0d57a70b0fd78ac584eec7ec228b78748`（feat/upg84 tip；`git log`=UPG-84 模式收敛 5→2：工具面固定全量 + codeSdk/set_mode 退役 + 快速深思单选收敛）
- artifact_sha: `3f658e92e107324d2ef2e3a08d3d7da882de2fa6fd7d45733ba246c16b6a13e9`（app-debug.apk sha256）
- evidence_manifest_sha: `c137b1bf1254476213fbfdbfd8f6ffe2c78eb91d767eb9137ea92ed0d04d4611`（`程序员/交付报告/DELIVERY_UPG84_2026-09-03_manifest.json`，4 条 E-001~E-004；`审验.py --manifest` 复验 ok:True）
- standard_id: STD-UPG-84-v2（content_sha256 b279e978=派单所引，含 A5 快速/深思收敛）
- verify-hash 登记前实测 `审验.py --verify-hash feat/upg84 e95472f --repo mov-upg84` → **HASH_REJECT <not-ancestor>**（commit 未合 origin/main 故非祖先；合 main 后复跑闭环，红线 23 如实留证）

## 一、改动清单（按派单 A1–A5）

### A1 + A1b · 工具面固定全量 + 顶部按钮断循环（MainActivity）
- `presentationMode` 成员 / `readPresentationModePref()` / `persistPresentationMode()` / `mov_presentation_mode` prefs 全删——不再持久化呈现模式。
- `rebuildAgentTools()`：五模式 `when` 过滤 → 固定 `mcpHandlers.keys.filter { it !in uiOnly }`（**全量**）。UPG-76 READ-only 收缩分支原样保留（红线零回归）。
- Boot log「工具面模式: …」→「工具面=全量（…）」。
- 顶部「极简模式」钮保留为**唯一**模式切换入口（A1b）：断五模式循环，点击 = toast「经典模式（工具全量）。极简模式即将上线」+ appendLog 留痕（真两态开关归极简批阶段 1，本单不建——红线 4）。
- 删除 `modeLabel()` / `isHardwareTool()` / `togglePresentationMode()` / `codeTools` / `codeSdkFrequent()` / `buildSdkSection` 装配段。

### A2 · code 模式 SDK 匝道段 + codeTools 删除（能力面 tool.help 保留）
- MainActivity codeSdk 注入段（`if CODE → ToolSdkGenerator.buildSdkSection` + 配置态 version/members 写入）整删。
- systemPrompt 头部「当前工具面模式：…」声明删除（见二 Token 节）。
- `ToolSdkGenerator.kt`：删 `buildSdkSection`/`SdkSection`/`sdkVersion`/`DIRECTORY_TOKEN_BUDGET`/`signatureOf`/`SUMMARY_TOKEN_LIMIT`/`shortDescription`；**保留 `toolHelpDoc`/`nearSuggestions`/`outputHint`/`paramsBrief`/`jsonLike`/`TOOL_HELP_TOKEN_LIMIT`**（能力零缩减红线：tool.help 直呼文档仍在）。
- `ChatChips.chipLabel` 死代码删除。

### A3 · presentation.set_mode 退役 + 全链路名单同步 + 系统提示清理
- `mcpHandlers["presentation.set_mode"]` handler 删除；`presentation.mode` 只读查询保留，恒返回 `mode=both`（AI 能查不能改）。
- uiOnly 名单（`McpToolScheduler.kt:204`）移除 `"presentation.set_mode"`。
- 生成数据同步（经 **UPG-78 生成器**而非手改）：删 `docs/ApprovalRegistry.categories.json` 人工分类条目 → 删 `app/build/inventory/tools.txt` 强制重收集 → `ApprovalRegistryGeneratorTest` 重生成 `PermissionRegistryData.kt`/`ApprovalRegistry.json`/`ApprovalRegistry.md`（set_mode 三处 0 残留，presentation.mode 仍在册，`grep -c` 实证）。
- systemPrompt「当前工具面模式：…」声明删除。
- 未触碰：`ApprovalLogic.kt:155` `tool.contains("presentation.set_mode") -> "切换展示模式"` 审批面文件保持零改动（红线）。该分支现为运行时死代码（工具已不存在），标注留待批清理。

### A5 · 快速/深思收敛 + reasoning 绑 UI 模式恒档
- 快速/深度思考单选 UI 退役：chips 注释、`var currentModeName`、`val modeOptions`、模型气泡二级 `renderL2`、`applyChatModePref()`、`chatModePref()`、`ChatModeResolver` 全删。
- 模型气泡 → **单级直切**（点模型即切换，写 ModelSheet 同键 `setDefault` + `syncModelRegistry`，`applyModelPick?.invoke(row.id)` 字面量保留——`ModelPickKeyContractTest` 源码锚不回归）。
- 模型 chip 文案恢复纯模型名（`shortModelName`），不再带「· 模式」。
- `ChatMode.kt` 保留枚举、删 `ChatModeResolver`；`ChatChips.modelRows` 去 `currentModeName` 参数与 `extraTag` 标签位。
- `runChat` reasoning 恒档：`val mode = ChatMode.DEEP; val isDeep = true`（经典=当前唯一有效画面=深度思考 high；极简=快速/off 分支随极简批阶段 1 点亮——红线 4 注释在案，非自动分类）。

---

## 二、Token / KV 节（派单要求）

**Token（systemPrompt 净变化）**
- 删：`"当前工具面模式：" + modeLabel() + "。"` 前缀（默认 both 态 ≈ 12–16 token/请求）+ code 模式 `codeSdk` 整段文本（旧上限 ≤7000 tokens）的装配与条件分支。
- 新 systemPrompt 首部（MainActivity:5080 起）：`"你只能调用以下工具：" + agentToolSchemas.joinToString(","){it.name} + "。调用列表外的工具会返回 TOOL_NOT_FOUND（工具不存在），不要臆造工具。"`（身份/审批策略/模型声明段不变）。
- 结论：默认路径每次请求请求前缀净减约 12–16 tokens；code 模式最大注入档（≤7K）整体消失。UI 面现在无任何按模式拼长文档的分支。

**KV（配置态/存储键变化）**
- 无新增 SharedPreferences 键。
- `mov_presentation_mode`（呈现模式持久化）读写代码全删；设备上旧残留文件无消费者（无害，随应用数据清理消失）。
- `mov_chat_mode.xml` 的 `"mode"` 键：读取函数 `chatModePref()` 删除（语义固定回落）；`"goalmode"` 键及其读写保留（K 列，审批/goal 语义零改动）。

---

## 三、测试处置清单（A4，无 skip、逐个列）

| 处置 | 文件 | 理由 |
|---|---|---|
| 删除 | `CodeModeWiringContractTest.kt` | E3 装配点（code 分支调 buildSdkSection）整体消失；其 outputHint 防回归锚已由 ToolSdkGeneratorTest 覆盖 |
| 删除 | `Upg27FixContractTest.kt` | 6 锚全部钉在被退役对象（toggle 持久化/恢复/五模式/ufic set_mode） |
| 删除 | `ChatModeTest.kt` | 只测 `ChatModeResolver.resolve` 恒等（Resolver 已退役） |
| 修改 | `ChatChipsTest.kt` | 去 `currentModeName` 入参 4 处、extraTag 断言、chipLabel 测试段（144→129 行） |
| 修改 | `ToolSdkGeneratorTest.kt` | 删 SDK 节结构/声明生成化/常用集签名层/同源 SDK 侧/summary fail-loud 5 测；同源断言裁为仅 toolHelp；保留 tool.help 契约/output 诚实化/三分执行层/P3 近邻对账（204→126 行） |
| 新增 | `Upg84ModeConvergeContractTest.kt` | 6 个源码锚：①过滤与枚举全退役 ②SDK 匝道退役+tool.help 存续 ③set_mode 全链路退役+只读查询存续 ④单选/prefs/Resolver 全清+恒 DEEP ⑤顶部钮断循环占位 ⑥ChatChips 单级（93 行） |
| 未动 | `ModelPickKeyContractTest.kt` 等 | 与工具面收敛无涉（applyModelPick 键契约保留） |

---

## 四、变异亲杀（2 个 kills，实测红→还原绿）

| 变异 | 注入 | 结果 |
|---|---|---|
| K1 模式过滤/枚举回潮 | `Tools.kt` 注入 `enum class ToolPresentationMode {…}` | 锚①「工具面固定全量」FAILED → 还原后绿 |
| K2 code 模式 SDK 注入回潮 | `MainActivity.kt` 注入 `private val codeSdk = ""` | 锚②「SDK 匝道段退役而 tool help 存续」FAILED → 还原后绿 |

还原后 `Upg84ModeConvergeContractTest` 6/6 绿（`BUILD SUCCESSFUL`）。

---

## 五、测试结果

- `:app:compileDebugKotlin` ✅ · `:app:assembleDebug` ✅
- 全量 `:app:testDebugUnitTest --offline`：**724 completed, 2 failed, 1 skipped**
  - 本单相关测试（锚 6 + ChatChips + ToolSdkGenerator + ApprovalRegistry 生成器 + 审批面全绿）。
  - **2 FAILED = pre-existing**：`AppearanceContractTest` L1-10 / M-U50-5（appearance 消费页「选择页禁写死字号」「预览卡 pointer-events:none」断言）。断言读取的 appearance 源文件本单零触碰（git status 佐证），main 基线同红，非本单回归。
  - **1 skipped = pre-existing @Ignore**：`SceneLiveQueryTest`（真机购票场景验证，基线上即 @Ignore）。
- ApprovalRegistry 重生成后 `rows` 区间断言（190–220）通过，set_mode 行消失。

---

## 六、真机冒烟证据（平板 192.168.2.3:5555）

APK 安装成功、启动无崩溃（进程存活无 FATAL/ANR）。证据文件：`程序员/UPG84-evidence/`。
- `home_ui_dump.xml`：模型 chip 显示「DeepSeek V4」**纯模型名**（无模式后缀）；「MCP 工具」chip 在；顶部「极简模式」钮 content-desc 在（右上 1922,86..2007,171）。
- `bubble_ui_dump.xml`：点模型 chip 弹出**单级**气泡——标题「切换模型」+ 模型行（DeepSeek V4 Flash ✓当前 / V4 Pro / exp），**无「快速/深度思考」单选、无二级返回**（`含快速/深度思考/返回 = False`）。
- `topbar_tap.png` / `homescreen.png`：点击顶部钮后画面正常（toast 因截图时读图不可用未逐帧留痕，点击后无崩溃即接线成立；toast 文案由源码锚 ⑤ 固定）。

---

## 六·补 共享面影响清单 + coverage_status（红线 24 · 设计师追认补节 @2026-09-03）

共享面影响清单：
- 改动点：工具面装配（`rebuildAgentTools` 固定全量）+ 系统提示面（codeSdk 段删除 + 模式声明删除）+ 登记面（presentation.set_mode 退役 + 生成数据重生成）+ 顶部按钮（五模式循环断开改两态占位）
- 影响下游：① LLM 工具面=全量（both），较旧 code prefs 设备**能力只增不减**（零缩减红线由 Upg84ModeConvergeContractTest 6 锚契约锁定）；② MCP 面：presentation.set_mode 返回 TOOL_NOT_FOUND（退役=预期行为变更，纵深防线 permission.set_mode 保留）；③ 系统提示：codeSdk/curl 教学段与模式声明移除——跨会话前缀变化一次（Token/KV 见 §二）

coverage_status: **FULL（设计师裁决追认）**
- 依据：「能力零缩减」由 6 锚契约测试锁定（工具面=全集计数/Sdk 零残留/set_mode 退役/快速深思恒档/审批面零改动/生成数据同步）+ 审验独立复核三 grep=0 残留 + 全量 724/2/1 一致（2=基线预存）；本单无「未测维度可能已坏」面（无新增运行时分支，纯收敛删除+恒档切换）
- 库侧引述订正：交付块「coverage FULL 见报告 §六」系引述失实（§六=真机冒烟证据），以此补节为准（设计师B 订正 @2026-09-03）
- decided_by: 设计师B ｜ decided_at: 2026-09-03

## 七、留痕 / 待批

1. `ApprovalLogic.kt:155` `presentation.set_mode` contains 分支 → 审批面零改动红线未碰，现为运行时死代码，建议后续批随审批文件一起清理。
2. AppearanceContractTest 2 项 pre-existing FAIL 与 UPG-84 无涉，建议挂账由相应模块单处理。
3. 旧设备残留 prefs（`mov_presentation_mode`/`mov_chat_mode mode` 键）无消费者，不迁移不清理属预期（回归场景：旧 code prefs 启动 → 新版不读 → 自动全量工具面，符合派单 L3 意图）。

---

## 八、已登记两表（分支交付后执行）

- 本分支：`feat/upg84`（mov-upg84 worktree），基线 `5cf546d`。
- 已执行登记序列（2026-09-03）：库交付块含 `DEL-UPG84-20260903-001`+code/artifact/manifest 三重 hash → `sync-orders.mjs --check` diff=0 → `--sync` 70 卡→70 行投影（表 I 列 delivery_id=DEL-UPG84-20260903-001，备份已归档）→ `审验.py --manifest` 复验 ok:True → `审验.py --verify-hash` not-ancestor 留证（未合 main，合后复跑闭环，红线 23 如实）。
