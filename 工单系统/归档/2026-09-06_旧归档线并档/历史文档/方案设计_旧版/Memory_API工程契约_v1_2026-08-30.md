# Memory API 工程契约 v1

> 设计师 @2026-08-30 ｜ 承接：`记忆页分层管理_设计_v4`（产品语义已定型收稿）｜ 大神定调：**v4 收稿，转工程契约**（"产品语义定型，开始建立工程契约"）
> 目的：把「我的记忆」从**设计稿**变成**产品系统**——一次性定死 Memory API 契约 + 规则 + 测试，防"按钮看起来工作、真实状态没变"。

---

## 〇、总原则（工程第一律）

> **UI 永远不是 Memory 的事实来源。**
> 事实来源只有：`Memory API → MemoryLifecycle → 持久化状态`。
> UI 只做三件事：**读取→呈现 / 操作→请求 / 返回→diff**。

**四层职责边界（不可越界）**：
```
我的记忆 UI      ← 不知道 Lifecycle 怎么实现
   ↓ 只 import Memory API 门面
Memory API       ← 呈现层唯一入口(memoryList/promote/remove/restore/detail)
   ↓
MemoryLifecycle  ← 不知道 UI 怎么展示(Promote/Remove/List/…)
   ↓
Judge(自动形成/晋升)  ⟶ 不能绕过 API 改 UI(只落库,UI 靠 diff)
Persistence(原子持久化) ⟶ 不承担产品语义(只存状态)
```

---

## 一、API 契约（呈现层唯一入口）

> 底层已有：`memoryPromote(draft,kind)` / `memoryRemove(draft)`(MemoryLifecycle.kt:41/51)。以下补全为**门面契约**(部分需新增实现:list/detail/restore)。

| API | 输入 | 返回 | 语义 |
|---|---|---|---|
| `memoryList(filter, cursor)` | filter(已记住/待确认)/cursor(分页) | `{items:[{id,status(ACTIVE|DRAFT),content,source,createdAt,lastUsedAt,pinned}], nextCursor, total}` | 列表(分页,层排序:ACTIVE 最近引用倒序/DRAFT 创建倒序) |
| `memoryGetDetail(id)` | id | `{id,status,content,source(sessionId/对话),createdAt,lastUsedAt,pinned,refCount}` | 详情(记忆为何存在/来源/时间) |
| `memoryPromote(id)` | id | `{ok, status:ACTIVE}` 或 `{ok:false, code}` | **设为重要**(DRAFT→ACTIVE 落库) |
| `memoryRemove(id)` | id | `{ok, hidden:true}` | **移除**(tombstone 软删,本条不再被读取) |
| `memoryRestore(id)` | id | `{ok, status}` | **撤销**(tombstone→原状态,5s 撤销) |
| `memorySetPinned(id, pinned)` | id, bool | `{ok, pinned}` | **置顶**(UI 排序偏好,不进生命周期) |

**状态码(错误码固定枚举,UI 映射文案,不散落中文判断)**：
`OK / NOT_FOUND / ALREADY_PROMOTED / ALREADY_REMOVED / PINNED_LIMIT / CONCURRENT / TIMEOUT / UNKNOWN`。

---

## 二、规则契约（每个 API 必须遵守）

### 1. 幂等
- `memoryPromote`/`memoryRemove` 重复调用**无副作用**(已晋升/已移除→返回当前状态,不报错);
- `judge` 幂等(已晋升/已衰减跳过,MemoryLifecycle 已保证)。

### 2. 并发 / 竞态（judge 自动晋升 vs 用户操作）
- **以底层返回为准做 diff**:用户点晋升时该条可能已被 judge 自动晋升/已移除 → 返回 `ALREADY_PROMOTED`/`NOT_FOUND`,UI 据此重新 diff(不乐观写死);
- UI 不做本地状态覆盖,一切以 API 返回权威。

### 3. Tombstone 规则（语义边界）
- `memoryRemove` = 软删(本条 hidden,不再被读取/不再进 cover);
- **只承诺"不再使用此条"**——**不拦截语义相似的新记忆**(同内容再写入拦截 = 底层待定,别被文案绑架);
- `memoryRestore` = 撤销(tombstone→原状态,5s 窗口)。

### 4. 失败规则
- 晋升失败/超时 → UI **回滚**到原分区 + 提示 + 可重试(loading 防抖防连点);
- 移除失败 → 保留原条目 + 提示。

### 5. 持久化规则
- 原子写盘(临时文件+rename,防进程杀截断);`version` + migration flag(**迁移幂等**,二次启动不重复建默认);
- 内存缓存 + 修改异步写盘(防卡顿);**固定/pinned 独立 UI 状态存储,不进记忆 DB**。

### 6. UI diff 规则
- 状态变更后**以 API 返回 diff** 更新列表(增/删/移位),**整页刷新→数据驱动 diff**(不丢滚动位置,300 条关键);
- 自动晋升(judge)让条目"自己从草稿区消失" → UI 监听更新(数据驱动,非轮询全重渲染)。

---

## 三、测试契约（配套,缺一不可）

| 测试 | 覆盖 |
|---|---|
| **契约测试** | 每个 API 输入/返回/状态码/幂等(重复调用无副作用) |
| **竞态测试** | 用户 promote 瞬间 judge 已晋升/已移除 → ALREADY_PROMOTED/NOT_FOUND,UI diff 正确;并发 promote 顺序 |
| **失败注入测试** | promote/remove 失败/超时 → UI 回滚/保留 + 提示;持久化中断 → 文件完整(原子写) |
| **迁移幂等测试** | server 重启/二次启动不重复建默认模型;version 升迁 |
| **UI diff 测试** | 300 条种子下 promote/remove/置顶 → diff 更新不丢滚动;judge 自动晋升条目自消失 |

---

## 四、契约落地保障（防"按钮看起来工作、状态没变"）
- **依赖检查**：呈现层(UI 代码)只 import `Memory API 门面`,禁止触碰 MemoryLifecycle 内部实现——CI 依赖检查(模块边界);
- **契约测试进 CI**：上述 5 类测试入 `.github/workflows`(L1 必跑);
- **L3 验收转可执行**：以"依赖检查通过 + 契约/竞态/失败注入测试全绿"为准(非口号)。

---

## 五、边界（本契约不做）
- 同/近似内容再写入拦截(语义 tombstone = 底层待定);
- 编辑/合并/标签/版本/时间线(独立需求,数据结构已留口);
- 记忆"使用"回填对话(独立需求,结构化字段已留);
- 云同步(未来)。

---

## 六、结论
- v4(产品语义)+ 本契约(工程规则+测试)=「我的记忆」从设计稿进入产品系统;
- 实施:按契约补 `memoryGetDetail/memoryRestore/memorySetPinned`(promote/remove/list 已有)+ UI 接门面 + 5 类测试;
- **下一步**:转实施单(UI 分层页 + Memory API 门面补齐 + 契约/竞态/失败注入测试)。
