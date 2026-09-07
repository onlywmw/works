# UPG-59 B线蒸馏MVP —— 审验员模拟器复验记录（2026-08-31）

验收对象：feat/upg59 = 8da2907（基底 8bcc167=main 顶，rebase 零负担声明成立）
**约束：用户指令「直接开虚拟机审验，不要动真机」——全程未动真机**
复验 APK：assembleDebug（8da2907 源码产物，55,588,170B，UP-TO-DATE=源码无新于产物）装 emulator-5554

## 一、L1 独立重跑（权威重跑）

- 全量 `:app:testDebugUnitTest --rerun-tasks` = **73 套件 519/0/0，skipped=1**（SceneLiveQueryTest 类级 @Ignore 真网络测试）
- DistillerTest = **9/0 全绿** / LessonPoolTest = **6/0 全绿** / SecurityCenterTest = **9/0 全绿**（既有零回归）
- 与验收报告完全吻合（73/519/0/0）

## 二、变异亲杀 3/3（独立复跑，md5 校验还原零残留）

| 变异 | 注入 | 结果 |
|---|---|---|
| V4 | LessonInjector.select 去 `status==ACTIVE` 过滤（恒全量候选） | 「B5 PROPOSED低confidence教训不进注入面」+「B7 registryHash变更 自动降RE_EVALUATE」**双红**（LessonPoolTest:58/:103） |
| V3b | LessonDistiller 加 `applyLessons(pool: SemanticPoolService)` 写入口 | 「B8 蒸馏器输出纯数据无写入口」**反射锚红**（DistillerTest:155） |
| 配额2 | LessonInjector.select 去 `selected.size < maxLessons` 条数上限（只留字节预算） | 「配额硬上限 3条与字节预算 超配额落库不进prompt」**红**（LessonPoolTest:132） |

还原后 md5：LessonInjector 4e851f90… / LessonDistiller 914f7f56…（与原始一致）；两测试类复跑全绿。

## 三、L2 增强面（验收声明可选未做 → 审验员轻量运行验证补足「运行不崩」）

### 1. 安装与冷启动
- `adb install -r app-debug.apk`（55,588,170B）Success
- 冷启动 PrivacyGateActivity（唯一 LAUNCHER）→ 注入 privacy_agreed_v2=true + mov_login token → 拒绝通知权限 → **主界面在场**（uiautomator dump：「新会话 / Deepseek V4 / MCP 工具 / 我的能力 / 我的订单 / MOV AI 发消息 / 内容由 AI 生成」）
- 进程存活 pidof=com.mov.android，无 FATAL EXCEPTION

### 2. memory-os 池初始化（注入段运行依赖）
- `files/memory-os/semantic/` 目录建立（SemanticPoolFactory.create 路径活）
- logcat「UPG52: Memory OS 初始化 ok dir=/data/user/0/com.mov.android/files/memory-os」逐字吻合
- 注入段 crossSessionLessonSegment（MainActivity:4597-4608）runCatching 兜底——初始化 + 注入路径不崩

### 3. 完整对话注入 = OBSERVABILITY ONLY（同验收声明）
- 模拟器未配 DeepSeek API Key → AI 对话发送失败（同 UPG-53/54 环境限制）
- 首次空教训池无可见注入产物——端到端机制链已由 JVM 层 LessonPoolTest B6 全锚（真实 memory-os 池 + TimelineLedger 临时目录）
- MCP 网关 8389 本次未监听（app 内服务未随启动路径拉起，非本单功能面；工具面 registryHash 输入=mcpHandlers.keys 内存 map 不依赖端口）

## 四、代码核物（6 主项 + 接线 + 指定复核，全部坐实）

- ①三分类：classify() guard/fabricate_hit→FABRICATED(0.9)；isError+RETRYABLE_PATTERN→RETRYABLE 不产教训；isError→NON_RETRYABLE(0.5)；同工具+同错误聚合 occurrences
- ②六字段 fail-closed：LessonCandidate init require 全字段（B4 7 拒绝用例）
- ③confidence 分层：LessonInjector 只选 ACTIVE（B5 PROPOSED 不进注入面）
- ④配额：MAX_LESSONS=3 + DEFAULT_BUDGET_BYTES=600 + 排序 confidence↓updatedAt↓id↑ + overflowed 只落库 + render 恒定前缀
- ⑤过期机制：reevaluateLessonsBySourceHash（ACTIVE+sourceHashes 不含当前→RE_EVALUATE，system-decay）+ MainActivity:4600 注入前扫描 + LESSON decay=0
- ⑥互斥豁免：SemanticPoolService mutualExclusive = type!="LESSON"
- 接线：crossSessionLessonSegment 拼基因注入段末（:4583）+ registryHash(mcpHandlers.keys) sha1 顺序无关
- 指定复核：B-2 evidence 行号逐行回溯原始 JSONL（lines=4,6）；B-6 端到端 A→B 会话注入含教训 + seg==seg2 前缀恒定；LESSON 豁免 5 条全 ACTIVE

## 五、审验提示

1. **rebase 零负担确认**：基底 8bcc167=main 顶；main 自 8bcc167 仅加验收落档 4bce784——与验收「基底 main 顶」声明一致
2. MCP 网关 8389 本次未监听（app 服务未随启动拉起）——非本单功能面，蒸馏/注入纯 JVM 机制结论不受影响
3. 首次空教训池：注入段无可见产物属正常（B6 已在 JVM 全锚）
