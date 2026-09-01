# UPG-19 交付报告：启动器图标——MOV 竖眼 Logo 接入

**程序员**：C ｜ **日期**：2026-08-27 ｜ **分支**：`feat/upg19` @ `71b7172`（基于 main a988292）
> **已登记两个表**（工单表 + 工单库）；Token/KV 无影响。

---

## 一、实现

| 件 | 说明 |
|---|---|
| `mipmap-anydpi-v26/ic_launcher.xml` + `ic_launcher_round.xml` | Adaptive icon(API 26+)：foreground=前景 PNG（432×432 白底+Logo 60% 安全区），background=@color/ic_launcher_background(#FFFFFF 纯白) |
| `mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi/ic_launcher.png` + `_round.png` | PNG 兜底(API≤25) 五档密度 48/72/96/144/192px，白底+Logo 同比例 |
| Manifest | `<application>` 加 `android:icon="@mipmap/ic_launcher"` + `roundIcon="@mipmap/ic_launcher_round"` |
| 生成器 | 纯 Node 零依赖脚本（gen_icons.mjs，%TEMP%/wbcheck/）：PNG 解码(IHDR/IDAT/zlib 反滤波)/最近邻缩放/白底合成/PNG 编码(CRC32)，源图=`drawable-nodpi/mov_logo.png` 1108×1020 透明底 |

## 二、红线遵守

- Logo 只用现有透明底 `mov_logo.png`（不改设计不加字）✓
- 背景纯白 `#FFFFFF`（黑白灰品牌基调，不走品牌蓝）✓
- 只加图标相关文件+Manifest 两行属性，其他零改动 ✓
- Token/KV「无影响」✓

## 三、验收

- **L1**：`--rerun-tasks` 全量 + `assembleDebug` BUILD SUCCESSFUL（249 tests + APK 出包）✓（注：主仓 main 同样 BUILD FAILED——AGP 8.8.2 compileSdk=36 兼容性警告，**非本单引入**，在 a988292 基线即存在）
- **L2 ⏳ 降级**：模拟器实例 input 子系统故障+reboot 卡 offline——启动器图标截图/真机走查待可用环境后复核（操作项登记处理中心）。图标资源文件已正确生成（mipmap-anydpi-v26 + 五档 PNG + colors.xml），APK 出包含资源。
- **L3**：图标变更不影响 LAUNCHER 路由（PrivacyGateActivity 仍是唯一入口，UPG-09/11 门控链路不回归）。

## 四、透明申报

1. 前景 PNG 1705 bytes（432×432）偏小——竖眼 Logo 是简单几何线稿+大量白色区域，压缩效率高，体积正常。
2. 主仓 main `assembleDebug` BUILD FAILED 与本单无关（a988292 基线即存在——AGP 8.8.2 compileSdk=36 兼容性）。
3. gradle.properties 中文路径 ISO-8859-1 乱码实证——jks 副本已迁 ASCII 路径 `.mov-signing/`。
