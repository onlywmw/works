# UPG-03 交付：生活场景工具 12306 内置接线（scene.trainQuery / scene.stationLookup）

- **分支/hash**：`feat/upg03` `e3ea812`（基线 = main 36d7f6e + upg16 挂账基建 433a0b1，worktree=mov-upg03 零补丁态）
- **日期**：2026-08-29 00:55
- **登记**：工单表 E4/H4、工单库 UPG-20…（本卡 UPG-03）状态已更新（先表后库）
- **Token/KV 申报**：scene.* 为只读工具零写操作；查询请求真实出网（12306，带 UA/Cookie 动线）；模型/effort 面零改动
- **已登记两个表** ✅

## 现象（方案 v2.1 溯源）

SceneTools.kt 2 工具（scene.trainQuery/scene.stationLookup）在库（bce578d）但**孤岛未接线**——MainActivity 装配只迭代 BuiltinMcpTools.all()，McpToolProvider 零生产实例化。另有站表解析疑似 bug（f[0] 当电报码）。

## 根因（施工中实际挖出 **三个** bug，方案预警了一个）

1. **站表电报码错位**（方案预警✓）：12306 `station_name.js` 每段 `@拼音缩写|站名|电报码|...`——f[2] 才是查询接口要的电报码（VAP/BXP），现行取 f[0]=拼音缩写（bjb）必败。修复：`parseStationTable` internal 纯函数 + f[2] 口径（老版 Ticket12306Stations.java:260-268 同源），curl 真实站表 200/168KB 实证格式。
2. **Kotlin split 字面坑（新增发现）**：`decoded.split("\\|")` 在 Kotlin 是按**字面两字符** `\|` 分隔（非正则）——URLDecoder 后串里无反斜杠 → 永不分隔 → parse 全 null。修复：`split("|")`。这是「查票必败」的第二独立根因。
3. **单测 JVM org.json 是 android.jar stub**（新增发现）：JSONObject 构造/optJSONObject 全 null → 测试报 PARSE_DRIFT 假象。修复：`testImplementation("org.json:json:20240303")`。

## 修法（接线四点全落，02/04 可照抄样板）

1. **装配循环**：`for (t in BuiltinMcpTools.all() + SceneTools.all())`——SceneTools 的 ToolDefinition 自带 execute，走既有 else 通用分支（MockToolRunContext 包装），file.read/write 特判不命中。
2. **schema 随 Provider**：`toolParamSchemas = mapOf(...) + SceneTools.all().associate { it.name to it.parameters }`（不在 :177 静态表人工同步）。
3. **description 随 Provider**：`sceneToolDescriptions` map + rebuildAgentTools 优先取（AI 见真实中文描述而非「MOV 工具: xxx」）。
4. **:8389 暴露循环自动跟随**（遍历 mcpHandlers）。
5. **错误三态+降级策略（v2.1 §四.6）**：`[SOURCE_DOWN]`（风控/网络，重试+端点轮换后）与 `[PARSE_DRIFT]`（结构漂移）进错误文案，失败引导 12306 官方 App/12306.cn；重试上限 1 次轮换端点，禁无限重试。
6. **权限归因（红线）**：scene.* 只读，不在 harmless 名单（:114-119），走 McpToolScheduler 只读 else→ALLOW（免弹窗但归因正确）——零代码改动，文档口径写明。
7. **GUIDE 风控节**：`docs/MCP_TOOL_DEV_GUIDE.md` 新增「七、12306 内置工具风控注意事项」（IP 风控/动线/降级契约/频率纪律/站表口径）。

## 复验

| 项 | 结果 |
|---|---|
| L1 全量 | `testDebugUnitTest --rerun-tasks` **270/0/0**（269+LiveQuery ignored 计 1；SceneToolsTest 6 案含站表解析 2 案、SceneWiringContractTest 3 案） |
| L1 变异 | M1 删 `+ SceneTools.all()` → 接线断言红；M2 parse f[2]→f[0] → 站表 2 案红；M3 删 schema merge → merge 断言红（3/3，还原基线绿） |
| L2 真实查票 | 本机 `SceneLiveQueryTest`（真实 12306 网络）：**2026-08-30 北京→上海 共 55 趟**，【G531】06:08→12:04 商务座 8 张 ¥2315 / 一等座 20 ¥1005 / 二等座…全真实数据——站表修复+竖线解析+JSON 解析全链互锁验证 ✓（@Ignore 手动案留证，防全量反复打真实网络） |
| L3 对话 tool_call | **卡 deepseek_key 环境阻塞，如实申报转复核**（同 UPG-20 L3 口径）；MCP :8389 tools/call 通道与 handlers 已就绪，key 可用后 AI 对话即触发 |
| 官网 12306 卡回补 | 接线通过后由 S-08 口径补（未在本单 scope，交接声明） |

## 排查过程记录（方法论沉淀）

- L2 首跑「未知车站」→ 定位链：站表 URL curl 200（格式实锤 f[2]）→ 主机 JVM 直跑 trainQuery 报 PARSE_DRIFT → debug 测试复刻三私有函数（trust-all SSLContext：本机代理 TLS 拦截 PKIX 不认 12306 证书链，curl 直连通而 JVM 被拒——**测试进程内 trust-all，生产 SceneTools 不动**）→ cookie 105B/queryG 200/JSON 到手 → org.json stub 现形 → split 字面坑现形 → 全链 55 趟。
- 临时调试文件 SceneDebugTest.kt 已删（不入库）；L2 证据 = test-results XML + 报告输出摘录。

## 交接

- 02/04 照抄样板：接线四点改各自 Provider；**红线差异**（02：device.*/sensor.* 非敏感子集；04：SAF 通路+obsidian.file.write 不进 harmless+沙盒穿越拒绝）。
- L3 复核前置：设备 deepseek_key（模拟器 AndroidKeyStore 无法离线注入，需用户侧配合）。
