# DELIVERY_UPG87_2026-09-03 · UPG-87 内置包启停真实生效（宿主工具组纳入 builtin 包机制）

> 程序员：C（Claude/wmw0027）｜ 认领登记 @2026-09-03 17:10（工单库 UPG-87 卡）｜ 结论：**机制全量落地 + JVM 行为实证 + 3 变异锚亲杀 + 真机装机默认态实证——待验收员验收（真机启停 UI 走查=验收员持有项，见 §六）**

---

## 〇、交付绑定（SYS-01 P0-2 · 红线 23）

```yaml
delivery_id: DEL-UPG87-20260903-001
standard_id: STD-UPG-87-v1   # content_sha256=805aa4e38987de6ee05ae05dadb27b855873e68174348109de3aadc45a408397
code_commit_sha: fea2fae     # feat/upg87（基 main fe8cd45 = origin/main 顶——UPG-81/82/85 均已合入=0 失败基线）
artifact_sha: 37a427420f2abee02e784325b5bdc43484c0334514f499f27712936f678a4caa   # app-debug.apk（assembleDebug 绿）
evidence_manifest_sha: 6d461e479380a38fc64fa229fc2f181d10fb46418ab68efe45dd3aeb8d1a511f   # 处理中心/delivery_UPG87_manifest.json
```

- verify-hash 交付时点 = `HASH_REJECT not-ancestor`（分支未合态必然，同 UPG-82/85 处置先例——合后由验收员复跑=绑定终态）。

## 一、L0 范围声明

| 项 | 值 |
|---|---|
| 实现范围 | ①三宿主组纳入 builtin 包机制（McpMarket/LocalOverview）②启停真实生效（MainActivity syncHostBuiltinTools + 面收缩/热挂接线） |
| 触碰契约 | MCP 市场契约 builtin 语义（browser builtin 先例复用）；工具面投影（rebuildAgentTools 单点扩展）；UPG-23 本地总览（组定义源） |
| 范围外 | 审批/guard 语义（零改动——PermissionRegistryData 只读未动）；执行绑定；扫描编排；McpServer/McpToolScheduler 通信层；MiniHttpServer |

## 二、施工内容（四件）

1. **组定义+名单单源**（`LocalOverview.kt`）：新增 `HOST_PACK_IDS` 常量与 `hostPackTools(id, universe)` 纯函数——组归属只认 `BUILTIN_PACKS.prefixes`（唯一组定义），工具全集 `universe` 由调用方注入其上下文真实面（MainActivity 侧=mcpHandlers.keys 实际注册集合）。**零手抄**：不含任何硬编码工具名，前缀漏项即名单漏项（变异锚 3 杀点）；scene.* 等未入审批登记表的工具经 universe 注入自然覆盖（PermissionRegistryData 仅 17/18 登记，单靠它会漏 scene 组——这是名单源选择的关键依据）。
2. **纳入 builtin 包机制**（`McpMarket.kt`）：`withHostPacks(pkgs)` 幂等追加三个本地 kind=builtin 包（id/name/desc 来自 BUILTIN_PACKS，**builtinTools 留空=名单不在本层持有，零双写**）；refresh 成功与 loadFromCache 双点包裹（远端同名 id 让位，防重复条目）。纳入后 `setEnabled` 走既有 builtin 分支（builtinStates 落盘）——**不再 MARKET_NOT_INSTALLED**（挂账-upg41v2 销项核心）。
3. **启停真实生效**（`MainActivity.kt`）：新增 `hostDisabledTools` 单点状态 + `syncHostBuiltinTools()`——禁用=按 builtinOn 现算禁用集（hostPackTools×mcpHandlers.keys）→ ①rebuildAgentTools 面+E3 allowedTools 同步收缩（**禁用后 agent 调用=TOOL_NOT_FOUND，E3 既有塌缩机制零新代码**）②MCP 面 `mcpServer.removeTool` 摘除；启用=handler 恒在 mcpHandlers 内存不丢 → `addTool` 重挂热恢复 + rebuild。`syncBuiltinPackTools(id)` 分派（browser-automation→既有 browser 通道 / 宿主组→新通道）；market.enable/disable/uninstall/install 四 handler 接线；冷启调用（MCP 启动段）=**重启状态保持**（builtinStates 持久化 + 禁用面收缩再现）。
4. **默认全量启用**（零缩减）：`builtinOn(id) = builtinStates[id] != false` 既有语义不动——builtinStates 缺省=启用，启停=用户显式动作；真机冷启实证「禁用工具 0 个（全量启用）」。

## 三、测试面（XML 计数 · 2026-09-03 18:3x 统计时点）

| 面 | 结果 |
|---|---|
| McpMarketTest（+3 新案） | **36/0**——宿主组纳入 list（kind=builtin 三组在册）/ enable 不再 MARKET_NOT_INSTALLED（挂账-upg41v2 销项判定）/ disable 落盘+enable 恢复+**新实例重读=重启保持**/ 同名 id 幂等不重复；既有断言 packageCount 2→5（目录纳入宿主包=预期行为变更，注记在案） |
| HostBuiltinPackTest（新，5 案） | device-control 名单完备 10 工具（锚③杀点）/ scene+obsidian 推导（含未登记 scene.*）/ 未知组空防御 / HOST_PACK_IDS 同源 / 禁用集分组互不牵连 |
| HostBuiltinPackContractTest（新，3 案） | MainActivity 接线源码锚（syncHostBuiltinTools 摘除+名单单源+MCP 面/enable 热挂+冷启+disable 分派/agent 面过滤+E3 白名单） |
| 全量 | `:app:testDebugUnitTest --rerun-tasks` **100 套件 741/0/1 全绿**（0 失败基线——UPG-81 已合 main）；736[U85 合后]+11[本单新增]=741 |
| 构建 | `:app:assembleDebug` BUILD SUCCESSFUL |

## 四、变异亲杀（3 锚 · STD 必填 · 全红实录）

| 锚 | 变异动作 | 结果（XML 口径） |
|---|---|---|
| 锚①（禁用只落盘不摘除） | 删 market.disable 的 `syncBuiltinPackTools` 分派（恢复旧行为） | HostBuiltinPackContractTest **3 跑 1 红**（disable 未接 builtin 分派） |
| 锚②（启用不热挂/重启丢失） | 删 MCP 启动段冷启 `syncHostBuiltinTools()` 调用 | 同套件 **3 跑 1 红**（冷启恢复缺失） |
| 锚③（组名单漏 tool） | BUILTIN_PACKS device-control prefixes 删 `calendar.` | HostBuiltinPackTest **5 跑 1 红**（calendar.list 名单漏项断言） |

**还原**：三变异均在 commit `fea2fae` 保护下 `git checkout --` 还原 → 定向复绿 → 全量 **741/0/1 复绿**；工作区 clean（生成器文件 PermissionRegistryData/ApprovalRegistry/c7_baseline 在测试跑动中出现行尾/时戳快照 M，**git diff 实质为零**，已还原——非本单施工不捎带提交）。

## 五、真机实证（平板 192.168.2.3:5555 · 2026-09-03 18:21/18:35 两次冷启）

- **装机**：`install -r` Success（feat/upg87 debug 包）。
- **默认态（两次冷启一致）**：`MOV-Market: 宿主内置包启停同步: 禁用工具 0 个（全量启用）` + `MOV-Boot: 工具面=全量（agent 工具面 182 工具…）`——**默认全量启用零缩减实证**；browser 14 工具入面不受影响（既有通道零回归）。
- 证据：`程序员/UPG87-evidence/device_boot_log.txt`（15 行，含时间戳）+ `device_default_state.png`（真机截图）。

## 六、真机启停 UI 走查——验收员持有项（如实申报）

- **已做**：装机 ✓ / 默认态 ✓ / 冷启状态稳定性 ✓（两次冷启日志一致）。
- **未做（转验收员 L3 走查）**：本地 tab 内置包卡片「停用→工具面收缩→AI 调用 TOOL_NOT_FOUND→启用恢复→重启保持」的 UI 端到端——程序员走查受阻于两件环境事实（非本单缺陷）：①测试平板前台被第三方应用（象棋）占用且 WebView 胶囊点击热区与 uiautomator 坐标在横竖屏切换期间错位（自动化点按不可靠）；②MCP `:8389` curl 通道（tools/list 也零响应）为**既有通道问题**——MiniHttpServer/McpServer 通信层本单零改动（同 token 平板本地 curl/nc 均无响应，forward 与否一致），验收员可用 App 内 UI 走查不受影响。**此两项如实转持有，不虚报 L3 完成**。

## 七、Token / KV Cache 影响申报（L4 两节）

- **Token 影响**：0（默认态）——默认全量启用，工具面与修复前完全一致（182 工具实证）；用户显式禁用某组后，agent 面/工具描述随面收缩等比减少（**会话内恒定规则不动**：同一会话内启停不中途变化，面变更走 rebuild 下一生效——档位说明）。MCP 面同步收缩（tools/list 不再含禁用组工具）。
- **KV Cache**：0 新增——禁用状态复用既有 `market_builtin.json`（browser builtin 同款持久化文件，未新增存储面）。

## 八、共享面影响清单 + 能力护栏（红线 24）

```yaml
## 能力护栏（P1-1）
共享面影响清单:
  - 共享面: 工具面（mcpHandlers 投影/rebuildAgentTools/E3 allowedTools）+ MCP 面注册（mcpServer.addTool/removeTool）+ 市场目录（McpMarket registry）
  - 影响下游: agent 面投影（默认态零变化——182 工具实证）/ MCP tools/list（默认态零变化）/ 市场页与本地 tab 展示（宿主组新增 kind=builtin 条目=预期变更）/ browser builtin 通道（分派改造后 browser-automation 仍走 syncBrowserAiTools 原路径——真机 14 工具入面实证）
  - 回归说明: 全量 741/0/1（0 失败基线零回归）；McpMarketTest 既有 33 案零回归（仅 packageCount 断言数值随目录纳入更新）；PermissionRegistryData/审批语义零接触
coverage_status: FULL
```

## 九、挂账销项对应

| 挂账 | 销项证据 |
|---|---|
| 挂账-upg41v2-内置包启停不可操作（MARKET_NOT_INSTALLED） | McpMarketTest `UPG87 宿主组纳入builtin机制`：三组在册 + setEnabled enable/disable 均 ok（不再抛） |
| 挂账-upg23-内置包停用不摘工具面（prefix 摘不到 device.*） | 名单单源=prefixes×universe 推导（hostPackTools）+ syncHostBuiltinTools 按**工具名**摘除（removeTool）——不再依赖组名前缀；锚③防名单漏项 |

## 十、已登记两个表

① `工单表.xlsx`（sync 投影，UPG-87 行程序员列/备注列/delivery_id）；② `工单库.md` UPG-87 卡交付块。报告落 `程序员\交付报告\DELIVERY_UPG87_2026-09-03.md`。

---
*程序员 C · 2026-09-03 · worktree mov-upg87 可随验收流程收*
