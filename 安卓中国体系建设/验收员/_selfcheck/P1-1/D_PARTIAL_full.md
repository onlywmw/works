## 能力护栏（P1-1）
共享面影响清单:
  - 共享面: 全局数据结构
  - 影响下游: 协议序列化层
  - 回归说明: 字段只增不改，历史回归覆盖
coverage_status: PARTIAL
coverage_decision:
  uncovered: 协议异常重连路径
  risk: medium
  merge_decision: approved
  reason: 当前变更仅影响 UI 注册层，协议路径未改动；已有历史回归覆盖
  decided_by: 设计师
  decided_at: 2026-09-01T10:00:00
