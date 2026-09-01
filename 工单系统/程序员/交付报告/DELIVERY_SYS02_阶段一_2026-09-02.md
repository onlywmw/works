# 交付报告 · SYS-02 阶段一（E2 hash 一致性自动闸）

> 类型：SYS 系统自改进（独立编号，不混入 UPG 主线）
> 日期：2026-09-02 ｜ 依据：`设计师\派单\SYS-02_阶段一_派单_2026-09-02.md`（验收判据 S2-1~5）
> 治理归属：工单系统自身改造（**只动 `Desktop\MOV\工单系统`**，**零 0027-mov 代码**）
> 状态：✅ 已完成（交付，待验收）

---

## 一、本阶段交付（3 件）

| # | 交付 | 实现 |
|---|---|---|
| 1 | **审验.py 扩展 `--verify-hash`** | `审验员\审验.py` 新增 SYS-02 E2 小节：`verify_hash(branch, reported_hash, repo)` + `_run_git()` + `VERIFY_HASH_FIXTURES` + `verify_hash_self_test()`；main() 新增 `--verify-hash <branch> <hash>`、`--repo <仓库>`（覆盖默认主仓库）、`--verify-hash-self-test`；默认主仓库 = `C:\Users\Administrator\0027-mov`（项目配置.md 第二节） |
| 2 | **红线 23 接入强制校验** | `README.md` 红线 23 补句：交付绑定登记前**必须**先在主仓库跑 `--verify-hash`，`HASH_REJECT`=登记拒绝（提示 `git log --oneline <分支>` 取真 hash），`HASH_OK` 方可登记；覆盖引子 UPG-49 hash 漂移场景 |
| 3 | **回归自测** | 脚本内 fixture（U-49 案例重放）+ 手动命令双跑，见 §二 S2-1/S2-2 |

## 二、验收判据核对（S2-1~5，每条证据）

| 项 | 标准 | 实测证据 |
|---|---|---|
| **S2-1** | 不存在 hash → `HASH_REJECT missing`（9fd39b6 实重放） | ✅ `python 审验.py --verify-hash feat/upg49 9fd39b6` → `结果: HASH_REJECT <missing>`，signal「`9fd39b6` 不存在（git cat-file -t 失败: fatal: Not a valid object name 9fd39b6）——提示: git log --oneline feat/upg49 取当前真 hash」 |
| **S2-2** | rebase 重写 hash（2a13dcd 在链 / 9fd39b6 不在）→ OK/REJECT 判定正确 | ✅ `--verify-hash feat/upg49 2a13dcd` → `HASH_OK`（`2a13dcd` 存在且在 origin/main 祖先链）；同机 9fd39b6 → `HASH_REJECT missing`；补充边界：`176606d`（feat/upg50-ph1 未合 commit）→ `HASH_REJECT <not-ancestor>`（防旧 hash/未合内容冒充）；`7992`（4 位重复前缀）→ `HASH_REJECT <ambiguous>`——三 reason 路径全实测可达 |
| **S2-3** | 红线 23 流程：登记前缺校验=拒绝 | ✅ 红线 23 文本已补（§一 件 2）：「登记前强制校验……`HASH_REJECT`=登记拒绝（……`HASH_OK` 方可登记）」——未跑 `--verify-hash` 即登记 = 违规，流程文本提证 |
| **S2-4** | 零 App 代码（git diff 无 0027-mov 路径） | ✅ 本单只改 `工单系统\审验员\审验.py` + `工单系统\README.md` + 本报告 + 登记表（挂账登记表 / README §六），**零 0027-mov 改动**（0027-mov 仅作为 `--verify-hash` 只读校验对象） |
| **S2-5** | 审验.py 原有功能零回归 | ✅ 回归实测：`--manifest 处理中心/delivery_UPG50_manifest.json`（manifest_sha 重算一致 match=True，逐条 exists 正常）；`--ticket-file 设计师/派单/SYS-01_阶段五_P2_派单_2026-09-01.md`（已查库字段「是，命中……」→ pass）；`--coverage 程序员/交付报告/DELIVERY_UPG49_R2_2026-09-01.md`（FULL → pass）；`--ticket UPG-50`（主链路完整输出，无异常）——SYS-01 P2 物不倒退 |

## 三、fixture 自测（脚本内锚）

`python 审验.py --verify-hash-self-test` → **PASS 2/2**：
- [PASS] 9fd39b6（rebase 重写后已不存在）→ 期望/实际 `HASH_REJECT missing`
- [PASS] 2a13dcd（在 origin/main 祖先链）→ 期望/实际 `HASH_OK`

fixture 固化在脚本内 `VERIFY_HASH_FIXTURES`，连真实主仓库（只读）重放，作回归锚。

## 四、范围与红线遵守

- 只动 `Desktop\MOV\工单系统`，**未碰 0027-mov APP 源码**（`--verify-hash` 对 0027-mov 为纯只读 git 查询）✅
- 未进 `工单表.xlsx` UPG 主线（SYS-xx 独立追踪，不写 UPG 单）✅
- SYS-01 六阶段物不破坏：审验.py 旧功能回归全过 + manifest/STD 校验照旧 ✅
- 机器只出 flag（`HASH_OK`/`HASH_REJECT`/`FLAG`），登记/放行由人裁决 ✅

## 五、实现细节说明

- **校验两段式**：① `git cat-file -t <hash>` 判存在性+对象类型（非 commit → `ambiguous`）；② `git merge-base --is-ancestor <hash> origin/main` 判祖先链（防「旧 hash/未合内容冒充」——UPG-49 病灶）。
- **branch 参数用途**：REJECT 时提示 `git log --oneline <branch>` 取当前真 hash；`origin/main` 本地缺失 → 输出 `FLAG`（先 `git fetch origin`，人裁决）。
- **Windows 显示注记**：脚本输出 UTF-8 中文，Windows 控制台（GBK 代码页）直接跑可能乱码；`PYTHONUTF8=1` 环境变量下正常（审验.py 原有功能同此，AI/subprocess UTF-8 捕获不受影响）。本报告全部实测均以 `PYTHONUTF8=1` 跑出。

## 六、遗留 / 建议

- **ambiguous 分支**：当前主仓库 5 位短前缀无重复（4 位 `7992` 可触发），防御性代码路径已实测可达；登记建议始终用完整 40 位 hash。
- 阶段二（E1 状态单源）/ 阶段三（E4 仪表盘）随本阶段验收通过后拆派（派单 §五）。

## 七、登记说明

- 已登记：`README.md` §六追加 SYS-02 阶段一 ✅（见下）；挂账登记表引子行（`挂账-sys02-UPG49hash漂移引子`）设计师验证列改 ✅已实施。
- 交付 git 分支：`feat/sys02-ph1`（基底 工单系统仓库 main `099860a`）。
