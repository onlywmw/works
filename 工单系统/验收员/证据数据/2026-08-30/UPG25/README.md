# UPG-25 余 10 项验收证据（验收员 · 2026-08-30 凌晨）

**对象**：feat/upg25 @ 62986c2（APK mov-upg25/app-debug.apk，Aug 29 23:59 构建）
**设备**：emulator-5558（GMT 时区，lastUpdateTime 16:24 GMT = 本地 00:24 +8，新包实证）
**流程**：install -r → force-stop → monkey LAUNCHER → 真实 UI 走查（ui_ops tap/swipe/key，CDP 仅观测）

## 证据清单

| 文件 | 场景 | 判据 |
|---|---|---|
| E1-01-chat-chips.png(+ocr) | 聊天页 chips | 三实测点①：dump_evidence E1 节——chips 文本无 ▾ 后缀 |
| E2-01-drawer-rooms.png | 侧边栏抽屉 | 过程图 |
| E2-02-room-popup.png(+ocr) | 顶栏房间名下拉浮层 | 三实测点②：时间行 `… 14:14/14:11/14:08` 单行完整、行高均一 118px、无「19:5\n7」折行 |
| E3-00-drawer.png | 抽屉（工作台/MCP 市场/设置入口） | 过程图 |
| E3-01-settings.png(+ocr) | 设置页 | 三实测点③：我的记忆融列表 ✓ API Key 在 AI 模型组 ✓ 退出登录进账号卡 ✓ 右值单行 ✓（key 脱敏 sk-****ddc6） |
| E13-01-mempage-folded.png(+ocr) | 记忆管理折叠态 | #13：标题 h=45/内容 h=65/meta h=49 均=单行 maxLines 生效；「来源 ession」=takeLast(6) 脱敏非缺陷 |
| E13-02-mempage-expanded.png | 记忆卡点击展开 | 点击不崩；长文本解锁行为受现有数据限制未构造（不污染记忆库，观察项） |
| W12-01-workbench.png(+ocr) | MCP 市场页（tokens.css 共享源） | #12/#10：CDP 观测运行时 .topbar=46px、--danger=#d92d20、--primary=#0E7C5B、加载表=tokens-DI-iJGDV.css |
| dump_evidence.txt | uiautomator/CDP 原文 | 上述判据的可复制文本证据 |

## 结论
- logcat FATAL/崩溃 = 0
- 三实测点 E1/E2/E3 全过；#12/#10 运行时实证；#13 结构性过（长文本解锁=观察项 P3）
- 配套代码层验收（同日）：断言 11 组复绿 + 变异 2/2 亲杀 + §七 #5-#13 锚点全落地
- Forward 已清理（forward --remove），App 停在主界面，无 CDP 导航残留
