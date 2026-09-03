# UPG-93 派单：MainActivity 拆分·阶段 1（工具注册面搬移 + 拆分蓝图落档）

> **派单时间**：2026-09-03 ｜ **派单人**：设计师B ｜ **优先级**：P1（架构债主线——架构图实证：7666 行/185 注册点一锅）
> **验收标准**：`STD-UPG-93-v1`（content_sha256=`5dfd1a3d190bff63d13da4ec0cfa226967537aee6805ad580674cc80b73e6b1f`）
> **已查坑位库/复用件库**：是。命中：坑 #2/#6（登记/测试纪律）；复用=UPG-79 拆分先例（approval/ 包：ApprovalSurface+ApprovalLogic 已拆出——本单同模式）
> **溯源实测**（@main fea2fae）：MainActivity.kt **7666 行 / 185 个 mcpHandlers 注册点**；区域图（行号锚）：工具注册（大头）/chips 气泡 :945/胶囊 :1352/模型管理 :2352/Memory OS :2671/页面桥 :2906/对话模式 :4352/预审单 :5317-5337/Markwon 视图 :6839-7028/市场总览 :7266
> **防撞**：本单动 MainActivity.kt 大头——**与 UPG-88/89 同面，须 88 已合（已合 43e5756）且 89 挂单中不并行**；与 86/90/92 零重叠

## 一、一句话

把上帝文件的第一大块拆出去：185 个工具注册+handler 实现搬入独立装配模块（`ToolsRegistry.kt`），MainActivity 只剩装配调用——**纯搬移零逻辑改动**，顺带产出全量拆分蓝图（后续分批有据）。

## 二、范围

1. **搬移**：185 个 `mcpHandlers[...]` 注册 + handler 实现 → 新模块（建议 `app/.../tools/ToolsRegistry.kt` 注册器模式：`fun registerAll(ctx: ToolDeps): MutableMap<String, Handler>` 或同等）；MainActivity 只留 `mcpHandlers = ToolsRegistry.registerAll(...)` 一行装配。**handler 体内代码原样搬**（只允许可见性/依赖注入的必要调整——禁顺手优化、禁改逻辑、禁改名）。
2. **蓝图落档**：`设计师\方案设计\MainActivity拆分蓝图_v1.md`——全量盘点（每区域行号+行数+依赖）+分批计划（建议序：①工具注册[本单] → ②市场面 → ③页面桥 → ④chips/胶囊 → ⑤Markwon 视图 → ⑥启动序列收尾），含新文件行尾约定。
3. **锚**：工具面全集计数+名单断言（185）；注册唯一写点静态锚；5 代表工具直呼契约（file.read/vault.get/shell.exec/market.status/tool.help）。

## 三、红线（违反=打回）

1. **纯搬移零逻辑改动**——diff 精读可见「移动+必要接线」，任何行为改动=打回；优化另单。
2. 审批/市场/页面桥/模式等其余面**本单一律不碰**（蓝图里排，不在这拆）。
3. 全量 0 失败基线不破；审批系/UPG-84/76/79 契约套件零回归。
4. Token/KV 两节申报（工具面不变 → 0/0）；MainActivity 纯 CRLF 保持。

## 四、测试与真机（STD-UPG-93-v1）

全量 0 失败 + 三变异锚亲杀 + 5 代表工具直呼契约 + 真机三场景（对话往返/写类审批卡/tool.help 直呼）。

## 五、交付

报告落 `程序员\交付报告\DELIVERY_UPG93_<日期>.md`（蓝图落盘+3 亲杀+全量+真机冒烟+「已登记两个表」）；sync 投影；verify-hash + manifest 自检双闸（红线 23）；DEL 绑定；共享面=工具装配面，附 coverage_status。
