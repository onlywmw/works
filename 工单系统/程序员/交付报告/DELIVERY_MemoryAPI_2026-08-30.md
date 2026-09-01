# UPG-27 单A · Memory API 工程契约落地 —— 2026-08-30

- 分支：feat/ai-model-ui（worktree mov-ai-model-ui；与单1 同分支——单B 派单指定基于单A，串行安全）
- commit：**3bf598f**（已 push origin，远程 ls-remote 实证）
- 依据：Memory_API工程契约_v4（冻结）+ 我的记忆_验收方案_v1（L1/L3）
- 状态：**L1 契约层可用；L2/L3 待验收员**

## 交付（对照契约 v4 七节）

### 1. 模块化（§六 依赖检查）
- `:memory-core`（纯 JVM：MemoryEntity/MemoryStore/MemoryLifecycleService/JsonMini——**零 Android 依赖**）
- `:memory-api`（门面：MemoryApiEnvelope/PinnedStore/ChangeLog/MemoryApiService）
- `:app` 仅依赖 `:memory-api`（Gradle `implementation(project(":memory-api"))`）
- **验收员可跑依赖检查**：`app/src/test` `MemoryDependencyBoundaryTest`（3 用例：Gradle 配置/呈现层源码零 `com.hermes.mov.memory.core` import/core 零 android.*）

### 2. API 门面（§二/§三）
统一 `{ok, code, data, syncToken, seq}`（失败面也带 token/seq）；7 API 全实现：`memoryList/getDetail/promote/remove/restore/setPinned/memoryChanges`。

### 3. 状态机（§一 逐格）
| 操作 \ 当前态 | DRAFT | ACTIVE | TOMBSTONE |
|---|---|---|---|
| promote | ok→ACTIVE | ok 幂等 | NOT_FOUND |
| remove | ok→hidden | ok→hidden | ok 幂等 |
| restore | BAD_STATE | ok 幂等 | ok→previousStatus / RESTORE_EXPIRED（5s 窗口） |
| setPinned | ok | ok | NOT_FOUND（api 层） |

- **remove 立即 tombstone**（无 5s 延迟——变异②亲杀）
- **restore 恢复 previousStatus+previousPinned**（tombstone 快照；变异①亲杀）
- **死错误码 ALREADY_PROMOTED/ALREADY_REMOVED 零出现**（连注释都无——测试锚）

### 4. memoryChanges（§三 细则）
- 首 token=list syncToken（读快照）；seq 单调；`{id,op(PROMOTED/REMOVED/RESTORED/PINNED),status,seq}`
- **lastUsedAt 不进变更流**（结构断言锚③）
- ChangeLog 压缩保留（maxEntries=2000，测试用小容量验证滚动）→ 旧 token 低于下界 → **SYNC_TOKEN_INVALID** → `freshBaseline()` 全量回退 + 新 token 成基线（冻结行③）
- 在途竞态：promote 幂等不产生第二条变更（测试断言 1 条）

### 5. pinned 归属（§四.2）
- **PinnedStore 在 api 层独立存储**（pinned.json），memory-core **零感知**（boundary 测试证实）
- 上限 3 原子 check-and-set（连点第 4 条 PINNED_LIMIT 不破 + 幂等重复置顶 ok）
- 置顶移除→释额；草稿晋升→保持置顶；tombstone 快照 previousPinned → restore 恢复

### 6. keyset 分页 / facets（§三）
- 游标=排序元组+id（base64 JSON；ACTIVE `pinned DESC,lastUsedAt DESC` / DRAFT `pinned DESC,createdAt DESC`）
- `facets.activeCount/draftCount` 精确分状态计数（与快照一致）
- pageSize=30；`content`=原文（摘要 UI 层——单B）

### 7. 持久化（§四/七）
- 原子写盘（tmp+rename，无残留）；`version+migrated` 迁移幂等（升级/二次启动不重建）
- 损坏文件容错（空态启动不崩溃+原文件保留）
- `saveFailures` 故障注入（TIMEOUT 回滚面）
- 内存缓存 + 写盘（同步锁内收敛；Flow 进程内实时——changesFlow 供单B）

## 验证（L1 自动化）
- **memory-core 8 用例**：promote/remove/restore 逐格+幂等+死码零出现；存储原子/版本迁移/损坏容错/故障注入
- **memory-api 16 用例**：Envelope 统一 7 API/全链状态机+幂等重放/restore 完整状态/pinned 上限 3+释额+晋升保持/keyset 3 页游标/facets 精确/ACTIVE 排序/changes 增量+lastUsedAt 锚/SYNC_TOKEN_INVALID 自愈+新基线/seed 幂等/竞态去重/锚③结构
- **app 依赖边界 3 用例**（Gradle/源码/core 零依赖）
- **变异亲杀 3/3**：①删 restorePinned→restore 测试红 ②remove 延迟→remove 测试红 ③（锚③结构断言字段存在则红）
- 全量：app 58 类 **427/0/0** + core 8 + api 16 = **451 用例 0 失败** + assembleDebug 绿
- Token/KV：**0/0**（纯本地库；AI 工具面 memory.* 未触）

## 接线（MainActivity）
- `memoryApi` 成员（onCreate 构造：filesDir/memory-api/{entities,pinned,changes}.json）
- **一次性 importSeeds**：自现有 MemoryAggregation（跨 session journal 聚合）投影——id=SHA-1(内容) 前缀、status=promoted?ACTIVE:DRAFT、refCount/lastUsedAt 投影、过期衰减条跳过、重复导入幂等
- 单B 数据源=本门面（UI 只 import memory-api）

## 如实申报（边界与观察）
1. **AI 工具面（memory.save/search/cover/judge）未切到本门面**——现状=两套内存视图（AI 面=journal 聚合；管理页=门面库）——**数据一致性/双库统一为后续单规划范围**（契约 v4 边界未含 AI 面切换；避免超范围改动）
2. 门面 `remove` 不物理清除任何引用（契约=软删语义 ✓）；journal 侧 tombstone 与门面 tombstone **各自独立**（同一内容双面压制由单B diff 呈现时处理）
3. 变更流为**进程内**（契约 §四.1 允许）；跨进程/云同步留口

## 待验收
L1（验收员：状态机逐格/Envelope/死码零出现/依赖检查/锚三条亲杀）+ L3（竞态/失败注入/迁移幂等/SYNC 自愈实测）——全部已自动化落 test XML；**单B 待派单**。

## 证据
- test XML：memory-core/build/test-results/test/*.xml（8 用例）；memory-api/build/test-results/test/*.xml（16 用例）；app/build/test-results/testDebugUnitTest/TEST-com.mov.android.MemoryDependencyBoundaryTest.xml（3 用例）
- 变异：①/② 结果已记录（删除 restorePinned/延迟 remove → 对应测试必红）
- 报告：本文件；两表已登记
