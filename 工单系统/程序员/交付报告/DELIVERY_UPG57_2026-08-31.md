# DELIVERY_UPG57 Evolution Ledger 骨架

**程序员 C @2026-08-31** ｜ 分支 `feat/upg57`（**f4bae35**，含 Evolution Ledger 主体+registry 同步）｜ 基线 main 8bcc167 ｜ worktree `mov-upg57`
**已登记两个表**（工单表 ROW47 + 工单库）。

## 五项施工范围

1. **TimelineLedger 泛化**（复用纪律 §6.5——**无第二套账本**）：memory namespace 一字不动；新增 `evolution.*` namespace——12 事件类型（CHANGE_PROPOSED/BASELINE_CAPTURED/CHANGE_APPLIED/REGRESSION_EVALUATED/ACCEPTED/REJECTED/SHADOW/CANARY/STABLE/DEGRADED/ROLLED_BACK/MODEL_UPGRADE_RECHECK——前缀消解与 memory ACCEPTED/REJECTED 重名）；`actorAllowed` namespace 分流
2. **actor 权限映射**（M-6 同构）：`ACTOR_ALLOWED_EVOLUTION`——user 全量 / **ai-proposal 只 evolution.CHANGE_PROPOSED** / 新增 `system-deriver`（派生器面：BASELINE_CAPTURED/CHANGE_APPLIED/REGRESSION_EVALUATED/DEGRADED/MODEL_UPGRADE_RECHECK）；memory 权限回归锚在测试
3. **八字段派生器** `EvolutionDeriver`：payload JSON 八字段（changeId/baseline/change/evaluation/decision/lifecycle/rollback/evidence）；`deriveProposals`（ChangeInput→CHANGE_PROPOSED，**幂等**——同 changeId 去重零重复追加）+ `appendLifecycleEvent`（幂等跳过）——A-1 脚本输出契约已定（ChangeInput 形态），A-1 落地即插
4. **X-1③ 单查询**：`explain(subject)` **一次调用**返回完整归因（当前生命周期+决策+评测结论+回滚+事件链+证据指针）；`lifecycleOf` 辅助
5. **测试** EvolutionLedgerTest 8：复用纪律反射锚（TimelineLedger 无 update/delete——append-only）/evolution 走同一物理账本/M-6 越权拒+CHANGE_PROPOSED 放行+未知类型拒/**memory 语义回归锚**/派生幂等/X-1② 完整链双条（→STABLE、→ROLLED_BACK，append-only 不破）/X-1③ 单查询全要素/未入流 subject 返 null 不编造

## 验证

- `:memory-os:test` 全绿（既有 UPG-52 套件零破坏+新 8 用例）
- `:app:testDebugUnitTest` 全绿（registry 同步后）
- 变异实证 U57-V1：evolution actor 权限失效（恒放行）→ M6/X1-2 双红

## 红线自查

- 禁新建独立 Ledger 类 ✓（EvolutionDeriver=TimelineLedger 实例读写视图，append 全走原类）
- append-only 物理语义不破 ✓（无 update/delete 公开面反射锚；purge=既有人类专属面）
- 模型假设注释：「无（账本是模型无关基础设施）」✓（X-2 机制：MODEL_UPGRADE_RECHECK 事件类型已备）

**待验收员**：复用纪律审查（无第二套账本）+ X-1③ 单查询体验 + M-6 同构复核 + 幂等边界。
