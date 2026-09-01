# DELIVERY_UPG08_R2 — 验收带缺陷小修（2026-08-26）

> 程序员 C ｜ 分支 `feat/upg08` ｜ 提交 `32564fd`（基底 848b11a）
> 对应验收：R1 复验 ✅ 通过（带缺陷 2 项）→ 本单修 P3（P2 已由验收员代纠正，线上核实一致）
> 规则 18 声明：演示数据已还原且生产态已复核（本单部署后 17907B 同步产物再经真实工单表 sync --deploy）

---

## 缺陷（P3，随 R2 小修）——fallback 链报告虚标

- **现象**：R1 报告 P2-1 声称「前端 fallback 链 workbench.json → workbench.sample.json → SAMPLE」，但 `workbench.sample.json` 在 app.js 未接线（grep 仅 sync 命中；线上仍 404→SAMPLE 一步兜底）。
- **根因**：R1 修复 SAMPLE 结构时只产出 `--sample` 文件并写了报告声明，未同步修改 loadData 的兜底链；功能不受影响（SAMPLE 兜底可用），属文档/代码不一致。
- **修法**：
  1. `app.js` loadData 改三级 fallback：`workbench.json` → `workbench.sample.json` → `SAMPLE`（tryFetch 守卫结构，任一层 bad shape 继续下探）；
  2. `tools/verify-workbench.mjs` 增强制断言：app.js/index.html 必须含 `workbench.sample.json`（防报告虚标回归，变异删链接必红）；
  3. 报告声明与代码一致（本报告即修正版）。
- **复验**：
  - `node tools/verify-workbench.mjs .` 全绿（含新 P3 断言）；
  - 断 JSON 真实行为（vm：仅断 workbench.json，/me 正常）→ 二级 fallback → 无 undefined 标题（R1 L2_06 同场景复测通过）；
  - 线上 md5 一致性：app.js 重新 scp 部署 + sync --deploy（json 重新生成，与工单表状态一致）。

## 复验判据三项（延续 R1，均通过）

1. ✅ 干净环境缺依赖 → exit≠0（R1 FAIL-LOUD，未回归）
2. ✅ 生成 json 中挂账（3）/验收记录（13）非空
3. ✅ verify 删 renderTree / 删 json 节点必红（R1 变异亲杀未回归）

## 登记

- 工单表.xlsx 第 9 行：程序员列 `✅R2 修复完成`；备注 `feat/upg08 32564fd（报告 DELIVERY_UPG08_R2_2026-08-26.md）`
- 工单库.md UPG-08 状态：「程序员✅修复完成，待复验」
- 已推送 origin（feat/upg08 @ 32564fd）
