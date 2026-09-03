# STD-UPG-89-v2 验收标准冻结版

> 工单：UPG-89 ｜ 标题：极简呈现引擎（PresentationRegistry + core.js 呈现栈 + Intent Router + Response Splitter + 三骨架）｜ 唯一正式冻结版（v2：吸收呈现体系 v1.2 冻结增补——卡面 token/样式词表/动效 intent；替代 v1）
> v1（sha=c0c7571b）作废原因：设计口径升级（demo v3→v4；动效字面时长→Motion Intent；新增 PV-01/词表命名空间/未知词策略/Danger 白名单四组锚）

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-89-v2`
- **content_sha256**: `cee5657403fd9fa5605e8aebec28001091cc4071fa8544b6f408b854551a0266`
- **frozen_at**: `2026-09-04T02:50:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | 引擎/契约/安全面 → diff 精读 + 变异亲杀 + 真机多场景 | ① PresentationRegistry 落地（九字段 + style_tokens 壳级白名单 + style_vocabulary_version="1.2"）；② Surface 四类抽象 + Transient/Persistent 区分；③ 呈现栈 z 序+docked+决策置顶；④ Intent Router 四路仲裁（足迹）；⑤ Response Splitter 解析隔离（UI 只消费 Validated PresentationData）+ **PV-01 原始视觉字面量拒收**；⑥ 动效=Motion Intent 五条（enter/exit/expand/docked/micro），组件层禁直接引 duration token；⑦ 浅栈+Recall 小圆片按 PresentationPolicy 分档；⑧ 卡面 token 值（圆角 22/20、无描边、--card-shadow-lg、scrim 含 blur）；⑨ Danger Semantic Allowlist（action.reject/time.critical/payment.sensitive/security.sensitive 四词，越表拒收） |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| 军规闸 | 让 LLM 主回复直接驱动 UI（绕过 Response Splitter） | 「UI 只消费 Validated PresentationData」测试必红 |
| PV-01 闸 | PresentationData 注入原始视觉字面量（fontSize/color/borderRadius/shadow 值） | 「字面量拒收」测试必红 |
| 词表闸 | 使用壳白名单外/未登记 style token（含裸词无命名空间） | 「未知词→拒收→fallback 壳默认→telemetry」测试必红 |
| Danger 闸 | 非白名单语义请求 danger（如普通提示标红） | 「Danger Allowlist 拒收」测试必红 |
| 未登记回落 | 未登记 content_type 渲染壳 | 引擎拒渲染+纯文本回落断言必红 |
| 决策置顶 | 审批卡未置顶（内容卡压决策卡） | z 序断言必红 |
| 输入仲裁 | Blocking Decision pending 时新输入直接执行 | 「pending 时新输入进仲裁四路+足迹」测试必红 |
| 栈深 policy | 超 maxVisibleStackDepth 不收叠 | 栈深断言必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向用例 | Registry 登记/治理（candidate→registered/未登记回落/壳白名单）+ Surface z 序/置顶 + Splitter 解析隔离（好块/坏块/漂移/**字面量注入**）+ Intent Router 四路 + 浅栈/Recall policy + **卡面 token 值锚（22/20 圆角、无描边、投影公式、scrim blur）+ Motion Intent 映射锚（五词→duration/easing 对）+ Danger 白名单锚** |
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（0 失败基线）；UPG-76/79/84/88 审批/收敛/模式套件零回归 |
| 构建 | `:app:assembleDebug` 绿 |
| 证据链 | 真机截图/录屏要点（含时间戳）+ journal 四环节 |
| 真机 L3 | ① 底座=空画布+输入按钮永在场（内容在场时收角落小圆钮）；② 说话/打字→内容卡浮现（motion.enter 浮现感+dock 转场）；③ 审批叠卡置顶+决策前内容只读+拒绝钮功能红；④ pending 中说「算了换一个」→仲裁 Cancel+NewTask 足迹；⑤ 未登记类型→纯文本回落卡；⑥ 折叠小圆片→点回展开；⑦ ASR 真人发声端到端（UPG-88 coverage PARTIAL 随本单补验） |

### 销项条件（下列全满足）

- [ ] PresentationRegistry：九字段契约 + style_tokens 壳级白名单 + style_vocabulary_version="1.2" + 登记纪律（candidate/≥2 独立消费者转 registered/未登记 fail-closed 回落）
- [ ] 样式词表：七命名空间（type./surface./action./data./status./motion./layout.）；裸词非法；PV-01 字面量拒收；未知词=拒收→fallback→telemetry（禁静默忽略）
- [ ] Surface 四类 + Transient/Persistent + 呈现栈 z 序 + docked + 决策置顶
- [ ] 卡面 token 值落地：圆角 22（内容大卡）/20（决策卡）/16/12/999pill；卡面无描边；--card-shadow(-lg) 双层投影明暗两套；scrim 浅色 rgba(238,240,244,.55)+blur(3px)/深色 rgba(0,0,0,.5)；caps 题+pill 主钮纯黑
- [ ] 动效：Motion Intent 五条（enter 300ms emphasized-decelerate / exit 250ms emphasized-accelerate / expand 200ms / docked 450ms standard / micro 150ms）；组件层无 duration/easing 字面量；prefers-reduced-motion→micro 退化
- [ ] Danger Semantic Allowlist 四词可校验；功能红零扩面
- [ ] 浅栈+Recall 小圆片读 PresentationPolicy（手机/平板分档，非硬编码常量）
- [ ] Intent Router 四路仲裁（Cancel/Modify/NewTask/Defer）+ 全足迹
- [ ] Response Splitter：Renderer/引擎只消费 Validated PresentationData；主回复漂移不塌 UI（变异锚实证）
- [ ] 内容双通道：schema 直映优先 + LLM 提取过校验（双段输出零额外轮次）
- [ ] 三骨架：offerCard/timelineList/plain（对应 demo v4 形态；纯文本回落含诚实小字）
- [ ] 八变异锚亲杀全红还原复绿；能力零缩减断言（两模式工具面同一全集）
- [ ] Token/KV 两节申报（双段输出零额外轮次；voice_hint 不占 LLM 轮次）

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-04 | 设计师B | v2 冻结依据 | 设计文=呈现体系 v1.1（大神 8.8 吸收版）+ **v1.2 增补（已冻结，大神 9.2/10 吸收 4×P1：Motion Intent/词表命名空间/版本化+未知词策略/Danger 白名单）**；demo v4 为视觉基准（替代 v3）；UPG-88 已合 main（43e5756）依赖解除 |
| 2026-09-04 | 设计师B | 锚⑥（决策置顶）死变异事件——程序员申报：加强变异（z 数值断言+layer-aware 排序）复跑仍 NOT-RED，如实转复验 | **设计师裁决**：① 定性采信——死变异=测试有效性问题，非产品缺陷，不阻塞产品面；② **处置修正——锚⑥不适用「移除」**：决策置顶是安全不变量（审批永远压内容，与 2026-09-02 审批断链 P0 同族语义），安全锚不可无杀；③ 处置定死=**断言重设计到可观测面**（三选一：a. 断言直调引擎实际计算层序的函数输出，禁平行重算；b. 若 z 序在 CSS/WebView 侧 JVM 天然不可观测→引擎输出「层序数组」作为契约面，测试断言该数组，CSS 类映射表自身另立锚；c. 真机档截图两帧实证遮挡关系）；④ STD 冻结区文本**不需修订**——锚⑥期望「z 序断言必红」仍成立，只改断言实现；⑤ 教训入册：NOT-RED 加强复跑仍不红=锚失效信号，「移除锚」仅在语义本身退役时可选 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-89-v2.md"
```
