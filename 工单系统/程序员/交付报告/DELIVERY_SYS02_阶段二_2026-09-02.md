# 交付报告 · SYS-02 阶段二（验证自动化件 V1+V2）

> 类型：SYS 系统自改进（独立编号，不混入 UPG 主线）
> 日期：2026-09-02 ｜ 依据：`设计师\派单\SYS-02_阶段二_派单_2026-09-02.md`（验收判据 M-1~M-3/M-5/M-6）
> 治理归属：工单系统自身改造（**只动 `Desktop\MOV\工单系统`**，**零 0027-mov 代码**）
> 状态：✅ 已完成（交付，待验收）

---

## 一、本阶段交付（2 件）

| # | 交付 | 实现 |
|---|---|---|
| 1 | **V1 变异生成器 `mutate-gen.mjs`** | `审验员\mutate-gen.mjs`：4 变异模板（cond-flip / short-circuit `&&↔||` / call-delete / const-replace）+ 显式 `old=>new`；**detached worktree 隔离变异**（绝不碰工作区源码）；跑 gradle suite → 按 test XML failures/errors 判定 `MUTATE_<id>_RED`（exit 0）/ `MUTATE_<id>_NOT_RED`（exit 1）/ `MUTATE_ERROR`（exit 2）；自动清理 worktree + 复核 status 干净；`--out-dir` 导出 XML 证据 |
| 2 | **V2 交付报告生成器 `deliver-gen.mjs`** | `审验员\deliver-gen.mjs`：输入工单号/分支/hash/证据清单/测试结果 XML → DELIVERY 骨架（判据表+证据引用+hash 三重+测试汇总）；`--verify-hash` 预校验**调用阶段一 `审验.py`**（复用不重复实现）；`--out` 落盘；`--date` 覆盖日期 |

## 二、验收判据核对（M-1~M-3/M-5/M-6，每条证据）

| 项 | 标准 | 实测证据 |
|---|---|---|
| **M-1** | RED/NOT_RED 判定正确 | ✅ 三案实测（目标 `ContextBudget.kt` / suite `:app:testDebugUnitTest --tests com.hermes.dsh.budget.TokenMeterTest`）：① const-replace `0.3→0.5`（ASCII 权重）→ `MUTATE_ContextBudget-const-replace_RED`（tests=3 failures=1，exit 0）；② short-circuit `(0x3400..0x4DBF)||(0x4E00..0x9FFF)→&&` → `MUTATE_..._short-circuit_RED`（tests=3 failures=1，exit 0）；③ **NOT_RED counterexample**：cond-flip `ratio >= 0.95→<=`（`stateFor()` 未被该 suite 覆盖）→ `MUTATE_..._cond-flip_NOT_RED`（tests=3 failures=0，exit 1）——RED/NOT_RED 双判定路径全可达 |
| **M-2** | 0027-mov git status 干净 | ✅ 三案脚本内基线对比均输出 `0027-mov 工作区干净: true`；外部复核运行前后 `git status --porcelain` 逐行一致（基线 137 行 @2026-09-02 运行前）——变异全程只落临时 worktree，主工作区零改动 |
| **M-3** | UPG-50 真实数据 → 骨架 | ✅ `node deliver-gen.mjs --ticket UPG-50 --branch feat/upg50-ph1 --hash 176606dfb9d7… --app-path C:/Users/Administrator/0027-mov --evidence 处理中心/delivery_UPG50_manifest.json` → 完整 DELIVERY 骨架（判据表/证据引用/hash 三重/测试汇总）；`--verify-hash` 预校验如实输出 `HASH_REJECT <not-ancestor>`（UPG-50 分支未合 main——机器出 flag，人裁决） |
| **M-5** | 0027-mov git diff 为零 | ✅ 变异测试运行前后 0027-mov `git status --porcelain` 完全一致（diff 无差异）；脚本内 clean 断言 + 外部复核双证据 |
| **M-6** | 审验.py 旧功能零回归 | ✅ `--coverage 程序员/交付报告/DELIVERY_UPG49_R2_2026-09-01.md` → `coverage_status: FULL` `flags: pass`；`--manifest 处理中心/delivery_UPG50_manifest.json` 正常执行（如实报 EVID 缺 sha256 / 路径不存在——数据文件自身状态，非回归）；`--ticket UPG-50` / `--ticket-file SYS-01_阶段五_P2_派单` 主链路无异常 |

## 三、证据引用

- `设计师/派单/SYS-02_阶段二_派单_2026-09-02.md` —— 本单验收判据 M-1~M-3/M-5/M-6 与红线来源
- `程序员/交付报告/DELIVERY_SYS02_阶段一_2026-09-02.md` —— V2 `--verify-hash` 预校验复用的阶段一实现（审验.py E2 自动闸）
- `程序员/交付报告/evidence_sys02-ph2/TEST-ContextBudget-*.xml` —— 三案变异测试 XML（RED×2 failures=1 + NOT_RED failures=0），见 §四

## 四、测试结果（XML 汇总）

| 文件 | tests | failures | errors |
|---|---|---|---|
| `evidence_sys02-ph2/TEST-ContextBudget-const-replace-com.hermes.dsh.budget.TokenMeterTest.xml` | 3 | 1 | 0 |
| `evidence_sys02-ph2/TEST-ContextBudget-short-circuit-com.hermes.dsh.budget.TokenMeterTest.xml` | 3 | 1 | 0 |
| `evidence_sys02-ph2/TEST-ContextBudget-cond-flip-com.hermes.dsh.budget.TokenMeterTest.xml` | 3 | 0 | 0 |
| **合计** | **9** | **2** | **0** |

> 结论：const-replace / short-circuit 两案 failures=1 → **RED 证据**；cond-flip 案全绿 → **NOT_RED 证据**（变异未被测试覆盖，暴露 `stateFor()` 无测点，见 §七 建议）——判定由机器出，结论人裁决。

## 五、hash 三重（交付绑定）

| code_commit_sha | artifact_sha | evidence_manifest_sha |
|---|---|---|
| `85e3e80afaebf675dbd3fac428d97a27b3939480` | （待填） | （待填） |

**E2 hash 一致性预校验**（复用 SYS-02 阶段一 `审验.py --verify-hash`）：

- 命令：`python 审验.py --verify-hash feat/sys02-ph2 85e3e80afaebf675dbd3fac428d97a27b3939480 --repo C:/Users/Administrator/Desktop/MOV`
- 结果：**HASH_REJECT <not-ancestor>** ｜ signal：`85e3e80` 不在 origin/main 祖先链——**本单交付在工单系统仓库、分支未合 main，属预期状态**；验收通过、设计师合 main 后该 commit 进入 origin/main 祖先链 → 复检应为 `HASH_OK`（机器出 flag，人裁决）

## 六、范围与红线遵守

- 只动 `Desktop\MOV\工单系统\审验员\`（mutate-gen.mjs / deliver-gen.mjs）+ `程序员\交付报告\`，**未碰 0027-mov APP 源码**（0027-mov 仅作变异测试只读宿主，跑完 status 干净）✅
- 脚本**不联网、无 secret**（纯本地 child_process：git worktree / gradlew / python 审验.py）✅
- **报告=骨架+实测证据**：判定（RED/NOT_RED）机器出、结论人填 ✅
- 未进 `工单表.xlsx` UPG 主线（SYS-xx 独立追踪，规则不变）✅
- SYS-01 六阶段物不破坏：审验.py 旧功能回归全过（M-6）✅

## 七、遗留 / 建议

- **`stateFor()` 无测点暴露**：cond-flip NOT_RED 案例表明 `ContextBudget.stateFor()` 阈值逻辑（0.95/0.85/0.70 四态）无测试覆盖——建议后续为 stateFor 补单测（属 0027-mov 侧，另行派单，不属本单范围）。
- **cond-flip 语义**：当前按优先级先双字符后单字符翻转（`>=`→`<=` 为逻辑否定式）；如需"边界微调"变异（`>`↔`>=`）可扩展模板参数。
- **Windows 显示注记**：脚本输出 UTF-8 中文，GBK 控制台直跑可能乱码；`PYTHONUTF8=1`/`chcp 65001` 下正常（同审验.py 注记）。本报告全部实测以 UTF-8 捕获。

## 八、登记说明

- 已登记：`README.md` §六追加 SYS-02 阶段二 ✅（见下）。
- 交付 git 分支：`feat/sys02-ph2`，实现 commit `85e3e80`（基底 feat/sys02-ph1 `ac67692`）+ 本报告及登记（同分支）。
