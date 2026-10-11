#!/usr/bin/env node
// POL-4 打磨环沙盒 · 本地 a2a 实例（pin mov-web commit·独立 DB·独立端口·MOCK 档）
//
// 用法（cwd 任意）：
//   node 处理中心/机器闸/task-polish/sandbox/sandbox.mjs provision   # 按 pin 导出 server 代码 + 铺 env 模板（幂等）
//   node ... start                                                  # 起 a2a（uvicorn·后台）+ 等 /healthz
//   node ... stop                                                   # 停（pid 文件）
//   node ... reset                                                  # 停 → 清数据面（DB/上传）→ 起（= 轮次归零）
//   node ... status                                                 # pid/健康/库大小/pin 核对
// 纪律：只动本地沙盒（root 下）——生产 a2a/DB/域名零触碰；env 真值只在 envFile（仓外·不入仓不入日志）。
import fs from "node:fs";
import path from "node:path";
import { spawnSync, spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(HERE, "sandbox.config.json"), "utf8"));
const ROOT = CFG.root.replace(/\\/g, "/");
const SERVER = path.join(ROOT, "server");
const DATA = path.join(ROOT, "data");
const LOGS = path.join(ROOT, "logs");
const PID = path.join(ROOT, "run", "a2a.pid");
const PINFILE = path.join(SERVER, ".pin");
const cmd = process.argv[2];

const log = (s) => console.log(s);
const git = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, windowsHide: true }).trim();

function readEnv() {
  const env = { ...process.env };
  if (fs.existsSync(CFG.envFile)) {
    for (const line of fs.readFileSync(CFG.envFile, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  }
  return env;
}

function pidAlive() {
  if (!fs.existsSync(PID)) return 0;
  const pid = parseInt(fs.readFileSync(PID, "utf8").trim(), 10) || 0;
  if (!pid) return 0;
  try { process.kill(pid, 0); return pid; } catch { fs.rmSync(PID, { force: true }); return 0; }
}

async function health(port, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/healthz`); if (r.ok) return true; } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

/** PARTNER 沙盒档：stub 端口/文件（partner-stub.mjs = 沙盒的 partner 后端＋审核态注入口） */
const STUB_PORT = CFG.partnerStubPort || 8392;
const STUB_STATE = path.join(DATA, "audit-state.json");
const STUB_LOG = path.join(LOGS, "stub-log.jsonl");
const STUB_JS = path.join(HERE, "..", "partner-stub.mjs");
const STUB_PID = path.join(ROOT, "run", "stub.pid");

function stubAlive() {
  if (!fs.existsSync(STUB_PID)) return 0;
  const pid = parseInt(fs.readFileSync(STUB_PID, "utf8").trim(), 10) || 0;
  if (!pid) return 0;
  try { process.kill(pid, 0); return pid; } catch { fs.rmSync(STUB_PID, { force: true }); return 0; }
}

function startStub() {
  if (stubAlive()) return;
  if (!fs.existsSync(STUB_STATE)) fs.writeFileSync(STUB_STATE, JSON.stringify({ state: "REJECTED", reason: "沙盒默认驳回态" }, null, 1));
  const out = fs.openSync(path.join(LOGS, "stub.log"), "a");
  const child = spawn(process.execPath, [STUB_JS, "--port", String(STUB_PORT), "--state", STUB_STATE, "--log", STUB_LOG, "--target", `http://127.0.0.1:${CFG.a2aPort}`], { detached: true, stdio: ["ignore", out, out], windowsHide: true });
  child.unref();
  fs.writeFileSync(STUB_PID, String(child.pid));
  log(`▶ stub：pid ${child.pid}·port ${STUB_PORT}（合作后端＋审核态注入）`);
}

function stopStub() {
  const pid = stubAlive();
  if (!pid) return;
  try { execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); } catch (_) { try { process.kill(pid); } catch (_) {} }
  fs.rmSync(STUB_PID, { force: true });
  log(`⏹ stub：pid ${pid} 已停`);
}

function provision() {
  if (pidAlive() || stubAlive()) { console.error("✗ provision：实例在跑——先 stop（Windows 下运行中句柄会阻重铺）"); process.exit(1); }
  fs.mkdirSync(path.join(ROOT, "run"), { recursive: true });
  fs.mkdirSync(DATA, { recursive: true });
  fs.mkdirSync(LOGS, { recursive: true });
  const have = fs.existsSync(PINFILE) ? fs.readFileSync(PINFILE, "utf8").trim() : "";
  if (have === CFG.serverPin && fs.existsSync(path.join(SERVER, "server.py"))) {
    log(`✅ provision：pin ${CFG.serverPin} 已在位（skip）`);
  } else {
    fs.rmSync(SERVER, { recursive: true, force: true });
    fs.mkdirSync(SERVER, { recursive: true });
    // 只读导出：git archive <pin> → 解包（不建 worktree·不写 mov-web 仓）
    const tar = spawnSync("git", ["archive", "--format=tar", CFG.serverPin], { cwd: CFG.serverSrcRepo, maxBuffer: 1 << 28, windowsHide: true });
    if (tar.status !== 0) { console.error("✗ git archive 失败：", String(tar.stderr).slice(0, 300)); process.exit(1); }
    const untar = spawnSync("tar", ["-x", "-C", SERVER], { input: tar.stdout, maxBuffer: 1 << 28, windowsHide: true });
    if (untar.status !== 0) { console.error("✗ tar 解包失败"); process.exit(1); }
    fs.writeFileSync(PINFILE, CFG.serverPin);
    log(`✅ provision：已导出 ${CFG.serverSrcRepo}@${CFG.serverPin} → ${SERVER}`);
  }
  if (!fs.existsSync(CFG.envFile)) {
    const secret = () => spawnSync("python", ["-c", "import secrets;print(secrets.token_hex(32))"], { encoding: "utf8", windowsHide: true }).stdout.trim();
    const body = [
      "# POL-4 沙盒 a2a env（仓外·真值不入仓）——键名口径见 mov-web deploy/env/a2a.env.example",
      `A2A_DB_PATH=${path.join(DATA, "a2a.db").replace(/\\/g, "/")}`,
      `ADMIN_TOKEN=${secret()}`,
      `HANDOFF_CODE_PEPPER=${secret()}`,
      `ACCOUNT_PEPPER=${secret()}`,
      "SMS_MOCK=1",
      "PAY_MOCK=1",
      "REALNAME_PROVIDER=manual",
      "# LLM 上游（沙盒跑批需真 LLM：由操作者填 · 或指桩上游做离线）",
      "# LLM_UPSTREAM_BASE_URL=https://api.deepseek.com/v1",
      "# LLM_UPSTREAM_KEY=<...>",
      "# LLM_TPM=200000",
      "",
    ].join("\n");
    fs.writeFileSync(CFG.envFile, body);
    log(`✅ provision：已铺 env 模板 → ${CFG.envFile}（含随机盐；LLM 上游键由操作者填）`);
  } else {
    log(`✅ provision：env 在位 ${CFG.envFile}（skip）`);
  }
  // PARTNER 沙盒档：缺键回填（幂等）——a2a 的 partner 调用指向本地 stub（夹具隔离·不达生产）
  {
    const keys = { PARTNER_BASE_URL: `http://127.0.0.1:${STUB_PORT}`, PARTNER_INTERNAL_TOKEN: "sandbox-local" };
    let text = fs.readFileSync(CFG.envFile, "utf8");
    const add = Object.entries(keys).filter(([k]) => !new RegExp(`^${k}=`, "m").test(text));
    if (add.length) {
      text = text.trimEnd() + "\n" + add.map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
      fs.writeFileSync(CFG.envFile, text);
      log(`✅ provision：env 回填 partner 沙盒键 ${add.map(([k]) => k).join(", ")}`);
    }
  }
}

function start() {
  const pid = pidAlive();
  if (pid) { log(`✅ start：已在跑（pid ${pid}）`); return; }
  if (!fs.existsSync(PINFILE)) { console.error("✗ 未 provision（先跑 provision）"); process.exit(1); }
  const env = readEnv();
  env.A2A_DB_PATH = env.A2A_DB_PATH || path.join(DATA, "a2a.db");
  const out = fs.openSync(path.join(LOGS, "a2a.log"), "a");
  const child = spawn(env.PYTHON || "python", ["-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", String(CFG.a2aPort), "--log-level", "info"], {
    cwd: path.join(SERVER, "server", "a2a"), env, detached: true, stdio: ["ignore", out, out], windowsHide: true,
  });
  child.unref();
  fs.writeFileSync(PID, String(child.pid));
  log(`▶ start：pid ${child.pid}·port ${CFG.a2aPort}·log ${path.join(LOGS, "a2a.log")}`);
  startStub();
}

function stop() {
  const pid = pidAlive();
  stopStub();
  if (!pid) { log("✅ stop：未在跑"); return; }
  try { execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); } catch (_) { try { process.kill(pid); } catch (_) {} }
  fs.rmSync(PID, { force: true });
  log(`⏹ stop：pid ${pid} 已停`);
}

function status() {
  const pid = pidAlive();
  const spid = stubAlive();
  const pin = fs.existsSync(PINFILE) ? fs.readFileSync(PINFILE, "utf8").trim() : "(未 provision)";
  const db = path.join(DATA, "a2a.db");
  const dbSize = fs.existsSync(db) ? fs.statSync(db).size : 0;
  log(`沙盒状态 @${new Date().toLocaleString("sv-SE")}`);
  log(`  root=${ROOT}`);
  log(`  pin=${pin}${pin === CFG.serverPin ? " ✅" : " ⚠ 与 config(" + CFG.serverPin + ")不一致"}`);
  log(`  a2a pid=${pid || "—"}·port=${CFG.a2aPort}·db=${dbSize} bytes`);
  log(`  stub pid=${spid || "—"}·port=${STUB_PORT}·state=${fs.existsSync(STUB_STATE) ? fs.readFileSync(STUB_STATE, "utf8").replace(/\s+/g, " ").slice(0, 80) : "—"}`);
  log(`  env=${CFG.envFile}${fs.existsSync(CFG.envFile) ? " ✅" : " ✗ 缺"}`);
  log(`  log=${path.join(LOGS, "a2a.log")}`);
}

(async () => {
  if (cmd === "provision") return provision();
  if (cmd === "start") { start(); const ok = await health(CFG.a2aPort); log(ok ? "✅ /healthz OK" : "⚠ /healthz 未就绪（看日志）"); return; }
  if (cmd === "stop") return stop();
  if (cmd === "reset") { stop(); fs.rmSync(DATA, { recursive: true, force: true }); fs.mkdirSync(DATA, { recursive: true }); log("🧹 reset：数据面已清（DB/上传）"); start(); const ok = await health(CFG.a2aPort); log(ok ? "✅ /healthz OK" : "⚠ /healthz 未就绪（看日志）"); return; }
  if (cmd === "status") return status();
  console.log("用法：node sandbox.mjs provision|start|stop|reset|status");
  process.exit(2);
})();
