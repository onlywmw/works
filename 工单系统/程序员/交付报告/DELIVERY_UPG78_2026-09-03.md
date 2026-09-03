# DELIVERY UPG-78 · 生成器派生项入库保鲜 + CI diff=0 门禁（ApprovalRegistry 系）

> 程序员（AI wmw0027）｜ 2026-09-03 ｜ 分支 `feat/upg78`（worktree `mov-upg78`，基底 `origin/main 6dd9161`）｜ commit `f1e2067`（本地，未合 main；合 main 只归设计师）
> 验收标准：`STD-UPG-78-v1`（content_sha256=`26266fe8bc20830cc3117e871116255bc91e2962f7a74f5d9f543dbcf9417670`）
> 派单：设计师B 2026-09-03（`UPG-78_生成器门禁_派单_2026-09-03.md`）
> **已登记两个表**（工单表.xlsx + 工单库.md）：工单表.xlsx 经 sync-orders.mjs --sync 单向生成；「C 交付」登记块为库侧写入

## 〇、交付绑定（P0-2）

- delivery_id: **DEL-UPG78-20260903-001**
- code_commit_sha: `f1e20678e2dc4633db48e15067b266ec455db0bd`（feat/upg78 tip；`git log`=UPG-78 生成器链路自供电+保鲜：A1 dependsOn collect / A2 CI git diff 门禁 / A3 三生成物校准入库）
- artifact_sha: `72d424360d1cf0f815f293834dd050e61b2307f2e9d05638eb0f25ff9d80528e`（app-debug.apk sha256）
- evidence_manifest_sha: `f7c874792e32df02b61579bf5fc71761c1c90c8ddcb43dda41fda1a80762218e`（`程序员/交付报告/DELIVERY_UPG78_2026-09-03_manifest.json`，5 条 E-001~E-005；`审验.py --manifest` 复验 ok:True）
- standard_id: STD-UPG-78-v1
- verify-hash 登记前实测 `审验.py --verify-hash feat/upg78 f1e2067 --repo mov-upg50-ph2` → **HASH_REJECT <not-ancestor>**（commit 未合 origin/main 故非祖先；合 main 后复跑闭环，红线 23 如实留证）

## 一、交付物（5 文件 / +21 / -2；构建图 + CI 门禁 + 生成物校准）

| 产物 | 路径 | 要点 |
|---|---|---|
| A1 构建自供电 | `app/build.gradle.kts`（改，+14） | 注册 `approvalInventoryCollect`（Exec：`node ../scripts/approval-inventory-collect.mjs`，workingDir=app）+ `testDebugUnitTest.dependsOn`（AGP 变体任务晚注册→`tasks.matching{it.name=="testDebugUnitTest"}.configureEach` 惰性挂接）——每次单测先刷新 tools.txt，新 handler 必被盘点（stale 不再漏检） |
| A2 CI 漂移门禁 | `.github/workflows/upg68-registry.yml`（改，+3） | verify 后追加 `git diff --exit-code -- docs/ApprovalRegistry.json docs/ApprovalRegistry.md app/src/main/kotlin/com/hermes/dsh/tools/PermissionRegistryData.kt`（路径限定三生成物，照抄 upg70-catalog.yml 同款；不全仓 diff 防 autocrlf 假阳） |
| A3 生成物校准 | `PermissionRegistryData.kt`（+1）/ `ApprovalRegistry.json`（2±）/ `ApprovalRegistry.md`（3±） | +`ui.listComponents` Entry（read/free/low/harmless=false；200→201 行）——见 §二·A3 |

commit：`f1e2067`（`git log --oneline` 首位；工作树已净——C7/catalog 每次 rerun 污染均已还原，见 §八）

## 二、施工要点（A1/A2/A3）

- **A1 · 测试自供电（构建图内消解断链）**：`testDebugUnitTest` 前置 `approvalInventoryCollect`——gradle Exec 调 `approval-inventory-collect.mjs`，输出 `app/build/inventory/tools.txt`（gitignored）。每次单测 tools.txt 必新鲜：新 handler 加到源码 → 下一次测试自动盘点 → 注册表漏登记即红。测试内 ProcessBuilder 兜底（4e56fc0，缺失时自生成）**保留**——仅作 IDE 直跑防御，主机制=gradle dependsOn（A1 优先 A 落地）。
- **A2 · CI 漂移门禁**：upg68-registry.yml 生成器测试（重写生成物）→ verify（内部一致性对账）→ **新增 git diff --exit-code（三生成物 vs 库中版本漂移即红）** → single-channel → 全量。手改生成物/漏提交新生成物 → CI 红。
- **A3 · 生成物校准（污染结构性消除）**：漂移根因实证——`collect` 盘点 180 工具含 `ui.listComponents`（MainActivity.kt:3324 `mcpHandlers["ui.listComponents"]` 真实在面）+ `categories.json` 人工分类 read/low **早已在场**（红线未动人工输入）→ 生成器必产该行，而**库中生成物 stale（缺行）** → 每次生成器测试重写补行 → 工作树污染 → UPG-75/76「交付前手工还原」的根源。本单把漂移行随生成器校准入库 → 此后重生成 diff=0 → 连跑零 M，手工还原成为历史。

## 三、红线守约

1. **不改生成器逻辑**：`ApprovalRegistryGeneratorTest.kt` 零改动（含 :44-50 ProcessBuilder 兜底块原样保留）——只动构建图挂接 + CI 门禁步 + 生成物校准。
2. **不改人工输入**：`docs/ApprovalRegistry.semantics.json` / `categories.json` 零改动。
3. **不改 guard 消费侧逻辑**：`PermissionGuard.kt` 零改动；`PermissionRegistryData.kt` 仅随生成器校准 +1 行数据（保鲜，非逻辑改动）。
4. 门禁路径**限定三生成物**，无全仓 `git diff --exit-code`（autocrlf 假阳性规避，CI Linux 为权威）。
5. **不动 C7**（`docs/c7_baseline_UPG63` 每次 rerun 污染均已还原，红线 3）；**不动 `upg70-catalog.yml`**；catalog 生成物（UiComponentCatalog.kt / ui-components.generated.js）污染已还原（归 UPG-70 线）。
6. **Token / KV Cache 两节申报**（见 §五，预期 0/0 已写）。
7. 亲杀三锚全做（见 §四）。

## 四、验证证据（三亲杀 · 时间戳 @2026-09-03 05:10-05:25）

- **A1 断链复现 → 自供电实证**：`rm -rf app/build/inventory` → `:app:testDebugUnitTest` **全量 722 完成 / 2 既存基线失败 / 1 skip**；dependsOn 自动重建 inventory（tools.txt **180 行**）；`ApprovalRegistryGeneratorTest` 通过（非断链红）。『修复前』如实注：main@6dd9161 已含 `4e56fc0`（P2-A2 测试内 ProcessBuilder 缺失自生成）——**缺失场景的红已在 main 修掉**；本单 A1 增量=升 A 机制（gradle dependsOn 覆盖「tools.txt 存在但 stale」场景），不伪造修复前红。
- **A2 门禁注入亲杀**：`docs/ApprovalRegistry.md` 注入可见 token → `git diff --exit-code -- 三路径` **exit=1（红）** → `git checkout` 恢复 → **exit=0（绿）**。
- **A3 连跑零 M**：`--rerun-tasks` 全量**连跑两遍**（722/2 基线/1skip ×2），每遍后三生成物门禁 **exit=0**；三生成物 md5 两遍**完全一致**——`ApprovalRegistry.json=8ad1d02e55234874aaeb1f151e7b777b`、`ApprovalRegistry.md=dd22d4bb8fbe36c0838fe41e00a7ea90`、`PermissionRegistryData.kt=5ea1840e66952a9afe1f6e0c95722a2e`（生成物确定性稳定，零 M）。
- **回归**：collect=180 工具；verify **rows=201 · 在面=180 · 防御=21 全过**；single-channel **A7 通过**；`PermissionGuardTest` **15/0/0**（guard 消费侧零回归）；`:app:assembleDebug` **BUILD SUCCESSFUL**（33s）；`upg70-catalog.yml` 未动。
- 全量 2 失败=AppearanceContractTest L1-10 + M-U50-5（既存基线，UPG-76 同申报 722/2/1）。

## 五、Token / KV Cache 影响申报（预期 0/0 · 零请求链路）

- **Token**：本单=构建/CI 工具链（gradle 任务挂接 + node 盘点脚本 + git diff 门禁），无 LLM/API 请求链路 → **AI 面 Token 增量 0**。
- **KV Cache**：无新增持久会话/用户数据；collect/verify/门禁均为进程内确定性脚本 → **KV Cache 增量 0**。
- 运行面（用户/执行器）无任何改动：UPG-78 未触碰工具装配/审批判定/运行时数据。

## 六、共享面影响清单 + coverage_status（红线 24）

| 共享面 | 变更 | 影响面 | coverage_status |
|---|---|---|---|
| 构建图 `app/build.gradle.kts` | `testDebugUnitTest` dependsOn `approvalInventoryCollect`（Exec: node collect） | 所有经 gradle 跑单测者多一步 node collect 前置（需 node 在 PATH；tools.txt 必新鲜）；任务产物语义不变 | **FULL** |
| CI `.github/workflows/upg68-registry.yml` | verify 后新增 `git diff --exit-code` 门禁步 | push main / PR：生成物漂移即红；合 main 后**首跑结果需回看补记**（派单 §六.5） | **FULL**（本地注入亲杀复演；CI 真实首跑留合后） |
| 生成物 `PermissionRegistryData.kt` | +`ui.listComponents`（read/free/low/harmless=false） | guard 消费行为变化：该工具由 UNKNOWN→ASK 变 read/free 免弹窗（只读 UI 组件列举；人工分类早已 read/low，AI 未决定）——随生成器校准，非逻辑改动 | **FULL** |
| 生成物 `docs/ApprovalRegistry.{json,md}` | +ui.listComponents 行（200→201 行） | 唯一事实源/文档保鲜，verify 已对账 | **FULL** |

coverage_status 总评：**FULL**（5 文件全 evidence + 全量 rerun ×2 + 定向 + 构建 + 三脚本全覆盖；唯一非自动覆盖项=CI 上真实跑门禁步，已本地注入复演等价，留合 main 后首跑回看）。

## 七、遗留申报

1. **C7 基线测试非确定性**（`docs/c7_baseline_UPG63` 每次 --rerun-tasks 重写时间戳类差异）：红线 3 声明不动，属另挂账治理项（UPG-78 追加说明区亦注明）；本单每次验证后已还原。
2. **catalog 生成物**（UiComponentCatalog.kt / ui-components.generated.js）：UPG-70 线（`upg70-catalog.yml` 已有同款 diff 门禁），本单不动；本地全量测试触发重写已还原，不混入本单 commit。
3. **A1『修复前=红』前件如实**：main@6dd9161 已含 `4e56fc0`（测试内缺失自生成），删 inventory 定向/全量即绿；本单 A1=升 A 机制（dependsOn 覆盖 stale 场景，构建图单点）+ A3 校准（连跑零 M）。未伪造修复前红，断链缺口以「生成物 stale 实据」呈现（入库缺 ui.listComponents 行=漂移留存的实证）。
4. **合 main 后 CI 首跑回看**：upg68-registry.yml 在 push main 触发，新门禁步真实首跑结果需合后回看补记（派单 §六.5；本地注入亲杀 exit=1→0 已等价复演）。

## 八、演示数据还原 + 生产态复核声明

- 验证（A1 删 inventory 全量 / A3 连跑两遍）触发 C7 与 catalog 生成器重写污染 → **已全部还原**（`git checkout -- docs/c7_baseline_UPG63/` + UiComponentCatalog.kt + ui-components.generated.js），`git status` 干净（空）。
- 生产态复核：三生成物校准入库后与生成器输出 **diff=0**（A3 门禁 exit=0 两遍实证）；`PermissionRegistryData.kt` 201 行=在面 180 + 防御 21 全量在册；PermissionGuard 消费数据自洽（PermissionGuardTest 15/0/0）。
- **「本单起，全量测试后三生成物 diff=0，手工还原不再发生」** 声明成立（A3 连跑两遍 + md5 一致实证）。

## 九、真机

- 本单 **L2 构建/CI 工具链**，L1 用户可感知层豁免（无 UI/运行面变更，红线 20 豁免）；无真机场景。验收走 STD L2 亲跑复现（删 inventory 全量绿 / 门禁注入非 0 / 连跑零 M + 三脚本回归）。
