// design-audit.mjs — 方案库全景审计（治理：版本链/状态/落地追踪）
// 扫描 设计师/方案设计/**/*.md → 按「方案主题」分组版本链 → 状态探测 → 实施工单关联 → 方案全景.html
// 用法：node 审验员/design-audit.mjs [--dir <自定义根>]
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOC = process.argv.includes("--dir") ? process.argv[process.argv.indexOf("--dir") + 1] : path.join(ROOT, "设计师", "方案设计");
const OUT = path.join(ROOT, "方案全景.html");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const V_RE = /[vV](\d+(?:\.\d+){0,2})/;
const FINAL_RE = /最终版|终稿|定稿版|final/i;
const STATE_RE = /\*\*(?:方案状态|状态|评审状态)\*\*[：:]\s*([^\n|]+)/;
const IMPL_RE = /(UPG|SYS|W|IOS|PC|HMOS|WX|CLOUD|OPS|WEB|GP)-?\d+/g;
const STAGE_RE = /(草稿|评审中|送审|定稿|已实施|已落地|已废弃|已挂起|挂起|废弃)/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith(".md")) out.push(full);
  }
  return out;
}

const files = walk(DOC);
const items = [];
for (const f of files) {
  const rel = path.relative(DOC, f).replace(/\\/g, "/");
  const doc = fs.readFileSync(f, "utf8");
  const head = doc.slice(0, 1200);
  // 方案主题：路径 + 文件名去版本/日期
  const base = path.posix.basename(rel, ".md");
  const noVer = base
    .replace(/_v?\d+(?:\.\d+){0,2}(?:_|$)/gi, "")
    .replace(/_?\d{4}-\d{2}-\d{2}(?:_\d{2})?$/, "")
    .replace(/(设计|方案|送审|初稿|评审|意见|定稿|改造|体系)$/g, "")
    .replace(/[_\-\s]+/g, " ")
    .trim();
  const ver = (base.match(V_RE) || [])[1] || (FINAL_RE.test(base) ? "final" : "?");
  // 状态探测
  let state = (head.match(STATE_RE) || [])[1] || "";
  let state2 = "";
  if (!state) { const m = head.match(STAGE_RE); state2 = m ? m[1] : "未标注"; }
  const tickets = [...new Set((doc.match(IMPL_RE) || []).map(t => t.replace(/-(\d)/, "-$1")))].slice(0, 4);
  items.push({
    rel, base, theme: noVer || base, ver,
    state: state.trim() || state2,
    hasState: !!state,
    tickets: tickets.join(", "),
    size: doc.length,
  });
}

// 分组：主题 → 版本链
const byTheme = {};
for (const it of items) (byTheme[it.theme] ||= []).push(it);
const themes = Object.entries(byTheme).map(([t, its]) => {
  its.sort((a, b) => (a.ver === "?" ? -1 : 0) - (b.ver === "?" ? -1 : 0) || a.ver.localeCompare(b.ver));
  const final = its.find(i => i.state.includes("定稿") || i.state.includes("实施") || i.state.includes("落地")) || its[its.length - 1];
  return { theme: t, count: its.length, final, versions: its };
}).sort((a, b) => b.versions.length - a.versions.length);

const stats = {
  total: items.length,
  themes: themes.length,
  multi: themes.filter(t => t.count > 1).length,
  noState: items.filter(i => !i.hasState && !("未标注" !== i.state)).length,
  unmarked: items.filter(i => i.state === "未标注").length,
  implemented: items.filter(i => /已实施|已落地/.test(i.state)).length,
  finaled: items.filter(i => /定稿/.test(i.state)).length,
};

const themeRows = themes.map(t => {
  const v = t.versions.map(i => `<span style="display:inline-block;margin:2px 4px;padding:2px 8px;border-radius:8px;font-size:11px;background:${i.state.includes("定稿") ? "#D1FAE5" : i.state.includes("实施") || i.state.includes("落地") ? "#DBEAFE" : "#F3F4F6"};color:${i.state.includes("实施") || i.state.includes("落地") ? "#1D4ED8" : "#374151"}">v${esc(i.ver)} <span style="opacity:.7">· ${esc(i.state.slice(0, 10))}</span>${i.tickets ? ` <b style="color:#7C3AED">→${esc(i.tickets.split(",")[0])}</b>` : ""}</span>`).join("");
  return `<tr><td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;font-weight:600">${esc(t.theme)}</td><td style="padding:8px 10px;border-bottom:1px solid #f0f0f0">${t.count} 版</td><td style="padding:8px 10px;border-bottom:1px solid #f0f0f0">${v}</td></tr>`;
}).join("");

const html = `<!DOCTYPE html>
<html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>方案库全景</title>
<style>body{font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif;background:#f7f7f8;margin:0;padding:24px;color:#111} h1{font-size:20px;margin:0 0 4px} .sub{color:#6b7280;font-size:12px;margin-bottom:16px}
.cards{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}.card{background:#fff;border-radius:10px;padding:14px 22px;box-shadow:0 1px 3px rgba(0,0,0,.06)}.card .n{font-size:26px;font-weight:700}.card .z{font-size:12px;color:#6b7280}
.panel{background:#fff;border-radius:10px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-bottom:16px}.panel h2{font-size:14px;margin:0 0 10px;color:#374151}
table{border-collapse:collapse;width:100%;font-size:13px}th{text-align:left;color:#6b7280;font-weight:500;padding:6px 10px;border-bottom:2px solid #eee}
.foot{color:#9ca3af;font-size:11px;margin-top:16px}.warn{color:#b45309}
</style></head><body>
<h1>MOV 方案库全景</h1>
<div class="sub">审验员/design-audit.mjs · ${new Date().toLocaleString("zh-CN")} · 扫描：设计师/方案设计（${stats.total} 个文档 → ${stats.themes} 个方案主题）</div>
<div class="cards">
  <div class="card"><div class="n">${stats.themes}</div><div class="z">方案主题</div></div>
  <div class="card"><div class="n">${stats.total}</div><div class="z">文档（含版本）</div></div>
  <div class="card"><div class="n" style="color:#7C3AED">${stats.multi}</div><div class="z">多版本方案</div></div>
  <div class="card"><div class="n" style="color:#0EA5E9">${stats.implCombined ?? 0}</div><div class="z">已实施</div></div>
  <div class="card"><div class="n" style="color:#B45309">${stats.unmarked}</div><div class="z">状态未标注</div></div>
</div>
<div class="panel"><h2>⚠️ 卫生提醒</h2><ul style="font-size:13px;color:#92400E;margin:0;padding-left:18px">
  <li>${stats.unmarked} 份文档未标注「方案状态」——建议补齐：草稿/评审中/定稿/已实施/已废弃</li>
  <li>${stats.multi} 个方案多版本并存——定稿后旧版本应标「已废弃」或移入 <code>_体系存档</code>（保留历史，不再扫描误判）</li>
  <li>已实施方案再迭代：升版本 + 卡内「实施工单」反链——版本链只在 <code>方案全景</code> 展示，不产生新目录</li>
</ul></div>
<div class="panel"><h2>方案主题 × 版本链 × 状态 × 实施工单</h2><table><thead><tr><th>方案主题</th><th>版本数</th><th>版本链（v=版本 · 状态 · →实施工单）</th></tr></thead><tbody>${themeRows || `<tr><td colspan="3">空</td></tr>`}</tbody></table></div>
<div class="foot">状态词表：草稿/评审中/定稿/已实施(落地)/已废弃/已挂起；实施工单 = 文档正文出现的首个工单号（实施单）；根治办法 = 定稿时设计师在方案头部填「方案状态」+「实施工单」，废弃旧版本在文件头标「已废弃」</div>
</body></html>`;

fs.writeFileSync(OUT, html);
console.log(`✅ 方案全景 → ${OUT}`);
console.log(`方案主题 ${stats.themes} · 文档 ${stats.total} · 多版本 ${stats.multi} · 状态未标注 ${stats.unmarked}`);
if (stats.unmarked > 0) process.exit(1); // 提示级：未标注多 = 卫生待补（不阻断生成）
process.exit(0);
