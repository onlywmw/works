# 样本任务卡 S-WXPAY-01 · 开通商户号（真实链·第二样本）

> 用途：task-polish 打磨环真实链第二样本（候排·首样本 S-MERCHANT-01 通过后入排）；口径 **A（链路真·环境隔离）**。
> 版本：v1 @2026-10-07（设计师）｜蓝图版本＝`wxpay-v1`（7 步＋驳回/取消分叉）。

## 一、任务定义

- **任务**：商家（已入驻 APPROVED）**开通微信支付特约商户号**——填商户档案＋结算账户 → 提交进件 → 审核 → 签约 → 完成。
- **起点**：商家面 `/pay.html`（`assets/wxpay-onboard.js`·**入驻 APPROVED 后显形**）或 App 对话/任务卡入口。
- **终点判据**：wxpay 状态达 **`DONE`**（签约完成·可收款）。
- **状态机**：`NONE →（提交）→ 审核中 → TO_SIGN（待签约）→ DONE`；分叉：`REJECTED`（驳回改重提）/ `CANCELED`。
- **被测链路**：`POST/GET /merchant/wxpay/applyment`（提交/查询）·`POST /merchant/wxpay/applyment/sign`（签约）·`/merchant/status`（前提态）｜页面＝`pay.html`＋`wxpay-onboard.js`。
- **蓝图步**（`wxpay-v1`）：
  s1 进入（前提：入驻 APPROVED·非则引导）→ s2 填商户档案（USER）→ s3 填结算账户（USER）→ s4 提交进件（EXEC·confirm 闸）→ s5 等审核（EVENT）→ s6 结果处理（USER：TO_SIGN 去签约／REJECTED 改重提／CANCELED 收尾）→ s7 签约（EXEC）→ DONE。

## 二、执行方式（口径 A）

| 项 | 取值 |
|---|---|
| 环境 | 沙盒实例（POL-4）；**审核/签约＝partner 服务面**：沙盒内＝**partner 桩**（POL-7 官方化"通过"注入口／可注入 TO_SIGN/DONE/REJECTED）；真机真服务＝候真实资质 |
| 设备 | 专用模拟器＋关键节点真机取证（D8） |
| 注入 | `TO_SIGN → DONE` 通过腿；`REJECTED →（改）→ 重提` 驳回腿；`CANCELED` 分叉 |
| **真伪映射** | 真：状态机/契约/寻址/签约动作路径；伪（显式标注）：**微信支付真实进件与签约**（需真实主体资质——**条件缺候选**）；真机取证点：s4 提交、s6 结果、s7 签约、终态 DONE 帧 |
| 数据 | 沙盒账号＋沙盒店铺；结算账户用测试值 |

## 三、重复方式

- **协议三元**：同上（SHA／同号续跑／次数组内一致；驳回腿 ≥2 次确定性）。
- **注入序列**（每轮固定）：`TO_SIGN` →（s7 后）→ `DONE`；驳回腿：`REJECTED` →（s6 改）→ 重提 → `TO_SIGN` → `DONE`。
- **读数**：四读数＋触点蓝图（s1..s7 预期触点·首轮定基线）。

## 四、准入三问

1. 谁用＝已入驻商家；2. 什么算完成＝wxpay status=`DONE`；3. 能不能重跑＝能（注入序列可重复）。

## 五、现状盘点（通/断·首批跑批核实）

- **已在**：页面与状态机全链（NONE/审核中/TO_SIGN/DONE/REJECTED/CANCELED）｜端点与签约动作｜前提门（入驻 APPROVED 后显形）｜POL-6 已修「陈旧 shop_id 403」（提交类对齐）。
- **待核实（条件缺候选）**：① 真实微信支付进件/签约资质是否存在（真机真服务腿）② partner 桩在沙盒实例的接线（POL-7 通过口已官方化）③ 结算账户校验规则（真值约束）。
