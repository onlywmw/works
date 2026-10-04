// SYS-30 疯狗宽限角色差异化 + 动静判据增强 · 自测（沙盒，零碰真实配置）
// 验收三案（派单§三）：①审验员 30min 无信+证据新文件→不咬 ②设计师 30min 零动静→咬 ③配置缺失→默认 25
// 另加：证据判据/宽限档 的分离对照 + 证据目录范围收敛 + 配置热读
// 跑法：node --test 处理中心/看板/tests/sys30-maddog.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { madDog, ringUnreadSeats, __testResetRing } from "../engine.mjs";

const SEAT = { "设计师": "designer", "审验员": "reviewer" };

function sandbox(role) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys30-"));
  const boxRoot = path.join(root, "邮箱");
  const seatsDir = path.join(root, "seats");
  const workRoot = path.join(root, "体系根");
  fs.mkdirSync(path.join(boxRoot, role, "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.mkdirSync(workRoot, { recursive: true });
  fs.writeFileSync(path.join(seatsDir, `${SEAT[role]}.json`),
    JSON.stringify({ role, on: true, consolePid: 1, agentPid: process.pid }));
  return { root, boxRoot, seatsDir, workRoot };
}
const ago = (min) => new Date(Date.now() - min * 60e3).toLocaleString("sv-SE");
function letter(sb, role, id, created) {
  // from=流水线（非角色本人）→ 不动摇 lastSent[role]，保证「零动静」可判
  fs.writeFileSync(path.join(sb.boxRoot, role, "INBOX", `${id}.md`),
    `---\nid: ${id}\nfrom: 流水线\nto: ${role}\ntype: 通知\nre: 维护通知\ncreated: ${created}\nstatus: 未读\npayload: —\nsha: —\n---\n\n测试信\n`, "utf-8");
}
const inboxOf = (sb, role) => path.join(sb.boxRoot, role, "INBOX");
const bitten = (sb, role) => fs.readdirSync(inboxOf(sb, role))
  .some(f => fs.readFileSync(path.join(inboxOf(sb, role), f), "utf-8").includes("type: 疯狗"));

// 一次完整场景：投信→敲铃→（可选）造证据文件→放狗；返回是否被咬
// evidSub = 证据文件落哪个子目录（默认「交付报告」=派单二.2 正典目录）
function scenario({ role, ageMin, binding, evidence = false, evidSub = "交付报告" }) {
  __testResetRing();
  const sb = sandbox(role);
  letter(sb, role, "LTR-S30", ago(ageMin));
  // 敲铃（madDog 只对「铃已敲」的信动手）
  ringUnreadSeats({ ledger: { active: [] } },
    { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, onRing: () => "OK" });
  if (evidence) { // 信到后角色证据目录出新文件（mtime=now > 信 created）
    const d = path.join(sb.workRoot, role, evidSub);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, "DELIVERY_x.md"), "x", "utf-8");
  }
  madDog({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, workRoot: sb.workRoot,
    stateFile: path.join(sb.root, "疯狗.json"), binding, noLog: true, onEscalate: () => {}, onEscalateUser: () => {}, sessionMtime: () => 0 }); // sessionMtime=0：沙盒席静默（SYS-51 探针注缝，防真实席位会话污染）
  return bitten(sb, role);
}
const REAL = { _madDogGraceMin: { "审验员": 60, "程序员": 60 } }; // 与工位绑定.json 同行（设计师不在列→默认 25）

// ══ 案① 长工序角色 30min 无信不咬（字面验收 + 两机制分离对照）══
test("① 审验员 30min 无信 + 证据目录新文件 → 不咬（派单§三字面案）", () => {
  assert.equal(scenario({ role: "审验员", ageMin: 30, binding: REAL, evidence: true }), false,
    "长工序角色 30min 属正常工时，且证据目录有新文件=在干活");
});
test("①′ 审验员 30min 零证据 → 仍不咬（宽限档单独锁：30min 的不咬非证据之功）", () => {
  assert.equal(scenario({ role: "审验员", ageMin: 30, binding: REAL, evidence: false }), false,
    "per-role 宽限 60 生效：30 < 60，旧全局 25 会误咬");
});
test("①″ 审验员超宽限(70min) 但有证据新文件 → 不咬（证据判据单独锁）", () => {
  assert.equal(scenario({ role: "审验员", ageMin: 70, binding: REAL, evidence: true }), false,
    "信到后证据目录出新文件=在埋头干活，虽超宽限也不咬");
});
test("①‴ 对照：审验员超宽限(70min) 且零动静零证据 → 咬（证①″是证据救的，非别因）", () => {
  assert.equal(scenario({ role: "审验员", ageMin: 70, binding: REAL, evidence: false }), true,
    "真超龄+真零动静必须咬——否则①″无鉴别力");
});

// ══ 案② 短工序角色 30min 零动静 → 咬 ══
test("② 设计师 30min 零动静零证据 → 咬（默认宽限 25 生效）", () => {
  assert.equal(scenario({ role: "设计师", ageMin: 30, binding: REAL }), true,
    "短工序角色超默认宽限且零动静 → 咬");
});
test("②′ 对照：设计师 20min → 不咬（宽限内）", () => {
  assert.equal(scenario({ role: "设计师", ageMin: 20, binding: REAL }), false, "宽限内不咬（冷却/正在办）");
});

// ══ 案③ 配置缺失 → 回落默认 25（双点定界，证回落值恰为 25）══
test("③ 配置无 _madDogGraceMin → 默认 25：24min 不咬 / 26min 咬", () => {
  assert.equal(scenario({ role: "设计师", ageMin: 24, binding: {} }), false, "24 < 25：不咬");
  assert.equal(scenario({ role: "设计师", ageMin: 26, binding: {} }), true, "26 > 25：咬（证默认恰为 25，非旧 20/新 60）");
});

// ══ 案④ 证据目录范围收敛：正典目录算动静，无关子目录不算（防躲狗）══
test("④ 证据判据只认派单二.2 目录：交付报告/证据数据/证据* 算，无关子目录不算", () => {
  assert.equal(scenario({ role: "设计师", ageMin: 30, binding: REAL, evidence: true, evidSub: "交付报告" }), false, "交付报告/ = 正典证据目录");
  assert.equal(scenario({ role: "设计师", ageMin: 30, binding: REAL, evidence: true, evidSub: "证据数据" }), false, "证据数据/ = 正典证据目录");
  assert.equal(scenario({ role: "设计师", ageMin: 30, binding: REAL, evidence: true, evidSub: "UPG999-evidence" }), false, "名含 evidence 的目录 = 正典证据目录");
  assert.equal(scenario({ role: "设计师", ageMin: 30, binding: REAL, evidence: true, evidSub: "随手放的" }), true, "无关子目录不算动静（否则躲狗太易）");
});

// ══ 案⑤ 配置热读：每轮重新解析（readBinding 无缓存常量，madDog 每轮重取）══
test("⑤ 配置热读：同一进程内改配置，下一轮 madDog 立即生效（无缓存）", () => {
  assert.equal(scenario({ role: "设计师", ageMin: 30, binding: { _madDogGraceMin: { "设计师": 60 } } }), false,
    "首轮宽限 60：30min 不咬");
  assert.equal(scenario({ role: "设计师", ageMin: 30, binding: { _madDogGraceMin: { "设计师": 25 } } }), true,
    "次轮宽限 25：30min 咬——配置每轮重读");
});

// ══ SYS-51 守卫锁（设计师 19:50 两补②）：无锁守卫各补断言级——去守卫必红 ══
function sandboxFor(roleKey, role, agentPid) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-s51-"));
  const boxRoot = path.join(root, "邮箱");
  const seatsDir = path.join(root, "seats");
  const workRoot = path.join(root, "体系根");
  fs.mkdirSync(path.join(boxRoot, role, "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.mkdirSync(workRoot, { recursive: true });
  fs.writeFileSync(path.join(seatsDir, `${roleKey}.json`),
    JSON.stringify({ role, on: true, consolePid: 1, agentPid }));
  return { root, boxRoot, seatsDir, workRoot };
}

test("SYS-62 守卫锁（翻转）：巡检台（主人）超龄信+静默 → 必咬——恢复 role===巡检台 豁免→必红（M1）", () => {
  __testResetRing();
  const sb = sandboxFor("hygiene", "巡检台", process.pid);
  letter(sb, "巡检台", "LTR-S51-OWNER", ago(90));
  ringUnreadSeats({ ledger: { active: [] } },
    { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, onRing: () => "OK" });
  madDog({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, workRoot: sb.workRoot,
    stateFile: path.join(sb.root, "疯狗.json"), binding: REAL, noLog: true, onEscalate: () => {}, onEscalateUser: () => {}, sessionMtime: () => 0 });
  assert.equal(bitten(sb, "巡检台"), true, "SYS-62 起疯狗管主人：超龄+静默必咬（恢复豁免守卫=M1 变异必红）");
});

test("SYS-51 守卫锁：灯尸（agentPid 已死）超龄信不咬——去灯尸守卫→必红", async () => {
  __testResetRing();
  // 用短命子进程占真实 pid：敲铃时活（铃记落该代际键），放狗前杀 → 同代际键仍是「已敲」，
  // 这样「去灯尸守卫」后其余条件全部满足 → 必咬 → 本断言必红（承重锁）。
  const child = spawn(process.execPath, ["-e", "setTimeout(()=>{}, 60000)"], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 300));
  const sb = sandboxFor("reviewer", "审验员", child.pid);
  letter(sb, "审验员", "LTR-S51-CORPSE", ago(90));
  ringUnreadSeats({ ledger: { active: [] } },
    { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, onRing: () => "OK" });
  child.kill();
  await new Promise((r) => setTimeout(r, 400));
  madDog({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, workRoot: sb.workRoot,
    stateFile: path.join(sb.root, "疯狗.json"), binding: REAL, noLog: true, onEscalate: () => {}, onEscalateUser: () => {}, sessionMtime: () => 0 });
  assert.equal(bitten(sb, "审验员"), false, "灯尸归看门狗——疯狗不该咬；去灯尸守卫此案必红");
});
