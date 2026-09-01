# DELIVERY_UPG25v2_2026-08-30（程序员 C）

**工单**：UPG-25 打回重修 v2——UI 瑕疵批修（规范 v1 §七 13 项全量），**在已合 UPG-40 的最新 main（3263f10）上重做**
**分支**：`feat/upg25-v2` @ **2ccce25**（已 push origin；worktree=mov-upg25v2；基于 main 3263f10 重切）
**认领**：工单表 UPG-25 行 @2026-08-30 03:10 登记「🔄 打回重修 v2 在施」

---

## 一、重做方式与冲突裁决（派单红线：保留 upg40 换肤，只追加 UPG-25 细节，不覆盖不回退）

1. **49e9760（chips 去▾ / 房间浮层时间防折行 / 设置页结构三改）**：cherry-pick 干净完成（源码 6 文件自动合并，冲突仅 settings 生成物→重建消歧）→ f8d8e00
2. **62986c2（余 10 项）+ 49e9760 三点**：对 18 个源文件做文件级三方合并（`git diff 62986c2^..62986c2` 增量 + `git merge-file` 打到 ours 上），冲突 4 文件**按派单「解冲突保留两边」裁决**：
   - **MainActivity.kt / PhotoAskSheet.kt**：文本/底色调 **UiTokens**（62986c2 #6 单源），**primary 保留 upg40 的 `ContextCompat.getColor(R.color.mov_primary)`**（换肤红线：原生 mov_* 单源；62986c2 硬值 0xFF0E7C5B 弃用）
   - **WorkbenchPage.vue / demo.js**：avatarBg 保留 **upg40 的 `#80868F`**（upg40 已收编游离色 #7c5cff；v2 不覆盖——**#11 项此二文件以 upg40 为准**，其余游离色/蓝阴影/顶栏等 v2 落地）
   - 新文件 3（UiTokens.kt/tokens.js/design_token_assert.mjs）取 62986c2 版；产物全站重建（upg40 皮肤值段 + v2 细节合体后 sync-pages 76 文件，幂等一致）
3. **13 项对账（upg40 后现状 → v2 终态）**：13 项全部达标（断言脚本对账实证）；其中「顶栏 56→46」「JS danger 单源」「sheet 底色 s0」等在 upg40 后存在部分残留——v2 全清

## 二、验收证据（L1）

- `node tools/design_token_assert.mjs` **11 组断言全绿**：字号禁用档/旧文本色 0xFF1F2329|8A919C|5C6470/灰系 parseColor/PhotoAsk 15dp 圆角/裸px 8f/裸px 清单模式/JS #d92d20/#7c5cff/蓝阴影/顶栏 56px + tokens.js↔tokens.css DANGER 对齐
- **变异亲杀 2/2**：M1 顶栏 46→56 → 断言红；M2 tokens.js DANGER 改值 → 对齐断言红；恢复后 PASS（断言非恒真）
- **L1 全量**：`--rerun-tasks` 真跑 43 tasks 全 executed——**53 类 382 tests / 0 failed / 1 skipped** BUILD SUCCESSFUL；`:app:assembleDebug` 绿
- `check-token-effect.mjs HEAD` **exit=0**（纯 UI 未触请求链路）
- WebViewWarmupTest 哨兵（62986c2 单源化适配版）随合体重放保留

## 三、Token/KV 申报

- **Token 影响：不变**（纯 UI 渲染面，零请求链路改动；check-token-effect exit=0）
- **KV Cache 影响：不变**

## 四、待验收（交付方留口）

- **L2 真机**：13 项逐项对照规范值截图（emulator 可装 app-debug.apk）
- **L3 换肤零回归**：候选 C 仍在（mov_primary 资源单源保留；皮肤=纯值段 token 契约未动——upg40 相关零改动实证：tokens.css 仅 .topbar 46px 一行变更 + 无 colors.xml/候选 C 触碰）

## 五、红线自查

①不改工具行为/签名 ②描述真实性（无 UI 文本编造）③近邻差异点（v2 沿用 v1 落地）④既有描述只增不改 ⑤登记层与接线同批（不适用 UI 单）⑥请求前缀恒定 ⑦零平行结构/零落盘（UiTokens 内存态）⑧回滚=revert 单 commit（2ccce25）⑨纯 CRLF 保形；**upg40 零回退**（冲突 4 文件裁决均保 upg40 值/资源，唯一「倾向」项=tokens.css 顶栏 56→46 是 v1 规范值且 upg40 皮肤值段未包含该行——不构成回退）

**已登记工单表.xlsx + 工单库.md（feat/upg25-v2 2ccce25｜报告 DELIVERY_UPG25v2_2026-08-30.md）**
