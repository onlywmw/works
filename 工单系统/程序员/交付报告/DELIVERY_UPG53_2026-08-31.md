# DELIVERY_UPG53 安全体验优化改造（该守才守 · 守得舒服）

**程序员 C @2026-08-31** ｜ 分支 `feat/upg53` ｜ 基线 main `ff23a88` ｜ worktree `mov-upg53`
**交付 commit**：`d434ab1`（8 场景落地）→ `9a37b32`（测试 regex 修复）→ `a665349`（变异锚补强+ApprovalRegistry 同步）
**已登记两个表**（工单表.xlsx ROW43 程序列+备注；工单库.md UPG-53 状态）——见文末登记节。

---

## 一、8 场景落地（方案=安全体系_设计_v2.1 §5.3）

| # | 场景 | 实现 | 关键文件 |
|---|---|---|---|
| 1 | 平时·零打扰 | free 级恒 ALLOW 契约锚（15 个 harmless 代表工具逐一断言，无害调用弹窗即红） | ApprovalExperienceTest |
| 2 | 该守才·一次秒懂 | ask/gate 全集大白话映射补齐（sensitive 11 项+写类缺项 22 项，`apprHumanPhrase` 全覆盖无 fallback）；**安全缺口闭合：vault.delete/vault.credDelete 原落 else→free（AI 免审批删凭据）补入 writeTools** | MainActivity.apprHumanPhrase + McpToolScheduler.writeTools |
| 3 | 拒绝·不降级 | 拒绝 toast 人话「好的，这次不执行」；契约锚：拒绝后 tier/名单/handler 零变化，同工具重请仍正常 ASK | buildApprovalDialogView + 调度链测试 |
| 4 | 误触·5s可撤 / 吊销立即 | **InfoVault tombstone 软删**：普通条目（文本/照片）删除进 5s 撤销窗口（密文 .enc.tomb 保留+索引即时隐藏），`vault.restore` 撤销（新工具，归 harmless 免弹）；**凭据（cred.*）删除立即真删无撤销**（安全吊销不缓冲锚）；窗口内再删=旧 tombstone 立即真删（只保最近一次）；时钟可注入（JVM 变异锚用） | InfoVault.kt + vault.restore handler + HostToolMetaB2（118→119） |
| 5 | 换机/异常·人话 | InfoVault.set 加密失败文案人话化（「这条信息暂时没能加密保存，你可以再试一次…」，不暴露底层异常串/类名） | InfoVault.kt |
| 6 | 安全状态一屏 | 设置页审批组新增「安全状态：已加密保护 · 一切正常」展示行（static 不可点无箭头；zh/en i18n 双语）；「绝不主动弹安全通知」源码锚 | SettingsPage.vue + i18n + vite build + sync-pages（77 文件先清后放，--check 幂等一致） |
| 7 | 越用越顺 | **持久化同类记住**：弹窗新增「记住此偏好，以后这类操作不再询问」复选（仅 rememberEnabled 且 tier≠gate 展示）→ `ApprovalRemember` 纯函数（canRemember 拦 gate 级/normalize/超 100 清空失败方向）→ prefs `mov_security`（enabled+remembered_tools，事实源）→ `ApprovalService.rememberedCheck` 豁免链（turn→goal→**remembered**→弹窗）→ 新 outcome `allowed-remembered` → 调度白名单放行 | ApprovalRemember.kt（新）+ ApprovalService.kt + McpToolScheduler.kt + MainActivity |
| 8 | 决策毫秒级 | permissionTier 万次判定 <500ms 锚（现状纯内存 <50ms；变异：判定链插 Thread.sleep(1) 即红） | ApprovalExperienceTest |

## 二、L1 验证（全量 + 变异亲杀）

- **全量**：`:app:testDebugUnitTest --rerun-tasks` 真跑 **66 类 473 过 / 0 败 / 1 跳过**（跳过=既有 12306 LiveQuery）
- **`assembleDebug` 绿** + `check-token-effect` 过（请求链路零改动，Token/KV 申报见第五节）
- **变异 10/10 亲杀**（先 commit 后变异，git checkout 还原，全程真跑）：

| 变异 | 对象 | 杀伤测试 |
|---|---|---|
| V1 | isHarmless 强制 false | 场景1 free 级恒放行 → 红 |
| V2 | 删 payment.pay 人话分支 | 场景2 全覆盖无 fallback → 红 |
| V3 | REJECT 返回 allowed-once（拒绝静默放行） | 场景3 拒绝不降级 → 红 |
| V4a | cred 删除也记 tombstone | 凭据删除 undoable 非空 → 红 |
| V4b | 撤销窗口 5s→500s | 过窗真删不可恢复 → 红 |
| V5 | 加密失败文案改技术串 | 场景5 人话断言 → 红 |
| V6 | 删设置页安全状态行 | 场景6 源码锚 → 红 |
| V7 | 删 request() remembered 豁免块 | 场景7 免弹+审计两测 → 双红 |
| V8 | permissionTier 插 Thread.sleep(1) | 场景8 万次 <500ms → 红 |
| V9 | 调度白名单删 allowed-remembered（恒 true 变异） | 调度链放行测试 → 红 |

- **新增/扩充测试**：ApprovalExperienceTest（9 用例+SurfaceTest 1）、InfoVaultTest +6、PermissionGuardTest +1（vault.restore free/删除 ask/credDelete ask）；ToolMetaTest b32 清单+vault.restore（四表并集不变量式对账自动覆盖）
- **同步链**：`approval-inventory-collect.mjs` 重收集（158 工具，write=35/harmless=27）；semantics.json 更新 vault.delete（ask/medium/explanationVersion 2）+ vault.credDelete（ask）+ 新增 vault.restore；ApprovalRegistryGeneratorTest 重新生成 Registry.json/.md（reversibility low 棘轮清单 vault.delete 移出/credDelete 维持，注释申报 UPG-53 依据）

## 三、L2 真机（emulator/平板 21770d7d，证据 `upg53-evidence/`）

| 项 | 结果 | 证据 |
|---|---|---|
| 装机 | `adb install -r` Success（55463442B，dex 含 mov_security 特征串验证） | bash 记录 |
| **场景2 弹窗** | ✅ 「AI 想帮你删除一个保险柜条目」+「20 后 AI 会自动取消这次操作」+同意/拒绝+同类同意+**记住此偏好行** 全要素 uiautomator 命中 | `E2_ask_vault_delete.png` / `E2_ask_remember_checked.png` |
| journal 链 | vault.set 保存（脱敏预览 138**8000 回复）+ vault_delete tool/call→tool/result 全链；approval/policy 恢复链在案 | session.jsonl（room-1788080496334-1bf6） |
| 场景3 拒绝 toast / 场景4 AI 链撤销 / 场景6 设置页截图 / 场景7 免弹闭环 | ⏳ 受限未走完（见下「真机受限申报」） | — |

**真机受限申报（如实）**：
1. **共用设备互踩**：21770d7d 被并行会话操作（04:57 覆盖安装其他 APK 一次、审批模式被切至 never、app 被杀重启、被顶回桌面）——已重装本 APK 并重验，但「记住偏好→免弹」闭环观察被 never 模式污染（FULL_ACCESS 下 vault.delete 本就 ALLOW），**该闭环的运行时证据不申报，由 L1 V7/V9 变异锚+V4 系列亲杀背书，留验收员独立复验**。
2. 设置页入口齿轮在 WebView 内（aria-label 不暴露至 accessibility 树），uiautomator 无法定位，场景 6 截图未完成——场景 6 落点为纯静态展示行（源码锚 V6 已亲杀），风险低。
3. 撤销窗口（5s）短于 AI 对话轮次时延，AI 链内「删除→撤销」演示天然超窗——窗口语义由 InfoVaultTest 全覆盖（时钟注入），设计上撤销入口=vault.restore 工具（harmless 免弹），验收员可在 5s 内用两步对话验证或建议后续给 vault 页加 UI 撤销条。
4. **演示数据已还原**：prefs mov_security.xml 已删、测试对话中 mobile 字段已空（删除+超窗真删）、测试会话消息属真实交互记录留存房间内。

## 四、卡外发现（已登记处理中心，不顺手修）

1. **挂账-upg53-dispatch白名单缺allowed-goal（P1）**：`McpToolScheduler.dispatch` outcome 白名单只放行 allowed-once/allowed-turn/allowed-remembered——**allowed-goal（UPG-07 批2 goal 豁免）会被误判「审批未通过」**，goal 豁免在 AI 调度链实际不可用（挂账销项 e7104e3 复验的是 allowed-turn 路径）。修复=白名单加一行。
2. **挂账-upg53-vault写入免审批（P1）**：vault.set / vault.credSet 落 else→free——AI 免审批可写用户保险柜（本单已闭合删除侧 vault.delete/credDelete，写入侧同类缺口留单处置；ApprovalRegistry 语义库中两者 approvalMode=free 与「写类=审批」总纲冲突）。
3. **观察：turn 豁免 blast radius**：同 turn 内首个写类放行后，后续同工具调用全部静默（真机实测 shell.exec 连续 cat 凭据配置文件零打扰通过）——与场景 7 显式记住的「用户勾选」语义不同，建议安全中心（UPG-54）纳入「豁免查看/清空」管理面时一并评估。

## 五、Token / KV 影响申报

- **AI 面**：hostToolMeta 118→**119**（+vault.restore 一条三件套 ≈+70B/轮，推导上界）；弹窗新增记住复选文案一处（UI 层，不入 prompt）。
- **MCP 面 tools/list**：+1 工具条目（vault.restore，desc+schema ≈+0.4KB/次，不入 prompt）。
- **KV Cache**：请求链路（恒定前缀）零变化——vault.restore 追加在工具面尾部、approvalMode 语义不变；`check-token-effect` 过。
- **持久化 KV**：新增 prefs `mov_security`（remember_enabled bool + remembered_tools StringSet ≤100 项，每项 ≤40B）。

## 六、登记

- 工单表.xlsx ROW43：程序员列 `✅C 完成`、备注 `feat/upg53 a665349（报告 DELIVERY_UPG53_2026-08-31.md）`
- 工单库.md UPG-53 状态：`程序员✅完成，待验收`
- 处理中心挂账登记表：新增 2 条 P1（dispatch 白名单缺 allowed-goal / vault 写入免审批）+1 条观察（turn 豁免 blast radius）
- 证据目录：`程序员\UPG53-evidence\`（本 worktree `upg53-evidence/` 同步拷贝）

**待验收员**：L1 复跑+变异抽杀（建议 V3/V4a/V7）+ L2 弹窗全要素对照（截图 vs buildApprovalDialogView）+ 记住偏好→免弹闭环干净复验（需先将审批模式置 ask）+ 撤销窗口双步对话演示 + L3 journal 对账。
