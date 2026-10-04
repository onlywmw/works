#!/usr/bin/env node
// SYS-59 工单重要性评分机器校验（机器防滥闸·反「一切皆 P1」）
// 判据（派单 §二）：
//   ① 新卡（立卡日 ≥ 机制落地日）必带 WSJF 四因子（```priority 块）且值合法、wsjf 与四因子一致；
//   ② bug 卡 ITIL impact/urgency（1-3）必填且 priority 与 3×3 矩阵一致；
//   ③ 分布红线：有分卡 ≥3 张却全是 P1 = fail（anti「一切皆 P1」作弊）；
//   ④ 存量豁免：落地前既有卡不追溯（GRANDFATHERED 截止名单 + 立卡日早于落地日）。
// 用法：node check-priority-score.mjs [--lib <工单库.md>] [--quiet]
// 退出码：0 全绿 ｜ 1 有违规 ｜ 2 库不可读
// 单源：块/矩阵解析复用 ../lib/parse-card.mjs（与取号闸立卡同源，禁第二套）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseLib, parsePriorityBlock, itilPriority, extractPriority } from "../lib/parse-card.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const opt = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const LIB = opt("--lib") || path.join(HERE, "..", "..", "工单库.md");
const QUIET = process.argv.includes("--quiet");

export const EFFECTIVE_DATE = "2026-09-12"; // 机制落地日（取号闸必填起算）
export const GRANDFATHERED = new Set(["UPG-153", "SYS-58", "UPG-154", "SYS-59"]); // 落地前今晨立卡（无分块）——存量豁免，不自追溯
const FIB = new Set([1, 2, 3, 5, 8, 13]);
const SIZE = new Set([1, 2, 5, 8, 13]);
const p2 = (x) => Math.round(x * 100) / 100;

/** 纯函数：卡数组 → {bad, dist}（可测；CLI 壳只做 IO 与退出码） */
export function scoreIssues(cards) {
  const bad = [];
  const dist = [];
  for (const c of cards) {
    const pblk = parsePriorityBlock(c.raw);
    const created = (c.raw.match(/已立卡 @(\d{4}-\d{2}-\d{2})/) || [])[1] || null;
    const isNew = !!created && created >= EFFECTIVE_DATE && !GRANDFATHERED.has(c.id);
    if (isNew) {
      const keys = ["wsjf_bv", "wsjf_tc", "wsjf_rr", "wsjf_size"];
      const miss = keys.filter((k) => !(k in pblk));
      if (miss.length) bad.push(`${c.id} 缺分：${miss.join("/")}`);
      else {
        const [bv, tc, rr, size] = keys.map((k) => Number(pblk[k]));
        if (![bv, tc, rr].every((v) => FIB.has(v)) || !SIZE.has(size)) bad.push(`${c.id} 分值非法：bv/tc/rr 须 1/2/3/5/8/13、size 须 1/2/5/8/13`);
        else if (Number(pblk.wsjf) !== p2((bv + tc + rr) / size)) bad.push(`${c.id} wsjf 不一致：登记 ${pblk.wsjf} ≠ (bv+tc+rr)/size=${p2((bv + tc + rr) / size)}`);
      }
      if (pblk.kind === "bug") {
        const i = Number(pblk.itil_impact), u = Number(pblk.itil_urgency);
        if (![1, 2, 3].includes(i) || ![1, 2, 3].includes(u)) bad.push(`${c.id} bug 卡 ITIL 分缺失/非法（impact/urgency 须 1-3）`);
        else if (pblk.priority !== itilPriority(i, u)) bad.push(`${c.id} ITIL 优先级不符：${pblk.priority} ≠ ${itilPriority(i, u)}`);
      }
    }
    const p = pblk.priority || extractPriority(c.raw);
    if (/^P[0-4]$/.test(p)) dist.push(p);
  }
  if (dist.length >= 3 && dist.every((p) => p === "P1")) bad.push(`分布异常：有分 ${dist.length} 卡全部 P1（反「一切皆 P1」作弊红线）`);
  return { bad, dist };
}

function main() {
  if (!fs.existsSync(LIB)) { console.error(`❌ 库不可读：${LIB}`); process.exit(2); }
  let lib;
  try { lib = parseLib(LIB); } catch (e) { console.error(`❌ 库解析失败：${e.message}`); process.exit(2); }
  const { bad, dist } = scoreIssues(lib.cards);
  if (!QUIET) {
    const cnt = (p) => dist.filter((x) => x === p).length;
    console.log(`check-priority-score @${new Date().toLocaleString("sv-SE")}`);
    console.log(`  库：${LIB}`);
    console.log(`  卡 ${lib.cards.length} 张｜有分 ${dist.length} 张（P0 ${cnt("P0")}·P1 ${cnt("P1")}·P2 ${cnt("P2")}·P3 ${cnt("P3")}·P4 ${cnt("P4")}）｜存量豁免 ${[...GRANDFATHERED].length} 卡`);
  }
  if (bad.length) {
    console.log(`❌ PRIORITY-SCORE FAIL（${bad.length} 项）`);
    for (const m of bad) console.log(`  - ${m}`);
    process.exit(1);
  }
  console.log("PRIORITY-SCORE PASS");
  process.exit(0);
}

const self = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (self) main();
