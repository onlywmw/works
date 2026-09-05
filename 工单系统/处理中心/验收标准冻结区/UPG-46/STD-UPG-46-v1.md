# STD-UPG-46-v1 验收标准冻结版

> 工单：UPG-46 ｜ 标题：工具联动 Runtime 契约（Tool Orchestration）· 段①核心契约 ｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-46-v1`
- **content_sha256**: `5038b6398e39cabf4b5edba40c4d1ec096d4ee8876dee185d8e2679c7392f4f4`（= 冻结区正文哈希，非整文件哈希；按文末命令计算）
- **frozen_at**: `2026-09-05T01:10:00`
- **frozen_by**: 设计师
- **approved_by**: 审验员 ✅ 会签 @2026-09-05（证据链审验通过——§P57/DEL-UPG-46-20260905-001/manifest 重算一致；UPG-103 先例口径补齐）

> ⚠️ 冻结区填完、content_sha256 回填后，**冻结区任何改动都视为标准变更**，只能走修订派生 v2，不得原地改。

---

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L2 中 | 业务逻辑/行为 → 单测计数核对 + 针对性真机 | ①Plan 两段式：结构化 Plan（steps+dependsOn）产出 → 校验 → 按序执行；②四类阻断实测；③互斥/优先级规则 |
| L3 高 | 状态机/权限/持久化 → diff 精读 + 变异亲杀 + 真机多场景 | ①Trace 落会话 journal（单写点，无平行数据源）14 字段齐、无 CoT；②L2/L3 风险确认门经 PermissionGuard 语义不变；③生产接线真实（消灭 MainActivity:349 死引用，非模块内自转） |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| Plan 校验锚 | 删掉循环依赖检测（或 dependsOn 闭环校验） | 「循环 Plan 被拒」定向用例必红（亲杀） |
| 四类阻断锚 | 移除「缺参」阻断分支 | 「缺参必阻断」定向用例必红 |
| Trace 单写点锚 | Trace 不落 journal（或落旁路文件） | 「journal 可见 trace 事件」锚必红；出现第二写点文件 = 直接判不合格 |
| NO_CALL 锚 | NO_CALL 被强制改判 CALL | 「NO_CALL 合法决策」用例必红 |
| 确认门锚 | L2/L3 风险绕过确认门直放 | 「L2/L3 必进确认门」用例必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 全量回归 | `testDebugUnitTest` 0 失败基线（基线 814/0/1 @841f591d；允许合理增量，申报计数） |
| 定向用例 | 新增契约锚用例（Plan 校验/四类阻断/Trace 落 journal/NO_CALL/确认门）全绿，计数申报 |
| 构建 | `:app:assembleDebug` 绿；提交版=验证版（全新检出复跑） |
| 证据链 | journal 工具调用链（含 trace 事件）+ 关键截图（含时间戳）+ 命令/产物输出 四环节完整 |
| 真机 L2 | 给定输入 → Plan 可见（日志/审批面）→ 工具按序执行 → 结果回填，截图/journal 可见「目标达成」 |

### 接口契约

- 施工口径唯一来源：`设计师\方案设计\03_工具联动\输入与MCP工具联动机制_设计_v3.2_2026-09-05.md`（v3 断链重建版——含分层溯源图与强化/新开对账）
- 复用资产接线（ToolOrchModel/DagPlanner/EffectSpecs/ToolCallScheduler/McpToolScheduler.dispatch）语义以 v3.2 §三为准；ToolOrchestrator 关键词决策器不动（Evaluator baseline 依赖）
- 共享面申报：本单触及 MainActivity 装配段 + 协议层（Plan JSON）→ 交付报告必附《共享面影响清单》+ coverage_status 三档（红线 24）

### 销项条件（本单「合格」= 下列全满足）

- [ ] D1 Plan 两段式实测通过（结构化 Plan → 校验 → 按序执行）
- [ ] D2 journal 可见 trace 事件、14 字段齐、无 CoT、无第二写点
- [ ] D3 互斥/优先级 + 循环拒绝实测
- [ ] D4 四类阻断各 ≥1 用例实测
- [ ] D5 全量 0 失败 + 定向用例全绿 + assembleDebug 绿（提交版=验证版）
- [ ] 变异亲杀 5 锚全红→还原复绿
- [ ] 真机 L2 实证 + 证据链四环节完整
- [ ] 交付绑定 DEL-UPG-46-*（code/artifact/manifest 三重 hash，manifest 机制产出）+ 共享面影响清单 + Token/KV 两节申报

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

> 追加格式：`| 时间 | 作者 | 触发原因 | 说明 |`。追加只入本区，**不得回填进冻结区**。

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-05 | 设计师 | 派单前治理修复 | v3 设计文本体断链（全仓+备份搜索确认不存在），施工口径重建为 v3.2；本 STD 判据与 v3.2 §四一一对应 |

---

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-46-v1.md"
```

> 校验：验收 / 审验 / 合 main 抽查时重跑同命令比对；不一致 = 标准被改，阻断并走修订。
