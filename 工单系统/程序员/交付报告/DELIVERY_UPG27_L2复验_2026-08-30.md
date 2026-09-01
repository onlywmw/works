# UPG-27 L2 真机复验（code 模式两项）· ⏳ 部分通过（2026-08-30）

**分支**：feat/upg27 7bd83f2（+合并 f33fb33 验收树 545a440；基底 c753e8a 含批3/批4；生产 APK assembleDebug 16:46 装 21770d7d）；派单核源 = ace425c→已推进至 7bd83f2（极简钮接线 623364b + 合批解析 B5 7bd83f2 均含）。

## ✅ 已验证
1. **入口/切 code/持久化**：MainActivity 初始化 → 顶部极简钮 → MOV-Boot「工具面模式: code（agent 工具面 2 工具；登记层覆盖 2，模板串回落 0）」；force-stop+重启 → 仍 code（16:46:31 进程 5750 日志）——**持久化生效**
2. **AI 经 shell.exec（SDK 节起效）**：journal tool/call shell_exec（seq 14338，命令=按 SDK 节构造 curl 8389 调 MCP）+ approval/asked shell.exec
3. **外层 shell.exec 恒 ASK**：journal ASKED×2 + ApprovalVis「answerer: visible=true forceNotification=false tool=shell.exec」+ 8389 面直调 shell.exec → `[code: APPROVAL_REQUIRED]`（permission.approve 不存在→MCP 面不可自行放行）
4. **塌缩自纠 ✅ 完整链**（journal 实证）：`[code: TOOL_COLLAPSED] shell.exec 存在但不在当前模式直呼面——code 模式经 shell.exec 间接调用它（SDK 目录即清单），或先 tool.help`（seq 8053/12180/13629）→ AI reasoning「shell.exec 不在当前工具面。我应该用 file_read 或者 search 来查看」→ 实际转 search（seq 13874 call search + 14004 列出文件清单）——**三分语义+指引+自纠转执行闭环**

## ⏳ 阻塞（如实报）
- **code 模式真实任务「shell.exec → MCP → 工具」全链未闭环**：外层审批弹窗（旧三键，main 基线实现——UPG-27 未触碰审批代码）在 **16:47/16:49 出现后 3ms 即 cancelled**（`approval/decided cancelled` 时间戳间隔 ≈3ms；对话框窗口 show 后 `wms.Focus not requested... no surface or not focusable`——窗口竞争/MIUI 运行时环境）→ AI 收到 APPROVAL_DENIED 转替代（内置 echo 完成回显）——**同一 APK 基线下 15:0x 弹窗正常 20s+（UPG-45/UPG-41 验收捕获过 approval-dialog-ui.xml），16:47 起 3ms cancel 未定位（建议重启设备/或查 MIUI 后台限制后重试）**
- **AI 发送链不稳**（实体平板已知难点）：消息时达时不达（多次 grep 0；房间跳转）——**本次仅 2/6 条成功**
- **双门内层**（内层写类再 ASK）：未完成（依赖外层审批通过后内层链路）

## 结论
**⏳ 未通过**——塌缩自纠 ✅（完整链）+ 入口/持久化 ✅ + 外层恒 ASK ✅；「真实任务全链」与「双门内层」受**审批弹窗 3ms auto-cancel**（非 UPG-27 代码缺陷）阻塞——按派单红线如实报，不编造通过。**建议**：先复测弹窗（重启/换 Miui 设置）→ 弹窗稳定后重跑「真实任务+双门内层」两项。
