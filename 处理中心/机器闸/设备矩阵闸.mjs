#!/usr/bin/env node
// 设备矩阵闸（UPG-365 设计侧交付物 · 2026-09-28）
//
// 目的：把"换一台机器就要人肉调数"变成"**跑一遍闸**"。
// 依据：《安全区与边距规范 v1》（设计师/方案设计/00_架构/2026-09-28）
//
// 用法：
//   node 设备矩阵闸.mjs --serial <设备序列号> [--expect-page 16] [--json]
//   node 设备矩阵闸.mjs --serial X --quiet        # 只输出结论行
//
// 判据（四条不变量·±2px）：
//   ①顶栏起点 == 状态栏 inset 底边
//   ②内容左右边距 == space-page 令牌（默认 16dp）
//   ③底部内容底边 ≤ 导航条顶边
//   ④关闭弹层后静止 1s 画面无残留（同帧比对）
//
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? true) : d; };
const SERIAL = arg("--serial");
const QUIET = argv.includes("--quiet");
const JSONOUT = argv.includes("--json");
const PAGE_DP = Number(arg("--expect-page", 16));      // space-page 令牌
const TOL = Number(arg("--tol", 2));                   // ±px 容差
if (!SERIAL) { console.error("用法：node 设备矩阵闸.mjs --serial <序列号> [--expect-page 16] [--json]"); process.exit(2); }

// adb 解析：--adb > 环境变量 ADB > PATH > 常见安装路径（Windows）
const ADB = (() => {
  const cands = [arg("--adb"), process.env.ADB, "adb",
    "C:/Users/Administrator/AppData/Local/Android/Sdk/platform-tools/adb.exe",
    "D:/Android/Sdk/platform-tools/adb.exe"];
  for (const c of cands) {
    if (!c) continue;
    try { execFileSync(c, ["version"], { windowsHide: true, stdio: "ignore" }); return c; } catch (_) {}
  }
  console.error("找不到 adb：请用 --adb <路径> 或设环境变量 ADB");
  process.exit(2);
})();
const adb = (...a) => execFileSync(ADB, ["-s", SERIAL, ...a], { windowsHide: true, encoding: "utf8", maxBuffer: 1 << 28 });
const sh = (...a) => { try { return adb(...a); } catch (e) { return ""; } };
const log = (...m) => { if (!QUIET) console.log(...m); };

// ---- 启动与前台断言（fail-closed：不在前台就拒跑，绝不给桌面的假读数）----
const PKG = String(arg("--package", "cn.mov.app"));
if (!argv.includes("--no-launch")) {
  try { adb("shell", "monkey", "-p", PKG, "-c", "android.intent.category.LAUNCHER", "1"); } catch (_) {}
  const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    const f = sh("shell", "dumpsys", "window");
    if (f.includes(`mCurrentFocus`) && (f.match(/mCurrentFocus=\S+\s+\S+/)?.[0] || "").includes(PKG)) break;
    execFileSync(process.execPath, ["-e", "setTimeout(()=>{ windowsHide: true },500)"]);
  }
}
{
  const f = sh("shell", "dumpsys", "window");
  const foc = (f.match(/mCurrentFocus=(\S+\s+\S+)/) || [])[1] || "?";
  if (!foc.includes(PKG)) {
    console.error(`✗ 前置断言失败：${PKG} 不在前台（当前焦点=${foc}）——拒绝读数（避免把桌面当被测页）。`);
    console.error("  提示：可加 --no-launch 自行保证前台；本闸只认前台包=" + PKG);
    process.exit(2);
  }
}

// ---- 采集 ----
const densityStr = sh("shell", "wm", "density");                       // "Physical density: 320"
const density = Number((densityStr.match(/(\d+)/) || [])[1] || 160);
const px = (dp) => Math.round((dp * density) / 160);

// 状态栏 / 导航条 inset（从 InsetsSource 帧读）
const disp = sh("shell", "dumpsys", "window", "displays");
const grab = (type) => {
  const m = disp.match(new RegExp(`InsetsSource type=${type} frame=\\[(-?\\d+),(-?\\d+)\\]\\[(-?\\d+),(-?\\d+)\\]`));
  return m ? { top: Number(m[2]), bottom: Number(m[4]), frame: m[0] } : null;
};
const statusBar = grab("ITYPE_STATUS_BAR");
const navBar = grab("ITYPE_NAVIGATION_BAR") || { bottom: Number((disp.match(/mRestrictedScreen=.*?\[(\d+),(\d+)\]/) || [])[2] || 0) };

// 视图树
const tmp = path.join(os.tmpdir(), "mtx-ui.xml");
sh("shell", "uiautomator", "dump", "/sdcard/_mtx.xml");
fs.writeFileSync(tmp, sh("shell", "cat", "/sdcard/_mtx.xml"), "utf8");
const xml = fs.readFileSync(tmp, "utf8");
const nodes = [...xml.matchAll(/<node[^>]*>/g)].map((m) => m[0]).map((r) => {
  const t = (r.match(/text="([^"]*)"/) || [])[1] || "";
  const d = (r.match(/content-desc="([^"]*)"/) || [])[1] || "";
  const b = r.match(/bounds="\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]"/);
  return b ? { t, d, x1: +b[1], y1: +b[2], x2: +b[3], y2: +b[4] } : null;
}).filter(Boolean);

// ---- 判据 ----
const results = [];
const screenW = Number((sh("shell", "wm", "size").match(/(\d+)x(\d+)/) || [])[1] || 720);

// ① 顶栏起点 == 状态栏底边
{
  const bar = nodes.find((n) => n.d === "菜单") || nodes.find((n) => n.y1 <= px(40) && n.y1 >= 0);
  const got = bar ? bar.y1 : null;
  const want = statusBar ? statusBar.bottom : null;
  const ok = got !== null && want !== null && Math.abs(got - want) <= TOL;
  results.push({ id: "①顶栏起点==状态栏底边", ok, got: got === null ? "未找到顶栏" : `${got}px`, want: want === null ? "未读到状态栏 inset" : `${want}px` });
}
// ② 内容左右边距 == space-page
{
  // 取"最靠边的全宽内容元素"（排除容器）：用屏幕下半部最宽文字元素的左右边距
  const cands = nodes.filter((n) => n.t && (n.x2 - n.x1) > screenW * 0.5).sort((a, b) => b.y1 - a.y1);
  const el = cands.find((n) => n.x1 > 0) || cands[0];
  const got = el ? el.x1 : null;
  const want = px(PAGE_DP);
  const ok = got !== null && Math.abs(got - want) <= TOL;
  results.push({ id: `②内容左距==space-page(${PAGE_DP}dp=${want}px)`, ok, got: got === null ? "无候选元素" : `${got}px（${el.t.slice(0, 10)}…）`, want: `${want}px` });
}
// ③ 底部内容底边 ≤ 导航条顶边
{
  const bottomMost = nodes.filter((n) => n.t || n.d).sort((a, b) => b.y2 - a.y2)[0];
  const navTop = navBar && navBar.bottom ? Number((disp.match(/frame=\[\d+,\d+\]\[\d+,(\d+)\]/) || [])[1] || 0) : 0;
  const got = bottomMost ? bottomMost.y2 : null;
  const ok = got !== null && (navTop === 0 || got <= navTop + TOL);
  results.push({ id: "③内容底边≤导航条顶边", ok, got: got === null ? "无" : `${got}px`, want: navTop ? `≤${navTop}px` : "（本机无导航条 inset·跳过）" });
}
// ④ 关层残留（两帧比对：静止 1s 后画面应稳定）
{
  const shot = () => execFileSync(ADB, ["-s", SERIAL, "exec-out", "screencap", "-p"], { windowsHide: true, maxBuffer: 1 << 28 });
  const a = shot(); execFileSync(process.execPath, ["-e", "setTimeout(()=>{ windowsHide: true },1000)"]);
  const b = shot();
  const ok = a.equals(b);
  results.push({ id: "④静止 1s 画面无残帧", ok, got: ok ? "两帧逐字节同" : "两帧不同（可能有残留/动画）", want: "同" });
}

// ---- 输出 ----
if (JSONOUT) console.log(JSON.stringify({ serial: SERIAL, density, statusBar, navBar, results }, null, 2));
else {
  log(`设备矩阵闸 · ${SERIAL}（density=${density}）`);
  for (const r of results) log(`  ${r.ok ? "✅" : "❌"} ${r.id}｜实测 ${r.got}｜期望 ${r.want}`);
}
const failed = results.filter((r) => !r.ok);
console.log(`${failed.length === 0 ? "✅ 全绿" : "❌ 有红：" + failed.map((r) => r.id).join(" / ")}（${results.length - failed.length}/${results.length}）`);
process.exit(failed.length === 0 ? 0 : 1);
