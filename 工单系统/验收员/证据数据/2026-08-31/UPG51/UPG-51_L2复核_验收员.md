# UPG-51 协议授权/记忆加工/个性化推荐 —— 验收员复核记录（2026-08-31）

验收对象：feat/upg51 = **9ca96ff**（停靠 0aa0c07 绿基线；main 4bfddd8 红基线未依赖）

## 一、代码核物（五条全落）

| 条 | 结果 |
|---|---|
| ① 撤 ProfileSheet/词表/「用户画像」入口 | ✅ ProfileSheet 零残留；「用户画像」仅存 MemoryGene 基因注释（隐私纪律已内嵌）；删除仅旧 SettingsPage 产物 |
| ② 本地无感加工 | ✅ MemoryPreferenceExtractor（星座/生肖/饮食/消费/偏好 + MemEntry 提炼）+ PersonalizationEngine |
| ③ 政策 V1.2 + PrivacyGate V2 | ✅ privacy.txt「四、信息加工与个性化推荐」5 条完整；privacy_agreed_v2 新键；PrivacyGate/PrivacyPolicyActivity |
| ④ 去标识三闸 | ✅ PersonalizationGate.viewOf（①consentPassed ②personalizationEnabled）+ allowed（③blocked ④sensitivity ⑤stale）；uploadPayload 结构化无原文无 id |
| ⑤ 设置开关 | ✅ Vue SettingsPage「个性化推荐」行 + native PersonalizationEngine 联动 |

## 二、L1 复核（独立复跑）

- 全量 :app:testDebugUnitTest = 66 套件 **468/0/0**（跳 1）——与报告一致
- 新增：MemoryPreferenceExtractorTest 11/0 · PersonalizationGateTest 6/0 · PrivacyPolicyContractTest 2/0 · PrivacyConsentTest 11/0
- 变异亲杀：**①去开关闸 → 「关闭个性化 - 视图为空且上传载荷空组」FAILED**；**②敏感放行 → 「敏感标签不传」FAILED**（2/2）

## 三、L2 模拟器复验（emulator-5554，独立干净态）

| 场景 | 结果 |
|---|---|
| V1.2 弹窗触发 | ✅ pm clear 后启动 → 「个人信息保护指引 \| 查看《MOV AI 隐私政策》全文 \| 拒绝 \| 同意」（privacy_agreed_v2 未写 → 强制重弹） |
| 政策全文条款 | ✅ PrivacyPolicyActivity（webview）打开；privacy.txt「四、信息加工与个性化推荐」5 条核物（加工仅本机/去标识/敏感不碰/设置可关/不用于定向广告） |
| 设置开关联动 | ✅ 设置页「个性化推荐 开启」→ 点 → 「关闭」→ 再点 → 「开启」（回显双向） |
| pref.json 密文 | ✅ ENC: 密文落盘，开关开/关/开 三次切换 hash 均变化（b682…→2f60…→0b68…，固定 228B） |
| 同意→MainActivity→加工链 | ⚠️ 本次 pm clear 后同意落到「登录页」（未登录态→需验证码，环境相关）；「同意→MainActivity UPG51: refresh entries=0 derived=0」+真机「derived=1（深色主题→喜欢深色）」程序员证据已核 |

程序员证据 3 图（模拟器_l2_个性化关闭 / 真机_l2_V1.2协议弹窗 / 真机_l2_设置行开启）已核存 ✅

## 四、申报差异确认

- 上传面无远端服务 → 仅 uploadPayload 契约面，三闸可测：✅ 与实现相符
- 生肖按公历近似（非农历）：代码 zodiacOf(month, day) 合理降级——非阻塞观察项
- 敏感「不提炼不传」最简合规：✅ 与隐私政策「三、敏感信息」一致

## 五、结论

**通过**（P3 观察：生肖公历近似为申报的已知简版；同意链在未登录态需验证码属环境路径，非交付缺陷）
