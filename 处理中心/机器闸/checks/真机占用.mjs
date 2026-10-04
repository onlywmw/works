#!/usr/bin/env node
// SYS-135 真机占用闸 —— 「此刻谁在用这台机」的单一真源（占/放/查）。
//
// 案情（2026-09-28 用户报障·同因当日两轮）：UPG-365 设备矩阵的采集/验收循环反复占用用户正在用的真机——
//   am force-stop 重启（白屏）／观测项⑤ 拿「＋」当弹层锚反复点（用户看到「＋」被点）／B 档 wm density 240
//   覆盖（画面比例变化）。规则已落（UPG-365 卡附注＋设计师《已知坑》「真机跑测试的占用纪律」），缺的是闸：
//   脚本自身不查占用，靠人守纪律 —— 本件把那句话变成可跑的闸。
//
// 本件两件事：
//   ① 占用登记：占/放/查（只登记「谁·何时·预计多久」，**不建调度系统**）
//   ② 真机读数：wm size/density 覆盖读数（跑前查残留·跑毕自证已还原）＋ adb 定位（precheck-l23 复用）
//
// 用法（cwd 任意）：
//   node 处理中心\机器闸\checks\真机占用.mjs 占 --serial <机> [--for 30] [--who <名>] [--why "..."] [--force]
//   node ... 放 --serial <机> [--who <名>] [--force]     # 跑毕清占用；设备在线则顺带打 wm 覆盖读数自证「已还原」
//   node ... 查 [--serial <机>]
// 身份：--who > 环境变量 MOV_SEAT > 「未署名」——占/放/预检三处同源，才认得出「自持」
// 退出码：0=成 ｜ 1=被他人占用／覆盖未还原 ｜ 2=用法错
// 登记件：处理中心\机器闸\真机占用.json（占=写一条；放=删；--force 越过=记 _forceLog，只留近 50 条）
// adb 定位：--adb > $ADB > $ANDROID_HOME|$ANDROID_SDK_ROOT\platform-tools > 本机常态 > PATH（《验收取证口径》12：环境依赖显式·缺依赖 rc=2）
// 口径：《已知坑》「真机跑测试的占用纪律」＝① 占用前先确认 ② 设备级覆盖必还原并留读数 ③ 循环脚本给静默窗。
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./key-health.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..", "..");

/** 登记件（单一真源）。MOV_SYS135_REG 仅供测试指到临时件（正常跑不设）。 */
export const REG_FILE = process.env.MOV_SYS135_REG || path.join(SYS, "处理中心", "机器闸", "真机占用.json");

export const DEFAULT_SERIAL = "emulator-5554";
export const DEFAULT_ADB = "D:/Android/Sdk/platform-tools/adb.exe"; // 本机 SDK 常态路径；不在则回落 PATH 上的 adb（导出：precheck-l23 文案引用）
export const NOTE =
  "真机占用登记（单一真源）：谁·何时·预计多久。占/放/查=checks/真机占用.mjs；L2/L3 预检（precheck-l23）跑前读本件，" +
  "他人在用即拒跑（--force 越过记 _forceLog 留痕）。口径=设计师/经验库/已知坑.md「真机跑测试的占用纪律」。";

export const stamp = (d = new Date()) => d.toLocaleString("sv-SE");
/** 操作者身份：--who > MOV_SEAT > 未署名（三处同源才认得出「自持」）。 */
export const whoami = (cliWho) => String(cliWho || process.env.MOV_SEAT || "").trim() || "未署名";
/** 一行判词：谁（自 何时 至 何时·干什么）——预检/占/放/查共用，禁两处两套表述。 */
export const occLine = (o) => (o ? `${o.who}（自 ${o.since} 至 ${o.until}${o.why ? "·" + o.why : ""}）` : "");
/** 超预计分钟数（0=未超）——只提示不驱逐（不建调度系统）。 */
export function overdueMin(o, now = Date.now()) {
  const t = Date.parse(String(o?.until || "").replace(" ", "T"));
  return Number.isFinite(t) && now > t ? Math.round((now - t) / 60000) : 0;
}

export function readReg() {
  try {
    const r = JSON.parse(fs.readFileSync(REG_FILE, "utf-8"));
    return r && typeof r === "object" ? r : {};
  } catch {
    return {}; // 文件缺失/坏了 ⇒ 当空（预检不因账本读不动而误红）
  }
}
export function writeReg(r) {
  fs.mkdirSync(path.dirname(REG_FILE), { recursive: true });
  fs.writeFileSync(REG_FILE, JSON.stringify(r, null, 2) + "\n");
}
export function occupantOf(serial) {
  return readReg()[serial] || null;
}
/** --force 越过留痕（预检/占 共用·近 50 条；就地改传入的登记对象，由调用方统一落盘）。 */
export function pushForce(r, entry) {
  const log = Array.isArray(r._forceLog) ? r._forceLog : [];
  log.push({ at: stamp(), ...entry });
  r._forceLog = log.slice(-50);
  return r._forceLog;
}
/** 单发留痕（读→改→写）：precheck 越过时用。 */
export function logForce(entry) {
  const r = readReg();
  pushForce(r, entry);
  writeReg(r);
  return r._forceLog.length;
}
/** 占：空/自持 ⇒ 占上；他人在用 ⇒ 拒（--force 才越过并留痕）。 */
export function park(serial, { who, forMin = 30, why = "", force = false, tool = "真机占用.mjs" } = {}) {
  const r = readReg();
  const cur = r[serial] || null;
  if (cur && cur.who !== who) {
    if (!force) return { ok: false, cur };
    pushForce(r, { who, serial, skipped: [`占用：他人在用 ${occLine(cur)}`], tool }); // 与本次登记同一次落盘（分两次写会丢留痕）
  }
  const now = new Date();
  r[serial] = { who, since: stamp(now), until: stamp(new Date(now.getTime() + forMin * 60000)), why };
  writeReg(r);
  return { ok: true, entry: r[serial], displaced: cur };
}
/** 放：清占用（登记是他人时要 --force）。 */
export function release(serial, who, { force = false } = {}) {
  const r = readReg();
  const cur = r[serial] || null;
  if (!cur) return { ok: false, none: true };
  if (who && cur.who !== who && !force) return { ok: false, cur };
  delete r[serial];
  writeReg(r);
  return { ok: true, cur };
}

/** adb 定位：--adb > $ADB > $ANDROID_HOME/$ANDROID_SDK_ROOT 的 platform-tools > 本机 SDK 常态 > PATH。 */
export function resolveAdb(cli) {
  const exe = process.platform === "win32" ? "adb.exe" : "adb";
  const sdk = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT]
    .filter(Boolean).map((root) => path.join(root, "platform-tools", exe));
  if (cli) return cli;
  for (const c of [process.env.ADB, ...sdk, DEFAULT_ADB]) if (c && fs.existsSync(c)) return c;
  return "adb";
}
export function run(cmd, args) {
  try {
    return { ok: true, out: execFileSync(cmd, args, { windowsHide: true, encoding: "utf-8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { ok: false, out: String(e.stdout || "") + String(e.stderr || ""), err: String(e.message).slice(0, 160) };
  }
}
/** 设备级覆盖读数（SYS-135）：原始 wm 输出＋是否仍有 override。runFn 是测试注入缝（默认真 adb）。 */
export function wmRead(adb, serial, runFn = run) {
  const size = runFn(adb, ["-s", serial, "shell", "wm", "size"]);
  const density = runFn(adb, ["-s", serial, "shell", "wm", "density"]);
  const flat = (x) => String(x.out || "").trim().replace(/\s*\n\s*/g, " / ");
  return {
    ok: size.ok && density.ok,
    size: flat(size),
    density: flat(density),
    sizeOverride: /^Override size:/m.test(String(size.out || "")),
    densityOverride: /^Override density:/m.test(String(density.out || "")),
  };
}
export function deviceOnline(adb, serial) {
  return run(adb, ["-s", serial, "get-state"]).out.trim() === "device";
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  const verb = a._[0];
  const serial = a.serial || DEFAULT_SERIAL;
  const who = whoami(a.who);
  const force = "force" in a; // parseArgs 剥 -- 前缀：判 --force 得用键名 force（原 "--force" in a 恒假）
  const usage = () => {
    console.error(`用法：node 处理中心\\机器闸\\checks\\真机占用.mjs 占|放|查 [--serial <机>] [--for 30] [--who <名>] [--why "..."] [--force]`);
    process.exit(2);
  };

  if (verb === "占") {
    const forMin = Number(a.for || 30);
    if (!Number.isFinite(forMin) || forMin <= 0) usage();
    const r = park(serial, { who, forMin, why: a.why || "", force });
    if (!r.ok) {
      console.log(`✋ ${serial} 他人在用：${occLine(r.cur)}（本席=${who}）——等 TA 放行或换机；确需抢占加 --force（记 _forceLog 留痕）。`);
      process.exit(1);
    }
    if (r.displaced) console.log(`⚠️ --force 越过：${occLine(r.displaced)}（已记 _forceLog）`);
    console.log(`📌 已占用 ${serial}：${occLine(r.entry)}——跑毕请「放」：node 处理中心\\机器闸\\checks\\真机占用.mjs 放 --serial ${serial}`);
    return;
  }

  if (verb === "放") {
    const r = release(serial, who, { force });
    if (!r.ok && r.none) console.log(`（${serial} 本就无占用登记——无需放）`);
    else if (!r.ok) {
      console.log(`✋ ${serial} 占用登记是 ${occLine(r.cur)}——本席=${who}；要替 TA 放加 --force。`);
      process.exit(1);
    } else console.log(`🔓 已放 ${serial}（原占用：${occLine(r.cur)}）`);

    // 跑毕自证（SYS-135）：设备在线 ⇒ 打覆盖读数，跑者/证据直接抄（纪律②：必还原并留读数）
    const adb = resolveAdb(a.adb);
    if (!run(adb, ["version"]).ok) { // 《验收取证口径》12：环境没备好≠判据红
      console.log(`   ⚠️ 覆盖自证未做 —— 找不到可用 adb（试过 --adb/$ADB/$ANDROID_HOME/$ANDROID_SDK_ROOT/PATH）：设 ADB 或传 --adb <路径> 后补读。`);
      process.exit(2);
    }
    if (!deviceOnline(adb, serial)) {
      console.log(`   🔎 覆盖自证：设备不在线（${serial}）——未读数；设备就绪后补读（真机占用.mjs 查 ／ precheck-l23）。`);
      return;
    }
    const wm = wmRead(adb, serial);
    const clean = !wm.sizeOverride && !wm.densityOverride;
    console.log(`   🔎 覆盖自证：size=[${wm.size}]；density=[${wm.density}] ⇒ ${clean ? "已回物理值 ✅" : "❌ 仍有 override 未还原！"}`);
    if (!clean) {
      console.log(`      还原：adb -s ${serial} shell wm size reset ／ adb -s ${serial} shell wm density reset`);
      process.exit(1);
    }
    return;
  }

  if (verb === "查") {
    console.log(`真机占用 查询 @${stamp()}（登记件 处理中心/机器闸/真机占用.json）`);
    const rows = Object.entries(readReg()).filter(([k]) => !k.startsWith("_") && (!a.serial || k === serial));
    if (!rows.length) console.log(`  当前无人占用`);
    for (const [k, o] of rows) {
      const over = overdueMin(o);
      console.log(`  ${k}  ${occLine(o)}${over ? `（⚠️ 已超预计 ${over} 分钟——请催办/确认）` : ""}`);
    }
    console.log(`  口径与纪律：设计师/经验库/已知坑.md「真机跑测试的占用纪律」｜占/放：真机占用.mjs 占|放 --serial <机>`);
    return;
  }

  usage();
}

const self = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (self) main();
