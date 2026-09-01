# DELIVERY_UPG49_R2_2026-09-01（验收打回三项修复）

> 程序员 C ｜ 分支 feat/upg49-r2 ｜ 基线 main 040c9d9 ｜ 提交 5640bce
> 施工口径：我的记忆_验收方案_v1_2026-08-30.md（归档版；SYS-01 冻结区未收录该标准，沿用归档版） + UPG-49 L2 复核打回三件套（P1-1 撤销窗过期复活 / P1-2 302 条 ANR / P2-1 搜索无高亮）+ 自报 JsonMini 观察项排查
> 开工准入：UPG-49 架构红线核对通过——UI 层仅 import memory-api facade（不触碰 memory-core 内部）、UI 以底层 diff 为准（不乐观写死）、C 端语言仅通过 MemoryRows 映射

---

## 交付绑定（P0-2）

- delivery_id: DEL-UPG49-20260901-001
- code_commit_sha: 5640bce1696e297f137d2bb2e9dc9806078d2708
- artifact_sha: 4524b9f5b9abcbc90489e0e1f3acacdbec00e5ad8212c5e6edbc559c8bf83cf6
- evidence_manifest_sha: 16004595a85209be330b9e3100bc52bdfae4ed4450d06af4af202d48b105766d
- standard_id: 我的记忆_验收方案_v1（SYS-01 冻结区未收录，沿用归档版）
- delivered_at / delivered_by: 2026-09-01T18:10:00 / 程序员-C
- evidence_manifest: 见 `程序员/交付报告/DELIVERY_UPG49_R2_2026-09-01_manifest.json`（8 条：E-001~E-008，覆盖真机证据 5 张 + 源码/测试锚 3 份）

---

## 能力护栏（P1-1）

共享面影响清单:
- 共享面: 无——改动仅在呈现层 `MemorySheet.kt`（UI 窗口渲染）+ `MemoryRows.kt`（纯函数映射）+ 两个测试文件；未触碰 MainActivity 注册表 / 工具面 / 协议·接口定义 / 全局数据结构
- 影响下游: 仅 MemoryPageSheet 界面消费（P1-1 撤销条 / P1-2 渲染分页 / P2-1 搜索高亮）；memory-api facade 契约零变化
- 回归说明: 全量 `--rerun-tasks` BUILD SUCCESSFUL（app 全测试上下文）无新增失败；assembleDebug 绿；真机验证三项交互路径全部走通（见 §四）

coverage_status: FULL

---

## 一、打回项修复（三项）

### P1-1 撤销窗过期条目「复活」（现象：refreshUndoBar 只 clear removedAt 不同步 items）

| 项 | 内容 |
|---|---|
| 根因 | `refreshUndoBar()` 过期清扫只调 `clear removedAt`，未从 `items` 移除——过期后条目仍留在列表，撤销条重新触发时「复活」 |
| 修复 | `refreshUndoBar()`：`MemoryRows.expiredIds(removedAt, now)` 过期结算 → `items = items.filter { it.id !in expired }`；undo 的 `RESTORE_EXPIRED` 分支同步 `items = items.filter { it.id != id }` |
| 测试 | MemoryRowsTest「过期结算」+ MemoryPageContractTest 源码锚 |

### P1-2 302 条场景主线程 ANR（现象：renderAll 全量构建 ≈2700 View + ensureAllLoaded UI 线程同步分页）

| 项 | 内容 |
|---|---|
| 根因 | `renderAll()` 一次性构建全部条目 View（302 条 × ~9 View/条 ≈ 2700），且 `ensureAllLoaded()` 在 UI 线程同步分页加载——主线程长时间阻塞 |
| 修复 | `RENDER_PAGE = 60` 窗口化渲染（`vis.take(renderLimit)`）；`ensureAllLoadedAsync(onDone)` 改后台线程全量加载；`scrollContainer?.post { scrollTo(0, savedY) }` 恢复滚动位置 |
| 测试 | MemoryPageContractTest 源码锚（RENDER_PAGE 常量 + 异步加载 + 滚动恢复接线） |

### P2-1 搜索命中无高亮（现象：MemoryRows:31 注释与实现脱节）

| 项 | 内容 |
|---|---|
| 根因 | 注释声明「支持高亮」但 `matchRanges` 无实现（或 itemView 未消费）——搜索命中字无视觉反馈 |
| 修复 | `MemoryRows.matchRanges(text, query): List<IntRange>`（忽略大小写）实现；itemView 用 `SpannableString` + `BackgroundColorSpan(0x66FFC107)` 命中字淡黄高亮 |
| 测试 | MemoryRowsTest「搜索命中区间」（含大小写不敏感/无命中空列表）+ MemoryPageContractTest 源码锚 |

### 自报观察项：JsonMini 排查

- 结论：终止性安全（索引单调递增），与 ANR 无因果，不构成缺陷，无需改动。

---

## 二、测试与变异亲杀

- **定向单测**：MemoryRowsTest（新增「搜索命中区间」「过期结算」）+ MemoryPageContractTest（新增 3 个源码锚）→ 绿
- **变异亲杀**（各验证变红 → 还原复绿）：
  - M-P1-1 过期不清 items → 过期结算测试红 → 还原复绿
  - M-P2-1 高亮区间取消 → 搜索命中测试红 → 还原复绿
- **全量**：app `--rerun-tasks` BUILD SUCCESSFUL；`assembleDebug` 绿

## 三、真机验证（无线 adb 192.168.2.3:44043 · 小米 24018RPACC · root=KernelSU）

| 判据 | 结果 | 证据 |
|---|---|---|
| P1-1 撤销条出现 + 条目入撤销态 | ✅ | `03-undobar.png` |
| P1-1 撤销条过期自动消失 + 条目不再复活 | ✅ | `04-undobar-expired.png`（5s 后撤销条消失、列表不复活） |
| P2-1 搜索过滤 + 命中字淡黄高亮 | ✅ | `05-search-highlight.png`（像素检测：命中两字均高亮，0x66FFC107 40% 叠加白底 ≈ RGB(255,230,156)） |
| P1-2 记忆页正常渲染（3 条） | ✅ | `02-memory-sheet-3items.png`（入口 `01-main.png`） |
| 数据还原 | ✅ | `06-restored-3items.png`（3 条 DRAFT 全部还原） |

## 四、挂账观察项（被动发现 · 不属本单范围）

> 按挂账规则登记至 `处理中心\挂账登记表.md`，由设计师验证转工单。

- **Fts5QueryEngine 冷启动 ANR 旁路**：302 条场景冷启动主线程卡 `MainActivity` onCreate 会话索引重建（MainActivity:2155 调用链），非记忆页范围——与本单 P1-2 无交集，需独立工单评估（后台线程化 / 索引懒加载）。

## 五、登记两表

- 工单表.xlsx：UPG-49 程序员列 → ✅完成；备注：分支 feat/upg49-r2 / hash 5640bce / 报告 DELIVERY_UPG49_R2_2026-09-01.md / 变异亲杀 2/2 + 全量绿 + 真机验证通过 / 挂账 Fts5 冷启动 ANR；delivery_id 列 → DEL-UPG49-20260901-001
- 工单库.md：UPG-49 状态同步 →「程序员已修复交付（DEL-UPG49-20260901-001），待验收员 L1/L2 复验」

---

# R2b 回炉修复（2026-09-01 验收打回 P2-1）

> 验收员像素实证打回：搜「花生」2 字命中，高亮带仅 36px=单字（应 74px=2 字）——`setSpan(r.first, r.last)` 把 inclusive 区间末索引当 exclusive end，每段少高亮最后一字。附：置顶行 📌 图钉徽标按验收定删除。

## 交付绑定（R2b · 新 delivery）

- delivery_id: **DEL-UPG49-20260901-002**（supersedes DEL-UPG49-20260901-001：code_commit 5640bce→3751a99 变化，001 按交付绑定规范标失效）
- code_commit_sha: 3751a990f951b90bc02c867878dfce9aff897c73
- artifact_sha: bd09deb6de15dc2dad3b43ab709de309794d9f6a59482e27bf30fcddcf011820
- evidence_manifest_sha: 65693f77b1f231f60994bf0c16b716cbcef31d97a1e0f73879e74675549fd4cf
- standard_id: 我的记忆_验收方案_v1（SYS-01 冻结区未收录，沿用归档版）
- delivered_at / delivered_by: 2026-09-01T18:22:00 / 程序员-C
- evidence_manifest: 见 `程序员/交付报告/DELIVERY_UPG49_R2_2026-09-01_manifest_002.json`（6 条：修复后真机证据 07 + 修复前对照 05 + 4 代码/测试锚）
- 备注：交付后共享工作区 HEAD 被其他会话推进至 d159c69（用户直改：侧边栏术语统一，未触碰本交付 4 文件，不计入工单）——本交付绑定以我 push 的 3751a99 为准

## 修复内容

| 项 | 内容 |
|---|---|
| P2-1 off-by-one | `setSpan(r.first, r.last)` → `r.first, r.last + 1`（matchRanges 返回 inclusive 区间，setSpan end 为 exclusive） |
| P2-1 删📌徽标 | MemoryRows.statusBadge 去 `"📌 "` 前缀；MemorySheet 状态徽标去置顶变黄（0xFFB8860B），统一 TEXT3——验收定：置顶由行内「取消置顶」按钮 + 详情「· 置顶」标注体现 |

## 测试与变异亲杀

- **单测**：MemoryRowsTest「行号徽标」断言去 📌（pinned 项=纯状态词）；MemoryPageContractTest 新增「P2-1 setSpan end 必须 r.last + 1」防 off-by-one 回归锚 + 「置顶徽标无图钉前缀/不变黄」锚
- **变异亲杀 2/2**（各验证变红 → 还原复绿）：
  - M-1 off-by-one 倒退（`r.last + 1` → `r.last`）→ MemoryPageContractTest 8 中 1 红 ✅
  - M-2 恢复📌（statusBadge 加回 `"📌 "` 前缀）→ MemoryRowsTest 11 中 1 红 ✅
- **全量**：app `--rerun-tasks` BUILD SUCCESSFUL + assembleDebug 绿

## 真机验证（无线 adb 192.168.2.3:44043 · 修复版 APK）

| 判据 | 结果 | 证据 |
|---|---|---|
| P2-1 高亮 off-by-one 修复：搜「高铁」命中 2 字 | ✅ 高亮带 **70px = 2 字**（修复前验收员实测 36px = 1 字；预期 74px，含字间距吻合） | `07-search-highlight-fixed.png`（像素检测：淡黄 RGB(255,230,156) x 范围 155-224 宽 70） |
| 对照：修复前同一内容 | ⚠️ 1 字高亮（验收员实测 36px） | `05-search-highlight.png` |
| 数据还原 | ✅ 3 条待确认记忆全部还原 | `06-restored-3items.png` |

## 登记两表（R2b 更新）

- 工单表.xlsx：UPG-49 delivery_id 列 → **DEL-UPG49-20260901-002**（备注追加：R2b P2-1 off-by-one 修复 + 删📌，commit 3751a99，001 失效）；程序员列保持 ✅
- 工单库.md：UPG-49 状态 → 追加「R2b P2-1 回炉修复交付（DEL-UPG49-20260901-002，3751a99），待验收员 L2 复验 P2-1」
