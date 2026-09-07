# Memory API 工程契约 v2（大神评审后细化）

> 设计师 @2026-08-30 ｜ 承接 v1(产品语义转工程规则) ｜ 大神指出**规则冲突/实现缺口**(错误码幂等语义/自动晋升监听/撤销窗口/pinned排序)需先解决 → v2 逐条修正。
> 备注：**细化建议由架构师 + Android 开发共同校对**后进排期（大神定调）。

---

## 〇、总原则（不变）
**UI 永远不是 Memory 的事实来源**；事实来源 = `Memory API → Lifecycle → 持久化`。UI 只 读→呈现/操作→请求/返回→diff。四层边界如 v1。

---

## 一、API 契约（v2 修正）

| API | 输入 | 返回 | 语义 |
|---|---|---|---|
| `memoryList(filter, cursor)` | filter=`已记住/待确认`(↔ACTIVE/DRAFT,见§补) / cursor(游标) | `{items:[{id,status,content,source,createdAt,lastUsedAt,pinned}], nextCursor, total}` | 分页;**排序 = `pinned DESC, lastUsedAt DESC`(ACTIVE) / `pinned DESC, createdAt DESC`(DRAFT)** |
| `memoryGetDetail(id)` | id | `{id,status,content,source,createdAt,lastUsedAt,pinned,refCount(调试/未来,暂不展示)}` | 详情 |
| `memoryPromote(id)` | id | `{ok, status}` 或 `{ok:false, code}` | 设为重要(DRAFT→ACTIVE);**幂等重试→返回当前状态;他方已改→ALREADY_PROMOTED** |
| `memoryRemove(id)` | id | `{ok, hidden:true}` 或 `{ok:false,code}` | 移除(tombstone 软删) |
| `memoryRestore(id)` | id | `{ok, status}` 或 `{ok:false,code}` | 撤销(**UI 层 5s 窗口**;API 可随时恢复,除非底层已物理删→RESTORE_EXPIRED) |
| `memorySetPinned(id, pinned)` | id, bool | `{ok, pinned}` 或 PINNED_LIMIT | 置顶(**两层通用**;排序入 list;上限 3 条→PINNED_LIMIT) |
| **`memoryChanges(lastSyncToken)`** | lastSyncToken | `{changes:[增量变更], newToken}` | **v2 新增**:增量拉取自动晋升/移除(judge/他方变更)——UI 定期拉(如 30s),防全量轮询 |

**错误码分类（v2 关键定义，区分"失败 vs 冲突"）**：
| 类别 | 错误码 | UI 处理 |
|---|---|---|
| **失败→回滚** | `TIMEOUT / UNKNOWN / RESTORE_EXPIRED / NETWORK` | 回滚原态 + 提示 + 可重试 |
| **冲突→diff** | `ALREADY_PROMOTED / ALREADY_REMOVED / NOT_FOUND` | 不报错,以底层返回**diff 更新**("状态已由他方变更") |
| **业务拒绝** | `PINNED_LIMIT / CONCURRENT / BAD_STATE` | 提示(置顶已满/并发冲突请重试/非法状态) |

> **幂等 vs 竞态（v2 澄清，解决 v1 矛盾）**：
> - **幂等重试**(同一操作的重复提交/网络重试)：返回**当前成功状态**(`ok:true, 当前 status`)**不报错**；
> - **业务冲突**(他方已改状态,如 judge 已晋升/已移除)：返回**特定错误码**(ALREADY_PROMOTED / NOT_FOUND)→ UI **diff 更新**,不提示失败。

---

## 二、规则契约（v2 修正）

### 1. 幂等 / 竞态
- 幂等重试(网络重试/连点):返回当前成功状态,不报错;UI 防抖(loading)减连点;
- 竞态(promote×judge / 他方已改):返回 ALREADY_PROMOTED/NOT_FOUND → UI **diff**;以底层为准,不乐观写死。

### 2. 自动晋升 UI 监听（v2 补机制）
- **`memoryChanges(lastSyncToken)` 增量接口**:UI 定期(如 30s)拉增量,拿 judge 自动晋升/移除的变更→ diff 更新;
- 本地单进程 App 也可用**本地事件广播/观察者**(Lifecycle 变更→发布事件→UI 订阅);两类方案二选一,**契约明确**:以 memoryChanges 增量为主(兜底,可测试),进程内广播为辅。
- 明确:"数据驱动 diff"= 以 memoryChanges/API 返回为准,增量更新列表(不整页重渲染、不丢滚动位置)。

### 3. Tombstone / 撤销窗口（v2 明确位置）
- `memoryRemove` 软删(本条 hidden,不再被读取/进 cover);**只承诺"不再使用此条"**(语义级拦截留待定);
- **撤销窗口 = UI 交互**:UI 移除后显示 5s Snackbar 撤销→调 `memoryRestore`;API 层 `memoryRestore` **不设时间限制**(可随时恢复);
- 若底层对 tombstone 做物理清理(如 >N 天),`memoryRestore` 返回 `RESTORE_EXPIRED` → 属于"失败回滚类"提示;tombstone 保留期在契约注明(默认不做物理清理,先隐久)。

### 4. pinned 排序 + 上限（v2 写进 list）
- `memoryList` 排序:ACTIVE `pinned DESC, lastUsedAt DESC`;DRAFT `pinned DESC, createdAt DESC`;
- **pinned 上限 3 条**(超出→`PINNED_LIMIT`,UI 提示"至多置顶 3 条");
- 草稿**也可置顶**(速达);置顶跨 ACTIVE/DRAFT。

### 5. lastUsedAt 可空性
- DRAFT 状态 `lastUsedAt = null`(从未被使用),UI 显示"未使用";ACTIVE 有值。

### 6. refCount
- detail 返回 `refCount`(仅**调试/未来**,UI 暂不展示,标注)。

---

## 三、其他补充（大神 §三,进 v2）

1. **`CONCURRENT` 含义**:检测到并发修改冲突(同资源并发写)→ UI 提示"请重试";
2. **分页 `cursor`**:用**游标**(不透明,非偏移量;nextCursor 拉下一页,防深分页性能);
3. **filter 映射**:`已记住 ↔ ACTIVE` / `待确认 ↔ DRAFT`(文档直接对应);
4. **迁移幂等测试**:覆盖多次启动/版本升迁;默认模型创建逻辑用 migration flag 幂等(不重复建);
5. **L3 验收覆盖率阈值**:关键测试(契约/竞态/失败注入/迁移幂等/UI diff)必须全绿 + 分页/监听用例,定为硬门槛。

---

## 四、依赖检查可执行性（v2 补技术手段）

- **模块化(推荐)**:`memory-api`(门面,UI 只依赖它)/ `memory-core`(MemoryLifecycle + Persistence)——Gradle 依赖配置强制 UI 不触 core 内部;返回类型/数据结构归一在 api 模块;
- 若无法模块化:退用 **ArchUnit 架构测试**(检查包依赖:UI 只 import 门面包,不触 core 内部实现);
- CI 落此检查(依赖检查 + 契约/竞态/失败注入测试全绿 = L3 达标,非口号)。

---

## 五、测试契约（v2 增补）
契约 / 竞态(promote×judge,含 memoryChanges 增量) / 失败注入(含 RESTORE_EXPIRED/物理清理) / 迁移幂等 / UI diff(300 条不丢滚动 + 自动晋升监听更新) / **分页(游标) / 置顶上限/排序**。

---

## 六、边界（不变）
同内容再写入拦截(语义 tombstone 待定)/ 编辑/合并/标签/版本 / 「使用」回填对话 / 云同步——独立需求,留口。

---

## 七、结论
- v2 修正大神 ①~⑧(错误码幂等语义区分/自动晋升监听 memoryChanges+本地事件/撤销窗口=UI+API 不限/分页=游标/pinned 排序≤3) + §三补充 + 依赖检查模块化/ArchUnit;
- **建议架构师 + Android 开发共同校对后**进开发排期(大神定调)。
