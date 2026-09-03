# DELIVERY_UPG95_2026-09-04 · UPG-95 个性化槽位选择（care profile 提炼 + 槽池 + LLM 编辑层 + ticketCard/rideCard 骨架）

> 程序员：C（Claude/wmw0027）｜ 认领登记 @2026-09-04（工单库 UPG-95 卡）｜ 结论：**三批全落 + 种子集 14 断言绿 + bun 18/18 + 变异 4 锚亲杀 + 模拟器 CDP 实证——待验收员验收（真机出卡=CDP 注入路径）**

---

## 〇、交付绑定（SYS-01 P0-2 · 红线 23）

```yaml
delivery_id: DEL-UPG95-20260904-001
standard_id: STD-UPG-95-v1   # content_sha256=b0ec94987bd769c403eab5f9f5e5cf76510f6cc5b6fcf19fbd6d1f7bb2b4abea
code_commit_sha: 979bf6bf    # feat/upg95（基 main 3315bff0=UPG-93 已合；提炼+编辑层 c1cb4404→槽池+渲染器 72f79e19→编辑层接线 979bf6bf）
artifact_sha: 2ff9131e526a8af5（APK 前 16——assembleDebug 绿后）
evidence_manifest_sha: 见 处理中心/delivery_UPG95_manifest.json
```

- verify-hash 交付时点 = `HASH_REJECT not-ancestor`（分支未合态必然——同前例，合后复跑=终态）。

## 一、施工内容（三批）

### 第一批：提炼层 + 编辑层纯函数（personalization/）

| 文件 | 内容 |
|---|---|
| **CareProfileExtractor.kt**（新） | 六域规则表 `CARE_RULES`（hotel.amenities.breakfast/bathtub、food.spice=high、food.coffee=americano_plain、rail.seat=window、ride.carpool=never、shopping.priority=value、travel.pattern=sun_out_fri_back——种子 M-01~08 对齐）；`extractCare(entries): Map<String,Any>`（**DRAFT 完全不参与**[闸在循环外——M-09/10]/**转述句跳过**[PARAPHRASE_MARKERS——「朋友说」双保险]/**FORBIDDEN 敏感整条跳过**[M-11「信仰佛教」的「吃素」下游命中也拦]）；amenities 聚合 linkedSet（breakfast 先于 bathtub=条目序）；`amenityCap ≤3` 截断；`isParaphrase/isForbidden` 公开（测试直断） |
| **CarePromptSegment.kt**（新） | 提示词节纯函数：`segment(care, domain)`——**标签注入不注原文**（UPG-05 红线）+槽池契约（SLOT_POOL 与种子 domain_default_slots 同源：hotel[评分,位置,价格/晚]/rail[班次时间,时长,价格]/ride[预估价,接驾时长,车型]/restaurant/cinema）+**禁发明新槽**+**双段输出指令**（amenities≤3/seat_pref/ride_pref 字段）+空 care 空节（零字节注入） |

### 第二批：Registry 槽池 + 渲染器（assets/home/）

| 文件 | 内容 |
|---|---|
| **registry_seed.js** | offerCard slots 增 `amenities`（≤3）；**ticketCard.v1/rideCard.v1 candidate 登记**（state=candidate——mock 消费者不算独立消费者**不转 registered**；slots 含 care 键 seat_pref/ride_pref；壳白名单 type/surface/data/action 同步） |
| **renderers_95.js**（新） | ticketCard.v1 渲染器（**路线头** 出发→到达 + **seat_pref 靠窗 chip**[care 注入] + kv 行）；rideCard.v1 渲染器（**司机行** 车型/车牌/接驾 + **ride_pref 独享 chip**[care=never] + **拼车选项过滤**[care=never 时 pool_option 不出现]）；offerCard amenities chips（**≤3 截断**——`renderOfferAmenitiesChips`） |
| **core.js 信封解包** | validatePresentationData 双形态兼容：`{content_type, presentation_intent, data:{载荷}}` 信封 → 载荷=data 子字段（UPG-95 三骨架渲染消费正确层级） |

### 第三批：编辑层接线（设计师裁决 A：豁免 2 行）

MainActivity systemPrompt 拼装串加：
```kotlin
+ com.mov.android.personalization.CarePromptSegment.segment(
    com.mov.android.personalization.CareProfileExtractor.extractCare(
        personalizationEntries().map { CareProfileExtractor.CareEntry(it.content, it.status) }), "hotel")
```
- **军规外豁免申报**：非 crash/null/lifecycle 保护，为 UPG-95 编辑层唯一合规落点（runChat/systemPrompt 留壳——U93 只搬工具注册面）；2 行接线（调用段 4 行=格式展开）
- **UPG-05 红线兑现**：注入=提炼标签（hotel.amenities=[breakfast,bathtub]/food.spice=high）；**记忆原文（住酒店一定要有早餐…）不进提示词**（CarePromptSegmentTest 6 案锚）

## 二、变异锚（4 · STD-UPG-95-v1 · 全红实录）

| 锚 | 变异动作 | 结果 |
|---|---|---|
| 画像提炼锚 | 删 hotel 域规则（早餐关键词不提炼） | M-01 断言（amenities 含 breakfast）**红**（CareProfileExtractorTest `M-01 早餐刚需`） |
| DRAFT 闸锚 | 提炼层改为 DRAFT 也驱动 | M-09/M-10 断言（画像为空）**红**（`DRAFT 不驱动`/`DRAFT+转述双重不驱动`） |
| 敏感闸锚 | 敏感拦截表删「宗教/信仰」 | M-11 断言（画像为空）**红**（`敏感闸`） |
| 槽池闸锚（ amenities） | 渲染器 amenityCap 恒全量 | amenities chips ≤3 断言**红**（第 4 项泳池出现） |

**还原后复绿**：bun **18/18**（core 12 + renderers 6）+ JVM **CareProfileExtractorTest 14/0**（种子 11+截断+编辑层+空 care）+ 全量 **108 套件 786/0/1**。

## 三、验证面（XML 计数 · 2026-09-04 统计时点）

| 面 | 结果 |
|---|---|
| JVM 提炼层 | CareProfileExtractorTest **14/0**（种子 11 全断言+amenityCap 截断+编辑层+空 care） |
| JVM 编辑层 | CarePromptSegmentTest **6/0**（标签注入不注原文/槽池契约/双段指令/空 care 空节/敏感纵深防御） |
| JS 引擎 | bun **18/18**（core 12 + renderers 6：ticketCard 路线头+seat_pref chip/rideCard 司机行+ride_pref 独享/amenities ≤3 截断/未登记回落/三道闸零回归） |
| 全量 | **108 套件 786/0/1 全绿**（0 失败基线） |
| 构建 | assembleDebug 绿（APK 前 16=2ff9131e） |
| 模拟器 | 冷启→极简主页→**CDP 铁证 home/index.html**（`emulator_minimal_home.png`） |

## 四、真机/模拟器出卡——CDP 注入路径（coverage PARTIAL 位如实申报）

- **模拟器**：home/index.html CDP 铁证 ✓（appassets 域加载成功）
- **出卡走 CDP 注入路径**：`Runtime.evaluate → MovHomeHost.onLlmChunk('```mov-presentation\n{ticket/ride/offer mock}\n```')`——引擎消费 Validated→栈渲染——**真机出卡截图=验收员持有**（coverage PARTIAL 位已预留：homeWeb agent chunk 接线[UPG-89 遗留]与出卡走查同批）

## 五、Token / KV 两节申报

- **Token**：care profile 注入节实测——M-01~08 全量约 **240B/请求**（极简模式新增；经典模式 0）；双段输出指令 ≈80B——合计 ≈320B（量级：通用提示词节的 ~3%）；**voice_hint 不占 LLM 轮次**（Registry 确定性槽）
- **KV**：0 新增（care profile 内存态 map；PrefStore 未触碰）

## 六、共享面影响清单 + 能力护栏（红线 24）

```yaml
## 能力护栏（P1-1）
共享面影响清单:
  - 共享面: systemPrompt 拼装串（+2 行 care 节接线——**军规外豁免已申报**）+ assets/home（registry_seed/renderers_95/index.html）
  - 影响下游: LLM 编辑层输出消费（core.js 三道闸已锁超界）；UPG-89 引擎（信封解包双形态兼容=零破坏）；UPG-51 提炼器（零改动——extractCare 独立新增）
  - 回归说明: 全量 786/0/1（0 失败基线）；UPG-51 提炼器既有测试零回归；UPG-89 bun 12/12 零回归（信封解包双形态兼容实证）；UPG-76/77/79/84 契约套件零回归
coverage_status: PARTIAL
# 模拟器出卡走 CDP 注入路径（真机出卡走查=验收员持有）；内存路径 agent chunk→homeWeb 接线=UPG-89 遗留转本单真机批——设计师裁决位
```

## 七、已登记两个表

① `工单表.xlsx`（sync 投影，UPG-95 行）；② `工单库.md` UPG-95 卡交付块。报告落 `程序员\交付报告\DELIVERY_UPG95_2026-09-04.md`。

---
*程序员 C · 2026-09-04 · worktree mov-upg95 可随验收流程收*
