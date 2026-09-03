# STD-UPG-79-v1 验收标准冻结版

> 工单：UPG-79 ｜ 标题：审批呈现层组件化（ApprovalSurface + CardShell v1 视觉 + 渠道三修）｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-79-v1`
- **content_sha256**: `97f756ffb01ee27ad86e15ae8bb8ee482869dae340db0e1cc116f9e585cb91cf`
- **frozen_at**: `2026-09-03T05:50:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

> ⚠️ 冻结区填完、content_sha256 回填后，**冻结区任何改动都视为标准变更**，只能走修订派生 v2，不得原地改。

---

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | UI 组件化/权限/生命周期竞态 → diff 精读 + 变异亲杀 + 真机多场景（curl 触发，不依赖 AI key） | ① 呈现层收口为 ApprovalSurface 单组件：弹窗/通知/待办 chip+面板/预审单卡同一数据源（ApprovalService 队列），MainActivity 只留装配；② 视觉=审批卡片_组件设计_v1（居中悬浮卡/环形倒计时+环心队列号/参数卡/单勾选（only-once 无）/支付行锁定/拒绝左同意右/纯黑白+功能红）；③ 渠道三修：通知权限检查、冷启动 action、僵尸窗竞态；④ 组件级测试从零到有；⑤ L0/L1/UPG-76 机制零回归 |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| 僵尸窗守卫（建窗 UI 块内 show 前 `deferred.isCompleted` 检查） | 删除守卫 | 「先 cancel 后建窗不 show 僵尸窗」组件测试必红 |
| 通知权限检查（`NotificationAnswerer.show` 前 `areNotificationsEnabled()`） | 删除检查（恢复直接 notify + 谎称日志） | 「未授权不谎称已发出 + 足迹落『通知未授权』」测试必红 |
| 冷启动转发（`onCreate` 处理 ACTION_ALLOW/DENY） | 删除转发 | 「onCreate 收 ACTION_ALLOW → 审批决策完成」测试必红 |
| only-once 勾选渲染（组件内豁免行行规） | 反转（only-once 也渲染记住勾选） | only-once 卡面无豁免勾选断言必红（UPG-61/68 语义） |
| chip 同源（chip 计数投影自 pendingList） | chip 改自维护计数 | chip 计数与 pendingList 一致性测试必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 全量回归 | `testDebugUnitTest --rerun-tasks` 真跑绿（计数如实，基线预存 2 失败沿用申报口径） |
| 定向用例 | 新增 ApprovalSurface 组件套件（投影/勾选行规/超时 cancelled/僵尸窗守卫/通知权限/冷启动转发/chip 同源）+ 既有 PermissionGuard 15/OnlyOnceGuard 8/ApprovalQueue 4/McpServerApproval 3/PlanApproval 32 全绿 |
| 构建 | `:app:assembleDebug` 绿 |
| 证据链 | 真机截图（含时间戳，视觉对照 demo v2）+ curl 命令输出 + logcat（ApprovalVis/NotificationAnswerer/足迹）四环节完整 |
| 真机 L3（curl 触发，不需 AI key） | ① default `curl tools/call vault.get` → 悬浮卡呈现（环+参数卡+🔒行+无勾选+拒绝左同意右）→ 同意→明文+足迹 decided；② 后台触发→通知出现→点允许→放行；**杀进程冷启动→点通知允许→决策生效**；③ 系统关闭通知权限→后台触发→无通知、日志**无**「通知已发出」谎言、足迹有「通知未授权」；④ 并发 2 个 pending → chip=2 + 环心 1/2→2/2 推进 + 首条超时自动拒绝→次条自动出现 |

### 销项条件（本单「合格」= 下列全满足）

- [ ] ApprovalSurface 单组件落地：buildApprovalDialogView/showApprovalPanel/refreshApprovalChip/closeApprovalSurface/showPlanSheet 五处收编，MainActivity 仅剩装配（answerer/onQueueChanged/presentationCanceller 挂点保留）；三形态+预审单卡同读 ApprovalService 队列（无第二数据源）
- [ ] 视觉按 `审批卡片_组件设计_v1` + demo v2 落地（悬浮卡/环+环心队列号/参数卡/单勾选/支付行锁定/拒绝左同意右）；现原生 AlertDialog 大白话样式退役；令牌引用 tokens 体系不硬编码色值
- [ ] 通知权限：`show()` 前 `areNotificationsEnabled()` 检查——未授权→前台走弹窗、后台如实失败+日志不谎称+足迹「通知未授权」（fail-closed 语义不变）
- [ ] 冷启动：`onCreate` 处理 ACTION_ALLOW/DENY（与 onNewIntent 同路径）；ApprovalActionReceiver 死代码裁决（删或启用，交付报告声明）
- [ ] 僵尸窗：建窗 UI 块内 show 前 `deferred.isCompleted` 守卫（或等价结构），先 cancel 后建窗不出僵尸窗
- [ ] 五个变异锚亲杀全红、还原复绿
- [ ] L0/L1 零改动（guard.decide/isGranted/FIFO/request 语义）；UPG-76 机制零改动（PlanApproval 绑定/扫描编排/Store 逻辑，仅 UI 收编）；fail-closed 不变
- [ ] 交付报告含 Token/KV Cache 两节（预期 0/0，零请求链路）

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | 总纲 R1（`审批体系_总纲_v1` + 评审增补）；视觉口径=用户拍板 demo v2（`设计师\设计预览\审批弹窗_重设计_demo_v2_2026-09-03.html`）+ `审批卡片_组件设计_v1_2026-09-03.md`；三修=挂账-审批弹窗僵尸窗竞态/挂账-通知权限静默丢弃日志说谎/挂账-通知按钮冷启动action丢失（三挂账随本单转工单销项）；预审单卡真机场景仍属 挂账-upg76-L3真机补验四场景（AI key 恢复后补，不在本单真机范围） |

---

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-79-v1.md"
```
