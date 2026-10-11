#!/usr/bin/env node
// card-clarity/gates/measure.mjs —— 渲染读数闸（对比度／溢出／触控尺寸）
//
// 用法：node measure.mjs --dom <render 产物 dom.json> [--json]
// 退出码：0=全过 ｜ 1=有超限 ｜ 2=用法错
// 判据（确定性）：M1 主行动按钮对比度 ≥4.5（WCAG AA 常规文本）｜M2 无横向溢出（截断）｜M3 触控尺寸 ≥24px（卡外 chrome 登记口径）
import fs from "node:fs";
const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? true) : d; };
const DOM = arg("--dom"); const JSON_OUT = argv.includes("--json");
if (!DOM) { console.error("用法：node measure.mjs --dom <dom.json> [--json]"); process.exit(2); }
const rows = JSON.parse(fs.readFileSync(DOM, "utf8"));
const bad = [];
for (const r of rows) {
  const v = [];
  if (!(r.ctaContrast >= 4.5)) v.push(`M1 对比度 ${r.ctaContrast} < 4.5`);
  if (r.overflow) v.push("M2 文本溢出");
  if (!r.touch?.ok) v.push(`M3 触控尺寸 ${r.touch?.w}×${r.touch?.h} < 24`);
  if (v.length) bad.push({ cardId: r.cardId, violations: v });
}
if (JSON_OUT) console.log(JSON.stringify({ total: rows.length, bad: bad.length, results: bad }, null, 2));
else { for (const b of bad) console.log(`❌ #${b.cardId} → ${b.violations.join("；")}`); console.log(`measure：${rows.length} 张，${bad.length} 超限（rc=${bad.length ? 1 : 0}）`); }
process.exit(bad.length ? 1 : 0);
