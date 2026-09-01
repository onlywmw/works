# DELIVERY_UPG44_2026-08-30.md

> UPG-44 AcceptanceJudge B1 观察层（UPG-06 批2 剩项）｜程序员 C｜交付 @2026-08-30 04:10
> 分支 `feat/upg44-c` @ **0c1b23b**（已 push origin）
> 基线：3263f10（动工当天 origin/main；含 UPG-40/UPG-01批3-3/UPG-27R1 验收落档）
>
> **🔗 双实例收敛 @2026-08-30 04:25**：本单由同代号 C 双会话并行交付（03:22 认领/03:35 另一 C 会话接管）——
> 两实现**等价**（`git diff 122945b 0c1b23b` 仅 4 文件：AcceptanceJudge.kt/Surface.kt/E2E/单测微差，
> 双方独立完成同一演进：M1 备选顺序修、Surface 剔键、399/0/0、变异 3/3、check-token 通过）。
> **以派单指定分支 `feat/upg44` @ 122945b 为准（已 push origin）**；本分支 0c1b23b 为等价副本存档；
> 本报告内容与 122945b 分别验证的成果一致（我方在受控 worktree 重放验证：全量 399/0/0 + 变异 A/B'/C 必红）。

## 〇、一页总览

| 项 | 结果 |
|---|---|
| Commit | `0c1b23b`（单 commit，13 文件：10 编辑 + AcceptanceJudge.kt + 2 测试） |
| 实现 | 纯函数提取/对拍 + 两个非 ignorable 事件 + 全链类型接线 + AgentLoop finally 观察挂载 |
| L1 | AcceptanceJudgeTest 13 用例 + E2E 4 用例全绿；全量 `399/0/0（1 skipped）`；变异亲杀 3 项必红 |
| L2 | 桩替 LlmStreamer 走真实 ReactLoopAgent 全链（禁旁路）：criteria/verdict 落 journal + expected 未注入 + 重载可重建 + 跨轮不注入 |
| L3 | 对拍结果落 journal 可查（E2E ③+④ 断言）；check-token-effect 通过 |
| 红线 | expected 绝不发模型（三层结构防御，见 §四）；不拦/不重试/不动工具与 execute 面 |
| 已登记两个表 | ✅（先表后库；工单表 E34 ✅UPG-44 完成 + H34 交付行；工单库卡「程序员✅完成，待验收」） |

## 一、撞车记录（重要·待仲裁意识）

施工中发现**另一个未认领的并行实现**同时出现在 `feat/upg44`（worktree `mov-upg44b`）：`capable/AcceptanceJudge.kt`（88 行，老版包名+TRIGGER/ASK 词表模式）+ 测试 127 行（引用未定义的 `SessionEvent.AcceptanceCriteria`，未接线、未提交、不编译）。处置：

1. **认领证据**：工单表 UPG-44 行唯一认领 = C @2026-08-30 03:22（worktree=mov-upg44 branch=feat/upg44）；对方无认领记录。
2. 我方首个 worktree `mov-upg44` 施工中途被外力删除（未提交内容丢失，已按全量快照重放）；`feat/upg44` 随后被对方 worktree 占用且两方文件互踩（对方实时覆盖 AgentLoop/还原 when 分支）。
3. 依「认领在案者优先 + 避免同分支双写」原则，**成品隔离到 `feat/upg44-c`（mov-upg44-c）**，以我方实现为准交付；对方实现（v1+v2 备份）存档于 `tmp/upg44_collision/` 供用户/设计师仲裁（合并 or 弃用）。
4. 交付形态：`feat/upg44-c` 分支 + 本报告。若验收方向认领迁移，可 cherry-pick `0c1b23b` 到 `feat/upg44`（线性，无冲突面：对方无提交）。

## 二、实现（方案 v4 §十一.2 B1 定案）

### 1. 纯函数 `dsh/guard/AcceptanceJudge.kt`（137 行，纯 JVM）
- `extractCriteria(text): AcceptanceCriteria?`（B1 触发提取）：
  - **M1**：`标准|答案 (应该|应为|就是|应|是|为|：|:) <值>`（「标准应为 42 元」）
  - **M2**：`(核对|对拍|比对)(一下)?[：:] <值>`（「按这份标准核对：42 元」）
  - 双条件：必须含核对类动词（核对/对拍/比对/对照/验一下/校验/检查是否符合）**且** M1/M2 命中；
  - 豁免（老版语义）：缺任一/空文本/提取值含疑问词（吗/呢/什么/多少/哪个/几/如何/怎么）→ null（诚实降级，建议性/询问不触发）
  - 提取值截断 ≤200 字；goal=标准前文 ≤80 字（审计）
- `judge(produced, expected): AcceptanceVerdict`：exact equals；expected 空→产出非空放行（老版 pass()）；fail 时 diff=产出（≤200 截断）；**观察层只产出结果**
- 正则注记：Kotlin/Java 正则 alternation **首优先**（非最长）——M1 长词前置（应为/应该 先于 应）

### 2. 事件（append-only journal，均非 ignorable=审计必读）
- `acceptance/criteria`：turnId/agentId/goal/expected/mode
- `acceptance/verdict`：turnId/agentId/goal/produced/pass/mode（**不含 expected**——即使投影/转储也零暴露）
- 全链类型接线：Session.buildEvent / EventCodec（typeOf+dataOf+fromMap）/ KnownEventTypes（+2 类型）/ Surface.type() / BasicCompactionEngine / SessionQuery / MovQueryTools / SqliteStore（sealed when 穷尽补齐 ×6）

### 3. AgentLoop 挂载（finally，turn/end 前；观察不拦截）
- ① 最近 UserMessage 文本提取 B1 标准（且同 turn 同 expected 未落过）→ `acceptance/criteria`
- ② 最新 criteria 无后续 verdict（跨轮续判）且已有非空 AI 回复 → exact 对拍 → `acceptance/verdict`
- runCatching 包裹 + Log.w("UPG44")——失败不影响 turn 收尾；不拦截、不重试、不碰 streamer/工具面

## 三、投影剔键（三层结构防御，红线）

1. **`SURFACE_EVENT_TYPES` 白名单**（user/message、assistant/message、tool/result、compaction/summary）不含本事件类型——`isSurfaceEligibleType()` false；
2. **事件类无 `surfaceOp` 字段**——结构上不可 surface 化（append 传入 SurfaceIntent 也会在 buildEvent 丢弃）；
3. **`deriveEventMessage` else→null**——即便未来被误加 surface，也不产生投影消息。

变异反验证（见 §五 B）：把 criteria 强行列入白名单 → surfaceOpOf 立刻抛「不 surface-eligible 不得携带 surfaceOp」/「surface-eligible 且必须携带 surfaceOp」→ 红线失败模式=硬错而非静默注入（三层同时失效才能注入，实践中不可达）。

## 四、测试与变异亲杀

| 层 | 内容 | 结果 |
|---|---|---|
| 单测（L1） | AcceptanceJudgeTest 13 用例：M1/M2/三降级（缺动词/缺短语/空）/三豁免（疑问/疑问尾/建议）/exact pass/fail/expected 空放行/200 截断 | 13/0 |
| 全链（L2） | AcceptanceJudgeAgentLoopE2ETest 4 用例：①criteria 落 journal（schema+turn 包裹+非 ignorable）②verdict 落 journal（pass=false+produced）③expected 未注入（journal 仅 1 条用户消息+适配器入参无 System 段）④重载（fromRestore）事件可读+投影仍 2 条；⑤跨轮用例（turn2 模型调用时 criteria 已在 journal → 无注入+deriveMessages 不增生）；对照组（闲聊/建议询问）零事件 | 4/0 |
| 变异 A | 删 AgentLoop 挂载（acceptanceJudgeOnTurnEnd 调用）→ E2E B1 主用例 **FAILED** ✓ 必红 | 红 |
| 变异 B | 剔键反验证（criteria 列入 SURFACE_EVENT_TYPES + deriveEventMessage 投影分支）→ 主用例+跨轮用例 **FAILED（2 failed）** ✓ 必红 | 红 |
| 变异 C | `judge` pass 恒真 → `judge 不等` 用例 **FAILED** ✓ 必红 | 红 |
| 全量 | `:app:testDebugUnitTest --rerun-tasks` → **399 tests / 1 skipped / 0 failures**（基线 382 + 新增 17） | 绿 |
| check-token | `check-token-effect.mjs 3263f10` → 通过（无 Token/KV 影响——事件非 surface，模型请求链不变） | 通过 |

## 五、L2/L3 覆盖说明

- **L2「桩替 LLM 走真实 AgentLoop 全链」** = E2E 测试（stub LlmStreamer 注入 `ReactLoopAgent`，经 finally 挂载落事件，禁任何旁路）——四断言+跨轮用例即验收要求全项；
- **L3「问答型对拍结果入 journal 可查」** = E2E ③（verdict 在 session.events 中可读+produced 对拍文本）+④（重载后可重建）；无需真机（观察层不涉及 UI/权限路径）。

## 六、红线核查

- ✅ expected 绝不发模型：三层结构防御 + verdict 无 expected 字段 + E2E ③/⑤ 断言 + 变异 B 反验证
- ✅ 不动工具注册/调用签名/execute 面：0 处工具面改动
- ✅ 观察层不拦截不重试、不阻止流式上屏：挂载在 finally（turn 已结束），无任何 streamer/executor 介入
- ✅ 事件类型先入 KNOWN_SESSION_EVENT_TYPES：`acceptance/criteria`+`acceptance/verdict` 已加（字母序首行）
- ✅ Token/KV：无影响（check-token-effect 通过）

## 七、登记

- 工单表.xlsx UPG-44 行：E34 `✅UPG-44 完成 @2026-08-30（feat/upg44-c 0c1b23b，报告 DELIVERY_UPG44_2026-08-30.md）`；H34 追加交付行（含撞车备注）
- 工单库.md UPG-44 卡：「程序员✅完成，待验收」（feat/upg44-c 0c1b23b；撞车说明见本报告 §一）
- 报告落 程序员/交付报告/DELIVERY_UPG44_2026-08-30.md——**已登记两个表**

## 八、遗留/挂账

1. **撞车仲裁**：对方未认领并行实现（存档 tmp/upg44_collision/capable_main*.kt/capable_test*.kt）——建议设计师/验收员知悉后决定弃用或合并（本分支为准）
2. `feat/upg44`/`mov-upg44b` 上对方未提交工作区文件由对方自理；本分支不接触
3. 我的首个 worktree（mov-upg44）被外力删除的根因未定位（疑其他 agent 的 worktree 清理误伤）——建议后续 worktree 清理脚本加保护（登记在案的 worktree 不删）
