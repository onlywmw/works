// SYS-167 降耗（等信工具＋轮询/回合可观测）——L1 契约
// 变异锚：M1 等信改回「空转秒退」⇒ 信到即返①红；M2 哨兵漏计 polls（只数 turns）⇒ ②红；
//   M3 超阈不告警/每次刷屏 ⇒ ③红。（亲杀实录见交付报告）
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tokenSentinel } from "../engine.mjs";

const BOARD = path.join(path.dirname(fileURLToPath(import.meta.url)), ".."); // 处理中心/看板
const TOOL = path.join(BOARD, "..", "机器闸", "等信.mjs");
const run = (args, env, opts = {}) => spawnSync(process.execPath, [TOOL, ...args], { encoding: "utf8", env: { ...process.env, MOV_ROOT: env.root }, timeout: 30000, ...opts });
const letter = (inbox, id, re = "测试信") => fs.writeFileSync(path.join(inbox, `${id}.md`),
  `---\nid: ${id}\nfrom: 设计师\nto: 程序员\ntype: 派单\nre: ${re}\ncreated: 2026-10-03 02:00:00\nstatus: 未读\n---\n\n正文\n`, "utf-8");

// ══════════════ A：等信工具（四例＋零副作用） ══════════════
function boxSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys167-"));
  const inbox = (b) => { const p = path.join(root, "处理中心", "邮局", "邮箱", b, "INBOX"); fs.mkdirSync(p, { recursive: true }); return p; };
  fs.mkdirSync(path.join(root, "巡检台"), { recursive: true }); // root.mjs 标记件（MOV_ROOT 覆盖需两标记）
  return { root, inbox, coder: inbox("程序员"), designer: inbox("设计师") };
}
// 沙盒指纹：件名+sha+mtimeMs（零副作用对账用）
function fingerprint(dir) {
  return fs.readdirSync(dir).sort().map((f) => {
    const p = path.join(dir, f), st = fs.statSync(p);
    return `${f}:${crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 12)}:${st.mtimeMs}`;
  }).join("|");
}

test("A① 有信即返：预置信 ⇒ id/标题列出·exit 0；零副作用（井号/时间戳前后一致）", () => {
  const sb = boxSandbox(); letter(sb.coder, "LTR-A1", "甲信");
  const before = fingerprint(sb.coder);
  const r = run(["--box", "程序员", "--timeout", "5", "--interval", "1"], sb);
  assert.equal(r.status, 0, "有信应 exit 0：" + r.stderr);
  assert.ok(r.stdout.includes("LTR-A1") && r.stdout.includes("甲信"), "应打印 id+标题");
  assert.equal(fingerprint(sb.coder), before, "只读：信件件数/sha/mtime 零变");
});

test("A② 超时：空箱 ⇒ 「无新信」·exit 1", () => {
  const sb = boxSandbox();
  const r = run(["--box", "程序员", "--timeout", "2", "--interval", "1"], sb);
  assert.equal(r.status, 1, "超时应 exit 1");
  assert.ok(r.stdout.includes("无新信"), "应明确「无新信」：" + r.stdout);
});

test("A③ 信到即返：空箱启动·1s 后投信 ⇒ ≤interval+2s 返回（N 回合压成 1 的核心）", async () => {
  const sb = boxSandbox();
  const t0 = Date.now();
  const child = spawn(process.execPath, [TOOL, "--box", "程序员", "--timeout", "10", "--interval", "1", "--json"],
    { env: { ...process.env, MOV_ROOT: sb.root } });
  let out = ""; child.stdout.on("data", (d) => { out += d; });
  await new Promise((r) => setTimeout(r, 1000));
  letter(sb.coder, "LTR-A3");
  const code = await new Promise((r) => child.on("exit", r));
  const sec = (Date.now() - t0) / 1000;
  assert.equal(code, 0, "有信应 exit 0");
  assert.ok(sec <= 3, `应在 interval+2s 内返回（实测 ${sec.toFixed(1)}s）`);
  assert.equal(JSON.parse(out).letters[0].id, "LTR-A3");
});

test("A④ 多箱：--box 显式选箱（指定的空箱超时 / 另一箱有信即返）", () => {
  const sb = boxSandbox(); letter(sb.designer, "LTR-A4");
  const r1 = run(["--box", "程序员", "--timeout", "2", "--interval", "1"], sb);
  assert.equal(r1.status, 1, "指到空箱应超时（不得串箱）");
  const r2 = run(["--box", "设计师", "--timeout", "5", "--interval", "1"], sb);
  assert.equal(r2.status, 0); assert.ok(r2.stdout.includes("LTR-A4"));
});

test("A⑤ --json：机器可读（ok/box/count/letters 字段齐·超时态也在）", () => {
  const sb = boxSandbox(); letter(sb.coder, "LTR-A5", "乙信");
  const r = run(["--box", "程序员", "--json"], sb);
  const j = JSON.parse(r.stdout);
  assert.deepEqual([j.ok, j.box, j.count, j.letters[0].id, j.letters[0].re], [true, "程序员", 1, "LTR-A5", "乙信"]);
  const sb2 = boxSandbox();
  const j2 = JSON.parse(run(["--box", "程序员", "--timeout", "1", "--interval", "1", "--json"], sb2).stdout);
  assert.equal(j2.timedOut, true); assert.deepEqual(j2.letters, []);
});

test("A⑥ 无 --box 且 cwd 非工位 ⇒ 用法错 exit 2（不静默兜底）", () => {
  const sb = boxSandbox();
  const r = run(["--timeout", "1"], sb, { cwd: sb.root });
  assert.equal(r.status, 2);
  assert.ok((r.stderr + r.stdout).includes("--box"), "应提示显式 --box：" + r.stderr);
});

// ══════════════ B：哨兵扩列（turns/polls 计数＋阈值告警） ══════════════
const tmpRoot = (tag) => fs.mkdtempSync(path.join(os.tmpdir(), `mov-sys167-${tag}-`));
const asstTurn = (text = "ok") => JSON.stringify({ type: "message", message: { role: "assistant", content: [{ type: "text", text }] } });
const toolCall = (id, name, args) => JSON.stringify({ type: "message", message: { role: "assistant", content: [{ type: "toolCall", id, name, arguments: args }] } });
const POLL = () => toolCall("c" + Math.random().toString(36).slice(2, 7), "bash", { command: "ls -la \"E:/x/邮箱/程序员/INBOX/\" 2>/dev/null | head" });
const NON_POLL = () => toolCall("n" + Math.random().toString(36).slice(2, 7), "bash", { command: "node 处理中心/机器闸/等信.mjs --timeout 600" });
const READ_LETTER = () => toolCall("r" + Math.random().toString(36).slice(2, 7), "read", { path: "E:/x/邮箱/程序员/INBOX/LTR-x.md" }); // 非 bash 不计
function writePi(piRoot, seat, lines) {
  const slot = path.join(piRoot, "--fake--"); fs.mkdirSync(slot, { recursive: true });
  const f = path.join(slot, "sess.jsonl");
  const cwd = path.join(BOARD, "工位", seat); // 真工位路径（tokenSeatOfCwd 锚 HERE/工位）
  fs.appendFileSync(f, [`{"type":"session","cwd":${JSON.stringify(cwd)}}`, ...lines].join("\n") + "\n", "utf-8");
  return f;
}
function writeKimi(kimiRoot, seat, lines) {
  const dir = path.join(kimiRoot, `wd_E__MOV_安卓中国体系建设_处理中心_看板_工位_${seat}`, "session_x", "agents", "main");
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, "wire.jsonl");
  fs.writeFileSync(f, lines.join("\n") + "\n", "utf-8");
  return f;
}
const sentinelOpts = (root, over = {}) => ({
  piRoot: path.join(root, "pi"), kimiRoot: path.join(root, "kimi"),
  hermesDb: path.join(root, "__no_hermes__.db"), home: root,
  stateFile: path.join(root, "state.json"), boardFile: path.join(root, "board.json"),
  binding: {}, noLog: true, onAlert: () => {}, ...over, // SYS-167 R2 打回修：夹具默认告警隔离（fail-safe）——真出口只属生产引擎；显式 over 才收集
});
const recOf = (root, f) => JSON.parse(fs.readFileSync(path.join(root, "state.json"), "utf8")).files[f];

test("B① pi 计数：turns=assistant 行·polls=含 INBOX/邮箱 的查看类 bash（非 bash/非查看类不计）＋增量不重计", () => {
  const root = tmpRoot("count"); const pi = path.join(root, "pi");
  fs.mkdirSync(pi, { recursive: true });
  const f = writePi(pi, "程序员", [
    asstTurn(), POLL(), POLL(), NON_POLL(), READ_LETTER(), asstTurn(),
  ]);
  tokenSentinel(true, sentinelOpts(root)); // 首读：全档
  let rec = recOf(root, f);
  assert.deepEqual([rec.turns, rec.polls], [6, 2], "turns=6（6 条 assistant 行）·polls=2（两条查看类 INBOX bash·非 bash/非查看类不计）");
  tokenSentinel(true, sentinelOpts(root)); // 无新增：不重计
  assert.deepEqual([recOf(root, f).turns, recOf(root, f).polls], [6, 2], "增量：无新行不重计");
  fs.appendFileSync(f, asstTurn() + "\n" + POLL() + "\n", "utf-8"); // 追加
  tokenSentinel(true, sentinelOpts(root));
  rec = recOf(root, f);
  assert.deepEqual([rec.turns, rec.polls], [8, 3], "增量只计新增");
});

test("B② 阈值告警：默认阈内不报；构造超阈（pollLimit=1）报一次·再跑不刷屏", () => {
  const root = tmpRoot("alert"); const pi = path.join(root, "pi");
  fs.mkdirSync(pi, { recursive: true });
  writePi(pi, "程序员", [POLL(), POLL()]);
  const alerts = [];
  tokenSentinel(true, sentinelOpts(root, { onAlert: (m) => alerts.push(m) }));
  assert.equal(alerts.length, 0, "默认阈（polls>20）内不报");
  const o2 = sentinelOpts(root, { pollLimit: 1, onAlert: (m) => alerts.push(m) });
  const b = tokenSentinel(true, o2);
  assert.equal(alerts.length, 1, "超阈告警一次");
  assert.ok(alerts[0].includes("轮询/回合超阈") && alerts[0].includes("等信.mjs"), "文案含判词与出路：" + alerts[0]);
  assert.equal(b.thrift.length, 1, "board.thrift 列出超阈会话");
  tokenSentinel(true, o2);
  assert.equal(alerts.length, 1, "同会话不重复告警（不刷屏）");
});

test("B③ kimi 计数：step.begin=回合·Bash 查看类=轮询（增量）", () => {
  const root = tmpRoot("kimi"); const kimi = path.join(root, "kimi");
  fs.mkdirSync(kimi, { recursive: true });
  const ev = (e) => JSON.stringify({ type: "context.append_loop_event", event: e });
  const f = writeKimi(kimi, "设计师", [
    ev({ type: "step.begin", uuid: "u1", turnId: "0", step: 1 }),
    ev({ type: "tool.call", name: "Bash", args: { command: "ls /邮箱/INBOX" } }),
    ev({ type: "step.end", usage: { inputCacheRead: 5, inputOther: 0, inputCacheCreation: 0, output: 1 } }),
    ev({ type: "step.begin", uuid: "u2", turnId: "0", step: 2 }),
    ev({ type: "tool.call", name: "Bash", args: { command: "echo 无关" } }),
  ]);
  const b = tokenSentinel(true, sentinelOpts(root));
  const rec = JSON.parse(fs.readFileSync(path.join(root, "state.json"), "utf8")).files[f];
  assert.deepEqual([rec.turns, rec.polls], [2, 1], "kimi：2 回合·1 轮询");
  assert.equal(b.seats["设计师"].today, 6, "token 四字段读数不受影响（5+1）");
});
