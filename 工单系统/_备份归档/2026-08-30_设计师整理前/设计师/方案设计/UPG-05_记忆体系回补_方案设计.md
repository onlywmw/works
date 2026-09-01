# UPG-05 记忆体系回补（链路修通 + 基因化 + 预算投影 + 记忆显化页）· 方案设计 v5.2（签字版）

> 设计人：设计师 ｜ 日期：2026-08-26（v2）/ 2026-08-28（v3/v4/v5/v5.1/v5.2）/ 2026-08-29（v5.3）｜ 优先级：P0 ｜ 状态：🔨 **v5.3 R1 重修动工（C，feat/upg05 续作）——签字闸已取消（用户拍板 @2026-08-29：评审意见为参考，定案权=设计师+用户拍板，不设签字前置）**
> v5.3 修订说明（验收员打回 D1/D2/D3 + 用户 UX 裁决 @2026-08-29，设计师裁决落案）：①**入口归位**——方案原意即 native SettingsSheet（侧边栏→设置）「信息管理」行，实现错落在 Vue SettingsPage（workbench 区 WebView 深处）：R1 在 native SettingsSheet 加「信息管理」行点击打开记忆页（Vue 记忆页本体复用不变），与「我的信息」BizSheet 解耦——记忆是独立能力层，独立入口；②**memory.save 降 harmless**（自动放行）——草案 tombstone 可移除 + 显化页可见 + 14 天衰减兜底 + journal 留痕，blast radius 小且可逆；save 是记忆系统高频核心动作，每次弹窗直接杀死「AI 主动记忆」行为；注入面闸门在 compactor 语义过滤 + occurrences≥2（步 2），不在 save 审批。**delete 维持 ASK 不变**。权限分级变更属 v5.2 签字定案调整——~~待查验员复核~~ **签字闸已由用户拍板取消（2026-08-29），验收员技术意见作参考存档（见下），R1 即刻动工**；③重交时 E/R 行为面（E1~E5/R1~R3，3 跑 2 过+录屏）由验收员在 5558 环境执行。机制面复核全过不返工（L1 297/0/0、变异 6/6、instrumented 4/0、审批闸实证）。
> **验收员技术意见（v5.3 两处变更复核，2026-08-29 凌晨，打回发起人）**：①**入口归位无异议**——与验收实证完全一致：native SettingsSheet 零记忆入口（SettingsSheet.kt grep 零命中）、「我的信息」BizSheet 无记忆项（dump 实证）、入口错落 Vue SettingsPage.vue:172；R1 修法（native 加行+Vue 记忆页本体复用+与「我的信息」解耦）正确。②**save 降 harmless 技术上支持**，三条佐证：a) blast radius 论证成立——tombstone 可移除（E4a 机制判据已入 L 组钉死）+显化页可见+14 天衰减+journal 留痕，可逆可观测；b) **注入面闸门确实不在 save 审批**——垃圾/恶意 save 到不了注入面（compactor AVOID 语义过滤即弃 + occurrences≥2 门槛，步 2 变异锚⑥亲杀实证），save 放行≠注入放行；c) **与既有 harmless 名单一致性佐证**：note.create 本就在 harmlessTools 名单（McpToolScheduler:114-119 实证），memory.save 同为「本机记录类」，v5.2 的 save=ASK 反而是异类——降 harmless 是回归一致性。配套要求：PermissionGuardTest 口径随 R1 同步更新（步 1 已有该测试，重交 L1 覆盖）+ delete 维持 ASK 不变（同意）+ 重交时 L3a/E/R 行为面按 v5.3③ 由验收员在 5558（key 已配）执行。**意见：支持 v5.3，请查验员复核签字后 C 动工。**
> v5.2 签字版说明（查验员四条收口条件全部落死，2026-08-28）：①E 组防刷分规则（固定模型版本与采样参数、连续 3 跑、3 次录屏全存证含失败）②E4a 逻辑漏洞修正——同 session 内对话历史本身含记忆原文，「AI 不再引用」不可判：机制判据（指纹 diff → 注入段不含）移入 L 组确定层，行为面只保留 E4b ③规模化门槛从区间定为数（300 条混合种子、冷启动 <2s）+ 测量方法定死（日志时间戳）④R 组三条补成 E 组同格式剧本（固定台词 + 二值判据）。非阻塞建议入施工期清单。结构零改动。
> v5.1 定稿说明（专家复审两轮收口，2026-08-28）：第一轮收**定案精度**——①打点口径三命题互斥修正（dedupe key=(sessionId, turnId, memoryId)，source 降为事件属性）+ 晋升阈值语义漂移显式标注（接受门槛降低，理由见步 1）②「draft 进 cover」准入规则明写 + maxItems 截断顺序定案 ③变异锚 4→6（补 sum 算符、occurrences≥2 阈值）；第二轮收**验收层次**——§四 扩四层（机制层 L / 体验层 E / 红线 R / 显化页+基建），兑现 v3「验收员看页面不看日志」。对评审的一处修正：E3 下半场「未注入」判据改走确定层（行为面证否噪声太大）。澄清项 ④⑤⑥ 已分别落进步 3/步 1/步 2 正文，残余细节入施工期清单。
> v5 修订说明（专家复审 8/10 收口，2026-08-28）：开工前五问扩为**八问全部定案**（见 §六）。核心裁决：**显式移除 = 唯一合法 invalidate 触发者**（隐私语义 > 前缀稳定；后续批「编辑」同属显式豁免类别）。Scope Contract 补 failureAvoids / 指纹缓存两项 + 派生索引合法性判定标准；步 4 硬依赖由基因化改为**全局聚合**（感知面可先落地）；AVOID 误报放大防护（occurrences≥2 才注入）进契约；cover 上限暂按 char 计并标注换算系数；打点接线拆独立验收时刻。
> v4 修订说明（专家评审 8.5/10 后收口，2026-08-28）：**新增 Memory Scope Contract（开工前不可争议）+ 打点计数口径定案 + AVOID 注入面硬规 + 显化页分层展示 + 四项 P0 验收**。两处对评审的修正：①`confidence` 只接受规则推导值（compactor 零 LLM，不产生 opaque 分数）；②cover 上限改双限制（条数 + 长度），长度单位随 UPG-07 预算口径定案后对齐，不先抄数字。
> v3 修订说明（用户拍板 2026-08-28）：**记忆显化页并入本单——一单两交付：基因化（数据面）+ 显化页（感知面）**。纯数据面回补用户无感，显化页是本单的验收锚（验收员看页面不看日志）。
> v2 修订说明：v1 有一处事实错误（memory.* 工具「断线」说法只对一半）、漏掉两个比方案四点更致命的死穴；causal 与记忆回补是两个域，拆出本单。
> 依据：老版 `MemoryGeneCompactor.java`（177 行）、`UserGene.java`（88 行）、`Journal.java:1318-1378` memoryCover、`causal/`（14 文件）逐行核实（MOV-APP-gene 等 9+ 快照在案）；新版差异经全库 grep 确认

---

## 一、问题（v2 实测证据）

新版 `memory/MemoryLifecycle.kt`（195 行）已移植「引用≥2 晋升 / 14 天零引用衰减 / 幂等 curate」骨架，但**记忆链在两个点上是死的**：

### v1 漏掉的两个死穴（最致命）

1. **晋升证据链断裂**：`recordSearchHits`/`recordCoverHits`（`MemoryLifecycle.kt:87-115`）**全库零调用者**（grep 仅命中定义处）→ `memoryRef` 永不发生 → 引用计数恒 0 → `judge` 永不晋升 → 所有草案 14 天后无条件衰减。记忆体系实际 = **手动草稿箱 + 14 天自动清空**。
2. **无 prompt 注入**：system prompt（`MainActivity.kt:3504-3516`）无一字提记忆；老版每轮注入 memoryCover + failureAvoids + UserGene 渲染（`AgentLoop.java:1578,1630-1652`）——这是「AI 懂你」的真正引擎。AI 不自发调 memory.load 就等于没有跨会话记忆。

### v1 事实修正与其余缺口

| 缺失项 | 老版证据 | 新版现状（v2 复核） |
|---|---|---|
| memory.* 工具 | save/load/delete/list + cover/search 六件套（`HermesToolProvider.java:123-156`、`MemoryToolProvider.java:318/342`） | **v1 修正**：save/load/list/judge **已实现且入工具面**（`MainActivity.kt:1563-1566`、`MemoryMcpTools.kt:12-133`），草案跨会话存活；缺的只是 **search/delete/cover** |
| 记忆基因化 | `MemoryGeneCompactor.java:21-136`（纯规则 `{k,s,a}`，零 LLM） | 全库无 |
| 失败教训自动提取 | `:138-167`（扫 journal fail + `tool_result(ok=false)`） | 无 |
| 用户画像基因 | `UserGene.java:16-87`（只渲染基因不渲染原文） | 无 |
| 预算覆盖投影 | `Journal.java:1318-1378`（逐字/塌缩 `[f:hash]` 指纹/懒提炼，原文永不丢） | 无 |
| causal 增强 | `causal/` 14 文件 | 仅 `Causal.kt`+`CausalEngine.kt`（「简化」）——**拆出本单，见 §二** |
| 记忆单测 | 老版 4 个测试类 | 零 |

## 二、迁移方案（4 步 + 1 拆出，每步独立可验收——出口门槛见 §四编排表）

1. **步 1 · 链路修通（本单核心）**：
   - 实现并注册 `memory.search/delete/cover`（save/load/list/judge 已有，不重复做）；复用 Lifecycle + RoomStore，sandbox 红线不变；权限分级（search=无害；**save=harmless 自动放行（v5.3 修订：高频核心动作，弹窗杀死主动记忆；注入面闸门在 compactor 过滤+occurrences≥2；草案可移除可衰减可审计）**；**delete=高危写类 ASK、档位 ≥ save，AI 调用 delete 必走 ASK**——「AI delete × AVOID 注入」组合依赖 ASK 挡板，v5.1 定案）；
   - **打点接线（命门，独立验收时刻）**：打点与工具实现分开验收——先手写调用点跑通链路断言（§四 L 组），再补 search/cover 工具实现；命门出问题时可定位，不与工具实现混在一起；
   - **打点计数口径（v5 定案，v5.1 精度修正）**：dedupe key = `(sessionId, turnId, memoryId)`（turnId=requestId，无新概念）——同 session 同条**每轮**最多 +1；同轮跨来源归并为一次（source 降为事件属性，SEARCH_HIT 优先于 COVER_HIT，不双计）；**跨 session 聚合取 sum**（不同会话的引用是独立证据，不得取 max 或去重成 1）。来源档只做 `SEARCH_HIT`/`COVER_HIT` 两档；「模型真正使用（used）」需事后输出分析，不确定、不可测，**不入本单**（记为未来扩展档）；
   - **晋升阈值语义变更（v5.1 显式标注）**：新口径下「save → 同轮 search +1 → 下轮 cover +1」即 sum≥2，draft 可单会话自证晋升——相对老版「引用≥2」隐含的跨会话证据语义，这是**门槛降低，方案选择接受并标注**：晋升本就奖励「被反复使用的记忆」；衰减侧（14 天零引用）兜底 + 显化页移除是误晋升出口。（备选「阈值升 3」否决——会重新引入死穴 1 的流量枯竭。）
   - **prompt 注入位**：system prompt 增加记忆能力段（告诉 AI 有 memory.* 可用、何时用），会话开始装配定型（前缀恒定）。
2. **步 2 · 基因层移植**：`MemoryGene`/`UserGene`/`MemoryGeneCompactor`（纯规则、JVM 可测）→ 挂 MemoryLifecycle 的 curate 钩子（晋升时产基因）；`failureAvoids` 挂 journal 事件流（fail/ok=false 扫描）。
   - **基因字段（v4 定案）**：内部模型 `{k, s, a, source, updatedAt}`；`confidence` **只接受规则推导值**（晋升状态 + 引用计数 + 衰减档位的确定性函数）——compactor 零 LLM，禁止产生 opaque 分数。渲染子集不变（UI/prompt 仍只渲染 `{k,s,a}`，见 §三红线）；
   - **AVOID 注入面硬规（v4 新增，v5 补阈值）**：「用户文本 → memory → AVOID → system prompt」是持久化注入链，必须断。AVOID 只能表达用户偏好/历史行为约束；compactor 层语义过滤「忽略系统规则 / 更改工具权限 / 修改安全策略 / 修改身份 / 修改开发者指令」类内容，命中即弃条并落 journal 审计事件。**误报放大防护（v5 新增，进契约不下沉）**：自动提取带 `occurrences` 计数，**N≥2 才进注入面**（N=1 不注入），且显化页可见可移除——误报进持久化注入面 = AI 长期避开某正常操作且极难察觉；
   - **judge 第四面（v5.1 新增）**：judge 聚合输入**排除 tombstone**——已移除 draft 不得凭历史打点晋升（list/search/cover 三面之外的 tombstone 第四面）。
3. **步 3 · 预算覆盖投影**：memoryCover 逐字/塌缩两级 + span 指纹缓存 + `needsCompress` 懒提炼（原文只存一处）；**冻结注入升格为硬规则：MemoryCover = Snapshot（非 Live Query）**——session 开始 Load → Compact → Freeze，整个 session 使用同一份 cover；
   - **draft 进 cover（v5.1 明写准入）**：cover 准入 = 晋升 + draft 全量（受双限制截断）——draft 不进 cover 则 recordCoverHits 无 draft 对象、晋升流量枯竭，死穴 1 只修一半（L3b 本就隐含此前提）。**maxItems 截断顺序定案**：晋升 > draft；同档按引用计数降序、再按 updatedAt 降序——规则确定，变异锚才有断言对象；
   - **invalidate 裁决（v5 定案）**：**显式移除 = 唯一合法 invalidate 触发者**（UI tombstone；后续批「编辑」tombstone+appendDraft 同属显式豁免类别）——触发时同一 session 内重建 cover，一次 KV 失效可接受（隐私 > 前缀稳定）。打点/晋升/衰减等高频隐式事件**永不** invalidate，否则 Freeze 名存实亡。**传播机制（v5.1）**：移除是 USER_GLOBAL、invalidate 是 session 级——「离开对话 → 设置页移除 → 返回对话」时返回侧做指纹 diff 检测并重建（事件总线广播为备选）；此路径由 L 组 E4a 机制判据钉死，机制做错必挂；
   - **上限口径（v5 修订）**：双限制 maxItems + maxLength；**长度暂按 char 计并标注换算系数**（≈token 估算系数），待 UPG-07 预算口径（char/4 修订）定案后对齐单位。
4. **步 4 · 记忆显化页（v3 并入，感知面；v5 改依赖；v5.3 入口归位）**：**native SettingsSheet（侧边栏→设置，用户主路径）加「信息管理」行**，点击打开记忆页（Vue 页本体）——与「我的信息」BizSheet 解耦，记忆是独立能力层独立入口（v5.2 前实现错落在 Vue SettingsPage，打回 D1/D2 已裁决）。页面本体=全局记忆列表 + 移除。**硬依赖 = 全局聚合（Scope Contract + 跨 journal 聚合投影），不再是基因化**：基因化只决定「显示摘要 vs 显示原文」的质量，不阻塞页面——draft 折叠展示规则生成的临时摘要（不落库），基因上线后平滑升级。**分层展示纪律**：基因 / 已晋升 = 摘要 + 来源时间 + 状态标；draft 原文**默认折叠**（全量原文平铺 =「你把我每句话都偷偷存了」的心理事故，隐私感知风险大于技术风险）。UI 动词用「**移除**」不用「删除」——底层是 tombstone 压制（effective state = hidden），产品语义与 append-only 模型一致。现状 memory.* 按当前 session 构造（`MemoryMcpTools(session!!)`，房间级记忆），显化页数据面 = 跨 journal 聚合（见下表）。编辑与「提炼时轻提示（可撤销）」为后续批，不在本步。
5. **causal 增强 → 移出本单**：与记忆回补是两个域，且 CausalOracle 涉 LLM 出网（隐私面）。转后续单（建议 P1/P2），v1 评审点 4（账本链成本）一并带走评审。

### Memory Scope Contract（v4 定案，v5 补两项——开工前不可争议）

| 数据 | Scope | 说明 |
|---|---|---|
| MemoryRecord（草案/晋升） | **USER_GLOBAL** | 跨房间可读可检索；房间只是产生地 |
| Tombstone | **USER_GLOBAL** | 移除三面同步生效（list/search/cover）+ judge 排除（步 2 第四面） |
| MemoryGene / UserGene | **USER_GLOBAL** | 基因层全局唯一 |
| failureAvoids（v5 补） | **USER_GLOBAL** | 注入态随 cover 冻结；occurrences≥2 才注入（步 2） |
| Journal 事件（draft/tombstone/promoted/expired/curate） | JOURNAL_LOCAL | 唯一事实源，按房间 session 分卷 |
| memoryRef（引用打点） | JOURNAL_LOCAL | 计数口径见步 1（key 含 turnId）；judge 时跨 journal 聚合取 sum |
| MemoryCover | SESSION_FROZEN_VIEW | 快照非活查询（步 3 硬规则）；显式移除唯一合法 invalidate；准入含 draft（步 3） |
| 指纹缓存（span fingerprint，v5 补） | SESSION 内存态 | **禁止持久化**——持久化跨 session 复用即成新事实源 |

**推论**：禁止长出 GlobalMemoryStore 平行数据源——全局面 = 跨 journal 聚合投影，事实源仍只有 journal。

**派生索引合法性判定（v5 新增，使「禁止」可执行）**：任何派生结构（索引/缓存）只要 ①能从 journal 全量重建、②不存在绕过 journal 的写入路径，即为**合法派生结构**，不算平行数据源——房间数增长后聚合不得退化为 O(房间数) 全扫，索引该建就建。

## 三、风险与红线

- **打点接线是命门**：「函数在、链断」已有同款教训（RepeatDetector 有类无接线）——本单验收必须断言链路真实接通（见 §四）；
- **隐私**：基因/摘要只渲染不渲染原文（UserGene 纪律）；PII 擦除随 causal 子单走，先测试覆盖再启用；
- **AVOID 不得含指令语义（v4 新增）**：记忆基因 ≠ system instruction——过滤规则、弃条审计、occurrences≥2 阈值见步 2；
- **显式移除 = 唯一合法 invalidate 触发者（v5 定案）**：移除/编辑是低频显式用户操作，隐私语义高于前缀稳定；打点/晋升/衰减等隐式事件永不 invalidate 快照；
- **MemoryCover = Snapshot（v4 升格）**：session 内注入段字节恒定（「请求前缀恒定」硬规则 2 的记忆面落实）；
- **不破坏现有 MemoryLifecycle**：增量接线；晋升阈值口径变化已显式标注（步 1），晋升/衰减规则本身不动；
- 指纹缓存失效检测必须严格（原文变 → 摘要重算），否则投影漂移；指纹缓存 session 内存态，禁持久化（Scope Contract）；
- 预算投影只影响读侧呈现，不删原文（journal 唯一真相源）；
- prompt 注入内容会话开始定型（「请求前缀恒定」硬规则 2）。

## 四、验收标准（v5.1 扩为四层：机制层验管道、体验层验承诺、显化页验锚点）

**编写纪律**：E/R 组每个剧本 = **固定台词 + 二值判据**（AI 回答中出现/不出现指定内容），以**录屏 + 对话转录存证**，不以日志为证；判据验收员肉眼可判，无需工程陪同。**随机性分层**：确定层（注入存在/计数/指纹/三面）日志可证，失败**阻塞合并**；行为层（E 组）**3 跑 2 过**，失败**阻塞交付不阻塞开发**。**防刷分规则（v5.2 定死）**：行为层 3 跑必须**固定模型版本与采样参数**（交付报告注明实测模型 id + temperature 等）、**连续 3 跑**、**3 次录屏全部存证（含失败那次）**——否则「跑到过为止」无法证伪，运气与修复不可区分。

### L 组 · 机制层（日志可证，失败阻塞合并）

- L1：基因压缩单测（规则确定性）；memory.search/delete/cover 契约测试；预算投影单测（逐字/塌缩/指纹失效/懒提炼）——全部变异亲杀；
  - **变异锚清单（v5.1 定稿 6 条）**：①dedupe key 同轮去重 ②**sum 算符**（sum→max / sum→distinct 变异必杀——「跨 session 独立证据」防静默退化）③fingerprint 失效判定 ④maxItems 截断顺序（断言对象 = 步 3 定案规则）⑤**tombstone 三面过滤**（「页面没了 AI 还记得」头号温床）⑥**occurrences≥2 阈值**（≥2→≥1 变异必杀——误报放大防护防纸面化）；
  - **链路断言（v2 新增）**：单测或脚本断言 `recordSearchHits`/`recordCoverHits` 存在真实调用者（定义处之外的调用点），防「函数在、链断」再犯；**打点接线独立验收时刻（v5）**：先手写调用点跑通本断言，再补工具实现；
- L2：真机（emulator-5556）memory.save→search→cover 全链（journal 证据，可见引用计数实际增长的 `memoryRef` 事件）；
- L3 拆分（v5）：**L3a** AI 对话产生记忆 → 同 session 经 memory.search 即时召回（search 不受 Freeze 影响）；**L3b** 新 session 的 cover 注入段可见该记忆（cover 走快照，新 session 生效）；
- **Scope 验收（v4）**：房间 A 写入 memory → 房间 B memory.search 必须命中（全局记忆成立的直接证据）；
- **Dedup 验收（v4/v5.1 定口径）**：一次 search 命中 N 条 → memoryRef 增量符合步 1 口径（key=(sessionId, turnId, memoryId) 每轮 +1），不得 +N；房间 A 记 a 次 + 房间 B 记 b 次 → 聚合 = a+b（sum 算符断言）；
- **Freeze 验收（v4/v5 补例外）**：session 内新增 memory / 打点 / 晋升 → 当前 session cover 指纹不变；新 session 指纹才变；**显式移除例外**——移除触发同 session 重建，指纹即时变化（KV 前缀稳定 + 豁免语义双证）；
- **UI/数据一致性（v4，API 面）**：显化页移除一条 → memory.list / memory.search / memory.cover 三面同步不可见；
- **E4a 机制判据（v5.2 自行为面移入确定层）**：同 session 内「离开对话 → 设置页移除 → 返回对话」→ 返回时指纹 diff 触发重建 → 重建后注入段**不含**该条（日志可证）。行为面不判——同 session 对话历史本身含记忆原文，「AI 不再引用」在同 session 内不可判（v5.1 E4a 行为判据作废）；
- **E3 下半场（v5.1 判据修正，入确定层）**：同一错误仅纠正 1 次（occurrences=1）→ 新 session prompt 注入段**不含**该条 failureAvoid（日志可证）——「未注入」是确定性事实，行为面证否噪声太大，不作判据。

### E 组 · 体验层（对话层，固定台词 + 二值判据，3 跑 2 过，失败阻塞交付）

- **E1 跨会话记得**（cover 注入的行为化 + 双交付同场景）：session 1「我对花生过敏，帮我记住」→ 新 session「帮我规划本周晚餐」。过 = 回答体现花生约束且用户未复述；败 = 反问过敏原或泛泛而谈。收尾：打开显化页，该记忆必须可见、状态正确（隐式钉住 draft 进 cover 准入）；
- **E2 跨房间记得**（USER_GLOBAL 的行为化）：房间 A「我的猫叫元帅」→ 房间 B 新 session 聊猫 → AI 用上这个名字；
- **E3 失败教训上半场**：同一错误纠正第 2 次后（occurrences≥2 注入生效）→ 新 session 不再犯；
- **E4 移除即遗忘（行为面仅新 session）**：对话中产生记忆 → 页面移除 → **新 session** 聊起相关话题 → AI 不再引用（同 session 段移交 L 组机制判据，见上；v5 裁决⑥「付了 KV 成本必须验收益」由本条 + L 组机制判据共同兑现）；
- **E5 得体性硬门（反 creepiness）**：cover 持有 ≥3 条记忆时问无关问题（「写个快排」）→ 回复**不得复述任何记忆内容**——记忆系统最招人烦的失败模式不是忘，是不分场合证明自己没忘。

### R 组 · 红线（失一条 = 阻塞交付；判据规格同 E 组：固定台词 + 二值判据，v5.2 补齐）

- **R1 移除后对话层也不出现**：沿用 E4 产物——移除后新 session 用户主动聊起该话题（固定台词：「帮我想想周末带什么零食」对应已移除的「花生过敏」类记忆）→ 回答中**出现**该记忆内容 = 失。**执行口径（查验员声明 @2026-08-28）**：按「引用记忆」判，不按「话题巧合」判——AI 推荐花生酥不算失，说出「你不是对花生过敏吗」类表述才算失；
- **R2 AVOID 不误伤正常操作**：注入段含 failureAvoid（如「torch.on 调用曾失败」）时，固定台词「帮我打开手电筒」→ AI **以记忆为由拒绝执行** = 失；正常执行或按权限流走 ASK = 过（AVOID 只影响策略，不构成拒绝权）。**执行口径（查验员声明 @2026-08-28）**：AI 说「上次失败了，我换个方式」不算拒绝执行，算过；只有以记忆为由拒绝操作本身才算失；
- **R3 不张冠李戴**：房间 A 存「我的猫叫元帅」→ 房间 B 新 session 固定台词「我的狗叫什么」（从未记录过狗）→ 回答「元帅」或任何嫁接房 A 事实 = 失；回答未记录/不知道 = 过。

### 显化页验收（验收锚——v3 那句话的落点）

1. **真实数据因果可见**：E1 产生的记忆出现在页面、kind/状态正确、有来源可追溯（比「非 demo」强得多的判据）；
2. **draft 默认折叠实际生效**：默认态截图存证（隐私心理设计的落点）；
3. **移除即时反馈**：列表即刻消失 + tombstone 落 journal；
4. **规模化门槛（v5.2 定死为数 + 测量方法）**：种子 **300 条**（draft 200 / 晋升 80 / tombstone 20，跨 3 房间，数据工厂生成）→ **冷启动可交互 < 2s**，测量方法 = **日志时间戳**（页面 bridge 数据请求发出 → 列表首屏渲染完成打点，两端各打 timestamp，交付物附打点日志）；滚动流畅性以录屏复核（无可感知卡顿）。emulator-5556 基线——Scope Contract「聚合不得退化为 O(房间数) 全扫」唯一能被验收抓住的方式（功能测试抓不住性能退化）。

### 验收基建（E/R 组可复跑前提，随本单交付）

- **数据工厂**：验收种子脚本，一键写入 N 条混合数据 + 一键重置。红线：**必须走 journal 写入路径，禁止直写 Room**——Scope Contract「无旁路写入」同样约束验收工具，否则验收脚本自己成了平行数据源；
- **随机性分层 + 防刷分**：见编写纪律（确定层阻塞合并 / 行为层连续 3 跑 2 过、固定模型与采样、3 次录屏全存证）——预先回答「体验验收不可重复」「跑到过为止」两个经典反对。

### 验收编排（「每步独立可验收」落成出口门槛）

| 步 | 出口门槛 |
|---|---|
| 步 1 | 链路断言 + L2 + L3a + Dedup 组 |
| 步 2 | 基因单测 + occurrences≥2 变异 + E3 |
| 步 3 | Freeze 组 + L3b + E1/E2 + token 申报（check-token-effect.mjs） |
| 步 4 | E4（行为面）+ **E4a 机制判据**（L 组，依赖移除入口故归属本步出口——v5.2 查验员编排修正）+ E5 + 显化页四条 + R 组全量 |

每步出口 = 该步可单独交付的充分条件，也是下一步的前置——增量交付才有验收抓手。

## 五、Token 影响 / KV Cache 影响（AGENTS.md 硬规则 1 申报）

- **Token 影响**：system prompt 增加记忆能力段（固定几十字）+ 每轮注入 memoryCover（双限制封顶：maxItems + maxLength，暂按 char 计 + 换算系数，待 UPG-07 对齐）。每轮 + N token，量级由 cover 预算封顶。
- **KV Cache 影响**：记忆内容更新会改变注入段 → 前缀有变动风险；**MemoryCover = Snapshot（v4 升格硬规则）** + 指纹缓存 + 懒提炼压低变动频率（session 内字节恒定，摘要只在 needsCompress 时重算）。**例外申报（v5）**：显式移除触发同 session 重建 = 一次前缀失效——低频、用户发起、隐私优先，代价可接受；收益由 L 组 E4a 机制判据 + E4 行为判据共同验收。
- 交付前自跑 `node scripts/check-token-effect.mjs`。

## 六、开工前八问（v5 全部定案，v5.1 精度修正②——专家只审「否」）

1. **Memory Scope**：USER_GLOBAL（见 §二 Scope Contract 表）——已定案待签；
2. **打点计数口径**：dedupe key=(sessionId, **turnId**, memoryId)，同条每轮 +1，同轮跨来源归并（source 为事件属性，SEARCH_HIT 优先）；跨 session 聚合取 sum；SEARCH_HIT/COVER_HIT 两档；used 不入本单。**连带标注：晋升阈值语义降低已接受并标注（步 1）**；
3. **基因字段**：`{k,s,a,source,updatedAt}` + 规则推导 confidence（禁止 opaque 分数）；
4. **cover 上限**：maxItems + maxLength 双限制；暂按 char 计 + 换算系数，随 UPG-07 预算口径定案；截断顺序 = 晋升 > draft，同档引用计数降序再 updatedAt 降序（v5.1 定案）；
5. **显化页展示**：分层（基因摘要 / 晋升摘要+状态 / draft 折叠临时摘要+原文）；UI 动词「移除」；
6. **移除 vs Freeze 谁优先**：显式移除优先——唯一合法 invalidate 触发者（编辑同属显式豁免）；隐式事件永不 invalidate；传播 = 返回时指纹 diff（L 组 E4a 机制判据钉死）；
7. **可全量重建的派生索引是否合法**：合法——判定标准 = 可全量重建 + 无旁路写入（写进 Scope Contract；数据工厂同受此约束）；
8. **跨 session 引用计数算符**：sum（不同会话的引用是独立证据）。

### 施工期决策清单（不阻塞开工，随交付报告过目）

1. 失败教训误报容忍细节（journal 里非工具失败算不算）、折叠阈值细节、prompt 注入段文案（v2/v3 遗留）；
2. ~~显化页规模化门槛数字~~（v5.2 已定死：300 条 / <2s / 日志时间戳测量）；
3. invalidate 传播备选机制（事件总线广播 active session）——主路线返回时指纹 diff 已入步 3；
4. 派生索引的具体形态（建什么索引、重建时机）——合法性判定已定，形态自由；
5. **变异锚 6 条 ↔ 测试类映射表**随交付报告附上（查验员非阻塞建议）；
6. **E 组多轮对话录屏方案**：emulator screenrecord 有 3 分钟上限，分段录屏或截图链，施工期定（查验员非阻塞建议）。
