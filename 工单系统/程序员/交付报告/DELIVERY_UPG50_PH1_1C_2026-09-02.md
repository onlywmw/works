# DELIVERY_UPG50_PH1_1C_2026-09-02（外观组件库阶段 1 · 批次 1C 余下组件）

> 程序员 C ｜ 分支 feat/upg50-ph1 ｜ 基线 main 8e73e8d（阶段 0 交付点）｜ 1A `f3c0fda` ｜ 1B `bcb18f5` ｜ 1C 提交哈希 见 §八
> 施工口径：UPG-50 阶段 1 工单批次 1C（SIDE-HEADER/ROOM/TOOL · WORKBENCH-ROW/CARD · MARKET-CARD/LIST · ASSETS-CARD/LIST · SHEET-HEADER/BODY · COMMON-EMPTY 共 12 组件）+ P2-A（WORKBENCH-CARD L2-9 第三件证据）+ P2-B（pressed 态 4 族矩阵）
> 判据：STD-UPG50_阶段1_增补_2026-09-02.md §三「1C（余下组件）：1B 全过 + 20 条逐条 L2-9 扩展（全组件切换验证）」
> 交付链路：全量单测 606 用例（0 失败 / 0 跳过）+ 真机（192.168.2.3:44043，MOV debug 包）12 组件逐条 L2-9 双态切换实证（截图 + DOM class / computed style）+ P2-B pressed 矩阵真机实证

---

## 一、1C 交付范围（12 组件逐条）

| # | 组件 | 变体 | 落点 | 结果 |
|---|---|---|---|---|
| 1 | UI-SIDE-HEADER | standard / accent | `SidebarNav.vue` `sideHeadCls` | ✅ |
| 2 | UI-SIDE-ROOM | standard / compact / card | `SidebarNav.vue` `sideRoomCls` | ✅ |
| 3 | UI-SIDE-TOOL | standard / pill | `SidebarNav.vue` `sideToolCls` | ✅ |
| 4 | UI-WORKBENCH-ROW | standard / card / compact | `WorkbenchPage.vue` `wrowCls` | ✅ |
| 5 | UI-WORKBENCH-CARD | standard / elevated / flat | `WorkbenchPage.vue` `wcardCls`（P2-A 锚） | ✅ |
| 6 | UI-MARKET-CARD | standard / elevated / compact | `MarketPage.vue` `mcardCls` | ✅ |
| 7 | UI-MARKET-LIST | standard / compact | `MarketPage.vue` `mlistCls` | ✅ |
| 8 | UI-ASSETS-CARD | standard / grid / list | `AssetsPage.vue` `acardCls` | ✅ |
| 9 | UI-ASSETS-LIST | standard / compact | `AssetsPage.vue` `alistCls` | ✅ |
| 10 | UI-SHEET-HEADER | standard / accent | `SettingsPage.vue` `shheadCls` | ✅ |
| 11 | UI-SHEET-BODY | standard / card / inset | `SettingsPage.vue` `sbodyCls` | ✅ |
| 12 | UI-COMMON-EMPTY | standard / minimal | `WorkbenchPage.vue` `cemptyCls` | ✅ |

**红线遵守**：Token 契约不变（L1-10 grep 延续）；单实例（`ui.setVariant` 单写点保持，L1-14 亲杀锚延续）；六族全部 `ui.getProfile` 唯一真相，无独立态；排版 Token 消费（形态全部走 Resolver cssClass，无硬编码 font-size/family/weight）；范围外不做（MCP 注册制/排版三档/P2-1 均未触碰）。

**1C 关键接线缺口修复**：`MarketPageActivity.kt` 白名单原为 `market. + ui.getPins/setPins/prefillInput`（刻意精确放行），缺 `ui.getProfile/ui.setVariant` → 市场页形态恒回退 standard，L2-9 无法切换实证。已按最小必要追加两个外观工具（仅读写外观 profile，无导航/数据通路），与 AssetsSheet/BizSheet/SettingsSheet 等 sheet 白名单一致。详见 §六 申报 1。

## 二、L2-9 逐条切换实证（1C 扩展：12 组件双态）

> 采集方法：`ui.setVariant` 写 AppearanceProfileStore → `Page.reload` → DOM class / computed style 实证 + 截图。SHEET/SIDE 为 BottomSheet/离屏 WebView，CDP `captureScreenshot` 超时（与 1B sidebar 同因），以 DOM 实证为准（§六 申报 2/3）。

| # | 组件 | 切换 | 证据 |
|---|---|---|---|
| 1 | SIDE-HEADER | standard→accent | DOM：`sdhead-standard` ↔ `sdhead-accent`（`dom_switch.mjs` 实证 1 元素） |
| 2 | SIDE-ROOM | standard→card | DOM：`sroom-standard` ↔ `sroom-card`（1 元素） |
| 3 | SIDE-TOOL | standard→pill | DOM：`stool-standard` ↔ `stool-pill`（5 元素=市场入口+钉选工具） |
| 4 | WORKBENCH-ROW | standard→card | 截图 `upg50_1c_wrow_std.png` ↔ `upg50_1c_wrow_card.png`（card=12px 圆角+阴影）；DOM `wrow-standard` ↔ `wrow-card` |
| 5 | WORKBENCH-CARD | standard→elevated | 截图 `upg50_p2a_wcard_standard.png` ↔ `upg50_p2a_wcard_elevated.png`（elevated=0 边框+阴影 0 4 12）；P2-A 锚 |
| 6 | MARKET-CARD | standard→elevated | 截图 `upg50_1c_market-card_standard.png`（102797B）↔ `upg50_1c_market-card_elevated.png`（104429B，hash 不同）；computed style：`box-shadow:none` → `rgba(0,0,0,.12) 0 4px 12px 0` |
| 7 | MARKET-LIST | standard→compact | 截图 `upg50_1c_market-list_standard.png` ↔ `upg50_1c_market-list_compact.png`（hash 不同）；DOM `mlist-standard` ↔ `mlist-compact` |
| 8 | ASSETS-CARD | standard→grid | 截图 `upg50_1c_assets-card_standard.png`（50243B）↔ `upg50_1c_assets-card_grid.png`（51138B）；DOM `acard-standard` ↔ `acard-grid` |
| 9 | ASSETS-LIST | standard→compact | 截图 `upg50_1c_assets-list_standard.png` ↔ `upg50_1c_assets-list_compact.png`（hash 不同）；DOM `alist-standard` ↔ `alist-compact`；**computed padding 实证 `8px 12px` → `6px 10px`（!important 压过页面 scoped `.cred-row`，行高 42→38px）** |
| 10 | SHEET-HEADER | standard→accent | DOM：设置页语言弹层 `shhead-standard` ↔ `shhead-accent`（`.van-action-sheet__header` 文字色 standard→primary）；header=选择语言，items=中文/English |
| 11 | SHEET-BODY | standard→card | DOM：`sbody-standard` ↔ `sbody-card`（`.van-action-sheet__item` 分隔→圆角卡+阴影） |
| 12 | COMMON-EMPTY | standard→minimal | 截图 `upg50_1c_cempty_std.png` ↔ `upg50_1c_cempty_min.png`（minimal=去虚线边框）；DOM `cempty-standard` ↔ `cempty-minimal` |

**1C 形式落地缺陷修复**（tokens.css，防「切换 class 变了但视觉无差异」）：
- `alist-compact` padding 被页面 scoped `.cred-row`（0-2-0 > 0-1-0）覆盖 → `padding:6px 10px !important`（P2-B 已有 !important 先例）
- `mcard-compact` padding 被 MarketPage `.hot-card`（scoped padding:14px）覆盖 → `padding:var(--van-padding-xs) !important`
- `mlist-compact` min-height:36px 低于 van-cell 内容自然高度（padding 20+line-height 24≈44px）永不生效 → 改走 vant 变量 `--van-cell-vertical-padding:6px / --van-cell-horizontal-padding:10px`（行高 44→36px）

## 三、P2-A（WORKBENCH-CARD L2-9 第三件证据）

- **证据链**：`upg50_p2a_wcard_standard.png`（border 1px + radius 12px）↔ `upg50_p2a_wcard_elevated.png`（border none + box-shadow 0 4px 12px rgba(0,0,0,.12)）。WorkbenchPage `wcardCls` 消费 `ui.getProfile` 唯一真相，切换后 CardShell 即时变。
- **补足**：1B 申报 WORKBENCH-CARD 延迟 1C（无 variant class 接线），本批已接线 + 截图 + DOM 实证闭环，L2-9 三条高频全过。

## 四、P2-B（pressed 态视觉反馈 · 4 族矩阵）

> tokens.css 统一声明，AppearanceContractTest `P2-B pressed 态视觉反馈_4族矩阵active锚` 断言 12 锚全绿（§五 测试）。

| 族 | 组件 | pressed 效果 | tokens 锚 | 真机实证 |
|---|---|---|---|---|
| 行/列表 | sroom/wrow/mlist/alist/sbody | 按压灰底 | `background:var(--s3) !important`（!important 压过页面 scoped 硬编码背景） | `upg50_p2b_asset_alist_pressed_light/dark.png` |
| 卡片 | card-shell/wcard/mcard/acard | 按压下压 | `transform:scale(.98)` | `upg50_p2b_asset_acard_pressed_light/dark.png` |
| 弹层行 | sbody | 按压灰底 | `.sbody-standard:active` 同灰底 | 同资产页（DOM） |
| 按钮/图标 | send/mic | 按压降透明 | `opacity:.7` | 1B 已采（`press_hold.mjs` 长按实证） |

**采集方法**：`adb shell input motionevent DOWN` 长按资产页类目卡/凭据行，pressed 态截图（明暗两主题）。pressed 效果为 tokens.css `:active` 规则，不依赖形态变体切换，不受本批 ASSETS 接线修复影响（§六 申报 4）。

## 五、测试

- **app 全量**：**606 用例，0 失败 / 0 跳过**（`app/build/test-results/testDebugUnitTest` XML 聚合）。含 AppearanceContractTest（L1-9/10/14 + L2-9 六族消费契约 + P2-B 4 族矩阵 12 锚）全绿。
- **本批改动后回归**：tokens.css（alist/mcard/mlist 修复）+ MarketPageActivity.kt（白名单追加）改动后重跑全量，606/0/0。
- **assembleDebug**：改动后构建绿（真机装机验证用同产物）。

## 六、申报边界（验收员注意）

1. **MarketPageActivity 白名单追加**：`ui.getProfile/ui.setVariant` 精确放行（原注释「精确全名放行、不扩大权限面」原则延续，只补两个外观读写工具）。其余 `ui.*`（open*/closePage/setLang 等）仍不放行，权限面最小扩大。
2. **SIDE 三组件截图受限**：sidebar WebView 离屏（抽屉未展开，screenX=-1524），CDP 截图超时 → 以 DOM class 双态实证为准（与 1B sidebar 同因）。
3. **SHEET 双组件截图受限**：设置页为 BottomSheet WebView，CDP 截图超时 → 以 DOM 实证为准（弹层 header=选择语言 / items=中文,English，`shhead-*`/`sbody-*` 双态切换）。
4. **P2-B 资产 pressed 截图**：`upg50_p2b_asset_*` 基于本批 ASSETS 接线修复前 APK 采集，但 pressed 为 tokens.css `:active` 规则（`background:var(--s3) !important` / `transform:scale(.98)`），与形态变体切换独立，效果不受修复影响，判定仍有效。
5. **旧版废图**：`upg50_1c_acard_std.png/grid.png`（ASSETS-CARD 接线修复前失败采集）作废，正式证据为 `upg50_1c_assets-card_standard.png/grid.png`。

## 七、文件清单

新增（源）：
- `前端设计/mov-vue/src/components/SidebarNav.vue` / `WorkbenchPage.vue` / `MarketPage.vue` / `AssetsPage.vue` / `SettingsPage.vue`（六族 12 组件形态 class 消费 `ui.getProfile`）
- `upg50_screens/`（1C 截图证据：wrow/cempty/assets-card/assets-list/market-card/market-list + P2-A wcard + P2-B asset_*）

修改：
- `前端设计/mov-vue/src/styles/tokens.css`（12 组件形态类 + P2-B pressed 4 族矩阵 + 本批 3 处 !important/CSS 变量修复）
- `app/src/main/java/com/mov/android/MarketPageActivity.kt`（白名单追加 `ui.getProfile/ui.setVariant`）
- `app/src/main/assets/pages/`（sync-pages 全量重打包产物：appearance/assets/market/model/orders/settings/sidebar/vault/workbench 九目录）

## 八、提交

- `0d6df7f` feat(upg50): 阶段1 1C 余下组件 — 12 组件形式落地 + P2-A 第三件证据 + P2-B pressed 4族矩阵（`feat/upg50-ph1`，141 文件 +419/-190：6 源组件 + tokens.css + MarketPageActivity.kt + 2 测试 + assets/pages 产物 + 1C 截图）

**验收结论：1C 判据全过（12 组件逐条 L2-9 双态切换实证 + P2-A 第三件证据闭环 + P2-B 4 族 pressed 矩阵 + 606/0/0），待验收员复核后由设计师合 main**
