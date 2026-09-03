# DELIVERY_UPG85_2026-09-03 · UPG-85 预审单 removeAll 缺陷修复（同 tool 多步骤被误移除）

> 程序员：C（Claude/wmw0027）｜ 认领登记 @2026-09-03 10:24（工单库 UPG-85 卡）｜ 结论：**定位修复+取舍论证+全路径测试+2 变异锚亲杀——待验收员验收**

---

## 〇、交付绑定（SYS-01 P0-2 · 红线 23）

```yaml
delivery_id: DEL-UPG85-20260903-001
standard_id: STD-UPG-85-v1   # content_sha256=9d82e2b11eea594f07a1fe75f82df8a5039af65b87ecfb3dd52d1313c54d2011
code_commit_sha: 8609d69     # feat/upg85（基 main 8647ee9 = origin/main 顶）
artifact_sha: a1132fa8572e543f03cd7e3f6898a0b92a090fe5c45e25afc807ce0f4bb5f0a1   # app-debug.apk 56125103B（assembleDebug 绿）
evidence_manifest_sha: cfa1049d0b5ccec7150899c75b7e99f2e585c12e0c14759639ff3f05e46875c4   # 处理中心/delivery_UPG85_manifest.json
```

- **verify-hash 交付时点**：`HASH_REJECT <not-ancestor>`——E2 闸语义=hash 须在 origin/main 祖先链（审验.py:453），分支未合态必然结果（`8609d69` 即 feat/upg85 tip，存在性 ✓）；**合 main 后由验收员/设计师复跑 = 绑定终态**，本报告不虚报 HASH_OK（同 UPG-82 处置先例）。

## 一、L0 范围声明

| 项 | 值 |
|---|---|
| 实现范围 | 仅 `MainActivity.kt` runPreApprovalRound 段「解析+当前步前置」的移除定位（:5267 缺陷点） |
| 触碰契约 | UPG-76 预审单编排语义（出单门槛/落簿/裁决不动）；STD-UPG-85-v1 全项 |
| 范围外 | 执行绑定（consumeIfApproved）、扫描编排（runPlanCompletionRound/READ-only 面）、Group 语义、parsePlanSteps 解析器——一字未动 |

## 二、修复本体（:5267 缺陷点）

```kotlin
// 修复前（缺陷）：
steps.removeAll { it.tool == info.toolName }          // 同 tool 多步骤全部静默移除
// 修复后（UPG-85）：
val steps = parsePlanSteps(planText).toMutableList()
val upg85CurIdx = steps.indexOfFirst { it.tool == info.toolName }
if (upg85CurIdx >= 0) steps.removeAt(upg85CurIdx)     // 仅移除首个 tool 匹配行（当前步），无匹配跳过
steps.add(0, PlanDraft(info.toolName, info.args, ...)) // 当前步以真实 args 前置（原语义不变）
```

- **缺陷实证**（审验独立复现，UPG-80 审验发现①）：计划 file.write a.txt + file.write b.txt、当前步=a → removeAll 后 b 行从单上消失，执行到 b 时用户毫不知情（单少行 = 批准了不完整计划）。
- **修复后**：b 保留在单上可勾选；a 以真实 args 前置（节点键=真实 args，本调用可被清单裁决）。
- MainActivity.kt **纯 CRLF 保持**（修复后实测 7414 行 CRLF / 0 LF-only）。

## 三、取舍论证（STD 销项①必含：args 严格匹配 vs 首个 tool 匹配）

**裁决=首个 tool 匹配（removeAt(indexOfFirst)），不采用 tool+args 严格匹配。理由：**

1. **模型参数漂移是常态而非异常**：计划补全轮由嵌套 agent 产出 `parsePlanSteps` 行，其 args 是模型改写后的变体；当前步真实参数来自 `ApprovalService.PendingInfo.args`（执行期实测值）。两者对「路径写法（a.txt vs ./a.txt）、时间戳字段、可选参数缺省」必然存在漂移——args 严格匹配（`it.tool==… && it.args==info.args`）在漂移发生时**匹配失败 → 一行都不移除 → 单上留下当前步的模型变体重复行**：用户看到两行 file.write a（一行模型版一行真实版），比「少一行」更混淆审批判断。
2. **「当前步=首个审批级触发点」语义下首个匹配定位正确**：runPreApprovalRound 由首个审批级 ASK 触发（`request()` remembered 后、FIFO 前的钩子）——当前步正是计划中**第一个**与 info.toolName 同 tool 的审批级步骤（它之前的同 tool 步骤若存在，说明更早已触发过本轮或属于更早 ASK 语境）。首个匹配 = 当前步的模型计划行。
3. **重复行防线已在别处**：即便计划文本自身含重复行，nodeKey=tool+args 指纹的执行绑定天然去重（同键二次请求=耗尽转 ASK，PlanApprovalBindingTest 既有「耗尽」案实证）；落簿 `settlePlanSheet` 侧单行单节点，不会因残留模型变体行产生双授权。
4. **极简践行**：removeAt(indexOfFirst)+守卫 = 3 行，不引入新依赖/新抽象（ponytail 口径：删除优于新增，本单净变更最小）。

## 四、缺陷前后行为对比（STD 证据链要求）

| 场景（file.write a + file.write b，当前步=a） | 缺陷态（removeAll） | 修复态（首个匹配移除） |
|---|---|---|
| 单上行数 | 仅 a（b 被静默移除）——**用户批准了不完整计划** | a（真实 args 前置）+ b（模型计划行）均在上 |
| b 勾选后执行 | 无从勾选 → 执行期 MISS 转新 ASK（用户毫不知情被再次打扰） | b 在单已勾 → 执行期 **HIT** 放行（allowed-plan） |
| b 未勾执行 | — | **DENIED** 阻断不打扰（outcome=rejected） |
| b 参数漂移执行 | — | **MISS** → FIFO 转新 ASK 实时决策（不静默放行不误阻断） |
| a 执行 | HIT（真实 args 前置命中） | HIT（语义不变） |

行为实证（JVM，PlanApprovalBindingTest 新增 3 案）：`UPG85 同tool多步骤_b保留在单且勾选_执行期HIT放行` / `_b未勾选_执行期DENIED阻断不打扰` / `_b参数漂移_MISS转新ASK实时决策`。

## 五、变异亲杀（2 锚 · STD 必填 · 全红实录）

| 锚 | 变异动作 | 结果（XML 口径） |
|---|---|---|
| M1（STD 锚①恢复 removeAll） | `removeAt(indexOfFirst)` 段改回 `steps.removeAll { it.tool == info.toolName }` | PreApprovalRemoveFirstMatchContractTest **3 跑 3 红**（修复形态+锚①+锚②三断言齐红） |
| M2（STD 锚②移除末尾/全部匹配） | `indexOfFirst` 改 `indexOfLast`（末尾匹配） | 同套件 **3 跑 2 红**（修复形态断言红[首匹配变量断言]+锚②红[indexOfLast 禁]） |

**还原**：两变异均在 commit `8609d69` 保护下 `git checkout --` 还原（工作区 clean）→ 定向复绿（PlanApproval 家族 35 + 契约 3）→ 全量复绿（零新增失败）。锚②「全部匹配」形态由锚①红覆盖（removeAll 即全部匹配，M1 已杀）。

## 六、测试面（XML 计数 · 2026-09-03 统计时点）

| 面 | 结果 |
|---|---|
| 定向：PlanApproval 家族 | PlanApprovalBindingTest **14**（既有 11+新增 3）/ StoreTest 15 / ScanTest 6 = **既有 32 零回归** + 新增 3 |
| 定向：源码契约锚 | PreApprovalRemoveFirstMatchContractTest **3**（修复形态/removeAll 退场/末尾与全量退场） |
| 定向：ApprovalLogicTest 9 / ApprovalComponentContractTest | 零回归 |
| 全量 | `:app:testDebugUnitTest --rerun-tasks` **98 套件 730/2/1**——724[U82 时点] + 6[本单新增] = 730；2 失败=AppearanceContractTest L1-10/M-U50-5 **基线预存**（UPG-81 3339c4b 未合 main），**零新增失败** |
| 构建 | `:app:assembleDebug` BUILD SUCCESSFUL（56125103B） |

**JVM 受限如实声明**：审批单 UI 呈现层（ApprovalSurface.presentPlanSheet 渲染「单上有 b」）为 Android 面，JVM 不可直测——由源码锚（组装段形态锁定）+ Store/Service 层行为三案（b 保留后的执行期全路径）双证覆盖；真机呈现走验收员 L2/L3。

## 七、Token / KV Cache 影响申报（0/0）

- **Token**：0——不新增/修改任何 prompt、工具描述、注册面；仅审批单组装逻辑一行定位修复，单上多保留的行是**本应呈现**的计划步骤（缺陷态反而少行）。
- **KV Cache**：0——无 KV/prefs/存储面变更；落簿仍走 PlanApprovalStore 既有路径。

## 八、共享面影响清单 + 能力护栏（红线 24）

```yaml
## 能力护栏（P1-1）
共享面影响清单:
  - 共享面: 审批编排面（MainActivity runPreApprovalRound 段——UPG-76 预审单机制的宿主组装点）
  - 影响下游: PlanApprovalStore 落簿行集合（同 tool 步骤行数↑恢复应然值）/ ApprovalSurface.presentPlanSheet 呈现行数 / consumeIfApproved 执行绑定（语义零改动，仅输入行集变化）
  - 回归说明: PlanApproval 既有 32 用例零回归；ApprovalLogic/ApprovalComponent/Upg84 套件零回归；全量零新增失败；UPG-76 五态（HIT/DENIED/MISS/EXPIRED/耗尽）语义未动
coverage_status: FULL
```

## 九、已登记两个表

① `工单表.xlsx`（sync 投影，UPG-85 行程序员列/备注列/delivery_id）；② `工单库.md` UPG-85 卡交付块。交付报告落 `程序员\交付报告\DELIVERY_UPG85_2026-09-03.md`。

---
*程序员 C · 2026-09-03 · worktree mov-upg85 可随验收流程收*
