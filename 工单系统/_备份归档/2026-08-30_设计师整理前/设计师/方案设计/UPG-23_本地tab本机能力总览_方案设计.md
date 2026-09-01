# UPG-23 本地 tab「本机能力总览」+ 主页钉选小按钮 —— 方案设计 v1

- **出单人**：设计师 ｜ **日期**：2026-08-29 ｜ **优先级建议**：P1
- **Demo**：`设计师/方案设计/UPG-23_本地tab本机能力总览_demo.html`（v2，双机联动，用户已看并拍板「可以」@2026-08-29）
- **输入依赖**：UPG-02+04 合并单（内置包清单=本方案分组数据的来源；该单已验收通过待合 main）
- **溯源**：规则 21 六层复核已过，见 §二

## 一、背景与目标

用户点名：「mcp 工具市场的本地很关键，先做好」（2026-08-28）；随后确认定位=**本机能力总览**，并要求覆盖**主页输入框上方小按钮的显示**（2026-08-29）。

现状（实物）：本地 tab = `market.status`（server 级健康）+ `ui.getPins` 钉选 + 启停开关的裸骨架（MarketPage.vue:195-224）；UPG-02+04 合入后 20 个内置工具上线，但**用户在没有任何界面能看见这批能力**。主页 chips 排（UPG-20）只有模型/MCP 两个固定 chip，钉选没有出口。

目标：本地 tab 升级为「本机能力总览」（概览卡 + 钉选槽 + 三层分组 + 工具级下钻），主页 chips 排增加钉选小按钮（钉选的用户可感知出口），MCP chip 气泡升级为总览轻量投影。

## 二、六层溯源（实物锚，main @5170421 + feat/upg02 卡面）

| 层 | 实物 | 状态 |
|---|---|---|
| L1 用户可感知 | MarketPage.vue 双 tab（:5-9 van-tabs）、本地 tab 渲染段（:195-224）、钉选上限 5 前端把关（:146/157）；UPG-17 修3 已清 demo 种子（桥失败清空+错误态） | ✅ 在 |
| L2 数据读面 | `market.status`（McpMarket.kt:353-387）**只回 server 级**（serverId/reachable/toolCount/lastError）——无内置包、无工具清单；`bubbleOverview()`（:394-403）UPG-20 气泡数据面（已安装 server+mounted 工具名，零网络 UI 线程安全）；builtin 状态持久化 market_builtin.json（:115-143）；registry builtin 条目含 `builtinTools` 工具名清单（:103/:508） | ⚠️ 读面缺「总览聚合」——本单补 |
| L3 桥/白名单 | `market.status/list/refresh` 桥在（MainActivity.kt:2071-2107）；市场页白名单含 `market.status`（:1276）；`ui.getPins/setPins`（:2302-2326，SharedPreferences workbench_pins，WorkbenchPins 兜底截断 5，首读种子 3 内置） | ✅ 在，新增聚合读需挂桥+白名单 |
| L4 运行时装配 | 启停热挂三处同步（MainActivity.kt:4501）；builtin 启停走 `setEnabled` builtin 支路（McpMarket.kt:309-319） | ✅ 在 |
| L5 权限门 | writeTools/harmlessTools 名单（McpToolScheduler.kt:99-123），harmless 优先判定（:184-188）；**名单私有、无只读查询出口** | ⚠️ 需加单源访问器 |
| L6 数据源唯一 | pins=workbench_pins 单写点；包状态=store/market_builtin.json 单写点；工具元数据=各 ToolMeta/schema 注册处 | ✅ 方案不得造平行数据源 |

**关键缺口（本单要补的三件）**：①总览聚合读 API（包级→工具级下钻的数据从哪来：registry builtinTools + mounted + 静态系统组）；②权限级单源访问器（McpToolScheduler 加只读 `permissionTier(tool)`，**禁止前端抄名单**——敏感黑名单四处镜像 BP 前科）；③钉选在主页的渲染位（chipsRow 区，UPG-20 格局）。

## 三、设计（信息架构）

### 3.1 本地 tab = 本机能力总览（自上而下）

1. **概览卡**：工具总数 / 来源数 / 钉选占用 n/5 + 健康一句话（全正常=灰字「全部正常」；有异常=橙字「▲ N 个包不可达/未授权」）。
2. **钉选槽**：5 槽位可视化（满=图标+名，空=虚线＋），点满槽=取消钉选；文案改为「钉选 · 主页输入框小按钮 + 侧边栏槽」。
3. **三层分组**：
   - 内置（badge 黑底「内置」）：设备控制 / 生活场景·12306 / 笔记·Obsidian（UPG-02+04 合入后按 registry builtin 实列）；
   - 市场已安装（badge 蓝底「市场」）：server 包，带健康点（绿=启用且可达 / 红=不可达 / 灰=停用）；Obsidian 类 SAF 未授权时显示「未授权 →」引导行（决策点③）；
   - 系统基础能力（badge 灰底「系统」）：file/note/memory 组，**只展示不可关**（无开关）。
4. **工具级下钻**：包行点开 → 工具清单行（`工具名` 等宽胶囊 + 一句话说明 + 权限标记：绿字「免审批」/ 橙字「需确认」）。

### 3.2 主页输入框上方 · 钉选小按钮

- 位置：chips 排内，模型 chip、MCP chip 之后，**细分隔线**隔开；
- 形态：方形图标钮（图标+右上角健康小圆点），钉选几个出几个，横滑随 chips 排；
- 点按行为：**插入预设指令到输入框**（复用既有 ui. 输入框回填通路，:1273 白名单注释在案）——不直接调工具、不绕过审批（决策点②，建议此项）；
- 停用/不可达：小按钮变淡/红点，点按 toast 引导去本地 tab 启用。

### 3.3 MCP chip 气泡 = 总览轻量投影

`bubbleOverview()` 扩展：分组（内置/市场/系统）+ 工具数 + 启用/健康点；停用灰显。数据与本地 tab 同源（同一个聚合函数出两份投影：完整版给市场页、轻量版给气泡）。

## 四、数据面（新增/改动）

1. **新增 `market.localOverview()`**（McpMarket，只读聚合，零网络——健康沿用 status 缓存，不在读面做 healthCheck，对齐 bubbleOverview 的 UI 线程安全口径）：
   `groups: [{groupId: builtin|market|system, title, pkgs: [{id, name, desc, icon, badge, enabled, reachable, authorized, tools: [{name, desc, perm: free|ask}]}]}]` + `totals: {tools, sources, unhealthy}`。
   - 工具 desc 来源：既有 ToolMeta/schema 注册处（新工具登记时 desc 必填——UPG-01 三件套收口后天然满足，过渡期缺 desc 显示工具名兜底）；
   - 系统组静态表（file.read/write、note.create、memory.*）写在聚合层，标注 kind=system。
2. **新增权限级单源访问器**：`McpToolScheduler.permissionTier(tool): "free"|"ask"|"gate"`——复用 :184-188 同一判定顺序（harmless→write→else），只读。Vue 端只消费 tier 字符串，**任何名单内容不得进前端**。
3. **pins 复用** `workbench_pins`（ui.getPins/setPins 不动）；主页渲染侧 MainActivity 读同一 prefs（或走既有通路），单一写点。
4. **桥接线**：`market.localOverview` 挂 mcpHandlers + 市场页白名单（:1276 allowedPrefixes 加一条）+ toolParamSchemas 登记（:249 区）。

## 五、UI 规格（风格统一硬规——用户拍板「简约高级感、大小格式统一」）

1. **token 只用 Vant 变量**：色=`--primary/--primary-tint/--primary-text/--van-text-color-2/3`、`--van-background-2`；圆角=`--van-radius-md/lg`；字号=三级梯度 `van-font-size-md`（包名 600）/ `sm`（副文）/ 10-11px 级（工具行）；间距=`--van-padding-xs/sm/md`。**禁止写死色值/字号/圆角**（demo 里的 #1a1a1a 等仅为视觉效果稿，实现必须翻译成 token）。
2. **几何沿用现有件**：分组=`van-cell-group inset`（现有 :11 注释区同款）；开关=`van-switch` 尺寸；钉选星标=现有 pin-btn（:332-334）；概览卡圆角=radius-lg、深色=`--primary` 底。
3. **主页小按钮几何**：高度与现有 chip 行高对齐、间距 8px 同 chips gap、圆角取 chip 体系（方形钮圆角=radius-lg 比例），图标 16px 居中——与两个 118px pill chip 视觉重量平衡（demo 为参考比例，实现以现有 chipsRow 实测行高为准）。
4. **状态点**三态：绿=正常 / 橙=未授权或降级 / 红=不可达 / 灰=停用；直径 7px，全 App 同一套（与 UPG-20 气泡 .st 件一致）。
5. **动效克制**：展开/收起 ≤160ms 淡入位移；无弹性动画、无阴影堆叠。

## 六、红线

- L6：零平行数据源——pins/包状态/权限级全部单源（§四.2/3）；
- 不写死色值字号（§五.1）；不碰 room.html/markstream（冻结项）、不动 send()；
- 系统组不可关（防用户把 AI 基本功关了）；builtin 启停只走既有 `setEnabled` 支路，不新造持久化；
- Token/KV 申报：纯 UI/只读聚合层，两节申报「不变」（装配 systemPrompt 不动）。

## 七、决策点（✅ 用户拍板定案 @2026-08-29，全按建议）

1. **主页小按钮槽位**：与钉选 5 上限**共用**——单一心智「钉选 = 主页按钮 + 侧栏槽」；
2. **点按行为**：**插入预设指令到输入框**——可控、不绕审批、复用 ui. 输入框回填通路；
3. **SAF 未授权引导**：Obsidian 包未授权时显示「未授权 →」行，点击跳授权；
4. **预设指令内容**：每包一条默认指令（如 12306=「帮我查车票」），初版写死在聚合层，后续可配。

## 八、验收

- **L1**：全量单测绿 + 新增聚合纯函数测试（分组/计数/权限级映射/缺 desc 兜底）+ **变异锚**：M1 把 permissionTier 接到错误名单→权限标记断言红；M2 聚合层删掉内置分组→UI 数据断言红；M3 pins 截断 5 破坏→断言红；
- **L2** 真机：本地 tab 三层分组+展开+权限标记截图；停用设备包→主页小按钮变淡+MCP 气泡灰显；钉选→主页出现小按钮、点按回填输入框；
- **E 面**：用户路径「装一个市场包 → 本地 tab 看见 → 钉选 → 主页点小按钮 → 输入框出指令 → 发送」全程一遍过；
- **风格验收**：与现有市场页/chips 并排截图对比，token 抽查（grep 写死色值=0，van- 变量引用全覆盖）。

## 九、排期与串行

- **定稿输入**：UPG-02+04 合 main 后的内置包 registry 实列（分组数据以其为准）；方案设计不阻塞，可在其合并前先出卡施工数据面/聚合层。
- **串行区**：MainActivity chipsRow 区（与 UPG-20/21 相邻区段）——开工前确认无在途单占用；McpToolScheduler 名单区与 UPG-22 ③（writeTools 清理）邻接，谁先合谁占，后到者 rebase。
