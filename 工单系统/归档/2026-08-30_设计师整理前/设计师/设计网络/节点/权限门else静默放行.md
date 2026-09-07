---
type: component
domain: 工具运行时
status: "⚠️"
repo: 主仓
evidence: "McpToolScheduler.kt:208-214"
bp:
  - "[[设计师/设计网络/BP/BP-03|BP-03]]"
tickets:
  - "[[设计师/设计网络/工单/UPG-02|UPG-02]]"
  - "[[设计师/设计网络/工单/UPG-03|UPG-03]]"
  - "[[设计师/设计网络/工单/UPG-04|UPG-04]]"
---

# 权限门else静默放行

- **状态**：⚠️ ｜ **域**：工具运行时 ｜ **仓**：主仓
- **证据**：`McpToolScheduler.kt:208-214`（索引审计 @2026-08-29：原 :187-188 因 UPG-23 permissionTier 访问器插入顺移，已修正 @8af7da9）
- **备注**：新工具不在任何名单→else→ALLOW 不弹窗直放。处置：新写类工具必登记 writeTools+验收变异钉死。
- **关联新证 @2026-08-29（验收员 M3 真机抽验发现，设计师复核属实）**：`approval.setMode` 漏收编 `uiOnlyMcpTools`（MainActivity.kt:56-59 名单缺、:2188 handler 在）→ MCP :8389 公开面可自助切 never 绕过全部写类 ASK（P1）——与 :54 铁律注释自相矛盾；处置：M3-R2 收编名单+契约断言（feat/upg02，销项后本注记随 BP-03 复核）。
- **闭环 @2026-08-29**：上条已随 M3-R2 合 main（f1fba06）——tools/list 无口+强呼 TOOL_NOT_FOUND 真机实证+契约活行锚落码（挂账表划销）
- 关联断点：[[设计师/设计网络/BP/BP-03|BP-03]]
- 波及工单：[[设计师/设计网络/工单/UPG-02|UPG-02]]
- 波及工单：[[设计师/设计网络/工单/UPG-03|UPG-03]]
- 波及工单：[[设计师/设计网络/工单/UPG-04|UPG-04]]
