# Google Play 上架 + 接入 Google 支付 + 海外上线 调研报告

> 调研日期：2026-08-29
> 调研方式：Google 官方文档实抓（support.google.com/googleplay/android-developer + developer.android.com，2026-08 版本），关键数字均有原文出处
> 记忆存档：Reasonix 项目记忆 `project/google-play-上架-billing-出海调研结论-2026-08-官方核实版.md`

---

## 一、总览：三件事、一条时间线

| 阶段 | 关键事项 | 耗时 |
|---|---|---|
| ① 账号 | 注册 Developer 账号（个人 $25 一次性 / 组织需 D-U-N-S）→ 身份验证 + 设备验证 | 个人约 1–3 天；组织 D-U-N-S 申请最长 30 天 |
| ② 封测关 | 新个人账号必须先跑封闭测试：**12 名测试者连续 opt-in 14 天**，再申请生产权限（审核约 7 天） | 约 3 周 |
| ③ 首发 | 商店资料 + 各类声明表单 + 首次审核（官方口径"最长 7 天或更久"，新账号通常更慢） | 1–2 周 |

**个人账号路线从零到上架现实工期约 5–6 周；组织账号再 +30 天。**

---

## 二、开发者账号（Google Play Developer）

- **个人账号**：一次性注册费 $25（业内公认数字，现行官方页面本次未能直接核实到该金额），通过 Google Pay 用 Visa / Mastercard / Amex 信用卡或借记卡支付，**预付卡不收**。个人账号同样可以上架收费应用和内购赚钱。
  来源：https://support.google.com/googleplay/android-developer/answer/9875040
- **组织账号**：**必须有 D-U-N-S 编号**（Dun & Bradstreet 九位企业标识，免费申请，最长 30 天）。金融、健康医疗、VPN、政府类应用**强制**组织账号。
  来源：answer/13634885、answer/13628312
- **身份验证**：个人交政府签发证件（中国大陆身份证/护照可提交）；组织交 D-U-N-S + 营业执照 + 授权代表证件。**伪造证件 = 直接封号**。必须先通过验证才能提交应用。
  来源：answer/10841920、answer/15633622
- **设备验证（2024 年起新个人账号）**：要用 Play Console 手机 App 在一台 **Android 10+ 非 root 实体手机**上验证"你有真机"。
  来源：answer/14316361
- **中国大陆开发者**：官方确认中国支持开发者注册 + 商户注册，默认结算币种 **USD**（香港 HKD；澳门不支持商户注册）。网络环境/双币卡可用性官方无说明——实操上需要稳定的国际网络环境。
  来源：answer/9306917（Supported locations for developer and merchant registration）
- ⚠️ **2026-09-30 起新规**：所有 Play 应用（包括 Play 外分发的）都必须在 Play Console 注册包名做 Android developer verification，否则全球下架。
  来源：answer/10788890

## 三、新个人账号的"封测 14 天"关（最容易踩坑的点）

- 2023-11-13 之后创建的**个人账号**（组织账号豁免），首个应用上生产前必须：封闭测试轨道 **≥12 名测试者连续 opt-in 满 14 天**（中途退出重进则重新计天）。
- 然后在 Dashboard 申请 production 权限，回答测试情况 / 应用说明 / 上线准备三组问题，审核**约 7 天**。测试者不足或活跃度低会被打回继续测。
- 也就是说：**上正式架之前要提前组织好 12+ 个真实测试者（真实 Gmail 账号、真实使用）跑满 14 天**。
- 来源：answer/14151465（现行文档已把早期宣传的 20 名降为 12 名）

## 四、应用技术门槛

- **必须 AAB**（Android App Bundle）格式，新应用不再收 APK；单设备 APK 压缩下载上限 200MB（超出走 Play Feature/Asset Delivery），AAB 发布应用压缩下载总量上限 4 GB，不支持 .obb。
  来源：https://developer.android.com/guide/app-bundle 、answer/9859152
- **Play App Signing 默认强制**：上传后自动用 Google 生成的密钥签名；想用自己的签名密钥，必须在 open testing/production 发布**之前**切换，之后不可换。Upload key 必须 RSA 2048+。
  来源：answer/9842756
- **target API**：2025-08-31 起新应用和更新必须 **target API 35**（Android 15）；**2026-08-31 起必须 target API 36**（Android 16，可申请延期到 11-01）。不达标的旧应用对新用户隐藏。
  来源：answer/11926878
- 64 位（arm64-v8a）：2019 年起的既定要求，现行专页已撤，以提交时报错为准。

## 五、上架资料清单（App content + 商店页）

**声明类（全部必填，虚假申报会下架）：**

1. **隐私政策 URL**：商店页 + 应用内都要有链接（凡申请敏感权限的应用）。（answer/9859455）
2. **Data safety 数据安全表单**：所有测试/生产轨道都要填（internal 豁免），**必须覆盖第三方 SDK 的数据收集行为**；不收集数据的应用也要填并给隐私政策链接。虚假申报会被执法处理。（answer/10787469）
3. **IARC 内容分级问卷**：不填会被下架。（answer/9859655）
4. **广告声明**：含第三方 SDK 广告都要勾，虚报会封应用。（answer/9859455）
5. **目标受众声明**：含 13 岁以下儿童要过 Families 政策（只能用认证广告 SDK）；listing 不能让 Play 误判面向儿童。（answer/9867159）
6. **AI 生成内容政策**：**必须内置应用内举报/标记（report/flag）功能**，让用户不退出应用就能举报有害内容，且要用举报数据做内容过滤；AI 生成内容不得违反 Restricted Content / Deceptive Behavior 政策。（answer/13985936、最佳实践 answer/16353813）
7. **登录测试账号**：凡有登录的应用**必须给审核员提供可复用的英文测试账号**，且要能绕过验证码/短信 OTP；最多 5 组说明；有付费墙也需提供审阅通道。（answer/10788890、answer/15748846）

**商店素材规格：**

- 图标 512×512 32-bit PNG（带 alpha，≤1MB）；feature graphic 1024×500（JPEG/24-bit PNG）；**截图最少 2 张**（每设备类型最多 8 张，最长边 ≤3840px 且 ≤2 倍短边）；名称 ≤30 字符、短描述 ≤80、完整描述 ≤4000，预览视频用 YouTube 链接。
- 来源：answer/9866151、answer/9859152

## 六、接入 Google 支付（Play Billing）

**当前版本要求（纠正流传说法）：**

- 最新稳定版 **Billing Library 9.1.0**；"新应用/更新必须用 8"的截止日是 **2026-08-31**（当前最低要求仍是 7），新接直接上 9 即可。每个版本两年弃用周期，可申请延期到当年 11-01。
  来源：https://developer.android.com/google/play/billing/deprecation-faq 、/migrate-gpblv9

**端上接入要点：**

- 商品三类：一次性商品（消耗型 consumable / 非消耗型 non-consumable）、订阅（auto-renewing / prepaid base plan）。
- `queryProductDetailsAsync` 在 8+ 改了回调签名（`QueryProductDetailsResult`，要处理 `getUnfetchedProductList`）；9 移除了无参 `enablePendingPurchases()`，必须传 `PendingPurchasesParams`，一次性商品必须启用 pending。
- 购买结果三通道：`PurchasesUpdatedListener`（主）、`queryPurchasesAsync()`（onResume 补查）、RTDN（服务端）。只有 `getPurchaseState() == PURCHASED` 才发货。
- ⚠️ **`acknowledgePurchase` 必须在购买状态变 PURCHASED 后 3 天内完成，否则 Google 自动退款并撤销权益**（计时起点 = PENDING→PURCHASED 转变；订阅续订无需 acknowledge）；消耗型商品要 `consumePurchase`，且官方明确要求**先在服务端确认 token 未被使用过再发货**（防重复发放）。
- `ITEM_ALREADY_OWNED`：说明用户已拥有，先 `queryPurchasesAsync()` 查权益再决定是否展示购买。
- 来源：/lifecycle/one-time、/integrate、/errors、/security

**服务端（半强制）：**

- 必须在 Play Console 开通 Google Play Developer API 访问（需授 "View financial data" 权限）；验证用 `Purchases.products:get` / `purchases.subscriptionsv2:get`（一次性商品新端点 `purchases.productsv2.getproductpurchasev2`）；`purchaseToken` 全局唯一，可作数据库主键。
- **RTDN 实时通知**走 Google Cloud Pub/Sub：建 topic → push subscription（官方建议 push）→ 给 `google-play-developer-notifications@system.gserviceaccount.com` 授 Pub/Sub Publisher → Play Console "Monetize > Monetization setup" 勾选启用并填 topic 名 → "Send Test Message" 验证。通知类型选"subscriptions and one-time products"才覆盖一次性商品（ONE_TIME_PRODUCT_PURCHASED / CANCELED）。
- 退款/撤销：`Orders:refund`（revoke 参数撤权益）+ Voided Purchases API 对账。
- 来源：/getting-ready、/security

**商户与收款：**

- Play Console → Payments settings 建 **payments profile**：企业法定名称/地址（不收 PO Box）、官网、客服邮箱、信用卡账单商户名（减少 chargeback）；**注册国家不可改**。（answer/7161426）
- 中国大陆商户注册受支持、默认 USD 结算；收款侧官方不指定银行，国内开发者普遍用 Payoneer/Wise/香港账户接 USD。税务表单（W-8 系列）在收款前必填。

**分成比例：**

- 多数市场（现行）：参加 15% 档的**年收入首 $1M 内 15%，超出部分 30%**；**订阅一律 15%**（不论收入）。
- 新变化：**2026-06-30 起 EEA/UK/US 改为新费率**——订阅 10% + 5% 计费费；其他交易新安装 20%+5%（参与项目 15%+5%）、老安装 25%+5%（参与项目 20%+5%）；external web links 20%/15%。其他市场待全球推广。
- 韩国/印度替代计费交易费率减 4%。
- 来源：answer/112622（Service fees）

**测试（不用真钱）：**

- 把测试 Gmail 加为 License tester → 内购走 "Test instrument, always approves / always declines" 测试卡；订阅时间加速（5 分钟≈1 个月）可测续订 / grace period / account hold / installment；slow test card 测 pending 交易；promo codes 每应用每季度 500 个；Play Billing Lab 可模拟任意地区的购买体验。
- ⚠️ draft/internal 轨道有每日消费限额（交易笔数/单笔金额/日累计），大额测试要上 closed 轨道；测试 Gmail 不要拿去真实消费。
- 来源：https://developer.android.com/google/play/billing/test

## 七、发布轨道与审核时长

- **internal testing**：最多 100 人，几分钟可达，可先于 app 设置使用，豁免 Data safety，付费应用内部测试免费装。
- **closed testing**：email list（200 列表 × 每列 2000 人）或 Google Groups；不上架搜索；**新个人账号申请 production 前的必经轨道**。
- **open testing**：获 production 权限后可用，公开可见可加入。
- **production**：正式发布。
- 审核时长：官方从不承诺"X 小时"，口径是"最长 7 天或更久（exceptional cases）"；对新账号/特定类目会花更多时间审查（官方间接承认）。
- 来源：answer/9845334、answer/14151465、answer/9859751

## 八、政策红线（封号高发区）

1. **数字商品/功能解锁必须走 Google Play Billing**，政策原文明确禁止通过商店 listing、应用内 webview、按钮、链接、消息、广告、注册/登录流程等**任何方式引导用户去第三方支付**。合法例外：实物商品/实物服务/账单代缴、P2P 支付、线上拍卖、免税捐赠、赌博类（按赌博政策）；或参加官方替代计费计划（EEA/韩国/印度等，需单独报名，费率减 4%）。（answer/9858738 Payments 政策原文）
2. 审查期间**应用行为必须与普通用户一致**，禁止检测审核员/混淆行为规避审查（"Techniques to evade app reviews are not allowed"）。（answer/9888077 Deceptive Behavior）
3. 账号买卖/租借/代上架明令禁止；转移只能走官方 app transfer 流程。（answer/10788890）
4. 虚假 Data safety / 广告申报、伪造证件 = 下架/封号。

---

## 九、结合 MOV 现状的准备清单

1. **账号环境**：一部 Android 10+ 非 root 真机（设备验证）+ 国际支付卡（Visa/Mastercard）+ 稳定国际网络；账号身份证件备好。
2. **测试者资源**：提前找 12+ 个真实海外/海外网络用户跑 14 天封闭测试（这是硬性日历时间，最早启动）。
3. **审核员通道**：MOV 的验证码注册登录要做一个**免 OTP 的审核员测试账号**；应用内的 harness/诊断通道不能暴露给审核员面。
4. **AI 举报机制**：MOV 是 AI agent 应用，Play 的 AI 政策要求**应用内举报/标记功能**——需要在对话流里加"举报该回复"入口，这是过审硬条件。
5. **隐私政策英文版**：现有隐私政策页（mow.kim 上）需要英文版，并核对 Data safety 表单口径一致（包括 MOV 内嵌 Termux/工具链收集了什么数据）。
6. **商店素材**：英文商店页文案（30/80/4000 字符）、512 图标、1024×500 feature graphic、≥2 张截图。
7. **支付决策**：若在 Play 版卖数字功能（订阅/能力包），**必须 Play Billing**，现有第三方收款方式在 Play 分发版里不能在应用内引导；服务端要加 Play Billing 验证 + RTDN（可由云中继/账号服务承载）。
8. **收款**：Payoneer/Wise 账户 + W-8 税表；短信验证码要换国际短信通道（腾讯云国际短信）覆盖海外用户。
9. **工期建议**：组织账号（若走公司主体）先申请 D-U-N-S（30 天），与封测并行推进；整体个人路线约 5–6 周，组织 +30 天。

---

## 附：官方未覆盖/未能核实的点

- **$25 注册费**：业内公认数字，现行官方页面（旧 FAQ 已 404）未能直接核实到金额，仅确认付款方式。
- **64-bit 要求**：原政策专页已撤，属 2019 年既定要求，以 Play Console 提交时报错为准。
- **大陆开发者实操细节**（网络环境、双币卡可用性、Payoneer/Wise 收款）：官方无文档，属实操共识。
- **重复账号/代上架**：无独立现行政策页，仅有账号买卖禁令与 White Label Developers 最佳实践（answer/15884185，未逐页抓取）。

## 附：关键来源索引

| 主题 | URL |
|---|---|
| 账号类型选择 | https://support.google.com/googleplay/android-developer/answer/13634885 |
| 注册信息 | answer/13628312 |
| D-U-N-S | answer/13628312 |
| 身份验证与证件 | answer/10841920、answer/15633622 |
| 设备验证 | answer/14316361 |
| 注册费付款方式 | answer/9875040 |
| 封测 12 人 14 天 | answer/14151465 |
| AAB | https://developer.android.com/guide/app-bundle |
| Play App Signing | answer/9842756 |
| target API | answer/11926878 |
| 隐私政策 | answer/9859455 |
| Data safety | answer/10787469 |
| IARC | answer/9859655 |
| 目标受众 | answer/9867159 |
| AI 政策 | answer/13985936、answer/16353813 |
| 登录测试账号 | answer/10788890、answer/15748846 |
| 商店素材规格 | answer/9866151、answer/9859152 |
| 发布轨道 | answer/9845334 |
| 审核时长 | answer/9859751 |
| Payments 政策（数字商品必须 Play Billing） | answer/9858738 |
| 分成费率 | answer/112622 |
| Billing 弃用时间线 | https://developer.android.com/google/play/billing/deprecation-faq |
| Billing 接入 | https://developer.android.com/google/play/billing/integrate 、/getting-ready 、/lifecycle/one-time 、/security 、/errors |
| Billing 测试 | https://developer.android.com/google/play/billing/test |
| 商户 payments profile | answer/7161426 |
| 注册国家/币种 | answer/9306917 |
| Deceptive Behavior | answer/9888077 |
| 账号转移 | answer/6230247 |
