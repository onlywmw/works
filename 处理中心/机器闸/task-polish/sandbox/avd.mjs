#!/usr/bin/env node
// POL-4 打磨环沙盒 · 专用模拟器（AVD·快照/重置/状态）——不占共享真机
//
// 用法：
//   node avd.mjs boot [--base <port>]   # 起 AVD（headless）＋ wait-for-device ＋ adb reverse（App 经 127.0.0.1:<port> 达沙盒）
//   node avd.mjs snapshot <name>        # 存快照（基线/轮次）
//   node avd.mjs restore <name>         # 恢复快照（= 环境归零）
//   node avd.mjs reset                  # 恢复基线快照（config.avdBaseline·缺则 wipe-data 冷启说白）
//   node avd.mjs status                 # AVD/设备/快照读数
//   node avd.mjs stop                   # 停模拟器
// 纪律：只动 config 指定的专用 AVD；真机（CP28A…）只读列出、绝不触碰。
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, "sandbox.config.json"), "utf8"));
const AVD = CFG.avd || "MOV_Test";
const BASELINE = CFG.avdBaseline || "pol4-baseline";
const SDK = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || "D:/Android/Sdk";
const EMU = path.join(SDK, "emulator", "emulator.exe");
const ADB = path.join(SDK, "platform-tools", "adb.exe");
const argv = process.argv.slice(2);
const cmd = argv[0];
const log = (s) => console.log(s);
const sh = (bin, args, opts = {}) => execFileSync(bin, args, { encoding: "utf8", windowsHide: true, ...opts }).trim();
const trySh = (bin, args) => { try { return sh(bin, args); } catch { return ""; } };

function emulatorSerial() {
  const out = trySh(ADB, ["devices"]);
  const line = out.split("\n").find((l) => l.startsWith("emulator-"));
  return line ? line.split(/\s+/)[0] : "";
}

function snapshots(serial) {
  if (!serial) return [];
  const out = trySh(ADB, ["-s", serial, "emu", "avd", "snapshot", "list"]);
  return out.split("\n").map((l) => l.trim()).filter(Boolean);
}

async function waitDevice(serial, tries = 120) {
  for (let i = 0; i < tries; i++) {
    const out = trySh(ADB, ["devices"]);
    if (out.includes(serial) && out.includes("device")) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

(async () => {
  if (cmd === "boot") {
    const port = Number((argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : CFG.a2aPort)) || 8180;
    const running = emulatorSerial();
    if (running) log(`✅ boot：已在跑（${running}）`);
    else {
      const child = spawn(EMU, ["-avd", AVD, "-no-window", "-no-audio", "-no-boot-anim", "-gpu", "swiftshader_indirect"], { detached: true, stdio: "ignore", windowsHide: true });
      child.unref();
      log(`▶ boot：起 ${AVD}（headless·pid ${child.pid}）`);
    }
    const serial = "emulator-5554";
    const ok = await waitDevice(serial);
    log(ok ? `✅ device ${serial} 就绪` : "⚠ wait-for-device 超时");
    trySh(ADB, ["-s", serial, "reverse", `tcp:${port}`, `tcp:${port}`]);
    log(`🔁 adb reverse：${serial} tcp:${port} → host tcp:${port}（App 沙盒基址=http://127.0.0.1:${port}）`);
    return;
  }
  const serial = emulatorSerial();
  if (cmd === "stop") {
    if (!serial) { log("✅ stop：未在跑"); return; }
    trySh(ADB, ["-s", serial, "emu", "kill"]);
    log(`⏹ stop：${serial} 已停`);
    return;
  }
  if (cmd === "snapshot") {
    const name = argv[1]; if (!name) { console.error("用法：avd.mjs snapshot <name>"); process.exit(2); }
    if (!serial) { console.error("✗ 模拟器未跑（先 boot）"); process.exit(1); }
    sh(ADB, ["-s", serial, "emu", "avd", "snapshot", "save", name]);
    log(`📸 快照已存：${name}`);
    return;
  }
  if (cmd === "restore") {
    const name = argv[1]; if (!name) { console.error("用法：avd.mjs restore <name>"); process.exit(2); }
    if (!serial) { console.error("✗ 模拟器未跑（先 boot）"); process.exit(1); }
    sh(ADB, ["-s", serial, "emu", "avd", "snapshot", "load", name]);
    log(`⏪ 快照已恢复：${name}`);
    return;
  }
  if (cmd === "reset") {
    if (!serial) { console.error("✗ 模拟器未跑（先 boot）"); process.exit(1); }
    const snaps = snapshots(serial);
    if (snaps.includes(BASELINE)) { sh(ADB, ["-s", serial, "emu", "avd", "snapshot", "load", BASELINE]); log(`⏪ reset：已恢复基线快照 ${BASELINE}`); }
    else log(`⚠ reset：基线快照 ${BASELINE} 不在（现有：${snaps.join(", ") || "无"}）——先用 snapshot ${BASELINE} 固化，或 wipe-data 冷启`);
    return;
  }
  if (cmd === "status") {
    const avds = trySh(EMU, ["-list-avds"]).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const real = trySh(ADB, ["devices"]).split("\n").filter((l) => l && !l.startsWith("List")).join(" | ");
    log(`AVD 列表：${avds.join(", ")}`);
    log(`专用 AVD：${AVD}（${avds.includes(AVD) ? "在" : "缺"}）｜基线快照名：${BASELINE}`);
    log(`运行中模拟器：${serial || "—"}｜快照：${serial ? (snapshots(serial).join(", ") || "无") : "—"}`);
    log(`设备一览：${real}`);
    return;
  }
  console.log("用法：node avd.mjs boot|snapshot <name>|restore <name>|reset|status|stop");
  process.exit(2);
})();
