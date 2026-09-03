# STD-UPG-77-v1 验收标准冻结版

> 工单：UPG-77 ｜ 标题：审批判定单源化 + MCP 面死信通道处置 + SDK 契约纠偏（P0 安全）｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-77-v1`
- **content_sha256**: `c80c5941420758336394ca0e3cf0be6ef0752b52f5f6b7b997d1fb17dd164f47`
- **frozen_at**: `2026-09-03T00:51:01`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

> ⚠️ 冻结区填完、content_sha256 回填后，**冻结区任何改动都视为标准变更**，只能走修订派生 v2，不得原地改。

---

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | 权限/安全面 → diff 精读 + 变异亲杀 + 真机多场景 | ① open 模式下 MCP 面（:8389）调 only-once 工具不再直出明文；② default 模式下 MCP 面 ASK 请求有真实呈现面（弹窗/通知）且可批可拒，不再产生 req-N 死信；③ 对话面（管线 1）既有安全语义零回归；④ SDK 文案不再含虚假审批承诺 |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| `McpServer.kt:110-113`（tools/call 直查 guard，@014c10f） | 恢复「直查 guard.guard()、不走单源判定」 | MCP 面 only-once ASK 断言测试必红（亲杀） |
| `McpToolScheduler.kt:317-319`（only-once 强制 ASK 覆写） | 删除单源判定中的 only-once 覆写 | FULL_ACCESS 下 only-once → ASK 断言必红（对话面+MCP 面各一案） |
| `McpServer.kt:121`（registerPending 死信产生点） | ASK 分支恢复 registerPending + 返回 APPROVAL_REQUIRED req-N | 「MCP 面 ASK 不再产生 req-N 死信」测试必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 全量回归 | `testDebugUnitTest --rerun-tasks` 真跑，套件计数如实申报（以 XML 为准，注明统计时点） |
| 定向用例 | 新增 MCP 面审批测试（open 模式 only-once→ASK / default 模式 ASK 路由 ApprovalService / 无 req-N 死信）+ 既有 PermissionGuardTest 15 / OnlyOnceGuardTest 8 / ApprovalQueueTest 4 全绿 |
| 构建 | `:app:assembleDebug` 绿 |
| 证据链 | journal/审计足迹（asked+decided 成对）+ 真机 curl 三场景命令输出（含时间戳）+ 关键截图 四环节完整 |
| 真机 L3 | ① default 模式 `curl 127.0.0.1:8389 tools/call vault.get` → 设备出现弹窗或通知 → 点允许 → HTTP 返回明文（足迹 decided=allowed-once）；② 同路径点拒绝/等超时 → HTTP 返回拒绝文案，无 req-N；③ open 模式同路径 → 同样强制弹窗（不直出明文） |

### 销项条件（本单「合格」= 下列全满足）

- [ ] 审批判定单源：MCP 面与对话面共用同一判定入口（only-once 强制 ASK 对两面同时生效），grep 无第二份 only-once 覆写
- [ ] open 模式下 MCP 面调 vault.get 不再直出明文（真机场景③实证）
- [ ] `PermissionGuard.pending` 死信面消除：MCP 面 ASK 路由 ApprovalService FIFO（真机场景①②实证），或经评审裁决的等效方案；`registerPending`/`approvePending` 无残留生产调用
- [ ] `ToolSdkGenerator.kt:221` 虚假承诺（「会再弹一次」）修正为真实语义；SDK 节文案与 STD 一致
- [ ] 三个变异锚亲杀全红、还原复绿
- [ ] 对话面既有套件（PermissionGuard/OnlyOnceGuard/ApprovalQueue/Experience）零回归
- [ ] 交付报告含「Token 影响 + KV Cache 影响」两节（SDK 文案=system prompt 组成部分，必须申报）

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | 标准源自《审批断链评审》（main@014c10f 六路审计）+《审批体系_总纲_v1_评审增补_设计师B》R0 案；外部 MCP 客户端若依赖旧 APPROVAL_REQUIRED+permission.approve 流程将断——依据：main 上该面无 UI 调用点且 pending 不可批（死信），废弃为设计裁决，异议走修订 v2 |

---

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-77-v1.md"
```
