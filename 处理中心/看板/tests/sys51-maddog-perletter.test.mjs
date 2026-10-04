// SYS-51 疯狗按信判据 · 自测（删「全角色零发信」粗条件；席会话静默才咬）
// 验收两向（卡面）：①他单有动静+本信未读+席静默→必咬；②本信已读/席有动静→不咬
// 跑法：node --test 处理中心/看板/tests/sys51-maddog-perletter.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { madDog, ringUnreadSeats, __testResetRing } from "../engine.mjs";

const SEAT = { "设计师": "designer", "程序员": "coder", "验收员": "qa", "审验员": "reviewer" };
const NOW = Date.now();
const ago = (min) => new Date(NOW - min * 60e3).toLocaleString("sv-SE");

function sandbox(role) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys51-"));
  const boxRoot = path.join(root, "邮箱"), seatsDir = path.join(root, "seats"), workRoot = path.join(root, "体系根");
  for (const r of ["设计师", role, "流水线"]) fs.mkdirSync(path.join(boxRoot, r, "INBOX"), { recursive: true });
  fs.mkdirSync(path.join(boxRoot, "归档"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.mkdirSync(workRoot, { recursive: true });
  fs.writeFileSync(path.join(seatsDir, `${SEAT[role]}.json`), JSON.stringify({ role, on: true, consolePid: 1, agentPid: process.pid }));
  return { root, boxRoot, seatsDir, workRoot };
}
function letter(sb, inboxRole, id, created, from, re) {
  fs.writeFileSync(path.join(sb.boxRoot, inboxRole, "INBOX", `${id}.md`),
    `---\nid: ${id}\nfrom: ${from}\nto: ${inboxRole}\ntype: 通知\nre: ${re}\ncreated: ${created}\nstatus: 未读\npayload: —\nsha: —\n---\n\n测试信\n`, "utf-8");
}
const inboxOf = (sb, role) => path.join(sb.boxRoot, role, "INBOX");
const biteRefs = (sb, role) => fs.readdirSync(inboxOf(sb, role))
  .filter((f) => fs.readFileSync(path.join(inboxOf(sb, role), f), "utf-8").includes("type: 疯狗"))
  .map((f) => (fs.readFileSync(path.join(inboxOf(sb, role), f), "utf-8").match(/ref: (\S+)/) || [])[1]);

// 一次场景：本信（挂箱未办·可超龄）→ 敲铃 → 放狗（席会话静默度可注）→ 返回咬到的 ref 列表
function scenario({ role, ageMin = 40, sessionIdleMin = 30, otherSentMin = null, evidence = false }) {
  __testResetRing();
  const sb = sandbox(role);
  letter(sb, role, "LTR-S51", ago(ageMin), "流水线", "维护通知");
  if (otherSentMin != null) letter(sb, "设计师", "LTR-OTHER", ago(otherSentMin), role, "进展汇报"); // 「他单有动静」：该角色刚发过别的信
  if (evidence) { const d = path.join(sb.workRoot, role, "交付报告"); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, "DELIVERY_x.md"), "x", "utf-8"); }
  ringUnreadSeats({ ledger: { active: [] } },
    { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, onRing: () => "OK" });
  madDog({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, workRoot: sb.workRoot,
    stateFile: path.join(sb.root, "疯狗.json"), binding: { _madDogGraceMin: 25 }, noLog: true, onEscalate: () => {}, onEscalateUser: () => {},
    now: NOW, sessionMtime: () => NOW - sessionIdleMin * 60e3 });
  return biteRefs(sb, role);
}

test("① 他单有动静 + 本信未读 + 席静默 → 必咬（洗白修复·核心案）", () => {
  const refs = scenario({ role: "验收员", ageMin: 40, sessionIdleMin: 30, otherSentMin: 5 });
  assert.deepEqual(refs, ["LTR-S51"], "同一角色 5 分钟前发过别的信，不得洗白本信滞留——席会话静默即咬");
});

test("② 席有动静（会话 1 分钟前活跃）→ 不咬（反向案）", () => {
  const refs = scenario({ role: "验收员", ageMin: 40, sessionIdleMin: 1, otherSentMin: 5 });
  assert.deepEqual(refs, [], "席会话近 1 分钟有写=活着在干活，不咬");
});

test("③ 静默窗分档边界：9 分钟→不咬；11 分钟→咬（默认 10 分钟）", () => {
  assert.deepEqual(scenario({ role: "程序员", ageMin: 40, sessionIdleMin: 9 }), [], "9min < 10min 窗：视作有动静");
  assert.deepEqual(scenario({ role: "程序员", ageMin: 40, sessionIdleMin: 11 }), ["LTR-S51"], "11min > 10min 窗：静默成立");
});

test("④ SYS-30 证据闸保留：席静默 + 超龄 + 证据新文件 → 不咬", () => {
  const refs = scenario({ role: "审验员", ageMin: 70, sessionIdleMin: 30, evidence: true });
  assert.deepEqual(refs, [], "信到后证据目录出新文件=在埋头干活（SYS-30 判据不受本单影响）");
});

test("⑤ 本信已读（销件归档、INBOX 无件）→ 无猎物不咬", () => {
  __testResetRing();
  const sb = sandbox("验收员");
  letter(sb, "设计师", "LTR-KEEP", ago(40), "流水线", "无关件"); // 烟幕：别的信箱有件
  fs.writeFileSync(path.join(sb.boxRoot, "归档", "LTR-S51DONE.md"), // 仿真：本信已读/已销=只在归档（不在任何 INBOX）
    `---\nid: LTR-S51DONE\nfrom: 流水线\nto: 验收员\ntype: 通知\nre: 维护通知\ncreated: ${ago(40)}\nstatus: 未读\npayload: —\nsha: —\n---\n\n已办件\n`, "utf-8");
  ringUnreadSeats({ ledger: { active: [] } },
    { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, onRing: () => "OK" });
  madDog({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, workRoot: sb.workRoot,
    stateFile: path.join(sb.root, "疯狗.json"), binding: { _madDogGraceMin: 25 }, noLog: true, onEscalate: () => {}, onEscalateUser: () => {},
    now: NOW, sessionMtime: () => 0 });
  assert.deepEqual(biteRefs(sb, "验收员"), [], "归档件不是猎物（已办）");
});

test("⑥ 零回归：宽限内（20min < 25min）→ 不咬（冷却/正在办）", () => {
  assert.deepEqual(scenario({ role: "设计师", ageMin: 20, sessionIdleMin: 30 }), [], "宽限内不咬");
});
