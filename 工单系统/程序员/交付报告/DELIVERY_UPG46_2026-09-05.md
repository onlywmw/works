# 交付报告 · UPG-46

> 类型：M2 体系/治理（工具联动 Runtime 契约·段①核心契约） ｜ 日期：2026-09-05 ｜ 依据：派单 v2 `设计师/派单/UPG-46_工具联动Runtime契约_派单_v2_2026-09-05.md` + 设计 v3.2 + STD-UPG-46-v1
> 治理归属：施工在 `E:\mov归档\0027-mov` worktree mov-upg46（branch feat/upg46，基 origin/main 841f591d） ｜ 状态：✅ 已完成（交付，待验收）
> 施工：程序员 Kimi/kimi-cli（接手：用户 2026-09-05 02:19 拍板转交——原认领 Claude/wmw0027 做不了；前任两预置 commit 4da3b6d0[死引用消灭]+bf757f9d[E3 NO_CALL 合法化] 保留接续，本交付在其上完成段①主体）

---

## 一、本阶段交付（6 件）

| # | 交付 | 实现 |
|---|---|---|
| 1 | **Plan 协议层**（新开） | tool-orch `OrchPlan.kt`：PlanStep/OrchPlan/PlanVerdict/PlanValidator（工具存在性→规则互斥→DAG 校验→风险预分级）；app 侧 `orch/OrchPlanSupport.kt`：Plan JSON schema 提示 + org.json 解析（围栏剥离/括号配平/数字形 dependsOn 容忍）+ **解析失败拒绝**（null=回退行格式） |
| 2 | **两段式接线**（新开+复用） | 决策侧复用 UPG-76 预审单钩子区：`runPreApprovalRound` 结构化 Plan JSON 优先（`OrchPlanSupport.parseAndValidatePlan`），解析失败/校验拒绝回退行格式路径（UPG-76 语义不变，UPG-85 锚段零破坏）；Plan 决策 trace 落主会话 journal（traceId 绑 planId，layers/confirmRequired 入 decisionReason）；执行侧=既有 ToolCallScheduler→McpToolScheduler.dispatch 唯一闸 + PlanApprovalStore 原样复用（执行器属段② UPG-104，不越界） |
| 3 | **四类阻断接线**（强化） | tool-orch `ArgumentValidator.kt`（缺参/歧义/非法/超权限，schema 缺失 fail-open）；生产接线=`McpToolScheduler.argumentValidator` 可注钩子（dispatch 前段、guard 之前，默认 null 零行为变化）+ MainActivity 装配注入（schema 面=llm.ToolSchema→tool-orch ToolSchema 投影，rebuildAgentTools 同源重建） |
| 4 | **Trace 契约落地**（强化+新开装配） | journal 新事件 `tool/trace`（SessionTypes+Session.buildEvent+EventCodec 双向+KnownEventTypes 四处同改，穷尽 when 五文件补分支）；`ToolCallScheduler.traceEmitter` 装配点（tool/result 落账后发射，覆盖正常/超时/中止/调度失败全路径）；`TraceRecorder` 生产实例化+sink 尾参；`TraceRecord.toJournalMap()` 14 字段键名=字段名；conversationId/turnId 实值填充（原恒空串）；**单写点=Session.append→JsonlStore，无旁路文件，无 CoT** |
| 5 | **编排规则语义层**（契约层最小版） | tool-orch `OrchRules.kt`：OrchRule（触发/优先级/互斥声明式）+ OrchRuleEngine（互斥剔除低优先级+note 记录，不改层序）+ DEFAULT=空表（生产扩张留段②）；EffectSpecs+EffectSpecRegistry 经 `DagPlanner.buildWithDependsOn`（新增 DependsOnNode 入口，既有 build 零改动）接线进校验链 |
| 6 | **死引用/死代码清账** | 前任已消灭 :349-350 toolOrch 死引用（4da3b6d0）；本交付连带清理 E3 残留死代码 `e3NudgedKeys`+`looksLikeToolRequest`（bf757f9d 后无调用点）+ :348 孤儿注释更正为现态口径 |

## 二、验收判据核对（STD-UPG-46-v1 D1-D5 逐条）

| 项 | 标准 | 实测证据 |
|---|---|---|
| D1 | Plan 两段式：结构化 Plan（steps+dependsOn）→ 校验 → 按序执行，正确工具+参数映射 | ✅ OrchPlanJsonTest 8 例：dependsOn 链 layers=[["s1"],["s2"]]/围栏提取/数字形 [1]→s1 容忍/解析失败 null 拒绝；生产接线=runPreApprovalRound 结构化优先+行格式回退共存（ToolLinkageContractTest A6 锚）；「按序」=dependsOn 拓扑层序机器校验（执行器段②边界在案） |
| D2 | journal 可见 trace 事件、14 字段齐、无 CoT、无第二写点 | ✅ ToolTraceJournalTest 4 例：tool/trace 事件 14 键逐字段核对/conversationId+turnId 实值/input 取最近用户消息/EventCodec 往返无损/decisionReason 结构化短串；A1 锚：Session.append("tool/trace") 生产写点唯一（OrchPlanSupport）+trace 链零文件 IO 扫描 |
| D3 | 互斥/优先级正确；循环依赖 Plan 被拒 | ✅ OrchRuleEngineTest 4 例（互斥正反向剔除/优先级/note）；OrchPlanJsonTest「循环依赖被拒」「依赖闭环被拒」「工具不存在被拒」；PlanValidatorTest 11 例（tool-orch） |
| D4 | 四类阻断各 ≥1 用例实测阻断 | ✅ ArgumentValidatorTest 7 例（四类各实测+fail-open+多 issue 同返）；DispatchArgumentBlockTest 4 例（dispatch 前段 ARGUMENT_BLOCKED+handler 未执行+meta.validationIssues+validator null 零行为变化+阻断序在 guard 前） |
| D5 | 全量 0 失败+定向全绿+assembleDebug 绿 | ✅ app **836/0/1**（基线 814/0/1 @841f591d + 新增 22，零新增失败）；tool-orch **101/0/0**（既有 75 零回归+新增 26）；assembleDebug BUILD SUCCESSFUL（app-debug.apk 56716961B）；提交版=验证版（本报告全部计数出自 a8043aad 本 commit 工作区实测） |
| 变异 | 5 锚亲杀 | ✅ M1 删循环检测→PlanValidatorTest 循环案红；M2 删缺参分支→ArgumentValidatorTest 2 案红；M3 删 journal 落点→ToolTraceJournalTest 3 案红；M4 NO_CALL 改判拒绝→双侧 3 案红；M5 删 L2/L3 预分级支路→双侧 2 案红；全部快照还原复绿（记录见证据文件） |
| 真机 L2 | 给定输入→Plan 可见→按序执行→结果回填 | ⏳ **转验收员持有**（如实申报：L2 定级真机走查属验收员职责；JVM 层 Plan 校验/journal trace/参数阻断已行为实证，真机路径=预审单触发结构化 Plan→审批单→执行→journal 三事件链） |

## 三、证据引用

- `程序员/UPG46-evidence/upg46_test_counts.txt` —— 测试 XML 机器汇总（app 837 总/836 过/0 败/1 跳 + tool-orch 101 绿 + assembleDebug 绿 + 基线对账）
- `程序员/UPG46-evidence/upg46_mutation_kills.txt` —— 变异 5 锚亲杀逐条记录（快照-还原纪律 /tmp/upg46-mut）

## 四、测试结果（XML 汇总）

- app testDebugUnitTest：tests=837 failures=0 errors=0 skipped=1（837=836 通过+1 跳过；基线 814/0/1，本单 +22：OrchPlanJsonTest 8 + ToolTraceJournalTest 4 + DispatchArgumentBlockTest 4 + ToolLinkageContractTest 6）
- tool-orch test：tests=101 failures=0 errors=0（既有 75 零回归 + 新增 26：PlanValidatorTest 11 + ArgumentValidatorTest 7 + OrchRuleEngineTest 4 + TraceJournalMapTest 1 + TraceRecorderSinkTest 3）
- assembleDebug：BUILD SUCCESSFUL（56 actionable tasks；APK 56716961B）

## 五、hash 三重（交付绑定）

| code_commit_sha | artifact_sha | evidence_manifest_sha |
|---|---|---|
| `a8043aad24158a02b3667e8c8849c24abfa72e87` | `a94223a19f00ce229379ccef973fab980ebe65c335ecd3a8b81651cc26e097fc`（app-debug.apk sha256） | `b5e112b1c184bba5881715279fa1d34ba31037f327d76dc8bf06ab4ad2f9883f`（artifact 待填→实物回填后 deliver-gen 重产，自检 ok:True 重算一致） |

**manifest 自检（UPG-92 内置硬闸 · 审验.py --manifest）**：ok:True ｜ 绑定值重算一致 ｜ 文件：`程序员/UPG46-evidence/delivery_UPG46_manifest.json`

**E2 hash 一致性预校验**（复用 SYS-02 阶段一 `审验.py --verify-hash`）：

- 命令：`python 审验.py --verify-hash feat/upg46 a8043aad24158a02b3667e8c8849c24abfa72e87 --repo E:\mov归档\0027-mov`
- 结果：**HASH_REJECT <not-ancestor>** ｜ 如实申报：分支未合 main 态必然（UPG-85/91/97 同口径先例）——hash 在 origin feat/upg46 实存（git push bf757f9d..a8043aad 实证），合 main 后复跑=终态
- ⚠️ 环境注记：审验.py 默认仓库路径 `C:\Users\Administrator\0027-mov` 当前非 git 仓库（02:45-02:57 被其他进程重建为无 .git 目录——非本单动作，已在场如实申报；真实仓库=E:\mov归档\0027-mov，本校验经 --repo 显式指定完成）

## 六、范围与红线遵守

- **NO_CALL 合法**：PlanValidator 空 steps/NO_CALL 直接 Accept 绝不拒（M4 锚）；E3 nudge 强催已删（前任 bf757f9d + 本单死代码清账；A2 锚常驻）
- **参数阻断四类**：缺参/歧义/非法/超权限齐备（ArgumentValidator；M2 锚）
- **L2/L3 确认门**：PermissionGuard 审批语义零改动（dispatch 内 approval.request 链未触——A3 锚）；Plan 层只做预分级（confirmRequired=DagPlan WRITE×EXTERNAL ∪ riskOf≥L2；M5 锚）+透传
- **Trace 不存 CoT**：14 字段结构化（decisionReason=短串依据非思维链——行为测试断言）
- **Trace 单写点**：Session.append→JsonlStore 唯一；旁路文件禁令源码锚常驻（A1）；未新增任何文件写点
- **不扩工具面/不动注册表语义/不改审批闸/不加 UI/不动 ToolOrchestrator 关键词决策器**：零新增工具；ToolRegistry/PermissionGuard 语义未触；ToolOrchestrator 仅 TraceRecorder 加 sink 尾参（决策器本体零改动，Evaluator baseline 不动——tool-orch 既有 75 例零回归实证）；UPG-83 字样未引用（溯源复核口径遵守）；旧锚 writeTools/harmlessTools/toolParamSchemas 未按旧文档查找
- **MainActivity CRLF 纯度**：实测 5692/0（CRLF/lone LF）
- **棘轮红线 7**：MainActivity 新增=装配点 4 处一行级注入（argumentValidator 赋值/orchArgumentFace 字段/schema 面重建行/traceEmitter 赋值）+ runPreApprovalRound 结构化分派块（方法内改造，逻辑全在 OrchPlanSupport——派单「接线豁免 2 行已裁决 A」口径的超额部分=结构化分派块与 prompt 升级，属方法内既有逻辑升级非新业务面，提请设计师复核口径）+ E3 死代码净删 13 行
- **提交版=验证版**：本报告全部计数/commit/产物出自同一工作区同一时点（a8043aad）

## 六之二、施工期重大回归与自纠

- **自纠 1（测试基建）**：ToolTraceJournalTest 首跑 5 红——newSession 的 user/message append 缺 SurfaceIntent（surface 事件契约）+ ToolLinkageContractTest A1 锚误匹配 KDoc 注释串（`Session.append` 大写 S 说明文字）——均为新测试自身缺陷，不涉生产代码；修正后 23 例全绿。影响面=零（未进 commit 的测试迭代）
- **自纠 2（测试环境副产物）**：全量回归触发 ApprovalRegistryGeneratorTest 等生成器回写（PermissionRegistryData.kt/docs/ApprovalRegistry.*/docs/c7_baseline_UPG63/* 行尾重写）——逐文件 diff 核实纯行尾差异零内容变化，全部 git checkout 还原未入 commit（防越界污染）
- 视觉类追加变更：无（本单零 UI）

## 能力护栏（P1-1）

```yaml
共享面影响清单:
  - 共享面: MainActivity 装配段（runChat traceEmitter 注入/rebuildAgentTools schema 面重建/dispatch 校验器注入/runPreApprovalRound 结构化分派）
    影响下游: 对话面全量工具调用（traceEmitter）、dispatch 全量调用（argumentValidator）、预审单轮（Plan JSON 协议）
    回归说明: traceEmitter/argumentValidator 均默认 null 不启用=零行为变化（DispatchArgumentBlockTest「validator 默认 null」+ToolTraceJournalTest「trace 未装配」双锚实证）；预审单结构化解析失败/校验拒绝一律回退行格式原路径（A6 锚+OrchPlanJsonTest 解析失败案）；UPG-85 锚段零破坏（PreApprovalRemoveFirstMatchContractTest 3 例绿）；UPG-76 绑定行为零改动（PlanApprovalBindingTest 32 例绿——全量回归内）
  - 共享面: 协议/接口定义（journal 新事件 tool/trace + ToolCallScheduler.traceEmitter + McpToolScheduler.argumentValidator 两个可选钩子）
    影响下游: Session 事件消费者（Surface/SessionQuery/EventExtraction/Compaction/MovQueryTools 穷尽 when 已补分支）；EventCodec 双向编解码（往返测试实证）；JsonlStore 落盘格式追加新类型（旧日志零影响——纯追加事件类型）
    回归说明: 全量 836/0/1 零新增失败；session/query/compaction 面既有测试全绿
  - 共享面: 全局数据结构（tool-orch 契约类型——追加式：OrchPlan/PlanStep/PlanVerdict/OrchRule 新开；DagPlanner/ToolOrchModel/TraceRecorder 只加不改）
    影响下游: tool-orch 既有消费者（Evaluator/EvalFixture/ManifestMain/SkillGate/Gate3Automation）
    回归说明: tool-orch 既有 75 例零回归；ToolOrchestrator 关键词决策器零改动（Evaluator baseline 红线遵守）
coverage_status: FULL
```

## Token 影响 / KV Cache 影响（仓库 AGENTS.md 硬规则 1）

- **Token 影响**：预审单补全轮 system prompt 增大（PLAN_JSON_SCHEMA_PROMPT 段，量级约 +300 token/轮）——仅审批触发的一次性独立会话，非常驻面；主会话 system prompt/tools 字段/历史投影/压缩零改动（每轮请求 token 不变）。机械校验 `node scripts/check-token-effect.mjs` 通过
- **KV Cache 影响**：主会话请求前缀字节稳定（零改动）；补全轮为独立一次性会话（UPG-76 先例），其自身 system prompt 会话内恒定（tools 面 READ-only 收缩在会话开始前完成，中途不变——硬规则 2 遵守）

## Code-LOC 申报（ponytail-bench 同口径：git diff -U0 841f591d..a8043aad，产物/锁/基线数据已排除）

**+1578 / -63 / 净 +1515**（其中测试约占 1000 行：tool-orch 5 类 26 例 + app 4 类 22 例 + 契约锚；主代码约 +570：OrchPlanSupport 330 + tool-orch 三新件约 200 + 钩子/事件/装配约 40；删除 63=MainActivity 死代码清账+注释更正。净增大的主因=契约锚/行为测试密度——安全/证据密度不豁免极简，自查无未要求抽象）

## 七、登记说明

- 工单表.xlsx 程序员列：✅完成 + 备注（分支 feat/upg46 + hash a8043aad + 报告名 + delivery_id）——本报告提交后同步登记
- 工单库.md 状态快照同步（先表后库）
- delivery_id：`DEL-UPG-46-20260905-001`（standard_id=STD-UPG-46-v1 content_sha256=5038b639…；manifest 机制产出硬闸通过）
- 段②边界（UPG-104 挂单）：编排执行器/评测集扩建/确认门深化/记忆回流不在本单——memoryCandidate 恒空串、OrchRules.DEFAULT 空表、react 路径 candidateTools 空清单，三处如实申报不越界
