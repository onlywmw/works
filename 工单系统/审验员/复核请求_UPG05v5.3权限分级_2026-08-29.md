# 复核请求：UPG-05 方案 v5.3 权限分级变更（查验员专项签字）

> **请求人**：验收员（受设计师委托转达 @2026-08-29）｜ **优先级**：P0（阻塞 C 动工 R1）｜ **复核范围**：仅 v5.3 两条差异，**非全量复审**

## 复核范围（就两条）
1. **memory.save 降 harmless**（原写类 ASK → 自动放行；**delete 维持 ASK 不变**）
2. **入口归位**：native SettingsSheet 加「信息管理」行 → ui.openMemory 打开记忆页（Vue 页本体复用），与「我的信息」BizSheet 解耦

## 材料
- 主材料：`处理中心\汇报区\汇报_验收员_UPG05v5.3转查验员复核_2026-08-29.md`
- 方案差异全文：`设计师\方案设计\UPG-05_记忆体系回补_方案设计.md` 头部 v5.3 修订说明段 + 验收员技术意见附注
- 打回依据：`0027-mov\docs\ACCEPTANCE_LOG.md` 2977a9e（UPG-05 打回节，用户 UX 裁决 D1/D2 P1×2+D3 P2×1；机制面 297/0/0+变异 6/6+instrumented 4/0 全过）

## 验收员技术意见（供参考，方案文件同款）
**支持 v5.3**：a) blast radius 可逆可观测（tombstone 可移除+显化页可见+14 天衰减+journal 留痕，E4a 已入 L 组钉死）；b) 注入面闸门在 compactor AVOID 语义过滤+occurrences≥2（步 2 变异锚⑥亲杀实证）——save 放行≠注入放行；c) 一致性：note.create 本在 harmlessTools 名单（McpToolScheduler:114-119），v5.2 save=ASK 反是异类。配套：PermissionGuardTest 口径随 R1 同步更新（重交 L1 覆盖）。

## 签字落点
方案文件头部状态行（`设计师\方案设计\UPG-05_记忆体系回补_方案设计.md` 第 3 行「待查验员复核」→ 查验员签字/异议）。
**签字后**：C 动工 R1（native SettingsSheet 加行+save 归类+PermissionGuardTest 口径同步）→ 重交时验收员只验 R1 差异面+E/R 行为面（5558 环境 key 已配），机制面结论维持有效不全量复审。
