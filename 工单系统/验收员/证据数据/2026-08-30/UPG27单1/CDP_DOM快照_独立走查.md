# UPG-27 单1 AI 模型三级管理 UI —— L2 独立走查（验收员 CDP，2026-08-30）

设备 21770d7d · APK assembleDebug 0dc9318（18:30 装）· CDP（9229 adb forward localabstract:webview_devtools_remote_）

- **进路**：侧边栏「设置」按钮（aria-label）→ SettingsActivity（settings.html）→ 设置页 DOM：`MOV 用户/****0000/退出登录/审批模式 ask（每次确认）/我的记忆/MCP 工具市场/我的能力/AI 模型/语言/关于 V1.0`——**「AI 模型」单行（无副题/当前名）✓**；点击 → ui.openModels → ModelSheet（model.html 新 target）
- **二级列表 DOM**：`AI 模型 | DeepSeek V4 Flash（快速对话）· 当前默认 · 快速测试 | Pro · 快速测试 | Flash Vision · 快速测试 | ＋ 添加模型（含本地自部署）`——当前✓/快速测试/启用开关/无供应商小字 ✓
- **三级云端表单 DOM**：`添加模型 | 连接方式 云端/本地自部署 | 模型名/模型 ID/厂商/接口地址/API Key（显示）/设为当前/快速测试/保存`——API Key 显隐 ✓
- **三级本地表单 DOM**：`添加模型 | 模型名/服务地址/模型 ID | 设为当前/快速测试/保存`——**无厂商/无 API Key（key 不采集）✓**
- **真实增**：本地填 Test Local Model/192.168.1.10:11434/test-local → 保存 → 列表第 4 行 `T Test Local Model · 快速测试` + toast「模型已保存」✓
- **编辑态**：点行进编辑 → `编辑模型 | 复制模型 | 删除该模型` ✓
- **删除确认文案**：`删除模型 | 确定删除「Test Local Model」？API Key 将一并删除，不可恢复。| 取消 | 删除` ✓（与派单文案一致）
- **删除执行**：点删除 → 列表恢复 3 模型 + toast「已删除该模型」——**环境还原 ✓**

（程序员已证：setDefault 切换 Flash→Pro→还原 Flash + 复制模型副本入编辑页；本次独立复核核心链闭合并验证删除文案）
