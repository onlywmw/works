# DELIVERY_UPG67 D 线 DAG 编排试点

**程序员 C @2026-08-31** ｜ 分支 `feat/upg67`（**040c9d9**，含 a88510a 主体+registry 同步+Z-5 基线落档随件）｜ 基线 main 4b5f65f ｜ worktree `mov-upg67`
**已登记两个表**（工单表 UPG-67 行 + 工单库）。

## 五项施工范围

1. **性能维度先行**（①）：mock clock 常数表——查询 300/写 500/外呼 800（§13.1）；Metrics 补 latencyMs/toolCalls 两列=**makespanMs（关键路径 mockCost 之和）+serialMs（串行对照）双列**——同输入两次运行**逐位一致**（D-1 确定性；mockCost 无抖动）
2. **DAG 构建器**（D-3）：`DagPlanner`（tool-orch）——DAG 节点/边三层：**DATA_FLOW**（`ref(nodeId,field)` 引用推导）/ **EFFECT_ORDER**（写读冲突同资源域排序）/ **SYNC**（WRITE×EXTERNAL 全序化）；**Kahn 拓扑分层**（同层并行、层间衔接）；**循环 ref → Reject（reason=cycle）拒绝不 hang**（D-3；buildPlan 抛 IllegalStateException）
3. **效应消费**（V-5/D-4）：效应注解（EffectSpecRegistry 首批 20）消费——WRITE×EXTERNAL 节点**确认门清单+独占层（零并行）+SYNC 全序化**；未登记工具**保守缺省 WRITE×EXTERNAL**（确认门+全序化）
4. **三列表对照**（D-2）：延迟（600→300 并行收益）/调用量（DAG 一次规划 vs ReAct 轮数）/正确率（六指标基线不降——Selection/SafetyGate ≥0.8 锚）
5. **形态契约**：DAG 仅为 MULTI_CALL 路径内部形态升级——**ToolOrchestrator 对外契约/Trace/Code Mode 零变化**（build 为新入口，未改 orchestrate 主链）；模型假设注释 ✓（DAG 收益假设「无依赖步骤占比足够高」——UPG-63 分布统计与首批实测证伪即降级）

## 验证

- **L1**：tool-orch **8 类 65/0/0**（DagPlannerTest 9 新+MetaVerification 10+Manifest 8+既有）+ app 全绿（registry 同步后 526/0/1）+ memory-os 34/0/0
- **DagPlannerTest 9 用例**：D3-1 ref 引用 DATA_FLOW 边+顺序调度（查询层前/笔记层后）/D3-2 无依赖并行同层（600→300 收益）/D3-3 cycle 拒绝不 hang/D4 WRITE×EXTERNAL 确认门+独占层+SYNC/D1 确定性两次逐位一致/D2 三列表+六指标底线/未登记保守缺省/mockCost 常数表

## 过程修复（如实申报）

- **边推导字典序剪枝 bug**：`if (a.nodeId >= b.nodeId) continue` 把 ticket>note 序 pair 跳过——DATA_FLOW 推导被吞（诊断打印定位）→ 去剪枝全 pair 对称遍历
- 残留 aToB 临时变量清理；测试 cast 形态统一走 buildPlan（Reject 抛 IAE）

## 登记

- 工单表 UPG-67 行：`✅C 完成`+备注（feat/upg67 040c9d9+报告 DELIVERY_UPG67_2026-08-31.md）
- 工单库 UPG-67 状态：`程序员✅完成，待验收`

**待验收员**：D3-1/D3-2/D3-3 复跑（ref 引用/并行收益/cycle 拒绝）+D4 写类治理（确认门/独占层/SYNC）+D1 确定性两次逐位一致+D2 三列表+六指标底线对照+形态契约审查（orchestrate 主链零改动）。
