// SYS-45 C 层：headless 值守池（历史：pi --mode rpc 唤醒通道）。
// SYS-61（2026-09-12 用户令「不接受隐性工位」）：**RPC spawn 通道退役**——唤醒只走可见窗（engine wakeWorker 三态：窗活→铃2；窗死→开窗+换绑；开不出→不 spawn·告警）。
//   本模块保留（测试/迁移用）：start()/wake() 默认禁用；显式 opts.rpcEnabled=true 才启用（防回潮开关）。
// 职责：spawn headless pi 工位（JSON stdin {"type":"prompt"} / 事件流 stdout JSONL）→ wake(收信) → 生命周期可观测（spawn/prompt/agent_start/agent_settled/exit）
// 红线：① 纯增量——不改可见窗工位与铃2 行为（本文件零 铃2/powershell/execSync 引用）② 不绕 claim 锁（锁在邮局侧，本池只发唤醒）③ 忙位（流式中）跳过，信不标记、下轮重评
import { spawn } from "node:child_process";
import fs from "node:fs";
import { StringDecoder } from "node:string_decoder";

/** A 层：派单路由字段（frontmatter `seat:` 或正文 `工位[:：]` 行）——定向投递。 */
export const SEAT_FIELD_RE = /^(?:工位|seat)[:：]\s*(\S+)\s*$/m;
export const parseSeatField = (text) => (String(text).match(SEAT_FIELD_RE) || [])[1] || null;

/** 创建工位池。opts：spawnFn/piCmd/piArgs/stateFile/now/onLog/cwdFor（测试全程可注入）。 */
export function createPool(opts = {}) {
  const spawnFn = opts.spawnFn || spawn;
  const piCmd = opts.piCmd || "pi";
  const piArgs = opts.piArgs || ["--mode", "rpc", "--no-session"];
  const now = opts.now || (() => Date.now());
  const onLog = opts.onLog || (() => {});
  const stateFile = opts.stateFile || null;
  const rpcEnabled = opts.rpcEnabled === true; // SYS-61：RPC 默认退役（仅测试/迁移显式开启）
  const isWin = process.platform === "win32";
  const workers = new Map(); // name → { name, proc, alive, busy, pid, since, buf }
  const events = []; // 生命周期环（spawn/prompt/agent_start/agent_settled/exit）——可观测证据
  const snap = () => [...workers.values()].map((w) => ({ name: w.name, alive: w.alive, busy: w.busy, pid: w.pid, since: w.since }));
  function persist() { if (!stateFile) return; try { fs.writeFileSync(stateFile, JSON.stringify({ at: new Date(now()).toISOString(), workers: snap(), events: events.slice(-20) }, null, 2)); } catch {} }
  function log(name, ev, extra = {}) { const e = { at: new Date(now()).toISOString(), name, ev, ...extra }; events.push(e); if (events.length > 200) events.shift(); onLog(e); persist(); }
  function worker(name) { let w = workers.get(name); if (!w) { w = { name, proc: null, alive: false, busy: false, pid: 0, since: 0, buf: "" }; workers.set(name, w); } return w; }
  function start(w) {
    if (!rpcEnabled) { log(w.name, "rpc-retired", {}); return w; } // SYS-61：RPC spawn 退役（默认关）
    if (w.alive) return w;
    let proc;
    try { proc = spawnFn(piCmd, piArgs, { cwd: opts.cwdFor ? opts.cwdFor(w) : undefined, stdio: ["pipe", "pipe", "pipe"], shell: isWin }); }
    catch (e) { log(w.name, "spawn-failed", { error: String(e && e.message || e) }); return w; }
    w.proc = proc; w.alive = true; w.busy = false; w.pid = proc.pid || 0; w.since = now(); w.buf = "";
    log(w.name, "spawn", { pid: w.pid });
    const dec = new StringDecoder("utf8");
    proc.stdout.on("data", (c) => {
      w.buf += dec.write(c);
      let i;
      while ((i = w.buf.indexOf("\n")) >= 0) {
        let line = w.buf.slice(0, i); w.buf = w.buf.slice(i + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === "agent_start") { w.busy = true; log(w.name, "agent_start"); }
        else if (ev.type === "agent_settled") { w.busy = false; log(w.name, "agent_settled"); }
        else if (ev.type === "agent_end") log(w.name, "agent_end", { willRetry: !!ev.willRetry });
        else if (ev.type === "response") log(w.name, "response", { command: ev.command, success: !!ev.success });
      }
    });
    proc.stderr.on("data", () => {});
    proc.on("exit", (code) => { w.alive = false; w.busy = false; w.proc = null; log(w.name, "exit", { code }); });
    return w;
  }
  /** 唤醒：未起→spawn 后立即喂活（stdin 管道缓冲，RPC 初始化后读取）；流式中→busy 跳过（不标记、下轮重评）。 */
  function wake(name, text) {
    if (!rpcEnabled) return { ok: false, how: "rpc-retired" }; // SYS-61：RPC 退役（默认关·唤醒走可见窗 wakeWorker）
    const w = worker(name);
    if (!w.alive) start(w);
    if (!w.alive || !w.proc) return { ok: false, how: "spawn-failed" };
    if (w.busy) return { ok: false, how: "rpc", reason: "busy" };
    try { w.proc.stdin.write(JSON.stringify({ type: "prompt", message: text }) + "\n"); log(w.name, "prompt", { text: String(text).slice(0, 40) }); return { ok: true, how: "rpc" }; }
    catch (e) { return { ok: false, how: "rpc", reason: String(e && e.message || e) }; }
  }
  return {
    wake,
    ensure: (name) => { const w = worker(name); if (!w.alive) start(w); return w.alive; },
    alive: (name) => !!(workers.get(name) || {}).alive,
    busy: (name) => !!(workers.get(name) || {}).busy,
    state: () => ({ workers: snap(), events: events.slice(-50) }),
    stopAll: () => { for (const w of workers.values()) if (w.proc) { try { w.proc.kill("SIGTERM"); } catch {} } },
  };
}
