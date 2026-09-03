# 交付报告 · UPG-92

> 类型：工单系统工具链升级（零 app 代码） ｜ 日期：2026-09-04 ｜ 依据：`设计师\派单\UPG-92_manifest硬闸化_派单_2026-09-03.md`
> 治理归属：只动 `Desktop\MOV\工单系统`（0027-mov 零接触） ｜ 状态：✅ 已完成（交付，待验收）
> 验收标准：`STD-UPG-92-v1`（content_sha256=`a2c0fcd7b2afb725db48172d9a86dd23b188b0005599554c418e09effe1d9bf7`）

## 交付绑定（P0-2）

| 项 | 值 |
|---|---|
| delivery_id | `DEL-UPG92-20260904-001` |
| standard_id | `STD-UPG-92-v1` |
| code_commit_sha | `39039ef`（MOV 仓库 `feat/upg92`，基 main f218abc） |
| artifact_sha | 不适用（工单系统脚本单，无构建产物） |
| evidence_manifest_sha | `802d72e65412fc80d21e9801948906dfbf69758240b93f0522f10be3250a889f` |
| manifest 文件 | `处理中心\delivery_UPG92_manifest.json`（**经新闸产出**——本单吃自己狗粮，零人工修补） |

---

## 一、本单交付（1 件）

`审验员\deliver-gen.mjs` 升级（+256/-20 行，commit `39039ef`）——manifest 治理从「人记得跑自检」变「机器拦」：

1. **源头合规**：传 `--evidence` 即自动产出 evidence manifest——路径裸串（ROOT 相对/正斜杠/说明性内容无处可嵌）、每条 sha256 机器实算（文件=内容摘要；目录=UPG-86 口径 sorted 文件名+内容聚合，与 `审验.py _dir_sha256` 逐字节对齐）、`evidence_manifest_sha` 绑定值写入（canonical JSON 键序递归排序/无空白/UTF-8，与 `审验.py _canon_manifest` 对齐，可重算对账）。
2. **自检内置硬闸**：产出后自动跑 `审验.py --manifest --json`——`ok:False` → **删除产出残件 + 拒绝生成交付报告 + exit 1**（硬闸=拒绝，非警告）；证据文件不存在 = 源头即拒（exit 2）。
3. **`--manifest-draft` 直通过闸**：草稿条目逐字进闸，机器不替人修补语义（路径嵌注释/缺 sha256 = 拒）。
4. **`--self-test`**：四案机器自测（合规绿/注入红×2/骨架回归），验收员可一键复跑。
5. 骨架联动：manifest 过闸后 hash 三重栏自动填 `evidence_manifest_sha`，报告附「manifest 自检 ok:True 重算一致」行。

## 二、验收判据核对（STD-UPG-92-v1 逐条）

| 项 | 标准 | 实测证据 |
|---|---|---|
| 销项① | deliver-gen 产出 manifest 默认合规（ok:True 可重算） | ✅ 狗粮实证：本单自身 manifest 经新闸产出，`审验.py --manifest` 独立复核 **ok:True / 一致? True / 8 条全 exists=True hash_matches=True**（`dogfood_manifest_gen_2026-09-04.log` + 本报告 §交付绑定） |
| 销项② | 自检内置硬闸（不合规=交付生成失败，非警告） | ✅ 亲杀双锚见下表，exit=1 + 残件清除 + 报告不产出 |
| 销项③ | 审验.py/deliver-gen 既有功能零回归 | ✅ `审验.py --manifest-self-test` PASS 4/4、`--verify-hash-self-test` PASS 2/2、`--list` 正常；deliver-gen 无 manifest 参数骨架照出 exit 0（`audit_regression_2026-09-03_23-59-01.log` + 自测案 4） |
| 销项④ | Token/KV 0/0 申报 | ✅ 0/0（纯工单系统脚本，零 app 代码零网络） |

### 亲杀锚（STD 两锚）

| 锚点 | 动作 | 期望 | 实测 |
|---|---|---|---|
| 源头合规 | deliver-gen 产出一份 manifest | ok:True 可重算一致（零人工修补） | ✅ 本单 manifest：绑定值=重算值 `802d72e6…`，路径裸串/条带 64hex sha256 机检全过（自测案 1 PASS） |
| 硬闸 | 注入不合规内容（路径嵌注释/缺 sha256） | 拒绝产出/交付生成失败 | ✅ 注入①路径嵌注释 → `MANIFEST_REJECT` exit=1 残件清除（`kill_path-note_2026-09-03_23-59-26.log`）；注入②缺 sha256 → 同上（`kill_missing-sha_2026-09-03_23-59-26.log`）。注入草稿在案可复跑（`inject_draft_path-note.json` / `inject_draft_missing-sha.json`，病灶唯一[目标文件真实存在、其余字段合法]） |

## 三、证据引用（`程序员\UPG92-evidence\`，全部经 manifest 绑定）

- `selftest_2026-09-03_23-58-49.log` —— deliver-gen `--self-test` PASS 4/4（源头合规绿 + 注入红×2 + 骨架回归）
- `audit_regression_2026-09-03_23-59-01.log` —— 审验.py 全子命令回归（另附旧件 UPG-88 manifest 检测=红，第六现病灶实证仍在）
- `kill_path-note_2026-09-03_23-59-26.log` / `kill_missing-sha_2026-09-03_23-59-26.log` —— 亲杀双锚实录（含时间戳）
- `inject_draft_path-note.json` / `inject_draft_missing-sha.json` / `kill_demo_target.txt` —— 亲杀注入件（可复跑）
- `commit_diff_2026-09-03_23-59-35.log` —— 代码变更快照（39039ef stat）
- `dogfood_manifest_gen_2026-09-04.log` —— 狗粮：新闸产本单 manifest 全程实录（MANIFEST_OK）

## 四、测试结果

- `node deliver-gen.mjs --self-test` → **PASS 4/4**
- `python 审验.py --manifest-self-test` → **PASS 4/4**（三坏案红 + 好案绿，零回归）
- `python 审验.py --verify-hash-self-test` → **PASS 2/2**（U-49 fixture 重放，零回归）
- `python 审验.py --manifest 处理中心\delivery_UPG92_manifest.json` → **ok:True，一致? True，8 条全 exists/hash_matches=True**
- 旧骨架路径（无 --evidence/--manifest-draft）→ exit 0 照出，「待填」栏在（零回归）

## 五、hash 三重（交付绑定）

| code_commit_sha | artifact_sha | evidence_manifest_sha |
|---|---|---|
| `39039ef` | 不适用（工单系统脚本单，无构建产物） | `802d72e65412fc80d21e9801948906dfbf69758240b93f0522f10be3250a889f` |

**manifest 自检（UPG-92 内置硬闸 · 审验.py --manifest）**：ok:True ｜ 绑定值重算一致 ｜ 文件：`处理中心/delivery_UPG92_manifest.json`

**E2 hash 一致性预校验**（`python 审验.py --verify-hash feat/upg92 39039ef --repo C:\Users\Administrator\Desktop\MOV`）：

- 结果：**HASH_REJECT \<not-ancestor\>** —— 如实申报：feat/upg92 未合 main 且本地 main 领先 origin/main 8 提交（push 待网络恢复，UPG-75 起在案），未合分支 commit 必然不在 origin/main 祖先链——与 UPG-88/90/91 同模式（交付待验收，**设计师合 main 后终态复核**）。hash 存在性已验（`git cat-file -t 39039ef`=commit）。

## 六、范围与红线遵守

- ✅ 只动 `工单系统\审验员\deliver-gen.mjs` 一件；0027-mov 零接触（`git status` 于 0027-mov 零 M——施工前后一致）
- ✅ 硬闸=拒绝不是警告（exit 1 + 删残件 + 报告不产出）
- ✅ 机器产出即合规：本单 manifest 零人工修补经新闸产出（狗粮）
- ✅ Token/KV 0/0
- ✅ 证据脱敏：证据全为本机测试日志，`git grep sk-` 零命中（无 key/token）
- ✅ 无演示数据（全程真实文件实算，无临时态需还原）
- ✅ 证据归属唯一：证据仅在 `程序员\UPG92-evidence\`，其他角色引用路径即可

## 七、登记说明

- **已登记两个表**：`工单库.md` UPG-92 卡状态区加交付块 → `sync-orders.mjs --sync` 投影 `工单表.xlsx`（diff=0），程序员列 ✅完成 + 备注分支/hash/报告名 + delivery_id 列 `DEL-UPG92-20260904-001`
- 认领登记已于开工前完成（@2026-09-03 23:46，库卡状态区 → 表投影；五步铁律：写前备份 `工单库.md.bak_upg92_claim_20260903_2346` + sync 自动备份表 + 写后读回对账）
- 待验收：审验.py/deliver-gen 机器校验亲跑（`--self-test` 一键复跑）+ 亲杀双锚复杀 + 设计师合 main（feat/upg92 @39039ef）后 verify-hash 终态复核
