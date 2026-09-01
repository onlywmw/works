# UPG-23 交付报告：本地 tab「本机能力总览」+ 主页钉选小按钮

**程序员**：C ｜ **日期**：2026-08-29 ｜ **分支**：`feat/upg23` @ **4293e29**（基于 main 8a205d6，已推 origin）
**已登记两个表**（工单表「升级工单表」row24 + 工单库 UPG-23 段）；卡外缺陷已登记挂账登记表（⏳挂账待审）。

## 一、交付内容（方案四条决策点全落）

| 方案项 | 落点 |
|---|---|
| K1 权限级单源 | `McpToolScheduler.kt` `PermissionGuard.permissionTier(tool): "free"/"ask"/"gate"`——复用 guard 判定顺序（底线/敏感→harmless→writeTools→else），只读，名单内容不出类；已核对 rebase 后新 main 名单字段（systemBaselineDeny/sensitiveTools/writeTools/harmlessTools 与 UPG-02+04 合并单对齐版）无误 |
| K2 聚合读面 | `LocalOverview.kt`（纯聚合、JVM 可测）：三层分组（builtin=Provider/scene meta 注册处按前缀归包 / market=bubbleOverview+health 缓存 / system=静态表只展示不可关）+ `toMaps` 桥输出 + `bubbleRows` 轻量投影 + `presetFor`（决策点④：device-control/scene-12306/obsidian 各一条写死预设） |
| K3 Vue 本地 tab | `MarketPage.vue` 重做：概览卡（工具/来源/钉选 n/5+健康一句话）、5 钉选槽（点满槽=取消）、三层分组（badge/状态点/van-switch，系统组无开关）、工具级下钻（等宽胶囊名+desc+权限标记 免审批/需确认/拦截）、SAF「未授权 →」引导行（决策点③）；i18n zh+en |
| 主页钉选小按钮 | `MainActivity.kt` chipsRow：mcpChip 后细分隔线+方形钮（包名首字+右上角健康点），与侧边栏槽共用 workbench_pins 单写点（决策点①）；点按=prefillInputText 回填预设指令（决策点②，与 `ui.prefillInput` 同一抽出方法，不直调工具不绕审批），page 类钉选（tasks/orders/vault）走既有 `ui.open*` 通路；停用=变淡+toast 引导，不可达=红点；onResume/ui.setPins 同源刷新 |
| MCP 气泡投影 | `mcpOverviewProvider` 切到 `LocalOverview.bubbleRows`（与本地 tab 同一聚合函数）；L1 行显示包名+三态点（黑正常/红不可达/灰停用，bubbleOpt 加 stateBad） |
| 桥接线 | `mcpHandlers["market.localOverview"]`（已入 `uiOnlyMcpTools`）；`MarketPageActivity` 白名单补 `obsidian.vault.`（引导行 detect/register 调用）；`McpMarket` 补 `bubbleOverview.reachable`（health 缓存透传，零网络口径不变）+`builtinOn`+`serverState`；`docs/MCP_MARKET_CONTRACT.md` 补契约一节 |

**偏离方案处（如实申报）**：方案 §四.4 要求 toolParamSchemas 登记——因 market.localOverview 已入 uiOnlyMcpTools（不进 agent 工具面，保 Token 不变红线），schema 永不消费，故未登记，改以 LocalOverviewTest 源码锚断言固化。

## 二、构建链（Vue → assets）

worktree 无 node_modules（gitignored）：`前端设计/mov-vue/` 下 `bun install`（bun.lock，34 包）→ `bun run build`（vite）→ `node scripts/sync-pages.mjs`（先清后放）→ 仅 `app/src/main/assets/pages/market/` 入库，其余 6 页目录零差异（守 WebViewWarmupTest 哨兵，UPG-25 同款口径）；`sync-pages.mjs --check` 幂等一致通过。

## 三、L1 验证（--rerun-tasks 真跑，非 up-to-date）

| 项 | 结果 |
|---|---|
| `:app:assembleDebug :app:testDebugUnitTest --rerun-tasks` | BUILD SUCCESSFUL，43 tasks executed |
| 单测 XML 统计 | **338 tests / 0 failures / 0 errors / 1 skipped**（新增 15：LocalOverviewTest 11 + PermissionGuardTest 2 + ChatChipsTest 2，基线 323；skip 为既有项） |
| 变异锚 | M1=PermissionGuardTest「tier 与名单同源」（接错名单即断言红）；M2=LocalOverviewTest「三层分组齐全且顺序固定」（删内置分组即红）；M3 pins 截断 5=既有 WorkbenchPinsTest 守住（本卡未动该路径） |
| 接线锚 | LocalOverviewTest 源码锚：market.localOverview 桥 + uiOnlyMcpTools 登记 + bubbleRows 投影 + pinChipsRefresher + prefillInputText 共用 + McpMarket 三方法 |
| `node scripts/check-token-effect.mjs`（工作区 + origin/main..HEAD 双跑） | 通过 |
| MainActivity.kt 纯 CRLF | 复验 CRLF=6077 / loneLF=0 |
| 风格硬规 | MarketPage.vue 新增代码写死色值=0（grep `#[0-9a-fA-F]{3,8}` 仅命中 UPG-17 既有 hot-scroll 遮罩 `#000`，非本卡代码）；色/字号/圆角/间距全部 var(--*) token |

## 四、Token / KV Cache 影响（AGENTS.md 硬规则 1）

- **Token 影响：不变**。market.localOverview 入 `uiOnlyMcpTools`——agent 工具面 tools 字段零新增；systemPrompt/装配链路未动；权限名单内容不出 PermissionGuard（前端只收 tier 字符串）。
- **KV Cache 影响：不变**。tools 字段与 system prompt 均无变动，请求前缀字节稳定。

## 五、遗留 / 风险申报

1. **obsidian 依赖 M3**：main@8a205d6 缺 obsidian 7 handler/捕获桥接线（修复在 feat/upg02 70db6c6 待设计师合入）。影响面：本地 tab obsidian 包**展示正常**（工具清单来自 Provider meta 注册处静态枚举），但「未授权 →」引导行点按的 `obsidian.vault.detect/register` 在 M3 合入前会桥返回 TOOL_NOT_FOUND，前端已 toast 降级；M3 合入后零改动即通（白名单已放行 obsidian.vault.）。
2. **卡外缺陷已挂账**：内置包（device-control/scene-12306/obsidian）market.disable 只落盘不摘除工具面（UPG-02+04 直挂 handler 无条件注册，unmountExtTools 按包 id 前缀匹配为空操作）——展示态≠可调面。UPG-23 红线「builtin 启停只走既有 setEnabled 支路」故未动，已登记挂账登记表 ⏳挂账待审。
3. **内置包启用态口径**：总览显示 enabled = market_builtin.json 显式停用才算停（默认在，如实反映直挂常驻的可调面）；与市场 store tab 的「安装=标识启用」语义（默认未装）存在口径差，已在 `McpMarket.builtinOn` 注释说明。
4. **browser-automation 不在总览**：该 builtin 包工具（mcp__browser__*）不归任何内置包前缀、也不是 store server——本地 tab 与气泡均不可见（main 既有行为，UPG-20 气泡同样不含）。
5. **L2 真机未验**：本地 tab 三层分组截图/停用→小按钮变淡/钉选→回填走查留验收员（5558）。机制面已由单测+源码锚覆盖。
6. **合并提示**：M3(70db6c6) 与本卡同改 MainActivity.kt（M3 在字段区/启动接线区/rebuildAgentTools，本卡在 chipsRow/ui.prefillInput/market 桥区/成员函数尾区），区域相邻不重叠，rebase 预期无冲突或浅冲突。
