# UPG-64 C 线效应注解首批 20 工具 —— 验收员复核记录（2026-09-01）

验收对象：feat/upg64 = **115762d**（2d2444d 主体 + registry 同步；基底 main 5b44714=66 合入后 main 顶——最新版纪律 ✓）

## 一、核物（五项）

| 项 | 结果 |
|---|---|
| ① EffectSpecs 四元组 | ✅ SideEffect{PURE,READ,WRITE}×Env{LOCAL,EXTERNAL}×resources；**两套并存不混写**红线注释（annotations=AI 面 hint 可能不填/填错，effects=执行面事实=调度依据） |
| ② Registry 首批逐条核实 | ✅ **实测 18 条**（申报 20——**vault.credSet/vault.credDelete 漏登记**，P2）；语义锚真实（vault.delete 注 UPG-53 5s 可撤/screen.capture 注 root scrfix+环境隐私/memory.delete 注不可逆）——**漏登记 2 条落保守缺省 WRITE×EXTERNAL 安全方向不破** |
| ③ resolve 单源+C-4 | ✅ registered→用 / readOnlyHint→READ_ONLY_FALLBACK+**PriorityReviewItem 进优先核实队列**（C-4 回落裁决）/ else **CONSERVATIVE_DEFAULT（WRITE×EXTERNAL）** |
| ③ planFor C-3/C-4 | ✅ anyUnregistered→SEQUENTIAL+确认门（宁可少并行）/ anyWriteExternal→串行+确认门 / else 可并行 |
| ④ C-6 覆盖率落档 | ✅ COVERAGE_NOTE 常量：「首批 20/118≈17%——低于 50% 线：收益预期下调决策显式记录（首批主场景工具，扩批随 journal 热度滚动）」 |
| ⑤ trace 只扩不缩（C-5） | ✅ traceProposal：登记 ×env 但观测更宽→**A-1 Manifest 修正提案（不静默改）** |

## 二、L1（独立复跑）

- tool-orch **8 套 58/0/0**（EffectSpecsTest **10/0**——申报 8 实测 10）
- app **78 套 540/0/0**（collect 脚本先行后全绿——申报 540/0/1 的 1=跳过口径）

## 三、变异抽杀 2/2（全红）

| 变异 | 注入 | 结果 |
|---|---|---|
| M-64a | resolve 保守缺省失效（未登记回落纯读） | ✅ 「C4 未登记且无hint 保守缺省WRITE_EXTERNAL」FAILED |
| M-64b | planFor 未登记串行+确认门失效（并行放行） | ✅ 「C3 未登记工具MULTI_CALL 自动串行加确认门」+「C4」双红 |

## 四、P2/P3

- **P2**：Registry 实测 18/20（vault.credSet/credDelete 漏登记）——漏登记落保守缺省（WRITE×EXTERNAL，安全方向不破但 EXTERNAL 语义不准，实际 LOCAL）；**建议补登记**（与 vault.set/delete 同语义 WRITE×LOCAL）
- **P3**：环境顺序依赖——ApprovalRegistryGeneratorTest 需先跑 `node scripts/approval-inventory-collect.mjs`（新 worktree 首跑会红，报错信息已友好提示）

## 五、结论

**通过** → 待审验员合 main（基底 5b44714=main 顶，rebase 零负担）。
