# STD-UPG-104-v1 验收标准冻结版

> 工单：UPG-104 ｜ 标题：工具联动 Runtime 契约·段②（六指标评测集 + Safety Policy 确认门 + 多工具编排执行 + 记忆回流候选） ｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-104-v1`
- **content_sha256**: `e6d8a7f960dad4d12a60fa5b105898d694f908ec0fae11b5c6205b6755e2b5b5`（= 冻结区正文哈希，非整文件哈希；按文末命令计算）
- **frozen_at**: `2026-09-05T23:00:00`
- **frozen_by**: 设计师
- **approved_by**: 待审验员会签

> ⚠️ 冻结区填完、content_sha256 回填后，**冻结区任何改动都视为标准变更**，只能走修订派生 v2，不得原地改。

---

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L2 中 | 评测集/编排执行逻辑 → 单测计数核对 + 真机走查 | ①六指标评测集扩建全绿（NO_CALL / MULTI_CALL / 边界用例齐）；②Parallel / Sequential / Conditional 三模式端到端各 ≥1；③P&R 指标确定性（同输入两次跑分一致，非碰运气） |
| L3 高 | 安全门/记忆回流 → diff 精读 + 变异亲杀 + 真机多场景 | ①L0-L3 全分级实测，L2/L3 必进确认门（PermissionGuard 审批语义不变）；②own 分类器兜底（EffectSpecs 未登记工具不裸奔）；③memoryCandidate 实值填充 → 经记忆写链路落 PROPOSED，全链零自动 ACTIVE |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| A1 评测集锚 | 删 1 条 NO_CALL 正例（或把期望翻转为 CALL） | noCallPrecision / noCallRecall 指标必红（评测集防退化 = 亲杀） |
| A2 确认门锚 | L2/L3 风险绕过确认门直放 | 「L2/L3 必进确认门」定向用例必红 |
| A2 兜底分类器锚 | own 分类器恒返 L0（或置空返回） | 未登记工具的风险分级定向用例必红 |
| A3 三模式锚 | Parallel 并行分组塌缩为串行（或删 Conditional 分支求值） | 对应模式定向用例必红 |
| A4 回流锚 | memoryCandidate 直写 ACTIVE（或跳过 PROPOSED 候选态） | 「回流只产候选」定向用例必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 全量回归 | app 全量零新增失败（基线口径 @e396fab3 时点 844/2/1——2 预存红 = UPG-91 demoBridge 转办在案，须分类 diff 实证不新增）；tool-orch 套件 0 失败；允许合理增量，申报计数 |
| 定向用例 | 六指标扩建用例（NO_CALL ≥2 / MULTI_CALL ≥2 / 边界 ≥2）+ 三模式各 ≥1 端到端 + 确认门 L0-L3 全分级 + 回流候选 ≥1，全绿且计数申报 |
| 构建 | `:app:assembleDebug` 绿；提交版 = 验证版（全新检出复跑） |
| 证据链 | journal（trace 事件含 memoryCandidate 实值）+ 确认门弹卡截图（含时间戳）+ 命令/产物输出 四环节完整 |
| 真机 L2 | 一轮 Plan → 三模式执行 → L2/L3 弹卡确认 → 回流候选在记忆 ledger 可见（PROPOSED 态、非 ACTIVE） |

### 接口契约

- 施工口径唯一来源：派单文 `设计师\派单\UPG-104_工具联动段2_派单_2026-09-05.md` §二 + `设计师\方案设计\03_工具联动\输入与MCP工具联动机制_设计_v3.2_2026-09-05.md` §三对账表（强化复用：Evaluator/EvalFixture[13 例存量]/EffectSpecs+EffectSpecRegistry[20 工具效应]/Plan 执行器段①最小版/TraceRecord.memoryCandidate[现恒空串待接]）
- 段①资产零退化：UPG-46 五变异锚（循环拒绝/四类阻断/Trace 单写点/NO_CALL/确认门）复验不破
- Evaluator baseline 不动（ToolOrchestrator 关键词决策器 = 对照基准，段①既定红线）
- 共享面申报：本单触及 Plan 执行器 + 记忆写链路（全局数据面）→ 交付报告必附《共享面影响清单》+ coverage_status 三档（红线 24）

### 销项条件（本单「合格」= 下列全满足）

- [ ] E1 六指标评测集扩建（13 → ≥25 例；NO_CALL/MULTI_CALL/边界各 ≥2）全绿 + 跑分确定性（同输入两次一致）
- [ ] E2 Safety Policy L0-L3 全分级实测 + L2/L3 必进确认门 + own 分类器兜底三证
- [ ] E3 三模式编排端到端各 ≥1（Plan → 执行 → 回填）+ 互斥/优先级规则正确
- [ ] E4 记忆回流 = 候选：memoryCandidate 实值 → 记忆写链路 → PROPOSED；全链零自动 ACTIVE
- [ ] E5 段①五锚复验不破 + 全量零新增失败 + assembleDebug 绿（提交版 = 验证版）
- [ ] 变异亲杀 5 锚全红 → 还原复绿
- [ ] 真机 L2 实证 + 证据链四环节完整
- [ ] 交付绑定 DEL-UPG-104-*（code/artifact/manifest 三重 hash，manifest 机制产出）+ 共享面影响清单 + Token/KV 两节申报

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

> 追加格式：`| 时间 | 作者 | 触发原因 | 说明 |`。追加只入本区，**不得回填进冻结区**。

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|

---

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-104-v1.md"
```

> 校验：验收 / 审验 / 合 main 抽查时重跑同命令比对；不一致 = 标准被改，阻断并走修订。
