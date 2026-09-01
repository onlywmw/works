---
type: component
domain: 工具运行时
status: "✅"
repo: 主仓
evidence: "SceneTools.kt:26 在库（bce578d）+ MainActivity.kt:3121 不迭代"
bp:
  - "[[设计师/设计网络/BP/BP-01|BP-01]]"
tickets:
  - "[[设计师/设计网络/工单/UPG-03|UPG-03]]"
---

# SceneTools

- **状态**：⚠️ ｜ **域**：工具运行时 ｜ **仓**：主仓
- **证据**：`SceneTools.kt:26 在库（bce578d）+ MainActivity.kt:3121 不迭代`
- **备注**：曾长期在库孤岛（规则 20 反例锚 1）。2026-08-29 UPG-03 接线合 main（198e26f）：3121 迭代+schema 随 Provider+else ALLOW 归因正确，L2 真实查票 55 趟实证 → 转 ✅（设计师 @198e26f）。
- 关联断点：[[设计师/设计网络/BP/BP-01|BP-01]]
- 波及工单：[[设计师/设计网络/工单/UPG-03|UPG-03]]
