// SYS-176 席位评分 v2 回归（分角色权重／idle 空窗／7 天窗／相位快照差分·夹具直跑）
// 跑法：node --test 处理中心/看板/tests/sys176-seat-score.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SYS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TOOL = path.join(SYS, "巡检台", "_tools", "seat-score.mjs");
const ENGINE = path.join(SYS, "处理中心", "看板", "engine.mjs");
const ROLE5 = ["设计师", "程序员", "验收员", "审验员", "巡检台"];

function mkFixture() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys176-"));
  fs.mkdirSync(path.join(d, "归档"), { recursive: true });
  return d;
}
function letter(dir, id, { from = "程序员", created = new Date().toISOString(), type = "通知", to = "设计师", body = "读数" } = {}) {
  fs.writeFileSync(
    path.join(dir, "归档", `${id}.md`),
    `---\nid: ${id}\nfrom: ${from}\nto: ${to}\ntype: ${type}\ncreated: ${created}\n---\n\n${body}\n`,
  );
}
function ledger(dir, cards) {
  fs.writeFileSync(
    path.join(dir, "工单库.md"),
    cards.map((c) => `# ${c.id} 测试卡${c.title || ""}\n\n\`\`\`status\nphase: ${c.phase}\ndev: —\nupdated_at: ${c.updated || new Date().toISOString()}\n\`\`\`\n`).join("\n"),
  );
}
function runTool(d, toolPath = TOOL) {
  execFileSync(process.execPath, [
    toolPath, "--days", "7",
    "--arch", path.join(d, "归档"),
    "--lib", path.join(d, "工单库.md"),
    "--board", d,
    "--out", path.join(d, "席位表现.json"),
    "--snapshot", path.join(d, "席位相位快照.json"),
  ], { encoding: "utf8" });
  return JSON.parse(fs.readFileSync(path.join(d, "席位表现.json"), "utf8"));
}
// SYS-176：Node 22 (nvm4w) 在中文文件名目录上 fs.cpSync 原生崩溃（0xC0000409·已实测）——夹具改用逐件复制
function cpTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.isDirectory()) cpTree(path.join(src, e.name), path.join(dst, e.name));
    else fs.copyFileSync(path.join(src, e.name), path.join(dst, e.name));
  }
}
const ymd = (offsetDays) => {
  const t = new Date(Date.now() + offsetDays * 864e5);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};
const enough = (d, from) => { for (let i = 0; i < 12; i++) letter(d, `${from}-${i}`, { from }); };

// ── ① 默认窗口/词表/首跑诚实态 ──
test("SYS-176 默认 7 天窗＋词表载入；首跑无相位基线 ⇒ progress=null（诚实态）", () => {
  const d = mkFixture();
  enough(d, "程序员");
  ledger(d, [{ id: "UPG-1", phase: "delivered" }]);
  const out = runTool(d);
  assert.equal(out.window_days, 7, "默认窗口须为 7 天");
  assert.equal(out.lexicon, "安卓中国体系建设.json", "体系词表须生效");
  assert.equal(out.progress_baseline, null, "首跑无基线");
  for (const r of ROLE5) assert.equal(out.scores[r].progress, null, `${r} 首跑 progress 须为 null`);
});

// ── ② idle 空窗（无活可干 ≠ 表现差） ──
test("SYS-176 idle：近窗 sent < 阈值 ⇒ state=idle·value=null（看板画「无数据」）", () => {
  const d = mkFixture();
  enough(d, "程序员");
  letter(d, "HY-1", { from: "巡检台" }); // 巡检台近窗仅 1 封信 < 10
  ledger(d, [{ id: "UPG-1", phase: "delivered" }]);
  const out = runTool(d);
  assert.equal(out.scores["程序员"].state, "ok");
  assert.equal(out.scores["巡检台"].state, "idle");
  assert.equal(out.scores["巡检台"].value, null, "idle 不得出分");
  assert.equal(out.scores["巡检台"].threshold, 10);
});

// ── ③ 相位快照差分（合并 10 单 > 合并 2 单）＋打回扣分 ──
test("SYS-176 差分：旧快照 audited → 今日 merged ⇒ 相位事件计分；10 单 > 2 单", () => {
  const make = (n) => {
    const d = mkFixture();
    enough(d, "设计师");
    const cards = Array.from({ length: n }, (_, i) => ({ id: `UPG-${100 + i}`, phase: "merged" }));
    ledger(d, cards);
    const prev = Object.fromEntries(cards.map((c) => [c.id, "audited"]));
    fs.writeFileSync(path.join(d, "席位相位快照.json"), JSON.stringify({ [ymd(-1)]: prev }, null, 1));
    return runTool(d);
  };
  const out10 = make(10);
  const out2 = make(2);
  assert.equal(out10.progress_baseline, ymd(-1), "基线取最近旧日期");
  assert.equal(out10.phase_events.length, 10);
  assert.equal(out10.scores["设计师"].progress, 30, "10×merged(+3) ⇒ progress=30");
  assert.equal(out2.scores["设计师"].progress, 6);
  assert.ok(out10.scores["设计师"].value > out2.scores["设计师"].value, "合并 10 单须高于合并 2 单");
});

test("SYS-176 差分：打回信 to=被扣方 ⇒ progress −3（join 邮局归档）", () => {
  const d = mkFixture();
  enough(d, "程序员");
  letter(d, "RB-1", { from: "验收员", to: "程序员", type: "打回", body: "修复后再发" });
  ledger(d, [{ id: "UPG-9", phase: "delivered" }]);
  fs.writeFileSync(path.join(d, "席位相位快照.json"), JSON.stringify({ [ymd(-1)]: { "UPG-9": "dispatched" } }, null, 1));
  const out = runTool(d);
  assert.equal(out.scores["程序员"].progress, 2, "delivered(+5) − 打回(3) = 2");
  assert.equal(out.reject_penalty["程序员"], 3);
});

// ── ④ 过期/缺失 ⇒ 看板诚实态（引擎渲染锚·源码扫描） ──
test("SYS-176 引擎：席位段唯一入口 + 两态文案在场；回落假分分支已删", () => {
  const eng = fs.readFileSync(ENGINE, "utf8");
  assert.ok(/function seatScorePanel\(/.test(eng), "席位读数须有唯一入口 seatScorePanel");
  assert.ok(eng.includes("── 数据待刷新"), "过期态文案须在场");
  assert.ok(eng.includes("── 无数据"), "空窗态文案须在场");
  assert.ok(!eng.includes("hyScore"), "巡检台 78/40 假分分支须删除");
  assert.ok(!eng.includes("70 + (s.seat.on ? 5 : 0)"), "表格侧回落实时结构信号须删除");
  assert.ok(!eng.includes("70 + (done > 3 ? 12 : 0)"), "紧凑侧回落实时结构信号须删除");
  // 自检：注入旧片段 ⇒ 扫描判据必红（变异亲杀）
  const sample = "const hyScore = hyOn ? 78 : 40;";
  assert.ok(/hyScore/.test(sample), "注入旧假分片段 ⇒ 判据须捕获");
  const sample2 = "sc = 70 + (s.seat.on ? 5 : 0) + (load <= 1 ? 15 : 0);";
  assert.ok(/70 \+ \(s\.seat\.on \? 5 : 0\)/.test(sample2), "注入旧回落片段 ⇒ 判据须捕获");
});

// ── ⑤ 引擎读数入口四态（行为直测·夹具文件路径注入） ──
test("SYS-176 引擎 seatScorePanel：ok／idle／过期／缺失／旧版数值 五态", async () => {
  const { seatScorePanel } = await import("../engine.mjs");
  const d = mkFixture();
  const p = path.join(d, "席位表现.json");
  const now = new Date().toISOString();
  const rowOf = (panel, role) => panel.rows.find((r) => r.role === role);
  // ok
  fs.writeFileSync(p, JSON.stringify({ at: now, scores: { 设计师: { value: 77, state: "ok" } } }));
  let panel = seatScorePanel(p);
  assert.equal(rowOf(panel, "设计师").state, "ok");
  assert.equal(rowOf(panel, "设计师").value, 77);
  // idle
  fs.writeFileSync(p, JSON.stringify({ at: now, scores: { 设计师: { value: null, state: "idle" } } }));
  panel = seatScorePanel(p);
  assert.equal(rowOf(panel, "设计师").state, "idle", "idle 须渲染「无数据」");
  // 过期（>24h）
  fs.writeFileSync(p, JSON.stringify({ at: new Date(Date.now() - 2 * 864e5).toISOString(), scores: { 设计师: { value: 77, state: "ok" } } }));
  panel = seatScorePanel(p);
  assert.ok(panel.stale, "过期 ⇒ stale");
  assert.ok(panel.rows.every((r) => r.state === "stale"), "过期 ⇒ 全席「数据待刷新」");
  // 缺失
  fs.rmSync(p);
  panel = seatScorePanel(p);
  assert.ok(panel.stale && panel.rows.every((r) => r.state === "stale"), "缺失 ⇒ 全席待刷新");
  // 旧版单数值兼容
  fs.writeFileSync(p, JSON.stringify({ at: now, scores: { 设计师: 88 } }));
  panel = seatScorePanel(p);
  assert.equal(rowOf(panel, "设计师").value, 88, "旧版数值兼容");
});

// ── ⑥ 单源/同文锚 ──
test("SYS-176 单源：tag 阈值 [75,60] 一处 + 两处同引；词表声明同文", () => {
  const th = fs.readFileSync(path.join(SYS, "处理中心", "看板", "lib", "seat-thresh.mjs"), "utf8");
  assert.ok(/SEAT_THRESH = \[75, 60\]/.test(th), "阈值单源 [75,60]");
  assert.ok(/export const seatTag/.test(th), "tag 函数单源");
  const score = fs.readFileSync(TOOL, "utf8");
  const eng = fs.readFileSync(ENGINE, "utf8");
  assert.ok(/from "\.\.\/\.\.\/处理中心\/看板\/lib\/seat-thresh\.mjs"/.test(score), "seat-score 须引阈值单源");
  assert.ok(/from "\.\/lib\/seat-thresh\.mjs"/.test(eng), "engine 须引阈值单源");
  assert.ok(!/>= 82 \? "好"/.test(score) && !/(82|68)/.test(score.match(/seatTag[\s\S]{0,80}/)?.[0] || ""), "82/68 双写须废");
  const lex = fs.readFileSync(path.join(SYS, "巡检台", "_tools", "seat-lexicon.mjs"), "utf8");
  assert.ok(lex.includes("同文"), "词表件须带「同文」声明（SYS-176 红线）");
  assert.ok(th.includes("同文"), "阈值件须带「同文」声明");
});

// ── ⑥ 变异亲杀：删 idle 分支 ⇒ 空窗席出假分（实跑副本） ──
test("SYS-176 变异锚：删 idle 分支 ⇒ 空窗席不再标 idle（判据必红）", () => {
  const d = mkFixture();
  const sys = path.join(d, "安卓中国体系建设"); // 目录名＝体系名 ⇒ 覆盖词表（含 weights）生效
  fs.mkdirSync(path.join(sys, "归档"), { recursive: true });
  fs.mkdirSync(path.join(sys, "巡检台", "_tools"), { recursive: true });
  fs.mkdirSync(path.join(sys, "处理中心", "看板", "lib"), { recursive: true });
  fs.copyFileSync(path.join(SYS, "巡检台", "_tools", "seat-lexicon.mjs"), path.join(sys, "巡检台", "_tools", "seat-lexicon.mjs"));
  cpTree(path.join(SYS, "巡检台", "_tools", "seat-score-lexicon"), path.join(sys, "巡检台", "_tools", "seat-score-lexicon"));
  fs.copyFileSync(path.join(SYS, "处理中心", "看板", "lib", "seat-thresh.mjs"), path.join(sys, "处理中心", "看板", "lib", "seat-thresh.mjs"));
  const mutant = fs.readFileSync(TOOL, "utf8").replace("if (activity < IDLE_SENT) {", "if (false) {");
  assert.notEqual(mutant, fs.readFileSync(TOOL, "utf8"), "变异点须命中（锚文本已变）");
  const mutantPath = path.join(sys, "巡检台", "_tools", "seat-score.mjs");
  fs.writeFileSync(mutantPath, mutant);
  letter(sys, "HY-1", { from: "巡检台" });
  enough(sys, "程序员");
  ledger(sys, [{ id: "UPG-1", phase: "delivered" }]);
  const out = runTool(sys, mutantPath);
  assert.notEqual(out.scores["巡检台"].state, "idle", "删 idle 分支 ⇒ 空窗席被出分（本判据在真件上为 idle ⇒ 红）");
});
