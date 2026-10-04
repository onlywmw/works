// SYS-43 看门狗误报修回归测试（换防代际翻转复查 + 座探防抖）
// 跑法：node --test 处理中心/看板/tests/sys43-watchdog.test.mjs
// 口径：沙箱 seats/邮箱（不碰实盘）；watchdog 测试桩 boxRoot/seatsDir/watchFile/force/onAlarm
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { watchdog, ringUnreadSeats, pollSeatsFull, __testResetRing } from "../engine.mjs";

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys43-"));
  const boxRoot = path.join(root, "邮箱"), seatsDir = path.join(root, "seats");
  fs.mkdirSync(path.join(boxRoot, "程序员", "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.writeFileSync(path.join(seatsDir, "coder.json"), JSON.stringify({ role: "程序员", on: true, consolePid: 1, agentPid: process.pid }));
  return { root, boxRoot, seatsDir, watchFile: path.join(root, "看门狗.json") };
}
const setPid = (sb, pid) => { const f = path.join(sb.seatsDir, "coder.json"); fs.writeFileSync(f, JSON.stringify({ ...JSON.parse(fs.readFileSync(f, "utf-8")), agentPid: pid })); };
function letter(sb, id, ageMin = 11) {
  fs.writeFileSync(path.join(sb.boxRoot, "程序员", "INBOX", `${id}.md`),
    `---\nid: ${id}\nfrom: 设计师\nto: 程序员\ntype: 派单\nre: UPG-T9 甲单\nref: —\ncreated: ${new Date(Date.now() - ageMin * 60e3).toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n\n测试信\n`, "utf-8");
}
const ringOpts = (sb, rings) => ({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true, onRing: () => { rings.push(1); return "OK"; } });
const watchOpts = (sb, alarms) => ({ force: true, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile: sb.watchFile, noLog: true, onAlarm: (m) => alarms.push(m), onEscalate: () => {} }); // SYS-58：告警信出口注缝（本组只验告警面，勿发真信）；SYS-91：noLog

test("SYS-43 误报臂：敲在旧代 → 座探翻新代 → 告警复查任一世代命中即已敲（0 告警）", () => {
  __testResetRing();
  const sb = sandbox();
  letter(sb, "LTR-W1"); // 11 分钟信龄（超 5 分钟宽限）
  const rings = [];
  ringUnreadSeats({ ledger: { active: [{ id: "UPG-T9", phase: "dispatched" }] } }, ringOpts(sb, rings)); // 敲在 gen=A（process.pid）
  assert.equal(rings.length, 1, "先例：当代敲 1 次");
  setPid(sb, process.ppid || 1); // 换防：座探把 agentPid 翻到另一代（同窗存活进程）
  let again = 0;
  ringUnreadSeats({ ledger: { active: [{ id: "UPG-T9", phase: "dispatched" }] } }, { ...ringOpts(sb, []), onRing: () => { again++; return "OK"; } });
  assert.equal(again, 1, "换代重敲语义保留（新代重新激活）");
  const alarms = [];
  watchdog({ ledger: { active: [] } }, watchOpts(sb, alarms));
  assert.equal(alarms.length, 0, "任一世代已敲 → 不得告警（05:32:33 型换防误报修复）");
});

test("SYS-43 正臂：真·未敲信超宽限 → 告警照发（修不掩真）", () => {
  __testResetRing();
  const sb = sandbox();
  letter(sb, "LTR-W2"); // 从未敲过
  const alarms = [];
  watchdog({ ledger: { active: [] } }, watchOpts(sb, alarms)); // SYS-58 R2：首见=记「可敲未敲」起点（宽限内不报）
  assert.equal(alarms.length, 0, "宽限内（首见）不报");
  watchdog({ ledger: { active: [] } }, { ...watchOpts(sb, alarms), now: Date.now() + 3 * 60e3 }); // 超 2min 宽限
  assert.equal(alarms.length, 1, "真未敲（持续超宽限）必须告警");
  assert.ok(alarms[0].includes("LTR-W2"), "告警指向该信");
});

test("SYS-43 正臂边界：宽限内（<5 分钟）不告警；回执类不告警", () => {
  __testResetRing();
  const sb = sandbox();
  letter(sb, "LTR-W3", 2); // 2 分钟信龄
  fs.writeFileSync(path.join(sb.boxRoot, "程序员", "INBOX", "LTR-W4.md"),
    `---\nid: LTR-W4\nfrom: 设计师\nto: 程序员\ntype: 回执\nre: [回执] 某单\nref: —\ncreated: ${new Date(Date.now() - 30 * 60e3).toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n`, "utf-8");
  const alarms = [];
  watchdog({ ledger: { active: [] } }, watchOpts(sb, alarms));
  assert.equal(alarms.length, 0, "宽限内与回执均不告警");
});

test("SYS-173 标题体系标签：新格式 MOV-程序员〔安卓中国〕解析出席名「程序员」；旧格式仍向后兼容", () => {
  const sb = sandbox();
  const f = path.join(sb.seatsDir, "coder.json");
  const reset = () => fs.writeFileSync(f, JSON.stringify({ role: "程序员", on: true, agent: "pi", agentPid: 1, consolePid: 1 }), "utf-8");
  const pidOf = () => JSON.parse(fs.readFileSync(f, "utf-8")).agentPid;
  const deadKill = () => { throw new Error("dead"); }; // 旧代（agentPid=1）判死，避免 keep 分歧
  // 旧格式（无体系标签）：席名取 MOV- 到行尾
  reset();
  pollSeatsFull({ seatsDir: sb.seatsDir, probe: () => JSON.stringify([{ title: "MOV-程序员", cmdPid: 1, agentPid: process.ppid || 2, agent: "x" }]), kill: deadKill, noLog: true });
  assert.equal(pidOf(), process.ppid || 2, "旧格式窗仍可解析（向后兼容）");
  // 新格式：席名取 MOV- 到 〔 之间——错解析会得到「程序员〔安卓中国〕」不入 SEAT_ROLES，档不动
  reset();
  pollSeatsFull({ seatsDir: sb.seatsDir, probe: () => JSON.stringify([{ title: "MOV-程序员〔安卓中国〕", cmdPid: 1, agentPid: process.ppid || 2, agent: "x" }]), kill: deadKill, noLog: true });
  assert.equal(pidOf(), process.ppid || 2, "新格式解析正确（席名=程序员）");
});

test("SYS-43 代际稳定性：同窗旧 agent 活着 → 座探不换代（防抖）；旧代死 → 照换（换代语义保留）", () => {
  const sb = sandbox();
  const f = path.join(sb.seatsDir, "coder.json");
  const before = JSON.parse(fs.readFileSync(f, "utf-8")).agentPid; // = process.pid（活）
  const probe = () => JSON.stringify([{ title: "MOV-程序员〔安卓中国〕", cmdPid: 1, agentPid: process.ppid || 2, agent: "x" }]);
  pollSeatsFull({ seatsDir: sb.seatsDir, probe, kill: () => {}, noLog: true }); // 旧代活着（SYS-91：noLog）
  assert.equal(JSON.parse(fs.readFileSync(f, "utf-8")).agentPid, before, "旧代活着：座探抖动不许翻转 agentPid");
  pollSeatsFull({ seatsDir: sb.seatsDir, probe, kill: () => { throw new Error("dead"); }, noLog: true }); // 旧代死（SYS-91：noLog）
  assert.equal(JSON.parse(fs.readFileSync(f, "utf-8")).agentPid, process.ppid || 2, "旧代死：照换新代（旧信激活不受影响）");
});
