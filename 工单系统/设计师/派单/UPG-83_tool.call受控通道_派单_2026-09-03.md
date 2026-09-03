# UPG-83 派单：CODE 模式 tool.call 受控通道（SDK 弃 curl 匝道）

> **派单时间**：2026-09-03 ｜ **派单人**：设计师B ｜ **优先级**：P1（用户实测痛点：CODE 模式读凭据先弹「写入」卡+双重审批）
> **验收标准**：`STD-UPG-83-v1`（content_sha256=`2fdc1233b15ffc22410317c35a33778b77b057d6110ef7506ac063cc9275bd0a`）
> **已查坑位库/复用件库**：是。命中条目：复用=UPG-77 单源判定链（guard.decide/isGranted/dispatch——tool.call 内层直走，不新造闸）；坑库无直接命中
> **溯源复核**（红线 20/21，@main 5cf546d 已做）：CODE 面=`codeTools=setOf("shell.exec","tool.help")`（`MainActivity.kt:369`，刻意设计）；CODE 过滤 `:7431`；SDK 生成 `:5152-5161`（directTools=codeTools）+ `ToolSdkGenerator.kt:215-221`（curl 教学，UPG-77 已改 :221）；token 文件 `filesDir/mcp_token.txt`（LLM 已实证可读——2026-09-03 平板 journal）；分层溯源图见工单库 UPG-83 卡

---

## 一、交接基础信息

| 项 | 值 |
|---|---|
| 主仓库 | `C:\Users\Administrator\0027-mov`（基最新 main（5cf546d）开 `feat/upg83` / `mov-upg83`；与 UPG-80/81/82 并行：本单=MainActivity/ToolSdkGenerator/PermissionRegistryData，与 81（测试文件）/82（exec-engine）零重叠，与 80（真机环境）零重叠） |
| 构建 / 单测 | `gradle :app:assembleDebug` / `gradle :app:testDebugUnitTest`（无 local.properties 时 `ANDROID_HOME=D:\Android\Sdk`） |
| 真机 | 平板 `192.168.2.3:5555`（CODE 模式，用户原场景） |
| 关键文件 | `MainActivity.kt`（纯 CRLF）、`ToolSdkGenerator.kt`、`PermissionRegistryData.kt`、`McpToolScheduler.kt`（只读引用） |

## 二、一句话

给 CODE 模式一个一等公民工具调用通道：新增 `tool.call{name, arguments}` 元工具直走 dispatch——内层工具自己的审批面正常弹（vault.get→敏感 only-once 卡），SDK 弃「curl+读 token 文件」教学改教 tool.call。

## 三、施工范围

1. **A1 `tool.call` 元工具**：handler 入参 `{name: String, arguments: Map}`——校验后**直走 `McpToolScheduler.dispatch` 内层调用**（审批/豁免/only-once 语义全继承，不新造闸）；入 `codeTools`（`MainActivity.kt:369`）使 CODE 面可见；`PermissionRegistryData` 登记（approvalMode=**free** + 注释「内层闸自理，不双重审批」）。
2. **A2 安全边界**：**禁调 uiOnly**（对 `uiOnlyMcpTools` 名单直返拒绝）；**禁递归**（`tool.call` 调 `tool.call` 直拒）；内层审批等待与工具超时兜底兼容（审批类内层调用不被 20s 兜底误杀——施工时验证并写明机制）。
3. **A3 SDK 文案**（`ToolSdkGenerator.kt:215-221` 区）：删除 curl+token 教学段，改教 `tool.call`（含「only-once 工具会当次实时确认」说明）；`:5152-5161` 生成逻辑对齐（directTools 仍=codeTools，含 tool.call）。
4. **A4 测试**：tool.call 套件（内层 only-once 必经审批+审批面正确/uiOnly 拒绝/递归拒绝/CODE 面可见/free 登记）+ ToolSdkGeneratorTest 锚（**SDK 不含 `curl 127.0.0.1:8389`** 断言）+ 既有审批系回归。

## 四、红线（违反=打回）

1. **安全语义零改动**：guard.decide/isGranted/FIFO/only-once/fail-closed 不动；tool.call 本体 free 不得豁免任何内层审批；MCP 面注册行为与 tools/call 等价（无新增面——交付报告声明）。
2. **不封堵 curl 物理可达**（shell 解析=脆弱，C 案已否决；SDK 不再教学即可——留评审）。
3. **Token / KV Cache 两节必报**（SDK 节=system prompt 组成：删 curl 段+增 tool.call 段，量级与跨会话前缀变化说明；会话内恒定）。
4. MainActivity.kt 纯 CRLF；变异亲杀 4 锚全红→还原复绿。

## 五、测试方案（验收锚=STD-UPG-83-v1）

- 4 变异锚亲杀；新增 tool.call 套件；ToolSdkGeneratorTest；全量绿。
- **真机 L3（用户原场景复现）**：平板 CODE 模式输入「帮我读取保险柜里『商户名称』的凭据内容」→ **直接弹敏感 only-once 卡**（无 shell.exec 写入卡；logcat `ApprovalVis tool=vault.get`）→ 同意→明文返回；journal 对账 LLM 不再产出 curl :8389 命令。

## 六、交付与登记

报告落 `程序员\交付报告\DELIVERY_UPG83_<日期>.md`（Token/KV 两节+4 变异亲杀+真机场景证据+「已登记两个表」）；库加交付块 → sync 投影；verify-hash（红线 23）；DEL 绑定三重 hash；共享面=工具面/SDK 面，附 coverage_status；挂账-code模式curl匝道双重审批 随交付销项。
