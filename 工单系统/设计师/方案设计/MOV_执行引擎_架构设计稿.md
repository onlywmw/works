# MOV 执行引擎 · 架构设计稿

> **v0.4 = 验收模板冻结版**(契约正文 v0.3 冻结不动;R3 复审 §12 验收 8.9/10 → 补 3×P0 守卫后 9.5/10,可冻结为基础设施级验收模板)｜2026-09-02
> 契约正文范围(v0.3,已冻结):收口 **身份 / 版本 / 审批文本 / 状态归属** 四类契约,主执行链作基础设施冻结。
> **v0.4(本轮)**:修订仅限 §12 验收 → 补 P0 守卫 G9/G10/G11、L1-A/L1-B 守卫分型、L2-A/L2-B 分型、Golden Baseline、Acceptance Log 治理、L5 Merge Blockers。
> 配套《MOV_元能力注册表_架构设计稿》v0.3(能力声明层)。事实锚点 2026-09-02:0027-mov 现码(tool-orch→com.hermes.mov.orch、app/.../dsh/tools)。⚡=现码已有;🆕=本稿定案待接线。

## 评审吸收记录 v0.2→v0.3

| 复审意见 | 落点 |
|---|---|
| P0-A Registry 版本模型(弃粗粒度 policyVersion) | §2.1 / §6.1 |
| P0-B 审批 Summary 必须 deterministic;LLM 只能解释 | §6.1 / §6.5 |
| P0-C JobId≠SemanticKey;Approval State 不进 JobSpec | §2.1 / §5 |
| P1-1 Failure Propagation 成 Graph 显式边属性、默认阻断 | §8 |
| P1-2 Registry Snapshot 用于可复现,Dispatch 读最新安全策略 | §6.6 |
| P1-3 HumanPatch 重走 Graph/Schema/Policy 验证 | §10 |
| P1-4 retry eligibility 归 Registry,retry scheduling 归 EffectSpec | §4 / §7 |
| 改名「六问一真相源」→「执行系统真相源矩阵」 | §2 |
| 本轮不扩功能,专做契约收口 | §11 |

## 评审吸收记录 v0.3→v0.4(R3 · 针对 §12)

| 复审意见 | 落点 |
|---|---|
| P0 G9 策略漂移守卫(§6.6 需对应守卫) | §12 L1-B |
| P0 G10 身份归属守卫(§2.1 需对应守卫) | §12 L1-B / 12.2 |
| P0 G11 证据完整性(账本只增 ≠ 账本完整) | §12 L1-B / 12.1 |
| L1 分型:静态架构守卫 vs Runtime 变异守卫 | §12 L1-A / L1-B |
| L2 分型:Runtime Integration vs Device/UI(无 UI 不假真机) | §12 L2-A / L2-B |
| Golden Baseline:现测试全绿 ≠ 行为兼容 | §12 L3 |
| Acceptance Log 单点:append-only + 子档缓冲 | §12 L4 |
| Merge Blockers:红线 = 禁合 main,非「建议修」 | §12 L5 |

---

## §0 一句话

把一件真人指令变成一串**可执行、可审批、可回放**的能力调用:LLM 拆、执行图验、策略闸拦危险动作、审批锁死 canonical、全程留账。引擎只做四件事:**验证、决策执行边界、协调、记录**。引擎里不许再设一份「应该怎么跑」的真相源。

## §1 定位

```
Capability Registry(声明层:什么能做、要什么审批 —— 唯一策略真相源)
        │ What is allowed / required
        ▼
Execution Engine(本稿:这次怎么跑、怎么拦、怎么证明)
        │ What actually happened
        ▼
Runtime / Approval / Ledger
```

## §2 执行系统真相源矩阵(上位约束)

> **凡出现「两个模块都能回答同一个问题」即为架构债。** 下表是本引擎的 Runtime Truth Boundary;任何新模块上线前先对表,越界即债。

| 问题 | 真相源 |
|---|---|
| 能力是什么(in/out/语义) | Capability Registry |
| 能力能不能执行 / 要什么审批 | Registry → Policy Gate 裁决 |
| 这些动作怎么排列(先后/并行/汇聚) | Execution Graph |
| 一次动作到哪一步了 | JobRuntime |
| 人到底批准了什么 | Approval Record(锁 canonical) |
| 外部副作用实际结果 | Provider Result |
| 历史发生过什么 | Execution Ledger |
| 从哪恢复断点 | Checkpoint |

## §2.1 ID 与版本模型(本轮新冻结)

MOV 进入 replay/ledger/approval/retry 后,ID 串线是最高发债源。先冻这张表,各 token 只答一个问题:

| token | 定义 | 归属 | 生成 | 用途 |
|---|---|---|---|---|
| `semanticKey` | 能力+业务对象,如 `payment.transfer/order-456` | 稳定、跨 run 复用 | 意图层 | 幂等去重 / 同对象合并判定 |
| `jobId` | 一次动作实例身份(uuid)**≠ semanticKey** | 一次实例 | 引擎 | **revision 的归属者**;Runtime/Ledger 主键 |
| `revision` | JobSpec 修正代数 | 属 jobId | 引擎/人工 | 不可变收敛(5.1) |
| `runId` | 一轮真人指令的执行会话 | 一次 run | 意图入口 | 关联一组 job |
| `approvalRequestId` | 一次审批请求 | 一次请求 | Gate | Approval Record 键 |
| `registryVersion` | 注册表整体版本(+generatedAt) | 全局 | 声明层发布 | 审计 / 可复现快照 |
| `capabilityDefinitionVersion` | 单能力不可变版本 | 能力 | 声明层发布 | 计划锚定(plannedDefinitionVersion) |
| `policyFingerprint` | hash(side_effect + approval_policy + environment + execution boundary) | 能力的策略面 | 派生 | **审批有效性绑定**(6.1) |

> 规则:**语义去重用 semanticKey,执行追溯用 jobId;revision 只挂在 jobId 下**,绝不把「新任务」误判成「旧任务」的 revision。

---

## §3 非目标(边界)

- 不做通用多智能体框架 / 子 agent 池 / 跨 agent 负载均衡。
- 不进 Node/服务器运行时(Android + 现内嵌运行时)。
- **不做第二套安全策略源**:side_effect / approval_policy / environment / retry-eligibility 一律查 Registry;引擎代码禁 `if(capabilityId==…)`。
- 不做后台批跑式审批(移动端真人逐项点)。
- 不做 AI 验收(评判离线,引擎只记证据不评对错)。
- 引擎不决定「该不该审批」(Gate 读表裁决);引擎决定「审批通过后如何安全跑」。

## §4 三层切分(每层只答一问)

### ① 意图层 Intent —— 答「想做什么」
```
CapabilityCallDraft { semanticKey, capabilityId, input, dependency[], idempotencyKey }
```
禁止决定 approvalRequired / sideEffect / permission / retry-eligibility。

### ② 执行图 Execution Graph —— 答「怎么跑」
```
ExecutionGraph { node[], edge[] }   // EdgePolicy 见 §8
```
`EffectSpec` 是**执行调度语义**,只解释:是否可并行 / 是否要资源锁 / **retry 怎么调度** / 是否可 reorder。**禁止决定审批、禁止拥有 retry-eligibility。**

### ③ 能力策略闸 Capability Policy Gate —— 答「允不允许、什么条件下」
纯查表 Registry:`side_effect | approval_policy | environment | idempotent | retry_eligibility | schema`。无自有知识。

### 边界二分(补 P1-4)
```
Registry 决定「可不可以重试」(retry eligibility,含是否允许自动重试)
EffectSpec 决定「怎么调度重试」(退避/时机/上限内的调度约束)
```
不出现 `Registry:non-retryable` vs `EffectSpec:retryable` 的双源。

---

## §5 状态模型(把真相归属冻死)

### 5.1 JobSpec 不可变;状态不含「审批」
```
JobSpec {
  jobId, revision, supersedes?, capabilityDefinitionVersion  // 计划锚定
  semanticKey, capabilityId, in, dependency[], idempotencyKey
  state: draft → verified → invalid → superseded        // ⚠️ 无 approved
}
```
审批结论**不属于 Spec**——一个 revision 进 ApprovalGroup 后可能 A 节点批 / B 待 / C 拒,Spec 说不清也不该说清。修正 = 新 revision,旧标 superseded(Ledger 逐 revision 记账)。

### 5.2 JobRuntime 可变;phase 承接执行史
```
JobRuntime { jobId, revision(锚定), phase, approval?, result?, attempts[] }
phase: planned → gated → partially_approved → ready → dispatched
       → running → done | failed | blocked | expired
```
Spec 签后锁;Runtime 是执行史;人批了什么(Record)与跑了什么(anchor revision)永不串台。

---

## §6 审批契约(收口 P0-A / P0-B)

### 6.1 有效性绑定:版本展开为「定义版 + 策略指纹」
弃粗粒度 policyVersion;审批 request 携带并锁定:
```
ApprovalSnapshot {
  capabilityId
  capabilityDefinitionVersion   // 批准时的定义版
  policyFingerprint             // hash(安全面),改文案不变、WRITE→MONEY 必变
  canonicalPayload              // 机器不可变层
  canonicalHash
  humanReadableSummary          // deterministic 渲染,见 6.5
  summaryVersion
  approvalScope                 // plan | task | capability_call
}
执行前同验:capabilityId + capabilityDefinitionVersion + policyFingerprint + canonicalHash + approvalScope
```
**改 UI 文案** → definitionVersion 升、fingerprint 不变 → 旧审批仍有效;**WRITE→MONEY** → fingerprint 变 → 旧审批 STALE。

### 6.2 首决胜 + 不可变
同请求先到者生效,后到回「已决」;Approval Record 不可变、不被观测层覆盖。

### 6.3 超时:EXPIRED ≠ REJECTED
```
READ  无审批;WRITE/MONEY → PENDING 可挂起可恢复
TTL 超时 → EXPIRED(≠REJECTED)→ 不可执行;要跑=重新发起新审批,不复活旧 token
MONEY:不默认批 / 不默认拒 / 超时失效且必须重新确认
```

### 6.4 决策只认人读到的内容
用户批准的是 summary(人读),系统锁的是 canonical(机器)。两者由 §6.5 的确定性链绑定,LLM 不进链。

### 6.5 审批对象可信链(新增,定 P0-B)
```
Canonical Payload
   │ deterministic(无 LLM)
   ▼
Summary Renderer: ① Capability Template("向{{payee}}转{{amount}} {{currency}}")  ← MONEY/EXTERNAL WRITE 必选
                  ② Structured Fields(操作/收件人/附件/影响,比自然语言更适审批)
   ▼
Human Approval UI(批准的是 summary)
   ▼
Approval Record(锁 canonical + fingerprint)
```
```
LLM Explanation(为什么建议做)────────── 可选,链外
                                       明确标注「AI 说明」≠ 审批对象
```
> **禁 LLM→LLM 自证**(canonical→LLM→summary→LLM judge 会重引 AI 不稳定)。MONEY / EXTERNAL WRITE 的审批文本必须由能力声明层模板/结构字段生成,LLM 只能解释不能是审批文本唯一来源。

### 6.6 冻结与最新并存(补 P1-2)
```
Plan Time     → 记 plannedDefinitionVersion(解释「当时基于什么」→ 可复现/审计/回放)
Approval Time → 绑 policyFingerprint
Dispatch Time → 读 currentEffectivePolicy → 与 fingerprint 比对
              更严(如现为 MONEY)→ STALE → RE-GATE → RE-APPROVE
```
**冻结用于可复现,不用于绕过最新安全策略。** 拒绝「Run 级整体策略冻结后中途策略漂移照跑旧权」。

---

## §7 幂等与重试边界

| 层 | 防什么 | 归谁 |
|---|---|---|
| Engine Idempotency | 同 jobId(+revision)在 MOV Runtime 内重复 dispatch | 引擎 |
| Provider Idempotency | 副作用在执行方重复发生(超时但服务端已成功) | 执行方协议 |
| End-to-End Idempotency | 跨 MOV 边界(MONEY/EXTERNAL WRITE)e2e token | 引擎+执行方共同 |

- **引擎只收执行级幂等**;跨系统最终幂等由执行方协议共同保证(支付超时≠外部没执行,不能只靠本地缓存「第一次结果」)。
- Registry 增加 `idempotency.scope ∈ {engine, provider, end_to_end}` 与 `retry_eligibility ∈ {auto, manual, never}`(🆕);MONEY/EXTERNAL WRITE 必标 provider 或 end_to_end;未知 scope 不进自动重试。
- 非幂等能力(idempotent=false,如 sense.capture)永不自动重试;重试只在真人明确「再来一次」。

---

## §8 执行模型与失败语义(补 P1-1)

### 8.1 Failure Propagation = Graph 边属性,值集引擎冻结
```
EdgePolicy { onSuccess, onFailure, onRejected, onExpired, onBlocked }
值集(引擎冻结,业务不可自由造): BLOCK | SKIP | CONTINUE_INDEPENDENTLY | REQUIRE_HUMAN_INTERVENTION
默认: failure / rejected / expired → BLOCK 下游
```
- 传播是 **Graph-local**:`A→C、B→C` 中 A 败 B 成,C 能不能跑取决于 **C 对 A 的边语义**,不是引擎全局规则。
- 只有 bundle 显式声明才 `CONTINUE_INDEPENDENTLY`,否则默认安全阻断。

### 8.2 一次回路(逐 revision)
```
draft → Schema 验(in 齐?)→ 不过=invalid 回意图层出新 revision
      → 过 → Gate 读 Registry:
            READ → 放行(记账)
            WRITE×EXTERNAL → 确认卡 ┐ ApprovalGroup 逐项独立授权
            MONEY → 逐次审批卡     ┘ 单次提交、一次请求一 requestId
      → dispatch(幂等键注册)→ impls → record(Ledger + 回填 LLM)
```

### 8.3 ApprovalGroup 双状态机(单次提交多卡才有终态)
```
Group: pending → partially_decided → completed | expired | stale
Node : approved | rejected | blocked | expired | stale
```
`partially_decided` 例:A(WRITE)批 / B(WRITE)待 / C(MONEY)拒 / D(READ)免批。拒/过期节点按 8.1 断下游;已批旁支放行按 bundle 单向依赖判定;DAG 靠 Node 级状态继续算「可跑/永不可跑/等人工」。

---

## §9 账本 vs Checkpoint(互不覆盖)

```
Checkpoint → 答「从哪恢复」:mutable / replaceable / recovery-oriented
Ledger     → 答「历史上发生了什么」:append-only / immutable / auditable
```
同引用 (jobId, revision, runId, approvalRequestId),**绝不共享同一份可变记录**。危险动作账本行永不静默裁剪(展示层可折叠,原始行保留)。

---

## §10 人工接管点(补 P1-3)

AI 卡死/反复失败 → 不把 JobRuntime 交人手改(Runtime 是执行史)。
```
Run failed → InterventionRequest → HumanPatch(补参/删动作/换能力/重审批/定 retry)
          → 候选 Revision N+1 → 重走 Schema + Graph + Policy 验证
          → 通过才继续
```
- 删除后续动作也须过验证:A 已执行、人工删 B 时,C 不能自动当无事——B 的下游按新图边语义重算。
- 全程写 Ledger(旧状态仅追加 superseded/人工介入标记,不抹改)。

---

## §11 切片与冻结范围(本轮:契约收口,不收新功能)

| # | 切片 | 状态 | 说明 |
|---|---|---|---|
| S1 | capability-registry 地基(资产+schema+校验) | 🔧 UPG-71 | 引擎查表前提 |
| S2 | JobSpec(revision/semanticKey)+ Schema Gate + READ 直跑 | 🆕 | 执行器 maxConcurrency=1;Graph 模型仍是 DAG 不降 list |
| S3 | 审批双快照(6.1)+ deterministic summary(6.5)+ 首决胜 | 🆕 | ApprovalService 工具级→能力级 |
| S4 | ApprovalGroup 状态机 + EXPIRED(6.3/8.3) | 🆕 | 接 S3 |
| S5 | Execution Graph + EdgePolicy 从工具粒度长到能力粒度 | 🆕 | 改造 ⚡ DagPlanner/EffectSpecs,不重写 |
| S6 | Engine Idempotency + 人工接管(§7/§10) | 🆕 | 接 S2/S5 |
| S7 | 证据 Ledger 与 Checkpoint 分离 | 🆕 | 全程攒账,末统一导出 |

**冻结声明**:本文档收口到 **Registry → Plan → Graph → Gate → Runtime → Ledger** 主执行链的契约边界。此边界冻结后不再因新能力反推回改;存储/线程/UI 卡片/具体接线 = S2-S7 各自的实现问题,由接线单引用本稿施工,不回改核心契约。

---

## §12 验收方案(v0.4 验收模板 · S2-S7 接线单抄走引用)

> 本稿不直接产出 APK。验收对象 = 接线单(S2-S7)对冻结契约的忠实实现;文档级契约冻结以「R2 9.1 + §11 冻结声明」为据。每单开工前把 **L0 范围声明 + 对应守卫**抄进该单验收节。**守卫分型:接线单须按执行方式落实——扫描类进 lint/静态检查,行为类进 runtime/集成测试;两种分型都遵循「篡改一处必须红」。**

### L0 验收范围(本单到底实现哪个冻结契约)

接线单先声明:实现 S# + 触碰的 § + 引用守卫。范围外改动 = 越界,不进本单。**L0 未声明不放行进入施工。**

### L1-A 静态架构守卫(扫描类 · 随 test/lint 跑)

| 守卫 | 断言(篡改即红) | 防的债 | 建议触发 |
|---|---|---|---|
| G1 双源 | EffectSpec 声明批准策略 / 拥有 idempotent·retry-eligibility 所有权 | §4 | AST/文本扫描 |
| G2 无 if-id | 按 capabilityId 写死的审批/放行分支(禁 `when/if(id)` 定策略) | §3 | 扫描 + 单测 |
| G3 状态归属 | JobSpec.state 出现 `approved` 或混入审批字段 | §5.1 | 类型/契约断言 |
| G5 可信链 | MONEY / EXTERNAL WRITE 审批文本存在 LLM 唯一/自证路径 | §6.5 | 构建时链路检查 |

### L1-B Runtime 变异守卫(行为类 · 真跑 runtime,每守卫配变异用例)

| 守卫 | 断言(篡改即红) | 防的债 | 变异用例示例 |
|---|---|---|---|
| G4 审批不可变 | 已决 mutate / 覆盖 / 缺 policyFingerprint | §6.1/6.2 | 决策后再 decide → CONFLICT |
| G6 幂等收口 | Engine 拿本地缓存冒充 provider/端到端幂等 | §7 | provider 超时未收结果仍返「第一次成功」→ 红 |
| G7 账本只增 | Ledger 按 key overwrite / 与 Checkpoint 共享可变记录 | §9 | 覆盖已写证据行 → 红 |
| G8 默认断流 | 未声明边的失败/拒/过期放行下游 | §8.1 | A→B,B 拒,B 下游仍执行 → 红 |
| **G9 策略漂移** | Plan/Approval 后安全面变化仍沿用旧批准;Dispatch 不重读 currentEffectivePolicy | §6.6 | A:WRITE→MONEY 旧批必 STALE;B:文案变 fingerprint 不变 → **不误杀**; C:Dispatch 不重读 → 红 |
| **G10 身份归属** | semanticKey / jobId / revision 串线 | §2.1 | semanticKey==jobId → 红;revision 挂 semanticKey → 红;同 semanticKey 新真人指令被当旧 job revision → 红 |
| **G11 证据完整** | 危险路径缺最小完整事件链(**账本只增 ≠ 账本完整**) | §9 + 12.1 | MONEY 链漏 POLICY_VALIDATED / 漂移链漏 STALE → 红 |

### 12.1 G11 最小完整证据链(事件序列模板)

验收断言某执行路径**必须包含最小事件集**,漏记即红(append-only 但漏记 = 不合格):

```
MONEY 主链:  JOB_CREATED → PLAN_VERIFIED → APPROVAL_REQUESTED → APPROVED
             → POLICY_VALIDATED → DISPATCHED → PROVIDER_RESULT → RUN_COMPLETED
策略漂移:    APPROVED → POLICY_CHANGED → APPROVAL_STALE → DISPATCH_BLOCKED
人工接管:    FAILED → INTERVENTION_REQUESTED → HUMAN_PATCH → REVISION_CREATED
             → REVALIDATED → DISPATCHED …
```

每条能力按其 side_effect 选主链模板;危险动作(WRITE×EXTERNAL / MONEY)走漂移分支时必须有 STALE 事件,缺 = 红。

### 12.2 G10 身份归属正例(防误杀,与 L1-B 互补)

```
同业务对象 + 同 capability + 两次真人指令 → semanticKey 相同、jobId 不同
同一个 job 修参数                      → jobId 相同、revision +1(supersedes 指旧版)
```

### L2-A Runtime Integration(无需 UI · 纯集成测试可证)

STALE 拦截 / revision 收敛 / 幂等重入返首次 / Graph 失败传播(边语义)/ Provider 超时判读 / HumanPatch 重走验证 —— 这些**不需要 UI 也能验**,不得因无 UI 而跳过行为验收。

### L2-B Device/UI(必须真机)

审批卡弹出与内容(与 canonical 一致)、按钮行为、**不误执行**(点拒绝后零副作用)、summary 为人读且与 canonical 对应。无 UI 切片如实标「装配级」,不冒充行为级。真机必点房间审批(计划/写入确认,否则卡审批不执行)。

### L3 语义兼容 + Golden Baseline

- Registry 单源:Gate 读取与 `capability-registry.json` 一致;能力删除/降级时旧审批正确 STALE,无幽灵授权。
- UPG-45 ApprovalRegistry / tool-orch(UPG-46/67):工具级确认与能力级审批边界清晰、互不顶替;元能力架构稿 v0.3 §5/§6 契约一致。
- **Golden Baseline(新)**:凡改造 ⚡ 组件(DagPlanner / EffectSpecs / ApprovalService / McpToolScheduler)的 S 单,须带一组固定输入 golden cases:改造前结果快照 → 改造后结果 → 逐项对比。**现测试全绿 ≠ 行为兼容**——测试未覆盖的 parallel / join / failure / confirmRequired 仍会回归,S5 必查。

### L4 交付治理

- 申报:Token 影响 / KV Cache 影响 两节(AGENTS 硬规则 1);请求前缀恒定检查;hash + 证据链;报告落 `程序员\交付报告\`;secrets 不写盘;观测/展示改动对照隐私红线。
- **Acceptance Log 治理**:唯一落点 `docs/ACCEPTANCE_LOG.md` 保持;**append-only —— 已验收条目禁止修改,只追加撤销/补验记录**。S2-S7 并行施工冲突时:各施工者先写子档暂存,验收员逐条汇入唯一日志后子档归档;最终以唯一日志为准。

### L5 Merge Blockers(任一发生 → 禁止合 main,不是「建议修」)

1. 任一 G 守卫红(L1-A / L1-B);
2. 危险能力(MONEY / EXTERNAL WRITE)未在行为级证明 STALE 拦截;
3. 审批 summary 存在 LLM 唯一路径;
4. Ledger 最小证据链不完整(G11);
5. semanticKey / jobId / revision 归属混乱(G10);
6. Registry 当前策略未在 Dispatch 前复验(G9);
7. 需真机(L2-B)切片只有单测、无真机证据;
8. 改造 ⚡ 组件缺 Golden Baseline 对比(S5 必查)。

### 12.3 验收执行口径

验收员按 `docs/ACCEPTANCE_PLAYBOOK.md` 五招执行;真机补验类走工单库「真机补验挂账」区;受限项标 ⏳ 待设计师核实;**合 main 只归设计师**。

## §13 状态与交接

- 版本演进:v0.1(首稿)→ v0.2(吸收 P0 改模型边界)→ **v0.3(契约冻结,收口 ID/版本/审批文本/状态归属)** → **v0.4(验收模板冻结,§12 升级 L0-L5 + G9/G10/G11)**。契约正文与验收模板均可作 MOV 基础设施级基准。
- **待** 设计师合 main / 派单执行:主链契约冻结后,S2-S7 依次成接线单引用本稿(含 §12 判据);每个 S 独立可验收(命令能跑/卡能弹/账能查)。
- 版本脚:本稿后续若无契约级异议即冻结;再有改动以新版本号另起,不静默覆盖已冻结边界。

---

*权责边界冻结优先于功能增量。谁越界谁是债。*
