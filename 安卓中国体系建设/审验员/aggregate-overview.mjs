// aggregate-overview.mjs — 全体系工单总览：读 体系清单.json → 聚合所有工单库 → 生成自包含总看板.html
// 用法：node 审验员/aggregate-overview.mjs [--only <体系名>] （在 安卓中国体系建设 根跑）
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(__dirname, "体系清单.json");
const OUT = path.join(ROOT, "总看板.html");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

if (!fs.existsSync(MANIFEST)) { console.error("缺 体系清单.json"); process.exit(1); }
const systems = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const targets = only ? systems.filter(s => s.name === only) : systems;

const KEEP = new Set(["merged", "archived"]);
const PRI_RE = /\*\*优先级\*\*[：:]\s*([P0-9]{1,2})/;
const ST_RE = /\*\*状态\*\*[：:]\s*([^\n|]+)/;

function parseLib(libPath) {
  if (!fs.existsSync(libPath)) return { cards: [], err: "缺库" };
  const text = fs.readFileSync(libPath, "utf8");
  const blocks = text.split(/^(?=#{1,2} [A-Z]{2,6}[-—])/m);
  const cards = [];
  for (const b of blocks) {
    const m = b.match(/^#{1,2} ([A-Z]{2,6}[-—][A-Za-z0-9]{1,4})/m);
    if (!m || !m[1].trim()) continue;
    const no = m[1].trim();
    const stm = b.match(ST_RE);
    const prm = b.match(PRI_RE);
    const title = b.match(/\*\*标题\*\*[：:]\s*(.+)/);
    const stage = (stm?.[1] || "").trim();
    cards.push({
      no, title: (title?.[1] || "").trim().slice(0, 60),
      stage, pri: prm?.[1] || "",
    });
  }
  return { cards };
}

const rows = [];
let total = 0, done = 0, active = 0, hold = 0;
for (const s of targets) {
  const lib = path.resolve(ROOT, "../", s.lib.replace(/^\.\.\//, ""));
  const { cards, err } = parseLib(lib);
  if (err) { console.log("⚠️", s.name, err); continue; }
  for (const c of cards) {
    const st = c.stage.startsWith("已合") || c.stage === "merged" || c.stage.startsWith("合 main") ? "merged" : "active";
    c.stageSimple = st;
    rows.push({ sys: s.name, color: s.color, ...c });
    total++;
    if (st === "merged") done++; else active++;
  }
  console.log(`${s.name}: ${cards.length} 卡`);
}

const bySys = {};
for (const r of rows) (bySys[r.sys] ||= []).push(r);

const statCards = [
  { k: "total", zh: "总卡", n: total, cls: "#111827" },
  { k: "done", zh: "终态", n: done, cls: "#059669" },
  { k: "active", zh: "在流", n: active, cls: "#2563EB" },
];
const sysRows = Object.entries(bySys).map(([sys, cs]) => {
  const d = cs.filter(c => c.stageSimple === "merged").length;
  return `<tr><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0"><b style="color:${cs[0].color}">${esc(sys)}</b></td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0">${cs.length}</td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0">${d}</td><td style="padding:6px 10px;border-bottom:1px solid #f0f0f0">${cs.length - d}</td></tr>`;
}).join("");

const rowsHtml = rows.map(r => `<tr><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5"><span style="color:${r.color};font-weight:600">${esc(r.sys)}</span></td><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5">${esc(r.no)}</td><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5">${esc(r.title)}</td><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5">${esc(r.stage)}</td><td style="padding:6px 10px;border-bottom:1px solid #f5f5f5">${esc(r.pri)}</td></tr>`).join("");

const html = `<!DOCTYPE html>
<html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MOV 全体系工单总览</title>
<style>body{font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif;background:#f7f7f8;margin:0;padding:24px;color:#111} h1{font-size:20px;margin:0 0 4px} .sub{color:#6b7280;font-size:12px;margin-bottom:16px}
.cards{display:flex;gap:12px;margin-bottom:20px}.card{background:#fff;border-radius:10px;padding:14px 22px;box-shadow:0 1px 3px rgba(0,0,0,.06)}.card .n{font-size:26px;font-weight:700}.card .z{font-size:12px;color:#6b7280}
.panel{background:#fff;border-radius:10px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-bottom:16px}.panel h2{font-size:14px;margin:0 0 10px;color:#374151}
table{border-collapse:collapse;width:100%;font-size:13px}th{text-align:left;color:#6b7280;font-weight:500;padding:6px 10px;border-bottom:2px solid #eee}
.foot{color:#9ca3af;font-size:11px;margin-top:16px}
</style></head><body>
<h1>MOV 全体系工单总览</h1>
<div class="sub">由 审验员/aggregate-overview.mjs 生成 · ${new Date().toLocaleString("zh-CN")} · 数据源：各体系 \`工单库.md\`（${targets.length} 个体系）</div>
<div class="cards">${statCards.map(c => `<div class="card"><div class="n" style="color:${c.cls}">${c.n}</div><div class="z">${c.zh}</div></div>`).join("")}</div>
<div class="panel"><h2>按体系</h2><table><thead><tr><th>体系</th><th>卡数</th><th>终态</th><th>在流</th></tr></thead><tbody>${sysRows || `<tr><td colspan="4">暂无</td></tr>`}</tbody></table></div>
<div class="panel"><h2>全部工单</h2><table><thead><tr><th>体系</th><th>单号</th><th>标题</th><th>状态</th><th>级</th></tr></thead><tbody>${rowsHtml || `<tr><td colspan="5">全部库暂无卡（各体系复制 工单系统模板/工单库.模板.md 起卡）</td></tr>`}</tbody></table></div>
<div class="foot">生成：node 审验员/aggregate-overview.mjs（可加 --only 体系名 看单体系）· 本文件自包含，双击即看</div>
</body></html>`;

fs.writeFileSync(OUT, html);
console.log(`✅ 总看板 → ${OUT}（${rows.length} 卡 · 终态 ${done} · 在流 ${active}）`);
