// SYS-88 席位进程判据回归锁（2026-09-26）——三案复演 + 判据变异锚：
//   ① qa 40576：hermes execute_code 工具子进程被 detectAgent 顶捕（10.8s 瞬灭）→ 假灯尸 + 席被误熄
//   ② coder 19096/39400：seats/coder.json 被写档指向**网页体系**活窗 cmd（本席窗死）→ 借异体系活 pid 过关
//   ③ coder 6108：控制台 cmd 行尾 `&& pi` 被当 agent（agentPid=consolePid）
// 变异程序（交付证据用，隔离副本）：删 `sys88InTree`/`owned === false` 分支 → ② 的 dead 断言必红（不得判活）。
// 跑法：node --test 处理中心/看板/tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { detectAgent, sys88SeatVerdict, sys88InTree, sys88PickAgentPid, pollSeats, pollSeatsLight, pollSeatsFull, watchdog, __testResetSys88, __testResetSeats, __testResetWatchdog } from "../engine.mjs";

const SYS_ROOT = "E:\\MOV\\安卓中国体系建设"; // 本体系根（行窗归属核）
const WEB_ROOT = "E:\\MOV\\网页体系建设";      // 异体系根（串台案）

// 进程行工厂：ageSec=进程龄（常驻候选判据用）
const P = (pid, ppid, name, cmd, ageSec = 3600) => ({
  ProcessId: pid, ParentProcessId: ppid, Name: name, CommandLine: cmd,
  CreationDate: new Date(Date.now() - ageSec * 1000).toISOString(),
});

// ① hermes 案链条：窗 39216 → hermes 6116（真身）→ python 36016（工具运行器）→ cmd 40576（瞬灭子进程·10.8s）→ engine 99999
const T_HERMES = [
  P(39216, 1000, "cmd.exe", 'cmd /k title MOV-验收员〔安卓中国〕 & "C:\\Users\\Administrator\\hermes\\hermes.exe"'),
  P(6116, 39216, "hermes.exe", "C:\\Users\\Administrator\\hermes\\hermes.exe --seat qa"),
  P(36016, 6116, "python.exe", "python C:\\Users\\Administrator\\hermes\\tools\\execute_code.py"),
  P(40576, 36016, "cmd.exe", "cmd /c python C:\\Users\\Administrator\\hermes\\tools\\execute_code.py", 3), // 3s：瞬灭
  P(99999, 40576, "node.exe", `node "${SYS_ROOT}\\处理中心\\看板\\engine.mjs" onseat qa`, 1),
];

// ③ 控制台 `&& pi` 案链条：窗 6108（行尾 && pi）→ pi 真身 18512（node …pi-coding-agent…）→ 工具 cmd 6109 → engine 77777
const T_PI = [
  P(6108, 5000, "cmd.exe", `cmd /k title MOV-程序员〔安卓中国〕 & set MOV_SEAT=coder & pi`, 7200),
  P(18512, 6108, "node.exe", 'node "C:\\Users\\Administrator\\AppData\\Roaming\\npm\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js"', 60),
  P(6109, 18512, "cmd.exe", `cmd /c node "${SYS_ROOT}\\处理中心\\看板\\engine.mjs" onseat coder`, 1),
  P(77777, 6109, "node.exe", `node "${SYS_ROOT}\\处理中心\\看板\\engine.mjs" onseat coder`, 1),
];

function sandbox(name, seat) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `mov-sys88-${name}-`));
  const seatsDir = path.join(root, "seats"), boxRoot = path.join(root, "邮箱");
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.mkdirSync(path.join(boxRoot, "程序员", "INBOX"), { recursive: true });
  if (seat) fs.writeFileSync(path.join(seatsDir, "coder.json"), JSON.stringify(seat));
  return { root, seatsDir, boxRoot, seatFile: path.join(seatsDir, "coder.json") };
}
const readSeat = (sb) => JSON.parse(fs.readFileSync(sb.seatFile, "utf-8"));

test("SYS-88 ③ 控制台 `&& pi` 不得被当 agent：落档真身 pi 进程 ≠ consolePid", () => {
  __testResetSys88();
  const got = detectAgent({ procs: T_PI, startPid: 77777, consolePid: 6108 });
  assert.equal(got.pid, 18512, "应落档真身（node …pi-coding-agent…）");
  assert.equal(got.name, "pi", "agent 名来自 CLI 签名");
  assert.notEqual(got.pid, 6108, "不得落档控制台 cmd（行尾 `&& pi` 伪命中）");
  // 只有控制台、链上无 agent：识别为空——绝不回退到控制台
  const only = T_PI.filter((r) => [6108, 5000].includes(r.ProcessId));
  assert.equal(detectAgent({ procs: only, startPid: 6108, consolePid: 0 }), "", "无 agent 时不得拿控制台顶包");
});

test("SYS-88 ① hermes 工具子进程（40576 案）不得顶捕：取最外层真身", () => {
  __testResetSys88();
  const got = detectAgent({ procs: T_HERMES, startPid: 99999, consolePid: 39216 });
  assert.equal(got.pid, 6116, "应落档常驻 hermes（最外层），不是瞬灭子进程 40576");
  assert.notEqual(got.pid, 40576, "10.8s 即死的工具子进程不得落档");
});

test("SYS-88 ② 写入侧校验：跨体系窗行 / 窗死陈行一律拒写（19096 案）", () => {
  __testResetSys88();
  const sb = sandbox("probe");
  const write = (rows) => fs.writeFileSync(sb.seatFile, JSON.stringify({ role: "程序员", on: false, consolePid: 6108 }));
  // (a) 跨体系同名窗（窗命令行含网页体系根、不含本体系根）→ 不落档
  write();
  pollSeatsFull({
    seatsDir: sb.seatsDir, noLog: true, // SYS-91
    probe: () => JSON.stringify([{ title: "MOV-程序员〔安卓中国〕", cmdPid: 19096, agentPid: 19097, agent: "pi", cmd: `cmd /k title MOV-程序员〔安卓中国〕 & node "${WEB_ROOT}\\处理中心\\看板\\engine.mjs" wake coder` }]),
    kill: () => {}, sysRoot: SYS_ROOT,
    procs: [P(19096, 4000, "cmd.exe", `cmd /k title MOV-程序员〔安卓中国〕 & node "${WEB_ROOT}\\处理中心\\看板\\engine.mjs" wake coder`), P(19097, 19096, "node.exe", 'node "C:\\…\\pi-coding-agent\\dist\\bundle\\cli.js"')],
  });
  assert.notEqual(readSeat(sb).agentPid, 19097, "异体系活 pid 不得落档（借活过关由此拦下）");
  // (b) 窗死陈行（cmdPid 已不存在）→ 不落档
  pollSeatsFull({
    seatsDir: sb.seatsDir, noLog: true, // SYS-91
    probe: () => JSON.stringify([{ title: "MOV-程序员〔安卓中国〕", cmdPid: 39400, agentPid: 19096, agent: "pi", cmd: `cmd /k title MOV-程序员〔安卓中国〕 & node "${SYS_ROOT}\\处理中心\\看板\\engine.mjs"` }]),
    kill: (pid) => { if (Number(pid) !== 39400 + 1) throw new Error("ESRCH"); }, sysRoot: SYS_ROOT,
    procs: [P(19096, 4000, "cmd.exe", `cmd /k title MOV-程序员〔安卓中国〕 & node "${WEB_ROOT}\\…"`)],
  });
  assert.notEqual(readSeat(sb).agentPid, 19096, "窗死陈行不得落档（39400 案）");
  // (c) 内层瞬灭子进程 → 提升为最外层真身
  const T = [
    P(6108, 5000, "cmd.exe", `cmd /k cd /d "${SYS_ROOT}\\处理中心\\看板\\工位\\程序员" & pi`, 7200),
    P(18512, 6108, "node.exe", 'node "C:\\…\\pi-coding-agent\\dist\\bundle\\cli.js"', 3600),
    P(6109, 18512, "cmd.exe", "cmd /c node engine.mjs 收信", 2),
  ];
  fs.writeFileSync(sb.seatFile, JSON.stringify({ role: "程序员", on: true, consolePid: 6108, agentPid: 6109 }));
  pollSeatsFull({
    seatsDir: sb.seatsDir, noLog: true, // SYS-91
    probe: () => JSON.stringify([{ title: "MOV-程序员〔安卓中国〕", cmdPid: 6108, agentPid: 6109, agent: "cmd", cmd: `cmd /k cd /d "${SYS_ROOT}\\处理中心\\看板\\工位\\程序员" & pi` }]),
    kill: (pid) => { if (Number(pid) === 6109) throw new Error("ESRCH"); }, // 6109（瞬灭子进程）已死——SYS-43 稳定守卫放行换代
    sysRoot: SYS_ROOT, procs: T,
  });
  assert.equal(readSeat(sb).agentPid, 18512, "内层瞬灭子进程应提升为最外层真身");
});

test("SYS-88 ② 判据侧：异体系活 pid 不得判活（灯尸必报·变异锚）", () => {
  __testResetSys88(); __testResetWatchdog();
  const CONSOLE = 6108; // 本席窗（活·在表）
  const FOREIGN = 19096; // 网页体系程序员窗 cmd（活·不在本席窗树）
  const T = [
    P(CONSOLE, 5000, "cmd.exe", `cmd /k cd /d "${SYS_ROOT}\\处理中心\\看板\\工位\\程序员" & set MOV_SEAT=coder & pi`, 7200),
    P(18512, CONSOLE, "node.exe", 'node "C:\\…\\pi-coding-agent\\dist\\bundle\\cli.js"', 3600),
    P(FOREIGN, 4000, "cmd.exe", `cmd /k title MOV-程序员〔安卓中国〕 & node "${WEB_ROOT}\\处理中心\\看板\\engine.mjs" wake coder`),
    P(19097, FOREIGN, "node.exe", 'node "C:\\…\\pi-coding-agent\\dist\\bundle\\cli.js"'),
  ];
  // 归属核本体（变异点：删掉此判据 → 下面 dead 断言必红）
  assert.equal(sys88InTree(T, FOREIGN, CONSOLE), false, "异体系 pid 不在本席窗树（已证）");
  assert.equal(sys88InTree(T, 18512, CONSOLE), true, "本席 agent 在本席窗树");
  // 判据侧：窗活 + 外借活 pid → 判死（不得判活）
  const v = sys88SeatVerdict({ on: true, consolePid: CONSOLE, agentPid: FOREIGN }, { procs: T, kill: () => {} }); // SYS-104：kill 桩——夹具不依赖宿主 pid 存活（6108/19096 与真机撞车致波动）
  assert.equal(v.verdict, "dead", "异体系活 pid：判死（不得判活）");
  assert.match(v.why, /跨体系|不属本席窗树/, "判死理由可辨");
  // watchdog 出口：必须报灯尸
  const sb = sandbox("foreign", { role: "程序员", on: true, consolePid: CONSOLE, agentPid: FOREIGN });
  const alarms = [];
  watchdog({ ledger: { active: [] } }, { force: true, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile: path.join(sb.root, "看门狗.json"), onAlarm: (m) => alarms.push(m), onEscalate: () => {}, procs: T, kill: () => {}, noLog: true, boardStartedAt: Date.now() - 3600e3, bootAt: Date.now() - 3600e3 }); // SYS-91：noLog；SYS-104：kill 桩；SYS-143：显式「窗外」态（启动宽限不参与本锚）
  assert.equal(alarms.length, 1, "灯尸必报（凭外借活 pid 过关的盲区已堵）");
  assert.match(alarms[0], /灯尸|已死/, "告警文案指向 agent 死");
});

test("SYS-88 ① 判据侧：pid 死但窗活 → 不熄灯、不判死，转全表复探", () => {
  __testResetSys88(); __testResetSeats();
  const sb = sandbox("reprobe", { role: "程序员", on: true, consolePid: process.pid, agentPid: 40576 }); // 40576 段 pid 不存在（瞬灭案）
  pollSeatsLight({ seatsDir: sb.seatsDir, kill: (pid) => { if (Number(pid) !== process.pid) throw new Error("ESRCH"); } , noLog: true }); // 窗活、agent 死
  const s = readSeat(sb);
  assert.equal(s.on, true, "窗活：不得凭单个死 pid 熄灯（假灯尸案）");
  assert.equal(s.offReason, undefined, "不得写 agent-exit");
  // 复探请求：退避窗口内也强制全表换档
  const calls = [];
  pollSeats(false, { seatsDir: sb.seatsDir, full: () => { calls.push(1); return true; } });
  assert.equal(calls.length, 1, "请求复探后立即全表（跳过退避窗口）");
  // 窗死 + agent 死 → 照熄（真·离席语义保留）
  const sb2 = sandbox("真死", { role: "程序员", on: true, consolePid: 39400, agentPid: 40576 });
  pollSeatsLight({ seatsDir: sb2.seatsDir, kill: () => { throw new Error("ESRCH"); } , noLog: true });
  assert.equal(readSeat(sb2).on, false, "窗死+agent 死：照熄（区别于假灯尸）");
  assert.equal(readSeat(sb2).offReason, "agent-exit", "熄灯原因可辨");
});

test("SYS-88 快路径：写档已核窗树的 pid 不启 PS 即判活（外借 pid 不享快路径）", () => {
  __testResetSys88();
  const CONSOLE = 6108, T = [P(CONSOLE, 5000, "cmd.exe", "cmd /k pi"), P(18512, CONSOLE, "node.exe", 'node "C:\\…\\pi-coding-agent\\dist\\bundle\\cli.js"')];
  // pidTree 戳本轮 pid → living（procs 故意给「查无此树」的表：走快路径就不会看它）
  const ok = sys88SeatVerdict({ on: true, consolePid: CONSOLE, agentPid: process.pid, pidTree: { root: CONSOLE, pid: process.pid } }, { procs: [] });
  assert.equal(ok.verdict, "living", "写档核过窗树 → 快路径 living（不取表）");
  // 同席被塞异体系活 pid：pidTree.pid 与现 pid 不符 → 撤快路径 → 现场核 → dead
  const bad = sys88SeatVerdict({ on: true, consolePid: CONSOLE, agentPid: 19096, pidTree: { root: CONSOLE, pid: process.pid } }, { procs: T, kill: () => {} }); // SYS-104：kill 桩
  assert.equal(bad.verdict, "dead", "戳不覆盖后来塞入的 pid（变异锚）");
  // 无窗锚（历史档/测试桩）→ 不判死
  assert.equal(sys88SeatVerdict({ on: true, agentPid: process.pid }, { procs: T }).verdict, "unknown", "无窗锚不判死");
});
