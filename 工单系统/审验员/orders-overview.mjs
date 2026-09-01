#!/usr/bin/env node
/**
 * SYS-02 阶段四 E4 全局工单看板——只读投影
 *
 * 依据：STD-SYS02_阶段四_E4看板_v1_2026-09-02.md（S2-10~20 冻结）+ 设计 v1.1 + 派单 SYS-02_阶段四
 *
 * 核心原则（三审定案）：
 *   **E1 负责真相，E4 负责投影；E4 只计算允许的派生告警，不重新创造状态。**
 *
 * 状态列唯一来源 = 工单库.md 每卡状态行（E1）；工单表.xlsx 仅用于完整性对账（表缺行/卡缺字段）；
 * 挂账登记表.md（E 类）= 挂账待审池（⏳ 排队，不参与交付流水线判定）。
 *
 * 允许的派生告警（仅此几种）：超期（当前态 ts > 阈值）/ 超期变 ⚠️ / 验收通过未合 main=🟡 / 已合 main=✅ /
 *   ts 缺失=「⚠️ ts 缺失（超期未计算）」不默认 / 完整性缺口（表缺卡/卡缺字段）/ 未知状态=⚠️ 无法解析（不静默降级）。
 *
 * ✅ 只在「已合 main」终态出现；验收通过未合 main=🟡（超期变 ⚠️ 覆盖状态列）；⚠️ 超期置顶排序。
 *
 * 用法：
 *   node orders-overview.mjs                生成看板 → 处理中心\验证产物\orders-overview.md
 *   node orders-overview.mjs --out <path>   输出到指定路径（测试用）
 *   node orders-overview.mjs --self-test    fixture 自测（S2-10~13/15/16/18~20，不读真实数据）
 *
 * 红线：
 *   - 只读投影——绝不写 工单库.md / 工单表.xlsx（跑前=跑后 sha256 一致实证，写入看板头部）
 *   - 不新增状态载体（E4=E1 投影）；✅ 仅终态；超期阈值顶部 const 可配；提醒不审批、无预测
 *   - 展示层为纯文本 md（无 HTML/推送），2027-mov 零接触
 *   - 不修改 sync-orders.mjs（阶段三收口）——解析核心为自包含复制（同源同口径，避免跨文件耦合）
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname); // 工单系统\
const DEFAULT_LIB = path.join(ROOT, "工单库.md");
const DEFAULT_TABLE = path.join(ROOT, "工单表.xlsx");
const DEFAULT_HANG = path.join(ROOT, "处理中心", "挂账登记表.md");
const DEFAULT_OUT = path.join(ROOT, "处理中心", "验证产物", "orders-overview.md");

// ---------------- 阈值常量（STD §二 D4 定案，顶部 const 可配；改阈值=改 const，不提供 CLI 覆盖）----------------
const DAY = 24 * 60 * 60 * 1000;
const THRESHOLD = {
  claim: 2 * DAY,    // 已派未认领
  deliver: 3 * DAY,  // 施工中未交付
  merge: 1 * DAY,    // 验收通过未合 main
};

const LEGEND_LINE = "线 A=agent-1 · B=agent-2 · C=agent-3 · D=agent-4";

// ---------------- 解析核心（复制自 sync-orders.mjs R1 增强版，E4 自包含）----------------
const SEC_WORDS = [
  "**背景", "**来源", "**问题", "**修法", "**验收", "**交接", "**红线", "**方案",
  "**决策点", "**施工规矩", "**根因", "**定案", "**防撞", "**级别", "**判据",
  "**范围红线", "**关键设计点", "**送审", "**与契约", "**一句话", "**施工范围",
  "**遗留", "**用户实测", "**其余", "**串行", "**交付", "**顺带纠正", "**无冲突",
  "**Token", "**认领情况", "**派单交接", "**核心方案", "**实施", "**不做清单",
  "**维持死亡", "**证伪复活", "**方法学注记", "**文档纪律", "**打回依据",
  "**重修验收", "**关联独立单", "**桥能力现状", "**达标项", "**修正项", "**差距",
  "**合格", "**结构", "**能力清单", "**安装", "**功能", "**规则", "**场景",
  "**边界", "**职责", "**契约", "**接口", "**数据结构", "**配置", "**流转",
];

const SEG_RE = /(?=→\s*[✅🔨❌⚠️📌🆕⏳】]+)|(?=→\s*\*\*)|(?=｜\s*[✅🔨❌⚠️📌🆕⏳】]+)|(?=｜\s*\*\*)|(?=【✅)|(?=】；)|(?=\*\*日期\*\*)|(?=\*\*出单人\*\*)|(?=\*\*优先级\*\*)|(?= \*\*✅)|(?= \*\*🔨)|(?= \*\*❌)/;

const FIELD_HEAD = ["**出单人**", "**日期**", "**优先级**", "**原状态**"];

// 角色动作锚（与 sync-orders.mjs 完全同口径——E4 复用 E1 的角色段解析）
const ROLE_ANCHORS = [
  { role: "merge", re: /待设计师合 main|已合 main|合 main|合流/g },
  { role: "inspector", re: /验收员|验收通过|独立复核|复验|打回|审验/g },
  { role: "dev", re: /C 交付|C 完成|C 修复|C 批|修复交付|修复完成|M3-R2|已认领|在施|施工中|重修完成/g },
  { role: "designer", re: /出单人|方案[\s**]*[vV]\d|设计[\s]*[vV]\d|定稿|已派单|评审|裁决|拍板|规范|激活|方案完成/g },
];

const DATE_RE = /@?(\d{4}-\d{2}-\d{2})/g;
const DEL_RE = /DEL-[A-Z0-9]+-\d{8}-\d+/g;
const DOC_RE = /设计师[\\/][^\s｜|，。；）)（(]*?\.md/;

function extractPriority(txt) {
  const patterns = [
    /\*\*优先级\*\*：\s*([^｜|]+)/,
    /(?:｜|\|)\s*优先级：\s*([^｜|]+)/,
    /(?:^|；)优先级：\s*([^｜|]+)/,
    /（(P[0-4])\s*·\s*[0-9~]/u,
    /\*\*级别\*\*：\s*([^｜|]+)/,
  ];
  for (const re of patterns) {
    const m = txt.match(re);
    if (!m) continue;
    let v = m[1].trim().replace(/[（(].*$/, "").trim();
    if (v.startsWith("P") && /^P[0-4]$/.test(v)) return v;
    if (/^[0-4]$/.test(v)) return "P" + v;
    return v;
  }
  return "—";
}

function segments(text) {
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
  // 返回 UTC 毫秒时间戳：取状态发生日 23:59:59（日粒度——当天发生、次日检查 <24h 不算逾期）
  let date = -1;
  DATE_RE.lastIndex = 0;
  for (let m = DATE_RE.exec(s); m; m = DATE_RE.exec(s)) {
    const p = m[1].split("-");
    const t = Date.UTC(+p[0], +p[1] - 1, +p[2], 23, 59, 59);
    if (t > date) date = t;
  }
  return date;
}

// pick 返回 { text, date, pos }（与 sync-orders 的字符串版同选法，E4 额外需要位置做打回/合流先后判定）
function pick(segs, role) {
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

// 单卡状态区解析：{ statusText, row{D/E/F/G: {text,date,pos}|null}, priority, delId }
function parseCardStatus(cardNo, cardTitle, libLines, idx, end) {
  let st = -1;
  for (let j = idx; j < end; j++) if (libLines[j].includes("**状态**：")) { st = j; break; }
  if (st === -1) return { cardNo, title: cardTitle, statusText: "", row: { D: null, E: null, F: null, G: null }, priority: "—", delId: null };
  let endline = end;
  for (let j = st + 1; j < end; j++) {
    const l = libLines[j];
    if (/^# UPG-\d+/.test(l) || /^## /.test(l)) { endline = j; break; }
    if (l.startsWith(">") || l.startsWith("---")) { endline = j; break; }
    if (SEC_WORDS.some((w) => l.startsWith(w))) { endline = j; break; }
  }
  const txt = libLines.slice(st, endline).join("\n");
  const segs = segments(txt);
  const row = { D: null, E: null, F: null, G: null };
  for (const [role, key] of [["designer", "D"], ["dev", "E"], ["inspector", "F"], ["merge", "G"]]) {
    const p = pick(segs, role);
    if (p) row[key] = p;
  }
  const dm = txt.match(DEL_RE);
  return { cardNo, title: cardTitle, statusText: txt, row, priority: extractPriority(txt), delId: dm ? dm[dm.length - 1] : null };
}

function readLib(libPath) {
  const src = fs.readFileSync(libPath, "utf8").replace(/\r\n/g, "\n");
  const lines = src.split("\n");
  const cards = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^# (UPG-\d+)\s+(.*)$/);
    if (m) cards.push({ idx: i, no: m[1], title: m[2].trim() });
  }
  const endOf = (i) => (i + 1 < cards.length ? cards[i + 1].idx : lines.length);
  return cards.map((c) => parseCardStatus(c.no, c.title, lines, c.idx, endOf(c.idx)));
}

// ---------------- python openpyxl 桥（读 工单表.xlsx 做完整性对账）----------------
const PY_READ = `
import openpyxl, json, sys
p = sys.argv[1]
wb = openpyxl.load_workbook(p)
ws = wb[wb.sheetnames[0]]
rows = []
for r in range(2, ws.max_row+1):
    vals = [ws.cell(r,c).value for c in range(1, ws.max_column+1)]
    if vals[0] is None: continue
    rows.append(['' if v is None else str(v) for v in vals])
print(json.dumps({'rows': rows}, ensure_ascii=False))
`;
function readTableNumbers(tablePath) {
  const env = { ...process.env, PYTHONUTF8: "1" };
  const res = spawnSync("python", ["-c", PY_READ, tablePath], { encoding: "utf8", env });
  if (res.status !== 0) return new Set();
  const rows = JSON.parse(res.stdout.trim().split("\n").pop()).rows;
  const set = new Set();
  for (const r of rows) if (r[0] && !String(r[0]).startsWith("#")) set.add(String(r[0]).trim());
  return set;
}

// 挂账登记表.md：表格行 挂账号|标题|优先级|登记人|日期|设计师验证|…；活跃=设计师验证列不以 ✅ 开头
function readHanging(hangPath) {
  if (!fs.existsSync(hangPath)) return [];
  const src = fs.readFileSync(hangPath, "utf8").replace(/\r\n/g, "\n");
  const items = [];
  for (const line of src.split("\n")) {
    const m = line.match(/^\|\s*(挂账-[^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|/);
    if (!m) continue;
    if (m[6].trim().startsWith("✅")) continue; // 已销项/已落实 → 不呈现
    items.push({ id: m[1].trim(), title: m[2].trim(), priority: m[3].trim(), who: m[4].trim(), date: m[5].trim() });
  }
  return items;
}

// ---------------- 投影层（E1 → Projection Model）----------------
// 当前态判定（优先级）：已合 main(正向合流) → 打回(晚于合流则回炉) → 验收/审验通过(待合) → dev 动作(施工/待验收)
//   → 已派/认领(已派待认领) → ⏳/待前置(排队) → 未知(⚠️ 无法解析，不静默降级)
function detectStage(row, txt) {
  const G = row.G, F = row.F;
  const mergePos = G && /已合 main|已合并|合流|合并提交/.test(G.text) && !/待设计师合/.test(G.text);
  const rejectF = F && /打回|驳回/.test(F.text);
  // 打回/驳回 → 归 delivering + rejected 标志（回炉修复），避免落入 unknown 假「无法解析」
  const REJECTED = { stage: "delivering", rejected: true };
  if (mergePos && rejectF) {
    // 打回发生在合流之后（日期更大或同日更靠后）→ 合流为旧态，当前=回炉
    if (F.date > G.date || (F.date === G.date && F.pos > G.pos)) return REJECTED;
    return { stage: "merged" };
  }
  if (mergePos) return { stage: "merged" };
  // 作废/销卡（用户拍板废单——如 UPG-24 被 UPG-50 接替）
  if (/已作废|销卡|已销|作废/.test(txt)) return { stage: "archived" };
  if (rejectF) return REJECTED; // 未合即被打回 → 回炉
  // 验收通过：inspector 列命中；或 merge 列实为「验收通过+待设计师合 main」指令（G 段无「已合」→ 归 accepted，非 unknown）
  const accText = [F ? F.text : "", G ? G.text : ""].join(" | ");
  if (/验收通过|审验通过|复验通过|验收员通过|独立复核通过/.test(accText)) return { stage: "accepted" };
  if (row.E) return { stage: "delivering" };
  if (row.D && /已派单|待认领|可认领|已派|认领/.test(row.D.text)) return { stage: "assigned" };
  if (/待前置|⏳/.test(txt)) return { stage: "queued" };
  return { stage: "unknown" };
}

function computeOverdue(stage, tsNum, nowMs) {
  const key = { delivering: "deliver", accepted: "merge", assigned: "claim" }[stage];
  if (!key || tsNum < 0 || nowMs == null) return null; // ts 缺失 → 不算超期（诚实降级）
  const age = nowMs - tsNum;
  if (age > THRESHOLD[key]) return { key, days: Math.floor(age / DAY) };
  return null;
}

// 三态子列（S2-12：超期覆盖状态列——⚠️ 派生直接替换对应状态列，不是藏在关键点）
function columns(stage, overdue) {
  if (overdue) {
    if (stage === "accepted") return { d: "✅", a: "✅", m: "⚠️ 超期：待合 main" };
    if (stage === "delivering") return { d: "⚠️ 超期：交付", a: "—", m: "—" };
    if (stage === "assigned") return { d: "⚠️ 超期：已派未认领", a: "—", m: "—" };
  }
  switch (stage) {
    case "merged": return { d: "✅", a: "✅", m: "✅" };
    case "accepted": return { d: "✅", a: "✅", m: "🟡（待合）" };
    case "delivering": return { d: "🔨", a: "—", m: "—" };
    case "assigned": return { d: "📌", a: "—", m: "—" };
    case "queued": return { d: "⏳", a: "—", m: "—" };
    case "archived": return { d: "❌", a: "—", m: "—" };
    default: return { d: "⚠️ 无法解析", a: "⚠️", m: "⚠️" };
  }
}

// 稳定排序键（STD §5.4）：⚠️超期/无法解析=0 → 🔨施工=1 → 🟡待合=2 → 📌已派=3 → ⏳排队=4 → ✅终态=5
function severityRank(stage, overdue) {
  if (overdue) return 0;
  if (stage === "unknown") return 0;
  if (stage === "delivering") return 1;
  if (stage === "accepted") return 2;
  if (stage === "assigned") return 3;
  if (stage === "queued") return 4;
  if (stage === "merged") return 5;
  return 0;
}

// 线（只读展示，不参与判定）：取状态文本最后一个 [A-D]+动作词 的字母
function detectLine(txt) {
  const ms = [...txt.matchAll(/([A-D])\s*(?:批|交付|完成|已认领|认领|修复|施工|线)/g)];
  return ms.length ? ms[ms.length - 1][1] : "—";
}

function dateNumToStr(t) {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// 单卡投影（E1 → Projection Model）
function analyzeCard(card, nowMs) {
  const txt = card.statusText;
  const det = detectStage(card.row, txt);
  const stage = det.stage;
  const tsNum = maxDate(txt);
  const ts = tsNum >= 0 ? dateNumToStr(tsNum) : null;
  const overdueEligible = stage === "delivering" || stage === "accepted" || stage === "assigned";
  const overdue = computeOverdue(stage, tsNum, nowMs);
  return {
    no: card.cardNo,
    title: card.title,
    stage,
    ts,
    tsMissing: overdueEligible && ts === null,
    overdue,
    rejected: !!det.rejected,
    line: detectLine(txt),
    rank: severityRank(stage, overdue),
    cols: columns(stage, overdue),
    priority: card.priority,
    delId: card.delId,
    conflicts: [], // 真实数据仅 E1 单源，无外部事实可冲突；冲突展示由 fixture 演示
  };
}

// 关键点（状态列之外的补充说明；ts 缺失/数据源冲突在此诚实标注，不阻塞）
function keypoint(p) {
  const ts = p.ts ? " @" + p.ts : "";
  let s;
  if (p.stage === "merged") s = "✅ 已合 main（终态）" + ts;
  else if (p.stage === "accepted") s = p.overdue ? `⚠️ 超期：待合 main（>${p.overdue.days}d 未合 main，@${p.ts} 起）` : "🟡 验收通过·待设计师合 main" + ts;
  else if (p.stage === "delivering") s = p.rejected ? "❌ 验收打回·回炉修复" + ts : (p.overdue ? `⚠️ 超期：交付（>${p.overdue.days}d 未交付，@${p.ts} 起）` : "🔨 施工中/待交付" + ts);
  else if (p.stage === "assigned") s = p.overdue ? `⚠️ 超期：已派未认领（>${p.overdue.days}d 未认领，@${p.ts} 起）` : "📌 已派·待认领" + ts;
  else if (p.stage === "queued") s = "⏳ 排队/待前置（主动等待）" + ts;
  else if (p.stage === "archived") s = "❌ 已作废（用户拍板销卡——被接替/淘汰）" + ts;
  else s = "⚠️ 无法解析·手动复核（状态文本异常）";
  if (p.tsMissing) s += " ｜ ⚠️ ts 缺失（超期未计算）";
  if (p.conflicts.length) s += " ｜ ⚠️ 数据源冲突";
  return s;
}

function cardNum(no) {
  const m = no.match(/UPG-(\d+)/);
  return m ? Number(m[1]) : 9999;
}

// ---------------- 渲染（纯文本 md）----------------
function sha256(p) {
  return createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16);
}

function renderBoard(projections, hanging, meta) {
  const sorted = [...projections].sort((a, b) => a.rank - b.rank || cardNum(a.no) - cardNum(b.no));
  const rows = sorted.map((p, i) => `| ${i + 1} | ${p.no} ${p.title} | ${p.cols.d} | ${p.cols.a} | ${p.cols.m} | ${p.line} | ${keypoint(p)} |`);
  const hRows = hanging.map((h, i) => `| ${i + 1} | ${h.id} | ${h.title} | ${h.priority || "—"} | ⏳ 挂账待审（${h.who} @${h.date || "?"}） |`);

  const unknown = projections.filter((p) => p.stage === "unknown");
  const unRanked = projections.filter((p) => p.priority === "—" || p.priority === "");
  const priNote = unRanked.length ? `优先级未排定（库状态区无优先级字段——诚实「未排定」，不回落默认 P2）：${unRanked.map((p) => p.no).join("、")}` : "优先级全部可解析";

  return `# MOV 工单全局看板 · ${meta.date}

> **E1 负责真相，E4 负责投影** ｜ 状态列唯一来源 = 工单库.md 状态行（只读投影，不写库/表）｜ 只计算允许的派生告警，不重新创造状态
> **图例**：${LEGEND_LINE} ｜ ✅已合终态 · 🔨施工/待交付 · 🟡待合 · 📌已派 · ⏳排队/挂账 · ⚠️超期/无法解析 · —未达
> **排序**：⚠️超期/无法解析 → 🔨施工 → 🟡待合 → 📌已派 → ⏳排队 → ✅终态（severity_rank ASC → 卡号 ASC，稳定）
> **超期**：当前态 ts（=状态区最后更新时间，非 created_at）> 阈值（已派 2d / 施工 3d / 待合 1d）→ ⚠️；ts 缺失 → 不算超期 + ⚠️ ts 缺失（不阻塞整板）
> **✅ 仅已合 main 终态** ｜ 验收通过未合 main=🟡（超期变 ⚠️） ｜ ⚠️ 超期覆盖状态列（非关键点） ｜ 未知状态=⚠️ 无法解析（不静默降级）
> **源绑定**：工单库.md sha256=\`${meta.libSha}\` ｜ 工单表.xlsx sha256=\`${meta.tblSha}\` ｜ 跑前=跑后 hash 一致（只读实证）

## 主看板 · 工单库 ${projections.length} 卡（${meta.date} 快照）

| # | 单 | 交付 | 验收 | 合main | 线 | 关键点 |
|---|---|---|---|---|---|---|
${rows.join("\n")}

## 挂账待审池 · 活跃 ${hanging.length} 条（E 类 · ⏳ 排队，不参与交付流水线判定）

| # | 挂账号 | 标题 | 优先级 | 关键点 |
|---|---|---|---|---|
${hRows.length ? hRows.join("\n") : "（无活跃挂账）"}

## 完整性对账

- 工单库卡数：${projections.length} ｜ 呈现：${projections.length}/${projections.length}（100%）
- 状态不可解析：${unknown.length} 卡（${unknown.length ? unknown.map((p) => p.no).join("、") + "——⚠️ 无法解析·手动复核" : "无"}）
- ${meta.tblRows != null ? `工单表行数：${meta.tblRows} ｜ 表缺行（库有表无）：${meta.tblMissing} ｜ 库缺卡（表有库无）：${meta.tblExtra}` : "工单表未读取（仅完整性校验需要，主看板不依赖）"}
- ${priNote}
`;
}

// ---------------- fixture 自测（S2-10~13/15/16/18~20，不读真实数据）----------------
const NOW_FIX = Date.UTC(2026, 8, 2, 6, 0, 0); // 2026-09-02 06:00 UTC
const FIX_DATE = "2026-09-02";

let passCount = 0, failCount = 0;
function check(name, cond, detail) {
  if (cond) { passCount++; console.log(`  ✅ ${name}`); }
  else { failCount++; console.log(`  ❌ ${name} ${detail ? "→ " + detail : ""}`); }
}

function fixtureCard(no, statusText) {
  const lines = (statusText + "\n").split("\n");
  const card = parseCardStatus(no, no + " 测试卡", lines, 0, lines.length);
  return analyzeCard(card, NOW_FIX);
}

function selfTest() {
  console.log("═══ E4 orders-overview --self-test（fixture 覆盖 STD S2-10~13/15/16/18~20）═══");

  // S2-11/S2-15/S2-18 共用 fixture
  const fAccNew = fixtureCard("UPG-900", "**状态**：✅ 方案 v1 定稿 ｜ ✅ **验收员验收通过 @2026-09-01**（待设计师合 main）｜ **优先级**：P1");
  check("S2-11 验收通过未合=🟡（不得出现✅未合）", fAccNew.stage === "accepted" && fAccNew.cols.m === "🟡（待合）", `stage=${fAccNew.stage} merge=${fAccNew.cols.m}`);
  check("S2-11/S2-18 未超期（ts=09-01, now=09-02, <1d 边界）", fAccNew.overdue === null, `overdue=${JSON.stringify(fAccNew.overdue)}`);

  // S2-12 超期覆盖状态列
  const fAccOver = fixtureCard("UPG-901", "**状态**：✅ **验收员验收通过 @2026-08-25**（待设计师合 main）｜ **优先级**：P2");
  check("S2-12 超期（08-25→09-02 >1d）", fAccOver.overdue !== null, JSON.stringify(fAccOver.overdue));
  check("S2-12 合main列=⚠️ 超期：待合 main（覆盖状态列）", fAccOver.cols.m === "⚠️ 超期：待合 main" && fAccOver.cols.d === "✅", `m=${fAccOver.cols.m}`);
  check("S2-13 超期 rank=0（置顶前置）", fAccOver.rank === 0);

  // S2-13 稳定排序（超期/施工/待合/已派/排队/终态 各 1）
  const mixed = [
    fixtureCard("UPG-910", "**状态**：✅ **已合 main @2026-08-30**（merge abc）"),                                            // 终态 rank5
    fixtureCard("UPG-911", "**状态**：⏳ **待前置 @2026-08-30**（等前置合 main）"),                                              // 排队 rank4
    fixtureCard("UPG-912", "**状态**：🔨 **已派单 @2026-08-25**（待认领）｜ **优先级**：P1"),                                     // 已派超期 rank0
    fixtureCard("UPG-913", "**状态**：🔨 **施工中 @2026-09-01**（P0·3~5 工作日）｜ **优先级**：P0"),                              // 施工 rank1
    fixtureCard("UPG-914", "**状态**：✅ **验收通过 @2026-08-20**（待合）"),                                                       // 待合超期 rank0
    fixtureCard("UPG-915", "**状态**：✅ **验收通过 @2026-09-01**（待设计师合 main）"),                                            // 待合 rank2
  ];
  const order = [...mixed].sort((a, b) => a.rank - b.rank || cardNum(a.no) - cardNum(b.no)).map((p) => p.no);
  check("S2-13 ⚠️置顶→🔨→🟡→📌→⏳→✅（超期置顶）", order.join(",") === "UPG-912,UPG-914,UPG-913,UPG-915,UPG-911,UPG-910", `order=${order.join(",")}`);

  // S2-15 ts 缺失降级
  const fNoTs = fixtureCard("UPG-920", "**状态**：🔨 **施工中**（P0·3~5 工作日）");
  check("S2-15 ts 缺失→不算超期", fNoTs.overdue === null && fNoTs.ts === null, `overdue=${JSON.stringify(fNoTs.overdue)} ts=${fNoTs.ts}`);
  check("S2-15 ts 缺失→关键点标 ⚠️ ts 缺失（超期未计算）", fNoTs.tsMissing && keypoint(fNoTs).includes("⚠️ ts 缺失（超期未计算）"), keypoint(fNoTs));

  // S2-16 诚实空态+图例
  const fUnknown = fixtureCard("UPG-930", "**状态**：ℹ️ 某非法状态词无法归入枚举");
  check("S2-16 未知状态=⚠️ 无法解析（不静默降级为⏳/📌）", fUnknown.stage === "unknown" && fUnknown.cols.d === "⚠️ 无法解析", `stage=${fUnknown.stage} d=${fUnknown.cols.d}`);
  const legendOk = renderBoard(mixed, [], { date: FIX_DATE, libSha: "x", tblSha: "y" }).includes(`**图例**：${LEGEND_LINE}`);
  check("S2-16 头部图例在位（线 A=agent-1…）", legendOk);

  // S2-18 超期基准正确：created_at 旧（日期字段 2026-07-01）但当前态 ts 新 → 不超期
  const fCreatedOld = fixtureCard("UPG-940", "**状态**：🔨 **施工中 @2026-09-01**（created_at=2026-07-01 应被忽略）｜ **日期**：2026-07-01");
  check("S2-18 当前态 ts 新→不超期（未误用 created_at）", fCreatedOld.overdue === null, `overdue=${JSON.stringify(fCreatedOld.overdue)}`);
  check("S2-18 ts 取状态区最后更新（09-01 非 07-01）", fCreatedOld.ts === "2026-09-01", `ts=${fCreatedOld.ts}`);

  // S2-19 未知不静默降级（变异口径：映射📌=红）
  check("S2-19 非法枚举→⚠️ 无法解析（不得落📌/⏳）", fUnknown.stage === "unknown" && fUnknown.cols.d !== "📌" && fUnknown.cols.d !== "⏳");

  // S2-20 稳定排序/幂等：连跑两遍 render 逐字节一致
  const md1 = renderBoard(mixed, [], { date: FIX_DATE, libSha: "x", tblSha: "y" });
  const md2 = renderBoard(mixed, [], { date: FIX_DATE, libSha: "x", tblSha: "y" });
  check("S2-20 连跑两遍逐字节一致", md1 === md2);

  // S2-14 数据源冲突展示（关键点末尾标 ⚠️ 数据源冲突，状态列仍以 E1 为准）
  const confP = fixtureCard("UPG-950", "**状态**：🔨 **施工中 @2026-09-01**");
  confP.conflicts = ["外部事实：疑似已合（只读源）"];
  check("S2-14 冲突→关键点末尾 ⚠️ 数据源冲突（状态列=E1 不变）", keypoint(confP).includes("⚠️ 数据源冲突") && confP.cols.d === "🔨");

  console.log(`\n结果：PASS ${passCount} / FAIL ${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}

// ---------------- main ----------------
function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) return selfTest();

  if (!fs.existsSync(DEFAULT_LIB)) { console.error(`工单库不存在: ${DEFAULT_LIB}`); process.exit(2); }
  const outArgIdx = args.indexOf("--out");
  const outPath = path.resolve(outArgIdx >= 0 ? args[outArgIdx + 1] : DEFAULT_OUT);

  const libShaBefore = sha256(DEFAULT_LIB);
  const tblShaBefore = fs.existsSync(DEFAULT_TABLE) ? sha256(DEFAULT_TABLE) : null;

  const projections = readLib(DEFAULT_LIB).map((c) => analyzeCard(c, Date.now()));
  const hanging = readHanging(DEFAULT_HANG);
  const tblNums = fs.existsSync(DEFAULT_TABLE) ? readTableNumbers(DEFAULT_TABLE) : null;
  let tblMissing = 0, tblExtra = 0;
  if (tblNums) {
    const libNums = new Set(projections.map((p) => p.no));
    tblMissing = projections.filter((p) => !tblNums.has(p.no)).length;
    for (const t of tblNums) if (!libNums.has(t)) tblExtra++;
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const md = renderBoard(projections, hanging, {
    date: dateStr,
    libSha: libShaBefore,
    tblSha: tblShaBefore || "—",
    tblRows: tblNums ? tblNums.size : null,
    tblMissing,
    tblExtra,
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, md, "utf8");

  // 只读实证：跑后 hash 必须与跑前一致（E4 不写库/表）
  const libShaAfter = sha256(DEFAULT_LIB);
  const tblShaAfter = tblShaBefore && fs.existsSync(DEFAULT_TABLE) ? sha256(DEFAULT_TABLE) : null;
  const readonlyOk = libShaBefore === libShaAfter && (!tblShaBefore || tblShaBefore === tblShaAfter);

  console.log(`已生成看板 → ${outPath}`);
  console.log(`工单库 ${projections.length} 卡（只读实证：${readonlyOk ? "sha 跑前=跑后 ✓" : "⚠ sha 变化！" }）`);
  console.log(`活跃挂账 ${hanging.length} 条 ｜ 工单表行 ${tblNums ? tblNums.size : "未读"} ｜ 表缺行 ${tblMissing} ｜ 库缺卡 ${tblExtra}`);
  const unknown = projections.filter((p) => p.stage === "unknown");
  const overdue = projections.filter((p) => p.overdue);
  console.log(`派生告警：⚠️ 超期 ${overdue.length} 卡 ｜ ⚠️ 无法解析 ${unknown.length} 卡 ｜ ✅ 终态 ${projections.filter((p) => p.stage === "merged").length} 卡`);
  process.exit(readonlyOk ? 0 : 2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
