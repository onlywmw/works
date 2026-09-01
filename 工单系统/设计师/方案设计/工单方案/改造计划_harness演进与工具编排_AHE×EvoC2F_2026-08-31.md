# MOV 改造计划：harness 演进契约 + 工具编排升级（AHE×EvoC2F 立项建议）

> ⚠️ **本文档已并入合并版**：`工单方案\改造计划+验收标准_合并版_AHE×EvoC2F_2026-08-31.md`（用户拍板合并，2026-08-31）。合并版为唯一权威阅读版；本文保留作三轮评审历史溯源，内容不再更新。

> 大神评审稿 ｜ 设计师 2026-08-31 ｜ 素材来源：灵感库论文精读（`灵感库\评估报告\评估_AHE_2026-08-31.md` + `评估_EvoC2F_2026-08-31.md`）
> 全文源码锚点均为 2026-08-31 在 main @402510d（0027-mov 仓库）现读现摘，非转述。

---

## 〇、用户视角总览（先看这节：用户会感受到什么）

> 工程机制全部在后文——但每条改造线的立项理由只认用户可感知的变化。下表是验收这些改造线的**最终判据**：如果交付后下表右列没有发生，这条线就算白做。

| 用户场景（今天真实发生的糟心事） | 改造后用户感受到的变化 | 对应线 |
|---|---|---|
| 「昨天还好好用的功能，升级完就不会了」——AI 升级包把原来会的弄坏，用户装完包才发现，只能等下一个修复包 | 升级包更稳：每次改动前后跑同一套评测，弄坏什么的改动进不了包；真坏了自动回退，用户几乎感知不到坏包 | A-1/A-2 |
| 「它同一个坑摔两次」——这个房间里它刚因为查错参数道歉过，开个新对话又犯；教训只活在当前对话 | 同一个坑不摔第二次，而且**换房间、隔几天也不忘**：失败教训沉淀为长期记忆，新对话开场就带着「这个错别再犯」 | B |
| 「它新学的本领不靠谱」——AI 学会的新技能直接上岗，好不好用全凭运气；坏了也没有「退回上一版」 | 它学新本领像应用商店上架：先试用（不真执行）→ 确认不退步才上岗 → 上岗后退化自动降级回上一版。用户可以信任「已稳定」标签的技能 | A-2/A-3 |
| 「让它干事总慢半拍，多步任务一问一答老半天」——查三个班次再对比，AI 得一轮轮问，慢且每轮都耗对话费 | 复杂任务一次说清，它一把并行做完，回复明显变快（同一问题等待时间缩短） | D |
| 「它帮我干活的时快时慢，碰重要东西时又太毛躁」——同时读写你的文件可能冲突；该问的没问、不该问的乱问 | 干活更快但更有分寸：碰重要东西（短信/支付/删文件）的动作必先问你、绝不自动重试；只读的动作不烦你直接干 | C + D |

> 三轴特质的用户翻译：**更懂你 = 记得住你的坑和你的偏好（B）｜更持续 = 不退步、不重复犯、坏了自己降级（A/C）｜更能干 = 更快更稳一把做完（C/D）**。

## 一、项目现状（评审底图）

### 1.1 MOV 是什么

MOV：运行在 Android 上的 AI 生态移动端助手——工具/MCP 能力可视化组合（知识图谱）+ 能力市场（mow.kim）。AI 主线 = DeepSeek 云端模型 + 端侧 harness（工具面 156+、会话/记忆/审批/防编造全链）。评价一个能力值不值得做的三轴：**更懂你 / 更持续 / 更能干**。

### 1.2 模块结构（settings.gradle.kts 实况）

| 模块 | 内容 | 本计划相关性 |
|---|---|---|
| `:app` | 宿主：MainActivity（mcpHandlers 工具注册/装配/审批）、guard 包、compaction 包、meta 登记层、session 持久化 | 全部 |
| `:tool-orch` | 工具编排运行时（纯 JVM）：ToolOrchestrator 决策管线 + Evaluator 六指标 + EvalFixture 评测集 | A/C/D 线核心 |
| `:memory-core` / `:memory-api` | Memory API 工程契约（门面/Envelope/变更日志） | A 线消费方 |
| `:memory-os` | Memory OS 生命链（Semantic 池 + Timeline 账本 + Retrieval）刚合 main @402510d | A/B 线承载 |
| `前端设计/mov-vue` | Vue 设置/市场/记忆页 → vite 构建产物同步 assets | 无直接改动 |

### 1.3 与本计划相关的已有资产（源码锚）

| 资产 | 位置 | 现状与成熟度 |
|---|---|---|
| **工具编排运行时** | `tool-orch/src/main/kotlin/com/hermes/mov/orch/ToolOrchestrator.kt`（391 行） | 纯函数管线：Context Assembly → 候选 RAG → Decision(NO_CALL/CALL/MULTI_CALL) → 参数生成 → 四类阻断 → 风险分级+确认门 → 多工具编排(Parallel/Sequential/Conditional) → Trace。零 Android 依赖全可单测。**已合 main（UPG-46）** |
| **六指标评测集** | 同目录 `Evaluator.kt`（91 行）+ `EvalFixture.kt`（126 行） | Selection/Argument/NoCallPrecision/NoCallRecall/MultiTool/SafetyGate 六指标 + `regressionAfterDescChange()` desc 改动回归不降断言。**这是全 MOV 唯一的自动化回归底座** |
| **验收判定观察层** | `app/src/main/kotlin/com/hermes/dsh/guard/AcceptanceJudge.kt` | UPG-44 B1：journal 持 expected(append-only) + exact-equals 对拍落 journal，观察不拦截；触发=「核对类动词」+「标准指定短语」双条件，缺任一诚实降级。**B1 是 exact 模式起步，判别面待扩** |
| **防编造闸** | `app/src/main/kotlin/com/hermes/dsh/guard/FabricateGuard.kt` | 三信号判定（任务指定工具 ∧ 本轮零 tool.execute ∧ 结果类回复），返回 Hit 数据不注入模型上下文，UI 标记+journal 审计。定位=治感知不治行为 |
| **工具元数据登记层** | `app/src/main/java/com/mov/android/meta/HostToolMetaB1-5.kt`（五族） | `HostToolMetaEntry(description, schema, output)` 三元组静态登记（118+ 工具），companion `buildToolRegistry` 五族并入投影，`metaConflicts` 冲突检测，回落=0。**登记层是 C 线效应注解的天然落点** |
| **摘要/压缩线** | `app/src/main/kotlin/com/hermes/dsh/compaction/`（BasicCompactionEngine.kt + Compaction.kt） | `CompactionEngine` 抽象 + `SummarizationInput/SummaryResult` + 触发枚举(PRESSURE/CONTEXT_OVERFLOW)。面向对话上下文压缩，**无诊断模式** |
| **Memory OS 生命链** | `memory-os/src/main/kotlin/com/hermes/mov/memory/os/`（semantic/timeline/retrieval） | Semantic 池（MD frontmatter 权威+_index.json 派生）、TimelineLedger **append-only 物理无 update/delete**、actor 权限（AI 只 PROPOSED）、blockedSourceHashes 删除传播、purge 人类专属。**生命周期三态与技能灰度同构** |
| **会话 JSONL（journal 事实源）** | `app/src/main/kotlin/com/hermes/dsh/session/persistence/jsonl/JsonlStore.kt` + `EventCodec.kt` | append-only 每会话一文件，RandomAccessFile+fsync 原子发布（deepseek-harness session-persistence-jsonl 的 Kotlin 映射）。**A/B 线的全部原料在这里** |
| **E3 失败教训** | `MainActivity.kt:4414-4433 memoryGenePromptSegment()` | journal tool/result(isError) 扫描 → `MemoryGeneCompactor.failureAvoids` occurrences≥2 才注入，per-session 冻结。**教训通道已有，粒度=条目级 reason** |
| **Code Mode SDK** | `app/src/main/java/com/mov/android/ToolSdkGenerator.kt` | SDK 提示节+tool.help 同源生成器（纯函数），目录层 3K token 预算。**⚠️ 溯源结论：它是提示/文档生成器，0027-mov 现仓没有 JS 执行沙箱实体**（UPG-33 软沙箱为旧仓资产，未迁移到本仓） |

### 1.4 缺口诊断（为什么是这四条改造线）

1. **无自动演进/自校正循环**：harness 迭代 100% 靠「工单→程序员→验收员→审验员→合 main」人工链；论文 AHE 证明「编辑前预测+编辑后交叉验证」可自动化其中回归验证环节
2. **轨迹数据沉睡**：会话 JSONL 每天在写（tool_call/claim 链），但除 E3 的 isError 计数外**零结构化消费**——没有失败根因蒸馏层
3. **工具面缺效应/资源维度**：`ToolAnnotations` 只有布尔 hint（readOnly/destructive/idempotent/openWorld），且注释自认「第三方可能不填/填错」——**无并行安全依据**，DAG 化无地基
4. **无技能/编排准入门**：验收靠人工（验收员+审验员），没有「准入前重放+回归 Δ≤0+灰度」的机器门；EvoC2F 实证无门则持续学习回归率 0.8%→7.2%

---

## 二、改造线 A：harness 演进契约 + 技能准入门（A 级，主线）

**用户场景与体验目标**：用户最怕的不是「AI 不会」，是「**以前会的现在不会了**」。今天这条防线是纯人工（验收员+审验员+真机走查），坏包要靠人撞见；且 AI 自己学会的新本领没有退路。本线交付后：① 改动坏什么机器先知道，坏改动进不了包 ② 新技能带「试用→上岗→退化自动降级」全生命周期，用户可信任「已稳定」标签。工程内容是手段，判据只有一条：**连续两个升级包，用户零「以前会的现在不会了」反馈**。

**合流**：AHE① Change Manifest + AHE③ 回归盲区纪律 + EvoC2F① 验证门控简化版。
**服务特质**：更持续（自校正闭环+防退化）。

### A-1 改造内容（三步；v1.1 按大神评审修订）

**第 1 步｜Manifest 契约进交付流（S）——「做成工具，不是文书」**

大神 Q1 定夺采纳：验证器若只读 Manifest 文本不跑评测，两周后必然沦为走过场。交付物不是报告模板，而是**一个 ≤20 行的脚本/钩子**：工单提交时跑 baseline 快照，验收时跑 delta 对比，输出直接贴进工单——纪律被工具固化，不靠人自觉。降级预案：验证器资源排不上则做半自动版（开发者自跑脚本+验收员抽 1-2 条 predicted_fixes 对拍）。

交付报告 Manifest 节固定格式：

```text
## Change Manifest
- predicted_fixes:  预期改善的评测用例/行为（≥1 条，可查证）
- risk_tasks:       声明有回归风险的用例（诚实列出，不列视为 0）
- baseline:         可复现评测环境快照（v1.2 P0-1 升级，见下）
```

**Baseline 可复现契约（v1.2 P0-1，大神二轮评审定夺）**：baseline 不是六指标数字 hash，是**可复现评测环境快照**，必含五元：

```text
baseline_hash            评测结果 hash
eval_fixture_version     评测用例集版本（用例增删必须升版，否则 baseline 不可比）
evaluator_version        评测器版本
tool_registry_version    工具登记层投影版本
model_runtime_config     模型/运行时配置快照
```

否则半年后「这个 PR 当时为什么是过的」只剩一个无法复现的 hash——不可复现的基线等于没有基线，回归盲区纪律失去物理基础。

**对照组差中差（v1.3 采纳三轮评审问题 1：五元管不住云端模型漂移）**：DeepSeek 是云端 API——模型 ID 不变、行为可能静默变，六指标 delta 无法区分「改动导致回归」vs「模型自己漂了」。补法：每次 delta 评测**同跑一份无改动对照组**（main HEAD 原样重跑），回归判定改为「改动组 vs 对照组」的**差中差**；定期同代码重跑 baseline，漂移超阈即重立基线并把「环境漂移事件」记入 Evolution Ledger。不补这条，只信独立重跑的六指标信的是一把会自己漂的尺子。

验收时验证器做两件事：① predicted_fixes 与六指标 delta 交叉（预测命中才算修复有效）② **risk_tasks 与实测回归对比——但按 AHE 负结果（回归预测 precision 11.8%），回归判定只信独立重跑的六指标，不信 manifest 自述**。这一条写成设计红线。

**第 2 步｜技能准入门 MVP（M）**
候选技能（宏工具/编排模板/生成 JS 工件）入库前过三道机器门：

```text
门1 功能重放：错误注入用例 100%；功能用例 MVP 用绝对错误数阈值（v1.2 P0-2：13 条用例上 95% 无
   分辨率——12/13=92.3% 与 13/13=100% 之间不存在稳定阈值；MVP 定「功能重放 ≤1 条失败」，
   评测集扩充至 ≥40 条后切换百分比阈值并按 fixture scale 自动计算）
门2 回归判定：六指标 held-out 对比——判定粒度按「评测集规模盘点」结果定最小可检测差
   （v1.1 实证：现用例仅 13 条，「任一指标下降即拒」会被 1-2 条用例翻转的噪声卡死；
    盘点前用「下降 ≥2 条用例」过渡阈值，盘点后按样本量定统计边界）
门3 灰度：会话级 shadow 计数（只进规划上下文不执行→N 会话后转执行），退化自动回 shadow
```

**候选准入边界（v1.1 采纳大神 Q2）**：JVM 重放对「编排类候选」够用；**「JS 工件类」候选 MVP 阶段直接标「不可准入」**——现仓无沙箱实体，用 JVM 重放凑合会给后续埋「其实没测到」的假阴性，宁拒不凑。等沙箱资产决策后再开此通道。

与 UPG-52 生命链同构映射：shadow→canary→stable ≙ PROPOSED→ACTIVE→(RE_EVALUATE)→ARCHIVED；TimelineLedger 的 actor 权限直接复用（AI 产候选=PROPOSED，门通过=系统 ACCEPTED）。
**执行环境前置（诚实声明，v1.1 收紧）**：现仓无 JS 沙箱实体（见 1.3 溯源）——JS 工件类候选 MVP 直接拒收（见上）；门 1 对编排类候选用 JVM 侧 EvalFixture 重放。

**第 3 步｜AcceptanceJudge 扩判别面（M，挂 UPG-44 完整版）**
B1 exact-equals 之上扩：数值/枚举/包含三类判定 + 对拍结果接入门 2（用户侧对拍数据反哺回归集）。

### A-2 源码附录

**Evaluator 六指标（回归判定唯一事实源）**——`tool-orch/.../Evaluator.kt:4-17`：

```kotlin
/**
 * 六指标评测（验收标准 v3 §一.2）：
 * Selection Accuracy / Argument Accuracy / No-Call Precision / No-Call Recall /
 * Multi-Tool Accuracy / Safety Gate Accuracy —— desc 改动前后回归不降。
 */
object Evaluator {
    data class Metrics(
        val selection: Double,        // 该调用时工具选对
        val argument: Double,         // 参数生成+验证正确（阻断正确性并计入）
        val noCallPrecision: Double,  // 该不调用时没乱调
        val noCallRecall: Double,     // 该调用时没漏调
        val multiTool: Double,        // 多工具组合正确
        val safetyGate: Double,       // 确认门该拦时拦
    )
    ...
    /** desc 改动后回归：六指标不降（以工具定义替换描述，其余不动）。 */
    fun regressionAfterDescChange(base: Metrics): Metrics
```

**AcceptanceJudge 观察层语义（第 3 步的扩展基座）**——`dsh/guard/AcceptanceJudge.kt:5-24`：

```kotlin
/**
 * UPG-44：AcceptanceJudge B1 观察层（UPG-06 批2 剩项；方案 v4 §十一.2）。
 * 语义（观察层定案）：journal 本地持 expected（append-only）+ 投影剔键（Surface 不投影本事件
 * → 不进模型上下文）+ exact-equals 对拍落 journal。**不拦截、不重试、不阻止流式上屏**；
 * 治用户感知/审计可查，不治模型行为。
 * 触发（B1）：用户消息同时命中「核对类动词」+「标准/答案指定短语」→ 提取 expected；
 * 缺任一 → null（诚实降级）。
 */
```

**TimelineLedger actor 权限（门 3 灰度的承载）**——`memory-os/.../TimelineLedger.kt:38-40`：

```kotlin
/** actor → 允许写入的 eventType（AI 只 PROPOSED；system 只 REEVALUATED/ARCHIVED（decay 裁决后）；user 全量）。 */
val ACTOR_ALLOWED = mapOf(
    ACTOR_USER to EVENT_TYPES, ...
```

**会话 JSONL append-only（A/B 线原料）**——`dsh/session/persistence/jsonl/JsonlStore.kt:11-14`：

```kotlin
/**
 * JSONL durable session-persistence backend. It stores a header and contiguous
 * events in one append-only file per session, and delegates orchestration to
 * [PersistenceCoordinator].
 */
```

---

## 三、改造线 B：失败根因蒸馏层（A 级，AHE②）

**用户场景与体验目标**：AI 最伤信任的行为是「**同一个坑摔两次**」——同一房间刚道歉过，开个新对话又犯。根因：教训只活在当前对话（E3 同 session occurrences≥2），换房间/隔天就忘。本线交付后：AI 犯过的错经确认沉淀为长期教训，**新对话开场就带着「这个错别再犯」**；且教训是它真摔过的（有 journal 证据），不是编的。判据：同一类错误跨会话复发率可观测下降（教训命中→复发零）。

**服务特质**：更能干 + 更持续。**现状**：E3 教训只有条目级 reason（occurrences≥2 注入），journal 的 tool_call 链零结构化消费。

### B-1 改造内容

在 `compaction` 包现有抽象上加**诊断蒸馏模式**（不动对话压缩路径）：

```text
蒸馏器输入：会话 JSONL（tool_call/ok/结果 payload 链）
  → 第一层：per-session 失败片段（连续 isError/超时/重试链）
  → 第二层：根因归因（v1.1 采纳大神风险 3：MVP **三分类**——可重试失败/不可重试失败/编造被拦；
     编造被拦字段现成零成本【实证：guard/fabricate_hit 事件含 matchedPattern/toolCallsZero，AgentLoop.kt:446-453】；
     工具缺陷 vs 环境不可达的细分降为迭代目标——二者 journal 表现同形，需 payload 分析）
  → 第三层：session 级 overview（≤10 条，progressive disclosure——每条带 evidence 指针=JSONL 行号）
产出消费：① 人工（工单输入）② A 线 Manifest 的 risk_tasks 参考 ③ 教训升级为 Memory OS Semantic 条目（AI=PROPOSED，人工确认入池，经 FabricateGuard 校验非编造）

**教训条目强制字段（v1.2 P0-3，大神二轮评审定夺）**：每条升级为长期记忆的教训必含：

```text
lesson / category / evidence / confidence / source_session / source_event
```

原则：「工具失败」≠「AI 犯错」——网络断/500/业务拒绝不能变成「以后别这么干」。confidence 低的教训只停留在候选（PROPOSED），不进注入面；**否则 Memory OS 会沦为错误日志记忆垃圾场**。

**教训注入配额（v1.3 补，回答「会不会拖慢对话」）**：教训进注入面必须有硬上限（建议 ≤3 条/次 + 总字节 ≤ 预算段，与 MemoryCover 冻结/前缀恒定对齐——同 session 字节恒定才吃得到 KV cache）。**任何超出配额的教训只落库备查，不进 prompt**。原则：教训的价值在「对的那几条在场」，不在「全部都在场」——进化基础设施不向对话借时间。

**教训过期机制（v1.3 采纳三轮评审纪律 6：熵管理的对称面）**：B 线管了「错误→教训」入池，还要管「工具修好了→教训变毒」出池——「X 参数别用」类教训在工具升级后是错误指导。实现：教训条目挂 `source 工具 registry 投影 hash`，工具登记变更时自动把相关教训降回候选（RE-EVALUATE）——与 Memory OS 既有 RE-EVALUATE 状态与 blockedSourceHashes「删除传播」同一纪律的反方向：**事实变了，派生结论要重验**。不做则教训池单向积累成记忆层的熵。
```

工程量 M；与摘要线的关系是**并列模式**（SummarizationInput 旁路，不混对话压缩）。

### B-2 源码附录

**E3 教训现状（蒸馏器的教训出口对账）**——`MainActivity.kt:4421-4426`：

```kotlin
// 失败教训：journal tool/result(isError) 扫描 → occurrences≥2 才注入（变异锚⑥）
val avoids = com.hermes.mov.memory.MemoryGeneCompactor.failureAvoids(failureEventSource.collectFailures())
...
val failSeg = if (avoids.isNotEmpty()) "\n\n【失败教训】" + avoids.joinToString("；") { it.reason } else ""
```

**摘要线抽象（蒸馏模式并列挂载点）**——`dsh/compaction/Compaction.kt:51-80`：

```kotlin
abstract class CompactionEngine { ... }
data class SummarizationInput( ... )
data class SummaryResult( ... )
```

---

## 四、改造线 C：工具效应注解第四维度（A 级，EvoC2F②）

**用户场景与体验目标**：用户对 AI 的两条期望在打架——「**干活别磨叽**」（读类动作别什么都弹窗问我）和「**碰重要东西要有分寸**」（短信/支付/删文件别擅自动、别自动重试）。今天的风险分级只有单次调用的布尔 hint，AI 干活快不起来也稳不下去。本线交付后：每个动作有机器可查的「碰不碰你的数据」事实，读类的直接干、写类的先问你、不可逆的绝不自动重试——**快和稳不再二选一**。判据：确认弹窗总量下降（读类不再烦人）+ 写类误动作为零。

**服务特质**：更能干（并行安全地基）。**对账**：`ToolDef.annotations` 已有布尔 hint 但「第三方可能不填/填错——风险分级自有策略兜底」；EvoC2F 的贡献是**保守缺省+trace 只扩不缩**纪律。

### C-1 改造内容

1. `HostToolMetaEntry` 三元组扩四元组：`+ effects: EffectSpec(sideEffect: PURE|READ|WRITE, env: LOCAL|EXTERNAL, resources: List<String>)`
2. 缺省纪律：未登记工具一律 `WRITE×EXTERNAL`（宁可少并行不可错并行）；hostToolMeta 118 工具按 handler 实现核实首批 20 个高频（与 UPG-01 desc 核实同纪律：逐条查源码+行号锚）
   **缺省裁决权（v1.3 采纳三轮评审问题 4，不留到实现时现场决定）**：某工具 `readOnlyHint=true` 而 effects 缺省时——确认门与调度**回落 annotations hint**（仅限纯读类明显工具），该工具**自动进优先核实队列**（保守面自动收敛）；其余一律保守。过渡期代价如实标注：首批核实完成前确认弹窗可能先升后降，用户判据「弹窗总量下降」按阶段验收（首批 20 工具落地后进入下降段）
3. trace 只扩不缩：运行时观测到更宽足迹→登记层修正提案（走 A 线 Manifest，不静默改）
4. 与既有 `ToolAnnotations` 的关系：annotations=AI 面提示（hint 语义），effects=执行面事实（调度依据），**两套并存不混写**

工程量 S-M（首批 20 工具）。

### C-2 源码附录

**登记层现三元组（扩维落点）**——`meta/HostToolMetaB1.kt:15-18`：

```kotlin
/** 登记条目（三元组；B2/B3/B4 同构复用本 data class）。 */
data class HostToolMetaEntry(
    val description: String,
    val schema: Map<String, Any?>,
    val output: String,
)
```

**既有 annotations（信任边界说明）**——`tool-orch/.../ToolOrchModel.kt:38-44`：

```kotlin
/** 第三方 annotations（可能不填/填错——风险分级自有策略兜底）。 */
data class ToolAnnotations(
    val readOnlyHint: Boolean = false,
    val destructiveHint: Boolean = false,
    val idempotentHint: Boolean = false,
    val openWorldHint: Boolean = false,
)
```

---

## 五、改造线 D：DAG 编排试点（B 级，先实测后放量，EvoC2F④）

**用户场景与体验目标**：「帮我看这趟车还有没有票，有的话提醒我」这类多步任务，今天 AI 要一轮轮问（每轮都是一次模型调用：慢、贵、中途还可能跑偏）。本线交付后：AI 一次规划、多步并行执行，**同问一句话等待时间明显缩短、对话费更省**；且写类步骤（真的会下单/发消息）依然逐一确认——快的是「查和算」，稳的是「碰你的东西」。判据：六指标集多步用例端到端等待时间实测下降 + SafetyGate 不降。

**服务特质**：更能干 + 省 token。**原则**：与 Code Mode 双模式并存（DAG 计划是 ToolOrchestrator 的 MULTI_CALL 路径升级，不替代 JS/自由调用）。

### D-1 改造内容

**前置缺口（v1.1 采纳大神 Q3，必须承认）**：六指标集测的是**正确性**，D 线的存在理由是**延迟/token**——现有 EvalFixture 无性能维度，D 线做完只能得「不劣化」结论，得不了「值得做」结论。**D 线前置=先给评测集加延迟/调用量记录能力（mock clock 虚拟延迟即可起步）**；补不上则 D 线降级为观察项。

1. MULTI_CALL 决策输出升级为带依赖的 DAG（数据流边由参数引用 ref(u,field) 推导）
2. 并行调度前提=**C 线效应注解就位**（读-写冲突自动序列化；未登记工具保守串行）
   **覆盖率预警（v1.1 采纳大神风险 2）**：首批核实 20/118（17%），其余保守缺省全串行——DAG 收益会被 83% 保守面吃掉大半。C 线启动前先做 journal MULTI_CALL 工具分布统计：20 个高频工具覆盖 ≥80% 场景则 D 有意义；覆盖不到 50% 则收益预期大幅下调或扩大核实范围（注意：MOV 开发期设备侧会话样本可能不足，统计不足时按保守假设处理）
3. **先实测后放量**：在六指标集上跑「串行现状 vs DAG 并行」对照（延迟/调用量/正确率三列）——论文 63-67% 延迟降来自全串行基线，MOV 现状并行度未知，数字不可引用
4. 不可逆操作治理同步落：effects=WRITE×EXTERNAL 的节点不并行不自动重试，走确认门

工程量 M（调度/熔断是成熟件，难点在注解覆盖与端上网络适配）。

### D-2 源码附录

**编排管线现状（DAG 的挂载点）**——`tool-orch/.../ToolOrchestrator.kt:5-15`：

```kotlin
/**
 * Tool Orchestration Runtime（冻结设计 v3）：纯函数决策引擎。
 * 管线：Context Assembly → 候选（RAG threshold=配置项）→ Decision（NO_CALL/CALL/MULTI_CALL）
 * → Argument Generation → Validation（四类阻断）→ Safety Policy（风险分级+确认门）
 * → 多工具编排（Parallel/Sequential/Conditional）→ Trace。
 * 纯 JVM：零 Android 依赖；全部可单测/评测集回归。
 */
```

装配点 `MainActivity.kt:354`：`val toolOrch = com.hermes.mov.orch.ToolOrchestrator`

---

## 六、统一纪律（写进每条改造线的红线）

1. **回归盲区纪律**（AHE 负结果直接转化）：回归判定只信独立重跑的六指标，不信任何 manifest/judge/进化者自述
2. **门控防退化**（EvoC2F 消融）：准入门的价值=防退化不提分（去门回归率 0.8%→7.2%）——门不可为提效省略
3. **端侧预算红线**：不搬 Z3/property-based 重验证/shadow 7 天周期；门 3 灰度一律会话级计数
4. **不搬清单**：AHE 完整进化外循环（32h/96 并发/E2B）、单指标 pass@1 优化、进化者写宿主代码、EvoC2F DPO planner（无可训练模型资产）、IR 替代 Code Mode

### 6.1 Evolution Ledger（v1.2 P0-4，大神二轮评审新增，插第一阶段）

四条线的生命周期事件目前散落在 Manifest/journal/Memory/trace/git——缺一条统一事件链回答「**一次能力为什么从 A 版本变成 B 版本**」。新增统一演进账本（与 TimelineLedger 天然契合：同 append-only/actor 权限形态，或作为其平行实例扩展 EVENT_TYPES）：

```text
CHANGE_PROPOSED → BASELINE_CAPTURED → CHANGE_APPLIED → REGRESSION_EVALUATED
  → ACCEPTED/REJECTED → SHADOW → CANARY → STABLE → DEGRADED → ROLLED_BACK
```

第一版只需记录八字段：`changeId / baseline / change / evaluation / decision / lifecycle / rollback / evidence`。Debug 时可直接回答「这个技能为什么变成 shadow 了」，不用翻五处日志。

### 6.2 B/A 边界铁律（v1.2，防记忆→测试→规则的污染链）

**B 只能「提出新的测试」，不能直接改变准入规则**：

```text
✅ B 发现失败 → 提出 risk → 提出 fixture → 人工/系统审核 → 进 regression set
⛔ B 发现失败 → 自动加入硬性阻断规则
```

否则形成「错误→记忆→测试→规则→再阻断」的污染链，一个错误样本就能逐渐污染整个 Runtime。与 FabricateGuard「治感知不治行为」、AHE「归因先于蒸馏」同构。

## 七、end-state（v1.1 采纳大神风险 4：从哪来到哪去）

> 工单 → Manifest（A-1 脚本化 baseline+delta）→ 开发 → 六指标回归（门 2 自动化，粒度按盘点定）→ 准入（A-2 门 1/2/3，JS 工件类诚实拒收）→ 会话级灰度 → 上线 → 会话轨迹 → 根因蒸馏（B）→ 反哺 Manifest risk_tasks 与回归集（闭环）。
>
> 闭环成立后：harness 迭代从「工单式人工链」变为「人工决策 + 机器验证」——人决定改什么，机器证明没改坏；AI 学新本领自带退路。

## 八、推进顺序（v1.1 采纳大神三阶段微调）

**用户可感知里程碑（交付节奏以用户感受到为准）**：
1. **里程碑一「它不摔同一个坑了」**（B 线三分类 MVP：蒸馏+教训入池+跨会话注入）——用户价值最直接，且大神与用户视角修正同向：提前至第一阶段
2. **里程碑二「升级包更稳了」**（A-1 脚本化 Manifest + A-2 门 1/2）
3. **里程碑三「快和稳都有了」**（C 注解→D 试点放量，带降级条件）

```text
第一阶段（S，立即可做，可并行）：
  A-1 Manifest 纪律（做成脚本，不是文书；baseline 按可复现契约五元快照）
  B 根因蒸馏 MVP（三分类+教训强制字段，产出反哺 A-1 的 risk_tasks）
  评测集规模盘点（v1.1 已实证：现用例仅 13 条；门 2 判定粒度与扩充规模由盘点定）
  Evolution Ledger（v1.2 P0-4：八字段第一版，A/B/C/D 共同骨架）

第二阶段（S-M，依赖第一阶段盘点）：
  C 效应注解（先做 journal MULTI_CALL 工具分布统计，确认 20 个覆盖够不够）
  A-2 技能准入门（门 1 绝对错误数阈值/门 2 判定按盘点结果定；JS 工件类拒收）

第三阶段（M，依赖 C + 评测集补性能维度）：
  D DAG 试点（评测集补不上延迟/调用量维度则降级为观察项）
  A-3 Judge 扩面（独立，随时可插）
```

## 九、大神评审定夺记录（v1.1）

| 评审问题 | 定夺 | 采纳情况 |
|---|---|---|
| Q1 Manifest 值不值 | 值得但必须做成工具（≤20 行脚本/钩子），非文书；降级预案=半自动 spot-check | ✅ 全采纳（A-1 第 1 步改写） |
| Q2 JVM 重放够不够 | 编排类候选够；JS 工件类 MVP 诚实拒收（不可凑合——假阴性） | ✅ 全采纳（A-2 准入边界写入） |
| Q3 D 线排序 | 必须在 C 后，且评测集先补延迟/调用量维度；补不上则降级观察项 | ✅ 全采纳（D-1 前置+§八第三阶段降级条件） |
| 隐性风险 1 | 门 2「任一下降即拒」在小样本过严→最小可检测差 | ✅ 采纳+实证（用例数 13 条，比评审预估更少；过渡阈值 ≥2 条用例） |
| 隐性风险 2 | 20/118 覆盖率可能吃掉 DAG 收益→先统计工具分布 | ✅ 采纳（C 线前置统计；样本不足按保守假设） |
| 隐性风险 3 | B 五分类被低估→MVP 两分类 | ✅ 采纳+实证修正：guard/fabricate_hit 独立字段现成（AgentLoop.kt:446-453），MVP 升为三分类；缺陷/环境细分留迭代 |
| 隐性风险 4 | 缺 end-state | ✅ 补（§七） |

### 二轮评审定夺记录（v1.2，8.8/10 可立项，开工前钉 4 P0）

| P0 | 定夺 | 落点 |
|---|---|---|
| P0-1 Baseline 可复现契约 | baseline=五元环境快照（fixture/evaluator/registry/model/config 版本），非单纯指标 hash | ✅ A-1 Manifest 格式已升级 |
| P0-2 门 1 小样本判定 | 95% 在 13 条上无分辨率（12/13=92.3%）→ MVP 绝对错误数阈值（≤1 条失败），≥40 条后切百分比 | ✅ A-2 门 1 已改写 |
| P0-3 教训强制字段 | lesson/category/evidence/confidence/source_session/source_event；低 confidence 只停候选不进注入面——防记忆垃圾场 | ✅ B 线已加字段契约 |
| P0-4 Evolution Ledger | 统一演进事件链+八字段第一版，插第一阶段，与 TimelineLedger 契合 | ✅ §6.1 新增+第一阶段列入 |
| B/A 边界 | B 只能提出新测试，不能直接改准入规则（防污染链） | ✅ §6.2 铁律 |

**下一步（大神结论）**：方案已收敛，停止扩写设计文档；待用户拍板后把第一阶段拆成工程任务+接口契约+数据结构+验收用例，直接进入开发。

### 三轮评审定夺记录（v1.3，同意立项，地基盲区补全后直接进任务拆解）

| 项 | 定夺 | 落点 |
|---|---|---|
| 问题 1 云端模型漂移 | baseline 五元管不住 DeepSeek 静默变——delta 评测同跑 main HEAD 无改动对照组，判定改「差中差」；漂移事件入 Evolution Ledger | ✅ A-1 已补对照组差中差 |
| 问题 2 EvalFixture 走不走真实模型 | **实证已答：全程纯函数确定性**（orchestrate=关键词检索+规则决策，无 LLM/suspend）——无 run-to-run 方差，门 2「≥2 条」为确定性阈值；代价=只测管线逻辑回归，模型行为面靠 Judge 对拍+B 蒸馏兜底（既定）。盘点扩为「规模+确定性+方差+模型漂移校准」，确定性项已结 | ✅ 盘点任务更新（确定性项已结案） |
| 问题 3 门的元验证 | 门 1/2 上线前人工构造 3-5 个已知必回归的坏改动，验证门拦得住且理由正确（=变异亲杀思想用于门本身）；顺带实测 tool_registry_version 触发重立基线 | ✅ 写入 A-2 验收标准（拆任务时列验收用例） |
| 问题 4 缺省裁决权 | effects 缺省时回落 annotations hint（仅限纯读类明显工具）+自动进优先核实队列；过渡期弹窗先升后降如实标注，用户判据按阶段验收 | ✅ C 线已补缺省裁决 |
| 纪律 5 门 3 依赖链 | 「退化自动回 shadow」在线信号依赖 B 线蒸馏生产化——门 3 第一版人工触发回退，诚实标注；B MVP 含灰度退化信号最小实现 | ✅ 写入 A-2 门 3 + B 线 MVP 范围 |
| 纪律 6 教训过期 | 教训挂 source registry hash，登记变更→自动降回候选（RE-EVALUATE）——「事实变了派生结论重验」 | ✅ B 线已补过期机制 |
| 纪律 7 可剥离性 | 每组件注释「本组件编码的模型假设」；「模型重大升级→假设重检」入 Evolution Ledger 事件流（零新机制） | ✅ 写入拆任务模板要求 |
| 小修 Ledger 不阻塞 | 八字段第一版从 A-1 脚本输出+git 记录派生起步，状态机完整版待技能量起来 | ✅ §八第一阶段已标 |
| 小修 单变量实验 | 四条线同窗口并行会混淆回归归因——交付节奏串行，写进纪律 | ✅ 并入 §八纪律 |
| 小修 ≥40 条用例来源 | B 反哺+人工补写要有 owner；门 1 切百分比时点依赖它 | ✅ 并入盘点任务（owner 拆任务时定） |
| 小修 D 线「实测」定义 | mock clock 只支撑「不劣化」；「端到端等待下降」最终以真机会话采样为准（journal 耗时字段） | ✅ D-1 判据钉死 |
