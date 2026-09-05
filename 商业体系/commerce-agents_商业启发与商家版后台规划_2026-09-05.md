# Anthropic commerce-agents · 商业启发与商家版后台规划
**归档**：2026-09-05 ｜ **来源**：https://github.com/anthropics/commerce-agents ｜ **状态**：📌 记录/后续要实现（用户拍板 2026-09-05）

---

## 一、项目是什么

Anthropic 官方「商务双 Agent」参考蓝图（教育性质，角色/公司全虚构，写操作全部 staged）：

| Agent | 给谁 | 能力（5 流） |
|---|---|---|
| **Shopping Agent** | 顾客（嵌入商家 App） | 搜索/比价/加购/订单与政策问答/记忆 |
| **Merchant Agent** | 商家员工 | 业绩分析/改列表/库存与订单告警/定价与促销/活动草稿 |

- 一份定义（prompt+skills+tool contracts+gates）→ 三运行时：Messages API / Agent SDK / Managed Agents
- 4 个行业 demo：retail / travel / telecom / entertainment
- 关键安全设计：**checkout 只渲染购物车（宿主完成支付，绝不代下单/刷卡）；商家所有写=staged，等人工批准才生效**；gates+fencing+approval surface
- 配套：Claude Code 插件（一句话建构商务 agent）/ docs（safety, backends, deployment）

## 二、与 MOV 的同构验证（方向没走偏）

| commerce-agents 设计 | MOV 已有/已拍板 | 结论 |
|---|---|---|
| staged 写入+审批 surface | 审批体系（扫描→一张审批单→同意才做；**支付永不预批**） | ✅ 完全同构（官方蓝图二次验证） |
| 一份定义多运行时 | A+B 双通道（对外 Streamable HTTP + App 内 Hub） | ✅ 同构 |
| gates+fencing | 门 3 灰度/熔断 + 域隔离 | ✅ 同构 |
| 模型商品化 demo | 能力市场（丰富中） | 📥 可借鉴 |

## 三、对我们的启发（借鉴点）

1. **商家版后台（Merchant Agent）= MOV 商业化 B 端增值点**：
   - 形态：自然语言对话（「昨天卖了 12 单」「把 X 上架」「周末搞满减」）
   - 能力：业绩分析/改列表/库存与订单告警/定价促销/活动草稿
   - **红线保持**：每笔写 staged + 商家批准才生效（复用 MOV 审批面）；支付永不预批
   - 拼接条件：商户入驻(S1-S3)+市场+订单+审批体系+AI 工具链——**原料已备**
2. **市场包分类观察项**：能力按「**顾客流 / 商家流**」组织（现在可定，影响市场架构）——登记挂账
3. **checkout 卡片式支付确认**：未来支付卡=「渲染+人确认」形态参考
4. **四行业 demo 样板**：零售/旅游/电信/娱乐——未来商业化样板包参考

## 四、落地路径（后续要实现）

- **前置**：商业化主线先通（App 备案✅提交 → 应用商店 → 微信支付 → 市场闭环）
- **时序**：商业化闭环后 → 拆「商家版后台（Merchant Agent）」工单（P1-2，按商业化节奏）
- **不阻塞**：市场「顾客流/商家流」分类观察项现在挂账（不阻塞现有）

## 五、参考

- 仓库：github.com/anthropics/commerce-agents（MIT? 核查 license；education 声明：所有写操作 staged/人类批准）
