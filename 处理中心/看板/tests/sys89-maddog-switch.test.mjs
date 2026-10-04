// SYS-89 疯狗下线（哨兵开关）+ 防自激两闸 · 自测（沙盒为主；真跑面只读探测）
// 验收三案：①开关 false → 真跑 madDog 不出巡（disabled 返回·零咬信/零升级）②签名闸：箱内「疯狗升级」信不咬不升级
// ③（对照）沙盒路径不受开关影响（正常信仍咬）；另：开关读取负例（缺键=不关闭）
// 跑法：node --test 处理中心/看板/tests/sys89-maddog-switch.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { madDog, watchdog, ringUnreadSeats, sentinelOff, __testResetRing, __testResetSpriteBite } from "../engine.mjs";

import { fileURLToPath } from "node:url";
const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEAT = { "设计师": "designer" };
const REAL_BOX = path.join(HERE, "..", "邮局", "邮箱");

// ══ 案① 哨兵开关读取 ══
test("① 哨兵开关：疯狗=false（已下线）；缺键=不关闭（沙盒开关文件·不绑真文件现值）", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mov-s89-sw-"));
  const offFile = path.join(dir, "sw.json");
  fs.writeFileSync(offFile, JSON.stringify({ 疯狗: false }));
  assert.equal(sentinelOff("疯狗", { switchFile: offFile }), true, "疯狗=false 应判为已下线");
  assert.equal(sentinelOff("__不存在哨兵__", { switchFile: offFile }), false, "缺键不得误判为关闭（fail-open=照常出巡）");
  fs.writeFileSync(offFile, JSON.stringify({ 疯狗: true }));
  assert.equal(sentinelOff("疯狗", { switchFile: offFile }), false, "true=照常出巡");
});

test("①′ 真跑面：开关 false → madDog 直接不出巡（disabled 返回 + 零咬信/零升级信）", () => {
  const swDir = fs.mkdtempSync(path.join(os.tmpdir(), "mov-s89-sw2-"));
  const swFile = path.join(swDir, "sw.json");
  fs.writeFileSync(swFile, JSON.stringify({ 疯狗: false }));
  const before = new Map();
  for (const d of fs.readdirSync(REAL_BOX)) {
    const inbox = path.join(REAL_BOX, d, "INBOX");
    before.set(d, fs.existsSync(inbox) ? fs.readdirSync(inbox).length : 0);
  }
  const r = madDog({ noLog: true, switchFile: swFile }); // 真跑面（不带 boxRoot 沙盒）→ 命中开关闸（沙盒开关文件）
  assert.equal(r && r.disabled, true, "开关 false 时 madDog 应返回 disabled:true");
  for (const d of fs.readdirSync(REAL_BOX)) {
    const inbox = path.join(REAL_BOX, d, "INBOX");
    const after = fs.existsSync(inbox) ? fs.readdirSync(inbox).length : 0;
    assert.equal(after, before.get(d), `真信箱 ${d} 不应有新增信（下线不出巡）`);
  }
});

// ── 沙盒脚手架（同 sys30 先例）──
function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys89-"));
  const boxRoot = path.join(root, "邮箱");
  const seatsDir = path.join(root, "seats");
  const workRoot = path.join(root, "体系根");
  fs.mkdirSync(path.join(boxRoot, "设计师", "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.mkdirSync(workRoot, { recursive: true });
  fs.writeFileSync(path.join(seatsDir, "designer.json"),
    JSON.stringify({ role: "设计师", on: true, consolePid: 1, agentPid: process.pid }));
  return { root, boxRoot, seatsDir, workRoot };
}
const ago = (min) => new Date(Date.now() - min * 60e3).toLocaleString("sv-SE");
function letter(sb, id, re, type = "通知") {
  fs.writeFileSync(path.join(sb.boxRoot, "设计师", "INBOX", `${id}.md`),
    `---\nid: ${id}\nfrom: 流水线\nto: 设计师\ntype: ${type}\nre: ${re}\ncreated: ${ago(60)}\nstatus: 未读\npayload: —\nsha: —\n---\n\n测试信\n`, "utf-8");
}
const inboxOf = (sb) => path.join(sb.boxRoot, "设计师", "INBOX");
const filesOf = (sb) => new Set(fs.readdirSync(inboxOf(sb)));
// 新增的咬信：仅统计 madDog 之后新出现、且信封 type=疯狗 的文件（�ing 入信本身不算）
const newDogLetters = (sb, before) => fs.readdirSync(inboxOf(sb))
  .filter(f => !before.has(f))
  .filter(f => { const fm = (fs.readFileSync(path.join(inboxOf(sb), f), "utf-8").split("---")[1] || ""); return /type:\s*疯狗/.test(fm); });

function scenario(re, type) {
  __testResetRing();
  const sb = sandbox();
  letter(sb, "LTR-S89", re, type);
  ringUnreadSeats({ ledger: { active: [] } },
    { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, onRing: () => "OK" });
  const before = filesOf(sb);
  const escalated = [];
  madDog({
    boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, workRoot: sb.workRoot,
    stateFile: path.join(sb.root, "疯狗.json"), binding: {}, noLog: true,
    onEscalate: (h) => escalated.push(h), onEscalateUser: (h) => escalated.push(h),
    sessionMtime: () => 0,
  });
  return { bites: newDogLetters(sb, before), escalated };
}

// ══ 案② 签名闸：狗自家产物不当猎物（自激环根因）══
test("② 箱内「疯狗升级」信 → 不咬不升级（签名闸）", () => {
  const r = scenario("疯狗升级：审验员 被咬后仍不动");
  assert.equal(r.bites.length, 0, "疯狗升级信不得被抓去咬（否则 咬→升级→新裁决信→再咬 指数放大）");
  assert.equal(r.escalated.length, 0, "也不得再升级");
});
test("②′ 箱内「疯狗二轮升级（报用户）」信 → 不咬不升级", () => {
  const r = scenario("疯狗二轮升级（报用户）：程序员 被咬+升级后仍不动");
  assert.equal(r.bites.length, 0);
  assert.equal(r.escalated.length, 0);
});
test("②″ 箱内「疯狗咬：X」信 → 不咬（type=疯狗 与签名双保险）", () => {
  const r = scenario("疯狗咬：UPG-293 重投 R2（冻结版）", "疯狗");
  assert.equal(r.bites.length, 0);
});

// ══ 案④（巡检台回检补丁）：狗下线时「停滞欠账线」不得投假咬信 ══
test("④ 狗下线 → 欠账线不投「疯狗哨兵停滞」假咬（真 疯狗.json 已停滞）", () => {
  __testResetRing(); __testResetSpriteBite();
  const sb = sandbox();
  fs.mkdirSync(path.join(sb.boxRoot, "巡检台", "INBOX"), { recursive: true });
  // SYS-143 追加：补齐沙盒参数——watchFile/dogFile/scoresFile 不传会**直写真件**（巡检台 19:57 实锤：逐套单跑唯此件改真件 md5）
  watchdog({}, { force: true, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile: path.join(sb.root, "看门狗.json"),
    dogFile: path.join(sb.root, "疯狗.json"), scoresFile: path.join(sb.root, "成绩.json"), noLog: true, onAlarm: () => {}, sessionMtime: () => 0,
    boardStartedAt: Date.now() - 3600e3, bootAt: Date.now() - 3600e3 }); // SYS-143：显式窗外态（启动宽限不参与本锚）
  const inbox = path.join(sb.boxRoot, "巡检台", "INBOX");
  const bites = fs.existsSync(inbox)
    ? fs.readdirSync(inbox).filter(f => fs.readFileSync(path.join(inbox, f), "utf-8").includes("疯狗哨兵停滞"))
    : [];
  assert.equal(bites.length, 0, "开关 false 时狗「停滞」是预期态，欠账线不得投假咬信");
});

// ══ 案③ 对照：沙盒正常信仍咬（开关只作用真跑面）══
test("③ 沙盒正常信（超宽限+铃敲+零动静）→ 咬（开关不泄漏进测试桩）", () => {
  const r = scenario("维护通知");
  assert.equal(r.bites.length, 1, "正常信必须照咬——否则②的鉴别力不成立");
});
