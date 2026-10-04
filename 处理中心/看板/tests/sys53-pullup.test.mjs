// SYS-53 静默席拉起闸 · 自测（席静默+待办 → 池唤醒；两向 + 冷却 + 真池端到端）
// 验收（卡面）：构造案双席静默 → ≤N 分钟被拉起（真实端到端）+ 零回归
// 跑法：node --test 处理中心/看板/tests/sys53-pullup.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { EventEmitter } from "node:events";
import { createPool } from "../值守池.mjs";
import { pullUpSilentSeats, __testResetPullUp, __testResetWorkerOpen } from "../engine.mjs";

const NOW = Date.now();
const ago = (min) => new Date(NOW - min * 60e3).toLocaleString("sv-SE");

function sandbox(workers = [{ name: "二号-pi", mailbox: "程序员", enabled: true }]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys53-"));
  const boxRoot = path.join(root, "邮箱"), claimsDir = path.join(root, ".claims");
  for (const w of workers) fs.mkdirSync(path.join(boxRoot, w.mailbox, "INBOX"), { recursive: true });
  fs.mkdirSync(claimsDir, { recursive: true });
  const workersFile = path.join(root, "值守工.json");
  fs.writeFileSync(workersFile, JSON.stringify({ workers }), "utf-8");
  return { root, boxRoot, claimsDir, workersFile, stateFile: path.join(root, "静默拉起.json") };
}
function letter(sb, role, id, created, type = "派单") {
  fs.writeFileSync(path.join(sb.boxRoot, role, "INBOX", `${id}.md`),
    `---\nid: ${id}\nfrom: 设计师\nto: ${role}\ntype: ${type}\nre: UPG-T9 单\ncreated: ${created}\nstatus: 未读\npayload: —\nsha: —\n---\n\nx\n`, "utf-8");
}
function claim(sb, key, worker, at) {
  fs.writeFileSync(path.join(sb.claimsDir, `${key}.json`), JSON.stringify({ key, worker, at }), "utf-8");
}
// SYS-61：RPC 退役——唤醒走可见窗三态；测试统一以窗通道缝捕获
const CAP = { opened: [], injected: [], alarms: [] };
const resetCap = () => { CAP.opened = []; CAP.injected = []; CAP.alarms = []; __testResetWorkerOpen(); };
// 兼容旧断言用桩池（不再被 wakeWorker 调用——保留以证 RPC 未被使用）
const stubPool = (log) => ({ wake: (name, text) => { log.push({ name, text }); return { ok: true, how: "rpc" }; } });
function run(sb, { now = NOW, sessionIdleMin = 30, binding = {}, sm, wtm } = {}) {
  return pullUpSilentSeats({
    boxRoot: sb.boxRoot, claimsDir: sb.claimsDir, workersFile: sb.workersFile, stateFile: sb.stateFile,
    now, force: true, binding, noLog: true,
    sessionMtime: sm || (() => now - sessionIdleMin * 60e3),
    openWindow: (n) => { CAP.opened.push(n); return 9000 + CAP.opened.length; },
    findWindow: () => 0, // SYS-61 R1：测试注入缝（防真 WMI 命中真窗/吃真 pid）
    injectWorker: (pid, t) => { CAP.injected.push({ pid, t }); },
    onAlarmWorker: (m) => { CAP.alarms.push(m); },
    worktreeMtimeFn: wtm,
  });
}

test("① 双席静默 + 各自超窗未读信 → 双席都被拉起（卡面主案）", () => {
  __testResetPullUp();
  const sb = sandbox([{ name: "二号-pi", mailbox: "程序员", enabled: true }, { name: "designer-x", mailbox: "设计师", enabled: true }]);
  letter(sb, "程序员", "LTR-A", ago(30));
  letter(sb, "设计师", "LTR-B", ago(30));
  resetCap();
  const out = run(sb);
  assert.equal(CAP.opened.length, 2, "双席各拉起一次（开窗）");
  assert.deepEqual([...CAP.opened].sort(), ["designer-x", "二号-pi"]);
  assert.equal(CAP.injected.length, 2, "开窗后各注入一次");
  assert.ok(CAP.injected.every((i) => i.t.includes("静默席拉起")), "唤醒文案须标注静默席拉起");
  assert.ok(out.pulled.length === 2);
});

test("② 席有动静（会话 1min 前活跃）→ 不拉起（反向案）", () => {
  __testResetPullUp();
  const sb = sandbox(); letter(sb, "程序员", "LTR-C", ago(30));
  resetCap();
  run(sb, { sessionIdleMin: 1 });
  assert.equal(CAP.injected.length, 0, "席活跃不拉");
});

test("③ 席静默但空箱空手（无未办/无持单）→ 不打扰", () => {
  __testResetPullUp();
  const sb = sandbox();
  const log = [];
  run(sb, stubPool(log));
  assert.equal(log.length, 0, "无待办不拉");
});

test("④ 冷却：同刻连跑只拉一次；+31min 可再拉", () => {
  __testResetPullUp();
  const sb = sandbox(); letter(sb, "程序员", "LTR-D", ago(30));
  resetCap();
  run(sb);
  run(sb, { now: NOW + 60e3 });
  assert.equal(CAP.injected.length, 1, "冷却内不重拉");
  run(sb, { now: NOW + 31 * 60e3 });
  assert.equal(CAP.injected.length, 2, "过冷却再拉");
});

test("⑤ 持单超 SLA + 席静默 → 拉起（SYS-52 联动·无信也拉）", () => {
  __testResetPullUp();
  const sb = sandbox(); claim(sb, "UPG-950", "二号-pi", ago(40));
  resetCap();
  run(sb);
  assert.equal(CAP.injected.length, 1);
  assert.ok(CAP.injected[0].t.includes("持单 UPG-950"), "唤醒文案须点出持单");
});

test("⑥ 回执信不算待办 → 不拉起（知悉类不打扰）", () => {
  __testResetPullUp();
  const sb = sandbox(); letter(sb, "程序员", "LTR-E", ago(30), "回执");
  resetCap();
  run(sb);
  assert.equal(CAP.injected.length, 0);
});

test("⑦ enabled=false 的席位跳过；未超窗的信不拉", () => {
  __testResetPullUp();
  const sb = sandbox([{ name: "二号-pi", mailbox: "程序员", enabled: false }]);
  letter(sb, "程序员", "LTR-F", ago(30));
  resetCap();
  run(sb);
  assert.equal(CAP.injected.length, 0, "禁用席不拉");
  const sb2 = sandbox(); letter(sb2, "程序员", "LTR-G", ago(5)); // 5min < 10min 窗
  resetCap();
  run(sb2);
  assert.equal(CAP.injected.length, 0, "窗内新信不拉");
});

test("⑧ SYS-61：RPC 退役态——createPool 默认关（wake 返回 rpc-retired·start 记事件）；显式 rpcEnabled 才启用", () => {
  const writes = [];
  const fakeSpawn = () => { const c = new EventEmitter(); c.pid = 5252; c.stdin = { write: (s) => { writes.push(s); } }; c.stdout = new EventEmitter(); c.stderr = new EventEmitter(); c.kill = () => {}; return c; };
  const off = createPool({ spawnFn: fakeSpawn, stateFile: null });
  assert.deepEqual(off.wake("二号-pi", "x"), { ok: false, how: "rpc-retired" }, "默认退役态：唤醒不 spawn");
  assert.equal(writes.length, 0, "退役态不得写 stdin");
  const on = createPool({ spawnFn: fakeSpawn, stateFile: null, rpcEnabled: true }); // 防回潮开关（测试/迁移用）
  assert.equal(on.wake("二号-pi", "x").ok, true, "显式开启后机制可用（历史通道回归锁）");
});

test("⑨ SYS-61：可见窗端到端（pullUp 路径）——窗死→开窗+workersFile 换绑+注入；RPC 零调用", () => {
  __testResetPullUp(); resetCap();
  const sb = sandbox(); letter(sb, "程序员", "LTR-H", ago(30));
  const poolWakes = [];
  const pool = stubPool(poolWakes);
  const out = run(sb);
  assert.equal(out.pulled.length, 1, "拉起 1 席");
  assert.equal(out.pulled[0].how, "bell-reopened", "SYS-61：窗死→开窗+注入（非 RPC）");
  assert.equal(poolWakes.length, 0, "RPC 池零调用（退役）");
  assert.deepEqual(CAP.opened, ["二号-pi"]);
  const wf = JSON.parse(fs.readFileSync(sb.workersFile, "utf-8"));
  assert.ok(wf.workers[0].consolePid >= 9001, "换绑自愈：workersFile consolePid 已回写新窗 pid");
  assert.equal(CAP.injected.length, 1, "注入送达一次");
  assert.ok(CAP.injected[0].t.includes("静默席拉起"));
});

test("⑩ aq4：席静默+超窗信在箱，但持新单且 worktree 活跃（有主且正在干）→ 不拉不注；worktree 静止→照拉", () => {
  __testResetPullUp();
  const sb = sandbox();
  letter(sb, "程序员", "LTR-AQ4", ago(30)); // 有理由（超窗信）——撞车案正是这条路径：只看静默+待办，不看「有主且正在干」
  claim(sb, "UPG-951", "二号-pi", ago(11)); // 11min 新 claim（原案 11min 新 claim 绕过探针）
  resetCap();
  run(sb, { wtm: () => Date.now() - 5 * 60e3 }); // worktree 5min 前有写盘=正在干
  assert.equal(CAP.injected.length, 0, "有主+活跃 → 不拉（双实例修）");
  assert.equal(CAP.opened.length, 0, "不得开窗");
  run(sb, { wtm: () => Date.now() - 40 * 60e3 }); // worktree 40min 无写盘=静止
  assert.equal(CAP.injected.length, 1, "静止 → 照常拉");
  assert.ok(CAP.injected[0].t.includes("未办信 LTR-AQ4"), "理由=超窗信");
});
