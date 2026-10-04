/**
 * status-registry.mjs —— SYS-10 批① P0-4 状态注册表 + 迁移状态机（唯一出口）
 *
 * 术语（设计 v2 §二 修正10，三词不互替）：
 *   phase       —— 机器枚举（queued/assigned/delivering/merged/archived/rejected）
 *   stageLabel  —— canonical 人读标签（已立卡/已派单/施工中/已合 main/…）
 *   statusSummary —— presentation 文案（由 derive-status-summary.mjs 单点派生，本文件不管）
 *
 * 变异锚宿主：label/terminal/TRANSITIONS 改动 → lib/self-test.mjs 状态机锚必红。
 */

export const STATUS_REGISTRY = {
  queued: { label: "已立卡", terminal: false, aliases: [] },
  assigned: { label: "已派单", terminal: false, aliases: ["dispatched"] },
  delivering: { label: "施工中", terminal: false, aliases: ["in_progress"] },
  merged: { label: "已合 main", terminal: true, aliases: [] },
  archived: { label: "作废/归档", terminal: true, aliases: ["cancelled", "obsolete", "closed"] },
  rejected: { label: "回炉", terminal: false, aliases: [] },
};

/** 合法迁移白名单（键=from，值=允许的 to 数组；不在表=非法迁移） */
export const TRANSITIONS = {
  queued: ["assigned", "delivering", "archived", "rejected"],
  assigned: ["delivering", "merged", "archived", "rejected"],
  delivering: ["delivered", "merged", "rejected", "archived"],
  rejected: ["delivering", "assigned", "archived"],
  merged: ["archived"],
  archived: [],
};

export function isPhase(phase) {
  return Object.prototype.hasOwnProperty.call(STATUS_REGISTRY, phase || "");
}

export function labelOf(phase) {
  const e = STATUS_REGISTRY[phase || ""];
  return e ? e.label : null;
}

export function isTerminal(phase) {
  const e = STATUS_REGISTRY[phase || ""];
  return !!(e && e.terminal);
}

/** 别名归一：dispatched→assigned / in_progress→delivering / cancelled|obsolete|closed→archived；未知原样返回 */
export function normalizeAlias(phase) {
  if (!phase) return phase;
  if (STATUS_REGISTRY[phase]) return phase;
  for (const [key, entry] of Object.entries(STATUS_REGISTRY)) {
    if (entry.aliases && entry.aliases.includes(phase)) return key;
  }
  return phase;
}

export function canTransition(from, to) {
  const f = normalizeAlias(from);
  const t = normalizeAlias(to);
  const allowed = TRANSITIONS[f];
  return !!(allowed && allowed.includes(t));
}
