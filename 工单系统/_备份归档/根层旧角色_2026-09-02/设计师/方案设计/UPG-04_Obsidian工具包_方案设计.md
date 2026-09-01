# UPG-04 Obsidian 工具包（AVD 内置）· 方案设计

> 设计人：设计师 ｜ 日期：2026-08-26 ｜ 状态：✅ 方案完成，待派单 ｜ 优先级：P0
> 依据：老版 `obsidian/ObsidianToolProvider.java` 实测 11 工具 + dev-docs.html 契约

---

## 一、背景

老版 Obsidian 线 = **11 工具**（vault 管理 ×4 + 文件 ×3 + 技能 ×4），存在于 `com.hermes.android.obsidian`（ObsidianVault / ObsidianVaultStore）。新版无任何 obsidian.* 工具，且 `memory.*` 不能替代**本地 vault 文件联动**（用户笔记互链/技能沉淀）。Obsidian vault 在**设备本地** → 必须 App 内置（外部 server 无法访问设备文件系统）。

## 二、工具清单（完全移植，命名规范化为域.动作）

| 工具 | 功能 | 权限级 |
|---|---|---|
| `obsidian.vault.detect` | 探测设备上的 Obsidian vault | harmless |
| `obsidian.vault.register` | 登记 vault 路径 | ASK（写配置） |
| `obsidian.vault.check` | 检查 vault 状态/可用性 | harmless |
| `obsidian.vault.rescan` | 重建索引 | harmless |
| `obsidian.file.read` | 读笔记文件 | harmless |
| `obsidian.file.write` | 写/更新笔记 | ASK |
| `obsidian.file.search` | 按内容/标签搜索笔记 | harmless |
| `obsidian.skill.list` | 技能清单 | harmless |
| `obsidian.skill.read` | 读技能 | harmless |
| `obsidian.skill.write` | 写技能 | ASK |
| `obsidian.skill.remove` | 删技能 | ASK |

## 三、契约设计

- 命名：`obsidian.域.动作`；description 中文真描述（含限制：只能访问已登记 vault 根内，禁止路径穿越——照 file.* 沙盒规则）
- parameters JSON Schema 每字段中文说明；错误走统一 16 类（vault 未登记 → `MISSING_CREDENTIAL` 语义 -> `SERVER/CONFIG` 类；路径越界 → `INVALID_ARGS`）
- 并行：查询类 true；写类 false（排他）
- scope：default main
- 权限：vault.register/file.write/skill.* 写类进 PermissionGuard ASK 名单
- **兼容老版**：老版技能目录结构/文件名约定（`assets/skills/*.md` 类）要核对今版 assets 布局，避免索引漂移（施工前先读 ObsidianVaultStore 的路径约定）

## 四、实现路径（示意）

1. 新文件 `app/src/main/kotlin/com/hermes/mov/tools/ObsidianTools.kt`（照 SceneTools 骨架 + 沙盒防御）
2. vault 根解析：优先 MOV 接管的 vault（老版 `ObsidianVaultStore` 持久化路径约定），未登记时给引导性错误
3. 注册 + 权限名单追加
4. 单测：契约断言 + vault 沙盒穿越测试（读 ../ 必须拒）+ 变异亲杀
5. 真机：模拟器放一个测试 vault（assets 或 filesDir），逐工具激活验证 + journal 证据

## 五、验收标准

- L1：契约单测全绿（含路径穿越拒绝测试）+ 变异亲杀
- L2：真机 vault 探测/建索引/读写 md 文件全链（截图 + 文件落纸证据）
- L3：AI 对话「把这条建议记到笔记」→ journal 真实 obsidian.file.write tool_call

## 六、待用户拍板

- [ ] 用户设备上真正的 Obsidian vault 路径（真机验收时用；模拟器先放测试 vault）
- [ ] 技能线（skill.* ×4）是否本期一并迁（涉及 assets/skills 布局核对 + 老版注记语义）
