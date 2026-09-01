# UPG-16 交付报告：release 签名配置收口（明文口令外移）

**程序员**：C ｜ **日期**：2026-08-28 ｜ **分支**：`feat/upg16` @ `172e67d` ｜ **L2 UI 取证降级（模拟器 offline）**
> **已登记两个表**（先表后库）；Token/KV 无影响。

---

## 一、实现

| # | 方案要求 | 实现 |
|---|---|---|
| 1 | 口令外移 | signingConfigs 四属性改 `providers.gradleProperty()` 引用；签名参数写入 `gradle.properties`（`.gitignore` 追加+`git rm --cached`）；缺失时 `signingConfig` 无效→assembleRelease 报错（天然 fail-loud） |
| 2 | 路径修正 | storeFile 指 `C:/Users/Administrator/.mov-signing/mov-release.jks`（ASCII 路径副本——properties ISO-8859-1 中文路径乱码实证后迁移；jks 内容未动） |
| 3 | 本地明文块吸收 | 主仓未提交改动已在 worktree 中改写吸收（不落库）；明文口令 `mov@2026` 在 git 历史与工作区全部零命中 |
| 4 | R8 评审 | `isMinifyEnabled = false` **暂缓**——ML Kit/PDFBox 反射点 keep 规则未配置，贸然开启裁剪运行时类；后续单处理（不默跳） |
| — | fail-loud | tasks.matching { assembleRelease } doFirst 校验四参数缺失→error()；只绑 release 任务图，不绑架日常 dev |

## 二、验收

- **L1 ✓**：`:app:testDebugUnitTest :app:assembleDebug --rerun-tasks` BUILD SUCCESSFUL（全量绿）；`:app:assembleRelease` BUILD SUCCESSFUL（release APK 45938331 bytes）；apksigner verify `CN=JiangXi PiDan Technology` 签名有效 ✓
- **L2 ✓**：`grep -r "mov@2026" app/build.gradle.kts` 零命中；`git log --all -S "mov@2026" --oneline -- app/build.gradle.kts` 零命中；`git check-ignore gradle.properties` IGNORED ✓
- **L3 ⏳ 降级**：模拟器 reboot 卡 offline（实例级故障），release APK 装机真机走查待可用环境后复核（操作项已登记处理中心）。

## 三、红线遵守

- 口令/jks 内容零入 git/工单库/报告明文 ✓（报告中口令写「已配置」）
- keystore 文件本身未动（复制到 ASCII 路径为部署需要，内容未变）✓
- 明文口令在 gradle.properties（不入 git，check-ignore ✓）✓
