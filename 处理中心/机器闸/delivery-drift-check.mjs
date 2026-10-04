#!/usr/bin/env node
// delivery-drift-check.mjs —— 交付树漂移对账（2026-10-01 立·配 set-status 三闸之「树快照锚」）
//
// 语义：交付（set-status --phase delivered）时会把 worktree 全树摘要写进卡面 `tree_digest`；
//       验收/审验/合并位用本工具**重算**并与卡面值比对——不等 = 交付后动过树 ⇒ 红「交付树被改」。
// 摘要口径（与 set-status.py 逐字节同源）：sha256(排序后 `git status --porcelain -uall` 行 + "\n--\n" + `git diff HEAD --no-renames` 全文) 前16位。
// 用法：node 处理中心/机器闸/delivery-drift-check.mjs --ticket UPG-xxx [--lib <工单库>] [--expect <16位>（自测/覆盖卡面值）]
// 退出码：0=干净（或卡面无锚·明确标注）｜1=漂移（红）｜2=用法/环境错。
import fs from "node:fs";
import { USER_HOME, WORKSPACE } from "./lib/root.mjs"; // SYS-160：根解析单源
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..");
const opt = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const TICKET = opt("--ticket");
const LIB = opt("--lib") || path.join(SYS, "处理中心", "工单库.md");
if (!TICKET) { console.error("用法：node delivery-drift-check.mjs --ticket UPG-xxx [--lib <工单库>] [--expect <16位>]"); process.exit(2); }

const raw = fs.readFileSync(LIB, "utf-8");
const at = raw.indexOf(`# ${TICKET} `);
if (at < 0) { console.error(`DRIFT_ERR 工单库未找到 ${TICKET}`); process.exit(2); }
const next = raw.indexOf("\n# ", at + 1);
const card = raw.slice(at, next < 0 ? raw.length : next);
const gv = (k) => (card.match(new RegExp(`^${k}:\\s*(.+)$`, "m")) || [])[1];
const digestExpected = opt("--expect") || (gv("tree_digest") || "").trim();
if (!digestExpected) { console.log(`DELIVERY_TREE_NO_ANCHOR ${TICKET}（卡面无 tree_digest——交付早于闸线或未定位 worktree）`); process.exit(0); }

// worktree 定位：branch 派生优先，其次卡文/designer 的 worktree=<名>
const names = [];
const br = (gv("branch") || "").trim();
if (br) names.push(br.replace("feat/", "mov-").replace("feat-", "mov-"));
for (const m of card.matchAll(/worktree=([A-Za-z0-9_-]+)/g)) names.push(m[1]);
let wt = null;
for (const n of names) for (const rt of [USER_HOME, WORKSPACE]) {   // SYS-160：根解析单源（原 C:\Users\Administrator 与 E:\mov工作区 写死）
  const p = path.join(rt, n);
  if (fs.existsSync(path.join(p, ".git"))) { wt = p; break; }
  if (wt) break;
}
if (!wt) { console.error(`DRIFT_ERR 未定位 worktree（branch=${br || "—"}·候选=${names.join("/") || "无"}）`); process.exit(2); }

const gitOut = (args) => execFileSync("git", ["-C", wt, ...args], { windowsHide: true, encoding: "utf-8", maxBuffer: 1 << 28 });
const norm = (s) => s.replace(/\r\n?/g, "\n"); // 同 Python text 模式：\r\n/\r → \n
let actual;
try {
  const stLines = norm(gitOut(["status", "--porcelain", "-uall"])).split("\n");
  while (stLines.length && stLines[stLines.length - 1] === "") stLines.pop(); // 同 Python splitlines()：去尾空行
  const payload = stLines.sort().join("\n") + "\n--\n" + norm(gitOut(["diff", "HEAD", "--no-renames"]));
  actual = crypto.createHash("sha256").update(payload, "utf-8").digest("hex").slice(0, 16);
} catch (e) {
  console.error(`DRIFT_ERR git 摘要失败：${String(e.message).slice(0, 120)}`); process.exit(2);
}

if (actual === digestExpected) {
  console.log(`DELIVERY_TREE_CLEAN ${TICKET}（锚 ${digestExpected}·重算 ${actual}·worktree=${path.basename(wt)}）`);
  process.exit(0);
}
console.log(`DELIVERY_TREE_DRIFT ${TICKET}（卡面锚 ${digestExpected} ≠ 重算 ${actual}）——交付后树被改动，请按「打回/重交付」处置`);
process.exit(1);
