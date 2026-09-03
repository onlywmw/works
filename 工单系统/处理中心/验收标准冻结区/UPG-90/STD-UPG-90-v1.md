# STD-UPG-90-v1 验收标准冻结版

> 工单：UPG-90 ｜ 标题：尾巴批修（S-06 打回项 ②⑧ + C7 基线测试非确定性）｜ 唯一正式冻结版

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-90-v1`
- **content_sha256**: `59e79222de1f4c8dfeb6b4997099742b7c06b10d083a8fcd6adc72273cea0793`
- **frozen_at**: `2026-09-03T12:00:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L2 中 | 批修小单 → 逐项实证 + 全量亲跑 | ① S-06 ②：`market-web/index.html:199` `href="explorer.html>` 引号未闭合修复（链接不再 404，真浏览器点验）；② S-06 ⑧：`sms-probe.js`/`make_guide.py`/`make_merchant.py`/`run-pc.sh` 四死文件 `git rm` 真实删除；③ C7：`C7BaselineGenerationTest` 非确定性输出治理——全量连跑两遍 `docs/c7_baseline_UPG63/` 零 M（时间戳类字段剔除断言或产物归 build/ 目录，二选一交付报告声明） |

### 亲杀锚

| 锚点 | 动作 | 期望 |
|---|---|---|
| S-06 ② 引号 | 恢复未闭合引号 | 链接断言（提取 href 可解析）必红 |
| C7 确定性 | 恢复时间戳写字段（或旧产物路径） | 「连跑两遍零 M」断言必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（0 失败基线）——连跑两遍 git status 零 M（C7+生成物全净） |
| 定向 | 链接断言 + C7 两跑零 M 输出（含统计时点） |
| 真机/Web | mow.kim 部署后点验 index→explorer 链接（或本地静态服务点验截图） |

### 销项条件（下列全满足）

- [ ] S-06 ②⑧ 修复（②引号闭合+⑧四死文件 git rm）——S-06 卡闭环销项
- [ ] C7 连跑两遍零 M（挂账-C7基线测试非确定性输出 销项）
- [ ] 全量绿零回归；亲杀 2 锚全红还原复绿
- [ ] Token/KV 两节申报（0/0）

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | 冻结依据 | 尾巴批：S-06 打回项 ②⑧（ACCEPTANCE_LOG ef3ad38）+ 挂账-C7基线测试非确定性输出；UPG-41 v2 两 P3（详情开关/enable 状态不一致）不并本单——涉 MainActivity 市场段，与 UPG-88 同面，排 88 合后随市场线批 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-90-v1.md"
```
