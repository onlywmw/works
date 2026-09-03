# STD-UPG-94-v1 验收标准冻结版

> 工单：UPG-94 ｜ 标题：极简主页真机观感修复（dock 隐藏 + logo 去框去影 + hint 删除 + 发送钮归 token）｜ 唯一正式冻结版

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-94-v1`
- **content_sha256**: `4fca8e5dae1c9d69b27970f6f4f0e2d88b398b5af222e21b5d19043d492ada28`
- **frozen_at**: `2026-09-04T04:30:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L2 中 | UI 可见性/样式面 → diff 精读 + 契约锚 + 真机/模拟器截图目测 | ① 极简态 dock（chips 行+composer+hint 行）不可见，经典态原样恢复；② heroLogo 无 border-radius/box-shadow（含 listening 态绿环投影拆除），logo 透明底贴画布；③ heroHint 行删除（节点+CSS 零残留），input placeholder 保留；④ btnSend 归 v1.2 纯黑 pill（非 --brand 薄荷绿） |

### 变异锚（L2 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| dock 路由锚 | 删 applyPresentationMode 极简分支 dock GONE 行 | 「极简态 dock 不可见」契约锚必红 |
| hero 装饰锚 | 还原 heroLogo box-shadow / heroHint 节点 | 「零装饰+无 hint」契约锚必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向用例 | JVM 源码锚 2（dock 路由/hero 装饰+hint+btnSend token） |
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（0 失败基线）；UPG-88/89 模式/引擎套件零回归 |
| 构建 | `:app:assembleDebug` 绿 |
| 证据链 | 截图四场景（含时间戳）：极简主页 dock 不可见/logo 无牌无影/无 hint 行/经典态 dock 原样恢复 |
| 真机 L2 | 用户平板复验：极简主页干净底座（顶部无经典残留） |

### 销项条件（下列全满足）

- [ ] applyPresentationMode 极简=dock GONE / 经典=dock VISIBLE（dock 字段化；军规 7 豁免注记=修既有装配行非新增面）
- [ ] heroLogo 零装饰（无 border-radius/box-shadow；listening 态呼吸保留、绿环投影拆除）
- [ ] heroHint 节点+CSS 零残留；input placeholder 保留
- [ ] btnSend 纯黑 pill（v1.2 §一 口径，明暗双主题正确）
- [ ] 两变异锚亲杀红→还原复绿；经典模式 dock 零回归；全量绿+assembleDebug 绿
- [ ] MainActivity.kt 纯 CRLF；core.js/registry_seed 零触碰；Token/KV 两节申报

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-04 | 设计师B | 冻结依据 | 用户真机实测踩中（2026-09-04）：dock 飘顶=applyPresentationMode 隐藏清单遗漏（UPG-88 交付缺件，模拟器验收未覆盖 dock 可见性——验收方法论教训：模式切换须核「旧面全隐藏」清单）；logo 牌感=CSS border-radius+绿光晕投影（logo.png 透明底无问题）；heroHint 删除+发送钮纯黑=用户拍板/v1.2 冻结口径 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-94-v1.md"
```
