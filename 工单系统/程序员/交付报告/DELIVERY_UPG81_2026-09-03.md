# UPG-81 · 基线 2 失败契约锚同步修 · 交付报告

| 项 | 值 |
|---|---|
| 单号 | STD-UPG-81-v1（content_sha256=c3f7009aec19a980a893065574d18257e0a96ff4ddd74e510768667e4d348395，认领登记在案） |
| 标题 | 基线 2 失败契约锚同步修（AppearanceContractTest 适配收拢版现实） |
| 签字程序员 | Claude（wmw0027） |
| 认领 | 2026-09-03 08:55 · worktree `mov-upg81` · branch `feat/upg81` |
| 基线 | origin/main `5cf546d`（UPG-79 已合入） |
| 交付 | 2026-09-03 · commit `3339c4b` @feat/upg81 |
| 改动量 | 1 文件，+18 / −8（仅测试文件 `AppearanceContractTest.kt`） |

---

## 〇、交付绑定（P0-2）

- delivery_id: **DEL-UPG81-20260903-001**
- code_commit_sha: `3339c4b349254d9c849f142157f4d66101ff2cb2`（feat/upg81 tip；`git log`=UPG-81 契约锚同步修）
- artifact_sha: `ac64f567ac9322cde3fcaa401b7cdd837a4ae41be108def7c8986169d27dd7dd`（app-debug.apk sha256；本单测试契约改动不参与主包产物，assembleDebug GREEN 佐证零回归）
- evidence_manifest_sha: `145a363026152ffb74012b67131a71fb38eaace852d190b7a38e61b401b5b6c8`（`程序员/交付报告/DELIVERY_UPG81_2026-09-03_manifest.json`，6 条 E-001~E-006；`审验.py --manifest` 复验 ok:True）
- standard_id: STD-UPG-81-v1（content_sha256 c3f7009a…=派单所引）
- verify-hash 登记前实测 `审验.py --verify-hash feat/upg81 3339c4b --repo mov-upg81` → **HASH_REJECT <not-ancestor>**（commit 未合 origin/main 故非祖先；合 main 后复跑闭环，红线 23 如实留证）

## 一、派单文字差异说明（如实记录）

派单/卡状态行列失败项为「L2-9 1B + M-U50-5」，但修前实测（定向 + 全量）2 红 = **L1-10（排版语义 token 契约）+ M-U50-5（预览卡 render-only）**；L2-9 1B（高频组件切换契约）实测**基线绿**。
依据 `程序员\交付报告\UPG70_裁决记录_2026-09-02.md` 裁决项 1（用户拍板）：裁决文字本身即写「**L1-10 / M-U50-5 两契约断言同步收拢版现实**」。故派单中「L2-9 1B」为派单文字笔误；实际施工对象 = L1-10 + M-U50-5，与裁决记录、STD-UPG-81-v1 验收锚一致。修前/修后证据均以 L1-10 + M-U50-5 为准。

## 二、修前实证（2 红 · 留 XML）

定向 `AppearanceContractTest`：**16 tests / 2 failures**（证据 `before/` 目录 XML）：

- **L1-10 @:144** `assertFalse("选择页禁写死字号", Regex("font-size\s*:\s*\d")...)` 红——收拢版选择页工具样式确实硬编码 px（断言指涉「禁写死」在收拢版为假）
- **M-U50-5 @:177** `assertTrue("预览卡必须 pointer-events:none"...app.contains("pointer-events: none"))` 红——收拢版 previewOf 纯 span 骨架，无 pointer-events 声明（断言指涉样式在收拢版不存在）

统计时点：2026-09-03（证据 `before/` XML 记录）。

## 三、逐案对账（断言期望 vs 收拢版样式现实）

| 断言 | 旧期望 | 收拢版现实（来源文件:行号） | 处置 |
|---|---|---|---|
| L1-10 禁写死字号/字族/字重 | 选择页零写死字号/字族/字重 | `.back{font-size:20px}` @AppearanceApp.vue:270；`.appearance-app{...font:14px/1.55 ...}` @:268——页面工具样式 demo 风格硬编码 px 属收拢现实 | 认账现实，改断言锚定真实存在样式 |
| L1-10 消费语义 token | 选择页含 `var(--font-weight)` | 选择页零 var() 消费（AppearanceApp.vue 全文无 var(--font-weight)） | 语义 token 契约改由 **Resolver 形态层真实消费**锚定（`.shhead-standard{...font-weight:var(--font-weight)}` @tokens.css:214）——防 token 定义空转 |
| M-U50-5 pointer-events:none | previewOf 区含 `pointer-events: none` | 收拢版 previewOf（@AppearanceApp.vue:185-200）纯 span 骨架、无 pointer-events 声明 | 改锚真实 render-only 表达：非交互标签 + aria-hidden 装饰 + demo 形态 select 拦截（:234） |

## 四、修订内容（1 文件 · diff +18/−8）

见 commit `3339c4b`。两方法替换：

- **L1-10**：删 4 个禁写死断言 + 1 个「选择页消费 var(--font-weight)」断言 → 新增收拢现实双锚（`.back{font-size:20px}` @:270、`.appearance-app` 应用壳字族 @:268）+ Resolver 消费锚（`font-weight:var(--font-weight)` @tokens.css:214）
- **M-U50-5**：删 pointer-events 断言 → `previewOf` 切片断言禁交互标签（`<(button|input|textarea|select|a )` 零命中）+ aria-hidden 装饰锚 + demo 形态拦截锚（toast 文案「演示形态仅用于网格展示」@select():235）
- 全部断言消息含「来源文件:行号」现实锚；断言仍验证真实内容（未削成摆设，见 §六亲杀）

## 五、修后验证

- 定向：**16 / 0 / 0**（证据 `after/` XML）
- 全量 `:app:testDebugUnitTest --rerun-tasks --offline`：**BUILD SUCCESSFUL · 734 tests / 0 failures / 0 errors / 1 skipped**（统计时点 **2026-09-03 09:10:16**；`full_run/` 目录 99 个逐类 XML + `SUMMARY_734_0fail_20260903_0910.md` 统计记录；1 skip = 基线 @Ignore SceneLiveQueryTest pre-existing）
- `:app:assembleDebug`：GREEN（零回归佐证）

## 六、变异亲杀（2 kills · 实测红 → 还原绿）

| 变异 | 注入 | 结果 |
|---|---|---|
| K1 · L1-10 旧断言回潮 | 注入 `assertFalse("K1-注入 选择页禁写死字号", Regex("font-size\s*:\s*\d")...)` | **L1-10 FAILED** @:146 → 还原后绿 |
| K2 · M-U50-5 旧断言回潮 | 注入 `assertTrue("K2-注入 预览卡必须 pointer-events:none", app.contains("pointer-events: none"))` | **M-U50-5 FAILED** @:183 → 还原后绿 |

`kill/K1_L1-10.xml` + `kill/K2_M-U50-5.xml` 留证（断言改回旧值必红 = 断言未成摆设）。还原后修订态校验通过：`.back{font-size:20px}` / 演示拦截 / Resolver 消费三锚在，K1/K2 注入与「禁写死字号」「pointer-events」旧断言 0 残留。

## 七、Token / KV 节（派单要求）

- **Token**：0 变化——本单只改测试断言源码，不触碰 systemPrompt / 工具面装配 / 任何运行时注入文本。
- **KV**：0 变化——无 SharedPreferences / 持久化键增删改。

## 八、红线合规

- 改动文件 = 仅 `app/src/test/java/com/mov/android/appearance/AppearanceContractTest.kt`（git status 佐证）；收拢版 Vue/CSS/tokens 一律零触碰（修断言非改样式）。
- 未用 skip/豁免消音；全量真实 **0 失败**。
- 亲杀锚证明断言保持有效性。

## 九、已登记两表（分支交付后执行）

- 本分支：`feat/upg81`（mov-upg81 worktree），基线 `5cf546d`，commit `3339c4b`。
- 已执行登记序列（2026-09-03）：库交付块含 `DEL-UPG81-20260903-001` + code/artifact/manifest 三重 hash → `sync-orders.mjs --sync` 投影（表 I 列 delivery_id=DEL-UPG81-20260903-001，备份已归档）→ `审验.py --manifest` 复验 ok:True → `审验.py --verify-hash` not-ancestor 留证（未合 main，合后复跑闭环，红线 23 如实）。
