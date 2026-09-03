# STD-UPG-82-v1 验收标准冻结版

> 工单：UPG-82 ｜ 标题：执行引擎 S4——ApprovalGroup 双状态机 + EXPIRED + EdgePolicy 失败传播（能力级）｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-82-v1`
- **content_sha256**: `6a1ab899c89923d977b76979a5d5c1221cd6d48b3a505cd32d777003c5c03a59`
- **frozen_at**: `2026-09-03T06:20:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

> ⚠️ 冻结区任何改动都视为标准变更，只能走修订派生 v2，不得原地改。

---

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | 状态机/契约 → diff 精读 + 变异亲杀 + runtime 集成实证（无 UI，纯 JVM） | ① Group 双状态机（Group: pending→partially_decided→completed\|expired\|stale；Node: approved\|rejected\|blocked\|expired\|stale）照执行引擎 v0.4 §8.3；② EXPIRED≠REJECTED、过期不复活（§6.3；MONEY 不默认批/不默认拒/超时失效必须重新确认）；③ EdgePolicy 值集引擎冻结+默认断流（§8.1，Graph-local）；④ G11 证据链最小集；⑤ 与 UPG-76 工具级 PlanApprovalStore 边界清晰（语义同源、层各其主、互不顶替） |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| G4 审批不可变 | 已决 Record/Node 二次裁决或覆盖 | 二次 decide → CONFLICT 测试必红 |
| G8 默认断流 | 未声明边的失败/拒/过期放行下游 | 「B 拒→B 下游仍执行」测试必红 |
| EXPIRED 不复活 | 过期 group/node 直接执行或复活旧 token | 过期后执行被拦测试必红（要跑=新审批） |
| G11 证据完整 | 审批链漏记最小事件（如 partially_decided 迁移或 STALE） | 事件集校验测试必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 模块测试 | `gradle :mov-exec-engine:test` 绿——新增 Group/Expiry/EdgePolicy 套件（双状态迁移/部分批准/过期不复活/断流/独立放行/事件链最小集） |
| 全量回归 | `:app:testDebugUnitTest --rerun-tasks` 绿（基线 2 失败在 UPG-81 修复前沿用申报口径，修复后须 0 失败）；S2/S3 套件零回归 |
| 构建 | `:app:assembleDebug` 绿（装配级） |
| 证据链 | 测试 XML + 事件链输出样本（含状态迁移序列）+ 变异亲杀记录（均含统计时点） |

### 销项条件（下列全满足）

- [ ] Group 双状态机 + Node 五态照 §8.3 落地（mov-exec-engine approval 子包，纯 JVM 零 Android 依赖）
- [ ] TTL→EXPIRED（≠REJECTED）+ 过期不可执行 + 不复活旧 token（重跑=新审批）；MONEY 节点超时语义符合 §6.3
- [ ] EdgePolicy 值集冻结（BLOCK/SKIP/CONTINUE_INDEPENDENTLY/REQUIRE_HUMAN_INTERVENTION），默认 failure/rejected/expired→BLOCK；CONTINUE_INDEPENDENTLY 仅 bundle 显式声明
- [ ] G11 事件链：审批主链+部分批准+漂移 STALE 分支最小事件集落 Ledger（append-only 不覆盖，G7 持续守）
- [ ] 边界声明落交付报告：与 PlanApprovalStore（UPG-76 工具级）语义同源（§8.3 词表一致）、层各其主、不合并不互调
- [ ] S2/S3 现有类语义零改动（ExecEngine/ApprovalBook/Snapshot 等只扩展不回头改）；四个变异锚亲杀全红、还原复绿
- [ ] 交付报告含 Token/KV Cache 两节（0/0）

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | 执行引擎 v0.4 §11 切片 S4（`设计师\方案设计\MOV_执行引擎_架构设计稿.md` §6.3/§8.1/§8.3 + §12 守卫 G4/G8/G11）；前置 S2@bd958d2/S3@add9e8c 已合 main；索引 `执行链路_设计基线_索引_v1_2026-09-02.md` |

---

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-82-v1.md"
```
