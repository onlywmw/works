#!/usr/bin/env node
// snapshot.mjs —— 「改动即快照」（2026-09-28 立·因当日三起操作事故）
//
// 为什么用 `git stash create`：它**生成一个 commit 对象但不改索引/工作树/HEAD** ⇒ 多席共用的仓里
// 也能安全留痕（不会把别人在途的改动"夹带提交"）。任何一步想回退，从快照里取文件即可。
//
// 用法：
//   node snapshot.mjs save [--repo <仓>] [--note "<主题>"]     # 生成快照·打印 sha 与恢复命令
//   node snapshot.mjs list                                      # 列出本地快照台账
//   node snapshot.mjs restore <sha> -- <路径> [--repo <仓>]     # 从快照恢复某文件到工作树
//   node snapshot.mjs --self-test                               # 回归自检（编码型路径/台账落位·2026-09-30 立）
// 台账：处理中心/归档/_快照/快照台账.md（只记 sha/时间/主题/文件数；时间为 UTC 口径）
import { execFileSync } from "node:child_process";
import { MOV, SYS } from "./lib/root.mjs"; // SYS-160：根解析单源
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 2026-09-30 修（巡检台收信处置·根层哨兵编码树案）：原 `new URL(import.meta.url).pathname` 对非 ASCII 路径
// 返回**百分号编码**串 ⇒ 本仓全路径皆中文 ⇒ 台账误落 E:\MOV\%E5%AE%89…\ 幽灵树（合法位至今不存在＝安全网静默失效）。
// 契约：脚本内取路径一律 fileURLToPath；且**启动即 fail-closed**——自路径含 %XX 编码即拒跑（防同型回潮）。
const HERE = path.dirname(fileURLToPath(import.meta.url));
if (/%[0-9A-Fa-f]{2}/.test(HERE)) { console.error(`✗ snapshot：自路径含百分号编码「${HERE}」——取路径写法坏了（须 fileURLToPath），拒跑（不落任何件）`); process.exit(3); }
const SYSTEM_ROOT = path.resolve(HERE, "..", "..");   // 体系库根
const CENTER = path.resolve(HERE, "..");
const LEDGER_DIR = path.join(CENTER, "归档", "_快照");
const LEDGER = path.join(LEDGER_DIR, "快照台账.md");
if (!LEDGER.startsWith(SYSTEM_ROOT + path.sep)) { console.error(`✗ snapshot：台账路径越出体系库「${LEDGER}」——拒跑`); process.exit(3); }
const opt = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const REPO = opt("--repo", SYS); // SYS-160：根解析单源（缺省=原路径）
const cmd = process.argv[2];
const git = (args) => execFileSync("git", ["-C", REPO, ...args], { windowsHide: true, encoding: "utf8" }).trim();

if (cmd === "save") {
  const note = opt("--note", "(未注主题)");
  let sha = "";
  try { sha = git(["stash", "create"]); } catch { /* 无改动 */ }
  if (!sha) { console.log("○ 无改动，无需快照"); process.exit(0); }
  const files = git(["show", "--stat", "--format=", sha]).split("\n").filter(Boolean);
  fs.mkdirSync(LEDGER_DIR, { recursive: true });
  if (!fs.existsSync(LEDGER)) fs.writeFileSync(LEDGER, "# 快照台账（改动即快照·stash create 非侵入式·时间列＝UTC）\n\n| 时间（UTC） | sha | 主题 | 规模 |\n|---|---|---|---|\n", "utf8");
  const at = new Date().toISOString().replace("T", " ").slice(0, 16);
  fs.appendFileSync(LEDGER, `| ${at} | ${sha.slice(0, 10)} | ${note} | ${files.length} 行 |\n`, "utf8");
  console.log(`✅ 快照 ${sha.slice(0, 10)}（${note}）`);
  console.log(`   台账落位：${LEDGER}`);
  console.log(`   恢复单文件：node 处理中心/机器闸/snapshot.mjs restore ${sha.slice(0, 10)} -- <路径>`);
  console.log(`   恢复全部：  git -C "${REPO}" stash apply ${sha}`);
} else if (cmd === "--self-test") {
  // 回归自检（2026-09-30 立·编码树案）：①自路径不含 %XX ②台账目录在体系库内 ③台账（若存在）可读
  // （2026-09-30 蓝观察①修：头注原文写「③台账不含编码型路径引用」=宣称＞断言，与实现对齐——编码回归由启动 fail-closed＋② 覆盖）
  const asserts = [
    [`自路径无百分号编码`, !/%[0-9A-Fa-f]{2}/.test(HERE), HERE],
    [`台账目录在体系库内`, LEDGER.startsWith(SYSTEM_ROOT + path.sep), LEDGER],
    [`台账（若存在）可读`, !fs.existsSync(LEDGER) || typeof fs.readFileSync(LEDGER, "utf8") === "string", LEDGER],
  ];
  let bad = 0;
  for (const [name, ok, detail] of asserts) { console.log(`${ok ? "✅" : "❌"} ${name}（${detail}）`); if (!ok) bad++; }
  process.exit(bad ? 1 : 0);
} else if (cmd === "list") {
  console.log(fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, "utf8") : "（无台账·还没存过快照）");
} else if (cmd === "restore") {
  const short = process.argv[3];
  const i = process.argv.indexOf("--");
  if (!short || i < 0) { console.error("用法：restore <sha> -- <路径>"); process.exit(2); }
  const target = process.argv[i + 1];
  const full = short.length === 40 ? short : git(["rev-parse", short]);
  git(["checkout", full, "--", target]);
  console.log(`✅ 已从 ${short} 恢复：${target}`);
} else {
  console.error("用法：snapshot.mjs save|list|restore");
  process.exit(2);
}
