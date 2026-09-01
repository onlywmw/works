# DELIVERY UPG-41 v2（本地页「列表/详情」重设计 + 市场包独立模板）

> 程序员 C ｜ 2026-08-30 ｜ 分支 `feat/upg41`（worktree `mov-upg41`，基底 `origin/main 801b8fc`；旧 v1 `feat/upg41 bb31e33` 已作废，force-with-lease 重写）
> 派单：本轮粘贴派单 + `设计师\派单\UPG-41_本地页列表详情重设计_派单_2026-08-30.md` ｜ 方案：`设计师\方案设计\本地页列表详情重设计_方案_v1_2026-08-30.md`（v2 定稿）｜ demo：`设计师\设计预览\demo\本地详情_demo_v6.html`
> **已登记两个表**（工单表.xlsx + 工单库.md，先表后库）

---

## 一、交付概要

| 项 | 值 |
|---|---|
| commit | `907a8ce`（主交付）+ `35a37b6`（市场页白名单接线补丁；已 push origin；v1 `bb31e33` 作废重写，--force-with-lease 履约） |
| 源码 | `MarketPage.vue`（本地 tab 一级列表 + 详情切换）+ **新** `LocalOverviewPage.vue`（内置/系统详情）+ **新** `MarketPackDetail.vue`（市场包详情）+ `i18n/zh.js`/`en.js`（localDetail/marketPack 命名空间）+ **新** `scripts/upg41-verify.mjs` |
| 产物 | `vite build` → `sync-pages.mjs` 同步 7 目录 72 文件（--check 幂等一致；market 12 文件） |
| 数据面 | **零改动**（LocalOverview.kt / market.localOverview / ui.getPins / market.enable|disable / SAF 桥 全沿用只读）；唯一接线 = `MarketPageActivity.allowedPrefixes` **精确放行 `ui.prefillInput` 单条全名**（「用它」回填必要；非 ui.* 前缀，与 SidebarNav 工位同款仅回填无执行通路） |

## 二、施工对照（派单需求 A/B/C）

**A 一级「本地」列表（简约+分类管理）** ✅
- 分组标题：内置能力/市场已安装/系统基础能力，左靠、灰、小号（`lv-sec`，margin-left 12px）
- 工具行：仅 名称（15px 600）+ 一句副题（12.5px 灰，真实数据 `p.desc`，市场包空 desc 兜底工具名）+ 右侧 `›`；**无图标/无 badge/无「N 项」计数/无健康点/无行内按钮开关**（`lv-row` 右缩 padding-left 20px，两级层次 + 不贴边框）
- 健康提示全部下沉二级（一级模板零 `st-dot`/`ov-health`）

**B 内置工具详情（用途/用法前置）** ✅ —— `LocalOverviewPage.vue`
- 顺序固定：头卡（名称+badge+副题+健康+**右上角启停开关**，系统组灰显「常驻」不可关）→ 「这能干嘛」（`pkg.desc` 真实数据）→ 「怎么用」（💬 真实 `preset` 预设指令 + `{用它}` 回填输入框 `ui.prefillInput`，与侧边栏工位同通路）→ 工具一览（名/作用/权限 自由·询问·拦截）→ 权限分布（三计数）→ SAF 授权（obsidian authorized===false 显示「去授权」）
- 「用途/用法」在「工具清单/权限」之前（DOM 顺序，verify ④锚）

**C 市场包独立模板（商店式）** ✅ —— `MarketPackDetail.vue`
- 头卡（包名 + 「已安装」badge + 来源·工具数·健康）→ **核心：装后主页示意**（普通/极简 segment 切换，功能栏高亮本包 + 「↑ 装了…主页功能栏会多出…」）→ 怎么用（1-2 例，真实 preset 句式）→ **信任区**（订单底部**致密折叠、默认收起**，灰字低调：来源 mow.kim 能力市场 + 各工具权限请求逐条）→ 卸载
- 无启停开关（装不装问题）；**作者/版本数据面未提供 → 不编造不渲染**（红线「勿用 demo 占位」；demo 里的示例值未入生产）

## 三、L1 验证证据

- **verify**：`node scripts/upg41-verify.mjs` —— 20 项全绿（5 变异锚组 + 数据面白名单核对）：
  ① 分组标题「内置能力」i18n 源 + 模板渲染锚 ②「怎么用」{用它}按钮（内置+市场）+ prefillInput 接线 ③ 一级行无 Icon/badge/计数/健康点/控件（模板片段正则零命中）④ what/how 在 tools/perm 之前（indexOf 序）⑤ 信任区 `trustOpen = ref(false)` 默认收起 ⑥ 数据面写调用白名单（install/uninstall/enable/disable/SAF）
- **变异亲杀 2/2**（先 commit 后变异，恢复后终态复跑 verify 全绿）：
  - 变异①删 `groupBuiltin: '内置能力'` → `①分组标题「内置能力」i18n 源存在` **必红** ✅
  - 变异②删 `{用它}` use-btn 按钮 → `②内置详情{用它}按钮 + preset 回填 emit` **必红** ✅
- **构建**：`bun run build`（vite 6.66s）✅ → `sync-pages.mjs`（先清后放 72 文件；--check 幂等一致）✅ → `gradlew :app:assembleDebug` **BUILD SUCCESSFUL**（37 tasks，新产物进 APK）✅
- **check-token-effect**：通过（纯视图层未触及请求链路）✅

## 四、Token / KV 申报

- **Token 影响**：0/0（纯视图重排+文案展示，无请求链路文件改动；新建组件仅消费既有 market.localOverview 返回字段）
- **KV Cache 影响**：0/0（无会话中途新增字段/前缀变更）

## 五、L2/L3（留给验收员，口径复述）

- L2 真机（emulator-5556，包 com.mov.android）：进本地 tab → 一级仅分组+名称+副题+箭头（截图无控件堆叠）；点内置工具 → 二级见「这能干嘛/怎么用」；点市场包 → 普通/极简主页示意可切换；启停/SAF 授权/卸载可操作；深浅双色走查（L3：与 UPG-40 token 无回归——本单零新增 token，`tokens.css` 未动，build 后 `sync-pages` 的 UPG-40 品牌绿校验通过）
- 说明：真机验证需要安装含新产物 APK，证据（截图/journal）由验收员采集落 `验收员\证据数据\UPG-41\` + ACCEPTANCE_LOG.md

## 六、其他声明

- **演示数据已还原**：demo.js 未改动（`data/demo.js` 保持种子；原生桥失败仍走「清空+错误态」UPG-17 修3 口径，verify ③⑥佐证）；本单未在产物中引入 demo 占位数据
- 与 UPG-40/UPG-25 邻接：样式全部复用既有 token（--s0..s4/--text* 等）与 van 变量，零新增设计 token；未改动 tokens.css
- 挂账 0 条；「待核实」0 条
- 旧 v1（bb31e33 二级页化）作废处置：worktree 重开（本地旧分支删除）、远程 force-with-lease 覆盖、原 v1 报告（DELIVERY_UPG41_2026-08-30.md）保留留档（历史事实）
