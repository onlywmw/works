#!/usr/bin/env node
// SYS-55 设备装机台账工具：任何 adb install 后必记一行；与交付 manifest artifact_sha 互查。
//
// 用法：
//   node install-ledger.mjs 记 <apk路径> <来源> <操作者> [--device emulator-5554] [--no-install] [--note "备注"]
//       来源 = 交付单号（如 UPG-147）或「非交付件」标注（如 非交付件（旧包·演示））
//   node install-ledger.mjs 核 [<单号>] [--device emulator-5554]
//       ①设备现装 sha ↔ 台账末行；②（给单号时）台账该单行 ↔ 交付 manifest artifact_sha
//
// 台账：处理中心/验证产物/设备装机台账.md（约定：验收/程序员/设计师各自装机均须记行）。
// SYS-158：装机前过占用闸（真机占用.mjs 单一真源）——占中非本人 ⇒ 拒装（--force 显式旁路写 _forceLog）。
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { guardOccupancy } from "./checks/装机前置.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));   // 处理中心/机器闸
const CENTER = path.join(HERE, "..");                        // 处理中心
const WORKS = path.join(CENTER, "..");                       // 体系根
const LEDGER = path.join(CENTER, "验证产物", "设备装机台账.md");
const MANIFEST_DIR = path.join(CENTER, "交付清单");
const PKG = "cn.mov.app";   // applicationId（与 namespace com.mov.android 分家——设备侧一律用 applicationId；2026-09-29 同族坑：key 误放旧包名目录）
const ADB = process.env.ADB || (fs.existsSync("C:/Users/Administrator/AppData/Local/Android/Sdk/platform-tools/adb.exe")
  ? "C:/Users/Administrator/AppData/Local/Android/Sdk/platform-tools/adb.exe" : "adb");

const HEADER = `# 设备装机台账（SYS-55）

> **约定**：**任何 adb install 后必记一行**（验收员/程序员/设计师各自装机均须记）；来源=交付单号 或「非交付件」标注。
> **SYS-158 占用闸**：装机前过 \`checks/装机前置.mjs\` 占用闸——占中非本人则拒装（\`--force --why "…"\` 显式旁路·记 \`_forceLog\`）。
> 工具：\`node 处理中心/机器闸/install-ledger.mjs 记 <apk> <来源> <操作者> [--device <序列>] [--no-install] [--note "…"] [--force --why "…"]\`
> 　　　\`node 处理中心/机器闸/install-ledger.mjs 核 [<单号>] [--device <序列>]\`（①设备现装 sha↔台账末行 ②台账行↔交付 manifest artifact_sha）

| 时间 | 操作者 | 设备 | 包名 | sha256 | 来源 | 备注 |
|---|---|---|---|---|---|---|
`;

const sha256 = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const now = () => new Date().toLocaleString("sv-SE");

function adb(args, device) {
  const full = device ? ["-s", device, ...args] : args;
  return execFileSync(ADB, full, { windowsHide: true, encoding: "utf8", timeout: 180000 });
}

function deviceSha(device) {
  const out = adb(["shell", "pm", "path", PKG], device);
  const m = out.match(/package:(.+\.apk)\s*$/m);
  if (!m) throw new Error(`取设备 ${device} 上 ${PKG} 的 apk 路径失败`);
  const tmp = path.join(os.tmpdir(), `ledger-${Date.now()}.apk`);
  try {
    execFileSync(ADB, ["-s", device, "pull", m[1], tmp], { windowsHide: true, stdio: ["ignore", "ignore", "ignore"], timeout: 180000 });
    return { sha: sha256(tmp), apkPath: m[1] };
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
}

function ledgerRows() {
  if (!fs.existsSync(LEDGER)) return [];
  return fs.readFileSync(LEDGER, "utf8").split("\n")
    .filter((l) => l.startsWith("| ") && !l.includes("时间") && !l.includes("---"))
    .map((l) => l.split("|").map((c) => c.trim()).filter((c) => c !== ""))
    .filter((c) => c.length >= 7);
}

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const device = opt("--device", "emulator-5554");

if (cmd === "记") {
  const apk = args[1], source = args[2], operator = args[3];
  if (!apk || !source || !operator) { console.error("用法：记 <apk> <来源> <操作者> [--device d] [--no-install] [--note \"…\"]"); process.exit(2); }
  if (!fs.existsSync(apk)) { console.error(`apk 不存在：${apk}`); process.exit(1); }
  const sha = sha256(apk);
  let note = opt("--note", "");
  if (!args.includes("--no-install")) {
    // SYS-158：装机前占用闸（占中非本人 ⇒ 拒装；--force 越过写 _forceLog）
    const g = guardOccupancy({
      serial: device,
      who: operator,
      force: args.includes("--force"),
      why: opt("--why", ""),
      tool: "install-ledger",
    });
    console.log(g.msg);
    if (!g.ok) process.exit(g.code);
    let r;
    try { r = adb(["install", "-r", "-d", apk], device); }
    catch (e) { r = (e.stdout || "") + (e.stderr || ""); console.error(r); process.exit(1); }
    if (!/Success/.test(r)) { console.error(`安装未成功：${r.trim().split("\n").slice(-1)[0]}`); process.exit(1); }
    note = note ? note + "；安装=Success" : "安装=Success";
  } else {
    note = note ? note + "；未实装（--no-install）" : "未实装（--no-install）";
  }
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  if (!fs.existsSync(LEDGER)) fs.writeFileSync(LEDGER, HEADER, "utf8");
  const row = `| ${now()} | ${operator} | ${device} | ${PKG} | ${sha} | ${source} | ${note} |\n`;
  fs.appendFileSync(LEDGER, row, "utf8");
  console.log(`✅ 已记：${source} ← ${operator}｜sha=${sha.slice(0, 16)}…｜${device}`);
  console.log(`   台账：${path.relative(WORKS, LEDGER)}`);
} else if (cmd === "核") {
  const ticket = args[1] && !args[1].startsWith("--") ? args[1] : null;
  const rows = ledgerRows();
  if (!rows.length) { console.error("台账为空——先记一行"); process.exit(1); }
  const last = rows[rows.length - 1];
  const dev = deviceSha(device);
  let ok = true;
  const c1 = dev.sha === last[4];
  console.log(`① 设备现装 ↔ 台账末行：${c1 ? "✅ 一致" : "❌ 不一致"}`);
  if (!c1) { console.log(`   设备   ${dev.sha}`); console.log(`   末行   ${last[4]}（${last[0]} ${last[1]} ${last[5]}）`); ok = false; }
  if (ticket) {
    const row = [...rows].reverse().find((r) => r[5] === ticket || r[5].startsWith(ticket));
    let manifest = null;
    try { manifest = JSON.parse(fs.readFileSync(path.join(MANIFEST_DIR, `delivery_${ticket.replace("-", "")}_manifest.json`), "utf8")); } catch {}
    if (!row) { console.log(`② 台账无「${ticket}」行：❌`); ok = false; }
    else if (!manifest) { console.log(`② 「${ticket}」台账行 sha=${row[4].slice(0, 16)}…；manifest 缺（待生成）：⚠`); }
    else {
      const c2 = row[4] === manifest.artifact_sha;
      console.log(`② 台账(${ticket}) ↔ manifest.artifact_sha：${c2 ? "✅ 一致" : "❌ 不一致"}`);
      if (!c2) { console.log(`   台账     ${row[4]}`); console.log(`   manifest ${manifest.artifact_sha}`); ok = false; }
    }
  }
  process.exit(ok ? 0 : 1);
} else {
  console.log("用法：node install-ledger.mjs 记 <apk> <来源> <操作者> [--device d] [--no-install] [--note \"…\"]｜核 [<单号>] [--device d]");
  process.exit(2);
}
