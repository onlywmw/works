# 看板写面引擎 Board Write Engine——设计 v2（定稿 · 2026-09-02）

**状态**：✅ 可实施定稿（大神二轮 8.6→9.3~9.5：4 P0 + 7 P1 全采纳）
**前序**：`看板写面引擎_BoardWriteEngine_设计_v1_2026-09-02.md`（溯源保留）

> **术语修正（P0-①）**：「事务」正式命名为 **事务日志 + 两阶段提交/崩溃恢复（TX/Journal + 2PC + Crash Recovery）**。
> **承诺句修正（P0-①）**：~~「库/表/html 三者要么全新要么全旧」~~ → 「写事务具备**提交日志、全局写锁、失败回滚与崩溃恢复**能力；**任何未完成事务不得被视为成功提交**；若投影产物暂时落后，系统通过**版本号检测**阻止错误状态对外宣告为已提交。」

---

## 一、架构（大神收敛版）

```
                 Board View
                     │
                 BoardAPI（唯一写入口）
                     │
          ┌──────────▼──────────┐
          │     BoardEngine     │
          ├─────────────────────┤
          │ 1. Auth / Token     │  ① 本地随机 Write Token + Origin 校验
          │ 2. Arg Validation   │  ② 白名单参数
          │ 3. Idempotency      │  ③ request_id（请求幂等）+ 业务状态幂等
          │ 4. State Transition │  ④ 状态迁移矩阵（card.move 禁非法跳转）
          │ 5. Global WriteLock │  ⑤ 一次一事务（其余排队/ENGINE_BUSY）
          │ 6. Transaction      │  ⑥ 2PC：staging→校验→COMMIT→原子替换
          │ 7. Audit Ledger     │  ⑦ 机器事实 append-only
          └──────────┬──────────┘
                     │
                 TX / Journal（.tx/<txid>/）
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
       E1          Sync          Regen
     真相源      ProjectionAdapter  E4
        │            │             │
        └────────────┼─────────────┘
                     ↓
                 Validate（完整性校验）
                     ↓
                   COMMIT
                     ↓
               Published Version
```

---

## 二、事务（2PC + 崩溃恢复）——P0-①

### 2.1 流程

```
TX Begin
  → 全局写锁（lock_owner/txid/started_at）
  → 生成 txid
  → staging：.tx/<txid>/journal.json + source.new + projection.new + board.new
  → 修改 staging 中的 E1
  → ProjectionAdapter.syncOrders(txid, …) + Regen 全部产到 staging
  → 完整性校验（计数/格式/状态一致性）
  → COMMIT：原子替换正式产物
  → 写 COMMITTED（journal）
```

### 2.2 崩溃恢复

- **任何时刻均可回答「当前提交版本是谁」**（version 递增，所有产物带 `version`）
- 加载时检测：`库=184 / 表=184 / html=183` → **投影落后 → 引擎不假装成功**（阻止错误状态对外宣告已提交，触发重投影）
- 未完成 TX（无 COMMITTED）→ 启动时按 journal 回滚/重放（可恢复）

---

## 三、全局写锁 —— P0-②

- **一次只允许一个写事务**；其余请求：短排队（≤2s）超时 → `ENGINE_BUSY`
- 记录：`lock_owner / txid / started_at`（可诊断）
- 锁在 TX Begin 拿、COMMIT/回滚释放

---

## 四、双层幂等 —— P0-③

| 层 | 机制 | 行为 |
|---|---|---|
| **请求幂等** | `Idempotency-Key: <UUID>`（前端每操作生成） | 重复提交同 request_id → 直接返回原结果（服务存 request_id/op/no/payload_hash/result/txid） |
| **业务幂等** | 当前状态判定 | 已回炉再 reject → 不重复写标记（返回 already） |

---

## 五、安全边界 —— P0-④

```
请求
  → 是否本地服务？            （BIND 检查）
  → Origin 是否合法？          （http://127.0.0.1:8787 / http://localhost:8787）
  → Write Token 是否有效？     （服务启动随机 256-bit，前端经 /api/board/v1/health 获取 session）
  → BOARD_WRITE 是否 on？
  → 写锁 → 执行
```

- Token **不写死**（每次启动随机）；`BIND≠127.0.0.1` 时写面强制 off（再叠 Token 双层）

---

## 六、API 契约（v1）

| 端点 | 方法 | 入参 | 动作 | 幂等 |
|---|---|---|---|---|
| `/api/board/v1/health` | GET | — | engine/version/writeEnabled/mode/txState/projectionVersion | — |
| `/api/board/v1/capabilities` | GET | — | 可用操作/迁移矩阵 | — |
| `card.reject` | POST | `{no, reason?, Idempotency-Key}` | 施工·回炉 | 双层 |
| `card.restore` | POST | `{no, reason?, Idempotency-Key}` | 恢复 | 双层 |
| `card.move` | POST | `{no, to, reason?, Idempotency-Key}` | 状态迁移（矩阵校验） | 双层 |

**错误码（P1-⑤）**：`BAD_ARG / NOT_FOUND / CONFLICT / IDEMPOTENT_REPLAY / ENGINE_BUSY / ENGINE_FAILED / ROLLBACK_FAILED / WRITE_DISABLED / UNAUTHORIZED / FORBIDDEN / PROJECTION_FAILED`
→ `ROLLBACK_FAILED` 及 `PROJECTION_FAILED` = **CRITICAL**（UI 显示「⚠️ 引擎恢复状态，请勿继续操作」）

---

## 七、State Transition Matrix（card.move）——P1-⑩

```
delivering → rejected   ✅（回炉）
rejected   → delivering ✅（恢复）
merged     → rejected   ❌（终态不许绕过）
archived   → delivering ❌
queued     → assigned   ✅（白名单内）
```
（矩阵由 capabilities 下发；非法迁移 → `FORBIDDEN`）

---

## 八、Audit Ledger（机器事实）——P1-⑥

`_备份归档\write-engine-ledger.md`（append-only，与事务同 commit）：

```
ts | txid | request_id | op | no | actor | before_hash | after_hash |
payload_hash | engine_version | duration_ms | error_code | result
```

- **与工单卡内（业务语义：原→新|原因|裁决人|日期）双写但职责分开**：Ledger=机器操作事实；卡内=业务语义；**同一事务提交**

---

## 九、ProjectionAdapter —— P1-⑦

- sync-orders **V1 保留子进程**但封装为 `ProjectionAdapter.syncOrders({txid, input, output, timeout})`
- BoardEngine 不直接 spawn；未来可换共享库实现（上层 API 不变）
- Adapter 校验：exit code / stdout+stderr / 产物完整

---

## 十、前端 BoardAPI —— P1-⑧⑨

- **成功不再整页 reload**：返回 `{ok, data:{no, stage, txid, version}}` → 局部更新该行（按钮 loading → 行变「施工·回炉」→ 提示已提交）→ 局部失败才 reload 兜底
- `selfCheck` = `/api/board/v1/health`（引擎离线→页面「引擎离线」黄条）
- 每前端操作生成 `Idempotency-Key`（UUID）

---

## 十一、V1 范围

- **单卡**（card.reject/restore/move 均单卡；批量为 V2——复用底层 TX，不另造）

---

## 十二、评审记录（v1 → v2）

| # | 大神意见 | 处置 |
|---|---|---|
| P0-① | 「事务」不真原子 → 事务日志+2PC+崩溃恢复；版本号检测投影落后；承诺句改严谨 | ✅ §二 |
| P0-② | 全局写锁（并发击穿） | ✅ §三 |
| P0-③ | 双层幂等（request_id + 业务态） | ✅ §四 |
| P0-④ | localhost 非唯一边界 → Origin+随机 Write Token+开关 | ✅ §五 |
| P1-⑤ | 错误码扩充（ROLLBACK_FAILED/PROJECTION_FAILED=CRITICAL） | ✅ §六 |
| P1-⑥ | Ledger 补 request_id/before-after hash/engine_version/duration/error_code | ✅ §八 |
| P1-⑦ | sync-orders 暂不内联 → ProjectionAdapter | ✅ §九 |
| P1-⑧ | 不成功即 reload → 局部更新（reload 兜底） | ✅ §十 |
| P1-⑨ | lifespan 改 health/capabilities | ✅ §六 |
| P1-⑩ | card.move 状态迁移矩阵 | ✅ §七 |
| P1-⑪ | V1 单卡 | ✅ §十一 |

*v2 定稿：11/11 全采纳——大神「可冻结实施稿」。待拍板 → 拆实施单（BoardEngine 重写 board-server + BoardAPI 前端 + ULedger + 测试）。*
