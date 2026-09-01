# DELIVERY_UPG02_M3R2 — M3 补丁第二轮打回修复交付（2026-08-29）

> 程序员 C ｜ 分支 `feat/upg02` ｜ 提交 `5c113cb`（基底 70db6c6，已 push origin）｜ 报告四要素：现象 → 根因 → 修法 → 复验
> 已登记两个表：工单表.xlsx UPG-02 行备注（✅C M3-R2 完成 + hash）+ 工单库.md M3 段状态同步（先表后库）
> 认领登记：`M3-R2 认领 @2026-08-29 13:14: C worktree=mov-upg02 branch=feat/upg02`（工单表 UPG-02 行备注，在案）
> 范围遵设计师定夺：三件（①capture 双根因 ②approval.setMode 收编 ③file.read 文案）；复验范围=三项+L1 全量，obsidian SAF 全链免重复（已达成）

---

## ① screen.capture 双根因（M3 验收 ❌ 打回项）

- **现象**：M3 真机验收 screen.capture 崩溃 + 结果永不回填（设计师复核双根因属实）。
- **根因**：
  1. `ScreenCaptureService.kt:58` `createVirtualDisplay` 前全仓无 `registerCallback`——API 34+ 强制先注册回调，否则 SecurityException；
  2. `pending` 只有声明（:122）和 `complete`（:93）零赋值——`deliver` 永远 no-op，toolCapture 的 `await` 只能 60s 超时（结果回填断链）。
- **修法**：
  1. `proj.registerCallback(object : MediaProjection.Callback() { onStop → stopProjection+stopSelf }, main)` 前置于 createVirtualDisplay（含投影被系统/用户中止的清理回收）；
  2. 授权成功分支（MainActivity screenCaptureLauncher）桥接 `ScreenCaptureService.pending = pendingToolCapture` 后再 start——service `deliver` 直接 complete toolCapture 的 deferred；`deliver` complete 后置空 pending（一次性回填，防悬挂/重复 complete）。
- **复验**：变异亲杀 M1（注释 registerCallback 块）→ 红 ✓；M2（注释 pending 桥接行）→ 红 ✓。真机端到端截屏归验收员复验（截图落专属区+journal 可见）。

## ② approval.setMode 收编 uiOnlyMcpTools（P1 安全口）

- **现象**：approval.setMode 暴露在 MCP :8389 公开面，远程可自助切 never。
- **根因**（设计师 main 亲核实证，feat/upg02 行号漂移语义同）：`uiOnlyMcpTools` 名单（MainActivity :54-59）无此项，而 handler 在（:2275），MCP 注册循环（:3390）与 agent 面（:5842）均按名单过滤 → 名单外即公开；与 :54 铁律注释「权限/模式类工具仅 UI——防远程自我审批」自相矛盾。**远程 AI 可 `approval.setMode(never)` 绕过全部写类 ASK**。
- **修法**：名单加 `"approval.setMode"`（最小面：approval.getMode 只读无害不动；handler 保留，UI 设置页面照常可用——MCP/agent 两面按既有名单过滤自动收编）。
- **复验**：变异亲杀 M3（名单注释该行）→ 红 ✓。

## ③ obsidian.file.read 未授权文案两态分离（P3）

- **现象**：`ObsidianProvider.kt:135` `resolveDoc` 对「vault 未登记」和「文件不存在」同回 null → file.read 两态同文案「文件不存在: $path」，未授权用户被误导去查路径。
- **根因**：`resolveDoc` 首行 `vaultRoot() ?: return null` 把未登记/不可访问/不存在三态压扁成一态。
- **修法**：fileRead 前置三态判定（文案各走既有口径）——① prefs 无 KEY_VAULT_URI → `未登记 vault——先调用 obsidian.vault.detect 授权`（同 vault.check :99 口径）；② vaultRoot() null → `vault 不可访问（权限被回收）——重新授权`（同 rescan 口径）；③ 才轮到 resolveDoc 判 `文件不存在: $path`。file.write 不在定夺范围不动。
- **复验**：变异亲杀 M4（未登记文案变异为「文件不存在」）→ 红 ✓。

## 测试与证据

- **新增锚断言 4 案**（DeviceObsidianContractTest，沿用 70db6c6 接线断言模式）：registerCallback 先于 createVirtualDisplay 顺序断言 / pending 桥接活行 / 名单收编活行 / fileRead 三态文案。**活行断言**（trim 后不以 `//` 开头才算接线）——变异试跑暴露文本锚对「注释掉」变异逃逸（UPG-21 源码锚教训同族），改活行断言后封闭。
- **变异亲杀 4/4**：M1 删 registerCallback / M2 删 pending 桥 / M3 名单去收编 / M4 文案变异——各变异单类测试必红，还原后绿（脚本化实跑，rc 直采）。
- **L1 全量**：`rm -rf test-results` 强制重跑 → **42 类 293 用例 / 0 失败 / 0 错误 + 1 跳过**（XML 逐件统计；293 = feat/upg02 树基线 289 + 本次 4 锚；口径注记：47 类 338 为 feat/upg23 分支树口径，两 worktree 测试集不同，不混用）。
- **assembleDebug**：BUILD SUCCESSFUL（app-debug.apk 60256323B @13:29，含三件施工）。

## 红线复核

- 编译+全量绿后才报 hash（红线 6）✓；证据脱敏 ✓；无演示数据（规则 18 无义务）✓；worktree=mov-upg02 独立施工、分支单人（红线 9）✓；不顺手修定夺范围外项（file.write 同族两态未动，如需走处理中心）✓。
- 合 main 前设计师 rebase 最新 main + 全量绿合入闸（规则 8，定夺原文）；UPG-23（feat/upg23 0bfa4fa）与本单都动 MainActivity 但区域不重叠（:2444 钉选区 vs :54 名单/:415 授权回调），合并顺序设计师定。

## 交付物

| 项 | 值 |
|---|---|
| 分支 / hash | `feat/upg02` / `5c113cb`（push origin ✓） |
| 改动面 | ScreenCaptureService.kt +7 / MainActivity.kt +4 / ObsidianProvider.kt +6 / DeviceObsidianContractTest.kt +53（4 文件 70 行，零删除） |
| APK | `app/build/outputs/apk/debug/app-debug.apk`（60256323B @13:29） |
| 报告 | 本文件 `程序员\交付报告\DELIVERY_UPG02_M3R2_2026-08-29.md` |
