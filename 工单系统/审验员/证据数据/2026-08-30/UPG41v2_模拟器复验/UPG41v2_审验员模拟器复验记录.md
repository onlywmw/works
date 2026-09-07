# UPG-41 v2 打回修复复验 · 审验员模拟器复验记录（2026-08-30）

**环境**：AVD MOV_Test（emulator-5554，x86_64 / 1080x2400 / android-36）；APK `mov-upg41fix/app/build/outputs/apk/debug/app-debug.apk`（55,384,905 B，15:37）已装 Success。审验按用户指令「用虚拟机不用真机」执行，全部证据来自模拟器。

**复验对象**（验收员报告：✅通过销两项挂账，`，查验`）：
- P1-① 设备控制详情「正常|常驻」无 Switch（MARKET_NOT_INSTALLED 触发面消除）
- P1-② MockServer=已装市场包 MarketPackDetail 模板渲染 + 头卡 ToggleButton 在场
- P2 zh.js 全量 key（localDetail/marketPack）

---

## 前置：登录态注入（模拟器无真实手机号，注入本地 token 直达主界面）

- 写 `mov_login.xml`（token=audit-mock-token）→ run-as 拷入 shared_prefs → 重启免登直达 MainActivity
- 同意隐私协议 → 允许通知 → MainActivity → MCP 工具 chip → 打开工具市场

## P1-① 设备控制详情（内置包 · 常驻不可关）

CDP（市场页 WebView）实测详情页：
- 状态点 `st-dot ok` + 健康文本「正常」；右上角「常驻」
- **`hasSwitch: false`（DOM 无 van-switch）**
- uiautomator dump：`Switch: []` `ToggleButton: []` `CheckBox: []`——原生层零开关
- 模板区：这能干嘛 / 怎么用 / 用它 / 工具一览 / 权限分布（免审批 4 · 需确认 9 · 拦截 0），13 工具
- 截图 `模拟器_设备控制详情_P1①_20260830_082211.png`

**结论：✅ P1-① 复验通过**——「正常|常驻」在场且无任何 Switch/ToggleButton，与验收证据「设备控制详情_常驻无Switch.xml」一致，无 MARKET_NOT_INSTALLED 触发面。

## P1-② MockServer 市场包详情（已安装态）

场景复现：写入 `mcp_config.xml` 的 `mcp_servers` 一条 origin=market 的 MockServer 记录 → 「市场已安装」区出现 MockServer → 进详情：

- 头卡：📦 MockServer + 「已安装」徽标 + 「来自 MOV 能力市场 · 0 个工具」+ 状态「不可达」（mock URL https://mow.kim/mock/mcp 不存在——环境差异，验收 MockServer 可达显「正常」）
- segment：「普通模式主页 | 极简模式主页」+ 主页预览（你好，我是 MOV / ⚡标准 MockServer / 说点什么…）+ 引导行 + 怎么用「帮我使用「MockServer」」+ 用它 + 关于 · MockServer + 卸载
- **头卡 ToggleButton：`van-switch--on` role=switch ariaChecked=true，位置 x=388/412≈0.94（头卡右上角，与验收 ToggleButton@[1727,411] 语义一致）**
- switch 可操作（CDP Input.dispatchMouseEvent 真实点击）：
  - 点击 → toast「已停用 MockServer」→ store `enabled:false` 持久化（mcp_config 快照）
  - 再点 → toast「操作失败: MARKET_SERVER_UNREACHABLE: 服务器健康检查失败: https://mow.kim/mock/mcp」（enable 需 discover，mock URL 不可达）→ **但 store 已先写 `enabled:true`**
- 截图 `模拟器_MockServer详情_P1②_20260830_082121.png`

**结论：✅ P1-② 复验通过**——MarketPackDetail 模板完整渲染（已安装/来自 MOV 能力市场/普通-极简 segment）+ 头卡 ToggleButton 在场且可点击触发启停（disable 成功落库）。

## P2 zh.js 键集（独立核对，非复跑脚本）

python 独立解析 mov-vue/src/i18n/zh.js + en.js：
- `localDetail`：en=17 zh=17，键集差集 ∅（alwaysOn/howToUse/useIt/whatFor/permDist/toolList/healthOk…）
- `marketPack`：en=20 zh=20，键集差集 ∅（installed/fromMarket/homeNorm/homeMini/homeHero/about/source/uninstall…）
- 真机渲染互证：模拟器详情页 innerText 直接显示「这能干嘛/怎么用/用它/工具一览/权限分布」等中文——无裸 key

**结论：✅ P2 复验通过**（源码键集 + 真机渲染双证据）。

## L1 verify 复跑（本会话前段已完成）

`node scripts/upg41-verify.mjs` 复跑全绿，EXIT=0（28 项）；变异锚逻辑核对：⑦「内置详情无 switch/常驻锚/不 emit toggle/市场包保留开关」可捕获「switch 回流」；⑧「zh/en 键集一致」可捕获「键集缩水」。

---

## 挑毛病（已登记问题区，不阻塞本单打回项复验结论）

1. **市场包详情开关切换后 UI 状态不即时同步**（disable 场景实测）：`MarketPackDetail.vue` toggle→`onTogglePkg→ue()` 调 `market.disable` 后仅 toast+刷新总览，**未更新本地 `pkg.enabled`** → switch aria-checked 保持 on，store 已 false；退出详情重进才显示正确（重进实测 off + 健康「已停用」）。影响：用户切换后界面误导（显示开实际停）。
2. **enable 时服务器不可达：store 先写 true 但 toast 操作失败**：`McpMarket.setEnabled` 先 `store.setEnabled(true)` 再 discover，discover 抛 MARKET_SERVER_UNREACHABLE 后 catch 返回 ok=false **不回滚 store** → 用户见「操作失败」实际已启用（store true）。状态不一致。

两条均非本单打回项范围（打回项=P1 分流无 Switch + P2 键集，均已坐实），属市场包启停交互既有行为，登记问题区由设计师裁定是否出单。
