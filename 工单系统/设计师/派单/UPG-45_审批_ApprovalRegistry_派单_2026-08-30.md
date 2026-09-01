# UPG-45 审批 · Approval Capability Registry（权限能力注册表）· 派单文本

> 出单人：设计师 ｜ 2026-08-30 ｜ 优先级 P0 ｜ 设计依据：`设计师\方案设计\审批弹窗_用户授权层_设计_v3_2026-08-30.md`（§五 Registry / §七 单 A）
> 定位：**把审批世界全量登记**——每一处会触发审批/拦截的工具,补全事实/语义/安全/策略字段,作为单 B(语义解释器+弹窗)的唯一输入。**B 直接复用本注册表,不再重新分析工具。**

## 交接基础信息
| 项 | 值 |
|---|---|
| 主仓库 | `C:\Users\Administrator\0027-mov` |
| 核心文件 | `app/src/main/kotlin/com/hermes/dsh/tools/McpToolScheduler.kt`（PermissionGuard 名单全集 :87-132）、`MainActivity.kt`（审批弹窗/触发点）|
| worktree | `mov-upg45` ｜ branch `feat/upg45`（基于最新 main）|
| 真机 | `adb -s emulator-5556`（包 `com.mov.android`）|

## 需求（全量登记 + 14+ 字段）

### 第一步：全量盘点（别漏）
列出**一切会触发审批/拦截的工具**，来源枚举（与 `PermissionGuard` 名单逐一对账，缺一不可）：
- `writeTools`(ask 主源) ∪ `sensitiveTools`(非默认模式) ∪ `isHighRisk`(shell.exec/凭据路径) ∪ 现有触发点（含 `market.install/uninstall/enable/disable`、`obsidian.*写` 等）。
- **用「每工具实际跑一次权限判定」**（可写一次性脚本调 `permissionTier/guard`）得出每工具的 `approvalMode = gate/ask/free`，**不信手抄**。

### 第二步：每工具登记注册表字段
| 组 | 字段 | 说明 |
|---|---|---|
| 标识 | `tool` | 技术工具名（规范名） |
| 语义 | `semanticType`(intent) / `action` / `target` / `scope` | 用户能懂的意图/动作/对象/范围 |
| 事实 | `argsSchema` | 参数结构（来自登记层/实测） |
| 安全 | `risk` / `reversibility` / `sensitiveData` | **三维分列不混**：risk=low/medium/high/critical；reversibility=high/low；sensitiveData=no/yes/potentially/financial |
| 边界 | `recipient` / `quantity` | 外发时接收方 / 批量时数量（发消息/支付/批量操作） |
| 策略 | `humanStrategy` | `人工(高频预置) / 模板(结构化) / AI(长尾) / 兜底` |
| 权限 | `approvalMode` | ask / gate / free（实测） |
| 兜底 | `fallback` | 无法解释时的用户文案（如 `⚠️ AI 请求执行一项系统操作 操作:<tool>`） |
| 策略 | `priority` | 高频优先级排序（决定谁必须人工预置） |
| 策略 | `audit` | 是否记录 |
| 策略 | `batchable` | 是否允许「同类自动同意」 |
| 版本 | `explanationVersion` / `semanticVersion` / `templateId` | 解释/语义/模板版本（审计可追踪） |

### 第三步：产出
- **一份注册表**（推荐 `docs/ApprovalRegistry.<md|json>`），每工具一行/一条，字段齐、可被 B 消费；
- **高频工具优先级排序**（`priority` 从高到低，决定 B 哪些必须人工预置）；
- 表头注明字段定义 + 版本。

## 红线（大神 P0 · 必守）
1. **解释失败不得影响权限判定**：`ExplanationGen=Fail` ≠ `PermissionGate=Fail`——注册表/后续解释器任何失败**只影响"怎么显示"**，绝不默认放宽/ALLOW/绕过权限；本单只登记事实，不做解释（解释是 B），故本单不得改动任何权限判定结果。
2. **AI 不决定安全分类**：本单可**记录 AI 建议**的 intent/action，但**安全分类(risk/approvalMode)由精确名单/校验得出**；未知工具 → 标「无法确定此操作」，**不得由 AI 认成危险程度**。
3. **unknown→安全默认**：凡无精确登记的工具，`approvalMode` 保守回 `ask`（可配置），`fallback`=「无法确定此操作」。
4. **不可逆操作**：`reversibility=low` 必须显式标注（删除/外发/支付），供 B 四块弹窗按 Impact 强调。
5. 只读登记，**不动** `McpToolScheduler`/`PermissionGuard` 判定逻辑、不动工具行为/签名。
6. 指标口径：`risk`/`reversibility`/`sensitiveData` 三维分列，不得合并成单一复杂字段。

## 验收
- **L1**：① 全量对账（注册表条目 ⊇ writeTools∪sensitiveTools∪highrisk，`git grep` + 实测 no 漏）；② 每工具 `approvalMode` 与实测 `permissionTier/guard` 一致（脚本断言，非手抄）；③ 字段完整（必填组非空）；④ 未知工具 → `ask`+「无法确定」兜底（变异：对未知工具给 `free`/让 AI 定危险 → 必红）；⑤ `reversibility=low` 工具全部标出（删除/外发/支付不漏）。
- **L2 真机**：抽样 3 工具（写文件/删缓存/发消息）确认真实触发审批 + 注册表 `approvalMode` 与真机弹窗一致。
- **L3**：与 UPG-01（元数据 desc=input）/ UPG-06（防编造）/ BP-03（权限门漏网加固）语义零冲突。
- **Token/KV**：0/0（本单纯登记，不涉运行时）。

## 派单后必须（规则 12）
1. 开工前 `git fetch origin` + 看表（确认 UPG-01 元数据/批3 已合 main，注册表基于最新基底）；
2. 工单表 UPG-45 备注追加 `认领: <agent> worktree=mov-upg45 branch=feat/upg45 @<时间>`；
3. 完成后登记两个表（先表后库）+ 报告落 `程序员\交付报告\DELIVERY_UPG45_*.md`，说明已登记两表，含 hash + 证据链（注册表文件 + 对账脚本输出 + 真机抽样截图）。
