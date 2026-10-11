#!/usr/bin/env node
// card-clarity/gates/slop.mjs —— slop guards（确定性设计守卫·适用集）
//
// 用法：node slop.mjs --cards <文件|目录> [--json]
// 退出码：0=全过 ｜ 1=有命中 ｜ 2=用法错
// 守卫（确定性·逐条点名）：
//   S1 占位文本：TODO/TBD/待填/xxx/占位/Lorem
//   S2 按钮/动作文案为空或过长（>12 字·中文计数）
//   S3 主行动文案与白名单 label 不一致（有 label 时）
//   S4 重复主行动：steps[].name 或 actions 内重复项
//   S5 空态堆砌：what/state/why 三字段合计 <10 字（信息量过低）
//   S6 steps 名重复（同名步 ≥2）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? true) : d; };
const CARDS = arg("--cards"); const REPO = arg("--repo", process.env.MOV_PRODUCT_ROOT || "E:/mov归档/0027-mov"); const JSON_OUT = argv.includes("--json");
if (!CARDS) { console.error("用法：node slop.mjs --cards <文件|目录> [--repo <产品仓根>] [--json]"); process.exit(2); }

let LABELS = {};
try { const R = await import(pathToFileURL(path.join(REPO, "tools/ms-md-server/page/src/lib/cardRegistry.js")).href); LABELS = R.ACTION_LABELS || {}; } catch { LABELS = JSON.parse(fs.readFileSync(path.join(HERE, "..", "fallback-whitelist.json"), "utf8")).labels || {}; }

const PLACEHOLDER = /(TODO|TBD|待填|占位|xxx|XXX|Lorem|示例文本)/;
function load(p) {
  const st = fs.statSync(p);
  const files = st.isDirectory() ? fs.readdirSync(p).filter((f) => f.endsWith(".json") && !f.includes("fallback") && !f.startsWith("expect")).map((f) => path.join(p, f)) : [p];
  return files.flatMap((f) => { const j = JSON.parse(fs.readFileSync(f, "utf8")); return (Array.isArray(j) ? j : [j]).map((c) => ({ file: path.relative(process.cwd(), f).replace(/\\/g, "/"), card: c })); });
}

function slop(card) {
  const hits = [];
  const texts = [card.what, card.state, card.why, card.blocker].filter((x) => typeof x === "string" && x);
  for (const t of texts) if (PLACEHOLDER.test(t)) hits.push(`S1 占位文本：${t.match(PLACEHOLDER)[0]}`);
  const label = LABELS[card.next] || "";
  if (label && [...label].length > 12) hits.push(`S2 主行动文案过长：${label}`);
  if (!label && card.next) hits.push(`S3 主行动无白名单 label：${card.next}`);
  const names = (Array.isArray(card.steps) ? card.steps : []).map((s) => s && s.name).filter(Boolean);
  const dup = names.filter((n, i) => names.indexOf(n) !== i);
  if (dup.length) hits.push(`S4/S6 重复步名：${[...new Set(dup)].join(",")}`);
  const acts = Array.isArray(card.actions) ? card.actions : [];
  const dupA = acts.filter((a, i) => acts.indexOf(a) !== i);
  if (dupA.length) hits.push(`S4 重复动作：${[...new Set(dupA)].join(",")}`);
  const words = texts.join("").replace(/\s/g, "").length;
  if (words < 10) hits.push(`S5 信息量过低（人话合计 ${words} 字）`);
  return hits;
}

const all = load(path.resolve(CARDS)).map(({ file, card }) => ({ file, cardId: card.cardId || null, hits: slop(card) }));
const bad = all.filter((r) => r.hits.length);
if (JSON_OUT) console.log(JSON.stringify({ total: all.length, hit: bad.length, results: all }, null, 2));
else { for (const r of bad) console.log(`❌ ${r.file} #${r.cardId} → ${r.hits.join("；")}`); console.log(`slop guards：${all.length} 张，${bad.length} 命中（rc=${bad.length ? 1 : 0}）`); }
process.exit(bad.length ? 1 : 0);
