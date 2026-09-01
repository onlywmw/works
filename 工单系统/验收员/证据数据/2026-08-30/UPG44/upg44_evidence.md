# UPG-44 验收证据（验收员 @2026-08-30 亲验）
## L1 全量: 55 套件 399 用例 / 0 失败 / 0 错误 / 1 跳过 (mov-upg44b 122945b)
## AcceptanceJudgeTest 14 + AgentLoopE2ETest 3 = 17 用例全绿 (extractCriteria 双正则/询问豁免/诚降级 + judge exact + E2E三点实证)
## 变异亲杀: 删 AcceptanceJudge QUESTION_INSIDE 询问豁免 -> 疑问尾豁免+询问豁免 两用例 FAILED (14用例2失败), 还原干净
## Surface 剔键(硬红): acceptance/criteria+verdict 不进 Surface -> expected 绝不发模型 (E2E @104/106/112/115 断言)
