# 样本任务卡 S-LISTING-01 · 上架商品（真实链·第三样本）

> 用途：task-polish 打磨环真实链第三样本（候排·入排队列末位；名称沿用旧候选「上架链」登记）；口径 **A（链路真·环境隔离）**。
> 版本：v1 @2026-10-07（设计师）｜蓝图版本＝`listing-v1`（6 步·发布一次确认）。

## 一、任务定义

- **任务**：商家**上架一件商品**——扫码/拍包装起手，自动抽取成草稿，核对补全后一次确认发布，商品可查。
- **起点**：App 对话（「上架商品」/扫码起手）或工具面 `listing.scan`（拍条码→拍包装 OCR→抽取→合规→一键草稿·参数零手填）。
- **终点判据**：商品在商家系统**上架成功可查**（`listing.publish` 同步成功且服务端商品态为已上架/在售·mall 端可见）。
- **被测链路**：`listing.scan`（`ListingPipeline.fromScan→complete→complianceNotes`→`ListingDraftStore` 本地草稿）→ 一次确认 → `listing.publish`（`bizHttpAccount`＋shop 对齐〔POL-6〕＋幂等：有 serverId 走 PATCH）→ 契约 `POST /merchant/product/draft` → 商家系统；列表＝`listing.drafts`；**商品图通道＝`POST /merchant/product/upload`（multipart≤5MB/张·≤5 张 → `/uploads/*` 公网 URL）**。
- **蓝图步**（`listing-v1`）：
  s1 拍条码（USER）→ s2 拍包装/OCR（USER）→ s3 抽取＋AI 补全＋合规提示（EXEC）→ s4 核对补全缺件（USER·gaps 清单）→ s5 一次确认发布（USER·confirm 闸→EXEC `listing.publish`）→ s6 可见性核读（READ：商品可查）。

## 二、执行方式（口径 A）

| 项 | 取值 |
|---|---|
| 环境 | 沙盒实例（POL-4）；服务端商品契约走沙盒真路径 |
| 设备 | 专用模拟器（相机可拍/注入图）；条码/OCR 用真实样例图（**真件不上传**）；关键节点真机取证（D8） |
| 注入 | 缺件态（gaps 未补）→ 补齐发布；服务端拒绝/幂等重放（PATCH）用例 |
| **真伪映射** | 真：抽取/合规/草稿/同步/幂等/寻址；伪（显式标注）：AI 补全模型档（MOCK/真档可切）；真机取证点：s5 发布前后、s6 商品可见帧 |
| 数据 | 沙盒账号＋沙盒店铺；样例商品图/条码 |

## 三、重复方式

- **协议三元**：同上（SHA／同号续跑／次数组内一致）。
- **注入序列**（每轮固定）：未补全（s4 卡）→ 补齐 → 发布（s5）→ 可见（s6）；幂等重放：同草稿再发 ⇒ PATCH 不重复。
- **读数**：四读数＋触点蓝图（s1..s6 预期触点·首轮定基线）。

## 四、准入三问

1. 谁用＝已入驻/已开通商户号的商家；2. 什么算完成＝商品上架成功可查（终点判据）；3. 能不能重跑＝能（本地草稿幂等＋注入序列）。

## 五、现状盘点（通/断·首批跑批核实）

- **已在**：扫码上架 MVP 全链（UPG-158 `ListingPipeline`·抽取/GTIN/GS1/OCR/合规/草稿）｜草稿同步与列表（UPG-170 `listing.publish`/`listing.drafts`）｜寻址对齐（POL-6）｜契约 `POST /merchant/product/draft`。
- **待核实**：① 服务端商品「上架/在售」态的**可见性判据**（mall 端展示链）② 草稿 PATCH 幂等的重复跑读数 ③ 相机注入图路径（模拟器）与真机取证点。
