# UPG-59 B 线蒸馏 MVP —— 验收员复核记录（2026-08-31）

验收对象：feat/upg59 = **8da2907**（2 commit 2dd49a1→8da2907；基底 main 8bcc167=当时 main 顶——最新版纪律执行 ✓）
注：UPG-54 已由审验员合 main（0d7ff2b/8bcc167 链）；本单基底即最新 main，rebase 零负担

## 一、核物（9 项）

| # | 核物结果 |
|---|---|
| ① 蒸馏器旁路 | ✅ LessonDistiller（com.hermes.dsh.compaction.distill，308 行）纯函数；compaction 既有路径零改动（diff 无 compaction 既有文件） |
| ② 三分类+evidence | ✅ RETRYABLE_PATTERN（500/502/503/504/network/offline/超时/网络/连接/断开）→不产教训；guard/fabricate_hit→FABRICATED 0.9；业务拒绝→NON_RETRYABLE 0.5；同工具+同错误聚合 occurrences；evidence=lines=行号列表 |
| ③ 六字段 fail-closed | ✅ LessonCandidate init require（category 白名单/evidence 非空/confidence 0.0-1.0） |
| ④ confidence 分层 | ✅ LessonInjector.select 只放 `type==LESSON && status==ACTIVE`（PROPOSED 恒不进注入面 V-4/B-5） |
| ⑤ 注入配额 | ✅ MAX_LESSONS=3+DEFAULT_BUDGET_BYTES=600；超配额→overflowed 落库不进 prompt；排序 confidence↓→updatedAt↓→id 字典序（全序=前缀恒定 KV cache 对齐） |
| ⑥ 过期机制 | ✅ reevaluateLessonsBySourceHash（registryHash 变更→ACTIVE 降 RE_EVALUATE；actor=system-decay 对齐 diagnose；PROPOSED 不动）；TYPE_DECAY_DAYS["LESSON"]=0（时间 decay 豁免——「时间 decay 会把工具没修好期间仍有效的教训错误降级」） |
| ⑦ gold fixture | ✅ gold_nonretryable/gold_fabricated（对齐 FailureEventSourceImpl 口径） |
| ⑧ EvalFixture 反哺 | 提案形态就绪（申报 B-8 口径，落地走 UPG-56——边界外如实） |
| ⑨ B-3 负用例 | ✅ 「网络断与5xx错误不产生教训条目」 |

**memory-os 三增量** ✅：TYPE+LESSON（decay=0 注释含反例论证）/accept 同型互斥豁免 LESSON（`mutualExclusive = changed.type != "LESSON"`——教训天然多值）/reevaluateLessonsBySourceHash

**MainActivity 接线** ✅：crossSessionLessonSegment（注入前 registryHash 扫描过期→池更新→配额选择→render 注入段）

## 二、L1（独立复跑）

- 全量 :app:testDebugUnitTest = **73 套件 519/0/0**（跳 0；程序员报 519/0/1 的 1=跳过口径）——DistillerTest 9/0 + LessonPoolTest 6/0

## 三、变异抽杀 3/3（全红）

| 变异 | 注入 | 结果 |
|---|---|---|
| M-V4 | select 去 `status==ACTIVE` 过滤 | ✅ B5「PROPOSED 不进注入面」+B7 双红 |
| M-V3b | LessonDistiller 加 `applyLessons(pool: SemanticPoolService)` | ✅ B8「蒸馏器无写入口」FAILED（反射锚：参数类型集+apply 前缀） |
| M-配额2 | select 去 `selected.size < maxLessons` 条数上限 | ✅ 「配额硬上限 3条与字节预算」FAILED |

（注：首试 V3 `writeLessons(dir: File)` 不红——锚类型集=Session/TimelineSink/SemanticPoolService+apply 前缀，File 不在集合——按锚语义换 V3b 即红，锚设计合理）

## 四、指定复核项

- **B-2 回溯抽查** ✅ 强锚：evidence `lines=4,6` 逐行回溯原始 JSONL（行号-1 索引）+断言该行含 isError/fabricate_hit 事实+分类对应文本（「未知字段」/matchedPattern）+checked≥3——真回溯非摆设
- **B-6 构造链** ✅：A 会话犯错→蒸馏→入池 PROPOSED→人工 accept→B 会话注入段含教训（biz.onboardSet+「历史教训」）+**两次渲染 seg==seg2（前缀恒定锁定）**
- **LESSON 互斥豁免契约** ✅：配额测试内 `assertEquals(5, ...LESSON && ACTIVE)`——5 条教训全部 ACTIVE（互斥未豁免则第 2 条起被降级，5 不可达）

## 五、L2 模拟器增强面

可选未做（如实）：B 线核心为 JVM 机制链（已全锚），模拟器需真实犯错+蒸馏+人工 accept 全流程，环境成本高、增量证据有限——留生产观察（B-6 已是端到端机制链的 JVM 等价证明）。

## 六、结论

**通过**。基线=main 顶 8bcc167，rebase 零负担。里程碑一承载单成立：UPG-60 门 3 信号、UPG-56 fixture 反哺可接续。
**P3**：生产复发率=OBSERVABILITY ONLY（申报如实）；L2 模拟器增强面可选未做。
