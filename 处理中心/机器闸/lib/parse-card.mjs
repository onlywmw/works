/**
 * parse-card.mjs —— SYS-10 批① P0-2 单点解析引擎（CanonicalCard）
 *
 * 设计：设计师\方案设计\SYS-10_工单状态双轨一致化_设计_v2_2026-09-08.md（P0-1/P0-2/P0-6）
 * 契约：canonical-card.schema.json（同目录）
 *
 * 职责边界：
 *   - status 块（```status）= 唯一真相：phase/head/branch/designer/dev/inspector/merge/delivery_id 权威
 *   - 无 status 块 → 退回 **状态** 文案启发式（phase=null 诚实降级，不造值；现状不劣化）
 *   - **状态** 文案行 = 物化视图：本解析器只读出 statusSummary（首行）+ roles（对账用启发式列），
 *     不赋予其状态语义（E4 消费 canonical，见批③ validate-projection）
 *   - ```status-history 结构化留痕解析（批②起写入）
 *
 * 纯函数：不写文件、无副作用。CRLF 源文件已归一为 LF 后解析。
 * 变异锚宿主：parseStatusBlockLines 删 phase 行解析 / 文案回退删 **状态** 匹配 → self-test 必红。
 */

import fs from "node:fs";
import { normalizeAlias, labelOf } from "./status-registry.mjs";

// ---------------- 共享解析机（自 orders-overview.mjs R1 版收编——四工具单一来源） ----------------

export const SEC_WORDS = [
  "**卡点", "**背景", "**来源", "**问题", "**修法", "**验收", "**交接", "**红线", "**方案",
  "**决策点", "**施工规矩", "**根因", "**定案", "**防撞", "**级别", "**判据",
  "**范围红线", "**关键设计点", "**送审", "**与契约", "**一句话", "**施工范围",
  "**遗留", "**用户实测", "**其余", "**串行", "**交付", "**顺带纠正", "**无冲突",
  "**Token", "**认领情况", "**派单交接", "**核心方案", "**实施", "**不做清单",
  "**维持死亡", "**证伪复活", "**方法学注记", "**文档纪律", "**打回依据",
  "**重修验收", "**关联独立单", "**桥能力现状", "**达标项", "**修正项", "**差距",
  "**合格", "**结构", "**能力清单", "**安装", "**功能", "**规则", "**场景",
  "**边界", "**职责", "**契约", "**接口", "**数据结构", "**配置", "**流转",
];

export const SEG_RE = /(?=→\s*[✅🔨❌⚠️📌🆕⏳】]+)|(?=→\s*\*\*)|(?=｜\s*[✅🔨❌⚠️📌🆕⏳】]+)|(?=｜\s*\*\*)|(?=【✅)|(?=】；)|(?=\*\*日期\*\*)|(?=\*\*出单人\*\*)|(?=\*\*优先级\*\*)|(?= \*\*✅)|(?= \*\*🔨)|(?= \*\*❌)/;

export const FIELD_HEAD = ["**出单人**", "**日期**", "**优先级**", "**卡点**", "**原状态**"];

// R1（2026-10-04 工单系统重构）：以下词汇=全体系解析单源——sync-orders 等闸一律 import，禁止再立私有副本
export const ROLE_ANCHORS = [
  { role: "merge", re: /待设计师合 main|已合 main|合 main|合流/g },
  { role: "inspector", re: /验收员|验收通过|独立复核|复验|打回|审验/g },
  { role: "dev", re: /C 交付|C 完成|C 修复|C 批|修复交付|修复完成|M3-R2|已认领|在施|施工中|重修完成/g },
  { role: "designer", re: /出单人|方案[\s**]*[vV]\d|设计[\s]*[vV]\d|定稿|已派单|评审|裁决|拍板|规范|激活|方案完成/g },
];

export const DATE_RE = /@?(\d{4}-\d{2}-\d{2})/g;
export const DEL_RE = /DEL-[A-Z0-9]+-\d{8}-\d+/g;
export const DOC_RE = /设计师[\\/][^\s｜|，。；）)（(]*?\.md/;
const CARD_HEAD_RE = /^# ((?:UPG|SYS|W|S)-\d+)\s+(.*)$/;

export function extractPriority(txt) {
  const patterns = [
    /\*\*优先级\*\*：\s*([^｜|\n\r]+)/,
    /(?:｜|\|)\s*优先级：\s*([^｜|\n\r]+)/,
    /(?:^|；)优先级：\s*([^｜|\n\r]+)/,
    /（(P[0-4])\s*·\s*[0-9~]/u,
    /\*\*级别\*\*：\s*([^｜|\n\r]+)/,
  ];
  for (const re of patterns) {
    const m = txt.match(re);
    if (!m) continue;
    let v = m[1].trim().replace(/[（(].*$/, "").trim();
    const pm = v.match(/P[0-4]/);
    if (pm) return pm[0];
    if (/^[0-4]$/.test(v)) return "P" + v;
    if (/^P[0-4]$/.test(v)) return v;
    return v;
  }
  return "—";
}

export function segments(text) {
  let body = text.replace(/^\*\*状态\*\*：/, "").replace(/\n/g, " ").replace(/——/g, "｜");
  return body
    .split(SEG_RE)
    .map((p) => p.trim().replace(/^[→｜。；]+/, "").trim())
    .filter((p) => p.length > 0);
}

function classify(seg) {
  if (FIELD_HEAD.some((f) => seg.startsWith(f))) return null;
  const head = seg.slice(0, 40);
  for (const { role, re } of ROLE_ANCHORS) {
    re.lastIndex = 0;
    if (re.test(head)) return role;
  }
  return null;
}

function actionSubsegs(seg) {
  const markers = [];
  for (const { role, re } of ROLE_ANCHORS) {
    for (const m of seg.matchAll(re)) markers.push({ idx: m.index, role, word: m[0] });
  }
  if (!markers.length) return [];
  markers.sort((a, b) => a.idx - b.idx || b.word.length - a.word.length);
  const dedup = [];
  for (const mk of markers) {
    const last = dedup[dedup.length - 1];
    if (last && last.idx === mk.idx) continue;
    if (last && mk.role === last.role && mk.idx < last.idx + last.word.length) continue;
    dedup.push(mk);
  }
  const out = [];
  for (let k = 0; k < dedup.length; k++) {
    const mk = dedup[k];
    const tail = seg.slice(mk.idx + mk.word.length, k + 1 < dedup.length ? dedup[k + 1].idx : seg.length)
      .trim().replace(/^[｜|→。；：]+/, "").trim();
    out.push({ role: mk.role, text: (mk.word + tail).slice(0, 70) });
  }
  return out;
}

function maxDate(s) {
  let date = -1;
  DATE_RE.lastIndex = 0;
  for (const m of s.matchAll(DATE_RE)) {
    const p = m[1].split("-");
    const t = Date.UTC(+p[0], +p[1] - 1, +p[2], 23, 59, 59);
    if (t > date) date = t;
  }
  return date;
}

/** pick 返回 { text, date, pos }（对账需要位置做打回/合流先后判定——同 orders-overview 口径） */
export function pick(segs, role) {
  let best = null, bestDate = -1, bestPos = -1, hasWhole = false;
  segs.forEach((s, pos) => {
    if (FIELD_HEAD.some((f) => s.startsWith(f))) return;
    if (classify(s) !== role) return;
    hasWhole = true;
    const date = maxDate(s);
    if (date > bestDate || (date === bestDate && pos > bestPos)) {
      best = { text: s, date, pos }; bestDate = date; bestPos = pos;
    }
  });
  if (hasWhole) return best;
  segs.forEach((s, pos) => {
    if (FIELD_HEAD.some((f) => s.startsWith(f))) return;
    actionSubsegs(s).forEach((sub, si) => {
      if (sub.role !== role) return;
      const date = maxDate(sub.text);
      const score = pos + si / 100;
      if (date > bestDate || (date === bestDate && score > bestPos)) {
        best = { text: sub.text, date, pos: score }; bestDate = date; bestPos = score;
      }
    });
  });
  return best;
}

// ---------------- SYS-59 评分字段（```priority 块 = WSJF/ITIL 字段化；独立于 status 块——set-status 只重排 status 固定键） ----------------

/** SYS-59 ITIL Impact×Urgency 3×3 → P0-P3（单源：取号闸立卡与 check-priority-score 共用） */
export const itilPriority = (impact, urgency) => {
  const s = impact + urgency;
  return s >= 6 ? "P0" : s === 5 ? "P1" : s >= 3 ? "P2" : "P3";
};

/** ```priority 块 kv 解析（卡片原文）；无块={} */
export function parsePriorityBlock(text) {
  const m = String(text).match(/```priority\n([\s\S]*?)```/);
  const out = {};
  if (m) for (const l of m[1].split("\n")) {
    const kv = l.match(/^([a-z_]+):\s?(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

// ---------------- 状态块/留痕块解析（CRLF 已归一） ----------------

/** ```status 块 kv 解析（cardLines=卡片行数组）。返回 {}（无块/空块）。 */
export function parseStatusBlockLines(cardLines) {
  const out = {};
  let inB = false;
  for (const l of cardLines) {
    const t = l.trim();
    if (t === "```status") { inB = true; continue; }
    if (inB && t === "```") break;
    if (inB) {
      const m = t.match(/^([a-z_]+):\s?(.*)$/);
      if (m) out[m[1]] = m[2].trim();
    }
  }
  return out;
}

/** ```status-history 块解析（P0-6）：逐条 {phase, at, head}；无块=空数组。 */
export function parseStatusHistoryLines(cardLines) {
  const out = [];
  let inB = false;
  for (const l of cardLines) {
    const t = l.trim();
    if (t === "```status-history") { inB = true; continue; }
    if (inB && t === "```") break;
    if (inB) {
      const m = t.match(/^-\s*phase:\s*([a-z_]+)\s*\|\s*at:\s*([0-9: \-TZ+]+?)\s*(?:\|\s*head:\s*([0-9a-f]{0,40}))?\s*$/i);
      if (m) out.push({ phase: m[1], at: m[2].trim(), head: m[3] || null });
    }
  }
  return out;
}

/** 卡片切分（UPG|SYS|W|S 前缀同权）：[{idx, no, title, end}] */
export function splitCards(libLines) {
  const cards = [];
  for (let i = 0; i < libLines.length; i++) {
    const m = libLines[i].match(CARD_HEAD_RE);
    if (m) cards.push({ idx: i, no: m[1], title: m[2].trim() });
  }
  for (let c = 0; c < cards.length; c++) {
    cards[c].end = c + 1 < cards.length ? cards[c + 1].idx : libLines.length;
  }
  return cards;
}

/** 状态文案区定位（**状态**： 起；下一卡/二级题/blockquote/分隔线/SEC 词止）。返回 {st, endline} 或 null */
export function statusRegion(libLines, idx, end) {
  let st = -1;
  for (let j = idx; j < end; j++) {
    if (libLines[j].includes("**状态**：")) { st = j; break; }
  }
  if (st === -1) return null;
  let endline = end;
  for (let j = st + 1; j < end; j++) {
    const l = libLines[j];
    if (/^# (?:UPG|SYS|W|S)-\d+/.test(l) || /^## /.test(l)) { endline = j; break; }
    if (l.startsWith(">") || l.startsWith("---")) { endline = j; break; }
    if (SEC_WORDS.some((w) => l.startsWith(w))) { endline = j; break; }
  }
  return { st, endline };
}

// ---------------- CanonicalCard ----------------

/**
 * parseCardStatus(cardNo, cardTitle, libLines, idx, end) → CanonicalCard
 * status 块权威优先；无块退文案启发式（phase=null 诚实降级）。
 */
export function parseCardStatus(cardNo, cardTitle, libLines, idx, end) {
  const cardLines = libLines.slice(idx, end);
  const rawT = cardLines.join("\n");
  const blk = parseStatusBlockLines(cardLines);
  const hist = parseStatusHistoryLines(cardLines);

  // 文案启发式（roles 对账列 + statusSummary + phase 回退）——**状态** 区
  const region = statusRegion(libLines, idx, end);
  const txt = region ? libLines.slice(region.st, region.endline).join("\n") : "";
  const segs = region ? segments(txt) : [];
  const roles = {};
  for (const [role, key] of [["designer", "D"], ["dev", "E"], ["inspector", "F"], ["merge", "G"]]) {
    const p = pick(segs, role);
    roles[key] = p ? { text: p.text, date: p.date, pos: p.pos } : null;
  }
  const stLine = region ? libLines[region.st].replace(/^\*\*状态\*\*[：:]\s*/, "").trim() : "";

  // status 块权威字段
  const phaseRaw = blk.phase || null;
  const phase = phaseRaw ? normalizeAlias(phaseRaw) : null;
  const head = blk.head || null;
  const branch = blk.branch || null;
  const designer = blk.designer || null;
  const dev = blk.dev || null;
  const inspector = blk.inspector || null;
  const merge = blk.merge || null;
  const dm = txt.match(DEL_RE);
  const deliveryId = blk.delivery_id || (dm ? dm[dm.length - 1] : null);
  const cm = rawT.match(/\*\*分类\*\*[：:]\s*([MP0-9A-Z]{1,3})/);
  const statusText = txt;

  return {
    id: cardNo,
    title: cardTitle,
    phase,
    stageLabel: phase ? labelOf(phase) : null,
    statusSummary: stLine,
    statusText,
    head,
    branch,
    designer,
    dev,
    inspector,
    merge,
    delivery_id: deliveryId,
    statusHistory: hist,
    raw: rawT,
    priority: extractPriority(rawT),
    cat: cm ? cm[1] : null,
    roles,
  };
}

/** parseLib(libPath) → { lines, cards }（CRLF 归一；全量卡 CanonicalCard 数组） */
export function parseLib(libPath) {
  const src = fs.readFileSync(libPath, "utf8").replace(/\r\n/g, "\n");
  const lines = src.split("\n");
  const cards = splitCards(lines).map((c) => parseCardStatus(c.no, c.title, lines, c.idx, c.end));
  return { lines, cards };
}
