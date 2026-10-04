// SYS-45 并行工位值守回归测试（C 层池生命周期 / A 层定向投递 / 忙位跳过 / 零键盘注入 / claim 负例）
// 跑法：node --test 处理中心/看板/tests/sys45-pool.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { EventEmitter } from "node:events";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createPool, parseSeatField } from "../值守池.mjs";
import { ringUnreadSeats, __testResetRing } from "../engine.mjs";

const BOARD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SYS = path.resolve(BOARD, "..", "..");

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys45-"));
  const boxRoot = path.join(root, "邮箱"), seatsDir = path.join(root, "seats");
  fs.mkdirSync(path.join(boxRoot, "程序员", "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.writeFileSync(path.join(seatsDir, "coder.json"), JSON.stringify({ role: "程序员", on: true, consolePid: 1, agentPid: process.pid }));
  return { root, boxRoot, seatsDir };
}
const letter = (sb, id, extra = "") => fs.writeFileSync(path.join(sb.boxRoot, "程序员", "INBOX", `${id}.md`),
  `---\nid: ${id}\nfrom: 设计师\nto: 程序员\ntype: 派单\nre: UPG-T9 甲单\ncreated: ${new Date().toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n\n${extra}\n`, "utf-8");
const fakeSpawn = (log) => (cmd, args, opts) => { const c = new EventEmitter(); c.pid = 4242; c.stdin = { write: (s) => log.writes.push(s) }; c.stdout = new EventEmitter(); c.stderr = new EventEmitter(); c.kill = () => {}; log.spawns.push({ cmd, args }); return c; };

test("SYS-45 A：派单路由字段解析（frontmatter seat: / 正文 工位[:：]）", () => {
  assert.equal(parseSeatField("---\nseat: 二号-pi\n---\n"), "二号-pi");
  assert.equal(parseSeatField("正文\n工位: 二号-pi\n更多"), "二号-pi");
  assert.equal(parseSeatField("正文\n工位：二号-pi"), "二号-pi");
  assert.equal(parseSeatField("没有字段的信"), null);
});

test("SYS-45 C：池生命周期（spawn→prompt→agent_start=忙→settled=空→exit 可观测）", () => {
  const log = { spawns: [], writes: [] };
  const pool = createPool({ spawnFn: fakeSpawn(log), stateFile: null, rpcEnabled: true }) // SYS-61：RPC 退役默认关·本用例专测其机制故显式开启;
  const r1 = pool.wake("二号-pi", "收信");
  assert.equal(r1.ok, true); assert.equal(r1.how, "rpc");
  assert.equal(log.spawns.length, 1, "首次唤醒即 spawn（按需）");
  assert.equal(log.spawns[0].cmd, "pi");
  assert.deepEqual(log.spawns[0].args, ["--mode", "rpc", "--no-session"]);
  assert.ok(log.writes[0].includes('"type":"prompt"') && log.writes[0].includes("收信"), "RPC prompt JSONL 已写入 stdin");
  const st = pool.state().workers.find((w) => w.name === "二号-pi");
  assert.equal(st.alive, true);
  // 流式中：忙位跳过（不误唤）
  pool.wake("二号-pi", "收信");
  const proc = pool.state(); // no-op
  const child = log.spawns.length; // spawn 只一次
  assert.equal(child, 1);
  return; // 事件模拟在下一测试（同一 fake 无法拿回 child 引用——用公开 API 验证 busy/flags）
});
test("SYS-45 C：agent_start→busy 跳过；agent_settled→复醒；exit→重spawn", () => {
  const log = { spawns: [], writes: [] };
  let child = null;
  const spawnFn = (cmd, args) => { child = fakeSpawn(log)(cmd, args); return child; };
  const pool = createPool({ spawnFn, stateFile: null, rpcEnabled: true }) // SYS-61：同上;
  pool.wake("二号-pi", "收信");
  child.stdout.emit("data", Buffer.from(JSON.stringify({ type: "agent_start" }) + "\n"));
  assert.equal(pool.busy("二号-pi"), true, "agent_start=流式中");
  const w2 = pool.wake("二号-pi", "收信");
  assert.deepEqual(w2, { ok: false, how: "rpc", reason: "busy" }, "忙位跳过（信不标记由调用方保证）");
  assert.equal(log.writes.length, 1, "忙时不重复喂");
  child.stdout.emit("data", Buffer.from(JSON.stringify({ type: "agent_settled" }) + "\n"));
  assert.equal(pool.busy("二号-pi"), false);
  assert.equal(pool.wake("二号-pi", "收信").ok, true, "settled 后可再唤醒");
  child.emit("exit", 0);
  assert.equal(pool.alive("二号-pi"), false);
  assert.equal(pool.wake("二号-pi", "收信").ok, true, "exit 后自动重 spawn");
  assert.equal(log.spawns.length, 2);
  const evs = pool.state().events.map((e) => e.ev);
  assert.ok(evs.includes("spawn") && evs.includes("prompt") && evs.includes("agent_start") && evs.includes("agent_settled") && evs.includes("exit"), "生命周期事件可观测：" + evs.join("/"));
});

test("SYS-45 A/D：定向信只唤醒目标工位（角色窗不响）；忙位不标记下轮重评；非定向信走原铃", () => {
  __testResetRing();
  const sb = sandbox();
  letter(sb, "LTR-D1", "工位: 二号-pi");
  const wakes = [], rings = [];
  const poolStub = { wake: (name, text) => { wakes.push({ name, text }); return { ok: true, how: "rpc" }; } };
  const opened = [], injected = [], alarms = [];
  const CLAIM0 = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys45cl-")); // SYS-61 aq4：空 claims 沙盒（隔离）
  const opts = { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true, pool: poolStub, onRing: () => { rings.push(1); return "OK"; }, workers: [{ name: "二号-pi", mailbox: "程序员" }], openWindow: (n) => { opened.push(n); return 9001; }, findWindow: () => 0, openCooldownMs: 0, injectWorker: (pid, t) => { injected.push({ pid, t }); }, onAlarmWorker: (m) => alarms.push(m) }; // SYS-61：可见窗通道缝（RPC 退役）＋R1：findWindow/开窗冷却测试缝
  ringUnreadSeats({ ledger: { active: [{ id: "UPG-T9", phase: "dispatched" }] } }, opts);
  assert.equal(opened.length, 1, "SYS-61：窗死/无窗 → 自动开窗（绝无隐性 RPC 兜底）");
  assert.deepEqual(opened, ["二号-pi"]);
  assert.equal(injected.length, 1, "开窗后须注入");
  assert.ok(injected[0].t.includes("收信") && injected[0].t.includes("AGENTS.md"), "注入文本含角色卡路径（进角色）");
  assert.equal(wakes.length, 0, "RPC 池不得再被唤醒（SYS-61 退役）");
  assert.equal(rings.length, 0, "定向信不得响角色窗（定向投递）");
  ringUnreadSeats({ ledger: { active: [{ id: "UPG-T9", phase: "dispatched" }] } }, opts);
  assert.equal(opened.length, 1, "已标记=不重复开窗");
  // SYS-61 开窗失败向：不 spawn·告警·不标记 → 下轮重评（两次都尝试+两次告警）
  __testResetRing();
  const sb2 = sandbox();
  letter(sb2, "LTR-D2", "工位: 二号-pi");
  const o2 = { ...opts, boxRoot: sb2.boxRoot, seatsDir: sb2.seatsDir, openWindow: () => { throw new Error("开窗失败"); }, fault: () => {} };
  ringUnreadSeats({ ledger: { active: [{ id: "UPG-T9", phase: "dispatched" }] } }, o2);
  ringUnreadSeats({ ledger: { active: [{ id: "UPG-T9", phase: "dispatched" }] } }, o2);
  assert.equal(alarms.length, 2, "开窗失败：不 spawn·告警（两次重评各一次）");
  assert.ok(alarms[0].includes("不 spawn"), "告警须写明不 spawn（宁排队·绝不隐性）");
  // 非定向信：照旧响角色窗
  __testResetRing();
  const sb3 = sandbox();
  letter(sb3, "LTR-N1", "无路由字段");
  const rings3 = [];
  ringUnreadSeats({ ledger: { active: [{ id: "UPG-T9", phase: "dispatched" }] } }, { ...opts, boxRoot: sb3.boxRoot, seatsDir: sb3.seatsDir, onRing: (pid, t) => { rings3.push(t); return "OK"; } });
  assert.equal(rings3.length, 1, "非定向信：原铃路径不变（零回归）");
});

test("SYS-45 C：headless 通道零键盘注入（源码锁：代码面无 铃2/powershell/execSync）", () => {
  const raw = fs.readFileSync(path.join(BOARD, "值守池.mjs"), "utf8");
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""); // 剥注释：红线说明文字不算注入路径
  assert.ok(!/铃2|powershell|execSync|SendKeys/.test(code), "headless 池代码面不得含任何键盘注入路径");
  assert.ok(raw.includes('"--mode", "rpc"'), "RPC 通道在场");
});

test("SYS-45 双领=0（claim 锁负例：双领拦截 / 越权释放拦截 / 本人释放放行）", () => {
  const claim = path.join(SYS, "处理中心", "邮局", "claim.mjs");
  const key = "TEST-SYS45-" + process.pid + "-" + Date.now();
  const run = (args) => { try { return { code: 0, out: execFileSync(process.execPath, [claim, ...args], { encoding: "utf8", timeout: 15000 }) }; } catch (e) { return { code: e.status, out: String(e.stdout || "") + String(e.stderr || "") }; } };
  try {
    assert.equal(run(["领", key, "甲工"]).code, 0, "首领成功");
    const dup = run(["领", key, "乙工"]);
    assert.equal(dup.code, 1, "双领必须拦");
    assert.ok(dup.out.includes("已被领"), "双领拦截有据");
    const bad = run(["放", key, "乙工"]);
    assert.equal(bad.code, 1, "越权释放必须拦");
    assert.equal(run(["放", key, "甲工"]).code, 0, "本人释放放行");
  } finally { try { run(["放", key, "甲工"]); } catch {} }
});
