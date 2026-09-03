# DELIVERY_UPG86_2026-09-03 · UPG-86 manifest 治理（存量补齐 + 审验.py 机器可验性强化）

> 程序员：C（Claude/wmw0027）｜ 认领登记 @2026-09-03 18:50（工单库 UPG-86 卡）｜ 结论：**审验.py 强化落地+亲杀 4/4 PASS+存量自检 13/13 全绿+双挂账销项——待验收员验收**

---

## 〇、交付绑定

```yaml
delivery_id: DEL-UPG86-20260903-001
standard_id: STD-UPG-86-v1   # content_sha256=4b2ce3a75f18006231882e5fc054f407f84b99bfd7d58afd2accf7325b99af64
code_commit_sha: 13434e7     # 工单系统仓库（治理面=Desktop\MOV\工单系统\，不动 0027-mov 业务代码——红线兑现）
artifact_sha: 不适用（治理单无构建产物——自检输出=验收证据，见 §四/§五）
evidence_manifest_sha: 不适用（本单交付物=检测器+治理后存量——治理后 13 manifest 本身即机器可验态，自检全绿输出在案）
```

> 治理单特殊性：交付对象=审验.py 检测器（工单系统侧脚本，无 APK 构建链）+存量 manifest 本体（治理后每份自带 evidence_manifest_sha 可重算对账）。Token/KV 0/0（工单系统侧无请求链路）。

## 一、施工内容（三件）

1. **审验.py --manifest 三类失效检测**（STD 销项②）：
   - 检测 A 路径嵌注释：path 含 `（）/｜/§/——/sha256=` 说明性内容 → 红（说明须移 note 字段）；
   - 检测 B 缺 sha256：空串/缺字段/非 64hex 且**无显式 missing 声明** → 红；`sha256=null + note 含 missing` = 如实标注豁免（不造假语义）；
   - 检测 C 绑定值未写入：manifest 文件缺 `evidence_manifest_sha` 字段（清单内容 canonical sha256，可重算对账）→ 红；有值但≠重算 → 既有不一致红；
   - **目录聚合口径**：path 为目录时 sha256 按「sorted 文件名+内容」聚合比对（`_dir_sha256`，与交付报告声明口径一致——此前 read_bytes 读目录必 OSError 的盲区修复）；
   - **missing 豁免**：路径不存在 + note missing 声明 → 不进 problems（integrity 标 `missing_declared=true`）。
2. **manifest-self-test 亲杀锚**（新子命令）：三坏 fixture（路径嵌注释/缺 sha256/绑定值未写入）全红 + 好案（真实文件+真实 sha256+绑定写入）绿——**PASS 4/4**。
3. **存量治理**（8 manifest 32+13 条 evidence）：
   - path 裸串化：说明性内容（§定位/括号注释/目录聚合口径说明）全部移 `note` 字段（**内容零丢失**）；0027-mov 相对路径→绝对路径；UPG-68 两条 McpToolScheduler 历史误写路径（java/com/mov/android/ → 真实 kotlin/com/hermes/dsh/tools/）治理修正；
   - sha256：实物文件/稳定产物目录→真实 hash 补算/重算（短截 16hex→全 64hex）；**历史时点不可重算条目→显式 missing 声明**（null+note，原声明值保留于 note 零丢失）——覆盖：滚动构建目录（test-results）/被后续构建覆盖的 APK（UPG-82/85 原值移 note）/演进中源码（UPG-68 行号锚）/append-only 活文档（ACCEPTANCE_LOG/工单表/工单库）；
   - producer 规范：`C` → `程序员`（KNOWN_PRODUCERS 对齐）；
   - 绑定值写入：每文件 `evidence_manifest_sha` = `_canon_manifest`（数组 canonical，sort_keys 无空白 UTF-8）重算值——**与审验.py 重算口径完全一致**（importlib 同源加载保证）；
   - 键名统一：`evidence` → `evidence_manifest`（UPG-50/55 历史键名漂移修正——verify_manifest 只认后者）。

## 二、亲杀锚（STD：三案红+好案绿）

```
═══ UPG-86 manifest 治理自测（三坏案红 + 好案绿）═══
  [PASS] 好案（规范 manifest）  (ok=True)
  [PASS] 坏案①路径嵌注释  (ok=False)  - EVID-1 路径嵌注释：path 含说明性内容…
  [PASS] 坏案②缺 sha256  (ok=False)  - EVID-1 缺字段 sha256 / sha256 非法（空串…）
  [PASS] 坏案③绑定值未写入  (ok=False)  - 绑定值未写入：manifest 文件缺 evidence_manifest_sha 字段…
结论: PASS 4/4（机器只出 flag，人裁决）
```

## 三、存量自检（STD：治理后全部 --manifest 全绿或如实 missing）

```
13 manifest：处理中心/delivery_UPG50/55/68/82/85/87（6）+ 程序员/交付报告/UPG-49_R2×2/76/77/78/81/84（7）
→ 13 GREEN / 0 RED（ok:True 重算一致；missing 条目均带显式声明）
```

- **报告侧 7 份（UPG-49/76/77/78/81/84）**：binding 值经重算比对**全部一致**（前人按正确口径登记）——强化检测对它们零回归；仅 UPG-49_R2 两份的 app/src 源码条目按 missing 声明治理（主仓当前工作区分支非交付时点，时点 hash 不可重算）。
- **处理中心 6 份**：全量机器可验化（本单治理主体）。

## 四、回归（STD：其余子命令零回归）

- `--verify-hash-self-test`：**PASS 2/2**（U-49 fixture 重放 9fd39b6→REJECT missing / 2a13dcd→OK）；
- `--list`：冒烟正常（77 个有证据目录发现）；
- AST 完整性校验通过；治理对 verify_hash/delivery_binding/verify_coverage 等子命令零触碰。

## 五、挂账销项（STD 销项③）

| 挂账 | 销项 |
|---|---|
| 挂账-deliveryManifest指纹治理 | ✅ 已落实销项 @2026-09-03——转工单 UPG-86 治理完成（本单）；检测器常驻拦截新坏 manifest |
| 挂账-upg70-manifest缺口 | ✅ 随治理批销项——UPG-70 历史无 manifest 属事实缺口如实在案（后续复验按红线 23 补建，检测器已可拦） |

## 六、历史交付内容零改动声明（STD 销项④）

- 只修**清单形态**：path 裸串化（说明移 note 零丢失）/sha256 补算或显式 missing/producer 规范/绑定值写入/键名统一；
- **未改**：证据本体文件（测试 XML/截图/日志/APK）、交付报告正文、ACCEPTANCE_LOG、各交付的 delivery_id 与三重 hash 登记值（工单表/库登记维持治理前快照口径——治理后 manifest 文件级 hash 有变，映射详见治理 commit `13434e7` diff 与各文件 `_upg86_governed` 字段）；
- 不造假：3 条 APK 被覆盖、4 条源码演进、3 条活文档、2 条描述性引用——**全部显式 missing 声明**（原值保留 note），未补造任何时点 hash。

## 七、Token / KV 申报（0/0）

工单系统侧治理，无请求链路、无 KV 面——0/0。

## 八、已登记两个表

① `工单表.xlsx`（sync 投影，UPG-86 行）；② `工单库.md` UPG-86 卡交付块。报告落 `程序员\交付报告\DELIVERY_UPG86_2026-09-03.md`。

---
*程序员 C · 2026-09-03 · 治理 commit 13434e7（工单系统仓库）*
