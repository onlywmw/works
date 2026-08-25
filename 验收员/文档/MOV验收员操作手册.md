# MOV 验收员操作手册（2026-08-17 · 原查验员+真机测验员合并）

> **下一位验收员照此接续。** 本手册 = 验收角色（代码层 + 真机层）的工作流 + 工具链 + 方法 + 注意事项。
> **合并背景（2026-08-17 用户拍板方案 A）**：查验员与真机测验员方法论重叠（同一套 L1-L3/变异亲杀/不信自报），且查验员手册自承「真机项挂账归真机验收员」——两道关口各管一半无真正双重复核。合并为单一**验收员**：代码层（变异/全量/契约）+ 真机层（装机/截图/journal）一套验收。
> 配套：`真机验收标准与方式方法.md`（规则/标准）· `交接_真机工具全量检验_2026-08-16.md`（进度交接）· `处理中心\`（汇报/挂账落点）。

---

## 一、角色定位

- **位置**：工单流转最后一环——设计师出单 → 程序员施工（登记上表）→ **验收员验收**（代码层+真机层）→ 设计师合 main。
- **职责**：①代码层验收（L1-L3 定级、变异亲杀、全量绿、契约测试、假覆盖排查）②真机层验收（固定四步、截图/journal/logcat 证据链）③工具面逐工具激活验证（按项目工具面） ④复验修复交付（通过/打回/阻塞）。
- **纪律（最高）**：**不信自报信实物**——程序员表格只是线索，每条断言必须亲手产出实物。**判据 = 截图可见目标达成**；「机制被触发」「代码+JVM 转述」不算 ✅；AI 不走 plan 就标「⚠️端到端未验」不标 ✅。

> **验收判据铁律详见「★ 验收判据铁律」章节（用户视角最终结果 · 2026-08-17 误标教训定）**——本手册第 207 行起，5 条禁止项 + 达成描述强制。

---

## 二、环境与工具链

| 项 | 值 |
|---|---|
| 真机平板 | `adb -s emulator-5556`（桌面虚拟模拟器 MOV_Test；相机/传感器真值类用实体平板补充） |
| ADB | `C:\Users\Administrator\platform-tools\platform-tools\adb.exe` |
| 主仓库 | `C:\Users\Administrator\0027-mov`（Android，com.mov.android，v0.1.0） |
| 构建 | `/c/tools/gradle-8.13/bin/gradle.bat :app:assembleDebug`（**JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"**；worktree 需 local.properties） |
| 验收记录（唯一落点） | `0027-mov\docs\ACCEPTANCE_LOG.md` |
| 工具主表 | `工单流转中心\工单表.xlsx` →工具回填列（按项目工具面；主表验收列已合并） |
| 汇报/挂账落点 | `工单流转中心\处理中心\`（汇报区 + 挂账登记表.md） |
| 证据数据区 | `工单流转中心\验收员\<日期>\`（不入仓库） |
| 工具脚本 | `验收员\_tools\`（input_chain / ui_ops / ocr_* / evidence_shot / make_overview） |

### 常用脚本

| 脚本 | 用途 | 例 |
|---|---|---|
| `input_chain.py` | **真实 UI 中文输入链路**（tap 聚焦 + ADBKeyBoard 输入 + Enter 发送） | `python input_chain.py "任务" --selector "#faceInput" --send enter` |
| `ui_ops.py` | 真实 tap / dump / find（uiautomator） | `python ui_ops.py tap 355 1209` |
| `ocr_shot.py` / `ocr_batch.py` | 截图 OCR（中文有字间空格，以截图为准） | `python ocr_shot.py <图>` |
| `cdp-eval.js`（仓库 tools/e2e/） | CDP 观测（读 DOM/坐标/状态）——**只观测不驱动** | `node cdp-eval.js "<JS>"` |
| `make_overview.py` | 生成总览表 | `python make_overview.py <日期>` |

---

## 三、连接与前置（每次必做）

### 1. 建立 CDP（App 重启后 webview remote 会变）

```bash
ADB="/c/Users/Administrator/platform-tools/platform-tools/adb.exe"
REMOTE=$("$ADB" -s emulator-5556 shell "cat /proc/net/unix | grep webview_devtools | awk '{print \$NF}' | tail -1" | tr -d '\r' | sed 's/@//')
"$ADB" -s emulator-5556 forward --remove tcp:9222 2>/dev/null
"$ADB" -s emulator-5556 forward tcp:9222 localabstract:$REMOTE
curl -s http://127.0.0.1:9222/json | grep -E '"title"|"url"'   # 应见 MOV hermes-shell.html
```

### 2. ⚠️ 多 WebView 陷阱（2026-08-17 踩过）

App 内 **HermesActivity 页 + 内嵌 DeepSeek Harness 页 = 两个 webview_devtools_remote**。`tail -1` 可能选中 Harness 页（CDP page not found）。`input_chain.py` 的 `setup_forward` 已改**遍历探测 hermes-shell.html**，自动选中 MOV 页——直接用它，不要手动 tail -1。

### 3. ⚠️ localhost IPv6 陷阱（Chrome 劫持）

Windows `localhost` 解析 `==1`，**Chrome 可能占用 `==1:9222`** → node/python 连到 Chrome 调试口（page not found 或返回非 MOV 页）。**工具统一用 `127.0.0.1`**（`input_chain.py` + `cdp-eval.js` 已改；若报 page not found，先 `netstat -ano | grep 9222` 看是否有两个监听）。

### 4. 截图前唤醒

`adb -s emulator-5556 shell input keyevent KEYCODE_WAKEUP`（防黑屏）。

---

## 四、固定四步（每次装包/验收必做）

```bash
# 1 装包
adb -s emulator-5556 install -r "<apk>"
# 2 核对（防旧包白忙）
adb -s emulator-5556 shell dumpsys package com.mov.android | grep lastUpdateTime
# 3 force-stop（防旧进程残留）
adb -s emulator-5556 shell am force-stop com.mov.android
# 4 启动
adb -s emulator-5556 shell monkey -p com.mov.android -c android.intent.category.LAUNCHER 1
# 重启后重新 forward CDP（§三.1）
```

> **「无变化」报告 = force-stop 没做**（旧包还活着）。装包后必须核对 lastUpdateTime 是新的。

## 四之二、第 5 步「结果确认」（强制 · 2026-08-17 r77 教训定）

> **发任务 ≠ 确认结果。** 验收动作的完成定义 = 结果被亲眼确认。以下强制，违反即验收动作未完成。

### 每个验收任务必须：
1. **验收前写「完成定义」**：该工单验收成功的标志 = 我要**亲眼看到**什么（如 `设置页打开 + .credentials 文件加密存在 + 引用名无明文`）。
2. **发任务后必须确认结果**：截图/journal 证明「用户视角最终结果」达成——**不得发完指令就转入别处**。
3. **未确认结果 = 该验收动作未完成** → 不得标 ✅；补验或标「⚠️端到端未验」。

### 完成定义示例
| 工单 | 验收前写的完成定义（我要看到） |
|---|---|
| r77 凭据 | 配 key → 设置页保存成功 + `.credentials` 文件加密 + 引用名无明文 |
| r45 搜索 | 命令返回**真实结果集**（非 fallback 触发但失败） |
| 任一工具 | 执行卡片 + 完成 + 输出（tool_call 实锤） |

---

## ★ 核心章节：幻觉欺骗避坑（必读 · 验收员的命根子）

> **AI 可能不真调工具，而是「声称」执行/结果。** 验收员的最大陷阱 = 把 AI 的声称当真。以下全部来自 2026-08-17 实战。

### 1. 幻觉欺骗的六种形态（按出现频率/危险度）

| 形态 | 实战例子 | 工具层拦截 |
|---|---|---|
| **A 编造数据结果** | `model.list` 编造「GPT-4o/Claude/Gemini」列表（journal 无 tool_call） | ✅ FabricateGuard 拦（数据形态） |
| **B 成功声明** | `timer.set` 回复「✅ 已设置成功！10秒后您会收到提醒」 | ✅ SUCCESS_CLAIM 拦（补强后） |
| **C 措辞绕过** | `volume.set` 回复「已按顺序执行完毕」 | ⚠️ 漏拦（SUCCESS_CLAIM 有限动词，「执行完毕」不在列） |
| **D 输出函数 JSON 不真调** | `file.info` 回复「{"function":"file.info","input":{...}}」 | ⚠️ 漏拦（非编造结果，guard 放行） |
| **E 文本计划不真走闸** | `app.list` 回复「执行计划如下…请确认是否开始」 | ⚠️ 漏拦（无 plan 卡片） |
| **F 纯聊天回避** | `battery.status` 回复「你好我是MOV…我无法直接读取」 | 不拦（非工具调用） |

### 2. 识别幻觉的硬标准（唯一可信）

- **唯一可信 = journal/渲染出现「执行工具卡片 + 完成 + 输出」= `tool_call` 实锤**。
- **AI 任何文字回复都**不算**工具调用**——无论声称成功、输出 JSON 参数、列文本计划、纯聊天，一律视为「未调用」。
- 铁证案例：`model.list` 同一工具，batch14 走 plan **真实返回** deepseek 列表；复测却**编造** GPT-4o/Claude 列表（无 tool_call）。同一工具两种行为 = AI 幻觉，非工具问题。

### 3. 避坑操作守则（每步照做）

1. **只认执行卡片，不认 AI 回复**——没有「执行工具卡片 + 完成 + 输出」一律不算激活。
2. **声称/JSON/文本计划 → 标 ⚠️，重启重发（最多 2 次）**——用「请先列出执行计划（每步一个 tool.execute）并等待我批准」重发，常能触发真 plan（settings.get/browser.open 先例）。
3. **不硬耗**——AI 不配合类（声称/文本计划/JSON）标 `⚠️ AI声称(未真调)` 等语义治本（TASKS_ANTIFAB_SEMANTIC），不无限重试浪费轮次。
4. **查代码佐证**——工具被调用 ≠ 工具可用：被调但实现占位（返回提示文本）= C 类未接线（`file.info` 先例：真实调用但返回「请用 shell.exec ls -la」），须 grep 代码确认再标可用。
5. **组合任务提高走 plan 概率**——3-4 个同类有副作用工具比单工具更易让 AI 真调。
6. **判定前先看 journal/截图**——不凭对话印象，截图+journal 成对落盘。

### 4. 当前工具层拦截状态（2026-08-17）

- **FabricateGuard 已拦截**：数据结果类（编造列表/路径/枚举）+ 成功声明类（已设置成功/✅）。
- **仍漏拦**：措辞绕过（C）/ 输出参数（D）/ 文本计划（E）——AI 可无限变换措辞，正则拦截是猫鼠游戏。
- **治本**：`TASKS_ANTIFAB_SEMANTIC`（语义检测：「声称执行了指定工具但本轮零 tool_call」即拦/引导）交付后，C/D/E 类可拦。
- **对真机工作的意义**：语义治本交付前，AI 声称类工具**标 ⚠️，不误标 ✅**——宁可欠验，不可假验。

---

## 五、工具激活方法（工具面全量验证）

### 1. 判定「工具激活」的硬标准（不信自报信实物）

- **唯一可信 = journal/渲染出现「执行工具卡片 + 完成 + 输出」= `tool_call` 实锤**。
- **AI 聊天回复「已成功××」一律不算**——无 tool_call 即幻读。铁证：`model.list` 同一工具 batch14 真实返回 deepseek 列表，复测却编造 GPT-4o/Claude 列表。
- **工具被调用 ≠ 工具可用**：被调但实现占位（返回提示文本）= C 类未接线，须查代码确认再标可用（`file.info` 先例：真实调用但返回「请用 shell.exec」占位）。

### 2. 三类工具分类（别一刀切「没对接」）

| 类 | 含义 | 判定 | 处理 |
|---|---|---|---|
| **A 真对接** | 代码真调 Android API | 走 plan 真实执行 + 有输出 | 标 ✅ 可用 |
| **B AI 幻读** | 注册了但 AI 不调用，声称执行 | AI 回复「已××」但无 tool_call，**非 API 问题** | 标 ⚠️，等 ai-fabricate/语义治本 |
| **C 占位/半成品** | 实现返回提示/建议/结果拿不到 | 代码确认 `return new Result(true,"请用…")` | 登记挂账转工单 |

### 3. 组合任务法（AI 走 plan 概率高）

- **单工具轻量类 AI 易幻读**（AI 直接聊天声称）。
- **组合 3-4 个「同类 + 有真实副作用」系统/设备工具 → AI 走 plan 概率高**（实测：timer 组合/browser.open/编码组合走 plan；文件/记忆类声称）。
- 任务文本：点名工具名 + 「请执行以下真实操作」。
- 例：`"请执行以下任务：1 用 base64.decode 解码 aGVsbG8=；2 用 calc.math 计算 3*7；3 用 uuid.generate 生成 uuid"`

### 4. AI 声称被拦后的重发技巧（已验证）

AI 声称（被 FabricateGuard 拦）后，**重启新房间 + 明确「请先列出执行计划（每步一个 tool.execute）并等待我批准」重发**，常能触发 plan（settings.get / browser.open 先例）。

### 5. 批准 plan

AI 出「执行计划 · N 步」→ CDP 读「批准」按钮坐标 → `ui_ops.py tap` 真实点击（坐标含 TOP_OFFSET=78：CDP 返回 CSS×dpr，tap 需 +78 顶部系统栏）。

### 6. 不硬耗

AI 声称/文本计划（输出 JSON 参数不真调）类 → **标 ⚠️ 等语义治本（TASKS_ANTIFAB_SEMANTIC）**，重启重试最多 2 次，不无限硬耗。

---

## 六、复验方法（修复交付验证）

### 1. 窗口级诊断（UI 布局问题）

```bash
adb -s emulator-5556 shell "dumpsys window windows | grep -B2 -A10 '<Activity>'" | grep -E "mAttrs|frame=|isVisible"
```
- 看 `mAttrs`（gravity/尺寸）+ `frame`（实际占位）+ `isVisible`（下层是否被隐藏）。
- 实证：ConnectWeb 半屏遮挡 = `frame=[25,1159][2007,3048]` + `gr=BOTTOM` + 下层 `isVisible=false`。

### 2. AI 幻读/挂起诊断

- 对话流「执行工具 X 待执行」+ 无 tool_result = AI 声称（无真调）。
- logcat：`AndroidRuntime`（崩溃）/ `ActivityNotFoundException`（Activity 残留调用）。

### 3. 崩溃复现

装包 → browser.open/任务触发 → 查 `topResumedActivity`（崩溃会回 launcher）+ `pidof com.mov.android`（进程消失=崩）。

---

## 七、常见坑（环境药方，2026-08-17 实战）

| 坑 | 药方 |
|---|---|
| CDP page not found: hermes-shell.html | 多 WebView（MOV+Harness），用 `input_chain.py` 遍历探测；不手动 tail -1 |
| CDP 连到 Chrome/Harness | `localhost`→`::1` 被 Chrome 劫持 9222；工具用 `127.0.0.1` |
| 重启后 CDP 探测失败 | webview 未就绪：sleep 3 重跑 |
| App 重启后旧 remote 残留 | forward 先 `--remove` 再 forward 新 remote |
| 场景卡拦截（任务被劫持成追剧/购物） | 含「看/列/查/买」等触发词任务被前端分类器劫持——当前**统一包 v2 已修**（TASKS_SCENECARD_INTENT）；若复现先确认包版本 |
| AI 声称（不真调工具） | 核心拦截已生效（数据类+成功声明），措辞绕过类标 ⚠️；语义治本（TASKS_ANTIFAB_SEMANTIC）交付后重验 |
| 「无变化」报告 | force-stop 没做，旧包还活着 |
| Windows 文件锁（output.bin） | `gradle --stop` → 删 test-results；顽固 `taskkill //F //IM java.exe` |
| 中文路径传参乱码 | PowerShell/WinRT 用反斜杠绝对路径；Git Bash 中文路径走 Python 中转 |

---

## ★ 验收判据铁律（用户视角最终结果 · 2026-08-17 误标教训定）

> **验收员标 ✅ 的唯一标准 = 用户能看到的任务最终结果**，不是「我的测试动作完成了」/「预期信号出现了」。以下来自 2026-08-17 系统性误标根因。

### 判据（✅ 必须满足）
1. **用户视角最终结果**：AI 回应了有内容 / 文件生成了 / 状态到 DONE / 拦截反馈出现。
2. **可重跑 + 可见目标达成**：截图/journal/命令能证明「用户获得了什么」。
3. **每条 ✅ 附一句「用户视角的达成描述」**——写不出来就不标 ✅。

### 禁止（一票否决）
| 禁止 | 实例 |
|---|---|
| 只看信号不看结果 | fallback 执行了但「搜索失败无结果」 |
| 测试动作≠功能达成 | 发了任务/截了图/看了 journal ≠ 功能达成 |
| 环境失败标通过 | AI 超时/不走 plan → 应标「⚠️端到端未验」不标 ✅ |
| 拿不相关证据充数 | 拿 3080 进程当 MOV 验收证据 / 模拟渲染当真实页面 |
| **发指令不确认结果** | 发了「配置 key」指令没验证 key 配没配成功就转入别处（r77 教训） |

### 5 条强制整改（2026-08-17 定）
1. ✅ 唯一标准 = 用户能看到的任务结果；「AI 没回话」「工具 FAILED」「AI 只列计划」→ ❌/⚠️ 不标 ✅
2. 每张截图必须回答「这证明用户获得了什么」——不能只是「界面变了」或「日志有 X」
3. 环境失败（AI 超时/不走 plan）→ 明确标「环境阻塞，端到端未验」，绝不混进 ✅
4. 拿证据前核对归属（进程属于谁/数据来自哪）——r41 教训
5. 每条 ✅ 附「用户视角的达成描述」，写不出来就不标 ✅

---

## 八、纪律红线（全角色）

1. **不信自报信实物**——每条断言亲手产出实物（计数/diff/截图/logcat）。
2. **一断言一证据**——截图 + OCR 文本成对，无图不验收。
3. **真实 UI 操作**——tap/输入/发送走 `ui_ops.py`/`input_chain.py`；**禁 CDP eval 直调 B 桥触达业务**（CDP 仅观测坐标/DOM/断言）。
4. **脱敏**——key/token 打码（`sk-***REDACTED***`）；进仓库前 `git grep sk-` 零命中；证据不入仓库。
5. **结论落 ACCEPTANCE_LOG**（唯一落点），口头报告未落档 = 违规。
6. **合 main 只归设计师**——验收员只出结论 + 标「待设计师合 main」。
7. **挂账/汇报放处理中心**——`处理中心\`（挂账登记表.md ⏳待审 / 汇报区）；不主动收集，仅被动发现。
8. **改表前备份**——转工单写工单表时备份；挂账登记不备份。
9. **固定四步**——install -r → 核对 lastUpdateTime → force-stop → 启动。

---

## 九、接续指引（下一位从这里开始）

1. **先读**：`交接_真机工具全量检验_2026-08-16.md`（§十二 = 当前恢复激活进度）+ 本手册 + `真机验收标准与方式方法.md`。
2. **当前状态（2026-08-17）**：
   - 可用工具：✅26 + 已用3 = **29**
   - 真机包：统一包 v2（main 57e8ce97，含场景卡+connectweb+ai-fabricate+fileinfo）
   - 待推进：语义治本（TASKS_ANTIFAB_SEMANTIC）交付 → 文件/记忆类 + file.info 端到端重验；浏览器 read/click/type 补验
3. **触发信号**：语义治本交付 / 新工具修复交付 → 装包验证。
4. **汇报**：验收进展/复验结果/建议 → `处理中心\汇报区\`（或新建当日汇报）。
5. **挂账**：被动发现缺陷 → `处理中心\挂账登记表.md` 加行（⏳待审）→ 设计师验证转工单。

---

## 十、经验教训总结（2026-08-18 系统性沉淀 · 必读）

> 本节把 2026-08-17~18 完整历程的教训固化。**每一条都是真机实测踩出来的**——不是理论，是错误清单。

### 10.1 角色与流程（教训 0：别在流程外干活）

| 教训 | 错误实例 | 正确做法 |
|---|---|---|
| 先看规则再动手 | 按 4 环流程干活，漏了新增的「审验员」环节 | 开工前读 `README.md` 红线 + 角色表，流程变了要跟 |
| 规则会更新 | 红线 17「所有工单必须经审验」新增后我没第一时间发现 | 定期重读规则（尤其多 agent 协作，规则高频更新） |

### 10.2 验收判据（教训 1~5：误标系列，最痛）

| # | 教训 | 错误实例 | 铁律 |
|---|---|---|---|
| 1 | 机制触发 ≠ 功能达成 | r45：fallback 执行了但搜索 FAILED，标 ✅ | ✅ = 用户视角最终结果 |
| 2 | 口头计划 ≠ 执行 | r47/r50：AI 说「请批准后我将执行」标 ✅ | AI 只列计划 = ⚠️未执行 |
| 3 | 部分达成 ≠ 整体通过 | r82：场景卡没了但 AI 没回话，标 ✅ | 任务没完成不算过 |
| 4 | 代码+JVM ≠ 真机通过 | A 类多单：跑 JVM 测试当真机 ✅ | 代码层标注代码层 |
| 5 | 证据要核对归属 | r41：拿 dsh-mobile 自带 3080 进程当 MOV 证据 | 进程/端口属于谁先查清 |

### 10.3 证据链（教训 6~8：审验员揪出来的）

| # | 教训 | 错误实例 | 铁律 |
|---|---|---|---|
| 6 | **证据必须落盘成截图/命令文件** | r72/r39/r75 标 ✅ 但没截图/命令文件 → 审验.py 判 ❌ | 标 ✅ 前证据在 `证据数据\` 目录可查 |
| 7 | 映射表与实际证据一致 | r72 映射指向的历史目录缺截图 | 新验单及时补 `工单证据链映射.md` |
| 8 | 命令要保存 exit code | r49/r51 只 ls 看文件，被质疑 | 命令输出含 `exit=$?` 落盘 |

### 10.4 操作纪律（教训 9~10）

| # | 教训 | 错误实例 | 铁律 |
|---|---|---|---|
| 9 | 发指令必须确认结果 | r77：发了「配置 key」没确认配没配上 | 五步验收第 5 步结果确认 |
| 10 | 验证不污染真实数据 | r77：updateModel 写测试 key 覆盖真实 key | 验证用独立测试模型，不碰真实凭据 |

### 10.5 流程机制（2026-08-18 定，已成规矩）

1. **验收错误内化机制**：误标 → 登记表.xlsx → 根因 → 手册纪律 → 专项工单 TASKS_ACCEPTANCE_ERR_LEARN → 设计师抽查 → 根因收敛
2. **审验员环节**：验收员标 ✅ 后 → 审验员审验证据链（审验.py）→ 通过才可信
3. **红线 17**：所有工单必须过审验；未审验不视为可信、不得标 ✅

### 10.6 一句话总结

> **验收员 = 用户视角的守护者**：标 ✅ 前自问「用户真的获得了这个功能吗？截图/命令能证明吗？审验能过吗？」——三条答不上来就不标 ✅。

---

## 十一、当前待办（2026-08-18）

- **r72/r39/r75**：补截图/命令证据 → 重审（红线 17 撤销的 ✅）
- **r45**：❌ 端到端失败（网络受限），网络恢复后复验
- **r44**：⚠️ P1 询问误伤（挂账-chatreply-query-misfire），待转工单修复
- **r42/r67**：⚠️ 客户端达成，服务面未施工（r43），端到端待服务面
- **待合 main**：r85/r52/r82（验收通过未合，设计师安排）
- **AI key**：被测试 key 覆盖（挂账-ai-key-被覆盖），需用户提供真实 key 恢复
