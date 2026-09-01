# DELIVERY_UPG43a App 内浏览器 WebMCP Hub 框架

**程序员 C @2026-09-02** ｜ 分支 `feat/upg43a`（**8b7b6d0**，6 文件 +780/-2）｜ 基线 main **3bd8847** ｜ worktree `mov-upg43a`
**已登记两个表**（工单表 UPG-43a 行 + 工单库）。

## 施工范围（H1~H7）

1. **H1 协议契约**：`docs/WEBMCP_PROTOCOL_v0.1.md` 落盘（登记表 `window.mov_webApi` schema/命名 `web.<域名>.<mov_工具>`/错误码 MCP 对齐/只读只映射口径/域名白名单 fail-closed）——UPG-69 共引基准，已冻结
2. **H2 web.* 工具面挂载**：`WebMcpHub.mountCallback` 经 UPG-27 LayeredRouter 热挂载 `web.<域名>.<mov_工具>` 到 mcpHandlers + MCP server + agent 工具面；`rebuildAgentTools` 补 web.* 投影（见过程修复②）——**真页面驱动前提=UPG-69 站点侧或 stub 站点（诚实标注，见验证）**
3. **H3 调用链**：AI→MCP→`WebMcpHub.dispatch`→`WebMcpHub.call`→`window.__movWebMcp.call`→页面 handler→JSON 回程（async handler 走 `pending/taskId` 退避轮询 30s）；**真 WebView 端到端需 UPG-69 或 stub 站点驱动（诚实标注）**
4. **H4 写类 Gatekeeper**：`write=true` 工具必过 `approvalService.request`（OUTCOME_ALLOWED_ONCE 才放行）——单执行通道（dispatch 是唯一闸，handler 级不豁免）；必填校验先于审批（缺参不弹审批）
5. **H5 域隔离**：`REGISTERED_DOMAINS=["mow.kim"]` fail-closed——非注册域零注入（bridge 不注入）+ 调用期兜底 `DOMAIN_NOT_REGISTERED`（导航逃逸也拒）
6. **H6 browser.\* 零回归**：browser.* 14 工具未动；全量 JVM 619 绿（见验证）
7. **H7 只读只映射**：`write=false` 直接转发、零副作用、参数原样透传（不触发审批、不改写参数）

## 验证

- **变异亲杀 4/4**（≥3 达标，每条还原必红）：
  - H4 移除 write 判定（写工具不审批直接转发）→ 3 红（未批准/不可用/批准后仍执行用例）
  - H4 反转 outcome 判定（`!=`→`==`）→ 3 红
  - H5 移除域白名单判定（非注册域放行）→ 1 红（DOMAIN_NOT_REGISTERED 用例）
  - H7 读类也触发审批（`if(true)`）→ 1 红（读类不弹审批用例）
- **全量 JVM 619 绿**（browser.* 既有 14 工具零回归；H6 达标）
- **WebMcpHubTest 16 用例**：H4（未批准拒绝且不执行/批准后执行/审批不可用拒绝/必填先于审批）/H5（白名单小写精确/空白空非法 fail-closed/hostnameOf 去端口路径查询/非注册域拒转）/H7（读类不审批+参数原样）/命名与登记表解析/discover 数组解析/必填校验/method not found/invalid params
- **诚实标注（H2/H3 真链路前提）**：`WebView 注入 bridge→页面 handler→JSON 回程` 的端到端需 UPG-69 站点侧（mow.kim 落地 mov_* 实现）或测试 stub 站点驱动；本次单测覆盖 dispatch/parse/mount 逻辑层，未覆盖真 WebView 往返——按派单口径如实申报，待验收员真机补验

## 过程修复（如实申报）

- ① **hostnameOf 未去端口**：`H5 hostname 解析 去端口路径查询` 红（`mow.kim[:8443]` ≠ `mow.kim`）→ 补端口剥离逻辑
- ② **rebuildAgentTools web.\* 投影缺口（自查）**：web.* 工具在 agent 工具面回落「MOV 工具:」模板字符串（仅 ext.* 查 extToolMetaMap）→ 加 `name.startsWith(CLIENT_PREFIX)` 分支走 extToolMetaMap
- ③ **stale-session 残留挂载（自查）**：onPageLoaded discover 在弹层关闭后完成会重挂陈旧工具 → discover 前后双 `session !== AgentBrowser.session` 守卫丢弃
- ④ **ApprovalRegistryGeneratorTest 数据依赖**：build/inventory/tools.txt 缺失（181 工具）→ 先跑 `node scripts/approval-inventory-collect.mjs` 生成；该测试顺带重写 `docs/ApprovalRegistry.json/.md` + `c7_baseline_UPG63/*.jsonl`（时间戳漂移，属 UPG-45/UPG-63 产物）→ 测试后 git checkout 还原，未混入本单提交

## 登记

- 工单表 UPG-43a 行：`✅C 完成`+备注（feat/upg43a 8b7b6d0+报告 DELIVERY_UPG43a_2026-09-02.md）
- 工单库 UPG-43a 状态：`程序员✅完成，待验收`

**待验收员**：WebMcpHubTest 复跑（H4/H5/H7 关键用例）+ 变异亲杀还原复核 + 真机补验（web.* 工具面出现需 UPG-69/stub 站点——诚实标注项）+ H6 browser.* 零回归抽查。
