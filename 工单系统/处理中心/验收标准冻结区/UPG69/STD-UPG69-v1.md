# STD-UPG69-v1 验收标准冻结版

> 工单：UPG-69 ｜ 标题：WebMCP 站点试点（mow.kim 工单站「站点=业务工具」第一站）
> 补冻 @2026-09-05（设计师：设计定稿→补冻为机械动作，UPG-103 同口径）

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG69-v1`
- **content_sha256**: `753694923074505d2684d86a13c9982b1ba21e8ca80f2edd9b48470d6d15b458`（= 冻结区正文实算）
- **frozen_at**: `2026-09-05T05:30:00`

## 冻结区

## 判据（W1-W6，设计师 2026-08-31 派单 v2 定稿）

| 编号 | 判据 | 验收器 |
|---|---|---|
| W1 | 站点登记 3 工具齐全：mov_webApi / mov_openTicket / mov_queryTicket / mov_listOrders 字面量在页 + 注册表自检 UI 上线 | 线上 GET /tools/tickets.html 200 + grep |
| W2 | 工具面 web.mow.kim.* ×3 接通（ConnectWeb 打开通道）——PARTIAL 持有：对话决策不可控+消息内 URL 链接受限 | 真机（验收员持有） |
| W3 | 站点消费工具（页面 JS 调 App 工具）——PARTIAL 持有（同上成因） | 真机（验收员持有） |
| W4 | 写工具过审批闸：mov_openTicket 登记 REGISTERED_WRITE_TOOLS（43a 预留锚激活）+ 未登录服务端 401 fail-closed | 变异亲杀（WRITE_TOOLS 移除→红）+ curl 401 |
| W5 | 契约对账：WebMcpHubTest 26 用例（含 2 条新增锚） | 亲跑 |
| W6 | App 侧 REGISTERED_DOMAINS fail-closed（43a 既有锚引用） | 源码锚 |

## 判定口径

- W1/W4/W5/W6 = FULL 全绿；W2/W3 = PARTIAL 持有（真机补验挂账）→ **通过（持有）成立**
- 终止：W2/W3 由「App 内 WebMCP 通用通道」延伸单补验，不在本单阻塞

## 形式链（红线 23 配套）

- DEL 绑定 = DEL-UPG69-20260905-001（code=f5e7212a / manifest=delivery_UPG69_manifest.json / 报告=程序员/交付报告/DELIVERY_UPG69_2026-09-05.md）
- 两表登记：工单表 col4/5/8 + 工单库 §P59 验收段（2026-09-05 补）

