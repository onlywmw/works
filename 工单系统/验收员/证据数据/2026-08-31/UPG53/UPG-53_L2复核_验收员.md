# UPG-53 安全体验优化改造 —— 验收员复核记录（2026-08-31）

验收对象：feat/upg53 = **a665349**（3 commit d434ab1→9a37b32→a665349；基底 ff23a88；main 已前进 16baca3 待 rebase）
测试构建：**现场 assembleDebug @03:44**（55,463,442B）安装 21770d7d——符合「测试用最新版本」纪律

## 一、代码核物（八场景）

| 场景 | 核物结果 |
|---|---|
| 1 零打扰 | ✅ ApprovalExperienceTest「free级恒放行不进审批链」 |
| 2 一次秒懂 | ✅ writeTools 补入 `vault.delete`/`vault.credDelete`（缺口闭合注释在案）；harmless 补 `vault.restore`（凭据删除不支持撤销）；`toolsRequiringConfirmation()` 只读名字集（不构成第二判定源铁律注释） |
| 3 拒绝不降级 | ✅ 「拒绝后权限面与名单零变化」测试（tier 不变/名单不缩/handler 在/重请仍 ASK） |
| 4 5s 可撤 | ✅ InfoVault Tombstone+undoWindowMs=5_000+可注入 clock；cred.* 立即真删无撤销（「安全吊销不缓冲」）；vault.restore harmless（凭据不可 restore） |
| 5 异常人话 | ✅ 加密失败文案（ApprovalExperienceTest 覆盖） |
| 6 状态一屏 | ✅ 设置页「安全状态：已加密保护 · 一切正常」真机在场（zh/en+sync-pages） |
| 7 越用越顺 | ✅ ApprovalRemember 纯函数（canRemember 拦 gate/normalize `_`↔`.`/MAX 100 超限清空）+prefs mov_security+rememberedCheck 注入（volatile 可空）+豁免链 turn→goal→remembered+OUTCOME_ALLOWED_REMEMBERED+弹窗双复选 |
| 8 毫秒级 | ✅ 「万次判定 <500ms」锚 |

## 二、L1（独立复跑）

- 全量 :app:testDebugUnitTest = **66 套件 473/0/0**（--rerun-tasks；程序员报 473/0/1 的 1=跳过，我跑 0 跳过）
- 新增 ApprovalExperienceTest 8+Surface 1+InfoVaultTest 32（含 V4a 配对锚）/PermissionGuardTest 11

## 三、变异抽杀 3/3（V3/V4a/V7 全红）

| 变异 | 注入 | 结果 |
|---|---|---|
| M-V7 | canRemember 恒 true（gate 可记） | ✅ 「gate级永不豁免 canRemember拦截」FAILED |
| M-V4a | cred 删除也进 tombstone | ✅ 「UPG53 凭据删除立即生效无撤销窗口 安全吊销不缓冲」FAILED |
| M-V3 | REJECT → OUTCOME_ALLOWED_ONCE（拒绝静默放行） | ✅ 「拒绝后权限面与名单零变化」FAILED |

## 四、L2 真机（21770d7d）

1. **场景② ASK 触发**：vault.delete → journal `approval/asked toolName=vault.delete reason=默认权限：vault.delete 超出安全范围，请求允许`（×4 实证）✅
2. **弹窗大白话全要素**：🔒 图标+「AI 想帮你删除一个保险柜条目」+「参数：key=cred****」（脱敏）+28s 倒计时+同意/拒绝+双复选（turn+**记住此偏好**）✅
3. **同意→执行**：allowed-once → cred.WeChat.enc 删除（permanent=true）✅
4. **记住复选勾选**：tap □ → ☑ UI 实证 ✅（allowed-remembered 免弹闭环：JVM 锚全绿；真机 tap 时序未走完=P3 观察与程序员申报一致）
5. **30s 自动取消 fail-closed**：cancelled ×4（无人操作时）✅
6. **场景⑥**：设置页「已加密保护 · 一切正常」✅
7. **模式切换**：设置页审批模式行 → toast「已切换为 ask（每次确认）」→ journal `approval/policy ask`（seq 13266）✅

**环境发现（非本单缺陷，已处置）**：
- 程序员测试遗留 `never` 模式未还原（journal seq 11828）→ 重启被 approval/policy 恢复机制还原为 open → 我首轮 vault.delete 走 FULL_ACCESS 直删（**open 模式语义=除底线+高危全放行，设计如此**）→ 经设置页切回 ask 并已持久化
- **P2 观察建议**：open 模式下 writeTools 全集失效（含凭据删除）——建议评估 vault.delete/credDelete 收入 isHighRisk（open 模式仍 ASK）
- P3：pending 弹窗的 decided 事件落盘可见性延迟（write-behind）

## 五、卡外三项确认（程序员已登处理中心）

1. P1 dispatch 白名单缺 allowed-goal ✅ 确认（豁免链调度侧缺口）
2. P1 vault.set/credSet 免审批写入 ✅ **本次 L2 再度实证**（ask 模式下 setCred 直接落盘）
3. P2 turn 豁免 blast radius ✅ 保留观察

## 六、结论

**通过**。演示数据已还原（fields 空）；审批模式已还原 ask 并持久化。待设计师 rebase 16baca3 合 main。
