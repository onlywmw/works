# DELIVERY_UPG51_协议授权记忆加工个性化推荐

- **工单**：UPG-51（2026-08-31 重构·淘宝式指定）
- **分支**：`feat/upg51`（worktree=mov-upg51，基线 0aa0c07）
- **提交**：单 commit（功能+测试+资产+协议，见文末 git log）
- **状态**：✅C 交付 @2026-08-31 —— 待验收员 L2 复核

---

## 一、交付范围（按重构派单五条）

1. **撤独立画像功能**：无 ProfileSheet / ProfileDims 词表枚举 / 设置页「用户画像」入口 / ui.openProfile —— 全量源码 grep「用户画像」仅剩基线 UPG-05 记忆基因注入旧注释（非本单新增、无可见入口）；L1① 自查通过。
2. **记忆加工标签（本地、无感）**：`MemoryPreferenceExtractor`（纯函数）从 Memory API 条目（content+status）提炼：
   - 星座/生肖：生日推算（`YYYY年M月D日` / `M月D日` / 中文「八月十八」组合解析）；IDENTITY 恒久
   - 饮食/消费/偏好：关键词归纳（辣/清淡/控糖/性价比/品质/简洁/深色主题…）；PREFERENCE 180 天 staleAt
   - 敏感条目（宗教/政治/性取向/健康/心理疾病等关键词）**整条跳过**，不参与任何维度提炼
   - 无感=MainActivity onCreate 每次启动自动 refresh；不弹「确认画像」、无 UI
3. **UPG-11 协议补条**：`privacy.txt` V1.1→V1.2（更新日期 2026-08-31）新增「四、信息加工与个性化推荐」（加工说明/去标识传输/敏感不碰/用户权利可关/边界：不用于定向广告）；原文章节编号连锁后移；`PrivacyGate` 新增 `KEY_AGREED_V2`（V1.2 强制重弹）+ GateActivity/MainActivity 防御/WebViewWarmup 全线改读 V2。
4. **个性化推荐（去标识）**：`PersonalizationGate` 三闸——协议授权 ∧ 个性化开关 ∧ 去标识（`PrefTagView` 类型仅 dimension/value/confidence/timeVarying，**无 content/原文字段**；上传载荷 uploadPayload 同构）；SENSITIVE/FORBIDDEN 不传；blocked 不复活；stale 过期不入。
5. **可关个性化开关**：设置页「个性化推荐」行（我的记忆下方；点击切换，回显 开启/关闭；toast 反馈；i18n zh/en）；`personalization.status/setEnabled/refresh/recommend` 四个 handler（PagesBridge 白名单补 `personalization.`）；关闭=Gate ② 闸 → 推荐/上传立即停。

## 二、工程实现

| 文件 | 说明 |
|---|---|
| `personalization/PrefTag.kt` | 标签+池状态（内部数据结构，无可见面） |
| `personalization/PrefStore.kt` | files/pref.json AES-GCM 加密（复用 VaultKeystoreCrypto 方案；损坏/换机→空池不崩） |
| `personalization/MemoryPreferenceExtractor.kt` | 提炼器（生日→星座/生肖；关键词→饮食/消费/偏好；敏感整条跳过） |
| `personalization/PersonalizationGate.kt` | 三闸（授权/开关/去标识+敏感+blocked+stale） |
| `personalization/PersonalizationEngine.kt` | 编排（refresh 幂等合并、激活、开关、closeTag、推荐面/上传面/分组） |
| `MainActivity.kt` | init+同意激活+每次启动 refresh；4 个 handler；`personalizationEntries()` 条目投影 |
| `PrivacyGate.kt` / `PrivacyGateActivity.kt` / `WebViewWarmup.kt` | V2 键（协议升级强制重弹；纵深防御同口径） |
| `SettingsSheet.kt` | 桥白名单 + personalization. |
| `SettingsPage.vue` + i18n zh/en | 设置行+切换+回显 |
| `privacy/privacy.txt` | V1.2 条款（新版合约） |

## 三、证据

### 测试
- **全量 468 用例 0 失败**（含新增：提炼器 11 + 闸/存储 9 + 隐私政策契约 2 + 基线 PrivacyConsentTest 等）
- **变异亲杀 4/4**（对应 L1②③④⑤）：
  - M1 视图多加 content 字段 → 「推荐视图只含结构化字段」红
  - M2 删「可关开关」闸 → 「关闭个性化 - 视图为空且上传载荷空组」红
  - M3 删敏感过滤 → 「敏感标签不传」红
  - M4 删 privacy.txt 条款 → 「隐私政策含个性化加工条款」红
- L1①：源码自查无「用户画像」入口/ProfileSheet（grep 全量；基线旧注释除外）

### 真机 L2（21770d7d）
1. V1.2 协议弹窗（v2 键触发重弹）——截图 `真机_l2_V1.2协议弹窗.png`
2. 同意 → 进入 MainActivity
3. logcat：`UPG51: refresh 加工完成: entries=2 derived=1 pool=1`（「用户喜欢深色主题」→ 喜欢深色 标签）
4. 设置页「个性化推荐 开启」行显示——截图 `真机_l2_设置行开启.png`

### 模拟器 L2（emulator-5554，设计师占用真机后补验）
1. V1.2 协议弹窗 ✓（same build）
2. 同意 → Main ✓；`UPG51: refresh entries=0 derived=0`（无记忆条目，链正常）
3. 设置页「个性化推荐 开启」→ **点击 →「关闭」** → **再点 →「开启」**（UI 回显闭环）——截图 `模拟器_l2_个性化关闭.png`
4. 数据面：pref.json 密文落盘（mtime 随切换更新）

## 四、申报差异

- **上传面无远端服务**：P0 本阶段无外部推荐/人群服务；「上传」以 `uploadPayload` 契约面实现（结构化、三闸），L3 链路说明在报告，真实上传由未来服务接入（保持同一闸面）。
- **生肖推算为公历近似**（元旦为界，非农历）——P0 口径已在代码注释明示；如需农历精度列为 P1。
- **敏感维度 P0 为「不提炼不传」**（卡上允许「不传 OR 单独同意」，取最简合规路径）。

## 五、验收建议口径

- L1① 查「用户画像」入口：本单无新增；基线 UPG-05 基因注入注释除外（旧功能，非本单）
- L1② 上传含 content：检查 `PrefTagView`/`uploadPayload`（类型无该字段）
- L1③ 关闭仍上传：`PersonalizationGate.viewOf` ② 闸（变异 M2 已锁）
- L1④ 敏感上传：`allowed() sensitivity != NORMAL`（变异 M3 已锁）
- L1⑤ 政策条款：`PrivacyPolicyContractTest`（变异 M4 已锁）
- L2 真机：同意→个性化正常；设置关→推荐停+不再上传；全程无「用户画像」名词；隐私设置可查（政策页）/可关（开关）

## 六、git

```
feat/upg51（push origin）
- commit：feat(upg51): 协议授权下记忆加工 + 个性化推荐——撤可见画像，去标识三闸（L1 变异 4/4）
```
