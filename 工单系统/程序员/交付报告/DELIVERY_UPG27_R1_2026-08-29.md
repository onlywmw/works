# DELIVERY_UPG27_R1 — 打回修复交付（2026-08-29）

> 程序员 C ｜ 分支 `feat/upg27` ｜ 提交 `ca47f01`（基底 0efda79，已 push origin）｜ 轻量批三项
> 已登记两个表：工单表.xlsx UPG-27 行（程序员 ✅C R1 完成 + 备注 hash）+ 工单库.md 状态同步（先表后库）

---

## ① 🔴 M1 申报失实（变异存活）——装配点锚补全

- **验收实证**：验收员临时 worktree 将装配分支 `if(false)` 短路后全量 383 用例 0 失败——0efda79 的 M1 实际存活（当时 M1 跑 `--tests ToolSdkGeneratorTest` 过滤=纯函数测试，覆盖不到 MainActivity 装配分支；UPG-21「变异亲杀申报必须真跑复核」教训再犯，如实认领）。
- **修复**：新建 `CodeModeWiringContractTest`（JVM 源码活行锚，SceneWiring/MemoryCoverWiring 同模式）：
  1. `if (presentationMode == …CODE) {` **条件行精确形态锚**——验收员原变异（if(false) 短路）条件行变形即红（**R1 复核实证必红**）；
  2. `ToolSdkGenerator.buildSdkSection(` 调用活行锚（删调用/注释必红）；
  3. `knownTools` 三处同步计数锚（装配+热挂+热摘 ≥3 活行，漏一处三分失真）。
- **覆盖边界如实申报**：锚为形态级（if 条件行变形/删调用/注释即红）；「无条件调用」类可达性行为面归 L2 真机（code 模式 SDK 节可见性本就在 L2 验收清单）。
- **复核（全量口径真跑，弃用 --tests 过滤）**：M1 `if(false)` 短路 → 红 ✓（原变异形态必红）。

## ② 🟠 outputHint 编造输出声明（P2）——诚实化

- **验收实证**：toolHelpDoc 的 `docs[].output` 用输入 properties 键冒充「顶层返回键含: path」（file.read 实测返回 `ContentBlock.Text` 无顶层键）；有参工具全中招。
- **修复**：`outputHint` **恒「（output 声明待登记——批 3 清偿在途）」**（ToolDefinition.output 为 render 投影、schema=null，无结构化顶层键可声明；批 3 清偿后由登记层 output 声明接入）；ToolSdkGeneratorTest 锁死（三个抽样工具断言恒待登记 + 禁「顶层返回键含」编造形态回潮）。

## ③ 🟡 申报更正

- ToolSdkGeneratorTest 实测 **7 个 @Test**（0efda79 报告称 8，笔误）；M1 表述以本报告与锚测试为准。

## P3 顺带（验收建议）

- nearSuggestions（生成器）/nearHint（调度器）双实现**对账断言**补入：同输入（file.redd）下调度器 TOOL_NOT_FOUND 错误文本必须含生成器近邻 top1（双实现漂移即红）。

## 复核与验证

| 口径 | 结果 |
|---|---|
| 变异复核（**全量口径真跑**） | M1 `if(false)` 短路 → 红 ✓；M2 空返回 → 红 ✓；M3 忽略 registry → 红 ✓；还原后全量绿 ✓ |
| L1 全量 | **55 类 388 用例 / 0 失败 / 0 错误 + 1 跳过**（rm -rf 强制重跑 XML 实证；= 0efda79 的 383 + CodeModeWiring 3 + ToolSdk 新增 2） |
| 新增测试 | CodeModeWiringContractTest 3 用例 + ToolSdkGeneratorTest 增 output 诚实化/双实现对账 2 用例（全 9） |
| assembleDebug / Token | 绿 + check-token-effect 过 |

## L2/L3 处置（遵验收口径）

L2 真机四项**先修后验**（本批两项修复改 SDK 节与 tool.help 内容，先跑会失效）——随复验执行；L3 观察项随 L2 同批。

## 交付物

| 项 | 值 |
|---|---|
| 分支 / hash | `feat/upg27` / `ca47f01`（push origin ✓，0efda79..ca47f01） |
| 改动面 | ToolSdkGenerator.kt（outputHint 诚实化）/ CodeModeWiringContractTest.kt（新增 3 用例）/ ToolSdkGeneratorTest.kt（+2 用例）；3 文件 +106/-6 |
| 报告 | 本文件 `程序员\交付报告\DELIVERY_UPG27_R1_2026-08-29.md` |
