# 输入内容 ↔ MCP 工具 联动机制 · 设计 v3.1（冻结补丁：Plan 模式）

> 设计师 @2026-09-02 ｜ 大神 v3 冻结 ｜ **v3.1 唯一补丁：Plan 模式（顺序真相层）**——用户定：plan 模式没做好，工具联动必乱（连顺序都不知道）→ 补「计划优先」契约

---

## 〇、补丁一句话

> **AI 先出结构化 Plan（工具步骤 DAG），用户/系统可见顺序、可校验、按序执行——模型不即兴调用，顺序有唯一真相。**

---

## 一、问题（v3 缺口）

v3 流水线：`输入 → 候选 → 决策(CALL) → 参数 → 安全门 → 执行`——**单步视角**：
- 多工具**顺序**哪里来？——**模型多 tool_calls 即兴**（协议层无序/并发），**顺序是隐式的**，用户/开发者**无法知道**「先查高铁还是先查酒店」
- Conditinal 分叉依赖**前一步结果**——**没有 plan 表，A→B→C 的依赖没有显式化**
- 失败了重排/中断？——**没有计划状态机**，只能靠模型重试（乱）

**后果**（用户原话）：联动乱、顺序不知道——**plan 是联动的「顺序真相源」**。

---

## 二、Plan 模式契约（补丁核心）

### 2.1 两段式（先 Plan 后执行——不是即兴 tool_calls）

```
[阶段 1 · Plan 生成]
  输入 → 上下文组装 → Plan Generator（结构化输出）
    planId / steps[] / Plan 状态机
    ↓ 校验（依赖闭环/工具存在/循环检测/风险预分级）
[阶段 2 · Plan 执行]
  按 steps 顺序 → 每步走 安全门→参数校验→执行→结果 → 下步（喂上下文）
    → 完成/失败（失败→中断→人工/重排）
```

### 2.2 Plan 数据结构（顺序唯一真相）

```json
{
  "planId": "p-20260902-0001",
  "status": "PENDING|RUNNING|DONE|FAILED|HALTED",
  "steps": [
    {
      "order": 1,
      "tool": "travel.query",
      "args": {"from": "北京", "to": "上海"},
      "dependsOn": [],
      "risk": "L1",
      "confirmation": "none",
      "expectedOutput": "车次列表",
      "fallback": "NO_CALL"          // 本步失败→中断? 替换?
    },
    {
      "order": 2,
      "tool": "hotel.list",
      "args": {"city": "上海"},
      "dependsOn": [1],               // 显式依赖（Sequential）
      "risk": "L1",
      "confirmation": "none"
    }
  ]
}
```

### 2.3 Plan 校验（执行前机器闸——不是模型自我检查）

| 校验 | 规则 |
|---|---|
| 依赖闭环 | dependsOn 引用的 order 存在且 < 当前（DAG 无环） |
| 工具存在 | tool ∈ 注册表（含 Overlay 增强） |
| 参数合法 | 走 Argument Validation（缺参/歧义/非法） |
| 风险预分级 | 每步 risk 预判——L3 步骤**计划确认**（用户看 Plan 时一并批准高危步） |
| 循环检测 | 同 plan 内禁止 A 依赖 B 且 B 依赖 A |

### 2.4 Plan 展示（顺序可见——用户/开发都能看）

- **Dev Console / Trace**：Plan 视图（步骤列表+依赖箭头+risk 徽章）——**回答「顺序是什么」**
- **用户面**（可选开关）：plan 步骤预览（「将依次执行：查车次 → 查酒店」）——**L3 步在 Plan 确认时先行批准**
- **traceId 绑定**：Plan 全程落 Tool Call Trace（v3 补丁继承——`planId` 字段加入）

### 2.5 执行状态机

```
PENDING → RUNNING（逐 step）
  ├─ step OK → 结果喂上下文 → 下 step
  ├─ step FAIL(fallback=NO_CALL) → 跳过继续（合法降级）
  ├─ step FAIL(不可降级) → FAILED → 中断（报告 planId+失败步）
  └─ 用户取消/超时 → HALTED
RUNNING → DONE（全 step 完成或降级完成）
```

---

## 三、与 v3 的关系

| v3 元素 | 与 Plan 关系 |
|---|---|
| P0-3 NO_CALL | Plan 内步骤可=NO_CALL 降级（合法） |
| P0-4 三模式 | **Plan 的 dependsOn 显式表达三模式**：无依赖=Parallel（order 相同允许）/顺序依赖=Sequential/条件步=Conditional |
| P0-2 参数校验 | Plan 构建时预校验 + 执行时再校验（双道） |
| P0-1 安全门 | Plan 确认时预分级 + 每步执行门 |
| Trace | planId+steps 加入 trace（顺序可查） |
| 度量 | 增加 **Plan Accuracy**（计划正确性：步骤对/顺序对/依赖对）——七指标 |

---

## 四、验收测点（补丁）

- **P1-1** Plan 化执行：输入触发步骤序列=模型输出的一致（先查车次→查酒店=顺序保证，非并发乱序）
- **P1-2** DAG 校验：构造循环依赖 plan → 执行前拒绝（机器闸）
- **P1-3** 失败降级：step 失败 fallback=NO_CALL → 跳过继续；不可降级 → FAILED 中断+planId 报告
- **P1-4** 顺序可见：Trace/Dev Console 可读步骤顺序+依赖（「顺序是什么」有答案）
- **P1-5** 并行合法：无依赖 steps 允许并发（order 相同）——Parallel 保语义
- **P1-6** Mutation：删除 dependsOn 顺序 / 循环依赖注入 → 必红

---

## 五、结论

v3.1 = v3 + **Plan 模式**（顺序真相层）——**plan 模式做好=工具联动不再乱**：顺序结构化、DAG 可校验、失败有状态机、顺序处处可见。**并入 UPG-46 施工范围（升级为 v3.1 口径）**。
