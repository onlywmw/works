/**
 * derive-status-summary.mjs —— SYS-10 批② P0-3 · 状态摘要单点派生器（唯一出口）
 *
 * 输入：canonical（parse-card.mjs 产物）——只用 phase + head
 * 输出：人读状态首句（presentation 文案）
 *
 * 纯函数、无时间/随机逻辑（V6 确定性 100 次一致）。
 * label 来源 = STATUS_REGISTRY（批①），本文件只做组合粒度（emoji+label+hash）——不重新定义状态词表。
 * 用法：set-status.py 写 phase 后调 deriveStatusSummary() 生成 **状态** 首句——不再自己拼中文。
 */

import { STATUS_REGISTRY } from "./status-registry.mjs";

/**
 * deriveStatusSummary(canonical) → string
 * @param {{ phase: string, head?: string }} canonical
 *
 * 单点派生（SYS-10 P0-3）：label/emoji 一律读 STATUS_REGISTRY——不在注册表时
 * **显式告警 + 占位「未知态(phase)」**，绝不静默回退英文 phase（防双实现分叉）。
 */
export function deriveStatusSummary(canonical) {
  const phase = canonical.phase || "queued";
  const e = STATUS_REGISTRY[phase];
  if (!e) {
    console.warn(`[derive] phase "${phase}" 不在 STATUS_REGISTRY——使用显式占位，请补 registry 或修正卡`);
  }
  const label = e ? e.label : `未知态(${phase})`;
  const emoji = e && e.emoji ? e.emoji : "";
  const head = (canonical.head || "").trim();
  if (head && head !== "—" && head !== "-") {
    return `${emoji} ${label} @${head.slice(0, 12)}`;
  }
  return `${emoji} ${label}`;
}
