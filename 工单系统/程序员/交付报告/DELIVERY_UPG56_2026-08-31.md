# DELIVERY_UPG56 评测集盘点与 fixture 版本机制

**程序员 C @2026-08-31** ｜ 分支 `feat/upg56`（**cc86fac**，含 1ed70a2 主体+registry 同步）｜ 基线 main 8bcc167 ｜ worktree `mov-upg56`
**已登记两个表**（工单表 ROW46 + 工单库）。

## 四项施工范围

1. **盘点报告落档**：`docs/eval_inventory_UPG56.md`——规模属性（**盘点修正：实测 12 条**，工单卡「13 条」为估计口径——盘点价值实证；CALL×6/MULTI×2/NO_CALL×4/confirm×2+7 工具+desc 变体）；确定性属性（orchestrate 纯函数零 LLM/零 suspend 源码锚 + **EvalStabilityTest 同代码同 fixture 重跑 10 次六指标逐次全等 60 断言**）；方差方法论保留声明（fixture 全 mock——LLM 实调态启用：固定 seed/温度+2σ 复核阈值口径）
2. **fixture 版本化**：`EvalFixture.VERSION="1.0.0"` + `VERSION_HISTORY` 履历表 + `EvalFixtureVersionGuard.requireVersion` **fail-closed**（版本不一致抛 IllegalStateException=旧 baseline 全部作废阻断，非降级告警——变异 U56-V1 验证测试锁定 ISE 语义）；baseline 五元接入=UPG-58 即插即用
3. **≥40 条扩充认领卡**：报告 §五——B 线反哺 ≥10（toEvalFixtureProposals 通道已就绪）+参数边界 8+多工具 8+模糊对抗 8+新工具 4；owner=程序员 C；排期 UPG-58 前（门 1 切百分比阈值 P0-2 前达成 ≥40）
4. **Z-3 坏改动集**：`docs/z3_bad_changes_UPG56.md`——5 条已知必回归改动+**预期 delta 方向预登记**（Z3-1 desc 反写→Selection↓ / Z3-2 required 删→Argument↓ / Z3-3 trigger 删→三指标↓ / Z3-4 词面污染→Selection+Argument↓ / Z3-5 cases 删→口径失真+守卫预期拦截；防事后拟合声明+执行待 UPG-60 M-1）

## 验证

- `:tool-orch:test` 全绿（EvalTest 既有 3+EvalStabilityTest 新 4——Z-1 10 次全等/版本履历/守卫双态/ISE 语义锁定）
- `:app:testDebugUnitTest` 全绿（registry 同步后 519 过 0 败）
- 红线自查：盘点不改门阈值 ✓ / 版本变更→baseline 失效 fail-closed（锚）✓ / 模型假设注释 ✓
- 变异实证：U56-V1 守卫降级为 RuntimeException → 2 测试红（fail-closed ISE 语义锁定生效）

**待验收员**：盘点报告口径复核（12 条修正）+ fail-closed 语义 + Z-3 预登记完整性。
