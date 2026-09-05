# UPG-103 干净虚拟机走查报告（替验收员执行）

## 环境
- CleanVM AVD（android-36 google_apis x86_64 · pixel_6 · -no-snapshot 零缓存全新虚拟机）
- after.apk（拆后 56333712B）+ before.apk 同机对比
- 登录：验证码登录（17679332556 真短信实收——real 模式全链验证 ✓）
- 模型 key：CDP→ModelSheet→model.update（flash/pro）+ SettingsSheet→credential.setKey（deepseek_key）双通道注入（getKey 回读 sk-****8a52 ✓）
- 移动工具：am start -W 不可用（MainActivity not-exported）→ monkey LAUNCHER + logcat Displayed 口径

## 冷启动（before/after 同机中位对比）
- before 2501ms（2570/2501/2346）｜ after 2309ms（2088/2309/2631）
- 结论：-192ms（-7.7%）拆分后冷启动零退化 ✓

## 场景① chips 两级气泡
- logcat 铁证：turn → step → user → request/header → chunk×4 → assistant → tool_call → tool_result → chunk×11 → assistant → turn/end（battery 工具调用闭环 ×2，[日志 278 事件]）
- 工具调用真实生效：「check the battery level」→「电量 100%，当前没有在充电」✓
- burst_2/3（210793B，与终态差 12KB）= 疑似 chips 显示帧（视觉目测=验收员）
- DOM 查询（CDP markstream WebView）：当前 chips=0（过程性气泡已收起——chips 为 tool_call 期间瞬态）
- 待验收员目测：burst_2.png / burst_3.png（二级悬空展开帧如需可再录）

## 场景② 胶囊 preset 归位 ✓
- ui.getPins 初始 = 3 BUILTIN（tasks 我的能力 / orders 我的订单 / vault 我的资产）
- ui.setPins（v2 对象形态）→ count:3 → getPins 回读三胶囊全还原 status OK ✓
- 主页胶囊条视觉归位（s2_pins_restored.png）
- **P3 发现（建议登记）**：ui.setPins 传非法形态（如 id 字符串数组）时 fromMaps 解析全弃 → 静默清空全部钉选（无容错保留旧值）；前端组装契约下低危，建议 fromMaps 失败时保留旧值或返回 error

## 场景③ uninstall 归位 ✓（builtin 等价验证）
- market.disable("device-control") → {ok:true, builtin, enabled:false, tools:[], prefix:"device-control"}——工具面摘除 ✓
- market.enable("device-control") → {ok:true, enabled:true, prefix:""}——工具面归位恢复 ✓
- market.status(builtin) = MARKET_NOT_INSTALLED（registry 无 builtin 条目——已知行为非回归）
- market.uninstall 市场包链：模拟器「市场已安装」为空（无包可卸）——单测 McpMarketTest 在案（含 uninstall 后 wf 文件删除断言）

## 证据清单
cleanvm_coldstart.md / cleanvm_privacygate.png / cleanvm_login_full.png / cleanvm_login_wall.png / s0_baseline_main.png / s1_battery_reply.png + s1_battery_reply_full.png / burst_2.png burst_3.png / s2_pins_restored.png
