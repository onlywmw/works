# UPG-67 D 线 DAG 编排试点 —— 验收员复核记录（2026-09-01·第三阶段首单）

验收对象：feat/upg67 = **040c9d9**（a88510a 主体 + registry 同步 + Z-5 基线落档随件）
**基底申报偏差（P3）**：申报「基 main 4b5f65f」，**实测基底=115762d（UPG-64 tip）**——分支含 64 全部——**合 main 顺序须 64 先行，67 rebase 跟进**

## 一、核物（五项）

| 项 | 结果 |
|---|---|
| ① 性能维度先行 | ✅ mockCost 常数表（查询 300/写 500/外呼 800 按语义给值）+ makespanMs（关键路径逐层累加，层内并行取 max）/serialMs（串行对照）双列；同输入两次运行逐位一致（D1 测试） |
| ② DAG 构建器（D-3） | ✅ 三层边 DATA_FLOW（ref(nodeId,field) 引用推导）/EFFECT_ORDER（写读冲突同资源域——读在前写在后/双写稳定序）/SYNC（WRITE×EXTERNAL 全序化 nodeId 稳定序）+ Kahn 拓扑分层（同层并行 sorted 确定性）+ **cycle 拒绝不 hang**（layer 空 → Reject("cycle…")） |
| ③ 效应消费（V-5/D-4） | ✅ effectOf(stableId, registry) 消费 EffectSpecRegistry；WRITE×EXTERNAL 确认门清单；未登记保守缺省 |
| ④ D2 三列表对照 | ✅ makespan/serial 双列（并行收益可算）+六指标基线不降锚（D2 测试） |
| ⑤ 形态契约 | ✅ DAG 仅为 MULTI_CALL 路径内部形态升级（diff 无 orchestrate 主链/Trace/Code Mode 改动） |

**关键修复申报核实** ✅：当前代码=**全 pair 对称遍历**（`if (a.nodeId == b.nodeId) continue` 单条件，无字典序剪枝）——字典序剪枝 bug 修复落地

## 二、L1（独立复跑）

- tool-orch **10 套 67/0/0**（DagPlannerTest **8/0**——申报 9 新实测 8，P3 口径）+ memory-os **7 套 34/0/0** + app **78 套 540/0/0**

## 三、变异抽杀 3/3（全红）

| 变异 | 注入 | 结果 |
|---|---|---|
| M1 | cycle 分支静默吞（返回空 Accept 不拒） | ✅ 「D3-3 循环 ref 拒绝不 hang」FAILED |
| M2 | SYNC 全序化条件 EXTERNAL→LOCAL（失效） | ✅ 「D3-1 二步任务 ref 引用 DATA_FLOW 边存在且顺序调度正确」FAILED |
| M3 | **重新引入字典序剪枝 bug**（交付时已修） | ✅ 「D3-3」+「D3-1」**双红**——**关键修复的回归锚有效** |

（M3 语义：剪枝回归不仅吞 DATA_FLOW，也连带破坏 cycle 检测路径——双红符合「回归锚验证关键修复」预期）

## 四、P3

1. **基底申报偏差**：申报「基 main 4b5f65f」实测=115762d（64 tip）——合 main 顺序 **64 先行 → 67 rebase 跟进**
2. DagPlannerTest 用例数申报 9 实测 8（口径）
3. L2 真机采样：申报留验收员补——当前全 JVM 契约覆盖（D1 确定性/D3 结构/D4 治理已锁），真机采样待模拟器/真机恢复

## 五、结论

**通过**（第三阶段首单·D 线就绪）→ **合 main 顺序：64 先行 → 67 rebase 跟进** → 待审验员处理。
