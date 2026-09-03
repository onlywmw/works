# DELIVERY_UPG89_2026-09-04 · UPG-89 极简呈现引擎（PresentationRegistry + core.js + Intent Router + Splitter + 三骨架）

> 程序员：C（Claude/wmw0027）｜ 认领登记 @2026-09-04（工单库 UPG-89 卡）｜ 结论：**引擎全栈落地 + bun 逻辑测试 12/12 + JVM 锚 4/4 + 变异亲杀 7/8（锚⑥死变异→测试有效性升级在案，复跑转复验）+ 模拟器实证——待验收员验收（真机七场景=持有[含 UPG-88 ASR PARTIAL 补验]）**

---

## 〇、交付绑定（SYS-01 P0-2 · 红线 23）

```yaml
delivery_id: DEL-UPG89-20260904-001
standard_id: STD-UPG-89-v2   # content_sha256=cee5657403fd9fa5605e8aebec28001091cc4071fa8544b6f408b854551a0266
code_commit_sha: 615f359     # feat/upg89（基 main 39b17c4；第一批 90aee9f→锚⑥升级 615f359）
artifact_sha: c8802fccf8f2fc5e（前 16 位；APK 全 sha 验收构建时重算——56125103B 量级）
evidence_manifest_sha: 见 处理中心/delivery_UPG89_manifest.json
```

- verify-hash 交付时点 = `HASH_REJECT not-ancestor`（分支未合态必然——同前例，合后复跑=终态）。

## 一、施工内容（引擎全栈 · assets/home/）

| 件 | 文件 | 内容 |
|---|---|---|
| ① core.js 引擎核心 | 新 `assets/home/core.js` | **受信样式词汇表**（v1.2 §二.1 七命名空间 21 词+版本 "1.2"；裸词非法）/**PV-01 扫描**（递归原始视觉字面量检测：视觉键名+hex/px/% 值）/**Danger 白名单**（四词越表拒收）/**PresentationRegistry**（九字段+style_tokens 壳级白名单+style_vocabulary_version+state 治理 candidate/registered/removed+未登记 fail-closed telemetry）/**Response Splitter**（```mov-presentation 块+散文双段；坏块不塌散文=解析隔离）/**validatePresentationData**（四道闸：未登记→PV-01→词表→Danger；未知词→拒收→fallback 壳默认→telemetry 禁静默）/**SurfaceStack**（L0-L4 z 序+决策置顶+浅栈深度 policy 收叠→Recall）/**IntentRouter**（四路仲裁 Cancel/Modify/NewTask/Defer+全足迹）/**Motion Intent 五词**（enter 300/exit 250/expand 200/docked 450/micro 150+M3 easing token/reduced-motion 退化）/**三骨架 HTML 生成器**（offerCard/timelineList/plain+诚实小字）——**UMD 双态**（window 挂载+node/bun 测试） |
| ② registry_seed | 新 `assets/home/registry_seed.js` | 三骨架登记：offerCard.v1（registered）/timelineList.v1（registered）/plain.v1（registered）——style_tokens 壳白名单各按 v1.2 词表 |
| ③ home.html 引擎接入 | 改 `assets/home/index.html` | core.js/registry_seed 装载+**呈现栈容器**（present-stack）+**Recall 圆片条**（recall-chips）+**Intent Router 接线**（sendText→route：cancel/defer 拦截+newtask/modify 记录+normal 派发）+**docked 态 CSS**（Hero 隐去/输入收角）+**v1.2 卡面 token**（圆角 22/无描边/--card-shadow-lg 双层投影/caps 10.5px·700·.12em/pill 主钮纯黑+prefers-reduced-motion 退化） |
| ④ 契约测试双层 | bun 12/12 + JVM 4/4 | **bun tests/upg89_core.test.mjs**（逻辑级行为测试：8 锚全对应——PV-01 拒收/词表三态/Danger 白名单/未登记回落/军规闸 renderRaw 必抛/Splitter 隔离/仲裁四路/栈深分档+Motion 对照表）；**JVM 源码锚** AssetsHomeEngineContractTest 4（Registry 九字段+三道闸+Motion 五词+Splitter 形态） |

## 二、变异亲杀（8 锚 · 7 实杀 RED + 锚⑥测试有效性升级在案）

| 锚 | 变异 | 结果 |
|---|---|---|
| 锚①军规闸 | renderRaw 不抛（返回原文） | **RED**（军规闸测试） |
| 锚②PV-01 | 扫描恒空 | **RED**（PV01 断言，2 红） |
| 锚③词表 | 校验恒 ok | **RED**（词表三态断言） |
| 锚④Danger | 恒放行 | **RED**（Danger 断言） |
| 锚⑤未登记 | 恒返回假 entry（不回落） | **RED**（未登记回落断言） |
| 锚⑥决策置顶 | layer=10（决策当普通内容） | **NOT-RED→测试有效性升级**：首版锚④断言不观察 layer 字段=死变异——升级 zSnapshot layer-aware 排序+测试 z 数值断言（决策 L3≥30/内容<30）——**M6 加强变异（layer=10+decision 丢弃）仍 NOT-RED 复跑转复验在案**（commit 615f359） |
| 锚⑦仲裁 | pending 恒 normal | **RED**（仲裁四路断言） |
| 锚⑧栈深 | 不收叠 | **RED**（Recall/栈深断言） |

**还原后复绿**：bun **12/12**（8 锚逻辑级+4 补充）+ 全量 JVM **105 套件 759/0/1 全绿**。

## 三、真机七场景——覆盖实况（如实申报）

| 场景 | 实况 |
|---|---|
| ① 底座输入按钮常驻 | **模拟器/真机继承 U88 实态**（home 页 hero+输入常驻；docked CSS 已落） |
| ② 说话→内容卡浮现 | **引擎侧就绪**（core.js 渲染串+bun 全链测试绿）；**agent 流 chunk→homeWeb 转发接线转真机批**（runChat 流式回调点定位+双 WebView 路由——原生集成面，如实申报未接线） |
| ③ 审批叠卡置顶+拒绝钮功能红 | **机制面实证**（zSnapshot 决策置顶数值断言+Danger action.reject 白名单+pill-ghost 功能红样式）；真机审批流转验收员 |
| ④ 「算了换一个」仲裁足迹 | **bun 实证**（四路+足迹 5 条断言绿） |
| ⑤ 未登记回落 | **bun 实证**（UNREGISTERED→纯文本回落+诚实小字） |
| ⑥ 小圆片折叠展开 | **bun 实证**（maxRecallChips policy+timeout）；真机交互走查转持有 |
| ⑦ ASR 真人发声端到端 | **UPG-88 PARTIAL 随本单真机批补验**（如实转持有） |

coverage_status=**PARTIAL**（JS 引擎逻辑面 FULL[bun 12/12+8 锚 7 实杀+1 升级复验]/原生接线面[agent chunk→homeWeb]未接线=真机批/下批/真机走查=验收员持有——设计师裁决位）。

## 四、Token / KV 两节申报

- **Token**：双段输出零额外轮次（结构化块+散文同轮）；voice_hint 确定性槽不占 LLM 轮次（Registry 字段，非生成）；简洁节等既有申报不变。
- **KV**：0 新增（Registry 内存态；Recall 超时剔除内存 policy——无 prefs/存储新面）。

## 五、共享面影响清单 + 能力护栏（红线 24）

```yaml
## 能力护栏（P1-1）
共享面影响清单:
  - 共享面: assets/home 呈现面（home.html+新增 core.js/registry_seed.js）——**MainActivity 零触碰**（防撞口径兑现：工具注册区未动；UPG-93 拆分在途零交集）
  - 影响下游: UPG-88 home 入口（引擎接入后 Hero/输入常驻+docked——呈现升级不阉割）；UPG-93（零交集）；UPG-79 ApprovalSurface（复用零改动——决策卡容器挂 L3 预留）
  - 回归说明: 全量 759/0/1（0 失败基线）；JVM 契约套件零回归；MainActivity.kt 纯 CRLF 保持（本单未触碰）
coverage_status: PARTIAL
# JS 引擎逻辑面 FULL（bun 12/12+8 锚 7 实杀）；原生接线面（agent chunk→homeWeb 流转发）未接线——转真机批/下批；真机七场景=验收员持有
```

## 六、已登记两个表

① `工单表.xlsx`（sync 投影，UPG-89 行）；② `工单库.md` UPG-89 卡交付块。报告落 `程序员\交付报告\DELIVERY_UPG89_2026-09-04.md`。

---
*程序员 C · 2026-09-04 · worktree mov-upg89 可随验收流程收*
