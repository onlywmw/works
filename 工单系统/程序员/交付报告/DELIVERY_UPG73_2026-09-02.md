# DELIVERY UPG-73 · 执行引擎 S3 · 审批双快照核心（ApprovalSnapshot + 首决胜 + STALE）+ WRITE/MONEY 接审批

> 程序员（AI）｜ 2026-09-02 ｜ 分支 `feat/upg73`（worktree `mov-upg73`，基底 `main bd958d2`）｜ commit `c2a0a928c908c92d4219995fa9704b8d01245c76`（本地，未合 main）
> 设计：`C:\Users\Administrator\Desktop\MOV_执行引擎_架构设计稿.md` v0.4（§6.1 双快照/§6.2 首决胜/§6.5 可信链禁 LLM/§6.6 dispatch 前 STALE 复验/§12 验收 G4/G5/G9，S3）+ 元能力架构稿 v0.3 ｜ 派单：`设计师\派单\UPG-73_执行引擎S3_审批双快照核心_派单_2026-09-02.md`
> **已登记两表**（工单表.xlsx + 工单库.md，先表后库）：工单表.xlsx 经 sync-orders.mjs 单向生成（diff=0 / 60 卡）；「🔧 C 交付」状态行 + 施工交付登记块为库侧唯一写入

## 一、交付物（13 文件 / +772 / -40，纯新增 approval 子包 + ExecEngine 一分发点接线）

| 产物 | 路径 |
|---|---|
| canonical 稳定序列化 | `.../exec/approval/CanonicalCodec.kt`（键排序/数组保序/拒非有限数失败关闭 + `canonicalHash`=sha256 64hex，自含 RFC8259 escape） |
| 人读层确定性渲染 | `.../exec/approval/DeterministicSummaryRenderer.kt`（§6.5 禁 LLM：纯函数两行 `op/参数`，对象参数以 canonical 机器形同源渲染） |
| 安全面指纹 | `.../exec/approval/PolicyFingerprint.kt`（sha256 = `side_effect+env`，同面稳定/收紧必变，G9-A） |
| 审批双快照 | `.../exec/approval/ApprovalSnapshot.kt`（canonical 机器层 canonicalPayload/canonicalHash + summary 人读层；summaryVersion=v1 / approvalScope=capability_call） |
| 请求/记录/簿 | `.../exec/approval/ApprovalRequest.kt`（requestId=`apr_`+sha256(runId+capabilityId+canonicalHash+fp)，同 run 同 snapshot 复现）+ `ApprovalBook.kt`（首决胜：pending→decided 唯一推进，二次 decide→CONFLICT 不覆盖，无 update/remove/delete 入口 G4） |
| 执行引擎接线 | `.../exec/ExecEngine.kt`（WRITE/MONEY：S2 `DISPATCH_BLOCKED` 占位 → 建 snapshot+request → `APPROVAL_REQUESTED`+`pending_approval` 挂起 fail-closed → `review` 首决胜 → `dispatchApproved` dispatch 前 **STALE 复验** 漂移作废；S2 READ 直跑路径零改动） |
| 账本事件扩展 | `.../exec/ledger/Ledger.kt` + `.../job/JobRuntime.kt`（append-only 增 `APPROVAL_REQUESTED → APPROVED\|REJECTED\|APPROVAL_STALE`；DispatchStatus 增 PENDING_APPROVAL/APPROVED/APPROVAL_STALE/DISPATCH_BLOCKED；G7 不变） |
| 测试 | 2 测试类新增 17 用例（ApprovalCoreTest 8 + ApprovalGuardTest 9）；ExecEngineTest/RealAssetSmokeTest 的 WRITE/MONEY 断言改「进审批 pending_approval」 |

commit：`c2a0a928c908c92d4219995fa9704b8d01245c76`

## 二、施工要点（照派单 L0 范围 = S3）

- **策略源唯一** = 注册表 `side_effect` 声明：`READ` 直跑 / `WRITE`·`MONEY` 进审批；引擎无 `if(capabilityId…)` 写死分支（G2，GuardInvariant 静态扫描持续生效）。
- **fail-closed 审批闭环**：WRITE/MONEY run → `approval_requested` 事件 + Book 挂起 pending_approval；无 review 裁决前 `dispatchApproved` 抛 IllegalStateException（未决不可派发，绝不自放行）。
- **首决胜原子决策**：`review(requestId, Approve/Reject)` → Book 首次裁决生效；已决二次 → `Conflict` → ExecEngine 抛 CONFLICT 失败关闭；已决 Record 无覆盖/撤销入口（G4）。
- **deterministic summary 可信链**：ApprovalSnapshot 由 canonical 参数 + 能力声明纯函数渲染，无随机/无时钟/无网络/无 LLM（§6.5）；效力链 = canonical(payload) →(deterministic)→ summary。
- **dispatch 前 STALE 复验**（§6.6）：Approval 绑定批准时 `policyFingerprint`；dispatch 时重读现况指纹比对——漂移 → `APPROVAL_STALE` 旧批作废不派发（Ledger 记 STALE 事件）；一致 → DISPATCHED（impl 执行接线 S5+，不造假 RUN_COMPLETED）。

## 三、红线守约

1. **禁第二策略源**：审批与否全由注册表 `side_effect` 声明驱动，源码零 `if(capabilityId)` 审批/放行分支（G2）。
2. **零 ⚡ / 既有审批改动**：MainActivity.kt / AgentLoop / McpToolScheduler / `ApprovalService.kt`（工具级）/ docs/ApprovalRegistry\* / tool-orch 全未触碰；能力级审批为新层，与工具级边界清晰（L3）。
3. **只做 L0**：不做 UI 弹卡/真人 reviewer UI/TTL EXPIRED/ApprovalGroup 状态机（=S4）；未决态保留给 S4 接续。
4. **summary 禁 LLM**：G5 静态锚扫描 approval 源码——Llm/HttpClient/OpenAI/completions/Random/SecureRandom/UUID/currentTimeMillis/nanoTime 零命中。
5. **registry 资产只读**：capability-registry.json/schema/UPG-71 校验零改动。
6. **无 key 第三方依赖**：approval 子包零运行时依赖，全部基于内嵌 MiniJson/canonical 自研。

## 四、验证证据（实测）

- **L1① 单测全量**：`:mov-exec-engine:test` → **52 passed / 0 failed / 0 errors**（approval 子包 17 用例 + S2 既有 35 用例不回归）。
- **L1② 守卫变异亲杀 4/4 全红还原复绿**（篡改源码临时副本 → 守卫测试红 → 还原复绿，非交付代码）：
  1. **G4** 二次 decide 变异（Conflict 改 FirstWin 允许覆盖）→ `G4 已决 Record 二次 decide 红 - 首决生效且不被覆盖` FAILED → 还原复绿；
  2. **G5** summary 注入时钟（`append("t="+System.currentTimeMillis())`）→ G5 禁 token 扫描 + `summary 确定性` 2 测试 FAILED → 还原复绿；
  3. **G9** dispatchApproved 跳复验（`if (fpNow != fpLocked)` 改 `if (false)`）→ `G9 安全面变严 - dispatch 前复验旧批 APPROVAL_STALE 不 dispatch` FAILED → 还原复绿；
  4. **审批闭环/默认放行** WRITE/MONEY 绕过 requestApproval 直 dispatchRead → approve 闭环 / reject 闭环 / no-reviewer fail-closed / G9 STALE 4 测试 FAILED → 还原复绿。
- **L1③ 审批闭环 / STALE 实证**（ApprovalGuardTest + RealAssetSmokeTest 断言）：
  - WRITE `fulfill.dispatch` / MONEY `settle.pay` run → `PENDING_APPROVAL` + 账本 `JOB_CREATED→PLAN_VERIFIED→APPROVAL_REQUESTED`（正式资产实跑）；
  - approve `settle.pay` → `APPROVED` → dispatchApproved 复验通过 → `DISPATCHED`（账本含 APPROVED/DISPATCHED，无 STALE）；
  - reject → `DISPATCH_BLOCKED`（账本含 REJECTED，无 DISPATCHED/APPROVED）；
  - 无 reviewer → 挂起 pending_approval；未决 request 直接 dispatchApproved → IllegalStateException 失败关闭；
  - G9 收紧（settle.pay env EXTERNAL→LOCAL 换 registry）→ dispatchApproved → `APPROVAL_STALE` 旧批不 dispatch（账本含 APPROVAL_STALE，无 DISPATCHED）。
- **L1④ 全量**：`:app:testDebugUnitTest` 683 完成 **2 failed 1 skipped**——2 失败 = `AppearanceContractTest`（L1-10/M-U50-5）为 main@bd958d2 **基线预存**（UPG-70 已登记，非本单引入）；`:app:assembleDebug` BUILD SUCCESSFUL；`node scripts/check-capability-registry.mjs` 通过（4 能力/计数不变，UPG-71 不回归）；`node scripts/check-token-effect.mjs` exit=0。

## 五、Token / KV Cache 影响（AGENTS.md 硬规则 1）

- **Token 影响**：0/0——纯新增静态 JVM 模块内审批域逻辑，零请求链路改动（AgentLoop/LlmClient/Session/MCP tools/system prompt 零接触；app 侧未接线该引擎，S3 仅模块内闭环自测）。
- **KV Cache 影响**：0/0——请求前缀字节恒定，无会话历史投影/压缩/折叠；AI 面 tools/system prompt 会话中途不变。

## 六、L2 / L3（留给验收员）

- **L2**：如实标「装配级 + 行为级单元实证」——本单无 UI、无 app 运行时接线；装配级 assembleDebug APK 正常；行为级（approve 放行 / reject blocked / 无 reviewer 挂起 / STALE 拦截）以 runtime 集成测试实证；真人弹卡 = S4。
- **L3**：审批策略源与 `docs/capability-registry/` 单源一致（side_effect 声明驱动，无 if-id 第二策略源）；与现工具级 ApprovalService/ApprovalRegistry* **边界清晰互不顶替**（能力级审批为新层，零并入零清改）；未动 MainActivity.kt / ApprovalRegistry* / tool-orch；Golden Baseline 未触发（仅扩展 exec-engine 新子包 + ExecEngine 一分发点，未触 ⚡ DagPlanner/EffectSpecs/ToolOrchestrator）。
