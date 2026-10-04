#!/usr/bin/env node
// 席位.mjs —— 无人值守席位运行器（2026-09-28 立·用户令「要自动啊，不能每次我来 /new」）
//
// 机制：**每趟＝一个全新会话**（headless 一键式跑完即退）⇒ 天然实现「办结即 /new」；
//       UPG-467 相位②：**agent 走适配层**——席位绑定（seats/<seat>.json 的 agent）→ 注册表 default → 首个可用；
//       无 agent＝明说缺件（不静默）；TUI-only agent 走窗口驱动（铃2.ps1·见 agent扫描.mjs windowBell）。
//       空闲时只做文件系统检查（读邮箱目录），**不烧 token**；有信才起会话。
//
// 用法：
//   node 处理中心/机器闸/席位.mjs --seat 设计师 --cwd "<工位目录>" [--inbox <邮箱目录>]
//        [--prompt "收信"] [--grace 60] [--cooldown 10] [--once] [--dry]
// 说明：
//   --grace    空闲轮询间隔（秒·默认 60）
//   --cooldown 同一封信的最小重投间隔（分钟·默认 10·防「办不完就重开」空转）
//   --once     跑一趟就退出（自检用）    --dry 只打印将执行的命令·不真起会话
// 日志：处理中心/看板/席运行器_<seat>.log（每趟一行：时间/信 id/退出码/耗时）
import { spawnSync, execFileSync } from "node:child_process";
import { SYS } from "./lib/root.mjs"; // SYS-160：根解析单源
import { resolveAgent, buildHeadless, windowBell, REGISTRY_PATH } from "./agent扫描.mjs"; // UPG-467 相位②：agent 适配层
import fs from "node:fs";
import path from "node:path";

const opt = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SEAT = opt("--seat", "设计师");
const CWD = opt("--cwd", process.cwd());
const INBOX = opt("--inbox", path.join(SYS, "处理中心", "邮局", "邮箱", SEAT, "INBOX")); // SYS-160：根解析单源
const PROMPT = opt("--prompt", "收信");
const GRACE = Number(opt("--grace", "60"));
const COOLDOWN = Number(opt("--cooldown", "10"));
const ONCE = process.argv.includes("--once");
const DRY = process.argv.includes("--dry");
const LOG = path.join(SYS, "处理中心", "看板", `席运行器_${SEAT}.log`);
const promptFull = `${PROMPT}｜运行器约定：**只办最早一封**，办完即止；若这封信需要等外部条件（等交付/等审批/缺料）⇒ 按挂起制登记后**立即退出**（不要空转、不要连办第二封）；若信箱空则不做任何工具调用直接结束。`;

const log = (m) => {
  const line = `[${new Date().toISOString().replace("T", " ").slice(0, 16)}] ${m}`;
  console.log(line);
  try { fs.appendFileSync(LOG, line + "\n", "utf8"); } catch { /* 日志失败不影响主循环 */ }
};
const pending = () => { try { return fs.readdirSync(INBOX).filter(f => f.endsWith(".md")).sort(); } catch { return []; } };
const seen = new Map();   // 信 id → 上次启动时间(ms)

log(`席位运行器启动：seat=${SEAT} inbox=${INBOX} grace=${GRACE}s cooldown=${COOLDOWN}min cwd=${CWD}${DRY ? " ·DRY" : ""}`);
for (;;) {
  const q = pending();
  if (!q.length) {
    if (ONCE) { log("信箱空 ⇒ 退出（--once）"); break; }
    await new Promise(r => setTimeout(r, GRACE * 1000));
    continue;
  }
  const letter = q[0], id = letter.replace(/\.md$/, "");
  const last = seen.get(id) || 0;
  if (Date.now() - last < COOLDOWN * 60_000) {
    log(`跳过 ${id}（冷却中·${Math.ceil((COOLDOWN * 60_000 - (Date.now() - last)) / 60000)}min 后再试）`);
    await new Promise(r => setTimeout(r, GRACE * 1000));
    continue;
  }
  seen.set(id, Date.now());
  // UPG-467 相位②：agent 适配层选路（席位绑定 → default → 首个可用；无 agent＝明说缺件）
  const { agent, bound, source } = resolveAgent(SEAT);
  if (!agent) {
    log(`❌ 未发现可用 agent——明说缺件（席位 ${SEAT}）：请安装 pi／claude／opencode／hermes 任一；` +
        `扫描：node 处理中心/机器闸/agent扫描.mjs（注册表：${REGISTRY_PATH}）`);
    if (ONCE) break;
    await new Promise(r => setTimeout(r, GRACE * 1000));
    continue;
  }
  const run1 = buildHeadless(agent, promptFull);
  if (!run1) {
    log(`⚠ 席位 ${SEAT} 绑定 agent「${agent.name}」（driver=${agent.driver}）不支持 headless 一键式——TUI 兜底走窗口驱动：${windowBell().usage}`);
    if (ONCE) break;
    await new Promise(r => setTimeout(r, GRACE * 1000));
    continue;
  }
  log(`▶ 起会话处理 ${id}　agent=${agent.name}(v${agent.version})［${source}${bound ? "=" + bound : ""}］driver=${run1.driver}　命令：${run1.label.replace(/\s+/g, " ").slice(0, 120)}`);
  if (DRY) { log("（DRY·未真起会话）"); if (ONCE) break; await new Promise(r => setTimeout(r, GRACE * 1000)); continue; }
  const t0 = Date.now();
  const r = spawnSync(run1.cmd, run1.args, { windowsHide: true, cwd: CWD, stdio: "inherit" });
  log(`■ 会话结束 ${id}　退出码=${r.status}　耗时=${((Date.now() - t0) / 1000).toFixed(0)}s　（下一封会开新会话）`);
  if (ONCE) break;
}
