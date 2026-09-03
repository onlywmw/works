# STD-UPG-92-v1 验收标准冻结版

> 工单：UPG-92 ｜ 标题：manifest 硬闸化（deliver-gen 源头合规 + 自检内置）｜ 唯一正式冻结版

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-92-v1`
- **content_sha256**: `a2c0fcd7b2afb725db48172d9a86dd23b188b0005599554c418e09effe1d9bf7`
- **frozen_at**: `2026-09-03T13:40:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L2 中 | 治理/工具链 → 机器校验亲跑 + 亲杀 | ① deliver-gen.mjs 从源头产出合规 manifest（路径裸串/条带 sha256/绑定值写入可重算）——机器产出即合规，不靠人记得跑自检；② 自检内置：deliver-gen 产出后自跑 审验.py --manifest 校验，不合规=交付生成失败（硬闸）；③ 第六现根因（红线 23「登记前自检」声称未执行）机制性闭环 |

### 亲杀锚

| 锚点 | 动作 | 期望 |
|---|---|---|
| 源头合规 | deliver-gen 产出一份 manifest | 审验.py --manifest ok:True 可重算一致（零人工修补） |
| 硬闸 | 注入不合规 manifest 内容（路径嵌注释/缺 sha256） | deliver-gen 自检拒绝产出/交付生成失败（不是警告是拒绝） |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向 | deliver-gen 产出 manifest 合规（ok:True）+ 注入不合规 → 拒绝产出（亲杀） |
| 回归 | 审验.py 全部子命令零回归（fixture 自测 PASS）+ deliver-gen 骨架生成功能零回归 |
| 证据链 | 产出合规输出 + 亲杀拒绝输出（含时间戳） |

### 销项条件（下列全满足）

- [ ] deliver-gen 产出 manifest 默认合规（审验.py --manifest ok:True 可重算）
- [ ] 自检内置硬闸（不合规=交付生成失败，非警告）
- [ ] 审验.py/deliver-gen 既有功能零回归
- [ ] Token/KV 0/0 申报

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | manifest 同族第六现（UPG-88 交付 manifest 在 86 治理完成 4 小时后再度失效——红线 23「登记前自检」声称未执行，执行闸未闭环）；审验员三建议取最硬：deliver-gen 源头合规+自检内置（机器产出即合规，不靠人） |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-92-v1.md"
```
