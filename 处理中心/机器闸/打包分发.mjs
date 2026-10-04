#!/usr/bin/env node
/**
 * 打包分发.mjs —— UPG-467 相位①：工单系统**洁净导出**（发行版打包）；SYS-177：升级清单＋--release
 *
 * 用法：
 *   node 处理中心/机器闸/打包分发.mjs [--out <输出父目录>] [--version <a.b.c>] [--no-zip] [--json]
 *   node 处理中心/机器闸/打包分发.mjs --release [--bump minor|major] [--note <说明>]   ← SYS-177：版本递增＋CHANGELOG 段＋打包
 *   默认 --out = 处理中心/验证产物/发行版（体系根/dist 属根层白名单外·不可用）
 *
 * 产物（<out>/）：
 *   mov-ticket-<ver>/             ← 洁净导出树（机制＋模板；数据/凭据/日志/状态一票不出）
 *   mov-ticket-<ver>/UPGRADE_MANIFEST.json ← 逐件 {path, sha256, class}（class=机制|模板|配置域·打包工具单源）
 *   mov-ticket-<ver>.zip          ← 发行包（Windows 平台原生 tar -a 打包；tar 缺＝明说拒出）
 *   mov-ticket-<ver>.zip.sha256   ← 包摘要（双通道对账用）
 *   mov-ticket-<ver>/SHA256SUMS   ← 包内逐件摘要（sha256sum -c 可消费·SUMS 自身不在列）
 *
 * 判据（rc：0=洁净＋打包成 ｜ 1=洁净判据红（拒绝产出）｜ 2=用法/环境错）：
 *   ①路径黑名单零命中（邮箱/单/seats/状态 json/日志/缓存/凭据）
 *   ②内容密钥模式零命中（sk-/私钥/AWS/GitHub token…）
 *   ③账本＝骨架（工单库.md 非正文：<4KB 且零卡片头）
 * 红线：只读体系仓（**例外**：`--release` 按派单更新 version.json＋CHANGELOG 两件）、只写 <out>；
 *       不删不改其他体系件；不联网。
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", ".."); // 体系根
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const JSON_OUT = process.argv.includes("--json");
const NO_ZIP = process.argv.includes("--no-zip");

/* ------------------------------ 白名单（进包） ------------------------------ */
// 每条＝{root: SYS 相对路径, allow: (rel=>bool) 可选过滤}；rel＝相对 SYS 的 posix 路径
const RULES = [
  { root: "处理中心/README.md" },
  { root: "处理中心/看板", filter: kanbanFilter },
  { root: "处理中心/机器闸", filter: machineFilter },
  { root: "处理中心/邮局", filter: postFilter },
];

/** 看板：机制扩展名进；全部 *.json（状态件）、*.log、工位/<角色>/ 数据、单//seats/agent态 不进。 */
function kanbanFilter(rel) {
  if (!rel.startsWith("处理中心/看板/")) return false;
  const sub = rel.slice("处理中心/看板/".length);
  if (sub === "") return false;
  if (/^(单|seats|agent态|__pycache__|故障归档)\//.test(sub)) return false;
  if (sub === "工位" || sub.startsWith("工位/")) {
    // 工位：只放模板件（AGENTS.md/CLAUDE.md/README.md），其余＝角色工作数据
    return /^工位\/([^/]+\/)?(AGENTS|CLAUDE|README)\.md$/.test(sub);
  }
  if (sub.endsWith(".log")) return false;
  if (sub.endsWith(".json")) return false; // 看板状态件一律不进（含各哨兵/心跳/座态）
  return true; // .mjs/.ps1/.cmd/.md/…
}

/** 机器闸：脚本/文档/白名单注册表进；缓存/占用/报告产物/__pycache__ 不进。 */
function machineFilter(rel) {
  if (!rel.startsWith("处理中心/机器闸/")) return false;
  const sub = rel.slice("处理中心/机器闸/".length);
  if (sub === "") return false;
  if (sub.startsWith("__pycache__/")) return false;
  if (/^(工具自检\.cache\.json|真机占用\.json|cos-verify-report-.*\.json)$/.test(sub)) return false;
  if (/^checks\/.*\.(json)$/.test(sub)) return false; // checks/ 只放脚本+md（keys.local.json=凭据）
  if (sub.endsWith(".log")) return false;
  return true;
}

/** 邮局：机制件进；邮箱/.claims/日志/值守工状态 不进。 */
function postFilter(rel) {
  if (!rel.startsWith("处理中心/邮局/")) return false;
  const sub = rel.slice("处理中心/邮局/".length);
  if (sub === "") return false;
  if (/^(邮箱|\.claims|__pycache__)\//.test(sub)) return false;
  if (sub.endsWith(".log") || sub === "值守工.json") return false;
  return true;
}

/* ------------------------------ SYS-177 类别规则（单源·下游同包消费） ------------------------------ */
// class ∈ 机制|模板|配置域：机制=行为代码（升级覆盖）；模板=文案/骨架（升级覆盖·本地改⇒偏离）；
// 配置域=下游可自定义（升级**保留本机**·缺失才补默认）。禁包外散落第二处判定。
const CONFIG_DOMAIN = [
  /^处理中心\/工单库\.md$/,                                        // 账本骨架（下游数据）
  /^处理中心\/(问题区|交付清单|验收标准冻结区)\/README\.md$/,    // 骨架位
  /^处理中心\/机器闸\/(tool-registry|体系清单|shared-leaf-registry|可携性豁免|wired-audit-baseline|stages)\.json$/,
  /^处理中心\/看板\/工位\/[^/]+\/(AGENTS|CLAUDE|README)\.md$/,     // 角色卡（下游可改卡面）
  /seat-score-lexicon\/[^/]+\.json$/,                              // 词表体系覆盖（下游可调）
];
function classOf(rel) {
  if (CONFIG_DOMAIN.some((re) => re.test(rel))) return "配置域";
  if (rel.endsWith(".md")) return "模板";
  return "机制";
}

/* ------------------------------ 黑名单（洁净判据·双保险） ------------------------------ */
const FORBIDDEN_PATH = [
  /\/邮箱\//, /\/\.claims\//, /处理中心\/看板\/(单|seats|agent态|故障归档)\//, /__pycache__/,
  /\.log$/, /\.cache\.json$/, /证明|证据|-evidence\//,
  /(token哨兵|会话轮换|值守池|例行产出锚|工位绑定|席位表现|座态|心跳|待派哨兵|持单哨兵|挂起|根层哨兵|看门狗|静默拉起|疯狗|值守工)\.json$/,
  /(真机占用|cos-verify-report)\.json$/, /keys\.local\.json$/,
];
const FORBIDDEN_CONTENT = [
  { name: "OpenAI 风格密钥", re: /\bsk-[A-Za-z0-9_-]{16,}\b/ },
  { name: "私钥块", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "SSH 公钥", re: /\bssh-(rsa|ed25519) AAAA[A-Za-z0-9+/=]{20,}/ },
  { name: "GitHub token", re: /\bghp_[A-Za-z0-9]{20,}\b/ },
  { name: "AWS key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "长 token 赋值", re: /(api[_-]?key|secret|token|password)["']?\s*[:=]\s*["'][A-Za-z0-9_\-./+]{24,}["']/i },
];
// 内容扫描豁免：工具自身（含模式定义·本就出现这些字样）
const CONTENT_SCAN_SKIP = new Set(["处理中心/机器闸/打包分发.mjs"]);

/* ------------------------------ 空账本骨架 ------------------------------ */
const LEDGER_TEMPLATES = {
  "处理中心/工单库.md": `# 工单库（空·初始化骨架）

> 本文件＝工单唯一真相源（SYS 体系口径）。新装系统从空账本起步：取号 → 立卡 → 派单 → 交付 → 验收 → 合并。
> 取号：node 处理中心/机器闸/取号.mjs <前缀>（前缀 UPG/SYS/W/S/HMOS…按体系约定）。
> 卡片模板与状态块格式见 处理中心/README.md 与 处理中心/机器闸/set-status.py。

---

（暂无工单——首卡由 取号.mjs 生成）
`,
  "处理中心/问题区/README.md": `# 问题区（空）

> 问题/风险挂账落点（红线 27 卫生口径见 处理中心/README.md）。
> 一条问题＝一行或一件；处理完毕归档到 处理中心/归档/。
`,
  "处理中心/交付清单/README.md": `# 交付清单（空）

> 交付凭据落点：DEL 清单由 程序员/_tools/deliver-gen.mjs 机制产出，只增不改。
> 索引：node 处理中心/机器闸/delivery-index.mjs。
`,
  "处理中心/验收标准冻结区/README.md": `# 验收标准冻结区（空）

> STD 冻结件落点：派单定稿即冻结验收标准（口径见 处理中心/README.md）。
`,
};

/* ------------------------------ 导出实现 ------------------------------ */
const VERSION_SRC = path.join(SYS, "处理中心", "机器闸", "version.json");
const CHANGELOG_SRC = path.join(SYS, "处理中心", "机器闸", "CHANGELOG.md");
const RELEASE = process.argv.includes("--release");
const BUMP = arg("--bump", "patch");
const NOTE = arg("--note", "（本版变更说明待补）");
const readVersionSrc = () => { try { return JSON.parse(fs.readFileSync(VERSION_SRC, "utf8").replace(/^﻿/, "")); } catch { return { version: "0.0.0" }; } }; // 去 BOM（PowerShell Set-Content -Encoding UTF8 会写 BOM·2026-10-04 演习实测）
const bumpVersion = (v, kind) => {
  const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return v;
  const [a, b, c] = m.slice(1).map(Number);
  if (kind === "major") return `${a + 1}.0.0`;
  if (kind === "minor") return `${a}.${b + 1}.0`;
  return `${a}.${b}.${c + 1}`;
};
let version = arg("--version") || readVersionSrc().version;
if (RELEASE) {
  const base = arg("--version") || readVersionSrc().version;
  version = bumpVersion(base, BUMP);
  const today = new Date().toISOString().slice(0, 10);
  // ① 版本源递增
  const src = readVersionSrc();
  fs.writeFileSync(VERSION_SRC, JSON.stringify({ ...src, version, updated_at: today }, null, 2) + "\n", "utf8");
  // ② CHANGELOG 追加段（新段置顶·H1 之后）
  const cl = fs.existsSync(CHANGELOG_SRC) ? fs.readFileSync(CHANGELOG_SRC, "utf8") : "# CHANGELOG · MOV 工单系统\n";
  const h1 = cl.match(/^#[^\n]*\n/);
  const head = h1 ? h1[0] : "";
  const rest = h1 ? cl.slice(h1[0].length) : cl;
  fs.writeFileSync(CHANGELOG_SRC, head + `\n## ${version}（${today}）\n\n- ${NOTE}\n` + rest, "utf8");
  console.log(`🔖 --release（${BUMP}）：${base} → ${version}（version.json＋CHANGELOG 已更新）`);
}
const OUT = path.resolve(arg("--out", path.join(SYS, "处理中心", "验证产物", "发行版")));
const PKG = `mov-ticket-${version}`;
const PKG_DIR = path.join(OUT, PKG);
const fails = [];

function walk(root) {
  const abs = path.join(SYS, root);
  if (!fs.existsSync(abs)) return [];
  const st = fs.statSync(abs);
  if (st.isFile()) return [root];
  const out = [];
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = `${root}/${e.name}`;
    if (e.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

// 1) 收集进包件集
const files = [];
for (const r of RULES) {
  for (const rel of walk(r.root)) {
    if (r.filter && !r.filter(rel)) continue;
    files.push(rel);
  }
}
// 根层数据面若混入（防御式）剔除
const kept = files.filter((f) => !FORBIDDEN_PATH.some((re) => re.test("/" + f)));

// 2) 落盘导出树（先清后放）
fs.rmSync(PKG_DIR, { recursive: true, force: true });
fs.mkdirSync(PKG_DIR, { recursive: true });
for (const rel of kept) {
  const dst = path.join(PKG_DIR, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(path.join(SYS, rel), dst);
}
// 2b) 空账本骨架
for (const [rel, body] of Object.entries(LEDGER_TEMPLATES)) {
  const dst = path.join(PKG_DIR, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, body, "utf8");
}
// 2c) 包内 version.json（版本源副本·覆盖源件形态）
fs.writeFileSync(path.join(PKG_DIR, "version.json"), JSON.stringify({
  name: "mov-ticket", version, built_at: new Date().toISOString().slice(0, 19).replace("T", " "),
  channel: "release",
}, null, 2) + "\n", "utf8");
// 2d) 发行版 README/CHANGELOG（入包顶·名字归正）
for (const [src, dst] of [["处理中心/机器闸/发行版README.md", "README.md"], ["处理中心/机器闸/CHANGELOG.md", "CHANGELOG.md"], ["处理中心/机器闸/install.ps1", "install.ps1"]]) {
  const a = path.join(SYS, src);
  if (fs.existsSync(a)) fs.copyFileSync(a, path.join(PKG_DIR, dst));
  else fails.push(`缺发行版件: ${src}`);
}

// 3) 洁净判据：路径 + 内容 + 账本骨架
const pkgFiles = walk2(PKG_DIR);
function walk2(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk2(p));
    else out.push(path.relative(PKG_DIR, p).split(path.sep).join("/"));
  }
  return out;
}
for (const rel of pkgFiles) {
  if (FORBIDDEN_PATH.some((re) => re.test("/" + rel))) fails.push(`路径黑名单命中: ${rel}`);
  const abs = path.join(PKG_DIR, rel);
  if (fs.statSync(abs).size > 4 * 1024 * 1024) failuresSize(rel); // 超大件提醒（不判红）
  const body = fs.readFileSync(abs, "utf8");
  if (!CONTENT_SCAN_SKIP.has(rel)) {
    for (const c of FORBIDDEN_CONTENT) if (c.re.test(body)) fails.push(`内容密钥模式命中(${c.name}): ${rel}`);
  }
}
function failuresSize(rel) { console.log(`  ⚠ 大件（>4MB·人核）: ${rel}`); }
{
  const lib = fs.readFileSync(path.join(PKG_DIR, "处理中心/工单库.md"), "utf8");
  const cards = (lib.match(/^# (?:UPG|SYS|W|S|HMOS)-\d+/gm) || []).length;
  if (cards > 0 || Buffer.byteLength(lib, "utf8") > 4096) fails.push(`账本非骨架（卡片 ${cards}·${Buffer.byteLength(lib)}B）`);
}

if (fails.length) {
  console.log("❌ 洁净判据红——**拒绝产出**（导出树保留供排查）:");
  for (const f of fails.slice(0, 30)) console.log("  - " + f);
  process.exit(1);
}

// 4) SYS-177：包内升级清单（逐件 path/sha256/class）——清单自身不入列；再 SHA256SUMS（含清单）＋打包
const sha256Of = (abs) => createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
const manifestFiles = pkgFiles.filter((r) => r !== "UPGRADE_MANIFEST.json").sort()
  .map((rel) => ({ path: rel, sha256: sha256Of(path.join(PKG_DIR, rel)), class: classOf(rel) }));
const classCount = manifestFiles.reduce((m, f) => (m[f.class] = (m[f.class] || 0) + 1, m), {});
fs.writeFileSync(path.join(PKG_DIR, "UPGRADE_MANIFEST.json"), JSON.stringify({
  name: "mov-ticket", version,
  built_at: new Date().toISOString().slice(0, 19).replace("T", " "),
  generator: "打包分发.mjs（SYS-177）·class 单源=本工具 CONFIG_DOMAIN/classOf",
  count: manifestFiles.length,
  package_files: manifestFiles.length + 2, // 包内总件数（含清单自身与 SHA256SUMS——二者不入列：自指/摘要自指）
  excludes: ["UPGRADE_MANIFEST.json", "SHA256SUMS"],
  classes: classCount,
  files: manifestFiles,
}, null, 1) + "\n", "utf8");

const pkgFiles2 = walk2(PKG_DIR); // 含 UPGRADE_MANIFEST.json
const sums = [];
for (const rel of pkgFiles2.filter((r) => r !== "SHA256SUMS").sort()) {
  sums.push(`${sha256Of(path.join(PKG_DIR, rel))}  ${rel}`);
}
fs.writeFileSync(path.join(PKG_DIR, "SHA256SUMS"), sums.join("\n") + "\n", "utf8");

let zipSha = null;
if (!NO_ZIP) {
  const zip = path.join(OUT, `${PKG}.zip`);
  fs.rmSync(zip, { force: true });
  // Windows 原生 bsdtar 优先（MSYS/GNU tar 会把 E:/ 当远端主机 ⇒ "Cannot connect to E"）
  const tarCandidates = [
    path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe"),
    "tar",
  ];
  let ok = false, errText = "";
  for (const bin of tarCandidates) {
    try {
      const r = spawnSync(bin, ["-a", "-c", "-f", zip, "-C", OUT, PKG], { windowsHide: true, encoding: "utf8" });
      if (r.status === 0) { ok = true; break; }
      errText = (r.stderr || r.error?.message || "").trim();
    } catch (e) { errText = e.message; }
  }
  if (!ok) {
    console.error("❌ 打包失败（tar -a 不可用——Windows 10 1803+ 自带 System32\\tar.exe；或改 --no-zip 后人工打包）");
    console.error(errText.slice(0, 400));
    process.exit(2);
  }
  zipSha = createHash("sha256").update(fs.readFileSync(zip)).digest("hex");
  fs.writeFileSync(zip + ".sha256", `${zipSha}  ${PKG}.zip\n`, "utf8");
}

const summary = {
  version, pkg: PKG, out: OUT, files: pkgFiles2.length + 1,
  manifest_files: manifestFiles.length, classes: classCount, release: RELEASE,
  zip: NO_ZIP ? null : `${PKG}.zip`, zip_sha256: zipSha,
  clean: true,
};
if (JSON_OUT) console.log(JSON.stringify(summary, null, 2));
else {
  console.log(`✅ 发行版已产出：${path.join(OUT, PKG)}（${pkgFiles2.length + 1} 件·洁净判据全过）`);
  console.log(`   升级清单：UPGRADE_MANIFEST.json（${manifestFiles.length} 件：机制 ${classCount["机制"] || 0}｜模板 ${classCount["模板"] || 0}｜配置域 ${classCount["配置域"] || 0}）`);
  if (zipSha) console.log(`   包：${PKG}.zip  sha256=${zipSha}`);
  console.log(`   包内清单：${PKG}/SHA256SUMS（sha256sum -c 可核）`);
}
