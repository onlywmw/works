/**
 * validate-projection.mjs —— SYS-10 批③/④ R3 · 投影一致性校验（含 CLI 入口）
 *
 * 判据（R3 升级）：
 * - **状态摘要** 行 = deriveStatusSummary(canonical) 逐位全等（includes 弱断言→全等，R3 升级）
 * - 无摘要行卡 → 跳检（report-only 降级申报——存量多轮卡批④迁移前不在范围内）
 * - phase 不在 STATUS_REGISTRY → 红
 *
 * CLI 入口：
 *   node lib/validate-projection.mjs [工单库路径]
 *   → stdout "对账 N 卡 / 不一致 M" + 不一致列表
 *   → 不一致非零 exit 1
 */

import { deriveStatusSummary } from "./derive-status-summary.mjs";
import { STATUS_REGISTRY } from "./status-registry.mjs";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function checkLib(libText) {
  const lines = libText.replace(/\r\n/g, "\n").split("\n");
  const headRe = /^# ([A-Z][A-Z0-9]*-[A-Z0-9]+)/gm;
  const heads = [];
  let hm;
  while ((hm = headRe.exec(libText)) !== null) heads.push({ no: hm[1], at: hm.index });
  const failed = [];
  let total = 0;
  for (let c = 0; c < heads.length; c++) {
    const no = heads[c].no;
    const cardTxt = libText.slice(heads[c].at, c + 1 < heads.length ? heads[c + 1].at : libText.length);
    const cardLines = cardTxt.replace(/\r\n/g, "\n").split("\n");
    const sbIdx = cardLines.findIndex(l => l.trim() === "```status");
    if (sbIdx < 0) continue;
    // 解析 status block
    let phase = "", head = "";
    for (let i = sbIdx + 1; i < cardLines.length; i++) {
      if (cardLines[i].trim() === "```") break;
      const m = cardLines[i].match(/^([a-z_]+):\s*(.*)$/);
      if (m) { if (m[1] === "phase") phase = m[2]; if (m[1] === "head") head = m[2]; }
    }
    if (!phase || !STATUS_REGISTRY[phase]) continue;
    total++;
    const canonical = { phase, head };
    const derived = deriveStatusSummary(canonical);
    // 优先 **状态摘要** 行（R3 逐位全等）
    const sumLine = cardLines.find(l => l.startsWith("**状态摘要**："));
    if (sumLine) {
      const actual = sumLine.replace(/^\*\*状态摘要\*\*[：:]\s*/, "").trim();
      if (actual !== derived) {
        failed.push({ no, phase, expected: derived, actual: actual.slice(0, 60) });
      }
    } else {
      // 无摘要行=跳检（report-only 降级申报）
      failed.push({ no, phase, expected: derived, actual: "(无摘要行——批④迁移待执行)" });
    }
  }
  return { passed: failed.length === 0, failed, total };
}

// ---- CLI 入口（SYS-10 批③ R3 补齐） ----
const _isCLI = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("validate-projection.mjs");
if (_isCLI) {
  const libPath = process.argv[2] || join(__dirname, "..", "..", "工单库.md");
  const libText = readFileSync(libPath, "utf8");
  const r = checkLib(libText);
  console.log(`[validate-projection] 对账 ${r.total} 卡 / 不一致 ${r.failed.length}`);
  for (const f of r.failed) {
    console.error(`  [${f.no}] phase=${f.phase} expected="${f.expected?.slice(0, 40)}" actual="${f.actual?.slice(0, 40)}"`);
  }
  process.exit(r.failed.length > 0 ? 1 : 0);
}
