# UPG-02 设备类工具包（AVD 内置）· 方案设计

> 设计人：设计师 ｜ 日期：2026-08-26 ｜ 状态：✅ 方案完成，待派单 ｜ 优先级：P0
> 依据：老版 `new-mov` 设备类 provider 实测 34 工具 + `market-web/dev-docs.html` 工具开发规范

---

## 一、背景

老版设备类工具（`HermesGapProvider` / `ExtraToolProvider` / `SystemToolProvider`）共 **34 个**；新版仅电量/音量/亮度/网络/手电/TTS，**缺口大**。设备能力是「AI 帮用户动手」的根基，也是老版最大独有资产。

## 二、边界与红线（关键决策）

1. **敏感等价语义排除**（不止字面黑名单）：老版名单里有 `sms.recent` / `contacts.search` / `location.get`——与开发文档黑名单（`sms.read`/`contact.read`/`location.read`）**语义等价**。设计红线：**按语义等价排除**，并建议把 `sensitiveTools` 黑名单补充等价变体（防绕过），列入本单施工项。
2. **需要相机/扫码/日历读写/通知**：属写类+隐私类 → 走已有 ApprovalService 用户审批（ASK），无审批放行不了。
3. **列表查询类**（传感器列表/电量/网络/存储/音量/亮度/软件列表）：无害级 auto-allow。
4. **数据不出边界**：截图/相机等产物只落应用专属区（filesDir），不进 /sdcard 公共目录（老版 scrfix 教训）。

## 三、工具清单（第一期 16 个，按域命名）

| 域 | 工具 | 功能 | 权限级 |
|---|---|---|---|
| 设备 | `device.battery` | 电量/充电状态 | harmless |
| 设备 | `device.network` | 网络类型/信号 | harmless |
| 设备 | `device.storage` | 存储可用/总量 | harmless |
| 设备 | `device.volume` | 读/设音量 | 读 harmless / 写 ASK |
| 设备 | `device.brightness` | 读/设亮度 | 读 harmless / 写 ASK |
| 设备 | `device.toast` | 临时提示 | ASK |
| 设备 | `device.vibrate` | 震动 | harmless |
| 设备 | `device.appList` | 已装应用列表 | harmless |
| 设备 | `device.appLaunch` | 启动应用 | ASK |
| 传感器 | `sensor.list` | 传感器清单（加速度/陀螺/指南针等） | harmless |
| 相机 | `camera.capture` | 拍照（产物落应用专属区） | ASK |
| 相机 | `qr.scan` | 扫码 | ASK |
| 日历 | `calendar.list` | 近期日程（只读） | ASK |
| 日历 | `calendar.add` | 新建日程 | ASK |
| 通知 | `device.notify` | 发系统通知 | ASK |
| 定时 | `device.timer` | 定时提醒（set/cancel/list） | ASK |

**暂不做**（P2 或用户拍板）：`wifi.toggle`/`bluetooth.list`/`clipboard`/`media.play`/`settings.get`（涉及系统态写入或隐私面，零收益评估后定）。

**不迁移**：torch.on/off、screen.capture（新版已有/已有严格实现）。

## 四、契约设计（按 dev-docs.html）

- 命名：`域.动作` 全小写点分；description 中文真描述 ≥20 字、无占位
- parameters JSON Schema：每字段中文 description + required（模型侧校验，错误走 `INVALID_ARGS`）
- 输出：`{ ok:true, data:{...} }` 成功 / `{ ok:false, error:{ code, message } }` 失败（16 类错误单源）
- 并行：只读类 `isConcurrencySafe=true`；写/相机/扫码类 false（排他）
- 作用域：默认 main；`sensor.list`/`device.battery` 等纯查询可 subagent
- 权限：PermissionGuard 外部名单（工具元数据不声明权限）

## 五、实现路径（示意，具体由程序员）

1. 新文件 `app/src/main/kotlin/com/hermes/mov/tools/DeviceTools.kt`（照 `SceneTools.kt`/`BuiltinMcpTools.kt` 骨架）
2. 注册：`McpToolProvider` builtin 清单 += `DeviceTools.all()`
3. 权限：PermissionGuard 名单追加写类工具（ASK）+ sensitiveTools 补充等价变体（`sms.recent`/`contacts.search`/`location.get` 等）
4. 单测（JVM）：契约断言（同 SceneToolsTest 四件套/描述非占位/参数中文/黑名单）+ 红名单测试（等价变体被拒）
5. 真机：emulator-5556 逐工具激活验证（journal 实锤防声称未调用——老版纪律）

## 六、验收标准

- L1：契约单测全绿 + 变异亲杀（描述改占位必红；等价敏感变体加入名单后必须被 dropped）
- L2：真机工具面出现；`device.battery`/`sensor.list` 实测返回真值（截图）；`camera.capture` 触发 ASK 弹窗（截图）
- L3：AI 对话触发 `sensor.list` 调用，journal 有真实 tool_call 链

## 七、待用户拍板

- [ ] 相机/扫码/日历类是否全部照此开放（还是先只做查询类，写类第二批）
- [ ] 通知/定时器是否属于第一期
