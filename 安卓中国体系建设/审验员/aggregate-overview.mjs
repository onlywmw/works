// aggregate-overview.mjs — 全体系工单总览 v1.1（评审采纳：Registry/Ownership/Stage 三验证 + 跨体系引用）
// 用法：node 审验员/aggregate-overview.mjs [--only <体系名>] （在 安卓中国体系建设 根跑）
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(__dirname, "体系清单.json");
const OUT = path.join(ROOT, "处理中心", "验证产物", "总看板.html");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// === 状态词表（P0-1 评审：STAGE_VALIDATOR 配置化） ===
const STAGE = {
  allowed: ["已立卡", "已派单", "施工中", "交付待验收", "验收通过", "回炉", "已合 main", "已作废", "已归档", "merged", "archived"],
  terminal: ["已合 main", "已作废", "已归档", "merged", "archived"],
  aliases: { "已合 main": "已合 main", "已合并": "已合 main", merged: "已合 main", archived: "已归档" },
};

function normalizeStage(raw) {
  let t = (raw || "").trim();
  // ① 去前导 emoji/装饰符号（📌🔨✅⚠️→ 等）
  t = t.replace(/^[^\u4e00-\u9fa5A-Za-z]+/, "");
  // ② 去 ** 包裹
  t = t.replace(/\*\*/g, "");
  // ③ 链式状态（方案 v3 定稿→ 🔨已派单）→ 取最后一段
  t = t.split("→").pop().trim();
  // ④ 去 @日期尾巴、括号注释
  t = t.replace(/@[\d-]+.*$/, "").trim();
  t = t.replace(/\s*（.*?）\s*/g, "").replace(/\s*\(.*?\)\s*/g, "").trim();
  // ⑤ 「已派单·待认领」→ 取主状态词
  t = t.replace(/[、·].*$/, "");
  // ⑥ alias 归一（STAGE_VALIDATOR aliases 配置化——评审 Q1）
  if (/复核通过|验收员通过|验收通过待合|待合 main/.test(t)) t = "验收通过";
  else if (/已合并|已合入|设计师合入/.test(t)) t = "已合 main";
  else if (/程序员完成|已交付/.test(t)) t = "交付待验收";
  else if (/挂单/.test(t)) t = "已立卡";
  t = t.trim();
  if (STAGE.allowed.includes(t)) return { text: t, cls: STAGE.terminal.includes(t) ? "ok" : "active" };
  return { text: t || "【缺失】", cls: "bad" };
}

const FEATURES = JSON.parse(fs.readFileSync(path.join(__dirname, "功能树.json"), "utf8"));
const FEATURE_PATHS = new Set(FEATURE_TREE().map(f => f.path));
function FEATURE_TREE() { return FEATURES.tree; }

// === FEATURE_VALIDATOR（v1.2：功能域必须在功能树中） ===
const FEATURE_RE = /\*\*功能域\*\*[：:][ ]*([^\n|]+)/;
const FEATURE_REL_RE = /\*\*关联功能域\*\*[：:][ ]*([^\n|]+)/;
const FEATURE_ID_RE = /\*\*feature_id\*\*[：:][ ]*([A-Z0-9-]+)/; // immutable id（P0-2）
function parseFeaturePaths(raw) {
  if (!raw || !raw.trim()) return [];
  return raw.split(/[、,，;；\s]+/).map(s => s.trim().replace(/^\/+|\/+$/g, "")).filter(Boolean);
}
function validateFeature(raw, relRaw, featId) {
  if (featId) {
    const found = FEATURES.tree.some(f => f.feature_id === featId.trim());
    if (!found) return { primary: parseFeaturePaths(raw), related: parseFeaturePaths(relRaw), bad: ["feature_id 不在功能树: " + featId] };
  }
  const primary = parseFeaturePaths(raw);
  const related = parseFeaturePaths(relRaw);
  const bad = [];
  if (primary.length === 0) bad.push("主功能域缺失（primary 必填唯一）");
  if (primary.length > 1) bad.push("主功能域 ≥2（违反单主约束）");
  for (const p2 of primary) if (!FEATURE_PATHS.has(p2)) bad.push("主功能域不在树: " + p2);
  for (const r of related) if (!FEATURE_PATHS.has(r)) bad.push("关联功能域不在树: " + r);
  return { primary, related, bad };
}

// === Registry Validator（P0-1） ===
function validateRegistry(systems) {
  const errs = [];
  const seenName = new Set(), seenPrefix = new Set(), seenLib = new Set();
  for (const s of systems) {
    if (!s.id || !s.name || !s.prefix || !s.lib) errs.push(`${s.name || s.id}: 缺 id/name/prefix/lib`);
    if (seenName.has(s.name)) errs.push(`name 重复: ${s.name}`);
    if (seenPrefix.has(s.prefix)) errs.push(`prefix 重复: ${s.prefix}`);
    if (seenLib.has(s.lib)) errs.push(`lib 重复: ${s.lib}`);
    seenName.add(s.name); seenPrefix.add(s.prefix); seenLib.add(s.lib);
    const p = path.resolve(ROOT, "..", s.lib.replace(/^\.\.\//, ""));
    if (!fs.existsSync(p)) errs.push(`${s.name}: 库不存在 ${s.lib}`);
    if (s.enabled === false) errs.push(`${s.name}: enabled=false 跳过`);
  }
  return errs;
}

// === 库解析（兼容 #/## 卡标题；P0-5 读 depends_on/blocks） ===
const PRI_RE = /\*\*优先级\*\*[：:]\s*([P0-9]{1,2})/;
const ST_RE = /\*\*状态\*\*[：:]\s*([^\n|]+)/;
const DEP_RE = /\*\*(?:depends_on|depends-on|依赖)\*\*[：:]\s*([^\n|]+)/;
const BLK_RE = /\*\*(?:blocks|阻塞)\*\*[：:]\s*([^\n|]+)/;

function parseLib(libPath, sysDef) {
  if (!fs.existsSync(libPath)) return { cards: [], err: `缺库 ${libPath}` };
  const text = fs.readFileSync(libPath, "utf8");
  const blocks = text.split(/^(?=#{1,2} [A-Z]{2,6}[-—])/m);
  const cards = [];
  for (const b of blocks) {
    const m = b.match(/^#{1,2} ([A-Z]{2,6}[-—][A-Za-z0-9]{1,4})/m);
    if (!m || !m[1].trim()) continue;
    const no = m[1].trim();
    const title = b.match(/\*\*标题\*\*[：:]\s*(.+)/);
    const stm = b.match(ST_RE);
    const prm = b.match(PRI_RE);
    const stage = normalizeStage(stm?.[1] || "");
    // === Ownership Validator（P0-2）：卡 ID 前缀 == Registry.prefix == 库归属 ===
    const idPrefix = no.split(/[-—]/)[0];
    const allowedPrefix = new Set([sysDef.prefix.replace(/-$/, ""), ...(sysDef.retired_prefixes || [])].map(x => x.toUpperCase()));
    const ownershipOk = allowedPrefix.has(idPrefix.toUpperCase());
    cards.push({
      no, title: (title?.[1] || "").trim().slice(0, 60),
      stage,
      pri: prm?.[1] || "",
      dep: (b.match(DEP_RE)?.[1] || "").trim(),
      blk: (b.match(BLK_RE)?.[1] || "").trim(),
      feat: validateFeature(b.match(FEATURE_RE)?.[1] || "", b.match(FEATURE_REL_RE)?.[1] || "", b.match(FEATURE_ID_RE)?.[1] || ""),
      ownershipOk,
    });
  }
  return { cards };
}

if (!fs.existsSync(MANIFEST)) { console.error("缺 体系清单.json"); process.exit(1); }
const systems = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const regErrs = validateRegistry(systems);
if (regErrs.length) { console.error("❌ Registry 校验失败:"); for (const e of regErrs) console.error("  -", e); process.exit(1); }
console.log("✅ Registry 校验通过（9 体系）");

const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const targets = only ? systems.filter(s => s.name === only) : systems.filter(s => s.enabled !== false);

const rows = [];
let warnings = [];
let badStageCount = 0;
let missingFeatCount = 0;
for (const s of targets) {
  const lib = path.resolve(ROOT, "..", s.lib.replace(/^\.\.\//, ""));
  const { cards, err } = parseLib(lib, s);
  if (err) { warnings.push(err); console.log("⚠️", err); continue; }
  for (const c of cards) {
    if (!c.ownershipOk) warnings.push(`${s.name}/${c.no}: 前缀与注册表不符（库归属校验 FAIL）`);
    if (c.stage.cls === "bad") badStageCount++;
    if (c.feat) {
      const serious = c.feat.bad.filter(b => !b.startsWith("主功能域缺失"));
      if (serious.length) warnings.push(`${s.name}/${c.no}: 功能域校验 [${serious.join(" | ")}]`);
      if (c.feat.bad.some(b => b.startsWith("主功能域缺失"))) missingFeatCount++;
    }
    rows.push({ sys: s.name, color: s.color, ...c });
  }
  console.log(`${s.name}: ${cards.length} 卡${!s.enabled ? "（disabled）" : ""}`);
}

// === 统计口径（P0-6 评审）：当前工作量排除 archived/void ===
const TERMINAL = new Set(["已合 main", "merged"]);
const VOIDISH = new Set(["已作废", "已归档", "archived"]);
let total = 0, done = 0, active = 0, voided = 0;
for (const r of rows) {
  total++;
  const st = r.stage.text;
  if (VOIDISH.has(st)) voided++;
  else if (TERMINAL.has(st)) done++;
  else active++;
}

// === 跨体系引用（P0-5）：校验引用目标存在 ===
const allNos = new Set(rows.map(r => r.no));
let refIssues = [];
for (const r of rows) {
  for (const ref of [r.dep, r.blk]) {
    if (!ref) continue;
    for (const t of ref.split(/\s*[、,，;；]\s*/)) {
      const pp = (t.match(/[A-Z]{2,6}[-—][A-Za-z0-9]{1,4}/) || [])[0];
      if (pp && !allNos.has(pp)) refIssues.push(`${r.no} 引用 ${pp}（未找到）`);
    }
  }
}

// === HTML ===
const bySys = {};
for (const r of rows) (bySys[r.sys] ||= []).push(r);
const sysRows = Object.entries(bySys).map(([sys, cs]) => {
  const d = cs.filter(c => TERMINAL.has(c.stage.text)).length;
  const v = cs.filter(c => VOIDISH.has(c.stage.text)).length;
  return `<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0"><b style="color:${cs[0].color}">${esc(sys)}</b></td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0">${cs.length}</td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0">${d}</td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0">${cs.length - d - v}</td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0">${v}</td></tr>`;
}).join("");

const stageCls = (c) => c === "ok" ? "#059669" : c === "active" ? "#2563EB" : "#DC2626";
const rowsHtml = rows.map(r => `<tr><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5"><span style="color:${r.color};font-weight:600">${esc(r.sys)}</span></td><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5">${esc(r.no)}</td><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5">${esc(r.title)}</td><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5;color:${stageCls(r.stage.cls)};font-weight:600">${esc(r.stage.text)}</td><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5">${esc(r.pri)}</td><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5;color:#6b7280;font-size:11px">${r.feat ? esc(r.feat.primary.join(",") || "") + (r.feat.related.length ? " ↪" + esc(r.feat.related.join(",")) : "") : ""}</td><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5;color:#9ca3af;font-size:11px">${r.dep ? "↳" + esc(r.dep) : r.blk ? "⊘" + esc(r.blk) : ""}</td></tr>`).join("");

const featNote = missingFeatCount ? `<div class="panel"><h2 style="color:#d97706">ℹ️ ${missingFeatCount} 张卡未填功能域（历史卡待补录——新卡必填）</h2></div>` : "";
const warnNote = badStageCount ? `<div class="panel"><h2 style="color:#d97706">ℹ️ 历史状态未规范化 ${badStageCount} 条（仅提示——新卡强制合法状态）</h2></div>` : "";
const warnHtml = warnings.length || refIssues.length
  ? `<div class="panel" style="border:1px solid #fca5a5"><h2 style="color:#DC2626">⚠️ 校验告警（${warnings.length + refIssues.length}）</h2><ul style="font-size:12px;color:#991b1b;margin:0;padding-left:18px">${[...warnings, ...refIssues].map(w => `<li>${esc(w)}</li>`).join("")}</ul></div>`
  : "";

const statCards = [
  { zh: "总卡（当前工作量域）", n: total, cls: "#111827" },
  { zh: "已合 main", n: done, cls: "#059669" },
  { zh: "在流", n: active, cls: "#2563EB" },
  { zh: "作废/归档（历史）", n: voided, cls: "#9ca3af" },
];

let html = `<!DOCTYPE html>
<html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MOV 全体系工单总览</title>
<style>body{font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif;background:#f7f7f8;margin:0;padding:24px;color:#111} h1{font-size:20px;margin:0 0 4px} .sub{color:#6b7280;font-size:12px;margin-bottom:16px}
.cards{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}.card{background:#fff;border-radius:10px;padding:14px 22px;box-shadow:0 1px 3px rgba(0,0,0,.06)}.card .n{font-size:26px;font-weight:700}.card .z{font-size:12px;color:#6b7280}
.panel{background:#fff;border-radius:10px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-bottom:16px}.panel h2{font-size:14px;margin:0 0 10px;color:#374151}
table{border-collapse:collapse;width:100%;font-size:13px}th{text-align:left;color:#6b7280;font-weight:500;padding:6px 10px;border-bottom:2px solid #eee}
.foot{color:#9ca3af;font-size:11px;margin-top:16px}
</style></head><body>
<h1>MOV 全体系工单总览</h1>
<div class="sub">v1.1（评审采纳）· ${new Date().toLocaleString("zh-CN")} · 数据源：${targets.length} 个体系库 · Registry/Ownership/Stage 校验已跑</div>
<div class="cards">${statCards.map(c => `<div class="card"><div class="n" style="color:${c.cls}">${c.n}</div><div class="z">${c.zh}</div></div>`).join("")}</div>
${featNote}${warnNote}${warnHtml}
<div class="panel"><h2>按体系</h2><table><thead><tr><th>体系</th><th>卡数</th><th>已合 main</th><th>在流</th><th>作废/归档</th></tr></thead><tbody>${sysRows || `<tr><td colspan="5">暂无</td></tr>`}</tbody></table></div>
<div class="panel"><h2>全部工单</h2><table><thead><tr><th>体系</th><th>单号</th><th>标题</th><th>状态</th><th>级</th><th>功能域</th><th>引用</th></tr></thead><tbody>${rowsHtml || `<tr><td colspan="6">全部库暂无卡（各体系复制 工单系统模板/工单库.模板.md 起卡）</td></tr>`}</tbody></table></div>
<div class="foot">生成：node 审验员/aggregate-overview.mjs（--only 体系名 看单体系）· 只读投影 · 口径：当前工作量=总卡（作废/归档独立统计）</div>
</body></html>`;

  // === Snapshot Manifest（P0-6） ===
  {
    const crypto = await import("crypto");
    const { execSync } = await import("child_process");
    const shasum = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 12);
    const libCommits = {};
    for (const s of targets) {
      const lib = path.resolve(ROOT, "..", s.lib.replace(/^\.\.\//, ""));
      const rel = path.relative("C:/Users/Administrator/Desktop/MOV", lib).replace(/\\/g, "/");
      let commit = "n/a";
      try { commit = execSync("git -C C:/Users/Administrator/Desktop/MOV log -1 --format=%h -- " + JSON.stringify(rel), { encoding: "utf8" }).trim(); } catch {}
      libCommits[s.id] = { lib: rel, commit, cards: (bySys[s.name] || []).length };
    }
    const status = (warnings.length || refIssues.length) ? "INVALID" : ((badStageCount || missingFeatCount) ? "WARNING" : "VALID");
    const snapshot = {
      generated_at: new Date().toLocaleString("zh-CN"),
      registry_hash: shasum(JSON.stringify(systems)),
      feature_tree_version: FEATURES.tree_version,
      feature_tree_hash: shasum(JSON.stringify(FEATURES)),
      systems: libCommits,
      errors: warnings.length + refIssues.length,
      status,
    };
    html = html.replace("</body>", '<script id="snapshot" type="application/json">' + JSON.stringify(snapshot) + '</script>\n</body>');
    const bar = status === "WARNING"
      ? '<div style="background:#FEF3C7;color:#92400E;padding:8px 16px;border-radius:8px;margin-bottom:12px;font-size:13px;font-weight:600">⚠️ SNAPSHOT WARNING — 有提示级问题（历史状态/功能域待补录），快照仍可用</div>'
      : status === "INVALID"
        ? '<div style="background:#FEE2E2;color:#991B1B;padding:8px 16px;border-radius:8px;margin-bottom:12px;font-size:13px;font-weight:700">🔴 SNAPSHOT INVALID — 有错误级校验失败，本快照不可用于决策</div>'
        : "";
    html = html.replace("<h1>MOV 全体系工单总览</h1>", bar + "<h1>MOV 全体系工单总览</h1>");
    console.log("📸 Snapshot: " + status + "（" + snapshot.generated_at + "）");
  }
fs.writeFileSync(OUT, html);
console.log(`✅ 总看板 → ${OUT}（${rows.length} 卡 · 终态 ${done} · 在流 ${active} · 历史 ${voided}）`);
if (warnings.length || refIssues.length) { console.log(`⚠️ 告警 ${warnings.length + refIssues.length} 条（详见看板）`); process.exit(1); }
