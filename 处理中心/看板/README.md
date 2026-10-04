# 流水线看板 —— 状态机引擎 + 终端大屏（CMD 全屏 TUI · 无DB · 闸门在人）

> **形态 v3「MOV Flow Journey」**（2026-09-09 用户拍板：废四角矩阵——"结构图→工作台"；狐狸已删）：CMD 终端全屏只有**一条工作旅程线** `●─●─●─●─●`+站名——纯路标，**首站压表格左框、末站压表格右框**（表格标题列吃满余宽撑到屏宽）（无亮段/无计数/无 agent 名/无配色，再极简 @2026-09-09 用户拍板）；主角单=最高注意力的在途单，**工单号+动作+时长挂在当前站点下方**（纯文字）。刷新=2.5s 引擎心跳一帧（600ms 动效刷新已删）。**时间线正下方=「工单库」制表符表格**（┌┬┐├┼┤└┴┘─│ 全套、行间 ┼ 的完整网格，与 dianming.py box_table 同构）：直读唯一权威账本，上半 `派单未完成`（dispatched→audited，最久未动在上），下半 `最新完成×3`；列=工单/标题/设计/施工/验收/审验/合并（与旅程线站点同款），工位列=完(绿)/办(黄)/待(灰)，完成单末列=日期，狐狸正在搬的单整行反白。**宽度红线**：中文=2列、其余=1列；单元格内容经 san() 净化歧义宽度字符（·⊕①—→宽度确定字符）——内容字符宽度歧义才是边框断裂的元凶，制表符本身不是。主角单装在**带边框信息盒**里（居中于当前站点，内容经 san 净化）；健康条/工位灯/轨迹收进 **[d] 详情抽屉**；底部留白（键位行已删：↑↓切单 / a放行 / r重跑 / d详情 / c暂停 / q退出——见本 README）。回环制不变：审验过→设计师合并位→merged。
> **取数红线**：看板唯一取数口 = `board-data.mjs`（五真相源聚合：`单/` + `seats/` + `邮局/` + `问题区` + `机器闸`；输出统一 JSON，Attention Priority **P0红牌→P1人闸/未消费信→P2 SUSPECT/等超2h/回炉≥2→P3流转→P4完成** 排序——打开 3 秒看见最要紧的）。看板**零写入**，所有操作走引擎命令。
> **定位**：流程权在引擎，AI 只是工序工人。看板=投影+控制面（无数据库，对齐 E1：工单库=唯一权威）。
> **由来**：GitHub 调研裁决——全功能看板（Wekan/Focalboard/Planka/Kanboard/Kaneo）自带 DB 双源账漂；Windmill 理念对口但容器跑不了本机 agent。herdr（Apache-2.0）为窗格宿主不渲染业务状态——取其形态（状态灯/键盘/工位），引擎自写。
> **转正说明**：未纳管原型。好用则立 SYS 票收编（配套：`单/` 目录进 .gitignore 或定归档规则）。

## 用法（三条路任选）

```bash
看板-终端.cmd          # CMD 全屏 TUI（唯一形态）：MOV Flow Journey——一条线+狐狸搬运+详情抽屉
node engine.mjs status # 纯文本一屏
node board-data.mjs    # 聚合器裸输出（调试/体检用，--fast 跳过卫生闸子进程）
```

```bash
node engine.mjs new UPG-126 标题      # 建单 → 编辑 单/<号>/单.json 填任务包/校验
node engine.mjs approve UPG-126      # 闸门放行（TUI 里按 a 等价）
node engine.mjs rerun UPG-126        # 校验失败清旗重跑（TUI 里按 r）
node engine.mjs audit                # 对账：流水线阶段 vs 工单库 phase（只读，漂移以工单库为准）
node engine.mjs reject UPG-126 --to 验收员 --note "验收证据不全"  # 打回路由（审验道或设计师合并位可用）
```

## 与工单库的账（2026-09-09 接线：工单库=唯一权威，对齐 E1）

- `new <工单号>` 必须先在 `工单库.md` 有卡（无卡拒建——防双源账）；`DEMO-*` 演示单不回写
- 阶段迁移自动回写（经 `处理中心\机器闸\set-status.py`，引擎不直改工单库）：方案批准→dispatched；程序员过→delivered；验收过→accepted；审验过→audited；**设计师合并位完工→merged**（hash 闸内建：head 须为 origin/main 祖先，取自 合并记录.md 的 head/branch 行）
- 回写失败=红牌停等（`_passed`：工序已过只差记账，引擎每轮只重试回写，不重跑 agent）
- 邮局角色卡同样带 set-status 登记步——信件流与流水线两条路落同一本账
- 相位对照：设计师=registered/dispatched｜程序员=claimed~delivered｜验收员=delivered/accepted｜审验员=accepted/audited｜**合并位=audited→merged**｜完成=merged/closed

## 打回路由与角色治理（2026-09-09 回环制定稿）

- **合 main 归设计师（回环制·用户拍板）**：审验通过 → 单子**回设计师合并位**（`t.merge`，信件派工不是人闸）→ 设计师执行 git 合并 + 产物 `合并记录.md`（含 head/branch 行）→ 完工信 → 引擎 hash 闸登记 merged → 完成。**单子从哪来回哪去**——四角顺时针闭成环，合并正确性由机器闸（head∈origin/main 祖先）替代人拍板
- **打回按根因路由**（`reject <号> --to <角色> --note "原因"`，审验道或设计师合并位）：程序问题→程序员｜验收证据不全→验收员｜方案缺陷→设计师**全部重走**（计数 rework，第 N 次回炉）
- **巡检台（第五角色，横向监督·原卫生员 2026-09-11 改名）**：巡查全项目文件卫生（根层整洁/生成物落点/临时文件/命名归属/挂死服务/git 散件），**追查纪律=每处不卫生必答三连问**（谁产生的？为什么没按规则走？怎么堵？）——卫生是流程健康度的皮肤症状；产出巡查报告落 `处理中心\汇报区\`，治理建议发通知信给设计师（立 SYS 票）。红线：只读巡查不删不改，不代角色补文件（补了根因就没了）
- **疯狗哨兵（卫生员养的狗，引擎代养 @2026-09-10 用户拍板）**：每次巡查点火（含手动「巡查」）先放狗——各角色信箱里有可办信、铃已敲、信龄超宽限（默认 20 分钟，`工位绑定.json` `_madDogGraceMin` 可调）、信到后该角色一封信没发（=没动静）→ 投 type=疯狗 咬信（ref=原信，巡铃相位豁免必响）；咬过一轮宽限还不动 → 裁决信升级设计师+问题区红牌；信销了咬痕自动销账（`看板\疯狗.json`，看板巡检台「疯狗咬痕」格）。不咬：巡检台自己/不在岗/灯尸/未敲铃（后两者归看门狗与巡铃）/有动静/挂起单的信
- **挂起制（2026-09-10 用户拍板）**：现实条件不满足（缺 key/缺料/等人给东西）→ `node engine.mjs 挂起 <单号> "原因" | "解除条件"` 登记挂起再待命——不许空转乱试；挂起的单卡单哨兵不报停滞、疯狗不咬、看板工单行「办」改显「挂」；条件达成 → `解挂 <单号>` 复工信投登记人角色。「我不会/我不想」不许挂
- **引擎加固（2026-09-10 八项审查修复②③④⑤⑥⑧）**：单.json tmp+rename 原子写（崩溃不留半截）；serve 与看板双引擎心跳互斥（另有活引擎则 serve 让贤不推卡）；完工信契约=re 三件套「单号+工序名+工序完工」（防上一工序迟到信串台假红牌）；信封读路径归一 `lib/envelope.mjs` parseEnvelope（巡铃/看门狗/疯狗/卫生专线/完工信/board-data 共用）；工序推进迁移唯一函数 applyAdvance（回写重试与正常路径同一条路，审验→合并位必带任务包）
- **取号闸（2026-09-10 SYS-27 撞号案立法 · 2026-09-12 SYS-59 评分必填）**：工单库立卡唯一入口 = `机器闸\取号.mjs 立卡 <前缀> "标题" "引子" --bv N --tc N --rr N --size N [--kind bug --impact N --urgency N] [--priority Pn]`（锁文件防并发+全文扫描 max+1，宁可跳号不撞号；**WSJF 四因子必填——缺分即拒**，落卡片 ```priority 块：商业价值/时间紧迫/风险消减 ∈ 1/2/3/5/8/13·工程量 ∈ 1/2/5/8/13 挂档位 MICRO=1/小修=2/场景=5/结构=8/超大=13；bug 子类 ITIL Impact×Urgency 3×3 → P0-P3 单源推导）；只读查号 `取号.mjs 下一个 <前缀>`；防滥校验 `机器闸\checks\check-priority-score.mjs`（缺分/全 P1 即 fail）；手写编号贴卡=违规

**入驻/上岗 v2（2026-09-09 定稿：一键开工全自动）**：
1. 看板敲 `开工`（或 `node engine.mjs hire`）→ 四个角色各开一个工位窗，落在 `看板\工位\<角色>\`——**窗内按 `工位绑定.json` 自动启动绑定 agent 并喂「上岗」触发词，agent 读角色卡自动报到，灯 3 秒内自动亮**（座探按进程真相登记）
2. **换策略**：看板命令 `绑定 程序员 pi` ｜ `绑定 全部 claude`（改写 `工位绑定.json`，下次开工生效）；也可直接编辑该文件
3. 灯=进程真相：claude 在窗内即亮、退出即灭（agent 忘执行 onseat 也不影响）；信到引擎自动注入「收信」（WT/conhost 均可）
3. 信到 → 值守只给**亮灯**（on:true 且窗口存活）的工位敲「收信」（hwnd 锚定+前台校验）；未亮灯 → headless 降级，不敲空窗。关窗即下班
4. 编码纪律（数次事故换来的）：`.cmd`/`.ps1` 内容**纯 ASCII**（PS 5.1 把无 BOM 文件按 GBK 读）；读 UTF-8 JSON 必须 `-Encoding UTF8`；中文一律走 node 侧或 argv

## herdr（v2 备选宿主，2026-09-09 装机）

~~`..\herdr\herdr.exe`~~ **已移除（2026-09-09 卫生整改：未启用工具不蹲机制区）**——二进制 zip 归 `灵感库\安装包\herdr-windows-x86_64_v0.9.0.zip`，v2 启动时解压到临时目录或 `%LOCALAPPDATA%\herdr\` 再接。定位：**用它当车间窗户（窗格宿主），不当车间主任**——其 socket API（pane split/run、agent.prompt、agent_status working/blocked/idle、agent.wait、Windows named pipe）可让 engine 把"spawn claude"换成"指定窗格跑+等状态+读输出"，四窗口合一；但它没有工单状态机/闸门/产物校验，这些仍在 engine。接线属 v2，未做。不 fork 其 Rust 源码（防臃肿：养 fork 比自写贵）。

## 防乱安排的五层机械防御

1. **推进权在引擎**：阶段机是固定边（待批方案→施工→验收→终审→待批合main→完成），AI 改不了
2. **工序任务包最小化**：每道 AI 只收到本工序 prompt，不知道全局
3. **出口机械校验**：产物存在 + 必含关键内容（正则），不过 → 停下亮红等人，引擎不自动重试
4. **闸门在人**：批准方案一颗按钮（合并正确性由 hash 闸机器验证——head 须为 origin/main 祖先，假合不了）
5. **引擎绝不碰 git**（合并由人执行；worktree diff 白名单为 v2 待办）

## 用法

```bash
# 建单（生成 单/<工单号>/单.json，里面填各工序任务包与校验要求）
node engine.mjs new UPG-126 标题
# 编辑 单/UPG-126/单.json：worktree（施工工作区）、stages.*.task / produce / must_contain

# 开看板（闸门按钮在页面上；卡自动流转）
看板.cmd            # 或 node engine.mjs serve 8461 → http://127.0.0.1:8461

# CLI 等价操作（不用浏览器时）
node engine.mjs status            # 终端看板
node engine.mjs approve UPG-126   # 当前闸门放行
node engine.mjs rerun UPG-126     # 校验失败清旗重跑
```

## 单.json 关键字段

```json
{
  "stage": "待批方案",
  "worktree": "C:/Users/Administrator/mov-0027-browser",
  "stages": {
    "施工": {
      "task": "施工任务包：STD 要点/落点/红线",
      "produce": ["交付报告.md"],
      "must_contain": { "交付报告.md": ["分支", "L1"] }
    }
  }
}
```

`must_contain` 是机械校验的正则清单——**这就是"乱安排"的天敌**：AI 产物形状不对就过不了，流程原地亮红。

## agent 权限与换装

- 默认 `claude` + `--dangerously-skip-permissions`（信/任务包=指令，只投审过的任务包）
- 谨慎版：`set AGENT_ARGS=--permission-mode acceptEdits --allowedTools "Read Edit Write Glob Grep TodoWrite WebFetch"`
- 换 agent：`set AGENT_CMD=kimi` 等（需无头+stdin 模式）

## 与邮局/值守的关系

邮局=通知层（信件），流水线=流程层（状态机）。流水线是**更收权**的形态：AI 连发信权都没有。两者可并存——非流水线单继续走邮局；流水线单引擎全权推进。
