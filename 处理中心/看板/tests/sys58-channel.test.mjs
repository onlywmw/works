// SYS-58：看门狗「敲了没办」检测 + 告警信出口（铃通道盲区修）——L1 契约
// 变异锚：M1 去敲了没办检测→①红；M2 去告警信出口→②红；M3 铃2 回退整段写→④红。亲杀见交付报告。
import { test, after } from "node:test";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { watchdog, ringUnreadSeats, __testResetRing, __testResetWatchdog, __testResetRingAck, __testResetWorkerOpen, wakeWorker, latestSessionMtime } from "../engine.mjs";

const BOARD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TMPDIRS = []; // SYS-58 复清令：harness 跑完自清（防 Temp 沙盒涌涨）
function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys58-"));
  TMPDIRS.push(root);
  const boxRoot = path.join(root, "邮箱"), seatsDir = path.join(root, "seats");
  fs.mkdirSync(path.join(boxRoot, "程序员", "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.writeFileSync(path.join(seatsDir, "coder.json"), JSON.stringify({ role: "程序员", on: true, consolePid: 1, agentPid: process.pid }));
  return { root, boxRoot, seatsDir, watchFile: path.join(root, "看门狗.json") };
}
function letter(sb, id, { re = "UPG-T9 甲单", type = "派单", ageMin = 0 } = {}) {
  fs.writeFileSync(path.join(sb.boxRoot, "程序员", "INBOX", `${id}.md`),
    `---\nid: ${id}\nfrom: 设计师\nto: 程序员\ntype: ${type}\nre: ${re}\ncreated: ${new Date(Date.now() - ageMin * 60e3).toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n\n测试信\n`, "utf-8");
}
const D = { ledger: { active: [{ id: "UPG-T9", phase: "dispatched" }] } };
const ringOpts = (sb, rings) => ({ boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true, onRing: () => { rings.push(1); return "OK"; } });
after(() => { for (const d of TMPDIRS) { try { fs.rmSync(d, { recursive: true, force: true }); } catch {} } });

test("SYS-58 ① 前向：铃已敲>N 分钟 + 席会话零写盘 + 箱内已敲未办 → 「敲了没办」告警 + 告警信出口（冷却内不重投）", () => {
  __testResetRing(); __testResetWatchdog();
  const sb = sandbox(); const rings = [], alarms = [], escalations = [];
  letter(sb, "LTR-C1");
  ringUnreadSeats(D, ringOpts(sb, rings)); // 敲上（lastRingAt=now）
  assert.equal(rings.length, 1, "先例：新信敲 1 次");
  const t1 = Date.now() + 11 * 60e3; // 11 分钟后（> 缺省 10 分钟）
  const wopts = (now) => ({ force: true, now, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile: sb.watchFile, noLog: true, // SYS-91：测试桩不得落真日志
    onAlarm: (m) => alarms.push(m), onEscalate: (m) => escalations.push(m), sessionMtime: () => 0 }); // 会话零写盘=注入未达形态
  watchdog(D, wopts(t1));
  assert.ok(alarms.some((m) => m.includes("敲了没办")), "须报「敲了没办」（注入未达盲区锚）");
  assert.equal(escalations.length, 1, "告警信出口恰 1 次");
  assert.ok(escalations[0].includes("敲了没办"), "告警信内容指向该缺陷");
  watchdog(D, wopts(t1 + 60e3)); // 冷却期内再评估
  assert.equal(escalations.length, 1, "同 msg 30 分钟冷却内不重投（防刷屏）");
});

test("SYS-58 ② 反向：席会话铃后有写盘（在办）/ 阈值内 / 无已敲信 → 不误报", () => {
  __testResetRing(); __testResetWatchdog();
  const sb = sandbox();
  letter(sb, "LTR-C2");
  ringUnreadSeats(D, ringOpts(sb, []));
  const w = (now, sm) => { const a = [], e = []; watchdog(D, { force: true, now, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile: sb.watchFile, noLog: true, onAlarm: (m) => a.push(m), onEscalate: (m) => e.push(m), sessionMtime: sm }); return { a, e }; }; // SYS-91：noLog
  const after = Date.now() + 11 * 60e3;
  const r1 = w(after, () => after); // ②a 会话铃后有写盘（在办）
  assert.ok(!r1.a.some((m) => m.includes("敲了没办")), "席在办（有写盘）不得误报");
  const r2 = w(Date.now() + 5 * 60e3, () => 0); // ②b 阈值内（5min < 10min）
  assert.ok(!r2.a.some((m) => m.includes("敲了没办")), "阈值内不得误报");
  __testResetRing(); __testResetWatchdog();
  const sb2 = sandbox(); const rings2 = [], alarms2 = [], esc2 = [];
  letter(sb2, "LTR-C3", { ageMin: 30 }); // 从未敲过且信龄 30min → 走既有「未敲」告警（该面用真实时钟），不属于本类
  const w2 = (now) => ({ force: true, now, boxRoot: sb2.boxRoot, seatsDir: sb2.seatsDir, watchFile: sb2.watchFile, noLog: true, // SYS-91：noLog
    onAlarm: (m) => alarms2.push(m), onEscalate: (m) => esc2.push(m), sessionMtime: () => 0 });
  watchdog(D, w2(Date.now() + 11 * 60e3)); // 首见=记宽限起点（R2）
  watchdog(D, w2(Date.now() + 14 * 60e3)); // 超 2min 宽限
  assert.ok(alarms2.length >= 1 && !alarms2.some((m) => m.includes("敲了没办")), "未敲≠敲了没办：不得串类");
});

test("SYS-58 ③ 铃2.ps1 源锚：分段注入 + 回车独立段 + 回车前静默 300-500ms（裁定 A·反粘贴回归锁）", () => {
  const src = fs.readFileSync(path.join(BOARD, "铃2.ps1"), "utf8");
  assert.ok(src.includes("Write-Seg"), "须分段写入函数");
  assert.ok(src.includes("for ($p = 0; $p -lt $Text.Length; $p += $segLen)"), "须分段循环");
  assert.ok(src.includes("Start-Sleep -Milliseconds 30"), "段间须拟人延时");
  const preEnter = src.match(/Start-Sleep -Milliseconds (\d+)\s*\r?\n\s*\$written \+= Write-Seg "`r"/);
  assert.ok(preEnter, "回车前须有独立静默段（裁定 A）");
  const ms = Number(preEnter[1]);
  assert.ok(ms >= 300 && ms <= 500, `回车前静默须在 300-500ms（裁定 A），实=${ms}`);
  assert.ok(src.includes('Write-Seg "`r"'), "回车必须独立成段（旧由整段尾部携带）");
  assert.ok(!src.includes('($Text + "`r")'), "不得回退整段单批注入");
  assert.ok(!src.includes('"NOTEXT"'), "空文本须允许（仅回车·B 回执闭环用）");
});

test("SYS-58 ⑤ B前向：注入后无写盘 → 补回车一次 → 仍无 → 记档+告警（提交回执闭环）", () => {
  __testResetRing(); __testResetRingAck();
  const sb = sandbox(); const rings = [], alerts = [];
  letter(sb, "LTR-D1");
  const base = { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true,
    ackDelayMs: 0, ackAlertMs: 0, backfillSilentMs: Number.MAX_SAFE_INTEGER, // 屏蔽 SYS-56 补敲分支，单验回执闭环
    onRing: (_p, t) => { rings.push(t); return "OK"; }, sessionMtime: () => 0, onAckAlert: (m) => alerts.push(m) };
  ringUnreadSeats(D, base);
  assert.equal(rings.length, 1, "首轮注入 1 次（文本）");
  assert.ok(rings[0].startsWith("收信（已收到"), "首轮=新信文本");
  ringUnreadSeats(D, base); // 下一 tick：无写盘 → 补回车
  assert.equal(rings.length, 2, "无写盘 → 补回车一次");
  assert.equal(rings[1], "", "补回车=空文本（铃2 仅回车）");
  ringUnreadSeats(D, base); // 再一 tick：仍无写盘 → 告警
  assert.equal(alerts.length, 1, "补回车仍无 → 告警 1 次");
  assert.ok(alerts[0].includes("敲了没达"), "告警指向通道未达");
  ringUnreadSeats(D, base); // 已闭环终止：不重复告警（后续由 watchdog≥N 看护）
  assert.equal(alerts.length, 1, "告警不重复（一次闭环终止）");
});

test("SYS-58 ⑥ B反向：席有写盘（已收到）→ 不补回车不告警", () => {
  __testResetRing(); __testResetRingAck();
  const sb = sandbox(); const rings = [], alerts = [];
  letter(sb, "LTR-D2");
  const after = Date.now() + 60e3; // 席会话在铃后有写盘
  const base = { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true,
    ackDelayMs: 0, ackAlertMs: 0, backfillSilentMs: Number.MAX_SAFE_INTEGER,
    onRing: (_p, t) => { rings.push(t); return "OK"; }, sessionMtime: () => after, onAckAlert: (m) => alerts.push(m) };
  ringUnreadSeats(D, base);
  assert.equal(rings.length, 1, "首轮注入 1 次");
  ringUnreadSeats(D, base);
  assert.equal(rings.length, 1, "已收到（有写盘）不得补回车");
  assert.equal(alerts.length, 0, "已收到不得告警");
});

test("SYS-58 ⑧ R2 席在忙不误报（铃前刚写盘=长工具调用中）：不告警；铃前沉默≥窗才告警", () => {
  __testResetRing(); __testResetRingAck();
  const t0 = Date.now();
  // 在忙：铃前 30s 刚写过、铃后无新写（长工具调用中）→ 不得告警（07:40 数据点锚）
  const sb = sandbox(); const alerts = [], rings = [];
  letter(sb, "LTR-D3");
  const busy = { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true,
    ackDelayMs: 0, ackAlertMs: 300e3, backfillSilentMs: Number.MAX_SAFE_INTEGER, now: () => t0,
    onRing: (_p, t) => { rings.push(t); return "OK"; }, sessionMtime: () => t0 - 30e3, onAckAlert: (m) => alerts.push(m) };
  ringUnreadSeats(D, busy); // 铃（preWrite=t0-30s）
  ringUnreadSeats(D, { ...busy, now: () => t0 }); // 补回车（delay=0）
  ringUnreadSeats(D, { ...busy, now: () => t0 + 400e3 }); // 超告警窗——但铃前刚写（30s<5min）→ 席在忙不告警
  assert.equal(alerts.length, 0, "铃前刚写过（在忙）不得误报");
  // 对照：铃前沉默 ≥ 窗（idle）→ 同窗告警
  __testResetRing(); __testResetRingAck();
  const sb2 = sandbox(); const alerts2 = [];
  letter(sb2, "LTR-D4");
  const idle = { ...busy, boxRoot: sb2.boxRoot, seatsDir: sb2.seatsDir, sessionMtime: () => t0 - 30 * 60e3, onAckAlert: (m) => alerts2.push(m) };
  ringUnreadSeats(D, idle);
  ringUnreadSeats(D, { ...idle, now: () => t0 });
  ringUnreadSeats(D, { ...idle, now: () => t0 + 400e3 });
  assert.equal(alerts2.length, 1, "铃前沉默≥窗 → 告警（真未达）");
});

test("SYS-58 ⑨ R3 探针：自有源优先（pi/kimi 不被共享污染）·hermes 席级证据·共享兜底", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys58h-")); TMPDIRS.push(home);
  const lad = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys58l-")); TMPDIRS.push(lad);
  const role = "巡检台";
  const seatCwd = path.join(BOARD, "工位", role); // 与 engine HERE 同源（看板/工位/<role>）
  const hash = crypto.createHash("sha256").update(seatCwd.split(path.sep).join("/"), "utf8").digest("hex").slice(0, 12);
  const t = (n) => (Date.now() - n * 60e3) / 1000; // utimesSync 数字=秒
  assert.equal(latestSessionMtime(role, { home, localAppData: lad }), 0, "无任何会话源=0");
  // kimi 自有源 → 取自有（修盲区锚）
  const kf = path.join(home, ".kimi-code", "sessions", `wd_workspace_${hash}`, "session_1", "agents", "main", "wire.jsonl");
  fs.mkdirSync(path.dirname(kf), { recursive: true }); fs.writeFileSync(kf, "{}"); fs.utimesSync(kf, t(10), t(10));
  assert.ok(Math.abs(latestSessionMtime(role, { home, localAppData: lad }) - fs.statSync(kf).mtimeMs) < 2000, "kimi 写盘须可见且取自有");
  // 共享源（hermes state.db-wal）更新——但本席自有 >0 ⇒ 不得取共享（R3 反污染锚）
  const hf = path.join(lad, "hermes", "state.db-wal");
  fs.mkdirSync(path.dirname(hf), { recursive: true }); fs.writeFileSync(hf, "x"); fs.utimesSync(hf, t(5), t(5));
  assert.ok(Math.abs(latestSessionMtime(role, { home, localAppData: lad }) - fs.statSync(kf).mtimeMs) < 2000, "自有>0 不得被共享源混判");
  // pi 自有源更新 → own=max(pi,kimi) 取 pi
  const slug = "--" + [...seatCwd].map((ch) => (ch === ":" || ch === "\\" || ch === "/" ? "-" : ch)).join("") + "--";
  const pf = path.join(home, ".pi", "agent", "sessions", slug, "s.jsonl");
  fs.mkdirSync(path.dirname(pf), { recursive: true }); fs.writeFileSync(pf, "{}"); fs.utimesSync(pf, t(1), t(1));
  assert.ok(Math.abs(latestSessionMtime(role, { home, localAppData: lad }) - fs.statSync(pf).mtimeMs) < 2000, "pi 写盘须为 own 最大");
  // R3：无自有源的席（验收员）→ hermes 席级证据（terminal-sessions→proc-results）优先；无席级 → 共享兜底
  const r2 = "验收员";
  assert.ok(Math.abs(latestSessionMtime(r2, { home, localAppData: lad }) - fs.statSync(hf).mtimeMs) < 2000, "无席级证据 → 共享源兜底");
  const tsDir = path.join(lad, "hermes", "terminal-sessions"); fs.mkdirSync(tsDir, { recursive: true });
  fs.writeFileSync(path.join(tsDir, "wt_session-1.json"), JSON.stringify({ session_id: "sid-qa", cwd: path.join(BOARD, "工位", r2) }));
  const prDir = path.join(lad, "hermes", "logs", "process-results"); fs.mkdirSync(prDir, { recursive: true });
  const prf = path.join(prDir, "proc_x.json");
  fs.writeFileSync(prf, JSON.stringify({ owner_task_id: "sid-qa" })); fs.utimesSync(prf, t(2), t(2));
  assert.ok(Math.abs(latestSessionMtime(r2, { home, localAppData: lad }) - fs.statSync(prf).mtimeMs) < 2000, "hermes 席级证据（proc 活动）须可分离");
  const r3 = "审验员";
  assert.equal(latestSessionMtime(r3, { home, localAppData: lad }), fs.statSync(hf).mtimeMs, "未映射与会话 → 共享兜底（粗粒度已明示）");
});

test("SYS-58 ④ 告警出口源锚：type=告警 即时信经 sendDutyLetter 家族机制（不造第二套）", () => {
  const src = fs.readFileSync(path.join(BOARD, "engine.mjs"), "utf8");
  assert.ok(src.includes('sendDutyLetter("SYS-看门狗", "铃通道告警"'), "告警信须走 sendDutyLetter");
  assert.ok(src.includes('type: "告警"'), "信型须为 告警");
  assert.ok(src.includes("WATCH_ESCALATE_COOLDOWN_MS"), "须有冷却防刷屏");
});

test("SYS-58 ⑦ SYS-61 worker 唤醒三态：窗活→铃2；窗死→开窗+换绑+注入；开不出→告警不 spawn（绝不隐性）", () => {
  __testResetWorkerOpen();
  const inj = [], opened = [], alarms = [];
  const tmpW = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys58w-")); TMPDIRS.push(tmpW);
  // ① 窗活（consolePid=本进程）→ 注入，不开窗
  const r1 = wakeWorker("二号-pi", "T1", { workers: [{ name: "二号-pi", consolePid: process.pid }], inject: (pid, t) => inj.push(["bell", pid, t]), findWindow: () => 0, openWindow: () => { throw new Error("不得开窗"); }, noLog: true });
  assert.equal(r1.how, "bell"); assert.equal(inj.length, 1); assert.equal(opened.length, 0);
  // ② 窗死（不存在的 pid）→ 开窗 + 换绑（workersFile 回写）+ 注入
  const wf = path.join(tmpW, "workers-test.json");
  const ws = [{ name: "二号-pi", mailbox: "程序员", consolePid: 99999999 }];
  fs.writeFileSync(wf, JSON.stringify({ workers: ws }));
  const r2 = wakeWorker("二号-pi", "T2", { workers: ws, workersFile: wf, inject: (pid, t) => inj.push(["bell-reopen", pid, t]), findWindow: () => 0, openWindow: (n) => { opened.push(n); return 9002; }, noLog: true });
  assert.equal(r2.how, "bell-reopened", "窗死→开窗+注入");
  assert.deepEqual(opened, ["二号-pi"]);
  assert.equal(JSON.parse(fs.readFileSync(wf, "utf-8")).workers[0].consolePid, 9002, "换绑自愈：consolePid 回写");
  assert.equal(inj[1][1], 9002, "注入指向新窗");
  // ③ 开窗失败 → 不 spawn·告警（宁排队·绝不隐性）
  const r3 = wakeWorker("测试席-甲", "T3", { workers: [{ name: "测试席-甲", consolePid: 99999999 }], inject: () => { throw new Error("不得注入"); }, findWindow: () => 0, openWindow: () => { throw new Error("开窗失败"); }, onAlarm: (m) => alarms.push(m), fault: () => {}, noLog: true }); // R1：fault 测试缝（防合成错误写实盘故障.log）
  assert.equal(r3.ok, false); assert.equal(r3.how, "window-dead-no-reopen");
  assert.equal(alarms.length, 1); assert.ok(alarms[0].includes("不 spawn"), "告警须写明不 spawn");
  // 源锚：wakeWorker 不再调池（RPC 退役）
  const src = fs.readFileSync(path.join(BOARD, "engine.mjs"), "utf8");
  assert.ok(!src.includes("pool.wake(name"), "wakeWorker 不得回退 RPC 池");
});

test("SYS-61 R1+R2 开窗幂等：活窗仅换绑不另开；连 wake 3 次只开 1 扇；换绑败拒→认（R2）", () => {
  __testResetWorkerOpen();
  const inj = [], opened = [], alarms = [];
  const tmpW = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys61r1-")); TMPDIRS.push(tmpW);
  // ① 记档 pid 已死但标题活窗仍在（WMI 锚命中）→ 仅换绑 + 注入，不另开
  const wf = path.join(tmpW, "workers-test.json");
  const ws = [{ name: "测试席-乙", mailbox: "程序员", consolePid: 99999999 }];
  fs.writeFileSync(wf, JSON.stringify({ workers: ws }));
  const rb = wakeWorker("测试席-乙", "T4", { workers: ws, workersFile: wf, findWindow: () => 12345, inject: (pid, t) => inj.push([pid, t]), openWindow: () => { throw new Error("活窗在，不得另开"); }, noLog: true });
  assert.equal(rb.how, "rebound", "活窗 → 仅换绑（不另开）");
  assert.equal(inj[0][0], 12345, "注入指向命中的活窗");
  assert.equal(JSON.parse(fs.readFileSync(wf, "utf-8")).workers[0].consolePid, 12345, "换绑回写命中活窗 pid");
  assert.equal(opened.length, 0);
  // ② 测试锚：同一 worker 连 wake 3 次只开 1 扇（R1 冷却闸·防窗雨）
  const r1 = wakeWorker("测试席-丙", "T5", { workers: [{ name: "测试席-丙" }], findWindow: () => 0, inject: () => {}, openWindow: (n) => { opened.push(n); return 9003; }, noLog: true });
  const r2 = wakeWorker("测试席-丙", "T6", { workers: [{ name: "测试席-丙" }], findWindow: () => 0, inject: () => {}, openWindow: (n) => { opened.push(n); return 9004; }, noLog: true });
  const r3 = wakeWorker("测试席-丙", "T7", { workers: [{ name: "测试席-丙" }], findWindow: () => 0, inject: () => {}, openWindow: (n) => { opened.push(n); return 9005; }, noLog: true });
  assert.equal(r1.how, "bell-reopened"); assert.equal(r2.how, "reopen-cooldown"); assert.equal(r3.how, "reopen-cooldown");
  assert.equal(opened.length, 1, "连 wake 3 次只开 1 扇（防窗雨）");
  // ③ SYS-61 R2：换绑回写失败（重试一次仍败）→ 拒→认（照常注入；不占告警面/故障位）
  const wf2 = path.join(tmpW, "workers-test2.json");
  fs.writeFileSync(wf2, JSON.stringify({ workers: [{ name: "九号-pi", mailbox: "程序员" }] })); // 文件里无待换绑条目=回写失败（重试亦败）
  const inj2 = [];
  const rf = wakeWorker("八号-pi", "T8", { workers: [{ name: "八号-pi", consolePid: 99999999 }], workersFile: wf2, findWindow: () => 54321, inject: (pid, t) => inj2.push([pid, t]), openWindow: () => { throw new Error("不得另开"); }, onAlarm: (m) => alarms.push(m), noLog: true });
  assert.equal(rf.how, "rebound", "R2 拒→认：换绑败仍认活窗走 rebound");
  assert.equal(inj2[0][0], 54321, "照常注入活窗（拒→认·根治死循环）");
  assert.equal(alarms.length, 0, "良性降级：不占告警面（真异常才告警）");
  assert.equal(opened.length, 1, "不得另开窗（防窗雨）");
});

test("SYS-58 ⑫ R4 互洗白修：探针 src=shared → B 闭环不告警（不当席级证据）；src=own → 照常告警", () => {
  const mk = (srcTag, alerts) => {
    __testResetRing(); __testResetRingAck();
    const sb = sandbox(); const rings = [];
    letter(sb, "LTR-W1");
    const base = { boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true,
      ackDelayMs: 0, ackAlertMs: 0, backfillSilentMs: Number.MAX_SAFE_INTEGER,
      onRing: (_p, t) => { rings.push(t); return "OK"; }, sessionMtime: () => 0,
      sessionProbe: () => ({ t: 0, src: srcTag }), onAckAlert: (m) => alerts.push(m) };
    ringUnreadSeats(D, base); // 铃（ack 起）
    ringUnreadSeats(D, base); // 补回车
    ringUnreadSeats(D, base); // 告警评估
    return rings;
  };
  const a1 = [];
  mk("shared", a1);
  assert.equal(a1.length, 0, "共享源（粗粒度）不得触发席级告警（修两 hermes 互洗白）");
  const a2 = [];
  mk("own", a2);
  assert.equal(a2.length, 1, "自有源照常告警（降权不误伤真信号）");
});

test("SYS-58 ⑩ R2 相位翻转瞬态：老信瞬变可敲未敲 → 宽限内不报；持续未敲 → 仍报", () => {
  __testResetRing(); __testResetWatchdog();
  const sb = sandbox(); const alarms = [];
  letter(sb, "LTR-E1", { ageMin: 16, re: "SYS-60 通知" }); // 16 分钟老信（提及 SYS-60）
  const w = (D2, now) => ({ force: true, now, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile: sb.watchFile, noLog: true, // SYS-91：noLog
    onAlarm: (m) => alarms.push(m), onEscalate: () => {}, sessionMtime: () => 0 });
  watchdog({ ledger: { active: [{ id: "SYS-60", phase: "dispatched" }] } }, w(null, Date.now())); // 票在别站：不报
  assert.equal(alarms.length, 0, "票未到站不报");
  watchdog({ ledger: { active: [] } }, w(null, Date.now() + 60e3)); // 作废翻转：瞬态宽限内不报
  assert.equal(alarms.length, 0, "相位翻转瞬态宽限内不报（R2 锚）");
  watchdog({ ledger: { active: [] } }, w(null, Date.now() + 200e3)); // 超 2min 宽限仍无铃 → 报
  assert.equal(alarms.length, 1, "持续未敲仍报（真未敲不掩）");
  assert.ok(alarms[0].includes("未敲铃"), "告警指向未敲铃");
});

test("SYS-58 ⑪ R2 通道冷却统一：watchdog 敲了没办告警后，B 闭环同窗不再双响（99s 双响修）", () => {
  __testResetRing(); __testResetWatchdog();
  const sb = sandbox(); const rings = [], alarms = [], esc = [];
  letter(sb, "LTR-F1");
  ringUnreadSeats(D, { ...ringOpts(sb, []), sessionMtime: () => 0, ackDelayMs: 0, ackAlertMs: 0, backfillSilentMs: Number.MAX_SAFE_INTEGER, onRing: (_p, t) => { rings.push(t); return "OK"; } });
  const t = Date.now() + 3600e3; // 铃后 1 小时：敲了没办（阈值 10min）
  watchdog(D, { force: true, now: t, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile: sb.watchFile, noLog: true, // SYS-91：noLog
    onAlarm: (m) => alarms.push(m), onEscalate: (m) => esc.push(m), sessionMtime: () => 0 });
  assert.equal(esc.length, 1, "watchdog 敲了没办告警 1 次（chanAlertAt 落账）");
  // 同进程内 B 闭环再评估：共用 per-role 冷却 → 不再双响
  const alerts2 = [];
  ringUnreadSeats(D, { ...ringOpts(sb, []), sessionMtime: () => 0, ackDelayMs: 0, ackAlertMs: 0, backfillSilentMs: Number.MAX_SAFE_INTEGER,
    onRing: (_p, x) => { rings.push(x); return "OK"; }, onAckAlert: (m) => alerts2.push(m), now: () => t + 99e3 });
  assert.equal(alerts2.length, 0, "B 闭环同窗（99s）被统一冷却拦下（防双响）");
});

test("SYS-61 ⑬ aq4：claim 活性守卫——有主+worktree 近30min写盘→不注；静止→照注", () => {
  __testResetWorkerOpen();
  const tmpW = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys61aq4-")); TMPDIRS.push(tmpW);
  const cd = path.join(tmpW, "claims"); fs.mkdirSync(cd);
  fs.writeFileSync(path.join(cd, "UPG-951.json"), JSON.stringify({ key: "UPG-951", worker: "二号-pi", at: Date.now() - 11 * 60e3 }), "utf-8");
  const inj = [], opened = [];
  const base = { workers: [{ name: "二号-pi", consolePid: 99999999 }], claimsDir: cd, findWindow: () => 0, inject: (p, t) => inj.push(t), openWindow: (n) => { opened.push(n); return 777; } };
  const r1 = wakeWorker("二号-pi", "T", { ...base, worktreeMtimeFn: () => Date.now() - 5 * 60e3 });
  assert.equal(r1.ok, false, "有主+活跃 → 不注"); assert.equal(r1.how, "claim-active-skip");
  assert.equal(inj.length, 0); assert.equal(opened.length, 0, "不得另开窗（双实例根因修）");
  const r2 = wakeWorker("二号-pi", "T", { ...base, worktreeMtimeFn: () => Date.now() - 40 * 60e3 });
  assert.equal(r2.how, "bell-reopened", "worktree 静止（>30min）→ 照常拉");
  assert.equal(inj.length, 1);
});
