# UPG-53 安全体验优化改造 —— 审验员模拟器复验记录（2026-08-31）

验收对象：feat/upg53 = a665349（基底 ff23a88）
测试构建：assembleDebug @04:30（55,463,442B，与验收现场构建一致）装 emulator-5554
**约束：用户指令「直接开虚拟机审验，不要动真机」——全程未动真机 21770d7d**

## 一、L1 独立复跑（权威重跑）

- 全量 `:app:testDebugUnitTest --rerun-tasks` = **66 套件 473/0/0，skipped=1**（SceneLiveQueryTest 类级 @Ignore 真网络测试）
- 与验收报告吻合（差异：验收报 0 跳过，实测 1 个 @Ignore skip = P3 口径备注）
- 注：build test-results 曾含变异亲杀 M-V3 残留 XML（04:29 FAILED），已重跑生成权威结果

## 二、变异亲杀 3/3（先前独立复跑，md5 校验还原零残留）

| 变异 | 注入 | 结果 |
|---|---|---|
| M-V7 | canRemember 恒 true（gate 可记） | 「gate级永不豁免 canRemember拦截」FAILED |
| M-V4a | cred 删除也进 tombstone | 「凭据删除立即生效无撤销窗口 安全吊销不缓冲」FAILED |
| M-V3 | REJECT → OUTCOME_ALLOWED_ONCE（拒绝静默放行） | 「拒绝后权限面与名单零变化」FAILED |

还原后 md5：ApprovalService=4d9a22…、ApprovalRemember=847d15…（与原始一致）

## 三、L2 模拟器复验（emulator-5554，全程未动真机）

### 1. MCP 直调 ASK 触发（场景②）
- `vault.delete` MCP 直调 → `[code: APPROVAL_REQUIRED] 默认权限：vault.delete 超出安全范围，请求允许（requestId=req-N）`（guard ASK 拦截）
- journal approval/asked ×3（req-1/2/3 审计落 session.jsonl）
- 证据：boot_01/02.png、drawer.png

### 2. 拒绝语义（pending 未批准 = 不执行）
- vault.delete 触发 APPROVAL_REQUIRED 后未批准 → `vault.list` 确认 cred.WeChat/mobile 仍在

### 3. 弹窗全要素实测（vault.get 触发 approvalService.request → answerer 弹窗）
- MCP 直调 `vault.get keys=[cred.WeChat]` → handler 内 `approvalService.request`（MainActivity:3561）→ answerer 弹窗
- uiautomator dump 实证弹窗全要素：🔒 图标 / 「AI 想帮你执行一次操作」大白话 / 参数脱敏「keys=[平台账****」/ 倒计时「N 后 AI 会自动取消这次操作」/ 同意·拒绝 / 双复选（□这次对话里同类操作都直接同意 + □记住此偏好以后这类操作不再询问）
- 证据：upg53_dialog_get.png（同意路径）、upg53_dialog_remember.png（勾记住偏好路径）、E2_ask_vault_delete.png、E2_ask_remember_checked.png

### 4. 同意 → allowed-once → 明文返回
- 点「同意」→ vault.get 返回 `{ok=true, values={cred.WeChat=账号：test 密码：secret123}}`（allowed-once 放行解密）
- session.jsonl seq6/7：approval/asked appr-N → decided allowed-once

### 5. 记住偏好 → allowed-remembered 豁免（场景7 闭环）
- 勾选「记住此偏好」+ 同意 → `mov_security.xml` `<set name="remembered_tools"><string>vault.get</string></set>` 落盘
- 再次 vault.get → journal seq10/11：approval/asked「已记住同类偏好」→ decided **allowed-remembered**（免弹豁免命中）

### 6. 设置页安全状态（场景⑥）
- 设置页「安全状态：已加密保护 · 一切正常」
- 证据：probe_settings.png、settings_01.png

### 7. 模式切换（journal approval/policy）
- 设置页审批模式行 ask↔open 双向切换 → journal approval/policy 落盘（seq3 never / seq4 ask）+ 还原 ask 持久化
- session.jsonl 尾部确认 seq4=ask（当前模式已还原）

### 8. 铁律1：permission.approve/deny 不暴露远程
- MCP 直调 permission.approve → `TOOL_NOT_FOUND`（uiOnlyMcpTools 排除，防 AI 远程自批绕过用户）

### 9. 卡外 P1 实证：vault.set/credSet 免审批写入
- `vault.set mobile` → `{ok=true, preview=138**8000}`（直接落盘）
- `vault.credSet WeChat` → `{ok=true, preview=t**}`（直接落盘）
- 均无 approval 事件（免审批写入，与挂账 P1 一致）

## 四、审验新发现（已登问题区，P1 挂账建议，不阻塞通过）

**vault.get 明文读取 handler 只认 allowed-once（MainActivity:3568），记住/turn/goal 豁免命中 allowed-remembered 后 handler 判 ≠allowed-once → 「用户拒绝」——记住偏好对 vault.get 伪放行**：
- 用户勾选「记住此偏好，以后这类操作不再询问」→ 下次 vault.get 审计 allowed-remembered（免弹）但业务返回 `{ok=false, error=用户拒绝}`
- 与弹窗承诺矛盾（审计免弹但实际拒绝）、审计与行为不一致
- 安全方向正确（明文未泄露，handler fail-closed）
- 同类受影响（代码推断）：turn 豁免/goal 豁免对 vault.get；browser 支付/登录审批（browser.click/fillForm/login 只认 allowed-once）
- 根因：handler 层强制「每弹 only-allowed-once」的工具，UI 层豁免勾选（turn/goal/记住）未按此禁用

## 五、环境说明

- 模拟器未配 DeepSeek API Key → AI 对话发送失败（「发送失败：还没有设置 DeepSeek API Key」）——UI 对话路径不可用，弹窗改经 vault.get MCP 直调（handler 内 request）触发，已验证弹窗全要素
- 非产品缺陷（真机已配 key，验收弹窗实证在档）
