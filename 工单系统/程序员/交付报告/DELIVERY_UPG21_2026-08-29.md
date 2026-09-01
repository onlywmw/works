# UPG-21 交付报告：聊天页输入框回车键=发送（IME 发送键修复）

**程序员**：C ｜ **日期**：2026-08-29 ｜ **分支**：`feat/upg21` @ **a14ee64**（基于 main 198e26f）
**已登记两个表**（工单表 row22 + 工单库）；Token/KV 申报：**不变**（纯 UI 行为改动，AGENTS.md 硬规则 1 两节照旧）。

## 一、修复内容（方案四条全落）

| 方案条 | 落点 |
|---|---|
| ① 去 `TYPE_TEXT_FLAG_MULTI_LINE`（根因：其存在使多数输入法忽略 imeOptions） | `MainActivity.kt` composer input `inputType = TYPE_CLASS_TEXT or TYPE_TEXT_FLAG_CAP_SENTENCES` |
| ② `imeOptions = IME_ACTION_SEND` + listener → send() | `imeOptions = EditorInfo.IME_ACTION_SEND` + `setOnEditorActionListener`（actionId 判定 + KEYCODE_ENTER event 兜底；**消费回车不产生换行**） |
| ③ `maxLines = 4` 保留 | ✓（长文自动折行；粘贴含换行文本不受影响——内容可含 \n） |
| ④ trade-off 卡面明说 | 软键盘手动换行能力舍弃（微信/QQ 同款）——方案已注明 |

**listener 空判与 sendBtn 可见性同口径**：`!v.text.isNullOrBlank() || pendingPhotoFile != null`（有文本或待发照片才发送）；`send()` 本体未动（内部防连点/空判/清空/收键盘全部保留）。

## 二、L1 验证（全绿）

| 项 | 结果 |
|---|---|
| `ComposerInputContractTest`（源码锚契约断言） | 2 项绿：inputType 无 `android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE`（全限定形态，排除注释误报）+ `IME_ACTION_SEND` + `maxLines = 4` 保留 + listener 接 send()（含 isNullOrBlank 空判+消费回车） |
| JVM 全量 | **274 tests 绿**（含新增 2 项） |
| **变异亲杀 2/2** | ①加回 MULTI_LINE → 契约断言红（全限定形态检测）②删 listener → **编译红**（源码锚断言对删除变异天然必杀）；各还原绿 |
| assembleDebug | BUILD SUCCESSFUL |

## 三、L2 申报（如实）

真机「输入文字按回车 → 消息发出+输入框清空+发送按钮消失」走查需**登录态+网络**（AI 回复链路）。本轮验证环境网络未通——**申报留验收员**（5558 环境 key 已配）：走查三步 = ①输入文字 ②键盘回车/发送键 ③确认消息气泡出现+输入框清空；粘贴多行文本显示正常（maxLines=4 折行）。**机制面已双证**（源码契约断言+变异亲杀），UI 走查无实现风险（listener 逻辑与 sendBtn 同口径）。

## 四、红线合规

- 未动 room.html/markstream（冻结项）✓；`send()` 逻辑未动 ✓；LoginActivity 不在范围 ✓
- 与 UPG-05（R1 待验收）不同 hunk：本单 composer 段 :1063-1079，UPG-05 在记忆装配/SettingsSheet 区——rebase 无冲突
