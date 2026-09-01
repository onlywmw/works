# DELIVERY_UPG18_2026-08-30.md

> UPG-18 Android 死代码清理｜程序员 C｜交付 @2026-08-30 02:20
> 分支 `feat/upg18` @ **ff46480**（已 push origin）
> 基线：31769a0（动工当天 origin/main；本地 main 与 origin/main 一致）

## 〇、总览

| 项 | 值 |
|---|---|
| commit（5 个，均可独立回滚） | `4e0d37d` 批1 dsh 占位 29 文件｜`ee6df74` 批2 整文件级｜`26d7331` 批3 零散死函数｜`1f00b73` 批4 死资源/权限｜`ff46480` 批2修正（恢复 McpToolProvider，测试证伪） |
| 删除规模 | 29 整文件 + 5 整文件 + 2 文件内死层级 + 17 个零散死函数/成员 + 5 drawable + 2 权限；净减源码约 1300 行 |
| L1 | compileDebugKotlin/compileDebugUnitTestKotlin 绿；`:app:testDebugUnitTest --rerun-tasks` **376/0/0（1 skipped）**；变异亲杀 2 项均必红 |
| L2 | 真机 21770d7d（24018RPACC/Android 16；**emulator-5556 不在线**，以该真机执行）：冷启动 TotalTime 926ms；主界面正常、MCP 市场页正常、工作流链（handler+Runner 初始化）正常、OCR（相机入口）正常 |
| L3 | APK 55,351,185 B → 55,282,053 B（**-69,132 B / -0.125%**，未达 ~5% 预期，原因见 §8）；全库重扫删除项零命中 / 除名项全部存活 |
| check-token-effect | 通过（批2/批3 补了 Token/KV 申报后复跑） |
| 已登记两个表 | ✅ 见 §9（先表后库） |

## 一、动工当天复核（以 31769a0 重扫定稿）

方法学同设计师/验收员：全库（main+test）grep「定义处之外零命中」+ 包级 import/全限定引用扫描 + 资源/权限引用扫描。除名五项（recordSearchHits/recordCoverHits/phoneTail/SessionReference/ic_check_white）全部复核为**在用**，未入删除清单。

**复核结论 vs 派单清单**：29 占位/5 整文件/12 零散函数/资源权限全部维持死亡；行号漂移照实处理（`togglePresentationMode` 派单 :6266 → 实际 **:6397**；其余与派单一致）。

**复核发现的派单漏项（2 处，本单处置）**：

1. **RetryPolicy.kt 顶层常量是活的**——`DEFAULT_MAX_RETRIES/DEFAULT_INITIAL_DELAY_MS/DEFAULT_MAX_DELAY_MS/DEFAULT_JITTER_RATIO` 被 `AgentLoop.kt:385-389` 以全限定名引用（派单「全自引用」判断不成立；类 `RetryPolicy`/`RetryPolicyConfig`/`resolveRetryPolicy` 等其余内容确死）。处置：4 个常量**值不变**迁入 `DurableRetry.kt`（重试实走点），AgentLoop 引用无需改动；删除 RetryPolicy.kt 其余 155 行。
2. **McpToolProvider.kt 非纯占位**——承载 `sensitiveTools` 敏感名单（sms.recent/pay/identity/location 等），是 `DeviceObsidianContractTest`「**敏感名单四处镜像对齐且含等价变体**」安全契约的四处之一（+McpMarket/McpExtDiscovery/McpToolScheduler）。删除后该测试 NoSuchElementException。处置：**整文件恢复**（`ff46480`），安全契约 > 瘦身；未删断言保绿（红线 3）。

**复核发现但不在清单（未删，留验收定夺）**：
- `Tools.kt` `PreToolDecision`（:199-202）亦全库零引用——与 `PostToolDecision` 同层级同死，但派单只列 PostToolDecision，本单严格照单执行，未删。

## 二、批1 · dsh 占位文件（29 个）`4e0d37d`

`app/src/main/kotlin/com/hermes/dsh/` 下 acp/api/attachment/boot/client/coderuntime/credentials/e2b/extensions/feedback/fs/hooks/host/identity/lsp/plan/preset/runtimediagnostics/sandbox/schedule/settings/shell/skill/storage/subprocess/terminal/typert/web/workspace 各 1 文件（含 plan/Plan.kt）。包级 import/全限定引用/字符串路径全库零命中（main+test），互引仅存在于被删集内部。编译绿。

## 三、批2 · 整文件级 `ee6df74`

- 删：`llm/RetryPolicy.kt`（159 行，常量迁移见 §1）、`session/persistence/sqlite/SqliteStore.kt`(320)+`SqliteSchema.kt`(275)（**sqlite-android 依赖保留**——Fts5QueryEngine 在用）、`java/.../NoteProvider.kt`(46)、`mov/tools/McpToolProvider.kt`（随后由 `ff46480` 恢复，见 §1-2）
- `Tools.kt` 死层级：`PostToolDecision`（接口+Accept/Block/Replace/AddContext 4 子类）、`ToolCallView`（接口+3 子类）、`ToolResultView`（接口+6 子类）整删；**连带**删除接口默认方法 `presentCall/presentResult`（全库零调用零实现，返回类型随视图接口删除后无法保留；验收员修订①「整层级零使用」）。`ToolResult` 注释中的 `@{link}` 同步改为指向 ToolDefinition。
- `BuiltinMcpTools.kt:11-12` 死 import（ToolCallView/ToolResultView）删；`LlmTypes.kt` 5 个死 Block 数据类（TextBlock/ReasoningBlock/ImageBlock/ToolCallBlock/ToolResultBlock，:33-57）删；`Repair.kt:7` 死 import（ToolCallBlock）删。`ImageAttachmentRef` 在用（MainActivity/ImagePayload/EventCodec/测试），保留。

## 四、批3 · 零散死函数 `26d7331`

| 符号 | 文件:行（复核后） | 状态 |
|---|---|---|
| `displayPath` | MovStorage.kt:307 | 零引用 |
| `fdp` | LoginActivity.kt:485 | 零引用 |
| `sanitized` | McpServerStore.kt:46 | 零引用 |
| `bool` | MiniJson.kt:93 | 零引用 |
| `inject` | AgentLoop.kt:149 | 零引用 |
| `Phase.Maintenance` | AgentLoop.kt:101 | 零构造不可达分支 |
| printStackTrace | AgentLoop.kt:234 | 全库唯一 → `Log.e("MOV-Turn", "turn error", e)`（保留原 Log.i） |
| `bluetoothOn/bluetoothOff/wifiSet/suExec` | SystemControlProvider.kt:53/:71/:89/:146 | 无 handler 注册死链；bluetoothStatus/wifiStatus 等保持 |
| `declOf` | ToolRegistry.kt:33 | 零引用 |
| `pendingList` | McpToolScheduler.kt:78 | 零引用 |
| `removeEvent` | Fts5QueryEngine.kt:69 | 零引用 |
| `errorChain` | Error.kt:90 | 零引用 |
| `isHarnessError` | Error.kt:115 | 零引用 |
| `togglePresentationMode` | MainActivity.kt:6397 | 注释自述 UI 已移除，零引用 |

## 五、批4 · 死资源/权限 `1f00b73`

- drawable 删 5：ic_ability/ic_gear/ic_history/ic_market/ic_new_chat（app/src 全域零命中；UPG-13 后新引用复扫无）
- Manifest 删：`CHANGE_WIFI_STATE`、`BLUETOOTH_ADMIN`（wifiSet/蓝牙写整链已删）；**保留** `BLUETOOTH`（bluetoothStatus 在用）、`BLUETOOTH_CONNECT`、`ACCESS_WIFI_STATE`
- `ic_check_white` 除名项复核在用（bg_check_agree.xml:16）未动

## 六、批2修正 · 恢复 McpToolProvider `ff46480`

测试证据驱动回退：`DeviceObsidianContractTest`（敏感名单四处镜像）证明该文件承载安全契约数据，删除后测试红且不可删断言（红线 3）。恢复为基线原样（零改动），其余批不受影响。

## 七、L1

- 编译：`:app:compileDebugKotlin`、`:app:compileDebugUnitTestKotlin`、`:app:assembleDebug` 全绿
- 单测：`:app:testDebugUnitTest --rerun-tasks` → **BUILD SUCCESSFUL，376 tests / 0 failures / 0 errors / 1 skipped**（test-results XML 汇总）
- 变异亲杀（均为临时变异→必红→恢复，工作区复净）：
  1. 移除 `MemoryMcpTools.kt:287` `MemoryLifecycle.recordSearchHits(...)` 调用 → `MemoryAggregatorTest > 链路断言...` **FAILED**（证明「误删已接线符号必红」契约锚有效）
  2. 临时删 `ic_check_white.xml` → aapt `resource drawable/ic_check_white not found` **FAILED**（证明「误删在用 drawable 必红」）

## 八、L2 真机 + L3 体积/重扫

**L2（真机 21770d7d，Android 16）**：
- 冷启动：`am start -W` TotalTime **926ms**（force-stop 后冷启动，无 crash/ANR）
- 主界面：聊天页正常（DeepSeek V4 Flash 模型 Tab/MCP 工具/输入框/侧边栏：MOV 用户 ****0000 已登录态）
- 抽查 MCP 市场（MarketPageActivity）：「本地|市场」tab、本机能力总览 **30 工具 / 4 来源 / 3/5 钉选**、内置能力（设备控制 13 工具）、生活场景·12306（2 工具）、笔记 Obsidian（7 工具 + 未授权提示）、系统基础能力（8 工具）全部渲染正常；1 个不可达/未授权包提示正常
- 抽查工作流：`workflow.run/resume/status` 三个 handler 注册 + WorkflowRunner 初始化（filesDir/workflows + opener + vaultPlain/approveVaultRead）在冷启动中执行无异常
- 抽查 OCR：侧边栏「相机」入口正常打开系统相机（拍照/闪光灯/变焦控件齐全）

**L3 体积（同口径对比：基线临时 worktree @ 31769a0，均 clean 全量 assembleDebug）**：

| 口径 | 基线 | 新 | 差异 |
|---|---|---|---|
| APK 文件 | 55,351,185 B | 55,282,053 B | **-69,132 B（-0.125%）** |
| zip 条目压缩总和 | 54,985,481 B | 54,920,551 B | -64,930 B |
| 条目未压缩总和 | 90,827,718 B | 90,673,497 B | -154,221 B |

**未达派单「预期瘦 ~5%」**。原因：删除对象为 Kotlin 源码（~1300 行，dex 增量约 150KB 未压缩）与 5 个小型 drawable XML；APK 体积大头是 assets（markstream/前端约 30MB+）与第三方库 dex（单个 11MB 级），源码删除对 55MB 级 debug APK 影响约 0.1%。另注：主仓自建 APK（60.4MB）含 5.3MB APK Signing Block 差异（构建环境签名差异），不可比，本报告以同环境 clean 构建为准。
**dex 分包号差异**（classes15/17 互换等）为 D8 多 dex 桶分配非确定性，内容对比以未压缩总和为准。

**L3 全库重扫**（同方法学复跑）：
- 删除项：29 占位包级引用、RetryPolicy 七类/解析函数、SqliteStore/SqliteSchema/NoteProvider/McpToolProvider、PostToolDecision/ToolCallView/ToolResultView/presentCall/presentResult、5 个死 Block（Repair.kt 连带）、17 个零散符号、printStackTrace、5 drawable、2 权限——全部 **零命中**（唯一误报：`fun inject(` 命中 `injectAgentLayer`/`injectionBlock` 子串，AgentLoop.inject 已删无残留）
- 除名项：recordSearchHits 13 处 / recordCoverHits 10 处 / phoneTail 8 处 / SessionReference 21 处 / ic_check_white 1 处——全部 **存活**
- 保留项：BLUETOOTH/BLUETOOTH_CONNECT/ACCESS_WIFI_STATE 在 Manifest、DEFAULT_RETRYABLE_CODES 在 ErrorClass.kt、DEFAULT_MAX_RETRIES 等 4 常量在 DurableRetry.kt、ImageAttachmentRef 在用

## 九、红线与登记

- 红线核查：①只删不改逻辑——唯一「改」为 printStackTrace→Log.e（派单明确项）与 McpToolProvider 恢复（测试证伪）；deleteRoomConfirm 未动 ②drawable 删前复核通过 ③测试未删断言（DeviceObsidianContract 全保留；McpToolProvider 恢复）④除名项零接触 ⑤Token/KV：**无影响**（删除死代码不改请求链行为），`node scripts/check-token-effect.mjs` 通过
- 已登记两个表（先表后库）：
  - 工单表.xlsx UPG-18 行：程序员列 `✅UPG-18 完成`＋备注 `feat/upg18 ff46480（报告 DELIVERY_UPG18_2026-08-30.md）`
  - 工单库.md UPG-18 卡状态：「程序员✅完成，待验收」

## 十、遗留/观察项

1. `Tools.kt PreToolDecision` 零引用未删（不在派单清单，建议验收员确认后补入或单独立单）
2. 主仓自建 APK 存在 5.3MB Signing Block 反常（构建环境/签名配置差异，非本单引入）——建议后续排查构建产物洁净度
3. 临时基线 worktree `mov-upg18-base`（31769a0）建议验收员复验 APK 体积时使用，验后可删
