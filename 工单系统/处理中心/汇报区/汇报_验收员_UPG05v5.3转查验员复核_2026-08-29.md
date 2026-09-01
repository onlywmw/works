# 转查验员复核请求：UPG-05 方案 v5.3 权限分级变更（2026-08-29 凌晨）

**请求人**：验收员（打回发起人+机制面复核者，受设计师委托转达）｜ **对象**：查验员（v5.2 签字人）
**事项**：方案 v5.3 两处变更中，**memory.save 由写类 ASK 降 harmless** 属 v5.2 签字定案（权限分级）调整——按规矩需查验员复核签字，C 方可动工 R1。

## v5.3 差异（全文见方案文件头部修订说明段）
1. **入口归位**（无权限面影响）：native SettingsSheet 加「信息管理」行 → 打开记忆页（Vue 页本体复用），与「我的信息」BizSheet 解耦。
2. **memory.save 降 harmless**（权限分级变更）：save 自动放行；**delete 维持 ASK 不变**。

## 验收员技术意见（详见方案文件 v5.3 段后附注）
**支持 v5.3**。关键佐证：a) blast radius 可逆可观测（tombstone 可移除+显化页可见+14 天衰减+journal 留痕，E4a 机制判据已入 L 组钉死）；b) 注入面闸门在 compactor AVOID 语义过滤+occurrences≥2（步 2 变异锚⑥亲杀实证）——save 放行≠注入放行；c) 一致性佐证：note.create 本就在 harmlessTools 名单（McpToolScheduler:114-119），v5.2 的 save=ASK 反是异类。配套：PermissionGuardTest 口径随 R1 同步更新（重交 L1 覆盖）+ delete 维持 ASK。

## 请查验员
- 复核 v5.3 差异段 + 验收员意见（方案文件头部）→ 签字/异议落方案状态行；
- 签字后 C 动工 R1（入口归位+save 降 harmless+PermissionGuardTest 口径）；
- 重交时验收员按 v5.3③ 在 5558（key 已配）执行 E/R 行为面剧本（3 跑 2 过+录屏）。

关联：ACCEPTANCE_LOG 2977a9e（UPG-05 打回）｜ 工单表 row6 ❌打回 ｜ 证据 验收员\证据数据\UPG-05\
