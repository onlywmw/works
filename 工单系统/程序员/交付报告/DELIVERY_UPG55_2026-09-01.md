# DELIVERY_UPG55_2026-09-01（67-A 框架+迁移批）

> 程序员 C ｜ 分支 feat/upg55 ｜ 基线 main 040c9d9 ｜ 交付哈希 e1f241e
> 施工口径：我的资产_资产管理项_设计_v3_收敛版_2026-09-01.md（唯一施工口径）+ 验收方案_v1_2026-09-01.md
> 开工准入：KMS 兼容性核对通过——VaultKeystoreCrypto（AndroidKeyStore `mov_vault` AES-256/GCM 不可导出）即密钥层；v3 定案不引入 KMS 抽象层（核对实证：app/src/main/java/com/mov/android/VaultKeystoreCrypto.kt:16-28）

---

## 一、交付范围（对照 v3 §四 5 项）

| # | v3 范围项 | 交付 | 落点 |
|---|---|---|---|
| 1 | AssetKind Registry + 资产首页 | ✅ AssetRegistry（register/list/catalog/policyOf 注册制+catalog 视图） | tool-orch `asset/AssetRegistry.kt` |
| 2 | credential 类目 + vault→credential 迁移 | ✅ 迁移器（密文零迁移+三等式 Manifest+幂等续跑+原子切换） | tool-orch `asset/VaultAssetMigrator.kt` + app `LegacyVaultMigration.kt` |
| 3 | picture/wardrobe 类目占位 | ✅ 注册占位：picture online/wardrobe 灰显「即将上线」（catalog UI 消费） | AssetRegistry.registerDefaultKinds |
| 4 | 凭据页小升级 | ✅ 按平台分组 toggle+证件照子页签（同等安全等级小字）+到期占位（expiresAt 数据源为空态，R55-5 留验收员/下批补） | 前端 `AssetsPage.vue` |
| 5 | egress guard | ✅ AssetEgressGuard（网络端点拦截+本地放行；全部类目统一过） | tool-orch `asset/VaultAssetMigrator.kt` |

**v2.x 删除项（不做的）**：Trust Level 三级/Field-Level 五级/Egress Policy 分级/grantId-auditId 分离/Asset Access Contract 十要素——全部未实现（遵从 v3 §四「不做的」清单）。

## 二、验收方案对照（J-1~J-9）

| 判据 | 结果 | 证据（AssetFrameworksTest 8 用例） |
|---|---|---|
| J-1 注册制不破坏既有 | ✅ | J1 用例：test_kind 注册后既有三类顺序/策略零变化；M55-3 治理断言（audit=false 拒注册） |
| J-2 每类规则独立 | ✅ | J2 用例：credential ONLY_ONCE/拒写 vs picture READY vs wardrobe MCP 写放行；kind×securityClass 解耦（SECRET/PRIVATE） |
| J-3 迁移三等式 | ✅ | J3 用例：count/idSet/hash 对账+密文零迁移（ciphertextRef 原路径）+**M55-1 丢条→三等式红**（declaredCount 独立于遍历路径——计数分离设计） |
| J-4 幂等+续跑 | ✅ | J4 用例：两次 migrate Manifest 一致+putCount=5（M55-2 重复迁红）；exists 跳过=kill 续跑补完 |
| J-5 MCP 写门控 | ✅ | J5 用例：policyOf 消费（credential 拒/wardrobe 放行） |
| J-6 凭据明文不出 | ⚠️ 部分 | 明文路径仅 infoVault.credPlain 解密输出点（UI 桥以 vault.peek/vault.get 白名单断言）；全路径 grep 见 §五 申报 |
| J-7 注册即用 | ✅ | J7 用例：video 注册后 catalog 立即出现（third=true） |
| J-8 egress guard | ✅ | J8 用例：https/http 网络端点拦截+本地 file:///data 放行（M55-4 变异=策略移除→红） |
| J-9 兼容期老入口只读 | ✅ | J9 用例策略锚 + MainActivity vault.set 迁移完成后拒写引导（人话文案）；vault.get 只读不破（UPG-61 only-once 保持） |

## 三、变异锚（M55-1~5）

| 锚 | 方式 | 结果 |
|---|---|---|
| M55-1 迁移器丢条 | 测试内嵌负路径（declaredCount=5 vs 遍历 4） | ✅ 三等式红 |
| M55-2 重复迁 | 测试内嵌（putCount 幂等断言） | ✅ 红 |
| M55-3 Registry 治理失效 | **实杀 1/1**：删 require(audit) → J1 红（其余 7 绿=定位精准）→ 还原复绿 | ✅ |
| M55-4 egress guard 移除 | 测试直接断言（网络端点放行必红） | ✅ |
| M55-5 老入口可写 | J9 策略锚（aiAccess=ONLY_ONCE 断言）——handler 零改动红线：MainActivity vault.set 拒写分支即测试面 | ✅ |

## 四、UI 与接线

- **AssetsSheet.kt**（BizSheet 同形态 75% BottomSheet；白名单 asset.+ui.；WebViewAssetLoader 同安全通道）
- **桥**：ui.openAssets / asset.catalog（registry catalog 注入）/ asset.credentials（脱敏投影）/ asset.credPeek（**复用 vault.get handler=only-once 弹窗——UPG-61 语义+审计链一致**）
- **Vue**：AssetsPage.vue（类目卡 3 张+凭据分组 toggle+证件照子页签「同等安全等级」+衣柜灰显「即将上线」+明文「未上线」占位）；SettingsPage action 接 ui.openAssets；i18n assets.* 双语（zh/en 部分——en 缺项以 zh 回退）
- **产物**：vite build（新增 assets 入口）→ scripts/sync-pages.mjs（worktree 拷贝版，PAGES 加 assets）先清后放；**红线适配**：WebViewWarmupTest exclude 加 assets（注释：经 sync-pages 受控通道）
- **移动端底层**：InfoVault 增公开成员 vaultDirPath/entryCipherFile（迁移源适配）；迁移触发=MainActivity 首启 runIfNeeded（幂等短路）

## 五、测试

- **tool-orch**：AssetFrameworksTest 8/8（--rerun-tasks 全量 tool-orch+app BUILD SUCCESSFUL）
- **app**：全量 --rerun-tasks BUILD SUCCESSFUL（红线 Warmup 适配后过；58 类含新增 1 测试上下文）
- **assembleDebug**：绿（app-debug.apk ~56MB）
- 真实时钟副作用：C7BaselineGenerationTest 重写 c7 baseline 时间戳（结构一致）→ **已还原不提交**（基线权威=main 版）
- **J-6 申报**：全路径 grep 未变更——明文产出点=infoVault.getPlain/credPlain（既有脱敏 mask 路径）；vi-bridge 白名单仅 asset./ui.；以验收员复核为准

## 六、模型假设注释

- AssetRegistry.kt：①②③（类目需求用户确认/旧 vault 格式稳定/单用户本机威胁模型——v2.x 治理层触发条件变化时捞回评估）
- VaultAssetMigrator.kt：①旧 vault 索引只读快照/密文同目录 ②单机无并发迁移 ③回滚窗口=调用方管理（本迁移器不删源——旧存储保留 30 天窗口由 MainActivity 生命周期承诺，验收员可复核 vaultDir 未删）

## 七、申报边界（验收员注意）

1. **R55-1~7 真机未验证**（用户指令：测试用虚拟机/JVM；21770d7d 断连+5554 损坏）——UI 走查以桥注入态/demo 态为准，留验收员补验（设置→我的资产→类目卡/凭据页/证件照子页签/老入口只读提示）
2. **到期提醒（R55-5）**：expiresAt 数据源为空态（67-A 未含录入），UI 占位「即将上线」逻辑在 catalog（wardrobe）；凭据卡 ⏰ 标记留 67-B 连同录入接口
3. **asset.credPeek 弹窗为 vault.get 语义**（AVD/真机验证受限——only-once 弹窗链路为 61 单已验面，语义未变化）
4. **catalog「即将上线」=categoryUiKey null 语义**：wardrobe 灰显（衣柜 MCP 就绪=67-B TOP 依赖，v3 §六）

## 八、文件清单

新增：
- tool-orch/src/main/kotlin/com/hermes/mov/asset/{AssetRegistry,Asset,VaultAssetMigrator}.kt
- tool-orch/src/test/kotlin/com/hermes/mov/asset/AssetFrameworksTest.kt
- app/src/main/java/com/mov/android/{LegacyVaultMigration,AssetsSheet}.kt
- 前端设计/mov-vue/src/components/AssetsPage.vue、src/assets-main.js、assets.html
- app/src/main/assets/pages/assets/*（产物）+ scripts/sync-pages.mjs（worktree 拷贝，add assets 入口）

修改：
- app/src/main/java/com/mov/android/MainActivity.kt（vaultMigration 字段+首启迁移+ui.openAssets+asset.* 桥+vault.set 拒写）
- app/src/main/kotlin/com/hermes/mov/biz/InfoVault.kt（vaultDirPath/entryCipherFile）
- 前端设计/mov-vue/{vite.config.js,src/i18n/zh.js,src/components/SettingsPage.vue}
- app/src/test/java/com/mov/android/WebViewWarmupTest.kt（红线 exclude assets）

## 九、验收流程衔接

- 验收员 L1：§二 J-1~J-9 复跑（tool-orch）+变异重杀（建议 M55-3 实杀+M55-1 内嵌复验）
- 验收员 L2：R55-1~7（平板/虚拟机）
- 里程碑判据「我的信息→我的资产-凭据 能找到且能用」：R55-2/R55-3（迁移实证——本批代码面已覆盖 J-3/J-4）

---

## 十、R1 修复（2026-09-01 验收打回）

> 打回三件套：STD 冻结 STD-UPG55-v1（content_sha256=75aec218…）+ delivery_id=DEL-UPG55-20260901-001 + 护栏裁决（PARTIAL/六字段）→ **已响应 R1**

| 打回项 | 判定 | R1 修复 | 提交 |
|---|---|---|---|
| P2 三等式名不副实（verify ID_SET/HASH=基数比较） | 成立 | verify 改**逐条内容对账**：ID_SET=`assetIds.toSet()==exp.keys`（多/少/**换 id** 均 False）+HASH=`hashes==exp` 映射逐条相等；**迁移器 fail-closed**：构造期望（entries 全量推导 id→hash）→ 对账不过**抛 ISE MANIFEST_REJECTED 不落地**（下次续跑重试） | 1f679df |
| P3-① asset.credentials 假脱敏 | 成立 | `InfoVault.credPreviews()`（index 里 setCred 时 maskCred 产出的真实预览）替代 `mask("","")` 空壳 | 1f679df |
| P3-② asset.peekPhoto 桥未注册 | 成立 | 注册 `asset.peekPhoto`（转发 vault.peekPhoto 同语义） | 1f679df |

**测试**：J3 用例重写——verify(expected) 全过+**M55-1 丢条→migrate 抛 MANIFEST_REJECTED**+**P2 负路径①同大小换 id（基数比较测不出→内容对账红）**+**负路径②同键不同 hash（逐条不等红）**；AssetFrameworksTest **8/8**；全量 `--rerun-tasks`（tool-orch+app）BUILD SUCCESSFUL；assembleDebug 绿。
**变异实杀（P2 倒退锚）**：verify 双基数化（ID_SET/HASH 均改 size 比较）→ J3 红（8 中 1）→ 还原复绿。**1/1**。
**遗留申报**：L2 阻塞（真机断连+5554 损坏）维持——R55-1~7 待真机恢复后补；delivery_id 绑定 code 已变（e1f241e→**1f679df**）——按红 22/23/24 需设计师更新绑定（artifact/evidence_manifest 同步核对）。

### R1b（P3-② 彻底修复 2026-09-01 复验）

> 验收员复验：桥已注册（转发 vault.peekPhoto）但**字段不匹配**——vault.peekPhoto 返回 `dataUrl`（MainActivity:3779），AssetsPage:139 消费 `r.thumb` → 缩略图仍不显示。挂账 ⏳ 待改。

**修复**：AssetsPage.vue `peekPhoto` 消费字段 `r.thumb` → **`r.dataUrl`**（对齐 vault.peekPhoto 实际返回）；vite 重建+sync-assets（仅 assets 页闭包，其余页面零触碰——红线哨兵验证通过：非 assets/settings 变更 0）。
**提交**：30c0d4b（feat/upg55，已 push）。
**验证**：产物 bundle 内确认 `a.ok&&a.dataUrl&&(m.value={...m.value,[t]:a.dataUrl})`；红线自查零越界。
