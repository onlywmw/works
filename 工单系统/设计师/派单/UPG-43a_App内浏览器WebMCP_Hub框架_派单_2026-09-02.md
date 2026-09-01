# 【派单 UPG-43a】App 内浏览器 WebMCP Hub 框架

**设计师** @2026-09-02 ｜ **级别**：P1 ｜ **依据**：用户拍板「先对 App 内浏览器做 MCP 改造」（2026-09-02）——UPG-43 重排为 43a 先行（UPG-42 后行）；`浏览器双本质_容器与展示板_规划` §UPG-43 + `AGENT_BROWSER_PLAN.md`（browser.* 已落地）

## 范围

- **App 侧 WebMCP Hub 框架**（`app/src/main/kotlin/com/hermes/mov/browser/` + `app/src/main/assets/browser/`）：
  1. **proxy 中继**：WebView 页面 ↔ MCP 工具面（复用 agent-layer.js 注入层基础设施——同层扩展）
  2. **web.* 工具面挂载**：`web.<域名>.<mov_工具名>` 命名空间（经 UPG-27 LayeredRouter 面——**施工第一步：拉 feat/upg27 合入/或 rebase 到含 upg27 main**——若冲突报设计师协调）
  3. **登记/解析**：站点 `window.mov_webApi` 登记表 → App 侧工具列表（与 UPG-69 共引契约基准：`docs/WEBMCP_PROTOCOL_v0.1.md`——本单起草+UPG-69 共同冻结）
  4. **域隔离**：非注册域不注入（cross-site 隔离——UPG-69 W6 同判据）
- **不做**：站点侧 mov_* 工具实现（UPG-69 并行）；UPG-40 卡片投影样式细化（调用已有投影）；注册制（42 后行）

## 判据（STD-UPG43a-v1 随派单冻结）

- H1：协议契约 `docs/WEBMCP_PROTOCOL_v0.1.md` 落盘（登记表 schema/命名/错误码/只读口径——UPG-69 共用）
- H2：App 内浏览器打开 mow.kim → `web.mow.kim.*` 工具面出现（前提=UPG-69 站点侧齐；无 UPG-69 时用测试 stub 站点驱动——诚实标注）
- H3：调用链通（AI→MCP→proxy→页面 handler→JSON 回程——解析真实数据）
- H4：写类经 Gatekeeper（单执行通道不豁免——变异：绕过闸→红）
- H5：cross-site 隔离（非注册域零注入；变异：泄漏→红）
- H6：browser.* 既有 14 工具零回归（全量 JVM 绿）
- H7：只读只映射（web.* 不改变源页面状态——read 类无副作用实证）

## 红线

- 不扩功能（不做站点全量/不做注册制/不动 browser.* 现有语义）
- 域名白名单（只允许已登记域注入——fail-closed）
- MCP 面命名 `web.<域名>.<工具>`（v4.2 命名规范）
- 交付=分支 `feat/upg43a` + 报告 + 变异亲杀（H4/H5/H7 ≥3）+ 登记

## 判定

- 与 UPG-69（网页建设系）/UPG-68（安全闸）/UPG-50（UI 线待验收）文件不相交；`MainActivity.kt` 若需挂载点=与设计师协调排队（全局锁）
