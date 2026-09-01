# UPG-05 交付报告：记忆体系回补（链路修通+基因化+预算投影+显化页）——四步全单

**程序员**：C ｜ **日期**：2026-08-28 ｜ **分支**：`feat/upg05` @ **8eae1cb**（7 commits：952d035/ac72e29/076e554/b74727b/bd801fc/8c8724d/8eae1cb，基于 main 974f33a）
**已登记两个表**（工单表 + 工单库）；worktree=`mov-upg05`。

**Token/KV 影响申报（AGENTS.md 硬规则 1）**：
- Token：system prompt 新增记忆能力段（固定 ~120 字）+ per-session 冻结的失败教训/用户基因段（≤3 条 AVOID + 画像基因，**occurrences≥2 才注入**）+ MemoryCover 注入段（双限制封顶：maxItems=6 + maxLength=1200 char）。每轮增量由 cover 预算封顶。
- KV Cache：**MemoryCover=Snapshot**（per-session 冻结缓存，session 内注入段字节恒定）；指纹覆盖全部条目；**例外申报**：显式移除触发同 session 重建=一次前缀失效（低频/用户发起/隐私优先，E4a 判据验收收益）。
- 自跑 `node scripts/check-token-effect.mjs` → **通过**。

---

## 一、四步逐条对账（方案 §二 → 落点 → 实证）

### 步 1 · 链路修通（952d035 + ac72e29）
- **三工具**：memory.search（全局检索+SEARCH_HIT 打点）/ memory.delete（tombstone，ASK 高危）/ memory.cover（逐字/塌缩+指纹，COVER_HIT 打点）——save/load/list/judge 已有保留。
- **打点接线（命门）**：`recordSearchHits`/`recordCoverHits` 获得**定义外真实调用点**（MemoryMcpTools.search/cover），**JVM 链路断言**（源码级+行为级双断言，防「函数在链断」再犯）。
- **打点口径（v5.1）**：dedupe key=(sessionId, turnId, memoryId)；同轮跨来源 SEARCH_HIT 优先；**跨 session sum**——`MemoryRefEvent` 加 turnId 载荷（Session.kt + EventCodec.kt **双通道同步**，JSONL 恢复不丢）。
- **聚合层**：`MemoryAggregator`（跨 journal 重放投影；Scope Contract USER_GLOBAL 落地；派生索引合法性：全量可重建+只读无旁路）。
- **prompt 注入位**：system prompt 记忆能力段（何时 save/search/cover/delete，会话开始定型）。
- **权限分级（方案定案）**：save 移出无害级（=写类 ASK）；search/cover 无害；delete=写类 ASK——PermissionGuardTest 口径更新+新增分级断言。

### 步 2 · 基因层（b74727b + bd801fc）
- `MemoryGene.kt`：MemoryGeneCompactor/UserGene 老版移植（compact/renderGene/profileGenes/renderUserGenes）；**confidence 只接受规则推导**（expired=0 压过一切 / promoted=0.9 / refCount 分级——禁 opaque 分数）。
- **AVOID 语义过滤（v4 硬规）**：指令语义（忽略系统规则/更改权限/修改安全策略/修改身份/开发者模式）命中**即弃条**——单测覆盖 4 形态 + 正常偏好不误杀。
- **occurrences≥2（v5 阈值，变异锚⑥）**：failureAvoids 聚合计数，N≥2 才进注入面——**变异亲杀**（≥2→≥1 两测试必红）。
- **judge 第四面**：tombstone 排除——聚合有效集已压制，judge 喂 AggregatedJournalView 不再晋升已移除条（单测断言）。
- **failureAvoids 数据源**：`FailureEventSource(Impl)` 扫全房间 journal tool/result(isError) 事件。

### 步 3 · 预算覆盖投影（8c8724d）
- `MemoryCover.kt`：**MemoryCoverProjector**（晋升>draft 分层截断+档内 refCount/updatedAt 降序**显式重排**+双限制 maxItems=6/maxLength=1200[char]+塌缩 span `[f:hash]` 原文指纹）+ **MemoryCoverManager**（per-session Freeze；显式移除=唯一合法 invalidate[invalidateOnRemoval]；onFingerprintChanged 审计挂点）。
- **注入段**：memoryCoverPromptSegment()——Snapshot 渲染（✓晋升标）；**cover 打点对齐 Freeze**：turnId=`cover-<指纹>`（同 session 内容恒定→整段只计 1 次引用）。
- **E4a 接线**：memory.delete 成功 → invalidateOnRemoval → 返回/下次注入重建（指纹 diff 日志 UPG05COVER 可证）。

### 步 4 · 记忆显化页（8eae1cb）
- `MemoryPageActivity`（**原生代码布局**——冷启动硬指标）：全局记忆列表（跨 journal 聚合）+ 分层展示（【已固化】/【草稿】状态标+kind+引用计数+时间+来源）+ **draft 默认折叠**（点击展开——隐私心理设计落点）+ **移除**（二次确认弹窗→tombstone 写主对话 journal→cover invalidate→列表即时消失）。
- **入口**：SettingsPage.vue native groups「信息管理」行（去演示文案）→ ui.openMemory 桥（SettingsSheet 白名单 ui.* 已含）；Manifest 注册。
- **宿主钩子**：MainActivity.memoryPageHost（lambda 运行时读当前 session——switchToRoom 后仍正确）。

## 二、L1 验证（全绿）

| 项 | 结果 |
|---|---|
| JVM 全量（testDebugUnitTest） | **291 tests 全绿**（含 MemoryAggregatorTest 11 + MemoryGeneTest 12 + MemoryCoverTest 9 新增） |
| 变异亲杀 | **6/6**（锚①dedupe ②sum ③指纹失效[单测断言] ④截断顺序 ⑤tombstone 三面 ⑥occurrences≥2——各注入变异必红+还原绿） |
| **真机 instrumentation（emulator-5556）** | **OK (4 tests)**：MemoryLink（L2 全链 journal 证据+Scope 跨房间+tombstone 三面）+ MemorySeedFactory（工厂+冷启动） |
| token 申报 | check-token-effect.mjs **通过** |

## 三、真机证据（emulator-5556）

- **显化页走查截图**：`验收员\证据数据\UPG-05\R1_显化页_有数据.png`（列表/状态标/引用计数/移除钮）+ `R1_移除后列表.png`（移除弹窗流程）。
- **冷启动（验收锚 4）**：**379ms**（UPG05MEM t0/t1 日志，300 条种子下）≪ 2s 门槛；instrumented 断言 <2s 双测试通过。
- **跨 session sum 真机实证**：显化页「引用 6 次」= 历史多轮 instrumented ref 累计（sum 算符真实生效）。

## 四、降级与申报（如实）

1. **L3a/L3b/E1/E2/E3/E4/E5/R 组行为层（AI 对话面）**：模拟器**无网络**（ping api.deepseek.com 100% loss），AI 对话不可用——**机制面全部已证**（注入段确定性：occurrences=1 不注入/≥2 注入、cover 冻结、tombstone 三面、sum/dedupe——JVM+instrumented 双覆盖）；**行为面 3 跑 2 过**（固定模型/采样/3 次录屏）待网络环境由验收员执行（**E/R 组本来就是验收员判据**，工具面+注入面已全部就绪）。
2. **显化页 UI 移除交互完整走查**：需登录态主会话（instrumentation 进程无主 session 时移除按钮按设计拒绝[toast「会话未就绪」]——防御性显示正确）；**机制面**（tombstone 三面同步+judge 排除+cover invalidate）已由 MemoryLink instrumented+JVM 覆盖——**建议验收员登录态下走查**。
3. **懒提炼（needsCompress）**：接口保留（entry.needsCompress 标记），本单不接 LLM 调用（compactor 零 LLM 口径）；塌缩占位串信息量足够，后续单接提炼。

## 五、施工期决策清单（方案 §六 随报告过目）

1. 失败教训容忍：扫 tool/result(isError=true) 的 resultContent 文本（新版无独立 fail 事件——ToolResult isError 即失败证据）；
2. 折叠阈值：draft >24 字折叠摘要+「… 展开」；
3. prompt 注入段文案：记忆能力段 4 句 + 失败教训/用户基因独立段（AVOID 前置）；
4. 派生索引形态：MemoryGlobalSourceImpl 全量重扫（300 条/3 房间毫秒级，索引后置——聚合不得退化 O(房间数) 的门槛由冷启动断言把守）；
5. **变异锚 6 条 ↔ 测试映射表**：①dedupe→MemoryAggregatorTest`同 session 同 turnId 同条多次 ref 只计一次` ②sum→`跨 session 引用聚合取 sum`+`sum 与去重区分` ③指纹→MemoryCoverTest`指纹覆盖全部条目`+`显式移除——invalidate 后重建且指纹变化` ④截断→`截断顺序——晋升优先于 draft 且档内按引用计数`+`同档同引用按 updatedAt 降序` ⑤tombstone→`tombstone 后 list_search 两面同步消失`等 3 项 ⑥occurrences→MemoryGeneTest`失败 1 次不产出`+`失败 2 次产出`；
6. E 组录屏方案：验收员侧执行（emulator screenrecord 3min 上限，分段录屏），本单交付数据工厂（seed_300条混合数据_走journal写入路径并重置）供验收复跑。

## 六、施工中被动发现（无新增挂账——已全部在案）

- UPG-16 gradle.properties 四属性丢失（挂账在案）：本 worktree 本地补齐后构建（与其他 worktree 同处置）。


---

# R1 重修补充（@2026-08-29，打回后）

**打回结论**（用户裁决）：D1/D2 入口错位（记忆入口落在 Vue WebView 深处，用户主路径 native SettingsSheet 零入口且与「我的信息」语义混淆）+ D3 save 审批交互成本（涉方案定案调整，验收员不代改）。

**R1 修复（d147292）**：
1. **D1/D2 入口归位**：native SettingsSheet 原生「信息管理（记忆）」行 → MemoryPageActivity（用户主路径；与「我的信息」BizSheet 解耦）——SettingsSheet.kt memoryRow/memoryBtn（logoutRow 同形态）。
2. **D3 按 v5.3 新口径执行**：memory.save 归位 harmless（blast radius 可逆可观测[tombstone+显化页+14 天衰减+journal 留痕]+注入面闸门在 compactor AVOID 语义过滤+occurrences≥2——**save 放行≠注入放行**+note.create 一致性对齐）；delete 维持 ASK；PermissionGuardTest 口径同步（save=ALLOW/delete=ASK）。
3. **显化页分批渲染**：300 条冷启动 2322ms 超标（280 View 一次性构建布局）→ 首屏 30 条+余量每批 50 条追加 → **678ms <2s 达标**（首屏可交互语义）。

**R1 验证**：JVM 全绿+真机 instrumented OK(4 tests)+装机 dex 验证固化（tools/robust_install.sh——uninstall 重试+pull 验 dex）。

**申报**：R1 差异面=入口行/权限名单/测试口径/分批渲染；机制面维持有效（验收员已复核不返工）。
