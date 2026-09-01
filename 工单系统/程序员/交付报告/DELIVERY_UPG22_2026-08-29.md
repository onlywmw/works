# DELIVERY_UPG22 — 记忆尾单五件交付（2026-08-29）

> 程序员 C ｜ 分支 `feat/upg22` ｜ 提交 `aacb15b`（基底 main 0fdfe87，已 push origin；回滚 = revert 单 commit）｜ 派单文本 `设计师/派单/UPG-22_记忆尾单_派单_2026-08-29.md`
> 已登记两个表：工单表.xlsx UPG-22 行（程序员 ✅C 完成 + 备注 hash）+ 工单库.md 状态同步（先表后库）
> 认领登记：`C 已认领 @2026-08-29 21:55（worktree=mov-upg22 branch=feat/upg22）`（工单表在案；本批基线已 fast-forward 至最新 main 0fdfe87——规则 19）

---

## 五件交付（一件一验收点）

### ① COVER_HIT 装配打点接线（主修复，UPG-05 遗留收口）

- **断点**：`memoryCoverPromptSegment()` 装配注入全链无 `recordCoverHits` 调用（唯一调用者 = AI 显式 memory.cover 工具路径）→ draft 引用恒 0 → 永不晋升 → 14 天衰减清场（晋升证据链半断）。
- **修法**：打点逻辑抽 **companion 纯函数 `recordCoverHitForAssembly(tools, entries, fingerprint)`**（生产接线与 instrumented 断言 A/B/C 共用同一代码路径），`memoryCoverPromptSegment` render 后调用（tools 提升作用域共用同一 MemoryMcpTools 实例）。
- **语义**：entries 空 / 指纹 null（未 Freeze）不打点；`turnId = "cover-<指纹>"` → MemoryAggregator dedupe key=(sessionId,turnId,draft) **整段只计 1 次**（对齐 Freeze 语义，不自创去重）；显式移除 invalidate → 指纹变 → 新 turnId 合法再 +1（E4a 联动）；打点失败静默 Log.w 不阻塞主链路。
- **配套**：`MemoryMcpTools.journalView()` 只读访问器（打点复用同一 session journal 实例，零旁路写入；派单原文「MemoryMcpTools 即 MemoryJournal by 委托」与现实现不符——实际内部持有 journal，访问器为最小等效落地）。
- **真机销项预演**：instrumented 断言 A 即「装配注入 → journal memory/ref source=cover」实物（真实 JSONL 落盘路径）；验收员 L2（5558 新 session 显化页「引用 0 次」变 1）按派单执行。

### ② L 组链路断言补入 MemoryLinkInstrumentedTest

- **断言 A**：装配注入（currentCover + 生产接线同函数）→ journal `memory/ref source="cover"`、`turnId="cover-<指纹>"` 事件，花生 +1 ✓
- **断言 B**：同 session 同指纹重复装配 → 计数 ≤1（Freeze dedupe）✓——**coverCount = 聚合 dedupe 口径复刻**（distinctBy(turnId,draft)；首版直数事件条数把同 key 重放误计 2，已按 MemoryAggregator :119 生产语义修正）
- **断言 C**：显式移除 → invalidateOnRemoval → 指纹变 → 再装配 → 幸存条合法再 +1（2 次）、被移除条不再 +1 ✓
- **变异锚**：M1 删接线行 → `MemoryCoverWiringContractTest` 活行锚必红（新建 JVM 契约测试，活行口径防「注释掉」逃逸）；M2 turnId 改随机值 → 断言 B 必红（dedupe 失效重复计数）。

### ③ writeTools 冗余 memory.save 清理

- `McpToolScheduler.writeTools` 删 `"memory.save"`（harmlessTools :123 保留——v5.3 定案）；harmless 优先判定下 save 早已自动放行，清理零行为变化（PermissionGuardTest 口径注释同步：仅 harmless 单列）。

### ④ tools/ 四施工临时物捎清

- 删 `r1_test.cjs` / `robust_install.sh` / `wire_memory_host.cjs` / `fix_dispose.cjs`（UPG-05 施工临时物、硬编码 mov-upg05 路径）；tools/ 其他历史杂物未动（另案）。

### ⑤ R3 边界案释法发布（随单进验收剧本，无代码改动）

> **R3「不张冠李戴」判据口径（设计师已出，本单携带发布）**：以**事实归属**判，不以词面出现判——
> - **判失**：AI 把记忆事实挂到错误对象（剧本：记「我的猫叫元帅」→ 问「我的狗叫什么」→ 答「元帅」）；
> - **判过**：词面出现但归属正确（「你说过猫叫元帅」），或明确表示该对象无记忆（「狗的名字你没说过」）。
> 验收员 E/R 剧本 R3 条按此口径执行；验收员持有的边界案（字面出现元帅/意图未嫁接判过）与本口径一致（工单库 UPG-05 卡遗留③已确认）。

## 三、验证

| 口径 | 结果 |
|---|---|
| L1 全量 | **51 类 363 用例 / 0 失败 / 0 错误 + 1 跳过**（rm -rf 强制重跑 XML 逐件统计；feat/upg22 树口径 = main 0fdfe87 的 362 + 本单活行锚 1） |
| instrumented（真机 5556） | **MemoryLinkInstrumentedTest 3/3 全过**（含新断言 A/B/C）；`MemorySeedFactoryTest.coldStart` 一次 2291ms>2s 红，复跑全绿——模拟器负载 flaky，与本单无关路径（显化页渲染，打点在 systemPrompt 装配路径） |
| assembleDebug | BUILD SUCCESSFUL |
| Token 脚本 | `check-token-effect` 通过 |
| 变异 | M1 接线活行锚（删接线必红）+ M2 断言 B（turnId 随机必红）——验收员亲杀口径，M2 语义在断言 B 设计中封闭（首版口径偏差已修：事件条数→聚合 dedupe 计数） |
| 行尾 | MainActivity.kt 纯 CRLF（施工中曾混 LF，unix2dos 修复）；块注释无嵌套 ✓ |

## 四、红线复核

不改工具行为 ✓（打点为新增可观测面，save 清理零行为变化）；描述真实 ✓（本单无新描述）；登记层与接线同批 ✓；请求前缀恒定 ✓（打点在 systemPrompt 装配内、零新增会话中途变动点）；回滚 = revert 单 commit ✓；禁平行结构/禁落盘 ✓（打点走 journal 唯一写点）；MainActivity 纯 CRLF ✓。

## 五、交付物

| 项 | 值 |
|---|---|
| 分支 / hash | `feat/upg22` / `aacb15b`（push origin ✓；首推 f9f4cb0 后 amend 修正测试计数+CRLF，force-with-lease 显式 lease 重推） |
| 改动面 | MainActivity.kt（打点接线+companion 纯函数）/ MemoryMcpTools.kt（journalView）/ McpToolScheduler.kt（writeTools 清理）/ MemoryLinkInstrumentedTest.kt（断言 A/B/C）/ MemoryCoverWiringContractTest.kt（新增）/ PermissionGuardTest.kt（口径注释）/ tools/ 四删除；10 文件 +141/-113 |
| 报告 | 本文件 `程序员\交付报告\DELIVERY_UPG22_2026-08-29.md` |
| 销项联动 | 交付后验收员复验 → 挂账表「UPG-05 COVER_HIT 打点断线」划销；设计师侧 BP-05 → ✅、记忆打点链节点 → ✅、UPG-05 卡遗留①③④划销 |
