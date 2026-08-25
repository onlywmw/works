# UPG-07 计划授权 + 预算口径 + 设备能力裁剪 · 方案设计

> 设计人：设计师 ｜ 日期：2026-08-26 ｜ 优先级：P0 ｜ 状态：✅ 方案完成，**待专家审**
> 依据：老版 `agent/AgentLoop.java:250-313`（9 态 + PLAN_GATE + 转移表）、`agent/ContextBudget.java:37-52`、`agent/TokenMeter.java:34-58`、`bridge/ExecuteToolGate.java:23-116`、`agent/ToolRegistry.java:309-377`（DevicePolicy）逐行核实

---

## 一、问题（实测证据）

| 缺口 | 老版实现 | 新版现状 | 影响 |
|---|---|---|---|
| **计划级授权** | `AgentLoop.java` PLAN_GATE（用户批复整个计划）+ approval=plan（一次授权覆盖计划内所有工具） | 逐工具弹窗（ApprovalService ALLOW_TURN/ONCE + 5min TTL） | **审批风暴**：多步任务每步弹窗，体验差 + 用户麻了乱点 |
| **预算估算口径** | `ContextBudget.java:37-52` Unicode 块加权（ASCII×0.3 / CJK×1~1.5，实测中英误差<30%） | `dsh/budget/ContextBudget.kt:75` 用 `char/4` | **中文字数严重低估**（1 字≈0.67 token，char/4 记 0.25，低估 63%）→ 85% 场景预算触发失真 |
| **用量计量** | `TokenMeter.java:34-58`（日/月/模型 × prompt/completion/reasoning 本地计量 + 月配额） | 全库 grep 无 | 无用量可看/可配，费用失控无感 |
| **设备能力裁剪** | `ToolRegistry.java:309-377` DevicePolicy.probe 设备探测 → unavailable 集合 → 工具三分类 → promptText 注入"本机不可用" | 无（工具照常暴露，调用时才失败） | AI 看到不可用工具 → 反复尝试/幻觉 |
| **执行验证通道** | `ExecuteToolGate.java:23-116`（debug 包 + 只读白名单 + access=readonly 三要件 + FORBIDDEN_PREFIXES 双保险） | 无验证通道（AI 全链路验证） | 验证绕不开模型 |

## 二、迁移方案（3 块，可独立交付）

### A. 计划授权（体验优先）
1. 新增审批级 `APPROVE_PLAN`：plan 生成后一次弹窗展示计划摘要（步骤/工具/风险）→ 用户批准 → 计划内工具**放行**（超出计划的新工具仍需单独询问）
2. 现有逐工具审批保留为**兜底**（计划外工具）

### B. 预算口径 + 用量计量
3. `ContextBudget.kt` 估算函数替换为 Unicode 加权（ASCII/JIS/CJK/emoji 分档），单测锁定权重（中英样本断言误差 <30%）
4. `TokenMeter` 移植：本地计量（日/月/模型 × prompt/completion/reasoning），设置页可看、可配月配额（超配额提示降级——**不硬拦**）

### C. 设备能力裁剪（可选批）
5. `DevicePolicy.probe` 移植：启动时探测设备能力（相机/传感器/蓝牙/存储等）→ 构造 unavailable 集合 → 裁剪工具面 + promptText 注入提示（不暴露=不会唤起）
6. ExecuteToolGate 模式：新增一条**只读白名单验证通道**（后续工具开发验证用，不绕开正常执行链）

## 三、风险与红线

- 计划授权：**批准不是永久**——超计划工具必须弹（防"计划内偷加动作"）
- 预算口径替换会影响**上下文压缩行为**——先单测断言旧行为对比，再切换（防压缩意外失控）
- TokenMeter 只计量不硬拦（配额提示降级，不断服务）
- 设备裁剪：探测失败时**不裁剪**（fail-open，防误裁剪核心工具）

## 四、验收标准

- L1：预算估算单测（中英样本误差 <30%）；TokenMeter 单测（累计/月重置）；计划授权状态机单测（批准后计划内放行/计划外仍拦）；变异亲杀
- L2：真机（emulator-5556）多步任务 → 一次计划批准 → 不再逐工具弹窗（截图 + journal）；设置页用量可见
- L3：AI 对话触发 5+ 步任务，审批弹窗总数 = 1（计划级），journal 可查批准上下文

## 五、专家评审点

1. 计划授权的适用场景（哪些任务走计划级？闲聊/单步不走）
2. 预算加权系数的精度目标（30% 够不够；中文是否按 1.0 还是 0.75 调）
3. 月配额默认值（TokenMeter 500 万照搬还是重新定）
4. 设备裁剪是否本期做（依赖探测清单完整性，建议 A+B 先交付）
