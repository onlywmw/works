# UI 组件化改造 · 地基（方案 v2.1 · 2026-09-02）

**状态**：✅ 方案 v2.1 定稿（大神二轮评审：9.2/10 建议可开工；4 口子全部钉死）｜ 关联：UPG-50、UPG-70

> v2 → v2.1：采纳大神二轮 4 个工程契约口子 + 1 条施工原则（§0 评审记录）。v1/v2 已归档留指针；本文为唯一施工口径。

## 0 评审记录

### 一轮（大神外部评审 v1）
结论：务实方向正确，可作为 v1 地基落地；5 亮点肯定 + 5 补强 + 3 实施前置——**全部采纳**（v2）。

### 二轮（大神外部评审 v2）—— 9.2/10 建议进入实施
**亮点最扎实 5 点**：① A1 闭环完整（JSON→codegen→对账→pre-commit→CI diff + DO NOT EDIT 就是可验证单一事实源）②「本轮不建运行时」范围控制正确（病根 3=明确延期非遗漏）③ A2 先影响面评估后裁决=可审计变更决策 ④ A3 试点正确，建议升级红线「禁止一次迁 10 页」⑤ 验收锚已成「证明没倒退」（正/负/CI 三向）。

**采纳 4 个小口子（开工前钉死）+ 1 施工原则**：
1. **P1 ·「全等」定义**：业务字段集合及顺序语义一致 = `id / name / kind / prefix / variants / defaultVariant / site / order / provider / semanticType`；Kotlin 类型定义、Vue 导出包装形式、注释、import 路径=**生成表示差异，不算数据漂移**。
2. **P1 · order 唯一排序规则**：JSON 中 `order` 为唯一业务排序依据；**生成器不得按 id/name 自行重排**（防 Kotlin/Vue 顺序不一致=隐形双源）。
3. **P1 · 处置结果三态**：`改代码 | 改规范 | 暂不调整`——**暂不调整必须带原因**（防真实历史决策失真/被偷写成改规范）。
4. **P1 · A3 试点验收客观化**：SettingsSheet 试点输出「旧实现 vs PageHost 实现」5 项验证表（WebView 创建/AssetLoader/Bridge/Theme 注入/生命周期返回销毁）——可复用或明确差异点，生命周期无行为回归。
5. **施工原则（升级）**：**本卡解决「数据从哪里来」，不解决「数据本身是否正确」——先消灭双写，再治理内容**。A1 实施严禁顺手改组件名/variant/编号合理性（那是产品设计重构，另立单）。

## 1 定案记录

- 2026-09-02 用户：「展现呈现上面还是很垃圾」→ 先调研 GitHub 成熟方案，不得搜到就动手。
- 调研结论：Vant 4（移动端 Vue3 首选）/ Ark UI + UnoCSS + style-dictionary（深度可替换）/ shadcn-vue；**本地病根不是缺组件库**。
- 用户拍板：**先修地基**；Vant/Ark 后续阶段再引。大神两轮评审：v2.1 可开工。

## 2 病根（本地盘点证据）

1. **组件目录双份手写**：`UiComponentCatalog.kt`（Kotlin，20 条+52 档）与 `AppearanceApp.vue`（Vue COMPONENTS 数组）不同构、人肉同步——无单一 JSON schema 源。
2. **形态类定义分散**：tokens.css（12 族）/ SettingsPage.vue scoped（SETTINGS 族）/ VaultPage、ModelPage、ChatPage 等**完全写死**未接入编号体系。
3. **无组件运行时**：`<prefix>-<variant>` 只是 class 字符串约定。**→ 明确延期项**（本轮不建设；另行立卡）。
4. **10 页面入口割裂**：每页独立 html + 重复 WebViewAssetLoader/Bridge/主题注入，无统一页面宿主。
5. **规范与实现漂移**：`MOV设计规范_v2` 记 `--primary:#0E7C5B`，tokens.css 实际 `#23272F`；暗色 s0-s3、Motion/z/elevation/inset token 规范有、代码无。

## 3 改造范围（地基）

### 明确边界
- **本轮不建设组件运行时/注册机制**（病根 3 明确延期，另行立卡）；只统一**目录**与**形态层**。
- **施工原则**：本卡解决「数据从哪里来」，不解决「数据本身是否正确」——A1 严禁顺手改组件名/variant/编号（另立单）。

### A1 目录单一数据源（本单核心）
- 建 `前端设计/mov-vue/src/catalog/ui-components.json`：
  - 字段：`version / id / name / kind / prefix / variants[{id,label,state}] / defaultVariant / site / order / provider / semanticType`（version+字段注释；semanticType/provider=现有目录元数据，不新增半截运行时字段）。
  - **`order`=唯一业务排序依据；生成器不得按 id/name 自行重排**。
- 生成脚本 `scripts/gen-ui-catalog.mjs` 输出：
  1. `UiComponentCatalog.kt`（CatalogEntry/ComponentVariant/ComponentSpec + 20 编号常量 + components 列表）
  2. `AppearanceApp.vue` 的 `COMPONENTS` 数组段
  3. 对账断言——**「全等」判定标准**：业务字段集合及顺序语义一致（id/name/kind/prefix/variants/defaultVariant/site/order/provider/semanticType）；Kotlin 类型定义/Vue 导出包装/注释/import 路径=生成表示差异，**不算数据漂移**。
- **防漂移三层**：
  1. 生成物文件头 `// AUTO-GENERATED from ui-components.json. DO NOT EDIT.`（断言检查）
  2. pre-commit 钩子跑生成+对账
  3. CI 步骤：`npm run gen-ui-catalog && git diff --exit-code`
- 双写归零：Kotlin source 引用生成物；Vue import 生成物。

### A2 形态类归层 + 规范对齐（先评估后动）
- SETTINGS 族形态类从 SettingsPage.vue scoped 迁入 tokens.css 形态层。
- **规范对齐前置影响面评估**：影响面清单（消费待对齐 token 页面/组件+视觉差异）→ **用户裁决**，**处置结果三态 = 改代码 | 改规范 | 暂不调整（必须带原因）**：
  - 改代码=明确视觉回归风险+回归测试；改规范=以实物定标；暂不调整=不动作但记录原因（防历史决策失真）。
- Motion/z/elevation/inset token：落库或从规范删除（按实际使用裁决）。
- 产出 `tools/ui-catalog-audit.mjs`（未接入页面清册）+ 对账表（**漂移项/处置结果（三态+原因）/影响面**）。

### A3 统一页面宿主（B 阶段：试点先行，拆小单）
- **红线：禁止一次迁 10 页。**
- 先 SettingsSheet 做 PageHost 试点（WebView+AssetLoader+Bridge+主题注入+生命周期）。
- **试点验收客观标准（旧实现 vs PageHost 实现）**：

| 验证项 | 必须结果 |
|---|---|
| WebView 创建 | 可复用 |
| AssetLoader | 可复用 |
| Bridge | 可复用 |
| Theme 注入 | 可复用或明确差异点 |
| 生命周期/返回销毁 | 无行为回归 |

- 试点结论文档产出 → 通过才拆多小单逐步替换。

## 4 不做（本轮）

- 不引 Vant / Ark / UnoCSS（下一阶段另议）。
- 不建设组件运行时/注册机制（后续阶段）。
- 不改组件视觉本身（A2 token 对齐例外——须先影响面评估+用户裁决三态）。
- **不改 20 条编号/52 档数据**（只改来源；内容治理另立单）。

## 5 验收锚（v2.1 更新）

- A1-1：唯一目录源（grep 断言无第二份目录数据）。
- A1-2：改 schema → 重新生成 → Kotlin+Vue 同步（端到端实证；按「全等=业务字段一致」判定）。
- A1-3：手改生成物 → 断言红（亲杀）。
- A1-4：CI `gen-ui-catalog && git diff --exit-code` 通过（证据落交付报告）。
- A1-5：**order 一致性**——生成物顺序与 JSON order 完全一致（无 id/name 重排）。
- A2-1：SETTINGS 形态类在 tokens.css、scoped 无残留。
- A2-2：影响面清单（消费待对齐 token 页面/组件+差异说明）。
- A2-3：对账表三态（漂移项/处置结果[改代码|改规范|暂不调整+原因]/影响面）。
- A3-0：PageHost 试点结论（5 项验证表全过或差异点明确）——通过才拆小单。

## 6 关联

- UPG-50：组件库主线（阶段 1 验收通过、阶段 2 已派）——本卡为架构地基，不替代阶段 2。
- 后续：地基完成后评估 Vant 4/Ark 接入（新方案另立）。
