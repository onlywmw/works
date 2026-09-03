# 交付报告 · UPG-97 侧边栏工作台三入口接线 + comingSoon 兜底可见性

> 类型：M3 缺陷修复（纯前端分派欠账） ｜ 日期：2026-09-04 ｜ 依据：`设计师\派单\UPG-97_侧边栏三入口接线_派单_2026-09-04.md`
> 验收标准：`STD-UPG-97-v1`（content_sha256=`37c9db0493405ced8eb18d8cb08706714b67c2dd9f6205307ea3c49a86b2464f`）｜ 状态：✅ 已完成（交付，待验收）

## 交付绑定（P0-2）

| 项 | 值 |
|---|---|
| delivery_id | `DEL-UPG97-20260904-001` |
| code_commit_sha | `9010075d`（0027-mov `feat/upg97`，基 origin/main ac7495f[含 UPG-93 已合 3315bff0]，已 push origin） |
| artifact_sha | sidebar bundle `SidebarNav-B_E4bgD4.js` sha256=`7e2123640e2a3225…`（产物链同步件，全量产物入 feat/upg97） |
| evidence_manifest_sha | `72035bc94192512be0c9d096a4eaee45ce166dc2e760fefaa1e6bd2895a4b445` |
| manifest | `处理中心\delivery_UPG97_manifest.json`——**deliver-gen 硬闸机制产出**（MANIFEST_OK 自检 ok:True 重算一致；非手工件） |

## 一、根因与修复

**根因**（设计师真机实测定位）：`SidebarNav.vue` `openBuiltin`（原 :244-247）只接 tasks/orders/vault 三 case，其余落 `comingSoon` 裸 toast（真机近乎不可见）。原生 handler 与白名单齐备——纯前端分派欠账。

**键值对齐实证链**（防 9-02 openAssets 漏 case 同族）：
- 槽位 page 键唯一真相 = `CapsuleResolver.kt:22-25` 静态表：tasks→**workbench**（我的能力）/ orders→orders / vault→**assets**（我的资产）/ memory→**memory**（我的记忆）
- 胶囊分派表 `MainActivity openPageByCapsule:1401-1406` 同键值 → `ui.openWorkbench/openOrders/openAssets/openMemory`
- handler 注册点在案（tools/PageTools.kt: ui.openMemory:46 / ui.openAssets:37 / ui.openWorkbench:122 / ui.openOrders:129）
- demo.js 旧键（tasks/vault）保留兼容 case

**修复**（`前端设计/mov-vue/src/components/SidebarNav.vue`）：
1. `openBuiltin` 补三 case：`workbench→ui.openWorkbench` / `assets→ui.openAssets` / `memory→ui.openMemory`
2. 兜底可见化：裸 toast → `showDialog` 人话提示（标题「敬请期待」+「该入口暂未开通」，`common.entryNotAvailable` 中英双字典），`openBuiltin`/`onWbClick` 两处分支统一走 `comingSoonVisible()`

## 二、STD-UPG-97-v1 销项逐条

| 销项 | 结论 | 证据 |
|---|---|---|
| openPage 三 case 接线且键值对齐实证 | ✅ 上行号引用 | `SidebarDispatchContractTest` 分派锚+键值对齐锚（源码契约） |
| comingSoon 兜底可见 | ✅ showDialog 弹层 | 兜底锚；平板五槽位全接线无未接线槽位可点（「如有」不适用——如实申报） |
| 产物=mov-vue 构建同步（禁手改 bundle） | ✅ vite build 3.79s → sync-pages 103 文件先清后放 | `build_chain.txt`（bundle hash 在档） |
| 2 变异锚亲杀红→还原复绿 | ✅ | M1 删 memory case→分派锚/键值对齐锚红；M2 兜底回裸 toast→兜底锚红；还原均复绿（`mutation_M1/M2` log；两轮作废教训注记在案：CRLF 失配注入未生效/restore 误回 HEAD 冲施工件→改定点快照还原） |
| 全量绿 + assembleDebug 绿 | ✅ 794/0/0（110 套件）+ BUILD SUCCESSFUL；bun 18/18 | `final_gate.txt` |
| 真机五点验全过；MainActivity/tools 零行改动 | ✅ 平板五入口逐点截图 | `point1_market/point2_orders/point3_memory/point4_assets/point5_workbench.png` |
| Token/KV 两节申报 | ✅ 0/0（纯前端分派接线，请求链路未触及） | 本节即申报 |

## 三、真机五点验（平板 192.168.2.3:5555，Android 16）

| 入口 | 结果 |
|---|---|
| MCP 市场 | ✅ MCP 工具市场页（本地/市场 tab） |
| 我的订单 | ✅ 订单页（进行中/已完成 tab + 诚实空态） |
| 我的记忆 | ✅ 记忆页（共 3 条/已记住/待确认——报障入口修复实证） |
| 我的资产 | ✅ 资产页（WeChat 1 项） |
| 我的能力 | ✅ 商家工作台（开通新能力/任务大厅/预约管理） |

## 四、范围与红线遵守

- ✅ 产物只从 mov-vue 构建（vite→sync-pages 既有口径）；零手改 bundle
- ✅ 既有接线零回归：房间区/钉选/profile/MCP 市场/订单——回归锚+全量绿双重
- ✅ MainActivity/tools 零行改动（`git diff` feat/upg97 仅 mov-vue 源+i18n+测试+assets 产物）
- ✅ 发现 handler 缺失=零（齐备，未顺手加任何东西）
- ✅ 证据脱敏：截图无敏感信息；演示数据零残留（平板 pin 列表未做任何改动）

## 五、hash 三重 + 双闸

| code_commit_sha | artifact_sha | evidence_manifest_sha |
|---|---|---|
| `9010075d` | bundle `7e2123640e2a3225…` | `72035bc94192512be0c9d096a4eaee45ce166dc2e760fefaa1e6bd2895a4b445` |

- **manifest 硬闸**：deliver-gen 机制产出 MANIFEST_OK；主仓 `审验.py --manifest` 独立复核 ok:True 重算一致（9 条全 exists/hash_matches=True）
- **verify-hash**：`审验.py --verify-hash feat/upg97 9010075d` → HASH_REJECT \<not-ancestor\>（未合分支常态，hash 存在性已验，已 push origin——设计师合 main 后终态复核）

## 六、登记说明

- **已登记两个表**：`工单库.md` UPG-97 卡交付块 → sync 投影 `工单表.xlsx`（diff=0 读回对账）；认领登记 @05:47 已在表
- 待验收员验收（L2：diff 精读+变异复杀+真机五点验复点）→ 审验员证据链审验 → 设计师合 main
