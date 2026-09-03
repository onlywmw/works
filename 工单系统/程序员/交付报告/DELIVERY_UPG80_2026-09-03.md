# DELIVERY_UPG80_2026-09-03：AI 对话链路诊断修复（模拟器 DeepSeek 链路）+ UPG-76 L3 四场景联动补验

> **工单**：UPG-80 ｜ **验收标准**：STD-UPG-80-v1（content_sha256=`d666e636a0c32eee9ab39d17f828fcce41be691644145e38ed18ad63b223cd96`）
> **执行**：wmw0027 ｜ **日期**：2026-09-03 ｜ **验证环境**：emulator-5554（app 包 `com.mov.android`，feat/upg76@6dd9161 APK）
> **时间戳口径**：logcat 用设备 GMT（=主机 CST+8h）；截图/操作用主机时间；文中两者并存标注

---

## 一、结论速览

| 项 | 结论 |
|---|---|
| A1 诊断 | 模拟器 AI 对话链路**健康**：key 注入成功 → 请求发出 → 网络可达 → 流式响应到达 → AI 回复落地（logcat `request/header → chunk×65 → assistant`） |
| A2 修复判定 | **零代码改动**（纯环境/配置面，链路无代码缺陷） |
| A3 UPG-76 L3 补验 | 场景① ✅ 全链实证；场景③ ✅（次数耗尽分支实证，EXPIRED 由 JVM 定向测试覆盖）；场景② ⛔ 环境阻塞（payment.pay 无 handler，TOOL_NOT_FOUND 实证）；场景④ ✅（沿用 s4 实证） |
| 补验新发现 | ① `MainActivity.kt:5543` `removeAll{it.tool==info.toolName}` 疑似误删同工具多步（多文件批量写=同工具名，清单被砍至 1 步）——代码确定性，建议登记核实；② payment MCP 未接模拟器（场景②环境阻塞根因） |
| Token / KV Cache | 0 / 0（零代码改动，本单无增量） |

---

## 二、A1 诊断：模拟器 AI 对话链路（证据）

**方法**：emulator-5554 发起真实对话，抓全链路 logcat。证据文件：`桌面\MOV调试\upg80\logcat_a1_hello.txt`、`logcat_a1_sent.txt`、`logcat_multi.txt`。

**链路证据行**（打码后）：

```
MOV-Chat: [日志 112 事件] ... step/start → user → request/header → chunk×65 → assistant → step/end → turn/end
```

- **request/header** = DeepSeekAdapter 请求已发出（HTTP 请求头）
- **chunk×65 → assistant** = 流式响应 65 chunk 到达、AI 回复生成落地
- 回复内容实证（对话面 UI dump）：模型对正常对话有实质回复；对写类操作触发审批弹窗（见 A3），**未点同意则 20s 超时中止**——此即历史挂账「模拟器 AI 未回复」的根因方向（审批弹窗未确认/环境缺 key 的历史状态），本次在 key 注入正常 + 弹窗确认后**往返成功**。

**结论**：链路健康，无代码缺陷 → A2 **零代码改动**。

---

## 三、A3 UPG-76 L3 四场景补验证据（STD-UPG-76-v2 测试匹配档）

> 证据目录：`桌面\MOV调试\upg80\a3\`。四场景均在 feat/upg76@6dd9161 APK 上执行。

### 场景① 多步骤请求 → 一张预审单 → 部分勾选批准 → 已批跑通 / 未批阻断 / 执行中计划外弹窗 —— ✅ 全链实证

**3.1 预审单出现（≥2 审批级步骤 → 一张单）**

请求（新会话，ASCII 注入）：写 1 个 obsidian 文件 + 扫 1 次 vault。
证据：`cb4e/ps.png`、`cb4e/ps_raw.xml`、`cb4e/ps_nodes.txt`（预审单 UI dump）：

```
(540,867) 预审单 · 批量审批
以上请求包含 2 个需确认步骤——勾选=放行该步；未勾=该步不执行（阻断下游…）
(498,1153) 📄 写入文件（obsidian.file.write）   参数：path=upg80_p5.md…
(498,1328) 🔄 扫描你的 Obsidian 仓库（obsidian.vault.rescan） （无参数）
[CheckBox x2 @932,1153 / 932,1328]  checked=true ×2
(552,1537) 全部拒绝  |  (817,1537) 批准勾选的步骤
```

→ **≥2 写类步骤出单门槛成立，单张审批单含步骤清单+参数摘要+逐行勾选+批量按钮**。

**3.2 部分勾选批准（只批 write，拒 rescan）→ 已批跑通 / 未批阻断**

`cb4g/`（重启 app 后干净 session 重测，消除 turn 豁免残留）：
- 预审单 2 行默认勾选 → 取消第 2 行（rescan）勾选 → 点「批准勾选的步骤」
- logcat（PID 12513，设备时间）：
```
01:03:39.802 UPG76   : 预审单已落簿: group=plan-405c6251 批准=1 / 拒绝=1（执行期绑定裁决）
01:03:39.803 ApprovalService: 预审单绑定命中: obsidian.file.write
01:03:41.657 ApprovalService: 预审单已决否（阻断下游）: obsidian.vault.rescan
```
- 模型最终汇报（cb4g/poll.log obs1）：
```
Write succeeded (upg80_f2.md, 21 chars), but vault.rescan was denied by approval, so the scan didn't run.
```

→ **批准=1/拒绝=1 落簿 → write 绑定命中执行成功、rescan 已决否=阻断下游未执行**。STD「部分批准 → 已批跑通、未批 blocked 阻断」精确成立。

**3.3 执行中计划外调用 → 弹新审批窗**

`cb3/`（批准 3 步 write+rescan+rescan，模型执行 write→rescan#1→rescan#2）：
- logcat（设备时间）：
```
00:48:28.511 UPG76   : 预审单已落簿: group=plan-0e8ab135 批准=3 / 拒绝=0
00:48:28.512 ApprovalService: 预审单绑定命中: obsidian.file.write
00:48:29.404 ApprovalService: 预审单绑定命中: obsidian.vault.rescan   ← rescan 仅授权命中一次
```
- rescan#2 调用超出清单授权（授权单次执行）→ 未命中 → 转**新审批窗**：`cb3/after_plansheet.png` / `.ui.txt` 呈现实时弹窗「AI 想帮你扫描你的 Obsidian 仓库…27 后 AI 会自动取消」+ 同意/拒绝。
- 模型如实汇报（chat 文本）：write 写入成功（17 字符）→ rescan 第一次成功（索引 6 文件含新写文件）→ rescan 第二次工具超时中止。

→ **「已批步骤跑通 + 执行中计划外调用弹新审批窗」成立**（同一证据同时覆盖场景③「授权次数耗尽→同调用转新弹窗」）。

**场景①小结**：多步骤（≥2 写类）→ 预审单（清单+参数+勾选+批量按钮）→ 部分批准（已批执行/未批 DENIED 阻断）→ 执行中计划外弹新窗，四段全实证。

### 场景② MONEY 步骤执行到该步实时弹确认 —— ⛔ 环境阻塞（无 payment MCP）

**方法**：新会话请求发起支付（ASCII 注入），要求调用 `payment.pay`。
**结果**：模型尝试调用后实证工具不存在：

> payment.pay 这个工具不在我可调用的工具列表里…已核实：payment.pay 工具不存在（返回 TOOL_NOT_FOUND，且无相近候选），所以我无法调用它…不会臆造一个同名工具去执行。

- 环境核实：logcat 无任何 `payment`/MCP 支付服务器连接记录；`MoneyTools` 判定仅认 `payment.pay` / `payment.*`，而 handler 未注册。
- **结论**：MONEY 工具在模拟器**无后端 handler**（payment MCP 未接入）→ 场景②端到端不可执行（**失败如实呈现**：TOOL_NOT_FOUND 报给用户，非静默）。
- **语义覆盖**：MONEY 排除预批、执行期实时逐笔判定由 UPG-76 JVM 层定向测试覆盖（STD-UPG-76-v2 变异锚「MONEY 排除」+ 定向用例「MONEY 排除/不可批」全绿）。真机端到端需接入 payment mock MCP（超出本单范围，见§六建议）。

### 场景③ 批准清单过期/次数耗尽 → 同调用转新弹窗 —— ✅ 次数耗尽实证 + EXPIRED JVM 覆盖

- **次数耗尽**：见 3.3——rescan 清单授权一次，第二次同调用 MISS → 转新弹窗（logcat 仅一条 rescan HIT + 弹窗截图 + 模型汇报中止）。
- **EXPIRED（5min TTL）**：真机时序难稳定触发（获批节点总被模型立即消费；5min 等待 + 模型配合要求高）。语义由 PlanApprovalStore JVM 定向用例 EXPIRED 覆盖（STD-UPG-76-v2 定向「EXPIRED/单次执行」）；如需真机 EXPIRED 演示，建议在可控测试脚本内用短 TTL 变体另行验证（见§六）。

### 场景④ 单步骤请求不出单（走现行弹窗） —— ✅ 沿用 s4 四连测实证

证据：`a3/s4/`（session_current.jsonl + s4d_dialog.png/.xml + s4d_after.png + timeout.png）：
- 4 次单步 `obsidian.file.write`（a3_s4 / s4b / s4c / s4d）→ 均**未出预审单**，走现行单步弹窗「AI 想帮你写入文件」（s4d 手动点同意 → 「已创建笔记 a3_s4d.md」）；journal 每次成对落 `approval/asked` + `approval/decided`（allowed-once / cancelled）。
- 另证：单步请求多次 logcat `预审单编排：不达门槛(grade=1 approvable=true) → 现行单步弹窗`（a3 logcat）。

→ **单步不出单、走现行弹窗**成立。

---

## 四、补验发现（登记建议）

### 4.1 疑似缺陷：`MainActivity.kt:5543` removeAll 误删同工具多步

代码（feat/upg76）：
```kotlin
val steps = parsePlanSteps(planText).toMutableList()
steps.removeAll { it.tool == info.toolName }   // ← 删「所有」同名步骤
steps.add(0, PlanStep(info.toolName, info.args, ...))
```
- 意图：以真实参数覆盖子代理对「当前步」的猜测参数（节点键=真实 args）。
- **副作用**：`removeAll` 按工具名删除**同名全部步骤**。真实「批量写多个笔记」= 多次 `obsidian.file.write`（同工具不同参数）→ 子代理即使列出 2 步同工具写，也**全部被删**、只剩当前 1 步 → `gradeCount=1` → 不出预审单、退单步弹窗。
- 实证方向：多文件写请求（同工具）多轮均 `不达门槛(grade=1)`；而不同工具组合（write+rescan）同机制即触发预审单（grade=2）——差异落在 removeAll 的同名删除行为。
- **建议**：改 `removeAll` 为仅覆盖「与 info.toolName 相同且参数与当前 pending 匹配」的首行（或改 removeAll 后按工具名分组保留代表行）；需变异亲杀 + 真机回归（写两文件应出预审单）。

### 4.2 环境限制：payment MCP 未接模拟器（场景②根因）

见场景②。建议接 payment mock 服务器后再补 MONEY 真机 L3。

### 4.3 验证行为特征（非缺陷，记录备查）

- DeepSeek 对同一请求存在「直接 tool_call」与「先文本征求」两种策略（后者不触发审批链，需回复同意才继续）——真机回归需对文本内联确认口径兜底（工具已支持，见 A3 各轮）。
- turn 豁免优先于清单裁决（ApprovalService.kt:376 在 preApprovalPlanner 之前）——同 turn 已放行工具，预审单无法拒绝（豁免序 turn→goal→remembered→清单→FIFO 既定设计）。A3 场景①部分批准在**干净 session**（重启 app）下验证即为规避此残留豁免。

---

## 五、脱敏自查

- `git grep sk-` 零命中（未新增任何代码/文件入 git）。
- 全流程 key 未落任何证据文件/截图/logcat 摘录；本报告不含任何 key 片段。
- 证据 logcat 摘录仅保留链路事件行，无凭据帧。

---

## 六、Token / KV Cache 影响（零代码改动 → 0/0）

- **代码改动**：无（A2 判定 + A3 纯验证）。**Token 增量：0；KV Cache 影响：0**。
- 背景口径（引用 UPG-76 交付既定）：触发=首个写类 ASK 后 +1 轮计划补全（READ-only 面嵌套子代理）；纯只读/闲聊零增量。本单未改该口径。

---

## 七、挂账销项对照

| 挂账 | 对应证据（本报告） | 状态 |
|---|---|---|
| 挂账-upg76-L3真机补验四场景 | 场景① §3.1-3.3 / 场景③ §3.3+JVM / 场景④ §s4；场景② 环境阻塞如实记录（§场景②） | 场景①③④销；②环境受限声明 |
| 挂账-模拟器AI未回复 | A1 诊断链路健康证据（§二）+ A3 各轮对话往返（弹窗确认后成功回复） | 销 |

## 八、登记与后续

- **已登记两个表**：① 工单库.md UPG-80 卡加「C 交付」块（状态区结构修正：认领/交付演进行并入 `## 标题` 前，sync 状态区可正确收录）→ `审验员/sync-orders.mjs --sync` 投影工单表.xlsx，**diff=0**（70 卡）；UPG-80 行 E 列=C 交付、F/G=待流转、delivery_id=—（零代码无 DEL）。② 交付报告落档（本文件）。
- 登记：本单结果已按流程落交付报告；四场景证据目录 `a3/`。
- 建议后续：① removeAll 缺陷（§4.1）转工单核实修复；② payment mock MCP 接入后补场景② 真机；③ EXPIRED 真机短 TTL 变体验证（可选）。
