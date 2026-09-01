# UPG-04 Obsidian 工具包（AVD 内置）· 方案设计 v2

> **合并注记（用户拍板 @2026-08-29）：本单并入 UPG-02 合并施工**（共享 MainActivity 装配区），卡面已销（工单库 UPG-04 节标并入）；本文档保留为合并单的子方案，施工内容不变。

> 设计人：设计师 ｜ 日期：2026-08-26（v1）/ 2026-08-28（v2）｜ 状态：✅ 方案 v2（溯源修正+用户拍板收口），待派单 ｜ 优先级：P0
> v2.1（2026-08-28 大神速览收口）：SAF 权限失效兜底（读写前校验 persisted URI 权限，失效引导重授权，§四.2）；rescan ASK 配 UI 文案「正在更新笔记索引，不影响笔记内容」（§三）；schema 随 Provider 走（§四.3）。
> v2 说明：**规则 20 设计前溯源首跑**——v1 最大断点在 L3：**新版 manifest 无任何存储权限**（AndroidManifest.xml:4-18 vs 老版 MANAGE_EXTERNAL_STORAGE），File API 够不到真实 vault，v1 的「探测/登记任意 vault 路径」前提不成立。用户拍板 @2026-08-28：**存储通路走 SAF 授权目录**（UPG-11 正在走应用宝整改，MANAGE_EXTERNAL_STORAGE 是红线，不碰）。skill×4 不迁（理由见 §三）。
> 依据：老版 `ObsidianToolProvider.java` 实测 11 工具全实物（:128-465）+ 新版权限模型/装配链逐行核实

---

## 一、背景

老版 Obsidian 线 = **11 工具**（vault 管理 ×4 + 文件 ×3 + 技能 ×4），纯逻辑内核 ObsidianVault.java（resolve 防越界 :135-164 逐段 canonical+symlink 检测是老版精华，整体搬）。新版无任何 obsidian.*。Obsidian vault 在设备本地 → 必须 App 内置。`memory.*`（session 事件）与 `note.create`（写公共目录 notes/*.md，MainActivity.kt:1529-1540）都不能替代本地 vault 文件联动。

## 二、分层溯源图（规则 20 必附，证据 @main 36d7f6e / 老版 ff8d67e）

| 层 | 判定 | 证据 | 断点处置 |
|---|---|---|---|
| L1 用户可感知 | ⚠️ | 市场内置包机制实物（McpMarket.kt:100 kind=builtin）；对话内 tool_call 卡+审批弹窗通用（McpToolScheduler.kt:277-305）；obsidian 无表示入口 | 本单修：v2 定「仅对话内可见」，不上市场卡（见 §三决策） |
| L2 入口/桥接 | ✅ | agent 调用链实物（McpToolScheduler.kt:226-333 权限门+ASK）；PagesBridge 白名单无需经过（市场页只放行 market.，PagesBridge.kt:30）——声明不依赖。审批映射：老版 plan（ObsidianToolProvider.java:180/254/313/426/456）→ 新版工具名进 writeTools 即 ASK | 本单修（名单追加是施工动作） |
| L3 服务/数据 | ❌→✅（拍板后） | **v1 致命断点：新版无存储权限**；v2 拍板 SAF：ACTION_OPEN_DOCUMENT_TREE 授权 + takePersistableUriPermission 持久化 + DocumentFile 读写——通路成立。detect 语义退化：SAF 下不能全盘扫，改为「引导用户选目录」 | **用户已拍板 SAF**（v2）；MANAGE_EXTERNAL_STORAGE 永久排除（合规红线） |
| L4 运行时装配 | ✅带陷阱 | 真链路：mcpHandlers 注册段（MainActivity.kt:1459-3050）→ BuiltinMcpTools 迭代点 :3121 → :8389 暴露循环（:3192-3201，扣 uiOnlyMcpTools :54-57）→ rebuildAgentTools（:5645-5667 读 toolParamSchemas :177）；**陷阱：v1「照 SceneTools 骨架」指向孤岛**（McpToolProvider 零调用方） | 本单修：§四已改写四个真实接线点 |
| L5 能力实物 | 老版 ✅ / 新版 ❌ | 老版 11 工具全实物+测试 3 文件；新版 obsidian.* 零存在；**重叠实物：note.create（:1529）与 obsidian.file.write 意图重叠**（边界论证见 §三）；file.* 沙盒根写死 Download/MOV（BuiltinMcpTools.kt:24/36-44）不可照抄 | 本单修（新建） |
| L6 持久化/事实源 | ⚠️ | 老版登记态单写点 SharedPreferences obsidian_vault_store（ObsidianVaultStore.java:19-23）无平行源 ✅，可移植；SAF 持久化 URI 权限本身也是状态（ContentResolver 持久化授权），二合一存 prefs。老版 `_obsidian_vault` journal 记账新版无等价物（sealed SessionEvent 扩展成本高） | 本单修：**声明放弃登记/迁移 journal 记账**（本期），prefs 单写点 |

## 三、工具清单（v2 缩圈：vault×4 + file×3 = 7 个）与决策

| 工具 | 功能 | 权限级 |
|---|---|---|
| `obsidian.vault.detect` | 引导用户 SAF 授权选择 vault 目录（非全盘扫描） | harmless |
| `obsidian.vault.register` | 登记已授权 vault（持久化 URI 权限+prefs 落盘） | ASK |
| `obsidian.vault.check` | 检查 vault 状态/可用性 | harmless |
| `obsidian.vault.rescan` | 重建索引 | **ASK**（v2 修正：老版实为写类 plan——rescan 改写登记，ObsidianToolProvider.java:236/254；v1 标 harmless 是审批静默降级。**UI 配套 v2.1**：审批弹窗/toast 文案「正在更新笔记索引，不影响笔记内容」，防用户困惑） |
| `obsidian.file.read` | 读笔记文件 | harmless |
| `obsidian.file.write` | 写/更新笔记 | ASK（**不进 harmless 名单**：goal 模式下 harmless 写工具自动放行，写任意义 vault 风险高于 Download/MOV） |
| `obsidian.file.search` | 按内容/标签搜索笔记 | harmless |

**skill×4 不迁（v2 定，理由写对）**：①老版 `_mov/skills/` 消费方为零（唯一读写在测试 ObsidianToolProviderTest.java:259/270）——迁工具容易、迁「技能被消费」的链路等于全新建设；②老版 assets/skills 是 `*.skill`（5 个文件，走 SkillActivator 动态注册线 BridgeAi.java:1069-1099），与 `_mov/skills` 是两套互不相通的存储，v1「assets/skills/*.md 类」表述有误；③新版两侧皆无（无 skills 目录、无 SkillActivator 等价物、dsh SkillRegistry 也是孤岛）。技能线如要做，另立全新建设单。

**note.create 边界（v2 论证）**：note.create = 快速便签（公共目录 notes/*.md，零授权）；obsidian.file.write = 用户知识体系（已授权 vault，互链/沉淀）。AI 面两工具语义分层：临时记录走 note.create，知识沉淀走 obsidian——写入 description 防意图漂移。

**呈现形态（v2 定）**：仅对话内可见，不上市场内置包卡（vault 工具依赖用户授权态，市场卡「一键启用」语义不适用）。

## 四、实现路径（v2 重写）

1. 新文件 `app/src/main/java/com/mov/android/ObsidianProvider.kt`——class 持 Context（照 HardwareProvider 范式）；**禁止照 SceneTools 骨架**（孤岛前科）
2. SAF 通路：detect=引导 ACTION_OPEN_DOCUMENT_TREE → register=takePersistableUriPermission+prefs 落盘（单写点）→ DocumentFile 读写；**权限失效兜底（v2.1）**：每次读写前校验 persisted URI 权限仍有效（MIUI 等 OEM 会回收授权），失效则引导用户重新授权——不得静默失败；**沙盒内核移植老版 ObsidianVault.resolve**（逐段 canonical+symlink 检测 :135-164），沙盒根=已授权 vault（非 file.* 的 Download/MOV 沙盒）
3. **接线四点配套**：mcpHandlers 注册段实例化 + toolParamSchemas 登记 + 权限名单（rescan/file.write 进 writeTools；read/search/check/detect 查询类）+ ToolRegistry.register 并行声明（查询类 true，先例 MainActivity.kt:1582-1593）
4. **:8389 暴露面评估**：obsidian.file.read 会把 vault 内容暴露到本机回环面（token 门控）——如需收口，参照 uiOnlyMcpTools 先例（MainActivity.kt:54-57）收进 uiOnly；施工时定，报告声明
5. 单测：契约断言 + **vault 沙盒穿越测试（读 ../ 必须拒）** + 变异亲杀
6. 真机：测试 vault 放 **filesDir 或 Download/MOV**（v1「放 assets」不可行——assets 是 APK 内只读资源，验不了写类）；真机验收由用户现场 SAF 授权真实 vault

## 五、验收标准

- L1：契约单测全绿（含路径穿越拒绝）+ 变异亲杀（rescan 权限级变异：从 writeTools 移除必 ASK）+ 接线断言（生产调用点存在）
- L2：真机 SAF 授权 → 探测/登记/建索引/读写 md 全链（截图 + 文件落纸证据）
- L3：AI 对话「把这条建议记到笔记」→ journal 真实 obsidian.file.write tool_call（SessionEvent.ToolCall 实物，MovQueryTools.kt:68）

## 六、待用户拍板（v2 已结两项，剩一项）

- [x] 存储通路 → **SAF 授权目录**（@2026-08-28；MANAGE_EXTERNAL_STORAGE 永久排除）
- [x] 技能线 skill×4 → **不迁**（消费链全新建设，另立单再议）
- [ ] 真机验收时的真实 Obsidian vault（验收现场用户 SAF 授权操作即可，无需提前提供路径）
