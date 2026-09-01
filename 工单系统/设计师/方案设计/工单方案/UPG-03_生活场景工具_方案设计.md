# UPG-03 生活场景工具（12306 内置）· 方案设计 v2

> 设计人：设计师 ｜ 日期：2026-08-26（v1）/ 2026-08-28（v2）｜ 状态：✅ 方案 v2（溯源修正+用户拍板收口），待派单 ｜ 优先级：P0
> v2.1（2026-08-28 大神速览收口）：补降级策略（查票失败引导 12306 官方 App/网页，禁无限重试，§四.6）；schema 随 Provider 走（§四.1）。
> v2 说明：**规则 20 设计前溯源首跑**——v1 三处地基失真：①SceneTools.kt 在库但孤岛（McpToolProvider 零生产实例化，装配点全文未提）②站表解析疑似 bug 已随移植扩散（Kotlin 侧 f[0] 当电报码，老版正确取 f[2]）③**地图线新旧两侧都无 KEY 链路实物**（老版 saveAk/init 零调用方，地图工具实践中从未可用）。用户拍板 @2026-08-28：**地图线删除不做，12306 单线先走**。
> 依据：老版 `Ticket12306Provider.java` 实测 **8 工具**（非 v1 的 6/7）+ 新版装配链逐行核实 + 开发文档实验结论（2026-08-26）

---

## 一、背景（v2 基线修正）

老版 12306 线实测 **8 工具**（Ticket12306Provider.java:27/75/87/114/143/173/198/246，含 v1 漏列的 `get-current-date`；真实实现 Ticket12306Source.java:234/255/295/342/401；生产注册 ToolRegistry.java:1336）。~~百度地图线~~ **已删**（v2 用户拍板——溯源实证老版地图从未可用：`saveAk`/`BaiduMapProvider.init` 零调用方 → AK 恒空 → checkFn 拦截不注入，BaiduMapProvider.java:36-38）。

新版现状：`SceneTools.kt` 2 工具（scene.trainQuery/scene.stationLookup）已在库（main `bce578d`，含契约测试 SceneToolsTest.kt 4 案）但**未接线运行时工具面（孤岛）**——v1「新版为 0」与「已有实验代码」自相矛盾，实物是「在库不可达」。

## 二、分层溯源图（规则 20 必附，证据 @main 36d7f6e）

| 层 | 判定 | 证据 | 断点处置 |
|---|---|---|---|
| L1 用户可感知 | ❌ | 新版 scene 工具不可达（孤岛）；官网 12306 卡因未接线已撤（ACCEPTANCE_LOG S-08 段）；市场 registry 无 scene 包 | 本单修：接线后补官网卡（S-08 遗留口径） |
| L2 入口/桥接 | ❌（机制实物在案） | 调度链实物：McpToolScheduler 装配（MainActivity.kt:3112）+ 审批分诊（McpToolScheduler.kt:171-200）；mcpHandlers 注册段（:1459-3118）无任何 scene.* 条目。注意：`scene.*` 不在 harmless 名单（:114-119），走只读 else→ALLOW（:187-188）——效果=免弹窗，但归因要写明 | 本单修（随 L4 接线） |
| L3 服务/数据 | ⚠️ | 12306 动线实物（铸 cookie SceneTools.kt:85-95、动态路径 :97-101、c_url 轮换 :181-191、竖线解析 :123-158）；**站表解析疑似 bug：SceneTools.kt:50-57 取 f[0] 当电报码，与老版 10 字段分组取 f[2]（Ticket12306Stations.java:260-268）矛盾**；server.mjs:29 同款已挂账（工单库 S-06 段） | 本单修：站表 bug 随单真实响应验证修复，不修查票必败 |
| L4 运行时装配 | ❌ | **断点核心**：MainActivity.kt:3121 只迭代 BuiltinMcpTools.all()；McpToolProvider 全库零实例化（SceneTools 唯一引用点 McpToolProvider.kt:27 因此是死链）；SceneToolsTest 是测试调用不算生产 | 本单修：接线四点（见 §四） |
| L5 能力实物 | 老版 ✅ / 新版 ⚠️ | 老版 8 工具全实物；新版 2 工具实现完整但孤岛；命名 scene.* 与老版 get-tickets 系无冲突，无重复建设 | — |
| L6 持久化/事实源 | ✅ | 站表内存缓存 24h（SceneTools.kt:35-41）无落盘无平行写点，可接受 | 声明不依赖 |

## 三、工具清单（v2：12306 单线 2 个，老版 8 个为事实源参照）

| 工具 | 功能 | 说明 |
|---|---|---|
| `scene.trainQuery` | 查余票车次（车次/时间/历时/席别票价与余票） | 老版 get-tickets 移植；参数 date/fromStation/toStation（+可选过滤） |
| `scene.stationLookup` | 关键词查车站名/站码 | 配合 trainQuery（老版 get-station-code-by-names 简化） |

老版其余 6 个（get-stations-code-in-city / get-station-code-of-citys / get-station-by-telecode / get-interline-tickets / get-train-route-stations / get-current-date）为后续批候选，本期不迁。

## 四、方案（v2 重写施工内容）

1. **L4 接线（本单核心，v1 全文未提）**：MainActivity.kt:3121 循环后追加 `SceneTools.all()` 迭代（复用 :3159-3173 通用分支）+ 同步 toolParamSchemas——**schema 随 Provider 走**（SceneTools 自带 schemas 表，MainActivity 注册段一次 merge；不在 :177 静态硬编码人工同步，防工具增多后遗漏）；:8389 暴露循环（:3192-3201）自动跟随
2. **站表 bug 随单修**：以真实 12306 响应验证字段顺序（老版 f[2] 口径），Kotlin 侧修正；server.mjs 侧同款在 S-06 挂账不动
3. **错误分类移植**：老版 H1 归因三态（REASON_SOURCE_DOWN/PARSE_DRIFT/NOT_CONFIGURED，Ticket12306Provider.java:46-49）落入新版错误契约（v1「按 dev-docs.html」无落点）
4. **风控注意事项施工**：`docs/MCP_TOOL_DEV_GUIDE.md` 补 12306 风控节（挂账登记表 :41 在案，⏳挂账待审→随本单销）
5. 权限归因写对：scene.* 只读走 else ALLOW（非 harmless 名单），方案/验收口径一致
6. **降级策略（v2.1 新增，进契约）**：App 内置只绕开数据中心 IP 风控，设备指纹/频率风控仍在——查票失败时**引导用户打开 12306 官方 App 或网页**，输出降级文案+错误分类，**禁止无限重试**（重试上限 1 次轮换端点，再败即降级）

## 五、验收标准（v2 补强）

- L1：契约单测全绿 + 变异亲杀（描述/参数缺栏必红；**接线断言：SceneTools.all() 存在生产迭代点**——防「函数在、链断」）
- L2：真机 `scene.trainQuery` 真实返回车次（截图 + journal）——**此条同时实证站表 bug 已修**（修不好查票必败，天然互锁）
- L3：AI 对话「帮我查北京到上海高铁」→ journal 里 scene.trainQuery 真实 tool_call（不能只测函数）
- 归官网：接线通过后，官网 12306 卡回补（S-08 撤卡遗留）

## 六、待用户拍板（v2 已结）

- [x] 地图线 → **删除不做**（@2026-08-28：老版从未可用，KEY 链路不存在，属新建设非迁移）
- [x] 12306 形态 → App 内置（v1 实验结论：数据中心 IP 被 12306 风控 5/5，server 化方向已废弃）

## 七、Token 影响 / KV Cache 影响（AGENTS.md 硬规则 1 申报，@2026-08-29 设计师合 main 补正口径）

- **Token 影响**：tools 字段 +2 schema（scene.trainQuery / scene.stationLookup），会话开始装配定型——每轮请求固定 +2 工具 schema（量级百 token 内），会话内不变；
- **KV Cache 影响**：请求前缀字节稳定——工具增删仅会话开始生效（硬规则 2 合规），会话中途不变动。
- （注：交付报告原「Token/KV 申报」行口径答偏（答成写操作/出网面），经审验员指出，以此节为准。）
