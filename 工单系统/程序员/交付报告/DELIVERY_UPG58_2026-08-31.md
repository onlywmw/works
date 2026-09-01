# DELIVERY_UPG58 A-1 Manifest 五步链脚本

**程序员 C @2026-08-31** ｜ 分支 `feat/upg58`（**ac8d27d**，含 a62f904 主体+registry 同步）｜ 基线 main 9c29ebb ｜ worktree `mov-upg58`
**已登记两个表**（工单表 ROW48 + 工单库）。

## 五项施工范围

1. **脚本（五步链零人工，A1-1 硬验）**：`ManifestMain.chain(changeId, manifestFile, workDir)` 单入口一条命令跑全链——提交→baseline capture→delta evaluation→交叉对拍→自动输出→Ledger 写入；gradle task `:tool-orch:manifest -PchangeId=xxx` 注册（`scripts/` 薄壳可后加——链本体已在单入口内零人工）
2. **baseline capture**：六指标**错误数**（与 Evaluator.evaluate 同分母口径——**口径锚测试**：errorCounts 换算比率与 Evaluator.evaluate 比率 1e-9 全等，防口径漂移）+ **五元快照**（P0-1：baseline_hash/eval_fixture_version/evaluator_version/tool_registry_version/model_runtime_config=mock-none 诚实快照）
3. **delta evaluation + fail-closed（V-2/M-4）**：五元缺任一构造即拒；**逐元实测**——fixture 版本失效（0.9.0 baseline vs 1.0.0 当前）→ require 拒发；registry 版本失效 → 拒发；`EvalFixtureVersionGuard.requireVersion`（UPG-56 交付即插）拦截
4. **交叉对拍+自动输出（A1-2/A1-3）**：predicted_fixes 与实测 delta 对比——未命中标记「预测未命中（验证器对拍，非复读声明）」；输出 `## Change Manifest`（predicted_fixes/risk_tasks/baseline 五元完整）→ stdout+文件（自动附工单形态=半自动降级预案 A1-5 的抽检留痕载体）
5. **Ledger 写入**（对接 UPG-57）：evolution.BASELINE_CAPTURED + REGRESSION_EVALUATED 事件（actor=system-deriver；**幂等**——同 changeId 重跑不重复追加）；对照组差中差标注「纯函数态与模型漂移正交（R-1），仅 LLM 实调态生效」

## 验证

- `:tool-orch:test` **4 类 27/0/0**（ManifestChainTest 8 用例+既有 EvalTest/ToolOrchTest）；`:memory-os:test` 34/0/0；`:app:testDebugUnitTest` 519/0/1（registry 同步后）
- **M-5 判定独立性**：REJECT/PASS 判定只看六指标错误数 delta（单指标 +≥2 即 REJECT——门 2 过渡阈值）；risk_tasks 自述不参与判定（报告措辞锁定「独立判定：仅依据六指标错误数 delta」）
- **A1-3 锚**：predicted 声明无改动改善 → 「预测未命中」标记（变异语义：验证器做对拍不是复读）
- **A1-1 锚**：chain 单调用验证 baseline 文件+Ledger 双事件+报告文件+stdout 全自动产生

## 红线自查

- 判定输入禁含 manifest 自述字段（V-1/M-5）✓——判定表达式只引用 baselineErrors/currentErrors
- 五元缺任一 fail-closed 拒发（V-2/M-4）✓——FiveTuple.validate+对账 require+VersionGuard 三层
- 模型假设注释 ✓——「baseline 六指标为纯函数确定性输出（模型无关）——LLM 实调态引入时本脚本需加对照组差中差（§6.3）」

## 登记

- 工单表 ROW48：程序员列 `✅C 完成`、备注 `feat/upg58 ac8d27d（报告 DELIVERY_UPG58_2026-08-31.md）`
- 工单库 UPG-58 状态：`程序员✅完成，待验收`
- 下游就绪：UPG-60 门 2 判定输入（manifest 报告+Ledger 事件）/Z-3 坏改动集执行（56 交付）

**待验收员**：M-4 逐元复测（五元各改一次验拒发）+ A1-3 交叉对拍语义 + M-5 判定独立代码审查 + A1-1 零人工链演练（gradle task 演示）。
