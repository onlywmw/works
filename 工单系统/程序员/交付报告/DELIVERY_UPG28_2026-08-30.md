# DELIVERY_UPG28_2026-08-30 —— obsidian.file.write 审批闸修复

**程序员**：C ｜ **工单**：UPG-28（P1，安全面）｜ **分支**：`feat/upg28` ｜ **hash**：`443b288`（已 push origin，基底 main `31769a0`）
**方案**：`设计师/方案设计/UPG-28_obsidian写入审批闸修复_方案设计.md` v1 ｜ **来源**：挂账登记表「[UPG-02+04 验收附带] obsidian.file.write 相对路径静默放行不弹 ASK」

---

## 一、施工内容（2 文件 +26/-2）

### 1. 修复点（唯一判定改动，名单区一行未动）

`app/src/main/kotlin/com/hermes/dsh/tools/McpToolScheduler.kt` `PermissionGuard.isHarmless()`（:164）：

- `name.contains("file.write")` → **`name == "file.write"`**（全名精确匹配）
- 效果：dsh `file.write` 工作区无害级语义**一字不变**（相对/公共前缀放行、private 凭据写仍实质级、越界仍 ASK）；`obsidian.file.write` 不再被工作区特判误捕 → 下落 `writeTools`（名单本含该工具）→ **任意路径形态（相对/绝对/private）全 ASK**
- 注释更新：KDoc 标注「仅 dsh 全名 file.write」+ UPG-28 块注释写明根因与语义边界

### 2. 契约断言

`app/src/test/java/com/hermes/dsh/tools/PermissionGuardTest.kt` 新增用例 `obsidian file write 任意路径形态全 ASK（UPG-28 审批闸修复）`：

- 相对 `upg02_l3_probe.md`（挂账实证剧本原样）→ ASK
- 绝对 `/x/upg02_l3_probe.md` → ASK（回归锚，修复前本就 ASK）
- 相对 + `private=true` → ASK
- dsh `file.write` 同相对路径 → **保持 ALLOW**（精确匹配未伤及本尊的回归锚）

## 二、测试与变异（L1）

| 项 | 结果 |
|---|---|
| 定向 `PermissionGuardTest`（修复后） | ✅ 10/10 绿 |
| **L1 全量** `:app:testDebugUnitTest --rerun-tasks` | ✅ **53 套件 377/0/0**（BUILD SUCCESSFUL，强制重跑防假绿） |
| `:app:assembleDebug` | ✅ BUILD SUCCESSFUL |
| `node scripts/check-token-effect.mjs` | ✅ 通过 |
| **变异 M1**（`:161` 改回 `contains` 上码 → 定向重跑） | ✅ **必红**：`obsidian file write 任意路径形态全 ASK` FAILED（AssertionError at PermissionGuardTest.kt:111），其余 9 案绿（dsh 语义未伤实证）；10 tests, 1 failed, BUILD FAILED |
| **变异 M2**（M1 变异在位 + 测试退回 HEAD~1 无断言版 → 重跑） | ✅ **全绿**（grep UPG-28=0 确认断言退场）——证明 M1 杀伤完全由新契约断言承担，断言非摆设；M1/M2 双锚亲杀成立 |

变异后已 `git checkout HEAD` 恢复施工态（`name == "file.write"` 在位 + 断言在位 + git status 干净），全量在恢复态跑出。

## 三、真机证据（L2，emulator-5558，复刻验收员 upg02_l3_probe.md 剧本）

证据落点：`程序员/UPG28-evidence/`（4 截图 + 会话 JSONL 全程）。

| 事件 | 证据 |
|---|---|
| 相对路径 `obsidian.file.write` 触发 ASK 弹窗 | 截图 `upg28_01_ask_dialog.png`（第一轮）+ `upg28_05_ask_dialog_v2.png`（第二轮，截图在点「允许本次」**前**抓取）：「审批请求」三键弹窗 |
| journal `approval/asked`（相对路径，**bug 版此处零事件**） | seq=2090 `{"toolName":"obsidian.file.write","reason":"默认权限：obsidian.file.write 超出安全范围，请求允许"}`（tool_call arguments `{"path": "upg28_probe.md", ...}` 相对路径） |
| 第二轮完整闭环 | seq=2396 asked `obsidian.vault.register` → seq=2397 decided `allowed-once`；seq=2444 asked `obsidian.file.write` → seq=2445 decided `allowed-once`；tool/result `{ok=true, path=upg28_probe.md, chars=19}` |
| vault 实际落盘 | `/storage/emulated/0/MovTestVault/upg28_probe.md` 内容 `MOV-UPG28-ASK-probe`（SAF 通路真实写入） |

**销项条件对账**（挂账原文：相对路径调 obsidian.file.write 真机弹 ASK + 契约断言落码 + 全量绿）：三项全满足。

环境注记（如实申报）：① emulator-5556 不可用（历史 NAT 损坏），按验收实录惯例走 emulator-5558；② 覆盖安装后 vault 登记 prefs 失效，首轮经 SAF 重授权链（detect→SAF→register ASK→allowed-once）后复验写入；③ 第一轮 ASK 弹窗与第二轮 register 调用踩过「审批等待 vs 工具 20s 超时」竞态（挂账在册的已知问题，与本单无关，二轮 watcher 秒级点击规避）；④ vault 内 `upg28_probe.md` 探针文件保留作验收员复验对照（与验收员 `upg02_l3_probe.md` 同例）。

## 四、Token / KV Cache 影响申报（硬规则 1）

- **Token 影响**：不变。本单为审批闸行为面修复（guard 判定一处），不触请求链路、工具面、system prompt、会话投影；`check-token-effect` 通过。
- **KV Cache 影响**：不变。请求前缀零变动（tools 字段与 system prompt 无任何改动）。

## 五、红线自查

- 名单区（writeTools/harmlessTools 内容）一行未动 ✅（diff 仅 :161 判定 + 注释）
- 不碰 PermissionGuard 其余分支 / ObsidianProvider 本体 / goal/open 模式语义 ✅
- 防撞：只动 McpToolScheduler 判定逻辑区，与 UPG-22 ③ 名单区无交集；UPG-22 已合 main（495060f 在基线内），无 rebase 冲突面 ✅
- 证据脱敏：截图/JSONL 无 key/token 明文 ✅
- 演示数据：无演示工单/假状态产生；探针文件保留已声明 ✅

## 六、登记

**已登记两个表**（先表后库）：
- `工单表.xlsx`：UPG-28 行（ROW33）程序员列 `✅C 完成` + 备注（分支/hash/测试/变异/报告名）
- `工单库.md`：UPG-28 状态行同步 `程序员✅完成，待验收`
