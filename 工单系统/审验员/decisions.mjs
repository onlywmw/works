#!/usr/bin/env node
/**
 * decisions.mjs —— 待决策一屏面板（SYS-07 阶段①件 1；设计稿 v1.1 §B3）。
 *
 * 扫工单库.md 活跃卡 status 块，按相位分组一屏输出：
 *   ⏳待拍板  registered（或活跃卡状态注记含 待拍板/等用户拍板）
 *   📌待认领  dispatched
 *   🔨在施    claimed / in_progress
 *   📦待验收  delivered（无审验通过标记）
 *   🔍待合    delivered 且叙事含 达待合/审验通过/复验通过
 * 历史卡（merged/obsolete/closed）只计总数不展开。
 *
 * 用法：
 *   node decisions.mjs [--lib <工单库.md>] [--json] [--self-test]
 *
 * 风格：机器只出 flag，人裁决（同 set-status/sync-orders）；只读零写入。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname); // 工单系统/
const DEFAULT_LIB = path.join(ROOT, "工单库.md");

const CARD_RE = /^# ([A-Z][A-Z0-9]*-[A-Z0-9]+)[ \t]+(.+)$/gm;
const PENDING_PAT = /(待用户拍板|等用户拍板|待拍板)/;

/** 解析工单库文本 → 卡片数组 {no, title, phase, branch, updatedAt, block, narrative}。 */
export function parseCards(text) {
  const heads = [];
  let hm;
  const re = new RegExp(CARD_RE.source, "gm");
  while ((hm = re.exec(text)) !== null) {
    heads.push({ no: hm[1], title: hm[2].trim(), at: hm.index, headLine: hm[0] });
  }
  const cards = [];
  for (let i = 0; i < heads.length; i++) {
    const seg = text.slice(heads[i].at, i + 1 < heads.length ? heads[i + 1].at : text.length);
    const bm = seg.match(/```status\r?\n([\s\S]*?)```/);
    const block = bm ? bm[1] : "";
    const kv = {};
    for (const line of block.split("\n").map(s => s.replace(/\r$/, ""))) {
      const m = line.match(/^([a-z_]+):\s*(.*)$/);
      if (m) kv[m[1]] = m[2].trim();
    }
    const nm = seg.match(/\n\*\*状态\*\*：(.*)/);
    const narrative = nm ? nm[1] : "";
    cards.push({
      no: heads[i].no,
      title: heads[i].title,
      phase: kv.phase || "",
      branch: kv.branch || "—",
      updatedAt: kv.updated_at || "",
      narrative,
      block,
    });
  }
  return cards;
}

/** 分组（纯函数；self-test 与主流程共用）。历史卡只计数。 */
export function groupCards(cards) {
  const g = {
    "⏳待拍板": [], "📌待认领": [], "🔨在施": [], "📦待验收": [], "🔍待合": [],
  };
  let archived = 0;
  for (const c of cards) {
    const narrativeHit = PENDING_PAT.test(c.narrative) || PENDING_PAT.test(c.block);
    switch (c.phase) {
      case "registered": g["⏳待拍板"].push(c); break;
      case "dispatched": g["📌待认领"].push(c); break;
      case "claimed": case "in_progress": g["🔨在施"].push(c); break;
      case "delivered": {
        if (/达待合|审验通过|复验通过/.test(c.narrative)) g["🔍待合"].push(c);
        else if (narrativeHit) g["⏳待拍板"].push(c);
        else g["📦待验收"].push(c);
        break;
      }
      default: archived++; // merged/obsolete/closed/on_hold/rejected_work 等
    }
  }
  return { groups: g, archived, total: cards.length };
}

/** 行渲染（一卡一行）。 */
function row(c) {
  const title = c.title.slice(0, 40);
  const br = c.branch === "—" ? "" : ` branch=${c.branch}`;
  const up = c.updatedAt ? ` @${c.updatedAt.slice(0, 16)}` : "";
  return `  ${c.no}  ${title}${br}${up}`;
}

function render(res) {
  const L = [];
  L.push("═══ SYS-07 decisions · 待决策一屏 ═══");
  L.push(`工单库：${res.total} 卡 ｜ 活跃 ${res.total - res.archived} ｜ 历史(已归档态) ${res.archived}`);
  const order = ["⏳待拍板", "🔍待合", "🔨在施", "📦待验收", "📌待认领"];
  for (const k of order) {
    const list = res.groups[k];
    L.push(`${k}（${list.length}）`);
    for (const c of list) L.push(row(c));
  }
  const activeCount = order.reduce((s, k) => s + res.groups[k].length, 0);
  L.push(activeCount === 0 ? "—— 全库无活跃卡 ——" : `—— 活跃 ${activeCount} 卡；机器只出分组，人裁决 ——`);
  return L.join("\n");
}

// ---------------- self-test（内嵌 fixture，不依赖真实库） ----------------

function selfTest() {
  const FIX = `# UPG-0001 示例待拍板卡 标题甲

\`\`\`status
phase: registered
branch: —
updated_at: 2026-09-01T08:00:00
\`\`\`

**状态**：⏳ 等用户拍板中

## 标题
甲

---

# UPG-0002 示例在施卡 标题乙

\`\`\`status
phase: claimed
branch: feat/x
updated_at: 2026-09-02T08:00:00
\`\`\`

**状态**：🔨 施工中

## 标题
乙

---

# UPG-0003 示例待验收卡 标题丙

\`\`\`status
phase: delivered
branch: feat/y
updated_at: 2026-09-03T08:00:00
\`\`\`

**状态**：交付完成待验收

## 标题
丙

---

# UPG-0004 示例待合卡 标题丁

\`\`\`status
phase: delivered
branch: feat/z
updated_at: 2026-09-04T08:00:00
\`\`\`

**状态**：审验通过达待合→设计师

## 标题
丁

---

# UPG-0005 示例待认领卡 标题戊

\`\`\`status
phase: dispatched
branch: —
updated_at: 2026-09-05T08:00:00
\`\`\`

**状态**：已派待认领

## 标题
戊

---

# UPG-0006 示例历史卡 标题己

\`\`\`status
phase: closed
branch: feat/h
updated_at: 2026-08-01T08:00:00
\`\`\`

**状态**：已关单

## 标题
己

---
`;
  const cards = parseCards(FIX);
  const res = groupCards(cards);
  const cases = [];
  const run = (name, ok) => cases.push({ name, ok });
  run("总数=6", res.total === 6);
  run("历史=1", res.archived === 1);
  run("待拍板=UPG-0001", res.groups["⏳待拍板"].length === 1 && res.groups["⏳待拍板"][0].no === "UPG-0001");
  run("在施=UPG-0002", res.groups["🔨在施"].length === 1 && res.groups["🔨在施"][0].no === "UPG-0002");
  run("待验收=UPG-0003", res.groups["📦待验收"].length === 1 && res.groups["📦待验收"][0].no === "UPG-0003");
  run("待合=UPG-0004（审验通过标记分流）", res.groups["🔍待合"].length === 1 && res.groups["🔍待合"][0].no === "UPG-0004");
  run("待认领=UPG-0005", res.groups["📌待认领"].length === 1 && res.groups["📌待认领"][0].no === "UPG-0005");
  run("活跃合计=5", Object.values(res.groups).reduce((s, l) => s + l.length, 0) === 5);
  const passed = cases.filter((c) => c.ok).length;
  console.log("═══ decisions self-test ═══");
  for (const c of cases) console.log(`  [${c.ok ? "PASS" : "FAIL"}] ${c.name}`);
  console.log(`结论: ${passed === cases.length ? `PASS ${passed}/${cases.length}` : `FAIL ${passed}/${cases.length}`}（机器只出 flag，人裁决）`);
  process.exit(passed === cases.length ? 0 : 1);
}

// ---------------- 主流程 ----------------

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--self-test")) { selfTest(); return; }
  const libIdx = argv.indexOf("--lib");
  const lib = libIdx >= 0 ? argv[libIdx + 1] : DEFAULT_LIB;
  if (!fs.existsSync(lib)) {
    console.error(`工单库不存在: ${lib}`);
    process.exit(2);
  }
  const res = groupCards(parseCards(fs.readFileSync(lib, "utf8")));
  if (argv.includes("--json")) {
    console.log(JSON.stringify({
      total: res.total,
      archived: res.archived,
      groups: Object.fromEntries(Object.entries(res.groups).map(([k, v]) => [
        k, v.map((c) => ({ no: c.no, title: c.title, phase: c.phase, branch: c.branch, updatedAt: c.updatedAt })),
      ])),
    }, null, 2));
  } else {
    console.log(render(res));
  }
}

main();
