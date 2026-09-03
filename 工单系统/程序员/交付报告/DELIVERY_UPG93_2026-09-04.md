# 交付报告 · UPG-93 MainActivity 拆分·阶段 1（工具注册面搬移 + 拆分蓝图落档）

> 类型：L3 高风险重构（纯搬移零逻辑改动） ｜ 日期：2026-09-04 ｜ 依据：`设计师\派单\UPG-93_MainActivity拆分阶段1_派单_2026-09-03.md` + 计划书 v1.2（唯一施工口径）
> 验收标准：`STD-UPG-93-v2`（content_sha256=`5dfd1a3d190bff63d13da4ec0cfa226967537aee6805ad580674cc80b73e6b1f`）｜ 状态：✅ 已完成（交付，待验收）
> 认领：新会话接管（按卡「WIP 回滚→重新认领需独立完整会话」），基建复用 76c91cb（169 盘点+9 域归类+形态定案）

## 交付绑定（P0-2）

| 项 | 值 |
|---|---|
| delivery_id | `DEL-UPG93-20260904-001` |
| code_commit_sha | `c969b05a`（0027-mov `feat/upg93`，基 main 254d6ca，已 push origin） |
| artifact_sha | 不适用（app-debug.apk 为验证副产物不入库；真机证据在案） |
| evidence_manifest_sha | `26a1d78013af8af55b1b49f24b3b26809727f38bbf9cef8c49436ce0c0025dbf` |
| manifest | `处理中心\delivery_UPG93_manifest.json`（`审验.py --manifest` 自检 **ok:True 重算一致**，输出附 §五） |

## 一、交付件

| # | 交付 | 位置 |
|---|---|---|
| 1 | 工具注册面搬移：172 静态注册+动态循环 → `tools/` 9 域扩展文件 + BuiltinTools + ToolsRegistry（object 只聚合）；MainActivity 7666→6016 行 | 0027-mov `app/src/main/java/com/mov/android/tools/`（11 文件）|
| 2 | 常驻契约测试 7 锚（名单/保真/唯一写点/装配顺序/P0-3/动态循环/落域）+ 冻结资源（manifest/index 各 172 行） | `app/src/test/java/com/mov/android/ToolsSplitContractTest.kt` + `app/src/test/resources/upg93_handlers_*` |
| 3 | 拆分蓝图 v1（全量盘点+形态盘点+分批计划+行尾约定+债务清单） | `设计师\方案设计\MainActivity拆分蓝图_v1.md` |
| 4 | 三方对账/生成/亲杀工装（复跑入口） | worktree 根 `scan93.py/scan93b.py/gen93.py/gen93_fidelity.py/mut93.py` + `*_report/reconcile.json`（已入库 feat/upg93） |

## 二、STD-UPG-93-v2 销项逐条

| 销项 | 结论 | 实物证据 |
|---|---|---|
| 工具注册面搬入 tools/，ToolsRegistry 只聚合，MainActivity 零 `mcpHandlers[` 写入 | ✅ | 唯一写点锚：MainActivity 括号写入=0、ToolsRegistry 零 `handlers[`；P0-1 形态=object 只聚合 |
| Activity 持有边界（P0-3） | ✅ | 扩展函数+object 零实例；provider 留壳原位参数传入；P0-3 锚（tools/ 零 Activity 字段）；48 处 private→internal 为最小必要集（蓝图债务①收口方向在案） |
| 证据三层（P0-2） | ✅ | ①172 注册完整性：名单锚+保真锚（脚本化全量，归一化 sha256 逐块锁定）；②关键域行为契约抽样：全量 762 测试内含 DeviceObsidian（20 工具 meta+沙盒）/ToolMeta（41 投影）/审批系/market/memory 等既有行为契约（远超 20-30 抽样下限）零回归；③真机核心链路：平板三场景（下表） |
| handler 形态前置盘点落蓝图 | ✅ | 纯 lambda 114 / 带状态闭包 58 / 函数引用 2 / 标签 lambda 1（蓝图 §一表） |
| 零行为变化 | ✅ | 172 块归一化 sha256 前后全等（生成器内置断言+常驻测试双锁）；全量 762/0/0；真机工具面 182/158/24 与基线逐字一致 |
| 拆分蓝图落档 | ✅ | `设计师\方案设计\MainActivity拆分蓝图_v1.md` |
| 三变异锚亲杀全红还原复绿 | ✅ | M1 摘 vault.get→名单/保真/落域 3 锚齐红；M2 改 tool.help 一行→保真锚精确点名红；M3 第二写点→唯一写点锚红；还原复绿（M3 尾部陈旧 XML 读数已勘误注记，03:24 fresh XML 7/7） |
| 冷启动耗时锚 | ✅ | 平板：拆前中位 1592ms / 拆后中位 1673ms，**Δ+5.1%（<10% 阈值）**——无 lazy→eager 回退 |
| Token/KV 两节申报 | ✅ | 0/0（工具面不变、请求链路未触及）；`node scripts/check-token-effect.mjs` 通过 |
| MainActivity 纯 CRLF 保持 | ✅ | 孤 LF 0（装配 3 行已补 CRLF）；新文件行尾约定（CRLF）入蓝图 §一 |

## 三、口径修正（对账结论，蓝图 §一）

旧口径「185 注册点」= **172 静态命名注册 + 13 读引用/动态写入点**（`mcpHandlers[` 全文出现数）。前置盘点 169 块边界经独立扫描器逐块复核**零错位**（前任急停时怀疑的错位残片，实为生成器 v3 的删块 off-by-one/行尾双回车缺陷，非盘点错误）；补漏 3 个非典型 RHS（2 函数引用+1 标签 lambda）。三方对账：盘点（169）vs 独立扫描（172）vs 生成物（保真 172/172 hash 全等）闭合。

## 四、真机冒烟（平板 192.168.2.3:5555，Android 16，2032×3048）

| 场景 | 结果 | 证据 |
|---|---|---|
| 对话往返 | ✅ ping→pong 渲染；journal turn 链完整（user→request→chunk×26→assistant→turn/end） | `tablet_chat_roundtrip.png` + `tablet_boot_logcat.txt` |
| 写类审批卡 | ✅ vault.get 直呼→悬浮审批卡（敏感标/参数脱敏/审批待办 chip）→拒绝→`APPROVAL_DENIED` 干净错误 | `tablet_approval_card.png` + `tablet_vaultget_response.txt` |
| tool.help 直呼 | ✅ MCP :8389 直呼返回 vault.get 文档（permissionTier=ask）；market.status/file.read 同验（含干净错误形态） | `tablet_direct_calls.txt` |

shell.exec 未实测调用：与 vault.get 同一条 PermissionGuard→ApprovalService 链（已验），写类执行器侧不在本单搬移面内——如实申报，不乱点用户平板。

## 五、hash 三重 + 双闸

| code_commit_sha | artifact_sha | evidence_manifest_sha |
|---|---|---|
| `c969b05a` | 不适用 | `26a1d78013af8af55b1b49f24b3b26809727f38bbf9cef8c49436ce0c0025dbf` |

- **manifest 自检**（红线 23）：`python 审验.py --manifest 处理中心\delivery_UPG93_manifest.json` → **ok:True，一致? True，14 条全 exists/hash_matches=True**
- **verify-hash**（E2 闸）：`python 审验.py --verify-hash feat/upg93 c969b05a --repo 0027-mov` → **HASH_REJECT \<not-ancestor\>**——未合分支常态（hash 存在性已验，已 push origin），**设计师合 main 后终态复核**（同 UPG-88/90/91 模式）

## 六、范围与红线遵守

- ✅ 纯搬移零逻辑改动：handler 体逐字节原样（机器证明）；允许改动仅=接线改写（`mcpHandlers[`→`handlers[` / `this@MainActivity`→`this@registerPageTools` 1 处）+ 48 处可见性提升 + 测试锚定面迁移（toolFaceSrc 聚合，断言逻辑零改动）
- ✅ 审批/市场/页面桥/模式等其余面未碰（browserHandlers/WebMcpHub/审批装配/市场段全部留壳原位；蓝图排批）
- ✅ 全量 0 失败基线不破；审批系/UPG-84/76/79 契约套件零回归（762 内含）
- ✅ 军规 7/8：棘轮只出不进（壳净减 1650 行）；Feature 零 Activity 长期持有新增
- ✅ 证据脱敏：截图/token 无 secret（mcp_token 为设备私有目录随机会话令牌，未落任何文件——curl 命令经 env 传递）；`git grep sk-` 零命中
- ✅ 演示数据零残留：真机操作仅 ping/pong 对话 + 审批拒绝（无写类生效动作）；UPG-91 在施单未触碰

## 七、能力护栏（红线 24 · 共享面=工具装配面/MainActivity 注册表）

```yaml
共享面影响清单:
  - 共享面: MainActivity 注册表（工具装配面）
  - 影响下游: MCP server 工具投影 / McpToolScheduler（agent 面）/ 页面直呼（pageToolProvider/胶囊分派）/ 外部发现合并
  - 回归说明: 172 名单+保真 hash 全锁；装配顺序锚（先于 server 遍历）；真机面 182/158/24 与基线逐字一致；直呼+审批+对话三链路实测
coverage_status: FULL
```

## 八、登记说明

- **已登记两个表**：`工单库.md` UPG-93 卡交付块 → `sync-orders.mjs --sync` 投影 `工单表.xlsx`（diff=0，读回对账）；认领登记 @2026-09-04 01:58 已在表
- 待验收：验收员独立复跑（`gradlew :app:testDebugUnitTest --tests "com.mov.android.ToolsSplitContractTest"` + 全量 + 真机抽查）→ 审验员证据链审验 → 设计师合 main（feat/upg93 @c969b05a）后 verify-hash 终态复核
