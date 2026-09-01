# UPG-28 L2 相对路径 ASK 真机补验记录

- 补验日期：2026-08-30
- 设备：小米平板 6S Pro 12.4（序列号 21770d7d，型号 24018RPACC）
- APK：main 分支 debug（801b8fc，含 UPG-28 修复 443b288），包名 com.mov.android
- 修复核心：obsidian.file.write 审批闸从 contains 模糊匹配改**全名精确匹配**（McpToolScheduler.kt isHarmless:160-167）——相对路径不再落 harmless 静默放行，任意路径形态（相对/绝对/private）全 ASK
- 判据：相对路径调用 obsidian.file.write → ASK 弹窗 + journal approval 链（截图/journal 可见目标达成）

## 证据 1：MCP 直调路径（guard 拦截判定）

```
curl tools/call obsidian.file.write {"path":"notes/upg28-test.md","content":"UPG-28 相对路径补验"}
→ [code: APPROVAL_REQUIRED] 需要确认: 默认权限：obsidian.file.write 超出安全范围，请求允许（requestId=req-1，调 permission.approve 放行 / permission.deny 拒绝）
```
- **相对路径不再静默放行**（旧 bug 行为：相对路径 isMovWorkspacePath=true → harmless → 零弹窗直接写 vault）
- journal 记 `approval/asked`（seq=1，auditAsked 路径）

## 证据 2：AI 对话路径（ASK 弹窗，UI 可见）

- 指令：「Use tool obsidian.file.write relative path notes/upg28-live.md content hello」
- journal 链：`seq=71 tool/call` → `seq=72 approval/asked`
- 截图 `upg28_审批弹窗.png`：弹窗「工具调用确认」出现，参数显示**相对路径** `path: notes/upg28-live.md`
- 首次未审批：AI 回复「工具执行超时（20 秒），未能确认是否落盘成功」——ASK 拦截后等待审批直至超时，**无静默写入**

## 证据 3：审批闭环（ASK → 允许本次 → 工具真实执行）

- 第二次指令「Call obsidian.file.write notes/upg28b.md content test」
- 截图 `upg28_审批弹窗_相对路径.png`：弹窗「审批请求」显示参数 `path = notes/upg28b.md`（相对路径）、三个按钮「允许本轮 / 拒绝 / 允许本次」，标注「60 秒无响应将自动拒绝」
- 点击「允许本次」(1577,1850)
- 工具 handler 真实执行，AI 回复：「**这次报错不同了：目标目录 notes/ 不存在**……vault 尚未登记授权，所以写入失败」
  - 对比首次未审批时「工具执行超时」——证明 ASK 拦截生效，审批放行后工具真实执行（返回真实错误：vault 未登记、SAF 目录不存在）

## 判据达成

- 相对路径 → ASK 弹窗：✅ 两次 UI 弹窗截图，参数均显示相对路径（notes/upg28-live.md / notes/upg28b.md）
- journal approval 链：✅ tool/call → approval/asked 记录；审批后工具真实执行（行为证据）
- 无静默放行（修复核心）：✅ 相对路径全程走审批，未出现旧 bug 的零弹窗写入

## 备注

- vault 未登记（obsidian.vault.check registered=false）是本次补验的环境前提，不属 UPG-28 缺陷；handler 真实执行返回「目标目录不存在 / vault 未授权」为预期真实错误
- 审批模式 approval.getMode = ask（默认权限）
