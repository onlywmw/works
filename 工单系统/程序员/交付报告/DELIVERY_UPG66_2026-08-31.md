# DELIVERY_UPG66 A-3 Judge 扩面（三类判定+对拍反哺经审核事件）

**程序员 C @2026-08-31** ｜ 分支 `feat/upg66`（**1e604c7**，含 0438049 主体+b6685e9 边界修正+registry 同步）｜ 基线 main 2b1bb00 ｜ worktree `mov-upg66`
**已登记两个表**（工单表 UPG-66 行 + 工单库）。

## 四项施工范围

1. **三类判定**（A3-1）：`JudgeModes`（guard）——expected **前缀模式语法**（「数值：42」→numeric 存在相等数值即 pass/「枚举：A|B|C」→enum 含任一项 pass/「包含：关键句」→contains/无前缀=exact B1 兼容零破坏）+ `AcceptanceJudge.judge(produced, expected, mode)` 重载（既有 judge 保留转发——B1 调用零破坏）；**各 ≥1 正例+1 反例**全验；**判否同样落 journal**（AgentLoop verdict 事件既有链锚——fail 也是数据）
2. **触发降级语义保持**（A3-2）：extractCriteria 只有无核对动词/无标准短语/疑问词才 null——**模式前缀空 body（「数值：」无实质）新增诚实降级**（UPG-61 同款）；既有降级语义回归锚
3. **观察层语义回归**（A3-3）：AgentLoop :536 judge 调用**传 lastCriteria.mode**（verdict 事件 mode 字段既有）——不拦截/不重试/不进模型上下文语义零破坏；源码锚（judge 传 mode+verdict 事件含 mode+criteria.expected 不进上下文）+既有 AcceptanceJudgeTest/AgentLoopE2ETest 全绿
4. **反哺管道**（A3-4，§6.4 B/A 边界铁律）：`ReplayFeed`——对拍失败 `propose`（**PROPOSED 队列 queued.jsonl 幂等**——同 turn 同 expected 去重；**不直接进门 2 回归集**）→ 人工审核 `accept`（ACCEPTED 条目文件 docs 形态**可审计溯源**）→ 进入 fixture 维护流程（EvalFixture 升版走 UPG-56 机制，无例外）

## 验证

- **L1**：app **76 类 533/0/1**（registry 同步后）+ memory-os 34/0/0 + tool-orch 37/0/0（--rerun-tasks）+ 既有 AcceptanceJudgeTest/AgentLoopE2ETest 全绿（观察层语义回归 A3-3）
- **红线自查**：观察层语义不破 ✓（AgentLoop 一行 mode 贯通——只改判定入参不拦不重试）/ 反哺必经审核事件（V-3）✓（propose=PROPOSED 队列/accept=人工）
- **边界修正**：ReplayFeed 初版误引 memory-core JsonMini——**UPG-48 呈现层零触 memory-core 红线**（MemoryDependencyBoundaryTest 抓住）→ 本地正则解析修正（parse 完整重写）
- **memory-os 增强**：TimelineLedger.append **单调时间戳**（同毫秒多事件严格 +1——X1-2 flaky 根修，事件链排序确定性；append-only 不破）

## 登记

- 工单表 UPG-66 行：`✅C 完成`+备注（feat/upg66 1e604c7+报告 DELIVERY_UPG66_2026-08-31.md）
- 工单库 UPG-66 状态：`程序员✅完成，待验收`

**待验收员**：A3-1 三类正反例复跑（含判否 journal 锚）+A3-2 降级回归+mode 贯通源码审查+A3-4 管道端到端（propose→accept→accepted 条目溯源）+UPG-48 边界复核（ReplayFeed 零 memory-core）+TimelineLedger 单调 ts 契约复核（57 交付物演进申报）。
