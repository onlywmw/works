# UPG-06 确定性防编造三件套回补（FabricateGuard / GoalGate / AcceptanceJudge）· 方案设计

> 设计人：设计师 ｜ 日期：2026-08-26 ｜ 优先级：P0 ｜ 状态：✅ 方案完成，**待专家审**
> 依据：老版 `agent/FabricateGuard.java:199-216`、`agent/capable/GoalGate.java:24-46`、`AgentLoop.java:1107-1119`、`AcceptanceJudge.java:54-68` 逐行核实

---

## 一、问题（实测证据）

新版 `dsh/guard/Guard.kt` **只有 RepeatDetector**（重复提示阈值 3/5/8）+ 工具超时；审批审计在 UI 层（`MainActivity.kt:2678`）。老版的**确定性防编造**三类机制全部缺失：

| 机制 | 老版行为 | 新版现状 |
|---|---|---|
| **FabricateGuard** `:199-216` | 任务指定工具 + 零 tool_call + 结果类内容/执行声称 → **确定性拦截**；中/英/JSON 协议 4 种提取模式；询问形态豁免；诚实降级 | 无（只有"声称检测"在 F1 线，形态不同） |
| **GoalGate** `capable/GoalGate.java:24-46` | 掌握度曲线：单证据 0.5 封顶、≥3 证据才过 0.9；防 AI「自我宣告已掌握」 | 无 |
| **AcceptanceJudge** `:54-68` | expected 服务端持（不发给模型）+ 模型投影剔除答案键 + 回合结束 `equals` 对拍 | 无 |
| 三件套挂载点 | `AgentLoop.java:1107-1119`（执行循环内确定性触发） | 无对应挂载 |

**影响**：AI 说"我完成/我掌握了/答案对吗"——**没有任何机制在确定性层面拦它**（新版只能靠模型自觉 + 审批弹窗）。

## 二、迁移方案

1. **FabricateGuard 移植**：4 种提取模式（任务指定工具集 + tool_call 存在性 + 结果声明）→ 拦截/反馈落 journal note；豁免形态（询问/建议）与诚实降级语义照搬
2. **GoalGate 移植**：纯函数掌握度（证据计数 + 权重曲线）；接入任务类交互（学习/实践类 agent 回合）
3. **AcceptanceJudge 移植**：expected 由服务端/脚本持有（checker 工具返回）、投影给模型的 payload 剔除答案键、回合结束对拍；失败 → 重试/诚实报告
4. **挂载**：三件套接进 AgentLoop 执行循环（成功/失败路径各一处，防漏）

## 三、风险与红线

- **误拦风险**：FabricateGuard 对"建议性语句"不能拦（旧版有明确豁免语义，必须保留）；GoalGate 阈值不可过严（0.5 封顶不能挡住真实单一强证据的可用流程——需评审确认场景）
- 不改变工具注册/调用签名；只加**观察+反馈**层（execute 面不动）
- 对拍机制（AcceptanceJudge）**不得把 expected 发给模型**（红线：服务端持）

## 四、验收标准

- L1：三件套纯函数单测（每类 ≥8 用例，含边界/豁免/降级）+ **变异亲杀**（删拦截分支必红）
- L2：真机构造「AI 声称完成但零 tool_call」场景 → FabricateGuard 拦截反馈可见（journal + UI）
- L3：AI 对话「这道题答案对不对」→ AcceptanceJudge 对拍结果入 journal

## 五、专家评审点

1. FabricateGuard 与现有 F1 声称检测（tool-tell/chatreply 线）**边界**：合并还是并行？（建议：统一挂载点，不同触发条件）
2. GoalGate 应用场景：哪些交互算"掌握"？阈值 0.5/0.9 是否照搬？
3. AcceptanceJudge 的 expected 来源：现有市场/任务体系如何提供（计划型任务 vs 问答型）
4. 误拦后的**用户体验**（反馈语 + 用户可见性）
