#!/usr/bin/env node
// SYS-49 每日备份（works 全生态 → git bundle）：可独立跑，看板引擎跨日例程 spawn 本件。
// 范围：works 根 + 其下全部嵌套库（各体系建设/云服务器管理/运营中心…·旧备份.bat 九库口径）+ 0027-mov。
// （works 仓自身仅骨架 4 文件，体系内容全在嵌套库里——只备 works+mov 会静默丢体系，2026-09-11 实测）
// 产物：C:\mov备份\<YYYYMMDD>\<name>.bundle + 备份日志.md + manifest.json（sha256/bundle verify 可核）
// 恢复：git -c core.autocrlf=false clone <bundle> <dir>（bundle 即完整仓；或 git bundle unbundle 后再核 sha256）
// 用法：node 备份.mjs [--out C:\mov备份] [--date YYYYMMDD] [--repos "name=path,..."]
import fs from "node:fs";
import { MOV as MOV_HOME, PRODUCT } from "../机器闸/lib/root.mjs"; // SYS-160：根解析单源
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
if (argv.includes("--help")) {
  console.log('用法：node 备份.mjs [--out C:\\mov备份] [--date YYYYMMDD] [--repos "name=path,..."]（默认：works+嵌套库全量+0027-mov）');
  process.exit(0);
}
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const OUT = opt("out", "C:\\mov备份");
const DATE = opt("date", new Date().toLocaleDateString("sv-SE").replaceAll("-", "")); // sv-SE=YYYY-MM-DD，区域无关（旧 bat 中文区域事故同因）
const MOV = MOV_HOME; // SYS-160：九库全景根走根解析（MOV_HOME 覆盖·缺省=原 E:/MOV）
function discover(root) { // 两层发现：MOV/* 及其子层里含 .git 的目录（云服务器管理/运营中心 = 体系内嵌库）
  const found = [];
  const scan = (dir, depth) => {
    let entries = []; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = path.join(dir, e.name);
      if (fs.existsSync(path.join(p, ".git"))) found.push({ name: e.name, dir: p });
      if (depth > 0) scan(p, depth - 1);
    }
  };
  scan(root, 1);
  return found;
}
const REPOS = (opt("repos", "") || ["works=" + MOV, ...discover(MOV).map((r) => `${r.name}=${r.dir}`), "mov=" + PRODUCT].join(","))
  .split(",").map((s) => s.trim()).filter(Boolean)
  .map((s) => ({ name: s.slice(0, s.lastIndexOf("=")), dir: s.slice(s.lastIndexOf("=") + 1) }));

const outDir = path.join(OUT, DATE);
fs.mkdirSync(outDir, { recursive: true });
for (const f of ["备份日志.md", "manifest.json"]) { try { fs.rmSync(path.join(outDir, f)); } catch {} } // 开工即清旧件：存在=本轮完成的判据（引擎只认新鲜 manifest）
const t0 = Date.now(), entries = [], errors = [];
const git = (a) => execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true }); // 2026-09-11 巡检台补：windowsHide=true 防无控制台父进程给 git 子进程开新 conhost 窗口（用户报「一直跳 git cmd 窗」根因）
const sha256 = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const packOne = (dir, file) => { // 单仓打包+verify；成功返回 null，失败返回错误串
  try {
    if (!fs.existsSync(path.join(dir, ".git"))) throw new Error(`无 .git：${dir}`);
    git(["-C", dir, "bundle", "create", file, "--all"]);
    git(["bundle", "verify", file]); // 摘要自检（refs 完整性），失败即算本包失败
    return null;
  } catch (e) { return String(e.stderr || e.message).trim().split("\n").filter(Boolean).slice(-2).join(" "); }
};

for (const { name, dir } of REPOS) {
  const file = path.join(outDir, `${name}.bundle`);
  const t = Date.now();
  let err = packOne(dir, file);
  if (err) { sleep(4000); err = packOne(dir, file); } // 暂态失败（并发 git 操作/自动 gc）重试一次——2026-09-11 实中一次
  if (err) errors.push(`${name}: ${err}`);
  else entries.push({ name, repo: dir, file: path.relative(OUT, file), bytes: fs.statSync(file).size, sha256: sha256(file), heads: git(["bundle", "list-heads", file]).trim().split("\n").filter(Boolean), ms: Date.now() - t });
}
const ok = errors.length === 0 && entries.length === REPOS.length;
const md = [
  `# 备份日志 ${DATE}`, "",
  `- 时间：${new Date().toLocaleString("sv-SE")}｜目标：\`${outDir}\`｜结果：**${ok ? "✅ 完成" : "❌ 失败"}**｜耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  `- 恢复：\`git clone <bundle> <dir>\`（bundle 即完整仓，含全部 refs）`, "",
  "| 仓 | 包 | 大小 | sha256 | refs | 耗时 |", "|---|---|---|---|---|---|",
  ...entries.map((e) => `| ${e.name} | ${e.file} | ${(e.bytes / 1048576).toFixed(1)} MB | \`${e.sha256.slice(0, 16)}…\` | ${e.heads.length} | ${e.ms} ms |`),
  "",
  ...(errors.length ? ["## 错误", ...errors.map((e) => `- ${e}`), ""] : []),
].join("\n");
fs.writeFileSync(path.join(outDir, "备份日志.md"), md, "utf-8");
fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({ ok, date: DATE, at: new Date().toISOString(), out: outDir, entries, errors }, null, 2), "utf-8");
console.log(`备份${ok ? "完成" : "失败"} → ${path.join(outDir, "备份日志.md")}`);
process.exit(ok ? 0 : 1);
