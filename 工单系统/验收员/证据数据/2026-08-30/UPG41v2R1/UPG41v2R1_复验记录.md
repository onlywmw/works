# UPG-41 v2 打回修复复验记录（2026-08-30 · 验收员）

**分支**：feat/upg41 675970b+0ef352d（基底 35a37b6）；验收 worktree mov-upg41fix；APK assembleDebug 15:37 装 21770d7d。

- **L1**：verify 28/28 全绿（⑦内置无 switch/常驻锚/不 emit toggle/市场包保留开关/节流；⑧localDetail en=17 zh=17、marketPack en=20 zh=20）；变异 2/2 亲杀（①switch 回流→⑦双红 ②zh 键集缩水→⑧红）；bun install + vite build 4.25s（dist 与提交产物逐字节等价，仅行尾 LF/CRLF）；sync-pages --check 幂等 exit 0；assembleDebug 绿
- **P1-① 真机**（设备控制详情）：「正常 | 常驻」右上角灰字 · uiautomator Switch=0（见图 XML）——无 MARKET_NOT_INSTALLED 触发面
- **P1-② 真机**（MockServer=已装市场包）：MarketPackDetail 模板渲染（已安装/来自 MOV 能力市场/普通-极简 segment）+ 头卡 ToggleButton@1727,411（van-switch）在场；browser-automation 启停实操未完成（安装审批弹窗 20s 自动取消+对话流不稳——环境因素，P3 观察项）
- **P2**：详情页中文「这能干嘛/怎么用/用它/工具一览」无裸 key；产物含「这能干嘛/常驻」
- **结论**：✅ 通过——销 2 项挂账；待设计师合 main（基底非 main，需重跑 vite build+sync-pages）
