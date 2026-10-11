#!/usr/bin/env node
// dup-radar.mjs —— 实现层复用扫（SYS-192·change=实现层单源化整理方案 §四防线3）
//
// 目的：防「新单顺手各写一套」（网络/加密/存储根/校验/基址）——扫**新增行**旁路模式，命中给单源建议。
// 口径：warn 起步（默认不 fail-closed·7 日看误报率）；白名单＝单源清单 `checks/单源清单.json` 指定件＋豁免册（.kt 路径）。
// 维护：单源清单 owner=**设计师**——新增/退役/豁免**同轮登记**（理由＋日期·改清单=改本雷达判据来源）；周减负评审引用之。
//
// 用法：
//   node 处理中心/机器闸/checks/dup-radar.mjs --diff <base..head> [--repo <产品仓根>] [--json] [--quiet]
//   node … --staged                 # 扫本仓暂存区（precommit 接线点用）
//   node … --patch <补丁文件>        # 扫补丁文件（夹具/隔离注入用·不碰仓库）
//   node … --stdin                  # 从标准输入读 unified diff
//   node … --check-registry [--repo <产品仓根>]   # 单源清单断链检查（每项现仓可 grep）
// 退出码：0=无命中/清单全通 ｜ 1=有命中/有断链 ｜ 2=用法/环境错
// 计次留痕：每次运行追加一行到 checks/dup-radar.count.jsonl（{at,来源,扫描行,命中}）。
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..", "..");            // 处理中心/机器闸/checks → 体系根
const REGISTRY = path.join(HERE, "单源清单.json");
const COUNT_LOG = path.join(HERE, "dup-radar.count.jsonl");
const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? true) : d; };
const has = (k) => argv.includes(k);

let PRODUCT = arg("--repo", null);
if (!PRODUCT) {
  try { PRODUCT = (await import(new URL("../lib/root.mjs", import.meta.url).href)).PRODUCT; } catch { PRODUCT = "E:/mov归档/0027-mov"; }
}

const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
/** 白名单：清单「指定件」＋「豁免册」中的 .kt 路径（单源件／明许夹具自身不误伤）。 */
const WHITELIST = [...registry.sources, ...(registry["豁免册"] || [])]
  .flatMap((s) => String(s["指定件"] || s["件"] || "").match(/[\w./-]+\.kt/g) || [])
  .map((p) => p.replace(/^.*?app\//, "app/"));

/** 旁路模式表（模式→单源建议）。新增模式同轮登记（理由＋日期·见清单 meta.维护节奏）。 */
const PATTERNS = [
  { id: "http", re: /\bHttpURLConnection\b/, suggest: "网络薄层单源：域外 HttpThin／账户域 bizHttp／商城域 mallHttpRaw——勿新造客户端" },
  { id: "keystore", re: /KeyGenerator\.getInstance/, suggest: "加密单源 VaultKeystoreCrypto（实现数=1）" },
  { id: "prefs-token", re: /getSharedPreferences\s*\(/, and: /(token|cred|secret|passw)/i, suggest: "凭据走 CredentialStore（禁 prefs 存敏感值）" },
  { id: "storage-root", re: /File\(\s*(?:\w+\.)?filesDir\s*,/, suggest: "存储根单源 accountRoot／accountDataDir（设备级具名件除外·禁新建平级根）" },
  { id: "phone-regex", re: /Regex\([^)]*(\[3-9\]|\\d\{9,11\})/, suggest: "校验单源 Validators／LoginValidators.isValidPhone" },
  { id: "https-base", re: /(base|endpoint|host|Base|BASE|URL|url)\w*\s*[:=]\s*"https:\/\//, suggest: "基址单源 MovServerBase（禁硬编码产品基址）" },
];

/** 解析 unified diff → [{file, line, text}]（只取新增行）。 */
function addedLines(diff) {
  const out = [];
  let file = null, line = 0;
  for (const l of String(diff).split("\n")) {
    const m = /^\+\+\+ b\/(.+)$/.exec(l);
    if (m) { file = m[1]; continue; }
    const h = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
    if (h) { line = Number(h[1]); continue; }
    if (l.startsWith("+++") || l.startsWith("---") || l.startsWith("diff --git")) continue;
    if (l.startsWith("+")) { out.push({ file: file || "?", line, text: l.slice(1) }); line++; }
    else if (!l.startsWith("-") && !l.startsWith("\\")) { line++; }
  }
  return out;
}

const wl = (f) => WHITELIST.some((p) => f === p || f.endsWith(p.replace(/^app\//, "/app/")) || f.endsWith("/" + p.split("/").pop()));

function scan(diff) {
  const lines = addedLines(diff);
  const hits = [];
  let skipped = 0;
  for (const a of lines) {
    if (wl(a.file)) { skipped++; continue; }
    for (const p of PATTERNS) {
      if (!p.re.test(a.text)) continue;
      if (p.and && !p.and.test(a.text)) continue;
      hits.push({ file: a.file, line: a.line, pattern: p.id, suggest: p.suggest, text: a.text.trim().slice(0, 80) });
    }
  }
  return { scanned: lines.length, hits, whitelistSkipped: skipped };
}

function count(来源, scanned, hits) {
  try {
    fs.appendFileSync(COUNT_LOG, JSON.stringify({ at: new Date().toLocaleString("sv-SE"), 来源, 扫描行: scanned, 命中: hits }) + "\n");
  } catch { /* 计次失败不阻断（warn 级） */ }
}

function checkRegistry() {
  const libPath = path.join(SYS, "处理中心", "工单库.md");
  const lib = fs.existsSync(libPath) ? fs.readFileSync(libPath, "utf8") : "";
  const broken = [];
  for (const s of registry.sources) {
    if (s["候"]) {                                   // 候件：只核单号在册
      if (!new RegExp(`^# ${s["候"]}\\b`, "m").test(lib)) broken.push(`${s["层"]}：候单 ${s["候"]} 不在工单库`);
      continue;
    }
    const paths = String(s["指定件"] || "").match(/[\w./-]+\.kt/g) || [];
    if (!paths.length) { broken.push(`${s["层"]}：指定件无 .kt 路径`); continue; }
    let anyFile = false, symbolOk = !s["验证符号"];
    for (const p of paths) {
      const f = path.join(PRODUCT, p);
      if (!fs.existsSync(f)) { broken.push(`${s["层"]}：断链 ${p}`); continue; }
      anyFile = true;
      if (!symbolOk && fs.readFileSync(f, "utf8").includes(s["验证符号"])) symbolOk = true;
    }
    if (anyFile && !symbolOk) broken.push(`${s["层"]}：各件均缺符号「${s["验证符号"]}」`);
  }
  return broken;
}

// ── 主流程 ────────────────────────────────────────────────────────────────
if (has("--check-registry")) {
  const broken = checkRegistry();
  if (broken.length) { console.log(`dup-radar 清单断链 ${broken.length}：` + broken.slice(0, 5).join("；")); process.exit(1); }
  console.log(`dup-radar 单源清单 ${registry.sources.length} 项全通（豁免册 ${registry["豁免册"].length} 条）`);
  process.exit(0);
}

let diff = null, 来源 = "";
if (arg("--patch")) { 来源 = "patch:" + arg("--patch"); diff = fs.readFileSync(arg("--patch"), "utf8"); }
else if (has("--stdin")) { 来源 = "stdin"; diff = fs.readFileSync(0, "utf8"); }
else if (has("--staged")) { 来源 = "staged"; diff = execFileSync("git", ["-C", process.cwd(), "diff", "--cached", "-U0"], { encoding: "utf8", maxBuffer: 1 << 26, windowsHide: true }); }
else if (arg("--diff")) { 来源 = "diff:" + arg("--diff"); diff = execFileSync("git", ["-C", PRODUCT, "diff", "-U0", String(arg("--diff"))], { encoding: "utf8", maxBuffer: 1 << 26, windowsHide: true }); }
if (diff === null) { console.error("用法：dup-radar.mjs --diff <range>｜--staged｜--patch <文件>｜--stdin｜--check-registry [--repo <根>] [--json] [--quiet]"); process.exit(2); }

const r = scan(diff);
count(来源, r.scanned, r.hits.length);
if (!r.scanned) { if (!has("--quiet")) console.log("dup-radar：无新增行（rc=0）"); process.exit(0); }
if (has("--json")) console.log(JSON.stringify({ 来源, ...r }, null, 1));
else if (r.hits.length) {
  if (!has("--quiet")) for (const h of r.hits) console.log(`  ⚠ ${h.file}:${h.line} [${h.pattern}] ${h.suggest}｜${h.text}`);
  console.log(`dup-radar：扫新增行 ${r.scanned}·命中 ${r.hits.length}（warn·白名单跳过 ${r.whitelistSkipped}）`);
} else if (!has("--quiet")) console.log(`dup-radar：扫新增行 ${r.scanned}·命中 0（rc=0·白名单跳过 ${r.whitelistSkipped}）`);
process.exit(r.hits.length ? 1 : 0);
