#!/usr/bin/env node
// spawn-hide-check.mjs —— 无窗子进程执法闸（2026-10-04 立·闪窗彻查修复的防复发闸）
//
// 缘起：2026-09-11「一直跳 git cmd 窗」只修了备份.mjs 单点 → 2026-10-04 合工单闪窗复发（装机钩子链 ~20 窗/次）——
//       「修一处漏一处」的根因=无机器执法。本闸静态扫描运行面子进程点位：spawn/exec 系无 windowsHide（py 无
//       creationflags/CREATE_NO_WINDOW）即红；席位窗（SYS-61 可见窗原则·故意可见）走白名单。
// 扫描面：机器闸（root+lib+checks·除 tests）＋看板（root+lib·除 tests/运行态）＋邮局（root）。
// 用法：node 处理中心/机器闸/spawn-hide-check.mjs　退出码 0=全绿 1=有裸奔点 2=环境错
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");

const MJS_CALL = /\b(spawnSync|execFileSync|execSync|spawn|execFile)\s*\(/g;
const PY_CALL = /\bsubprocess\.(run|Popen|check_output|check_call|call)\s*\(/g;
const WINDOW_LINES = 8; // 选项对象通常在调用后 ~8 行内

// 白名单：SYS-61 可见窗原则——席位/值守/工位窗是「故意可见」，匹配命中即放行
const EXEMPT = [
  { re: /AGENT_CMD/, why: "席位窗拉起（SYS-61 可见窗原则·故意可见）" },
  { re: /值守\.mjs/, why: "值守窗拉起（同上）" },
  { re: /piCmd/, why: "工位池拉起（同上）" },
];

function listFiles(dir, { recursive = false, ext }) {
  const out = [];
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "__pycache__" || e.name === "tests") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (recursive) out.push(...listFiles(p, { recursive, ext })); continue; }
    if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

const targets = [
  ...listFiles(path.join(ROOT, "处理中心", "机器闸"), { recursive: true, ext: ".mjs" }),
  ...listFiles(path.join(ROOT, "处理中心", "机器闸"), { recursive: false, ext: ".py" }),
  ...listFiles(path.join(ROOT, "处理中心", "看板"), { recursive: false, ext: ".mjs" }),
  ...listFiles(path.join(ROOT, "处理中心", "看板", "lib"), { recursive: false, ext: ".mjs" }),
  ...listFiles(path.join(ROOT, "处理中心", "邮局"), { recursive: false, ext: ".mjs" }),
];

const problems = [];
let checked = 0;
for (const file of targets) {
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split("\n");
  const rel = path.relative(ROOT, file);
  const isPy = file.endsWith(".py");
  const callRe = isPy ? PY_CALL : MJS_CALL;
  const srcText = src;
  for (const m of srcText.matchAll(callRe)) {
    const lineNo = srcText.slice(0, m.index).split("\n").length;
    const lineStart = lines[lineNo - 1] || "";
    if (lineStart.trim().startsWith(isPy ? "#" : "//")) continue; // 注释行不计
    // 调用窗口：本行起 8 行
    const window = lines.slice(lineNo - 1, lineNo - 1 + WINDOW_LINES).join("\n");
    checked++;
    if (isPy ? /creationflags|CREATE_NO_WINDOW/.test(window) : /windowsHide/.test(window)) continue;
    if (EXEMPT.some(x => x.re.test(window))) continue;
    problems.push(`${rel}:${lineNo}  ${lineStart.trim().slice(0, 80)}`);
  }
}

if (problems.length) {
  console.error(`❌ SPAWN-HIDE CHECK FAIL：${problems.length} 处子进程点位无窗防护（加 windowsHide:true ／ py 加 creationflags=NO_WINDOW；席位窗走白名单）——2026-09-11 单点修复复发案的根治闸：`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`✅ SPAWN-HIDE CHECK PASS（${targets.length} 件·${checked} 个子进程点位全有窗防护·席位窗白名单 ${EXEMPT.length} 条在册）`);
