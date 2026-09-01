# DELIVERY UPG-41 v2 修复（打回 P1/P2）

> 程序员 C ｜ 2026-08-30 ｜ 分支 `feat/upg41`（基底 35a37b6，保持原基底——main 产物 hash 分叉待合时统一）｜ commit `675970b`（修复）+ `0ef352d`（产物同步）已 push origin
> 打回：`【打回】UPG-41 v2 本地页「列表/详情」重设计 + 市场包独立模板 —— ❌ 打回修复`（P1/P2 不回退）
> **已登记两个表**（工单表.xlsx + 工单库.md，先表后库）

## 一、缺陷 1（P1）· 内置宿主工具组启停无效 MARKET_NOT_INSTALLED

**修复（设计师决策落地）**：
- `LocalOverviewPage.vue` 头卡：删除可点 `van-switch`——宿主工具组（设备控制/12306/Obsidian，`builtin` 分组）与系统基础能力一致显示「**常驻**」灰字不可点；不再渲染开关、不再 emit `toggle`（不再走 `market.disable/enable`——内置宿主组无 registry/store 条目，setEnabled(:309-311) 必然 throw）
- `MarketPackDetail.vue` 头卡右上角**新增启停开关**（市场包在 registry 有条目：browser-automation 走 setEnabled builtin 支路；普通外部包走正常 registry 支路）——「市场包保留可启停」落地在此
- `MarketPage.vue` 节流同步：`@toggle` 从内置详情行移除、市场包详情行装配（`onTogglePkg` 沿用，demo 模式演示态保留）

## 二、缺陷 2（P2）· zh.js 缺 localDetail/marketPack i18n key

**修复**：
- `zh.js` 补 `localDetail`（17 key）+ `marketPack`（20 key）全量中文（与 en.js 键集**逐键一致**，内容=入库产物原文）：whatFor/howToUse/useIt/alwaysOn/health*/saf* 等 + installed/fromMarket/home*/trust*/uninstall 等
- 独立 `vite build` 可复现中文详情（产物 `tokens-4s9L3xB4.js` grep「这能干嘛/常驻」实证）

## 三、verify 扩展（本次修复前零覆盖此面——验收员 P2 洞见）

`scripts/upg41-verify.mjs` 增 ⑦⑧ 两组共 9 项：
- ⑦内置详情不含 `<van-switch` / 「常驻」标签锚 / 不 emit toggle / 市场包保留 switch+emit / 节流（toggle 仅市场模板）
- ⑧zh.js `localDetail`/`marketPack` 键集与 en.js 逐一一致（键数=17/20 相等+全集包含）

## 四、验证证据

- **verify**：`node scripts/upg41-verify.mjs` —— **29 项全绿**（原 20 + 新增 9）
- **变异亲杀 2/2**（先 commit 后变异，还原复绿）：
  - ①内置详情 switch 回流（v-if 可点+emit toggle）→ `⑦内置详情无 switch` + `⑦内置详情不 emit toggle` **双红**
  - ②zh.js 删 localDetail 段 → `⑧zh.js localDetail 键集与 en.js 一致（en=17 zh=0）` **红**
- **构建**：`bun run build`（3.76s）→ `sync-pages.mjs`（72 文件，7 目录先清后放，`--check` 幂等一致）→ 产物 grep「这能干嘛/常驻」命中（tokens-4s9L3xB4.js）→ `assembleDebug` **BUILD SUCCESSFUL**
- Token/KV：0/0（纯视图/文案）

## 五、复验移交（验收员口径复述，logcat/截图验收员采集）

- ①P1 复验：设备控制详情头卡=「常驻」不可点（点按无 MARKET_NOT_INSTALLED logcat）；市场包 browser-automation 启用/停用真实生效（builtin 支路，logcat 无 MARKET_NOT_INSTALLED）
- ②P2 复验：独立 `vite build` 后中文详情页无裸 key（localDetail.whatFor 等零出现）
- ③L1/其余 L2/L3 不回退（verify 29 项+构建绿保底）
