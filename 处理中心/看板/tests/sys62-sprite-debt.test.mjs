// SYS-62 疯狗管主人 + 精灵欠账线（严格版）· L1 契约
// 验收（卡面）：①四席超宽限+静默→咬｜写盘活跃→不咬；②白鸽 3 跳→咬（2 跳不咬）；③疯狗 stall>10min→咬；
// ④啄木鸟停跳>5min→咬；⑤fail 挂账>24h→咬（批注明→不咬）；⑥两级升级：磨一轮→设计师；再磨→用户。
// 变异锚：M1 恢复巡检台豁免→①红；M2 去欠账线→③④⑤红；M3 去二级升级→⑥红。
// 跑法：node --test 处理中心/看板/tests/sys62-sprite-debt.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { madDog, watchdog, patrolHygiene, wakeWorker, ringUnreadSeats, __testResetRing, __testResetWatchdog, __testResetSpriteBite, __testResetWorkerOpen } from "../engine.mjs";

const SEAT = { "设计师": "designer", "程序员": "coder", "验收员": "qa", "审验员": "reviewer", "巡检台": "hygiene" };
const NOW = Date.now();
const ago = (min) => new Date(NOW - min * 60e3).toLocaleString("sv-SE");
const TMPDIRS = [];
process.on("exit", () => { for (const d of TMPDIRS) try { fs.rmSync(d, { recursive: true, force: true }); } catch {} });

function sandbox(roles = ["设计师", "程序员", "验收员", "审验员", "巡检台"]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys62-")); TMPDIRS.push(root);
  const boxRoot = path.join(root, "邮箱"), seatsDir = path.join(root, "seats"), workRoot = path.join(root, "体系根");
  for (const r of roles) fs.mkdirSync(path.join(boxRoot, r, "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.mkdirSync(workRoot, { recursive: true });
  return { root, boxRoot, seatsDir, workRoot };
}
function seatOn(sb, role, on = true) {
  fs.writeFileSync(path.join(sb.seatsDir, `${SEAT[role]}.json`), JSON.stringify({ role, on, consolePid: 1, agentPid: process.pid }));
}
function letter(sb, role, id, created, type = "通知") {
  fs.writeFileSync(path.join(sb.boxRoot, role, "INBOX", `${id}.md`),
    `---\nid: ${id}\nfrom: 流水线\nto: ${role}\ntype: ${type}\nre: 维护通知\ncreated: ${created}\nstatus: 未读\npayload: —\nsha: —\n---\n\nx\n`, "utf-8");
}
const inboxOf = (sb, role) => path.join(sb.boxRoot, role, "INBOX");
const bites = (sb, role) => fs.readdirSync(inboxOf(sb, role)).map((f) => fs.readFileSync(path.join(inboxOf(sb, role), f), "utf-8")).filter((t) => t.includes("type: 疯狗"));

// 疯狗一次场景（席静默度可注）
function dogScenario({ role, ageMin = 40, sessionIdleMin = 30, graceMs = 25 * 60e3 }) {
  __testResetRing(); __testResetSpriteBite();
  const sb = sandbox([role]);
  seatOn(sb, role);
  letter(sb, role, "LTR-S62", ago(ageMin));
  ringUnreadSeats({ ledger: { active: [] } }, { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, onRing: () => "OK" });
  madDog({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, workRoot: sb.workRoot, stateFile: path.join(sb.root, "疯狗.json"),
    binding: { _madDogGraceMin: 25 }, noLog: true, now: NOW, graceMs, sessionMtime: () => NOW - sessionIdleMin * 60e3 });
  return { sb, got: bites(sb, role) };
}

test("SYS-62 ① 四席两向：超宽限+静默→咬（含巡检台·删豁免）；写盘活跃→不咬", () => {
  for (const role of ["巡检台", "设计师", "程序员", "审验员"]) {
    const a = dogScenario({ role, ageMin: 40, sessionIdleMin: 30 });
    assert.ok(a.got.length === 1, `${role}：超宽限+静默 → 必咬（SYS-62 管主人）`);
    const b = dogScenario({ role, ageMin: 40, sessionIdleMin: 1 });
    assert.equal(b.got.length, 0, `${role}：席会话 1 分钟前有写盘 → 不咬`);
  }
});

test("SYS-62 ①b 巡检台宽限=20min：21min 信咬｜15min 信不咬（配置口径）", () => {
  // 配置（per-role 对象）：巡检台 20
  const dog = (ageMin) => {
    __testResetRing(); __testResetSpriteBite();
    const sb = sandbox(["巡检台"]); seatOn(sb, "巡检台");
    letter(sb, "巡检台", "LTR-G20", ago(ageMin));
    ringUnreadSeats({ ledger: { active: [] } }, { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, onRing: () => "OK" });
    madDog({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, workRoot: sb.workRoot, stateFile: path.join(sb.root, "疯狗.json"),
      binding: { _madDogGraceMin: { 巡检台: 20, 设计师: 25, 程序员: 45, 审验员: 45 } }, noLog: true, now: NOW, sessionMtime: () => NOW - 30 * 60e3 });
    return bites(sb, "巡检台").length;
  };
  assert.equal(dog(21), 1, "21min > 巡检台 20min 宽限 → 咬");
  assert.equal(dog(15), 0, "15min < 20min → 不咬");
  // 出厂配置口径锁（工位绑定.json）
  const b = JSON.parse(fs.readFileSync(new URL("../工位绑定.json", import.meta.url), "utf-8"));
  assert.equal(b._madDogGraceMin["巡检台"], 20); assert.equal(b._madDogGraceMin["设计师"], 25);
  assert.equal(b._madDogGraceMin["程序员"], 45); assert.equal(b._madDogGraceMin["审验员"], 45);
});

test("SYS-62 ② 白鸽连跳：3 跳→咬信投巡检台席（2 跳不咬·每 3 次一咬）", () => {
  __testResetSpriteBite();
  const sb = sandbox(["巡检台"]);
  const seatFile = path.join(sb.root, "hygiene.json");
  fs.writeFileSync(seatFile, JSON.stringify({ role: "巡检台", on: false })); // 席不在岗=跳
  const patrolFile = path.join(sb.root, "巡查哨兵.json");
  // skipEscalateStep 走真实时钟（tick 节流）：预置 lastSkip 为上一间隔 + skipStreak 基线
  const runWith = (seed) => {
    fs.writeFileSync(patrolFile, JSON.stringify({ lastSkip: new Date(Date.now() - 21 * 60e3).toISOString(), skipStreak: seed }));
    patrolHygiene(true, { patrolFile, seatFile, binding: { _hygienePatrolMin: 20 }, noLog: true, boxRoot: sb.boxRoot });
    return bites(sb, "巡检台").length;
  };
  assert.equal(runWith(1), 0, "→2 跳不咬");
  assert.equal(runWith(2), 1, "→3 跳咬（白鸽欠账线）");
  assert.ok(bites(sb, "巡检台")[0].includes("白鸽"), "咬信指向白鸽连跳");
});

test("SYS-62 ③ 疯狗停滞>10min → 看门狗咬（11min 咬·9min 不咬）", () => {
  const run = (dogAgeMin) => {
    __testResetSpriteBite(); __testResetWatchdog();
    const sb = sandbox(["巡检台"]);
    fs.writeFileSync(path.join(sb.root, "疯狗.json"), JSON.stringify({ _lastAt: ago(dogAgeMin) }));
    fs.writeFileSync(path.join(sb.root, "看门狗.json"), JSON.stringify({ at: new Date(NOW - 60e3).toLocaleString("sv-SE"), ok: true }));
    watchdog({}, { force: true, now: NOW, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile: path.join(sb.root, "看门狗.json"),
      dogFile: path.join(sb.root, "疯狗.json"), scoresFile: path.join(sb.root, "成绩.json"), onAlarm: () => {}, onEscalate: () => {}, sessionMtime: () => NOW - 60e3, noLog: true,
      boardStartedAt: NOW - 3600e3, bootAt: NOW - 3600e3 }); // SYS-143：显式「窗外」态（与宿主启动态解耦）
    return bites(sb, "巡检台");
  };
  const a = run(11); assert.equal(a.length, 1, "疯狗停滞 11min → 咬"); assert.ok(a[0].includes("疯狗"), "咬信指向疯狗停滞");
  assert.equal(run(9).length, 0, "9min < 10min → 不咬");
});

test("SYS-62 ④ 看门狗②检（该敲没敲）停跳>5min → 咬（6min 咬·4min 不咬·SYS-144 名分归看门狗）", () => {
  const run = (peckAgeMin) => {
    __testResetSpriteBite(); __testResetWatchdog();
    const sb = sandbox(["巡检台"]);
    fs.writeFileSync(path.join(sb.root, "疯狗.json"), JSON.stringify({ _lastAt: new Date(NOW).toISOString() }));
    fs.writeFileSync(path.join(sb.root, "看门狗.json"), JSON.stringify({ at: ago(peckAgeMin), ok: true }));
    watchdog({}, { force: true, now: NOW, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile: path.join(sb.root, "看门狗.json"),
      dogFile: path.join(sb.root, "疯狗.json"), scoresFile: path.join(sb.root, "成绩.json"), onAlarm: () => {}, onEscalate: () => {}, sessionMtime: () => NOW - 60e3, noLog: true,
      boardStartedAt: NOW - 3600e3, bootAt: NOW - 3600e3 }); // SYS-143：显式「窗外」态（与宿主启动态解耦）
    return bites(sb, "巡检台");
  };
  const a = run(6); assert.equal(a.length, 1, "②检停跳 6min → 咬"); assert.ok(a[0].includes("看门狗"), "咬信指向看门狗②检（SYS-144 归并后不再出现啄木鸟名）");
  assert.ok(!a[0].includes("啄木鸟"), "退役名不得出现在运行文案");
  assert.equal(run(4).length, 0, "4min < 5min → 不咬");
});

// SYS-143 启动窗（板重启/停摆窗防假报）：①灯尸抑制 ②欠账线抑制——两态对照（窗内抑制＋留痕不静默／窗外照旧）
test("SYS-143 ①② 启动窗两态：窗内零告警零咬信＋留痕；窗外照旧", () => {
  const mk = (watchAt, dogAt) => {
    __testResetSpriteBite(); __testResetWatchdog();
    const sb = sandbox(["巡检台"]);
    fs.writeFileSync(path.join(sb.seatsDir, "hygiene.json"), JSON.stringify({ role: "巡检台", on: true, agentPid: 424242, consolePid: 0 })); // 灯亮+pid 死（无窗锚 ⇒ 判 dead）
    fs.writeFileSync(path.join(sb.root, "疯狗.json"), JSON.stringify({ _lastAt: dogAt }));
    const watchFile = path.join(sb.root, "看门狗.json");
    fs.writeFileSync(watchFile, JSON.stringify({ at: watchAt, ok: true }));
    return { sb, watchFile };
  };
  const run = ({ sb, watchFile }, win) => {
    const alarms = [];
    watchdog({ ledger: { active: [] } }, { force: true, now: NOW, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile,
      dogFile: path.join(sb.root, "疯狗.json"), scoresFile: path.join(sb.root, "成绩.json"),
      onAlarm: (m) => alarms.push(m), onEscalate: () => {}, noLog: true,
      kill: () => { throw Object.assign(new Error("ESRCH"), { code: "ESRCH" }); },   // 一切 pid 判死（灯尸夹具）
      boardStartedAt: win ? NOW - 10e3 : NOW - 3600e3,
      bootAt: win ? NOW - 60e3 : NOW - 3600e3,
      sessionMtime: () => NOW - 60e3 });
    const st = JSON.parse(fs.readFileSync(watchFile, "utf-8"));
    return { alarms, bites: bites(sb, "巡检台"), suppressed: st.suppressed || [] };
  };
  // 窗内：灯尸不告警·欠账线不咬·各留痕一条以上（不静默）
  const win = run(mk(new Date(NOW).toLocaleString("sv-SE"), ago(30)), true);
  assert.equal(win.alarms.length, 0, "窗内：灯尸不投告警");
  assert.equal(win.bites.length, 0, "窗内：欠账线不产咬信（停摆窗防假咬）");
  assert.ok(win.suppressed.some((s) => /灯尸/.test(s)), "窗内：灯尸抑制留痕在案（不静默）");
  assert.ok(win.suppressed.some((s) => /停滞/.test(s)), "窗内：欠账线抑制留痕在案（不静默）");
  // 窗外：照旧（灯尸告警 1 条＋停滞咬信 1 条），无抑制痕
  const out = run(mk(new Date(NOW).toLocaleString("sv-SE"), ago(30)), false); // watch 新鲜 ⇒ 只余「疯狗停滞」一条咬信（②检不构成）
  assert.equal(out.alarms.length, 1, "窗外：灯尸照旧告警");
  assert.ok(/灯尸/.test(out.alarms[0]));
  assert.equal(out.bites.length, 1, "窗外：疯狗停滞照旧咬");
  assert.equal(out.suppressed.length, 0, "窗外无抑制痕");
});

// SYS-145 换面：原「四精灵 fail 挂账>24h → 咬」锚已撤（四精灵内化 ⇒ 不再按精灵主题判挂账）；
//   新锚=「角色例行产物超 7 天」——判据面见 tests/sys145-routine-anchor.test.mjs（两向变异亲杀）。
//   本件保留「旧锚已撤」的反向断言：fail 挂账（含批注豁免语义）不再产咬信。
test("SYS-145 ⑤（原 SYS-62 ⑤）四精灵 fail 挂账锚已撤：fail 超 24h 不再咬（改由角色例行产物锚管）", () => {
  const run = (ageH, note) => {
    __testResetSpriteBite(); __testResetWatchdog();
    const sb = sandbox(["巡检台"]);
    fs.writeFileSync(path.join(sb.root, "疯狗.json"), JSON.stringify({ _lastAt: new Date(NOW).toISOString() }));
    fs.writeFileSync(path.join(sb.root, "看门狗.json"), JSON.stringify({ at: new Date(NOW - 60e3).toLocaleString("sv-SE"), ok: true }));
    fs.writeFileSync(path.join(sb.root, "成绩.json"), JSON.stringify({ checks: { "HY-BUG-01": { status: "fail", at: ago(ageH * 60), note } } }));
    watchdog({}, { force: true, now: NOW, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile: path.join(sb.root, "看门狗.json"),
      dogFile: path.join(sb.root, "疯狗.json"), scoresFile: path.join(sb.root, "成绩.json"), onAlarm: () => {}, onEscalate: () => {}, sessionMtime: () => NOW - 60e3, noLog: true,
      boardStartedAt: NOW - 3600e3, bootAt: NOW - 3600e3 }); // SYS-143：显式「窗外」态（与宿主启动态解耦）
    return bites(sb, "巡检台");
  };
  assert.equal(run(25, "").length, 0, "SYS-145 换面：fail 超 24h 不再咬（旧精灵主题锚已撤）");
  assert.equal(run(25, "挂账：已转 SYS-70 在办").length, 0, "批注明豁免语义随锚撤（仍不咬）");
  assert.equal(run(20, "").length, 0, "20h < 24h → 不咬");
});

test("SYS-62 ⑥ 两级升级：咬→磨一轮→设计师信；再磨→用户信", () => {
  __testResetRing(); __testResetSpriteBite();
  const sb = sandbox(["程序员"]); seatOn(sb, "程序员");
  letter(sb, "程序员", "LTR-ESC", ago(40));
  ringUnreadSeats({ ledger: { active: [] } }, { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, onRing: () => "OK" });
  const esc = [], escU = [];
  const grace = 25 * 60e3;
  const dog = (t) => madDog({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, workRoot: sb.workRoot, stateFile: path.join(sb.root, "疯狗.json"),
    binding: { _madDogGraceMin: 25 }, noLog: true, now: t, graceMs: grace, sessionMtime: () => NOW - 30 * 60e3,
    onEscalate: (h, b) => esc.push([h, b]), onEscalateUser: (h, b) => escU.push([h, b]) });
  dog(NOW); // 咬
  assert.equal(bites(sb, "程序员").length, 1, "首轮咬");
  dog(NOW + grace); // 一轮宽限 → 设计师
  assert.equal(esc.length, 1, "磨一轮 → 设计师升级信"); assert.ok(esc[0][0].includes("仍不动"));
  dog(NOW + 2 * grace); // 再一轮 → 用户
  assert.equal(escU.length, 1, "再磨一轮 → 用户升级信");

  assert.ok(escU[0][0].includes("报用户") || escU[0][0].includes("升用户"), "二级升级指向用户");
});

test("SYS-61 R2 两向：活窗在→认窗（换绑败仍注入）且不占故障位；真异常仍 fault", () => {
  __testResetWorkerOpen();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys61r2-")); TMPDIRS.push(root);
  const wf = path.join(root, "workers.json");
  fs.writeFileSync(wf, JSON.stringify({ workers: [{ name: "九号-pi", mailbox: "程序员" }] })); // 无该 worker 条目=换绑必败
  const faults = [], inj = [];
  const r1 = wakeWorker("测试席-丁", "T", { workers: [{ name: "测试席-丁", consolePid: 99999999 }], workersFile: wf, findWindow: () => 4242,
    inject: (pid, t) => inj.push(pid), fault: (k) => faults.push(k), openWindow: () => { throw new Error("不得另开"); }, noLog: true });
  assert.equal(r1.how, "rebound", "活窗 → 认窗（rebound）");
  assert.equal(inj[0], 4242, "换绑败仍照常注入活窗（拒→认）");
  assert.equal(faults.length, 0, "认窗路径不占故障位（良性）");
  const r2 = wakeWorker("测试席-戊", "T", { workers: [{ name: "测试席-戊", consolePid: 99999999 }], findWindow: () => 0,
    inject: () => {}, openWindow: () => { throw new Error("开窗失败"); }, fault: (k) => faults.push(k), onAlarm: () => {}, noLog: true });
  assert.equal(r2.how, "window-dead-no-reopen");
  assert.equal(faults.length, 1, "真异常仍记 fault");
});
