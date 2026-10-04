// SYS-90 Token 哨兵（三源读数/增量/预算告警/零阻塞）+ 事件静噪（补敲上限 3+退避/同轮告警去重）——L1 契约
// 跑法：node --test 处理中心/看板/tests/sys90-token.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { tokenSentinel, ringUnreadSeats, hermesDbSeatMtimes, latestSessionProbe, seatProbeAllowed, __testResetRing, __testResetRingAck } from "../engine.mjs";
import { fileURLToPath } from "node:url";
const BOARD = path.join(path.dirname(fileURLToPath(import.meta.url)), ".."); // 处理中心/看板（生产端 HERE）

// ══════════════ B：Token 哨兵 ══════════════
function tmpRoot(tag) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `mov-sys90-${tag}-`));
}
function writePiSession(piRoot, seat, usageTokens) { // 伪会话：首行 cwd=工位/<seat>；每行一个 usage
  const slot = path.join(piRoot, "--fake--");
  fs.mkdirSync(slot, { recursive: true });
  const f = path.join(slot, "sess.jsonl");
  const cwd = path.join(BOARD, "工位", seat); // 真实工位路径（生产端 tokenSeatOfCwd 锚 HERE/工位）
  const lines = [`{"type":"session","cwd":${JSON.stringify(cwd)}}`];
  for (const t of usageTokens) lines.push(`{"type":"message","usage":{"input":1,"output":1,"totalTokens":${t}}}`);
  fs.appendFileSync(f, lines.join("\n") + "\n", "utf-8");
  return f;
}
function writeKimiWire(kimiRoot, seat, sums) {
  const dir = path.join(kimiRoot, `wd_E__MOV_安卓中国体系建设_处理中心_看板_工位_${seat}`, "session_x", "agents", "main");
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, "wire.jsonl");
  for (const s of sums) {
    fs.appendFileSync(f, JSON.stringify({ type: "context.append_loop_event", event: { type: "step.end", usage: { inputCacheRead: s, inputOther: 0, inputCacheCreation: 0, output: 0 } } }) + "\n", "utf-8");
  }
  return f;
}
const sentinelOpts = (piRoot, kimiRoot, over = {}) => ({
  piRoot, kimiRoot,
  hermesDb: path.join(piRoot, "__no_such_hermes__.db"), // 显式关 hermes 源
  home: piRoot,
  stateFile: path.join(piRoot, "state.json"),
  boardFile: path.join(piRoot, "board.json"),
  binding: {}, noLog: true, ...over,
});

test("B① 三源读数=手工对账（pi 按 cwd 判席 / kimi 按 wd 归席；增量不重计）", () => {
  const root = tmpRoot("read"); const piRoot = path.join(root, "pi"), kimiRoot = path.join(root, "kimi");
  writePiSession(piRoot, "程序员", [100, 200]);
  writeKimiWire(kimiRoot, "设计师", [10, 20]);
  const o = sentinelOpts(piRoot, kimiRoot);
  const b1 = tokenSentinel(true, o);
  assert.equal(b1.seats["程序员"].today, 300, "pi：cwd 判席 + totalTokens 求和");
  assert.equal(b1.seats["设计师"].today, 30, "kimi：wd 归席 + usage 四字段（10+20）");
  assert.equal(b1.sources.pi, 300); assert.equal(b1.sources.kimi, 30);
  const b2 = tokenSentinel(true, o); // 增量：无新增 → 不重计
  assert.equal(b2.seats["程序员"].today, 300, "二次读不得重计");
  writePiSession(piRoot, "程序员", [50]); // 追加一轮
  const b3 = tokenSentinel(true, o);
  assert.equal(b3.seats["程序员"].today, 350, "增量只计新增");
});

test("B② 预算超阈 → 告警一次（同席同日不重复）", () => {
  const root = tmpRoot("budget"); const piRoot = path.join(root, "pi"), kimiRoot = path.join(root, "kimi");
  writePiSession(piRoot, "程序员", [400]);
  const alerts = [];
  const o = sentinelOpts(piRoot, kimiRoot, { binding: { _tokenBudget: 100 }, onAlert: (m) => alerts.push(m) });
  const b = tokenSentinel(true, o);
  assert.deepEqual(b.budget.exceeded, ["程序员"], "超阈席入列");
  assert.equal(alerts.length, 1, "告警一次");
  assert.ok(alerts[0].includes("Token 预算超阈"), "告警文案");
  tokenSentinel(true, o);
  assert.equal(alerts.length, 1, "同日同席不重复告警");
});

test("B③ 零阻塞：大文件增量（≈2MB）单轮耗时 < 1500ms", () => {
  const root = tmpRoot("perf"); const piRoot = path.join(root, "pi"), kimiRoot = path.join(root, "kimi");
  const f = writePiSession(piRoot, "程序员", [10]);
  const big = '{"type":"message","usage":{"totalTokens":1}}\n'.repeat(30000); // ≈1.3MB
  fs.appendFileSync(f, big, "utf-8");
  const o = sentinelOpts(piRoot, kimiRoot);
  const t0 = Date.now();
  const b = tokenSentinel(true, o);
  const ms = Date.now() - t0;
  assert.ok(ms < 1500, `单轮耗时 ${ms}ms 应 <1500ms（分钟级节流·增量读）`);
  assert.ok(b.seats["程序员"].today >= 30000, "大文件也要计入（增量正确性）");
});

// ══════════════ R3④：hermes 席能关环且不靠 shared ══════════════
test("R3④ 回执闭环：席级探针(seat)关环；shared 不关环（不靠共享洗白）", () => {
  __testResetRing(); __testResetRingAck();
  const sb = sandbox();
  letter(sb.boxRoot, "LTR-R3C");
  const D = { ledger: { active: [{ id: "UPG-S90", phase: "dispatched" }] } };
  const mk = (probeT, src, rings) => ({
    boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true,
    backfillSilentMs: 10 * 60e3, ackDelayMs: 0,
    sessionMtime: () => Date.now(), // 席活跃：关补敲面（本用例只验回执闭环）
    sessionProbe: () => ({ t: probeT, src }),
    onRing: (_pid, text) => { rings.push(text); return "OK"; },
  });
  // 首轮：敲铃（ack.at=now）
  const rings = [];
  ringUnreadSeats(D, mk(0, "own", rings));
  assert.equal(rings.length, 1, "首轮新信照敲");
  const t0 = Date.now();
  // 席级（seat）时间在 ack 之后 → 关环：不再补回车
  ringUnreadSeats(D, mk(t0 + 60e3, "seat", rings));
  assert.equal(rings.length, 1, "seat 源关环：无补回车");
  // 负向：shared 且时间新 → 不关环（共享不当到账证据）→ 补回车一次
  __testResetRing(); __testResetRingAck();
  const rings2 = [];
  ringUnreadSeats(D, mk(0, "own", rings2));
  const t1 = Date.now();
  ringUnreadSeats(D, mk(t1 + 60e3, "shared", rings2));
  assert.equal(rings2.length, 2, "shared 不关环 → 补回车（降权口径）");
});

// ══════════════ R3 修3 锚：own 陈旧不短路 hermes 鲜源（验收员 19:52 打回根因） ══════════════
test("R3修3 探针取全源最大：own 陈旧时 hermes DB 鲜源胜出（不再早退短路）", async () => {
  const root = tmpRoot("probe-max");
  const home = path.join(root, "home");
  const lad = path.join(root, "lad");
  const role = "验收员";
  const B = String.fromCharCode(92);
  const cwd = ["E:", "MOV", "安卓中国体系建设", "处理中心", "看板", "工位", role].join(B);
  // pi 自有源：10 分钟前（陈旧）
  const slug = "--" + [...cwd].map((ch) => (ch === ":" || ch === "\\" || ch === "/" ? "-" : ch)).join("") + "--";
  const pf = path.join(home, ".pi", "agent", "sessions", slug, "s.jsonl");
  fs.mkdirSync(path.dirname(pf), { recursive: true });
  fs.writeFileSync(pf, JSON.stringify({ type: "session", cwd }) + "\n");
  const stale = (Date.now() - 10 * 60e3);
  fs.utimesSync(pf, stale / 1000, stale / 1000);
  // hermes DB：1 分钟前（鲜活）
  const dbPath = path.join(lad, "hermes", "state.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(dbPath);
  db.exec("create table sessions(id text, cwd text, last_activity_at real)");
  const fresh = Date.now() - 60e3;
  db.prepare("insert into sessions(id,cwd,last_activity_at) values(?,?,?)").run("s-live", cwd, fresh / 1000);
  db.close();
  const pr = latestSessionProbe(role, { home, localAppData: lad, hermesDb: dbPath });
  assert.equal(pr.src, "seat", "own 陈旧 → 取 hermes 席位鲜活源（旧实现因 own>0 早退短路返回 own）");
  assert.ok(Math.abs(pr.t - fresh) < 1500, `探针时间应为 DB 鲜时：${pr.t} vs ${fresh}`);
  // 对照：pi 更新鲜 → own
  const nowMs = Date.now();
  fs.utimesSync(pf, nowMs / 1000, nowMs / 1000);
  const pr2 = latestSessionProbe(role, { home, localAppData: lad, hermesDb: dbPath });
  assert.equal(pr2.src, "own", "pi 更新鲜 → own 优先");
});

// ══════════════ C：事件静噪 ══════════════
function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-ring90-"));
  const boxRoot = path.join(root, "邮箱");
  const seatsDir = path.join(root, "seats");
  fs.mkdirSync(path.join(boxRoot, "程序员", "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.writeFileSync(path.join(seatsDir, "coder.json"), JSON.stringify({ role: "程序员", on: true, consolePid: 1, agentPid: process.pid }));
  return { root, boxRoot, seatsDir };
}
function letter(boxRoot, id) {
  fs.writeFileSync(path.join(boxRoot, "程序员", "INBOX", `${id}.md`),
    `---\nid: ${id}\nfrom: 设计师\nto: 程序员\ntype: 派单\nre: UPG-S90 甲单\ncreated: ${new Date().toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n\n测试信\n`, "utf-8");
}

test("C① 补敲上限 3 次（同席多封=一次合敲）+ 席写盘后归零", () => {
  __testResetRing();
  const sb = sandbox(); const rings = [];
  letter(sb.boxRoot, "LTR-S90");
  let mtime = 0; // 席静默（0）
  const o = () => ({
    boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true,
    backfillSilentMs: 10 * 60e3, onRing: (_pid, text) => { rings.push(text); return "OK"; },
    sessionMtime: () => mtime,
  });
  const D = { ledger: { active: [{ id: "UPG-S90", phase: "dispatched" }] } };
  ringUnreadSeats(D, o());            // ① 新信照敲
  ringUnreadSeats(D, o());            // ② 补敲 1
  ringUnreadSeats(D, o());            // ③ 补敲 2
  ringUnreadSeats(D, o());            // ④ 补敲 3
  assert.equal(rings.length, 4, "新信 1 + 补敲 3（上限）");
  const before = rings.length;
  ringUnreadSeats(D, o());            // ⑤ 第 4 次补敲：应被上限拦住
  assert.equal(rings.length, before, "补敲上限 3 次后不得再敲（静噪）");
  mtime = Date.now() + 1000;          // 席写盘（晚于上次补敲时刻）→ 计数归零（此轮因「有动静」不补敲）
  ringUnreadSeats(D, o());
  assert.equal(rings.length, before, "席刚写盘=有动静：不补敲（静噪）");
  mtime = 0;                          // 席再次静默 → 计数已归零 → 恢复补敲
  ringUnreadSeats(D, o());
  assert.equal(rings.length, before + 1, "席写盘后计数归零，可再次补敲");
});

// ══════════════ R3：hermes 席写盘检测（sessions.last_activity_at 归席） ══════════════
test("R3 hermesDbSeatMtimes：按 cwd 只认安卓工位席（网页同名席/非席不入）", async () => {
  const root = tmpRoot("hermesdb");
  const dbPath = path.join(root, "state.db");
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(dbPath);
  const B = String.fromCharCode(92); // 反斜杠（免转义，防测试文件被 shell 吃字符）
  const SEAT_CWD = ["E:", "MOV", "安卓中国体系建设", "处理中心", "看板", "工位", "验收员"].join(B);
  const WEB_CWD = ["E:", "MOV", "网页体系建设", "处理中心", "看板", "工位", "验收员"].join(B);
  const NONSEAT = "C:" + B + "Users" + B + "Administrator";
  db.exec("create table sessions(id text, cwd text, last_activity_at real)");
  const ins = db.prepare("insert into sessions(id,cwd,last_activity_at) values(?,?,?)");
  ins.run("s1", SEAT_CWD, 1000);
  ins.run("s2", SEAT_CWD, 2000);
  ins.run("s3", WEB_CWD, 9999); // 网页同名席：不得入账
  ins.run("s4", NONSEAT, 9999); // 非席：不得入账
  db.close();
  const m = hermesDbSeatMtimes({ hermesDb: dbPath });
  assert.equal(m["验收员"], 2000 * 1000, "安卓席取最大 last_activity_at（毫秒）");
  assert.equal(Object.keys(m).length, 1, "网页同名席/非席不得入账（防互洗白）");
});

// ══════════════ 座探加固（跨体系同名窗误认）：体系锚 ══════════════
test("座探锚：本体系命令行放行；网页体系同名窗/无根行排除；无 cmd 旧版兼容放行", () => {
  const B = String.fromCharCode(92);
  const row = (root) => ({ title: "MOV-设计师〔安卓中国〕", cmd: '"C:' + B + 'WINDOWS' + B + 'system32' + B + 'cmd.exe" /k title MOV-设计师〔安卓中国〕 && node E:' + B + 'MOV' + B + root + B + '处理中心' + B + '看板' + B + 'engine.mjs wake designer' });
  assert.equal(seatProbeAllowed(row("安卓中国体系建设")), true, "本体系窗放行");
  assert.equal(seatProbeAllowed(row("网页体系建设")), false, "网页体系同名窗排除（防误认）");
  assert.equal(seatProbeAllowed({ title: "MOV-设计师〔安卓中国〕" }), true, "无 cmd（旧版座探）兼容放行");
});

// ══════════════ R3-rev2：hermes 席豁免回执闭环（结构性『15s 无写盘』误报修） ══════════════
test("R3rev2 hermes 席不设回执闭环：铃后无补回车；pi 席闭环仍生效", () => {
  __testResetRing(); __testResetRingAck();
  const sb = sandbox();
  const seatsDir = path.join(sb.root, "seats2");
  fs.mkdirSync(seatsDir, { recursive: true });
  // 两个席：程序员=pi（闭环生效）/ 验收员=hermes（豁免）
  fs.writeFileSync(path.join(seatsDir, "coder.json"), JSON.stringify({ role: "程序员", on: true, consolePid: 1, agentPid: process.pid, agent: "pi" }));
  fs.mkdirSync(path.join(sb.boxRoot, "验收员", "INBOX"), { recursive: true });
  fs.writeFileSync(path.join(seatsDir, "qa.json"), JSON.stringify({ role: "验收员", on: true, consolePid: 1, agentPid: process.pid, agent: "hermes" }));
  const D = { ledger: { active: [{ id: "UPG-S90", phase: "dispatched" }] } };
  letter(sb.boxRoot, "LTR-P"); // 程序员席一封信（走既有 letter 助手）
  const rings = [];
  const o = { boxRoot: sb.boxRoot, seatsDir, noPersist: true, noLog: true, noCooldown: true,
    backfillSilentMs: 10 * 60e3, ackDelayMs: 0, sessionMtime: () => Date.now(),
    sessionProbe: () => ({ t: Date.now(), src: "seat" }), onRing: (_p, t) => { rings.push(t); return "OK"; } };
  ringUnreadSeats(D, o); // 程序员的信
  assert.equal(rings.length, 1, "程序员席照敲");
  ringUnreadSeats(D, o);
  assert.equal(rings.length, 1, "程序员席（probe>ack）关环无补回车");
  // 验收员（hermes）：铃后 probe 恒陈旧也不补回车（豁免）
  fs.writeFileSync(path.join(sb.boxRoot, "验收员", "INBOX", "LTR-H.md"),
    `---\nid: LTR-H\nfrom: 设计师\nto: 验收员\ntype: 派单\nre: UPG-S90 乙单\ncreated: ${new Date().toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n\nx\n`, "utf-8");
  ringUnreadSeats(D, { ...o, sessionProbe: () => ({ t: Date.now(), src: "seat" }) }); // 敲验收员（新信）
  const n1 = rings.length;
  ringUnreadSeats(D, { ...o, sessionProbe: () => ({ t: 0, src: "shared" }) }); // 铃后陈旧+shared
  assert.equal(rings.length, n1, "hermes 席豁免：不投补回车/该告警");
});
