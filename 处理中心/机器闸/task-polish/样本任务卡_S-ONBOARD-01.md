# 样本任务卡 S-ONBOARD-01 · 对话式开店全链（UPG-551 定稿）

> 用途：task-polish 打磨环的第一条样本（尺）。第二样本候选＝上架链（S-LISTING-01·候排，登记见文末）。
> 状态：定稿 @2026-10-06（UPG-551 首轮）；蓝图版本＝`onboard-v1`（8 步＋驳回回流 ≤1 次确认）。

## 一、任务定义

- **任务**：用户以对话发起商家入驻（微信支付特约商户进件），从材料上传到审核结果处理，全程由 MOV 任务引擎推进。
- **起点**：用户在会话中表达开店意图（点火语「帮我开个店」）→ 引擎建任务（`plan=onboard`）→ s1 起。
- **终点判据**：任务 `state=DONE` 且 s1–s8 全 done（事件史末条相位入 DONE）。中止判据：用户取消（`CANCELLED`）或引擎失败未恢复（`FAILED` 超时）＝不达标跑，按中止归档。
- **被测链路**：dsh 对话（点火/确认/重提）→ `task.create`/`task.answer` → `TaskEngine.advance`（唯一入口）→ 步执行（`biz.onboardStart/Scan/Photo/Submit/Status` 工具面）→ 服务端行（a2a 测试账号）。
- **蓝图步**：s1 上传材料(USER)→s2 核对资料(USER)→s3 把关确认(USER)→s4 提交进件(EXEC·confirm 闸)→s5 等审核(EVENT)→s6 审核结果处理(USER·驳回自修)→s7 重新提交(EXEC·confirm 闸)→s8 等重提后审核(EVENT)→DONE。

## 二、执行方式（沙盒）

| 项 | 取值 |
|---|---|
| 环境 | **沙盒**：测试账号（acc6c50…）＋**审核结果注入夹具**（`partner-stub.mjs` 探针桩：`GET /partner/applyment/*` 返回注入态；其余 partner 请求代理真服务） |
| 设备 | CP28A2234900560（真机占用闸·串行）；App debug 变体（`partner_base_url` 指针 → `adb reverse` → 本桩） |
| 材料 | 本机账号既有草稿材料（5 张：license/id_front/id_back/shop_front/shop_inner）＝**同号续跑**（状态口径见下） |
| 注入 | `audit-state.json`：`REJECTED`（s5 读驳回）→ 修完重提前置 `FINISH`（s8 读通过）；还原＝删设备 `mov-debug-config.json` 的 `partner_base_url` ＋停桩 |
| 驱动 | 点火＝会话发「帮我开个店」；确认/重提＝会话发确认词（AI 经 `task.answer` 推进；LLM 限流时降级为直接 `task.answer`，交付报告注明） |

## 三、重复方式（重跑协议卡·D7）

- **协议三元**：① App SHA＝交付报告「重跑协议卡」所记（versionName 内嵌短 SHA）；② 状态口径＝**同号续跑**（账号/草稿不变；材料齐⇒s1/s2 探针即解）；③ 次数＝同协议组内一致（首轮基线 1 次；驳回腿确定性重跑 ≥2 次）。
- **注入序列**（每轮固定）：`REJECTED` →（s5/s6 后）→ `FINISH`。注入与还原步骤见夹具说明（`夹具_审核注入.md`）。
- **读数**：四读数（`task-telemetry.mjs`）——完成时分段／总触点数＋计划外／澄清轮数／失败接管数。
- 跨组差异（如改冷启新号、换 SHA）必须显式标注，禁混比。

## 四、准入三问（增补样本用）

1. 谁用＝商家（小微/个体户）；2. 什么算完成＝任务 DONE（上述终点判据）；3. 能不能重跑＝能（本卡执行/重复方式）。

## 五、第二样本候选（登记·候排）

- **S-LISTING-01 上架链**：拍一张商品图→拟稿→一次确认发布（终点＝商品上架成功可查）；候选期＝首轮闭环后（按 task-polish 4.1 回评纪律入排）。
