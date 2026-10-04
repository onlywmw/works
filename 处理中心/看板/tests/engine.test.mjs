// 巡铃回归测试（三层加固·三层 @2026-09-10）——每个用例对应一起真实事故：
//   ① 回执不响（九连空案）② 混合批次不连坐（UPG-129 停摆案）③ 票到站补响 ④ 代际换代重敲（旧信激活案）⑤ 冷却合并
// 跑法：node --test 处理中心/看板/tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { ringUnreadSeats, madDog, checkInboxForCompletion, applyAdvance, handoffToMerge, __testResetRing, pollSeats, pollSeatsLight, __testResetSeats, rootSentry, readSetLiteral } from "../engine.mjs";

const SYS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", ".."); // 安卓中国体系建设（工单库/白名单权威源码所在）

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-ring-test-"));
  const boxRoot = path.join(root, "邮箱");
  const seatsDir = path.join(root, "seats");
  fs.mkdirSync(path.join(boxRoot, "程序员", "INBOX"), { recursive: true });
  fs.mkdirSync(path.join(boxRoot, "设计师", "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  for (const [role, key] of [["程序员", "coder"], ["设计师", "designer"]])
    fs.writeFileSync(path.join(seatsDir, `${key}.json`), JSON.stringify({ role, on: true, consolePid: 1, agentPid: process.pid }));
  return { root, boxRoot, seatsDir };
}
function letter(boxRoot, role, id, { type = "派单", re = "", created } = {}) {
  fs.writeFileSync(path.join(boxRoot, role, "INBOX", `${id}.md`),
    `---\nid: ${id}\nfrom: 设计师\nto: ${role}\ntype: ${type}\nre: ${re}\ncreated: ${created || new Date().toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n\n测试信\n`, "utf-8");
}
const opts = (sb, rings) => ({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, sessionMtime: () => Date.now(), onRing: () => { rings.push(1); return "OK"; } }); // SYS-56：席活跃注缝——既有用例不触发补敲分支（专测见 sys56-ring-backfill.test.mjs）

test("① 回执永不敲铃（九连空案）", () => {
  __testResetRing();
  const sb = sandbox(); const rings = [];
  letter(sb.boxRoot, "程序员", "LTR-T1", { type: "回执", re: "[回执] UPG-1 交付" });
  ringUnreadSeats({ ledger: { active: [] } }, opts(sb, rings));
  assert.equal(rings.length, 0, "回执不得触发敲铃");
});

test("② 混合批次不连坐：可敲的敲、相位不符的不标记（UPG-129 停摆案）", () => {
  __testResetRing();
  const sb = sandbox(); const rings = [];
  // UPG-A 票已在程序员（dispatched），UPG-B 票还在设计师（registered）
  const D = { ledger: { active: [{ id: "UPG-A", phase: "dispatched" }, { id: "UPG-B", phase: "registered" }] } };
  letter(sb.boxRoot, "程序员", "LTR-TA", { re: "UPG-A 甲单" });
  letter(sb.boxRoot, "程序员", "LTR-TB", { re: "UPG-B 乙单" });
  ringUnreadSeats(D, opts(sb, rings));
  assert.equal(rings.length, 1, "只敲一次（合并）");
  // B 不得被标记——把 B 的票转到程序员后再扫，B 必须补响
  __testResetRing(); // 模拟换代/重启前先确认 B 未被误标：直接看第二轮行为
  const rings2 = [];
  const D2 = { ledger: { active: [{ id: "UPG-A", phase: "dispatched" }, { id: "UPG-B", phase: "dispatched" }] } };
  ringUnreadSeats(D2, opts(sb, rings2));
  assert.equal(rings2.length, 1, "UPG-B 票到站后必须补响（没被连坐标记）");
});

test("③ 无单号信按信面站敲", () => {
  __testResetRing();
  const sb = sandbox(); const rings = [];
  letter(sb.boxRoot, "设计师", "LTR-TC", { type: "通知", re: "系统维护通知" });
  ringUnreadSeats({ ledger: { active: [] } }, opts(sb, rings));
  assert.equal(rings.length, 1);
});

test("④ 同代际不重敲，换代（agentPid 变）重敲（旧信激活案）", () => {
  __testResetRing();
  const sb = sandbox(); const rings = [];
  letter(sb.boxRoot, "程序员", "LTR-TD", { re: "UPG-D 测试单" });
  const D = { ledger: { active: [{ id: "UPG-D", phase: "dispatched" }] } };
  ringUnreadSeats(D, opts(sb, rings));
  ringUnreadSeats(D, opts(sb, rings));
  assert.equal(rings.length, 1, "同代际只敲一次");
  // 换代：seat 的 agentPid 换掉（第二代绕过冷却直验代际语义——冷却合并已在⑤单测）
  const f = path.join(sb.seatsDir, "coder.json");
  fs.writeFileSync(f, JSON.stringify({ ...JSON.parse(fs.readFileSync(f, "utf-8")), agentPid: process.ppid || 1 }));
  ringUnreadSeats(D, { ...opts(sb, rings), noCooldown: true });
  assert.equal(rings.length, 2, "换代后旧信重新激活");
});

test("⑤ 冷却合并：90 秒内第二封不敲（洪峰合并案）", () => {
  __testResetRing();
  const sb = sandbox(); const rings = [];
  const D = { ledger: { active: [{ id: "UPG-E", phase: "dispatched" }, { id: "UPG-F", phase: "dispatched" }] } };
  letter(sb.boxRoot, "程序员", "LTR-TE", { re: "UPG-E 第一单" });
  ringUnreadSeats(D, opts(sb, rings));
  assert.equal(rings.length, 1);
  letter(sb.boxRoot, "程序员", "LTR-TF", { re: "UPG-F 第二单" });
  ringUnreadSeats(D, opts(sb, rings));
  assert.equal(rings.length, 1, "冷却期内第二封攒着不敲");
});

test("⑥ 疯狗：信躺超龄+没动静→咬；不重复咬；咬过仍不动→升级；有动静/未敲铃不咬", () => {
  __testResetRing();
  const sb = sandbox(); const rings = [];
  const stateFile = path.join(sb.root, "疯狗.json");
  const inboxDir = path.join(sb.boxRoot, "程序员", "INBOX");
  const biteLetters = () => fs.readdirSync(inboxDir).filter(f => fs.readFileSync(path.join(inboxDir, f), "utf-8").includes("type: 疯狗"));
  const old = new Date(Date.now() - 60 * 60e3).toLocaleString("sv-SE"); // 信龄 1 小时
  letter(sb.boxRoot, "程序员", "T-合成信", { re: "T-合成单 老单", created: old });
  const escalations = [];
  const mopts = { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, stateFile, workRoot: path.join(sb.root, "体系根"), noLog: true, graceMs: 20 * 60e3, onEscalate: (h) => escalations.push(h), onEscalateUser: (h) => escalations.push(h), sessionMtime: () => 0 }; // SYS-62：二级升级出口缝（禁真 sendDutyLetter——ald/xm0 泄漏案） // workRoot 沙盒（SYS-30 证据判据）；sessionMtime=0 沙盒静默（SYS-51 席静默探针注缝）

  madDog(mopts); // 铃未敲 → 不咬（归巡铃/看门狗）
  assert.equal(biteLetters().length, 0, "铃未敲的信疯狗不管");

  const D = { ledger: { active: [{ id: "T-合成单", phase: "dispatched" }] } };
  ringUnreadSeats(D, opts(sb, rings)); // 铃敲过
  assert.equal(rings.length, 1);
  madDog(mopts); // 第一巡：咬
  assert.equal(biteLetters().length, 1, "超龄+已敲+没动静 → 必须咬");
  const biteRaw = fs.readFileSync(path.join(inboxDir, biteLetters()[0]), "utf-8");
  assert.ok(biteRaw.includes("ref: T-合成信"), "咬信必须 ref 原信");
  assert.ok(biteRaw.includes("from: 巡检台"), "咬信挂在巡检台名下");

  madDog(mopts); // 紧接着第二巡：不重复咬
  assert.equal(biteLetters().length, 1, "同一封信只咬一次");

  madDog({ ...mopts, now: Date.now() + 21 * 60e3 }); // 咬过一轮宽限仍不动 → 升级设计师
  assert.equal(escalations.length, 1, "咬过仍不动必须升级");
  assert.ok(escalations[0].includes("程序员"));

  // SYS-51 按信判据（席会话静默才咬；他单发信不洗白本信滞留）
  // 向①：他单刚发过信，但本信仍旧未读 + 席会话静默 → 必咬（旧粗条件「信到后发过信」会洗白）
  letter(sb.boxRoot, "程序员", "LTR-TH", { re: "UPG-H 又一单", created: old });
  fs.writeFileSync(path.join(sb.boxRoot, "设计师", "INBOX", "LTR-OUT1.md"),
    `---\nid: LTR-OUT1\nfrom: 程序员\nto: 设计师\ntype: 通知\nre: 进展汇报\ncreated: ${new Date().toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n\n有动静\n`, "utf-8");
  ringUnreadSeats({ ledger: { active: [{ id: "UPG-H", phase: "dispatched" }] } }, { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true, onRing: () => "OK" });
  madDog({ ...mopts, now: Date.now() + 42 * 60e3 });
  assert.ok(biteLetters().some(f => fs.readFileSync(path.join(inboxDir, f), "utf-8").includes("ref: LTR-TH")), "SYS-51：他单发信不洗白——本信未读+席静默必咬");
  // 向②：席会话近 1 分钟有写 → 有动静不咬
  letter(sb.boxRoot, "程序员", "LTR-TI", { re: "UPG-I 第三单", created: old });
  ringUnreadSeats({ ledger: { active: [{ id: "UPG-I", phase: "dispatched" }] } }, { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true, onRing: () => "OK" });
  madDog({ ...mopts, now: Date.now() + 63 * 60e3, sessionMtime: () => Date.now() + 63 * 60e3 - 60e3 });
  assert.ok(!biteLetters().some(f => fs.readFileSync(path.join(inboxDir, f), "utf-8").includes("ref: LTR-TI")), "SYS-51：席会话有动静（近 1min）→ 不咬");
});

test("⑦ 挂起豁免：挂起单的信疯狗不咬（挂起制 @2026-09-10）", () => {
  __testResetRing();
  const sb = sandbox(); const rings = [];
  const stateFile = path.join(sb.root, "疯狗.json");
  const parkFile = path.join(sb.root, "挂起.json");
  fs.writeFileSync(parkFile, JSON.stringify({ "UPG-P": { reason: "金库 key 全失效", until: "用户提供有效 key", by: "程序员", since: "2026-09-10 13:00:00" } }), "utf-8");
  const old = new Date(Date.now() - 60 * 60e3).toLocaleString("sv-SE");
  letter(sb.boxRoot, "程序员", "LTR-TP", { re: "UPG-P 缺料单", created: old });
  const D = { ledger: { active: [{ id: "UPG-P", phase: "dispatched" }] } };
  ringUnreadSeats(D, opts(sb, rings)); // 铃敲过——照理该咬，但单挂了
  assert.equal(rings.length, 1);
  madDog({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, stateFile, parkFile, workRoot: path.join(sb.root, "体系根"), noLog: true, graceMs: 20 * 60e3, onEscalate: () => { throw new Error("挂起单不该升级"); } });
  const inboxDir = path.join(sb.boxRoot, "程序员", "INBOX");
  assert.ok(!fs.readdirSync(inboxDir).some(f => fs.readFileSync(path.join(inboxDir, f), "utf-8").includes("type: 疯狗")), "挂起单的信不许咬——等的是外部条件不是偷懒");
});

// ⑧⑨ = 审查②③的回归锁（2026-09-10 审查修复配套）
test("⑧ 完工信按工序名匹配：上一工序的迟到信不串台（审查③）", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-complete-test-"));
  const inboxDir = path.join(root, "INBOX"), archiveDir = path.join(root, "归档");
  fs.mkdirSync(inboxDir, { recursive: true });
  const envl = (re) => `---\nid: LTR-C1\nfrom: 程序员\nto: 流水线\ntype: 通知\nre: ${re}\nref: —\ncreated: 2026-09-10 10:00:00\nstatus: 未读\npayload: —\nsha: —\n---\n\n产物已落盘，请验收员复核——正文提及下站名也不许串台（复查残留②：匹配只看 re 行）\n`;
  fs.writeFileSync(path.join(inboxDir, "LTR-C1.md"), envl("UPG-X 程序员 工序完工"), "utf-8"); // 程序员工序的迟到完工信
  const o = { inboxDir, archiveDir };
  assert.equal(checkInboxForCompletion("UPG-X", "验收员", o), null, "单号对但工序名不对=不消费（防串台假红牌）");
  assert.ok(fs.existsSync(path.join(inboxDir, "LTR-C1.md")), "不消费就不归档");
  const hit = checkInboxForCompletion("UPG-X", "程序员", o);
  assert.ok(hit && hit.from === "程序员", "工序名对上才消费");
  assert.ok(fs.existsSync(path.join(archiveDir, "LTR-C1.md")), "消费后归档");
});

test("⑨ 工序推进迁移唯一函数：审验→合并位必带任务包（审查②）", () => {
  const t = { id: "UPG-T", title: "测试", stage: "审验员", stages: {}, history: [] };
  applyAdvance(t, "审验员", "设计师");
  assert.equal(t.stage, "设计师");
  assert.equal(t.merge, true);
  assert.ok(t.stages["设计师"]?.produce?.includes("合并记录.md"), "回写重试路径也必须生成合并任务包（旧手搓路径缺失=每轮 TypeError 卡死）");
  const t2 = { id: "UPG-T2", stage: "程序员", stages: {}, history: [] };
  applyAdvance(t2, "程序员", "验收员");
  assert.equal(t2.stage, "验收员");
  assert.equal(t2.merge, undefined, "常规工序不碰合并位");
  const t3 = { id: "UPG-T3", stages: {} };
  handoffToMerge(t3);
  assert.ok(t3.stages["设计师"].must_contain["合并记录.md"].includes("head"), "合并任务包带 hash 闸校验要求");
});

// ══ SYS-26 座探假死修（轻路径 pid 验活 + 全表降频 + 连续超时指数退避）══
test("⑩ SYS-26 轻路径 pid 验活：活 pid 灯保持、死 pid 熄灯（与 WMI 口径一致）", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-seat-light-"));
  const seatsDir = path.join(root, "seats"); fs.mkdirSync(seatsDir, { recursive: true });
  const liveF = path.join(seatsDir, "coder.json"), deadF = path.join(seatsDir, "qa.json");
  fs.writeFileSync(liveF, JSON.stringify({ role: "程序员", on: true, agent: "claude", agentPid: 4242 }));
  fs.writeFileSync(deadF, JSON.stringify({ role: "验收员", on: true, agent: "claude", agentPid: 4343 }));
  pollSeatsLight({ seatsDir, kill: (pid) => { if (pid !== 4242) throw new Error("ESRCH"); }, noLog: true }); // SYS-91：noLog // 注入 kill：4242 活、其余死
  assert.equal(JSON.parse(fs.readFileSync(liveF, "utf-8")).on, true, "活 pid：灯保持亮");
  const d = JSON.parse(fs.readFileSync(deadF, "utf-8"));
  assert.equal(d.on, false, "死 pid：灯必须熄（agent 死=灯灭）");
  assert.equal(d.offReason, "agent-exit", "熄灯原因可辨（区别于人工 offseat）");
});

test("⑪ SYS-26 全表降频：窗口内只走轻路径，到点/force 才跑全表", () => {
  __testResetSeats();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-seat-freq-"));
  const seatsDir = path.join(root, "seats"); fs.mkdirSync(seatsDir, { recursive: true });
  const calls = [];
  const opts = { seatsDir, full: () => { calls.push(1); return true; } };
  pollSeats(false, opts);
  assert.equal(calls.length, 1, "首跑（窗口外）走全表");
  pollSeats(false, opts);
  assert.equal(calls.length, 1, "45s 窗口内不再跑全表（重操作降频）");
  pollSeats(false, { ...opts, now: Date.now() + 46000 });
  assert.equal(calls.length, 2, "越过 45s 窗口复跑全表");
  pollSeats(true, opts);
  assert.equal(calls.length, 3, "force（开工/敲铃事件）立即全表");
});

test("⑫ SYS-26 全表连续失败：指数退避、上限 180s 封顶", () => {
  __testResetSeats();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-seat-backoff-"));
  const seatsDir = path.join(root, "seats"); fs.mkdirSync(seatsDir, { recursive: true });
  const calls = [];
  const opts = { seatsDir, full: () => { calls.push(1); return false; } }; // 全表持续失败
  const t0 = Date.now();
  pollSeats(false, { ...opts, now: t0 });           assert.equal(calls.length, 1, "首跑全表（失败）");
  pollSeats(false, { ...opts, now: t0 + 46000 });   assert.equal(calls.length, 1, "失败1次→窗口 90s，46s 不重试");
  pollSeats(false, { ...opts, now: t0 + 91000 });   assert.equal(calls.length, 2, "90s 到点重试");
  pollSeats(false, { ...opts, now: t0 + 250000 });  assert.equal(calls.length, 2, "失败2次→窗口 180s，159s 不重试");
  pollSeats(false, { ...opts, now: t0 + 271000 });  assert.equal(calls.length, 3, "180s 到点重试");
  pollSeats(false, { ...opts, now: t0 + 400000 });  assert.equal(calls.length, 3, "失败3次：未到退避窗口不重试");
  pollSeats(false, { ...opts, now: t0 + 451000 });  assert.equal(calls.length, 4, "上限 180s 封顶（未被理论 360s 拖住）");
});

// ══ SYS-27 根层哨兵（白名单外新品即时告警）══
test("⑬ 根层哨兵：白名单外新品即报（log+投信），同件不重报、清除后再现重报", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-root-sentry-"));
  const sysDir = path.join(root, "体系根"); fs.mkdirSync(sysDir);
  fs.writeFileSync(path.join(sysDir, "README.md"), "x");                 // 白名单内件
  fs.writeFileSync(path.join(sysDir, "MY_s2_typed.png"), "x");           // 白名单外散件（真实事故件）
  const reports = [];
  const opts = { stateFile: path.join(root, "根层哨兵.json"), noLog: true, onReport: (it) => reports.push(it), roots: [{ key: "体系根", dir: sysDir, wl: new Set(["README.md"]) }] };
  rootSentry(true, opts);
  assert.equal(reports.length, 1, "散件必须上报");
  assert.equal(reports[0].name, "MY_s2_typed.png");
  assert.ok(reports[0].path.includes("MY_s2_typed.png"), "投信须含路径");
  assert.ok(reports[0].at, "投信须含首见时间");
  rootSentry(true, opts);
  assert.equal(reports.length, 1, "同件只报一次（防重报状态落盘）");
  fs.unlinkSync(path.join(sysDir, "MY_s2_typed.png"));
  rootSentry(true, opts);
  assert.equal(reports.length, 1, "清除本身不报");
  fs.writeFileSync(path.join(sysDir, "MY_s2_typed.png"), "x");
  rootSentry(true, opts);
  assert.equal(reports.length, 2, "清除后再现必须重报（销账生效）");
});

test("⑭ 根层哨兵零误报：白名单内件 + 政策件(.reasonix/.workbuddy/reasonix.toml)静默", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-root-sentry-ok-"));
  const sysDir = path.join(root, "体系根"); fs.mkdirSync(sysDir);
  fs.writeFileSync(path.join(sysDir, "README.md"), "x");
  fs.mkdirSync(path.join(sysDir, "处理中心"));
  for (const n of [".reasonix", ".workbuddy", "reasonix.toml"]) fs.writeFileSync(path.join(sysDir, n), "x"); // 归体检⑧/layout-check 管
  const reports = [];
  rootSentry(true, { stateFile: path.join(root, "s.json"), noLog: true, onReport: (it) => reports.push(it), roots: [{ key: "体系根", dir: sysDir, wl: new Set(["README.md", "处理中心"]) }] });
  assert.equal(reports.length, 0, "白名单内件与政策件必须静默（零误报）");
});

test("⑮ 白名单单源引用：从 layout-check/体检 权威源码解析出预期集合（禁第三份漂移）", () => {
  const sysWl = readSetLiteral(path.join(SYS_ROOT, "处理中心", "机器闸", "layout-check.mjs"), "SYS_WHITELIST");
  const skel = readSetLiteral(path.join(SYS_ROOT, "巡检台", "_tools", "体检.mjs"), "SKEL");
  assert.ok(sysWl && sysWl.has("README.md") && sysWl.has("处理中心"), "体系根白名单须解析成功");
  assert.ok(skel && skel.has("README.md") && skel.has("安卓中国体系建设"), "works 根白名单须解析成功");
});

test("SYS-46 C：注入即回执——铃文本含「已收到 <单号>——处理中」（触发词仍在首位）", () => {
  __testResetRing();
  const sb2 = sandbox();
  letter(sb2.boxRoot, "程序员", "LTR-C46", { type: "派单", re: "UPG-99 测试单" });
  const said = [];
  ringUnreadSeats({ ledger: { active: [{ id: "UPG-99", phase: "dispatched" }] } },
    { ...opts(sb2, []), onRing: (pid, t) => { said.push(t); return "OK"; } });
  assert.equal(said.length, 1, "铃敲一次");
  assert.ok(said[0].startsWith("收信"), "触发词仍在首位：" + said[0]);
  assert.ok(said[0].includes("已收到 UPG-99——处理中"), "回执文案在场：" + said[0]);
});
