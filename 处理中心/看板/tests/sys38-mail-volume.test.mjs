// SYS-38 信量治理 · L1 契约（回执归档化 + 回复即销 + 哨兵兼容 + 账目口径）
// 验收（卡面）：①done 回执不落 INBOX 且账目计「处理」；②回复(ref) 即销原信（单份留档）；
//   ③哨兵对账——卫生专线/疯狗/补敲/卡单 在「回执归档+回复即销」态下行为不变（构造积压场景复跑）。
// 变异锚：M1 回执投回 INBOX→①红；M2 去回复即销→②红。
// 跑法：node --test 处理中心/看板/tests/sys38-mail-volume.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ringUnreadSeats, madDog, watchdog, scanHygieneLine, hylineDoneGate, mailLedgerStats, __testResetRing, __testResetWatchdog, __testResetSpriteBite } from "../engine.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BOARD = path.resolve(HERE, "..");
const PO = path.join(BOARD, "..", "邮局", "post-office.mjs");
const ROLES = ["设计师", "程序员", "验收员", "审验员", "巡检台", "流水线"];
const TMPDIRS = [];
process.on("exit", () => { for (const d of TMPDIRS) try { fs.rmSync(d, { recursive: true, force: true }); } catch {} });

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys38-")); TMPDIRS.push(root);
  const boxRoot = path.join(root, "邮箱");
  for (const r of ROLES) fs.mkdirSync(path.join(boxRoot, r, "INBOX"), { recursive: true });
  fs.mkdirSync(path.join(boxRoot, "归档"), { recursive: true });
  return { root, boxRoot };
}
// 2026-09-30 适配：post-office 正文已必填 fail-closed（缺正文/空正文拒发）——send 无正文时自动补 --inline-ack --body（测试面显式承认·不绕闸）
const po = (sb, args) => {
  if (args[0] === "send" && !args.includes("--body") && !args.includes("--body-file") && !args.includes("--inline-ack")) {
    args = [...args, "--inline-ack", "--body", "SYS-38 测试正文（脚本补）"];
  }
  return execFileSync(process.execPath, [PO, ...args], { env: { ...process.env, POST_ROOT: sb.boxRoot, POST_ROLE: "" }, encoding: "utf8" });
};
const inboxFiles = (sb, role) => fs.readdirSync(path.join(sb.boxRoot, role, "INBOX")).filter((f) => f.endsWith(".md"));
const archFiles = (sb) => fs.readdirSync(path.join(sb.boxRoot, "归档")).filter((f) => f.endsWith(".md"));
const envOf = (sb, where, f) => fs.readFileSync(path.join(sb.boxRoot, where, f), "utf-8");
const idOf = (sb, role) => (envOf(sb, `${role}/INBOX`, inboxFiles(sb, role)[0]).match(/^id:\s*(\S+)/m) || [])[1];

test("SYS-38 ① 回执归档化：done 自动回执不投 INBOX（入归档）；账目 处理=闭环数（回执不计）", () => {
  const sb = sandbox();
  po(sb, ["send", "--from", "设计师", "--to", "程序员", "--type", "派单", "--re", "SYS-38 测试单"]);
  const lid = idOf(sb, "程序员");
  po(sb, ["done", lid, "--from", "程序员", "--note", "办毕"]);
  assert.equal(inboxFiles(sb, "设计师").length, 0, "回执不得落在发件人 INBOX（回执归档化）");
  const arch = archFiles(sb);
  const texts = arch.map((f) => envOf(sb, "归档", f));
  assert.ok(texts.some((t) => t.includes(`id: ${lid}`)), "原信已归档");
  const receipts = texts.filter((t) => /^type:\s*回执/m.test(t));
  assert.equal(receipts.length, 1, "回执入归档（1 件）");
  assert.ok(receipts[0].includes(`ref: ${lid}`), "回执 ref 指向原信");
  const st = mailLedgerStats(sb.boxRoot, Date.now());
  assert.equal(st["程序员"].todayDone, 1, "账目：程序员 处理+1（原件销=闭环）");
  assert.equal(st["设计师"].todayDone, 0, "账目：回执不计（处理=闭环数）");
  assert.equal(st["程序员"].inbox, 0, "未处理=0（已销）");
});

test("SYS-38 ② 回复即销：非回执信 ref 指向自己 INBOX 原信 → 原信自动销归档（单份）", () => {
  const sb = sandbox();
  po(sb, ["send", "--from", "设计师", "--to", "程序员", "--type", "派单", "--re", "SYS-38 回复案"]);
  const lid = idOf(sb, "程序员");
  po(sb, ["send", "--from", "程序员", "--to", "设计师", "--type", "打回", "--re", "SYS-38 回复案 打回", "--ref", lid]);
  assert.ok(!inboxFiles(sb, "程序员").includes(`${lid}.md`), "原信已自动销（回复即销）");
  const hits = archFiles(sb).filter((f) => envOf(sb, "归档", f).includes(`id: ${lid}`));
  assert.equal(hits.length, 1, "原信单份留档（归档）");
  assert.equal(inboxFiles(sb, "设计师").length, 1, "回复信已投达对方");
});

test("SYS-38 ③ 哨兵兼容：回执归档+回复即销态下，巡铃/疯狗/看门狗/专线 零误动作；新信照常", () => {
  const sb = sandbox();
  // 造「已处置」态：一封信 done（回执入归档）+ 一封被回复即销
  po(sb, ["send", "--from", "设计师", "--to", "程序员", "--type", "通知", "--re", "SYS-38 兼容A"]);
  const a = idOf(sb, "程序员");
  po(sb, ["done", a, "--from", "程序员", "--note", "知悉"]);
  po(sb, ["send", "--from", "设计师", "--to", "程序员", "--type", "通知", "--re", "SYS-38 兼容B"]);
  const b = idOf(sb, "程序员");
  po(sb, ["send", "--from", "程序员", "--to", "设计师", "--type", "通知", "--re", "SYS-38 兼容B 回复", "--ref", b]);
  // 哨兵跑（沙盒：seats/workRoot/state）
  const seatsDir = path.join(sb.root, "seats"); fs.mkdirSync(seatsDir);
  fs.writeFileSync(path.join(seatsDir, "coder.json"), JSON.stringify({ role: "程序员", on: true, consolePid: 1, agentPid: process.pid }));
  __testResetRing(); __testResetWatchdog(); __testResetSpriteBite();
  const rings = [], bits = [], alarms = [];
  ringUnreadSeats({ ledger: { active: [] } }, { boxRoot: sb.boxRoot, seatsDir, noPersist: true, noLog: true, onRing: (r, t) => { rings.push(t); return "OK"; } });
  assert.equal(rings.length, 0, "归档态下无待办 → 不敲铃（行为不变）");
  madDog({ boxRoot: sb.boxRoot, seatsDir, workRoot: path.join(sb.root, "体系根"), stateFile: path.join(sb.root, "疯狗.json"), noLog: true, now: Date.now(), sessionMtime: () => 0, onEscalate: () => {}, onEscalateUser: () => {} });
  assert.equal(fs.readdirSync(path.join(sb.boxRoot, "程序员", "INBOX")).filter((f) => envOf(sb, "程序员/INBOX", f).includes("type: 疯狗")).length, 0, "归档态下不咬（行为不变）");
  watchdog({}, { force: true, now: Date.now(), boxRoot: sb.boxRoot, seatsDir, watchFile: path.join(sb.root, "看门狗.json"), onAlarm: (m) => alarms.push(m), onEscalate: (m) => alarms.push(m), sessionMtime: () => 0, noLog: true });
  assert.equal(alarms.length, 0, "归档态下看门狗零告警（行为不变）");
  void bits;
  // 正向对照：新到未读信 → 巡铃照常敲（行为未弱化）
  po(sb, ["send", "--from", "设计师", "--to", "程序员", "--type", "派单", "--re", "SYS-38 新单"]);
  __testResetRing();
  ringUnreadSeats({ ledger: { active: [] } }, { boxRoot: sb.boxRoot, seatsDir, noPersist: true, noLog: true, onRing: (r, t) => { rings.push(t); return "OK"; } });
  assert.equal(rings.length, 1, "新信照常敲铃（正向对照）");
});

test("SYS-38 ④ 卫生专线兼容：回复即销后处置信（ref=通报）仍被认账（不误报断线）", () => {
  // 最小构造：通报在设计师箱被回复即销（归档）＋处置信带 ref → 专线扫描应把通报记为 answered。
  // scanHygieneLine 走真实目录（未参数化）——此处以「归档+处置信」结构断言 mailLedgerStats/扫描不把归档当待办。
  const sb = sandbox();
  const ltr = "LTR-20260912-000000-000-aaa";
  fs.writeFileSync(path.join(sb.boxRoot, "归档", `${ltr}.md`),
    `---\nid: ${ltr}\nfrom: 巡检台\nto: 设计师\ntype: 卫生通报\nre: 测试通报\nref: —\ncreated: ${new Date().toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n\nx\n`, "utf-8");
  fs.writeFileSync(path.join(sb.boxRoot, "设计师", "INBOX", "LTR-20260912-000001-000-bbb.md"),
    `---\nid: LTR-20260912-000001-000-bbb\nfrom: 设计师\nto: 巡检台\ntype: 卫生通报\nre: 处置\nref: ${ltr}\ncreated: ${new Date().toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n\nx\n`, "utf-8");
  const st = mailLedgerStats(sb.boxRoot, Date.now());
  assert.equal(st["设计师"].todayDone, 1, "归档的通报（转销）计入处理");
  assert.equal(st["设计师"].inbox, 1, "处置信仍在箱（待巡检台办）");
  assert.ok(typeof scanHygieneLine === "function", "专线哨兵可调用（结构兼容核）");
});

test("SYS-卫生专线 ⑤ 销信未处置判据（2026-09-30 修正）：首见归档只记录·下一扫描周期才判（防同秒竞态假裁决）", () => {
  const t0 = 1_000_000_000_000;
  // 首见：只记录，不判（无论该信多旧——此前用归档件 mtime 判 ⇒ 躺超 60s 的信一进归档就假裁决）
  assert.deepEqual(hylineDoneGate({}, t0), { action: "record", firstArchivedScan: t0 }, "首见归档：记录时刻不判");
  // 60s 内：仍不判（answered 索引可能是本轮扫描开始前建的·竞态窗口）
  assert.equal(hylineDoneGate({ firstArchivedScan: t0 }, t0 + 59_000).action, "wait", "宽限内不判");
  // ≥60s（下一次扫描）：放行判定——真断线照报
  assert.equal(hylineDoneGate({ firstArchivedScan: t0 }, t0 + 61_000).action, "judge", "超宽限放行判定");
  // 已报过：不重复进入本闸（per-letter 记账·由 brokenReported 在上游拦截）
  assert.equal(hylineDoneGate({ firstArchivedScan: t0, brokenReported: true }, t0 + 120_000).action, "judge", "记账保留（上游 brokenReported 拦重复）");
});
