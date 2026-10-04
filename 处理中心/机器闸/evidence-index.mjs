#!/usr/bin/env node
// 证据索引生成器 —— 证据目录不搬（红线23：manifest hash 锁路径），分类靠视图
// 扫描 <角色>\*-evidence 目录 × 工单库 phase → 分组索引落 处理中心\汇报区\
// 用法：node evidence-index.mjs [角色目录名，默认 程序员]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..");
const ARGS = process.argv.slice(2).filter(a => !a.startsWith("--"));
const SELF_TEST = process.argv.includes("--self-test");
const role = ARGS[0] || "程序员";
const roleDir = path.join(SYS, role);
const EV_SUB = { "设计师": "证据数据", "验收员": "证据数据", "审验员": "证据数据" }; // 证据目录所在子层（程序员=根层无子层）；2026-09-30 设计师侧归一为 证据数据（巡检台轮28 建议 a·原「检查证据」废止——否则本索引对设计师侧静默跳过）

const lib = fs.readFileSync(path.join(SYS, "处理中心", "工单库.md"), "utf8");
const outDir = path.join(SYS, "处理中心", "验证产物");

// 工单库 status 块 → { 工单号: phase }
const phases = {};
for (const m of lib.matchAll(/^# (UPG|SYS|W|S)-\d+[\s\S]*?```status\n([\s\S]*?)```/gm)) {
  const id = m[1] + "-" + parseInt(m[0].match(/^# ([A-Z]+-\d+)/)[1].split("-")[1], 10); // 前导零归一：SYS-05 == SYS-5
  const ph = (m[2].match(/^phase:\s*(\S+)/m) || [])[1] || "?";
  phases[id] = ph; // SYS-24：原为 parseInt(m[2],10)（m[2]=status 块文本）→ 键全 NaN；改用循环内已算好的 id
}
// 目录名 → 工单号（UPG49-R2-evidence → UPG-49；SYS05-evidence → SYS-05）
const dir2id = (d) => {
  const m = d.match(/^(SYS|UPG|W|S)-?(\d+)/i);
  return m ? `${m[1].toUpperCase()}-${parseInt(m[2], 10)}` : null;
};

const evDir = EV_SUB[role] ? path.join(roleDir, EV_SUB[role]) : roleDir;
// F0（2026-09-30）：白名单证据目录可能不存在（git 不跟踪空目录 ⇒ 无在途证据时必然消失）
// ——跳过并显式标「—」，不崩、不冒充 0。挂账＝LTR-20260930-025401-624-1i5
if (!fs.existsSync(evDir)) { console.log(`${role}: （— 目录不存在·跳过：${evDir}）`); process.exit(0); }
const dirs = fs.readdirSync(evDir).filter(d => (/-evidence$/i.test(d)|| /^(SYS|UPG|W|S)-?\d/i.test(d)) && fs.statSync(path.join(evDir, d)).isDirectory());
const GROUP = {
  "🔨 在途（未合单）": p => !["merged", "closed", "obsolete"].includes(p),
  "✅ 已合 main（凭据链锁定·禁搬）": p => p === "merged",
  "📦 已闭环/作废（凭据链锁定·禁搬）": p => ["closed", "obsolete"].includes(p),
  "❓ 库无卡（孤儿证据——巡检台追查）": p => p === null,
};
// ─────────── SYS-24 自测（--self-test）：键格式 + dir2id 抽样 + 归组一致 ───────────
if (SELF_TEST) {
  const errs = [];
  const blocks = [...lib.matchAll(/^# (UPG|SYS|W|S)-\d+[\s\S]*?```status\n([\s\S]*?)```/gm)].length;
  const keys = Object.keys(phases);
  // ① 键格式：NaN/非法一律红；键数须等于 status 块数（NaN 坍缩会把 N 卡并成 1 键）
  if (keys.length !== blocks) errs.push(`键数 ${keys.length} ≠ status 块数 ${blocks}（键碰撞/NaN 坍缩）`);
  for (const k of keys) if (!/^(UPG|SYS|W|S|HMOS)-\d+$/.test(k)) errs.push(`键格式非法: ${k}`);
  // ② dir2id 抽样（纯函数，环境无关）
  for (const [d, want] of [["UPG49-R2-evidence", "UPG-49"], ["SYS05-evidence", "SYS-5"], ["UPG129-evidence", "UPG-129"], ["SYS23-evidence", "SYS-23"]]) { // 前导零归一：SYS05→SYS-5
    const got = dir2id(d);
    if (got !== want) errs.push(`dir2id(${d}) = ${got} ≠ ${want}`);
  }
  // ③ 归组一致：库中有卡的目录不得被判为「孤儿」（SYS-24 原缺陷：phase=null 同时在途+孤儿双挂）
  const firstKey = keys[0];
  if (firstKey) {
    const probeDir = firstKey.replace("-", "") + "-evidence";
    if (dir2id(probeDir) !== firstKey) errs.push(`归组抽样 dir2id(${probeDir}) ≠ ${firstKey}`);
    const ph = phases[firstKey];
    if (GROUP["❓ 库无卡（孤儿证据——巡检台追查）"](ph)) errs.push(`归组错: ${firstKey}（phase=${ph}）被判孤儿`);
    if (!GROUP["🔨 在途（未合单）"](ph) && !["merged", "closed", "obsolete"].includes(ph)) errs.push(`归组错: ${firstKey}（phase=${ph}）四类皆未命中`);
  }
  if (errs.length) { console.log("❌ SELF-TEST FAIL"); for (const e of errs) console.log("  - " + e); process.exit(1); }
  console.log(`✅ SELF-TEST PASS（${keys.length} 键格式合规 + dir2id 4 抽样 + 归组一致）`);
  process.exit(0);
}

const rows = dirs.map(d => {
  const id = dir2id(d);
  const files = fs.readdirSync(path.join(evDir, d)).length;
  const ph = id ? (phases[id] ?? null) : null;
  return { d, id, files, ph };
}).sort((a, b) => a.d.localeCompare(b.d));

let md = `# 证据索引 · ${role}\n\n> 机器生成（${new Date().toISOString().slice(0, 10)}）——目录不搬（红线23 manifest hash 锁路径），分类靠本视图。复跑：\`node 处理中心\机器闸\evidence-index.mjs ${role}\`\n\n`;
md += `共 **${rows.length}** 个证据目录，${rows.reduce((n, r) => n + r.files, 0)} 个证据文件。\n\n`;
for (const [title, match] of Object.entries(GROUP)) {
  const sub = rows.filter(r => match(r.ph));
  if (!sub.length) continue;
  md += `## ${title}（${sub.length}）\n\n| 证据目录 | 工单 | phase | 文件数 |\n|---|---|---|---|\n`;
  for (const r of sub) md += `| \`${role}/${r.d}/\` | ${r.id ?? "—"} | ${r.ph ?? "孤儿"} | ${r.files} |\n`;
  md += "\n";
}
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `证据索引_${role}.md`);
fs.writeFileSync(out, md, "utf-8");
console.log(`✅ ${out}（${rows.length} 目录分组完成）`);
