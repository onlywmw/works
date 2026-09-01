# DELIVERY_UPG64 C 线效应注解首批 20 工具

**程序员 C @2026-08-31** ｜ 分支 `feat/upg64`（**115762d**，含 2d2444d 主体+registry 同步）｜ 基线 main 5b44714 ｜ worktree `mov-upg64`
**已登记两个表**（工单表 UPG-64 行 + 工单库）。

## 五项施工范围

1. **EffectSpec 四元组**（C-1）：`EffectSpecs`（tool-orch）——`SideEffect PURE|READ|WRITE × Env LOCAL|EXTERNAL × resources List`；**两套并存不混写**（annotations=AI 面 hint / effects=执行面事实——红线）
2. **首批 20 高频工具逐条核实**（与 UPG-01 desc 纪律同款）：`EffectSpecRegistry`（app meta 包）——file.read/write、memory.save/search/delete/cover、vault.list/set/delete/credSet/credDelete、obsidian.file.read/write、http.get/post、calendar.list/add、device.network/storage、screen.capture——**逐条 handler 源码核实+语义锚**（如 vault.delete=UPG-53 5s 可撤语义/scrfix root 执行路径）
3. **缺省裁决落地**（C-4 已定夺）：`resolve` 单源——登记用/readOnlyHint=true 纯读回落 annotations hint+**进优先核实队列**/其余保守缺省 WRITE×EXTERNAL；C-3 行为——未登记工具 MULTI_CALL **自动串行+确认门**（宁可少并行不可错并行）；WRITE×EXTERNAL 恒串行+确认门
4. **C-6 覆盖率数字落档**：首批 20/118≈17%<50%——**收益下调决策显式记录**（COVERAGE_NOTE 常量；首批为主场景工具，扩批随 journal 热度滚动）
5. **trace 只扩不缩**（C-5）：`traceProposal`——观测写足迹/外部足迹超出登记 → 修正提案走 A-1 Manifest（不静默改）

## 验证

- **L1**：tool-orch 8 类 58/0/0（EffectSpecsTest 8 新）+ app 78 类 540/0/1（registry 同步后）——含**变异锚**（resolve 未登记工具必须保守缺省 WRITE×EXTERNAL+planFor 串行+确认）
- 红线自查：两套不混写 ✓ / 保守缺省 ✓ / C-4 裁决落地（回落+优先队列）✓ / trace 只扩不缩 ✓ / 模型假设注释 ✓
- 敏感面锚：vault 写类+凭据类全 LOCAL（数据不出本机）；WRITE 类逐条 resources 非空

## 登记

- 工单表 UPG-64 行：`✅C 完成`+备注（feat/upg64 115762d+报告 DELIVERY_UPG64_2026-08-31.md）
- 工单库 UPG-64 状态：`程序员✅完成，待验收`
- 下游：UPG-67 D 线 DAG 试点（效应注解=DAG 并行安全依据——预立双门①64 合入②性能维度验收）

**待验收员**：首批 20 逐条源码核实抽查（handler 行为 vs 登记 EffectSpec）+C-4 三态裁决+C-3 行为+C-5 提案+变异锚复跑。
