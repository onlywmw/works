# UPG-100 A3 同族抽检结论表（静态 8 文件 + 实测变异 4 处）

> 口径：「一条断言内多个 contains 以 && 连接」组合锚；出现次数=被守护文本在被测目标源码字面出现次数（脚本统计）。

## 无组合锚（直接排除）

ChipsCapsuleSplitContractTest / MarketSplitContractTest / ToolsSplitContractTest / MemoryCoverWiringContractTest / SceneWiringContractTest——全为单 contains / Regex 计数 / sha256 对账，不属本族。

## 有组合锚的 3 个文件

### SidebarDispatchContractTest —— 全部 OK（实测对照 S3 红，分类不虚）

| 锚 | 被守护文本 | 次数 | 判定 | 升级 |
|---|---|---|---|---|
| 键值对齐锚 | `"tasks"/"vault"/"memory" to BuiltinPage(`（CapsuleResolver.kt） | 各 1 | OK（S3 实测红） | 否 |
| 兜底锚 | `function comingSoonVisible()`（已局部化函数体） | 1 | OK | 否 |
| 回归锚 | `entry.page === 'market'` 等（已局部化） | 各 1 | OK | 否 |

### ApprovalComponentContractTest —— 2 处疑似（S1 实测死角）

| 锚 | 被守护文本 | 次数 | 判定 | 升级 |
|---|---|---|---|---|
| A3③ 冷启动双 action | `ACTION_ALLOW`/`ACTION_DENY`（已局部化 handleApprovalLaunch 函数体） | 2 / 1 | 疑似（轻）：ALLOW 两处同源引用 | 建议（ALLOW 侧计数=2） |
| A2 卡片v2 30s fail-closed（未局部化） | `deferred.complete(null)`/`d.dismiss()`（ApprovalSurface.kt） | 4 / 1 | **死角实证（S1：单删 :323 超时点仍绿）** | 建议（局部化到 30s 块+计数） |
| A2④ only-once 锁行（zone 已局部化） | `if (onlyOnce) {` 等 | 各 1（zone 内） | OK | 否 |

### AppearanceContractTest —— 16 处疑似（重灾区；S2/S4 实测死角）

| 锚 | 被守护文本 | 次数 | 判定 | 升级 |
|---|---|---|---|---|
| L1-6 唯一真相读取 | `currentOf(comp)`/`lastOf(comp)`（AppearanceApp.vue） | 10 / 5 | **死角实证（S2：单删 :58 使用处仍绿）** | 建议 |
| L2-9 1B srow/stog/shead | `srow-`/`setRowCls` 等（SettingsPage.vue） | 定义 1 + 模板使用 N | 疑似（定义兜底命中档） | 建议 |
| 1C SIDE-HEADER | `UI-SIDE-HEADER`/`sideHeadCls`（SidebarNav.vue） | 2 / 2 | **死角实证（S4：删 :192 真实读点仍绿——:118 注释行兜底）** | 建议（优先） |
| 1C SIDE-ROOM/SIDE-TOOL | `UI-SIDE-ROOM`/`sideRoomCls` 等 | 1+N / 2-3 | 疑似 | 建议 |
| 1C WORKBENCH-ROW/CARD、COMMON-EMPTY、MARKET-CARD/LIST、ASSETS-CARD/LIST、SHEET-HEADER/BODY | `UI-X`/`xxxCls`（WorkbenchPage/MarketPage/AssetsPage/SettingsPage.vue） | 多档 | 疑似（5 处双侧=注释令牌污染档） | 建议（优先升级注释污染档） |
| P2-B pressed 矩阵 | `.sroom-standard:active` 等 8 条（tokens.css） | 各 1 | OK | 否 |

## 两档死角模式（方法论已入 已知坑.md #10）

1. **定义兜底命中**：`xxxCls` 在 computed 定义行必中一次，模板使用处再中 N 次——断言护「模板绑定」，单删绑定仍绿。
2. **注释令牌污染**：`UI-X` 首次命中来自源码注释（非真接线）——删真实读点仍绿。比 HomeDelivery 锚②更弱一档。

## 升级方向（建议，不在本单范围）

活行口径（hasLiveLine 先例）/ 锚读点形态（`c['UI-X']`）/ `:class="[^"]*xxxCls` 正则 / 计数+局部性组合（UPG-100 锚②范式）。
