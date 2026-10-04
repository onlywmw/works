// SYS-52 持单不动哨兵 · 自测（.claims 扫描：超 SLA + 持有方席静默 → 告警；两向）
// SYS-172 补：相位闸（delivered/accepted/audited/merged/obsolete 不报 ＋ 同轮自动销警 ＋ 真卡单不漏 ＋ 卡面不可读不豁免）
// 验收（卡面）：真/模拟 claim+静默 → 告警到；活跃持有 → 不告警（两向）+ 零回归
// 跑法：node --test 处理中心/看板/tests/sys52-claim-stale.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { scanClaimStale } from "../engine.mjs";

const NOW = Date.now();
const ago = (min) => new Date(NOW - min * 60e3).toLocaleString("sv-SE");

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys52-"));
  const claimsDir = path.join(root, ".claims");
  fs.mkdirSync(claimsDir, { recursive: true });
  const bindFile = path.join(root, "值守工.json"); // worker → 席 映射（值守工.json 同构）
  fs.writeFileSync(bindFile, JSON.stringify({ workers: [{ name: "二号-pi", mailbox: "程序员" }, { name: "designer-x", mailbox: "设计师" }] }), "utf-8");
  return { root, claimsDir, bindFile, stateFile: path.join(root, "持单哨兵.json") };
}
function claim(sb, key, worker, at) {
  fs.writeFileSync(path.join(sb.claimsDir, `${key}.json`), JSON.stringify({ key, worker, at }), "utf-8");
}
// 一次扫描；席静默度可注（sessionIdleMin）；返回告警文案数组
function scan(sb, { now = NOW, sessionIdleMin = 30, binding = {}, force = true, sm, libFile } = {}) {
  const out = [];
  scanClaimStale({
    claimsDir: sb.claimsDir, bindFile: sb.bindFile, stateFile: sb.stateFile, now, force, binding, libFile,
    sessionMtime: sm || (() => now - sessionIdleMin * 60e3),
    onNotify: (m) => out.push(m),
  });
  return out;
}
// SYS-172：工单库桩（单号→phase；最小卡面）
const libText = (map) => Object.entries(map).map(([id, phase]) =>
  `# ${id} 桩卡\n\n` + "```status\n" + `phase: ${phase}\nupdated_at: 2026-10-03T00:00:00\n` + "```\n").join("\n");
function writeLib(sb, map) {
  const p = path.join(sb.root, "工单库桩.md");
  fs.writeFileSync(p, libText(map), "utf-8");
  return p;
}
const stateOf = (sb) => JSON.parse(fs.readFileSync(sb.stateFile, "utf-8"));

test("① 超 SLA（40min>30）+ 持有方席静默（30min）→ 告警（含单号/持有方）", () => {
  const sb = sandbox(); claim(sb, "UPG-900", "二号-pi", ago(40));
  const out = scan(sb);
  assert.equal(out.length, 1);
  assert.ok(out[0].includes("UPG-900") && out[0].includes("二号-pi"), "告警须含单号与持有方");
  assert.deepEqual(stateOf(sb).held, ["UPG-900"], "状态件须落 held");
});

test("② 超 SLA + 持有方席会话活跃（1min 前有写）→ 不告警（反向案）", () => {
  const sb = sandbox(); claim(sb, "UPG-901", "二号-pi", ago(40));
  assert.deepEqual(scan(sb, { sessionIdleMin: 1 }), [], "席活跃=在干活，不告警");
  assert.deepEqual(stateOf(sb).held, []);
});

test("③ 未超 SLA（10min<30）→ 不告警（新领不报）", () => {
  const sb = sandbox(); claim(sb, "UPG-902", "二号-pi", ago(10));
  assert.deepEqual(scan(sb), []);
});

test("④ 冷却：同刻连扫只告警一次；+31min 后可再告警（逐单 30min 冷却）", () => {
  const sb = sandbox(); claim(sb, "UPG-903", "二号-pi", ago(40));
  assert.equal(scan(sb).length, 1, "首扫告警");
  assert.equal(scan(sb, { now: NOW + 60e3 }).length, 0, "冷却内不重报");
  assert.equal(scan(sb, { now: NOW + 31 * 60e3 }).length, 1, "过冷却再报");
});

test("⑤ 持有方放单（claim 件已删）→ 不告警且状态清零（销账）", () => {
  const sb = sandbox(); claim(sb, "UPG-904", "二号-pi", ago(40));
  scan(sb);
  fs.rmSync(path.join(sb.claimsDir, "UPG-904.json"));
  assert.deepEqual(scan(sb, { now: NOW + 31 * 60e3 }), [], "单放了不报");
  assert.deepEqual(stateOf(sb).held, [], "状态件 held 清空");
});

test("⑥ N 可配（_claimStaleMin=15）：20min→报；10min→不报", () => {
  const sb1 = sandbox(); claim(sb1, "UPG-905", "二号-pi", ago(20));
  assert.equal(scan(sb1, { binding: { _claimStaleMin: 15 } }).length, 1, "配 15 后 20min 超限");
  const sb2 = sandbox(); claim(sb2, "UPG-906", "二号-pi", ago(10));
  assert.deepEqual(scan(sb2, { binding: { _claimStaleMin: 15 } }), [], "10min<15 不报");
});

test("⑦ worker→席映射生效：活跃的是别席、持有席静默 → 仍告警（不被他席洗白）", () => {
  const sb = sandbox(); claim(sb, "UPG-907", "designer-x", ago(40)); // 持有方=designer-x（映射设计师席）
  const sm = (role) => (role === "程序员" ? NOW - 60e3 : NOW - 40 * 60e3); // 程序员席活跃、设计师席静默
  const out = scan(sb, { sm });
  assert.equal(out.length, 1, "他席活跃不得洗白持有席静默");
  assert.ok(out[0].includes("designer-x"));
});

// ══ SYS-172 相位闸（已进交付线/终态不再报「持单不动」） ══
test("⑧ 假警三例：超 SLA + 席静默 + phase=delivered|merged|obsolete ⇒ 不报", () => {
  for (const [id, phase] of [["UPG-910", "delivered"], ["UPG-911", "merged"], ["UPG-912", "obsolete"]]) {
    const sb = sandbox(); claim(sb, id, "二号-pi", ago(40));
    const out = scan(sb, { libFile: writeLib(sb, { [id]: phase }) });
    assert.deepEqual(out, [], `${id}（${phase}）已进交付线/终态，不报`);
    assert.deepEqual(stateOf(sb).held, [], "状态件 held 不含 parked 单");
  }
});

test("⑨ 真卡单不漏：同条件 phase=in_progress|claimed ⇒ 仍报", () => {
  for (const [id, phase] of [["UPG-913", "in_progress"], ["UPG-914", "claimed"]]) {
    const sb = sandbox(); claim(sb, id, "二号-pi", ago(40));
    const out = scan(sb, { libFile: writeLib(sb, { [id]: phase }) });
    assert.equal(out.length, 1, `${id}（${phase}）真持单仍报`);
    assert.deepEqual(stateOf(sb).held, [id], "状态件 held 含真持单");
  }
});

test("⑩ 自动销警：先真告警（in_progress），相位推进 merged ⇒ 同轮告警消失（held/notified 清）", () => {
  const sb = sandbox(); claim(sb, "UPG-915", "二号-pi", ago(40));
  const lib = writeLib(sb, { "UPG-915": "in_progress" });
  assert.equal(scan(sb, { libFile: lib }).length, 1, "首扫真告警");
  assert.ok(stateOf(sb).notified["UPG-915"], "告警态在册");
  fs.writeFileSync(lib, libText({ "UPG-915": "merged" }), "utf-8");
  assert.deepEqual(scan(sb, { now: NOW + 60e3, libFile: lib }), [], "相位转 merged 后同轮不再告警");
  assert.deepEqual(stateOf(sb).held, [], "held 清空");
  assert.ok(!stateOf(sb).notified["UPG-915"], "告警态同轮销警");
});

test("⑪ 卡面不可读 ⇒ 照旧报（禁放宽真卡单·fail-open 到现行为）", () => {
  const sb = sandbox(); claim(sb, "UPG-916", "二号-pi", ago(40));
  const out = scan(sb, { libFile: path.join(sb.root, "缺卡面.md") });
  assert.equal(out.length, 1, "卡面不可读=不豁免");
});

// ══ SYS-52/SYS-53 挂点接线自证（审验第三向变异存活补锁·设计师 19:58 ②）：去挂点调用→必红 ══
test("④ 挂点接线自证——tickAll 与 serve.tick 均调用 scanClaimStale() 与 pullUpSilentSeats()", () => {
  const src = fs.readFileSync(new URL("../engine.mjs", import.meta.url), "utf-8");
  const lines = src.split("\n");
  const tickLine = lines.find((l) => l.includes("const tickAll = async"));
  const serveLine = lines.find((l) => l.includes('fault("serve.tick"'));
  assert.ok(tickLine, "tickAll 行缺失");
  assert.ok(serveLine, "serve.tick 行缺失");
  for (const [name, line] of [["tickAll", tickLine], ["serve.tick", serveLine]]) {
    assert.ok(line.includes("scanClaimStale();"), `${name} 未挂 scanClaimStale()（SYS-52 接线断）`);
    assert.ok(line.includes("pullUpSilentSeats();"), `${name} 未挂 pullUpSilentSeats()（SYS-53 接线断）`);
  }
});
