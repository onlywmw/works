# STD-UPG-96-v1 验收标准冻结版

> 工单：UPG-96 ｜ 标题：homeWeb 呈现回路接线（极简发送不回落 + LLM 回复回流出卡 + 真机批收口）｜ 唯一正式冻结版

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-96-v1`
- **content_sha256**: `c48ea8a6fa9087bdf39b71e693c30a9512d0e752e2134515733209382fc80a88`
- **frozen_at**: `2026-09-04T05:40:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | 对话主链路改线 → diff 精读 + 变异亲杀 + 真机七场景 | ① 极简发送不回落经典（sendFromHome 删切回，模式持久化零改写）；② 回复回流（发送源=home 且极简态 → MovHomeHost.onLlmChunk 转发，jsString 转义）；③ 经典面零回归（markstream/工具/审批链不动）；④ fail-safe（homeWeb 未装配/JS 异常→经典呈现+日志，回答零静默丢失）；⑤ 仲裁事件足迹（pending 时新输入四路+journal 可查） |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| 回落锚 | sendFromHome 恢复 applyPresentationMode(CLASSIC) 调用 | 「极简发送不回落+持久化零改写」契约锚必红 |
| 转发锚 | 删 onLlmChunk 转发调用 | 「极简态回复抵达 homeWeb」契约锚必红 |
| 静默闸 | 删 fail-safe 经典回落分支 | 「homeWeb 异常时回答仍呈现」锚必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向用例 | 不回落/转发/fail-safe 三锚 + 仲裁事件足迹断言 + 模式持久化断言 |
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（0 失败基线，/1 口径）；UPG-84/88/89 模式与引擎套件零回归 |
| 构建 | `:app:assembleDebug` 绿 |
| 证据链 | 真机录屏/截图（含时间戳）+ journal 四环节（仲裁足迹可查实证） |
| 真机 L3（七场景——88/89 持有项收口） | ①极简打字发问→不跳经典→内容卡浮现（dock 转场）②ASR 真人发声端到端（说→转写→发送→出卡）③审批叠卡置顶+决策前内容只读 ④pending 中「算了换一个」→Cancel+NewTask 足迹 ⑤未登记类型→纯文本回落卡 ⑥小圆片折叠→点回展开 ⑦杀进程重启=极简保持+输入入口在场 |

### 销项条件（下列全满足）

- [ ] sendFromHome 不切经典；模式持久化零改写；档位语义（发送时刻=极简→reasoning off+简洁节）不变
- [ ] 回复转发：发送源=home 且极简态 → onLlmChunk 抵达 homeWeb（引擎出卡实证）；经典发送源零变化
- [ ] fail-safe：homeWeb 未装配/JS 异常 → 经典呈现+appendLog；回答零静默
- [ ] 仲裁四路事件足迹 journal 可查
- [ ] 3 变异锚亲杀红→还原复绿；全量绿+assembleDebug 绿
- [ ] 真机七场景全录（UPG-88 ASR PARTIAL + UPG-89 真机出卡持有项随本单销项）
- [ ] Token/KV 两节申报

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-04 | 设计师B | 冻结依据 | 依赖 UPG-94 先合（seed 未合并=接线也回落纯文本）；MainActivity 棘轮军规豁免=改既有对话链路线（runChat/sendFromHome），非新增业务面；Agent 装配面归 UPG-93 批⑦另拆；本单合后极简模式=完全体（语音/打字→出卡→审批→收叠闭环） |
| 2026-09-04 | 设计师B | UPG-94 合后范围追加（冻结区不动，范围注记） | 94 合 main @806bb01c 但设计师追加项两件未随 94 落地（种子登记簿未合并进 engine.registry + timelineList 骨架 CSS 缺——问题区已裁决转出）：**并入本单施工范围**——①index.html 构造 engine 后合并 MovRegistrySeed（+「引擎实例登记簿非空」契约锚）②timelineList 骨架 CSS（.tl/.tl-dot 时间线）入 index.html。无此两件，真机场景①出卡不成立 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-96-v1.md"
```
