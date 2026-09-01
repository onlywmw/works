# DELIVERY_UPG15_2026-08-27（程序员）

**工单**：UPG-15 登录页死锁修（登录钮常可点 + 协议整行可点）｜ **优先级**：P1 随包 ｜ **分支**：`feat/upg15` @ `151fdb1`（+docs `ce40e6a`）｜ **基线**：main `0ab5d48`

**已登记两个表**（先表后库）：工单表第 16 行 UPG-15 程序员列 `✅C 完成` + 备注 hash；工单库 UPG-15 卡状态改「程序员✅完成，待验收」。

---

## 一、施工内容（严格按工单方案三条）

**改动文件**：`app/src/main/java/com/mov/android/LoginActivity.kt`（+43 行，其中代码 2 处 + 新私有方法 1 个 + import 3 条）；`app/src/test/java/com/mov/android/LoginAgreeUnlockContractTest.kt`（新增契约测试，3 案）。

### ① 登录钮常可点（死锁根因拆除）
- `refreshEnabled()`：`loginBtn.isClickable = can` → `loginBtn.isClickable = true`；
- 视觉禁用态保留：`loginBtn.alpha = if (can) 1f else 0.4f` 原样不动（UPG-09 灰态口径）；
- 未勾选/表单不全点按 → 走 `doLogin()` :427-430 既有 `setError` inline 红字分支（「手机号格式不正确」「请输入 6 位验证码」「密码至少 6 位」「请先勾选协议」全链可达），零 toast。

### ② 协议整行可点（命中区扩大）
- `agreeRow.setOnClickListener { agreeCb.toggle() }`：整行（勾选框+文字+左右空白）点击切换勾选；
- **实现细节（超出工单字面、按工单"如冲突以链接优先"口径补齐）**：实测 `agreeText` 挂 `LinkMovementMethod` 后 TextView 变 clickable 会吃掉非链接文字区触摸，父行 onClick 在文字区收不到——新增私有方法 `agreeTextWholeRowTouch()`：按触摸坐标换算 offset，命中 `ClickableSpan`（书签区间《用户协议》《隐私政策》）返回 false 交还 LinkMovementMethod（链接优先，不 toggle）；非链接文字/空白 → `agreeCb.toggle()` 并消费。`agreeRow` 宽 MATCH_PARENT（[74,1907][1006,1965] 实测），左右空白由整行 onClick 承接。

### ③ 红线遵守申报
- 勾选状态机（agreed / refreshEnabled 视觉态）、登录请求逻辑、倒计时、Tab 切换（UPG-13 #9）：**一行未改**；
- 协议文案与链接行为不变（`coloredAgreeText()` 未动，弹窗 `showPolicyDialog` 原样）；
- Token/KV：无影响（未触碰 LoginState / SharedPreferences）。

## 二、验收证据

### L1 编译+单测+变异亲杀（全绿）
- `:app:compileDebugKotlin` ✅ + `:app:testDebugUnitTest --rerun-tasks` ✅ **246/0**（BUILD SUCCESSFUL，22 tasks executed）；
- 新增契约测试 `LoginAgreeUnlockContractTest` 3 案全绿：
  1. `refreshEnabled 登录钮常可点且视觉禁用态保留`（锚 isClickable=true + 无 isClickable=can + alpha 0.4/1f 保留）
  2. `doLogin 未勾选协议走 inline setError 提示`（死代码修活路径锚定）
  3. `协议整行可点切换勾选且链接优先`（agreeRow onClick + 文字触摸仲裁双锚）
- **变异亲杀 3/3 精确命中（每变异恰一杀，无误杀）**：
  - 变异1 `isClickable=true` 改回 `= can` → 案1红（AssertionError :57）
  - 变异2 删 `agreeRow` 整行 onClick → 案3红（:84）
  - 变异3 删 agreeText 触摸仲裁挂接 → 案3红（:89）
  - 每轮变异后 `git checkout` 还原（施工已先 commit `151fdb1`，防 checkout 抹施工）。

### L2 真机六场景（emulator-5554，截图已入 `验收员\证据数据\UPG-15\`，ACCEPTANCE_LOG 已登记）
1. 填满表单+未勾选 → **loginBtn clickable=true**（修复前同态=false 死锁）→ UPG15_1
2. 未勾选点登录 → inline「请先勾选协议」红字（无 toast）→ UPG15_2
3. 点行右侧空白（x≈942）→ chk false→true → UPG15_3
4. 点文字非链接区（x≈368）→ chk 双向翻转 → UPG15_3
5. 勾选态点《用户协议》→ 协议弹窗弹出、关闭后 chk=true 保持（链接优先未误 toggle）→ UPG15_4
6. 勾选后点登录 → 服务端真实响应 inline「验证码已过期，请重新获取」（测试号无真码被拒=预期，请求链路通）→ UPG15_5

### L3 覆盖申报
- 隐私门控段已实测：pm clear 首启 → 门控页 → 同意 → 登录页（本轮真走）；
- 「登录成功→主界面」段需真实账号+腾讯云真验证码，**无测试凭据未实测**——该段（doLogin 成功分支/LoginState.save/跳转 MainActivity）本单零改动，无回归风险面。请验收员按既有凭据补测或按零改动面核验。

## 三、交付物清单
- 分支 commit：`151fdb1`（施工）+ `ce40e6a`（ACCEPTANCE_LOG L2 登记）
- 证据截图：`验收员\证据数据\UPG-15\UPG15_1..5_*.png`（5 张）
- 报告：本文件

## 四、遗留/挂账
- 无新增挂账。出单人文本提及的工单表.xlsx 代理对事故已由出单人清洗，本单登记时读/写/读回对账均正常（openpyxl）。
