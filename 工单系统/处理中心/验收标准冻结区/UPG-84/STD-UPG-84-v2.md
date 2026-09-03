# STD-UPG-84-v2 验收标准冻结版

> 工单：UPG-84 ｜ 标题：模式收敛 5→2（工具面去模式化 + 快速/深度思考开关收敛：reasoning 档位绑定模式）｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**
> **派生自 STD-UPG-84-v1**（修订：新增快速/深度思考开关收敛——用户拍板「极简=快速、经典=深度思考」@2026-09-03；v1 永久保留不覆盖）

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-84-v2`
- **content_sha256**: `b279e9788beaead9e812f5583fbecd1ada3e7d9165c732ca581c4e7343bd8416`
- **frozen_at**: `2026-09-03T08:20:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

> ⚠️ 冻结区任何改动都视为标准变更，只能走修订派生 v3，不得原地改。

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
- [ ] 快速/深度思考开关收敛：模型 chip 单选移除 + prefs `mode` 值退役；reasoning 档位绑定模式——**极简=快速（reasoning off + 简洁提示词）、经典=深度思考（reasoning high）**；任何界面不再出现第三组模式开关
- [ ] 档位实证：两模式下各自发起对话，请求体 reasoning effort 与模式绑定一致（极简=无/快速+简洁提示词节、经典=high）——日志/抓包或装配锚断言实证

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | v2 派生依据 | 用户拍板：「极简模式就加上快速模式的提示词，深度思考就和经典模式结合」——reasoning 档位绑定模式、快速/深思开关消失；风险备案：极简浅思考下工具编排可靠性略降，但安全闸为机械确定逻辑（审批/fail-closed/only-once 不吃推理档位），最坏=计划笨一点或多问一句；「自动判深浅」曾有前科被砍（MainActivity.kt:5041 注释），本方案=按模式恒档非自动分流，不犯同一病 |
| 2026-09-03 | 设计师B | 冻结依据 | 用户拍板：「只要两种模式：经典+极简」「极简模式只是画面的极简，不能阉割能力」——5 模式循环（E3 时代工程产物）从用户面退役；UPG-83（tool.call）随 code 模式退役取消（根因消除优于补丁）；两态开关「经典⇄极简」归极简批阶段 1（送审稿入口决策点），不在本单 |

---

| 2026-09-03 | 设计师B | 落脚点清单落定 | 应用户「UI 层也去找找这些模式的落脚点，和后端一并清理，不要乱删」——全仓盘点产出「删 D1-D5 / 改 M1-M4 / 留 K1-K6」清单（见派单附录）：顶部「极简模式」循环按钮（占产品名）删、goalmode/GoalDomain 等功能性资产留、审批面零耦合实证留、演示页文案留；清单=施工唯一依据，确保极简批等后续补修平稳 |

| 2026-09-03 | 设计师B | D1 修正（用户拍板） | 顶部按钮=用户钦定唯一模式切换入口——D1 由「删按钮」修正为「保留按钮+断开五模式循环+改两态经典⇄极简（极简侧主页建成前占位提示，极简批点亮）」；入口不断、迷宫拔掉 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-84-v2.md"
```
