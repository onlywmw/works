# 输入内容 ↔ MCP 工具 联动机制 · 设计 v3.2（口径重建版 · 段①瘦身施工口径）

> 设计师 @2026-09-05 ｜ **v3.2 = 断链重建 + 溯源复核收口版**
> **版本链**：v1/v2（`归档\历史文档\方案设计_旧版\`，仅溯源）→ v3 定稿（大神 9.3 + Trace 契约，**本体文件断链丢失**——2026-09-05 全仓+备份归档搜索确认不存在）→ v3.1（Plan 模式补丁，`输入与MCP工具联动机制_设计_v3.1_2026-09-02.md`，冻结）→ **v3.2（本文件）**。
> **重建声明**：本口径由 v3.1 补丁全文 + 工单库 UPG-46 卡面施工 8 项（v3 定稿时期卡面快照）+ 2026-09-05 六层溯源复核（main @841f591d 实证）重建。**v3 原文不可得，本文件不冒充 v3 原文**；凡 v3 独有而卡面/v3.1 未承载的细节，以本文件为新的唯一口径，不留「应该在」。
> **瘦身边界（用户 2026-09-04 拍板）**：本文件只管**段①核心契约**（联动机制+Trace+接线+契约语义）；段②（六指标评测集扩建+Safety Policy 确认门实现深化+多工具编排执行+记忆回流）= **UPG-104**（P2 挂单，段①合 main 后启动）。

---

## 一、设计契约（段①）

### 1.1 流水线契约

```
输入 → 上下文组装（系统提示/会话历史/记忆/工具Schema/胶囊偏好 四源）
     → Tool Decision = NO_CALL / CALL / MULTI_CALL（NO_CALL = 合法决策）
     → Argument Generation + Validation（缺参/歧义/非法/超权限 四类阻断）
     → Safety Policy（Tool Risk L0-L3；L2/L3 必进确认门）
     → 编排语义（触发条件/优先级/互斥——段①只落契约语义层，执行器属段②）
     → Trace 可观测（结构化，非 CoT）
```

### 1.2 Plan 模式（v3.1 冻结补丁，并入本口径）

**两段式：先 Plan 后执行，模型不即兴 tool_calls，顺序有唯一真相。**

- **阶段 1 · Plan 生成**：输入 → 上下文组装 → Plan Generator（结构化输出）：`planId / steps[] / Plan 状态机`；steps 间依赖由 **`dependsOn` 显式表达**（P0-4 三模式——顺序/并行/条件——统一由 dependsOn 推导，不允许模型靠 tool_calls 顺序即兴）。
- **校验**：依赖闭环 / 工具存在性 / 循环检测 / 风险预分级——**校验不过 = 拒绝执行**（不是边跑边错）。
- **阶段 2 · Plan 执行**：按 steps 拓扑层序，每步走 安全门 → 参数校验 → 执行 → 结果回填 → 下步（喂上下文）；失败 → 中断 → 人工/重排。
- Plan 对用户/系统**可见、可校验**（顺序真相层）。

### 1.3 Trace 契约

每次调用记录结构化 Trace：`traceId / conversationId / turnId / input / candidateTools / selectedDecision / selectedTool / arguments / validationResult / riskLevel / confirmationResult / executionResult / memoryCandidate / decisionReason`。
**红线：Trace 不存 CoT**（结构化字段，不是思维链转录）。

### 1.4 红线（段①）

1. NO_CALL 是合法决策（不许为了「显得在干活」硬调工具）；
2. 参数阻断四类齐全：缺参 / 歧义 / 非法 / 超权限；
3. L2/L3 风险必进确认门（现有 PermissionGuard 审批语义**不动**，Plan 层只做预分级与透传）；
4. Trace 不存 CoT；
5. **Trace 落会话 journal（`Session.append` → JsonlStore），禁止另起第二写点**（2026-09-05 溯源新立——TraceRecord 与 journal tool/call·tool/result 语义重叠，另起文件即成平行数据源）；
6. 不扩工具面（不新增工具）、不动工具注册表语义、不改审批闸语义、不加 UI。

---

## 二、分层溯源图（2026-09-05 复核 · main @841f591d 实证）

> 复核口径：§七 六层四态（✅实物 / ⚠️半成品 / ❌孤岛或缺失 / ？未核实）。证据均为 main 当前实测行号。

| 层 | 判定 | 证据（文件:行号 @main 841f591d） | 依赖声明 | 断点处置 |
|---|---|---|---|---|
| L1 用户可感知 | ⚠️ 半成品 | 审批弹窗/预审单卡：`approval/ApprovalSurface.kt:70,82,561`，装配 `MainActivity.kt:2366-2394`；编造标记气泡 `MainActivity.kt:3186-3202`；room.html 无 tool 渲染 | 触及 | **声明不依赖**（段①不加 UI，红线 6；Plan 可见性 L1 呈现属段②/后续单） |
| L2 入口/桥接 | ✅ 实物 | tool_calls 解析 `llm/OpenAiCompatAdapter.kt:244`；调度 `agentloop/ToolCalls.kt:55 ToolCallScheduler`（journal 落 "tool/call" :330 / "tool/result" :366）；分发 `McpToolScheduler.kt:188,235 dispatch`（uiOnly 拦截 :238 → allowedTools 塌缩 :247 → handler 查找 :273 → guard.decide :295 → approval.request :310）；UPG-84 模式收敛实物 `presentation/PresentationMode.kt:13` + `MainActivity.kt:5633 allowedTools` | 依赖 | 无断点 |
| L3 校验/权限门 | ⚠️ 半成品 | 权限名单已单源化：`McpToolScheduler.kt:16-184 PermissionGuard`（permissionTier :97 / guard :132 / decide :174），事实源 `PermissionRegistryData`（生成自 `docs/ApprovalRegistry.json`）；`MainActivity.kt:196 uiOnlyMcpTools` 在原位；`MainActivity.kt:459 toolParamSchemas = emptyMap()`（UPG-01 批4 日落，schema 走 toolRegistry/hostToolMeta 投影）。**参数 schema 级校验生产侧没有**——四类阻断只在 tool-orch ValidationIssue，未接生产 | 依赖 | **本单修**（四类阻断接线=段①范围核心） |
| L4 运行时装配 | ✅ 实物 | `MainActivity.kt:365 mcpHandlers`；`:2396` McpToolScheduler 实例化；`:2398 knownTools` 注入；`:2408 ToolsRegistry.registerAll(...)` 单一装配入口（UPG-93/98 后注册面已迁 `tools/ToolsRegistry.kt:24` + 9 个分域扩展文件）；`:3140 runChat` 组装 ReactLoopAgent（:3172 scheduler 注入）；UPG-76 预审单先例钩子 `:3311-3320`（preApprovalPlanner）/`:3433 runPreApprovalRound` /`:3523 runPlanCompletionRound` | 依赖 | 无断点；**施工注意**：runChat 的 E3 兜底（:3335 口头承诺不调用就 nudge「立即调用工具」）与「先 Plan 后执行」语义冲突，本单需改这段语义 |
| L5 能力实物 | ❌ 孤岛（结构在、零生产调用） | tool-orch 模块为真依赖（`settings.gradle.kts:18`、`app/build.gradle.kts:98`），但生产侧全部引用 = `MainActivity.kt:349-350`（toolOrch/toolOrchTools **死引用**，填充后无人消费）+ `meta/EffectSpecRegistry.kt:3`（无人传给 DagPlanner）；`orchestrate(` 调用方全在 `tool-orch/src/test`。**契约类型全集在**（ToolOrchModel.kt：ToolDecision :4 / ToolRisk :7 / ValidationIssue 四类 :10-15 / Orchestration :53 / TraceRecord 14 字段 :84-98）；DagPlanner（拓扑分层 :139-150、循环拒绝、ref 引用、confirmRequired :160）**输入是代码推导边，不是 AI 的 dependsOn**，且无执行器；ToolOrchestrator 决策=关键词启发式，**不是 LLM Plan** | 依赖 | **本单修**（接线 + 强化=段①范围核心；详见 §三 对账） |
| L6 持久化/事实源 | ✅ 实物 + ⚠️ 隐患 | 会话 journal JSONL = 工具调用记录唯一事实源（`session/Session.kt:157 append` → `persistence/jsonl/JsonlStore.kt:78`，含 tool/call·tool/result）；tool-orch 无持久化（TraceRecorder=内存环形 500 条且无人实例化） | 依赖 | **本单修**（Trace 落 journal 新事件类型，红线 5 防平行写点） |

**置信度判定**：最弱层 = L5（❌ 孤岛）——段①的本质就是「把孤岛接上生产链」，方案置信度上限受此约束，验收必须见生产链路实证（非 tool-orch 模块内自转）。

**专项（派单前复核结论）**：
- **「先 Plan 后执行」切入点**：复用 UPG-76 预审单先例——决策侧钩子在 `MainActivity.kt:3433/3523`（独立一次性会话跑计划轮，产出从自由文本升级为结构化 Plan）；执行侧唯一闸 = `McpToolScheduler.dispatch:235`，Plan 消费模式架在 `ToolCallScheduler`（ToolCalls.kt:55，已有排他屏障/并行分组语义）之上，审批簿（PlanApprovalStore，`MainActivity.kt:3503`）原样复用。
- **UPG-83「tool.call 受控通道」未核实**：main 提交历史 grep 不到 UPG-83 工单号；若指 allowedTools 塌缩+uiOnly 拦截组合（UPG-84 e95472f0 及更早），该部分已实证在位（L2）。施工中以 L2 实证锚为准，不引用「UPG-83」字样。
- **旧锚点作废通报**（设计网络已回填）：`writeTools/harmlessTools` 内联名单、`toolParamSchemas` 内联 schema 在 main 已不存在（单源化迁移+日落）——一切工具类派单的旧锚一律以本次复核为准。

---

## 三、对账（强化 / 接线 / 新开——防重复施工）

### 3.1 强化复用（实物在 main，接线/改造即得）

| 资产 | 位置 | 段①用法 |
|---|---|---|
| 契约类型全集（ToolDecision/ToolRisk/ValidationIssue/Orchestration/TraceRecord 14 字段） | `tool-orch/.../ToolOrchModel.kt` | 段①类型底子；补 conversationId/turnId 实值填充（当前恒空串）+ Trace 落 journal |
| DagPlanner 拓扑分层/循环拒绝/ref 引用/SYNC 全序 | `tool-orch/.../DagPlanner.kt` | 作 Plan steps DAG 的**校验器+分层器**复用；DagNode 构造输入改为「AI 给的 dependsOn」（不再代码推导边） |
| EffectSpecs + EffectSpecRegistry（首批 20 工具效应登记） | `tool-orch/.../EffectSpecs.kt` + `app/.../meta/EffectSpecRegistry.kt` | 编排互斥/排序判据 + 确认门依据；**要做的只是接线**（喂进 DagPlanner/orchestrator） |
| Evaluator / EvalFixture / 版本守卫（六指标评测基建，13 fixture） | `tool-orch/.../Evaluator.kt` 等 | 段①回归评测基建现成（评测集扩建属段②） |
| ToolCallScheduler 排他屏障/并行分组/模型序提交 | `app/.../agentloop/ToolCalls.kt:55` | Plan 执行调度底座 |
| McpToolScheduler.dispatch 唯一执行闸 + PermissionGuard 单源权限门 | `app/.../tools/McpToolScheduler.kt:235` | Plan 每步执行必经——不新开执行通道 |

### 3.2 新开（main 不存在，本单新建）

| 能力 | 说明 |
|---|---|
| Plan 协议层 | Plan JSON schema + LLM 结构化输出解析 + 解析失败拒绝（ToolOrchestrator 关键词 decide/generatePlan **不是也不应硬改成这个**——Evaluator baseline 依赖它） |
| Plan 执行器（段①最小版） | 按拓扑层喂 steps 给 dispatch、dependsOn 数据流注入（ref 求值）、失败中断传播；多工具编排完整执行属段② |
| Trace 运行时装配 | TraceRecorder 生产实例化 + 落 Session journal 新事件类型（不另起文件） |
| 编排规则语义层（契约语义） | 触发条件/优先级/互斥的声明式规则表（现只有 EffectSpecs 保守判定+审批级，无「规则」概念） |
| 生产接线 | 消灭 `MainActivity.kt:349-350` toolOrch 死引用——接上真实聊天工具调用链 |

### 3.3 不做（红线复述）

不扩工具面 / 不动工具注册表语义 / 不改审批闸（PermissionGuard 名单语义）/ 不加 UI / 不动 ToolOrchestrator 关键词决策器（Evaluator baseline 依赖）/ 不开第二 Trace 写点。

---

## 四、判据（STD-UPG-46-v1 的判定源，摘要）

- D1 输入→Plan→工具触发链实测：给定输入 → 结构化 Plan 产出（steps+dependsOn）→ 校验通过 → 正确工具被调+参数映射正确；
- D2 Trace 完整：journal 可见 trace 事件（三字段：事件/参数/结果 + 14 字段结构齐），无 CoT；
- D3 编排语义：互斥/优先级规则正确（冲突输入→高优先/拒绝低优先）；循环依赖 Plan 被拒；
- D4 四类阻断：缺参/歧义/非法/超权限各至少 1 用例实测阻断；
- D5 无回归：全量 JVM 基线 **814/0/1**（@841f591d）0 失败 + 新增定向用例全绿 + assembleDebug 绿。

（完整验收定级/变异锚/销项条件以 `处理中心\验收标准冻结区\UPG-46\STD-UPG-46-v1.md` 为准——引用纪律：派单/验收/审验只引 STD 号。）

---

## 五、Token / KV Cache 影响申报（仓库 AGENTS.md 硬规则 1）

- **Token 影响**：变多。Plan 生成轮（阶段 1）为新增一次性会话/系统提示，量级估计 +1 次短上下文请求/轮；执行轮（阶段 2）系统提示增加 Plan 协议说明（量级数百 token）。
- **KV Cache 影响**：tools 字段、system prompt 在会话中途不得变动（仓库硬规则 2）——Plan 模式设计必须保证**会话开始后工具面不变**；阶段 1/阶段 2 若为独立会话则各自前缀恒定即可，严禁在同一会话中途切换工具集。施工方案须在交付报告中申报实际前缀稳定性。
