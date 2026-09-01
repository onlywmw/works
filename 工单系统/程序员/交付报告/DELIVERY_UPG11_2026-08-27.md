# UPG-11 交付报告：首启隐私政策弹窗 + 全量初始化门控（应用宝整改）

**程序员**：C ｜ **日期**：2026-08-27 ｜ **分支**：`feat/upg11` ｜ **终态 commit**：`308cabf`（8021685 → 18ab70b → 308cabf）
**主仓库**：`0027-mov` ｜ **worktree**：`mov-upg11` ｜ **APK**：app-debug.apk 49.4MB

> **已登记两个表**（先表后库）：① `工单表.xlsx` UPG-11 行程序员列 `✅C 完成` + 备注 `feat/upg11 308cabf（报告 DELIVERY_UPG11_2026-08-27.md）`；② `工单库.md` UPG-11 状态改 `程序员✅完成，待验收`。
> 本单不涉 LLM 请求链路（Token/KV 无影响）。

---

## 一、施工方案（与派单文本的关键差异，设计师请知悉）

原方案=MainActivity.onCreate 内 Consent Gate（第一行判定、同意回调续跑 `initAfterConsent`）。施工中发现致命坑并升级为**跳板 Activity 方案**：

- onCreate 体实测约 2600 行且含 `registerForActivityResult` 注册——同意是用户操作后的异步回调，届时 Activity 已 RESUMED，此时注册 ActivityResult 会直接抛 `IllegalStateException`；
- 故改为：**Manifest 唯一 LAUNCHER 移交新建 `PrivacyGateActivity`**。未同意根本不进 MainActivity——所有初始化/收集天然发生在同意之后，**MainActivity 业务代码零改动**（红线「不改任何业务功能逻辑」的最大化满足）；拒绝路径连 MainActivity 类都不触碰。

## 二、实现清单

| 文件 | 内容 |
|---|---|
| `PrivacyGateActivity.kt` 新增 | 首启弹窗：标题/摘要照抄 V1.1 附录；双钮同等显著；`setCancelable(false)`×2 不可绕过；政策全文入口；拒绝二次说明→退出(`finishAndRemoveTask`)，拒绝态零持久化 |
| `PrivacyGate.kt` 新增 | key 常量（`privacy_agreed_v1` 版本化强制重弹机制）+ `needsGate` 纯决策 |
| `PrivacyPolicyActivity.kt` 新增 | 政策全文页：**纯 TextView 只读**（见 §四），零 JS/WebView/外联 |
| `assets/privacy/privacy.txt` 新增 | V1.1 正文照录纯文本 |
| `AndroidManifest.xml` | LAUNCHER 移交 Gate 页；新增 PolicyActivity(exported=false)；**MainActivity exported=false（安全审查修复）** |
| `MainActivity.kt` 仅插入一处纵深防御 | onCreate 首行未同意→重定向回门控页（防未来误导出），位于一切初始化之前 |
| `PrivacyConsentTest.kt` 新增 13 用例 | needsGate 决策表 + Manifest/GateActivity/MainActivity/政策页四层源码资源契约 |

## 三、L1 验证

- `gradle :app:testDebugUnitTest :app:assembleDebug` BUILD SUCCESSFUL（全量绿+出包），PrivacyConsentTest 13/13 绿。
- **变异亲杀**（JUnit console 直跑 class，规避 Gradle up-to-date 假象——过程中曾两次假绿，已定位并换通道）：
  - 变异 A：LAUNCHER 移回 MainActivity → Failures: **2 红** → 还原绿；
  - 变异 B：删 putBoolean 持久化 → Failures: **1 红**（命中「同意先持久化再进主界面」断言）→ 还原绿；
  - 终态还原 OK (10 tests) 后又补 3 条契约仍全绿。

## 四、L2 真机证据链（emulator-5554，项目配置写 5556 但当前在线设备为 5554）

证据目录 `验收员\证据数据\UPG-11\`：

| # | 实证 | 结果 |
|---|---|---|
| L2_01 | 卸载重装首启弹窗截图 + ui dump | 双钮同级等宽([642..810]/[810..978])、标题/摘要/链接文案与 V1.1 附录逐字一致 ✓ |
| L2_03 | 同意前点开《隐私政策》全文 | TextView 版打开正常；**查看后 shared_prefs=0 个文件**（对比：WebView 方案会产生 ChromiumPrefs.xml×2，故中途弃 WebView 改 TextView）✓ |
| L2_04 | 拒绝→二次说明 | 「不同意隐私政策将无法使用本应用」+重新查看/退出应用 双钮 ui dump ✓ |
| 退场 | 点退出应用 | 回桌面(mCurrentFocus=NexusLauncher) ✓ |
| 复查 | 拒绝+退出后 run-as | files 空、shared_prefs=0 ✓；重启后弹窗再次出现（拒绝不持久化合规口径）✓ |
| L2_05 | 同意→权限请求→主界面 | MainActivity focus；**对照出现 mov_prefs.xml(privacy_agreed_v1=true) + mov_biz.xml(device_id) + search.db 等** ——「同意前零 vs 同意后有」强对照闭环 ✓ |
| L2_06 | force-stop 二次启动 | 直进 MainActivity，隐私弹窗不再出现 ✓ |

logcat（本进程 pid 过滤）启动~弹窗期无任何网络调用痕迹（仅 UI 渲染日志）。

## 五、安全审查发现与处置（security_review verdict=block → 已修复）

- **CRITICAL（已修）**：MainActivity exported="true" 是 Manifest 层绕过路径（外部可直达主界面）。修复=exported=false + onCreate 重定向兜底；真机回归：外部 am start .MainActivity → 被重定向回门控页，files/shared_prefs 保持零业务写入。新增两条契约测试锚定。
- **MEDIUM（待设计师拍板，已登记处理中心挂账）**：privacy_agreed_v1 会随自动云备份迁移到新设备导致新机不弹窗；涉及备份策略产品决策，需出 dataExtractionRules 排除方案或拍板接受。
- LOW×2 不采纳（附理由）：① getSharedPreferences 拒绝路径创建空 xml——真机实证 shared_prefs 为空目录，证伪；② 政策日期"未来占位"——2026-08-27 即今日真实生效日，非占位。

## 六、申报事项（透明性）

1. `files/profileInstalled`(24B ART profile marker)：安装后不启动无此文件、首次启动由 androidx.profileinstaller（androidx 传递依赖）写入；二进制性能标记、无用户数据、不联网，判不构成"同意前收集个人信息"，如实申报供验收员核。
2. `app_webview/app_textures/cache` 目录仅在用户**主动查看政策全文**的旧 WebView 版时产生；TextView 版已消除该面，本轮全新安装复测确认不产生。
3. adb 直启 MainActivity 从 shell 有特权可越过 exported 检查拉起组件——但被 onCreate 重定向兜底接住（已在 L2_07 场景实证）。exported=false 已堵死第三方 App 路径。
4. 演示数据已还原：真机流程中同意态为验证用测试机现场，无生产数据影响（模拟器专用设备）。
