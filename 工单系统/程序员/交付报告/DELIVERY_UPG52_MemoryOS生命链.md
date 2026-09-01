# DELIVERY_UPG52_MemoryOS生命链

- **工单**：UPG-52（Memory OS 生命链 · 用户拍板拆 3 子单一次全做）
- **分支**：`feat/upg52`（worktree=mov-upg52，基线 0aa0c07）
- **状态**：✅C 交付 @2026-08-31 —— 待验收员 L2 复核

---

## 一、范围（对齐 Memory OS 设计 v2 §五/§六/§七 + v1 §九验收）

| 子单 | 内容 | 落点 |
|---|---|---|
| **52-1 生命周期 + Semantic** | MD 分篇池（frontmatter JSON 权威行 `<!-- meta:{...} -->` + `_index.json` 派生索引）+ 三表（TYPE_DECAY_DAYS / ConflictDetector 同型互斥 / 语义状态机）+ **Decay≠Truth Change**（decay/冲突只产 RE_EVALUATE，绝不直接 ARCHIVED）+ blockedSourceHashes 删除传播（P0-5）+ purge（人类触发） | `memory-os/.../semantic/` |
| **52-2 Timeline** | Memory History Ledger：`MemoryTimelineEntry{id,timestamp,eventType,subject,payload,actor,sourceIds,reason,previousMemoryId,correlationId}`；**append-only**（只有 append/read/purge，无 update/delete）；**actor 权限**（user 全量 / ai-proposal 只 PROPOSED / system-decay 只 REEVALUATED+ARCHIVED）；**Correction=追加新条不改旧**；**原子写入**（Semantic 变 ⇒ 同调用内 ledger append；失败=语义回滚） | `memory-os/.../timeline/` |
| **52-3 Retrieval** | Memory Core（≤4KB **只读投影**，Semantic ACTIVE 派生、可重建、非双写）+ importance 与 confidence/freshness 分离（评分=Relevance×Importance×Confidence×Freshness×Context，权重参数化）+ 路径 Intent→Topic→Tags→Importance→Freshness→Top-K + 8KB 预算裁剪 + Router 分层路径 + **来源标注 why**（importance/confidence/freshness） | `memory-os/.../retrieval/` |

## 二、工程实现

- 新 gradle 模块 **`memory-os`**（JVM library；依赖 memory-api 门面；**零触 memory-core 类型**——boundary 测试锚 E）
- `settings.gradle.kts` include；`app/build.gradle.kts` implementation
- `MainActivity.kt`：初始化（files/memory-os：ledger.jsonl + semantic/）+ handlers：
  - 只读面：`memoryos.core` / `memoryos.retrieve`（hits+why+budgetCut） / `memoryos.timeline`（subject 过滤+50） / `memoryos.semanticList`
  - 主链回放 `memoryos.devRun`（propose→accept→diagnose→resolve→retrieve→timeline；**表演语义=user**——仅测试/验收演示，不替代生产用户确认面；生产确认 UI 接缝=UPG-49 合流后）
- 变更面（accept/reject/resolve）**不注册为 AI 可调工具**（P0-3：人确认才动库）

## 三、证据

### 测试（L3 契约全绿）
- **全量 473 用例 0 失败**（app 446？+ memory-os 27，计 473/0）
- memory-os 27 用例分布：
  - SemanticLifecycleTest 9（状态机/采纳/同型冲突/Decay 只 RE_EVALUATE/裁决/删除传播/purge/拒绝/Freshness 派生/冲突检测）
  - TimelineLedgerTest 5（append-only/actor AI 权限/system 权限/Correction/purge/序列化往返）+ AtomicWriteTest 2（变更必有 Timeline / Timeline 失败回滚）
  - RetrievalServiceTest 6（Core 只 ACTIVE≤4KB/检索只读/Top-K 预算/blocked 不参与/评分/Router）
  - MemoryOsBoundaryTest 2（零触 core 类型 / memory-api 面存在）
  - MemoryOsLifecycleIntegrationTest 2（**主链回放**：PROPOSED→ACCEPTED→REEVALUATED→裁决→检索命中+来源→Timeline 4 条独立 id；**空库零影响**）
- **变异亲杀 6/6**：
  | 锚 | 变异 | 捕获 |
  |---|---|---|
  | A | purge 不删 blocked | 「删除传播」红 |
  | B1 | AI 放行写 ACCEPTED | 「actor 权限」红 |
  | B2 | Timeline 失败不回滚 | 「原子回滚」红 |
  | C | 预算 8KB→8MB | 「Top-K 预算裁剪」红 |
  | D | decay 直接 ARCHIVED | 「Decay 只 RE_EVALUATE」红 |
  | E | memory-core 类型 import | 「boundary 隔离」红 |

### 模拟器 L2（emulator-5554；设计师占用真机）
1. 安装 + 启动 → logcat：`UPG52: Memory OS 初始化 ok dir=/data/user/0/com.mov.android/files/memory-os`
2. `files/memory-os/semantic/` 目录建立；无记忆时（ledger 无条目=append 前不落盘）主界面正常——**空库零影响** ✓
3. 主链回放=JVM 集成测试（模拟器无 AI key，对话触发不可用；等价链全绿如上）

## 四、申报差异

- **UI 接缝**：设计 §5.4「UI 只看 ✓/◇、无 confidence/decay 数字」+ §六「时间线只读页」+ §七「对话检索上下文」——呈现层依赖 UPG-49（记忆页）尚未合入本基线；本单交付**数据/规则/检索层**（52 全部触发器=handler/devRun），呈现由 UPG-49 合流后接（记忆页详情/时间线接缝已留：`memoryos.timeline`/`memoryos.retrieve` 只读面）。
- **② Event Store + Pattern Detection 后置**（设计落地序②）：「看剧→Event」等 8 路径中的 Event 源依赖后置项——以「记忆条目（Memory API）=候选源」先行（P0-3 语义一致：AI 只 PROPOSED，人采纳才 ACTIVE）。
- **生肖/农历等**不涉及；**Token/隐私**：本单零网络上传、零 sk- 新增（`git grep sk-` 自查零命中）、本地加密存储沿用（数据为结构化标签/账本，无原文泄露面——核心安全面=只读投影+去标识视图由 52-3/51 闸保证）。
- **基线注记**：停靠 0aa0c07（绿）；main 已前进至 UPG-51 合入链（e249c61+c63ac33+185e0d9）——**合 main 前需 rebase**（52 与 51 无文件冲突：51 是 personalization 模块，52 是 memory-os 模块+MainActivity 各自 handler 段——预期平滑）。

## 五、验收建议口径（v1 §九 A-E）

- A（删除复活屏蔽）：SemanticStore.blockSourceHashes/purgeBlocked + Retrieval blocked 过滤（变异 A 已锁）
- B（Timeline 不可变/actor/Correction/原子）：TimelineLedger（变异 B1/B2 已锁）+ AtomicWriteTest
- C（检索只读/Router/预算/来源/Index·Core 派生）：RetrievalService + SemanticStore._index.json 派生（变异 C 已锁；Core 重建=每次 coreProjection 现算）
- D（生命周期/冲突/类型/Decay≠Truth/freshness 派生）：SemanticEntry 三表 + diagnose（变异 D 已锁）
- E（三层隔离 memory-api 零改）：boundary 测试（变异 E 已锁）；本单未修改 memory-api/memory-core 一行
- L2 8 路径：本单覆盖 ②③④⑤⑥（候选→采纳→关于我.md / 旧偏好◌裁决 / 时间线只读 / 检索少而准可解释 / 历史信道）——①⑦⑧ 依赖后置/UI 接缝（见申报差异）；验证通道=devRun（真机可经对话触发，模拟器 JVM 等价链）

## 六、git

```
feat/upg52（push origin）
- commit: feat(upg52): Memory OS 生命链——52-1 Semantic+生命周期 / 52-2 Timeline 账本 / 52-3 Retrieval
```
