# DELIVERY UPG-26 侧边栏品牌区换 logo+黑字 + 抽屉展开占比 61.8%

**日期**：2026-08-29 ｜ **分支**：feat/sidebar-brand **2279f14**（已 push origin，worktree mov-sidebar，基线 main 5a6d2e4）
**性质**：用户直令直接施工（无方案单），事后补登记——**已登记两个表**（工单表 row 27 + 工单库 UPG-26 卡）。

## 交付

| 项 | 落点 |
|---|---|
| 品牌区 logo+黑字 | `前端设计/mov-vue/src/components/SidebarNav.vue`：`<span class="brand">MOV AI</span>` 绿字（--primary-text）→ logo 透明线稿 + 黑字。logo = 新增 `src/assets/logo.png`（`drawable-nodpi/mov_logo.png` 1108px 源裁边、描线纯黑化、降 64px/3023B）；文字色 `--primary-text` → `--text`（浅 #191b21 / 深 #e4e5ea 自适应）；dark 下 `.brand-logo{filter:invert(1)}` 反白 |
| 抽屉展开占比 61.8% | `MainActivity.kt:1225`：`drawerWidthPx` 0.60 → 0.618（唯一赋值点，grep 实证无其他覆写；内层 van-popup 在独立入口已被 SidebarApp 强制 100%，实宽=原生面板宽） |
| 产物 | 7 页全量重建 + `sync-pages.mjs` 先清后放（--check 幂等一致）；logo 以 data URI 内联进 SidebarNav chunk（规避 sync-pages 闭包不识别 `new URL(import.meta.url)` 引用的盲区——首跑 96px/5.3KB 超 4KB 内联阈值导致 logo 漏同步挂图，降 64px 后内联闭环） |

## 顺带纠正（已在两表注明）

main 页面资产漂移：UPG-05 合入的 i18n key（`tabDone:'已完成'` 等，zh.js:184 区）当时未重建入产物——本单 7 页重建一并更新，tokens chunk 差异实证仅为该漂移。

## 验证

- **L1**：`:app:assembleDebug :app:testDebugUnitTest --rerun-tasks` 真跑 —— **49 类 342/0/1 跳过**（跳过=12306 LiveQuery 老项），提交后 WebViewWarmupTest 资产守卫回绿（其口径=资产入库无 porcelain 差异）。
- **构建链**：bun install（lockfile）→ vite build 绿 → sync-pages 幂等一致；`node scripts/check-token-effect.mjs` 通过。
- **浏览器截图**（Edge 无头，http 本地服务，360×800）：品牌区「▲眼 logo + MOV AI 黑字」符合预期，截图 `Desktop/sidebar_new.png`。

## 如实申报

- ~~真机 61.8% 实宽未上机截图~~ → R2 已实装实证（见下）；深色模式 logo 反白未上机截图（规则已在产物 CSS 实证）——留验收员 L2。
- 本单无方案单/无验收员排期，属用户直令小改；若需走验收流程由设计师定夺。

## R1/R2 精修追记（2026-08-29，b2eb0f5 已推 origin）

用户实测两轮直令精修，均 emulator-5556 实装截图验证：

- **R1**：品牌文字 19px/700 → 16px/500、字距 +.04em（细体精排）；logo 22px → 30px，源图升 96px PNG-8 量化 2339B（仍在 4KB 内联阈值内，高倍密度不糊）。
- **R2**：品牌行 `align-items:center → flex-end` + `line-height:1`——MOV AI 字形底边与 logo 三角底边取齐（用户拍板）；抽屉宽 0.618 → **0.75**（用户拍板覆盖，61.8% 仅存活一轮；MainActivity.kt:1225 注释留演进痕）。
- **实证**：实宽 810/1080px = 75% ✓；文字底边=三角底边 ✓（桌面 mov_emu_5.png / mov_emu_6.png）。
- **L1 复跑**：49 类 342/0/1（--rerun-tasks 真跑）+ assembleDebug 绿 + check-token-effect 过。
- 两表已于 R2 当日同步更新（工单表 row 27 E 列追加 + 工单库 UPG-26 卡追记）。

## Token 影响

无——不触请求链路（发给模型的内容 / tools 字段 / system prompt / 会话历史投影 / 压缩折叠 / MCP 注册均未改动）。

## KV Cache 影响

无——请求前缀字节不变。
