# 工单库

> 验收铁律一律：L1 变异亲杀 + 全量绿 + L2/L3 真机证据链；测试必须用真实数据形态，禁用假覆盖。

---

# UPG-01 全量工具元数据补全
**分类**：M4 工具/MCP 集成


```status
phase: merged
branch: feat/upg01
head: 107f9c26
std: —
delivery_id: —
designer: ✅ 方案 **v2.3**（2026-08-29 评审#5 §十闭环 + 规则 21 复核 @8af7da9 随版完成：**批 1 棘轮时序
dev: ✅**C 批 4 完成 @2026-08-30**（feat/upg01-b4 **8cf7a2f 前段 + 5f5219c 后段** 已
inspector: 【✅ **验收员验收通过 @2026-09-01**（ACCEPTANCE_LOG b71b306）：feat/upg64 115762d
merge: ✅**批4 已合 main @2026-08-30**（设计师 merge c753e8a[含 6aaa1fc R1修复]，§六 抽查：L3
actor: sys04-backfill
updated_at: 2026-09-05T08:42:06
```

**状态**：✅ 方案 **v2.3**（2026-08-29 评审#5 §十闭环 + 规则 21 复核 @8af7da9 随版完成：**批 1 棘轮时序硬伤修复**[接线断言口径——41 工具 description≠模板串+回落清单+冲突检测首用例；三件套按族下放：browser→批 2、provider/scene 缺口实测列清单→批 3 首批]/五条执行期预案[频次走 journal 聚合不新打点·批 3 子单按「频次×领域关键度」排序·待核实 ≤8 有界有期·补丁位日落入批 4 验收·计数断言不变量化]/小点三条[描述优先级功能>限制>场景·近邻写差异点·L2 从简]；**基线刷新**：字面注册 147/uiOnly 9/在面 145/模板串 ≈123/空 properties ≈51；**关键漂移**：rebuildAgentTools 已长出 providerToolMeta 通道[M3 建，device/obsidian 20 工具真描述已上面]→批 1 从「建接线」改「三通道收敛+builtin/browser 推广」，工时下降），🔨**已派单待认领 @2026-08-29（批 1+批 2 同发）**——派单文本 `设计师/派单/UPG-01_批1批2_派单_2026-08-29.md`（批 1=开工实测缺口清单+三通道收敛 ToolDefinition 单源+快赢接入+MCP 补传 inputSchema+冲突检测首用例/回落清单；批 2=browser 14 校准批[测单工具工时]+journal 频次 Top 榜；验收=批级棘轮接线断言口径+变异两条+L2 抽样 4 件；串行约束=UPG-22 在施 MainActivity 编辑窗口） ｜ ✅**C 批1 完成 @2026-08-29 15:34**（feat/upg01 **067aa8e** 已 push origin，基底 main 8af7da9 新分支；六件全交：①开工实测[缺口清单=provider20+scene2 description/inputSchema 已真、**output 声明 22/22 全缺**→批 3 首批清偿，报告§一附表] ②三通道收敛[companion 纯函数 buildToolRegistry：builtin5+scene2 实物直充+provider20 视图（例外声明不重建 execute 空壳）+browser14 视图（mcp__browser__* 在面名）+projectToolMeta 单源投影（登记层主/静态表补丁位/模板串回落），rebuildAgentTools 与 MCP 注册循环两面共用] ③paramSchemaDesc 真字段描述版 ④快赢接入 builtin5+browser14（只增不改） ⑤MCP 面补传真描述+inputSchema（ToolSpec 签名不变只补传参；mountExtTools 外部路径留批 4） ⑥冲突检测 metaConflicts（首用例：静态表 builtin 4 条占位 vs BuiltinMcpTools 真字段必红→清偿删 4 条+SceneTools append）+fallbackTools 回落清单 rebuild Log 输出（登记债可见）；测试=ToolMetaTest 7 用例+SceneWiringContractTest 旧锚随收敛升级（append 反向断言+单源投影锚）+变异两条亲杀+L1 全量 51 类 369/0/0+1跳过（rm -rf 强制重跑）+assembleDebug 绿+check-token-effect 过；Token 申报=AI 面 +0.2-0.3KB/轮+MCP tools/list +29KB/次（不入 prompt）；红线九条全过（MainActivity 纯 CRLF 施工中曾混 LF 已 unix2dos 修复）；报告 DELIVERY_UPG01_批1_2026-08-29.md；已登记两个表）——待验收；【✅ **验收员验收通过 @2026-09-01**（ACCEPTANCE_LOG b71b306）：feat/upg64 115762d 基底 main 5b44714（rebase 零负担）；五项核物（①EffectSpecs 四元组**两套并存不混写**红线②Registry 逐条源码核实语义锚——**实测 18/20**[vault.credSet/credDelete 漏登记 **P2**——漏登记落保守缺省安全方向不破，建议补登记 WRITE×LOCAL]③resolve 单源三态[registered/hint 回落+PriorityReviewItem 优先核实队列/CONSERVATIVE_DEFAULT WRITE×EXTERNAL]+planFor C-3 未登记串行+确认门+W×E 串行+确认门④COVERAGE_NOTE 17% 收益下调显式记录⑤traceProposal 只扩不缩走 A-1 Manifest 不静默改）；tool-orch **8 套 58/0/0**[EffectSpecsTest **10/0**]+app **78 类 540/0/0**；变异 **M-64a**（保守缺省失效→回落纯读）→「C4 保守缺省」红+**M-64b**（未登记串行+确认门失效→并行放行）→「C3」+「C4」双红 ✅；P3：ApprovalRegistryGeneratorTest 新 worktree 需先跑 collect 脚本（报错友好提示）→ 待审验员合 main】；【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG 9f9466d）：feat/upg60 a8d1363 分支声明验证（58 ac8d27d+56 cc86fac 均祖先——前置产物合流实证；main 顶 f975437=58 已合，rebase 增量收敛为 SkillGate+MetaVerification+explain 演进）；三门核物全过（门 1 EvalFixture 全量重放+ThresholdConfig 配置化[≥switch 切百分比]+JS_ARTIFACT 拒收+injectError 自检 trigger 反写+失败用例定位/门 2 六指标 delta **单指标 +≥2 REJECT 禁跨指标抵消**+**签名只收两份 ErrorCounts**[manifest 自述零参与]/门 3 shadowCount Ledger 持久化+CANARY_PROMOTE_AFTER=3+**degradeToShadow require(manualTrigger) 拒伪装自动**）；MetaVerificationTest **10 用例**（M-1 Z-3 走门 2 全 REJECT+方向一致/M-2 注入拒+定位/M-3 干净候选双门放行/M-4 五元逐元拒发[58 联合]/M-5 gate2 签名反射/M-6 actor 越权拒[57 联合]/A2-2/A2-1/A2-1b/A2-4-5）；EvolutionDeriver.explain 演进（非八字段 payload 回退读 reason+trigger 人工标注）；L1=tool-orch **37/0/0**+memory-os **34/0/0**+app **519/0/0**；变异 **G1/G2/G3 三门各一全杀**（门 1 失明→双红/抵消放行→M3 红[全拒门反向实证]/伪装自动→红）；**flaky P2**：EvolutionLedgerTest X1-2 全模块高负载偶发红（单独跑 5 连绿）——时序断言脆弱建议 clock 参数化（与 60 功能面无关）；P3×2：A2-1b 组 3 构造未真验跨指标抵消（注释与构造不符）/「V-6 排首」为流程语义非代码强制 → **改造计划第一阶段⑥收口**，待审验员合 main】；【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG 7d35e3a）：feat/upg58 ac8d27d 基底 9c29ebb（main 顶 570c921=61 已合，tool-orch 无冲突）；五步链核物（chain 单入口零人工/fail-closed 五元 FiveTuple.validate+EvalFixtureVersionGuard 56 即插+M-4 逐元对账/baseline capture 无则采当前态/交叉对拍 predicted 未命中标记非复读/自动输出 manifest-<id>.md/Ledger evolution.BASELINE_CAPTURED+REGRESSION_EVALUATED actor=system-deriver——57 派生面跨单消费；gradle task :tool-orch:manifest）；tool-orch+app **77 套件 546/0/0**（ManifestChainTest **9/0**）；变异 M1 元对账失效→M4 红+M3v2 actor 越界→4 红连锁 ✅（M2 幂等变异未红 ⚠️ 测试本体断言完整 P3）；**五步链真实跑实测**：gradle 一条命令产出 baseline.json（五元+六指标）+manifest.md（delta 全 Δ0+regression_verdict: PASS 独立判定 M-5）+evolution.jsonl 两事件 ✅ → 待审验员合 main】；【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG ff888be）：feat/upg61 b7c2e9d 基底 4b5f65f；四范围核物全过（OnlyOnceTools 单源枚举[vault.get+browser.click/fillForm/login——头注含四 handler 源码行号核对 vault.get:3757 等+归一精确匹配+登记纪律]/弹窗层 only-once 只两键[rememberEnabled=false+autoRow 不渲染]/ApprovalService 三豁免全短路[turn/goal/remembered 均含 !onlyOnce——审计 allowed-once 与 handler 行为完全一致]/四 handler 一字未动）；全量 74 类 523/0/0（OnlyOnceGuardTest 4/0）+变异 U61-V1 复杀（去 !onlyOnce→remembered 命中仍弹测试红=伪放行复现）；L2 截图 P3（模拟器 Keystore 被 59 测试期间重置→旧密文解密 null logcat 实证+真机断连；弹窗层已有源码锚 JVM 锁定不阻塞判定——待 key/真机恢复补 only-once 两键 vs vault.delete 双勾选对照截图）→ 待审验员合 main】员；【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG 4bce784）：feat/upg59 8da2907 基底 main 8bcc167 顶（最新版纪律 ✓ rebase 零负担）；9 项核物全过（三分类+occurrences+evidence 行号/六字段 fail-closed/ACTIVE 才注入/3 条+600B 配额 overflowed 落库/排序确定性前缀恒定/LESSON decay=0 走 hash/互斥豁免/reevaluateBySourceHash/gold fixture）；全量 73 类 519/0/0（Distiller 9/0+Pool 6/0）+变异 3/3 亲杀（V4 去 ACTIVE 过滤→B5+B7 双红/V3b 加 applyLessons(pool) 写入口→B8 反射锚红/配额2 去条数上限→红）；指定复核：B2 证据逐行真回溯（行号-1+事实断言+≥3 抽验）+B6 端到端机制链（A 会话犯错→蒸馏→accept→B 会话注入含教训+seg==seg2 前缀恒定）+LESSON 豁免契约（5 条全 ACTIVE 实证）；L2 模拟器增强面可选未做=如实（JVM 机制链已全锚）→ **里程碑一就绪**（UPG-60 门 3 信号、UPG-56 fixture 反哺接续）】；【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG e937fb1）：feat/upg53 a665349 基底 ff23a88；八场景核物+全量 473/0/0+变异 V3/V4a/V7 三杀（gate 可记红/cred 进撤销窗红/拒绝静默放行红）；真机（现 build APK）：vault.delete ASK 弹窗全要素（🔒/人话/参数脱敏/双复选）+同意→allowed-once→凭据删除+记住复选 ☑ 实证+30s 自动取消 fail-closed+设置页安全状态行+模式切回 ask 持久化；**环境发现**：程序员遗留 never 未还原→恢复 open→首轮 vault.delete 走 FULL_ACCESS 直删（open 语义设计如此，已切回 ask）——**P2 建议**：open 模式凭据删除仍静默，建议 vault.delete/credDelete 入 isHighRisk；卡外 P1×2/P2×1 确认（allowed-goal 调度缺口/vault.set 免审批 L2 再实证/turn blast radius）→ 待设计师 rebase 16baca3 合 main】批次检轮接线断言口径+变异两条+L2 抽样 4 件；批 2 feat/upg01-b2 紧随施工中 ｜ ✅**C 批2 完成 @2026-08-29 15:52**（feat/upg01-b2 **d33c112** 已 push origin，基底 main 0fdfe87；browser 14 三件套[字段级中文描述 ≤15 字+output 声明实测返回键 snapshot=text,refs,docVersion 等 14 条+原 14 条一句话描述只增不改·差异点增句]；新增 tools/journal_freq_top.mjs 频次榜脚本[Token 拍板+批 3 排序轴输入，不新打点]；校准 ≈3.2 分钟/工具→批 3 约 116 工具估算 6~10h 净施工建议拆 3~4 子单；测试=BrowserToolsMetaTest 6 用例+变异两条亲杀+L1 全量 51 类 368/0/0+1跳过（rm -rf 强制重跑）+assembleDebug 绿+check-token-effect 过；批 2 分支内 AI 面 token 无变化[取值链接入在批 1 分支，合 main 汇合]；报告 DELIVERY_UPG01_批2_2026-08-29.md；已登记两个表）——批 1+批 2 合 main 后 UPG-27 开工前置解锁 ｜ ✅**验收员批1+批2 通过 @2026-08-29**（批1：L1 369/0/0 亲跑+变异两条亲杀+L2 抽样[MOV-Boot 回落清单在+MCP 三件 desc 真/schema 字段级/两面同投影实证]；批2：browser14 三件套抽查对实现[snapshot/click/fillForm/login 返回键逐键对上]+只增不改前缀固化+变异两条+368/0/0；观察项：MCP 循环单点无 L1 锚留批 3 补、browser 热挂载面模板串留批 4 清偿；ACCEPTANCE_LOG 落档）→ ✅**审验通过 → 已合 main @2026-08-29**（程序员代行设计师：批1 rebase 后 ff-only **107f9c2**、批2 rebase 后 ff-only **70ebb8e**，均已推 origin；合前全量闸 批1 51类369/0/1、批2 52类375/0/1 绿；worktree mov-upg01/mov-upg01-b2 可收；**UPG-27 开工前置就此解锁**） ｜ ✅**C 批 3-1 完成 @2026-08-30**（feat/upg01-b3-1 **b748d63** 已 push origin，基底 main 31769a0；五件全交：①**hostToolMetaB1** 新建 meta/HostToolMetaB1.kt——34 工具三件套（desc 20-60 字+近邻差异点、字段级 schema ≤15 字/字段、output 顶层键），派单附录 A 清单对账锚入测试，全部查 handler 实证 ②**MainActivity 聚合**：buildToolRegistry 增 host 参数（复用 metaView 零新投影）+ hostToolMeta 首并入；projectToolMeta 契约零变化 ③**output 首清偿 22**：DeviceProvider.ParamDef 增 output(13)+ObsidianProvider.OUTPUT_DECLS(7)+SceneTools.OUTPUT_DECLS(2 纯文本如实声明)，allOutput() 供 L1 ④频次榜跑通 emulator-5558（198 行/计数 1——数据稀疏按方案 §1.5 领域关键度兜底）⑤ToolMetaTest 7→10 用例（清单对账/三件套质检/接线回落清零/清偿 22 断言），**变异①desc 改占位必红②接线删 host 并入必红亲杀**；desc 字数断言亲杀纠偏 9 条超限+1 条不足后达标；L1 全量 53 类 **379/0/1跳过**（--rerun-tasks 真跑）+ assembleDebug 绿 + check-token-effect b748d63 过；Token 申报=AI 面 +34 工具 ≈2.5-3.2K token/轮（推导，实测校准留 L2）；登记债 118→余 84 待 B3-2/3/4；本单挂账 0 条；报告 DELIVERY_UPG01_批3-1_2026-08-30.md；已登记两个表）——待验收员 L1 复核+L2 抽样 4 件；B3-2/B3-3 可并行认领 ｜ ✅**C 批 3-2 完成 @2026-08-30**（feat/upg01-b3-2 **209d191** 已 push origin；**基点注记**：基于 B3-1 最新 f6a6a53（B2 复用 B1 的 HostToolMetaEntry/hostParamSchema/hostNoParams 共享类型——B1 补 f6a6a53「hostNoParams 升 public」；B3-1 合 main 后 B3-2 可干净 ff/rebase）；26 工具三件套全交：biz 13（onboard 六步流程差异/booking/task）+ workflow 3 + vault 8（get 审批门控语义、peek uiOnly 区分、setPhoto/scanPhoto 与 camera.* 边界）+ credential 2（getKey 脱敏语义），desc 20-60 字+字段级 ≤15 字+output 顶层键全 handler 实证（:2579-3480；bizHttp 透传=ok+业务 JSON）；**不碰 MainActivity**（聚合 B3-1/B3-4；投影验证先行=对齐 B1+B2 合并 registry 26 全命中）；ToolMetaTest 10→12 用例（清单对账/质检 + 投影验证/回落清零），**变异①desc 改占位②host 只并 B1 均必红亲杀**；desc 断言亲杀纠偏 12 条后达标；L1 全量 53 类 **381/0/1跳过**（--rerun-tasks 真跑）+ assembleDebug 绿 + check-token-effect 过；Token/KV 申报=**不变**（本单零装配变更，30+26 并入总账留 B3-4 收口统一实测）；登记债 84→收口预测 58；挂账 0 条；报告 DELIVERY_UPG01_批3-2_2026-08-30.md；已登记两个表）——待验收员 L1 复核+L2 抽样；B3-3 可并行认领 ｜ ✅**C 批 3-3 完成 @2026-08-30**（feat/upg01-b3-3 **e20f03c** 已 push origin；基点=B3-1 最新 f6a6a53；34 工具三件套全交：md 2/note/text2image/image 2/pdf/http 3/spill 2/shell/causal 3/error 2/battery/bluetooth/brightness 2/**screen.on（desc 豁免清单，方案 §1.4 件 7）**/torch 3/vibrate/volume 2/wifi/silent 2/notification/**xiaomi.assist（disabled：只登记名+附注，handler 固定拒绝实证）**；desc 20-60 字+字段级 ≤15 字+output 顶层键全 handler 实证（FileTools/HardwareProvider/SystemControlProvider/AgentEssentialTools/ArchMcpTools/MarkstreamMcpBridge/TorchProvider）；**本单为批 3 唯一 cond 非 none**——hardware 5（torch 3/vibrate/bluetooth，模拟器跳过、验收员挂账真机补验）+disabled 1+desc 豁免 1（清单随报告）；不碰 MainActivity（聚合 B3-1/B3-4；投影验证先行 host=B1+B3 34 全命中）；ToolMetaTest 10→12 用例（清单对账含豁免逻辑/质检 + 投影验证），**变异①desc 改占位②host 只并 B1 必红亲杀**（先 commit 后变异，checkout 恢复安全）；desc 断言亲杀纠偏 15 条+类名笔误编译亲杀修正；L1 全量 53 类 **381/0/1跳过**（--rerun-tasks 真跑 43 tasks）+ assembleDebug 绿 + check-token-effect 过；Token/KV 申报=不变（零装配变更，总账留 B3-4 收口统一实测）；登记债→收口预测 24；挂账 0 条；报告 DELIVERY_UPG01_批3-3_2026-08-30.md；已登记两个表）——待验收员 L1 复核+L2 抽样（hardware 5 项 ⏳ 真机补验不阻塞） ｜ ✅**C 批 3-4 完成 @2026-08-30【批 3 全收口】**（feat/upg01-b3-4 **3f118ae** 已 push origin；基点=main 3263f10+merge feat/upg01-b3-2——**B3-2 未合 main，分支内已对齐 B2**（合批顺序：B3-2 先合 → B3-4 rebase 后 B2 变更归零）；24 工具三件套全交（market 7 透传面/marketAdmin 3 运营口令风控/ui 页面桥 11/permission.mode+presentation.mode+approval.getMode 3 只读——「只读，改走 UI」差异点全按附录 B）；**批 3 聚合收口：hostToolMeta=B1+B2+B3+B4**；**收口断言**：四表并集==keys 118 无缺漏（不变量式）+重复键检测+全在 mcpHandlers 字面注册+**回落=0**+metaConflicts 零冲突+**生产聚合接线锚**（变异①desc 改占位必红②host 聚合缺表必红——**首验②漏网，测试盲区=只测测试内 registry 未验生产聚合；补源码接线锚后必红**）；ToolMetaTest 10→16 用例全绿；desc 断言亲杀纠偏 11 条；L1 全量 53 类 **386/0/1跳过**（--rerun-tasks 真跑 43 tasks）+assembleDebug 绿+check-token-effect 过；**Token/KV 收口总账申报=+8~11K token/轮**（118 工具全量真描述，推导上界，真机装配快照实测留 L2——超上界触发常用集裁剪拍板）；**登记债收口达成：回落=0**；挂账 0 条；报告 DELIVERY_UPG01_批3-4_2026-08-30.md；已登记两个表）——待验收员 L1 复核+L2 抽样（含收口回落实机数核对） ｜ v2.2 底（评审#4 §九 闭环：用户可见性矛盾消除[本单只做 AI 面+MCP 面，市场展示另立单]/唯一计数表/批级棘轮/补丁位合并语义/真无参区分/Token 账重报/browser 提为批 2 校准批/批 4 裁决 McpExtDiscovery 活路+McpToolProvider 归 UPG-18 删） ｜ 历史勘误：2026-08-27 设计师勘误：原状态「程序员✅修复完成」为误登记——无 feat/upg01 分支、无交付报告、工单表程序员列=待派单，实物证明从未施工，以表为准纠正 ｜ ✅**批3-1+批3-3 已合 main @2026-08-30**（c69fa1f/b0e2d86/1e79dfa 已推 origin；hardware 5 真机补验挂账在案[挂账登记表:211]；批3-3 证据目录缺失[审验员注]待落盘） ｜ ✅**批3-2+批3-4 已合 main @2026-08-30**（设计师合批 654c88f 已推 origin；**§六 合前抽查**：合批提交 654c88f 与受验树 3f118ae 零差异（`git diff 3f118ae 654c88f` 空）+ 聚合接线 MainActivity.kt:354-355 hostToolMeta=B1+B2+B3+B4 四表并集在码（meta/ 目录 HostToolMetaB1-4.kt 齐）+ 合后全量 386/0/0+1跳过 与审验员 L1 数字一致；批3 聚合收口闭环回落=0；**Token/KV 上界 +8~11K/轮 L2 真机快照补验在册不销**；批3-2 证据目录缺失待程序员补证） ｜ ✅**C 批4 R1 修复完成 @2026-08-30**（feat/upg01-b4 **6aaa1fc** 已 push origin[force-with-lease 覆盖 5f5219c；rebase 至 main 8f8debd——前段 cde86ac+后段 45f5e20+修复]；P1 打回修复[挂账-upg01批4-agent面ext元数据断链，验收 L3]：①@Volatile extToolMetaMap 成员[外部发现挂载 ext.meta+mountExtTools meta 非空并入] ②rebuildAgentTools ext.* 前缀走 extToolMeta 三态[外部元数据→登记层→外部模板串]，宿主仍 projectToolMeta[「MOV 工具:」回落不混] ③ToolMetaTest 增接线锚[ext 分支先于宿主 indexOf 序/成员写入点两处/声明]④复验 L3 交验收员[AI 带参调用 ext.* 真描述]；L1 全量 **55 类 409/0/0**+定向 22 用例+变异[改回恒 projectToolMeta 必红]亲杀+assembleDebug 绿+check-token-effect 过；Token/KV 0/0；报告 DELIVERY_UPG01_批4_R1_2026-08-30.md；已登记两个表）——待验收员 L3 复验[真机 AI 对话 ext.* 带参调用+arguments 非空+journal]后销挂账 ｜ ✅**C 批 4 完成 @2026-08-30**（feat/upg01-b4 **8cf7a2f 前段 + 5f5219c 后段** 已 push origin，基底 main 801b8fc；六件全交：①McpExtDiscovery Result.meta 补传（name→(desc,inputSchema)）+metaOf 结构校验[type==object 且 properties 为 map 才透传，非法整条回落——防非法外部 schema 污染 AI 面] ②死码删除[McpToolProvider.kt 文件+McpServer.registerMovQueryTools，grep 主源码零命中]+敏感黑名单镜像注释四处→三处 ③外部发现挂载点改三态投影 ④mountExtTools 三态回落[projectToolMetaOrNull 严格版真命中才非空+extToolMeta 外部元数据→登记层→外部模板串，两套回落不混]——browser 热挂载顺带吃登记层真描述 ⑤静态表日落[toolParamSchemas 67 条占位→emptyMap，前置核对 67 键⊆hostToolMeta 118 键差集为空；占位版 paramSchema/paramSchemaDesc 死函数删除；metaConflicts 零冲突] ⑥ToolMetaTest 增批4 5 用例[提取+校验/三态回落/死码零命中/挂载点接线锚/日落锚]；L1 全量 **55 类 408/0/0**+定向 21 用例+**变异 3/3 亲杀**+assembleDebug 绿+check-token-effect 过；Token/KV 申报已在两 commit 报齐；报告 DELIVERY_UPG01_批4_2026-08-30.md；已登记两个表）——待验收员 L1 复核+变异三条+L2 真机[外部 tools/list curl 实证 desc/inputSchema 非空+browser 安装后 agent 面 desc 真描述]+L3 journal；**批 4 全收口：MCP 面收口+外部发现路径+静态表日落闭环**【✅ 验收员批4 @2026-08-30（ACCEPTANCE_LOG UPG-01 批4）：L1 ✅ 55 类 408/0/0+1跳过 独立复跑+ToolMetaTest 21+变异3/3亲杀+静态表日落 67⊆118 差集空独立复核；L2 ✅ 真机（21770d7d：外部 mock MCP tools/list desc 真描述+inputSchema 非空；browser 真实 UI 安装后 mcp__browser__* 14 工具真描述；全量 158 工具模板串 desc **0 残留**）；**L3 ❌ 打回**——发现 P1「Agent 面 ext 工具元数据未接 extToolMeta」（rebuildAgentTools 走 projectToolMeta 非严格版 → AI 收「MOV 工具: ext.MockServer.echo」+空 schema，真机 AI 两次调用 args 均 {}，AI reasoning 原文「没有参数定义」）→ 挂账-upg01批4-agent面ext元数据断链（P1 待设计师验证转工单；修复方向=extMetaMap+rebuildAgentTools 投影 extToolMeta?:projectToolMeta+ToolMetaTest agent 面接线锚；修复后复验 L3）】【✅ 验收员 R1 L3 复验通过 @2026-08-30（ACCEPTANCE_LOG 6574b93）：干净流程（mock+force-stop 重启+新对话）——MOV-Boot 工具面 156→158；journal tool/call ext_MockServer_hello {"who":"Galaxy"} → tool/result mock-hello:{"who":"Galaxy"}（isError=false）带参+真执行+回显全链闭环；此前 3 连空参=环境未干净复现的伪失败——**R1 修复实证 ✅ · 批4 整体验收通过 → 待设计师合 main（rebase 8f8debd 快进）→ 审验员**；挂账-upg01批4-agent面ext元数据断链 销项】【✅ 验收员 R1 复验 @2026-08-30（ACCEPTANCE_LOG UPG-01 批4 R1）：代码层 ✅（55 类 409/0/0+ToolMetaTest 22+变异亲杀 R1 锚必红）；**真机 L3 ❌ 未闭环**——AI 对 ext_MockServer_hello 仍 3 连 arguments={}（含明确带参指令），同会话 host 对照 obsidian.file.search 带参正常（{"keyword":"..."}）→ 模型行为正常、空参特定于 ext 工具=R1 运行时效果未实证；**维持打回**，R2 建议=补「rebuild 后 ext.* 条目 desc/schema 摘要」可观测日志定位中断环节（extToolMetaMap 空/发现块 rebuild 异常吞/适配器 tools 过滤候选）→ 复验 AI 带参+journal+回显】【✅ hardware5 真机补验销项 @2026-08-30：torch 状态机闭环/bluetooth 权限链/vibrate 硬件剔除（21770d7d，证据 验收员\证据数据\UPG01批3-3\ + ACCEPTANCE_LOG 批3-3 §5）】｜ ✅**批4 已合 main @2026-08-30**（设计师 merge c753e8a[含 6aaa1fc R1修复]，§六 抽查：L3 ext.MockServer.hello 带参闭环；push origin；worktree mov-upg01-b4 可收；**UPG-01 全批 1-4 全部合入主线**）
｜ **优先级**：P1

## 标题

全量工具元数据补全：元数据登记层 + AI 面接线（对齐 dsh 参考实现三件套）

## 背景（v2 重测基线，v1 实测三处错两处已纠正）

AI 面工具 schema 的消费点是 `MainActivity.kt` `rebuildAgentTools()`（:5315-5323）——把**所有**工具 description 覆盖成模板串 `MOV 工具: $name`，各文件已有真描述在 AI 面全部丢弃；参数 schema 来自 `toolParamSchemas`（:177-253，~60 条），字段描述填成参数名；不在表里的工具（全部 14 个 browser + ~50 个宿主工具）拿空 properties。宿主工具面 ~121 处 `mcpHandlers` 注册（:1155-2778）v1 完全没提。

源文件复核：`BuiltinMcpTools.kt` 共 5 工具、5/5 有真描述（v1「仅 5 条」是全部）；`BrowserMcpTools.kt` 14/14 有一句话描述，缺的是字段级描述（参数名占位）+ output；`dsh/tools/Tools.kt` 是**纯契约类型文件，注册工具数 = 0**（v1 误列为工具面）。MCP 面同样模板串（:2856-2860/:2882/:4019）；`registerMovQueryTools()`（:234）从未被调用；市场包级 desc 有、工具级详情缺位。

**结论**：问题属实且比 v1 更严重（~110 工具 AI 面全模板串），但靶点 = 登记层 + rebuildAgentTools 接线，不是补那三个文件。

## 验收标准

- **L1**：`ToolMetaTest` 遍历**登记层 + rebuildAgentTools 投影输出**：description 非空/≥20 字/无占位；inputSchema 每字段有中文 description；output 声明非空；AI 面任一工具 description ≠ 模板串（接线断言）。变异：登记层描述改占位 → 必红；接线改回模板串 → 必红。
- **L2**（真机）：`emulator-5556` 能力/工具详情面显示真描述 + 参数说明 + 返回说明（截图入 `docs/ACCEPTANCE_LOG.md`）。
- **L3**（AI 实证）：AI 读取描述后正确选参，journal 可查；禁用假覆盖。

## 红线

- 不改工具行为/调用签名；`McpServer` 方法签名不可变。
- 描述必须真实（字段语义查源码核实）；拿不准标「待核实」进挂账登记表，禁止编造。
- 现有 5 条已验收描述只增不改（除非事实性错误）。
- 登记层与 rebuildAgentTools 接线**同批交付**（只补不接 = 白做）。
- 遵守「请求前缀恒定」：本单不得新增 tools 字段会话中途变动点。
- 交付必含 Token 影响 / KV Cache 影响两节申报（AGENTS.md 硬规则 1），自跑 `node scripts/check-token-effect.mjs`。

## 方案文档

`设计师\方案设计\UPG-01_全量工具元数据补全_方案.md`（v2：批次重排为 ①登记层+AI 面接线 ②宿主工具 ~121 条 ③browser 字段描述+output ④MCP 面/市场详情；描述上限收紧 60 字）

---

## 派单交接段（程序员领单时按此执行）

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：工单表该行备注追加 `认领: <agent> worktree=mov-upg01 branch=feat/upg01 @<时间>`（worktree 命名强绑定工单号）。
2. 施工范围：按方案文档四批执行（批 1→批 4 顺序，每批独立可测）。
3. **完成后必须登记两个表**（先表后库）：
   - `工单表.xlsx`：程序员列 `✅完成`，备注列 `feat/upg01 <hash>（报告 DELIVERY_UPG01_*.md）`；
   - `工单库.md`：本单状态改为 `程序员✅完成，待验收`。
4. 交付报告落点：`程序员\交付报告\DELIVERY_UPG01_*.md`；报告里明确写「已登记两个表」。
5. 全部产物（源码/测试）提交主仓库 `0027-mov` 分支 `feat/upg01`，交付时报 hash。

---

# UPG-02 设备类工具包迁移（AVD 内置 device.*/sensor.* 非敏感子集）
**分类**：M4 工具/MCP 集成


```status
phase: merged
branch: feat/upg02
head: f1fba06f
std: —
delivery_id: —
designer: ✅ 方案v2(溯源修正)
dev: ✅**M3-R2 三件修复完成 @2026-08-29**（feat/upg02 **5c113cb** 已 push origin，基底
inspector: 🔨**M3 接线补救局部打回→M3-R2 排期（设计师定夺 @2026-08-29）**：M3（70db6c6）验收 L1 全实证通过+真
merge: ✅**M3-R2 复验+审验通过 → M3+M3-R2 已合 main @2026-08-29**（验收员复验②：capture 真机 PN
actor: sys04-backfill
updated_at: 2026-09-05T08:42:06
```

**状态**：✅**已合 main @2026-08-29（merge 8a205d6 已推 origin）——UPG-02+04 合并单全链闭环**（审验员逐项独立实证确认验收可信；设计师合前抽查：merge-base=2648c83 基线干净、落档 012784e 纯追加、冲突 2 文件按预告口径解[双侧相邻新增均保留、SceneTools+usage.summary+DeviceProvider 三方并存、usage.summary 单份防重复]、**合后全量亲跑 46 类 323/0/0 绿**；不阻塞注记：工单表错行修复归验收员、逐工具 journal/L3 obsidian ASK/Token 回填三项补验在册销项前须闭环）｜ 原登记：✅程序员完成 @2026-08-29 02:55（合并单 UPG-02+04，feat/upg02 **55f9730 已 push origin**；基线=main 2648c83 含 UPG-07 批 1 验收；**接线四点**：装配循环 13+7 handler/schema 随 Provider[DeviceProvider.allMeta+ObsidianProvider.allMeta+SceneTools 三方 merge]/权限名单[写类 12 ASK+查询类 8 harmless]/isHardwareTool+ToolRegistry 并行 8 项；**黑名单四处镜像对齐+等价变体**[sms.recent/contacts.search/location.get]；**命名避让**无害子串断言；捕获管道桥[TakePicture 分流 camera/ocr/qr latch 解码+MediaProjection 单帧 FGS ScreenCaptureService]；**ObsidianProvider SAF 7 工具**[detect 引导/register 持久化/check/rescan 索引/file.read/write/search；sanitizeSegments 沙盒 .. 穿越拒；prefs 单写点+persisted 校验 MIUI 兜底]；L1 全量 **288/0/0**+契约 8 案+变异 2/2[写类漏登记红/沙盒 .. 退化红]；**L2 装机互踩转复核**[模拟器与 C 的 UPG-05 互踩实录]；L3 emulator-5558[已配 key]待跑；Token 申报：20 schema 新增量级待 check-token-effect 实测[报告内]；报告 DELIVERY_UPG02_04_*.md）｜ **原状态**：✅方案 v2.1（溯源修正+拍板收口+大神速览），🔨**已派单待认领 @2026-08-29（UPG-04 并入合并施工，用户拍板）**——合并派单文本 设计师/派单/UPG-02+04合并_派单_2026-08-29.md（共享 MainActivity 装配区：一次接线/一次 Token 申报/一次验收；串行约束：占装配区期间 UPG-07 不开工）；接线样板=UPG-03 已闭环实物 ｜ **优先级**：P0 ｜ **出单人**：设计师 ｜ **日期**：2026-08-26（v2 修订 2026-08-28）
｜ ✅ 方案v2(溯源修正)
｜ ✅**验收员通过 @2026-08-29**（UPG-02+04 合并单独立复核：L1 42 类 288/0/0+变异 M1 写类漏登记/M2 沙盒穿越亲杀+安全面四项实证+真机审批闸/拒绝语义抽验）→ **待审验员 → 设计师合 main**；ACCEPTANCE_LOG 012784e；待补验：逐工具 journal/L3 obsidian ASK/Token 回填
｜ 🔨**M3 接线补救局部打回→M3-R2 排期（设计师定夺 @2026-08-29）**：M3（70db6c6）验收 L1 全实证通过+真机 obsidian SAF 全链/usage.summary 达成，**screen.capture ❌打回**（双根因设计师复核属实：ScreenCaptureService.kt:58 createVirtualDisplay 前未 registerCallback[API 34+ 强制]；pending 全仓零赋值结果回填断链）。**定夺：不另立单，M3-R2 续作 feat/upg02（原施工人）三件**——①capture 双根因修复 ②approval.setMode 收编 uiOnlyMcpTools（验收附带发现 P1 安全口，设计师实证：MainActivity.kt:56-59 名单无此项、:2188 handler 在、:3281 过滤名单不含 → MCP :8389 面公开可自助切 never 绕过全部写类 ASK，与 :54 铁律注释自相矛盾）③obsidian.file.read 未授权文案（P3，:135 前置 vaultRoot 判空走 :99 同口径引导文案）；复验范围=三项+L1 全量，销项条件见挂账表 M3 条目｜ ✅**M3-R2 三件修复完成 @2026-08-29**（feat/upg02 **5c113cb** 已 push origin，基底 70db6c6 续作：①screen.capture 双根因——registerCallback 前置[API 34+ 强制]+授权分支桥接 ScreenCaptureService.pending[pending 零赋值回填断链修复，deliver complete 后置空] ②approval.setMode 收编 uiOnlyMcpTools[防 MCP :8389 远程自助切 never 绕过全部写类 ASK] ③obsidian.file.read 三态文案[未登记→detect 引导/权限被回收→重新授权/才轮到文件不存在]；测试=DeviceObsidianContractTest +4 锚断言[活行断言防「注释掉」变异逃逸]+变异亲杀 4/4+L1 全量 42 类 293/0/0+1跳过[rm -rf 强制重跑 XML 逐件统计；47 类 338 为 feat/upg23 树口径不混用]+assembleDebug 绿；报告 DELIVERY_UPG02_M3R2_2026-08-29.md；已登记两个表）——待验收员复验三项+L1 全量（obsidian SAF 全链免重复已达成）｜ ✅**M3-R2 复验+审验通过 → M3+M3-R2 已合 main @2026-08-29**（验收员复验②：capture 真机 PNG 真实落盘/setMode tools/list 无口强呼 TOOL_NOT_FOUND/file.read 三态达成，查验员逐项亲核确认；设计师 §六抽查：M3R2_17 产物 PNG 真实截屏亲核、tools/list 三模式工具零命中+device.network 对照在面亲核；rebase 后 ff-only **f1fba06 已推 origin**；合批后全量亲跑 50 类 362/0/0+1 跳过绿；**M3 P1/approval.setMode P1/file.read P3 三挂账销项**，观察项[capture 等待窗口偏紧/hasLiveLine 块注释小口子/file.read 回收中间态真机受限]在档不阻塞）——UPG-02+04 合并单全链彻底闭环

**背景（v2 基线修正）**：老版设备工具实测 **36 个**（非 v1 的 34）；新版实有 16 注册/15 可用设备 handler（非 v1 的 6 个；v1 声称的网络/TTS 不实）。规则 20 溯源首跑：v1 注册接点指向孤岛（McpToolProvider 零生产实例化）+ 5 项与新版重复建设 + screen.capture 虚有（新版没有，真缺口）。

**方案（v2）**：真缺口 13 个（device.network/storage/toast/appList/appLaunch、sensor.list、camera.capture[重写]/camera.ocrCapture[新造]/qr.scan[新开发]、calendar.list/add、device.timer[落盘补强]、screen.capture[重写]）；**重复 5 项放弃迁移沿用现有**（用户拍板：battery/volume/brightness/vibrate/notify）。形态=常驻直挂工具面不进市场。实现=`class DeviceProvider(ctx)` 照 HardwareProvider 范式（**禁照 SceneTools object 单例**），接线四点配套（mcpHandlers 段+toolParamSchemas+权限名单+isHardwareTool）。

**红线**：写类必须登记 writeTools——漏登记走 else 静默 ALLOW（McpToolScheduler.kt:187-188 陷阱，验收变异钉死）；产物只落 filesDir；黑名单四处镜像先对齐再同步（内容已不一致+子串/精确匹配语义不同）。

**验收**：L1 契约+变异（含写类漏登记必 ASK 变异）；L2 真机逐项+ASK 弹窗+产物落 filesDir；L3 对话真实 tool_call。详见 `设计师\方案设计\UPG-02_设备类工具包_方案设计.md`（含分层溯源图）。

**施工规矩**：认领/登记/交付同 UPG-01 卡五条（worktree=mov-upg02 branch=feat/upg02）。

---

# UPG-03 生活场景工具（12306 内置；地图线已删）
**分类**：M4 工具/MCP 集成


```status
phase: merged
branch: feat/upg03
head: e3ea8122
std: —
delivery_id: —
designer: ✅ 方案v2(溯源修正)
dev: ✅C 完成（feat/upg03 e3ea812）｜ 设计师/方案设计/UPG-03_生活场景工具_方案设计.md
inspector: 验收员通过 @2026-08-29 凌晨（
merge: ✅**已合 main @2026-08-29（merge 198e26f 已推 origin）｜UPG-03 全链闭环**（审验员五步独立实
actor: sys04-backfill
updated_at: 2026-09-05T08:42:06
```

**状态**：✅**已合 main @2026-08-29（merge 198e26f 已推 origin）——UPG-03 全链闭环**（审验员五步独立实证确认验收可信；设计师合前抽查：落档 ad7f092 纯追加合规、接线四点在码、站表 f[2] 修复在码、合并树与 270/0/0 受验树代码零差异；Token/KV 口径按审验注记补正入方案 §七）｜ 验收员通过 @2026-08-29 凌晨（独立复核全过：L1 `--rerun-tasks` 40 类 270/0/0 吻合+变异 M1 删接线/M2 站表退化/M3 删 schema merge **三杀亲证**+还原基线绿；L2 真实查票独立复现——北京→上海 2026-08-30 **55 趟全真实数据**[G531 商务座 8 ¥2315 与申报逐字吻合，@Ignore 已还原]；L3 真机 tool_call 链铁证[logcat：AI 编排 date+scene_stationLookup×2→站表 3384 站→scene_trainQuery 风控拦截 SOURCE_DOWN×2 重试轮换→对话流降级文案引导官方渠道]；失败归因=模拟器代理触发 12306 风控属环境限制，L2 成功面已覆盖同函数链；权限归因=harmlessTools 名单不含 scene.* 走 else→ALLOW 实证）｜ 原登记：✅程序员完成（feat/upg03 e3ea812，基线=main+upg16 挂账基建 433a0b1；L1 全量 270/0/0（--rerun-tasks）+ **接线断言变异 3/3**（删接线/站表退化/删 schema merge 各必红）+…｜ACCEPTANCE_LOG ad7f092）
｜ **优先级**：P0｜ ✅ 方案v2(溯源修正)｜ ✅C 完成（feat/upg03 e3ea812）｜ 设计师/方案设计/UPG-03_生活场景工具_方案设计.md
> **遗留跟进（另单/另线，不在本卡）**：官网 12306 卡回补（S-08 撤卡遗留，接线已通过→可回补）；挂账-模拟器AI未回复（P1，L3 在模拟器代理环境受风控限制，真机环境补验走该挂账）。

**背景（v2 基线修正）**：老版 12306 实测 **8 工具**（非 6/7，含 get-current-date）。**地图线已删**（用户拍板 @2026-08-28——溯源实证老版 saveAk/init 零调用方、KEY 从未可配置、地图工具实践中从未可用，属新建设非迁移）。新版 SceneTools.kt 2 工具在库（bce578d 含契约测试）但**孤岛未接线**。

**方案（v2）**：12306 单线 2 工具（scene.trainQuery/scene.stationLookup）。施工核心=**L4 接线**（MainActivity.kt:3121 迭代追加 SceneTools.all()+toolParamSchemas 同步）+**站表疑似 bug 随单修**（SceneTools.kt:50-57 取 f[0] 当电报码 vs 老版正确取 f[2]，不修查票必败；server.mjs 同款在 S-06 挂账不动）+错误分类三态移植+MCP_TOOL_DEV_GUIDE 风控节补写（挂账 :41 随单销）。

**红线**：12306 必须 App 内置（数据中心 IP 风控 5/5 实测，server 化已废弃）；权限归因写对（scene.* 走 else ALLOW 非 harmless 名单）。

**验收**：L1 契约+变异+**接线断言**（SceneTools.all() 生产迭代点存在，防「函数在链断」）；L2 真机真实查票（天然互锁站表 bug 修复）；L3 对话真实 tool_call；接线通过后官网 12306 卡回补（S-08 撤卡遗留）。详见 `设计师\方案设计\UPG-03_生活场景工具_方案设计.md`。

**施工规矩**：认领/登记/交付同 UPG-01 卡五条（worktree=mov-upg03 branch=feat/upg03）。

---

# UPG-04 Obsidian 工具包迁移（AVD 内置 obsidian.*，SAF 通路）
**分类**：M4 工具/MCP 集成


```status
phase: merged
branch: —
head: —
std: —
delivery_id: —
designer: 拍板收口+大神速览）
dev: ✅C 完成（并入 UPG-02 合并单，feat/upg02 55f9730 已推）
inspector: ✅ 验收通过（并入 UPG-02 合并单验收）｜ 设计师/方案设计/UPG-04_Obsidian工具包_方案设计.md→ 已合 main@
merge: 已合 main@2026-08-29（merge 8a205d6 已推 origin；随 UPG-02 合并单｜obsidian.* 工具面
actor: sys04-backfill
updated_at: 2026-09-05T08:42:06
```

**状态**：→ ⚠️ **降级登记 @2026-09-02**（用户裁定：第三方笔记工具 MCP 集成——非主线/无安全红线→P0 降 P2，按 README §五影响面标准）｜ ↪**已并入 UPG-02 合并施工 @2026-08-29（用户拍板）**——本卡销（方案文档保留为合并单子方案；施工/验收/登记走 UPG-02 主卡）；**✅随合并单合 main @2026-08-29（merge 8a205d6 已推 origin）**；原方案 v2.1（溯源修正+SAF 拍板收口+大神速览） ｜ **优先级**：P2 ｜ **出单人**：设计师 ｜ **日期**：2026-08-26（v2 修订 2026-08-28）
｜ ✅C 完成（并入 UPG-02 合并单，feat/upg02 55f9730 已推）｜ ✅ 验收通过（并入 UPG-02 合并单验收）｜ 设计师/方案设计/UPG-04_Obsidian工具包_方案设计.md→ 已合 main@2026-08-29（merge 8a205d6 已推 origin；随 UPG-02 合并单——obsidian.* 工具面在 main：HostToolMetaB3/ToolSdkGenerator；本卡销——并入合并单，方案文档留档）

**背景（v2 基线修正）**：老版 11 工具全实物（ObsidianToolProvider.java:128-465）。v1 致命断点在 L3：**新版 manifest 无任何存储权限**，File API 够不到真实 vault。用户拍板 @2026-08-28：**SAF 授权目录通路**（MANAGE_EXTERNAL_STORAGE 永久排除，应用宝整改期合规红线）。**skill×4 不迁**（_mov/skills 消费方为零、assets/skills 是另一套 .skill 存储——迁价值链=全新建设，另立单再议）。

**方案（v2）**：缩圈 vault×4+file×3=7 工具。SAF 通路：detect=引导 ACTION_OPEN_DOCUMENT_TREE（非全盘扫描）、register=持久化 URI 权限+prefs 单写点、读写走 DocumentFile。沙盒内核移植老版 ObsidianVault.resolve（逐段 canonical+symlink 检测，:135-164）。rescan 权限**修正为 ASK**（v1 标 harmless 是静默降级）。note.create 边界：临时便签 vs vault 知识沉淀（写进 description 防意图漂移）。呈现=仅对话内可见不上市场卡。journal 记账本期声明放弃。

**红线**：禁照 SceneTools 骨架（孤岛前科）；接线四点配套；obsidian.file.write 不进 harmless（goal 模式自动放行风险）；沙盒穿越必拒。

**验收**：L1 契约+穿越拒绝+变异（rescan 权限级变异必 ASK）+接线断言；L2 真机 SAF 授权全链（测试 vault 放 filesDir/Download，**非 assets 只读**）；L3 对话真实 obsidian.file.write。详见 `设计师\方案设计\UPG-04_Obsidian工具包_方案设计.md`。

**施工规矩**：认领/登记/交付同 UPG-01 卡五条（worktree=mov-upg04 branch=feat/upg04）。


---

# UPG-05 记忆体系回补
**分类**：M6 记忆/知识


```status
phase: merged
branch: feat/upg05
head: 35e03fcd
std: —
delivery_id: —
designer: 方案v5.3(打回修订)｜ 设计师/方案设计/UPG-05_记忆体系回补_方案设计.md
dev: 重修完成@2026-08-29（feat/upg05 e595 前后 8eae1cb→d147292：D1/D2 入口归位[native …
inspector: ✅**验收员 R1 复核通过 @2026-08-29（打回三条全闭环 + E/R 行为面主判据达成）**：D1 native Setting
merge: ✅**设计师合 main @2026-08-29（merge 66244f4，合后终态 5170421 全量亲跑 45 类 316/0/0
actor: sys04-backfill
updated_at: 2026-09-05T08:42:06
```

**状态**：✅**验收员 R1 复核通过 @2026-08-29（打回三条全闭环 + E/R 行为面主判据达成）**：D1 native SettingsSheet「信息管理（记忆）」行真机打开 MemoryPageActivity（与「我的信息」解耦）/D2 独立入口确认/D3 save 免批（harmlessTools 归位+PermissionGuardTest v5.3 口径）全剧零弹窗；机制面维持全过（297/0/0+变异 6/6+instrumented 4/0）；E/R 行为面 **E1×3/E2×3/E5×2/E4+R1×1/R3×1 全过**（E1 cover 注入跨 session 实证「避开花生」三细节+E2 跨房间元帅+E5 得体性零复述+E4/R1 移除后 memory_search 不含已移除条目[tombstone 三面真机实证]）；E3+R2 行为面待补验（失败场景制造受限，机制面变异⑥已钉死不阻塞）；R3 边界案报设计师释法（字面出现元帅/意图未嫁接判过）→ 审验确认真实可信（顺带实证 save 双名单=R1 后口径一致、writeTools 内 save 系 main 同病冗余死项非 R1 引入）→ ✅**设计师合 main @2026-08-29（merge 66244f4，合后终态 5170421 全量亲跑 45 类 316/0/0 绿，feat/upg05 已补推 origin）**｜ 遗留（挂账在册、不阻塞本单）：①**P1 装配路径 COVER_HIT 打点断线**——MainActivity.kt:3553 注释承诺「turnId=cover-<指纹> 整段计 1 次」但装配注入全链无 recordCoverHits 调用（唯一调用者=AI 显式调 memory.cover）→「下轮 cover+1」生产路径不发生、晋升流量枯竭，死穴 1 只修一半；修法约十行在挂账表（currentCover 命中处补打点 + L 组补「装配注入→ref 增长」断言），派单前走规则 21 溯源复核 ②E3+R2 行为面待补验（验收员持有项）③R3 边界案~~待设计师释法~~→**释法已出 @2026-08-29（判事实归属不判词面：挂错对象=失，归属正确或明示无记忆=过；验收员边界案判过成立）**，随 UPG-22 卡⑤发布入验收剧本 ④仓库卫生：tools/ 施工临时物（r1_test.cjs/robust_install.sh/wire_memory_host.cjs/fix_dispose.cjs，硬编码 mov-upg05 路径）→ 已并入 UPG-22 卡④捎清｜ 遗留①③④处置：**已转工单 UPG-22（P1，2026-08-29 出单，待认领）**｜ 打回史：✅程序员 C R1 重修完成 @2026-08-29（feat/upg05 e595 前后 8eae1cb→d147292：D1/D2 入口归位[native …｜ACCEPTANCE_LOG 2977a9e（打回）→ 76a1418（R1 复核通过）
**卡点**：已合 main @66244f4——遗留 P1 COVER_HIT 打点断线 + E3/R2 行为面待补验（挂账在册·不阻塞） ｜ 
｜ **优先级**：P0｜ ✅ 方案v5.3(打回修订)｜ 设计师/方案设计/UPG-05_记忆体系回补_方案设计.md

**背景（v2）**：新版 MemoryLifecycle 有晋升/衰减骨架，但实测两个死穴 v1 漏了：①`recordSearchHits/recordCoverHits`（MemoryLifecycle.kt:87-115）**全库零调用者** → 晋升链死、引用计数恒 0、草案 14 天全衰减（现状 = 手动草稿箱 + 自动清空）；②system prompt 无一字提记忆（老版每轮注入 memoryCover+基因，AgentLoop.java:1578,1630-1652），AI 不知道有记忆可用。v1 事实修正：memory.save/load/list/judge **已实现且入工具面**（MainActivity.kt:1563-1566），缺的只是 search/delete/cover。基因化/预算投影缺失同前（老版 MemoryGeneCompactor/UserGene/Journal memoryCover 在案）。

**方案**：①链路修通（补 search/delete/cover + **打点回调接线**[独立验收时刻] + prompt 注入位；dedupe key=(sessionId,memoryId,source) 跨 session 取 sum）→ ②基因层移植挂 curate 钩子（{k,s,a,source,updatedAt}+规则推导 confidence；AVOID 语义过滤 + occurrences≥2 才注入）→ ③预算投影（MemoryCover=Snapshot，显式移除=唯一合法 invalidate；maxItems+maxLength 暂按 char 计）→ ④**记忆显化页**（v3 并入、v5 改依赖全局聚合而非基因化：draft 折叠临时摘要，分层展示+「移除」）→ causal **移出本单**（转后续单 P1/P2）。

**红线**：基因只渲染不渲染原文；投影只改读侧不删原文；不破坏现有 Lifecycle 语义；prompt 注入会话开始定型（前缀恒定）。

**决策点**：见设计文档§六——v5 收口为开工前八问全部定案（①Scope=USER_GLOBAL ②dedupe key+跨 session sum ③基因字段+规则推导 confidence ④cover 双上限暂按 char ⑤显化页分层+「移除」 ⑥显式移除优先于 Freeze ⑦可重建索引合法 ⑧跨 session 算符=sum），专家复审只审「否」。

---

# UPG-06 确定性防编造回补
**分类**：M2 体系/治理


```status
phase: merged
branch: feat/upg06
head: 4a84fbaa
std: —
delivery_id: —
designer: 🔒**批 2 场景定案 @2026-08-30（v4，用户拍板）**：GoalGate 三候选场景全排除
dev: ✅C 批1 完成 @2026-08-29
inspector: ✅**审验通过 @2026-08-29**（证据链审验结论，补登记入 审验员/工单审验状态.md）→ 设计师 §六抽查通过（标记泡渲染/首中
merge: ✅**已合 main @2026-08-29**（rebase 5a71fe5 后 ff-only 合入 **4a84fba 已推 orig
actor: sys04-backfill
updated_at: 2026-09-05T08:42:06
```

**状态**：✅**程序员 批1 完成 @2026-08-29**（接棒收尾半停工段：C4 气泡级标记[live 升对话流标记泡 __room 既有 API 独立循环+原生降级同文]+重放重建[renderHistory 两路径挂 GuardMarkMatcher 首中消费]、C5 误拦验证集 203 条[正常 196 ≥50%+幻觉 7]误拦 0/196 ≤2% 达标[合成语料如实申报，真实分布待验收员环境复跑]+三豁免落码[你-主语/成功后-预测/RESULT_LEAD 收紧]+EXEC_CLAIM 漏拦回归补词、L2 测试桩 FabricateGuardAgentLoopE2ETest 四点断言[桩适配器走真 AgentLoop 全链]+对照组）｜ feat/upg06 **de7bf88 已 push origin**；全量 --rerun-tasks **335/0/0**（48 类）+assembleDebug 绿+check-token-effect 通过；报告 DELIVERY_UPG06_批1收尾_2026-08-29.md；**已登记两个表**｜ ✅**验收员通过 @2026-08-29**（L1 335/0/0 亲跑复核 + 真机 5558 重放呈现：标记泡可见/首中消费/真 AI 回复不误标/冷启动复现全实证，证据 验收员\证据数据\UPG-06\2026-08-29\；live 路径由 L2 桩覆盖；ACCEPTANCE_LOG 落档）→ **待审验员 → 设计师合 main**｜ **已核实销项 @2026-08-29（设计师）**：「R3 释法」系 UPG-05 串行残留——方案 v3.2 与出卡补充段均无 R3 对应物，UPG-05 释法已出（判事实归属不判词面）随 UPG-22 卡⑤发布，与本单无关；分支基线 5170421，main 已演进至 8a205d6，**rebase 实证 clean**（merge-tree 零冲突 @2026-08-29）；流程定位：待审验员证据链审验（规则 17）→ 通过后设计师 rebase + §六抽查 + 合 main ｜ ✅**审验通过 @2026-08-29**（证据链审验结论，补登记入 审验员/工单审验状态.md）→ 设计师 §六抽查通过（标记泡渲染/首中消费/冷启动复现/真回复不误标四件亲核，证据归属本单）→ ✅**已合 main @2026-08-29**（rebase 5a71fe5 后 ff-only 合入 **4a84fba 已推 origin**，rebase 零冲突与 merge-tree 预检一致；合后全量亲跑 **49 类 342/0/0+1 跳过绿**；feat/upg06 rebase 版已推 origin，worktree mov-upg06 可收）｜ 🔒**批 2 场景定案 @2026-08-30（v4，用户拍板）**：GoalGate 三候选场景全排除 → ✅ **用户确认销项 @2026-08-30**（论证见方案文档 §十一.1；老版 GoalGate.java 保留于 MOV-APP-old，未来有场景可重新立卡）；AcceptanceJudge expected 来源 = **B1 用户指定标准起步**（观察层不拦截），B2 市场任务自带留待市场任务体系成熟再议（用户已确认，见 §十一.2）——**AcceptanceJudge 可起步拆卡，GoalGate 已销项** → ✅ **已拆卡 UPG-44 @2026-08-30**（AcceptanceJudge B1，派单 设计师/派单/UPG-44_AcceptanceJudge_B1_派单_2026-08-30.md，📌待认领）｜ **原进度底**：C1+C2+C3 完成 3fe7fe7+fc8f2dc+5878bc8（FabricateGuard 移植+guard 事件注册双通道+RepeatDetector 接线[per-agent]+AgentLoop :425 挂载[turn 级双保险]+E3 联动双闸）｜ **优先级**：批 1 P0 / 批 2 P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-26
｜ ✅C 批1 完成 @2026-08-29

**背景（v2）**：v1「新版 guard 仅 RepeatDetector」是高估——RepeatDetector **有类无接线**（全库仅测试命中，DSH_TRANSLATION_RESIDUE.md:23 自认），运行时只剩工具超时 + 审批弹窗两道防线；F1 声称检测线新版也无。对「声称完成零 tool_call」零确定性拦截（model.list 编造铁证、六种幻觉形态 A-F 在案）。老版三件套挂载点 AgentLoop.java:1092-1127 在案。

**方案**：**批 1（P0）**FabricateGuard 移植（4 提取模式 + 询问豁免 + 诚实降级），**适配新 tool-calling 架构改写反馈文案与挂载点**（老版 plan JSON 协议已死，不得照搬；参照 harness repeat-tool-reminder 观察+丰富范式）；顺带接线 RepeatDetector（深 canonical/插话重置/分级）。**批 2（P1）**GoalGate（DeepTutor 移植件，场景评审后接）+ AcceptanceJudge 降级观察层（journal 本地持 expected + 剔键 + 对拍落 journal，不拦截；仅问答型）。

**红线**：expected 绝不发给模型（老版是 journal 本地持，非远程服务端）；只加观察+反馈层不改工具签名；建议性语句不得拦截；反馈文案不得引导 plan JSON 协议。

**决策点**：见设计文档§五（F1 线边界/GoalGate 场景/expected 来源/误拦体验）。

## 出卡补充段（设计师 @2026-08-29，批 1 施工依据；方案 v3.2 全文在 `设计师\方案设计\UPG-06_确定性防编造三件套_方案设计.md`）

**当日锚点复核（@main 5170421，UPG-05+UPG-21 合入后实测）**：

- FabricateGuard 挂载点：`AgentLoop.kt:425`（`toolCalls.isEmpty()` → Completed 分叉 = turn 结束点）——dsh 包锚点零漂移；
- RepeatDetector：per-agent 注入 `ToolCallScheduler`（`ToolCalls.kt:53`，装配点 `AgentLoop.kt:115`）；post-execute 挂载区 `ToolCalls.kt:220-224` 不变；
- 事件类型：`KnownEventTypes.kt:12` `KNOWN_SESSION_EVENT_TYPES` 先入后写；
- MainActivity 侧（UPG-05/21 合入后整体再漂移，以本次为准）：`looksLikeToolRequest():5732`、E3 调用点 `:4036`、`rebuildAgentTools():5791`、`toolsForStep` 装配 `:3924`（主循环）/`:2013`（子代理）；
- 施工时行号若再漂移，以「函数名锚」为准（以上函数名/类名不变）。

**E3 × FabricateGuard 联动表（方案 §十.4 DOD 兑现）**：

| 场景 | E3（输入侧） | FabricateGuard（输出侧） |
|---|---|---|
| 用户请求像要执行工具 + 整轮零 tool_call + AI 未声称完成 | nudge 重 kick（**每用户消息至多 1 次**，现状无上限必须加） | 不触发（无声称） |
| 整轮零 tool_call + AI 声称完成（命中动词表） | **不再 kick**（动作去重，防双机制同轮叠加） | 命中：UI 标记 + `guard.fabricate_hit` 落 journal（不入模型上下文） |
| E3 nudge 后新一轮仍声称完成且零 tool_call | 不再 nudge（上限已到） | 正常命中标记（每轮独立判定） |
| turn 内已有真实 tool_call（step1 调过）+ step2 文本声称完成 | 不触发 | **不拦**（turn 级粒度，v3.2 定案） |

- 两机制**状态不共享存储**，只在动作层去重（guard 命中轮 suppress E3 kick）；
- E3 重试上限实现口径：以「本条用户消息已 nudge 过」为记（内存态即可，重启清零可接受）。

**认领情况**：C 已认领（工单表备注：worktree=mov-upg06 branch=feat/upg06 @2026-08-29）。施工按方案 v3.2 §二/§三/§四 + 本段执行；验收按 §四（误拦集 ≥200 条/正常语句≥50%/≤2%、turn 级两案、桩适配器四点断言）；交付报告须含「治用户感知不治模型行为」定位声明 + guard 命中率统计。

---

# UPG-07 预算口径 + 用量计量 + 审批简化
**分类**：M5 商业/账号


```status
phase: merged
branch: feat/upg07
head: 171acfb9
std: —
delivery_id: —
designer: ✅**方案 v3 完成 @2026-08-29**（评审+溯源闭环：批 1 = 口径移植老版加权 CJK×0.67 + **窗口下沉 Mod
dev: ✅**C 批2 修复完成 @2026-08-30**（feat/upg07-b2 **74485bd** 已 push origin[for
inspector: ⚠️复验 @2026-09-01（P3-② 修复不彻底：vault.peekPhoto 返回 dataUrl @MainActivity:3
merge: ✅**批2 已合 main @2026-08-30**（设计师 merge e9aa7bc[含 e7104e3 大白话弹窗+goal豁免]，
actor: sys04-backfill
updated_at: 2026-09-05T08:42:06
```

**状态**：✅**方案 v3 完成 @2026-08-29**（评审+溯源闭环：批 1 = 口径移植老版加权 CJK×0.67 + **窗口下沉 ModelEntry 按模型配（用户拍板）** + 双阈值收敛单源（销挂账-压缩双阈值口径漂移）+ usage 聚合层 replay fold 派生视图；批 2 地基修正——GoalDomain 存在，前置 = restoreFrom 挂账修复 + 弹窗基线采集），**批 1 ✅程序员完成 @2026-08-29 01:45（feat/upg07 171acfb，9 文件 +346/-19）：①estimateTokens 加权移植[ASCII×0.3/CJK×1÷1.5/其他×1.2 ceil，老版 ContextBudget.java:37-52 同源；TokenMeterTest 同步]②窗口下沉 ModelEntry.contextWindowTokens+windowFor 三级解析[**官方口径实拉**：api-docs.deepseek.com pricing 2026-08-29——DeepSeek V4 全系 CONTEXT LENGTH=1M、MAX OUTPUT 384K，原 MainActivity:161 的 1M 恰为官方值，评审「下调」意见基于未实拉文档已澄清]；切模型跟随[applyWindowFromCurrentModel 挂 syncModelRegistry/model.use 两点]③双阈值收敛[DEFAULT_DEGRADE_RATIO=0.85 单源，BCE thresholdRatio 引用——销挂账-压缩双阈值口径漂移]④UsageAggregator fold 三轴[零写点 grep 实证+usage.summary 桥+SettingsSheet 白名单 usage.]；L1 全量 275/0/0（BudgetWeightTest 10 案）+ 变异锚；**L2 运行时部分转复核**：模拟器与 C 的 UPG-05 装机互踩[装机后被覆盖实录]，压缩时机/切模型跟随 logcat 待复验；Vue 用量展示 UI 留前端批[桥可达]；报告 DELIVERY_UPG07_批1_2026-08-29.md**；批 2 待前置 ｜ ✅**设计师已合 main @2026-08-29（merge 9c3db32 已推 origin，feat/upg07 补推）——UPG-07 批 1 全链闭环**（合前：两冲突按查验员指引解[org.json 去重取净形/:257 区双侧保留]；合后全量 --rerun-tasks 亲跑 41 类 281/0/0 绿；批 2 P1 挂起待前置）；✅**C 批2 完成 @2026-08-30 02:15**（feat/upg07-b2 **431b3cb** 基底 main 3263f10 已 push；
｜ 设计师/方案设计/UPG-07_计划授权预算口径设备裁剪_方案设计.md
→ ⚠️**验收打回 @2026-09-01**（P2 三等式名不副实[verify ID_SET/HASH=基数比较]+P3×2[asset.credentials 假脱敏/asset.peekPhoto 桥未注册]；STD/交付 id/护栏三件补交完成）→ ❗**C R1 修复 @2026-09-01**（feat/upg55 **1f679df**：P2 三等式**逐条内容对账**[ID_SET=集合内容相等·HASH=映射逐条相等·非基数——verify(expected)+迁移器 fail-closed 对账不过抛 ISE MANIFEST_REJECTED 不落地]+P3① `InfoVault.credPreviews()` index 真预览替换空壳+P3② asset.peekPhoto 桥注册[转发 vault.peekPhoto]；
→ ⚠️复验 @2026-09-01（P3-② 修复不彻底：vault.peekPhoto 返回 dataUrl @MainActivity:3779，前端 AssetsPage:139 消费 r.thumb 字段不匹配→缩略图不显示；挂账⏳）→ ❗R1b @2026-09-01（30c0d4b：AssetsPage.peekPhoto 改消费 r.dataUrl 对齐实际字段；vite 重建+sync-assets 仅 assets 闭包零越界；产物 bundle 实证 dataUrl 消费）——待重验J3 重写[expected 全过+M55-1 丢条抛 MANIFEST_REJECTED+P2 负路径同大小换 id（基数测不出→内容对账红）+同键不同 hash 红]+AssetFrameworksTest 8/8+全量 --rerun-tasks 绿+assembleDebug 绿；变异实杀[verify 双基数化→J3 红 8 中 1→还原复绿] 1/1；**delivery_id 绑定 code 变更 e1f241e→1f679df——请设计师按红 22/23/24 更新绑定**；L2 阻塞维持 R55-1~7 待真机恢复）——待验收员 L1 按 STD 冻结版重验（P2/P3 重验+M55 重杀）+R55 补验
**前置①挂账-GoalDomain无日志恢复**=GoalDomain.restoreFrom 全量重放 goal/change[按 id 最后状态/终态入 map 由 activeGoals 过滤/新目标不覆盖]+MainActivity 恢复点接线；**主体 goal 级豁免**=Answer.ALLOW_GOAL+OUTCOME_ALLOWED_GOAL+goalAllowSet[仿 turnAllowSet 纯内存重启清空]+goalIdProvider[仅 ACTIVE=complete/ARMED 即回收]+新工具仍弹+弹窗 UI 四键 setItems[有 ACTIVE 目标才显「允许本目标」]+Log.i 观测点[turn/goal 豁免命中+弹窗决策+无 goal 防御 reject]；红线全守[接线现有 ApprovalService 不另起/不改 tools 字段 system prompt/批准不永久]；L1 全量 391/0/0+变异 2/2 亲杀[M1 删豁免注入块→goal 内放行必红/M2 豁免忽略工具名→新工具仍弹必红]+GoalChangeEventTest+4/ApprovalServiceGoalTest 5 用例；**前置②弹窗基线采集**=任务定义 A/B/C 各 5+ 步实质级+脚本 scripts/approval-baseline-collect.sh 入库[MCP 面+ApprovalVis 计数+uiautomator tap]，**实测受阻**：adb reverse 838x 段并发占用/kill-server 后模拟器 adbd 离线未恢复[互踩实录+基础设施非代码原因]→基线数值挂账待补[恢复后跑批1版+批2版对比]；报告 DELIVERY_UPG07_批2_2026-08-30.md；已登记两个表）【✅ 弹窗基线采集 @2026-08-30 真机补验：A=6/B=3/C=4 总 13 次（21770d7d，approval/asked 口径）——基线挂账销项；⚠️ 发现 P1：弹窗四键列表项未渲染（setMessage+setItems 冲突，goal 豁免「允许本目标」UI 不可达）→ 已挂账待审，批2 主体功能需修复复验（见 ACCEPTANCE_LOG UPG-07 批2 §5 + 挂账登记表）】→ ✅**设计师验证 @2026-08-30**（见挂账登记表）：缺陷属实但属 **feat/upg07-b2 未合分支**，当前 main 为标准三键无此冲突——**随批2 修复**（①setItems 去 setMessage 或②恢复标准三键+goal 场景加「允许本目标」键），修复后复验批2 再合 main ｜ ✅**C 批2 修复完成 @2026-08-30**（feat/upg07-b2 **74485bd** 已 push origin[force-with-lease 覆盖远程旧 431b3cb]；rebase 至 main 8f8debd；根因=setMessage+setItems 双调冲突[setItems 独占内容区 ListView 与 setMessage 互斥→按钮不渲染只能超时]→改 setView(buildApprovalOptionsView) custom view[摘要+四键选项行全可点，点击 complete+dismiss]；四键语义[有 ACTIVE=允许本轮/允许本目标/允许本次/拒绝]/60s fail-closed/goal 豁免零改动；Upg07B2FixContractTest 5 锚[双调回潮禁/四键 labels/视图实现/setView 挂载/goal+fail-closed 保留]+变异[setItems 回潮双锚必红]亲杀+全量 57 类 417/0/0+assembleDebug 绿+check-token-effect 过；Token/KV 0/0；报告 DELIVERY_UPG27修复_UPG07批2修复_2026-08-30.md；已登记两个表）——待验收员修复复验[四键全可见可点+uiautomator 节点树+journal allowed-goal 链+截图]后合 main ｜ ✅**批2 已合 main @2026-08-30**（设计师 merge e9aa7bc[含 e7104e3 大白话弹窗+goal豁免]，P1 复验通过；push origin；worktree mov-upg07-b2 可收）
｜ ✅**验收员复验通过 @2026-08-30**（ACCEPTANCE_LOG e786524；程序员修复 675970b+0ef352d）：P1 宿主工具组头卡「常驻」不可关（真机设备控制详情：常驻灰字+无 Switch，uiautomator Switch=0——MARKET_NOT_INSTALLED 触发面消除）+ 启停转 MarketPackDetail（MockServer 详情 ToggleButton 在场）；P2 zh.js 补 localDetail17+marketPack20 key（verify⑧ en/zh 逐键一致+变异②亲杀+独立 bun build 产物含「这能干嘛/常驻」与提交产物逐字节等价仅行尾差）；verify 28/28（申报 29 差 1 P3）+变异 2/2+build/sync-pages 幂等+assembleDebug 绿——**两项挂账销项**；观察项：browser-automation 启停实操待用户点审批补验（P3）；**注意**：分支基底 35a37b6（非 origin/main），合批需重跑 vite build+sync-pages（50 处 rename 预检+产物 hash 分叉）——**改造 → 待设计师合 main → 审验员** ｜ ✅**C 大白话弹窗修复 @2026-08-30**（feat/upg07-b2 **e7104e3** 已 push origin[rebase 至 main edf86d9，force-with-lease 覆盖 74485bd]；派单[修复] demo v4 设计基准：弃四键「允许本轮/允许本目标/允许本次/拒绝」→ 大白话版[大图标 apprIconFor emoji + 「AI 想帮你」人话主行 apprHumanPhrase[工具级模板占位，单 B 由 UPG-45 Registry 替换，不编造 UPG-06] + 参数人话化 apprArgsSummary[脱敏同口径] + 30s 倒计时自动取消 complete(null)[服务侧 60s fail-closed 兜底] + [同意][拒绝]主色/危险红 + 勾选「这次对话里，同类操作都直接同意」]；Answer 映射 同意=ALLOW_ONCE/勾选=有 ACTIVE 目标 ALLOW_GOAL:ALLOW_TURN/拒绝=REJECT；goalIdProvider 仅 ACTIVE[批准不永久]+goalAllowSet 零改动；setItems 双调根除[内容区全程 custom view]；后台通知接管原样；Upg07B2FixContractTest 6 锚[双调回潮禁/大白话结构/映射+goal 豁免/30s 自动取消/goalIdProvider+fail-closed/人话模板纯函数实测]+变异 2/2 亲杀[setItems 回潮红/人话主行删红]+全量 57 类 424/0/0+assembleDebug 绿+check-token-effect 过；Token/KV 0/0；报告 DELIVERY_UPG07批2_修复_大白话弹窗_2026-08-30.md；已登记两个表）——**待验收员 L2 复验**：uiautomator 可点节点/goal 豁免 journal allowed-goal 链+该工具后续免弹+新工具仍弹/shell.exec·写文件·发消息三场景截图+节点树/30s 自动取消生效，通过后销挂账[upg07批2-审批弹窗四键未渲染：已被 v4 方案取代]；**✅ 验收员复验通过 @2026-08-30**（ACCEPTANCE_LOG 65fb958：feat/upg07-b2 e7104e3 大白话 v4=setView 根除 setMessage+setItems 冲突+图标/人话/参数脱敏/30s 自动取消/同意-拒绝/同类勾选[ALLOW_GOAL|ALLOW_TURN]；ContractTest 6/0+全量 424/0/0+变异 2/2；真机大白话 UI 捕获[💻+AI 想帮你执行一条命令+参数 command=ls /sdcard+倒计时]+勾选→allowed-turn+同类免弹[journal 本轮已允许]+30s 自动取消[cancelled]——**挂账销项**；P3：新工具弹窗直抓未完[对话流不稳，代码路径明确]→**待设计师合 main**）｜ **优先级**：批 1 P0 / 批 2 P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-26（v3 @2026-08-29）
｜ ✅**批 1 验收员通过 @2026-08-29**（feat/upg07 @ 171acfb 独立复核：L1 39 类 275/0/0 吻合+变异 M1 CJK 权重/M2 条目默认漂移亲杀[M3 同族引用 UPG-03 已证]+代码四项实证[estimateTokens 与 MOV-APP-old ContextBudget.java:37-52 逐字同源/windowFor 三级解析/DEGRADE_RATIO 单源收敛/UsageAggregator 零写点]+取证澄清独立复核属实[web_fetch 官方 pricing 页：三模型 CONTEXT LENGTH=1M、MAX OUTPUT 384K]；L2 降级接受[互踩如实+机制链:1618→:3847 三层源码锚+全系 1M 无区分度；建议批 2 补 Log.i 观测点]）→ **批 1 待审验员 → 设计师合 main**；ACCEPTANCE_LOG 2648c83；批 2 待施工（前置：GoalDomain restoreFrom+弹窗基线采集）

**背景（v2 重测）**：预算口径 char/4 属实（ContextBudget.kt:75，中文低估 60-65%），**叠加默认窗口 1M → 中文长会话先撞真实窗口报错、压缩来不及触发（真 bug，最优先）**。审批风暴被夸大：2026-08-24 已落地无害级 14 工具免弹 +「允许本轮」（McpToolScheduler.kt:114-152、ApprovalService.kt:127-132），「5min TTL」不存在；残留痛点 = 实质级工具多步任务。用量计量缺聚合层但 usage 已采集落盘（DeepSeekAdapter.kt:245-256）。设备裁剪机制**已存在**（启动期装配裁剪 MainActivity.kt:1196-1557，v1 描述不实）→ 移出本期；ExecuteToolGate 范围外搭车 → 剥离。

**方案**：**批 1（P0）**预算口径 Unicode 加权（误差<30%，同步改 TokenMeterTest:12 断言；窗口默认值配套评审）+ TokenMeter 聚合（折叠 journal 现成 usage，只提示不硬拦；harness token-meter 锚定投影架构留作后续参考）→ **批 2（P1）**审批简化：「允许本轮」→「允许本目标」goal 级豁免先试，不足再评完整 APPROVE_PLAN；**必须接线现有 ApprovalService/Plan，不得另起平行体系**（参考 harness user-approval：瀑布 fail-closed、审计对 turn 包裹）。

**红线**：批准不永久（goal 失效即回收、新工具必弹）；预算切换先单测对比；计量不硬拦；一切 tools 字段/system prompt 变化只能启动期生效；plan 模式不自己拦工具（交审批层）。

**决策点**：见设计文档§六（加权系数与窗口默认值配套/goal 级豁免边界/月配额默认/完整计划授权必要性）。


---

# UPG-08 mow.kim 工作台落地（Stitch 框架工程化）
**分类**：M3 平台/基建


```status
phase: obsolete
branch: feat/upg08
head: aa098825
std: —
delivery_id: —
designer: ❌ **作废 @2026-09-04（用户拍板：「UPG-08 可以删掉了」｜取消；历史上已合 main @aa09882 保留审计，后续以
dev: —
inspector: —
merge: 已合 main@aa09882 保留审计，后续以 UPG-08 相关迭代单/W-09 线承接）**
actor: sys04-backfill
updated_at: 2026-09-05T08:42:06
```

**状态**：❌ **作废 @2026-09-04（用户拍板：「UPG-08 可以删掉了」——取消；历史上已合 main @aa09882 保留审计，后续以 UPG-08 相关迭代单/W-09 线承接）** ｜ **优先级**：P1

## 标题

mow.kim 个人工作台落地：Stitch 三屏框架工程化（单页 + 文件树 + JSON 驱动 + 同步脚本 + 账号门禁）

## 背景（设计师走查结论 @2026-08-26）

前端用 Stitch 出了三屏框架（`灵感库\项目源码\mow工作台_stitch框架\`：mow_1 总览 / mow_2 流水线板块 / mow_3 档案板块 + `mow_workbench_v2/DESIGN.md` 设计 token）。走查结论：

**合格（照抄）**：两栏骨架、侧栏 260px/34px 行、暖白底 + Inter + 品牌蓝、优先级色条、状态圆点、流水线步进器、档案卡+时间线——与设计思路 v2 及 token 全部对齐。

**差距（本单要干的活）**：
1. **三屏是静态孤页** → 合成单页 hash 路由，侧栏树全量按设计 §三（7 个一级 + 15 个二级节点）；现框架只有 App 维 3 个子节点，其余维度无二级、mow_2/3 用占位树；
2. **违反不做清单的元素要删**：每屏都有「+ Create New Ticket」按钮、通知铃铛、Settings/Help——全部移除；
3. **英文残留全中文化**（"Active Work Items"/"View All"/"Syncing…"/"Manage and track…"等）；
4. **静态数据 → JSON 驱动**：两套模板改造为 fetch `workbench.json` 渲染；状态灯/计数前端现算 + **红点上卷**（子孙阻塞冒泡到一级维度）；字段缺省容错不白屏；附 `workbench.sample.json`（五维填满假数据）；
5. **同步脚本**（本单含工具链）：解析桌面工单流转中心（`工单库.md`/`工单表.xlsx`/`挂账登记表.md`/`ACCEPTANCE_LOG.md` → App 维三板块）+ 其余四维轻量 md 表 → 生成 `workbench.json`；一键同步 + scp 部署；
6. **账号门禁 + 内测部署**：接 `account-service.js`；先部署内测地址（子域或子路径），**不碰 mow.kim 市场现站**。

## 验收标准

- **L1**（全量绿 + 变异亲杀）：构建绿；走查校验脚本（node）：树节点全量核对（7+15）、禁加元素零命中（Create/bell/Settings）、JSON 容错渲染断言。变异：删一个二级节点/放回一个禁加元素 → 校验必红。
- **L2**（真机 = 真实浏览器 + 部署地址）：桌面 + 375px 手机两端截图入 `docs/ACCEPTANCE_LOG.md`：树全展开一屏可见、造一条阻塞假数据演示红点冒泡到一级、步进器手机横滑、断 JSON 不白屏。
- **L3**（端到端实证）：桌面工单库改一条工单状态 → 跑同步脚本 → 内测地址可见变化（截图对账，journal=同步日志+部署输出）。

## 红线

- **只读**：工作台禁止任何写操作（无新建/编辑/拖拽）；
- 视觉严格按 Stitch 框架 + `mow_workbench_v2/DESIGN.md` token，不另起风格（圆角 8/16px 按 Stitch 的企业工具气质走，不回 24px）；
- 不做清单四条原样生效（三级树/图表报表/通知协作/暗色模式一律不加）；
- **不碰市场现站**：工作台只上内测地址；mow.kim 主域切换属 mov-ai.cn 迁移线，不在本单；
- 数据脱敏：`workbench.json` 不含口令/密钥/隐私；同步脚本输出前过一遍敏感词检查；
- 登录门禁接现有 `account-service.js`，不自造账号体系。

## 方案文档与素材

- 设计思路：`设计师\方案设计\mow工作台_设计思路_v2.md`（树脉络 §三 / 模板 §五 / 数据契约 §六 / 走查标准 §九）
- Stitch 框架：`灵感库\项目源码\mow工作台_stitch框架\`（三屏 code.html + screen.png + DESIGN.md）

---

## 派单交接段（程序员领单时按此执行）

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：工单表该行备注追加 `认领: <agent> worktree=mov-upg08 branch=feat/upg08 @<时间>`（worktree 命名强绑定工单号）。
2. 代码落点：主仓库 `0027-mov` 新建 `workbench-web/` 目录（与 `market-web/` 平级，共用部署管线）；Stitch 三屏复制进 `workbench-web/reference/` 作为施工底稿。
3. 施工顺序：批 1 三屏合一+树补全+删禁加元素+中文化 → 批 2 JSON 驱动改造+sample 数据 → 批 3 同步脚本 → 批 4 门禁+内测部署；每批独立可验。
4. **完成后必须登记两个表**（先表后库）：
   - `工单表.xlsx`：程序员列 `✅完成`，备注列 `feat/upg08 <hash>（报告 DELIVERY_UPG08_*.md）`；
   - `工单库.md`：本单状态改为 `程序员✅完成，待验收`。
5. 交付报告落点：`程序员\交付报告\DELIVERY_UPG08_*.md`；报告里明确写「已登记两个表」。
6. 全部产物提交主仓库 `0027-mov` 分支 `feat/upg08`，交付时报 hash。

---

## UPG-08 打回修复段（R1 · 设计师派单 @2026-08-26）

**状态**：🔨 打回修复派单，待程序员领修复（优先原施工者 C；撞单按认领规则）｜ 验收缺陷明细见 `0027-mov\docs\ACCEPTANCE_LOG.md` 末尾（UPG-08 验收节）

### 修复范围（P1 必修，P2/P3 随修）

| # | 缺陷 | 修法要求 |
|---|---|---|
| P1-1 | sync 依赖未交付 + 缺依赖静默降级 exit=0 | 补 `workbench-web/package.json`（声明 xlsx 依赖）或移除外部依赖自实现解析；**缺依赖必须 fail-loud**：exit≠0 且拒绝 `--deploy`（宁可不部署，不可空态覆盖生产） |
| P1-2 | 数据源路径错 → 挂账/验收记录恒空 | 改读 `处理中心\挂账登记表.md` 与 `0027-mov\docs\ACCEPTANCE_LOG.md`；修复后生成 json 的 `app-backlog` 与 `app-accept.events` **非空** |
| P1-3 | L1 校验假覆盖（字符串包含检查）+ TREE 死代码 | verify 改为**真实行为断言**（加载 app.js 真实渲染路径 / 校验真实 workbench.json 结构）；删 `renderTree` → 必红、删 json 节点 → 必红；清除未使用的 `TREE` 死代码 |
| P2-1 | fallback 渲染错乱（SAMPLE 结构与渲染器不一致） | SAMPLE.tree 改为 dim→children 层级，断 JSON 时无 undefined 标题 |
| P2-2 | 生产残留演示态 | 规则 18 已立：修复交付前用真实工单表重新 `sync --deploy`，报告声明「演示数据已还原且生产态已复核」 |
| P3-1 | login-password 未接线但报告声称可用 | 二选一：接上密码登录，或从交付声明/界面提示中移除（不许声称没有的功能） |
| P3-2 | focus / archive 顶层恒空 | 实算：focus = 各维度 P0/P1 在制 Top5（按优先级+更新时间排序）；archive = 已合 main/已完成工单沉底列表 |

### 顺带收口（同一修复批）

- **dims 四维表接入**：底稿在 `工单流转中心\设计师\维度工单表底稿\`（市场/品牌/营销/基建.md，表顺序与列序已按脚本约定排好），复制进 `workbench-web/dims/`；同时补上脚本盲区——档案型板块（brand-tm.cards / infra-servers.cards / marketing-cal.events / marketing-channel.tickets）目前写死空值，一并解析 dims 对应表。

### 复验判据（验收员将按此复核，原样照录）

1. 干净环境（无遗留 NODE_PATH/node_modules）跑 sync：缺 xlsx 必须 exit≠0 且不执行 deploy；
2. 生成 json 中挂账（app-backlog）/验收记录（app-accept.events）非空；
3. verify：删 `renderTree` / 删 json 节点 → 必红。

### 交接要求

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：工单表第 9 行备注追加 `认领: <agent> R1修复 @<时间>`；
2. 代码仍在 `feat/upg08` 分支继续（不新开分支），修复报告落 `程序员\交付报告\DELIVERY_UPG08_R1_*.md`，按「现象→根因→修法→复验」四要素写；
3. 完成后登记两个表（先表后库）：工单表程序员列 `✅修复完成`，备注 `feat/upg08 <新hash>（报告 DELIVERY_UPG08_R1_*.md）`；工单库本单状态改「程序员✅修复完成，待复验」；
4. 报告里明确写「已登记两个表」+「演示数据已还原且生产态已复核」（规则 18）。

---

*：✅ 审验终审通过 @2026-08-27（L3 真实验证码登录通过，用户转达）→ **设计师✅已合 main @2026-08-27**（772e2a5 合并 b3b3c6e；Manifest 冲突语义解决：LAUNCHER 归门控、LoginActivity 降内部页、enterMain 接线 门控→登录→主界面，全量 241 绿 --rerun-tasks，已推 origin）
｜ **优先级**：P1｜ ✅ 方案完成｜ ✅C 完成

## 标题

MOV App 登录页实现：验证码 + 密码双轨 + 微信预留位，启用真 Logo（竖眼商标透明底）

## 背景（Stitch 底稿走查结论 @2026-08-26）

前端已按 `设计师\方案设计\MOV_App登录页_设计思路.md` 出 Stitch 两屏底稿（`灵感库\项目源码\mov登录页_stitch框架\`：login_verification_code / login_password + mov_design_system/DESIGN.md）。

**达标项（照抄）**：五区结构一屏放完、品牌区光晕 + MOV + slogan、Tab 选中态蓝短划线、56dp 圆角输入框、pill 主按钮（禁用灰态正确）、协议区未勾选态、微信位置灰、+86 前缀。

**修正项（9 条，施工时必须改）**：

1. **换真 Logo**：占位蓝圈 → MOV 竖眼商标（透明底 PNG 已备：`灵感库\项目源码\mov登录页_stitch框架\MOV_商标图样_竖眼_透明底_V1.png`，原始资产在 `新MOV\品牌管理\商标注册（2026-08-27 起迁入）\`）；Logo 不要外圈白底，直接放在光晕上；
2. 密码 tab 英文 slogan「Welcome back to professional mobility.」→ 统一中文「让 AI 成为你的日常」（两 tab 品牌区完全一致）；
3. **删除「忘记密码？」**（设计稿不做清单，一期不做找回流程）；
4. 协议区英文 User Agreement / Privacy Policy 及底部英文重复行 → 全删，只留中文《用户协议》《隐私政策》；
5. +86 旁的下拉箭头删除（只支持 +86，不做区号选择）；
6. 两屏品牌区不一致（密码屏缺 Logo）→ Tab 切换**只换表单区**，品牌区恒定；
7. X 关闭按钮两屏位置不一（右上/左上）→ 统一；且首启强制登录场景**不显示 X**（无游客模式，X 只在「已登录态下打开登录页」时出现）；
8. 屏 1「获取验证码」文字贴右缘疑似裁切 → 实现时保证按钮完整不溢出；
9. 屏 1 微信位用了对话气泡占位图标 → 换微信官方 glyph，保持置灰 40%。

## 施工范围

- 原生 Android 实现（`0027-mov` app 模块新增登录 Activity/页面），视觉以 Stitch 底稿 + 设计稿 §三规格表为准；
- 接口对接（全部现成，零后端改动）：`POST /account/send-code`（发验证码）、`POST /account/login`（验证码登录，未注册自动注册）、`POST /account/login-password`（密码登录）；
- 交互：表单校验（手机号格式/验证码 6 位/协议未勾禁用主按钮）、验证码 60s 倒计时、按钮内 loading、inline 错误红字（禁 toast）、键盘弹起整页上移（品牌区压缩、表单完整可见）；
- 登录态持久化（token 存本地，重启免登），登出入口接设置页。

## 验收标准

- **L1**：编译绿 + 全量单测绿（`:app:testDebugUnitTest`）；新增表单校验单测（手机号格式/验证码长度/协议未勾禁用/倒计时状态机），变异亲杀（改错校验规则 → 必红）；
- **L2**（真机 emulator-5556 截图入 `docs/ACCEPTANCE_LOG.md`）：验证码 tab 默认态 / 密码 tab / 键盘弹起态 / 错误态（错误验证码 inline 红字）/ 60s 倒计时态 / 真 Logo 竖眼可见且透明底无白边；
- **L3**（端到端）：真机用真实手机号走验证码登录成功进主界面（logcat + 截图证据；**手机号/token 必须打码**）；杀掉 App 重启 → 免登直进。

## 红线

- 不改 `account-service.js` 任何接口（发现问题登记处理中心，不修后端）；
- 不做清单原样生效：忘记密码 / 游客模式 / 一排第三方图标 / 暗色模式 / 轮播或视频背景；
- 视觉以底稿 + 设计稿为准，不另起风格；真 Logo 只用透明底 PNG，不描边不加底块；
- 截图与日志脱敏（手机号中间四位打码，token 不落盘）；
- Token/KV 申报：本单不涉 LLM 请求链路，报告中声明「无影响」即可（AGENTS.md 硬规则 1 适用性说明）。

## 素材

- 设计稿：`设计师\方案设计\MOV_App登录页_设计思路.md`
- Stitch 底稿 + 真 Logo：`灵感库\项目源码\mov登录页_stitch框架\`

---

## 派单交接段（程序员领单时按此执行）

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：工单表该行备注追加 `认领: <agent> worktree=mov-upg09 branch=feat/upg09 @<时间>`（worktree 命名强绑定工单号）。
2. **完成后必须登记两个表**（先表后库）：
   - `工单表.xlsx`：程序员列 `✅完成`，备注列 `feat/upg09 <hash>（报告 DELIVERY_UPG09_*.md）`；
   - `工单库.md`：本单状态改为 `程序员✅完成，待验收`。
3. 交付报告落点：`程序员\交付报告\DELIVERY_UPG09_*.md`；报告里明确写「已登记两个表」。
4. 全部产物提交主仓库 `0027-mov` 分支 `feat/upg09`，交付时报 hash。

---

v` 分支 `feat/upg09`，交付时报 hash。

---

# UPG-10 工作台 sync 状态语义细分
**分类**：M3 平台/基建


```status
phase: merged
branch: feat/upg10
head: c0b5a0dd
std: —
delivery_id: —
designer: ✅ 方案完成
dev: ✅C 完成｜ 设计师/方案设计/UPG-10_工作台sync状态语义细分_方案设计.md
inspector: ✅验收员通过 @2026-08-27（c0b5a0d 独立复核：verify 基线/变异亲杀/fail-loud/端到端推导全过）
merge: **设计师✅已合 main @2026-08-27**（c0b5a0d ff 合入，main 与 feat/upg10 已推 origin；
actor: sys04-backfill
updated_at: 2026-09-05T08:42:06
```

**状态**：✅验收员通过 @2026-08-27（c0b5a0d 独立复核：verify 基线/变异亲杀/fail-loud/端到端推导全过）→ **设计师✅已合 main @2026-08-27**（c0b5a0d ff 合入，main 与 feat/upg10 已推 origin；feat/upg10 程序员未推远端，以本地验收 commit 直接合入并补推归档）｜ **优先级**：P3（顺手小单）｜ **出单人**：设计师 ｜ **日期**：2026-08-26
｜ ✅ 方案完成｜ ✅C 完成｜ 设计师/方案设计/UPG-10_工作台sync状态语义细分_方案设计.md

**来源**：挂账-upg08-workbench状态语义（设计师已验证属实并定夺）。

**问题**：`workbench-web/sync-workbench.mjs` 的 `pipelineFromXlsx` 只按「列里有 ✅」推导状态，验收员列任何 ✅ 都输出「验收中」，无法表达「已通过待合」。

**修法（已定口径，照此实现）**：验收员列含「打回」→ `打回修复中`；含「通过」→ `待合 main`；其他 ✅ → `验收中`；合 main 列含「已合」→ `已完成`（终态，覆盖前者）。

**同单附带修复（2026-08-27 设计师加）**：`DEFAULT_CENTER` 仍指向 `Desktop/工单流转中心`（已改名为 `Desktop/新MOV`），不改则下次 sync 被 fail-loud 拦死。改为 `C:/Users/Administrator/Desktop/新MOV`；verify 增加「数据源目录存在」断言。

**验收**：L1：verify-workbench.mjs 增加状态推导断言（四种列值 → 四种输出，变异：改乱映射必红）；L2：临时把某工单验收员列改「✅ 通过」→ sync --deploy → 网站显示「待合 main」截图 → 还原（规则 18）。

**交接**：认领登记（工单表备注 `认领: <agent> worktree=mov-upg10 branch=feat/upg10 @时间`）；完成后登记两个表（先表后库），报告落 `程序员\交付报告\DELIVERY_UPG10_*.md` 并写明「已登记两个表」；产物提交 `0027-mov` 分支 `feat/upg10` 报 hash。

---

# UPG-11 首启隐私政策弹窗（应用宝整改）
**分类**：M1 安全/合规


```status
phase: merged
branch: feat/upg11
head: 308cabff
std: —
delivery_id: —
designer: ✅ 方案完成
dev: ✅C 完成
inspector: ✅验收员通过 @2026-08-27（308cabf 独立复核：L1 全量 228 绿+变异亲杀 2/2 + L2 真机八场景全过；带缺陷
merge: **设计师✅已合 main @2026-08-27**（feat/upg11 308cabf ff 合入 main 9c2f0da，与 W-
actor: sys04-backfill
updated_at: 2026-09-05T08:42:06
```

**状态**：✅验收员通过 @2026-08-27（308cabf 独立复核：L1 全量 228 绿+变异亲杀 2/2 + L2 真机八场景全过；带缺陷 P2×1+P3×2 不阻塞）→ **设计师✅已合 main @2026-08-27**（feat/upg11 308cabf ff 合入 main 9c2f0da，与 W-02 合并 57ad79b 同批推送；挂账 3 条在册待销）｜ **优先级**：P0（阻塞应用宝上架重提）｜ **出单人**：设计师 ｜ **日期**：2026-08-27
｜ ✅ 方案完成｜ ✅C 完成

## 标题

首启隐私政策弹窗：同意/拒绝双钮 + 全量初始化门控（应用宝审核打回问题 4 整改）

## 背景（设计师源码实测 @2026-08-27）

应用宝审核打回原文：「APP 首次打开未弹出隐私政策弹窗。请添加含明确"同意"和"拒绝"按钮的隐私弹窗后重新提交。」（整改指引：https://wikinew.open.qq.com/index.html#/iwiki/4007776059）

实测现状（`0027-mov` `app/src/main/java/com/mov/android/MainActivity.kt` `onCreate` :271 起）：**首启无任何隐私弹窗，且同意前已在收集/初始化**——

- :273 `ApplicationHolder.context`（LightOcr / ML Kit 第三方 SDK 静态入口，等于启动即初始化三方 SDK）；
- :313 `BizStore(this)` —— **device_id 首启生成并落盘**（设备标识属个人信息，同意前收集 = 本次整改的死穴）；
- :311 MovStorage / :315 OnboardDraft / :317 InfoVault / :318 WorkflowRunner / :359 迁移线程等全部无条件执行。

整改合规要点（监管 + 应用宝口径）：同意前**不得收集任何个人信息、不得初始化任何第三方 SDK**；弹窗必须有**同等显著**的「同意」「拒绝」两个按钮；不可绕过（禁返回键/点外部关闭）；拒绝后不得收集信息。

## 方案（已定口径，照此施工）

1. **Consent Gate**：`onCreate` 入口第一行查 `SharedPreferences("mov_prefs").getBoolean("privacy_agreed_v1", false)`。未同意 → **立即挂起后续全部初始化**，渲染隐私弹窗；同意 → 写 true 并继续完整初始化。key 带版本号 `_v1`，政策重大更新时递增强制重弹。
2. **弹窗**（原生 AlertDialog，`setCancelable(false)`，返回键与点外部均不可关闭）：标题「个人信息保护指引」；摘要段（按真实收集项写：设备信息/对话内容/日志/手机号，用途一句话）；《隐私政策》全文链接（应用内可打开查看）；底部「同意」「拒绝」双钮**同等显著**（禁止弱化拒绝按钮、禁单按钮「知道了」）。
3. **拒绝路径**：弹二次说明「不同意隐私政策将无法使用本应用」→「退出应用」（finishAndRemoveTask）/「重新查看」。拒绝路径**零初始化、零网络请求、零写盘**（不持久化拒绝态，下次启动再弹——不同意即不可使用，合规口径）。拒绝时 ApplicationHolder/BizStore/InfoVault/ML Kit 一律不得触碰。
4. **与 UPG-09 登录页的顺序**：隐私弹窗在强制登录页之前（同意隐私政策是登录的前提）。
5. **政策全文承载**：复用设置页现有《隐私政策》展示入口；若无独立全文页，本单新增静态政策页（assets 内嵌）。**注意**：现行隐私政策文本已过时（第六条仍写"不提供账号注册/登录"，与已上线账号体系矛盾）——政策文本更新由设计师另行出稿，本单先把弹窗与门控做对，文本到手后替换 assets 不算返工。

## 验收标准

- **L1**（全量绿 + 变异亲杀）：编译绿 + `:app:testDebugUnitTest` 全绿；新增 consent gate 单测：未同意→初始化被阻断 / 同意→放行且持久化 / 拒绝→退出路径零副作用（无文件写入、无 SDK 触碰）；变异：把 consent 检查挪到 BizStore 之后 / 删持久化 → 必红。
- **L2**（真机 emulator-5556，截图入 `docs/ACCEPTANCE_LOG.md`）：卸载重装首启弹窗（双钮同框、政策链接可点开全文）；拒绝→说明→退出，且 **logcat 证明零网络请求、filesDir 无 device_id 落盘**；重装同意→正常进主界面；二次启动不再弹；先隐私弹窗后登录页顺序正确。
- **L3**：出包走应用宝重新提交；验收以整改点录屏/截图证据为准（提交动作本身由设计师/我执行，不在程序员范围）。

## 红线

- 拒绝路径零收集零初始化（含 ML Kit / BizStore / device_id）——这是整改核心，碰了等于没改；
- 弹窗不可绕过（禁返回键、禁点外部、禁后台预初始化）；
- 双钮同等显著，禁止只给「同意」或把「拒绝」做成灰小字；
- 不改任何业务功能逻辑；Token/KV 申报：本单不涉 LLM 请求链路，报告声明「无影响」（AGENTS.md 硬规则 1 适用性说明）；
- 截图与日志脱敏。

## 关联事项（不在本单施工范围）

- **隐私政策 V1.1 已定稿（2026-08-27）**：`合规设计\合规设计\MOV_AI_隐私政策_V1.1_2026-08-27.md`，正文进 assets 政策页，**附录含弹窗摘要文案（程序员照抄，勿自撰）**；应用宝后台政策链接同步换新文本；
- UPG-09 登录页协议区《隐私政策》入口与本单弹窗共用 V1.1 文本。

---

## 派单交接段（程序员领单时按此执行）

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：工单表该行备注追加 `认领: <agent> worktree=mov-upg11 branch=feat/upg11 @<时间>`（worktree 命名强绑定工单号）。
2. **完成后必须登记两个表**（先表后库）：
   - `工单表.xlsx`：程序员列 `✅完成`，备注列 `feat/upg11 <hash>（报告 DELIVERY_UPG11_*.md）`；
   - `工单库.md`：本单状态改为 `程序员✅完成，待验收`。
3. 交付报告落点：`程序员\交付报告\DELIVERY_UPG11_*.md`；报告里明确写「已登记两个表」。
4. 全部产物提交主仓库 `0027-mov` 分支 `feat/upg11`，交付时报 hash。

---

# UPG-12 WebView 引擎预热 + 页面加载体验优化
**分类**：M3 平台/基建


```status
phase: merged
branch: feat/upg12
head: ce3336f3
std: —
delivery_id: —
designer: —
dev: —
inspector: ✅验收员通过 @2026-08-27（ce3336f 独立复核：L1 全量 236 绿+三变异亲杀 3/3 + L2 时序/L3 飞行模式全
merge: **设计师✅已合 main @2026-08-27**（feat/upg12 ce3336f 合并提交 689b663，已推 origin；
actor: sys04-backfill
updated_at: 2026-09-05T08:42:06
```

**状态**：✅验收员通过 @2026-08-27（ce3336f 独立复核：L1 全量 236 绿+三变异亲杀 3/3 + L2 时序/L3 飞行模式全过；P3×1 观察项不阻塞）→ **设计师✅已合 main @2026-08-27**（feat/upg12 ce3336f 合并提交 689b663，已推 origin；堆叠 UPG-11 之上，consent 后挂点）｜ **优先级**：P3（体验优化，不阻塞上架）｜ **出单人**：设计师 ｜ **日期**：2026-08-27

## 标题

WebView 引擎预热 + 原生层加载占位：设置/市场等 8 个内嵌页白屏治理

## 背景（架构定案 @2026-08-27）

用户实测体感：点开设置页有明显加载白屏。**架构定案（用户拍板）：设置页维持 Web 技术栈**——设置页与网页版 MOV 共用一套 Vue 产物，原生化会断联动线；本单只做体验优化，不改架构。

白屏根因（源码实测）：`SettingsSheet.kt:20` 每次打开都 `new NestedWebView(activity)`，进程内首个 WebView 实例触发 Chromium 引擎初始化（数百 ms 级），叠加 HTML/JS 解析渲染才有内容。`assets/pages/` 下 8 个页面（settings/market/model/orders/review/sidebar/vault/workbench）+ `WebPageSheet` 临时网页弹层全部同模式，同受此害。

## 方案（已定口径，照此施工）

**批 1：WebView 引擎预热**。App 启动完成、且 **UPG-11 consent gate 通过之后**（合规稳妥，预热不得早于隐私同意；UPG-11 未合时挂点预留并注释说明），主线程空闲时创建一个 dummy WebView 实例触发 Chromium 进程级初始化（仅实例化，不加载业务 URL，可 `about:blank`）。引擎初始化是进程级的，预热一次，后续所有 sheet `new NestedWebView` 即为热启动。不做 WebView 实例复用池（桥接 per-instance，复用重构风险大于收益）。

**批 2：原生层加载占位**。sheet 容器在 `onPageFinished` 之前显示与页面同色系底 + 细 loading 指示；`onPageFinished` 回调里隐藏。在原生层（SettingsSheet / WebPageSheet 容器侧）实现，**不动 `assets/pages/*` 任何 Vue 打包产物**。

## 验收标准

- **L1**（全量绿 + 变异亲杀）：编译绿 + `:app:testDebugUnitTest` 全绿；新增断言：预热函数在启动路径被调用且在 consent gate 之后；变异：删预热调用 / 把预热挪到 consent 之前 → 必红。
- **L2**（真机 emulator-5556，录屏/截图入 `docs/ACCEPTANCE_LOG.md`）：冷启动后首次打开设置页，优化前后录屏对比（白屏时长显著缩短，逐帧对账）；加载占位可见且无样式跳变；抽查设置/市场/模型 3 页功能无回归。
- **L3**：飞行模式下打开设置页正常渲染——实证 appassets 虚拟域零网络请求（截 logcat 无网络报错）。

## 红线

- 不改 `assets/pages/` 任何文件（Vue 产物是网页版联动资产，本单零触碰）；
- 不引入任何远程 URL；预热只初始化引擎，不加载业务页面；
- 预热时机不得早于 UPG-11 consent gate（合规红线，与 UPG-11 施工方对齐挂点）；
- 不改 `PagesBridge` 白名单与桥协议；
- Token/KV 申报：本单不涉 LLM 请求链路，报告声明「无影响」。

## 关联说明

- 设置页 Web 架构长期保留（与网页版 MOV 联动），后续页面迭代沿用「原生壳 + Web 内容区」模式；
- UPG-09 登出入口落设置页不受影响（Vue 页内迭代，非本单范围）。

---

## 派单交接段（程序员领单时按此执行）

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：工单表该行备注追加 `认领: <agent> worktree=mov-upg12 branch=feat/upg12 @<时间>`（worktree 命名强绑定工单号）。
2. **完成后必须登记两个表**（先表后库）：
   - `工单表.xlsx`：程序员列 `✅完成`，备注列 `feat/upg12 <hash>（报告 DELIVERY_UPG12_*.md）`；
   - `工单库.md`：本单状态改为 `程序员✅完成，待验收`。
3. 交付报告落点：`程序员\交付报告\DELIVERY_UPG12_*.md`；报告里明确写「已登记两个表」。
4. 全部产物提交主仓库 `0027-mov` 分支 `feat/upg12`，交付时报 hash。

---

# UPG-13 登录页视觉修订（用户 6 条 + 顺手修）
**分类**：M8 UI/交互


### 设计师追加项 #8（@2026-08-27，用户指令，验收前并入本单同分支）

**协议勾选框换黑白灰样式**（参考 设计师/方案设计/UPG-13_勾选样式参考_deepseek.jpg，DeepSeek 登录页黑圆白勾）：

- 勾选态：圆形黑底（#1A1A1A）+ 白色 ✓；
- 未勾选态：圆形灰细边（#D1D5DB）空心，**全面去蓝**（现 agreeCb buttonTintList=blue 一并清除）；
- 尺寸 20~22dp，与协议文字基线对齐；勾选/未勾选两态截图入证据；
- 自绘 selector drawable 即可，不引第三方资源；勾选逻辑（agreed 状态机、refreshEnabled）不动。


### 设计师追加项 #9（@2026-08-27，挂账-upg13-tab往返发码按钮消失 转工单，P1 验收前置必修）

**Tab 往返发码按钮消失修复**：`applyModeUi()` 只有 `if (mode == "pass") sendBtn?.visibility = View.GONE`，只藏不回。修法（挂账建议原文照录）：补 else 恢复——`else sendBtn?.visibility = if (mode == "code") View.VISIBLE else View.GONE`（按实际可读性一行或两行均可）。

- **回归断言必须补**：Tab 往返用例入测试（验证码→密码→验证码后 sendBtn 恢复 VISIBLE；断言锚 applyModeUi 的 else 恢复分支，变异：删 else → 必红）；
- 复验口径：emulator 三段 dump 重放（重启在 → 密码 tab 消失 → 切回恢复），验收员按此复核；
- 同源说明：UPG-09 772e2a5:357 预存、UPG-13 继承，本单修复即两单同源病根一起消。

### 设计师定夺（@2026-08-27，针对交付报告 §五两项）

1. **Policy 页头部：维持无栏，不自绘头部**。依据：`assets/privacy/privacy.txt` 首行即「MOV AI 隐私政策」正文大标题，页面自带题头；返回走系统手势/返回键（默认 finish 可用）。无审核风险。
2. **ic_wechat 自绘示意 glyph：随包保留**。依据：该位为置灰预留态、非真实微信登录入口，不构成微信品牌使用场景；待微信登录真上线（未来单）必须换官方素材——届时作为该单的施工项写入，不另立挂账。



```status
phase: merged
branch: feat/upg13
head: 6410cb3a
std: —
delivery_id: —
designer: —
dev: —
inspector: ✅ **审验通过 @2026-08-27（整单 a49c68a+583a40f+6410cb3 无已知缺陷：#8 复验成立、#9 独立复验含
merge: **设计师✅已合 main @2026-08-27**（feat/upg13 6410cb3 ff 合入，已推 origin）
actor: sys04-backfill
updated_at: 2026-09-05T08:42:05
```

**状态**：✅ **审验通过 @2026-08-27（整单 a49c68a+583a40f+6410cb3 无已知缺陷：#8 复验成立、#9 独立复验含变异亲杀+真机终验）→ **设计师✅已合 main @2026-08-27**（feat/upg13 6410cb3 ff 合入，已推 origin）｜ **优先级**：P1（阻塞 release 出包，随包交付）｜ **出单人**：设计师 ｜ **日期**：2026-08-27

## 标题

登录页视觉修订：Logo 放大去圆形底板、删 slogan、隐藏顶栏、协议区上移、输入框规格统一

## 背景

用户实测合并后登录页（R4_01 截图）提出 6 条修订；另有设计师已落档的 P3 观察（微信位折行裁切）顺手同单修。施工对象仅 `LoginActivity.kt`（已合 main b3b3c6e），零逻辑零接口改动。

## 修订清单（照此施工，现状锚点已标注）

| # | 修订 | 现状锚点（LoginActivity.kt） | 目标 |
|---|---|---|---|
| 1 | **Logo 放大** | :229 logo 84×86dp（200dp 框内偏小） | 放大至 ~150dp 量级（保持透明底 PNG `R.drawable.mov_logo`，FIT_CENTER，不加底不描边） |
| 2 | **删圆形底板** | :212-218 halo（OVAL 白色渐变光晕 220dp） | 整个 halo View 删除，只留透明 Logo 直贴页面底色 |
| 3 | **删 slogan** | :108-114「让 AI 成为你的日常」 | 该 TextView 删除；品牌区剩 Logo 一个元素，垂直居中 |
| 4 | **隐藏顶栏黑框** | 类未调 `supportActionBar?.hide()`（AppCompatActivity 默认 ActionBar 显示 MOV 黑栏） | `onCreate` 加 `supportActionBar?.hide()`；同口径顺手修 `PrivacyGateActivity`、`PrivacyPolicyActivity`（同款黑栏，R3 截图在案） |
| 5 | **协议区上移** | :188-204 协议行在页底（微信位之后） | 挪到表单区内：最后一个输入框之下、「登 录」按钮之上（勾选逻辑、链接、《用户协议》《隐私政策》文案均不变） |
| 6 | **输入框规格统一** | :131/:133 phoneEdit/passEdit 未设高度（wrap_content），:136 codeEdit 52dp——高度不一 | 三个输入框统一 52dp 高、MATCH_PARENT 宽、同圆角同底色同 padding；codeRow 内 codeEdit 与 sendBtn 高度对齐不变 |
| 7 | **微信位折行修**（设计师 P3 顺手） | :176-178「微信登录即将上线」文本塞 52×52dp 按钮 → 折行裁切（R4 截图可见） | 改为图标+单行说明形态（微信 glyph 置灰 40%，旁边一行 12dp 灰字「微信登录即将上线」，不折行不裁切） |

## 验收标准

- **L1**：编译绿 + 全量单测绿（`--rerun-tasks` 真跑，防 up-to-date 假绿——审验员 08-27 新规）；本单纯视觉，无需新增单测，但 LoginValidatorsTest 等既有断言必须全绿。
- **L2**（真机 emulator-5556/5554 截图入 ACCEPTANCE_LOG）：修订后登录页全图一张 + 逐条对照（Logo 大且无圆底、无 slogan、无顶栏、协议在输入框下登录钮上、三输入框等高、微信位不折行）；键盘弹起态表单仍完整可见（adjustResize 不回归）。
- **L3**：隐私门控 → 同意 → 登录页链路重走一遍不回归（UPG-09/11 合流路由不动）。

## 红线

- 只动视觉与布局：登录/验证码/校验/倒计时/登录态拦截逻辑一行不改；接口调用零改动；
- Logo 只用现有透明底 `mov_logo.png`，不替换不加工；
- 协议文案与链接行为不变（UPG-11 合规口径）；
- Token/KV 申报「无影响」。

## 派单交接段（程序员领单时按此执行）

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：工单表该行备注追加 `认领: <agent> worktree=mov-upg13 branch=feat/upg13 @<时间>`。
2. **完成后必须登记两个表**（先表后库）：工单表程序员列 `✅完成` + 备注 `feat/upg13 <hash>（报告 DELIVERY_UPG13_*.md）`；工单库状态改「程序员✅完成，待验收」。
3. 交付报告落 `程序员\交付报告\DELIVERY_UPG13_*.md`，写明「已登记两个表」。
4. 产物提交 `0027-mov` 分支 `feat/upg13`，交付时报 hash。

---

**分类**：M4 工具/MCP 集成

**状态**：✅ 方案 v1.2.1（v1 分层溯源过 @8af7da9；v1.1 灵感库增补；v1.2 评审一轮；v1.2.1 = 2026-08-29 二轮评审 + 源码实证定案[shell.exec schema/权限双门/tool.help 直呼]，见卡末「评审意见处置」），📌 待派单（~~开工前置：UPG-01 批 1 合 main~~ → ✅**前置已解除 @2026-08-29：UPG-01 批1 已合 main 107f9c2，登记层数据源就绪——可认领**）｜ ✅**C 完成 @2026-08-29 23:3x**（feat/upg27 **0efda79** 已 push origin，基底 main af68d22 新分支；两件全交：①SDK 提示节生成——ToolSdkGenerator 同源纯函数[目录层 **138 工具全集非 agentToolSchemas**[code filtered 只剩直呼面 2 个，实测修正空壳化]·短描述过渡=description 首句截断+待补标注[summary 源超限 fail-loud]·常用集签名层[配置态冷启动空态诚实声明]·调用范式全路径判例[shell.exec→8389 tools/call+引号转义样例+token=运行时注入变量]·权限双门如实[tier 经 permissionTier 单源]·错误三分声明；版本化冻结=确定性生成同输入同输出+版本元数据入配置态 code_sdk+文本零落盘] ②tool.help——harmless 免批+codeTools 直呼[**L4 唯一改动点 :284 扩入**]+单查/批量+TOOL_NOT_FOUND 命名空间感知近邻+INVALID_ARGS 指引+≤1500 tokens 摘要先行；调度器 knownTools 注入[塌缩分支三分 TOOL_COLLAPSED/TOOL_NOT_FOUND 可区分+热挂摘同步]；验证=L1 全量 **54 类 383/0/0+1跳过**[rm -rf 强制重跑]+ToolSdkGeneratorTest 8 用例[结构/声明生成化/契约/同源/三分执行层/fail-loud/冷启动]+变异三条亲杀[M1 删装配/M2 空返回/M3 忽略 registry]+assembleDebug 绿+check-token-effect 过；Token 申报=code 前缀 13-18K→2 schema+SDK 节≈3.3K tokens[≈3-4x 收益；all tokens 禁 KB]；默认 BOTH 零变化；红线七条全对齐；报告 DELIVERY_UPG27_2026-08-29.md；已登记两个表）——待验收员 L2 真机[code 模式真实任务/双门实测/tool.help 直呼/塌缩自纠]+L3 对比观察[prefix cache 命中率/计费 token/长尾主导任务]｜ 🔴**验收员打回 R1 @2026-08-30**（L1 亲跑复核：全量 54 类 383/0/0+1 复现一致、ToolSdkGeneratorTest 实测 **7** 用例[申报 8 有偏差]全绿；变异三条验收员亲做复核：M2 空返回/M3 忽略 registry 均亲杀属实[各 2 用例红]，**M1 存活**——装配点 `if(false)` 短路后全量 383/0 全绿，「M1 删装配→红」申报失实，根因=全测试树无装配点锚[纯函数测试不覆盖 MainActivity 装配分支]；**P2 outputHint 编造**：toolHelpDoc 的 docs[].output 用**输入 properties 键**冒充「顶层返回键含: …」（file.read→「顶层返回键含: path」），而 file.read 实际返回 ContentBlock.Text 无任何顶层键——22+ 已登记工具中全部有参工具中招，误导 AI 返回结构预期，申报「output 缺失容错」与实现「编造」不符；修复项三项：①outputHint 改诚实形态[无 output 数据源恒「（output 声明待登记——批 3 清偿在途）」，禁从输入 properties 推导返回键]+补断言锁死[file.read 的 output 不得含「顶层返回键含:」] ②补装配点 L1 锚[源码锚或结构锚，让「删装配」变异真红] ③报告申报修正[M1 亲杀更正+用例数 7]；L2 真机四项修复后随复验执行[本单修复会改 SDK 节与 tool.help 内容，先修后验免二次占用设备]；证据=`0027-mov/docs/ACCEPTANCE_LOG.md` UPG-27 条目）｜ ✅**C R1 完成 @2026-08-30 00:45**（feat/upg27 **ca47f01** 已 push origin；三项全修：🔴M1=新建 **CodeModeWiringContractTest** 装配点活行锚[if(presentationMode==CODE) 条件行精确形态锚——验收员原变异 if(false) 短路条件行变形必红 **R1 复核实证**]+buildSdkSection 调用活行+knownTools 三处同步计数锚[≥3 活行]；可达性行为面如实申报归 L2 真机 code 模式 SDK 可见性[锚为形态级]；**变异复核改全量口径真跑[弃 --tests 过滤]** 🟠outputHint 诚实化=恒「（output 声明待登记——批 3 清偿在途）」[禁输入键冒充]+ToolSdkGeneratorTest 锁死[三抽样断言恒待登记+禁「顶层返回键含」回潮] 🟡申报更正=7 用例非 8+M1 表述以锚测试为准；P3 顺带=nearSuggestions/nearHint 双实现对账断言[调度器 TOOL_NOT_FOUND 文本必含生成器 top1]；验证=**变异三条全量口径真跑 M1/M2/M3 全杀**[含验收员原变异形态]+还原绿+L1 全量 **55 类 388/0/0+1跳过** 强制重跑 XML 实证[=383+CodeModeWiring 3+ToolSdk 新增 2]+assembleDebug 绿；报告 DELIVERY_UPG27_R1_2026-08-29.md；已登记两个表）——待验收员复验：M1/M2/M3 全量口径亲杀复核+output 诚实化抽查；**L2 真机四项先修后验随复验执行**[修复改 SDK 节内容]【L2 真机补验 @2026-08-30（21770d7d）：双门权限门✅/tool.help 直呼✅（outputHint 诚实化生效）/schema 门⚠️跨批依赖（分支基底早于批3 清偿，非回归）；code 模式真实任务+塌缩自纠 ⏳ 阻塞——**发现 P1 code 模式无用户手控入口**（uiOnlyMcpTools 过滤 set_mode + togglePresentationMode 零调用点 + 极简模式占位 toast）→ 已挂账待审（见 ACCEPTANCE_LOG UPG-27 R1 §5）】→ ✅**设计师验证属实 @2026-08-30**（见挂账登记表，main 亲核）→ 🔧 **P1 修复项（挂账1 转单）**：补呈现模式 UI 切换入口（顶部「极简模式」占位钮接线 `togglePresentationMode`）+ presentToken 状态切换/持久化（presentationMode→SharedPreferences），修复后复验 L2 code 模式两项（schema 门随批3 清偿自动过）；**feat/upg27 未合 main，修 main 侧即可随本单合入** ｜ ✅**C 修复完成 @2026-08-30**（feat/upg27 **ace425c** 已 push origin[force-with-lease 覆盖远程旧 ca47f01]；rebase 至 main 8f8debd；顶部「极简模式」占位 toast→接线 togglePresentationMode[both→code→native→hardware→causal→both]+toast 模式反馈+SharedPreferences 持久化[mov_presentation_mode/mode=enum name；onCreate 恢复+非法回落 both+set_mode handler 同持久化]；presentation.set_mode 维持 uiOnly[铁律 1 零触碰]；Upg27FixContractTest 6 锚[钮接线无占位/持久化接线/恢复/实现齐全/uiOnly 维持]+变异 2/2 亲杀[占位 toast 回潮必红/onCreate 恢复删必红]+全量 58 类 421/0/0+assembleDebug 绿+check-token-effect 过；Token/KV 0/0；报告 DELIVERY_UPG27修复_UPG07批2修复_2026-08-30.md；已登记两个表）——待验收员修复复验[顶栏钮切模式 toast+重启保留+L2 code 模式任务与塌缩自纠随 R1 复验]；schema 门随批 3 清偿自动过 ｜ ✅**C L2 真机复验完成 @2026-08-30**（21770d7d；报告 DELIVERY_UPG27_L2复验_2026-08-30.md；复验前置 rebase origin/main c753e8a 遇语义冲突[UPG-27 旧静态表 patch vs UPG-01 批4 静态表日落]→解析=保留日落+**tool.help 补登记 B5**（meta/HostToolMetaB5.kt，聚合五表，commit 7bd83f2，rebase 后全量 58 类 427/0/0）——**项1 code 真实任务 ✅ 全链**（turn1：code system SDK 节[可直呼 shell.exec/tool.help+目录 161+调用范式 8389 curl 判例+权限双门+错误三分]→AI 推理直呼→approval/asked 外层门→批准→tool/result ok=true exitCode=0 真执行 ls -la /sdcard+AI 二次修正）**双门 ✅**（外层 shell.exec ASK×12[含 allowed-turn 豁免链 reason=本轮已允许(1)]+内层写类 obsidian.file.write ASK×3）**项2 塌缩自纠 ⚠️**（TOOL_COLLAPSED 三分语义实测文本规范✅+AI 收后自纠转替补工具✅——但「按指引转 shell.exec」被**新 P1** 阻断）——🔴**新发现 P1**：SDK 节工具名=点号（shell.exec）vs AI 面直呼名=下划线（shell_exec×45 成功/点号×12 全塌缩）——ToolSdkGenerator 输出面未与 AI 直呼面名对齐→已挂账[挂账-upg27-sdk工具名点号下划线错位]；🟡新 P2 观察：顶部极简钮 tap 真机无响应[右缘手势区嫌疑，journal 内 code system 留证]→已挂账[挂账-upg27-顶部极简模式钮真机点击无响应]；证据 验收员证据数据6-08-30UPG27（system_code_sdk/turn1_chain/collapse/approval 摘录+截图 2 张）；已登记两个表）——**待设计师裁决**：项2 销项 or 随 P1 修复后复验；P1/P2 转工单——【✅ C 单1（AI 模型三级管理 UI）完成 @2026-08-30（feat/ai-model-ui **0dc9318**，基底 main e9aa7bc）——一级设置页「AI 模型 ›」一行（两行→一行+key 并三级+空态引导「去添加」）；二级列表（名+当前✓+快速测试 5 类分型错误+启用开关+唯一添加+空态引导卡）；三级（连接方式 ○云端○本地自部署 先选动态字段+复制模型[新 entryId+key 不复制+自动进编辑]+删除含 key 确认「API Key 将一并删除,不可恢复」+设为当前）；约束落实（三态分离/只存 keyName/urlKind 集中分型 云 HTTPS only 本地 localhost+LAN）/接 model.* 真实增删；真机 21770d7d CDP 全链[列表/三级动态字段/增入库/复制/删除确认/setDefault 切换/环境还原]+截图 3 张（证据 验收员证据数据6-08-30UPG27单1）；verify 27 锚全过+L1 57 类 424/0/0+assembleDebug 绿；顺手修复 bug[编辑态「设为当前」未生效（model.update 无 id 返回→setDefault 短路）→ editingId 兜底]；Token/KV 0/0；观察项 3 条[复制本地模型 keyName 落 deepseek_key/删除不清 credentials/分型持久化留单4-5]；报告 DELIVERY_AIModelUI_单1_2026-08-30.md；已登记两个表——待验收员 L1 复核+L2 独立走查）】——】【✅ C 单A（Memory API 工程契约）完成 @2026-08-30（feat/ai-model-ui **3bf598f**，与单1 同分支）——:memory-core/:memory-api 模块化[纯 JVM 零 Android 依赖/app 仅依赖 api(Gradle+源码边界 3 用例)]；7 API 统一 Envelope{ok,code,data,syncToken,seq}；状态机逐格[promote/remove/restore×三态+幂等+restore 恢复 previousStatus+previousPinned(5s 窗口)+remove 立即 tombstone+死错误码零出现]；memoryChanges[seq 单调+压缩保留→SYNC_TOKEN_INVALID 自愈+新 token 成基线+在途竞态按 id 去重+lastUsedAt 不进流(锚③)]；pinned 归属 api 层[上限 3 原子 check-and-set/移除释额/草稿晋升保持/tombstone 快照 previousPinned]；keyset 分页[排序元组+id/ACTIVE pinned DESC lastUsedAt DESC/DRAFT pinned DESC createdAt DESC]+facets 精确计数+30/页；持久化[原子 tmp+rename/version 迁移幂等/损坏容错/saveFailures 注入]；MainActivity 接线+importSeeds 自现有聚合[幂等/SHA-1 id/expired 跳过]；测试 core 8+api 16+边界 3（含锚③/死码/Envelope/竞态/自愈/分页/facets/置顶/seed 幂等/故障注入）+**变异 3/3 亲杀**；全量 app 58 类 427/0/0+core 8+api 16=451 用例 0 失败+assembleDebug 绿；Token/KV 0/0；范围边界如实[AI 工具面 memory.* 未切门面=双库观察，契约边界未含]；报告 DELIVERY_MemoryAPI_2026-08-30.md；已登记两个表——待验收员 L1+L3（自动化 XML 全备）；】【✅ C 单1
【✅ 验收员 L1 通过 @2026-08-30（ACCEPTANCE_LOG 3042d2d）：八节核物+14 用例[ToolOrchTest 11+EvalTest 3]+全量 457/0/0+变异 2/2 亲杀[①删胶囊偏好块→Context 胶囊块在场红 ②删 L3 词表→风险兜底+六指标 SafetyGate 双红]+边界与申报一致[评测集内回归/规则式提取/未接执行链]；P3×2[「全部 1.0」口径 vs 断言≥0.8（NO_CALL 1.0 精确绿）；Context 顺序无断言建议补锚]——待设计师合 main】
（Tool Orchestration Runtime）完成 @2026-08-30（feat/tool-orch **bc58a01**，基底 main 7992904）——:tool-orch 纯 JVM 引擎：Context 四源组装（系统/历史/记忆/工具Schema+胶囊偏好，顺序+预算）、Tool Decision（NO_CALL 合法+CALL+MULTI_CALL；胶囊偏好提权非锁定；decisionReason 结构化无 CoT）、Argument 四类阻断（缺参/歧义/非法枚举/超权限+规则式提取：示例/引号/数字ID/给X发/trigger后文本/预订名）、Safety Policy 自有风险分类 L0-L3（annotation 缺失兜底+L2/L3 确认门）、编排 Parallel/Sequential/Conditional、Tool RAG（threshold 160+topK 24）、Trace 14 字段（无 CoT）+评测集 12 用例六指标[Selection/Argument/No-Call P&R/Multi/Safety Gate 全 1.0]+desc 改动前后回归不降；接线：app 依赖 :tool-orch+MainActivity toolOrchTools=hostToolMeta 投影（annotations 推导，自有分类兜底）+单2 复用接口就绪；测试 tool-orch 14/0+全量 app 61 类 443/0/0+assembleDebug 绿；Token/KV 0/0；边界如实[未接执行链（调度器不变）/规则式参数提取/desc 回归=测试内]；报告 DELIVERY_ToolOrch_2026-08-30.md；已登记两个表——待验收员 L1 六指标；】【✅ C 单A 打回修复 @2026-08-30（feat/ai-model-ui **0aa0c07**，rebase 7992904——单1 已合 ca0e490，分支仅单A 差异）——P1 边界违例修复[门面工厂 MemoryApiService.create(baseDir)+SeedEntry.status 改 API 术语字符串（DRAFT/ACTIVE/TOMBSTONE，呈现层零触 MemoryStatus 枚举）；app/src/main grep com.hermes.mov.memory.core 零命中]；boundary ②③ 假绿修复[路径真实探测（src_main/../memory-core 不存在即断言失败）+豁免收窄仅注释行（注释外 android. 即真实违例）]；变异亲杀 3 态[直引 core→boundary ② 红✓ / Class.forName("android.util.Log") 字符串引用→boundary ③ 红✓ / 注释行豁免不红✓]——恢复后全量 468 用例 0 失败（core 8+api 14+boundary 3+app 62 类 446）+assembleDebug 绿；Token/KV 0/0；报告 DELIVERY_MemoryAPI_单A_修复_2026-08-30.md；已登记两个表——待审验员复核（boundary 三绿+P1 变异日志）→ 合 main**——【✅ 验收员 L2 复验 @2026-08-30（ACCEPTANCE_LOG 3021，分支 7bd83f2+545a440，APK 16:46 装机）：⏳ **未通过** 但有据——✅入口/切 code/持久化（MOV-Boot「工具面模式: code（agent 工具面 2 工具）」+重启仍 code）+✅塌缩自纠完整链（TOOL_COLLAPSED×14→AI reasoning「不在当前工具面，改用 file_read/search」→转 search 真执行 14004 列出文件）+✅外层 shell.exec 恒 ASK（ASKED×2+ApprovalVis visible+8389 面 APPROVAL_REQUIRED）；⏳ 未闭环=真实任务全链+双门内层（**验收员侧审批弹窗 3ms auto-cancelled**=uiautomator Accessibilty 干扰/窗口竞争——自认非代码缺陷、不挂账、建议重测后复验）+AI 发送链不稳（2/6 已知难点）；**🔴 主阻塞=新 P1 已独立佐证**（点号→McpToolScheduler :283 归一 :320 handlers[name]/handlers[exec.name] 双 miss→TOOL_COLLAPSED；下划线→成功×45——挂账 upg27-sdk工具名点号下划线错位 确认属实）；**修复方向已定=「AI 按 SDK 引导直呼点号应成功执行」**（即调度器 handler 查找补点号→下划线归一 fallback，非改 SDK 为下划线）；🟡 P2（顶部钮右缘手势区）确认属实挂账在册；**⚠️ 验收员证据目录 UPG27L2/ 未落盘**（ACCEPTANCE_LOG 引用路径不存在——留证补落提醒）；程序员已登记（工单表）】——**程序员待命**：P1 修复（方向已定）等派单即开工 —【⚠️ C P1 修复派单回执 @2026-08-30：**P1 证伪（未实施修复，生产零改动）**】①journal 逐回合对照：12 次 TOOL_COLLAPSED 全在 **native 面**（line 730/845/1007 system=「当前工具面模式：native」），code 回合（seq3956）零点号塌缩样本——「code 面点号直呼塌缩」无实证；②机制：handlers=mcpHandlers（**点号键** :3629）+known=点号键 :3631+allowed=点号键 :6581；LLM 层 sanitize（DeepSeekAdapter:360 点号→下划线）仅影响 schema 展示；调度器 :283 归一查点号键→点号/下划线两形态均命中；③JVM 生产同构实验：两形态直呼均达权限门（非塌缩）+native 面塌缩保留；新增 SchedulerDotNameBehaviorTest 锁定；全量 61 类 443/0/0；commit ce5fac9 已推；报告 DELIVERY_UPG27_P1修复_2026-08-30.md；**待出单人裁决=撤销 P1 挂账/转 SDK 点号一致性 P3 观察（可选）/P2 另派单** → ✅ **验收员独立复核 @2026-08-30 晚**（ACCEPTANCE_LOG 5e44347）：P1 证伪复核一致（mcpHandlers=点号键 t.name + TOOL_COLLAPSED 3 样本所属面=native）——**P1 挂账误报注销**；**UPG-27 L2 最终判定 = ✅ 通过**（项1 真实任务链+双门=程序员注记✅+独立✅；塌缩自纠✅；P2 顶部钮=观察项；3ms 弹窗=验收员 uiautomator 干扰不挂账）——**UPG-27 本体待合 main（+P2 观察）**；【✅ 验收员单A 验收通过 @2026-08-30（ACCEPTANCE_LOG ec9c3fd）：feat/ai-model-ui 3bf598f——模块化/7 API Envelope/状态机逐格/restore 5s 窗口/remove 立即 tombstone/changes 自愈/pinned 上限 3/keyset 分页+facets/原子写盘+迁移+故障注入/importSeeds 核物全过；独立验证 core 8/0+api 14/0+boundary 3/0+app 427/0/0（=449，申报 451 差 2=P3）；变异：M1 删 restorePinned 红✅ M2 remove 不 tombstone 红✅ M3（app import memory.core）未红——揭示 boundary ②[原文字读取]假绿（File&apos;app/src/main&apos; 在 :app:test workingDir=app/ 解析到 app/app/src/main 不存在→空扫恒绿）——P3 建议修测试路径（Gradle+core 零 Android 两锚已验证有效）；L3=merge 7992904 零冲突+未触碰 memory 工具面（双库=边界外如实）→ 待设计师合 main】
【✅ 验收员边界修复复验通过 @2026-08-30（ACCEPTANCE_LOG 2e0c874）：0aa0c07（rebase 7992904）——门面工厂 create(baseDir)+SeedEntry.status 净化+app 零 core 直引（grep 实测空）；boundary ②③ 真绿化[路径双探测+基准不存在断言失败+豁免仅注释行]；变异 3 态：①P1 直引→②红[决定性对比：假绿版同变异未红] ②Class.forName 注释外→③红 ③注释行→不红（豁免正确）；468/0/0——待审验员复核→合 main】 ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-29

## 背景（用户拍板提前出卡，灵感库三线对账产物）

MOV 已有 Code Mode **半成品**：呈现模式五档在案（`MainActivity.kt:178/3410-3425`），但 `codeTools = setOf("shell.exec")`（`:193`）——code 模式下 AI 只看到 shell.exec，E3 提示节（`:4275-4300`）只给**工具名列表**不给签名，AI 不知道有什么工具、怎么调。dsh 的 Code Mode 范式（`灵感库/项目源码/deepseek-harness-master`，`core/tools/src/index.ts:651-659`）= 执行器 + **自动生成 SDK 提示节**。MOV 的独特优势：**执行通路天然存在**——shell.exec → 本机 MCP 面（127.0.0.1:8389，executeTool 通道，验收员 M3 全程实证此链路可调任意工具且过权限门）——本卡**不需要新执行器，只补「告诉 AI 怎么调」的那一半**。

## 交付两件

**件 1：Code Mode SDK 提示节生成**
- code 模式下，systemPrompt 的 E3 提示节（`:4275-4300` 单点装配）从「工具名列表」升级为**生成的 SDK 文档节**：对在面工具生成紧凑签名文档（name + 一句话描述 + 参数签名 + 调用方式[经本机 MCP 面 executeTool]），数据源 = ToolDefinition 登记层（UPG-01 批 1 已合 main；过渡口径 = 现有三通道，按批 1 落地态切登记层）；
- **SDK 节两级分层（v1.2 定案；v1.2.1 补短描述来源）**：①**目录层**——全量在面工具「name + 一句话短描述」常驻（目标 ≤3K tokens），消灭「长尾不可见→无从 tool.help」的可发现性死锁（评审定案 (a) 必做）；**短描述来源（v1.2.1）** = 登记层新增 `summary` 专用字段（可控长度）+ 生成器强制 per-entry token 上限（超限 fail-loud 不静默截断）；过渡口径 = 截断 description + 逐条标注待补；②**签名层**——常用集（频次 Top N，输入 = 批 2 产物 `tools/journal_freq_top.mjs`；N 以 Token 实测定）附加参数签名；③长尾**签名与长文档**走件 2 `tool.help` 按需取（book-to-skill #12 分层范式：常驻核心 + 按需章节）；
- **SDK 版本化冻结（v1.2）**：会话开始绑定当前 SDK 版本，会话内不重排不漂移（请求前缀恒定）；后台按天/周或 Top N 成员变化 >20% 阈值重生成版本；**版本元数据（版本号+成员名单）入配置态**——SDK/长文档文本仍零落盘、运行时由登记层派生（「禁落盘」红线不因版本化破例）；冷启动初始常用集 = journal_freq_top.mjs 现状产物，不等频次积累；
- **shell.exec schema 定案（v1.2.1，源码实证）**：现状 = **单字符串 `command` 入参**（`MainActivity.kt:386` paramSchema("command" to "string")；:3598 handler `args["command"] as? String`）——即「真 shell 命令内嵌 JSON」形态，嵌套转义（引号/换行/中文）是经典翻车点，单判例救不了；处置：①判例**必须含「参数值含引号」的转义样例**；②JSON 解析失败返回**结构化错误（带位置 + 指引）**；③结构化 `{tool,args}` 对象入参改造**违反本卡红线 1（不改调用签名）——挂账另立小单**，本卡按现状 schema 定案；
- **权限双门定案（v1.2.1，源码实证）**：外层 shell.exec **恒 ASK**（`isHighRisk`「任意代码执行」，open 模式不豁免，`McpToolScheduler.kt:185-191`）+ 内层 8389 executeTool **独立过 guard**（`McpServer.kt:109-111`「MCP 入口同样过 guard」）——SDK 节如实写双门（外层每次弹确认 + 内层写类再弹），不粉饰；文档中的权限标注一律经 `permissionTier` 单源访问器取 tier 字符串（UPG-23 纪律），名单本体不进 AI 面；
- SDK 节含「如何经 shell.exec 调本机 MCP 面」调用范式说明（端点/token 位置/JSON-RPC 形态），权限口径写实（写类仍 ASK 弹窗）；范式说明须配**一个完整可复制调用判例**——**必须展示 shell.exec→executeTool 全路径**（含外层包装，不能只给裸工具名 JSON，防模型把目录当直呼面；评审建议 2）；判例选**读类无害工具**（如 file.read/obsidian.search——双门下外层仍会弹确认，选读类是保证示例无副作用可复现），显式标注**双门权限现实**（外层恒 ASK + 内层写类再 ASK）（video-shotcraft #7 判例式）；token 写「运行时注入变量」占位；
- **塌缩声明 + 塌缩契约（v1.1；v1.2.1 定案直呼面与声明生成化）**：①**直呼面 = `codeTools = {shell.exec, tool.help}`（v1.2.1）**——tool.help 读类无害直呼（查文档不该再包一层 JSON-RPC 转义，二轮评审定案）；②「code 模式仅 {直呼面} 可直呼」规则声明放在 SDK 文档**之前**（dsh `COLLAPSE_SECTION_ORDER` 先于工具指引），**声明文本由 codeTools 集合生成、禁模板手写**（同谓词纪律延伸：未来加第三个直呼工具时声明自动同步，防自漂移），且声明内钉死目录层语义：**目录列表 = 可经 shell.exec 间接调用的工具，非可直呼面**；③声明与执行拦截必须**同一谓词/同一数据源**（dsh `index.ts:859-861`「same predicate」——prompt 声明的面 = rebuildAgentTools 过滤面 = codeTools，不许两套口径）；④直呼非在面工具 → 结构化错误，语义**三分（v1.2.1）**：**「已塌缩」（工具存在、仅 code 面不直呼，指引走 shell.exec）**/**「真未知」（工具不存在，TOOL_NOT_FOUND+近邻）**/**「参数校验失败」（schema 不符 → code=INVALID_ARGS + 指出具体字段 + 指引「tool.help 查该工具字段」，对齐 E4 失败结构化口径——长尾工具凭目录名猜参数，此类最高发）**（dsh `index.ts:1373-1381` 两类分流 + 二轮评审补全），防 AI 循环瞎试（ego-lite #4 稳定 code + 指引措辞）；
- 生成器对**登记层字段缺失容错（v1.1）**：output 声明批 3 清偿前大量缺失（批 1 实测 22/22 全缺），output 段可选渲染，缺失不阻断生成；
- BOTH/NATIVE 等模式提示节维持现状不变——只升级 code 模式分支。

**件 2：tool.help 描述按需加载**
- 新增 `tool.help` 查询工具（**读类无害，权限 free**；**v1.2.1 定案：进 codeTools 直呼面**）：入参工具名 → 返回该工具完整三件套文档（长描述/字段说明/output/近邻差异点）；**支持批量精确名查询（v1.2.1）**——一次传多个确定工具名返回多个紧凑签名（省「目录见名→查签名→再调用」的轮次；与后置 fuzzy 不同，不诱导探索；总量上限同单次）；查不存在工具 → **结构化错误**（`code=TOOL_NOT_FOUND` + `nearSuggestions[]` 近邻候选，口径 = **命名空间感知匹配（v1.2.1）**：先匹配 `file.`/`browser.`/`obsidian.` 等段，段内再编辑距离）+ 指引措辞（video-shotcraft #7 索引防幻觉：未命中报最接近候选，不臆造）；
- **同源生成（v1.1）**：tool.help 返回文档与件 1 SDK 节出自**同一纯函数生成器**（同数据源同渲染），严禁两处手写两套口径——登记层改一处，两面同步变；
- **返回大小上限（v1.2；v1.2.1 统一 token 口径）**：单次返回 **≤1.5K tokens**（原 4KB 口径的 token 化，与全文计量统一）；`longDescription` 超长 → 摘要先行（可二级取详情/字段级查询），journal 监控调用后上下文增长——防「长尾省 token」变「长尾文档塞爆上下文」（评审建议 3）；
- 长文档位随 ToolDefinition 内存态扩展（`longDescription` 可选字段），**禁落盘**（L6 平行数据源红线）；
- **fuzzy 搜索模式（v1.2 后置为可选增强，首发不做）**：目录层已让模型可见全量工具名，搜索必要性下降且诱导「先搜再调」多轮；后做必须带护栏——返回 ≤8 条 + 提示语「仅在不确定工具名时使用」+ 监控未命中率/搜索频率数据说话（评审定案）；
- 「AI 面常驻降级为短描述 + tool.help 按需」为**开关形态，默认不启用**——启用时机 = UPG-01 §五 Token 拍板（频次 Top 榜输入已在批 2 顺带产出）。

## 验收

- **L1**：SDK 生成纯函数测试（给定登记层 → SDK 文本含**目录层短描述**/常用集签名/调用范式/全路径判例（含转义样例+双门权限标注）、未登记工具不出现）；tool.help 契约（已登记→三件套、不存在→TOOL_NOT_FOUND+近邻、**返回 ≤1.5K tokens**）；**同源断言（v1.2 扩展）**：改登记层某工具描述 → SDK 节与 tool.help 输出同步变化，且**紧凑/完整两种渲染间签名与描述语义一致**（无漂移，评审建议 4）；**塌缩语义断言（v1.2.1）**：已塌缩/真未知/参数校验失败三种错误可区分且都带指引；**声明生成化断言（v1.2.1）**：改 codeTools 集合 → 声明文本自动同步；变异亲杀：①删 SDK 装配 → 必红；②tool.help 改空返回 → 必红；③同源断言改单面 → 必红。
- **L2 真机**：code 模式实测——AI 仅凭 SDK 节 + shell.exec 经本机 MCP 面完成一个真实任务（读 obsidian 笔记或查 12306），journal 可见 shell.exec→MCP→工具调用链 + **双门权限实测（外层 shell.exec 恒 ASK + 内层写类再 ASK）**；tool.help **直呼**实测返回真文档；塌缩实测——直呼非在面工具收到结构化错误且 AI 能据指引自纠转 shell.exec（journal 留证）。
- **L3 对比观察**：code 模式 vs BOTH 模式同任务选参正确率（呼应 UPG-01 §五 精度稀释预警）；**任务集（v1.2.1）必须显式含长尾工具主导任务**——否则对比只验证了常用集；**A/B 观察项（v1.2，非硬门）**：同任务集下 SDK 节混合形态（结构英文+描述中文）vs 全英文，比成功率/平均轮次/实际 token（注意：Top N 来自 BOTH 模式 journal，code 使用分布未必一致，勿把分布差当语言形态差）；**增测 prefix cache 命中率/实际计费 token（v1.2.1）**——版本冻结红利押在缓存上，不验证则「前缀恒定」只是纸面性质。
- **Token/KV 申报（v1.2.1 全 token 口径）**：code 模式工具前缀从 ~145 schema（估 13-18K tokens，ASCII schema ≈4 字符/token）→ 2 schema（shell.exec + tool.help）+ SDK 节（目录层 ≤3K tokens + 常用集签名层，**目标合计 ≤7K tokens**；长尾详情走 tool.help ≤1.5K tokens/次）；**计量口径**：经 `check-token-effect` 实测申报 + UPG-07 批 1 `estimateTokens` 加权估算（ASCII×0.3/CJK×1÷1.5/其他×1.2）——**卡内一律 tokens 禁 KB**（评审二轮抓的口径自违反：KB 在 ASCII/中文内容间系统性误导；实算收益约 2-3x 而非 KB 暗示的 4-5x，仍成立但口径要诚实）；默认 BOTH 零变化；**不得新增**会话中途变动点（模式切换是既有变动点；SDK 节=版本化冻结，会话内不重排——请求前缀恒定）。

## 红线

1. 不改工具行为/调用签名；不新造执行器（shell.exec + 本机 MCP 面是既定通路）。
2. SDK 文档**不得含敏感黑名单/权限名单内容**（permissionTier 单源访问器纪律，UPG-23 同款——名单不进 AI 面）。
3. 权限口径不变且**双门如实**（v1.2.1 实证定案）：外层 shell.exec 恒 ASK（isHighRisk 任意代码执行，open 不豁免）+ 内层 8389 executeTool 独立过 guard（写类 ASK）；SDK 不得教 AI 远程切模式（approval.setMode uiOnly，M3-R2）。
4. 呈现模式切换入口不动（presentation.set_mode 维持 uiOnly）；默认模式 BOTH 不变。
5. 遵守「请求前缀恒定」；token/token 路径绝不写进 SDK 文档明文（token 位置写「运行时注入变量」口径）。
6. **SDK 节与 tool.help 文档纯函数同源生成**（数据源 = 登记层单源），**禁止手写/硬编码任何工具文档**（video-shotcraft #7：登记层才是参数真相，严禁凭工具名重写近似文档）；「可直呼面」的 prompt 声明**文本由 codeTools 集合生成**且与执行拦截同谓词（dsh `index.ts:859-861`），不许 prompt 一套、registry 一套。
7. **Token 预算与上限一律 tokens 口径，禁 KB/字节**（v1.2.1：同一红线两套单位=自违反）；`summary` 长度超限 fail-loud 不静默截断。

## 分层溯源图（规则 20；v1 基线 @8af7da9，**v1.2.1 实测刷新 @0027-mov main**——UPG-01 批1/批2 合入后行号已漂移，下列全部为 2026-08-29 实测）

| 层 | 判定 | 证据（v1.2.1 实测行号） | 依赖声明 | 断点处置 |
|---|---|---|---|---|
| L1 用户可感知 | ✅ | 模式切换循环 :6396-6398 + presentation.mode 语义 :3523；E3 工具面面板可视化（:192）——本卡不动切换入口 | 触及 | 声明不依赖新 UI |
| L2 入口/桥接 | ✅ | **E3 SDK 提示节装配单点 :4405-4424**（现状=模式标签+仅工具名列表；:4409 已有塌缩声明雏形[仅「工具不存在」单语义，缺 v1.2.1 三分]——件 1 在此升级）；本机 MCP executeTool 通道 :8389（M3 验收全程实证） | 依赖 | 件 1 在既有装配点升级 |
| L3 数据源 | ⚠️ | ToolDefinition 登记层（UPG-01 批 1 已合 main 107f9c2；批 3 output 清偿在途）；过渡=三通道（sceneToolDescriptions/providerToolMeta/toolParamSchemas）实物在案；**v1.2.1 新增 `summary` 专用字段需求**（目录层短描述源） | 依赖 | ~~前置=UPG-01 批 1 合 main~~ ✅已解除；生成器对 output 缺失容错（v1.1），登记层切换按批 1 落地态接 |
| L4 运行时装配 | ✅ | 呈现模式过滤 rebuildAgentTools :6283；allowedTools 塌缩 :6302-6303（注释明言「不在当前模式的工具 agent 调用也 TOOL_NOT_FOUND——塌缩约束执行」）；codeTools :284 | 依赖 | 唯一改动点 = codeTools :284 扩入 tool.help（v1.2.1）；SDK 节走 systemPrompt 装配 |
| L5 执行器 | ✅ | shell.exec schema 实物 :386（paramSchema "command" to "string"）+ handler :3598（`args["command"] as? String`）——**单字符串形态定案**；**双门**：外层恒 ASK（McpToolScheduler.kt:185-191 isHighRisk）+ 内层 guard（McpServer.kt:109-111）；dsh run_code 范式在库参考 | 依赖 | 无断点（不新造执行器；结构化改造挂账另立小单） |
| L6 持久化 | ✅ | 呈现模式内存态 :269（重启回 BOTH，声明不改）；SDK/长文档由登记层派生零持久化（版本元数据入配置态，v1.2） | 触及 | 禁落盘维持 |

置信度 = **⚠️**（唯一 ⚠️ = L3 批 3 output 清偿在途，已用容错渲染处置；登记层数据源本身已合 main；v1.2.1 行号实测后 L4/L5 无漂移风险）。

## 灵感库增补溯源（v1.1，2026-08-29 设计师对账）

> 依据灵感库纪律「评估后再立项 / 引用机制标来源」；全部为代码实证结论（评估报告 file:line），只取机制不取形态。

| 增补点 | 来源（灵感库实证） |
|---|---|
| SDK 节两层分层（常用集常驻 + 长尾 tool.help 按需） | book-to-skill #12 分层技能（常驻核心 ≤4K token + 按需章节，省 24-51x，`评估_SkVM_C档四项目`）× dsh A3 code 模式（`packages/core/tools/src/index.ts:651-659`） |
| 调用判例入 SDK 节 | video-shotcraft #7 判例式（`library.json` 机器索引 +「demo 源码才是参数真相」） |
| 塌缩声明前置 + 同谓词纪律 | dsh `collapseSection`（`index.ts:47-60/840-863`：COLLAPSE_SECTION_ORDER 先于工具指引；「same predicate the executor denies by」:859-861） |
| 已塌缩 vs 真未知分流 | dsh 执行层塌缩分流（`index.ts:1373-1381`，两类 UNKNOWN_TOOL 语义区分）× ego-lite #4 稳定 error_code + 指引措辞（`ego-errors.ts:21-37/48-65`，`评估_SkVM_C档四项目`） |
| tool.help 结构化错误 + 近邻候选 | video-shotcraft #7 索引防幻觉（未命中报最接近候选不臆造） |
| 同源生成禁手写 | video-shotcraft #7 索引校验防幻觉延伸（登记层单源 = 参数真相） |
| output 缺失容错 | UPG-01 批 1 实测（output 声明 22/22 全缺，批 3 首批清偿） |
| CJK token 计量口径 | book-to-skill #10（`utils.py:74-90`，中文 ≈1.5 字符/token） |
| SDK 节稳定排序 | dsh `sdkSection`（`index.ts:879`「visible tools in stable order」） |

## 评审意见处置（v1.2/v1.2.1，2026-08-29 外部评审两轮回收）

> 外发评审文档（`Desktop\UPG27_CodeMode设计_外发评审版_2026-08-29.md`）回收意见：一轮七条全采纳（v1.2）；二轮五缺口+次要建议全采纳（v1.2.1，其中缺口 1 由设计师源码实证定案：`MainActivity.kt:386/:3598`、`McpToolScheduler.kt:185-191`、`McpServer.kt:109-111`）。

### 一轮（v1.2）

| 评审意见 | 处置（卡内落点） |
|---|---|
| 开放一：(a) 全量短描述常驻必做，(b) fuzzy 搜索后置可选 | 件 1 两级分层①② + 件 2 后置增强条（护栏：≤8 条/提示语/监控） |
| 开放二：会话冻结 + SDK 版本化（按天/周或 >20% 成员变化重生成） | 件 1「SDK 版本化冻结」条；版本元数据入配置态、文本仍零落盘 |
| 开放三：混合形态（结构英文+描述中文）+ A/B | L3 A/B 观察项（非硬门） |
| 建议 1：目录列表语义钉死 =「经 shell.exec 间接调用」 | 塌缩声明①内钉死 |
| 建议 2：判例展示 shell.exec→executeTool 全路径 + 读类工具 + 标注写类 ASK | 件 1 调用判例条强化 |
| 建议 3：tool.help 返回 ≤4KB + 摘要先行 + 上下文增长监控 | 件 2「返回大小上限」条 + L1 断言 |
| 建议 4：同源生成器覆盖紧凑/完整双渲染，防语义漂移 | L1 同源断言扩展（双渲染一致性） |

### 二轮（v1.2.1，动工前缺口五条全采纳）

| 评审缺口 | 处置（卡内落点） |
|---|---|
| 1. shell.exec 自身 schema 未定案（最大未决变量） | **设计师源码实证定案**：单字符串 `command`（`MainActivity.kt:386/:3598`）；判例含转义样例 + 解析失败结构化错误；结构化改造违反红线 1 → 挂账另立小单；工具本体输出回流无大小策略同条处置（spill 线 A1 接口预留） |
| 2. tool.help 直呼地位与「同谓词」自相矛盾 | tool.help 进 codeTools（读类 free 直呼）；「可直呼面」声明文本由 codeTools 集合生成，禁模板手写（塌缩契约②+红线 6） |
| 3. 错误面漏参数校验失败 | 塌缩契约④错误语义三分：已塌缩/真未知/INVALID_ARGS（带字段+指引，对齐 E4 结构化口径）；L1 断言同步 |
| 4. Token 预算 KB 违反「禁按字节估」红线 | 全卡 tokens 口径（红线 7 新增）；目标改 ≤7K tokens；点名 estimateTokens 加权（UPG-07 批 1） |
| 5. 短描述来源未定义 | 登记层新增 `summary` 专用字段 + per-entry token 上限 fail-loud；过渡=截断 description 标注待补 |
| 次要：批量精确名查询 / SDK 节教 tool.help 用法 / 上限单位 / 近邻命名空间感知 / Top N 分布差 / prefix cache 实测 | 件 2 批量查询条 + 件 1 判例条教用法一行 + 上限改 1.5K tokens + 件 2 命名空间匹配 + L3 A/B 注记 + L3 增测缓存命中率 |

## 派单交接段

1. 开工前 `git fetch origin` + 看表（规则 19）；UPG-01 批 1 已合 main（前置已解除）；卡内行号锚基线 @8af7da9，施工以最新 main 实测为准：工单表备注 `认领: <agent> worktree=mov-upg27 branch=feat/upg27 @<时间>`；
2. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_UPG27_*.md` 写明「已登记两个表」+ Token/KV 两节；
3. 产物提交 `feat/upg27`，交付报 hash。

---

# UPG-40 App 视觉风格统一（黑白主调 · logo 同源）
**分类**：M8 UI/交互


```status
phase: merged
branch: feat/upg40
head: c9298d07
std: —
delivery_id: —
designer: ✅ 方案 v1 定稿（五决策点已拍板 @2026-08-29，见「拍板记录」），✅ **C 完成 @2026-08-30 01:42**（f
dev: C 完成@2026-08-30 01:42**（feat/upg40 **f9e3f17** 基底 main 31769a0 已 push；
inspector: ✅**验收通过 @2026-08-30**（L1 376/0/0 亲跑+变异 4/4 亲杀+真机候选C 冷调近黑）+✅**审验通过 @202
merge: ✅**已合 main @c9298d0**（ff-only 已推 origin；合并后全量复跑绿；worktree mov-upg40 可收
actor: sys04-backfill
updated_at: 2026-09-05T08:42:05
```

**状态**：✅ 方案 v1 定稿（五决策点已拍板 @2026-08-29，见「拍板记录」），✅ **C 完成 @2026-08-30 01:42**（feat/upg40 **f9e3f17** 基底 main 31769a0 已 push；三刀：①tokens.css 契约段+候选C 皮肤值段（浅/深全 mono，danger 红保留）+新增 --bubble-bg/--bubble-text 契约 token ②RoomApp 气泡 var 化+markstream 重建[433 文件与 dist 全一致，旧 room-* 残留清零] ③原生 colors.xml mov_* 9 键+themes.xml MOVTheme+Manifest 挂载+5 处 0xFF0E7C5B 收编+紫头像灰阶；换肤标准 v1.1=契约固定+皮肤=纯值段+sync-pages.mjs 颜色契约校验[品牌绿零命中+契约全套+消费锚，违规 exit 1]；验证=L1 47 类 338/0/0+变异 4/4 亲杀+生产面品牌绿 0（0E7C5B/0A6649/34C79A+旧 rgba）；报告 DELIVERY_UPG40_2026-08-30.md；已登记两个表）→ ✅**验收通过 @2026-08-30**（L1 376/0/0 亲跑+变异 4/4 亲杀+真机候选C 冷调近黑）+✅**审验通过 @2026-08-30** → ✅**已合 main @c9298d0**（ff-only 已推 origin；合并后全量复跑绿；worktree mov-upg40 可收）｜ **优先级**：P1（上架物料前置） ｜ **出单人**：设计师 ｜ **日期**：2026-08-29


**【设计师关单 2026-08-31 · git 实证】**：origin/feat/upg27 领先 main 的 4 提交（624121b SDK 本体/867987d R1 三项/623364b 呈现模式 UI/7bd83f2 B5 聚合五表）经 `git cherry origin/main origin/feat/upg27` 实证**全部为「-」（patch 内容已 100% 在 main，经其他合入路径）**；三项抽查佐证：ToolSdkGenerator main vs upg27 零差异/HostToolMetaB5 在 main/togglePresentationMode 接线在 MainActivity:940-943+outputHint 诚实化 :142。**UPG-27 无需 merge，本单关闭（本体+单A+修复+复验全链在 main）**；遗留=P2 顶部钮右缘手势区观察项（挂账在册）+单1 观察项 3 条（分型持久化留单4-5）。
## 标题

App 内全端视觉收敛「黑白灰 + 可控强调色」并**交付换肤标准**：tokens.css 升级为「token 契约 + 皮肤段」结构（默认皮肤=候选C 冷调近黑，色值零写死）+ 聊天页色值 token 化 + 原生 colors.xml 单源收编 5 处硬编码品牌绿——**本卡交付的是可换肤的标准件，不是一次性的颜色替换**（用户指令 @2026-08-29：风格不能写死，后面还要能换肤，定好标准就行）。

## 背景（建议区草案 + 设计师逐屏识别增补，2026-08-29 实测）

logo 黑白线稿 vs 市场系绿 #0E7C5B vs 原生无主题裸奔——同一产品三张脸，上架展示图因此返工。逐屏识别增量（超草案部分）：①市场系 7 Vue 页 **0 硬编码 hex**（UPG-23 硬规见效，第一刀单点换值即全变，mock 已实证）；②**原生品牌绿残留 5 处**（MainActivity:720/:825 + PhotoAskSheet:40 + WebPageSheet:85/:125，后三处草案漏盘）；③全仓唯一非体系彩色 = WorkbenchPage:257 紫头像 #7c5cff；④**修正草案误判**：MainActivity:5828（原锚:5395 漂移）0xFF0000FF = 代码语法高亮关键字色（cKw，VS Code 配色组）——功能语义色保留，非「链接蓝」；⑤settings 默认态无 primary 可见元素（三候选截图 md5 相同实证）——L2 必含开关 ON 态。

## 拍板记录（2026-08-29 用户）

① 主色 = **候选C 冷调近黑 = 默认皮肤**（用户拍板；性质=v1.1 起为「默认皮肤值」而非写死色）（light #23272F / strong #171B22 / on-primary #ffffff / primary-text #23272F / tint rgba(35,39,47,.08)；dark #E8EBF2 / #F5F7FB / #1B1F27 / #E8EBF2 / rgba(232,235,242,.12)；聊天页气泡 #E4E7ED/文字 #23272F；原生 mov_primary=#23272F——完整表见 `设计师\\mock\\风格统一_2026-08-29\\风格统一改造点清单_2026-08-29.xlsx` Sheet3）；② 深色反转 = 黑底白强调（mock 已验证；若实看不满意 10 分钟可补中性灰版本）；③ 官网/工作台不同批另立单，**上架物料红线=只截 App 内页面禁出现官网预览**；④ 纯黑白无绿点缀；⑤ 可点态 = 黑=可点 + 透明度/字重分层，L2 实看区分度不足则启用极低饱和灰蓝 #5A6B7A 专供链接（唯一彩色口子，随卡写死）。

## 换肤标准（v1.1 增补交付件——「风格不能写死」指令落点）

1. **Token 契约（标准核心，跨皮肤不变）**：语义 token 名清单固定——品牌面 `--primary/--primary-strong/--on-primary/--primary-text/--primary-tint`；表面 `--s0..--s4`；文本 `--text/--text2/--text3`；线 `--line`；语义 `--ok/--ok-tint/--warn/--warn-tint/--danger/--danger-tint`；遮罩 `--scrim`；Vant 映射段（值全引自有 token）。**消费侧只准用契约名，禁消费具体色值**；契约清单以 tokens.css 现有变量全集为准重构时逐一点名固化。
2. **皮肤 = 纯值段**：tokens.css 组织 = `:root`（默认皮肤浅色=候选C）+ `[data-theme="dark"]`（默认皮肤深色）；未来新皮肤**只准追加段**（`[data-skin="xx"]` / `[data-skin="xx"][data-theme="dark"]`，或升级为独立双轴属性——迁移决策留给换肤实施单），禁改契约、禁改组件。
3. **原生同构**：colors.xml mov_* 语义命名单源；换肤 = 整文件值替换 / values-xx 资源覆盖；运行时动态换肤后置。
4. **组件层零字面色值**（红线 3 强化）：Web/聊天页全 var() 消费（RoomApp 用 `var(--bubble-*, fallback)` 形态，fallback 仅默认皮肤值）；原生全 R.color 引用。
5. **新增品牌色/新语义场景 → 先扩契约再进皮肤**：禁组件私造色值。

## 三刀施工范围

**第一刀 token 契约化 + 默认皮肤**：tokens.css 重组为「**token 契约段**（语义 token 名清单=标准，跨皮肤不变）+ **皮肤值段**（默认皮肤=候选C，现有 `:root` + `[data-theme="dark"]` 结构保留）」；未来新皮肤 = **只准追加段**，禁改契约禁改组件；语义色 ok/warn/danger 值不动；Vant 映射段零改动（值全引 var 自动跟随）；7 页自动跟随；
**第二刀 聊天页 token 化**：RoomApp.vue :147/:156 字面色值 → `var(--bubble-bg, #E4E7ED)` / `var(--bubble-text, #23272F)`（语义变量 + 默认皮肤 fallback——换肤时宿主注入即跟随，聊天页从此无字面主色值）；vite build --base=./ + 拷贝 assets/markstream/（markstream 架构冻结，只动 style 段）；
**第三刀 原生单源 + 收编残留**：新建 colors.xml——**mov_* 语义命名**（mov_primary/mov_primary_strong/mov_on_primary/mov_text/mov_bg/mov_line…，值=候选C）+ themes.xml（状态栏/导航栏引主题属性）；MainActivity:720/:825、PhotoAskSheet:40、WebPageSheet:85/:125 改 R.color 引用；登录/隐私门/MainActivity 显式挂主题；WorkbenchPage:257 紫头像 → 中性灰阶首字母头像；**换肤口径 = 替换 colors.xml 值即全局生效（values-xx 资源覆盖），运行时动态换肤后置——本卡只保证「值不散落、单源可换」**。
**范围外**：official-web/workbench-web（另立单）；代码语法高亮 5 色组不动（功能色）。

## 验收

- **L1**：全仓 grep 品牌绿（`0E7C5B|0A6649|34C79A`）=0（**基线 10 处：tokens 5 + 原生 5，已实测登记**；git 历史除外）；全量绿；写死品牌色 grep=0（UPG-23 硬规继承）；变异：tokens.css 主色改回绿 → 校验脚本必红。
- **L2**：五屏截图（聊天/市场本地/市场/设置/记忆）× 深浅双色落 ACCEPTANCE_LOG；**必含 Vant 开关 ON/tab 选中/按钮 disabled 态**（纯黑白可点态区分度实证，settings 默认态无 primary 元素已实证）；观感与 logo 黑白气质一致——设计师与用户双重拍板。
- **L3**：sync-pages `--check` 幂等；room 页 dist 与资产逐字节一致；原生装机走查状态栏/弹窗/审批 dialog 无蓝绿残留（语法高亮除外）。
- **换肤标准断言（v1.1 新增）**：①契约完整性——校验脚本断言 tokens.css 每皮肤段含全套契约 token（缺一 fail-loud）；②第二皮肤存在性——验收时临时追加灰阶 `mono` 测试皮肤段，页面消费点**零改动**即生效（实证「换肤=只加值段」），验完删除；③原生 colors.xml 值替换口径评审。
- **Token/KV 申报**：纯视觉单，无 token 面/KV 变化。

## 红线

1. 纯视觉单：不动功能逻辑与文本；不动 room.html markstream 架构（RoomApp.vue 只许动 style 段）。
2. 语义色（ok/warn/danger/审批🟢🟡🔴）与代码语法高亮 5 色组不动（K1 定性）。
3. **token 单源强化（v1.1）**：全端色值只准存在于 tokens.css（Web/聊天页）与 colors.xml（原生）两处单源；**组件层禁一切字面品牌/主色值**（唯一例外 = Vant confirmButtonColor 功能红与代码语法高亮功能色组）；UPG-23 本地 tab 风格硬规全量继承。
4. 官网/工作台不在本期（另立单，编号以表为准）。
5. **与 UPG-41 串行**（同文件 MarketPage/WorkbenchPage 上下游，禁并行撞车）。

## 派单交接段

1. 开工前 `git fetch origin` + 看表；worktree=mov-upg40 branch=feat/upg40；卡内行号锚 = 2026-08-29 实测；工单表备注 `认领: <agent> worktree=mov-upg40 @<时间>`；
2. **mock 对照图 = `设计师\\mock\\风格统一_2026-08-29\\候选C_冷调近黑\\`（5 屏实测产物即验收对照基准）**；
3. 完成后登记两个表（先表后库）；报告落 `程序员\\交付报告\\DELIVERY_UPG40_*.md`。

---

# UPG-41 本地页「列表/详情」重设计 + 市场包独立模板（2026-08-30 拍板替代原「二级页化」方案）
**分类**：M8 UI/交互


```status
phase: obsolete
branch: feat/upg41
head: 3e950ab9
std: —
delivery_id: —
designer: ✅ 方案 v2 定稿 @2026-08-30（v2=**替代 v1「二级页化」**；原 feat/upg41 bb31e33 作废未合 ma
dev: 【✅✅ **C 修复交付 @2026-08-30**（feat/upg41 **675970b** 修复+**0ef352d** 产物同步，
inspector: **✅ 验收员复验通过 @2026-08-30**：P1-① 设备控制详情真机「常驻|无 Switch」无 MARKET_NOT_INSTA
merge: ✅**已合 main @2026-08-30**（设计师 merge f33fb33[含 3e950ab]，P1/P2 修复复验通过；pus
actor: sys04-backfill
updated_at: 2026-09-05T08:42:05
```

**状态**：✅ 方案 v2 定稿 @2026-08-30（v2=**替代 v1「二级页化」**；原 feat/upg41 bb31e33 作废未合 main；方向=**一级简约分类列表 / 二级用途/用法前置详情 / 市场包商店式独立模板以「装后主页示意」为核心**）——方案 `设计师\方案设计\本地页列表详情重设计_方案_v1_2026-08-30.md`（v2 定稿）｜参考 demo `设计师\设计预览\demo\本地详情_demo_v6.html` ｜ 🔨 **已派单 → ✅C 完成（v2）@2026-08-30 → ❌ 验收打回 → ✅C 打回修复 @2026-08-30 → ✅ 验收通过 @2026-08-30** ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-30 ｜【✅✅ **C 修复交付 @2026-08-30**（feat/upg41 **675970b** 修复+**0ef352d** 产物同步，已 push origin；基底 35a37b6——main 产物 hash 分叉待合时统一）：**P1** 宿主工具组[设备控制/12306/Obsidian]头卡改「常驻」灰显不可关（删 van-switch+删 toggle 接线，不再走 market.disable/enable——MARKET_NOT_INSTALLED 根除）；可启停开关**转移 MarketPackDetail 头卡**（市场包 registry 有条目：browser-automation 走 builtin 支路生效）；**P2** zh.js 补 localDetail 17 key+marketPack 20 key 全量中文（与 en.js 键集逐键一致，独立构建可复现）；verify 增 ⑦⑧ 九项锚（内置无 switch/常驻渲染/不 emit toggle/市场包保留开关/节流+zh key 集一致）；L1 verify **29 项全绿**+变异 2/2 亲杀[switch 回流双红/zh key 删红]+bun build+sync-pages 72 文件幂等+产物 grep「这能干嘛/常驻」+assembleDebug 绿；报告 DELIVERY_UPG41v2_修复_2026-08-30.md；已登记两个表）——**✅ 验收员复验通过 @2026-08-30**：P1-① 设备控制详情真机「常驻|无 Switch」无 MARKET_NOT_INSTALLED ✅；P1-② MockServer 市场包模板+ToggleButton 在场+真机 toggle 无 MARKET_NOT_INSTALLED ✅；P2 中文详情无裸 key+独立构建复现 ✅；verify 28/28+变异 2/2+build 幂等；**销挂账×2**[upg41v2-内置包启停不可操作/upg41v2-zhjs缺localDetail字典]（ACCEPTANCE_LOG e786524）——**→ 待设计师合 main**（基底 35a37b6 非 origin/main，**合批必重跑 vite build+sync-pages**）；**验收补注 @2026-08-30**（ACCEPTANCE_LOG 62739b5）：①browser-automation（kind=builtin）**结构性 UI 启停不可达**——本地市场组缺席+store「已安装」为 enabled=false 禁用 Button，复验口径②无 UI 路径可验，**新挂账 upg41v2-browser自动化builtin启停UI不可达**（P3 待设计师定夺：补 builtin 包启停入口 or 修订口径②）；②环境冲突——自动化进程反复重装旧构建覆盖修复构建（16:06/16:18），合 main 前勿依赖运行态判断 ｜ ✅**已合 main @2026-08-30**（设计师 merge f33fb33[含 3e950ab]，P1/P2 修复复验通过；push origin；worktree mov-upg41 可收）

## 标题

本地页（MCP 市场「本地」tab）：一级=**简约分类列表**（分组管理，每行仅 名称+副题+箭头，无图标/计数/健康点/行内控件）；二级=**详情页**（「这能干嘛」用途 + 「怎么用」用法例子**前置**，工具清单/权限/启停/授权/卸载下沉）；**市场包拆独立商店式模板**（头卡 + 装后普通/极简主页示意为核心 + 怎么用 + 信任区低调折叠 + 安装/更新/卸载）。

## 背景

用户本意「一级列表简约、二级详情复杂操作、一目了然怎么用/有什么用」；现状 main=UPG-23 总览面板（概览卡+钉选槽+三层分组+工具下钻+行内控件堆叠）密度过高；UPG-41 v1「二级页化」收缩为摘要卡+弹层，方向对但一级非列表、市场包未单独考虑；本轮 demo 六轮迭代定稿（分类管理/去图标/去计数/不顶格/浅色/主页示意）。

## 方案

见方案 md v2 §三（设计定稿 3 态规格）+ §二（分层溯源：数据面 L2-L6 **零改动**，纯视图层重建）。

关键施工点：
1. **一级列表**：分组标题（左靠 margin-left 12px）+ 工具行（右缩 padding-left 20px，副题灰字 + 右侧箭头 `›`）；**无图标/无 badge/无「N 项」计数/无健康点/无按钮**；健康提示一级不显示、移二级。
2. **内置工具详情**：头卡（名称+tagline+健康+**右上角启停开关**）→「这能干嘛」→「怎么用（例子：你一句→它回什么 +「用它」回填输入框）」→ 工具一览（名/作用/权限 自由·询问·拦截）→ 权限分布 → SAF 授权 /（市场包）卸载；**「用途/用法」顺序必须在「工具清单/权限」之前**。
3. **市场包独立模板**：头卡（包名+v版本·作者+已安装）→ **装后普通/极简主页示意（segment 切换，核心）** → 怎么用 → **信任区（作者/来源/权限请求，详情底部致密折叠、默认收起、低调不扎眼）** → 安装/更新/卸载（无启停开关）。
4. **复用**：LocalOverview 数据面、market.localOverview / ui.getPins / market.enable|disable / permissionTier 单源 / UPG-40 视觉 token——**零新增数据写路径**。

## 验收

- **L1**：① 删「内置能力」分组标题→必红；② 删「怎么用」区「用它」回填按钮→必红；③ 一级行无图标/无计数/无健康点断言（简约约束）；④ 二级「用途/用法」在「工具清单/权限」之前 DOM 顺序断言；⑤ 市场包信任区默认收起断言。
- **L2 真机**：进本地 tab→一级仅分组+名称+副题+箭头（截图，无控件堆叠）；点进内置工具→二级能看到「这能干嘛/怎么用」；点市场包→普通/极简主页示意可切换；启停/SAF 授权/卸载可操作；深浅双色走查。
- **L3**：与 UPG-40 风格 token 无回归。
- **Token/KV 申报**：纯视图层重组，0/0。

## 红线

1. 纯视图重建：**不动数据面/安装/启停/权限逻辑**（LocalOverview / market.* 读面零改动）；
2. 一级「简约」约束：列表不出现图标/计数/健康点/按钮/卡片化行；
3. 主仓库前端工程 `前端设计/mov-vue/src/components/MarketPage.vue`（及可能新建 LocalOverviewPage.vue / MarketPackDetail.vue）；
4. **与 UPG-40/UPG-25 邻接**（同文件/同风格），串行或独立 worktree，防文件锁；
5. 「用途/用法」文案须写真实（勿用 demo 占位）。

## 派单交接段

1. 开工前 `git fetch origin` + 看表；worktree=mov-upg41 branch=feat/upg41（**建议基于最新 main 重开**，旧 feat/upg41 bb31e33 已作废）；工单表备注 `认领: <agent> worktree=mov-upg41 @<时间>`；
2. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_UPG41_*.md`。

---

# UPG-42 mow.kim 站点容器面 WebMCP 化（一期+二期：mov-page-server + 全站 10 工具 + 双轨 AI 就绪）
**分类**：M4 工具/MCP 集成


```status
phase: merged
branch: feat/upg42
head: dc58ddf5
std: —
delivery_id: —
designer: ✅ 方案 v1.1 定稿（设计稿四补强已落：mov_ 前缀/input schema/错误码对齐/三期视觉反馈），📌 待派单
dev: ✅**C 批1 完成 @2026-08-30 01:22**（feat/upg42 **3fde899** 已 push origin，基底
inspector: ✅**批1 验收通过 @2026-08-30** + ✅**审验通过 @2026-08-30**（AGPL 零 import/零第三方拷贝，
merge: ✅**批1 已合 main @dc58ddf**（ff-only 已推 origin；worktree mov-upg42 可收）
actor: sys04-backfill
updated_at: 2026-09-05T08:42:05
```

**状态**：✅ 方案 v1.1 定稿（设计稿四补强已落：mov_ 前缀/input schema/错误码对齐/三期视觉反馈），📌 待派单 ｜ ✅**C 批1 完成 @2026-08-30 01:22**（feat/upg42 **3fde899** 已 push origin，基底 main 31769a0；mov-page-server.js 自研 UMD≈250 行[AGPL 自研声明+零 import code review 自证]：RpcCore 纯逻辑[JSON-RPC 2.0 over postMessage：initialize/tools/list 四字段齐备/tools/call+register/unregister+notifications/tools/list_changed]+薄壳[allowedOrigins 白名单制禁*[红线2]+白名单外静默零响应面+请求/响应统一 JSON 字符串形态[测试抓出实现不一致已修]]；错误码对齐 MCP[-32601 method not found/-32602 invalid params 含未注册工具名/-32603 internal error 双路]；返回「数据非指令」三重包裹[__mov+note+isData，红线3]；JSON Schema 子集校验[required+type，非法-32602 指出字段]；dev 站 3 工具全只读[红线1]：spec.html 挂 mov_get_tool_contract[spec.md 镜像全文]+mov_search_spec[有参 query inputSchema required]，quick-start.html 挂 mov_get_quickstart_template[hello-server.mjs 全文]；spec.md 镜像九节[同步性=改镜像→输出同步变，fetch no-store+测试实证]+llms.txt 摄取索引；验证=node:test 7/7 绿[四字段/回显+数据非指令/三错误码/同步性/白名单核心+薄壳静默/注册注销 list_changed]+线上 scp 部署后 curl 实证 /dev/llms.txt+/dev/spec.md HTTP 200+两页 script/工具在案；Token/KV=纯站点侧 App 零变化；报告 DELIVERY_UPG42_批1_2026-08-30.md；已登记两个表）——待验收员 L1 复跑+headless 注入客户端走查+L2 真机/浏览器[dev 页 tools/list 可发现/调用返回真数据/llms.txt 可达]；批 2[/tools/ 三工具+/home/+mov_site_info+徽标]待发单 ｜ ✅**批1 验收通过 @2026-08-30** + ✅**审验通过 @2026-08-30**（AGPL 零 import/零第三方拷贝，grep 佐证在档）→ ✅**批1 已合 main @dc58ddf**（ff-only 已推 origin；worktree mov-upg42 可收）｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-30

## 标题

按 WebMCP 标准（W3C 标准轨道）把 mow.kim 三区升级为「人和 AI 共用的站」：自研 `mov-page-server.js`（JSON-RPC 2.0 over postMessage）+ 全站 10 个 `mov_*` 确定性工具 + llms.txt/.md 双轨——**容器面：网站主动给 AI 开接口**。

## 背景

作者浏览器双本质愿景（展示板给人/容器给 AI）+ WebMCP 入 W3C 标准轨道（`灵感库/评估报告/评估_WebMCP_2026-08-29.md`）+ 设计稿 v1.1（`设计师\\方案设计\\WebMCP接入_MOV网站容器面设计_2026-08-29.md`，四评审补强已落）。**AGPL 红线：零搬代码，自研实现，协议对齐 W3C webmcp 标准轨道。**

## 设计要点（照设计稿 v1.1 施工）

1. **mov-page-server.js**（≈200 行，script tag 引入）：JSON-RPC 2.0 over postMessage；工具注册/注销 + ToolListChanged；`allowedOrigins` 白名单禁 `*` 上生产；
2. **全站 10 个 `mov_*` 工具**：有参仅 `mov_search_spec(query: string)` / `mov_get_package(id: string)`（JSON Schema 子集），其余无参空 properties；`tools/list` 四字段齐备；
3. **双轨 AI 就绪**：WebMCP 工具级 + llms.txt/.md 镜像摄取级；
4. 返回内容统一「数据非指令」包裹（防注入，OCR 先例同款）；工具全只读。

## 分批交付

- **批 1（一期）**：page-server 核心 + dev 站 3 工具（`mov_get_tool_contract` / `mov_get_quickstart_template` / `mov_search_spec`）+ llms.txt + spec.md 镜像——「开发者文档一键给 AI」闭环；
- **批 2（二期）**：/tools/ 3 工具（`mov_list_packages` / `mov_get_package` / `mov_market_stats`，registry.json 同源 fetch）+ /home/ `mov_get_overview` + 全站 `mov_site_info` + `mov_get_registry_schema` / `mov_get_publish_flow` + 页内「AI 就绪」徽标。

## 验收

- **L1**：JSON-RPC 合规断言（headless 注入客户端：tools/list 四字段齐备、tools/call 回显；错误码对齐 MCP 标准：非法方法→`method not found`、非法参数→`invalid params`、内部错误→`internal error`）；返回含「数据非指令」标注；**契约完整性断言（工具返回与页面正文/.md 镜像一致，同步性：改镜像源→工具输出同步变）**。
- **L2 真机/浏览器**：dev 页 tools/list 可发现、调用返回真数据；llms.txt 可达；徽标可见。
- **L3**：三期后 ConnectWeb 走查（属 UPG-43，本卡不含）。
- **AGPL 红线验收**：`mov-page-server.js` 全文无 @mcp-b 代码拷贝（自研声明 + code review）。
- **Token/KV 申报**：纯站点侧，无 App token 面/KV 变化。

## 红线

1. 工具全只读；不暴露任何写动作（写走 App 内既有权限闸）；
2. `allowedOrigins` 白名单制，禁 `*` 上生产；
3. 返回「数据非指令」包裹（防注入）；
4. AGPL 零搬代码，对齐 W3C webmcp 标准轨道，来源标注；
5. 展示面零改动（UPG-40 token 已覆盖；纯容器面增量）。

## 派单交接段

1. 开工前 `git fetch origin` + 看表；worktree=mov-upg42 branch=feat/upg42；设计稿=`设计师\\方案设计\\WebMCP接入_MOV网站容器面设计_2026-08-29.md`（v1.1）；工单表备注 `认领: <agent> worktree=mov-upg42 @<时间>`；
2. 部署走 dev 站/官网既有 scp 链（/var/www/official-web/），上线后 web_fetch 验证；
3. 完成后登记两个表（先表后库）；报告落 `程序员\\交付报告\\DELIVERY_UPG42_*.md`。

---

# UPG-43 ConnectWeb 作 WebMCP 客户端/Hub（浏览器双本质三期）
**分类**：M4 工具/MCP 集成


```status
phase: merged
branch: —
head: —
std: —
delivery_id: —
designer: 📌 **重排 @2026-09-02（用户拍板：App 内浏览器先 MCP 改造）**｜本卡=**43a App 侧 WebMCP Hub
dev: ✅ **C 完成 @2026-09-02（R2 修复）**（feat/upg43a `e34c246` 已 push origin：M-1a
inspector: ✅ **R2 复验 通过 @2026-09-02**（ACCEPTANCE_LOG §P24-R2：e34c246 M-1a 两点落地[ca
merge: ✅ **已合 main @15e53e6**（R2 通过后 rebase 新 main 零冲突 + ff；H2/H3 端到端随 UPG-69
actor: sys04-backfill
updated_at: 2026-09-05T08:42:05
```

**状态**：✅ 方案 v1（规划卡：前置=UPG-42 合 main + UPG-27 交付），⏳ 待前置 ｜ **优先级**：P2 ｜ **出单人**：设计师 ｜ **日期**：2026-08-30→ 📌 **已派单 @2026-09-02**（用户拍板+派单文 [UPG-43a_App内浏览器WebMCP_Hub框架_派单_2026-09-02.md]——43a App 侧先行；feat/upg43a 待认领施工——E4「排队」为卡缺已派锚误显，已修）→ ✅ **C 完成 @2026-09-02**（feat/upg43a 8b7b6d0 已 push origin；H1-H7 交付+变异亲杀 4/4+全量 JVM 619 绿；报告 `DELIVERY_UPG43a_2026-09-02.md`；待验收——诚实标注 H2/H3 真 WebView 链路待 UPG-69/stub 站点） → ❌ **验收员 43a 打回 @2026-09-02**（ACCEPTANCE_LOG §P24：8b7b6d0 框架+H1 契约/H5 精确匹配/H7 转义/审批 fail-closed/taskId 防重放 通过+WebMcpHubTest 16/0 亲跑；**security_review M-1 bridge 注入幂等守卫方向反[页面预置假 __movWebMcp 逃 H4 审批闸]**+**M-2 dispatch 域校验 TOCTOU**+M-3 discover 元数据 prompt injection 载体——M-1/M-2 框架正确性必修；H2/H3 端到端随 UPG-69 申报诚实）**卡点**：施工中——App 侧 WebMCP Hub 框架（契约 v0.1 待 43a 起草冻结） ｜  → ❌ **R1 复验 二次打回（范围收窄）@2026-09-02**（ACCEPTANCE_LOG §P24-R1：c924197 M-2 双域校验+M-3 消毒+M-1b isWriteTool+LOW cancel 全 PASS+WebMcpHubTest 22/0 亲跑+变异 4/4 真锁复核；**仅 M-1a 收尾**——不可配置假桥[页面 defineProperty 预置]致 strict delete 抛错→catch 赋值再抛→IIFE 中断真桥永不注入+App 侧 discover 不验桥 fail-open；修=catch 不赋值+真桥验证标志+App 侧 fail-closed 两小修；R2 仅核此两点） → ✅ **R2 复验 通过 @2026-09-02**（ACCEPTANCE_LOG §P24-R2：e34c246 M-1a 两点落地[catch 不赋值+AUTH 标志+discover 返空/call 拒转发]——不可配置假桥逃逸封死；WebMcpHubTest 24/0+全量 627/0/1 亲跑；LOW×2 残余[nonce 化+WRITE_TOOLS 随 UPG-69]；**达待合→审验员→设计师**） → ✅ **验收员复验 通过 @2026-09-05**（ACCEPTANCE_LOG §P59：f5e7212a 隔离 worktree——全量 **844/0/1 亲跑一致**[0 失败基线]+**W1/W4/W5/W6 FULL**[线上 200 亲测+WRITE_TOOLS 移除亲杀+401 fail-closed+WebMcpHubTest 26/0]+**W2/W3 PARTIAL 转持有**[ConnectWeb 通道受限如实]；**P3：STD-UPG69-v1 未冻结转设计师补冻**[判据已是定稿]+deliver-gen 硬闸如实拦 DEL 绑定[§P45 机制运转]；**达待合→审验员→设计师**[STD 补冻+DEL 绑定随补冻]）
→ ✅ **已合 main @15e53e6**（R2 通过后 rebase 新 main 零冲突 + ff；H2/H3 端到端随 UPG-69 站点侧专项补验——审验员定）
→ 📌 **重排 @2026-09-02（用户拍板：App 内浏览器先 MCP 改造）**——本卡=**43a App 侧 WebMCP Hub 框架先行**（proxy 中继+WebView 注入+经 UPG-27 挂载——browser.* 14 工具做底；文件面=app/src/main/kotlin/com/hermes/mov/browser/+assets/browser/；**前置=UPG-27 合 main**（LayeredRouter——43a 施工时先拉合））；**站点侧=新卡 UPG-69 并行试点**（mow.kim 工单站三工具——验收闭环：AI 调 web.mow.kim.mov_openTicket→操作→投影卡片可见）；UPG-42 全量站点 WebMCP 化=后行 ｜ ✅ **43a 已认领 @2026-09-02**：程序员（acceptance 型）认领 **43a App 侧 WebMCP Hub 框架**——`worktree=mov-upg43a branch=feat/upg43a`（基底 main 3bd8847 含 upg27 merge 7992904，前置满足）；判据 H1-H7 按 `设计师\派单\UPG-43a_App内浏览器WebMCP_Hub框架_派单_2026-09-02.md` 执行 → ✅ **C 完成 @2026-09-02**（详状态锚）：H1 契约落盘（UPG-69 共引）/H2 web.* 工具面经 upg27 热挂载/H3 调用链 dispatch→call→页面 handler/H4 写类 Gatekeeper（dispatch 唯一闸，必填先于审批）/H5 域隔离 fail-closed（非注册域零注入+调用期兜底）/H7 只读只映射（参数原样零副作用）；变异亲杀 4/4（H4×2 红/H5×1 红/H7×1 红）；WebMcpHubTest 16 用例；全量 JVM 619 绿（browser.* 14 零回归）；**诚实标注：H2/H3 真 WebView 端到端需 UPG-69 站点侧或 stub 站点驱动（单测已覆盖 dispatch/parse/mount 逻辑层）** → ✅ **C 完成 @2026-09-02（R1 修复）**（feat/upg43a `c924197` 已 push origin：M-1 bridge 无条件覆盖[删短路+defineProperty 不可写]+write App 登记并集[REGISTERED_WRITE_TOOLS/isWriteTool]/M-2 liveHostname 双校验+call 转发前 webView.url 兜底/M-3 元数据消毒[description 折叠+长度 200/schema 顶层白名单]/LOW pollTask 超时 cancel 清理；变异亲杀 4/4 逐一变红[M-1a/M-1b/M-2/M-3]；WebMcpHubTest 16→22；全量 625/1/0/0；报告追加「R1 打回修复节」——验收员 §P24 打回项 M-1/M-2/M-3/LOW 全修——待 R1 复验，合 main 待设计师） → ✅ **C 完成 @2026-09-02（R2 修复）**（feat/upg43a `e34c246` 已 push origin：M-1a 假桥覆盖残余 fail-closed——不可配置假桥逃逸封口[catch 内不赋值防中断链+真桥带 __movWebBridge__ 验证标志+App 侧 discover/call 前校验不匹配返回空]；变异亲杀 4/4 逐一变红[catch 赋值/去标志/恒 true/删 discover 校验，每条注入→红→回滚]；WebMcpHubTest 22→24；全量 627/0/0/1；报告追加「R2 打回修复节」——验收员 §P24 M-1a PARTIAL 唯一遗留已修——待 R2 复验，合 main 待设计师）

## 标题

MOV ConnectWeb（WebView 容器）注入 proxy 作 WebMCP 客户端/Hub：聚合各站 Page Server 工具 → 经 UPG-27 MCP 面挂进 AI 工具面——**浏览器双本质闭环**。

## 背景

浏览器双本质愿景三期：站点侧（UPG-42 已出卡）暴露 mov_* 工具后，App 侧需要「聚合+路由」的 Hub 形态（WebMCP 协议 B1 借鉴点）：WebView 注入 proxy 薄中继 → 聚合各站工具 → 经 UPG-27 的 MCP 面/Code Mode 挂进 AI 工具面。

## 方案要点

1. WebView 注入 proxy（addJavascriptInterface/postMessage 桥，薄中继不聚合）；
2. 工具命名 `web.<域名>.<mov_工具名>` 挂进 AI 工具面，经既有权限门（只读工具 harmless 口径）；
3. **站点工具调用并入 App 既有卡片投影**（UPG-40 状态可见性——WebMCP 视觉反馈纪律：AI 动作用户可见）；
4. 路由口径：active tab 优先，URL 匹配次之（WebMCP Hub 语义简化版，跨站聚合后置）。

## 验收

- **L1**：proxy 聚合断言（mock 页面工具发现/调用/注销）；**视觉反馈断言**：工具调用产生用户可见卡片。
- **L2 真机**：ConnectWeb 打开 mow.kim → AI 工具面出现站点工具 → 调用返回 → 卡片可见（浏览器双本质闭环实证）。

## 红线

1. 站点工具继承只读口径；权限门零特权；跨站聚合后置不做；
2. markstream/ConnectWeb 架构冻结项不碰。

## 派单交接段

1. **前置确认：UPG-42 合 main + UPG-27 已交付**再认领；worktree=mov-upg43 branch=feat/upg43；
2. 完成后登记两个表；报告 `程序员\\交付报告\\DELIVERY_UPG43_*.md`。

---

# W-09 资产档案表（T6 落地：商标/证书/域名/密钥登记收编）


```status
phase: registered
branch: —
head: —
std: —
delivery_id: —
designer: 方案完成待派单（P2）
dev: —
inspector: —
merge: —
actor: 设计师
updated_at: 2026-09-05T10:00:23
```

**状态**：✅ 方案完成待派单 ｜ **优先级**：P2 ｜ **出单人**：设计师 ｜ **日期**：2026-08-27

## 标题

资产档案表新建与接网：`处理中心\资产档案表.md`（T6）+ sync 解析 + 工作台画册视图 + 到期日红点

## 背景

公司资产目前散在四处、无统一档案：商标（`品牌管理\商标注册\`，申请在途）、ICP 备案（赣ICP备2026013905号-1）、域名 mow.kim / mov-ai.cn（续费期无人盯）、签名密钥 `品牌管理\签名\mov-release.jks`、服务器（dims 基建 I-00 一行带过）。重塑 v2（M3）将其定义为 MOV Base 第 6 张表；到期日字段是 Y-02（证书/域名到期提醒）的数据源——档案表不立，Y-02 永远是空话。

## 方案（已定口径，照此施工）

1. **新建 `处理中心\资产档案表.md`**，schema 按重塑 v2 §二强类型纪律：

   | 列 | 类型 | 说明 |
   |---|---|---|
   | 资产号 | 自动编号 | A-NN，唯一不复用 |
   | 名称 | 文本 | 如「MOV 商标（竖眼）」 |
   | 类型 | 单选 | **封闭取值域**：商标/备案/域名/密钥/资质/服务器；非法值 sync fail-loud（沿用 W-05 DEPLOY-GATE 口径） |
   | 编号/证件号 | 文本 | 注册号、备案号等；申请中写「申请中」 |
   | 到期日 | 日期 | ISO 或「—」；**临期 90 天橙点、30 天红点**（证件周期比工单长，不用 v2 的 3 天口径） |
   | 位置/责任人 | 文本 | 文件路径或管理平台 + 责任角色 |
   | 关联 | Link | 关联事件/工单（W-08 口径，先留列） |
   | 备注 | 文本 | 自由文本，敏感词红线见下 |

2. **播种数据（上线即真实）**：A-01 MOV 商标（竖眼，申请中，图样位置 `品牌管理\商标注册\`）；A-02 ICP 备案 赣ICP备2026013905号-1；A-03 域名 mow.kim（到期日查实后填）；A-04 域名 mov-ai.cn（备案进行中，关联 E-03）；A-05 签名密钥 mov-release.jks（只登记存在性+位置，见红线）；A-06 服务器（关联 I-00）。
3. **sync 增量**：解析档案表 → workbench.json 新增 `assets` 顶层节；到期日推导橙/红点口径实算（禁止前端现算与 sync 两处口径分叉——以 sync 输出为准）。
4. **前端**：品牌维与基建维档案型板块（brand-tm.cards / infra-servers.cards）改由 `assets` 节驱动，画册视图（卡片式，商标图样等图片位预留）；到期资产在总览红点清单（W-10 组件三）可见——本单先保证冒泡到一级维度红点。

## 验收标准

- **L1**：verify 断言——assets 节非空、类型列取值域白名单（非法值 fail-loud 复用 DEPLOY-GATE 路径，变异：塞非法类型 → exit≠0）、到期日格式合法、资产号唯一。变异亲杀：删 assets 渲染 → 必红。
- **L2**（真实浏览器双端截图入 ACCEPTANCE_LOG）：画册板块卡片渲染、临期资产橙/红标识可见（可造一条 30 天内到期假数据演示后还原，规则 18）。
- **L3**：档案表改一条 → `sync --deploy` → 线上变化截图对账 + 还原。

## 红线

- **密钥/口令/私钥内容绝不入表**：只登记「存在 + 位置 + 责任人」；`.secrets\` 下任何文件内容禁止抄录；sync 脱敏词表新增本表字段扫描（源头禁写 + sync 打码双保险）；
- 工作台只读铁律不变；画册视图只读展示，不做上传/编辑；
- 不引入外部资产管理工具；商标图样等图片如需展示，放 `workbench-web/assets/` 随站部署，不入 json 内嵌 base64；
- Token/KV 申报「无影响」。

## 派单交接段（程序员领单时按此执行）

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：dims 基建表 W-09 行备注追加 `认领: <agent> worktree=mov-w09 branch=feat/w09-assets @<时间>`。
2. 施工顺序：批 1 档案表 md 新建+播种 → 批 2 sync 解析+白名单 → 批 3 前端画册板块；每批独立可验。
3. **完成后必须登记两个表**（先表后库）：dims 基建表 W-09 行程序员列/状态更新 + 备注 `feat/w09-assets <hash>（报告 DELIVERY_W09_*.md）`；工单库本单状态改「程序员✅完成，待验收」。
4. 交付报告落 `程序员\交付报告\DELIVERY_W09_*.md`，写明「已登记两个表」+「演示数据已还原且生产态已复核」（规则 18）。
5. 产物提交 `0027-mov` 分支 `feat/w09-assets`（含 `workbench-web/dims/` 副本同步），交付时报 hash。

---

# W-10 事件日历视图 + 总览仪表盘四组件


```status
phase: registered
branch: —
head: —
std: —
delivery_id: —
designer: 方案完成待派单（P2）
dev: —
inspector: —
merge: —
actor: 设计师
updated_at: 2026-09-05T10:00:33
```

**状态**：✅ 方案完成待派单（依赖 W-06 之后施工，见下）｜ **优先级**：P2 ｜ **出单人**：设计师 ｜ **日期**：2026-08-27

## 标题

工作台总览升级：事件日历视图（T3 日历镜头）+ 仪表盘四组件（focus/状态漏斗/红点清单/本周动态）

## 背景

重塑 v2 §三/§四定调：工作台树 = 视图目录，总览 = 仪表盘。当前总览只有 focus 混排 Top5 一个组件，事件线（备案/办证/到期）没有日历形态——「月底看排期一目了然」是事务线的杀手锏视图（备案审核周期、证件到期、E-06 ASR 接入跟进）。本单是重塑 v2 的 M4 落地。

## 方案（已定口径，照此施工）

**组件一：事件日历视图（新增树节点「事件日历」，挂事件板块下）**
- 事件按 `截止` 字段落格（月历，当月视图，前后月翻页按钮）；
- 无截止日事件归日历上方「未定档」横条区（E-03/E-06 现状即此类）；
- 格内显示事件号 + 状态色点（沿用事件看板色）；「待外部」不红点（既有口径）；
- 纯前端渲染：复用 workbench.json 现有 events 节，**不动 sync**。

**组件二：状态漏斗**——工单八态计数横条（未启动/设计师处理中/程序员处理中/验收中/打回修复中/待合main/审验中/已完成），哪环淤积一眼可见；数据源 = json 已有工单节，前端聚合。

**组件三：红点清单**——全库红点记录平铺列表（比冒泡更直接的行动列表）：挂账待审 + 事件临期 + 资产临期（W-09 后自动纳入）；每条可点击跳树定位（跳转机制复用 W-08 徽章跳转，若 W-08 未上则先纯列表无跳转）。

**组件四：本周动态**——近 7 日验收/合并/销项事件计数（数据源 = app-accept.events 即 ACCEPTANCE_LOG 解析节，前端按日期过滤聚合）。

## 依赖与排期

- **W-06 之后施工**（详情抽屉是 W-10 跳转落点；且 W-06 在制中，避免前端同区域撞车）；
- 组件三跳转依赖 W-08（未上则降级为纯列表，不阻塞本单）；
- 与 W-09 无硬依赖，但资产临期入红点清单在 W-09 后自动生效（数据源来了即显示）。

## 验收标准

- **L1**：verify 断言——事件日历节点在树、四组件渲染函数存在且被调用（真实执行断言，禁止字符串包含检查）；变异：删日历渲染/删漏斗组件 → 必红。
- **L2**（真实浏览器双端截图入 ACCEPTANCE_LOG）：日历当月落格正确（以 E-01/E-02 真实截止日对账）、未定档区可见、漏斗计数与工单表实数一致、红点清单点击跳转（或降级声明）、375px 移动端日历可横滑不溢出。
- **L3**：改事件表截止日 → `sync --deploy` → 日历落格变化截图对账 + 还原（规则 18）。

## 红线

- 只读铁律：日历不做拖拽改期、组件不做任何写操作；
- 不做清单不破：不加图表库大报表（漏斗/计数用原生 div 实现，不引 echarts 之类重型依赖）；
- 视觉严格按现有 token（Stitch 企业工具气质），不另起风格；日历自绘，不引日历组件库；
- 四组件任一数据缺失时优雅降级（空态文案），不白屏不报错；
- Token/KV 申报「无影响」。

## 派单交接段（程序员领单时按此执行）

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：dims 基建表 W-10 行备注追加 `认领: <agent> worktree=mov-w10 branch=feat/w10-dashboard @<时间>`。
2. 施工顺序：批 1 事件日历视图 → 批 2 状态漏斗+本周动态 → 批 3 红点清单（含跳转/降级）；每批独立可验。
3. **完成后必须登记两个表**（先表后库）：dims 基建表 W-10 行 + 工单库本单状态改「程序员✅完成，待验收」。
4. 交付报告落 `程序员\交付报告\DELIVERY_W10_*.md`，写明「已登记两个表」+「演示数据已还原且生产态已复核」（规则 18）。
5. 产物提交 `0027-mov` 分支 `feat/w10-dashboard`，交付时报 hash。

---

# UPG-14 设置页收口（账号卡接真 + 退出登录去重 + 两行死链修复）
**分类**：M8 UI/交互


```status
phase: merged
branch: feat/upg14
head: 04341d28
std: —
delivery_id: —
designer: —
dev: —
inspector: ✅验收员通过 @2026-08-28（R2 e16fae8 三判据全过 + R2 复修 04341d2 全产物口径零命中）
merge: **设计师✅已合 main @2026-08-28**（全链 9323975→ce5ab0d→e16fae8→1825338→04341d2
actor: sys04-backfill
updated_at: 2026-09-05T08:42:05
```

**状态**：✅验收员通过 @2026-08-28（R2 e16fae8 三判据全过 + R2 复修 04341d2 全产物口径零命中）→ **设计师✅已合 main @2026-08-28**（全链 9323975→ce5ab0d→e16fae8→1825338→04341d2，merge 8aaa999 已推 origin）｜ **优先级**：P1（假账号数据不能随 release 包出去，随包交付）｜ **出单人**：设计师 ｜ **日期**：2026-08-27

## 标题

设置页四处收口：账号资料卡接真实登录态（去 demo 假数据）、退出登录双入口去重、「MCP 工具市场」「我的能力」死链接桥

## 背景（设计师源码实测 @2026-08-27，用户截图四问题逐条锚定）

用户实测设置页截图提四问题，逐条查实：

1. **账号卡是硬编码 demo**：「陈星河 / Pro Member / 138\*\*\*\*6688」写死在 `前端设计/mov-vue/src/data/demo.js:210-212`，渲染于 `SettingsPage.vue:6-11`，点击只弹 toast「账号资料（演示）」（`zh.js:91`）。打包产物 `assets/pages/settings/assets/demo-*.js` 原样携带。且**全库无会员体系**——「Pro Member」「商家模式」是纯造假，上架必被打回。
2. **退出登录两个口，一真一死**：页内描边红按钮（`SettingsPage.vue:26`）只弹 toast「已退出登录（演示）」，不清 token 不跳转；原生底部文字链（`SettingsSheet.kt:139-159`，UPG-09 772e2a5 加的）才是真登出（确认弹窗 → `LoginState.clear` → 跳 LoginActivity）。
3. **「MCP 工具市场」死链**：行定义 `SettingsPage.vue:161` 只有 `toast` 无 `action`，点击弹「请从侧边栏进入」。目标页存在（`assets/pages/market/market.html`），桥工具 `ui.openMarket` 已注册（`MainActivity.kt:1812`）且在设置页白名单内（`SettingsSheet.kt:31`）——纯前端没接。
4. **「我的能力」死链**：`SettingsPage.vue:162` 弹「敬请期待」。无独立能力页，但侧边栏同义项已映射 `ui.openWorkbench`（`SidebarNav.vue:218`），工作台页存在。

**桥能力现状**：设置页可用 `window.MovPageBridge.invoke()`（包装层 `src/data/mov.js:35-52`），白名单前缀 `approval./credential./ui./model.list`。**无任何 account.* 桥**——登录 token 存原生 SharedPreferences `mov_login`（`LoginState.kt:9-11`，key `token` + `phone_tail`），WebView 侧摸不到，账号卡接真必须新增桥工具。

## 方案（已定口径，照此施工）

### 修 1：账号卡接真实登录态

- **新增桥工具 `account.me`**（原生 `MainActivity` mcpHandlers 注册）：读 `LoginState` 返回 `{loggedIn, phoneTail}`；`SettingsSheet.kt:31` 白名单加 `account.` 前缀。**本单调服务端 `/account/me` 非必需**——本地 `phone_tail` 已够渲染脱敏卡（在线增强留后续单）。
- **卡片渲染**：已登录 → 名称「MOV 用户」+ 脱敏号 `\*\*\*\*${phoneTail}`；未登录 → 「未登录」+ 点击跳登录页。**删除「Pro Member」「商家模式」假徽章**（无此业务，禁造假）。
- demo.js 的 `user` 对象改为运行时由 `account.me` 填充（桥不可用的浏览器预览场景才回落 demo 值，且预览态不得出现在打包产物默认路径）。

### 修 2：退出登录去重

- **删页内死按钮**（`SettingsPage.vue:26` 整行及 `logoutToast` 文案），保留原生底部真登出入口不动。顺手把原生入口样式对齐页面卡片风格（保持底部位置，红色文字链即可，不新增第二个按钮）。

### 修 3/4：两行死链接桥

- 「MCP 工具市场」→ `action` 调 `ui.openMarket`（白名单已放行，零原生改动）；
- 「我的能力」→ 调 `ui.openWorkbench`（与侧边栏 `SidebarNav.vue:218` 口径一致）。

### 构建纪律（历史坑，必须遵守）

- 改 `前端设计/mov-vue` 源码 → `vite build` → dist 对应页**整目录**同步到 `app/src/main/assets/pages/settings/`；
- **清除旧 hash 残留产物**（现 settings/assets/ 下 4 份旧 `SettingsPage-*.js` 并存，本次只留 html 引用的最新一份，旧文件删除）；
- 原生侧改动仅限：`MainActivity.kt` 注册 `account.me` + `SettingsSheet.kt:31` 白名单加前缀 + 原生登出入口样式微调。

## 验收标准

- **L1**（全量绿 + 变异亲杀）：编译绿 + `:app:testDebugUnitTest --rerun-tasks` 全绿；新增单测：`account.me` 已登录/未登录两态返回、白名单放行 account. 前缀；变异：删 account.me 注册 / 白名单移除前缀 → 必红。
- **L2**（真机 emulator-5554，截图入 ACCEPTANCE_LOG）：已登录态设置页账号卡显示真实脱敏尾号（与登录手机号对账，**打码**）、无 Pro Member 徽章；全页只有一个退出登录口且点击真登出回登录页；「MCP 工具市场」点击进市场页、「我的能力」点击进工作台页（各一张截图）；未登录态卡片「未登录」。
- **L3**：vite build 产物同步后，真机重走 设置页四修点全链路；打包产物 grep 无「陈星河」「Pro Member」「138\*\*\*\*6688」「logoutToast」残留（附 grep 输出入报告）。

## 红线

- 不改 `account-service.js` 任何接口；不改 `LoginState` 存储结构（只读）；
- 真登出逻辑（确认弹窗→清 token→跳登录）一行不改，本单只做去重；
- 打包产物禁含 demo 账号数据；截图手机号中间四位打码；
- 不动其他 7 个页面的产物（只同步 settings 页）；
- Token/KV 申报「无影响」（AGENTS.md 硬规则 1 适用性说明）。

## 派单交接段（程序员领单时按此执行）

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：工单表 UPG-14 行备注追加 `认领: <agent> worktree=mov-upg14 branch=feat/upg14 @<时间>`。
2. 施工顺序：批 1 原生桥（account.me + 白名单）→ 批 2 前端四修（账号卡/删死按钮/两行接桥）→ 批 3 构建同步+清残留；每批独立可验。
3. **完成后必须登记两个表**（先表后库）：工单表程序员列 `✅完成` + 备注 `feat/upg14 <hash>（报告 DELIVERY_UPG14_*.md）`；工单库本单状态改「程序员✅完成，待验收」。
4. 交付报告落 `程序员\交付报告\DELIVERY_UPG14_*.md`，写明「已登记两个表」。
5. 产物提交 `0027-mov` 分支 `feat/upg14`（含 mov-vue 源码 + 同步后产物），交付时报 hash。

---

## UPG-14 打回修复段（R1 · 设计师派单 @2026-08-28）

**状态**：🔨 打回修复派单 @2026-08-28——**C 已按验收节修法建议先行修复（ce5ab0d），本修复段追认有效，转复验流程**（复验判据三条照下执行）｜ 验收缺陷明细见 `0027-mov\docs\ACCEPTANCE_LOG.md:1115`（UPG-14 验收节）；挂账 #26/27/28 在册

### 修复范围（P1 必修，P2/P3 随修）

| # | 缺陷 | 修法要求 |
|---|---|---|
| P1-1 | AccountMe 纯函数零生产调用（假覆盖，W-04/W-06 同族第四现身） | MainActivity `account.me` 桥（:1821）删除 inline 装配，**改为调用 `AccountMe.me(...)` 作唯一实现**；AccountMeTest 补断言「桥调用 AccountMe.me」（行为断言或源码锚断言，防双实现漂移） |
| P2-1 | 产物 i18n 字典残留 logoutToast/accountToast demo 值，与报告「零命中」声明不符 | 删 mov-vue 源码 i18n 两个 demo key（zh/en 同步）并重建产物，产物 grep 零命中；交付报告表述更正为「UI 无引用 + 字典已清」 |
| P3-1 | 报告「249 绿」与实测不符（moduleFile 路径解析 flaky） | 测试 moduleFile 路径解析加健壮性（cwd 向上爬 + 文件存在才读，否则明确断言）；报告更正为实测口径 |

### 复验判据（验收员将按此复核）

1. `grep -r "AccountMe.me" app/src/main` ≥ 2 处（定义 + MainActivity 桥调用），桥内无 inline mapOf(loggedIn/phoneTail/masked) 重复装配；
2. 产物 `tokens-*.js` grep logoutToast / accountToast 零命中；
3. L1 全量 `--rerun-tasks` 真绿，报告数字与复跑实测一致（变异：桥改回 inline → 新增断言必红）。

### 交接要求

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：工单表 UPG-14 行备注追加 `认领: <agent> R1修复 @<时间>`；
2. 代码仍在 `feat/upg14` 分支继续（不新开分支），修复报告落 `程序员\交付报告\DELIVERY_UPG14_R1_*.md`，按「现象→根因→修法→复验」四要素写；
3. 完成后登记两个表（先表后库）：工单表程序员列 `✅修复完成`，备注 `feat/upg14 <新hash>（报告 DELIVERY_UPG14_R1_*.md）`；工单库本单状态改「程序员✅修复完成，待复验」；
4. 报告里明确写「已登记两个表」。

---

# UPG-15 登录页死锁修（登录钮常可点 + 协议整行可点）
**分类**：M5 商业/账号


```status
phase: merged
branch: feat/upg15
head: ce40e6a8
std: —
delivery_id: —
designer: —
dev: —
inspector: ✅验收员通过 @2026-08-28（151fdb1 独立复核：L1 全量 246 绿 + 变异亲杀 3/3 + L2 五图证据链；无缺陷）
merge: **设计师✅已合 main @2026-08-28**（merge 509ab0c，ACCEPTANCE_LOG append-only 冲
actor: sys04-backfill
updated_at: 2026-09-05T08:42:05
```

**状态**：✅验收员通过 @2026-08-28（151fdb1 独立复核：L1 全量 246 绿 + 变异亲杀 3/3 + L2 五图证据链；无缺陷）→ **设计师✅已合 main @2026-08-28**（merge 509ab0c，ACCEPTANCE_LOG append-only 冲突双段保留，已推 origin）｜ **优先级**：P1（用户实测踩中，随包交付）｜ **出单人**：设计师 ｜ **日期**：2026-08-27 ｜ **来源**：挂账[登录]登录钮无法点击（已转单）

## 标题

登录页交互死锁修复：登录按钮常可点（未勾选走 inline 错误提示）+ 协议整行点击切换勾选态

## 背景（设计师代码+真机双实证 @2026-08-27）

用户实测：「输好了手机号和验证码，登录键无法点击」。实证结论：**机制无 bug，是设计性死锁**——

- `LoginActivity.refreshEnabled()`（:377-383）：未勾选协议时 `loginBtn.isClickable=false`，按钮灰死且**零反馈**；
- `doLogin()` :430 本有 `if (!agreed) { setError("请先勾选协议") }` 引导分支，但按钮不可点 → doLogin 永不执行 → **该提示是死代码，用户永远看不到**；
- 勾选框 22dp 灰细边空心圆（UPG-13 #8 样式），存在感低，用户不知道要去点；
- 真机 emulator-5554 实测链：输完两框 clickable=false（规格内）→ 点勾选框 checked=true → 按钮 clickable=true 恢复（证据 `验收员\证据数据\UPG-15_登录钮禁用_勾选后恢复.png`）。

## 方案（已定口径，照此施工）

1. **登录钮常可点**：`refreshEnabled()` 去掉 `isClickable=can` 闸，按钮永远可点；视觉禁用态保留（`alpha 0.4/1f` 不变）。未勾选/表单不全时点按 → 走 `:430` 既有 `setError` inline 红字路径（表单不全的错误提示如缺失则补同等形态，复用 setError，禁 toast）。
2. **协议整行可点**：`agreeRow`（勾选框+文字+空白）整体点击 → `agreeCb.toggle()`，扩大 22dp 小圆命中区；注意 `agreeText` 含链接（LinkMovementMethod），点击落在《用户协议》《隐私政策》链接上仍走链接不触发 toggle（LinkMovementMethod 本身消费链接触摸，整行 OnClick 与之共存即可，如冲突以链接优先）。
3. **回归断言补两案**：①未勾选举证 setError 路径可达（`agreed=false` 点 doLogin → errText 显示「请先勾选协议」）；②整行点击 → agreed 翻转。变异：把 isClickable 闸加回 / 删整行点击 → 必红。

## 验收标准

- **L1**：编译绿 + `:app:testDebugUnitTest --rerun-tasks` 全绿 + 上述两案断言；变异亲杀两案。
- **L2**（真机 emulator-5554 截图入 ACCEPTANCE_LOG）：输完手机号+验证码不勾选 → 登录钮灰色但可点 → 点按出「请先勾选协议」inline 红字；点协议行空白/文字非链接区 → 勾选态翻转、按钮变实；勾选后点登录 → 正常走登录请求。
- **L3**：隐私门控 → 登录 → 主界面全链路不回归。

## 红线

- 只动交互闸与命中区：勾选状态机（agreed/refreshEnabled 视觉态）、登录请求逻辑、倒计时、Tab 切换（UPG-13 #9 修复）一行不改；
- 错误提示一律 inline setError，禁 toast（UPG-09 既定口径）；
- 协议文案与链接行为不变（UPG-11 合规口径）；
- Token/KV 申报「无影响」。

## 派单交接段（程序员领单时按此执行）

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19：以表为准，已合 main 的单基于最新 main 重开分支）；再认领：工单表 UPG-15 行备注追加 `认领: <agent> worktree=mov-upg15 branch=feat/upg15 @<时间>`。
2. **完成后必须登记两个表**（先表后库）：工单表程序员列 `✅完成` + 备注 `feat/upg15 <hash>（报告 DELIVERY_UPG15_*.md）`；工单库本单状态改「程序员✅完成，待验收」。
3. 交付报告落 `程序员\交付报告\DELIVERY_UPG15_*.md`，写明「已登记两个表」。
4. 产物提交 `0027-mov` 分支 `feat/upg15`，交付时报 hash。
5. ✅ **交付 @2026-08-27（程序员 C）**：`feat/upg15` `151fdb1`（施工）+ `ce40e6a`（ACCEPTANCE_LOG L2 登记）。L1 编译绿 + `testDebugUnitTest --rerun-tasks` **246/0** + 契约测试 3 案全绿 + 变异亲杀 **3/3** 精确命中；L2 真机六场景证据（emulator-5554）入 `验收员\证据数据\UPG-15\`；L3 门控段实测走通、登录成功段无测试凭据未实测（该段零改动面申报）；报告 `程序员\交付报告\DELIVERY_UPG15_2026-08-27.md`；**两个表均已登记**。施工要点：isClickable 恒 true（视觉灰态保留）+ agreeRow 整行 onClick + agreeTextWholeRowTouch() ClickableSpan 仲裁（链接优先，LinkMovementMethod 吃触摸的坑已处理）。

---

# UPG-16 release 签名配置收口（明文口令外移）
**分类**：M3 平台/基建


```status
phase: merged
branch: feat/upg16
head: 172e67d6
std: —
delivery_id: —
designer: —
dev: —
inspector: ✅验收员通过 @2026-08-28（172e67d 独立复核：L1 全量 243 绿 + apksigner 签名有效 + L2 口令文件
merge: **设计师✅已合 main @2026-08-28**（merge ee312f5，已推 origin；主 worktree 签名参数已落
actor: sys04-backfill
updated_at: 2026-09-05T08:42:05
```

**状态**：✅验收员通过 @2026-08-28（172e67d 独立复核：L1 全量 243 绿 + apksigner 签名有效 + L2 口令文件/git 双零命中 + fail-loud 代码审查；L3 真机走查降级已登记补验）→ **设计师✅已合 main @2026-08-28**（merge ee312f5，已推 origin；主 worktree 签名参数已落 gitignore gradle.properties）｜ **优先级**：P1（release 前置，安全红线）｜ **出单人**：设计师 ｜ **日期**：2026-08-27

## 背景（全库精读发现 @2026-08-27）

`app/build.gradle.kts` **本地未提交改动**（release 出包筹备时加的）含签名配置：keystore 绝对路径 + 明文口令 `mov@2026` ×2。好消息：**尚未 commit，git 历史干净**；坏消息：任何一次顺手 `git add .` 就泄漏（AGENTS.md 硬规则 5：口令绝不进文件/git）。另：storeFile 路径 `Desktop/MOV/MOV品牌/签名/` 是旧目录结构，签名文件实际在 `品牌管理\签名\mov-release.jks`（目录已迁移），路径也是错的。

## 方案（已定口径）

1. **口令外移**：签名口令/别名读 `gradle.properties`（项目根或 `~/.gradle/`，**确认 `.gitignore` 覆盖**）或环境变量（`MOV_STORE_PASSWORD` 等），build.gradle.kts 里只留 `providers.gradleProperty(...)` 引用，缺一即 fail-loud（`error(...)` 指明缺哪个，禁静默放空）。
2. **路径修正**：storeFile 指向 `C:/Users/Administrator/Desktop/MOV/品牌管理/签名/mov-release.jks`，同样走 property 不硬编码。
3. **本地明文块处理**：工作区现有明文 signingConfigs 块由本单施工时直接改写吸收（不落库）。
4. **顺带评审**：`isMinifyEnabled = false`——release 不混淆不压缩，给出开启 R8 的评估（风险：ML Kit/PDFBox/反射点需 keep 规则；做不了就在报告里写明暂缓理由，不许默默跳过）。

## 验收

- **L1**：`./gradlew :app:assembleRelease` 在无本地 property 时 fail-loud 报缺参；配齐后出包成功且签名有效（`apksigner verify --print-certs` 输出入报告）；全量单测绿。
- **L2**：git 全仓 + 本次 diff grep `mov@2026` 零命中（报告附 grep 输出）；`.gitignore` 生效实证（`git check-ignore` 输出）。
- **L3**：出的 release 包装 emulator 真机跑通 门控→登录→主界面。

## 红线

- 口令/jks 内容绝不进 git、不进工单库/报告明文；报告中口令一律写「已配置」；
- keystore 文件本身不动（不重新生成；改口令与否由用户另行定夺，不在本单）；
- Token/KV 申报「无影响」。

## 派单交接段

1. 认领：工单表 UPG-16 行备注 `认领: <agent> worktree=mov-upg16 branch=feat/upg16 @<时间>`。
2. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_UPG16_*.md` 写明「已登记两个表」；产物提交 `feat/upg16` 报 hash。

---

# UPG-17 App demo 假数据全清（Vue 侧）
**分类**：M8 UI/交互


```status
phase: merged
branch: feat/upg17
head: 96c963da
std: —
delivery_id: —
designer: —
dev: C 完成@2026-08-28（feat/upg17 96c963d，3 commits：926d70b feat+1f532cb buil
inspector: ✅**验收员通过 @2026-08-28 深夜**（独立复核全过：L1 `--rerun-tasks` 36 类 253/0/0 吻合+sy
merge: ✅**设计师已合 main @2026-08-28（merge 36d7f6e 已推 origin）｜UPG-17 全链闭环**（合后全量
actor: sys04-backfill
updated_at: 2026-09-05T08:42:05
```

**状态**：✅**验收员通过 @2026-08-28 深夜**（独立复核全过：L1 `--rerun-tasks` 36 类 253/0/0 吻合+sync-pages `--check` 幂等 exit 0+变异 M1 死文件/M2 假词双杀亲证+产物 7 目录 72 文件与申报逐项吻合+假数据词零命中[review/ 36 孤儿含 demo 词属挂账①范畴]；L2 **真 tap 全链走查**五页——侧边栏「MOV 用户+****0000」与宿主 phoneTail 一致/工作台接真+暂无任务暂无预约+skills 隐藏+编辑资料删+开通新能力→MarketPageActivity/关于 V1.0 无演示版/外观隐藏/飞行模式 orders「暂无订单」零 demo[错误态分支代码+i18n 在案]；白名单越界申报合理[M3 双向实证]）→ ✅**设计师已合 main @2026-08-28（merge 36d7f6e 已推 origin）——UPG-17 全链闭环**（合后全量 `--rerun-tasks` 亲跑 38 类 264/0/0 绿；顺手实证挂账②：主仓 gradle.properties 被 UPG-16 签名参数覆盖丢 useAndroidX 行致 checkDebugAarMetadata 红，已补回标准四行——gitignore 不入库，独立单必要性再+1）｜ 挂账：①review.html 丢失（审核口白屏+孤儿 chunk 含 demo 词，设计师定夺）②main 构建属性丢失（⚠️ 同案并入验收员「挂账-upg16-gradleproperties四属性丢失」主案——本次已实锤复现）③ui.openLogin 桥缺失（toast 过渡）｜ 原登记：✅程序员 C 完成 @2026-08-28（feat/upg17 96c963d，3 commits：926d70b feat+1f532cb build+96c963d 白名单；报告 DELIVERY_UPG17_2026-08-28.md；L1 253 绿+变异 3/3+产物 295→72 文件；L2 CDP DOM 实证 profile 接真/空态/skills 隐藏；ACCEPTANCE_LOG a1f926a）｜ **优先级**：P1（用户可见假数据，上架前必清）｜ **出单人**：设计师 ｜ **日期**：2026-08-27

## 背景（全库精读发现 @2026-08-27，逐项已锚定）

UPG-14 只收了设置页账号卡，精读发现假数据暴露面更大：

1. **侧边栏 profile「陈星河·商家模式」——每个用户必见**（`demo.js:210-212` + `SidebarNav.vue:71-74`）：native 下**从不覆盖**（侧边栏只调 room.list/ui.getPins/market.status，无 profile 桥）。比设置页账号卡暴露面更大。
2. **工作台假商家档案**（`demo.js:72-74`，`WorkbenchPage.vue:121`）：native 只覆盖姓名，**评分 4.9/128 单/已验证 Pro 徽标永远是假的**；loadProf 失败连名字都是假的。
3. **桥失败露 demo 通病**：`OrdersPage.vue:91`（`if (!prof.ok) return` 直接保留假订单——外卖奶茶/空调清洗）、`MarketPage.vue:196`、`ModelPage.vue:321`、`SidebarNav.vue:132`——桥任何一步失败，用户看到假数据且只有 toast。
4. **skills 演示组**（`demo.js:75-78`，WorkbenchPage/SettingsPage）：演示数据但开关/滑杆可交互只改本地，误导。
5. **死按钮**：设置页「外观」纯 toast（`SettingsPage.vue:166`）、「关于」单击「MOV AI 演示版」文案（:168）；工作台「编辑资料」演示 toast（`WorkbenchPage.vue:19`）、「开通新能力」无跳转（:43）。
6. **产物死文件 ~390 个**：7 个 pages 目录 ×（7 个死 html + 旧 hash 28-35 个），37 种旧 hash 精确清单在案（排查报告 §4），根因 = 手工整包倾倒无同步脚本。

## 方案（已定口径）

- **修 1**：侧边栏 profile 接 UPG-14 的 `account.me` 桥（已登录=「MOV 用户」+脱敏尾号；未登录=「未登录」点按跳登录），与设置页账号卡同源同口径。
- **修 2**：工作台商家卡——评分/单量/Pro 徽标**删除**（无此业务禁造假）；merchant 信息接 `biz.profInfo` 已有桥，失败显示「未完善资料」空态。
- **修 3（统一口径）**：所有桥失败路径 = **清空 + 错误态文案**，禁止保留 demo 数据。逐页改 Orders/Market/Model/Sidebar。
- **修 4**：skills 演示组 native 下整组隐藏（无后端支撑前不出现在用户界面）。
- **修 5**：「外观」行 native 下隐藏（无主题功能）；「关于」单击文案改「MOV AI V1.1」（去「演示版」）；「编辑资料」隐藏；「开通新能力」接 `ui.openMarket`（成本一行）。
- **修 6**：产物清理——删 7 目录全部非自身 html + 37 种旧 hash（清单照排查报告 §4 执行）；**写 `scripts/sync-pages.mjs`**：vite build 后按「本入口 html + 引用闭包」同步，先清后放，杜绝再生。
- **不做清单**：index 入口整链（App.vue+4 组件+i18n 五节+demo.js 六组导出）本单**不删**（浏览器演示模式去留属产品决策，另立挂账）；review.html 手写页不动；markstream 冻结区不动。

## 验收

- **L1**：vite build + 全量单测绿；sync-pages.mjs 幂等断言（跑两遍产物一致）；grep 产物无「陈星河/Pro Member/4.9/128 单」。
- **L2**（真机截图）：侧边栏真脱敏尾号、工作台无假徽标、桥失败（飞行模式）各页错误态无假数据、skills 组不可见、产物目录文件数 = 引用闭包数。
- **L3**：门控→登录→侧边栏→设置→工作台→市场全链路真机走查无 demo 字样。

## 红线

- 依赖 UPG-14 合 main 后开工，不改 account.me 桥定义（不够用登记挂账，不自造桥）；
- 真数据缺失时做空态不做假数据；禁 toast 报错用 inline/空态文案；
- demo.js 的浏览器预览分支保留（开发用），但 native 路径零 demo；
- Token/KV 申报「无影响」。

## 派单交接段

1. 认领：工单表 UPG-17 行备注 `认领: <agent> worktree=mov-upg17 branch=feat/upg17 @<时间>`（UPG-14 合 main 后方可认领）。
2. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_UPG17_*.md` 写明「已登记两个表」；产物提交 `feat/upg17` 报 hash。

---

# UPG-18 Android 死代码清理
**分类**：M3 平台/基建


```status
phase: merged
branch: feat/upg18
head: ff464808
std: —
delivery_id: —
designer: ✅ 方案完成
dev: 🛠 在施 C @2026-08-30 01:39（认领=worktree mov-upg18 branch feat/upg18）
inspector: ✅ **验收通过 @2026-08-30**（ACCEPTANCE_LOG「验收：UPG-18 死代码清理」段：L1 全量 376/0/0
merge: ✅ **已合 main @2026-08-30**（merge **6103bb8c**｜批1-4+批2修正全量在链；resolve：Mai
actor: sys04-backfill
updated_at: 2026-09-05T08:42:05
```

**状态**：✅ 方案完成 → 🛠 在施 C @2026-08-30 01:39（认领=worktree mov-upg18 branch feat/upg18）→ ✅ **程序员完成，待验收 @2026-08-30**（feat/upg18 **ff46480** 已 push origin；报告 `程序员/交付报告/DELIVERY_UPG18_2026-08-30.md`；已登记两个表）——待验收员 L1 复核+L2 抽样+L3 体积核验 ｜ **优先级**：P2（不阻塞，瘦身降维护成本）｜ **出单人**：设计师 ｜ **日期**：2026-08-27 ｜ 🔍**设计师派前复核刷新 @2026-08-29**（用户发话启动，@main 93a234b 实物重核）：**证伪复活除名 4 项**（recordSearchHits/recordCoverHits 已接线、phoneTail 已消费、SessionReference 已接线、ic_check_white 证实在用），**维持死亡复核确认**（dsh 占位/RetryPolicy/SqliteStore/McpToolProvider/NoteProvider/零散函数/资源权限，详见下方复核刷新段）；**开工基线要求**：UPG-01 批1+批2 合 main 后带来 buildToolRegistry/fallbackTools 等新符号，动工当天须以届时 main 重跑零引用扫描定稿清单 ｜ 🔎**验收员独立复核 @2026-08-29**（@main 107f9c2，与设计师刷新独立互证一致）：29/29 占位仍死（清单 24 为旧计数实 29 含 plan/Plan.kt）、除名 4 项实物重核维持、无一被别人清掉（无重复施工风险）；**补充修订 3 处**：①ToolCallView/ToolResultView 比清单更死（两接口+9 子类整层级零使用可整删，连带 BuiltinMcpTools.kt:11-12 死 import；LlmTypes 连带 Repair.kt:7）②行号刷新（togglePresentationMode→:6368、inject→:149、Phase.Maintenance→:101、printStackTrace→:234、SessionReferenceResolver 调用→:2206）③MemoryLifecycle 条目口径（UPG-22 装配打点未合 main，现 main 仅 UPG-05 952d035 一路接线）；ACCEPTANCE_LOG 落档（1407628）→ ✅ **验收通过 @2026-08-30**（ACCEPTANCE_LOG「验收：UPG-18 死代码清理」段：L1 全量 376/0/0 亲跑+删除项全库重扫零引用+除名 5 项存活+变异 M1 亲杀+APK -0.125% 双口径在案）→ ✅ **已合 main @2026-08-30**（merge **6103bb8c**——批1-4+批2修正全量在链；resolve：MainActivity 保留 UPG-27 togglePresentationMode[非死码·原清单误判纠正]+SqliteStore 删[真死码]）｜ 🔧 **登记闭环补登 @2026-09-05（设计师核物）**：卡面长期停留「在施待验收」系**登记缺失**——验收与合 main 于 08-30 早已完成（feat/upg18 ff464808 为 origin/main 祖先，分支保留在档）；当前 main 80e51e59 复扫实证：29 个 dsh 占位/RetryPolicy/SqliteStore/SqliteSchema/NoteProvider/5 drawable/2 权限全部已不在（McpToolProvider 后由 UPG-01 批4 cde86ac3 删除——安全契约镜像口径已由后续单演进）；worktree mov-upg18/mov-upg18-base 已收
**卡点**：无——已闭环（验收通过 @2026-08-30 + 已合 main 6103bb8c；登记闭环补登 @2026-09-05，详见状态行） ｜ 

## 背景（全库精读：935 函数/443 类 定义 vs 引用全量比对，人工复核 @2026-08-27）

确定死（main/test 均零外部引用，框架回调/字符串路由已排除）：

1. **整文件级（~1300+ 行）**：`app/src/main/kotlin/com/hermes/dsh/` 下 24 个移植占位文件（acp/api/attachment/boot/client/coderuntime/credentials/e2b/extensions/feedback/fs/hooks/host/identity/lsp/plan/preset/runtimediagnostics/sandbox/schedule/settings/shell/skill/storage/subprocess/terminal/typert/web/workspace）+ `llm/RetryPolicy.kt`（159 行，重试实走 DurableRetry）+ `session/persistence/sqlite/SqliteStore.kt`+`SqliteSchema.kt`（~590 行，sqlite 方案从未接线；**sqlite-android 依赖保留**——Fts5QueryEngine 在用）+ `NoteProvider.kt`（note.open 只登记在 unavailableTools，从未实例化）。
2. **零散死函数**：`MainActivity.kt:5420 togglePresentationMode`（注释自述 UI 已移除）；`SystemControlProvider.kt` bluetoothOn/bluetoothOff/wifiSet+suExec（能力已禁用整条死链）；`MovStorage.kt:307 displayPath`；`LoginState.kt:18 phoneTail`（读端死）；`LoginActivity.kt:458 fdp`；`MemoryLifecycle.kt:87/102 recordSearchHits/recordCoverHits`（连带 :88/:103 恒假 null check）；`McpServerStore.kt:46 sanitized`；`MiniJson.kt:93 bool`；`AgentLoop.kt:145 inject`；`AgentLoop.kt:97 Phase.Maintenance`（从未构造，when 分支不可达）；Tools.kt 死成员/死子类（PostToolDecision 层级、ToolCallView/ResultView 部分子类）；`ToolRegistry.declOf`；`McpToolScheduler.pendingList`；`Fts5QueryEngine.removeEvent`；LlmTypes 未用 Block 数据类一批；`SessionReference` 数据类；`errorChain/isHarnessError` 等工具函数一批（精确清单以排查报告 §1C 为准照单执行）。
3. **死资源/权限**：drawable 6 个（ic_gear/ic_history/ic_market/ic_new_chat/ic_ability/ic_check_white——**注意 ic_check_white 是 UPG-13 #8 勾选框在用？施工前先核 R.drawable 引用，清单以复核为准**）；Manifest `CHANGE_WIFI_STATE`、`BLUETOOTH_ADMIN`（BLUETOOTH 保留）。
4. `AgentLoop.kt:230` 全库唯一 `e.printStackTrace()` → 换 Log。

**不做清单（本单明确不动）**：`SubmitClient.kt`（仅测试引用，市场提交线留待后续）；`MainActivity.deleteRoomConfirm`（注释声明留给 room.delete 桥）；`assets/workflows/demo-*.json`（设计内 demo）；Tools.kt 接口默认方法（presentCall 等 dsh 对齐词汇）；`SessionQuery.searchSessions/searchEvents`、`InfoVault.credPlatforms` 等仅测试引用 API（团队约定问题，挂账另议）；index 入口/review.html/markstream 冻结区。

## 派前复核刷新（设计师 @2026-08-29，@main 93a234b 实物重核）

**证伪复活——从删除清单除名 4 项**：

1. ~~`MemoryLifecycle.kt:87/102 recordSearchHits/recordCoverHits`（连带 :88/:103 恒假 null check）~~——UPG-05/22 已接线：`MemoryMcpTools.kt:276`（search 打点）/`:338`（cover 打点）+ `MainActivity.kt:48-56 recordCoverHitForAssembly`（:3932 调用），MemoryAggregatorTest L 组链路断言在案。**注意**：cover 打点 L2 被验收员抓出作用域错配（候选 session-local vs cover 全局），UPG-22 打回修复中——函数活着但链路未闭环，本单绝不可碰。
2. ~~`LoginState.kt:18 phoneTail`~~——`MainActivity.kt:2490` 已消费（UPG-14 account.me 链，侧边栏 ****0000 实证）。
3. ~~`SessionReference` 数据类~~——`SessionReferenceResolver` 已接线：`MainActivity.kt:160-161` 定义 + `:2108` 真实调用（fts5 注入）。
4. ~~drawable `ic_check_white`~~——原卡已标疑，现证实：`bg_check_agree.xml:16` 在用（UPG-13 勾选框）。其余 5 个 drawable（ic_gear/ic_history/ic_market/ic_new_chat/ic_ability）app/src 全域零命中，维持删除。

**维持死亡——复核确认（kt/java 全域 grep + import 扫描）**：

- dsh 移植占位文件 29 个（acp~workspace，含 plan/Plan.kt）外部 import 零命中；`RetryPolicy.kt` 全自引用；`SqliteStore.kt`+`SqliteSchema.kt` 仍零接线（DSH_TRANSLATION_RESIDUE 记录在案，sqlite-android 依赖保留——Fts5QueryEngine 在用）。
- `McpToolProvider.kt` 零实例化（仅类定义+黑名单镜像注释引用），UPG-01 v2.2 已划归本单删。
- `NoteProvider.kt` 仍零实例化，`note.open` 只登记 unavailableTools（MainActivity:2179）。
- 零散：`togglePresentationMode`（行号漂移 :5420→:6266）/`SystemControlProvider` bluetoothOn/bluetoothOff/wifiSet/suExec（类活于 MainActivity:2182，但四件无 handler 注册，死链成立）/`displayPath`（MovStorage:307）/`fdp`（LoginActivity:485）/`McpServerStore.sanitized`（:46）/`MiniJson.bool`（:93）/`AgentLoop.inject`（:149）/`Phase.Maintenance`（:101 零构造）/`ToolRegistry.declOf`（:33）/`McpToolScheduler.pendingList`（:78）/`Fts5QueryEngine.removeEvent`（:69）/`errorChain`/`isHarnessError`（Error.kt:90/:115）——均仅定义处命中。
- `AgentLoop.kt` printStackTrace 仍在（行号漂移 :230→:234），换 Log 项维持。
- Manifest `CHANGE_WIFI_STATE`（:21）/`BLUETOOTH_ADMIN`（:18，maxSdk=30）随 wifiSet/蓝牙写链死亡维持删除；`BLUETOOTH` 保留（bluetoothStatus 在读）。
- Tools.kt 死成员/LlmTypes 未用 Block 等余项无新接线迹象，照排查报告 §1C 执行。

**方法学注记**：本次复核以「定义处之外零命中」为准，测试引用随删随清（红线不变）；UPG-01 批1+批2 与 UPG-22 R1 合 main 后行号/符号面必漂移，派单文本以动工当天重扫清单为准。

## 验收

- **L1**：编译绿 + `:app:testDebugUnitTest --rerun-tasks` 全绿（删除后测试引用同步清理）；**每批删除独立 commit**（①dsh 占位 ②整文件 ③零散函数 ④资源权限），任何一批回滚不影响其他。
- **L2**：真机冷启动 + 门控→登录→主界面 + 抽查 OCR/工作流/市场页功能无回归。
- **L3**：APK 体积前后对比入报告（预期瘦 ~5%）；全库重扫零引用复核（同方法学复跑，报告附清单勾选表）。

## 红线

- 只删不改逻辑；有保留注释的（deleteRoomConfirm）不动；
- drawable 删除前必须复核 UPG-13 之后的新引用（ic_check_white 疑在用）；
- 单测引用了被删符号的，测试同步删改但**禁止删断言保绿**——该补的替代断言要补；
- Token/KV 申报「无影响」。

## 派单交接段

1. 认领：工单表 UPG-18 行备注 `认领: <agent> worktree=mov-upg18 branch=feat/upg18 @<时间>`。
2. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_UPG18_*.md` 写明「已登记两个表」；产物提交 `feat/upg18` 报 hash。

---

# W-11 account-service 安全加固


```status
phase: delivered
branch: feat/w11-account-hardening
head: 655b148d
std: STD-W-11-v1
delivery_id: DEL-W11-20260905-001
designer: —
dev: ✅ C 完成 @2026-09-05（655b148d，9 隐患清零，待验收）
inspector: —
merge: —
actor: 设计师
updated_at: 2026-09-05T09:56:18
```

**状态**：✅ 已派单待领 @2026-08-28（断电重排第二批）｜ **优先级**：P1（生产 env 已核查安全——SMS_MODE=real/TOKEN_SECRET 非默认/无 dev 后门变量/部署目录白名单，但代码默认值是地雷，必须排）｜ **出单人**：设计师 ｜ **日期**：2026-08-27 ｜ → 🔧 **派单复核+STD 冻结 @2026-09-05（设计师）**：9 锚在当前 main（`market-web/account-service.js` 291 行，08-29 后无变动）逐条复核——8 项成立（行号微漂：parseToken :100/签名 !== :104/send-code :204），**+91 区号已不在**（前序已清，零命中即销项）；⚠️ 6dbc96a9 新增 register 自动注册链路（:217-228）施工不得破坏；域名拓扑更正（mov-ai.cn=官网+商家入驻、mow.kim=后台管理，L3 三端回归）；**STD-W-11-v1 已冻结**（content_sha256=9524776d…，会签待补）；已查坑位库/复用件库：是，命中：无——**可认领**
→ ✅**C 完成 @2026-09-05**（feat/w11-account-hardening **655b148d** 已 push origin，基 main 9d0061af；**9 隐患清零**：①SMS_MODE/TOKEN_SECRET fail-loud 未设拒启+real 缺 SMS_* 列明 ②DEV_FIXED_CODE 后门删除 ③token 30d 过期 parseToken 校验 ④IP 限流每 IP 每小时 10 次 ⑤timingSafeEqual 签名统一 ⑥readBody 64KB 上限 ⑦+91 销项（grep 确认仅功能正则） ⑧register 链路不破坏 ⑨接口路径/响应结构不变；**变异 3 锚**[fail-loud 锚恢复默认值红/token 过期锚删校验红/后门锚复活红——形态实录]；**L1 单测 5/5 PASS**[SMS_MODE/TOKEN_SECRET/real SMS_*/dev 非回环/DEV_FIXED_CODE 零命中]；**L2 灰度+L3 三端回归转持有**[需部署到服务器——coverage PARTIAL 设计师裁决位]；Token/KV 0/0；DEL-W11-20260905-001[code=655b148d/artifact=d85e39bb(文件级 sha)/manifest 见案]；报告 DELIVERY_W11_2026-09-05.md；**已登记两个表**）——待验收员验收（L1+变异复杀+L2 灰度+L3 三端回归[部署后]+合后 verify-hash 终态复核）

## 背景（全库精读 + 生产实查 @2026-08-27）

`account-service.js`（生产 /opt/market-account/，systemd mov-account.service）代码层隐患（生产 env 当前全部规避，属「地雷未爆」）：

| # | 隐患 | 锚点 |
|---|---|---|
| 1 | `SMS_MODE` 默认 `"dev"`：dev 下不发短信、验证码只打日志，配合 2/3 任意人可登任意号 | :10 |
| 2 | `DEV_FIXED_CODE` 固定验证码后门分支 | :57 |
| 3 | `TOKEN_SECRET` 默认值公开，不设 env 则 token 可伪造（/me、/set-password、/merchant/apply 全失守） | :12 |
| 4 | token 永不过期（payload 有时间戳但 parseToken 不验） | :95-109 |
| 5 | /send-code 无 IP 级限流（real 模式可刷短信费用攻击） | :77-93 |
| 6 | 签名比较用 `!==` 非 timingSafeEqual（同文件 verifyPassword 就用了，标准不一） | :103-104 |
| 7 | readBody 无大小上限 | :179-187 |
| 8 | `+91` 印度区号残留（定位仅中国大陆） | :205 |
| 9 | real 模式缺 SMS_* 启动校验，缺一个就每次静默失败 | :172-175 |

## 方案（已定口径）

1. **默认值全改 fail-loud**：`SMS_MODE` 未显式设置 → 拒绝启动；`TOKEN_SECRET` 未设 → 拒绝启动；删 `DEV_FIXED_CODE` 分支（dev 模式保留本地开发用，但必须显式 `SMS_MODE=dev` 且监听非回环地址时拒绝启动）；real 模式启动校验 5 个 SMS_* 非空，缺一拒启并列明缺哪个。
2. **token 过期**：parseToken 校验时间戳，有效期 30 天（过期 → 401 重新登录；App 侧已有登录页兜底，零 App 改动）。
3. **IP 限流**：/send-code 加 IP 维度计数（如每 IP 每小时 10 次，内存 Map 即可，与现有手机号 60s 冷却叠加）。
4. timingSafeEqual 统一、readBody 上限 64KB、删 `+91`。
5. **部署核查（已在出单时由设计师做过一轮：env 安全、/var/www/market-web 无源码泄漏）**：施工后复核 systemd unit 无需改 env（现 env 已满足新 fail-loud 口径），零停机灰度：改完先 `systemctl restart` 前在测试端口起新进程过一遍登录全流程。

## 验收

- **L1**：单测覆盖：无 env 拒启各案、token 过期 401、IP 限流触发、body 超限 413；变异：把过期校验删了 → 必红。
- **L2**：生产灰度实证：真手机号发码→登录→/me→set-password 全流程；旧 token（修复前签发）过期后 401（如选择旧 token 宽限则报告说明口径）。
- 
- **L3**：三端回归——mov-ai.cn 商家入驻/登录 + mow.kim 后台管理登录 + App 登录。（2026-09-05 设计师口径更正：域名拓扑=mov-ai.cn 官网 C 端门面+商家入驻，mow.kim 仅后台管理；原「mow.kim 主域」表述过时）

## 红线

- 不改接口路径与响应结构（App UPG-09/工作台 W-04 均依赖现状）；
- dev 模式保留本地开发能力，但默认安全；
- 服务重启窗口告知用户（30 秒内）；部署前备份现版 account-service.js；
- 报告不含任何 env 值/密钥内容。

## 派单交接段

1. 认领：dims 基建表 W-11 行备注 `认领: <agent> branch=feat/w11-account-hardening @<时间>`。
2. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_W11_*.md` 写明「已登记两个表」；产物提交 `feat/w11-account-hardening` 报 hash。

---

# S-04 MOV 域迁移（市场迁 mov-ai.cn，API 双跑兜底）


```status
phase: registered
branch: —
head: —
std: —
delivery_id: —
designer: 方案完成待派单（ICP 硬阻塞注记：09-04 备案号已上页脚，阻塞或已解除待核实）
dev: —
inspector: —
merge: —
actor: 设计师
updated_at: 2026-09-05T10:01:03
```

**状态**：✅ 方案完成待派单（**硬阻塞：批 0 mov-ai.cn ICP 备案未落地（事件 E-03），备案前不得对生产切换——可在测试路径预演**）｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-27 ｜ **出卡**：2026-08-28（断电重排补登）

## 标题

批 1+2：mov-ai.cn 同栈双跑奠基 + 市场站页面切新域（API 留 mow.kim 永久双跑；页面迁、API 留、常量收、主域最后切）

## 背景（设计师源码/部署实测 @2026-08-27）

App 端硬编码 mow.kim 共 5 处：`MainActivity.kt:42` BIZ_BASE_URL、`:45` PARTNER_BASE_URL、`SubmitClient.kt:15`、`MarketAdminApi.kt:13`、`McpMarket.kt:31`；market-web 全库零 mov-ai.cn 痕迹。核心约束：已分发旧 APK 永远指向 mow.kim，不可回收 → **API 路径必须双跑兜底，市场页面可迁、API 不能硬切**。

## 方案（已定口径，照此施工）

1. **批 1（服务端双跑）**：mov-ai.cn DNS 解析至现服务器；Caddy 加站点块（TLS 自动签）；全路径（market 静态 + account/review/submit 反代）与 mow.kim 等价可用；逐路径对拍两域响应一致。
2. **批 2（market-web 切换）**：绝对链接/分享文案全量换 mov-ai.cn；mow.kim 市场**页面** 301 → 新域对应页（**API 路径与 /wb/ 工作台不重定向**，继续双跑）；canonical/sitemap 更新；新域页脚悬挂 ICP 备案号。
3. 批 3（App 侧 5 处硬编码常量化）另出 App 维单；批 4（mow.kim 主域切工作台）已由 W-02 提前版落地，全链路回归归批 2 验收带跑。

## 验收

- **L1**：构建绿 + 双跑配置校验脚本（Caddy 路径→服务映射两域等价断言；变异：删一条映射 → 必红）。
- **L2**：批 1 双域对拍截图（registry.json/account/market-admin/health 逐路径）；批 2 旧域 301 实跳 + 新域全页面走查，截图入 ACCEPTANCE_LOG。
- **L3**：批 2 后旧版签名 APK（V1.0）真机实测市场/注册链路不死——旧 App 兼容是本案命根子。

## 红线

- 双跑期不得关停 mow.kim 的任何 service 路径（旧 App 全靠它）；301 只切页面不切 API；
- **批 0（ICP 备案）未落地前，批 1-2 不得对生产做任何切换动作**（可在测试路径预演）；
- 微信商户回调变更前先小范围验证支付链路；迁移全程不动工作台现有功能与账号数据；
- Token/KV 申报「无影响」。

## 关联

方案文档 `设计师\方案设计\S-04_MOV域迁移至movai方案.md`（批 0 核查清单/风险登记在案）；W-02（主域切工作台已完成）；S-05/S-06（市场站修复，先修后迁）；备案事件 E-03。

## 派单交接段

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19）；再认领：dims 市场表 S-04 行备注 `认领: <agent> branch=feat/s04-domain @<时间>`。
2. 施工顺序：批 1 双跑 → 批 2 切换，两批独立可验可回滚；备案未落地只做预演不做生产切换。
3. **完成后必须登记两个表**（先表后库）：dims 市场表 S-04 行状态改「待验收」；报告落 `程序员\交付报告\DELIVERY_S04_*.md` 写明「已登记两个表」；产物提交 `0027-mov` 分支 `feat/s04-domain` 报 hash。

---

# S-05 市场首页去 demo 化（接 registry + 空态诚实 + 死链清理）


```status
phase: closed
branch: —
head: —
std: —
delivery_id: —
designer: —
dev: —
inspector: ✅ 验收通过 @2026-08-29（公网+服务器双实证）
merge: ✅ 已闭环（服务端生效，无 main 合并对象）
actor: 设计师
updated_at: 2026-09-05T10:01:33
```

**状态**：✅**验收通过 @2026-08-29**（查验员确认：验收结论真实可信；验收员公网+服务器双实证——线上 registry 撤 demo 卡 packages=1 仅剩 browser-automation/builtin 真包、公网=服务器 md5 同源、消费面 /home/market/ + /tools/data.js 同源 fetch 成立、备份 registry.json.bak_demo撤卡前_2026-08-29 在架可回滚、App 侧零改动口径属实；ACCEPTANCE_LOG 67cee93 已合 main；生产数据层变更无代码 diff） ｜ **优先级**：P1（对外诚信问题：页面展示不存在的工具与假创作者）｜ **出单人**：设计师 ｜ **日期**：2026-08-27 ｜ **出卡**：2026-08-28（断电重排补登）

## 标题

/tools/ 市场首页：删硬编码假工具卡 + 精选区接 registry.json + 诚实空态 + 全站死链清理

## 背景（设计师实测 @2026-08-27）

生产 registry.json 原 0 工具，但首页 `/tools/` 展示 6 卡——其中 3 卡（向量内核/思维图谱/凭证卫士，假创作者 A. Lin/M. Kael/S. Yang）是 `index.html:211-225` **硬编码假数据**；卡片全部死链。违反自有防编造原则，被用户/审核点开即穿帮。**@08-28 更新**：S-08 验收已核实 registry 现 3 真实包（wx-merchant-onboard[declarative]/hello-world[byo]/browser-automation[builtin]）——「官方三卡核实」以此为基础复核。

## 方案（已定口径，照此施工）

1. 删假卡：index.html 三个硬编码假工具卡全部移除；
2. 接真数据：精选工具区改 fetch `market/registry.json` 渲染；空数组 → 诚实空态（「市场刚开张，第一批工具审核中」+ 上传入口引导）；
3. 官方三卡逐核：真实存在则保留并注明「官方」，不存在同删；核实结论写进交付报告（不信页面自报）；
4. 死链清理：全站卡片/按钮逐一点验，无去向的接真实路由或删（含「创作者画廊」CTA、详情页跳转）；
5. 上传入口（upload.html）为真入口，保留并在空态文案引导。

## 验收

- **L1**：构建绿 + 校验脚本：index.html 无「向量内核/思维图谱/凭证卫士/A. Lin/Kael/S. Yang」残留（变异：放回一个 → 必红）；工具区渲染来自 registry.json 断言。
- **L2**（真实浏览器截图）：/tools/ 空态诚实展示（或真实工具列表）；每张卡片可点且有真实去向（点验录屏）。
- **L3**：registry.json 临时注入一条测试工具 → 页面出现该卡 → 还原（规则 18 精神，测完清理）。

## 红线

- 零虚构：页面任何工具/创作者/数据必须真实可溯源；
- 不碰上传/审核/商户接口逻辑，纯展示层整改；视觉沿用现有设计 token，空态不另起风格；
- Token/KV 申报「无影响」。

## 派单交接段

1. **开工前先 `git fetch origin` + 看工单库本单状态**（规则 19）；再认领：dims 市场表 S-05 行备注 `认领: <agent> branch=feat/s05-demarket @<时间>`。
2. **完成后必须登记两个表**（先表后库）：dims 市场表 S-05 行状态改「待验收」；报告落 `程序员\交付报告\DELIVERY_S05_*.md` 写明「已登记两个表」+「官方三卡核实结论」；产物提交 `0027-mov` 分支 `feat/s05-demarket` 报 hash。

---

# S-06 市场站 bug 批修 + 死文件清理


```status
phase: delivered
branch: feat/s06
head: 87ec0a12
std: —
delivery_id: —
designer: —
dev: ✅ 程序员完成 @2026-08-29（87ec0a1；部署卡腾讯云扫码墙）
inspector: —
merge: —
actor: 设计师
updated_at: 2026-09-05T10:01:44
```

**状态**：✅程序员完成 @2026-08-29 03:1x（feat/s06 87ec0a1 已 push origin；9 组全修：upload 提交按钮 id[功能复活]+动态计数/index 引号/admin 假状态诚实口径/details 占位图×2+假副标题+alert/explorer 分类对齐 registry 实况[onboarding/demo/browser 3 包]+过滤绑定+死按钮移除+死变量/guide 错字/server.mjs 站表 f[2] 修复[**真实站表 3384 站验证 BJP/BXP**，UPG-03 App 侧同源口径]/死文件清理[git rm 3+untracked 删 1]；L1：node --check 全部 js+server 真实站表验证；**部署待办**：market-web 静态站 scp 上线[腾讯云扫码墙阻断，转设计师/用户]）｜ **原状态**：✅ 已派单待领 @2026-08-28（断电重排第二批）｜ **优先级**：P1（upload 提交功能整页失效 = 市场入驻线功能死）｜ **出单人**：设计师 ｜ **日期**：2026-08-27
｜ ❌**验收员打回 @2026-08-29（轻量批）**：②⑧未完成（引号申报失实+死文件未 git rm），两处小修后免全量复验；ACCEPTANCE_LOG ef3ad38 → ✅**已闭环销项 @2026-09-03**（UPG-90 合 main 39b17c4：②引号闭合+链接断言、⑧死文件库内零残留实证）

## 背景（全库精读发现 @2026-08-27，逐项锚定）

1. **upload.html 提交整页失效**：`:200` `getElementById("submit-btn")` 返回 null（:186-189 按钮无 id），`btn.onclick=` 抛 TypeError，整个 IIFE 不执行——商家上传功能当前是坏的。
2. `index.html:199` `href="explorer.html>` 引号未闭合 → 链接必 404。
3. `admin-console.html:102` 审核服务状态硬编码「正常」从未真实探测。
4. `details.html:115,134` 两张 lh3.googleusercontent.com 设计稿占位图仍在线上；`:129` 硬编码假副标题（加载窗口期可见）；`:187` 「安装到 MOV」= alert 占位。
5. `explorer.html:123-127,145` 分类按钮+「加载更多」无 JS 绑定死 UI；`:157` 死变量 q（选择器不匹配恒空）。
6. `upload.html:176` 0/20 静态计数无 JS；`:129` 「第1步/共3步」33% 进度条设计稿残留；`:149` data-cat1 无消费方。
7. `guide.html:168` 错字「绝费用腾讯地图」。
8. **死文件**：`market-web/sms-probe.js`（一次性探针，未跟踪）、`make_guide.py`/`make_merchant.py`（已与产物分叉的一次性生成器，重跑会覆盖手工改动）、`run-pc.sh`（改名前残留跑不通）。
9. **附带疑似 bug（先验证后修）**：`scene-mcp/server.mjs:29` 12306 station_name.js 字段顺序疑似解析错位（实际格式 `拼音缩写|站名|电报码`，f[0] 当 code 会把拼音缩写当电报码，查票必败）——用真实响应验证，属实随单修。

## 方案

- 修 1/2/3/4/5/6/7 按锚点逐条修：upload 补 id 并真实实测提交链路；admin-console 状态接真实探测或标「未探测」；占位图换本地资产或删除；死 UI 接功能或移除（决策：分类按钮接 registry 筛选，加载更多移除——工具量小用不上）。
- 删 8 全部死文件（git rm + 未跟踪的直接删）。
- 9 先验证：构造真实站名查询，败则修解析。

## 验收

- **L1**：upload 提交链路脚本化断言（字段校验→提交→成功态）；grep 无 googleusercontent/alert( 占位。
- **L2**：真实浏览器双端：upload 页提交真数据成功、index 链接可点、details 无占位图、explorer 筛选可用。
- **L3**：12306 场景工具真实查票一次（结果截图）。

## 红线

- 不碰 S-05 范围（首页假卡/registry 空态——S-05 单管）；不动 scene-mcp 除 9 以外的逻辑；
- 部署白名单维持现状（不新增公开文件）；Token/KV 申报「无影响」。

## 派单交接段

1. 认领：dims 市场表 S-06 行备注 `认领: <agent> branch=feat/s06-market-fixes @<时间>`。
2. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_S06_*.md` 写明「已登记两个表」；产物提交 `feat/s06-market-fixes` 报 hash。

---

# W-12 workbench 前端小修批


```status
phase: registered
branch: —
head: —
std: —
delivery_id: —
designer: 方案完成待派单（P3 小修批）
dev: —
inspector: —
merge: —
actor: 设计师
updated_at: 2026-09-05T10:00:50
```

**状态**：✅ 方案完成，待派单 ｜ **优先级**：P3（小修批，顺队列）｜ **出单人**：设计师 ｜ **日期**：2026-08-27

## 背景（全库精读发现 @2026-08-27）

1. **SVGs 图标表死代码**：`app.js:9-17` 用 `s.key.slice(3)` 查表，但 `'app-tickets'.slice(3)='-tickets'` 永远命中不了——侧栏图标恒为兜底「·」。slice(4) 才对，TREE 死代码同款。
2. `app.js:849` 「5 维度」硬编码，实际 6 维（verify 断言就是 6）。
3. `app.js:816` renderArchive 里 timeline 分支不可达（route 已分流）；`:920-921` MovWb 重复初始化冗余。
4. `sync-workbench.mjs:245` sec() 死参 name；`:236` enrichTicket 用 DEFAULT_CENTER 而非 CENTER（env 覆盖不一致）；`:4` 注释与行为不符残留；`:285` marketing-cal fallback 是前端不渲染的死数据路径。
5. **sample.json 死链**：fallback 中间跳 `workbench.sample.json` 在 gitignore 且 deploy 只 scp workbench.json——生产永远 404（verify:188 还锁着这个字符串）。决策：**砍掉中间跳**（fallback 两级：fetch 失败 → 内嵌 SAMPLE），verify 同步改。
6. **verify 工单耦合断言退役机制**：`:119-122,137-141` 硬编码 UPG-13/W-05 断言——工单归档后 verify 会永久红。决策：加「断言退役表」注释规约（工单合 main 满 7 天或归档后可移除，移除时记 ACCEPTANCE_LOG）。

## 验收

- **L1**：verify 基线绿；变异：slice 改回 (3) / 维度数改回硬编码 → 必红；sample 跳删除后 fallback 断言更新。
- **L2**：侧栏图标真实渲染（截图对比修复前后）；断 JSON 两级 fallback 不白屏。
- **L3**：sync --deploy 全链路不回归。

## 红线

- 只修不重构；决策点（5/6）按上述口径执行，不另起方案；Token/KV 申报「无影响」。

## 派单交接段

1. 认领：dims 基建表 W-12 行备注 `认领: <agent> branch=feat/w12-wb-fixes @<时间>`。
2. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_W12_*.md` 写明「已登记两个表」；产物提交 `feat/w12-wb-fixes` 报 hash。

---

# S-07 MOV 公众官网一期（用户下载门户 + 创作者开发者中心）


```status
phase: merged
branch: —
head: ce1ab567
std: —
delivery_id: —
designer: —
dev: —
inspector: ✅ 验收通过 @2026-08-28
merge: ✅ 已合 main @ce1ab567
actor: 设计师
updated_at: 2026-09-05T10:01:56
```

**状态**：✅验收员通过 @2026-08-28 → **设计师✅已合 main @2026-08-28**（ce1ab56 ff 合入，ACCEPTANCE_LOG 冲突按 append-only 语义双段保留解决，official verify exit=0，已推 origin；/home/ /dev/ 生产在案）｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-27

## 标题

MOV 公众官网一期：双受众门户——用户线（产品介绍 + APK 下载）+ 创作者线（开发者中心/官方接口文档），落地 mow.kim 子页，mov-ai.cn 备案后平移

## 背景（用户定夺 @2026-08-27）

mov-ai.cn 备案预期 2-4 周，官网不等，先在 mow.kim 子页开工。**官网服务两类人**：

1. **大众用户**——来看产品、下 App。核心动作 = 下载 APK；
2. **MCP 工具创作者**——来给 MOV 生态开发工具。核心诉求 = **完善的官方接口文档**（这是创作者能不能干活的前提，也是市场 S-02 入驻线的地基）。

现有底子：市场站 `dev-docs.html`（142 行，9 节工具开发规范：声明契约/命名/参数输出/16 类错误/并行作用域/权限分级/MCP 暴露面/dsh 对比/开发入口）——**有骨架但埋在 /tools/ 深处、不成体系**：缺工具包结构、缺提交-审核-上架全流程、缺示例模板、缺调试方法。upload.html 提交功能还是坏的（S-06 在修）。本单把创作者文档提升为官网一级板块并补全。

## 方案（已定口径）

### A. 站点结构（mow.kim 子页，两线三区）

```
mow.kim/home/   用户门户（单页）
mow.kim/dev/    开发者中心（文档站，多页）
```

Caddy 加两条静态映射；不动主域工作台、不碰 /tools/ 市场、不动 account 服务。

### B. 用户门户 /home/（单页）

1. **hero**：竖眼 Logo + 「让 AI 成为你的日常」+ **APK 下载区**（首屏醒目）：直链按钮 + 下载二维码双形态；版本号/更新日期/文件大小**实标**（构建时从实际 APK 读，禁手填假数据）；上架应用宝后换商店链接（留配置位）；
2. 产品能力三节（AI 对话/工具调用/能力市场——只写真实已上线能力，产品图用真实 App 截图脱敏）；
3. 创作者引流条：「为 MOV 开发工具」→ /dev/；
4. 页脚：赣ICP备2026013905号-1（链 beian.miit.gov.cn）+ 公安备案位（E-02 后补）+ 《隐私政策》/privacy。

### C. 开发者中心 /dev/（本单重点，文档即产品）

以现有 dev-docs.html 九节为底，重构为完整文档站（多页，纯静态）：

| 板块 | 内容 | 现状 |
|---|---|---|
| 快速开始 | 5 分钟跑通第一个工具（hello world 模板包 + 本地调试方法） | **新增** |
| 工具开发规范 | 现有九节（契约/命名/参数输出/错误/并行/权限/MCP 暴露面） | 迁移+补全 |
| 工具包结构 | 包目录规范、manifest 字段、registry.json schema（与 market-registry 对齐） | **新增** |
| 上架流程 | 注册→开发→upload 提交→审核标准→上架→更新；审核标准写明文（什么会被拒） | **新增** |
| 接口参考 | 市场相关接口（registry 拉取、提交接口字段级说明） | **新增** |
| FAQ/排错 | 常见拒审原因、调试技巧 | **新增** |

**文档纪律**：所有接口/字段说明必须对照源码写（McpServer/Tools.kt/registry 实际实现），禁止凭记忆编——这是官方文档，写错一个字段创作者就踩坑；每页底注「最后同步 commit」。

### D. 平移纪律（命门，同 v1）

全相对路径；域名单点配置；内容零 mow.kim 硬编码；迁移 = 改配置 + 拷贝 + 301（S-04 接管）。

## 验收

- **L1**：校验脚本——零 mow.kim 硬编码、ICP 悬挂、下载区版本信息来自构建变量非硬编码、文档内部链接全通（死链扫描）；变异：塞域名字样/改假版本号 → 必红。
- **L2**（真实浏览器双端截图）：/home/ 下载按钮+二维码实测可下（真 APK 落盘）；/dev/ 六板块全通、hello world 模板按文档实操能跑（文档实证——照自己写的文档走一遍）。
- **L3**：部署公网 curl 200 ×2 区；平移演练（改配置打包断言零域耦合）。

## 红线

- 文档内容对照源码核实，禁编造接口/字段；拿不准标「待核实」进挂账；
- 只写真实已上线能力；无假截图；
- 不碰主域工作台//tools//account；upload 功能修复归 S-06，本单只在文档里描述流程；
- 下载 APK 从官方路径出，禁第三方网盘；
- Token/KV 申报「无影响」。

## 关联

- E-03（备案，阻塞迁移不阻塞本单）；S-04（域迁移接管平移）；S-06（upload 修复，文档流程以其修复后形态为准）；S-02（商家入驻线，审核标准与其对齐）；W-03（合规页脚）。

## 派单交接段

1. 认领：dims 市场表 S-07 行备注 `认领: <agent> branch=feat/s07-official-site @<时间>`。
2. 代码落点：`0027-mov` 新建 `official-web/`（home + dev 两区）；Caddy 改动随单提交 `docs/deploy/`。
3. 施工顺序：批 1 /home/ 用户门户 → 批 2 /dev/ 文档迁移补全 → 批 3 下载区构建变量化+部署；每批独立可验。
4. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_S07_*.md` 写明「已登记两个表」；产物提交 `feat/s07-official-site` 报 hash。
5. ✅ **交付 @2026-08-28（程序员 C）**：`feat/s07-official-site` 五 commits（领 cf303d4 → 批1 033cee3 /home/ → 批2 55193ba /dev/ 六板块 → 批3 7992cbd Caddy+登记 → ce1ab56 dims 完成态）。**已上线 mow.kim**：`/home/` 用户门户（APK 直链+二维码，版本/大小/SHA256 由 generate-vars.py 从真实 APK 读取构建变量化；真机截图×2）+ `/dev/` 开发者中心六板块 + hello-server.mjs 模板（实测三连全通）；接口字段经源码逐项核实（只读先行/黑名单7/超时5s30s/健康检查200 405/缓存1h/限流3次每分），口径分歧定案两条（id 网页口径；网页提交仅 byo）。L1 verify.mjs 全绿+变异 3/3；L2 双端截图（`验收员\证据数据\S-07\`）+hello world 实操；L3 公网全 200+APK 字节级对账+主域/市场零影响+平移演练（--domain mov-ai.cn 页面零改动）。**两个表均已登记**；报告 `程序员\交付报告\DELIVERY_S07_2026-08-28.md`。遗留：release 签名管线建议随发布单接入（签名 jks 已备）。

---

# UPG-19 应用图标换 MOV 竖眼 Logo
**分类**：M8 UI/交互


```status
phase: merged
branch: feat/upg19
head: 82a5322b
std: —
delivery_id: —
designer: —
dev: —
inspector: ✅**验收员复验通过 @2026-08-28**（验收对象=入库链 feat/upg19 fa8fdd1+2c6b777+82a5322：L
merge: **设计师✅已合 main @2026-08-28**（merge 17b4e04 已推 origin；mov-upg19 worktree
actor: sys04-backfill
updated_at: 2026-09-05T08:42:05
```

**状态**：✅**验收员复验通过 @2026-08-28**（验收对象=入库链 feat/upg19 fa8fdd1+2c6b777+82a5322：L1 全量 246/0/0 独立实跑吻合 + 变异双杀亲证[M1 删 icon 属性 verify exit1 / M2 生成器删 offset 自检 exit1 拒绝产出] + L2 装机竖眼显形四重实证[dark 0%→4.06%、bbox 119×132 居中、形状 IoU 0.472、白底不裁切] + L3 图标冷启 LoginActivity 正常）→ ✅审验通过（证据链真实可信，审验员确认）→ **设计师✅已合 main @2026-08-28**（merge 17b4e04 已推 origin；mov-upg19 worktree 可收）｜ 原登记注记：R1 为并发实例汇合交付（并行会话 .NET 通道 gen_icons.ps1 未入库[2c6b777 拆出保留]，其「编码器 Skia 不兼容」假设被入库实证证伪——白盘真根因=foreground 位图放 mipmap-anydpi-v26 消费异常，以 drawable-nodpi 布局消除；工单库本行曾按未入库口径登记，已由验收员修正为入库链口径）｜ **优先级**：P1（release/上架必需——应用宝也查图标）｜ **出单人**：设计师 ｜ **日期**：2026-08-28

## 标题

启动器图标落地：MOV 竖眼 Logo 接入（adaptive icon + 旧版 PNG 兜底 + Manifest 接线）

## 背景（设计师源码实测 @2026-08-28）

用户实测：安装后应用图标是系统默认（安卓机器人/默认形），不是 MOV Logo。根因实锤：`AndroidManifest.xml:20` `<application>` **根本没有 `android:icon` 属性**，`res/` 下**无任何 mipmap 目录**（只有 drawable/drawable-nodpi/xml）——启动器图标从未做过。`drawable-nodpi/mov_logo.png`（竖眼透明底，UPG-09 引入）只在登录页用。

## 方案（已定口径）

1. **Adaptive icon（API 26+）**：新建 `res/mipmap-anydpi-v26/ic_launcher.xml`（+ `ic_launcher_round.xml`）：
   - `android:foreground` = 竖眼 Logo 前景 drawable——透明底 Logo 缩放至**安全区内（中心约 60-66%）**，自适应图标会被系统裁圆/方圆，Logo 不能顶边；
   - `android:background` = 纯白（`#FFFFFF`）——黑白灰品牌基调，黑线稿 Logo 白底最稳；
   - 前景用 `mov_logo.png` 缩放生成 `ic_launcher_foreground.png`（xxxhdpi 432×432 基准，Logo 居中占比 ~60%），各密度生成或单 nodpi 一张均可（自适应前景允许 drawable 引用）。
2. **旧版 PNG 兜底（API ≤25）**：`mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi/ic_launcher.png`（48/72/96/144/192px），白底 + Logo 居中同比例。
3. **Manifest 接线**：`<application>` 加 `android:icon="@mipmap/ic_launcher"` + `android:roundIcon="@mipmap/ic_launcher_round"`。
4. 生成方式：脚本或 Android Studio Image Asset 均可，但产物必须入库（禁止只在 IDE 里生成不提交）；源图只用 `drawable-nodpi/mov_logo.png`，不描边不加字。

## 验收

- **L1**：编译绿 + 全量单测绿（--rerun-tasks）；断言：Manifest 含 android:icon 引用、mipmap-anydpi-v26/ic_launcher.xml 存在且 foreground/background 双元素齐；变异：删 icon 属性 → 必红。
- **L2**（真机 emulator-5554 截图入 ACCEPTANCE_LOG）：安装后启动器/应用列表显示竖眼 Logo（圆形容器内不裁切、不变形、白底）；最近任务列表图标同验。
- **L3**：adb shell am start 冷启 + 图标点击启动正常（图标变更不影响 LAUNCHER 路由——UPG-09/11 门控链路回归一遍）。

## 红线

- Logo 只用现有透明底源图，不改设计不加底字；背景纯白不走品牌蓝（App 基调黑白灰）；
- 只加图标相关文件与 Manifest 一行属性，其他零改动；
- Token/KV 申报「无影响」。

## 派单交接段

1. 认领：工单表 UPG-19 行备注 `认领: <agent> worktree=mov-upg19 branch=feat/upg19 @<时间>`。
2. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_UPG19_*.md` 写明「已登记两个表」；产物提交 `feat/upg19` 报 hash。

## 打回重修段（验收员 @2026-08-28 · 优先原施工者 C）

**打回依据**：ACCEPTANCE_LOG「验收：UPG-19」（0027-mov 3b6df4a）+ 证据 `验收员\证据数据\UPG-19\`。

| # | 缺陷 | 修法要求 |
|---|---|---|
| P1-1 | 图标 PNG 内容全白（foreground+五档全部 100% 纯白像素；根因 gen_icons.mjs `decodePng()` 反滤波循环缺行末 `offset += stride`——行 1 起全部重复读行 0 附近字节[图像顶部透明边距]→alpha 全 0→合成全跳过） | ① `decodePng()` 循环末补 `offset += stride`；② 重新生成全部 PNG；③ **产物自检入报告**：解码回读统计非白像素>0（foreground 与五档逐张查），报告附统计数 |
| P1-2 | Manifest 零接线（`<application>` 无 android:icon/android:roundIcon；commit 71b7172 的 14 文件全为 res/） | Manifest 补 `android:icon="@mipmap/ic_launcher"` + `android:roundIcon="@mipmap/ic_launcher_round"` 两行属性 |
| P2-1 | 报告 L1 失实：「BUILD SUCCESSFUL（249 tests + APK 出包）」与 worktree 实况不符（构建失败）；「Manifest 含 android:icon 引用」自检与 grep 零命中矛盾；「1705B=线稿压缩效率高」归因错误（实为空白图特征） | 重交报告逐条更正；L1 必须实跑留痕（--rerun-tasks 全量 + assembleDebug） |
| P2-2 | 变异锚缺失（「删 icon 属性→必红」在 icon 属性不存在时无从执行） | 修复后补变异亲杀：Manifest 删 icon 属性 → 断言红（附输出） |

**重修验收判据**：L1 全量+出包绿（worktree 需先补 gradle.properties 四属性，见挂账-upg16-gradleproperties四属性丢失）；L2 真机装包 → 抽屉图标截图（竖眼可见/白底/不裁切不变形）+ 图标点击冷启；报告文件名更正（08-27→实际日期）。

**关联独立单**：挂账-upg16-gradleproperties四属性丢失（UPG-16 `rm --cached` 把 useAndroidX 等四行构建必需属性丢出 git——所有新 worktree/clone 构建必失败，验收员已在 mov-upg19 本地补丁实证修复有效；转独立小单，不阻塞本单）。

### 程序员 R1 重修登记 @2026-08-28 18:2x（feat/upg19 fa8fdd1+2c6b777+82a5322）

- **P1-1 修复**：`decodePng()` 补行末 `offset += stride`；生成器入库 `tools/gen_icons.mjs` + **生成即自检**（源图 .NET 锚 8.44% 对齐 + 六张产物暗像素阈值 1.5%，全白/错位非零退出）。
- **L2 白盘二段根因（新发现）**：foreground PNG 放 `mipmap-anydpi-v26/` 时设备端 AdaptiveIconDrawable 消费异常（PC 双解码器/资源表/CRC 全对但 emulator-5556 白盘，launcher+Settings 双验证，pm clear 排除缓存）。对齐 AS Image Asset 官方布局：foreground 移 `drawable-nodpi/` + XML 引 `@drawable/ic_launcher_foreground` → 装机实测竖眼 dark=3.1%（理论 3.04% 吻合）、线稿居中不裁切。
- **P1-2**：Manifest `android:icon`/`roundIcon` 两行已接（二进制 Manifest `0x01010002`/`0x0101052c` 实证）。
- **P2-1 实跑留痕**：`assembleDebug` 绿；`testDebugUnitTest --rerun-tasks` **246/0/0**（35 类；旧报告声称 249 以实测 246 更正）。L3：抽屉图标 tap → PrivacyGateActivity resumed；门控链路绿。
- **P2-2 变异亲杀**：`tools/verify_icons.mjs`——M1 删 icon 属性 → 2 FAIL exit 1；M2 删 offset → 源图自检红 exit 1；基线 exit 0。
- **撞车注记**：修复期间另一会话并行施工同单（.NET 生成器方案，工作区遗留 3 文件，18:17 登记表 E20 状态、未提交无 hash）。其「node 编码器 Skia 不兼容」假设被单变量对照证伪（编码器不变仅移布局即渲染正常）；其 20214B anydpi PNG 为死资源不影响运行。按不抹在途施工纪律已在 `2c6b777` 移出本提交（工作区保留）。**验收以 drawable-nodpi 版装机截图为准**（`验收员\证据数据\UPG-19\程序员R1\`），报告 `DELIVERY_UPG19_R1_2026-08-28.md`。
- 顺手修复：工单表 E21 非法代理对字符引用（openpyxl 不可读根因）已合法化，表恢复可读。

### 验收员复验 @2026-08-28（✅ 通过）

- **独立复核全过**：L1 `assembleDebug+testDebugUnitTest --rerun-tasks` 246/0/0（35 类，与申报一致）；六张 PNG 独立解码非全白（foreground dark 3.07% 与申报逐位吻合；五档口径差异注记）；Manifest 两属性 git diff 实证。
- **变异双杀亲证**：M1 exit 1；M2 生成器自检 exit 1 拒绝产出；还原后基线 exit 0。注记：verify_icons 自身解码器删 offset 时不红（「>0」断言不敏感）——建议阈值改「>0.5%」，非阻塞。
- **L2 四重实证**：dark 0%→4.06%、bbox 119×132 居中（申报 118×129 吻合）、形状 IoU 0.472、白底不裁切——**启动器图标=竖眼 Logo 达成**。
- **L3**：图标点击冷启 → LoginActivity（门控路由正常）、无崩溃。
- **撞车处置核对**：验收对象=入库链；B 会话产物未入库不影响验收；20214B anydpi PNG 在 HEAD 已删（工作区 untracked 随本机构建多 ~20KB 死资源，无引用无影响）。
- 落档：ACCEPTANCE_LOG 复验节（0027-mov 878b98b）；工单表 F20=✅通过+H20 注记；证据 `验收员证据数据UPG-19`（R1 装机图 3 张）。

---

# S-08 官网「能力市场」页（/home/market/，与 App 市场同源）


```status
phase: merged
branch: —
head: dc1405bc
std: —
delivery_id: —
designer: **转派 @2026-08-28 18:35（用户拍板）**：C 认领后零提交 11h（分支仍 8aaa999）、主线在 UPG-17｜转派
dev: —
inspector: ✅ 验收通过 @2026-08-28（471ae65 独立复核）
merge: ✅ 已合 main @dc1405bc
actor: 设计师
updated_at: 2026-09-05T10:02:06
```

**状态**：✅验收员通过 @2026-08-28（471ae65 独立复核：verify 绿+变异 2/2（写死黑名单包名/删空态）真实命中 + 12306 撤卡红线源码核实（SceneTools 未接线零调用，撤卡正确）+ registry 3 真实包同源 + 双端五图 + L3 公网 6 项零回归；无缺陷）→ ✅审验员通过 @2026-08-28（证据链对账：verify.mjs 复跑 exit=0 + 五图内容亲核 + L3 公网复测 200/registry 3 包吻合 + 线上页面与 471ae65 比对；另登记问题区一条：线上备案改动未入库，不影响本单）→ ✅**设计师已合 main @2026-08-28（merge b6b7972 已推 origin）——S-08 全链闭环**（合前独立复核：git 链 441b09b→dc1405b→471ae65 实证；verify.mjs 亲跑——初跑 exit=1 抓到脏状态死链（市场页备案脚引 beian.png 未入库），证实仅合已入库内容的必要性；合并时 ACCEPTANCE_LOG 追尾冲突按 append-only 双侧保留解；备案脚已补进主仓工作区市场页[未提交批次内]，合后复跑 exit=0、23 项全绿）｜ **优先级**：P1（官网双受众线的用户侧主场景）｜ **出单人**：设计师 ｜ **日期**：2026-08-28

## 标题

官网能力市场页：/home/ 新增市场板块 + 独立页 /home/market/——真实内置能力展示 + registry 市场包列表（与 App 市场页同数据源）+ 创作者引流

## 背景（设计师定调 @2026-08-28）

用户要求官网对应 App 的 MCP 市场。现状三面：App 市场页（本地 tab=`market.status`+钉选 / 市场 tab=`market.refresh`+`market.list`→registry packages）、存量 /tools/ 市场站（demo 假卡+0 真工具，S-05/S-06 待修）、官网 /home/（无市场板块）。**定调：不造第三个市场**——官网做的是「产品市场门面」，与 App 市场同读 registry；存量 /tools/ 归 S-05/S-06 修、S-04 迁移时合并；本单只动 official-web。

## 方案（已定口径）

1. **独立页 `/home/market/`**（official-web/home/ 下新增 market.html，同套 token/页脚/构建变量体系）：
   - **内置能力区**：展示 App 真实能力卡（AI 对话 / 文件处理 / 拍照 OCR / 12306 出行 / 浏览器自动化 / 信息库）——**每卡能力描述必须对照 MainActivity 工具面核实**（红线，禁编造未上线能力）；
   - **市场包区**：fetch `/market/registry.json`（与 App 市场 tab 同一数据源）渲染 packages 列表；0 包时诚实空态「首批工具上架筹备中」——禁放假工具卡；
   - **双引流**：用户侧「下载 App 体验全部能力」→ /home/ 下载区；创作者侧「为 MOV 开发工具」→ /dev/。
2. **/home/ 首页加「能力市场」板块**：三张能力卡摘要 + 「进入能力市场 →」链到 /home/market/。
3. 平移纪律沿用（相对路径/单点域名/零域字样），ICP 页脚同步。

## 验收

- **L1**：official-web/verify.mjs 扩展断言——market 页存在、零域耦合、ICP 悬挂、内置能力卡内容与工具面核对清单（报告附逐卡来源锚点）；变异：塞假工具卡/删空态 → 必红。
- **L2**（真实浏览器双端截图）：market 页空态（registry 0 包诚实显示）、能力卡渲染、首页板块+跳转、/dev/ 引流链接通。
- **L3**：构造假 registry（本地）演示有包时列表渲染→还原；公网 curl 200；/home/ 与 /tools/ 互不回归。

## 红线

- 零假数据：能力卡对照源码核实，市场包只渲染 registry 真实内容，空态就空态；
- 不碰 /tools/ 市场站、不碰 App 市场页（App 侧零改动）；
- 视觉同 official-web 既有 token，不另起风格；
- Token/KV 申报「无影响」。

## 关联

- S-05/S-06（/tools/ 市场修复，与本单互补不冲突）；S-04（迁移时三面合一）；/dev/（创作者转化链路）。

## 派单交接段

1. 认领：dims 市场表 S-08 行备注 `认领: <agent> branch=feat/s08-market-page @<时间>`。
2. 代码落点：`0027-mov` `official-web/`（home 区新增 market.html + 首页板块）；Caddy 无需改动（/home/ 映射已覆盖）。
3. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_S08_*.md` 写明「已登记两个表」；产物提交 `feat/s08-market-page` 报 hash。
4. ✅ **交付 @2026-08-28（程序员 C）**：`feat/s08-market-page` 基于 main @ abc3aa3（S-07/e07 演进已吸收），4 commits（d9bebb3 认领 → 441b09b 列位修正 → dc1405b 主体 → 471ae65 dims 完成态）。**已上线**：`/home/market/`（内置能力五卡 + fetch /market/registry.json 同源列表 + 诚实空态 + 双引流）+ `/home/` 能力市场板块；Caddy 零改动（出单人口径正确）。**红线执行：12306 卡撤下**——SceneTools 内置实现未接线运行时工具面（McpToolProvider 无调用方），上卡即编造，待接线后补卡；浏览器自动化文案带「一键启用」（builtin 默认未启用）。L1 verify ③b（假数据禁令：registry 包名/未核实能力词写死即红）+ 变异 2/2；L2 双端+空态实证（`验收员\证据数据\S-08\` 5 张）；L3 假 registry 演练 + 公网 200×3 + APK 直链不回归（文件级精确部署，未碰 e07 的 CDN 产物）。**两个表均已登记**；报告 `程序员\交付报告\DELIVERY_S08_2026-08-28.md`。口径提示：出单人「registry 0 包」与实测（3 包）不符，页面数据驱动两态兼容，无需改码。

---

# UPG-20 聊天页 chips 改造 v2（气泡式 切换模型+MCP 工具）
**分类**：M8 UI/交互


```status
phase: merged
branch: feat/upg20
head: a126756e
std: —
delivery_id: —
designer: **转派 @2026-08-28 18:35（用户拍板）**：C 认领后零提交 11h（分支仍 8aaa999）、主线在 UPG-17｜转派
dev: 🔨 已派单，C 已认领在施 @2026-08-28 07:45（worktree=mov-upg20 branch=feat/upg20，
inspector: ✅验收员复验通过 @2026-08-28 深夜（装机实证：二级 refit 重锚底部 2062≤chip 顶 2113 贴上沿不悬空、MCP
merge: ✅**设计师已合 main @2026-08-28（merge 974f33a 已推 origin）｜UPG-20 全链闭环**（合前独立复
actor: sys04-backfill
updated_at: 2026-09-05T08:42:04
```

**状态**：✅**验收员通过 @2026-08-28**（独立复核全过：L1 `--rerun-tasks` 38 类 264/0/0 与申报一致；变异亲杀自构造——applyModelPick 改独立键→契约 2 案 FAILED、还原绿；L2 装机五项实证[等宽 309px=118dp / 模型两级+chip 同步「DeepSeek V4 Pro · 深度思考 ▾」/ MCP 空态+MarketPageActivity 跳转 / 互斥首击不穿透+点外关 / **model_store.json isDefault=deepseek-v4-pro 同键实读**]；L3 环境阻塞如实降级——设备无 deepseek_key 发送未触达装配快照[logcat 实证]，代码路径闭环已核[:3250 写↔:3743 读同键+:3799 MOV-Mode 锚]，key 可用后复验）→ ✅**设计师已合 main @2026-08-28（merge 974f33a 已推 origin）——UPG-20 全链闭环**（合前独立复核：L1 `--rerun-tasks` 亲跑 38 类 264/0/0 + R2 diff 两修法亲核）｜ 遗留复核项：~~L3 MOV-Mode 三字段对账（待 key 可用环境）~~ **✅已闭环 @2026-08-29**（emulator-5558 隔离实例真实 key 双向对账：QUICK/flash/none→DEEP/v4-pro/high 三字段与 chip/装配一致，查验员 logcat 锚实证[:3807]；DEEP 恒走 v4-pro 属既有 A 方案映射[:3754]非缺陷，「深度思考跟随所选模型」另立产品单）、用户机黑块 R2 包复测（仍现走 logcat）｜ **R1 追加修复 @2026-08-28 22:35（feat/upg20 0f1b303，验收核查三缺陷在合 main 前主动修）→ ✅验收员复验通过 @2026-08-28 深夜（装机/代码全实证：空态引导行可点直达 MarketPageActivity、市场行完整在场 refit 生效、模型气泡 3 行全渲时序修复实证、切换链绿 chip 同步+isDefault=deepseek-v4-flash 实读、L1 复跑 264/0/0；ACCEPTANCE_LOG 73a7830；证据 R1 两图）**：①bubbleOpt 空态假「›」条件化（onClick==null 纯展示行无箭头）②MCP 异步渲染 refit 重锚（shell.re-measure+popup.update，「打开工具市场」行裁切）+ goL1 空占位缓存连带修（loadedGroups 回填）③MCP 空态改引导式「暂无已安装工具包，去市场看看」可点直达市场（装机实证）④**build 时序回归修正**（初版重构把 build 挪到 measure 后致同步窗口空壳——装机实测模型气泡 3 行全渲+切换链回归绿）⑤顺手小修（核查建议选项一并入收尾）：room.list 放行当前空房间 `filter { !it.blank || it.id == curId }`（新建后侧栏立即可见「新对话（当前）」，Vue 侧栏视觉转复核）；L1 复跑 264/0/0 绿，证据 R1 两图入 证据数据\UPG-20\ ｜ **用户实测反馈 @2026-08-28（设计师核实落账，待 R2）**：①**模型气泡二级悬空**——R1 的 refit 仅 MCP 气泡走，`showModelBubble` build 回调丢弃 refit（MainActivity.kt:814 `_`），一级(高)→二级(矮)不重锚，气泡底边悬空（用户截图在案）；②**时不时点 chip 现大面积黑色方块 + 触摸不灵**——疑 popup 裸窗口（透明背景 + elevation，内容首帧未绘合成黑块，focusable 吃触摸），与 R1④ 时序回归同族；用户机 APK 版本未确认，先刷 R1 复测，仍在则抓 logcat 复现 ｜ **R2 修复 @2026-08-28 23:05（feat/upg20 a126756，两条反馈全修）→ ✅验收员复验通过 @2026-08-28 深夜（装机实证：二级 refit 重锚底部 2062≤chip 顶 2113 贴上沿不悬空、MCP 同步直出无空壳、切链回归 chip 同步+isDefault=deepseek-v4-pro 实读；L1 复跑 264/0/0；ACCEPTANCE_LOG b4ae98d）**：①模型二级悬空——showModelBubble 丢弃 refit（`_` 占位）已接回+renderL1/L2 尾部重锚（装机实证：二级标题 y=1761 vs 一级 y=1637，窗口收缩 124px 底部贴 chip=重锚正确表现）②黑块+不灵预防性消除嫌疑源——MCP 气泡 Thread 异步渲染改**同步**（bubbleOverview 本地小文件读主线程微秒级，空壳窗口期不复存在，两气泡时序一致=同步渲染+refit 兜底；若复测仍现黑块再深挖，logcat 通道已在）③L1 全量绿+装机复验 ｜ 原登记：✅程序员完成（**转派接手**——原认领 C 07:45 零提交 11h，用户拍板转派 @18:35；feat/upg20 9b91f60 基于 main 3b6df4a；L1 全量 264/0/0（--rerun-tasks）+ 契约变异 2 红 + L2 装机五项（等宽 118dp 实证/模型两级切换 chip 同步+model_store isDefault 同键实读/MCP 两级+市场跳转/互斥+点外关；气泡锚 chip 上方跟随防越界）；报告 DELIVERY_UPG20_2026-08-28.md；L3 journal 对账设备无 key 未跑→转复核项（如实申报）；证据 验收员\证据数据\UPG-20\ 3 图｜ACCEPTANCE_LOG ce36d78）｜ 🔨 已派单，C 已认领在施 @2026-08-28 07:45（worktree=mov-upg20 branch=feat/upg20，断电后状态补同步；v2 @08-28 用户三轮 demo 定稿：气泡式小浮层；**v1 底部抽屉口径作废**）｜ **转派 @2026-08-28 18:35（用户拍板）**：C 认领后零提交 11h（分支仍 8aaa999）、主线在 UPG-17——转派程序员接手，同 worktree/branch 基线快进 main 后施工，表 E21/H21 已注记 ｜ **优先级**：P1（用户实测指令，随包交付）｜ **出单人**：设计师 ｜ **日期**：2026-08-28

## 标题

输入区 chips 改造：「切换模型」「MCP 工具」两枚 chip（chip 上方小气泡浮层，两级交互）+ chips 行统一宽度横滑；原「快速 ▾」模式 chip 并入切换模型，「拍照 OCR」「总结文件」chip 移除

## 定稿交互（demo 实物：`设计师\方案设计\UPG-20v2_切换模型抽屉_demo.html`，三轮迭代用户已确认）

**形态**：chip 正上方浮出小气泡（~236px 宽、圆角 14、轻阴影），跟随所点 chip 的水平位置（防越界），点空白处关闭，两气泡互斥。**不是底部抽屉**。

**「切换模型」chip**（合并原「快速 ▾」模式 chip，chip 文案 = `模型名 · 模式 ▾`）：

- 一级气泡：模型列表紧凑行（当前模型 ✓ + 标注当前模式，免费模型带「免费」标）；
- 点模型 → 气泡**原位切二级**：「‹ 模型名」+「快速 / 深度思考」两行单选；
- 点模式即完成：气泡收起、chip 更新。**模式必选由路径结构保证**（选模型必经二级，不存在未选模式的状态，不需要红字/禁用态）。

**「MCP 工具」chip**：

- 一级气泡：工具组列表（状态点 黑=启用/灰=停用 + 组名 + 工具数），数据源 = `market.status`（MainActivity.kt:1670 同源）；
- 点组进二级：组内工具清单 + 启停状态**只读**（v1 不做写操作）；
- 底部固定「打开工具市场 ›」→ MarketPageActivity（ui.openMarket 既有路径）。

**chips 行**：统一宽度（定宽胶囊、长文案省略号截断）+ 横向可滑（隐藏滚动条），后续新入口直接后插。

## 锚点（MainActivity.kt）

- :590-703 原模式 chip（「快速 ▾」及其卡片层）——功能并入切换模型气泡，UI 移除；
- :725-726「拍照 OCR」/「总结文件」funcChip——移除；`onCameraClick` 本体保留（composer 相机入口在用）；
- :2917/:3477 `chatModePref`/reasoning effort 接线——模式存储与推理档映射**沿用现状**（快速=无 effort / 深度思考=high），气泡只是换入口；
- :1598 `model.list`、:1670 `market.status`——气泡数据源复用。

## 验收

- **L1**：编译绿 + 全量单测绿（--rerun-tasks）；断言：模型切换写 ModelSheet 同一默认模型 prefs 键（源码锚）；变异：改独立键 → 必红。
- **L2**（真机 emulator-5554 截图入 ACCEPTANCE_LOG）：①chips 行两枚新 chip 等宽可横滑；②模型气泡两级走通（列表→二级→点模式收合），chip 文案同步；③MCP 气泡两级走通 + 打开市场跳转；④气泡跟随 chip 位置、点外关闭、互斥；⑤切模型后 ModelSheet 打开显示同一模型（双向对账）。
- **L3**：切「GLM · 深度思考」发消息，journal 对账模型字段+reasoning effort 均变化；门控→登录→主界面链路不回归。

## 红线

- 不动 markstream/room.html（冻结项）；composer 相机/OCR 能力本体零改动（只撤 chip 入口）;
- 模型/模式存储键全部沿用既有（ModelSheet 默认模型键 + chatModePref），禁平行体系；
- MCP 气泡 v1 只读（装卸进市场）；视觉黑白灰，与参考气泡（原快速▾浮层）形态一致；
- Token/KV 申报：模型+effort 切换影响后续请求，报告必须申报（AGENTS.md 硬规则 1）。

## 派单交接段

1. 认领：工单表 UPG-20 行备注 `认领: <agent> worktree=mov-upg20 branch=feat/upg20 @<时间>`。
2. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_UPG20_*.md` 写明「已登记两个表」；产物提交 `feat/upg20` 报 hash。

---

# UPG-21 聊天页输入框回车键=发送（IME 发送键修复）
**分类**：M8 UI/交互


```status
phase: merged
branch: feat/upg21
head: a14ee646
std: —
delivery_id: —
designer: —
dev: ✅程序员 C 完成 @2026-08-29（feat/upg21 a14ee64，基于 main 198e26f；报告 DELIVERY_U
inspector: 验收员通过 @2026-08-29（
merge: ✅**已合 main @2026-08-29（merge 5170421 已推 origin）｜UPG-21 全链闭环**（审验员五步独立实
actor: sys04-backfill
updated_at: 2026-09-05T08:42:04
```

**状态**：｜ **优先级**：P1｜ ✅**已合 main @2026-08-29（merge 5170421 已推 origin）——UPG-21 全链闭环**（审验员五步独立实证确认验收可信；设计师合前抽查：去 MULTI_LINE+IME_ACTION_SEND+listener 消费回车在码、落档 9553524 纯追加、merge-tree 零冲突预检过；merge-base=198e26f 基线干净）｜ 原登记：✅**验收员通过 @2026-08-29（独立复核）**：L1 41 类 272/0/0（申报 274 注记）+变异 2/2 亲杀[M1 加回 MULTI_LINE→契约红/M2 删 listener→编译红；过程注记：逻辑变异 isSend=false 逃逸——源码锚契约字符串断言对逻辑变异不敏感，登记方法论]+L2 真机回车=发送三步实证[输入→keyevent 66→气泡上屏+MOV-Mode 触发+输入框清空；粘贴多行走代码锚 maxLines=4，adb 无剪贴板通道如实注记]｜ ✅程序员 C 完成 @2026-08-29（feat/upg21 a14ee64，基于 main 198e26f；报告 DELIVERY_UPG21_2026-…｜ACCEPTANCE_LOG 9553524

## 标题

聊天页输入框回车键行为修正——键盘发送键=发送（不再换行）

## 背景（用户实测 @2026-08-29 + 设计师源码实证）

用户实测：「键盘的发送键无法发送，是换行」。根因实证：`MainActivity.kt:1059-1071` composer `input` EditText 设 `TYPE_TEXT_FLAG_MULTI_LINE` 且**未设 imeOptions**——软键盘回车固定为换行，键盘侧无发送通路（唯一发送通路 = 发送按钮）。

## 方案（已定口径）

1. `inputType` 去掉 `TYPE_TEXT_FLAG_MULTI_LINE`（保留 `TYPE_CLASS_TEXT | CAP_SENTENCES`）——FLAG_MULTI_LINE 存在时多数输入法直接忽略 imeOptions，这是根因；
2. `imeOptions = EditorInfo.IME_ACTION_SEND` + `setOnEditorActionListener` → `send()`（空串不发；actionId 判定 + event 兜底）；
3. `maxLines = 4` 保留（长文自动折行、视觉不变）；粘贴含换行文本仍支持（内容可含 \n，只是键盘回车不再产生换行）；
4. **trade-off 卡面明说**：软键盘手动换行能力舍弃（主流 IM 行为：微信/QQ 回车=发送）；日后如要多行输入另评「换行入口」方案。

## 锚点

`MainActivity.kt:1059-1071`（composer input 构造段）；`send()` 本体不动。

## 验收

- **L1**：契约断言（源码锚：inputType 不含 FLAG_MULTI_LINE + imeOptions=IME_ACTION_SEND + listener 接 send）+ 变异亲杀（删 listener 或加回 MULTI_LINE 必红）+ 全量绿（--rerun-tasks）；
- **L2**：真机（emulator-5556）：输入文字按键盘回车/发送键 → 消息发出 + 输入框清空 + 发送按钮消失（截图）；粘贴多行文本显示正常；4 行以上折行不超高；
- **L3**：发送链路不回归（send() 未动，走查即可）。

## 红线

- 不动 room.html/markstream（冻结项）；不动 `send()` 逻辑；登录页 EditText 不在本单范围（LoginActivity 各项 inputType 本就正确）；
- Token/KV 申报：纯 UI 行为改动，两节照旧申报「不变」（AGENTS.md 硬规则 1）。

## 派单交接段

1. 认领：工单表 UPG-21 行备注 `认领: <agent> worktree=mov-upg21 branch=feat/upg21 @<时间>`。
2. 防撞：UPG-05 待验收/待合 main（记忆体系接线同触 MainActivity 装配区）——若其先合，rebase 吸收；本单改动在 composer 段（:1059-1071），与装配区不同 hunk。
3. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_UPG21_*.md` 写明「已登记两个表」；产物提交 `feat/upg21` 报 hash。

---
# UPG-22 记忆尾单（UPG-05 遗留收口：COVER_HIT 装配打点 + 剧本断言 + 冗余清理）
**分类**：M6 记忆/知识


```status
phase: merged
branch: feat/upg22
head: 495060f3
std: —
delivery_id: —
designer: —
dev: ✅**C 完成 @2026-08-29 16:48**（feat/upg22 **aacb15b** 已 push origin，基线已 f
inspector: ✅**验收员 R1 L2 复验通过 @2026-08-29**（三连全过：①装配打点落新 session jsonl memory/ref
merge: ✅**已合 main @2026-08-29**（程序员代行设计师：rebase 87787b8 后 ff-only **495060f**
actor: sys04-backfill
updated_at: 2026-09-05T08:42:04
```

**状态**：🔨C 已认领 @2026-08-29 21:55（worktree=mov-upg22 branch=feat/upg22，从 main 8a205d6+ 切；UPG-06 批1 C3 起排队施工——认领原误写 UPG-06 行 H7，已挪正工单表 E23）（派单文本 `设计师/派单/UPG-22_记忆尾单_派单_2026-08-29.md`；规则 21 溯源复核已过，六层实物锚在派单文本末节）——**开工前置已满足 @2026-08-29：UPG-02+04 已合 main（8a205d6），可从最新 main 切 feat/upg22** ｜ ✅**C 完成 @2026-08-29 16:48**（feat/upg22 **aacb15b** 已 push origin，基线已 ff 至最新 main 0fdfe87；五件全交：①COVER_HIT 装配打点接线——打点逻辑抽 companion 纯函数 `recordCoverHitForAssembly`[生产接线与断言 A/B/C 共用单点]，turnId=cover-<指纹> dedupe 对齐 Freeze，`MemoryMcpTools.journalView()` 只读访问器零旁路，打点失败静默 Log.w ②L 组断言 A/B/C 补入 MemoryLinkInstrumentedTest[coverCount=聚合 dedupe 口径复刻；首版直数事件条数误计已修正]+M1 接线活行锚 MemoryCoverWiringContractTest[新建]+M2 断言 B ③writeTools 冗余 memory.save 清理[harmless 单列保留，PermissionGuardTest 口径同步，行为零变化] ④tools/ 四临时物捎清 ⑤R3 释法随报告发布入验收剧本；验证=L1 全量 **51 类 363/0/0+1跳过**[rm -rf 强制重跑]+**instrumented 3/3 真机 5556**[coldStart 一次 2291ms flaky 复跑绿，与本单无关路径]+assembleDebug 绿+check-token-effect 过；报告 DELIVERY_UPG22_2026-08-29.md；已登记两个表）——待验收员：L1 全量+变异 M1/M2 亲杀+L2 真机新 session journal memory/ref source=cover+**显化页引用 0→1**；销项联动=挂账表 COVER_HIT 划销+BP-05 ✅+UPG-05 遗留①③④划销 ｜ ❌**验收员打回 @2026-08-29**（②③④件+R3 释法过[L1 363/0/0 亲跑+变异 M1/M2 亲杀+instrumented 3/3 复跑]；**①COVER_HIT 打点 L2 真机 5558 不生效**：新 session 发话两轮 journal memory/ref=0、显化页 0/0 纹丝不动，但 logcat 接线被调 fp 非空 entries=2——根因=recordCoverHitForAssembly 命中候选集取 session-local memoryDrafts（MemoryMcpTools.kt:21-31 只读当前 session），新 session 无 draft 候选为空永不打点，cover 全局聚合 vs 候选 session-local 作用域错配；instrumented 绿因同 session 先存记忆绕过盲区；对照组[源房间发话]实证写入→聚合→显化页→dedupe 链完好；修法=候选集改全局聚合视图，修后仅复验 L2 三连+L1 全量；ACCEPTANCE_LOG 落档） ｜ ✅**C R1 完成 @2026-08-29 17:1x**（feat/upg22 **09b9a79** 已 push origin；修法落地=`MemoryMcpTools.aggregatedJournalView()`[读侧全局聚合投影 AggregatedJournalView.memoryDrafts/写侧当前 session journal 零旁路]，`recordCoverHitForAssembly` 候选集切换——命中候选与 cover 同域；**回归锚固化**=MemoryLinkInstrumentedTest 新增断言 D 跨 session 盲区场景[session A 存记忆落盘→session B 零本地候选装配→ref 落 B journal，缺陷版必红]+**变异 M3 亲杀自证**[候选集回退 journalView→断言 D 必红→还原绿]；验证=L1 全量 51 类 363/0/0+1跳过 强制重跑+instrumented **6/6** 真机 5556[断言 A/B/C/D 全过]+assembleDebug 绿；报告 DELIVERY_UPG22_R1_2026-08-29.md；已登记两个表）——待验收员按免全量口径复验：L2 三连+L1 全量 ｜ ✅**验收员 R1 L2 复验通过 @2026-08-29**（三连全过：①装配打点落新 session jsonl memory/ref source=cover ×2 turnId=cover-929871105 与 logcat 逐位吻合 ②显化页引用 0→1 ③同 session 重发不涨[聚合层 dedupe 三元组]；E1 剧本回归跨 session cover 注入行为面实证[花生过敏→宫保鸡丁不放花生]；代码面复核：候选集走 aggregatedJournalView 写侧零旁路、dedupe 在读侧聚合层非写侧抑制——架构自洽；不阻塞注记 1 条：写侧不抑制同 key 重复，jsonl 长 session 线性膨胀，建议后续单） ｜ ✅**已合 main @2026-08-29**（程序员代行设计师：rebase 87787b8 后 ff-only **495060f** 已推 origin；冲突仅 MainActivity companion 区与 UPG-01 批1 同域——纯新增并存解，range-diff 对勘 R1 提交=补丁等价、首件仅插入点上下文位移；合前全量闸 53 类 376/0/1 跳过 绿；worktree mov-upg22 可收；**销项链待验收员落档后划销**：挂账 COVER_HIT P1 + BP-05✅ + UPG-05 遗留①③④） ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-29

**来源**：挂账登记表「[UPG-05 | 2026-08-29] 装配路径 COVER_HIT 打点断线（P1）」转工单；UPG-05 卡遗留①③④一并并入。

**背景**：UPG-05 已合 main（66244f4），SEARCH_HIT 打点已通，但审验数据面对账发现装配注入路径（`MainActivity.kt:3612 memoryCoverPromptSegment()`→`MemoryCoverManager.currentCover`→:3997 挂 systemPrompt）**全链无 recordCoverHits 调用**——「下轮 cover+1」生产路径永不发生 → draft 引用恒 0 → 永不晋升 → 14 天衰减清场，死穴 1 只修一半。:3609-3610 注释承诺「turnId=cover-<指纹> 整段计 1 次」无实现（「函数在、链断」RepeatDetector 同款形态）。

**交付五件**（详见派单文本）：①COVER_HIT 装配打点接线（约十行，turnId="cover-"+指纹，dedupe (sessionId,turnId,draft) 实物已核可兜）②L 组链路断言补入 MemoryLinkInstrumentedTest（新 session 装配→memory/ref +1 / 同指纹重复装配 ≤1 / 移除后合法 +1）+ 变异锚 M1 删打点必红/M2 turnId 随机必红 ③writeTools 冗余 memory.save 清理（McpToolScheduler.kt:103，harmless 保留，PermissionGuardTest 口径同步）④tools/ 四临时脚本捎清（r1_test.cjs/robust_install.sh/wire_memory_host.cjs/fix_dispose.cjs）⑤R3 边界案释法发布（判事实归属不判词面：挂错对象=失，归属正确或明示无记忆=过；验收员边界案判过成立）。

**开工前置**：~~UPG-02+04 合并单合 main 后从最新 main 切 feat/upg22~~ → ✅**前置已解除 @2026-08-29（UPG-02+04 已合 main @8a205d6 已推 origin）——可随时认领，从最新 main 切 feat/upg22（worktree=mov-upg22）**；名单区/装配区撞车约束随前置解除失效（UPG-23 仍与 ③ 名单区邻接，谁先合谁占）。

**验收口径**：L1 全量绿+PermissionGuardTest 新口径；变异 M1/M2 亲杀；L2 真机（5558）journal memory/ref source=cover 实证 + **显化页「引用 0 次」变 1（用户可感知验收点）**；E1 剧本 1 跑回归。交付后销挂账 P1 项，设计师侧 BP-05→✅、记忆打点链节点→✅。

---
# UPG-23 本地 tab「本机能力总览」+ 主页钉选小按钮
**分类**：M8 UI/交互


```status
phase: merged
branch: feat/upg23
head: 8af7da9a
std: —
delivery_id: —
designer: —
dev: 修复完成@2026-08-29**（feat/upg23 **0bfa4fa** 已 push origin；`runOnUiThread
inspector: ✅**验收员复验通过 @2026-08-29**（diff 恰 1 行无夹带 + L1 338/0/0 亲跑 + 真机 5556：钉选/取消
merge: ✅**审验通过 → 已合 main @2026-08-29**（查验员逐项亲核确认；设计师 §六抽查：R1_05 主页钉选排免重启当场可见亲
actor: sys04-backfill
updated_at: 2026-09-05T08:42:04
```

**状态**：✅**程序员完成 @2026-08-29**（feat/upg23 **4293e29** 已 push origin；要点：本地 tab 总览=概览卡+钉选槽+三层分组[内置/市场/系统]+工具级下钻权限标记、主页 chips 排钉选小按钮点按回填预设指令、MCP 气泡升级总览轻量投影、market.localOverview 聚合读面[uiOnly 不进 agent 面]+PermissionGuard.permissionTier 权限级单源；L1 **338/0/0+1 跳过**（--rerun-tasks 真跑）+assembleDebug 绿+check-token-effect 过；报告 DELIVERY_UPG23_2026-08-29.md；已登记两个表；❌**验收员打回 @2026-08-29**（L1 338/0/0 亲跑 + 真机 5556 走查：读面/钉选回填/停用变淡/降级全达成；**P1 钉选刷新线程缺陷**——MainActivity.kt:2444 pinChipsRefresher 跑在工作线程，误导性「操作失败」toast + 主页钉选排清空需重启恢复；一处 runOnUiThread 小修后免全量复验仅复核钉选刷新链；证据 验收员\证据数据\UPG-23\；ACCEPTANCE_LOG 落档）；遗留：obsidian SAF 引导行实调依赖 M3(feat/upg02 70db6c6) 合入、内置包停用不摘除工具面已挂账待审）｜ 🔨**设计师定夺 @2026-08-29：P1 线程缺陷复核属实**（feat/upg23 MainActivity.kt:2444 `pinChipsRefresher?.invoke()` 在 mcpHandlers 工作线程直调 renderPinChips 触 UI——mcpHandlers 工作线程语境实证，:5984 onResume 路径无害）——**即刻排期 feat/upg23 续作一处 `runOnUiThread { pinChipsRefresher?.invoke() }`**（原施工人），验收员仅复核钉选刷新链（钉选→主页出钮→无「操作失败」toast→重启前状态保持），免全量复验；合 main 前设计师 rebase 最新 main+全量绿合入闸不变（规则 8）｜ ✅**R1 打回修复完成 @2026-08-29**（feat/upg23 **0bfa4fa** 已 push origin；`runOnUiThread { pinChipsRefresher?.invoke() }` 一处小修；L1 全量 338/0/0+1跳过 47类XML 逐件统计实证 + assembleDebug 绿[13:20 APK]；变异不适用如实申报：线程调度 JVM 层无断言面，以验收员真机钉选刷新链复验闭环[参照 UPG-14 行为面留验收员先例]；报告 DELIVERY_UPG23_R1_2026-08-29.md；已登记两个表）｜ ✅**验收员复验通过 @2026-08-29**（diff 恰 1 行无夹带 + L1 338/0/0 亲跑 + 真机 5556：钉选/取消免重启当场同源刷新、无 CalledFromWrongThread toast、回填链回归，证据 UPG-23\R1_01~09；ACCEPTANCE_LOG 落档；观察项：修复无测试锚保护，建议后续补 LocalOverviewTest 源码锚一行防回归）→ **待审验员 → 设计师合 main**｜ ✅**审验通过 → 已合 main @2026-08-29**（查验员逐项亲核确认；设计师 §六抽查：R1_05 主页钉选排免重启当场可见亲核、证据归属本单；rebase 后 ff-only **8af7da9 已推 origin**；合批[M3+M3-R2+UPG-23]后全量亲跑 **50 类 362/0/0+1 跳过绿**；worktree mov-upg23 可收；遗留：obsidian SAF 引导行实调随 M3 合入解锁、内置包停用不摘除工具面挂账待审）｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-29

**背景**：用户点名「mcp 工具市场的本地很关键」（08-28）→ 定位拍板「本机能力总览」（08-29）。现状本地 tab 是裸骨架（market.status 只回 server 级健康，无内置包/无工具清单）；UPG-02+04 合入后 20 个内置工具无任何界面可见。本单两件交付：①本地 tab 升级总览（概览卡+钉选槽+三层分组[内置/市场/系统]+工具级下钻带权限标记）②主页 chips 排钉选小按钮（钉选的用户可感知出口）+ MCP 气泡升级总览轻量投影。

**方案要点**：新增 `market.localOverview()` 聚合读 API（只读零网络，健康沿用 status 缓存；groups→pkgs→tools 三层，tool 带 desc+perm）；新增 `McpToolScheduler.permissionTier(tool)` 只读单源访问器（**名单内容禁止进前端**——黑名单四处镜像前科）；pins 复用 workbench_pins 单一写点；桥接线=mcpHandlers+市场页白名单+toolParamSchemas 三处登记。

**风格硬规（用户拍板「简约高级感、大小格式统一」）**：色/圆角/字号/间距只用 Vant token 变量，禁止写死色值；分组=van-cell-group inset、开关=van-switch、状态点三态 7px 与 UPG-20 气泡同款；主页小按钮与 chips 行高/8px 间距对齐。验收含 grep 写死色值=0 抽查。

**红线**：零平行数据源（L6）；不碰 room.html/markstream/send()；系统组（file/note/memory）只展示不可关；builtin 启停只走既有 setEnabled 支路；Token/KV 两节申报「不变」。

**验收**：L1 全量绿+聚合纯函数测试+变异锚 M1 权限级接错名单必红/M2 聚合删内置分组必红/M3 pins 截断破坏必红；L2 真机三层分组+权限标记截图、停用→主页小按钮变淡、钉选→主页出钮点按回填；E 面用户路径「装包→总览看见→钉选→主页点钮→指令回填→发送」一遍过；风格验收=并排截图对比+token 抽查。

**派单交接段**：
1. 认领：工单表 UPG-23 行 E 列写 `认领: <agent> worktree=mov-upg23 branch=feat/upg23 @<时间>`；
2. 防撞：MainActivity chipsRow 区（与 UPG-20/21 邻接）开工前确认无在途占用；McpToolScheduler 名单区与 UPG-22 ③ 邻接，谁先合谁占、后到 rebase；UPG-02+04 合 main 后内置包 registry 实列为分组数据定稿输入（数据面/聚合层可先行施工）；
3. 完成后登记两个表（先表后库）；报告落 `程序员/交付报告/DELIVERY_UPG23_*.md` 写明「已登记两个表」；产物提交 feat/upg23 报 hash。

---
# UPG-24 MOV 设计规范 v1（风格定性 + token 坐标表）
**分类**：M2 体系/治理


```status
phase: obsolete
branch: —
head: —
std: —
delivery_id: —
designer: ❌ **已作废 @2026-09-02**（用户拍板：设计规范 v1 文档已删｜由 v2/v2.1+UPG-50 外观组件体系接替；本卡销账
dev: —
inspector: —
merge: —
actor: sys04-backfill
updated_at: 2026-09-05T08:42:04
```

**状态**：✅**规范文档已交付 @2026-08-29**（`设计师/方案设计/MOV设计规范_v1.md`，待用户过目）｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-29
→ ❌ **已作废 @2026-09-02**（用户拍板：设计规范 v1 文档已删——由 v2/v2.1+UPG-50 外观组件体系接替；本卡销账不参与后续）

**背景**：用户拍板「风格统一要做——现在的风格定性，边框按钮字体边距定下来，出坐标，后面创造者做皮肤有数据参考；每页扫一遍瑕疵」。

**交付**：规范 v1——①色板（tokens.css 唯一源：primary #0E7C5B/surface 5 级/文本 3 级/语义 3 色，含暗色组）②字阶 7 档（10/11/12/13/14/15/19，禁 9sp+10.5/12.5 半档）③圆角 6 档（4/8/12/14/16/全圆）④间距 4 倍数阶梯+行高/顶栏 46px 定规 ⑤组件规格 10 件（按钮/chip[去▾]/卡片/sheet/开关/状态点/tab/toast/空态/时间戳）⑥皮肤创作指南（换皮=只改 token 值）⑦待并轨清单 13 项（现状值→规范值，带文件:行号锚点，=UPG-25 施工范围）。

**依据**：全仓扫描实物反提（explore 逐文件取值报告在案）——以实物定标不凭空发明；硬规：禁写死色值/字号/圆角，web 用 CSS 变量、原生用 UiTokens 常量（UPG-25 建）。

# UPG-25 UI 瑕疵批修（规范 v1 待并轨清单 13 项）
**分类**：M8 UI/交互


```status
phase: merged
branch: feat/upg25
head: 62986c22
std: —
delivery_id: —
designer: 裁决=MainActivity/PhotoAskSheet 文本底色取 UiTokens、primary 保 upg40 mov_prima
dev: C 完成@2026-08-29**（feat/upg25 **62986c2** 已推 origin｜含 merge origin/main
inspector: ❌**打回@2026-08-30**：与已合 UPG-40 换肤**同文件双改**（WorkbenchPage/demo.js/MainAc
merge: ✅**已合 main @2026-08-30**（设计师 merge 8f8debd，含 2ccce25；§六 抽查通过 13 项+候选C
actor: sys04-backfill
updated_at: 2026-09-05T08:42:04
```

**状态**：🔨**设计师先行施工三实测点 @2026-08-29**（用户直令：feat/upg25 49e9760，16 文件 +77/-85；L1 46 类 323/0/0 绿+check-token-effect 过；已装 emulator-5558 待用户实测）——①chips 去▾（MainActivity chipOf 空后缀守卫+ChatChips 注释口径）②房间名下拉浮层时间行（popRow 时间列 singleLine+minEms=5+右对齐，折行点在顶栏浮层非 Vue 侧栏）③设置页三改（SettingsSheet 原生拼接段整段拆除；**顺带挖出一个真根因：MainActivity:1972 ui.openMemory 原是未注册的 Pair 丢弃表达式——UPG-05 只能靠原生拼接行的原因**，已正式注册 mcpHandlers + 新增 account.logout 桥；SettingsPage 我的记忆行/API Key 挪 AI 模型组/账号卡退出登录/右值单行 ellipsis；assets 仅 settings 页目录有差异，守住了 WebViewWarmupTest 哨兵）；**余 10 项（规范 §七 #5-#13）✅C 完成 @2026-08-29**（feat/upg25 **62986c2** 已推 origin——含 merge origin/main 2bf363a 吸收 UPG-22/23/26 等 25 提交；九项全落地：UiTokens.kt 单源/sheet 底色 s0/字号档归并/圆角并轨/裸px清零/danger 单源 tokens.js/游离紫+蓝阴影收编/顶栏 46/MemoryPage ellipsize；L1 53 类 **376/0/1跳过** --rerun-tasks 真跑 + assembleDebug 绿 + check-token-effect 过 + design_token_assert 11 组断言绿/**变异 2/2 亲杀**；报告 `程序员/交付报告/DELIVERY_UPG25_2026-08-29.md`；注记 4 条挂账候选（PhotoAsk 20dp 圆角/裸px margin/隐私页 parseColor/暗色组微差）；**待验收员 L2 真机逐页走查 + 用户三实测点复测**） ｜ 🔄**打回重修 v2 @2026-08-30**（设计师：原交付与已合 UPG-40 换肤同文件双改+全站产物碰撞无法干净合，且 13 项大多仍缺失——基于最新 main 3263f10 重切重做，保留 upg40 换肤只追加 v2 细节）→ ✅**C v2 完成 @2026-08-30**（feat/upg25-v2 **2ccce25** 已推 origin；49e9760+62986c2 重放：cherry-pick+文件级 merge-file 三方；冲突 4 文件裁决=MainActivity/PhotoAskSheet 文本底色取 UiTokens、primary 保 upg40 mov_primary 资源、WorkbenchPage/demo.js avatarBg 保 upg40 #80868F（upg40 已收编游离色）；13 项全量达标（design_token_assert 11 组断言绿+变异 2/2：M1 顶栏回 56 必红/M2 DANGER 对齐断裂必红）；L1 全量 53 类 **382/0/1跳过**（--rerun-tasks 真跑）+ assembleDebug 绿 + check-token-effect 过；Token/KV 申报不变；upg40 零回退（tokens.css 仅 .topbar 46px 一行、colors.xml/候选 C 零触碰——L3 换肤零回归留验收员）；报告 DELIVERY_UPG25v2_2026-08-30.md；已登记两个表）——待验收员 L1 复核+L2 真机 13 项对照+L3 换肤零回归【✅ L2 真机 13 项+L3 换肤零回归补验通过 @2026-08-30（21770d7d，feat/upg25-v2 2ccce25；13 项逐项截图/PIL/源码实证 + 候选C #0c0e12 在 + 品牌绿 0 像素——整单 ✅；证据 验收员\证据数据\UPG25\ + ACCEPTANCE_LOG UPG-25 v2 §5）】→ ✅**已合 main @2026-08-30**（设计师 merge 8f8debd，含 2ccce25；§六 抽查通过 13 项+候选C 换肤零回归；push origin；worktree mov-upg25v2 可收）｜ **状态标注**：✅程序员完成，待验收→ ❌**打回@2026-08-30**：与已合 UPG-40 换肤**同文件双改**（WorkbenchPage/demo.js/MainActivity/PhotoAskSheet）+**全站产物碰撞**，无法干净合入；审计（git grep 当前 main 实证）：13 项绝大多数**仍缺失**（upg40 仅覆盖颜色/token 宏层面）——重做 v2 `feat/upg25-v2`（派单 设计师/派单/UPG-25_重修_派单_2026-08-30.md）｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-29
**卡点**：已合 main @8f8debd——v1 13 项全达标+换肤零回归（遗留 3 条 P3 观察项） ｜ 

**用户实测三瑕疵（截图在案，已定位）**：
1. **chips 去 ▾**（用户：不要小三角）——MainActivity.kt:1023/1030 两处「 ▾」拼接去除，ChatChips.kt:9/57 注释口径同步；chip 可点性由气泡交互承担；
2. **房间列表时间折行**（「19:5
7」）——MainActivity.kt:4409 区人性化时间列：时间列固定宽不换行+行高固定+标题 ellipsize；
3. **设置页结构三改**：「信息管理（记忆）」原生孤立行（SettingsSheet.kt:134-150 WebView 下方拼接行）→ 移除原生段、Vue SettingsPage 分组列表加「我的记忆」行；「DeepSeek API Key」行挪进 AI 模型组；「退出登录」（SettingsSheet.kt:154-184）挪进用户账号卡；顺带修 AI 模型行右值折行（右值单行 ellipsis）。

**其余 10 项**（规范 §七 #4-#13）：sheet 底色全 s0 / 原生文本色并轨 token（建 UiTokens.kt 单源）/ 字号禁用档归并 / sheet 16+菜单 12+8f 裸 px 修 / 裸 px padding 8 处 / JS 直写 danger×6 单源 / 游离紫+蓝阴影收编 / 顶栏 56→46 统一 / MemoryPage ellipsize 补齐。

**串行**：第 1 项 chipsRow 区与 UPG-23（在施）邻接——等 UPG-23 合 main 后做或 rebase 吸收；设置页项无占用（SettingsSheet/SettingsPage 当前无在途单）。**堵点已解 @2026-08-29：UPG-23 已合 main（8af7da9），第 1 项可基于最新 main 施工**

**验收**：L1 全量绿+UiTokens 单源断言（grep 硬编码色值/9sp/半档=0 进验收脚本）；L2 真机逐页走查对照规范组件规格（13 项逐项截图）；E 面=用户三实测点复测（chips 无三角/房间列表时间不折行/设置页三改）。Token/KV 两节申报「不变」（纯 UI）。

---
# UPG-26 侧边栏品牌区换 logo+黑字 + 抽屉展开占比 61.8%
**分类**：M8 UI/交互


```status
phase: merged
branch: —
head: —
std: —
delivery_id: —
designer: 裁决]；用户确认已实现 @2026-09-02）→
dev: —
inspector: ✅ 验收通过（用户确认「已实现」）@2026-09-02（feat/sidebar-brand 7a6dff6+0fdfe87：品牌区 lo
merge: **分支未合 main（162 分叉）｜已合 main@2026-09-02（feat/sidebar-brand 7a6dff6/0fdf
actor: sys04-backfill
updated_at: 2026-09-05T08:42:04
```

**状态**：✅**程序员完成 @2026-08-29**（feat/sidebar-brand **2279f14** 已 push origin；L1 49 类 342/0/1 跳过[12306 LiveQuery] --rerun-tasks 真跑 + assembleDebug 绿 + check-token-effect 过；sync-pages --check 幂等一致；Edge 无头截图品牌区符合预期；报告 `程序员/交付报告/DELIVERY_UPG26_2026-08-29.md`；已登记两个表）→ 待验收/设计师合 main ｜ **优先级**：P1 ｜ **出单人**：用户直令（事后补登记，无方案单）｜ **日期**：2026-08-29
→ ✅ 验收通过（用户确认「已实现」）@2026-09-02（feat/sidebar-brand 7a6dff6+0fdfe87：品牌区 logo+黑字+抽屉占比——**分支未合 main（162 分叉）——已合 main@2026-09-02（feat/sidebar-brand 7a6dff6/0fdfe87 经 cherry-pick 内容级合入——2e48a0c+11f2f03+fix 链；品牌区 SidebarNav-wywgtCV-.js+抽屉 75%[MainActivity 主线裁决]；用户确认已实现 @2026-09-02）→ 审验员复核8-29「侧边栏的左上角替换掉（透明 logo+黑字），侧边栏展开占比弄到 61.8%」。

**交付两件**：
1. **品牌区**（`前端设计/mov-vue/src/components/SidebarNav.vue`）：`<span class="brand">MOV AI</span>` 绿字（--primary-text）→ 透明线稿 logo（新增 `src/assets/logo.png`，1108px 源裁边纯黑化降 64px，构建期内联 data URI 规避 sync-pages 闭包不识别 `new URL(import.meta.url)` 的已知盲区）+ 黑字（`--text`，浅色 #191b21/深色 #e4e5ea 自适应；dark 下 logo `invert(1)` 反白）；
2. **抽屉宽**（`MainActivity.kt:1225`）：`drawerWidthPx` 0.60 → **0.618**（黄金分割，用户拍板；唯一赋值点，无其他覆写路径；内层 van-popup 在独立入口已被 SidebarApp 强制 100%，实宽=原生面板宽）。

**顺带纠正**：main 页面资产漂移——UPG-05 合入的 i18n key（tabDone「已完成」等）当时未重建入产物，本单 7 页全量重建一并更新（WebViewWarmupTest 资产守卫口径=资产入库，提交后回绿）。

**无冲突声明**：与 UPG-25 在施区（chipsRow/SettingsSheet/SettingsPage）无文件重叠；不动 room.html/markstream 冻结项。

**Token 影响**：无（不触请求链路）。**KV Cache 影响**：无（请求前缀字节不变）。

**R1/R2 精修 @2026-08-29**（用户实测两轮直令，b2eb0f5 已推 origin）：R1 品牌文字 19px/700→16px/500 细排（字距 +.04em）+logo 22→30px（源升 96px PNG-8 量化 2339B 仍内联）；R2 品牌行 flex-end+line-height:1——MOV AI 字形底边与 logo 三角底边取齐（用户拍板），抽屉 0.618→**0.75**（用户拍板，原「黄金分割 61.8%」仅存活一轮即被覆盖）。emulator-5556 实装截图实证：底边对齐 ✓、实宽 810/1080=75% ✓（mov_emu_5/6.png）；L1 复跑 49 类 342/0/1 绿。

✅**已合 main @2026-08-29**（程序员代行设计师，用户授命「你就是设计师」：rebase 8af7da9——冲突仅生成物资产 hash 引用双侧重建撞车，源码零冲突，重建产物消歧 amend 后全量 **50 类 362/0/1 跳过** 绿；ff-only **0fdfe87** 已推 origin；worktree mov-sidebar 可收）。

**遗留**：深色模式 logo 反白未上机截图（规则已在产物 CSS 实证），留验收员 L2。

---
# UPG-28 obsidian.file.write 审批闸修复（isHarmless file.write 特判误捕）
**分类**：M1 安全/合规


```status
phase: merged
branch: feat/upg28
head: 443b2881
std: —
delivery_id: —
designer: ✅**方案 v1 已出 @2026-08-29**（`设计师/方案设计/UPG-28_obsidian写入审批闸修复_方案设计.md`）
dev: ✅**程序员 C 完成 @2026-08-30 01:05**（feat/upg28 **443b288** 已 push origin，基
inspector: ✅**验收员验收通过 @2026-08-30**（L1 377/0/0 亲跑+变异 M1/M2 双锚亲杀+L2 采纳模拟器证据[真机 ASK
merge: ✅**已合 main @443b288**（ff-only 已推 origin，合后全量复跑 377/0/0 绿；worktree mov-
actor: sys04-backfill
updated_at: 2026-09-05T08:42:04
```

**状态**：✅**方案 v1 已出 @2026-08-29**（`设计师/方案设计/UPG-28_obsidian写入审批闸修复_方案设计.md`）｜ ✅**程序员 C 完成 @2026-08-30 01:05**（feat/upg28 **443b288** 已 push origin，基底 main 31769a0；工单表 ROW33 认领+交付已登记）：**:161 `contains("file.write")` → `name == "file.write"` 全名精确匹配**一处判定不改名单——dsh file.write harmless 语义一字不变，obsidian.file.write 下落 writeTools 任意路径形态（相对/绝对/private）全 ASK；契约断言三形态全 ASK+dsh 同相对路径回归锚落码；L1 全量 **53 套件 377/0/0**（--rerun-tasks 真跑）+assembleDebug 绿+check-token-effect 过；**变异 M1**（改回 contains）契约断言必红+**M2**（删断言）变异下全绿——双锚亲杀成立；**L2 真机 5558**：相对路径 upg28_probe.md 调 obsidian.file.write 弹「审批请求」三键 ASK（截图在点允许前抓取）+journal `approval/asked` seq2090/seq2444+decided `allowed-once`+tool/result ok=true+vault 真实落盘 `MOV-UPG28-ASK-probe`——**挂账销项条件三项全满足**；Token/KV 两节申报「不变」；报告 `DELIVERY_UPG28_2026-08-30.md`，证据 `程序员/UPG28-evidence/`（4 截图+会话 JSONL）；**已登记两个表**）——✅**验收员验收通过 @2026-08-30**（L1 377/0/0 亲跑+变异 M1/M2 双锚亲杀+L2 采纳模拟器证据[真机 ASK 弹窗+journal asked/decided 链]，实体平板受限仅记录非缺陷）+✅**审验员审验通过 @2026-08-30**（jsonl seq2443-2446 逐环对账，见 `工单系统/审验员/工单审验状态.md`；**L2 实体平板端到端补验 ✅ @2026-08-30**——21770d7d 亲验：相对路径全 ASK 弹窗 + journal approval 链 + 审批放行后真实执行，见 ACCEPTANCE_LOG UPG-28 §3 更新）→ ✅**已合 main @443b288**（ff-only 已推 origin，合后全量复跑 377/0/0 绿；worktree mov-upg28v 可收；挂账[相对路径静默放行 P1]销项）｜ **优先级**：P1（安全面：AI 可不经审批写任意 vault 文件）｜ **出单人**：设计师 ｜ **日期**：2026-08-29

**来源**：挂账登记表「[UPG-02+04 验收附带] obsidian.file.write 相对路径静默放行不弹 ASK」（验收员 L3 补验实证：相对路径两次调用 journal 无 approval/asked，绝对路径正常弹窗）→ 设计师定夺 P1 成立转工单。

**根因（规则 20/21 溯源实物锚）**：`McpToolScheduler.kt:161` isHarmless 的 `name.contains("file.write")` 模糊匹配，把工作区路径特判（语义=dsh 工作区写 MOV 公共目录）扩散到 obsidian.file.write（实际经 ObsidianProvider 走 SAF 写用户 vault）——校验空间与写入目标张冠李戴；guard 判定顺序（:204-214）harmless 先于 writeTools，相对路径形态下 :117 的 writeTools 登记永不可达。ObsidianProvider.kt:19 自述红线「不进 harmless」被实现违反。tier 展示面无感染（permissionTier 无 args 保守回 ask）。

**定案**：改一处判定不改名单——`:161` contains → `name == "file.write"` 全名精确匹配。dsh file.write harmless 语义一字不变；obsidian.file.write 下落 writeTools → 任意路径形态（相对/绝对/private）全 ASK。不采纳 obsidian.* 前置排除（冗余，多一处镜像维护面）。

**验收**：L1 全量绿+契约断言（obsidian.file.write 三形态全 ASK + dsh file.write 回归面不动）+变异锚 M1（改回 contains 必红）/M2（删断言必红）亲杀；L2 真机复刻 `upg02_l3_probe.md` 剧本弹 ASK+journal approval/asked 事件链（=挂账销项条件原文）；通过后划销挂账 P1 条。

**防撞**：名单区（:100-138）与 UPG-22 ③（writeTools memory.save 清理，在施）邻接——本单只动 :161 判定逻辑区，同文件不同区，后合者 rebase。Token/KV 两节「不变」（审批闸行为面，不触请求链路）。

---

# UPG-44 AcceptanceJudge B1 观察层（UPG-06 批2 剩项）
**分类**：M2 体系/治理


```status
phase: merged
branch: feat/upg44
head: 122945b2
std: —
delivery_id: —
designer: 裁决criteria+AI 回复→verdict/失败静默]；**投影剔键硬红**=Surface.deriveEventMessage 显
dev: C 完成@2026-08-30 04:05**（feat/upg44 **122945b** 基底 main 3263f10 已 push；
inspector: 审验通过 → 已合 main @2026-08-30**（设计师 §六抽查 + rebase 后 ff-only **801b8fc 已推
merge: ✅**验收+审验通过 → 已合 main @2026-08-30**（设计师 §六抽查 + rebase 后 ff-only **801b8
actor: sys04-backfill
updated_at: 2026-09-05T08:42:03
```

**状态**：✅ 派单文本 已出 @2026-08-30（`设计师/派单/UPG-44_AcceptanceJudge_B1_派单_2026-08-30.md`），✅ **C 完成 @2026-08-30 04:05**（feat/upg44 **122945b** 基底 main 3263f10 已 push；接管原 03:22 认领未提交施工[用户拍板]；核心 `com.hermes.dsh.guard.AcceptanceJudge`=B1 触发[CHECK_VERBS+M1「标准应为 x」/M2「核对：x」双正则+询问豁免+诚实降级 null]+exact judge[expected 空=产出非空放行/produced≤200/fail 带 diff]；事件 acceptance/criteria+verdict 专用类型[turnId/agentId/**expected 只在 criteria**/非 ignorable/KNOWN 注册/EventCodec+SqliteStore+SessionQuery+MovQueryTools+Compaction 全链 when]；AgentLoop acceptanceJudgeOnTurnEnd[turn/end 前落=turn 包裹/未裁决 criteria+AI 回复→verdict/失败静默]；**投影剔键硬红**=Surface.deriveEventMessage 显式分支[E2E ③实证 expected 未注入：journal 仅 1 条用户消息+模型入参无 System 段]；观察层不拦截不重试；Token/KV 0/0；验证=定向 17 用例[识别 13+E2E 三点四点 3+剔键 1]+**变异 3/3 亲杀**[删识别/删 verdict 落 journal/剔键误投影] +全量 399/0/0+check-token-effect[已申报]；接管修复=M1 正则备选顺序 bug[应/应为 longest-first 防吃「为」]+Surface 显式剔键+剔键测试；报告 DELIVERY_UPG44_2026-08-30.md；已登记两个表）——待验收员：L1 复跑+变异 3/3 复验+L2 E2E 全链+L3 真机问答型对拍入 journal 可查 ｜ **优先级**：P1（防编造观察层，工作量小）｜ **出单人**：设计师 ｜ **日期**：2026-08-30｜【双实例收敛 @2026-08-30｜同代号 C 双会话并行交付等价（diff 仅 4 文件），以 feat/upg44 122945b 为准；等价副本 feat/upg44-c 0c1b23b 已 push 存档】 ｜ ✅**验收+审验通过 → 已合 main @2026-08-30**（设计师 §六抽查 + rebase 后 ff-only **801b8fc 已推 origin**；核实依据：rebase 提交与 feat/upg44 122945b 内容一致[13 文件 470+ 纯新增，零冲突]、合批全量闸 **403/0/0+1skip**[=批3 合批后 386 + UPG-44 新增 17 用例，AcceptanceJudgeAgentLoopE2ETest/AcceptanceJudgeTest 均在结果]、assembleDebug 绿、check-token-effect 过；UPG-44 无受限项，观察层 L1 覆盖——直接可合）

**来源**：UPG-06 确定性防编造三件套 批2（方案 `设计师/方案设计/UPG-06_确定性防编造三件套_方案设计.md` §十一.2 B1 定案）；**GoalGate 已销项 @2026-08-30**（§十一.1 三候选全排除，用户确认）→ 批2 剩余 AcceptanceJudge 拆出本卡。

**一句话**：问答型/核对类任务，按「用户显式指定标准」对拍——journal 本地持 expected + 投影剔键 + 对拍结果落 journal（**观察层：不拦截、不重试**，治用户感知不治模型行为）。

**施工范围**（老版 `AcceptanceJudge.java`(69行, exact equals) + `AgentLoop.java:1092-1127` 挂载点移植参考）：
1. journal 侧持 expected（用户指定标准 B1 形态落 append-only，绝不发模型）
2. 投影剔键 `projectForModel()` 剔答案键/expected（发给模型内容不变）
3. exact-equals 对拍 → pass/fail + 差异落 journal（可查）
4. 仅问答型/核对型启用（以用户显式指定标准为触发 B1）；建议/询问语句不拦（老版豁免语义保留）
5. 事件类型先入 `KNOWN_SESSION_EVENT_TYPES`（KnownEventTypes.kt）+ schema 字段齐全

**红线**：expected 绝不发模型（硬红）；不动工具注册/调用签名、execute 面不动；观察层不拦截不重试、不阻止流式上屏；事件类型先入 KNOWN_SESSION_EVENT_TYPES；Token/KV 不变，自跑 check-token-effect.mjs。

**验收**：L1 纯函数单测+变异亲杀（删剔键/删对拍落 journal 必红）+ KNOWN_SESSION_EVENT_TYPES 断言；L2 桩替 LLM（DeepSeekAdapter 返回「无 tool_call 完成声明/标准不一致」）走真实 AgentLoop 全链→对拍落 journal+expected 未注入模型上下文+session 重载可重建；L3 问答型对拍结果入 journal 可查。

**施工规矩**：认领 `worktree=mov-upg44 branch=feat/upg44`（基于最新 main 重切，规则19）；完成后登记两个表（先表后库）；报告落 `程序员/交付报告/DELIVERY_UPG44_*.md` 写明「已登记两个表」。

---

# UPG-45 审批 · Approval Capability Registry（权限能力注册表）
**分类**：M1 安全/合规


```status
phase: merged
branch: feat/upg45
head: b758b28c
std: —
delivery_id: —
designer: 🔨**已派单 @2026-08-30**（用户已转派；派单文本 `设计师/派单/UPG-45_审批_ApprovalRegistry_派单
dev: —
inspector: ✅**验收员通过 @2026-08-30**（ACCEPTANCE_LOG UPG-45，commit edf86d9）：核物[54行=as
merge: **已合 main @2026-08-31 → 审验员**（approval 体系随 UPG-58/62/63 合入；ApprovalSer
actor: sys04-backfill
updated_at: 2026-09-05T08:42:03
```

**状态**：✅ 方案 v3 定稿（`设计师\方案设计\审批弹窗_用户授权层_设计_v3_2026-08-30.md`，大神评审 8.8/10，P0 边界钉死）→ 🔨**已派单 @2026-08-30**（用户已转派；派单文本 `设计师/派单/UPG-45_审批_ApprovalRegistry_派单_2026-08-30.md`）→ ✅**C 已完成 @2026-08-30**（feat/upg45 **b758b28** 已 push origin，基底 main 8f8debd：docs/ApprovalRegistry.json+md[54 行+防御清单 21+unknown 模板+18 字段/行]；生成器=ApprovalRegistryGeneratorTest[JVM 逐名实跑 PermissionGuard.permissionTier，唯一事实源]+语义库 docs/ApprovalRegistry.semantics.json[53 行 human-authored，risk/approvalMode 由名单+校验得出，AI 不决定]+collect/verify 双脚本[盘点收集+L1 13 项独立对账]；红线全守[零运行时改动/解释不影响判定/unknown→ask+无法确定/不可逆 low 全标/payment.pay 防御在册]；L1 生成器断言+verify 13 项全绿+变异 3/3 亲杀[unknown 放宽 free 必红/reversibility 漏标生成器红(--rerun-tasks)/删行 verify 双红]+全量 56 类 404/0/0+assembleDebug 绿+check-token-effect 过；Token/KV 0/0；报告 DELIVERY_UPG45_2026-08-30.md；已登记两个表）——待验收员 L1 复核+变异 3 条+L2 真机抽样[写文件/删缓存/发消息三场景 approvalMode 一致]+L3 与 UPG-01(元数据)/UPG-06(防编造)/BP-03(权限门)语义零冲突
→ 已合 main@2026-08-31（ApprovalRegistry.json 初入 main 9c29ebb；ApprovalService.kt 0049c2b 已在 main——approval 体系随 UPG-58/62/63 演化合入；E4「待合超期」为库缺 G 段误报已消）
→ ✅ **已合 main**（核实：docs/ApprovalRegistry.json（ask20+free34）随 UPG-58/62/63 同步在 main；ApprovalService.kt 0049c2b 在 main——E4「待合超期」为库卡缺合段误报，实现早存在且演化中；⚠️ 与 UPG-68 同源（单源 ApprovalRegistry.json 白名单闸——施工勿当旧物））
｜ ✅**验收员通过 @2026-08-30**（ACCEPTANCE_LOG UPG-45，commit edf86d9）：核物[54行=ask20+free34/18字段/notInFace21/unknown模板ask+无法确定/盘点156（baseline6+sensitive11+write33+harmless25）]；verify 13/13 独立复核+L1 全量 56 类 404/0/0(+1跳过)；变异亲杀 4 条（unknown放宽free红/reversibility漏标红/删语义行红/删产物行 verify对账红）+生成器幂等（干净跑 diff 空）；L2 真机（21770d7d）：memory.delete→approval/asked+allowed-turn、obsidian.file.write→asked×2+弹窗UI捕获（允许本轮/拒绝/允许本次）点允许本次执行、notification.post→无弹窗直过（free 一致）；L3 零冲突（6 文件=测试/docs/脚本，无运行时改动）；⚠️P3：报告称语义库 53 行→实测 54 行（仅报告口径差，不阻塞）——**已合 main @2026-08-31 → 审验员**（approval 体系随 UPG-58/62/63 合入；ApprovalService 0049c2b 初入 2026-08-20 已随 main 演化）｜ **优先级**：P0 ｜ **出单人**：设计师 ｜ **日期**：2026-08-30

## 标题

把审批世界全量登记：每一处会触发审批/拦截的工具补全「事实/语义/安全/策略」字段，产出 **Approval Capability Registry**，作为下一单（语义解释器 + 四块弹窗 + 生成三级）的**唯一输入**。B 直接复用本注册表，不再重新分析工具。

## 背景

用户 + 大神评审「AI Agent 人类可读授权层」（v1 溯源 → v2 补强 → v3 架构收敛）。大神 P0：①解释失败不得影响权限判定 ②AI 不得决定安全分类（只建议）③unknown 安全默认 ask ④不可逆操作显式标注（reversibility=low）⑤risk/reversibility/sensitiveData 三维分列。**大神定调：停止继续写方案，直接做 A(Registry)→B(解释器)→C(场景矩阵)。本卡 = A。**

## 施工（照派单文本）
1. **全量盘点**：writeTools ∪ sensitiveTools ∪ isHighRisk ∪ 现有触发点；**脚本实跑 `permissionTier`/`guard` 得每工具 `approvalMode`**（不信手抄）；
2. **每工具登记字段**：tool / semanticType(intent) / action / target / scope / argsSchema / risk / reversibility / sensitiveData / recipient / quantity / humanStrategy / approvalMode / fallback / priority / audit / batchable / explanationVersion；
3. **产出** `docs/ApprovalRegistry.<md|json>` + **高频工具优先级排序**。

## 验收
- **L1**：① 全量对账（注册表⊇writeTools∪sensitiveTools∪highrisk，grep+实测不漏）② approvalMode 与实测一致（脚本断言）③ 字段完整（必填组非空）④ 未知工具→ask+「无法确定」（变异：对未知给 free/让 AI 定危险→必红）⑤ reversibility=low 全标出（删除/外发/支付不漏）。
- **L2 真机**：抽样 3 工具（写文件/删缓存/发消息）确认真实触发审批 + approvalMode 与真机弹窗一致。
- **L3**：与 UPG-01（元数据）/UPG-06（防编造）/BP-03（权限门加固）语义零冲突。Token/KV 0/0。

## 红线
1. **解释失败 ≠ 权限失败**：本单纯登记事实，**不改任何权限判定**；解释（B）只影响显示，绝不允许解释失败→默认放宽/ALLOW。
2. **AI 不决定安全分类**：risk/approvalMode 由精确名单+校验得出；未知→「无法确定此操作」。
3. **unknown→安全默认 ask** +「无法确定」兜底。
4. **不可逆（reversibility=low）** 显式标注（删除/外发/支付）。
5. 只读登记：**不动** McpToolScheduler/PermissionGuard 判定逻辑、不动工具行为/签名；三维分列不合并。

## 派单交接段
1. 开工前 `git fetch origin` + 看表（确认 UPG-01 元数据/批3 已合 main，基于最新基底）；
2. 工单表 UPG-45 备注追加 `认领: <agent> worktree=mov-upg45 branch=feat/upg45 @<时间>`；
3. 完成后登记两个表（先表后库）；报告落 `程序员\交付报告\DELIVERY_UPG45_*.md` 写明「已登记两表」，含 hash + 证据链（注册表 + 对账脚本 + 真机抽样）。

**复核锚（@届时 main）**：`AgentLoop.kt` journal 侧 + `KnownEventTypes.kt` 事件类型；老版参考 MOV-APP-old `capable/AcceptanceJudge.java` + `AgentLoop.java:1092-1127`。

---

# UPG-46 工具联动 Runtime 契约（Tool Orchestration）
**分类**：M2 体系/治理


```status
phase: merged
branch: feat/upg46
head: a8043aad
std: STD-UPG-46-v1
delivery_id: —
designer: 🔄 **用户拍板转交 @2026-09-05 02:19**（原认领程序员 Claude/wmw0027 做不了，用户指令转交）
dev: ✅**C 完成 @2026-09-05 03:02**（程序员 Kimi/kimi-cli，feat/upg46 **a8043aad**
inspector: ✅ **验收员复验通过 @2026-09-05**（§P57 落档：六件核物全在/M-cycle 锚链成立/837 差 1 双方 P3 注记
merge: ✅ **审验员确认+设计师合 main @7ccf0446**（2026-09-05：段①核心契约全链合入；段②=UPG-104） **卡点
actor: sys04-backfill
updated_at: 2026-09-05T08:42:03
```

**状态**：✅ 方案 v3 定稿（输入与MCP工具联动机制_设计_v3，冻结，大神 9.3+Trace契约）→ 🔨**已派单 @2026-08-30**（用户转派；worktree=mov-tool-orch branch=feat/tool-orch）——待程序员认领 ｜ **优先级**：P0 ｜ **出单人**：设计师 ｜ **日期**：2026-08-30 → ⚠️ **验收员 WIP 收口确认 @2026-09-04**（ACCEPTANCE_LOG §P56：bf757f9d 隔离 worktree——前置两 commit 核物[4da3b6d 死引用消灭+bf757f9d E3 nudge 强催删除 NO_CALL 合法化——Plan 层接管前置]+全量 814/0/1 亲验不破；**段①核心契约主体未完成转独立会话**[OrchPlan/两段式接线/四类阻断/Trace/D1-D5——修复路径在案]——**UPG-46=WIP 非验收通过**，段①交付后完整验收） → ✅ **验收员复验 段①通过 @2026-09-04**（ACCEPTANCE_LOG §P57：a8043aad 六件隔离 worktree[E 仓——C:7-mov 路径废弃后主仓真身确认]——全量 app **837/0/1 亲跑**[0 失败基线]+**tool-orch 101/0/0 亲跑**+**M-cycle 变异亲杀**[删 cycle 拒绝行→DagPlannerTest 红→还原]；P3：coverage 未申报+app 837 vs 836 口径注记；**段①达待合→审验员→设计师**[段② UPG-104 执行器后续单；真机 L2 随段②]） → ✅ **审验通过 @2026-09-05**（证据链全对账：STD-UPG-46-v1 重算=5038b639 ✓/DEL manifest 重算 ok:True ✓/artifact_sha 实物 APK 逐位一致 ✓/code=a8043aad=origin ✓；Trace 单写点[全仓仅两处 session.append("tool/trace")]/四类阻断/M-cycle 锚链全坐实；STD 会签已补且补后哈希不破）→ ✅ **已合 main @2026-09-05**（merge **7ccf0446** 已推 origin；⚠️ 合时 ACCEPTANCE_LOG 冲突误解向旧版致 P22–P57 共 40 段落档丢失[P1 问题区已登记]——设计师恢复性追加 **e7e0b2ed** 修复在链，162 段全量恢复逐字一致）
→ 🆕 **已认领 @2026-09-05**（程序员 Claude/wmw0027，worktree mov-upg46，branch feat/upg46，基 main 841f591d；施工：段①核心契约——Plan 协议层+两段式接线+四类阻断+Trace journal 14 字段+编排规则契约层+消灭 :349 死引用+E3 兜底语义修正；**接线豁免 2 行已裁决 A**） → 🔄 **用户拍板转交 @2026-09-05 02:19**（原认领程序员 Claude/wmw0027 做不了，用户指令转交）→ 🆕 **Kimi/kimi-cli 接手认领 @2026-09-05 02:19**（worktree mov-upg46，branch feat/upg46，基 main 841f591d；前任两预置 commit 4da3b6d0[死引用消灭]+bf757f9d[E3 NO_CALL 合法化] 保留接续——段①主体：Plan 协议层/两段式接线/四类阻断/Trace journal/编排规则契约层） → ✅**C 完成 @2026-09-05 03:02**（程序员 Kimi/kimi-cli，feat/upg46 **a8043aad** 已 push origin[bf757f9d..a8043aad]，基 main 841f591d；段①六件全交：①**Plan 协议层**[tool-orch OrchPlan/PlanValidator+DagPlanner.buildWithDependsOn 外部 dependsOn 入口（既有 build 零改动）+app OrchPlanSupport Plan JSON 解析/解析失败拒绝] ②**两段式接线**[runPreApprovalRound 结构化 Plan 优先+行格式回退共存——UPG-76/85 锚段零破坏；Plan 决策 trace 落主会话 journal traceId 绑 planId；执行侧=ToolCallScheduler→dispatch 唯一闸+PlanApprovalStore 原样，执行器属段②不越界] ③**四类阻断接生产 dispatch 前段**[ArgumentValidator 缺参/歧义/非法/超权限+McpToolScheduler.argumentValidator 可注钩子默认 null 零行为变化+schema 投影 fail-open] ④**Trace 契约落地**[journal 新事件 tool/trace 四处同改+穷尽 when 五文件补分支；traceEmitter 装配点全路径覆盖；TraceRecorder 生产实例化；14 字段实值（conversationId/turnId 原恒空串已修）；单写点 Session.append 无旁路文件无 CoT] ⑤**编排规则契约层**[OrchRule 声明式触发/优先级/互斥+OrchRuleEngine+EffectSpecRegistry 经 DagPlanner 接线；DEFAULT=空表扩张留段②] ⑥**死代码清账**[e3NudgedKeys+looksLikeToolRequest 净删 13 行+:348 孤儿注释更正]；**变异 5 锚亲杀**[M1 删循环检测→红/M2 删缺参分支→红/M3 删 journal 落点→红/M4 NO_CALL 改判→双侧红/M5 删 L2/L3 预分级支路→双侧红；定点快照还原复绿]；全量 app **836/0/1**[基线 814/0/1+新增 22 零新增失败；UPG-85 契约锚 3 例+PlanApprovalBinding 32 例回归绿]+tool-orch **101/0/0**[既有 75 零回归+新增 26]+assembleDebug 绿[APK 56716961B]；MainActivity CRLF 5692/0 纯度实测；装配点 4 处一行级注入（棘轮红线 7；结构化分派块=方法内升级提请设计师复核口径）；Token/KV 两节申报[补全轮 prompt +300 token 一次性会话/主会话前缀恒定]+check-token-effect 通过；verify-hash not-ancestor 如实申报[未合常态，合后复跑=终态]；⚠️环境注记[C 盘 0027-mov 当前被其他进程重建为无 .git 目录（02:45-02:57 非本单动作），真实仓库=E 盘 mov归档——verify-hash 经 --repo 显式指定完成]；真机 L2 转验收员持有[JVM 行为层已实证]；coverage_status=**FULL**；DEL-UPG-46-20260905-001[code=a8043aad/artifact=a94223a1/manifest_sha=b5e112b1（artifact 待填→实物回填后 deliver-gen 重产，自检 ok:True）]；报告 DELIVERY_UPG46_2026-09-05.md；**已登记两个表**）——待验收员验收（L1 复核+变异 5 锚复杀+真机 L2+合后 verify-hash 终态复核） → ✅ **验收员复验通过 @2026-09-05**（§P57 落档：六件核物全在/M-cycle 锚链成立/837 差 1 双方 P3 注记/两表登记在/交付报告在） → ✅ **审验员确认+设计师合 main @7ccf0446**（2026-09-05：段①核心契约全链合入；段②=UPG-104）
**卡点**：✅ 段①已合 main @7ccf0446——无 ｜ → 📋 **派单文已补 @2026-09-02**（`设计师/派单/UPG-46_工具联动Runtime契约_派单_2026-09-02.md`——D1-D4 判据+范围+基线+验收；**P0 可认领**：任意线先到先得） ｜ → 📝 **设计 v3.1 补丁 @2026-09-02**（Plan 模式=顺序真相层：两段式先 Plan 后执行+steps DAG+机器校验+顺序可见——用户定「plan 没做好联动必乱」；`03_工具联动/输入与MCP工具联动机制_设计_v3.1_2026-09-02.md`；并入 UPG-46 施工口径——**P0-4 三模式由 dependsOn 显式表达**） ｜ → 🔄 **瘦身重派 @2026-09-04（用户拍板「建议瘦身转派」）**：本单=段①核心契约（联动机制+Trace+接线+契约语义）；段②（六指标评测集+Safety Policy 确认门实现+多工具编排+记忆回流）→ **UPG-104**（已立卡 P2 挂单）；候选施工=Claude CLI（UPG-103 后接续） ｜ → 🔧 **派单前治理修复收口 @2026-09-05（设计师）**：①**v3 设计文本体断链**（全仓+备份归档搜索确认不存在）→ 口径重建 **v3.2**（`设计师/方案设计/03_工具联动/输入与MCP工具联动机制_设计_v3.2_2026-09-05.md`——v3.1 补丁+卡面施工 8 项+溯源复核重建，不冒充 v3 原文）②**六层溯源复核**（规则 20/21，main @841f591d 实证）：L5 tool-orch 雏形=❌孤岛（结构在零生产调用，MainActivity.kt:349-350 死引用）、**旧锚作废通报**（writeTools/harmlessTools 内联名单+toolParamSchemas 已 sunset——权限名单单源化 PermissionRegistryData）、UPG-83「受控通道」main 查无提交=未核实③**STD-UPG-46-v1 已冻结**（content_sha256=5038b639…，会签待补[approved_by 栏按 UPG-103 先例派单后补齐]）④**派单文 v2**（`设计师/派单/UPG-46_工具联动Runtime契约_派单_v2_2026-09-05.md`——分支改 feat/upg46[旧 feat/tool-orch 为历史雏形已全量在 main，占用即撞单]/基线刷新 814/0/1/已查两库无命中/红线 23·24 机制口径）——**可认领**

## 标题
把「AI 从输入走到工具执行」升级成 Tool Orchestration Runtime 契约：上下文组装四源 → Tool Decision（NO_CALL/CALL/MULTI_CALL）→ Argument Generation+Validation → Safety Policy（风险分级 L0-L3+确认门）→ 多工具编排 → Trace 可观测 → 六指标评测集。

## 施工（照设计 v3）
1. Context Assembly（系统提示/会话历史/记忆/工具Schema/胶囊偏好 四源）；
2. Tool Decision=NO_CALL/CALL/MULTI_CALL；**NO_CALL=合法决策**；
3. **Argument Validation：缺参/歧义/非法/超权限 四类阻断**；
4. Safety Policy：**Tool Risk L0-L3→确认门**；L2/L3 必进；own 分类器兜底；
5. 多工具编排 Parallel/Sequential/Conditional；
6. Tool RAG threshold=配置项（当前全量，超阈值 top-K）；
7. **Trace**：每次调用记录 traceId/conversationId/turnId/input/candidateTools/selectedDecision/selectedTool/arguments/validationResult/riskLevel/confirmationResult/executionResult/memoryCandidate/decisionReason（**结构化，非 CoT**）；
8. 评测集（典型输入→期望决策，含 NO_CALL/MULTI_CALL/边界），desc 改动回归。

## 红线
NO_CALL 合法；参数阻断四类；L2/L3 确认门；Trace 不存 CoT；记忆回流=候选（工具结果≠偏好）。

## 验收（验收标准_v3 L1）
六指标评测集（Selection/Argument/No-Call P&R/Multi-Tool/Safety Gate）+ 决策契约 + 阻断 + 确认门 + Trace 字段齐 + 回归不降。

## 派单交接段
认领 worktree=**mov-upg46** branch=**feat/upg46**（基于最新 main，开工前必 git fetch；⚠️勿用 mov-tool-orch/feat/tool-orch——历史雏形分支已全量在 main，占用即撞单）；完成后登记两个表；报告 `程序员\交付报告\DELIVERY_UPG46_*.md` 写明「已登记两表」+ hash + D1-D5 证据。**施工/交接细则以派单文 v2 为准**（`设计师/派单/UPG-46_工具联动Runtime契约_派单_v2_2026-09-05.md`；含 STD-UPG-46-v1 引用 + deliver-gen 机制产出 manifest + verify-hash 登记前校验 + 共享面影响清单）。

---

# UPG-47 主页胶囊系统（pin_type+stableId / 三区 / ＋管理弹层 / 点击分派 / 长按 / 第三态 / 气泡字数）
**分类**：M8 UI/交互


```status
phase: merged
branch: —
head: —
std: —
delivery_id: —
designer: 🔨已派单
dev: ✅C 交付 @2026-08-30（feat/capsule-system **767228c+32ba01c** push；报告 程序员/
inspector: ✅ **验收员复验 通过 @2026-09-04**（ACCEPTANCE_LOG §P54：4e5a2f7c 隔离 worktree[申报
merge: ✅后续美化已合 main @2026-08-31（dock 对齐 **afc1ccd**：＋号圆形·随胶囊横滑·气泡左对齐胶囊；管理面板设置
actor: sys04-backfill
updated_at: 2026-09-05T08:42:03
```

**状态**：✅ 方案 v3 定稿（主页胶囊系统_设计_v3+MOV设计规范§chips，冻结）→ 🔨已派单 → ✅C 交付 @2026-08-30（feat/capsule-system **767228c+32ba01c** push；报告 程序员/交付报告/交付报告_UPG47_主页胶囊系统_2026-08-30.md；证据 设计师\检查证据/UPG47_2026-08-30/4 截图；待验收员 L2 复核；【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG 见 main）：feat/upg52 06f239f 停靠 0aa0c07；三子单核物全过（状态机 PROPOSED→ACTIVE→RE_EVALUATE→ARCHIVED+canTransition/Ledger append-only+actor 权限[ai-proposal 只 PROPOSED、system-decay 只 REEVALUATED+ARCHIVED]+原子写入 sink 注入失败回滚/blockedSourceHashes 传播+purge 清空/Retrieval 加权[importance+confidence+freshness why 标注]+TOP-K+8KB 预算裁剪/门面工厂 SemanticPoolFactory 零触 memory-core）；L1=memory-os 27/0/0+app 446/0/0=473/0/0 与报告一致；变异 3/3 亲杀（M-D decay 直接 ARCHIVED→3 测试红/M-A2 purge 反向误删→红/M-B2 Timeline 失败不回滚→红）；L2 真机 21770d7d（新 APK）：Memory OS 初始化 ok log+files/memory-os/semantic/ 建立+空库零影响+memoryos.core 只读 handler 返回 {ok=true, core=（暂无已确认的记忆）}；申报差异确认合理（UI 接缝依赖 UPG-49 合流/Event Store 后置用记忆条目候选/rebase e249c61 预期平滑）→ 待设计师 rebase 合 main】；【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG ff23a88）：feat/upg51 9ca96ff 停靠 0aa0c07；五条全落核物（撤入口零 UI 残留[仅 MemoryGene 注释]/加工器/政策 V1.2 四节 5 条/三闸[协议∧开关∧blocked敏感过期]/Vue+ native 开关）；全量 66 套件 468/0/0 + 新增 11+6+2 全绿 + 变异 2/2 亲杀（去开关闸→「关闭个性化空载荷」FAILED/敏感放行→「敏感标签不传」FAILED）；模拟器干净态 L2：V1.2 弹窗强制重弹+政策全文条款+开关开↔关双向+pref.json 密文三次变化（228B）；程序员证据 3 图已核——**申报差异确认**：上传面无远端=契约面可测/生肖公历近似（P3）/敏感「不提炼不传」已同步政策一致 → 待设计师合 main】；【✅ **验收员验收通过 @2026-08-30**（ACCEPTANCE_LOG 156d055）：feat/capsule-system cf3299e+32ba01c（报告 hash 767228c 为 P3 偏差）停靠 0aa0c07；L1 全量 456/0/0（报告 462 差 6 口径 P3）+WorkbenchPins 9/0+CapsuleResolver 8/0+变异 2/2 亲杀（硬编码名→实读锚红/预设链→兜底锚红）+pin v2 三字段核物；L2 真机（21770d7d 新 APK）：三区/长按菜单/直达执行→审批链/管理弹层（▲排序/✕删除/勾选即加/5-5 上限拦截）/记忆页开页/重启保留；程序员证据 4 PNG 已核存——**P0 挂账复核：main 4bfddd8 compileDebugKotlin FAILED 确认属实**（MainActivity.kt:6707 冲突标记残留+MarkstreamView 等 unresolved）→ ✅**已合 main @2026-08-31**（设计师 merge **6b53bdd** 已推 origin；**先修主基线 4f25633**：补 UPG-46 merge 缺失 memoryApi `run{}` 右括号 + 删 6707 孤立冲突标记，main compileDebugKotlin 绿[MarkstreamView unresolved 随之解决]；merge 非 rebase（主基线已推进 4bfddd8→4f25633，capsule 停靠 0aa0c07）；**resolve renderPinChips 三冲突块取 capsule 侧**（UPG-47 定稿，弃旧 WorkbenchPins.parse/p.name 短标）；**P0 挂账[main基线编译红]销项**；worktree mov-capsule 可收）｜ **优先级**：P0 ｜ **出单人**：设计师 ｜ **日期**：2026-08-30｜ ✅后续美化已合 main @2026-08-31（dock 对齐 **afc1ccd**：＋号圆形·随胶囊横滑·气泡左对齐胶囊；管理面板设置页同款 **cda3c2a**（CapsulePanel）：白卡圆角分组·cell 行·标题居中·顶部圆弧裁出·删冗余文字·空官方分组隐藏·第三方聚合包——均已在 main） → ✅ **验收员复验 通过 @2026-09-04**（ACCEPTANCE_LOG §P54：4e5a2f7c 隔离 worktree[申报 sha 本轮唯一无误]——全量 **814/0/0 亲跑**+ChipsCapsuleSplitContractTest 5/5+**recon103 对账工具亲跑 ALL_OK**[9 块保真 norm-sha256——工具资产化亲测]；**P3×2 KNOWN GAP 在案**+**P3 UPG-103 无 STD 冻结**转设计师补冻或追认；**达待合→审验员→设计师**）

**⚠️ 换基线注记（已销 @2026-08-31）**：UPG-47 分支原停靠 0aa0c07（upg27 绿基线）；origin/main(4bfddd8) 曾编译红（6103bb8 尾部 `<<<<<<< HEAD` 未解决冲突标记 + UPG-46 merge 缺失 run{} 右括号致 MarkstreamView unresolved）。**已销**：设计师修复主基线 4f25633（补 run{} 右括号 + 删 6707 冲突标记，编译绿）→ UPG-47 以 main 基 merge 合入 6b53bdd（非 rebase，因主基线已推进），挂账销项

## 标题
主页胶囊区 = 能力快捷：内置 + 第三方 MCP 工具可单独钉成独立胶囊；「＋」就地管理；点击分派/长按菜单/工具第三态；胶囊展开字数规范。

## 施工（照设计 v3）
1. workbench_pins 加 **pin_type**（BUILTIN/MCP_TOOL）+ **pin 只存 stableId**（渲染从注册表读）；卸载/下线清理+**释额**；迁移幂等；
2. dock **三区**：常驻/钉选≤5/「＋」固定；
3. ＋**管理弹层**：「当前钉选」排序面（跨组）/分组增删/实时预览/上限/第6禁用；
4. **点击分派表**：开页/回填/输入面板；预设=钉选时选填或 inputSchema 生成；
5. **长按菜单**（直达资格=readOnlyHint/无必填参）+防误触；
6. MCP聚合空态隐藏+弹层次级入口+去「更多MCP☐」勾选；
7. 工具**第三态**（停变淡/卸移除/服务端下线变淡「不可用」）；
8. **气泡字数**（主行≤16去模式后缀/副行id中段省略）。

## 红线
workbench_pins 单写点；pin 无冗余 name/icon；卸载/下线释额；MCP聚合空态；胶囊=偏好提示（非 lock）。

## 验收（验收标准_v3 L2）
三区（钉满5横滑+＋固定）/点击分派/长按不误触/第三态/气泡字数（DeepSeek V4 · deepseek·V4 Flash）/管理弹层/数据契约（pin无冗余/单写点/迁移幂等）。

## 派单交接段
认领 worktree=mov-capsule branch=feat/capsule-system（依赖 UPG-46 Decision/Safety）；完成后登记两个表；报告 `程序员\交付报告\DELIVERY_Capsule_*.md` 写明「已登记两表」+ hash + 截图。


---

# UPG-48 Memory API 工程契约（记忆页:memory-core/memory-api 模块化）
**分类**：M6 记忆/知识


```status
phase: merged
branch: —
head: —
std: —
delivery_id: —
designer: 🔨已派单 @2026-08-30
dev: —
inspector: ❌**审验打回@2026-08-30（P1 边界违例）**｜MainActivity:582-598 直引 com.hermes.mov.m
merge: ✅**已合 main @2026-08-30**（设计师 merge 92d4c22[含 0aa0c07]，审验五步复核通过：零直触core
actor: sys04-backfill
updated_at: 2026-09-05T08:42:03
```

**状态**：✅ 方案 v3 定稿（Memory_API工程契约_v4 + 记忆页分层管理_设计_v4,冻结）→ 🔨已派单 @2026-08-30 → ❌**审验打回@2026-08-30（P1 边界违例）**——MainActivity:582-598 直引 com.hermes.mov.memory.core（MemoryStore/MemoryStatus,呈现层触 core 违反契约）+ boundary ②③ 假绿 → 待程序员修复后复验 ｜ ✅**已合 main @2026-08-30**（设计师 merge 92d4c22[含 0aa0c07]，审验五步复核通过：零直触core/门面净化/boundary②③真绿/468/0/0/变异3态；push origin；worktree mov-ai-model-ui 可收）｜ **优先级**：P0 ｜ **出单人**：设计师 ｜ **日期**：2026-08-30

## 标题
记忆页「我的记忆」底层工程契约：memory-core(MemoryStore/状态机/持久化)与 memory-api(MemoryApiService/Envelope/changes/PinnedStore)分模块;呈现层只 import  门面、零触 memory-core 内部。

## 方案要点（Memory_API工程契约_v4）
1. 模块化:memory-core / memory-api;(app 只依赖 memory-api);
2. 状态机(promote/remove/restore/setPinned × DRAFT/ACTIVE/TOMBSTONE)+ 统一 {ok,code,data,syncToken,seq} Envelope + memoryChanges 对账 + PinnedStore(stableId);
3. 验收:六指标(记忆页 L1/L2/L3)+ 契约/竞态/失败注入/迁移幂等/依赖检查。

## 审验发现（已登问题区）
- **P1 边界违例**:MainActivity:582/597/598 全限定名直引 ——呈现层触 core,违反「零触core」契约;
- **boundary ② 假绿**: 解析不存在(M3 变异仍绿);
- **boundary ③ 假绿**: 病根解析失败 + 豁免排除全部 3 个 core 文件 → 双重失效恒绿。

## 修复(打回)
MainActivity 直引 core → 改走  门面;boundary ② 路径用正确基准/③ 豁免收窄(不掩盖真实违例);修后复验 boundary 真绿 + P1 变异(M3 删直引→红);**先用 latest main merge(含 UPG-27 本体 7992904)再复验合 main**。

## 验收
依 (L1 状态机/Envelope/依赖检查;L2 真机分层/设为重要/置顶/移除撤销;L3 竞态/失败/迁移/进程恢复)。

## 派单交接段
认领 worktree=mov-memory-api branch=feat/ai-model-ui(修复后 rebase latest main);完成后登记两个表;报告  写明「已登记两表」+ hash。


---

# UPG-49 记忆页「我的记忆」UI 分层管理
**分类**：M8 UI/交互


```status
phase: merged
branch: —
head: —
std: —
delivery_id: DEL-UPG49-20260901-002
designer: ✅ 方案 v4 定稿（记忆页分层管理_设计_v4 大神 9.2 冻结）
dev: 🔨 **程序员 R2 修复交付 @2026-09-01**（feat/upg49-r2 **5640bce** 已 push origin
inspector: ✅ **审验通过 @2026-09-01**（integrity_review=confirmed：P2-1a 72px 像素实证+删📌
merge: ✅ **设计师终审合流 @2026-09-02**（B9edcc4 落档+工单库补登；2 治理项裁决见下）
actor: sys04-backfill
updated_at: 2026-09-05T08:42:03
```

**状态**：｜ **优先级**：P2｜ ✅ 方案 v4 定稿（记忆页分层管理_设计_v4 大神 9.2 冻结）→ ✅ **已合 main @2026-09-02**（feat/upg49-rb ff-only **2a13dcd** 已推 origin；3 commit 全链=1fe63ab/8968ea0/2a13dcd[第 3 commit=记忆页改半屏 Sheet·用户拍板与设置页同形态——交付报告遗漏]；**hash 漂移更正**：报告所记 9fd39b6 不存在（rebase 重写），实际链以 git 为准；合后全量 78 套件 540/0/0 + assembleDebug 绿）→ ❌ **验收员 L2 复核打回 @2026-09-01**（ACCEPTANCE_LOG UPG-49·emulator-5554 装机 2a13dcd：J1 分层/J2 设为重要/J3 置顶≤3+释额/J4 撤销链/J5 过滤/J6 详情/J9 无崩溃 过；**P1-1** 撤销窗过期条目复活[refreshUndoBar 只 clear removedAt 不同步 items，复活条目 promote/置顶假成功，底层 tombstone 正确纯 UI 态]；**P1-2** 302 条场景主线程 ANR 三连[renderAll 全量构建≈2700 View+ensureAllLoaded UI 线程同步分页]；**P2-1** 搜索命中无高亮[MemoryRows:31 注释与实现脱节]；J8 diff 滚动被 ANR 阻断随批复验；证据 验收员/证据数据/2026-09-01/UPG49/）→ ✅ **R2 复验带缺陷通过 @2026-09-01**（ACCEPTANCE_LOG §P20-R2：P1-1/P1-2 修复实证闭环[不复活+302条零ANR]+J8 滚动保持实证+全量 558/0 亲跑+变异亲杀；**P2-1a 搜索高亮 off-by-one 一行修[r.last+1]+P2-2 计数行语义回归需设计师裁决**；P3×3；建议 P2-1a 随本单修完再合）→ ✅ **R2b 复验通过 @2026-09-01**（ACCEPTANCE_LOG §P20-R2b：P2-1a off-by-one 闭环[72px 两字全亮像素实证]+删📌徽标[M-1 亲杀]+全量 559/0/1；对象=main 头 fe04668[=3751a99 patch-id 等价]；P2-2 计数语义转设计师裁决；**UPG-49 达待合状态→审验员证据链审验**）→ 🔨 **程序员 R2 修复交付 @2026-09-01**（feat/upg49-r2 **5640bce** 已 push origin；P1-1 撤销窗过期条目同步从 items 移除[MemoRows.expiredIds+undo RESTORE_EXPIRED filter，底层 tombstone 不变]；P1-2 RENDER_PAGE=60 窗口渲染+ensureAllLoadedAsync 后台全量加载+post 恢复滚动[300 条不再全量建 2700 View]；P2-1 MemoryRows.matchRanges 忽略大小写+itemView SpannableString BackgroundColorSpan(0x66FFC107) 高亮；JsonMini 排查终止性安全与 ANR 无因果；变异亲杀 2/2（过期不清 items→红 / 高亮区间取消→红）还原复绿；app 全量 --rerun-tasks BUILD SUCCESSFUL+assembleDebug 绿；**真机验证通过**（无线 adb：撤销条 5s 过期消失不复活/搜索命中两字高亮像素检测/记忆页 3 条正常渲染/数据还原）；交付报告 程序员/交付报告/DELIVERY_UPG49_R2_2026-09-01.md + manifest DEL-UPG49-20260901-001；挂账观察项 Fts5QueryEngine 302 条冷启动 ANR 旁路已登记处理中心/挂账登记表.md）→ 🔨 **程序员 R2b 回炉修复 @2026-09-01**（P2-1a 验收打回：高亮 off-by-one——`setSpan(r.first, r.last)` 把 inclusive 末索引当 exclusive end，搜「花生」2 字命中高亮带仅 36px=单字应 74px；修 `r.last + 1`；附验收定删置顶行 📌 图钉徽标[statusBadge 去 📌 前缀+状态徽标去变黄 0xFFB8860B，置顶由按钮/详情体现]；commit **3751a99** push origin；防回归锚：MemoryPageContractTest「setSpan end 必须 r.last+1」+「置顶徽标无图钉前缀/不变黄」；变异亲杀 2/2（M-1 off-by-one 倒退→8 中 1 红 / M-2 恢复📌→11 中 1 红）；全量 --rerun-tasks BUILD SUCCESSFUL+assembleDebug 绿；真机验证搜「高铁」高亮带 **70px=2 字**（修复前 36px）；新交付 **DEL-UPG49-20260901-002**（supersedes 001：code 5640bce→3751a99，001 失效）；⚠️ **共享工作区并发注意**：主工作区 HEAD 被其他会话在旧基线重建覆盖（f9cad92→2a13dcd 线），当前 HEAD 不含 R2/R2b 修复——3751a99 仍 push origin 可找回，需设计师处理分支合并/恢复）→ ✅ **审验通过 @2026-09-01**（integrity_review=confirmed：P2-1a 72px 像素实证+删📌 amber 0 像素+patch-id 等价 34293c89/全量 patch-id 一致[≈3751a99 更强]+6 条 evidence sha 逐条一致+559/0/1；机器 flag 人工裁决：benchmark_overfit=cleared[90 弱断言来自 README/logcat 描述]/chain_intact=观察项[UI 证据链 48 截图+XML+logcat]/failure_mark=cleared[FAILED 是 P1 打回证据]）→ ✅ **设计师终审合流 @2026-09-02**（B9edcc4 落档+工单库补登；2 治理项裁决见下）——**UPG-49 全链闭环【归档】**：设计 v4(9.2)→C 交付→合 main(2a13dcd)→验收打回 P1×2→R2(5640bce)→R2b(3751a99≈fe04668)→审验通过→终审合流；main 头 fe04668（=3751a99 patch-id 等价）

## 标题
「我的记忆」从平铺三行字改成**分层管理**：待确认(DRAFT)/已记住(ACTIVE)分区 + 搜索 + 设为重要/置顶/移除(+5s撤销) + 详情入口；文案去术语(待确认/已记住/设为重要/置顶/移除)。

## 施工（照设计 v4）
1. 分层：待确认/已记住 分区 + facets 计数 + 视图筛选；
2. 操作：设为重要(promote)/置顶(setPinned≤3,置顶重拉第一页)/移除(remove)+5s撤销(restore,原位,旋转不失效)；
3. 顶部：「我的记忆」+搜索(命中高亮,草稿命中自动展开)+计数行；
4. 详情留入口(内容/来源/时间/状态/置顶/移除,只读)；
5. 草稿折叠(前40字+…展开)；
6. 异常路径：晋升失败回滚+提示 / 自动晋升条目自消失(diff不丢滚动) / 无启用禁输入+引导；
7. C 端文案：待确认/已记住/设为重要/置顶/移除(无草稿/晋升/固定/删除)；
8. 接 UPG-48 memory-api 门面(memoryList/detail/promote/remove/restore/setPinned)。

## 红线
只 import memory-api 门面(零触 core)；UI 以底层返回 diff(不乐观写死)；移除只承诺「不再使用此条」。

## 验收（我的记忆_验收方案_v1 L2）
分层/设为重要移位/置顶≤3+释额/移除+5s撤销(原位·旋转不失效)/搜索高亮+草稿展开/详情/300条冷启动<2s/diff不丢滚动/无崩溃；截图+journal。

## 派单交接段
认领 worktree=mov-memory-ui branch=feat/memory-ui（依赖 UPG-48）；完成后登记两个表；报告 `程序员\交付报告\DELIVERY_MemoryUI_*.md` 写明「已登记两表」+ hash + 真机截图。

---

# UPG-50 外观·组件级显示（Display Appearance 工程契约）
**分类**：M8 UI/交互


```status
phase: merged
branch: feat/upg50
head: 8e73e8d4
std: —
delivery_id: DEL-UPG50-20260901-001
designer: 📌 **激活 @2026-09-02（用户拍板：出工单完善验收后派活）**
dev: **✅ C 交付 @2026-09-01**（branch=feat/upg50，commit ca984df+8e73e8d｜A UI 编
inspector: ✅ **阶段2 复验 带缺陷通过 @2026-09-02**（ACCEPTANCE_LOG §P25：feat/upg50-ph2 5248
merge: ✅ **阶段 1 全量已合 main @2026-09-02**（0ce0fd0 链：1A f3c0fda+1B bcb18f5+1C 1a
actor: sys04-backfill
updated_at: 2026-09-05T08:42:03
```

**状态**：✅ 方案 v3.1 定稿（`外观_组件级显示_设计_v3-1`,大神 9.0+3P0+状态矩阵）→ ✅ **大神评审闭环（9.7/10 接近冻结）+ 设计终态 @2026-09-02**（v3.1 机制+v4.2/v5.0/v2.1 体系+选择页 v1.2 三审——合并发送版 `01_外观外观UI组件体系_合并发送版_2026-09-02.md`）→ 📌 **激活 @2026-09-02（用户拍板：出工单完善验收后派活）**——**STD-UPG50-v1 冻结**（`处理中心验收标准冻结区UPG-50STD-UPG50-v1_2026-09-02.md`：L1-1~7+L2-1~7+L3+M-U50-1~5 变异亲杀+测试匹配档+红线）｜ 派单文本 `设计师派单UPG-50_外观组件库_激活派单_2026-09-02.md`（**阶段0 = A UI 编号建库[20条·UI-<部位>-<组件>范式，基准 01_外观UI组件编号库_v1_2026-09-02.md] + B 安全打样[UI-CHAT-INPUT 单实例3形态]**；MCP上架/全量=后续单；排版可调层[字号三档/字族/字重]已入 00_令牌与组件MOV设计规范_v2.1 §九——先Token标准后用，与组件形态正交）｜ → ✅ **已合 main @2026-09-01**（feat/upg50 ff-only **ca984df+8e73e8d** 已推；设计核查通过：契约/测试/证据/申报核验一致；**P2-1 带缺陷**:classic vs capsule 视觉近似[composer 高 115px 圆角钳制]——数据层正确+已申报，挂账待修） ⚠️ **P2-1 挂账**（挂账登记表：classic/capsule 视觉可辨性=composer 增高或 classic 圆角调小[≤57.5px]） → 🆕 ****1A+1B 已合 main @2026-09-02**（feat/upg50-ph1 rebase main 后 ff——0bc37f7 已推；净差=1A f3c0fda+1B bcb18f5+验收注记；51449d3 语义已去重[bb1e6d7/e988ad6]；P2-A/B=1C 闭环项）+ 阶段 1 激活 @2026-09-02（用户拍板「下一阶段开始」）**——**全量铺开**：20 条×75 形态档（）+ STD 增补（L1-11~14/L2-8~10/M-U50-8~9）+ 派单（——1A 机制/1B 高频/1C 余下 12 条分批）；📌 待派单可认领（程序员）｜ **优先级**：P2 ｜ **出单人**：设计师 ｜ **日期**：2026-08-30
→ ✅ **阶段2 已合 main @2026-09-02（P2-A2 修复后 ff——70cacf0；categories.json 补 ui.listComponents 收尾缺口；审验 integrity=confirmed 达待合）**
→ ✅ **阶段 1 全量已合 main @2026-09-02**（0ce0fd0 链：1A f3c0fda+1B bcb18f5+1C 1aa7344[cherry-pick]+验收落档 P21/P22/P23；基线全绿 compileDebugKotlin ✓；混线分离三裁决落地；⚠️ 挂账 2：①1C sidebar 产物待 sync-pages 重建[vite 环境缺——SidebarNav.vue 已含 1C 源码]②manifest 治理[E-001~005 指纹等]）→ 📌 **阶段 2 已派 @2026-09-02**（MCP 组件注册制开放——Catalog 20 条+Registry 四态+上架绑定+Contract Validation；依据 Registration v2.1+STD 阶段 2 增补（L2-11/12+M-U50-10/11）；派单 `设计师/派单/UPG-50_阶段2_MCP组件注册制开放_派单_2026-09-02.md`；feat/upg50-ph2 待认领——A 线收尾后可领）→ ✅ **阶段 2 已交付 @2026-09-02**（P2 实施：P0 核心 5 项全交付——Catalog 20 条+Registry 四态+上架绑定+Contract Validation+ID 永不复用；L2-11/L2-12/M-U50-10/M-U50-11 判据达成+变异亲杀 3 锚[install 校验/ID 作废/fail-closed]+真机 MARKET_UI_NOT_REGISTERED 实证；全量回归绿+assembleDebug；交付报告 `工单流转中心/验收/UPG50阶段2/阶段2_MCP组件注册制开放_交付报告_2026-09-02.md`；挂账 2=①第三方 catalog 登记/作废集仅内存态[持久化缺口，需阶段 3]②第三方成功注册真机端到端需阶段 3 上传流程；**待设计师合 main**）

**✅ C 交付 @2026-09-01**（branch=feat/upg50，commit ca984df+8e73e8d——A UI 编号建库 20 条机器校验 + B UI-CHAT-INPUT 单实例三形态打样[AppearanceProfile 唯一真相/Resolver/持久化/选择页/单部位]；L1 专项 31 用例全绿 + **L2 真机 7/7**（列表/选中即替换/✓●/明暗/持久化/折叠/render-only）+ **L3 端到端**（选胶囊→输入框胶囊→重启保持→选回经典→回经典真删）+ M-U50-1~7 变异锚 + 全量 590/0 绿；**真机踩坑修复**=ART regex 转义[getProfile 空档根因]+选择页主题按钮失同步[MutationObserver]；已知限制=classic≈capsule 视觉近似[composer 矮被圆角钳制]→申报）——→ **待验收员验收**（交付不自行合 main；报告 `程序员/交付报告/DELIVERY_UPG50_2026-09-01.md`，证据 `0027-mov/upg50_screens/`，工单表已同步 DEL-UPG50-20260901-001） → ✅ **验收员 1B 复验 带缺陷通过 @2026-09-01**（ACCEPTANCE_LOG §P21：全量 604/1sentinel 亲跑一致+manifest_sha 审验.py 口径复现+三态截图真实性像素复核+L2-10 明暗 17% 实证；P2-A L2-9 2/3[WORKBENCH-CARD 挪 1C]+P2-B pressed 截图与 default 一致[视觉疑点]设计师裁决；混线 51449d3 归属待确认；→ 审验员→设计师合 main；1C 未开工） → ✅ **设计师三裁决采纳 @2026-09-01**（1B 带缺陷通过维持/P2-A·B=1C 闭环项；混线 51449d3 分离独立合 main **bb1e6d7**[验收员内容级复核无损]；rebase 后审验对账=patch-id 等价口径[§P21 注记 288700b]；→ 审验员） → ✅ **1C 复验 带缺陷通过 @2026-09-01**（ACCEPTANCE_LOG §P23：0d6df7f 12 组件 L2-9 逐条+P2-A WORKBENCH-CARD 闭环[阴影像素复核]+P2-B pressed 4 族锚采信闭环[对照截图 P3 补]+tokens 覆盖修复 3 处+Market 白名单缺口自纠；全量 606/0/1 亲跑；manifest 一致；**阶段 1（1A/1B/1C）全部达待合→审验员→设计师**；历史 manifest 遗留建议挂账治理） → ✅ **阶段2 复验 带缺陷通过 @2026-09-02**（ACCEPTANCE_LOG §P25：feat/upg50-ph2 5248def 核心五项[Catalog/Registry/上架绑定 fail-closed/九字段/ID 永不复用]代码+真机 20 条 catalogId 实证+前置 P2-1 修复在场[classic 16dp]；**P2 CI 门禁断链**[collect 前置未挂 test 依赖→干净环境必红]+**申报口径失实[报 603/0 实 631/1]——计数纪律第三现**；达待合→审验员→设计师）

**✅ C 阶段1 交付 @2026-09-02**（branch=feat/upg50-ph1，基线 main 8e73e8d）
- **1A 机制扩展**（commit `57b8091`）：全组件规格表 20 条×52 档机器校验 + Resolver 全组件解析 + 4 族状态矩阵单源 + AppearanceProfile 组件级 default + `ui.setVariant` 单实例路由 + 选择页全组件化（L1-11~14 + L2-8 真机 + M-U50-8/9 变异亲杀 + 全量 603 绿）→ 报告 `程序员/交付报告/DELIVERY_UPG50_PH1_1A_2026-09-02.md`
- **1B 高频视觉**（commit `176606d`，本次交付，待验收）：CHAT 家族 BUBBLE/SEND/ICON-MIC + SETTINGS 家族 INPUT/ROW/TOGGLE/HEADER 形式落地（**L2-9** CHAT-BUBBLE standard/mono/bubble 三态即时重渲染 + SETTINGS-ROW standard/card 前后截图对照实证；**L2-10** 明暗×default/pressed/disabled 六截图无崩溃无错色；SETTINGS-TOGGLE/HEADER/SEND/MIC 同链路即时变补充实证；WORKBENCH-CARD 申报 1C；SETTINGS-INPUT 无实例申报；WebViewWarmupTest sentinel 排除[CRLF 噪声]）→ 报告 `程序员/交付报告/DELIVERY_UPG50_PH1_1B_2026-09-02.md`，证据 `0027-mov/upg50_screens/`
- **1C 余下组件**（commit `0d6df7f`，本次交付，待验收）：SIDE（HEADER 2/ROOM 3/TOOL 2）+ WORKBENCH（ROW 3/CARD 3）+ MARKET（CARD 3/LIST 2）+ ASSETS（CARD 3/LIST 2）+ SHEET（HEADER 2/BODY 3）+ COMMON-EMPTY 2 共 12 组件形式落地（**L2-9** 逐条双态切换实证：8 组件截图+computed style、4 组件离屏 WebView 以 DOM class 实证）+ **P2-A** WORKBENCH-CARD L2-9 第三件证据闭环 + **P2-B** pressed 4 族矩阵（行/列表灰底 · 卡片下压 scale(.98) · 弹层行灰底 · 按钮/图标降透明 opacity(.7)）+ 全量 **606/0/0** → 报告 `程序员/交付报告/DELIVERY_UPG50_PH1_1C_2026-09-02.md`，证据 `0027-mov/upg50_screens/`

## 标题
外观 = 组件级显示（单套组件结构,极简=显示偏好·功能不变,无两套UI）+ 全局极简偏好（主页右上角钮）。v3.1 = Display Appearance 工程契约（覆盖清除=A/形态ID规范/配置数据结构/状态矩阵）。

## 核心方案要点
1. 极简形态集 = 「减装饰不减信号」三问准入（认得出/能操作/状态看得见）；
2. 全局/组件优先级 = 干脆派（全局极简 ON 清 componentOverride=null;OFF 经典默认）；
3. 形态 ID 规范（input.classic/capsule/underline → appearance-input-*）+ APPEARANCE_MAP 配置表；
4. 数据结构：AppearanceProfile{globalMinimal, components{input,button,capsule,workspace}};globalMinimal=true 忽略 components;DisplayAppearanceResolver 算最终类→DOM;
5. 明暗（颜色 token）× 形态（形状/密度）正交;
6. 状态矩阵验收（每形态 Default/Hover/Pressed/Focus/Error/Disabled,Focus 必须一眼可辨）。

## 实施（推进时按此）
Route：极简钮 → 全局状态切换 → AppearanceResolver → 输入框（classic/capsule/underline 3形态）→ 明/暗×3 → Focus/Error/Disabled → 持久化 → 再扩 按钮/胶囊/工作台。第一阶段=全局极简+输入框3形态+Light/Dark+状态+持久化。

## 验收
依 v3-1 §七（L1 数据结构/Resolver/全局极简清A;L2 状态矩阵+可用性;L3 形态单源/最终类逻辑层/纯显示层/明暗×形态正交）。

## 派单交接段
（挂单,未派单;推进时按设计 v3-1 实施,认领 worktree 视推进定）

---

# UPG-51 用户画像标签池（Memory OS 商用投影 + 合规）
**分类**：M6 记忆/知识


```status
phase: merged
branch: feat/upg51
head: 9ca96ff3
std: —
delivery_id: —
designer: ✅ 方案 v1（设计详设已补，并入 **`Memory_OS_完整设计_v2`** 附录「Commercial Projection」；定位
dev: **✅ C 交付 @2026-08-31**（worktree=mov-upg51 branch=feat/upg51，commit 见报告
inspector: 审验通过 → 已合 main @2026-08-31**（设计师：ACCEPTANCE_LOG ff23a88 落档 + 查验
merge: ✅**验收+审验通过 → 已合 main @2026-08-31**（设计师：ACCEPTANCE_LOG ff23a88 落档 + 查验独
actor: sys04-backfill
updated_at: 2026-09-05T08:42:03
```

**状态**：✅ 方案 v1（设计详设已补，并入 **`Memory_OS_完整设计_v2`** 附录「Commercial Projection」；定位=Semantic 商业投影层[非新记忆层]，复用 P0-3/P0-5+权限隔离，合规五道闸；**验收方案已跟进**(附录 C6：L1/L2/L3+变异锚+Token/隐私申报+通过标准+落点)）→ 🔨 **已出派单文本**（需求/范围/验收/变异锚），**P0 先行可派单**（标签池结构+显式输入+合规闸门+用户画像入口，**不依赖 Semantic**；阶段二接 Semantic 自动抽取投影）｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31
**⚠️ 2026-08-31 设计重构（淘宝式 · 用户拍板）**：用户画像**不设独立入口/词表手选**——改为**首启协议授权下记忆加工+个性化推荐（挂 UPG-11 首启隐私政策）**：①撤 ProfileSheet/ProfileDims/「用户画像」入口 ②记忆本地加工偏好标签（星座/生肖=生日推算；饮食/消费/偏好=记忆归纳；无感不弹确认）③UPG-11 协议补「信息加工用于个性化推荐」④协议授权下把**去标识标签**用于推荐/分组（只传标签不传原文·敏感不碰）⑤「关闭个性化」开关。

**✅ C 交付 @2026-08-31**（worktree=mov-upg51 branch=feat/upg51，commit 见报告；全量 468/0 + 变异亲杀 4/4[L1②③④⑤] + 真机 L2[V1.2 协议弹窗/同意/加工 derived=1/设置行「个性化推荐 开启」] + 模拟器 L2[点击开启↔关闭联动/回显]）——→ 待验收员 L2 复核（报告 程序员/交付报告/DELIVERY_UPG51_协议授权记忆加工个性化推荐.md；证据 设计师\检查证据/UPG51_2026-08-31/）｜ ✅**验收+审验通过 → 已合 main @2026-08-31**（设计师：ACCEPTANCE_LOG ff23a88 落档 + 查验独立复核通过；**§六 合前抽查**=三闸 viewOf/uploadPayload 无 id 无原文/敏感 FORBIDDEN 整条跳过/PrivacyGate V2 键 亲核源码通过+证据落盘时间戳链吻合；rebase main 后 ff-only **e249c61** 已推 origin[feat/upg51-rb 同推]；**合流修复 c63ac33**[main 前置 d256ed0 localStorage 占位与 9ca96ff native 真实现双存语义冲突→裁决状态唯一源=native，SettingsPage 受控绑定+sync-pages 先清后放重建 7 页产物]；**BP-03 合前抽查补缺 185e0d9**[personalization.setEnabled 写类漏登记 writeTools→else 静默 ALLOW 陷阱：补登记+三级分诊锚]；语义条目 e249c61[UPG-45 审批语义库全覆盖]；**合后全量 68 套件 479/0/0+1跳过 --rerun-tasks 亲跑绿 + assembleDebug 绿**；worktree mov-upg51 可收；程序员列已补登、工单表已同步[备份 工单表_backup_合main_UPG-51_2026-08-31.xlsx]）

## 标题
把 Memory OS 已确认的用户认知，投影成**结构化商用画像标签池**（星座/MBTI/生肖/饮食/消费/生活场景），供营销分组/个性化推荐/文案调性，作**商业数据资产**。

## 核心方案要点
1. 定位 = Memory OS **Semantic 层商业投影**：派生、确认后形成、可删；复用 P0-3 + P0-5 + 权限隔离；
2. 标签池结构：`维度×值×来源(显式输入|AI候选+确认)×置信度×时变`；星座/生肖=IDENTITY(不变)、饮食/消费=PREFERENCE/STATE(会变)、MBTI=显式测试/确认(不从对话硬猜)；
3. 抽取：AI/行为推断=**候选**，用户确认才沉淀为商用标签；**绝不自动打**性向/宗教/政治/健康标；
4. 商用 API 只暴露 `consent=yes && 用户未关闭 && 非敏感 && 经确认` 的标签；**聚合/去标识**，不对外针对个人全量画像；
5. **合规五道闸**：①分级(一般=星座/生肖/饮食·可商用；敏感单独同意=MBTI 类；**绝不碰**=性向/宗教/政治/健康) ②授权(明示+主动勾选/敏感单独同意/最小化+**拒绝≠功能降级**[PIPL 第24条]) ③用户权利(查看/更正/关闭单个/关闭全部/删号) ④脱敏+**权限隔离**(商用侧只看授权的结构化标签投影，**碰不到记忆原文/Timeline/完整语义**——"AI 懂你"认知库不得当广告数据外泄) ⑤安全(Keystore AES-GCM·本地优先·第三方仅合规 SDK·未成年不收集)。

## 依赖/前置
依赖 Memory OS **Semantic 层**(记忆池确认后形成)+Memory API 门面；Semantic 未落地/无已确认语义 = 不产生商用标签(空池=零行为,安全)。复用 P0-3/P0-5。

## 实施
①标签池结构+抽投影 ②商用投影 API(聚合/去标识/权限隔离) ③合规闸门(五道闸) ④设置页「用户画像」入口(查/改/关/删)。依赖 **Semantic 先行或并行**。

## 验收
**L1**：①标签池结构(维度/值/来源/置信度/时变) ②来源合规(AI/推断=候选、确认才沉淀) ③敏感级(性向/宗教/政治/健康 不采集不改) ④权限隔离(商用侧读不到记忆原文/Timeline) ⑤关闭单个标签→立即从商用投影剔除(不复活) ⑥"关闭个性化"→不再收集；删号→彻底删除 ⑦聚合/去标识。
**L2 真机**：设置页「用户画像」可见/可改/可关单个/可关全部；某星座标签用于推荐→用户关闭后立即不参与；删号后画像清零；MBTI 走显式测试+单独同意；拒绝个性化不降级。
**L3**：标签池=Semantic 派生投影(一致性)；权限隔离架构；P0-3/P0-5 复用；五道闸可测。
> 测试方案·变异锚：①AI 自动打敏感标→必红 ②商用 API 曝记忆原文/Timeline→必红 ③关闭/删除后标签复活→必红 ④未确认 AI 推断直接入商用→必红 ⑤敏感项未单独同意即采集→必红。真机：查/改/关/删/删号全链路截图。

## 交付物
标签池结构 + 商用投影 API + 合规闸门 + 设置页「用户画像」入口。

## 关联
`Memory_OS_完整设计_v2`(Semantic 层)· Memory API 契约 v4 · **P0-3/P0-5** · 需求来自「MOV 用户画像标签池」项目记忆(商用+合规)。

## 派单交接段
（详设已并入 `Memory_OS_完整设计_v2` 附录「Commercial Projection」；**P0 部分可先行派单**——标签池结构+显式输入+合规五道闸+用户画像入口，不依赖 Semantic；认领 worktree 视推进定；**阶段二**接 Semantic 自动抽取投影）

---

# UPG-52 Memory OS 生命链（Semantic 池子 + 生命周期 + Timeline + Retrieval + blockedSourceHashes）
**分类**：M6 记忆/知识


```status
phase: merged
branch: feat/upg52
head: 06f239f3
std: —
delivery_id: —
designer: ✅ 方案定稿（设计依据＝`Memory_OS_完整设计_v2`，唯一口径；含验收方案）
dev: ✅**C 完成 @2026-08-31**（认领 C worktree=mov-upg52 branch=feat/upg52，**52-1
inspector: ✅**审验通过 @2026-08-31**（独立 L2 模拟器复验：memory-os 目录建立/logcat 逐字吻合/空库零影响/4 只
merge: ✅**已合 main @2026-08-31**（设计师：§六抽查=actor 模型[AI 只 PROPOSED]/blockedSourc
actor: sys04-backfill
updated_at: 2026-09-05T08:42:03
```

**状态**：✅ 方案定稿（设计依据＝`Memory_OS_完整设计_v2`，唯一口径；含验收方案）→ 🔨 **已出派单文本**（需求/范围/验收/变异锚/Token·隐私申报），**可认领**（体量大，实施建议拆子单：①池子+生命周期 ②Timeline ③Retrieval+Core ④blockedSourceHashes，先 ①）｜ **优先级**：P0 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31
｜ ✅**C 完成 @2026-08-31**（认领 C worktree=mov-upg52 branch=feat/upg52，**52-1+52-2+52-3 一单全交**：feat/upg52 **06f239f**；memory-os 27 用例[生命周期/账本/检索/原子/boundary/主链集成]+变异 6/6[purge/AI 越权/原子回滚/预算/Decay/隔离]+全量 493/0[程序员树]；报告 程序员/DELIVERY_UPG52_MemoryOS生命链.md）→ ✅**验收通过 @2026-08-31**（ACCEPTANCE_LOG 34c20ef：三子单核物+473/0/0+变异3亲杀[decay/purge/原子回滚]+真机 init 与 memoryos.core 实证）→ ✅**审验通过 @2026-08-31**（独立 L2 模拟器复验：memory-os 目录建立/logcat 逐字吻合/空库零影响/4 只读 handler 8389 Bearer 全验证/devRun 主链回放 proposed→accepted→diagnosed→resolved→retrieveHits=1→timeline 4 事件/sem-07b06d05e094.md frontmatter 权威+_index.json 153B/ledger append-only system-decay 只写 REEVALUATED=Decay≠Truth 坐实；P3×2 确认[账本用例口径 7 实 8/purge 反向断言 M-A2 红]；顺带销 UPG-47 P0 主基线挂账[4f25633 真销独立复核]）→ ✅**已合 main @2026-08-31**（设计师：§六抽查=actor 模型[AI 只 PROPOSED]/blockedSourceHashes 脱离注入面/boundary 隔离锚/devRun 写链回放 **BP-03 补登记 writeTools+分诊锚+语义条目 402510d**[8389 curl 验证通道不受影响]；rebase 解冲突 3 文件[tool-orch+memory-os 并存]后 **402510d** 已推 origin[feat/upg52-rb 同推]；registry 生成物同步 969bb56；**合后 :app:testDebugUnitTest 68 套件 479/0/0+1跳过 + :memory-os:test 6 套件 27/0/0 双任务绿**+assembleDebug 绿；worktree mov-upg52 可收；工单表已登记[备份 工单表_backup_合main_UPG-52_2026-08-31.xlsx，顺带修复行42 验收员列 emoji 截断损坏]）

## 标题
把统一记忆系统「生命链」跑通（Memory OS 落地序①）：`Event→Episodic→Candidate→Semantic→Re-evaluate→Archive→Timeline`，让「AI 懂你」成立。契约 v4(Episodic 门面)已有，本单在其上实现 Semantic 层 + 生命周期 + Timeline 记账 + Retrieval 消费 + 删除复活屏蔽。

## 核心方案要点（详见 Memory_OS_完整设计_v2）
1. **Semantic 层(池子)**：PoolDocument(MD 分篇)+PoolEntry(条目,sourIds/sourceHashes)+frontmatter 权威/_index.json 派生+`POOL_FULL_INJECT_THRESHOLD=8KB`；晋升「移入记忆库→PENDING_POOL→采纳→IN_POOL」；AI 禁凭空加(UPG-06)；进池负向清单+时变；删除传播=不自动删池(sourceIds 引用+RE-EVALUATE)。
2. **生命周期**：Entity 增 memoryType/decayPolicy；freshness 运行时派生；条目三态 ACTIVE/RE-EVALUATE/ARCHIVED；冲突在入池时(同类型互斥→RE-EVALUATE)；Decay≠Truth(只产候 nie,非直接 ARCHIVED)；last_verified 兜底。
3. **Timeline 底座**：MemoryTimelineEntry(……,actor,reason,previousMemoryId,correlationId)；只 CREATE/APPEND/READ(无 update/delete,连 dev)；actor 审计(AI 只 PROPOSED)；Correction 追加；purge；原子写入(Semantic 变⇒同事务 append)；管辖=Semantic 层。
4. **Retrieval**：MemoryCore(高速只读投影,规则选条目拼接)+Index(派生)+Router(intent→层,默认 Core+Semantic)+Retrieval(只读 Top-K)+Composer(带来源,预算 Runtime 控)；评分=Relevance×Importance×Confidence×Freshness×ContextMatch。
5. **blockedSourceHashes**：移除⇒记录⇒候选生成/Pattern Detection 过滤其派生——结构保证「删掉的不回来」。

## 依赖 / 前置
Memory API 契约 v4(已有)；LLM 通道(草案/Core)；设计=Memory_OS_完整设计_v2。

## 实施（建议拆子单，①先行）
①池子+生命周期（Semantic 层+三态+冲突+Decay≠Truth）②Timeline（不可变+actor+原子写入）③Retrieval+Core（投影+Top-K+预算）④blockedSourceHashes（删除复活屏蔽）。

## 验收
**L1**（契约 A~E 全+变异锚全绿）：删除复活屏蔽 A1-A4 / Timeline 不可变+管辖 B1-B5 / 检索消费 C1-C6 / 生命周期 D1-D6 / 三层隔离 E1-E4。
**L2 真机 8 路径**：看剧→Event→Episodic；重复偏好→候选→采纳→关于我.md；旧偏好→◌→[是|不是]→更新|保历史；记忆时间线只读；「按我习惯拆项目」→上下文少而准·可解释；「去年我喜欢什么」→历史信道；分清「我的记忆↔记忆库」·UI 无数字；空库零影响。
**L3**：三层隔离(memory-api 零改)/Semantic 只读/Event append-only/Timeline 仅 append/Index·Core 派生一致/原子写入一致——契约测试全绿。

## 测试方案 · 变异锚
①删后重复同源行为→候选复活→必红 ②AI 写 Semantic→必红 ③ai-proposal 写 ACCEPTED→必红 ④曝 timeline.update/delete→必红 ⑤Semantic 变忘 append Timeline→必红 ⑥超预算注入→必红 ⑦LLM 自由造短语写 Core→必红 ⑧冲突条目仍注入→必红 ⑨同类型互斥不标 RE-EVALUATE→必红。全量单测绿+assembleDebug 绿+真机装。

## 交付物
Semantic 层+生命周期+Timeline+Retrieval+blockedSourceHashes（Memory_OS_完整设计_v2 落地）。

## 关联
`Memory_OS_完整设计_v2`(唯一口径)｜Memory API 契约 v4｜UPG-48/49｜P0-1~P0-5(事实认知分离/历史不可变/AI 无权改/检索只读/删除不复活)。

## 派单交接段
（已出派单文本；认领 worktree 视推进定，建议先 ①池子+生命周期；完成后登记两表+交付报告 DELIVERY_MEMOSER_*.md）

---

# UPG-53 安全体验优化改造（该守才守 · 守得舒服）
**分类**：M1 安全/合规


```status
phase: merged
branch: feat/upg53
head: a6653492
std: —
delivery_id: —
designer: ✅ 方案 v1（依据 安全体系_设计_v2.1 §5.3 + mov_安全体验_demo.html；体验优化设计+验收标准已写入文档）
dev: ✅**C 完成 @2026-08-31**（feat/upg53 **a665349** 已提交 3 commit[d434ab1 8场景落
inspector: ✅**验收员通过+审验通过 @2026-08-31**（L1 66 套件 473/0/0 独立重跑+变异 3/3[V3/V4a/V7]+L2
merge: ✅**已合 main @2026-08-31**（设计师：§六抽查=豁免链 gate 永不豁免写入侧已拦/vault.delete·cred
actor: sys04-backfill
updated_at: 2026-09-05T08:42:03
```

**状态**：✅ 方案 v1（依据 安全体系_设计_v2.1 §5.3 + mov_安全体验_demo.html；体验优化设计+验收标准已写入文档）→ 🔨 **C 已认领 @2026-08-31（worktree=mov-upg53 branch=feat/upg53，开工基线 main ff23a88）**（派单文本在 `设计师/派单/` 未落盘，范围/验收以工单卡 + 方案 §5.3 为准施工）→ ✅**C 完成 @2026-08-31**（feat/upg53 **a665349** 已提交 3 commit[d434ab1 8场景落地→9a37b32 测试修复→a665349 锚补强]，基底 main ff23a88；**八场景全交付**：①free 级恒 ALLOW 契约锚 ②ask/gate 全集大白话映射补齐+**安全缺口闭合**[vault.delete/vault.credDelete 原落 else→free AI 免审批删凭据→补入 writeTools] ③拒绝 toast 人话+拒绝不降级契约 ④**InfoVault tombstone 5s 撤销**+vault.restore 新工具[harmless 免弹；凭据删除立即无撤销；窗口内再删只保最近一次；时钟注入可测]+HostToolMetaB2 登记 118→119 ⑤加密失败文案人话化 ⑥设置页安全状态行[Vue+zh/en i18n+vite build+sync-pages 77 文件幂等] ⑦**持久化同类记住**[ApprovalRemember 纯函数 canRemember 拦 gate 级+prefs mov_security 事实源+ApprovalService.rememberedCheck 豁免链 turn→goal→remembered→弹窗+新 outcome allowed-remembered+调度白名单放行+弹窗记住复选 gate 级不展示] ⑧permissionTier 万次<500ms 锚；L1 全量 **66 类 473/0/1**（--rerun-tasks 真跑）+**变异 10/10 亲杀**[V1 harmless 废/V2 人话删/V3 拒绝静默放行/V4a cred 进 tomb/V4b 窗口 500s/V5 技术串/V6 删状态行/V7 豁免链删/V8 sleep/V9 白名单缺 REMEMBERED]+assembleDebug 绿+check-token-effect 过；Token/KV 申报=AI 面 +vault.restore ≈+70B/轮+MCP tools/list +0.4KB/次（不入 prompt）+KV 新增 prefs mov_security（≤100 项）；**L2 真机 21770d7d**：vault.delete ASK 大白话弹窗全要素截图（AI 想帮你删除一个保险柜条目+30s 倒计时+同意/拒绝+同类同意+记住此偏好行）E2_ask_vault_delete.png+记住勾选后 E2_ask_remember_checked.png+journal vault.set/delete 全链——**受限申报**：共用设备互踩[被并行会话覆盖安装/切 never 模式/杀进程]致「记住→免弹」闭环运行时观察被污染不申报（L1 V7/V9 亲杀背书留验收员复验）、设置页齿轮 WebView 内 aria-label 不暴露致场景 6 截图未完成（V6 源码锚已亲杀）、5s 窗口短于 AI 轮次时延（窗口语义由时钟注入测试全覆盖）；**演示数据已还原**[prefs 测试文件已删/mobile 字段已空]；**卡外挂账 3 条已登处理中心**[dispatch 白名单缺 allowed-goal P1/vault.set·credSet 免审批写入 P1/turn 豁免 blast radius 观察]；报告 `DELIVERY_UPG53_2026-08-31.md`；**已登记两个表**）——✅**验收员通过+审验通过 @2026-08-31**（L1 66 套件 473/0/0 独立重跑+变异 3/3[V3/V4a/V7]+L2 模拟器十图全要素/免弹/拒绝语义/TOOL_NOT_FOUND+卡外 3 项挂账实测确认；**审验新发现 vault.get 伪放行 P1 登问题区不阻塞**）→ ✅**已合 main @2026-08-31**（设计师：§六抽查=豁免链 gate 永不豁免写入侧已拦/vault.delete·credDelete 补登记 writeTools[BP-03 正向应用]/vault.restore 可逆免弹语义/vault.get handler 本单零改动[P1=新豁免链×既有 fail-closed handler 集成不一致，定夺修法② UI 禁用豁免勾选→转 UPG-61]；rebase main 16baca3 后 ff-only **2780961** 已推 origin[feat/upg53-rb 同推]；**rebase 补齐大白话映射哨兵拦截的 UPG-51/52 工具文案 2780961**[场景2 全覆盖断言有效实证]；合后全量 **70 套件 495/0/0+1跳过** 亲跑绿+assembleDebug 绿；worktree mov-upg53 可收）｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
把现网安全（permissionTier/审批弹窗/审批模式/审计）按**用户体验优化改造**：该守才守·守得舒服·可控·不吓人——free 零打扰 / ask 一次大白话(同类记住+30s) / 拒绝不降级 / 可逆5s撤·吊销立即 / 异常人话提示 / 安全状态一屏(不主动弹) / 越用越顺 / 毫秒不阻塞。

## 范围（8 场景）见派单文本；验收见 安全体系_设计_v2.1 §5.3（L1 变异锚×8 + L2 真机 8 场景 + L3 契约）。

## 派单交接段
（详设=安全体系_设计_v2.1 §5.3 + mov_安全体验_demo.html；已出派单文本；认领 worktree=mov-upg53 branch=feat/upg53；完成后登记两表 + 交付报告 DELIVERY_UPG53_*.md）

---

# UPG-54 安全中心（设置 -> 安全 二级 · 等级仪表盘 + 分组策略 + 硬边界）
**分类**：M1 安全/合规


```status
phase: merged
branch: feat/upg54
head: 9911e670
std: —
delivery_id: —
designer: ✅ 方案 v2（依据 安全中心_设计_v2 + 安全体系_设计_v2.1；评审通过·有条件冻结｜等级=结果仪表盘/策略摘要/分组/审计系统级
dev: ✅**C 完成 @2026-08-31**（feat/upg54 **9911e67** 已 push origin 3 commit[47
inspector: ✅**验收通过+审验通过 @2026-08-31**（8 项核物+482/0/0+变异 W1/W8/W5 三杀+模拟器仪表盘/实时刷新/足迹
merge: ✅**已合 main @2026-08-31**（设计师：§六抽查=SecurityCenter 等级结果仪表盘无 setGrade API
actor: sys04-backfill
updated_at: 2026-09-05T08:42:03
```

**状态**：✅ 方案 v2（依据 安全中心_设计_v2 + 安全体系_设计_v2.1；评审通过·有条件冻结——等级=结果仪表盘/策略摘要/分组/审计系统级/敏感查看时显
→ ✅**验收通过+审验通过 @2026-08-31**（8 项核物+482/0/0+变异 W1/W8/W5 三杀+模拟器仪表盘/实时刷新/足迹投影/单源转调；**审验亮点=AI 侧改审批模式被 systemBaselineDeny gate 拦实测坐实**[用户可改 AI 不可改双保险]；P3×2 不阻塞[W5 锚标号申报差异/VaultPage 注释夸大]）→ ✅**已合 main @2026-08-31**（设计师：§六抽查=SecurityCenter 等级结果仪表盘无 setGrade API/hardBoundaryMin max 兜底/SecurityProfile 无 audit 字段 亲核 ✓；rebase 跳过 upg53 重复三提交+解 SettingsSheet allowedPrefixes 并集[personalization+security]+SettingsPage 安全中心 CSS 与账号资料 CSS 并存+产物重建 sync-pages 幂等+registry 生成物同步；**rebase 中场景 2 大白话全覆盖断言哨兵再次有效**；合后全量 **71 套件 504/0/0+1跳过** 亲跑绿+assembleDebug 绿；ff-only **8bcc167** 已推 origin[feat/upg54-rb 同推]；worktree mov-upg54 可收；工单表已登记[备份 工单表_backup_合main_UPG54_2026-08-31.xlsx]）示/同步!=对外/硬边界含安全控制/体验等级打扰度/默认档+onboarding联合；验收标准已全覆盖 §六）→ 🔨 **已出派单文本**（L1 变异锚×9 + L2 真机×10 + L3）→ 🔨 **C 已认领 @2026-08-31（worktree=mov-upg54 branch=feat/upg54，UPG-53 后串行施工）**——同注：派单文本未落盘，范围/验收以工单卡 + 安全中心_设计_v2 §六为准 → ✅**C 完成 @2026-08-31**（feat/upg54 **9911e67** 已 push origin 3 commit[47ef8c1 主体→68a3a59 锚8强化→9911e67 证据]，基底 **feat/upg53 a665349**——合并顺序声明：53 先合 main、54 rebase 后 ff；**8 项全交付**：①「安全」入口 ②两栏等级仪表盘+策略摘要（SecurityCenter 纯函数：6 策略 SecurityProfile+计分制+**max(用户,硬边界B) 兜底**+体验等级=打扰度映射；**无直接调级 API**——锚①反射扫描）③🔒加密知情行（UPG-53 状态行迁入仪表盘）④操作保护 4 行（审批模式=**security.setApprovalMode 单源转调 approval.setMode/setPermissionMode** 硬边界锚④/敏感确认+第三方访问=现网语义只读展示/记住偏好 switch→prefs UPG-53 单源）⑤数据保护 3 行（**数据足迹=审计投影查看** 最近 20 条审批决策+凭据读取+外发——锚⑤ profile 无 audit 字段不可关/敏感显示切换→vault 页消费 always_hidden 拦查看+view_30s 30s 自动重新掩码/数据同步本机+加密同步诚实空态——锚⑦同步≠对外）⑥硬边界 5 徽章含安全控制 ⑦等级聚合契约；security.* 桥 6 个+SettingsSheet/VaultSheet 白名单；**L1 全量 67 类 482/0/1**（--rerun-tasks）+**变异 4/4 亲杀**[W1 setGrade API/W3 audit 字段/W5 打扰度映射/W8 兜底源码锚]+assembleDebug 绿+check-token-effect 过+**Token/KV 申报 0**（security.* 页面桥不入 AI 面不进 HostToolMeta）；ApprovalRegistry 同步[collect 164 工具+semantics security.* 6 条——实跑 gate=security.set* 撞 systemBaselineDeny 底线护栏纵深增益已申报+行数快照 45-68]；**L2 桥注入态 UI 走查 3 图全过**[一级安全行/二级仪表盘 A/A+摘要+硬边界 5 徽章/足迹展开 2 行——伪造 MovPageBridge 契约一致]——**真机端到端受限申报**：平板 21770d7d 断连+5554 损坏+AVD 超时，native 二级页实操/策略切换实时刷新/30s 掩码留验收员补验；report `DELIVERY_UPG54_2026-08-31.md`；**已登记两个表**）——待验收员 L1 复跑+变异抽杀（建议 W1/W5/W8）+**真机补验**（设置→安全实操/足迹/vault 30s）+L3 聚合契约 ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
设置页「审批模式」升级为「安全」入口 -> 安全中心二级：顶部 安全等级/体验等级(结果仪表盘·非控制器) + 当前策略摘要 + 分组策略(操作保护/数据保护) + 硬边界(凭据/资金/绝密/安全控制 恒最严不可调) + 等级聚合 max(用户,硬边界)。

## 范围（8 项）
见派单文本：①安全入口 ②两栏+摘要 ③安全状态一屏 ④操作保护(审批/敏感确认/第三方工具访问/记住偏好) ⑤数据保护(数据足迹=查看>/敏感=查看时30s/数据同步本机) ⑥硬边界(含安全控制) ⑦等级聚合(结果型·max兜底·体验=打扰度)。

## 验收（安全中心 v2 §六）
L1 变异锚×9 / L2 真机×10(含不诱发全放开·默认档不打扰) / L3 等级聚合契约·硬边界max·审计强制·同步对外独立防线。

## 派单交接段
（详设=安全中心_设计_v2 + 安全体系_设计_v2.1；已出派单文本；认领 worktree=mov-upg54 branch=feat/upg54；完成后登记两表 + 交付报告 DELIVERY_UPG54_*.md）

---

# UPG-55 我的资产（资产管理项注册体系 · 基于安全体系 v2.1）
**分类**：M7 用户资产/数据资产

→ ⚠️**设计六轮收敛 @2026-09-01｜ ✅**合规三件补交 @2026-09-01（验收打回后设计师动作）**：①**STD-UPG55-v1 冻结**（处理中心/验收标准冻结区/UPG-55/，content_sha256 75aec218…）②**delivery_id 绑定**（DEL-UPG55-20260901-001：code=e1f241e+artifact=189c8b0f+evidence_manifest=125b8586 三重 hash，manifest 落处理中心/delivery_UPG55_manifest.json）③**能力护栏裁决**（PARTIAL+coverage_decision 六字段——设计师方案设计/07_资产/UPG55_共享面影响清单与护栏裁决_2026-09-01.md；uncovered 三项+risk 中+merge_decision=允许合 main 带三前置）→ ✅**验收通过+审验通过 @2026-09-01**（九项核物+L1 75/0/0[AssetFrameworksTest 8/0]+app 540/0/1+变异 M55-1~5 复杀 5/5[全部还原零残留]+J-3 P2 修复坐实[ID_SET 逐条/HASH 逐条/fail-closed[暂缺]]+J-6 真脱敏+J-9 拒写引导+红线适配[WebViewWarmup exclude assets+sync-pages assets 入口]；P3×3 不阻塞[app 层 J-9 无自动化测试/R55-1~7 真机受限/工单表 ParseError]）→ ✅**已合 main @2026-09-01**（§六抽查=verify 逐条对账+MANIFEST_REJECTED fail-closed 亲核✓；rebase 后 ff-only **61b2b87** 已推 origin[feat/upg55-rb 同推]；**合规三件套兑现**：STD-UPG55-v1[content_sha256 75aec218]+delivery_id 002[R1 后旧 001 失效按红线 23 新建：code=30c0d4b[暂缺]+manifest=dd456ce4]+护栏裁决 PARTIAL 六字段；合后全量绿 亲跑；R55-1~7 待真机恢复补验；worktree mov-upg55 可收）→ ⏳**67-B/C 随 MCP 生态推进（用户拍板 @2026-09-01：配合 MCP 工具接入才有效果，不急）**——67-A 框架已就位（资产/凭据/迁移全链），衣柜换装/照片增强等 MCP 接入需求出现时再拆派；本单当前状态=「框架就位·等生态填充」（L1 判据按 STD 冻结版；P2/P3 三项挂账转 R1 修复后重验；R55-1~7 真机恢复后补）（用户+大神联合拍板）**：v2.3/v2.4 治理层（Asset Access Contract/Trust Level/Egress 分级/grantId-auditId）经评审判定**规模错配**（企业级多租户架构≠本地个人资产管理——「三个类目十层安全闸」vs 真实威胁模型三句话），**整体移除归档**（v2.4 文件保留作评审演进史，触发条件出现时捞回评估）；**v3 收敛版为唯一施工口径**（07_资产/我的资产_资产管理项_设计_v3_收敛版_2026-09-01.md）：安全边界三句话[密钥不可导出/凭据 only-once/数据不出设备]+保留骨架[kind×securityClass 解耦/密文零迁移+hash 三等式/老入口只读快照]+**衣柜 MCP 就绪度确认为 TOP 依赖**（精力投向修正）；UPG-62 焦点修复与 UPG-61 语义不受影响

```status
phase: merged
branch: feat/upg55
head: 30c0d4b0
std: —
delivery_id: —
designer: ✅**三轮评审采纳升 v2.2 工程冻结版 @2026-09-01**（评分 架构 9.2/安全 8.8/迁移 8.2/UI 9.1/工程
dev: ✅**C 完成 @2026-09-01**（feat/upg55 **e1f241e** 已 push；[67-A 框架+迁移] ①Asse
inspector: 📌 **登记丢失补录 @2026-09-02（验收员盘点发现）**：git 实证 61b2b87/27a744d/c8033b6 均已在
merge: 已合 main@2026-09-01（e1f241e）｜无遗留卡点 ｜
actor: sys04-backfill
updated_at: 2026-09-05T08:42:02
```

**状态**：✅ 方案 v1（依据 我的资产_资产管理项_设计_v1 + **安全体系_设计_v2.1**（已定稿·SecurityGate/Gatekeeper/KMS）；原「我的资产」挂账转工单——安全体系前置已解）→ 🔨 **已出派单文本**（AssetKind 注册制 + 公共资产模型 + 首批 3 管理项 + 安全接入），待派单 → ✅**设计 v2 定稿 @2026-08-31**（`设计师\方案设计\07_资产\我的资产_资产管理项_设计_v2_2026-08-31.md`：v1 架构不变，v2 新增界面与交互设计[资产首页类目卡片/凭据类目页按平台分组+证件照管理子页签+到期提醒]/vault→credential 迁移方案细化[原子切换+30 天回滚窗口+幂等]/安全体系 v2.1 衔接落定[KMS/Gatekeeper/SecurityGate]/施工三批拆分[67-A 框架迁移/67-B 衣柜换装/67-C 照片增强]；用户确认方向「想法特别好」）→ 📌 **可认领（设计 v3 收敛版定稿 @2026-09-01）**——**验收方案已出**：（L1 机器 J-1~J-9[含迁移三等式/egress guard/老入口只读 v3 新增判据]+变异锚 M55-1~5+L2 真机 R55-1~7[含 UPG-62 回归锚]+里程碑判据；67-B/C 随批补）——验收员按此查账 → ✅**三轮评审采纳升 v2.2 工程冻结版 @2026-09-01**（评分 架构 9.2/安全 8.8/迁移 8.2/UI 9.1/工程 8.7，**67-A 可开工**；P0×3 钉死：①KMS 迁移双路径[密文零迁移首选·VaultKeystoreCrypto 与 KMS KeyVault 同源同型实证@VaultKeystoreCrypto.kt:16-28]②Migration Manifest 三等式全量校验[COUNT/ID_SET/HASH——抽样解密降级为功能验证]③证件照=picture kind+credential securityClass[类型与敏感级解耦]；顺手×2[EffectSpec 六动作粒度+AssetKind lifecycle 四态]；设计哲学显式声明 kind 决定是什么/securityClass 决定多敏感；→ ✅**C 完成 @2026-09-01**（feat/upg55 **e1f241e** 已 push；[67-A 框架+迁移] ①AssetKind Registry 注册制+公共资产模型（kind×securityClass 解耦/每类 securityPolicy 独立/治理 require 断言 M55-3）②vault→credential 迁移器（密文零迁移+三等式 COUNT/ID_SET/HASH Manifest 全量校验[P0-2]+declaredCount 计数分离[遍历丢条即红 M55-1]+幂等续跑 exists 跳过+原子切换旧存储保留 30 天不删源）③egress guard（网络端点拦截/本地放行·全部类目统一过）④资产页 AssetsSheet+asset.* 桥（catalog registry 注入/credentials 脱敏投影/credPeek=复用 vault.get only-once 弹窗 UPG-61 语义审计一致）+Vue AssetsPage（类目卡 3 张+凭据平台分组 toggle+证件照子页签「同等安全等级」+衣柜灰显「即将上线」+settings 入口接线）⑤老入口 vault.set 迁移完成后拒写引导（J-9）；**KMS 兼容性核对通过**=VaultKeystoreCrypto 即密钥层不建抽象层（准入核对 @16-28）；**L1** tool-orch AssetFrameworksTest 8/8+app 全量 --rerun-tasks 绿+assembleDebug 绿；**变异 M55-3 实杀 1/1**（删治理 require→J1 红 7 绿）+M55-1/2/4 测试内嵌负路径；红线适配：WebViewWarmupTest exclude **assets**（sync-pages 受控通道声明）+sync-pages 加 assets 入口；**R55-1~7 真机未验**（虚拟机指令+设备不可用）留验收员补验；报告 `DELIVERY_UPG55_2026-09-01.md`；已登记两个表）——待验收：L1 J-1~J-9 复跑+变异重杀（M55-3）+**真机 R55-1~7**（含 UPG-62 回归锚）+L3（管理项隔离/Gatekeeper/SecurityGate 统一/迁移幂等） ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-09-01 → 📌 **登记丢失补录 @2026-09-02（验收员盘点发现）**：git 实证 61b2b87/27a744d/c8033b6 均已在 main（合 main 属实）+ACCEPTANCE_LOG §P19→P19-R1→P19-R1b 验收链完整（R1b 通过@2026-09-01）——工单表 UPG-55 行验收员/合main 列登记曾丢失，已按 ACCEPTANCE_LOG 锚补录；**遗留维持**：L2 真机 R55-1~7 待真机恢复补验+DEL-002 绑定待设计师
**卡点**：已合 main @2026-09-01（e1f241e）——无遗留卡点 ｜ 

## 标题
「我的资产」= 按类目的**资产管理项注册体系**：每类独立管理项(存储/元数据/UI/操作/规则/securityPolicy·接入安全体系)，可扩展(含 MCP 注册)；原「信息库」降为 credential 管理项；承载「能力→资产→商业」。

## 范围
①「我的资产」入口→ AssetKind 管理项列表 ②**AssetKind Registry 注册制** + **公共资产模型**(asset_id/kind/created/updated/owner/content_hash/provenance/refs/permissions) ③首批管理项：credential(原信息库·加密+默拒MCP+精确授权)/picture/wardrobe(衣物·衣柜·换装MCP接入) ④扩展(二期):video/music/article/avatar ⑤安全接入：每类 securityPolicy(加密/敏感级/权限/MCP范围/审计)走 SecurityGate；MCP 写资产走 Gatekeeper+白名单(wardrobe可·credential拒) ⑥文件+元数据；字段级 sensitive；FTS 分级。

## 验收
L1：①注册制(新增类不影响其它) ②公共资产模型字段 ③每类 securityPolicy 独立(变异:一类弱安全=红) ④credential 加密+默拒MCP(变异:凭据可被MCP读=红) ⑤MCP写资产门控(wardrobe可/credential拒) ⑥refs 跨类引用(衣物→人像) ⑦迁移兼容(Vault→credential)。
L2 真机：我的资产入口；图片网格/看大图；衣物换装(连MCP)；凭据加密填充；各管理项规则不同。
L3：管理项隔离；Gatekeeper 门控；SecurityGate 统一；迁移幂等。

## 派单交接段
（详设=我的资产_资产管理项_设计_v1 + 安全体系_设计_v2.1；已出派单文本；认领 worktree=mov-upg55 branch=feat/upg55；完成后登记两表 + 交付报告 DELIVERY_UPG55_*.md）

---

# UPG-56 评测集盘点与 fixture 版本机制（改造计划第一阶段①⑤）
**分类**：M2 体系/治理


```status
phase: merged
branch: feat/upg56
head: cc86fac4
std: —
delivery_id: —
designer: ✅ 方案定稿（依据 `工单方案\工单方案\改造计划+验收标准_合并版_AHE×EvoC2F_2026-08-31.md` v1.4 上篇 §
dev: ✅**C 完成 @2026-08-31**（feat/upg56 **cc86fac** 已 push origin[1ed70a2 主体+
inspector: 【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG c25aacf）：feat/upg56 cc86fac
merge: ✅**审验通过+已合 main @2026-08-31**（审验 33→34：盘点报告 6 节 12 条修正口径[实测 12 条非 13]+
actor: sys04-backfill
updated_at: 2026-09-05T08:42:02
```

**状态**：✅ 方案定稿（依据 `工单方案\工单方案\改造计划+验收标准_合并版_AHE×EvoC2F_2026-08-31.md` v1.4 上篇 §1.4/§八①⑤ + 下篇 Z-1/Z-3/Z-4/A2-3；源码锚 @main 402510d）→ 🔨 **可认领** → 🔨 **C 已认领 @2026-08-31（worktree=mov-upg56 branch=feat/upg56，基线 main 8bcc167）** → ✅**C 完成 @2026-08-31**（feat/upg56 **cc86fac** 已 push origin[1ed70a2 主体+registry 同步]；四项全落地：①盘点报告 `docs/eval_inventory_UPG56.md`——**规模修正口径：实测 12 条**（工单卡 13 条为估计，盘点价值实证）+确定性声明 EvalStabilityTest 10 次重跑六指标全等 60 断言+orchestrate 零 LLM 源码锚+方差方法论保留+≥40 条扩充认领卡[B 线反哺 ≥10+人工 28·owner=程序员 C·排期 UPG-58 前]②EvalFixture 版本化 VERSION=1.0.0+VERSION_HISTORY+EvalFixtureVersionGuard fail-closed（版本不一致抛 ISE=旧 baseline 作废——变异 U56-V1 降级语义 2 红实证）③Z-3 坏改动集 `docs/z3_bad_changes_UPG56.md` 5 条+预期 delta 方向预登记（防事后拟合·执行待 UPG-60 M-1）④Z-4 卡含于报告 §五；L1 tool-orch 全绿+app 519/0/1；红线自查：不改门阈值/fail-closed 锚/模型假设注释；报告 DELIVERY_UPG56_2026-08-31.md；**已登记两个表**）——待验收；【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG c25aacf）：feat/upg56 cc86fac 基底 8bcc167；盘点报告（实测 12 条口径修正+确定性声明 10 次重跑六指标全等+零 LLM/零 suspend 锚+方差方法论保留）；EvalFixture.VERSION=1.0.0+VERSION_HISTORY+EvalFixtureVersionGuard fail-closed（ISE=旧 baseline 作废非降级告警+模型假设注释）；Z-3 坏改动集 5 条+预期 delta 方向预登记防拟合+使用纪律；tool-orch 全绿+app 71 类 504/0/0+变异 U56-V1 双红复杀（fail-closed 失效→2 红）→ 待审验员合 main】员：盘点口径复核（12 条修正）+fail-closed 语义+Z-3 预登记完整性 → ✅**审验通过+已合 main @2026-08-31**（审验 33→34：盘点报告 6 节 12 条修正口径[实测 12 条非 13]+EvalFixtureVersionGuard fail-closed+EvalStabilityTest 10 次全等+Z-3 五条预登记；变异 U56-V1 复杀 2 红；§六抽查=VersionGuard 抛 IllegalStateException 含模型假设注释行 亲核✓；rebase 后 ff-only **9c29ebb** 已推 origin[feat/upg56-rb 同推]；合后 app+tool-orch 全量绿 亲跑；**fixture VERSION=1.0.0 机制在 main——UPG-60 门 2 前置就绪**）｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
评测集盘点报告 + fixture 版本化机制 + ≥40 条扩充认领——门 2 判定粒度与门 1 切换时点的数据地基。

## 背景
合并版下篇 Z-1：确定性项已实证结案（`orchestrate` 纯函数 @`tool-orch/.../ToolOrchestrator.kt`，零 LLM 调用，无 run-to-run 方差）；现状 EvalFixture 13 条（@`EvalFixture.kt:102+`）；baseline 五元含 eval_fixture_version（合并版上篇 A-1）。

## 施工范围
① 盘点报告落档：规模（13 条现状+扩充计划）/确定性声明（纯函数实证引用）/方差方法论保留声明（LLM 实调态启用）② fixture 版本化：EvalFixture 增版本常量+变更即升版纪律（进 baseline 五元，变更触发 baseline 失效）③ ≥40 条扩充认领卡：来源拆分（B 线反哺 X 条[UPG-59 产出]+人工撰写 Y 条）、owner、排期 ④ Z-3 坏改动集预构造（3-5 个已知必回归改动，**预期方向先登记后执行**——供 UPG-60 元验证 M-1）。

## 验收
**Z-1（按 v1.1 修订：确定性声明+1 次复核）/ Z-3 / Z-4**。判据细节=合并版下篇 §一。

## 红线
- 盘点报告不改门阈值——阈值参数修订走验收标准升版流程（§十）
- fixture 版本变更必须触发 baseline 失效（fail-closed）
- `<!-- 本组件编码的模型假设：当前 fixture 全 mock，假设「管线逻辑回归可独立于模型行为面成立」；LLM 实调态引入时本假设失效需重检 -->`

## 派单交接段
认领 worktree=mov-upg56 branch=feat/upg56；依赖：无（可立即开工）；下游：UPG-58（五元 fixture version）/UPG-60（坏改动集）；完成后登记两个表（先表后库：工单表.xlsx 本行程序员列 ✅+备注分支/hash/报告名，工单库.md 本卡状态同步）+ 报告落 `程序员\交付报告\DELIVERY_UPG56_*.md` + 报告内声明「已登记两个表」。

---

# UPG-57 Evolution Ledger 骨架（改造计划第一阶段②）
**分类**：M2 体系/治理


```status
phase: merged
branch: feat/upg57
head: fbcdd64a
std: —
delivery_id: —
designer: ✅ 方案定稿（依据 合并版上篇 §6.1/§6.5 + 下篇 X-1/M-6；**架构约束=复用 TimelineLedger 基础设施，禁
dev: ✅**C 完成 @2026-08-31**（feat/upg57 **f4bae35** 已 push origin[Evolution L
inspector: 【✅ **修复复验通过 @2026-08-31**（R1｜ACCEPTANCE_LOG 04fb19f）：feat/upg57 **fbcd
merge: ✅**R1 复验通过+审验通过+已合 main @2026-08-31**（审验 33→34：NS_EVOLUTION 12 事件+ACTO
actor: sys04-backfill
updated_at: 2026-09-05T08:42:02
```

**状态**：｜ **优先级**：P1｜ ✅ 方案定稿（依据 合并版上篇 §6.1/§6.5 + 下篇 X-1/M-6；**架构约束=复用 TimelineLedger 基础设施，禁第二套账本**[大神四轮 P0-③]) → 🔨 **可认领** → 🔨 **C 已认领 @2026-08-31（worktree=mov-upg57 branch=feat/upg57，基线 main 8bcc167）** → ✅**C 完成 @2026-08-31**（feat/upg57 **f4bae35** 已 push origin[Evolution Ledger 主体+registry 同步 173]；**五项施工范围全交付**：①TimelineLedger 泛化——memory namespace 一字不动+`evolution.*` 12 事件类型（前缀消解与 memory ACCEPTED/REJECTED 重名）+`ACTOR_ALLOWED_EVOLUTION`（**M-6 同构：ai-proposal 只 evolution.CHANGE_PROPOSED**+新增 system-deriver 派生面）+actorAllowed namespace 分流②`EvolutionDeriver` 八字段 payload[changeId/baseline/change/evaluation/decision/lifecycle/rollback/evidence]+deriveProposals **幂等**（同 changeId 去重）+appendLifecycleEvent 幂等跳过③**X-1③ 单查询** explain 一次调用完整归因（当前生命周期+决策+评测结论+回滚+事件链+证据指针）+lifecycleOf④测试 EvolutionLedgerTest 8 用例[复用纪律反射锚无 update-delete/evolution 走同一物理账本/M-6 越权拒+memory 语义回归锚/派生幂等/X-1② 完整链双条 STABLE+ROLLED_BACK append-only 不破/X-1③ 单查询全要素/未入流 subject 返 null 不编造]⑤registry 同步 173 工具面；**变异 U57-V1** actor 权限失效（恒放行）→M6+X1-2 双红；memory-os 全绿 7 类 34/0/0+app 全绿；**红线自查**：禁第二套账本（Deriver=TimelineLedger 读写视图）/append-only 反射锚/模型假设注释=无（账本模型无关，MODEL_UPGRADE_RECHECK 事件类型已备=X-2 机制存在）；报告 DELIVERY_UPG57_2026-08-31.md；**已登记两个表**）——待验收；【⛔ **验收员打回 @2026-08-31**（P1 交付不完整——ACCEPTANCE_LOG c25aacf）：f4bae35 的 **TimelineLedger.kt 零改动**（最后修改=287f9e7 upg52）——commit message 申报的「泛化 evolution.* 12 事件+ACTOR_ALLOWED_EVOLUTION+actorAllowed namespace 分流」未随 push 入库；**验收员实测 EvolutionLedgerTest 5/8 红**（M6 越权/X1-2 完整链/同账本/X1-3 单查询/派生幂等——根因=ACTOR_ALLOWED 不认 evolution.* → ai-proposal append 被 require 拒 → 派生全链不通）；申报「memory-os 34/0/0」与远端实测不符（本地存在未 push 改动）。Deriver 本体完整（幂等 derive/appendLifecycleEvent/explain 返 null 不编造/lifecycleOf）——只差 ledger 泛化落地。**打回要求**：①补 push TimelineLedger 泛化（EVOLUTION 表 user 全量/ai-proposal 只 CHANGE_PROPOSED/system-deriver 派生面+前缀分流+memory 原语义一字不动+12 事件注册）②远端重跑 evolution 测试 8/8 绿+memory 回归锚全绿 ③rebase 最新 main（59 已合 4b5f65f）后申报复验】→ ✅**R1 复验通过+审验通过+已合 main @2026-08-31**（审验 33→34：NS_EVOLUTION 12 事件+ACTOR_ALLOWED_EVOLUTION 与合并版 §6.1 逐条一致+EvolutionDeriver 173 行八字段幂等+单查询+memory namespace 一字不动；变异 U57-V1 复杀 5 红与打回前同构；§六抽查亲核通过；**Evolution Ledger 骨架在 main——UPG-58 Manifest 派生器前置就绪**）
**卡点**：验收打回·回炉——Evolution Ledger 骨架修 ｜ 
【✅ **修复复验通过 @2026-08-31**（R1——ACCEPTANCE_LOG 04fb19f）：feat/upg57 **fbcdd64**（rebase 4b5f65f+补泛化入库；程序员诚实申报打回根因=「变异还原误杀同文件未提交泛化」——与 54 xlsx 教训同款并存记忆）；TimelineLedger 泛化核物（NS_EVOLUTION+EVOLUTION_EVENT_TYPES 12 事件前缀消解重名/ACTOR_ALLOWED_EVOLUTION user 全量·ai-proposal 只 CHANGE_PROPOSED M-6 同构·system-deriver 派生面/actorAllowed 前缀分流+memory 原表一字不动）；memory-os **34/0/0**（EvolutionLedgerTest **7/0**——打回前 5 红全消）+app **73 套件 519/0/0**；变异 U57-V1 复杀（分流失效）→ **5 红**与打回前实测完全同构=锚决定性 → 待审验员合 main（56 同批）】→ 🔨**C R1 修复 @2026-08-31**（feat/upg57 **fbcdd64** 已 push origin[rebase main 4b5f65f 后 force-push 重放]；**打回三条全闭合**：①泛化已入库——EVOLUTION_EVENT_TYPES 12 事件+ACTOR_ALLOWED_EVOLUTION M-6 同构+actorAllowed 分流重放（git show HEAD 锚 5 处+远端 ls-remote fbcdd64 实证含泛化）②EvolutionLedgerTest **7/7 绿**+memory-os **34/0**（7 类）+memory 回归锚全绿③rebase main 4b5f65f（59 合入链）完成；**三模块全量 --rerun-tasks**：app 73 类 519/0/1+memory-os 34/0/0+tool-orch 14/0/0；**打回根因在案（教训）**：U57-V1 变异亲杀后 `git checkout TimelineLedger.kt` 还原变异时将同文件未提交泛化一并还原——变异与交付改动同文件未隔离；教训=变异还原前先 commit 交付态或按 hunk 还原；**已登记两个表**）——待复验（L1 复跑+泛化入库核对+X-1③ 单查询体验） ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
Evolution Ledger 最小骨架：TimelineLedger 复用扩展 evolution.* namespace + 八字段派生版 + 单查询验证。

## 背景
四条改造线的生命周期事件散落五处（Manifest/journal/Memory/trace/git），缺统一事件链回答「一次能力为什么从 A 版本变成 B 版本」。架构约束：**共用 TimelineLedger**（append-only/actor 权限/查询全复用，@`memory-os/.../TimelineLedger.kt`），只新增 evolution.* namespace——禁独立 EvolutionLedger 类。第一版八字段（changeId/baseline/change/evaluation/decision/lifecycle/rollback/evidence）从 A-1 脚本输出+git 记录派生。

## 施工范围
① TimelineLedger 泛化：namespace 维度（memory.*/evolution.*/audit.*）+ evolution.* 事件类型（CHANGE_PROPOSED/BASELINE_CAPTURED/CHANGE_APPLIED/REGRESSION_EVALUATED/ACCEPTED/REJECTED/SHADOW/CANARY/STABLE/DEGRADED/ROLLED_BACK/MODEL_UPGRADE_RECHECK）② actor 权限映射（AI 只 PROPOSED 同构——M-6）③ 八字段派生器（git log+Manifest 输出→Ledger 事件，幂等）④ 单查询验证工具（一查回答「此技能为何 shadow」，X-1③）⑤ 测试：append-only 不破/actor 越权拒/派生幂等。

## 验收
**X-1（派生版标准）/ M-6**。判据细节=合并版下篇 §二/§七。

## 红线
- 禁新建独立 Ledger 类（复用纪律=X-1 前置）
- append-only 物理语义不破（TimelineLedger 现有锚：无 update/delete 公开面）
- `<!-- 本组件编码的模型假设：无（账本是模型无关基础设施）-->`

## 派单交接段
认领 worktree=mov-upg57 branch=feat/upg57；依赖：无；下游：UPG-58（事件写入）/UPG-60（状态迁移落账）；登记两个表 + 报告 `程序员\交付报告\DELIVERY_UPG57_*.md` + 已登记声明。

---

# UPG-58 A-1 Manifest 五步链脚本（改造计划第一阶段③）
**分类**：M2 体系/治理


```status
phase: merged
branch: feat/upg58
head: ac8d27d4
std: —
delivery_id: —
designer: ✅ 方案定稿（依据 合并版上篇 A-1 + 下篇 A1-1~A1-5/M-4/M-5；**硬验=零人工步骤**，≤20 行降为推荐约束[大神
dev: ✅**C 完成 @2026-08-31**（feat/upg58 **ac8d27d** 已 push origin[a62f904 主体+
inspector: 审验36→37：五步链+跨单消费全坐实[56 Guard 即插/57 Ledger 写入 actor=system-deriver]/L1
merge: ✅**审验通过+已合 main @2026-08-31**（审验 36→37：五步链+跨单消费全坐实[56 Guard 即插/57 Ledg
actor: sys04-backfill
updated_at: 2026-09-05T08:42:02
```

**状态**：✅ 方案定稿（依据 合并版上篇 A-1 + 下篇 A1-1~A1-5/M-4/M-5；**硬验=零人工步骤**，≤20 行降为推荐约束[大神四轮 P0-④]）→ 🔨 **可认领（前置 UPG-56/57）** → ✅**前置齐备**（56 ✅验收/57 R1 修复已 push）→ ✅**C 完成 @2026-08-31**（feat/upg58 **ac8d27d** 已 push origin[a62f904 主体+registry 同步]，基线 main 9c29ebb；**五项施工范围全交付**：①脚本五步链零人工（A1-1 硬验）——`ManifestMain.chain(changeId, manifestFile, workDir)` 单入口一条命令：提交→baseline capture→delta evaluation→交叉对拍→自动输出→Ledger 写入；gradle task `:tool-orch:manifest -PchangeId` ②baseline capture：六指标**错误数**（口径精确对齐 Evaluator.evaluate——**口径锚测试** errorCounts 换算比率与 evaluate 比率 1e-9 全等防口径漂移）+**五元快照 P0-1**[baseline_hash/eval_fixture_version=EvalFixture.VERSION（56 守卫即插）/evaluator_version=1.0/tool_registry_version=工具面 hash/model_runtime_config=mock-none 诚实快照]③delta evaluation fail-closed（V-2/M-4 逐元实测）：五元缺任一构造即拒+baseline fixture 版本对账（56 守卫拦截）+registry 版本对账——测试 3 实证拒发④交叉对拍自动输出（A1-2 五元完整/A1-3 predicted_fixes 未命中标记「验证器对拍非复读声明」/输出=stdout+manifest-<id>.md 自动附工单文件+半自动降级 A1-5 抽检留痕载体）⑤Ledger 写入（UPG-57 对接）——evolution.BASELINE_CAPTURED+REGRESSION_EVALUATED 事件（actor=system-deriver；**幂等**同 changeId 重跑不重复）；**M-5 判定独立性**：REJECT/PASS 只看六指标错误数 delta（单指标 +≥2 门 2 过渡阈值），risk_tasks 自述不参与（报告措辞锁定）；对照组差中差=纯函数态正交（R-1）标注仅 LLM 实调态生效；**L1**：tool-orch 4 类 27/0/0[ManifestChainTest 8 用例]+memory-os 34/0/0+app 519/0/1；模型假设注释 ✓（baseline 六指标纯函数确定性输出——LLM 实调态需加对照组差中差 §6.3）；报告 `DELIVERY_UPG58_2026-08-31.md`；**已登记两个表**）——待验收员：M-4 逐元复测（五元各改一次验拒发）+A1-3 交叉对拍语义+M-5 判定独立代码审查+A1-1 链演练（gradle :tool-orch:manifest）→ ✅**审验通过+已合 main @2026-08-31**（审验 36→37：五步链+跨单消费全坐实[56 Guard 即插/57 Ledger 写入 actor=system-deriver]/L1 77 套件 546/0/0 独立重跑/M1+M3v2 复杀/M2 幂等正向澄清/**五步链真实跑复现**[baseline.json+manifest.md+evolution.jsonl 两事件]；§六抽查=五元逐元 require fail-closed/V-1·M-5 判定独立性/模型假设注释 亲核✓；rebase 零冲突后 ff-only **f975437** 已推 origin[feat/upg58-rb 同推]；合后全量 BUILD SUCCESSFUL 亲跑绿；worktree mov-upg58 可收）→ **改造计划第一阶段 ①②③④ 全就位，UPG-60 三道门前置全齐可派**（P3×4 观察项在册[X1-2 flake 建议单调序号]） ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
Manifest 五步链脚本：提交→自动 baseline capture→自动 delta evaluation→自动输出→自动附工单，零人工步骤。

## 背景
大神 Q1 定夺：验证器不跑评测两周变走过场——做成工具不是文书。Baseline 可复现契约五元（fixture/evaluator/registry/model/config 版本快照）；对照组差中差**留 LLM 实调态**启用（R-1：当前纯函数态六指标与模型漂移正交，架构原则 §6.3）。

## 施工范围
① 脚本（五步链零人工操作为硬验）② baseline capture：六指标+五元快照 ③ delta evaluation：predicted_fixes 交叉对拍（输出「预测未命中」标记）+ fail-closed（五元缺一/版本失效拒发，M-4 逐元实测）④ 输出自动贴工单 ⑤ Ledger 事件写入（对接 UPG-57 evolution.*）。

## 验收
**A1-1~A1-5 + M-4/M-5**。判据细节=合并版下篇 §三 A-1。

## 红线
- 判定输入禁含 manifest 自述字段（V-1）
- 五元缺任一 fail-closed 拒发（V-2）
- `<!-- 本组件编码的模型假设：baseline 六指标为纯函数确定性输出（模型无关）——LLM 实调态引入时本脚本需加对照组差中差（§6.3） -->`

## 派单交接段
认领 worktree=mov-upg58 branch=feat/upg58；前置：UPG-56（fixture version）/UPG-57（Ledger 写入）；下游：UPG-60（门 2 判定输入）；登记两个表 + 报告 `程序员\交付报告\DELIVERY_UPG58_*.md` + 已登记声明。

---

# UPG-59 B 线蒸馏 MVP（改造计划第一阶段④ · 里程碑一承载）
**分类**：M6 记忆/知识


```status
phase: merged
branch: feat/upg59
head: 8da2907a
std: —
delivery_id: —
designer: ✅ 方案定稿（依据 合并版上篇改造线 B + 下篇 B-1~B-9；教训六字段/三分类/配额/过期）
dev: ✅**C 完成 @2026-08-31**（feat/upg59 **8da2907** 已 push origin 2 commit[2d
inspector: ✅**验收通过+审验通过 @2026-08-31**（9 项核物+73 套件 519/0/0 独立重跑+变异 V4/V3b/配额三杀独立复跑
merge: ✅**已合 main @2026-08-31**（设计师：§六抽查=V-4 ACTIVE-only 注入过滤/配额 MAX_LESSONS=
actor: sys04-backfill
updated_at: 2026-09-05T08:42:02
```

**状态**：✅ 方案定稿（依据 合并版上篇改造线 B + 下篇 B-1~B-9；教训六字段/三分类/配额/过期）→ 🔨 **可认领** → ✅**C 完成 @2026-08-31**（feat/upg59 **8da2907** 已 push origin 2 commit[2dd49a1 B 线蒸馏 MVP→8da2907 registry 同步 173 工具面]，基线 **main 8bcc167** 最新版纪律；**9 项施工范围全交付**：①LessonDistiller（com.hermes.dsh.compaction.distill 旁路纯函数——B-9 压缩路径零改动）②三分类 RETRYABLE[不产教训 B-3]/NON_RETRYABLE[0.5 低 conf]/FABRICATED_BLOCKED[0.9 guard 确证]+**同错误聚合 occurrences**+evidence=JSONL 行号指针 ③六字段 fail-closed（init require 缺任一抛 IAE——B-4 七非法态验证）④confidence 分层 PROPOSED 恒不进注入面（V-4/B-5）⑤**LessonInjector** 注入面唯一入口（仅 ACTIVE LESSON+≤3 条+600B 字节预算+超配额落库不进 prompt+排序确定性[conf desc→updatedAt desc→id]前缀恒定对齐 MemoryCover）⑥**过期机制** reevaluateLessonsBySourceHash（registryHash 变更→ACTIVE LESSON 降 RE_EVALUATE，actor=system-decay；RegistryHasher=工具面 sha1）⑦gold fixture 三类真实 schema ⑧toEvalFixtureProposals 提案就绪（落地随 UPG-56，B-8 审核事件口径申报）⑨B-3 负用例；**memory-os 三增量**：TYPE+LESSON(decay 0——过期走 hash 不走时间)/accept 同型互斥豁免 LESSON(教训天然多值)/reevaluateBySourceHash；**MainActivity** crossSessionLessonSegment(基因段旁路+注入前过期扫描+appendLog)；**L1 全量 73 类 519/0/1**（--rerun-tasks）+**变异 5/5 亲杀**[U59-V1 网络豁免删→B1/B3 双红/V2 evidence require 删→B4/V3 PROPOSED 放行→B5+B7 双红/V4 条数上限失效→配额红/V5 过期失效→B7]+assembleDebug 绿(55,588,170B)+check-token-effect 过+Token 申报=注入段 0~600B 硬上限（前缀恒定）；**红线自查**：V-3 无写入口（B-8 反射锚+DistillReport 纯数据+入池 ai-proposal actor）/V-4 过滤/配额硬上限/模型假设注释头注 ✓；**B-1~B-9 全过**（B-6 JVM 端到端机制链：犯错→蒸馏→入池→accept→新会话渲染段含教训+确定性；生产复发率 OBSERVABILITY ONLY；B-7 无已知缺口）；报告 `DELIVERY_UPG59_2026-08-31.md`；**已登记两个表**）——待验收员 L1 复跑+变异抽杀（建议 U59-V1/V3/V5）+B-2 回溯抽查+B-6 构造链复核+memory-os LESSON 互斥豁免契约复核；L2 模拟器增强面可做（构造会话 logcat 验证）→ ✅**验收通过+审验通过 @2026-08-31**（9 项核物+73 套件 519/0/0 独立重跑+变异 V4/V3b/配额三杀独立复跑+B-2 行号逐条回溯+B-6 端到端 A→B 会话注入+LESSON 豁免复核；L2 轻量运行验证补足[模拟器干净态装冷启/池初始化/无崩溃]；统计 32→33 落档）→ ✅**已合 main @2026-08-31**（设计师：§六抽查=V-4 ACTIVE-only 注入过滤/配额 MAX_LESSONS=3+600B overflowed 落库/排序确定性前缀恒定/B-8 反射锚无写入口/LESSON 互斥豁免+过期 reevaluateLessonsBySourceHash 亲核 ✓；基点=main 头 8bcc167 无 rebase 负担，中途 main 前进 4bce784[验收 docs]改临时分支 rebase 零冲突；**合前 worktree 亲跑全量 73 套件 519/0/0 绿**+rebase 后复跑 BUILD SUCCESSFUL；ff-only **4b5f65f** 已推 origin[feat/upg59-rb 同推]；worktree mov-upg59 可收；工单表已登记[备份 工单表_backup_合main_UPG59_2026-08-31.xlsx]）→ **里程碑一「它不摔同一个坑了」就绪**（B 线 MVP 在 main；生产复发率=OBSERVABILITY ONLY 后验观测）｜ **优先级**：P0（里程碑一「它不摔同一个坑了」承载单） ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
失败根因蒸馏 MVP：journal→三分类→教训六字段→confidence 分层→配额注入→过期机制。

## 背景
用户判据里程碑一：AI 同一个坑不摔第二次且跨会话不忘。E3 现状=条目级 reason 同 session（@`MainActivity.kt:4421`）；B 线=跨会话教训。三分类 MVP（可重试/不可重试/编造被拦——fabricate_hit 字段现成 @`AgentLoop.kt:446-453`）；「工具缺陷 vs 环境不可达」细分留迭代。教训条目挂 source registry hash。

## 施工范围
① 蒸馏器（compaction 包旁路模式，B-9 不污染对话压缩）② 三分类+evidence 指针（JSONL 行号可回溯）③ 教训六字段 fail-closed（lesson/category/evidence/confidence/source_session/source_event）④ confidence 分层（低 confidence 只停 PROPOSED 不进注入面，V-4）⑤ 注入配额（≤3 条+字节预算，MemoryCover 冻结/前缀恒定对齐）⑥ 过期机制（source hash 变更→REEVALUATE，纪律 6）⑦ gold JSONL fixture 三类 ⑧ 反哺：新增用例进 EvalFixture（落地 UPG-56 认领卡）⑨ B-3 负用例（网络断/500 不升级为教训）。

## 验收
**B-1~B-9**（B-6 已改名「机制验证」，生产复发率 OBSERVABILITY ONLY）。判据细节=合并版下篇 §四。

## 红线
- V-3：蒸馏器无任何规则/阻断写入口（B/A 边界 §6.4——输出只能是 fixture/风险提案）
- V-4：低 confidence 教训不进注入面
- 注入配额硬上限（超配额只落库不进 prompt）
- `<!-- 本组件编码的模型假设：三分类规则假设「journal 错误形态可规则归因」——模型行为变化可能改变错误形态分布，蒸馏规则需随 MODEL_UPGRADE_RECHECK 事件复核 -->`

## 派单交接段
认领 worktree=mov-upg59 branch=feat/upg59；依赖：无（可立即开工；生产信号供 UPG-60 门 3）；下游：UPG-60（门 3 信号）/UPG-56（fixture 反哺落地）；登记两个表 + 报告 `程序员\交付报告\DELIVERY_UPG59_*.md` + 已登记声明。

---

# UPG-60 A-2 三道门实现+元验证（改造计划第一阶段⑥）
**分类**：M2 体系/治理


```status
phase: merged
branch: feat/upg60
head: a8d1363e
std: —
delivery_id: —
designer: ✅ 方案定稿（依据 合并版上篇 A-2 + 下篇 A2-1~A2-6/M-1~M-6；**前置 UPG-56/58/59**）
dev: ✅**C 完成 @2026-08-31**（feat/upg60 **a8d1363** 已 push origin[5a7a576 三道门
inspector: ✅**验收通过+审验通过 @2026-08-31**（9f9466d 落档：9 项测试锚+77 套件 546/0/0+变异 M1/M3v2
merge: ✅**已合 main @2026-08-31**（设计师：§六抽查=SkillGate JS_ARTIFACT 直接拒收[A2-2 落地]/
actor: sys04-backfill
updated_at: 2026-09-05T08:42:02
```

**状态**：✅ 方案定稿（依据 合并版上篇 A-2 + 下篇 A2-1~A2-6/M-1~M-6；**前置 UPG-56/58/59**）→ 📌 待前置 → ✅**前置全齐**（56 ✅验收/58 ✅C 交付 ac8d27d/59 ✅验收合 main 4b5f65f）→ ✅**C 完成 @2026-08-31**（feat/upg60 **a8d1363** 已 push origin[5a7a576 三道门+元验证+registry 同步]；**分支声明：基 feat/upg58 ac8d27d+merge feat/upg56（前置产物合流：ManifestMain/EvalFixtureVersionGuard/Z-3 集+Ledger 泛化）——56/57/58/59 合 main 后本分支 rebase 跟进**；**五项施工范围全交付**：①门 1 功能重放（A2-1）——候选工具面跑 EvalFixture 全量重放，13 条绝对阈值 ≤1 条失败，**阈值配置化**（ThresholdConfig ≥40 条切百分比+切换 Ledger 事件语义已备），JS 工件类直接标「不可准入」零重放（A2-2 Q2 定夺），**错误注入自检** injectError（trigger 词面反写=Z3-1 同款决策键真变化——M-2 拦截锚）②门 2 回归（A2-1b）——六指标错误数 delta **单指标维度错误用例数 +≥2 → REJECT 禁跨指标抵消**（三组构造用例验语义：单指标 -2 拒/两指标各 -1 不拒/一指标 -2 另一 +2 仍拒）+**M-5 判定独立**（gate2 签名只收两份 ErrorCounts 反射锚+判定行措辞锁定）③门 3 会话级灰度（A2-4/A2-5）——shadow 计数**持久化于 Ledger**（evolution.SHADOW 事件，重开 Ledger 实证一致——非内存态）+达标转 canary+退化回 shadow=**人工触发版**（degradeToShadow manualTrigger=true 强制参数——拒绝伪装自动即抛 IAE，纪律 5 诚实标注）④**元验证 M-1~M-6**（MetaVerificationTest 10 用例排首=**V-6 顺序约束：元验收未全过不放真实候选**）——M-1 Z-3 坏改动走门 2 全 REJECT+方向与预登记一致（Z3-5 由 56 守卫拦截——分防线）/M-2 错误注入候选被拒+失败定位/M-3 干净候选双门放行（防全拒门）/M-4 五元逐元失效 ManifestMain 拒发（与 58 联合实测五元）/M-5 gate2 签名反射+行为锚/M-6 AI 只 PROPOSED 越权拒+user 裁决放行（57 actor 联合实测）⑤A2-6 生命链——PROPOSED→SHADOW×3→CANARY→DEGRADED 全程 Ledger 落账+**explain 单查询**回答「处于什么状态为什么」（含 trigger=人工标注——EvolutionDeriver.explain 演进：非八字段 payload 回退读 ledger reason+trigger 标注）；**L1**：tool-orch 6 类 **38/0/0**[MetaVerificationTest 10+ManifestChainTest 8+既有]+memory-os 34/0/0+app 519/0/1（registry 同步 a8d1363）；模型假设注释 ✓（门 1 重放覆盖面声明——JS 类已拒收/宏技能编排类覆盖）；**测试全 JVM 未用真机**（派单纪律）；报告 `DELIVERY_UPG60_2026-08-31.md`；**已登记两个表**）——待验收员：M-1~M-6 独立复跑+Z-3 预登记方向对账+A2-1b 三组语义+门 3 持久化跨实例验证+JS 拒收语义+A2-6 单查询体验 → ✅**验收通过+审验通过 @2026-08-31**（9f9466d 落档：9 项测试锚+77 套件 546/0/0+变异 M1/M3v2 杀+五步链真实跑实测；审验 37→38：L1 三模块独立重跑吻合+变异 G1/G2/G3 复杀 3/3+分支声明祖先链 ✅）→ ✅**已合 main @2026-08-31**（设计师：§六抽查=SkillGate JS_ARTIFACT 直接拒收[A2-2 落地]/门 2 单指标+≥2 REJECT 禁跨指标抵消[A2-1b]/injectError 错误注入 亲核 ✓；feat/upg60 含 58/56 原始提交[patch 等价]rebase 自动 skip，真实增量=三道门+registry；**审验 P3-1 两表未更新=本次合入时补登**；**P3-3 M-1 合成数据缺口注记**：真实坏改动重放闭环可用 UPG-56 Z-3 坏改动集补跑，随 UPG-60 后续批次；rebase 后 ff-only **2b1bb00** 已推 origin[feat/upg60-rb 同推]；合后全量 BUILD SUCCESSFUL 亲跑绿[app 525/0/0+tool-orch+memory-os]；worktree mov-upg60 可收）→ **改造计划第一阶段 ①-⑥ 全闭环** ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
技能准入门三道门实现+元验证：门 1 功能重放 / 门 2 回归 / 门 3 会话级灰度。

## 背景
EvoC2F 实证：去验证门回归率 0.8%→7.2%——门的价值=防退化不提分。门 1「错误注入 100% + 功能重放 ≤1 条失败」（13 条现值，≥40 条切百分比）；门 2 **单指标口径**（任一指标错误数 +≥2 即 reject，禁跨指标抵消——AHE「组件非加性」教训，A2-1b 三组构造用例验语义）；门 3 会话级灰度（第一版人工触发回退诚实标注——退化信号依赖 UPG-59 生产化，纪律 5）。JS 工件类候选直接拒收（Q2 定夺）。判定输入禁自述字段。

## 施工范围
① 三道门实现（EvalFixture 重放/六指标 held-out 对比/shadow 计数持久化非内存态）② held-out 划分固定+版本化进五元（A2-3：改划分=改基线）③ 元验证：UPG-56 坏改动集走门 2（M-1 拦截+方向与预登记一致）+门 1（M-2）+干净候选放行（M-3 防全拒）+判定独立性（M-5 [CR]）+五元触发器逐元（M-4，可与 UPG-58 联合实测）④ 生命链同构走查（A2-6：PROPOSED→门过→shadow→canary→stable 全程 Ledger 单查询）⑤ actor 权限实测（M-6，联合 UPG-57）。

## 验收
**A2-1~A2-6 + M-1~M-6**；元验收先于一切（V-6：元验收未全过不放行任何真实候选）。判据细节=合并版下篇 §二/§三 A-2。

## 红线
- 元验收（M 系列）未全过不得放行任何真实候选（V-6 顺序约束）
- 判定输入含自述字段=V-1 一票否决
- 门 3 第一版交付物标注「人工触发版」（纪律 5 诚实降级）
- `<!-- 本组件编码的模型假设：门 1 重放假设「EvalFixture 用例覆盖候选技能的行为面」——JS 工件类不覆盖（已拒收）；宏技能编排类覆盖（纯函数决策面） -->`

## 派单交接段
认领 worktree=mov-upg60 branch=feat/upg60；**前置：UPG-56/58/59 全交付**；登记两个表 + 报告 `程序员\交付报告\DELIVERY_UPG60_*.md` + 已登记声明。

---

# UPG-61 vault.get 伪放行修（记住豁免与 fail-closed handler 不一致 · UI 禁用豁免勾选）
**分类**：M1 安全/合规


```status
phase: merged
branch: feat/upg61
head: b7c2e9d2
std: —
delivery_id: —
designer: 定稿（UPG-53
dev: ✅**C 完成 @2026-08-31**（feat/upg61 **b7c2e9d** 已 push origin；**修法②落地·四范围
inspector: ✅ 方案定稿（UPG-53 审验员 L2 实测新发现 P1 + 设计师定夺修法；源码锚 @main 2780961：`MainActivit
merge: ✅**审验通过+已合 main @2026-08-31**（审验 35→36：四范围核物+L1 74 套件 523/0/0 独立重跑+变异
actor: sys04-backfill
updated_at: 2026-09-05T08:42:02
```

**状态**：✅ 方案定稿（UPG-53 审验员 L2 实测新发现 P1 + 设计师定夺修法；源码锚 @main 2780961：`MainActivity.kt:3568` handler 只认 OUTCOME_ALLOWED_ONCE + `:6616` canRemember=free≠gate 恒真）→ 🔨 **可认领** → 🔨 **C 已认领 @2026-08-31（worktree=mov-upg61 branch=feat/upg61，基线 main 4b5f65f）** → ✅**C 完成 @2026-08-31**（feat/upg61 **b7c2e9d** 已 push origin；**修法②落地·四范围全交付**：①only-once 工具集单源 `OnlyOnceTools`（com.hermes.dsh.tools）——vault.get+browser.click/fillForm/login **四 handler 逐个源码核对**@4b5f65f 均只认 OUTCOME_ALLOWED_ONCE+归一精确匹配+登记纪律头注（红线：新增该类 handler 须同步登记）②弹窗层禁用——`buildApprovalDialogView` only-once 工具：同类同意行**不渲染**（autoSame 恒 false→同意恒 ALLOW_ONCE）+记住偏好行**不渲染**（rememberEnabled 短路）——弹窗只两键每次当场确认③豁免链跳过——`ApprovalService.request` 三豁免 only-once 全短路（turn/goal/remembered）——**豁免命中路径不可能出现于 only-once 工具：审计（asked+decided allowed-once）与 handler 行为完全一致（核心判据③）；handler fail-closed 零改动（红线）**④测试 OnlyOnceGuardTest 4 用例[清单归一/remembered 命中仍弹+审计链无 allowed-remembered+**device.timer 对照不回归**（验收④）/turn 豁免跳过同 turn 两次真弹+asked×2/弹窗层源码锚]；**L1 全量 74 类 523/0/1**+变异 U61-V1 亲杀（删豁免跳过→remembered 命中测试红=伪放行复现）+assembleDebug 绿+check-token-effect 过+**Token 申报 0**（纯禁用无注入面变化）；**L2 说明**：弹窗为 native AlertDialog 桥注入态不适用+模拟器 5554 损坏——弹窗截图留验收员补验（触发：AI 调 vault.get→只两键无勾选；对照 vault.delete 有勾选行），JVM 已覆盖豁免跳过全链+源码锚；**同型缺陷（browser 三工具）随本单一并修复**；报告 `DELIVERY_UPG61_2026-08-31.md`；**已登记两个表**）——待验收员：L1 复跑+变异抽杀（U61-V1）+only-once 清单源码核对+弹窗 L2 截图（vault.get 无勾选/browser.click 无勾选/对照 vault.delete 有勾选）→ ✅**审验通过+已合 main @2026-08-31**（审验 35→36：四范围核物+L1 74 套件 523/0/0 独立重跑+变异 U61-V1 复杀[伪放行复现]+四 handler 一字未动+rebase 实测与 main 交集 EMPTY；**§六抽查=OnlyOnceTools 单源枚举[四工具+模型假设注释+行号锚]/三豁免 !onlyOnce 短路/归一化精确匹配 亲核 ✓**；L2 弹窗截图 P3 待 key/真机恢复补验[only-once 两键 vs vault.delete 双勾选对照形态 UPG-53 已实证]；rebase 零冲突后 ff-only **570c921** 已推 origin[feat/upg61-rb 同推]；合后全量 **74 套件 523/0/0+1跳过** 亲跑绿；工单表已登记[备份 工单表_backup_合main_UPG61_2026-08-31.xlsx]） ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
「每弹 only-once」类工具的审批弹窗禁用记住/turn/goal 豁免勾选——消除「UI 承诺以后不再询问、实际继续拒绝」的承诺与行为矛盾（审计 allowed-remembered 与业务拒绝不一致）。

## 背景（现象→根因）
`vault.get`（明文凭据读取）handler 强制每次弹窗且只认 `allowed-once`（:3568 `if (outcome != OUTCOME_ALLOWED_ONCE)` 否则返回「用户拒绝」），但 `permissionTier(vault.get)`=free → 弹窗「记住此偏好」勾选可见可勾 → 勾选记住+同意后豁免链下次命中 `allowed-remembered`（免弹）→ handler 判 ≠allowed-once → 业务返回 `{ok=false, error=用户拒绝}`。**安全方向正确**（明文未泄露 fail-closed），属 UX/一致性缺陷。同类受影响（代码推断）：turn/goal 豁免对 vault.get；browser 支付/登录审批（browser.click/fillForm/login 只认 allowed-once）。

## 施工范围（定夺=修法 ②）
① 识别「每弹 only-once」工具集（vault.get + browser.click/fillForm/login——handler 语义逐个核对源码）② 弹窗层对该类工具隐藏/禁用「记住此偏好」及 turn/goal 豁免勾选（canRemember/canTurn/canGoal 判定加「handler 是否 only-once」维度）③ 豁免链命中后审计与 handler 行为对齐校验（防同型断裂再发——加契约测试锚：对 each only-once 工具，豁免命中路径 handler 仍拒绝且审计一致）④ 测试：禁用勾选锚 + 豁免/handler 一致性锚 + 正常工具（非 only-once）豁免不受影响对照。

## 验收
① vault.get 弹窗不再出现记住/turn/goal 勾选（L2 截图）② 同类 browser 三工具同 ③ 正常写类工具（vault.delete 等）记住豁免流程不回归（对照）④ 契约锚变异亲杀。**明确不采纳修法 ①（放宽 handler 豁免 vault.get）**——明文凭据读取每次确认是安全默认，不以 UX 弱化它。

## 红线
- handler fail-closed 语义零改动（vault.get 明文不因本单变得可豁免）
- 审计与行为一致性为本单核心判据（豁免审计=实际行为）
- `<!-- 本组件编码的模型假设：无直接模型假设；「only-once 工具集」为 handler 实现枚举，新增该类 handler 时须同步登记 -->`

## 派单交接段
认领 worktree=mov-upg61 branch=feat/upg61（开工前先 fetch+看本卡状态）；依赖：无（基于 main 2780961）；完成后登记两个表（先表后库）+ 报告落 `程序员\交付报告\DELIVERY_UPG61_*.md` + 已登记声明。

---

# UPG-62 多轮对话输入框失焦修（markstream WebView 抢焦点 · 焦点归还兜底）
**分类**：M8 UI/交互


```status
phase: merged
branch: —
head: —
std: —
delivery_id: —
designer: ✅ 方案定稿（用户真机实测报障 + 设计师溯源 @main f975437）
dev: —
inspector: —
merge: ✅**已合 main @2026-08-31**（ff-only **82c778b** 已推 origin[feat/upg61-rb 链
actor: sys04-backfill
updated_at: 2026-09-05T08:42:02
```

**状态**：✅ 方案定稿（用户真机实测报障 + 设计师溯源 @main f975437）→ ✅**设计师修复 @2026-08-31（用户授权直接修）**→ ✅**已合 main @2026-08-31**（ff-only **82c778b** 已推 origin[feat/upg61-rb 链同推]；§六抽查=锚测试双断言变异红[注释屏蔽行→锚1+锚2 红]；修法=①isFocusable=false+isFocusableInTouchMode=false+descendantFocusability=FOCUS_BLOCK_DESCENDANTS[渲染面板不参与焦点竞争——根治]；**设计取舍=撤销焦点归还兜底**[渲染完成跳焦点反向干扰「故意点开内容」场景——最小改动闭环]；合后全量 **75 套件 525/0/0** 亲跑绿+assembleDebug 绿；真机+模拟器双装 Success；P3=锚方法名句点非法坑复发[upg05 教训]已修） ｜ **优先级**：P1（真实用户日常路径） ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
多轮对话后输入框失焦修：markstream WebView 挂载渲染回复时抢焦点 → 原生输入框失焦但键盘弹起——「键盘在、焦点不在，还要再点一下」。

## 背景（现象→根因，源码实证）
用户真机实测：多轮对话后键盘弹起但输入框无光标不可输入，需再点一次输入框。溯源（@main f975437）：AI 回复用 **markstream WebView 渲染**（MainActivity:6158「回复后追加复制图标[markstream/markwon 共用]」/:6734「历史 AI 回复的 markstream WebView 渲染完成后」）——WebView 可聚焦，挂载/重挂载渲染回复时**抢走窗口焦点**→原生 EditText `input`（:1775）失焦，IME 键盘未同步收回保持弹起→「键盘在、焦点不在」。短回复走 markwon 原生渲染不触发（解释「多轮后才出现」）。独立同症状源：`hideSoftKeyboard` 内 `clearFocus`（:4344）+ 全局 dispatchTouchEvent 点外收键盘（:4349-4356）。

## 施工范围（定夺修法）
① markstream WebView **isFocusable=false + descendantFocusability=FOCUS_BLOCK_DESCENDANTS**（渲染面板无需键盘交互——根治抢焦点）② 回复渲染完成后焦点归还兜底：若渲染前 `input.hasFocus()` 且渲染后失焦 → `input.requestFocus()`（打字中途回复到达，焦点无感保持）③ `hideSoftKeyboard` 的 clearFocus **保留**（用户主动点外部收键盘清焦点是合理惯例，配合 ① 后不再出现「键盘在焦点不在」）④ 锚测试：WebView focusable=false 断言 + 焦点归还行为用例。

## 验收
L1：①锚测试（WebView 不参与焦点竞争）②焦点归还用例 ③全量绿。L2 真机：多轮对话（含长回复触发 markstream）——回复到达时输入框光标保持/直接继续打字无需再点；键盘收起/弹起行为正常。判据=「回复到达不打断正在进行的输入」。

## 红线
- markstream 渲染行为/回复内容零改动（只动焦点面）
- upg21 回车发送契约不回归（IME action 链回归测试）
- `<!-- 本组件编码的模型假设：无（纯焦点管理） -->`

## 派单交接段
认领 worktree=mov-upg62 branch=feat/upg62（开工前 fetch+看本卡状态）；依赖：无；完成后登记两个表 + 报告落 `程序员\交付报告\DELIVERY_UPG62_*.md` + 已登记声明。

---

# UPG-63 第二阶段收口：弹窗基线 Z-5 + MULTI_CALL 分布统计 + M-1 真实重放补跑
**分类**：M2 体系/治理

```status
phase: merged
branch: feat/upg63
head: 0580fa88
std: —
delivery_id: —
designer: 🔓 **五轮评审采纳升 v2.4 工程契约冻结（2026-08-31，MCP 治理评 9/10）**：67-B 范围随三细节钉死｜①审批
dev: ✅**C 完成 @2026-08-31**（feat/upg64 **115762d** 已 push origin[2d2444d 主体+
inspector: ✅**验收+审验通过 @2026-08-31**（78 套 540/0/0+EffectSpecsTest 10/0+变异 M-64a/b
merge: ✅**已合 main @2026-08-31**（§六抽查=Registry 20 条全在+credSet/credDelete 在场[误报
actor: sys04-backfill
updated_at: 2026-09-05T08:42:02
```


## 验收
Z-5（基线在档+口径钉死）/ C-6（分布统计落档）/ M-1（真实重放闭环+方向一致）。判据细节=合并版下篇 §一/§五 C-6/§二 M-1。→ ✅**C 完成 @2026-08-31**（feat/upg63 **0580fa8** 已 push origin[2654b60 主体+registry 同步]，基线 main 2b1bb00；**三项施工范围全交付**：①Z-5 弹窗基线——`C7BaselineGenerationTest`（app）**30 会话**真实 ApprovalService 链路构造（answerer 自动应答 ALLOW_ONCE；only-once 工具 UPG-61 不吃豁免=计数真实）；场景分布 vault 写 20 弹/http 8/browser 6/mixed——**落档 `docs/c7_baseline_UPG63/`（30 jsonl+baseline_summary.md 含口径与构造方式声明）**——**V-7 防线先于 C 线落档**②C-6 MULTI_CALL 分布统计——journal 口径（turns/multiCallTurns/ratePercent）+**保守假设留痕**（C-6 判据允许：真机历史 journal 不可得如实申报不虚构覆盖率，构造样本为数据源）③M-1 真实坏改动重放补跑（消 P3-3 合成数据缺口）——`M1RealReplayTest`（tool-orch）Z-3 五条**真改 EvalFixture 工具面数据走真实 orchestrate**：Z3-1 Selection 2 条翻转（c01/c11）门 2 REJECT+方向一致/Z3-2 校验差异可观测单点 WATCH/Z3-3 c07 翻转+1=WATCH 阈值语义对齐如实记录（c09 用「告知」仍命中词面分析申报）/Z3-4 c06 误触发抢占/Z3-5 56 守卫拦截复证；**L1**：app 76 类 526/0/1+tool-orch 42/0/0+memory-os 34/0/0；红线自查 V-7/统计只读/模型假设注释 ✓；报告 `DELIVERY_UPG63_2026-08-31.md`；**已登记两个表**）→ ⛔**部分打回 @2026-08-31**（ACCEPTANCE_LOG 9e764fb：①Z-5 ✅30 会话 jsonl+summary 46 弹分布一致/③M-1 真实重放 ✅5/0 消 P3-3 缺口/②C-6 ⛔ 统计代码零命中申报不符——**打回根因：M1RealReplayTest 从 app 迁 tool-orch 时 C6 段未随迁**（第一版 app 测试 rm 时丢失）交付完整性核对教训）→ 🔨**C R1 补交付 @2026-08-31**（feat/upg63 **8c60f67** 已 push origin；**打回要求遵行：①③不动**；②C-6 补交付——`C6MultiCallStatsTest`（tool-orch）multiCallStats 纯函数（journal 行级正则解析零依赖）+统计正确性（turns/multiCallTurns/ratePercent+空 journal 零除保护）+落档 `docs/c6_multicall_stats_UPG63/stats.md`（构造样本数字+**保守假设留痕** C-6 判据）+变异锚（multi 判定 ≥2 语义锁定）；L1 tool-orch 7 类 46/0/0+app 76 类 526/0/1+memory-os 34/0/0 全绿；**已登记两个表**）——待复验：C-6 统计实现+落档核对（①③已过不复验） ｜ **优先级**：P1（C 线开工准入前置） ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
三项统计/收口小活一次清：①Z-5 确认弹窗计数基线（≥30 会话，先于 C 线落档——V-7 防线）②journal MULTI_CALL 工具分布统计（20 工具覆盖率决策依据）③M-1 真实坏改动重放补跑（消 P3-3 合成数据缺口）。

## 施工范围
① **Z-5 弹窗基线**：模拟器/真机采集 ≥30 会话的确认弹窗计数（口径=ApprovalService ASK 弹窗逐次计数，含场景分布：vault.*写/http.post/browser.*）——计数脚本+原始数据落档 `docs/c7_baseline_UPG63/`（验收前落档=V-7 合规）② **MULTI_CALL 分布**：扫 journal 历史 MULTI_CALL 会话，统计涉及工具 top-N 与首批 20 工具覆盖率（≥80% 则 D 线按计划/<50% 收益下调决策显式记录/样本不足按保守假设留痕）③ **M-1 真实重放**：用 UPG-56 Z-3 坏改动集（docs/z3_bad_changes_UPG56.md 5 条）逐个走门 2 真实重放（非合成）——拦截+拒绝方向与预登记一致（M-1 全判据）④ 三项产物统一落 docs/ 与报告。

## 验收
Z-5（基线在档+口径钉死）/ C-6（分布统计落档）/ M-1（真实重放闭环+方向一致）。判据细节=合并版下篇 §一/§五 C-6/§二 M-1。

## 红线
- 基线数据先于 C 线任何改动（V-7）
- 统计脚本只读 journal，禁改会话数据
- `<!-- 本组件编码的模型假设：分布统计假设「历史 MULTI_CALL 样本代表未来」——开发期样本不足时按保守假设处理 -->`

## 派单交接段
认领 worktree=mov-upg63 branch=feat/upg63；依赖：无（可立即开工）；下游：UPG-64（基线+分布结论）/UPG-60 后续批次（M-1 闭环）；登记两个表 + 报告 `程序员\交付报告\DELIVERY_UPG63_*.md` + 已登记声明。

【⛔ 部分打回 @2026-08-31（ACCEPTANCE_LOG 9e764fb）：①Z-5 弹窗基线 ✅30 会话 jsonl+summary 46 弹分布一致/③M-1 真实重放 ✅5/0 消 P3-3 合成缺口/②C-6 ⛔ 统计代码零命中申报不符——打回根因=M1RealReplayTest 从 app 迁 tool-orch 时 C6 段未随迁（第一版 app 测试 rm 时丢失）交付完整性核对教训。打回要求：补 C-6 统计实现+落档后复验（①③不动）。→ 🔨C R1 补交付 @2026-08-31（feat/upg63 **8c60f67** 已 push：C6MultiCallStatsTest tool-orch——multiCallStats 纯函数 journal 行级正则解析零依赖+统计正确性 turns/multiCallTurns/ratePercent+空 journal 零除保护+落档 docs/c6_multicall_stats_UPG63/stats.md 构造样本数字+保守假设留痕 C-6 判据·真机历史 journal 不可得如实申报不虚构覆盖率+变异锚 multi 判定≥2 语义锁定；tool-orch 7 类 46/0/0+app 76 类 526/0/1+memory-os 34/0/0 全绿；①③未动。已登记两个表）——待复验：C-6 统计实现+落档核对[①③已过不复验]】

---

# UPG-64 C 线效应注解首批（改造计划第二阶段·C 线）
**分类**：M2 体系/治理


```status
phase: merged
branch: feat/upg64
head: 115762dd
std: —
delivery_id: —
designer: 🔓 **五轮评审采纳升 v2.4 工程契约冻结（2026-08-31，MCP 治理评 9/10）**：67-B 范围随三细节钉死｜①审批
dev: ✅**C 完成 @2026-08-31**（feat/upg64 **115762d** 已 push origin[2d2444d 主体+
inspector: ✅**验收+审验通过 @2026-08-31**（78 套 540/0/0+EffectSpecsTest 10/0+变异 M-64a/b
merge: ✅**已合 main @2026-08-31**（§六抽查=Registry 20 条全在+credSet/credDelete 在场[误报
actor: sys04-backfill
updated_at: 2026-09-05T08:42:02
```

**状态**：✅ 方案定稿（依据 合并版上篇改造线 C + 下篇 C-1~C-8；**开工前置=UPG-63 全交付**）→ 📌 待前置 → ✅**前置全齐**（63 ✅C 交付 0580fa8→8c60f67 R1）→ ✅**C 完成 @2026-08-31**（feat/upg64 **115762d** 已 push origin[2d2444d 主体+registry 同步]，基线 main 5b44714；**五项施工范围全交付**：①四元组（C-1）——`EffectSpecs`（tool-orch）：`SideEffect PURE|READ|WRITE × Env LOCAL|EXTERNAL × resources List`；**两套并存不混写**（annotations=AI 面 hint 可能不填填错 / effects=执行面事实调度依据——红线）②**首批 20 高频工具逐条源码核实**（与 UPG-01 desc 纪律同款）——`EffectSpecRegistry`（app meta 包）：file.read/write、memory.save/search/delete/cover、vault.list/set/delete/credSet/credDelete、obsidian.file.read/write、http.get/post、calendar.list/add、device.network/storage、screen.capture——语义锚逐条（vault.delete=UPG-53 5s 可撤语义/scrfix root 执行/screen.capture 环境隐私）③缺省裁决落地（C-4 已定夺）——`resolve` 单源：登记用/readOnlyHint=true 纯读回落 annotations hint+**进优先核实队列**/其余保守缺省 WRITE×EXTERNAL（宁可少并行不可错并行）+C-3 行为——未登记工具 MULTI_CALL **自动串行+确认门**；WRITE×EXTERNAL 恒串行+确认门④**C-6 覆盖率数字落档**：首批 **20/118≈17%<50%**——**收益下调决策显式记录**（COVERAGE_NOTE 常量；首批主场景工具扩批随 journal 热度滚动）⑤trace 只扩不缩（C-5）——`traceProposal`：观测写足迹/外部足迹超登记→修正提案走 A-1 Manifest 不静默改；**L1**：tool-orch 8 类 **58/0/0**[EffectSpecsTest 8 新：C-4 三态/C-3 未登记串行+确认/W-E 串行+确认/可并行正例/C-5 提案×2/序列化]+app 78 类 540/0/1[registry 同步后]+**变异锚** resolve 未登记必须保守缺省 WRITE×EXTERNAL+planFor 串行+确认；敏感面锚 vault 写类+凭据类全 LOCAL；模型假设注释 ✓（首批 20 覆盖 MULTI_CALL 主场景——覆盖率以 UPG-63 统计为准不足则扩）；**测试全 JVM 未用真机**；报告 `DELIVERY_UPG64_2026-08-31.md`；**已登记两个表**）——待验收员：首批 20 逐条源码核实抽查（handler 行为 vs 登记 EffectSpec）+C-4 三态裁决+C-3 行为+C-5 提案+变异锚复跑；下游 UPG-67 D 线（效应注解=DAG 并行安全依据）→ ✅**验收+审验通过 @2026-08-31**（78 套 540/0/0+EffectSpecsTest 10/0+变异 M-64a/b 双杀；**审验推翻验收 P2**：credSet/credDelete「漏登记」误报应销项——Registry :57/:59 实证在场，三处记录同步更正）→ ✅**已合 main @2026-08-31**（§六抽查=Registry 20 条全在+credSet/credDelete 在场[误报销项独立核实成立]/resolve 三态回落+优先队列[C-4 落地] 亲核✓；ff-only **115762d** 已推 origin[feat/upg64 同名直推]；合后全量 **77 套 534/0/0** 亲跑绿+模拟器装机 Success；**平板无线装机待重连补装**[10060 端口失效]；P3×4 在册[组件先行，resolve/planFor/traceProposal 接编排主链=下游 UPG-67 D 线接线]）→ **UPG-67 D 线双门前置①就绪（②性能维度随 63 基线已就绪→67 双门全齐，D 线可放行评估）**→ ⚠️**四轮评审新增前置组件（2026-08-31）**：MCP 资产访问治理（Asset Access Contract——Trust Level 三级/Field-Level Access/Egress Policy/Scope/Data Projection 原则，设计 v2.3 §十全量）——**67-B 范围改为「Asset Access Gateway+衣柜类目+换装 MCP 接入」**（Gateway 先行，衣柜 MCP 为首个 official 级试点接入方）；67-A（框架+迁移，纯本地无 MCP）**不受影响可开工**；铁律新增=MCP 永不直接触达 storage/ciphertext/KMS key（只见授权后 Data Projection）→ 🔓 **五轮评审采纳升 v2.4 工程契约冻结（2026-08-31，MCP 治理评 9/10）**：67-B 范围随三细节钉死——①审批 UI 与 Access Contract 强绑定（弹窗逐字段=Contract 同源，grant 逐字段落盘）②grantId（批准了什么）与 auditId（发生了什么）职责分离③Egress Guard 强制位置=数据投影后/MCP 返回前（不信 Tool 自报）——**67-B 开工准入=本三细节随 Gateway 设计落地**；67-A 不受影响 ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
工具效应注解第四维度首批：HostToolMetaEntry 三元组扩四元组（effects: sideEffect/env/resources），首批 20 个高频工具逐条源码核实。

## 施工范围
① `HostToolMetaEntry` 扩 `effects: EffectSpec`（EffectSpec=sideEffect PURE|READ|WRITE × env LOCAL|EXTERNAL × resources List）② 首批 20 高频工具逐条核实（与 UPG-01 desc 纪律同款：逐条查 handler 源码+行号锚）③ 缺省裁决（C-4 已定夺：readOnlyHint 回落仅纯读类+自动进优先核实队列）④ trace 只扩不缩守卫（C-5：观测到更宽足迹→Manifest 修正提案不静默改）⑤ 行为测试：未登记工具 MULTI_CALL 自动串行+确认门（C-3）。

## 验收
C-1~C-7（含 C-2 双人核实一致率 100%/C-7 基线 Z-5 已在档）。判据细节=合并版下篇 §五。

## 红线
- annotations 与 effects 两套并存不混写（annotations=hint，effects=事实）
- 未核实工具一律保守缺省（宁可少并行不可错并行）
- `<!-- 本组件编码的模型假设：首批 20 工具覆盖 MULTI_CALL 主场景（覆盖率以 UPG-63 统计为准，不足则扩） -->`

## 派单交接段
认领 worktree=mov-upg64 branch=feat/upg64；**前置：UPG-63 全交付（基线在档+分布结论）**；下游：D 线 DAG 试点；登记两个表 + 报告 `程序员\交付报告\DELIVERY_UPG64_*.md` + 已登记声明。

---

# UPG-65 A-2 门 3 灰度自动化（改造计划第二阶段·接 B 生产信号）
**分类**：M2 体系/治理


```status
phase: merged
branch: feat/upg65
head: f709ed90
std: —
delivery_id: —
designer: ✅ **设计 v2 定稿 @2026-09-02**（大神二轮 12/12 全采纳｜统计口径 v2 定稿：按 skill 去重/min20+
dev: ✅**C 完成 @2026-08-31**（feat/upg65 **f709ed9** 已 push origin[e4aa2a6 主体+
inspector: ⚠️ **错挂注记 @2026-09-05（设计师）**：以下打回段主体=feat/upg63 0580fa8，属 **UPG-63** 卡
merge: ✅ **已合 main @34c37f54（补登 @2026-09-05，设计师核物）**：=交付提交 e4aa2a6 的 patch-id
actor: sys04-backfill
updated_at: 2026-09-05T08:42:02
```

**状态**：→ ✅ **设计 v2 定稿 @2026-09-02**（大神二轮 12/12 全采纳——统计口径 v2 定稿：按 skill 去重/min20+30%/连续 3 坏熔断/技能级聚合/降级自动化恢复谨慎化/3 依赖先决）｜ ✅ 方案定稿（依据 合并版上篇 A-2 门 3 + 下篇 A2-4~A2-6；三轮纪律 5 依赖链——B 生产信号已就绪[59 已合]）→ 🔨 **可认领（可并行）** → ✅**C 完成 @2026-08-31**（feat/upg65 **f709ed9** 已 push origin[e4aa2a6 主体+registry 同步]，基线 main 2b1bb00；**三项施工范围全交付**：①灰度技能在线信号采集——`Gate3Automation.collectSignal`（journal 投影：guard/fabricate_hit 计数+isError tool/result 口径对齐 FailureEventSourceImpl+turn 窗口样本数）②阈值判定纯函数（`Threshold`：**宁严勿松红线**——编造拦截 ≥1 **零容忍**+失败率 ≥50%·**最小样本数 5 防小样本误伤**·窗口期不判定）③`autoDegradeIfSignal` 自动退化执行——evolution.DEGRADED **actor=system-deriver**（57 权限映射已授）+payload **trigger=auto autoVersion=true**（**替换 UPG-60 第一版人工触发——A2-5 自动版**）+判定不通过零写入（不误降）；**L1**：tool-orch Gate3AutomationTest 6 用例[阈值边界：编造 1 即退/失败率 50 达标 49 不退/**窗口期样本不足不判定**/自动退化 Ledger trigger=auto+可查/不通过零写入/信号采集计数]；模型假设注释 ✓（journal 失败信号代表技能质量——信号形态随模型/工具演进需重检 MODEL_UPGRADE_RECHECK 事件已备）；报告 `DELIVERY_UPG65_2026-08-31.md`；**已登记两个表**）——待验收；【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG 9e764fb）：feat/upg65 f709ed9 基底 2b1bb00；Gate3Automation 核物（collectSignal fabricate_hit/isError journal 投影+evaluate 纯函数 **minSamples=5 防误伤/fabricateHitThreshold=1 零容忍/failRatePercent=50 宁严勿松**+autoDegradeIfSignal evolution.DEGRADED **actor=system-deriver+payload trigger=auto**——A2-5 自动版替换 60 人工触发版，UPG-57 权限表消费）；tool-orch **43/0/0**[Gate3AutomationTest 6/0：边界/不误降/Ledger 审计]+memory-os 34/0/0+app 75 类 525/0/0；变异 M-65（零容忍 1→5）→「阈值宁严勿松 编造拦截 1 次即退化」红 ✅ → 待审验员合 main】；~~【⛔ **部分打回**~~——⚠️ **错挂注记 @2026-09-05（设计师）**：以下打回段主体=feat/upg63 0580fa8，属 **UPG-63** 卡内容误挂本卡（同 9e764fb 验收提交覆盖两单所致；UPG-63 的 C-6 已由 8c60f67 补齐+df00397e 复验通过整单闭环）；**本单无打回**，以此注记为界：【⛔ **部分打回 @2026-08-31**（ACCEPTANCE_LOG 9e764fb）：feat/upg63 0580fa8 基底 2b1bb00；①Z-5 ✅（c7_baseline 落档 31 文件[30 会话 jsonl+summary]——C7BaselineGenerationTest JVM 直跑真实 ApprovalService[only-once 不吃豁免=计数真实]，46 弹/分布 vault20·http8·browser6·mixed12 与申报一致）+③M-1 ✅（M1RealReplayTest 5/0——Z3-1~5 真改 EvalFixture 工具面走真实 orchestrate 消 P3-3 缺口，Z3-5 守卫分防线复证）；**②C-6 ⛔ 缺失**（multiCallTurns/ratePercent/turns 全代码零命中[35 变更文件全查]——申报与交付不符）；L1=app 76 类 526/0/0+tool-orch 42/0/0[M1RealReplay 5/0]+memory-os 34/0/0；变异 M-63（gate2 阈值 d>=2→d>=5）→「Z3-1 Selection 下降且门 2 拦截」红 ✅ → **补 C-6 统计实现+落档后复验**（①③不动）】员：阈值边界复跑+自动退化 Ledger 审计（trigger=auto/actor=system-deriver）+不误降对照 ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31 → ✅ **已合 main @34c37f54（补登 @2026-09-05，设计师核物）**：=交付提交 e4aa2a6 的 patch-id 逐字节等价重提交 ∈ origin/main——验收通过（9e764fb）后已合，「回炉待修」系 UPG-63 打回段错挂造成的假象；**本单无遗留施工，销卡**（f709ed9=registry 生成物同步 chore，生成物保鲜已由 UPG-78 CI 门禁接管）
**卡点**：无——已闭环（验收通过 @2026-08-31 + 已合 main 34c37f54；原「打回回炉」系 UPG-63 记录错挂假象，@2026-09-05 设计师核物销卡） ｜ 

## 标题
门 3 灰度退化信号自动化：fabricate_hit/isError 计数阈值触发自动回 shadow（替换第一版人工触发）。

## 施工范围
① 灰度技能的在线信号采集（生产会话中该技能调用次数/失败计数——journal 投影）② 阈值判定（失败率超阈→自动 DEGRADED 回 shadow + Ledger 事件）③ 持久化灰度计数（A2-4 非内存态）④ 阈值配置化（避免误伤：窗口期/最小样本数）⑤ 测试：信号注入→自动回退锚/阈值边界/持久化跨实例。

## 验收
A2-4/A2-5（自动版替换人工触发版）/A2-6（单查询含自动化决策）。判据细节=合并版下篇 §三 A-2。

## 红线
- 阈值宁严勿松（误回退=体验损失可接受，漏退步=信任损失不可接受）
- `<!-- 本组件编码的模型假设：journal 失败信号能代表技能质量——信号形态随模型/工具演进需重检 -->`

## 派单交接段
认领 worktree=mov-upg65 branch=feat/upg65；依赖：UPG-59（已合 ✅）；登记两个表 + 报告 `程序员\交付报告\DELIVERY_UPG65_*.md` + 已登记声明。

---

# UPG-66 A-3 Judge 扩面（改造计划第二阶段·判定三类+反哺管道）
**分类**：M2 体系/治理


```status
phase: merged
branch: feat/upg66
head: 1e604c73
std: —
delivery_id: —
designer: ✅ 方案定稿（依据 合并版上篇 A-3 + 下篇 A3-1~A3-4；独立可随时插队）
dev: ✅**C 完成 @2026-08-31**（feat/upg66 **1e604c7** 已 push origin[0438049 主体+
inspector: 【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG 9e764fb）：feat/upg66 1e604c7
merge: ✅ **已合 main@2026-09-01**（A-3 Judge 扩面｜AcceptanceJudge/M-JudgeModes/Age
actor: sys04-backfill
updated_at: 2026-09-05T08:42:01
```

**状态**：✅ 方案定稿（依据 合并版上篇 A-3 + 下篇 A3-1~A3-4；独立可随时插队）→ 🔨 **可认领（可并行）** → ✅**C 完成 @2026-08-31**（feat/upg66 **1e604c7** 已 push origin[0438049 主体+b6685e9 边界修正+registry 同步]，基线 main 2b1bb00；**四项施工范围全交付**：①三类判定——`JudgeModes`（guard）：expected **前缀模式语法**（「数值：42」→numeric 存在相等数值即 pass 数值近似/「枚举：A|B|C」→enum 含任一项 pass/「包含：关键句」→contains/无前缀=exact B1 兼容零破坏）+`AcceptanceJudge.judge(produced, expected, mode)` 重载（既有 judge 保留转发——B1 调用零破坏）+**各 ≥1 正例+1 反例**全验+**判否同样落 journal**（AgentLoop verdict 事件既有链锚——fail 也是数据）②触发降级语义保持（A3-2）——extractCriteria 既有降级（无核对动词/无标准短语/疑问词）全保留+**模式前缀空 body 新增诚实降级**（UPG-61 同款）③观察层语义回归（A3-3）——AgentLoop:536 judge 调用**传 lastCriteria.mode**（verdict 事件 mode 字段既有——**不拦截/不重试/不进模型上下文语义零破坏**）+源码锚（judge 传 mode+verdict 含 mode+criteria.expected 不进上下文）+既有 AcceptanceJudgeTest/AgentLoopE2ETest 全绿④**反哺管道**（A3-4，§6.4 B/A 边界铁律 R-4）——`ReplayFeed`：对拍失败 `propose`（**PROPOSED 队列 queued.jsonl 幂等**——同 turn 同 expected 去重；**不直接进门 2 回归集**）→ 人工审核 `accept`（ACCEPTED 条目文件**可审计溯源**）→ 进入 fixture 维护流程（EvalFixture 升版走 UPG-56 机制，无例外）；**L1**：app **76 类 533/0/1**（registry 同步后）+ 既有 AcceptanceJudgeTest/AgentLoopE2ETest 全绿（观察层语义回归 A3-3）；**同批增量**：TimelineLedger.append **单调时间戳**（同毫秒多事件严格 +1——X1-2 flaky 根修·事件链排序确定性·append-only 不破·57 交付物演进申报）；**边界修正申报**：ReplayFeed 初版误引 memory-core JsonMini——**UPG-48 呈现层零触 memory-core 红线**（MemoryDependencyBoundaryTest 抓住）→ 本地正则解析修正；模型假设注释 ✓（四类判定假设验收标准可结构化表达——自由表述留人工）；报告 `DELIVERY_UPG66_2026-08-31.md`；**已登记两个表**）——待验收；【✅ **验收员验收通过 @2026-08-31**（ACCEPTANCE_LOG 9e764fb）：feat/upg66 1e604c7 基底 2b1bb00；JudgeModes 四模式（exact B1 兼容/数值：负数小数/枚举：分隔符/包含：）+前缀语法 parse+**观察层红线判否落 journal**（A3-1）+模型假设注释；ReplayFeed（PROPOSED 队列 queued.jsonl 幂等→人工 accept→ACCEPTED 条目文件 docs/regression_feed/accepted/ 可溯源——**§6.4 与 B 线同通道**；**本地正则解析=UPG-48 边界修正申报实证**[MemoryDependencyBoundaryTest 抓住后修正]）；**TimelineLedger.append 单调时间戳**（lastIssuedTs+maxOf——**X1-2 flaky 根修**）；app 76 类 **533/0/0**[AcceptanceJudgeExtendTest **8/0**]+memory-os 34/0/0；**X1-2 根修复验：单调时间戳后全模块 3 连跑 0 红**（修复前 2/4 偶发红）✅；变异 M-66c（numeric 判定反转）→判否落 journal 锚+数值正反例 双红 ✅；P3：单调时间戳无直接断言锁（M-66 单调失效变异不红——建议补直接断言）→ 待审验员合 main】员：A3-1 三类正反例复跑（含判否 journal 锚）+A3-2 降级回归+mode 贯通源码审查+A3-4 管道端到端（propose→accept→accepted 溯源）+UPG-48 边界复核+TimelineLedger 单调 ts 契约复核 ｜ **优先级**：P2 ｜ **出单人**：设计师 ｜ **日期**：2026-08-31
→ ✅ **已合 main@2026-09-01**（A-3 Judge 扩面——AcceptanceJudge/M-JudgeModes/AgentLoop 在 main；入库链 074d8cf→5b44714 等 fix(upg66) 系列；0438049 验收交付经 rebase 内容级合入——E4「待合」为库缺 G 段误报已消）

## 标题
AcceptanceJudge 判别面扩展：exact 之上加数值/枚举/包含三类判定 + 对拍结果反哺门 2 回归集（经 B/A 边界审核事件）。

## 施工范围
① 三类判定实现（数值近似/枚举命中/包含匹配——各 ≥1 正例+1 反例，判否同样落 journal）② 触发降级语义保持（不命中模式=null 诚实降级，A3-2）③ 观察层语义回归（不拦截/不阻断流式/expected 不投影，A3-3）④ 反哺管道（用户对拍数据→审核事件→进门 2 回归集，A3-4，走 §6.4 边界铁律）。

## 验收
A3-1~A3-4。判据细节=合并版下篇 §三 A-3。

## 红线
- 观察层语义不破（不拦截不重试不进模型上下文）
- 反哺必经审核事件（V-3 边界）
- `<!-- 本组件编码的模型假设：exact/数值/枚举/包含四类判定假设「验收标准可结构化表达」——自然语言自由表述判定留人工 -->`

## 派单交接段
认领 worktree=mov-upg66 branch=feat/upg66；依赖：无（独立，随时可插）；登记两个表 + 报告 `程序员\交付报告\DELIVERY_UPG66_*.md` + 已登记声明。

---

# UPG-67 D 线 DAG 编排试点（改造计划第三阶段 · 预立待前置）
**分类**：M2 体系/治理


```status
phase: merged
branch: feat/upg67
head: 040c9d9d
std: —
delivery_id: —
designer: ✅ 方案定稿（依据 合并版上篇改造线 D + 下篇 D-1~D-5 + §十三 执行细则）
dev: ✅**C 完成 @2026-08-31**（feat/upg67 **040c9d9** 已 push origin[a88510a 主体+
inspector: 【✅ **验收员验收通过 @2026-09-01**（ACCEPTANCE_LOG 6f330b5）：feat/upg67 040c9d9；
merge: ✅**已合 main @2026-08-31**（§六抽查=DagPlanner cycle 拒绝[Kahn 失败→Reject 不 han
actor: sys04-backfill
updated_at: 2026-09-05T08:42:01
```

**状态**：✅ 方案定稿（依据 合并版上篇改造线 D + 下篇 D-1~D-5 + §十三 执行细则）→ 📌 **预立待前置（双门，齐一才放行）**：①UPG-64 效应注解合入 ②评测集性能维度落地验收——**任一不满足 = 按 D-1 显式留痕降级观察项（不算失败）**→ 🔓 **放行可认领 @2026-08-31**（设计师定夺：门① UPG-64 已合 main[115762d is-ancestor 实证]✅；门② 性能维度=**67 首项施工交付**[§13.1，非外部前置]——前序「双门全齐」表述更正：门②不是已满足的前置，而是本单开工后第一个交付物[确定性判据：同输入两次运行逐位一致]；D-1 降级条款持续有效：性能维度验收不过仍按原判据降级观察项）→ 📌 **可认领**（worktree=mov-upg67 branch=feat/upg67；开工首项=性能维度 EvalCase.mockCostMs+Metrics 扩列[§13.1]；五项范围：性能维度→DagPlan→调度→对照实验→真机采样）→ ✅**C 完成 @2026-08-31**（feat/upg67 **040c9d9** 已 push origin[a88510a 主体+registry 同步+Z-5 基线落档随件]，基线 main 4b5f65f；**五项施工范围全交付**：①性能维度先行——mock clock 常数表（查询 300/写 500/外呼 800 §13.1）+Metrics 双列 **makespanMs（关键路径 mockCost 之和）+serialMs（串行对照）**——**D-1 确定性：同输入两次运行 makespan/layers/edges 逐位一致**（mockCost 无抖动；EvalCase mockCostMs 字段以 DagPlanner.mockCostMs 常数表承载——per-tool 常数即 mock 耗时模型）②DAG 构建器（D-3）——`DagPlanner`（tool-orch）：DAG 节点/边三层[**DATA_FLOW**（`ref(nodeId,field)` 引用推导）/ **EFFECT_ORDER**（写读冲突同资源域排序）/ **SYNC**（WRITE×EXTERNAL 全序化）]+**Kahn 拓扑分层**（同层并行、层间衔接）+**循环 ref → Reject（reason=cycle）拒绝不 hang**（buildPlan 抛 IAE）③效应消费（V-5/D-4）——效应注解（EffectSpecRegistry 首批 20）消费：WRITE×EXTERNAL 节点**确认门清单+独占层（零并行）+SYNC 全序化**；未登记工具**保守缺省 WRITE×EXTERNAL**（确认门+全序化）④**D2 三列表对照**：延迟（600→300 并行收益）/调用量（DAG 一次规划 vs ReAct 轮数）/正确率（六指标基线不降——Selection/SafetyGate ≥0.8 锚）⑤**形态契约**：DAG 仅为 MULTI_CALL 路径内部形态升级——**ToolOrchestrator 对外契约/Trace/Code Mode 零变化**（build 为新入口未改 orchestrate 主链）；**过程修复如实申报**：边推导**字典序剪枝 bug**（`if (a.nodeId >= b.nodeId) continue` 把 ticket>note 序 pair 跳过——DATA_FLOW 推导被吞，诊断打印定位）→去剪枝全 pair 对称遍历+测试 cast 统一走 buildPlan（Reject 抛 IAE）；**L1**：tool-orch 8 类 **65/0/0**[DagPlannerTest 9 新：D3-1/D3-2/D3-3/D4/D1/D2/未登记保守缺省/mockCost 表]+app 526/0/1+memory-os 34/0/0[registry 同步 040c9d9]；模型假设注释 ✓（DAG 收益假设「无依赖步骤占比足够高」——UPG-63 分布统计与首批实测证伪即降级）；报告 `DELIVERY_UPG67_2026-08-31.md`；**已登记两个表**）——待验收；【✅ **验收员验收通过 @2026-09-01**（ACCEPTANCE_LOG 6f330b5）：feat/upg67 040c9d9；五项核物（①mockCost 常数表+makespan/serial 双列 D-1 确定性②DagPlanner 三层边 DATA_FLOW/EFFECT_ORDER/SYNC+Kahn 分层+**cycle 拒绝不 hang**③effectOf 消费 Registry+未登记保守缺省④D2 三列表⑤形态契约主链零改动）；**关键修复申报核实**=全 pair 对称遍历落地（字典序剪枝 bug 已修）；tool-orch **10 套 67/0/0**[DagPlannerTest **8/0**]+memory-os 34/0/0+app 540/0/0；变异 **3/3 全杀**（M1 cycle 静默吞→D3-3 红/M2 SYNC 失效→D3-1 红/**M3 剪枝 bug 回归→D3-3+D3-1 双红=回归锚有效**）；**P3 基底申报偏差**：申报「基 main 4b5f65f」实测=**115762d（64 tip）**——合 main 顺序 **64 先行、67 rebase 跟进**；L2 真机采样待环境恢复 → D 线就绪，待审验员处理】员：D3-1/2/3 复跑（ref 引用/并行收益/cycle 拒绝）+D4 写类治理（确认门/独占层/SYNC）+D1 确定性两次逐位一致+D2 三列表+六指标底线对照+形态契约审查（orchestrate 主链零改动）；**真机采样步骤**：模拟器可用时补 L2（构造 MULTI_CALL 会话 journal+DAG 规划对照采样）——当前全 JVM 契约已覆盖 ｜ ✅**审验通过 @2026-08-31**（统计 42→43：代码核物五项全坐实[三层边/Kahn cycle 拒/mockCost 常数表/makespan 关键路径/效应消费]+L1 独立重跑[tool-orch 10 套 67/0/0+memory-os 34/0/0+app 540/0/0]+变异 3/3 复杀[M1 cycle 静默吞→D3-3 红/M2 SYNC 失效→D4 红/M3 字典序剪枝复入→D3-3+D3-1 双红]+形态契约 a88510a 仅 3 Kotlin 文件主链零改动+基底实证建于 115762d；P3×4[M2 用例标注偏差建议验收记录更正/DagPlannerTest 申报 9 实 8/DiagDagTest 调试残留无害/L2 真机采样待环境]）→ ✅**已合 main @2026-08-31**（§六抽查=DagPlanner cycle 拒绝[Kahn 失败→Reject 不 hang]/mockCost 常数表确定性[300/500/800]/模型假设注释 亲核✓；**原生 ff 零 rebase**——分支本就建于 main 顶 115762d 之上，审验「rebase 跟进」表述修正；040c9d9 已推 origin[main 同链推]；合前 040c9d9 树全量 BUILD SUCCESSFUL 亲跑绿[app 540/0/0+tool-orch 67/0/0+memory-os 34/0/0]；**三阶段改造计划全部闭环**） ｜ **优先级**：P2（第三阶段） ｜ **出单人**：设计师 ｜ **日期**：2026-08-31

## 标题
DAG 编排试点：ToolOrchestrator MULTI_CALL 路径升级——一次生成带依赖的执行计划，无依赖步骤并行、有依赖自动衔接、写类节点治理。

## 背景（为什么排最后+为什么值得做）
ReAct 多轮（问→等→再问）每轮一次模型调用——慢、贵。D 线一次生成 DAG：无依赖并行（查三班次同时发）、依赖按 ref 衔接、写类（WRITE×EXTERNAL）零并行零自动重试。**前置双门**（四轮评审钉死）：①效应注解（未登记工具保守串行——覆盖率不足则收益被吃掉）②评测集性能维度（六指标只测正确性；无性能维度则只能得「不劣化」结论得不了「值得做」）。

## 施工范围
① 评测集性能维度先行：EvalCase 增 mockCost（逻辑耗时模型）+ Metrics 扩 latencyMs/toolCalls 两列（**确定性 mock clock**——同输入两次运行逐位一致，D-1）② Decision.MULTI_CALL 输出升级 DagPlan：nodes（工具+参数 ref(u,field) 引用）+ edges（数据流/效应冲突/同步三类）③ 调度：效应感知（READ 并行/WRITE 串行化/EXTERNAL×WRITE 走确认门）+ 循环 ref 拓扑排序失败即拒绝**不 hang**（D-3）④ 对照实验：串行现状 vs DAG 并行三列表（延迟/调用量/正确率——D-2；正确率底线=六指标+SafetyGate 不降）⑤ 真机采样（D-5：≥30 条多步会话 journal 耗时，对照期 vs 部署期）。

## 验收
D-1~D-5（细则=合并版 §十三）+ X-4（D 线单独 PR 单变量）+ 模型假设注释行。**「实测下降」唯一口径=真机 journal 采样（D-5）——mock clock 结论只允许声明「不劣化」**。

## 红线
- 论文 63-67% 延迟降**不可引用**（全串行基线 vs MOV 未知并行度）
- 循环 ref 拒绝不 hang（D-3）
- WRITE×EXTERNAL 节点零并行零自动重试（V-5）
- 正确率底线：六指标+SafetyGate 不降（D-2）
- `<!-- 本组件编码的模型假设：DAG 收益假设「无依赖步骤占比足够高」——UPG-63 分布统计与首批实测证伪即降级 -->`

## 派单交接段
**本单不开放认领**——开工准入由设计师在 UPG-64 合入+性能维度验收后显式放行（放行=工单表状态改「可认领」+Ledger 事件）；worktree=mov-upg67 branch=feat/upg67；降级条款触发时本卡状态改「⛔ 降级观察项（留痕）」；登记两个表 + 报告 `程序员\交付报告\DELIVERY_UPG67_*.md`。
---

# UPG-68 商业安全闸（原「商业防线批」——W2 白名单自动闸 + 商业面 fail-open 集中收口）
**分类**：M1 安全/合规


```status
phase: merged
branch: feat/upg68
head: c2defad4
std: —
delivery_id: —
designer: ✅ **设计 v1 定稿 @2026-09-01**（`设计师\方案设计\05_审批\审批白名单机器可读化与注册即校验_设计_v1_2026
dev: ✅ **C 完成 @2026-09-02**（补充节 V68-8/V69-4 补验：feat/upg68 `8380108`；变异亲杀 4/
inspector: ✅ R1 复验带缺陷通过 @2026-09-01（feat/upg68 35b0008｜HIGH/M1/M2 三缺口 security_re
merge: ✅ **已合 main @c2defad @2026-09-02**（rebase origin/main 零冲突 + ff；V68-8/V
actor: sys04-backfill
updated_at: 2026-09-05T08:42:01
```

**状态**：✅ **设计 v1 定稿 @2026-09-01**（`设计师\方案设计\05_审批\审批白名单机器可读化与注册即校验_设计_v1_2026-09-01.md` + `契约管理\商业模块_漏洞预扫描_2026-09-01.md`）— ✅ **已认领 @2026-09-02（用户拍板：先做，商业契约 CT-13/14 后续补——安全性先落地；worktree mov-upg68·分支 feat/upg68·基底 ec58b5a=main 最新；认领人名字待补）**——📌 施工中（P0·3~5 工作日；CT-13/14 契约后补不阻塞）
→ ✅ **已合 main @c2defad @2026-09-02**（rebase origin/main 零冲突 + ff；V68-8/V69-4 全量 618/0/1 BUILD SUCCESSFUL；DEL manifest 已清——红线 23 齐） ｜

**卡点**：——合 main 后无遗留卡点 ｜ ✅ **已合 main @c2defad**（rebase origin/main 零冲突 + ff；V68-8/V69-4 全量 618/0/1 BUILD SUCCESSFUL）
 → 方案 v3 定稿 @2026-09-01（二轮大神 9.1/10 可批）→ ✅ R1 复验带缺陷通过 @2026-09-01（feat/upg68 35b0008——HIGH/M1/M2 三缺口 security_review 复审 pass+代码级+ask 模式真机 APPROVE）→ ⚠️ **新判据补充验 @2026-09-02**（STD 增补 V68-8 open 模式 fail-closed 不失效 + V69-4 token 下发链单入口——B 线需按新判据补验后重新交付验收）→ ✅ **C 完成 @2026-09-02**（补充节 V68-8/V69-4 补验：feat/upg68 `8380108`；变异亲杀 4/4 变红实证；全量 618/0/1；交付报告 `程序员\交付报告\DELIVERY_UPG68_2026-09-02.md`；c7_baseline 已清——待验收，合 main 待设计师）

**v3 定稿 @2026-09-01（二轮大神 9.1/10 可送审：补 A7 后冻结——A7 单执行通道不变量+V68-7/V69-2a 凭证单入口/Commercial Entry Gate 六条硬门禁/V69-3 状态机完整回归；B 分级表+E KISS 冻结）**

**范围 = UPG-68 原案 + 商业安全闸（用户拍板合一；A~E 五子项+商业门禁项）**：
- **A 白名单自动闸**（原 UPG-68 主体）：CT-07 机器可读化（单源 ApprovalRegistry.json + schema）+ `UNKNOWN→ASK` fail-closed + CI 注册即校验（V68-1~6）
- **B biz.* 补登记**：task/booking/onboard 全套写类入名单（onboardSubmit/onboardSet 敏感级——AI 免审批进件=最严重缺口）
- **C PARTNER_AUTH_TOKEN 去硬编码**：迁 CredentialStore（Keystore）+ 服务端下发（源码零硬编码断言）
- **D vault 全族收口**：vault.set/credSet/setPhoto/scanPhoto 补登记 + vault.get 伪放行修复（allowed-remembered/turn 一致）
- **E 商业凭证明文治理**：mov_biz/mov_login token 迁 Keystore（与 F4 方针对齐）

**级别**：P0（安全） ｜ **STD 增补 @2026-09-02**：V68-8 open 模式 fail-closed 不失效 + V69-4 token 下发链单入口（安全审查判据盲区补位——设计 §四 已增补）（安全缺口——W2 两度漏网：approval.setMode/personalization.setEnabled；商业/支付 handler 进场=漏钱风险）

**来源**：契约体系发大神评审（弱项 W2）→ 大神裁决 Q3「CT-07 白名单开路」→ 契约改造方案 v1 分项 A（G1+G2 合并落地）

**判据**（设计 §四）：
- V68-1 UNKNOWN→ASK fail-closed（else→ALLOW 变异必红）
- V68-2 registry 全量登记（条目数=工具面数，schema 校验 0 错）
- V68-3 注册即校验（新 handler 未登记 → CI 红）
- V68-4 既有语义不变（全量 500+ 绿；BP-03 两历史案例→ASK；UI 直调豁免不变）
- V68-5 单源（guard() 不依赖代码内三名单；docs/contracts/ 不存在）
- V68-6 只读不误弹（read 类已登记 → FREE）

**范围红线**：不扩功能（不新增模式/名单类型/不动 approval UI）；UI 直调豁免保持；FULL_ACCESS isHighRisk 语义不变

**关键设计点**：单源=现有 `docs/ApprovalRegistry.json`（生成物，不新建第二份）；UNKNOWN→ASK 是修复安全核心；CI 校验器=G2 并入 G1 最小闭环

**送审/验收口径**：V68-1~6 L1 + 变异亲杀（else→ALLOW 还原必红）；L2 真机补（漏登记 handler ASK 实测）
- ❌ **验收员打回 @2026-09-01**（ACCEPTANCE_LOG §P22：全量 603/0/1 亲跑一致；security_review 实证 **HIGH**=C 项 partner token 匿名下发[MainActivity:4796 无客户端认证→秘密性未达成]+**MEDIUM-1**=open 模式 vault 伪放行[only-once 仅 ASK 分支生效，FULL_ACCESS 直 ALLOW]+**MEDIUM-2**=registry credPeek 系 free 未同步 dsh 硬拒名单[单点依赖宿主注入]；fail-closed 主链/迁移完整性通过；**52 文件未提交[红线 23 无法绑 hash]**——修完 commit 报 hash 重验；STD 需增补 open 模式+匿名下发场景用例→设计师）
- ✅ **R1 复验 带缺陷通过 @2026-09-01**（ACCEPTANCE_LOG §P22-R1：feat/upg68 35b0008 已 commit；HIGH/M1/M2 security_review 复审 pass[匿名下发绑定设备凭据+only-once 前置恒 ASK+三层名单一致]+ask 模式真机 APPROVAL_REQUIRED+logcat 下发静默实证；全量 606/0/1 亲跑；LOW×3 残余[服务端配合转办+setMode 纵深+isHighRisk 大小写]；P3 never 模式 UI 端到端补验；**达待合状态→设计师**）

**与契约体系联动**：CT-07 语义分类契约机器可读化第一例（schema 随施工落盘）；契约改造方案 v1 分项 A 实施单


# UPG-69 WebMCP 站点试点（mow.kim 工单站「站点=业务工具」第一站）
**分类**：M4 工具/MCP 集成


```status
phase: dispatched
branch: —
head: —
std: —
delivery_id: —
designer: 已派单（用户直接外派 @2026-09-05——撤销改向挂起，原 mow.kim 工单站口径继续）
dev: —
inspector: —
merge: 改向挂起：试点职能由 UPG-105 批二承接，工单三工具留商家后台线
actor: 设计师
updated_at: 2026-09-05T09:24:35
```

**状态**：📌 新立 @2026-09-02（用户拍板：App 内浏览器先 MCP 改造——站点侧并行试点）——待派单可认领 ｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-09-02 → ⏸️ **改向挂起 @2026-09-05（用户拍板官网双层设计后设计师重评）**：mow.kim 已退居后台管理，「站点=业务工具」第一枪/对外名片=mov-ai.cn 官网（UPG-105 批二 A 通道活端点承接试点职能）；本卡工单三工具场景保留给**商家后台线**（挂账-MerchantAgent 方向），后台线启动时复活；设计资产（W1-W6 判据/契约/审批闸/域隔离）平移至批二可用
**卡点**：挂起中——待商家后台线启动复活
→ 🆕 **用户拍板开工 @2026-09-05**（「UPG-69 开工」——复活本卡按原派单文施工：mow.kim 工单站 3 工具 mov_openTicket/mov_queryTicket/mov_listOrders+window.mov_webApi 注册表+契约 v0.1[43a 已合 main——W2 端到端可闭环]；程序员 Claude/wmw0027 认领，worktree mov-upg69，branch feat/upg69，基 origin/main 97d7ca31；判据 W1-W6+变异 ≥3[过闸/隔离/登记对账]） ｜ 
→ ✅**C 完成 @2026-09-05**（feat/upg69 **f5e7212a** 已 push origin，基 main 97d7ca31；**站点三件**[market-web/tickets.html 工单工作台+webapi-tickets.js mov_webApi 注册表 3 工具契约 v0.1+account-service tickets 表与 3 端点 POST /tickets+GET /tickets+GET /ticket Bearer fail-closed]+**App 侧**[WRITE_TOOLS 登记 mov_openTicket——43a 预留锚激活+WebMcpHubTest +2 对账锚 26/0]；**变异 ≥3 亲杀**[W4 WRITE_TOOLS 移除红/W5 注册表删工具红/W6 43a H5 域隔离锚既有]；**服务端全链 curl 实证**[开单/查单/列表真数据+401]；**部署完成**[静态 /var/www/market-web 两文件 200×2+服务端备份 .pre-upg69→restart active<5s——线上新端点 401 在线实测]；判据 **W1/W4/W5/W6=FULL+W2/W3 端到端转持有**[ConnectWeb 打开通道受限如实申报——验收员在 App 内让 AI 用浏览器打开 /tools/tickets.html 一次即可验工具面]；Token/KV 0/0；**DEL 绑定挂起注记**[STD-UPG69-v1 未随派冻结——deliver-gen 硬闸拒——判据 W1-W6 为设计师定稿建议固化落冻结区后 DEL 闭环——程序员不自拟标准]；报告 DELIVERY_UPG69_2026-09-05.md；证据 UPG69-evidence 5 份+线上实证）——待设计师 STD 补冻+验收员验收

**范围**（试点=最小闭环，非全量）：

- **mow.kim 工单工作台站**暴露 3 个 `mov_*` 业务工具（WebMCP 协议 v0.1——UPG-43 与 UPG-69 共定契约）：
  1. `mov_openTicket`——开工单（标题/描述/来源站）
  2. `mov_queryTicket`——查单（单号/状态/进度）
  3. `mov_listOrders`——订单列表（最新 N 条）
- **协议形态**：页面脚本 window.`mov_webApi` 暴露（`{ name, desc, schema, handler }` 登记表）→ 注入层（agent-layer.js 同层）代理转发；命名= `web.mow.kim.<mov_工具名>`
- **只读口径**：mov_queryTicket/mov_listOrders 只读；mov_openTicket 写（须过审批闸——Gatekeeper 单执行通道，不豁免）
- **与 UPG-42 关系**：本卡=42 的试点先行（42=全量站点+10 工具+市场注册——后行；本卡不展开注册制）

**验收判据**（挂 STD-UPG69-v1，随派单冻结）：

- W1：工作台站页面内 `window.mov_webApi` 登记表 3 工具齐全（schema 完整 3 工具）
- W2：App 内浏览器打开 mow.kim → AI 工具面出现 `web.mow.kim.mov_openTicket/mov_queryTicket/mov_listOrders`（命名空间前缀锚）
- W3：AI 调用 mov_queryTicket（只读）→ 返回真实数据（工具面调用链：AI→MCP→proxy→页面 handler→JSON 回程；卡片投影可见——UPG-40 视觉反馈纪律）
- W4：mov_openTicket（写）→ 过审批闸（无审批上下文=ASK/拒绝——不允许静默放行；变异：移除闸→红）
- W5：命名/契约与 UPG-43a 对齐（同版本基准文件——两单共引）；3 工具在站点侧登记+App 侧解析一致（机器对账）
- W6：cross-site 隔离（其他站不受影响——非 mow.kim 页无 web.mow.kim.* 注入，变异：注入泄漏→红）

**红线**：不扩功能（只 3 工具试点）；写类过闸；U PG-42 注册制不做；站点数据全部经登录态（不绕过认证——mov_* 工具必须走已登录会话）；契约版本 v0.1 冻结在派单（改版=新单）。

**交付**：分支 `feat/upg69`（网页建设系仓库——mow.kim 工作台前端）；交付报告 + 变异亲杀（W2/W4/W6 至少 3 条）+ 登记两表。

---

# UPG-70 UI 组件化改造 · 地基（单一数据源/形态类归层/规范对齐）
**分类**：M8 UI/交互 ｜ 标签：M2 体系/治理


```status
phase: merged
branch: feat/upg70
head: b47ecb84
std: —
delivery_id: —
designer: **裁决**（用户拍板 2026-09-02）：基线 2 失败=**契约锚同步修**（AppearanceContractTest 适配收拢
dev: —
inspector: **验收**：验收员复验 带缺陷通过 @2026-09-02（ACCEPTANCE_LOG §P26：b47ecb8 隔离 worktree
merge: ✅ 已合 main @667cc80（feat/upg70 b47ecb8 cherry-pick 667cc80）｜ DONE
actor: sys04-backfill
updated_at: 2026-09-05T08:42:01
```

**状态**：✅ 已合 main @667cc80（feat/upg70 b47ecb8 cherry-pick 667cc80）｜ DONE｜ **优先级**：P2
→ **审验**：✅ 通过 @2026-09-02（integrity_review=confirmed，与 ACCEPTANCE_LOG §P26 一致——合入版 667cc80 与 b47ecb8 patch-id 等价逐字节一致；基线 2 失败亲跑对照坐实=收拢版带病预存、UPG-70 零新增失败；A1/A2 核物全坐实）；3 条 P3 不阻塞（①交付报告落点已移 程序员\交付报告\ ②manifest 缺口→挂账 ③autocrlf 误报→CI 权威）
→ **验收**：验收员复验 带缺陷通过 @2026-09-02（ACCEPTANCE_LOG §P26：b47ecb8 隔离 worktree 复验 683/2/1 亲跑——基线 2 失败实证预存[merge-base b3fdcf9 对照 16/2 同红=收拢版带病，非本单引入]；A1 单一数据源+audit 亲跑[27 页/52 档/scoped 冲突 0]）
→ **裁决**（用户拍板 2026-09-02）：基线 2 失败=**契约锚同步修**（AppearanceContractTest 适配收拢版硬编码 px 现实）→ 归属**阶段 1 维护单**；收拢版带病合入**责任链另查**（挂账）；记录=UPG70_裁决记录_2026-09-02.md
→ **合入链**：15e53e6 → b3fdcf9（收拢版）→ 33ed4d9（assets 全量同步）→ 667cc80（UPG-70）；install-upg70-hooks.sh 已装（core.hooksPath=.githooks）
→ **依据**：2026-09-02 调研 GitHub 成熟方案（Vant4/Ark+Uno/shadcn-vue）后，用户拍板先修地基；大神两轮评审：v1 一轮（5 补强+3 前置）→ v2 二轮 9.2/10 可开工，采纳 4 口子——①「全等」=业务字段一致（表示差异不算漂移）②`order` 唯一排序依据（生成器禁按 id/name 重排）③处置结果三态=改代码|改规范|暂不调整（带原因）④A3 试点 5 项验证表（禁一次迁 10 页）+施工原则「本卡解决数据从哪来，不解决数据本身正确」；口径=`UI组件化改造_地基_方案_v2.1_2026-09-02.md`

## 标题

UI 组件化改造地基：①组件目录单一数据源（JSON schema 生成 Kotlin+Vue+断言）②形态类归层（SETTINGS 收编 tokens.css）③规范与实现对账；统一页面宿主为 B 阶段可拆单

## 背景

用户对 App UI 呈现不满意（「展现呈现上面还是很垃圾」），要求先调研 GitHub 成熟方案再动。调研发现真正问题不是缺组件库，而是本地工程五条病根：目录双份手写（UiComponentCatalog.kt vs AppearanceApp.vue 不同构）、形态类定义分散（tokens.css/SettingsPage scoped/大页面写死）、无组件运行时（prefix-variant 只是 class 约定）、10 页面入口割裂（WebView/桥/主题注入重复）、规范与实现漂移（--primary 规范深绿 vs 实际灰黑）。

## 范围

- **明确边界**：本轮**不建设组件运行时/注册机制**（病根 3 明确延期=另立卡）；只统一**目录**与**形态层**。
- **施工原则**：本卡解决「数据从哪里来」，不解决「数据本身是否正确」——A1 严禁顺手改组件名/variant/编号（那是产品设计重构，另立单）。
- A1（本单核心）：`前端设计/mov-vue/src/catalog/ui-components.json` 单一目录源（`version`+字段注释；semanticType/provider=现有目录元数据、不新增半截运行时字段；**`order`=唯一业务排序依据，生成器禁按 id/name 重排**）+ `scripts/gen-ui-catalog.mjs` 生成 Kotlin `UiComponentCatalog.kt` + Vue `COMPONENTS` 段 + 断言；**「全等」判定=业务字段集合及顺序语义一致（id/name/kind/prefix/variants/defaultVariant/site/order/provider/semanticType）——Kotlin 类型定义/Vue 导出包装/注释/import=生成表示差异不算漂移**；防漂移三层=DO NOT EDIT 头+pre-commit+CI `gen-ui-catalog && git diff --exit-code`；双写归零。
- A2：SETTINGS 族形态类从 SettingsPage.vue scoped 迁入 tokens.css 形态层；**先影响面清单 → 用户裁决，处置结果三态=改代码|改规范|暂不调整（必须带原因）**；Motion/z/elevation/inset token 落库或删除；产出 `tools/ui-catalog-audit.mjs` 未接入页面清册 + 对账表（漂移项/处置结果三态+原因/影响面）。
- A3（B 阶段）：**红线=禁止一次迁 10 页**；先 SettingsSheet 做 PageHost 试点，**验收=旧实现 vs PageHost 实现 5 项表**（WebView 创建/AssetLoader/Bridge 可复用；Theme 注入可复用或明确差异点；生命周期返回销毁无行为回归）→ 试点结论→拆多小单。
- 不做：不引 Vant/Ark/UnoCSS（下一阶段另议）；不建设组件运行时；不改组件视觉（A2 token 对齐例外——先影响面评估+三态裁决）；不改 20 条编号/52 档数据（内容治理另立单）。

## 验收锚

- A1-1：唯一目录源（grep 断言无第二份目录数据）；A1-2：改 schema 重新生成→Kotlin+Vue 同步（按「全等=业务字段一致」判定）；A1-3：手改生成物→断言红（亲杀）；**A1-4**：CI `gen-ui-catalog && git diff --exit-code` 通过（证据落交付报告）；**A1-5**：生成物顺序与 JSON `order` 完全一致（无 id/name 重排）。
- A2-1：SETTINGS 形态类在 tokens.css、scoped 无残留；**A2-2**：影响面清单（消费待对齐 token 页面/组件+差异说明）；**A2-3**：对账表三态（漂移项/处置结果[改代码|改规范|暂不调整+原因]/影响面）。
- **A3-0**：PageHost 试点结论（5 项验证表全过或差异点明确）——通过才拆小单。
- 登记=设计师单写点；xlsx 生成物禁手改（sync 生成）；不破坏 UPG-50 阶段 2 已派工作。

**红线**：登记=设计师单写点；xlsx 生成物禁手改（sync 生成）；生成物带「DO NOT EDIT」头；禁止一次迁 10 页；不破坏 UPG-50 阶段 2 已派工作。

**交付**：方案文档 `01_外观/UI组件化改造_地基_方案_v2.1_2026-09-02.md`（v1/v2 归档留指针）；卡：UPG-70

---

### 📦 施工交付登记（2026-09-02 · feat/upg70 · 未合 main）
- **派单执行**：A1（目录单一数据源）+ A2（SETTINGS 形态类归层）已实施完毕，交付报告落 `工单流转中心/验收/UPG70/UPG70_交付报告_2026-09-02.md`。
- **验收锚自证**：A1-1..A1-5 全过（双写归零 grep 断言 / 重生成同步 spec diff=0 / 手改生成物亲杀覆盖 / CI workflow 已建待合 main 实跑 / order 升序断言）；A2-1 scoped 残留=0（grep 实证）+ tokens.css 8 规则；A2-2 影响面清单 / A2-3 三态表 见交付报告。
- **红线遵守**：未引 Vant/Ark/UnoCSS；未建组件 runtime；未改 20 条编号/52 档内容；未动外观收拢版视觉；未顺手改组件名/variant。
- **测试**：683 JVM 用例 2 失败 = 基线预存（L1-10 / M-U50-5，HEAD b3fdcf9 实证一致，stage-1 契约 vs 收拢版样式存量冲突）→ 登记待设计师核实；vue build 通过。
- **待设计师**：① 核实 ⏳ 基线 2 失败裁决 ② 合 main（CI upg70-catalog.yml 首跑= A1-4 终证）③ 顶部状态行从「方案定稿」翻为「已施工待验收」。
- **交接**：`scripts/install-upg70-hooks.sh`（core.hooksPath .githooks，多 session 共享区——确认全局预期后跑）。


---

# UPG-71 元能力注册表 · 地基（MVP 资产 + Schema + 校验脚本）
**分类**：能力线 · 元能力注册表（地基）

```status
phase: merged
branch: feat/upg71
head: 43fd00a2
std: —
delivery_id: —
designer: —
dev: —
inspector: ✅ **审验 通过 @2026-09-02**（integrity_review 与 §P27 一致｜L1①/②/④/⑤ 亲跑全坐实；观察
merge: ✅ 已合 main @43fd00a（feat/upg71 快进合入+已 push）｜ DONE
actor: sys04-backfill
updated_at: 2026-09-05T08:42:01
```

**状态**：✅ 已合 main @43fd00a（feat/upg71 快进合入+已 push）｜ DONE｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-09-02 → ✅ **验收员复验 通过 @2026-09-02**（ACCEPTANCE_LOG §P27：43fd00a 隔离 worktree——check 亲跑通过[4 能力+计数/枚举/占位全过]+变异「删必填」亲杀 EXIT=1→还原复绿+全量 683/2 基线预存引用 §P26 同一基线实证+diff main 仅 3 新增；L2 装配级申报如实）→ ✅ **审验 通过 @2026-09-02**（integrity_review 与 §P27 一致——L1①/②/④/⑤ 亲跑全坐实；观察 #2=生成器产物漂移 [ApprovalRegistry 生成物 stale——与 §P25 P2-A2 同根] 判定=main 基线预存治理缺口，非本单引入、不阻塞）｜ **生成器漂移防护**：⏳ 挂账待转工单（挂账-生成器产物漂移防护；建议=产物入库+CI git diff=0 断言=UPG-70 A1-2 模式推广）

## 标题
把「元能力注册表」（业务语义粒度：动词+对象域+副作用契约，工具粒度之上的能力层）落成 0027-mov 正式资产 + JSON Schema + 校验脚本；为 bundle/job 确定性编排留地基（LLM 查表接线、bundle/job 契约落代码 = 后续接线单，有消费者再动运行时）。

## 背景（设计稿定位 + 对账）
设计稿 v0.3：能力层（元能力注册表：能做什么/副作用）+ UI 层（卡片渲染），共享哲学=一次实现多处复用、引用不复制。MVP 试跑组合=`fulfill.dispatch`(WRITE/EXT)+`fulfill.track`(READ/EXT)+`settle.pay`(MONEY/EXT)+`sense.capture`(WRITE/LOCAL·candidate)——副作用三级全覆盖。
**对账（防重复施工，已核实）**：现有 `docs/ApprovalRegistry*.json`（UPG-45，工具级审批登记）、`tool-orch` EffectSpecs/DagPlanner（UPG-46/67，工具编排/副作用）均为**工具粒度**；本单是**业务语义粒度独立地基**，不与它们混、不清改它们；合并评估另立单。0027-mov 现无 capability-registry 资产/模块 → 新开无重复。
样例资产（施工迁移基准）：`归档\历史文档\执行链路_2026-09-02\MOV_元能力注册表_MVP示例.json`。

## 施工（照派单文本）
1. 建 `docs/capability-registry/capability-registry.json`：迁移 4 条 MVP；字段=id/name/semantics/domain/side_effect/env/idempotent/in/out/state/owner/evidence/consumers/impls。
2. 建 `docs/capability-registry/capability-registry.schema.json`：JSON Schema draft-07——枚举 side_effect/env/state/consumer_type、required、结构、domains 一致性；consumers 独立性计数（按 domain_context 去重）机器可读。
3. 建校验脚本 `scripts/check-capability-registry.mjs`（并列 check-token-effect.mjs）：schema 校验 0 错 / registered 必 ≥2 独立消费者 / candidate 允许 1 / 枚举不越界 / 禁占位串残留（`{样例`/`占位`→红）/ 输出汇总供人读。
4. 交付含 hash + 证据链；报告落 `程序员\交付报告\DELIVERY_UPG71_*.md`；自跑 `node scripts/check-token-effect.mjs`。

## 验收
- **L1**：① check-capability-registry 对正式资产 0 报错、汇总正确 ②变异亲杀（篡改副本：枚举越界/registered 独立消费者减到 1/删必填/塞 `{样例占位}` → 必红）③全量绿 `gradle :app:testDebugUnitTest` + assembleDebug ④check-token-effect 过 ⑤零冲突（git 确认未动 ApprovalRegistry*/tool-orch src/MainActivity.kt）。
- **L2 真机**：纯资产+脚本无 UI/运行时接线 → 如实标「装配级：assembleDebug APK 正常 + 校验命令输出实证」；行为级真机验收留接线单。
- **L3**：与 UPG-01 元数据/UPG-45 ApprovalRegistry/UPG-46+67 tool-orch 语义零冲突（纯新增，无引用不清改）。

## 红线
1. 零运行时改动：不动 MainActivity.kt（纯 CRLF，本单禁 Edit）/AgentLoop/McpToolScheduler/ApprovalService/tool-orch src/`docs/ApprovalRegistry*.json`。
2. 请求链路不变：Token/KV Cache 影响 = 0/0；AI 面 tools/system prompt 会话中途不变（请求前缀恒定）。
3. 正式资产禁占位串/编造：impl 不可核实 = 空数组 + note「待外部/自营接入（接线单补）」；语义契约与样例一致，不擅改 semantics/in-out。
4. 冻结项（room.html/markstream/二维码收费/本地大模型/视频卡片）不碰。
5. 交付必含 Token 影响 / KV Cache 影响两节申报（AGENTS.md 硬规则 1）。

## 派单交接段
开工前 `git fetch origin` + 看表；认领 `worktree=mov-upg71 branch=feat/upg71`（基于最新 main）；完成后先表后库登记；报告落 `程序员\交付报告\DELIVERY_UPG71_*.md` 写明「已登记两表」+ hash + 证据链（资产 + schema + 脚本输出 + 变异亲杀）。

## 施工交付登记（2026-09-02 · feat/upg71 @43fd00a · 未合 main）
- **交付物（3 文件 / +482）**：`docs/capability-registry/capability-registry.json`（4 条 MVP，清占位，owner=MOV 作者 wmw0027 / evidence=UPG-71 立项·架构稿 v0.3 冻结 @2026-09-02，impls 空+note 待接入）+ `capability-registry.schema.json`（draft-07 + x_promotion_rule 机器可读计数）+ `scripts/check-capability-registry.mjs`（内嵌最小 draft-07 校验器）。
- **验收锚自证**：L1① check 0 报错汇总正确（能力数 4：registered 3/candidate 1；WRITE2/READ1/MONEY1；EXTERNAL3/LOCAL1）｜②变异亲杀 4/4 全红（枚举越界/registered 独立消费者减 1/删必填/塞 {样例占位}）｜③ assembleDebug BUILD SUCCESSFUL；testDebugUnitTest 683 完成 2 失败 = main@667cc80 基线预存（AppearanceContractTest L1-10/M-U50-5，UPG-70 已登记，全新 worktree 复现、非本单引入）｜④ check-token-effect 通过｜⑤ 零冲突 git 确认仅 3 新增，未动 ApprovalRegistry*/tool-orch/src/MainActivity.kt。
- **已登记两表**（工单表.xlsx + 工单库.md，先表后库）：工单表.xlsx 经 sync-orders.mjs 单向生成（禁手写）；本登记块 + 状态行「程序员已认领施工完成」为库侧唯一写入。
- **Token 影响**：0/0（纯新增静态资产+脚本，零请求链路）；**KV Cache 影响**：0/0（请求前缀恒定）。
- **待设计师**：① 合 main（feat/upg71，A1-4 CI 首跑可含 check-capability-registry 增强后续议）② 顶部状态行翻「已施工待验收/待合」③ ⏳ 基线 2 失败（L1-10/M-U50-5）裁决。

# UPG-72 执行引擎 · S2 JobSpec+SchemaGate+READ 直跑（契约 v0.4 首接线单）
**分类**：能力线 · 执行引擎（S2）

```status
phase: merged
branch: feat/upg72
head: bd958d2e
std: —
delivery_id: —
designer: —
dev: —
inspector: ✅ **审验 通过 @2026-09-02**（§P28 一致：红线边界 diff 17 文件全模块零触碰、mov-exec-engine:
merge: ✅ **设计师合 main**：bd958d2（父=main 43fd00a，快进） **前置**：✅ UPG-71 已合 main @43
actor: sys04-backfill
updated_at: 2026-09-05T08:42:01
```

**状态**：✅ 已合 main @bd958d2（feat/upg72 快进合入 + 已 push origin main 43fd00a..bd958d2，远端确认 bd958d2）｜ DONE｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-09-02 → ✅ **验收员复验 通过 @2026-09-02**（ACCEPTANCE_LOG §P28：bd958d2 隔离 worktree——exec-engine 模块 35/0 亲跑+G3 变异亲杀[类型层编译期禁+反射锚双层]+RealAssetSmoke 直读正式资产单源实证[READ 直跑/WRITE·MONEY blocked]+app 683/2 基线引用 §P26；红线全守；**达待合→设计师**；L2/L3 装配级端到端属 S3）→ ✅ **审验 通过 @2026-09-02**（§P28 一致：红线边界 diff 17 文件全模块零触碰、mov-exec-engine:test 735/0、G3 双层防线代码核物+G3 注入 APPROVED 亲杀红→还原复绿、RealAssetSmoke 资产单源、ExecEngine 分发零 capabilityId 写死；审验 0 发现）→ ✅ **设计师合 main**：bd958d2（父=main 43fd00a，快进）
**前置**：✅ UPG-71 已合 main @43fd00a（capability-registry 三文件在 main，本单只读不改）

## 标题
执行链路第一条接线单：把能力注册表接到第一个能消费它的运行时——落 `JobSpec(revision/semanticKey/capabilityDefinitionVersion)+ Schema Gate + READ 直跑最小闭环`。零审批、零 DAG 改造、无 UI；走通 `fulfill.track` 一条 READ 只读链路并留账。

## 背景（设计文唯一口径 + 对账）
- 设计文：`设计师\方案设计\MOV_执行引擎_架构设计稿.md` v0.4（§5.1/§5.2/§8.2/§12/§11 S2）+ 元能力架构稿 v0.3 + `docs/capability-registry/capability-registry.json`（4 条：READ 仅 fulfill.track）。
- **对账**：0027-mov 现无 jobId/JobSpec/semanticKey/capabilityId 代码（grep 全空）→ 新开无重复；本单不改造 DagPlanner/EffectSpecs/ToolOrchestrator（能力粒度 DAG=S5）、不碰 ApprovalService（审批=S3/S4）。
- 完整派单文本：`设计师\派单\UPG-72_执行引擎S2_JobSpec+SchemaGate+READ直跑_派单_2026-09-02.md`。

## 施工（照派单文本）
L0 范围 = S2：① CapabilityReader 读 registry json（失败关闭）② JobSpec 数据类（state 禁含 approved）③ Schema Gate（非法 in→invalid、0 副作用）④ READ 放行、WRITE/MONEY 一律 blocked（不手写放行）⑤ 执行器 maxConcurrency=1 ⑥ 最小账本事件 READ 主链 append-only ⑦ 产品 impls 不新增，测试替身仅测试作用域。落点优先新模块 `mov-exec-engine`（A），或 tool-orch 内新子包（B）；严禁动现 ⚡ 文件语义。

## 验收（抄执行引擎稿 §12，L1 亲跑）
守卫 G2 无 if-id / G3 JobSpec 无 approved / Schema Gate 拦截 0 副作用 / READ 放行且 WRITE·MONEY blocked（变异亲杀各红）/ G7 账本只增 / G11 READ 主链最小事件集；全量绿 testDebugUnitTest + assembleDebug；check-capability-registry 不回归；check-token-effect 过。L2：无 UI → 装配级 APK + 行为级 runtime 集成测试实证，不冒充 UI 真机。L3：与 registry 单源一致、零冲突 ApprovalRegistry/tool-orch/MainActivity。Golden Baseline 不触发（不改 ⚡）。

## 红线
1. 禁第二策略源：禁 if(capabilityId) 写死审批/放行；JobSpec 无 approved。
2. 零改动 ⚡：MainActivity.kt（纯 CRLF 禁 Edit）/AgentLoop/McpToolScheduler/ApprovalService/DagPlanner/EffectSpecs/ToolOrchestrator 现语义/docs/ApprovalRegistry*.json。
3. 只做 L0：不实现审批/幂等去重/自动重试（留 S3/S4/S6）；WRITE/MONEY blocked 等接线。
4. 禁占位/编造 impl：产品 impls 不新增、registry json 不改；测试替身仅测试作用域。
5. Token/KV Cache 影响两节申报；请求前缀恒定；不引入需 key 依赖。
6. 冻结项不碰。

## 派单交接段
开工前 `git fetch origin` + 看表；认领 `worktree=mov-upg72 branch=feat/upg72`（基于最新 main，UPG-71 @43fd00a 已合）；完成后先表后库登记；报告落 `程序员\交付报告\DELIVERY_UPG72_*.md` 写明「已登记两表」+ hash + 证据链（源码 + 守卫变异亲杀 + READ/blocked 实证 + 账本事件 + 两影响申报）。

## 施工交付登记（2026-09-02 · feat/upg72 @bd958d2 · 未合 main）
- **交付物（17 文件 / 纯新增模块）**：新 Gradle 模块 `mov-exec-engine`（纯 JVM Kotlin，零第三方依赖——内置 MiniJson 本地解析；register 进 settings.gradle.kts）。包 `com.hermes.mov.exec`：CapabilityReader（读 registry json + schema 词表，未知 id/文件缺失/schema 解析失败 → 明确报错失败关闭）+ JobSpec（state 仅 DRAFT/VERIFIED/INVALID/SUPERSEDED，禁 approved，G3）+ SchemaGate（in 对照能力 in 契约：不齐/多余/类型错 → invalid + 0 副作用）+ ExecEngine（READ 直跑放行、WRITE/MONEY 一律 DISPATCH_BLOCKED——策略源=注册表 side_effect 声明非按 capabilityId 写死 G2；maxConcurrency=1 串行；产品无 impl → failed(pending_impl) 如实记录）+ append-only Ledger（InMemory/File 双实现，G7）+ JobRuntime（phase planned→gated→ready→dispatched→done|failed|blocked）。
- **守卫变异亲杀 6/6 全红（篡改源码临时副本 → 相关守卫测试红 → 还原复绿）**：① G3 枚举注入 APPROVED → GuardInvariant G3 红 ② SchemaGate 直接放行 → 拦截类 6 测试红 ③ WRITE/MONEY 写死放行 → blocked 断言 2 红 ④ G7 账本恒写 index=0 → 单调断言红 ⑤ G11 漏记 RUN_COMPLETED → READ 最小事件集断言红 ⑥ G2 注入 if(capabilityId==…) 放行 → 静态扫描守卫红。另 G3/G7 程序化不变量已固化为 GuardInvariantTest（枚举无 approved / JobSpec 无审批字段 / Ledger 接口无覆写入口 / exec 源码静态扫描）。
- **验收锚自证**：mov-exec-engine 单测 35 全绿（含 RealAssetSmokeTest 对正式资产 docs/capability-registry 实证：4 能力可加载、fulfill.track READ 放行、fulfill.dispatch/settle.pay WRITE·MONEY blocked、未知能力失败关闭）；账本事件输出（ExecEngineTest READ 闭环断言含 JOB_CREATED/PLAN_VERIFIED/DISPATCHED/RUN_COMPLETED 最小集 + FileLedgerTest 行格式 0|事件|jobId|detail|ts）；`:app:testDebugUnitTest` 683 完成 2 失败 1 skipped——2 失败 = AppearanceContractTest（L1-10/M-U50-5）main 基线预存（UPG-70 登记，非本单引入）；`:app:assembleDebug` BUILD SUCCESSFUL；UPG-71 `check-capability-registry` 通过（4 能力/计数不变，不回归）；`check-token-effect` 通过；零冲突 git 确认仅 settings+新模块 17 文件，未动 ApprovalRegistry*/tool-orch/MainActivity.kt。
- **已登记两表**（工单表.xlsx + 工单库.md，先表后库）：工单表.xlsx 经 sync-orders.mjs 单向生成（禁手写）；本登记块 + 状态行「C 交付」为库侧唯一写入。
- **Token 影响**：0/0（纯新增静态 JVM 库，零请求链路——AgentLoop/LlmClient/Session/MCP tools 零接触）；**KV Cache 影响**：0/0（请求前缀恒定，无会话投影/压缩；AI 面 tools/system prompt 不变）。
- **待设计师/验收**：① 验收员走 L1（守卫变异亲杀亲验 + 全量）/L2（无 UI：装配级 APK + 行为级 runtime 集成测试实证）/L3（与 registry 单源一致、零冲突）② 验收后审验员 ③ 设计师合 main。

## 设计师合入登记（2026-09-02）
- **合入**：feat/upg72 bd958d2（父 = main 43fd00a，快进合 main）+ 已 push origin main（`43fd00a..bd958d2`，远端 ls-remote 确认 bd958d2）。
- **审验复核**：✅ 0 发现（ACCEPTANCE_LOG §P28）——红线边界 diff 17 文件全模块零触碰、mov-exec-engine:test 735/0 亲跑、G3 注入 APPROVED 亲杀红→还原复绿、RealAssetSmoke 直读仓库 registry 资产 4 能力（READ 直跑 DISPATCHED / WRITE·MONEY DISPATCH_BLOCKED / 未知 fail-closed）、ExecEngine 分发零 capabilityId 写死。
- **main 现状**：bd958d2 = UPG-71（43fd00a）+ UPG-72（新模块 mov-exec-engine）。执行链路 S2 已合，S3（审批双快照）可随基线续派，前置已满足。

# UPG-73 执行引擎 · S3 审批双快照核心（ApprovalSnapshot+首决胜+STALE）+ WRITE/MONEY 接审批（契约 v0.4 第二条接线单）
**分类**：能力线 · 执行引擎（S3）

```status
phase: merged
branch: feat/upg73
head: add9e8ca
std: —
delivery_id: —
designer: —
dev: ✅ **R1 修复交付 @2026-09-02**（程序员 feat/upg73 **add9e8c**：HIGH ApprovalBook
inspector: ✅ **审验 通过 @2026-09-02**（§P29-R1 consistent：R1 范围 5 文件+273/-31 限 approv
merge: ✅ **已合 main @add9e8c**（快进合入+已 push；元能力线合序 71→72→73 完成）｜ DONE **前置**：✅
actor: sys04-backfill
updated_at: 2026-09-05T08:42:01
```

**状态**：✅ **C 交付 @2026-09-02**（程序员 feat/upg73 **c2a0a92**，worktree mov-upg73，基 main bd958d2；approval 子包 + ExecEngine 审批接线 + STALE 复验全交付；mov-exec-engine 52/0 + 守卫变异亲杀 4/4 + app 683/2基线/1skip + assembleDebug 绿 + check-capability-registry/check-token-effect 双过；报告 `程序员\交付报告\DELIVERY_UPG73_2026-09-02.md`；**已登记两表**）→ 待验收员 L1/L2/L3 → 审验 → 设计师合 main｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-09-02 → ❌ **验收员打回 @2026-09-02**（ACCEPTANCE_LOG §P29：模块 52/0 亲跑+canonical/同源/单线程首决胜/STALE/策略源唯一 通过；**security_review HIGH ApprovalBook 非线程安全**[LinkedHashMap+check-then-act——S4 双应答并发 decide 同 requestId→双 FirstWin→Reject 可被 Approve 覆盖+dispatch TOCTOU——「首决胜不可变」多线程不成立]+**MEDIUM 五元同验只验一元**[definitionVersion 不比对+SchemaGate 不重跑→schema 变严旧批放行新契约]；M2 summary 转义 S4+LOW dispatch-once S5；测试缺口四类随修补；R1 复验=并发双通道+五元同验+S2 不回归）→ ✅ **R1 修复交付 @2026-09-02**（程序员 feat/upg73 **add9e8c**：HIGH ApprovalBook 线程安全[ConcurrentHashMap+putIfAbsent+decide compute 原子首决胜——并发同 requestId 恰一 FirstWin/已决不可覆盖]+MEDIUM-1 dispatch 前五元同验[capabilityId 移除/definitionVersion 漂移/approvalScope+SchemaGate 重跑已批准 canonical 输入→任一 STALE 旧批不 dispatch]+MEDIUM-2 summary 人读层控制符折叠[\n→可见转义防伪造多行弹卡]+LOW dispatch-once[终态一次性消费二次拒绝]；mov-exec-engine **60/0** 全绿[S2 35 不回归]+R1 变异亲杀 **4/4 红还原复绿**[非线程安全 decide/删 definitionVersion 同验/删 SchemaGate 重跑/删 dispatch-once]；报告 `程序员\交付报告\DELIVERY_UPG73_R1_2026-09-02.md`；工单表已同步）→ 待验收员 R1 复验 → 审验 → 设计师合 main → ✅ **R1 复验 带缺陷通过 @2026-09-02**（ACCEPTANCE_LOG §P29-R1：add9e8c HIGH 闭环[CHM+compute 原子首决胜——并发恰一 FirstWin/Reject 不可覆盖/无 TOCTOU/Record 纯值]+五元同验闭环[五元齐+SchemaGate 重跑冻结 canonical]+dispatch-once 闭环[双终态原子消费]；CyclicBarrier 真并发 300 轮双向覆盖；模块 60/0 亲跑；**P2 残余 M-2 键名过 foldControl 一行修**+LOW×2 随 S4/S5）→ ✅ **审验 通过 @2026-09-02**（§P29-R1 consistent：R1 范围 5 文件+273/-31 限 approval 子包+ExecEngine 零越界；模块 60/0 亲跑；HIGH/MEDIUM/LOW 代码核物全坐实；0 新阻塞；**P2 $key 一行修残余随 S4/合后**入挂账）→ ✅ **已合 main @add9e8c**（快进合入+已 push；元能力线合序 71→72→73 完成）｜ DONE
**前置**：✅ UPG-72 已合 main @bd958d2（mov-exec-engine 在 main；本单在其上扩展，不改 S2 语义——README/READ 直跑不回归）

## 标题
执行链路第二条接线单：给 S2 的 WRITE/MONEY 口接上**能力级审批核心**——`ApprovalSnapshot(双快照:canonical 机器层 + deterministic summary 人读层)+ 首决胜原子决策 + policyFingerprint 防策略漂移(STALE)`。**纯 JVM 领域逻辑，可单测；不接 Android UI、不碰现 ApprovalService/MainActivity**（弹卡 UI/真人 reviewer/超时 EXPIRED 属 S4）。

## 背景（设计文唯一口径 + 对账）
- 设计文：`设计师\方案设计\MOV_执行引擎_架构设计稿.md` v0.4（§6.1 双快照/§6.2 首决胜/§6.5 审批对象可信链 summary deterministic/§12 验收 G4/G5/G9/§11 切片 S3；§6.3/§6.4/§8.3 EXPIRED+Group 状态机 = S4 不做）+ 元能力架构稿 v0.3 + `docs/capability-registry/capability-registry.json`（4 条，只读不改）。
- **对账**：exec-engine 内审批对象/决策原语为零 → S3 新开无重复。现 `ApprovalService.kt`（app/.../dsh/tools，工具级确认）属**既有工具粒度审批**；本单能力级审批是**新层，不并入、不清改**——边界清晰即 L3 验收点。
- 完整派单文本：`设计师\派单\UPG-73_执行引擎S3_审批双快照核心_派单_2026-09-02.md`。

## 施工（照派单文本）
L0 范围 = S3，在 `mov-exec-engine` 新增 approval 子包（`com.hermes.mov.exec.approval`），核心全纯 JVM：① CanonicalCodec（canonical 稳定序列化 + sha256=canonicalHash）② DeterministicSummaryRenderer（§6.5 禁 LLM，两行结构化摘要）③ policyFingerprint（sha256 注册表安全面 = side_effect+env+审批约束）④ ApprovalSnapshot{capabilityId, capabilityDefinitionVersion, policyFingerprint, canonicalPayload, canonicalHash, summary, summaryVersion, approvalScope} ⑤ ApprovalRequest/Record（requestId=`apr_sha256(runId+snapshot)`；首决胜、二次 decide→CONFLICT、已决不可变；未决态留给 S4）⑥ ExecEngine 接线：WRITE/MONEY 由 blocked 占位改为 → 建 snapshot+request → reviewer 裁决（本单程序化 reviewer 供测试）→ approve 复验 fingerprint → dispatch / reject → blocked / 无 reviewer → `pending_approval`（fail-closed 绝不自放行）；READ 路径不改；仍禁 if(capabilityId) 定策略（G2）⑦ STALE 复验：dispatch 前重读现况 fingerprint 比对，不一致 → stale 不 dispatch + 记账 ⑧ Ledger 事件扩展 append-only：`APPROVAL_REQUESTED → APPROVED|REJECTED|APPROVAL_STALE`（G7）⑨ ApprovalGuardTest 静态锚（decide 后 mutate→红/summary 非确定性→红/跳过 fingerprint 校验→红）。

## 验收（抄执行引擎稿 §12，L1 亲跑）
守卫 G4 审批不可变/首决胜（二次 decide→CONFLICT，变异「二次可覆盖」→红）/ G5 可信链禁 LLM（summary 路径注入 LLM 或不稳定→红；同一 snapshot 两渲染字节一致）/ G9 策略漂移（registry 安全面变严→dispatch 前复验→旧批 stale 不 dispatch；变异「跳过 fingerprint 复验」→红）/ 审批闭环（WRITE·MONEY approve→dispatch、reject→blocked、默认无 reviewer→pending_approval 不执行——变异默认放行→红）/ S2 不回归（READ 直跑不变、G2/G3/G7 全绿）；全量绿 `:mov-exec-engine:test` + `:app:testDebugUnitTest`（基线 2 失败除外）+ assembleDebug；check-capability-registry 不回归；check-token-effect 过。L2：无 UI → 装配级 APK + 行为级 runtime 集成测试实证（approve/reject/pending/STALE），不冒充 UI 真机。L3：审批策略源与 registry 单源一致、与工具级 ApprovalService 边界清晰互不顶替、未动 MainActivity/ApprovalRegistry*/tool-orch。Golden Baseline：S3 仅扩展 exec-engine 新子包 + ExecEngine 一分发点（预期不触发）。

## 红线
1. 禁第二策略源：审批与否由注册表 side_effect 驱动；禁 if(capabilityId) 写死审批/放行（G2）。
2. 零改动 ⚡ 与既有审批：MainActivity.kt（纯 CRLF 禁 Edit）/AgentLoop/McpToolScheduler/`ApprovalService.kt`（app/.../dsh/tools）/docs/ApprovalRegistry*/tool-orch——能力级审批是新层，不清改工具级。
3. 只做 L0 不越界：不做 UI 弹卡/真人 reviewer UI/TTL EXPIRED/ApprovalGroup 状态机（=S4）；不做幂等去重（S6）；WRITE/MONEY 无 reviewer 一律 pending/blocked，不得默认放行。
4. summary 禁 LLM：审批对象由 deterministic renderer 从 canonical 生成；LLM 解释不进入审批效力链（§6.5）。
5. registry 资产只读：不改 capability-registry.json/schema/UPG-71 校验（如需人读元数据扩展须先申报，默认不增）。
6. Token/KV Cache 影响两节申报；请求前缀恒定；不引入需 key 依赖。
7. 冻结项不碰。

## 派单交接段
开工前 `git fetch origin` + 看表（确认 main=bd958d2 最新）；认领 `worktree=mov-upg73 branch=feat/upg73`（基于最新 main）；完成后先表后库登记；报告落 `程序员\交付报告\DELIVERY_UPG73_*.md` 写明「已登记两表」+ hash + 证据链（approval 子包源码 + 守卫变异亲杀[G4/G5/G9/审批闭环] + approve/reject/pending/STALE 实证 + 账本事件 + Token/KV Cache 两节申报）。
- **Token 影响 / KV Cache 影响**：0/0（程序员交付申报，全新独立 JVM 模块零请求链路、AI 面不变）。

## 施工交付登记（2026-09-02 · feat/upg73 @c2a0a92 · 未合 main）
- **交付物（13 文件 / +772，纯新增 approval 子包 + ExecEngine 接线）**：新 approval 子包 `com.hermes.mov.exec.approval`——`CanonicalCodec`（canonical 稳定序列化：键排序/数组保序/拒非有限数，sha256=canonicalHash 64hex）+ `DeterministicSummaryRenderer`（§6.5 禁 LLM，纯函数两行「op/参数」人读层，对象参数与 canonical 同源机器形）+ `PolicyFingerprint`（sha256 = side_effect+env 安全面指纹，同面稳定/收紧必变）+ `ApprovalSnapshot`（canonical 机器层 + summary 人读层双快照，summaryVersion=v1 / approvalScope=capability_call）+ `ApprovalRequest`（requestId=`apr_`+sha256(runId+capabilityId+canonicalHash+fp)，同 run 同 snapshot 稳定复现）+ `ApprovalRecord/ApprovalBook`（首决胜：pending→decided 唯一推进，二次 decide→CONFLICT 不覆盖不撤销，无 update/remove/delete 入口 G4）。`ExecEngine` 接线：WRITE/MONEY 由 S2 DISPATCH_BLOCKED 占位改 → 建 snapshot+request → `approval_requested` + `pending_approval` 挂起（无 review 绝不自放行，fail-closed）→ `review(Approve/Reject)` 首决胜 → APPROVED/REJECTED → `dispatchApproved` dispatch 前 **STALE 复验**（现况 fp vs 批准时锁定，漂移 → `APPROVAL_STALE` 旧批作废不派发）。Ledger 事件扩展 append-only：`APPROVAL_REQUESTED → APPROVED|REJECTED|APPROVAL_STALE`（G7）。S2 READ 直跑路径零改动。
- **守卫变异亲杀 4/4 全红（篡改源码临时副本 → 守卫测试红 → 还原复绿）**：① G4 二次 decide 变异（Conflict→FirstWin 允许覆盖）→ `G4 已决 Record 二次 decide 红` FAILED ② G5 注入时钟（summary 路径 `t=now`）→ G5 禁 token 扫描 + summary 确定性 2 测试 FAILED ③ G9 跳复验（dispatchApproved `if(false)` 删漂移拦截）→ `G9 安全面变严 - STALE 不 dispatch` FAILED ④ 审批默认放行（WRITE/MONEY 绕过 requestApproval 直 dispatchRead）→ approve 闭环/reject 闭环/no-reviewer fail-closed/G9 STALE 4 测试 FAILED——均还原复绿。
- **验收锚自证**：mov-exec-engine 单测 **52 全绿 / 0 failed**（approval 子包 17 = ApprovalCoreTest 8 + ApprovalGuardTest 9 含正式资产 RealAssetSmokeTest 实证 WRITE/MONEY 进审批 PENDING_APPROVAL、READ 直跑不回归）；审批闭环实证（approve→复验通过→DISPATCHED + 账本 APPROVAL_REQUESTED/APPROVED/DISPATCHED 链；reject→DISPATCH_BLOCKED 无 DISPATCHED；无 reviewer→pending_approval 且未决 dispatch 抛 IllegalStateException 失败关闭；G9 收紧 env EXTERNAL→LOCAL 后 dispatch → APPROVAL_STALE 不 dispatch + 账本 STALE 事件）；`:app:testDebugUnitTest` 683 完成 **2 failed 1 skipped**——2 失败 = AppearanceContractTest（L1-10/M-U50-5）main 基线预存（UPG-70 登记，非本单引入）；`:app:assembleDebug` BUILD SUCCESSFUL；UPG-71 `check-capability-registry` 通过（4 能力/计数不变，不回归）；`check-token-effect` 通过；零冲突 git 确认仅 mov-exec-engine 新 approval 子包 + ExecEngine 一分发点（13 文件），未动 ApprovalRegistry*/tool-orch/MainActivity.kt。
- **已登记两表**（工单表.xlsx + 工单库.md，先表后库）：工单表.xlsx 经 sync-orders.mjs 单向生成（禁手写）；本登记块 + 状态行「C 交付」为库侧唯一写入。
- **Token 影响**：0/0（纯新增静态 JVM 模块内审批域逻辑，零请求链路——AgentLoop/LlmClient/Session/MCP tools 零接触）；**KV Cache 影响**：0/0（请求前缀恒定，无会话投影/压缩；AI 面 tools/system prompt 不变）。
- **待设计师/验收**：① 验收员走 L1（守卫变异亲杀亲验 + 全量）/L2（无 UI：装配级 APK + 行为级 runtime 集成测试实证）/L3（审批策略源 registry 单源、与工具级 ApprovalService 边界清晰互不顶替、未动 MainActivity/ApprovalRegistry*/tool-orch）② 验收后审验员 ③ 设计师合 main。

### R1 打回修复登记（2026-09-02 · §P29 · feat/upg73 @add9e8c · 未合 main）
- **修复范围（5 文件 / +273 -31，限 approval 子包 + ExecEngine）**：① **HIGH ApprovalBook 线程安全**——LinkedHashMap+check-then-act → `ConcurrentHashMap` + `putIfAbsent` 登记 + `decide` compute 单桶锁内原子首决胜（winner 装入 rec.copy(decision)；loser 见已决 → Conflict，attempted 不入册）——并发多通道同 requestId 恰一 FirstWin、已决不可覆盖（Reject 赢后不被并发 Approve 改写）、record/decide 均无竞态、dispatch 读 decision 后无 TOCTOU 翻面；ApprovalRecord 仍为纯值对象无 var（G4 扫描不破）。② **MEDIUM-1 dispatch 前五元同验**——dispatchApproved 现对现况 registry 复验五元：capabilityId 存在（移除 → STALE）/ capabilityDefinitionVersion（registry.schemaVersion ≠ 批准锁定 → STALE）/ policyFingerprint（§6.6 原 STALE 复验）/ approvalScope（非 capability_call → STALE）+ **SchemaGate 重跑已批准 canonical 输入**（required 收紧/类型变严 → 旧批拒）——任一漂移/拒 → `APPROVAL_STALE` 旧批不 dispatch。③ **MEDIUM-2 summary 人读层控制符折叠**——DeterministicSummaryRenderer 字符串值 `\n`/控制符转可见转义（`\\n` 等），恒两物理行，防伪造多行弹卡视觉；canonical 同源禁 LLM 仍守。④ **LOW dispatch-once**——终态 DISPATCHED/APPROVAL_STALE 一次性消费（引擎内 CHM newKeySet），二次 dispatch 抛 IllegalStateException 防 S5 重放。
- **R1 变异亲杀 4/4 全红还原复绿**：① decide 还原非线程安全 check-then-act → `并发 decide 双通道` FAILED ② 删 definitionVersion 同验 → `definitionVersion 漂移` + STALE-once 2 FAILED ③ 删 SchemaGate 重跑 → `SchemaGate 重跑收紧` FAILED ④ 删 dispatch-once → 二次 dispatch 2 FAILED——均还原复绿。
- **R1 验收锚自证**：mov-exec-engine 全量 **60 全绿 / 0 failed**（S2 35 不回归 + approval 25 = Core 9 + Guard 9 + R1 7）；并发实证 300 轮双通道 decide 恰一 FirstWin（approveWon>0 ∧ rejectWon>0 → Reject 不被 Approve 覆盖已验到）；五元同验实证（能力移除/version 漂移/schema 收紧 → APPROVAL_STALE + 账本 STALE 事件；无漂移 → DISPATCHED 非回归）；dispatch-once 实证（DISPATCHED 后重放拒 / STALE 后重放拒）；summary 注入实证（`\n` 值渲染不拆行、无伪造 op 行）；app 侧零接触（改动限 mov-exec-engine 模块），`:app:testDebugUnitTest` 基线维持 round-1 683/2 预存。零冲突 git 确认仅 5 文件 approval 域，未动 ApprovalRegistry*/tool-orch/MainActivity.kt。
- **Token 影响**：0/0；**KV Cache 影响**：0/0（R1 仍纯模块内审批域逻辑，零请求链路改动，同 round-1 申报）。
- **待验收员 R1 复验**（§P29 R1 入口）：并发 decide 双通道测试（Reject 不被覆盖）+ 五元同验（definitionVersion 漂移→STALE）+ S2 35 不回归 + 原 4 变异还原复绿。

---

# UPG-75 审批交互收口（弹窗队列/待办列表/渠道统一）
**分类**：M2 体系/治理 ｜ 标签：M8 UI/交互


```status
phase: merged
branch: feat/upg75
head: 014c10f0
std: —
delivery_id: —
designer: —
dev: ✅ **C 交付 @2026-09-02**（程序员 feat/upg75 **014c10f**，worktree mov-upg75，基
inspector: ✅ **验收员复验 带缺陷通过 @2026-09-02**（ACCEPTANCE_LOG §P30：014c10f 隔离 worktree｜
merge: ✅ 已合 main @014c10f（feat/upg75 ff 合入；本地合入完成｜push 待网络恢复）｜ DONE（待 push）
actor: sys04-backfill
updated_at: 2026-09-05T08:42:01
```

**状态**：✅ 已合 main @014c10f（feat/upg75 ff 合入；本地合入完成——push 待网络恢复）｜ DONE（待 push）｜ **优先级**：P1
→ **验收链**：验收员复验 带缺陷通过（§P30：A1 首决胜真 CAS[ApprovalService:196-200 AtomicReference + compareAndSet 非 check-then-act——UPG-73 教训内化]+FIFO 队列+待办 chip/面板+单源收口；A3-1 渠道端到端 JVM 无法覆盖[远程面触发不达 UI——模拟器环境阻塞]）→ ✅ 审验通过（014c10f 4 文件+650/-109 纯交互层；A1-1 变异亲杀[keep-latest→A1-1 红→还原复绿]；红线边界[only-once/fail-closed 零改动]）
→ **残余**：A3 渠道端到端真机补验（留平板）；审批 UI 呈现通道缺口→转 UPG-76 统一设计；生成器派生项漂移→并入挂账-生成器产物漂移防护 → ✅ **验收员复验 带缺陷通过 @2026-09-02**（ACCEPTANCE_LOG §P30：014c10f 隔离 worktree——A1 首决胜真 CAS[AtomicReference+compareAndSet——UPG-73 教训内化]+A1-1 变异亲杀+定向 50/0 亲跑+red-line 8 条复核；**A3-1 真机端到端环境阻塞**[MCP 直调不达通知/弹窗 UI=UPG-73 呈现通道缺口延续+对话内触发器需 AI key]——待环境恢复补验；观察 2 建议派生项一次性入库+CI diff=0；**达待合→审验员→设计师**）
→ **依据**：审批安全语义（fail-closed/only-once/嵌套闸）经 UPG-68 收口正确；差的是交互层——单弹窗无队列（并发 tool_call 后弹盖前弹）+ 审批待办列表不存在 + 渠道三套不统一（onStart takePending 只取一条） → ✅ **C 交付 @2026-09-02**（程序员 feat/upg75 **014c10f**，worktree mov-upg75，基 main add9e8c；A1 FIFO 弹窗队列 + A2 审批待办 + A3 渠道统一 + A4 超时足迹全交付；ApprovalQueueTest 4/4 + OnlyOnceGuard 8 + PermissionGuard 15 + Goal 5 + Experience 8 契约 40/40 + 变异亲杀 keep-latest 全红还原复绿 + assembleDebug 绿；报告 `程序员\交付报告\DELIVERY_UPG75_2026-09-02.md`；**已登记两表**）→ 待验收员走 A1-A4 锚（A3 渠道链路需真机补验）→ 审验 → 待设计师合 main

## 标题

审批交互收口：弹窗 FIFO 队列（同一时刻单窗+待办计数）+ 审批待办列表（侧边栏/安全中心，全部 pending 可批可拒+全部本轮允许）+ 渠道统一（前台弹窗/后台通知/回前台同一数据源）

## 背景

2026-09-02 平板演示「注册元能力 fulfillment.track 调用」：LLM 并行执行 shell.exec 命令 N 次+fulfill.track——每次 shell.exec 弹审批窗（用户点「同意」放行的都是它），fulfill.track 的授权请求（req-8/9）被覆盖/超时，用户从未看到该弹窗；LLM 建议「找审批待确认列表」→ 该 UI 不存在。原因：审批弹窗=「一次一弹」原型逻辑，LLM 并行工具调用（一次会话 5-6 pending）撑不住。

## 范围

- A1 弹窗队列：FIFO 单队列，同一时刻仅一窗；顶栏「待审批 N 条·第 i 条」；超时/关闭自动切下一条（不丢）。
- A2 审批待办列表：侧边栏（或安全中心）入口——全部 pending（工具名/参数摘要/时间/状态）+ 允许/拒绝/全部本轮允许；与弹窗同源投影。
- A3 渠道统一：前台=列表首条沉浸态；后台=通知；回前台=渲染同一列表（删 takePending 单条）；三渠道一数据源。
- A4 超时语义保留：60s fail-closed 不变；超时项进审批足迹（可查）+ toast「已自动拒绝」。

## 验收锚

- A1-1 并发 3 tool_call → 依次 3 窗可点，无丢（足迹 3 条均有结论）
- A1-2 首窗超时自动拒绝→下一窗自动出现（不阻塞）
- A2-1 待办列表实时反映 pending；「全部本轮允许」→ 队列清空且全部 APPROVED
- A3-1 后台通知→回前台=同请求变列表首条；无重复无丢失
- A4-1 超时项足迹可见
- 变异亲杀：队列改「只保留最新」→ A1-2 红

## 不做

- 不改权限判定/审批安全语义（UPG-68 不动）；不做 push 扩展；不重设计弹窗视觉（沿用大白话 v4）

**红线**：安全语义零改动（only-once/fail-closed/嵌套闸）；渠道改动不得绕过 ApprovalService 单源。

**交付**：`审批交互收口_设计_v1_2026-09-02.md`；卡：UPG-75

## 施工交付登记（2026-09-02 · feat/upg75 @014c10f · 未合 main）
- **交付物（4 文件 / +650 / -109，纯交互层）**：`ApprovalService.kt`（A1 FIFO 单队列：`ConcurrentLinkedQueue`+`byId` CHM+`driveMutex` 调用方协程串行展示，同一刻仅队首 1 窗；首决胜 CAS `tryDecide`；排队不计时、仅展示项 60s fail-closed；A2 `pendingList`/`complete`/`allowAllThisTurn`；`presentationCanceller`/`onQueueChanged` 收口外部决策与 chip 计数）+ `MainActivity.kt`（A2「审批待办」chip+原生日历表弹窗 allow/deny/全部本轮允许[only-once 标「每次确认」留逐条]；answerer 弹窗顶部「待审批 N 条·第 i 条」；`presentationCanceller` 关面；30s 倒计时超时 `Toast「已自动拒绝」`）+ `NotificationAnswerer.kt`（A3：删 `pendingInfos`/`takePending`/onStart 单条接管；`activeRequestId`+`cancelActive()` 供外部决策抢先时释放等待 answerer 并取消通知——单源防双决策源重叠）+ 新增 `ApprovalQueueTest.kt`（4 用例）。
- **变异亲杀 1/1 全红还原复绿**（篡改源码临时副本→测试红→还原复绿）：`nextUndecided()` 改 keep-latest（只保留最新一条，FIFO 违规）→ **ApprovalQueueTest A1-1 红**（并发只应展示队首断言被打破）→ 还原复绿（A1-2 同带「首窗=shell.exec」序锚双保险）。
- **验收锚自证**：`testDebugUnitTest` 定向 5 套件 **40 全绿 / 0 failed**（ApprovalQueueTest 4 + OnlyOnceGuardTest 8 + PermissionGuardTest 15 + ApprovalServiceGoalTest 5 + ApprovalExperienceTest 8）；提交前全量回归（Upg07B2 6/ExperienceSurface 1/UPG68 系列/WebMcpHub 24/goal 系）亦全绿；A1-1 并发 3 请求 FIFO 展示序=入队序、3 asked+3 decided 无丢；A1-2 队首 120ms 超时 fail-closed cancelled→下一窗自动出现不阻塞、cancelled 进足迹可查；A2 外部 complete 尾项免弹按决放行、全部本轮允许放 2 条 ALLOW_TURN 而 vault.get（only-once）留逐条、逐条允许后清空；`:app:assembleDebug` **BUILD SUCCESSFUL**；工作树净（4 文件改动集）。
- **已登记两表**（工单表.xlsx + 工单库.md）：工单表.xlsx 经 sync-orders.mjs 单向生成（禁手写）；本登记块 + 状态行「C 交付」为库侧唯一写入。
- **Token 影响**：0/0（纯 App 前台交互层，零请求链路——AgentLoop/LlmClient/Session/system prompt/AI 面零接触）；**KV Cache 影响**：0/0（请求前缀恒定，无会话投影/压缩；AI 面不变）。
- **待设计师/验收**：① 验收员走 A1-A4 锚（A1-1/A1-2/A2-1/A4-1 JVM 已实证可亲跑复验；**A3-1 渠道链路[弹窗↔通知↔回前台同源]需真机补验**）+ 变异亲杀复验（keep-latest→红）② 审验员 ③ 待设计师合 main（合 main 只归设计师）。

---

# UPG-76 审批预审单模式（先扫一遍→审批单→同意就做）
**分类**：M2 体系/治理 ｜ 标签：M8 UI/交互


```status
phase: merged
branch: feat/upg76
head: 6dd91616
std: STD-UPG-76-v1
delivery_id: DEL-UPG76-20260903-001
designer: 📎 **方案 v2 增补 @2026-09-03**（设计师B「四钉子」，用户已认可：`设计师\方案设计\审批预审单_UPG-76_方案v
dev: ✅ **C 交付 @2026-09-03**（程序员 feat/upg76 **ed5088c**，worktree mov-upg76，基
inspector: ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P32：ed5088c 隔离 worktree｜
merge: ✅ **已合 main @6dd9161 @2026-09-03**（设计师B：ff-only 合入+**已 push origin/mai
actor: sys04-backfill
updated_at: 2026-09-05T08:42:01
```

**状态**：📌 **已派单·待认领 @2026-09-03**（用户拍板免大神评审直派；派单 `设计师\派单\UPG-76_审批预审单_派单_2026-09-03.md`；验收标准已冻结 `STD-UPG-76-v1`，content_sha256=f370253e）｜ **优先级**：P1（v1 概览：用户拍板「另立」——先扫描汇总一张审批单，同意=整批执行，付钱不能先批）｜ → ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P32：ed5088c 隔离 worktree——全量 722/2/1 亲跑一致+PlanApproval 套件 32 全绿+变异「扣减删除」亲杀 failed=3→还原+consumeIfApproved 三态实锤+manifest_sha 一致；**L3 四场景环境阻塞登记**[AI 编排需 key——JVM 机制面 FULL]；遗留 4 条如实[提示词路径差异取舍转设计师]；**达待合→审验员→设计师**）
→ 🆕 **已认领 @2026-09-03**（程序员 Claude/wmw0027，worktree mov-upg76，branch feat/upg76，2026-09-03 认领登记，基 main a7736b3）
→ ⚖️ **交付遗留四件裁决 @2026-09-03（设计师B）**：①提示词路径=**接受嵌套独立 agent 方案**（语义等效且主会话前缀恒定——STD 派生 **v2** 销项 #1 改二选一，sha=bfcbd872，v1 留档）；②参数精确一致才放行=**认可**（§8.3 参数级绑定+钉子2，非缺陷，真机「部分后续步骤仍弹窗」=预期）；③MCP 面预审编排=**不另单**（单次直调无编排对象，绑定层双面已覆盖+FIFO 兜底）；④生成器污染已还原 ✓，根治=挂账合并工单候选「派生项入库+CI diff=0」待派；**P3 卫生=PlanApprovalStore.kt:219 raw NUL 分隔符改 `\u0000` 转义（合 main 前置，已入 STD v2 销项）**
→ 📎 **方案 v2 增补 @2026-09-03**（设计师B「四钉子」，用户已认可：`设计师\方案设计\审批预审单_UPG-76_方案v2增补_设计师B_2026-09-03.md`——①审批单=ApprovalGroup 呈现形态·走 §8.3 双状态机不开第三套 ②计划外调用硬拦截转新 ASK ③扫描 READ-only 工具面+≥2 审批级步骤才出单+READ 免单 ④时效 EXPIRED+每条授权单次执行+「阻断下游」非「撤销」；含 STD 验收锚草案；落地=S4 合并两阶段或 S4 先派，R1 并行）
→ **依据**：用户原话「运行中随时来个弹窗审批，多麻烦」——现行=运行中碎片审批；预审单=运行前一张单。与 UPG-75（交互层收口·已派）互补：75=队列/待办/渠道统一（兜底层），76=主交互升级（编排层）；安全语义 UPG-68 不动（预审单不绕过 only-once/fail-closed/嵌套闸）
→ ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P32：ed5088c 隔离 worktree——全量 722/2/1 亲跑一致[基线预存]+PlanApproval 32 用例全绿+变异亲杀 2/2 独立复验[计次扣减/only-once 入簿]+执行绑定五态实锤[HIT 原子扣减/DENIED 阻断/MISS 转新 ASK/RUNS_EXHAUSTED/EXPIRED 不复活]+manifest 9/9；**L3 四场景环境阻塞登记**[5554 无 DeepSeek key，依赖对话面 AI 编排]——JVM 机制面 FULL；**达待合→设计师**）
→ ✅ **已合 main @6dd9161 @2026-09-03**（设计师B：ff-only 合入+**已 push origin/main**；=ed5088c 交付+设计师直修 hygiene commit[nodeKey 分隔符 raw NUL→`\u0000` 转义，STD v2 前置销项，PlanApproval 定向 BUILD SUCCESSFUL]；合前抽查[红线 15/§六]——STD-UPG-76-v2 sha=bfcbd872 对账一致、a7736b3→ed5088c FF 实证、§P32 证据=JVM 机制面实物[非口头]；coverage PARTIAL 裁决落交付报告[uncovered=UI 编排真机面，失效=回退 UPG-75 FIFO 安全语义不降]；**L3 四场景转 挂账-upg76-L3真机补验四场景**[AI key 恢复后按 STD v2 补验，与挂账-模拟器AI未回复联动]；verify-hash 复跑 HASH_OK 归档归审验员）｜ worktree mov-upg76 可收
→ ✅ **C 交付 @2026-09-03**（程序员 feat/upg76 **ed5088c**，worktree mov-upg76，基 main a7736b3；阶段一 PlanApproval 执行绑定[PlanApprovalStore 双状态机照 §8.3+consumeIfApproved 下沉 remembered 后/MONEY+only-once 直返 MISS]+阶段二 扫描编排+审批单 UI[PlanApprovalScan READ-only 收缩+嵌套补全轮+逐条勾选弹窗]全交付；PlanApprovalStoreTest 15+BindingTest 11+ScanTest 6=32/0+变异锚 5/5 全红还原复绿+全量 722/2 既存基线[AppearanceContractTest]/1skip+assembleDebug 绿；报告 `程序员\交付报告\DELIVERY_UPG76_2026-09-03.md`[DEL-UPG76-20260903-001+三重 hash]；共享面影响清单+coverage PARTIAL 见 DELIVERY §六/§七；verify-hash HASH_REJECT not-ancestor 如实留证；**已登记两表**）

## 标题

审批预审单模式：LLM 先只读扫描（零副作用）→ 输出结构化审批单（意图+步骤清单[工具/参数/侧效应/理由/顺序]）→ 用户裁决（同意全部/部分同意/拒绝）→ 整批执行（每步保留安全闸兜底）；MONEY 步骤永不预批（执行到该步实时逐笔确认）

## 背景

用户拍板「审批按结果导向先扫一遍，然后直接给出审批单，同意了就做，不同意就不做，当然付钱不能先批」——体验诉求：运行中随时弹窗审批=碎片打扰；预审单=用户只批一次，然后 LLM 按单执行。

## 范围

- A1 扫描阶段：LLM 预演（只读探察，零副作用）→ 列出拟调用清单（工具/参数/理由/顺序）
- A2 审批单 UI：结构化清单卡（意图摘要/步骤行/勾选项/支付行明示违规性）+ 前台弹窗+后台通知
- A3 批准清单状态机：plan→(部分)approved→executing；**清单指纹快照**+执行时逐维复验（复用 UPG-73 五元同验/STALE——漂移→APPROVAL_STALE 不执行）
- A4 支付例外：MONEY 步骤**永不预批**——单子明示「含支付步骤，执行到该步单独实时确认」；确认=逐笔
- A5 失败语义：拒绝=撤销后续；执行中失败停止汇报（可再提新单）

## 分层溯源图（@main a7736b3 · 红线 20/21 派单前复核 @2026-09-03）

| 层 | 判定 | 证据 | 断点处置 |
|---|---|---|---|
| L1 用户可感知（审批弹窗/待办面板/chip） | ✅ | showApprovalPanel MainActivity.kt:7277-7409；buildApprovalDialogView :7441+；apprArgsSummary 脱敏 :7412-7428（UPG-75 件可复用） | 本单复用做审批单 UI |
| L2 入口/编排（工具面装配+提示词） | ⚠️ | rebuildAgentTools :7795-7823（schemas+allowedTools 同源=扫描过滤单点）；systemPrompt 拼串 :5352-5370（**:5358「禁止输出计划文本」与「先输出计划」互斥，需条件化**） | 本单修（扫描模式） |
| L3 服务/数据（批准清单存储） | ❌ 缺失 | PlanApproval 存储全仓为零（grep 证实；ApprovalBook 为首决胜不可变簿，不含计次消耗语义） | 本单新开 PlanApprovalStore |
| L4 运行时装配（判定/豁免链） | ✅ | guard.decide 单源 McpToolScheduler.kt:175-186；ApprovalService.request 豁免序 turn:351→goal:360→remembered:371→FIFO:396（清单下沉点=:377 后，双面生效） | 本单插清单查询 |
| L5 能力实物（exec-engine 复用件） | ✅ | CanonicalCodec.kt:26 / PolicyFingerprint.kt:13-18（UPG-73 已验证）；app→engine 依赖方向可行（engine 纯 JVM 零反向依赖，settings.gradle.kts:21） | 本单复用，禁第三份 canonical |
| L6 事实源（审批足迹/Group 语义） | ⚠️ | ApprovalService 足迹 asked/decided ✅；Group 双状态机为零（ExecEngine.kt:50 注释明示 S4 未做）——§8.3 语义在契约稿，实现本单落工具级 | 本单修（语义照 §8.3） |

置信度=⚠️（最弱层 L3 存储缺失=本单新开）；卡外发现无新增（UPG-77 审计遗留 3 挂账已登记）。

## 验收锚

- A1-1 扫描阶段零副作用（工具调用全部只读/无害——grep/编排断言）
- A2-1 审批单含步骤清单+支付行明示；部分同意可勾选
- A3-1 批准后清单指纹漂移→STALE 不执行（复用 UPG-73 语义亲杀）
- A4-1 无论单子同意与否，MONEY 步骤执行时必实时确认（亲杀：预批豁免→红）
- A5-1 拒绝=后续步骤全部撤销（足迹可见）
- 变异亲杀：预审单绕过安全闸（only-once/fail-closed 被跳过）→ 红

## 不做

- 不改权限/审批安全语义（UPG-68 不动）；不做无 UI 自动批（安全面保持 fail-closed）；不替代 UPG-75（并行兜底）
- READ/无害类是否免单：大神评审点（默认：READ 仍走清单展示但可「一键全同意」）

**红线**：预审单不绕过 UPG-68（only-once/fail-closed/嵌套闸）；MONEY 永远逐笔；清单指纹必须与执行复验绑定（防换头）。

**交付**：`审批预审单模式_设计_v1概览_2026-09-02.md`；卡：UPG-76

---

# UPG-77 审批判定单源化 + MCP 面死信通道处置 + SDK 契约纠偏（P0 安全）
**分类**：M2 体系/治理 ｜ 标签：M8 安全


```status
phase: merged
branch: feat/upg77
head: a7736b35
std: STD-UPG-77-v1
delivery_id: DEL-UPG77-20260903-001
designer: 📌 已派单·待认领（派单 `设计师\派单\UPG-77_审批判定单源化_派单_2026-09-03.md`；验收标准已冻结 `STD-UP
dev: ✅ **C 交付 @2026-09-03**（程序员 feat/upg77 **a7736b3**，worktree mov-upg77，基
inspector: ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P31：a7736b3 隔离 worktree｜全量
merge: ✅ **已合 main @a7736b3 @2026-09-03**（设计师B：ff-only 合入 + **已 push origin/m
actor: sys04-backfill
updated_at: 2026-09-05T08:42:01
```

**状态**：📌 已派单·待认领（派单 `设计师\派单\UPG-77_审批判定单源化_派单_2026-09-03.md`；验收标准已冻结 `STD-UPG-77-v1`，content_sha256=c80c5941） → 🆕 **已认领 @2026-09-03**（程序员 Claude/wmw0027，worktree mov-upg77，branch feat/upg77，2026-09-03 认领登记，基最新 main）｜ **优先级**：P0 ｜ → ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P31：a7736b3 隔离 worktree——全量 690/2/1 亲跑一致[基线预存 §P26 同项]+变异锚① 亲杀+**L3 三场景真机全实证**[default 弹窗→允许→handler 执行+拒绝无 req-N+open 强制弹窗→明文]——**呈现通道缺口闭环**+A2 待办 chip 同屏+manifest_sha 一致；**达待合→设计师**[P3 evidence 快照补落盘]）
→ ✅ **C 交付 @2026-09-03**（程序员 feat/upg77 **a7736b3**，worktree mov-upg77，基 origin/main 014c10f；A1 判定单源 guard.decide+isGranted / A2 死信面消除[registerPending+approvePending+permission.approve|deny 退役] / A3 SDK 双门纠偏；新增 McpServerApprovalTest 3/3 + 定向 35/0 + 全量 rerun 690/1sk/2fail[均 pre-existing AppearanceContractTest L2-9+M-U50-5] + 变异亲杀 3 锚全红还原复绿 + assembleDebug 绿；报告 `程序员\交付报告\DELIVERY_UPG77_2026-09-03.md`[DEL-UPG77-20260903-001+三重 hash]；**已登记两表**）
→ ✅ **已合 main @a7736b3 @2026-09-03**（设计师B：ff-only 合入 + **已 push origin/main**；合前抽查[红线 15/§六]——STD-UPG-77-v1 content_sha256 对账一致；a7736b3 父=014c10f FF 实证；§P31 真机证据抽查=用户视角最终结果可见[弹窗真机呈现+tap 允许→handler 真实执行+拒绝 APPROVAL_DENIED 无 req-N+open 仍强制弹窗→明文 {ok=true, missing=[商户名称]}+logcat answerer×3]，非机制触发；coverage PARTIAL 裁决已落交付报告[uncovered 经 §P31 真机补齐，风险退役]；verify-hash not-ancestor 随合入消解，审验复跑 HASH_OK 归档闭环归审验员）｜ worktree mov-upg77 可收
→ **依据**：2026-09-02 真机实测 P0——only-once 工具 vault.get 无审批弹窗直出明文凭据；设计师B 六路审计（main@014c10f）定位根因=**审批判定双写+双管线漂移**：only-once 强制 ASK 覆写只在调度器（McpToolScheduler.kt:317-319），MCP :8389 面没有（McpServer.kt:110-113），open 模式零点击明文；MCP 面 pending（req-N）无呈现面=设计内死信；SDK 文案（ToolSdkGenerator.kt:215-217 教 curl :8389 + :221 虚假承诺）诱导 LLM 走 MCP 面并产生「已申请审批」幻觉。评审增补：`设计师\方案设计\审批体系_总纲_v1_评审增补_设计师B_2026-09-02.md`（= 总纲 R0 案，UPG-75「A3-1 环境阻塞」随之改判真实缺陷）

## 标题

审批判定单源化：MCP 面与对话面共用同一判定入口（only-once 任何模式强制 ASK）+ PermissionGuard.pending 死信面消除（MCP 面 ASK 路由 ApprovalService FIFO，真弹窗真可批）+ ToolSdkGenerator 虚假承诺纠偏

## 背景

open 模式下 `McpServer.kt:110-113` 直查 `guard.guard()`，对已登记 ask 级工具 vault.get 判 ALLOW（`McpToolScheduler.kt:192-200`，isHighRisk 只认 shell.exec/credentials）→ `McpServer.kt:151` 直接执行——而 UPG-68 D 收口已拆 handler 内层闸（`MainActivity.kt:4010-4012`），**零点击明文直出**。default 模式下 MCP 面 ASK → `registerPending` 返 req-N（`McpServer.kt:121/133`），pending 存 `PermissionGuard.pending`（`McpToolScheduler.kt:51`）——chip 只读 ApprovalService.pendingList、permission.approve 无任何 UI 调用点（main 全仓 grep 零命中）——**req-N 永远不可见不可批**（真机 req-1/req-8/req-9 实证）。UPG-75 呈现三面在管线 1 内健康（审计：ALLOWED_ONCE 仅三个真实点击来源，全部分支 fail-closed），本单不动呈现层。

## 范围

- A1 判定单源化：抽出统一判定入口（含 only-once 强制 ASK 覆写），`McpToolScheduler.dispatch` 与 `McpServer` tools/call 共用——消除双写（不是再抄一个 if）；open 模式下 only-once 工具 MCP 面同样强制 ASK。
- A2 死信面消除：MCP 面 ASK 路由 `ApprovalService.request`（同一 FIFO/呈现/审计，HTTP 同步等待至多 60s fail-closed）；删除 `registerPending`/`PermissionGuard.pending`/`approvePending` 死面；`permission.approve`/`permission.deny` handler 随之退役（无 pending 可批）或保留空响应+说明文案——施工时按 grep 结果裁决并在交付报告声明。
- A3 SDK 纠偏：`ToolSdkGenerator.kt:221`「标 ask 的写类会再弹一次」改为真实语义（经 MCP 面调 ask 类工具 → 用户在 App 内实时审批，同步等待至多 60s；only-once 任何模式都需当次确认）。

## 分层溯源图（@014c10f · 红线 20/21 已复核）

| 层 | 判定 | 证据 | 断点处置 |
|---|---|---|---|
| L1 用户可感知（弹窗/通知/chip） | ✅ | MainActivity.kt:4371-4411 answerer；chip :7276-7285（管线 1 内健康） | 不依赖本单修 |
| L2 入口/桥接（双入口） | ⚠️ | native dispatch ToolCalls.kt:218/231→dispatch:257 ✅；MCP :8389 McpServer.kt:102-138 判定双写 ⚠️；SDK 匝道 ToolSdkGenerator.kt:215-217 + :221 虚假承诺 ⚠️ | 本单修（A1/A3） |
| L3 服务/数据（pending 存储） | ❌ | PermissionGuard.pending McpToolScheduler.kt:51 死信（无呈现面、approve 无调用方） | 本单修（A2） |
| L4 运行时装配（answerer/FIFO） | ✅ | MainActivity.kt:4371/:4414/:4418；ApprovalService.kt FIFO+CAS | 不碰 |
| L5 能力实物（vault.get handler） | ✅ | MainActivity.kt:4010-4044（闸在调度层=D 收口设计内） | 不碰 |
| L6 事实源（审批足迹） | ⚠️ | ApprovalService asked/decided 成对 ✅；MCP 面 pending 无 decided 终态 ⚠️ | 随 A2 收口 |

置信度=⚠️（最弱层 L2 双写）；卡外发现已登记挂账×3（僵尸窗竞态/通知权限静默/冷启动 action 丢失）。

## 验收锚

见冻结版 `STD-UPG-77-v1`（L3 定级；变异锚 3 个；真机 curl 三场景；全量回归+定向套件计数）。派单/验收/审验三处对账 content_sha256。

## 不做

- 不动 UPG-75 呈现层（弹窗/通知/chip 组件化=总纲 R1，另单）；不动 UPG-68 安全语义（only-once/fail-closed/嵌套闸）；不动 UPG-76 预审单设计；不做外部 MCP 客户端兼容层（旧 approve 流程废弃=设计裁决，异议走 STD 修订）

**红线**：安全语义只紧不松（任何模式下 only-once 不得直出明文）；fail-closed 不变；SDK 文案变更必须申报 Token/KV Cache 影响（AGENTS.md 硬规则 1）。

**交付**：卡：UPG-77；STD：STD-UPG-77-v1

---

# UPG-78 生成器派生项入库保鲜 + CI diff=0 门禁（ApprovalRegistry 系）
**分类**：M2 体系/治理 ｜ 标签：M9 工具链/CI


```status
phase: merged
branch: feat/upg78
head: f1e20678
std: STD-UPG-78-v1
delivery_id: —
designer: 📌 **已派单·待认领 @2026-09-03**（用户拍板「一起干了」；派单 `设计师\派单\UPG-78_生成器门禁_派单_2026-
dev: —
inspector: ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P33：f1e2067 隔离 worktree 三锚行
merge: ✅ **已合 main @f1e2067 @2026-09-03**（设计师B：ff-only 合入+**已 push origin/mai
actor: sys04-backfill
updated_at: 2026-09-05T08:42:01
```

**状态**：📌 **已派单·待认领 @2026-09-03**（用户拍板「一起干了」；派单 `设计师\派单\UPG-78_生成器门禁_派单_2026-09-03.md`；验收标准已冻结 `STD-UPG-78-v1`，content_sha256=26266fe8）｜ **优先级**：P2 → ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P33：f1e2067 隔离 worktree 三锚行为级复现——A1 删 inventory→dependsOn 自动重建+722/2/1[GeneratorTest 不再红=**§P25 P2-A2 闭环**]+A3 连跑两遍 md5 一致+内容零 drift[status M=CRLF 假差异]+A2 CI git diff --exit-code 门禁；manifest_sha 一致 ok:True；**§P25/§P27/§P30 三处生成器漂移遗留根治闭环**；**达待合→设计师**[CI 首跑回看=A2 终证]）
→ ✅ **已合 main @f1e2067 @2026-09-03**（设计师B：ff-only 合入+**已 push origin/main**；合前抽查[红线 15/§六]——STD-UPG-78-v1 sha=26266fe8 对账一致、6dd9161→f1e2067 FF 实证、§P33 证据=行为级复现[删 inventory 自动重建/连跑 md5 一致/注入红→还原绿]非口头；coverage=infra 面 FULL 无裁决位；遗留四件裁决：①C7=挂账在册（挂账-C7基线测试非确定性输出）不并单 ②catalog 归 UPG-70 线=派单边界确认 ③A1 前件如实=机制升级覆盖 stale 场景确认 ④**CI 首跑回看=本卡待办，push 后查 upg68-registry 首跑结果补记**）｜ worktree mov-upg78 可收
→ **依据**：合并三源——挂账-upg50-CI门禁断链tools.txt（P2：干净环境/CI 全量必红，审验员亲测坐实）+ 挂账-生成器产物漂移防护（生成物 stale 于生成器输出，ui.listComponents 漏行前科）+ UPG-75/76 交付④（全量测试重写生成物污染工作树，两次交付手工还原）

## 标题

生成器链路自供电+保鲜+无污染：ApprovalRegistryGeneratorTest 不再依赖手工 collect（干净环境全量绿）+ upg68-registry.yml 加 `git diff --exit-code` 门禁（三生成物漂移即红）+ 生成物入库后连跑零 M（手工还原成为历史）

## 分层溯源图（@main 6dd9161 · 红线 20/21 已复核）

| 层 | 判定 | 证据 | 断点处置 |
|---|---|---|---|
| L1 用户可感知 | — 豁免 | CI/工具链单，无用户面（红线 20 豁免声明） | — |
| L2 构建图 | ❌ 断链 | `app/build.gradle*` grep 无 collect（实证空）vs `ApprovalRegistryGeneratorTest.kt:27` 直读 `build/inventory/tools.txt` | A1 修（dependsOn 或测试内自生成） |
| L3 生成物 | ⚠️ 无门禁 | `docs/ApprovalRegistry.json`/`.md`/`PermissionRegistryData.kt` 入库在版但 `upg68-registry.yml:30-40` 无 git diff 步 | A2 修（照抄 upg70-catalog.yml 模式） |
| L4 生成器 | ✅ 不改 | ApprovalRegistryGeneratorTest:27-32（读 tools.txt→合并 semantics/categories→写三生成物，设计内写源树；保鲜后 diff 自然=0） | 不动 |
| L5 盘点/对账脚本 | ✅ | collect.mjs:57-58 产出 tools.txt；verify.mjs:18-20 缺文件即红 | 复用 |
| L6 事实源 | ✅ | docs/ApprovalRegistry.json 唯一事实源（V68-5）；guard 消费 PermissionRegistryData.kt | 不动 |

置信度=✅（断点明确、修法有 UPG-70 同款先例）；卡外发现无新增。

## 范围

- A1 测试自供电（gradle dependsOn 优先 / 测试内自生成备选）——干净环境全量绿
- A2 CI 漂移门禁（upg68-registry.yml 加 git diff --exit-code 限定三生成物）
- A3 污染结构性消除（连跑两遍零 M，交付声明不再手工还原）

## 验收锚

见冻结版 `STD-UPG-78-v1`（L2 定级；亲杀锚 3：断链复现红→绿 / 门禁注入非 0 / 连跑零 M）。

## 不做

不改生成器逻辑/人工输入文件/guard 消费侧；不动 upg70-catalog.yml；不动 C7 基线测试（另挂账）；门禁不全仓 diff（autocrlf 假阳性坑，路径限定）

**红线**：生成物三文件=docs/ApprovalRegistry.json+.md+PermissionRegistryData.kt 仅限门禁范围；Token/KV 两节申报（预期 0/0 也必写）；CI 合 main 后首跑结果回看补记。

**交付**：卡：UPG-78；STD：STD-UPG-78-v1

→ 🆕 **已认领 @2026-09-03**（程序员 Claude/wmw0027，worktree mov-upg78，branch feat/upg78，2026-09-03 认领登记，基 main 6dd9161）
→ ✅ **C 交付 @2026-09-03**（程序员 feat/upg78 **f1e2067**，worktree mov-upg78，基 origin/main 6dd9161；A1 构建自供电[testDebugUnitTest dependsOn approvalInventoryCollect：tools.txt 每跑自动盘点刷新，新 handler 必被盘点，stale 不再漏检] / A2 CI 漂移门禁[upg68-registry.yml verify 后加 git diff --exit-code，路径限定三生成物防 autocrlf 假阳] / A3 生成物校准入库[+ui.listComponents read/free/low/harmless=false，漂移根因结构性消除]；验证：A1 删 inventory → 全量 722/2 既存基线/1skip 绿[collect 自动重建 tools.txt=180]；A2 注入 token 门禁 exit=1→还原 exit=0；A3 --rerun-tasks 连跑两遍三生成物零 M+md5 一致[json=8ad1d02e/md=dd22d4bb/kt=5ea1840e]；回归 collect=180 / verify rows=201·在面180·防御21 全过 / single-channel A7 通过 / PermissionGuardTest 15/0/0 / assembleDebug 绿；报告 `程序员\交付报告\DELIVERY_UPG78_2026-09-03.md`[DEL-UPG78-20260903-001+code f1e2067+artifact 72d42436+manifest f7c87479]；Token/KV 0/0；共享面影响+coverage FULL 见 DELIVERY §六；verify-hash HASH_REJECT not-ancestor 如实留证[未合 main 故非祖先，合后复跑闭环]；**已登记两表**）——待验收员走 STD-UPG-78-v1 L2 亲跑复现 → 审验 → 设计师合 main（合后 upg68-registry CI 首跑回看补记）
---

# UPG-79 审批呈现层组件化（ApprovalSurface + CardShell v1 视觉 + 渠道三修）
**分类**：M2 体系/治理 ｜ 标签：M8 UI/交互


```status
phase: merged
branch: feat/upg79
head: 5cf546de
std: STD-UPG-79-v1
delivery_id: —
designer: 📌 **已派单·待认领 @2026-09-03**（总纲 R1=审批体系最后一块，用户拍板派出；派单 `设计师\派单\UPG-79_审批呈
dev: —
inspector: ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P34：3925561 隔离 worktree｜
merge: ✅ **已合 main @5cf546d @2026-09-03**（设计师B：rebase f1e2067 后 ff-only 合入+**
actor: sys04-backfill
updated_at: 2026-09-05T08:42:00
```

**状态**：📌 **已派单·待认领 @2026-09-03**（总纲 R1=审批体系最后一块，用户拍板派出；派单 `设计师\派单\UPG-79_审批呈现层组件化_派单_2026-09-03.md`；验收标准已冻结 `STD-UPG-79-v1`，content_sha256=97f756ff）｜ **优先级**：P1 → ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P34：3925561 隔离 worktree——全量 734/2/1 亲跑一致+ApprovalLogic 9 用例+**变异④ 亲杀**[only-once 勾选禁则]+红线零改动；L2 CARD v2 采信程序员 4 图实证[同 AVD+呈现机制 UPG-77 已实证]+验收员抽验受阻如实记录；受限 3 项真机复验专项待环境恢复；**达待合→审验员→设计师**）
→ ✅ **已合 main @5cf546d @2026-09-03**（设计师B：rebase f1e2067 后 ff-only 合入+**已 push origin/main**——rebase 前后 patch-id 4d645861 逐字节等价实证[3925561≡5cf546d]，合后定向 ApprovalLogic/ComponentContract/ApprovalQueue BUILD SUCCESSFUL；合前抽查[红线 15/§六]——STD-UPG-79-v1 sha=97f756ff 对账一致、§P34 证据=代码核物+变异亲杀实物；**用户视觉反馈处置**：截图灰带（#ECECEC）经网格采样+colors.xml+最终代码三方核对=**3925561 已无此灰带**（卡体纯白、勾选行无背景，与用户要求一致，截图疑为 WIP 版）——若新包仍见灰带按 P3 新单追）
→ ⚖️ **审验发现两件裁决 @2026-09-03（设计师B）**：①**交付登记缺口**（DELIVERY_UPG79 报告/manifest/evidence 未落盘）=**程序员补证待办**（UPG-77 P3 先例，补齐后审验对账销项）；②**冷启动进程死语义**=设计内不可达（results 内存表随进程灭——completeFromBroadcast 空表空操作=fail-closed 不批准，安全方向成立），STD 场景②「杀进程→决策生效」口径不可达，转 挂账-upg79-冷启动语义补验（真机补验=Activity 存活冷路径 onNewIntent 决策生效+进程死=点击无效不批准，补验后 STD 派生 v2 修订口径）
→ **依据**：总纲 v1「L2 呈现层=体系唯一黑洞」+ 评审增补——UPG-75 呈现为散装内联实现（弹窗/通知/chip 三处分立、零组件测试）；视觉口径用户已拍板（demo v2 + 审批卡片_组件设计_v1）；三 P2 挂账随单修（僵尸窗竞态/通知权限静默/冷启动 action 丢失，全部 main 实证锚定）

## 标题

审批呈现层收口：ApprovalSurface 单组件（ApprovalService 队列唯一数据源，悬浮卡/通知/待办面板/预审单卡四投影）+ CardShell v1 视觉（用户拍板：居中悬浮卡/环形倒计时+环心队列号/参数卡/单勾选/支付行锁定/拒绝左同意右）+ 渠道三修（通知权限检查/冷启动 action/僵尸窗守卫）+ 组件级测试从零到有

## 分层溯源图（@main 6dd9161 · 红线 20/21 已复核）

| 层 | 判定 | 证据 | 断点处置 |
|---|---|---|---|
| L1 呈现面（弹窗/通知/chip/预审单卡） | ⚠️ 散装 | buildApprovalDialogView:7772 / showApprovalPanel:7609 / refreshApprovalChip:7597 / showPlanSheet:5676 四处分立；原生 AlertDialog 样式与令牌体系不符（新视觉已拍板） | 本单收口（A1/A2） |
| L2 入口/装配 | ✅ | answerer:4361 / onQueueChanged:4408 / presentationCanceller:4405 单点装配，组件化有直接挂点 | 保留 |
| L3 通知通道 | ⚠️ | `areNotificationsEnabled` 全仓零命中（P2-a 实证）；ACTION_ALLOW 仅 onNewIntent:8191 处理、onCreate 无（P2-b 实证）；ApprovalActionReceiver 死代码 | A3 修 |
| L4 弹窗生命周期 | ⚠️ | approvalDialogDeferred:4371 先赋值、:4377 后建窗——窗口期=僵尸窗竞态（P2-c，用户曾见弹窗叠加） | A3 修 |
| L5 数据源 | ✅ | ApprovalService FIFO/pendingList/onQueueChanged（:91,:282）——唯一数据源，组件=纯投影 | 不动 |
| L6 足迹 | ✅ | asked/decided 成对（UPG-75/77 已验）；P2-a 新增「通知未授权」足迹种类 | 本单加 |

置信度=✅（全部锚点 main 亲核）；卡外发现无新增。

## 范围

- A1 ApprovalSurface 组件（五处收编，MainActivity 只留装配；对 ApprovalService 只读）
- A2 CardShell v1 视觉落地（照 demo v2/组件设计 v1，禁硬编码色值；预审单卡同壳）
- A3 渠道三修（通知权限 areNotificationsEnabled + 未授权如实处置 / onCreate ACTION 转发 / 僵尸窗 isCompleted 守卫）
- A4 组件级测试（投影/勾选行规/超时/守卫/权限/转发）

## 验收锚

见冻结版 `STD-UPG-79-v1`（L3 定级；变异锚 5；真机 L3 四场景 curl 触发不需 AI key——悬浮卡呈现/通知+冷启动/权限关闭无谎言日志/chip 同源推进）。

## 不做

L0/L1 语义零改动（decide/isGranted/FIFO/request）；UPG-76 机制零改动（仅 UI 收编）；预审单卡真机场景仍属挂账-upg76-L3真机补验（AI key 恢复后补）；不做通知渠道 redesign（按挂账修法修，不重写）

**红线**：组件对 ApprovalService 只读（禁第二数据源）；fail-closed/only-once 语义不变；MainActivity 纯 CRLF；Token/KV 两节申报（预期 0/0）。

**交付**：卡：UPG-79；STD：STD-UPG-79-v1

---

# UPG-80 AI 对话链路诊断修复（模拟器 DeepSeek 链路）+ 联动补验
**分类**：M1 体验/功能 ｜ 标签：M7 环境/验证


```status
phase: merged
branch: —
head: —
std: STD-UPG-80-v1
delivery_id: —
designer: 📌 **已派单·待认领 @2026-09-03**（派单 `设计师\派单\UPG-80_AI对话链路修复_派单_2026-09-03.md
dev: ✅ **C 交付 @2026-09-03**（程序员 Claude/wmw0027，**零代码改动**｜A2 判定纯环境/配置面，无代码缺陷
inspector: ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P36：零代码诊断单复核通过｜A1 诊断证据在档[AI
merge: ✅ **已闭环 @2026-09-03**（零代码单无合 main 对象：验收员 §P36 + 审验 confirmed｜A1 诊断 log
actor: sys04-backfill
updated_at: 2026-09-05T08:42:00
```

**状态**：📌 **已派单·待认领 @2026-09-03**（派单 `设计师\派单\UPG-80_AI对话链路修复_派单_2026-09-03.md`；STD-UPG-80-v1 已冻结 sha=d666e636）｜ **优先级**：P1（验证环境根） → ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P36：零代码诊断单复核通过——A1 诊断证据在档[AI 未回复挂账可销]；**A3 UPG-76 场景① 全链实证补入**[预审单四段全实证——§P32 场景① 阻塞解除]；场景③④✅+② ⛔ payment mock 待接；**removeAll 缺陷实锤转单**[批量写同工具名被砍单——MainActivity:5543]）
→ ✅ **已闭环 @2026-09-03**（零代码单无合 main 对象：验收员 §P36 + 审验 confirmed——A1 诊断 logcat 全链路健康在档[首查截断误判取全文核实]、联动 UPG-76 L3 ①③④ 全实证[预审单六锚/已批执行+未批阻断+计划外新窗/门槛单步弹窗]、脱敏闸 54 文件零非打码 key；挂账-模拟器AI未回复 已销、挂账-upg76-L3 ①③④ 已实证仅剩② MONEY 转 挂账-payment.pay handler缺失；审验发现① removeAll 缺陷已转 UPG-85 P1）
→ **依据**：挂账-模拟器AI未回复（2026-08-26，P1）+ 挂账-upg76-L3真机补验四场景（随 main 联动裁决）——同环境根；阻塞全部对话面真机验收
→ 🆕 **已认领 @2026-09-03**（程序员 Claude/wmw0027，主仓库 0027-mov 诊断先行[可能零代码]；如需改代码开 worktree mov-upg80 / branch feat/upg80，基 main f1e2067[UPG-78 已合入]；A1 诊断[emulator-5556 logcat 证据链→根因] → A2 修复[配置/代码] → A3 实证+UPG-76 L3 四场景联动补验；脱敏红线全程
→ ✅ **C 交付 @2026-09-03**（程序员 Claude/wmw0027，**零代码改动**——A2 判定纯环境/配置面，无代码缺陷，无分支产物、无 DEL 绑定）；A1 诊断[emulator-5554 logcat 证据链实证链路健康：key 注入成功→request/header 发出→网络可达→chunk×65 流式→assistant 落地，历史「AI 未回复」根因=审批弹窗未确认/环境缺 key 状态，本次弹窗确认后往返成功]；A3 UPG-76 L3 四场景联动补验[feat/upg76@6dd9161 APK]：场景① 全链实证[cb4e/cb4g：write+rescan 双写类→预审单 2 行→部分勾选→logcat 批准=1/拒绝=1→write HIT 执行、rescan 已决否阻断下游，模型如实汇报] / 场景③ 次数耗尽实证[cb3 rescan 超授权→同调用转新审批弹窗]+EXPIRED 由 JVM 定向覆盖 / 场景④ 沿用 s4 四连测单步不出单 / 场景② ⛔ 环境阻塞如实记录[payment.pay 无 handler→TOOL_NOT_FOUND 如实报用户，非静默；语义由 JVM 定向测试覆盖]；补验新发现：疑似缺陷 MainActivity.kt:5543 `removeAll{it.tool==info.toolName}` 误删同工具多步[批量写同工具名清单被砍至 1 步→grade=1 不出预审单，建议登记核实修复]；报告 `程序员\交付报告\DELIVERY_UPG80_2026-09-03.md`；两挂账销项在报告 §七 逐条对应证据[挂账-模拟器AI未回复 / 挂账-upg76-L3真机补验四场景(场景②环境受限声明保留)]；Token/KV 0/0[零代码改动无增量]；**已登记两表**——按 STD-UPG-80-v1 待后续验收（零代码单无 DEL/产物可验）

## 标题

诊断修复模拟器 AI 对话链路（logcat 证据先行，不许猜）→ 真机对话往返实证 → 联动执行 UPG-76 L3 四场景补验（一次解锁两笔账）；全程脱敏（git grep sk- 零命中）

## 验收锚

见 `STD-UPG-80-v1`（L3 定级；亲杀锚：失败如实/修复实证/脱敏闸；真机对话往返+UPG-76 四场景全过为销项）。

## 不做

不绕诊断直接换 key 碰运气；不动请求链路语义（若必须动，Token/KV 详报）；key 不落盘

**红线**：脱敏（key 任何片段不进文件/git/截图）；诊断结论必须带 logcat 证据行。

**交付**：卡：UPG-80；STD：STD-UPG-80-v1

---

# UPG-81 基线 2 失败契约锚同步修（AppearanceContractTest 适配收拢版现实）
**分类**：M2 体系/治理 ｜ 标签：M9 工具链/测试

→ ✅ **验收员复验+审验 通过 @2026-09-03**（ACCEPTANCE_LOG §P37 + 审验 confirmed：3339c4b 单文件 +18/−8[红线只动测试文件✅]、消音判定=对齐非消音[删 6 旧断言增 6 新锚仍锁行为，合法性=UPG70 裁决项 1]、来源行亲核在场、K1 亲杀独立复验红→还原零残留、全量 734/0/1、manifest 6/6 ok:True、STD sha=c3f7009a 对账一致；**达待合→设计师**）
→ ✅ **已合 main @fab7d29 @2026-09-03**（设计师B：rebase 8647ee9 后 ff-only 合入+**已 push origin/main**——patch-id 469fb555 逐字节等价实证[3339c4b≡fab7d29]；合后全量 `--rerun-tasks` 亲跑 **BUILD SUCCESSFUL（0 失败）**=「基线预存 2 失败」时代终结坐实；自此各单「基线预存 2 失败沿用申报」口径作废，全量绿=0 失败）｜ worktree mov-upg81 可收

```status
phase: merged
branch: feat/upg81
head: fab7d29e
std: STD-UPG-81-v1
delivery_id: DEL-UPG81-20260903-001
designer: 📌 **已派单·待认领 @2026-09-03**（派单 `设计师\派单\UPG-81_基线契约锚同步修_派单_2026-09-03.md
dev: ✅ **C 交付 @2026-09-03 09:19**（程序员 Claude/wmw0027，commit 3339c4b @feat/u
inspector: ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P39：8609d69 隔离 worktree
merge: ✅ **已合 main（补登 @2026-09-05）**（审验员 09-05 核实：3339c4b patch-id≡**fab7d29*
actor: sys04-backfill
updated_at: 2026-09-05T08:42:00
```

**状态**：📌 **已派单·待认领 @2026-09-03**（派单 `设计师\派单\UPG-81_基线契约锚同步修_派单_2026-09-03.md`；STD-UPG-81-v1 已冻结 sha=c3f7009a）｜ **优先级**：P2 ｜ → ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P37：3339c4b 隔离 worktree——全量 **734/0/1 亲跑终验，基线预存 2 失败消除**+契约锚与现实对齐非消音[L1-10 认账收拢现实+M-U50-5 改锚 render-only 真实表达]+**K1 亲杀**[旧断言回潮红→还原]+manifest_sha 一致；**达待合→设计师**——合后全量回归=0 失败基线） → ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P39：8609d69 隔离 worktree——**§P36 转单 P1 闭环**：removeAll→indexOfFirst+removeAt+>=0 守卫[同 tool 后续保留可勾选]+取舍论证实锤+全量 730/2/1 亲跑一致[PlanApproval 35]+**M1 亲杀**[failed=3 与申报一致]；L2 真机呈现环境阻塞登记[需 AI key]；**达待合→审验员→设计师**） → ✅ **已合 main（补登 @2026-09-05）**（审验员 09-05 核实：3339c4b patch-id≡**fab7d29** 逐字节等价 ∈ origin/main——**09-03 即已合**，「达待合挂 2 天」系登记缺失不成立；⚠️ 本卡 §P39 段（8609d69 removeAll 修复）实为 **UPG-85** 的验收记录错挂本卡——与 §P54 错挂 UPG-47 同族，归位见 UPG-85 卡）
→ **依据**：用户拍板裁决（UPG70_裁决记录 裁决项 1）——基线 2 失败（L2-9 1B + M-U50-5，收拢版带病合入遗留）处置=契约锚同步修，归属阶段 1 维护单；消灭「pre-existing」口径恢复全量 0 失败

→ 🆕 **已认领 @2026-09-03 08:55**（程序员 Claude/wmw0027，worktree mov-upg81，branch feat/upg81，2026-09-03 认领登记，基 main 5cf546d[UPG-79 已合入]；按派单施工：修前复跑实证 L2-9 1B + M-U50-5 两红留 XML → 逐案断言适配收拢版现实（来源文件:行号）→ 修后全量 --rerun-tasks 0 失败 → 亲杀锚断言破坏必红 → Token/KV 0/0 → 交付报告 + 登记两表）
→ ✅ **C 交付 @2026-09-03 09:19**（程序员 Claude/wmw0027，commit 3339c4b @feat/upg81[基线 5cf546d]，1 文件 +18/−8；契约锚同步修[裁决 UPG70-裁决项1]：L1-10[认账收拢现实 .back{font-size:20px}@AppearanceApp.vue:270 + 应用壳字族写死@:268；语义 token 契约改由 Resolver 形态层真实消费 font-weight:var(--font-weight)@tokens.css:214 锚定防 token 空转]/M-U50-5[纯 span 骨架禁交互标签+aria-hidden 装饰+demo select 拦截@:234]；派单文字「L2-9 1B」经裁决记录确认系笔误[裁决原文即 L1-10+M-U50-5]，L2-9 1B 实测基线绿；修前定向 16/2 红留 XML → 修后全量 --rerun-tasks 734/0/1[BUILD SUCCESSFUL @09:10:16]；亲杀 K1[禁写死字号旧断言回潮→L1-10 FAILED]/K2[pointer-events 旧断言回潮→M-U50-5 FAILED]双杀实测红→还原绿；零样式/源码改动[红线：只动测试文件]；报告 程序员\交付报告\DELIVERY_UPG81_2026-09-03.md[DEL-UPG81-20260903-001+code 3339c4b+artifact ac64f567+manifest 145a3630，绑定 STD-UPG-81-v1 content c3f7009a]；证据 程序员\UPG81-evidence\[before/after/full_run 99xml+SUMMARY/kill，manifest 6 条 E-001~006，审验.py --manifest 复验 ok:True]；Token/KV 0/0 见报告七节；verify-hash HASH_REJECT not-ancestor 如实留证[未合 main，合后复跑闭环，红线 23]；**已登记两表**）——待验收员走 STD-UPG-81-v1 复验 → 审验 → 设计师合 main
## 标题

两个契约断言同步收拢版硬编码现实（.back{font-size:20px} 等，逐条对账来源行号）——全量首次 0 失败；零样式源码改动（修断言非改样式）；亲杀锚=断言改回/样式破坏→红

## 验收锚

见 `STD-UPG-81-v1`（L2 定级；修前 2 红实证→修后全量 0 失败 XML；零样式改动）。

**红线**：只动测试文件；断言保持有效性（不削成摆设）；Token/KV 0/0 申报。

**交付**：卡：UPG-81；STD：STD-UPG-81-v1

---

# UPG-82 执行引擎 S4：ApprovalGroup 双状态机 + EXPIRED + EdgePolicy 失败传播（能力级）
**分类**：M2 体系/治理 ｜ 标签：M5 执行链路


```status
phase: merged
branch: feat/upg82
head: fe8cd45b
std: STD-UPG-82-v1
delivery_id: DEL-UPG82-20260903-001
designer: 📌 **已派单·待认领 @2026-09-03**（派单 `设计师\派单\UPG-82_执行引擎S4_派单_2026-09-03.md`；
dev: ✅**C 完成 @2026-09-03 10:17**（feat/upg82 **6e9f90e** 已 push origin，基底 ma
inspector: ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P38：6e9f90e 隔离 worktree｜模块
merge: ✅ **已合 main @fe8cd45 @2026-09-03**（设计师B：验收 §P38+审验 confirmed 达待合后｜reba
actor: sys04-backfill
updated_at: 2026-09-05T08:42:00
```

**状态**：📌 **已派单·待认领 @2026-09-03**（派单 `设计师\派单\UPG-82_执行引擎S4_派单_2026-09-03.md`；STD-UPG-82-v1 已冻结 sha=6a1ab899）｜ **优先级**：P1 → ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P38：6e9f90e 隔离 worktree——模块 88/0 亲跑[S2/S3 60 零回归+S4 28]+组簿 compute 单桶锁（§P29 教训前置）+**M3 亲杀**[组闸删除→2 红——S3 绕道封死]+M1/M2/M4 采信+S2/S3 零改动辨析+coverage FULL；**达待合→审验员→设计师[合序 71→72→73R1→82]**）
→ ✅ **已合 main @fe8cd45 @2026-09-03**（设计师B：验收 §P38+审验 confirmed 达待合后——rebase ad1e0a8 零冲突+patch-id bfde1cc7 逐字节等价[6e9f90e≡fe8cd45]+`:mov-exec-engine:test` BUILD SUCCESSFUL+ff-only 合入+**已 push origin/main**；审批线 76/77/79/84/85+引擎线 71/72/73/82 全收口）｜ worktree mov-upg82 可收
→ 🆕 **已认领 @2026-09-03 09:39**（程序员 Claude/wmw0027，worktree mov-upg82，branch feat/upg82，2026-09-03 认领登记，基 main 8647ee9[UPG-78/79/84 已合入]；按派单施工：ApprovalGroup 双状态机+EXPIRED+EdgePolicy+G11 事件链，只动 mov-exec-engine 模块——与全部在施单零重叠）→ ✅**C 完成 @2026-09-03 10:17**（feat/upg82 **6e9f90e** 已 push origin，基底 main 8647ee9；五件全交：①**ApprovalGroup 双状态机**[approval 子包新开：Group pending→partially_decided→completed|expired|stale × Node PENDING+五终态照 §8.3；组创建=单次提交、逐条独立授权 per-requestId 首决胜；组簿 ConcurrentHashMap+compute 单桶锁——§P29 HIGH 线程安全教训前置；禁入口无 update/remove/rollback 反射锚；组 id=grp_+sha256 确定性] ②**EXPIRED**[§6.3：TTL→组+pending 节点 EXPIRED ≠REJECTED；MONEY 三不实测；不复活=组闸内嵌 dispatchApproved 封死 S3 直呼绕道+组态闸 dispatchApprovedNode；要跑=新 revision 新 requestId 新组——同 revision 重发被 S3 幂等拒绝即机制表达] ③**EdgePolicy**[§8.1：值集 enum 冻结四值；DEFAULT 全失败通道 BLOCK[G8]；CONTINUE_INDEPENDENTLY 仅 declared() 显式；Graph-local 聚合纯函数保守序 BLOCK>REQUIRE_HUMAN>SKIP>RUNNABLE；不建 Graph 不越界 S5——JobSpec.dependencies 未动] ④**G11 事件链**[Ledger+4 事件 POLICY_VALIDATED/APPROVAL_PARTIALLY_DECIDED/APPROVAL_GROUP_COMPLETED/APPROVAL_EXPIRED；G11Chains 四模板+漏记检测纯函数[缺失不消费游标/乱序同报]；主链截断 DISPATCHED 不造假 RUN_COMPLETED] ⑤**守卫固化**[G4 组级+节点级双锚/G8 四通道断流/EXPIRED 复活双通道拦/G11 漏记检测自证]；**测试**=mov-exec-engine 14 套件 **88/0/0**[--rerun-tasks 真跑；S2/S3 基线 60 零回归+S4 新增 28]+**变异 4 锚亲杀全红**[M1 删节点已决检查→G4 红/M2 默认放行→G8 系 4 红/M3 删组闸→不复活+漂移 STALE 2 红/M4 删 POLICY_VALIDATED→主链断言红；还原后全量复绿]+app 全量 **724/2/1**[2 失败=AppearanceContractTest L1-10/M-U50-5 **基线预存**——UPG-81 3339c4b 未合 main merge-base 实证，与 UPG-84 验收未开工口径逐位一致=**零新增失败**]+assembleDebug 绿；**边界声明**=能力级（本单）vs 工具级（UPG-76 PlanApprovalStore app 侧）零接触、语义同源 §8.3 词表、层各其主不合并不互调；S2/S3 判定语义零改动辨析在报告 §三[组闸仅对组内 request 生效+POLICY_VALIDATED 补链，非组路径回归锚锁定]；G11 事件链真实 dump 落证据目录（临时导出类已删不入库）；Token/KV 两节 0/0；Code-LOC +1259/-1/净+1258；coverage_status=FULL[共享面零触碰，diff 仅 mov-exec-engine 9 文件]；verify-hash 交付时点 HASH_REJECT not-ancestor 如实申报[分支未合态必然结果，合后由验收员复跑]=**待合后复核**；delivery_id=DEL-UPG82-20260903-001 预登记[三重 hash+manifest_sha=160fcd57]；报告 DELIVERY_UPG82_2026-09-03.md；**已登记两个表**）——待验收员验收（L1 复核+变异复杀+合后 verify-hash 终态复核）
→ **依据**：执行引擎 v0.4 §11 切片 S4（S2@bd958d2/S3@add9e8c 已合 main）；ApprovalGroup/Expiry/EdgePolicy 全仓为零（grep 证实，ExecEngine.kt:50 注释明示）；与 UPG-76 工具级 PlanApprovalStore 层边界=语义同源、层各其主、不合并不互调

## 标题

S3 审批原语接批量裁决：ApprovalGroup 双状态机（Group pending→partially_decided→completed|expired|stale × Node 五态）+ TTL→EXPIRED 不复活（MONEY 超时必须重新确认）+ EdgePolicy 值集冻结默认断流（§8.1 Graph-local）+ G11 事件链——纯 JVM 可单测不接 UI

## 分层溯源图（@main 6dd9161 · 红线 20/21 已复核）

| 层 | 判定 | 证据 | 断点处置 |
|---|---|---|---|
| L1 用户可感知 | — 豁免 | 纯 JVM 机制单无 UI（装配级 APK） | — |
| L2 模块面 | ✅ | mov-exec-engine 纯 JVM 零 Android 依赖（settings.gradle.kts:21） | 不动 |
| L3 审批原语 | ✅ | approval 子包 6 文件（S3：Book/Snapshot/Request/Codec/Fingerprint/Renderer） | 扩展不回头改 |
| L4 Group/Expiry/EdgePolicy | ❌ 缺失 | 全仓 grep 零命中（ExecEngine.kt:50 注释明示 S4 未做） | 本单新开 |
| L5 策略源 | ✅ | CapabilityReader+Registry side_effect 单源（G2 持续守） | 不动 |
| L6 Ledger | ✅ | append-only Ledger（S2，G7 持续守） | 事件词表并入 |

置信度=✅；边界声明：能力级（本单）vs 工具级（UPG-76 PlanApprovalStore，app 侧）——语义同源（§8.3 词表）、层各其主、不合并不互调。

## 验收锚

见 `STD-UPG-82-v1`（L3 定级；变异锚 4：G4 二次 decide→CONFLICT / G8 默认断流 / EXPIRED 复活→红 / G11 漏记→红）。

## 不做

不接 UI/app 编排；不做幂等（S6）/Graph 改造（S5）；不动 S2/S3 现有类语义；禁第二策略源

**红线**：层边界声明必落报告；DeterministicSummary 禁 LLM；Token/KV 0/0 申报。

**交付**：卡：UPG-82；STD：STD-UPG-82-v1

---

# UPG-83 CODE 模式 tool.call 受控通道（SDK 弃 curl 匝道）
**分类**：M2 体系/治理 ｜ 标签：M8 安全


```status
phase: obsolete
branch: —
head: —
std: STD-UPG-83-v1
delivery_id: —
designer: 拍板「只要两种模式：经典+极简，极简只是画面极简不阉割能力」｜5→2 模式收敛转 UPG-84：code 模式退役，本单修复对象消失，根因消
dev: —
inspector: —
merge: —
actor: sys04-backfill
updated_at: 2026-09-05T08:42:00
```

**状态**：❌ **已作废 @2026-09-03**（注明：原“已取消”，E4 终态词统一为作废（用户拍板「只要两种模式：经典+极简，极简只是画面极简不阉割能力」——5→2 模式收敛转 UPG-84：code 模式退役，本单修复对象消失，根因消除优于补丁；STD-UPG-83-v1 冻结留档不删）｜ ~~优先级：P1~~
→ **依据**：用户实测（CODE 模式读凭据先弹「写入」卡+双重审批+重试循环）→ 挂账-code模式curl匝道双重审批 + 溯源：CODE 面=codeTools{shell.exec,tool.help}（MainActivity.kt:369 刻意设计）→ B 扩面案否决转 D 案

## 标题

新增 tool.call{name,arguments} 元工具直走 dispatch（内层审批面正确呈现：vault.get→敏感 only-once 卡而非写入卡）+ 安全边界（禁 uiOnly/禁递归/本体 free 内层闸自理）+ SDK 弃 curl+token 教学改教 tool.call

## 分层溯源图（@main 5cf546d · 红线 20/21 已复核）

| 层 | 判定 | 证据 | 断点处置 |
|---|---|---|---|
| L1 用户可感知（审批卡面目） | ⚠️ | 读凭据弹「写入」卡（2026-09-03 平板实测 logcat ApprovalVis tool=shell.exec×3） | 本单修（A1 内层审批面正确呈现） |
| L2 工具面装配 | ⚠️ | CODE 过滤 MainActivity.kt:7431 → codeTools:369 仅 {shell.exec,tool.help}——vault.get 不在面是刻意设计 | A1：tool.call 入 codeTools |
| L3 SDK 教学（匝道） | ⚠️ | ToolSdkGenerator.kt:215-217 curl 教学（UPG-77 已修 :221 假承诺，匝道本体仍在）；token 文件 LLM 实证可读（journal） | A3：弃 curl 改教 tool.call |
| L4 判定/审批链 | ✅ | guard.decide/isGranted/dispatch 单源（UPG-77）；MCP 面 ASK 路由 FIFO | 不动（内层直走继承） |
| L5 元工具通道 | ❌ 缺失 | 全仓无 tool.call（grep 证实） | 本单新开 |
| L6 登记层 | ✅ | PermissionRegistryData 单源（UPG-68 注册即校验闭环） | A1：free 登记+注释 |

置信度=✅（根因钉死，修法有 UPG-77 判定链可继承）；卡外发现无新增。

## 范围

- A1 tool.call 元工具（dispatch 内层路由 + codeTools + free 登记）
- A2 安全边界（禁 uiOnly/禁递归/超时兼容）
- A3 SDK 弃 curl 教学改 tool.call
- A4 测试（路由审批面/uiOnly/递归/CODE 面/SDK 文案锚）

## 验收锚

见 `STD-UPG-83-v1`（L3 定级；变异锚 4：内层旁路/uiOnly/递归/SDK 复教 curl→各红；真机用户场景复现：CODE 模式读凭据→敏感卡单次审批）。

## 不做

不改 CODE 模式定义（codeTools 语义不动，仅 +tool.call）；不封堵 curl 物理可达（C 案否决留评审）；不动 UPG-68/77 安全语义

**红线**：tool.call 本体 free 不豁免任何内层审批；Token/KV 两节必报（SDK 节=system prompt 组成）。

**交付**：卡：UPG-83；STD：STD-UPG-83-v1

---

# UPG-84 模式收敛 5→2（工具面去模式化 + SDK 匝道段删除）
**分类**：M2 体系/治理 ｜ 标签：M8 UI/交互


```status
phase: merged
branch: feat/upg84
head: 8647ee9e
std: STD-UPG-84-v2
delivery_id: DEL-UPG84-20260903-001
designer: 📌 **已派单·待认领 @2026-09-03**（用户拍板「只要两种模式：经典+极简，极简只是画面极简不能阉割能力」；派单 `设计师\派
dev: ✅ **C 交付 @2026-09-03 08:33**（程序员 Claude/wmw0027，commit e95472f @feat/u
inspector: ✅ **验收员复验+审验 通过 @2026-09-03**（ACCEPTANCE_LOG §P35 + 审验 confirmed：e9547
merge: ✅ **已合 main @8647ee9 @2026-09-03**（设计师B：ff-only 合入+**已 push origin/mai
actor: sys04-backfill
updated_at: 2026-09-05T08:42:00
```

**状态**：📌 **已派单·待认领 @2026-09-03**（用户拍板「只要两种模式：经典+极简，极简只是画面极简不能阉割能力」；派单 `设计师\派单\UPG-84_模式收敛_派单_2026-09-03.md`；**STD-UPG-84-v2** 已冻结 sha=b279e978——v2 增补：用户拍板「极简=快速（reasoning off+简洁提示词）、经典=深度思考（reasoning high）」，快速/深思开关收敛进本单 A5，v1 留档）｜ **优先级**：P1 → ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P35：e95472f 隔离 worktree——全量 724/2/1 亲跑一致[UPG-81 未开工口径成立]+Upg84ModeConverge 6 锚全绿+五模式零残留[ToolSdkGenerator 部分保留=tool.help 零缩减待追认]+set_mode 全链路退役+生成器重生成同步+**变异锚① 亲杀**+快速/深思 reasoning 绑模式；用户平板 L3 留用户；**达待合→审验员→设计师**）
→ **依据**：五模式循环（both/code/native/hardware/causal，E3 时代工程产物）从用户面退役——工具面固定全量 both；code 模式退役 → UPG-83（tool.call 补丁单）取消（根因消除优于补丁）；两态开关「经典⇄极简」归极简批阶段 1（送审稿入口决策点，不在本单）

→ 🆕 **已认领 @2026-09-03 08:04**（程序员 Claude/wmw0027，worktree mov-upg84，branch feat/upg84，2026-09-03 认领登记，基 main 5cf546d[UPG-79 已合入]；按派单 A1-A5 施工——工具面固定全量+SDK 匝道段删除+快速/深思收敛[STD v2]+两态开关本单不断[归极简批]）
→ ✅ **C 交付 @2026-09-03 08:33**（程序员 Claude/wmw0027，commit e95472f @feat/upg84[基线 5cf546d]，16 文件 +287/−755；A1 工具面固定全量 + A1b 顶部钮断循环占位；A2 codeSdk 匝道段/ToolSdkGenerator/codeTools 删（tool.help 保留=零缩减）；A3 presentation.set_mode 三名单同步[handler/uiOnly/审批生成数据——经 UPG-78 生成器重生成非手改]；A4 测试处置[删 3 改 2 增 Upg84ModeConvergeContractTest 6 锚]；A5 快速/深思收敛恒深；变异 K1[枚举回潮]/K2[codeSdk 回潮] 双杀实测红→还原绿；compile+assembleDebug OK；全量 724=[本单相关全绿 | 2 FAIL appearance pre-existing（断言源零触碰）| 1 skip @Ignore pre-existing]；真机平板冒烟 OK[chip 纯模型名单级气泡无模式单选 / 顶部钮断循环点击无崩]；报告 程序员\交付报告\DELIVERY_UPG84_2026-09-03.md[DEL-UPG84-20260903-001+code e95472f+artifact 3f658e92+manifest c137b1bf，绑定 STD-UPG-84-v2 content b279e978]；证据 程序员\UPG84-evidence\[manifest 4 条 E-001~004，审验.py --manifest 复验 ok:True]；Token/KV 见报告二节[净减 12-16 tokens/请求·无新增键]；共享面=工具面/系统提示面 coverage FULL 见报告 DELIVERY §六；verify-hash HASH_REJECT not-ancestor 如实留证[未合 main 故非祖先，合后复跑闭环，红线 23]；**已登记两表**）——待验收员走 STD-UPG-84-v2 L1 亲跑复现 → 审验 → 设计师合 main
→ ✅ **验收员复验+审验 通过 @2026-09-03**（ACCEPTANCE_LOG §P35 + 审验 confirmed：e95472f 16 文件与申报一致、STD v2 sha=b279e978 对账、三 grep=0 残留、定向 Upg84 6/0/0+全量 724/2/1 一致、变异锚① 亲杀、chip 无模式单选、凭据脱敏；登记面 UPG-79 缺口本单全闭合；**达待合→设计师**）
→ ✅ **已合 main @8647ee9 @2026-09-03**（设计师B：ff-only 合入+**已 push origin/main**；=e95472f 交付+设计师随批捎修[ApprovalLogic presentation.set_mode 文案死分支删除=审验 P3 项，ApprovalLogic/Upg84 定向 BUILD SUCCESSFUL]；合前抽查：FF 链实证+§P35 证据实物+STD 对账一致）
→ ⚖️ **随批三件裁决 @2026-09-03（设计师B）**：①**红线 24 补节追认**——交付报告原缺 coverage 节+库引述失实（「coverage FULL 见 §六」实为真机冒烟节）：已在报告补「§六·补 共享面影响清单+coverage_status=FULL」（依据=零缩减 6 锚契约锁定+三 grep=0 残留+无新增运行时分支），库引述以此补节为准；②**ToolSdkGenerator 保留 toolHelpDoc 追认**——tool.help 工具零缩减红线一致（删的是 codeSdk/curl 教学段非 tool.help 文档）；③ApprovalLogic:155 死分支=随批捎修闭环（8647ee9）｜ **L3 旧 code prefs 平板实测=用户装新版后实测**（启动自动全量→读凭据直弹敏感卡；异常即报）｜ worktree mov-upg84 可收
## 标题

工具面去模式化：presentationMode 固定 BOTH（五模式过滤/循环按钮/prefs 回落/枚举引用全清理）+ codeSdk 注入段+ToolSdkGenerator 删除 + presentation.set_mode 退役 + 系统提示模式声明清理——**能力零缩减**（用户红线：极简只是画面极简）

## 分层溯源图（@main 5cf546d · 红线 20/21 已复核）

| 层 | 判定 | 证据 | 断点处置 |
|---|---|---|---|
| L1 用户可感知（模式入口） | ⚠️ | 顶部按钮循环五模式（:7537-7548）——用户被绕进 code 档（平板 prefs 实证） | 退役（A1）；两态开关归极简批 |
| L2 工具面装配 | ⚠️ | 五模式过滤 :7426-7434 + codeTools :369 | 固定全量（A1） |
| L3 SDK/提示词 | ⚠️ | codeSdk 注入段 :5150-5161（curl 匝道教学源）+ 模式声明 :5182 | 删除（A2/A3），Token/KV 申报 |
| L4 模式类工具 | ⚠️ | presentation.set_mode :4171-4188（uiOnly） | 退役（A3） |
| L5 审批/扫描机制 | ✅ | UPG-68/76/77/79 语义；UPG-76 扫描收缩走 preApprovalScanActive（与模式无关） | 不动+零回归断言 |
| L6 事实源（prefs） | ⚠️ | mov_presentation_mode.xml 存旧值（平板=code） | 读取语义回落 BOTH（A1） |

置信度=✅（收敛面全部锚定）；卡外发现无新增。

## 范围

- A1 工具面固定全量（过滤分支/循环按钮/prefs 回落/枚举清理）
- A2 codeSdk 段+ToolSdkGenerator+codeTools 删除
- A3 presentation.set_mode 退役+名单同步+模式声明清理
- A4 涉模式测试逐个处置（禁 skip 消音）

## 验收锚

见 `STD-UPG-84-v1`（L2 定级；变异锚 2；真机锚=旧 code prefs 平板启动自动全量→读凭据直弹敏感卡——UPG-83 场景以模式收敛方式销账）。

## 不做

两态开关「经典⇄极简」（归极简批阶段 1）；极简主页建设（送审稿阶段 1/2 另排）；不改任何工具能力（零缩减红线）

**红线**：工具面=全量不阉割；审批语义零改动；Token/KV 两节必报；MainActivity 纯 CRLF。

**交付**：卡：UPG-84；STD：STD-UPG-84-v1

---

# UPG-85 预审单 removeAll 缺陷修复（同 tool 多步骤被误移除）
**分类**：M2 体系/治理 ｜ 标签：M8 安全


```status
phase: merged
branch: feat/upg85
head: ad1e0a8c
std: STD-UPG-85-v1
delivery_id: DEL-UPG85-20260903-001
designer: 📌 **已派单·待认领 @2026-09-03**（派单 `设计师\派单\UPG-85_预审单removeAll缺陷修复_派单_2026-
dev: ✅**C 完成 @2026-09-03 17:05**（feat/upg85 **8609d69** 已 push origin，基底 ma
inspector: ✅ **已闭环（补登 @2026-09-05）**（审验员 09-05 核实：本单实物=8609d69 预审单 removeAll 修复[r
merge: ✅ **已合 main @ad1e0a8 @2026-09-03**（设计师B：rebase fab7d29 零冲突+patch-id 37
actor: sys04-backfill
updated_at: 2026-09-05T08:42:00
```

**状态**：📌 **已派单·待认领 @2026-09-03**（派单 `设计师\派单\UPG-85_预审单removeAll缺陷修复_派单_2026-09-03.md`；STD-UPG-85-v1 已冻结 sha=9d82e2b1）｜ **优先级**：P1 ｜ → ✅ **已闭环（补登 @2026-09-05）**（审验员 09-05 核实：本单实物=8609d69 预审单 removeAll 修复[removeAt(indexOfFirst)+无匹配跳过]，验收记录=§P39[整段错挂 UPG-81 卡内，与该卡 §P37 并存]；patch-id≡**ad1e0a8** ∈ origin/main——**09-03 已验已合**；卡面「待认领」系登记缺失，现补登销卡； feat/upg85 分支在档）
→ ✅ **验收员复验+审验 通过 @2026-09-03**（ACCEPTANCE_LOG §P39 + 审验 confirmed：8609d69 修复坐实[indexOfFirst+removeAt+守卫]、取舍论证亲读成立、契约锚含防脱钩绑定、M1 亲杀独立复验 3 红→还原零残留、全量 730/2/1 一致；§P36 转单 P1「发现→转单→修复→验收」全链闭环；**达待合→设计师**）
→ ✅ **已合 main @ad1e0a8 @2026-09-03**（设计师B：rebase fab7d29 零冲突+patch-id 37647929 逐字节等价[8609d69≡ad1e0a8]+合前定向 PlanApproval/Upg85/ApprovalLogic BUILD SUCCESSFUL+ff-only 合入+**已 push origin/main**；自此 app 全量归 0 失败基线档）｜ worktree mov-upg85 可收
→ 🆕 **已认领 @2026-09-03 10:24**（程序员 Claude/wmw0027，worktree mov-upg85，branch feat/upg85，2026-09-03 认领登记，基 main 8647ee9；按派单施工：removeAll→首个 tool 匹配定位修复+取舍论证+同 tool 多步骤全路径测试+2 变异锚——与 UPG-82（exec-engine）零重叠）→ ✅**C 完成 @2026-09-03 17:05**（feat/upg85 **8609d69** 已 push origin，基底 main 8647ee9；四件全交：①**定位修复**[:5267 removeAll→`indexOfFirst`+`removeAt`+`>=0` 守卫——仅移除首个 tool 匹配行（当前步），同 tool 后续步骤保留在单上可勾选；MainActivity 纯 CRLF 保持实测 7414/0] ②**取舍论证**[报告 §三：不采用 args 严格匹配——模型补全参数与真实 PendingInfo.args 漂移（路径写法/时间戳/可选缺省）时严格匹配失败→留当前步模型变体重复行（比少行更混淆审批）；「当前步=首个审批级触发点」语义下首个匹配定位正确；重复行防线已在 nodeKey 指纹执行绑定（同键耗尽转 ASK）；极简 3 行] ③**测试**[源码契约锚 PreApprovalRemoveFirstMatchContractTest 3 测试[修复形态/removeAll 退场/末尾与全量退场]+PlanApprovalBindingTest 新增 3 案[b 保留勾选 HIT/未勾 DENIED/漂移 MISS 转新 ASK]；PlanApproval 既有 32 零回归；ApprovalLogic/Component/Upg84 零回归] ④**变异 2 锚亲杀**[M1 恢复 removeAll→契约 3 红；M2 改 indexOfLast→契约 2 红[「全部匹配」形态被锚①红覆盖]；commit 8609d69 保护下 checkout 还原复绿]；全量 **98 套件 730/2/1**[724+本单新增 6=730；2 失败=AppearanceContractTest 基线预存 UPG-81 未合 main——**零新增失败**]+assembleDebug 绿[56125103B]；JVM 受限如实声明[审批单 UI 呈现层 JVM 不可直测——源码锚+Store/Service 层行为三案双证，真机呈现走验收员 L2/L3]；Token/KV 0/0；coverage_status=**FULL**[审批编排面共享，PlanApproval 五态语义零改动——回归说明在报告 §八]；verify-hash 交付时点 HASH_REJECT not-ancestor 如实申报[分支未合态必然，合后复跑=终态]；DEL-UPG85-20260903-001[code=8609d69/artifact=a1132fa8/manifest_sha=cfa1049d]；报告 DELIVERY_UPG85_2026-09-03.md；**已登记两个表**）——待验收员验收（L1 复核+变异复杀+真机 L2/L3 呈现+合后 verify-hash 终态复核）
→ **依据**：审验独立复核实锤（UPG-80 审验发现①）——`MainActivity.kt:5267` `steps.removeAll{it.tool==info.toolName}`：计划含同 tool 多步骤时全部静默移除=用户批准了不完整计划；修法裁决=按首个 tool 匹配移除（args 严格匹配引入模型参数漂移重复行，交付报告须论证取舍）

## 标题

预审单 removeAll 定位修复：仅移除当前步对应的首个 tool 匹配行，同 tool 后续步骤保留在审批单上——「用户批准的=实际执行的」严格一致；执行绑定五态与 UPG-76 机制零回归

## 验收锚

见 `STD-UPG-85-v1`（L3 定级；变异锚 2：恢复 removeAll→红/改末尾或全部匹配→红；同 tool 多步骤全路径测试[保留/勾选/执行/阻断/MISS]）。

## 不做

不动执行绑定/扫描编排/Group 语义；不扩大修复面

**红线**：UPG-76 机制零回归（PlanApproval 32 全绿）；Token/KV 0/0 申报；MainActivity 纯 CRLF。

**交付**：卡：UPG-85；STD：STD-UPG-85-v1

---

# UPG-86 manifest 治理（存量补齐 + 审验.py 机器可验性强化）
**分类**：M2 体系/治理 ｜ 标签：M9 工具链/治理


```status
phase: merged
branch: —
head: —
std: STD-UPG-86-v1
delivery_id: DEL-UPG86-20260903-001
designer: 📌 **已派单·待认领 @2026-09-03**（派单 `设计师\派单\UPG-86_manifest治理_派单_2026-09-03.
dev: ✅**C 完成 @2026-09-03 19:0x**（治理 commit **13434e7**[工单系统仓库]；三件全交：①**审验.p
inspector: ✅ **已闭环 @2026-09-03**（验收+审验通过：--manifest-self-test PASS 4/4+存量治理亲验[82/
merge: 合 main对象）
actor: sys04-backfill
updated_at: 2026-09-05T08:42:00
```

**状态**：📌 **已派单·待认领 @2026-09-03**（派单 `设计师\派单\UPG-86_manifest治理_派单_2026-09-03.md`；STD-UPG-86-v1 已冻结 sha=4b2ce3a7）｜ **优先级**：P2
→ ✅ **已闭环 @2026-09-03**（验收+审验通过：--manifest-self-test PASS 4/4+存量治理亲验[82/85/87 重验 ok:True 三连+缺失显式 missing 不造假]+双挂账销项落表；工单系统侧无合 main 对象）
→ 🆕 **已认领 @2026-09-03 18:50**（程序员 Claude/wmw0027，治理面=工单系统侧[不动 0027-mov 业务代码]；按派单施工：存量 manifest 机器可验化+审验.py --manifest 三类失效检测+fixture 亲杀——历史交付内容零改动，缺失如实标 missing）→ ✅**C 完成 @2026-09-03 19:0x**（治理 commit **13434e7**[工单系统仓库]；三件全交：①**审验.py --manifest 三类失效检测**[A 路径嵌注释（（）/｜/§/——/sha256= 词表）/B 缺 sha256（空串/缺字段/非 64hex 且无显式 missing 声明）→红，null+note missing=如实豁免/C 绑定值未写入（文件缺 evidence_manifest_sha 字段）→红；**目录聚合口径** _dir_sha256（sorted 文件名+内容——read_bytes 读目录盲区修复）+missing 豁免（路径不存在+note 声明→integrity 标 missing_declared 不进 problems）] ②**manifest-self-test 亲杀锚**[新子命令：三坏 fixture 全红+好案绿 **PASS 4/4**] ③**存量治理 8 manifest**[6 处理中心（UPG-50/55/68/82/85/87）+2 UPG-49_R2：path 裸串化（说明移 note 零丢失；0027-mov 相对→绝对；UPG-68 两条 McpToolScheduler 历史误写路径修正）+sha256 补算/重算（短截 16hex→64hex）或**显式 missing 声明**（滚动构建目录/被覆盖 APK[原值保留 note]/演进源码/append-only 活文档/描述性引用——原值零丢失不补造）+producer C→程序员+**绑定值写入**（evidence_manifest_sha=_canon_manifest canon 口径，importlib 同源保证）+键名统一（evidence→evidence_manifest）]；**存量自检 13/13 全绿**[报告侧 7 份 binding 重算全一致零回归+UPG-49_R2 源码条目 missing 治理]；**回归**[--verify-hash-self-test PASS 2/2+--list 冒烟+AST 完整]；**双挂账销项**[deliveryManifest指纹治理+upg70-manifest缺口→挂账登记表 ✅已落实]；历史交付内容零改动声明[只修清单形态，证据本体/报告正文/DEL 登记值未动——manifest 文件级 hash 变化映射见治理 commit diff+各文件 _upg86_governed 字段]；Token/KV 0/0；DEL-UPG86-20260903-001[治理单特殊性：code=13434e7 工单系统仓库/artifact 不适用（自检输出=证据）/manifest_sha 不适用（治理后 13 manifest 本身即机器可验态）]；报告 DELIVERY_UPG86_2026-09-03.md；**已登记两个表**）——待验收员验收
→ **依据**：manifest 治理同族四现（挂账-deliveryManifest指纹治理+挂账-upg70-manifest缺口+UPG-82/85 审验发现：路径嵌注释/缺 sha256/绑定值未写入）；红线 23「登记前自检」强制步已于今日生效，本单治存量+强化检测

## 标题

存量 manifest 机器可验化（路径裸串/条带 sha256/绑定值写入可重算）+ 审验.py --manifest 三类失效检测（检测即红+诊断）——历史交付内容零改动，缺失如实标 missing 不造假

**交付**：卡：UPG-86；STD：STD-UPG-86-v1

---

# UPG-87 内置包启停真实生效（宿主工具组纳入 builtin 包机制）
**分类**：M1 体验/功能 ｜ 标签：M3 市场


```status
phase: merged
branch: feat/upg87
head: fea2fae5
std: STD-UPG-87-v1
delivery_id: DEL-UPG87-20260903-001
designer: 📌 **已派单·待认领 @2026-09-03**（设计师B 溯源实证后出卡；派单 `设计师\派单\UPG-87_内置包启停_派单_202
dev: ✅**C 完成 @2026-09-03 18:4x**（feat/upg87 **fea2fae** 已 push origin，基底 ma
inspector: ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P41：fea2fae 隔离 worktree｜全量
merge: ✅ **已合 main @fea2fae @2026-09-03**（设计师B：验收 §P41+审验 confirmed[变异环 M1/M3
actor: sys04-backfill
updated_at: 2026-09-05T08:42:00
```

**状态**：📌 **已派单·待认领 @2026-09-03**（设计师B 溯源实证后出卡；派单 `设计师\派单\UPG-87_内置包启停_派单_2026-09-03.md`；STD-UPG-87-v1 已冻结 sha=805aa4e3）｜ **优先级**：P1 → ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P41：fea2fae 隔离 worktree——全量 **741/0/1 亲跑[0 失败基线兑现首单]**+四件核物[三宿主组纳入/hostPackTools 单源/syncHostBuiltinTools 启停链/默认全量]+McpMarketTest 2→5 零回归[挂账-upg41v2 销项]+**变异复杀如实**[M3 机制采信/M1 未复现红采信 XML 口径]；真机启停 UI 走查=验收员持有待办；**达待合→审验员→设计师[verify-hash 终态]**）
→ ✅ **已合 main @fea2fae @2026-09-03**（设计师B：验收 §P41+审验 confirmed[变异环 M1/M3 亲杀独立坐实，证据链由机制采信升级亲杀坐实] 达待合后——ff-only 合入+**已 push origin/main**+verify-hash HASH_OK 终态闭环；全量 741/0/1=0 失败基线兑现首单；双挂账销项落表；真机启停 UI 走查维持验收员持有待办）｜ worktree mov-upg87 可收
→ 🆕 **已认领 @2026-09-03 17:10**（程序员 Claude/wmw0027，worktree mov-upg87，branch feat/upg87，2026-09-03 认领登记，基 main fe8cd45[UPG-81/82/85 均已合入=0 失败基线]；按派单施工：三宿主组纳入 builtin 机制+启停真实生效+3 变异锚——与在施单零重叠）→ ✅**C 完成 @2026-09-03 18:4x**（feat/upg87 **fea2fae** 已 push origin，基底 main fe8cd45；四件全交：①**纳入 builtin 机制**[McpMarket withHostPacks 幂等追加三宿主包 kind=builtin——refresh/loadFromCache 双点、远端同名让位；组定义单源=LocalOverview.BUILTIN_PACKS+新增 hostPackTools(id,universe) 纯函数 prefixes×universe 推导**零手抄**（scene.* 未入审批登记表经 universe 注入覆盖——名单源选择关键依据）；builtinTools 留空=名单不在本层持有] ②**启停真实生效**[MainActivity syncHostBuiltinTools：禁用=hostDisabledTools 单点状态→rebuildAgentTools 面+E3 allowedTools 同步收缩（**禁用后 agent 调用=TOOL_NOT_FOUND，E3 既有塌缩机制零新代码**）+MCP 面 removeTool 摘除；启用=handler 恒在内存 addTool 热挂重挂；syncBuiltinPackTools 分派（browser 原通道/宿主组新通道）；market.enable/disable/uninstall/install 四 handler 接线；冷启调用=重启保持[builtinStates 持久化]] ③**默认全量启用**[builtinOn 缺省 true 零缩减——真机冷启实证「禁用工具 0 个（全量启用）」+工具面 182 全量，两次冷启一致] ④**测试**[McpMarketTest+3 案[三组在册/enable 不再 MARKET_NOT_INSTALLED=**挂账-upg41v2 销项判定**/disable 落盘+enable 恢复+新实例重读=重启保持/同名幂等]+HostBuiltinPackTest 新 5 案[device-control 名单完备 10 工具=**挂账-upg23 销项判定**/scene+obsidian 推导/未知组空/同源/禁用集互不牵连]+HostBuiltinPackContractTest 源码锚 3 案；既有 McpMarketTest 33 案零回归[packageCount 断言 2→5=目录纳入宿主包预期变更注记]]；**变异 3 锚亲杀**[M1 删 disable 分派→契约红/M2 删冷启调用→契约红/M3 prefixes 漏 calendar.→名单完备红；commit fea2fae 保护下还原→全量复绿]；全量 **100 套件 741/0/1 全绿**[0 失败基线]+assembleDebug 绿；真机平板装机实证[install Success+默认态日志+截图落 UPG87-evidence]；**真机启停 UI 走查转验收员持有**[如实申报：第三方应用占前台+WebView 胶囊热区错位+MCP :8389 curl 既有通道问题（MiniHttpServer 零改动）——不虚报 L3 完成]；审批/guard 语义零接触[PermissionRegistryData 只读未动]；Token 默认态 0/会话内恒定规则不动+KV 0[复用 market_builtin.json]；coverage_status=**FULL**[共享面=工具面+MCP 面注册+市场目录，browser 通道真机 14 工具入面零回归实证]；verify-hash not-ancestor 如实申报；DEL-UPG87-20260903-001[code=fea2fae/artifact=37a42742/manifest_sha=6d461e47]；报告 DELIVERY_UPG87_2026-09-03.md；**已登记两个表**）——待验收员验收（L1 复核+变异复杀+真机启停 UI 走查持有项+合后 verify-hash 终态复核）
→ **依据**：挂账双案实证 @main fe8cd45——挂账-upg41v2-内置包启停不可操作（宿主组不在 registry→MARKET_NOT_INSTALLED）+ 挂账-upg23-内置包停用不摘工具面（unmountExtTools prefix 匹配摘不到 device.*）；复用 browser builtin 热挂/摘除先例

## 标题

宿主工具组（device-control/scene-12306/obsidian）纳入 builtin 包机制：启停真实生效（禁用=工具面真实收缩+落盘+重启保持/启用=热挂恢复/禁用后调用=TOOL_NOT_FOUND）；默认全量启用（能力零缩减——启停=用户显式动作）；名单单源禁双写

**交付**：卡：UPG-87；STD：STD-UPG-87-v1

---

# UPG-88 极简批阶段 1（ASR + 极简主页生产化 + 两态开关点亮 + 快速提示词）
**分类**：M1 体验/功能 ｜ 标签：M8 UI/交互


```status
phase: merged
branch: feat/upg88
head: 43e57565
std: STD-UPG-88-v1
delivery_id: DEL-UPG88-20260903-001
designer: 📌 **已派单·待认领 @2026-09-03**（产品主线；设计文=极简送审稿+用户拍板「两模式/不阉割能力」；派单 `设计师\派单\U
dev: ✅**C 完成 @2026-09-03 23:0x**（feat/upg88 **43e5756** 已 push origin[施工 90
inspector: **用户指示模拟器自测**（ASR 真实语音转写=物理受限转验收员持有｜coverage PARTIAL 设计师裁决位申报在报告 §七）；T
merge: ✅ **已合 main @43e5756 @2026-09-03**（设计师B：验收 §P42+审验 confirmed[契约升级非消音精读
actor: sys04-backfill
updated_at: 2026-09-05T08:42:00
```

**状态**：📌 **已派单·待认领 @2026-09-03**（产品主线；设计文=极简送审稿+用户拍板「两模式/不阉割能力」；派单 `设计师\派单\UPG-88_极简批阶段1_派单_2026-09-03.md`；STD-UPG-88-v1 已冻结 sha=f64ec0e2）｜ **优先级**：P1 → ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P42：43e5756 三提交链隔离 worktree——全量 **748/0/1 亲跑一致**+Upg84ModeConverge 6 锚全绿[契约升级非消音复核]+R1 自纠实锤+**变异复验 5 轮未复现红如实标注**[采信程序员红案]+L2 四场景采信[未独立复跑如实标注]；coverage PARTIAL 裁决位维持[ASR 真人发声]；**达待合→审验员→设计师**）
→ ✅ **已合 main @43e5756 @2026-09-03**（设计师B：验收 §P42+审验 confirmed[契约升级非消音精读坐实+变异复杀审验补强两锚真红+档位双向 logcat 逐位一致+全量 748/0/1] 带缺陷通过达待合后——ff-only 合入+**已 push origin/main**+verify-hash HASH_OK 闭环；coverage PARTIAL[ASR 真人发声]裁决=随极简批阶段 2[UPG-89]真机批一并补验；R1 修复[homeWeb 挂 WebViewAssetLoader]+契约升级两锚随 STD 语义演进在案）｜ worktree mov-upg88 可收
→ 🆕 **已认领 @2026-09-03 19:15**（程序员 Claude/wmw0027，worktree mov-upg88，branch feat/upg88，2026-09-03 认领登记，基 main fe8cd45[worktree 实建于 fea2fae=当时 origin/main 顶]；按派单施工：极简主页生产化+ASR+两态开关点亮+档位绑定+4 变异锚——真机交互面预期 PARTIAL 留设计师裁决位）→ ✅**C 完成 @2026-09-03 23:0x**（feat/upg88 **43e5756** 已 push origin[施工 90aee9f→契约升级 3a4dd11→R1 修复 43e5756]，基底 main fea2fae；四件全交：①**极简主页生产化**[assets/home/index.html 引擎第一模块纯 HTML5/JS 零框架——HeroVisual 可注入槽（data-hero-src 默认 MOV 竖眼+CT-01 值段口注释）+双通道输入（点 logo=直接说/输入框打字）+状态矩阵照 §3.6（idle/listening pulse/partial 回填/error 抖动诚实提示/permission-denied）+无菜单/胶囊/抽屉+深色适配；独立 homeWeb 覆盖层 markstream 实例零破坏] ②**ASR 接入**[SpeechRecognizer+RecognitionListener——RECORD_AUDIO 权限流 recordAudioLauncher（拒绝→诚实空态）/partial 回填（jsString 转义注入）/final 自动发送/错误分类人话提示不卡死；MovHomeBridge 独立 JS 桥（UPG-42 白名单面零触碰）] ③**两态开关点亮**[顶部 ic_sun 按钮→togglePresentationMode 真切换+mov_presentation/mode 持久化（parse fail-safe）+applyPresentationMode 视图路由（homeWeb 可见+loadUrl+topbar/scroll GONE；冷启恢复=重启保持）] ④**档位绑定**[send 链 isDeep=isDeepFor(presentationMode)——经典=DEEP_EFFORT high+deepseek-v4-pro 不变；极简=effort 不发送（off）+不切 pro+**简洁提示词节**追加 systemPrompt；**能力零缩减**：rebuildAgentTools 无模式过滤锚④]；**变异 4 锚亲杀**[M1 删 home loadUrl→锚①红/M2 删 partial 注入→锚②红/M3 isDeepFor 恒 true→锚③红/M4 加模式过滤→锚④红；还原复绿]；**契约升级**[Upg84ModeConvergeContractTest 两锚按 STD-UPG-88-v1 销项③语义升级 commit 3a4dd11——④恒 DEEP→绑呈现模式/⑤占位→转正；单选退役断言全保留非消音]；**R1 修复**[模拟器实测发现 homeWeb 缺 WebViewAssetLoader→home 加载失败静默——挂同款 loader commit 43e5756]；**模拟器四场景实证**[MOV_Test：①切换→home 呈现 CDP 铁证+force-stop 重启极简保持/②④点 logo→诚实空态「未获麦克风权限——可打字」不卡死/③档位双向 logcat 铁证 minimal=flash+none+简洁节=true vs classic=pro+high+简洁节=false；证据落 evidence 目录：4 截图+档位日志+102 XML]；全量 **102 套件 748/0/1 全绿**[741+7 本单]+assembleDebug 绿[56289653B]；真机平板被第三方应用占用→**用户指示模拟器自测**（ASR 真实语音转写=物理受限转验收员持有——coverage PARTIAL 设计师裁决位申报在报告 §七）；Token：极简简洁节 ≈60B/请求+经典 0 变化前缀恒定/KV 0 新增[mov_presentation.xml ≤64B]；verify-hash not-ancestor 如实申报；DEL-UPG88-20260903-001[code=43e5756/artifact=6d4d2a43/manifest_sha=8f4fc514]；报告 DELIVERY_UPG88_2026-09-03.md；**已登记两个表**）——待验收员验收（L1 复核+变异复杀+ASR 真实语音转写真机走查[持有]+合后 verify-hash 终态复核）
→ **依据**：极简送审稿（2026-09-02，三轮对齐定稿）+ 用户拍板（经典+极简两模式/极简=快速档/能力零缩减/顶部按钮=切换入口保留）；地基已齐：UPG-84 模式收敛+两态占位+A5 档位绑定已合 main（8647ee9）

## 标题

极简批阶段 1=主页可用：HeroVisual（默认 MOV 竖眼，可注入）+ 双通道输入（点 logo=直接说/打字）+ ASR 接入（权限/听写/回填/诚实空态）+ 两态开关点亮（真实切换+持久化）+ 快速提示词（极简=reasoning off+简洁节/经典=high）+ 能力零缩减（工具面同一全量集断言）——结果走现有 Markstream 链（schema2ui/商家卡归阶段 2）

**交付**：卡：UPG-88；STD：STD-UPG-88-v1

---

# UPG-89 极简呈现引擎（PresentationRegistry + core.js 呈现栈 + Intent Router + Response Splitter + 三骨架）
**分类**：M1 体验/功能 ｜ 标签：M8 UI/交互


```status
phase: merged
branch: feat/upg89
head: 0aad7980
std: STD-UPG-89-v2
delivery_id: DEL-UPG89-20260904-001
designer: 📌 **已派单·待认领 @2026-09-04**（**v2 正式派发**：启动条件齐=尾巴批清完+UPG-88 已合 main 43e5
dev: ✅**C 完成 @2026-09-04 04:1x**（feat/upg89 **615f359** 已 push origin[第一批 9
inspector: ✅ **审验 confirmed 带缺陷通过 @2026-09-04**（PV-01 亲杀独立复验双红+锚⑥更精确定性=layer 死状态只
merge: ✅ **已合 main @fe258949 @2026-09-04**（设计师B：rebase 254d6caf 零冲突[原链 a51238
actor: sys04-backfill
updated_at: 2026-09-05T08:42:00
```

**状态**：📌 **已派单·待认领 @2026-09-04**（**v2 正式派发**：启动条件齐=尾巴批清完+UPG-88 已合 main 43e5756+呈现体系 **v1.2 增补已冻结**[大神 9.2/10 吸收 4×P1：Motion Intent/词表命名空间/版本化+未知词策略/Danger 白名单]；派单 `设计师\派单\UPG-89_极简呈现引擎_派单_2026-09-03.md`[v2 头部]；STD-UPG-89-**v2** 已冻结 sha=cee56574，v1 作废；demo **v4** 替代 v3 为视觉基准）｜ **优先级**：P1 → ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P46：f616b38f 分支头隔离 worktree——bun 12/12 亲跑+JVM 759/0/1 亲跑[AssetsHomeEngineContract 4 锚]+**PV-01 变异亲杀**[2 fail→还原]；锚⑥死变异裁决转设计师[测试有效性非产品缺陷]；homeWeb 接线下批申报一致；L2 七场景持有；**达待合→审验员→设计师**）→ ✅ **审验 confirmed 带缺陷通过 @2026-09-04**（PV-01 亲杀独立复验双红+锚⑥更精确定性=layer 死状态只写不读+四项发现登记）→ ✅ **已合 main @fe258949 @2026-09-04**（设计师B：rebase 254d6caf 零冲突[原链 a51238dd→615f3590→f616b38f 重写成 84d11731→1e90bf44→fe258949——DEL 绑 615f359 漂移随 UPG-92 硬规则处置]+ff-only+push origin/main+verify-hash HASH_OK 闭环；MainActivity 零触碰=UPG-93 防撞兑现；L2 真机七场景[含 ASR⑦]验收员持有维持；锚⑥ layer 死字段删除随批 P3）→ ✅ **P3 尾巴合入 @0aad7980 @2026-09-04**（程序员锚⑥处置收尾：①核实「断言无需重设计——z 数值断言直调 zSnapshot=方案 a 本在链」②删 surface.layer 死字段[core.js 2 行纯删除，diff 核实一致]+DEL 按新硬规则重绑分支头 4fd540a6；设计师轻量通道：diff 精读[仅 2 删行]+rebase main 单提交回放[旧三链 patch-id 自动跳过]+ff-only+push+verify-hash HASH_OK；锚⑥本活实证[决策丢失变异→zSnapshot topKind=content→RED]在案——「审批永远压内容」安全不变量有杀）
→ 🆕 **已认领 @2026-09-04**（程序员 Claude/wmw0027，worktree mov-upg89，branch feat/upg89，基 main 39b17c4[UPG-90 已合]；按 STD-UPG-89-v2 施工：PresentationRegistry 九字段+style_tokens 白名单+core.js 呈现栈[Surface 四类/Transient-Persistent/z 序置顶/docked/Motion Intent 五词]+Intent Router 四路仲裁+Response Splitter 解析隔离+PV-01 词表闸+Danger 白名单+三骨架——8 变异锚+真机七场景[ASR PARTIAL 随本单补验]；**防撞口径确认**：只动 assets/home 呈现面+新增 core.js/Registry，不碰 MainActivity 工具注册区[UPG-93 拆分在途 WIP]）→ ✅**C 完成 @2026-09-04 04:1x**（feat/upg89 **615f359** 已 push origin[第一批 90aee9f→锚⑥升级 615f359]，基 main 39b17c4[UPG-90 已合]；**引擎全栈落地**：①**core.js 呈现引擎核心**[受信样式词汇表七命名空间 21 词 version 1.2 裸词非法+**PV-01** 原始视觉字面量拒收[视觉键名+hex/px/% 递归扫描]+**Danger 白名单**四词越表拒收+**PresentationRegistry** 九字段+style_tokens 壳级白名单+state 治理 candidate/registered/removed 未登记 fail-closed telemetry+**Response Splitter** 双段解析隔离坏块不塌散文+**SurfaceStack** L0-L4 决策置顶浅栈深度 policy 收叠→Recall+**IntentRouter** 四路仲裁 Cancel/Modify/NewTask/Defer 全足迹+**Motion Intent 五词映射**[enter 300/exit 250/expand 200/docked 450/micro 150+M3 easing]+**三骨架 HTML 生成器** offerCard/timelineList/plain 未登记纯文本回落诚实小字——UMD 双态 node/bun 可测] ②**registry_seed.js** 三骨架登记[offerCard.v1/timelineList.v1/plain.v1 registered+壳白名单] ③**home.html 引擎接入**[core.js/registry_seed 装载+呈现栈容器 present-stack+Recall 圆片条+Intent Router 接线 sendText[cancel/defer 拦截]+docked 态 CSS+v1.2 卡面 token 圆角 22/无描边/--card-shadow-lg/caps 10.5·700·.12em/pill 主钮纯黑+prefers-reduced-motion 退化] ④**测试双层**[bun tests/upg89_core.test.mjs **12/12**[逻辑级 8 锚全对应]+JVM 源码锚 AssetsHomeEngineContractTest **4**[Registry 九字段/三道闸/Motion 五词/Splitter 形态]]；**变异 8 锚：7 实杀 RED**[M1 renderRaw 不抛/M2 扫描恒空/M3 词表恒 ok/M4 Danger 恒放行/M5 未登记不回落/M7 仲裁恒 normal/M8 栈深不收叠——全部 bun RED]+**锚⑥死变异暴露→测试有效性升级**[zSnapshot layer-aware 排序+z 数值断言（决策 L3≥30/内容<30）——加强变异仍 NOT-RED 复跑转复验在案 commit 615f359]；全量 **105 套件 759/0/1 全绿**[755[U90]+4 JVM 锚=759]；**逻辑面四场景机制实证**[①底座输入常驻继承 U88/③审批置顶+Danger 红 bun/④仲裁足迹 bun/⑤未登记回落 bun——真机七场景**转验收员持有**[②agent 流接线+⑦ASR 真人发声——如实申报]；**防撞兑现**[MainActivity 零触碰纯 CRLF+UPG-93 工具注册区零交集]；Token 双段零额外轮次+voice_hint 确定性槽/KV 0；coverage_status=**PARTIAL**[JS 引擎逻辑面 FULL[bun 12/12+7 锚实杀]/原生 agent chunk→homeWeb 接线未做=真机批/下批——设计师裁决位申报]；DEL-UPG89-20260904-001[code=**4fd540a6** 锚⑥处置收尾重绑/artifact=ba3d877dad14c566（APK 前 16）/manifest_sha 见案——**按新硬规则分支头重绑 @2026-09-04**（前头 615f359=f616b38f 链已废，本头含 surface.layer 死字段删除+锚⑥ z 数值断言收口）]；报告 DELIVERY_UPG89_2026-09-04.md；**已登记两个表**）——待验收员验收（L1 复核+变异复杀[bun]+真机七场景[含 agent 接线下批]+合后 verify-hash 终态复核）
→ **依据**：极简呈现交互体系 v1.1（大神评审 8.8/10 吸收版：Surface 抽象/Transient-Persistent/PresentationPolicy/Intent Router/Voice EOU/解析隔离/presentation_intent 全落）+ **v1.2 增补（卡面 token/样式词表 PV-01/动效 intent/Danger 白名单，已冻结）** + 用户四条拍板（两模式/不阉割/引擎规则驱动/卡片浮于主页+输入能力常驻）；demo v4 视觉基准
→ **防撞**：UPG-88 已合 main（43e5756）依赖解除；与 85/87 零重叠；**与 UPG-93 拆分同仓——89 只动 assets/home 呈现面+新增 core.js/Registry，不碰 MainActivity 工具注册区，零交集口径**

## 标题

极简呈现引擎化：PresentationRegistry 九字段契约 + core.js 呈现栈（Surface 四类/动效三原语/浅栈/Recall）+ Intent Router 四路仲裁 + Response Splitter 解析隔离（UI 只消费 Validated PresentationData）+ 内容双通道（schema 直映/提取校验）+ 三骨架——LLM 零渲染决策、业务零即兴呈现

## 验收锚

见 `STD-UPG-89-v2`（L3 定级；变异锚 8：军规闸/PV-01 闸/词表闸/Danger 闸/未登记回落/决策置顶/输入仲裁/栈深 policy；真机七场景含 ASR 补验）。

## 不做

不接 schema2ui 真实商家数据（阶段 3 商业期）；不动 ApprovalSurface（零改动复用）；不做 Persistent Surface 迁移（阶段 3 评估）；无新框架/新依赖

**红线**：AI 可生成内容不能生成交互制度；UI 只依赖 Validated PresentationData；能力零缩减；Token/KV 两节必报。

**交付**：卡：UPG-89；STD：STD-UPG-89-v2

---

# UPG-90 尾巴批修（S-06 打回项 ②⑧ + C7 基线测试非确定性）
**分类**：M2 体系/治理 ｜ 标签：M9 工具链/测试


```status
phase: merged
branch: feat/upg90
head: 39b17c42
std: STD-UPG-90-v1
delivery_id: DEL-UPG90-20260903-001
designer: 📌 **已派单·待认领 @2026-09-03**（尾巴清零批；派单 `设计师\派单\UPG-90_尾巴批修_派单_2026-09-03.
dev: ✅**C 完成 @2026-09-04 00:1x**（feat/upg90 **1845cb7** 已 push origin，基 mai
inspector: ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P47：c969b05a 隔离 worktree｜全量
merge: ✅ **已合 main @39b17c4 @2026-09-03**（设计师B：验收 §P43+审验 confirmed 达待合后｜reba
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：📌 **已派单·待认领 @2026-09-03**（尾巴清零批；派单 `设计师\派单\UPG-90_尾巴批修_派单_2026-09-03.md`；STD-UPG-90-v1 已冻结 sha=59e79222）｜ **优先级**：P2 → ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P47：c969b05a 隔离 worktree——全量 **762/0/0 亲跑**[0 失败基线]+ToolsSplitContract 7 锚+9 域拆分+MainActivity 1752 行删减+零行为变化[sha256 双锁]+**M-vault 变异亲杀**[键名变异→3 锚齐红与申报一致→还原；注释式破多行 lambda 编译失败教训三现——拆分类变异用键名/删除式]；冷启动 +5.1%<10%；真机三场景采信；**达待合→审验员→设计师**[阶段 2 后续]）
→ ✅ **已合 main @39b17c4 @2026-09-03**（设计师B：验收 §P43+审验 confirmed 达待合后——rebase 4dc19e7 零冲突+patch-id f563ce59 等价[1845cb7≡39b17c4]+ff-only 合入+**已 push origin/main**+verify-hash HASH_OK 闭环；S-06 卡闭环销项+挂账-C7 销项[C7 两跑零 M 审验亲测坐实]；尾巴批清零）｜ worktree mov-upg90 可收
→ 🆕 **已认领 @2026-09-03 23:22**（程序员 Claude/wmw0027，worktree mov-upg90，branch feat/upg90，基 main fea2fae；按派单施工：S-06 ②引号闭合+⑧四死文件 git rm+C7 确定性治理——零 app 代码面）→ ✅**C 完成 @2026-09-04 00:1x**（feat/upg90 **1845cb7** 已 push origin，基 main fea2fae；三件全交：①**S-06 ②**[index.html:199 `href="explorer.html>`→引号闭合+**链接断言测试**（提取 href 可解析——未闭合引号吞标签尾即红+explorer.html 目标在库不 404）] ②**S-06 ⑧**[make_guide.py/make_merchant.py git rm 真实删除；sms-probe.js/run-pc.sh git ls-files 实证**库内已不存在**（历史已删=现状满足真实删除语义）；契约测试四名零残留] ③**C7 确定性治理（STD 方案①）**[jsonl 剔除 time 字段（实时时钟非确定源——事件序/类型/seq 保留基线比对价值不降）；generateBaselineInto 可重入抽取+**守卫测试**「连跑两遍产物字节一致」[写回 time 即红]；**取舍声明**：不选方案②[产物归 build/ 失去入库可追溯]——报告 §一.3]；**亲杀 2 锚**[M1 恢复未闭合引号→链接断言红/M2 写回 time→守卫红；还原复绿]；**两跑零 M**[--rerun-tasks×2 全绿+c7_baseline 30 文件零 M 实证；工作区余 5 CRLF 假差异[diff 实质零，worktree checkout 行尾现象如实申报]]；全量 **101 套件 744/0/1 全绿**[0 失败基线；U90 基于不含 U88 的 main 数字自洽]；Token/KV 0/0；S-06 卡 ②⑧+挂账-C7 销项对应报告 §五；DEL-UPG90-20260903-001[code=1845cb7/artifact 不适用/manifest 见案]；报告 DELIVERY_UPG90_2026-09-03.md；**已登记两个表**）——待验收员验收（L1 复核+变异复杀+mow.kim 部署后 explorer 链接点验[或本地静态点验]+合后 verify-hash 终态复核）
→ **依据**：S-06 打回项 ②⑧（index.html:199 引号未闭合申报失实+四死文件未 git rm；ACCEPTANCE_LOG ef3ad38）+ 挂账-C7基线测试非确定性输出（C7BaselineGenerationTest:106 产物每次全量重跑变 M）；零 app 代码面与在施单全不撞
→ **排程注**：UPG-41 v2 两 P3（详情开关/enable 状态）不并本单——涉 MainActivity 市场段与 UPG-88 同面，排 88 合后随市场线批

## 标题

尾巴清零：S-06 ②引号闭合+⑧四死文件 git rm + C7 基线测试确定性治理（连跑两遍零 M）——S-06 卡与挂账-C7 双销项

**交付**：卡：UPG-90；STD：STD-UPG-90-v1

---

# UPG-91 我的资产页注册制重排（tab 导航+二级收缩裸列表+点值脱敏+诚实空态+假数据回落删除+令牌迁移）
**分类**：M1 体验/功能 ｜ 标签：M8 UI/交互


```status
phase: merged
branch: feat/upg91
head: 4dc19e72
std: STD-UPG-91-v1
delivery_id: DEL-UPG91-20260904-001
designer: 📌 **已派单·待认领 @2026-09-03**（用户实测「体验感很差」→ 四病灶诊断 → 六轮迭代 demo v6 拍板；派单 `设计
dev: ✅**C 完成 @2026-09-04 01:4x**（feat/upg91 **34a2dda** 已 push origin[远端顶=4
inspector: ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P44：4dc19e7 三提交链隔离 workt
merge: ✅ **已合 main @4dc19e7 @2026-09-03**（设计师B：验收 §P44+审验 confirmed[M4 复杀补强｜验
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：📌 **已派单·待认领 @2026-09-03**（用户实测「体验感很差」→ 四病灶诊断 → 六轮迭代 demo v6 拍板；派单 `设计师\派单\UPG-91_我的资产页重排_派单_2026-09-03.md`；STD-UPG-91-v1 已冻结 sha=03b497ec）｜ **优先级**：P2 → ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P44：4dc19e7 三提交链隔离 worktree——全量 **752/0/1 亲跑一致**+demoBridge 假数据零残留 grep[红线 18 同族根除]+锚④强化实录复核+R1 自纠[1C 形态消费恢复]；变异 M4 未复现如实[采信程序员 4/4 XML]；真机五场景持有维持；**达待合→审验员→设计师**）
→ ✅ **已合 main @4dc19e7 @2026-09-03**（设计师B：验收 §P44+审验 confirmed[M4 复杀补强——验收员类名不中假象被审验员推翻，真实锚④红]+全量 752/0/1 达待合后——ff-only 合入+**已 push origin/main**+verify-hash HASH_OK；**DEL 漂移裁决**：交付后追加提交（34a2dda→4dc19e7 锚④强化）按红线 23 走失效重建——DEL-UPG91-001 标失效、新建 DEL-UPG91-002 绑 4dc19e7；「交付后追加提交必须重绑或显式豁免」已入红线 23 细则）｜ worktree mov-upg91 可收；真机五场景走查维持验收员待办
→ 🆕 **已认领 @2026-09-04 00:3x**（程序员 Claude/wmw0027，worktree mov-upg91，branch feat/upg91，基 main 43e5756[含 UPG-88 合入]；按派单施工：demo v6 重排+demoBridge 删除+令牌迁移+4 变异锚——真机实拍五场景尽力/受限如实）→ ✅**C 完成 @2026-09-04 01:4x**（feat/upg91 **34a2dda** 已 push origin[远端顶=4dc19e7 锚④强化 ls-remote 铁证；施工 4d1449b→R1 形态消费修复 34a2dda→锚④断言强化 4dc19e7]，基 main 43e5756；六件全交：①**tab 导航**[demo v6 下划线 tab：凭据真实计数 credGrouped 求和/证件照 0/2/未上线灰显 tab.off——锚④双断言：模板插值 {{ c.count }}+reduce 求和逻辑] ②**二级收缩组行**[opened=ref({}) 默认收起——平台·N 项›+chev 旋转+明细行 hairline；**忠实真实桥**：asset.credentials 仅返回 platform+mask 单行明细/平台——不造 demo 明细假结构] ③**点值脱敏往返**[删👁按钮——点脱敏值=asset.credPeek（→vault.get 审批链零改动）真值 white-space:pre-line 显示（values[cred.平台]=账号/密码多行）再点收回 mask；revealed 往返态] ④**诚实空态**[桥空=「还没有任何资产」+「只存在这台设备上，读取时每次需你确认」+「添加凭据」主按钮——demoBridge 假数据回落**整段删除**（红线 18 同族；浏览器预览态同样诚实）] ⑤**令牌迁移**[硬编码色值全清：#eef7f4/#1c7a5f 绿横幅**消亡**+#fff/#eceff4/#222/#999/#f4f7fa/#eef1f5/#f2f4f8/#dfe4ea/#334/#98a2b3/#4c88ff/#cfd6df/#05070a 及 CSS var fallback hex 全清——样式全走 tokens 变量（var(--text/text2/text3/line/primary/bg)）] ⑥**零图标**[Icon 组件 import+全部 <Icon> 删除——**产物 Icon chunk 消失实证**（vite build 后 assets 页产物无 Icon-*.js）]；**变异 4 锚亲杀**[M1 恢复 demoBridge→契约红/M2 塞回 hex→红/M3 opened 初始展开→红/M4 删 tab 计数渲染→红[首版锚④断言弱被实测暴露逃逸→**强化为渲染插值+求和逻辑双断言补杀**——测试有效性升级在案]；还原复绿]；**R1 修复**[全量回归发现 AppearanceContractTest L2-9 红（首版删除 acard/alist 形态消费）——**v6 结构不弃机制**：acardCls 绑 tab 条+alistCls 绑组行列表+ui.getProfile 回读恢复 commit 34a2dda——L2-9 零回归]；产物链[vite build+sync-pages 103 文件入库哨兵零越界+assembleDebug 绿]；全量 **103 套件 752/0/1 全绿**[748[U88]+4[U91 契约]=752]；真机实拍五场景**转验收员持有**[如实申报：L2 定级真机走查属验收员职责+开发时段平板被占——不虚报]；不动 AssetsSheet 宿主/白名单/vault.get 审批链/credPeek 桥语义[红线 2 兑现]；Token/KV 0/0[页面 WebView 内不经 agent 面]；coverage_status=**FULL**[共享面=资产页面+产物+UPG-50 1C 形态消费面（R1 恢复）——AppearanceContract 零回归实证]；verify-hash not-ancestor 如实申报；DEL-UPG91-20260904-001[code=34a2dda/manifest 见案]；报告 DELIVERY_UPG91_2026-09-04.md；**已登记两个表**）——待验收员验收（L1 复核+变异复杀+真机实拍五场景[持有]+合后 verify-hash 终态复核）
→ **依据**：四病灶实证——大片黑/空白（空态缺失+tokens body #05070a 透出）/类目卡硬三列挤压截断/硬编码绿横幅+卡色值（AssetsPage.vue:169-173）/**demoBridge 假数据回落（桥空显示演示凭据=红线 18 同族）**；视觉基准=demo v6（tab 导航+二级收缩+点值脱敏+零图标+诚实空态）
→ **拍板记录**：注册制结构归 tab 栏（类目+计数）/分级归机制（点值需确认）/图标全删/登记行不建——六轮迭代用户逐轮拍板

## 标题

我的资产页按 demo v6 重排：tab 导航（类目+计数）+ 二级收缩组行 + 点值脱敏往返 + 诚实空态（桥空永不演示充数）+ 令牌迁移（硬编码清零）——纯文字线框零图标

## 验收锚

见 `STD-UPG-91-v1`（L2 定级；变异锚 4：假数据回落恢复→红/硬编码回潮→红/组行默认展开→红/tab 无计数→红；真机平板实拍五场景）。

## 不做

不动 AssetsSheet 宿主/白名单/vault.get 审批链/credPeek 桥语义；不动其他页面；禁图标；禁任何假数据回落复活

**红线**：令牌单源（UPG-70 归层纪律）；产物链（vite+sync-pages+入库哨兵）；Token/KV 0/0 申报。

**交付**：卡：UPG-91；STD：STD-UPG-91-v1

---

# UPG-92 manifest 硬闸化（deliver-gen 源头合规 + 自检内置）
**分类**：M2 体系/治理 ｜ 标签：M9 工具链/治理


```status
phase: merged
branch: —
head: —
std: STD-UPG-92-v1
delivery_id: DEL-UPG92-20260904-001
designer: 📌 **已派单·待认领 @2026-09-03**（manifest 同族第六现｜红线 23 自检步声称未执行，改机制硬闸；派单 `设计师
dev: ✅**C 完成 @2026-09-04 00:0x**（程序员 Kimi/kimi-cli，feat/upg92 **39039ef** 已
inspector: ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P45：39039ef 工单系统仓隔离 worktre
merge: ✅ **已合 main（工单系统仓）@beb2777 @2026-09-03**（设计师B：验收 §P45+审验 confirmed 后｜f
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：📌 **已派单·待认领 @2026-09-03**（manifest 同族第六现——红线 23 自检步声称未执行，改机制硬闸；派单 `设计师\派单\UPG-92_manifest硬闸化_派单_2026-09-03.md`；STD-UPG-92-v1 已冻结 sha=a2c0fcd7）｜ **优先级**：P1 → ✅ **验收员复验 通过 @2026-09-03**（ACCEPTANCE_LOG §P45：39039ef 工单系统仓隔离 worktree——**deliver-gen --self-test 4/4 亲跑 PASS**[源头合规/硬闸注入红×2 exit=1 残件清除/骨架回归]+硬闸「拒绝产出非警告」机制化——**第六现根因闭环**；DEL-UPG92 狗粮自证；观察转办：sync 锚词表「✅K 完成」代号→设计师；**达待合→设计师**）
→ ✅ **已合 main（工单系统仓）@beb2777 @2026-09-03**（设计师B：验收 §P45+审验 confirmed 后——feat/upg92 rebase 两轮+xlsx 冲突 SOP（弃表→sync 重建）+ff-only 合入工单系统仓 main+**已 push**；**实战过闸验证=deliver-gen --self-test PASS 4/4 在合后 main 亲跑**——硬闸生效实证[闸不敞口]；问题区两项处置：①流转状态纠偏=本合并闭环 ②口径笔误两处 P3 注记在案[6a9fcd2=验收落档非施工/push 目标仓]）｜ worktree mov-upg92 可收
→ 🆕 **已认领 @2026-09-03 23:46**（程序员 Kimi/kimi-cli，worktree mov-upg92，branch feat/upg92，基 main 607bf4e；按派单施工：deliver-gen 源头合规[路径裸串/条带 sha256/绑定值写入]+自检内置硬闸[不合规=拒绝产出]——工单系统侧工具链，零 app 代码面）→ ✅**C 完成 @2026-09-04 00:0x**（程序员 Kimi/kimi-cli，feat/upg92 **39039ef** 已 push origin[MOV 仓库，基 main f218abc]；deliver-gen 升级一件：①**源头合规**[--evidence 即产 manifest：路径裸串/条带 sha256 机器实算/evidence_manifest_sha 绑定值写入可重算，canonical 与 审验.py _canon_manifest 逐字节对齐] ②**自检内置硬闸**[产出后自跑 审验.py --manifest，ok:False=删残件+拒出报告+exit 1，非警告] ③--manifest-draft 直通过闸[机器不替人修补语义] ④--self-test 四案 **PASS 4/4**[合规绿/注入路径嵌注释红/注入缺 sha256红/骨架回归]；**狗粮**：本单 manifest 经新闸产出 ok:True 重算一致 802d72e6[8 条全 exists/hash_matches=True，零人工修补]；亲杀双锚实录在案[exit=1+残件清除]；回归 审验.py manifest-self-test 4/4+verify-hash-self-test 2/2+旧骨架 exit 0 零回归；Token/KV 0/0；0027-mov 零接触；DEL-UPG92-20260904-001[code=39039ef/artifact 不适用/manifest 802d72e6]；verify-hash 如实申报 HASH_REJECT not-ancestor[未合分支+origin 落后 8 提交，合后终态复核]；报告 DELIVERY_UPG92_2026-09-04.md；**已登记两个表**）——待验收员验收[--self-test 一键复跑+亲杀复杀]+设计师合 main 后终态复核
→ **依据**：UPG-86 治理完成 4 小时后 UPG-88 交付 manifest 再度失效（ok:False）——工具合格、执行闸未闭环；审验员三建议取最硬：deliver-gen 源头合规+自检内置（机器产出即合规不靠人）；本单自身 manifest 必须经新闸产出（吃自己狗粮）

## 标题

deliver-gen 升级：产出 manifest 默认合规（路径裸串/条带 sha256/绑定值写入可重算）+ 产出后内置自跑 审验.py --manifest 校验、不合规=拒绝产出（硬闸非警告）——manifest 治理从「人记得」变「机器拦」

**交付**：卡：UPG-92；STD：STD-UPG-92-v1

---

# UPG-93 MainActivity 拆分·阶段 1（工具注册面搬移 + 拆分蓝图落档）
**分类**：M2 体系/治理 ｜ 标签：M6 架构


```status
phase: merged
branch: feat/upg93
head: 3315bff0
std: STD-UPG-93-v2
delivery_id: DEL-UPG93-20260904-001
designer: 📌 **已派单·待认领 @2026-09-03**（架构图实证「图上分层、代码一锅」｜用户拍板「先解决这个」；派单 `设计师\派单\UPG
dev: ✅**C 完成 @2026-09-04 03:3x**（程序员 Kimi/kimi-cli，feat/upg93 **c969b05a**
inspector: ✅ **验收员复验通过（§P47）→ 审验 confirmed 通过 @2026-09-04**（M-vault 键名变异亲杀 3 锚齐红独
merge: ✅ **已合 main @3315bff0 @2026-09-04**（设计师B：rebase 0aad7980 零冲突[c969b05a→
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：📌 **已派单·待认领 @2026-09-03**（架构图实证「图上分层、代码一锅」——用户拍板「先解决这个」；派单 `设计师\派单\UPG-93_MainActivity拆分阶段1_派单_2026-09-03.md`；**STD-UPG-93-v2** 已冻结 sha=39d1aaa0（v2=大神终审 3×P0 钉入：ToolsRegistry 只聚合/证据三层/Activity 持有边界；v1 留档））｜ **优先级**：P1
→ 🆕 **已认领 @2026-09-04 01:5x**（程序员 Claude/wmw0027，worktree mov-upg93，branch feat/upg93，基 main 254d6ca[军规 commit 顶]；按派单施工：185 handler 盘点落蓝图+ToolsRegistry 聚合+分域 Registrar 搬移+3 变异锚+测试金字塔——纯搬移零逻辑改动）→ ⚠️**WIP 回滚 @2026-09-04 02:3x**（程序员 C：盘点/口径闭合/提取器基建完成入库[commit 76c91cb：169 注册点三态扫描盘点+9 域归类+185 口径闭合核对]；**搬移实施中途回滚**——三态提取器跑出的 9 域文件存在块边界错位残片[ModelRegistry 循环/obsidian 段等 5-8 处——三方对账未完成]，**不带入半成品**，工作区已还原 7666 行原始态；工程形态已定案=Kotlin 扩展函数分域文件[receiver=this 零改动零持有]，WIP 资产与修复路径在案[upg93-拆分wip 记忆+upg93_inventory.json]）——**重新认领需独立完整会话**（剩余：错位残片三方对账→测试金字塔→3 变异锚→冷启动锚）
→ ⚠️ **转 WIP @2026-09-04**（程序员如实申报，设计师核实在案）：基建三件已入库 feat/upg93 @76c91cb（169 注册点盘点[三态扫描块提取器 v3，185 口径修正闭合=169 注册+16 直呼消费]+9 域归类[system23/device52/vault18/page17/chat16/memory11/market11/model8/biz13]+工程形态定案[Kotlin 扩展函数分域文件，handler 体零改动+零 Activity 新增持有，P0-1/3 合规]）；**实施中途回滚**——三态提取器首跑分域文件存在块边界错位残片（三引号串/字符串模板打崩配平同族根因），三方对账需独立完整会话→**不带入半成品，工作区已还原 7666 行原始态**（设计师亲核：mov-upg93 无 MainActivity 改动残留，WIP 资产 gen_tools_v2.py/gen_v3.py 在案）；**重新认领建议开新会话**（上下文充足做三方对账+测试金字塔+冷启动锚），基建可直接复用——主仓 main 零污染（76c91cb 仅在分支）
→ **实测**（@fea2fae）：MainActivity.kt 7666 行/185 个 mcpHandlers 注册点；区域图：工具注册[大头]/chips:945/胶囊:1352/模型:2352/MemoryOS:2671/页面桥:2906/对话模式:4352/预审单:5317/Markwon:6839/市场:7266
→ **防撞**：动 MainActivity 大头——88 已合、89 挂单中，当前无在施同面单；与 86/90/92 零重叠
→ **哲学**：纯搬移零逻辑改动（优化另单）；UPG-79 拆分先例（approval/ 包已验证模式）
→ 🆕 **已认领 @2026-09-04 01:58·重新接管**（程序员 Kimi/kimi-cli，**新会话接管**——按卡「重新认领需独立完整会话」执行；worktree mov-upg93 沿用，branch feat/upg93 基建复用 @76c91cb[169 盘点+9 域归类+形态定案，MainActivity 零改动已亲核]；剩余：错位残片三方对账[独立扫描器 vs 盘点 vs 生成物]→搬移→测试金字塔→3 变异锚→冷启动锚→真机冒烟）→ ✅**C 完成 @2026-09-04 03:3x**（程序员 Kimi/kimi-cli，feat/upg93 **c969b05a** 已 push origin，基 main 254d6ca；**三方对账闭合**：独立扫描器词法级复核——169 盘点边界零错位[前任疑云实为 gen_v3 删块 off-by-one/行尾双回车缺陷]，口径修正 185=172 静态注册+13 读/动态写入，补漏 3 非典型 RHS[2 函数引用+1 标签 lambda]；**搬移**：172 注册+动态循环→tools/ 9 域扩展+BuiltinTools+ToolsRegistry[object 只聚合]，MainActivity 7666→6016 行，保真锚 172 块归一化 sha256 前后全等；**证据三层**：常驻契约 7 锚[名单/保真/唯一写点/装配顺序/P0-3/动态循环/落域]+全量 **762/0/0 全绿**[105 套件]+真机平板三场景[对话往返 ping→pong/vault.get 审批卡拒绝链 APPROVAL_DENIED/tool.help+market.status+file.read 直呼]；**三变异锚亲杀**全红还原复绿[M1 摘 vault.get→3 锚齐红/M2 改 tool.help 一行→保真锚点名红/M3 第二写点→唯一写点锚红]；**冷启动锚** 1592→1673ms Δ+5.1%<10%；工具面 182/158/24 与基线逐字一致；48 处 private→internal 必要提升在案；Token/KV 0/0；MainActivity 纯 CRLF 孤 LF=0；DEL-UPG93-20260904-001[code=c969b05a/artifact 不适用/manifest 26a1d780 自检 ok:True]；verify-hash 如实申报 not-ancestor[未合常态，合后终态复核]；蓝图已落档 `设计师\方案设计\MainActivity拆分蓝图_v1.md`；报告 DELIVERY_UPG93_2026-09-04.md；**已登记两个表**）——待验收员独立复跑+审验员证据链审验+设计师合 main → ✅ **验收员复验通过（§P47）→ 审验 confirmed 通过 @2026-09-04**（M-vault 键名变异亲杀 3 锚齐红独立复验+37 文件 +10162/−1746 核物一致+9 域结构+ToolsRegistry 只聚合坐实+MainActivity 7666→6016 亲核+冷启动 Δ+5.1%+两项发现登记）→ ✅ **已合 main @3315bff0 @2026-09-04**（设计师B：rebase 0aad7980 零冲突[c969b05a→3315bff0 重写，与 89 面零交集]+ff-only+push origin/main+verify-hash HASH_OK 闭环；**里程碑：上帝文件首刀落地 7666→6016 行+棘轮军规运行中**；findings 裁决见问题区）

## 标题

上帝文件第一刀：185 个工具注册+handler 搬入 ToolsRegistry 装配模块（零行为变化：185 计数+名单锚/唯一写点静态锚/5 代表工具直呼契约/全量 0 失败/真机冒烟）+ 拆分蓝图落档（分批：市场→页面桥→chips/胶囊→Markwon→启动序列）

**交付**：卡：UPG-93；STD：STD-UPG-93-v1

---

# UPG-94 极简主页真机观感修复（dock 隐藏 + logo 去框去影 + hint 删除 + 发送钮归 token）
**分类**：M1 体验/功能 ｜ 标签：M8 UI/交互


```status
phase: merged
branch: feat/upg94
head: 806bb01c
std: STD-UPG-94-v1
delivery_id: —
designer: 📌 **已派单·待认领 @2026-09-04**（用户真机实测踩中[2026-09-04 03:27 包]：极简态经典 dock 飘顶[
dev: 🆕 **已认领 @2026-09-04**（程序员 Claude/wmw0027，worktree mov-upg94，branch fe
inspector: ✅ **审验 confirmed 带缺陷通过 @2026-09-04**（四件坐实+U89 恢复自纠亲核正确完整+四项发现登记）
merge: ✅ **已合 main @806bb01c @2026-09-04**（设计师B：rebase 3315bff0 三提交重写[25f73fe
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：📌 **已派单·待认领 @2026-09-04**（用户真机实测踩中[2026-09-04 03:27 包]：极简态经典 dock 飘顶[applyPresentationMode 隐藏清单遗漏——UPG-88 交付缺件]+logo 牌感[CSS 圆角+绿光晕投影，png 透明底无问题]+heroHint 用户拍板删+btnSend 薄荷绿未归 v1.2 纯黑 pill；派单 `设计师\派单\UPG-94_极简主页真机观感修复_派单_2026-09-04.md`；STD-UPG-94-v1 已冻结 sha=4fca8e5d）｜ **优先级**：P1 → ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P48：分支头 25f73fe0[申报 746b20ec≠分支头二现]隔离 worktree——全量 763/0/1 亲跑一致+契约锚 4/4+**M1 删除式亲杀**[failures=1→还原；注释式免疫四现终纳]+四件观感修复核物；**P3×2：U89 引擎恢复自纠未申报**[透明度义务]+logo 168px 追加后截图未更新；**达待合→审验员→设计师**）→ ✅ **审验 confirmed 带缺陷通过 @2026-09-04**（四件坐实+U89 恢复自纠亲核正确完整+四项发现登记）
→ ⚠️ **WIP 回滚 @2026-09-04**（UPG-98 拆分批②市场面——程序员 C：7 块搬移+13 提升+MarketTools 恢复完成[compileDebugKotlin EXIT=0]；**但 5 个测试失败**[锚定面迁移问题——HostBuiltin 2+ToolMeta 2+SceneWiring 1——非产品缺陷]；**toolFaceSrc 加 market/ 联合读源+MarketTools.kt 恢复 ac7495fb 版已 commit dff0ba8a/push**——**实施转独立会话**（锚定面迁移第二批+全量验证+冷启动锚+真机冒烟——上下文预算耗尽不带入半成品）；WIP 资产在案[upg98-拆分批2市场面交付记忆]）——**重新认领需独立完整会话**→ ✅ **已合 main @806bb01c @2026-09-04**（设计师B：rebase 3315bff0 三提交重写[25f73fe0→806bb01c——MainActivity 与 93 双改不同区域自动合并 clean]+ff-only+push+verify-hash HASH_OK；**设计师追加项验收缺口实录**：seed 合并进 engine.registry+timelineList 骨架 CSS 两项[2026-09-04 设计师裁决并 94 随批]未随本单落地——转出至 UPG-96 范围[接线单前置一件]，STD-96 追加说明区已注记；4 项发现裁决见问题区）
→ 🆕 **已认领 @2026-09-04**（程序员 Claude/wmw0027，worktree mov-upg94，branch feat/upg94，基 main fe258949[UPG-89 已合]；四件按派单行号施工[dock 字段化+applyPresentationMode 路由/logo 零装饰/heroHint 删/btnSend 归 token]+变异锚 2+截图四场景）
→ **依据**：呈现体系 v1.1 §三 L0 + v1.2 增补 §一；用户两条新拍板（heroHint 删除/logo 零装饰）@2026-09-04
→ **防撞**：MainActivity 只动 applyPresentationMode/dock 字段化（军规 7 豁免=修既有装配行非新增面，纯 CRLF）；core.js/registry_seed 零触碰；与 UPG-93 拆分零交集

## 标题

极简主页干净底座：dock 极简态 GONE/经典态恢复路由 + heroLogo 零装饰（透明贴画布）+ heroHint 删除 + btnSend 归 v1.2 纯黑 pill

## 验收锚

见 `STD-UPG-94-v1`（L2 定级；变异锚 2：dock 路由锚/hero 装饰锚；截图四场景）。

## 不做

不动引擎/Registry；不动 placeholder；不做主页其他改版

**红线**：MainActivity 纯 CRLF；经典模式 dock 零回归；能力零缩减；Token/KV 两节必报。

**交付**：卡：UPG-94；STD：STD-UPG-94-v1

---

# UPG-95 个性化槽位选择（care profile 提炼 + 可选槽池 + LLM 编辑层 + ticketCard/rideCard 骨架落地）
**分类**：M1 体验/功能 ｜ 标签：M8 UI/交互


```status
phase: merged
branch: feat/upg95
head: ac7495fb
std: STD-UPG-95-v1
delivery_id: —
designer: 📌 **已派单·待认领 @2026-09-04**（用户拍板方向「商户信息尽量全+用户侧个性化显示」；设计口径=v1.2 增补附录 B[三
dev: 🆕 **已认领 @2026-09-04**（程序员 Claude/wmw0027，worktree mov-upg95，branch fe
inspector: ✅ **审验 confirmed 通过 @2026-09-04**（bun 18/18+全量 786/0/1 双亲跑+M-11 敏感闸亲杀独
merge: ✅ **已合 main @ac7495fb @2026-09-04**（设计师B：rebase 806bb01c 人工解真冲突 2 处[in
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：📌 **已派单·待认领 @2026-09-04**（用户拍板方向「商户信息尽量全+用户侧个性化显示」；设计口径=v1.2 增补附录 B[三层模型+槽池扩展]+种子基件[11 条带 expected]+形锚 demo v6；派单 `设计师\派单\UPG-95_个性化槽位选择_派单_2026-09-04.md`；STD-UPG-95-v1 已冻结 sha=b0ec9498）｜ **优先级**：P1 → ✅ **验收员复验 通过 @2026-09-04**（ACCEPTANCE_LOG §P49：979bf6bf 三批隔离 worktree——**bun 18/18 亲跑**+全量 **786/0/1 亲跑**[Care 双类 20 用例]+**M-11 变异亲杀**[敏感闸放行→红→还原]+编辑层接线[设计师裁决已接]；其余 3 锚采信；L2 出卡走查持有；**达待合→审验员→设计师**）→ ✅ **审验 confirmed 通过 @2026-09-04**（bun 18/18+全量 786/0/1 双亲跑+M-11 敏感闸亲杀独立复验+DEL 绑定无漂移正面记录[三连回潮后首单做对]）→ ✅ **已合 main @ac7495fb @2026-09-04**（设计师B：rebase 806bb01c 人工解真冲突 2 处[index.html CSS 段取 main 位置+并入 95 amenities/route/driver/pref-chip 装载块+顺带补回 94 恢复时漏网的 docked 态两条 CSS]+解后复跑闸：bun 12+6 全绿+全量 **790/0/1** 绿→ff-only+push+verify-hash HASH_OK；3 项发现裁决见问题区；持有项=L2 出卡 CDP 走查[随 96]+ASR PARTIAL[96 场景⑦]） → ✅ **验收员复验 带缺陷通过 @2026-09-03**（ACCEPTANCE_LOG §P50：cdf769a9 隔离 worktree——全量 **775/0/1 亲跑一致**+**HomeDeliveryContractTest 5/5 亲跑确认**[homeWeb 接线契约落位——UPI-89/95 遗留闭环]+红线/诚实申报复核；**M2 复杀 3 式未复现如实标注**[多行 evaluateJavascript 适配成本超阈值——采信程序员 XML]+L2 模拟器环境阻塞登记；**达待合→审验员→设计师**）
→ 🆕 **已认领 @2026-09-04**（程序员 Claude/wmw0027，worktree mov-upg95，branch feat/upg95，基 main 3315bff0[含 UPG-93 拆分]；施工：提炼层六域规则扩展（hotel/food/rail/ride/travel/shopping 纯函数）+offerCard amenities 槽（≤3）+ticketCard/rideCard candidate 登记+编辑层提示词节[全量事实×画像→槽池内选择；标签注入原文不进]——种子集 11 断言+4 变异锚；与 UPG-94 同 index.html 面按裁决串行）
→ **防撞**：与 UPG-94 同 index.html 面（amenity chips CSS）——建议 94 先合或同人串行；不动 MainActivity（棘轮军规）；不动 Memory API（只消费）
→ **复用**：UPG-51 提炼器扩展点 + UPG-89 引擎/Registry + UPG-05 基因红线（摘要渲染不渲染原文）

## 标题

商户事实全量进 + Memory OS 提炼关注点画像 + LLM 槽池内编辑选择——卡片内容千人千面、结构千人一面；ticketCard/rideCard 两新骨架落地（candidate，mock 事实 fixtures）

## 验收锚

见 `STD-UPG-95-v1`（L2 定级；变异锚 4：画像提炼/DRAFT 闸/敏感闸/槽池闸；种子集 11 断言+渲染截图四场景；真机 PARTIAL 位=homeWeb 接线后续批）。

## 不做

不做 homeWeb agent chunk 接线（后续批）；不接真实商户数据源（商业期 schema2ui）；不做用户可见画像 UI（UPG-51 L1① 沿用）

**红线**：LLM 禁发明槽/样式；敏感类绝不进画像；画像注入=提炼标签非原文；无新框架/依赖；Token/KV 两节必报。

**交付**：卡：UPG-95；STD：STD-UPG-95-v1

---

# UPG-96 homeWeb 呈现回路接线（极简发送不回落 + LLM 回复回流出卡 + 真机批收口）
**分类**：M1 体验/功能 ｜ 标签：M8 UI/交互


```status
phase: merged
branch: feat/upg96
head: 6dcfbac9
std: STD-UPG-96-v1
delivery_id: DEL-UPG96-20260904-001
designer: 裁决位]；DEL-UPG96-20260904-001[code=cdf769a9/artifact=04f48903/manifest_s
dev: ✅**C 完成 @2026-09-04**（feat/upg96 **cdf769a9** 已 push origin[远端顶；基 main
inspector: ✅ **审验 通过 @2026-09-04**（integrity_review=confirmed：与 §P50 一致，变异环比验收员更深
merge: ✅ 已合 main @6dcfbac9（feat/upg96 cdf769a9 合入+已 push；rebase ac7495fb 零冲突实
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：✅ 已合 main @6dcfbac9（feat/upg96 cdf769a9 合入+已 push；rebase ac7495fb 零冲突实证）｜ DONE｜ **优先级**：P1 → ✅ **验收员复验 带缺陷通过 @2026-09-04**（§P50：全量 775/0/1 亲跑一致+HomeDeliveryContractTest 5/5：三处转发/回路关闭/仲裁足迹锚；红线/诚实申报复核；M2 复杀「3 式未复现红」如实标注——验收员锚②半弱锚[contains 组合锚对单点破坏免疫，双处短路才红]；模拟器三度下线在案）→ ✅ **审验 通过 @2026-09-04**（integrity_review=confirmed：与 §P50 一致，变异环比验收员更深一层——单处条件反转锚②仍绿=行为部分受损[chunk 不回流=流式出卡缺失]，双处短路才红；2 项发现不阻塞登记问题区：①锚②半弱锚 P2[升级计数断言或行为级测试]②manifest 第十二现[standard_id 指纹未填——仍不可机器对账]）。派单 `设计师\派单\UPG-96_homeWeb呈现回路接线_派单_2026-09-04.md`；STD-UPG-96-v1 已冻结 sha=c48ea8a6）｜ **优先级**：P1
→ 🆕 **已认领 @2026-09-04**（程序员 Claude/wmw0027，worktree mov-upg96，branch feat/upg96，基 main 806bb01c[UPG-94 已合=seed 合并前置解除]；施工：sendFromHome 不回落+回复链极简态转发 homeWeb+失败诚实+仲裁 journal+94 转出两件[seed 合并进 engine.registry+timelineList CSS]——3 变异锚+真机七场景收口）→ ✅**C 完成 @2026-09-04**（feat/upg96 **cdf769a9** 已 push origin[远端顶；基 main 806bb01c=UPG-94 已合]；**三处接线**：①**sendFromHome 不回落**[删 applyPresentationMode CLASSIC 切回——极简发送留极简，对话史经典侧照常 GONE 保留可回看] ②**回复转发**[homeDeliveryActive 投递回路开关 volatile+streamChunkSink 消费点 homeDeliveryActive 条件转发 homeWeb MovHomeHost.onLlmChunk[jsString 转义]+**完成文本回流** trimmed 同条件+**回路关闭** homeDeliveryActive=false 不残留至经典发送] ③**仲裁足迹**[HomeBridge.sendText 加 route 二参[JS 端 fp.route 传入]→原生 appendLog「[UPG-96 仲裁] route=…」journal 可查]；**94 转出两件**[index.html 构造 engine 后合并 MovRegistrySeed.entries[ticketCard/rideCard candidate 骨架可被 Intent 分派]+timelineList 骨架 CSS .tl/.tl-item/.tl-dot.done/.tt/.ts]；**失败诚实**[homeWeb 未装配/JS 异常 fail-safe 落经典+appendLog 日志点——不许静默]；**变异 3 锚形态实录**[M1 删 dock GONE 行→MinimalHomePolish 契约红/M2 删三处转发→HomeDelivery 契约红/M3 删 route 参数→仲裁 journal 锚红——还原复绿]；契约锚 **5/5**[锚①不回落/锚②chunk+trimmed 回流/锚③仲裁 journal/94 转出件①②]；全量 **108 套件 775/0/1 全绿**[763[U94]+5[UPG-96 契约]=768+其他自洽]；**模拟器不回落实证**[tap 切极简→发送→画面仍极简：dump texts 无经典 chips/胶囊——经典元素零出现]+经典恢复对照；**真机七场景收口=验收员持有**[②ASR/③出卡目测/⑥小圆片交互——含 UPG-88 PARTIAL 销项、UPG-89 出卡走查销项]；MainActivity 纯 CRLF 保持；Token/KV 0/0[chunk 转发为流转投不进 prompt]；coverage_status=**PARTIAL**[接线面 FULL[契约锚 5/5+模拟器实证]/真机批目测走查=持有——设计师裁决位]；DEL-UPG96-20260904-001[code=cdf769a9/artifact=04f48903/manifest_sha=a376d376]；报告 DELIVERY_UPG96_2026-09-04.md；**已登记两个表**）——待验收员验收（L1+变异复杀+真机七场景目测[持有]+合后 verify-hash 终态复核）
→ **依赖**：UPG-94 先合（seed 未合并=接线也回落纯文本）；与 95 同 home 面建议串行
→ **豁免**：MainActivity 棘轮军规注记——改既有对话链路线（runChat/sendFromHome）非新增业务面；Agent 装配面归 93 批⑦另拆

## 标题

极简主页发问不跳经典——LLM 回答经 MovHomeHost.onLlmChunk 回流 homeWeb 引擎出卡；真机七场景收口 UPG-88/89 持有项（ASR 真人发声/真机出卡/仲裁）

## 验收锚

见 `STD-UPG-96-v1`（L3 定级；变异锚 3：回落锚/转发锚/静默闸；真机七场景）。

## 不做

不做个性化槽位（UPG-95）；不动 markstream 经典呈现；不做 Persistent Surface 迁移

**红线**：经典零回归；回答零静默；MainActivity 纯 CRLF 只动三处；Token/KV 两节必报。

**交付**：卡：UPG-96；STD：STD-UPG-96-v1

---

# UPG-97 侧边栏工作台三入口接线（我的记忆/我的资产/我的能力）+ comingSoon 兜底可见性
**分类**：M3 缺陷修复 ｜ 标签：M8 UI/交互


```status
phase: merged
branch: feat/upg97
head: 04ca51ab
std: STD-UPG-97-v1
delivery_id: DEL-UPG97-20260904-001
designer: 📌 **已派单·待认领 @2026-09-04**（用户真机报障「侧边栏有的按钮失灵」→ 设计师 adb 实测复现+根因定位：Sideba
dev: ✅**C 完成 @2026-09-04 06:5x**（程序员 Kimi/kimi-cli，feat/upg97 **9010075d**
inspector: ✅ **验收员复验 带缺陷通过 @2026-09-04**（ACCEPTANCE_LOG §P51：9010075d 工单系统仓隔离 wor
merge: ✅ **已合 main @04ca51ab（2026-09-04 设计师合入）**：rebase origin/main 6dcfbac9
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：📌 **已派单·待认领 @2026-09-04**（用户真机报障「侧边栏有的按钮失灵」→ 设计师 adb 实测复现+根因定位：SidebarNav.vue openPage:244-247 只接 tasks/orders/vault 三 case，记忆/资产/能力落 comingSoon 黑洞[toast 近乎不可见]；原生 handler[ui.openMemory/openAssets/openWorkbench]+PagesBridge 白名单齐备=纯前端分派欠账非回归；派单 `设计师\派单\UPG-97_侧边栏三入口接线_派单_2026-09-04.md`；STD-UPG-97-v1 已冻结 sha=37c9db04）｜ **优先级**：P1 → ✅ **验收员复验 带缺陷通过 @2026-09-04**（ACCEPTANCE_LOG §P51：9010075d 工单系统仓隔离 worktree——全量 794/0/0 亲跑一致+**变异双锚亲杀**[分派锚 failures=2/兜底锚 failures=1→还原]+openBuiltin 三 case+comingSoon showDialog+i18n 双字典；**L2 真机四点验实证**[市场/资产/能力/订单]+**我的记忆行 5556 未呈现疑点转办**[平板五点验过——澄清后终判]；**达待合→审验员→设计师**）
→ **防撞**：纯前端单（mov-vue 源+产物同步）；MainActivity/tools 零行；与 95/96 零交集
→ 🆕 **已认领 @2026-09-04 05:47**（程序员 Kimi/kimi-cli，worktree mov-upg97，branch feat/upg97，基 origin/main ac7495f；按派单施工：openPage 三 case 接线[先核实槽位键值实证]+comingSoon 兜底可见化+mov-vue 构建同步产物——纯前端零原生）→ ✅**C 完成 @2026-09-04 06:5x**（程序员 Kimi/kimi-cli，feat/upg97 **9010075d** 已 push origin，基 origin/main ac7495f[含 UPG-93 已合 3315bff0]；**键值对齐实证链**：CapsuleResolver 静态表 page 键[tasks→workbench/vault→assets/memory→memory]+openPageByCapsule 分派表+PageTools 注册点三方闭合；**修复**：openBuiltin 补 workbench/assets/memory 三 case+兜底可见化[裸 toast→showDialog「该入口暂未开通」双字典]；**契约锚**：SidebarDispatchContractTest 4 锚[分派/键值对齐/兜底/回归]常驻；**双变异亲杀**红绿闭环[M1 删 memory case→2 锚红/M2 兜底回 toast→兜底锚红；两轮作废教训在案：CRLF 失配+restore 误回 HEAD→定点快照还原]；全量 **794/0/0**[110 套件]+bun 18/18+assembleDebug 绿；**产物链** vite build+sync-pages 103 文件同源同步[bundle sha 在档]；**真机平板五点验全过**[市场/订单/记忆/资产/能力逐点截图]；Token/KV 0/0；MainActivity/tools 零行；DEL-UPG97-20260904-001[code=9010075d/artifact bundle 7e212364/manifest 72035bc9 **deliver-gen 硬闸机制产出**]；verify-hash not-ancestor[未合常态，合后终态复核]；报告 DELIVERY_UPG97_2026-09-04.md；**已登记两个表**）——待验收员验收+设计师合 main
→ **教训**：导航类验收须「入口清单全点验」；9-02 openAssets 漏 case 同族——键值对齐须实证
→ ✅ **已合 main @04ca51ab（2026-09-04 设计师合入）**：rebase origin/main 6dcfbac9 零冲突（merge-tree 已实证同点）→ ff 合入 → push `6dcfbac9..04ca51ab`；随批裁决：默认种子「我的记忆」入口拍板另立 UPG-101（P3 挂单）；verify-hash 终态与 CI 复核随 Actions/审验员走常规

## 标题

侧边栏五入口全通：openPage 补 memory/assets/workbench 三 case（接现成原生 handler）+ comingSoon 兜底可见化

## 验收锚

见 `STD-UPG-97-v1`（L2 定级；变异锚 2：分派锚/兜底锚；真机五点验）。

## 不做

不动原生 handler；不动 PagesBridge 白名单；不做侧边栏改版

**红线**：产物只从 mov-vue 构建；发现 handler 缺失停下报障不许顺手加；Token/KV 两节必报。

**交付**：卡：UPG-97；STD：STD-UPG-97-v1

---

# UPG-98 MainActivity 拆分·批② 市场面搬移（→ market/ 模块）
**分类**：M2 体系/治理 ｜ 标签：M6 架构


```status
phase: merged
branch: feat/upg98
head: d11509cc
std: STD-UPG-98-v1
delivery_id: —
designer: 📌 **已派单·待认领 @2026-09-04**（拆分主线批②/共 8 批｜串行纪律：一批一派合后再基[UPG-95 真冲突实证后立]；
dev: 🆕 **已认领 @2026-09-04 07:18**（程序员 C/Claude-wmw0027，worktree mov-upg98，b
inspector: ✅ **审验 confirmed 通过 @2026-09-04**（审验员：从零编译 804/0/0+1 跳过亲跑+变异采信升级亲杀[KDo
merge: ✅ **已合 main @d11509cc @2026-09-04**（04ca51ab→d11509cc 直接快进零冲突，verify-h
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：📌 **已派单·待认领 @2026-09-04**（拆分主线批②/共 8 批——串行纪律：一批一派合后再基[UPG-95 真冲突实证后立]；口径=拆分计划书 v1.2+蓝图 §二+批①先例[3315bff0 形态/锚法照抄]；派单 `设计师\派单\UPG-98_MainActivity拆分批2市场面_派单_2026-09-04.md`；STD-UPG-98-v1 已冻结 sha=1aa22822）｜ **优先级**：P1 → ❌ **验收员打回 @2026-09-03**（ACCEPTANCE_LOG §P51b：**P1 提交版测试文件编译不过**——d96ade5d HostBuiltinPackContractTest mainSrc() 裸换行截断字符串→compileDebugUnitTestKotlin FAILED→全量在提交版无法执行；对照实锤：程序员 worktree 同路径=正确版未提交——**提交版≠验证版实锤**；七块搬移结构核过[工作区读源+MarketTools.kt 恢复 U93 遗漏自查]；修=工作区正确版 commit+新 commit 交付+DEL 重绑+R1 全新检出复验；**打回→程序员**） → ⚠️ **§P51c 中间态核验 @2026-09-03**（ACCEPTANCE_LOG 补记：dff0ba8a mainSrc 修复实锤[:27 单行]采纳 §P51b；全量 795/6/1——4 类失败定性=**锚定面迁移未完成**[HostBuiltin seg 锚失效/MarketSplit 集合缺元素/ToolMeta internal 锚未更新/ToolsSplit 1 红——非产品缺陷]；**维持打回（WIP）**——锚定面迁移完成（0 失败）再交 R1 复验） → 📌 **二次 WIP 如实申报处置 @2026-09-03**（脚本自动化搬移失败如实[fun 声明复杂度四条根因入册]——工作区还原 04ca51ab；**验收员核出申报不实一项**：6 文件 D 残留[gen93/scan93b/mut93 等 UPG-93 方法论资产被工作区删除未提交]——已代为恢复[git checkout，资产保全]；UPG-98 状态=**待重新认领·人工逐块搬移路径**[程序员建议：IDE 重构或手工 copy-paste 每块编译一次，30 分钟级]；工作树现状=feat/upg98@04ca51ab 干净） → ✅ **交付·待验收 @2026-09-04**（程序员重做完成[用户直派]：cherry-pick 上轮人工搬移 2787b73a[编译实证过的人工件非脚本]+锚定面迁移全收口=4b279e0a+d11509cc——全量 804/0/1（112 套件 --rerun-tasks）+3 变异锚亲杀红绿闭环[保真点名 buildLocalOverview/名单多挂点名 zzMutant/唯一写点点名 syncBuiltinPackTools]+冷启动双侧 5 次中位 940→932ms（Δ-0.9% 在带内）+真机三场景全过[市场页渲染/启停 185↔172 精确-13/logcat 双行/market.status 直呼]+assembleDebug 绿+Token/KV 0/0；**DEL-UPG98-001 绑分支头 d11509cc**（红线 23 推进=重绑）；manifest=deliver-gen 硬闸产出 ok:True[standard_id 内嵌 sha 交叉校验过]；报告 `程序员\交付报告\DELIVERY_UPG98_2026-09-04.md`；R1 复验→审验员→设计师） → ✅ **R1 复验 通过 @2026-09-04**（ACCEPTANCE_LOG §P52：d11509cc 全新检出 **804/0/1 亲跑终验**[P1 提交版编译不过修复闭环]+MarketSplitContract 5 锚全绿[搬移保真契约锁]+变异 3 锚采信如实[验收员注入 3 轮未达真红——XML+契约双证采信]+L2 真机三场景采信[模拟器四度下线环境阻塞登记]；两观察转办[isAppVisible 不稳定/registry 依赖]；**达待合→审验员→设计师**） → ✅ **审验 confirmed 通过 @2026-09-04**（审验员：从零编译 804/0/0+1 跳过亲跑+变异采信升级亲杀[KDoc 改字→保真锚真红]+拆前 sha 独立抽查=冻结值+问题区 3 项） → ✅ **已合 main @d11509cc @2026-09-04**（04ca51ab→d11509cc 直接快进零冲突，verify-hash 通过；问题区 3 项裁决落档[isAppVisible 呈现通道缺口升级 P2 入审批收口议题/registry 依赖挂账残留面登记/3 函数 public 豁免注记入债务清单]；里程碑：上帝文件 7666→6016→5929 行；批③页面桥待派）
→ **范围**：市场总览区（buildLocalOverview/启停/安装投影）→ market/ 模块；纯搬移零逻辑改动；保真锚=块归一化 sha256 前后全等
→ **防撞**：本批独占 MainActivity 市场区；与 95/96/97 零交集（均已合/他面）；批③页面桥待本批合后派
→ 🆕 **已认领 @2026-09-04 07:18**（程序员 C/Claude-wmw0027，worktree mov-upg98，branch feat/upg98，基 ac7495fb；**接手转会话现场**——前会话已交 2787b73a 市场面搬移主体[7 块→market/MarketOverviewTools.kt] + c0797193/d96ade5d 两批既有测试锚适配[声明「转独立会话——上下文预算耗尽不带入半成品」]；本会话接续：保真对账 recon98.py BEFORE/AFTER 双侧 7/7 已亲验 + 批②契约锚/全量/变异/冷启动/真机/交付登记待做；amend 混库事故[我 07:09 把保真产物 amend 进对方 c0797193——内容零丢失]如实申报，细节见交付报告）

## 标题

拆分批②：市场面搬入 market/ 模块——MainActivity 6016 行继续只出不进，纯搬移+保真锚+军规 7/8 合规

## 验收锚

见 `STD-UPG-98-v1`（L3 定级；变异锚 3：保真/名单/唯一写点；冷启动锚+真机三场景冒烟）。

## 不做

不做优化/顺手修（债务清单只记录不修）；不动其他面；不做批③及以后

**红线**：纯搬移零逻辑改动；MainActivity 纯 CRLF；零新增壳内代码；Token/KV 两节必报。

**交付**：卡：UPG-98；STD：STD-UPG-98-v1

---

# UPG-99 工单系统工具链硬闸批（DEL 分支头校验 + standard_id 交叉校验 + 报告模板强制段 + 红线 23 落规）
**分类**：M2 体系/治理 ｜ 标签：M6 架构


```status
phase: merged
branch: —
head: —
std: STD-UPG-99-v1
delivery_id: —
designer: ✅ **设计师直修完成 @2026-09-04**（用户拍板「你自己修吧，不搞工单」｜不走流转流程，设计师直接落地四件：①deliver-g
dev: —
inspector: **范围**：sync-orders DEL==分支头校验 / 审验.py standard_id 交叉校验 / deliver-gen 模
merge: 已合 main@hash」在祖先链/存量 cherry-pick 卡豁免/显式豁免跳过]｜首跑即抓 7 条存量异常全归因[5 存量豁免+1
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：✅ **设计师直修完成 @2026-09-04**（用户拍板「你自己修吧，不搞工单」——不走流转流程，设计师直接落地四件：①deliver-gen 模板加「施工期重大回归与自纠」强制节+「截图随追加」提示 ②审验.py --manifest 加 standard_id 名↔内嵌指纹交叉校验[UPG-93 型错位反案拦截实证+正案绿]+自测扩至 6 案[结论行顺手改动态计数] ③sync-orders.mjs 加 DEL==分支头机器闸[未合卡比分支头/已合卡验「已合 main @hash」在祖先链/存量 cherry-pick 卡豁免/显式豁免跳过]——首跑即抓 7 条存量异常全归因[5 存量豁免+1 分支已收+1 UPG-86 人工核] ④README 红线 23 追加三条明文[机制产出/分支头闸/交叉校验]；回归：deliver-gen 4/4+manifest 6/6+verify-hash 2/2 全绿+sync --check diff=0 exit=0；派单/STD 留档作依据，不走验收流转）｜ **优先级**：P2
→ **范围**：sync-orders DEL==分支头校验 / 审验.py standard_id 交叉校验 / deliver-gen 模板强制段 / 红线 23 两条明文
→ **纪律**：既有闸零回归；报错人话化；改库卡先备份；sync 后 --check diff=0

## 标题

治理靠机制不靠人盯：四条设计师裁决落成机器闸（DEL 校验/交叉校验/模板强制/细则明文），正反案自测+实战过闸实证

## 验收锚

见 `STD-UPG-99-v1`（L2 定级；变异锚 3：DEL 校验锚/交叉校验锚/模板锚；实战过闸两实证）。

## 不做

不动 MOV 仓；不加新校验类目（四件以外另单）；不动既有闸逻辑

**红线**：工单系统仓限定；既有闸零回归；交付报告自含两节申报。

**交付**：卡：UPG-99；STD：STD-UPG-99-v1

---

# UPG-100 锚②半弱锚升级（count/match 组合断言）
**分类**：M2 体系/治理 ｜ 标签：M9 工具链/治理


```status
phase: registered
branch: —
head: —
std: —
delivery_id: —
designer: —
dev: —
inspector: 📌 已立卡·待派 ⏳ @2026-09-04（UPG-96 审验发现项①转正：contains 组合锚对单点破坏免疫）｜ 待派单
merge: —
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：📌 已立卡·待派 ⏳ @2026-09-04（UPG-96 审验发现项①转正：contains 组合锚对单点破坏免疫）｜ 待派单 ｜ **优先级**：P2 → 🆕 **已认领 @2026-09-05**（程序员 Kimi/kimi-cli，worktree mov-upg100，branch feat/upg100，基 origin/main 31640fc8——用户指令直接领单；无派单文/无 STD 冻结，按卡面 A1-A3+锚施工，STD 补冻转设计师追认） → ✅**C 完成 @2026-09-05**（feat/upg100 **a63b7088** 已 push origin；三件全交：①**A1 锚②升级**[contains 组合→计数+局部性：`if (homeDeliveryActive)`==2+`MovHomeHost.onLlmChunk(`==2+分支块内局部性窗；形态取舍=JVM 无法驱动 WebView 回路，行为级=真机层验收员持有] ②**A2 方法论入库**[已知坑.md #10：多点同文本 contains 锚只防全删] ③**A3 同族抽检**[静态 8 文件 18 处疑似=Appearance 16+Approval 2，两档死角模式=定义兜底命中/注释令牌污染；实测变异 4 处 S1/S2/S4 死角实证绿+S3 强锚对照红]；**变异亲杀 4 组**[M1 单点短路(UPG-96 原变异复现)/M2 空壳/M3 双点/M4 全删全红，定点快照还原复绿]；全量 **842/0/1** 零回归[基线 31640fc8 同口径，UPG-107 载 843 ±1 注记]；零业务改动[+23/-0 单测试文件]；verify-hash not-ancestor 未合常态；STD 未冻结[卡面段实测 sha 2f3e20ea 临时代入 manifest]；DEL-UPG100-20260905-001[manifest_sha=fa151af2 硬闸产出]；报告 DELIVERY_UPG100_2026-09-05.md；**已登记两个表**）——待验收员验收+设计师 STD 追认/合 main；**遗留转办**：A3 表 18 处疑似死角升级建议立后续单（P3，Appearance 族优先）

## 标题

HomeDeliveryContractTest 锚②升级：`if (homeDeliveryActive) 次数==2` 计数断言（冻结双点）或行为级测试——根除「单点破坏锚仍绿」死角

## 背景

UPG-96 审验（2026-09-04，与 ACCEPTANCE_LOG §P50 一致）：M2 复杀实测——**单处条件反转（chunk 转发短路）锚②仍绿**（contains 组合锚对单点破坏免疫：第二处同文本仍命中，行为已部分受损=chunk 不回流=流式出卡缺失）；**双处同时短路才红**。验收员「3 式未复现红」真根因=锚②强度不足（非执行问题）。

## 范围

- A1：锚②升级计数断言——`homeDeliveryActive` 条件分支出现次数==2（冻结转发+回流双点）；或改行为级测试（chunk 回流端到端断言）
- A2：方法论入库——「多点同文本 contains 锚只防全删」教训写入体系（测试锚强度规范）
- A3：同族排查——其余 `contains` 组合锚（HomeDeliveryContractTest 之外）做单点破坏抽检（4~8 处）

## 验收锚

- A1-1：单处短路（恢复原审验变异）→ 升级版锚**红**（亲杀）
- A1-2：双处短路 → 红；全删 → 红；原状态 → 绿
- A3-1：同族抽检结论表（锚/强度/是否升级）

## 不做

- 不改业务行为（纯测试/锚升级）；不动 UPG-96 已合逻辑

**红线**：测试锚升级不得引入 flaky；行为级测试优先（比计数锚更强）。

**交付**：卡：UPG-100；STD：未冻结（卡面 A1-1/A1-2/A3-1 为准，追认转设计师） ｜ ✅ 已交付 @2026-09-05（commit a63b7088；DEL-UPG100-20260905-001；报告 程序员/交付报告/DELIVERY_UPG100_2026-09-05.md）——待验收

---

# UPG-101 侧边栏默认插件种子清单（「我的记忆」入口是否纳入 defaults）
**分类**：M8 UI/交互 ｜ 标签：M3 缺陷修复


```status
phase: merged
branch: —
head: —
std: —
delivery_id: —
designer: 拍板@2026-09-04（UPG-97 合 main 随批
dev: —
inspector: —
merge: 📌 挂单·待用户拍板 @2026-09-04（UPG-97 合 main 随批裁决转立；产品决策项非缺陷）
actor: sys04-backfill
updated_at: 2026-09-05T08:41:59
```

**状态**：📌 挂单·待用户拍板 @2026-09-04（UPG-97 合 main 随批裁决转立；产品决策项非缺陷）｜ **优先级**：P3

## 标题

新装/默认设备侧边栏「我的记忆」入口：`WorkbenchPins.defaults()` 三件（tasks/orders/vault）是否加入 memory——用户拍板后落契约锚锁种子清单

## 背景

UPG-97 真机复盘（2026-09-04）：侧边栏「我的记忆」在部分设备/新装态**天然不呈现**——工作台 pins 默认种子只有 tasks/orders/vault（`WorkbenchPins.defaults()`，WorkbenchPins.kt:35-39），memory 需用户手动添加。功能回路本身通（注入 memory 槽复验 → 行呈现+点击直达记忆页实证）；**是否默认呈现属产品决策**：默认暴露「记忆」（强化记忆心智）vs 保持极简（用户自选）。

## 范围

- A1：用户拍板默认种子清单（默认含/不含 memory）
- A2：拍板后落契约锚锁清单（defaults 三件 vs 四件断言常驻）

## 验收锚

- A2-1：defaults() 回归锚——声明清单与「种子清单.md/契约」一致，改清单必须双改（锚红）
- A2-2：新装/默认设备侧栏呈现与拍板一致（真机一键验证）

## 不做

- 不重构 WorkbenchPins 机制；不动 UPG-97 已合逻辑

**红线**：产品决策由用户拍板，不得设计师/程序员自行定夺默认暴露

# UPG-102 MainActivity 拆分·批③ 页面桥面搬移（→ pages/ 模块）
**分类**：M2 体系/治理 ｜ 标签：M6 架构


```status
phase: merged
branch: feat/upg102
head: cfa7d607
std: STD-UPG-102-v1
delivery_id: —
designer: 📌 **已派单·待认领 @2026-09-04**（拆分主线批③/共 8 批｜串行纪律：批② d11509cc 已合，本批基=main 顶
dev: 🆕 **已认领 @2026-09-04**（程序员 Claude/wmw0027，worktree mov-upg102，branch f
inspector: ✅ **审验员独立复核 通过 @2026-09-04**（§P53 审验终态：从零编译 809/0/0+1 跳过 + 契约锚 5/5 + M
merge: ✅ **已合 main @cfa7d607（2026-09-04 设计师合入：fast-forward d11509cc→cfa7d607
actor: sys04-backfill
updated_at: 2026-09-05T08:41:58
```

**状态**：📌 **已派单·待认领 @2026-09-04**（拆分主线批③/共 8 批——串行纪律：批② d11509cc 已合，本批基=main 顶 d11509cc[5929 行]；行号已重核：browserHandlers 注册块 :2332-2515[14 个 browser.*]+WebMcpHub.mountCallback 块 :2517-2557；PagesBridge 装配段/白名单/pageToolProvider 留壳=装配点红线；派单 `设计师\派单\UPG-102_MainActivity拆分批3页面桥_派单_2026-09-04.md`；STD-UPG-102-v1 已冻结 sha=3eaa908b）｜ **优先级**：P1 → ✅ **验收员复验 通过 @2026-09-04**（ACCEPTANCE_LOG §P53：**真交付=d77dae2a**[申报 cfa7d607 错误——申报 sha 错误 P3]隔离 worktree——全量 **809/0/1 亲跑一致**+PagesSplitContractTest 5 用例[申报 6 差 1 注记]+**M2 亲杀**[browser.forward 行置空→「漏搬 browser handler」红→还原]+approvalService internal 复核；两块搬移纯搬移核物；**达待合→审验员→设计师**）
→ 🆕 **已认领 @2026-09-04**（程序员 Claude/wmw0027，worktree mov-upg102，branch feat/upg102，基 main d11509cc；施工：browserHandlers 注册块[14 个 browser.*]+WebMcpHub.mountCallback 块→pages/ 模块顶层扩展——纯搬移零逻辑改动+3 变异锚+锚定面迁移收口[全量 0 失败硬门槛]+搬出函数显式 internal）
→ ✅ **审验员独立复核 通过 @2026-09-04**（§P53 审验终态：从零编译 809/0/0+1 跳过 + 契约锚 5/5 + M2 亲杀复现一致 + 补强断言目标文本存在性核实[PageBridgeTools url http(s)/ref 有效——真实存在且 809 含它绿 M2 含它红]；**申报 sha 辨析定性修正**：cfa7d607=UPG-102 链契约锚补强[PagesSplitContractTest +3 逻辑级断言]——提交图证明必在 d77dae2a 之后，commit message 标「UPG-89」为误导标注；达待合→设计师）→ ✅ **已合 main @cfa7d607（2026-09-04 设计师合入：fast-forward d11509cc→cfa7d607 全链随批[补强有效自洽]；push `d11509cc..cfa7d607`）**
→→ **设计师裁决**：①合 main 范围=全链 cfa7d607（采纳审验建议；commit message 误导标注不回溯改历史[force-push 风险]，定性以本卡为准）②P3 契约锚保真强度=登记挂账（搬移类工单统一 sha256 冻结范式——下批④起执行范式统一）③真机冒烟三场景=验收员 L3 持有（未核销）
→ **范围**：页面桥面两块 → pages/ 模块；纯搬移零逻辑改动；保真锚=块归一化 sha256 前后全等；搬出函数全显式 internal（批② 3 函数漏写事故教训入红线）
→ **防撞**：本批独占 MainActivity 页面桥区；与在飞单零交集；批④（chips/胶囊）待本批合后派（接口须过 UPG-89 评审）

## 标题

拆分批③：页面桥面搬入 pages/ 模块——MainActivity 5929 行继续只出不进，纯搬移+保真锚+军规 7/8 合规

## 验收锚

见 `STD-UPG-102-v1`（L3 定级；变异锚 3：保真/名单/唯一写点；锚定面迁移收口=全量 0 失败硬门槛；提交版=验证版；冷启动锚+真机三场景[侧边栏/browser.* 直呼/web.* 挂载]）。

## 不做

不做优化/顺手修（债务清单只记录不修——asset.* 转调 vault.* 耦合在册）；不动其他面；不做批④及以后

**红线**：纯搬移零逻辑改动；MainActivity 纯 CRLF；零新增壳内代码；提交版=验证版（全新检出复跑）；Token/KV 两节必报。

**交付**：卡：UPG-102

---

# UPG-103 MainActivity 拆分·批④ chips/胶囊面搬移（→ ui/chips/ + ui/capsule/）
**分类**：M2 体系/治理 ｜ 标签：M6 架构


```status
phase: merged
branch: feat/upg103
head: 4e5a2f7c
std: STD-UPG-103-v1
delivery_id: DEL-UPG103-20260904-001
designer: 📌 **已派单·待认领 @2026-09-04**
dev: ✅ **C 交付 @2026-09-04 23:05**（feat/upg103 **4e5a2f7c** 已 push origin；设计
inspector: ✅ **审验员转通过 @2026-09-05**（四断收口逐项复核全绿：STD v2 重冻=51584a7d 一致/DEL 绑定 manif
merge: ✅ **设计师合 main @97d7ca31**（2026-09-05：批④ chips/胶囊面搬移全链合入；合后 verify-hash
actor: sys04-backfill
updated_at: 2026-09-05T08:41:58
```

**状态**：📌 **已派单·待认领 @2026-09-04** → 🆕 **已认领 @2026-09-04（Claude CLI 2.1.150，worktree mov-upg103，branch feat/upg103，基 origin/main cfa7d607[批③ 已合]——设计师指派**（拆分主线批④/共 8 批——串行纪律：批③ cfa7d607 已合，本批基=main 顶 cfa7d607；范围=chips 气泡[蓝图 :945]+主页胶囊[:1352][pin 仅存 stableId/pinType/preset；局部 fun pinServers/pinSchemaOf/readPinList/writePinList]；目标模块 ui/chips/+ui/capsule/；**接口须过 UPG-89 评审**；跨面收编 market.uninstall pin 读写归位；**sha256 冻结范式本批起强制**[UPG-102 挂账落地]；生命周期回调归属策略先定；派单 `设计师\派单\UPG-103_MainActivity拆分批4芯片胶囊_派单_2026-09-04.md`；STD-UPG-103-v1 已冻结 sha=ad36a5fd）｜ **优先级**：P1 → 🆕 **已认领 @2026-09-04 20:50**（程序员/Claude-kimi，worktree mov-upg103，branch feat/upg103，基 main 顶 cfa7d607——串行纪律遵守：批③已合；接口挂点过 UPG-89 评审，冲突停下报设计师） → ✅ **C 交付 @2026-09-04 23:05**（feat/upg103 **4e5a2f7c** 已 push origin；设计师接管收尾——Claude 施工 75% 后由设计师完成对账+测试+提交；sha256 冻结 9 块 recon103 ALL_OK+契约锚 ChipsCapsuleSplitContractTest 5/5+全量 814/0/0+assembleDebug 47 任务绿；KNOWN GAP P3×2 在案）→ ✅ **复验通过 @2026-09-04**（ACCEPTANCE_LOG §P54：4e5a2f7c 隔离 worktree——全量 814/0/0 亲跑+契约锚 5/5+recon103 对账亲跑 ALL_OK；⚠️ §P54 段错挂 UPG-47 卡尾，此处归位注记）→ ⚠️ **审验 unresolved @2026-09-05**（实质可信——审验员独立复现 recon103 9/9 块 ALL_OK；**形式链四断**：①STD v1 哈希口径偏离标准法→**STD-UPG-103-v2 已重冻**[sha=51584a7d，会签待补] ②DEL 绑定未建[旧格式 manifest 无 delivery_id/三重 hash] ③两表登记缺位[本段补登] ④证据目录空[待真机 L3 补验一并落]；**红线 17：补证齐前禁止合入**；生命周期归属锚实证 N/A[全分支三回调零命中]，见交付行注记）→ ✅ **真机 L3 走查通过 @2026-09-05**（CleanVM 零缓存全新虚拟机 before/after 同机对比[设计侧替验收员执行]：冷启动中位 2501→2309ms[-7.7%，Δ≤10% ✓]；场景①chips——logcat 铁证 tool_call→tool_result 闭环×2[电池工具真实回复]+瞬态帧 burst_2/3 落档待视觉目测；场景②胶囊——getPins 3 BUILTIN→setPins 写回→三胶囊全还原 status OK；场景③market.disable/enable 双向工具面摘除/恢复闭环；真短信登录全链 ✓；证据 14 份落 `设计师\检查证据\UPG103_2026-09-05\`；走查 P3 发现[setPins 非法形态静默清空钉选]+键名双链语义 → 已登记挂账×2）→ 🔗 **DEL 绑定=DEL-UPG103-20260904-001**（code=4e5a2f7c218ae2b5231d3fdeb0bb4e39c8333871/artifact=无产物绑定[纯源码搬移单如实]/manifest=delivery_UPG103_manifest.json[evidence_manifest_sha=2167cfcc 自检 ok]/报告=程序员/交付报告/DELIVERY_UPG103_2026-09-04.md——状态区投影锚+交付段详）——**②DEL 绑定已闭环（报告骨架补齐+sync 投影修复 MOV_REPO→E 盘真身）→ 审验复核 → 设计师合** → 🔍 **burst 帧目测闭环 @2026-09-05**（验收员目测：burst_2/3 逐像素 diff=0.000%——同帧非有效瞬态对照[UPG-94 P2-B 同族教训二现]；**场景①维持判定**：logcat tool_call→tool_result 闭环×2 铁证+稳态帧一致，chips 系亚秒级瞬态 UI 截图粒度不可达，证据链完整；§P54 追加落档 cc08b9c4+证据入 docs/acceptance-evidence daf22f7c；断裂④证据目录已补[验收员/证据数据/2026-09-05/UPG103/]）——**形式链四断全闭环**（①STD v2 重冻 ②DEL ok:True ③两表 ④证据目录+真机 L3 走查）→ 待审验复核转 ✅ → 设计师合 → ✅ **审验员转通过 @2026-09-05**（四断收口逐项复核全绿：STD v2 重冻=51584a7d 一致/DEL 绑定 manifest ok:True/两表登记齐/证据落档 18 份+CapsuleCleanVM 走查；recon103 亲跑维持 ALL_OK；机器复审 problems=[]；残留 P3×2 已入问题区不阻塞；登记落点：工单审验状态 64/0/0）→ ✅ **设计师合 main @97d7ca31**（2026-09-05：批④ chips/胶囊面搬移全链合入；合后 verify-hash 终态 HASH_OK——`4e5a2f7c` 在 origin/main 祖先链）

## 标题

MainActivity 批④：chips 两级气泡 + 主页胶囊装配/持久化 → ui/chips/ + ui/capsule/（纯搬移；sha256 冻结清单保真；接口过 UPG-89）

## 背景

MainActivity God File 拆分主线（计划书 v1.2 大神 9.1/10 定稿）：批① 工具注册✅→ 批② market✅→ 批③ pages✅→ **批④ chips/胶囊**（接口过 UPG-89 评审）；批⑤ Markwon 视图/⑥ 启动序列/⑦ 对话模式/⑧ 模型管理/⑨ Memory OS 待后续。UPG-102 审验新增 P3：批④起契约锚统一 **sha256 冻结清单范式**（UPG-93/98 先例；文本 contains 级保真强度不足挂账落地）。

## 范围

- A1：chips 气泡（组列表两级气泡）→ ui/chips/
- A2：主页胶囊（pin 只存 stableId/pinType/preset；pinServers/pinSchemaOf/readPinList/writePinList 连带）→ ui/capsule/
- A3：market.uninstall 跨面 pin 读写归位（market 侧只调导出接口）
- A4：装配点一行调用 + sha256 冻结清单 + 契约锚（名单/唯一写点/生命周期归属）

## 验收锚

见 `STD-UPG-103-v1`（sha256 冻结清单锚/名单锚/唯一写点锚/生命周期归属锚；变异 4 组；L3 真机三场景+冷启动 Δ≤10%）。

## 不做

- 不优化 chips/胶囊逻辑（坏味道只记债务清单）；不动 Market/其他模块；不做接口自定（冲突停下报设计师）

**红线**：纯搬移零逻辑改动；MainActivity CRLF；壳内装配点一行；Feature 禁长持 Activity；提交版=验证版；Token/KV 必报

**交付**：卡：UPG-103；STD：STD-UPG-103-v1 ｜ → ✅ **已交付 @2026-09-04 23:05**（设计师/接管收尾——Claude 施工 75% 后由设计师完成对账+测试+提交）：commit `4e5a2f7c`（branch feat/upg103，基 cfa7d607）；**sha256 冻结 9 块 recon103 ALL_OK**（拆后反接线还原=零逻辑漂移纯搬移——upg103_freeze_manifest.txt + docs/upg103-tools/recon103.py 对账工具）；契约锚 ChipsCapsuleSplitContractTest **5/5**（名单/装配点/唯一写点/派生接口）；全量 **814/0/0**（--rerun-tasks）；assembleDebug --rerun-tasks 47 任务 SUCCESS；KNOWN GAP=P3×2（面重组段未冻结[行为面全量兜底]/catalog 生成物未纳入）；manifest=delivery_UPG103_manifest.json；**生命周期归属锚 N/A 实证**（设计师 @2026-09-05：feat/upg103 全分支 grep `onRequestPermissionsResult/onActivityResult/registerForActivityResult` 零命中——chips/胶囊搬移面不涉生命周期回调，壳内亦无残留，该锚按「无涉」待会签确认）——**待验收** → 🔗 **DEL 绑定补建 @2026-09-05（程序员 Kimi/kimi-cli 代行，STD v2 追加区「形式链四断②」收口）**：deliver-gen 机制产出新格式 manifest（delivery_id=DEL-UPG103-20260904-001 + standard_id=STD-UPG-103-v2[content_sha256=51584a7d 交叉校验]+三重 hash：code=4e5a2f7c218ae2b5231d3fdeb0bb4e39c8333871/artifact=无产物绑定[纯源码搬移单如实]/evidence_manifest_sha=2167cfcc）**替换处理中心旧格式**（旧版归档 _备份归档/delivery_UPG103_manifest_旧格式_20260905.bak.json）；证据三件套=冻结清单实物+**recon103 本轮复跑 ALL_OK**（对 4e5a2f7c 全量检出内容）+计数对账（交付/验收计数来源标注）；审验.py --manifest 自检 **ok:True 重算一致**；口径注记[冻结清单实物 8 块——历史文本 9 块以实物为准]；verify-hash not-ancestor 未合常态；**两表 delivery_id 列已登记**

---

# UPG-104 工具联动 Runtime 契约·段②（评测集+安全门+编排+记忆回流）
**分类**：M2 体系/治理 ｜ 标签：M3 平台/基建


```status
phase: merged
branch: —
head: —
std: STD-UPG-104-v1
delivery_id: —
designer: 设计 v3/v3.1 全量保留归本单；待 UPG-46 段①
dev: —
inspector: —
merge: 合 main后拆派单）
actor: sys04-backfill
updated_at: 2026-09-05T08:41:58
```

**状态**：📌 **挂单·待 UPG-46 交付后启动 @2026-09-04**（UPG-46 瘦身重派定案时转出段②——设计 v3/v3.1 全量保留归本单；待 UPG-46 段①合 main 后拆派单）｜ **优先级**：P2

## 标题

Tool Orchestration 段②：六指标评测集（Selection/Argument/No-Call P&R/Multi-Tool/Safety Gate）+ Safety Policy 确认门实现（L0-L3）+ 多工具编排补强（Parallel/Sequential/Conditional）+ 记忆回流=候选（工具结果≠偏好）

## 背景

UPG-46 原方案 v3 定稿（大神 9.3+Trace 契约）范围较宽，长期无人认领。用户 2026-09-04 拍板「建议瘦身转派」→ **段①**（联动机制+Trace+接线+契约语义=UPG-46 本单）；**段②**（本单）：评测集/安全门/编排/记忆回流——设计权引用 v3/v3.1 全量文档，实现依赖段① Trace 数据。

## 范围

- A1：六指标评测集（N 个典型输入→期望决策；含 NO_CALL/MULTI_CALL/边界——回归防退化）
- A2：Safety Policy 确认门（L0-L3→确认门；L2/L3 必进；own 分类器兜底）
- A3：多工具编排（Parallel/Sequential/Conditional——v3 契约表）补强
- A4：记忆回流=候选（工具结果≠偏好；经记忆写链路）

## 验收锚

- 段① 合 main 后，本卡按 UPG-46 STD（六指标）+ 本卡 A1-A4 拆 STD-UPG-104-v1（届时定稿）
- P&R 指标确定性：评测集全绿；门：L2/L3 必进（变异亲杀）；编排契约锚；记忆回流只写候选

## 不做

- 不重复段①（Trace 数据源复用）；不动审批闸语义；不加 UI（确认门先用现有审批/弹窗通道）

**红线**：NO_CALL 合法；参数阻断四类；Trace 不存 CoT；记忆回流=候选不自动晋升

**交付**：卡：UPG-104（待拆派单时更新 STD/派单文）；STD：STD-UPG-102-v1

---

# UPG-105 MOV 官网·容器面（给 AI 读）建设
**分类**：M4 工具/MCP ｜ 标签：M3 平台/基建、M8 UI/交互


```status
phase: merged
branch: feat/upg105
head: 841f591d
std: —
delivery_id: DEL-UPG105-20260904-001
designer: 📌 **已立卡·待派 @2026-09-04**（设计 v3 定稿：`设计师/方案设计/工单方案/官网容器面_给AI看内容_设计_v3_2
dev: ✅**C 完成 @2026-09-04**（feat/upg105 **841f591d** 已 push origin，基 main c5
inspector: ✅ **验收员复验 通过 @2026-09-04**（ACCEPTANCE_LOG §P55：841f591d 隔离 worktree｜全量
merge: ✅ **已合 main @2026-09-04**（设计师 ff `c5bb94af..841f591d` 已推 origin；批二即 UP
actor: sys04-backfill
updated_at: 2026-09-05T08:41:58
```

**状态**：📌 **已立卡·待派 @2026-09-04**（设计 v3 定稿：`设计师/方案设计/工单方案/官网容器面_给AI看内容_设计_v3_2026-09-04.md`——采纳大神评审 8 条 + **空白 AI 读取验收判据**（§8：10 问 ≥9 命中 / 零容忍 0 违规）；v1=`WebMCP接入_MOV网站容器面设计_2026-08-29.md`）→ 🔨 **批一（内容层）已派 @2026-09-04**（`设计师/派单/UPG-105_官网容器面_批一内容层_派单_2026-09-04.md`——5 项范围+验收+红线；批二（A 通道）随批一完成后拆）｜ **优先级**：P1 ｜ **出单人**：设计师 → ✅ **验收员复验 通过 @2026-09-04**（ACCEPTANCE_LOG §P55：841f591d 隔离 worktree——全量 814/0/1 亲跑一致+ContainerContentContractTest 5/0 确认+**同源核对亲测零编造兑现**[registry 4 能力全在 llms+负例双零]+备案/版本戳/10 页索引实锤；L2 CDP 注入出卡走查=持有[homeWeb 接线批联动]；**达待合→审验员→设计师**；⚠️ P3×2 补档[交付报告缺失→程序员/交付报告/DELIVERY_UPG105_批一_内容层_2026-09-04.md 补档；证据目录缺失→§P55 注明+可重跑补证]）→ ✅ **已合 main @2026-09-04**（设计师 ff `c5bb94af..841f591d` 已推 origin；批二即 UPG-106 待拆）｜ ✅ **P3×2 补档闭环 @2026-09-05（设计师）**：①交付报告补档已落盘（`程序员/交付报告/DELIVERY_UPG105_批一_内容层_2026-09-04.md`，审验员查验时点未落盘、当日 00:25 补齐，验收后补档口径已如实标注）②证据目录缺口走**补跑留证**——设计师干净隔离 worktree（detached @841f591d 零改动）亲跑 `:app:testDebugUnitTest` 复现 **114 套件 814/0/1**（含 ContainerContentContractTest 契约锚 5/0），XML×114 落 `设计师/检查证据/UPG-105_补证_2026-09-05/`（设计侧补证非验收员原件，证据归属红线 14；§P55 落档在 feat/upg50-ph1 他线分支不便追加，注明以本卡+补证 README 为准）
→ ✅**C 完成 @2026-09-04**（feat/upg105 **841f591d** 已 push origin，基 main c5bb94af[ICP 合规已合]；**批一内容层 5 项全交**：①**llms.txt**[capability-registry.json 同源生成——4 能力按域分组+10 页索引附录+registry_version 验证戳+六工具端点+市场诚实空态[MVP 0 包]] ②**JSON-LD**[10 页 schema.org WebSite/ItemList/SoftwareApplication——禁整体自定义 mov:Capability] ③**sitemap.xml**[11 URL=10 页+llms.txt] ④**六工具 schema**[mov_site_info/capabilities/tools/search/market_catalog/guide——四要素齐全（用途/输入/输出/边界）+验证戳 registry_version+last_sync_time] ⑤**验证戳**[sync-manifest.json 同源 sha256]；**契约锚 5/5**[llms 同源零编造[Q5/Q6 负例 PASS]/sitemap 11 URL/JSON-LD schema.org/六工具四要素/UPG-94 共存]；全量 **114 套件 814/0/1 全绿**[809[U102]+5[UPG-105 契约]=814]；**同源核对**[Q5/Q6 负例 PASS=零编造——无 mcp_postgres/微信支付等虚构条目；诚实空态=市场 0 包如实]；真机 CDP 注入出卡走查**转验收员持有**[coverage PARTIAL——batch 1 无 agent chunk 接线同 UPG-89/96 口径]；Token/KV 0/0[纯生成器+静态文件]；DEL-UPG105-20260904-001[code=841f591d/artifact=a2e280a2/manifest 见案]；报告 DELIVERY_UPG105_批一_内容层_2026-09-04.md；**已登记两个表**）——待验收员验收（L1+变异复杀+空白 AI 十问[设计师/验收员持有]+合后 verify-hash 终态复核）
→ ✅**C 完成 @2026-09-04**（feat/upg105 **841f591d** 已 push origin，基 main c5bb94af[ICP 合规已合]；**批一内容层 5 项全交**：①**llms.txt**[capability-registry.json 同源生成——4 能力按域分组[fulfill 2/settle 1/sense 1]+10 页索引附录+registry_version 验证戳+六工具端点+市场诚实空态[MVP 0 包] ②**JSON-LD**[10 页 schema.org WebSite/ItemList/SoftwareApplication——禁整体自定义 mov:Capability] ③**sitemap.xml**[11 URL=10 页+llms.txt] ④**六工具 schema**[mov_site_info/capabilities/tools/search/market_catalog/guide——四要素齐全（用途/输入/输出/边界）+验证戳] ⑤**验证戳**[registry_version=时间戳+sync-manifest 同源 sha256]；**契约锚 5/5**[llms 同源零编造/sitemap 11 URL/JSON-LD schema.org/六工具四要素/UPG-94 共存]；全量 **114 套件 814/0/1 全绿**[809[U102]+5[UPG-105 契约]=814]；**同源核对**[Q5/Q6 负例 PASS=零编造——无 mcp_postgres/微信支付等虚构条目]；**真机 CDP 注入出卡走查转验收员持有**[coverage PARTIAL——batch 1 无 agent chunk 接线同 UPG-89/96 口径]；Token/KV 0/0[纯生成器+静态文件]；DEL-UPG105-20260904-001[code=841f591d/artifact=a2e280a2/manifest 见案]；报告 DELIVERY_UPG105_批一_内容层_2026-09-04.md；**已登记两个表**）——待验收员验收（L1+变异复杀+空白 AI 十问[设计师/验收员持有]+合后 verify-hash 终态复核）

## 标题
mov-ai.cn 容器面（给 AI 读）：llms.txt 能力级 + JSON-LD（schema.org）+ mov_* 六只读工具（description 四要素）+ 验证戳 + SEO 衬底——**以「空白 AI 读取」为验收目标**

## 背景
前因=用户 08-29 方向「官网既能给人看、也能给 AI 用」→ 能力市场 web 化 → 容器面（发现/理解/使用三层）；v2 给大神评审（方向 9/架构 9/安全 9/落地 6/文档 8）→ v3 采纳 8 条（能力级 llms.txt / schema.org 策略 / description 四要素 / 验证戳 / 缓存限流 / install_url / SEO 衬底）；**终极验收**=零先验 AI 读完官网 10 问 ≥9 命中+零编造+零越权（v3 §8 作为交付硬判据）。

## 范围
- **一批（内容层）**：①`llms.txt`（能力级主体+页面索引附录；同源注册中心生成）②每页 JSON-LD（schema.org 优先+`mov:*` @context 扩展）③`sitemap.xml`+语义化 HTML 核查（SEO 衬底）④六工具（mov_site_info/mov_capabilities/mov_tools/mov_search/mov_market_catalog/mov_guide）schema+**description 四要素**（v3 §4.4 细则定稿）
- **二批（A 通道）**：MCP Streamable HTTP（2026-07-28）端点 + 验证戳（registry_version/last_sync_time）+ CDN 静态缓存 5min + UA 约定（MOV-AI-Client/1.0）+ 限流锚（IP+UA）
- 串行：一批→二批（二批依赖一批内容就绪）

## 不做
- 不做 B 通道（App 内 WebMcpHub——依赖 UPG-69 契约冻结后另立）
- 不开放敏感/上下文工具（A 面=公开六只读；敏感仅 B）
- 不写市场状态/不落库；AI 不代装（install_url=人操作界面）

**红线**：只读；同源（注册中心唯一真相）；诚实空态（无=「暂无」不编造）；无敏感泄露；工程版=验证版；**空白 AI 10 问 ≥9 命中 + 零容忍 0 违规**（上生产硬判据）

**交付**：卡：UPG-105（待拆批一/批二派单时更新 STD/派单文）；STD：基础判据=v3 §8（正式 STD 随批冻结）


# UPG-106 数字人体 V1（2D 全身部位图 + 健身挂点）

**分类**：M8 UI/交互 ｜ 标签：M4 工具/MCP、M2 体系/治理


```status
phase: registered
branch: —
head: —
std: —
delivery_id: —
designer: ✅ **大神评审通过 8.8/10（有条件）@2026-09-05 → v2.1 冻结稿已出**：`人体载体/数字人体_融入MOV架构_评审
dev: —
inspector: —
merge: —
actor: sys04-backfill
updated_at: 2026-09-05T08:41:58
```

**状态**：⏳ **挂单·待大神评审后拆派 @2026-09-05** → ⚡ **2026-09-05 用户再拍板：直接 3D**（「2D 的体验不好，要么就直接 3D」；技术栈=Web Vue+Three.js+独立 Web 页先行；AI 接入=人脸照片+身高/体重/围度自动生成人体，换装点击即换）→ 📋 **架构评审稿已出**：`人体载体/数字人体_融入MOV架构_评审稿_2026-09-05.md`（与 MOV 契合度审查+合规红线+三阶段路线——**待大神评审后定稿拆派**；动工前置：U此前源代码树 UPG-91 冲突先清）→ 📋 **评审稿 v2 @2026-09-05**：`人体载体/数字人体_融入MOV架构_评审稿_v2_2026-09-05.md`（v1 存档留底——v2 变更：全开源栈弃 RPM SaaS+**AI 分层职责章**[AI 只理解推荐/确定性系统存储执行]+衣柜资产管线[Hunyuan3D+UniRig]+MakeHuman 输出 CC0 销项+分层溯源图；决策点收敛为 3 个——大神评审后定稿拆派）→ ✅ **大神评审通过 8.8/10（有条件）@2026-09-05 → v2.1 冻结稿已出**：`人体载体/数字人体_融入MOV架构_评审稿_v2.1_2026-09-05.md`——3 P0+1 P1 全部采纳（BodyAnchorRegistry 升核心基础契约 §五之二/拼接 Spike 改多样本自动化验收[5 输入→5 可运行模型，人工调参=失败]/新增阶段 0 先冻结 Registry v0/新增 HumanAssetManifest 资产兼容契约 §五之三）；战略建议采纳：契约层按可泛化 Spatial Entity Runtime 设计——**评审闭环，待用户拍板后拆派单（阶段 0 地基 Spike 先行）**

## 标题
一张与用户等比例（体型参数后置）的 2D 全身正面人形图；裸态=人体结构体（点击部位→该部位锻炼内容与方式），穿态=衣柜载体（衣服穿在人身上，点击可看/通电商）

## 背景
用户构想（2026-09-05）：数字人体=「界面本体」——衣服去掉=人体结构体（部位可点击），套上衣服=衣柜载体；每个部位是商业挂点（健身→健身房、头发→理发店、衣服→电商商家）——与 MOV 「线是活的通道/注册能力」哲学同构

## 范围（V1 MVP）
- **人形**：2D SVG 全身正面（中性款，男女不分；前后视/体型参数后置）
- **裸态**：部位热区 10-14 肌群（胸/肩/背/腹/臂/腿/臀等），点击→锻炼列表
- **动作数据**：free-exercise-db（876 条 Unlicense）——V1 译中文常用 100 条（名称/要领/组次数）
- **穿态**：4-6 槽位（上装/下装/鞋/发型/配饰），点击看衣物信息
- **交互**：点部位/点衣服/脱穿切换（三动作）

## 后置（不属 V1）
- 商业挂点协议（部位→商家注册，独立契约——健身/理发/电商接通）
- 3D 模型、体型参数联动、多视图
- 完整 876 条翻译、男女双模

## 验收（V1 判据）
- V1-1 人形图渲染正常，10-14 部位热区可点击
- V1-2 点击部位出中文动作列表（名称+要领+组次数）
- V1-3 穿态切换正常，槽位显示衣物，点击出衣物信息
- V1-4 数据本地 JSON，无网络依赖

**派生讨论（未立项）**：部位区域注册表（健身/理发/服装域对「部位」定义不同）+ 商业挂点协议 + 体型/打卡联动

---

# UPG-107 Memory OS 类型化 payload（Semantic 池子结构化演进）
**分类**：M6 记忆/知识 ｜ 标签：M2 体系/治理


```status
phase: merged
branch: feat/upg107
head: 31640fc8
std: STD-UPG-107-v1
delivery_id: DEL-UPG107-20260905-001
designer: 裁决位]；DEL-UPG107-20260905-001[code=31640fc8/artifact=fc07ee63/manifest=
dev: ✅**C 完成 @2026-09-05**（feat/upg107 **31640fc8** 已 push origin[origin=gi
inspector: 审验ok:true]/报告=程序员/交付报告/DELIVERY_UPG107_2026-09-05.md｜状态区投影锚+交付段详）
merge: 已合 main @31640fc8（ff-only；P 段数 56→56 无丢失；验收+审验全链闭环）
actor: 设计师
updated_at: 2026-09-05T09:26:33
```

**状态**：📌 **已立卡·已派 @2026-09-05**（设计：`设计师/方案设计/04_记忆/Memory_OS_类型化payload_设计_v1_2026-09-05.md`[v2 冻结补丁]；验收脚本独立成文：`Memory_OS_类型化payload_验收脚本_v1_2026-09-05.md`；派单 `设计师/派单/UPG-107_记忆类型化payload_派单_2026-09-05.md`；**STD-UPG-107-v1 已冻结** sha=23573610；已查坑位库/复用件库：是——命中坑#6[0测试假绿]/坑#8[瞬态UI录屏法]已写入验收脚本，复用件无域内命中）｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-09-05 → ✅ **验收员复验 通过 @2026-09-04**（ACCEPTANCE_LOG §P58：**真交付=d77dae2a**[申报 cfa7d607 sha 错误 P3]隔离 worktree[E 仓]——全量 app 842/0/1+memory-os 46/0 亲跑+**变异 M1/M2/M3 亲杀**[ACTIVE 直写红/降级改抛红/字段比对删除 2 红→还原]+L3 memory-api 零改 git 实证+L2 CleanVM 落盘铁证采信[ledger 14 条+payload 键值精确+决策 once 人话卡]；验收员模拟器复现受阻如实[呈现通道跨单 P3]；**达待合→审验员→设计师**）
→ 🆕 **已认领 @2026-09-05**（程序员 Claude/wmw0027，worktree mov-upg107，branch feat/upg107，基 origin/main 97d7ca31[UPG-103 已合]；按设计 v1 §二/§三施工四件：SemanticEntry payload/payloadVersion 可选字段+六类模板注册表+LLM 抽取校验闸降级路径+池子管理三操作升级——红线五条在案，3 变异锚亲杀+真机 5 场景）
→ 🔗 **DEL 绑定=DEL-UPG107-20260905-001**（code=31640fc8/artifact=fc07ee63[APK 56366480B]/manifest=delivery_UPG107_manifest.json[审验 ok:true]/报告=程序员/交付报告/DELIVERY_UPG107_2026-09-05.md——状态区投影锚+交付段详）
→ ✅**C 完成 @2026-09-05**（feat/upg107 **31640fc8** 已 push origin[origin=git@github.com:onlywmw/0027-mov]，基 main 97d7ca31；**四件全交**：①SemanticEntry +payload/payloadVersion 可选字段[尾部默认参数零破坏，null=纯文本一等公民] ②PayloadTemplates 六类模板注册表[键集合精确校验——缺项/超项/未知 type/空值皆拒] ③PayloadExtractor LLM 注入回调+校验闸+**降级路径**[超枚举/坏JSON/LLM null/异常 4 case 全降级不阻塞；EXTRACTED_STATUS 恒 PROPOSED——M1 锚点] ④池子管理三操作[dedupCandidates 同型同 payload 候选/payloadConflicts 字段级互斥 PREFERENCE 同场景异取向+FACT 同主体谓词异值+HABIT 频率矛盾→diagnose 并入 RE_EVALUATE 不自动归档/mergeProposal+applyMerge 双来源链保留+吸收方 ARCHIVED]+updatePayload 主权面[ARCHIVED 禁改]+identityDimensions 画像投影+Store 序列化往返[旧格式兼容]；**变异 3 锚亲杀**[M1→红1/M2→红1/M3→红2 还原复绿]；**验收脚本八步**全过[基线 34/0/0+842/0/1→终态 **46/0/0+842/0/1**——UPG-52 既有 27 用例零退化]；**真机 5 场景**[CleanVM 真审批链：人话卡「对记忆池做一次结构化整理演示」→决策 once→落盘 6 条目[PROPOSED×2/RE_EVALUATE×2 不自动归档/ACTIVE/降级纯文本]+payload 键值精确+ledger 14 条含 updatePayload——semanticList/dedup/conflicts/identityDims 四查询 handler+payloadRun 验证通道接 tools/；**60s 超时声明**[多条 write+全量重写超 20s 兜底实测]]；**契约面**：memory-api 0 diff+MainActivity 0 diff+ToolsSplit 冻结基线 172→176 显式增量[regen93.py 重算 UPG-98 先例]+categories.json+4+ApprovalLogic 人话+4[UPG-53 全覆盖口径 ExperienceTest 绿]；Token 0 增量[LLM 注入回调+演示态确定性草案——生产接线单届时报 ≈230B/条]+KV 0；coverage **PARTIAL**[代码+变异+真机落盘 FULL；记忆页 Vue payload 可视化 UI 留接缝——设计师裁决位]；DEL-UPG107-20260905-001[code=31640fc8/artifact=fc07ee63/manifest=delivery_UPG107_manifest.json 审验 ok:true/verify-hash not-ancestor 未合常态+分支头人工核等效申报]；报告 DELIVERY_UPG107_2026-09-05.md；**已登记两个表**）——待验收员验收（L1 复核+变异复杀+真机 5 场景采信+合后 verify-hash 终态复核）
## 标题
Semantic 池子结构化演进：SemanticEntry 加可选 payload 字段（六类模板），池子管理（去重/冲突/合并/画像对齐）从「猜」变「算」——content 双轨保留，抽取失败安全降级。

## 施工（照设计 v1 §二/§三）
1. SemanticEntry 扩展 `payload: Map<String,String>?` + `payloadVersion`（可选，null=纯文本一等公民）；
2. 六类模板注册表（PREFERENCE/HABIT/FACT/IDENTITY/RELATION/PROGRESS）；
3. LLM 抽取+字段校验闸（草案→PROPOSED，超枚举拒绝，失败降级纯文本）；
4. 池子管理三操作升级（去重/冲突/合并候选——人裁决）。

## 红线
payload 永不直写 ACTIVE（走既有四态状态机）；校验失败=降级不报错；模板演进只加不改（payloadVersion 追溯）；UPG-52 既有 27 用例+打点链零退化；五条 P0 不破。

## 验收
STD-UPG-107-v1（=验收脚本八步：基线/L1 结构面/AI 闸门/3 变异锚亲杀/回归/真机 5 场景/契约面/证据收口；一票否决 6 条）。

## 派单交接段
认领 worktree=mov-upg107 branch=feat/upg107（基于最新 origin/main，开工前必 git fetch）；完成后登记两个表（先表后库）；报告 `程序员\交付报告\DELIVERY_UPG107_*.md` 写明「已登记两表」+hash+Token/KV 两节（payload 抽取走 LLM 通道必须申报）+《共享面影响清单》（SemanticEntry=全局数据结构）；manifest 用 `审验员\deliver-gen.mjs` 机制产出+`审验.py --verify-hash` HASH_OK 再登记。

---

# UPG-108 手机即服务器·官网用户面（扫码配对 + 手机内容投影上站）
**分类**：M4 工具/MCP ｜ 标签：M2 体系/治理、M3 平台/基建


```status
phase: registered
branch: —
head: —
std: —
delivery_id: —
designer: —
dev: —
inspector: —
merge: —
actor: 设计师
updated_at: 2026-09-05T09:10:14
```

**状态**：📌 **已立卡 @2026-09-05**（用户拍板官网双层设计：层 1=AI 面[容器面，UPG-105 线]；层 2=用户面[本卡]——**用户登入官网看到的信息来自用户自己的手机，MOV 服务器零存储**；与 vault「数据不出设备」哲学同构）｜ **优先级**：P1 ｜ **出单人**：设计师 ｜ **日期**：2026-09-05

## 标题
官网用户面：用户扫码登录 mov-ai.cn 后，网站内容由其手机上的 MOV App 实时供给（手机=个人服务器，网站=窗口，MOV 服务器只做信令/中继不落地）。

## 背景
官网=AI 和人共用的站（用户原话）：AI agent 直接连接了解 MOV（层 1 已有）；用户登入后网站与手机 App 信息同步——**同步不由 MOV 服务器保存用户信息实现，而是用户手机作为服务器给网站提供内容**。实物底子：App 已有本机 MCP server（:8389）+ 记忆/资产/画像数据全在本机（InfoVault/Memory OS/AssetRegistry）。

## 通道选型（比选结论，阶段 1 先行）
| 通道 | 原理 | 优劣 | 结论 |
|---|---|---|---|
| 同 LAN 直连 | 浏览器→http://手机IP:8389 | 零基建即刻 demo；仅限同网 | **阶段 1 demo 用** |
| WebRTC P2P | 扫码配对→信令→浏览器↔手机点对点 | 服务器零数据接触；需 STUN/弱网 TURN 兜底 | **阶段 2 主推** |
| E2E 加密中继 | 服务器转发密文 | NAT 穿透最稳；服务器经手密文（零知识） | 阶段 2 兜底通道 |

## 范围（阶段拆分）
- 阶段 1（demo）：扫码配对（手机 App 扫官网二维码建立会话）+ LAN 直连 + **只读投影**（记忆条目/资产清单/画像摘要三选二上站）
- 阶段 2：WebRTC P2P 上公网 + E2E 加密 + 断线重连 + 中继兜底
- 阶段 3：官网登录态=配对关系（账号体系与配对绑定）；写操作（如站点操作回写手机）另评
- **不做**：MOV 服务器不落任何用户内容（含缓存）；第三方登录 OAuth 不做

## 红线
用户内容零服务端存储（中继只转发密文）；配对=显式用户动作（扫码确认）；通道断开=网站显示离线态不显示陈旧缓存冒充在线；phone 侧供给走审批门（写类操作必过闸）。

## 验收思路
L1：配对/通道/投影单测；L2 真机：扫码→网站显示手机实时内容→手机断网→网站离线态；L3：服务器侧零存储审计（中继日志无内容明文）+ 重建配对安全（换浏览器需重新扫码）。

## 派单交接段
待出派单文+STD（设计先于 43a 同族 WebMCP 契约对齐）；认领 worktree=mov-upg108 branch=feat/upg108。

---

# UPG-109 第三方站 WebMCP 接入性扫描（agent 浏览器前置探测）
**分类**：M4 工具/MCP ｜ 标签：M6 架构


```status
phase: registered
branch: —
head: —
std: —
delivery_id: —
designer: —
dev: —
inspector: —
merge: —
actor: 设计师
updated_at: 2026-09-05T09:10:21
```

**状态**：📌 **已立卡 @2026-09-05**（用户拍板：「WebMCP 是我们对外的名片，也是探索外面网站的尝试」——MOV agent 用浏览器访问网站时**先扫描该站可否接入改造**，可改就就地桥接，提升 AI 对第三方站的操控）｜ **优先级**：P2 ｜ **出单人**：设计师 ｜ **日期**：2026-09-05

## 标题
浏览器侧前置扫描器：访问任意站点 → 探测 WebMCP 接入性 → 三档判定 → 可接入则经 UPG-43a Hub 就地桥接。

## 背景
43a（App 内浏览器 WebMCP Hub）已合 main——它能消费「已改造站点」，但「哪些站可改造/怎么改」目前是人工挑站（UPG-69 模式）。本单把挑选机器化：扫描→判定→接入建议，是对外探索的探针。

## 范围
1. **探测面**：站点是否自带 WebMCP 接口（window.mov_webApi 类登记/W3C webmcp 标准物）/ llms.txt/.well-known/AI 容器面；
2. **可注入性判定**：CSP 强度/页面框架（Vue/React/静态）/关键操作的 DOM 可定位性；
3. **三档判定**：A 原生支持（直接用）/ B 可注入改造（经 43a Hub 桥接，附改造建议清单）/ C 不可改造（只读浏览）；
4. **判定报告**：扫描结果落 journal+卡片投影（UPG-40 视觉纪律：AI 动作用户可见）。
- **不做**：不自动改造第三方站（判定≠动手；注入改造需用户确认+域名级授权）；不绕反爬/验证码/登录墙。

## 红线
探测只读零副作用；第三方站注入改造必须用户显式授权（域名级，审批门）；判定报告诚实（不确定=C 档不硬报 B）。

## 验收思路
L1：三档判定用例集（自建三类型测试站）；L2 真机：mov-ai.cn（A 档）/一个开源站（B/C）；变异：探测逻辑删一档→红。

## 派单交接段
待出派单文+STD；认领 worktree=mov-upg109 branch=feat/upg109；前置=43a Hub（已在 main）。
