---
type: component
domain: 数据/存储
status: "✅"
repo: 主仓
evidence: "MemoryAggregator.kt（USER_GLOBAL 全局聚合）；E2 跨房间行为面实证"
tickets:
  - "[[设计师/设计网络/工单/UPG-05|UPG-05]]"
---

# 记忆Scope

- **状态**：✅ ｜ **域**：数据/存储 ｜ **仓**：主仓
- **证据**：`MemoryAggregator.kt`（UPG-05 引入，USER_GLOBAL 全局聚合）；E2 跨房间记得行为面 3 跑实证（房间 A 记「猫叫元帅」→ 房间 B 用上）
- **备注**：memory.* 房间级 → UPG-05 步 2 全局化（Scope Contract=USER_GLOBAL 定案），2026-08-29 随 R1 合 main（merge 66244f4）。
- 波及工单：[[设计师/设计网络/工单/UPG-05|UPG-05]]
