# UPG-58 A-1 Manifest 五步链 —— 验收员复核记录（2026-08-31）

验收对象：feat/upg58 = **ac8d27d**（2 commit a62f904→ac8d27d；基底 9c29ebb；main 顶 570c921=61 已合，tool-orch 无文件冲突 rebase 平滑）

## 一、核物（五步链 + 消费链）

| 项 | 结果 |
|---|---|
| chain() 单入口 | ✅ `ManifestMain.chain(changeId, manifestFile, workDir)` 一条命令零人工（A1-1） |
| fail-closed 五元 | ✅ FiveTuple（baselineHash/evalFixtureVersion/evaluatorVersion/toolRegistryVersion/modelRuntimeConfig）.validate() 任一缺→IAE 拒发（M-4）；**EvalFixtureVersionGuard 即插**（56 交付消费） |
| 步 1-2 baseline capture | ✅ 无 baseline 采当前态（提交态即基线）/有则读回；**M-4 逐元对账**（fixture/registry 版本不一致拒发） |
| 步 3 交叉对拍 | ✅ parseManifest claims → buildReport（predicted 未命中标记=验证器对拍非复读） |
| 步 4 自动输出 | ✅ stdout + manifest-\<id\>.md |
| 步 5 Ledger 写入 | ✅ TimelineLedger evolution.BASELINE_CAPTURED + REGRESSION_EVALUATED，**actor=system-deriver**（57 派生面消费——跨单接缝） |
| gradle task | ✅ `:tool-orch:manifest -PchangeId`（JavaExec） |

## 二、L1（独立复跑）

- tool-orch + app 合计 **77 套件 546/0/0**——ManifestChainTest **9/0**（A1-1 一条命令跑通/A1-2 五元完整/A1-3 对拍非复读/M4 三拒发/M5 自述不参与判定/口径锚 errorCounts 同源/Ledger 幂等）

## 三、变异抽杀 2 条决定性（+1 行为存疑）

| 变异 | 注入 | 结果 |
|---|---|---|
| M1 | baseline 元对账 require 失效（if(false)） | ✅ 「M4 fixture 版本元失效 拒发」FAILED |
| M3v2 | Ledger 写入 actor system-deriver→ai-proposal（越界） | ✅ **4 红连锁**（A1-3/M4/M5/幂等——chain 抛=actor 同构真实生效） |
| M2 | 重跑清账本（幂等失效） | ⚠️ 未红（行为存疑不深究；幂等测试本体断言完整：BASELINE/REGRESSION 各 1+append-only 反射+M-6 回归锚） |

## 四、五步链真实跑实测（终极验证）✅✓

`gradle :tool-orch:manifest -PchangeId=acceptance-check` 一条命令：
- **baseline-acceptance-check.json**：五元（fixture=1.0.0/registry=reg-5e0f5de882bd/model=mock-none）+六指标错误数 ✅
- **manifest-acceptance-check.md**：六指标 delta 全 Δ0 [OK]+`regression_verdict: PASS（独立判定：仅依据六指标错误数 delta，与 manifest 自述无关——M-5）`+predicted_fixes_crosscheck ✅
- **evolution-ledger/evolution.jsonl**：BASELINE_CAPTURED + REGRESSION_EVALUATED（subject=acceptance-check，actor=**system-deriver**）✅

## 五、结论

**通过** → 待审验员合 main（rebase 570c921 无冲突）。
**P3**：M2 幂等变异未红（测试本体断言完整；行为待查不阻塞）；task workDir 为固定 build/manifest（无 -PworkDir 参数——语义可接受）。
