# UPG-72 执行引擎 · S2 JobSpec+SchemaGate+READ 直跑 — 派单文本

> 出单人:设计师(2026-09-02)｜单号 UPG-72｜优先级 P1
> 施工者:程序员(认领后按此施工)｜验收:验收员(L1/L2/L3)→ 审验员 → 设计师合 main

---

## 一句话

执行链路**第一条接线单**:把「能力注册表」接到第一个能消费它的运行时——落 `JobSpec(revision/semanticKey/capabilityDefinitionVersion)+ Schema Gate + READ 直跑最小闭环`。依据执行引擎契约稿 v0.4(冻结)。**零审批、零 DAG 改造、无 UI**——只走通一条 `fulfill.track` 的 READ 只读链路并留账。

## 环境基础(全基础信息)

| 项 | 值 |
|---|---|
| 主仓库 | `C:\Users\Administrator\0027-mov`(git@github.com:onlywmw/0027-mov.git,Android 主工程) |
| 分支 | 认领 `worktree=mov-upg72`,`branch=feat/upg72`,**基于最新 `main`**(开工前 `git fetch origin`) |
| 前置 | **UPG-71 已合 main @43fd00a**(`docs/capability-registry/` 三文件已在 main:capability-registry.json / .schema.json / check-capability-registry.mjs)——本单只读它,不改它 |
| 构建 | `cd 0027-mov && gradle :app:assembleDebug` |
| 单测 | `cd 0027-mov && gradle :app:testDebugUnitTest`(全量绿以此为准;基线预存 2 失败 AppearanceContractTest L1-10/M-U50-5 属 UPG-70 登记、非本单引入) |
| 真机形态 | 本单无 UI/运行时接线 → 行为级走 **runtime 集成测试**,装配级 = assembleDebug APK 正常实证(v0.4 L2-A/L2-B 分型) |

## 设计文(唯一施工口径)

1. `设计师\方案设计\MOV_执行引擎_架构设计稿.md` **v0.4** —— 契约 §5.1(JobSpec)/§5.2(JobRuntime)/§8.2(回路 READ 分支)/§12(验收模板,本节判据抄走)/§11 切片 S2。
2. `设计师\方案设计\MOV_元能力注册表_架构设计稿.md` v0.3 —— 能力字段语义 / in-out 契约源(本单不重述)。
3. 能力资产(机器读取源):`docs/capability-registry/capability-registry.json`(4 条:fulfill.dispatch WRITE/EXT、fulfill.track **READ**/EXT、settle.pay MONEY/EXT、sense.capture WRITE/LOCAL·candidate)+ `.schema.json`。

## 对账(防重复,已核实)

- 0027-mov 现码 **无** jobId/JobSpec/semanticKey/capabilityId 任何代码(2026-09-02 grep app+tool-orch+mov-tool-orch 全空)→ 新开无重复。
- **本单不改造** DagPlanner/EffectSpecs/ToolOrchestrator(工具粒度骨架 UPG-46/67 保留原样;能力粒度 DAG = S5)。不碰 ApprovalService(审批接线 = S3/S4)。不碰 MainActivity.kt / ApprovalRegistry*。

## 施工

0. **开工**:`git fetch origin`;worktree 基于最新 main;认领登记见派单交接段。
1. **落点**(二选一,优先 A;偏离需在交付报告说明):
   - **A(建议)** 0027-mov 新增 Gradle 模块 `mov-exec-engine`(Kotlin,register 进 `settings.gradle.kts`);仅本地解析 json,不引第三方重依赖、不拉 app 运行时。
   - **B** `tool-orch` 内新增 `com.hermes.mov.orch.exec` 子包 + **新文件**(严禁改现 DagPlanner/EffectSpecs/ToolOrchestrator)。
   - 任选均不得动现 ⚡ 文件语义 / MainActivity.kt(纯 CRLF,禁 Edit)/ docs/ApprovalRegistry*.json。
2. **CapabilityReader**:读 `docs/capability-registry/capability-registry.json` + schema;未知能力 id / 文件缺失 / schema 解析失败 → **明确报错(失败关闭)**,不得默认放行。
3. **JobSpec 数据类**(照 §5.1):`jobId / semanticKey(capabilityId+业务对象) / revision / supersedes? / capabilityDefinitionVersion(计划锚定) / in / dependency[](本单恒空,预留字段) / idempotencyKey`。`state` 枚举仅 `draft/verified/invalid/superseded` —— **禁含 approved,禁混审批字段**(G3)。
4. **Schema Gate**(照 §5.1/§8.2):`JobSpec.in` 对照该能力 in 契约(含 required/类型)——不齐/类型错 → `state=invalid`,记 1 条事件返回;**Schema Gate 失败不得产生任何执行/副作用**(不补参、不进下一步)。
5. **READ 直跑**(照 §8.2 READ 分支):对 `verified` 的 job 查注册表 `side_effect`——`READ` → 放行;执行器 `maxConcurrency=1` 串行;产出 JobRuntime(§5.2 `phase: planned→gated→ready→dispatched→done|failed`)。
   - **WRITE / MONEY 本单必须 blocked**:读到即返回 `DISPATCH_BLOCKED`(等 S3/S4 审批接线),**不得在 S2 手写放行逻辑**(守 G2/G8 精神)。
6. **执行端(impl)**:注册表 `impls` 现为空(产品 impl 归 S5+接线)。本单**只允许测试替身(double)在单测作用域**验证「schema→gate→dispatch→record」链路;替身**不写进** capability-registry.json、不进产品 impls。产品侧 READ dispatch 到「无 impl」→ `state=failed(pending_impl)` 如实记录,不造假成功。
7. **最小账本事件**(§12.1 READ 主链):每次 run 记 append-only 事件 `JOB_CREATED → PLAN_VERIFIED → DISPATCHED →(DISPATCH_BLOCKED 若 blocked)→ RUN_COMPLETED`;本单用内存/文件追加实现,禁覆盖已写行(G7)。ID 归属:语义去重用 `semanticKey`、执行追溯用 `jobId`、`revision` 只挂 `jobId`(G10 口径,本单先落地结构)。

## 验收标准(抄执行引擎稿 §12)

- **L1**(每项亲跑):
  1. **G2 无 if-id**:exec 层出现按 capabilityId 写死的放行/策略分支 → 静态评审红;
  2. **G3 状态归属**:JobSpec.state 含 `approved` 或混入审批字段 → 类型契约红;
  3. **Schema Gate 行为**:非法 in → `invalid` 且 0 副作用;篡改「跳过 schema 直接 dispatch」→ 红;
  4. **READ 放行 / WRITE+MONEY 必 blocked**:篡改「WRITE 也放行」→ 红;
  5. **G7 账本只增**:覆盖已写事件行 → 红;
  6. **G11 READ 主链**:run 后事件集必含 JOB_CREATED/PLAN_VERIFIED/DISPATCHED/RUN_COMPLETED 最小集,漏记 → 红;
  7. 全量绿 `gradle :app:testDebugUnitTest` + assembleDebug BUILD SUCCESSFUL;UPG-71 `check-capability-registry` 不回归;`node scripts/check-token-effect.mjs` 过。
- **L2 真机**:无 UI → 如实标:装配级 assembleDebug APK 正常;行为级以 **runtime 集成测试实证**(schema 拦截 / READ 放行 / WRITE blocked / 账本事件),不冒充 UI 真机行为级。
- **L3 语义一致**:Gate 读取与 capability-registry.json 单源一致(能力删改时行为正确、失败关闭);未动 ApprovalRegistry*/tool-orch 现语义/MainActivity.kt;与元能力 v0.3 §5/§6 契约一致。
- **Golden Baseline**:本单不改 ⚡ 组件 → 不触发;若落点 B 需动 tool-orch 构建配置 → 提供现测试全绿证明。

## 红线

1. **禁第二策略源**:引擎代码禁 `if(capabilityId==…)` 写死审批/放行;JobSpec 无 approved。
2. **零改动 ⚡**:MainActivity.kt(纯 CRLF 禁 Edit)/AgentLoop/McpToolScheduler/ApprovalService/DagPlanner/EffectSpecs/ToolOrchestrator 现文件语义 / `docs/ApprovalRegistry*.json`。
3. **只做 L0,不越界**:本单不实现审批/幂等去重/失败自动重试(留 S3/S4/S6)——不得顺手实现超范围;WRITE/MONEY 一律 blocked 等接线,不手写放行。
4. **禁占位/编造 impl**:产品 impls 不新增、capability-registry.json 不改;测试替身仅测试作用域。
5. **Token 影响 / KV Cache 影响** 两节申报(AGENTS 硬规则 1);请求前缀恒定;不引入需 key 的第三方依赖(纯本地 json 解析)。
6. 冻结项(room.html/markstream/二维码收费/本地大模型/视频卡片)不碰。

## 派单交接段

1. 开工前 `git fetch origin` + 看表(确认 main 最新,UPG-71 @43fd00a 在 main)。
2. 认领:工单表 UPG-72 备注追加 `认领: <agent> worktree=mov-upg72 branch=feat/upg72 @<时间>`。
3. 完成后**先表后库**登记;报告落 `程序员\交付报告\DELIVERY_UPG72_*.md` 写明「已登记两表」+ hash + 证据链(新模块源码 + 守卫变异亲杀 + READ 直跑/blocked 实证 + 账本事件输出 + Token/KV Cache 两节申报)。
