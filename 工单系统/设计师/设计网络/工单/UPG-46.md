---
type: ticket
status: "📌 已派 v2·待认领"
weakest: "❌"
blocker_resolved: true
depends_on:
  - "[[设计师/设计网络/节点/运行时接线四点|运行时接线四点]]"
  - "[[设计师/设计网络/节点/tool-orch雏形|tool-orch雏形]]"
---

# UPG-46 工具联动 Runtime 契约（段①）

- **状态**：📌 已派 v2 @2026-09-05（`设计师/派单/UPG-46_工具联动Runtime契约_派单_v2_2026-09-05.md`；分支 feat/upg46 / worktree mov-upg46，基 origin/main）｜ **当前最弱节点**：❌（tool-orch 雏形孤岛=本单接线对象）｜ **阻塞已解除**：是（断点处置=本单修，设计 v3.2 §二）
- **段①范围**：Plan 协议层（新开）+ 两段式接线 + 四类阻断接线 + Trace 落 journal（14 字段，禁第二写点）+ 编排规则语义层 + 消灭 MainActivity:349 死引用；段② → UPG-104（P2 挂单）
- **验收**：STD-UPG-46-v1（content_sha256=5038b6398e39cabf4b5edba40c4d1ec096d4ee8876dee185d8e2679c7392f4f4，待审验员会签）
- **派单前治理修复 @2026-09-05**：v3 设计文本体断链 → 口径重建 v3.2；溯源复核 main@841f591d（旧锚 writeTools/toolParamSchemas sunset 已通报）；STD 冻结；基线刷新 814/0/1
- 依赖节点：[[设计师/设计网络/节点/运行时接线四点|运行时接线四点]]
- 依赖节点：[[设计师/设计网络/节点/tool-orch雏形|tool-orch雏形]]
