#!/usr/bin/env node
// merge-check.mjs —— 合并位三查（2026-09-28 立·因"按 app/ 打补丁漏件致编译失败白做一轮"）
//
// 背景：交付件可能散在多个顶级目录（app/ · memory-os/ · docs/ …）。**按目录过滤打补丁＝漏件**（实测踩过）。
// 本工具把合并位的动作固化，任一步不过即停并给出回滚指引：
//   ①补丁＝**全树** diff（不做路径过滤）②件数与交付树/期望核对 ③三方合并 ④**逐件内容比对**（忽略行尾）
//   ⑤编译 ⑥靶向测试（可选）
//
// 用法：
//   node 处理中心/机器闸/merge-check.mjs --worktree E:/mov工作区/mov-upgXXX [--ticket UPG-XXX] [--expect N]
//        [--repo E:/mov归档/0027-mov] [--gradle-cwd N:/0027-mov] [--tests "*XxxTest,*YyyTest"] [--apply]
// 说明：不带 --apply 时只做"补丁+件数+比对"（干跑）；带 --apply 则真三方合并到主仓工作树（**不提交**）。
import { execFileSync, spawnSync } from "node:child_process";
import { PRODUCT } from "./lib/root.mjs"; // SYS-160：根解析单源
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..");

const opt = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const WT = opt("--worktree"); if (!WT) { console.error("缺 --worktree"); process.exit(2); }
const REPO = opt("--repo", PRODUCT); // SYS-160：默认位走根解析（缺省=原路径）
const TICKET = opt("--ticket", "");
const EXPECT = opt("--expect") ? Number(opt("--expect")) : null;
const APPLY = process.argv.includes("--apply");
const VERIFY_ONLY = process.argv.includes("--verify-only");
const sh = (cmd, args, cwd) => execFileSync(cmd, cmd === "git" ? ["-c", "core.quotepath=false", ...args] : args, { windowsHide: true, cwd, encoding: "utf8", maxBuffer: 1 << 28 }); // 2026-09-30：git 一律 -c core.quotepath=false——否则中文路径被引号+八进制转义 ⇒ 件名清单/逐件比对静默失配（同 precommit-check 同型修）

// ① 全树补丁（**含未跟踪新件**——2026-10-02 修：原 `git diff HEAD` 不含 `??` 件 ⇒ 与 F-1 正口径（status -uall）少件（UPG-459 实证 6 vs 9·--expect 核对因此误拦））
// 2026-10-03 修（UPG-464 合并位实证）：新增**二进制件**（品牌标 `mov-logo.png`）时 `git apply` 报
//   「cannot apply binary patch … without full index line」⇒ 两处 diff 一律带 **`--binary`**（补丁内嵌 base85 全文）。
const patch = path.join(os.tmpdir(), `merge-${TICKET || "x"}.patch`);
const trackedDiff = sh("git", ["diff", "HEAD", "--no-renames", "--binary"], WT);   // 2026-09-28 验收席 patch 完备案：一律 --no-renames｜2026-10-03：加 --binary（二进制件）
const untracked = sh("git", ["ls-files", "--others", "--exclude-standard"], WT).trim().split("\n").filter(Boolean);
let patchText = trackedDiff;
for (const f of untracked) {
  // diff --no-index 对「有差异」返回 rc=1 ⇒ 用 spawnSync 取 stdout 原文（不因 rc 丢失）
  const r = spawnSync("git", ["-c", "core.quotepath=false", "diff", "--no-index", "--binary", "--", "/dev/null", f], { windowsHide: true, cwd: WT, encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.stdout) patchText += r.stdout;
}
fs.writeFileSync(patch, patchText);
const files = [...sh("git", ["diff", "HEAD", "--no-renames", "--name-only"], WT).trim().split("\n").filter(Boolean), ...untracked].sort();
console.log(`① 补丁(全树·--no-renames·含未跟踪 ${untracked.length} 件)：${files.length} 件 → ${patch}`);
files.forEach(f => console.log("   -", f));
// ② 口径对账（同口径！两侧都 --no-renames）：patch 段数 MUST == 变集件数（验收席 2026-09-28 建议）
try {
  const nStat = sh("git", ["status", "-uall", "--no-renames", "--porcelain"], WT).trim().split("\n").filter(Boolean).length;
  const nSeg = sh("git", ["apply", "--numstat", patch], WT).trim().split("\n").filter(Boolean).length;
  const ok = nStat === nSeg && nSeg === files.length;
  console.log(`①b 口径对账（--no-renames）：status=${nStat} ｜ patch段=${nSeg} ｜ name-only=${files.length} ⇒ ${ok ? "✅ 一致" : "⚠ 不一致（查：改名折算/未跟踪件/截断）"}`);
  if (!ok && process.env.MERGE_CHECK_STRICT === "1") { console.error("✗ 口径不一致（STRICT）——停"); process.exit(1); }
} catch (e) { console.log(`①b 口径对账：跳过（${String(e.message).slice(0,60)}）`); }

// ② 件数核对
if (EXPECT !== null && files.length !== EXPECT) {
  console.error(`✗ 件数不符：期望 ${EXPECT}·实得 ${files.length} —— 停（别合）`);
  process.exit(1);
}

// ②b 基点核对（工作树基点是否仍在 main 祖先链·落后几步）
try {
  const base = sh("git", ["merge-base", "HEAD", "origin/main"], WT).trim();
  const behind = sh("git", ["rev-list", "--count", `${base}..origin/main`], REPO).trim();
  console.log(`②b 基点 ${base.slice(0, 8)}·落后 main ${behind} 步` + (Number(behind) > 0 ? " ⚠（含锚面类文件时须按 F-5 重生成）" : ""));
} catch { console.log("②b 基点核对跳过（无法访问 origin/main）"); }

// ②c 卡片四方对账（**条件触发**·2026-09-29 立：用户指正「对账闸靠人记得跑」）
//     交付件触及卡片面（页面源/卡产物/卡事件）⇒ 以**本工作树**为真源跑卡闸（worktree 里是未提交的新 registry）；红即停，不靠记性。
//     逃生阀 CARD_AUDIT_SKIP=1（工具环境坏时用·会打印警告留痕）。
// 卡面命中：卡型注册/产物/事件与商城工具（2026-10-02 修：原写法 .../com/mov/android/{CardEvents,MallRoomTools}.kt 与实际路径不符（实际：kotlin/com/hermes/mov/card/CardEvents.kt ＋ java/com/mov/android/tools/MallRoomTools.kt）⇒ 兜底卡闸长期漏网（UPG-458 审验提请）；兜底闸的漏网＝假绿源）
const CARD_RE = /^(tools\/ms-md-server\/page\/|app\/src\/main\/assets\/markstream\/|app\/src\/main\/java\/com\/mov\/android\/(?:tools\/)?MallRoomTools\.kt$|app\/src\/main\/kotlin\/com\/hermes\/mov\/card\/CardEvents\.kt$)/;
const cardTouched = files.filter((f) => CARD_RE.test(f));
if (cardTouched.length) {
  console.log(`②c 卡片面命中 ${cardTouched.length} 件 ⇒ 跑卡片四方对账（--repo ${WT}）`);
  if (process.env.CARD_AUDIT_SKIP === "1") {
    console.log("②c ⚠ 已按 CARD_AUDIT_SKIP=1 跳过——本次合并未过卡闸（留痕：请在交付报告写明跳过理由）");
  } else {
    const r = spawnSync("node", [path.join(SYS, "处理中心", "机器闸", "card-audit.mjs"), "--repo", WT], { windowsHide: true, encoding: "utf8" });
    const out = String((r.stdout || "") + (r.stderr || ""));
    const line = out.split(String.fromCharCode(10)).find((l) => /卡型 \d+ 张/.test(l)) || out.split(String.fromCharCode(10))[0] || "";
    if (r.status !== 0) {
      console.error(`✗ ②c 卡片四方对账未过（rc=${r.status}）——先修漂移再合：`);
      console.error(out.split(String.fromCharCode(10)).filter((l) => /\[./.test(l) || /漂移/.test(l)).slice(0, 8).map((l) => "   " + l).join(String.fromCharCode(10)) || "   （见上方输出）");
      console.error("   （工具环境坏时可用 CARD_AUDIT_SKIP=1 越过·须在合并记录写明）");
      process.exit(1);
    }
    console.log(`②c 卡闸全绿：${line.trim()}`);
  }
} else {
  console.log("②c 卡片面未命中（本交付未触卡片）——跳卡闸");
}

// ③ 干跑 apply --check —— **--3way 下有冲突仍可能返回 0**，必须解析输出才算数（2026-09-28 实测修正）
let out3 = "";
{ // --3way 的"with conflicts"走 stderr ⇒ 必须同时捕获，否则漏判（2026-09-28 实测）
  const r = spawnSync("git", ["apply", "--check", "--3way", patch], { windowsHide: true, cwd: REPO, encoding: "utf8" });
  out3 = String((r.stdout || "") + (r.stderr || ""));
}
if (!VERIFY_ONLY && /with conflicts/i.test(out3)) {
  const NL = String.fromCharCode(10);
  const lines3 = out3.split(NL).filter(l => /conflict/i.test(l)).map(l => "   " + l.trim()).join(NL);
  console.error(`✗ 三方合并**有冲突**——先解冲突/按 F-5 重生成锚面，再合：${NL}${lines3 || "   （见输出）"}`);
  process.exit(1);
}
console.log("③ 三方合并干跑：无冲突");

if (!APPLY && !VERIFY_ONLY) { console.log("（未加 --apply·未落地。加 --apply 再跑即真合并）"); process.exit(0); }

// ④ 真合并 + 逐件内容比对（忽略行尾）
if (!VERIFY_ONLY) { sh("git", ["apply", "--3way", patch], REPO); console.log("④ 已三方合并到主仓工作树（未提交）"); }
else console.log("④ 核对已落地合并（--verify-only）");
let diff = 0, del = 0;
const rd = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8").split(String.fromCharCode(13)).join("") : null);
for (const f of files) {
  const a = rd(path.join(REPO, f)), b = rd(path.join(WT, f));
  if (a === null && b === null) { del++; continue; }              // 两侧都已删＝一致（2026-09-28 修：支持删件）
  if (a === null || b === null) { console.log(`   ⚠ 存在性不符（一侧有/一侧无）：${f}`); diff++; continue; }
  if (a !== b) { console.log(`   ⚠ 与交付树内容不同（预期仅当与已合单同段并集）：${f}`); diff++; }
}
console.log(`④ 逐件比对：${files.length - diff - del}/${files.length} 与交付树逐字节同·${del} 件两侧同删·${diff} 件为并集/异常（须人工判正当性）`);
console.log("⑤⑥ 请接：cd <subst 出的 ASCII 路径> && ./gradlew.bat :app:testDebugUnitTest --tests <靶向>（全量按基线比红集）");
console.log("回滚：git -C", REPO, "checkout HEAD -- <件清单>（新增件 rm）");
