# 交付报告 · UPG-98

> 类型：拆分主线批②（L3） ｜ 日期：2026-09-04 ｜ 依据：`设计师\派单\UPG-98_MainActivity拆分批2市场面_派单_2026-09-04.md` + STD-UPG-98-v1
> 治理归属：只动 `Desktop\MOV\工单系统` / 0027-mov 只读 ｜ 状态：✅ 已完成（交付，待验收）
> **重要前情**：本单为首验打回后重做（§P51b/c）。重做路径=人工搬移定案；实际执行=cherry-pick 上轮人工搬移 commit 2787b73a（非脚本自动化——该 commit 即上轮 IDE 手工搬移产物，当时 compileDebugKotlin EXIT=0 实证）+ 锚定面迁移全部收口（上轮未完成项）。分支头推进=d11509cc（DEL 重绑红线 23）。

---

## 一、本阶段交付（4 件）

| # | 交付 | 实现 |
|---|---|---|
| 1 | 市场面 7 块搬移（buildLocalOverview/obsidianVaultAuthorized/syncBrowserAiTools/syncHostBuiltinTools/syncBuiltinPackTools/mountExtTools/unmountExtTools） | `market/MarketOverviewTools.kt` 顶层扩展（receiver=MainActivity，零新增 Activity 持有）；MainActivity 6047→5929 行（-118，当前基线含 95/96/97 增量） |
| 2 | 13 成员 private→internal（只增不滥，全部为 7 块直呼所需） | uiOnlyMcpTools/agentToolScheduler/marketCapability/browserHandlers/mcpServer/mcpHandlers/sceneToolDescriptions/providerToolMeta/toolParamSchemas/extToolMetaMap/browserAiEnabled/hostDisabledTools/rebuildAgentTools |
| 3 | 锚定面迁移收口（上轮 9 失败 6 类全修） | ①upg93_handlers_index MarketTools 11 条行窗 +4（sha 冻结值不变自验证）②HostBuiltinPack/ToolFaceSrc market/ 联合读源 ③可见性锚迁移 4 处（rebuildAgentTools×3 类/sceneToolDescriptions/extToolMetaMap）④ToolMetaTest 区域锚改 `fun MainActivity.` 扩展形态 ⑤SceneWiring 模板串断言保持 |
| 4 | 批②常驻契约锚 | `MarketSplitContractTest` 5 锚（名单/保真/唯一写点/直呼接线/军规8）+ `upg98_market_manifest.txt` 冻结 sha（7 块 before 值来自上轮 recon98 对账 upg98_fidelity.json，match:true 全等已在档） |

## 二、验收判据核对（逐条证据）

| 项 | 标准 | 实测证据 |
|---|---|---|
| 保真锚 | 7 块归一化 sha256 前后全等 | ✅ MarketSplitContractTest 保真锚绿（冻结值=拆前 04ca51ab 实测 sha，自验证成立）；变异 M1=buildLocalOverview 改一行逻辑（`!= false`→`== true`）→ 保真锚红且精确点名 → 还原复绿 |
| 名单锚 | 漏搬/多搬/改名必红 | ✅ 变异 M2=多挂伪函数 zzMutantMarketTool → 名单锚红（expected 7 vs was 8 点名）→ 还原复绿。申报口径：删除形态单点不可编译（调用点连带），变异取多挂方向，同锚同效力 |
| 唯一写点锚 | 壳内伪搬移必红 | ✅ 变异 M3=MainActivity 壳内复制 syncBuiltinPackTools 定义 → 唯一写点锚红点名为 syncBuiltinPackTools → 还原复绿（git diff 零残留） |
| 全量回归 | testDebugUnitTest 0 失败基线 | ✅ 804/0/1（112 套件，/1=SceneLiveQueryTest 预存 @Ignore）；UPG-93 拆分锚零回归（ToolsSplitContractTest 全绿） |
| 构建 | assembleDebug 绿 | ✅ EXIT=0（18:11 构建=d11509cc 树） |
| 冷启动锚 | Δ>10% 标红 | ✅ 拆前 5 次 940/982/951/906/926 中位 940ms；拆后 932/914/1031/916/977 中位 932ms；Δ=-0.9% 在带内 |
| 真机 L3 | 三场景 | ✅ ①ui.openMarket 市场页正常渲染（截图）②内置包启停：market.disable device-control→MCP 面 185→172（-13 精确名单，logcat「禁用工具 13 个（calendar.*,camera.*,device.*,qr.scan,screen.capture,sensor.list）」）→market.enable→恢复 185（logcat「禁用工具 0 个（全量启用）」）③market.status 直呼真执行返回。冷启 syncHostBuiltinTools 调用在位（18:27:02 logcat） |

## 三、证据引用

- `审验员/证据数据/2026-09-04/UPG98/upg98_market_page.png` —— 场景①：MCP 工具市场页（本地 tab：内置能力三包+市场已安装+系统基础能力渲染正常）
- `审验员/证据数据/2026-09-04/UPG98/upg98_smoke_logcat.txt` —— 场景②③：MOV-Market 启停双行 + ApprovalVis/ApprovalService 审批链路日志

## 四、测试结果（XML 汇总）

- 全量 `testDebugUnitTest`：804 tests / 0 failures / 0 errors / 1 skipped（112 套件全新鲜，--rerun-tasks）
- 新增 MarketSplitContractTest 5/5；迁移涉及的 ToolsSplitContractTest/ToolMetaTest/SceneWiringContractTest/Upg84ModeConvergeContractTest/HostBuiltinPackContractTest/HomePresentationContractTest 全部复绿

## 五、hash 三重（交付绑定）

| code_commit_sha | artifact_sha | evidence_manifest_sha |
|---|---|---|
| `d11509cc` | `b3f19b94ce801a00` | `c277f9fba2dde4dda0e87aa7c0bdccb026b8aa2568407466e35dc89dc8469543` |

**manifest 自检（UPG-92 内置硬闸 · 审验.py --manifest）**：ok:True ｜ 绑定值重算一致 ｜ 文件：`处理中心/delivery_UPG98_manifest.json`

**E2 hash 一致性预校验**（复用 SYS-02 阶段一 `审验.py --verify-hash`）：

- 命令：`python 审验.py --verify-hash feat/upg98 d11509cc --repo C:/Users/Administrator/0027-mov`
- 结果：**HASH_REJECT <not-ancestor>**——NOT_IN_MAIN 如实申报（未合待验收态，分支头=d11509cc 已 push origin feat/upg98）；合 main 后 verify-hash 终态闭环归设计师

## 六、范围与红线遵守

- 红线 1 纯搬移零逻辑改动：✅ 保真锚机器证明（7 块 sha 全等）+ 行为面 804/0/1 + 冷启动 Δ-0.9%
- 红线 2 MainActivity 纯 CRLF：✅（搬移+还原创面 git diff 核验）
- 红线 3 军规 7/8：✅ 壳内净 -118 行零新增（仅 import 5 行直呼）；market/ 零 Activity 字段持有（军规 8 锚在测）
- 红线 4 零行为变化三层证据：✅ 保真锚+契约测试+真机冒烟齐
- 红线 5 Token/KV 两节：**Token 影响=不变；KV Cache 影响=不变**（纯代码组织改动，请求链路零触碰；`node scripts/check-token-effect.mjs` 通过）
- 复用上轮资产的说明：搬移本体=cherry-pick 2787b73a（上轮人工搬移，编译实证过），锚定面迁移/契约测试/变异/冷启动/真机全部本轮新做新验；旧链 06e3ba48（更早废弃 WIP，基 ac7495fb 无锚迁移无测试）已被本链覆盖（force-with-lease 显式租约推送）

## 六之二、施工期重大回归与自纠（强制节）

- 本轮无重大回归。两处自纠如实申报：①首轮 gradle 构建报 compileDebugKotlin FAILED 为瞬态（daemon 竞争），--rerun-tasks 复跑即绿，非代码问题；②MarketOverviewTools.kt 文件头注释与 mountExtTools KDoc 粘连同行（cherry-pick 自旧 commit 的排版缺陷）致保真锚提取块混入文件头 sha 不匹配——已重排为独立注释块+空行分隔（搬移块正文零改动，保真锚复绿自证）。
- 视觉类追加变更：无。

## 七、登记说明

- 已登记：`处理中心/delivery_UPG98_manifest.json`（deliver-gen 硬闸产出，非手工件）；DEL-UPG98-001 绑分支头 d11509cc（红线 23 分支头推进=重绑——上轮 4b279e0a 已废，本报告绑定值为最终头）
- 待登记（流转后）：工单库 UPG-98 卡交付块 → sync 投影 diff=0
- 观察项（不阻塞，供问题区）：①审批呈现 isAppVisible 不稳定——冒烟期间多次 visible=false 误判前台→NOTIFY 路由，且「打开其他 sheet（我的订单）致 pending 未确认自动拒绝」；最终经 uiautomator 轮询+自动弹出对话框完成 3 次批准（refresh/disable/enable 全链路实证审批管道可用）②宿主组 setEnabled 依赖 registry 含 host packs（fromCache=true 后可用）——若 registry 长期不刷新，market.disable 宿主组抛 MARKET_NOT_INSTALLED（McpMarket.kt:621 挂账双案的残留面）
