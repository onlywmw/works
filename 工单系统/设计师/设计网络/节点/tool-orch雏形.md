---
type: component
domain: 工具运行时
status: "❌"
repo: 主仓
evidence: "MainActivity.kt:349-350（死引用）+ tool-orch/src/main/kotlin/com/hermes/mov/orch/（orchestrate 调用方全在 src/test）"
tickets:
  - "[[设计师/设计网络/工单/UPG-46|UPG-46]]"
---

# tool-orch 雏形（ToolOrchestrator/DagPlanner/EffectSpecs）

- **状态**：❌ 孤岛（结构在、零生产调用）｜ **域**：工具运行时 ｜ **仓**：主仓
- **证据（2026-09-05 UPG-46 溯源 @841f591d）**：模块为真依赖（`settings.gradle.kts:18`、`app/build.gradle.kts:98`），但生产侧全部引用 = `MainActivity.kt:349-350`（toolOrch/toolOrchTools 声明+填充后无人消费）+ `meta/EffectSpecRegistry.kt:3`（无人传给 DagPlanner）；`orchestrate(` 调用方全在 `tool-orch/src/test`
- **内含资产**：ToolOrchModel.kt 契约类型全集（ToolDecision :4 / ToolRisk :7 / ValidationIssue 四类阻断 :10-15 / Orchestration :53 / **TraceRecord 14 字段 :84-98**）；DagPlanner 拓扑分层 :139-150 + 循环拒绝 + ref 引用（**输入=代码推导边，非 AI dependsOn；无执行器**）；EffectSpecs + app 侧 EffectSpecRegistry（首批 20 工具，孤岛）；Evaluator/EvalFixture 六指标评测基建（13 fixture）；ToolOrchestrator 决策=**关键词启发式，非 LLM Plan**（Evaluator baseline 依赖，勿硬改）
- **备注**：UPG-27 时代雏形（bc58a013 已在 main）。UPG-46 段① = 把它接上生产链（强化复用清单见设计 v3.2 §三）；TraceRecorder 内存环形无人实例化，Trace 落盘须入会话 journal（禁第二写点）
- 波及工单：[[设计师/设计网络/工单/UPG-46|UPG-46]]
