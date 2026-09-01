# UPG-19 R1 重修交付：启动器图标（打回重修）

- **分支/hash**：`feat/upg19` `fa8fdd1`（主体修复）→ `2c6b777`（撞车拆分）→ `82a5322`（变异锚入库）
- **基线**：71b7172（验收打回版）
- **日期**：2026-08-28
- **登记**：工单表 H20 追加注记（E20 状态为并行会话所写，见撞车注记）；工单库 UPG-19 卡已补登记
- **Token/KV 申报**：无影响（纯 res/ 图标 + Manifest 两属性 + tools/ 生成与校验脚本）

---

## 一、现象（验收打回四缺陷）

| # | 缺陷 | 本文更正（P2-1 要求逐条更正旧报告失实） |
|---|------|------|
| P1-1 | 图标 PNG 全白（foreground+五档） | 属实。旧报告「1705B=线稿压缩效率高」归因错误，实为空白图特征 |
| P1-2 | Manifest 零接线 | 属实。旧报告「Manifest 含 icon」自检与 grep 零命中矛盾，此次已实改实查 |
| P1-3 | gradle.properties 四属性丢失 | 独立单（挂账），worktree 本地补丁已有，本单不涉及 |
| P2-1/2 | 报告失实 + 变异锚缺失 | 本次 L1 全部实跑留痕，变异锚入库并双杀实证 |

## 二、根因（两层，均有实证）

**根因①（打回 P1-1 原判）**：`gen_icons.mjs` 的 `decodePng()` 反滤波循环缺行末 `offset += stride`——行 1 起重复读行 0 附近字节（源图顶部透明边距）→ alpha 全 0 → 合成全跳过 → 产物纯白。

**根因②（本次新发现，L2 白盘的真根因）**：修复①后装机仍白盘。定位链：
- APK 内 PNG 与仓库逐字节一致、`aapt dump` 资源表/二进制 Manifest/CRC 逐项核对全对；
- PC 双解码器（node zlib 手写 + PowerShell System.Drawing）逐张统计**完全一致**（foreground 3.07%）；
- 设备端 launcher 与 Settings App info **双白盘**（系统级，非 launcher 缓存，pm clear 后依旧）；
- **单变量对照**：foreground PNG 从 `mipmap-anydpi-v26/` 移至 `drawable-nodpi/`（XML 引用改 `@drawable/`），**同一 node 编码器产物** → emulator-5556 抽屉竖眼立现，暗像素 3.1%（与理论 3.04% 吻合）。

结论：**foreground PNG 放 `mipmap-anydpi-v26/` 时设备端 AdaptiveIconDrawable 消费异常**（PC 可解、设备不渲染）。对齐 Android Studio Image Asset 官方布局（anydpi-v26 只放 XML，前景位图放 drawable）后消除。

## 三、修法

1. `decodePng()` 循环末补 `offset += stride`；生成器入库 `tools/gen_icons.mjs`（可复现，支持 `argv[2]` 指定 resDir）。
2. **生成即自检**：源图暗像素锚（.NET 独立实测 8.44% 对齐）+ 六张产物逐张暗像素阈值 ≥1.5%，全白/错位直接非零退出。
3. foreground 移 `drawable-nodpi/ic_launcher_foreground.png`（432²，中心 60% 安全区，白底），`ic_launcher.xml`/`ic_launcher_round.xml` 引用 `@drawable/ic_launcher_foreground`。
4. Manifest `<application>` 补 `android:icon="@mipmap/ic_launcher"` + `android:roundIcon="@mipmap/ic_launcher_round"`（二进制 Manifest 实证 `0x01010002`/`0x0101052c`）。
5. 断言锚 `tools/verify_icons.mjs`：接线存在性 + XML 双元素 + 六张暗像素断言。

## 四、复验证据（全部实跑留痕）

| 项 | 结果 | 证据 |
|---|------|------|
| L1 出包 | `:app:assembleDebug` BUILD SUCCESSFUL | gradle 输出（15s/56s 两轮） |
| L1 全量 | `:app:testDebugUnitTest --rerun-tasks` **246 tests / 0 failures / 0 errors**（35 类） | app/build/test-results（旧报告声称 249，以本次实测 246 申报） |
| 产物自检 | 六张 PNG：foreground 3.07%、五档 2.56~3.34% | 生成器自检输出 + System.Drawing 独立裁决逐张同值 |
| L2 装机 | emulator-5556 抽屉图标竖眼可见/白底/居中不裁切，图标区 dark=3.1%；线稿 bbox [851,1389][969,1518] 居中 | `验收员\证据数据\UPG-19\程序员R1\R1_抽屉竖眼_白底黑线稿.png` |
| L2 反例留档 | anydpi 布局版白盘（无前景）实拍 | `.../R1中间态_白盘无前景_anydpi布局.png` |
| L3 | 抽屉图标 tap → PrivacyGateActivity topResumedActivity；`am start` 冷启同验 | dumpsys 输出 |
| 变异 M1 | 删 Manifest icon 两属性 → `verify_icons.mjs` 2 FAIL，exit 1 | 脚本输出 |
| 变异 M2 | 删 `offset += stride`（还原打回 bug）→ 源图自检「不透明 0.00%」即刻红，exit 1 | 脚本输出 |
| 基线还原 | 修复版 `verify_icons.mjs` exit 0 | 脚本输出 |

## 五、撞车注记（重要，供验收核对）

修复期间发现**另一会话并行施工同一单**（工作区遗留 `tools/gen_icons.ps1`[.NET System.Drawing 生成器]、`tools/check_drawer_icon.cjs`、20214B 的 anydpi PNG；并于 18:17 登记工单表 E20=「✅C R1 重修完成」，未提交、无 hash）：

- 对方假设「node 编码器产物 Skia 渲染异常」并改用 .NET 重生成——**该假设已被本分支单变量对照证伪**（编码器不变、仅移布局即渲染正常）；
- 对方的 20214B PNG 位于 `mipmap-anydpi-v26/` 为**死资源**（XML 引用 `@drawable/`），不参与渲染、不破坏构建；当前工作区 BUILD SUCCESSFUL 实测通过；
- 按「不抹他人在途施工」纪律，`2c6b777` 将对方半成品**移出本提交（工作区文件原样保留）**；
- **验收以 `drawable-nodpi` 布局装机截图为准**；若验收需要纯净 diff，本分支 HEAD 即纯净（对方文件均 untracked）。

## 六、遗留

- P1-3（gradle.properties 四属性）独立单不阻塞本单；主仓该文件仍缺四行，建议独立小单尽快收口。
- `工单表.xlsx` 的 E21 曾有非法代理对字符引用（openpyxl 不可读），本次登记时顺手合法化修复（&#55357;&#56616; → &#128568;），表已恢复 openpyxl 可读。
