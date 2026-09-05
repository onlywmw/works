# UPG-46 段① 复验证据（2026-09-04 · a8043aad）

⚠️ **缺口备案**：本单复验的 XML/快照实证未在 worktree 清理前拷贝（连续第二单）——已立「证据目录随落档必存」硬条款整改。本目录当前=**可复现命令清单**（全部命令可在隔离 worktree 一键重跑——证据可重建性质）。

## 可复现命令清单（E 仓路径）
```bash
git -C "E:/mov归档/0027-mov" worktree add --detach "E:/mov-verify/upg46-rerun" a8043aad
cd "E:/mov-verify/upg46-rerun"
cp "E:/mov归档/0027-mov/local.properties" .
JAVA_HOME="C:\Program Files\Android\Android Studio\jbr" ./gradlew.bat :app:testDebugUnitTest --rerun-tasks   # 预期 app 837/0/1
JAVA_HOME="C:\Program Files\Android\Android Studio\jbr" ./gradlew.bat :tool-orch:test --rerun-tasks          # 预期 tool-orch 101/0/0
```
（注：验收员当日实际跑的命令=:mov-tool-orch:test 误打三轮[not found]后改 :tool-orch:test——教训入册）

## 已留证部分
- M-cycle 变异亲杀：DagPlanner.kt:147 删 cycle 拒绝行→DagPlannerTest failures=1（「拒绝理由应标 cycle（D-3）」红）→还原——**变异代码+还原已操作，过程未截屏**（缺口）
- mainSrc 修复确认：HostBuiltinPackContractTest:27 单行 return base+"\n"+market（d11509cc 修复实锤——git show 可验）
- 残留 grep：toolOrch/ToolOrchestrator=1 处注释级说明行

## 关联
ACCEPTANCE_LOG §P57 / 工单表 UPG-46 行 / 工单库 UPG-46 卡
