# 机器闸测试网（R0 特征测试·2026-10-04 立）

> **定位**：特征测试（characterization）——固化各闸**现有 CLI 行为契约**（子命令／退出码／关键输出标记）。
> **纪律**：不评判对错、不修疑似 bug（发现的问题只记录 tier C 备忘）；后续改造（R1/R2/R4…）后本套件**必须保持全绿**——红了=行为漂移，要么修改造、要么显式升版契约。
> **运行**：`node 处理中心/机器闸/tests/run-contracts.mjs`（可 `--only A|B|C` 或用例名前缀）；退出码 0=全绿；审计快照落 `contracts/last-run.json`。

## 覆盖表（v3 R0 口径：CLI 全集·不只 `--check` 子集）

| 闸 | 层 | 用例 | 契约要点 |
|---|---|---|---|
| set-status.py | A 沙盒 | A1-A8 | 六拒一成：show/未知卡/错挂分支/非法迁移/交付门/报告闸/**沙盒指真库拒收（SYS-104）**/主路径写入＋读回三验 |
| dispatch-lint.mjs | B 沙盒 | B1 | 空壳卡点名＋**卡头正则仅认 UPG\|SYS**（TST/W/S 不可见·亦为契约） |
| delivery-drift-check.mjs | B 沙盒 | B2 | 无树锚→rc0＋明确标注 |
| layout-check.mjs | C 真面只读 | C1 | rc0＋PASS 标记 |
| sync-orders.mjs | C 真面只读 | C2 | `--check` rc0＋「表模式已取消」口径（现行为） |
| 工具自检.mjs | C 真面只读 | C3 | `--sys-only --quiet` rc0（语法闸） |

### 未覆盖面（tier C·原因在案）

| 闸 | 不进套件原因 |
|---|---|
| card-audit.mjs | 对账面含产品仓（0027-mov）活态——契约随产品仓漂移；由巡检体检承担 |
| merge-check.mjs | 需 worktree＋产品仓＋gradle——环境依赖 |
| evidence-sums / evidence-index / evidence-archive | 需真证据目录/写归档面 |
| precommit-check.mjs | 断言面=暂存区实态（他人 staged 件会漂移）——收口批实跑即验 |
| 取号.mjs | 立卡走**全局共享锁＋水位投影**（沙盒不彻底）；避免测试与在跑引擎争全局锁——只读「下一个」可后续补 |
| snapshot / archive-cards / 装机 / 真机占用 / 装机前置 / 席位 / 等信 / 打包分发 | 写侧或设备/运行态依赖 |
| set-status 终态相位（merged/closed/obsolete） | **装机钩子不受沙盒闸保护**（沙盒泄漏点·tier C 备忘①）——测试触发真设备操作，风险大于收益 |

### tier C 备忘（2026-10-04 后处置：两项已修·用户令「你来处理」）

1. ~~沙盒泄漏两处~~ **已修（契约 A6/A9 更新）**：报告闸与装机钩子均接 LIB_GLOBAL 判定——沙盒模式打印「跳过报告闸／跳过装机钩子」，真库路径行为不变；契约 A6 由「缺报告→rc1」改为「沙盒跳过报告闸→rc0」（真库路径仍拦），新增 A9 沙盒 merged 全链（跳过随动＋装机）。
2. ~~dispatch-lint 卡头正则仅认 UPG|SYS~~ **已修**：正则补 `W|S` 前缀（站点线/工作台线卡入扫面·B1 用例名同步）。

## 夹具约定

- `contracts/fixture-library.md`＝沙盒账本；**TST- 前缀为测试保留段**（set-status 卡定位正则前缀无关，天然兼容）。
- **SYS-99002＝沙盒保留号**（dispatch-lint 只认 UPG|SYS）——仅存于夹具与 `tests/.tmp/`，永不入真账/取号水位（取号扫描面=真账两本，不扫本目录）。
- 每用例从夹具新鲜拷贝到 `tests/.tmp/`（gitignore），互不污染。

## 扩展法

新闸入网：①有沙盒旗标（`--lib`/`--file`/`--table` 类）→ A/B 层加用例（freshSandbox＋形状断言）；②纯只读真面 → C 层；③环境依赖 → tier C 表登记原因。断言只锁 **rc＋关键标记**，不锁全文（时间戳/计数天然漂移）。
