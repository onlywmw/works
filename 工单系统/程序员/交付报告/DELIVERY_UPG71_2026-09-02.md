# DELIVERY UPG-71 · 元能力注册表 · 地基（MVP 资产 + Schema + 校验脚本）

> 程序员（AI）｜ 2026-09-02 ｜ 分支 `feat/upg71`（worktree `mov-upg71`，基底 `main 667cc80`）｜ commit `43fd00a`（本地，未合 main）
> 设计：`C:\Users\Administrator\Desktop\MOV_元能力注册表_架构设计稿.md`（v0.3，评审 R2 有条件冻结 8.8）｜ 样例基准：`C:\Users\Administrator\Desktop\MOV_元能力注册表_MVP示例.json`｜ 派单：`设计师\派单\UPG-71_元能力注册表地基_派单_2026-09-02.md`
> **已登记两个表**（工单表.xlsx + 工单库.md，先表后库；工单表经 sync-orders.mjs 单向生成，diff=0 / 58 卡）

## 一、交付物（3 文件 / +482，纯新增）

| 产物 | 路径 | blob sha（git hash-object） |
|---|---|---|
| 正式资产（机器消费） | `docs/capability-registry/capability-registry.json` | `9e00a3d29d5b5a6b6a0b0c2f5447872ea3e56cde` |
| JSON Schema（draft-07） | `docs/capability-registry/capability-registry.schema.json` | `0c98d802aed1eda1bb217b53f662ce02a351faef` |
| 校验脚本 | `scripts/check-capability-registry.mjs` | `3213239844c18c21c8b7ff8af107605a4d690965` |

commit：`43fd00a241088e1c3db114d966459a9c021980fe`

## 二、资产要点（照派单 / 样例基准迁移）

- **4 条 MVP**：`fulfill.dispatch`(WRITE/EXTERNAL/registered)、`fulfill.track`(READ/EXTERNAL/registered)、`settle.pay`(MONEY/EXTERNAL/registered)、`sense.capture`(WRITE/LOCAL/**candidate**，独立消费者 1)。
- **字段**=id/name/semantics/domain/side_effect/env/idempotent/in/out/state/owner/evidence/consumers/impls；meta + enums + domains 结构照样例。
- **清占位**：`{样例占位}` 全清——owner=`MOV 作者 wmw0027`，evidence=`UPG-71 立项·架构稿 v0.3 冻结 @2026-09-02`（consumers[].acceptance_record 同源，不留 `{样例}` 假验收号）。
- **禁编造 impl**：样例自营/合作 impl（mov.dispatch.v1 / taxi.partner-shanghai 等）无可核实实现方（零运行时接线）→ 一律 **空数组** + note=`待外部/自营接入(接线单补)`；sense.capture 保留 candidate 驻留说明。
- **语义契约与样例一致**：semantics/in/out 未擅改。

## 三、Schema 要点

- JSON Schema **draft-07**：枚举 side_effect/env/consumer_type/state、required、结构、in/out 必填键 ⊆ properties、id pattern（`域.动词` 两段）、域 state open/closed。
- **机器可读晋升规则** `x_promotion_rule`：`count_by=domain_context`（去重计数）、registered_min_distinct=2、candidate_min_distinct=1 —— 校验脚本依此驱动，改规则只改 schema。
- **跨行一致性清单** `x_consistency`：capability.domain ∈ domains[].id、meta.open_domains ⊆ open 域、id 唯一、required ⊆ properties、registered 独立计数、占位纪律、impls 空→note——draft-07 无法表达的兄弟数组引用由脚本逐条机检。

## 四、验证证据（实测输出）

- **L1①**：`node scripts/check-capability-registry.mjs` → `通过（schema 0 错 / 跨行一致 / 晋升计数达标 / 枚举不越界 / 无占位残留）`
  ```
  能力数 4（registered 3 / candidate 1 / deprecated 0 / removed 0）
  副作用分布 WRITE 2 / READ 1 / MONEY 1
  环境分布 EXTERNAL 3 / LOCAL 1
    fulfill.dispatch  [registered]  WRITE/EXTERNAL  独立 2  impls 0
    fulfill.track     [registered]  READ/EXTERNAL   独立 2  impls 0
    settle.pay        [registered]  MONEY/EXTERNAL  独立 2  impls 0
    sense.capture     [candidate]   WRITE/LOCAL     独立 1  impls 0
  ```
- **L1② 变异亲杀 4/4 全红**（篡改临时副本，非正式资产）：
  1. 枚举越界（side_effect→DELETE）→ ✗ `不在枚举内`
  2. registered 独立消费者减到 1 → ✗ `state=registered 但独立消费者=1 < 2 —— 不满足晋升判据`
  3. 删必填 state → ✗ `缺少必填字段`
  4. 塞回 `{样例占位}` → ✗ `禁占位残留：发现样例、占位`
- **L1③ 全量**：`assembleDebug` **BUILD SUCCESSFUL**；`testDebugUnitTest` 683 完成 **2 failed 1 skipped**——2 失败 = `AppearanceContractTest`（选择页禁写死字号 / 预览卡 pointer-events:none）为 **main@667cc80 基线预存**（UPG-70 已登记；本单在全新 worktree 于 main 检出即复现，零 UPG-71 代码参与；红线禁改外观收拢版故未修，待设计师裁决）。本单纯新增静态资产+脚本，不参与测试类 → 未引入任何新失败。
- **L1④**：`node scripts/check-token-effect.mjs` → 通过（exit=0）。
- **L1⑤ 零冲突**：`git status` 仅 2 新增项（目录 + 脚本）——**未动** `docs/ApprovalRegistry*`、`tool-orch/src`、`MainActivity.kt`（红线 1 全守）。

## 五、Token / KV Cache 影响（AGENTS.md 硬规则 1）

- **Token 影响**：0/0——纯新增静态资产 + 校验脚本，无任何请求链路改动（AgentLoop/LlmClient/Session/MCP tools/system prompt 零接触）。
- **KV Cache 影响**：0/0——请求前缀字节恒定，无会话历史投影/压缩/折叠；AI 面 tools/system prompt 会话中途不变。

## 六、L2 / L3（留给验收员）

- **L2 真机**：如实标「装配级」——assembleDebug APK 正常 + 校验命令输出实证（本单无 UI/运行时接线）；行为级（LLM 查表接线、bundle/job 落代码）真机验收留接线单。
- **L3**：与 UPG-01 元数据 / UPG-45 ApprovalRegistry（工具级）/ UPG-46+67 tool-orch（工具编排）**语义零冲突**——业务语义粒度独立地基，纯新增、无引用、未清改。
