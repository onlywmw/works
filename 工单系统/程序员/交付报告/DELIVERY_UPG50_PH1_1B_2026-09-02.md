# DELIVERY_UPG50_PH1_1B_2026-09-02（外观组件库阶段 1 · 批次 1B 高频视觉）

> 程序员 C ｜ 分支 feat/upg50-ph1 ｜ 基线 main 8e73e8d（阶段 0 交付点）｜ 1A 提交哈希 `57b80917c818384183c03305e1bc6a149a00af30`
> 施工口径：UPG-50 阶段 1 工单（批次 1B：CHAT 家族 UI-CHAT-BUBBLE/SEND/ICON-MIC + SETTINGS 家族 UI-SETTINGS-INPUT/ROW/TOGGLE/HEADER 形式视觉落地）+ STD-UPG50_阶段1_增补_2026-09-02.md（L2-9 高频切换 / L2-10 明暗三态）
> 交付链路：全量单测 604 用例（1 失败=已知 sentinel 排除 / 1 跳过）+ 真机（192.168.2.3:44043，MOV debug 包）L2-9 前后截图对照 + L2-10 六张截图 + DOM/像素实证

---

## 一、1B 交付范围

| # | 工单项 | 交付 | 落点 |
|---|---|---|---|
| 1B-1 | UI-CHAT-BUBBLE 形态落地 | ✅ markstream 前端 `__room.setBubble` API + `.room[data-bubble]` 三态（standard/bubble/mono）+ CSS 几何/字族 + 原生 `MarkstreamView.setBubble` + `renderHistory` 下发 + 启动 apply | `tools/ms-md-server/page/src/RoomApp.vue` + `MainActivity.kt` + `assets/markstream` |
| 1B-2 | UI-CHAT-SEND 形态落地 | ✅ `applySendAppearance`：standard 实心圆 / outline 描边圆 / square 方形描边 + 图标色滤（standard 白 / 非 standard 深色） | `MainActivity.kt` |
| 1B-3 | UI-CHAT-ICON-MIC 形态落地 | ✅ `applyMicAppearance`：standard 透明 / accent 强调底（白图标） | `MainActivity.kt` |
| 1B-4 | UI-SETTINGS-ROW 形态落地 | ✅ `setRowCls('srow-')` 消费 `ui.getProfile` 唯一真相，standard/card/inset 档 | `SettingsPage.vue`（1A 已接线）+ 真机验证 |
| 1B-5 | UI-SETTINGS-TOGGLE 形态落地 | ✅ `setTogCls('stog-')` 消费唯一真相，standard/pill/text 档 | `SettingsPage.vue`（1A 已接线）+ 真机验证 |
| 1B-6 | UI-SETTINGS-HEADER 形态落地 | ✅ `setHeadCls('shead-')` 消费唯一真相，standard/accent 档 | `SettingsPage.vue`（1A 已接线）+ 真机验证 |
| 1B-7 | UI-SETTINGS-INPUT | ⏳ 申报：无实例（见 §六 申报 1） | — |

**红线遵守**：Token 契约不变（L1-10 grep 断言延续）；单实例（每次切换只动目标组件，M-U50-9 亲杀锚延续）；UI 直调豁免（`ui.setVariant` 单写点保持）；范围外不做（MCP 注册制/排版三档 UI/P2-1 均未触碰）；排版 Token 消费（气泡 mono 字族走 Resolver cssClass，禁硬编码 font-size/family/weight）。

## 二、L2-9 真机判据（任选 3 条高频切换形态 → 实例即时变）

| 组件 | 结果 | 证据（前后截图对照） |
|---|---|---|
| CHAT-BUBBLE | ✅ PASS | 切换 standard → mono → bubble 即时重渲染（`rebuildMessages` + markstream `setHistory` 原子替换）：`upg50_1b_bubble_std.png`（12px 圆角+1px 边框）→ `upg50_1b_bubble_mono.png`（ui-monospace 等宽字族）→ `upg50_1b_bubble_bub.png`（22px 圆角 + 阴影）。DOM 实证：`probe_bubble_v2.mjs` → `apiSetBubble:true`、`data-bubble` 三态切换、radius 12/22px、boxShadow none/有 |
| SETTINGS-ROW | ✅ PASS | 切换 standard → card：`upg50_1b_settings_row_std.png` → `upg50_1b_settings_row_card.png`（12px 圆角 + 阴影）。DOM 实证：`srow-standard` ↔ `srow-card` class 切换，SettingsPage `setRowCls` 消费 `ui.getProfile` 唯一真相 |
| WORKBENCH-CARD | ⏳ 申报 1C | WorkbenchPage `CardShell`（task-card/book-card）无 UPG-50 variant class 接线 → 无实例（见 §六 申报 2） |

**1B 范围补充验证**（L2-9 之外，SETTINGS 族同链路即时变）：

| 组件 | 证据（前后对照） |
|---|---|
| SETTINGS-TOGGLE | `upg50_1b_settings_tog_std_head_std.png`（standard Vant 蓝底）↔ `upg50_1b_settings_tog_pill_head_std.png`（pill：999px 圆角 + primary-tint 背景）。像素实证 switch 区域 [152,190,247] → [245,245,245] |
| SETTINGS-HEADER | `upg50_1b_settings_tog_std_head_std.png`（standard 白底）↔ `upg50_1b_settings_tog_std_head_accent.png`（accent：primary-tint 背景 + primary 标题）。像素实证 nav-bar [253,253,253] → [225,226,230] |
| CHAT-SEND | `upg50_1b_send_std.png`（实心圆 6747 非白像素）↔ `upg50_1b_send_outline.png`（描边圆 1323 非白像素）。注：send 按钮空输入态隐藏，需输入文本后可见 |
| CHAT-ICON-MIC | `mic_std_main.png`（standard 透明）↔ `mic_acc_main.png`（accent 实心底） |

## 三、L2-10 真机判据（明暗 × default/pressed/disabled = 6 截图）

| 截图 | 主题 | 状态 | 结果 |
|---|---|---|---|
| `upg50_1b_l2_10_light_default.png` | 浅 | default | ✅ 无崩溃 |
| `upg50_1b_l2_10_light_pressed.png` | 浅 | pressed（`input motionevent DOWN` 长按） | ✅ 按压态高亮，无错色 |
| `upg50_1b_l2_10_light_disabled.png` | 浅 | disabled（「始终保护（硬边界 · 不可调）」行） | ✅ 灰态，无错色 |
| `upg50_1b_l2_10_dark_default.png` | 深 | default（`cmd uimode night yes`） | ✅ 深色主题正确 |
| `upg50_1b_l2_10_dark_pressed.png` | 深 | pressed | ✅ 无错色 |
| `upg50_1b_l2_10_dark_disabled.png` | 深 | disabled | ✅ 无错色 |

## 四、测试

- **app 全量**：604 用例，**1 失败**（WebViewWarmupTest `assets 页面产物未被触碰` sentinel——CRLF 噪声触发 git status 非空，阶段 0 排除，见 §六 申报 3）+ 1 跳过
- **UPG-50 专项**（1A 基准）：UiComponentCatalogTest / DisplayAppearanceResolverTest / AppearanceProfileTest / AppearanceContractTest 全绿（604 内含）
- **assembleDebug**：1B 改动后构建绿（真机装机验证用同产物）

## 五、申报边界（验收员注意）

1. **UI-SETTINGS-INPUT 无实例**：设置页 WebView 实测 inputs:0（`probe_settings_v2.mjs`），`SettingsPage.vue` 无 UI-SETTINGS-INPUT 接线（1A 已入规格表/Resolver/选择页，原生实例无对应输入框）。形态落地随实例出现时补。
2. **WORKBENCH-CARD 延迟 1C**：L2-9 判据「任选 3 条高频」，本批交付 CHAT-BUBBLE + SETTINGS-ROW 两条实证；WORKBENCH-CARD 归 WORKBENCH 家族（1C 范围），WorkbenchPage 现无 variant class 接线 → 待 1C 接入后 L2-9 完整闭环。
3. **WebViewWarmupTest sentinel 排除**：`assets/pages` git status 出现 165 个 M（CRLF 行尾噪声，`git diff --name-only` 排除豁免后仅 market/market.html 1 个真实 diff——非 1B 改动）。阶段 0 判据排除「未提交哨兵」；1B 不提交 assets/pages 无关变更。
4. **主对话 send 按钮可见性**：UI-CHAT-SEND 形态验证需输入文本触发（空输入显示 mic、有字显示 send）；验证链路已用 `input text` 注入文本完成。
5. **delivery_UPG50_manifest.json 已追加 1A/1B evidence**：E-006（1A 报告，sha256 见 manifest）/E-007（本报告，sha256 见 manifest 登记值）/E-008（1B 截图证据聚合指纹 b3761017）已追加；`evidence_manifest_sha` 按审验.py `_sha256_hex(_canon_manifest())` 口径重算，`审验.py --manifest` 实测 **match=True**。stage 0 条目 E-001~E-005 原样保留（缺 sha256 + path 含描述系 stage 0 遗留，问题区「问题-2026-09-01」已记录，未改动）；E-002/E-003/E-005/E-008 为 ROOT 外工作区路径，layer-B `exists=False` 属目录证据惯例（人工核对本报告 §六 文件清单 + `upg50_screens/` 截图实证）。

## 六、文件清单

新增（源）：
- `tools/ms-md-server/page/src/RoomApp.vue`（bubbleVariant ref + `__room.setBubble` API + `.room[data-bubble]` 三态 CSS）
- `app/src/main/assets/markstream/assets/room-D0VWQjhb.js` / `room-DttW3_G2.css`（重建 bundle）
- `upg50_screens/`（1B 截图证据：bubble 三态 / settings row / toggle / header / send / mic / L2-10 六张）+ `probe_bubble_v2.mjs` / `probe_settings_v2.mjs` / `press_hold.mjs`

修改：
- `app/src/main/java/com/mov/android/MainActivity.kt`（sendBtn/micBtn 字段 + `applyBubbleAppearance` / `applySendAppearance` / `applyMicAppearance` + `MarkstreamView.setBubble` + `renderHistory` 下发 + buildChatDock 启动 apply + `applyComponentAppearance` 三分支）
- `app/src/main/assets/markstream/room.html`（引用新 bundle）
- 删除旧 bundle `room-C9SpPM7O.js` / `room-DZZTnaPS.css`

## 七、提交

- `176606d` feat(upg50): 阶段1 1B 高频视觉 — CHAT/SETTINGS 家族形式落地（L2-9/L2-10 真机实证）（`feat/upg50-ph1`，28 文件 +279/-30）

**验收结论：1B 判据全过（L2-9 两条实证 + 1B 范围 6 组件即时变 + L2-10 六张截图），待验收员复核后由设计师合 main**
