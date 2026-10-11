// SYS-188 哨兵/挂起噪声治理 · 自测（持单豁免接挂起表＋thrift 剔办信读＋挂起接口加固＋占用让位制）
// 跑法：node --test 处理中心/看板/tests/sys188-noise.test.mjs
// 变异锚（隔离副本亲杀）：① 豁免不读挂起.json ⇒ A① 红；② polls 还数 cat 单件读 ⇒ B① 红；③ --until 不生效 ⇒ C① 红；
//   ④ 等待型不封顶 15min ⇒ D① 红。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { scanClaimStale, tokenSentinel, parkArgsOf, selfHoldWarnings } from "../engine.mjs";

const BOARD = path.join(path.dirname(fileURLToPath(import.meta.url)), ".."); // 处理中心/看板
const SYS = path.resolve(BOARD, "..", "..");
const OCC_TOOL = path.join(SYS, "处理中心", "机器闸", "checks", "真机占用.mjs");
const NOW = Date.now();
const ago = (min) => new Date(NOW - min * 60e3).toLocaleString("sv-SE");
const tmpRoot = (tag) => fs.mkdtempSync(path.join(os.tmpdir(), `mov-sys188-${tag}-`));

// ══════════════ A：持单豁免接挂起表（挂起.json 为唯一真源） ══════════════
function claimSandbox() {
  const root = tmpRoot("claim");
  const claimsDir = path.join(root, ".claims");
  fs.mkdirSync(claimsDir, { recursive: true });
  const bindFile = path.join(root, "值守工.json");
  fs.writeFileSync(bindFile, JSON.stringify({ workers: [{ name: "二号-pi", mailbox: "程序员" }] }), "utf-8");
  const libFile = path.join(root, "工单库.md"); // 无卡（相位闸不掺和）——豁免只看挂起.json
  fs.writeFileSync(libFile, "# 占位\n", "utf-8");
  const parkFile = path.join(root, "挂起.json");
  return { root, claimsDir, bindFile, libFile, parkFile, stateFile: path.join(root, "持单哨兵.json") };
}
function claim(sb, key, worker, at) {
  fs.writeFileSync(path.join(sb.claimsDir, `${key}.json`), JSON.stringify({ key, worker, at }), "utf-8");
}
function scan(sb, { sessionIdleMin = 30 } = {}) {
  const out = [];
  scanClaimStale({
    claimsDir: sb.claimsDir, bindFile: sb.bindFile, stateFile: sb.stateFile, libFile: sb.libFile,
    parkFile: sb.parkFile, now: NOW, force: true, binding: {}, sessionIdleMin,
    sessionMtime: () => Date.now() - sessionIdleMin * 60e3,
    onNotify: (m) => out.push(m),
  });
  return out;
}

test("A① 挂起表豁免：挂起.json 有单＋超 SLA 静默持有 ⇒ 不报（卡面 phase 不变的挂起单不再照报）", () => {
  const sb = claimSandbox();
  fs.writeFileSync(sb.parkFile, JSON.stringify({ "UPG-881": { reason: "候外部", until: "条件达成", by: "pi" } }), "utf-8");
  claim(sb, "UPG-881", "二号-pi", ago(40));
  assert.deepEqual(scan(sb), [], "挂起单不得报持单不动");
});

test("A② 反向对照：同形未挂起 ⇒ 照报（真信号不弱化）", () => {
  const sb = claimSandbox();
  fs.writeFileSync(sb.parkFile, "{}", "utf-8");
  claim(sb, "UPG-882", "二号-pi", ago(40));
  const out = scan(sb);
  assert.equal(out.length, 1, "未挂起同形必须照报");
  assert.ok(out[0].includes("UPG-882"), "告警含单号：" + out[0]);
});

// ══════════════ B：thrift 计数收窄（剔办信读） ══════════════
const asstTurn = (text = "ok") => JSON.stringify({ type: "message", message: { role: "assistant", content: [{ type: "text", text }] } });
const toolCall = (name, args) => JSON.stringify({ type: "message", message: { role: "assistant", content: [{ type: "toolCall", id: "c" + Math.random().toString(36).slice(2, 7), name, arguments: args }] } });
const CAT = (file) => toolCall("bash", { command: `cat "E:/x/邮箱/程序员/INBOX/${file}"` });
const DIR = () => toolCall("bash", { command: 'ls -la "E:/x/邮箱/程序员/INBOX/" 2>/dev/null | head' });
function writePi(piRoot, seat, lines) {
  const slot = path.join(piRoot, "--fake--"); fs.mkdirSync(slot, { recursive: true });
  const f = path.join(slot, "sess.jsonl");
  const cwd = path.join(BOARD, "工位", seat);
  fs.appendFileSync(f, [`{"type":"session","cwd":${JSON.stringify(cwd)}}`, ...lines].join("\n") + "\n", "utf-8");
  return f;
}
const sentinelOpts = (root, over = {}) => ({
  piRoot: path.join(root, "pi"), kimiRoot: path.join(root, "kimi"),
  hermesDb: path.join(root, "__no_hermes__.db"), home: root,
  stateFile: path.join(root, "state.json"), boardFile: path.join(root, "board.json"),
  binding: {}, noLog: true, onAlert: () => {}, ...over,
});
const recOf = (root, f) => JSON.parse(fs.readFileSync(path.join(root, "state.json"), "utf8")).files[f];

test("B① 办信读不计：不同文件各 cat 一次（×N）⇒ polls 零增", () => {
  const root = tmpRoot("read"); const pi = path.join(root, "pi"); fs.mkdirSync(pi, { recursive: true });
  const f = writePi(pi, "程序员", [asstTurn(), CAT("LTR-a.md"), CAT("LTR-b.md"), CAT("LTR-c.md"), DIR()]);
  tokenSentinel(true, sentinelOpts(root));
  const rec = recOf(root, f);
  assert.equal(rec.polls, 1, "3 个单件读（路径各不相同）不计·目录级 1 次计 ⇒ polls=1");
});

test("B② 同路径重复读 ≥3 次起计（第 3 次起每次 +1）", () => {
  const root = tmpRoot("same"); const pi = path.join(root, "pi"); fs.mkdirSync(pi, { recursive: true });
  const f = writePi(pi, "程序员", [CAT("LTR-x.md"), CAT("LTR-x.md"), CAT("LTR-x.md"), CAT("LTR-x.md")]);
  tokenSentinel(true, sentinelOpts(root));
  assert.equal(recOf(root, f).polls, 2, "同路径 4 读 ⇒ 第 3/4 次计（2）");
  tokenSentinel(true, sentinelOpts(root));
  assert.equal(recOf(root, f).polls, 2, "增量：无新行不重计（readPaths 状态随档）");
});

test("B③ 目录级查看照计（旧口径真信号不弱化）", () => {
  const root = tmpRoot("dir"); const pi = path.join(root, "pi"); fs.mkdirSync(pi, { recursive: true });
  const f = writePi(pi, "程序员", [DIR(), DIR(), DIR()]);
  tokenSentinel(true, sentinelOpts(root));
  assert.equal(recOf(root, f).polls, 3, "三次目录级查看 = 3");
});

test("B④ 告警出口语义配位：thrift 走独立出口（sendThriftAlert）+ 旧「通道可能未送达」不用于 thrift", () => {
  const src = fs.readFileSync(path.join(BOARD, "engine.mjs"), "utf-8");
  assert.ok(/function sendThriftAlert\(/.test(src), "须有 thrift 独立出口");
  assert.ok(/sendThriftAlert\(m\); fileProblem\("SYS-Token"/.test(src), "thrift 告警须走 sendThriftAlert");
  const legacyUses = (src.match(/sendWatchAlert\(m\); fileProblem\("SYS-Token"/g) || []).length;
  assert.equal(legacyUses, 1, "铃通道告警出口仅剩预算类一处（thrift 已剔；实测 " + legacyUses + "）");
});

// ══════════════ C：挂起接口加固（--until／自持警告·纯函数） ══════════════
test("C① --until 旗标解析（优先）＋旧式竖线兼容＋缺条件留空", () => {
  assert.deepEqual(parkArgsOf(["候外部条件", "--until", "web 回已切"]), { reason: "候外部条件", until: "web 回已切", by: "cli" });
  assert.deepEqual(parkArgsOf(["原因", "|", "条件", "|", "pi"]), { reason: "原因", until: "条件", by: "pi" });
  assert.deepEqual(parkArgsOf(["只有原因"]), { reason: "只有原因", until: "", by: "cli" });
  assert.deepEqual(parkArgsOf(["原因", "--until", "条件", "|", "二号-pi"]), { reason: "原因", until: "条件", by: "二号-pi" });
});

test("C② 登记方=当前占用方 ⇒ 警告（自持不构成阻塞理由）；非自持 ⇒ 无警告", () => {
  const root = tmpRoot("selfhold");
  const occFile = path.join(root, "真机占用.json");
  fs.writeFileSync(occFile, JSON.stringify({ "T-9": { who: "甲", since: "2026-10-06 07:00:00", until: "2026-10-06 08:40:00", why: "x" }, _note: "n" }), "utf-8");
  const w = selfHoldWarnings("甲", occFile);
  assert.equal(w.length, 1, "自持须警告一条");
  assert.ok(w[0].includes("自持不构成阻塞理由"), "警告文案：" + w[0]);
  assert.deepEqual(selfHoldWarnings("乙", occFile), [], "非自持不警告");
});

// ══════════════ D：占用让位制（等待型 TTL ≤15min） ══════════════
const mkReg = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys188-occ-")), "真机占用.json");
const tool = (reg, ...a) => {
  try { return { rc: 0, out: execFileSync("node", [OCC_TOOL, ...a], { encoding: "utf-8", env: { ...process.env, MOV_SYS135_REG: reg } }) }; }
  catch (e) { return { rc: e.status ?? 1, out: String(e.stdout || "") + String(e.stderr || "") }; }
};
const regOf = (reg) => JSON.parse(fs.readFileSync(reg, "utf-8"));

test("D① 等待型 --waiting：TTL 封顶 15min＋醒目提示（超窗 --for 60 亦按 15 登记）", () => {
  const reg = mkReg();
  const r = tool(reg, "占", "--serial", "T-188", "--who", "甲", "--for", "60", "--waiting", "--why", "候外部条件");
  assert.equal(r.rc, 0, r.out);
  assert.match(r.out, /等待型占用 TTL ≤15min/, "须醒目提示：" + r.out);
  const e = regOf(reg)["T-188"];
  assert.equal(e.waiting, true, "登记须带 waiting 标记");
  const mins = (Date.parse(e.until.replace(" ", "T")) - Date.parse(e.since.replace(" ", "T"))) / 60000;
  assert.ok(mins <= 15.5 && mins >= 14, `TTL 应≈15min（实测 ${mins}）`);
});

test("D② 非等待型长占：照登＋一句提示（不静默）；短占零新增文案（零回归）", () => {
  const reg = mkReg();
  const r = tool(reg, "占", "--serial", "T-188", "--who", "甲", "--for", "60", "--why", "跑矩阵");
  assert.equal(r.rc, 0, r.out);
  assert.match(r.out, /若系「候外部条件」请改 --waiting/, "长占须提示：" + r.out);
  const mins = (Date.parse(regOf(reg)["T-188"].until.replace(" ", "T")) - Date.parse(regOf(reg)["T-188"].since.replace(" ", "T"))) / 60000;
  assert.ok(mins >= 59, "非等待型不封顶（实测 " + mins + "）");
  const reg2 = mkReg();
  const r2 = tool(reg2, "占", "--serial", "T-189", "--who", "甲", "--for", "10", "--why", "短占");
  assert.equal(r2.rc, 0, r2.out);
  assert.ok(!/TTL/.test(r2.out) && !/waiting/.test(r2.out), "短占无附加文案：" + r2.out);
});
