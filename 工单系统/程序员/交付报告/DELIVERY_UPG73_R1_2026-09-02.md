# DELIVERY UPG-73 · R1 打回修复 · 审批线程安全 + 五元同验 + summary 折叠 + dispatch-once

> 程序员（AI）｜ 2026-09-02 ｜ 分支 `feat/upg73`（worktree `mov-upg73`，基底 `main bd958d2`）｜ commit `add9e8ca733c10d9c52ec7832e44f4d08fbbcfb7`（本地，未合 main）
> 依据：验收员打回 ACCEPTANCE_LOG §P29（commit 4c06516）——HIGH ApprovalBook 非线程安全 / MEDIUM-1 五元只验一元 / MEDIUM-2 summary 人读层无转义 / LOW dispatch-once 无一次性消费 / 测试缺口四类
> R1 复验入口（§P29）：并发 decide 双通道测试（Reject 不被覆盖）+ 五元同验（definitionVersion 漂移→STALE）+ S2 35 不回归 + 原 4 变异还原复绿
> **已登记两表**（工单表.xlsx + 工单库.md，先表后库）：工单表.xlsx 经 sync-orders.mjs 单向生成（diff=0 / 60 卡）；「R1 修复交付」状态行 + R1 打回修复登记块为库侧唯一写入

## 一、修复范围（5 文件 / +273 / -31，限 approval 子包 + ExecEngine）

| 打回项 | 级 | 修复 | 文件 |
|---|---|---|---|
| ApprovalBook 非线程安全 | HIGH | LinkedHashMap+check-then-act → `ConcurrentHashMap` + `putIfAbsent` 登记 + `decide` compute 单桶锁内原子首决胜 | `approval/ApprovalBook.kt` |
| 五元只验一元 | MEDIUM-1 | dispatchApproved 前对现况 registry 复验五元（capabilityId / capabilityDefinitionVersion / policyFingerprint / approvalScope + SchemaGate 重跑 canonical 输入） | `exec/ExecEngine.kt` |
| summary 人读层无转义 | MEDIUM-2 | 字符串值 `\n` 等控制符转可见转义，恒两物理行 | `approval/DeterministicSummaryRenderer.kt` |
| dispatchApproved 无一次性消费 | LOW | dispatch-once：终态 DISPATCHED/APPROVAL_STALE 一次性消费，二次 dispatch 拒绝 | `exec/ExecEngine.kt` |
| 测试缺口四类 | — | `ApprovalR1Test` 7 用例 + `ApprovalCoreTest` summary 折叠 1 | `approval/ApprovalR1Test.kt`（新）+ `ApprovalCoreTest.kt` |

commit：`add9e8ca733c10d9c52ec7832e44f4d08fbbcfb7`

## 二、修复要点

- **HIGH 并发首决胜（§P29）**：`ApprovalBook.records = ConcurrentHashMap`；`record` 用 `putIfAbsent`（重复登记幂等拒）；`decide` 经 `compute(requestId)` 在单桶锁内原子 check-then-act——winner 装入 `rec.copy(decision)`，loser 见已决 → `Conflict`（attempted 不入册）。多通道并发 decide 同 requestId 恰一 FirstWin；**Reject 赢后不被并发 Approve 覆盖**；`ApprovalRecord` 仍为纯值对象无 var（G4 source-scan 不破）；dispatch 读 decision 后无 TOCTOU 翻面（已决后 decision 永不回写）。
- **MEDIUM-1 五元同验（§6.6 扩展）**：dispatchApproved 在放行前对**现况** registry 逐维复验批准时锁定的五元：① capabilityId 存在（已移除 → STALE）② capabilityDefinitionVersion（`registry.schemaVersion` ≠ 批准锁定 → 契约演进 → STALE）③ policyFingerprint（原 §6.6 STALE 复验，安全面漂移）④ approvalScope（非 `capability_call` → STALE）⑤ **SchemaGate 重跑已批准 canonical 输入**（现况 in 契约收紧/类型变严 → 旧批拒）。任一漂移/拒 → `APPROVAL_STALE` 记账、旧批不 dispatch、返回 STALE outcome。
- **MEDIUM-2 summary 折叠**：renderValue 字符串值控制符折叠为可见转义（`\\`→`\\\\`、`\n`→`\\n`、`\r`/`\t`/`\b`/`\f`/`<0x20`→`\uXXXX`）——summary 恒为两物理行（op/参数），`\n` 注入不得伪造多行弹卡（视觉欺骗封堵）；canonical 层同源、禁 LLM 仍守。
- **LOW dispatch-once（§P29 LOW）**：引擎内 `ConcurrentHashMap.newKeySet` 一次性消费——终态 DISPATCHED/APPROVAL_STALE 只放行一次，二次 dispatch 抛 IllegalStateException（防 S5 接 runner 重放通道）。

## 三、红线守约（R1 未破 round-1 任何红线）

1. **禁第二策略源**：审批与否仍全由注册表 `side_effect` 声明驱动，源码零 `if(capabilityId)` 审批/放行分支（G2，GuardInvariant 静态扫描不回归）。
2. **零 ⚡ / 既有审批改动**：MainActivity.kt / AgentLoop / `ApprovalService.kt` / docs/ApprovalRegistry\* / tool-orch 零触碰（git diff 核对仅 mov-exec-engine 内 5 文件 approval 域）。
3. **只做 L0 修复**：不做 UI 弹卡/真人 reviewer/TTL EXPIRED/ApprovalGroup（仍 S4）；summary 折叠是人读层转义非交互改动。
4. **summary 禁 LLM**：DeterministicSummaryRenderer 仍纯函数，G5 静态锚零命中（无 Llm/HttpClient/Random/UUID/时钟）。
5. **registry 资产只读**：capability-registry.json/schema 零改动；测试用 registry 为内存构造/字符串替换副本。

## 四、验证证据（实测）

- **L1 全量**：`:mov-exec-engine:test` → **60 passed / 0 failed / 0 errors**（approval 25 = Core 9 + Guard 9 + R1 7 + S2 既有 35 不回归）。
- **R1 变异亲杀 4/4 全红还原复绿**（篡改源码临时副本 → 守卫测试红 → 还原复绿，非交付代码）：
  1. **HIGH** decide 还原非线程安全 check-then-act → `并发 decide 双通道` FAILED → 还原复绿；
  2. **MEDIUM-1a** 删 definitionVersion 同验 → `definitionVersion 漂移 → STALE` + STALE-once 2 测试 FAILED → 还原复绿；
  3. **MEDIUM-1b** 删 SchemaGate 重跑 → `SchemaGate 重跑收紧 → STALE` FAILED → 还原复绿；
  4. **LOW** 删 dispatch-once → 二次 dispatch（DISPATCHED 后 / STALE 后）2 测试 FAILED → 还原复绿。
- **并发实证**：`并发 decide 双通道` 300 轮双线程（CyclicBarrier 同发，Approve×Reject）——恰一 FirstWin（winIdx∈{0,1}）、败者 Conflict.existing=首决、终态=首决不被覆盖；**approveWon>0 ∧ rejectWon>0**（双向都覆盖，Reject 不被 Approve 覆盖已验到）。
- **五元同验实证**（ApprovalR1Test，settle.pay MONEY/EXTERNAL 正式资产）：能力移除（改名 `.v999`）→ STALE；definitionVersion 漂移（schema_version 0.3→0.4，fp 隔离不变）→ STALE「定义版本漂移」；SchemaGate 收紧（intent_id 入 required，fp/version 不变）→ STALE「SchemaGate 重跑拒绝」；无漂移 approve 链（fulfill.dispatch）→ DISPATCHED 非回归。账本均记 APPROVAL_STALE、无 DISPATCHED。
- **dispatch-once 实证**：已 DISPATCHED 的 requestId 二次 dispatch → IllegalStateException「dispatch-once」；已判 STALE 的 requestId 二次 dispatch 同样拒绝。
- **summary 折叠实证**：`fulfill.track` booking_id=`"b\nop: 伪造审批行"` 注入——summary 仍两物理行、无「op: 伪造审批行」独立行、字符串渲染为 `b\\nop: 伪造审批行`（可见转义防视觉欺骗）。
- **app 侧零接触**：改动限 mov-exec-engine 模块；`:app:testDebugUnitTest` 维持 round-1 基线 683/2（2 失败 = AppearanceContractTest main@bd958d2 预存，非本单引入）。

## 五、Token / KV Cache 影响（AGENTS.md 硬规则 1）

- **Token 影响**：0/0——R1 仍纯模块内审批域逻辑（线程安全容器替换 + 引擎内复验 + 渲染转义），零请求链路改动（AgentLoop/LlmClient/Session/MCP tools/system prompt 零接触）。
- **KV Cache 影响**：0/0——请求前缀字节恒定，无会话投影/压缩/折叠；AI 面 tools/system prompt 会话中途不变。

## 六、R1 复验入口（留给验收员，§P29）

① 并发 decide 双通道测试（Reject 不被覆盖，`ApprovalR1Test.并发 decide 双通道…`，300 轮）② 五元同验 definitionVersion 漂移→STALE（`ApprovalR1Test.定义版本漂移`）③ S2 35 不回归（`mov-exec-engine` 全量 60/0 内含）④ 原 4 变异还原复绿（round-1 G4/G5/G9/闭环 4 杀 + R1 新增 4 杀均还原复绿，模块全量绿）。复验通过 → 审验员 → 设计师合 main。
