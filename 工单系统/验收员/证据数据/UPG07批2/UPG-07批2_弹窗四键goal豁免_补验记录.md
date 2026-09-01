# UPG-07 批2 弹窗四键 + goal 豁免真机补验记录

- 补验日期：2026-08-30
- 设备：小米平板 6S Pro 12.4（序列号 21770d7d，型号 24018RPACC，density=400/2.5x）
- APK：mov-upg07-b2 分支（431b3cb，lastUpdateTime=2026-08-30 04:51:24），包名 com.mov.android
- 判据（批2 交付面）：弹窗按目标状态渲染键位（有 ACTIVE 目标四键/无三键）+ goal 级豁免「允许本目标」UI 可达 + journal approval 链可见
- 验证法：uiautomator 节点树 + PIL 像素 + journal 事件链 + 源码 diff 四轨

## 基线采集（approval/asked 口径）

- 标准任务 A/B/C 逐次触发审批，journal `approval/asked` 计数：**A=6、B=3、C=4，总 13 次**
- 弹窗均真实弹出（ASK 拦截生效），无静默放行

## goal 系统验证

- `goal g-verify` 创建成功，状态 ACTIVE（rounds 8-9/maxRounds 20）
- 活跃目标已注入 systemPrompt（AI 对话上下文可见），goalIdProvider 装配为仅 ACTIVE 目标（MainActivity.kt:3576）

## 弹窗触发验证（AI 对话路径）

- 注入 `Use tool shell.exec command echo ...` → 弹窗「审批请求」出现，journal 记 `tool/call` → `approval/asked`
- 三次触发（echo goal-exemption / echo goal-confirm 等）均出弹窗，UI 可见（截图 dlg*.png）

## ⚠️ 发现项（P1）：四键弹窗列表项未渲染，goal 豁免「允许本目标」UI 不可达

**实证（节点树铁证，ujb/ujc/ujf.xml）：**
```
弹窗节点树仅 2 个 TextView：
  - text="审批请求"                        ← 标题
  - text="AI 请求执行：shell.exec… 60 秒无响应将自动拒绝。"  ← 消息
无 ListView / 无「允许本轮/允许本目标/允许本次/拒绝」任何按钮节点
```
- 弹窗只有标题+消息，**无任何可点击的选项**；goal 级豁免「允许本目标」在 UI 上完全不可达
- 弹窗只能等 60s 超时 fail-closed（实测 journal `approval/decided` = +60s，超时后 AI 回复「被拒绝后不再重试」改用 echo 工具）

**源码根因（431b3cb diff 对照）：**
- 改动前：`setNeutralButton("允许本轮") + setPositiveButton("允许本次") + setNegativeButton("拒绝")`（标准底部三键，正常渲染）
- 改动后（MainActivity.kt:3575-3585）：
  ```kotlin
  val labels = if (hasActiveGoal) arrayOf("允许本轮","允许本目标","允许本次","拒绝")
               else arrayOf("允许本轮","允许本次","拒绝")
  AlertDialog.Builder(this)
      .setTitle("审批请求")
      .setMessage(buildApprovalMessage(info))   // ← setMessage 占用内容区
      .setItems(labels) { _, which -> ... }     // ← setItems 需独占 ListView 内容区
      .create()
  ```
- **setMessage + setItems 同时调用冲突**：AlertDialog 的 setItems 会替换内容区为 ListView，setMessage 后再 setItems 的列表项未渲染 → 只有消息、无列表项

**后果：** 批2 核心交付「goal 级豁免（允许本目标）」在 UI 无入口；有 ACTIVE 目标时四键弹窗退化为「只读消息窗」，用户只能超时被动拒绝，无法主动允许本轮/本目标/本次。

## 判据达成汇总

| 判据 | 结果 | 证据 |
|------|------|------|
| 弹窗按目标状态渲染键位 | ❌ 四键弹窗列表项未渲染 | ujb/ujc/ujf.xml 节点树仅标题+消息；源码 setMessage+setItems 冲突 |
| goal 级豁免「允许本目标」UI 可达 | ❌ 不可达（无按钮可点） | 节点树无列表项；goalAllowSet 无法经 UI 命中 |
| journal approval 链可见 | ✅ 通过 | tool/call → approval/asked → approval/decided(+60s) |
| 弹窗超时 fail-closed | ✅ 通过 | seq 174 approval/decided=+60s，AI 超时后自纠改用 echo |
| 基线采集 | ✅ 完成 | A=6 B=3 C=4 总 13（approval/asked 口径） |

## 结论

- **UPG-07 批2 核心交付面阻塞**：四键弹窗列表项未渲染（setMessage+setItems 冲突），goal 豁免「允许本目标」UI 不可达。批2 主体功能需修复后复验
- 基线采集（13 次）、弹窗 ASK 拦截、超时 fail-closed、goal ACTIVE 注入均真机实证生效 ✅
- **⏳挂账待审**：四键弹窗列表未渲染缺陷（P1，需登记工单交设计师审核）——修复方向：弹窗内容二选一（setItems 去掉 setMessage，改在列表项上拼参数摘要；或恢复 setNeutralButton/Positive/Negative 三+一键）
- 证据：截图 7 张（dlg/dlg2/dlg6/dlg8/dlg9/dlg9_zoom/dlgf.png）+ 节点树 3 份（ujb/ujc/ujf.xml）+ 对话页 1 份（uje.xml）存本目录
