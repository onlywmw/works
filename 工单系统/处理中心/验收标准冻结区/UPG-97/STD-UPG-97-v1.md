# STD-UPG-97-v1 验收标准冻结版

> 工单：UPG-97 ｜ 标题：侧边栏工作台三入口接线（我的记忆/我的资产/我的能力）+ comingSoon 兜底可见性 ｜ 唯一正式冻结版

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-97-v1`
- **content_sha256**: `37c9db0493405ced8eb18d8cb08706714b67c2dd9f6205307ea3c49a86b2464f`
- **frozen_at**: `2026-09-04T06:00:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L2 中 | 前端分派欠账 → diff 精读 + 变异亲杀 + 真机五点验 | ① openPage 三 case 接线（记忆→ui.openMemory/资产→ui.openAssets/能力→ui.openWorkbench），槽位 page 键值与 case 对齐实证；② comingSoon 兜底=可见人话提示；③ 产物从 mov-vue 构建同步（禁手改 bundle）；④ 既有接线零回归（房间区/钉选/profile/MCP 市场/订单） |

### 变异锚（L2 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| 分派锚 | 删 openPage 的 memory case | 「我的记忆入口→ui.openMemory」契约锚必红 |
| 兜底锚 | comingSoon 提示改回不可见/删除 | 「未接线槽位→可见提示」锚必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 定向用例 | SidebarNav 源契约锚（三 case+键值对齐）+ 既有分派回归（orders/vault/tasks/market） |
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（0 失败基线，/1 口径） |
| 构建 | `:app:assembleDebug` 绿（产物同步后） |
| 证据链 | 真机录屏/截图（含时间戳）：五入口逐个点开对应页面 |
| 真机 L2 | 五点验：MCP 市场/我的订单/我的记忆/我的资产/我的能力 全通 + 未接线槽位（如有）提示可见 |

### 销项条件（下列全满足）

- [ ] openPage 三 case 接线且 page 键值对齐实证（源引用行号）
- [ ] comingSoon 兜底可见（真机实证）
- [ ] 产物=mov-vue 构建同步（构建日志/hash 在档）；禁手改 bundle
- [ ] 2 变异锚亲杀红→还原复绿；全量绿+assembleDebug 绿
- [ ] 真机五点验全过；MainActivity/tools 零行改动
- [ ] Token/KV 两节申报

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-04 | 设计师B | 冻结依据 | 用户真机报障「侧边栏有的按钮失灵」→ 设计师 adb 实测复现+根因定位（SidebarNav.vue:244-247 三 case 外全落 comingSoon；原生 handler/白名单齐备）；**验收方法论教训：导航类页面验收须「入口清单全点验」**（本缺陷长期存在未被任何验收抓到）；9-02 openAssets 分派漏 case 同族病——键值对齐必须实证 |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-97-v1.md"
```
