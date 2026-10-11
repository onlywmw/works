// SYS-45 并行工位值守回归测试（A 层定向投递路由 / claim 锁负例）
// 2026-10-05 瘦身批1：C 层工位池（createPool）随 SYS-61 RPC 通道退役同批删除——池件/池用例（spawn/prompt/busy/源码锁）一并移除；A 层路由与 claim 负例保留。
// 跑法：node --test 处理中心/看板/tests/sys45-pool.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseSeatField } from "../lib/envelope.mjs";
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

test("SYS-45 A：派单路由字段解析（frontmatter seat: / 正文 工位[:：]）", () => {
  assert.equal(parseSeatField("---\nseat: 二号-pi\n---\n"), "二号-pi");
  assert.equal(parseSeatField("正文\n工位: 二号-pi\n更多"), "二号-pi");
  assert.equal(parseSeatField("正文\n工位：二号-pi"), "二号-pi");
  assert.equal(parseSeatField("没有字段的信"), null);
});

test("SYS-45 A/D：定向信只唤醒目标工位（角色窗不响）；忙位不标记下轮重评；非定向信走原铃", () => {
  __testResetRing();
  const sb = sandbox();
  letter(sb, "LTR-D1", "工位: 二号-pi");
  const rings = [];
  const opened = [], injected = [], alarms = [];
  const opts = { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true, onRing: () => { rings.push(1); return "OK"; }, workers: [{ name: "二号-pi", mailbox: "程序员" }], openWindow: (n) => { opened.push(n); return 9001; }, findWindow: () => 0, openCooldownMs: 0, injectWorker: (pid, t) => { injected.push({ pid, t }); }, onAlarmWorker: (m) => alarms.push(m) }; // SYS-61：可见窗通道缝（RPC 退役）＋R1：findWindow/开窗冷却测试缝
  ringUnreadSeats({ ledger: { active: [{ id: "UPG-T9", phase: "dispatched" }] } }, opts);
  assert.equal(opened.length, 1, "SYS-61：窗死/无窗 → 自动开窗（绝无隐性 RPC 兜底）");
  assert.deepEqual(opened, ["二号-pi"]);
  assert.equal(injected.length, 1, "开窗后须注入");
  assert.ok(injected[0].t.includes("收信") && injected[0].t.includes("AGENTS.md"), "注入文本含角色卡路径（进角色）");
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
