# STD-UPG-93-v2 验收标准冻结版

> 工单：UPG-93 ｜ 标题：MainActivity 拆分·阶段 1（工具注册面搬移 + 拆分蓝图落档）｜ 唯一正式冻结版
> **派生自 STD-UPG-93-v1**（修订：大神终审 3×P0 钉入——ToolsRegistry 防二次上帝文件/185 直呼证据等级三层/Activity 持有边界；v1 留档）

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-93-v2`
- **content_sha256**: `5dfd1a3d190bff63d13da4ec0cfa226967537aee6805ad580674cc80b73e6b1f`
- **frozen_at**: `2026-09-03T14:20:00`
- **frozen_by**: 设计师B
- **approved_by**: 审验员（派单后确认，验收启动前补齐）

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L3 高 | 大文件拆封（高风险重构）→ 零行为变化实证 + 变异亲杀 + 真机冒烟 | ① 工具注册面（185 个 mcpHandlers 注册+handler 实现）搬入独立装配模块（`ToolsRegistry.kt` 或同等），MainActivity 只剩装配调用；② **零行为变化**：工具面全集同名同数（185 计数锚）、handler 体内逻辑原样（只允许可见性/依赖注入的必要调整，禁止顺手优化）；③ 拆分蓝图落档（全量盘点+后续分批计划）；④ 全量 0 失败 + 真机冒烟 |

### 变异锚（L3 必填）

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| 注册完备 | 拆分后漏挂一个 handler（如 vault.get） | 工具面全集计数/名单断言必红 + 工具直呼测试红 |
| 行为等价 | 搬移时改某 handler 逻辑一行 | 对应该工具契约测试必红 |
| 装配单点 | 出现第二个注册写点（MainActivity 残留直接 mcpHandlers[ 写入） | 「注册唯一写点=ToolsRegistry」静态锚必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 全量回归 | `testDebugUnitTest --rerun-tasks` 绿（0 失败基线）；审批系/UPG-84/UPG-76/79 全部契约套件零回归 |
| 定向 | 185 注册完整性直呼（脚本化全量）+ 关键域行为契约抽样（20-30）+ 注册唯一写点静态锚 + 5 代表工具直呼契约（file.read/vault.get/shell.exec/market.status/tool.help） |
| 构建 | `:app:assembleDebug` 绿 |
| 真机 L3 | 平板冒烟：对话往返 + 一次写类审批卡（悬浮卡正常）+ 一次工具直呼（tool.help）——截图+logcat 含时间戳 |

### 销项条件（下列全满足）

- [ ] 工具注册面搬入 `tools/` 目录：**ToolsRegistry.kt 只聚合/顺序/公共契约，不承载任何具体 handler 实现**（P0-1——分域 Registrar 承载实现，防「God Activity→God Registry」）；MainActivity 内 mcpHandlers[ 直接写入=零，只剩装配调用
- [ ] **Activity 持有边界（P0-3）**：Registrar/Feature 不得长期持有 Activity 引用——交互走 Host/Bridge 接口；diff 精读无生长期持有
- [ ] **证据三层（P0-2）**：185=注册完整性直呼（全量，脚本化自动生成断言）/ 关键域=行为契约抽样（20-30 个真实 MCP contract）/ 核心链路=真机冒烟（8-10 条）——185 直呼不得单独充当「零行为变化」证明
- [ ] **handler 形态前置盘点**落蓝图（纯 lambda/函数引用/带状态闭包——同构一次搬、异构单列风险）
- [ ] 零行为变化（185 计数+名单锚 + 全量 0 失败 + 真机冒烟三场景）
- [ ] 拆分蓝图落档 `设计师\方案设计\MainActivity拆分蓝图_v1.md`（全量盘点+分批计划：审批装配/市场/页面桥/chips 胶囊/Markwon 视图/启动序列）
- [ ] 三变异锚亲杀全红还原复绿
- [ ] 冷启动耗时锚（性能异常信号非行为证明）：拆前后各测 3 次取中位，Δ>10% 标红必解释、未解释不合 main
- [ ] Token/KV 两节申报（工具面不变 → 0/0）
- [ ] MainActivity 纯 CRLF 保持（新文件行尾约定入蓝图）

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-03 | 设计师B | v2 派生依据 | 大神终审 9.1/10「P0 补 3 条直接开工」：P0-1 防二次 God File/P0-2 证据三层/P0-3 Activity 持有边界+形态盘点前置+冷启动锚改性能信号——全部入销项/匹配档；军规已立 AGENTS.md（254d6ca） |
| 2026-09-03 | 设计师B | 冻结依据 | 架构图绘制发现（「图上分层、代码一锅」）：main@fea2fae 实测 7666 行/185 注册点；用户拍板「先解决这个」；拆分哲学=纯搬移零逻辑改动（不在本单顺手优化——优化另单） |

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-93-v1.md"
```
