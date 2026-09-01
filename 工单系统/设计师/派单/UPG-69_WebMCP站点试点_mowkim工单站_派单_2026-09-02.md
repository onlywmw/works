# 【派单 UPG-69】WebMCP 站点试点（mow.kim 工单站第一站）

**设计师** @2026-09-02 ｜ **级别**：P1 ｜ **依据**：用户拍板「App 内浏览器先 MCP 改造」（站点侧并行试点）；UPG-43a 共引契约 `docs/WEBMCP_PROTOCOL_v0.1.md`（UPG-43a 起草——本单施工前先确认契约已冻结，未冻结则按草案先行+标记）

## 范围（最小闭环）

- **mow.kim 工单工作台**暴露 3 个 mov_* 业务工具（窗口 `window.mov_webApi` 登记表：name/desc/schema/handler）：
  1. `mov_openTicket`——开工单（标题/描述/来源）——**写类，过审批闸**
  2. `mov_queryTicket`——查单（单号/状态/进度）——只读
  3. `mov_listOrders`——订单列表（最新 N 条）——只读
- 登录态：全部工具走**已登录会话**（不绕过认证——open 权限=登录用户本身权限）
- 与 43a 对齐：命名 `web.mow.kim.<工具>`（App 侧解析）+ 契约版本 v0.1

## 判据（STD-UPG69-v1）

- W1：`mov_webApi` 登记表 3 工具齐全（schema 完整；页面内 `window.mov_webApi` 存在性+属性断言）
- W2：AI 工具面出现 `web.mow.kim.mov_openTicket/mov_queryTicket/mov_listOrders`（配合 43a——若 43a 未就绪则 stub 验证+标注，闭环以 43a 合入后为准）
- W3：mov_queryTicket 只读调用 → 真实数据回程 + 投影卡片可见（UPG-40 纪律）
- W4：mov_openTicket 写 → 过 Gatekeeper（无上下文=ASK/拒绝；变异：移除闸→红）
- W5：契约对账（站点登记 3 工具 ↔ App 侧解析 3 工具一致——机器对账）
- W6：cross-site 隔离（非 mow.kim 页零注入——变异：泄漏→红）

## 红线

- 只做 mow.kim 工单站 3 工具（试点最小闭环）；不做市场注册/其他站/10 工具全量
- 写类必过闸；只读禁止副作用（read 类状态零变换）
- 契约 v0.1 冻结（随 43a 派单；改版=新单）
- 交付=分支 `feat/upg69`（网页建设系仓库——mow.kim 工作台前端）+ 报告 + 变异亲杀（W2/W4/W6 ≥3）+ 登记两表

## 判定

- 与 43a（0027-mov）/68（安全闸）/50（UI）文件不相交；mow.kim front-end 独立
