# Memory API 工程契约 v3（校对补缺后）

> 设计师 @2026-08-30 ｜ 承接 v2 ｜ 大神：**补完 4 缺口可免二轮直接进排期** → v3 补齐。
> 说明：本契约 = 工程规范;细项由架构师 + Android 开发校对时落到实现。**产品词汇表唯一:用户可见中文 = 「待确认/已记住」(API 参数用 ACTIVE/DRAFT)**。
> **v3 冻结前补 4 行(大神定,补完可冻结进工程)**:①restore 恢复 previousStatus+previousPinned ②remove 立即生效,5s 仅是 UI 恢复窗口 ③全量刷新后新 syncToken 成为后续 changes 基线 ④所有 API 统一 Result Envelope。

---

## 〇、总原则（不变）
UI 永远不是 Memory 的事实来源;四层边界;UI 只 读→呈现/操作→请求/返回→diff。

---

## 一、状态机表（v3 核心 · 统一幂等/冲突,消除歧义）

| 操作 \ 当前态 | DRAFT | ACTIVE | TOMBSTONE |
|---|---|---|---|
| `promote`(设为重要) | ok→ACTIVE | ok(幂等,status=ACTIVE) | NOT_FOUND |
| `remove`(移除) | ok→hidden | ok→hidden | ok(幂等,hidden) |
| `restore`(撤销) | BAD_STATE | ok(幂等) | ok→回原态 / RESTORE_EXPIRED(物理清理) |
| `setPinned`(置顶) | ok | ok | NOT_FOUND |

> **实现注**:tombstone 记录**被删前原状态**,restore 才能正确回位。**删掉死错误码 `ALREADY_PROMOTED/ALREADY_REMOVED`**(状态化返回后不可达分支 = 不可测);冲突只留 `NOT_FOUND`。

**错误码三分类**:
| 类别 | 错误码 | UI 处理 |
|---|---|---|
| 失败→回滚 | `TIMEOUT / UNKNOWN / RESTORE_EXPIRED / BAD_STATE` | 回滚原态 + 提示 + 重试 |
| 冲突→diff | `NOT_FOUND` | 以底层返回 diff 更新(状态已变) |
| 业务拒绝 | `PINNED_LIMIT / SYNC_TOKEN_INVALID / BAD_STATE` | 提示(置顶已满/同步失效回退/非法状态) |

**(forward-looking 预留)**:`NETWORK / CONCURRENT`——本地持久化下几乎不可达,为云同步乐观锁预留,**标注为未来**,开发勿写不可达分支凑覆盖率。

---

## 二、API 契约（v3 补齐）

| API | 输入 | 返回 | 语义 |
|---|---|---|---|
| `memoryList(filter,cursor)` | filter=`待确认/已记住`↔ACTIVE/DRAFT / cursor(keyset,默认 pageSize=30) | `{items:[{id,status,content,source,createdAt,lastUsedAt,pinned}], nextCursor, syncToken, facets}` | 分页;**排序=ACTIVE `pinned DESC,lastUsedAt DESC` / DRAFT `pinned DESC,createdAt DESC`**;`syncToken`=本列表读快照(Δ基线,原子);`facets:{activeCount,draftCount}`(分状态计数,标注"约") |
| `memoryGetDetail(id)` | id | `{...同上, refCount(调试,暂不展示)}` | 详情 |
| `memoryPromote(id)` | — | 按状态机表 | 设为重要(DRAFT→ACTIVE) |
| `memoryRemove(id)` | — | 按状态机表 | 移除(tombstone 软删,只挡本条) |
| `memoryRestore(id)` | — | 按状态机表 | 撤销(UI 5s 窗口;API 不限时,除非物理清理→RESTORE_EXPIRED) |
| `memorySetPinned(id,pinned)` | — | 按状态机表 / PINNED_LIMIT | 置顶(排序入 list;上限 3,原子 check-and-set) |
| `memoryChanges(syncToken)` | syncToken(=seq) | `{changes:[{id,op(PROMOTED/REMOVED/RESTORED/PINNED),status,seq(idx)}], newToken}` | **对账增量**;seq 单调,token=seq;量大分批续拉 |

**memoryChanges 细则（v3 补）**:
- **首 token**:`memoryList` 首页响应附 `syncToken`,与列表**同一读快照原子获取**;冷启动基线由此建立;
- **失效语义**:底层日志压缩 → 旧 token 拉不全 → 返回 `SYNC_TOKEN_INVALID` → UI **回退全量刷新**;
- **变更结构**:`{id, op(PROMOTED/REMOVED/RESTORED/PINNED/UPDATED), status, seq}`;seq 单调,真增量分批续拉;
- **哪些算变更**:状态/隐藏/**置顶**必推;`lastUsedAt` **不进变更流**(防 ACTIVE"边看边重排"),列表排序容忍会话内陈旧;
- **与在途操作竞态**:UI 刚发 promote 又收到同 id changes → **按 id 去重,seq 高者为准**。

---

## 三、规则契约（v3 修正）

### 1. 监听机制（v3 定稿,解 v2 矛盾）
- **进程内 Flow/观察者推送 = 实时性**;`memoryChanges` = **对账**(页面打开/前台恢复时拉,非常驻轮询);**删 30s 定时器**(本地进程内轮询耗电+扩大竞态面);
- `memoryChanges` 价值 = 可测试契约 + 未来跨进程/云同步;保留为规范,不当心跳用。

### 2. pinned 归属（v3 和解 v1 定案）
- **pinned 持久化在 `memory-api` 门面层的独立存储**;`memoryList` 组装时由门面 join 排序;**`core/MemoryLifecycle` 完全不感知 pinned**(不污染生命周期);
- 三条规则:①置顶条被移除 → 置顶集合**同步清理、释放名额**(防幽灵占额)②置顶的草稿晋升 → 保持置顶 ③上限 3 = **原子 check-and-set**(连点不破)。

### 3. 翻页 × 可变排序键（v3 补正确性）
- keyset 游标(排序元组 + id 稳定次序);
- **置顶/取消置顶(用户主动操作)→ UI 重拉第一页**(简单可靠,防跨页跳/重复);
- `lastUsedAt` 不触发会话内重排(与会话内陈旧一致);分状态计数走 `facets`(免 UI 两 filter 各拉一遍 / 每页 COUNT)。

### 4. 其他
- term 统一(用户可见=待确认/已记住;API=ACTIVE/DRAFT);
- `pageSize` 默认 30;`content`=**原文**还是摘要?→ 契约:list 返回**原文**(摘要由 UI/生成式截取,契约注明 content=原文,40 字摘要 UI 层处理)。

---

## 四、测试契约（v3 增补）
- 状态机表**逐格断言**(promote/remove/restore/setPinned × DRAFT/ACTIVE/TOMBSTONE 幂等重放);
- `SYNC_TOKEN_INVALID` → 全量回退自愈;
- 翻页中途置顶变更 → 重拉首页不跳条;
- `changes` 与在途用户操作同 id 竞态 → 去重不双应用;
- 置顶连点 → 上限不破;置顶条移除 → 名额释放;
- 5s 撤销窗口配置变更/页面重建 → 撤销不失效;
- (承 v2)契约/竞态/失败注入/迁移幂等/UI diff(300 条不丢滚动)/分页游标/置顶排序。

---

## 五、依赖检查（同 v2 推荐）
`memory-api`(门面,UI 只依赖)/`memory-core`(Lifecycle+Persist)模块化,Gradle 强制;或 `ArchUnit` 包依赖测试。CI 落此 + 契约/竞态/失败注入测试全绿 = L3 达标。

---

## 六、边界（不变）
同内容再写入拦截(语义 tombstone 待定)/ 编辑/合并/标签/版本 / 「使用」回填对话 / 云同步(NETWORK/CONCURRENT 预留)——独立需求留口。

---

## 七、结论
- v3 补大神 4 缺口(memoryChanges 细则 / pinned 归属和解 / 状态机表统一 / 游标×排序重拉首页)+ 次级修正(监听定稿 / CONCURRENT·NETWORK 标 forward-looking / 术语唯一 / pageSize·content 原文)+ 测试增补;
- **补完可进排期**(大神:免二轮)。留给架构师 + Android 开发校对落实现。
