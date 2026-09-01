# UPG-13 交付报告：登录页视觉修订（6+1 条）+ 键盘压缩回归修复

**程序员**：C ｜ **日期**：2026-08-27 ｜ **分支**：`feat/upg13` @ `a49c68a`（f84f33c 视觉 7 条 → a49c68a 键盘回归修复）
**基线**：main b3b3c6e ｜ **Token/KV**：无影响

> **已登记两个表**（先表后库）；报告落 `程序员\交付报告\DELIVERY_UPG13_2026-08-27.md`。

---

## 一、修订清单逐条对照（L2 dump 实测坐标，1080×2400 @420dpi）

| # | 修订 | 实测结果 |
|---|---|---|
| 1 | Logo 放大 ~150dp | MOV@[343,585][737,989] = **394px ≈ 150dp** ✓（原 84dp→220→84 时代已过） |
| 2 | 删圆形光晕底板 | logoWithHalo() 重写：halo View 整体移除，Logo 直贴页面底色 ✓ |
| 3 | 删 slogan | 「让 AI 成为你的日常」TextView 已删；ui dump 无该文本，品牌区仅 Logo 居中 ✓ |
| 4 | 隐藏顶栏 ×3 | LoginActivity/PrivacyGateActivity/PrivacyPolicyActivity 均 `supportActionBar?.hide()`；Gate 页截图确认黑栏消失 ✓ |
| 5 | 协议区上移 | 协议行 y=1913~1958，位于验证码行(1707~1844)之下、「登 录」(2007)之上 ✓；勾选逻辑/链接/文案零改动 |
| 6 | 输入框统一 52dp | 手机号[1528..1665]/验证码[1707..1844] 均高 137px≈52dp、宽至 x=1006 MATCH_PARENT ✓ |
| 7 | 微信位改版 | 新增 `ic_wechat` 矢量（简化双气泡造型），glyph imageAlpha=40% + 单行 12sp 灰字@[455,2285][703,2330]，不再折行裁切 ✓ |

## 二、⚠ 施工中发现并修复的键盘压缩回归（超出工单范围申报）

- **现象**：L2 键盘弹起态验证时发现键盘弹出后登录钮仍停留 y=2028（完全被 IME 覆盖不可点）——「adjustResize 不回归」这一条实际处于**回归状态**。
- **根因**：b3b3c6e 合流时 manifest 中 LoginActivity 的 `android:windowSoftInputMode="adjustResize"` 被丢失（upg09 原版 772e2a5 有此属性）；且新系统对该 flag 存在忽略场景。
- **修复**（commit a49c68a）：①manifest 恢复声明；②insets 兜底——`setDecorFitsSystemWindows(false)` + ime/nav 底 padding 监听（品牌区 weight 自动压缩）。仅视觉机制层，业务逻辑零触碰。
- **实测**：键盘弹出后登录钮 y 2028→**1303~1440**、手机号框 y=824——表单完整可见 ✓（截图 `UPG13_L2_login_keyboard_ime_fixed.png`）。

## 三、L1 / L3

- L1：`:app:testDebugUnitTest :app:assembleDebug --rerun-tasks` BUILD SUCCESSFUL 全量真跑绿（按审验员 08-27 新规）。
- L3：pm clear → Gate 弹窗 → 同意 → 登录页直达（focus=LoginActivity）；二次启动不再弹直接进登录页 ✓ 路由零改动。

## 四、证据目录 `验收员\证据数据\UPG-13\`

UPG13_L2_login_full.png（修订后全图）/ UPG13_L2_login_keyboard_ime_fixed.png（键盘态表单完整）/ UPG13_L3_gate_no_actionbar.png（门控页无顶栏）/ UPG13_L3_reject_notice.png（拒绝二次说明）。

## 五、透明申报

1. 第 4 条对 PrivacyPolicyActivity 的影响：hide 后原顶部「隐私政策」标题与返回箭头一并消失，返回改走系统返回键/手势（该页从弹窗/设置入口进入场景短，影响可接受）；如设计师希望保留标题条可改为自绘头部小栏。
2. ic_wechat 为本应用内简化双气泡示意 glyph（非官方微信 Logo 素材），只作"暂未开放"提示用途；如需官方素材请设计师提供后替换（一行 setImageResource）。
3. 本单 APK 含 main 全量（upg09/11/12/w02 已在 main）+ upg13 两 commit。

---

## 七、追加 #8（设计师验收前并入同分支）：协议勾选框黑白灰

- **实现**（commit `583a40f`）：`bg_check_agree.xml` selector 自绘——勾选态=圆形黑底 #1A1A1A + 白色对勾（ic_check_white）；未选态=#D1D5DB 1.5dp 细边空心。CheckBox 改接 buttonDrawable，原 buttonTintList 蓝已清；勾选逻辑/agreed 流零改动。
- **L1**：`:app:testDebugUnitTest :app:assembleDebug --rerun-tasks` BUILD SUCCESSFUL。
- **L2 两态截图**：`验收员\证据数据\UPG-13\UPG13_8_agree_unchecked.png` / `UPG13_8_agree_checked.png`（ui dump 核对 checked=true/false 与两态截图一一对应）。
- 分支终态 hash 由 a49c68a 推进为 **583a40f**。

---

## 八、追加 #9（挂账-upg13-tab往返发码按钮消失 转工单，P1 必修）：Tab 往返发码按钮恢复

- **病根**：`applyModeUi()` 仅 `if (mode == "pass") sendBtn?.visibility = View.GONE` 只藏不回（UPG-09 772e2a5:357 预存、UPG-13 继承）——验证码→密码→验证码后发码钮永久消失。
- **修复**（commit `6410cb3`）：改为 `sendBtn?.visibility = if (mode == "code") View.VISIBLE else View.GONE` 双向恢复；render() 内 `:141` 的 pass 初始隐藏属合理初态未动。
- **L1**：`--rerun-tasks` 全量绿；新增 `LoginTabSwitchContractTest`（双向恢复契约 + 旧只藏不回形态禁止断言 + refreshEnabled 收尾锚）。变异亲杀：恢复旧单分支形态 → Failures: 1 红 → 还原 OK (2 tests)。
- **L2 三段 dump 重放**（设计师口径，证据 `验收员\证据数据\UPG-13\UPG13_9_tab_switch_dump3.txt` + 恢复帧截图）：
  段1 重启在 code：sendBtn=[733,1707][1006,1844] ✓ ｜ 段2 密码 tab：sendBtn=null + 密码框可见 ✓ ｜ 段3 切回 code：sendBtn=[733,1707][1006,1844] **恢复** ✓
- 分支终态 hash 由 583a40f 推进为 **6410cb3**。
