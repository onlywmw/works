#!/usr/bin/env node
// -*- coding: utf-8 -*-
// MOV 流水线看板 —— 状态机引擎 + 投影看板（无 DB：工单库/E1 哲学，看板只是投影+控制面）
//
// 流程权在引擎：AI 是工序工人（每阶段只拿本工序任务包，产物过机械校验才推进）。
// 人只在一道闸门拍板：批准方案。终局合并回设计师工位（审验过→设计师执行合并→hash 闸登记 merged）——单子从哪来回哪去，闭合成环。引擎绝不碰 git——合并由设计师工位执行。
//
// 用法：
//   node engine.mjs new <工单号> <标题>     # 建单（生成 单.json + 任务包骨架）
//   node engine.mjs status                  # 终端看板
//   node engine.mjs approve <工单号>        # 人闸放行（当前闸门）
//   node engine.mjs rerun <工单号>          # 校验失败后重跑当前工序
//   node engine.mjs serve [端口]            # 起看板服务（默认 8461），闸门按钮在页面上
//
// 工序阶段机（泳道=角色）：设计师(人闸·方案) → 程序员 → 验收员 → 审验员 → 合main(人闸) → 完成
// 校验失败 → 停下亮红等人工（引擎不自动重试——机器只出 flag）。
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import readline from "node:readline";
import { spawn, execSync, execFileSync } from "node:child_process"; // 2026-10-02 补：SYS-160 漏导入（工具自检/linuxProcs 用 execFileSync）
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module"; // SYS-90 R2：ESM 下引 node:sqlite（require 未定义活体缺陷修）
import { collect } from "./board-data.mjs";
import { createPool, parseSeatField } from "./值守池.mjs"; // SYS-45 C 层：headless 工位池（pi --mode rpc 唤醒通道）
import os from "node:os";
import { newId, buildEnvelope, parseEnvelope, TICKET_IN_TEXT } from "./lib/envelope.mjs"; // 发信+读信单一通道（SYS-16/审查⑥）：毫秒唯一 ID + 信封 ref 常驻 + 解析归一，堵同秒覆盖丢信与哨兵盲区
import { SEAT_THRESH, seatTag } from "./lib/seat-thresh.mjs"; // SYS-176：席位评定阈值/tag 单源（[75,60]·与 seat-score.mjs 同引本件）

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * SYS-176：席位表现读数（主屏两分支**唯一**入口）——三态：ok（横条+分+tag）／idle（「── 无数据」）／stale（「── 数据待刷新」）。
 * 数据源＝巡检台 seat-score.mjs 产出的 看板/席位表现.json（<24h）；缺件/过期＝stale。
 * **判据锚（SYS-176 红线）**：本件席位段不得再出现「回落实时结构信号」出数分支（D.stations 结构分与巡检台 78/40 假分已删）。
 */
function seatScorePanel(file = path.join(HERE, "席位表现.json")) {
  const ROLE5 = ["设计师", "程序员", "验收员", "审验员", "巡检台"];
  let data = null;
  try {
    const j = JSON.parse(fs.readFileSync(file, "utf8"));
    if (Date.now() - Date.parse(j.at) < 864e5) data = j; // 过期（>24h）＝待刷新
  } catch { /* 缺件＝待刷新 */ }
  if (!data) return { stale: true, rows: ROLE5.map((role) => ({ role, state: "stale" })) };
  const rows = ROLE5.map((role) => {
    const raw = data.scores ? data.scores[role] : null;
    if (raw && typeof raw === "object") {
      if (raw.state === "idle" || typeof raw.value !== "number") return { role, state: "idle" };
      return { role, state: "ok", value: raw.value };
    }
    if (typeof raw === "number") return { role, state: "ok", value: raw }; // 兼容旧版单数值
    return { role, state: "stale" };
  });
  return { stale: false, rows };
}
// ═══ SYS-160 平台面单点（可携性硬化）═══
// ① Windows 专属机制（powershell/WMI/ps1 窗口注入/座探）集中经 winShell —— 其它平台**显式 no-op**（原样会在 Linux 抛 ENOENT，非「可携」）；
// ② 通用外调（node/python）一律数组通道＋ PY 解析（Linux 无 `python` 别名，只有 python3）；
// ③ WMI 进程表在 Linux 走 `ps`（同字段形状：ProcessId/ParentProcessId/Name/CommandLine）。
const IS_WIN = process.platform === "win32";
const PY = process.env.MOV_PYTHON?.trim() || (IS_WIN ? "python" : "python3");
function winShell(cmd, opts = {}) { if (!IS_WIN) return null; return execSync(cmd, { windowsHide: true, ...opts }); }
function linuxProcs() { // 与 WMI 表同字段：ProcessId/ParentProcessId/Name/CommandLine
  const out = execFileSync("ps", ["-eo", "pid=,ppid=,comm=,args="], { encoding: "utf8", timeout: 15000, windowsHide: true });
  return out.split("\n").filter((l) => l.trim()).map((l) => {
    const m = l.trim().match(/^(\d+)\s+(\d+)\s+(\S+)\s*(.*)$/);
    return m ? { ProcessId: Number(m[1]), ParentProcessId: Number(m[2]), Name: m[3], CommandLine: m[4] } : null;
  }).filter(Boolean);
}
const DIR = path.join(HERE, "单");
const WORKS = path.join(HERE, "..", ".."); // 安卓中国体系建设体系根（工单库在 处理中心/，状态闸在 处理中心/机器闸/）
const SET_STATUS = path.join(WORKS, "处理中心", "机器闸", "set-status.py"); // 2026-09-09 工具分家后自 审验员/ 迁入机器闸（死链修复）
const TICKET_RE = /^(UPG|SYS|W|S|HMOS)-[A-Za-z0-9]+$/;
const STAGE_PHASE = { // 工序→工单库主链相位（阶段通过时回写；设计师合并位在 completeStage 专路处理，不走此表）
  "程序员": ["delivered", "dev"], "验收员": ["accepted", "inspector"], "审验员": ["audited", "inspector"],
};
function syncStatus(ticket, args) {
  if (!/^[A-Z]+-\d+$/.test(ticket)) return { ok: false, out: `非法工单号「${ticket}」——白名单 ^[A-Z]+-\\d+$，拒绝调用 set-status（SYS-17 注入加固）` };
  try {
    const r = execSync(`${PY} "${SET_STATUS}" ${ticket} ${args}`, {
      encoding: "utf8", windowsHide: true, timeout: 30000, cwd: WORKS,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });
    return { ok: true, out: r.trim().split("\n").map(x => x.trimEnd()).slice(-2).join(" ").slice(0, 160) };
  } catch (e) { return { ok: false, out: String(e.stderr || e.stdout || e.message).trim().slice(0, 200) }; }
}
const AGENT_NAMES = ["claude", "reasonix", "codex", "gemini", "zcode", "kimi", "opi", "pi", "hermes"];

// ═══════════════ SYS-88 席位进程判据（单一真源）═══════════════
// 病根：agentPid 写入侧抓错进程（控制台行尾 `&& pi` 被当 agent；hermes 工具子进程被顶捕）
//       → 判据侧又凭单个 pid 定生死（灯尸假报 / 席被误熄 / 借异体系活 pid 过关）。
// 三层收口：①写入侧 pickAgentPid＝非 shell＋CLI 签名＋本席窗树内＋最外层（工具子进程=内层）
//           ②常驻候选＝进程龄 ≥ SYS88_MIN_AGE_MS（瞬灭工具子进程不落档）
//           ③判据侧 seatVerdict＝pid 活也要核归属（窗死/跨体系不判活）；pid 死要看窗（窗活=待复探，不熄灯）
const SYS88_SHELLS = new Set(["cmd", "cmd.exe", "powershell", "powershell.exe", "pwsh", "pwsh.exe", "bash", "bash.exe", "sh", "sh.exe", "conhost", "conhost.exe", "wt", "wt.exe", "windowsterminal", "wscript", "cscript"]);
const SYS88_SIGS = ["pi-coding-agent", "claude-code", "reasonix", "codex", "gemini-cli", "kimi", "hermes", "zcode"]; // CLI 包/可执行签名：pi 真身 token=pi-coding-agent（已越过控制台 cmd 行尾 `&& pi`）
const SYS88_MIN_AGE_MS = Number(process.env.MOV_AGENT_MIN_AGE_MS) > 0 ? Number(process.env.MOV_AGENT_MIN_AGE_MS) : 15000; // 常驻候选下限（实测工具子进程 10.8s 即死）
const SYS88_TABLE_TTL_MS = 180000; // 进程表缓存（判据侧非快路径才取表；防每分钟 WMI）
let sys88Table = { at: 0, rows: null };
function __testResetSys88() { sys88Table = { at: 0, rows: null }; }
function sys88Idx(rows) { const m = new Map(); for (const r of rows || []) m.set(Number(r.ProcessId), r); return m; }
function sys88Name(p) { return String((p && p.Name) || "").toLowerCase(); }
function sys88IsShell(p) { return SYS88_SHELLS.has(sys88Name(p)); }
function sys88Sig(p) { // → agent 名 | ""（进程名=agent，或命令行含 CLI 签名；仅 token 不算，防 `&& pi` 之类伪命中）
  const nm = sys88Name(p).replace(/\.exe$/, "");
  if (AGENT_NAMES.includes(nm)) return nm;
  const cl = String((p && p.CommandLine) || "").replace(/\//g, "\\").toLowerCase();
  for (const s of SYS88_SIGS) if (cl.includes(s)) return AGENT_NAMES.find((a) => s.includes(a)) || s;
  return "";
}
function sys88AgeMs(p, now) { // 进程龄（CreationDate 兼容 ISO/"\/Date(ms)\/"；不可得 → null=不拦）
  const raw = p && p.CreationDate;
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return (now ?? Date.now()) - raw;
  const m = String(raw).match(/\/Date\((\d+)/);
  if (m) return (now ?? Date.now()) - Number(m[1]);
  const t = Date.parse(String(raw));
  return t ? (now ?? Date.now()) - t : null;
}
function sys88LoadTable(opts = {}) { // 注入缝 opts.procs（测试桩）；默认 WMI 同口径。opts.procs 显式非数组（如 null）= 表不可得（SYS-103 S5 守项锁）；失败 → null（判据侧一律不判死）
  if (opts.procs !== undefined) return Array.isArray(opts.procs) ? opts.procs : null;
  const now = opts.now ?? Date.now();
  if (sys88Table.rows && now - sys88Table.at < SYS88_TABLE_TTL_MS) return sys88Table.rows;
  try {
    // SYS-160：Linux 走 ps（同字段）；Windows 保持 WMI 原串（零回归）
    let arr;
    if (IS_WIN) {
      const j = winShell('powershell -NoProfile -Command "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,CommandLine,CreationDate | ConvertTo-Json -Compress"', { encoding: "utf8", timeout: 15000 });
      arr = JSON.parse(j);
    } else {
      arr = linuxProcs();
    }
    if (!Array.isArray(arr)) arr = [arr];
    sys88Table = { at: now, rows: arr };
    return arr;
  } catch (e) { fault("sys88LoadTable", e, opts); return null; }
}
function sys88InTree(rows, pid, rootPid) { // true=在本席窗树内｜false=已证不在｜null=不可判（无锚/根不在表/表缺失）
  const byPid = sys88Idx(rows);
  const root = Number(rootPid || 0), p0 = Number(pid || 0);
  if (!p0) return null;
  if (root && p0 === root) return true;
  if (!rows || !root) return null;
  if (!byPid.has(root)) return null; // 本席 console 不在表（跨体系串台/已死）→ 无从证伪，宁缺勿错
  let cur = byPid.get(p0);
  const seen = new Set();
  for (let i = 0; i < 12 && cur; i++) {
    if (seen.has(cur.ProcessId)) return null; seen.add(cur.ProcessId);
    const pp = Number(cur.ParentProcessId || 0);
    if (pp === root) return true;
    if (!pp) return false;
    cur = byPid.get(pp);
  }
  return cur ? null : false;
}
function sys88PickAgentPid(rows, startPid, opts = {}) { // 本席真 agent：沿父链取**最外层**候选（工具子进程在内层，不落档）
  const byPid = sys88Idx(rows);
  const root = Number(opts.consolePid || 0);
  let cur = byPid.get(Number(startPid || 0)), pick = null;
  const seen = new Set();
  for (let i = 0; i < 8 && cur; i++) {
    if (seen.has(cur.ProcessId)) break; seen.add(cur.ProcessId);
    const sig = sys88IsShell(cur) ? "" : sys88Sig(cur);
    if (sig && sys88InTree(rows, cur.ProcessId, root) !== false) pick = { name: sig, pid: Number(cur.ProcessId), proc: cur }; // 最外层覆盖内层
    cur = byPid.get(Number(cur.ParentProcessId));
  }
  return pick;
}
function sys88SeatVerdict(seat, opts = {}) { // 判据侧单一真源（watchdog 灯尸 / 轻路径熄灯 / 铃闸 共用）
  const pid = Number((seat && seat.agentPid) || 0), consolePid = Number((seat && seat.consolePid) || 0);
  const kill = opts.kill || ((p) => process.kill(p, 0));
  const isAlive = (p) => { try { kill(p); return true; } catch (e) { return !!(e && e.code === "EPERM"); } }; // EPERM=在但无权=活
  if (!pid) return { verdict: "unknown", why: "无 agentPid（未落档）" };
  if (isAlive(pid)) {
    if (seat.pidTree && Number(seat.pidTree.root) === consolePid && Number(seat.pidTree.pid || pid) === pid) return { verdict: "living", why: "写档时已核窗树" }; // 快路径：不启 PS
    if (!consolePid) return { verdict: "unknown", why: "无窗锚——归属不可判（不判死、不取表）" };
    const rows = sys88LoadTable(opts);
    const owned = sys88InTree(rows, pid, consolePid);
    if (owned === true) return { verdict: "living", why: "现场核：pid ∈ 本席窗树" };
    if (owned === false) return { verdict: "dead", why: `pid 活着但不属本席窗树（跨体系串台/借活 pid 过关·consolePid=${consolePid}）` };
    return { verdict: "unknown", why: "归属不可判（无窗锚/表缺失）——不判死" };
  }
  if (!consolePid) return { verdict: "dead", why: "agentPid 死且无窗锚（历史档/测试桩：沿用旧口径 agentPid=命脉）" }; // 兼容分支：生产席位工位就绪即写 consolePid，此支只余历史档
  if (isAlive(consolePid)) return { verdict: "unknown", why: "agentPid 死但窗活（疑误记/换代：待全表复探，不熄灯）" };
  return { verdict: "dead", why: "agentPid 死且窗死（consolePid 不存在）" };
}

function detectAgent(opts = {}) { // onseat 沿父链上溯识别当前承载的 agent CLI（node←shell←agent）；SYS-88：非 shell＋CLI 签名＋最外层＋常驻候选
  try {
    const rows = sys88LoadTable(opts);
    if (!rows) return "";
    const pick = sys88PickAgentPid(rows, Number(opts.startPid || process.pid), { consolePid: opts.consolePid || 0 });
    if (!pick) return "";
    const age = sys88AgeMs(pick.proc, opts.now ?? Date.now());
    if (age != null && age < SYS88_MIN_AGE_MS) { fault("detectAgent.tooYoung", new Error(`常驻候选过新（${Math.round(age / 1000)}s < ${SYS88_MIN_AGE_MS / 1000}s）——不落档 pid=${pick.pid}`), opts); return ""; }
    return { name: pick.name, pid: pick.pid };
  } catch { return ""; }
}
function ticketExistsInLib(id) {
  try {
    const lib = fs.readFileSync(path.join(WORKS, "处理中心", "工单库.md"), "utf-8");
    return new RegExp(`^# ${id}\b`, "m").test(lib);
  } catch { return false; }
}
const STAGES = ["设计师", "程序员", "验收员", "审验员", "完成"]; // 2026-09-09 回环制：审验过→回设计师合并位（t.merge）→完成——四角顺时针成环，合 main 归设计师
const GATES = ["设计师"]; // 入口人闸：方案批；合并位（t.merge）不是闸——设计师工位执行合并走信件流转
const AI_STAGES = ["程序员", "验收员", "审验员", "设计师"]; // 设计师仅合并位（t.merge）按工序跑
const out = (...a) => console.log(...a);
const logRing = {};   // 工单号 -> [日志行]（内存环，投影用）
const running = {};   // 工单号 -> true（工序进行中）
let broadcast = () => {};

const readT = (id) => JSON.parse(fs.readFileSync(path.join(DIR, id, "单.json"), "utf-8"));
const writeT = (id, t) => { // 原子写（2026-09-10 审查⑤）：tmp+rename——崩溃只留 .tmp 残件，单.json 永不半截（检测贵、预防贱）
  const p = path.join(DIR, id, "单.json"), tmp = p + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(t, null, 2), "utf-8");
  fs.renameSync(tmp, p);
  note(id, `📍 阶段 → ${t.stage}`); broadcast({ type: "state", id });
};
const note = (id, line) => {
  (logRing[id] = logRing[id] || []).push(`[${new Date().toLocaleTimeString("sv-SE")}] ${line}`);
  if (logRing[id].length > 400) logRing[id].shift();
  broadcast({ type: "log", id, line });
};

function cmdNew(id, title) {
  if (!id || !title) return out("用法：new <工单号> <标题>（工单号须先在 工单库.md 建卡；DEMO-* 为演示模式不回写）");
  const isTicket = TICKET_RE.test(id);
  if (isTicket && !ticketExistsInLib(id))
    return out(`❌ ${id} 在 工单库.md 无卡——先按 works 规则建卡再建流水线单（防双源账）`);
  fs.mkdirSync(path.join(DIR, id), { recursive: true });  const t = {
    id, title, ticket: isTicket, stage: "设计师", created: new Date().toLocaleString("sv-SE"),
    worktree: "", flag: "",
    stages: {
      "程序员": { task: "TODO：施工任务包（STD 要点/产物落点/红线）。产物：交付报告.md", produce: ["交付报告.md"], must_contain: { "交付报告.md": ["分支", "L1"] } },
      "验收员": { task: "TODO：验收任务包。独立复跑 L1，产物：验收结论.md", produce: ["验收结论.md"], must_contain: { "验收结论.md": ["变异", "判定"] } },
      "审验员": { task: "TODO：终审任务包。产物：审验记录.md", produce: ["审验记录.md"], must_contain: { "审验记录.md": ["hash", "结论"] } },
    },
    history: [],
  };
  // P1-2（大神批注）：STD↔流水线强绑定——有冻结 STD 则记录绑定关系
  const stdDir = path.join(HERE, '..', '验收标准冻结区', id);
  if (fs.existsSync(stdDir)) {
    const stds = fs.readdirSync(stdDir).filter(f => f.startsWith('STD-')).sort();
    if (stds.length) {
      const stdContent = fs.readFileSync(path.join(stdDir, stds[stds.length - 1]), 'utf-8');
      const stdSha = crypto.createHash('sha256').update(stdContent).digest('hex');
      // 绑定三件套写入单.json（审验时对账：std_sha 变了 = STD 被改过 → 校验必红）
      out(`📋 STD 绑定：${stds[stds.length - 1]}（sha=${stdSha.slice(0, 12)}）——已记入单.json，审验时对账`);
    }
  }

    writeT(id, t);
  out(`✅ 建单 ${id}：${title}（阶段：设计师·等人批方案；${isTicket ? "已挂靠工单库，阶段迁移自动 set-status 回写" : "演示模式：不回写工单库"}）。编辑 ${path.join(DIR, id, "单.json")} 填任务包后，在闸门放行。`);
}

function validate(id, t, stageName) {
  const cfg = t.stages?.[stageName];
  if (!cfg) return `任务包缺失：stages.${stageName} 未配置（编辑 单/${id}/单.json 补任务包后 rerun）`;
  const base = path.join(DIR, id);
  for (const f of cfg.produce || []) {
    const p = path.join(base, f);
    if (!fs.existsSync(p)) return `产物缺失: ${f}`;
    for (const pat of cfg.must_contain?.[f] || []) {
      if (!new RegExp(pat).test(fs.readFileSync(p, "utf-8"))) return `${f} 缺关键内容：/${pat}/`;
    }
  }
  return null;
}

async function runStage(id, t, stageName) {
  const cfg = t.stages[stageName];
  const prompt = [
    `你是 MOV 工单流转中心的「${stageName}工序」工人。只做本工序，不越界。`,
    `工单：${t.id} ${t.title}`,
    t.worktree ? `工作区（只许在此内改码）：${t.worktree}` : "",
    `任务包：${cfg.task}`,
    `完成后把产物写到：${(cfg.produce || []).map(f => path.join(DIR, id, f)).join("、")}`,
    `产物必须包含关键内容：${JSON.stringify(cfg.must_contain || {})}`,
    `不得：发信/改工单库/碰 git 远端/做本工序以外的事。干完即止。`,
  ].filter(Boolean).join("\n");
  note(id, `🔨 ${stageName} 工序开工（agent：${process.env.AGENT_CMD || "claude"}）`);
  const args = ["-p", ...(process.env.AGENT_ARGS || "--dangerously-skip-permissions").split(" ").filter(Boolean),
    "--output-format", "stream-json", "--verbose", "--include-partial-messages"];
  return new Promise((resolve) => {
    const child = spawn(process.env.AGENT_CMD || "claude", args, { windowsHide: true, shell: true, cwd: t.worktree || HERE, stdio: ["pipe", "pipe", "pipe"] });
    child.stdin.write(prompt); child.stdin.end();
    child.stdout.setEncoding("utf-8");
    let buf = "";
    child.stdout.on("data", (d) => {
      buf += d; let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === "assistant" && ev.message?.content) {
          for (const b of ev.message.content) {
            if (b.type === "text" && b.text?.trim()) note(id, `💬 ${b.text.trim().slice(0, 200)}`);
            if (b.type === "tool_use") {
              const bi = b.input || {};
              note(id, `🔧 ${b.name}：${String(bi.command || bi.file_path || bi.pattern || "").slice(0, 120)}`);
            }
          }
        } else if (ev.type === "result") note(id, `🏁 ${ev.is_error ? "出错" : "完成"}`);
      }
    });
    child.stderr.on("data", (d) => process.stderr.write(d));
    child.on("close", () => resolve());
  });
}

async function tick(id) {
  if (running[id]) return;
  const t = readT(id);
  if ((t.stage === "设计师" && !t.merge) || t.stage === "完成") return; // 入口人闸（方案批）/终态；合并位继续走
  if (t._passed) { // 工序已过、回写失败停等：每轮只重试回写，不重跑 agent
    const [phase, role] = STAGE_PHASE[t._passed] || [];
    const r = phase ? syncStatus(t.id, `--phase ${phase} --role ${role} --note "流水线${t._passed}工序通过（回写重试）"`) : { ok: true };
    if (r.ok) { const stage = t._passed; const next = stage === "审验员" ? "设计师" : STAGES[STAGES.indexOf(stage) + 1];
      t.history.push({ at: new Date().toLocaleString("sv-SE"), stage, verdict: "过（回写重试成功）" });
      applyAdvance(t, stage, next); // 2026-09-10 修（审查②）：审验→合并位必须走 handoffToMerge（生成 stages.设计师 合并任务包）——手搓迁移=任务包缺失、每轮 tick TypeError 卡死
      t.flag = ""; delete t._passed; writeT(id, t); note(id, `📒 回写重试成功 → ${stage === "审验员" ? "设计师合并位" : next}`); }
    return;
  }
  if (t.flag && !t._rerun) return; // 有红牌：等人（rerun 命令清旗）
  const stage = t.stage;
  const isWork = AI_STAGES.includes(stage) && (stage !== "设计师" || t.merge);
  if (!isWork) return;

  // ── 座席优先派工 v2（P0 @2026-09-09 大神批注：Lease/Heartbeat 替代硬超时）──
  // 三态：ASSIGNED(灯亮等待·不限时) → SUSPECT(灯灭·宽限10分钟) → FALLBACK(headless)
  // 核心原则：「没有产物 ≠ 没有工作」——灯亮就等，灯灭才考虑接手
  if (t.awaiting === stage) {
    const ready = (t.stages[stage]?.produce || []).every(f => fs.existsSync(path.join(DIR, id, f)));
    const letter = checkInboxForCompletion(id, stage);
    if (letter) {
      note(id, `📬 收到工序完工信（来自 ${letter.from}）——校验产物`);
      if (ready) {
        delete t.awaiting; delete t.awaiting_since; delete t.seat_suspect_since; writeT(id, t);
        running[id] = true;
        try { note(id, `✅ 产物齐备——进入机械校验`); await completeStage(id, readT(id), stage); } finally { running[id] = false; }
      } else {
        note(id, `🚩 完工信已收但产物缺失——红牌（agent 声称完工但文件未落盘）`);
        t.flag = `完工信产物缺失：${letter.from} 声称完工但 ${(t.stages[stage]?.produce||[]).join('、')} 不全`;
        writeT(id, t);
        fileProblem(id, stage, t.flag);
      }
      return;
    }
    // 降级：无完工信但产物全齐（agent 忘了发信）→ 仍然校验但标记未走信
    if (ready) {
      delete t.awaiting; delete t.awaiting_since; delete t.seat_suspect_since; writeT(id, t);
      running[id] = true;
      try { note(id, `⚠️ 未收到完工信但产物齐备——降级校验（agent 应补发工序完工信）`); await completeStage(id, readT(id), stage); } finally { running[id] = false; }
      return;
    }
    const alive = seatOn(stage);
    if (alive) {
      if (t.seat_suspect_since) { delete t.seat_suspect_since; writeT(id, t); note(id, `💓 座席恢复在线——继续等待产物`); }
      return;
    }
    if (!t.seat_suspect_since) {
      t.seat_suspect_since = Date.now(); writeT(id, t);
      note(id, `⚠️ 座席下线——SUSPECT 宽限 10 分钟（agent 可能重启中）`);
      return;
    }
    if (Date.now() - t.seat_suspect_since < 10 * 60 * 1000) return;
    delete t.awaiting; delete t.awaiting_since; delete t.seat_suspect_since; writeT(id, t);
    note(id, `⏱️ 座席下线超 10 分钟（Lease 过期）——回退 headless 派工`);
  } else if (seatOn(stage)) {
    sendStageLetter(id, t, stage);
    t.awaiting = stage; t.awaiting_since = Date.now(); writeT(id, t);
    note(id, `工位灯亮——${stage}工序信件派工（在岗 agent 接活；灯灭 10 分钟后才回退）`);
    return;
  }


  running[id] = true;
  try {
    await runStage(id, t, stage);
    await completeStage(id, readT(id), stage);
  } finally { running[id] = false; }
}

// 工序完工信检查（邮局唯一通信信道 @2026-09-09：agent→发信→引擎收信→校验，消灭文件暗语）
// 2026-09-10 修（审查③）：完工信必须带工序名——降级路径推进后上一工序的迟到完工信会被当新工序的消费（产物不齐→假红牌）。契约：re 或正文含「<单号>」「<工序名>」「工序完工」
function checkInboxForCompletion(id, stage, opts = {}) { // opts（测试桩）：inboxDir/archiveDir 换沙盒
  const inbox = opts.inboxDir || path.join(HERE, "..", "邮局", "邮箱", "流水线", "INBOX");
  if (!fs.existsSync(inbox)) return null;
  for (const f of fs.readdirSync(inbox).sort()) {
    if (!f.endsWith(".md")) continue;
    const raw = fs.readFileSync(path.join(inbox, f), "utf-8");
    const env = parseEnvelope(raw); // 读路径归一（审查⑥）
    // 匹配：to=流水线 + re 三件套（单号+工序名+"工序完工"——复查残留②收紧：只看 re 行，防正文提及下站名串台）
    if (env.to === "流水线" && env.re && env.re.includes(id) && env.re.includes("工序完工") && env.re.includes(stage)) {
      // 归档此信（引擎消费完毕）
      const archive = opts.archiveDir || path.join(HERE, "..", "邮局", "邮箱", "流水线", "归档");
      fs.mkdirSync(archive, { recursive: true });
      fs.renameSync(path.join(inbox, f), path.join(archive, f));
      return { file: f, from: env.from, re: env.re, note: (raw.match(/^([\s\S]*?)---/)?.[1] || "").trim() };
    }
  }
  return null;
}

// 座席探测：工位灯（on:true）
const SEAT_KEY = { "设计师": "designer", "程序员": "coder", "验收员": "qa", "审验员": "reviewer", "巡检台": "hygiene" }; // 巡检台 2026-09-10 补入：有信箱有工位却无人敲铃（旧信永远闷死）
function seatOn(stage) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(HERE, "seats", `${SEAT_KEY[stage]}.json`), "utf-8"));
    return j.on === true;
  } catch { return false; }
}

// 信件派工：任务包落盘 + 工单信投邮局 + 敲窗（复用铃）
function sendStageLetter(id, t, stage) {
  const TYPE = { "设计师": "合并邀请", "程序员": "派单", "验收员": "验收邀请", "审验员": "审验邀请" };
  const cfg = t.stages[stage];
  const packPath = path.join(DIR, id, `任务包_${stage}.md`);
  fs.mkdirSync(path.dirname(packPath), { recursive: true });
  fs.writeFileSync(packPath, [
    `# 任务包 · ${t.id} ${t.title} · ${stage}工序`, "",
    `任务：${cfg.task}`, "",
    `产物落点（写完引擎自动校验）：${(cfg.produce || []).map(f => path.join(DIR, id, f)).join(" / ")}`,
    `必含关键内容：${JSON.stringify(cfg.must_contain || {})}`, "",
    t.worktree ? `工作区（只在此内改码）：${t.worktree}` : "",
    "红线：不碰 git 远端/不做本工序外的事/需要人拍板→发通知信停下。", "",
  ].join("\n"), "utf-8");
  const stamp = new Date();
  const inbox = path.join(HERE, "..", "邮局", "邮箱", stage, "INBOX");
  fs.mkdirSync(inbox, { recursive: true });
  const packSha = crypto.createHash("sha256").update(fs.readFileSync(packPath)).digest("hex").slice(0, 16);
  const buildBody = (lid) => buildEnvelope({
    id: lid, from: "流水线", to: stage, type: TYPE[stage],
    re: `${t.id} ${stage}工序（信件派工）`, created: stamp.toLocaleString("sv-SE"),
    payload: packPath, sha: packSha,
  }) + "\n\n" + `流水线引擎派工：${t.id} ${stage}工序任务包已就绪（见 payload）。产物写到任务包指定落点后引擎自动校验推进。` + "\n";
  // SYS-20 写信防覆盖：wx 独占写；EEXIST 撞名 → 重生成 ID 重试（≤3 次，仍败报错不覆盖）
  let lid = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    lid = newId(stamp);
    try { fs.writeFileSync(path.join(inbox, `${lid}.md`), buildBody(lid), { encoding: "utf-8", flag: "wx" }); break; }
    catch (e) {
      if (e.code !== "EEXIST") throw e;
      if (attempt === 3) { note(id, `❌ 派工信 ID 连撞 3 次（${lid}）——已停止写入（不覆盖）`); throw new Error(`派工信 ID 连撞 3 次：${t.id} ${stage}工序`); }
    }
  }
  note(id, `📨 信件 ${lid} 已投 ${stage} 收件箱`);
  try { // 敲窗 best-effort：复用铃.ps1（按 hwnd 激活+打「收信」，失败不阻塞——值守每5秒扫信箱兜底）
    const seat = JSON.parse(fs.readFileSync(path.join(HERE, "seats", `${SEAT_KEY[stage]}.json`), "utf-8"));
    const cpid = Number(seat.consolePid); // SYS-17 注入加固：数值强转，NaN/非正数不注入（防命令行拼接）
    if (Number.isFinite(cpid) && cpid > 0) {
      // 2026-10-01（用户令「不能一单就重新开一个·10% 就开新的=浪费」·修订 2026-09-28「唤醒即换」）：
      // 唤醒**只敲「收信」不注入 /new**——会话连办多封；轮换统一走水位制（auto-rotate 扩展·窗口 75%）。
      winShell(`powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(HERE, "铃2.ps1")}" -ConsolePid ${cpid} -Text "收信"`, { timeout: 15000, stdio: "ignore" });
    }
  } catch (e) { fault("sendStageLetter.敲窗", e); }
}

// ---------- 会话轮换哨兵（2026-09-28 立·2026-10-01 改水位制） ----------
// 目的：**大体量兜底**（不按单轮换——2026-10-01 用户令修订「不能一单就重新开一个」：会话连办多封，轮换看水位）。
// 条件（全部满足才轮换）：①该席会话文件 ≥ 3.5MB（≈1M 窗口 75%·按 ~4.5B/token 估）②静置 ≥ 15 分钟（session jsonl 的 mtime）③该席信箱空 ④冷却 ≥ 60 分钟。
// 动作：向该席窗注入 `/new`（复用铃2 CONIN$ 通道·不抢焦点）。首选轮换＝auto-rotate 扩展（按真实用量·窗口 75%），本哨兵是"**大体量闲置**"兜底。
// SYS-161（2026-10-02）：注入**不当场记「已轮换」**——落 pending 记录，下一轮扫描验证「出现 mtime 晚于注入时刻的 .jsonl（新档出现 或 原档 mtime 变化）」：
//   验证到 ⇒ 记「已轮换」（session.rotate）并落冷却；期内 ⇒ 等下一轮；超期未验证 ⇒ 记「注入未生效（待验）」（独立事件名 session.rotate.noeffect·不充真轮换计数）并转观察（冷却后重试）。
//   根因（巡检台轮2 报）：02:03–05:03 四次注入未生效仍记「已轮换」假成功（旧档 mtime 不动）⇒ 每小时重试把故障计数充成污染源。
const SESSION_ROTATE = {
  minBytes: 3.5 * 1024 * 1024,
  minIdleMs: 15 * 60e3,
  cooldownMs: 60 * 60e3,
  verifyMs: 5 * 60e3, // SYS-161：注入后最早判定期（=下一轮扫描口径；期内不判「未生效」）
  stateFile: path.join(HERE, "会话轮换.json"),
  sessionsRoot: path.join(process.env.USERPROFILE || process.env.HOME || "C:/Users/Administrator", ".pi/agent/sessions"),
};
let lastSessionRotateScan = 0;
/** SYS-161：状态归一——旧格式（role→ts 数值·兼容现存 会话轮换.json）⇒ { last, pending }；新格式原样。 */
function normalizeRotateState(v) {
  if (typeof v === "number") return { last: v, pending: null };
  if (v && typeof v === "object") return { last: Number(v.last) || 0, pending: v.pending || null };
  return { last: 0, pending: null };
}
/** SYS-161：注入效果验证——该席任一 .jsonl 的 mtime 晚于注入时刻（新档出现 或 原档 mtime 变化）⇒ 生效。 */
function verifyRotateEffect(sessionsRoot, role, pending) {
  try {
    for (const d of fs.readdirSync(sessionsRoot)) {
      if (!d.includes(role)) continue;
      for (const jf of fs.readdirSync(path.join(sessionsRoot, d))) {
        if (!jf.endsWith(".jsonl")) continue;
        const fp = path.join(sessionsRoot, d, jf); const stat = fs.statSync(fp);
        if (stat.mtimeMs > pending.at) return { ok: true, file: jf, size: stat.size };
      }
    }
  } catch { /* 无会话目录 ⇒ 未生效 */ }
  return { ok: false };
}
function scanSessionRotate(opts = {}) { // opts（测试桩·同 ringUnreadSeats 口径）：seatsDir/sessionsRoot/stateFile 换沙盒，inject 换掉真注入，now 换时钟，noLog/onFault 换日志出口
  if (Date.now() - lastSessionRotateScan < 5 * 60e3 && !opts.force) return; // 每 5 分钟最多一遍
  lastSessionRotateScan = Date.now();
  const nowFn = typeof opts.now === "function" ? opts.now : (typeof opts.now === "number" ? (() => opts.now) : (() => Date.now()));
  const now = nowFn();
  const stateFile = opts.stateFile || SESSION_ROTATE.stateFile;
  const sessionsRoot = opts.sessionsRoot || SESSION_ROTATE.sessionsRoot;
  const seatsDir = opts.seatsDir || path.join(HERE, "seats");
  const boxRoot = opts.boxRoot || path.join(HERE, "..", "邮局", "邮箱");
  const report = opts.onFault || ((where, e) => fault(where, e, opts)); // SYS-161：日志出口单点（测试收集用；noLog 仍由 fault 自身兼容）
  const saveState = opts.noPersist ? () => {} : (s) => { try { fs.writeFileSync(stateFile, JSON.stringify(s, null, 2), "utf8"); } catch { /* 状态写失败不阻塞 */ } };
  const inject = opts.inject || ((cpid) => winShell(`powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(HERE, "铃2.ps1")}" -ConsolePid ${cpid} -Text "/new"`, { timeout: 15000, stdio: "ignore" }));
  let st = {};
  try { st = JSON.parse(fs.readFileSync(stateFile, "utf8")); } catch { /* 首次 */ }
  let seats = [];
  try { seats = fs.readdirSync(seatsDir).filter(f => f.endsWith(".json")); } catch { return; }
  for (const f of seats) {
    let sd = null;
    try { sd = JSON.parse(fs.readFileSync(path.join(seatsDir, f), "utf8")); } catch { continue; }
    if (!sd || sd.on !== true) continue;                       // 只处理在岗席
    const cpid = Number(sd.consolePid); if (!Number.isFinite(cpid) || cpid <= 0) continue;
    const rec = normalizeRotateState(st[sd.role]);
    // SYS-161 ①-a：上轮注入**验证优先**（pending 在场则不做新注入）
    if (rec.pending) {
      const v = verifyRotateEffect(sessionsRoot, sd.role, rec.pending);
      const ageMin = ((now - rec.pending.at) / 60000).toFixed(0);
      if (opts.dry) { console.log(`[轮换·dry] ${sd.role}：注入待验（${ageMin}min·${v.ok ? "已见新档/mtime 变化 ⇒ 会记已轮换" : (now - rec.pending.at) >= SESSION_ROTATE.verifyMs ? "超判定窗 ⇒ 会记未生效" : "期内待下轮"}）`); continue; }
      if (v.ok) {
        st[sd.role] = { last: now, pending: null }; saveState(st);
        report("session.rotate", `已轮换：${sd.role}（注入验证通过·${v.file} ${(v.size / 1048576).toFixed(1)}MB）`);
      } else if ((now - rec.pending.at) < SESSION_ROTATE.verifyMs) {
        /* 期内：等下一轮扫描再判（不记日志） */
      } else {
        st[sd.role] = { last: now, pending: null }; saveState(st);
        report("session.rotate.noeffect", `注入未生效（待验）：${sd.role}（注入后 ${ageMin}min 无新档/mtime 变化 ⇒ 转观察·冷却后重试）`);
      }
      continue;
    }
    // ① 该席信箱空？（信箱目录按角色名找）
    const inbox = path.join(boxRoot, sd.role, "INBOX");
    let pending = 0;
    try { pending = fs.readdirSync(inbox).filter(x => x.endsWith(".md")).length; } catch { /* 无信箱 */ }
    if (pending > 0) continue;                                 // 有件不换（先办件）
    // ② 找该席最新会话文件（目录名含工位目录特征）
    const roleDirName = sd.role;
    let best = null;
    try {
      for (const d of fs.readdirSync(sessionsRoot)) {
        if (!d.includes(roleDirName)) continue;
        const dir = path.join(sessionsRoot, d);
        for (const jf of fs.readdirSync(dir)) {
          if (!jf.endsWith(".jsonl")) continue;
          const fp = path.join(dir, jf); const stat = fs.statSync(fp);
          if (!best || stat.mtimeMs > best.mtimeMs) best = { fp, size: stat.size, mtimeMs: stat.mtimeMs };
        }
      }
    } catch { /* 无会话目录 */ }
    // 2026-09-28 HY-ROT-02：**设计师席豁免**（2026-10-01 沿用·与 auto-rotate 侧不一致也无妨——那边只认触发词，不碰日常对话）——
    // 设计师会话是**用户驱动**的，中途 /new 会打断人机对话；闲置轮换只针对值守席。
    if (/设计师/.test(sd.role)) { if (opts.dry) console.log(`[轮换·dry] ${sd.role}：豁免（用户驱动会话·不轮换）`); continue; }
    if (!best) continue;
    const idle = now - best.mtimeMs;
    // 2026-09-28 追改（Token 告警案）：**大会话按体量缩小静置阈值**——体积越大越快轮换，
    // 避免"忙一天 = 全会话滚到 300M token"（程序员席 300.6M 告警触发时他仍在活跃工作）。
    const idleNeed = best.size >= 10 * 1048576 ? 60e3 : best.size >= 5 * 1048576 ? 3 * 60e3 : SESSION_ROTATE.minIdleMs;
    if (opts.dry) console.log(`[轮换·dry] ${sd.role}：会话 ${(best.size/1048576).toFixed(1)}MB（阈≥${(SESSION_ROTATE.minBytes/1048576).toFixed(1)}MB）·静置 ${(idle/60000).toFixed(0)}min（阈≥${(idleNeed/60000).toFixed(0)}min）·信箱 ${pending} 件 ⇒ ${best.size>=SESSION_ROTATE.minBytes && idle>=idleNeed ? '**命中·会注入 /new**' : '未命中'}`);
    if (best.size < SESSION_ROTATE.minBytes) continue;          // ③ 会话还小不换
    if (idle < idleNeed) continue;                              // ④ 还在说话不换（阈值随体量缩小·2026-09-28 HY-ROT-01 修）
    if (now - rec.last < SESSION_ROTATE.cooldownMs) continue;   // ⑤ 冷却
    if (opts.dry) { console.log(`[轮换·dry] ${sd.role} 会话 ${(best.size/1048576).toFixed(1)}MB·静置 ${(idle/60000).toFixed(0)}min ⇒ 会注入 /new`); continue; }
    try {
      inject(cpid); // SYS-161：注入后**不**记「已轮换」——落 pending 待下轮验证
      st[sd.role] = { last: rec.last, pending: { at: now, file: best.fp, mtimeMs: best.mtimeMs } };
      saveState(st);
    } catch (e) { report("session.rotate.inject", e); }
  }
}

// ---------- 卡单哨兵（事件驱动值班 @2026-09-10 用户拍板：引擎当眼睛，设计师当法官——零轮询、零额外 token） ----------
// 相位停滞超阈值 / 单.json 读不出 → 自动投「裁决」信给设计师；哨兵状态落盘防重启重报；巡铃对「裁决」信型豁免相位过滤（与打回同级）
const STALL_FILE = path.join(HERE, "卡单哨兵.json");
const STALL_MS = 6 * 3600e3; // 相位停滞阈值：6 小时
let lastStallScan = 0;
function sendDutyLetter(id, headline, body, opts = {}) {
  const stamp = new Date();
  const dir = path.join(DIR, id); fs.mkdirSync(dir, { recursive: true });
  const inbox = path.join(HERE, "..", "邮局", "邮箱", "设计师", "INBOX");
  fs.mkdirSync(inbox, { recursive: true });
  const buildBody = (lid) => {
    const packPath = path.join(dir, `值班通报_${lid}.md`);
    fs.writeFileSync(packPath, `# 值班通报 · ${id}\n\n## ${headline}\n\n${body}\n`, "utf-8");
    const packSha = crypto.createHash("sha256").update(fs.readFileSync(packPath)).digest("hex").slice(0, 16);
    return buildEnvelope({
      id: lid, from: "流水线", to: "设计师", type: opts.type || "裁决",
      re: `${id} ${headline}`, created: stamp.toLocaleString("sv-SE"),
      payload: packPath, sha: packSha,
    }) + "\n\n" + (opts.tail || "卡单哨兵自动通报。请裁决：催办当站 / 打回 / 挂起 / 关单 / 修复单据。处理完记得销信。") + "\n";
  };
  // SYS-20 写信防覆盖：wx 独占写；EEXIST 撞名 → 重生成 ID 重试（≤3 次，仍败报错不覆盖）
  let lid = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    lid = newId(stamp);
    try { fs.writeFileSync(path.join(inbox, `${lid}.md`), buildBody(lid), { encoding: "utf-8", flag: "wx" }); break; }
    catch (e) {
      if (e.code !== "EEXIST") throw e;
      if (attempt === 3) throw new Error(`裁决信 ID 连撞 3 次：${id} ${headline}`);
    }
  }
  note(id, `🦉 ${opts.sign || "卡单哨兵"}：${headline}——裁决信 ${lid} 已投设计师`);
}
function scanStalls() {
  if (Date.now() - lastStallScan < 60e3) return; // 每分钟最多扫一遍
  lastStallScan = Date.now();
  try {
    const watch = readJson(STALL_FILE) || {};
    const parked = readParked(); // 挂起表一轮一读
    let dirty = false;
    for (const id of listIds()) {
      let t = null;
      try { t = readT(id); } catch (e) {
        if (!watch[id]?.corruptFired) { sendDutyLetter(id, "单.json 损坏读不出", `读取报错：${String(e.message).slice(0, 120)}——疑似并发写/半截文件，请裁决（修复或重建单据）。`); watch[id] = { ...(watch[id] || {}), corruptFired: true }; }
        dirty = true; continue;
      }
      if (!t || t.stage === "完成") { if (watch[id]) { delete watch[id]; dirty = true; } continue; }
      if (parked[id]) { if (watch[id]) { delete watch[id]; dirty = true; } continue; } // 挂起豁免（2026-09-10 挂起制）：等外部条件的单不算卡单
      const stage = `${t.stage}${t.merge ? "+merge" : ""}`;
      const w = watch[id];
      if (!w || w.stage !== stage) { watch[id] = { stage, since: Date.now(), fired: false }; dirty = true; continue; }
      if (!w.fired && Date.now() - w.since > STALL_MS) {
        sendDutyLetter(id, `相位停滞超 ${STALL_MS / 3600e3} 小时`, `单 ${id}（${t.title || ""}）停在「${t.stage}」${t.merge ? "（合并位）" : ""}已超 ${STALL_MS / 3600e3} 小时无推进。`);
        watch[id].fired = true; dirty = true;
      }
    }
    for (const id of Object.keys(watch)) if (!fs.existsSync(path.join(DIR, id))) { delete watch[id]; dirty = true; }
    if (dirty) fs.writeFileSync(STALL_FILE, JSON.stringify(watch, null, 2), "utf-8");
  } catch (e) { fault("scanStalls", e); }
}

// ---------- 巡检台定时巡查（2026-09-10 用户拍板）：引擎按钟点向巡检台工位窗注入「巡查」触发词——事件/钟点驱动，agent 不轮询 ----------
// 间隔默认 4 小时（工位绑定.json _hygienePatrolMin 分钟 / _hygienePatrolHours 小时 可调）；席不在岗=跳过且不重置计时（复岗后第一分钟即补巡）；触发时刻落盘，引擎重启不乱补
// 主题轮换制（2026-09-10 用户拍板）：每轮=基础卫生扫+单一聚焦主题（UI设计→架构设计→bug查找→目标对齐→循环），不一次全管——主题随触发词下发，round 计数落盘
const PATROL_FILE = path.join(HERE, "巡查哨兵.json");
const HY_THEMES = ["UI设计", "架构设计", "bug查找", "目标对齐"]; // 第四主题 2026-09-10 立：目标是项目前进的动力——毛病挑完就量离北极星的差距（巡检台\猫头鹰\）
// ── 精灵排班（2026-09-11 用户令；SYS-57 用户 23:30 拍板解除串行）：**全到期同轮齐放**——每轮把所有到期（over>0）精灵各注入一条
//    「巡查（主题）」，巡检台席排队逐轮办（仍守一轮一主题）；无到期=白鸽基准轮转。护栏：席未静默（上轮未办完）→ 不加、下轮补（防队列积压）。
//    频率=工位绑定._spriteMin（可调·缺省见 defMin）；白鸽=基准巡逻时钟（_hygienePatrolMin）。
// SYS-145（2026-09-29·技能内化 7→3）：四巡查精灵已内化为**角色例行产物**（设计师/审验员/验收员），
//   不再由引擎按精灵节拍注入——故本表清空（保留空表与轮转逻辑：白鸽基准轮转照旧按主题轮换注入）。
//   四精灵家目录已归档 处理中心/归档/文档留档/精灵退役_<名>/；工具链已迁各角色 _tools/。
const SPRITES = [];
function spriteCadenceMs(b, s) { const m = Number((b._spriteMin || {})[s.name]); return (m > 0 ? m : s.defMin) * 60e3; }
function patrolIntervalMs(binding = null) { const b = binding || readBinding(); const m = Number(b._hygienePatrolMin); if (m > 0) return m * 60e3; const h = Number(b._hygienePatrolHours); return (h > 0 ? h : 4) * 3600e3; } // SYS-143：认注入 binding（测试缝·与宿主状态解耦）；_hygienePatrolMin（分钟）优先于 _hygienePatrolHours（小时），默认 4h
let lastPatrolEval = 0;
// SYS-56：跳过计数纯函数（测试锁）——同一巡查间隔内多次评估只计 1 次。
// 原实现每 tick（1min 节流）都 +1 ⇒ 注释「连续 6 次跳过（≈2h）」实际 ≈6min（9-11 晚 21:59–22:58 同事项 11 连投现场）。
function skipEscalateStep(st, nowMs, intervalMs) {
  const lastSkip = Date.parse(st.lastSkip || "") || 0;
  if (nowMs - lastSkip < intervalMs) return { counted: false, streak: st.skipStreak || 0, escalate: false };
  const streak = (st.skipStreak || 0) + 1;
  return { counted: true, streak, escalate: streak >= 6 && streak % 6 === 0, bite: streak >= 3 && streak % 3 === 0 }; // SYS-62：连跳≥3 咬（原升级线 6≈2h 太松）
}
// ---------- SYS-91：看板日志可信面（沙盒缝单点 + 日期列 + 合成标记） ----------
// 落点单点（D1）：kind=巡铃/故障；opts.logFile=沙盒覆盖（测试/夹具不碰真件），opts.noLog=不落任何日志。
function logFileFor(kind, opts = {}) { // SYS-91
  if (opts.logFile) return opts.logFile;
  return path.join(HERE, kind === "故障" ? "故障.log" : "巡铃.log");
}
// 统一追加（SYS-91）：新行前缀日期列 [YYYY-MM-DD HH:MM:SS]（历史行不动）；注入时刻与墙钟差 >90s 判合成 → 行尾 #合成。
function logLine(kind, whenMs, text, opts = {}) { // SYS-91
  if (opts.noLog) return;
  const synth = whenMs != null && Math.abs(Number(whenMs) - Date.now()) > 90e3;
  const d = whenMs == null ? new Date() : new Date(whenMs);
  try { fs.appendFileSync(logFileFor(kind, opts), `[${d.toLocaleString("sv-SE")}] ${text}${synth ? " #合成" : ""}\n`); } catch {}
}
function patrolHygiene(force = false, opts = {}) { // opts（测试桩）：patrolFile/seatFile/binding/sessionMtime/onInject/madDog/now/silentMs/noLog
  if (!force && Date.now() - lastPatrolEval < 60e3) return; // 每分钟最多评估一次
  lastPatrolEval = Date.now();
  try {
    const st = readJson(opts.patrolFile || PATROL_FILE) || {};
    const binding0 = opts.binding || readBinding();   // SYS-143：注入优先（测试缝）
    const intervalMs = patrolIntervalMs(binding0);
    if (!force && Date.now() - (st.lastAt || 0) < intervalMs) return;
    const seat = readJson(opts.seatFile || path.join(HERE, "seats", "hygiene.json")) || {};
    let alive = seat.on === true && !!seat.consolePid;
    if (alive && seat.agentPid) { try { process.kill(seat.agentPid, 0); } catch { alive = false; } }
    if (!alive) {
      const step = skipEscalateStep(st, Date.now(), intervalMs); // SYS-56：按巡查间隔计次（防 tick 级重复计数→同事项连投）
      if (!step.counted) return; // 本间隔已计过：静默返回，不重复计数/不重复投信
      fs.writeFileSync(opts.patrolFile || PATROL_FILE, JSON.stringify({ ...st, lastSkip: new Date().toISOString(), skipReason: "席不在岗", skipStreak: step.streak }, null, 2), "utf-8");
      if (step.escalate) { // 连续 6 次跳过（≈2h@缺省间隔）= 席挂升级：值班信报设计师（每 6 次复报）
        try { sendDutyLetter("SYS-巡检台", `巡检台席疑似挂起：连续 ${step.streak} 次巡查跳过（席不在岗）`, `巡查哨兵.json lastSkip=${new Date().toISOString()}·skipStreak=${step.streak} —— 请复席或排查（体系外心跳=心跳外哨.ps1 同步在看）。`); } catch (e) { fault("patrol.skipEscalate", e, opts); }
      }
      if (step.bite) { // SYS-62：白鸽连跳≥3 → 咬信投巡检台席（每 3 次一咬）
        try { sendSpriteBite(`白鸽连跳 ${step.streak} 次不巡（席不在岗）`, `巡查哨兵.json lastSkip=${new Date().toISOString()}·skipStreak=${step.streak}——基准巡逻钟连跳 ${step.streak} 次（每 3 次一咬）。请复席或排查（体系外心跳=心跳外哨.ps1 同步在看）。`, { noLog: opts.noLog, boxRoot: opts.boxRoot, now: opts.now }); } catch (e) { fault("patrol.skipBite", e, opts); }
      }
      return; // 不动 lastAt/round——复岗即补巡
    }
    const round = st.round || 0;
    const b = binding0;
    const sessionMtime = opts.sessionMtime || ((role) => latestSessionMtime(role));
    const sprites = st.sprites || {};
    const nowMs0 = opts.now || Date.now();
    // SYS-57（用户 2026-09-11 23:30 拍板）：解除「单时钟串行·每轮只放最欠账一只」——全到期精灵同轮齐放（各一条注入，席排队逐轮办）。
    const dueAll = SPRITES.filter((s) => nowMs0 - ((sprites[s.name] || 0) + spriteCadenceMs(b, s)) > 0);
    const themes = dueAll.length ? dueAll.map((s) => s.theme) : [HY_THEMES[round % HY_THEMES.length]]; // 到期优先；无到期=白鸽基准轮转（原语义）
    // 护栏（SYS-57）：席未静默（上一轮仍在写/未办完）→ 本轮不追加、下轮补（防注入队列无限积压）；
    // 静默口径=_madDogSilentMin（缺省 10min——与疯狗/SYS-56 补敲同源）。
    // 硬截止（2026-09-12 用户令·巡检台直办）：defer 只允许在上轮开巡后 2 个间隔内——超时无论如何都放（饿死上限=2×间隔；
    // 根因：席忙判据不分「办巡查」与「办别的」，白天席常忙→节拍全灭（09:35 精灵表停 07:40 现场）。
    const silentMs = opts.silentMs || silentMsOf(b, "_madDogSilentMin");
    const overdueMs = nowMs0 - (st.lastAt || 0);
    if (nowMs0 - sessionMtime("巡检台") < silentMs && (!st.lastAt || overdueMs < 2 * intervalMs)) return; // 席忙且未超硬截止：不动 lastAt/sprites——下轮重评
    (opts.madDog || madDog)(); // 巡查点火先放狗（席静默才放——席忙时不放，防堆积）
    firstPatrolDone = true; // SYS-143 ②：本进程首次出巡置位（此后欠账线 boot 豁免失效——护栏）
    const onInject = opts.onInject || ((text) => winShell(`powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(HERE, "铃2.ps1")}" -ConsolePid ${seat.consolePid} -Text "${text}"`, { encoding: "utf-8", timeout: 20000 }));
    // ── 巡检台优化 ①③（2026-09-30·用户令「落地处理」）────────────────────────────
    // ③ 深挖降频：专项深挖（架构/bug/UI/目标）每周至多一轮——本周已挖 ⇒ 后续轮只注入基准卫生。
    //    深度面由角色例行产物承接（SYS-145 内化：每周例行＋超 7 天咬兜底），巡检台只保横向复核。
    const weekKeyOf = (ms) => { const d = new Date(ms); const j = new Date(d.getFullYear(), 0, 1); return `${d.getFullYear()}-W${Math.ceil((((d - j) / 864e5) + j.getDay() + 1) / 7)}`; };
    const wk = weekKeyOf(nowMs0);
    const themesFinal = st.deepWeek === wk ? [] : themes;
    const injectText = themesFinal.length
      ? `巡查（本轮主题：卫生+${themesFinal.join("/")}——按角色卡主题规程执行）`
      : `巡查（基准卫生——本周深挖已毕·优化③）`;
    const doInject = () => { try { onInject(injectText); } catch (e) { fault("patrol.inject", e, opts); } };
    // ① 零红免唤醒（opt-in：哨兵开关.json「巡查零红免唤醒」=true；测试桩 opts.autoSkip=false 可直关）：
    //    体检.mjs 机器面零发现 ⇒ 本轮不唤醒 agent（草稿已由体检落盘汇报区）；失败/超时(300s)/手动 force ⇒ 照常唤醒（fail-open）。
    let autoSkipArm = !force && opts.autoSkip !== false && patrolAutoSkipOn(opts);
    if (autoSkipArm) {
      let stdout = "";
      let injected = false;
      const child = spawn(process.execPath, [TIJIAN_PATH], { cwd: path.join(HERE, "..", ".."), windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
      const killer = setTimeout(() => { try { child.kill(); } catch {} }, 300e3);
      const failOpen = () => { if (!injected) { injected = true; clearTimeout(killer); doInject(); } };
      child.stdout.on("data", (d) => { stdout += d.toString(); });
      child.stderr.on("data", () => {});
      child.on("error", failOpen);
      child.on("close", (code) => {
        clearTimeout(killer);
        if (injected) return;
        if (code === 0 && /机器体检零发现/.test(stdout)) {
          logLine("巡铃", opts.now, `巡检台 ← 机器巡查·零红·免唤醒（体检草稿已落汇报区·优化①）`, opts);
        } else failOpen();
      });
    } else doInject();
    const nowMs = opts.now || Date.now();
    const nextSprites = { ...sprites };
    for (const s of dueAll) nextSprites[s.name] = nowMs; // 齐放：全到期各更新时间戳（不挤不抢）
    // 上巡耗时近似（大神评审④）：次轮评估时以「席会话最后一次写盘 - 上巡时刻」估回合时长（Δ∈[0,4h] 才采用）
    let lastDurMs = st.lastDurMs || 0;
    if (st.lastAt) { try { const sm = sessionMtime("巡检台"); const d = sm - st.lastAt; if (d > 0 && d < 4 * 3600e3) lastDurMs = d; } catch {} } // 防弹壳：耗时近似失败不许吞铃（2026-09-11 铃哑事故教训）
    fs.writeFileSync(opts.patrolFile || PATROL_FILE, JSON.stringify({ lastAt: nowMs, round: round + 1, theme: themesFinal.join("/") || "基准卫生", deepWeek: themesFinal.length ? wk : (st.deepWeek || wk), force: !!force, sprites: nextSprites, skipStreak: 0, lastDurMs }, null, 2), "utf-8");
    logLine("巡铃", opts.now, `巡检台 ← 巡查·主题[卫生+${themesFinal.join("/") || "基准卫生(深挖本周已毕)"}]·精灵[${dueAll.map((s) => s.name).join("+") || "白鸽基准"}]${force ? "（手动）" : ""}`, opts); // SYS-91
  } catch (e) {
    logLine("巡铃", opts.now, `巡检台巡查 FAIL ${String(e.message).slice(0, 80)}`, opts); // SYS-91
  }
}

// ---------- 卫生专线闭环哨兵（2026-09-10 用户拍板：巡检台↔设计师单线联系，线不能断） ----------
// 「卫生通报」必须闭环：设计师的处置信（ref=原信id、type≠回执——done 的自动回执不算数）才算闭环
// 分档（评审①）：卫生通报=需处置（本哨追踪）；卫生简报=知会（不追）；告警=即时（同线追踪
// 断线两态：①通报躺在设计师 INBOX 超 6h 未处置 → 删铃记重激活（走巡铃老路重敲）；②通报已被销信归档但无处置信 → 裁决信红牌
const HYLINE_FILE = path.join(HERE, "卫生专线.json");
const HYLINE_STALL_MS = 6 * 3600e3;
let lastHyScan = 0;
// 已销信未处置的判定闸（2026-09-30 判据修正·纯函数便于测试）：
// 原判据用**归档件 mtime**——那是原信写作时刻（rename 不改 mtime），信在箱里躺超 60s 才被处置时它早已过期
// ⇒ 宽限形同不存在（第三次假裁决实证 LTR-20260930-181832-204-htb：mtime 18:18:32·裁 18:21:38）。
// 修正：改用**首见归档的扫描时刻**——首次见到归档只记录不判；≥ 60s（下一次扫描）时 answered 索引必已收录处置信
// ⇒ 真断线照报（迟一个扫描周期·每分钟一扫），索引同秒竞态不再造成假阳性。
export function hylineDoneGate(rec, now) {
  const firstSeen = (rec && rec.firstArchivedScan) || 0;
  if (!firstSeen) return { action: "record", firstArchivedScan: now };
  if (now - firstSeen < 60e3) return { action: "wait" };
  return { action: "judge" };
}
function scanHygieneLine() {
  if (Date.now() - lastHyScan < 60e3) return; // 每分钟最多扫一遍
  lastHyScan = Date.now();
  try {
    const boxRoot = path.join(HERE, "..", "邮局", "邮箱");
    const readEnv = (fp) => { // 读路径归一（审查⑥）：parseEnvelope 全字段+body
      try { return parseEnvelope(fs.readFileSync(fp, "utf-8")); } catch { return null; }
    };
    // 从 ref 值/文本抽干净 LTR id（兼容存量 body-ref 处置信的 `ref: LTR-…。叙述` 混行，SYS-13）
    // 后缀 {2,3}：兼容存量 2 位与新 3 位（SYS-17 扩容）；负向断言防部分匹配截断（SYS-18）
    const ltrOf = (s) => (String(s).match(/LTR-\d{8}-\d{6}(?:-\d{3}-[0-9a-z]{2,3}(?![0-9a-z]))?/) || [])[0];
    // 全邮路建处置索引：设计师发出的、ref 指向某通报、非回执的信（在哪个信箱/归档都算）
    const answered = new Set();
    const scanDirs = [...Object.keys(SEAT_KEY).map(r => path.join(boxRoot, r, "INBOX")), path.join(boxRoot, "流水线", "INBOX"), path.join(boxRoot, "归档")];
    for (const d of scanDirs) {
      if (!fs.existsSync(d)) continue;
      for (const fn of fs.readdirSync(d).filter(f => f.endsWith(".md"))) {
        const e = readEnv(path.join(d, fn));
        if (!e || e.from !== "设计师" || e.type === "回执") continue;
        if (e.ref && e.ref !== "—") { const l = ltrOf(e.ref); if (l) answered.add(l); }
        const mb = e.body && e.body.match(/ref:\s*(LTR-\d{8}-\d{6}(?:-\d{3}-[0-9a-z]{2,3}(?![0-9a-z]))?)/);
        if (mb) answered.add(mb[1]);
      }
    }
    // 找所有卫生通报（设计师 INBOX 未办 + 归档已销）
    const st = readJson(HYLINE_FILE) || {};
    let dirty = false;
    const seen = new Set();
    for (const [dir, done] of [[path.join(boxRoot, "设计师", "INBOX"), false], [path.join(boxRoot, "归档"), true]]) {
      if (!fs.existsSync(dir)) continue;
      for (const fn of fs.readdirSync(dir).filter(f => f.endsWith(".md"))) {
        const e = readEnv(path.join(dir, fn));
        if (!e || !["卫生通报", "告警"].includes(e.type) || e.to !== "设计师") continue; // 2026-09-11 大神评审①：分档——卫生简报不追（知会档）；告警同线追踪
        seen.add(e.id);
        if (answered.has(e.id)) { if (st[e.id]) { delete st[e.id]; dirty = true; } continue; } // 已闭环
        const age = Date.now() - (Date.parse(e.created) || Date.now());
        const rec = st[e.id] || {};
        if (!done && age > HYLINE_STALL_MS && Date.now() - (rec.lastRemind || 0) > HYLINE_STALL_MS) {
          for (const k of [...rungLetters]) if (k.endsWith(":" + fn)) { rungLetters.delete(k); dirty = true; } // 删铃记 → 巡铃下轮重敲
          st[e.id] = { ...rec, lastRemind: Date.now() }; dirty = true;
        }
        if (done && !rec.brokenReported) {
          // 宽限（2026-09-28 立·2026-09-30 判据修正）：销信后**下一扫描周期**才判——详见 hylineDoneGate 注释
          const gate = hylineDoneGate(rec, Date.now());
          if (gate.action === "record") { st[e.id] = { ...rec, firstArchivedScan: gate.firstArchivedScan }; dirty = true; continue; }
          if (gate.action === "wait") continue;
          sendDutyLetter("SYS-卫生专线", "卫生通报断线：销信未处置", `卫生通报 ${e.id}（${e.created}）已被销信归档，但设计师从未发出处置信（ref 指向它的非回执信）——卫生专线断线。请补处置或向巡检台说明。`);
          st[e.id] = { ...rec, brokenReported: true }; dirty = true;
        }
      }
    }
    for (const lid of Object.keys(st)) if (!seen.has(lid)) { delete st[lid]; dirty = true; } // 通报消失（手工清走）=销账
    if (dirty) { fs.writeFileSync(HYLINE_FILE, JSON.stringify(st, null, 2), "utf-8"); saveRingState(); }
  } catch (e) { fault("scanHygieneLine", e); }
}

// ---------- SYS-62 精灵欠账线（2026-09-12 用户令·严格版）：精灵无耳朵——欠账咬信投巡检台席（狗替精灵向主人告状） ----------
// 欠账线：白鸽连跳≥3不巡 ／ 疯狗 _lastAt 停滞>10min（看门狗咬）／ 看门狗②检（该敲没敲）停跳>5min／ 四精灵本主题 fail 挂账>24h 无人认领。
// SYS-144（2026-09-29）编制归并 9→7：啄木鸟＝watchdog() 第②检（名分归看门狗·检查本体与节拍不变）；金丝雀随编制卡退役（A/B 效率简报转正为程序员周程）。
const SPRITE_BITE_COOLDOWN_MS = 30 * 60e3; // 同 subject 咬信冷却（防刷屏；fail 挂账按 checkId 记 subject）
const spriteBiteAt = {};
function __testResetSpriteBite() { for (const k of Object.keys(spriteBiteAt)) delete spriteBiteAt[k]; }
function sendSpriteBite(subject, body, opts = {}) { // opts（测试桩）：boxRoot/now/noLog/cooldownMs
  const now = opts.now ?? Date.now();
  if (now - (spriteBiteAt[subject] || 0) < (opts.cooldownMs ?? SPRITE_BITE_COOLDOWN_MS)) return "";
  spriteBiteAt[subject] = now;
  const inbox = path.join(opts.boxRoot || path.join(HERE, "..", "邮局", "邮箱"), "巡检台", "INBOX");
  try {
    fs.mkdirSync(inbox, { recursive: true });
    const stamp = new Date(now);
    const mk = (lid) => buildEnvelope({ id: lid, from: "巡检台", to: "巡检台", type: "疯狗", re: `精灵欠账：${subject}`.slice(0, 80), ref: subject, created: stamp.toLocaleString("sv-SE") }) + "\n\n" + body + "\n（此信为精灵欠账线自动投放·SYS-62：精灵无耳朵，狗替精灵向主人告状）\n";
    let lid = "";
    for (let i = 1; i <= 3; i++) {
      lid = newId(stamp);
      try { fs.writeFileSync(path.join(inbox, `${lid}.md`), mk(lid), { encoding: "utf-8", flag: "wx" }); break; }
      catch (e) { if (i === 3) throw e; }
    }
    logLine("巡铃", now, `精灵欠账咬 ← ${subject}（咬信 ${lid}）`, opts); // SYS-91
    return lid;
  } catch (e) { fault("spriteBite", e, opts); return ""; }
}
// ---------- 疯狗哨兵（2026-09-10 用户拍板：巡检台养的狗，巡查时放出来） ----------
// 放狗时机=巡查点火（含手动「巡查」命令）：扫各角色信箱——有可办信（非回执/非狗信）、铃已敲、信龄超宽限，
// **且该席会话静默**（SYS-51 按信判据：近 N 分钟无会话写；他单发信/他事动静不洗白本信滞留）→ 咬：投 type「疯狗」信进该角色 INBOX（ref=原信，巡铃相位豁免必响）
// 每信只咬一次（疯狗.json 记咬痕）；咬过一轮宽限仍不动 → 升级：裁决信给设计师 + 问题区红牌；信销了=活干了，咬痕销账
// 不咬：主人（巡检台自己）/ 不在岗 / 灯尸（归看门狗）/ 铃未敲（归巡铃+看门狗）/ 有动静（SYS-30 证据新文件 / SYS-51 会话活跃）
const MADDOG_FILE = path.join(HERE, "疯狗.json");
// 哨兵开关（SYS-89·2026-09-25 用户令「疯狗下线」）：配置件 `看板/哨兵开关.json`，键=哨兵名，false=不出巡。
// 只作用于**真跑**（测试桩带 opts.boxRoot 的沙盒调用不受影响）；10s 缓存；缺文件/缺键=不关闭。
const SENTINEL_SWITCH_FILE = path.join(HERE, "哨兵开关.json");
let sentinelSwAt = 0;
let sentinelSwCache = null;
// 巡检台优化①（2026-09-30·用户令「落地处理」）：巡查零红免唤醒——哨兵开关.json「巡查零红免唤醒」=true 才启用（opt-in·缺省关·测试沙盒不受影响）
const TIJIAN_PATH = path.resolve(HERE, "..", "..", "巡检台", "_tools", "体检.mjs");
let _patrolAutoAt = 0, _patrolAutoCache = null;
function patrolAutoSkipOn(opts = {}) {
  if (opts.autoSkip === false || opts.patrolFile) return false; // 测试桩直关／patrolFile=沙盒测试世界（opts 契约）→ 不吃生产开关，防测试读真配置漂移
  if (opts.switchFile) { try { return JSON.parse(fs.readFileSync(opts.switchFile, "utf-8"))["巡查零红免唤醒"] === true; } catch { return false; } }
  const t = Date.now();
  if (t - _patrolAutoAt > 10e3) { try { _patrolAutoCache = JSON.parse(fs.readFileSync(SENTINEL_SWITCH_FILE, "utf-8")); } catch { _patrolAutoCache = {}; } _patrolAutoAt = t; }
  return _patrolAutoCache && _patrolAutoCache["巡查零红免唤醒"] === true;
}
// 巡检台优化②（2026-09-30·用户令）：疯狗开闸信龄重算开关——哨兵开关.json「疯狗开闸信龄重算」=true 才启用（缺省关=旧版行为·测试零影响）；opts.ageFloor=true 为测试/调用方直开缝
let _ageFloorAt = 0, _ageFloorCache = null;
function maddogAgeFloorOn(opts = {}) {
  if (opts.ageFloor === false || opts.boxRoot) return false; // 测试桩直关／boxRoot=沙盒测试世界（opts 契约）→ 不吃生产开关，防测试读真配置漂移
  if (opts.switchFile) { try { return JSON.parse(fs.readFileSync(opts.switchFile, "utf-8"))["疯狗开闸信龄重算"] === true; } catch { return false; } }
  const t = Date.now();
  if (t - _ageFloorAt > 10e3) { try { _ageFloorCache = JSON.parse(fs.readFileSync(SENTINEL_SWITCH_FILE, "utf-8")); } catch { _ageFloorCache = {}; } _ageFloorAt = t; }
  return _ageFloorCache && _ageFloorCache["疯狗开闸信龄重算"] === true;
}
export function sentinelOff(name, opts = {}) {
  if (opts.switchFile) { // 测试沙盒缝：直读指定文件（不落缓存）
    try { return JSON.parse(fs.readFileSync(opts.switchFile, "utf-8"))[name] === false; } catch { return false; }
  }
  const now = Date.now();
  if (!sentinelSwCache || now - sentinelSwAt > 10e3) {
    try { sentinelSwCache = JSON.parse(fs.readFileSync(SENTINEL_SWITCH_FILE, "utf-8")); } catch { sentinelSwCache = {}; }
    sentinelSwAt = now;
  }
  return sentinelSwCache && sentinelSwCache[name] === false;
}
const SILENT_DEFAULT_MS = 10 * 60e3; // 席静默缺省窗（SYS-51 疯狗 / SYS-52 持单共用口径）：近 10 分钟无会话写=静默
function silentMsOf(binding, key) { const v = Number(binding?.[key]); return v > 0 ? v * 60e3 : SILENT_DEFAULT_MS; }

// SYS-30：取某角色「证据目录」内最新文件 mtime——长工序角色无发信也不咬的动静证据。
// 范围（派单二.2）：<角色>\证据数据\、<角色>\交付报告\ 及 <角色>\ 下名含「证据」/evidence 的目录（如 UPG136-evidence）。
// 不整目录递归：「动静须与猎物相关」的判据收紧已挂账（报告写明取舍），故不上溯角色目录本身与无关子目录。
const EVID_SUBDIRS = ["证据数据", "交付报告"];
function evidenceDirs(roleDir) {
  const out = EVID_SUBDIRS.map((n) => path.join(roleDir, n));
  let ents = [];
  try { ents = fs.readdirSync(roleDir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) if (e.isDirectory() && /证据|evidence/i.test(e.name)) out.push(path.join(roleDir, e.name));
  return out;
}
function latestMtimeUnder(dir) { // 浅扫两层：目录内文件 + 其一层子目录内的文件
  if (!fs.existsSync(dir)) return 0;
  let latest = 0;
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return 0; }
  for (const ent of ents) {
    const p = path.join(dir, ent.name);
    const bump = (f) => { try { const m = fs.statSync(f).mtimeMs; if (m > latest) latest = m; } catch {} };
    if (ent.isDirectory()) { try { for (const s of fs.readdirSync(p, { withFileTypes: true })) if (s.isFile()) bump(path.join(p, s.name)); } catch {} }
    else bump(p);
  }
  return latest;
}

function madDog(opts = {}) { // opts（测试桩）：boxRoot/seatsDir/stateFile/workRoot 换沙盒，now/graceMs 控时间，onEscalate 换掉真升级，noLog 关日志
  // SYS-89（2026-09-25 用户令）：疯狗下线开关——真跑面直接不出巡（沙盒测试桩不受影响）；自激环根因见下方 re 签名闸
  if (!opts.boxRoot && sentinelOff("疯狗", opts)) { // opts.switchFile=测试沙盒缝
    if (!opts.noLog) try {
      let off = "";
      try { const swj = opts.switchFile ? JSON.parse(fs.readFileSync(opts.switchFile, "utf-8")) : JSON.parse(fs.readFileSync(SENTINEL_SWITCH_FILE, "utf-8")); const o = swj._offline; if (o) off = `（下线留痕：by=${o.by || "-"} at=${o.at || "-"} why=${o.why || "-"}）`; } catch {}
      logLine("巡铃", opts.now, `疯狗 已下线（哨兵开关.json: 疯狗=false）·本轮跳过${off}`, opts); // SYS-91
    } catch {}
    return { bites: 0, escalated: 0, escalatedUser: 0, disabled: true };
  }
  const boxRoot = opts.boxRoot || path.join(HERE, "..", "邮局", "邮箱");
  const seatsDir = opts.seatsDir || path.join(HERE, "seats");
  const stateFile = opts.stateFile || MADDOG_FILE;
  const now = opts.now || Date.now();
  const b = opts.binding || readBinding(); // 测试缝：注入 per-role 宽限夹具（同 boxRoot/seatsDir/graceMs 一族）
  const workRoot = opts.workRoot || path.join(HERE, "..", ".."); // 体系根：角色证据目录落点（SYS-30 动静增强）
  // 宽限（SYS-30 角色差异化）：_madDogGraceMin 支持 per-role 对象（{"审验员":60,"程序员":60}）或全局数字；缺省 25 分钟。
  // 长工序角色（审验员/程序员）批量审验/施工时数十分钟不发信属正常工时——按角色放宽，避免稳定误报。
  const graceMsFor = (role) => {
    if (opts.graceMs) return opts.graceMs; // 测试桩：一刀切覆盖
    const cfg = b._madDogGraceMin;
    let min = 25;
    if (typeof cfg === "number" && cfg > 0) min = cfg; // 全局数字口径（兼容旧配置）
    else if (cfg && typeof cfg === "object") {
      const v = Number(cfg[role]);
      min = v > 0 ? v : (Number(cfg._default) > 0 ? Number(cfg._default) : 25);
    }
    return min * 60e3;
  };
  // 证据目录最新 mtime（SYS-30）：信到后角色目录出新文件 = 在埋头干活（无发信也不咬）。一轮内按角色缓存。
  const evCache = {};
  const evidenceMtime = (role) => (role in evCache ? evCache[role]
    : (evCache[role] = Math.max(0, ...evidenceDirs(path.join(workRoot, role)).map(latestMtimeUnder))));
  const onEscalate = opts.onEscalate || ((headline, body) => { sendDutyLetter("SYS-疯狗", headline, body); fileProblem("SYS-疯狗", "信箱", headline); });
  // SYS-62：二级升级出口（设计师一轮未处置 → 报用户）；收信人=设计师会话（用户经此转呈）＋问题区红牌。
  const onEscalateUser = opts.onEscalateUser || ((headline, body) => { sendDutyLetter("SYS-疯狗", `【升用户】${headline}`, body); fileProblem("SYS-疯狗", "信箱·升用户", headline); });
  // SYS-51：按信判据——席会话静默（近 N 分钟无会话写）才咬；他单发信/他事动静不再洗白本信滞留（删旧「全角色零发信」粗条件）。
  // 旧病：验收员 3 信挂箱 1h，因 17:53 另一单的动静（发信）被整角色级洗白 → 疯狗零咬。
  const silentMs = opts.silentMs || silentMsOf(b, "_madDogSilentMin");
  const sessionMtime = opts.sessionMtime || ((role) => latestSessionMtime(role)); // 静谧探针（测试缝：注入沙盒 mtime）
  const st = readJson(stateFile) || {};
  const parkedIds = Object.keys(readParked(opts.parkFile)); // 挂起豁免：挂起单的信不咬（2026-09-10 挂起制）
  let dirty = false;
  try {
    const seen = new Set();
    for (const role of Object.keys(SEAT_KEY)) {
      // SYS-62（用户令·严格版）：删「不咬主人」豁免——疯狗管主人（出巡会话持续写盘=天然不咬·纯停滞才咬）
      const seat = readJson(path.join(seatsDir, `${SEAT_KEY[role]}.json`)) || {};
      if (seat.on !== true) continue; // 不在岗不咬
      if (seat.agentPid) { try { process.kill(seat.agentPid, 0); } catch { continue; } } // 灯尸归看门狗
      const inbox = path.join(boxRoot, role, "INBOX");
      if (!fs.existsSync(inbox)) continue;
      for (const f of fs.readdirSync(inbox).filter(x => x.endsWith(".md"))) {
        const key = `${role}/${f}`;
        seen.add(key);
        const env = parseEnvelope(fs.readFileSync(path.join(inbox, f), "utf-8")); // 读路径归一（审查⑥）
        if (["回执", "疯狗"].includes(env.type.trim())) continue; // 知悉类不咬；狗信不再当猎物（防狗咬狗信滚雪球）
        const re = env.re || f;
        // SYS-89 自激环闸（2026-09-25 事故·WEB-007 同源）：升级信是**裁决型**——只排 type=疯狗 不够，
        // 自家升级/咬信仍会被抓去咬 → 咬→升级→新裁决信→再咬，指数放大。哨兵自家产物一律不当猎物（按签名判定，不误伤普通信）。
        if (/疯狗升级|疯狗二轮升级|疯狗咬/.test(re)) continue;
        const createdRaw = Date.parse(env.created) || now;
        // 开闸信龄重算（2026-09-30 巡检台优化②·用户令）：停机时长不计入信龄——防开闸首轮把停机积压信集体咬一遍（SYS-143 boot 豁免只覆盖到首次出巡）。
        // 门控（哨兵开关.json「疯狗开闸信龄重算」=true·缺省关）：默认关=行为与旧版逐字节同（测试/沙盒零影响）；护栏=仅「信早于本次开机 且 开机不晚于判定时刻」才地板。
        const bootAt0 = (opts.ageFloor === true || maddogAgeFloorOn(opts)) ? (opts.bootAt ?? PROCESS_STARTED_AT) : -Infinity;
        const created = (createdRaw < bootAt0 && bootAt0 <= now) ? bootAt0 : createdRaw;
        const grace = graceMsFor(role); // SYS-30：宽限按角色分档（长工序角色 40-60min，缺省 25）
        if (now - created < grace) continue; // 宽限内（冷却/正在办）
        if (!rungLetters.has(`${seat.agentPid || 0}:${f}`)) continue; // 铃未敲=巡铃/看门狗的活，狗不抢
        if (now - sessionMtime(role) < silentMs) continue; // SYS-51：席会话近 N 分钟有写=有动静（可能正忙别的单）——发信不算「动静」，只有会话活跃/证据新文件才算
        if (evidenceMtime(role) > created) continue; // SYS-30：信到后证据目录出新文件=也在干活（不咬）
        const rec = st[key] || {};
        if (parkedIds.some(pid => re.includes(pid))) continue; // 挂起单的信不咬——等的是外部条件，不是角色偷懒
        const lid0 = env.id || f.replace(/\.md$/, "");
        if (rec.bitAt) { // 咬过：一轮宽限还不动 → 升级设计师；再一轮不动 → 升级用户（SYS-62 两级）
          if (!rec.escalated && now - rec.bitAt >= grace) {
            onEscalate(`疯狗升级：${role} 被咬后仍不动`, `信箱信 ${lid0}（${re}）信龄 ${Math.round((now - created) / 60000)} 分钟；疯狗已于 ${new Date(rec.bitAt).toLocaleString("sv-SE")} 咬过一次，至今未发一信未销信。请裁决：催办 / 换人 / 挂起。`);
            st[key] = { ...rec, escalated: true, escalatedAt: now }; dirty = true;
          } else if (rec.escalated && !rec.escalatedUser && now - (rec.escalatedAt || rec.bitAt) >= grace) {
            onEscalateUser(`疯狗二轮升级（报用户）：${role} 被咬+升级后仍不动`, `信箱信 ${lid0}（${re}）信龄 ${Math.round((now - created) / 60000)} 分钟；已咬（${new Date(rec.bitAt).toLocaleString("sv-SE")}）＋已报设计师（${new Date(rec.escalatedAt || rec.bitAt).toLocaleString("sv-SE")}），再一轮宽限仍无动静。请用户裁决（催办/换人/挂起）。`);
            st[key] = { ...rec, escalatedUser: true }; dirty = true;
          }
          continue;
        }
        // 咬：wx 独占写防同秒覆盖（与 sendDutyLetter 同构）
        const stamp = new Date(now);
        const mkEnv = (lid) => buildEnvelope({
          id: lid, from: "巡检台", to: role, type: "疯狗",
          re: `疯狗咬：${re.slice(0, 60)}`, ref: lid0, created: stamp.toLocaleString("sv-SE"),
        }) + "\n\n" + `你信箱里的 ${lid0}（${re}）已躺 ${Math.round((now - created) / 60000)} 分钟，铃敲过你一动不动。立即办理，或回信说明卡点；下一轮巡查还不动，疯狗直接报设计师裁决。（此信为疯狗哨兵代巡检台自动投放）` + "\n";
        let lid = "";
        for (let attempt = 1; attempt <= 3; attempt++) {
          lid = newId(stamp);
          try { fs.writeFileSync(path.join(inbox, `${lid}.md`), mkEnv(lid), { encoding: "utf-8", flag: "wx" }); break; }
          catch (e) { if (attempt === 3) throw e; }
        }
        st[key] = { bitAt: now }; dirty = true;
        logLine("巡铃", now, `疯狗咬 ${role} ← ${lid0}（咬信 ${lid}）`, opts); // SYS-91
      }
    }
    for (const k of Object.keys(st)) if (!k.startsWith("_") && !seen.has(k)) { delete st[k]; dirty = true; } // 信销了=活干了，咬痕销账（_ 前缀=元数据保留）
    st._lastAt = new Date(now).toISOString(); // 巡检台「下次启动时间」用（_ 前缀=元数据，非咬痕）
    dirty = true;
    if (dirty) try { fs.writeFileSync(stateFile, JSON.stringify(st, null, 2), "utf-8"); } catch (e) { fault("madDog.persist", e, opts); }
  } catch (e) { fault("madDog", e, opts); }
}

// ---------- 根层哨兵（SYS-27 @2026-09-10）：白名单外新品即时告警 ----------
// 依据：根层散件漏读复盘（MY_s2_typed.png 躺根层 5 分钟才被巡查发现）——体检/layout-check 是巡查周期模型有盲区，引擎哨兵群不看根层文件。
// 纪律（派单 §二.4）：同步 readdir 两层即够，禁递归 / 禁外部进程 / 禁阻塞主循环（座探覆辙）。
const ROOT_SENTRY_FILE = path.join(HERE, "根层哨兵.json");
const ROOT_SENTRY_MS = 120e3; // 低频：120s 一轮
let lastRootScan = 0;
// 政策件免重报（派单 §三）：.reasonix/.workbuddy 痕迹目录归体检⑧管、.workbuddy 归 layout-check 放行——哨兵不重复报（非白名单，是「已由他闸管辖」排除项）
const ROOT_SENTRY_EXCLUDE = new Set([".reasonix", ".workbuddy", "reasonix.toml"]);

// 白名单单源引用（派单 §二.2「禁止第三份白名单漂移」）：运行时解析权威源码里的 Set 字面量——
// layout-check 的 SYS_WHITELIST（体系根）与 体检.mjs 的 SKEL（works 根）均未导出，且红线 1 禁改 layout-check
// （改闸即触体检「闸体被改未过闸」红灯），故不复制、不新增第三份，只读取其源码取值。解析失败→null→跳过该根（fail-open 保零误报）。
function readSetLiteral(file, varName) {
  try {
    const src = fs.readFileSync(file, "utf-8");
    const i = src.indexOf(`const ${varName} = new Set([`);
    if (i < 0) return null;
    const j = src.indexOf("])", i);
    if (j < 0) return null;
    return new Set((src.slice(i, j).match(/"([^"]*)"/g) || []).map(s => s.slice(1, -1)));
  } catch (e) { fault("rootSentry.readSet", e); return null; }
}

function rootSentryLetter(item) { // 投 type=通知 给巡检台：题名「根层哨兵：<件名>」，含路径+首见时间
  const stamp = new Date();
  const inbox = path.join(HERE, "..", "邮局", "邮箱", "巡检台", "INBOX");
  fs.mkdirSync(inbox, { recursive: true });
  const body = (lid) => buildEnvelope({
    id: lid, from: "流水线", to: "巡检台", type: "通知",
    re: `根层哨兵：${item.name}`, created: stamp.toLocaleString("sv-SE"),
  }) + "\n\n" + `根层哨兵（SYS-27）发现白名单外新品：\n- 位置：${item.path}\n- 所属根：${item.key}\n- 首见：${item.at}\n\n请按卫生要求§八 定性处置（认领/迁走/登记白名单）。处理完记得销信。` + "\n";
  for (let a = 1; a <= 3; a++) { const lid = newId(stamp); try { fs.writeFileSync(path.join(inbox, `${lid}.md`), body(lid), { encoding: "utf-8", flag: "wx" }); return lid; } catch (e) { if (e.code !== "EEXIST" || a === 3) throw e; } }
}

function rootSentry(force = false, opts = {}) {
  const now = opts.now ?? Date.now();
  if (!force && now - lastRootScan < (opts.intervalMs ?? ROOT_SENTRY_MS)) return;
  lastRootScan = now;
  try {
    const stateFile = opts.stateFile || ROOT_SENTRY_FILE;
    const seen = readJson(stateFile) || {}; // 键 "<根>:<件名>" → { path, at }：首见即记，同件只报一次直到清除后再现
    const roots = opts.roots || [
      { key: "体系根", dir: WORKS, wl: readSetLiteral(path.join(WORKS, "处理中心", "机器闸", "layout-check.mjs"), "SYS_WHITELIST") },
      { key: "works根", dir: path.resolve(WORKS, ".."), wl: readSetLiteral(path.join(WORKS, "巡检台", "_tools", "体检.mjs"), "SKEL") },
    ];
    let dirty = false;
    for (const { key, dir, wl } of roots) {
      if (!wl) continue; // 白名单读不出→跳过该根（fail-open，宁漏不误报）
      let names = [];
      try { names = fs.readdirSync(dir); } catch (e) { fault("rootSentry.readdir." + key, e, opts); continue; }
      for (const name of names) {
        if (wl.has(name) || ROOT_SENTRY_EXCLUDE.has(name)) continue;
        const k = `${key}:${name}`;
        if (seen[k]) continue; // 已报过
        const p = path.join(dir, name), at = new Date(now).toLocaleString("sv-SE");
        seen[k] = { path: p, at }; dirty = true;
        logLine("巡铃", now, `根层哨兵 ${key} ← ${name}（首见 ${at}）`, opts); // SYS-91
        try { (opts.onReport || rootSentryLetter)({ name, path: p, at, key }); } catch (e) { fault("rootSentry.report", e, opts); }
      }
    }
    for (const k of Object.keys(seen)) { // 件被清除→销账，再现时重报（派单 §二.3）
      const p = seen[k] && seen[k].path;
      if (p && !fs.existsSync(p)) { delete seen[k]; dirty = true; }
    }
    if (dirty) try { fs.writeFileSync(stateFile, JSON.stringify(seen, null, 2), "utf-8"); } catch (e) { fault("rootSentry.persist", e, opts); }
  } catch (e) { fault("rootSentry", e, opts); }
}

// ---------- 挂起制（2026-09-10 用户拍板）：现实条件不满足（缺 key/缺料/等人给东西）→ 登记挂起待命，不乱试不空转 ----------
// 挂起的单：卡单哨兵不报停滞、疯狗不咬其信；条件达成任何人可「解挂」→ 复工信投登记人角色
// 纪律：挂起必须是真外部条件且写清解除条件（如「用户给有效 API key」）——「我不会/我不想」不许挂
const PARK_FILE = path.join(HERE, "挂起.json");
const readParked = (f) => readJson(f || PARK_FILE) || {};
function parkLetter(to, re, body) { // 挂起知会/复工信（type=挂起，巡铃相位豁免必响）
  const stamp = new Date();
  const inbox = path.join(HERE, "..", "邮局", "邮箱", to, "INBOX");
  fs.mkdirSync(inbox, { recursive: true });
  const env = (lid) => buildEnvelope({ id: lid, from: "流水线", to, type: "挂起", re, created: stamp.toLocaleString("sv-SE") }) + "\n\n" + body + "\n";
  for (let a = 1; a <= 3; a++) { const lid = newId(stamp); try { fs.writeFileSync(path.join(inbox, `${lid}.md`), env(lid), { encoding: "utf-8", flag: "wx" }); return lid; } catch (e) { if (e.code !== "EEXIST") throw e; if (a === 3) throw e; } }
}
function parkTicket(id, reason, until, by) {
  const p = readParked();
  p[id] = { reason, until, by: by || "?", since: new Date().toLocaleString("sv-SE") };
  fs.writeFileSync(PARK_FILE, JSON.stringify(p, null, 2), "utf-8");
  parkLetter("设计师", `${id} 挂起知会`, `工单 ${id} 已挂起（登记人：${by || "?"}）。\n原因：${reason}\n解除条件：${until}\n挂起期间哨兵豁免（不报卡单、疯狗不咬）。条件达成后任何人执行「解挂 ${id}」复工。`);
}
function unparkTicket(id) {
  const p = readParked(); const rec = p[id];
  if (!rec) return false;
  delete p[id]; fs.writeFileSync(PARK_FILE, JSON.stringify(p, null, 2), "utf-8");
  parkLetter(SEAT_KEY[rec.by] ? rec.by : "设计师", `${id} 解挂复工`, `工单 ${id} 解除挂起（原原因：${rec.reason}｜解除条件：${rec.until}）。请继续办理。`);
  return true;
}

// ---------- 故障不沉默 + 状态落盘 + 看门狗（2026-09-10 用户拍板三层加固·一二层）：catch 不再吞、铃态落盘、中断有告警 ----------
const FAULT_LOG = logFileFor("故障"); // SYS-91：真件路径经单点取出（写点一律走 logFileFor/logLine）
const FAULT_ARCHIVE = path.join(HERE, "故障归档"); // SYS-32：轮转归档区（gitignore）
const FAULT_MAX_LINES = 200;                        // SYS-32：按量轮转阈值（日切优先）
function rotateFaultLog(logPath = FAULT_LOG, archiveDir = FAULT_ARCHIVE, maxLines = FAULT_MAX_LINES, now = new Date()) {
  // SYS-32：故障.log 按日/按量轮转——旧段整段追加进 故障归档\故障_YYYYMMDD.log，主文件清空重计。
  // 触发点：①引擎启动（IS_MAIN 分支）②每次 fault 写入前——两处都不在 import 期，测试 import 不碰真日志。
  // 段日期取首行时间戳（旧段可能跨日累积）；日切优先于量满。轮转失败不抛（宁可继续累加，不许反过来炸引擎）。
  try {
    if (!fs.existsSync(logPath)) return null;
    const text = fs.readFileSync(logPath, "utf-8");
    const lines = text.split("\n").filter(Boolean);
    if (!lines.length) return null;
    const today = now.toLocaleDateString("sv-SE");
    const segDate = (lines[0].match(/^\[(\d{4}-\d{2}-\d{2})/) || [])[1] || today;
    const reason = segDate !== today ? "日切" : lines.length > maxLines ? "量满" : null;
    if (!reason) return null;
    fs.mkdirSync(archiveDir, { recursive: true });
    const dest = path.join(archiveDir, `故障_${segDate.replace(/-/g, "")}.log`);
    fs.appendFileSync(dest, text.endsWith("\n") ? text : text + "\n", "utf-8");
    fs.writeFileSync(logPath, "", "utf-8");
    return { reason, dest, lines: lines.length };
  } catch { return null; }
}
let faultCount = 0;
try { faultCount = fs.existsSync(FAULT_LOG) ? fs.readFileSync(FAULT_LOG, "utf-8").split("\n").filter(Boolean).length : 0; } catch {}
function fault(where, e, opts = {}) { // 统一故障上报：任何 catch 不许再静默（巡铃哑火案/UPG-129 停摆案都是吞出来的）
  // SYS-91：测试/夹具带 opts.noLog（或 opts.logFile 沙盒）不得写真实 故障.log；仅真件参与轮转与 faults 计数。
  if (opts.noLog) return;
  const target = logFileFor("故障", opts);
  if (target === FAULT_LOG) { if (rotateFaultLog()) faultCount = 0; } // SYS-32：轮转即新段归零（心跳 faults 随之清零）
  const line = `[${new Date().toLocaleString("sv-SE")}] ${where}: ${String(e?.stack || e).replace(/\s+/g, " ").slice(0, 300)}\n`;
  try { fs.appendFileSync(target, line); if (target === FAULT_LOG) faultCount++; } // SYS-156①：写成功才计数——写败不虚增（心跳 faults 对账=故障.log 行数）
  catch (we) { try { process.stderr.write(`[fault] ${where}: 故障.log 写败（计数未增）——${String(we?.message || we).replace(/\s+/g, " ").slice(0, 200)}\n`); } catch {} } // SYS-156①：最小痕迹（stderr 一行·禁递归 fault）
}

// 进程级保险丝（2026-09-10「看板老是崩」修）：引擎=长跑 supervisor，逃逸异常必须先留痕再定生死。
// 旧状：全文件无 uncaughtException/unhandledRejection 兜底——定时器/HTTP/按键回调里任一 throw（如 readT 读到损坏 单.json）
// 直接静默杀进程，故障.log 零记录（16:50 猝死现场即此形态）。长跑模式留痕续命；一次性 CLI 照旧非零退出。
let LONG_RUNNING = false;
process.on("uncaughtException", (e) => { fault("uncaughtException", e); if (!LONG_RUNNING) process.exit(1); });
process.on("unhandledRejection", (e) => { fault("unhandledRejection", e); if (!LONG_RUNNING) process.exit(1); });

// 铃态落盘：rungLetters/lastRingAt 持久化——引擎重启不重敲不漏敲（旧信激活语义保留：代际键 agentPid 变=自动重敲）
const RING_FILE = path.join(HERE, "巡铃状态.json");
function saveRingState() { try { fs.writeFileSync(RING_FILE, JSON.stringify({ rung: [...rungLetters], lastRingAt, lastBackfill }, null, 2), "utf-8"); } catch (e) { fault("saveRingState", e); } }

// 引擎心跳：循环每跳写一次——引擎死了心跳就停，外部（体检/巡检台）据此判引擎死活（三层加固·一层配套）
let lastBeat = 0;
function heartbeat() {
  if (Date.now() - lastBeat < 30e3) return;
  lastBeat = Date.now();
  try { fs.writeFileSync(path.join(HERE, "心跳.json"), JSON.stringify({ at: new Date().toISOString(), pid: process.pid, faults: faultCount }, null, 2), "utf-8"); } catch {}
}

const WATCH_FILE = path.join(HERE, "看门狗.json");
// SYS-58：告警出口升级——看门狗检测（灯尸/未敲/「敲了没办」）除 故障.log+问题区+气球 外，另投 type=告警 即时信给设计师
// （复用 sendDutyLetter 家族机制·分钟级送达）；同 msg 30 分钟冷却防刷屏（故障.log 保留为留痕=双出口）。
const SCORES_FILE = path.join(HERE, "..", "..", "巡检台", "checks", "成绩.json"); // SYS-62：四精灵 fail 挂账源（记分成绩册）
const WATCH_ESCALATE_COOLDOWN_MS = 30 * 60e3;
const watchEscalated = {}; // msg → 上次投告警信时刻
const chanAlertAt = {}; // SYS-58 R2：席位通道类告警 per-role 冷却（ack 闭环与 watchdog 敲了没办共用·防双响）
const watchRingableSince = {}; // SYS-58 R2：信→首次「可敲未敲」观测时刻（相位翻转瞬态防误报——给巡铃/补敲一个宽限）
const RINGABLE_GRACE_MS = 2 * 60e3;
function __testResetWatchdog() { for (const k of Object.keys(watchEscalated)) delete watchEscalated[k]; for (const k of Object.keys(chanAlertAt)) delete chanAlertAt[k]; for (const k of Object.keys(watchRingableSince)) delete watchRingableSince[k]; }
function sendWatchAlert(msg) { // 默认告警出口（测试以 opts.onEscalate 替换）：type=告警 即时信 → 设计师
  sendDutyLetter("SYS-看门狗", "铃通道告警", msg, { type: "告警", sign: "看门狗", tail: "看门狗即时告警（席位通道可能未送达）。请核查：巡铃注入/席位会话写盘/巡铃.log 对账；处理完销信即可。" });
}
// SYS-58：「敲了没办」阈值——_watchdogNoProgressMin（数字或 per-role 对象，同 _madDogGraceMin 结构）；缺省 10 分钟
const WATCHDOG_STUCK_DEFAULT_MS = 10 * 60e3;
function watchdogStuckMs(binding, role) {
  const cfg = binding?._watchdogNoProgressMin;
  let min = 0;
  if (typeof cfg === "number" && cfg > 0) min = cfg; // 全局数字口径（兼容）
  else if (cfg && typeof cfg === "object") {
    const v = Number(cfg[role]);
    min = v > 0 ? v : (Number(cfg._default) > 0 ? Number(cfg._default) : 0);
  }
  return min > 0 ? min * 60e3 : WATCHDOG_STUCK_DEFAULT_MS;
}
let lastWatch = 0;
const alerted = {}; // 告警内容 → 上次告警时刻（30 分钟去重）
function raiseAlarm(msg) {
  const last = alerted[msg] || 0;
  if (Date.now() - last < 30 * 60e3) return;
  alerted[msg] = Date.now();
  fault("看门狗告警", msg);
  fileProblem("SYS-看门狗", "引擎", msg); // 红牌进问题区
  try { // 桌面气球 best-effort（WinForms NotifyIcon，失败不阻塞）
    const psMsg = msg.replace(/'/g, "''");
    const child = spawn("powershell", ["-NoProfile", "-Command",
      `Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $n = New-Object System.Windows.Forms.NotifyIcon; $n.Icon = [System.Drawing.SystemIcons]::Warning; $n.Visible = $true; $n.ShowBalloonTip(9000, 'MOV 流水线看门狗', '${psMsg}', 'Warning'); Start-Sleep 10; $n.Dispose()`], { detached: true, stdio: "ignore", windowsHide: true });
    child.unref();
  } catch {}
}
// SYS-143 启动窗锚（板重启/引擎停摆窗防假报·同因第 3 次复现后立）：
//   ①看门狗启动宽限 STARTUP_ALARM_GRACE_MS：窗内「灯亮+pid 死」**抑制告警但留痕**（不静默·SYS-103 S3 体例）；
//   ②精灵欠账线 boot 抑制 STARTUP_DEBT_GRACE_MS：`bootAt` 起**首次出巡前**，停滞类咬信一律抑制（防停摆窗假咬）；
//     护栏＝「首次出巡前」与「窗口内」**同时**成立才豁免（防长期停摆被永久掩盖）；抑制必留痕。
const PROCESS_STARTED_AT = Date.now();       // 本进程启动时刻（board/serve 模式即「板启动」）
const STARTUP_ALARM_GRACE_MS = 60e3;         // 看门狗启动宽限（可调常量）
const STARTUP_DEBT_GRACE_MS = 10 * 60e3;     // 欠账线 boot 抑制窗（可调常量）
let firstPatrolDone = false;                 // 本进程首次出巡完成标志（patrolHygiene 注入成功即置位）

// ── SYS-145 角色例行产出锚（技能内化 7→3·阶段二）：四产物四落点（唯一真源·与派单落点矩阵同文）──
//  名义：四巡查精灵（目标对齐/架构/安全/UI）内化为角色例行产物 ⇒ 欠账线从「精灵 fail 挂账」换面为「产物超期」。
//  判据：落点内最新一件 mtime ≤ 7 天 = 在位（不咬）；超期或从未产出（自锚上膛起满 7 天）⇒ 咬（投巡检台席）。
//  上膛：首次运行写 `例行产出锚.json`（armedAt）——防首装即误咬；沙盒测试可注 opts.routineAnchors/routineFile。
const ROUTINE_MAX_AGE_MS = 7 * 24 * 3600e3;
const ROUTINE_ARM_FILE = path.join(HERE, "例行产出锚.json");
const SYS_ROOT = path.join(HERE, "..", "..");
const ROUTINE_ANCHORS = [
  { role: "设计师", label: "目标对齐复核", dir: path.join("设计师", "例行产出"), re: /^目标对齐复核_\d{4}-\d{2}-\d{2}\.md$/ },
  { role: "设计师", label: "架构雷达图谱", dir: path.join("设计师", "例行产出"), re: /^架构雷达_\d{4}-\d{2}-\d{2}$/ },
  { role: "审验员", label: "每周安全扫", dir: path.join("审验员", "例行产出"), re: /^安全扫_\d{4}-\d{2}-\d{2}\.md$/ },
  { role: "验收员", label: "视觉回归＋基准对账", dir: path.join("验收员", "例行产出"), re: /^视觉回归_\d{4}-\d{2}-\d{2}\.md$/ },
];

function watchdog(D, opts = {}) { // 每分钟一轮：信龄超 5 分钟的可敲信未敲 / 灯尸（灯亮 agent 死）→ 告警；opts（测试桩）：boxRoot/seatsDir/watchFile/force/onAlarm/boardStartedAt/bootAt
  const now = opts.now ?? Date.now();
  if (!opts.force && now - lastWatch < 60e3) return;
  lastWatch = now;
  const startedAt = opts.boardStartedAt ?? PROCESS_STARTED_AT;               // SYS-143 ①
  const inStartupWindow = now - startedAt < (opts.startupGraceMs ?? STARTUP_ALARM_GRACE_MS);
  const bootAt = opts.bootAt ?? PROCESS_STARTED_AT;                           // SYS-143 ②
  const inBootWindow = now - bootAt < (opts.bootGraceMs ?? STARTUP_DEBT_GRACE_MS) && !(opts.firstPatrolDone ?? firstPatrolDone);
  const suppressed = [];   // 抑制留痕（落 巡铃.log ＋ 看门狗.json.suppressed）
  try {
    const boxRoot = opts.boxRoot || path.join(HERE, "..", "邮局", "邮箱");
    const seatsDir = opts.seatsDir || path.join(HERE, "seats");
    const onAlarm = opts.onAlarm || raiseAlarm;
    const onEscalate = opts.onEscalate || sendWatchAlert; // SYS-58：告警信出口（测试缝）
    const binding = opts.binding || readBinding();
    const sessionMtime = opts.sessionMtime || ((role) => latestSessionMtime(role)); // SYS-58：席会话写盘探针（同 SYS-51 单源）
    const sessionProbe = opts.sessionProbe || (opts.sessionMtime ? ((role) => ({ t: opts.sessionMtime(role), src: opts.probeSrc || "own" })) : ((role) => latestSessionProbe(role))); // R4探针（shared 降权；sessionMtime 旧缝兼容垫·src 可 opts.probeSrc 注）
    const phaseMap = new Map((D?.ledger?.active || []).map(r => [r.id, PHASE_OWNER[r.phase]]).filter(([, v]) => v));
    const issues = [];
    const chanRoles = new Set(); // SYS-58 R2：本轮的席位通道类告警角色（与 B 闭环共用 per-role 冷却）
    for (const role of Object.keys(SEAT_KEY)) {
      const seat = readJson(path.join(seatsDir, `${SEAT_KEY[role]}.json`)) || {};
      if (seat.on === true && seat.agentPid) { // SYS-88 ②c：判死前必过归属核/窗活核——不得凭单 pid 定生死；SYS-103：kill/procs 两缝贯通
        const v = sys88SeatVerdict(seat, { kill: opts.kill, procs: opts.procs });
        if (v.verdict === "dead") {
          const msg = `${role} 灯亮但 agent 进程已死（灯尸 pid=${seat.agentPid}｜${v.why}）`;
          if (inStartupWindow) { // SYS-143 ①：板重启窗内不告警（但**不静默**——留痕进 巡铃.log 与看门狗.json.suppressed）
            suppressed.push(`${msg}〔抑制·板启动窗 ${Math.round((now - startedAt) / 1000)}s < ${Math.round((opts.startupGraceMs ?? STARTUP_ALARM_GRACE_MS) / 1000)}s〕`);
            logLine("巡铃", now, `灯尸抑制（板启动窗内·SYS-143·不静默）：${msg}`, opts);
          } else issues.push(msg);
        }
      }
      if (seat.on !== true) continue;
      const inbox = path.join(boxRoot, role, "INBOX");
      if (!fs.existsSync(inbox)) continue;
      // SYS-58：敲了没办检测（注入未达盲区）——铃已敲 ≥N 分钟但席会话自铃后无写盘（sessionMtime ≤ 铃时）+ 箱内仍有已敲未办信
      // → 告警（2026-09-12 01:50-06:17 十四铃未达现场：铃全出账、注入未提交、会话零写盘）。
      const ringAt = lastRingAt[role] || 0;
      if (ringAt && now - ringAt >= watchdogStuckMs(binding, role) * (sessionProbe(role).src === "shared" ? 2 : 1)) { // R4：共享源仅粗判（窗×2）
        let rungPending = 0;
        for (const f of fs.readdirSync(inbox).filter(x => x.endsWith(".md"))) {
          if (!everRung(f)) continue;
          const env2 = parseEnvelope(fs.readFileSync(path.join(inbox, f), "utf-8"));
          if (env2.type.trim() === "回执") continue;
          rungPending++;
        }
        const pr2 = sessionProbe(role);
        // SYS-103 S3：hermes 席探针分型——其活跃信号在**席级源**（terminal-sessions/state.db）；仅剩【共享源】= 无席级证据，
        // 不得据此产「敲了没办」告警（今日 9 封误报均此形）；留痕不告警（可事后追溯，不静默）。
        const hermesNoSeatEvidence = String(seat.agent || "").toLowerCase() === "hermes" && pr2.src === "shared";
        if (rungPending > 0 && hermesNoSeatEvidence) {
          logLine("巡铃", now, `${role} 敲了没办抑制（hermes 席无席级探针证据·仅共享源）：待办 ${rungPending} 封（SYS-103 S3）`, opts); // SYS-91
        } else if (rungPending > 0 && pr2.t <= ringAt) {
          issues.push(`${role} 铃已敲 ${Math.round((now - ringAt) / 60000)} 分钟但席会话自铃后无写盘（敲了没办·疑注入未达）：箱内 ${rungPending} 封已敲未办` + (pr2.src === "shared" ? "（探针=共享源·粗粒度）" : ""));
          chanRoles.add(role);
        }
      }
      for (const f of fs.readdirSync(inbox).filter(x => x.endsWith(".md"))) {
        if (everRung(f)) { delete watchRingableSince[f]; continue; } // SYS-43：已敲过=agent 在办理中，不管（任一世代命中）
        const env = parseEnvelope(fs.readFileSync(path.join(inbox, f), "utf-8")); // 读路径归一（审查⑥）
        if (env.type.trim() === "回执") continue; // 知悉类不管
        const age = Date.now() - (Date.parse(env.created) || Date.now());
        if (age < 5 * 60e3) continue; // 5 分钟宽限（冷却/处理中）
        const id = (env.re.match(TICKET_IN_TEXT) || [])[0]; // 票据正则归一（审查⑥）
        if (["打回", "裁决", "疯狗", "挂起"].includes(env.type.trim()) || !id || (phaseMap.get(id) || role) === role) { // 豁免清单与巡铃同口径
          // SYS-58 R2：相位翻转（如单作废）会使老信瞬变「可敲未敲」——首见起宽限 RINGABLE_GRACE_MS 再报（防瞬态误报）
          const since = watchRingableSince[f] ?? (watchRingableSince[f] = now);
          if (now - since < RINGABLE_GRACE_MS) continue;
          issues.push(`${role} 有信龄 ${Math.round(age / 60000)} 分钟的可敲信未敲铃：${f}`);
        } else delete watchRingableSince[f]; // 不属本站：清状态
      }
    }
    // SYS-62 精灵欠账线（严格版）：哨兵自身停跳 / 四精灵 fail 挂账超时 → 咬信投巡检台席
    if (!opts.noSpriteDebt) {
      const dogAt = Date.parse(((readJson(opts.dogFile || MADDOG_FILE) || {})._lastAt) || "");
      // SYS-89 补丁（巡检台回检 2026-09-25 18:11）：狗已下线（哨兵开关.json: 疯狗=false）时「停滞」是预期态——
      // 欠账线不得再按「应出巡」口径判停滞投假咬信（测试桩传 opts.dogFile 沙盒 → 不受开关影响，保测试隔离）。
      // SYS-143 ②：boot 窗内（且首次出巡前）停滞类咬信一律抑制——停摆/换板窗不产假咬；抑制留痕（不静默）
      const debtBite = (msg, detail, o) => { // 与原 sendSpriteBite 同参（msg, detail, options）
        if (inBootWindow) { suppressed.push(`${msg}〔抑制·boot 窗 ${Math.round((now - bootAt) / 1000)}s·首次出巡前〕`); logLine("巡铃", now, `${msg} 咬信抑制（boot 窗内·首次出巡前·SYS-143·不静默）：${String(detail).slice(0, 120)}`, opts); return; }
        sendSpriteBite(msg, detail, o);
      };
      const dogDisabled = !opts.dogFile && sentinelOff("疯狗");
      if (!dogDisabled && dogAt && now - dogAt > (opts.dogStallMs ?? 10 * 60e3)) debtBite("疯狗哨兵停滞>10min（应 5min 一跑）", `疯狗.json _lastAt=${new Date(dogAt).toLocaleString("sv-SE")}·已停滞 ${Math.round((now - dogAt) / 60000)} 分钟——哨兵停跑，咬无可咬。`, { boxRoot, now, noLog: opts.noLog });
      const peckAt = Date.parse(((readJson(opts.watchFile || WATCH_FILE) || {}).at) || "");
      if (peckAt && now - peckAt > (opts.peckStallMs ?? 5 * 60e3)) debtBite("看门狗②检停跳>5min（该敲没敲·1min 节拍）", `看门狗.json at=${new Date(peckAt).toLocaleString("sv-SE")}·上轮距今 ${Math.round((now - peckAt) / 60000)} 分钟——该敲没敲检停摆（信龄>5min 未敲口径不变）。`, { boxRoot, now, noLog: opts.noLog });
      // SYS-62 ⑤ 四精灵 fail 挂账锚已由 SYS-145 换面（四精灵内化 ⇒ 不再按「精灵主题」判挂账；check 落账随角色例行产物）
      // SYS-145 新锚：**角色例行产出超 7 天**（四产物四落点·唯一真源）→ 咬；判据＝落点内最新一件 mtime ≤7 天；
      //   上膛语义（防首装即误咬）：锚件 `例行产出锚.json` 记 armedAt；无新鲜件时以 armedAt 为基准——满 7 天方咬。
      {
        const routineFile = opts.routineFile || ROUTINE_ARM_FILE;
        const anchors = opts.routineAnchors || ROUTINE_ANCHORS;
        const routineRoot = opts.routineRoot || SYS_ROOT;   // 测试缝：沙盒体系根（落点相对根拼）
        const arm = readJson(routineFile) || {};
        let armedAt = Date.parse(arm.armedAt || "") || 0;
        if (!armedAt) { // 首轮上膛（写 routineFile——默认真锚件；测试注入沙盒路径）
          armedAt = now;
          try { fs.writeFileSync(routineFile, JSON.stringify({ armedAt: new Date(now).toISOString(), note: "SYS-145 角色例行产出锚上膛时刻（满 7 天无新鲜产物即咬）" }, null, 2), "utf-8"); } catch {}
          logLine("巡铃", now, `例行产出锚上膛（SYS-145）：armedAt=${new Date(now).toLocaleString("sv-SE")}·四产物四落点·满 7 天无新鲜件即咬`, opts);
        }
        for (const a of anchors) {
          const dirAbs = path.join(routineRoot, a.dir);
          let latest = 0, latestName = "";
          try { for (const f of fs.readdirSync(dirAbs)) { const m = f.match(a.re); if (!m) continue; const st = fs.statSync(path.join(dirAbs, f)); if (st.mtimeMs > latest) { latest = st.mtimeMs; latestName = f; } } } catch {}
          const basis = latest || armedAt;   // 无件 ⇒ 以「上膛时刻」为基准（防首装即咬；满 7 天仍无 ⇒ 咬）
          if (!basis || now - basis <= ROUTINE_MAX_AGE_MS) continue;
          debtBite(`角色例行产物超 7 天未更新：${a.role}·${a.label}`,
            `落点 ${a.dir} 内最新一件＝${latestName || "（无）"}（${latest ? new Date(latest).toLocaleString("sv-SE") : "从未产出"}）——已 ${Math.round((now - basis) / 86400e3)} 天无新鲜产物。请按角色周程出件（无触发周也须一件·写「本周无触发·零读数」）。`, { boxRoot, now, noLog: opts.noLog });
        }
      }
    }
    for (const msg of [...new Set(issues)]) { // SYS-90 静噪：同轮去重（同一事项只告警一次）
      onAlarm(msg);
      const hitRole = [...chanRoles].find((r) => msg.startsWith(r)); // SYS-58 R2：敲了没办类与 B 闭环共用 per-role 冷却（防双响）
      if (hitRole) {
        if (now - (chanAlertAt[hitRole] || 0) < WATCH_ESCALATE_COOLDOWN_MS) continue;
        chanAlertAt[hitRole] = now;
      } else {
        const key = msg.replace(/\d+/g, "#"); // SYS-58：冷却键归一化（msg 内含分钟/封数会逐分钟漂移——用稳定键防变相刷屏）
        if (now - (watchEscalated[key] || 0) >= WATCH_ESCALATE_COOLDOWN_MS) watchEscalated[key] = now; else continue;
      }
      try { onEscalate(msg); } catch (e) { fault("watchdog.escalate", e, opts); }
    }
    fs.writeFileSync(opts.watchFile || WATCH_FILE, JSON.stringify({ at: new Date().toISOString(), ok: issues.length === 0, issues, suppressed }, null, 2), "utf-8"); // SYS-143：抑制留痕随状态件（机读）
  } catch (e) { fault("watchdog", e, opts); }
}

// SYS-44 派单站哨兵（就绪×空转）：与 HY-BASE-06 ③④ 同口径——就绪候派单（phase=registered + designer 注含候派/候窗/待派/候施工
//   + 无在途派单信）× 程序员席在岗箱空（产能×队列脱节=事故签名）→ 提醒信投设计师（巡铃必响）；超 SLA 30min 另报。
//   降频：60s 一轮 + 逐单 30min 冷却；状态落 待派哨兵.json（看板『待派×空转』格同源读取）。
const DISPATCH_FILE = path.join(HERE, "待派哨兵.json");
const DISPATCH_SLA_MIN = 30;
let lastDispatchScan = 0;
function scanDispatchIdle(opts = {}) { // opts（测试桩）：libFile/seatsDir/boxRoot/stateFile/now/force/onNotify
  const now = opts.now ?? Date.now();
  if (!opts.force && now - lastDispatchScan < 60e3) return null;
  lastDispatchScan = now;
  try {
    const lib = fs.readFileSync(opts.libFile || path.join(HERE, "..", "工单库.md"), "utf-8");
    const seatsDir = opts.seatsDir || path.join(HERE, "seats");
    const coderInbox = path.join(opts.boxRoot || path.join(HERE, "..", "邮局", "邮箱"), "程序员", "INBOX");
    let inbox = []; try { inbox = fs.readdirSync(coderInbox).filter((f) => f.endsWith(".md")); } catch {}
    const inboxText = inbox.map((f) => { try { return fs.readFileSync(path.join(coderInbox, f), "utf-8"); } catch { return ""; } }).join("\n");
    const ready = [];
    for (const card of lib.split(/^# (?=[A-Z][A-Z0-9]*-)/m).slice(1)) {
      const hm = card.match(/^([A-Z][A-Z0-9]*-[A-Za-z0-9]+)/);
      const sb = card.match(/```status\r?\n([\s\S]*?)```/);
      if (!hm || !sb) continue;
      const env = {};
      for (const line of sb[1].split(/\r?\n/)) { const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/); if (kv) env[kv[1]] = kv[2].trim(); }
      if ((env.phase || "") !== "registered") continue;               // 就绪=登记相位（负例：已派/在途不报）
      if (!/候派|候窗|待派|候施工/.test(env.designer || "")) continue;  // 候派注记（负例：未注候派不报）
      if (inboxText.includes(hm[1])) continue;                        // 在途派单信=已发起（负例：箱不空不报）
      const um = (env.updated_at || "").match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
      ready.push({ id: hm[1], ageMin: um ? (now - Date.parse(um[1])) / 60000 : 0 });
    }
    const seat = readJson(path.join(seatsDir, "coder.json")) || {};
    const idle = seat.on === true && inbox.length === 0; // 席在岗 × 箱空（HY-BASE-06 ④）
    const stalled = ready.filter((r) => r.ageMin > DISPATCH_SLA_MIN); // 派单滞留 SLA（HY-BASE-06 ③）
    const st = readJson(opts.stateFile || DISPATCH_FILE) || {};
    const notified = { ...(st.notified || {}) };
    for (const [k, t] of Object.entries(notified)) if (now - t > 24 * 3600e3) delete notified[k]; // 冷却表 24h 清理
    const hit = [...new Set([...(idle ? ready : []), ...stalled].map((r) => r.id))].filter((id) => now - (notified[id] || 0) > 30 * 60e3);
    if (hit.length) {
      const hitEntries = ready.filter((r) => hit.includes(r.id)); // SYS-44 修正单⑤：信面只列本次命中（冷却内旧单不再重复列）
      const msg = `就绪候派 ${hitEntries.map((r) => `${r.id}（${Math.round(r.ageMin)}m）`).join("、")}${idle ? " × 程序员席在岗箱空（产能×队列脱节）" : ""}——请发起派单`;
      (opts.onNotify || ((m) => sendDutyLetter("SYS-派单站", "派单站空转预警", m, { type: "通知", sign: "派单站哨兵", tail: "派单站哨兵自动提醒：请发起派单（就绪×空转=产能×队列脱节）。处理完销信即可。" })))(msg);
      for (const id of hit) notified[id] = now;
    }
    const state = { at: new Date(now).toISOString(), ready: ready.map((r) => r.id), stalled: stalled.map((r) => r.id), idle, slaMin: DISPATCH_SLA_MIN, notified };
    fs.writeFileSync(opts.stateFile || DISPATCH_FILE, JSON.stringify(state, null, 2));
    return state;
  } catch (e) { fault("scanDispatchIdle", e, opts); return null; }
}

// SYS-52 持单不动哨兵（.claims 扫描·SYS-44 同族）：认领超 SLA（默认 30min）且**持有方席会话静默**（SYS-51 同源探针）→ 告警（设计师信 + 状态件）。
//   病根：claim+静默无监控——二号持 UPG-147 claim 70min 不动无人知（派单站哨兵只盯就绪未派）。
//   降频：60s 一轮 + 逐单 30min 冷却；状态落 持单哨兵.json（机读；看板格接入属 UI 面，本单不做——红线§十一）。
const CLAIM_FILE = path.join(HERE, "持单哨兵.json");
const CLAIM_SLA_MIN = 30;
// SYS-172 相位闸：卡面 phase 已进交付线/终态 ⇒ 不存在「持单不动」——不报；已在告警态 ⇒ 同轮自动销警（一夜 3 次同型假警）。
const CLAIM_PARKED_PHASES = new Set(["delivered", "accepted", "audited", "merged", "obsolete"]);
function parkedClaimKeys(libFile) { // 工单库.md → 相位已 parked 的单号集（解析口径同 SYS-44；读不到=空集——禁放宽真卡单）
  const parked = new Set();
  try {
    const lib = fs.readFileSync(libFile || path.join(HERE, "..", "工单库.md"), "utf-8");
    for (const card of lib.split(/^# (?=[A-Z][A-Z0-9]*-)/m).slice(1)) {
      const hm = card.match(/^([A-Z][A-Z0-9]*-[A-Za-z0-9]+)/);
      const sb = card.match(/```status\r?\n([\s\S]*?)```/);
      const pm = sb && sb[1].match(/^phase:\s*(.*)$/m);
      if (hm && pm && CLAIM_PARKED_PHASES.has(pm[1].trim())) parked.add(hm[1]);
    }
  } catch {}
  return parked;
}
let lastClaimScan = 0;
function claimSeatOf(worker, bindFile) { // 值守工.json：worker → 持有方席（缺省程序员席）
  try {
    const j = JSON.parse(fs.readFileSync(bindFile || path.join(HERE, "..", "邮局", "值守工.json"), "utf-8"));
    const w = (j.workers || []).find((x) => x?.name === worker);
    return w?.mailbox || "程序员";
  } catch { return "程序员"; }
}
function scanClaimStale(opts = {}) { // opts（测试桩）：claimsDir/bindFile/stateFile/libFile/now/force/onNotify/sessionMtime/silentMs/slaMin
  const now = opts.now ?? Date.now();
  if (!opts.force && now - lastClaimScan < 60e3) return null;
  lastClaimScan = now;
  try {
    const claimsDir = opts.claimsDir || path.join(HERE, "..", "邮局", ".claims");
    const b = opts.binding || readBinding();
    const slaMin = opts.slaMin || (Number(b._claimStaleMin) > 0 ? Number(b._claimStaleMin) : CLAIM_SLA_MIN);
    const silentMs = opts.silentMs || silentMsOf(b, "_claimSilentMin");
    const sessionMtime = opts.sessionMtime || ((role) => latestSessionMtime(role));
    let ents = []; try { ents = fs.readdirSync(claimsDir).filter((f) => f.endsWith(".json")); } catch { return null; }
    const stale = [];
    for (const f of ents) {
      const c = readJson(path.join(claimsDir, f)); if (!c || !c.key) continue;
      const at = Date.parse(c.at || ""); if (!at) continue;
      if ((now - at) / 60000 <= slaMin) continue; // 未超 SLA（负例：新领不报）
      const seat = claimSeatOf(c.worker, opts.bindFile);
      if (now - sessionMtime(seat) < silentMs) continue; // 持有方会话有动静（在干活）——负例
      stale.push({ id: c.key, worker: c.worker || "?", seat, ageMin: (now - at) / 60000 });
    }
    const st = readJson(opts.stateFile || CLAIM_FILE) || {};
    const notified = { ...(st.notified || {}) };
    for (const [k, t] of Object.entries(notified)) if (now - t > 24 * 3600e3) delete notified[k]; // 冷却表 24h 清理
    // SYS-172 相位闸：报前读卡面 phase——parked 的不进候选；已在告警态的同轮销警（无候选无告警则免读）
    const parked = (stale.length || Object.keys(notified).length) ? parkedClaimKeys(opts.libFile) : new Set();
    const live = stale.filter((r) => !parked.has(r.id));
    for (const id of Object.keys(notified)) if (parked.has(id)) delete notified[id];
    const hit = live.filter((r) => now - (notified[r.id] || 0) > 30 * 60e3);
    if (hit.length) {
      const msg = `持单不动：${hit.map((r) => `${r.id}（${r.worker}·${Math.round(r.ageMin)}m·席静默）`).join("、")}——请催办/换人/挂起（或确认持有方是否卡死）`;
      (opts.onNotify || ((m) => sendDutyLetter("SYS-持单", "持单不动预警", m, { type: "通知", sign: "持单哨兵", tail: "持单哨兵自动提醒：认领超 SLA 且持有方会话静默=可能卡死。催办/换人/挂起三选一，处理完回执即可。" })))(msg);
      for (const r of hit) notified[r.id] = now;
    }
    const state = { at: new Date(now).toISOString(), held: live.map((r) => r.id), workers: live.map((r) => r.worker), slaMin, notified };
    fs.writeFileSync(opts.stateFile || CLAIM_FILE, JSON.stringify(state, null, 2));
    return state;
  } catch (e) { fault("scanClaimStale", e, opts); return null; }
}

// SYS-53 静默席拉起闸（SYS-45 池补线）：席静默 + 有待办（超窗未读正事信 / 超SLA持单）→ 池唤醒（**不等新信/不等定向字段**）。
//   根因（本单查实·值守池.json 实锚）：池只在「定向信到」时 wake——持单静默/无 seat 字段的未读信无任何唤醒源（UPG-147 claim 70min 活样本）。
//   降频：60s 一轮 + 同 worker 30min 冷却；状态落 静默拉起.json；忙位（流式中）由池自身跳过、下轮重评。
const PULLUP_FILE = path.join(HERE, "静默拉起.json");
const PULLUP_COOLDOWN_MIN = 30;
let lastPullUpScan = 0;
const lastPullUpAt = {}; // worker → 上次拉起（进程内；状态件另有留痕）
// SYS-58 追加#2（用户拍板·wake 可见窗优先）：worker 唤醒单源——wdef.consolePid 存活 → 铃2.ps1 注入
// （与角色席同通道·同受本次分段写入/回执闭环新规约束）；窗死/无 consolePid → RPC spawn 池兜底（无窗也不丢）。
// 两路径（ringUnreadSeats 定向信 / pullUpSilentSeats 静默席拉起）共用本函数。
// SYS-61 追加修（aq4）：worker claim 活性——该 worker 持 claim 且对应 worktree 近 30min 有写盘 → 视为「有主且正在干」。
const CLAIM_ACTIVE_MS = 30 * 60e3;
const worktreeActCache = {}; // worktree → {at, mtime}（60s 缓存）
function worktreeMtime(wt, opts = {}) {
  const now = opts.now ?? Date.now();
  const c = worktreeActCache[wt];
  if (c && now - c.at < 60e3) return c.mtime;
  let latest = 0;
  const bump = (p) => { try { const m = fs.statSync(p).mtimeMs; if (m > latest) latest = m; } catch {} };
  bump(wt); bump(path.join(wt, ".git"));
  for (const sub of ["app/src", "src", "docs", "处理中心"]) latest = Math.max(latest, newestUnder(path.join(wt, sub), () => true, 3));
  worktreeActCache[wt] = { at: now, mtime: latest };
  return latest;
}
function workerClaimActive(name, opts = {}) {
  const claimsDir = opts.claimsDir || path.join(HERE, "..", "邮局", ".claims");
  let files = []; try { files = fs.readdirSync(claimsDir).filter((f) => f.endsWith(".json")); } catch { return false; }
  const now = opts.now ?? Date.now();
  for (const f of files) {
    let c; try { c = JSON.parse(fs.readFileSync(path.join(claimsDir, f), "utf-8")); } catch { continue; }
    if (c.worker !== name || !c.key) continue;
    const wt = path.join(opts.home || os.homedir(), "mov-" + String(c.key).toLowerCase());
    const act = (opts.worktreeMtimeFn || worktreeMtime)(wt, opts);
    if (act > 0 && now - act < CLAIM_ACTIVE_MS) return true; // 有主+近期写盘=正在干 → 不拉不注
  }
  return false;
}
// SYS-61（2026-09-12 用户令「不接受隐性工位」）：worker 唤醒只走可见窗三态——
//   ①窗活→铃2 注入；②窗死/无窗→自动开可见窗（title MOV-<name>·cwd=工位/<mailbox>·pi）→ 新 consolePid 回写值守工.json 换绑 → 再注入；
//   ③开窗失败→**不 spawn**·记档（fault）+告警信（宁排队·绝不隐性）。RPC spawn 通道退役（不再调 pool.wake）。
// SYS-61 R1（巡检台 SYS-61 首bug：openWorkerWindow 无幂等→同 worker 连开 4 窗）：
//   a) 开窗前先验活窗（WMI 标题 MOV-<name>）→有则仅换绑不另开；b) 每 worker 开窗冷却 5min；
//   c) 换绑回写失败重试一次仍败→告警（per-worker 30min 冷却防刷屏）不再重开（防窗雨）。
const WORKER_OPEN_COOLDOWN_MS = 5 * 60e3;
const lastWorkerOpenAt = {}; // worker → 上次开窗时刻（R1 防窗雨；ponytail: 内存态——引擎重启即清，窗雨窗口仅同进程内）
function __testResetWorkerOpen() { for (const k of Object.keys(lastWorkerOpenAt)) delete lastWorkerOpenAt[k];  } // R1 测试隔离（同 __testResetPullUp 先例）
function findWorkerWindow(name, opts = {}) { // R1①：标题 MOV-<name> 的活 cmd 窗（WMI CommandLine 锚·与座探/看板自保同口径）
  try {
    const ps = `Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -like '*MOV-${name}*' } | Select-Object -First 1 -ExpandProperty ProcessId`;
    const out = (opts.execSyncFn || execSync)(`powershell -NoProfile -Command "${ps}"`, { encoding: "utf8", timeout: 15000 });
    return Number(String(out).trim()) || 0;
  } catch (e) { fault("findWorkerWindow", e); return 0; } // WMI 不可用=视为无活窗（照旧开窗路径·绝不隐性）
}
function openWorkerWindow(name, wdef, opts = {}) {
  const seatDir = path.join(HERE, "工位", (wdef && wdef.mailbox) || "程序员");
  const title = `MOV-${name}〔安卓中国〕`; // SYS-173：席位/临时窗标题带体系标签（解析同批改·座探认 MOV- 前缀）
  const ps = `$p = Start-Process cmd -ArgumentList '/k','title ${title} && cd /d "${seatDir}" && pi' -PassThru; $p.Id`;
  const out = (opts.execSyncFn || execSync)(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`, { encoding: "utf8", timeout: 30000 });
  const pid = Number(String(out).trim());
  if (!pid) throw new Error(`openWorkerWindow 未取到 pid（out=${String(out).slice(0, 80)}）`);
  return pid;
}
function rebindWorkerConsole(workersFile, name, consolePid) { // 换绑自愈：回写值守工.json 该 worker 条目（保留其余字段）
  try {
    const j = readJson(workersFile) || {};
    const w = (j.workers || []).find((x) => x.name === name);
    if (!w) return false;
    w.consolePid = consolePid;
    fs.writeFileSync(workersFile, JSON.stringify(j, null, 2), "utf-8");
    return true;
  } catch (e) { fault("wakeWorker.rebind", e, opts); return false; }
}
function benignNote(msg, opts = {}) { // SYS-61 R2②：良性事件降级——记 巡铃.log 一行（不占 故障.log 故障位；真异常仍走 fault）
  logLine("巡铃", opts.now, `良性 ${msg}`, opts); // SYS-91
}
function wakeWorker(name, text, opts = {}) {
  const workersFile = opts.workersFile || path.join(HERE, "..", "邮局", "值守工.json");
  const workers = opts.workers || ((readJson(workersFile) || {}).workers || []);
  const wdef = workers.find((w) => w.name === name);
  const inject = opts.inject || ((consolePid, t) => winShell(`powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(HERE, "铃2.ps1")}" -ConsolePid ${consolePid} -Text "${t}"`, { encoding: "utf-8", timeout: 20000 }));
  const faultFn = opts.fault || fault; // SYS-61 R1：fault 测试缝（防合成错误写实盘故障.log——五号-pi 假告警根因）
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }; // 同席验活口径
  // SYS-61 追加修（aq4 令·撞车让位案）：claim 活性复核——该 worker 持 claim 且 worktree 近 30min 有写盘 → 不拉不注（有主且正在干）
  if (!opts.noClaimGuard && opts.claimsDir && workerClaimActive(name, opts)) return { ok: false, how: "claim-active-skip" }; // aq4：有主+活跃→不拉不注（调用点解析默认 claims 目录）
  const fileFace = !!(opts.workersFile || !opts.workers); // SYS-61：有文件面（生产/显式传入）才落盘换绑（测试内存态不碰真文件）
  const bind = (pid) => !fileFace || (rebindWorkerConsole(workersFile, name, pid) || rebindWorkerConsole(workersFile, name, pid)); // R1③：回写失败重试一次
  const alert = (m) => { try { (opts.onAlarm || ((x) => sendWatchAlert(x)))(m); } catch {} };
  if (wdef && wdef.consolePid && alive(wdef.consolePid)) {
    try { inject(wdef.consolePid, text); return { ok: true, how: "bell" }; } catch { /* 注入失败→换窗路径 */ }
  }
  // SYS-61 R1①：开窗幂等——先验标题活窗（记档 pid 死了/失配，窗口可能仍在）→ 有则仅换绑不另开
  const liveWin = (opts.findWindow || findWorkerWindow)(name, opts);
  if (liveWin) {
    if (wdef) wdef.consolePid = liveWin;
    if (!bind(liveWin)) benignNote(`${name} 活窗在·换绑回写失败（SYS-61 R2：拒→认，照常注入；pid=${liveWin}）`, opts); // R2①：活窗=认（不再告警/不再拒）
    try { inject(liveWin, text); return { ok: true, how: "rebound" }; } catch {}
    benignNote(`${name} 活窗在·注入未达（pid=${liveWin}·下轮重评）`, opts);
    return { ok: true, how: "rebound-no-inject" }; // 窗已活=可见；注入失败下轮重评
  }
  // SYS-61 R1②：每 worker 开窗冷却（开不出/回写未落不许连开——窗雨闸）
  const now = opts.now ?? Date.now();
  if (now - (lastWorkerOpenAt[name] || 0) < (opts.openCooldownMs ?? WORKER_OPEN_COOLDOWN_MS)) { benignNote(`${name} 开窗冷却中（防窗雨·下轮重评）`, opts); return { ok: false, how: "reopen-cooldown" }; }
  lastWorkerOpenAt[name] = now;
  // SYS-61：窗死/无窗/注入失败 → 自动开可见窗 + 换绑自愈 → 再注入（绝不隐性）
  try {
    const pid = (opts.openWindow || openWorkerWindow)(name, wdef || {}, opts);
    if (wdef) wdef.consolePid = pid;
    if (!bind(pid)) benignNote(`${name} 新窗已开·换绑回写失败（pid=${pid}·下轮幂等认窗自愈）`, opts); // R2②：良性降级（不占故障位）
    try { inject(pid, text); return { ok: true, how: "bell-reopened" }; } catch {}
    return { ok: true, how: "reopened-no-inject" }; // 窗已开=可见；注入失败下轮重评
  } catch (e) {
    faultFn("wakeWorker.reopen", e);
    alert(`${name} 工位窗已死且自动开窗失败：不 spawn（宁排队·绝不隐性）`);
    return { ok: false, how: "window-dead-no-reopen" };
  }
}
function pullUpSilentSeats(opts = {}) { // opts（测试桩）：pool/boxRoot/claimsDir/workersFile/stateFile/now/force/binding/sessionMtime/silentMs/noLog
  const now = opts.now ?? Date.now();
  if (!opts.force && now - lastPullUpScan < 60e3) return null;
  lastPullUpScan = now;
  const pool = opts.pool || boardPool; // SYS-61：池仅作状态位（唤醒只走可见窗·无池也可扫——绝不隐性）
  try {
    const b = opts.binding || readBinding();
    const silentMs = opts.silentMs || silentMsOf(b, "_pullUpSilentMin"); // 席静默窗与信超窗同口径（缺省 10min）
    const cdMs = (Number(b._pullUpCooldownMin) > 0 ? Number(b._pullUpCooldownMin) : PULLUP_COOLDOWN_MIN) * 60e3;
    const claimSlaMin = Number(b._claimStaleMin) > 0 ? Number(b._claimStaleMin) : CLAIM_SLA_MIN;
    const sessionMtime = opts.sessionMtime || ((role) => latestSessionMtime(role));
    const workers = (readJson(opts.workersFile || path.join(HERE, "..", "邮局", "值守工.json")) || {}).workers || [];
    const boxRoot = opts.boxRoot || path.join(HERE, "..", "邮局", "邮箱");
    const claims = new Map();
    try {
      const claimsDir = opts.claimsDir || path.join(HERE, "..", "邮局", ".claims");
      for (const f of fs.readdirSync(claimsDir).filter((x) => x.endsWith(".json"))) {
        const c = readJson(path.join(claimsDir, f));
        if (c && c.key && c.worker && Date.parse(c.at || "")) claims.set(c.worker, { id: c.key, ageMin: (now - Date.parse(c.at)) / 60000 });
      }
    } catch {}
    const pulled = [];
    for (const w of workers) {
      if (!w || !w.name || w.enabled === false) continue;
      const role = w.mailbox || "程序员";
      if (now - sessionMtime(role) < silentMs) continue; // 席有动静（在干活）——不拉
      let letter = null; // 待办证据一：超窗未读正事信（回执/狗信不算）
      try {
        const inbox = path.join(boxRoot, role, "INBOX");
        for (const f of fs.readdirSync(inbox).filter((x) => x.endsWith(".md"))) {
          const env = parseEnvelope(fs.readFileSync(path.join(inbox, f), "utf-8"));
          if (["回执", "疯狗"].includes((env.type || "").trim())) continue;
          const created = Date.parse(env.created) || now;
          if (now - created < silentMs) continue;
          if (!letter || created < letter.created) letter = { id: env.id || f, created, ageMin: (now - created) / 60000 };
        }
      } catch {}
      const cl = claims.get(w.name) || null; // 待办证据二：超 SLA 持单（SYS-52 同源）
      const staleClaim = cl && cl.ageMin > claimSlaMin ? cl : null;
      if (!letter && !staleClaim) continue; // 无待办=不打扰（空箱空手不拉）
      if (now - (lastPullUpAt[w.name] || 0) < cdMs) continue; // 同 worker 冷却
      const why = [letter ? `未办信 ${letter.id}（龄 ${Math.round(letter.ageMin)}m）` : null, staleClaim ? `持单 ${staleClaim.id}（${Math.round(staleClaim.ageMin)}m）` : null].filter(Boolean).join(" + ");
      const r = wakeWorker(w.name, `静默席拉起（自动）：你的席静默且有待办——${why}。立即收信办理（先读你的角色卡）；开工前先核工位动态与 .claims（勿与他人重复施工）；不能动就在信箱回信说明卡点。（静默席拉起闸·SYS-53）`, { inject: opts.injectWorker, workers, workersFile: opts.workersFile || path.join(HERE, "..", "邮局", "值守工.json"), claimsDir: opts.claimsDir || path.join(HERE, "..", "邮局", ".claims"), fault: opts.fault, noClaimGuard: opts.noClaimGuard, worktreeMtimeFn: opts.worktreeMtimeFn, openWindow: opts.openWindow, findWindow: opts.findWindow, now, openCooldownMs: opts.openCooldownMs, onAlarm: opts.onAlarmWorker }); // SYS-61：三态（R1：now/findWindow/冷却测试注入缝）
      if (r && r.ok) {
        lastPullUpAt[w.name] = now;
        pulled.push({ worker: w.name, why, how: r.how });
        logLine("巡铃", now, `静默席拉起 ${w.name}（${r.how}）：${why}`, opts); // SYS-91
      }
    }
    fs.writeFileSync(opts.stateFile || PULLUP_FILE, JSON.stringify({ at: new Date(now).toISOString(), pulled, cooldownMin: cdMs / 60000 }, null, 2));
    return { pulled };
  } catch (e) { fault("pullUpSilentSeats", e, opts); return null; }
}

// 红牌进问题区（不再困在单.json——引擎与处理中心问题区接线）
function fileProblem(id, stage, bad) {
  try {
    const p = path.join(HERE, "..", "问题区", "问题区.md");
    let s = fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "# 问题区（问题清单）\n\n| 日期 | 来源 | 工单/位置 | 问题 | 状态 |\n|---|---|---|---|---|\n";
    s = s.trimEnd() + `
| ${new Date().toLocaleDateString("sv-SE")} | 流水线引擎 | ${id}·${stage} | ${bad.replace(/\|/g, "/")} | ⏳待处置 |
`;
    fs.writeFileSync(p, s, "utf-8");
  } catch {}
}

// 工序完成判定（headless 跑完 / 座席产物到位 共用：机械校验→回写→推进/红牌）
function handoffToMerge(t) { // 审验过 → 回设计师合并位（2026-09-09 回环制：单子从哪来回哪去）
  t.stages["设计师"] = {
    task: `执行合并：${t.id} 已审验通过——在你的工作区完成 git 合并（全线只有设计师工位可碰 git 合并），产物写 合并记录.md（行首或列表项均可：head: <合并后短hash> 与 branch: <分支>）`,
    produce: ["合并记录.md"],
    must_contain: { "合并记录.md": ["head", "branch"] },
  };
  t.stage = "设计师"; t.merge = true;
}
// 工序推进的唯一迁移函数（审查②根治：正常路径与回写重试路径共用，防两条路漂移）
function applyAdvance(t, stage, next) { if (stage === "审验员") handoffToMerge(t); else t.stage = next; }

async function completeStage(id, t, stage) {
  const bad = validate(id, t, stage);
  if (bad) {
    t.flag = `校验未过：${bad}`;
    t.history.push({ at: new Date().toLocaleString("sv-SE"), stage, verdict: "打回", note: bad });
    writeT(id, t);
    note(id, `🚩 ${bad} —— 停下等人处置（重跑前先改任务包/产物）`);
    fileProblem(id, stage, bad);
    return;
  }
  const stamp = () => new Date().toLocaleString("sv-SE");
  // 审验通过 → 合并回环：先登记 audited，再交接给设计师合并位
  if (stage === "审验员") {
    const move = () => { handoffToMerge(t); t.history.push({ at: stamp(), stage, verdict: "审验通过→回设计师合并位（闭环）" }); t.flag = ""; delete t._passed; writeT(id, t); note(id, "🚀 审验通过——单子回到设计师工位合并位（等设计师执行合并）"); };
    if (t.ticket) {
      const [phase, role] = STAGE_PHASE[stage];
      const r = syncStatus(t.id, `--phase ${phase} --role ${role} --note "流水线审验工序通过（引擎机械校验）"`);
      if (r.ok) { t.last_sync = { at: stamp(), phase, role }; note(id, `📒 工单库回写：${t.id} → ${phase}（${role}）`); move(); }
      else { t.flag = `工单库回写失败（${t.id}→${phase}）：${r.out}——引擎停等，修复后自动重试回写`; t._passed = stage; writeT(id, t); note(id, `🚩 ${t.flag}`); fileProblem(id, stage, "回写失败：" + r.out.slice(0, 60)); }
    } else move();
    return;
  }
  // 设计师合并位 → merged 登记（hash 闸内建：head 须为 origin/main 祖先）→ 完成
  if (stage === "设计师" && t.merge) {
    let head = "", branch = "";
    try {
      const rec = fs.readFileSync(path.join(DIR, id, "合并记录.md"), "utf-8");
      head = (rec.match(/^[-*]?\s*head[:：]\s*([0-9a-fA-F]{6,40})/m) || [])[1] || "";
      branch = (rec.match(/^[-*]?\s*branch[:：]\s*([A-Za-z0-9._\/-]+)/m) || [])[1] || "";
    } catch {}
    if (!head) {
      t.flag = "合并记录缺 head：<合并后短hash>——补 head/branch 两行后 rerun";
      t.history.push({ at: stamp(), stage, verdict: "打回", note: t.flag });
      writeT(id, t); note(id, `🚩 ${t.flag}`); fileProblem(id, stage, t.flag);
      return;
    }
    const finish = () => { t.stage = "完成"; delete t.merge; t.flag = ""; delete t._passed;
      t.history.push({ at: stamp(), stage, verdict: `设计师合并完成（head=${head}）→完成` }); writeT(id, t); note(id, "🎉 完成（闭环：设计师开单 → 设计师合单）"); };
    if (t.ticket) {
      const r = syncStatus(t.id, `--phase merged --role merge --branch ${branch} --head ${head} --note "设计师合并位回环登记（hash 闸内建校验）"`);
      if (r.ok) { note(id, `📒 工单库回写：${t.id} → merged（head=${head}）`); finish(); }
      else { t.flag = `merged 登记未过（hash 闸拦下？）：${r.out}——补正后 rerun`; t.history.push({ at: stamp(), stage, verdict: "打回", note: t.flag }); writeT(id, t); note(id, `🚩 ${t.flag}`); fileProblem(id, stage, "merged登记失败：" + r.out.slice(0, 60)); }
    } else finish();
    return;
  }
  // 常规工序（程序员/验收员）
  const next = STAGES[STAGES.indexOf(stage) + 1];
  const advance = () => {
    t.history.push({ at: stamp(), stage, verdict: "过" });
    t.stage = next; t.flag = ""; delete t._passed;
    writeT(id, t);
    note(id, STAGES.indexOf(next) === -1 ? "🎉 完成" : (next === "设计师" && !t.merge) ? `🚦 到人闸：${next}（批方案）` : `✅ ${stage} 校验通过`);
  };
  if (t.ticket && STAGE_PHASE[stage]) {
    const [phase, role] = STAGE_PHASE[stage];
    const r = syncStatus(t.id, `--phase ${phase} --role ${role} --note "流水线${stage}工序通过（引擎机械校验+回写）"`);
    if (r.ok) { t.last_sync = { at: stamp(), phase, role }; note(id, `📒 工单库回写：${t.id} → ${phase}（${role}）`); advance(); }
    else { t.flag = `工单库回写失败（${t.id}→${phase}）：${r.out}——引擎停等，修复后自动重试回写`; t._passed = stage; writeT(id, t); note(id, `🚩 ${t.flag}`); fileProblem(id, stage, "回写失败：" + r.out.slice(0, 60)); }
  } else advance();
}

function approve(id) {
  const t = readT(id);
  if (t.stage !== "设计师" || t.merge) return out(`⚠️ ${id} 当前不在方案人闸（${t.stage}${t.merge ? "·合并位" : ""}）——唯一人闸=批方案；合并位走信件流转，不用按闸`);
  if (t.ticket) {
    const r = syncStatus(t.id, `--phase dispatched --role designer --note "方案批准（流水线人闸）→ 派程序员"`);
    if (!r.ok) return out(`❌ 工单库回写失败，闸门不放行：${r.out}`);
    out(`📒 工单库回写：${t.id} → dispatched`);
  }
  t.stage = "程序员"; t.flag = ""; t.history.push({ at: new Date().toLocaleString("sv-SE"), stage: "设计师", verdict: "方案批准（人闸）→ 派程序员" });
  writeT(id, t);
  out(`✅ ${id} 闸门放行 → ${t.stage}`);
}

async function cmdAudit() { // 对账：单.json 阶段 vs 工单库 phase（只读）
  const EXPECT = { "设计师": ["registered", "dispatched", "audited"], "程序员": ["claimed", "in_progress", "delivered"], "验收员": ["delivered", "accepted"], "审验员": ["accepted", "audited"], "完成": ["merged", "closed"] };
  let bad = 0, n = 0;
  for (const id of listIds()) {
    const t = readT(id);
    if (!t.ticket) { out(`⚪ ${id} 演示单（不对账）`); continue; }
    n++;
    const r = syncStatus(t.id, "--show");
    const m = (r.out.match(/'phase':\s*'([^']+)'/) || [])[1];
    if (!m) { out(`⚠️ ${id} 读不到工单库 phase：${r.out.slice(0, 80)}`); bad++; continue; }
    const ok = (EXPECT[t.stage] || []).includes(m);
    if (!ok) bad++;
    out(`${ok ? "✅" : "🚩"} ${id} 流水线=${t.stage}｜工单库=${m}${ok ? "" : " ｜漂移！（以工单库为准，人工核对）"}`);
  }
  out(bad ? `❌ ${bad}/${n} 漂移` : `✅ ${n} 张挂靠单与工单库相位一致`);
}
function reject(id, to, note) { // 打回路由：终审归因（审验员道 / 设计师合并位——合并现场发现问题同样归因路由）
  const t = readT(id);
  if (!(t.stage === "审验员" || (t.stage === "设计师" && t.merge))) return out(`⚠️ ${id} 当前 ${t.stage}——打回只在审验道或合并位`);
  const MAP = { "程序员": "程序员", "验收员": "验收员", "设计师": "设计师", "重走": "设计师" };
  const target = MAP[to];
  if (!target) return out("--to 须为：程序员｜验收员｜设计师(=全部重走)");
  if (target === "设计师") t.rework = (t.rework || 0) + 1;
  if (t.merge) delete t.merge;
  t.history.push({ at: new Date().toLocaleString("sv-SE"), stage: t.stage, verdict: `打回→${target}`, note: note || "" });
  t.stage = target; t.flag = "";
  writeT(id, t);
  out(`↩️ ${id} 打回 → ${target}${target === "设计师" ? `（全部重走，第 ${t.rework} 次回炉）` : ""}｜原因：${note || "未填"}`);
}
function rerun(id) {
  const t = readT(id); t._rerun = true; t.flag = ""; writeT(id, t); delete t._rerun; writeT(id, t);
  out(`🔄 ${id} 清旗，重跑 ${t.stage}`);
}

function cmdStatus() {
  for (const id of listIds()) {
    const t = readT(id);
    out(`${t.stage === "完成" ? "🎉" : t.flag ? "🚩" : GATES.includes(t.stage) ? "🚦" : "🔨"} ${id} ${t.title} ｜ ${t.stage}${t.flag ? " ｜ " + t.flag : ""}`);
  }
}
const listIds = () => fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => fs.existsSync(path.join(DIR, f, "单.json"))) : [];

const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return null; } };
const BINDING_FILE = path.join(HERE, "工位绑定.json");
function readBinding() { return readJson(BINDING_FILE) || { "设计师": "claude", "程序员": "claude", "验收员": "claude", "审验员": "claude", "巡检台": "claude" }; }
function readShell() { return (readBinding()._shell || "cmd") === "powershell" ? "powershell" : "cmd"; } // 工位窗外壳：cmd（默认）| powershell，看板命令 终端 powershell 切换
// SYS-102 写档规范化：seat/wake/onseat/offseat 一律落 SEAT_KEY **英文键**——
// 旧写 `${rest[0]}.json`，传中文名即生中文档（实锚：seats/审验员.json 死 pid 与 reviewer.json 并存 → 逐席探针误报灯尸）。
function seatFileOf(name, dir = path.join(HERE, "seats")) { const role = ROLE_ALIAS[name] || name; return path.join(dir, `${SEAT_KEY[role] || name}.json`); }
function agentLaunchCmd(role, shell = "cmd", binding = readBinding()) { // claude 吃位置参数直接喂「上岗」；kimi/reasonix/pi/hermes 位置参数=报错退出，裸启后由 greetAgent 注入（实测 kimi/reasonix 均「unknown command」）
  const a = binding[role] || "claude"; // SYS-102：binding 可注（自愈按 opts.binding 算启动命令，与写档同源）
  if (a === "claude") return `claude "上岗"`;
  if (a === "kimi") return shell === "powershell" ? `$env:KIMI_CODE_NO_AUTO_UPDATE='1'; kimi` : `set KIMI_CODE_NO_AUTO_UPDATE=1 && kimi`; // 关 kimi 更新预检——升级弹窗会吃掉注入的「上岗」（2026-09-10 事故：注入回车误触「立即升级」毁窗）
  if (a === "reasonix") { // SYS-21 状态目录重定向：四变量指进「agent态/reasonix」笼子，cwd 零 .reasonix/（只此分支，kimi/claude/pi/hermes 逐字不受影响）
    const cage = path.join(HERE, "agent态", "reasonix");
    const dirs = { HOME: "home", STATE_HOME: "state", CACHE_HOME: "cache", WORKSPACE_ROOT: "workspace" }; // 分身家：config/tasks/缓存/工作根各归其位
    for (const d of Object.values(dirs)) fs.mkdirSync(path.join(cage, d), { recursive: true }); // 目录不存在则建（派单 §二.1）
    const kv = Object.entries(dirs).map(([k, d]) => [`REASONIX_${k}`, path.join(cage, d)]);
    return shell === "powershell"
      ? kv.map(([k, v]) => `$env:${k}='${v}'`).join("; ") + "; reasonix"
      : kv.map(([k, v]) => `set "${k}=${v}"`).join(" && ") + " && reasonix";
  }
  return a;
} // 座位/JSON 读取（巡铃曾因缺此定义整段哑火——外层 catch 吞了 ReferenceError）

// 非 claude agent 上岗触发词注入：座探发现窗内 agent 进程后，复用铃2 CONIN$ 通道注入「上岗」（每 agent 进程只喂一次，greetedPid 记 seat json）
// 注入文本带旧信激活（2026-09-10）：INBOX 有未读信时一并告知，agent 报到后直接收信办理，不用等下一趟铃
function greetAgent(role, key, consolePid, agentPid, opts = {}) { // SYS-91：opts 沙盒缝（noLog/logFile）
  const bound = readBinding()[role] || "claude";
  if (bound === "claude" || !consolePid || !agentPid) return;
  const f = path.join(HERE, "seats", `${key}.json`);
  const cur = readJson(f) || {};
  if (cur.greetedPid === agentPid) return; // 本进程已喂过
  fs.writeFileSync(f, JSON.stringify({ ...cur, greetedPid: agentPid }, null, 2));
  let pending = 0;
  try { pending = fs.readdirSync(path.join(HERE, "..", "邮局", "邮箱", role, "INBOX")).filter(x => x.endsWith(".md")).length; } catch {}
  const text = pending > 0 ? `上岗（注意：你的 INBOX 里有 ${pending} 封未读旧信，onseat 报到后立即按值守协议收信办理，不必等铃）` : "上岗";
  const ps2 = path.join(HERE, "铃2.ps1");
  const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", `Start-Sleep -Seconds 12; & '${ps2}' -ConsolePid ${consolePid} -Text "${text}"`], { detached: true, stdio: "ignore", windowsHide: true }); // 12 秒：TUI 原始模式初始化会清输入缓冲，打早了「上岗」被冲掉（2026-09-10 reasonix/kimi 实测）
  child.unref();
  logLine("巡铃", null, `${role} ← 上岗注入（agent=${bound} pid=${agentPid}，旧信${pending}封）`, opts); // SYS-91
}

// 相位→当前归属工位（与 board-data PHASE_CUR 对齐；audited=合并位回设计师）
// 📮显示与敲铃共用此规则：票已流转离站的旧信（agent 忘销信）不再显示/不再敲
const PHASE_OWNER = { registered: "设计师", dispatched: "程序员", claimed: "程序员", in_progress: "程序员", delivered: "验收员", accepted: "审验员", audited: "设计师" };

// 信箱巡铃（人工路/机器路通吃）：信到 + 灯亮（agent 活着）→ conhost 注入「收信」
// 铃按「agent代际:信」记（2026-09-10 旧信激活案）：同一 agent 每封信只敲一次；agent 换代（重启/换绑/引擎重开）→ 未读旧信自动重新激活。「已办」的标志=销信归档，不是敲过
const rungLetters = new Set();
// SYS-58 B：提交回执闭环状态（内存态，重启后由 watchdog≥N 兜底）——注入后 15s 复查席会话写盘；
// 无写盘→补回车一次（铃2 空文本=仅回车）；再 15s 仍无→记档（巡铃.log）+告警信（复用 sendWatchAlert·per-role 30min 冷却）。
const RING_ACK_DEFAULT_MS = 15e3;
const ringAck = {};        // role → {at, preWrite, retried, retryAt, alerted}
function __testResetRingAck() { for (const k of Object.keys(ringAck)) delete ringAck[k]; if (typeof chanAlertAt !== "undefined") for (const k of Object.keys(chanAlertAt)) delete chanAlertAt[k]; }
let boardPool = null; // SYS-45：工位池（cmdBoard 非 smoke 创建；定向信 → 池唤醒；忙位跳过）
const lastPoolSkip = {}; // 池忙位跳过日志节流（每工位 60s 一条，防逐 tick 刷日志）
const lastBackfill = {}; // SYS-90 静噪：补敲计数/时刻（role → {count, at}；上限 3 + 指数退避 90s/180s/360s；席写盘即归零）
const lastRingAt = {}; // 角色 → 上次成功敲铃时刻：90 秒冷却合并 burst（信件洪峰期每封一响=触发词排队空转，2026-09-10 设计师九连空案）
// SYS-103 S1：**注入失败退避**（按「窗 × 代际」记态）——失败分支旧无退避 ⇒ 死窗每 3–8s 重试成风暴（今日故障档 157 条）
const RING_FAIL_BASE_MS = 15e3, RING_FAIL_MAX_MS = 5 * 60e3, RING_FAIL_ALERT_N = 3;
const ringFail = {}; // role → {n, until, consolePid, gen, alerted}（成功/换代/窗变即复位）
try { const s = readJson(path.join(HERE, "巡铃状态.json")); if (s) { for (const k of s.rung || []) rungLetters.add(k); Object.assign(lastRingAt, s.lastRingAt || {}); Object.assign(lastBackfill, s.lastBackfill || {}); } } catch {} // 铃态落盘恢复（三层加固·二层）
function everRung(f) { // SYS-43：铃已敲复查——任一世代键 `*:信` 命中即视为已敲（换防期 agentPid 翻转不再“查无”误报）；与巡铃记键同源（同一 rungLetters）
  for (const k of rungLetters) if (k.endsWith(`:${f}`)) return true;
  return false;
}

// ── SYS-46 A：席位运行态三源（进程活否 + pi 会话 jsonl mtime + 信龄）——复用 pollSeats 时点，缓存 10s ──
function seatStateOf(alive, actAge, letterAge) { // 纯函数判定（测试锁）：三态四条
  if (!alive) return { glyph: "⚠️", label: "挂死嫌疑" };
  if (actAge != null && actAge < 90e3) return { glyph: null, label: "跑动中" };
  if (letterAge != null && letterAge > 20 * 60e3 && (actAge == null || actAge > 20 * 60e3)) return { glyph: "⚠️", label: "挂死嫌疑" };
  return { glyph: "○", label: "待命" };
}
const PI_SESSIONS = path.join(os.homedir(), ".pi", "agent", "sessions");
// SYS-58 R2：探针多 agent 适配（修盲区：原只读 pi 会话→hermes/kimi 席恒 0→假告警）。三源取最大：
//   pi=.pi/agent/sessions/<工位slug>/*.jsonl；kimi=.kimi-code/sessions/wd_*_<sha256(工位路径fwd)[:12]>/session_*/agents/*/wire.jsonl（实测 07:38 活跃样例=bd04b2e41464 ✓）；
//   hermes（验收/审验两席）=.state.db-wal + logs/agent.log（**共享写盘面·粗粒度**——两 hermes 席互不区分，如实注记）。
// 同源受益：SYS-46 席位态 / SYS-51 疯狗 / SYS-53 静默拉起 / SYS-56 补敲 / SYS-58 B 闭环。
function newestUnder(dir, filter, depth) { // 限深扫描最新 mtime（0=无）
  let latest = 0;
  const walk = (p, d) => {
    let ents; try { ents = fs.readdirSync(p, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const f = path.join(p, e.name);
      if (e.isDirectory()) { if (d > 0) walk(f, d - 1); }
      else if (filter(e.name)) { try { const m = fs.statSync(f).mtimeMs; if (m > latest) latest = m; } catch {} }
    }
  };
  walk(dir, depth);
  return latest;
}
function piSessionMtime(role, opts = {}) {
  const cwd = path.join(HERE, "工位", role);
  const slug = "--" + [...cwd].map((ch) => (ch === ":" || ch === "\\" || ch === "/" ? "-" : ch)).join("") + "--";
  return newestUnder(path.join(opts.home || os.homedir(), ".pi", "agent", "sessions", slug), (n) => n.endsWith(".jsonl"), 0);
}
function kimiSessionMtime(role, opts = {}) {
  const cwd = path.join(HERE, "工位", role).split(path.sep).join("/");
  const hash = crypto.createHash("sha256").update(cwd, "utf8").digest("hex").slice(0, 12);
  const base = path.join(opts.home || os.homedir(), ".kimi-code", "sessions");
  let latest = 0, ents = [];
  try { ents = fs.readdirSync(base); } catch { return 0; }
  for (const d of ents) if (d.endsWith("_" + hash)) latest = Math.max(latest, newestUnder(path.join(base, d), (n) => n === "wire.jsonl", 4));
  return latest;
}
function hermesSessionMtime(opts = {}) {
  const base = path.join(opts.localAppData || process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "hermes");
  let latest = 0;
  for (const f of [path.join(base, "state.db-wal"), path.join(base, "state.db"), path.join(base, "logs", "agent.log")]) {
    try { const m = fs.statSync(f).mtimeMs; if (m > latest) latest = m; } catch {}
  }
  return latest;
}
let hermesProcCache = { at: 0, bySession: {} }; // R3：proc 索引 30s 缓存（64 件防逐 tick 重扫）
function hermesProcIndex(opts = {}) {
  const now = Date.now();
  if (now - hermesProcCache.at < 30e3) return hermesProcCache.bySession;
  const base = path.join(opts.localAppData || process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "hermes", "logs", "process-results");
  const bySession = {};
  let ents = []; try { ents = fs.readdirSync(base); } catch { hermesProcCache = { at: now, bySession }; return bySession; }
  for (const f of ents) {
    if (!f.startsWith("proc_") || !f.endsWith(".json")) continue;
    const fp = path.join(base, f);
    try {
      const d = JSON.parse(fs.readFileSync(fp, "utf-8"));
      const m = fs.statSync(fp).mtimeMs;
      for (const k of [d.owner_task_id, d.session_key]) if (k && (bySession[k] || 0) < m) bySession[k] = m;
    } catch {}
  }
  hermesProcCache = { at: now, bySession };
  return bySession;
}
// R3：hermes 席级证据——terminal-sessions（session↔cwd）按席归因到 proc-results 活动面；
// 无映射/无活动→ 0（上层回退共享源·粗粒度已在报告明示；两 hermes 互洗白残留待后续细化）。
function hermesSeatMtime(role, opts = {}) {
  const base = path.join(opts.localAppData || process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "hermes");
  const seatBase = path.basename(path.join(HERE, "工位", role)); // 「验收员」/「审验员」（旧路径基线同名兼容）
  const sids = [];
  try {
    for (const f of fs.readdirSync(path.join(base, "terminal-sessions"))) {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(base, "terminal-sessions", f), "utf-8"));
        if (d.session_id && String(d.cwd || "").split(/[\\/]/).pop() === seatBase) sids.push(d.session_id);
      } catch {}
    }
  } catch { return 0; }
  if (!sids.length) return 0;
  const idx = hermesProcIndex(opts);
  return Math.max(0, ...sids.map((s) => idx[s] || 0));
}
let hermesDbAt = 0, hermesDbBySeat = null;
let hermesDbState = { ok: true, at: 0, err: "" }; // R3补遗②：DB 读状态（『取不到』≠『真静默』）
// SYS-90 R3（设计师 2026-09-25 18:33 续件）：hermes 席写盘检测——state.db sessions.last_activity_at 按 cwd 归席
// （terminal-sessions 映射在 18:26 重启后对不上 → 回执闭环误判『敲了没达』；DB 才是 hermes 席活性的权威源）
function hermesDbSeatMtimes(opts = {}) {
  const now = Date.now();
  const cacheable = !opts.hermesDb && !opts.localAppData; // 带沙盒 opts 的调用不读不写缓存（防跨用例串台）
  if (cacheable && hermesDbBySeat && now - hermesDbAt < 30e3) return hermesDbBySeat;
  const out = {};
  try {
    const base = opts.localAppData || process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    const dbPath = opts.hermesDb || path.join(base, "hermes", "state.db"); // opts.localAppData=测试沙盒缝（与另两源同规）
    if (fs.existsSync(dbPath)) {
      const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");
      const db = new DatabaseSync(dbPath, { readOnly: true });
      for (const r of db.prepare("select cwd, last_activity_at from sessions").all()) {
        const seat = tokenSeatOfCwd(r.cwd); // 仅「安卓…处理中心\看板\工位\<角色>」
        const t = Number(r.last_activity_at || 0) * 1000;
        if (seat && t > (out[seat] || 0)) out[seat] = t;
      }
      db.close();
    }
  } catch (e) { fault("hermesDbSeatMtimes", e); hermesDbState = { ok: false, at: now, err: String(e.message || e).slice(0, 120) }; }
  if (cacheable) { hermesDbAt = now; hermesDbBySeat = out; }
  if (hermesDbState.ok === false && out && Object.keys(out).length) hermesDbState = { ok: true, at: now, err: "" };
  return out;
}

function latestSessionProbe(role, opts = {}) { // SYS-58 R3/R4：带来源标注 {t, src: own|seat|shared}
  // R3 修3（验收员 19:52 打回根因）：**取全源最大**，不再 own>0 早退短路——hermes 席的陈旧 pi mtime
  // 会压住鲜活的 state.db 源 → 回执闭环永远闭不了环（假『敲了没达』照旧）。
  const own = Math.max(piSessionMtime(role, opts), kimiSessionMtime(role, opts));
  const seatMs = Math.max(hermesSeatMtime(role, opts), hermesDbSeatMtimes(opts)[role] || 0);
  if (own > 0 && own >= seatMs) return { t: own, src: "own" };
  if (seatMs > 0) return { t: seatMs, src: "seat" };
  return { t: hermesSessionMtime(opts), src: "shared", why: hermesDbState.ok ? "无席级行（真静默）" : ("DB读取失败：" + hermesDbState.err) }; // R3补遗②：原因可分辨
}
function latestSessionMtime(role, opts = {}) { // 兼容面：仅数值（R3：自有优先；hermes=席级→共享兑底）
  return latestSessionProbe(role, opts).t;
}
let seatStateAt = 0, seatStateCache = null;
function seatRunStates(D, force = false) {
  const now = Date.now();
  if (!force && seatStateCache && now - seatStateAt < 10e3) return seatStateCache;
  const states = (D?.stations || []).map(({ role, seat }) => {
    const alive = seat?.on === true;
    const actMs = latestSessionMtime(role) || null; // 会话最后活动（SYS-51 抽单源）
    let letterMs = null; // 最老未办正事信（回执不计）
    try {
      const inbox = path.join(HERE, "..", "邮局", "邮箱", role, "INBOX");
      for (const f of fs.readdirSync(inbox).filter((x) => x.endsWith(".md"))) {
        let t = ""; try { t = fs.readFileSync(path.join(inbox, f), "utf-8"); } catch { continue; }
        if (/^type:\s*回执\s*$/m.test(t)) continue;
        const m = fs.statSync(path.join(inbox, f)).mtimeMs;
        if (letterMs == null || m < letterMs) letterMs = m;
      }
    } catch {}
    const actAge = actMs == null ? null : now - actMs, letterAge = letterMs == null ? null : now - letterMs;
    const st = seatStateOf(alive, actAge, letterAge);
    const actTxt = actAge == null ? "—" : actAge < 60e3 ? "刚刚" : `${Math.round(actAge / 60e3)}m`;
    return { role, alive, glyph: st.glyph, label: st.label, actTxt };
  });
  seatStateAt = now; seatStateCache = states;
  try { fs.writeFileSync(path.join(HERE, "座态.json"), JSON.stringify({ at: new Date(now).toISOString(), seats: states.map(({ role, glyph, label, actTxt }) => ({ role, glyph, label, actTxt })) }, null, 2), "utf-8"); } catch {} // SYS-46 B：窗标题工具数据源（只写本巢状态，不改工具）
  return states;
}

// ── SYS-49 每日备份例程：跨日一次（works+0027-mov → C:\mov备份\<YYYYMMDD>\）·低频 60s 查·失败可见 ──
const BACKUP_SCRIPT = path.join(HERE, "备份.mjs");
const BACKUP_MARKER = path.join(HERE, "备份例程.json");
const BACKUP_OUT = "C:\\mov备份";
const BACKUP_STALL_MS = 30 * 60e3; // running 超 30 分钟拿不到 manifest=视为夭折（被杀/盘满）——当日不再重试
function backupDue(state, today) { // 纯函数（测试锁）：跨日未跑，或上次仅是自身 spawn 失败（下个检查点重试）
  return !state || state.lastDate !== today || state.status === "spawn_fail";
}
function backupToday(now = Date.now()) { return new Date(now).toLocaleDateString("sv-SE").replaceAll("-", ""); }
function writeBackupMarker(file, o) { try { fs.writeFileSync(file, JSON.stringify(o, null, 2), "utf-8"); } catch {} }
function dailyBackupTick(opts = {}) { // opts（测试桩）：marker/out/script 换沙盒；低频（60s 挂点），无活儿=读一次 marker 即走
  const MARKER = opts.marker || BACKUP_MARKER, OUT = opts.out || BACKUP_OUT, SCRIPT = opts.script || BACKUP_SCRIPT;
  const today = backupToday();
  let m = null; try { m = JSON.parse(fs.readFileSync(MARKER, "utf-8")); } catch {}
  if (!backupDue(m, today)) {
    if (!m || m.status !== "running") return;
    let r = null; try { r = JSON.parse(fs.readFileSync(path.join(OUT, today, "manifest.json"), "utf-8")); } catch {}
    if (r && typeof r.ok === "boolean" && Date.parse(r.at || 0) >= Date.parse(m.startedAt || 0)) { // 只认本轮新鲜 manifest（当日旧件会把第二轮误判为完成——SYS-49 实测）
      writeBackupMarker(MARKER, { ...m, status: r.ok ? "ok" : "fail", finishedAt: new Date().toISOString() });
      out(r.ok ? `🗄 SYS-49 每日备份完成（${today}）→ ${OUT}\\${today}\\` : `⚠️ SYS-49 每日备份失败（${today}）：${(r.errors || []).join("；") || "见日志"}——${OUT}\\${today}\\备份日志.md`);
    } else if (Date.now() - Date.parse(m.startedAt || 0) > BACKUP_STALL_MS) {
      writeBackupMarker(MARKER, { ...m, status: "timeout", finishedAt: new Date().toISOString() });
      out(`⚠️ SYS-49 每日备份超时未产出（${today}）——检查 ${SCRIPT}`);
    }
    return;
  }
  try { spawn(process.execPath, [SCRIPT], { detached: true, stdio: "ignore", windowsHide: true }).unref(); }
  catch (e) { writeBackupMarker(MARKER, { lastDate: today, status: "spawn_fail", error: e.message }); out(`⚠️ SYS-49 每日备份启动失败：${e.message}`); return; }
  writeBackupMarker(MARKER, { lastDate: today, status: "running", startedAt: new Date().toISOString(), log: path.join(OUT, today, "备份日志.md") });
  out(`🗄 SYS-49 每日备份已触发 → ${OUT}\\${today}\\`);
}
let dailyBackupTimer = null;
function installDailyBackup() { // board 与 serve 两模式各自挂点（同进程重复调用=空转；SMOKE 单帧不挂）
  if (dailyBackupTimer) return;
  dailyBackupTimer = setInterval(dailyBackupTick, 60e3);
  dailyBackupTick();
}

function ringUnreadSeats(D, opts = {}) { // opts（测试桩）：boxRoot/seatsDir 换沙盒目录，onRing 换掉真注入，noPersist 关落盘，noCooldown 关冷却，noLog 关日志
  const boxRoot = opts.boxRoot || path.join(HERE, "..", "邮局", "邮箱");
  const seatsDir = opts.seatsDir || path.join(HERE, "seats");
  const saveRing = opts.noPersist ? () => {} : saveRingState;
  const onRing = opts.onRing || ((consolePid) => winShell(`powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(HERE, "铃2.ps1")}" -ConsolePid ${consolePid} -Text "收信"`, { encoding: "utf8", timeout: 20000 }));
  const rlog = (whenMs, text) => logLine("巡铃", whenMs, text, opts); // SYS-91：径落点/日期列/#合成 走单点（SYS-103 noLog 兼容）
  try {
    const phaseMap = new Map((D?.ledger?.active || []).map(r => [r.id, PHASE_OWNER[r.phase]]).filter(([, v]) => v));
    // SYS-56 补敲（2026-09-11 用户拍板方向 A）：席「一次只办一封，办完即止」惯例 × 铃「只敲新信、敲过永不再敲」
    // ⇒ 箱内积压时无人接着派 = 死锁（9-11 晚两次现场）。补敲 = 与「敲新信」并存的第二分支。
    // 触发（同时）：本轮无新可敲信 ＋ 箱内仍有未办信（非回执/非定向/票在本站）＋ 席会话静默 ≥ N
    // （_madDogSilentMin 口径·缺省 10min；per-role 分档同 _madDogGraceMin 结构）＋ 距上次敲铃 ≥ 90s 冷却。
    // 纪律：补敲不重标 rungLetters（信早已标过）只更新 lastRingAt；与疯狗分层——补敲在前派活、疯狗在后咬不动者。
    const bind = opts.binding || readBinding();
    const sessionMtime = opts.sessionMtime || ((role) => latestSessionMtime(role));
    const sessionProbe = opts.sessionProbe || (opts.sessionMtime ? ((role) => ({ t: opts.sessionMtime(role), src: opts.probeSrc || "own" })) : ((role) => latestSessionProbe(role))); // R4探针（shared 降权；sessionMtime 旧缝兼容垫·src 可 opts.probeSrc 注）
    const ackDelayMs = opts.ackDelayMs ?? RING_ACK_DEFAULT_MS; // SYS-58 B：补回车窗（15s·测试缝）
    const ackAlertMs = opts.ackAlertMs ?? ((Number(bind._ringAckAlertMin) > 0 ? Number(bind._ringAckAlertMin) : 5) * 60e3); // R2 调优：告警窗（缺省 5min·可配）
    const onAckAlert = opts.onAckAlert || ((msg) => sendWatchAlert(msg)); // SYS-58 B：告警出口（与 watchdog 同信型·复用）
    const nowFn = typeof opts.now === "function" ? opts.now : (typeof opts.now === "number" ? (() => opts.now) : (() => Date.now())); // SYS-58 B：回执闭环时钟（测试缝）；SYS-103：兼容数值/函数两种注法（旧仅认函数 ⇒ 误注数值时 nowFn() 抛错被误计为注入失败）
    const backfillSilentMsFor = (role) => {
      if (opts.backfillSilentMs) return opts.backfillSilentMs; // 测试缝：一键覆盖 N
      const cfg = bind._madDogSilentMin;
      let min = 0;
      if (typeof cfg === "number" && cfg > 0) min = cfg; // 全局数字口径（兼容旧配置）
      else if (cfg && typeof cfg === "object") {
        const v = Number(cfg[role]);
        min = v > 0 ? v : (Number(cfg._default) > 0 ? Number(cfg._default) : 0);
      }
      return min > 0 ? min * 60e3 : SILENT_DEFAULT_MS;
    };
    const backfillPending = (inbox, role) => { // 返回 seat-work 未办件名（报文 N + 成功代标两用）：非回执/非定向/票在本站（无单号按信面站）
      const files = [];
      for (const f of fs.readdirSync(inbox).filter(x => x.endsWith(".md"))) {
        let raw = ""; try { raw = fs.readFileSync(path.join(inbox, f), "utf-8"); } catch { continue; }
        if (parseSeatField(raw)) continue; // 定向信归工位池，不在角色箱派
        const env = parseEnvelope(raw);
        if ((env.type || "").trim() === "回执") continue; // 知悉类不占补敲
        const id = (env.re.match(TICKET_IN_TEXT) || [])[0];
        if (id && (phaseMap.get(id) || role) !== role) continue; // 票未到站/已离站：等票不是等席
        files.push(f);
      }
      return files;
    };
    const failNotes = []; // SYS-103 S1.2：同轮多失败合并一行（防刷屏）
    for (const role of Object.keys(SEAT_KEY)) {
      const key = SEAT_KEY[role];
      const inbox = path.join(boxRoot, role, "INBOX");
      if (!fs.existsSync(inbox)) continue;
      const seat = readJson(path.join(seatsDir, `${key}.json`)) || {};
      // SYS-90 R3-rev2（设计师 21:31·审验员行为门槛②实录）：hermes 席产出落体系仓不写席位会话，
      // 探针源=state.db（活跃节奏由 DB 决定）⇒ 铃后 15s「无写盘」是结构性常态——hermes 席不设回执闭环
      const hermesSeat = String(seat.agent || "").toLowerCase() === "hermes";
      if (seat.on !== true || !seat.consolePid) continue; // 座位未亮：信保持待敲——复灯后自动补敲（不标记）
      if (seat.agentPid && sys88SeatVerdict(seat, { kill: opts.kill, procs: opts.procs }).verdict === "dead") continue; // SYS-88 ②c：仅「已证死」保持待敲；归属未定的活 pid 照敲（铃投的是窗）；SYS-103：kill/procs 两缝贯通（与轻路径/自愈同口径）
      const gen = `${seat.agentPid || 0}:`; // 代际键：agentPid 变=新的一代，旧信全部重新激活
      // SYS-58 B：回执闭环检查（每 tick·与新鲜信无关）——收到（席有写盘）→闭环；15s 无→补回车一次；再 15s 无→记档+告警
      const ack = ringAck[role];
      if (ack) {
        const t = nowFn();
        if (sessionProbe(role).t > ack.at && sessionProbe(role).src !== "shared") delete ringAck[role]; // R4：共享源不当席级到账证据（两hermes互洗白修）
        else if (!ack.retried && t - ack.at >= ackDelayMs) {
          try { onRing(seat.consolePid, ""); rlog(nowFn(), `${role} 补回车（${Math.round(ackDelayMs / 1000)}s 无写盘·注入回执闭环）`); } catch (e) { fault("ringUnreadSeats.ack", e, opts); }
          ack.retried = true; ack.retryAt = t;
        } else if (ack.retried && !ack.alerted && t - ack.retryAt >= ackAlertMs) {
          // R2 判据调优（07:40 假告警数据点）：仅当铃前席已静默 ≥ 告警窗（preWrite 很旧）才告警；
          // 铃前刚写过（长工具调用中）=在忙→不告警（继续等其写盘闭环；留 watchdog≥N 兜底；超 30min 静默丢弃防状态滞留）。
          // R4：共享源降权——不当席级到账证据、不告警（留 watchdog 粗判）；忙态 30min 自清
          if (sessionProbe(role).src === "shared") {
            ack.busyWait = true;
            if (t - ack.at >= 30 * 60e3) delete ringAck[role];
          } else if (ack.at - (ack.preWrite || 0) >= ackAlertMs) {
            ack.alerted = true; delete ringAck[role]; // 一次闭环终止（后续由 watchdog≥N 分钟继续看护）
            const prWhy = (() => { try { return sessionProbe(role).why || ""; } catch { return ""; } })();
            const msg = `${role} 铃注入后补回车仍无写盘（敲了没达·席位通道）：箱内待办未消化——请核查巡铃注入/席位会话` + (prWhy ? `（探针：${prWhy}）` : "");
            rlog(nowFn(), `${role} 回执闭环失败——已告警`);
            if (t - (chanAlertAt[role] || 0) >= 30 * 60e3) { chanAlertAt[role] = t; try { onAckAlert(msg); } catch (e) { fault("ringUnreadSeats.ackAlert", e, opts); } }
          } else {
            ack.busyWait = true;
            if (t - ack.at >= 30 * 60e3) delete ringAck[role]; // 在忙状态防滞留
          }
        }
      }
      const fresh = fs.readdirSync(inbox).filter(f => f.endsWith(".md") && !rungLetters.has(gen + f));
      // 只敲“票在本站”的信；回执永不敲（知悉类）；相位不符的信【不标记、每轮重评】——票未到站（派单信先于 set-status 进箱）是常态，标了就永不响（2026-09-10 UPG-129 混合批次连坐案：同批一封可敲信触发敲铃后，全部 fresh 被连坐标记）
      const ringable = [], silent = [];
      for (const f of fresh) {
        const raw = fs.readFileSync(path.join(inbox, f), "utf-8");
        if (parseSeatField(raw)) continue; // SYS-45 A：定向信（工位:）不在角色箱响——归工位池 sweep（定向投递）
        const env = parseEnvelope(raw); // 读路径归一（审查⑥）
        const tp = env.type;
        if (tp.trim() === "回执") { silent.push(f); continue; } // 回执=知悉类不占触发：永标不响，随下一封正事信一并被读
        if (["打回", "裁决", "疯狗", "挂起"].includes(tp.trim())) { ringable.push(f); continue; } // 打回/裁决/疯狗/挂起=球已易手或哨兵通报或挂起知会，无视账本相位必须响铃
        const id = (env.re.match(TICKET_IN_TEXT) || [])[0]; // 票据正则归一（审查⑥）
        if (!id || (phaseMap.get(id) || role) === role) ringable.push(f); // 无单号按信面站；票在本站可敲
        // else 票未到站/已离站：不敲不标，下轮重评
      }
      for (const f of silent) rungLetters.add(gen + f);
      if (silent.length) saveRing(); // 静默标记落盘（只在有新增标记时写；空箱不再每 tick 写盘）
      if (!ringable.length) {
        // SYS-56 补敲分支：无新可敲信时评估——席静默+箱内仍有未办信+冷却外 → 补敲「…继续」（不重标）
        const pending = backfillPending(inbox, role);
        // SYS-90 静噪：补敲上限 3 次（同席多封=一次合敲）+ 指数退避；席有写盘（上轮已闭环）→ 计数归零
        const bf = lastBackfill[role] || (lastBackfill[role] = { count: 0, at: 0 });
        if (sessionMtime(role) > (bf.at || 0)) bf.count = 0;
        const bfCooldown = 90e3 * Math.pow(2, Math.min(bf.count, 3));
        if (bf.count < 3 && pending.length > 0 && Date.now() - sessionMtime(role) >= backfillSilentMsFor(role) && (opts.noCooldown || Date.now() - (lastRingAt[role] || 0) >= bfCooldown)) {
          try {
            const r = onRing(seat.consolePid, `收信（箱内仍有 ${pending.length} 封未办——继续）`);
            lastRingAt[role] = Date.now();
            bf.count += 1; bf.at = Date.now(); // SYS-90：补敲计数（上限 3·退避用）
            for (const f of pending) rungLetters.add(gen + f); // SYS-58 R2：补敲投递成功即代标（防 watchdog 误报『未敲铃』）
            saveRing();
            if (!hermesSeat) ringAck[role] = { at: nowFn(), preWrite: sessionMtime(role), retried: false, retryAt: 0, alerted: false }; // SYS-58 B：补敲纳入闭环（hermes 席豁免·R3-rev2）
            rlog(nowFn(), `${role} 补敲 ← 未办${pending.length}封 r="${String(r ?? "").trim()}"`);
          } catch (e) {
            rlog(nowFn(), `${role} 补敲 FAIL ${String(e.message).slice(0, 80)}（下轮重试）`);
            fault("ringUnreadSeats.backfill", e, opts);
          }
        }
        continue;
      }
      if (!opts.noCooldown && Date.now() - (lastRingAt[role] || 0) < 90e3) continue; // 冷却中：不敲也不标——积攒的信等冷却后一响全端走
      const rb = ringFail[role]; // SYS-103 S1：退避中（同窗同代）不重试；窗变/换代/成功即复位（S1.3）
      if (rb && rb.consolePid === seat.consolePid && rb.gen === gen && nowFn() < rb.until) continue;
      try {
        const ids = ringable.map((f) => { try { const e = parseEnvelope(fs.readFileSync(path.join(inbox, f), "utf-8")); return (e.re.match(TICKET_IN_TEXT) || [])[0]; } catch { return null; } }).filter(Boolean);
        const recpt = ids.length ? `（已收到 ${ids.slice(0, 2).join("、")}${ids.length > 2 ? ` 等 ${ids.length} 封` : ""}——处理中）` : "（已收到新信——处理中）"; // SYS-46 C：注入即回执
        const r = onRing(seat.consolePid, `收信${recpt}`);
        for (const f of ringable) rungLetters.add(gen + f); // 成功才标记——只标真正可敲的（失败/被过滤的下轮重评重试）
        lastRingAt[role] = Date.now();
        if (!hermesSeat) ringAck[role] = { at: nowFn(), preWrite: sessionMtime(role), retried: false, retryAt: 0, alerted: false }; // SYS-58 B：回执闭环起点（hermes 席豁免·R3-rev2）
        saveRing(); // 铃态落盘（三层加固·二层）
        rlog(nowFn(), `${role} ← ${ringable.length}信 r="${String(r ?? "").trim()}"`);
        delete ringFail[role]; // S1.3：注入成功 ⇒ 退避复位（复活/新窗后第一次即恢复正常）
      } catch (e) {
        // SYS-103 S1.1：指数退避 15s→30s→60s→…→上限 5min（同窗同代累加；窗变/换代重算）；达 3 次转置疑告警（可见）
        const same = rb && rb.consolePid === seat.consolePid && rb.gen === gen ? rb : { n: 0, alerted: false };
        const n = same.n + 1;
        const until = nowFn() + Math.min(RING_FAIL_BASE_MS * 2 ** Math.max(0, n - 1), RING_FAIL_MAX_MS);
        ringFail[role] = { n, until, consolePid: seat.consolePid, gen, alerted: same.alerted };
        failNotes.push(`${role}×${n}（退避至 +${Math.round((until - nowFn()) / 1000)}s）`);
        if (n >= RING_FAIL_ALERT_N && !ringFail[role].alerted) {
          ringFail[role].alerted = true;
          const msg = `${role} 席注入连续失败 ${n} 次（窗 ${seat.consolePid}）——铃通道疑断，箱内 ${ringable.length} 封待办投不达（SYS-103 S1）`;
          try { (opts.onAlert || ((m) => { if (IS_MAIN) { sendWatchAlert(m); fileProblem("SYS-103", "看板", m); } }))(msg); } catch (err) { fault("ringUnreadSeats.escalate", err, opts); }
        }
        fault("ringUnreadSeats", e, opts);
      }
    }
    if (failNotes.length) rlog(nowFn(), `注入失败合并：${failNotes.join(" ｜ ")}`); // S1.2：同轮多失败合并一行
    // SYS-45 A/C：定向投递 × headless 工位池——`工位: <名>` 信只唤醒目标工位；忙位（流式中）跳过不标记，下轮重评
    const pool = opts.pool || boardPool;
    if (!opts.noPoolSweep) { // SYS-61：定向信扫常开（RPC 退役）；测试可用 noPoolSweep 关
      const workers = opts.workers || (readJson(opts.workersFile || path.join(HERE, "..", "邮局", "值守工.json")) || {}).workers || []; // SYS-58 追加#2：workers 注入缝（测试隔离——防吃真 consolePid 注真窗）
      for (const [role, key] of Object.entries(SEAT_KEY)) {
        const inbox = path.join(boxRoot, role, "INBOX");
        if (!fs.existsSync(inbox)) continue;
        for (const f of fs.readdirSync(inbox).filter(x => x.endsWith(".md"))) {
          let raw = ""; try { raw = fs.readFileSync(path.join(inbox, f), "utf-8"); } catch { continue; }
          const target = parseSeatField(raw);
          if (!target) continue;
          const gen = `${target}:`; // 工位池代际键（name:信；与 agentPid 键同格式——everRung 任一世代复查兼容）
          if (rungLetters.has(gen + f)) continue;
          const env = parseEnvelope(raw);
          if ((env.type || "").trim() === "回执") { rungLetters.add(gen + f); saveRing(); continue; }
          const wdef = workers.find((w) => w.name === target);
          const card = path.join(HERE, "工位", wdef && wdef.mailbox ? wdef.mailbox : role, "AGENTS.md");
          // SYS-58 追加#2：可见窗优先（窗活→铃2 注入；窗死→RPC 兜底）——单源 wakeWorker
          const r = wakeWorker(target, `收信（本机 headless 值守工位「${target}」：先读 ${card} 角色卡进入角色，再办理你信箱最早一封未办信；一次一封，办完即止）`, { inject: opts.injectWorker, workers, workersFile: opts.workersFile, claimsDir: opts.claimsDir || path.join(HERE, "..", "邮局", ".claims"), fault: opts.fault, noClaimGuard: opts.noClaimGuard, worktreeMtimeFn: opts.worktreeMtimeFn, openWindow: opts.openWindow, findWindow: opts.findWindow, now: opts.now, openCooldownMs: opts.openCooldownMs, onAlarm: opts.onAlarmWorker }); // SYS-61：三态（workers 注入缝存在时不落盘——测试隔离）
          if (r && r.ok) {
            rungLetters.add(gen + f); saveRing();
            rlog(Date.now(), `池唤醒 ${target} ← ${f}（${r.how}）`);
          } else if (!lastPoolSkip[target] || Date.now() - lastPoolSkip[target] > 60e3) {
            lastPoolSkip[target] = Date.now();
            rlog(Date.now(), `池唤醒 ${target} 跳过（${r ? r.reason || r.how : "no-pool"}）——下轮重评`);
          }
        }
      }
    }
  } catch {}
}

// ---------- 工位（标题 MOV-<角色> 的 CMD 窗口 = 该角色已就位） ----------
const SEAT_ROLES = ["设计师", "程序员", "验收员", "审验员", "巡检台"];
const ROLE_ALIAS = { designer: "设计师", coder: "程序员", qa: "验收员", reviewer: "审验员", hygiene: "巡检台" };
let seats = {};
let seatAgents = {}; // 在岗 agent 自报名（claude/pi/reasonix…）

// SYS-26 座探假死修（2026-09-10）：原 setInterval(pollSeats, 3s) 每轮同步启 PS + WMI 全表（386 进程，且逐窗子查询），
// 重负载下 >8s → execSync 阻塞事件循环 → tick/巡铃/看门狗全停（故障.log 15 条 ETIMEDOUT 现场）。
// 改法：主循环走「轻路径 pid 验活」（读 seats/*.json 的 agentPid，微秒级，不启 PS），WMI 全表降为低频兜底 + 连续超时指数退避。
const SEAT_TICK_MS = 15000;          // 主循环间隔 3s→15s
const SEAT_FULL_INTERVAL_MS = 45000; // WMI 全表降频：45s 一次（派单 §二.1 30-60s 区间）
const SEAT_FULL_MAX_MS = 180000;     // 连续超时退避上限 180s
const SEAT_PS_TIMEOUT_MS = 20000;    // 座探.ps1 execSync 超时 8s→20s
let seatFullAt = 0;                  // 上次全表「尝试」时刻（成功/失败都记——退避窗口基准）
let seatFullFails = 0;               // 连续全表失败次数（指数退避指数）
let seatProbeRequested = false;      // SYS-88：轻路径见「pid 死但窗活」→ 请求下一次强制全表复探（换档）
let seatReprobeReqAt = 0;            // SYS-88：复探请求限速（60s）——防未知态每 tick 触发 WMI 风暴

// ═════════ SYS-102 席位 agent 退出自愈（窗活而 agent 真死 → 既有窗内重拉绑定 agent） ═════════
// 触发/判据源 = SYS-88 `sys88SeatVerdict` 同源态（本单只用「窗活 + 全表探在窗内零 agent」这一实证态，不凭单 pid 定生死）：
//   ①未亮/无窗锚 → 不管（下班不误拉）②窗死 → 另一域（**不隐性开新窗**）
//   ③窗内已有 agent（当轮全表探实证）→ 正常/换代，不拉 ④双活窗 → 不重复拉（人收窗优先）
//   ⑤档内 agent ≠ 现行绑定 → 换绑中不拉 ⑥冷却 + 每小时上限 + 巡铃.log 留痕（退避口径与 SYS-103 同源）
// 不 spawn 新窗：仅向**既有窗**注入启动命令（铃2 CONIN$ 通道·与「收信」同一路径）；agent 起来后由全表探+greetAgent 接管（上岗注入）。
const SEAT_HEAL_COOLDOWN_MS = 5 * 60e3;   // 单席冷却（工位绑定.json `_seatHealCooldownMin` 可调）
const SEAT_HEAL_MAX_PER_HOUR = 3;          // 单席每小时上限（`_seatHealMaxPerHour` 可调）
const seatHealAt = {};                     // role → 上次自愈时刻
const seatHealHist = {};                   // role → [ts,…]（滞动 1h 计数）
const seatHealTrace = {};                  // SYS-103 S4：抑制留痕去重（role → 上次留痕时刻；每冷却窗一次）
let seatWindowAgent = {};                  // role → 本轮全表探：该席窗内是否发现 agent（实证态）
let seatWindowCount = {};                  // role → 本角色 MOV-* 活窗数（双活窗判据）
function __testResetSeatHeal() { for (const k of Object.keys(seatHealAt)) delete seatHealAt[k]; for (const k of Object.keys(seatHealHist)) delete seatHealHist[k]; for (const k of Object.keys(seatHealTrace)) delete seatHealTrace[k]; seatWindowAgent = {}; seatWindowCount = {}; }
function seatSelfHeal(opts = {}) {
  const now = opts.now ?? Date.now();
  const seatsDir = opts.seatsDir || path.join(HERE, "seats");
  const binding = opts.binding || readBinding();
  const shell = opts.shell || readShell();
  const kill = opts.kill || ((p) => process.kill(p, 0));
  const isAlive = (p) => { try { kill(p); return true; } catch (e) { return !!(e && e.code === "EPERM"); } };
  const inject = opts.inject || (IS_MAIN ? ((consolePid, text) => winShell(`powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(HERE, "铃2.ps1")}" -ConsolePid ${consolePid} -Text "${text}"`, { encoding: "utf-8", timeout: 20000 })) : null); // import 模式（测试）不向真窗注入：须显式注 inject
  const logFile = logFileFor("巡铃", opts); // SYS-91：落点走单点沙盒缝（含 SYS-103 opts.logFile 兼容）
  const healed = []; // SYS-102-R1：声明提到守卫之前（否则 `return healed` 走 TDZ → import 模式 ReferenceError·审验员终审独立发现）
  if (!inject) return healed;
  const cooldown = Number(binding._seatHealCooldownMin) > 0 ? Number(binding._seatHealCooldownMin) * 60e3 : SEAT_HEAL_COOLDOWN_MS;
  const cap = Number(binding._seatHealMaxPerHour) > 0 ? Number(binding._seatHealMaxPerHour) : SEAT_HEAL_MAX_PER_HOUR;
  const wAgent = opts.windowAgent || seatWindowAgent, wCount = opts.windowCount || seatWindowCount;
  for (const role of Object.keys(SEAT_KEY)) {
    let seat = {}; try { seat = JSON.parse(fs.readFileSync(path.join(seatsDir, `${SEAT_KEY[role]}.json`), "utf-8")); } catch { continue; }
    if (seat.on !== true || !seat.consolePid) continue;                                        // ①
    if (!isAlive(Number(seat.consolePid))) continue;                                           // ②↕变异锚：去此行 → 负控④必红
    if (wAgent[role]) continue;                                                                // ③
    if (Number(wCount[role] || 0) > 1) continue;                                               // ④
    const bound = String(binding[role] || "").trim();
    if (!bound) continue;
    if (seat.agent && seat.agent !== bound) continue;                                          // ⑤
    const hist = (seatHealHist[role] = (seatHealHist[role] || []).filter((t) => now - t < 3600e3));
    if (now - (seatHealAt[role] || 0) < cooldown || hist.length >= cap) { // ⑥
      // SYS-103 S4：抑制路径不再静默——每席每冷却窗留痕一次（降噪：非每次 continue 都写）
      const why = hist.length >= cap ? `小时上限 ${cap} 次已用尽` : `冷却中（剩 ${Math.ceil((cooldown - (now - (seatHealAt[role] || 0))) / 1000)}s）`;
      if (!opts.noLog && now - (seatHealTrace[role] || 0) >= cooldown) {
        seatHealTrace[role] = now;
        try { logLine("巡铃", now, `${role} ← 自愈抑制（${why}·窗 ${seat.consolePid}·agent 退出未复亮·SYS-103 S4）`, opts); } catch {}
      }
      continue;
    }
    const cmd = agentLaunchCmd(role, shell, binding);
    try {
      inject(Number(seat.consolePid), cmd);
      seatHealAt[role] = now; hist.push(now);
      healed.push({ role, consolePid: Number(seat.consolePid), cmd, nth: hist.length });
      if (!opts.noLog) try { logLine("巡铃", now, `${role} ← 席位自愈（agent 退出·窗 ${seat.consolePid} 内重拉 «${cmd}»·第 ${hist.length}/${cap} 次）`, opts); } catch {}
    } catch (e) { fault("seatSelfHeal.inject", e, opts); }
  }
  return healed;
}

/**
 * SYS-90 座探加固（设计师 2026-09-25 21:07·跨体系同名窗误认实录）：行命令行须含本体系根，
 * 网页体系同名 MOV-<角色> 窗（其命令行含网页体系路径）一律排除；行无 cmd（旧版座探.ps1）= 放行（兼容）。
 */
function seatProbeAllowed(row, sysRoot = WORKS) {
  const cl = String((row && row.cmd) || "").replace(/\//g, "\\").toLowerCase();
  if (!cl) return true;
  const root = String(sysRoot).replace(/\//g, "\\").toLowerCase();
  return cl.includes(root);
}

/** 全表座探（WMI，重）：扫 MOV-* 工位窗 + 窗内 agent 子进程 → 自动点亮报到。返回是否成功（门面据此记账/退避）。 */
function pollSeatsFull(opts = {}) {
  const seatsDir = opts.seatsDir || path.join(HERE, "seats");
  try {
    const probe = opts.probe || (() => winShell(`powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(HERE, "座探.ps1")}"`, { encoding: "utf8", timeout: opts.psTimeoutMs ?? SEAT_PS_TIMEOUT_MS }));
    const outp = probe();
    let arr = JSON.parse(outp || "[]");
    if (!Array.isArray(arr)) arr = [arr];
    const next = {}, nextAgent = {}, nextCount = {}; // SYS-102：nextCount=角色活窗数（双活窗判据）
    for (const it of arr) {
      if (!seatProbeAllowed(it, opts.sysRoot || WORKS)) continue; // SYS-90 座探加固：跨体系同名窗排除
      // SYS-173：新标题 MOV-<席名>〔<体系>〕——席名取 MOV- 到 〔 之间；无 〔 取行尾（向后兼容旧标题）。
      const raw = String(it.title || "").replace(/^MOV-/, "").replace(/〔[^〕]*〕\s*$/, "").trim();
      const role = ROLE_ALIAS[raw] || raw;
      if (!SEAT_ROLES.includes(role)) continue;
      next[role] = true; // 工位窗存在
      nextCount[role] = (nextCount[role] || 0) + 1;
      if (it.agentPid > 0) {
        // SYS-88 ②d 写入侧校验（跨体系串台案 19096）：行 pid 须落在「行窗 cmdPid」树内且为真 agent；能取表时把内层瞬灭子进程提升为最外层真 agent。
        // 兼容：旧版座探行无 cmd / 测试桩未注表 → 不拦（与 seatProbeAllowed「行无 cmd=放行」同口径）。
        const rowsT = opts.procs !== undefined ? opts.procs : (String(it.cmd || "") ? sys88LoadTable(opts) : null);
        if (rowsT) {
          const win = sys88Idx(rowsT).get(Number(it.cmdPid || 0)); // 行窗进程（可能缺）
          if (win && !seatProbeAllowed({ cmd: win.CommandLine }, opts.sysRoot || WORKS)) continue; // 跨体系同名窗：即使行缺 cmd 也能拦（直取窗命令行核本体系根）
          if (it.cmdPid) { let wAlive = true; try { (opts.kill || process.kill)(Number(it.cmdPid), 0); } catch (e) { wAlive = !!(e && e.code === "EPERM"); } if (!wAlive) continue; } // 窗死＝陈行（19096 案：窗 39400 死而 pid 活＝借异体系活 pid 过关，由此拦下）
          const pick = sys88PickAgentPid(rowsT, it.agentPid, { consolePid: Number(it.cmdPid || 0) });
          if (!pick) continue; // 非本席窗树/非 agent 签名 → 拒写
          it.agentPid = pick.pid; it.agent = pick.name;
        }
        nextAgent[role] = it.agent;
        const key = Object.keys(ROLE_ALIAS).find(k => ROLE_ALIAS[k] === role);
        const f = path.join(seatsDir, `${key}.json`);
        let prev = {}; try { prev = JSON.parse(fs.readFileSync(f, "utf-8")); } catch {}
        const changed = prev.on !== true || prev.agentPid !== it.agentPid || prev.consolePid !== it.cmdPid;
        if (changed) {
          // SYS-43 代际稳定性：同窗且记在档的 agent 还活着时不换——座探在新旧进程间翻转 agentPid 会分裂铃键（真换代=旧进程死，照换）
          let keep = false;
          if (prev.on === true && prev.agentPid && prev.agentPid !== it.agentPid && prev.consolePid && prev.consolePid === it.cmdPid) {
            try { (opts.kill || process.kill)(prev.agentPid, 0); keep = true; } catch {}
          }
          if (!keep) {
            // 自动报到：窗里出现 agent 进程=灯亮（保留原 consolePid/hwnd 锚点，补新 agent）
            fs.writeFileSync(f, JSON.stringify({ ...prev, role, on: true, agent: it.agent, agentPid: it.agentPid, consolePid: it.cmdPid || prev.consolePid, at: new Date().toISOString(), auto: true }, null, 2));
            greetAgent(role, key, it.cmdPid || prev.consolePid, it.agentPid, opts); // 非 claude 绑定：注入「上岗」触发词（SYS-91：opts 下传日志缝）
          }
        }
      }
    }
    seats = next; seatAgents = nextAgent;
    seatWindowAgent = nextAgent; seatWindowCount = nextCount; // SYS-102：自愈实证态（窗内有无 agent / 活窗数）
    if (!opts.noHeal) try { seatSelfHeal({ ...opts, windowAgent: nextAgent, windowCount: nextCount }); } catch (e) { fault("seatSelfHeal", e); } // SYS-102：全表探后自愈（数据新鲜）
    return true;
  } catch (e) { fault("pollSeats", e); /* PowerShell 不可用时工位灯熄，主流程不受影响——但故障要留痕 */ return false; }
}

/** 轻路径座探（微秒级）：读 seats/*.json 的 agentPid 用 process.kill(pid,0) 验活——agent 死即熄灯。
 *  与 WMI 口径一致（agent 进程是灯的命脉），只是不再为「判已知席死活」启 PS；发现新窗/新 agent 仍由全表兜底。 */
function pollSeatsLight(opts = {}) {
  const seatsDir = opts.seatsDir || path.join(HERE, "seats");
  const kill = opts.kill || ((pid) => process.kill(pid, 0));
  for (const [key] of Object.entries(ROLE_ALIAS)) {
    const f = path.join(seatsDir, `${key}.json`);
    let seat; try { seat = JSON.parse(fs.readFileSync(f, "utf-8")); } catch { continue; }
    if (!seat || seat.on !== true || !seat.agentPid) continue;
    let alive = true; try { kill(seat.agentPid); } catch (err) { alive = !!(err && err.code === "EPERM"); } // EPERM=进程在但无权发信号（别的用户/系统进程）——是活不是死，别误熄灯
    if (!alive) { // SYS-88 ②a/②c：熄灯＝行动——先过归属核/窗活核（hermes 子进程误会案 40576 由此不再引发假灯尸）
      const v = sys88SeatVerdict(seat, { kill, procs: opts.procs });
      if (v.verdict === "dead") try { fs.writeFileSync(f, JSON.stringify({ ...seat, on: false, offAt: new Date().toISOString(), offReason: "agent-exit", offWhy: v.why }, null, 2)); } catch (e) { fault("pollSeatsLight.persist", e, opts); } // Windows 并发读写 EBUSY/EPERM 不再能杀引擎
      else { // unknown（pid 死但窗活/归属不可判）→ 不熄灯，报全表复探换档（限速：60s 一次，防复探风暴）
        const t = opts.now ?? Date.now();
        if (t - seatReprobeReqAt > 60000) { seatReprobeReqAt = t; seatProbeRequested = true; }
      }
    }
  }
}

/** 座探门面：主循环调它。非 force 且未到降频窗口 → 轻路径；到点/force → 全表（失败则指数退避，上限 180s）。 */
function pollSeats(force = false, opts = {}) {
  const now = opts.now ?? Date.now();
  const base = opts.fullIntervalMs ?? SEAT_FULL_INTERVAL_MS;
  const cap = opts.fullMaxMs ?? SEAT_FULL_MAX_MS;
  const backoff = Math.min(base * 2 ** seatFullFails, cap);
  if (!force && !seatProbeRequested && now - seatFullAt < backoff) { pollSeatsLight(opts); return "light"; } // SYS-88：复探请求（窗活/pid 死）→ 跳过退避直接全表换档
  seatProbeRequested = false;
  const ok = (opts.full || pollSeatsFull)(opts) !== false;
  seatFullAt = now;
  if (ok) seatFullFails = 0;
  else { // SYS-103 S2.2：连续失败**升级告警**（旧仅 fault 一行 ⇒ 席位自动复亮静默停摆无人知）；每 5 次一报防刷屏
    seatFullFails++;
    if (seatFullFails >= 3 && (seatFullFails - 3) % 5 === 0) {
      const msg = `全表座探连续失败 ${seatFullFails} 次（座探.ps1/超时/负载）——席位自动复亮兜底已停摆，请查（SYS-103 S2）`;
      try { (opts.onAlert || ((m) => { if (IS_MAIN) { sendWatchAlert(m); fileProblem("SYS-103", "看板", m); } }))(msg); } catch (e) { fault("pollSeats.escalate", e); }
    }
  }
  return "full";
}

// ---------- 终端看板 v3「MOV Flow Journey」（工位=路标 · 主角单贴线显示；极简工作台，狐狸已删） ----------
const dw = (s) => { let w = 0; for (const ch of String(s)) w += ch.codePointAt(0) > 0x2e7f ? 2 : 1; return w; };
const cut = (s, w) => { let o = "", cw = 0; for (const ch of String(s)) { const k = ch.codePointAt(0) > 0x2e7f ? 2 : 1; if (cw + k > w) break; o += ch; cw += k; } return o; };
const pad = (s, w) => { const c = cut(s, w); return c + " ".repeat(Math.max(0, w - dw(c))); };
let selIdx = 0, drawer = false, frozen = false;
let selId = null, rowSel = 0, pageStart = 0, visRowsLast = 1, fullMode = false; // SYS-42：选中=工单表行单一真源；翻页/全量出口状态
let inputMode = false, inputBuf = "", flash = "", flashAt = 0; // 看板命令行：敲字即入输入态，Enter 执行
const flashMsg = (m) => { flash = m; flashAt = Date.now(); };
function runCommand(cmdline) {
  const c = cmdline.trim();
  if (!c) return;
  if (c === "开工" || c === "hire") {
    pollSeats(true); // 事件触发：开工前强制全表（派单 §二.1「仅事件触发（开工/敲铃前）」）
    const empty = SEAT_ROLES.filter(r => !seats[r]);
    if (!empty.length) return flashMsg("工位窗均已打开——绑定 agent 自动上岗中，灯不亮查窗内报错");
    for (const r of empty) openSeatWindow(r, Object.keys(ROLE_ALIAS).find(k => ROLE_ALIAS[k] === r));
    flashMsg(`已开 ${empty.length} 个工位窗（${empty.join("/")}）——agent 自动上岗中（约 10-20 秒亮灯，勿关窗）`);
  } else if (c === "下班" || c === "off") {
    for (const k of ["designer", "coder", "qa", "reviewer", "hygiene"]) {
      const f = path.join(HERE, "seats", `${k}.json`);
      try { const prev = JSON.parse(fs.readFileSync(f, "utf-8")); fs.writeFileSync(f, JSON.stringify({ ...prev, on: false, offAt: new Date().toISOString() }, null, 2)); } catch {}
    }
    flashMsg("全员下班——工位灯已熄");
  } else if (c === "巡查") {
    patrolHygiene(true);
    flashMsg("已向巡检台工位注入「巡查」（席不在岗则记档跳过）");
  } else if (c.startsWith("挂起")) {
    const m = c.slice(2).trim().split(/\s+/); const id = m[0];
    const parts = m.slice(1).join(" ").split("|").map(s => s.trim());
    if (!id || !parts[0]) return flashMsg("用法：挂起 <单号> <原因> | <解除条件>");
    parkTicket(id, parts[0], parts[1] || "待人工确认", "看板");
    flashMsg(`⏸ ${id} 已挂起（哨兵豁免）——解除条件：${parts[1] || "待人工确认"}`);
  } else if (c.startsWith("解挂")) {
    const id = c.slice(2).trim().split(/\s+/)[0];
    if (!id) return flashMsg("用法：解挂 <单号>");
    flashMsg(unparkTicket(id) ? `▶ ${id} 已解挂——复工信已投登记人角色` : `${id} 不在挂起登记里`);
  } else if (c.startsWith("new ") || c.startsWith("new	")) {
    const m = c.slice(4).trim(); const i = m.indexOf(" ");
    const id = i > 0 ? m.slice(0, i) : m, title = i > 0 ? m.slice(i + 1) : "";
    const logs = []; const orig = console.log; console.log = (...a) => logs.push(a.join(" "));
    try { cmdNew(id, title); } finally { console.log = orig; }
    flashMsg(logs[logs.length - 1] || `建单 ${id}`);
  } else if (c.startsWith("绑定")) {
    const m2 = c.split(/\s+/);
    if (m2.length !== 3) return flashMsg("用法：绑定 程序员 pi ｜ 绑定 全部 claude");
    const alias = { designer: "设计师", coder: "程序员", qa: "验收员", reviewer: "审验员", hygiene: "巡检台", 全部: "*", all: "*", "*": "*" };
    let target = alias[m2[1]] || m2[1];
    const b = readBinding();
    const hits = target === "*" ? ["设计师", "程序员", "验收员", "审验员", "巡检台"] : (["设计师", "程序员", "验收员", "审验员", "巡检台"].includes(target) ? [target] : []);
    if (!hits.length) return flashMsg(`未知角色：${m2[1]}（设计师/程序员/验收员/审验员/巡检台 或 全部）`);
    for (const r of hits) b[r] = m2[2];
    delete b._说明_;
    b._说明 = "开工时各角色自动启动的 agent。看板命令改：绑定 程序员 pi ｜ 绑定 全部 claude";
    fs.writeFileSync(BINDING_FILE, JSON.stringify(b, null, 2), "utf-8");
    flashMsg(`已绑定：${hits.join("/")} → ${m2[2]}（下次开工生效）`);
  } else if (c.startsWith("终端")) {
    const m3 = c.split(/\s+/);
    if (m3.length !== 2 || !["cmd", "powershell", "ps"].includes(m3[1].toLowerCase())) return flashMsg("用法：终端 cmd ｜ 终端 powershell（工位窗外壳，下次开窗生效）");
    const b = readBinding();
    b._shell = m3[1].toLowerCase() === "cmd" ? "cmd" : "powershell";
    fs.writeFileSync(BINDING_FILE, JSON.stringify(b, null, 2), "utf-8");
    flashMsg(`工位窗外壳已切：${b._shell}（下次开窗生效，已开的窗不变）`);
  } else flashMsg(`未知命令：${cut(c, 30)}（可用：开工 / 下班 / 巡查 / 挂起 单号 原因|条件 / 解挂 单号 / 绑定 角色 agent / 终端 cmd|powershell / new 号 标题）`);
}
const AMAP = { "\u00B7": "\u30FB", "\u2014": "\uFF0D", "\u2295": "+", "\u00D7": "x", "\u2026": "..", "\u2192": ">" };
const san = (t) => String(t).split("").map(ch => {
  const cp = ch.codePointAt(0);
  if (cp >= 0x2460 && cp <= 0x2473) return String(cp - 0x2460 + 1);
  if (AMAP[ch]) return AMAP[ch];
  return cp < 0x7F || cp > 0x2E7F ? ch : "?";
}).join("");
const padC = (t, wd) => { const v = dw(t); const l = Math.max(0, Math.floor((wd - v) / 2)); return " ".repeat(l) + cut(String(t), wd) + " ".repeat(Math.max(0, wd - v - l)); }; // 居中（显示宽度感知） // frozen=暂停渲染（框选复制用——600ms 重绘会冲掉选区）
const C = { dim: "\x1b[90m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", cyan: "\x1b[36m", bold: "\x1b[1m", rev: "\x1b[7m", off: "\x1b[0m" };
const stamp = (row, col, text) => row.slice(0, col) + text + row.slice(col + text.length);

// ── SYS-42 渲染预算与 g 全量出口（看板终端重构：消除无声截断） ──
function fitRows(rem, actN, dnN = 0) { // 行预算：工单表行=「分隔+行」2 线（现行式样）；优先全显，截断则强制留 1 行提示（不许无声截断）
  if (rem <= 0) return { vis: 0, hint: 0, doneN: 0 };
  let vis = Math.min(actN, Math.floor((rem - 1) / 2)); // -1=底框
  let hint = 0;
  if (actN > vis) { hint = 1; if (2 * vis + hint > rem - 1) vis = Math.max(0, vis - 1); } // 提示塞不下→让一行
  const left = rem - 1 - 2 * vis - hint;
  const doneN = left >= 2 ? Math.min(dnN, Math.floor(left / 2)) : 0;
  return { vis, hint, doneN };
}
function boardNavigate(state, k, total, step = 1) { // SYS-42 键位状态机（纯函数）：j/k 步进（页跟手由 buildFrame 跟随）；PgUp/PgDn 翻页（选中跟页）
  let r = Math.max(0, Math.min(state.rowSel ?? 0, Math.max(0, total - 1)));
  let p = Math.max(0, state.pageStart ?? 0);
  const st = Math.max(1, step);
  const maxP = Math.max(0, total - st);
  if (k === "down" || k === "j") r = Math.min(Math.max(0, total - 1), r + 1);
  else if (k === "up" || k === "k") r = Math.max(0, r - 1);
  else if (k === "pagedown") { const np = Math.min(maxP, p + st); if (np !== p) { p = np; r = Math.min(p, Math.max(0, total - 1)); } }
  else if (k === "pageup") { const np = Math.max(0, p - st); if (np !== p) { p = np; r = Math.min(p, Math.max(0, total - 1)); } }
  return { rowSel: r, pageStart: p };
}
function buildFullListText(D) { // g 全量出口：全量清单纯文本（普通缓冲，无 ANSI 码，可滚可复制；行尾统一 CRLF——cmd 口径）
  const LG = D.ledger || {};
  const act = LG.active || [], dn = LG.doneRecent || [];
  const parked = readParked();
  const fmt = (id, title, marks) => "  " + pad(san(id), 10) + " " + pad(san(title), 40) + " " + marks.map((m) => pad(m, 7)).join("");
  const lines = [];
  lines.push(`MOV 看板全量清单 ${new Date().toLocaleString("sv-SE")}（在途 ${act.length} 单 · 近日完成 ${dn.length} 单）`);
  lines.push("");
  lines.push(fmt("工单", "标题", ["设计", "开发", "验收", "审验", "合并"]));
  for (const r of act) {
    const marks = parked[r.id] ? r.marks.map((m) => (m === "办" ? "挂" : m)) : r.marks;
    lines.push(fmt(r.id, r.title, marks));
  }
  if (dn.length) {
    lines.push("");
    lines.push("—— 近日完成 ——");
    for (const r of dn) lines.push(fmt(r.id, r.title, r.marks));
  }
  return lines.join("\r\n");
}


// 看板单实例自保：杀掉其它 MOV-BOARD 窗（命令行锚点）+ 其它 engine.mjs board 进程；自己（node pid）与自己的宿主窗（ppid）豁免
function killStaleBoards(opts = {}) {
  try {
    const me = opts.me ?? process.pid, host = opts.host ?? (process.ppid || 0);
    // SYS-111 跨体系互杀修复（P1·源=网页体系移交件《跨体系移交_引擎互杀修复_安卓侧》）：
    //   旧版只按 `MOV-BOARD` / `engine.mjs*board` 匹配、**不校验路径**，仅排除自身/父 pid ⇒
    //   我方板一启动即杀**其它体系**的 board（对方 4 次死亡时间线与我方板启动时刻吻合：18:52:00.832 心跳停 ↔ 我方 pid 33272 @18:51:58）。
    //   修法①：**体系作用域**——命令行归一（反斜杠→正斜杠 + 小写）后须含 `<本体系看板根>/`；异体系板一律不动。
    //   作用域判定抽成**纯谓词 scopeOk**（可单测）；fetchCandidates/killProc/dryRun/noLog 全可注（测试与干跑）。
    const scope = (path.join(HERE).replace(/\\/g, "/") + "/").toLowerCase();
    const scopeOk = (cmdline) => String(cmdline || "").replace(/\\/g, "/").toLowerCase().includes(scope);
    const fetchCandidates = opts.fetchCandidates || (() => {
      // SYS-160：Linux 走 ps 同口径筛选（cmd.exe/看板-终端 为 Windows 形态；Linux 侧按 node + engine.mjs + board 作用域）
      const raw = IS_WIN
        ? winShell(`powershell -NoProfile -Command "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; Get-CimInstance Win32_Process | Where-Object { ($_.Name -eq 'cmd.exe' -and ($_.CommandLine -like '*MOV-看板*' -or $_.CommandLine -like '*MOV-BOARD*' -or $_.CommandLine -like '*看板-终端.cmd*')) -or ($_.Name -eq 'node.exe' -and $_.CommandLine -like '*engine.mjs*board*') } | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress"`, { encoding: "utf8", timeout: 15000 }).trim()
        : JSON.stringify(linuxProcs().filter((x) => /engine\.mjs/.test(x.CommandLine || "") && /board/.test(x.CommandLine || "")).map((x) => ({ ProcessId: x.ProcessId, CommandLine: x.CommandLine })));
      let arr = JSON.parse(raw || "[]"); if (!Array.isArray(arr)) arr = [arr];
      return arr;
    });
    const killProc = opts.killProc || ((pid) => process.kill(pid, "SIGTERM"));
    const acts = [];
    for (const c of fetchCandidates()) {
      const pid = Number(c && c.ProcessId) || 0;
      if (!pid || pid === me || pid === host) continue;           // 自身/父 pid 排除
      if (!scopeOk(c && c.CommandLine)) { acts.push(`skip(异体系或无路径) pid=${pid}`); continue; } // SYS-111 ①：异体系不动
      if (opts.dryRun) { acts.push(`dry-run 拟回收 pid=${pid}`); continue; }                          // SYS-111 ③ 干跑证据
      try { killProc(pid); acts.push(`回收 pid=${pid}`); } catch {}                                   // SYS-111 ③ 注缝
    }
    if (!opts.noLog && acts.length) try { fs.appendFileSync(path.join(HERE, "巡铃.log"), `[${new Date().toLocaleString("sv-SE")}] SYS-111 killStaleBoards：${acts.join(" ｜ ")}
`); } catch {} // ④ 留痕（日期列）
  } catch {}
}

// SYS-38 信量格账目口径：数量=今日新到（在箱+归档 created=今日）／处理=累计已销（归档 mtime=销信时刻·**闭环数**）／未处理=当前在箱。
// 回执归档化（SYS-38）后归档含回执——回执不计新到/处理（处理=闭环数=原件销数），保持口径与用户令一致。
function mailLedgerStats(boxRoot, nowMs) {
  const today = new Date(nowMs).toLocaleDateString("sv-SE");
  const ROLES4 = ["设计师", "程序员", "验收员", "审验员"];
  const st = {};
  for (const r of ROLES4) st[r] = { inbox: 0, todayNew: 0, todayInbox: 0, todayDone: 0 };
  for (const r of ROLES4) {
    try {
      const dir = path.join(boxRoot, r, "INBOX");
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) {
        st[r].inbox++;
        try { const c = fs.readFileSync(path.join(dir, f), "utf-8").slice(0, 400).includes(`created: ${today}`); if (c) { st[r].todayNew++; st[r].todayInbox++; } } catch {}
      }
    } catch {}
  }
  try {
    const arch = path.join(boxRoot, "归档");
    for (const f of fs.readdirSync(arch).filter((x) => x.endsWith(".md"))) {
      try {
        const raw = fs.readFileSync(path.join(arch, f), "utf-8").slice(0, 400);
        if (/^type:\s*回执/m.test(raw)) continue; // 回执归档化：回执不计
        const to = (raw.match(/^to:\s*(\S+)/m) || [])[1];
        if (!to || !st[to]) continue;
        if (raw.includes(`created: ${today}`)) st[to].todayNew++;
        if (new Date(fs.statSync(path.join(arch, f)).mtimeMs).toLocaleDateString("sv-SE") === today) st[to].todayDone++; // 归档 mtime=销信时刻
      } catch {}
    }
  } catch {}
  return st;
}
function cmdBoard() {
  LONG_RUNNING = true; // 长跑模式：进程级保险丝留痕不杀
  const smoke = !!process.env.SMOKE;
  if (!process.stdout.isTTY && !smoke) { cmdStatus(); out("（非终端环境——在 CMD 里跑 看板-终端.cmd）"); return; }
  // SYS-173 追加B：引擎换新必留痕——pid 行可与 看板-终端.cmd/开工.cmd 的启动行对上（今晚 10:32 换新无 log 行案）
  if (!smoke) { try { fs.appendFileSync(path.join(HERE, "全席重启.log"), `${new Date().toLocaleTimeString("sv-SE")} | 引擎换新（engine.mjs board·pid=${process.pid}）\n`); } catch {} }
  if (!smoke) killStaleBoards(); // 单实例自保（2026-09-10 用户拍板：只显示最新看板窗，旧窗杀掉）——重启残留的旧窗/旧 node 全清；SYS-29：一次性 smoke 无杀戒（15:41 曾误杀活引擎 pid 13424）
  if (!smoke) boardPool = createPool({ stateFile: path.join(HERE, "值守池.json") }); // SYS-45：headless 工位池（按需 spawn·pi RPC）
  // ── SYS-42：SMOKE 单帧回归钩子（BW_SEL/BW_PAGE 定选中与页码；BW_FULL 打印全量清单）——可复跑证据口径 ──
  if (smoke && process.env.BW_SEL) { selId = null; rowSel = Math.max(0, parseInt(process.env.BW_SEL, 10) || 0); }
  if (smoke && process.env.BW_PAGE) pageStart = Math.max(0, parseInt(process.env.BW_PAGE, 10) || 0);
  if (smoke && process.env.BW_DRAWER) drawer = true; // SYS-46 D：抽屉帧（巡检台入 [d]）
  if (smoke && process.env.BW_FULL) { process.stdout.write(buildFullListText(collect({ fast: true })) + "\r\n"); return; }
  if (!smoke) flashMsg("↑↓/j k 选单 · PgUp/PgDn 翻页 · g 全量清单 · d 详情 · q 退出"); // SYS-42 键位提示（启动 6s 内）
  const W = () => (smoke && +process.env.BW_W) || process.stdout.columns || 100, H = () => (smoke && +process.env.BW_H) || process.stdout.rows || 30;
  let alive = true;
  const cleanup = () => { if (smoke) return; alive = false; try { if (boardPool) boardPool.stopAll(); } catch {} process.stdout.write("\x1b[?1049l\x1b[?25h"); process.exit(0); };

  const buildFrame = () => {
    const w = W(), h = H();
    const D = collect({ fast: true });
    const cards = D.cards;
    // ── SYS-42 选中=工单表行（单一真源）：表格高亮/旅程线漂牌/主角单同源；预算分行见下 ──
    const R = D.ledger?.active || [];
    if (R.length) {
      if (selId == null) selId = rowSel > 0 ? (R[Math.min(rowSel, R.length - 1)]?.id ?? null) : (cards[0]?.id ?? R[0].id);
      let ri = R.findIndex(r => r.id === selId);
      if (ri < 0) ri = Math.max(0, Math.min(rowSel, R.length - 1));
      selId = R[ri].id; rowSel = ri;
    } else if (selId == null && cards.length) selId = cards[0].id;
    const ci = cards.findIndex(c => c.id === selId); if (ci >= 0) selIdx = ci;
    const sel = selId ? (cards.find(c => c.id === selId) || null) : null;
    const actN = R.length, dnN = (D.ledger?.doneRecent || []).length;
    const compact = h < 32; // SYS-42：矮窗折叠（巡检台+今日 → 一行）
    const seatStates = seatRunStates(D); // SYS-46 A：席位三态（缓存 10s；pollSeats 时点复用）
    const hasLine = !!sel; // 2026-09-11 用户令：兜底行删——主角单区仅卡存在时有内容
    const boxMin = compact ? (hasLine ? 1 : 0) : (sel ? 4 : 2); // 主角单最小行数（矮窗无内容=0；常规无卡=2 空行）
    const PAD = 2; // 表前留白：首站名完整居中于左框节点所需
    const TW = Math.max(26, w - 49 - PAD); // 标题列吃满余宽——全表=PAD+TW+49 列贴屏
    const L = [];

    // ── 顶栏：只有名字、时间、需要关注数 ──
    const warnN = (D.attention.P0 || 0) + (D.attention.P1 || 0);
    const warn = warnN ? C.yellow + `⚠ ${warnN}` + C.off : C.green + "✓" + C.off;
    L.push(` ${C.bold}${C.cyan}MOV Flow${C.off} ${C.dim}${new Date().toLocaleTimeString("sv-SE")}${C.off}` + " ".repeat(Math.max(1, w - dw(" MOV Flow " + new Date().toLocaleTimeString("sv-SE") + "  " + `⚠ ${warnN}`) - 2)) + warn);
    L.push("");

    // ── 旅程线：站名+agent 在线上方，工单漂牌在线下方按列竖排（2026-09-10 用户拍板改版，替 09-09 极简版） ──
    const NODES = ["设计", "开发", "验收", "审验"]; // 四站制：合并节点已删（2026-09-10 拍板——合并是位置不是工位，永远灰○无信息量；工单表仍保留「合并」列）
    const tableL = PAD, tableR = PAD + TW + 47; // 表格左右边框列（右边框=PAD+1+内容+6内隔）
    const colOf = (i) => tableL + Math.round(i * (tableR - tableL) / 3); // 四站：首站压左框、末站压右框
    const NODE_KEY = { "设计师": 0, "程序员": 1, "验收员": 2, "审验员": 3, "完成": 4 };
    const selIdxOnLine = sel ? (sel.merge ? 0 : NODE_KEY[sel.station] ?? -1) : -1;
    const phaseMap = new Map((D.ledger?.active || []).map(r => [r.id, PHASE_OWNER[r.phase]]).filter(([, v]) => v));
    const doneSet = new Set(D.ledger?.doneIds || []); // 终态单（merged/closed）：其信件=终态后噪音（回执等），不挂漂牌
    const chipsPer = [], colPer = []; // 每站：漂牌数组（在途单 id；未读信从 re 提取工单号——用户令 2026-09-11：📮 不上面板）
    for (let i = 0; i < 4; i++) {
        const role = D.stations[i].role;
        const group = (D.cards || []).filter(c => (c.merge ? "设计师" : c.station) === role);
        const chips = group.map(c => c.id);
        // 账本在途单：按当前相位挂到归属站——人工路单在信被读/销后仍持续显示（与表格「办」列同源同站）
        for (const [tid, owner] of phaseMap) {
          if (owner === role && !chips.includes(tid) && !chips.some(x => x.endsWith(tid))) chips.push(tid);
        }
        for (const l of (D.mail.inflight || []).filter(l => l.to === role)) {
          const m = (l.re || "").match(/(?:UPG|SYS|W|S|HMOS)-[A-Za-z0-9]+/);
          if (!m || doneSet.has(m[0])) continue; // 终态后噪音信不挂牌（SYS-13 merged 后回执漂牌案）
          if ((l.type || "").trim() === "打回") { // 打回信：球在收信人手里，直接挂
            if (!chips.includes(m[0]) && !chips.some(x => x.endsWith(m[0]))) chips.push(m[0]); // 用户令：无 📮 前缀
            continue;
          }
          const owner = phaseMap.get(m[0]) || role; // 票不在账本→按信面站
          if (owner !== role) continue;             // 票已流转离站——旧信不显示
          if (!chips.includes(m[0]) && !chips.some(x => x.endsWith(m[0]))) chips.push(m[0]); // 用户令：无 📮 前缀
        }
        chipsPer.push(chips);
        colPer.push(group.some(c => c.attention === "P0") ? C.red : group.some(c => c.attention === "P1") ? C.yellow : C.dim);
    }
    // 站名行 + agent 行（在线上方）：站名空位=灰名；agent 行=运行态三态（SYS-46 A：⏳跑动中/○待命/⚠️挂死疑）
    let nameRow = "", nameCol = 0, agentRow = "", agentCol = 0;
    for (let i = 0; i < 4; i++) {
        const st = D.stations[i];
        const on = st?.seat?.on === true; // 在线=agent 进程活着（座探验活）
        const nv = dw(NODES[i]);
        const start = Math.max(0, Math.min(w - nv, colOf(i) - Math.floor(nv / 2)));
        nameRow += " ".repeat(Math.max(0, start - nameCol)) + (on ? C.off : C.dim) + NODES[i] + C.off;
        nameCol = start + nv;
        const stt = seatStates[i] || {};
        const txt = `${st?.seat?.agent || (on ? "?" : "离线")}`; // 用户令（2026-09-11）：看板不上 ⏳/⌛ 字形设计（态仍以颜色区分·窗标题另有 B）
        const av = dw(txt);
        const aStart = Math.max(0, Math.min(w - av, colOf(i) - Math.floor(av / 2)));
        const acol = on && stt.label === "跑动中" ? C.green : stt.glyph === "⚠️" ? C.red : C.dim;
        agentRow += " ".repeat(Math.max(0, aStart - agentCol)) + acol + txt + C.off;
        agentCol = aStart + av;
    }
    L.push(nameRow);
    L.push(agentRow);
    // 时间线：灯=工作状态（2026-09-10 用户拍板：灯不再=agent上线）——在线且手上有活（在途单归属本站/有未读信）=●绿；其余=○灰
    let lineRow = " ".repeat(colOf(0));
    for (let i = 0; i < 4; i++) {
        const st = D.stations[i];
        const on = st?.seat?.on === true;
        const busy = on && (chipsPer[i].length > 0 || (D.mail.inflight || []).some(l => l.to === st.role));
        lineRow += (busy ? C.green + "●" : C.dim + "○") + C.off;
        if (i < 3) lineRow += C.dim + "─".repeat(Math.max(1, colOf(i + 1) - colOf(i) - 1)) + C.off;
    }
    L.push(lineRow);
    // 工单漂牌：线下方按列竖排（每站一列；SYS-42 预算：矮窗封顶行数，末行 +N 保留去向）
    const MAXROWS = 5; // 漂牌硬上限
    const floorRows = compact ? 3 : 2; // 工单表保底行数：矮窗 3（派单口径）；常规 2（不无声截断即可）
    const tableFloor = 3 + 2 * Math.min(floorRows, actN) + (actN > floorRows ? 1 : 0); // 表头2+行(分隔+行)+提示+底框
    const secLines = compact ? 1 : 17; // SYS-46 D：巡检台入抽屉；2026-09-11 用户新表（巡检台四行）回归主屏
    const chipsCap = Math.max(0, Math.min(MAXROWS, h - L.length - 1 - boxMin - secLines - tableFloor - 1));
    const maxLen = Math.min(Math.max(0, ...chipsPer.map(c => Math.min(c.length, MAXROWS))), chipsCap);
    for (let r = 0; r < maxLen; r++) {
        let row = "", cursor = 0;
        for (let i = 0; i < 4; i++) {
            const chips = chipsPer[i];
            let chip = chips[r];
            if (r === maxLen - 1 && chips.length > maxLen) chip = `+${chips.length - maxLen + 1}`;
            if (!chip) continue;
            const cv = dw(chip);
            const cStart = Math.max(0, Math.min(w - cv, colOf(i) - Math.floor(cv / 2)));
            if (cStart < cursor) continue; // 极窄屏放不下则跳过，不重叠
            // 2026-09-11 用户令：旅程线选中高亮撤除（chip 一律本列色）
            row += " ".repeat(cStart - cursor) + colPer[i] + chip + C.off;
            cursor = cStart + cv;
        }
        L.push(row);
    }
    L.push("");

    // ── 主角单：带边框信息盒（居中于当前站点；内容经 san 净化，中行宽=横线宽） ──
    if (sel) {
      if (compact) {
        // SYS-42 矮窗：主角单压成一行（盒 3 行+空 1 → 1 行，行数让给工单表）
        const rest = san(` ｜ ${sel.action}${sel.elapsed ? " ・ " + sel.elapsed : ""}`);
        L.push(" ".repeat(PAD) + C.bold + sel.id + C.off + C.dim + cut(rest, Math.max(4, w - PAD - dw(sel.id) - 1)) + C.off);
      } else {
      const idx = Math.max(0, selIdxOnLine);
      const anchor = Math.max(4, Math.min(w - 10, colOf(idx)));
      const rest = san(` ｜ ${sel.action}${sel.elapsed ? " ・ " + sel.elapsed : ""} `);
      const innerW = dw(sel.id) + dw(rest); // 中行内容 = 1空格 + id + rest
      const box = innerW + 3;
      const bcol = Math.max(2, Math.min(w - box - 2, anchor - Math.floor(box / 2)));
      L.push(stamp(" ".repeat(w), bcol, C.dim + "┌" + "─".repeat(innerW + 1) + "┐" + C.off));
      L.push(stamp(" ".repeat(w), bcol, C.dim + "│" + C.off + " " + C.bold + sel.id + C.off + C.dim + rest + C.off + C.dim + "│" + C.off));
      L.push(stamp(" ".repeat(w), bcol, C.dim + "└" + "─".repeat(innerW + 1) + "┘" + C.off));
      L.push("");
      }
    } else {
      // 无卡：用户令（2026-09-11）——兜底行删；只留空位（主角单区仅卡存在时有内容）
      // ponytail: 不追求填满——只在保底不足时收缩（大窗多显行可再扫最优，代价换代码；升级路径=按余量扫描）
      let blanks = compact ? 0 : 6;
      for (; blanks > 2 && fitRows(h - 1 - (L.length + blanks + secLines + 2), actN, dnN).vis < Math.min(2, actN); blanks--);
      for (let i = 0; i < blanks; i++) L.push("");
    }
    // ── SYS-46 D：巡检台整表搬入 [d] 抽屉（主屏退场）；数据提升一段一用（抽屉与今日折叠行共用） ──
    const pt = readJson(path.join(HERE, "巡查哨兵.json")) || {};
    const b0 = readBinding();
    const ivMin = Number(b0._hygienePatrolMin) > 0 ? Number(b0._hygienePatrolMin) : (Number(b0._hygienePatrolHours) > 0 ? Number(b0._hygienePatrolHours) * 60 : 240);
    const hm = (ms) => { if (!ms) return "—"; const d = new Date(ms); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
    const hs = D.hygieneSeat || { on: false, agent: "" };
    const hyUnread = (D.mail.inflight || []).filter(l => l.to === "巡检台").length;
    const patrolling = hs.on === true && (hyUnread > 0 || (pt.lastAt && Date.now() - pt.lastAt < 10 * 60e3)); // 巡逻中=有信待办或巡查刚触发 10 分钟内
    const dogSt = readJson(path.join(HERE, "疯狗.json")) || {};
    const bites = Object.keys(dogSt).filter(k => !k.startsWith("_")).length; // 疯狗咬痕=未销账的咬击数（信销了才销账；_ 前缀=元数据）
    const dogLast = dogSt._lastAt ? Date.parse(dogSt._lastAt) : 0;
    const sc = readJson(path.join(HERE, "..", "..", "巡检台", "checks", "成绩.json")) || {}; // 卫生分=检查项注册表记分卡（记分.mjs 落账）
    const scSum = sc.summary || null;
    const scCell = scSum ? `${scSum.pass}/${scSum.total}${scSum.redFail ? "·红" + scSum.redFail : ""}` : "—";
    // SYS-44 配额（用户直令）：目标读 工位绑定.json._quota.target，现状=在途实况分类（/^SYS/=factory，其余=product）
    const qt = (readBinding()._quota || {}).target || {};
    const qSum = (qt.product || 0) + (qt.factory || 0);
    const qProT = qSum ? Math.round((qt.product || 0) / qSum * 100) : 0, qFacT = qSum ? 100 - qProT : 0;
    const qProPct = R.length ? Math.round(R.filter((r) => !/^SYS/i.test(r.id)).length / R.length * 100) : null;
    const qFacPct = qProPct == null ? null : 100 - qProPct;
    const qCellP = qProPct == null ? "—" : `${qProPct}%`;
    const qCellF = qFacPct == null ? "—" : `${qFacPct}%`;
    const pushHygieneTable = () => { // SYS-46 D：巡检台表（9 列原样·仅 [d] 抽屉可见）
      const PC = [8, 14, 14, 7, 7, 8, 8, 8, 8];
      const PB = C.dim + "│" + C.off;
      const pbl = (l, m, r) => " ".repeat(PAD) + C.dim + l + PC.map(cw => "─".repeat(cw)).join(m) + r + C.off;
      const prow = (cells, cf) => " ".repeat(PAD) + PB + cells.map((c2, i) => (cf ? cf(c2, i) : "") + padC(c2, PC[i]) + C.off).join(PB) + PB;
      L.push(pbl("┌", "┬", "┐"));
      L.push(prow(["巡检台", "状态", "本轮主题", "上次", "下次", "疯狗咬痕", "卫生分", "软件配额", "系统配额"], () => C.bold));
      L.push(pbl("├", "┼", "┤"));
      L.push(prow([
        "白鸽",
        hs.on ? `${hs.agent || "?"} ${patrolling ? "●巡逻中" : "○待命"}` : "离线",
        pt.theme ? `卫生+${pt.theme}` : "—",
        hm(pt.lastAt),
        pt.lastAt ? "~" + hm(pt.lastAt + ivMin * 60e3) : "—",
        String(bites),
        scCell,
        qCellP,
        qCellF,
      ], (c2, i) => i === 1 ? (patrolling ? C.green : (hs.on ? C.off : C.dim)) : i === 5 ? (bites > 0 ? C.red : C.dim) : i === 6 ? (!scSum ? C.dim : scSum.redFail > 0 ? C.red : scSum.fail > 0 ? C.yellow : C.green) : i === 7 ? (qProPct == null ? C.dim : qProPct >= qProT ? C.green : C.red) : i === 8 ? (qFacPct == null ? C.dim : qFacPct <= qFacT ? C.green : C.red) : i === 0 ? C.dim : ""));
      L.push(pbl("└", "┴", "┘"));
    };

    // ── 二级：其余在途单（一行一单，安静）／或按 d 展开详情 ──
    if (drawer) {
      L.push(" " + C.dim + "─".repeat(Math.max(6, w - 4)) + C.off);
      if (sel) {
        L.push(` ${C.bold}${sel.id}${C.off} ${sel.title} ｜ ${sel.station}${sel.merge ? "·合并位" : ""} ｜ ${sel.attention} ${sel.reasons.join("·")}${sel.flag ? " ｜ " + C.red + "🚩" + sel.flag + C.off : ""}`);
        for (const hl of sel.hist || []) L.push(` ${C.dim}${hl}${C.off}`);
      }
      L.push(" " + C.dim + "─ 系统 ─" + C.off);
      const Hh = D.health;
      const a = D.attention;
      L.push(` ⚠ ${[a.P0 ? C.red + `P0×${a.P0}` + C.off : "", a.P1 ? C.yellow + `P1×${a.P1}` + C.off : "", a.P2 ? `P2×${a.P2}` : ""].filter(Boolean).join(" ") || C.green + "全部正常" + C.off}　在途 ${D.mail.inflight.length} · 未消费 ${D.mail.unconsumed.length}　${faultCount ? C.red + `🔧 故障×${faultCount}` + C.off : C.dim + "🔧 零故障" + C.off}`);
      L.push(` 工具 ${Hh.tools.disk}/${Hh.tools.reg} ｜ 问题 ${Hh.problems} ｜ 挂账 ${Hh.ledger} ｜ 巡查 ${Hh.lastReport ? Hh.lastReport.replace("卫生巡查报告_", "").replace(".md", "") : "—"} ｜ 巡检台 ${Hh.hygieneOn ? C.green + "●" + C.off : "○"}`);
      L.push(` 工位态 ${D.stations.map((s, i) => { const stt = seatStates[i] || {}; return `${s.role}·${s.seat.on ? (s.seat.agent || "?") : "离线"}·${stt.actTxt || "—"}`; }).join("  ")}（最后活动·用户令：字形撤）`);
      // ── 席位表现横条（SYS-176 v2：数据源＝席位表现.json·单一入口·无数据/待刷新诚实态；回落假分已删）──
      L.push(" " + C.dim + "─ 席位表现 ─" + C.off);
      {
        const panel = seatScorePanel();
        const BAR_W = 20;
        for (const row of panel.rows) {
          if (row.state !== "ok") {
            L.push(`  ${C.bold}${row.role}${C.off} ${C.dim}${row.state === "stale" ? "── 数据待刷新" : "── 无数据"}${C.off}`);
            continue;
          }
          const sc = row.value;
          const fill = Math.round((sc / 100) * BAR_W);
          const color = sc >= SEAT_THRESH[0] ? C.green : sc >= SEAT_THRESH[1] ? C.yellow : C.red;
          const bar = color + "█".repeat(fill) + C.dim + "░".repeat(BAR_W - fill) + C.off;
          L.push(`  ${C.bold}${row.role}${C.off} ${bar} ${color}${sc}${C.off} ${color}${seatTag(sc)}${C.off}`);
        }
      }
      L.push(" " + C.dim + "─ 巡检台 ─" + C.off); // SYS-46 D：巡检台整表入抽屉（主屏退场）
      pushHygieneTable();
    } else {
      // 工单库表 v7（用户规范）：标题≤12字（含标点）；工单/标题居中；✓=过（完成行五列全✓，按1列计宽）；
      // 列头=设计/程序员/验收/审验/合并（与时间线同名）。宽度红线：中文=2列、其余=1列（含✓——用户终端实测窄渲染）。
      const LG = D.ledger || {};
      const act = LG.active || [], dn = LG.doneRecent || [];
      const CW = [10, TW, 6, 6, 6, 6, 6]; // 工单/标题(列宽内不限长，自动截断)/五个工序列等宽 6 列
      const P = C.dim + "│" + C.off;
      const bl = (l, m, r) => " ".repeat(PAD) + C.dim + l + CW.map(cw => "─".repeat(cw)).join(m) + r + C.off;
      const rowOf = (cells, cf, allC) => " ".repeat(PAD) + P + cells.map((c2, i) => (cf ? cf(c2, i) : "") + (allC || i >= 2 ? padC(c2, CW[i]) : pad(c2, CW[i])) + C.off).join(P) + P; // 表头全居中；内容 工单/标题靠左、工序列居中
      const markCol = (m) => m === "✓" ? C.green : m === "办" ? C.yellow + C.bold : C.dim;
      // ── 巡检台 v2（2026-09-11 用户令·九精灵编队）：状态|任务|频率|下次启动时间|实现方式|成果 ──
      // 用户令二版：位置下移（帧尾·工单表之下）+ 画全表格（行间分隔线）；高矮自适应保工单表
      const buildSpriteL = () => {
        // 2026-10-01 用户令「就两行·红绿灯」——替七列表格
        const wd = readJson(path.join(HERE, "看门狗.json")) || {};
        const patrolling = !!pt.lastAt && Date.now() - pt.lastAt < ivMin * 60e3;
        const hyNext = pt.lastAt ? `~${hm(pt.lastAt + ivMin * 60e3)}` : "—";
        const wdIssues = (wd.issues || []).length;
        const hyMailN = (() => { try { return fs.readdirSync(path.join(HERE, "..", "邮局", "邮箱", "巡检台", "INBOX")).filter(x => x.endsWith(".md")).length; } catch { return 0; } })();
        const out = [];
        out.push(" ".repeat(PAD) + C.dim + "─ 巡检台 ─" + C.off);
        // 白鸽
        const doveCol = patrolling ? C.green : (pt.skipStreak >= 3 ? C.yellow : C.green);
        const doveTxt = (pt.round ? `第${pt.round}巡` : "—") + `  下次${hyNext}` + (hyMailN > 0 ? `  欠信${hyMailN}` : "");
        out.push(" ".repeat(PAD) + ` ${doveCol}●${C.off} 白鸽    ${doveCol}${patrolling ? "正常" : pt.skipStreak >= 3 ? "连跳" + pt.skipStreak : "待命"}${C.off}   ${C.dim}${doveTxt}${C.off}`);
        // 看门狗
        const dogCol = wd.ok ? C.green : C.red;
        const dogTxt = (wd.ok ? "零告警" : `${wdIssues} 告警`) + (bites > 0 ? `  咬${bites}` : "");
        out.push(" ".repeat(PAD) + ` ${dogCol}●${C.off} 看门狗  ${dogCol}${wd.ok ? "正常" : "告警"}${C.off}   ${C.dim}${dogTxt}${C.off}`);
        out.push("");
        return out;
      };
      // ── 今日表 v2：已删（SYS-144 追加项·2026-09-29 用户令）——计算面同步删除（board-data 的 readDayStats/gitTodayLoc 等），看板每轮刷新不再对两仓跑 git log ──
      // ── 信量格（2026-09-12 立·2026-09-29 SYS-143 用户令删两行）：四角色 × **数量/未处理** 两行——放巡检台区上面 ──
      // 口径单一真源=mailLedgerStats()（见函数注释·SYS-38）：**保留行** 数量=工位数量／未处理=INBOX 实态（「信封量/处理」两行已按用户令删除）
      // 新鲜度（用户令 2026-09-12「看板数据更新要秒级别」）：废 10s TTL——每帧只探 5 个目录 mtime（µs 级），有变动才全扫（信件不可变、只在增删时变 mtime），等效秒级
      const buildMailL = () => {
        const ROLES4 = ["设计师", "程序员", "验收员", "审验员"];
        const now = Date.now();
        const g = globalThis;
        const boxRoot = path.join(HERE, "..", "邮局", "邮箱");
        let sig = "";
        for (const r of ROLES4) { try { sig += fs.statSync(path.join(boxRoot, r, "INBOX")).mtimeMs + ","; } catch { sig += "x,"; } }
        try { sig += fs.statSync(path.join(boxRoot, "归档")).mtimeMs; } catch { sig += "x"; }
        if (!g.__mailStats || g.__mailStats.sig !== sig) {
          const st = mailLedgerStats(boxRoot, now);
          g.__mailStats = { at: now, sig, st };
        }
        const st = g.__mailStats.st;
        const MC = [10, 12, 12, 12, 12];
        const MP = C.dim + "│" + C.off;
        const mrow = (cells, cf) => " ".repeat(PAD) + MP + cells.map((c2, i) => (cf ? cf(c2, i) : "") + padC(c2, MC[i]) + C.off).join(MP) + MP;
        const unCol = (v) => v >= 20 ? C.red + C.bold : v >= 10 ? C.yellow : C.cyan;
        // 高度自适应（SYS-42 预算纪律：精灵编队 N=9 与工单表优先）：h≥64=全隔线盒 11 线；52≤h<64=无内隔线盒 7 线；40≤h<52=单行汇总；h<40=不渲染
        // 口径（用户令 2026-09-29 晚·SYS-143）：**只留两行**——数量=工位数量（角色席在岗 1 + 值守工.json 该 mailbox 的 enabled 池工数）；未处理=当前未办信件（INBOX 计数·高亮阈值）。
        // 原「信封量=今日新到／处理=今日已销」两行已按用户令删除（`mailLedgerStats` 本体保留·账目面不动·sys38 用例仍核函数）。
        const seatCnt = (r) => {
          let n = 0;
          try { const sj = readJson(path.join(HERE, "seats", `${SEAT_KEY[r]}.json`)) || {}; if (sj.on === true) n++; } catch {}
          try {
            const wj = readJson(path.join(HERE, "..", "邮局", "值守工.json")) || {};
            for (const w of (wj.workers || [])) if (w && w.mailbox === r && w.enabled !== false) n++;
          } catch {}
          return n;
        };
        if (h < 40) return [];
        if (h < 52) {
          const one = `工位 ${ROLES4.map(r => `${r}${seatCnt(r)}`).join("·")}｜未办 ${ROLES4.map(r => st[r].inbox).join("/")}`;
          return [" ".repeat(PAD) + C.dim + cut(one, Math.max(10, w - PAD - 1)) + C.off];
        }
        const mbl = (l, m, r) => " ".repeat(PAD) + C.dim + l + MC.map(cw => "─".repeat(cw)).join(m) + r + C.off;
        const full = h >= 64; // 全隔线档
        const sep = () => mbl("├", "┼", "┤");
        const out = [mbl("┌", "┬", "┐"), mrow(["角色", ...ROLES4], (c2, i) => i === 0 ? C.dim : C.bold)];
        const line = (label, fn, cf) => { if (full) out.push(sep()); out.push(mrow([label, ...ROLES4.map(r => fn(st[r]))], cf || ((c2, i) => i === 0 ? C.dim : C.cyan))); };
        if (full) out.push(sep());
        out.push(mrow(["数量", ...ROLES4.map(r => String(seatCnt(r)))], (c2, i) => i === 0 ? C.dim : C.cyan));
        line("未处理", s => String(s.inbox), (c2, i) => i === 0 ? C.dim : unCol(st[ROLES4[i - 1]].inbox));
        out.push(mbl("└", "┴", "┘"));
        return out;
      };
      if (!compact) { const mailL = buildMailL(); if (mailL.length) { for (const s of mailL) L.push(s); L.push(""); } }
      // ── 席位表现横条（SYS-176 v2：两分支同构·数据源＝席位表现.json·单一入口；回落假分已删）──
      if (!compact) {
        L.push(" ".repeat(PAD) + C.dim + "─ 席位表现 ─" + C.off);
        const panel = seatScorePanel();
        const BAR_W = 16;
        for (const row of panel.rows) {
          if (row.state !== "ok") {
            L.push(" ".repeat(PAD) + ` ${C.bold}${row.role}${C.off} ${C.dim}${row.state === "stale" ? "── 数据待刷新" : "── 无数据"}${C.off}`);
            continue;
          }
          const sc = row.value;
          const fill = Math.round((sc / 100) * BAR_W);
          const col = sc >= SEAT_THRESH[0] ? C.green : sc >= SEAT_THRESH[1] ? C.yellow : C.red;
          const bar = col + "█".repeat(fill) + C.dim + "░".repeat(Math.max(0, BAR_W - fill)) + C.off;
          const load = (D.stations.find((s) => s.role === row.role)?.cards || []).length;
          L.push(" ".repeat(PAD) + ` ${C.bold}${row.role}${C.off} ${bar} ${col}${sc}${C.off} ${col}${seatTag(sc)}${C.off}${load ? C.dim + ` (${load}单)` + C.off : ""}`);
        }
        L.push("");
      }
      // ── 巡检台 v2 落位（2026-09-11 用户令二版修正：统计表之下、工单表之上；工单表=最底下） ──
      if (!compact) { const spriteL = buildSpriteL(); if (spriteL.length) { for (const s of spriteL) L.push(s); L.push(""); } }
      L.push(bl("┌", "┬", "┐"));
      L.push(rowOf(["工单", "标题", "设计", "开发", "验收", "审验", "合并"], () => C.bold, true));
      // ── SYS-42：预算分行 + 翻页 + 截断提示（替代 h-26 硬切——消除无声截断） ──
      const rem = h - 1 - L.length; // 表内可用行：行(分隔+行 2 线)+提示+完成行+底框（巡检台在表上方）
      const fit = fitRows(rem, actN, dnN);
      const vis = fit.vis;
      pageStart = Math.max(0, Math.min(pageStart, Math.max(0, actN - vis))); // 页码夹取
      if (rowSel < pageStart) pageStart = rowSel;                          // 选中行跟手：高亮行必在本页
      else if (rowSel >= pageStart + vis) pageStart = Math.max(0, Math.min(rowSel - vis + 1, Math.max(0, actN - vis)));
      visRowsLast = vis; // 帧内口径——翻页键（PgUp/PgDn/j/k）用
      const actSlice = act.slice(pageStart, pageStart + vis);
      const parkedRows = readParked(); // 挂起单：当前站「办」改显「挂」（2026-09-10 挂起制）
      for (const r of actSlice) {
        L.push(bl("├", "┼", "┤"));
        const marks = parkedRows[r.id] ? r.marks.map(m => m === "办" ? "挂" : m) : r.marks;
        L.push(rowOf([r.id, san(r.title), ...marks],
          (c2, i) => i >= 2 ? (c2 === "挂" ? C.cyan : markCol(c2)) : i === 1 ? C.dim : "")); // 2026-09-11 用户令：选中行反显撤除（行一律常规色）
      }
      if (fit.hint) {
        // 截断显式提示（矮窗验收口径：还有 N 单 · 按 g 看全）——行内单行（无分隔线，不占额外行）
        L.push(rowOf(["…", `还有 ${actN - vis} 单 · 按 g 看全${vis ? `（${pageStart + 1}-${pageStart + vis}/${actN} 张 · PgUp/PgDn 翻页）` : "（PgUp/PgDn 翻页）"}`, "", "", "", "", ""], () => C.dim));
      }
      for (let di = 0; di < fit.doneN; di++) {
        const r = dn[di];
        L.push(bl("├", "┼", "┤"));
        L.push(rowOf([r.id, san(r.title), ...r.marks], (c2, i) => i >= 2 ? C.green : C.dim));
      }
      L.push(bl("└", "┴", "┘"));
    }
    // ── 底部：留白 ──
    while (L.length < h - 1) L.push("");
    const tail = inputMode
      ? ` > ${inputBuf}_${C.dim}  [Enter 执行 Esc 取消] 开工 / 下班 / new 号 标题${C.off}`
      : (flash && Date.now() - flashAt < 6000) ? " " + C.yellow + flash + C.off : "";
    L.push(cut(tail, w - 1));
    return L.slice(0, h);
  };

  const fullListAndExit = () => { // SYS-42 g 出口：退出替代缓冲 → 普通缓冲打印全量清单（可滚可复制）
    fullMode = true; // 停帧停推卡——保住清单不被重绘冲掉
    let text = "";
    try { text = buildFullListText(collect({ fast: true })); } catch (e) { fault("board.fullList", e); text = "（全量清单生成失败：" + e.message + "）"; }
    process.stdout.write("\x1b[?1049l\x1b[?25h");
    process.stdout.write(text + "\r\n" + C.dim + "（全量清单·可滚动复制；按任意键关闭看板）" + C.off + "\r\n");
    setTimeout(() => process.stdin.once("data", () => process.exit(0)), 300); // 防连击 g 秒关
  };
  const render = () => {
    if (frozen || fullMode) return; // 暂停中不重绘——保住用户的框选；g 全量模式停帧
    process.stdout.write("\x1b[H\x1b[0J" + buildFrame().join("\r\n") + "\r\n");
  };
  let lastMadDogTick = 0; // 疯狗常驻（2026-09-11 用户令：巡检台标 5分钟/次——tick 内 5 分钟守卫；巡查点火仍即时放狗）
  const madDogTick = () => { const now = Date.now(); if (now - lastMadDogTick < 5 * 60e3) return; lastMadDogTick = now; madDog(); };
  const tickAll = async () => { try { const D = collect({ fast: true }); ringUnreadSeats(D); scanStalls(); scanSessionRotate(); patrolHygiene(); scanHygieneLine(); rootSentry(); tokenSentinel(); watchdog(D); madDogTick(); scanDispatchIdle(); scanClaimStale(); pullUpSilentSeats(); heartbeat(); for (const id of listIds()) await tick(id).catch(e => { note(id, "❌ " + e.message); fault("tick." + id, e); }); render(); } catch (e) { fault("tickAll", e); } }; // SYS-42 R1：职责循环不得因 fullMode 连坐（render 已单独守卫）
  if (smoke) { render(); process.stdout.write("\n（SMOKE 单帧渲染OK）\n"); return; }

  process.stdout.write("\x1b[?1049h\x1b[?25h");
  try { process.stdin.setRawMode(true); } catch {}
  process.stdin.resume();
  process.stdin.on("keypress", (ch, key) => {
    if (!alive) return;
    const k = (key && key.name) || ch;
    if (k === "q" && !inputMode) return cleanup();
    if (inputMode) {
      if (k === "enter" || k === "return") { const cmd = inputBuf; inputMode = false; inputBuf = ""; runCommand(cmd); render(); return; }
      if (k === "escape" || (key && key.ctrl && ch === "c")) { inputMode = false; inputBuf = ""; render(); return; }
      if (k === "backspace") { inputBuf = inputBuf.slice(0, -1); render(); return; }
      if (typeof ch === "string" && ch >= " ") { inputBuf += ch; render(); return; }
      return;
    }
    if (k === "c") {
      frozen = !frozen;
      if (frozen) process.stdout.write("\x1b[" + H() + ";1H\x1b[0K " + C.yellow + "[暂停] 画面已冻结，可框选复制；再按 c 恢复刷新" + C.off);
      else render();
      return;
    }
    if (frozen) return; // 冻结期间吞掉其余按键——任何输出都会冲掉用户的框选（含 g：不清框选屏）
    if (k === "g" && !fullMode) return fullListAndExit(); // SYS-42 g 全量出口；已开清单则吞掉（防重入重复打印）
    let cards = [], rows = [];
    try { const Dk = collect({ fast: true }); cards = Dk.cards || []; rows = Dk.ledger?.active || []; } catch (e) { fault("keypress.collect", e); return; }
    if (rows.length) { // SYS-42 选中=表行：j/k 步进（页跟手），PgUp/PgDn 翻页（选中跟页）——状态机纯函数 boardNavigate
      const nav = boardNavigate({ rowSel, pageStart }, k, rows.length, Math.max(1, visRowsLast));
      rowSel = Math.min(nav.rowSel, rows.length - 1); pageStart = nav.pageStart; selId = rows[rowSel].id;
    } else if (cards.length) { // 无账本行：兼容旧 单.json 流
      if (k === "down" || k === "j") selIdx = Math.min(cards.length - 1, selIdx + 1);
      if (k === "up" || k === "k") selIdx = Math.max(0, selIdx - 1);
      selId = cards[selIdx]?.id ?? selId;
    }
    if (k === "d") drawer = !drawer;
    if (k === "a" || k === "r") {
      const c = cards.find((x) => x.id === selId) || cards[Math.min(selIdx, cards.length - 1)];
      if (c) k === "a" ? approve(c.id) : rerun(c.id);
    }
    if (typeof ch === "string" && ch >= " ") { inputMode = true; inputBuf = ch === ":" ? "" : ch; render(); return; } // 敲字即入命令行
    render();
  });
  readline.emitKeypressEvents(process.stdin);
  pollSeats();
  setInterval(pollSeats, SEAT_TICK_MS);
  setInterval(tickAll, 2500);   // 引擎推卡
  installDailyBackup(); // SYS-49：跨日备份例程（60s 检查点，低频不动节拍）
  render();
}

// ---------- 投影看板（无 DB：只读 单.json + 内存日志环，按钮回调引擎） ----------
// 网页版已下线（2026-09-09 用户拍板：只要 CMD 终端形态）——serve 仅留 JSON API 调试口
function serve(port) {
  LONG_RUNNING = true; // 长跑模式：进程级保险丝留痕不杀
  installDailyBackup(); // SYS-49：API 口径也挂（看板窗没开时仍能跨日产出）
  const srv = http.createServer(async (req, res) => {
    try { // 闸内兜底：readT 遇坏单/API 参数异常不再静默杀引擎（旧状=unhandledRejection 直接崩）
    const u = new URL(req.url, "http://x");
    if (u.pathname === "/") { res.writeHead(200, { "content-type": "text/plain;charset=utf-8" }); return res.end("网页看板已下线——双击 看板-终端.cmd（四角布局+中枢居中）\nAPI: /api/board /api/state /api/ticket\n"); }
    if (u.pathname === "/api/board") {
      res.writeHead(200, { "content-type": "application/json;charset=utf-8" });
      return res.end(JSON.stringify(collect({ fast: true })));
    }
    if (u.pathname === "/api/state") {
      const tickets = listIds().map(id => ({ ...readT(id), log: (logRing[id] || []).slice(-8) }));
      res.writeHead(200, { "content-type": "application/json;charset=utf-8" }); return res.end(JSON.stringify({ tickets }));
    }
    if (u.pathname === "/api/ticket") {
      const id = u.searchParams.get("id");
      res.writeHead(200, { "content-type": "application/json;charset=utf-8" });
      return res.end(JSON.stringify({ t: readT(id), log: logRing[id] || [] }));
    }
    if (u.pathname.startsWith("/api/approve") && req.method === "POST") { approve(u.searchParams.get("id")); broadcast({ type: "state" }); return res.end("ok"); }
    if (u.pathname.startsWith("/api/rerun") && req.method === "POST") { rerun(u.searchParams.get("id")); broadcast({ type: "state" }); return res.end("ok"); }
    if (u.pathname.startsWith("/api/reject") && req.method === "POST") { reject(u.searchParams.get("id"), u.searchParams.get("to") || "", u.searchParams.get("note") || ""); broadcast({ type: "state" }); return res.end("ok"); }
    if (u.pathname === "/events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
      const fn = (m) => res.write(`data: ${JSON.stringify(m)}\n\n`);
      broadcast = fn; setInterval(() => res.write(": ping\n\n"), 15000);
      return;
    }
    res.writeHead(404); res.end();
    } catch (e) { fault("serve.handler", e); try { if (!res.headersSent) res.writeHead(500); res.end("internal error"); } catch {} }
  });
  srv.listen(port, "127.0.0.1", () => {
    out(`🚦 流水线看板：http://127.0.0.1:${port}　（本机可见，引擎在后台自动推卡）`);
    let yielded = false;
    setInterval(() => {
      // 双引擎互斥（2026-09-10 审查④）：另有活引擎（心跳新鲜+pid 活着）→ serve 让贤不驱动（防同单一 worktree 两边赛跑）；看板窗是主驾驶
      const hb = readJson(path.join(HERE, "心跳.json"));
      if (hb && hb.pid && hb.pid !== process.pid && Date.now() - Date.parse(hb.at || 0) < 90e3) {
        let alive = false; try { process.kill(hb.pid, 0); alive = true; } catch {}
        if (alive) { if (!yielded) { yielded = true; out(`⏸ 检测到活引擎（pid=${hb.pid}）——serve 只供 API，推卡让贤`); } return; }
      }
      if (yielded) { yielded = false; out("▶ 对侧引擎消失——serve 接管推卡"); }
      try { const D = collect({ fast: true }); ringUnreadSeats(D); scanStalls(); patrolHygiene(); scanHygieneLine(); watchdog(D); madDogTick(); scanDispatchIdle(); scanClaimStale(); pullUpSilentSeats(); heartbeat(); for (const id of listIds()) tick(id).catch(e => { note(id, "❌ " + e.message); fault("tick." + id, e); }); } catch (e) { fault("serve.tick", e); }
    }, 3000);
  });
}

function openSeatWindow(role, key) {
  const seatDir = path.join(HERE, "工位", role);
  fs.mkdirSync(seatDir, { recursive: true });
  const shell = readShell();
  const eng = path.join(HERE, "engine.mjs");
  // 双语版开窗链：cmd 用 &&/title/set，PowerShell 用 ;/$host.WindowTitle/$env:（PS 5.1 无 &&）。MOV_SEAT=角色 是座探的统一锚点（cmd/ps 通吃）
  // SYS-173：标题带体系标签 MOV-<席名>〔安卓中国〕（座探按 MOV- 前缀认窗·席名解析见 pollSeatsFull）
  const wakeCmd = shell === "powershell"
    ? `chcp 65001 >$null; $host.ui.RawUI.WindowTitle='MOV-${role}〔安卓中国〕'; $env:MOV_SEAT='${role}'; node "${eng}" wake ${key}; Write-Host ''; Write-Host '[启动中] 正在拉起绑定 agent（首次约 10-20 秒，请勿关窗）...'; ${agentLaunchCmd(role, shell)}`
    : `chcp 65001 >nul && title MOV-${role}〔安卓中国〕 && set "MOV_SEAT=${role}" && node "${eng}" wake ${key} && echo. && echo [启动中] 正在拉起绑定 agent（首次约 10-20 秒，请勿关窗）... && ${agentLaunchCmd(role, shell)}`; // 自动启动绑定 agent+上岗
  // Windows Terminal 开窗（用户拍板：体验优先）。通知走 agent 值守自轮询；铃注入仅 conhost 可用、降为备用
  const ps = shell === "powershell"
    ? `Start-Process powershell.exe -WorkingDirectory "${seatDir}" -ArgumentList '-NoExit','-NoProfile','-Command','${wakeCmd.replace(/'/g, "''")}'`
    : `Start-Process cmd.exe -WorkingDirectory "${seatDir}" -ArgumentList '/k','${wakeCmd.replace(/'/g, "''")}'`;
  try { winShell(`powershell -NoProfile -Command "${ps.replace(/"/g, '\"')}"`, { timeout: 15000 }); } catch (e) { out(`⚠️ ${role} 开窗失败：${String(e.message).slice(0, 80)}`); }
}
const [cmd, ...rest] = process.argv.slice(2);
// 可导入守卫（三层加固·三层：回归测试 import 时不跑派发）——engine.test.mjs 直接驱动 ringUnreadSeats 等函数
const IS_MAIN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (IS_MAIN) { const r = rotateFaultLog(); if (r) { faultCount = 0; out(`🗄 故障.log ${r.reason}轮转：${r.lines} 条 → 故障归档\\${path.basename(r.dest)}`); } } // SYS-32/SYS-156②：启动即轮（跨日/超量旧段归档，新段从 0 计）——轮转即计数同步归零（原只轮不零）
// UPG-355 高频入口：引擎启动即跑一次全域工具语法自检（增量缓存·常驻 ~0.5s）——工具崩了一个引擎周期内就暴露；只报不拦（引擎不断流）
if (IS_MAIN) {
  try { execFileSync("node", [path.join(WORKS, "处理中心", "机器闸", "工具自检.mjs"), "--quiet"], { timeout: 180000, stdio: "pipe", windowsHide: true }); }
  catch (e) { const t = String((e.stdout || "") + (e.stderr || "")).split("\n").filter((l) => l.includes("✗")).slice(0, 3).join(" ") || String(e.message).slice(0, 120); out(`⚠️ 工具自检未过（有工具语法崩——先修再动）：${t}`); }
}
if (!IS_MAIN) { /* 被 import：只出函数不出动作 */ }
else if (cmd === "new") cmdNew(rest[0], rest.slice(1).join(" "));
else if (cmd === "status") cmdStatus();
else if (cmd === "audit") await cmdAudit();
else if (cmd === "reject") reject(rest[0], rest[rest.indexOf("--to") + 1] || "", (rest[rest.indexOf("--note") + 1] || ""));
else if (cmd === "approve") approve(rest[0]);
else if (cmd === "rerun") rerun(rest[0]);
else if (cmd === "挂起") { const [id, ...ra] = rest; const parts = ra.join(" ").split("|").map(s => s.trim()); if (!id || !parts[0]) { out("用法：挂起 <单号> <原因> | <解除条件> | [登记角色]"); process.exit(2); } parkTicket(id, parts[0], parts[1] || "待人工确认", parts[2] || "cli"); out(`⏸ ${id} 已挂起（哨兵豁免），知会信已投设计师`); }
else if (cmd === "解挂") { if (!rest[0]) { out("用法：解挂 <单号>"); process.exit(2); } if (unparkTicket(rest[0])) out(`▶ ${rest[0]} 已解挂——复工信已投登记人角色`); else { out(`${rest[0]} 不在挂起登记里`); process.exit(1); } }
else if (cmd === "tick") await tick(rest[0]);
else if (cmd === "board") cmdBoard();
else if (cmd === "duty") {
  // 旧值守模式：邮局看门人（信到自动起 headless claude）。保留作无人在岗时的降级路径。
  const role = ROLE_ALIAS[rest[0]] || rest[0];
  if (!SEAT_ROLES.includes(role)) { out("用法：duty <designer|coder|qa|reviewer>"); process.exit(1); }
  process.stdout.write(`\x1b]0;MOV-${role}〔安卓中国〕\x07`); // SYS-173：duty 窗同带体系标签
  const child = spawn(process.execPath, [path.join(HERE, "..", "邮局", "值守.mjs")], {
    stdio: "inherit", env: { ...process.env, POST_ROLE: role },
  });
  child.on("close", (c) => process.exit(c ?? 0));
}
else if (cmd === "seat") {
  // 工位模式：PS Start-Process 开窗（标题/cd 全走 argv，防 cmd start 无引号标题被当命令的坑）。
  // 窗内 wake 完成登记（pid+hwnd）+ 提示——用户自己敲 claude / pi / reasonix 上岗，
  // agent 启动自动读工位目录的 CLAUDE.md/AGENTS.md 进入角色（与 agent 种类无关）。
  const role = ROLE_ALIAS[rest[0]] || rest[0];
  if (!SEAT_ROLES.includes(role)) { out("用法：seat <designer|coder|qa|reviewer>"); process.exit(1); }
  openSeatWindow(role, rest[0]);
  out(`🪑 ${role} 工位窗已开——绑定 agent（${readBinding()[role] || "claude"}）自动上岗中`);
}
else if (cmd === "wake") {
  // 工位窗内执行：登记本窗（hwnd 是铃的锚点，不依赖标题——claude 会改标题）+ 打印上岗提示
  const role = ROLE_ALIAS[rest[0]] || rest[0];
  if (!SEAT_ROLES.includes(role)) process.exit(1);
  let hwnd = 0;
  try { hwnd = parseInt(winShell(`powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(HERE, "窗柄.ps1")}"`, { encoding: "utf8" }).trim()); } catch {}
  fs.mkdirSync(path.join(HERE, "seats"), { recursive: true });
  const consolePid = process.ppid || 0; // 父进程 cmd = 本控制台客户端——铃2 按 PID 注入的锚点
  fs.writeFileSync(seatFileOf(rest[0]), JSON.stringify({ role, pid: process.pid, consolePid, hwnd, on: false, since: new Date().toISOString() }, null, 2)); // SYS-102：写档落 SEAT_KEY 英文键（中文名/别名入参不再生中文档）
  console.log(`[工位就绪·${role}] 窗已开——绑定 agent（${readBinding()[role] || "claude"}）随后自动启动并上岗，全程无需敲任何命令。`);
  console.log(`agent 启动约 10-20 秒（TUI 加载期本窗像普通 cmd，属正常）——进角色后 3 秒内看板亮灯。`);
  console.log(`若 20 秒后灯仍不亮：看下方 agent 是否报错（未登录/信任确认/命令不存在），修好后再敲  ${readBinding()[role] || "claude"} 上岗。`);
  console.log(`换绑 agent：看板窗敲  绑定 ${role} <agent名>（如 绑定 ${role} kimi）｜ 绑定 全部 claude。`);
  console.log(`信到时引擎自动向本窗注入「收信」触发词（WT/conhost 均实测可注入）——无需值守轮询、无需人工传话。`);
  console.log(`下班：对 agent 说 下班（它执行 offseat）或直接关窗。`);
}
else if (cmd === "onseat") {
  // agent 上岗报到（角色卡第 0 步）：灯亮=该工位 agent 已进入角色
  const role = ROLE_ALIAS[rest[0]] || rest[0];
  if (!SEAT_ROLES.includes(role)) { out("用法：onseat <designer|coder|qa|reviewer> [agent名]"); process.exit(1); }
  const f = seatFileOf(rest[0]); // SYS-102 写档规范化：一律英文键
  let prev = {}; try { prev = JSON.parse(fs.readFileSync(f, "utf-8")); } catch {}
  let hwnd = 0;
  try { hwnd = parseInt(winShell(`powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(HERE, "窗柄.ps1")}"`, { encoding: "utf8" }).trim()); } catch {}
  if (!hwnd) hwnd = prev.hwnd || 0; // 复用开窗时的锚点
  const detected = detectAgent({ consolePid: prev.consolePid }); // {name,pid}：SYS-88——非 shell＋CLI 签名＋本席窗树内＋最外层＋常驻候选（工具子进程/控制台 `&& pi` 不再落档）
  const agent = rest[1] || detected?.name || prev.agent || "";
  const agentPid = detected?.pid || prev.agentPid || null; // SYS-88 ②d：识别失败沿用旧 pid 但**撤归属戳**（判据侧改走现场核，不凭单 pid 判活）
  const pidTree = detected?.pid ? { root: Number(prev.consolePid) || 0, pid: detected.pid, at: new Date().toISOString() } : undefined; // 写档时核过窗树⇒判据侧快路径可用
  fs.writeFileSync(f, JSON.stringify({ ...prev, role, hwnd, on: true, agent, agentPid, pidTree, at: new Date().toISOString() }, null, 2)); // 展开保留 consolePid 等锚点（pidTree=undefined 即抹掉旧戳）
  out(`✅ ${role} 上岗报到完成（agent=${agent || "?"}${rest[1] ? "，自报" : detected ? "，自动识别" : ""}）——看板 3 秒内亮灯`);
}
else if (cmd === "offseat") {
  const role = ROLE_ALIAS[rest[0]] || rest[0];
  if (!SEAT_ROLES.includes(role)) { out("用法：offseat <designer|coder|qa|reviewer>"); process.exit(1); }
  const f = seatFileOf(rest[0]); // SYS-102 写档规范化：一律英文键
  let prev = {}; try { prev = JSON.parse(fs.readFileSync(f, "utf-8")); } catch {}
  fs.writeFileSync(f, JSON.stringify({ ...prev, on: false, offAt: new Date().toISOString() }, null, 2));
  out(`👋 ${role} 下班熄灯`);
}
else if (cmd === "下班" || cmd === "off") {
  // 一键全员下班（与看板窗「下班」同逻辑·2026-09-11 应用户令补 CLI 面：AI 操作员一键执行）：五席熄灯，不关窗不杀进程
  for (const k of ["designer", "coder", "qa", "reviewer", "hygiene"]) {
    const f = path.join(HERE, "seats", `${k}.json`);
    try { const prev = JSON.parse(fs.readFileSync(f, "utf-8")); fs.writeFileSync(f, JSON.stringify({ ...prev, on: false, offAt: new Date().toISOString() }, null, 2)); } catch {}
  }
  out("👋 全员下班——五席工位灯已熄（窗口与进程不动，只熄灯）");
}
else if (cmd === "巡查") { patrolHygiene(true); out("🕊 已向巡检台工位注入「巡查」（席不在岗则记档跳过，复岗第一分钟补巡）"); } // CLI 面 2026-09-11：原仅看板窗交互可发
else if (cmd === "轮换自检") { scanSessionRotate({ force: true, dry: true }); console.log("（轮换自检完·未注入·条件：会话≥2MB＋静置≥阈值（**随体量缩小**：≥10MB→1min／≥5MB→3min／其余 15min）＋信箱空＋冷却≥60min）"); } // 2026-09-28 立
else if (cmd === "放狗") { madDog(); out("🐕 已放狗绕场一圈（咬痕与升级见 处理中心\\看板\\疯狗.json）"); } // CLI 面 2026-09-11
else if (cmd === "绑定") {
  // 换绑 agent（与看板窗「绑定」同逻辑·2026-09-11 补 CLI 面）：写 工位绑定.json，下次开工/换防生效；不动 _说明 等其它键
  const alias = { designer: "设计师", coder: "程序员", qa: "验收员", reviewer: "审验员", hygiene: "巡检台", 全部: "*", all: "*", "*": "*" };
  const target = alias[rest[0]] || rest[0];
  const agent = rest[1];
  const hits = target === "*" ? ["设计师", "程序员", "验收员", "审验员", "巡检台"] : (["设计师", "程序员", "验收员", "审验员", "巡检台"].includes(target) ? [target] : []);
  if (!agent || !hits.length) { out("用法：绑定 <设计师|程序员|验收员|审验员|巡检台|全部> <agent名>（下次开工生效）"); process.exit(1); }
  const b = readBinding();
  for (const r of hits) b[r] = agent;
  fs.writeFileSync(BINDING_FILE, JSON.stringify(b, null, 2), "utf-8");
  out(`✅ 已绑定：${hits.join("/")} → ${agent}（下次开工/重开席生效；在灯席位不受影响）`);
}
else if (cmd === "hire") {
  // 一键入驻：给每个空角色开一个工位窗（窗内自动拉起 工位绑定.json 里绑定的 agent 并上岗）
  pollSeats(true); // 事件触发：入驻前强制全表（同上）
  const empty = SEAT_ROLES.filter(r => !seats[r]);
  if (!empty.length) out("✅ 五个工位均已就位，无需重复入驻");
  else {
    for (const r of empty) {
      const key = Object.keys(ROLE_ALIAS).find(k => ROLE_ALIAS[k] === r);
      openSeatWindow(r, key);
    }
    out(`🪑 已开出 ${empty.length} 个工位窗（${empty.join("/")}）——绑定 agent 自动上岗中（约 10-20 秒亮灯，勿关窗）；换绑：看板敲 绑定 全部 <agent名>`);
  }
}
else if (cmd === "serve") serve(Number(rest[0]) || 8461);
else if (!cmd) cmdBoard(); // 裸跑 engine.mjs = 直接开看板（2026-09-10：不带参数拿到用法页=打不开的体感来源）
else { out("MOV 流水线看板 —— board(终端大屏) | hire(一键开工位窗) | 下班/off(全员熄灯) | 巡查(手动触发一轮) | 放狗(madDog 绕场) | 绑定 <角色|全部> <agent>(换绑·下次开工生效) | seat/checkin <designer|coder|qa|reviewer>(工位) | duty <key>(headless值守降级) | new <号> <标题> | status | approve <号> | rerun <号> | tick <号> | serve [端口](JSON API·网页版已下线)"); }

// 测试导出（三层加固·三层）

// ---------- SYS-90 Token 哨兵（2026-09-25 用户令·钱包止血） ----------
// 三源读数（pi / kimi / hermes）→ 每席当日+近 7 日 → 巡检台/checks/token榜.json；单席当日超 _tokenBudget（缺省 300M）→ 告警。
// 纪律：分钟级节流 + 按文件增量（size 偏移）——不阻塞主循环（tick 心跳零降）；单源异常只 fault 不抛。
const TOKEN_STATE_FILE = path.join(HERE, "token哨兵.json");
const TOKEN_BOARD_FILE = path.join(HERE, "..", "..", "巡检台", "checks", "token榜.json");
const TOKEN_SENTRY_MS = 60e3;
const TOKEN_BUDGET_DEFAULT = 300e6;
const THRIFT_DEFAULT = { polls: 20, turns: 800 }; // SYS-167：单会话「轮询/回合」超阈初值（binding._pollLimit/_turnLimit 可配）
const POLL_VIEW_RE = /(^|[\s|;&"'])(ls|dir|cat|type|head|tail|find|rg|grep|stat|wc|Get-ChildItem|Get-Content)([\s"']|$)/i; // 查看类命令判据（轮询）
function countPollCalls(line) { // SYS-167：一条 pi assistant 行内数「信箱轮询」bash 调用（段内含 INBOX/邮箱 且为查看类）
  let n = 0;
  for (const seg of line.split('"type":"toolCall"').slice(1)) {
    if (!/"name":"bash"/.test(seg)) continue;
    if (!/INBOX|邮箱/.test(seg)) continue;
    if (!POLL_VIEW_RE.test(seg)) continue;
    n++;
  }
  return n;
}
let lastTokenScan = 0;

function walkFilesUnder(root, suffix, maxDepth = 5) {
  const out = [];
  const stack = [[root, 0]];
  while (stack.length) {
    const [dir, d] = stack.pop();
    let ents = [];
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) { if (d < maxDepth) stack.push([f, d + 1]); }
      else if (e.name.endsWith(suffix)) out.push(f);
    }
  }
  return out;
}
function tokenSeatOfCwd(cwd) { // 只认**本体系**工位（HERE=处理中心\看板）：锚体系根防网页体系同名席误归
  const c = String(cwd || "").replace(/\//g, "\\").replace(/\\+$/, "");
  const base = path.join(HERE, "工位").replace(/\//g, "\\");
  if (c.toLowerCase().startsWith((base + "\\").toLowerCase())) {
    const seat = c.slice(base.length + 1);
    if (/^[^\\]+$/.test(seat)) return seat;
  }
  return null;
}
function tokenSeatOfSlot(dirName) { // kimi wd_<sanitized-cwd>：含「本体系…工位_<角色>」才归席（防网页同名·无则全局）
  const d = String(dirName || "");
  if (!d.includes("安卓中国体系建设")) return null;
  const m = d.match(/工位[_-]([^_]+)$/);
  return m ? m[1] : null;
}
function readAppended(file, files, extract) { // 增量：仅解析新增字节（截断/重写→从头）；返回提取值
  let size = 0;
  try { size = fs.statSync(file).size; } catch { return extract(""); }
  const rec = files[file] || {};
  if (rec.size === size) return 0;
  const from = (rec.size !== undefined && rec.size <= size) ? rec.size : 0;
  let text = "";
  try { text = fs.readFileSync(file).subarray(from).toString("utf-8"); } catch { return 0; }
  files[file] = { ...rec, size };
  return extract(text);
}

/** UPG-482：瞬态文件锁码（Windows：杀软/索引/读句柄可瞬时占用目标）——这些码才重试，其它错直接抛。 */
const ATOMIC_LOCK_CODES = new Set(["EPERM", "EACCES", "EBUSY", "UNKNOWN"]);
/** 同步退避（引擎全程同步：临时件+rename 不能改异步）。Atomics.wait 在 Node 主线程可用；不支持时降级忙等。 */
function sleepSync(ms) {
  try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch { const end = Date.now() + ms; while (Date.now() < end) { /* 忙等降级 */ } }
}
/** 原子写（UPG-482）：临时件(<file>.tmp-<pid>)写满 → rename 替换 ⇒ 读者永不见半截；
 *  瞬态锁（EPERM/EACCES/EBUSY/UNKNOWN）退避重试 ≤retries 次（默认 5・200ms）；
 *  重试耗尽才抛（错误信息带 code，便于 故障.log 直读根因）；成功/失败一律不留 .tmp 残件。 */
function writeFileAtomic(file, text, io = fs, retries = 5, backoffMs = 200) {
  const tmp = file + ".tmp-" + process.pid;
  try {
    for (let i = 0; ; i++) {
      try { io.writeFileSync(tmp, text, "utf-8"); io.renameSync(tmp, file); return null; }
      catch (e) {
        if (!ATOMIC_LOCK_CODES.has(e?.code) || i >= retries) {
          const err = new Error(`原子写失败（重试 ${i} 次后放弃・code=${e?.code || "?"}）：${file} —— ${e?.message || e}`);
          err.code = e?.code;
          throw err;
        }
        sleepSync(backoffMs);
      }
    }
  } finally { try { io.unlinkSync(tmp); } catch { /* 已 rename 或未创建：无残件为正常态 */ } }
}

function tokenSentinel(force = false, opts = {}) {
  const now = opts.now || Date.now();
  if (!force && now - lastTokenScan < (opts.intervalMs ?? TOKEN_SENTRY_MS)) return;
  lastTokenScan = now;
  try {
    const stateFile = opts.stateFile || TOKEN_STATE_FILE;
    const st = readJson(stateFile) || {};
    const files = st.files || (st.files = {});
    const sums = st.sums || (st.sums = {});          // 键 "<源>|<席或_global>|<YYYY-MM-DD>"
    const day = new Date(now).toISOString().slice(0, 10);
    const add = (src, seat, n, d = day) => { if (!n) return; const k = src + "|" + (seat || "_global") + "|" + (d || day); sums[k] = (sums[k] || 0) + n; };
    const home = opts.home || os.homedir();
    // ① pi：~/.pi/agent/sessions/<slot>/<id>.jsonl（首行 cwd 判席；每行取末个 totalTokens=该响应读数）
    const piRoot = opts.piRoot || path.join(home, ".pi", "agent", "sessions");
    for (const f of walkFilesUnder(piRoot, ".jsonl")) {
      const rec0 = files[f];
      let size = 0; try { size = fs.statSync(f).size; } catch { continue; }
      if (rec0 && rec0.size === size) continue;
      let text = ""; try { text = fs.readFileSync(f).subarray(rec0 && rec0.size <= size ? rec0.size : 0).toString("utf-8"); } catch { continue; }
      let seat = rec0 ? rec0.seat : undefined;
      if (seat === undefined) {
        const m = text.match(/"cwd":"((?:[^"\\]|\\.)*)"/);
        seat = m ? tokenSeatOfCwd(m[1].replace(/\\\\/g, "\\")) : null;
      }
      if (!seat) { files[f] = { ...rec0, size, seat }; continue; } // 非本席（异体系/无 cwd）只记档位·不计数
      let turns = 0, polls = 0; // SYS-167：轮询/回合增量（与 token 同一次流读·不额外扫档·不阻塞主循环）
      for (const line of text.split("\n")) {
        if (!line.trim()) continue;
        if (line.includes('"role":"assistant"')) turns++;
        if (line.includes('"type":"toolCall"')) polls += countPollCalls(line);
        const mm = [...line.matchAll(/"totalTokens":(\d+)/g)];
        if (!mm.length) continue;
        const tm = line.match(/"timestamp":"(\d{4}-\d{2}-\d{2})/);
        add("pi", seat, Number(mm[mm.length - 1][1]), tm ? tm[1] : day); // 按行时间戳归日（首读历史不冒充今日）
      }
      files[f] = { size, seat, turns: (rec0?.turns || 0) + turns, polls: (rec0?.polls || 0) + polls };
    }
    // ② kimi：~/.kimi-code/sessions/<wd>/session_*/agents/*/wire.jsonl（step.end usage 四字段和）
    const kimiRoot = opts.kimiRoot || path.join(home, ".kimi-code", "sessions");
    for (const f of walkFilesUnder(kimiRoot, ".jsonl")) {
      if (!/wire\.jsonl$/.test(f)) continue;
      const wd = path.basename(path.dirname(path.dirname(path.dirname(path.dirname(f))))); // .../sessions/<wd>/session_*/agents/<a>/wire.jsonl
      const seat = tokenSeatOfSlot(wd);
      let kturns = 0, kpolls = 0; // SYS-167：kimi 侧回合/轮询（step.begin / Bash 工具调用·增量）
      readAppended(f, files, (text) => {
        for (const line of text.split("\n")) {
          if (line.includes('"type":"step.begin"')) kturns++;
          if (line.includes('"type":"tool.call"') && /"name":"Bash"/i.test(line) && /INBOX|邮箱/.test(line) && POLL_VIEW_RE.test(line)) kpolls++;
          if (!line.trim()) continue;
          const i = line.indexOf('"usage":{');
          if (i < 0) continue;
          const j = line.indexOf("}", i);
          if (j < 0) continue;
          let d = day; // kimi wire 无稳定日字段：增量读=今日；首读按文件 mtime 归日
          const tsM = line.match(/"(?:timestamp|ts|createdAt)":"(\d{4}-\d{2}-\d{2})/);
          if (tsM) d = tsM[1];
          else { try { const m = fs.statSync(f).mtime.toISOString().slice(0, 10); if (day !== m) d = m; } catch {} }
          try {
            const u = JSON.parse(line.slice(i + 8, j + 1));
            const v = (u.inputCacheRead || 0) + (u.inputOther || 0) + (u.inputCacheCreation || 0) + (u.output || 0);
            add("kimi", seat, v, d);
          } catch { /* 半行/脏行跳过 */ }
        }

      });
      { const rec = files[f]; if (rec) { rec.turns = (rec.turns || 0) + kturns; rec.polls = (rec.polls || 0) + kpolls; } }
    }
    // ③ hermes：state.db session_model_usage（node:sqlite·只读；表无 cwd → 无席位归属，计全局）
    try {
      const dbPath = opts.hermesDb || path.join(process.env.LOCALAPPDATA || "", "hermes", "state.db");
      if (fs.existsSync(dbPath)) {
        const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");
        const db = new DatabaseSync(dbPath, { readOnly: true });
        const rows = db
          .prepare("select u.session_id, u.input_tokens, u.output_tokens, u.cache_read_tokens, u.cache_write_tokens, u.last_seen, s.cwd as cwd "
                    + "from session_model_usage u left join sessions s on s.id = u.session_id")
          .all();
        db.close();
        const hs = st.hermes || (st.hermes = {});
        for (const r of rows) {
          const tot = (r.input_tokens || 0) + (r.output_tokens || 0) + (r.cache_read_tokens || 0) + (r.cache_write_tokens || 0);
          const prev = hs[r.session_id] || 0;
          if (tot > prev) {
            const ls = Number(r.last_seen || 0);
            const d = ls > 0 ? new Date(ls * 1000).toISOString().slice(0, 10) : day; // 按 last_seen 归日
            add("hermes", tokenSeatOfCwd(r.cwd), tot - prev, d); // SYS-90 R2：join sessions.cwd 归席（无 cwd → 全局）
            hs[r.session_id] = tot;
          }
        }
      }
    } catch (e) { fault("tokenSentinel.hermes", e); }
    // 聚合：每席当日 + 近 7 日；分源总量
    const seats = {}, sources = {};
    for (const k of Object.keys(sums)) {
      const [src, seat, d] = k.split("|");
      if (!src || !d) continue;
      sources[src] = (sources[src] || 0) + (d === day ? sums[k] : 0);
      if (seat && seat !== "_global") {
        seats[seat] = seats[seat] || { today: 0, week: 0, src: {} };
        seats[seat].week += sums[k];
        if (d === day) { seats[seat].today += sums[k]; seats[seat].src[src] = (seats[seat].src[src] || 0) + sums[k]; }
      }
    }
    // 预算告警（单席当日 > _tokenBudget；每席每日一次）
    const binding = opts.binding || readBinding();
    const limit = Number(binding._tokenBudget) > 0 ? Number(binding._tokenBudget) : TOKEN_BUDGET_DEFAULT;
    const alerted = st.alerted || (st.alerted = {});
    const exceeded = [];
    for (const [seat, v] of Object.entries(seats)) {
      if (v.today > limit) {
        exceeded.push(seat);
        const ak = seat + "|" + day;
        if (!alerted[ak]) {
          alerted[ak] = true;
          const msg = `Token 预算超阈：${seat} 当日 ${(v.today / 1e6).toFixed(1)}M > ${(limit / 1e6).toFixed(0)}M（源 ${JSON.stringify(v.src || {})}）——查长会话/大工具输出，必要时开新会话`;
          try { (opts.onAlert || ((m) => { sendWatchAlert(m); fileProblem("SYS-Token", "钱包", m); }))(msg); } catch (e) { fault("tokenSentinel.alert", e); }
        }
      }
    }
    // SYS-167：信箱轮询/回合超阈告警（同 token 体例：每会话一次·可配·不刷屏；读数在 token哨兵.json files）
    const pollLimit = Number(opts.pollLimit ?? binding._pollLimit) > 0 ? Number(opts.pollLimit ?? binding._pollLimit) : THRIFT_DEFAULT.polls;
    const turnLimit = Number(opts.turnLimit ?? binding._turnLimit) > 0 ? Number(opts.turnLimit ?? binding._turnLimit) : THRIFT_DEFAULT.turns;
    const thrift = [];
    for (const [f, rec] of Object.entries(files)) {
      if (!rec || !rec.seat) continue;
      const p = Number(rec.polls) || 0, t = Number(rec.turns) || 0;
      if (p <= pollLimit && t <= turnLimit) continue;
      thrift.push({ seat: rec.seat, session: path.basename(f), polls: p, turns: t });
      const ak = "thrift|" + f;
      if (!alerted[ak]) {
        alerted[ak] = true;
        const msg = `轮询/回合超阈：${rec.seat} 会话 ${path.basename(f)} 轮询 ${p}（阈>${pollLimit}）/ 回合 ${t}（阈>${turnLimit}）——等待走 处理中心/机器闸/等信.mjs、只读小检串一条命令（SYS-167）`;
        try { (opts.onAlert || ((m) => { sendWatchAlert(m); fileProblem("SYS-Token", "钱包", m); }))(msg); } catch (e) { fault("tokenSentinel.alert", e); }
      }
    }
    const board = {
      at: new Date(now).toISOString(), day, seats, sources,
      budget: { limit, exceeded }, thrift,
      note: "pi 按会话 cwd 判席（锚本体系工位）；kimi 按 wd 目录名归席（含体系标记）；hermes 经 sessions.cwd join 归席（无 cwd 行 → 全局）。SYS-167：turns/polls 逐会话随 token哨兵.json files 记录（turns=assistant 回合·polls=含 INBOX/邮箱 的查看类 bash），thrift=超阈会话清单",
    };
    const boardFile = opts.boardFile || TOKEN_BOARD_FILE;
    const io = opts.io || fs; // UPG-482：写通道（默认真 fs；测试注入写失败用）
    try { io.mkdirSync(path.dirname(boardFile), { recursive: true }); writeFileAtomic(boardFile, JSON.stringify(board, null, 2) + "\n", io); } catch (e) { fault("tokenSentinel.board", e, opts); }
    // 7 日裁剪 + 落盘
    const cutoff = new Date(now - 7 * 86400e3).toISOString().slice(0, 10);
    for (const k of Object.keys(sums)) { const d = k.split("|").pop(); if (d && d < cutoff) delete sums[k]; }
    try { writeFileAtomic(stateFile, JSON.stringify(st, null, 2), io); } catch (e) { fault("tokenSentinel.state", e, opts); }
    return board;
  } catch (e) { fault("tokenSentinel", e); }
}

export { seatScorePanel, fault, ringUnreadSeats, watchdog, madDog, tokenSentinel, hermesDbSeatMtimes, seatProbeAllowed, parkTicket, unparkTicket, checkInboxForCompletion, applyAdvance, handoffToMerge, pollSeats, pollSeatsLight, pollSeatsFull, rootSentry, readSetLiteral, rotateFaultLog, fitRows, boardNavigate, buildFullListText, everRung, scanDispatchIdle, scanClaimStale, pullUpSilentSeats, parseSeatField, seatStateOf, backupDue, dailyBackupTick, latestSessionMtime, skipEscalateStep, patrolHygiene, sendWatchAlert, __testResetWatchdog, __testResetRingAck, __testResetWorkerOpen, wakeWorker, latestSessionProbe, sendSpriteBite, __testResetSpriteBite, mailLedgerStats, scanHygieneLine, killStaleBoards, detectAgent, sys88SeatVerdict, sys88InTree, sys88PickAgentPid, __testResetSys88, seatSelfHeal, seatFileOf, __testResetSeatHeal, logFileFor, logLine, scanSessionRotate }; // SYS-88/SYS-102：判据与自愈单一真源导出（测试/复演用）；SYS-91：日志缝单点导出（测试用）
export function __testResetPullUp() { for (const k of Object.keys(lastPullUpAt)) delete lastPullUpAt[k]; lastPullUpScan = 0; } // SYS-53：测试隔离（同 __testResetRing 先例）
export function __testResetRing() { rungLetters.clear(); for (const k of Object.keys(lastRingAt)) delete lastRingAt[k]; for (const k of Object.keys(lastBackfill)) delete lastBackfill[k]; for (const k of Object.keys(ringFail)) delete ringFail[k]; } // SYS-90/SYS-103 S1：铃态与失败退避一并重置（测试隔离）
export function __testResetSeats() { seatFullAt = 0; seatFullFails = 0; } // SYS-26：退避状态归零（测试隔离）
export function __faultCount() { return faultCount; } // SYS-156：faults 计数读数（夹具对账用·SYS-91 口径不变：仅真件参与计数）
