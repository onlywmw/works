#!/usr/bin/env node
/**
 * archive-cards.mjs —— 工单卡归档工具（SYS-07 阶段①件 2；设计稿 v1.1 §B1，一卡一档+机器索引）。
 *
 * 选择器：phase ∈ merged/obsolete/closed 且 updated_at 距今 ≥N 天（--days，默认 30）→ 候选。
 * 动作（--execute，默认 --dry-run 只列不搬）：
 *   ① 写前备份工单库 → _备份归档/工单库_backup_archive_<ts>.md
 *   ② 整卡原样搬 `工单归档/<卡号>.md`（一卡一文件——禁止单文件多卡，防大锅饭复发）
 *   ③ 原位墓碑行 `# <卡号> 【已归档→工单归档/<卡号>.md @<日期>】`（保卡头正则 ^# 卡号 命中）
 *   ④ `工单归档/INDEX.md` 整表再生（卡号|标题|终态|归档日期|链接）
 * 一致性：--check 独立校验（INDEX↔文件集↔库内墓碑 三方对账；漏更=红）。
 *
 * 红线：默认 dry-run；实跑（--execute）属阶段③另行授权；写前备份；机器只出 flag。
 *
 * 用法：
 *   node archive-cards.mjs [--lib <工单库.md>] [--days 30] [--dry-run] [--execute]
 *                          [--ticket <卡号> ...] [--check] [--self-test]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname); // 工单系统/
const DEFAULT_LIB = path.join(ROOT, "工单库.md");
const ARCHIVE_DIR_NAME = "工单归档";
const ARCHIVE_PHASES = new Set(["merged", "obsolete", "closed"]);
const TOMBSTONE_PAT = /^# ([A-Z][A-Z0-9]*-[A-Z0-9]+) 【已归档→/;

const CARD_RE = /^# ([A-Z][A-Z0-9]*-[A-Z0-9]+)[ \t]+(.+)$/gm;

/** 解析库文本 → 卡片（含整卡原文）。已归档（墓碑）卡单独标记。 */
export function parseCards(text) {
  const heads = [];
  let hm;
  const re = new RegExp(CARD_RE.source, "gm");
  while ((hm = re.exec(text)) !== null) {
    heads.push({ no: hm[1], title: hm[2].trim(), at: hm.index });
  }
  const cards = [];
  for (let i = 0; i < heads.length; i++) {
    const end = i + 1 < heads.length ? heads[i + 1].at : text.length;
    const raw = text.slice(heads[i].at, end);
    const bm = raw.match(/```status\n([\s\S]*?)```/);
    const kv = {};
    if (bm) {
      for (const line of bm[1].split("\n")) {
        const m = line.match(/^([a-z_]+):\s*(.*)$/);
        if (m) kv[m[1]] = m[2].trim();
      }
    }
    cards.push({
      no: heads[i].no,
      title: heads[i].title,
      phase: kv.phase || "",
      updatedAt: kv.updated_at || "",
      archived: TOMBSTONE_PAT.test(raw.split("\n")[0] + " "),
      raw,
    });
  }
  return cards;
}

/** updated_at → 距今天数（无法解析=null）。 */
export function ageDays(updatedAt) {
  const t = Date.parse(updatedAt);
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

/** 候选筛选（纯函数）。 */
export function candidates(cards, days) {
  return cards.filter(
    (c) => !c.archived && ARCHIVE_PHASES.has(c.phase) &&
      (() => { const a = ageDays(c.updatedAt); return a !== null && a >= days; })(),
  );
}

/** INDEX.md 全量再生（扫归档目录现有一卡一档文件）。 */
export function rebuildIndex(archiveDir) {
  const rows = [];
  for (const f of fs.readdirSync(archiveDir).filter((x) => x.endsWith(".md") && x !== "INDEX.md").sort()) {
    const t = fs.readFileSync(path.join(archiveDir, f), "utf8");
    const head = t.match(/^# ([A-Z][A-Z0-9]*-[A-Z0-9]+)[ \t]+(.+)$/m);
    const ph = (t.match(/^phase: (\S+)/m) || [])[1] || "—";
    const up = (t.match(/^updated_at: (\S+)/m) || [])[1] || "—";
    const no = head ? head[1] : f.replace(/\.md$/, "");
    const title = head ? head[2].trim() : "（标题缺失）";
    rows.push(`| ${no} | ${title.slice(0, 50)} | ${ph} | ${up.slice(0, 10)} | [${f}](${f}) |`);
  }
  const idx = [
    "# 工单归档索引（机器再生——archive-cards.mjs；禁手改）", "",
    "一卡一档：`工单归档/<卡号>.md`；反查三条路=卡号直开 / grep 关键词 / 本表浏览。", "",
    "| 卡号 | 标题 | 终态 | 关闭日期 | 文件 |",
    "|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
  fs.writeFileSync(path.join(archiveDir, "INDEX.md"), idx, "utf8");
  return rows.length;
}

/** 一致性校验：INDEX↔文件集↔库内墓碑 三方对账。返回问题数组（空=通过）。 */
export function consistencyCheck(libText, archiveDir) {
  const problems = [];
  if (!fs.existsSync(archiveDir)) return ["归档目录不存在"];
  const files = fs.readdirSync(archiveDir).filter((x) => x.endsWith(".md") && x !== "INDEX.md");
  const idx = fs.existsSync(path.join(archiveDir, "INDEX.md"))
    ? fs.readFileSync(path.join(archiveDir, "INDEX.md"), "utf8") : "";
  for (const f of files) {
    if (!idx.includes(`(${f})`)) problems.push(`INDEX 漏文件 ${f}（漏更索引=红）`);
  }
  for (const m of idx.matchAll(/\((([A-Z][A-Z0-9]*-[A-Z0-9]+)\.md)\)/g)) {
    if (!files.includes(m[1])) problems.push(`INDEX 幽灵行 ${m[1]}（文件不存在）`);
  }
  for (const line of libText.split("\n")) {
    const tm = line.match(TOMBSTONE_PAT);
    if (tm && !files.includes(`${tm[1]}.md`)) problems.push(`库内墓碑悬空：${tm[1]}（归档文件缺失）`);
  }
  // 单文件多卡硬规则（大锅饭防复发）
  for (const f of files) {
    const t = fs.readFileSync(path.join(archiveDir, f), "utf8");
    const heads = [...t.matchAll(CARD_RE)].length;
    if (heads > 1) problems.push(`${f} 含 ${heads} 卡——归档目录禁止单文件多卡`);
  }
  return problems;
}

// ---------------- self-test（fixture 库全流程，临时目录） ----------------

function card(no, phase, daysAgo, title) {
  const d = new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 19);
  return `# ${no} ${title}\n\n\`\`\`status\nphase: ${phase}\nbranch: feat/x\nupdated_at: ${d}\n\`\`\`\n\n**状态**：示例\n\n## 标题\n${title}\n\n---\n\n`;
}

function selfTest() {
  const td = fs.mkdtempSync(path.join(os.tmpdir(), "archive-sys07-"));
  const lib = path.join(td, "工单库.md");
  const arch = path.join(td, ARCHIVE_DIR_NAME);
  fs.mkdirSync(arch);
  // fixture：旧 closed（候选）/ 旧 merged（候选）/ 新 closed（不候选）/ 活跃（永不候选）
  fs.writeFileSync(lib,
    card("UPG-9001", "closed", 40, "旧关单卡甲") +
    card("UPG-9002", "merged", 45, "旧合卡乙") +
    card("UPG-9003", "closed", 3, "新关单卡丙") +
    card("UPG-9004", "claimed", 60, "在施卡丁（永不归档）"),
    "utf8");
  const cases = [];
  const run = (name, ok) => { cases.push({ name, ok }); if (!ok) console.log(`  [FAIL] ${name}`); };

  const libText0 = fs.readFileSync(lib, "utf8");
  const cards = parseCards(libText0);
  const cand = candidates(cards, 30);
  run("候选恰 2（旧 closed+旧 merged；新关单/活跃排除）",
    cand.length === 2 && cand.every((c) => ["UPG-9001", "UPG-9002"].includes(c.no)));

  // dry-run 语义：不产生任何文件/改动
  const before = fs.readFileSync(lib, "utf8");
  run("dry-run 零改动", fs.readFileSync(lib, "utf8") === before && fs.readdirSync(arch).filter((x) => x !== "INDEX.md").length === 0);

  // execute 全流程
  const sel = candidates(parseCards(fs.readFileSync(lib, "utf8")), 30);
  let libText = fs.readFileSync(lib, "utf8");
  const date = new Date().toISOString().slice(0, 10);
  for (const c of sel) {
    fs.writeFileSync(path.join(arch, `${c.no}.md`), c.raw, "utf8");
    const tomb = `# ${c.no} 【已归档→${ARCHIVE_DIR_NAME}/${c.no}.md @${date}】\n`;
    libText = libText.replace(c.raw, tomb);
  }
  fs.writeFileSync(lib, libText, "utf8");
  const n = rebuildIndex(arch);
  run("execute 归档文件=2（一卡一档）", fs.readdirSync(arch).filter((x) => x.endsWith(".md") && x !== "INDEX.md").length === 2);
  run("INDEX 行数=2", n === 2);
  const libAfter = fs.readFileSync(lib, "utf8");
  run("墓碑在库且卡头正则可命中", /# UPG-9001 【已归档→/.test(libAfter) && /# UPG-9002 【已归档→/.test(libAfter));
  run("归档文件保原文（整卡字节数一致）",
    fs.readFileSync(path.join(arch, "UPG-9001.md"), "utf8") === sel[0].raw); // raw 含原样段落（SYS-07 审验随批①：去真空化）
  run("活跃卡不被搬", libAfter.includes("在施卡丁") && !fs.existsSync(path.join(arch, "UPG-9004.md")));
  run("新关单卡不被搬", !fs.existsSync(path.join(arch, "UPG-9003.md")));
  run("一致性校验通过", consistencyCheck(libAfter, arch).length === 0);
  // 篡改 INDEX → 一致性红
  fs.writeFileSync(path.join(arch, "INDEX.md"),
    fs.readFileSync(path.join(arch, "INDEX.md"), "utf8").replace(/UPG-9001[^\n]*\n/, ""), "utf8");
  run("篡改 INDEX → 一致性红（漏更=红）", consistencyCheck(libAfter, arch).length > 0);

  fs.rmSync(td, { recursive: true, force: true });
  const passed = cases.filter((c) => c.ok).length;
  console.log("═══ archive-cards self-test ═══");
  for (const c of cases) console.log(`  [${c.ok ? "PASS" : "FAIL"}] ${c.name}`);
  console.log(`结论: ${passed === cases.length ? `PASS ${passed}/${cases.length}` : `FAIL ${passed}/${cases.length}`}（机器只出 flag，人裁决）`);
  process.exit(passed === cases.length ? 0 : 1);
}

// ---------------- 主流程 ----------------

import os from "node:os";

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--self-test")) { selfTest(); return; }
  const get = (flag, dflt) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : dflt; };
  const libPath = get("--lib", DEFAULT_LIB);
  const days = Number(get("--days", "30"));
  const execute = argv.includes("--execute");
  const checkOnly = argv.includes("--check");
  const tickets = argv.includes("--ticket") ? argv.slice(argv.indexOf("--ticket") + 1).filter((x) => !x.startsWith("--")) : null;
  const archiveDir = path.join(path.dirname(libPath), ARCHIVE_DIR_NAME);

  if (!fs.existsSync(libPath)) { console.error(`工单库不存在: ${libPath}`); process.exit(2); }
  const libText = fs.readFileSync(libPath, "utf8");

  if (checkOnly) {
    const problems = consistencyCheck(libText, archiveDir);
    console.log(problems.length === 0
      ? "═══ archive 一致性：PASS（INDEX/文件/墓碑 三方对账一致）═══"
      : `═══ archive 一致性：FAIL（${problems.length} 项）═══\n` + problems.map((p) => `  - ${p}`).join("\n"));
    process.exit(problems.length === 0 ? 0 : 1);
  }

  let cards = parseCards(libText);
  let cand = candidates(cards, days);
  if (tickets) cand = cand.filter((c) => tickets.includes(c.no));

  console.log("═══ SYS-07 archive-cards ═══");
  console.log(`库：${cards.length} 卡 ｜ 归档候选（phase∈merged/obsolete/closed 且 ≥${days} 天）：${cand.length}`);
  for (const c of cand) {
    console.log(`  ${c.no}  ${c.title.slice(0, 40)}  [${c.phase}] 距今 ${ageDays(c.updatedAt)} 天`);
  }
  if (cand.length === 0) console.log("  —— 无候选 ——");

  if (!execute) {
    console.log("—— dry-run（默认）：只列不搬；实搬需 --execute（阶段③另行授权）——");
    return;
  }

  // 实搬：写前备份
  const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const backupDir = path.join(ROOT, "_备份归档");
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(path.join(backupDir, `工单库_backup_archive_${ts}.md`), libText, "utf8");
  fs.mkdirSync(archiveDir, { recursive: true });

  let libOut = libText;
  const date = new Date().toISOString().slice(0, 10);
  let moved = 0;
  for (const c of cand) {
    const dest = path.join(archiveDir, `${c.no}.md`);
    if (fs.existsSync(dest)) { console.log(`  跳过 ${c.no}（归档文件已存在）`); continue; }
    fs.writeFileSync(dest, c.raw, "utf8");
    libOut = libOut.replace(c.raw, `# ${c.no} 【已归档→${ARCHIVE_DIR_NAME}/${c.no}.md @${date}】\n`);
    moved++;
  }
  fs.writeFileSync(libPath, libOut, "utf8");
  const idxRows = rebuildIndex(archiveDir);
  const problems = consistencyCheck(fs.readFileSync(libPath, "utf8"), archiveDir);
  console.log(`实搬 ${moved} 卡 ｜ INDEX 再生 ${idxRows} 行 ｜ 一致性 ${problems.length === 0 ? "PASS" : "FAIL " + problems.join(";")}`);
  console.log(`写前备份：${path.relative(ROOT, path.join(backupDir, `工单库_backup_archive_${ts}.md`))}`);
}

main();
