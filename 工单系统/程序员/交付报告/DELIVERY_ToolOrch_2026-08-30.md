# UPG-27 单1 · Tool Orchestration Runtime 契约 交付 —— 2026-08-30

- 分支：feat/tool-orch（worktree mov-tool-orch，基底 main 7992904）
- commit：**bc58a01**（已 push origin）
- 依据：输入与MCP工具联动机制_设计_v3（冻结）+ 主页胶囊与工具联动_验收标准_v3（L1 六指标）
- 状态：**L1 契约层可用（六指标全达标）；L2 联动（单2）待派单**

## 交付核（对照 v3 八节）

### 1. Context Assembly
四源组装（系统提示 → 会话历史 → 记忆 → 工具 Schema+胶囊提示）；顺序/优先级固定；`toolBudgetChars` 预算截断；胶囊偏好块独立（「胶囊偏好提示」段落）。

### 2. Tool Decision
- **NO_CALL 合法**（知识/闲聊/纯语义 → 不调工具；评测 4 用例 100% 命中）
- CALL / MULTI_CALL（多意图检出 ≥2 工具）
- **胶囊偏好提权**（偏好命中工具置顶——仅权重，非锁定；decisionReason 记录「胶囊偏好提示命中」）
- decisionReason 结构化（无 CoT——测试断言无 thought/推理过程标记）

### 3. Argument Generation + Validation（四类阻断）
缺参/歧义/非法枚举/超权限四类 issue；参数提取规则：示例匹配/引号书名号/数字ID（订单 8823）/「给X发」/trigger 后文本/「预订」后名词。歧义分型优先（「老板」→ Ambiguous 而非普通缺参）。

### 4. Safety Policy
**自有风险分类器**（L0 查询/L1 本地写入/L2 外部状态修改/L3 不可逆资金/删除）；**annotation 缺失/填错仍按策略兜底**（测试实证：无 annotation 的 payment.pay 分类 L3）；**L2/L3 执行前确认门**（conformation=REQUIRED；L0/L1 NOT_REQUIRED）。

### 5. 多工具编排
Parallel（独立）/Sequential（依赖）/Conditional（分支）；按描述依赖关系自动判定（测试实证 3 类）。

### 6. Tool RAG
threshold=160 配置项；超阈值 top-K=24 关键词检索（测试 200 工具实证 top-K 生效+命中相关）。

### 7. Trace（决策可观测）
14 字段全带（traceId/conversationId/turnId/input/candidateTools/selectedDecision/selectedTool/arguments/validationResult/riskLevel/confirmationResult/executionResult/memoryCandidate/decisionReason）；**无 CoT**（决策原因结构化）；TraceRecorder ring（500）。

### 8. 评测集（六指标）
12 典型用例（NO_CALL×4 / CALL×6 / MULTI×2 / 模糊歧义 / 不该触发）+ Evaluator 六指标：
- **Selection 1.0**（工具选对）
- **Argument 1.0**（参数阻断 vs 放行）
- **No-Call Precision 1.0 / Recall 1.0**
- **Multi-Tool 1.0**
- **Safety Gate 1.0**
- **desc 改动回归**：六指标不降（独立回归测试）

## 验证（L1 自动化）
- **tool-orch 14 用例全绿**：决策契约（NO_CALL/CALL/MULTI/胶囊提权）/四类阻断/风险+确认门（含 annotation 缺失兜底）/编排三类/Context 组装/Tool RAG/Trace 14 字段+无 CoT/六指标基线+desc 回归+NO_CALL P&R
- 全量：app 61 类 **443/0/0** + assembleDebug 绿
- Token/KV：**0/0**（纯本地决策层，未触 AI/执行链）

## 接线（MainActivity）
- `toolOrchTools` = **hostToolMeta（118+）投影**（ToolDef：stableId/description/字段级 schema/enum annotations 推导——readOnlyHint=含「查询/只读/读取」，destructiveHint=含「删除/取消/付款/退款/清空/注销」；**annotations 仅为推理输入，自有分类器兜底**）
- 实例=`toolOrch`（object 单例）；**单2 点击分派/运行时决策**复用 `selectCandidates/decide/generatePlan/safetyPlan/orchestrate` 全管线（接口已备）

## 如实申报（边界）
1. `desc 改动回归`=评测集内回归（工具定义描述变体）；**线上 desc 变化不自动触发重评**（回归入口=测试）
2. Argument 提取为**规则式**（非 LLM 语义提取）；评测集内典型输入达标；更复杂语义提取留 LLM 层（非本单范围）
3. 未接入执行链（现有 McpToolScheduler 不变）；Tool Orch=**决策/Trace 层**（调度/审批原样）

## 待验收
L1 六指标（验收员可跑 `Evaluator` + 14 测试 XML）；**单2（胶囊系统）依赖本单 Decision/分派接口**。

## 证据
- test XML：tool-orch/build/test-results/test/*.xml（14 用例）
- 报告：本文件；两表已登记
