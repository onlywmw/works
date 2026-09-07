# UPG-54 安全中心 —— 审验员模拟器复验记录（2026-08-31）

验收对象：feat/upg54 = 9911e67（基底 a665349=53 tip，合并顺序声明成立）
测试构建：assembleDebug @13:59（55,492,960B，与验收现场构建一致）装 emulator-5554
**约束：用户指令「直接开虚拟机审验，不要动真机」——全程未动真机**

## 一、L1 独立重跑（权威重跑）

- 全量 `:app:testDebugUnitTest --rerun-tasks` = **67 套件 482/0/0，skipped=1**（SceneLiveQueryTest 类级 @Ignore 真网络测试）
- SecurityCenterTest = **9/0 全绿**（UPG54 锚1~锚9 全过）
- 与验收报告完全吻合（67/482/0/0）

## 二、变异亲杀 3/3（独立复跑，md5 校验还原零残留）

| 变异 | 注入 | 结果 |
|---|---|---|
| W1 | SecurityCenter 加 `setGrade(g)` API | 「锚1 无直接调级API 反射扫描」FAILED |
| W8 | securityGrade 去 hardBoundaryMin 兜底（恒 user） | 「锚8 全放开恒守硬边界最低B」FAILED |
| W5 | summary「较多打扰」→「体验得分较高」 | **锚9 FAILED**（非验收标注的锚2） |

还原后 md5：19f861a1…（与原始一致），SecurityCenterTest 复跑 9/0 全绿。

**P3 申报差异（W5）**：验收报告称「W5→锚2红」，独立复跑实测 **W5→锚9红**（锚2 未红）。
- 变异把 summary 的 B 档措辞「较多打扰」改成「体验得分较高」；
- 锚2 断言用 `default` profile（A 档「适度打扰」），不命中 B 档变异文本 → 锚2 不红；
- 锚9 断言 `summary(default.copy(rememberEnabled=false))` 命中 B 档变异文本「体验得分较高」→ 锚9 红。
- 变异亲杀成立（1 用例红），但**锚标号描述不准确**——如实记录，P3 口径备注。

## 三、L2 模拟器复验（emulator-5554，全程未动真机）

### 1. 设置「安全」入口（UI 实证）
- 设置一级：原「审批模式」+「安全状态」两行 → 合并为单行「安全」入口（与前端改动一致）
- 进入二级页全要素在场：**A/A 双等级仪表盘 + 摘要「当前：平衡保护 · 适度打扰」+ 🔒 已加密保护·一切正常 + 最低安全保护：B + 操作保护 4 行（审批模式/敏感操作确认/第三方工具访问/自动记住安全偏好）+ 数据保护 3 行（数据足迹/敏感信息显示/数据同步）+ 硬边界 5 徽章**（凭据/资金支付/绝密数据/身份/安全控制，全部「已保护」）
- 证据：upg54_seccenter_ask.png

### 2. 策略实时刷新（核心场景）
- 点「审批模式」ask→never → 审批模式行变「自动放行」+ **体验等级 A→S（少打扰）** + 摘要实时更新「当前：平衡保护 · 少打扰」+ **安全等级保持 A**（计分制 4/10=0.4 精确，max 兜底不降级）
- 证据：upg54_never_refresh.png

### 3. 模式切换 journal 单源转调
- UI 切换 → journal 落账：seq20 `approval/policy never`（单源转调实证）
- 还原 ask → seq21 `approval/policy ask`（已还原持久化，同验收）
- 证据：journal 尾部 seq19-21

### 4. 足迹展开（审计投影只读）
- UI 数据足迹行展开 → 实时投影（审批决定 cancelled/allowed-remembered/allowed-once、审批请求 vault.get/vault.delete 成对）+ 尾注「审计为系统基础能力，始终开启且不可关闭」
- MCP 网关 security.footprint 返回同数据源（12 条，note 同尾注）
- 证据：upg54_footprint_expanded.png

### 5. MCP 网关直调（独立侧面验证）
- `security.overview` → `{ok=true, grades={sec=A, ux=A}, hardBoundary=[凭据/资金支付/绝密数据/身份/安全控制 5 类], hardBoundaryCaption=最低安全保护：B, strategies 六字段, encrypted=true}`
- `security.footprint` → 12 条审批投影 + note「审计为系统基础能力，始终开启且不可关闭」

### 6. 铁律核心：AI 侧远程改模式被 gate 拦（双保险）
- MCP 网关直调 `security.setApprovalMode {mode=never}` → **`[code: PERMISSION_DENIED] 系统底线护栏：security.setApprovalMode 任何模式不可执行`**
- 源码核物：McpToolScheduler systemBaselineDeny 含 `security.set`（:84-87），`contains` 匹配 → 所有 security.set* 归 gate（AI 不可改）
- 旧入口 `approval.setMode` 在 uiOnlyMcpTools（MainActivity:263-265）——不注册 MCP、不进工具面（M3-R2 封死）
- UI 页面桥直调 handler 不经 guard → 设置页可正常切换（用户操作）；**AI 侧双保险均拦**

## 四、代码核物（锚 1-9 + 桥接 + 前端，全部坐实）

- 锚①等级=结果仪表盘：SecurityCenter 无任何 setGrade API（变异 W1 亲杀）
- 锚②策略摘要：summary「当前：平衡保护 · 少打扰」措辞锚定打扰度非得分
- 锚③硬边界五类别含安全控制（凭据/资金支付/绝密数据/身份/安全控制）
- 锚④单源转调：security.setApprovalMode = approvalSetModeHandler = 同一条 setPermissionMode 通道（MainActivity:2889-2891）
- 锚⑤审计不可关：SecurityProfile 无 audit/footprint 字段（反射扫描）；footprint 只读投影
- 锚⑥敏感显示无明文档：值域仅 always_hidden/view_30s
- 锚⑦同步≠对外：dataSync 档位不影响审批判定；setDataSync 诚实空态
- 锚⑧等级 max(用户,硬边界)：securityGrade 里 user.ordinal < hardBoundaryMin().ordinal 兜底
- 锚⑨体验等级=打扰度映射：uxGrade 由 approvalMode/rememberEnabled 推导，非得分
- 前端：SettingsPage.vue 安全二级页 + i18n zh/en 键集 + VaultPage.vue 30s 掩码（setTimeout 30_000 + always_hidden 拦截 + security.overview 单源消费）
- 接线：SettingsSheet allowedPrefixes 放行 security.*；VaultSheet 只放行 security.overview（最小面）

## 五、审验提示（P3 观察，均不阻塞通过）

1. **W5 变异锚标号申报差异**：验收报「锚2红」实为「锚9红」（变异文本在 B 档，锚2 用 default A 档不命中）——变异亲杀成立，标号不准确。
2. **VaultPage.vue 注释「页面卸载清理」**：revealTimers 无 onUnmounted 清理（仅 toggle 时 clearTimeout）；页面在 WebView 内卸载即销毁 JS 上下文，timer 随之消失——实际无泄漏，注释略夸大。
3. **30s 掩码 UI 端到端未全走**：代码路径核物（setTimeout 30_000 + always_hidden 拦截），与验收 P3 口径一致（模拟器 tap 时序未完整观察 30s 自动回掩）。

## 六、环境说明

- 模拟器未配 DeepSeek API Key → AI 对话发送失败（同 UPG-53 环境限制）；安全中心为设置页 UI 面，不依赖对话路径，全要素可独立实证
- 设备 lastUpdateTime 原为 07:01（旧构建），已重装 @13:59 验收构建
