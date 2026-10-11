#!/usr/bin/env node
// mojibake-scan.mjs —— 乱码扫描闸（SYS-201·五探针·零依赖·探针单源见 mojibake-probe.mjs）
//
// 用法：
//   node mojibake-scan.mjs [--root <dir>] [--json] [--quiet] [--staged] [--baseline <文件>] [--self-test]
//   缺省 root＝体系仓根（本脚本 ../../..）；--staged＝只扫 git 暂存区改动件（precommit 接线用）。
// 输出：`文件:行:类:上下文`；--quiet 只出摘要行（供挂钩取尾行）；--json 机器读。
// rc：0=无新增（含白名单内）｜1=有新增命中｜2=用法/环境错。
// 白名单：checks/mojibake-baseline.json（[{path,kind,reason}]·path 支持 *／** 通配）——**只增需理由**。
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { scanContent } from "./mojibake-probe.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..", "..");
const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? true) : d; };
const has = (k) => argv.includes(k);

const ROOT = path.resolve(arg("--root", SYS));
const BASELINE = path.resolve(arg("--baseline", path.join(HERE, "mojibake-baseline.json")));
const SIZE_LIMIT = 8 * 1024 * 1024;
const EXT = /\.(md|txt|json|jsonl|js|mjs|cjs|py|kt|java|ps1|sh|bat|cmd|log|csv|ts|tsx|html|css|vue|xml|yml|yaml|properties|gradle|kts|toml|ini|cfg|conf)$/i;
const SKIP_DIRS = new Set([".git", "node_modules", "build", "dist", ".gradle", "__pycache__", ".idea", ".vscode"]);

/** 通配转正则（*＝段内任意·**＝跨段）。 */
export function globToRe(g) {
  let out = "";
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === "*") {
      if (g[i + 1] === "*") { out += ".*"; i++; } else out += "[^/]*";
    } else if ("\\^$.|?+()[]{}".includes(c)) out += "\\" + c;
    else out += c;
  }
  return new RegExp("^" + out + "$");
}

/** 白名单判定：{path(通配),kind} 命中即豁免。 */
export function whitelisted(entries, rel, kind) {
  return (entries || []).some((en) => (en.kind === kind || en.kind === "*") &&
    (en.path === rel || globToRe(String(en.path)).test(rel)));
}

function walk(dir, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); continue; }
    if (!e.isFile() || !EXT.test(e.name)) continue;
    try { if (fs.statSync(p).size > SIZE_LIMIT) continue; } catch { continue; }
    out.push(p);
  }
  return out;
}

function stagedFiles() {
  const out = execFileSync("git", ["-C", ROOT, "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, windowsHide: true }).split("\0").filter(Boolean);
  return out.map((f) => path.join(ROOT, f)).filter((f) => EXT.test(f) && fs.existsSync(f));
}

function scanFiles(files, entries) {
  const hits = [], exempt = [];
  for (const f of files) {
    const rel = path.relative(ROOT, f).split(path.sep).join("/");
    let buf;
    try { buf = fs.readFileSync(f); } catch { continue; }
    if (buf.includes(0)) continue; // 二进制粗筛（NUL）——文本扩展名的二进制件不扫
    for (const fd of scanContent(buf)) {
      const rec = { path: rel, ...fd };
      (whitelisted(entries, rel, fd.kind) ? exempt : hits).push(rec);
    }
  }
  return { hits, exempt };
}

function loadBaseline() {
  try { return JSON.parse(fs.readFileSync(BASELINE, "utf8")).entries || []; } catch { return []; }
}

// ─── 自检（夹具矩阵：干净/无效/BOM/乱码字/Latin/控制符/白名单豁免）───
function selfTest() {
  let ok = true;
  const chk = (name, cond) => { console.log((cond ? "[OK]" : "[FAIL]"), name); ok = ok && cond; };
  const kinds = (buf) => scanContent(buf).map((f) => f.kind);
  chk("干净中文 ⇒ 零命中", kinds(Buffer.from("这是一段正常的中文文本。\nHello world.\n")).length === 0);
  chk("U+FFFD ⇒ ②命中", kinds(Buffer.from("截断示例：这是一�内容")).includes("U+FFFD"));
  chk("GBK乱码字×3 ⇒ ③命中", kinds(Buffer.from("鐢ㄦ埛 鏈嶅姟 鎴愬姛", "utf8")).includes("GBK乱码字"));
  chk("GBK乱码字×1 ⇒ ③不判（防单字误报）", !kinds(Buffer.from("鐢ㄦ埛", "utf8")).includes("GBK乱码字"));
  chk("UTF8-Latin1 双对 ⇒ ④命中", kinds(Buffer.from("æ–‡ä»¶ ç¤ºä¾‹", "utf8")).includes("UTF8-Latin1"));
  chk("无效 UTF-8（GBK 正文字节）⇒ ①命中", kinds(Buffer.concat([Buffer.from("正文："), Buffer.from([0xd6, 0xd0, 0xce, 0xc4, 0xc4, 0xda, 0xc8, 0xdd])])).includes("无效UTF-8"));
  chk("UTF-8 BOM ⇒ 不判", kinds(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("你好")])).length === 0);
  chk("UTF-16 BOM ⇒ ①命中", kinds(Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("ab\u0000", "utf16le")])).includes("无效UTF-8"));
  chk("控制符×6 ⇒ ⑤命中", kinds(Buffer.from("a\u0001b\u0002c\u0003d\u0004e\u0005f\u0007g")).includes("控制符"));
  chk("控制符 5 处 ⇒ ⑤不判", !kinds(Buffer.from("a\u0001b\u0002c\u0003d\u0004e\u0005f")).includes("控制符"));
  const entries = [{ path: "tmp/**/fixture-*.txt", kind: "U+FFFD", reason: "自检夹具" }];
  chk("白名单通配豁免", whitelisted(entries, "tmp/a/fixture-x.txt", "U+FFFD") && !whitelisted(entries, "tmp/a/other.txt", "U+FFFD"));
  console.log("SELF-TEST", ok ? "PASS" : "FAIL");
  return ok ? 0 : 1;
}

// ─── main ───
if (has("--self-test")) process.exit(selfTest());

const entries = loadBaseline();
const files = has("--staged") ? stagedFiles() : walk(ROOT, []);
const { hits, exempt } = scanFiles(files, entries);

if (has("--json")) {
  console.log(JSON.stringify({ root: ROOT, files: files.length, new: hits, exempt: exempt.length }, null, 2));
} else {
  if (!has("--quiet")) {
    for (const h of hits) console.log(`${h.path}:${h.line}:${h.kind}:${h.context}`);
  }
  const filesHit = new Set(hits.map((h) => h.path)).size;
  console.log(`乱码扫 ${ROOT}｜件 ${files.length}｜新增 ${hits.length} 处${filesHit ? `（${filesHit} 件）` : ""}｜白名单内 ${exempt.length} 处`);
}
process.exit(hits.length ? 1 : 0);
