# DELIVERY UPG-75 · 审批交互收口（FIFO 弹窗队列 / 审批待办 / 渠道统一 / 超时足迹）

> 程序员（AI）｜ 2026-09-02 ｜ 分支 `feat/upg75`（worktree `mov-upg75`，基底 `main add9e8c`）｜ commit `014c10f`（本地，未合 main）
> 设计：`审批交互收口_设计_v1_2026-09-02.md` ｜ 派单：设计师 2026-09-02 文本派单（照 A1-A4 + 变异亲杀；无独立派单文件）
> **已登记两表**（工单表.xlsx + 工单库.md）：工单表.xlsx 经 sync-orders.mjs 单向生成（--sync 后 --check diff=0）；「✅ C 交付」状态行 + 施工交付登记块为库侧唯一写入

## 一、交付物（4 文件 / +650 / -109，纯交互层：ApprovalService FIFO + MainActivity UI + NotificationAnswerer 投影）

| 产物 | 路径 | 要点 |
|---|---|---|
| 单队列 FIFO 核心 | `app/src/main/kotlin/com/hermes/dsh/tools/ApprovalService.kt` | A1：`ConcurrentLinkedQueue` + `byId` CHM + `driveMutex` 串行展示；A2：`pendingList()/complete()/allowAllThisTurn()`；A4：排队不计时、仅正展示项 60s fail-closed；首决胜 CAS `tryDecide`；`presentationCanceller/onQueueChanged` 供外部决策与 chip 计数收口 |
| A2 待办入口 + A1 窗头 + toast | `app/src/main/java/com/mov/android/MainActivity.kt` | 主行「审批待办」chip（GONE 兜底→有 pending 显示计数）；`showApprovalPanel()` 原生日历表弹窗（allow/deny/全部本轮允许，only-once 标「每次确认」逐条）；answerer 弹窗顶部「待审批 N 条·第 i 条」；presentationCanceller 关面收口；30s 倒计时超时 `Toast「已自动拒绝」` |
| 通知渠道投影 | `app/src/main/kotlin/com/hermes/dsh/tools/NotificationAnswerer.kt` | A3：删 `pendingInfos/takePending`/onStart 单条接管；`activeRequestId` + `cancelActive()` 供外部决策抢先时释放等待中的 answerer 并取消通知（单源防双决策源重叠） |
| JVM 变异锚测试 | `app/src/test/java/com/hermes/dsh/tools/ApprovalQueueTest.kt`（新增） | A1-1 并发三请求 FIFO 无丢 / A1-2 队首超时自动切下一窗 / A2 外部 complete 尾项免弹 / A2 only-once 留逐条 + 批量清队列，共 4 用例 |

commit：`014c10f`（`git log`：UPG-75 审批交互收口：FIFO 弹窗队列 + 审批待办 + 渠道统一 + 超时足迹；工作树已净）

## 二、施工要点（照派单 A1-A4，红线只碰交互层）

- **A1 弹窗队列**：Agent 审批请求进单队列；`driveMutex` 由调用方协程串行驱动展示（无外部 CoroutineScope，兼容现有 runBlocking 单测）；同一时刻只展示队首一条（`presentingRequestId` 暴露）；弹窗顶部「待审批 N 条 · 第 i 条」（≥2 条才显示）；用户关闭/60s 超时 → fail-closed → 自动驱动下一条，**排队不计时**（队尾不被展示前静默超时，无丢）。
- **A2 审批待办**：`pendingList()` = 未决项按 FIFO 位次投影（requestId/toolName/reason/args/submittedAt/position/total），与弹窗**同一数据源**；逐条 allow/deny；`allowAllThisTurn()` 批量 ALLOW_TURN——**only-once（vault.get/browser.*）跳批量留逐条**（UPG-68 红线不破）。外部 `complete(队首)` → 触发 `presentationCanceller` 收掉正展示弹窗/通知，防双决策源。
- **A3 渠道统一**：弹窗（前台）/ 通知（后台）/ 待办列表三渠道共用 ApprovalService 同一队列；`onStart` 单条 takePending 接管逻辑**删除**（回前台渲染的是同一队列）。通知 answerer 每刻只服务正展示队首一次。
- **A4 超时语义**：60s fail-closed 保留；展示起算（排队不计时）；超时 → decided=cancelled → 审计落审批足迹（可查）+ toast「已自动拒绝（未及时确认）」。

## 三、红线守约

1. **UPG-68 安全语义零变更**：only-once / fail-closed / 嵌套闸全部保留原判定路径；豁免顺序（only-once skip → turn → goal → remembered，goal-null 防御 REJECTED）不改；scheduler handler 仍只收 allowed-once。
2. **单源不绕**：任何渠道（弹窗/通知/待办）只消费 ApprovalService（单一 source），渠道层不自行裁决放行；外部 complete/allowAll 全部经 ApprovalService `complete/tryDecide` 首决胜写入，CAS 防双决策源覆盖。
3. **只碰交互层**：未动权限判定/注册表 `docs/ApprovalRegistry*` / PermissionRegistryData / 执行引擎 approval 子包 / McpServer RPC（approve/deny ~4290 既有路径不在范围）。
4. 改动集 git 确认 = 上述 4 文件（+650/-109），无越界混入。

## 四、验证证据（实测）

- **L1① 单测（最终落盘态定向亲跑）**：`:app:testDebugUnitTest` 5 套件 **40 全绿 / 0 failed**——ApprovalQueueTest 4 + OnlyOnceGuardTest 8（UPG-68 only-once 守卫）+ PermissionGuardTest 15（guard/豁免/逐条）+ ApprovalServiceGoalTest 5 + ApprovalExperienceTest 8（turn/goal/experience 豁免序）。提交前全量回归（tools.* + Upg07B2 6 + ExperienceSurface 1 + UPG68 系列 + WebMcpHub 24 + goal 系）同样全绿；`ApprovalRegistryGeneratorTest` 通过但会**再生成** `PermissionRegistryData.kt + docs/ApprovalRegistry.{json,md}`（ui.listComponents 派生刷新，非 UPG-75 范畴）→ 已回退保持改动集纯净，供设计师另行裁决。
- **L1② 变异亲杀 1/1 全红还原复绿**（篡改源码临时副本 → 测试红 → 还原复绿）：`nextUndecided()` 改「只保留最新一条」（keep-latest，FIFO 违规变体）→ **ApprovalQueueTest A1-1 红**（并发只应展示队首断言被打破）→ 还原复绿。设计文档 kill 锚（队列只留最新→红）落点如实为 A1-1（keep-latest 下队首序破坏处），A1-2 同带「首窗=shell.exec」序锚双保险。
- **L1③ A 锚 JVM 实证**（ApprovalQueueTest 断言）：
  - A1-1：3 并发 tool_call → 只展示队首 1 窗、pendingCount=3、展示序=入队序（shell.exec→http.post→device.timer）、3 asked + 3 decided 无丢；
  - A1-2：队首 120ms（测试注入）超时 → fail-closed cancelled → 下一窗自动出现并放行，不阻塞；cancelled 进足迹可查；
  - A2：外部 complete 队尾 → 尾项免展示按其决策放行、弹窗只弹过队首、队列清空；「全部本轮允许」放 2 条 ALLOW_TURN、vault.get（only-once）留逐条、逐条允许后清空。
- **L1④ 装配级**：`:app:assembleDebug` **BUILD SUCCESSFUL**（exit=0，2026-09-02 实测）。

## 五、Token / KV Cache 影响（AGENTS.md 硬规则 1）

- **Token 影响**：0/0——纯 App 前台交互层（弹窗队列/待办面板/通知投影），零请求链路改动（AgentLoop/LlmClient/Session/system prompt/AI 面 tools 零接触）。
- **KV Cache 影响**：0/0——请求前缀字节恒定，无会话历史投影/压缩/折叠；AI 面 tools/system prompt 会话中途不变。

## 六、L2 / L3（留给验收员）

- **L2**：行为级 JVM 实证已覆盖 A1/A2/A4 核心闭环；**真机交互**（并发 tool_call 前台弹窗逐窗可点、待办面板点按 allow/deny/全部本轮允许、后台通知按钮→回前台=列表首条同请求无重复、30s 超时 toast、弹窗顶栏位次文案）留验收员平板实测——A3 渠道链路（弹窗↔通知↔回前台同源）JVM 无法覆盖，真机补验。
- **L3**：改动限 ApprovalService/MainActivity/NotificationAnswerer 交互层三文件 + 新增队列测试；UPG-68 守卫（OnlyOnceGuard 8 + PermissionGuard 15）亲跑绿证安全语义未动；未触 ApprovalRegistry*/PermissionRegistryData/执行引擎 approval 子包；Golden Baseline：本次在既有 ⚡ 区（MainActivity 弹窗渲染/ApprovalService）内改动，非新 DAG/规格扩展。
- **待验收员**：走 A1-1/A1-2/A2-1/A3-1/A4-1 锚（JVM 已实证部分亲跑复验 + 真机补验 A3）+ 变异亲杀复验（keep-latest → 红）→ 审验 → 待设计师合 main。
