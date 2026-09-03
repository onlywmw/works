# DELIVERY_UPG90_2026-09-03 · UPG-90 尾巴批修（S-06 打回项 ②⑧ + C7 基线测试非确定性）

> 程序员：C（Claude/wmw0027）｜ 认领登记 @2026-09-03 23:22（工单库 UPG-90 卡）｜ 结论：**三件全修 + 亲杀 2 锚 + 全量两跑零 M（c7 面）——待验收员验收**

---

## 〇、交付绑定（SYS-01 P0-2 · 红线 23）

```yaml
delivery_id: DEL-UPG90-20260903-001
standard_id: STD-UPG-90-v1   # content_sha256=59e79222de1f4c8dfeb6b4997099742b7c06b10d083a8fcd6adc72273cea0793
code_commit_sha: 1845cb7     # feat/upg90（基 main fea2fae）
artifact_sha: 不适用（无构建产物变更——market-web 静态站修复 + 测试治理；验收时点 :app:assembleDebug BUILD SUCCESSFUL）
evidence_manifest_sha: 见 处理中心/delivery_UPG90_manifest.json
```

- verify-hash 交付时点 = `HASH_REJECT not-ancestor`（分支未合态必然——同 UPG-82/85/87/88 处置）。

## 一、施工内容（三件）

1. **S-06 ② 引号闭合**：`market-web/index.html:199` `href="explorer.html>` → `href="explorer.html">`（精选工具入口链接）；**链接断言测试**（S06TailFixContractTest）：提取全部 `href="([^"]*)"` 断言可解析（未闭合引号会吞标签尾/属性 → 红）+ explorer.html 目标文件在库（不 404）。
2. **S-06 ⑧ 四死文件**：`make_guide.py`/`make_merchant.py` `git rm` 真实删除；`sms-probe.js`/`run-pc.sh` **git ls-files 实证库内已不存在**（历史已删——现状满足「真实删除」语义）；契约测试锁定四名库内零残留。
3. **C7 确定性治理（STD 方案①：剔除时间戳类字段）**：`C7BaselineGenerationTest` 重构——
   - 生成逻辑抽 `generateBaselineInto(outDir): Triple<grandTotal, sceneTotals, stats>` 可重入；
   - jsonl 导出**剔除 `time` 字段**（实时时钟非确定源；事件序/类型/seq 完整保留基线比对价值——测试有效性不降）；
   - 新增守卫测试 `Z5 基线产物确定性 - 连跑两遍字节一致`（临时双目录两遍生成→逐文件字节比对，**写回 time 字段即红**）；
   - **取舍声明**：不选方案②（产物归 build/）——基线 jsonl 是 UPG-63 Z-5 防线的入库证据（30 会话弹窗计数），归 build/ 会失去版本可追溯；剔除 time 后基线比对价值（计数+事件序）零损失。

## 二、亲杀锚（2 锚 · 全红实录）

| 锚 | 变异动作 | 结果 |
|---|---|---|
| S-06 ② 引号 | 恢复未闭合引号（`href="explorer.html>`） | S06TailFixContractTest 2 跑 **1 红**（href 值非法断言） |
| C7 确定性 | jsonl 写回 `,\"time\":${ev.time}` 字段 | C7BaselineGenerationTest 2 跑 **1 红**（连跑两遍字节一致断言） |

还原后定向复绿 + 全量复绿。

## 三、STD 判据：全量连跑两遍 git status 零 M（c7 面）

```
第一遍 --rerun-tasks：BUILD SUCCESSFUL → git status：c7_baseline_UPG63/ 30 文件 零 M ✓
第二遍（增量）：BUILD SUCCESSFUL → git status：c7_baseline_UPG63/ 零 M ✓（两遍恒定）
```

- 工作区余 5 个 M（UiComponentCatalog/PermissionRegistryData/ApprovalRegistry.json/md/ui-components.generated）＝**CRLF 行尾假差异**（`git diff --stat` 实质为零，worktree checkout 行尾现象——修复前即存在，非本单治理对象、非本单施工物，如实申报）。

## 四、全量回归

| 面 | 结果 |
|---|---|
| 全量 | `:app:testDebugUnitTest --rerun-tasks` **101 套件 744/0/1 全绿**（0 失败基线；748[U88 分支]−7[U88 新增]+3[U90 新增]=744——U90 基于不含 U88 的 main，数字自洽） |
| 定向 | S06TailFixContractTest 2 + C7BaselineGenerationTest 2 全绿 |

## 五、挂账/S-06 卡销项对应

| 项 | 销项 |
|---|---|
| S-06 卡 ② | 本单 ①修复+断言锚（ACCEPTANCE_LOG ef3ad38 打回项闭环） |
| S-06 卡 ⑧ | 本单 ②git rm（2 现删+2 历史已删=四名库内零残留实证） |
| 挂账-C7基线测试非确定性输出 | ✅ 方案①落地+守卫锚（连跑两遍零 M） |

## 六、Token / KV 申报（0/0）

market-web 静态站修复（无请求链路变化）+ 测试产物治理（剔除字段无新增）——Token 0 / KV 0。

## 七、已登记两个表

① `工单表.xlsx`（sync 投影，UPG-90 行）；② `工单库.md` UPG-90 卡交付块。报告落 `程序员\交付报告\DELIVERY_UPG90_2026-09-03.md`。

---
*程序员 C · 2026-09-03/04 · worktree mov-upg90 可随验收流程收*
