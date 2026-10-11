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
// SYS-203 #6：放宽——标题可带后缀、标题与 TODO 间允许多空行、TODO 可带尾随文本（原锚过窄漏检·CRLF 兼容）
const TODO_RE = /##\s*(范围|验收标准)[^\n]*\n(?:[ \t]*\r?\n)*[ \t]*TODO\b/;

if (!fs.existsSync(LIB)) { console.error("DISPATCH_LINT_ERR 工单库不存在：" + LIB); process.exit(2); }
const raw = fs.readFileSync(LIB, "utf-8");
const heads = [...raw.matchAll(/^#\s+((?:UPG|SYS|POL)-\d+)\s+.+$/gm)].map((m) => ({ id: m[1], at: m.index }));
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
// ② SYS-192 设计闸机检（**warn 起步**·口径补遗 #48）：#48 生效日（2026-10-07）之后新出派单件，
//    「## 范围」MUST 先写「复用面」＋「数据面」两行——缺行=出件质量缺陷（warn＋计次·不拦）。
const DISPATCH_DIR = path.join(SYS, "设计师", "派单");
const SINCE = Date.parse("2026-10-07T00:00:00+08:00");
const missing48 = [];
let newDispatches = 0;
try {
  for (const f of fs.readdirSync(DISPATCH_DIR).filter((x) => x.endsWith(".md"))) {
    const p = path.join(DISPATCH_DIR, f);
    if (fs.statSync(p).mtimeMs < SINCE) continue;
    newDispatches++;
    const t = fs.readFileSync(p, "utf-8");
    const miss = [! /复用面/.test(t) && "复用面", !/数据面/.test(t) && "数据面"].filter(Boolean);
    if (miss.length) missing48.push(`${f.replace(/\.md$/, "")}（缺 ${miss.join("、")}）`);
  }
} catch (e) { /* 目录缺=不阻断（warn 级） */ }

const lines = [`# dispatch-lint @${new Date().toLocaleString("sv-SE")}`, `扫卡=${scanned}｜已派及以上=${activeCount}｜空壳=${offenders.length}`, `#48 新派单=${newDispatches}｜缺复用面/数据面=${missing48.length}`, ...missing48.slice(0, 20)];
lines.push(offenders.length ? offenders.map((o) => `${o.id}（${o.phase}·## ${o.section}=TODO）`).join("\n") : "无空壳（已派及以上档全部有实体范围/验收）");
fs.writeFileSync(logf, lines.join("\n") + "\n", "utf-8");

if (offenders.length) {
  console.log(`DISPATCH_LINT_FAIL ${offenders.length} 件空壳：${offenders.slice(0, 6).map((o) => o.id).join("、")}${offenders.length > 6 ? "…" : ""}（明细见 _tools/输出/dispatch-lint.log）${missing48.length ? `｜#48 warn：新派单 ${newDispatches} 缺两行 ${missing48.length}` : ""}`);
  process.exit(1);
}
console.log(`DISPATCH_LINT_OK 全量 ${scanned} 卡·已派及以上 ${activeCount}·空壳 0${missing48.length ? `｜#48 warn：新派单 ${newDispatches} 缺两行 ${missing48.length}` : ""}`);
process.exit(0);
