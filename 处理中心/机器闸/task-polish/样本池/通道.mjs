#!/usr/bin/env node
// POL-11 样本池通道.mjs —— 样本池唯一出入口（出侧闸｜入侧合成卡｜环接口｜零真件抽检）
//
// 合规硬红线（细则＝同目录 合规清单.md）：真件一律不得进池；池内零 PII；素材位仅合成件。
// 用法（默认池＝本脚本所在目录；--池 <dir> 仅供测试隔离；--脱敏 供出侧替换模式）：
//   node 通道.mjs 上传 <候选.json> [--脱敏] [--id <条目id>]
//   node 通道.mjs 接收 <条目id>
//   node 通道.mjs 读池 [<条目id>]        # JSON（环入口消费清单）
//   node 通道.mjs 扫描                    # 全池 PII/真件抽检（收口前必跑）
//   node 通道.mjs 归档 <条目id>
// 退出码：0=通过；1=拒绝/命中/缺件；2=用法或环境错误
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv0 = process.argv.slice(2);
const rest = [];
const opts = {};
for (let i = 0; i < argv0.length; i++) {
  const a = argv0[i];
  if (a === "--池" || a === "--id") opts[a] = argv0[++i];
  else if (a === "--脱敏") opts[a] = true;
  else rest.push(a);
}
const POOL = path.resolve(opts["--池"] || HERE);
const REDACT = !!opts["--脱敏"];
const FORCE_ID = opts["--id"] || null;
const [cmd, ...args] = rest;

const die = (msg, rc = 2) => { console.error(msg); process.exit(rc); };
const now = () => new Date().toLocaleString("sv-SE").replace(" ", "T");
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const rel = (p) => path.relative(POOL, p).split(path.sep).join("/");
// A#13：索引路径须落在池内（越界=命中拒·防索引注入读池外）
const inPool = (p) => {
  const full = path.resolve(POOL, String(p));
  return full.startsWith(POOL.endsWith(path.sep) ? POOL : POOL + path.sep);
};

const ENTRIES = path.join(POOL, "条目");
const MATERIALS = path.join(POOL, "素材");
const INDEX = path.join(POOL, "索引.json");
const REGISTRY = JSON.parse(fs.readFileSync(path.join(HERE, "素材位.json"), "utf8"));

// ── 白名单（合规清单.md §2 的机读源）：相位/事件序/耗时/错误码/字段名/计数 ──
const PHASES = new Set(["CREATED", "RUNNING", "WAITING_USER", "WAITING_EVENT", "WAITING_TIME", "FAILED", "DONE", "CANCELLED"]);
const FIELD_RULES = {
  phase:       (v) => (typeof v === "string" && PHASES.has(v)) || "相位须为状态机枚举值",
  event_seq:   (v) => (Number.isInteger(v) && v >= 0 && v <= 1e6) || "事件序须为 0..1000000 整数",
  duration_ms: (v) => (Number.isInteger(v) && v >= 0 && v <= 864e5) || "耗时须为 0..86400000 毫秒整数",
  error_code:  (v) => (v === null || (typeof v === "string" && /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(v))) || "错误码须为短代码（≤64 字符）或 null",
  field_name:  (v) => (v === null || (typeof v === "string" && /^[a-z][a-z0-9_.]{0,63}$/.test(v))) || "字段名须为小写标识（≤64 字符）或 null",
  count:       (v) => (Number.isInteger(v) && v >= 0 && v <= 1e9) || "计数须为 0..1000000000 整数",
};
const WHITELIST = Object.keys(FIELD_RULES);

// ── PII 扫描规则（合规清单.md §3 的机读源）：命中即拒/替换 ──
const PII_RULES = [
  ["手机号", /(?<!\d)1[3-9]\d{9}(?!\d)/g],
  ["身份证号", /(?<!\d)(?:1[1-9]\d{14}|\d{17}[\dXx])(?!\d)/g],
  ["银行卡号", /(?<!\d)\d{16,19}(?!\d)/g],
  ["邮箱", /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g],
  ["令牌/密钥", /(?:sk-[A-Za-z0-9_-]{8,}|bearer\s+[A-Za-z0-9._-]{12,}|(?:token|password|secret|api_?key)\s*[:=]\s*\S+)/gi],
  ["图片/数据块", /(?:data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+|(?:^|[\s"':=])[^\s"':=]+\.(?:png|jpe?g|webp|gif|bmp|heic|pdf)\b)/gi],
  ["原文/姓名/地址（非 ASCII）", /[^\x00-\x7F]+/g],
];
const TEXT_RULES = PII_RULES.slice(0, 6); // 卡/素材文本用：合成件本该是中文材料，只扫前置 PII 类型
const stripHashes = (s) => String(s).replace(/[0-9a-f]{32,}/gi, ""); // sha/长十六进制豁免（防 16+ 连号误杀）

const piiHits = (v, rules = PII_RULES) => {
  const out = [];
  if (typeof v !== "string") return out;
  for (const [type, re] of rules) {
    for (const m of v.matchAll(new RegExp(re.source, re.flags))) out.push({ type, hit: m[0].slice(0, 48) });
  }
  return out;
};
const redactValue = (v) => {
  let s = v; const types = [];
  for (const [type, re] of PII_RULES) {
    if (new RegExp(re.source, re.flags).test(s)) { types.push(type); s = s.replace(new RegExp(re.source, re.flags), "redacted"); }
  }
  return { s, types };
};

// ── 出侧闸：白名单结构 + 值约束 + PII 扫描（红=拒；--脱敏=命中片段替换后重判）──
function gate(cand, { redact = false } = {}) {
  const problems = []; const redacted = [];
  if (!cand || typeof cand !== "object" || Array.isArray(cand)) return { ok: false, problems: ["顶层须为 JSON 对象"], redacted: [] };
  for (const k of Object.keys(cand)) if (!["sample", "source", "checkpoint"].includes(k)) problems.push(`未知字段（白名单外·原文/附件由此拒）：${k}`);
  const { sample, source } = cand;
  if (typeof sample !== "string" || !/^S-[A-Z0-9-]{2,32}$/.test(sample)) problems.push("sample 须为样本卡 id（形如 S-XXX）");
  else if (!REGISTRY.samples[sample]) problems.push(`sample 未在 素材位.json 登记：${sample}`);
  if (!["sandbox", "real"].includes(source)) problems.push("source 须为 sandbox（沙盒跑批）或 real（真实使用卡点）");
  const ck = cand.checkpoint;
  if (!ck || typeof ck !== "object" || Array.isArray(ck)) { problems.push("checkpoint 须为对象（白名单六字段）"); return { ok: false, problems, redacted }; }
  if (!("phase" in ck)) problems.push("checkpoint 缺 phase（卡点相位为锚）");
  for (const k of Object.keys(ck)) if (!WHITELIST.includes(k)) problems.push(`checkpoint 未知字段（白名单外）：${k}`);
  for (const k of WHITELIST) {
    if (!(k in ck)) continue;
    let v = ck[k];
    // B#30：先验（原文先过白名单约束——防「原文不合、脱敏后才合」混入）
    const judgedRaw = FIELD_RULES[k](v);
    if (judgedRaw !== true) problems.push(`${k} 取值不合白名单约束：${judgedRaw}`);
    // 脱敏（仅字符串）
    if (redact && typeof v === "string") {
      const r = redactValue(v);
      if (r.types.length) redacted.push(...r.types.map((t) => `${k}:${t}`));
      v = r.s; ck[k] = v;
    }
    // 再验（脱敏后值仍须过约束——防 redacted 脏值进池）
    if (redact && typeof v === "string") {
      const judgedAfter = FIELD_RULES[k](v);
      if (judgedAfter !== true) problems.push(`${k} 脱敏后值不合约束：${judgedAfter}`);
    }
    for (const h of piiHits(v)) problems.push(`${k} 命中 PII（${h.type}）：${h.hit}`);
  }
  return { ok: problems.length === 0, problems, redacted: [...new Set(redacted)], checkpoint: ck };
}

const loadIndex = () => { try { return JSON.parse(fs.readFileSync(INDEX, "utf8")); } catch { return { version: 1, updated_at: null, entries: [] }; } };
const saveIndex = (ix) => { fs.mkdirSync(POOL, { recursive: true }); ix.updated_at = now(); fs.writeFileSync(INDEX, JSON.stringify(ix, null, 2) + "\n"); };
const entryPath = (id) => path.join(ENTRIES, `${id}.json`);
const nextId = () => {
  const d = new Date();
  const day = `CP-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-`;
  let max = 0;
  for (const e of loadIndex().entries) { const m = new RegExp(`^${day}(\\d+)$`).exec(e.id); if (m) max = Math.max(max, Number(m[1])); }
  return day + String(max + 1).padStart(2, "0");
};

function cmdUpload(src) {
  if (!src) die("用法：通道.mjs 上传 <候选.json> [--脱敏] [--id <条目id>]");
  let cand;
  try { cand = JSON.parse(fs.readFileSync(src, "utf8")); } catch (e) { die(`❌ 候选非法 JSON：${e.message}`); }
  const res = gate(cand, { redact: REDACT });
  if (!res.ok) {
    console.error(`❌ 拒收（${res.problems.length} 处）：`);
    for (const p of res.problems) console.error(`   - ${p}`);
    console.error("   池内零 PII／白名单外不进池——修正后重传；或在出侧先脱敏再走 --脱敏 重判");
    process.exit(1);
  }
  const id = FORCE_ID || nextId();
  if (!/^CP-[A-Za-z0-9-]{1,32}$/.test(id)) die(`❌ 非法条目 id：${id}`);
  const ix = loadIndex();
  if (ix.entries.some((e) => e.id === id)) die(`❌ 条目已存在：${id}`);
  fs.mkdirSync(ENTRIES, { recursive: true });
  const entry = { id, sample: cand.sample, source: cand.source, status: "候选", created_at: now(), checkpoint: res.checkpoint, gate: { verdict: res.redacted.length ? "redacted" : "pass", redacted: res.redacted } };
  fs.writeFileSync(entryPath(id), JSON.stringify(entry, null, 2) + "\n");
  ix.entries.push({ id, sample: entry.sample, source: entry.source, status: "候选", entry: rel(entryPath(id)), card: null, materials: [], redacted: res.redacted });
  saveIndex(ix);
  console.log(`✅ 入池（候选）：${id}（${entry.sample}·${entry.source}${res.redacted.length ? "·已脱敏 " + res.redacted.join("、") : ""}）`);
}

const escapeXml = (s) => String(s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
const synthSvg = (slot, id, sample) => `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <rect width="640" height="400" fill="#eef2f6"/>
  <text x="32" y="64" font-family="sans-serif" font-size="28" fill="#223">合成样张 · ${escapeXml(slot)}</text>
  <text x="32" y="116" font-family="sans-serif" font-size="20" fill="#556">条目 ${escapeXml(id)} · 样本 ${escapeXml(sample)}</text>
  <text x="32" y="156" font-family="sans-serif" font-size="20" fill="#556">非真实材料 · 仅供打磨环复跑</text>
  <text x="32" y="356" font-family="sans-serif" font-size="16" fill="#889">SAMPLE - NOT REAL</text>
</svg>
`;

function renderCard(e, reg, materials) {
  const rows = Object.entries(e.checkpoint).map(([k, v]) => `| ${k} | ${v === null ? "—" : String(v)} |`).join("\n");
  const mrows = materials.map((m) => `| ${m.slot} | ${m.path} | ${m.sha256.slice(0, 12)}… |`).join("\n") || "| — | （本样本无素材位） | — |";
  return `# 合成样本卡 ${e.id}

> 由「样本池通道」接收侧生成（结构→合成素材拼装）；**假样本假数据复跑**，真件永不入池。
> 生成于：${e.created_at}（卡内容与条目结构绑定·可复算）

## 一、基准样本与蓝图

- 基准样本卡：\`${reg.card}\`（相对 task-polish 根）
- 蓝图：\`${reg.blueprint}\`
- 条目来源：${e.source === "real" ? "真实使用卡点（仅结构化·去标识化）" : "沙盒跑批产物"}
- 出侧闸：${e.gate.verdict === "redacted" ? "脱敏入库（" + (e.gate.redacted.join("、") || "—") + "）" : "pass"}

## 二、卡点结构（白名单字段）

| 字段 | 值 |
|---|---|
${rows}

## 三、合成素材（仅合成件）

| 槽位 | 文件 | sha256 |
|---|---|---|
${mrows}

## 四、复跑协议

- 环入口：\`node 处理中心/机器闸/task-polish/样本池/通道.mjs 读池 ${e.id}\`
- 消费：按基准样本卡蓝图在沙盒复跑；以上表合成素材替换真材料；卡点按上表结构复现（相位/事件序定位、错误码/字段名注入）。
- 只读约定：本卡与素材是环的**输入**；跑批产物落跑批侧，不写回池。
`;
}

function cmdReceive(id) {
  if (!id) die("用法：通道.mjs 接收 <条目id>");
  const ix = loadIndex();
  const e = ix.entries.find((x) => x.id === id);
  if (!e) die(`❌ 无此条目：${id}`, 1);
  if (e.status === "归档") die(`❌ 条目已归档：${id}（不参与复跑）`, 1);
  const data = JSON.parse(fs.readFileSync(path.join(POOL, e.entry), "utf8")); // 结构/闸读条目件（索引为轻量件）
  const reg = REGISTRY.samples[e.sample];
  if (!reg) die(`❌ 样本未登记素材位：${e.sample}`, 2);
  const dir = path.join(MATERIALS, id);
  fs.mkdirSync(dir, { recursive: true });
  const materials = reg.materials.map((slot) => {
    const f = path.join(dir, `${slot}.svg`);
    fs.writeFileSync(f, synthSvg(slot, e.id, e.sample));
    const buf = fs.readFileSync(f);
    return { slot, path: rel(f), synthetic: true, bytes: buf.length, sha256: sha256(buf) };
  });
  const card = path.join(ENTRIES, `${id}.卡.md`);
  fs.writeFileSync(card, renderCard(data, reg, materials));
  e.status = "在用"; e.card = rel(card); e.materials = materials;
  saveIndex(ix);
  console.log(`✅ 合成样本卡生成：${rel(card)}（合成素材 ${materials.length} 件·仅合成件）`);
}

function manifests(ix, one) {
  const list = one ? ix.entries.filter((e) => e.id === one) : ix.entries.filter((e) => e.status === "在用");
  if (one && !list.length) die(`❌ 无此条目：${one}`, 1);
  return list.map((e) => {
    const reg = REGISTRY.samples[e.sample] || {};
    const missing = [];
    if (e.status !== "在用") missing.push(`状态非在用（${e.status}）`);
    if (!e.card || !fs.existsSync(path.join(POOL, e.card))) missing.push("卡缺件");
    for (const m of e.materials || []) if (!fs.existsSync(path.join(POOL, m.path))) missing.push(`素材缺件 ${m.path}`);
    if (missing.length) die(`❌ 池完整性核不过：${e.id} —— ${missing.join("；")}`, 1);
    const data = JSON.parse(fs.readFileSync(path.join(POOL, e.entry), "utf8")); // 结构读条目件（索引为轻量件）
    return {
      id: e.id, sample: e.sample, source: e.source, status: e.status,
      blueprint: reg.blueprint || null, base_card: reg.card || null,
      card: e.card, materials: e.materials || [], structure: data.checkpoint,
      protocol: { mode: "假样本复跑", note: "按基准样本卡蓝图在沙盒复跑；素材＝本卡合成件；跑批产物不写回池" },
    };
  });
}

function cmdRead(id) {
  const ix = loadIndex();
  console.log(JSON.stringify({ pool: POOL, entries: manifests(ix, id) }, null, 2));
}

const walk = (dir) => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
};

function cmdScan() {
  const hits = [];
  const ix = loadIndex();
  const claimed = new Set();
  for (const e of ix.entries) {
    if (!inPool(e.entry)) {
      // A#13：索引路径越界=命中拒（不读池外）
      hits.push(`条目 ${e.id} 索引路径越界（拒读）：${e.entry}`);
    } else {
      const ep = path.join(POOL, e.entry);
      if (!fs.existsSync(ep)) hits.push(`索引条目缺件：${e.entry}`);
      else {
        const raw = fs.readFileSync(ep, "utf8");
        claimed.add(e.entry);
        let obj;
        try { obj = JSON.parse(raw); } catch { hits.push(`条目非法 JSON：${e.entry}`); continue; }
        const res = gate({ sample: obj.sample, source: obj.source, checkpoint: obj.checkpoint });
        for (const p of res.problems) hits.push(`条目 ${e.id}：${p}`);
        for (const h of piiHits(stripHashes(raw), TEXT_RULES)) hits.push(`条目 ${e.id} 正文命中 ${h.type}：${h.hit}`);
      }
    }
    if (e.status === "在用") {
      if (!e.card || !inPool(e.card) || !fs.existsSync(path.join(POOL, e.card))) hits.push(`在用条目缺卡：${e.id}`);
      else { claimed.add(e.card); for (const h of piiHits(stripHashes(fs.readFileSync(path.join(POOL, e.card), "utf8")), TEXT_RULES)) hits.push(`卡 ${e.card} 命中 ${h.type}：${h.hit}`); }
    } else if (e.card && inPool(e.card)) claimed.add(e.card);
    for (const m of e.materials || []) {
      if (!inPool(m.path)) {
        // A#13：素材路径越界=命中拒（不读池外）
        hits.push(`素材路径越界（拒读）：${m.path}`);
        continue;
      }
      const mp = path.join(POOL, m.path);
      claimed.add(m.path);
      if (!m.synthetic) hits.push(`素材未标合成：${m.path}`);
      if (!fs.existsSync(mp)) { hits.push(`素材缺件：${m.path}`); continue; }
      const buf = fs.readFileSync(mp);
      if (sha256(buf) !== m.sha256) hits.push(`素材哈希不符（疑被改）：${m.path}`);
      if (![".svg", ".md", ".txt", ".json"].includes(path.extname(mp).toLowerCase())) hits.push(`素材非合成格式（疑真件）：${m.path}`);
      else for (const h of piiHits(stripHashes(buf.toString("utf8")), TEXT_RULES)) hits.push(`素材 ${m.path} 命中 ${h.type}：${h.hit}`);
    }
  }
  for (const f of walk(ENTRIES)) if (!claimed.has(rel(f))) hits.push(`条目区未登记文件（疑真件）：${rel(f)}`);
  for (const f of walk(MATERIALS)) if (!claimed.has(rel(f))) hits.push(`素材区未登记文件（疑真件）：${rel(f)}`);
  const rootAllow = new Set(["索引.json", "README.md", "合规清单.md", "素材位.json", "通道.mjs", "自检.mjs"]);
  for (const f of fs.readdirSync(POOL)) if (!["条目", "素材"].includes(f) && !rootAllow.has(f)) hits.push(`池根未登记文件：${f}`);
  if (hits.length) {
    console.error(`❌ 池扫描：命中 ${hits.length} 处（零真件红线不达）`);
    for (const h of hits) console.error(`   - ${h}`);
    process.exit(1);
  }
  console.log(`✅ 池扫描：0 命中（条目 ${ix.entries.length}｜素材 ${[...claimed].filter((p) => p.startsWith("素材/")).length}｜含素材位）——零真件`);
}

function cmdArchive(id) {
  if (!id) die("用法：通道.mjs 归档 <条目id>");
  const ix = loadIndex();
  const e = ix.entries.find((x) => x.id === id);
  if (!e) die(`❌ 无此条目：${id}`, 1);
  e.status = "归档";
  saveIndex(ix);
  console.log(`✅ 已归档：${id}（文件保留·不再参与复跑）`);
}

switch (cmd) {
  case "上传": cmdUpload(args[0]); break;
  case "接收": cmdReceive(args[0]); break;
  case "读池": cmdRead(args[0]); break;
  case "扫描": cmdScan(); break;
  case "归档": cmdArchive(args[0]); break;
  default:
    console.error("用法：通道.mjs 上传 <候选.json> [--脱敏] [--id <条目id>]｜接收 <条目id>｜读池 [<条目id>]｜扫描｜归档 <条目id>");
    console.error("全局：--池 <dir>（测试隔离）");
    process.exit(2);
}
