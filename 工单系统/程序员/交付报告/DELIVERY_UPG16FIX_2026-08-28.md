# 挂账施工报告：upg16-gradleproperties 四属性丢失（含 gradlew/wrapper 并入）

- **分支/hash**：`feat/upg16-gradle-props` `433a0b1`（基于 main 36d7f6e）
- **日期**：2026-08-28 深夜
- **性质**：挂账-upg16-gradleproperties四属性丢失（P1 仓库级回归）——用户拍板接手施工，**待设计师验证销项**
- **登记**：挂账登记表施工列/证据列已注记（改前已备份 `_备份归档\挂账登记表_backup_upg16四属性施工前_2026-08-28.md`）
- **Token/KV 申报**：无影响（纯构建配置）

## 现象

UPG-16（172e67d）`git rm --cached gradle.properties` 把构建必需四属性（jvmargs/useAndroidX/nonTransitiveRClass/overridePathCheck）连带丢出 git——所有新 worktree/干净 clone `:app:assembleDebug` 必 BUILD FAILED（checkDebugAarMetadata 报 useAndroidX 未启用）。此前全靠各 worktree 手工补本地 gitignore 副本续命（UPG-19 验收、UPG-20 施工各踩一次）。

## 修法

1. **恢复跟踪版 `gradle.properties`**：四行构建必需属性（与 9c81ef9 历史版逐字一致）；`.gitignore` 移除对应条目。
2. **签名四参数迁用户级** `~/.gradle/gradle.properties`：Gradle 官方查找顺序（用户级覆盖项目级）使 `providers.gradleProperty("MOV_STORE_FILE")` 照常可达，且永不入库；项目文件回归纯净可跟踪。存量 worktree 的本地副本（四行+签名参数）不受影响可继续用，不强制迁移。
3. **gradle wrapper 四件套入库**（gradlew/gradlew.bat/gradle-wrapper.jar/gradle-wrapper.properties，8.13-bin）——根除 `./gradlew` 不存在导致的构建脚本静默假跑（UPG-20 施工实录在案，挂账建议明确并入）。

## 施工中发现的新坑（已规避，记入方法论）

**Gradle 读用户级 `~/.gradle/gradle.properties` 按 Latin-1**（与项目级 UTF-8 不同）——中文路径 `品牌管理\签名` 首跑即乱码（`åçç®¡ç®`），keystore 找不到。规避：用户级文件路径写 Java unicode escapes（`C:/Users/Administrator/Desktop/MOV/\u54c1\u724c\u7ba1\u7406/\u7b7e\u540d/mov-release.jks`，正斜杠避开反斜杠转义）。

## 复验（挂账原文判据：任一新 worktree 不打补丁直接构建即证）

| 项 | 结果 |
|---|---|
| 临时 detached worktree（433a0b1）**零补丁**：`./gradlew :app:assembleRelease` | **BUILD SUCCESSFUL 3m9s**，45.5MB release 包——四行属性+签名参数+wrapper 三证合一 |
| 主库 `assembleRelease` + apksigner verify | 绿；**CN=JiangXi PiDan Technology**（与 UPG-16 验收证书一致），V2 签名有效 |
| wrapper 自举 | `./gradlew --version` Gradle 8.13（dists 缓存命中不重下） |
| 签名参数不泄露 | 用户级文件在 `~/.gradle/`（git 不可达）；仓库 grep 零命中 |

## 影响面与交接

- 此后任何新 worktree/干净 clone：**零补丁直接 `./gradlew :app:assembleDebug/Release`**（需 JAVA_HOME=Android Studio JBR，环境性事项已在报告注明；wrapper properties 用 8.13 与本机 dists 一致）。
- 存量 22 个 worktree 的本地 gradle.properties 不强制迁移；未来 rebase 遇该文件冲突时以四行跟踪版为准。
- 设计师验证销项后，本挂账闭环。
