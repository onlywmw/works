# UPG-61 vault.get 伪放行修 —— 验收员复核记录（2026-08-31）

验收对象：feat/upg61 = **b7c2e9d**（单 commit；基底 main 4b5f65f；main 顶 fbcdd64=57 已合，无文件冲突）
测试构建：**现场 assembleDebug @18:38**（55,588,170B）装 emulator-5554

## 一、核物（四范围）

| 范围 | 结果 |
|---|---|
| ① only-once 集识别 | ✅ OnlyOnceTools.TOOLS={vault.get, browser.click, browser.fillForm, browser.login}——头注含四 handler 源码行号核对（vault.get:3757 `outcome != OUTCOME_ALLOWED_ONCE → "用户拒绝"` 等）+归一 `_`↔`.` 精确匹配+登记纪律头注（新增须同步登记） |
| ② 弹窗层禁用 | ✅ MainActivity：only-once → rememberEnabled=false + autoRow（同类同意行）不渲染——弹窗只「同意/拒绝」两键 |
| ③ 审计一致性 | ✅ ApprovalService.request 三豁免全短路：`if (!onlyOnce && allowThisTurn)` / `goalId = if (onlyOnce) null else …` / `if (!onlyOnce && rememberedCheck…)`——豁免命中路径对 only-once 不存在 → 审计（allowed-once）与 handler 行为完全一致 |
| ④ 测试 | ✅ OnlyOnceGuardTest 4 用例（清单归一/remembered 命中仍弹+审计链干净+timer 对照不回归/turn 两次真弹/弹窗层源码锚） |

**红线确认** ✅：四 handler 一字未动（diff 仅 4 文件：OnlyOnceTools/OnlyOnceGuardTest/ApprovalService ±9/MainActivity ±8）；模型假设注释在案；同型缺陷（browser 三工具）一并修复。

## 二、L1（独立复跑）

- 全量 :app:testDebugUnitTest = **74 套件 523/0/0**（跳 0；程序员报 523/0/1 的 1=跳过口径）——OnlyOnceGuardTest 4/0

## 三、变异 U61-V1 复杀 ✅

- 注入：`if (rememberedCheck…)` 去掉 `!onlyOnce`（only-once 也吃 remembered 豁免）
- 结果：「UPG61 vault_get remembered 命中仍弹窗且落 allowed-once」FAILED——**伪放行复现**（豁免命中 → UI 以为放行 → handler 拒绝=行为与审计矛盾）——与申报一致

## 四、L2 截图补验 —— 环境阻塞，留 P3（不阻塞判定）

- 现场装 APK 后触发 vault.get：**模拟器 DeepSeek key 失效**（59 程序员测试期间模拟器被重置→Keystore 更换→UPG-53 时 dump 的旧密文解密失败 null，logcat 实证）→ AI 无法运行 → 无审批链
- 真机 21770d7d 断连（与程序员申报一致）
- **判定不阻塞**：弹窗层「only-once 只两键/无勾选行」已有 **OnlyOnceGuardTest 第 4 用例（弹窗层源码锚）JVM 锁定**；待真机恢复+可用 key 后补截图（触发：AI 调 vault.get → 只两键；对照 vault.delete 有双勾选行——UPG-53 已实证对照形态）

## 五、结论

**通过** → 待审验员合 main（rebase fbcdd64 无冲突）。
**P3**：弹窗截图（only-once 两键 vs vault.delete 勾选行对照）待 key/真机恢复后补验。
