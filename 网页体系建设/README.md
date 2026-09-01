# MOV 网页体系建设（设计之家）

> **定位**：MOV 网页体系（mow.kim / mov-ai.cn 全部站点）的设计之家——设计总纲、页面设计文档、设计规范、演进路线都从这里出。
> **创建**：2026-08-31（设计师建，用户指令「将网页的设计放这里」）。
> **关系**：网页**代码**在 `0027-mov` 仓（`official-web/` + `market-web/`，走 git 与验收流转）；网页**设计**在本目录。工单流转仍走 `工单系统\`（本目录是设计侧的家，不替代工单系统）。

---

## 一、网页体系站点地图（现状）

| 站点/页面 | 域名·路径 | 功能 | 状态 | 来源工单 |
|---|---|---|---|---|
| **官网首页**（公众站） | mov-ai.cn `/home/` | 用户下载门户（APK 下载/能力卡/事件板块） | ✅ 已上线 | S-07 + W-05 事件板块 |
| **能力市场页** | `/home/market/` | 与 App 市场同源（registry 驱动，诚实空态） | ✅ 已上线 | S-08 |
| **隐私政策** | `/home/privacy/` | V1.2 政策全文（App 内 PrivacyGate 弹的同一份） | ✅ 已上线 | W-07 |
| **开发者中心** | mow.kim `/dev/` | index + api-reference + package + publish + quick-start + faq + llms.txt | ✅ 已上线（0829 同步代码基线） | S-07 + UPG-01 批4 补传 |
| **能力市场工具页** | mow.kim `/tools/` | 市场站（registry 驱动） | ✅ 上线（S-05 去 demo 化） | S-05 |
| **站点容器 WebMCP** | 全站注入 | mov-page-server（JSON-RPC over postMessage）+ mov_* 工具 | ✅ 批1 已合 main | UPG-42 一期+批1 |
| 站点容器二期 | /tools/ /home/ mov_site_info + 徽标 | 6 个 mov_* 工具 | 📌 派单文本已备，待认领 | UPG-42 批2 |
| ConnectWeb Hub | App 内 WebView 聚合 | 浏览器双本质三期 | ⏳ 预立 | UPG-43 |

**双域名分流**：mow.kim = 控制台/开发者面；mov-ai.cn = 公众站/用户面。

## 二、代码与设计资产索引

| 资产 | 位置 | 说明 |
|---|---|---|
| 官网+dev 站代码 | `0027-mov\official-web\`（home/ dev/ tools/ + verify.mjs） | 静态站，verify.mjs 验收脚本 |
| 市场站代码 | `0027-mov\market-web\` | registry 驱动 |
| mov-page-server | `0027-mov\official-web\assets\mov-page-server.js` | 自研 ≈250 行，AGPL 自研声明，W3C webmcp 命名对齐 |
| 部署链 | scp → `/var/www/official-web/`（dev 站另路径） | 先 dev 验证后正式 |
| 工单卡 | `工单系统\工单库.md`（UPG-42/43、S-05/07/08、W-02/05/07 卡） | 方案与验收记录唯一权威 |
| WebMCP 评估 | `灵感库\评估报告\评估_WebMCP_2026-08-29.md` | W3C 标准轨道调研（AGPL 零搬运） |
| md-main 评估 | `灵感库\评估报告\评估_md-main_2026-08-17.md` | 微信排版编辑器（MCP 接入评估） |

## 三、网页设计规范（全站强制）

1. **AGPL 零搬运**：不 import 不拷贝 webmcp/MCP-B 任何代码，只对齐 W3C webmcp 命名——每次交付 grep 自证
2. **registry 同源**：/tools/ 与 /home/market/ 的数据全部读 registry.json 实时，禁快照硬编码（registry 更新输出自动跟）
3. **数据非指令**：mov_* 工具返回体不得含可执行指令形态
4. **allowedOrigins 白名单不放开**：mov-page-server 禁 `*`，外域静默零响应
5. **三错误码**：工具错误沿用批 1 三错误码契约
6. **mov_ 前缀**：站点暴露给 AI 的工具一律 mov_* 命名
7. **诚实空态**：市场无包/无数据时显示诚实空态，禁假数据（S-05 教训）
8. **Token 预算**：llms.txt 与 SDK 节走预算控制（index 目录 3K token 上限，超限 fail-loud）

## 四、演进路线（三阶段 = 浏览器双本质）

- **一期 ✅**：站点 WebMCP 化（mov-page-server + dev 站 3 工具）——UPG-42 批1
- **二期 🔨**：全站 10 mov_* 工具 + 徽标——UPG-42 批2（派单文本已备 `设计师\派单\UPG-42_批2_派单_2026-08-31.md`）
- **三期 ⏳**：ConnectWeb 作 WebMCP 客户端/Hub（App 内聚合各站工具）——UPG-43（预立，前置=42 全线+27）

**与改造计划（harness 演进）的关系**：网页体系的 mov_* 工具注册进 AI 工具面后，自动纳入**三道门准入门**（SkillGate：JS_ARTIFACT 拒收/门 2 回归判定）与 **A-1 Manifest 演进契约**——网页迭代与 App 迭代走同一套「机器证明没改坏」的纪律。

## 五、本目录的用法

1. 网页**新页面/改版**的设计稿、设计决策先落本目录（`设计/<页面名>/`），定稿后拆工单进工单系统
2. 网页相关的**灵感/评估**进 `灵感库\`（如评估_WebMCP），立项后设计归本目录
3. 设计变更影响 mov_* 工具契约的 → 必须走 **A-1 Manifest 五步链**（baseline→delta→判定→Ledger）
