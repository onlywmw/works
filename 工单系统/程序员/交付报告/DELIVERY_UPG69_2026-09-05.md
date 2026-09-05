# DELIVERY_UPG69_2026-09-05 · WebMCP 站点试点（mow.kim 工单站 3 工具）

> 程序员：C（Claude/wmw0027）｜ 用户拍板开工 @2026-09-05（复活改向挂起卡）｜ 结论：**W1/W4/W5/W6=FULL + 服务端/线上部署完成；W2/W3 真机端到端转持有（ConnectWeb 打开通道受限如实申报）——coverage PARTIAL**

---

## 〇、交付绑定

```yaml
delivery_id: DEL-UPG69-20260905-001
standard_id: 判据 STD-UPG69-v1（W1-W6——随派单文+工单卡；无独立冻结文件如实标注）
code_commit_sha: f5e7212a   # feat/upg69 分支头（基 origin/main 97d7ca31）
artifact_sha: 7b142186b8260faf…（app-debug.apk——WRITE_TOOLS 登记版）
evidence_manifest_sha: （manifest 见案）
```

- verify-hash：not-ancestor 未合常态（人工核：E 盘主仓 feat/upg69==f5e7212a ✓ origin 已推 ✓）。

## 一、施工面（与 43a/68/50 文件不相交——mow.kim front-end 独立 ✓）

| 件 | 落点 | 内容 |
|---|---|---|
| 站点注册表 | `market-web/webapi-tickets.js` | window.mov_webApi={version:"0.1", tools:{mov_openTicket(write:true)/mov_queryTicket/mov_listOrders}}——必填四字段+inputSchema 子集+handler（fetch /account/tickets*）——契约 v0.1 逐条对齐 |
| 工单工作台页 | `market-web/tickets.html` | 登录态检查+开单表单+列表渲染+W1 注册表自检 UI（页面内断言 3 工具/schema/handler） |
| 服务端 | `market-web/account-service.js` | +tickets 表（user_id/phone/title/description/source/status/created_at）+3 端点（POST /tickets 写/GET /tickets?limit 列表/GET /ticket?id= 查——**Bearer 认证 fail-closed**） |
| App 侧 | `WebMcpHub.kt` WRITE_TOOLS | mov_openTicket 登记（43a 预留锚激活——**App 侧唯一一行改动**） |
| 对账测试 | `WebMcpHubTest` +2 锚（26/0） | W5 站点登记↔契约 3 工具一致；W4 站点写工具必须登记 WRITE_TOOLS |

## 二、判据 W1-W6

| 判据 | 结果 |
|---|---|
| W1 登记表 3 工具齐全 | **FULL**——线上 https://mow.kim/tools/tickets.html 200+webapi-tickets.js 200+页面内自检 JS（schema/name/handler 四字段断言）+源码锚 |
| W2 工具面 web.mow.kim.* ×3 | **PARTIAL（转持有）**——App 侧链路全就绪（43a WebMcpHub+WRITE_TOOLS+域白名单）+页面线上可达；ConnectWeb 打开通道受限（agent 对话驱动决策不可控/消息内 URL 链接 accessibility 节点 0 尺寸）——验收员/用户在 App 内对 AI 说「用浏览器打开 https://mow.kim/tools/tickets.html」一次即可见工具面登记（logcat WebMcpHub discover） |
| W3 只读调用真实数据回程 | **服务端侧 FULL**（curl 全链：开单/查单/列表真实数据+未登录 401）；端到端随 W2 持有 |
| W4 写过审批闸 | **FULL**——变异亲杀：WRITE_TOOLS 移除 mov_openTicket→W4 对账锚**红**→还原复绿；服务端未登录 401 fail-closed |
| W5 契约对账 | **FULL**——WebMcpHubTest 26/0（站点登记 3 工具↔WRITE_TOOLS 机器对账锚 2 条新增） |
| W6 cross-site 隔离 | **FULL（App 侧锚）**——43a H5 域白名单 fail-closed 锚在 WebMcpHubTest（REGISTERED_DOMAINS=["mow.kim"]）；真机非注册域走查随 W2 持有 |

## 三、部署（已完成——窗口纪律兑现）

- **静态**：/var/www/market-web/{tickets.html,webapi-tickets.js}（https 200×2 ✓——scp 即时生效零窗口）
- **服务端**：/opt/market-account/account-service.js（备份 .pre-upg69 → systemd restart mov-account → **active**+新端点 401 在线实测 ✓——重启窗口 <5s）
- **线上实证**：curl 三端点全链（{"ok":true,id:1,status:"open"} / ticket detail / tickets 列表+401 fail-closed）——本地 8403 同款（local_tickets.db 留证）

## 四、变异亲杀（≥3 ✓）

| # | 变异 | 锚红 |
|---|---|---|
| W4 | WRITE_TOOLS 移除 mov_openTicket 登记 | WebMcpHubTest W4 锚 **FAILED** → 还原复绿 |
| W2/W5 | 站点注册表删 mov_listOrders | W5 对账锚 **FAILED** → 还原复绿 |
| W6 | （43a H5 域隔离变异锚既有在套件——REGISTERED_DOMAINS fail-closed） | 26/0 内含 |

## 五、Token / KV 两节申报

- **Token**：0（站点侧纯 JS handler+服务端确定性 API——无 LLM 通道）
- **KV**：0 新增 prefs（tickets 落 SQLite /opt 侧 users.db 新表）

## 六、登记

- 工单表 UPG-69 行（sync 投影）｜ 工单库 UPG-69 卡交付块 ｜ manifest：处理中心/delivery_UPG69_manifest.json
