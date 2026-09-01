# DELIVERY_UPG61 vault.get 伪放行修（每弹 only-once 工具禁用豁免勾选 · 保 fail-closed）

**程序员 C @2026-08-31** ｜ 分支 `feat/upg61`（**b7c2e9d**）｜ 基线 main 4b5f65f ｜ worktree `mov-upg61`
**已登记两个表**（工单表 UPG-61 行 + 工单库）。

## 一、修法②落地（设计师定夺：弹窗层禁用豁免勾选；明确不采纳修法①放宽 handler）

1. **only-once 工具集识别**（范围①）：新增 `com.hermes.dsh.tools.OnlyOnceTools` 单源——`TOOLS={vault.get, browser.click, browser.fillForm, browser.login}`（**4 handler 逐个源码核对** @4b5f65f：vault.get:3757 `!=OUTCOME_ALLOWED_ONCE→"用户拒绝"`；browser.click:3334/fillForm:3409/login:3436 `→APPROVAL_DENIED`）+ `isOnlyOnce`（下划线归一后**精确匹配**，防 contains 误伤）+ **登记纪律头注**（新增该类 handler 须同步登记——红线模型假设注释）
2. **弹窗层禁用**（范围②）：`buildApprovalDialogView`——only-once 工具：①「同类同意」行**不渲染**（autoSame 恒 false→同意恒 ALLOW_ONCE）②「记住此偏好」行**不渲染**（rememberEnabled 短路 false→canRemember false）——弹窗只剩「同意/拒绝」两键，每次当场确认
3. **豁免链跳过**（范围③审计一致性）：`ApprovalService.request` 三豁免全部 only-once 短路——turn（`!onlyOnce && allowThisTurn`）/goal（onlyOnce→goalId=null）/remembered（`!onlyOnce && rememberedCheck`）——**豁免命中路径不可能出现于 only-once 工具**：审计（asked+decided allowed-once）与 handler 行为完全一致（「UI 承诺=实际行为」核心判据）；**handler fail-closed 语义零改动**（红线）
4. **测试**（范围④）`OnlyOnceGuardTest` 4 用例：清单+归一命中与对照（vault.peek/device.timer 非命中）/remembered 命中仍弹窗+审计链无 allowed-remembered+**device.timer 对照不回归**（验收④）/turn 豁免跳过（同 turn 两次真弹+asked×2）/弹窗层源码锚

## 二、验证

- **L1**：全量 **74 类 523 过 / 0 败 / 1 跳过**（--rerun-tasks 语义；registry 同步后）+ `assembleDebug` 绿 + `check-token-effect` 过
- **变异 U61-V1 亲杀**：删 only-once 跳过（恒 false）→ remembered 命中测试红（伪放行复现）
- **L2 说明**：弹窗为 native AlertDialog（非 WebView），桥注入态 Playwright 不适用；虚拟机模拟器 5554 实例损坏（Binder 异常）——L2 弹窗截图留验收员真机/可用模拟器补验（触发路径：AI 调 vault.get → 弹窗只两键无勾选行）；**JVM 已覆盖**：豁免跳过全链（审计一致）+弹窗源码锚+对照面不回归

## 三、红线自查

- handler fail-closed 语义零改动 ✓（vault.get/browser.* 四 handler 一字未动——只动豁免入口与 UI）
- 审计与行为一致性 ✓（only-once 工具审计链恒 allowed-once/rejected，无 allowed-remembered/allowed-turn 残留——测试锚）
- 模型假设注释 ✓（OnlyOnceTools 头注：handler 实现枚举，新增须同步登记）

## 四、登记

- 工单表 UPG-61 行：程序员列 `✅C 完成`、备注 `feat/upg61 b7c2e9d（报告 DELIVERY_UPG61_2026-08-31.md）`
- 工单库 UPG-61 状态：`程序员✅完成，待验收`
- 交付即闭环：同型缺陷（browser 三工具）随本单一并修复

**待验收员**：L1 复跑+变异抽杀（U61-V1）+ only-once 清单源码核对（4 handler only-once 语义）+ 弹窗 L2 截图（vault.get 无勾选行/browser.click 无勾选行/对照 vault.delete 有勾选行）。
