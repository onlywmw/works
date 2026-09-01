# UPG-44 派单：AcceptanceJudge B1（观察层）——UPG-06 批2 剩项

> 设计师 ｜ 2026-08-30 ｜ 优先级 **P1**（防编造观察层，工作量小）
> 来源：UPG-06 确定性防编造三件套 批2；**GoalGate 已销项 @2026-08-30**（§十一.1 三候选全排除，用户确认）；剩余 AcceptanceJudge **B1 起步**（§十一.2 定案）。

## 一、方案

`设计师/方案设计/UPG-06_确定性防编造三件套_方案设计.md` §十一.2（B1 定案）+ 批2 设计（§二.5）。

**一句话**：问答型/核对类任务，按「用户显式指定标准」做对拍——journal 本地持 expected + 投影剔键 + 对拍结果落 journal（**观察层：不拦截、不重试**，治用户感知不治模型行为）。

## 二、施工范围（老版 AcceptanceJudge.java:69 + AgentLoop.java:1092-1127 挂载点移植为参考）

1. **journal 侧持 expected**：用户指定标准（「按这份标准核对」形态 = B1 触发）落 append-only 事件（老版 `criteriaEvent` 对应物），**绝不发给模型**。
2. **投影剔键**：`projectForModel()` 剔答案键 / expected（发给模型的内容不变——Token/KV 无影响）。
3. **对拍落 journal**：模型回答 vs expected **exact-equals** 对拍 → pass/fail + 差异入 journal 可查（L3 验收点）。
4. **仅问答型/核对型启用**：以「用户显式指定标准」为触发（B1）；建议性/询问语句**不拦**（老版豁免语义保留）。
5. **事件类型先入 `KNOWN_SESSION_EVENT_TYPES`**（KnownEventTypes.kt）+ schema 字段齐全（裸事件重载会被当崩溃尾丢弃）。

## 三、红线

- expected **绝不发给模型**（journal 本地持 + 投影剔键）——硬红。
- 不改变工具注册/调用签名；execute 面不动；只加观察+反馈层。
- 观察层**不拦截、不重试、不阻止流式上屏**（只能事后对拍+落 journal）。
- 事件类型先入 `KNOWN_SESSION_EVENT_TYPES`，字段 schema 齐全。
- Token/KV：发给模型内容不变；自跑 `node scripts/check-token-effect.mjs`。

## 四、验收

- **L1**：纯函数单测（journal 持 expected/投影剔键/对拍结果）+ 变异亲杀（删剔键/删对拍落 journal 必红）；`KNOWN_SESSION_EVENT_TYPES` 含新事件类型 + schema 字段断言。
- **L2**：桩替 LLM 适配器（DeepSeekAdapter 测试替身返回「无 tool_call 完成声明 / 标准答案不一致」）**走真实 AgentLoop 全链** → 验证对拍结果落 journal、**expected 未注入模型上下文**（journal 无对应 user/system 消息）、**session 重载后对拍结果可重建**。
- **L3**：问答型/核对型任务对拍结果入 journal 可查。

## 五、施工 / 认领

- 认领：工单表 UPG-44 行备注追加 `认领: <agent> worktree=mov-upg44 branch=feat/upg44 @<时间>`（规则19：开工先 fetch + 看表，基于最新 main 重切）。
- 完成后**登记两个表**（先表后库）：`工单表.xlsx` 程序员列 `✅UPG-44 完成` + 备注 `feat/upg44 <hash>（报告 DELIVERY_UPG44_*.md）`；`工单库.md` 状态改「程序员✅完成，待验收」；报告落 `程序员/交付报告/DELIVERY_UPG44_*.md` 写明「已登记两个表」。

## 六、复核锚点（@届时 main 审核）

- `AgentLoop.kt` journal 侧（挂载/落事件处）
- `KnownEventTypes.kt` 事件类型（`KNOWN_SESSION_EVENT_TYPES` 是否含新类型 + schema）
- 老版参考：`MOV-APP-old` 的 `capable/AcceptanceJudge.java`（69 行，exact equals）+ `AgentLoop.java:1092-1127`（挂载链）
