# 批3-3 hardware 5 真机补验记录

- 补验日期：2026-08-30
- 设备：小米平板 6S Pro 12.4（序列号 21770d7d，型号 24018RPACC）
- APK：main 分支 debug（801b8fc 对应代码），包名 com.mov.android
- 通道：adb forward tcp:8389 → MCP JSON-RPC，tools/call 直调
- 判据：逐工具激活真实结果 + 无崩溃（模拟器跳过项，真机补验）

## 逐工具真实结果

| 工具 | 输入 | 返回 | 判读 |
|------|------|------|------|
| torch.status | {} | `{hasFlash=true, available=true, status=off}` | 初始 off，闪光灯存在 |
| torch.on | {} | `{ok=true, status=on}` | 真实点亮 |
| torch.status | {} | `{hasFlash=true, available=true, status=on}` | 状态机闭合：on 已生效 |
| torch.off | {} | `{ok=true, status=off}` | 真实熄灭 |
| torch.status | {} | `{hasFlash=true, available=true, status=off}` | 状态机闭合：off 已生效 |
| bluetooth.status | {}（首调，未授权） | `{ok=false, error=蓝牙权限未授予——已弹出系统申请}` | 权限拦截路径真实工作 |
| bluetooth.status | {}（pm grant 后） | `{ok=true, enabled=true, name=抹零的Xiaomi Pad 6S Pro 12.4, address=02:00:00:00:00:00}` | 权限授权后返回真实设备名 |

## vibrate 剔除判定

- 工具 `vibrate` 不在 tools/list 中。
- 代码依据：MainActivity.kt:1955-1959 `if (hw.hasVibrator())` 才注册，否则记 `unavailableTools["vibrate"]="设备无震动马达"`。
- 硬件证据：`adb shell getprop ro.odm.mm.vibrator.motor_not_support = true`（系统层声明无震动马达）。
- 判定：设备无震动马达，vibrate 按设备能力探测机制**正确剔除**，非缺陷，无崩溃。

## 判据达成

- 逐工具激活真实结果：✅ torch on/off 状态机闭环；bluetooth.status 真实返回设备名；vibrate 剔除有系统级硬件证据支撑
- 无崩溃：✅ 全部调用返回 JSON-RPC result，无 error 顶层、无异常
- 前台状态：✅ 截屏 `hw5_前台无崩溃.png` 确认 app 前台正常
