# STD-UPG-103-v1 验收标准冻结版

> 工单：UPG-103 ｜ 标题：MainActivity 拆分·批④ chips/胶囊面搬移（→ ui/chips/ + ui/capsule/）｜ 唯一正确文件（后续修订=升版）

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-103-v1`
- **content_sha256**: `ad36a5fd92356ce0b4634f8ffd8dc6093930663b86008e2b0d6db0aa978f22f0`（计算口径：本行排除后全文 sha256；冻结批准时由审验员核算）
- **frozen_at**: `2026-09-04T20:30:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | God File 拆分批④ → diff 精读 + 变异亲杀 + sha256 冻结清单保真 + 真机冒烟 | ①chips 两级气泡 ②主页胶囊装配/持久化 ③market.uninstall 跨面读写归位 |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| sha256 冻结清单锚（**本批起强制范式**） | 搬移块内改一行逻辑 | 「搬出块 sha256 与冻结基线全等」断言必红（UPG-93/98 范式；UPG-102 挂账 P3 落地） |
| 名单锚 | 漏搬一个 chips/capsule 函数（或多挂伪函数） | 「cips/capsule 面名单完备」契约锚必红 |
| 唯一写点锚 | MainActivity 壳内残留第二实现（伪搬移=复制不删） | 「壳内零残留」锚必红 |
| 生命周期归属锚 | onRequestPermissionsResult/onActivityResult 相关回调归属漂移 | 归属策略断言 + 行为回归（归属=搬出模块） |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向用例 | ChipsCapsuleSplitContractTest（sha256 冻结清单/名单完备/唯一写点/直呼接线/军规 8——照 UPG-93/98 契约锚范式） |
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（0 失败基线；UPG-93/98/102 拆分锚零回归） |
| 构建 | `:app:assembleDebug` 绿；**提交版=验证版**（全新检出复跑——批② §P51b 教训） |
| 证据链 | sha256 冻结清单（拆前/拆后哈希表）+ internal 提升清单 + 锚迁移清单 + 冷启动采样 + 真机截图 |
| 真机 L3 | ①chips 两级气泡：分组展开/收起/选择一致 ②主页胶囊：增删/切换 preset/持久化重启 ③适配 market.uninstall 归位后行为不变 |
| 冷启动锚 | 拆前后各 5 次采样取中位，Δ>10% 标红须解释 |

### 接口契约（过 UPG-89 评审）

- 搬出模块接口挂点经 UPG-89 契约定稿评审（接口=执行串行、接口并行）；接口面若与 UPG-89 挂点冲突 → 停下报设计师，不许自定
- P0 约束：Feature/Registrar 禁止长期持有 Activity（install/register 完成即释放引用）；ToolsRegistry 防二 God File（聚合/顺序/公共注册契约，不承载具体 handler）

### 销项条件（下列全满足）

1. 定向契约锚全绿 + 全量 0 失败 + assembleDebug 绿（提交版=验证版）
2. 变异亲杀 4 组全红→还原复绿（sha256/名单/唯一写点/生命周期归属）
3. 真机 L3 三场景实证 + 冷启动 Δ≤10%
4. 债务清单随批附（只记录不修）+ Token/KV 两节必报
