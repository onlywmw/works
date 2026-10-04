#!/usr/bin/env node
// card-audit.mjs —— 卡片四方对账闸（2026-09-29 立·change=card-lifecycle-governance）
//
// 对账面：卡型台账（设计师/卡片库/台账/卡型注册表.json）
//        ↔ cardRegistry.js（运行期真源：CARD_TYPES／ACTION_LABELS／ACTION_WIRED／MOV_ACTION_WHITELIST）
//        ↔ 卡面渲染（渲染集 = labels ∩ WIRED；未接线动作不得出现）
//        ↔ 理由/动作中文文案（卡面组件 ↔ 工具侧模板，两套文案即红）
//
// 用法：
//   node 处理中心/机器闸/card-audit.mjs [--repo E:/mov归档/0027-mov] [--only <卡型id|链>] [--json] [--ledger <路径>]
// 退出码：0=全绿 ｜ 1=有漂移（红） ｜ 2=用法/环境错
//
// 判据（change spec · card-governance）：
//   A 卡型集合：registry 有而台账无 ⇒ 红；台账标 impl/wired/shipped 而 registry 无 ⇒ 红
//   B 字段：台账 fields（有则逐项）↔ registry fields（名／required）
//   C 动作：台账 actions id 集合 ↔ registry actions；中文 label 必须与 ACTION_LABELS 一致
//   D 接线：ACTION_WIRED=false（或缺该表）的动作 MUST NOT 进渲染集 ⇒ 进了即红（防假按钮）
//   E 状态合理性：shipped 须有 evidence.ticket；retired 须有迁移说明；未知状态值即红
//   F 文案单源：卡面理由标签 ↔ 工具侧理由模板（同码不同中文即红）
import fs from "node:fs";
import { PRODUCT } from "./lib/root.mjs"; // SYS-160：根解析单源
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..");
const opt = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const REPO = opt("--repo", PRODUCT); // SYS-160：默认位走根解析（缺省=原路径）
const ONLY = opt("--only", null);
const JSON_OUT = process.argv.includes("--json");
const LEDGER = opt("--ledger", path.join(SYS, "设计师", "卡片库", "台账", "卡型注册表.json"));
const REGISTRY = path.join(REPO, "tools", "ms-md-server", "page", "src", "lib", "cardRegistry.js");
const MALL_CARD = path.join(REPO, "tools", "ms-md-server", "page", "src", "components", "MallProductCard.vue");
const MALL_TOOLS = path.join(REPO, "app", "src", "main", "java", "com", "mov", "android", "tools", "MallRoomTools.kt");

const RED = [], YEL = [], OKL = [];
const red = (id, msg) => RED.push({ id, msg });
const yel = (id, msg) => YEL.push({ id, msg });
const ok = (id, msg) => OKL.push({ id, msg });

if (!fs.existsSync(LEDGER)) { console.error(`❌ 台账不存在：${LEDGER}`); process.exit(2); }
if (!fs.existsSync(REGISTRY)) { console.error(`❌ 注册表不存在（--repo 指对了吗）：${REGISTRY}`); process.exit(2); }

const ledger = JSON.parse(fs.readFileSync(LEDGER, "utf8"));
let R;
try { R = await import(pathToFileURL(REGISTRY).href); }
catch (e) { console.error(`❌ 加载 cardRegistry.js 失败：${e.message}`); process.exit(2); }

const TYPES = R.CARD_TYPES || {};
const LABELS = R.ACTION_LABELS || {};
const WIRED = R.ACTION_WIRED || null;           // UPG-385 前不存在
const WL = R.MOV_ACTION_WHITELIST || new Set();

const matchOnly = (c) => !ONLY || c.id === ONLY || c.chain === ONLY;
const cards = ledger.cards.filter(matchOnly);

// ---- A 卡型集合 ----
const regIds = new Set(Object.keys(TYPES));
const ledIds = new Set(cards.map((c) => c.id));
for (const id of regIds) if (!ledIds.has(id) && (!ONLY || id === ONLY)) red("A", `registry 有而台账无：${id}`);
const LIVE = new Set(["impl", "wired", "shipped"]);
for (const c of cards) {
  if (c.runtime === "room") continue;   // 房间卡不在 registry（另有 G/H 核）
  if (LIVE.has(c.status) && !regIds.has(c.id)) red("A", `台账标 ${c.status} 但 registry 无此卡型：${c.id}`);
}

// ---- B 字段 / C 动作 ----
for (const c of cards) {
  const t = TYPES[c.id];
  if (!t) continue;
  if (c.runtime === "room") continue;   // 房间内自有组件：不在 registry，B/C 不适用（另有 G/H 核）
  for (const f of c.fields || []) {
    const rf = (t.fields || {})[f.name];
    if (!rf) { red("B", `${c.id}.${f.name}：台账有、registry 无`); continue; }
    if (!!rf.required !== !!f.required) red("B", `${c.id}.${f.name}：required 不一致（台账 ${!!f.required}／registry ${!!rf.required}）`);
  }
  for (const fn of Object.keys(t.fields || {})) {
    if (!(c.fields || []).some((x) => x.name === fn)) yel("B", `${c.id}.${fn}：registry 有、台账未列`);
  }
  const tA = new Set(t.actions || []), lA = new Set((c.actions || []).map((a) => a.id));
  for (const a of tA) if (!lA.has(a)) red("C", `${c.id}：registry 动作 ${a} 不在台账`);
  for (const a of (c.actions || [])) {
    if (!tA.has(a.id)) { yel("C", `${c.id}：台账动作 ${a.id} 未进 registry（未实现属正常）`); continue; }
    const zh = LABELS[a.id] || "";
    if (!zh) red("C", `${c.id}.${a.id}：无中文 label（UPG-382 红线）`);
    else if (zh !== a.zh) red("C", `${c.id}.${a.id}：中文不一致（台账「${a.zh}」／注册表「${zh}」）`);
    if (!WL.has(a.id)) red("C", `${c.id}.${a.id}：不在 mov:// 白名单`);
  }
}

// ---- D 接线（防假按钮·不得写成恒真判断）----
// 判据：①registry 必须导出 ACTION_WIRED ②卡面 CardHost.vue 的渲染谓词必须引用它
//      ③列出未接线动作清单（它们 MUST NOT 出现在卡面）
const CARDHOST = path.join(REPO, "tools", "ms-md-server", "page", "src", "components", "CardHost.vue");
let hostSrc = "";
try { hostSrc = fs.readFileSync(CARDHOST, "utf8"); } catch (e) { red("D", `读不到 CardHost.vue：${e.message}`); }
const HOST_GATED = /ACTION_WIRED|isWired|WIRED\s*\[/.test(hostSrc);
if (!WIRED) {
  red("D", "registry 缺 ACTION_WIRED ⇒ 无接线单一真源（UPG-385 落地后转绿）");
  if (HOST_GATED) red("D", "卡面已引用 ACTION_WIRED 但注册表未导出（会全数不渲染或报错）");
} else if (!HOST_GATED) {
  red("D", "卡面 CardHost.vue 渲染谓词未引用 ACTION_WIRED ⇒ 未接线动作会照画（假按钮）");
} else {
  const unwired = [];
  for (const [id, t] of Object.entries(TYPES)) for (const a of t.actions || []) if (!WIRED[a]) unwired.push(`${id}.${a}`);
  ok("D", `接线闸在位（卡面已过 ACTION_WIRED）；未接线动作 ${unwired.length} 个 ⇒ 应不渲染：${unwired.slice(0, 5).join("、")}${unwired.length > 5 ? " 等" : ""}`);
}
// ---- E 状态合理性 ----
const ENUM = new Set(ledger._meta.status_enum);
for (const c of cards) {
  if (!ENUM.has(c.status)) red("E", `${c.id}：status 非法「${c.status}」`);
  if (c.status === "shipped" && !(c.evidence && c.evidence.ticket)) red("E", `${c.id}：shipped 但无 evidence.ticket`);
  if (c.status === "retired" && !c.retire_note) red("E", `${c.id}：retired 但无迁移说明`);
  if (c.status === "draft" && !(c.fields || []).length && !c.fields_note) yel("E", `${c.id}：draft 但无字段说明`);
}

// ---- F 文案单源（理由码）----
try {
  const cardTxt = fs.readFileSync(MALL_CARD, "utf8"), toolTxt = fs.readFileSync(MALL_TOOLS, "utf8");
  const grab = (txt, re) => { const o = {}; let m; while ((m = re.exec(txt))) o[m[1]] = m[2]; return o; };
  const a = grab(cardTxt, /([A-Z_]+):\s*'([^']+)'/g);
  const b = grab(toolTxt, /"([A-Z_]+)"\s*to\s*"([^"]+)"/g);
  for (const k of Object.keys(a)) {
    if (b[k] && b[k] !== a[k]) red("F", `理由码 ${k} 两套中文：卡面「${a[k]}」／工具侧「${b[k]}」`);
  }
  if (!Object.keys(a).length || !Object.keys(b).length) yel("F", "理由码扫描面变空（改名？）——请核对扫描正则");
} catch (e) { yel("F", `文案对账跳过：${e.message}`); }

// ---- G/H 房间卡纳管 ----
const ROOMAPP = path.join(REPO, "tools", "ms-md-server", "page", "src", "RoomApp.vue");
try {
  const t = fs.readFileSync(ROOMAPP, "utf8");
  const branches = new Set();
  for (const m of t.matchAll(/card\.type\s*===\s*'([a-zA-Z_]+)'/g)) branches.add(m[1]);
  const ledRoom = new Set(cards.filter((c) => c.runtime === "room").map((c) => c.id.replace(/^room\./, "")));
  for (const b of branches) if (!ledRoom.has(b)) yel("G", `RoomApp 渲染分支 card.type='${b}' 未进台账（按 runtime:room 纳管）`);
  const regIds2 = new Set(Object.keys(TYPES));
  for (const c of cards) if (c.runtime === "room") {
    const twin = c.id.replace(/^room\./, "");
    if (regIds2.has(twin)) yel("H", `同名双面：registry「${twin}」与房间卡「${c.id}」语义重复——待收口（DRIFT-5）`);
  }
} catch (e) { yel("G", `房间卡扫描跳过：${e.message}`); }

// ---- I 发射端扫描（2026-09-29 立·用户点名缺口1：退役 id 残留＝静默降级无人报警）----
//  扫描面＝发射端/渲染端代码（App 主源 java+kotlin ＋ 页面 src 的 vue/js；**registry 本体除外**——它在 A/D/F 已核）；
//  **注释不计引用**（墓碑注释是合法的：卡型退役后就该在注释里指回裁定）；
//  词表＝台账 41 张卡型 id（工具面 id 如 express.query 不在词表内·天然不误报）。
//  判据：①**退役/未知卡型**的字面量出现在发射端 ⇒ 黄（该场景会静默走文字流·生产侧无人报警）
//        ②**在用卡型**（impl/wired/shipped·非 runtime:room）在发射端**零引用** ⇒ 黄（可能永远出不来）
//     房间卡发射用非点号名（`{type:'product'}`）⇒ 归 G 核，不在本项。
function stripComments(src) {
  let out = ""; let q = null;
  for (let i = 0; i < src.length;) {
    const c = src[i], n = src[i + 1];
    if (q) { out += c; if (c === "\\") { out += n ?? ""; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; out += c; i++; continue; }
    if (c === "/" && n === "*") { const e = src.indexOf("*/", i + 2); i = e < 0 ? src.length : e + 2; out += " "; continue; }
    if (c === "<" && src.slice(i, i + 4) === "<!--") { const e = src.indexOf("-->", i + 4); i = e < 0 ? src.length : e + 3; out += " "; continue; } // Vue SFC 模板注释（2026-09-29 实测漏判：墓碑注释在 `<!-- -->` 里）
    if (c === "/" && n === "/") { const e = src.indexOf(String.fromCharCode(10), i); i = e < 0 ? src.length : e; continue; }
    out += c; i++;
  }
  return out;
}
function walkFiles(root, exts, acc = []) {
  let ents = [];
  try { ents = fs.readdirSync(root, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) { if (!/node_modules|\/build\/|\/out\/|\/tests?\/|\.git$/.test(p)) walkFiles(p, exts, acc); }
    else if (exts.some((x) => e.name.endsWith(x)) && !/cardRegistry\.js$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const EMIT_ROOTS = [
  [path.join(REPO, "app", "src", "main", "java"), [".kt"]],
  [path.join(REPO, "app", "src", "main", "kotlin"), [".kt"]],
  [path.join(REPO, "tools", "ms-md-server", "page", "src"), [".vue", ".js", ".ts"]],
];
const emitFiles = EMIT_ROOTS.flatMap(([r, exts]) => walkFiles(r, exts));
const emitText = emitFiles.map((f) => ({ f, t: stripComments(fs.readFileSync(f, "utf8")) }));
const relPath = (p) => p.replace(REPO, "").replace(/^[\\/]/, "").replace(/\\/g, "/");
if (!emitText.length) yel("I", "发射端扫描面为空（路径变了吗？）——本项未生效，请核 app/src/main 与 page/src 两条根");
else {
  const retiredIds = cards.filter((c) => c.status === "retired").map((c) => c.id);
  const activeIds = cards.filter((c) => ["impl", "wired", "shipped"].includes(c.status) && c.runtime !== "room").map((c) => c.id);
  const residual = [];
  for (const id of retiredIds) for (const { f, t } of emitText) if (t.includes(id)) residual.push(`${id} @ ${relPath(f)}`);
  for (const id of activeIds) {
    if (!emitText.some(({ t }) => t.includes(id))) yel("I", `在用卡型在发射端零引用：${id}（impl/wired/shipped 但无人发卡 ⇒ 可能永远出不来）`);
  }
  for (const r of residual.slice(0, 5)) yel("I", `退役卡型仍有发射端/渲染端引用：${r}（会静默走文字流·生产侧无人报警——清掉或改成注释墓碑）`);
  ok("I", `发射端扫描：${emitFiles.length} 件（含注释剔除）｜卡型词表 ${cards.length}｜退役残留 ${residual.length}｜在用未引用见上`);
}

// ---- 接受清单（登记为「有意」的漂移降黄·禁静默）----
const ACCEPTED = (ledger._meta && ledger._meta.accepted) || [];
if (ACCEPTED.length) {
  const keep = [];
  for (const r of RED) {
    const hit = ACCEPTED.find((a) => r.msg.includes(a.match) || r.id === a.id);
    if (hit) yel(r.id + "(accept)", `${r.msg} ⇢ 台账已登记有意：${hit.reason}`);
    else keep.push(r);
  }
  RED.length = 0; RED.push(...keep);
}

// ---- 输出 ----
const summary = {
  at: new Date().toLocaleString("sv-SE"), repo: REPO, ledger: LEDGER, only: ONLY,
  cards: cards.length, red: RED.length, yellow: YEL.length,
  // 契约覆盖（用户 2026-09-29 指正：闸的强度＝它能核到的契约强度）
  fields_exact: cards.filter((c) => (c.fields || []).length).length,
  fields_exact_verified: cards.filter((c) => (c.fields || []).length && TYPES[c.id]).length,
  fields_note_only: cards.filter((c) => !(c.fields || []).length).length,
  surface_tagged: cards.filter((c) => c.surface).length,
};
if (JSON_OUT) {
  console.log(JSON.stringify({ summary, red: RED, yellow: YEL }, null, 2));
} else {
  console.log(`卡片四方对账 @ ${summary.at}`);
  console.log(`  台账：${LEDGER}\n  注册表：${REGISTRY}${ONLY ? `\n  限定：${ONLY}` : ""}`);
  console.log(`  卡型 ${cards.length} 张｜红 ${RED.length}｜黄 ${YEL.length}`);
  console.log(`  契约覆盖：精确 fields ${summary.fields_exact} 张（其中可与 registry 逐项比对 ${summary.fields_exact_verified} 张）｜仅 fields_note ${summary.fields_note_only} 张｜surface 已标 ${summary.surface_tagged} 张`);
  if (RED.length) { console.log("\n🔴 漂移（必须处置）："); for (const r of RED) console.log(`  [${r.id}] ${r.msg}`); }
  if (YEL.length) { console.log("\n🟡 提示（不阻断）："); for (const y of YEL) console.log(`  [${y.id}] ${y.msg}`); }
  if (!RED.length) console.log("\n✅ 全绿：台账／注册表／渲染集／文案四方一致");
}
process.exit(RED.length ? 1 : 0);
