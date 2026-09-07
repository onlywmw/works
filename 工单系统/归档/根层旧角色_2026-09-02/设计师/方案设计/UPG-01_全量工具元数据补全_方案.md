# UPG-01 全量工具元数据补全（description / inputSchema / output 三件套）· 方案设计

> 设计人：设计师 ｜ 日期：2026-08-26 ｜ 状态：✅ 方案完成，待派单
> 依据：dsh 参考实现的工具元数据契约形态 + MOV 现状实测

---

## 一、背景与问题

MOV 的工具面 = **内置工具**（`app/src/main/kotlin/com/hermes/mov/tools/BuiltinMcpTools.kt`）+ **browser 工具族**（`app/src/main/kotlin/com/hermes/mov/browser/BrowserMcpTools.kt`）+ **桥/宿主面**（`app/src/main/kotlin/com/hermes/dsh/tools/Tools.kt`）+ 注册 MCP（能力市场安装的 server→tools）。

**现状实测（2026-08-26，真实文件核实）**：

| 文件 | description 条数 | 问题 |
|---|---|---|
| `BuiltinMcpTools.kt` | 5 条 | 仅文件读/写/日期/回显等少数工具有描述，内置工具未全覆盖 |
| `BrowserMcpTools.kt` | **0 条** | browser 工具族**无任何 description** |
| `dsh/tools/Tools.kt` | **0 条** | 桥/宿主面工具**无任何 description** |

**影响**：AI 引导层（Agent 决策）看不到工具用途与参数含义 → 错误调用 / 反复试探；用户看不到能力详情 → 市场体验的「能力描述」缺位。dsh 参考实现中每个工具都有**真描述 + 完整 schema + 明确返回结构**，此为契约收口的对标线。

## 二、目标

让 MOV 每个可调用工具登记**三件套**：

1. **description**：一句话中文真描述（该工具干什么、适合什么场景、限制（如沙盒/只读））
2. **inputSchema**：完整参数声明，**每个字段有中文 description**（字段语义必须来自源码用法核实，禁止编造）
3. **output 声明**：一句话返回结构 + 关键错误码/异常语义

## 三、方案（拆四批）

| 批次 | 范围 | 内容 |
|---|---|---|
| 批 1 内置工具 | `BuiltinMcpTools.kt` | 保留现有 5 条优质描述；补齐其余内置工具；补全 schema 字段中文说明 |
| 批 2 browser | `BrowserMcpTools.kt` | 0→全量：每个 browser 工具补真描述 + schema + 输出声明 |
| 批 3 桥/宿主面 | `dsh/tools/Tools.kt` | 0→全量：同上 |
| 批 4 MCP 面锚点 | 注册 MCP / `McpServer` 契约 | 只加元数据字段（描述/输出锚），**不改方法签名**（架构不变量） |

施工口径（通用）：
- 新增一个**元数据登记层**（如 `ToolMeta` 表/常量），与工具定义解耦，便于统一测试与未来市场展示复用；
- 字段语义**逐字段查来源**（input 参数名 ↔ 工具内取值/校验代码），写「来自 `xxx.kt:行` 取值」注释；
- 描述风格：中文短句、用户视角、上限 80 字；不得出现「占位」「待补充」「xxx」字样。

## 四、验收标准（L1/L2/L3）

**L1 全量绿 + 变异亲杀**：
- 新增单测 `ToolMetaTest`：遍历全部工具注册 → 断言
  - 每工具 `description` 非空、长度 ≥ 20、不含「占位/待补充/xxx」；
  - inputSchema 每个字段均有非空中文 `description`；
  - output 声明字段存在（非空）。
- 变异亲杀：把任一工具 description 改回占位串 → 单测必红（改回修复）。

**L2 真机**：`emulator-5556` 安装构建产物 → 能力/工具详情面逐工具显示真描述 + 参数中文说明 + 返回说明（截图证据链入 `docs/ACCEPTANCE_LOG.md`）。

**L3 AI 侧实证**：MOV 内 AI（弱模型）对工具发起调用，journal 中可见 AI 读取描述后正确选参（真实数据形态；**禁用假覆盖**——不得构造仅满足单测的假描述）。

## 五、红线

1. **不改工具行为/调用签名**：只补元数据；`McpServer` 方法签名不可变（架构不变量）。
2. **描述必须真实**：拿不准的字段语义标「待核实」并登记 `处理中心\挂账登记表.md`，禁止编造。
3. **不破坏现有 5 条已验收描述**（读/写/日期/回显等），只增不改（除非发现事实性错误）。

## 六、交付要求（README 12 条）

- 完成后**登记两个表**：`工单表.xlsx`（程序员列 ✅完成 + 备注分支/hash/报告名）+ `工单库.md`（状态快照同步，**先表后库**）；
- 交付报告/汇报中说明「已登记入表」；
- 交付报告落点：`程序员\交付报告\`（文件名 `DELIVERY_UPG01_*.md`）。
