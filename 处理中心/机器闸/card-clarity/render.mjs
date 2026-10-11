#!/usr/bin/env node
// card-clarity/render.mjs —— 样例卡渲染（五字段 → HTML → 截图＋DOM 读数）
//
// 用法：node render.mjs --cards <文件|目录> --out <输出目录> [--json]
// 产出（out/）：index.html（卡片墙）＋ card-<cardId>.png（每卡截图）＋ dom.json（每卡 DOM 读数：文本/按钮矩形/对比度源色）
// 说明：样例渲染＝**中性模板**（不引入产品视觉规格·三禁）；真卡渲染在 POL-10 产物面接同接口。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? true) : d; };
const CARDS = arg("--cards"), OUT = arg("--out", path.join(HERE, "_render"));
if (!CARDS || !arg("--out")) { console.error("用法：node render.mjs --cards <文件|目录> --out <输出目录> [--json]"); process.exit(2); }
const REPO = arg("--repo", process.env.MOV_PRODUCT_ROOT || "E:/mov归档/0027-mov");
let LABELS = {};
try { const R = await import(pathToFileURL(path.join(REPO, "tools/ms-md-server/page/src/lib/cardRegistry.js")).href); LABELS = R.ACTION_LABELS || {}; } catch { LABELS = JSON.parse(fs.readFileSync(path.join(HERE, "fallback-whitelist.json"), "utf8")).labels || {}; }

const CHROME = ["C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1224/chrome-win64/chrome.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe"].find((p) => fs.existsSync(p));
if (!CHROME) { console.error("✗ 无可用 chromium/chrome"); process.exit(2); }

function load(p) {
  const st = fs.statSync(p);
  const files = st.isDirectory() ? fs.readdirSync(p).filter((f) => f.startsWith("cards.") && f.endsWith(".json")).map((f) => path.join(p, f)) : [p];
  return files.flatMap((f) => { const j = JSON.parse(fs.readFileSync(f, "utf8")); return (Array.isArray(j) ? j : [j]); });
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function page(cards) {
  const cardHtml = cards.map((c, i) => {
    const steps = Array.isArray(c.steps) ? c.steps.map((s) => `<li class="st ${esc(s.status)}">${s.status === "now" ? "▶ " : s.status === "done" ? "✓ " : "○ "}${esc(s.name)}</li>`).join("") : "";
    const label = LABELS[c.next] || c.next || "";
    return `<section class="card" id="card-${i}" data-card="${esc(c.cardId || i)}">
  <h2 class="what">${esc(c.what)}</h2>
  <p class="state">${esc(c.state)}</p>
  ${steps ? `<ul class="steps">${steps}</ul>` : ""}
  <p class="why">${esc(c.why)}</p>
  ${c.blocker ? `<p class="blocker">受阻：${esc(c.blocker)}</p>` : ""}
  <button class="cta" data-action="${esc(c.next)}" title="${esc(c.next)}" aria-label="${esc(c.next)}">${esc(label)}</button>
</section>`;
  }).join("\n");
  return `<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=430,initial-scale=1">
<style>
 body{margin:0;padding:16px;background:#f6f7f9;font:15px/1.5 system-ui,"Microsoft YaHei",sans-serif;color:#1a1a1a}
 .card{background:#fff;border-radius:14px;padding:16px;margin:0 0 14px;width:398px;box-sizing:border-box;box-shadow:0 1px 3px rgba(0,0,0,.08)}
 .what{margin:0 0 6px;font-size:17px}
 .state{margin:0 0 8px;font-size:16px;font-weight:600}
 .steps{list-style:none;margin:0 0 8px;padding:0;font-size:14px;color:#444}
 .steps .done{color:#6b6b6b}.steps .now{color:#0a6e3a;font-weight:600}.steps .todo{color:#8a8a8a}
 .why{margin:0 0 10px;font-size:14px;color:#555}
 .blocker{margin:0 0 10px;font-size:14px;color:#a15c00}
 .cta{padding:10px 16px;border-radius:10px;border:0;background:#0a6e3a;color:#fff;font-size:15px;min-height:24px}
</style><body>
${cardHtml}
</body></html>`;
}

fs.mkdirSync(OUT, { recursive: true });
const cards = load(path.resolve(CARDS));
const html = page(cards);
fs.writeFileSync(path.join(OUT, "index.html"), html);

const PW_CANDIDATES = ["playwright-core", "file:///C:/Users/Administrator/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core/index.mjs"];
let chromium = null;
for (const c of PW_CANDIDATES) { try { chromium = (await import(c)).chromium; if (chromium) break; } catch (_) {} }
let dom = null;
if (chromium) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(pathToFileURL(path.join(OUT, "index.html")).href, { waitUntil: "load" });
  dom = await p.evaluate(() => [...document.querySelectorAll(".card")].map((el) => {
    const cs = getComputedStyle(el), btn = el.querySelector(".cta");
    const br = btn.getBoundingClientRect();
    const lum = (c) => { const [r, g, b] = c.match(/\d+/g).slice(0, 3).map((x) => { x = x / 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
    const csBtn = getComputedStyle(btn);
    const L1 = lum(csBtn.color), L2 = lum(csBtn.backgroundColor);
    const ratio = ((Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05));
    const overflow = [...el.querySelectorAll("*")].some((n) => n.scrollWidth > n.clientWidth + 1);
    return { cardId: el.getAttribute("data-card"), next: btn.getAttribute("data-action"), label: btn.textContent.trim(),
      touch: { w: +br.width.toFixed(1), h: +br.height.toFixed(1), ok: br.width >= 24 && br.height >= 24 },
      ctaContrast: +ratio.toFixed(2), text: el.innerText.replace(/\s+/g, " ").trim().slice(0, 300), overflow };
  }));
  for (let i = 0; i < cards.length; i++) {
    const el = await p.$(`#card-${i}`);
    await el.screenshot({ path: path.join(OUT, `card-${(cards[i].cardId || i).replace(/[^\w.-]/g, "_")}.png`) });
  }
  await browser.close();
} else {
  console.error("⚠ playwright-core 不可用：仅出 HTML（截图/DOM 读数缺）");
}
fs.writeFileSync(path.join(OUT, "dom.json"), JSON.stringify(dom, null, 2));
console.log(JSON.stringify({ html: path.join(OUT, "index.html"), cards: cards.length, domRows: dom ? dom.length : 0, playwright: !!chromium }, null, 2));
