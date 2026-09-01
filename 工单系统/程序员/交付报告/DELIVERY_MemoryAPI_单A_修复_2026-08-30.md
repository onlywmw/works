# UPG-27 单A · Memory API 边界契约修复（P1+monitor 假绿）—— 2026-08-30

- 分支：feat/ai-model-ui @ **0aa0c07**（rebase origin/main 7992904——单1 已合 main ca0e490；本分支仅单A 差异）
- 审验打回：❌ P1 边界违例 + boundary ②③ 假绿 → 本修复交付
- 报告：DELIVERY_MemoryAPI_单A_修复_2026-08-30.md；两表已登记

## P1 · 边界违例修复（呈现层零触 memory-core）

**病灶**：MainActivity:582/597/598 全限定名直引 `com.hermes.mov.memory.core.MemoryStore/MemoryStatus`（api 依赖 core 使编译面可见，被直引）。

**修复**（两步架构化，非局部删引）：
1. **门面工厂** `MemoryApiService.create(baseDir)` —— core 装配（MemoryStore/PinnedStore/ChangeLog）移进 api 包内部；呈现层唯一取实例入口
2. **SeedEntry.status 净化** —— 由 core 枚举 `MemoryStatus` 改为 **API 术语字符串**（"DRAFT"/"ACTIVE"/"TOMBSTONE"）；api 内部 when 转换

**效果**：`grep com.hermes.mov.memory.core app/src/main` = **零命中**（含 MainActivity）；呈现层仅触 api 类型。

**P1 变异亲杀**：MainActivity 注入 `com.hermes.mov.memory.core.MemoryStore(...)` 直引 → **boundary ② 红**（复验后恢复→绿）。

## boundary ② 假绿修复

- 旧：`File("app/src/main")`（workingDir=app/ 不存在→walk 空→恒绿）
- 新：路径基准探测（`../app/src/main` 或 `src/main` **真实存在才扫描**，不存在直接断言失败）+ `com.hermes.mov.memory.core` 全量零命中

## boundary ③ 假绿修复

- 旧：`File("memory-core/...")` 不存在→豁免逻辑排除全部 3 个 core 文件（全含「零 Android 依赖」注释）→ 恒绿
- 新：`../memory-core/src/main/kotlin` 真实路径；**豁免收窄=仅注释行**（`//` `/*` `*` 行首）——注释外出现 `android.`/`import android.` = 真实违例
- **豁免验证**：注释行变体（`// MUTANT: val x = android.util.Log`）→ **不红**（注释豁免正确）；**非注释变体**（`Class.forName("android.util.Log")` 字符串引用）→ **boundary ③ 红**（真实违例不豁免）→ 均复验后恢复

## 复验（真绿，非假绿）
- boundary ② ③：**3/0**（含路径存在断言——不存在即红，杜绝假绿）
- 契约回归：memory-core **8/0** + memory-api **14/0**（工厂/SeedEntry 净化后全链仍绿——Envelope/状态机/changes/置顶/分页/facets/自愈/竞态/锚③）
- 全量：app 62 类 **446/0/0** + assembleDebug 绿（**468 用例 0 失败**）
- Token/KV：0/0

## 待合 main 前置检查
- rebase origin/main 7992904 ✓；与 main 零冲突 ✓；单1（合清）差异保留 ✓
- borrow 契约红线：pin 只经门面（PinnedStore 内部）✓；boundary 真绿 ✓

## 移交
- 报告 + 两表登记；待审验员复核（boundary 3 绿 + P1 变异红日志）
