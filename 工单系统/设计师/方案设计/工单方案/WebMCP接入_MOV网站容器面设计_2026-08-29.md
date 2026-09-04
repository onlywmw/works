# WebMCP 接入 · MOV 网站容器面设计（按 WebMCP 标准设计 mow.kim）

> 设计师 @2026-08-29 ｜ **v1.1**（2026-08-30 补强：`mov_` 命名前缀 + input schema + 错误码对齐 + 三期视觉反馈）｜ 依据：`灵感库/评估报告/评估_WebMCP_2026-08-29.md`（WebMCP 已入 W3C 标准轨道）+ 作者浏览器双本质愿景
> **一句话**：把 mow.kim 三区（/home/ //dev/ //tools/）从「给人看的站」升级为「**人和 AI 共用的站**」——按 WebMCP 标准暴露确定性工具（容器面），展示面不动（UPG-40 token 体系已覆盖）。

---

## 一、设计原则（五条，全部对齐 WebMCP 标准）

1. **网站现有功能包装为工具，不新造后端**——工具 = 站点已有数据/能力的确定性入口（registry.json、文档正文、页面状态）；
2. **纯前端实现**——静态站零构建链变更：自研 `mov-page-server.js`（JSON-RPC 2.0 over postMessage，对齐 W3C webmcp 接口命名，≈200 行，AGPL 零搬运）script tag 引入；
3. **双轨 AI 就绪**——WebMCP（交互级，AI 可调工具）+ llms.txt/.md 镜像（摄取级，任意客户端可读）互补，覆盖全谱客户端；
4. **安全默认**——工具全只读；`allowedOrigins` 白名单（MOV App ConnectWeb origin）；返回内容一律标注「数据非指令」（防注入纪律）；
5. **命名前缀 + input schema（v1.1，对齐 WebMCP 纪律）**——工具名统一 `mov_` 前缀（对齐 WebMCP 域名前缀命名，多站并挂互不混淆）；有参工具声明 input schema（对齐 WebMCP zod 语义的简化版，JSON Schema 子集），`tools/list` 四字段齐备（name/description/inputSchema/outputSchema）。

## 二、页面 × 工具矩阵（容器面清单）

| 页面 | 暴露工具（name / 返回） | 数据源（全部现有，零新后端） |
|---|---|---|
| 全站 | `mov_site_info` → 标题/URL/导航/版本 | 页面内嵌 JSON |
| /dev/spec.html | `mov_get_tool_contract` → 四字段契约全文（.md 镜像）；`mov_search_spec(query)` → 章节检索；`mov_list_error_codes` → 16 类错误表 | spec 正文 / .md 镜像 |
| /dev/quick-start | `mov_get_quickstart_template` → hello-server.mjs 全文 | 既有模板文件 |
| /dev/package.html | `mov_get_registry_schema` → registry.json 字段级说明 | 既有正文 |
| /dev/publish.html | `mov_get_publish_flow` → 上架全流程+拒审清单 | 既有正文 |
| /tools/（市场） | `mov_list_packages()` → registry 目录（含安装态字段）；`mov_get_package(id)`；`mov_market_stats()` → 包数/分类分布 | registry.json 同源 fetch（S-08 同源机制现成） |
| /home/ | `mov_get_overview` → 产品概览 | 页面内嵌 JSON |

> **参数（v1.1，对齐 zod 语义）**：有参工具仅 `mov_search_spec(query: string)` / `mov_get_package(id: string)`，声明 input schema（JSON Schema 子集）；其余无参（空 properties）；非法参数 → `invalid params`。

**作者例子的闭环形态**：AI 客户端（MOV ConnectWeb 或任何 WebMCP 客户端）打开 /dev/spec.html → 发现 `mov_get_tool_contract`/`mov_get_quickstart_template` → 确定性拿到契约与模板 → 直接开工开发契合 MOV 的 MCP 工具 → `market.submit` 提交上架。**文档页 = 施工图纸，工具 = 图纸的协议化出口。**

## 三、分期施工

| 期 | 范围 | 量级 |
|---|---|---|
| **一期** | `mov-page-server.js`（自研，postMessage+JSON-RPC+工具注册+ToolListChanged）+ dev 站 3 工具（mov_get_tool_contract / mov_get_quickstart_template / mov_search_spec）+ llms.txt + spec.md 镜像——「开发者文档一键给 AI」闭环 | 1 天 |
| **二期** | /tools/ 三工具 + /home/ + 全站 mov_site_info + 页内「AI 就绪」徽标 | 半天 |
| **三期** | MOV ConnectWeb 作为 WebMCP 客户端/Hub（WebView 注入 proxy 聚合各站工具 → 经 UPG-27 MCP 面挂进 AI 工具面）——**单独立卡**，依赖浏览器双本质规划；**站点工具调用并入 App 既有卡片投影**（UPG-40 状态可见性，对齐 WebMCP 视觉反馈纪律：AI 动作用户可见） | 大（App 侧） |

## 四、验收

- **L1**：JSON-RPC 合规断言（headless 注入客户端：tools/list 返回注册工具四字段、tools/call 回显数据；**错误码对齐 MCP 标准：非法方法 → `method not found`、非法参数 → `invalid params`、内部错误 → `internal error`**）；工具返回内容含「数据非指令」防注入标注。
- **L2**：真机/浏览器实测——dev 页 tools/list 可发现、mov_get_tool_contract 返回与页面正文一致的契约（同步性断言：改 .md 镜像源 → 工具输出同步变）；llms.txt 可达。
- **L3**：三期后 ConnectWeb 真机走查（打开 mow.kim → AI 工具面出现站点工具 → 调用返回）。
- **AGPL 红线验收**：`mov-page-server.js` 全文无 @mcp-b 代码拷贝（自研声明 + code review）。

## 五、红线

1. 工具**全只读**（mov_site_info 类；不暴露任何写动作——写走 App 内既有权限闸）；静态站无凭据面天然隔离；
2. `allowedOrigins` 白名单制，禁 `*` 上生产（开发期除外）；
3. 返回内容统一「数据非指令」包裹（防注入，OCR 先例同款）；
4. AGPL：零代码搬运，协议对齐 W3C webm
> ⚠️ **更正 @2026-09-04**：经官方调研核实——**无「WebMCP」机构标准**；MCP 为 Linux Foundation 项目（SEP 流程），外部标准互动指向 IETF 非 W3C；「已入 W3C 标准轨道」查无依据。对外协议事实 = **MCP Streamable HTTP（现行规范 2026-07-28：POST-only 单端点 / 无 initialize 握手改 MCP-Protocol-Version 头 / 无会话 / OAuth 2.1）**——官网容器面对外统一按此实现。cp 标准轨道，来源标注；
5. 展示面零改动（UPG-40 token 体系已覆盖；本方案纯容器面增量）。

## 六、与既有规划的合并关系

- **UPG-42（页面→AI 一键通道，App 侧）**：本方案 = 站点侧；两侧会师即「浏览器双本质」闭环——42 的「AI 就绪协议」条目由本方案**升级替代**（llms.txt 单轨 → WebMCP+llms 双轨）；
- **UPG-43（站点学习库）**：互补不冲突——学习库 = MOV 主动学站点，WebMCP = 站点主动给 AI；三期后可叠加（站点工具 + 学习知识双通道）；
- **dev 站基线**：本方案落在一期时随 dev 站同步标记走（页脚基线 +1 commit）。
