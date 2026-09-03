# UPG-85 派单：预审单 removeAll 缺陷修复（同 tool 多步骤被误移除）

> **派单时间**：2026-09-03 ｜ **派单人**：设计师B ｜ **优先级**：P1（审批绑定正确性——用户批准的计划必须完整）
> **验收标准**：`STD-UPG-85-v1`（content_sha256=`9d82e2b11eea594f07a1fe75f82df8a5039af65b87ecfb3dd52d1313c54d2011`）
> **已查坑位库/复用件库**：是。命中条目：无直接命中（UPG-76 机制背景见下）
> **缺陷实证**：审验独立复现（UPG-80 审验发现①）——`MainActivity.kt:5267` `steps.removeAll { it.tool == info.toolName }`：计划含同一 tool 多个不同参数步骤时**全部被静默移除**，审批单少行=用户批准了不完整计划（例：计划 file.write a.txt+file.write b.txt，当前步=a → b 行从单上消失，执行到 b 时用户毫不知情）

---

## 一、交接基础信息

| 项 | 值 |
|---|---|
| 主仓库 | `C:\Users\Administrator\0027-mov`（基最新 main（8647ee9）开 `feat/upg85` / `mov-upg85`；与 UPG-82（exec-engine）零重叠） |
| 缺陷点 | `MainActivity.kt:5267`（UPG-76 扫描编排段，计划补全轮后 `parsePlanSteps` + `removeAll` + 当前步前置处） |

## 二、一句话

removeAll 按 toolName 全量移除会误删同 tool 的后续计划步骤——改为**只移除首个 tool 匹配行**（当前步的计划行），其余同 tool 步骤保留在审批单上，让「用户批准的」和「实际执行的」严格一致。

## 三、施工范围

1. **修复**：`:5267` `steps.removeAll { it.tool == info.toolName }` → 仅移除**首个** `it.tool == info.toolName` 匹配行（`removeAt(indexOfFirst{...})`，无匹配则跳过）；保留其余同 tool 步骤在单上。
2. **取舍论证**（交付报告必含）：为什么不用「tool+args 严格匹配」——模型补全产出的参数可能与真实 PendingInfo.args 漂移（时间戳/相对路径），严格匹配会留下漂移重复行；首个 tool 匹配在「当前步=首个审批级触发点」语义下定位正确。
3. **测试**：计划含 file.write a.txt + file.write b.txt、当前步=file.write a.txt → 单上 a（真实 args 前置）+b 均在；b 勾选→执行放行、未勾→DENIED 阻断、b 参数漂移→MISS 转新 ASK；PlanApproval 既有 32 用例零回归。
4. **变异亲杀 2 锚**（STD）：恢复 removeAll→红；改为移除末尾/全部匹配→红。

## 四、红线

1. UPG-76 机制零改动扩大化——只修 removeAll 定位，不动执行绑定/扫描编排/Group 语义；fail-closed/only-once/MONEY 语义不变。
2. Token/KV 两节申报（0/0）；MainActivity.kt 纯 CRLF。

## 五、交付与登记

报告落 `程序员\交付报告\DELIVERY_UPG85_<日期>.md`（取舍论证+2 变异亲杀+行为对比证据+「已登记两个表」）；库加交付块 → sync 投影；verify-hash（红线 23）；DEL 绑定三重 hash；共享面=审批编排面，附 coverage_status。
