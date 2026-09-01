# UPG-07 预算口径 + 用量计量 + 审批简化 · 方案设计 v3

> 设计人：设计师 ｜ 日期：2026-08-26（v3 修订 2026-08-29）｜ 优先级：批 1 P0 / 批 2 P1 ｜ 状态：✅ 方案 v3 完成（评审 §七 + 溯源 §八 闭环；**窗口下沉 ModelEntry 用户已拍板 @2026-08-29**），**批 1 ⏳待派单**；批 2 待前置（挂账-GoalDomain无日志恢复 修复 + 弹窗基线采集）
> v3 修订说明：① 窗口从全局 1M 拍脑袋值**下沉为 `ModelRegistry.ModelEntry` 按模型字段**（用户拍板，溯源 L4 坐实 1M 零事实源）；② 估算口径照老版常量移植（CJK×0.67，以常量为准非注释）；③ 双阈值收敛单一事实源 + 修正 `:160` 注释（销挂账-压缩双阈值口径漂移）；④「TokenMeter 聚合」命名收为「usage 聚合层」= replay fold 派生视图（不落自有存储，防第二写点）；⑤ 批 2 地基修正——goal 真实存在（`Goal.kt:17-22` 生产接线），前置收窄为 GoalDomain restoreFrom。
> v2 修订说明：四问重测——预算口径属实（且叠加默认 1M 窗口是真 bug）；审批风暴被 2026-08-24 那批缓解大半（v1「5min TTL」不存在）；用量计量缺聚合层但原始数据已在 journal；设备裁剪机制已存在（v1 描述不实）移出本期；ExecuteToolGate 属范围外搭车，剥离。
> 依据：新版复核（`ContextBudget.kt:75`、`ApprovalService.kt`、`McpToolScheduler.kt:114-152`、`MainActivity.kt:1196-1557`）+ 老版 `ContextBudget.java:37-52`/`TokenMeter.java:34-58` + harness `llm/token-meter`、`interaction/user-approval` 源码对照

---

## 一、问题（v2 重测）

| 缺口 | v2 复核结论 | 证据 |
|---|---|---|
| **预算估算口径** | **属实，真 bug，本单最优先**。char/4 中文低估 60-65%（1 字≈0.6-0.75 token，记 0.25）；**叠加默认窗口 1M → 85% 触发线实际在真实窗口 2 倍以上 → 中文长会话先撞真实窗口报错、压缩来不及触发**。消费点：`AgentLoop.kt:302`、`BasicCompactionEngine.kt:40` | `ContextBudget.kt:75`；窗口默认 `MainActivity.kt:161`（1M/5K 可切换 `:839-842`） |
| **审批风暴** | **属实但被夸大**。2026-08-24 已落地：无害级 15 工具免弹（溯源更正：v2 写 14，实为 15，`McpToolScheduler.kt:114-119` @dfa90d3）+ file.write 工作区免弹（`:126-152`）+「允许本轮」按工具名豁免（`ApprovalService.kt:50-63,127-132,161-163`，纯内存按 turn，重启即失系有意安全设计）。v1 说的「5min TTL」**不存在**（全库 TTL 仅记忆 14 天/市场缓存 1h）。残留痛点 = 实质级工具（shell.exec/http.post/vault.*/market.*）多步混合任务仍逐工具弹。计划级授权确无（无 APPROVE_PLAN；`dsh/plan/Plan.kt` 仅模式标记——但注意 `dsh/goal/Goal.kt` goal 生命周期真实存在且生产接线，见 §八 L5） | 同上 |
| **用量计量** | **属实但原材料已在**。usage 已采集并落会话事件（`DeepSeekAdapter.kt:245-256`、`OpenAiCompatAdapter.kt:306-318` → `TokenUsage` `LlmTypes.kt:88` → `EventCodec.kt:218-232`）；缺的只是聚合层 + 展示 | 同上 |
| **设备能力裁剪** | **v1 描述不实**。启动期裁剪已存在：震动按 `hasVibrator()` 不注册（`MainActivity.kt:1196-1220`）、brightness/silent 按权限条件注册（`:1542-1557`）、bluetooth/wifi/tts/xiaomi.* 实测硬编码剔除；剔除发生在装配期，不进 `agentToolSchemas`（溯源更正：真实装配点 `rebuildAgentTools():5645-5667`，v2 原引 `:5305-5327` 证伪为表格解析区段 @dfa90d3），调用得 TOOL_NOT_FOUND 且 systemPrompt 已声明（`:3504-3506`）。真实差距仅 = 探测清单手工硬编码、不完整——**增量改进，移出本期** | 同上 |
| **ExecuteToolGate** | **范围外搭车，剥离**——不在四问之内，转后续单/灵感库评估 | — |

## 二、迁移方案（重排两批 + 两项移出）

### 批 1（P0，先行）· 口径移植 + 窗口下沉 ModelEntry + usage 聚合层

1. **估算口径移植老版加权**（源头 `ContextBudget.java:37-52 @ff8d67e`，10 行纯静态）：ASCII×0.3 / CJK×0.67（1/1.5，UPG-38 实测口径）/ 其他×1.2，ceil 取整——**以常量为准**（老版注释头写 CJK×1.0 与常量不符）。替换 `ContextBudget.kt:75`；单测锁中英样本误差 <30%；**同步改 `TokenMeterTest.kt:12` 的 char/4 断言**。harness 抄不了（同样 char/4 且 README 自认 CJK 低估）。
2. **窗口下沉 ModelEntry（用户拍板 @2026-08-29）**：`ModelRegistry.ModelEntry` 增 `contextWindowTokens` 字段逐模型配（按各模型官方口径填入并注明来源，禁止拍脑袋）；`MainActivity.kt:161` 全局默认改为取当前模型 entry 值；1M/5K 调试切换（`:1144-1147`）改为对当前模型值的临时覆盖；**切模型同步切窗口**。
3. **双阈值收敛（销挂账-压缩双阈值口径漂移）**：压缩阈值单一事实源 = `ContextBudget.degradeRatio`（0.85）；`BasicCompactionEngine.thresholdRatio`（`:27`）默认值移除或装配时显式传入同值；顺带修正 `MainActivity.kt:160` 注释（「128K 档」不存在）。
4. **usage 聚合层（命名收，原「TokenMeter 聚合」）**：回放会话 JSONL 的 `assistant/message` usage 字段 fold 出日/月/模型三轴累计（harness token-meter ReplayState fold 范式），**只做派生视图、不落自有存储**（防第二写点，溯源 L6）；设置页展示走 WebView 桥 + `SettingsSheet.kt:31` allowedPrefixes 白名单；**只提示不硬拦**。月配额暂照搬老版 `MONTH_QUOTA=5_000_000`（仅提示阈值，后续按真实用量分布再调）。harness 锚定投影（usage 锚 + repricing）留作二期演进。

### 批 2（P1）· 审批简化（先不上完整计划授权；前置满足后出卡）

**前置（缺一不可）**：① 挂账-GoalDomain无日志恢复 修复（GoalDomain 补 restoreFrom，否则 goal 级豁免重启无锚点）；② **弹窗基线采集**：3 个标准混合任务（各 5+ 步实质级工具）现状弹窗次数落档，否则 L3 无从对比。

4. **低成本扩展先试**：「允许本轮」→「**允许本目标**」——`goalAllowSet`（key=goal id）仿 `turnAllowSet`（纯内存不持久化，重启清空兜底）；goal 失效（complete/轮次上限 ARMED）即回收；新工具仍弹。goal 粒度 = GoalDomain 活跃目标（`Goal.kt:17-22` 已有生产接线，无需新建概念）。验证是否足够覆盖残留痛点；不足再评审完整 APPROVE_PLAN 状态机；
5. **安全取向明说（v3 卡面声明）**：「允许本轮」重启即失是 ApprovalService 有意的安全设计；goal 级 = 豁免存续期放宽——本卡显式接受此 trade-off（回收靠 goal 生命周期 + 重启清空兜底）；
6. **施工红线**：必须接线现有 `ApprovalService.kt` + GoalDomain，**不得另起平行审批体系**。参考 harness `user-approval`：answerer 瀑布 fail-closed 归一（异常/脏值→unavailable）、审计对 asked/decided 必须 turn 包裹、「授权只适用于被请求动作」（`allowed-turn/goal` 是 MOV 扩展语义，审计 outcome 词汇标记清楚，防日后对账混淆）；
7. **架构红线（harness 同款）**：plan 模式不自己拦工具——拦哪些工具全交审批层。

### 移出项

- **设备裁剪**：探测清单补全转后续单（P3）。若做：必须**启动期探测**（装配期定型，前缀恒定）；**不做 prompt 注入**（工具不在面已足够，注入徒增 token 且有规则 2 风险）；
- **ExecuteToolGate**：转后续单/灵感库评估。

## 三、风险与红线

- 批准不永久：goal 失效即回收豁免，新工具必弹（防「计划内偷加动作」）；
- 预算口径替换影响压缩触发时机：先单测锁定旧行为对比，再切换；
- TokenMeter 只计量不硬拦（配额提示降级，不断服务）；
- **一切 tools 字段 / system prompt 变化只能启动期生效**（「请求前缀恒定」硬规则 2）；
- 不得另起平行审批体系（接线现有 ApprovalService/Plan）。

## 四、验收标准

- L1：加权估算单测（中英样本误差 <30%，变异亲杀；含 CJK×0.67 常量断言防注释误导）；**ModelEntry 窗口字段单测**（切模型窗口跟随、缺字段回落默认）；**双阈值单源断言**（BasicCompactionEngine 不再自持异值）；usage 聚合层单测（replay fold 累计/月重置；无自有存储写点 grep 实证）；goal 级豁免状态机单测（goal 内放行/失效回收/新工具仍弹/重启清空）；
- L2：真机（emulator-5556）中文长会话 → 压缩触发时机正常（logcat 可见 85% 按新口径+新窗口触发，不撞窗报错）；**切模型后 logcat 可见窗口跟随**；设置页用量可见（WebView 桥白名单后）；
- L3（批 2）：AI 触发 5+ 步混合工具任务，审批弹窗次数较**已采集基线**可量化下降（journal 可查批准上下文）。

## 五、Token 影响 / KV Cache 影响（AGENTS.md 硬规则 1 申报）

- **批 1**：只改估算口径与聚合读侧，不改请求内容 → token 不变、KV 前缀不变；
- **批 2**：goal 级豁免不改 tools 字段、不改 system prompt → 不变；审批反馈消息注入走既有 user message 通道，同现状。
- 交付前自跑 `node scripts/check-token-effect.mjs`。

## 六、专家评审点

1. ~~加权系数与窗口默认值~~ **已定案 @2026-08-29**：窗口下沉 ModelEntry 按模型配（用户拍板）；加权系数照老版常量（CJK×0.67，UPG-38 实测口径），误差目标 <30% 维持；
2. goal 级豁免边界：**v3 已定**——豁免集按工具名（同 turnAllowSet 粒度），goal 失效（complete/ARMED）即回收；参数形态豁免不做（粒度太细难审计）；
3. 月配额默认值：暂照搬老版 500 万（只提示不硬拦，后续按真实用量分布调）；
4. 完整 APPROVE_PLAN 是否需要：等批 2 落地后用弹窗数据说话。

---

## 七、评审意见（@2026-08-29，事实锚点已重新实证）

> 事实层复核通过：行号锚点抽查全部仍准确（`ContextBudget.kt:75` char/4、`MainActivity.kt:161` 默认窗口 1M、`DeepSeekAdapter.kt:245` usage 解析均吻合；设备裁剪已存在、审批缓解已落地等复核结论成立）。以下三条为修订项。

1. **批 1 修不好自认的真 bug（必改）**：真 bug = 口径低估 **叠加** 默认窗口 1M → 撞窗。批 1 只修口径、把窗口下调留作评审点——但 1M 默认远超上游模型真实窗口，口径再准 85% 触发线仍悬在真实窗口外，压缩照样来不及触发。**「默认窗口下调对齐模型真实窗口」应提进批 1 施工项**（一行改动 + 用户确认），否则批 1 交付后 bug 依旧。
2. **批 2 地基（@溯源修正）**：原评审称「goal 概念不存在、地基缺失」——溯源证伪：`Plan.kt` 仅模式标记属实，但 **`dsh/goal/Goal.kt:17-22` goal 生命周期真实存在且生产接线**（id/status/rounds + `goal/change` 事件 + goal.set/complete/status 三工具 `MainActivity.kt:1795-1832` + 轮次驱动 `:3790-3804` @dfa90d3）。真实缺口收窄为：**GoalDomain 无 `restoreFrom`（重启/会话恢复后活跃目标丢失，对比 PlanModeController 有 `:30-37`）——批 2 前置必须先补 goal 恢复**（已登记挂账-GoalDomain无日志恢复），否则 goal 级豁免重启后无锚点。另注意：「允许本轮」重启即失是 ApprovalService 有意的安全设计，扩为 goal 级 = 放宽存续期，卡面须明说这是否可接受。
3. **L3 缺基线 + 范围爬行（必收）**：「弹窗次数可量化下降」无现状基线——批 2 施工前先跑 3 个标准混合任务采基线落档，否则验收无从对比。「TokenMeter 聚合（P2 顺带做）」把 P2 塞进 P0 批，且新版无 TokenMeter 类（仅 `ContextBudget`），建议命名收为「usage 聚合层」并明确是否仍顺带。

---

## 八、分层溯源图（@2026-08-29，设计前溯源机制 v1.1 必做项）

> 核查基线：新版 `0027-mov @ dfa90d3`（dsh 包与 MainActivity.kt 对 main 无 diff）；老版 `MOV-APP-old @ ff8d67e`。只读核查。
> 位置纠偏：harness 真实源不在 MOV-APP-harness 仓库——token-meter 在 `harness-nolink.tar.gz`，user-approval 在 `dsh-approval\deepseek-harness-master\packages\interaction\user-approval\`（已核实：token-meter `CHARS_PER_TOKEN=4` 且 README 自认 CJK 低估；user-approval 瀑布 fail-closed `index.ts:317-329`，outcome 词表仅 allowed-once 是授权）。
> **置信度 = ⚠️（最弱层 L1/L4/L5/L6 均 ⚠️）**。

| 层 | 判定 | 证据（文件:行号 @commit） | 依赖声明 | 断点处置 |
|---|---|---|---|---|
| L1 用户可感知 | ⚠️ | 审批弹窗 = 三键 AlertDialog「允许本轮/允许本次/拒绝」`MainActivity.kt:3080-3096`（内容=工具名+原因+脱敏参数摘要 `:5539-5561`）；后台通知栏仅两键 `:3104-3110`；压缩非静默（surface 插「[历史摘要]」气泡 `Surface.kt:126-131` + `filesDir/compaction.log`）；**用量展示全零**（设置页/market-web 产物 grep 无命中；设置页是 WebView 桥，加展示需过 `SettingsSheet.kt:31` allowedPrefixes 白名单） | 触及 | **本单修**：批 1 用量展示过桥白名单；批 2 通知栏渠道补第三键或显式声明不支持 |
| L2 入口/桥接 | ✅ | 无害免弹 15 工具 `McpToolScheduler.kt:114-119` + file.write 工作区 `:126-152`（含 private 凭据写排除）；「允许本轮」= `turnAllowSet: ConcurrentHashMap<turn号, 工具名集>` 纯内存（`ApprovalService.kt:50-63`，`_`→`.` 规范化 `:56`，超 100 turn 清空 `:60`，重启即失系注释自述的安全取向）；检查 `:127-132`、记录 `:161-163`、调度消费 `:294-304` | 依赖 | 批 2 需新存储点（仿 turnAllowSet 加 goalAllowSet，key=goal id）+ 向 ApprovalService 注入 goal provider（现无 goal 引用） |
| L3 服务/数据 | ✅ | usage 链逐环属实：`DeepSeekAdapter.kt:245-261`（cache 已减出 prompt）→ `TokenUsage LlmTypes.kt:88-94`（DISJOINT 口径）→ `Assembler.usage :139-140` → 落事件 `AgentLoop.kt:411-415` → 编解码 `EventCodec.kt:218-238`；OpenAiCompat `:306-322` 同款；压缩消费 `AgentLoop.kt:302` → `ContextBudget.kt:82-90`；引擎 `BasicCompactionEngine.kt:36-43,53-54` | 依赖 | 聚合层回放 assistant/message 事件 usage 字段累加即可（harness ReplayState fold 是现成范式） |
| L4 运行时装配 | ⚠️ | 装配 `MainActivity.kt:3809`、默认窗口 `:161`=1000000（注释自称「实测 DeepSeek ≥900K」）、1M/5K 切换 `:1144-1147`（注释称有 128K 档，码不符）；85% 线 `ContextBudget.kt:36,47` + `AgentLoop.kt:303`；**上游真实窗口零代码/配置体现**——`ModelRegistry.ModelEntry` 无 contextWindow 字段（`ModelRegistry.kt:20-33`），切模型不同步窗口，1M 是全局拍脑袋值；**双阈值并存**：ContextBudget 0.85 vs `BasicCompactionEngine.thresholdRatio=0.8 :27`（装配未覆盖，现由 85% 先门控不爆雷） | 依赖 | **本单修（批 1）**：窗口下沉为 ModelEntry 字段（切模型跟随）；双阈值收敛单一事实源 |
| L5 能力实物 | ⚠️ | char/4 实物 `ContextBudget.kt:75`；老版加权 `ContextBudget.java:37-52 @ff8d67e` = ASCII×0.3 / CJK×0.67（1/1.5，UPG-38 实测口径）/ 其他×1.2、ceil 取整，10 行纯静态直接抄得动（注意老版注释头写 CJK×1.0 与常量不符，以常量为准）；老版聚合 `TokenMeter.java:34-58` = SharedPreferences 日/月/模型三轴 + `MONTH_QUOTA=5_000_000 :25`；新版无 TokenMeter 类属实；**goal 概念存在且生产接线**（`Goal.kt:17-22` + goal.set/complete/status 工具 `MainActivity.kt:1795-1832` + 轮次驱动 `:3790-3804`），但 **GoalDomain 无 restoreFrom**（重启丢目标） | 依赖 | 批 1 移植老版加权（CJK 按 0.67 非 1.0）；批 2 前置 = 补 GoalDomain 日志恢复（已登记挂账） |
| L6 持久化/事实源 | ⚠️ | usage 落盘 = 会话 JSONL `assistant/message` 事件 usage 字段（`EventCodec.kt:392,218-227`），唯一写点 `AgentLoop.kt:413`，平行数据源检查干净；审批豁免纯内存不持久化（`ApprovalService.kt:48-50`）；审批模式（ask/免确认）走 `recordApprovalPolicy` 事件可恢复（`MainActivity.kt:5568-5578`）；**月配额/用量全仓零存储点** | 依赖 | 聚合层只做派生视图（replay fold，不落自有存储防第二写点）；配额存储从零建（若仿老版 SharedPreferences 即引入第二写点，须在卡面裁决） |

**溯源附带发现（与卡面无关缺陷，已登记挂账）**：GoalDomain 无日志恢复（批 2 直接前置）；压缩双阈值口径漂移 + `MainActivity.kt:160` 注释与代码不符。见 `处理中心\挂账登记表.md`。
