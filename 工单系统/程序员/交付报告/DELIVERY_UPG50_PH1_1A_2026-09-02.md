# DELIVERY_UPG50_PH1_1A_2026-09-02（外观组件库阶段 1 · 批次 1A 机制扩展）

> 程序员 C ｜ 分支 feat/upg50-ph1 ｜ 基线 main 8e73e8d（阶段 0 交付点）｜ 1A 提交哈希 `57b80917c818384183c03305e1bc6a149a00af30`
> 施工口径：UPG-50 阶段 1 工单（批次 1A：Resolver/Catalog 全组件解析 + AppearanceProfile 20 条初始化 + 选择页全组件化）+ STD-UPG50_阶段1_增补_2026-09-02.md（L1-11~14 / L2-8 / M-U50-8~9）
> 交付链路：构建 2 次 + 全量单测 603 用例绿 + 真机（192.168.2.3:44043，MOV debug 包）L2-8 DOM 实证 + 变异亲杀 M-U50-8/9 双红

---

## 一、1A 交付范围

| # | 工单项 | 交付 | 落点 |
|---|---|---|---|
| 1A-1 | 形态规格表（全 20 条） | ✅ `components` 规格表（20 条 × 52 档：20 default + 32 变体）——default 必选+≥1 变体，机器校验（L1-11） | `ui/catalog/UiComponentCatalog.kt` + `UiComponentCatalogTest.kt` |
| 1A-2 | 全组件变体解析 | ✅ `DisplayAppearanceResolver.resolve(componentId, variant)` → 唯一 cssClass 令牌 + 几何指令（radius/border/underline/阴影/字族）；未知回退该组件 default（L1-12） | `appearance/DisplayAppearanceResolver.kt` |
| 1A-3 | 4 族状态矩阵单源 | ✅ `familyStateMatrix()` 4 族 × 6 态全声明，全引用语义 token——组件级零重复状态表（L1-13） | `appearance/DisplayAppearanceResolver.kt` |
| 1A-4 | 按组件 default 解析 | ✅ `AppearanceProfile.variantOf` 按组件 default（非全局 classic）；真删/持久化语义保持（阶段 0 判据不降级） | `appearance/AppearanceProfile.kt` |
| 1A-5 | 全组件单实例路由 | ✅ `ui.setVariant` → `applyComponentAppearance(componentId)` 按 ID 精确分发，20 条互不污染（L1-14/M-U50-9） | `MainActivity.kt` |
| 1A-6 | 选择页全组件化 | ✅ 20 条全部可见 + 8 部位分组折叠 + 52 预览卡 render-only 实渲染（L2-8） | `前端设计/mov-vue/src/AppearanceApp.vue` + sync-pages 产物 |

**红线遵守**：Token 契约不变（L1-10 grep 断言延续）；单实例（每次切换=单组件生效）；UI 直调豁免；范围外不做（MCP 注册制/排版三档 UI/P2-1 均未触碰）；排版 Token 消费（选择页禁写死字号/字族/字重）。

## 二、L1 机器判据（阶段 1 增补）

| 判据 | 结果 | 断言锚 |
|---|---|---|
| L1-11 20 条全部有形态档 | ✅ | `UiComponentCatalogTest`：components.size=20、validateSpecs() 空、每组件 default 必选+≥1 变体、编号库与规格表一一对应、totalFormCount=52 |
| L1-12 每组件变体解析 | ✅ | `DisplayAppearanceResolverTest`：20 条 × 全部变体 resolve 到唯一互异 cssClass，变体归属规格档；未知变体回退该组件 default；INPUT 族阶段 0 几何保持 |
| L1-13 族矩阵单源 | ✅ | `DisplayAppearanceResolverTest`：familyStateMatrix()=4×6=24 项、4 族 × 6 态、全 `--` 语义 token；familyOf 覆盖全部 20 条 |
| L1-14 单 API 唯一写点 | ✅ | `AppearanceContractTest`：MainActivity 写口只走 `store.update { it.setVariant(componentId, variant) }`（grep）；Resolver 读唯一真相 variantOf；选择页无本地独立 selected |

**阶段 0 判据不降级**：L1-1~10 全保持绿（AppearanceProfileTest 8/8、DisplayAppearanceResolverTest 7+6、UiComponentCatalogTest 5+5、AppearanceContractTest 13）。唯一演进：L1-9 由「单部位打样（只动 UI-CHAT-INPUT）」演进为「单实例路由（按 componentId 分发，20 条互不污染）」——单实例红线不变（见 §六 申报 3）。

## 三、L2-8 真机判据（装机 192.168.2.3:44043）

| 判据 | 结果 | 证据 |
|---|---|---|
| L2-8 选择页 20 条全部可见 | ✅ | DOM 实证：`.site-group`=8、`.comp-row`=20、`.v-card`=52；逐条组件卡片数=规格表变体数（3/3/3/2/3/3/3/2/2/3/2/3/3/3/2/3/2/2/3/2）完全一致 |
| 部位分组 | ✅ | 8 组：对话 4 / 设置 4 / 侧边栏 3 / 工作台 2 / 市场 2 / 资产 2 / 弹层 2 / 通用 1（SITE_ORDER 顺序） |
| 栏折叠 | ✅ | 折叠「设置」组 → 该组 comp-row 0（其余 7 组仍可见）；恢复 → 20 全回 |
| 预览 render-only | ✅ | `.preview` 计算样式 `pointer-events:none`（getComputedStyle 实证）+ aria-hidden |
| 主题切换（L2-4 延续） | ✅ | 切 dark → data-theme=dark；切回 → removeAttribute（阶段 0 语义保持） |

截图证据：`upg50_screens/ph1_1a_overview.png`（选择页全览 20 条）+ verify 脚本 DOM 输出（verify_1a.mjs / verify_1a_interact.mjs）。

## 四、变异亲杀（M-U50-8/9 防假覆盖）

| 变异 | 操作 | 期望红 | 实测 |
|---|---|---|---|
| M-U50-8 规格缺 1 条 | 删除 UI-COMMON-EMPTY 规格档 | L1-11 红 | ✅ 4 测试红（规格表合规/总档数/一一对应/红锚） |
| M-U50-9 切换误伤他组件 | `applyComponentAppearance` 去掉 componentId 分发（全部走 composer） | L1-14 红 | ✅ 2 测试红（M-U50-9 红锚 + L1-9） |

变异后已 `git checkout --` 恢复，重跑全量 603 用例全绿。

## 五、测试

- **app 全量**：BUILD SUCCESSFUL，603 用例 0 失败 1 跳过（WebViewWarmupTest 绿——pages 资产已随 1A 提交）
- **UPG-50 专项**：UiComponentCatalogTest 10/10（新增 L1-11×4 + M-U50-8）+ DisplayAppearanceResolverTest 13/13（新增 L1-12×4 + L1-13×2）+ AppearanceContractTest 13/13（L1-14 + M-U50-9）
- **assembleDebug**：绿
- 测试再生成副作用（ApprovalRegistry/c7 baseline）已还原不提交（基线权威=main 版）

## 六、申报边界（验收员注意）

1. **规格表统计与文档统计行不一致**：形态矩阵规格 v1 §四统计行「55 变体 / 75 档」与 §二 表逐列求和 **52 档（12 条×3 + 8 条×2）不符**。本数据源以 §二 表逐行为准（L1-11 基准=规格表），`totalFormCount=52`。若验收判据硬校验 75 档，需设计师裁决（建议以规格表逐行为权威）。
2. **UI-CHAT-BUBBLE 族归属**：规格 §三 4 族矩阵未列 BUBBLE（第 2 条）。按容器语义（圆角+边框+阴影）归 **CARD 族**，交付申报。如需归他族，改 `familyOf` 一处即可。
3. **L1-9 演进**：阶段 0「单部位打样（只动 UI-CHAT-INPUT）」→ 阶段 1「单实例路由（按 componentId 精确分发，20 条互不污染）」。单实例红线不变（M-U50-9 亲杀锚）。UI-SETTINGS-INPUT 等其余 19 条已入规格表/Resolver/选择页，但**原生实例视觉落位**在 1B/1C 批次接入（本批次 `applyComponentAppearance` 仅 UI-CHAT-INPUT 分支实做，其余 else=占位）。
4. **选择页预览**：预览卡=真实 DOM 结构小样（非静态图）+ 形态 cssClass（52 档令牌与 Resolver 对齐），render-only 无交互；真实 App 实例视觉=1B/1C。

## 七、文件清单

新增（源）：
- `app/src/main/java/com/mov/android/ui/catalog/UiComponentCatalog.kt`（+ ComponentVariant/ComponentSpec/规格表/校验）
- `app/src/test/java/com/mov/android/ui/catalog/UiComponentCatalogTest.kt`（+ L1-11×4 + M-U50-8）
- `upg50_screens/ph1_1a_overview.png`（L2-8 全览截图）
- `upg50_screens/verify_1a.mjs` / `verify_1a_interact.mjs` / `open_appearance.mjs`（真机验证脚本）

修改：
- `app/src/main/java/com/mov/android/appearance/DisplayAppearanceResolver.kt`（+ resolve/cssPrefix/geometry/familyStateMatrix/familyOf）
- `app/src/main/java/com/mov/android/appearance/AppearanceProfile.kt`（variantOf 按组件 default）
- `app/src/main/java/com/mov/android/MainActivity.kt`（ui.setVariant 单实例路由 + applyComponentAppearance）
- `前端设计/mov-vue/src/AppearanceApp.vue`（20 条全组件化 + 部位分组折叠 + 预览骨架）
- `app/src/test/java/com/mov/android/appearance/{DisplayAppearanceResolverTest,AppearanceContractTest}.kt`
- `app/src/main/assets/pages/*`（sync-pages 重建产物，先清后放）

提交（feat/upg50-ph1）：
- `57b8091` feat(upg50)：阶段1 1A 机制扩展 — 全组件规格表/Resolver 全组件解析/选择页全组件化

**验收结论：1A 判据全过（L1-11~14 + L2-8 + M-U50-8/9 亲杀），待验收员复核后由设计师合 main**
