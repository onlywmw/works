#!/usr/bin/env node
// SYS-158 装机前置 —— 装机/仪器测试路径的**占用闸强制接线**（SYS-135 单一真源的 enforcement 面）。
//
// 缘起（UPG-444 审验 O-1 ＋ UPG-442 审验 O-2 同族并入）：验收占机窗口内他席装入 versionCode 更高包
// ⇒ `INSTALL_FAILED_VERSION_DOWNGRADE`，被迫 `-r -d` 旁路；`connectedAndroidTest` 跑毕 AGP 自动卸载
// ⇒ 清设备联调数据（**不可逆**）。旧口径「占用纪律靠人守」在并发下失效——本件把它变成**命令前置闸**。
//
// 用法：
//   node 处理中心\机器闸\checks\装机前置.mjs [--serial <机>] [--who <名>] [--force [--why "…"]] -- <命令…>
//   例：node ... 装机前置.mjs -- adb -s CP28A2234900560 install -r -d app-debug.apk
//   例：node ... 装机前置.mjs --serial emulator-5554 -- cmd /c gradlew.bat :app:connectedDebugAndroidTest
//   例：node ... 装机前置.mjs --force --why "占位者已协商·应急复装" -- adb install -r x.apk
// 判据（派单 SYS-158 §一/§二）：
//   占中且非本人 ⇒ **拒跑**（退出码 3·不执行被包命令·提示占位者/时段/解除方式/--force 提示）；
//   `--force`     ⇒ 写 真机占用.json 的 `_forceLog`（who/why/time/tool）后执行；
//   空/自持       ⇒ 直接执行（不误伤）。
// 退出码：被包命令原码透传｜3=占用拒跑（命令未启动）｜2=用法错｜1=被包命令启动失败
// 单一真源：登记件读写全经 `checks/真机占用.mjs`（SYS-135·**不改其登记格式**）；文案沿 `precheck-l23` ⓪ 同法。
// 装机脚本（如 install-ledger.mjs）可直接 `import { guardOccupancy }` 复用，禁止各处自写第二套判定。
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { DEFAULT_SERIAL, occupantOf, occLine, overdueMin, logForce, whoami } from "./真机占用.mjs";

/** 占用拒跑的退出码（区别于被包命令自身失败；派单判据「非 0 退出」）。 */
export const REFUSE_EXIT = 3;

/** 从被包命令里提取目标机（adb 风格 `-s <机>` / `--serial <机>` / `--serial=<机>`；无则 null）。 */
export function serialFromCmd(cmd) {
  for (let i = 0; i < cmd.length; i++) {
    const a = String(cmd[i]);
    if ((a === "-s" || a === "--serial") && cmd[i + 1]) return String(cmd[i + 1]);
    const m = a.match(/^--serial=(.+)$/);
    if (m) return m[1];
  }
  return null;
}

/**
 * 占用闸（可复用）：空/自持 ⇒ ok:true 放行；他人在用 ⇒ 非 --force 拒跑（ok:false·code=3）。
 * @returns {{ok:boolean, code?:number, serial:string, msg:string}}
 */
export function guardOccupancy({ serial, who, force = false, why = "", tool = "装机前置" } = {}) {
  const s = serial || DEFAULT_SERIAL;
  const w = who || whoami();
  const cur = occupantOf(s);
  if (cur && cur.who !== w) {
    if (!force) {
      return {
        ok: false,
        code: REFUSE_EXIT,
        serial: s,
        msg: [
          `❌ 占用闸拒跑 —— ${s} 他人在用：${occLine(cur)}（本席=${w}）`,
          `   解除方式 A：等 TA 放行（node 处理中心\\机器闸\\checks\\真机占用.mjs 放 --serial ${s}）；B：换机（--serial <另一台>）。`,
          `   确需越过：加 --force --why "理由"（越过记 处理中心/机器闸/真机占用.json 的 _forceLog 留痕）。`,
          `   注：装机/仪器测试可能触发版本降级拒装或卸载清数据（不可逆）——拒跑在前，误装不可重放。`,
        ].join("\n"),
      };
    }
    logForce({ who: w, serial: s, skipped: [`占用：他人在用 ${occLine(cur)}`], why: why || "未填", tool });
    return { ok: true, serial: s, msg: `⚠️ 占用闸 --force 越过他人在用：${occLine(cur)}（已记 _forceLog·operator=${w}·tool=${tool}·why=${why || "未填"}）` };
  }
  const over = cur ? overdueMin(cur) : 0;
  return {
    ok: true,
    serial: s,
    msg: cur
      ? `✅ 占用闸：自持 ${occLine(cur)}${over ? `（⚠️ 已超预计 ${over} 分钟）` : ""}`
      : `✅ 占用闸：无占用（登记件 处理中心/机器闸/真机占用.json）`,
  };
}

function parseArgs(argv) {
  const sep = argv.indexOf("--");
  if (sep < 0 || sep === argv.length - 1) return null;
  const opts = { serial: null, who: null, force: false, why: "" };
  for (let i = 0; i < sep; i++) {
    const a = argv[i];
    if (a === "--serial") opts.serial = argv[++i];
    else if (a === "--who") opts.who = argv[++i];
    else if (a === "--why") opts.why = argv[++i];
    else if (a === "--force") opts.force = true;
    else return null;
  }
  return { opts, cmd: argv.slice(sep + 1).map(String) };
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) {
    console.error('用法：node 处理中心\\机器闸\\checks\\装机前置.mjs [--serial <机>] [--who <名>] [--force [--why "…"]] -- <命令…>');
    process.exit(2);
  }
  const { opts, cmd } = parsed;
  // 目标机：--serial 显式 > 被包命令里的 -s/--serial（adb 风格）> 默认机（SYS-135 口径）
  const serial = opts.serial || serialFromCmd(cmd) || DEFAULT_SERIAL;
  const g = guardOccupancy({ serial, who: opts.who, force: opts.force, why: opts.why, tool: "装机前置" });
  console.log(g.msg);
  if (!g.ok) process.exit(g.code);
  console.log(`▶ 执行（占用闸已过·目标机 ${g.serial}）：${cmd.join(" ")}`);
  const r = spawnSync(cmd[0], cmd.slice(1), { windowsHide: true, stdio: "inherit", shell: false });
  if (r.error) { console.error(`被包命令启动失败：${r.error.message}`); process.exit(1); }
  process.exit(r.status === null ? 1 : r.status);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
