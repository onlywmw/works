# UPG-02 设备类工具包（AVD 内置）· 方案设计 v2

> 设计人：设计师 ｜ 日期：2026-08-26（v1）/ 2026-08-28（v2）｜ 状态：✅ 方案 v2（溯源修正+用户拍板收口），待派单 ｜ 优先级：P0
> v2 说明：**规则 20 设计前溯源首跑**——v1 基线三处失真（老版 34→实 36、新版 6→实 15、screen.capture 虚有）、注册接点指向孤岛（McpToolProvider 零生产实例化）、5 项与新版重复建设。用户拍板 @2026-08-28：**重复项放弃迁移沿用现有，只做真缺口**。
> 依据：老版 `HermesGapProvider`/`SystemToolProvider`/`ExtraToolProvider` 实测 **36 工具**（12+14+10）+ 新版 MainActivity 装配链逐行核实 + `market-web/dev-docs.html` 工具开发规范

---

## 一、背景（v2 基线修正）

老版设备类工具共 **36 个**（HermesGapProvider 12 / SystemToolProvider 14 / ExtraToolProvider 10；生产注册 ToolRegistry.java:1314/1318/1322 + 静态 init(Context) HermesApplication.java:89/91/93，全链路实物）。**新版实有 16 注册 / 15 可用设备 handler**：torch.on/off/status（MainActivity.kt:1492-1494）、vibrate（:1505）、battery.status（:1509）、volume.get/set（:1510-1511）、notification.post（:1512）、bluetooth.status（:1859）、brightness.get/set（:1873-1878）、wifi.status（:1879）、silent.on/off（:1884-1888）、screen.on（:1889）、xiaomi.assist 注册即拒（:1521-1525）。v1 声称的「网络/TTS」不实：network.info 全仓零匹配，TTS 已剔 unavailableTools（:1517）。

## 二、分层溯源图（规则 20 必附，证据 @main 36d7f6e）

| 层 | 判定 | 证据 | 断点处置 |
|---|---|---|---|
| L1 用户可感知 | ⚠️ | 运行时工具面（rebuildAgentTools :5645-5667）+ :8389 回环（:3192-3201）+ 市场 builtin 先例（browser-automation，McpMarket.kt:100-143）三形态均在；v1 未决策走哪种 | **本单定：常驻直挂工具面**（与现有 15 个设备工具同路径，最少新机制）；不进市场（见 §二决策 4） |
| L2 入口/桥接 | ✅带陷阱 | McpToolScheduler.dispatch→PermissionGuard→ASK 弹窗链实物（McpToolScheduler.kt:226-333）；**陷阱：不在任何名单的新工具 else→ALLOW 静默放行（:187-188）** | 本单修：写类必须登记 writeTools（:99-107），验收加变异钉死 |
| L3 服务/数据 | ⚠️ | 设备工具纯本机 API 零网络；例外：qr.scan 老版是 stub 永返 false（ExtraToolProvider.java:97-99）；camera.capture 老版启动 Intent 即返回拿不到照片 + Uri.fromFile 在 targetSdk≥24 崩（:71-76）；老版 screen.capture 落公共目录违红线（HermesGapProvider.java:57-62） | 本单修：qr.scan/camera.capture/screen.capture 按**新开发**估工，不按「迁移」 |
| L4 运行时装配 | ❌ | **v1 注册点 McpToolProvider 是孤岛**（全仓零实例化，仅 McpExtDiscovery.kt 注释提及）；真链路 = mcpHandlers 注册段（:1459-3242）→ McpToolScheduler 装配（:3112）→ rebuildAgentTools（:5645）；配套 toolParamSchemas（:177，缺则 AI 盲调）+ isHardwareTool 白名单（:5613-5618，缺则 HARDWARE 模式不可见）+ ToolRegistry 并行声明（:1582-1593） | 本单修：§五 实现路径已改写 |
| L5 能力实物 | ⚠️ | 老版 36 全实物 ✅；新版 15 可用 ✅；v1 清单 5 项重复（battery/volume/brightness/vibrate/notify ↔ 新版已有）；screen.capture 新版零匹配（真缺口） | 用户拍板：**重复 5 项放弃迁移沿用现有** |
| L6 持久化/事实源 | ✅ | builtin 包状态单写点 market_builtin.json（McpMarket.kt:117-143）；能力探测 unavailableTools 运行时每启重算不落盘（:1503-1526），无平行源；老版 timer 内存态重启丢（SystemToolProvider.java:42） | timer 落盘与否见 §二决策 5 |

## 三、边界与红线（关键决策）

1. **敏感等价语义排除**（不止字面黑名单）：`sms.recent`/`contacts.search`/`location.get` 与黑名单语义等价——按语义排除。**注意黑名单在新版有四处镜像且内容已不一致**（McpToolProvider.kt:30-33 / McpMarket.kt:561-565 / McpExtDiscovery.kt:31-33 同为 sms.read/pay.query…；McpToolScheduler.kt:93-96 却是 payment.pay/sms.send…，且该处是 contains 子串匹配、其余三处精确匹配）——本单先对齐再四处同步，列入施工项。
2. 相机/扫码/日历/通知/定时：写类+隐私类 → 走 ApprovalService ASK。
3. 查询类（传感器/存储/网络/应用列表）：harmless。
4. **产物只落 filesDir**，不进公共目录（老版 scrfix 教训）。
5. **形态决策（v2 定）**：设备工具常驻直挂工具面，不做市场 builtin 包——设备能力是基础能力非可选件，且市场形态需服务端 registry 跨仓依赖，不进本单。
6. **timer 决策（v2 定）**：老版 timer 内存态重启丢；新版做 device.timer 必须落盘（filesDir json），否则不做。

## 四、工具清单（v2 重排：真缺口 13 个，重复 5 项已砍）

| 域 | 工具 | 功能 | 权限级 | 性质 |
|---|---|---|---|---|
| 设备 | `device.network` | 网络类型/信号（新版无此能力） | harmless | 迁移 |
| 设备 | `device.storage` | 存储可用/总量 | harmless | 迁移 |
| 设备 | `device.toast` | 临时提示 | ASK | 迁移 |
| 设备 | `device.appList` | 已装应用列表 | harmless | 迁移 |
| 设备 | `device.appLaunch` | 启动应用 | ASK | 迁移 |
| 传感器 | `sensor.list` | 传感器清单 | harmless | 迁移 |
| 相机 | `camera.capture` | 拍照（FileProvider+结果回调，产物落 filesDir） | ASK | **重写**（老版半成品） |
| 相机 | `camera.ocrCapture` | 拍照直接走 OCR（复接 image.ocr） | ASK | **新造**（老版无） |
| 相机 | `qr.scan` | 扫码（复用仓内 ML Kit 依赖） | ASK | **新开发**（老版 stub） |
| 日历 | `calendar.list` | 近期日程（只读） | ASK | 迁移 |
| 日历 | `calendar.add` | 新建日程 | ASK | 迁移 |
| 定时 | `device.timer` | 定时提醒（set/cancel/list，**落盘**） | ASK | 迁移+补强 |
| 截屏 | `screen.capture` | 截屏（落 filesDir） | ASK | **重写**（老版违红线+新版没有） |

**不迁移（v2 用户拍板）**：device.battery/volume/brightness/vibrate/notify——新版已有同名能力，放弃迁移沿用现有。
**暂不做**（P2 或用户拍板）：`wifi.toggle`/`clipboard`/`media.play`/`settings.get`（bluetooth.list 老版有、新版仅 status，列表查询如需另议）。
**不迁移（原有）**：torch.on/off（新版已有）。

## 五、实现路径（v2 重写——v1 注册点指向孤岛，作废）

1. 新文件 `app/src/main/java/com/mov/android/DeviceProvider.kt`——**照 `HardwareProvider(this)`/`SystemControlProvider(this)` 范式做 `class DeviceProvider(ctx: Context)`**（设备工具必须持 Context；SceneTools/BuiltinMcpTools 的 object 单例范式不适用，照它=再造孤岛）
2. **注册四点配套，缺一工具不进面**：
   - `MainActivity` mcpHandlers 注册段实例化注册（:1459 段）；
   - `toolParamSchemas`（:177 起）同步登记参数 schema；
   - 权限名单：写类进 `writeTools`（McpToolScheduler.kt:99-107），查询类进 harmless（:114-119）——**漏登记 = else 静默 ALLOW，验收变异钉死**；
   - `isHardwareTool` 白名单（:5613-5618）+ ToolRegistry 并行/排他声明（:1582-1593）
3. 黑名单：先对齐四处镜像现有不一致（sms.read vs sms.send 等），再补等价变体四处同步；注意 McpToolScheduler 是子串匹配语义
4. 单测（JVM）：契约断言 + 红名单测试（等价变体被拒）+ **写类漏登记必 ASK 变异**
5. 真机：emulator-5556 逐工具激活验证（journal 实锤）

## 六、验收标准（v2 补强）

- L1：契约单测全绿 + 变异亲杀（描述改占位必红；等价敏感变体必被 dropped；**写类工具从 writeTools 移除 → 调用必须 ASK 而非静默 ALLOW**——针对 McpToolScheduler.kt:187-188 else 分支）
- L2：真机工具面出现（含 HARDWARE 模式可见）；`device.storage`/`sensor.list` 实测返回真值；`camera.capture` 触发 ASK 且产物落 filesDir（截图）
- L3：AI 对话触发 `sensor.list` 调用，journal 有真实 tool_call 链

## 七、待用户拍板（v2 全部结清）

- [x] 重复建设 5 项 → **放弃迁移沿用现有**（@2026-08-28）
- [x] 形态 → 常驻直挂工具面，不进市场（v2 设计师定，最少新机制）
- [x] timer → 做且落盘（v2 设计师定）
- [x] 相机/扫码/日历类 → **全部进第一期**（用户拍板 @2026-08-28：ASK 审批挡着，风险可控）
- [x] 通知/截屏/定时器 → **进第一期**（同上）
