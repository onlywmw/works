# UPG-28 obsidian.file.write 审批闸修复（isHarmless 误捕）方案设计 v1

**出单人**：设计师 ｜ **日期**：2026-08-29 ｜ **优先级**：P1（安全面：AI 可不经审批写任意 vault 文件）
**来源**：挂账登记表「[UPG-02+04 验收附带] obsidian.file.write 相对路径静默放行」（验收员 L3 补验实证，两次 journal 无 approval/asked）→ 设计师定夺：P1 成立，转工单。

---

## 一、问题实证（规则 20/21 溯源，全部实物锚）

1. **现象**：`obsidian.file.write` 相对路径调用（如 `upg02_l3_probe.md`）静默 ALLOW 零弹窗；绝对路径调用正常弹 ASK。证据：`验收员\证据数据\UPG-02_04-M3\L3_obsidian_ASK_2026-08-29\`（jsonl 全程 + 时间线 + 对照弹窗）。
2. **根因**：`McpToolScheduler.kt:161` `isHarmless()` 的 `name.contains("file.write")` **模糊匹配**把工作区特判扩散到 `obsidian.file.write`——相对路径落入 `isMovWorkspacePath()=true`（`McpToolScheduler.kt:140-156`：相对路径一律视为「MOV 公共目录工作区内」）→ 无害级 ALLOW。
3. **语义张冠李戴**：该特判的路径校验语义是「dsh 工作区 file.write 写 MOV 公共目录」；而 obsidian.file.write 实际经 `ObsidianProvider`（`app/src/main/java/com/mov/android/ObsidianProvider.kt`）走 SAF DocumentFile 写 **用户 Obsidian vault**——校验的路径空间和写入的目标空间根本不是同一个。ObsidianProvider.kt:19 注释自述红线：「obsidian.file.write **不进 harmless**（goal 模式写任意 vault 风险高于公共目录）」——实现违反了设计自述。
4. **判定顺序实证**：`guard()` DEFAULT_PERMISSION 分支（`McpToolScheduler.kt:204-214`）：sensitive → **isHarmless → writeTools**，harmless 先命中即放行，`writeTools` 里登记的 `obsidian.file.write`（:117）永不可达（相对路径形态下）。
5. **tier 面无感染**（UPG-23 单源，好事）：`permissionTier()`（:171-178）调 `isHarmless(tool, emptyMap())`，无 args 时 path=null → isMovWorkspacePath 返 false → 已正确回 "ask"——**只病实调闸门，不病展示面**；修复后两面自然一致。

## 二、修复方案（定案）

**改一处判定，不改名单**（采纳验收员建议①）：

- `McpToolScheduler.kt:161`：`name.contains("file.write")` → **`name == "file.write"`**（全名精确匹配）。
  - dsh 工作区 file.write 的 harmless 语义（相对/公共前缀放行、private=true 仍实质级）**一字不变**；
  - `obsidian.file.write` 不再入特判 → 下落至 writeTools 的 `contains("file.write")` → **ASK**（任意路径形态：相对/绝对/private 一致）。
- 不采纳「obsidian.* 前置排除」：冗余——writeTools 模糊匹配已兜住，多开一条规则=多一处镜像维护面（黑名单四处镜像前科教训）。

**契约断言落码**（防回归，UPG-21「注释不算接线」教训）：
- obsidian.file.write × 三路径形态（相对 `a.md` / 绝对 `/x/a.md` / 相对+private=true）→ 全落 ASK；
- dsh file.write 回归面不动：相对工作区路径仍 ALLOW、private=true 仍 ASK、越界 `../` 仍 ASK；
- **变异锚 M1**：`:161` 改回 contains → 上述断言必红；**M2**：删三形态断言中任一 → 变异测试必红。

## 三、验收口径

- **L1**：全量绿（--rerun-tasks）+ 新契约断言 + 变异锚 M1/M2 亲杀记录。
- **L2（真机）**：相对路径调 obsidian.file.write 弹 ASK（复刻验收员 `upg02_l3_probe.md` 剧本），journal 出现 approval/asked 事件——即挂账销项条件原文。
- **销项**：验收通过后划销挂账登记表该 P1 条。

## 四、红线与防撞

- 只动 `isHarmless()` 的 file.write 特判匹配方式；**名单区（writeTools/harmlessTools 内容）一行不动**。
- 防撞：`McpToolScheduler.kt` 名单区（:100-138）与 **UPG-22 ③**（writeTools memory.save 清理，在施）邻接——本单改 :161 判定逻辑区，同文件不同区；**后合者 rebase**，不做语义合并。
- 不碰 PermissionGuard 其余分支、不碰 ObsidianProvider 本体、不碰 goal/open 模式语义。
- Token/KV 两节申报「不变」（审批闸行为面修复，不触请求链路）。

## 五、派单交接段

1. 认领：工单表 UPG-28 行 E 列写 `认领: <agent> worktree=mov-upg28 branch=feat/upg28 @<时间>`；
2. 从**最新 main** 切分支（规则 19，开工前 fetch+看表）；
3. 完成后登记两个表（先表后库）；报告落 `程序员/交付报告/DELIVERY_UPG28_*.md`，写明「已登记两个表」；
4. 验收员复验面 = L2 真机 ASK 弹窗 + journal 事件链（证据目录沿用 `验收员\证据数据\UPG-28\`）。
