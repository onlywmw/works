# MOV 元能力注册表 — 架构设计稿 v0.3

> 用途:给架构评审。背景:**MOV** 是 Android 端 AI 管家(办事 + 懂你)。本稿定义能力体系的**分层架构**。读前无需本项目其他上下文,自包含。
>
> **评审结论 R2(有条件冻结,8.8/10)**:方向通过。以下 P0/P1 已全部吸收进正文:
> **P0** ①consumer 独立性 ②Job 三件套拆分 ③审批组执行语义 | **P1** ④Schema Validation Gate ⑤retry_policy 语义 ⑥bundle 最小接口 + 单向依赖。补完即冻结能力层进入实施。
>
> 核心立场一句话:**LLM 负责理解和穿线,注册表负责能力边界,bundle 负责确定性骨架,runtime 负责执行,UI 负责呈现。AI 自由度被关进正确的位置。**

---

## 1. 三层各回答什么

| 层 | 回答的问题 |
|---|---|
| 元能力注册表 | **能不能做?副作用是什么?** |
| Bundle / Job 契约 | **几个能力怎么组成一个稳定的办事骨架?** |
| UI(卡壳) | **人在哪一步、以什么形式参与?** |

总览(运行时数据流):

```text
用户意图 → LLM 解构 → 匹配 Bundle(确定性骨架)
   → Job 图(JobSpec 静态 / JobRuntime 运行 / JobView 呈现)
   → 逐 job 查元能力注册表(能不能做/副作用/env/schema)
   → Schema Validation → 审批(ApprovalGroup)→ 路由 impl → JobRuntime 执行
   → CardShell 渲染 JobView → 人机交互
```

**元能力** = 「动词 + 一个稳定业务对象域」的不可再分操作,带显式副作用契约,可挂多家实现方。
**注册表** = 这些能力的登记表(场景组合、审批分级、实现路由、UI 弹卡的共同唯一依据)。只登记**地基**,不登记场景包/流程/整套 MCP。
**bundle** = 静态工作流骨架(固定必需的 job 序列与呈现方式);**job 视图** = 运行时对「一步要办的事」的呈现描述(§6.3)。

直觉判据(算不算一条元能力):**一句话能对它提需求 / 一个测试能验完它 / 一次实现不依赖本表其他行**。
**合并判据**:两能力在场景里总是成对出现、从不单独消费 → 考虑合并(防「为拆而拆」)。

---

## 2. 表结构(schema)

一行 = 一条元能力。字段按用途分四组:

### A. 身份

| 字段 | 示例 | 说明 |
|---|---|---|
| `id` | `fulfill.dispatch` | 命名空间.动词_对象,全局唯一,不可再拆的最小动词单位 |
| `name` | 派单 | 人类可读名 |
| `semantics` | 把一个履约任务指派给一个可执行运力 | 一句话语义;在 WRITE/MONEY 审批卡展示给人二次校验(§5) |
| `domain` | `fulfill` | **稳定业务对象域**,非技术分类。`camera.capture` 归 `sense.capture`,不归 `device.camera.capture`——表管能力语义,不管 Android API 分类。不开 system/common/other 垃圾桶域(§9.1) |

### B. 契约(副作用显式化,最值钱的部分)

| 字段 | 取值 | 说明 |
|---|---|---|
| `side_effect` | `READ` / `WRITE` / `MONEY` | 审批 / UI 弹卡 / 执行 / 重试 / 安全的唯一依据 |
| `env` | `LOCAL` / `EXTERNAL` | 设备内 / 出网外呼 |
| `in` / `out` | JSON Schema | 机器可校验;LLM 只读它来对参 |
| `idempotent` | 布尔 | **= 是否具备重复调用的语义安全性**,不是「该不该重试」。自动重试策略归 Runtime Policy。演进方向 `retry_policy { retryable, max_attempts, retry_on[], reconcile_before_retry }`(支付超时先查单、不盲目重试);MVP 保留布尔 |

### C. 实现方(路由层)

| 字段 | 说明 |
|---|---|
| `impls[]` | `{ impl_id, provider(自营兜底/外部平台), base_cost, latency_ms, region, status }`。外部整套 MCP 工具组 → 只把与本条对齐的方法映射成 impl 挂进来:外来的整用,内部组合仍按元能力走 |

### D. 治理(防腐化)

| 字段 | 说明 |
|---|---|
| `owner` | 责任作者(登记/验收/清退背书)。**candidate 有 owner,临时工具没有** |
| `evidence` | 消费者证据(验收记录号)。**不许无证据进表** |
| `state` | `candidate → registered → deprecated → removed` |
| `consumers` | **结构化消费者证据,含独立性与 bundle 引用图**(见下)。非空是 registered 必要条件;也是 candidate→registered 计数来源;删除前先查它 |

`consumers` 不是字符串数组,而是:

```ts
ConsumerEvidence {
  consumer_id
  consumer_type      // bundle | workflow | scenario
  domain_context     // 归属业务目标(防同 bundle 多入口刷数)
  usage_signature
  first_used_at
  acceptance_record
}
```

**晋升判据 = `independent_consumer_count ≥ 2`**——两个消费者必须来自**不同 bundle 或不同业务目标**,否则不算独立(外卖首页/详情/快捷入口 是同一 bundle,count 仍 =1)。

---

## 3. 登记纪律(写死,不可绕)

1. **只登记地基,不登记场景包/流程/整套 MCP。** bundles 只引用本表、不复制实现、不占表行。
2. **粒度判据:被 ≥2 个独立消费者复用(candidate → registered)。** 单消费者独用 = 临时工具挂场景内,不占表。合并判据反向防拆(§1)。
3. **副作用/环境不写死在业务代码里,一律读表。**
4. **不可绕过架构规则**:任何 Runtime Policy(审批 / UI 弹卡 / 重试 / 路由)不得按 capability `id` / `domain` 写业务 if-else 判断副作用。禁止 `if (cap === "settle.pay") requireApproval()`;只能 `policy = cap.side_effect`。否则半年后注册表失效。

---

## 4. 生命周期与消费者证据

```
场景缺位 → 第 1 个消费者引用 → 登记 candidate(owner + 意图 + evidence),可正常用
         → 第 2 个独立消费者引用 → independent_consumer_count = 2 → 触发 registered 评审
registered 后 30 天无新引用 → deprecated
deprecated → 删除前必须先查 active bundle 引用图:
           还有 bundle 在用 → 不能直接 removed(bundle 先迁走)
           无 bundle 引用     → removed(删除,不是存档)
```

- **candidate 可被正常使用**——否则注册表会变成创新阻塞器(没能力→不能做→先申请→等审核→才能开发)。
- **candidate ≠ 临时工具**:candidate 有 owner + 登记意图;临时工具没有,单场景内、不占表、不背治理。
- 注册表是**活地图,不是功德碑**。无消费者 = 清走。

---

## 5. 运行时链路(能力层数据流)

1. **场景解构** — LLM 把用户原话拆成 jobs;每 job 落「动词 + 业务对象域」。
2. **查表** — 命中得 `id / side_effect / env / in-out schema`。**词表封闭**:只在已登记的路上寻路。
3. **查表兜底**(LLM 是概率系统,会硬凑,必须给显式分支不靠自觉):
   - **不命中** → 明说「这个我还没学会」+ **记缺位证据**(= candidate 来源通道)。宁可说不会,不硬凑。
   - **命中但低置信** → WRITE/MONEY 审批卡**展示 `semantics`** 给人二次校验:人审「用错能力没有」,不只是「钱要不要花」。
4. **Schema Validation Gate**(命中后、审批前)——审批**不是用来补 LLM 参数缺失的**:

```text
Capability Match
   → Input Contract Validation
        ├─ 参数缺失 / 类型错 → 补槽位 Input 卡(补齐才放行)
        └─ 完整              → 进审批 / 执行
```

5. **编排** — jobs 按依赖 + 轻重缓急排时间线(bundle 骨架 + 槽位填充,不进注册表)。
6. **审批聚合 — ApprovalGroup**(不逐张轰炸):

```ts
ApprovalGroup {
  group_id
  items[]                      // 被聚合的 WRITE/MONEY 条目,逐条独立授权
  concurrency: SERIAL|PARALLEL // MONEY 串行(前单未决后单挂起,fail-closed);WRITE 并行,受 dependency 约束
  commit_policy                // 一次提交
}
```

**执行语义(冻结)**:逐条独立授权、一次提交;依赖失败则阻断下游——

```
A ✓ → execute      C ✗ → skip
B ✓ → execute      D depends C → blocked
E 独立 → execute
```

7. **路由** — 每 job 从 `impls[]` 选实现方:自营兜底优先,外部按区域/成本/可用性插拔。

---

## 6. Bundle 与 Job 契约(承重墙,全链路能否接上的关键)

### 6.1 结论:渲染提示由 bundle 产出,LLM 只解构 + 查表,不产渲染决策

若让 LLM 同时判断能力/决定流程/决定 UI,同一句话三次跑可能「选择卡/确认卡/直接执行」各来一次——对长期产品不可接受。改为:**bundle 静态描述骨架与呈现,LLM 运行时只做「意图 → 匹配 bundle → 填槽位」**,不自由拼装、不决定 UI。

### 6.2 Bundle 最小接口(冻结;完整治理——版本/owner/评审/废弃——另立文档)

```ts
Bundle {
  bundle_id
  version
  jobs[]: JobSpec
  capability_refs[]
  owner
}
```

两条硬规则:
- **R1 单向依赖**:bundle 引用 capability;capability **不知道** bundle 细节。
- **R2 capability deprecated ≠ 立即删除**:先查 active bundle consumers(§4)。

### 6.3 Job 三件套(拆分,防止 job 视图长成万能 DTO)

| 件 | 谁产出 | 内容 | 回答 |
|---|---|---|---|
| `JobSpec` | bundle 静态 | `job_id, capability_id, depends_on[], input_mapping, output_mapping, render_hint` | 这步**理论上**是什么 |
| `JobRuntime` | 运行时 | `job_instance_id, job_spec_id, state, input, output, selected_impl, approval_state, error` | 这次**执行成**什么样 |
| `JobView` | 运行时投影 | `job_instance_id, shell_type, content, components[], options[], status` | 用户**现在该看到**什么 |

**render_hint(bundle 静态、确定性)→ JobView(运行时实例、带状态)。** 渲染提示至少要回答:

```text
哪个 job → 哪张壳                (side_effect 定)
         → 壳的哪个 slot 填什么值   (来自 out / 中间态?字段来源写明)
         → 哪个 slot 挂哪领域组件   (组件引用 + 参数来源)
         → 决策选项从后端哪个字段读 (选项列表字段名)
```

---

## 7. UI 渲染分层:卡片 = 壳,内容分离

### 7.1 卡壳由副作用定,内容由 job 数据填

| 副作用 | 弹什么 |
|---|---|
| `READ` | **不上卡**,自动执行,只推进度(感知而不打扰) |
| `WRITE` | 确认卡(一次/按记忆) |
| `MONEY` | 审批卡(倒计时 / fail-closed) |
| 需人看/操作特定内容 | 挂**领域组件**(地图选点、签名、扫码…) |

壳的类型全世界一样(MONEY 卡长得一样);内容由该 job 的 JobView 填。壳内容彻底分离 → 加新场景不写新界面。

### 7.2 「填」的是三类东西,不是展示字

1. **展示重点** — 值/文案(「已确认 3 人,18:00」)
2. **决策选项** — 确认 / 拒绝 / 换一个(选项从后端字段读,卡不写死)
3. **输入入口** — 仅当这步真需要人输入才出现

### 7.3 UI 侧复用单位,和元能力同构

- **通用交互卡**:确认/选择/输入/进度/结果,数量封顶,按副作用分级。
- **领域组件**:一次实现、多处复用(地图组件一次,任何场景要「选个位置」都挂它)。渲染提示 = 引用 + 参数,不复制实现。守同一条:被 ≥2 场景引用才算数。

### 7.4 渲染器壳不变 → 加场景不写新界面

CardShell 拿「JobView + 渲染提示」,在卡库与领域组件里现找。壳不变、卡库封顶、组件一次实现——新增场景只多一个 bundle,不多一套 UI。

### 7.5 审批聚合 UX(方案 B):一张卡,逐条勾选,一次提交

内容区挂「审批条目列表」领域组件,每条可单独勾选/备注,一次确认(避免五连卡轰炸)。部分勾选 / 拒绝 / 依赖阻断的执行语义由 §5 ApprovalGroup 契约规定,UI 只呈现不自行解释。

---

## 8. 为什么这次不会像 atom 那样死(对照)

| 维度 | 旧 atom 注册中心(已废) | 本稿 |
|---|---|---|
| 登记对象 | 整套 MCP/原子,61+ 无抽象 | 不可再分的地基,几十条封顶 |
| 分类 | 关键词自动猜 | 稳定业务对象域 + 显式枚举,人工审 |
| 副作用 | 无 | 一等公民,所有 Runtime Policy 读它,禁 id if-else |
| 消费者 | 无,注册了没人用 | 结构化 evidence + **独立消费者计数**,空即清退 |
| 生命周期 | 一次性注册,只增不减 | candidate → registered → deprecated → removed,删前查 bundle 引用 |
| 流程/UI | 无概念,每场景现写 | bundle 静态骨架 + Job 三件套 + 卡壳复用 |

核心差异一句话:**旧表登记「东西」,本表登记「动作」;旧表靠关键词分类,本表靠副作用契约 + 独立消费者证据治理。**

---

## 9. 待裁决(收窄后的剩余项)

1. **domain 语义已定**(稳定业务对象域、不开技术域)——待定的是 **MVP 开哪些域**。建议 `fulfill` + `settle` 先开(够跑闭环);`sense` / `identity` / `location` 等有真实场景需求再开,宁缺毋滥。
2. **MVP 试跑组合**(采纳评审):副作用三级全覆盖——`fulfill.dispatch`(WRITE)+ `fulfill.track`(READ)+ `settle.pay`(MONEY),一条闭环演示「解构→查表→兜底→Validation→审批(ApprovalGroup/MONEY 卡)→路由→JobRuntime→UI→复用」。
3. **§1 直觉判据 + 合并判据**够不够当审入标准?
4. **bundle 完整治理**(版本/owner/评审/废弃)已声明另立文档——何时立、与注册表治理谁先冻结?
