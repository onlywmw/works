# S-04 MOV 域迁移方案：市场迁至 mov-ai.cn，mow.kim 主域转工作台

> 出单：设计师 ｜ 日期：2026-08-27 ｜ 维度：市场（dims 市场.md S-04，衔接基建 W-02）
> 优先级：P1 ｜ 状态：方案完成，待派单
> 已定方向（用户拍板 @2026-08-26）：市场未来迁 mov-ai.cn，mow.kim 主域留作个人工作台。

---

## 一、现状盘点（设计师源码/部署实测 @2026-08-27）

**App 端硬编码 mow.kim 共 5 处（生产代码）**：

| 位置 | 常量 | 用途 |
|---|---|---|
| `MainActivity.kt:42` | `BIZ_BASE_URL = https://mow.kim` | 商业后端 A2A relay（注册/凭据） |
| `MainActivity.kt:45` | `PARTNER_BASE_URL = https://mow.kim/partner` | 商户入驻 |
| `SubmitClient.kt:15` | `https://mow.kim/market-submit` | 工具提交 |
| `MarketAdminApi.kt:13` | `https://mow.kim/market-admin` | 市场审核 |
| `McpMarket.kt:31` | `MARKET_REGISTRY_URL = .../market/registry.json` | 市场注册表 |

另有工作台前端（workbench-web）登录走 mow.kim 的 account-service。

**服务端**：Caddy 按路径分发（`/market/` → 静态 `/var/www/market/`，`/market-admin`/`/market-submit`/account/review → 反代各 service），部署目标 `root@mow.kim:/var/www/`。market-web 全库**零 mov-ai.cn 痕迹**——迁移未做任何预备。

**核心约束**：已上架/已分发的旧版 APK 永远指向 mow.kim，不可回收修改 → **API 路径必须双跑或 301 兜底**，市场页面可以迁移，API 不能硬切。

## 二、迁移总策略

**页面迁、API 留、常量收、主域最后切。** 四批，每批独立可验、可回滚。

## 三、分批方案

### 批 0 · 前置核查（用户侧动作为主，零代码）

| # | 事项 | 说明 |
|---|---|---|
| 0-1 | **mov-ai.cn ICP 备案状态确认** | 国内服务器未备案域名的 80/443 会被拦截——**这是全案唯一硬阻塞项**。备案主体须与江西皮蛋科技有限公司一致；未备案则立即发起（周期 2-4 周，越早越好） |
| 0-2 | 微信商户平台回调/支付授权目录核查 | S-02 商家入驻线若绑了 mow.kim，迁后需在商户平台加 mov-ai.cn 授权目录 |
| 0-3 | Caddy 配置盘点 | 列全 mow.kim 现有路径→服务映射表，作为双跑配置底稿 |

### 批 1 · 双跑奠基（出码，服务端）

- mov-ai.cn DNS 解析至现服务器；Caddy 加 mov-ai.cn 站点块，TLS 自动签；
- **同栈双跑**：mov-ai.cn 全路径（market 静态 + account/review/submit 反代）与 mow.kim 等价可用；
- 验证：逐路径对拍两域响应一致（registry.json / account /market-admin/health 等）。

### 批 2 · 市场站切换（出码，market-web）

- market-web 内绝对链接/分享文案全量换 mov-ai.cn（含 guide/upload/merchant 页脚与公众号素材口径）；
- mow.kim 市场**页面** 301 → mov-ai.cn 对应页；**API 路径与 /wb/ 工作台不重定向**（继续双跑）；
- SEO：canonical 指向新域、sitemap 更新；
- mov-ai.cn 底部悬挂 ICP 备案号（合规必做）。

### 批 3 · App 侧域名常量化（出码，0027-mov）

- 5 处硬编码收敛为单一 `BuildConfig`/`const` 常量（默认 mov-ai.cn）；
- 新版 App 指向新域；**旧版由批 1/2 的 API 双跑兜底**，随自然换机衰减；
- 此批可搭车 UPG-11 之后的出包一起发，不单独发版。

### 批 4 · mow.kim 主域切换（衔接基建 W-02）

- mow.kim 首页 → 工作台门户（工作台从 /wb/ 提至主域，/wb/ 301 到主域）；
- 全链路回归：旧版 App / 新版 App / 市场（mov-ai.cn）/ 工作台（mow.kim）/ 商家入驻。

## 四、验收标准（各批通用骨架）

- **L1**：每批构建绿 + 相关单测绿；批 3 加「5 处硬编码全消」静态断言（变异：放回一处硬编码 → 必红）；
- **L2**：批 1 双域对拍截图；批 2 旧域 301 实跳录屏 + 新域全页面走查；批 4 四端回归截图入 ACCEPTANCE_LOG；
- **L3**：批 2 后旧版签名 APK（当前 V1.0）真机实测市场/注册链路不死——旧 App 兼容是本案的命根子。

## 五、红线

- API 双跑期不得关停 mow.kim 的任何 service 路径（旧 App 全靠它）；
- 301 只切页面，不切 API；
- 批 0-1（ICP 备案）未落地前，批 1-2 不得对生产做任何切换动作（可在测试路径预演）；
- 微信商户回调变更前先在小范围验证支付链路；
- 迁移全程不动工作台现有功能与账号数据。

## 六、派单建议

批 0 是我和你（用户）的活，不出工单；批 1+2 服务端/前端合并出一张工单（建议沿用市场维编号 S-04，落 dims 市场.md）；批 3 挂 App 维新单（UPG-13，可与 UPG-11 同包发版）；批 4 与 W-02 合并出单。验收走三层标准照旧。

## 七、风险登记

| 风险 | 等级 | 对策 |
|---|---|---|
| ICP 备案未办/主体不符 | 高（硬阻塞） | 批 0 立即核查发起 |
| 旧 App 断联 | 高 | API 永久轻量双跑，写入红线 |
| 微信支付回调失效 | 中 | 商户平台双域授权 + 小额实测 |
| 搜索引擎权重流失 | 低 | 301 + canonical，市场站权重本就初期 |
