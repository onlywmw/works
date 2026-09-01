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

// 人话短标题（看板显示；库卡原标题保留）
const TITLES={"UPG-01":"工具描述补全（AI 看到真说明）","UPG-02":"设备/传感器工具接入","UPG-03":"12306 等生活工具","UPG-04":"Obsidian 笔记工具接入","UPG-05":"记忆体系修补","UPG-06":"防 AI 编造加固","UPG-07":"预算口径与用量计量","UPG-08":"工作台（mow.kim）落地","UPG-09":"登录页实现","UPG-10":"工作台同步状态细分","UPG-11":"隐私政策弹窗（合规）","UPG-12":"WebView 加载提速","UPG-13":"登录页视觉优化","UPG-27":"Code Mode 工具描述按需加载","UPG-40":"App 视觉统一（黑白）","UPG-41":"本地页列表/详情重做","UPG-42":"mow.kim 站点 WebMCP 化","UPG-43":"浏览器 WebMCP Hub","UPG-14":"设置页收口","UPG-15":"登录按钮死锁修复","UPG-16":"签名配置安全收口","UPG-17":"假数据清理（前端）","UPG-18":"死代码清理","UPG-19":"新 Logo 图标","UPG-20":"聊天 chips 气泡改造","UPG-21":"回车键发送","UPG-22":"记忆收尾（COVER_HIT）","UPG-23":"本机能力总览页","UPG-24":"设计规范 v1","UPG-25":"UI 瑕疵批量修复","UPG-26":"侧边栏品牌区","UPG-28":"Obsidian 写操作审批闸","UPG-44":"验收判定器（B1）","UPG-45":"权限能力注册表","UPG-46":"工具联动契约","UPG-47":"主页胶囊系统","UPG-48":"记忆 API 模块化","UPG-49":"记忆页 UI 分层","UPG-50":"外观组件级显示","UPG-51":"用户画像标签池","UPG-52":"记忆生命周期","UPG-53":"安全体验优化","UPG-54":"安全中心页","UPG-55":"资产管理注册体系","UPG-56":"评测集盘点与版本","UPG-57":"演进台账骨架","UPG-58":"基线清单五步链","UPG-59":"教训蒸馏 MVP","UPG-60":"三道门+元验证","UPG-61":"vault 读修复（安全）","UPG-62":"输入框失焦修复","UPG-63":"弹窗基线等收口","UPG-64":"效应注解（C 线）","UPG-65":"门 3 灰度自动化","UPG-66":"Judge 判定扩面","UPG-67":"DAG 编排试点","UPG-68":"商业安全闸","UPG-69":"工单站 WebMCP 试点"};
const rows = projections.map((p, i) => {
  const st = ST[p.stage] || ST.unknown;
  const ov = p.overdue ? "overdue-row" : "";
  const badge = `<span class="bg-${st.zh === "终态" ? "green-100 text-green-800 border-green-200" : st.zh === "待合" ? "yellow-100 text-yellow-800 border-yellow-200" : st.zh === "施工" ? "orange-100 text-orange-800 border-orange-200" : st.zh === "作废" ? "gray-100 text-gray-700 border-gray-200" : st.zh === "已派" ? "blue-100 text-blue-800 border-blue-200" : st.zh === "排队" ? "gray-100 text-gray-600 border-gray-200" : "purple-100 text-purple-800 border-purple-200"} font-label-xs px-2 py-1 rounded-full border">${st.zh}${p.rejected ? "·回炉" : ""}${ov ? "·超期" : ""}</span>`;
  const CATN={M1:"安全",M2:"体系",M3:"基建",M4:"工具",M5:"商业",M6:"记忆",M7:"资产",M8:"UI"};
  const CATS={M1:"bg-red-100 text-red-800",M2:"bg-purple-100 text-purple-800",M3:"bg-sky-100 text-sky-800",M4:"bg-teal-100 text-teal-800",M5:"bg-amber-100 text-amber-800",M6:"bg-green-100 text-green-800",M7:"bg-orange-100 text-orange-800",M8:"bg-slate-100 text-slate-700"};
  const pri = p.priority && PRI[p.priority] ? `<span class="text-[10px] px-1 rounded ${p.stage === "merged" ? "bg-surface-container-high text-on-surface-variant" : PRI[p.priority]} ml-1">${p.priority}</span>` : "";
  const line = p.line ? `<span class="text-[10px] px-1 rounded bg-surface-container text-on-surface-variant ml-1">${esc(p.line)}</span>` : "";
  return `<tr class="border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors ${ov}" data-no="${esc(p.no)}" data-stage="${esc(p.stage)}" onclick="toggleRow(this)">
  <td class="py-sm px-md text-on-surface-variant">${i + 1}</td>
  <td class="py-sm px-md font-mono text-mono">${esc(p.no)}${line}</td>
  <td class="py-sm px-md">${pri}</td>
  <td class="py-sm px-md">${p.cat&&CATN[p.cat]?`<span class="text-[10px] px-1 rounded ${CATS[p.cat]} inline-block">${p.cat} ${CATN[p.cat]}</span>`:""}</td>
  <td class="py-sm px-md font-medium">${esc(TITLES[p.no] || p.title).slice(0, 24)}</td>
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
  const txt = t.no + " 这个工单什么情况？";
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
  const cat = document.getElementById("sel-cat") ? document.getElementById("sel-cat").value : "";
  document.querySelectorAll("#main-table-body > tr:not(.row-detail)").forEach(r => {
    const p = DATA.tickets.find(x => x.no === r.dataset.no);
    if (!p) { r.classList.add("hidden"); return; }
    const priKey = p.priority && p.priority !== "—" ? p.priority : "未排";
    const okNo = !no || p.no === no;
    const okPri = !pri || priKey === pri;
    const okCat = !cat || p.cat === cat;
    r.classList.toggle("hidden", !(okNo && okPri && okCat));
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
let lastK = "";
function setFilter(k) {
  const noSel = document.getElementById("sel-no"), priSel = document.getElementById("sel-pri");
  if (noSel) noSel.value = ""; if (priSel) priSel.value = "";
  lastK = (lastK === k) ? "" : k;
  document.querySelectorAll("#main-table-body > tr:not(.row-detail)").forEach(r => {
    const st = r.dataset.stage;
    let show = true;
    if (lastK === "finished") show = st === "merged";
    else if (lastK === "inflow") show = st !== "merged" && st !== "archived";
    else if (lastK === "rejected") show = st === "delivering";  // 回炉（施工态包含打回）
    else if (lastK === "onhold") show = false; // 挂账=滚到池
    else show = true;
    r.classList.toggle("hidden", !show);
  });
  document.querySelectorAll(".stat-card").forEach(c => c.classList.toggle("ring-2", c.dataset.k === lastK));
  if (lastK === "onhold") document.getElementById("hold-box") && document.getElementById("hold-box").scrollIntoView({ behavior: "smooth" });
}
function toggleRow(tr){
  const det = tr.nextElementSibling;
  if(det && det.classList.contains('row-detail')) det.classList.toggle('hidden');
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.stat-card').forEach(c=>c.addEventListener('click',()=>setFilter(c.dataset.k)));
  const box = document.getElementById('hold-box');
  const more = document.createElement('div');
  more.className = 'hidden col-span-full grid grid-cols-1 md:grid-cols-5 gap-sm';
  more.innerHTML = DATA.holdMore;
  box.appendChild(more);
  const btn = document.getElementById('expand-hold');
  btn.textContent = '展开全部（'+DATA.hanging.length+'）';
  btn.addEventListener('click', ()=>{ more.classList.toggle('hidden'); btn.textContent = more.classList.contains('hidden') ? '展开全部（'+DATA.hanging.length+'）' : '收起'; });
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
