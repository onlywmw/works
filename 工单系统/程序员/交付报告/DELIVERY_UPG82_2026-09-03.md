# DELIVERY_UPG82_2026-09-03 · UPG-82 执行引擎 S4（ApprovalGroup 双状态机 + EXPIRED + EdgePolicy 失败传播）

> 程序员：C（Claude/wmw0027）｜ 认领登记 @2026-09-03 09:39（工单库 UPG-82 卡）｜ 结论：**五件全交，模块 14 套件 88/0/0，4 变异锚亲杀全红→还原复绿，装配级绿——待验收员验收**

---

## 〇、交付绑定（SYS-01 P0-2 · 红线 23）

```yaml
delivery_id: DEL-UPG82-20260903-001
standard_id: STD-UPG-82-v1   # content_sha256=6a1ab899c89923d977b76979a5d5c1221cd6d48b3a505cd32d777003c5c03a59
code_commit_sha: 6e9f90e     # feat/upg82（基 main 8647ee9 = origin/main 顶，fetch 实证后新建分支）
artifact_sha: 25fad4bafc1c605095f5b3f84c1eba95a7fae739935a13b997c46db237d7db23   # app-debug.apk 56157871B（assembleDebug 绿）
evidence_manifest_sha: 160fcd57512690ab30a504dc1800aeff3eb140a3cdd412727e2c71da637d05d4  # 处理中心/delivery_UPG82_manifest.json
```

- **登记前 verify-hash**：见 §九（`审验.py --verify-hash feat/upg82 6e9f90e` → HASH_OK 后方可登记 delivery_id）。
- manifest 算法注记：E-001/002/003 的 `sha256` = 目录内 **sorted 文件名+内容** 依次 sha256（聚合口径，报告 §八声明）；manifest 文件本身 sha256 = evidence_manifest_sha。

## 一、L0 范围声明（§12：未声明不放行）

| 项 | 值 |
|---|---|
| 实现切片 | **S4**（ApprovalGroup 状态机 + EXPIRED，§11 切片表） |
| 触碰契约节 | §6.3（超时 EXPIRED≠REJECTED）/ §8.1（EdgePolicy 值集+默认断流+Graph-local）/ §8.3（双状态机）/ §12（守卫 G4/G8/G11 + 12.1 事件链模板） |
| 引用守卫 | G4（行为类，runtime 变异）/ G8（行为类）/ G11（行为类+检测函数）/ G7（持续守，未动接口）/ G2（持续守，无 id 分支）/ G5（持续守，approval 新文件零时钟零随机零 LLM token） |
| 范围外 | UI/app 编排（未接）、幂等 S6（未做）、Graph 模型 S5（未做——JobSpec.dependencies 未动，EdgePolicy 只落值集引擎+判定纯函数） |

## 二、施工内容（五件）

1. **ApprovalGroup 双状态机**（新 `approval/ApprovalGroup.kt`）：Group `PENDING → PARTIALLY_DECIDED → COMPLETED | EXPIRED | STALE`；Node `PENDING` 初态 + `approved | rejected | blocked | expired | stale` 五终态（§8.3 词表）。组创建=单次提交（一次一批卡，组 id=`grp_`+sha256 成员排序+createdAt，确定性复现、重发=新组）；**逐条独立授权**（per-requestId 首决胜）；全节点终态→COMPLETED。`ApprovalGroupBook` 线程安全 = ConcurrentHashMap + compute 单桶锁（UPG-73 §P29 HIGH 教训前置：check-then-act 全部在锁域内）；无 update/remove/rollback/overwrite/cancel 等禁入口（G7 同纪律，反射锚测试锁定）。
2. **EXPIRED（§6.3）**：`expire(nowMs)` TTL 超时 → 组 EXPIRED + PENDING 节点 → EXPIRED（**≠REJECTED**——不默认批/不默认拒）；**不复活旧 token**：组终态 EXPIRED/STALE 封死全部 dispatch 通道——组闸内嵌 `ExecEngine.dispatchApproved`（S3 直呼同样被拦，防绕道 fail-closed），`dispatchApprovedNode` 组态闸前置；**要跑=重新发起新审批** = 新 revision → 新 runId → 新 requestId 新组（同 revision 重跑被 S3 requestId 幂等拒绝，即新组强制的机制表达）。MONEY 节点超时三不（非 approved 非 rejected，须重新确认）实测锁定。
3. **EdgePolicy（§8.1）**（新 `approval/EdgePolicy.kt`）：值集 enum 冻结 `BLOCK | SKIP | CONTINUE_INDEPENDENTLY | REQUIRE_HUMAN_INTERVENTION`（业务不可自造第五值）；`DEFAULT` 全失败通道 BLOCK（**G8 默认断流**）；`CONTINUE_INDEPENDENTLY` 仅 `declared()` 显式入口（bundle 声明唯一豁免通道）；`channelOf/decideUpstream/aggregateUpstreams` 纯函数——**Graph-local**：C 能否跑 = C 对各上游边语义逐边判定后聚合（保守序 BLOCK > REQUIRE_HUMAN > SKIP > RUNNABLE），stale 归 BLOCKED 通道（漂移作废按阻断）；PENDING 不产生传播判定。**Graph 模型不建**（S5 边界：JobSpec.dependencies 未动，判定函数供 S5 消费）。
4. **G11 事件链**（`ledger/Ledger.kt` 枚举 +4 事件、新 `ledger/G11Chains.kt`）：`POLICY_VALIDATED`（dispatch 前五元复验通过点，落 `dispatchApproved` 内、DISPATCHED 前）/ `APPROVAL_PARTIALLY_DECIDED`（部分批准迁移）/ `APPROVAL_GROUP_COMPLETED`（组终态）/ `APPROVAL_EXPIRED`（TTL 过期）。`G11Chains` 四模板（MONEY 主链 [S4 截断到 DISPATCHED——PROVIDER_RESULT/RUN_COMPLETED 归 S5，不造假] / 部分批准分支 / 漂移 STALE 分支 / 过期分支）+ `missingMinimalEvents` 漏记检测纯函数（有序子序列、缺失项不消费游标、乱序同报）。append-only 未动（G7）。
5. **守卫固化**（4 变异锚，STD L3 必填）：见 §七。

引擎新增 API（只扩展）：`runGroup(jobs, ttlMs, nowMs)` / `decideNode(groupId, requestId, decision)` / `dispatchApprovedNode` / `sweepExpiredGroups(nowMs)` / `markNodeBlocked` / `markGroupStale`；`ExecOutcome` 追加**默认值字段** `approvalRequestId`（既有构造调用零变化）。

## 三、S2/S3 零改动辨析（红线 1「只扩展」）

- S3 `dispatchApproved` **判定语义零变化**：五元同验/dispatch-once/STALE 分支一字未动；新增的是①组闸前置（仅对**属于某组**的 request 生效，非组 request 路径零变化——回归锚测试 `非组 request 路径零变化` 锁定）②POLICY_VALIDATED 落账一行（G11 明确要求的主链补全，不影响任何判定分支）。
- S2 `run`/`SchemaGate`/`ApprovalBook`/`ApprovalSnapshot` 零改动；`runGroup` 逐 job 复用 `run()` 全链。
- S2/S3 套件零回归：模块 88/0/0 内含基线 60 用例全绿（含 ApprovalCoreTest/GuardInvariantTest/ApprovalGuardTest/ApprovalR1Test 全部既有锚）。

## 四、层边界声明（红线 2 · 防「第三套病」）

| 层 | 归属 | 本单落点 |
|---|---|---|
| **能力级**（本单） | mov-exec-engine approval 子包 | ApprovalGroup/ApprovalGroupBook/EdgePolicy/G11Chains——能力粒度批量裁决原语 |
| **工具级**（UPG-76 PlanApprovalStore） | app 侧 PlanApprovalStore | **零接触**——本单未改 app 任何文件（git show 6e9f90e 仅 mov-exec-engine 9 文件） |

语义同源：状态词表照 §8.3（Group/Node 两套状态机逐字对齐设计稿）、EdgeAction 值集照 §8.1——**词表一致、层各其主、不合并不互调**；跨层消费归后续接线单（引用本模块纯函数，不复制实现）。

## 五、测试面（XML 计数为准 · 2026-09-03 10:0x 统计时点）

| 面 | 命令 | 结果 |
|---|---|---|
| 模块全量 | `gradle :mov-exec-engine:test --rerun-tasks` | **14 套件 88/0/0**（基线 S2/S3 60 + S4 新增 28：ApprovalGroupTest 9 / ApprovalExpiryTest 4 / EdgePolicyTest 8 / ApprovalGroupGuardTest 7） |
| app 全量 | `gradle :app:testDebugUnitTest --rerun-tasks` | **724/2/1**——2 失败=AppearanceContractTest `L1-10`/`M-U50-5`，**基线预存**（UPG-81 3339c4b 未合 main，`git merge-base --is-ancestor` 实证非祖先；与 UPG-84 验收「未开工口径 724/2/1」逐位一致）→ **零新增失败** |
| 装配级 | `gradle :app:assembleDebug` | BUILD SUCCESSFUL（app-debug.apk 56157871B） |

测试要点对照 STD：双状态迁移（含 partially_decided 中间态）✓ / 部分批准批1拒1独立1各安其位 ✓ / 过期不复活（dispatch 双通道封死）✓ / MONEY 超时三不 ✓ / 断流默认值（G8 四通道）✓ / CONTINUE_INDEPENDENTLY 仅显式 ✓ / Graph-local 聚合（A败B成原例）✓ / G11 事件链最小集（主链/部分批准/漂移/过期四模板零缺失断言）✓。

## 六、S2/S3 零回归 + 基线归属实证

- `git merge-base --is-ancestor 3339c4b origin/main` → 非祖先（UPG-81「待合」状态在库：验收通过未合）→ 全量 2 失败为 **main 现况预存**，非本单引入；本单 diff 只含 mov-exec-engine（`git show --stat 6e9f90e` 9 文件全部 `mov-exec-engine/`），不触碰 app 源码。
- 本单若在 UPG-81 合入后复验：预期全量 734/0/1（UPG-81 验收口径）——S4 不新增任何 app 测试面。

## 七、变异亲杀（4 锚 · 全红实录 → 还原复绿）

| 锚 | 变异动作 | 结果（XML 口径） |
|---|---|---|
| M1（G4 审批不可变） | 删 `ApprovalGroupBook.decideNode` 节点已决检查 | ApprovalGroupTest 9 跑 **1 红**（`G4 节点级-已决节点二次裁决红`） |
| M2（G8 默认断流） | EdgePolicy 默认参数 onFailure/onRejected/onExpired 改 CONTINUE_INDEPENDENTLY | EdgePolicyTest 8 跑 **4 红**（默认断流/G8 行为/Graph-local/MONEY 交叉） |
| M3（EXPIRED 不复活） | 删 `dispatchApproved` 组闸 | ApprovalGroupGuardTest 7 跑 **2 红**（`EXPIRED 不复活`+`漂移 STALE 分支`） |
| M4（G11 证据完整） | 删 `dispatchApproved` 内 POLICY_VALIDATED 落账 | ApprovalGroupGuardTest 7 跑 **1 红**（`组链全景` MONEY 主链零缺失断言） |

**还原**：四变异全部在 commit `6e9f90e` 保护下 `git checkout --` 还原 → `:mov-exec-engine:test --rerun-tasks` 全量 **88/0/0 复绿**（还原后工作区 clean）。

## 八、G11 事件链输出样本（真实 dump · 状态迁移序列）

```
 0|JOB_CREATED|j-m1|semanticKey=settle.pay#p1
 1|PLAN_VERIFIED|j-m1|capability=settle.pay in 契约通过
 2|APPROVAL_REQUESTED|j-m1|requestId=apr_b5b96ad5… capability=settle.pay side_effect=MONEY canonicalHash=17d4e245…
 3-5|JOB_CREATED→PLAN_VERIFIED→APPROVAL_REQUESTED|j-m2（settle.pay#p2 MONEY）
 6-8|JOB_CREATED→PLAN_VERIFIED→APPROVAL_REQUESTED|j-w1（fulfill.dispatch WRITE）
 9|APPROVED|j-m1|reviewer=human-a …（锁定 fp=662fb563…）
10|APPROVAL_PARTIALLY_DECIDED|j-m1|groupId=grp_5847c8d7… node=approved members=settle.pay:approved,settle.pay:pending,fulfill.dispatch:pending
11|REJECTED|j-m2|reviewer=human-b 拒绝 → blocked
12|APPROVAL_PARTIALLY_DECIDED|j-m2|node=rejected members=settle.pay:approved,settle.pay:rejected,fulfill.dispatch:pending
13|APPROVED|j-w1|reviewer=human-c …（锁定 fp=372a074f…）
14|APPROVAL_GROUP_COMPLETED|j-w1|members=settle.pay:approved,settle.pay:rejected,fulfill.dispatch:approved
15|POLICY_VALIDATED|j-m1|requestId=apr_b5b96ad5… 五元同验通过（capabilityId/version/fingerprint/scope/SchemaGate 现况复验）
16|DISPATCHED|j-m1|…五元同验通过）；impl 执行接线 S5+
```

（完整含时间戳原始行落 `程序员/UPG82-evidence/chain-dump/`；导出用临时测试类已删，不入库。时间戳严格单调，G5 零时钟依赖——now 全部调用方注入。）

## 九、verify-hash 与登记

```bash
python 审验.py --verify-hash feat/upg82 6e9f90e
# 交付时点实测：HASH_REJECT <not-ancestor>（机器只出 flag）
```

**如实申报**：E2 闸语义 = 申报 hash 须在 `origin/main` 祖先链（审验.py:453 `merge-base --is-ancestor … origin/main`，防旧 hash/未合内容冒充）。交付时点 `6e9f90e` 在 feat/upg82 分支顶、**尚未合 main**（合 main 只归设计师）→ not-ancestor 是分支交付态的必然结果，非 hash 伪造（`git cat-file -t` 存在性 ✓、即 feat/upg82 tip）。**处置**：delivery_id 按规范预登记于本报告与 manifest；**合 main 后**由验收员/设计师以合入后 main 顶 hash 复跑 `--verify-hash`（HASH_OK = 绑定生效终态），E2 闸的最终把关留待合后复核——不谎报 HASH_OK，机器只出 flag、人终裁。

**已登记两个表**：① `工单表.xlsx`（经 sync 投影——UPG-82 行程序员列/备注列）；② `工单库.md` UPG-82 卡交付块。交付报告落 `程序员\交付报告\DELIVERY_UPG82_2026-09-03.md`。

## 十、Token / KV Cache 影响申报（L4 两节 · 0/0）

- **Token 影响**：0——本单全部落 `mov-exec-engine` 纯 JVM 模块（零 Android 依赖、app 编排未接线、无 AI prompt 面/工具注册面变更），运行时 Token 消耗零变化；模块对外 API 均为引擎级调用点，无新增 LLM 调用路径（DeterministicSummary 禁 LLM 延续，G5 扫描零命中）。
- **KV Cache 影响**：0——无 KV/prefs/存储面变更；Ledger 仅内存/文件 append（测试作用域），无生产落盘点。

## 十一、Code-LOC 申报（ponytail 同口径 · 非 blocks 排除注释）

```
📋 Code-LOC 申报：+1259 / -1 / 净 +1258
```

构成：主代码 ≈640（ApprovalGroup 305 / EdgePolicy 130 / G11Chains 75 / ExecEngine 扩展 ≈125 / Ledger +5），测试 ≈620（4 套件 28 用例 + 守卫锚）。无未要求抽象/样板（状态机与值集为 STD 冻结契约的最小忠实实现）。

## 十二、共享面影响清单 + 能力护栏（P1-1 · 红线 24）

```yaml
## 能力护栏（P1-1）
共享面影响清单:
  - 共享面: 无（MainActivity 注册表/工具面/协议·接口定义/全局数据结构均未触碰——本单 diff 仅 mov-exec-engine 模块 9 文件）
  - 影响下游: S5 Graph 接线（消费 EdgePolicy 判定纯函数）/ S6 幂等（消费组态闸）；app 编排零接触
  - 回归说明: app 全量 724/2/1 与 UPG-84 验收未开工口径逐位一致（零新增失败）；S2/S3 基线 60 用例零回归；非组 request 路径回归锚测试锁定 S3 语义零变化
coverage_status: FULL
```

## 十三、遗留与挂账

- 本单挂账 0 条（未新增挂账登记）。
- 观察 1（非阻塞）：`aggregateUpstreams` 空入边=RUNNABLE 的语义已在 KDoc 声明（无上游依赖自由节点），S5 建 Graph 时若需「无上游≠自由」语义（如组外兜底）由 S5 显式收紧——本单不预设。
- 观察 2（非阻塞）：G11 主链 S4 截断到 DISPATCHED（PROVIDER_RESULT/RUN_COMPLETED 归 S5 接 impl 后），已照「引擎不造假 RUN_COMPLETED」既有纪律声明。

---
*程序员 C · 2026-09-03 · worktree mov-upg82 可随验收流程收 · 已登记两个表*
