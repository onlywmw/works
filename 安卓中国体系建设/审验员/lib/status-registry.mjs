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

import { readFileSync } from "node:fs";

/** 主数据文件——唯一数据源（mjs/py 共读，防 label/emoji 双实现分叉）。 */
const _data = JSON.parse(readFileSync(new URL("./status-registry.json", import.meta.url), "utf8"));

export const STATUS_REGISTRY = _data.STATUS_REGISTRY;
export const TRANSITIONS = _data.TRANSITIONS;

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
