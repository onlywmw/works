// SYS-161：会话轮换哨兵「注入后验证」——L1 契约（负例/正例/期内/旧格式兼容/注入异常/dry 只读）
// 变异锚：M1 注入后直接记 session.rotate（旧行为，无验证）⇒ 负例①红；M2 验证窗内直接判未生效 ⇒ 期内③红；
//   M3 未生效仍记 session.rotate 事件名 ⇒ 口径分离读数④红。（亲杀实录见交付报告）
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scanSessionRotate } from "../engine.mjs";

const MB = 1024 * 1024;
const T0 = Date.now();

/** 沙箱：真 会话轮换.json / seats / sessions / 邮局 零触（全部换沙盒目录）。 */
function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys161-"));
  const seatsDir = path.join(root, "seats");
  const boxRoot = path.join(root, "邮箱");
  const sessionsRoot = path.join(root, "sessions");
  const stateFile = path.join(root, "会话轮换.json");
  fs.mkdirSync(path.join(boxRoot, "程序员", "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  const sessDir = path.join(sessionsRoot, "2026-10-02_工位_程序员_x");
  fs.mkdirSync(sessDir, { recursive: true });
  fs.writeFileSync(path.join(seatsDir, "coder.json"), JSON.stringify({ role: "程序员", on: true, consolePid: 1 }));
  const sessFile = path.join(sessDir, "sess.jsonl");
  fs.writeFileSync(sessFile, Buffer.alloc(4 * MB, "x")); // ≥ minBytes 3.5MB
  const old = (T0 - 60 * 60e3) / 1000;                    // 静置 60min ≥ 15min
  fs.utimesSync(sessFile, old, old);
  return { root, seatsDir, boxRoot, sessionsRoot, stateFile, sessFile };
}
/** 跑一轮（force 绕过 5min 节流）：日志走 onFault 收集——真 故障.log 零触。 */
function scan(sb, over = {}) {
  const logs = [];
  scanSessionRotate({
    force: true, noLog: true,
    seatsDir: sb.seatsDir, boxRoot: sb.boxRoot, sessionsRoot: sb.sessionsRoot, stateFile: sb.stateFile,
    onFault: (where, e) => logs.push({ where, e: String(e) }),
    ...over,
  });
  return logs;
}
const events = (logs) => logs.map(l => l.where);
const readState = (sb) => JSON.parse(fs.readFileSync(sb.stateFile, "utf8"));

test("SYS-161 ① 负例·注入无效：首轮落 pending 不记「已轮换」；超期未验证 ⇒ 记「未生效」且不出现 session.rotate", () => {
  const sb = sandbox();
  let injected = 0;
  const noop = () => { injected++; };
  const logs1 = scan(sb, { now: T0, inject: noop });
  assert.equal(injected, 1, "条件命中应发生一次注入");
  assert.deepEqual(events(logs1), [], "注入当场不得记「已轮换」（M1 锚）");
  assert.ok(readState(sb)["程序员"].pending, "应落 pending 待验证");
  // 下一轮（超判定窗 5min）：注入无效（无新档/mtime 未变）⇒ 未生效·独立事件名
  const logs2 = scan(sb, { now: T0 + 6 * 60e3, inject: noop });
  assert.deepEqual(events(logs2), ["session.rotate.noeffect"], "超期未验证 ⇒ 只记未生效（M1/M3 锚）");
  assert.ok(logs2[0].e.includes("注入未生效"), "文案需含「注入未生效」");
  assert.equal(injected, 1, "pending 在场期间不得再注入");
  const st = readState(sb);
  assert.equal(st["程序员"].pending, null, "判后清 pending（转观察）");
  assert.ok(st["程序员"].last >= T0, "落冷却计时（下轮冷却后重试）");
});

test("SYS-161 ② 正例·注入生效：下一轮核出新档/mtime 变化 ⇒ 记 session.rotate「已轮换」（无未生效）", () => {
  const sb = sandbox();
  const logs1 = scan(sb, { now: T0, inject: () => { const t = (T0 + 1000) / 1000; fs.utimesSync(sb.sessFile, t, t); } });
  assert.deepEqual(events(logs1), [], "注入当场不记");
  const logs2 = scan(sb, { now: T0 + 6 * 60e3, inject: () => { throw new Error("不应再注入"); } });
  assert.deepEqual(events(logs2), ["session.rotate"], "验证到 ⇒ 真轮换事件（M3 锚：口径分离）");
  assert.ok(logs2[0].e.includes("已轮换"), "文案含「已轮换」");
  assert.equal(readState(sb)["程序员"].pending, null);
});

test("SYS-161 ③ 期内不判：判定窗内（<5min）零日志、pending 保留（M2 锚）", () => {
  const sb = sandbox();
  scan(sb, { now: T0, inject: () => {} });
  const logs = scan(sb, { now: T0 + 4 * 60e3, inject: () => {} });
  assert.deepEqual(events(logs), [], "期内不得判未生效/已轮换（M2 锚）");
  assert.ok(readState(sb)["程序员"].pending, "pending 保留待下轮");
});

test("SYS-161 ④ 旧格式兼容＋冷却：数值型 state（role→ts）照读；冷却内不注入", () => {
  const sb = sandbox();
  fs.writeFileSync(sb.stateFile, JSON.stringify({ "程序员": T0 - 30 * 60e3 }), "utf8"); // 旧格式·冷却中
  let injected = 0;
  const logs = scan(sb, { now: T0, inject: () => { injected++; } });
  assert.equal(injected, 0, "旧格式数值 last 冷却应生效（不注入）");
  assert.deepEqual(events(logs), []);
});

test("SYS-161 ⑤ 注入异常：记 session.rotate.inject，不落 pending、不记已轮换", () => {
  const sb = sandbox();
  const logs = scan(sb, { now: T0, inject: () => { throw new Error("注入失败"); } });
  assert.deepEqual(events(logs), ["session.rotate.inject"]);
  const st = fs.existsSync(sb.stateFile) ? readState(sb) : {}; // 注入失败路径可不落状态文件
  assert.ok(!st["程序员"] || !st["程序员"].pending, "注入失败不得落 pending");
});

test("SYS-161 ⑥ dry 只读：待验态 dry 跑零写零日志（轮换自检零回归）", () => {
  const sb = sandbox();
  scan(sb, { now: T0, inject: () => {} });
  const before = fs.readFileSync(sb.stateFile, "utf8");
  const logs = scan(sb, { now: T0 + 6 * 60e3, dry: true, inject: () => { throw new Error("dry 不应注入"); } });
  assert.deepEqual(events(logs), [], "dry 不走日志出口");
  assert.equal(fs.readFileSync(sb.stateFile, "utf8"), before, "dry 不改状态文件");
});
