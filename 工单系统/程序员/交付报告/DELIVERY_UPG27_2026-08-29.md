# DELIVERY_UPG27 — Code Mode SDK 生成 + tool.help 按需加载交付（2026-08-29）

> 程序员 C ｜ 分支 `feat/upg27` ｜ 提交 `0efda79`（基底 main af68d22，已 push origin；回滚 = revert 单 commit）｜ 方案 v1.2.1
> 已登记两个表：工单表.xlsx UPG-27 行（程序员 ✅C 完成 + 备注 hash）+ 工单库.md 状态同步（先表后库）
> 认领登记：`认领: C worktree=mov-upg27 branch=feat/upg27 @2026-08-29 23:00`（工单表程序员列，在案）

---

## 交付两件（v1.2.1 全口径）

### 件① Code Mode SDK 提示节生成

- **同源生成器** `ToolSdkGenerator`（com.mov.android，纯函数 JVM 可测）：SDK 节与 tool.help 文档**同一生成器**（红线 6，禁手写工具文档）。
- **目录层**：全量在面工具（= mcpHandlers 全集 − uiOnly，**实测修正**：目录层不是 agentToolSchemas——code 模式 filtered 只剩直呼面 2 个，目录层将空壳化；executeTool 通道无模式塌缩）name + 短描述 + permissionTier 标注；短描述过渡口径 = description 首句截断 + 「（描述待补全）」逐条标注（模板串 → 「（无描述，待登记）」）；summary 源超限 **fail-loud**（红线 7，参数留 summaryOverride 接入点随批 3 summary 字段切换）。
- **签名层**：常用集（配置态 `code_sdk_frequent`，冷启动空=诚实声明「暂无频次数据——可用 tool.help 查任意工具签名」；journal_freq_top.mjs 产物可写入导入）∩ 在面 → `name(p: type, …) [required]` 签名行。
- **调用范式 + 全路径判例**：shell.exec → 127.0.0.1:8389 JSON-RPC tools/call（Bearer token = **运行时注入变量 `$MOV_MCP_TOKEN`**，红线 5）；判例选读类无害 file.read（无副作用可复现）；**引号转义样例**（command 单引号包裹 + JSON 值含单引号 `'\''` 口径 + 中文免转义）。
- **权限双门如实**：外层 shell.exec 恒 ASK（isHighRisk 任意代码执行）+ 内层写类再 ASK；tier 一律经 permissionTier 单源访问器（名单零进 AI 面，红线 2）；SDK 明文「不提供绕过双门的方式」。
- **错误三分声明**（与执行层同口径）：已塌缩 TOOL_COLLAPSED / 真未知 TOOL_NOT_FOUND+近邻 / INVALID_ARGS——各带自纠指引。
- **版本化冻结**：确定性生成（同输入同输出）→ 会话内每轮一致 → 请求前缀恒定；版本号 = sha256(成员+常用集+登记层指纹) 前 8 位；**版本元数据（版本+成员）入配置态 code_sdk**，SDK/长文档文本零落盘（红线不破例）。

### 件② tool.help 按需加载

- `mcpHandlers["tool.help"]` 注册（读类无害 → harmlessTools 免批；**进 codeTools 直呼面**——查文档不再包一层 JSON-RPC 转义）。
- 单查/批量精确名；已登记 → 完整三件套文档（description/parameters/output/tier）；不存在 → `TOOL_NOT_FOUND` + `nearSuggestions[]`（命名空间感知：段匹配优先 → 编辑距离）；入参空/形态错 → `INVALID_ARGS` + 字段指引（对齐 E4 失败结构化口径）。
- **返回 ≤1500 tokens**：超长摘要先行（parameters 压缩为字段名+类型 + truncated 标注）；output 声明缺失容错（批 3 清偿在途，22/22 缺不阻断）。
- **同源断言兑现**：改登记层描述 → SDK 节、tool.help、版本号三处同步变化（测试实证）。

### 配套

- `codeTools` 扩入 tool.help（**L4 唯一改动点 = :284 集合**；声明文本由集合生成 + allowedTools 塌缩同谓词同源）；静态表新增 tool.help 条目（paramSchemaDesc 真字段描述**首用**，UPG-01 件③能力兑现）。
- 调度器 `knownTools` 注入（塌缩分支三分：全集有白名单无 = TOOL_COLLAPSED + shell.exec 指引；全集无 = TOOL_NOT_FOUND + nearHint 近邻；热挂/摘除同步全集；null=行为不变零回归）。
- both/native 模式提示节零改动；presentation.set_mode 不动；默认 BOTH 不变。

## 验证

| 口径 | 结果 |
|---|---|
| L1 全量 | **54 类 383 用例 / 0 失败 / 0 错误 + 1 跳过**（rm -rf 强制重跑 XML 实证；feat/upg27 树 = main af68d22 的 53 类 + ToolSdkGeneratorTest 8 用例） |
| ToolSdkGeneratorTest 8 用例 | 结构完整（声明生成化/目录层/判例全路径/双门/三分/token 预算 ≤7K 断言）/声明生成化（改 codeTools 自动同步）/tool.help 契约（三件套/TOOL_NOT_FOUND+近邻/INVALID_ARGS）/同源断言（SDK+tool.help+版本三同步）/三分执行层（TOOL_COLLAPSED vs TOOL_NOT_FOUND 可区分+近邻）/summary fail-loud/常用集冷启动诚实声明 |
| 变异三条亲杀 | M1 删 SDK 装配 → 红 ✓；M2 tool.help 空返回 → 红 ✓；M3 生成器忽略 registry（同源改单面）→ 红 ✓（还原后绿） |
| assembleDebug / Token | BUILD SUCCESSFUL + `check-token-effect` 通过 |
| 行尾 | MainActivity.kt 纯 CRLF ✓（红线 9）；新增文件统一 CRLF |

## Token / KV 申报（一律 tokens，禁 KB）

- **code 模式工具前缀**：BOTH ≈145 schema（估 **13-18K tokens**，ASCII schema ≈4 字符/token）→ code 模式 = **2 schema**（shell.exec + tool.help）+ SDK 节（目录层实测 **≈2.4K tokens**（138 条 × ≈17）+ 声明/判例/双门/三分段 ≈ **0.9K** → SDK 节合计 ≈ **3.3K tokens**，≤7K 目标 ✓）+ tool.help 按需 ≤1.5K tokens/次（长尾）；**粗算收益 ≈ 3-4x**（与卡面 2-3x 估算同量级、略优——常用集空态时签名层零开销）。
- **默认 BOTH 零变化**（红线 4）✓——BOTH 模式提示节/schema 全量维持原状，token 账不变。
- **KV Cache**：SDK 节确定性生成（版本冻结）→ 会话内字节一致；rebuild 触发点零新增；**不得新增中途变动点 ✓**。
- L3 观察项（prefix cache 命中率/计费 token/长尾主导任务选参正确率）= 真机验收阶段采集（验收员按卡 L2/L3 执行）。

## 红线复核（七条）

1. 不改工具行为/调用签名 ✓（tool.help 为新增工具非改签名）；不新造执行器 ✓
2. 权限名单不进 AI 面 ✓（tier 字符串经单源访问器）
3. 权限口径不变且双门如实 ✓（判例/声明均写实；approval.setMode 零提及）
4. 呈现模式切换入口不动、默认 BOTH ✓（code 分支只影响 code 模式装配）
5. 前缀恒定 ✓（确定性生成+零新增变动点）；token 不明文 ✓（运行时注入变量占位）
6. 同源生成 ✓（buildSdkSection/toolHelpDoc 共用 registry 参数+同渲染语义；声明由 codeTools 生成）
7. tokens 口径 ✓（estimateTokens 计量+上限常量+fail-loud）

## 交付物

| 项 | 值 |
|---|---|
| 分支 / hash | `feat/upg27` / `0efda79`（push origin ✓；首推 e5215de 后 amend 目录层全集修正+CRLF，force-with-lease 重推） |
| 改动面 | ToolSdkGenerator.kt（新增生成器）/ MainActivity.kt（codeTools+装配分支+tool.help handler+静态表条目+codeSdkFrequent+knownTools 注入+热挂摘同步）/ McpToolScheduler.kt（knownTools+塌缩三分+nearHint+harmlessTools）/ ToolSdkGeneratorTest.kt（新增 8 用例）；4 文件 +528/-3 |
| 报告 | 本文件 `程序员\交付报告\DELIVERY_UPG27_2026-08-29.md` |
| 待验收 | L2 真机（code 模式真实任务/双门实测/tool.help 直呼/塌缩自纠）+ L3 对比观察（prefix cache 命中率/计费 token/长尾主导任务）——归验收员 |
