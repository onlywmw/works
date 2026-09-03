# STD-UPG-89-v1 验收标准冻结版

> 工单：UPG-89 ｜ 标题：极简呈现引擎（PresentationRegistry + core.js 呈现栈 + Intent Router + Response Splitter + 三骨架）｜ 唯一正式冻结版

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-89-v1`
- **content_sha256**: `c0c7571b90e0b0c8c365244bacf760385816d72f209db6bba3205a578ffd0fd9`
- **frozen_at**: `2026-09-03T11:20:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | 引擎/契约/安全面 → diff 精读 + 变异亲杀 + 真机多场景 | ① PresentationRegistry 落地（content_type+presentation_intent+shell/skeleton/slots/components/voice_hint/owner/state 九字段）；② Surface 四类抽象（Base/Content/Decision/Recall）+ Transient/Persistent 区分；③ 呈现栈 z 序+docked+决策置顶；④ Intent Router 四路仲裁（阻塞决策时输入不打断不抢占不丢失+足迹）；⑤ Response Splitter 解析隔离（UI 只消费 Validated PresentationData）；⑥ 动效三原语参数冻结；⑦ 浅栈+Recall 小圆片按 PresentationPolicy 分档 |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| 军规闸 | 让 LLM 主回复直接驱动 UI（绕过 Response Splitter） | 「UI 只消费 Validated PresentationData」测试必红 |
| 未登记回落 | 未登记 content_type 渲染壳 | 引擎拒渲染+纯文本回落断言必红 |
| 决策置顶 | 审批卡未置顶（内容卡压决策卡） | z 序断言必红 |
| 输入仲裁 | Blocking Decision pending 时新输入直接执行 | 「pending 时新输入进仲裁四路+足迹」测试必红 |
| 栈深 policy | 超 maxVisibleStackDepth 不收叠 | 栈深断言必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向用例 | Registry 登记/治理（candidate→registered/未登记回落）+ Surface z 序/置顶 + Splitter 解析隔离（好块/坏块/漂移）+ Intent Router 四路 + 浅栈/Recall policy + 动效参数锚 |
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（0 失败基线）；UPG-76/79/84 审批与收敛套件零回归 |
| 构建 | `:app:assembleDebug` 绿 |
| 证据链 | 真机截图/录屏要点（含时间戳）+ journal 四环节 |
| 真机 L3 | ① 底座=空画布+输入按钮永在场（内容在场时收角落小圆钮）；② 说话/打字→内容卡浮现（dock 转场）；③ 审批叠卡置顶+决策前内容只读；④ pending 中说「算了换一个」→仲裁 Cancel+NewTask 足迹；⑤ 未登记类型→纯文本回落卡；⑥ 折叠小圆片→点回展开 |

### 销项条件（下列全满足）

- [ ] PresentationRegistry 九字段契约 + 登记纪律（candidate/≥2 独立消费者转 registered/未登记 fail-closed 回落）
- [ ] Surface 四类 + Transient/Persistent + 呈现栈 z 序 + docked + 决策置顶
- [ ] 动效三原语参数冻结（浮现 280ms/收叠 260ms/层叠）+ prefers-reduced-motion 退化
- [ ] 浅栈+Recall 小圆片读 PresentationPolicy（手机/平板分档，非硬编码常量）
- [ ] Intent Router 四路仲裁（Cancel/Modify/NewTask/Defer）+ 全足迹
- [ ] Response Splitter：Renderer/引擎只消费 Validated PresentationData；主回复漂移不塌 UI（变异锚实证）
- [ ] 内容双通道：schema 直映优先 + LLM 提取过校验（双段输出零额外轮次）
- [ ] 三骨架：offerCard/timelineList/plain（对应 demo v3 三形态）
- [ ] 五变异锚亲杀全红还原复绿；能力零缩减断言（两模式工具面同一全集）
- [ ] Token/KV 两节申报（双段输出零额外轮次；voice_hint 不占 LLM 轮次）

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | 设计文=`极简模式_呈现交互体系_设计_v1.1_2026-09-03.md`（大神评审 8.8/10 吸收版+用户两条拍板终版）；demo v3 为视觉基准；依赖 UPG-88（阶段 1 底座/ASR/两态开关）——同面建议串行或 88 先合 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-89-v1.md"
```
