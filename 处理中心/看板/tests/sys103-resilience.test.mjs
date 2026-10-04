// SYS-103 引擎局部失败静默治理 回归锁（2026-09-26）——六条：
//   S1 注入失败退避+上限+置疑告警 / 同轮合并 / 窗变复位 ｜ S2 全表探失败升级告警
//   S3 hermes 席探针分型（共享源不产「敲了没办」）｜ S4 自愈抑制留痕 ｜ S5 两处判据守 ｜ S6 换绑校验说明（读档即验）
// 变异程序（隔离副本）：去退避 → S1 风暴用例必红；去升级告警 → S2 用例必红；去守 → S5 用例必红。
// 跑法：node --test 处理中心/看板/tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ringUnreadSeats, watchdog, pollSeats, seatSelfHeal, sys88SeatVerdict, detectAgent, __testResetRing, __testResetWatchdog, __testResetSeats, __testResetSeatHeal, __testResetSys88 } from "../engine.mjs";
import { fileURLToPath } from "node:url";

// SYS-103-R1：SYS_ROOT 改为**向上搜根**（真仓=3 级；隔离副本布局不全同⇒旧硬算 3 级会落到盘根，使 S6/静态锁在副本内假红）
const SYS_ROOT = (() => {
  let d = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(d, "处理中心", "看板", "工位绑定.json"))) return d;
    const up = path.dirname(d); if (up === d) break; d = up;
  }
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
})();
const ALIVE = 6108, DEAD = 40576;
const kill = (pid) => { if (Number(pid) !== ALIVE) throw new Error("ESRCH"); };
const P = (pid, ppid, name, cmd, ageSec = 3600) => ({ ProcessId: pid, ParentProcessId: ppid, Name: name, CommandLine: cmd, CreationDate: new Date(Date.now() - ageSec * 1000).toISOString() });

function sandbox(role = "程序员", key = "coder", seat = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys103-"));
  const boxRoot = path.join(root, "邮箱"), seatsDir = path.join(root, "seats");
  fs.mkdirSync(path.join(boxRoot, role, "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.writeFileSync(path.join(seatsDir, `${key}.json`), JSON.stringify({ role, on: true, consolePid: ALIVE, agentPid: DEAD, agent: "pi", ...seat }));
  return { root, boxRoot, seatsDir, seatFile: path.join(seatsDir, `${key}.json`), logFile: path.join(root, "巡铃.log") };
}
const letter = (boxRoot, role, id, ageMin = 11) => fs.writeFileSync(path.join(boxRoot, role, "INBOX", `${id}.md`),
  `---\nid: ${id}\nfrom: 设计师\nto: ${role}\ntype: 派单\nre: UPG-T9 甲单\nref: —\ncreated: ${new Date(Date.now() - ageMin * 60e3).toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n\n测试信\n`, "utf-8");

test("SYS-103 S1 注入失败：退避生效（attempts 有界）＋达 3 次置疑告警＋窗变复位", () => {
  __testResetRing();
  const sb = sandbox(); letter(sb.boxRoot, "程序员", "LTR-103-1");
  const alerts = []; let attempts = 0;
  const onRing = () => { attempts++; throw new Error("注入失败（死窗）"); };
  const base = { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, onRing, onAlert: (m) => alerts.push(m), sessionMtime: () => Date.now() }; // 注：席活跃 ⇒ 不走 SYS-90 补敲分支（专测本单新信敲铃失败退避）
  const T0 = Date.now();
  for (let i = 0; i < 5; i++) ringUnreadSeats({ ledger: { active: [] } }, { ...base, now: T0 });
  assert.equal(attempts, 1, "首次失败后即入退避：同一时刻连打 5 轮只许 1 次尝试（旧码=每轮重试→风暴）");
  ringUnreadSeats({ ledger: { active: [] } }, { ...base, now: T0 + 14e3 });
  assert.equal(attempts, 1, "退避窗内（15s 前）不得重试");
  ringUnreadSeats({ ledger: { active: [] } }, { ...base, now: T0 + 16e3 });
  assert.equal(attempts, 2, "退避到点（15s）重试 1 次");
  ringUnreadSeats({ ledger: { active: [] } }, { ...base, now: T0 + 47e3 });
  assert.equal(attempts, 3, "第二次退避 30s 到点再试");
  assert.equal(alerts.length, 1, "达 3 次转置疑告警（可见·防静默停摆）");
  assert.match(alerts[0], /注入连续失败/, "告警文案指向铃通道");
  // S1.3 窗变复位（干净验法）：先制造一次失败（n=1·退避 15s），随即在**退避窗内**换窗 → 应允许立即再试
  __testResetRing();
  const sb2 = sandbox(); letter(sb2.boxRoot, "程序员", "LTR-103-1b");
  let att2 = 0;
  const base2 = { boxRoot: sb2.boxRoot, seatsDir: sb2.seatsDir, noPersist: true, noLog: true, sessionMtime: () => Date.now(), onAlert: () => {}, kill: (pid) => { if (![ALIVE, 70001].includes(Number(pid))) throw new Error("ESRCH"); }, onRing: () => { att2++; throw new Error("x"); } };
  const U = Date.now();
  ringUnreadSeats({ ledger: { active: [] } }, { ...base2, now: U });
  assert.equal(att2, 1, "首次尝试");
  ringUnreadSeats({ ledger: { active: [] } }, { ...base2, now: U + 1e3 });
  assert.equal(att2, 1, "同窗同代：退避窗内（1s < 15s）不重试");
  const s2 = JSON.parse(fs.readFileSync(sb2.seatFile, "utf-8")); fs.writeFileSync(sb2.seatFile, JSON.stringify({ ...s2, consolePid: 70001 })); // 换到另一扇**活**窗（死窗会被 SYS-88 判死 ⇒ 正确地不敲，不是退避问题）
  ringUnreadSeats({ ledger: { active: [] } }, { ...base2, now: U + 2e3 });
  assert.equal(att2, 2, "换窗 ⇒ 退避复位（同在退避窗内，只可能是换窗带来的复位）");
});

test("SYS-103 S1 注入成功 ⇒ 退避复位（区分性断言：复位=15s 可重试 ／ 不复位=30s 不可）", () => {
  __testResetRing();
  const sb = sandbox(); letter(sb.boxRoot, "程序员", "LTR-103-2");
  let mode = "fail"; let n = 0;
  const base = { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, ledger: { active: [] }, sessionMtime: () => Date.now(), ackDelayMs: 1e9, ackAlertMs: 1e9, onRing: () => { n++; if (mode === "fail") throw new Error("x"); return "OK"; }, onAlert: () => {} };
  const T0 = Date.now();
  ringUnreadSeats(base.ledger, { ...base, now: T0 }); // 失败 #1（n=1·退避 15s）
  mode = "ok";
  ringUnreadSeats(base.ledger, { ...base, now: T0 + 16e3 }); // 退避到点 → 成功
  assert.equal(n, 2, "退避到点后成功注入");
  // 成功后：退避必须**复位**（否则下一轮从 n=2 起算= 30s）——区分性断言见下
  mode = "fail";
  letter(sb.boxRoot, "程序员", "LTR-103-2b"); // 成功那轮已把首信标为已敲 ⇒ 补一封新信作后续失败的对象
  const n0 = n, T1 = T0 + 120e3;
  ringUnreadSeats(base.ledger, { ...base, now: T1, noCooldown: true }); // 失败 #2（复位数 n=1 ⇒ 退避 15s；未复位 n=2 ⇒ 30s）
  assert.equal(n, n0 + 1, "新信触发一次尝试");
  ringUnreadSeats(base.ledger, { ...base, now: T1 + 16e3, noCooldown: true });
  assert.equal(n, n0 + 2, "+16s 必须可重试 ⇒ 退避计数已复位为 n=1（若未复位=30s 那么此断言必红——对「删成功复位」变异有区分性）");
  // 边界锁（独立小局面）：15s 退避窗内不得重试
  __testResetRing();
  const sb3 = sandbox(); letter(sb3.boxRoot, "程序员", "LTR-103-2c");
  let m = 0;
  const b3 = { boxRoot: sb3.boxRoot, seatsDir: sb3.seatsDir, noPersist: true, noLog: true, ledger: { active: [] }, sessionMtime: () => Date.now(), noCooldown: true, ackDelayMs: 1e9, ackAlertMs: 1e9, onAlert: () => {}, onRing: () => { m++; throw new Error("x"); } };
  const U = Date.now();
  ringUnreadSeats(b3.ledger, { ...b3, now: U });
  ringUnreadSeats(b3.ledger, { ...b3, now: U + 14e3 });
  assert.equal(m, 1, "首败后 +14s（<15s 退避）不得重试");
  ringUnreadSeats(b3.ledger, { ...b3, now: U + 16e3 });
  assert.equal(m, 2, "+16s（≥15s）可重试——边界值锁");
});

test("SYS-103 S2 全表探失败：连续 3 次超阈 → 升级告警（可见），失败窗内不重复报", () => {
  __testResetSeats();
  const alerts = [];
  const opts = { full: () => false, onAlert: (m) => alerts.push(m) }; // 注缝：探针恒失败
  const T0 = Date.now();
  pollSeats(false, { ...opts, now: T0 });               // 第 1 次（首跑全表）
  assert.equal(alerts.length, 0, "首次失败不报（防抖动）");
  pollSeats(false, { ...opts, now: T0 + 400e3 });      // 第 2 次（跃过退避窗）
  assert.equal(alerts.length, 0, "第 2 次仍不报");
  pollSeats(false, { ...opts, now: T0 + 900e3 });      // 第 3 次
  assert.equal(alerts.length, 1, "连续 3 次失败 ⇒ 升级告警（旧码仅 fault 一行=静默停摆）");
  assert.match(alerts[0], /全表座探连续失败/, "告警文案指向探针");
  pollSeats(false, { ...opts, now: T0 + 1800e3 });     // 第 4 次
  assert.equal(alerts.length, 1, "每 5 次一报（防刷屏）");
});

test("SYS-103 S3 hermes 席：仅共享源 ⇒ 不产「敲了没办」（留痕不告警）；席级源陈旧 ⇒ 照报（负控·非一刀切）", () => {
  __testResetRing(); __testResetWatchdog();
  const sb = sandbox("验收员", "qa", { agent: "hermes" }); letter(sb.boxRoot, "验收员", "LTR-103-3");
  const rings = [];
  ringUnreadSeats({ ledger: { active: [] } }, { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true, onRing: () => { rings.push(1); return "OK"; } }); // 造出「已敲」态
  assert.equal(rings.length, 1, "先敲一次（进已敲态）");
  const alarms = [];
  const w = (probe, now) => watchdog({ ledger: { active: [] } }, { force: true, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile: path.join(sb.root, "看门狗.json"), dogFile: path.join(sb.root, "疯狗.json"), scoresFile: path.join(sb.root, "成绩.json"), onAlarm: (m) => alarms.push(m), onEscalate: () => {}, sessionProbe: () => probe, now, noLog: true }); // SYS-91：沙盒 + noLog
  w({ t: 0, src: "shared" }, Date.now() + 6 * 60e3);
  assert.equal(alarms.filter((m) => m.includes("敲了没办")).length, 0, "hermes 席仅共享源=无席级证据 ⇒ 不得产「敲了没办」（今日 9 封误报即此形）");
  w({ t: 0, src: "seat" }, Date.now() + 12 * 60e3);
  assert.equal(alarms.filter((m) => m.includes("敲了没办")).length, 1, "负控：席级源确实陈旧 ⇒ 照报（不是一刀切豁免）");
});

test("SYS-103 S4 自愈抑制留痕：冷却内二次调用 → 巡铃.log 见抑制行（每冷却窗一次）", () => {
  __testResetSeatHeal();
  const sb = sandbox("程序员", "coder", { agent: "pi" });
  const injects = [];
  const T0 = Date.now();
  const o = (now) => ({ seatsDir: sb.seatsDir, binding: { "程序员": "pi" }, kill, now, logFile: sb.logFile, inject: (p, t) => injects.push(t) });
  seatSelfHeal(o(T0));
  seatSelfHeal(o(T0 + 60e3));   // 冷却内 → 抑制
  seatSelfHeal(o(T0 + 120e3));  // 冷却内 → 抑制（不重复留痕）
  const log = fs.readFileSync(sb.logFile, "utf-8");
  assert.equal(injects.length, 1, "冷却内不重复拉起");
  assert.equal((log.match(/自愈抑制/g) || []).length, 1, "抑制路径留痕一次（旧码六处 continue 全静默=黑暗期无痕）");
  assert.match(log, /冷却中/, "留痕含抑制原因");
});

test("SYS-103 S5 守项锁①：表缺失（procs:null）⇒ 归属不可判 ⇒ 不判死（不熄灯）", () => {
  __testResetSys88();
  const v = sys88SeatVerdict({ on: true, consolePid: ALIVE, agentPid: process.pid }, { procs: null });
  assert.equal(v.verdict, "unknown", "表不可得 ⇒ 宁缺勿错（守项：不得判死）");
  assert.match(v.why, /不可判|表缺失/, "理由可辨");
  const v2 = sys88SeatVerdict({ on: true, consolePid: ALIVE, agentPid: process.pid }, { procs: [P(ALIVE, 5000, "cmd.exe", "cmd /k pi"), P(process.pid, ALIVE, "node.exe", 'node "C:\\…\\pi-coding-agent\\cli.js"')] });
  assert.equal(v2.verdict, "living", "对照：表在场且 pid 属本席窗树 ⇒ living");
});

test("SYS-103 S5 守项锁②：常驻候选龄下限 ⇒ 5s 幼进程不落档（防工具子进程瞬灭）", () => {
  __testResetSys88();
  const young = [P(ALIVE, 5000, "cmd.exe", `cmd /k cd /d "${SYS_ROOT}\\处理中心\\看板\\工位\\程序员" & pi`, 3600), P(77001, ALIVE, "node.exe", 'node "C:\\…\\pi-coding-agent\\dist\\bundle\\cli.js"', 5)];
  assert.equal(detectAgent({ procs: young, startPid: 77001, consolePid: ALIVE, noLog: true }), "", "龄 5s < 15s ⇒ 不落档（新信敲铃/自愈都不会拿到瞬灭 pid）");
  const old = [P(ALIVE, 5000, "cmd.exe", `cmd /k cd /d "${SYS_ROOT}\\处理中心\\看板\\工位\\程序员" & pi`, 3600), P(77002, ALIVE, "node.exe", 'node "C:\\…\\pi-coding-agent\\dist\\bundle\\cli.js"', 3600)];
  const got = detectAgent({ procs: old, startPid: 77002, consolePid: ALIVE, noLog: true });
  assert.equal(got.pid, 77002, "对照：龄足 ⇒ 正常落档");
});

test("SYS-103 S6 换绑必经面：工位绑定.json 邻近说明在位（读档即验）", () => {
  const b = JSON.parse(fs.readFileSync(path.join(SYS_ROOT, "处理中心", "看板", "工位绑定.json"), "utf-8"));
  assert.ok(b._换绑校验 && /完整落键/.test(b._换绑校验) && /回车/.test(b._换绑校验), "换绑前须验完整落键（含独立回车提交时序）已写入说明面");
});

// ── SYS-103-R1：三处静态锁（审验员终审 P3①②·防将来改回旧形态与 BOM 丢失）──
test("SYS-103-R1 座探静态锁：单次取表（非注释行 Get-CimInstance 计数 == 1）+ 内存配对标记在场（防改回旧形态）", () => {
  const raw = fs.readFileSync(path.join(SYS_ROOT, "处理中心", "看板", "座探.ps1"), "utf-8");
  const code = raw.split("\n").filter((l) => !l.trim().startsWith("#")).join("\n"); // 口径：只算代码行（注释里的字样不算）
  const calls = (code.match(/Get-CimInstance/g) || []).length;
  assert.equal(calls, 1, `座探代码行内 Get-CimInstance 必须恰 1 次（单次取表）；旧形态=每窗 2 次子查询（3+2N 次 WMI）⇒ 本例必红`);
  assert.ok(code.includes("$kids["), "须含内存配对（$kids 索引）——旧形态无此结构");
  assert.ok(raw.includes("内存配对"), "头部改造说明在位（口径与实现同源）");
});

test("SYS-103-R1 座探静态锁：UTF-8 BOM（EF BB BF）在位（PS 5.1 中文正确解析前提）", () => {
  const buf = fs.readFileSync(path.join(SYS_ROOT, "处理中心", "看板", "座探.ps1"));
  assert.deepEqual([...buf.subarray(0, 3)], [0xef, 0xbb, 0xbf], "无 BOM 时 PS 5.1 会把 UTF-8 中文按 GBK 误读 ⇒ 解析期怪错（本次实测：op_Addition 假报）");
});
