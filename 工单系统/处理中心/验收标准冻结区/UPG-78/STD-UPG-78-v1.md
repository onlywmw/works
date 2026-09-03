# STD-UPG-78-v1 验收标准冻结版

> 工单：UPG-78 ｜ 标题：生成器派生项入库保鲜 + CI diff=0 门禁（ApprovalRegistry 系）｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-78-v1`
- **content_sha256**: `26266fe8bc20830cc3117e871116255bc91e2962f7a74f5d9f543dbcf9417670`
- **frozen_at**: `2026-09-03T05:20:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

> ⚠️ 冻结区填完、content_sha256 回填后，**冻结区任何改动都视为标准变更**，只能走修订派生 v2，不得原地改。

---

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L2 中 | 构建/CI 工具链 → 亲跑复现 + 门禁注入亲杀 | ① 干净环境（删 `app/build/inventory` 或干净 clone）全量 `testDebugUnitTest` 绿——不再依赖手工先跑 collect；② upg68-registry.yml 新增 diff=0 门禁：生成物（`docs/ApprovalRegistry.json`/`docs/ApprovalRegistry.md`/`PermissionRegistryData.kt`）漂移即红；③ 全量测试连续两跑后三生成物 git status 零 M（污染源结构性消除） |

### 亲杀锚

| 锚点 | 动作 | 期望 |
|---|---|---|
| A1 断链复现 | 删 `app/build/inventory/tools.txt` 后跑 `ApprovalRegistryGeneratorTest`（模拟干净环境） | 修复前=红（断链实证）；修复后同路径=绿（自供电实证） |
| A2 门禁注入 | 改一个 handler 登记面不重跑生成器（或直接改生成物一行）→ 本地复演门禁命令 | `git diff --exit-code`（限定三生成物路径）非 0 退出；恢复后=0 |
| A3 污染回归 | 全量 `testDebugUnitTest --rerun-tasks` 连跑两遍 | 两遍后 `git status` 三生成物均无 M（md5 前后一致） |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 全量回归 | `testDebugUnitTest --rerun-tasks` 真跑绿（计数如实，基线预存 2 失败 AppearanceContractTest 沿用申报口径）——且在**删除 build/inventory 后**同样绿 |
| 定向 | `ApprovalRegistryGeneratorTest` 绿；`approval-registry-verify.mjs`/`single-channel-check.mjs` 零回归 |
| 构建 | `:app:assembleDebug` 绿 |
| 证据链 | A1 断链复现红→绿命令输出 + A2 门禁注入非 0 输出 + A3 两跑后 git status/md5 对账输出（均含时间戳） |

### 销项条件（本单「合格」= 下列全满足）

- [ ] `ApprovalRegistryGeneratorTest` 不再依赖「手工先跑 collect」：build 依赖挂接（gradle 任务+dependsOn）或测试内自生成，二选一落地，干净环境全量绿（A1 实证）
- [ ] `upg68-registry.yml` 在生成器测试+verify 之后新增 `git diff --exit-code` 门禁步（路径限定三生成物），A2 注入亲杀非 0 实证
- [ ] 全量连跑两遍后三生成物零 M（A3 实证）；UPG-75/76 同款「交付前手工还原」在交付报告声明不再发生
- [ ] 既有门禁零回归：collect/verify/single-channel 三脚本输出正常；upg70-catalog.yml 不受影响
- [ ] 交付报告含 Token/KV Cache 两节（本单预期 0/0，零请求链路）

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | 合并单：挂账-upg50-CI门禁断链tools.txt（P2）+ 挂账-生成器产物漂移防护 + UPG-75/76 交付④「生成器污染已还原、根治待派生项入库+CI diff=0」；范围边界：C7 基线测试非确定性（另挂账）与 ui-components 目录（UPG-70 已有同款门禁）不在本单 |

---

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-78-v1.md"
```
