# STD-UPG-85-v1 验收标准冻结版

> 工单：UPG-85 ｜ 标题：预审单 removeAll 缺陷修复（同 tool 多步骤被误移除）｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-85-v1`
- **content_sha256**: `9d82e2b11eea594f07a1fe75f82df8a5039af65b87ecfb3dd52d1313c54d2011`
- **frozen_at**: `2026-09-03T09:10:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

> ⚠️ 冻结区任何改动都视为标准变更，只能走修订派生 v2，不得原地改。

---

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | 审批执行绑定 → diff 精读 + 变异亲杀 + JVM 行为实证 | ① 计划含同一 tool 多个不同参数步骤时，仅移除「当前步」对应的一行（首个 tool 匹配），其余同 tool 步骤**保留在审批单上**且可勾选；② 执行期：当前步按真实 args 落簿 HIT，其余同 tool 步骤按勾选放行/未勾阻断/参数漂移 MISS 转新 ASK——语义与单一致；③ UPG-76 既有绑定五态零回归 |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| `MainActivity.kt:5267`（`steps.removeAll { it.tool == info.toolName }`） | 恢复 removeAll（全量移除同 tool 行） | 「同 tool 多步骤保留在单」测试必红 |
| 移除定位（首个 tool 匹配） | 改为移除末尾匹配/全部匹配 | 保留行=首个之后的同 tool 行断言必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向用例 | 新增/更新绑定测试：计划含 file.write a.txt + file.write b.txt + 当前步=file.write a.txt → 单上仍有 b.txt（可勾）；a 执行 HIT；b 按勾选放行/未勾 DENIED/参数漂移 MISS——全路径实证 |
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（UPG-81 合后须 0 失败）；PlanApproval 32+ApprovalLogic/Upg84 套件零回归 |
| 构建 | `:app:assembleDebug` 绿 |
| 证据链 | 测试 XML + 缺陷前后行为对比输出（含统计时点） |

### 销项条件（下列全满足）

- [ ] `removeAll{it.tool==info.toolName}` 改为**仅移除首个 tool 匹配行**（或经评审的等价精确定位——交付报告声明取舍：args 匹配 vs 首个匹配，及模型参数漂移下防重复的论证）
- [ ] 同 tool 多步骤场景全路径测试通过（保留/勾选/执行/阻断/MISS）
- [ ] 两个变异锚亲杀全红、还原复绿
- [ ] UPG-76 机制零回归（PlanApproval 套件全绿）
- [ ] Token/KV 两节申报（0/0）

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | 审验独立复核实锤（UPG-80 审验发现①）：`ed5088c:5543` 与 main:5267 同逻辑 `steps.removeAll{it.tool==info.toolName}`——计划含同 tool 多步骤时全部被静默移除（用户单上看不到=批准了不完整计划）；修法裁决=按首个 tool 匹配移除（removeAt），args 严格匹配会引入模型参数漂移重复行，交付报告须论证取舍 |

---

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-85-v1.md"
```
