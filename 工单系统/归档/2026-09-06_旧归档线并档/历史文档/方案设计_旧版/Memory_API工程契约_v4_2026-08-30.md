# Memory API 工程契约 v4（冻结版）

> 设计师 @2026-08-30 ｜ 大神:9.4/10,"契约层基本成立,可交架构师 + Android 落实现" ｜ 4 行补完 → **冻结,免二轮评审,直接进工程**。
> 产品词汇表唯一:用户可见中文 = 「待确认/已记住」;API 参数 = `ACTIVE/DRAFT`。下文为 v3 全部 + 冻结 4 行落实到正文。

---

## 〇、总原则（不变）
UI 永远不是 Memory 的事实来源;事实来源 = `Memory API → Lifecycle → 持久化`。UI 只 读→呈现/操作→请求/返回→diff。四层边界同前。

---

## 一、状态机表（统一幂等/冲突）

| 操作 \ 当前态 | DRAFT | ACTIVE | TOMBSTONE |
|---|---|---|---|
| `promote`(设为重要) | ok→ACTIVE | ok(幂等,status=ACTIVE) | NOT_FOUND |
| `remove`(移除) | ok→hidden | ok→hidden | ok(幂等,hidden) |
| `restore`(撤销) | BAD_STATE | ok(幂等) | ok→回原态 / RESTORE_EXPIRED |
| `setPinned`(置顶) | ok | ok | NOT_FOUND |

> **冻结行① restore 恢复完整状态**:tombstone 保存 `previousStatus + previousPinned`;`restore` 成功 → 恢复「被移除前完整生命周期状态 + UI 元数据」——**若原为 `ACTIVE + pinned`,restore 后仍 `ACTIVE + pinned`**(用户"只是撤销删除,为什么置顶没了")。删除死错误码 `ALREADY_PROMOTED/ALREADY_REMOVED`;冲突只留 `NOT_FOUND`。

**错误码三分类**:
| 类别 | 错误码 | UI 处理 |
|---|---|---|
| 失败→回滚 | `TIMEOUT / UNKNOWN / RESTORE_EXPIRED / BAD_STATE` | 回滚原态 + 提示 + 重试 |
| 冲突→diff | `NOT_FOUND` | 以底层返回 diff |
| 业务拒绝 | `PINNED_LIMIT / SYNC_TOKEN_INVALID` | 提示(置顶已满/同步失效回退) |

**(forward-looking)**:`NETWORK / CONCURRENT` 为云同步乐观锁预留,标注未来;开发勿写不可达分支凑覆盖率。

---

## 二、统一 Result Envelope（**冻结行④**）

所有 API 返回**同一协议**,UI 层只处理统一 envelope:
```json
{ "ok": true,  "code": "OK",        "data": {...}, "syncToken": "...", "seq": 123 }
{ "ok": false, "code": "NOT_FOUND", "data": null,  "syncToken": "...", "seq": 124 }
```
- UI 永远检查 `ok/code`(不按各 API 返回不同类型兼容):成功=ok:true 且 code=OK;失败=ok:false + 错误码(映射文案);`data` 按接口;`syncToken/seq` 附带(供 changes 基线/对账)。

---

## 三、API 契约

| API | 输入 | 返回(Envelope.data) | 语义 |
|---|---|---|---|
| `memoryList(filter,cursor)` | filter=待确认/已记住(ACTIVE/DRAFT)/cursor(keyset,pageSize=30) | `{items, nextCursor, syncToken, facets}` | 分页;ACTIVE `pinned DESC,lastUsedAt DESC` / DRAFT `pinned DESC,createdAt DESC`;`syncToken`=读快照;**facets 精确分状态计数**(非"约"——与快照一致);`content`=原文(摘要 UI 层) |
| `memoryGetDetail(id)` | id | `{...同上, refCount(调试,暂不展示)}` | 详情 |
| `memoryPromote(id)` | — | 按状态机 | 设为重要 |
| `memoryRemove(id)` | — | 按状态机 | 移除 |
| `memoryRestore(id)` | — | 按状态机 | 撤销(恢复完整状态) |
| `memorySetPinned(id,pinned)` | — | 按状态机 / PINNED_LIMIT | 置顶(上限 3,原子 check-and-set) |
| `memoryChanges(syncToken)` | syncToken(seq) | `{changes:[{id,op(PROMOTED/REMOVED/RESTORED/PINNED),status,seq}], newToken}` | 对账增量;seq 单调,token=seq,分批续拉 |

**memoryChanges 细则**:首 token=list 首页附 syncToken(同读快照原子);`SYNC_TOKEN_INVALID`(日志压缩后旧 token 拉不全)→ 回退全量;变更结构如上;状态/隐藏/置顶必推,**lastUsedAt 不进变更流**(防边看边重排);在途操作竞态按 id 去重、seq 高者为准。
> **冻结行③**:全量刷新(因 SYNC_TOKEN_INVALID 或首次)成功后,**以新的 syncToken 作为后续 changes 基线**(防旧 token 反复 invalid)。

---

## 四、规则契约

### 1. 监听
**进程内 Flow/观察者 = 实时**;`memoryChanges` = **对账**(页面打开/前台恢复拉);**删常驻 30s 定时器**。memoryChanges 价值 = 可测试契约 + 未来跨进程/云同步。

### 2. pinned 归属(v1 和解)
pinned 持久化在 **memory-api 门面层独立存储**,list 组装 join 排序;**core/MemoryLifecycle 完全不感知**。三规则:置顶条移除→同步清理释额;草稿晋升→保持置顶;上限 3=原子 check-and-set。

### 3. tombstone（**冻结行②**）
- **`remove` 立即生效(tombstone 即刻落库)**——AI 立即不再使用此条;`5 秒恢复窗口只是 UI 交互`(Snackbar 撤销→调 restore);**不要**做成"5 秒后才真正 tombstone"(否则 AI 可能继续读 / judge 再操作 / 同步复杂);
- 只承诺"不再使用此条"(语义级拦截留待定)。

### 4. 翻页 × 可变排序键
keyset(排序元组+id);置顶/取消置顶(用户主动)→ UI **重拉第一页**;lastUsedAt 不触发会话内重排;分状态计数走 facets。

### 5. 其他
术语唯一(用户可见=待确认/已记住;API=ACTIVE/DRAFT);pageSize=30;content=原文(40 字摘要 UI 层)。

---

## 五、测试契约
状态机表逐格断言(promote/remove/restore/setPinned × DRAFT/ACTIVE/TOMBSTONE 幂等重放);`SYNC_TOKEN_INVALID`→全量回退自愈 + **新 token 成基线**;翻页置顶变更→重拉首页不跳条;changes×在途操作同 id 竞态→去重不双应用;置顶连点→上限不破;置顶移除→释额;5s 撤销窗口配置变更/重建→不失效;restore 恢复 previousStatus+previousPinned;**统一 Envelope 断言**(各 API ok/code/data/syncToken/seq)。承 v2:契约/竞态/失败注入/迁移幂等/UI diff(300 条不丢滚动)/分页游标/置顶排序。

---

## 六、依赖检查
`memory-api`(门面,UI 只依赖)/`memory-core`(Lifecycle+Persist)模块化,Gradle 强制;或 ArchUnit 包依赖测试。CI 落此 + 契约/竞态/失败注入测试全绿 = L3 达标。

---

## 七、边界（不变）
同内容再写入拦截(语义 tombstone 待定)/ 编辑/合并/标签/版本 / 「使用」回填对话 / 云同步——独立需求留口。

---

## 八、结论
- **冻结行①~④ 落实**(restore 恢复完整状态 / remove 立即生效 / 新 syncToken 基线 / 统一 Result Envelope)+ v3 全部;
- **Memory API 契约 v4 冻结**——架构师校对 → Android 实现 → 契约测试;**不再开产品评审**;
- 闭环:产品语义(待确认/已记住/设为重要/置顶/移除)+ 工程语义(ACTIVE/DRAFT/TOMBSTONE/promote/pinned/tombstone)+ 同步语义(FIow+syncToken+changes)+ 一致性(幂等+diff+keyset+原子 check-and-set)+ 测试(状态机逐格/竞态/失败注入/分页/迁移)。
