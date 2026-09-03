# STD-UPG-83-v1 验收标准冻结版

> 工单：UPG-83 ｜ 标题：CODE 模式 tool.call 受控通道（SDK 弃 curl 匝道）｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-83-v1`
- **content_sha256**: `2fdc1233b15ffc22410317c35a33778b77b057d6110ef7506ac063cc9275bd0a`
- **frozen_at**: `2026-09-03T07:45:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

> ⚠️ 冻结区任何改动都视为标准变更，只能走修订派生 v2，不得原地改。

---

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | 安全通道/工具面 → diff 精读 + 变异亲杀 + 真机多场景 | ① `tool.call` 元工具：入参 {name, arguments} → 直走 McpToolScheduler.dispatch 内层调用，**内层审批面正确呈现**（vault.get→敏感 only-once 卡，不是 shell.exec 写入卡）；② 安全边界：禁调 uiOnly 工具、禁递归（tool.call 调 tool.call 直拒）、tool.call 本体 free（内层闸自理，不双重审批）；③ CODE 面可见（codeTools 含 tool.call）；④ SDK 文案弃 curl+token 教学改教 tool.call；⑤ only-once/fail-closed/UPG-68/77 语义零回归 |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| tool.call 内层路由 | 绕过 dispatch 直接执行内层 handler | 「内层 only-once 必经审批」测试必红 |
| uiOnly 校验 | 删除 uiOnly 拦截 | 调 uiOnly 工具必拒测试必红 |
| 递归校验 | 删除 tool.call→tool.call 拦截 | 递归直拒测试必红 |
| SDK 文案锚 | SDK 节恢复 `curl 127.0.0.1:8389` 教学 | 「SDK 不含 curl 匝道教学」断言必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（基线 2 失败在 UPG-81 修复前沿用申报口径，修复后须 0 失败） |
| 定向用例 | 新增 tool.call 套件（内层路由审批面/uiOnly 拒绝/递归拒绝/CODE 面可见/free 登记断言）+ ToolSdkGeneratorTest + 既有审批系套件零回归 |
| 构建 | `:app:assembleDebug` 绿 |
| 证据链 | 真机截图（含时间戳）+ logcat（ApprovalVis tool=vault.get 而非 shell.exec）+ journal 四环节完整 |
| 真机 L3 | CODE 模式下输入「帮我读取保险柜里『商户名称』的凭据内容」（用户原场景复现）→ **直接弹敏感 only-once 卡（单次审批，无 shell.exec 写入卡）**；同意→明文返回；SDK 面 LLM 不再产出 curl :8389 命令（journal 对账） |

### 销项条件（下列全满足）

- [ ] `tool.call` 入 codeTools + mcpHandlers + PermissionRegistryData 登记（approvalMode=free，注释「内层闸自理」）；内层调用直走 dispatch（审批/豁免/only-once 语义全继承）
- [ ] 禁 uiOnly（对 uiOnlyMcpTools 名单直拒）+ 禁递归 + 内层审批等待与工具超时兜底兼容（审批类内层调用不被 20s 兜底误杀）
- [ ] SDK 文案：`ToolSdkGenerator` 弃 curl+token 教学，改教 tool.call（含 only-once 语义说明）；Token/KV 两节申报（SDK 节=system prompt 组成，量级申报）
- [ ] 四个变异锚亲杀全红、还原复绿
- [ ] 真机用户场景复现：CODE 模式读凭据→敏感卡单次审批（logcat `ApprovalVis tool=vault.get`）
- [ ] 挂账-code模式curl匝道双重审批 销项

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | 挂账-code模式curl匝道双重审批 + 溯源结论：CODE 面=`codeTools=setOf("shell.exec","tool.help")`（MainActivity.kt:369，刻意设计非疏漏——B 扩面案否决）→ 转 D 案（tool.call 受控通道）；curl 物理可达不封堵（shell 解析=脆弱，C 案否决；SDK 不再教学后急迫性低，留评审） |

---

| 2026-09-03 | 设计师B | 工单取消留档 | 用户拍板 5→2 模式收敛（经典+极简，能力不阉割）转 UPG-84：code 模式退役→本 STD 对象消失，UPG-83 取消，冻结版永久留档不删 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-83-v1.md"
```
