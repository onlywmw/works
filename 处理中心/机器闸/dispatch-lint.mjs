#!/usr/bin/env node
// dispatch-lint.mjs —— 派单卡面完整性闸（HY-BASE-23·2026-10-01 立）
// 根因：取号闸生成的卡骨架「## 范围 / ## 验收标准」为 TODO；出件人发了派单件却漏回填卡面
//       ⇒ 巡检侧一查即空壳（同型两轮实证：UPG-335/379/433 → UPG-402/SYS-157，后者甚至已 delivered）。
// 判据：**已派及以后**（dispatched/in_progress/delivered/accepted/audited）的卡，
//       「## 范围」或「## 验收标准」的正文 MUST NOT 仍为 TODO（骨架态）。
// 用法：node 处理中心/机器闸/dispatch-lint.mjs [--file <工单库路径>]
//   cwd 任意；stdout 只回摘要行（≤120 字·SYS-154）；明细落 巡检台/_tools/输出/dispatch-lint.log。
// 退出码：0=全绿 ｜ 1=有空壳（红） ｜ 2=用法/环境错。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..");
const opt = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const LIB = opt("--file", path.join(SYS, "处理中心", "工单库.md"));
const OUTDIR = path.join(SYS, "巡检台", "_tools", "输出");

const ACTIVE = new Set(["dispatched", "in_progress", "delivered", "accepted", "audited"]);
const TODO_RE = /##\s*(范围|验收标准)\s*\n+\s*TODO\s*(?:\n|$)/;

if (!fs.existsSync(LIB)) { console.error("DISPATCH_LINT_ERR 工单库不存在：" + LIB); process.exit(2); }
const raw = fs.readFileSync(LIB, "utf-8");
const heads = [...raw.matchAll(/^#\s+((?:UPG|SYS)-\d+)\s+.+$/gm)].map((m) => ({ id: m[1], at: m.index }));
const offenders = [];
let scanned = 0;
let activeCount = 0;
for (let i = 0; i < heads.length; i++) {
  const card = raw.slice(heads[i].at, i + 1 < heads.length ? heads[i + 1].at : raw.length);
  scanned++;
  const phase = (card.match(/^phase:\s*([A-Za-z_]+)/m) || [])[1] || "?";
  if (!ACTIVE.has(phase)) continue;
  activeCount++;
  const m = card.match(TODO_RE);
  if (m) offenders.push({ id: heads[i].id, phase, section: m[1] });
}
fs.mkdirSync(OUTDIR, { recursive: true });
const logf = path.join(OUTDIR, "dispatch-lint.log");
const lines = [`# dispatch-lint @${new Date().toLocaleString("sv-SE")}`, `扫卡=${scanned}｜已派及以上=${activeCount}｜空壳=${offenders.length}`];
lines.push(offenders.length ? offenders.map((o) => `${o.id}（${o.phase}·## ${o.section}=TODO）`).join("\n") : "无空壳（已派及以上档全部有实体范围/验收）");
fs.writeFileSync(logf, lines.join("\n") + "\n", "utf-8");

if (offenders.length) {
  console.log(`DISPATCH_LINT_FAIL ${offenders.length} 件空壳：${offenders.slice(0, 6).map((o) => o.id).join("、")}${offenders.length > 6 ? "…" : ""}（明细见 _tools/输出/dispatch-lint.log）`);
  process.exit(1);
}
console.log(`DISPATCH_LINT_OK 全量 ${scanned} 卡·已派及以上 ${activeCount}·空壳 0`);
process.exit(0);
