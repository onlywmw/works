# UPG-07 批2 验收证据（验收员 @2026-08-30 亲验 L1）
## L1 全量: 54 套件 391 用例 / 0 失败 / 0 错误 / 1 跳过 (mov-upg07-b2 431b3cb)
## 前置① Goal.restoreFrom: Goal.kt:59 + MainActivity:1808 接线 (挂账GoalDomain无日志恢复修复)
## 主体 goal 豁免: ApprovalService ALLOW_GOAL/goalAllowSet(上限100)/goalIdProvider(仅ACTIVE)/注入顺序turn→goal→弹窗 + MainActivity:3589 四键
## 变异M1亲杀: 删 ApprovalService:164-171 goal豁免注入块 -> goal内放行用例 FAILED (5用例1失败), 还原干净
## 新增测试: GoalChangeEventTest 7 + ApprovalServiceGoalTest 5 全绿
## 挂账: 前置②弹窗基线数值待补 (adb基础设施异常, 脚本approval-baseline-collect.sh+任务定义已交付)
