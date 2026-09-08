# SYS-10 批① 续作交底（上下文接续用）

## 已完成
- lib/status-registry.mjs ✓ / lib/canonical-card.schema.json ✓ / lib/parse-card.mjs ✓（含 statusText 字段）
- orders-overview.mjs 已切 lib 委托（self-test 15/15 绿）；maxDate 日期工具已回填（V8 不拦）

## 待做（按序）
1. sync-orders.mjs：parseLib 改用 lib（parseStatusBlock 函数 111-124 行删、```status 正则 319 行删、**状态** grep 139 行删）；其 segments/pick 角色列已由 lib roles 提供——保持 rows C-I 输出形态
2. card-phase-audit.cjs：```status kv 解析（39-47 行）→ dynamic import("../lib/parse-card.mjs")（.cjs 用 await import，全脚本包 async IIFE）；消费 canonical.phase/head/branch
3. aggregate-overview.mjs：ST_RE(90)/自有 stage 词表(14-32) → lib parseLib + stageLabel
4. lib/self-test.mjs：单测（有块/无块/坏块/CRLF）+ V3 四工具交叉对拍 0 差异 + V6 parseLib 100 次确定性 + V8 四工具静态检查（grep 禁 ```status/**状态** 私有正则）
5. 交付：DEL-SYS10B1-20260908-001（deliver-gen）+ 报告→审验员\交付报告\ + 工单库.md SYS-10 卡 status 块登记（只改块）

## 验证命令
- cd 安卓中国体系建设 && node 审验员/orders-overview.mjs --self-test（15/15 绿）
- node 审验员/lib/self-test.mjs（批①完成后）
- V8: grep -n '```status\|\*\*状态\*\*' 审验员/sync-orders.mjs orders-overview.mjs aggregate-overview.mjs card-phase-audit.cjs → 0 命中（lib 除外）
