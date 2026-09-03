# DELIVERY UPG-77 · 审批判定单源化 + MCP 面死信通道处置 + SDK 契约纠偏（P0 安全）

> 程序员（AI wmw0027）｜ 2026-09-03 ｜ 分支 `feat/upg77`（worktree `mov-upg77`，基底 `origin/main 014c10f`）｜ commit `a7736b3`（本地，未合 main——合 main 归设计师）
> 验收标准：`STD-UPG-77-v1`（content_sha256=`c80c5941420758336394ca0e3cf0be6ef0752b52f5f6b7b997d1fb17dd164f47`）｜ 派单：`UPG-77_审批判定单源化_派单_2026-09-03.md`
> **已登记两个表**（工单库.md + 工单表.xlsx）：工单表.xlsx 经 sync-orders.mjs 单向生成（--sync 后 diff=0）；登记见工单库.md UPG-77 卡交付块

## 交付绑定（P0-2）

- delivery_id: **DEL-UPG77-20260903-001**
- code_commit_sha: `a7736b35c3cf0c3e94e7320972b1c64c5ce471ef`（feat/upg77 tip；`git log`=UPG-77 审批判定单源化：guard.decide+isGranted 共享 / MCP 面死信消除 / SDK 双门纠偏）
- artifact_sha: `7bad33b08b602e9b6b0feca5edf5c819a633725ab4f87699fded251b7a04a7b6`（app-debug.apk sha256）
- evidence_manifest_sha: `0b780c4456cf0d4df7995b51aca1e883c3a9bfa1f28abc1d08492f6b53ecb767`（`程序员/交付报告/DELIVERY_UPG77_2026-09-03_manifest.json`，9 条 E-001~E-009，审验.py --manifest 自校验 ok:True）
- standard_id: STD-UPG-77-v1（冻结区 content_sha256 已对上）
- verify-hash 闸：登记前实测 `审验员\审验.py --verify-hash feat/upg77 a7736b3` → **HASH_REJECT（not-ancestor）**——本实现 commit 未合 main（合 main 只归设计师，2026-08-16 起纪律）；UPG-75 同态（014c10f 交付登记时亦未合）。HASH_OK 需设计师合 main 后由审验复跑达成，机器 flag 如实留证、放行由人裁决。

---

## 一、交付物（10 文件 / +210 / -137）

| 产物 | 路径 | 要点 |
|---|---|---|
| 单源判定入口 | `app/src/main/kotlin/com/hermes/dsh/tools/McpToolScheduler.kt` | A1：`PermissionGuard.decide()`（guard + only-once 强制 ASK 覆写单源化）；dispatch 改用 decide + ApprovalService.isGranted；删除 pending 死面（PendingApproval/requestCounter/registerPending/takePending/evictExpiredPending） |
| outcome 放行单源 | `app/src/main/kotlin/com/hermes/dsh/tools/ApprovalService.kt` | A1：`Companion.isGranted(toolName, outcome)`（only-once 只收 allowed-once；其余 turn/remembered 放行；goal 不放行=UPG-68 等价）；删 auditAsked/auditDecided（仅死面路径调用） |
| MCP 面收口 | `app/src/main/kotlin/com/hermes/mov/mcp/McpServer.kt` | A1+A2：tools/call 改走 guard.decide；ASK → `ApprovalService.request`（HTTP 同步等待 ≤60s fail-closed，runBlocking bridge 论证见 §二）；删 approvePending/denyPending |
| handler 退役 | `app/src/main/java/com/mov/android/MainActivity.kt` | A2：permission.approve/permission.deny handler 退役（删）→ 替换说明注释；uiOnlyMcpTools 名单条目 + 人类可读 label 保留纵深防御 |
| 登记层同步 | `app/src/main/kotlin/com/hermes/dsh/tools/PermissionRegistryData.kt` + `docs/ApprovalRegistry.{json,md}` | A2：permission.approve/deny 行移除（handler 退役后 node 收集不含 → 生成器一致性） |
| SDK 契约纠偏 | `app/src/main/java/com/mov/android/ToolSdkGenerator.kt` | A3：:221 虚假承诺（「会再弹一次」）→ 真实语义（实时审批 ≤60s fail-closed + only-once 当次确认）；:215-217 curl 教学段核对一致 |
| MCP 面变异锚测试 | `app/src/test/java/com/hermes/mov/mcp/McpServerApprovalTest.kt`（新增） | 3 用例：open only-once 拒绝不直出/当次允许才明文 / default ASK 路由 ApprovalService 无 req- 死信 / ASK 超时 fail-closed cancelled |
| A3 防回归锚 | `app/src/test/java/com/mov/android/ToolSdkGeneratorTest.kt` | 双门断言改真实语义 + `assertFalse("再弹")` 防虚假承诺回潮 |

## 二、施工要点（照 STD 销项 + 派单 A1/A2/A3）

- **A1 判定单源化**：新 `PermissionGuard.decide()` 叠加 only-once 强制 ASK 覆写（DENY 优先、ALLOW+only-once→ASK 只紧不松），`McpToolScheduler.dispatch`（原 :317-319 内联覆写删除）与 `McpServer.tools/call`（原 `g.guard()`）**共用同一入口**——grep 证实源码内无第二份 only-once 覆写，非抄 if 到 MCP 面。
- **A2 死信面消除**：MCP 面 ASK → 路由 `ApprovalService.request`（同一 FIFO/呈现/审计）。`runBlocking` bridge 安全性：MiniHttpServer 每连接独立线程（非主线程），answerer（UI 弹窗/通知）走主线程 runOnUiThread，两线不互锁；审批结果经 HTTP 响应同步返回。删除 `registerPending`/`PermissionGuard.pending` 死面 + `approvePending`/`denyPending`。**permission.approve/deny 裁决**：grep 全库 → 无生产调用点（死信——pending 不可批、无 UI caller）→ **删除 handler**（极简阶梯：删除优于保留空响应）；`uiOnlyMcpTools`/人类 label/铁律 1 名单条目保留为纵深防御（永不达——guard UNKNOWN→ASK fail-closed + handler 已无）。
- **A3 SDK 纠偏**：ToolSdkGenerator:221 改为真实语义文案；curl 教学段语义核对一致；SDK 节不含任何「再弹」虚假承诺。
- **登记层一致性**：permission.approve/deny 从 PermissionRegistryData + docs/ApprovalRegistry 同步移除（node 收集不再产出它们）。ui.listComponents **未夹带**：全量 rerun 时 ApprovalRegistryGeneratorTest 因 categories.json 顶层既有分类 + 在面 handler 会派生刷新该行——UPG-75 已遇同态并回退（该报告 §四 明载）；本单同判：**回退保持改动集纯净**（PermissionRegistryData/ApprovalRegistry 三文件 diff=仅删 permission.approve/deny），源头清理留设计师另行裁决（UPG-75 遗留、非本单范畴）。

## 三、红线守约

1. **安全语义只紧不松**：any-mode only-once 不直出明文（FULL_ACCESS 下 decide 升 ASK，McpServerApprovalTest 实证）；fail-closed 不变（审批服务异常/超时→UNAVAILABLE→拒绝）；UPG-68 语义零改动（goal 不放行保持等价，经 isGranted helper 不改变语义）。
2. **未动 UPG-75 呈现层**：ApprovalService 的 FIFO/queue/notification answerer/弹窗渲染零改动（仅加 companion helper + 删死面专用审计辅助）；未动 UPG-76 设计。grep 确认改动集 = 上述 10 文件。
3. **Token / KV Cache 申报**：见 §五。
4. Kotlin 块注释无嵌套；MainActivity.kt 纯 CRLF（Edit 前 Read）。
5. **变异亲杀 3/3 全红→还原复绿**（计数以变异亲跑 XML 为准，统计时点 2026-09-03）：见 §四 L1②。

## 四、验证证据（实测）

### L1① 单测（XML 计数，统计时点 2026-09-03）

- **全量 `testDebugUnitTest --rerun-tasks`**：**690 tests / 2 failures / 1 skipped**（95 XML 文件汇总，统计时点 2026-09-03）；2 个失败全部为 **pre-existing**（`com.mov.android.appearance.AppearanceContractTest`：`L2-9 1B 高频组件切换契约_实例分发到独立应用方法` + `M-U50-5 预览卡 render-only 无交互`——已证 baseline mov-upg75 @014c10f 复现同 2 失败，前端设计源契约漂移与本单无关，如实申报非隐藏）。
- **新增 McpServerApprovalTest 3/3 绿**：open only-once 拒绝不直出明文（REJECT→审批未通过、ALLOW_ONCE→明文、足迹 asked+decided 成对）/ default ASK 路由 ApprovalService 返回明文且无 `req-`+`APPROVAL_REQUIRED` 死信 / ASK 超时（200ms 注入）fail-closed 拒绝 + 足迹 cancelled。
- **既有套件零回归**：PermissionGuardTest 15 / OnlyOnceGuardTest 8 / ApprovalQueueTest 4 / ApprovalExperienceTest 8（全套绿）；ToolSdkGeneratorTest 9 绿（含 A3 防回归锚）。
- **改动后定向复跑**（PermissionRegistryData 回退纯净后）：PermissionGuard 15 + OnlyOnceGuard 8 + McpServerApproval 3 + ToolSdkGenerator 9 = **35 全绿 / 0 failed**（XML 确认）。

### L1② 变异亲杀 3/3（STD 三锚，逐锚：临时篡改源码→亲跑红→git checkout 还原→复绿）

| 锚（STD） | 变异动作 | 亲跑观察 | 还原 |
|---|---|---|---|
| `McpServer.kt:110-113`（tools/call 直查 guard） | 恢复 `guard.guard()`、不走单源判定 | MCP 面 only-once ASK 断言红（1 用例） | ✅ 还原复绿 |
| `McpToolScheduler.kt:317-319`（only-once 覆写） | 删除 decide 中 only-once 覆写 | FULL_ACCESS only-once→ASK 断言红：对话面 OnlyOnceGuardTest + MCP 面 McpServerApprovalTest（2 用例） | ✅ 还原复绿 |
| `McpServer.kt:121`（registerPending 死信点） | ASK 分支恢复 registerPending + APPROVAL_REQUIRED req-N | 「无 req-N 死信」断言红（McpServerApprovalTest 3 用例） | ✅ 还原复绿 |

计数以逐锚亲跑 XML 为准，无虚高。

### L1③ 装配级

- `:app:assembleDebug` **BUILD SUCCESSFUL**（2026-09-03 实测）；git 工作树净（改动集=§一 10 文件）。

## 五、Token / KV Cache 影响（AGENTS.md 硬规则 1——A3 改 SDK 文案 = system prompt 组成部分）

- **Token 影响**：**会话内请求前缀恒定；跨会话前缀变化**。ToolSdkGenerator 双门段为 code-mode 提示节组成部分——本次重写第 221 行文案（约 +80 chars，中文分词后估计 ≤30 tokens 净增，SDK 节合计仍在 7K tokens 预算内，ToolSdkGeneratorTest 断言 `sdk.tokens <= 7000` 绿）；**会话内**该节由 buildSdkSection 确定性生成、请求前缀字节恒定不变（版本冻结语义）；**跨会话**部署本改动后前缀较上一版变化一次并在此后稳定。量级：单段文字修正，未动工具目录/签名层/判例结构。
- **KV Cache 影响**：同 Token 口径——前缀字节恒定→命中语义不变；跨会话仅一次前缀变化使对应缓存条目失效重建，无会话中途变化/逐轮变化；不涉及历史投影/压缩/折叠。
- 施工其余文件（A1/A2 判定与 MCP 通道）零请求链路改动（AgentLoop/LlmClient/请求构建/AI 面 tools 元数据零接触）。

## 六、L2 / L3（真机三场景——验收员执行模板）

- **JVM HTTP 层已实证**：McpServerApprovalTest 以真实 HttpURLConnection → 真实 McpServer（127.0.0.1 起服务）打 tools/call vault.get，三场景（default 允许→明文+足迹 / 拒绝与超时→拒绝文案无 req-N / open only-once 强制弹审）在协议层等价走通——curl 路径同构。
- **真机三场景（验收员平板/模拟器实测，命令输出带时间戳留证）**：
  - 前置：装 app-debug.apk（sha 见交付绑定）→ 启动 App 至 home → `adb forward tcp:8389 tcp:8389`（token 在 `filesDir/mcp_token.txt`）。
  - ① default：`curl -s -X POST http://127.0.0.1:8389/ -H "Authorization: Bearer $TOKEN" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"vault.get","arguments":{}}}'` → 设备弹窗/通知 → 点允许 → HTTP 返回明文 + 足迹 `decided=allowed-once`。
  - ② default：同路径点拒绝 / 等 60s 超时 → HTTP 返回「审批未通过」拒绝文案，**无 req-N / APPROVAL_REQUIRED**。
  - ③ open：UI 切 open 全权模式 → 同 curl → **同样强制弹窗/通知**（不直出明文）→ 当次允许才明文。
  - 本单 JVM 已覆盖协议语义（HTTP 层真实）；真机 UI 点按/通知渠道呈现链路（UPG-75 呈现层，本单零改动）留验收员实测复核——与 UPG-75 交付先例一致（其 L2/L3 真机亦留验收员）。

## 七、演示数据 / 生产态

- **声明：演示数据已还原且生产态已复核**（红线 18）——本单施工纯代码 + JVM 测试，未触碰演示数据文件/生产态配置；全量测试重写的 `c7_baseline_UPG63/*.jsonl`（仅时间戳）与 registry 生成物均已在提交前还原/回退至提交态（git 工作树净确认）。

## 八、共享面影响清单 + coverage_status（红线 24，P1-1 能力护栏）

共享面影响清单:
- 共享面: **有**——`McpServer.kt` tools/call（MCP 协议面）+ `McpToolScheduler.kt` dispatch/PermissionGuard.decide（对话面工具执行判定入口）+ `PermissionRegistryData.kt`（guard 单源数据）
- 影响下游: ① MCP 客户端（:8389 tools/call）：ask 类工具响应语义变化——旧 `APPROVAL_REQUIRED`+`req-N`（死信，无法批）→ 新同步等待后直接返回明文/「审批未通过」；外部客户端若依赖旧流程将断（STD 追加说明区已裁决废弃为设计变更）；② 对话面：判定入口函数由内联改 decide/isGranted 单源，行为等价（豁免序/goal 语义不变）；③ 呈现层 UPG-75（FIFO/弹窗/通知）：零改动，MCP 面 ASK 复用其弹窗/通知呈现
- 回归说明: 全量 --rerun-tasks 690 tests / 2 failures / 1 skipped（XML 统计时点 2026-09-03，2 失败 pre-existing AppearanceContractTest L2-9 1B + M-U50-5）+ 新增 MCP 三用例绿 + 变异 3 锚全红→复绿 + assembleDebug 绿 + 定向复跑 35 绿

coverage_status: PARTIAL（协议层 JVM 全覆盖含三锚亲杀；真机 UI 点按/通知呈现链路留验收员——见 §六；设计师裁决位见 coverage_decision）

coverage_decision:
- uncovered: 真机三场景的 UI 呈现链路（前台弹窗点按 / 后台通知按钮渠道）——UPG-75 呈现层，本单零改动，STD 真机 L3 销项由验收员平板实测
- risk: 低——MCP 协议层（curl 等价路径）已由 McpServerApprovalTest 真实 HTTP 全三场景实证；呈现层 UPG-75 既有验收
- merge_decision: **合 main @a7736b3（2026-09-03 已合，已 push origin）**——uncovered 项已由验收员 §P31 真机三场景全实证补齐（弹窗真机呈现+tap 允许执行+拒绝无 req-N+open 强制弹窗+logcat answerer×3），风险已退役
- reason: PARTIAL 的未覆盖维度（UI 呈现链路）经 §P31 真机实证闭环；STD-UPG-77-v1 content_sha256 三处对账一致；UPG-68 安全语义零改动
- decided_by: 设计师B
- decided_at: 2026-09-03

---

## 九、交付登记

- 已登记工单库.md（UPG-77 卡交付块）+ 已跑 `node 审验员/sync-orders.mjs --sync`（工单表.xlsx 单向生成，--check diff=0）。
- verify-hash 闸如实：登记前实测 HASH_REJECT not-ancestor（未合 main，预期）——设计师合 main 后审验复跑 → HASH_OK 归档闭环。
- 待验收员：走 STD 销项（diff 精读 + 变异亲杀复验 + 真机三场景）+ 设计师合 main。
