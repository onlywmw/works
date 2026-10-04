# MOV 工单系统（发行版）

> 一套**本机可跑**的多角色工单流转骨架：看板/引擎 + 机器闸（工具与闸） + 邮局（信件） + 五角色工作位模板。
> agent 不随包发布——引擎**自动扫描本机已装 agent** 并按适配器建连（适配层随相位②交付）。

## 安装（Windows 10+ · cmd 一条命令）

```cmd
powershell -c "iwr -useb https://mov-ai.cn/dl/install.ps1 | iex"
```

- 官网（官方入口）优先，GitHub 回落；下载件一律 SHA256 校验。
- 缺 Node.js/Python 会自动补装（winget 优先）；补装不了会**明说缺哪件、怎么手工装**（不静默）。
- 默认装到 `%USERPROFILE%\mov-ticket`；装完自动**空账本初始化**并出屏**自检三步**（engine status／工具自检／post-office status）＋桌面快捷方式。
- 离线/内网：下载 `mov-ticket-<版本>.zip` 后 `install.ps1 --local <zip路径>`。

## 常用参数

| 参数 | 作用 |
|---|---|
| `--dir <路径>` | 安装目录（默认 `%USERPROFILE%\mov-ticket`） |
| `--local <zip\|目录>` | 用本地包安装（免联网） |
| `--sha <sha256>` | 显式预期包摘要（下载件强校验） |
| `--channel official\|github\|auto` | 取包通道（默认 auto＝官网优先回落 GitHub） |
| `--dry` | 只预览不动盘 |
| `--no-shortcut` | 不建桌面快捷方式 |
| `--uninstall` | 卸载（默认保数据·自动备份数据面） |
| `--uninstall --purge` | 彻底清除 |
| `--check [--local <包>]` | 版本检查：本机 vs 通道最新（works raw／Release API／官网／`--local`）·只读零写（SYS-177） |
| `--upgrade [--local <包>]` | 升级到最新（已最新则零改动退出）；逐件报告＋配置域保留＋偏离单列（SYS-177） |

## 装完怎么用

```cmd
cd /d "%USERPROFILE%\mov-ticket"
node 处理中心\看板\engine.mjs status        :: 看板/工单总览
node 处理中心\机器闸\工具自检.mjs            :: 全量脚本自检
node 处理中心\邮局\post-office.mjs status   :: 邮局邮况
```

- 结构：`处理中心/`（看板·机器闸·邮局·README）｜角色卡 `处理中心/看板/工位/<角色>/AGENTS.md`
- 账本：`处理中心/工单库.md`（新装为空骨架；取号 `node 处理中心/机器闸/取号.mjs <前缀>`）
- 升级：重跑安装命令即幂等升级（机制面更新·数据面保留）；卸载默认保数据。

## 版本检查与升级（SYS-177）

```cmd
install.ps1 --check                    :: 本机 → 通道最新（零写；全通道失败会明说缺件）
install.ps1 --upgrade                  :: 升级到最新（已最新则零改动）；或用 --local <包> 离线升级
```

- **升级报告四类逐件**：`新增`（包内有本机无）｜`覆盖`（本机未改·包内更新·旧件先备份到 `.upgrade-backup-<时间>/`）｜`保留`（**配置域件一律保本机**：账本/工位卡/注册表/词表等；缺失才补默认）｜`冲突`（**本机改过**的机制/模板件·默认保留本机·提示回流上游）。
- **已装清单**：安装/升级后落 `<安装位>/.installed-manifest.json`（版本＋逐件 sha）——下次升级据此识别「本机偏离」，**不静默覆盖**任何本地改良。
- **回流**：本地改良如属通用（如新词表机制），发驿站件给上游收编，随下一版升级下发。
- 维护者发版：`node 处理中心\机器闸\打包分发.mjs --release [--bump minor|major]`（版本递增＋CHANGELOG 段＋含 `UPGRADE_MANIFEST.json` 的发行包）。

## 版本

见 `version.json`（当前 0.1.0）与 `CHANGELOG.md`。
