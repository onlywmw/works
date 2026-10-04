#!/usr/bin/env node
// SYS-91 窗口计数（只读）：行数 / 事件分类 / 合成标记数。
// 用法：
//   node 日志窗口计数.mjs [--file 巡铃.log|故障.log] [--range 2791-2801] [--date 2026-09-26] [--json]
// 口径（验收员 2026-09-25 更正件）：
//   - 窗口取数一律按【文件序行号区间】（--range）；按日期（--date）仅对新格式行（[YYYY-MM-DD ...]）有效；
//   - 历史无日期前缀行=legacy：按日期过滤时显式提示并排除（其定位请用 --range）；
//   - 合成行=行尾带 `#合成` 标记；净 = 行数 - 合成数。
// 判据例：--range 2791-2801 → 11 行 · 派活 6 · 合成 5（=净 6）。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf("--" + name); return i >= 0 && args[i + 1] ? args[i + 1] : def; };
const fileArg = opt("file", "巡铃.log");
const range = opt("range", "");
const date = opt("date", "");
const asJson = args.includes("--json");

const file = path.isAbsolute(fileArg) ? fileArg : path.join(HERE, fileArg);
const lines = fs.readFileSync(file, "utf-8").split("\n").filter(Boolean);
const isDated = (l) => /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/.test(l);
const stampOf = (l) => (isDated(l) ? l.slice(1, 20) : null);
function kindOf(l) {
  const body = l.replace(/^\[[^\]]*\]\s*/, "");
  if (/← \d+信/.test(body) || body.includes("上岗注入")) return "派活";
  if (body.includes("精灵欠账咬")) return "精灵欠账咬";
  if (body.includes("疯狗咬")) return "疯狗咬";
  if (body.includes("良性")) return "良性";
  if (body.includes("根层哨兵")) return "根层哨兵";
  if (body.includes("静默席拉起")) return "静默席拉起";
  if (body.includes("巡查")) return "巡查";
  if (body.includes("FAIL") || body.includes("失败") || body.includes("告警")) return "告警失败";
  return "其他";
}

let sel = lines.map((l, i) => ({ no: i + 1, l }));
if (range) {
  const m = range.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) { console.error("--range 形如 2791-2801"); process.exit(2); }
  const [a, b] = [Number(m[1]), Number(m[2])];
  sel = sel.filter((x) => x.no >= a && x.no <= b);
}
let legacyNotice = null;
if (date) {
  const legacyN = sel.filter((x) => !isDated(x.l)).length;
  sel = sel.filter((x) => isDated(x.l) && stampOf(x.l).startsWith(date));
  if (legacyN) legacyNotice = `legacy（无日期前缀）行 ${legacyN} 条：按日期过滤不可判，已排除——定位请用 --range 文件序（验收员更正件口径）`;
}
const legacyTotal = lines.length - lines.filter(isDated).length;
const cls = {};
let synth = 0;
for (const { l } of sel) { const k = kindOf(l); cls[k] = (cls[k] || 0) + 1; if (l.includes("#合成")) synth++; }
const out = {
  file: path.basename(file), range: range || null, date: date || null,
  lines: sel.length, classes: cls, synthetic: synth, net: sel.length - synth,
  legacy_rows_total: legacyTotal, legacy_notice: legacyNotice,
};
if (asJson) {
  console.log(JSON.stringify(out, null, 2));
} else {
  const clsTxt = Object.entries(cls).map(([k, v]) => `${k}=${v}`).join(" ");
  console.log(`窗口计数（只读）｜${out.file}${range ? " 文件序 " + range : ""}${date ? " 日期 " + date : ""}`);
  console.log(`结果：${out.lines} 行 · 派活 ${cls["派活"] || 0} · 合成 ${out.synthetic}（=净 ${out.net}）`);
  console.log(`事件分类：${clsTxt}`);
  if (legacyTotal) console.log(`legacy（全文件无日期前缀）：${legacyTotal} 行${legacyNotice ? "；" + legacyNotice : "——按日期过滤不可判，请用 --range"}`);
}
