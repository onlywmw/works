# UPG-44 AcceptanceJudge B1（观察层）方案设计

> 设计师 ｜ 2026-08-30 ｜ 优先级 P1 ｜ 独立拆卡自 UPG-06 批2（GoalGate 已销项@2026-08-30，用户确认 §十一.1）
> 上级方案：`设计师/方案设计/UPG-06_确定性防编造三件套_方案设计.md` §十一.2（B1 定案）+ 批2 设计 §二.5

---

## 一、定位 / 一句话

**问答型/核对型任务，按「用户显式指定标准」做 exact-equals 对拍，结果只落 journal（观察层，不拦截、不重试）——治用户感知（让用户看清 AI 有没有按标准核对），不治模型行为。**

## 二、背景（为什么 B1 起步）

老版 `AcceptanceJudge.java`（69 行）预期作为防编造/验收闸。溯源（规则20）确认：
- 老版 **expected 实为 journal 本地持**（`criteriaEvent` 落 append-only + `projectForModel()` 剔答案键），**非**远程服务端；
- `pass()` 是 **exact equals**，只适用**有确定答案**的问答型任务；
- 但老版把「expected 从哪来」悬空 → 决策点 2 悬空 → 批2 挂起。

**v4 §十一.2 用户拍板**：expected 来源 = **B1 用户显式指定**（「按这份标准核对」形态，MOV 管家办事场景）**起步**；B2 市场任务自带（任务卡 schema 无此概念）**留待市场任务体系成熟再议**。→ 批2 可起步，拆卡 UPG-44。

## 三、方案（B1，观察层）

| 要点 | 设计 |
|---|---|
| **expected 来源（B1）** | 用户显式指定标准（「按这份标准核对」）→ 触发对拍；**B1 即问答型/核对型任务识别机制**（有用户指定标准 ⇒ 视为问答型，启用本闸）|
| **journal 本地持 expected** | expected 落 **append-only 事件**（老版 `criteriaEvent` 对应物），**绝不发模型** |
| **投影剔键** | `projectForModel()` 剔答案键 / expected —— 发给模型的内容**不变**（Token/KV 无影响）|
| **对拍落 journal** | 模型回答 vs expected **exact-equals** → `pass/fail` + 差异 落 journal（可查，L3 验收点）|
| **粒度** | turn 级；仅问答型/核对型启用 |
| **事件契约** | 事件类型先入 `KNOWN_SESSION_EVENT_TYPES`（KnownEventTypes.kt）+ schema 字段齐全（裸事件重载会被当崩溃尾丢弃）|

**观察层语义（重要，交付必须写明）**：只对拍 + 落 journal，**不拦截、不重试、不阻止流式上屏、不改模型上下文**。误差/AI 绕过属结构性（治用户感知不治模型行为）。建议性/询问语句**不拦**（老版豁免语义保留）。

## 四、分层溯源（规则20，只读核查锚）

| 层 | 判定 | 证据/锚 |
|---|---|---|
| L1 用户可感知 | ✅ | 对拍结果落 journal 可查（用户/复查可见）|
| L2 入口 | ✅ | journal 事件写入（`KnownEventTypes.kt`）+ 复核锚 `AgentLoop.kt` journal 侧 |
| L3 服务/数据 | ✅ | expected 持 journal（本地，无远程）|
| L4 运行时 | ✅ | 观察层钩子接入 AgentLoop（不拦截，只读对拍）|
| L5 能力实物 | ✅ | 老版 `AcceptanceJudge.java`(69行) + `AgentLoop.java:1092-1127` 挂载链（MOV-APP-old 参考）|
| L6 事实源 | ✅ | expected=用户指定标准（B1），唯一事实源=用户指令 |

注：本卡为**移植+观察层化**（非接线 demo），底座为实物；断点处置=全部【本单做】。

## 五、验收标准

- **L1**：纯函数单测（journal 持 expected / 剔键 / exact-equals 对拍）+ **变异亲杀**（删剔键 → 必红；删对拍落 journal → 必红）；`KNOWN_SESSION_EVENT_TYPES` 含新事件类型 + **schema 字段齐全断言**。
- **L2**（桩，隔离实例）：替 DeepSeekAdapter 测试替身返回「无 tool_call 完成声明 / 标准答案不一致」→ **走真实 AgentLoop 全链**（`:418-425` 分叉，禁另起旁路）→ 断言：① 对拍结果落 journal（schema 合规、turn 包裹）② **expected 未注入模型上下文**（journal 无对应 user/system 消息）③ session 重载后对拍结果可重建。
- **L3**：问答型/核对型任务对拍结果**入 journal 可查**（真实数据或桩剧本）。

## 六、红线

1. **expected 绝不发模型**（journal 本地持 + 投影剔键）——硬红。
2. 不改变工具注册/调用签名；execute 面不动；只加观察+反馈层。
3. 观察层**不拦截、不重试、不阻止流式上屏**（只能事后对拍+落 journal）。
4. 事件类型先入 `KNOWN_SESSION_EVENT_TYPES`，字段 schema 齐全。
5. Token/KV：发给模型内容不变；自跑 `node scripts/check-token-effect.mjs`。
6. 定位声明：治用户感知不治模型行为；交付报告写明，验收对漏拦不设超预期质疑。

## 七、Token / KV 申报

- **Token**：0（expected 不发模型，纯 journal 侧）——模型上下文零变化。
- **KV Cache**：不触请求链路，前缀不变。
- 交付前自跑 `node scripts/check-token-effect.mjs`。

---

## 附：老版参考（MOV-APP-old）

- `capable/AcceptanceJudge.java`（69 行）：expected 持记录 + `projectForModel()` 剔键 + `pass()` exact-equals。
- `AgentLoop.java:1092-1127`：claimFeedback → FabricateGuard.guard → GoalGate.evaluate → AcceptanceJudge.pass/verdictEvent 挂载链（本卡只取 AcceptanceJudge 观察层化部分）。
