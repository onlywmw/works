# DELIVERY_UPG50_2026-09-01（外观组件库阶段 0）

> 程序员 C ｜ 分支 feat/upg50 ｜ 基线 main 8933846 ｜ 交付哈希 8e73e8d4ae53ae47e943039a9fa00b63ec8ceef5
> 施工口径：UPG-50 工单（A 部分 UI 编号建库 + B 部分 UI-CHAT-INPUT 安全打样）+ STD-UPG50-v1_2026-09-02.md
> 交付链路：构建 2 次 + 真机（192.168.2.3:44043，MOV debug 包）L2/L3 全验 + 全量测试 --rerun-tasks 590 用例绿

---

## 一、交付范围

| # | 工单项 | 交付 | 落点 |
|---|---|---|---|
| A | UI 编号建库 | ✅ 首批 20 条编号（`UI-<部位>-<组件>` 范式），四字段齐（component_id/semantic_type/名称/provider），机器校验唯一+范式合规 | `ui/catalog/UiComponentCatalog.kt` + `UiComponentCatalogTest.kt` |
| B1 | AppearanceProfile（唯一真相） | ✅ `{globalMinimal, components, lastUsed}` 纯函数存储契约 v3.1；选回默认=真删（L1-2/M-U50-1）；写形态只落 components 不触碰 impl 层（L1-7） | `appearance/AppearanceProfile.kt` |
| B2 | DisplayAppearanceResolver | ✅ 纯函数：形态 ID → 几何指令（classic 24dp 圆角+1dp 边框 / capsule 999dp 圆角+1dp 边框 / underline 0 圆角+2dp 下划线） | `appearance/DisplayAppearanceResolver.kt` + `UnderlineDrawable.kt` |
| B3 | AppearanceProfileStore | ✅ SharedPreferences 持久化（`mov_appearance` 档，写读一致） | `appearance/AppearanceProfileStore.kt` |
| B4 | 选择页（Appearance Selection View） | ✅ BizSheet 弹层 `assets/pages/appearance`，列表=组件名+形态卡横铺，✓/● 语义，明暗跟随 data-theme，最近使用 ● | `前端设计/mov-vue/src/AppearanceApp.vue` + sync-pages 产物 |
| B5 | composer 接入（单部位） | ✅ 只动主对话输入框单实例（UI-CHAT-INPUT），非本部位编号零触碰（L1-9/M-U50-6）；颜色一律 dock* 语义不写死 | `MainActivity.applyComposerAppearance()` |
| B6 | 桥 | ✅ `ui.openAppearance`（BizSheet 打开）/ `ui.getProfile` / `ui.setVariant`（components 唯一真相 + 单部位条件应用） | `MainActivity` mcpHandlers |

**红线遵守**：Token 契约不变（消费端只用语义名，L1-10 grep 断言）；范围外不做；sync-pages 受控同步（appearance 豁免名单入）；单部位；UI 直调豁免。

## 二、L1 机器判据（31 用例全绿）

| 判据 | 结果 | 断言锚 |
|---|---|---|
| L1-1 形态解析 | ✅ | DisplayAppearanceResolverTest 7/7（classic/capsule/underline 几何指令） |
| L1-2 覆盖真删 | ✅ | AppearanceProfileTest setVariant→default 条目彻底删除（无残留键） |
| L1-3 持久化 | ✅ | AppearanceProfileStore 写读一致 + 真机重启保持（L3-5 实证） |
| L1-4 状态矩阵 | ✅ | AppearanceContractTest 3 形态×明暗×6 状态声明+渲染无崩溃 |
| L1-5 明暗跟随 | ✅ | data-theme 驱动（契约 token 断言同款）+ 真机 L2-4 实证 |
| L1-6 唯一真相 | ✅ | grep 断言选择页无本地独立 selected（读取=AppearanceProfile） |
| L1-7 变体语义 | ✅ | 选择写 components（不写 impl 层），MainActivity setVariant 读唯一真相 |
| L1-8 UI 编号建库 | ✅ | UiComponentCatalogTest 5/5（20 条唯一+范式 `UI-<部位>-<组件>`+四字段齐） |
| L1-9 编号-部位隔离 | ✅ | 单部位：非本部位编号零被引用断言（composer 只读 UI_CHAT_INPUT） |
| L1-10 排版 Token | ✅ | tokens.css 契约段含 `--text-scale/--font-family/--font-weight` 三语义名；消费侧 grep 无写死字号/字族 |

## 三、L2 真机判据（装机 192.168.2.3:44043）

| 判据 | 结果 | 证据 |
|---|---|---|
| L2-1 列表结构 | ✅ | `upg50_screens/L2-1_list.png`（组件名+形态卡横铺） |
| L2-2 选中即替换（单实例） | ✅ | `L2-2_underline.png`：下划线选中后 composer **即时变**——左上角方角（F1F2F5，非白圆角）+ 底部加厚边框（y2980-2982 E5E7EB）；对照 `L3_1_baseline.png` classic 左上白圆角+1px 边框；`L2-2_composer_capsule.png` capsule 全圆 |
| L2-3 ✓/● 语义 | ✅ | `L2-3_underline_active.png`：生效卡 ✓（active）；切换后旧卡 ●（recent）；生效卡不显 ●（DOM+截图双证据） |
| L2-4 明暗 | ✅ | `L2-4_dark.png`（dark：--s0 #0c0e12、card #16181d、border #F1F3F5、按钮「浅色」）/ `L2-4_light.png`（light：#f3f4f7、白卡、#23272F、按钮「深色」）——**含修复见 §五②** |
| L2-5 持久化 | ✅ | 重启后选择保持（profile 档 components 不变，`L3_4_restart_capsule.png`） |
| L2-6 折叠 | ✅ | 演示模式 7 形态（>6）→ 折叠网格 6 卡 + 「展开网格·共 7 种 ›」→ 展开全 7 卡（DOM 实证：gridCards 6→7，expand 按钮消失） |
| L2-7 预览 render-only | ✅ | `.preview` 计算样式 pointer-events:none + tabIndex:-1 + aria-hidden:true（DOM 实证） |

## 四、L3 端到端（真实链路）

`装包 → 组件库 → 选胶囊 → 返回对话页输入框=胶囊 → 重启保持 → 选回经典 → 输入框回经典`：

| 步 | 结果 | 证据 |
|---|---|---|
| 装包 | ✅ | app-debug.apk install -r Success |
| 组件库 | ✅ | sidebar 桥 ui.openAppearance 打开选择页（=设置页「外观」行同款调用） |
| 选胶囊 | ✅ | DOM：胶囊 ✓ active、经典 ● recent；profile 档 components=UI-CHAT-INPUT:capsule |
| 返回输入框=胶囊 | ✅ | `L3_2_capsule_selected.png` + `L3_3_back_capsule.png`（圆角形态） |
| 重启保持 | ✅ | `L3_4_restart_capsule.png` + profile 档重启后不变（capsule） |
| 选回经典 | ✅ | DOM：经典 ✓ active、胶囊 ● recent；profile 档 components={} **真删** |
| 输入框回经典 | ✅ | `L3_5_back_classic.png`（圆角、无下划线，与 baseline 一致） |
| logcat | ✅ | 全程无 FATAL/AndroidRuntime Exception/PatternSyntaxException |

## 五、真机验证发现并修复

1. **根因 bug（getProfile 空档）**：`AppearanceProfile.kt:70` extractMap 正则 `\{(.*?)}` 中未转义 `}` —— 桌面 JVM java.util.regex 容忍孤立 `}` 字面量，但 **Android ART(ICU) 直接 PatternSyntaxException**，被 `runCatching` 吞成 EMPTY → getProfile 恒返回空档。修复：转义为 `\\}`（`fix(upg50)` commit）。JVM 单测无法暴露（JVM 容忍），真机实测踩坑——L2-3 修复后 ✓/● 正确回显。
2. **选择页主题按钮失同步**：Vue `theme` ref 在 setup 时捕获 data-theme（早于宿主 `applyPageTheme` 的 onPageFinished 注入）→ 页面已是深色但按钮仍显示「深色」。修复：MutationObserver 监听 `data-theme` 属性让 ref 与真实属性一致（L2-4 实证按钮在深色态显示「浅色」）。

## 六、测试

- **app 全量**：`--rerun-tasks` BUILD SUCCESSFUL，590 用例 0 失败 1 跳过（红线 WebViewWarmupTest 绿——appearance 已入 sync-pages 豁免名单，其余页面零未预期变更）
- **UPG-50 专项**：AppearanceContractTest 11/11（含 M-U50-1~7 变异锚）+ AppearanceProfileTest 8/8 + DisplayAppearanceResolverTest 7/7 + UiComponentCatalogTest 5/5
- **assembleDebug**：绿
- 测试再生成副作用（ApprovalRegistry.json/c7 baseline 时间戳）已还原不提交（基线权威=main 版）

## 七、申报边界（验收员注意）

1. **classic vs capsule 视觉近似**：composer 容器高 ~115px（density 2.75），classic 24dp 圆角=72px > 半高 57.5px，被 GradientDrawable 钳制为全圆 → classic 与 capsule 视觉基本相同。状态切换/持久化/真删已由 profile 档 + DOM 实证；**视觉可区分形态 = underline**（方角+加厚底边框）。如需 classic/capsule 视觉可辨，需 composer 增高或 classic 圆角调小（超出本单范围，申报）。
2. **L2-6 折叠验证**：正式 catalog 仅 UI-CHAT-INPUT 3 形态（≤6 不触发折叠），用「演示模式」追加 4 个示例形态构造 7 形态验证折叠网格——演示形态仅展示不写档（DOM 实证）。
3. **入口**：选择页经 `ui.openAppearance` 打开（=设置页「外观」行 action 同款调用）；设置页导航链路走查留验收员复核。

## 八、文件清单

新增（源）：
- `app/src/main/java/com/mov/android/appearance/{AppearanceProfile,AppearanceProfileStore,DisplayAppearanceResolver,UnderlineDrawable}.kt`
- `app/src/main/java/com/mov/android/ui/catalog/UiComponentCatalog.kt`
- `前端设计/mov-vue/src/AppearanceApp.vue` + `appearance.html`（入口）
- `app/src/test/java/com/mov/android/appearance/{AppearanceContractTest,AppearanceProfileTest,DisplayAppearanceResolverTest}.kt`
- `app/src/test/java/com/mov/android/ui/catalog/UiComponentCatalogTest.kt`
- `upg50_screens/*`（真机验证脚本 + 截图证据）

修改：
- `app/src/main/java/com/mov/android/MainActivity.kt`（ui.getProfile / ui.setVariant / ui.openAppearance / applyComposerAppearance / UiTokens 单部位接线）
- `scripts/sync-pages.mjs`（appearance 入口入同步）
- `app/src/main/assets/pages/appearance/*`（sync-pages 产物，先清后放）
- `前端设计/mov-vue/src/styles/tokens.css`（排版三语义名契约段，L1-10）

提交（feat/upg50）：
- `ca984df` feat(upg50)：外观组件库阶段0 — UI 编号建库 20 条 + UI-CHAT-INPUT 三形态打样
- `8e73e8d` fix(upg50)：真机验证修复两处——ART regex 转义 + 选择页主题按钮失同步

**验收结论：待设计师合 main**（合 main 仅由设计师执行；本交付不自行 merge/rebase）
