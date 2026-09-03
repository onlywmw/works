# STD-UPG-84-v1 验收标准冻结版

> 工单：UPG-84 ｜ 标题：模式收敛 5→2（工具面去模式化：固定全量 both + code/native/hardware/causal 退役 + SDK 匝道段删除）｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-84-v1`
- **content_sha256**: `3f9e82d8ab01f24893d617a875a786f4cac46abb11dedc012e68befd15c75fd0`
- **frozen_at**: `2026-09-03T08:20:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

> ⚠️ 冻结区任何改动都视为标准变更，只能走修订派生 v2，不得原地改。

---

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L2 中 | 收敛/删除型改造 → grep 零残留 + 全量亲跑 + 真机回归 | ① 工具面=全量（agentToolSchemas/allowedTools = mcpHandlers 非 uiOnly 全集，计数断言）；② 五模式代码面零残留（ToolPresentationMode/codeTools/codeSdk/ToolSdkGenerator/presentation.set_mode/模式循环按钮/系统提示模式声明）；③ 旧 prefs=code 设备启动自动全量（用户平板实证）+ UPG-83 场景回归（读凭据→敏感卡直弹，单次审批）；④ UPG-76 扫描 READ-only 收缩机制零回归（其机制不依赖模式枚举） |

### 变异锚

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| 模式过滤分支（rebuildAgentTools 固定全量化） | 恢复 code 过滤分支（codeTools 面） | 工具面=全集计数断言必红 |
| SDK 匝道段（codeSdk 注入段） | 复活 SDK 节/curl 教学 | 「SDK/curl 教学零残留」grep 断言必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（基线 2 失败在 UPG-81 修复前沿用申报口径，修复后须 0 失败）；涉模式引用的测试逐个处置（删/改有清单，禁 skip 消音） |
| 定向 | 工具面全集计数断言 + 审批系套件（PermissionGuard/OnlyOnceGuard/ApprovalQueue/McpServerApproval/PlanApproval/ApprovalLogic）零回归 + UPG-76 扫描收缩套件零回归 |
| 构建 | `:app:assembleDebug` 绿 |
| 真机 L3 | 旧 prefs=code 设备（用户平板）装新包启动 → 工具面自动全量 → 输入「帮我读取保险柜里『商户名称』的凭据内容」→ **直弹敏感 only-once 卡（单次审批，无 shell.exec 写入卡）** |

### 销项条件（下列全满足）

- [ ] presentationMode 固定 BOTH：五模式过滤分支/循环切换按钮/prefs 读取（旧值回落 BOTH）/ToolPresentationMode 枚举引用全清理
- [ ] codeSdk 注入段 + ToolSdkGenerator.kt + ToolSdkGeneratorTest 删除；codeTools 集合退役
- [ ] presentation.set_mode handler 退役 + uiOnlyMcpTools 名单同步 + 系统提示「当前工具面模式」声明删除
- [ ] 工具面=全量（both）不阉割——**能力零缩减**（用户拍板红线：极简只是画面极简）
- [ ] Token/KV Cache 两节申报（system prompt 变短+跨会话前缀变化一次，量级说明）
- [ ] 两个变异锚亲杀全红、还原复绿；真机回归锚实证

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | 用户拍板：「只要两种模式：经典+极简」「极简模式只是画面的极简，不能阉割能力」——5 模式循环（E3 时代工程产物）从用户面退役；UPG-83（tool.call）随 code 模式退役取消（根因消除优于补丁）；两态开关「经典⇄极简」归极简批阶段 1（送审稿入口决策点），不在本单 |

---

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-84-v1.md"
```
