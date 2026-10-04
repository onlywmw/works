#!/usr/bin/env node
// wired-audit.mjs —— 接线审计闸（2026-09-30 立·用户令「根除建了没接线」）
//
// 病（造轮子扫描 da9d55a）：模块/门交付了、测试全绿，但生产代码零消费者（先例 SkillGate 空转/exec-engine 核心未接线/passport 模块零外部引用）。
// 治：本闸机检「零外部生产消费者」——模块级（Gradle 模块互引矩阵）与类级（--class 探针）；豁免走基线登记（带单号/挂账号·登记≠销账）。
// 用法：
//   node wired-audit.mjs                 # 模块级全扫（红=零外部消费且未登记豁免；黄=已登记待接线；绿=有消费）
//   node wired-audit.mjs --class SkillGate --repo <产品仓路径>   # 类级探针（列真实消费者文件）
//   node wired-audit.mjs --json          # 机器读
// 落点：处理中心/机器闸/；产物零文件（只读扫描）；基线=同目录 wired-audit-baseline.json（人工维护·带单号）。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO = "E:/mov归档/0027-mov";
const repo = (process.argv.includes("--repo") ? process.argv[process.argv.indexOf("--repo") + 1] : DEFAULT_REPO);
const AS_JSON = process.argv.includes("--json");
const SKIP = new Set(["node_modules", ".git", "build", ".gradle", "dist", ".cxx", ".githooks"]);
const APP_ONLY_TEST = /\/(test|androidTest)\//;

const baseline = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(HERE, "wired-audit-baseline.json"), "utf-8")); } catch { return { exempt: {} }; }
})();

// ── 收集：模块 → {类名: 定义文件}；模块生产正文合集 ──
const modClasses = {}, modText = {};
(function walk(dp) {
  let ents; try { ents = fs.readdirSync(dp, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(dp, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(p); continue; }
    if (!e.name.endsWith(".kt") || !p.includes(`${path.sep}src${path.sep}`)) continue;
    if (APP_ONLY_TEST.test(p.replace(/\\/g, "/"))) continue;
    const m = p.split(path.sep).slice(-2 - p.split(path.sep).reverse().indexOf("src") + 1)[0]; // src 前一段=模块名
    const mod = (() => { const i = p.split(path.sep).indexOf("src"); return i > 0 ? p.split(path.sep)[i - 1] : "?"; })();
    (modClasses[mod] ||= {});
    const cls = e.name.replace(/\.kt$/, "");
    if (!modClasses[mod][cls]) modClasses[mod][cls] = p;
    modText[mod] = (modText[mod] || "") + "\n" + fs.readFileSync(p, "utf-8");
  }
})(repo);

const reds = [], yellows = [], greens = [];
for (const [mod, classes] of Object.entries(modClasses)) {
  // 外部消费类数：类名出现在**其他模块**生产正文
  const consumed = Object.keys(classes).filter((cls) =>
    Object.entries(modText).some(([m2, t]) => m2 !== mod && new RegExp(`\\b${cls}\\b`).test(t)));
  const row = { mod, classes: Object.keys(classes).length, consumed: consumed.length, sample: consumed.slice(0, 4) };
  const ex = baseline.exempt[mod];
  if (consumed.length === 0 && !ex) reds.push({ ...row, why: "零外部生产消费者且未登记豁免" });
  else if (ex) yellows.push({ ...row, exempt: ex });
  else greens.push(row);
}

// ── 类级探针 ──
let probe = null;
const ci = process.argv.indexOf("--class");
if (ci > 0) {
  const cls = process.argv[ci + 1];
  const home = Object.entries(modClasses).find(([, cs]) => cls in cs)?.[0];
  // 剥注释后再匹配（先例：SkillGate 被 EvolutionDeriver 一条 // 注释"引用"——文本探针不加注释过滤会假接线）
  const codeOf = (p) => fs.readFileSync(p, "utf-8").split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*") && !l.trim().startsWith("/*")).join("\n");
  const ext = [], own = [];
  for (const [mod, classes] of Object.entries(modClasses)) {
    for (const [c2, p] of Object.entries(classes)) {
      if (c2 === cls) continue;
      if (new RegExp(`\\b${cls}\\b`).test(codeOf(p))) (mod === home ? own : ext).push(p.replace(repo + path.sep, ""));
    }
  }
  // 外部接线才算真接线（模块内自引用=同族互捧·如 PassportService→PassportCli；先例 SkillGate 仅注释引用）
  const extClean = ext.filter((p) => !/\/(test|androidTest)\//.test(p.replace(/\\/g, "/")));
  probe = { cls, home, 外部接线: extClean.length ? [...new Set(extClean)] : "★零", 模块内引用数: own.length, 结论: extClean.length ? "已接线" : (own.length ? "仅模块内自引用（外部未接线）" : "★零（仅测试/注释=未接线）") };
}

if (AS_JSON) {
  console.log(JSON.stringify({ repo, at: new Date().toISOString(), reds, yellows, greens: greens.map(({ mod, classes, consumed }) => ({ mod, classes, consumed })), probe }, null, 2));
  process.exit(reds.length ? 1 : 0);
}
console.log(`接线审计 @ ${new Date().toISOString().slice(0, 16)} ｜ 仓=${repo} ｜ 模块=${Object.keys(modClasses).length} ｜ 红=${reds.length} 黄=${yellows.length} 绿=${greens.length}`);
for (const r of reds) console.log(`  🚨 ${r.mod}（${r.classes} 类·零外部消费·未登记）——建了没接线（造轮子扫描病因A）`);
for (const y of yellows) console.log(`  🟡 ${y.mod}（${y.classes} 类·外部消费 ${y.consumed}）｜已登记豁免：${y.exempt}`);
for (const g of greens) console.log(`  ✅ ${g.mod}（${g.classes} 类·外部消费 ${g.consumed}：${g.sample.join(",")}${g.consumed > 4 ? "…" : ""}）`);
if (probe) console.log(`类探针 ${probe.cls}（模块=${probe.home}）→ 外部接线：${JSON.stringify(probe.外部接线)}｜模块内引用数=${probe.模块内引用数}｜结论=${probe.结论}`);
console.log(reds.length ? "❌ WIRED-AUDIT FAIL（新零接线模块——要么接线、要么 wired-audit-baseline.json 登记豁免带单号）" : "✅ 无未登记的零接线模块");
process.exit(reds.length ? 1 : 0);
