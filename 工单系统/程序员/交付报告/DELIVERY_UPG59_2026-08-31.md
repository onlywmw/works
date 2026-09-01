# DELIVERY_UPG59 B 线蒸馏 MVP（失败根因蒸馏 · 里程碑一承载）

**程序员 C @2026-08-31** ｜ 分支 `feat/upg59` ｜ 基线 **main 8bcc167**（最新版纪律：开工前 fetch 确认）｜ worktree `mov-upg59`
**交付 commit**：`2dd49a1`（B 线蒸馏 MVP 全量）→ `8da2907`（registry 生成物同步 173 工具面）
**已登记两个表**（工单表 UPG-59 行 + 工单库状态）——见文末。

---

## 一、9 项施工范围逐条落地

| # | 范围 | 实现 |
|---|---|---|
| ① | 蒸馏器（compaction 包旁路） | `com.hermes.dsh.compaction.distill.LessonDistiller`——纯函数 object，**与对话压缩路径零耦合**（B-9：Compaction.kt/BasicCompactionEngine 零改动，全量既有 compaction 测试全绿；SummarizationInput 未触碰） |
| ② | 三分类+evidence 指针 | `FailureCategory{RETRYABLE, NON_RETRYABLE, FABRICATED_BLOCKED}`；fabricate_hit 字段现成消费（`SessionEvent.GuardFabricateHitEvent.matchedPattern`，AgentLoop.kt:446-453 口径）；evidence=JSONL 行号列表（`lines=4,6`），DistillJsonl 解析器按行保真 |
| ③ | 六字段 fail-closed | `LessonCandidate(lesson/category/evidence/confidence/source_session/source_event)`——**init require 全字段非空+category 枚举+confidence ∈[0,1]，缺任一抛 IllegalArgumentException**（B-4：拒绝构造非降级入库） |
| ④ | confidence 分层 | FABRICATED=0.9（guard 确证）/ NON_RETRYABLE=0.5（低）；**PROPOSED 恒不进注入面**（V-4；LessonInjector 过滤 `status==ACTIVE`——B-5 锚） |
| ⑤ | 注入配额 | `LessonInjector.select`：**≤3 条 + 总字节 ≤600B**；超配额→overflowed（只落库备查不进 prompt）；排序确定性（confidence desc→updatedAt desc→id 全序）=**注入段前缀恒定**（对齐 MemoryCover 冻结/KV cache 红线）；渲染 `【历史教训】（跨会话沉淀·勿重蹈）` 恒定前缀 |
| ⑥ | 过期机制 | `SemanticPoolService.reevaluateLessonsBySourceHash(currentHash)`：type=LESSON+ACTIVE+sourceHashes 不含当前 hash → **RE_EVALUATE**（actor=system-decay 对齐 diagnose；状态机 ACTIVE→RE_EVALUATE 合法迁移）；教训条目 sourceHashes=[入池时 registryHash]——「事实变了，派生结论要重验」（纪律 6） |
| ⑦ | gold JSONL fixture 三类 | `app/src/test/resources/distill/gold_{retryable,nonretryable,fabricated}.jsonl`——真实 session.jsonl 事件 schema（tool/call+tool/result.isError+resultContent 口径对齐 FailureEventSourceImpl；guard/fabricate_hit 全字段） |
| ⑧ | EvalFixture 反哺 | `LessonDistiller.toEvalFixtureProposals()` 提案形态产出（B-8：进回归集必须经审核事件）——实际进 EvalFixture 随 UPG-56 落地（诚实申报：提案已就绪，落地依赖 56 的 fixture 版本机制） |
| ⑨ | B-3 负用例 | RETRYABLE_PATTERN（timeout/socket/连接/5xx/网络）命中 → 只计数（`retryableCount`）**不产教训提案**；fixture `gold_retryable.jsonl`（connect timeout+unreachable host）验证 proposals 空 |

## 二、注入接线（MainActivity）

- `crossSessionLessonSegment(sessionId)`：memoryGenePromptSegment 旁路追加段（不动 E3 既有逻辑）——`LessonInjector.select(pool.snapshot().entries)` → `render`；池未初始化/异常 → 空串（不阻塞主链路）
- **过期触发（B-7）**：注入前 `pool.reevaluateLessonsBySourceHash(LessonDistiller.registryHash(mcpHandlers.keys))`——工具面变更即触发降级+appendLog
- **memory-os 两处增量**：①SemanticEntry TYPE 表 +`LESSON`（decayDays=0——教训不按时间 decay，按 source hash 重验；时间 decay 会把「工具没修好期间仍有效」的教训错误降级）②accept 的**同型互斥豁免 LESSON**（教训天然多值——每个坑一条独立生命周期；其过期走 source hash 不走同型仲裁）

## 三、L1 验证

- **全量**：`:app:testDebugUnitTest --rerun-tasks` **73 类 519 过 / 0 败 / 1 跳过**（含既有 compaction/memory-os/approvalregistry 全套——B-9 旁路零污染实证）
- **`assembleDebug` 绿**（55,588,170B）+ `check-token-effect` 过
- **变异 5/5 亲杀**（先 commit 后变异，git checkout 还原）：

| 变异 | 对象 | 杀伤 |
|---|---|---|
| U59-V1 | classify 网络类豁免删（isError 恒 NON_RETRYABLE） | B1/B3 双红（网络断升级为教训） |
| U59-V2 | LessonCandidate 删 evidence require | B4 fail-closed → 红 |
| U59-V3 | LessonInjector 放行 PROPOSED | B5 红 + B7 连带红（RE_EVALUATE 也泄漏——双证 V-4 过滤器） |
| U59-V4 | select 条数上限 +7（失效） | 配额测试红（selected=5） |
| U59-V5 | reevaluateLessonsBySourceHash 恒空 | B7 红（事实变更不重验） |

- **新测试**：DistillerTest 8（B-1 三分类×3/B-2 逐行回溯 0 错/B-3 负用例/B-4 fail-closed 7 态/B-8 反射扫 API 面无写入口+DistillReport 纯数据/B-9 幂等+容错/registryHash）+ LessonPoolTest 6（B-5 PROPOSED 过滤/B-6 机制链端到端/A 犯错→蒸馏→入池→accept→B 会话渲染段含教训+确定性/B-7 hash 变更降级+同 hash 不重复降级+人工裁决回 ACTIVE/配额 3 条+溢出落库/字节预算裁剪巨条/render 恒定前缀）

## 四、B-1~B-9 判据对照

| 判据 | 结果 |
|---|---|
| B-1 三分类正确性+evidence | ✅ 三类 gold fixture 全分类正确，输出带 evidence 指针 |
| B-2 evidence 回溯（抽 3 中 0 错） | ✅ 聚合多行指针逐行回溯（4,6→原始 JSONL isError 行；3→fabricate 行） |
| B-3 网络断/500 不产教训 | ✅ 负用例+RETRYABLE_COUNT 可观测 |
| B-4 六字段 fail-closed | ✅ 拒绝构造（7 非法态验证） |
| B-5 低 confidence 不进注入面 | ✅ PROPOSED 过滤测试（V-3 变异双红背书） |
| B-6 跨会话机制验证（构造环境） | ✅ JVM 端到端：犯错→蒸馏→入池→accept→新会话渲染段含教训+前缀确定性；生产复发率=OBSERVABILITY ONLY |
| B-7 过期机制 | ✅ hash 变更→RE_EVALUATE→人工裁决回 ACTIVE；**未纳入部分：无**（MVP 已含，无已知缺口） |
| B-8 B/A 边界 `[CR]` | ✅ 反射扫 API 无写入口+DistillReport 纯数据+提案入池走 PROPOSED（ai-proposal actor） |
| B-9 并列模式不污染 | ✅ 既有 compaction 测试全绿+SummarizationInput 零改动+蒸馏纯函数幂等 |

## 五、Token / KV 影响申报

- **注入面**：新增【历史教训】段——**硬上限 3 条+600 字节**（实际取决于池内 ACTIVE LESSON 数，冷启动=0 字节）；前缀恒定（确定性排序）吃 KV cache；E3 既有【失败教训】段不变
- **每 prompt 增量**：0~600 字节（有教训确认后）——教训价值在「对的那几条在场」，进化基础设施不向对话借时间
- **过期触发成本**：注入前一次 registryHash（mcpHandlers.keys sha1）+池快照过滤（内存操作，毫秒级）
- `check-token-effect` 过

## 六、红线自查

- **V-3**：蒸馏器无任何规则/阻断写入口（B-8 反射锚+输出类型=DistillReport 纯数据；入池走 PROPOSED=ai-proposal actor）
- **V-4**：低 confidence 教训不进注入面（LessonInjector status==ACTIVE 过滤+PROPOSED 泄漏变异双红）
- **配额硬上限**：3 条+600B，超配额只落库（变异 U59-V4 红背书）
- **模型假设注释**：LessonDistiller 头注「本组件编码的模型假设：三分类规则假设 journal 错误形态可规则归因——需随 MODEL_UPGRADE_RECHECK 复核」✓

## 七、登记

- 工单表 UPG-59 行：程序员列 `✅C 完成`、备注 `feat/upg59 8da2907（报告 DELIVERY_UPG59_2026-08-31.md）`
- 工单库.md UPG-59 状态：`程序员✅完成，待验收`
- 下游交接：UPG-60 门 3 信号（生产退化 OBSERVABILITY）/UPG-56 fixture 反哺落地（提案已就绪）

**待验收员**：L1 复跑+变异抽杀（建议 U59-V1/V3/V5）+ B-2 证据回溯抽查 + B-6 构造链复核 + memory-os LESSON 互斥豁免与 reevaluateBySourceHash 契约复核；L2 模拟器可做（构造会话→蒸馏→入池→新会话注入段 logcat 验证——JVM 已全链覆盖，模拟器属增强面）。
