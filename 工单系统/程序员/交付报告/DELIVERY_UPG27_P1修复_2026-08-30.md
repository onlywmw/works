# UPG-27 P1 修复派单回执：P1 证伪（未实施修复，附证据）——2026-08-30

- 执行人：程序员 C
- 分支：feat/upg27（rebase origin/main e9aa7bc 干净；4 commit 39 6d7acd7/7fd3971/f86906c/…）
- 派单：fix(UPG-27 P1 点号/下划线错位)——根因引「McpToolScheduler :277 handlers 键=下划线→点号双 miss」

## 结论：**P1 不成立（误报），未改一行生产代码**

判定依据（三条独立证据链，全部可复现）：

### 1. journal 时间线对照（决定性）——12 次塌缩全部发生在 native 面
真机 room-1788071604100-70fd session.jsonl 三个 TOOL_COLLAPSED 样本（seq 8053/12180/13629）逐回合提取 `request/header` system：

| 塌缩样本 | 所在回合 req（line） | 该回合 system 首句 |
|---|---|---|
| seq 8053（time 1788078061315） | line 730 | `当前工具面模式：native。` |
| seq 12180（time 1788078115645） | line 845 | `当前工具面模式：native。` |
| seq 13629（time 1788078169728） | line 1007 | `当前工具面模式：native。` |

→ **12 次塌缩是「native 面下调用 shell.exec 的正确三分语义塌缩」**（shell.exec 不在 native 直呼面=应当塌缩）；序列带 AI 自纠（审计已闭环：AI 转 search 真执行）。**code 回合（seq3956，system=「当前工具面模式：code」）内无任何点号直呼塌缩样本**。

### 2. 机制澄清（源码事实）——handlers 键=点号，从未「双 miss」
- `MainActivity.kt:3629`：`agentToolScheduler = McpToolScheduler(mcpHandlers, …)` —— **handlers=mcpHandlers（点号键）**
- `MainActivity.kt:3631`：`knownTools = mcpHandlers.keys` —— **known=点号键**
- `MainActivity.kt:6581`：`allowedTools = filtered.toSet()` —— filtered 源自 `mcpHandlers.keys.filter { it in codeTools }`（codeTools=`setOf("shell.exec","tool.help")` 点号）→ **allowed=点号键**
- `McpToolScheduler.kt:283`：`name = exec.name.replace('_', '.')` —— 下划线调用名统一归一为点号后查点号键表 → **下划线/点号两形态都命中**
- LLM 层 `DeepSeekAdapter.kt:360` / `OpenAiCompatAdapter.kt:421` `sanitizeToolName = name.replace('.', '_')` 只作用于 **schema 展示**（API function 名不允许点号）；模型回传的调用名进入 `ToolCalls.kt:92` exec.name 后即被 :283 归一

→ 派单根因「handlers 键=下划线」与实现不符（真实=点号键）。

### 3. JVM 生产同构实验（行为锁定）
新建 `SchedulerDotNameBehaviorTest`（handlers 点号键 + allowed/known 点号键，与 MainActivity 生产形态逐项同构）：
- 点号直呼 `shell.exec` → **非 TOOL_COLLAPSED**（抵达权限门=allowed+handler 查找通过）
- 下划线直呼 `shell_exec` → **非 TOOL_COLLAPSED**
- native 面（allowed=仅 obsidian）→ **TOOL_COLLAPSED**（三分语义保留，行为正确）

全量 L1：**61 类 443/0/0**（含新增 1 用例）。

## 为何此前复验两次「证实」了 P1 —— 误报链路如实交代
- 我初次 L2 复验把「journal 见 TOOL_COLLAPSED×12」归因「点号直呼塌缩」（当时未逐回合验证模式；12 次多为 native 面正确塌缩+AI 混名调用）
- 验收员基于该归因独立核对（他们当时验证的是「次数/下划线成功×45」事实，但未验证塌缩回合的 mode=code）→ P1 判定成立
- **本次修正**：逐回合 mode 对照后 P1 证据不成立；code 回合（170 帧 seq3956 起）内点号直呼样本=0，且 JVM 同构证明点号路径畅通

## 处置与建议
1. **挂账「挂账-upg27-sdk工具名点号下划线错位」建议撤销**（误报；依据=本报告§1-3）
2. **真实观察（P3，可选）**：SDK/system 节工具名=点号 vs AI schema 名（sanitize）=下划线——AI 双形态混用属实，但**双向兼容无功能缺陷**；若用户体验导向可把 SDK 节「可直呼」行改为下划线（与 schema 一致，减少 AI 按文字拼点号的尝试）——非必需，等出单人定夺
3. **行为锁定测试保留**（SchedulerDotNameBehaviorTest：「点号/下划线直呼均不塌缩+塌缩保留」）——防形态回归；**生产代码零改动**（token 0/0，KV 0/0）
4. **P2（顶部钮 tap 无响应）**：属上一复验发现的独立 P2，未在本次施工范围（本报告未动 UI）

**待出单人裁决**：撤销 P1 挂账 / 是否转「SDK 节点号一致性 P3 观察」/ 是否对 P2 另派单。
