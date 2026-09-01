# UPG-60 三道门实现+元验证 —— 验收员复核记录（2026-08-31·改造计划第一阶段⑥收口）

验收对象：feat/upg60 = **a8d1363**（5a7a576 主体 + registry 同步；06457c4 merge(upg56) 前置合入）
**分支声明验证** ✅：58 ac8d27d 与 56 cc86fac 均为祖先（前置产物合流实证）；main 顶 f975437=58 已被审验员合 main——60 rebase 增量收敛为 SkillGate+MetaVerification+Deriver explain 演进

## 一、核物（三道门 + 元验证）

| 门 | 核物结果 |
|---|---|
| 门 1 功能重放（A2-1） | ✅ SkillGate.gate1Replay：EvalFixture 全量重放逐用例判定；**ThresholdConfig 配置化**（modeFor：caseCount≥percentSwitchAt 切百分比 / else ABSOLUTE）；JS_ARTIFACT 直接拒收（failureCount=-1 零重放，A2-2 Q2 定夺）；injectError 自检（trigger 反写=决策键真变化——M-2 拦截锚）；Gate1Result 含失败用例定位（M-2 输出） |
| 门 2 回归（A2-1b） | ✅ gate2Regression：六指标错误数 delta **单指标 +≥2 → REJECT（跨指标抵消不适用）**；**签名只收两份 ErrorCounts**（manifest 自述零参与——M-5 反射锚对象） |
| 门 3 会话级灰度（A2-4/5） | ✅ shadowCount 持久化于 Ledger；CANARY_PROMOTE_AFTER=3 达标转 canary；**degradeToShadow manualTrigger 强制参数**——`require(manualTrigger)` 拒绝伪装自动即抛 IAE（纪律 5 诚实标注） |
| 元验证 | ✅ MetaVerificationTest **10 用例**：M-1 Z-3 坏改动走门 2 全 REJECT+方向与预登记一致（Z3-5 由 56 守卫拦截分防线）/M-2 错误注入拒+定位/M-3 干净候选双门放行/M-4 五元逐元拒发（与 58 联合）/M-5 gate2 签名反射+行为锚/M-6 AI 只 PROPOSED 越权拒（57 actor 联合）/A2-2/A2-1/A2-1b/A2-4-5 |
| EvolutionDeriver.explain 演进 | ✅ 非八字段 payload（SkillGate 写的 DEGRADED）回退读 ledger reason + trigger=人工标注（A2-6 消费） |

## 二、L1（独立复跑）

- tool-orch **5 套件 37/0/0**（MetaVerificationTest 10/0 + ManifestChainTest 9/0 + 既有）
- memory-os **7 套件 34/0/0**（含 EvolutionLedgerTest——见 flaky 记录）
- app **73 套件 519/0/0**（跳 0；程序员报 519/0/1 的 1=跳过口径）

## 三、变异抽杀 3/3（三门各一，全红）

| 变异 | 注入 | 结果 |
|---|---|---|
| M-G1 | ThresholdConfig.allows 恒 true（门 1 失明） | ✅ A2-1 阈值模式 + M2 错误注入被拒 双红 |
| M-G2 | gate2 加 total 抵消放行 | ✅ M3 干净候选双门放行 FAILED（变异造全拒门——门 2 响应实证）；**顺带发现 A2-1b 组 3 构造与注释不符**（未真验跨指标抵消——P3） |
| M-G3 | degradeToShadow 去 require(manualTrigger) | ✅ A2-4A2-5 FAILED（伪装自动被锚捕获） |

## 四、flaky 记录（P2——与 60 功能面无关）

- EvolutionLedgerTest X1-2（57 遗留测试）：**全模块 --rerun-tasks 高负载下偶发红**（2/4 次），**单独跑连续 5 次全绿**——时序断言脆弱（lifecycleOf 用 System.currentTimeMillis 同毫秒碰撞窗口）
- 建议：X1-2 时间戳注入 clock 参数化（非阻塞——60 的 A2-6 生命链用例在 tool-orch 模块不受影响）

## 五、结论

**通过**（改造计划第一阶段⑥收口）→ 待审验员合 main（rebase f975437 增量收敛：SkillGate+MetaVerification+explain 演进）。
**P3×2**：A2-1b 组 3 构造未真验跨指标抵消（注释与构造不符）；「V-6 排首」为流程语义非代码强制排序。
