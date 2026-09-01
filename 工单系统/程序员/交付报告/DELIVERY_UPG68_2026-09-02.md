# 【交付报告 UPG-68】商业安全闸（W2 白名单自动闸 + 商业面 fail-open 集中收口）— 补充节补验闭环

**级别**：P0（安全） ｜ **分支**：`feat/upg68` ｜ **本次提交**：`8380108`（补充节）＋主交付 `35b0008`
**范围**：A~E 五子项 + 商业门禁项 + A7 单执行通道；补充节 V68-8（open 模式 fail-closed 不失效）+ V69-4（token 下发链单入口）
**依据**：派单 `UPG-68_商业安全闸_派单_2026-09-02.md` 补充节（安全审查判据补位）+ 设计 v3 定稿 §四 + A7 补丁

---

## 一、主交付状态（35b0008，已在 P22-R1 验收）

主交付 A~E + A7 已在验收员 `ACCEPTANCE_LOG §P22-R1` 记为 **✅ 带缺陷通过**：

| 子项 | 结果 | 实证（摘） |
|---|---|---|
| A 白名单自动闸（CT-07 机器可读化 + UNKNOWN→ASK） | ✅ | registry 单源 + schema 校验 + CI 注册即校验 |
| B biz.\* 补登记 | ✅ | task/booking/onboard 全套写类入名单（onboard 敏感级） |
| C PARTNER_AUTH_TOKEN 去硬编码 | ✅ | 迁 CredentialStore(Keystore) + 服务端下发 + partnerHttp 只接句柄 |
| D vault 全族收口 | ✅ | 补登记 + vault.get 伪放行修复（完整状态机测试） |
| E 商业凭证明文治理 | ✅ | mov_biz/mov_login 迁 Keystore |
| A7 单执行通道 | ✅ | Agent→Dispatcher→Guard→Handler；CI 静态检查禁绕行 |
| 判据 V68-1~7 / V69-1~3 | ✅ | 全量 606/0/1 亲跑一致 + 真机 ask 模式实证 + logcat 下发链实证 |

残余 LOW×3 登记在案（服务端 /v1/token 配合项转办；approval.setMode/market.localOverview 建议入硬拒；isHighRisk 大小写/URL 编码绕过收窄）——不阻塞。

---

## 二、新判据补验节（8380108 · 2026-09-02 安全审查补位）

### 1. V68-8 open 模式 fail-closed 不失效（三判据全绿）

| 判据 | 实现 | 测试锚 |
|---|---|---|
| ① open/FULL_ACCESS 下**未登记(UNKNOWN) 仍 ASK** | `McpToolScheduler.kt:192` FULL_ACCESS 分支：`isHighRisk` 前置 → `entry(name)==null` → **ASK**（不自切模式豁免登记闸，W2 洞完整版） | `PermissionGuardTest.kt:193` |
| ② isHighRisk 高危子集照旧 ASK | 凭据路径写/URL 含 credentials\|secrets 恒 ASK（shell.exec、credentials/k.txt、/data/secrets/*） | `PermissionGuardTest.kt:208` |
| ③ 模式无关性 | setMode(DEFAULT↔FULL_ACCESS) 前后 `permissionTier` 三档快照完全一致 | `PermissionGuardTest.kt:224` |

### 2. V69-4 token 下发链单入口（四判据全绿）

| 判据 | 实现 | 测试锚 |
|---|---|---|
| ① 加载唯一入口=CredentialStore | 全库扫描（kt/java/xml/json/mjs）：`PARTNER_AUTH_TOKEN` 标识符 + `rTEE` 随机 token 片段 ≥8 位**零命中**——拆串/资源/Base64/变量拼接绕行→CI 红 | `Upg68CredentialContractTest.kt:108` |
| ② 下发径直接收落 Keystore | `ensurePartnerToken` 段：`credentials.put(CRED_PARTNER_TOKEN, token)`；无 `getSharedPreferences`/prefs 明文写；日志正则无 `$token`/`+ token` 变量打印 | `Upg68CredentialContractTest.kt:125` |
| ③ partnerHttp 只收句柄 | 签名无 `token:` 参数（只接方法/path/body）；消费走 `partnerToken()` 句柄 | `Upg68CredentialContractTest.kt:141` |
| ④ 短期+轮换·无旧值重放 | `PartnerTokenRotation.kt`（纯逻辑）：`isAuthExpired=401/403`、`shouldRefresh=过期&&未重试`；`MainActivity.kt:4884 refreshPartnerToken`：过期→`credentials.remove(CRED_PARTNER_TOKEN)`（清旧防重放）→`ensurePartnerToken()`（重新下发）→重试一次（`retried=true`）；上传路径对称接入 | `Upg68CredentialContractTest.kt:152` + `PartnerTokenRotationTest.kt`（5 用例） |

### 3. 变异亲杀记录（4/4 注入→红→回滚，逐一实证）

| # | 变异操作 | 亲杀测试 | 结果 |
|---|---|---|---|
| V68-8 ① | FULL_ACCESS 分支 `entry==null→ASK` 改回 `ALLOW` | `PermissionGuardTest:193 V68-8 ①` | **红**（1 failed）→ 回滚 |
| V68-8 ② | 删除 `isHighRisk(name,args)` 高危前置 | `PermissionGuardTest:193+208` | **红**（2 failed）→ 回滚 |
| V69-4 ③ | `partnerHttp` 签名加 `token: String? = null` 参数 | `Upg68CredentialContractTest:141 V69-4 ③` | **红**（1 failed）→ 回滚 |
| V69-4 ④ | `refreshPartnerToken` 删 `credentials.remove` + `ensurePartnerToken` 两行 | `Upg68CredentialContractTest:152 V69-4 ④` | **红**（1 failed）→ 回滚 |

四条变异均被对应契约/纯逻辑测试亲杀，还原后实现恢复正确。

### 4. 全量回归

- **618/0/1**（tests/failures/skipped；618 = 主交付 606 + 补充节新增 12：V68-8×3 + V69-4×4 + PartnerTokenRotation×5）`BUILD SUCCESSFUL`
- 覆盖说明：本补充节为纯逻辑 + 契约层（JVM 可测），真机面已在 P22-R1 实证（logcat 下发链 + ask 模式 vault.get 审批卡）；open 模式 UI 端到端 / never 模式审批卡 UI 呈现仍在 P3 补验在案。

### 5. 本补充节变更清单（8380108，6 文件 +223/-4）

- `app/src/main/kotlin/com/hermes/dsh/tools/McpToolScheduler.kt`（V68-8 ①修复）
- `app/src/main/java/com/mov/android/MainActivity.kt`（V69-4 ④轮换接线）
- `app/src/main/kotlin/com/hermes/mov/biz/PartnerTokenRotation.kt`（新，轮换纯逻辑）
- `app/src/test/java/com/hermes/dsh/tools/PermissionGuardTest.kt`（V68-8 ×3）
- `app/src/test/java/com/mov/android/Upg68CredentialContractTest.kt`（V69-4 ×4）
- `app/src/test/java/com/hermes/mov/biz/PartnerTokenRotationTest.kt`（新，5 用例）

---

## 三、判定与红线遵守

- **红线**：未扩功能（无新模式/名单类型/不动 approval UI）；FULL_ACCESS isHighRisk 语义保持；UI 直调豁免未动 ✓
- **文件不相交**：补充节改动与 UI 线（feat/upg50-ph1）无冲突（同线 B 判定成立）✓
- **善后**：mov-upg68 工作区 31 个 c7_baseline 时间戳 drift（测试产物）已恢复，未混入提交 ✓
- **待办**：rebase 当前 main（11 分叉，产物冲突取 main 版）→ ff 合入——由设计师执行（合 main 只归设计师）

**交付结论**：补充节 V68-8/V69-4 判据全绿 + 变异亲杀 4/4 变红实证 + 全量 618/0/1 通过，随主交付一并达待合状态。
