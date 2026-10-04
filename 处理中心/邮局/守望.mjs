#!/usr/bin/env node
// 守望 · 条件触发版（2026-09-11 用户拍板：「不是定时能力，是条件触发」）
//
// 用法：node 守望.mjs <工人名> [段长秒数·默认480]
// 机制：fs.watch 挂在 程序员 INBOX 目录 + 工单库.md 上——**新信落盘/账本变更那一刻自动评估**（零轮询·零延迟·空置期零 token）；
//   条件成立（存在未被 claim 的派单信 且 其串行前置已 merged）→ 打印「可领：<单号>（信 <file>）」退出 0 → 工人当场领单开干；
//   段长到 → 打印「段尾无单（重入守望）」退出 0 → 工人循环重入（保持长驻自主）。
// 串行阻塞表：读同目录 值守工.json 里对应工人的 blockedUntilMerged（单一真源）。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..");
const INBOX = path.join(SYS, "处理中心", "邮局", "邮箱", "程序员", "INBOX");
const LEDGER = path.join(SYS, "处理中心", "工单库.md");
const CLAIMS = path.join(SYS, "处理中心", "邮局", ".claims");

const WORKER = process.argv[2];
const SEG = Number(process.argv[3] || 480);
if (!WORKER) { console.error("用法：node 守望.mjs <工人名> [段长秒]"); process.exit(2); }

function blockers() {
  try { const cfg = JSON.parse(fs.readFileSync(path.join(HERE, "值守工.json"), "utf8")); const w = (cfg.workers || []).find((x) => x.name === WORKER); return (w && w.blockedUntilMerged) || {}; } catch { return {}; }
}
function claimedKeys() { const s = new Set(); try { for (const f of fs.readdirSync(CLAIMS)) s.add(f.replace(/\.json$/, "")); } catch {} return s; }
function phase(led, id) { const m = led.match(new RegExp("^# " + id + "\\b[\\s\\S]{0,4000}?^phase:[ \\t]*(\\S+)", "m")); return m ? m[1] : null; }

const LOGFILE = path.join(HERE, "守望.log");
const log = (s) => { try { fs.appendFileSync(LOGFILE, `[${new Date().toLocaleString("sv-SE")}] ${s}\n`, "utf-8"); } catch {} };

// 自动解挂（解除链级联 · 2026-09-11 设计师扩展）：挂起.json 中 until=phase:<单号>:<相位> 机读条件达成 → 自动执行 engine.mjs 解挂（复工信随投）。
// 设计：条件写在 挂起.json 的 until 字段（SYS-35 五类机读前缀之 phase 类，向前兼容引擎侧求值器）；本段=过渡自动化解（守望在场时生效·账本一变即发）。
function autoUnpark(led) {
  let parked = {}; try { parked = JSON.parse(fs.readFileSync(path.join(SYS, "处理中心", "看板", "挂起.json"), "utf8")); } catch { return; }
  let cfg = {}; try { cfg = JSON.parse(fs.readFileSync(path.join(HERE, "值守工.json"), "utf8")); } catch {}
  const blockerPred = (tid) => { for (const w of (cfg.workers || [])) { const p = (w.blockedUntilMerged || {})[tid]; if (p) return p; } return null; }; // 兜底真源：串行阻塞表
  for (const [tid, rec] of Object.entries(parked)) {
    const u = String(rec.until || "");
    if (u.startsWith("hold:")) continue; // 冻结单（配额等人工解冻）——永不自动释放
    let pred = null, want = null;
    const m = u.match(/^phase:([A-Za-z0-9-]+):(\S+)$/);
    if (m) { pred = m[1]; want = m[2]; }
    else { const bp = blockerPred(tid); if (bp) { pred = bp; want = "merged"; } } // until 被覆盖为自由文本时（2026-09-11 实测事故）→ 以 blockedUntilMerged 为准
    if (!pred || phase(led, pred) !== want) continue;
    if (process.env.UNPARK_DRY) { log(`[DRY] 应解挂 ${tid}（条件 phase:${pred}:${want} 达成）`); continue; }
    try {
      execFileSync("node", [path.join(SYS, "处理中心", "看板", "engine.mjs"), "解挂", tid], { windowsHide: true, timeout: 30000 });
      log(`自动解挂 ${tid}（条件 phase:${pred}:${want} 达成）`);
    } catch (e) { log(`自动解挂 ${tid} 失败：${String(e.message).slice(0, 120)}`); }
  }
}

function evaluate() {
  let led = ""; try { led = fs.readFileSync(LEDGER, "utf8"); } catch {}
  autoUnpark(led);
  const bl = blockers(), claimed = claimedKeys();
  let parkedIds = new Set(); try { parkedIds = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(SYS, "处理中心", "看板", "挂起.json"), "utf8")))); } catch {} // 挂起单不可领（含 hold: 冻结——配额令等人工解冻）
  let files = []; try { files = fs.readdirSync(INBOX).filter((f) => f.endsWith(".md")); } catch {}
  for (const f of files) {
    let t = ""; try { t = fs.readFileSync(path.join(INBOX, f), "utf8"); } catch { continue; }
    const type = (t.match(/^type:\s*(.*)$/m) || [])[1] || "";
    const re = (t.match(/^re:\s*(.*)$/m) || [])[1] || "";
    if (!(type.trim() === "派单" || (type.trim() === "通知" && re.includes("派单")))) continue; // 派单信：type=派单（主·2026-09-11 设计师诊断修正）或 通知+re含派单（兼容）
    const idm = re.match(/((?:UPG|SYS|W|S)-[A-Za-z0-9]+)/);
    if (!idm) continue;
    const id = idm[1];
    if (claimed.has(id)) continue; // 已被领
    if (parkedIds.has(id)) continue; // 挂起/冻结单不可领
    const pre = bl[id];
    if (pre && phase(led, pre) !== "merged") continue; // 串行纪律：前序未合不放行
    return { id, file: f };
  }
  return null;
}

const hit = evaluate();
if (hit) { console.log(`可领：${hit.id}（信 ${hit.file}）`); process.exit(0); }

let done = false;
const finish = (msg) => { if (done) return; done = true; console.log(msg); process.exit(0); };
try { fs.watch(INBOX, () => { const h = evaluate(); if (h) finish(`可领：${h.id}（信 ${h.file}）`); }); } catch {}
try { fs.watch(LEDGER, () => { const h = evaluate(); if (h) finish(`可领：${h.id}（信 ${h.file}）`); }); } catch {}
setTimeout(() => finish("段尾无单（重入守望）"), SEG * 1000);
