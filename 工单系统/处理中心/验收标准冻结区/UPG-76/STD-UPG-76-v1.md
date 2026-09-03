# STD-UPG-76-v1 验收标准冻结版

> 工单：UPG-76 ｜ 标题：审批预审单模式（扫描→审批单→整批执行，S4 语义工具级落地）｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-76-v1`
- **content_sha256**: `f370253ef6968561b631352066fae38348876cda332c4b244cdad4974f1cc656`
- **frozen_at**: `2026-09-03T02:45:47`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

> ⚠️ 冻结区填完、content_sha256 回填后，**冻结区任何改动都视为标准变更**，只能走修订派生 v2，不得原地改。

---

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | 状态机/权限/UI → diff 精读 + 变异亲杀 + 真机多场景 | ① 批准清单执行绑定成立：命中放行+扣减、计划外硬拦截转新 ASK、only-once 不吃清单；② 扫描阶段 READ-only 工具面（机制面非提示词）；③ 审批单 UI：清单/勾选/支付行明示/批量批准；④ Group 双状态机语义与执行引擎 v0.4 §8.3 对齐（无第三套语义）；⑤ 时效 EXPIRED + 每条授权单次执行；⑥ UPG-68/75/77 既有安全语义零回归 |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| PlanApproval 查询点（`ApprovalService.request` 内 remembered 检查之后） | 删除/短路清单查询 | 「计划外调用硬拦截转 ASK」测试必红 |
| 计次扣减（每条授权单次执行） | 删除扣减（无限重放） | 第二次同调用必须转新 ASK 的测试必红 |
| only-once 红线（清单命中逻辑） | 允许清单放行 only-once 工具 | only-once 经清单必拒测试必红（UPG-68 语义不破） |
| 扫描期 READ-only 过滤（`MainActivity.kt:7797-7804` filtered 构建处） | 去掉 `category=="read"` 过滤层 | 扫描模式 schemas+allowedTools 双面无写类工具断言必红 |
| MONEY 排除（审批单批准逻辑） | MONEY 步骤进批准清单 | MONEY 行不可批、执行时实时确认的测试必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 全量回归 | `testDebugUnitTest --rerun-tasks` 真跑，计数如实（XML 为准，注明统计时点；基线预存 2 失败 AppearanceContractTest 沿用申报口径） |
| 定向用例 | 新增 PlanApproval 套件（命中放行+扣减/计划外拦截/EXPIRED/单次执行/only-once 拒绝/MONEY 排除/Group 状态迁移含 partially_decided+stale）+ 扫描过滤断言 + 既有 PermissionGuardTest/OnlyOnceGuardTest/ApprovalQueueTest/McpServerApprovalTest 全绿 |
| 构建 | `:app:assembleDebug` 绿（含 app→mov-exec-engine 依赖后） |
| 证据链 | journal/足迹 + 真机截图（含时间戳）+ 命令输出 四环节完整 |
| 真机 L3 | ① 多步骤请求（≥2 写类步骤）→ 一张审批单（步骤清单+支付行明示）→ 部分勾选批准 → 执行：已批步骤跑通、未批步骤 blocked 呈现「阻断下游」、执行中计划外调用弹新审批窗；② MONEY 步骤执行到该步实时弹确认（无论单子批否）；③ 批准清单过期/次数耗尽 → 同调用转新弹窗；④ 单步骤请求不出单（走现行弹窗） |

### 销项条件（本单「合格」= 下列全满足）

- [ ] 扫描阶段 READ-only 工具面机制成立（schemas 与 allowedTools 同源收缩，MainActivity.kt:7797-7823 单点过滤）；扫描提示词条件化（:5352 拼串处），:5358「禁止输出计划文本」在扫描模式正确反转、执行模式保持
- [ ] 出单门槛：≥2 个审批级（WRITE/MONEY 类）步骤才出审批单；单步骤走现行弹窗；READ/无害类不上单只推进度
- [ ] PlanApproval 执行绑定下沉 `ApprovalService.request`（对话面+MCP 面双面生效，豁免序 turn→goal→remembered→清单→FIFO 弹窗）；键=toolName+参数 canonical 哈希（复用 mov-exec-engine CanonicalCodec，不造第三份 canonical 实现）
- [ ] Group 双状态机语义对齐 §8.3（Group: pending→partially_decided→completed|expired|stale；Node: approved|rejected|blocked|expired|stale），实现落工具级，exec-engine 运行时不接线
- [ ] 时效 EXPIRED（过期不复活，重跑=新单）+ 每条授权恰好一次执行（扣减耗尽转新 ASK）
- [ ] 审批单 UI：步骤清单（人话行+参数脱敏摘要）+ 逐条勾选 + 批量批准 + MONEY 行明示「执行到该步实时确认」且不可预批；失败语义=阻断下游，文案不承诺「撤销」
- [ ] 五个变异锚亲杀全红、还原复绿
- [ ] 交付报告含「Token 影响 + KV Cache 影响」两节（扫描轮 +1 LLM 请求的触发条件与量级、提示词条件化增量，必须申报）

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | 标准源自 UPG-76 v1 概览 + 《审批预审单_UPG-76_方案v2增补_设计师B_2026-09-03.md》四钉子 + 派单前溯源复核（main@a7736b3，锚点：扫描过滤 MainActivity.kt:7797-7823 / 绑定下沉 ApprovalService.request :377 后 / 提示词 :5352-5370 / exec-engine 复用件 CanonicalCodec.kt:26）；用户拍板「不用大神评审，直接派单」 |
| 2026-09-03 | 设计师B | 扫描触发口径裁决（用户拍板选项 2） | 触发=「先扫，只有 ≥1 写才续扫」：首轮正常跑（纯只读/闲聊零增量）→ 首个 ASK 级调用到达 dispatch 时暂停 → 计划补全轮（READ-only 面）→ ≥2 审批级步骤出单、恰好 1 个走现行单步弹窗。Token 申报口径：纯只读/闲聊零增量、办事型 +1 轮——销项条件语义不变（门槛/READ-only 面/单步不出单均照旧），本追加仅补定义入口手势 |

---

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-76-v1.md"
```
