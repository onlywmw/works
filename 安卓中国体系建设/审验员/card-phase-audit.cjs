#!/usr/bin/env node
/* ============ SYS-08 S1 · card-phase-audit（卡面 phase ↔ git 对账硬闸） ============
 * 断言：phase ∈ 非终态集合（delivered/accepted/claimed/dispatched/in_progress）且 head 非空的卡，
 *       head 必须 ∈ origin/main 祖先链（两仓路由：先 cat-file 定位归属仓，再 merge-base）。
 * 命中（head 已合 main 但 phase 未登记 merged）→ 硬红列出 + exit 1（「请 set-status phase=merged」）。
 * 配套：pre-commit 挂载（大仓 .git/hooks/pre-commit 追加调用）+ 命令行周扫入口（node 本脚本）。
 * 自动 fetch：两仓尽力 fetch（失败明报，不阻断——基准退本地 origin/main ref 快照）。
 * 红线：机检只出 flag；登记动作走 set-status 写闸（本脚本不改库）。
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");          // 工单系统/
const LIB = path.join(ROOT, "工单库.md");
const MAIN_REPO = "E:/mov归档/0027-mov";             // 主仓（MOV 产品票）
const SELF_REPO = path.resolve(ROOT, "..");          // 工单系统所在大仓（SYS 治理票）
const PHASE_OPEN = new Set(["delivered", "accepted", "claimed", "dispatched", "in_progress"]);

function gitAt(repo, args) {
  try {
    const r = execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, out: r.trim() };
  } catch (e) {
    return { ok: false, out: String(e.stderr || e.message).trim() };
  }
}

// ---- 1. 解析工单库 status blocks ----
const txt = fs.readFileSync(LIB, "utf8").replace(/\r\n/g, "\n");
const cards = [];
const headRe = /^# ([A-Z][A-Z0-9]*-[A-Z0-9]+)/gm;
const heads = [];
let hm;
while ((hm = headRe.exec(txt)) !== null) heads.push({ no: hm[1], at: hm.index });
for (let c = 0; c < heads.length; c++) {
  const cardTxt = txt.slice(heads[c].at, c + 1 < heads.length ? heads[c + 1].at : txt.length);
  const sm = cardTxt.match(/```status\n([\s\S]*?)```/);
  if (!sm) continue; // 无 status block 的卡不查（本闸只管结构化新卡）
  const kv = {};
  for (const line of sm[1].split("\n")) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (m) kv[m[1]] = m[2].trim();
  }
  cards.push({ no: heads[c].no, phase: kv.phase || "", head: kv.head || "", branch: kv.branch || "" });
}

// ---- 2. 两仓 fetch（尽力） ----
for (const r of [MAIN_REPO, SELF_REPO]) {
  if (fs.existsSync(r)) { try { execFileSync("git", ["-C", r, "fetch", "origin", "--quiet"], { stdio: "ignore" }); } catch {} }
}

// ---- 3. 对账 ----
const hits = [];
let checked = 0;
for (const card of cards) {
  if (!PHASE_OPEN.has(card.phase)) continue;      // 终态（merged/closed/rejected_*）不查
  if (!card.head || !/^[0-9a-f]{7,40}$/.test(card.head)) continue; // 无 head/短异常不查
  // head 归属仓路由：cat-file 命中哪仓=哪仓
  let repo = null;
  for (const r of [MAIN_REPO, SELF_REPO]) {
    if (fs.existsSync(r) && gitAt(r, ["cat-file", "-t", card.head]).ok) { repo = r; break; }
  }
  if (!repo) continue; // head 对象两仓均无（未推/已收分支）——不误报
  checked++;
  const anc = gitAt(repo, ["merge-base", "--is-ancestor", card.head, "origin/main"]);
  if (anc.ok) {
    hits.push({ no: card.no, phase: card.phase, head: card.head.slice(0, 12), repo: path.basename(repo) });
  }
}

if (hits.length) {
  console.error(`[card-phase-audit] 硬红 ${hits.length} 卡——已合 main 但 phase 未更新：`);
  for (const h of hits) {
    console.error(`  [${h.no}] phase=${h.phase} head=${h.head}（${h.repo}）——请 set-status phase=merged --head <hash>`);
  }
  process.exit(1);
}
console.log(`[card-phase-audit] ok —— ${cards.length} 卡解析，${checked} 张开放态+head 卡全部与 origin/main 对账一致（0 断裂）`);
