#!/usr/bin/env node
// 工具自检.mjs —— 全域脚本语法自检（UPG-350 立·机器闸；UPG-355 扩面＋挂高频入口；UPG-357 跨仓开关）
//
// 缘起：取号.mjs 被改崩但未提交 ⇒ 提交期闸拦不到（2026-09-28 事故·立卡入口全坏 9 分钟）。
// 用法：node 处理中心/机器闸/工具自检.mjs [--quiet] [--full] [--sys-only]
//   --sys-only：只扫体系仓（跳过产品仓 scripts/ 跨仓面）——产品仓在途改动完全不参与 rc
//   rc 分级（UPG-357 W-3）：体系仓命中＝**硬拦**（rc=1）；产品仓命中＝**告警**（打印但不挡提交）
// 入口（UPG-355 四处）：①手动跑 ②体系仓 .githooks/pre-commit 闸三前置 ③巡检台/体检.mjs「⓪」 ④engine.mjs 启动
// 扫描面：**体系仓全域脚本**＋**产品仓 scripts/**（跨仓·告警级；--sys-only 可关）
//   .mjs/.js/.cjs → `node --check`（逐件进程·Windows 单件 ~0.2s，故只查变动件）
//   .py           → Python 语法编译（compile(源码,'exec')——与 py_compile 同解析器，但不落 .pyc：无副作用且 27 件 3.2s→0.4s）
//   跳过第三方与冻结树：node_modules / bin / skills / __pycache__ / 归档* / _备份* / 验证产物 / 证据数据 / *-evidence / 看板单/席位
// 增量缓存（UPG-355）：<本目录>/工具自检.cache.json 按 mtime+size 记**过检件**；只查变动件 ⇒ 高频入口不吃全量耗时。
//   --full 忽略缓存全量重扫（读数/变异取证用）。缓存条目随文件删除自动出清。
import { execFile } from "node:child_process";
import { PRODUCT } from "./lib/root.mjs"; // SYS-160：根解析单源（SYS 本件原已按脚本位置解析·保留）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url)); // 中文路径必须走 fileURLToPath（否则 %XX 编码）
const SYS = path.resolve(HERE, "..", "..");                // 体系根（处理中心/机器闸 → 上两级）
const QUIET = process.argv.includes("--quiet");
const FULL = process.argv.includes("--full");
const SYS_ONLY = process.argv.includes("--sys-only");   // UPG-357 W-3：跳过跨仓面（产品仓命中连告警也不参与）
// SYS-160（自检组）：平台面＋武器解析表（与 巡检台/_tools/武器.mjs 同口径：Windows 先 .exe；非 Windows 先无扩展名 ELF）
const PY = process.env.MOV_PYTHON?.trim() || (process.platform === "win32" ? "python" : "python3");
const WEAPON_NAMES = ["gitleaks", "trufflehog", "osv-scanner", "alint"];
function weaponPath(name) {
  // SYS-160：注册表（dir+name）优先——trufflehog/osv-scanner 在 审验员/_tools/security-scan，非 bin/
  let dir = process.env.MOV_BIN?.trim() || path.join(SYS, "巡检台", "_tools", "bin");
  let base = name;
  try {
    const reg = JSON.parse(fs.readFileSync(path.join(SYS, "处理中心", "机器闸", "tool-registry.json"), "utf-8"));
    for (const [key, t] of Object.entries(reg.tools || {})) {
      if (key.replace(/\.exe$/, "") !== name) continue;
      dir = path.join(SYS, ...String(t.dir).split("/"));
      base = key.replace(/\.exe$/i, "");
      break;
    }
  } catch { /* 回落 bin/ */ }
  const cands = process.platform === "win32" ? [`${base}.exe`, base] : [`${base}-linux-amd64`, base, `${base}.exe`];
  for (const c of cands) { try { const f = path.join(dir, c); if (fs.statSync(f).isFile()) return f.replace(SYS + path.sep, ""); } catch {} }
  return null;
}
function weaponTable() { return WEAPON_NAMES.map((n) => `${n}=${weaponPath(n) || "缺"}`).join(" "); }
function weaponMissing() { return WEAPON_NAMES.filter((n) => !weaponPath(n)); }
const CONCURRENCY = 4;
const CACHE = path.join(HERE, "工具自检.cache.json");
const SKIP_DIR = new Set(["node_modules", "bin", "skills", "__pycache__", "单", "seats", "验证产物"]);
const SKIP_RE = /(^|[\\/])(归档[^\\/]*|_备份[^\\/]*|证据数据|[^\\/]*-evidence|[^\\/]*_evidence)([\\/]|$)/i;
const EXT_JS = /\.(mjs|js|cjs)$/;
const EXT_PY = /\.py$/;
// 扫描根：①体系仓全域 ②**跨仓工具面**——产品仓 scripts/（卡面范围①点名；同款事故隐患）
// UPG-357 W-3 分级：体系仓命中＝硬拦（rc=1）；产品仓命中＝告警（打印不挡）——--sys-only 跳过②
const PRODUCT_SCRIPTS = path.join(PRODUCT, "scripts"); // SYS-160：产品仓走根解析（缺省=原路径）
const ROOTS = [{ base: SYS, label: "" }];
if (!SYS_ONLY && fs.existsSync(PRODUCT_SCRIPTS)) ROOTS.push({ base: PRODUCT_SCRIPTS, label: "产品仓/scripts" });
const isCrossRepo = (r) => r.startsWith("产品仓/");
const rel = (p) => {
  const full = path.resolve(p);
  for (const r of ROOTS) { const d = path.relative(r.base, full); if (d && !d.startsWith("..")) return (r.label ? r.label + "/" : "") + d.replace(/\\/g, "/"); }
  return full.replace(/\\/g, "/");
};

/* ---------- ① 扫描面：递归收集（跳过第三方/冻结树） ---------- */
const files = [];
for (const r of ROOTS) (function walk(dir) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name) && !SKIP_RE.test(p)) walk(p); }
    else if (EXT_JS.test(e.name) || EXT_PY.test(e.name)) files.push(p);
  }
})(r.base);

/* ---------- ② 增量筛选：mtime+size 未变且上次过检 ⇒ 免查 ---------- */
const sig = (f) => { try { const s = fs.statSync(f); return `${Math.round(s.mtimeMs)}:${s.size}`; } catch { return "!"; } };
let cache = {};
if (!FULL) { try { cache = JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch { /* 首次/损坏＝全查 */ } }
const todo = files.filter((f) => cache[rel(f)] !== sig(f));
const todoJs = todo.filter((f) => EXT_JS.test(f)), todoPy = todo.filter((f) => EXT_PY.test(f));

/* ---------- ③ 逐件检查：js 逐件进程（并行）·py 单进程批量 ---------- */
const bad = [];
const jsOne = (f) => new Promise((resolve) => {
  execFile("node", ["--check", f], { windowsHide: true, timeout: 60000 }, (err, _so, se) => {
    if (!err) return resolve(null);
    const lines = String(se || "").split("\n").map((s) => s.trim()).filter(Boolean);
    const syn = lines.find((l) => /SyntaxError/.test(l)) || lines[0] || String(err.message); // 栈尾是 node 内部帧，取 SyntaxError 真句
    resolve([rel(f), syn.slice(0, 200)]);
  });
});
let next = 0;
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todoJs.length) }, async () => {
  while (next < todoJs.length) { const r = await jsOne(todoJs[next++]); if (r) bad.push(r); }
}));
if (todoPy.length) {
  const py = `
import importlib.util, sys, warnings
bad = []
for f in sys.argv[1:]:
    try:
        src = importlib.util.decode_source(open(f, "rb").read())
        compile(src, f, "exec")
    except Exception as e:
        bad.append(f + " :: " + str(e).splitlines()[0][:160])
for b in bad:
    print("PYBAD " + b)
sys.exit(1 if bad else 0)`;
  await new Promise((resolve) => {
    execFile("python", ["-X", "utf8", "-c", py, ...todoPy], { windowsHide: true, timeout: 120000, maxBuffer: 8 << 20 }, (err, so, se) => {
      const lines = String(so || "").split("\n").filter((l) => l.startsWith("PYBAD "));
      if (err && !lines.length) bad.push(["(python 自检进程失败)", String(se || err.message).split("\n")[0].slice(0, 160)]);
      for (const l of lines) { const i = l.indexOf(" :: "); bad.push([rel(l.slice(6, i)), l.slice(i + 4)]); }
      resolve();
    });
  });
}

/* ---------- ④ 读数：扫描面按目录（扩面自查）＋实查/缓存 ＋ 逐件归因 ---------- */
const byDir = {};
for (const f of files) { const d = rel(f).split("/").slice(0, -1).join("/") || "."; byDir[d] = (byDir[d] || 0) + 1; }
const hard = bad.filter(([f]) => !isCrossRepo(f));   // 体系仓命中：硬拦
const warn = bad.filter(([f]) => isCrossRepo(f));    // 产品仓命中：告警（UPG-357 W-3）
for (const [f, err] of hard) console.error(`✗ ${f}：${err}`);
for (const [f, err] of warn) console.error(`⚠ ${f}：${err}（产品仓·告警不挡）`);
const nJs = files.filter((f) => EXT_JS.test(f)).length, nPy = files.length - nJs;
if (hard.length) {
  console.error(`\n✗ 工具自检不过：${hard.length} 件语法错（本次实查 ${todo.length}/${files.length}：js ${todoJs.length} · py ${todoPy.length}）——**别提交、先修**（卡面模板里禁反引号！）`);
  writeCache();
  process.exit(1);
}
writeCache();
if (warn.length) console.error(`\n⚠ 产品仓脚本语法错 ${warn.length} 件（告警·不挡体系仓提交；--sys-only 可跳过跨仓扫描）`);
if (!QUIET) {
  const dirs = Object.entries(byDir).sort((a, b) => b[1] - a[1]).map(([d, n]) => `${d}=${n}`).join(" ｜ ");
  const mode = SYS_ONLY ? "--sys-only（体系仓）" : "全扫（体系仓＋产品仓/scripts·跨仓告警级）";
  console.log(`✅ 工具自检通过：${files.length} 件（.mjs/.js/.cjs ${nJs} · .py ${nPy}）｜本次实查 ${todo.length}（缓存命中 ${files.length - todo.length}）｜模式=${mode}｜读取时点=${new Date().toLocaleString("sv-SE")}${warn.length ? `｜⚠ 产品仓告警 ${warn.length}` : ""}`);
  // SYS-160（自检组）：平台面 + 武器解析表 + 缺失分级（硬拦/告警/豁免）
  console.log(`platform=${process.platform}/${process.arch}｜SYS=${SYS}｜PY=${PY}｜WEAPONS=${weaponTable()}`);
  const miss = weaponMissing();
  if (miss.length) console.log(`⚠ 武器缺失 ${miss.length}：${miss.join("·")}（可豁免登记：处理中心/机器闸/可携性豁免.json）`);
  console.log(`扫描面（按目录）：${dirs}`);
}

function writeCache() { // 只记**过检件**（失败件不入缓存 ⇒ 下次必再查）
  const okSet = new Set(bad.map(([f]) => f));
  const next2 = {};
  for (const f of files) { const r = rel(f); if (!okSet.has(r)) next2[r] = sig(f); }
  try { fs.writeFileSync(CACHE, JSON.stringify(next2, null, 1), "utf8"); } catch { /* 缓存非关键件：写不了就下次全查 */ }
}
