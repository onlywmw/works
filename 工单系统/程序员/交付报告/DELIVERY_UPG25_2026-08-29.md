# DELIVERY_UPG25_2026-08-29（程序员 C）

**工单**：UPG-25 UI 瑕疵批修（规范 v1 待并轨清单 13 项）——**余 10 项（规范 §七 #5-#13）**
**分支**：`feat/upg25` @ **62986c2**（已 push origin；基于 merge commit 2bf363a = 49e9760 设计师三实测点 + origin/main 25 提交合并）
**worktree**：mov-upg25（领单认领已登记工单表 @2026-08-29 23:34）

---

## 一、施工范围与逐项落地

前置：`git merge origin/main`（25 提交：UPG-22/23/26、UPG-01 批1/2、UPG-06 批1、S-05 等）——生成物 rename 冲突按 UPG-26 先例重建消歧（sync-pages 先清后放 73 文件），源码零手工冲突，UPG-25 三点修复与 UPG-23 钉选钮共存经 grep 验证。

| # | 项 | 落地 |
|---|---|---|
| 5 | sheet 底色全 s0 | VaultSheet:81 / WebPageSheet:228 浅色 `0xFFFFFFFF`→`UiTokens.S0`（暗色 `0xFF0C0E12`=tokens.css 暗色 --s0 已一致，收编 `S0_DARK`）；SettingsSheet:90/103 字面量同收编 |
| 6 | 原生文本色并轨 + UiTokens.kt 单源 | **新建 `UiTokens.kt`**：TEXT/TEXT2/TEXT3（=tokens.css #191b21/#565c6b/#8b91a1，值并轨）+ TEXT_DARK/TEXT2_DARK/POPUP_BG_DARK（原生既有暗值入单源）+ S0/S0_DARK/OK。消费面替换：MainActivity 12 处文本三元 + 8A919C×2 + 5C6470 三元 + 暗色弹层底×3；WebPageSheet 77/108；MarkstreamViewActivity:32（原生查看器，非冻结 web 资产）；PhotoAskSheet:37/38/39；MemoryPageActivity 6 处（含 #0f8a5f→OK） |
| 7 | 字号禁用档归并 | `9f`→10（freeTag badge）、`10.5f`→10（代码块 banner）、`12.5f`→12（代码块内容）/→13（表格，正文 14 之「略小」语义） |
| 8 | sheet/弹层圆角 | PhotoAskSheet:117 15dp→**16dp**（sheet 顶圆角）；MainActivity:735 popup 菜单 14dp→**12dp**（菜单档）；`cornerRadius = 8f` 裸 px×3→8.dp2px。**bubbleShell:905 / AI 卡:4998 / 用户气泡:5027 的 14dp 为规范 §五4「气泡弹层/卡片」合规值，不动** |
| 9 | 裸 px padding | MainActivity 10 处 setPadding 补 dp2px（debug root 32/sbH 组、表格 cell、代码块、banner 等）；SettingsSheet 4 处已被设计师拆段自然消灭。**系统 inset px 域（:1593 setPadding(0, top, 0, 0)）非瑕疵不动** |
| 10 | JS 直写 danger×6 | 新建 `前端设计/mov-vue/src/styles/tokens.js` 单源 `DANGER='#d92d20'`（与 tokens.css --danger 对齐断言）；ModelPage:216 / SidebarNav:275,378 / VaultPage:408,485 五处 confirmButtonColor 收编（第 6 处=tokens.css 定义行本身） |
| 11 | 游离色收编 | WorkbenchPage:257 + demo.js:93 `#7c5cff`→`var(--primary)`（.avatar 类默认即 primary 绿底白字，inline 覆盖撤销）；ChatPage:186 蓝阴影 `0 8px 32px rgba(16,24,64,.16)`→规范标准 `0 8px 28px rgba(0,0,0,.12)` |
| 12 | 顶栏统一 | tokens.css `.topbar` height:56px→**46px**（van-nav-bar 对齐） |
| 13 | MemoryPage ellipsize | 标题/计数/状态/meta 1 行 ellipsis；摘要 body 折叠态 2 行 ellipsis、**展开态 maxLines=Int.MAX_VALUE 解锁**（展开原文语义不破）；移除按钮静态文案不加 |

**验收断言脚本**：新建 `tools/design_token_assert.mjs`（11 组断言全绿）——字号禁用档/旧文本色/灰系 parseColor/15dp 圆角/裸 px 8f/裸 px 清单模式/JS #d92d20/#7c5cff/蓝阴影/顶栏 56px + tokens.js↔tokens.css 值对齐。**变异亲杀 2/2**：M1 顶栏改回 56px 必红、M2 WebPageSheet 回写 0xFF5C6470 必红，恢复后 PASS（断言非恒真实证）。

## 二、测试证据（L1）

- 全量真跑（--rerun-tasks，22 tasks 全 executed，非 up-to-date 假绿）：**53 类 376 tests / 0 failed / 1 skipped**（12306 LiveQuery）BUILD SUCCESSFUL
- `:app:assembleDebug` 绿（app-debug.apk 60MB 产出）
- `check-token-effect.mjs 62986c2` **exit=0**——纯 UI 未触请求链路，**Token/KV 两节申报「不变」**
- `sync-pages.mjs --check` 幂等一致（76 文件，7 页面产物重建入库）
- WebViewWarmupTest 哨兵适配：SettingsSheet 同色底断言从字面量 grep 升级为「消费面 UiTokens.S0 + UiTokens.kt 单源定义值锚定」双断言（更强非放水）；assets 守卫按 UPG-26 先例「产物入库提交后回绿」

## 三、注记与挂账候选（被动发现，未顺手修）

1. **PhotoAskSheet:143 `cornerRadius = 20.dp()`**——不在规范圆角阶梯（4/8/12/14/16/全圆），§七清单未点名；建议设计师定夺（归 16 或入清单）
2. **裸 px margin**（如 MainActivity `topMargin = 4; bottomMargin = 4` 等多处）——§四硬规只锚 padding；如需同口径清理建议另立清单
3. **PrivacyGateActivity/PrivacyPolicyActivity parseColor 写死色值**——#6 清单未点名（隐私页），UiTokens 并轨未覆盖
4. **暗色组微差**：原生 TEXT_DARK=0xFFE8EAEE / TEXT2_DARK=0xFF8A9099 与 web 暗色组（#e4e5ea/#a9afbf）存在微差——已并入 UiTokens 单源（字面量清零），值对齐留暗色专项
5. **L2 真机逐页走查（13 项逐项截图）+ E 面用户三实测点复测**：留验收员（本项目无浏览器/模拟器占用说明，apk 已产出可装 emulator-5556）

## 四、申报

- **Token 影响：不变**（纯 UI 渲染面，check-token-effect exit=0 实证）
- **KV Cache 影响：不变**（请求前缀字节零改动）
- **红线核对**：未动 room.html/markstream 冻结页（markstream 仅原生查看器 Activity 文本色一行）；未动 send()；零平行数据源；已登记两个表

**已登记工单表.xlsx + 工单库.md（feat/upg25 62986c2｜报告 DELIVERY_UPG25_2026-08-29.md）**
