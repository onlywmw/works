#!/usr/bin/env node
// card-clarity/validate.mjs —— 卡面行动语义协议（五字段）校验器 · fail-closed
//
// 用法：
//   node 处理中心/机器闸/card-clarity/validate.mjs --cards <文件|目录> [--repo <产品仓根>] [--json] [--quiet]
//   --cards 可指：单个 JSON（一张卡或卡数组）｜目录（*.json 逐件：一张卡或卡数组）
// 退出码：0=全过 ｜ 1=有拒项（逐条点名） ｜ 2=用法/环境错
// 判据：V1 五字段齐全（blocker 可 null 但须在）V2 人话字段非空 V3 next ∈ 白名单（单一真源）
//       V4 主行动唯一 V5 多步链 steps 完整且恰一 now V6 术语直出 0 V7 blocker 非 null 须非空。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? true) : d; };
const CARDS = arg("--cards");
const REPO = arg("--repo", process.env.MOV_PRODUCT_ROOT || "E:/mov归档/0027-mov");
const JSON_OUT = argv.includes("--json");
const QUIET = argv.includes("--quiet");
if (!CARDS) { console.error("用法：node validate.mjs --cards <文件|目录> [--repo <产品仓根>] [--json]"); process.exit(2); }

// ── 白名单/真源（与 card-audit 同口径）─────────────────────────────────
let WL = new Set(), LABELS = {}, WL_SRC = "";
const REG = path.join(REPO, "tools", "ms-md-server", "page", "src", "lib", "cardRegistry.js");
try {
  const R = await import(pathToFileURL(REG).href);
  WL = R.MOV_ACTION_WHITELIST || new Set();
  LABELS = R.ACTION_LABELS || {};
  WL_SRC = `registry:${path.relative(REPO, REG).replace(/\\/g, "/")}`;
  if (!WL.size) throw new Error("registry 未导出 MOV_ACTION_WHITELIST");
} catch (e) {
  const snap = JSON.parse(fs.readFileSync(path.join(HERE, "fallback-whitelist.json"), "utf8"));
  WL = new Set(snap.whitelist || []);
  LABELS = snap.labels || {};
  WL_SRC = "fallback-whitelist.json（降级：注册表不可达 " + (e.message || e) + "）";
}

const REQUIRED = ["what", "state", "next", "why", "blocker"];
const CHAIN_HINT = /onboard|applyment|shelf|listing/i;   // 链族：入驻/商户号/上架（spec 点名）；其余卡按需给 steps
const TERM_RE = new RegExp([
  "SKU", "CU-[0-9a-zA-Z_-]+", "business_code", "shop_id", "applyment_id", "sub_mchid", "webhook",
  "\\bdraft\\b", "\\bREJECTED\\b", "\\bAPPROVED\\b", "\\bFINISH\\b", "\\bPENDING\\b", "\\bTODO\\b",
  "\\bwhat\\b", "\\bstate\\b", "\\bnext\\b", "\\bblocker\\b", "\\bpayload\\b", "\\bjson\\b",
].join("|"));

function loadCards(p) {
  const st = fs.statSync(p);
  const files = st.isDirectory() ? fs.readdirSync(p).filter((f) => f.endsWith(".json") && !f.startsWith("expect") && !f.includes("fallback")).map((f) => path.join(p, f)) : [p];
  const out = [];
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const c of Array.isArray(j) ? j : [j]) out.push({ file: path.relative(process.cwd(), f).replace(/\\/g, "/"), card: c });
  }
  return out;
}

function validate(card) {
  const v = [];
  const humanTexts = [];
  // V1/V2/V7
  for (const k of REQUIRED) {
    if (!(k in card)) { v.push(`V1 缺字段：${k}`); continue; }
    if (k === "blocker") { if (card[k] !== null && (typeof card[k] !== "string" || !card[k].trim())) v.push("V7 blocker 非 null 须为非空字符串"); continue; }
    if (typeof card[k] !== "string" || !card[k].trim()) v.push(`V2 字段须为非空字符串：${k}`);
  }
  // V3
  if (typeof card.next === "string" && !WL.has(card.next)) v.push(`V3 next 不在动作白名单：${card.next}`);
  // V4 主行动唯一
  const actions = Array.isArray(card.actions) ? card.actions : [];
  const bad = actions.filter((a) => !WL.has(a));
  if (bad.length) v.push(`V4 actions 含白名单外动作：${bad.join(",")}`);
  if (actions.length && !actions.includes(card.next)) v.push("V4 actions 未包含主行动 next");
  const primaries = actions.filter((a) => a === card.next);
  if (actions.length > 1 && primaries.length !== 1) v.push("V4 主行动不唯一（actions 中 next 出现次数≠1）");
  // V5 多步链
  const isChain = CHAIN_HINT.test(String(card.type || "")) || Array.isArray(card.steps);
  if (isChain) {
    if (!Array.isArray(card.steps) || !card.steps.length) v.push("V5 多步链卡缺 steps[]");
    else {
      const now = card.steps.filter((s) => s && s.status === "now").length;
      card.steps.forEach((s, i) => {
        if (!s || typeof s.name !== "string" || !s.name.trim()) v.push(`V5 steps[${i}] 缺名`);
        if (!s || !["done", "now", "todo"].includes(s.status)) v.push(`V5 steps[${i}] status 非法（须 done|now|todo）`);
      });
      if (now !== 1) v.push(`V5 steps 当前步标注不唯一（now=${now}·须恰 1）`);
    }
  }
  // V6 术语直出（人话字段＋步骤名）
  for (const k of ["what", "state", "why"]) if (typeof card[k] === "string") humanTexts.push(card[k]);
  if (typeof card.blocker === "string" && card.blocker) humanTexts.push(card.blocker);
  for (const s of Array.isArray(card.steps) ? card.steps : []) if (s && s.name) humanTexts.push(String(s.name));
  for (const t of humanTexts) {
    const m = t.match(TERM_RE);
    if (m) v.push(`V6 术语直出：${m[0]}`);
  }
  return v;
}

const cards = loadCards(path.resolve(CARDS));
const results = cards.map(({ file, card }) => ({ file, cardId: card.cardId || null, violations: validate(card) }));
const failed = results.filter((r) => r.violations.length);
if (JSON_OUT) {
  console.log(JSON.stringify({ whitelistSource: WL_SRC, total: results.length, failed: failed.length, results }, null, 2));
} else {
  if (!QUIET) console.log(`卡面五字段校验（${results.length} 张·白名单源 ${WL_SRC}）`);
  for (const r of results) {
    const tag = r.violations.length ? "❌" : "✅";
    if (!QUIET || r.violations.length) console.log(`${tag} ${r.file}${r.cardId ? " #" + r.cardId : ""}${r.violations.length ? " → " + r.violations.join("；") : ""}`);
  }
  console.log(`合计：${results.length} 张，${failed.length} 拒，${results.length - failed.length} 过（rc=${failed.length ? 1 : 0}）`);
}
process.exit(failed.length ? 1 : 0);
