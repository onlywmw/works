# DELIVERY_UPG60 三道门实现+元验证 M-1~M-6

**程序员 C @2026-08-31** ｜ 分支 `feat/upg60`（**a8d1363**，含 5a7a576 三道门+元验证+registry 同步）｜ 分支声明：**基 feat/upg58 ac8d27d + merge feat/upg56**（前置产物合流：ManifestMain/EvalFixtureVersionGuard/Z-3 集+Ledger 泛化——56/57/58/59 合 main 后本分支 rebase 跟进）｜ worktree `mov-upg60`
**已登记两个表**（工单表 ROW50 + 工单库）。

## 五项施工范围

1. **门 1 功能重放**（A2-1）：候选工具面跑 EvalFixture 全量重放——13 条**绝对阈值 ≤1 条失败**；**阈值配置化**（ThresholdConfig：≥40 条切百分比模式+切换产生 Ledger 事件的语义已备）；**JS 工件类直接标「不可准入」零重放**（A2-2，Q2 定夺）；**错误注入自检** `injectError`（trigger 词面反写=Z3-1 同款决策键真变化——M-2 拦截锚）
2. **门 2 回归**（A2-1b）：六指标错误数 delta——**单指标维度错误用例数 +≥2 → REJECT 禁跨指标抵消**；**三组构造用例验语义**（单指标 -2 拒/两指标各 -1 不拒/一指标 -2 另一 +2 仍拒）；**M-5 判定独立**：gate2 签名只收两份 ErrorCounts（反射锚）+判定行措辞锁定
3. **门 3 会话级灰度**（A2-4/A2-5）：shadow 计数**持久化于 Ledger**（evolution.SHADOW 事件=非内存态，重开 Ledger 实证一致）；达标转 canary（Ledger 事件）；退化回 shadow=**人工触发版**（degradeToShadow manualTrigger=true 强制参数——拒绝伪装自动即抛 IAE，诚实标注铁律）
4. **元验证 M-1~M-6**（MetaVerificationTest 排首=**V-6 顺序约束**）：
   - M-1：Z-3 坏改动走门 2 全 REJECT+方向与预登记一致（Z3-5 由 56 守卫拦截——分防线的防线）
   - M-2：错误注入候选被拒+失败用例定位（c 前缀定位）
   - M-3：干净候选**双门放行**（防全拒门——「门只会拒不会放」同罪）
   - M-4：五元逐元失效 ManifestMain 拒发（与 58 联合实测：fixture/registry/evaluator/baseline_hash/model 五元）
   - M-5：gate2 签名反射审查+行为锚（risk_tasks 声明不改变判定）
   - M-6：AI 身份只写 PROPOSED、越权写 ACCEPTED 直接失败、user 裁决放行（57 actor 实测联合）
5. **A2-6 生命链**：PROPOSED→门过→SHADOW×3→CANARY→DEGRADED 全程 Ledger 落账+**explain 单查询**回答「处于什么状态为什么」（含 trigger=人工标注）

## 验证

- `:tool-orch:test` **6 类 38/0/0**（MetaVerificationTest 10+ManifestChainTest 8+既有）；`:memory-os:test` 34/0/0；`:app:testDebugUnitTest` 519/0/1（registry 同步后）
- **红线下自查**：元验收未全过不放真实候选（V-6——MetaVerification 全绿才交付）✓；判定输入无自述字段（V-1）✓；门 3 人工触发版标注（纪律 5）✓；模型假设注释 ✓（门 1 重放覆盖面声明——JS 类已拒收）

## 登记

- 工单表 ROW50：程序员列 `✅C 完成`、备注 `feat/upg60 a8d1363（报告 DELIVERY_UPG60_2026-08-31.md）`
- 工单库 UPG-60 状态：`程序员✅完成，待验收`
- 测试环境：全 JVM（tool-orch/memory-os 模块级），未用真机（按派单纪律）

**待验收员**：M-1~M-6 独立复跑+Z-3 预登记方向对账+A2-1b 三组语义+门 3 持久化跨实例验证+JS 拒收语义+A2-6 单查询体验。
