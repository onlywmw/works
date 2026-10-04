#!/usr/bin/env node
/**
 * agent扫描.mjs —— UPG-467 相位②：本机 agent 自动发现与适配层（扫描＋注册表＋驱动选路）
 *
 * 用法：
 *   node 处理中心/机器闸/agent扫描.mjs [--json] [--out <注册表路径>] [--no-write]
 *   代码复用：import { loadRegistry, resolveAgent, buildHeadless, buildRpc, windowBell } from "./agent扫描.mjs"
 *
 * 产出：处理中心/看板/agent注册表.json
 *   { scanned_at, supported:[…], agents:[{name,path,version,driver,flags:{headless,rpc},status}], default }
 *
 * 驱动三法（按声明选路）：
 *   headless＝每趟一进程（零窗口·默认）｜rpc＝双向实时（JSONL·进程整合）｜window＝TUI 兜底（看板/铃2.ps1＋consolePid 注入）
 * 绑定：席位默认绑 default（首个可用·优先 pi）；每席位可改绑（处理中心/看板/seats/<seat>.json 的 agent 字段）
 * 无 agent＝明说缺件（rc=1·给获取指引·不静默）。
 * 红线：只读探测（--version/--help 级）＋只写注册表；不启动会话、不联网、不装任何东西。
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { spawnSync } from "node:child_process";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
export const SYS = path.resolve(HERE, "..", ".."); // 体系根（就地单/发行版同构）
export const REGISTRY_PATH = path.join(SYS, "处理中心", "看板", "agent注册表.json");
export const SEATS_DIR = path.join(SYS, "处理中心", "看板", "seats");
export const WINDOW_BELL = path.join(SYS, "处理中心", "看板", "铃2.ps1");

/* 受支持清单（locate 名 → 指纹/能力旗标；flags 模板里 {prompt} 为一次性提示占位）
 * probe：{ headless?:{args,needle}, rpc?:{args,needle} }——各自独立探针命令（有的工具区分头/尾 help）。 */
const SUPPORTED = [
  { name: "pi",        cmds: ["pi"],        versionArgs: ["--version"], headless: ["-p", "{prompt}"], rpc: ["--mode", "rpc"], probe: { headless: { args: ["--help"], needle: "-p" }, rpc: { args: ["--help"], needle: "--mode" } } },
  { name: "claude",    cmds: ["claude"],    versionArgs: ["--version"], headless: ["-p", "{prompt}"], rpc: null, probe: { headless: { args: ["--help"], needle: "-p" } } },
  { name: "opencode",  cmds: ["opencode"],  versionArgs: ["--version"], headless: ["run", "{prompt}"], rpc: ["serve"], probe: { headless: { args: ["--help"], needle: "run" }, rpc: { args: ["--help"], needle: "serve" } } },
  { name: "hermes",    cmds: ["hermes"],    versionArgs: ["--version"], headless: ["chat", "-q", "{prompt}", "--oneshot"], rpc: ["serve"], probe: { headless: { args: ["chat", "--help"], needle: "--oneshot" }, rpc: { args: ["--help"], needle: "serve" } } },
  { name: "codex",     cmds: ["codex"],     versionArgs: ["--version"], headless: ["exec", "{prompt}"], rpc: null, probe: { headless: { args: ["--help"], needle: "exec" } } },
  { name: "gemini",    cmds: ["gemini"],    versionArgs: ["--version"], headless: ["-p", "{prompt}"], rpc: null, probe: { headless: { args: ["--help"], needle: "-p" } } },
  { name: "aider",     cmds: ["aider"],     versionArgs: ["--version"], headless: ["--message", "{prompt}", "--yes"], rpc: null, probe: { headless: { args: ["--help"], needle: "--message" } } },
];

/** 已知安装位（PATH 之外）：npm 全局 / bun / 常见 venv —— 只读探测。 */
function knownLocations(name) {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const appdata = process.env.APPDATA || path.join(home, "AppData", "Roaming");
  const localappdata = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
  const exts = process.platform === "win32" ? [".cmd", ".exe", ".bat", ""] : [""];
  const bases = [
    path.join(appdata, "npm"),
    path.join(home, ".bun", "bin"),
    path.join(localappdata, "Programs"),
    path.join(home, ".local", "bin"),
    path.join(home, ".cargo", "bin"),
  ];
  const out = [];
  for (const b of bases) for (const e of exts) out.push(path.join(b, name + e));
  return out;
}

/** which/where（跨平台）＋已知位兜底 → 首个存在且可执行的路径（优先 .exe/.cmd，防选到无扩展名 shell 脚本）。 */
function locate(name) {
  const cmd = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(cmd, [name], { encoding: "utf8", timeout: 5000, windowsHide: true });
  const hits = (r.status === 0 && r.stdout ? r.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [])
    .filter(p => fs.existsSync(p));
  const rank = (p) => { const e = path.extname(p).toLowerCase(); return e === ".exe" ? 0 : e === ".cmd" || e === ".bat" ? 1 : 2; };
  if (hits.length) return hits.sort((a, b) => rank(a) - rank(b))[0];
  for (const p of knownLocations(name)) if (fs.existsSync(p)) return p;
  return null;
}

/** 探测命令执行：**不用 shell**（空'格'路径不被拆词）——.cmd/.bat 显式走 cmd.exe /c。 */
function run(exe, args, timeout = 8000) {
  try {
    const ext = path.extname(exe).toLowerCase();
    const r = (ext === ".cmd" || ext === ".bat")
      ? spawnSync("cmd.exe", ["/c", exe, ...args], { encoding: "utf8", timeout, windowsHide: true })
      : spawnSync(exe, args, { encoding: "utf8", timeout, windowsHide: true });
    return { out: (r.stdout || "") + (r.stderr || ""), status: r.status };
  } catch { return { out: "", status: -1 }; }
}

/** 单个 agent 探测：指纹（--version·取首个版本号形）＋能力（各法独立 help 探针）。 */
function probeAgent(spec) {
  const exe = locate(spec.cmds[0]);
  if (!exe) return null;
  const v = run(exe, spec.versionArgs);
  const vm = v.out.match(/\d+\.[\d.]+/);
  const version = vm ? vm[0] : "unknown";
  const flags = {};
  for (const kind of ["headless", "rpc"]) {
    const pr = spec.probe[kind];
    if (!pr || !spec[kind]) continue;
    const h = run(exe, pr.args);
    if (h.out.includes(pr.needle)) flags[kind] = spec[kind];
  }
  const driver = flags.headless ? "headless" : "window"; // headless 默认；TUI-only ⇒ window（铃2.ps1 注入）
  return { name: spec.name, path: exe, version, driver, flags, status: "ok" };
}

/** 全量扫描（只读探测）→ 注册表对象。 */
export function scan() {
  const agents = SUPPORTED.map(probeAgent).filter(Boolean);
  const ok = agents.filter(a => a.status === "ok");
  const pref = ["pi", "claude", "opencode", "hermes"];
  const byPref = [...ok].sort((a, b) => (pref.indexOf(a.name) + 99) % 99 - (pref.indexOf(b.name) + 99) % 99);
  return {
    scanned_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    supported: SUPPORTED.map(s => s.name),
    agents,
    default: byPref.length ? byPref[0].name : null,
  };
}

/** 读注册表（缺/坏 → 现场扫一次）。 */
export function loadRegistry({ rescan = false } = {}) {
  if (!rescan) {
    try {
      const j = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
      if (Array.isArray(j.agents)) return j;
    } catch { /* 缺→重扫 */ }
  }
  return scan();
}

/** 席位绑定解析：seats/<seat>.json（或 role 字段匹配）的 agent 字段 → 注册表 default → 首个 ok。 */
export function resolveAgent(seat, registry = loadRegistry()) {
  const list = registry.agents || [];
  const seatPath = (() => {
    const direct = path.join(SEATS_DIR, `${seat}.json`);
    if (fs.existsSync(direct)) return direct;
    try { // seats 文件按 agent-id 命名（coder/designer/…）——按 role 字段回落匹配
      for (const n of fs.readdirSync(SEATS_DIR)) {
        if (!n.endsWith(".json")) continue;
        const p = path.join(SEATS_DIR, n);
        try { if (JSON.parse(fs.readFileSync(p, "utf8")).role === seat) return p; } catch { /* 坏件跳过 */ }
      }
    } catch { /* seats 目录缺 */ }
    return null;
  })();
  let bound = null;
  if (seatPath) { try { bound = JSON.parse(fs.readFileSync(seatPath, "utf8")).agent || null; } catch { /* 坏件 */ } }
  const pick = (n) => list.find(a => a.name === n && a.status === "ok") || null;
  if (bound && pick(bound)) return { agent: pick(bound), bound, source: "seat" };
  if (registry.default && pick(registry.default)) return { agent: pick(registry.default), bound: null, source: "default" };
  if (list[0]) return { agent: list[0], bound: null, source: "first" };
  return { agent: null, bound: null, source: "none" };
}

/** headless 一次性命令（每趟一进程·零窗口）；.cmd/.bat 显式走 cmd.exe /c（空'格'路径不被拆词）。 */
export function buildHeadless(agent, prompt) {
  const tpl = (agent.flags && agent.flags.headless) || null;
  if (!tpl) return null;
  const args = tpl.map(a => (a === "{prompt}" ? prompt : a));
  const ext = path.extname(agent.path).toLowerCase();
  const wrap = ext === ".cmd" || ext === ".bat";
  return {
    cmd: wrap ? "cmd.exe" : agent.path,
    args: wrap ? ["/c", agent.path, ...args] : args,
    driver: "headless",
    label: `${agent.path} ${args.slice(0, 2).join(" ")}${args.length > 2 ? " …" : ""}`,
  };
}

/** rpc 命令（JSONL·双向实时；客户端向 stdin 写 {"type":"prompt","message":…}）；.cmd/.bat 同样走 cmd.exe /c。 */
export function buildRpc(agent) {
  const tpl = (agent.flags && agent.flags.rpc) || null;
  if (!tpl) return null;
  const ext = path.extname(agent.path).toLowerCase();
  const wrap = ext === ".cmd" || ext === ".bat";
  return {
    cmd: wrap ? "cmd.exe" : agent.path,
    args: wrap ? ["/c", agent.path, ...tpl] : [...tpl],
    driver: "rpc",
    label: `${agent.path} ${tpl.join(" ")}`,
  };
}

/** 窗口驱动（TUI 兜底）：看板 铃2.ps1 注入（需 conhost 目标窗的 consolePid）。 */
export function windowBell() {
  return { driver: "window", script: WINDOW_BELL, usage: 'powershell -File "<铃2.ps1>" -ConsolePid <pid> -Text "<提示+回车>"' };
}

/* ------------------------------ CLI ------------------------------ */
function isMain() {
  try { return fs.realpathSync(process.argv[1] || "") === fs.realpathSync(url.fileURLToPath(import.meta.url)); } catch { return false; }
}
if (isMain()) {
  const JSON_OUT = process.argv.includes("--json");
  const NO_WRITE = process.argv.includes("--no-write");
  const i = process.argv.indexOf("--out");
  const outPath = i > 0 ? path.resolve(process.argv[i + 1]) : REGISTRY_PATH;
  const reg = scan();
  if (!NO_WRITE) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(reg, null, 2) + "\n", "utf8");
  }
  if (JSON_OUT) {
    console.log(JSON.stringify({ ...reg, registry: NO_WRITE ? null : outPath }, null, 2));
  } else {
    console.log(`🔍 agent 扫描 @${reg.scanned_at}　受支持：${reg.supported.join("／")}`);
    if (!reg.agents.length) {
      console.log("  ❌ 未发现任何受支持 agent——明说缺件（不静默）");
      console.log("     获取指引：npm i -g @earendil-works/pi-coding-agent（pi）｜claude｜opencode｜hermes 任一即可");
    } else {
      for (const a of reg.agents) {
        const flags = Object.keys(a.flags || {}).join("/") || "—";
        console.log(`  ✅ ${a.name.padEnd(9)} v${String(a.version).padEnd(14)} driver=${a.driver.padEnd(8)} flags=${flags}  ${a.path}`);
      }
      console.log(`  default=${reg.default}　注册表：${NO_WRITE ? "(未写)" : outPath}`);
    }
  }
  process.exit(reg.agents.length ? 0 : 1);
}
