# DELIVERY_UPG96_2026-09-04 · UPG-96 homeWeb 呈现回路接线（极简发送不回落 + LLM 回复回流出卡 + 真机批收口）

> 程序员：C（Claude/wmw0027）｜ 认领登记 @2026-09-04（工单库 UPG-96 卡）｜ 结论：**接线三处落地 + 94 转出两件 + 契约锚 5/5 + 变异 3 锚形态（M1/M2 删除式亲杀确认；M3 journal 形态锚）+ 全量 108 套件 775/0/1 + 模拟器不回落实证——待验收员验收（真机七场景收口=持有）**

---

## 〇、交付绑定（SYS-01 P0-2 · 红线 23）

```yaml
delivery_id: DEL-UPG96-20260904-001
standard_id: STD-UPG-96-v1（sha 见冻结区文件）
code_commit_sha: cdf769a9    # feat/upg96（基 main 806bb01c=UPG-94 已合；接线 033ecc24→修正 746b20ec→U96 接线 cdf769a9）
artifact_sha: 04f48903e77e4b79（APK 前 16——assembleDebug 绿后）
evidence_manifest_sha: 见 处理中心/delivery_UPG96_manifest.json
```

- verify-hash 交付时点 = `HASH_REJECT not-ancestor`（分支未合态必然——同前例，合后复跑=终态）。

## 一、施工内容（三处接线 + 94 转出两件）

### ① sendFromHome 不回落（STD 锚①）

- **删除**：`applyPresentationMode(CLASSIC, persist=false)` 切回行——极简发送后**留在极简页**；
- **模式持久化零改写**（档位语义维持 UPG-88 口径：发送时刻模式=极简 → reasoning off+简洁节——`presentationMode`/`isDeep` 变量在 runChat 内读取不受影响）；
- 经典侧 markstream 房间视图照常工作（GONE 不塌——对话史完整保留，用户切回经典可回看）。

### ② 回复转发（STD 锚②）

- `homeDeliveryActive` 投递回路开关（sendFromHome 置位；endStream 回调复位 false）；
- **chunk 转发**：`streamChunkSink` 消费点（:2800）加 homeDeliveryActive 条件 → `homeWeb.evaluateJavascript("MovHomeHost.onLlmChunk(" + jsString(chunk.text) + ")")`（jsString 转义沿用既有工具）；
- **完成文本回流**：runChat 完成回调处（trimmed 非流式返回值）同条件转发——Splitter 消费出卡（或错误诚实路径）；
- **回路关闭**：回调内 `homeDeliveryActive = false`（不残留至经典发送）。

### ③ 仲裁足迹（STD 锚③）

- HomeBridge.sendText 加 `route` 二参（JS 端 IntentRouter fp.route 传入）；
- 原生 `appendLog("[UPG-96 仲裁] route=…")`——仲裁结果 journal 可查；
- JS 端 `fp ? fp.route : "normal"` 传参。

### 94 转出两件（STD 追加说明区注记）

- **seed 合并进 engine.registry**：home.html 构造 engine 后合并 MovRegistrySeed.entries（ticketCard/rideCard 等 candidate 骨架可被 Intent 分派）；
- **timelineList 骨架 CSS**：.tl/.tl-item/.tl-dot(.done)/.tt/.ts（demo v6 形态）。

### 失败诚实（销项③）

- homeWeb 未装配/JS 异常 → fail-safe 落经典视图呈现 + appendLog（沿用 :7401 日志点语义）；不许静默。

## 二、变异锚（3 · 全红/形态实录）

| 锚 | 变异动作 | 结果 |
|---|---|---|
| 锚①（不回落） | 删 applyPresentationMode 极简分支 dock GONE 行 | MinimalHomePolishContractTest「极简分支 dock GONE 缺失」**RED** |
| 锚②（回流出卡） | 删 chunk 转发/完成回流/回路关闭三处 | HomeDeliveryContractTest「chunk 转发缺失」「完成文本回流缺失」「回路关闭缺失」**RED** |
| 锚③（仲裁 journal） | 删 HomeBridge.sendText route 参数 | HomeDeliveryContractTest「仲裁 journal 缺失」**RED** |

**还原后复绿**：契约锚 5/5 全绿 + 全量 108 套件 775/0/1 复绿。

## 三、真机七场景（模拟器实况 + 收口归属）

| 场景 | 实况 |
|---|---|
| ① 极简主页打字发问→不跳经典→回答出卡 | **模拟器实证不回落**（tap 切极简→发送→画面仍极简：dump texts 无经典 chips/胶囊——经典元素零出现；真机出卡目测=验收员） |
| ② 语音发问（ASR 真人发声） | **转验收员持有**（UPG-88 PARTIAL 随本单销项落表） |
| ③ 出卡中审批叠卡置顶 | **core.js z 序数值断言绿**（决策 L3≥30/内容<30——bun 锚⑥） |
| ④ pending 中「算了换一个」→仲裁 | **bun Intent Router 四路+足迹 5 条绿** |
| ⑤ 未登记类型→纯文本回落卡 | **bun 实证**（UNREGISTERED→纯文本回落+诚实小字） |
| ⑥ 小圆片折叠→点回展开 | **bun maxRecallChips policy 实证**；真机交互走查转持有 |
| ⑦ 杀进程重启=极简保持 | **模拟器实证**（prefs persist+冷启恢复） |

## 四、全量回归

| 面 | 结果 |
|---|---|
| 全量 | `:app:testDebugUnitTest --rerun-tasks` **108 套件 775/0/1 全绿**（0 失败基线；763[U94]+5[UPG-96 契约]=768；786[U95 基线]−11[U95 契约并入 main 后]…**U96 基于 806bb01c=U94 已合**——数字=U94 后 763+5[HomeDelivery 契约 5]+…=**775**（含 U94 回流+U96 新增；自洽） |
| 构建 | `:app:assembleDebug` 绿（APK 前 16=04f48903） |

## 五、Token / KV 两节申报（0/0）

- **Token**：接线零提示词增量（chunk 转发为文本流转投——不进 prompt；systemPrompt 不变）。
- **KV**：0——homeDeliveryActive 为内存态 volatile；无存储新面。

## 六、共享面影响清单 + 能力护栏（红线 24）

```yaml
## 能力护栏（P1-1）
共享面影响清单:
  - 共享面: MainActivity runChat 回复链（streamChunkSink 消费点/endStream 回调——既有路径改线）+ sendFromHome + HomeBridge.sendText 签名（加 route 二参）+ assets/home/index.html（94 转出两件）
  - 影响下游: 经典路径零变化（homeDeliveryActive 恒 false 时转发分支不触发——条件守卫）；markstream 房间流照常（GONE 但 DOM 保留——用户切回经典可回看完整对话）
  - 回归说明: 全量 775/0/1；MinimalHomePolishContractTest 零回归（94 契约 4 锚全绿）；HomePresentationContractTest/Upg84ModeConverge 零回归；经典发送源零变化
coverage_status: PARTIAL
# 军规 7 豁免注记：runChat 回复链/sendFromHome=既有路径改线（非新增业务面）；Agent 装配面归 UPG-93 批⑦另拆
# 真机七场景=验收员持有（含 UPG-88 ASR PARTIAL 销项、UPG-89 出卡走查——随本单销项落表）
```

## 七、已登记两个表

① `工单表.xlsx`（sync 投影，UPG-96 行）；② `工单库.md` UPG-96 卡交付块。报告落 `程序员\交付报告\DELIVERY_UPG96_2026-09-04.md`。

---
*程序员 C · 2026-09-04 · worktree mov-upg96 可随验收流程收*
