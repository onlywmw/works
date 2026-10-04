#!/usr/bin/env node
// 值守工 · 并行工位自动找单 watcher（2026-09-11 用户拍板「自动找单做不到吗」·SYS-45 的最小独立先行版）
//
// 干什么：每 intervalSec 扫一次「角色信箱」里可领的单（派单信·未被 claim·未被上级阻塞），
//   一旦有货 → 自动用 铃2 注入唤醒目标工位（保冷却·防扰）。二号从此不再靠人喊。
// 配置：同目录 值守工.json（workers 数组；blockedUntilMerged=串行纪律：前序单 phase=merged 才放行）
// 日志：同目录 值守工.log（每次唤醒/跳过都留痕）
// 退场：SYS-45（引擎级值守·pi RPC 通道）落地后本件可退役——它是过渡先行版。
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..");
const CFG_FILE = path.join(HERE, "值守工.json");
const LOG_FILE = path.join(HERE, "值守工.log");
const BELL = path.join(SYS, "处理中心", "看板", "铃2.ps1");
const CLAIMS = path.join(SYS, "处理中心", "邮局", ".claims");

const log = (s) => fs.appendFileSync(LOG_FILE, `[${new Date().toLocaleString("sv-SE")}] ${s}\n`, "utf-8");
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
// 跨轮状态（配置每轮重读→状态必须模块级，否则冷却/去重失效——自审抓出）
const state = {}; // name -> { lastWakeAt, deadLogged }

function claimedKeys() { // 已占位单（claim 锁）
  const set = new Set();
  try { for (const f of fs.readdirSync(CLAIMS)) set.add(f.replace(/\.json$/, "")); } catch {}
  return set;
}
function phaseOf(id) { // 工单库相位（预读一次每轮）
  return (ledgerText) => {
    const m = ledgerText.match(new RegExp("^# " + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b[\\s\\S]{0,4000}?^phase:[ \\t]*(\\S+)", "m"));
    return m ? m[1] : null;
  };
}

function scanOnce() {
  const cfg = readJson(CFG_FILE) || { workers: [], reviewWatch: [] };
  if (!(cfg.workers || []).length && !(cfg.reviewWatch || []).length) return;
  const ledgerText = fs.readFileSync(path.join(SYS, "处理中心", "工单库.md"), "utf-8");
  const claimed = claimedKeys();
  for (const w of cfg.workers) {
    if (!w.enabled) continue;
    // 工位存活检查（PID 死=不唤·留痕）
    const st = (state[w.name] = state[w.name] || { lastWakeAt: 0, deadLogged: false });
    let alive = true;
    try { process.kill(w.consolePid, 0); } catch { alive = false; }
    if (!alive) { if (!st.deadLogged) { log(`${w.name}：窗(pid=${w.consolePid})不在——跳过（不改配置前不再提醒）`); st.deadLogged = true; } continue; }
    st.deadLogged = false;
    // 扫信箱里的派单信
    const inbox = path.join(SYS, "处理中心", "邮局", "邮箱", w.mailbox, "INBOX");
    let files = []; try { files = fs.readdirSync(inbox).filter((f) => f.endsWith(".md")); } catch {}
    const lastWake = st.lastWakeAt;
    if (Date.now() - lastWake < (w.cooldownMin || 10) * 60e3) continue; // 冷却
    for (const f of files) {
      const text = fs.readFileSync(path.join(inbox, f), "utf-8");
      const type = (text.match(/^type:\s*(.*)$/m) || [])[1] || "";
      const re = (text.match(/^re:\s*(.*)$/m) || [])[1] || "";
      if (!(type.trim() === "派单" || (type.trim() === "通知" && re.includes("派单")))) continue; // 派单信：type=派单（主·2026-09-11 设计师诊断修正）或 通知+re含派单（兼容）
      const idm = re.match(/((?:UPG|SYS|W|S)-[A-Za-z0-9]+)/);
      if (!idm) continue;
      const id = idm[1];
      if (claimed.has(id) || claimed.has(f.replace(/\.md$/, ""))) continue; // 已被领
      const blocker = (w.blockedUntilMerged || {})[id];
      if (blocker) {
        const bp = phaseOf(blocker)(ledgerText);
        if (bp !== "merged") { continue; } // 串行纪律：前序未合 main → 不放行
      }
      // 有货 → 注入唤醒
      const msg = `新单可领：${id}（派单信 ${f.replace(/\.md$/, "")}）。先跑 claim.mjs 领单再动工。`;
      try {
        execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", BELL, "-ConsolePid", String(w.consolePid), "-Text", msg], { windowsHide: true, timeout: 30000 });
        st.lastWakeAt = Date.now();
        log(`唤醒 ${w.name} → ${id}（信 ${f.replace(/\.md$/, "")}）`);
      } catch (e) { log(`唤醒 ${w.name} 失败：${String(e.message).slice(0, 100)}`); }
      break; // 一轮只唤一单
    }
  }
  // ② 交付滞留守望（2026-09-11 事故：MICRO 交付→抽查/合并无触发——同厂派单站洞同族）——超时自动催目标席
  for (const w of cfg.reviewWatch || []) {
    if (!w.enabled) continue;
    const st = (state["review:" + w.name] = state["review:" + w.name] || { notified: {}, deadLogged: false });
    let alive = true;
    try { process.kill(w.consolePid, 0); } catch { alive = false; }
    if (!alive) { if (!st.deadLogged) { log(`评审守望：${w.name} 窗(pid=${w.consolePid})不在——跳过`); st.deadLogged = true; } continue; }
    st.deadLogged = false;
    const cards = ledgerText.split(/^# (?=[A-Z][A-Z0-9]*-)/m).slice(1);
    for (const card of cards) {
      const hm = card.match(/^([A-Z][A-Z0-9]*-[A-Za-z0-9]+)/);
      if (!hm) continue;
      const sb = card.match(/```status\r?\n([\s\S]*?)```/);
      if (!sb) continue;
      const env = {};
      for (const line of sb[1].split(/\r?\n/)) { const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/); if (kv) env[kv[1]] = kv[2]; }
      if ((env.phase || "").trim() !== "delivered") continue;
      const um = (env.updated_at || "").match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
      if (!um) continue;
      const ageMin = (Date.now() - Date.parse(um[1])) / 60000;
      if (ageMin < (w.staleMin || 30)) continue;
      if (st.notified[hm[1]] && Date.now() - st.notified[hm[1]] < 3600e3) continue; // 每单每小时最多催一次
      const msg = `${hm[1]} 交付滞留 ${Math.round(ageMin)} 分钟（delivered·待您抽查/安排收口）——请处置。`;
      try {
        execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", BELL, "-ConsolePid", String(w.consolePid), "-Text", msg], { windowsHide: true, timeout: 30000 });
        st.notified[hm[1]] = Date.now();
        log(`催办 ${w.name} → ${hm[1]}（delivered ${Math.round(ageMin)}m）`);
      } catch (e) { log(`催办 ${w.name} 失败：${String(e.message).slice(0, 100)}`); }
      break; // 一轮一单
    }
  }
}

log("值守工启动");
setInterval(scanOnce, (readJson(CFG_FILE)?.intervalSec || 60) * 1000);
scanOnce();
