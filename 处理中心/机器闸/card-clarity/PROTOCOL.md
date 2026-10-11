# 卡面行动语义协议 · 五字段 v1（POL-8 定稿）

> 规范源：`15_规划库/openspec/changes/card-clarity/specs/card-clarity/spec.md`「卡面行动语义协议（五字段）」。
> 本件＝实现口径（校验器判据逐条对应），随收口统一提交。

## 1. 数据形态（卡面数据 MUST）

```json
{
  "cardId": "onboard.status.1",        // 可选：卡实例 id（留痕/复盘用）
  "type": "onboard.status",            // 卡型（须在 cardRegistry CARD_TYPES 内·归 card-audit 管）
  "what": "微信特约商户进件",            // 字段①：这是什么（一句人话·非字段名）
  "state": "审核被驳回",                 // 字段②：现在什么态（一句人话）
  "next": "onboard.fix",               // 字段③：下一步主行动＝动作白名单 id（**唯一主行动**）
  "why": "执照信息与微信备案不符",        // 字段④：为什么（一句人话）
  "blocker": null,                     // 字段⑤：阻塞项（可为 null，**字段必须在**）
  "steps": [                           // 多步链卡（入驻/商户号/上架类）MUST：
    { "name": "上传材料", "status": "done" },
    { "name": "提交进件", "status": "now"  },
    { "name": "等审核",   "status": "todo" }
  ],
  "actions": ["onboard.fix", "task.view"]   // 可选：可见动作集（须 ⊆ 白名单；主行动唯一＝next）
}
```

## 2. 判据（校验器 fail-closed）

| # | 判据 | 违反 |
|---|---|---|
| V1 | 五字段**键**齐全（`what/state/next/why/blocker`；blocker 值可 null） | 拒·点名缺项 |
| V2 | `what/state/why` 为非空字符串（去空白后 >0 字） | 拒 |
| V3 | `next` ∈ 动作白名单（`MOV_ACTION_WHITELIST`·单一真源＝cardRegistry.js） | 拒 |
| V4 | 主行动**唯一**：`actions[]` 若给，其中至多 1 个 ∈ 主行动集（默认＝`[next]`），且 `next` 必在其内 | 拒 |
| V5 | 多步链卡（type 命中 `onboard|merchant|shelf|task` 族或声明 `steps`）MUST 给 `steps[]`：每步 `name` 非空＋`status ∈ {done,now,todo}`＋**恰一个 `now`** | 拒 |
| V6 | 术语直出 0：五字段/步骤名文案命中内部标识（白名单动作 id、枚举值、`SKU`/`CU-*`/字段名） | 拒（术语表对照扫描） |
| V7 | `blocker` 非 null 时 MUST 为非空字符串（不得给 `false`/`""` 占位） | 拒 |

- 退出码：0＝过；1＝有拒项（逐条点名）；2＝用法/环境错。
- 与其他闸关系：本校验器管**行动语义**；卡型/接线/文案单源仍归 `card-audit.mjs`（零回归）；渲染/可测性归 release gate 四件套。

## 3. 与动作白名单的关系（单一真源）

- 白名单与中文 label 的**唯一真源**＝产品仓 `tools/ms-md-server/page/src/lib/cardRegistry.js`（`MOV_ACTION_WHITELIST` / `ACTION_LABELS` / `ACTION_WIRED`）；文案预算（判读句 `headline` ≤6 字／动作 label ≤4 字）同源此件（UPG-580·card-audit J 项对账）。
- 校验器经 `--repo <产品仓根>` 动态 import 该注册表；**未给 `--repo`** 时退化为内嵌快照白名单（`fallback-whitelist.json`·随本协议冻结·仅离线用），并在输出中显式声明降级。

## 4. 样例（自证·`samples/`）

- 正例 ×6（含多步链 2 张）；缺字段反例 ×1；含糊卡反例 ×1（五字段齐全但文案无法让冷读者判定行动·候 AI 3 秒 gate 判分）。
- 每样例含 `expect.json`（期望判分：pass/fail＋命中项）——各件 fail-closed 与判分可复跑。
