# STD-UPG-86-v1 验收标准冻结版

> 工单：UPG-86 ｜ 标题：manifest 治理（存量补齐 + 审验.py 机器可验性强化）｜ 唯一正式冻结版

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-86-v1`
- **content_sha256**: `4b2ce3a75f18006231882e5fc054f407f84b99bfd7d58afd2accf7325b99af64`
- **frozen_at**: `2026-09-03T10:05:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L2 中 | 治理/工具链 → 机器校验全绿 + 亲杀 | ① 存量 delivery manifest（处理中心/delivery_UPG50/55/68/82/85 + 程序员/交付报告/*_manifest.json）全部机器可验：路径裸串（无嵌注释）、每条 evidence 带 sha256、manifest_sha 绑定值写入文件可重算对账；② 审验.py --manifest 强化：路径嵌注释/缺 sha256/绑定值未写入 → 检测即红（ok:False+明确诊断）；③ 历史交付内容零改动（只修清单形态，不改证据本体/不补造证据——缺失证据如实标 missing 不造假） |

### 亲杀锚

| 锚点 | 动作 | 期望 |
|---|---|---|
| 审验.py 校验强化 | 对「路径嵌注释/缺 sha256/绑定值未写入」三种坏 manifest 各喂一份 fixture | 三案全红（ok:False+诊断命中）+ 好 manifest 复绿 |
| 存量治理 | 治理后全部存量 manifest 跑 --manifest | 全绿（ok:True 重算一致）或如实标 missing（不造假） |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向 | 审验.py --manifest 三坏案红+好案绿 + 存量全量自检清单输出 |
| 回归 | 审验.py 其余子命令（--verify-hash/--ticket/--coverage 等）零回归（fixture 自测 PASS） |
| 证据链 | 三坏案输出+存量自检全绿输出（含时间戳） |

### 销项条件（下列全满足）

- [ ] 存量 manifest 全部机器可验（--manifest ok:True 或如实 missing 标注）
- [ ] 审验.py --manifest 三类失效检测落地+亲杀实证
- [ ] 挂账-deliveryManifest指纹治理 + 挂账-upg70-manifest缺口 销项
- [ ] 历史交付内容零改动声明（只修清单形态）
- [ ] Token/KV 0/0 申报（工单系统侧，无请求链路）

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | manifest 治理同族四现（UPG-82/85 审验发现+挂账-deliveryManifest指纹治理[UPG-50 复核]+挂账-upg70-manifest缺口）合并治理；红线 23「登记前自检」强制步已于 2026-09-03 生效，本单治存量+强化检测 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-86-v1.md"
```
