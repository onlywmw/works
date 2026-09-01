# UPG-27 R1 验收证据（验收员 @2026-08-30 亲验 L1）
## 1. 还原态全量绿基线
运行: gradle :app:testDebugUnitTest --rerun-tasks @ mov-upg27 ca47f01
结果: 55 套件 388 用例 / 0 失败 / 0 错误 / 1 跳过 BUILD SUCCESSFUL

## 2. M1 变异（if(false) 短路装配分支, 全量口径）
改法: MainActivity:4444 if(presentationMode==CODE) -> if(false)
结果: CodeModeWiringContractTest > E3 装配点 code 分支调 SDK 生成器 FAILED
      388 tests completed, 1 failed, 1 skipped, BUILD FAILED
结论: R1 锚真正能杀装配短路（0efda79 假红已修复）; 变异后 git checkout 还原干净

## 3. M2/M3 锚审计 + outputHint 诚实化
M2 buildSdkSection 空返回 -> 锚 @:39 hasLiveLine 承杀; M3 忽略 registry -> knownTools 三处锚 @:48/51/53 承杀
outputHint @:142 恒「output 声明待登记」+ ToolSdkGeneratorTest @:180 assertFalse 禁编造锁死
