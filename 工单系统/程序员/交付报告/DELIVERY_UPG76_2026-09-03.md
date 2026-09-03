# DELIVERY UPG-76 · 审批预审单模式（预审单执行绑定 + 扫描编排与审批单 UI；S4 §8.3 工具级落地）

> 程序员（AI wmw0027）｜ 2026-09-03 ｜ 分支 `feat/upg76`（worktree `mov-upg76`，基底 `origin/main a7736b3`）｜ commit `ed5088c`（本地，未合 main；合 main 只归设计师）
> 验收标准：`STD-UPG-76-v1`（content_sha256=`f370253ef6968561b631352066fae38348876cda332c4b244cdad4974f1cc656`）
> 派单：设计师B 2026-09-03（`UPG-76_审批预审单_派单_2026-09-03.md`）｜ 方案：v1 概览 + v2 增补四钉子（触发口径=用户拍板选项 2「先扫，只有 ≥1 写才续扫」）
> **已登记两个表**（工单表.xlsx + 工单库.md）：工单表.xlsx 经 sync-orders.mjs --sync 单向生成；「交付」登记块为库侧写入

## 〇、交付绑定（P0-2）

- delivery_id: **DEL-UPG76-20260903-001**
- code_commit_sha: `ed5088c27b13ec7b612c685eff4ba786ca47e3b8`（feat/upg76 tip；`git log`=UPG-76 审批预审单模式：预审单执行绑定 + 扫描编排与审批单 UI）
- artifact_sha: `58715dc700967ff4edaacd578eaf78767ec7798f0b633364354d6eeb3963fcd8`（app-debug.apk sha256）
- evidence_manifest_sha: `b4da221e868a3aab2264a1691e1d13517c1199a7e3e0f100163b3467ac1dec63`（`程序员/交付报告/DELIVERY_UPG76_2026-09-03_manifest.json`，9 条 E-001~E-009；`审验.py --manifest` 复验 ok:True）
- standard_id: STD-UPG-76-v1
- verify-hash 登记前实测 `审验员\审验.py --verify-hash feat/upg76 ed5088c` → **HASH_REJECT <not-ancestor>**（commit 未合 main 故非 origin/main 祖先；合 main 后复跑闭环，红线 23 如实留证）

## 一、交付物（9 文件 / +1415 / -4；纯 JVM 机制件 + MainActivity 对话面编排接线）

| 产物 | 路径 | 要点 |
|---|---|---|
| 批准清单存储 | `app/src/main/kotlin/com/hermes/dsh/tools/PlanApprovalStore.kt`（新增） | Group 双状态机 pending→partially_decided→completed\|expired\|stale × Node approved\|rejected\|blocked\|expired\|stale（语义照执行引擎 §8.3，实现落工具级，exec-engine 运行时不接线）；键=toolName+canonical(args) sha256（**复用 mov-exec-engine CanonicalCodec**，禁第三份）；only-once/MONEY 永不入簿（入簿 require 抛 = 失败关闭）；单次执行 runsLeft=1 原子扣减；TTL EXPIRED≠REJECTED 不复活；consumeIfApproved：HIT 放行扣减 / DENIED（单上已决否，阻断下游）/ MISS 计划外 / RUNS_EXHAUSTED / EXPIRED |
| 扫描/分级机制件 | `app/src/main/kotlin/com/hermes/dsh/tools/PlanApprovalScan.kt`（新增） | readOnlyToolNames 扫描面收缩（category=="read" && approvalMode=="free" && !only-once——fail-closed 宁缺勿放）；gradeOf 审批级（MONEY>WRITE>READ）；≥2 审批级出单门槛 |
| MONEY 判定源 | `app/src/main/kotlin/com/hermes/dsh/tools/MoneyTools.kt`（新增） | MONEY 精确名单 + payment.* 前缀兜底；MONEY 永不预批（执行到该步实时逐笔确认） |
| 执行绑定下沉 | `app/src/main/kotlin/com/hermes/dsh/tools/ApprovalService.kt`（改） | request() 豁免序 turn→goal→remembered→**UPG-76 预审单绑定**→FIFO 弹窗；HIT→allowed-plan 审计放行 / DENIED→rejected 阻断下游（不重复弹窗）/ else 落 FIFO 转新 ASK；planner 钩子只出单不裁决；isGranted 收 allowed-plan（only-once 只认 allowed-once，UPG-68 语义零动） |
| 触发口径编排 + 审批单 UI | `app/src/main/java/com/mov/android/MainActivity.kt`（改，纯 CRLF） | runChat arming（try/finally 解除，MCP 面不受影响）；首个审批级 ASK 到 request() → 切 READ-only 面（rebuildAgentTools 单点 schemas+allowedTools 同源收缩）→ 嵌套独立一次性会话补全轮（专用计划提示词，不回放主会话足迹）→ 解析分级 → ≥2 审批级含可批行 → 审批单 UI（逐条勾选默认批 + 批量批准 + MONEY 行禁勾明示「执行到该步单独实时确认」）+ createPlan+submitDecision 落簿；取消/超时不建单回退现行 FIFO |
| 依赖 | `app/build.gradle.kts`（改） | +`implementation(project(":mov-exec-engine"))`（复用 CanonicalCodec 参数指纹；engine 纯 JVM 零依赖不反向依赖 app） |
| JVM 测试 | `PlanApprovalStoreTest`(15)/`PlanApprovalBindingTest`(11)/`PlanApprovalScanTest`(6)（新增） | 32 用例 = 变异锚 1-5 亲杀载体（见 §四） |

commit：`ed5088c`（`git log --oneline` 首位；工作树已净——见 §六 演示数据还原）

## 二、施工要点（两阶段；触发口径=用户拍板选项 2）

- **阶段一 · 执行绑定**：`consumeIfApproved` 下沉在 remembered 检查之后、FIFO 弹窗之前——命中放行+扣减（跳过弹窗，审计 approval/asked+decided 成对，outcome=allowed-plan）；单上已决否 REJECTED/BLOCKED 节点 → DENIED → outcome=rejected（不重复打扰，「阻断下游」）；计划外/耗尽/过期 → 落原 FIFO 当场转新 ASK。MONEY/only-once 在 Store.consumeIfApproved 首行直返 MISS（双保险，入簿侧已拒）。
- **阶段二 · 触发口径编排**（**不**给每条消息加扫描轮）：首轮全工具面正常跑（纯只读/闲聊零增量）→ 运行中**首个非 only-once 非 MONEY 的 ASK 到达 request()** → planner 钩子暂停本调用 → `preApprovalScanActive=true` + rebuildAgentTools()（schemas+allowedTools 同源收缩 READ-only）→ 嵌套 `ReactLoopAgent`（一次性 throwaway Session，不回放主会话足迹、不落持久化；60s 超时兜底）跑**计划补全轮** → finally 还原全工具面 → 解析补全产出 + 当前步**以真实 PendingInfo.args 前置**（节点键=真实参数，保证本调用可被清单裁决）→ 分级计数 ≥2 审批级（WRITE/MONEY）**且**含可批行 → showPlanSheet 出单 + 落簿；恰好 1 个/不达门槛 → 不建单，本调用与后续回退现行 UPG-75 单步弹窗。每 run 单次守卫（settled/active 双 flag），finally 解除 arming 保 MCP 面行为不变。
- **审批单 UI**（复用 UPG-75 行件 apprIconFor/apprHumanPhrase/apprArgsSummary）：步骤行「人话 + 工具名 + 参数脱敏摘要」；逐条 CheckBox **默认全批**；MONEY 行 `isEnabled=false` 禁勾 + 明示「含支付类操作——不可预批：执行到该步时单独实时确认」；「批准勾选的步骤」=部分批准、「全部拒绝」=整单否（无 approved → Group completed 无可执行）；取消/60s 超时 fail-closed=不建单回退弹窗。落簿唯一入口 = `PlanApprovalStore.submitDecision`（禁 UI 私设状态字段）。失败语义=阻断下游，UI/文案不承诺「撤销」（§8.1）。
- **执行期裁决**：批准后主 agent 恢复执行；后续每步 dispatch 前 consumeIfApproved——已批且参数一致步骤 → HIT 放行不弹窗；用户未勾（Reject 落簿）步骤 → DENIED 阻断下游；模型临时新增/参数漂移步骤 → MISS 转新 ASK 实时弹窗（宁缺勿放，安全方向）。

## 三、红线守约

1. **UPG-68 安全语义零改动**：only-once（vault.get/browser.*）只收 allowed-once、不吃清单不吃豁免；MONEY（payment.*）永不预批、执行期实时逐笔；fail-closed 不变；scheduler/guard.decide 单源判定未动（UPG-77 不动）。
2. **不造第三套**：Group/Node 状态语义照执行引擎 §8.3（实现落工具级，UI 零私设状态字段，不接线 exec-engine 运行时——能力级接线=S5+ 另单）；参数指纹**复用 mov-exec-engine CanonicalCodec**（`CanonicalCodec.canonical + canonicalHash`，PlanApprovalStoreTest `argHash与engine CanonicalCodec一致性` 端到端断言，禁第三份）。
3. **不动 UPG-75 呈现层语义**：FIFO/弹窗/通知/待办只复用不改语义；未装配 planStore（MCP 面/默认）行为与 UPG-75 完全一致（`planStore未装配时全走FIFO弹窗` 测试锚）。
4. **不动 exec-engine 现有类**；MainActivity.kt 纯 CRLF（实测 8266 CRLF / 0 bare LF / 100%）。
5. 提示词**执行模式 :5358「禁止输出计划文本」原样保持**——补全轮用嵌套独立 agent + 专用计划提示词，主 agent 从不进入「扫描模式」，无需原地反转（设计取舍见 §七·遗留申报）。

## 四、验证证据（亲跑）

- **L1① 定向**（`testDebugUnitTest --tests "com.hermes.dsh.tools.*"`，XML 计数）：UPG-76 新增 3 套件 **32 用例全绿**（Store 15 / Binding 11 / Scan 6）+ ApprovalService 系回归 7 套件 44 用例全绿（ApprovalExperienceSurface 1 / ApprovalExperience 8 / ApprovalQueue 4 / Goal 5 / Turn 3 / OnlyOnceGuard 8 / PermissionGuard 15）——含 UPG-68/75 语义零回归。
- **L1② 变异亲杀 5/5 全红→还原复绿**（本会话逐锚亲跑：篡改源码副本 → 对应套件红 → cp 还原 → 复绿）：
  - 锚1 **request 清单查询短路**（`when(c)=planStore?.consume...`→`when(c)=null`）→ Binding **4 红**（清单命中放行/耗尽转 ASK/planner 出单获批/单上被拒）→ 还原复绿；
  - 锚2 **删除扣减**（HIT 不 copy runsLeft-1）→ Store 1 红 + Binding 2 红 = **3 红**（无限重放被抓住）→ 还原复绿；
  - 锚3 **only-once 入簿红线删**（approveNode 去 require）→ Store **1 红**（onlyonce 永不入簿且 consume 防御 MISS）→ 还原复绿；
  - 锚4 **扫描 read 过滤层删**（isScanSafe 去 category=="read"）→ Scan **2 红**（扫描面收缩 + 全登记表快照「扫描面含写类」）→ 还原复绿；
  - 锚5 **MONEY 入簿红线删**（approveNode 去 require Money）→ Store **1 红**（MONEY 永不入簿且 consume 防御 MISS）→ 还原复绿；
  - 还原后三新类复跑 BUILD SUCCESSFUL（复绿）；变异用源文件经 diff 与备份一致确认无残留。
- **L1③ 全量回归**（`testDebugUnitTest --rerun-tasks`，XML 计数时点 2026-09-03）：**722 tests / 98 classes / failures=2 errors=0 skipped=1**——2 失败均为 **pre-existing `AppearanceContractTest` L2-9 / M-U50-5**（沿用申报口径，非本单引入），其余全绿。
- **L1④ 构建**：`:app:assembleDebug` **BUILD SUCCESSFUL**（含 app→mov-exec-engine 依赖）。
- **L2 机制实证**（Binding 套件断言）：豁免序 remembered→清单→FIFO；HIT 放行不弹窗 + 审计 decided=allowed-plan 成对；同键二次=耗尽转 ASK 弹窗；only-once/MONEY 装配 planStore 也不放行（转实时逐笔）；单上被拒执行期=rejected 不重复弹窗；planner 出单获批步不弹窗 / 未出单回退 FIFO。

## 五、Token / KV Cache 影响（AGENTS.md 硬规则 1；触发口径=用户拍板选项 2 申报口径）

- **Token 影响**：**纯只读/闲聊 = 零增量**（无 ASK 即钩子不触发，首轮全工具面正常跑，不插入扫描轮）。**办事型请求 = +1 轮**：首个审批级 ASK 到达时暂停，跑 1 次「计划补全轮」（READ-only 面嵌套独立 agent，一次性 throwaway 会话），产出结构化计划（每行「工具‖JSON参数‖理由」，或 NO_MORE_PLAN_STEPS）。触发条件 = 该 run 至少出现 1 个非 only-once 非 MONEY 的审批级 ASK；每 run **至多 1 轮**（settled 守卫）。量级 ≈ 1 个常规工具调用轮次的输入/输出。
- **提示词条件化增量（常驻变化说明）**：主 agent 的 systemPrompt（:5352-5370 拼串）**零改动**、:5358 执行模式保持——补全轮的「计划输出」指令由**独立嵌套 agent 的专用提示词**（planScanSystemPrompt，约 400 tokens 常驻于补全轮请求前缀）承载，不在主 agent 会话前缀内，**主会话请求前缀字节恒定**。审批单落簿/执行绑定为纯本地 JVM 状态（PlanApprovalStore 内存），不改变任何请求结构。
- **KV Cache 影响**：主会话请求前缀恒定（补全轮走独立一次性会话，不回放/不插入主会话历史，无历史投影/压缩/折叠）；AI 面 tools/system prompt 主会话中途不变（扫描收缩只作用于嵌套补全轮的 toolsForStep，主 agent 面在补全轮前后被 finally 还原为同构）。

## 六、共享面影响清单 + coverage_status（红线 24）

共享面影响清单：
- 改动点：`ApprovalService.kt`（request 清单查询下沉 + planner 钩子——共享判定/弹窗路径）+ `MainActivity.kt`（runChat 对话面 arming/编排/审批单 UI）+ `build.gradle.kts`（+mov-exec-engine 依赖）；新增 `PlanApprovalStore/PlanApprovalScan/MoneyTools`（纯 JVM 机制件）+ 3 测试套件。
- 影响面：① **对话面**（runChat）：办事型请求首次写类 ASK 会暂停弹一轮补全单（≥2 步出单 / 单步仍弹窗），纯只读/闲聊零变化；② **MCP 面**：绑定层 request() 双面共用（若装配 planStore 也会走 consume），但阶段二预审编排 arming 仅限 runChat try/finally 作用域——MCP 外部面无宿主 agent/审批单 UI 上下文，保持 UPG-75 FIFO 弹窗（行为不变，未装配回归测试锚）；③ **工具面**：补全轮期间 schemas+allowedTools 同源收缩 READ-only（rebuildAgentTools 单点），期间主 agent 挂起、无并发工具解析，finally 还原；④ 执行引擎/approval 子包/guard.decide/McpServer RPC **零接触**。
- 回归说明：全量 --rerun-tasks 722 tests / 2 失败（基线）如上；assembleDebug 绿；UPG-68 系（OnlyOnceGuard 8 + PermissionGuard 15）+ UPG-75 系（ApprovalQueue 4 + Experience 8 + ExperienceSurface 1）亲跑全绿。

coverage_status: **PARTIAL** —— ApprovalService 绑定/Store/Scan/MoneyTools 纯 JVM 机制面 FULL（32 用例 + 既有套件亲跑绿）；MainActivity 扫描编排/嵌套补全轮/审批单 UI 为新增 Android UI + 真机交互面，**JVM 不可测**（真机四场景见 §八），标 PARTIAL 待验收员真机补验后设计师裁决是否升 FULL。

coverage_decision:
- uncovered: 对话面 UI/编排真机交互面（扫描触发/嵌套补全轮/审批单 UI 四场景）——环境阻塞（emulator-5554 无 DeepSeek key，同挂账-模拟器AI未回复环境根）
- risk: 低——安全语义全部 JVM 可测且已 FULL（执行绑定五态/only-once/MONEY/fail-closed/变异亲杀 2/2）；未覆盖的 UI 编排面失效模式=「预审单不触发」→ 取消/超时/异常均回退现行 UPG-75 FIFO 弹窗（fail-open 回退，安全语义不降，最坏情况=新特性不生效而非闸失效）
- merge_decision: **合 main @6dd9161（2026-09-03 已合，已 push origin；含设计师直修 hygiene commit——ed5088c+nodeKey 分隔符 raw NUL→`\u0000` 转义，STD v2 前置销项，PlanApproval 定向 BUILD SUCCESSFUL）**；L3 四场景转 挂账-upg76-L3真机补验四场景（AI key 恢复后按 STD v2 测试匹配档补验）
- reason: UPG-75 A3-1 先例同型（环境阻塞非代码缺陷）；L3 阻塞根=验证环境缺 key（独立 P1 挂账），持单等待不提升安全性；STD-UPG-76-v2 sha=bfcbd872 对账一致
- decided_by: 设计师B
- decided_at: 2026-09-03

## 七、遗留申报（如实，供验收/设计师裁决）

1. **销项 #1 提示词条件化达成路径差异**：STD 字面「:5352 拼串处条件化、:5358 扫描模式反转」。本实现用**嵌套独立 agent 补全轮 + 专用计划提示词**承接扫描语义，主 agent 从不进入扫描模式（不存在需把 :5358 反转的场合），执行模式 :5358 保持原样；语义等效覆盖销项意图（补全轮不受「禁止计划文本」约束），字面上未改 :5352/:5358 原处。若验收要求字面条件化落地（在同一主 prompt 拼接处反转），需设计师确认是否接受本设计取舍或追加改动。
2. **预审放行仅对参数精确一致的步骤生效**：节点键=tool+canonical(args)。补全轮预测的后续步骤若执行时参数漂移（如搜索词/时间戳变化）→ MISS 转新 ASK 实时弹窗（宁缺勿放，安全方向，非缺陷）。真机实测会呈现「部分后续步骤仍弹窗」现象，符合 §8.3 参数级绑定设计。
3. **MCP 面预审编排未装配**：绑定层双面共用，但预审编排（计划补全轮/审批单 UI）仅对话面 runChat 装配；MCP 外部面走 UPG-75 FIFO。若期望 MCP 面也有预审单能力，需为 MCP 面引入宿主 agent 编排上下文——建议另单。
4. **UPG-63 baseline / ApprovalRegistry 生成器自写污染（已还原）**：全量 `--rerun-tasks` 会触发 `C7BaselineGenerationTest`（写 docs/c7_baseline_UPG63/*.jsonl 时间戳）与 `ApprovalRegistryGeneratorTest`（派生刷新 PermissionRegistryData.kt + docs/ApprovalRegistry.{json,md}，源=human-authored categories.json 已含 ui.listComponents）+ catalog 生成物——均已 `git checkout` 还原到提交态，commit ed5088c 不包含这些副产物（同 UPG-75 交付处置）。

## 八、演示数据还原 + 生产态复核声明（红线 18）

- **演示数据已还原**：commit ed5088c 提交前已将全量回归自写的 `docs/c7_baseline_UPG63/*.jsonl`（时间戳污染）、`ApprovalRegistryGeneratorTest` 派生产物（PermissionRegistryData.kt + docs/ApprovalRegistry.json/md）、catalog 生成物（UiComponentCatalog.kt / ui-components.generated.js）全部还原到提交态；`git status` 工作树干净（无跟踪改动/无残留）。
- **生产态已复核**：UPG-76 全部改动为纯 JVM 机制 + 对话面编排（内存态 PlanApprovalStore，无持久化/无 SharedPreferences/无演示数据写入路径）；对话正常路径未引入任何演示态分支；MCP/执行引擎/权限判定生产语义未触碰。交付态代码即上真机验证态。

## 九、真机 L3 四场景（STD 测试匹配档——留给验收员，JVM 已覆盖机制部分）

1. **多步骤请求（≥2 写类）→ 一张审批单**（步骤清单 + MONEY 行明示禁勾）→ 部分勾选批准 → 执行：已批步骤跑通、未批步骤 blocked 呈现「阻断下游」、执行中计划外调用弹新审批窗；
2. **MONEY 步骤执行到该步实时弹确认**（无论单子批否）；
3. **批准清单过期/次数耗尽 → 同调用转新弹窗**（真机时序验证 TTL/扣减与弹窗联动）；
4. **单步骤请求不出单**（走现行 UPG-75 弹窗）。

证据链：`审验员\审验.py --dir 程序员/UPG76-evidence` 可复核（journal/命令输出/源证据哈希四环节）；变异亲杀命令输出见本会话记录，manifest 源证据 9 条 E-001~E-009 已落 `程序员/UPG76-evidence/`。
