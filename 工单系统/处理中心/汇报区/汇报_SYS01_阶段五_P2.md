# 汇报 · SYS-01 工单系统自身改造（第五阶段 P2 自动化收口）

> 类型：SYS 系统自改进（独立编号，不混入 UPG 主线）
> 日期：2026-09-01 ｜ 依据：`设计师\派单\SYS-01_阶段五_P2_派单_2026-09-01.md`（验收标准 A-G）
> 治理归属：工单系统自身改造（**只动 `Desktop\MOV\工单系统`**，**零 APP 影响**，未碰 0027-mov）
> 状态：✅ 已完成（P2 收口 → SYS-01 六阶段全部完成）

---

## 一、本阶段交付（审验.py 扩展 + 1 处正则修复）

| # | 功能 | 实现 | 验收用例 |
|---|---|---|---|
| A | **--ticket 交付联动** | `audit_ticket` 当工单表绑定 delivery_id → 证据目录自动找 manifest 重算比对，`delivery_check` 出 flag：一致「正常」/ 不一致「⏳失效（需新建 delivery_id）」 | SYS-P2A1（一致→正常）/ SYS-P2A2（篡改→⏳失效） |
| B | **--ticket 主链路**（回归保障） | time_inconsistency 检测在 P2 改动后无回归 | SYS-P2B（journal 22:13:38 vs 截图 22:00:00 → flag） |
| C | **--coverage 能力护栏自动核验** | `verify_coverage` 读交付报告「能力护栏」节：NONE→禁合 main flag / PARTIAL 缺六字段或裁决人≠设计师→打回 / PARTIAL 完整→通过 / FULL→通过；无节但共享面变更→打回 | P1-1 三态用例（B_NONE/C_PARTIAL_missing/D_PARTIAL_full） |
| D | **紧凑时间戳正则修复**（修已知坑 #5） | `ts_from_filename` 补紧凑格式 `YYYYMMDD_HHMMSS` / `YYYYMMDD-HHMMSS` / `YYYYMMDD_HH-MM-SS` | SYS-P2D（`shot_20260829_220000.png` 识别 22:00:00） |
| E | **--ticket-file 坑位库查询字段核对** | `check_ticket_query_field`：派单文本缺「已查坑位库/复用件库」字段或填「否」无说明 → reject flag（出单不合规） | 缺字段→退回 / 否无说明→退回 / 阶段五派单文本（是命中）→通过 |

**代码改动**：`审验员\审验.py`（`_find_manifest_in` / `audit_ticket` 交付联动 / `_extract_section` 修复 / `verify_coverage` / `check_ticket_query_field` / `ts_from_filename` 紧凑正则 / main 加 `--coverage` `--ticket-file` / docstring 更新）；一处既有 bug 修复（见「五、新发现 1」）。

## 二、验收标准核对（阶段五 L1，全部通过）

| 项 | 标准 | 实测 |
|---|---|---|
| A | --ticket 交付联动：一致→正常 / 篡改→⏳失效 | ✅ 注入绑定表实测：SYS-P2A1 match=True「正常（manifest_sha 重算与绑定值一致）」；SYS-P2A2 match=False「⏳失效（manifest_sha 与绑定值不一致——清单内容已变，需新建 delivery_id）」 |
| B | --ticket 主链路 time_inconsistency | ✅ SYS-P2B：截图 22:00:00 早于 journal 最早工具调用 22:13:38 → time_inconsistency=True，evidence_integrity 六项照常输出 |
| C | 能力护栏自动核验三态 | ✅ NONE→`block_merge`（禁合 main，非建议谨慎）；PARTIAL 缺六字段→`reject` 打回；PARTIAL 完整+设计师裁决→`pass`；FULL 路径代码就位 |
| D | 紧凑时间戳识别 | ✅ SYS-P2D：`shot_20260829_220000.png` 识别 2026-08-29 22:00:00，time_inconsistency=True（修已知坑 #5） |
| E | 派单文本缺「已查库」字段→退回 | ✅ 缺字段→`reject`（出单不合规）；「否」无说明→`reject`（须写明为何不查）；阶段五派单文本「是，命中 已知坑#5+复用件审验.py」→`pass` |
| F | 红线不破：机器只出 flag | ✅ 全部输出 `conclusion: 需人工裁决（机器只出 flag）`，integrity_review 人工裁决槽位保留，未代判放行 |
| G | 全量回归 | ✅ --list（63 个证据目录）正常；--manifest 重算比对一致；--ticket UPG64 既有主链路完整输出（层A四分类/层B六项/problems/conclusion）无回归 |

## 三、范围与红线遵守

- 只动 `Desktop\MOV\工单系统`，**未碰 0027-mov APP 源码** ✅
- 未进 `工单表.xlsx` UPG 主线（验收 A 用 inline 注入绑定表，不写真实工单表）✅
- 未新增机制/角色/评分体系/防伪分类（P2 只是把前几阶段预留的自动化落地，无新机制）✅
- 机器只出 flag，人最终裁决（integrity_review 保留）✅

## 四、遗留（P2 收口后）

- **无 P2 内遗留**。后续可选项（非 SYS-01 范围）：交付报告「能力护栏」节由 `--coverage` 自动校验并入验收工作流；坑位命中自动匹配（已知坑按关键词命中）留待真实工单数据沉淀后再议。

## 五、新发现（如实列出）

1. **`_extract_section` 正则 bug（本阶段发现并修复）**：`re.S` 使标题行的 `.*` 跨行贪婪，`\n` 错位匹配到文件末尾换行，导致 `--coverage` 提取「能力护栏」节捕获空串 → 首测三个用例全报「缺 coverage_status」。已修：标题行改 `[^\n]*`（不跨行），正文保留 `(.*?)` 跨行。**同类 `## 节` 提取因此修复受益**。
2. **紧凑时间戳修复闭环**：已知坑 #5 从「药方：或审验正则支持紧凑格式（P2 时扩）」落地为实际支持，复用件审验.py 条目「已知限制」同步解除并标注 P2 修复——两库已更新。
3. **复用件使用次数仍为 0**：审验.py 扩展后仍是新交付状态，待首个真实工单实际引用（半自动沉淀 + 使用次数 +1 机制已就位）。

## 六、建议

- 首个用到 `--coverage` / `--ticket-file` 的真实工单交付时，走一遍「出单（派单字段已查库）→ 施工 → 交付报告（能力护栏节）→ 审验（--ticket-file + --coverage + --ticket）」全流程，验证自动化的可操作性。
- 阶段五 P2 已把机械活收口；人工裁决（integrity_review / 能力护栏裁决 / 命中条目人工核对）保持人判，不被自动化替代。
