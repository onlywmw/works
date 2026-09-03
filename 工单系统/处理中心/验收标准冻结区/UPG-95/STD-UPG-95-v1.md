# STD-UPG-95-v1 验收标准冻结版

> 工单：UPG-95 ｜ 标题：个性化槽位选择（care profile 提炼 + 可选槽池 + LLM 编辑层 + ticketCard/rideCard 骨架落地）｜ 唯一正式冻结版

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-95-v1`
- **content_sha256**: `b0ec94987bd769c403eab5f9f5e5cf76510f6cc5b6fcf19fbd6d1f7bb2b4abea`
- **frozen_at**: `2026-09-04T05:10:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L2 中 | 提炼层/槽池/编辑契约 → 种子集驱动断言 + diff 精读 + 变异亲杀 + 引擎渲染实证 | ① care profile 提炼层（MemoryPreferenceExtractor 扩展：hotel/food/rail/ride/travel/shopping 六域规则，DRAFT 不驱动+敏感绝不进+转述降权）；② Registry 槽池（offerCard.amenities ≤3 + ticketCard/rideCard candidate 登记 + 壳白名单同步）；③ 骨架渲染器（ticketCard 路线头/rideCard 司机行/amenities chips，照 demo v6 形锚）；④ LLM 编辑层提示词节（全量事实 × 画像 → 槽池内选择，禁发明新槽）；⑤ 种子集 11 条全断言；⑥ mock 全量事实 fixtures ×3（标注 MOCK） |

### 变异锚（L2 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| 画像提炼锚 | 删 hotel 域规则（早餐关键词不提炼） | 种子 M-01 断言（care.hotel.amenities 含 breakfast）必红 |
| DRAFT 闸锚 | 提炼层改为 DRAFT 也驱动 | 种子 M-09/M-10 断言（画像为空）必红 |
| 敏感闸锚 | 敏感类拦截表删「宗教/信仰」 | 种子 M-11 断言（画像为空）必红 |
| 槽池闸锚 | 词表校验放行槽池外字段（发明新槽不拒收） | 「发明槽→拒收→fallback→telemetry」测试必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向用例 | 种子集 11 条全断言（8 正向画像+槽位效果/1 兜底默认槽/2 DRAFT 负向/1 敏感拦截）+ 提炼器域规则单测 + 槽池白名单/截断（≤3）+ 两新骨架渲染（mock fixtures 灌槽端到端：酒店卡 amenities=[含双早,浴缸]） |
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（0 失败基线，/1 口径）；UPG-51/89 提炼/引擎套件零回归 |
| 构建 | `:app:assembleDebug` 绿 |
| 证据链 | bun/JVM XML（含时间戳）+ 引擎渲染截图四场景（酒店个性化卡/铁路靠窗卡/打车独享卡/电影默认兜底卡——CDP 注入路径可） |
| 真机 L2 | coverage PARTIAL 申报位成立（homeWeb agent 接线属后续批；本单实证到引擎渲染层） |

### 销项条件（下列全满足）

- [ ] care profile 提炼层：六域规则 + DRAFT 不驱动 + 敏感拦截 + 转述降权（纯函数零 LLM，确定性可复跑）
- [ ] Registry：offerCard.amenities（≤3 坑）+ ticketCard.v1/rideCard.v1 登记 state=candidate + style_tokens 白名单同步（v1.2 §二纪律）
- [ ] 骨架渲染器 ×2 + amenities chips（形锚=demo v6；token 全引用禁硬编码）
- [ ] LLM 编辑层提示词节：槽池选择契约 + 禁发明新槽 + 提炼标签注入（不注入记忆原文）
- [ ] mock fixtures ×3（酒店/高铁/快车，标注 MOCK 不涉真实数据源）
- [ ] 种子集 11 断言全绿 + 4 变异锚亲杀红→还原复绿
- [ ] 三道闸（PV-01/词表/Danger）零回归；能力零缩减
- [ ] Token/KV 两节申报（care 注入节字节实测）

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-04 | 设计师B | 冻结依据 | 用户拍板方向「商户信息尽量全+用户侧个性化显示」；契约=v1.2 增补附录 B；种子基件=个性化画像_记忆种子集_v1（11 条带 expected）；形锚=demo v6；与 UPG-94 同 index.html 面——建议 94 先合或同人串行 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-95-v1.md"
```
