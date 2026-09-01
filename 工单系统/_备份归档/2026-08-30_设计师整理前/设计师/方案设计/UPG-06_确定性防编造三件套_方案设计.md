# UPG-06 确定性防编造回补（FabricateGuard 先行，三件套拆批）· 方案设计 v3.2

> 设计人：设计师 ｜ 日期：2026-08-26（v3 修订 2026-08-29；v3.1 评审#2 收口 2026-08-29；v3.2 评审#3 收口 2026-08-29）｜ 优先级：批 1 P0 / 批 2 P1 ｜ 状态：✅ 方案 v3.2 完成（评审 §七 + 溯源图 §八 + 评审#2 §九 + 评审#3 §十 四环闭环），**批 1 ⏳待派单**（排期：UPG-05 合 main → 复核锚点 → 出卡）；批 2 场景未明继续挂起（启动前置见 §九）；F1 线另立卡（见 §十.3）
> v3.2 修订说明（评审#3 收口）：① **P0 矛盾修复**——§五 Token 申报旧文案与 §二.2「不注入模型上下文」定案直接矛盾（v3.1 漏改），已改为命中与否 token 影响均 = 0；② **`toolCallsZero` 粒度定案 = turn 级**（老版 finish 挂载「本轮零 tool.execute」语义实证，禁 step 级——step1 真调+step2 文本收尾是正常形态）；③ F1/claimFeedback 不随批 1、另立卡；④ 红线补更正文案低确定性措辞 + 定位声明；⑤ 误拦率分母定义 + turn 级粒度用例入验收；⑥ 出卡 DOD 补 E3 联动表。
> v3.1 修订说明（评审#2 七条收口）：① **E3 处置纠正**——实证 `looksLikeToolRequest` 是**输入侧**检测（用户请求文本，`:5631` 词表 + `:3935` 调用点），与 FabricateGuard 输出侧声称检测互补非同源，v3「废除」改为「保留+词表治理」，检测源唯一限缩为输出侧；② 更正提示通道定案（默认不入模型上下文）；③ 测试桩接口/断言路径定义；④ RepeatDetector 实例持有架构实证（`ToolCallScheduler` per-agent，`AgentLoop.kt:115`）；⑤ 误拦验证集量化（≥200 条、≤2%）；⑥ guard 事件 schema 定义；⑦ 出卡 DOD 行号复核。
> v2 修订说明：v1 对现状的描述反而高估了（RepeatDetector 也未接线）；三件套严重性不均，拆批分级；AcceptanceJudge「服务端持」措辞纠正（老版实为 journal 本地持）。
> 依据：老版 `agent/FabricateGuard.java`（208 行，主闸 `guard()` :190-207）、`capable/GoalGate.java`（71 行）、`capable/AcceptanceJudge.java`（69 行）、挂载点 `AgentLoop.java:1092-1127` 逐行核实；真机幻觉铁证（验收手册六种形态 A-F）

---

## 一、问题（v2 实测证据）

**新版现状（v2 复核，比 v1 说的更薄）**：
- `dsh/guard/Guard.kt` 有 RepeatDetector（阈值 3/5/8）+ 工具超时两个定义，但 **RepeatDetector 全库零接线**（仅 `RepeatDetectorTest.kt` 命中；`docs/DSH_TRANSLATION_RESIDUE.md:23` 自认 guard 包整体未接线）。运行时实际只剩两道防线：工具超时（`agentloop/ToolCalls.kt:207,217,280`）+ 审批弹窗（管权限不管编造）。
- F1 声称检测线（claimFeedback）新版**也无**（全库 0 命中）——v1 评审点 1 说的「现有 F1 线」是老版的。
- 对「AI 声称完成但零 tool_call」**没有任何确定性拦截**，只能靠模型自觉。

**老版三件套在案**：`AgentLoop.java:1092-1127` 挂载 claimFeedback → FabricateGuard.guard → GoalGate.evaluate/masteryEvent → AcceptanceJudge.pass/verdictEvent。

**严重性证据**：验收手册专章六种幻觉形态 A-F（2026-08-17 实战）：A 编造数据（`model.list` 无 tool_call 编造 GPT-4o/Claude 列表铁证）、B 成功声明（`timer.set` 回「已设置成功」）、C 措辞绕过、D 输出 JSON 不真调、E 文本计划、F 纯聊天回避；新版也有真机幻觉记录（`0027-mov/docs/PROBLEM_LOG.md:62-74`）。「B 类 AI 幻读是工具激活主体障碍，P0」（真机验收标准）。

## 二、迁移方案（拆两批）

### 批 1（P0）· FabricateGuard + RepeatDetector 接线

1. **FabricateGuard 移植**：4 提取模式（SPEC_VERB/SPEC_TAIL/SPEC_EN + JSON 语境，`FabricateGuard.java:35-55`）+ QUERY_FORM 询问豁免 + 诚实降级（清单不可用时不拦，`:193`）。中文动词表照老版 `EXEC_CLAIM:102-115` 移植（全中文，SPEC_EN 仅辅路）；施工输入含**新版真实对话样本误拦豁免验证集**（收集近期真实会话文本过闸，误拦案例逐条入交付报告）。
2. **反馈形态按流式重设计（v3 定案，溯源 L1 结论；v3.1 通道收窄）**：新版 chunk 边收边上屏（`AgentLoop.kt:359` → `MainActivity.kt:3347/3398`），拦截**不能阻止用户先看到文本**——老版「替换回复内容」语义废弃。批 1 形态 = **事后追加更正**，通道三条分明：
   - **用户侧**：UI 在该条消息打「疑似编造」可见标记（必须有；**会话重载后由 guard 事件重放重建标记**，否则重载后用户看到的是无标记的编造文本）；
   - **审计侧**：落 guard 审计事件（turn 包裹，schema 见 §九.6）；
   - **模型侧（v3.1 定案：默认不注入）**：更正提示**不进入模型上下文**——防止模型把更正当新指令产生二次输出/自我辩解（新幻觉路径）。如未来确需模型感知，另评「带特殊标签的系统注入（不参与生成）」方案，本批不做。**禁止**把更正提示作为普通 user 消息注入。
3. **检测源唯一 = 输出侧唯一（v3.1 纠正，评审#2 第 1 条实证）**：`looksLikeToolRequest():5631` 实证为**输入侧**检测——检查的是**用户请求文本**是否像要执行工具（调用点 `:3935`：AI 纯文本无 tool_call 且用户请求命中词表 → followup 系统提醒重 kick）。它与 FabricateGuard（输出侧：模型是否声称完成/编造）**互补非同源**，v3「废除」处置错误，纠正为：
   - **E3 保留**，输入侧兜底职能不动；
   - **词表治理随本单**（销挂账-looksLikeToolRequest关键词过宽）：英文超宽词收窄（get/turn/check/list 等单词必误伤，如 "get it"）+ 中文意图词补强（「列一下/帮我看看」类）；
   - E3 重试轮文本**替换而非拼接**（销挂账-E3重试文本拼接）；
   - **输出侧声称检测源唯一** = FabricateGuard（不得再另立输出侧关键词判定）。
4. **挂载点锚定（v3 溯源钉死；v3.2 粒度定案）**：FabricateGuard 挂 `AgentLoop.kt:418-425`（`toolCalls.isEmpty()` → Completed 分叉 = **turn 结束点**，与老版 finish 挂载同位）。**`toolCallsZero` 判定粒度 = turn 级**（v3.2 定案，评审#3 第 1 条）：扫**本 turn 全部事件**零 tool/call 才算编造——老版语义实证为「finish 摘要提到工具名但**本轮**零 tool.execute」（`AgentLoop.java:1093-1106` finish 分支对账）；**禁 step 级**（step1 真调工具 + step2 文本声称完成是正常多步形态，step 级判定必误拦）。工具清单读 `agent.toolsForStep`。**RepeatDetector 实例持有（v3.1 架构实证）**：`ToolCallScheduler` 是 **per-agent 成员**（`AgentLoop.kt:115` `val toolCallScheduler = ToolCallScheduler(scheduler)`）——detector 作为 `ToolCallScheduler` 构造参数/属性注入即可，天然 agent 实例级，**无跨 agent 污染风险、禁全局单例**。挂载 post-execute `ToolCalls.kt:220-224`（dispatch 落定后）；语义照 harness——deny 也计数、参数深排序 canonical（`Guard.kt:63-67` 浅层升级为深递归）、exclude 透明、用户插话重置、gentle→detailed 分级。
5. **L6 前置（v3 溯源钉死）**：新 guard 审计事件类型先入 `KNOWN_SESSION_EVENT_TYPES`（`KnownEventTypes.kt:12-65`，读路径拒未知类型 `:5-7`），事件一律 turn 包裹（裸事件被 Repair 当崩溃尾）。旧读端兼容注记：guard 事件非 ignorable，读路径与写端同仓同发，无旧版本读到新事件的风险窗口；若日后单独回滚读端须先回滚事件写入。
6. **排期防撞**：UPG-05（记忆体系，C 在施）同动 AgentLoop/journal 区域——批 1 派单待 UPG-05 交付合 main 后，或先确认文件不撞再派。

### 批 2（P1）· GoalGate + AcceptanceJudge（场景明确后接）

4. **GoalGate**：DeepTutor 教学场景移植件（单证据 0.5 封顶 / 0.9 过线）——新 MOV 的「掌握度」交互场景不明确，**评审确认场景后再接**，阈值不照搬。
5. **AcceptanceJudge 降级为观察层**（v2 修正）：老版 expected 实为 **journal 本地持**（`criteriaEvent` 落 append-only + `projectForModel()` 剔答案键），并非远程服务端；`pass()` 是 exact equals，只适用有确定答案的问答型任务。本批只做：journal 持 expected + 投影剔键 + 对拍结果落 journal（**不拦截、不重试**），仅问答型任务启用。

## 三、风险与红线

- **误拦风险**：建议性/询问语句不得拦（老版豁免语义必须保留）；GoalGate 阈值不可过严（评审确认场景）；
- 不改变工具注册/调用签名；只加观察+反馈层（execute 面不动）；
- expected **绝不发给模型**（journal 本地持 + 投影剔键）；
- **批 1 反馈文案不得再引导 plan JSON 协议**（协议已死，引导了 AI 也走不通）；
- **更正文案低确定性措辞**（v3.2）：误拦率非零，用户侧文案必须「可能不准确」级（如「模型未调用工具即声称完成，内容可能不准确」），禁「已编造」断言式表述；
- **定位声明**（v3.2）：本闸**治用户感知、不治模型行为**（确定性启发式闸，形态 C 措辞绕过/部分 D 边缘漏拦是结构性的）——交付报告必须写明，验收对漏拦不设超预期质疑；
- **拦截不阻止流式上屏**（只能事后更正；禁吞消息/禁回退已上屏内容）；
- **检测源唯一 = 输出侧唯一**（v3.1 纠正）：输出侧声称检测只有 FabricateGuard；**E3 是输入侧兜底，保留**，不得误判为双判废除；
- 审计/反馈事件落 journal 须包在 turn 内，且事件类型先入 `KNOWN_SESSION_EVENT_TYPES`（裸事件重载时被当崩溃尾丢弃）。

## 四、验收标准

- L1：FabricateGuard 纯函数单测（≥8 用例，含边界/豁免/降级）+ 变异亲杀（删拦截分支必红）+ **turn 级粒度用例（v3.2）**：「step1 真调工具 + step2 文本声称完成 → **不拦**」「整 turn 零调用 + 声称完成 → 拦」两案必含；+ **新版语料误拦率实测（v3.1 量化 + v3.2 分母定义）**：≥200 条真实会话样本（覆盖六种幻觉形态 A-F + 正常完成/询问/建议语句，**正常语句配比 ≥50%**），**误拦率 ≤2%（分母 = 正常语句子集的被拦比例）** 且每个误拦案例必须有豁免规则或词表补充落码；漏拦案例逐条归因入报告；RepeatDetector 接线断言（真实调用点在 `ToolCalls.kt` 内 + detector 为 per-agent 实例断言 + 深 canonical 用例）；**E3 词表治理断言**（超宽英文词已收窄、中文意图词在表，grep 实证）；guard 事件类型入 `KNOWN_SESSION_EVENT_TYPES` 且 schema 字段齐全断言；
- L2（确定性手段，v3.1 接口钉死）：**桩点 = 替换 LLM 适配器层**（DeepSeekAdapter 接口的测试替身返回伪造 StreamChunk 文本：「无 tool_call 的完成声明」），**走真实 `AgentLoop` 全链**（经 `:418-425` 分叉，禁另起测试旁路）；断言四点齐全：① FabricateGuard 命中记录 ② guard 审计事件落 journal（schema 合规、turn 包裹）③ UI 更正标记可见（截图）+ **会话重载后标记由事件重放重建** ④ 模型上下文**未**被注入更正文本（journal 无对应 user/system 消息）；真机只验呈现，不赌模型幻觉；
- L3（批 2）：问答型任务对拍结果入 journal 可查。

## 五、Token 影响 / KV Cache 影响（AGENTS.md 硬规则 1 申报）

- **批 1（v3.2 修正，评审#3 P0：与 §二.2 定案对齐）**：FabricateGuard 更正提示**不进入模型上下文**（仅 UI 标记 + journal 审计写入，guard 事件不参与上下文投影）→ **命中与否 token 影响均 = 0**，KV 前缀不变。
- **RepeatDetector 提醒**：达阈值才注入模型（gentle→detailed 分级，harness 范式本就是模型面提醒）→ 仅触发轮 token 微增（一条短提醒），常态不变；尾部追加不动前缀。
- **批 2**：journal 本地持 expected + 投影剔键 → 发给模型的内容不变。
- 交付前自跑 `node scripts/check-token-effect.mjs`。

## 六、专家评审点

1. ~~FabricateGuard 与老版 F1 声称检测线边界~~ **已定案 @v3.2**：F1 不随批 1、**另立卡**（「不注入模型上下文」定案下 F1 原语义 = 反馈进模型，需整体重设计而非简单移植）；
2. GoalGate 应用场景：新 MOV 哪些交互算「掌握」？没有明确场景则批 2 继续挂起；
3. AcceptanceJudge 的 expected 来源：问答型任务如何提供（市场任务自带？用户指定？）；
4. 误拦后的用户体验（反馈语 + 用户可见性）——v3.2 已部分定案（低确定性措辞红线 + UI 标记 + 重放重建）。

---

## 七、评审意见（@2026-08-29，事实锚点已重新实证）

> 事实层复核通过：行号锚点抽查全部仍准确（RepeatDetector 仅测试命中、FabricateGuard/claimFeedback 全库零命中、`DSH_TRANSLATION_RESIDUE.md:23` 自认 guard 未接线）。以下三条为派单前置修订项，修订后方可出卡。

1. **L2 验收不可控（必改）**：真实模型幻觉不可按需复现，「真机构造声称完成零 tool_call 场景」无法稳定执行。改为：测试桩适配器注入「无 tool_call 的完成声明」走拦截链（确定性），真机只验拦截反馈的 UI 呈现。
2. **中文声称模式清单（@溯源修正）**：原评审称「方案没给中文动词表」——溯源证伪此忧：老版动词表本来就是中文为主（`EXEC_CLAIM FabricateGuard.java:102-115` 全中文「执行完毕/已完成/设置为…」，SPEC_EN 仅 use/call/run/invoke 一条辅路 @ff8d67e），移植自带中文覆盖。仍需补：**新版真实对话样本的误拦豁免验证集**（老版豁免语义照抄后过一遍新版语料测误拦率），作为施工输入。
3. **挂载点补锚点（必补）**：现仅有 harness 范式（观察+丰富），未定新架构具体挂载段（`AgentLoop.kt` 哪段、注入消息角色/时机）。出卡时补挂载点行号锚定；并与 UPG-05（在施，同动 AgentLoop/journal 区域）排期防撞。

---

## 八、分层溯源图（@2026-08-29，设计前溯源机制 v1.1 必做项）

> 核查基线：新版 `0027-mov @ dfa90d3`（与 main 线一致）；老版 `MOV-APP-old @ ff8d67e`。只读核查，未改任何文件。
> **置信度 = ⚠️（最弱层 L1）**：流式上屏决定拦截只能事后补救——老版「替换回复内容」语义与新版流式架构冲突，批 1 反馈形态必须按「追加更正/撤回提示」重设计，不可照搬。
> **底座漂移注记 @2026-08-29（UPG-07 批 1 合 main 9c3db32 后复扫）**：dsh 包锚点**全部不变**（`AgentLoop.kt:425` 分叉 / `Guard.kt:42` / `KnownEventTypes.kt:12` / `ToolCalls.kt` 挂载区，UPG-07 未触这些文件）；MainActivity 侧锚点整体 **+45 行**（UPG-07 加 46 行）：`rebuildAgentTools():5690`、`toolsForStep :3830`、`looksLikeToolRequest():5631`、E3 调用点 `:3935`。判定与处置不变；出卡时以当时 main 再核一遍行号。

| 层 | 判定 | 证据（文件:行号 @commit） | 依赖声明 | 断点处置 |
|---|---|---|---|---|
| L1 用户可感知 | ⚠️ | 编造文本流式直接上屏（`MainActivity.kt:3345-3349` markstream 路 / `:3396-3399` 原生降级路，chunk 在 `AgentLoop.kt:359` 边收边上屏）@dfa90d3；现状唯一防线 = E3 事后静默重试（`MainActivity.kt:3888-3897` + 关键词启发式 `looksLikeToolRequest():5586-5592`），用户侧零拦截提示 | 触及 | **本单修**：批 1 反馈形态按流式重设计（事后更正/撤回提示，非阻止上屏）；E3 联动表入出卡 DOD（见 §十.2） |
| L2 入口/桥接 | ✅ | 零 tool_call 确切分叉 `AgentLoop.kt:425`（`toolCalls.isEmpty()` → Completed）；回复全文同场可取（`assembler.blocks()`）；assistant/message 落日志 `:411-415` | 依赖 | — |
| L3 服务/数据 | ✅ | 工具清单 `rebuildAgentTools() MainActivity.kt:5645-5667`（schema 构建 `:5655-5663` 源自 mcpHandlers.keys 过滤）；运行时可取 `agent.toolsForStep :3785` | 依赖 | — |
| L4 运行时装配 | ✅ 挂载点 / ❌ 孤岛 | FabricateGuard 挂载点 `AgentLoop.kt:418-425`（step 内）；RepeatDetector post-execute 挂载点 `ToolCalls.kt:220-224`（dispatch 落定）或 `commitReady():160-174`；RepeatDetector 零生产调用属实（仅 `Guard.kt:42` 自身 + 测试，翻译死链孤岛） | 依赖 | **本单修**（批 1 接线即销孤岛）；RepeatDetector 需每 agent 实例持有（现无人 new），observe() 插 `:181` appendToolCall 后或 `:224` 落定后 |
| L5 能力实物 | ✅ | 老版 `FabricateGuard.java` 恰 208 行、`guard():190-207`、四模式 `:35-55`、中文 EXEC_CLAIM `:102-115`、诚实降级 `:193`（清单空放行）；`GoalGate.java` 恰 71 行；`AcceptanceJudge.java` 恰 69 行；老版挂载 `AgentLoop.java:1092-1127` 全属实 @ff8d67e | 依赖 | —（可直接移植） |
| L6 持久化/事实源 | ✅ 含前置 | journal = 会话 JSONL 单写点（`Session.append():157` → `Coordinator.append():271`，装配 `MainActivity.kt:1337-1339`）；turn 包裹语义属实（裸事件由 `Repair.kt:34-79` 合成 closers、崩溃尾截断 `JsonlStore.kt:188-205`）；平行数据源检查干净（SqliteSessionPersistence 未实例化、FTS5 为派生索引「日志为权威」） | 依赖 | **本单前置**：新 guard 审计事件类型须先入 `KNOWN_SESSION_EVENT_TYPES`（`KnownEventTypes.kt:12-65` 现无 guard 类，读路径拒未知非 ignorable 类型 `:5-7`）且必须 turn 包裹 |

**溯源附带发现（与卡面无关缺陷，已登记挂账）**：`looksLikeToolRequest` 关键词过宽/中文漏判；E3 重试后文本拼接显示。见 `处理中心\挂账登记表.md`。

---

## 九、专家评审#2 回应（@2026-08-29，七条收口）

> 评审结论：批 1 方向正确、v3 成熟度达标，剩余问题集中在实现细节与边界语义。以下逐条处置，已回改正文（§二/§三/§四）。

1. **输入侧/输出侧混淆（评审指正成立，v3 处置错误已纠正）**：实证 `looksLikeToolRequest():5631` 词表检查对象是**用户请求文本**（E3 调用点 `:3935`：AI 纯文本无 tool_call + 用户请求像要执行工具 → followup 重 kick）——输入侧兜底，与 FabricateGuard 输出侧**互补**。v3「废除」改为「保留 + 词表治理」（正文 §二.3、红线已改）。
2. **更正提示通道（定案）**：默认 **UI 标记 + journal 审计事件，不注入模型上下文**（防二次输出/自我辩解新幻觉路径）；禁止作为普通 user 消息注入；模型感知需求另评（正文 §二.2）。
3. **测试桩接口（钉死）**：桩点 = LLM 适配器层测试替身，走真实 AgentLoop 全链（`:418-425`），禁旁路；断言四点（命中记录/journal 事件/UI 标记/上下文未注入）（正文 §四 L2）。
4. **RepeatDetector 实例持有（架构实证可行）**：`ToolCallScheduler` per-agent（`AgentLoop.kt:115`），detector 随实例注入，禁全局单例（正文 §二.4）。
5. **误拦验证集量化**：≥200 条真实会话样本（覆盖 A-F + 正常/询问/建议），误拦率 ≤2%，误拦案例必须有豁免规则或词表补充落码（正文 §四 L1）。
6. **guard 审计事件 schema（定案）**：类型名 `guard.fabricate_hit`（先入 `KNOWN_SESSION_EVENT_TYPES`，**非 ignorable**——审计须可查）；字段：`turnId`、`agentId`、`matchedPattern`（SPEC_VERB/SPEC_TAIL/SPEC_EN/JSON）、`textSnippet`（命中片段，截断 ≤120 字符）、`toolCallsZero: Boolean`、`actionTaken`（ui_mark/journal）；RepeatDetector 提醒事件 `guard.repeat_reminder` 同规（字段：`toolKey`、`count`、`level` gentle/detailed）。
7. **出卡 DOD**：派单当日以 main 最新 commit 复核全部行号锚点（UPG-07 批 1 已致 MainActivity +45 行漂移，注记见 §八）；防撞顺序钉死：**UPG-05 合 main → 复核锚点 → 出 UPG-06 批 1 卡**。

**批 2 启动前置（写入卡片，防空转）**：① GoalGate——用户确认新 MOV 存在「掌握度」交互场景；② AcceptanceJudge——问答型任务识别机制 + expected 来源（市场任务自带/用户指定）有定案。两条不满足，批 2 继续挂起。

---

## 十、专家评审#3 回应（@2026-08-29，v3.2 收口）

> 评审结论：方案骨架/红线/验收达标，一处 v3.1 漏改矛盾（P0）+ 两条语义边界建议钉死。以下逐条处置。

1. **P0：§五 与 §二.2 矛盾（成立，已修）**：§五 旧文案「向对话追加更正提示消息（user 通道）」系 v3.1 回改清单漏网（只改了 §二/§三/§四），与「不注入模型上下文」定案直接冲突。§五 已改为「命中与否 token 影响均 = 0，guard 事件不参与上下文投影」；RepeatDetector 提醒注入模型属其原有语义（harness 模型面提醒），保留并补申报。
2. **`toolCallsZero` 粒度（定案 = turn 级）**：老版语义实证——FabricateGuard 挂载在 finish 分支（`AgentLoop.java:1101-1106`），判定输入是「finish 摘要 + **本轮**零 tool.execute」，即 turn 级。新版 `:425` 分叉恰为 turn 结束点（Completed），挂载同位；判定输入钉死为「扫本 turn 全部事件零 tool/call」，**禁 step 级**（step1 真调 + step2 文本收尾必误拦）。正文 §二.4 与验收 §四 L1（turn 级两案）已落。
3. **§六 评审点 1 悬空（收口）**：F1/claimFeedback 不随批 1——在「不注入模型上下文」定案下，F1 原语义（note 反馈进模型 transcript，`AgentLoop.java:1093-1098`）需整体重设计，**另立卡评估**（可并入批 2 场景评审一并议），§六 已标定案。
4. **E3 联动（入出卡 DOD；✅已兑现 @2026-08-29）**：E3 重试上限 + 联动表已落工单库 UPG-06 卡「出卡补充段」——每用户消息至多 1 次 nudge；guard 命中轮 E3 不再 kick（动作层去重，状态不共享存储）；E3 nudge 后轮 guard 仍正常标记。
5. **小项处置**：① 误拦率分母 = 正常语句子集被拦比例、正常语句配比 ≥50%（§四 L1 已落）；② UI 标记会话重载由 guard 事件重放重建（§二.2 + §四 L2 断言③已落）；③ 更正文案低确定性措辞入红线（§三 已落）；④ 非 ignorable 旧读端兼容：读端与写端同仓同发无风险窗口，注记入 §二.5；⑤ 命中率/模式分布统计：作为**低成本附带产出**写入交付报告要求（guard 命中全量落 journal，统计脚本随单交付，数据入挂账供词表长期治理与「模型感知」另评决策）。
6. **定位提醒（采纳入红线）**：交付报告须写明「本闸治用户感知，不治模型行为」；形态 C/部分 D 的漏拦是结构性的，验收不设超预期质疑（§三 已落）。

**出卡 DOD 全量清单（合 §九.7 + 本节）**：UPG-05 合 main → 以当日 main 复核全部行号锚点 → 卡面附 E3 重试上限与联动表 → 验收样本集配比与分母口径照 §四 → 交付报告含定位声明与命中率统计。
