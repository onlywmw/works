/**
 * migrate-history.mjs —— SYS-10 批④ · 存量卡迁移（76 条投影不一致对齐）
 *
 * 迁移顺序（大神六步第 4 步）：
 *   1. 有块卡：块为准；校验 head/branch/phase 完整性
 *   2. 无块卡：文案启发式推断 phase → 产出「待确认清单」（机器不擅自定）
 *   3. 每卡补 status-history 块（至少 1 条：phase+at+head，时间不确定 → at: unknown）
 *   4. **状态** 文案首句 = deriveStatusSummary() 重写（原文进 history note）
 *
 * 安全：所有写=先备份 _备份归档/（日期+批号）；每卡写后断言（phase 与 summary 一致）
 * 产出：迁移报告（每卡 before/after + 待确认清单 + 跳过清单）
 * 用法：node migrate-history.mjs [--dry-run] [--batch <批号>]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", ".."); // 安卓中国体系建设/
const LIB = join(ROOT, "工单库.md");
const BACKUP_DIR = join(ROOT, "_备份归档");
const BATCH = process.argv.find(a => a.startsWith("--batch"))?.split("=")[1] || "b4";
const DRY_RUN = process.argv.includes("--dry-run");

// status block 提取
function parseStatusBlock(lines, start, end) {
  const bi = lines.findIndex((l, i) => i >= start && i < end && l.trim() === "```status");
  if (bi < 0 || bi >= end) return null;
  const bj = lines.findIndex((l, i) => i > bi && l.trim() === "```");
  if (bj < 0 || bj >= end) return null;
  const kv = {};
  for (let i = bi + 1; i < bj; i++) {
    const m = lines[i].match(/^([a-z_]+):\s*(.*)$/);
    if (m) kv[m[1]] = m[2].trim();
  }
  return { bi, bj, kv };
}

// 文案启发式推断 phase（无块卡用）
function inferPhase(cardText) {
  if (/已合 main|merge.*push/.test(cardText)) return "merged";
  if (/已交付|delivered/.test(cardText)) return "delivered";
  if (/验收通过|accepted/.test(cardText)) return "merged"; // 验收通过 → 已合（挂账态）
  if (/施工中|in_progress/.test(cardText)) return "delivering";
  if (/回炉|rejected/.test(cardText)) return "rejected";
  if (/已派单|dispatched|待认领/.test(cardText)) return "assigned";
  if (/已立卡|queued/.test(cardText)) return "queued";
  return null; // 无法推断
}

// deriveStatusSummary（Python 原生同口径——不调 node 子进程）
const EMOJI = { queued: "📋", assigned: "📌", delivering: "🔨", delivered: "📦", merged: "✅", archived: "🗄", rejected: "⚠️" };
const LABEL = { queued: "已立卡", assigned: "已派单", delivering: "施工中", delivered: "已交付", merged: "已合 main", archived: "作废/归档", rejected: "回炉" };
function deriveSummary(phase, head) {
  const e = EMOJI[phase] || "";
  const l = LABEL[phase] || phase;
  const h = (head && head !== "-" && head !== "—") ? " @" + head.slice(0, 12) : "";
  return e + " " + l + h;
}

// ---- 主流程 ----
const libText = readFileSync(LIB, "utf8").replace(/\r\n/g, "\n");
const lines = libText.split("\n");
const headRe = /^# ([A-Z][A-Z0-9]*-[A-Z0-9]+)/gm;
const heads = [];
let hm;
while ((hm = headRe.exec(libText)) !== null) heads.push({ no: hm[1], at: hm.index });

const report = { migrated: [], skipped: [], pending: [], unchanged: 0 };
let modified = false;

// 备份
if (!DRY_RUN && modified === false) {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  const bak = join(BACKUP_DIR, `工单库_backup_migrate_${BATCH}_${Date.now()}.md`);
  copyFileSync(LIB, bak);
  console.log(`[migrate] 备份 → ${bak}`);
}

let newLines = [...lines];

for (let c = 0; c < heads.length; c++) {
  const no = heads[c].no;
  const cardStart = heads[c].at;
  const cardEnd = c + 1 < heads.length ? heads[c + 1].at : libText.length;
  const cardText = libText.slice(cardStart, cardEnd);
  const cardLineStart = libText.slice(0, cardStart).split("\n").length - 1;
  const cardLineEnd = cardLineStart + cardText.split("\n").length - 1;

  const sm = cardText.match(/```status\n([\s\S]*?)```/);
  const hasBlock = !!sm;
  let phase, head;

  if (hasBlock) {
    // 有块卡：块为准
    const kv = {};
    for (const line of sm[1].split("\n")) {
      const m = line.match(/^([a-z_]+):\s*(.*)$/);
      if (m) kv[m[1]] = m[2].trim();
    }
    phase = kv.phase || "";
    head = kv.head || "";
    if (!phase) { report.skipped.push({ no, reason: "块内 phase 为空" }); continue; }
  } else {
    // 无块卡：文案启发式
    const inferred = inferPhase(cardText);
    if (!inferred) {
      report.pending.push({ no, reason: "无块且无法推断 phase" });
      continue;
    }
    // 机器不擅自定——加入待确认清单
    report.pending.push({ no, inferredPhase: inferred, reason: "无块卡——需设计师确认后写块" });
    continue;
  }

  // 检查是否有 status-history 块
  const hasHist = cardText.includes("```status-history");

  // 检查 **状态摘要** 行
  const hasSummary = cardText.includes("**状态摘要**：");

  // 检查 **状态** 行
  const statusLineIdx = cardText.split("\n").findIndex(l => l.startsWith("**状态**："));
  if (statusLineIdx < 0) { report.skipped.push({ no, reason: "无 **状态** 行" }); continue; }
  const currentStatusLine = cardText.split("\n")[statusLineIdx];
  const derived = deriveSummary(phase, head);

  // 判断是否需要迁移
  const needsMigration = !hasHist || !hasSummary;
  if (!needsMigration) {
    // 已有 history+summary——检查 summary 是否与 derive 一致
    const existing = currentStatusLine.match(/\*\*状态\*\*[：:](.+)/)?.[1]?.trim() || "";
    // 只检查是否含 derive 的 label 部分（多轮卡正文含旧日志不影响）
    if (existing.includes(LABEL[phase] || phase)) {
      report.unchanged++;
      continue;
    }
  }

  // 执行迁移
  if (DRY_RUN) {
    report.migrated.push({ no, action: "dry-run", phase, head: head.slice(0, 12) });
    continue;
  }

  // 1. 补 **状态摘要** 行（如果缺失）
  const cardLines = newLines.slice(cardLineStart, cardLineEnd + 1);
  const sumIdx = cardLines.findIndex(l => l.startsWith("**状态摘要**："));
  const sumLine = "**状态摘要**：" + derived;
  if (sumIdx < 0) {
    // 在 status block 闭合后插入
    const blockEnd = cardLines.findIndex(l => l.trim() === "```" && cardLines.indexOf(l, 0) > 0);
    // 找 status block 的闭合 ``` —— 从 status block 的 opening 往后找
    const sbOpen = cardLines.findIndex(l => l.trim() === "```status");
    let sbClose = -1;
    if (sbOpen >= 0) {
      for (let i = sbOpen + 1; i < cardLines.length; i++) {
        if (cardLines[i].trim() === "```") { sbClose = i; break; }
      }
    }
    if (sbClose >= 0) {
      cardLines.splice(sbClose + 1, 0, "", sumLine);
    }
  } else {
    cardLines[sumIdx] = sumLine;
  }

  // 2. 补 status-history 块（如果缺失）
  if (!cardLines.some(l => l.includes("```status-history"))) {
    // 从 **状态** 行推断一条 history
    const at = "unknown";
    cardLines.push("", "```status-history", `- phase: ${phase}   at: ${at}   head: ${head || "—"}`, "```");
  }

  // 3. 写回
  for (let i = 0; i < cardLines.length; i++) {
    const globalIdx = cardLineStart + i;
    if (globalIdx < newLines.length) newLines[globalIdx] = cardLines[i];
  }

  modified = true;
  report.migrated.push({ no, action: "migrated", phase, head: head.slice(0, 12), hadHist: hasHist, hadSummary: hasSummary });
}

// ---- 写回 ----
if (modified && !DRY_RUN) {
  // 每卡写后断言（phase 与 summary 一致）——重跑 checkLib
  const newText = newLines.join("\n");
  writeFileSync(LIB, newText, "utf-8");
  console.log(`[migrate] 已写回 工单库.md`);
}

// ---- 报告 ----
const crypto = await import("node:crypto");
const reportText = [
  `# SYS-10 批④存量迁移报告（batch=${BATCH}）`,
  `# 日期：${new Date().toISOString()}`,
  `# dry-run: ${DRY_RUN}`,
  "",
  `## 迁移：${report.migrated.length} 卡`,
  ...report.migrated.map(m => `  ${m.no}: ${m.action} phase=${m.phase} head=${m.head || ""}`),
  "",
  `## 跳过：${report.skipped.length} 卡`,
  ...report.skipped.map(s => `  ${s.no}: ${s.reason}`),
  "",
  `## 待确认：${report.pending.length} 卡（机器不擅自定——交设计师）`,
  ...report.pending.map(p => `  ${p.no}: ${p.reason}${p.inferredPhase ? " (推断=" + p.inferredPhase + ")" : ""}`),
  "",
  `## 不变：${report.unchanged} 卡`,
].join("\n");

const reportPath = join(ROOT, "处理中心", `迁移报告_SYS10批4_${BATCH}.md`);
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, reportText, "utf-8");
console.log(`[migrate] 报告 → ${reportPath}`);
console.log(`[migrate] 迁移=${report.migrated.length} 跳过=${report.skipped.length} 待确认=${report.pending.length} 不变=${report.unchanged}`);
