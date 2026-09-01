# DELIVERY_UPG23_R1 — 打回修复交付（2026-08-29）

> 程序员 C ｜ 分支 `feat/upg23` ｜ 提交 `0bfa4fa`（基底 4293e29，已 push origin）｜ 报告四要素：现象 → 根因 → 修法 → 复验
> 已登记两个表：工单表.xlsx UPG-23 行（程序员 ✅C R1 完成 + 备注 hash）+ 工单库.md UPG-23 状态同步（先表后库）
> 认领登记：`认领: C worktree=mov-upg23 branch=feat/upg23 @2026-08-29 13:14`（工单表 E 列，在案）

---

## P1 钉选刷新线程缺陷（验收打回项）

- **现象**：验收员真机走查实证——`MainActivity.kt:2444` `pinChipsRefresher?.invoke()` 误导性「操作失败」toast + 主页钉选排清空需重启恢复。
- **根因**：`ui.setPins` handler 跑在 mcpHandlers **工作线程**（设计师复核实证），直调 `pinChipsRefresher`（= `renderPinChips()`，`pinChipsRow.removeAllViews()` / `addView(View(this))` 纯 UI 操作，:1067/:1150）违反主线程 UI 规则；:5984 onResume 路径在主线程，无害（与设计师复核一致）。
- **修法**：一处小修（设计师定夺口径）——`runOnUiThread { pinChipsRefresher?.invoke() }` 回主线程再刷主页钉选。diff = 1 文件 1 行。
- **复验**：
  - L1 全量：`gradlew :app:testDebugUnitTest` **338 用例 / 0 失败 / 0 错误 + 1 跳过**（47 类 test-results XML 逐件统计，与 UPG-23 原交付口径 338/0/0+1 跳过一致；SceneLiveQueryTest 跳过 1 为存量口径）。
  - `assembleDebug` **BUILD SUCCESSFUL**（13:20 app-debug.apk 49637831B；compileDebugKotlin 真执行，MainActivity.kt 仅存量 warnings，:2444 区无新增）。
  - 真机钉选刷新链复验（钉选→主页出钮→无「操作失败」toast→重启前状态保持）→ **验收员复核范围**（定夺：免全量复验，仅复核本链）。

## 变异申报（如实）

`runOnUiThread` 线程调度在 JVM 单测层无断言面（Android UI 框架 JVM stub），去掉 runOnUiThread 的变异不被现有 JVM 用例杀死（同「挂账-upg21-源码锚契约逻辑变异局限」族）——本单闭环证据 = 源码 diff + L1 全量绿 + **验收员真机钉选刷新链复验**（参照 UPG-14「行为面留验收员」先例）。

## 红线复核

- 编译+全量绿后才报 hash（红线 6）✓；不改验收员列、不动他人登记 ✓；证据脱敏（无 key/token）✓；演示数据无产生故无还原义务（规则 18）✓；`feat/upg23` 单分支单人施工，worktree=mov-upg23 独立（红线 9）✓。
- 合 main 前设计师 rebase 最新 main + 全量绿合入闸不变（定夺原文，规则 8）。

## 交付物

| 项 | 值 |
|---|---|
| 分支 / hash | `feat/upg23` / `0bfa4fa`（push origin ✓） |
| 改动面 | `app/src/main/java/com/mov/android/MainActivity.kt` 1 行（:2444） |
| APK | `app/build/outputs/apk/debug/app-debug.apk`（49637831B @13:20） |
| 报告 | 本文件 `程序员\交付报告\DELIVERY_UPG23_R1_2026-08-29.md` |
