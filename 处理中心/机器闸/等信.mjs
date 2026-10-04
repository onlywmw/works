#!/usr/bin/env node
// 等信.mjs —— 一条命令阻塞等信（SYS-167·2026-10-03 用户令「等与碎别做进模型回合」）
//
// 背景：实测 24h 全席 495 次信箱轮询 ≈113M tokens（极端会话同一条「看信箱」命令跑了 80 次）——
//       根因是把「等」拆成 N 个模型回合（每回合重发全上下文）。本工具在**单条命令内**循环检测，
//       有信即返（打印 id/标题列表·exit 0）／超时返「无新信」（exit 1）——**N 回合压成 1**。
//
// 用法：node 处理中心/机器闸/等信.mjs [--box <角色>] [--timeout <秒>] [--interval <秒>] [--json]
//   --box     信箱角色（缺省按 cwd 自动判定：处理中心/看板/工位/<角色>）
//   --timeout 最长等待秒数（默认 600）
//   --interval 检测间隔秒数（默认 8）
//   --json    机器可读输出（脚本消费）
// 零副作用：只读目录/只读信件头——不动信、不销、不写任何文件。
// 与引擎铃双通道并存：铃敲你 ⇒ 立刻收；席主动等 ⇒ 本工具（谁先到算谁）。
import fs from "node:fs";
import path from "node:path";
import { SYS } from "./lib/root.mjs"; // SYS-160：根解析单源（环境变量 MOV_ROOT → 脚本位置回溯 → 缺省原路径）

const BOX_ROOT = path.join(SYS, "处理中心", "邮局", "邮箱");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const JSON_OUT = argv.includes("--json");

// 用法错（exit 2）：文本走 stderr；--json 时 stdout 给结构化错误（脚本消费）
function die(msg, code = 2) {
  if (JSON_OUT) console.log(JSON.stringify({ ok: false, error: msg }));
  else console.error("✗ " + msg);
  process.exit(code);
}

// cwd 判工位（沿 engine.tokenSeatOfCwd 同款：锚 <SYS>/处理中心/看板/工位/<角色>，防异体系同名目录误归）
function seatOfCwd(cwd) {
  const base = path.join(SYS, "处理中心", "看板", "工位");
  const rel = path.relative(base, cwd);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const seg = rel.split(path.sep)[0];
  return seg && fs.existsSync(path.join(BOX_ROOT, seg)) ? seg : null;
}

const boxes = () => { try { return fs.readdirSync(BOX_ROOT, { withFileTypes: true }).filter((e) => e.isDirectory() && fs.existsSync(path.join(BOX_ROOT, e.name, "INBOX"))).map((e) => e.name); } catch { return []; } };
const BOX = opt("--box") || seatOfCwd(process.cwd());
if (!BOX) die(`无法从当前目录判定信箱角色（${process.cwd()}）——请显式给 --box <角色>；现有信箱：${boxes().join("/")}`);
if (!fs.existsSync(path.join(BOX_ROOT, BOX))) die(`信箱不存在：${BOX}；现有信箱：${boxes().join("/")}`);
const INBOX = path.join(BOX_ROOT, BOX, "INBOX");

// 数值参数（缺省 600s/8s；非法即用法错——不静默兜底）
const num = (k, d) => { const v = opt(k); if (v === undefined) return d; const n = Number(v); if (!Number.isFinite(n) || n < 0) die(`${k} 需为非负数字（收到「${v}」）`); return n; };
const TIMEOUT_MS = num("--timeout", 600) * 1000;
const INTERVAL_MS = Math.max(1, num("--interval", 8)) * 1000; // ≥1s：防忙等（0.1s 级无意义）

const list = () => { try { return fs.readdirSync(INBOX).filter((f) => /^LTR-.*\.md$/.test(f)).sort(); } catch { return []; } };

// 只读信件头部前 2KB 取 id/from/re（值由信封承载；缺则回落文件名/标题行）
function head(file) {
  let raw = "";
  try { raw = fs.readFileSync(path.join(INBOX, file), "utf8").slice(0, 2048); } catch { return { id: file.replace(/\.md$/, ""), from: "", re: "" }; }
  const field = (k) => { const m = raw.match(new RegExp(`^${k}:\\s*(.+)$`, "m")); return m ? m[1].trim().replace(/^["']|["']$/g, "") : ""; };
  return { id: field("id") || file.replace(/\.md$/, ""), from: field("from"), re: field("re") || (raw.match(/^#\s+(.+)$/m) || ["", ""])[1].trim() };
}

const t0 = Date.now();
for (;;) {
  const files = list();
  const waitedSec = Math.round((Date.now() - t0) / 1000);
  if (files.length) {
    const letters = files.map(head);
    if (JSON_OUT) console.log(JSON.stringify({ ok: true, box: BOX, count: letters.length, waitedSec, timedOut: false, letters }));
    else {
      console.log(`📬 ${BOX}：${letters.length} 封（已等 ${waitedSec}s）`);
      for (const l of letters) console.log(`  ${l.id}  ${l.from ? l.from + " · " : ""}${l.re}`);
    }
    break;
  }
  const left = TIMEOUT_MS - (Date.now() - t0);
  if (left <= 0) {
    const waited = Math.round((Date.now() - t0) / 1000);
    if (JSON_OUT) console.log(JSON.stringify({ ok: false, box: BOX, count: 0, waitedSec: waited, timedOut: true, letters: [] }));
    else console.log(`📭 无新信（${BOX}·等待 ${waited}s 超时）`);
    process.exitCode = 1;
    break;
  }
  await sleep(Math.min(INTERVAL_MS, left));
}
