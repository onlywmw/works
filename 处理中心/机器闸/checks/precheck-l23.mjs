#!/usr/bin/env node
// SYS-25 precheck-l23 —— L2/L3 开链前的 30 秒预检（fail-fast）：缺啥当场报，不再跑到一半撞墙。
//
// 五项（全绿 exit 0；红一项 exit 1 + 人话报缺「缺什么 / 怎么补」）：
//   ⓪ 占用检查     真机占用登记（处理中心\机器闸\真机占用.json）空/自持 ⇒ 放行；他人在用 ⇒ 拒跑
//                  （SYS-135：2026-09-28 用户真机被 UPG-365 采集循环占用案）；--force 显式越过并留痕
//   ① 模拟器在线   adb devices 里有目标机（默认 emulator-5554）
//   ①b 设备覆盖    wm size/density 残留 override ⇒ 跑前必还原（跑毕 MUST 自证；纪律见 设计师/经验库/已知坑.md）
//   ② App 已装     adb shell pm path <包名> 能列出 package:
//                  包名默认**从 worktree 的 app/build.gradle(.kts) 读 applicationId**（SYS-133：
//                  旧默认 com.mov.android 是 namespace、与现行 applicationId=cn.mov.app 分家 ⇒ ② 恒假红）
//   ③ key 有效     复用 key-health 的探测（默认读 keys.local.json）
//
// 用法：
//   node 处理中心\机器闸\checks\precheck-l23.mjs
//   node ... --serial emulator-5554 --package cn.mov.app --worktree E:/mov工作区/mov-upg339 --adb <adb路径> --keys <keys路径> --quiet
//   node ... --serial <机> --who <操作者> --park --for 30 --why "L2 复跑"   ← 跑前登记「占用起」（跑毕「放」清占用）
//   node ... --serial <机> --force                                       ← 越过他人在用/残留覆盖（记 _forceLog 留痕）
// 退出码：0=全绿；1=有缺项（逐项列缺+补法）
import fs from "node:fs";
import { WORKSPACE } from "../lib/root.mjs"; // SYS-160：根解析单源（残留修：原 ../../../ 越根＋导出名错〔WORKSPACE_ROOT 不存在〕）
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readKeys, probeAll, parseArgs, LABEL } from "./key-health.mjs";
// SYS-135 真机占用闸：⓪ 占用前置（他人在用即拒跑）＋①b 覆盖残留（必还原）——登记件与真机读数在 checks/真机占用.mjs
import { DEFAULT_SERIAL, DEFAULT_ADB, resolveAdb, run, occupantOf, occLine, overdueMin, park, logForce, whoami, wmRead } from "./真机占用.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..", "..");
const DEFAULT_KEYS = path.join(HERE, "keys.local.json");
/** 取不到 worktree gradle 时的回退包名（= 现行 applicationId；namespace 仍是 com.mov.android）。 */
const FALLBACK_PACKAGE = "cn.mov.app";

/**
 * 一个目录里的 app/build.gradle(.kts) → 包名（无/读不出 → null）。
 * F-D（SYS-134）：**字段名由捕获组派生**（读 applicationId 就标 applicationId、改读 namespace 就标 namespace）——
 * 此前标签是硬编码字面量，审验变异实验复现过「读 namespace 却标 applicationId」的错标。
 */
function packageFromDir(dir) {
  // 字段名在捕获组里——标签随字段名走（变异成 namespace 就标 namespace）
  const re = /\b(applicationId)\s*[=\s]\s*["']([^"']+)["']/;
  for (const rel of ["app/build.gradle.kts", "app/build.gradle", "build.gradle.kts", "build.gradle"]) {
    const f = path.join(dir, rel);
    if (!fs.existsSync(f)) continue;
    const m = fs.readFileSync(f, "utf-8").match(re);
    if (m) return { pkg: m[2], field: m[1], from: rel + " 的 " + m[1] };
  }
  return null;
}

/**
 * 包名解析（SYS-133）：--package 显式 > --worktree > cwd > 工作区最新 mov-* worktree > 回退常量。
 * 只读文件、无副作用；命中即返回来源串（进读数，便于事后归因）。
 */
function resolvePackage(cliPkg, cliWorktree) {
  if (cliPkg) return { pkg: cliPkg, from: "--package 显式指定" };
  let missNote = "";
  if (cliWorktree) {
    const hit = packageFromDir(cliWorktree);
    if (hit) return { pkg: hit.pkg, from: `${cliWorktree} 的 ${hit.from}` };
    // F-C（SYS-134）：**不允许静默降级**——路径笔误会判到别人的 worktree 上，必须显式提示回落去向
    const why = fs.existsSync(cliWorktree) ? "目录在但无 build.gradle(.kts)/applicationId" : "路径不存在";
    missNote = `--worktree ${cliWorktree} 未命中（${why}）→ 回落 ｜ `;
    console.error(`  ⚠️ --worktree ${cliWorktree} 未命中（${why}）→ 回落到 cwd → 工作区扫描 → 回退常量`);
  }
  const dirs = [];
  if (cliWorktree) dirs.push(cliWorktree);
  dirs.push(process.cwd());
  try {
    const subs = fs.readdirSync(WORKSPACE, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith("mov-") && !e.name.includes("-mut")) // 变异副本不进候选
      .map((e) => ({ dir: path.join(WORKSPACE, e.name), m: fs.statSync(path.join(WORKSPACE, e.name)).mtimeMs }))
      .sort((x, y) => y.m - x.m);
    for (const s of subs) dirs.push(s.dir);
  } catch { /* 工作区不在（非本机/清理后）→ 只走 cwd 与回退 */ }
  for (const d of dirs) {
    const hit = packageFromDir(d);
    if (hit) return { pkg: hit.pkg, from: missNote + `${d} 的 ${hit.from}` };
  }
  return { pkg: FALLBACK_PACKAGE, from: missNote + `回退常量（未读到任何 worktree 的 applicationId）` };
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const serial = a.serial || DEFAULT_SERIAL;
  const { pkg, from: pkgFrom } = resolvePackage(a.package, a.worktree);
  const adb = resolveAdb(a.adb);
  const keysFile = path.resolve(a.keys || DEFAULT_KEYS);
  const quiet = "--quiet" in a || a.quiet === "";
  const who = whoami(a.who);    // SYS-135：占用登记认「自持」靠同一身份（--who > MOV_SEAT > 未署名）
  const force = "force" in a;  // SYS-135：显式越过占用/残留覆盖（越过记 _forceLog 留痕；parseArgs 剥 -- 前缀）
  const problems = [];

  if (!quiet) {
    console.log(`precheck-l23 开链预检 @${new Date().toLocaleString("sv-SE")}`);
    console.log(`  adb=${adb}｜目标机=${serial}｜操作者=${who}｜包名=${pkg}（${pkgFrom}）`);
  }

  // ⓪ 占用检查（SYS-135 前置·不触设备）：空/自持 ⇒ 放行；他人在用 ⇒ 拒跑（--force 才越过并留痕）
  const cur = occupantOf(serial);
  const self = cur && cur.who === who;
  if (cur && !self && !force) {
    console.log(`  ❌ ⓪ 占用检查 —— ${serial} 他人在用：${occLine(cur)}`);
    problems.push({ item: "⓪ 占用检查", lack: `真机被他人占用：${occLine(cur)}（本席=${who}）`,
      fix: `等 TA 放行（node 处理中心\\机器闸\\checks\\真机占用.mjs 放 --serial ${serial}）或换机；确需越过加 --force（越过记 真机占用.json 的 _forceLog 留痕）` });
  } else if (cur && !self) {
    logForce({ who, serial, skipped: [`占用：他人在用 ${occLine(cur)}`], tool: "precheck-l23" });
    console.log(`  ⚠️ ⓪ 占用检查 —— --force 越过他人在用：${occLine(cur)}（已记 _forceLog·操作者=${who}）`);
  } else {
    const over = cur ? overdueMin(cur) : 0;
    console.log(cur
      ? `  ✅ ⓪ 占用检查 —— 自持：${occLine(cur)}${over ? `（⚠️ 已超预计 ${over} 分钟）` : ""}`
      : `  ✅ ⓪ 占用检查 —— 无占用（登记件 处理中心/机器闸/真机占用.json）`);
  }

  if (problems.length) {
    console.log(`  ⏭️ ①/①b/②/③ —— 被 ⓪ 阻塞（他人在用即拒跑：不触设备、不跑 key 探测）`);
    report(problems);
  }

  // ① 模拟器在线
  const dev = run(adb, ["devices"]);
  let online = false;
  if (!dev.ok) {
    problems.push({ item: "① 模拟器在线", lack: `adb 跑不起来（${dev.err || "命令不存在"}）`,
      fix: `确认 adb 路径（本机常态 ${DEFAULT_ADB}）或把 adb 加进 PATH；再跑 --adb <路径>` });
    console.log(`  ❌ ① 模拟器在线 —— adb 不可用`);
  } else {
    const rows = dev.out.split(/\r?\n/).slice(1).map((l) => l.trim()).filter(Boolean)
      .map((l) => l.split(/\s+/)).filter((p) => p[1] === "device").map((p) => p[0]);
    online = rows.includes(serial);
    if (online) {
      console.log(`  ✅ ① 模拟器在线 —— ${serial}`);
    } else {
      const seen = rows.length ? `当前在线：${rows.join("、")}` : "当前无任何 device";
      problems.push({ item: "① 模拟器在线", lack: `adb 里没有 ${serial}（${seen}）`,
        fix: `启动模拟器（Android Studio AVD 管理器 / emulator -avd <名>）或 adb connect <ip:port>；随后 adb devices 应见「${serial}\tdevice」` });
      console.log(`  ❌ ① 模拟器在线 —— ${seen}`);
    }
  }

  // ①b 设备级覆盖（SYS-135）：残留 wm size/density override ⇒ 跑前必还原（跑毕 MUST 自证读数回 Physical）
  if (!online) {
    console.log(`  ⏭️ ①b 设备覆盖 —— 被 ① 阻塞（无在线设备）`);
  } else {
    const wm = wmRead(adb, serial);
    const dirty = wm.sizeOverride || wm.densityOverride;
    if (!wm.ok) {
      console.log(`  ❌ ①b 设备覆盖 —— 读数失败（adb 出错）`);
      problems.push({ item: "①b 设备覆盖", lack: `wm 读数失败，无法确认无残留覆盖`,
        fix: `手查 adb -s ${serial} shell wm size ／ wm density（adb 与设备就绪后复跑）` });
    } else if (dirty && force) {
      logForce({ who, serial, skipped: [`覆盖：残留 override size=${wm.size} density=${wm.density}`], tool: "precheck-l23" });
      console.log(`  ⚠️ ①b 设备覆盖 —— --force 越过残留 override：size=[${wm.size}]；density=[${wm.density}]（已记 _forceLog·操作者=${who}）`);
    } else if (dirty) {
      console.log(`  ❌ ①b 设备覆盖 —— 残留 override：size=[${wm.size}]；density=[${wm.density}]`);
      problems.push({ item: "①b 设备覆盖", lack: `残留 override（size=[${wm.size}]；density=[${wm.density}]）`,
        fix: `跑前还原：adb -s ${serial} shell wm size reset ／ wm density reset；跑毕 MUST 自证读数回 Physical（口径=设计师/经验库/已知坑.md「真机跑测试的占用纪律」）` });
    } else {
      console.log(`  ✅ ①b 设备覆盖 —— 无 override（size=[${wm.size}]；density=[${wm.density}]）`);
    }
  }

  // ② App 已装
  if (!online) {
    problems.push({ item: "② App 已装", lack: "无在线设备，无法查包（被 ① 阻塞）",
      fix: "先过 ①（模拟器在线），本条自动可查" });
    console.log(`  ⏭️ ② App 已装 —— 被 ① 阻塞（无在线设备）`);
  } else {
    const pm = run(adb, ["-s", serial, "shell", "pm", "path", pkg]);
    if (pm.out.includes("package:")) {
      console.log(`  ✅ ② App 已装 —— ${pkg}`);
    } else {
      problems.push({ item: "② App 已装", lack: `${serial} 上没装 ${pkg}（或已卸载）`,
        fix: `在施工仓装 debug 包：./gradlew.bat :app:installDebug；或 adb -s ${serial} install -r <apk>；包名不对就显式指定 --package <applicationId>` });
      console.log(`  ❌ ② App 已装 —— 未装 ${pkg}`);
    }
  }

  // ③ key 有效（复用 key-health 探测）
  if (!fs.existsSync(keysFile)) {
    problems.push({ item: "③ key 有效", lack: `输入件不存在：${keysFile}`,
      fix: `建该文件（gitignored 本地保密件），至少含一个 key 字段，如 {"deepseek_key": "sk-..."}` });
    console.log(`  ❌ ③ key 有效 —— 输入件不存在`);
  } else {
    let keys = [];
    try { keys = readKeys(keysFile); } catch (e) { problems.push({ item: "③ key 有效", lack: `输入件读不出：${String(e.message).slice(0, 120)}`, fix: "修 JSON 语法（注意别把 key 写进任何入档文件）" }); }
    if (!keys.length) {
      if (!problems.some((p) => p.item === "③ key 有效")) {
        problems.push({ item: "③ key 有效", lack: `${path.basename(keysFile)} 里没找到疑似凭证字段`, fix: `补 key 字段（≥16 字符、无空白/中文），如 {"deepseek_key": "sk-..."}` });
        console.log(`  ❌ ③ key 有效 —— 没找到凭证字段`);
      }
    } else {
      const rs = await probeAll(keys);
      const bad = rs.filter((r) => r.state !== "VALID");
      for (const r of rs) {
        const icon = r.state === "VALID" ? "✅" : r.state === "INVALID" ? "❌" : "⚠️";
        console.log(`  ${icon} ③ key 有效 —— ${r.name} ${r.code ?? ""} ${LABEL[r.state] ?? r.state}`);
      }
      for (const r of bad) {
        if (r.state === "INVALID") {
          problems.push({ item: "③ key 有效", lack: `${r.name} 失效（HTTP ${r.code}，key 死）`,
            fix: `换新 key 写进 ${path.relative(SYS, keysFile)}（该文件 gitignored），再跑 key-health 复验` });
        } else {
          problems.push({ item: "③ key 有效", lack: `${r.name} ${r.code ?? "不可达"}（${r.state}——不是 key 失效）`,
            fix: `先查网络/端点（curl ${process.env.KEY_HEALTH_ENDPOINT || "https://api.deepseek.com/models"}），通了再复跑；别急换 key` });
        }
      }
    }
  }

  // SYS-135 起止登记：--park ⇒ 全绿时写「占用起」（跑毕必「放」清占用＋覆盖自证）
  if (!problems.length && "park" in a) {
    const r = park(serial, { who, forMin: Number(a.for || 30), why: a.why || "", force, tool: "precheck-l23" });
    if (!r.ok) {
      console.log(`  ❌ --park —— ${serial} 已被 ${occLine(r.cur)} 占用（刚被抢？）`);
      problems.push({ item: "⓪ 占用检查", lack: `--park 登记失败：${serial} 已被 ${occLine(r.cur)} 占用`,
        fix: `等 TA 放行（node 处理中心\\机器闸\\checks\\真机占用.mjs 放 --serial ${serial}）或加 --force` });
    } else {
      console.log(`  📌 已登记占用起：${serial} —— ${occLine(r.entry)}（跑毕必「放」：node 处理中心\\机器闸\\checks\\真机占用.mjs 放 --serial ${serial}——放时打覆盖读数自证）`);
    }
  }

  report(problems);
}

/** 结论收口：全绿 PASS（exit 0）／列缺 FAIL（exit 1）。 */
function report(problems) {
  if (!problems.length) {
    console.log(`PRECHECK L23 PASS —— 五项全绿，可开链（占用/在线/覆盖/包/key 就绪）`);
    process.exit(0);
  }
  console.log(`PRECHECK L23 FAIL —— ${problems.length} 项缺，逐条补：`);
  for (const p of problems) {
    console.log(`  ✗ ${p.item}：缺 ${p.lack}`);
    console.log(`    补：${p.fix}`);
  }
  process.exit(1);
}

main();
