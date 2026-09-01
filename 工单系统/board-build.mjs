// board-build.mjs — E4 看板 v2（前端设计版）构建：orders-data → 模板 → orders-overview.html
// 用法：node board-build.mjs（在 工单系统 根）；读 处理中心/验证产物/orders-overview.data.json（由 orders-overview.mjs 生成）
import fs from "fs";

const DATA_JSON = "处理中心/验证产物/orders-overview.data.json";
const TPL = "设计师/前端设计/board-v2-template.html";
const OUT = process.env.BOARD_TMP ? "处理中心/验证产物/orders-overview.html.tmp" : "处理中心/验证产物/orders-overview.html";

if (!fs.existsSync(DATA_JSON)) { console.error("缺 " + DATA_JSON + " ——先跑 orders-overview.mjs"); process.exit(1); }
const data = JSON.parse(fs.readFileSync(DATA_JSON, "utf8"));
const { projections, hanging, meta } = data;

const ST = {
  merged: { zh: "终态", cls: "bg-green-100 text-green-800 border-green-200" },
  accepted: { zh: "待合", cls: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  delivering: { zh: "施工", cls: "bg-orange-100 text-orange-800 border-orange-200" },
  archived: { zh: "作废", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  assigned: { zh: "已派", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  queued: { zh: "排队", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  unknown: { zh: "待查", cls: "bg-purple-100 text-purple-800 border-purple-200" },
};
const PRI = { P0: "bg-red-100 text-red-800", P1: "bg-orange-100 text-orange-800", P2: "bg-gray-100 text-gray-600", P3: "bg-gray-100 text-gray-500" };
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const idx = (p) => { if (p.stage === "merged" || p.stage === "archived") return 3; if (p.stage === "delivering") return p.rejected ? 0 : 1; return 2; };

const stats = {
  total: projections.length,
  finished: projections.filter(p => p.stage === "merged").length,
  inflow: projections.filter(p => !["merged", "archived"].includes(p.stage)).length,
  overdue: projections.filter(p => p.overdue).length,
  rejected: projections.filter(p => p.rejected).length,
  onhold: hanging.length,
};

const cards = [
  { key: "all", zh: "总数", n: stats.total, cls: "text-on-surface" },
  { key: "finished", zh: "已合 main", n: stats.finished, cls: "text-green-600" },
  { key: "inflow", zh: "流转中", n: stats.inflow, cls: "text-blue-600" },
  { key: "rejected", zh: "回炉", n: stats.rejected, cls: "text-red-500" },
  { key: "onhold", zh: "挂账", n: stats.onhold, cls: "text-gray-500" },
];

const summaryCardsHtml = cards.map(c => `
<div class="bg-surface-container-lowest border border-outline-variant rounded p-sm cursor-pointer hover:bg-surface-container transition-colors stat-card" data-k="${c.key}">
  <div class="font-label-md text-label-md text-on-surface-variant mb-xs">${c.zh}</div>
  <div class="font-h2 text-h2 ${c.cls}">${c.n}</div>
</div>`).join("");

const urgent = projections
  .filter(p => !["merged", "archived"].includes(p.stage))
  .sort((a, b) => idx(a) - idx(b) || (b.priority === "P0" ? 1 : 0) - (a.priority === "P0" ? 1 : 0))
  .slice(0, 5).map(p => {
    const st = ST[p.stage] || ST.unknown;
    return `<div onclick="focusRow('${p.no}')" style="cursor:pointer" class="bg-surface-container-lowest border-l-4 ${p.rejected ? "border-red-600" : p.overdue ? "border-red-500" : "border-blue-600"} border border-outline-variant rounded p-sm shadow-sm">
  <div class="flex justify-between items-start mb-xs">
    <span class="font-mono text-mono font-bold">${esc(p.no)}</span>
    <span class="flex items-center gap-1">
      <span class="text-[10px] px-1 rounded ${p.priority === "P0" ? "bg-red-100 text-red-800" : p.priority === "P1" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-500"}">${esc(p.priority || "未排")}</span>
      <button class="copy-btn text-[11px] px-1.5 py-0.5 rounded border border-outline-variant hover:bg-surface-container" onclick="event.stopPropagation();copyCard('${p.no}')">复制</button>
    </span>
  </div>
  <p class="font-body-sm text-body-sm text-on-surface line-clamp-2">${esc(p.title)}</p>
  <div class="mt-xs text-[11px] text-on-surface-variant flex items-center gap-xs"><span class="material-symbols-outlined text-[14px]">info</span> ${esc(p.blocker || st.zh + "（待补充卡点）")}</div>
</div>`;
  }).join("");

const rows = projections.map((p, i) => {
  const st = ST[p.stage] || ST.unknown;
  const ov = p.overdue ? "overdue-row" : "";
  const badge = `<span class="bg-${st.zh === "终态" ? "green-100 text-green-800 border-green-200" : st.zh === "待合" ? "yellow-100 text-yellow-800 border-yellow-200" : st.zh === "施工" ? "orange-100 text-orange-800 border-orange-200" : st.zh === "作废" ? "gray-100 text-gray-700 border-gray-200" : st.zh === "已派" ? "blue-100 text-blue-800 border-blue-200" : st.zh === "排队" ? "gray-100 text-gray-600 border-gray-200" : "purple-100 text-purple-800 border-purple-200"} font-label-xs px-2 py-1 rounded-full border">${st.zh}${p.rejected ? "·回炉" : ""}${ov ? "·超期" : ""}</span>`;
  const pri = p.priority && PRI[p.priority] ? `<span class="text-[10px] px-1 rounded ${PRI[p.priority]} ml-1">${p.priority}</span>` : "";
  const line = p.line ? `<span class="text-[10px] px-1 rounded bg-surface-container text-on-surface-variant ml-1">${esc(p.line)}</span>` : "";
  return `<tr class="border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors ${ov}" data-no="${esc(p.no)}" onclick="toggleRow(this)">
  <td class="py-sm px-md text-on-surface-variant">${i + 1}</td>
  <td class="py-sm px-md font-mono text-mono">${esc(p.no)}${line}</td>
  <td class="py-sm px-md">${pri}</td>
  <td class="py-sm px-md font-medium">${esc(p.title).slice(0, 24)}</td>
  <td class="py-sm px-md">${badge}</td>
  <td class="py-sm px-md text-on-surface-variant">${esc(p.blocker || "—")}</td>
</tr>
<tr class="row-detail hidden border-b border-outline-variant"><td class="p-md" colspan="6">
  <div class="bg-surface border border-outline-variant rounded p-md">
    <h4 class="font-label-md mb-sm">流转时间线</h4>
    <div class="flex items-center gap-sm text-xs font-mono text-on-surface-variant">
      <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span> 交付 ${esc(p.cols?.d || "—")}</div>
      <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
      <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-orange-500"></span> 验收 ${esc(p.cols?.a || "—")}</div>
      <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
      <div class="flex items-center gap-1 opacity-50"><span class="w-2 h-2 rounded-full bg-gray-300"></span> 合 main ${esc(p.cols?.m || "—")}</div>
    </div>
  </div>
</td></tr>`;
}).join("");

const hangHtml = hanging.slice(0, 5).map(h => `<div class="bg-surface border border-outline-variant border-dashed rounded p-sm">
  <div class="font-mono text-xs font-bold mb-1">${esc(h.id)}</div>
  <div class="text-[10px] truncate">${esc(h.title).slice(0, 22)} · ${esc(h.who || "?")} @${esc(h.date || "?")}</div>
</div>`).join("");
const hangMore = hanging.slice(5).map(h => `<div class="bg-surface border border-outline-variant border-dashed rounded p-sm">
  <div class="font-mono text-xs font-bold mb-1">${esc(h.id)}</div>
  <div class="text-[10px] truncate">${esc(h.title).slice(0, 22)} · ${esc(h.who || "?")} @${esc(h.date || "?")}</div>
</div>`).join("");

const renderFn = `
function copyCard(no){
  const t = DATA.tickets.find(x=>x.no===no);
  if(!t) return;
  const st = {merged:"终态",accepted:"待合",delivering:t.rejected?"回炉":"施工",archived:"作废",assigned:"已派",queued:"排队",unknown:"待查"}[t.stage]||"待查";
  const txt = "【MOV 工单】"+t.no+" · "+st+(t.priority&&t.priority!=="—"?" · "+t.priority:"")+String.fromCharCode(10)+t.title+String.fromCharCode(10)+"卡点："+(t.blocker||"—")+(t.line?String.fromCharCode(10)+"线："+t.line:"");
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>feedback(no)).catch(()=>legacyCopy(txt,no));
  } else legacyCopy(txt,no);
}
function legacyCopy(txt,no){
  const ta=document.createElement("textarea");ta.value=txt;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");feedback(no);}catch(e){}document.body.removeChild(ta);
}
function feedback(no){
  document.querySelectorAll(".copy-btn").forEach(b=>{if(b.getAttribute("onclick").includes(no)){b.textContent="✓ 已复制";setTimeout(()=>b.textContent="复制",1500);}});
}


function applyF() {
  const no = document.getElementById("sel-no") ? document.getElementById("sel-no").value : "";
  const pri = document.getElementById("sel-pri") ? document.getElementById("sel-pri").value : "";
  document.querySelectorAll("#main-table-body > tr:not(.row-detail)").forEach(r => {
    const p = DATA.tickets.find(x => x.no === r.dataset.no);
    if (!p) { r.classList.add("hidden"); return; }
    const priKey = p.priority && p.priority !== "—" ? p.priority : "未排";
    const okNo = !no || p.no === no;
    const okPri = !pri || priKey === pri;
    r.classList.toggle("hidden", !(okNo && okPri));
  });
  const sum = document.getElementById("filter-summary");
  if (sum) { const vis = document.querySelectorAll("#main-table-body > tr:not(.row-detail):not(.hidden)").length; sum.textContent = "显示 " + vis + " / " + DATA.stats.total; }
}
function initSel() {
  const noSel = document.getElementById("sel-no");
  if (noSel) {
    const nos = DATA.tickets.map(t => t.no).sort();
    nos.forEach(n => { const o = document.createElement("option"); o.value = n; o.textContent = n; noSel.appendChild(o); });
  }
  applyF();
}
function focusRow(no) {
  // 先清筛选（保证目标可见）
  const noSel = document.getElementById("sel-no"), priSel = document.getElementById("sel-pri");
  if (noSel) noSel.value = "";
  if (priSel) priSel.value = "";
  document.querySelectorAll("#main-table-body > tr:not(.row-detail)").forEach(r => r.classList.remove("hidden"));
  const row = document.querySelector('#main-table-body tr[data-no="' + no + '"]');
  if (!row) return;
  row.scrollIntoView({ behavior: "smooth", block: "center" });
  row.classList.add("focus-flash");
  setTimeout(() => row.classList.remove("focus-flash"), 2200);
}
function toggleRow(tr){
  const det = tr.nextElementSibling;
  if(det && det.classList.contains('row-detail')) det.classList.toggle('hidden');
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.stat-card').forEach(c=>c.addEventListener('click',()=>{ FILTER.conds=[]; if(c.dataset.k==='finished')FILTER.conds.push({field:'stage',op:'eq',val:'终态'}); else if(c.dataset.k==='inflow')FILTER.conds.push({field:'stage',op:'neq',val:'终态'}); else if(c.dataset.k==='rejected')FILTER.conds.push({field:'stage',op:'eq',val:'施工/回炉'}); rebuild(); }));
  const box = document.getElementById('hold-box');
  const more = document.createElement('div');
  more.className = 'hidden col-span-full grid grid-cols-1 md:grid-cols-5 gap-sm';
  more.innerHTML = DATA.holdMore;
  box.appendChild(more);
  const btn = document.getElementById('expand-hold');
  btn.textContent = '展开全部（'+DATA.hanging.length+'）';
  btn.addEventListener('click', ()=>{ more.classList.toggle('hidden'); btn.textContent = more.classList.contains('hidden') ? '展开全部（'+DATA.hanging.length+'）' : '收起'; });
  document.getElementById('summary-line').textContent = '总数 '+DATA.stats.total+' · 终态 '+DATA.stats.finished+' · 在流 '+DATA.stats.inflow+' · 超期 '+DATA.stats.overdue+' · 挂账 '+DATA.stats.onhold+' ｜ sha '+DATA.meta.libSha.slice(0,8)+'…';
  initSel();
});
`;

let html = fs.readFileSync(TPL, "utf8");
html = html.replace("/*__DATA__*/", `const DATA = ${JSON.stringify({ stats, tickets: projections, hanging, holdMore: hangMore, meta })};`);
html = html.split("/*__RENDER__*/").join(renderFn);
html = html.replace('<section class="grid grid-cols-2 md:grid-cols-6 gap-md mb-lg" id="summary-cards"></section>', `<section class="grid grid-cols-2 md:grid-cols-6 gap-md mb-lg" id="summary-cards">${summaryCardsHtml}</section>`);
html = html.replace('<div class="grid grid-cols-1 md:grid-cols-3 gap-md" id="urgent-box"></div>', `<div class="grid grid-cols-1 md:grid-cols-3 gap-md" id="urgent-box">${urgent}</div>`);
html = html.replace('<tbody class="font-body-sm text-body-sm" id="main-table-body"></tbody>', `<tbody class="font-body-sm text-body-sm" id="main-table-body">${rows}</tbody>`);
html = html.replace('<div class="grid grid-cols-1 md:grid-cols-5 gap-sm opacity-60" id="hold-box"></div>', `<div class="grid grid-cols-1 md:grid-cols-5 gap-sm opacity-60" id="hold-box">${hangHtml}</div>`);

fs.writeFileSync(OUT, html);
console.log("board v2 已生成 →", OUT, "|", html.length, "bytes | 卡", projections.length, "| 挂账", hanging.length);
