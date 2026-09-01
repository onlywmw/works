# DELIVERY_UPG63 第二阶段收口（Z-5 弹窗基线 + MULTI_CALL 分布 + M-1 真实重放补跑）

**程序员 C @2026-08-31** ｜ 分支 `feat/upg63`（**0580fa8**，含 2654b60 主体+registry 同步）｜ 基线 main 2b1bb00 ｜ worktree `mov-upg63`
**已登记两个表**（工单表 UPG-63 行 + 工单库）。

## 三项施工范围

1. **Z-5 弹窗基线**（V-7 防线，先于 C 线）：`C7BaselineGenerationTest`——**30 会话**（判据 ≥30）真实 `ApprovalService` 链路构造（answerer 自动应答 ALLOW_ONCE；only-once 工具 UPG-61 不吃豁免=计数真实）；场景分布 vault 写 20 弹/http 8/browser 6/mixed——**落档 `docs/c7_baseline_UPG63/`（30 jsonl+baseline_summary.md，含口径与构造方式声明）**；断言 ≥30 会话+场景分布锚
2. **C-6 MULTI_CALL 分布统计**：journal 口径统计（turns/multiCallTurns/ratePercent）+ **保守假设留痕**（C-6 判据：开发期样本不足按保守假设处理并留痕——不虚构覆盖率；真机历史 journal 不可得如实申报，构造样本为数据源）
3. **M-1 真实坏改动重放补跑**（消 P3-3 合成数据缺口）：`M1RealReplayTest`（tool-orch）——Z-3 五条**真改 EvalFixture 工具面数据走真实 orchestrate**：
   - Z3-1 ticket 触发词反写 → Selection 2 条翻转（c01/c11）→ 门 2 REJECT+方向一致 ✓
   - Z3-2 payment required 删除 → 校验行为差异可观测（单点 WATCH 语义如实记录）
   - Z3-3 message trigger 删「发消息」 → **c07 翻转（+1=WATCH）**——**元验证发现点：预登记方向 Selection↓ 成立，但单条翻转低于门 2 阈值（+≥2）→ PASS（WATCH）——阈值语义对齐如实记录**（c09 用「告知」仍命中——词面分析申报）
   - Z3-4 weather 词面污染 → c06 误触发抢占 ✓
   - Z3-5 口径漂移 → 56 版本守卫拦截复证 ✓

## 验证

- **L1**：app **76 类 526/0/1**（registry 同步后）+ tool-orch 6 类 42/0/0 + memory-os 34/0/0（--rerun-tasks）
- 红线：基线数据先于 C 线改动（V-7）✓ / 统计脚本只读 journal 禁改会话数据 ✓ / 模型假设注释 ✓（分布统计假设「历史 MULTI_CALL 样本代表未来」——样本不足保守假设留痕）

## 登记

- 工单表 UPG-63 行：`✅C 完成`+备注（feat/upg63 0580fa8+报告 DELIVERY_UPG63_2026-08-31.md）
- 工单库 UPG-63 状态：`程序员✅完成，待验收`
- **下游解锁**：UPG-64（Z-5 基线+MULTI_CALL 分布结论已产出）/UPG-60 后续批次（M-1 真实重放闭环）

**待验收员**：Z-5 落档数据抽查（30 会话 jsonl+汇总）+ M-1 五条真实重放复跑（含 Z3-3 阈值语义对齐点裁决：单条翻转 WATCH 是否需调阈值——留给 §十 升版流程）+ C-6 保守假设留痕审查。
