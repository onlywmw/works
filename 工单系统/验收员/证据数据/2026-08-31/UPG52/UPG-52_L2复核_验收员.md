# UPG-52 Memory OS 生命链 —— 验收员复核记录（2026-08-31）

验收对象：feat/upg52 = **06f239f**（单 commit，停靠 0aa0c07 绿基线；origin/main 已前进到 e249c61 含 UPG-51 合入链）

## 一、三子单代码核物

| 子单 | 核物结果 |
|---|---|
| 52-1 Semantic | ✅ SemanticEntry 状态机 PROPOSED→ACTIVE→RE_EVALUATE→ARCHIVED（canTransition 闸）；SemanticStore MD 分篇池 + frontmatter JSON 权威行 + `_index.json` 派生 + 三表（TYPE_DECAY_DAYS 衰减周期/ConflictDetector 同型互斥/状态机）；Decay≠Truth：diagnose 只产 RE_EVALUATE（「绝不直接 ARCHIVED」代码+注释在案）；blockedSourceHashes 删除传播 + purgeBlocked（人类触发、清空 blocked） |
| 52-2 Timeline | ✅ append-only（只 append/read/purge 公开面）；actor 权限 actorAllowed（ai-proposal 只 PROPOSED / system-decay 只 REEVALUATED+ARCHIVED / user 全量）；Correction 追加不改旧；原子写入 write()：语义落盘→ledger.append 同锁，失败⇒store.save(before) 回滚 |
| 52-3 Retrieval | ✅ coreProjection 只读投影（非双写）；importance/confidence/freshness 分离加权评分 + why 来源标注；TOP-K（默认 5）；8KB 预算裁剪（budgetCut + 超限提示） |
| 接线 | ✅ app +57 行：MainActivity 初始化（SemanticPoolFactory.create 门面工厂——零触 memory-core 类型）+ 4 只读 handler（memoryos.core/retrieve/timeline/semanticList）+ memoryos.devRun 主链回放 |

## 二、L1（独立复跑）

- **memory-os 模块：27/0/0**（SemanticLifecycle 9 / TimelineLedger 6 + AtomicWrite 2 / RetrievalService 6 / Boundary 2 / 主链集成 2）——总数与报告一致（报告「账本+原子 7」实为 8，P3 口径）
- **app：62 套件 446/0/0**；**合计 473/0/0** 与报告完全吻合
- boundary 测试 = 源码扫描「memory-os 只许用 memory-core 的 JsonMini 工具类」真锚

## 三、变异亲杀 3/3（独立）

| 变异 | 注入 | 结果 |
|---|---|---|
| M-D | diagnose 把 RE_EVALUATE 改 ARCHIVED（decay 直接归档） | ✅ 3 测试红（「diagnose 只产 RE_EVALUATE 不 ARCHIVED」等） |
| M-A2 | purgeBlocked filterNot→filter（反向误删未 blocked） | ✅ 「删除传播-不复活 且 purge 只清 blocked」FAILED |
| M-B2 | Timeline append 失败后不回滚语义 | ✅ 「Timeline 写入失败-语义回滚」FAILED |

（注：purge 测试只锁「blocked 被删」，未锁「未 blocked 保留」——首次变异 kept=emptyList 不红，反向变异才红——P3 建议补「未 blocked 条目保留」断言）

## 四、L2 真机（21770d7d，新 APK 55,498,633B）

- `logcat UPG52: Memory OS 初始化 ok dir=/data/user/0/com.mov.android/files/memory-os` ✅
- `files/memory-os/semantic/` 建立（空库）✅ 空库零影响（App 正常启动运行）✅
- **memoryos.core 只读 handler 真机调用**（8389 + Bearer token）：`{ok=true, core=（暂无已确认的记忆）}` isError=false ✅（空库语义正确：仅 ACTIVE 注入）
- 模拟器 emulator-5554：pm clear 后卡隐私门（无登录态进不了 MainActivity——环境路径非缺陷）；程序员模拟器证据核存

## 五、申报差异确认

1. UI 接缝（✓/◇、时间线只读页）依赖 UPG-49 记忆页合流——本单数据/规则/检索层+只读 handler ✅ 合理
2. Event Store+Pattern Detection 后置，候选源用 Memory API 条目（AI 只 PROPOSED、人采纳才 ACTIVE）✅ 语义一致
3. 基线停靠 0aa0c07，与 51 无文件冲突（52 改 memory-os 新模块+settings.gradle+app 局部接线），rebase e249c61 预期平滑 ✅

## 六、结论

**通过** → 待设计师 rebase e249c61 合 main。P3×2：账本+原子用例口径（7 vs 8）；purge 未锁「未 blocked 保留」断言。
