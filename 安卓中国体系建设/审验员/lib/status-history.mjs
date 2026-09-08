/**
 * status-history.mjs —— SYS-10 批② P0-6 · 状态历史结构化块（追加制）
 *
 * 块形态：
 * ```status-history
 * - phase: assigned   at: 2026-09-08T10:00:00+08:00   head: —
 * - phase: delivering at: 2026-09-08T14:30:00+08:00   head: ab12ef
 * ```
 * 追加制只增不删。
 */

const BEGIN = "```status-history";
const END = "```";

/** parseHistory(cardText) → [{phase, at, head}] */
export function parseHistory(cardText) {
  const begin = cardText.indexOf(BEGIN);
  if (begin < 0) return [];
  const end = cardText.indexOf(END, begin + BEGIN.length);
  if (end < 0) return [];
  const block = cardText.slice(begin + BEGIN.length, end);
  const entries = [];
  for (const line of block.split("\n")) {
    const m = line.match(/^-\s+phase:\s*(\S+)\s+at:\s*(\S+)\s+head:\s*(\S+)\s*$/);
    if (m) entries.push({ phase: m[1], at: m[2], head: m[3] });
  }
  return entries;
}

/** appendHistory(cardText, phase, at, head) → 新 cardText（追加一条；无块则在文末创建；同 phase+at 幂等跳过） */
export function appendHistory(cardText, phase, at, head) {
  const entry = `- phase: ${phase}   at: ${at}   head: ${head || "—"}`;
  const begin = cardText.indexOf(BEGIN);
  if (begin < 0) {
    const block = `${BEGIN}\n${entry}\n${END}\n`;
    return cardText.replace(/\r?\n$/, "\n") + "\n" + block;
  }
  const end = cardText.indexOf(END, begin + BEGIN.length);
  const block = cardText.slice(begin, end);
  if (block.includes(`at: ${at}`)) return cardText; // 幂等：同时间戳已存在则跳过
  return cardText.slice(0, end) + entry + "\n" + cardText.slice(end);
}
