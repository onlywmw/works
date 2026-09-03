# DELIVERY UPG-72 · 执行引擎 S2 · JobSpec + Schema Gate + READ 直跑最小闭环

> 程序员（AI）｜ 2026-09-02 ｜ 分支 `feat/upg72`（worktree `mov-upg72`，基底 `main 43fd00a`）｜ commit `bd958d2e11eb439e34a6e674b5f52690ccddd81a`（本地，未合 main）
> 设计：`C:\Users\Administrator\Desktop\MOV_执行引擎_架构设计稿.md` v0.4（§5.1/§5.2/§8.2/§12/§12.1，S2）+ 元能力架构稿 v0.3 ｜ 派单：`设计师\派单\UPG-72_执行引擎S2_JobSpec+SchemaGate+READ直跑_派单_2026-09-02.md`
> **已登记两表**（工单库.md + 工单表.xlsx；状态行「🔧 C 交付」+ 交付登记块为库侧唯一写入，工单表经 sync-orders.mjs 单向生成，diff=0 / 59 卡）

## 一、交付物（17 文件 / +1332，纯新增 + settings 注册 1 行）

| 产物 | 路径 |
|---|---|
| Gradle 模块注册 | `settings.gradle.kts`（`include(":mov-exec-engine")` +1 行） |
| 模块构建 | `mov-exec-engine/build.gradle.kts`（kotlin jvm + java-library，Java 17，test 仅 junit 4.13.2，零第三方运行时依赖） |
| 内嵌 JSON | `.../exec/json/MiniJson.kt`（sealed JsonNode，零依赖，JObj/JArr/JStr/JNum/JBool/JNull + parse/print/escape） |
| 能力注册表只读视图 | `.../exec/registry/CapabilityReader.kt`（CapabilityRegistry.load：结构/枚举/required⊆properties/字段类型 四重失败关闭自检；未知能力 id → require() 抛） |
| JobSpec | `.../exec/job/JobSpec.kt`（state 仅 DRAFT/VERIFIED/INVALID/SUPERSEDED，**禁 approved**，G3；含 semanticKey/idempotencyKey/dependencies/supersedes） |
| JobRuntime | `.../exec/job/JobRuntime.kt`（Phase/DispatchStatus/PhaseRecord，dispatch 终态机） |
| Schema Gate | `.../exec/gate/SchemaGate.kt`（对照能力 in 契约：required 不齐 / 多余键 / 类型错 → Rejected，**fail-closed 零副作用**） |
| 执行引擎 | `.../exec/ExecEngine.kt`（单趟：JOB_CREATED → SchemaGate → PLAN_VERIFIED/GATE_REJECTED → READ 直跑 / WRITE·MONEY 一律 DISPATCH_BLOCKED；maxConcurrency=1 串行；无 impl → failed(pending_impl) 如实记录） |
| 账本 | `.../exec/ledger/Ledger.kt`（LedgerEventType 7 事件；InMemoryLedger + FileLedger append-only；FileLedger open() 校验 index==行序，失败关闭） |
| 测试 | 7 类 / 35 用例全绿（MiniJson 4 / CapabilityReader 6 / SchemaGate 7 / ExecEngine 8 / FileLedger 3 / GuardInvariant 4 / RealAssetSmoke 3） |

commit：`bd958d2e11eb439e34a6e674b5f52690ccddd81a`

## 二、施工要点（照派单 L0 范围 = S2）

- **能力定义消费**：引擎侧只取 gate/dispatch 所需字段；**side_effect/env/state 词表来自注册表 schema**（`properties.enums.properties.<k>.items.enum`），构造时逐能力校验，越界即抛——策略唯一来源 = 注册表 `side_effect` 声明，代码零分支写死。
- **Schema Gate 失败关闭**：in 对照能力 in 契约——缺必填 / 多余未知键 / 值类型不符 → `Rejected`，JobSpec 转 INVALID，账本记 GATE_REJECTED，**0 副作用**（不触碰任何 runner）。
- **READ 直跑 / WRITE·MONEY blocked**：`dispatch` 仅按 `def.sideEffect` 分发：`READ` →（有 runner）DISPATCHED+RUN_COMPLETED /（无 runner）RUN_FAILED(pending_impl)；`WRITE`/`MONEY` → 一律 `DISPATCH_BLOCKED`，不手写放行、不做占位 impl。
- **账本事件主链**：READ = `JOB_CREATED → PLAN_VERIFIED → DISPATCHED → RUN_COMPLETED`；blocked = `JOB_CREATED → PLAN_VERIFIED → DISPATCH_BLOCKED`；Gate 拒 = `JOB_CREATED → GATE_REJECTED`——append-only，Ledger 无覆盖/改写方法（G7）。
- **产品 impls 零新增**：注册表 `impls` 不动、`capability-registry.json` 不改；READ 直跑注入的测试替身 runner（`ReadOnlyRunner`）仅测试作用域，产品 `ExecEngine` 默认 `runner=null`（如实记 pending_impl）。

## 三、红线守约

1. **零 ⚡ 文件改动**：MainActivity.kt / DagPlanner / EffectSpecs / ToolOrchestrator / ApprovalService / ApprovalRegistry\* 全未触碰；`git status` 提交面仅 mov-exec-engine 新文件 + settings 一行。
2. **禁第二策略源**：GuardInvariantTest 静态扫描源——`capabilityId ==/!= "…"` 零命中（G2）；JobSpec state 枚举无 approved、无 approval 字段（G3）。
3. **无 key 第三方依赖**：零运行时依赖，JSON 自研内嵌。

## 四、验证证据（实测）

- **L1① 单测全量**：`:mov-exec-engine:test` → **35 passed / 0 failed**（7 测试类，含正式资产冒烟 3 条实跑 `docs/capability-registry/` 四能力 + L3 单源一致）。
- **L1② 守卫变异亲杀 6/6 全红还原复绿**（篡改临时副本后 restore，非交付代码）：
  1. G3 注入 `APPROVED` 枚举 → ✗ GuardInvariantTest 变红 → 还原复绿
  2. SchemaGate 直放行（删校验返 Verified）→ ✗ SchemaGateTest 变红 → 还原复绿
  3. WRITE/MONEY 按 capabilityId 手写放行 → ✗ G2 静态扫描 + ExecEngineTest 变红 → 还原复绿
  4. G7 账本 index 篡为 0L（覆盖复用）→ ✗ GuardInvariantTest 变红 → 还原复绿
  5. G11 删 RUN_COMPLETED（READ 主链断尾）→ ✗ ExecEngineTest 事件链断言变红 → 还原复绿
  6. G2 if(capabilityId==…) 写死分支 → ✗ GuardInvariantTest 变红 → 还原复绿
- **L1③ READ 直跑 / blocked 实证**（ExecEngineTest + RealAssetSmokeTest 断言）：
  - READ `fulfill.track`（注入 ReadOnlyRunner 测试替身）→ `DISPATCHED` + 账本 `JOB_CREATED→PLAN_VERIFIED→DISPATCHED→RUN_COMPLETED`
  - WRITE `fulfill.dispatch` → `DISPATCH_BLOCKED`；MONEY `settle.pay` → `DISPATCH_BLOCKED`（正式资产实跑）
  - Schema Gate 拒：缺 booking_id → `GATE_REJECTED` + `INVALID` + 0 副作用
  - 无 impl READ → `RUN_FAILED` + phase FAILED（pending_impl 如实记录，不编造结果）
- **L1④ 全量**：`assembleDebug` BUILD SUCCESSFUL；`:app:testDebugUnitTest` 683 完成 **2 failed 1 skipped**——2 失败 = `AppearanceContractTest`（L1-10 / M-U50-5）为 **main@43fd00a 基线预存**（UPG-70 已登记，红线禁改外观收拢版，未修）；本单纯新增独立 JVM 模块不参与 app 测试类 → 未引入任何新失败。`node scripts/check-capability-registry.mjs` 通过（UPG-71 回归）；`check-token-effect.mjs` exit=0。

## 五、Token / KV Cache 影响（AGENTS.md 硬规则 1）

- **Token 影响**：0/0——纯新增静态 JVM 库，零请求链路改动（AgentLoop/LlmClient/Session/MCP tools/system prompt 零接触；app 侧未接线该引擎，S2 仅模块内闭环自测）。
- **KV Cache 影响**：0/0——请求前缀字节恒定，无会话历史投影/压缩/折叠；AI 面 tools/system prompt 会话中途不变。

## 六、L2 / L3（留给验收员）

- **L2**：如实标「装配级 + 行为级单元实证」——本单无 UI、无 app 运行时接线；行为级（LLM 查表接线、bundle/job 真实落代码路径）留接线单 S3/S4/S6（审批 / 幂等去重 / 自动重试均按派单红线不做）。
- **L3**：与 `docs/capability-registry/` 正式资产**单源一致**（RealAssetSmokeTest 直接读仓库资产实证 4 能力加载 + READ/WRITE/MONEY 三副作用分派）；与 UPG-45 ApprovalRegistry（工具级审批）、UPG-46+67 tool-orch 语义零冲突——业务语义独立模块，纯新增、无引用、未清改。
