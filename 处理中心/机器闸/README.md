# 机器闸 —— 公共工具房使用说明（2026-09-09 工具分家立档）

> 定位：全体系共享的账本机械/卫生执法/看板投影工具，**单点更新**（改工具只改这，禁止复制到角色目录）。各角色手册只记自己怎么用，本文是工具房总说明书。
> 纪律：工具件=白名单成员受闸保护（红线 27 工具分家条款）；新工具入住须当天登记本表。

## 账本写入机械

| 工具 | 用法 | 谁用 |
|---|---|---|
| `set-status.py` | `python set-status.py <工单号> --phase <相位> [--role designer/dev/inspector/merge] [--note "..."] [--branch f/x --head <sha>] [--exempt "豁免理由"] [--show]`——五步登记（写前备份/归属/迁移/hash 祖先链校验内置）；**手写状态段不再产生权威状态** | 全角色（卡状态变更唯一入口） |
| `取号.mjs`（2026-09-12 补登记） | `node 取号.mjs 立卡 <前缀> "标题" "引子" --bv N --tc N --rr N --size N [--kind bug --impact N --urgency N] [--priority Pn]`——锁式取号+原子落卡；SYS-59 起 **WSJF 四因子必填（缺分即拒）**+bug ITIL 3×3；`下一个 <前缀>` 只读查号 | 设计师（立卡唯一入口） |
| `sync-orders.mjs` | `node sync-orders.mjs --check`（只读校对，退出码 1=漂移）/ `--sync`（库→投影单向重写）——E1 无表模式校库解析+DEL 绑定 | 设计师合批前 / 钩子自动 |
| `archive-cards.mjs` | `node archive-cards.mjs [--days 30] [--dry-run/--execute]`——终态卡归档 | 设计师 |
| `worktree.mjs`（SYS-112） | `node worktree.mjs list [--repo R] [--json]` ／ `prune [--apply]`（**默认 dry-run**；双判据=脏项 0 **且** 已并入 `origin/main`）／ `rm <path> [--force]`（安全默认：未并入/有脏项拒删）／ `new <单号>`（建+分支+基线提示）——**合并完成即清**：`prune --apply` + 分支处置 | 设计师合并位 / 全角色收口 |
| `stages.json` / `体系清单.json` / `lib\` | set-status 相位表 / 多体系注册表 / 卡片解析库（schema+parse+registry）——工具数据，勿手改 |

## 降耗／等待面（SYS-167·2026-10-03 新入住）

| 工具 | 用法 | 谁用 |
|---|---|---|
| `等信.mjs` | `node 等信.mjs [--box <角色>] [--timeout 秒·默认600] [--interval 秒·默认8] [--json]`——**一条命令阻塞等信**（`--box` 缺省按 cwd 判工位；有信即返·打印 id/标题·exit 0／超时「无新信」·exit 1；只读零副作用）——**替代多回合轮询**（N 回合压成 1·同轮 token 哨兵记 turns/polls 可查） | 全角色 |

## 卫生执法

| 工具 | 用法 |
|---|---|
| `layout-check.mjs` | `node layout-check.mjs --root <works根>`——四层白名单闸（体系根/处理中心/角色 ROLE_RULES/根层散落）；巡检台一键体检主力 |
| `checks/check-priority-score.mjs` | `node checks/check-priority-score.mjs [--lib <工单库.md>]`——SYS-59 评分防滥（新卡缺分/值非法/wsjf 不一致/bug ITIL 不符/全 P1 → fail；存量豁免） |
| `checks/precheck-l23.mjs` | `node checks/precheck-l23.mjs [--serial <机>] [--who <名>] [--force] [--park]`——L2/L3 开链预检（SYS-135 扩）：⓪真机占用（他人在用即拒跑）→ ①在线／①b wm 覆盖残留（必还原）／②包／③key；`--force` 越过留痕（_forceLog）、`--park` 跑前写「占用起」 |
| `checks/真机占用.mjs`（SYS-135） | `node checks/真机占用.mjs 占\|放\|查 [--serial <机>] [--for 30] [--why "..."]`——真机占用登记单一真源（谁·何时·预计多久，不建调度系统）；`放` 顺带打 wm 覆盖读数自证「已还原」 |
| `checks/装机前置.mjs`（SYS-158·新入住） | `node checks/装机前置.mjs [--serial <机>] [--who <名>] [--force [--why "…"]] -- <装机/仪器命令…>`——**装机/仪器路径的占用闸接线**：占中非本人 ⇒ 拒跑（rc=3·不执行被包命令·给占位者/解除方式）；`--force` 写 `_forceLog`（who/why/time）后执行；空/自持直放；被包命令退出码透传。`install-ledger.mjs 记` 内置同闸（import 复用；`--force --why` 同语义） |
| `evidence-archive.mjs` | `node evidence-archive.mjs <角色> [--execute]`——已合证据归档（默认 dry-run 预演；单名/日期批/孤儿判定，孤儿不自动迁） |
| `evidence-index.mjs` | `node evidence-index.mjs <角色>`——证据索引生成（落 验证产物\证据索引_<角色>.md，在途/已合/孤儿分组+归档区计数。**孤儿豁免口径 2026-09-11 拍板**：MICRO/转办 chore 证据以「<对象>-evidence」命名且派办信注明豁免即不算孤儿——工具侧豁免列改进候选，体检侧已先行承接） |

> `--root` 语义（SYS-34 补，审验 SYS-32 附记④）：传 **works 父根**（`E:\MOV`）——**不是**体系仓自身。传体系仓会把「体系根白名单」比错层，全红假报。

## 看板投影（产物一律落 验证产物\，红线 26）

| 工具 | 用法 |
|---|---|
| `orders-overview.mjs` | E4 全景看板（只读投影，不创造状态） |
| `aggregate-overview.mjs` | `--only <体系>` 总看板聚合 |

> 生成物漂移（SYS-34 补）：产物是库/源的**派生件**，重跑即重写——**勿手改**。同一产物同时出现在 `汇报区\` 与 `验证产物\` 两处＝落点漂移，按红线 26 归位（先回写源，再重跑生成器）。

## 交付／合并面（2026-09-28 补档）

| 工具 | 用法 | 谁用 |
|---|---|---|
| `交付件数对账.mjs`（2026-09-28 新入住） | `node 交付件数对账.mjs --root <交付树> --patch <补丁> [--base <sha>] [--json]`——**A（补丁件集）＝B（交付树变集·`--no-renames`）集合比对**（比集合不只比数字）；`--base` 另给 C 集并提示「base 动过 ⇒ diff-sha 不可作对数凭据」。**拦截形态**：UPG-358 补丁 29 vs 变集 43（缺 14 件旧哈希删除）／UPG-361 同型 47 vs 63 | 程序员（交付前自检）／审验员（交接核） |
| `merge-check.mjs` | `node merge-check.mjs --worktree <wt> [--ticket UPG-x] [--expect N] [--apply]`——合并位三查（全树补丁＋件数＋基点＋冲突检测＋逐件比对；不带 `--apply` 干跑） | 设计师合并位 |
| `precommit-check.mjs` | 体系仓提交前自证（账本完整性＋语法＋密钥）·已接为 `.githooks/pre-commit` 闸三 | 钩子自动 |
| `工具自检.mjs` | `node 工具自检.mjs [--quiet\|--full\|--sys-only]`——全域脚本语法自检（体系仓命中＝硬拦；产品仓 `scripts/`＝告警） | 全角色／钩子／体检 |

> **口径（2026-09-28 审验席报：本表曾落后于注册表）**：注册表 `tool-registry.json` ＝**单一真源**；本表只写高频用法与谁用，**入住登记以注册表为准**（当时实测：机器闸目录注册 22 件、本表未列 10 件——`delivery-index.mjs`/`evidence-sums.mjs`/`cos-verify.py`/`snapshot.mjs`/`lib-edit.mjs`/`席位.mjs`/`merge-check.mjs`/`precommit-check.mjs`/`工具自检.mjs`/`交付件数对账.mjs`）。**同一件东西两处维护必然脱节**。

## 相关但不在本房

审验四件（审验.py 等）→ `审验员\_tools\`；deliver-gen→`程序员\_tools\`；mutate-gen/cdp-eval→`验收员\_tools\`；recon-queue/design-audit/feature-drift/gen-std/功能树→`设计师\_tools\`（各角色手册有用法）。
