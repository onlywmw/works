#!/usr/bin/env node
// 装机.mjs —— 合并位收尾「出包装机」：**从主检出（main）构建 debug APK → 装到在联设备 → 回读版本对账**
//
// 2026-10-02 立（用户报「都已经合了，为什么安装的总是旧包」）：
//   根因＝设备上的包来自「谁在场谁装谁的工作树取证包」（基点各异、与 main 不同头），而 main 合并后**无环节保证重装**。
//   本工具 + set-status merged 钩子 ⇒ 「测试机 = main 现头」成为默认事实：
//     设备 versionName（构建期已嵌 HEAD 短 sha）MUST 含主检出短 sha，不符即 rc=1 —— 旧包不得冒充新包。
// 自判跳过（省事省电）：设备已=main 现头 ⇒ 跳过；设备 sha→main 之间**无 App 面改动** ⇒ 跳过（如纯文档/体系单合并）。
//
// 用法：
//   node 处理中心/机器闸/装机.mjs [--repo <产品仓>] [--serial <adb序号>] [--pkg cn.mov.app] [--no-build] [--no-install] [--force]
// 退出码：0=装成且版本对账通过（含 N/A 与自判跳过）｜1=构建/安装/版本不符 ｜2=用法或环境错
// 读数（日志四件套口径）：rc＋APK 路径＋主检出 sha＋设备 versionName＋repo
import { spawnSync, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCT } from "./lib/root.mjs"; // SYS-160：根解析单源

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");      // 体系仓根
const BOARD = path.join(ROOT, "处理中心", "看板");
const LOCK = path.join(BOARD, "装机.lock");
const STATE = path.join(BOARD, "装机哨兵.json");

const opt = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const REPO = opt("--repo", PRODUCT);
const SERIAL = opt("--serial", "");
const PKG = opt("--pkg", "cn.mov.app");
const NO_BUILD = process.argv.includes("--no-build");
const NO_INSTALL = process.argv.includes("--no-install");
const FORCE = process.argv.includes("--force");   // 跳过自判（强制重建重装）

const SDK = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || "D:/Android/Sdk";
const ADB = process.env.ADB || path.join(SDK, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb");
const JAVA_HOME = process.env.JAVA_HOME || "C:\\Program Files\\Android\\Android Studio\\jbr";
if (!fs.existsSync(ADB)) { console.error(`✗ adb 不存在：${ADB}（设 ANDROID_HOME 或 ADB）`); process.exit(2); }
if (!fs.existsSync(REPO)) { console.error(`✗ 产品仓不存在：${REPO}`); process.exit(2); }

const sh = (cmd, args, o = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28, windowsHide: true, ...o });
const git = (args) => execFileSync("git", ["-C", REPO, ...args], { encoding: "utf8", windowsHide: true }).trim();
const saveState = (obj) => { try { fs.mkdirSync(BOARD, { recursive: true }); fs.writeFileSync(STATE, JSON.stringify({ at: new Date().toISOString(), ...obj }, null, 2)); } catch { /* 状态落卡失败不影响主流程 */ } };

// ⓪ 并发锁（钩子可能连环触发——串行化，防两连构建互踩）
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
const short = head.slice(0, 8);
let origin = "";
try { origin = git(["rev-parse", "origin/main"]); } catch { /* 无 origin 面（理论上产品仓恒有） */ }
if (origin && origin !== head) {
  console.log(`⚠ HEAD(${short}) ≠ origin/main(${origin.slice(0, 8)})——设备包将不是远端现头（未推/未取）；照装但留痕`);
}

// ①b 构建拼写口径：非 ASCII 根（E:\mov归档）**同一棵树混用拼写**会致 DexingNoClasspathTransform
//    「different roots」（2026-10-02 实测·口径在案：测试/构建走 subst ASCII 别名——设计师/项目配置.md）。
const headForAlias = head;
const ASCII_ALIASES = ["Q", "T", "U", "V", "W", "X", "Y", "Z", "N", "M", "R", "S"];
const probeAlias = () => {
  for (const d of ASCII_ALIASES) {
    const root = `${d}:/`;
    try {
      if (!fs.existsSync(path.join(root, "app/src/main/AndroidManifest.xml"))) continue;
      const h = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8", windowsHide: true }).trim();
      if (h === headForAlias) return root;
    } catch { /* 盘不存在/非 git：跳过 */ }
  }
  return null;
};
const alias = probeAlias();
const BUILD_CWD = opt("--build-cwd", "") || alias || REPO;
console.log(`构建拼写：${BUILD_CWD}${alias ? "（ASCII 别名·同枝同头）" : "（无 ASCII 别名——中文根构建可能与遗留缓存碰撞：different roots；建议 subst 后重跑）"}`);

// ② 设备在联？版本自判（设备已=main ⇒ 跳过；设备 sha→main 无 App 面改动 ⇒ 跳过）
const APK = path.join(REPO, "app/build/outputs/apk/debug/app-debug.apk");
const devs = String(sh(ADB, ["devices"]).stdout || "").split(/\r?\n/).filter((l) => /\tdevice$/.test(l));
const autoPath = !NO_BUILD && !NO_INSTALL && !FORCE;
let serial = "", devVer = "";
if (!NO_INSTALL && devs.length) {
  serial = SERIAL || devs[0].split(/\t/)[0];
  const dp = sh(ADB, ["-s", serial, "shell", "dumpsys", "package", PKG]);
  const m = String(dp.stdout || "").match(/versionName=(\S+)/);
  devVer = m ? m[1] : "";
  console.log(`设备：${serial}｜当前 versionName=${devVer || "(未取到)"}｜main sha=${short}`);
  if (autoPath && devVer.toLowerCase().includes(short.toLowerCase())) {
    console.log(`✅ 设备已是 main 现头（${devVer}）——无需装机`);
    saveState({ main: short, device: devVer, action: "skip-already-current", rc: 0 });
    process.exit(0);
  }
  const devSha = (devVer.match(/([0-9a-f]{7,40})/i) || [])[1] || "";
  if (autoPath && devSha) {
    let known = true;
    try { git(["cat-file", "-e", devSha]); } catch { known = false; }
    if (known) {
      const changed = git(["diff", "--name-only", `${devSha}..HEAD`, "--", "app", "前端设计/mov-vue"]).trim();
      if (!changed) {
        console.log(`设备 ${devSha} → main ${short} 间无 App 面改动（纯文档/体系面合并）——跳过装机`);
        saveState({ main: short, device: devVer, action: "skip-no-app-change", rc: 0 });
        process.exit(0);
      }
      console.log(`设备 ${devSha} → main ${short} 有 App 面改动 ⇒ 装机`);
    }
  }
} else if (!devs.length && !NO_INSTALL) {
  console.log("N/A：无设备在联（留待下次）");
  saveState({ main: short, device: null, action: "skip-no-device", rc: 0 });
  process.exit(0);
}

// ②b 真机占用闸互斥（2026-10-04 裁定·事故后立）——他席占用窗内 MUST NOT 装包（防毁他人采集窗）
//     规则：读同目录 `真机占用.json`；所选设备被占且 until > now ⇒ 跳过（rc=0·哨兵记 skipped-occupied·--force 可越）
if (!NO_INSTALL && serial && !FORCE) {
  try {
    const occ = JSON.parse(fs.readFileSync(path.join(HERE, "真机占用.json"), "utf8"));
    const cur = occ[serial];
    if (cur && cur.until) {
      const until = new Date(String(cur.until).replace(/-/g, "/")).getTime();
      if (until > Date.now()) {
        console.log(`⏸ 设备被占用（${cur.who}·至 ${cur.until}${cur.why ? "·" + cur.why : ""}）——跳过装机；设备释放后重跑本命令即可`);
        saveState({ main: short, device: devVer, action: "skipped-occupied", rc: 0, occupiedBy: cur.who, occupiedUntil: cur.until });
        process.exit(0);
      }
    }
  } catch (e) { console.log(`（占用闸读取失败·按无占用继续：${String(e.message).slice(0, 60)}）`); }
}

// ③ 构建（cmake 事故绕过：-x CMake 任务 ＋ 复用同源 .so——本机 cmake configure 必崩，见 UPG-459/465/468 留痕；
//    若换机/换 ABI 需补齐其它 ABI 的 -x，或修好 cmake 后去掉本组旗标）
if (!NO_BUILD) {
  const env = { ...process.env, JAVA_HOME, ANDROID_HOME: SDK };
  const args = ["/c", "gradlew.bat", ":app:assembleDebug", "--console=plain",
    "-x", "configureCMakeDebug[arm64-v8a]", "-x", "buildCMakeDebug[arm64-v8a]",
    "-x", "configureCMakeDebug", "-x", "buildCMakeDebug", "-x", "externalNativeBuildDebug"];
  console.log(`构建：${BUILD_CWD}（:app:assembleDebug·skip cmake）…`);
  const r = sh("cmd", args, { cwd: BUILD_CWD, env, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`✗ 构建失败 rc=${r.status}`);
    saveState({ main: short, device: devVer, action: "build-failed", rc: 1 });
    process.exit(1);
  }
} else console.log("（--no-build：跳过构建）");
if (!fs.existsSync(APK)) { console.error(`✗ APK 不存在：${APK}`); saveState({ main: short, device: devVer, action: "apk-missing", rc: 1 }); process.exit(1); }
console.log(`APK：${APK}（${(fs.statSync(APK).size / 1048576).toFixed(1)} MB）｜main sha=${short}`);

if (NO_INSTALL) { console.log("（--no-install：跳过装机）"); saveState({ main: short, device: devVer, action: "build-only", rc: 0 }); process.exit(0); }

// ④ 安装
const ins = sh(ADB, ["-s", serial, "install", "-r", APK], { stdio: "inherit" });
if (ins.status !== 0) {
  console.error("✗ 安装失败");
  saveState({ main: short, device: devVer, action: "install-failed", rc: 1 });
  process.exit(1);
}

// ⑤ 版本对账：设备 versionName（构建期嵌 HEAD 短 sha）MUST 含主检出短 sha
const dp2 = sh(ADB, ["-s", serial, "shell", "dumpsys", "package", PKG]);
const m2 = String(dp2.stdout || "").match(/versionName=(\S+)/);
const ver = m2 ? m2[1] : "(未取到)";
console.log(`设备 ${PKG} versionName=${ver}｜main sha=${short}`);
if (!String(ver).toLowerCase().includes(short.toLowerCase())) {
  console.error("✗ 版本不符——设备包不是主检出构建（旧包/或版本串未含 sha）");
  saveState({ main: short, device: ver, action: "version-mismatch", rc: 1 });
  process.exit(1);
}
console.log(`✅ 装机完成：设备 = main ${short}（${REPO}）`);
saveState({ main: short, device: ver, action: "installed", rc: 0 });
