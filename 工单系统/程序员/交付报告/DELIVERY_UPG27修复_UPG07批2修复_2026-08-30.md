# DELIVERY UPG-27 修复 + UPG-07 批2 修复（2026-08-30 两条 P1 挂账转单）

> 程序员 C ｜ 2026-08-30 ｜ 两独立分支（同 MainActivity 串行施工，先 UPG-27 后 UPG-07 批2）
> 派单：`设计师\派单\UPG-27_修复_补呈现模式切换_派单_2026-08-30.md` + `设计师\派单\UPG-07批2_修复_审批弹窗四键_派单_2026-08-30.md`
> **已登记两个表**（工单表.xlsx + 工单库.md，先表后库）

---

# 单 1：UPG-27 修复 · 补呈现模式 UI 切换（挂账-upg27-code模式无手控入口）

**分支**：`feat/upg27`（rebase 至 `origin/main 8f8debd`；原 ca47f01 → 5e1e0a1/de308f0；修复 commit `ace425c`）→ **已 push origin**（force-with-lease 覆盖远程旧 ca47f01）

| 需求 | 交付 |
|---|---|
| ① 顶部「极简模式」占位钮接线 | `MainActivity` 顶部钮（R.drawable.ic_sun）原占位 toast → `togglePresentationMode()`（环形 both→code→native→hardware→causal→both）+ toast「呈现模式: xxx」用户可见反馈（日志区 appendLog 原有） |
| ② presentToken 状态持久化 | `mov_presentation_mode` SharedPreferences（mode=ToolPresentationMode.name）：`onCreate` 启动恢复（非法/缺失回落 both）；`togglePresentationMode` 与 `presentation.set_mode` handler 双侧写 |
| ③ presentation.set_mode 维持 uiOnly | **零触碰**（uiOnlyMcpTools 未动，铁律 1 保持）；工具行为/签名不变 |

**L1 证据**：新增 `Upg27FixContractTest` 6 用例全绿（钮接线无占位/持久化接线/onCreate 恢复/实现齐全/uiOnly 维持）。
**变异亲杀 2/2**：①钮切回占位 toast → 「钮未接线 togglePresentationMode」必红；②删 onCreate 恢复行 → 「onCreate 恢复持久化模式」必红。
全量 **58 类 421 用例 0 失败**；assembleDebug 绿；check-token-effect 过；MainActivity 纯 CRLF（6522/0）。
Token/KV：0/0（仅 UI 入口 + prefs KV）。

# 单 2：UPG-07 批2 修复 · 审批弹窗四键渲染（挂账-upg07批2-审批弹窗四键未渲染）

**分支**：`feat/upg07-b2`（rebase 至 `origin/main 8f8debd`；修复 commit `74485bd`）→ **已 push origin**（force-with-lease 覆盖远程旧 431b3cb）

**根因**：批2 为做「允许本目标」四键用的 `setMessage(...) + setItems(labels)` 双调：setItems 在内容区建立 ListView，与 setMessage 文本互斥 → 弹窗**无可点按钮**（只能 60s 超时拒绝）。

**修复**（custom view 方案）：
- 主审批回答者弹窗改 `setView(buildApprovalOptionsView(...))`：首行 = 摘要文本（`buildApprovalMessage` 真实内容，含参数脱敏）；随后每选项一行（分隔线 + 整行可点），点击即 `deferred.complete(answer)` + dismiss。
- 四键语义保留：有 ACTIVE 目标 = 允许本轮 / 允许本目标 / 允许本次 / 拒绝；无 = 三键；60s fail-closed 保留；goal 豁免逻辑（ALLOW_GOAL）**零改动**；接线现有 ApprovalService，不另起平行体系。
- 后台/通知栏回答者（6384 区两键弹窗）无此冲突，零触碰。

**L1 证据**：新增 `Upg07B2FixContractTest` 5 用例全绿（双调回潮禁/四键 labels/视图实现/挂载点 setView/goal 豁免+fail-closed 保留）。
**变异亲杀 1/1**：setMessage+setItems 回潮 → 「挂载点未用 setView」+「双调回潮」双锚必红。
全量 **57 类 417 用例 0 失败**；assembleDebug 绿；check-token-effect 过；MainActivity 纯 CRLF（6449/0）。
Token/KV：0/0（审批弹窗 UI 渲染修复）。

---

## 其他说明

- 两单同文件串行：先 feat/upg27 后 feat/upg07-b2，无 Windows 文件锁并发（独立 worktree mov-upg27 / mov-upg07-b2）。
- 教训记录：UPG-07 批2 修复首次变异时在未 commit 状态下 `git checkout` 恢复导致修复被抹（第三次同类教训）——已重做并将修复+测试合并 commit（74485bd）后再变异（先 commit 后变异铁律执行到位）。
- 挂账销项联动：两条 P1 挂账（upg27-code模式无手控入口 / upg07批2-弹窗四键未渲染）待验收员合入后按挂账登记表销项。
- L2 真机（留给验收员，口径复述）：UPG-27——顶栏点「极简模式」钮 → toast 显示当前模式 + journal/日志可见；切换后重启保留（code 模式任务+塌缩自纠随 R1 L2 复验）；UPG-07 批2——有 ACTIVE 目标时弹窗四键全可见可点（uiautomator 节点树），点「允许本目标」→ journal 见 allowed-goal 链，截图存证。
