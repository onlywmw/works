# UPG-105 批一内容层 · 验收证据补跑留证（P3-2 缺口闭环）

> 用途：闭环审验员复验结论的 P3-2 缺口——「验收员证据目录缺失：验收员/证据数据/2026-09-04/ 无 UPG-105，814/0/1 亲跑 XML 随 mov-upg105-verify 隔离 worktree 清理未留存」。
> 处置口径（审验员建议二选一）：「补跑留证 或 §P55 注明」→ 本条走**补跑留证**；§P55 注明未做（§P55 落档提交 f79f94d5 在 feat/upg50-ph1 他线分支上，设计师不便在他线施工分支追加）。

## 补跑参数

| 项 | 值 |
|---|---|
| 提交 | `841f591d`（= feat/upg105 分支头 = 已合 main 顶，origin/main 一致） |
| 环境 | 干净隔离 worktree `mov-upg105-buzheng`（detached @841f591d，git status 零改动；补 local.properties 指向 D:\Android\Sdk 后跑测；测后 worktree 已收） |
| 命令 | `gradle :app:testDebugUnitTest --console=plain`（JAVA_HOME=Android Studio jbr，与仓库 AGENTS.md 口径一致） |
| 结果 | **BUILD SUCCESSFUL**（29s，33 tasks） |
| 补跑人/时间 | 设计师 @2026-09-05 |

## 补跑计数（从 114 个 XML 逐项累加，非转述）

- **tests=814 / failures=0 / errors=0 / skipped=1**——与验收员复验申报 **814/0/1**（114 套件）逐字一致，复现成立。
- 含 ContainerContentContractTest 契约锚 5 断言（com.mov.android.approval 包，XML 在列）。

## 证据清单

- `testDebugUnitTest_XML/`：114 个 testsuite XML（gradle 原始产物，未改动）。

## 证据归属说明

按红线 14「证据归属唯一化」：本目录为**设计侧补证**（产出角色=设计师），落 `设计师/检查证据/`；非验收员原始证据副本。验收员原件已随其隔离 worktree 清理不可恢复，本补证为同提交同命令的独立复跑。
