# DELIVERY UPG-45 · Approval Capability Registry（权限能力注册表）

> 程序员 C ｜ 2026-08-30 ｜ 分支 `feat/upg45`（worktree `mov-upg45`，基底 `origin/main 8f8debd`）｜ commit `b758b28`（已 push origin）
> 设计：`设计师\方案设计\审批弹窗_用户授权层_设计_v3_2026-08-30.md`（§五 Registry / §七 单 A）｜ 派单：`设计师\派单\UPG-45_审批_ApprovalRegistry_派单_2026-08-30.md`
> **已登记两个表**（工单表.xlsx + 工单库.md，先表后库）

## 一、交付物

| 产物 | 路径 | 说明 |
|---|---|---|
| 注册表（JSON，机器消费） | `docs/ApprovalRegistry.json` | 54 行 + meta（unknown 模板/防御清单）+ 18 字段/行 |
| 注册表（MD，人读） | `docs/ApprovalRegistry.md` | 同源表格 + 防御清单 |
| 人工语义库 | `docs/ApprovalRegistry.semantics.json` | human-authored 分类（53 行 + unknown/notInFace/meta）——**AI 不决定安全分类** |
| 盘点收集器 | `scripts/approval-inventory-collect.mjs` | 提取工具全集（156）+ McpToolScheduler 名单（含注释剔除）→ build/inventory |
| 生成器（JVM 实跑） | `app/src/test/.../ApprovalRegistryGeneratorTest.kt` | 逐名实跑 `PermissionGuard.permissionTier`（唯一事实源）→ 合并语义 → 落盘 docs |
| L1 verify | `scripts/approval-registry-verify.mjs` | 13 项独立对账（含变异锚） |

## 二、盘点结果（全量，脚本实测非手抄）

- **工具全集**：156（mcpHandlers 字面 149 唯一 + builtin/scene/provider/meta/browser 键去重）
- **名单**：systemBaselineDeny 6 / sensitiveTools 11 / writeTools 33 / harmlessTools 25（字节级提取，注释剔除）
- **注册表 54 行** = ask 20（calendar/camera/device/market/memory.delete/obsidian 写/shell.exec/http.post/qr/screen.capture）+ free 34（harmless 窗口 21 + file.write + vault/credential 语境 12）
- **防御清单 21（notInFace）**：sensitive 11 + baseline 6 + write 未实装 4（bluetooth/wifi on/off——当前 App 无对应工具面，注册为防御事实）
- **approvalMode 与实测一致**：生成器以 permissionTier 实跑赋值（同源）；verify ②按名单 contains 交叉推导复核（gate/ask/free 三分类零异常）
- **risk/reversibility/sensitiveData 三维分列**：每行独立（categories/recipient/quantity），不合并
- **reversibility=low 8 行**：memory.delete / http.post / shell.exec / file.write / obsidian.file.write / vault.delete / vault.credDelete（删除/外发/写覆盖）；payment.pay 未在面——防御清单在册（不可逆事实不丢）
- **unknown 模板**：`approvalMode=ask` + `fallback=无法确定此操作` + `risk=unknown` + `semanticType=unknown`（红线 3 安全默认；红线 2 AI 不决定——risk 无 AI 推定行）
- **高频 priority 排序**：high（calendar 写/camera/market/http.post/memory.delete/obsidian 写/shell.exec/file.write/vault 删除/credential）≥ medium ≥ low——已内嵌每行 `priority`，供单 B 决定人工预置（决定哪些必须人工预置）

## 三、验证证据

- **生成器测试**：`ApprovalRegistryGeneratorTest` 全绿（L1 ②③④⑤ 断言内嵌：字段必填组/unknown 模板/low 无漏/unknownHits=0）
- **verify**：`node scripts/approval-registry-verify.mjs` —— **13 项全绿**（①write/sensitive/baseline/harmless 全量对账 ②approvalMode 名单交叉一致 ③字段必填完整 ④unknown=ask+无法确定+AI 不决定 ⑤low 无漏+支付防御在册）
- **变异亲杀 3/3**（先 commit 后变异，还原复绿）：
  - ①unknown approvalMode 放宽为 free → `④unknown 模板=安全默认 ask...` **必红**
  - ②语义库 http.post reversibility 漏标 low → 生成器 `⑤reversibility=low 漏标` **必红**（**--rerun-tasks 口径**——docs 非 gradle 输入，默认会假绿 up-to-date，变异必须强制重跑）
  - ③注册表删 memory.delete 行 → verify `①全部对账 [memory.delete]` + `⑤low 漏标` **双红**
- **全量**：56 类 **404 用例 0 失败**（--tests 定向 + 全量）
- assembleDebug **BUILD SUCCESSFUL**（37 tasks）；check-token-effect 通过（exit=0）
- 红线核点：**零运行时改动**（未触碰 McpToolScheduler/PermissionGuard 判定、未动工具行为/签名）；解释层（单 B）仅消费本注册表

## 四、Token/KV

- **Token 影响**：0/0（纯登记/文档/测试，无请求链路与运行时改动）
- **KV Cache 影响**：0/0

## 五、L2 / L3（留给验收员）

- **L2 真机抽样**（21770d7d/emulator-5556）：①写文件（obsidian.file.write 或 file.write 越界路径）→ 弹窗出现且 approvalMode 与注册表一致；②删缓存（memory.delete）→ 弹窗 + 注册表行一致；③发消息/通知（notification.post goal 模式）→ 弹窗（无害级失效窗口）或 free 放行与注册表 free 行一致——证据截图 + journal。
- **L3**：与 UPG-01（元数据 desc/schema 同源——注册表 tool 名=面工具名）、UPG-06（防编造——语义全 human-authored，无 AI 生成描述）、BP-03（权限门——本单零改动判定）语义零冲突。
