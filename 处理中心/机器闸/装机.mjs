#!/usr/bin/env node
// 装机.mjs —— 设备装包**单一入口**：构建/直给 APK → 装到在联设备 → **回读断言** → 写「设备包.json」台账。
//
// 2026-10-02 立（用户报「都已经合了，为什么安装的总是旧包」）；2026-10-05 SYS-184 扩通用模式（change=device-package-governance·D2/D6）：
//   · 默认（无 --from）＝「main 对齐」（合并钩子那套不变）：主检出构建 debug → 装 → 回读；自判跳过（设备已=main 线／无 App 面改动）；占用闸双查。
//   · 通用（--from <树路径|main>）＝实验/取证装包：装该树（或 --apk 直给）→ 回读断言 → 台账记 purpose/until；占用闸认「自持」（who 口径同 真机占用.mjs）。
//   · 回读断言：install 后设备 versionName MUST == 本次 APK 的 versionName（aapt2 实测；回退树指纹 D1）——不符 rc=1。
//   · 台账：`处理中心/看板/设备包.json`（D6·每次实装追加；`装机哨兵.json` 原状保留兼容）。
//   · 跨签名保护（release↔debug）：默认拒绝并提示 `--allow-data-loss`；显式放行才卸载重装（清数据·台账留痕）。
//   · 对账（D5）：`--reconcile` 只读核「设备回读 vs 台账 last」——手工 adb install 也能被发现，不符 rc=1。
// 指纹读取规则（D1·单一真源 lib/device-version.mjs）：base sha＝`V1.1-` 后至首个 `+`；非 dirty 后缀（分支标记）=工作树包，不算 main。
//
// 用法：
//   node 处理中心/机器闸/装机.mjs [--repo <产品仓>] [--serial <adb序号>] [--pkg cn.mov.app] [--no-build] [--no-install] [--force] [--ticket <号>]
//   node .../装机.mjs --from <树路径|main> [--purpose "…"] [--until "YYYY-MM-DD HH:mm"] [--apk <文件>] [--allow-data-loss] [--who <名>] [--ticket <号>]
//   node .../装机.mjs --reconcile [--serial <adb序号>]
//   node .../装机.mjs --restore-check [--delay <秒·默认120>] --serial <机>   # SYS-186：放行回主（延迟检查→非 main 才装）
// 退出码：0=装成且回读通过（含 N/A 与自判跳过/被占 skip）｜1=构建/安装/回读不符/跨签名拒绝 ｜2=用法或环境错
// 读数（日志四件套口径）：rc＋APK 路径＋树/期望指纹＋设备 versionName＋serial
import { spawnSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { PRODUCT, WORKSPACE } from "./lib/root.mjs"; // SYS-160：根解析单源（SYS-184：WORKSPACE 用于别名探路）
import { baseSha, suffixOf, fingerprintOf, isMainLine, branchMarkOf } from "./lib/device-version.mjs"; // SYS-184：指纹解析单一真源

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");      // 体系仓根
const BOARD = path.join(ROOT, "处理中心", "看板");
const LOCK = path.join(BOARD, "装机.lock");
const STATE = path.join(BOARD, "装机哨兵.json");
const LEDGER = path.join(BOARD, "设备包.json");   // D6：设备包台账（单一真相）
const OCC = path.join(HERE, "真机占用.json");     // SYS-135 登记件（与 checks/真机占用.mjs 同一件）
const LEDGER_NOTE = "设备包台账（SYS-184·D6）：装机.mjs 每次实装后追加一条；last=entries 末条。字段 serial/versionName/baseSha/suffix/tree/purpose/by/until/apkSha256/at（allowDataLoss=跨签名显式放行留痕）。对账：装机.mjs --reconcile（设备回读 vs last）；口径见 设计师/经验库/已知坑.md「真机跑测试的占用纪律」与 change=device-package-governance。";

const opt = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(k);
const REPO = opt("--repo", PRODUCT);
const SERIAL = opt("--serial", "");
const PKG = opt("--pkg", "cn.mov.app");
const NO_BUILD = has("--no-build");
const NO_INSTALL = has("--no-install");
const FORCE = has("--force");   // 跳过自判（强制重建重装）＋越过占用
const FROM = opt("--from", ""); // 通用模式开关
const PURPOSE = opt("--purpose", "");
const UNTIL = opt("--until", "");
const APK_OPT = opt("--apk", "");
const ALLOW_DATA_LOSS = has("--allow-data-loss");
const WHO = opt("--who", process.env.MOV_SEAT || "装机.mjs"); // 占用闸认「自持」的身份口径（--who > MOV_SEAT > 装机.mjs）
const BY = opt("--by", WHO);
const TICKET = opt("--ticket", ""); // SYS-186：版本记账——成功后回写卡面 install:＋台账记 ticket
const RESTORE_CHECK = has("--restore-check"); // SYS-186：放行回主模式（延迟检查→非 main 才继续装）
const RECONCILE = has("--reconcile");
const GENERAL = !!FROM; // 通用模式（默认模式行为不变）

const SDK = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || "D:/Android/Sdk";
const ADB = process.env.ADB || path.join(SDK, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb");
const JAVA_HOME = process.env.JAVA_HOME || "C:\\Program Files\\Android\\Android Studio\\jbr";
if (!fs.existsSync(ADB)) { console.error(`✗ adb 不存在：${ADB}（设 ANDROID_HOME 或 ADB）`); process.exit(2); }
if (!fs.existsSync(REPO)) { console.error(`✗ 产品仓不存在：${REPO}`); process.exit(2); }

const sh = (cmd, args, o = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28, windowsHide: true, ...o });
const git = (args) => execFileSync("git", ["-C", REPO, ...args], { encoding: "utf8", windowsHide: true }).trim();
const saveState = (obj) => { try { fs.mkdirSync(BOARD, { recursive: true }); fs.writeFileSync(STATE, JSON.stringify({ at: new Date().toISOString(), ...obj }, null, 2)); } catch { /* 状态落卡失败不影响主流程 */ } };

// ── 设备包台账（D6·单一真相；写者唯一＝本工具，装机.lock 串行化）──
function ledgerRead() {
  try {
    const r = JSON.parse(fs.readFileSync(LEDGER, "utf8"));
    if (r && typeof r === "object") return { _note: LEDGER_NOTE, updatedAt: r.updatedAt || "", entries: Array.isArray(r.entries) ? r.entries : [] };
  } catch { /* 缺失/坏件 ⇒ 空台账 */ }
  return { _note: LEDGER_NOTE, updatedAt: "", entries: [] };
}
function ledgerAppend(rec) {
  const o = ledgerRead(); o.entries.push(rec); o.updatedAt = rec.at;
  try { fs.mkdirSync(BOARD, { recursive: true }); fs.writeFileSync(LEDGER, JSON.stringify(o, null, 2) + "\n"); }
  catch (e) { console.log(`（设备包台账写失败·不影响装机：${String(e.message).slice(0, 60)}）`); }
  return rec;
}
const sha256File = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

// ── 设备读数：versionName ＋ 是否 debuggable（跨签名判定用；未装 ⇒ ver=""）──
function readDevice(serialArg) {
  const dp = sh(ADB, ["-s", serialArg, "shell", "dumpsys", "package", PKG]);
  const so = String(dp.stdout || "");
  const m = so.match(/versionName=(\S+)/);
  const flags = [...so.matchAll(/flags=\[([^\]]*)\]/g)];
  return { ver: m ? m[1] : "", debug: flags.some((x) => /DEBUGGABLE/.test(x[1])) ? true : (m ? false : null) };
}
function onlineSerials() {
  return String(sh(ADB, ["devices"]).stdout || "").split(/\r?\n/).filter((l) => /\tdevice$/.test(l)).map((l) => l.split(/\t/)[0]);
}

// ── APK 读数（aapt2 实测 versionName/debuggable；找不到 aapt2 ⇒ null 走树指纹回退）──
function aapt2Path() {
  if (process.env.AAPT2 && fs.existsSync(process.env.AAPT2)) return process.env.AAPT2;
  const bt = path.join(SDK, "build-tools");
  try {
    for (const v of fs.readdirSync(bt).sort().reverse()) {
      const p = path.join(bt, v, process.platform === "win32" ? "aapt2.exe" : "aapt2");
      if (fs.existsSync(p)) return p;
    }
  } catch { /* 无 SDK build-tools ⇒ 回退 */ }
  return "";
}
function apkInfo(apk) {
  const exe = aapt2Path();
  if (!exe) return null;
  const r = sh(exe, ["dump", "badging", apk]);
  if (r.status !== 0) return null;
  const so = String(r.stdout || "");
  const m = so.match(/versionName='([^']*)'/);
  return { versionName: m ? m[1] : "", debuggable: /application-debuggable/.test(so) };
}

// ── 占用闸读取（抽为助手：构建**前**与装包**前**各查一次——2026-10-04 20:31 顶替事故修：
//   原只在构建前查一次，构建窗 ~3min 内新登记的占用不被看见 ⇒ 装包前 MUST 再查（check-at-install·511 O-B 真因）。
//   allowSelf：认「自持」（who 同 真机占用.mjs/装机前置.mjs 口径）——实验者自己的窗口内装自己的包；他席占用仍 skip。──
function occupancyBlock({ allowSelf = false } = {}) {
  if (!serial || FORCE) return null;
  try {
    const occ = JSON.parse(fs.readFileSync(OCC, "utf8"));
    const cur = occ[serial];
    if (cur && cur.until) {
      const until = new Date(String(cur.until).replace(/-/g, "/")).getTime();
      if (until > Date.now()) {
        if (allowSelf && String(cur.who || "") === WHO) return null;
        return { who: cur.who, until: cur.until, why: cur.why };
      }
    }
  } catch (e) { console.log(`（占用闸读取失败·按无占用继续：${String(e.message).slice(0, 60)}）`); }
  return null;
}

// ── 对账（D5·只读）：设备回读 vs 台账 last —— 手工 adb install 也在此被发现；0=一致 1=不符 2=环境/无台账 ──
function runReconcile() {
  const devs = onlineSerials();
  const s = SERIAL || devs[0] || "";
  if (!s) { console.error("✗ --reconcile：无设备在联（adb devices 无 device）"); return 2; }
  const { ver } = readDevice(s);
  if (!ver) { console.error(`✗ --reconcile：读不到 ${s} 上 ${PKG} 的 versionName（未装？）`); return 2; }
  const L = ledgerRead();
  const last = L.entries[L.entries.length - 1] || null;
  if (!last) { console.error(`✗ --reconcile：台账 ${path.relative(ROOT, LEDGER)} 尚未建立（无记录）——先经 装机.mjs 装一次`); return 2; }
  if (last.versionName !== ver) {
    console.error(`✗ 对账不符（D5）：设备实测 ${ver} ≠ 台账 last ${last.versionName}（${last.at}·${last.tree || "?"}${last.purpose ? "·" + last.purpose : ""}）——疑似手工安装未记账/或台账被改`);
    return 1;
  }
  console.log(`✅ 对账一致：设备 ${ver} == 台账 last（${last.at}·${last.tree || "?"}${last.purpose ? "·" + last.purpose : ""}）`);
  return 0;
}
if (RECONCILE) process.exit(runReconcile());

// ── SYS-186 放行回主（--restore-check）：占用放行后排程的延迟检查（防抖=先睡不持锁）──
//   纪律：占用中（任何 who·放行后的下一席优先）/设备离线/已 main 线 ⇒ 跳过；冷却期内不重复（回主哨兵.json）；
//   失败退避由引擎 30min 巡检兜底（本件不抢装、不打断节奏）。
const RESTORE_STATE = path.join(BOARD, "回主哨兵.json");
const RESTORE_COOLDOWN_MS = 10 * 60e3;
const restoreStateRead = () => { try { return JSON.parse(fs.readFileSync(RESTORE_STATE, "utf8")); } catch { return {}; } };
const restoreStatePatch = (patch) => {
  try { fs.mkdirSync(BOARD, { recursive: true }); fs.writeFileSync(RESTORE_STATE, JSON.stringify({ ...restoreStateRead(), ...patch }, null, 2) + "\n"); }
  catch { /* 状态落盘失败不影响主流程 */ }
};
const sleepSync = (ms) => { if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };
if (RESTORE_CHECK) {
  const delayMs = Math.max(0, Number(opt("--delay", "120")) || 0) * 1000;
  if (delayMs > 0) {
    console.log(`⏳ 回主检查：等待 ${Math.round(delayMs / 1000)}s（放行防抖——不打断下一席开机节奏）…`);
    sleepSync(delayMs);
  }
  const occ = (() => { try { return JSON.parse(fs.readFileSync(OCC, "utf8")); } catch { return {}; } })();
  const nowMs = Date.now();
  const occupied = Object.entries(occ).some(([k, o]) => !k.startsWith("_") && o && o.until && Date.parse(String(o.until).replace(" ", "T")) > nowMs);
  if (occupied) { console.log("○ 回主检查：设备又被占用 ⇒ 跳过（放行节奏优先；巡检兜底）"); process.exit(0); }
  const st = restoreStateRead();
  if (st.lastAttemptAt && nowMs - Date.parse(st.lastAttemptAt) < RESTORE_COOLDOWN_MS) {
    console.log(`○ 回主检查：冷却期内（上次尝试 ${st.lastAttemptAt}·${st.lastResult || "?"}）⇒ 跳过`);
    process.exit(0);
  }
  const devs0 = onlineSerials();
  if (!devs0.length) { console.log("○ 回主检查：设备离线 ⇒ 跳过（巡检兜底）"); process.exit(0); }
  const ver0 = readDevice(devs0[0]).ver || "";
  const headShort = git(["rev-parse", "--short", "HEAD"]);
  if (ver0 && isMainLine(ver0, headShort)) { console.log(`○ 回主检查：设备已是 main 线（${ver0} = ${headShort}）⇒ 无需回主`); process.exit(0); }
  console.log(`🏠 回主检查：设备 ${ver0 || "(未取到)"} ≠ main ${headShort} 线 ⇒ 触发回主装机`);
  restoreStatePatch({ lastAttemptAt: new Date().toISOString(), lastResult: "attempt", device: ver0, main: headShort });
}

// ── 并发锁（钩子可能连环触发——串行化，防两连构建互踩）──
try {
  const st = JSON.parse(fs.readFileSync(LOCK, "utf8"));
  if (st.at && Date.now() - new Date(st.at).getTime() < 20 * 60 * 1000) {
    console.log(`已有装机在跑（lock at ${st.at}·pid ${st.pid}）⇒ 跳过本次`);
    process.exit(0);
  }
} catch { /* 无锁或坏锁＝可跑 */ }
fs.mkdirSync(BOARD, { recursive: true });
fs.writeFileSync(LOCK, JSON.stringify({ at: new Date().toISOString(), pid: process.pid }));
process.on("exit", () => { try { fs.unlinkSync(LOCK); } catch { /* 已清 */ } });

// ① 主检出面：HEAD 与 origin/main 对账（装「未推/未取」的包会继续误导用户——照装但留痕）
const head = git(["rev-parse", "HEAD"]);
const short = git(["rev-parse", "--short", "HEAD"]) || head.slice(0, 8); // SYS-184：与构建期 `--short` 同口径（原 slice(0,8) 在 --short≠8 时会对不上）
let origin = "";
try { origin = git(["rev-parse", "origin/main"]); } catch { /* 无 origin 面（理论上产品仓恒有） */ }
if (origin && origin !== head) {
  console.log(`⚠ HEAD(${short}) ≠ origin/main(${origin.slice(0, 8)})——设备包将不是远端现头（未推/未取）；照装但留痕`);
}

// ①a 目标树（通用模式）——默认模式＝主检出
let TREE = REPO;
if (GENERAL) {
  TREE = FROM.toLowerCase() === "main" ? REPO : path.resolve(FROM);
  if (!fs.existsSync(TREE)) { console.error(`✗ --from 树路径不存在：${TREE}`); process.exit(2); }
  console.log(`通用模式：树=${TREE}${PURPOSE ? `｜purpose=${PURPOSE}` : ""}${UNTIL ? `｜until=${UNTIL}` : ""}｜who=${WHO}`);
}
const treeFp = fingerprintOf(TREE); // D1 期望指纹（树侧；APK 可读时以 APK 实测为准）

// ①b 构建拼写口径：非 ASCII 根（E:\mov归档）**同一棵树混用拼写**会致 DexingNoClasspathTransform
//    「different roots」（2026-10-02 实测·口径在案：测试/构建走 subst ASCII 别名——设计师/项目配置.md）。
const ASCII_ALIASES = ["Q", "T", "U", "V", "W", "X", "Y", "Z", "N", "M", "R", "S"];
// SYS-184 修：别名必须指向**同一棵树**（原版只比 HEAD——worktree 与主检出同头时会误用主检出别名，构建进错树、
//   期望 APK 不存在而假红）。候选＝字母根 ＋「工作区相对路径」（worktree 在 E:/mov工作区 下 ⇒ M:/<名>）；
//   `--show-toplevel` 同树校验。subst 输出为 OEM 编码不解析（中文路径会花）——只靠文件系统实测。
const canonPath = (p) => {
  let x = p; try { x = fs.realpathSync.native(p); } catch { x = path.resolve(p); }
  x = x.replace(/\\/g, "/").replace(/\/+$/, "");
  return process.platform === "win32" ? x.toLowerCase() : x;
};
const probeAlias = () => {
  if (process.platform !== "win32") return null;
  const cands = new Set();
  const relWs = path.relative(path.resolve(WORKSPACE), path.resolve(TREE));
  for (const d of ASCII_ALIASES) {
    cands.add(`${d}:/`);
    if (relWs && !relWs.startsWith("..") && !path.isAbsolute(relWs)) cands.add(path.join(`${d}:/`, relWs).replace(/\\/g, "/"));
  }
  const tree = canonPath(TREE);
  for (const cand of cands) {
    try {
      if (!fs.existsSync(path.join(cand, "app/src/main/AndroidManifest.xml"))) continue;
      const top = execFileSync("git", ["-C", cand, "rev-parse", "--show-toplevel"], { encoding: "utf8", windowsHide: true }).trim();
      if (canonPath(top) === tree) return cand;
    } catch { /* 盘不存在/非 git：跳过 */ }
  }
  return null;
};
const alias = probeAlias();
const BUILD_CWD = opt("--build-cwd", "") || alias || TREE;
console.log(`构建拼写：${BUILD_CWD}${alias ? "（ASCII 别名·同枝同头）" : "（无 ASCII 别名——中文根构建可能与遗留缓存碰撞：different roots；建议 subst 后重跑）"}`);

// ② 设备在联？（版本自判；APK 路径先定）
const APK = APK_OPT ? path.resolve(APK_OPT) : path.join(TREE, "app/build/outputs/apk/debug/app-debug.apk");
const devs = onlineSerials();
const autoPath = !NO_BUILD && !NO_INSTALL && !FORCE;
let serial = "", devVer = "", devDebug = null;
if (!NO_INSTALL && devs.length) {
  serial = SERIAL || devs[0];
  const rd = readDevice(serial);
  devVer = rd.ver; devDebug = rd.debug;
  console.log(`设备：${serial}｜当前 versionName=${devVer || "(未取到)"}｜main sha=${short}${devDebug !== null ? `｜${devDebug ? "debuggable" : "非 debuggable"}` : ""}`);
  if (GENERAL) {
    // 通用模式：设备已＝该树现指纹 ⇒ 幂等跳过（树改过/脏项变⇒指纹变⇒重装）；--from main 同按 main 线判（免无谓重建）
    if (autoPath && devVer && devVer === treeFp) {
      console.log(`✅ 设备已是该树现指纹（${devVer}）——无需重装`);
      saveState({ main: short, device: devVer, action: "skip-already-current", rc: 0, tree: TREE });
      process.exit(0);
    }
    if (autoPath && TREE === REPO && isMainLine(devVer, short)) {
      console.log(`✅ 设备已是 main 现头（${devVer}）——无需重装`);
      saveState({ main: short, device: devVer, action: "skip-already-current", rc: 0, tree: TREE });
      process.exit(0);
    }
  } else if (autoPath && isMainLine(devVer, short)) {
    // 默认模式（行为不变）：设备已=main 线 ⇒ 跳过（+dirty 容忍：main 检出常态带账本/文档脏项，见 D1 备注）
    console.log(`✅ 设备已是 main 现头（${devVer}）——无需装机`);
    saveState({ main: short, device: devVer, action: "skip-already-current", rc: 0 });
    process.exit(0);
  } else if (autoPath && baseSha(devVer) && branchMarkOf(devVer) === "") {
    // 默认模式「无 App 面改动」捷径（SYS-184 修订：仅限**旧 main 线**包——带分支标记的工作树包 MUST 回主，
    // 即使 base==main 头、base..HEAD 无 commit 差（工作树含未 commit 的 App 面改动，diff 看不见——drill 实测缺口））
    const devSha = baseSha(devVer);
    let known = true;
    try { execFileSync("git", ["-C", REPO, "cat-file", "-e", devSha], { windowsHide: true }); } catch { known = false; }
    if (known) {
      const changed = execFileSync("git", ["-C", REPO, "diff", "--name-only", `${devSha}..HEAD`, "--", "app", "前端设计/mov-vue"], { encoding: "utf8", windowsHide: true }).trim();
      if (!changed) {
        console.log(`设备 ${devSha} → main ${short} 间无 App 面改动（纯文档/体系面合并）——跳过装机`);
        saveState({ main: short, device: devVer, action: "skip-no-app-change", rc: 0 });
        process.exit(0);
      }
      console.log(`设备 ${devSha} → main ${short} 有 App 面改动 ⇒ 装机`);
    }
  }
} else if (!devs.length && !NO_INSTALL) {
  if (GENERAL) { console.error("✗ 通用模式：无设备在联（留待设备就绪后重跑）"); saveState({ main: short, device: null, action: "no-device", rc: 1, tree: TREE }); process.exit(1); }
  console.log("N/A：无设备在联（留待下次）");
  saveState({ main: short, device: null, action: "skip-no-device", rc: 0 });
  process.exit(0);
}

// ②b 真机占用闸互斥（2026-10-04 裁定·事故后立）——他席占用窗内 MUST NOT 装包（防毁他人采集窗）
//     规则：读同目录 `真机占用.json`；所选设备被占且 until > now ⇒ 跳过（rc=0·哨兵记 skipped-occupied·--force 可越）
//     SYS-184：通用模式认「自持」（who==WHO ⇒ 放行——实验者自己的窗口内装自己的包）；默认模式原状。
{
  const blk = occupancyBlock({ allowSelf: true }); // SYS-184：自持放行（同 SYS-158 装机前置口径）；他席占用 ⇒ skip
  if (blk) {
    console.log(`⏸ 设备被占用（${blk.who}·至 ${blk.until}${blk.why ? "·" + blk.why : ""}）——跳过装机（构建前查）；设备释放后重跑本命令即可`);
    saveState({ main: short, device: devVer, action: "skipped-occupied", rc: 0, occupiedBy: blk.who, occupiedUntil: blk.until, caughtAt: "pre-build" });
    process.exit(0);
  }
}

// ③ 构建（cmake 事故绕过：-x CMake 任务 ＋ 复用同源 .so——本机 cmake configure 必崩，见 UPG-459/465/468 留痕；
//    若换机/换 ABI 需补齐其它 ABI 的 -x，或修好 cmake 后去掉本组旗标）
if (APK_OPT) console.log(`（--apk：跳过构建，直用 ${APK}）`);
else if (!NO_BUILD) {
  const env = { ...process.env, JAVA_HOME, ANDROID_HOME: SDK };
  // UPG-572（OCR 深路径下线）：项目已无 CMake ⇒ 原 `-x configureCMakeDebug[…]` 旗标会致
  // 「Task 'configureCMakeDebug[arm64-v8a]' not found」秒败，已移除；
  // 若将来 CMake 复活（端上模型类），先解决本机 cmake configure 崩溃再论（UPG-459/465/468 留痕）。
  const args = ["/c", "gradlew.bat", ":app:assembleDebug", "--console=plain"];
  console.log(`构建：${BUILD_CWD}（:app:assembleDebug·无 CMake 旗标·UPG-572 后）…`);
  const r = sh("cmd", args, { cwd: BUILD_CWD, env, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`✗ 构建失败 rc=${r.status}`);
    saveState({ main: short, device: devVer, action: "build-failed", rc: 1 });
    process.exit(1);
  }
} else console.log("（--no-build：跳过构建）");
if (!fs.existsSync(APK)) { console.error(`✗ APK 不存在：${APK}`); saveState({ main: short, device: devVer, action: "apk-missing", rc: 1 }); process.exit(1); }
const info = apkInfo(APK);
const expected = (info && info.versionName) || treeFp; // 期望＝本次 APK 实测 versionName（权威）；aapt2 不可用 ⇒ 树指纹 D1
console.log(`APK：${APK}（${(fs.statSync(APK).size / 1048576).toFixed(1)} MB）｜期望 versionName=${expected}｜树指纹=${treeFp}`);
if (GENERAL && info && info.versionName && info.versionName !== treeFp) {
  console.log(`⚠️ 树指纹（${treeFp}）≠ APK 实测（${info.versionName}）——该包未带 D1 后缀（UPG-523 未合时属正常；precheck --expect-device 会据此拒跑）`);
}

if (NO_INSTALL) { console.log("（--no-install：跳过装机）"); saveState({ main: short, device: devVer, action: "build-only", rc: 0 }); process.exit(0); }

// ③c 装包前**再查**占用闸（2026-10-04 修·check-at-install）——构建窗 ~3min 内新登记的占用在此拦下
{
  const blk2 = occupancyBlock({ allowSelf: true }); // SYS-184：自持放行（同 SYS-158 口径）
  if (blk2) {
    console.log(`⏸ 设备被占用（${blk2.who}·至 ${blk2.until}${blk2.why ? "·" + blk2.why : ""}）——装包前复查拦下（构建已做·跳过装包）；设备释放后重跑本命令即可`);
    saveState({ main: short, device: devVer, action: "skipped-occupied", rc: 0, occupiedBy: blk2.who, occupiedUntil: blk2.until, caughtAt: "pre-install" });
    process.exit(0);
  }
}

// ③d 跨签名保护（D2）：设备现装 debug/release 与待装包不一致 ⇒ 默认拒绝；--allow-data-loss 才卸载重装
let dataLoss = false;
{
  const incDebug = info ? info.debuggable : (/debug/i.test(path.basename(APK)) ? true : (/release/i.test(path.basename(APK)) ? false : null));
  if (devDebug !== null && incDebug !== null && devDebug !== incDebug) {
    const kind = `${devDebug ? "debug" : "release"}→${incDebug ? "debug" : "release"}`;
    if (!ALLOW_DATA_LOSS) {
      console.error(`⛔ 跨签名拒绝（${kind}）：设备现装＝${devDebug ? "debug" : "release"}，待装包＝${incDebug ? "debug" : "release"}——不同签名覆盖安装会失败；继续须先卸载（清 App 数据·不可逆）。`);
      console.error(`   确需继续 ⇒ 加 --allow-data-loss 重跑（先卸载再装·台账留痕）；或换同签名包。`);
      saveState({ main: short, device: devVer, action: "refused-cross-signature", rc: 1 });
      process.exit(1);
    }
    console.log(`⚠️ --allow-data-loss：跨签名（${kind}）——先卸载 ${PKG}（清 App 数据）再装`);
    const un = sh(ADB, ["-s", serial, "uninstall", PKG]);
    if (un.status !== 0) { console.error(`✗ 卸载失败（无法继续跨签名安装）：${String(un.stderr || un.stdout || "").trim().slice(0, 120)}`); saveState({ main: short, device: devVer, action: "uninstall-failed", rc: 1 }); process.exit(1); }
    dataLoss = true;
  }
}

// ④ 安装
const ins = sh(ADB, ["-s", serial, "install", "-r", APK], { stdio: "inherit" });
if (ins.status !== 0) {
  console.error("✗ 安装失败");
  saveState({ main: short, device: devVer, action: "install-failed", rc: 1 });
  process.exit(1);
}

// ⑤ 回读断言（D2）：设备 versionName MUST == 期望（本次 APK 实测/树指纹）——不符 rc≠0
const rd2 = readDevice(serial);
const ver = rd2.ver || "(未取到)";
console.log(`设备 ${PKG} versionName=${ver}｜期望=${expected}｜树=${TREE}`);
// 台账（D6）：实装后即记（记录设备实态 ⇒ --reconcile 基准就是它；断言不符也记，装置实况不被掩盖）
const rec = { serial, versionName: ver, baseSha: baseSha(ver), suffix: suffixOf(ver), tree: GENERAL ? TREE : REPO, purpose: PURPOSE || "main-align", by: BY, until: UNTIL, apkSha256: sha256File(APK), at: new Date().toISOString() };
if (dataLoss) rec.allowDataLoss = true;
if (TICKET) rec.ticket = TICKET; // SYS-186：工单↔包版本双向可查
ledgerAppend(rec);
if (expected && ver !== expected) {
  console.error(`✗ 回读≠期望——设备包不是本次构建/给出的包（旧包残留/安装被静默替换/版本串不含期望）`);
  saveState({ main: short, device: ver, action: "version-mismatch", rc: 1, expected });
  process.exit(1);
}
if (!GENERAL && !isMainLine(ver, short)) { // 默认模式继续保「设备包＝main 线」语义（分支标记包不得冒充）
  console.error(`✗ main 对齐不符：设备 ${ver} 不是 main ${short} 线（base/mark 见 D1）`);
  saveState({ main: short, device: ver, action: "version-mismatch", rc: 1, expected });
  process.exit(1);
}
// SYS-186 版本记账：成功后回写工单卡面 install:（经 set-status 持锁单写；失败不静默）
if (TICKET) {
  const py = process.env.PYTHON || "python";
  const r = sh(py, [path.join(HERE, "set-status.py"), TICKET, "--install", ver], { cwd: ROOT });
  if (r.status === 0) console.log(`📇 版本记账：${TICKET} 卡面 install: ${ver}`);
  else console.log(`⚠️ 版本记账失败（rc=${r.status}）：${String((r.stdout || "") + (r.stderr || "")).trim().slice(0, 200)}——手动补：python 处理中心/机器闸/set-status.py ${TICKET} --install ${ver}`);
}
if (RESTORE_CHECK) restoreStatePatch({ lastResult: "installed", completedAt: new Date().toISOString(), versionName: ver });
console.log(`✅ 装机完成：设备 = ${ver}（${GENERAL ? TREE : REPO}）${TICKET ? "｜工单 " + TICKET : ""}`);
saveState({ main: short, device: ver, action: "installed", rc: 0 });
