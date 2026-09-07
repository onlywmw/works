# UPG-05 记忆体系回补（基因化 + memory.* 工具接线 + 预算投影）· 方案设计

> 设计人：设计师 ｜ 日期：2026-08-26 ｜ 优先级：P0 ｜ 状态：✅ 方案完成，**待专家审**
> 依据：老版 `agent/MemoryGeneCompactor.java`、`agent/UserGene.java`、`agent/Journal.java`、`causal/`（14 文件）逐行核实；新版差异经全库 grep 确认

---

## 一、问题（实测证据）

新版 `memory/MemoryLifecycle.kt` 已移植「引用≥2 晋升 / 14 天零引用衰减 / 幂等 curate」骨架，但**记忆链是断的**：

| 缺失项 | 老版证据 | 新版现状 |
|---|---|---|
| 记忆基因化 | `MemoryGeneCompactor.java:21-136`（纯规则压缩 `{k关键词 s策略 aAVOID}`，零 LLM） | 全库无（仅 Lifecycle 引用计数） |
| 失败教训自动提取 | `:138-167`（扫 journal fail 事件 + `tool_result(ok=false)` 提取 avoid） | 无 |
| 用户画像基因 | `UserGene.java:16-87`（隐私纪律：只渲染基因不渲染原文） | 无 |
| memory.* 工具接线 | `memory.load/save/search/delete/cover/list` | **仅权限名单字符串**（`McpToolScheduler.kt:103`），无实现——记忆功能实际断线 |
| 预算覆盖投影 | `Journal.java:1324-1371`（新记忆逐字、旧记忆塌缩成指纹摘要 `[f:hash]`、`needsCompress` 懒提炼、原文永不丢） | 无 |
| causal 增强 | `causal/` 14 文件（规则活性/指数衰减、Oracle、叙事、PII 擦除、账本链审计 `:147-157`） | 仅 `Causal.kt`+`CausalEngine.kt`（注明"简化"），无活性/衰减/Oracle/擦除 |

**影响**：MemoryLifecycle 的"引用证据"没有工具打点 → 晋升无源；基因/AVOID 缺失 → 每次对话从零开始；预算投影缺失 → 长上下文压缩粗糙。

## 二、迁移方案（4 步，每步独立可验收）

1. **基因层移植**：`MemoryGene` / `UserGene` / `MemoryGeneCompactor`（纯规则、JVM 可测）→ 接入 MemoryLifecycle 的 curate 钩子（晋升时产基因）；`failureAvoids` 挂进 journal 事件流（fail/ok=false 扫描）
2. **memory.\* 工具接线**：实现并注册 `memory.load/save/search/delete/cover/list`（复用 Lifecycle + RoomStore），sandbox 红线不变；权限名单按现有分级（save=写类 ASK，search=无害）
3. **预算覆盖投影**：memoryCover 逐字/塌缩两级 + span 指纹缓存 + `needsCompress` 后懒提炼（原文只存一处）
4. **causal 增强**（可分拆子单）：规则活性集加载 + freshness 指数衰减；PII 擦除（name/phone/address 先测再上）；账本链审计

## 三、风险与红线

- **隐私**：基因/摘要**只渲染不渲染原文**（UserGene 纪律）；PII 擦除先测试覆盖再启用
- **不破坏现有 MemoryLifecycle**：= 增量接线，不改晋升/衰减语义
- 指纹缓存失效检测必须严格（原文变 → 摘要重算），否则投影漂移
- 预算投影只影响**读侧呈现**，不删原文（journal 唯一真相源）

## 四、验收标准

- L1：基因压缩单测（规则确定性）；memory.* 工具契约测试；预算投影单测（逐字/塌缩/指纹失效/懒提炼）——全部变异亲杀
- L2：真机（emulator-5556）memory.save→search→cover 全链（journal 证据）
- L3：AI 对话产生记忆 → 下一轮可召回（journal 有 memory 工具真实 tool_call）

## 五、专家评审点

1. 基因 `{k,s,a}` 三字段是否够用？AVOID 注入优先级/上限（防注入污染）
2. 失败教训自动提取的**误报容忍**（journal 里非工具失败也算吗？）
3. memory.cover 折叠阈值（多少条/多少 token 开始塌缩）
4. causal 账本审计链是否值得（成本 vs 可信度）
5. 推荐实施顺序：1+2（记忆能"用"）→ 3（体验）→ 4（深度）
