# STD-UPG-99-v1 验收标准冻结版

> 工单：UPG-99 ｜ 标题：工单系统工具链硬闸批（DEL 分支头校验 + standard_id 交叉校验 + 报告模板强制段 + 红线 23 落规）｜ 唯一正式冻结版

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-99-v1`
- **content_sha256**: `4d1dacc34f4416be6fddb351137202eba6b159eae7cd04992f6b2c33dcafcdc5`
- **frozen_at**: `2026-09-04T07:00:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L2 中 | 工具链治理 → diff 精读 + 自测正反案亲跑 + 实战过闸实证 | ① sync-orders.mjs DEL 绑定 hash==分支头机器校验（不一致标 ⏳失效+--check 非零；豁免注记识别）；② 审验.py --manifest standard_id 名↔内嵌 sha256 交叉校验（STD 冻结区重算比对）；③ deliver-gen.mjs 报告模板加「重大回归与自纠」强制节+「截图随追加」提示；④ 红线 23 细则两条明文落档（机制产出/分支头重绑） |

### 变异锚（L2 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| DEL 校验锚 | 构造 DEL 绑定 hash≠分支头的库卡 | sync --check 非零 + ⏳失效标注出现 |
| 交叉校验锚 | 喂 standard_id 名/指纹错位 manifest（UPG-93 型） | 审验.py --manifest ok:False + 指明错位 |
| 模板锚 | 删模板「重大回归与自纠」节 | 模板契约自测必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向用例 | 四件正反案自测全绿（正案过/反案拦） |
| 既有回归 | deliver-gen --self-test 4 案 + 审验.py --manifest-self-test/--verify-hash-self-test 既有案全绿；sync 投影既有库 diff=0 |
| 证据链 | 实战过闸两实证（历史违规 manifest 拦截 + DEL 漂移库卡标注）输出在档 |
| 文档 | 红线 23 细则/README 两条明文 diff 在档 |

### 销项条件（下列全满足）

- [ ] sync-orders.mjs：DEL 绑定 hash==分支头校验落地（⏳失效标注+--check 非零+豁免识别）
- [ ] 审验.py：standard_id 名↔内嵌 sha256 交叉校验落地（错位=ok:False 人话报错）
- [ ] deliver-gen.mjs：模板两节落地（强制节不可删+视觉提示行）
- [ ] 红线 23 细则两条明文（机制产出/分支头重绑或豁免）
- [ ] 三变异锚亲杀红→还原复绿；既有 self-test 全绿零回归；sync diff=0
- [ ] 报错人话化（谁/哪条/怎么修）

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-04 | 设计师B | 冻结依据 | 四条裁决的机制化收口：DEL 漂移三连（89/91/94）/standard_id 张冠李戴（93）/自纠不报（94）/manifest 六连手工绕闸（88-95）；施工仓=工单系统仓 works.git（与 MOV 仓在飞单 96/97/98 物理零冲突）；本单合后「治理靠机制不靠人盯」闭环 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-99-v1.md"
```
