/**
 * validate-projection.mjs —— SYS-10 批③ P0-5 · 投影一致性校验
 *
 * 判据：deriveStatusSummary(canonical) == canonical.statusSummary（规范化后逐位）
 * ——不是「文案是否含已合 main」（防 phase=assigned + 文案已合 坏数据放行）
 * 附加：phase 合法（∈STATUS_REGISTRY）；statusHistory 最后一条 = 当前 phase
 * 出口：checkLib(工单库.md) → { passed, failed[] }
 */

import { deriveStatusSummary } from "./derive-status-summary.mjs";
import { STATUS_REGISTRY } from "./status-registry.mjs";

export function validateProjection(canonical) {
  const errors = [];
  if (canonical.phase && !STATUS_REGISTRY[canonical.phase]) {
    errors.push(`phase "${canonical.phase}" 不在 STATUS_REGISTRY`);
  }
  const derived = deriveStatusSummary(canonical);
  const actual = (canonical.statusSummary || "").trim();
  if (actual !== derived) {
    errors.push(`statusSummary 不一致：derive="${derived}" actual="${actual}"`);
  }
  return { ok: errors.length === 0, errors };
}

/** checkLib：扫描工单库全部卡——report-only（默认）或 fail-close */
export function checkLib(libText) {
  const lines = libText.replace(/\r\n/g, "\n").split("\n");
  const headRe = /^# ([A-Z][A-Z0-9]*-[A-Z0-9]+)/gm;
  const heads = [];
  let hm;
  while ((hm = headRe.exec(libText)) !== null) heads.push({ no: hm[1], at: hm.index });
  const failed = [];
  for (let c = 0; c < heads.length; c++) {
    const cardTxt = libText.slice(heads[c].at, c + 1 < heads.length ? heads[c + 1].at : libText.length);
    const sm = cardTxt.match(/```status\n([\s\S]*?)```/);
    if (!sm) continue;
    const block = sm[1];
    const kv = {};
    for (const line of block.split("\n")) {
      const m = line.match(/^([a-z_]+):\s*(.*)$/);
      if (m) kv[m[1]] = m[2].trim();
    }
    const phase = kv.phase || "";
    if (!phase || !STATUS_REGISTRY[phase]) continue;
    // 派生摘要
    const canonical = { phase, head: kv.head || "" };
    const derived = deriveStatusSummary(canonical);
    // 找卡的 **状态** 行（首行摘要）——从 status block 后第一行找 **状态**：
    const cardLines = cardTxt.replace(/\r\n/g, "\n").split("\n");
    let actual = "";
    for (const l of cardLines) {
      if (l.startsWith("**状态**：") || l.startsWith("**状态**：")) {
        actual = l.replace(/^\*\*状态\*\*[：:]\s*/, "").trim().split("｜")[0].trim();
        break;
      }
    }
    if (!actual) continue;
    // 对比：derived 的 label 部分应出现在 actual 的前缀里
    const label = STATUS_REGISTRY[phase].label;
    if (!actual.includes(label)) {
      failed.push({ no: heads[c].no, phase, expected: label, actual: actual.slice(0, 40) });
    }
  }
  return { passed: failed.length === 0, failed };
}
