# DELIVERY_UPG22_R1 — 打回修复交付（2026-08-29）

> 程序员 C ｜ 分支 `feat/upg22` ｜ 提交 `09b9a79`（基底 aacb15b，已 push origin）｜ 报告四要素：现象 → 根因 → 修法 → 复验
> 已登记两个表：工单表.xlsx UPG-22 行（程序员 ✅C R1 完成 + 备注 hash）+ 工单库.md 状态同步（先表后库）

---

## L2 真机打点永不落盘（验收打回项，①一件）

- **现象**：新 session 发话两轮，journal `memory/ref = 0`、显化页 0/0 不动——打点接线被调（logcat `fp` 非空 `entries=2`）但永不落盘；对照组（源房间发话）链路其余部分完好。
- **根因（验收员精确定位，本单复核属实）**：**作用域错配**——cover entries 来自全局聚合（USER_GLOBAL 跨 session 投影），命中候选集却取 `session-local memoryDrafts()`（`journalView()` = 当前 session journal）——新 session 本地无 draft 候选为空 → `text.contains(d)` 零命中 → `recordCoverHits` 空转。aacb15b 的 instrumented 断言 A/B/C 全绿是因测试**同 session 先存记忆**恰好绕过盲区（测试设计盲区，非断言错误）。
- **修法（派单原文一句话：候选集改全局聚合视图）**：
  - `MemoryMcpTools` 增 `aggregatedJournalView(): MemoryJournal = AggregatedJournalView(aggregate(), journal)`——读侧 = 全局聚合投影（`AggregatedJournalView.memoryDrafts()` override 返回 `aggregation.all()`，候选集与 cover 同域），写侧 = 当前 session journal（ref 落当前 session，零旁路）；
  - `recordCoverHitForAssembly` 候选集切至该视图（`journalView()` → `aggregatedJournalView()`，一行）。
- **复验**：
  - **回归锚固化**：MemoryLinkInstrumentedTest 新增**断言 D（跨 session 盲区场景）**——session A 存记忆并落盘 → session B（本地零记忆，前置断言候选=0）装配 → cover 含全局条目 → ref 落 session B journal（source=cover、turnId=cover-<fp>）→ 聚合计数 ≥1。**该测试在 aacb15b（缺陷版）下必红，正好钉死验收员抓到的盲区。**
  - **变异 M3 亲杀**：候选集回退 `journalView()`（复现缺陷）→ 断言 D 必红 ✓（脚本化实跑 rc 直采）；还原后 instrumented 全绿 ✓。
  - **instrumented 6/6 真机 5556**：断言 A/B/C/D 全过（真实 JSONL 落盘路径）。
  - **L1 全量 51 类 363/0/0 + 1 跳过**（rm -rf 强制重跑 XML 逐件统计）+ assembleDebug 绿。
  - **免全量复验口径（派单原文）**：验收员仅复验 L2 三连 + L1 全量。

## 红线复核

- 编译+全量绿后报 hash ✓；CRLF 纯净（file 验证）✓；打点仍走 journal 唯一写点（AggregatedJournalView 写侧代理当前 session，零旁路）✓；无演示数据 ✓；回滚 = revert 单 commit ✓。
- 本单 R1 为一行语义修正 + 回归测试，diff 3 文件 +69/-1。

## 交付物

| 项 | 值 |
|---|---|
| 分支 / hash | `feat/upg22` / `09b9a79`（push origin ✓，aacb15b..09b9a79） |
| 改动面 | MainActivity.kt（候选集切换+注释）/ MemoryMcpTools.kt（aggregatedJournalView）/ MemoryLinkInstrumentedTest.kt（断言 D） |
| 报告 | 本文件 `程序员\交付报告\DELIVERY_UPG22_R1_2026-08-29.md` |
