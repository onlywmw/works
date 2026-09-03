# STD-UPG-87-v1 验收标准冻结版

> 工单：UPG-87 ｜ 标题：内置包启停真实生效（宿主工具组纳入 builtin 包机制）｜ 唯一正式冻结版

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-87-v1`
- **content_sha256**: `805aa4e38987de6ee05ae05dadb27b855873e68174348109de3aadc45a408397`
- **frozen_at**: `2026-09-03T10:05:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | 工具面热挂/摘除+持久化 → diff 精读 + 变异亲杀 + 真机多场景 | ① 宿主工具组（device-control/scene-12306/obsidian）纳入 builtin 包机制（registry kind=builtin+builtinTools 名单），market.enable/disable 对它们真实生效（不再 MARKET_NOT_INSTALLED）；② 禁用=真实摘除工具面（mcpHandlers+allowedTools+MCP 面同步收缩），启用=热挂恢复，重启后状态保持（builtinStates 持久化）；③ 默认态=全量启用（能力零缩减红线——启停是用户显式动作）；④ 摘除后 agent 调用=TOOL_NOT_FOUND（不静默、不半路执行） |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| 摘除逻辑（禁用→工具面收缩） | 禁用只落盘不摘除（恢复旧行为） | 「禁用后 device.* 不在 agent 面+MCP 面」断言必红 |
| 启用恢复（builtinStates 持久化） | 启用不热挂（或重启丢失状态） | 「启用后热挂恢复+重启后状态保持」测试必红 |
| 组名单完备 | 摘除名单漏 tool（如 device.timer 漏摘） | 组内工具全摘断言必红（名单=注册表单源，禁手抄） |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向用例 | 新增内置包启停套件（禁用摘除/启用热挂/重启保持/TOOL_NOT_FOUND/名单完备）+ 既有 McpMarket/UPG-23 总览套件零回归 |
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（0 失败基线） |
| 构建 | `:app:assembleDebug` 绿 |
| 真机 L3 | 平板：本地 tab 关 device-control → AI 面 device.* 不可见不可调（「用手机计时器」→ AI 报没有此能力/TOOL_NOT_FOUND，不弹审批）→ 开回 → 恢复可用；重启 App 状态保持；截图+logcat 含时间戳 |

### 销项条件（下列全满足）

- [ ] 三宿主组纳入 builtin 包机制（名单=注册表/常量单源，禁手抄两份）
- [ ] market.enable/disable 对三组真实生效（不再 MARKET_NOT_INSTALLED）；摘除=工具面真实收缩（agent 面+MCP 面同步）
- [ ] 默认态全量启用（零缩减）；重启状态保持；禁用后调用=TOOL_NOT_FOUND
- [ ] 三变异锚亲杀全红、还原复绿
- [ ] 挂账-upg41v2-内置包启停不可操作 + 挂账-upg23-内置包停用不摘工具面 销项
- [ ] Token/KV 两节申报（工具面随用户启停变化——会话内恒定规则不动，档位说明）

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | 挂账溯源实证 @main fe8cd45：McpMarket.setEnabled builtin 分支（:354-365）只认 registry 包，宿主组不在 registry→MARKET_NOT_INSTALLED；unmountExtTools(:5973) prefix 匹配（「device-control」摘不到「device.*」）；复用 browser builtin 热挂/摘除先例（b3219a6/8fdc8d9）；UPG-84 后默认全量=零缩减，启停=用户显式动作 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-87-v1.md"
```
