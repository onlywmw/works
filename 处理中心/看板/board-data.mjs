#!/usr/bin/env node
// -*- coding: utf-8 -*-
// board-data.mjs — MOV Flow Journey · 数据聚合器（看板唯一取数口）
//
// 看板红线：零写入、纯投影——所有数据可从真相源重算，所有操作走引擎命令。
// 真相源：单/（工单态）· seats/（工位灯）· 邮局/（信件）· 工单库（权威账本）· 问题区 · 机器闸
//
// 回环制（2026-09-09）：设计→施工→验收→审验→设计师合并位——旅程线闭回
// 用法：node board-data.mjs [--fast]      # fast=跳过 layout-check 子进程（60s缓存）
//       import { collect } from "./board-data.mjs"
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseEnvelope } from "./lib/envelope.mjs"; // 信封读路径单一通道（2026-09-10 审查⑥）

const HERE = path.dirname(fileURLToPath(import.meta.url));      // 看板/
const CENTER = path.join(HERE, "..");                            // 处理中心/
const WORKS = path.join(CENTER, "..");                           // 安卓中国体系建设/
const DIR = path.join(HERE, "单");

const TRACK_NODES = ["设计师", "程序员", "验收员", "审验员"];          // 状态轨道四节点（合并=回设计师，轨道闭回）
const STATIONS = [
  { key: "designer", role: "设计师", icon: "🎨", name: "设计工位" },
  { key: "coder", role: "程序员", icon: "🔨", name: "施工工位" },
  { key: "qa", role: "验收员", icon: "🧪", name: "验收工位" },
  { key: "reviewer", role: "审验员", icon: "🔍", name: "审验工位" },
];
const GATE_STAGES = ["设计师"];                                    // 人闸工位（仅方案批；合并位不是闸）
const POST_ROLES = ["设计师", "程序员", "验收员", "审验员", "巡检台", "流水线"];

const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return null; } };
const listIds = () => fs.existsSync(DIR)
  ? fs.readdirSync(DIR).filter(f => fs.existsSync(path.join(DIR, f, "单.json"))) : [];



// ── 信件层 ───────────────────────────────────────────────
// 在途 = 角色 INBOX 里 status:未读 的信（引擎派工/跨角色流转）
// 未消费 = 流水线 INBOX 里的工序完工信（引擎还没收账校验）
function readMail() {
  const inflight = [], unconsumed = [];
  const boxRoot = path.join(CENTER, "邮局", "邮箱");
  for (const role of POST_ROLES) {
    const inbox = path.join(boxRoot, role, "INBOX");
    let files = []; try { files = fs.readdirSync(inbox).filter(f => f.endsWith(".md")).sort(); } catch { continue; }
    for (const f of files) {
      let env = {}; try {
        env = parseEnvelope(fs.readFileSync(path.join(inbox, f), "utf-8")); // 读路径归一（审查⑥）
      } catch { continue; }
      const lt = { id: env.id || f.replace(/\.md$/, ""), from: env.from || "?", to: env.to || role, type: env.type || "", re: env.re || "", created: env.created || "" };
      if (lt.to === "流水线") unconsumed.push(lt); else inflight.push(lt);
    }
  }
  const all = [...inflight, ...unconsumed].sort((a, b) => b.created.localeCompare(a.created));
  return { inflight, unconsumed, latest: all[0] || null };
}

// ── 工位层 ───────────────────────────────────────────────
function readSeats() {
  const seats = {};
  for (const st of [...STATIONS, { key: "hygiene", role: "巡检台" }]) {
    const j = readJson(path.join(HERE, "seats", `${st.key}.json`)) || {};
    // 灯=agent 进程活着：agentPid 验活（process.kill(pid,0) 探测）——窗口在而 agent 死=假灯，按熄灭处理
    let alive = null;
    if (j.agentPid) { try { process.kill(j.agentPid, 0); alive = true; } catch { alive = false; } }
    seats[st.role] = { key: st.key, on: j.on === true && alive !== false, agent: j.agent || "", at: j.at || "", alive };
  }
  return seats;
}

// ── 卡片层（主角单：标记 / 标题 / 动作+时长 / 注意力） ──
const parseLocal = (s) => { try { return new Date(String(s).replace(" ", "T")); } catch { return null; } };
const elapsedStr = (min) => min == null ? "" : min < 60 ? `${Math.max(0, Math.round(min))}m`
  : min < 1440 ? `${Math.floor(min / 60)}h${String(Math.round(min % 60)).padStart(2, "0")}` : `${Math.floor(min / 1440)}d${Math.floor((min % 1440) / 60)}h`;

function buildCard(t, mail, now) {
  const station = t.stage === "完成" ? "完成" : t.stage;
  const isMerge = t.stage === "设计师" && t.merge;
  const reasons = [];
  let mark = "⏳", action = "待派工";
  if (t.stage === "完成") { mark = "🎉"; action = "已完成"; }
  else if (t.flag) { mark = "🚩"; action = "红牌·等人处置"; }
  else if (isMerge) { mark = "🚀"; action = "合并位·等设计师完工信"; }
  else if (station === "设计师") { mark = "🚦"; action = "等你批方案"; }
  else if (t.awaiting === t.stage) {
    mark = "🔨"; action = "工序施工中·等完工信";
    if (t.seat_suspect_since) {
      mark = "🟡";
      const leftMin = 10 - (now - t.seat_suspect_since) / 60000;
      action = `座席宽限 ${leftMin > 0 ? elapsedStr(leftMin) : "到期·待引擎接管"}`;
    }
  }
  const since = t.awaiting_since || (t.history?.length ? t.history[t.history.length - 1].at : t.created) || t.created;
  const d = parseLocal(since) || parseLocal(t.created);
  const elapsedMin = d ? (now - d) / 60000 : null;
  const idx = TRACK_NODES.indexOf(station);
  const track = t.stage === "完成" ? "✓✓✓✓" : isMerge ? "✓✓✓✓⟳" : "✓".repeat(idx) + "●" + "○".repeat(TRACK_NODES.length - 1 - idx);
  const hasUnconsumed = mail.unconsumed.some(l => (l.re || "").includes(t.id));
  const hasInflight = mail.inflight.some(l => (l.re || "").includes(t.id));
  const letter = hasUnconsumed ? "📮!" : hasInflight ? "📮" : "";
  let P;
  if (t.flag) { P = "P0"; reasons.push("校验红牌"); }
  else if (hasUnconsumed) { P = "P1"; reasons.push("完工信未消费"); }
  else if (!isMerge && station === "设计师") { P = "P1"; reasons.push("人闸等你拍板"); }
  else if (t.seat_suspect_since) { P = "P2"; reasons.push("座席SUSPECT"); }
  else if (t.awaiting === t.stage && elapsedMin != null && elapsedMin > 120) { P = "P2"; reasons.push("等超2h"); }
  else if ((t.rework || 0) >= 2) { P = "P2"; reasons.push(`回炉${t.rework}次`); }
  else if (t.stage === "完成") { P = "P4"; reasons.push("完成"); }
  else { P = "P3"; reasons.push(isMerge ? "合并位" : "流转中"); }
  return { id: t.id, title: t.title || "", station, merge: !!isMerge, mark, action, elapsedMin, elapsed: elapsedStr(elapsedMin),
    track, rework: t.rework || 0, flag: t.flag || "", letter, attention: P, reasons, ticket: t.ticket !== false,
    sinceMs: d ? d.getTime() : null, sinceLocal: since,
    hist: (t.history || []).slice(-3).map(x => `${String(x.at || "").slice(11, 19)} ${x.stage}·${x.verdict}`) };
}

// ── 工单库表（唯一权威账本 · 上半=派单未完成，下半=最新完成×3；列=工单/标题/设计/程序员/验收/审验/合main） ──
const ACTIVE_PHASES = new Set(["dispatched", "claimed", "in_progress", "delivered", "accepted", "audited"]);
const DONE_PHASES = new Set(["merged", "closed"]);
const TERM_PHASES = new Set(["merged", "closed", "obsolete", "on_hold"]); // 终态/准终态：噪音抑制用，不作废/挂起旧信被回落复活成漂牌（2026-09-10 SYS-14 撤卡漂牌案）
const PHASE_ZH = { dispatched: "已派单", claimed: "已认领", in_progress: "施工中", delivered: "已交付", accepted: "验收过", audited: "审验过", merged: "已合main", closed: "已关闭" };
const PHASE_CUR = { dispatched: 1, claimed: 1, in_progress: 1, delivered: 2, accepted: 3, audited: 4 }; // 相位→当前工序列（0设计 1程序员 2验收 3审验 4合main）
function stageMarks(phase) { // 工序列标记：✓=过 / 办=当前 / 待=未到；完成行五列全✓（✓按1列计宽，与●同行为）
  const marks = [];
  if (phase === "merged" || phase === "closed") return ["✓", "✓", "✓", "✓", "✓"];
  const cur = PHASE_CUR[phase] ?? 0;
  for (let c = 0; c < 5; c++) marks.push(c < cur ? "✓" : c === cur ? "办" : "待");
  return marks;
}
function readLedger() {
  const active = [], done = [], term = [];
  try {
    const lib = fs.readFileSync(path.join(CENTER, "工单库.md"), "utf-8");
    const STATUS_RE = /```status\r?\n([\s\S]*?)```/;
    for (const card of lib.split(/^# (?=(?:UPG|SYS|W|S|HMOS)-)/m).slice(1)) {
      const head = card.match(/^((?:UPG|SYS|W|S|HMOS)-\S+)[ \t]*(.*)/);
      if (!head) continue;
      const sb = card.match(STATUS_RE);
      if (!sb) continue;
      const env = {};
      for (const line of sb[1].split(/\r?\n/)) { const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/); if (kv) env[kv[1]] = kv[2].trim(); }
      const prio = (card.match(/\*\*优先级\*\*：\s*(P[0-4])/) || [])[1] || "";
      const d = env.updated_at ? new Date(env.updated_at) : null;
      const ms = d && !isNaN(d.getTime()) ? d.getTime() : null;
      const dateStr = d && !isNaN(d.getTime()) ? `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "—";
      if (ACTIVE_PHASES.has(env.phase))
        active.push({ id: head[1], title: (head[2] || "").trim().slice(0, 40), phase: env.phase,
          phaseZh: PHASE_ZH[env.phase] || env.phase, prio, updatedMs: ms, marks: stageMarks(env.phase),
          ageStr: ms ? elapsedStr((Date.now() - ms) / 60000) : "—" });
      else if (DONE_PHASES.has(env.phase))
        done.push({ id: head[1], title: (head[2] || "").trim().slice(0, 40), phase: env.phase,
          phaseZh: PHASE_ZH[env.phase] || env.phase, prio, updatedMs: ms, dateStr, marks: stageMarks(env.phase) });
      else if (TERM_PHASES.has(env.phase) && !DONE_PHASES.has(env.phase))
        term.push({ id: head[1] }); // obsolete/on_hold：只进抑制集，不进两榜——撤卡/挂起旧信不复活成漂牌
    }
  } catch {}
  active.sort((a, b) => (a.updatedMs || 9e15) - (b.updatedMs || 9e15)); // 最久没动在最上
  done.sort((a, b) => (b.updatedMs || 0) - (a.updatedMs || 0));        // 最新完成在前
  return { active, doneRecent: done.slice(0, 3), doneIds: [...done.map(d => d.id), ...term.map(t => t.id)] }; // doneIds 全量：旅程线漂牌判「终态/准终态后噪音信」用（SYS-13 终态漂牌案 + SYS-15 obsolete/on_hold 撤卡补抑制）
}

// ── 健康条（便宜读取 + layout 闸 60s 缓存；收进 [d] 抽屉） ──
let layoutCache = { at: 0, ok: null, errors: 0, detail: "" };
function healthLayout(fast) {
  if (!fast || Date.now() - layoutCache.at > 60000) {
    try {
      const r = spawnSync(process.execPath, [path.join(CENTER, "机器闸", "layout-check.mjs")],
        { encoding: "utf8", timeout: 20000, windowsHide: true, cwd: WORKS });
      layoutCache = { at: Date.now(), ok: r.status === 0, errors: (r.stdout || "").split("\n").filter(l => l.trim().startsWith("- ")).length, detail: (r.stdout || "").trim().split("\n")[0] || "" };
    } catch { layoutCache = { at: Date.now(), ok: null, errors: 0, detail: "闸不可用" }; }
  }
  return layoutCache;
}
// 只数表格行（｜开头），防把表头图例里的 ⏳ 图标也算成待办
const countRows = (p, pat) => { try { return fs.readFileSync(p, "utf-8").split(/\n/).filter(l => l.startsWith("|") && l.includes(pat)).length; } catch { return 0; } };

function readHealth(fast, seats) {
  const layout = healthLayout(fast);
  let reg = 0, disk = 0;
  const tr = readJson(path.join(CENTER, "机器闸", "tool-registry.json"));
  if (tr?.tools) for (const [name, meta] of Object.entries(tr.tools)) {
    reg++;
    const dir = meta?.dir || "";
    const p = path.isAbsolute(dir) ? path.join(dir, name) : path.join(WORKS, dir, name);
    if (fs.existsSync(p)) disk++;
  }
  let lastReport = "";
  try {
    const fl = fs.readdirSync(path.join(CENTER, "汇报区")).filter(f => f.startsWith("卫生巡查报告")).sort();
    if (fl.length) lastReport = fl[fl.length - 1];
  } catch {}
  return {
    layout: { ok: layout.ok, errors: layout.errors, detail: layout.detail },
    tools: { reg, disk },
    problems: countRows(path.join(CENTER, "问题区", "问题区.md"), "⏳"),
    ledger: countRows(path.join(CENTER, "问题区", "挂账登记表.md"), "⏳"),
    lastReport, hygieneOn: seats["巡检台"]?.on === true,
  };
}

// ── 聚合入口 ─────────────────────────────────────────────
export function collect(opts = {}) {
  const fast = !!opts.fast;
  const now = new Date();
  const mail = readMail();
  const seats = readSeats();
  const tickets = listIds().map(id => ({ ...readJson(path.join(DIR, id, "单.json")), id }));
  const cards = tickets.map(t => buildCard(t, mail, now));

  const byP = (a, b) => a.attention.localeCompare(b.attention) || (b.elapsedMin || 0) - (a.elapsedMin || 0);
  const stations = STATIONS.map(st => ({ ...st, seat: seats[st.role], tickets: cards.filter(c => c.station === st.role).sort(byP), unread: mail.inflight.filter(l => l.to === st.role).length }));

  const doneOf = (t) => parseLocal((t.history || []).slice(-1)[0]?.at || t.created) || now;
  const todayStr = now.toISOString().slice(0, 10);
  const done = {
    today: tickets.filter(t => t.stage === "完成" && doneOf(t).toISOString().slice(0, 10) === todayStr).map(t => t.id),
    week: tickets.filter(t => t.stage === "完成" && (now - doneOf(t)) / 86400000 < 7).map(t => t.id),
    recent: tickets.filter(t => t.stage === "完成").sort((a, b) => doneOf(b) - doneOf(a)).slice(0, 5).map(t => t.id),
  };

  const active = cards.filter(c => c.attention !== "P4").sort(byP);
  const attention = {};
  for (const c of cards) attention[c.attention] = (attention[c.attention] || 0) + 1;

  return {
    generated: now.toISOString(),
    attention,
    stations, mail, ledger: readLedger(),
    health: readHealth(fast, seats),
    done,
    hygieneSeat: seats["巡检台"] || { on: false, agent: "" }, // 巡检台用（2026-09-10 巡检台表格化）
    cards: active, // 主角候选：P0→P3 排序（P4 只进完成条）
  };
}

// CLI：node board-data.mjs [--fast]
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fast = process.argv.includes("--fast");
  console.log(JSON.stringify(collect({ fast }), null, 2));
}
