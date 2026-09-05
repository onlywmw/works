# 看板写面引擎 Board Write Engine——设计 v1（送大神评审 · 2026-09-02）

**状态**：📤 送审
**背景与批评**：用户指出「看板 html 是渲染的，按钮代码不具备自动化能力，没有底层逻辑、没有引擎」——**属实**。现状=只读投影引擎（E4）+ 散装写面（board-server 临时硬编码 `POST /api/reject`），无 API 契约/事务/鉴权/幂等——功能能用但**不可演进、不可靠、不可安全开关**。本设计把「看板写面」升级为正式引擎。

---

## 一、现状问题（诚实清单）

| 问题 | 现状 | 后果 |
|---|---|---|
| 无 API 契约 | 单个 `POST /api/reject` 硬编码 | 加任何操作=再写一个裸端点 |
| 无写入事务 | 改库 → sync → regen 顺序执行无事务 | 中途失败=库已改/表未同步半态 |
| 无权限边界 | 写面永久开启，本地 127.0.0.1 | 未来 BIND 0.0.0.0 即裸奔 |
| 无幂等 | 重复点击重复写标记（仅文本判重） | 弱——未来事件化后需 event_id |
| 无留痕审计 | 标记含日期/用户操作，但无原→新/裁决人 | 分类/状态变更审计缺字段 |
| 前端散装 | 裸 fetch + alert + reload | 错误处理/重试/反馈分散 |

---

## 二、目标架构

```
┌─────────────────────────────────────────────┐
│ 前端 board-view（只读渲染）                    │
│   └─ window.BoardAPI（唯一写入口·封装）        │
│         ┌──────────────────────────┐         │
│         │  BoardEngine (server)    │         │
│         │  /api/board/v1/*         │         │
│         │  ① 参数校验+幂等 key      │         │
│         │  ② 写前备份（白名单文件）  │         │
│         │  ③ 事务：改库→sync→regen  │         │
│         │     （任一步败→回滚+告警） │         │
│         │  ④ 留痕（actor+原→新+原因）│         │
│         │  ⑤ 原子发布 html         │         │
│         └──────────┬───────────────┘         │
│              E1 真相源（工单库.md）            │
│              sync-orders（库⇄表投影）          │
│              E4 派生（data.json/html）         │
└─────────────────────────────────────────────┘
```

---

## 三、API 契约（`/api/board/v1/*`）

| 端点 | 方法 | 入参 | 动作 | 幂等 key |
|---|---|---|---|---|
| `lifespan` | GET | — | 状态/版本/写面开关/write 能力 | — |
| `card.reject` | POST | `{no, reason?}` | 施工·回炉（写【看板回炉】标记） | `reject:<no>:<date>` |
| `card.restore` | POST | `{no, reason?}` | 从回炉恢复（删【看板回炉】标记） | `restore:<no>:<date>` |
| `card.move` | POST | `{no, stage, reason?}` | 状态迁移（白名单 stage 枚举） | `move:<no>:<date>` |
| `meta.echo` | GET | — | 连通性（供 UI 自检） | — |

- **统一响应**：`{ok, msg, data?} | {ok:false, code, msg}`（3 错误码：`BAD_ARG`/`NOT_FOUND`/`ENGINE_BUSY`）
- **写面开关**：`BOARD_WRITE=on|off`（默认 **on** 本地；BIND≠127.0.0.1 时强制 off——**写面永远只在本机**）

---

## 四、事务（BoardEngine 核心）

```
begin：
  ① 白名单路径校验（no 格式 / 库+表路径固定）
  ② 幂等检查（写前判重）
  ③ 备份（_备份归档\写面_<no>_<ts>.md + 表副本）
  ④ 改库（状态区标记）
  ⑤ sync-orders --sync（失败→回滚库+走 ⑧）
  ⑥ regen（E4+board-build；失败→重试≤2）
  ⑦ 原子发布 html
  ⑧ 全部成功→{ok:true}；任一步败→恢复备份+{ok:false, code:"ENGINE_BUSY", msg:失败点}
```

- **中途失败绝不半态**：库/表/html 三者要么全新要么全旧
- 每步日志带 `txid`（供排查）

---

## 五、留痕（审计契约）

- 每次写面操作记 `_备份归档\write-engine-ledger.md`（append-only）：
  `ts | txid | op | no | actor | 原→新 | reason | result`
- 与工单卡内分类变更留痕（`原→新|原因|裁决人|日期`）并存（引擎留操作日志，卡内留状态语义）

---

## 六、前端契约（BoardAPI）

```js
// board-view 唯一入口（封装 fetch/错误/重试/提示）
const BoardAPI = {
  reject: (no, reason) => call("card.reject", {no, reason}),
  restore: (no, reason) => call("card.restore", {no, reason}),
  selfCheck: () => call("lifespan"),
};
// call = fetch(`${API}/api/board/v1/${op}`) → 统一错误提示 → 成功统一 reload
```

- **页面只调 BoardAPI，不直接 fetch**（散装禁用）
- 加载后 `selfCheck()`：服务断了→页面顶部「引擎离线」黄条（不再是死样）

---

## 七、评审点（请大神重点看）

1. **事务边界**：改库+sync+regen 三步是否够？sync 是外部脚本调用（spawn）——是否该内联（共享函数）减少进程间隙败点？
2. **幂等设计**：`op:no:date` 粗粒度够不够（同一天重复点）？还是 `event_id` 每请求唯一？
3. **写面开关**：BIND≠127.0.0.1 强制 off——够不够？还要不要「本地 token」二次校验？
4. **留痕位置**：引擎 Ledger append-only（独立文件）vs 入工单库状态区——双写还是单写？
5. **回滚**：sync 失败回滚库——回滚方式（备份还原）可靠吗？还是「只读正反向」事务（先 sync 后改库的顺序）更好？
6. **前端 BoardAPI**：要不要 also 支持「批量回炉」（多选）V1 是否只做单卡？

---

*v1 送审：用户批评「无引擎」→ 本设计把写面引擎化（API 契约/事务/权限/留痕/前端封装）。*
