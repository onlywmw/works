# STD-UPG-76-v2 验收标准冻结版

> 工单：UPG-76 ｜ 标题：审批预审单模式（扫描→审批单→整批执行，S4 语义工具级落地）｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**
> **派生自 STD-UPG-76-v1**（修订：销项 #1 提示词条件化达成路径放宽为二选一——设计师裁决接受嵌套独立 agent 方案 @2026-09-03；v1 永久保留不覆盖）

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-76-v2`
- **content_sha256**: `bfcbd8722a06e806beae8688e628fc94c2ef34d8af59d17b721a8a7c12707bea`
- **frozen_at**: `2026-09-03T04:45:04`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派生共批待确认，验收启动前补齐）

> ⚠️ 冻结区填完、content_sha256 回填后，**冻结区任何改动都视为标准变更**，只能走修订派生 v3，不得原地改。

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

- [ ] **补全轮计划输出能力成立 + 执行模式 `:5358`「禁止输出计划文本」原样保持**——达成路径二选一：①`:5352` 拼串处条件化、扫描模式反转；②嵌套独立一次性 agent + 专用计划提示词（主 agent 不进入扫描模式、主会话请求前缀字节恒定）。语义锚=补全轮不受禁计划文本约束、执行模式保持（**本单交付采用②，设计师裁决接受 @2026-09-03**）。扫描/补全面 READ-only 机制不变（`MainActivity.kt:7797-7823` schemas 与 allowedTools 同源收缩）
- [ ] 出单门槛：≥2 个审批级（WRITE/MONEY 类）步骤才出审批单；单步骤走现行弹窗；READ/无害类不上单只推进度
- [ ] PlanApproval 执行绑定下沉 `ApprovalService.request`（对话面+MCP 面双面生效，豁免序 turn→goal→remembered→清单→FIFO 弹窗）；键=toolName+参数 canonical 哈希（复用 mov-exec-engine CanonicalCodec，不造第三份 canonical 实现）
- [ ] Group 双状态机语义对齐 §8.3（Group: pending→partially_decided→completed|expired|stale；Node: approved|rejected|blocked|expired|stale），实现落工具级，exec-engine 运行时不接线
- [ ] 时效 EXPIRED（过期不复活，重跑=新单）+ 每条授权恰好一次执行（扣减耗尽转新 ASK）
- [ ] 审批单 UI：步骤清单（人话行+参数脱敏摘要）+ 逐条勾选 + 批量批准 + MONEY 行明示「执行到该步实时确认」且不可预批；失败语义=阻断下游，文案不承诺「撤销」
- [ ] 五个变异锚亲杀全红、还原复绿
- [ ] 交付报告含「Token 影响 + KV Cache 影响」两节（触发口径=选项 2：纯只读/闲聊零增量、办事型 +1 轮计划补全；提示词增量说明；会话内前缀恒定）
- [ ] **源文件零非常规字节**（PlanApprovalStore.kt:219 分隔符 raw NUL 改 `\u0000` 转义——git/工具链友好，语义等价；合 main 前置）

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | v2 派生依据 | 交付遗留申报 ①：实现以嵌套 throwaway agent + planScanSystemPrompt 承接补全语义（主 agent 从不进扫描模式，:5352/:5358 零改动），语义等效且更优（主会话前缀恒定、无模式态突变）——裁决接受，修订销项 #1 为二选一；程序员遗留 ②参数精确一致才放行=认可（§8.3 参数级绑定+钉子2，非缺陷，真机将呈现「部分后续步骤仍弹窗」属预期）；③MCP 面预审编排=不另单（MCP 面单次直调无编排对象，绑定层双面已覆盖+FIFO 兜底，未来外部 agent 客户端批量授权需求再立项）；④生成器污染已还原 ✓，根治=挂账-生成器产物漂移防护+挂账-upg50-CI门禁断链tools.txt 合并为工单候选「派生项入库+CI diff=0 门禁」待派 |
| 2026-09-03 | 设计师B | 冻结依据（承 v1） | 标准源自 UPG-76 v1 概览 + v2 增补四钉子 + 派单前溯源复核（main@a7736b3）；用户拍板免大神评审直派 |
| 2026-09-03 | 设计师B | 扫描触发口径（承 v1） | 触发=「先扫，只有 ≥1 写才续扫」：首轮正常跑（纯只读/闲聊零增量）→ 首个 ASK 级调用到达 dispatch 暂停 → 计划补全轮（READ-only 面）→ ≥2 审批级步骤出单、恰好 1 个走现行单步弹窗 |
| 2026-09-03 | 设计师B | L3 四场景环境阻塞口径（合 main 联动裁决） | 测试匹配档真机 L3 四场景因验证环境缺 DeepSeek key（emulator-5554，同挂账-模拟器AI未回复环境根）未执行——按 UPG-75 A3-1 先例转 挂账-upg76-L3真机补验四场景（AI key 恢复后按本档补验）；JVM 机制面 FULL+失效回退安全（不触发即回退 UPG-75 FIFO）为合 main 依据，coverage_decision 已落交付报告 |
| 2026-09-03 | 设计师B | 设计师直修 hygiene commit | 销项「源文件零非常规字节」已由设计师直修落地：feat/upg76 追加 6dd9161（nodeKey 分隔符 raw NUL→`\u0000`，PlanApproval 定向 BUILD SUCCESSFUL）——合 main 实际 hash=**6dd9161**（=ed5088c 交付+此 hygiene commit），交付绑定 code_commit_sha 以此为准 |

---

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-76-v2.md"
```
