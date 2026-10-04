// SYS-145 角色例行产出锚（技能内化 7→3·阶段二）——变异亲杀两向
// 判据（派单 §五.2）：①跳过一周（或产物 mtime 超 7 天）⇒ **咬信必达**；②产物在位 ⇒ **不咬**；③上膛未满 7 天且从无产物 ⇒ 不咬（防首装即误咬·留痕）
// 跑法：node --test 处理中心/看板/tests/sys145-routine-anchor.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { watchdog, __testResetWatchdog, __testResetSpriteBite } from "../engine.mjs";

const NOW = Date.now();
const DAY = 86400e3;
const TMP = [];
process.on("exit", () => { for (const d of TMP) try { fs.rmSync(d, { recursive: true, force: true }); } catch {} });

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys145-")); TMP.push(root);
  const boxRoot = path.join(root, "邮箱"), seatsDir = path.join(root, "seats"), work = path.join(root, "体系根");
  fs.mkdirSync(path.join(boxRoot, "巡检台", "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  const dir = path.join(work, "设计师", "例行产出");
  fs.mkdirSync(dir, { recursive: true });
  return { root, boxRoot, seatsDir, work, dir, arm: path.join(root, "例行产出锚.json") };
}
const bites = (sb) => fs.readdirSync(path.join(sb.boxRoot, "巡检台", "INBOX"))
  .map((f) => fs.readFileSync(path.join(sb.boxRoot, "巡检台", "INBOX", f), "utf-8"))
  .filter((t) => t.includes("type: 疯狗"));

/** 跑一轮 watchdog（只开例行产出锚：稳态窗/无停滞件） */
function run(sb, { armedAt } = {}) {
  __testResetWatchdog(); __testResetSpriteBite();
  if (armedAt !== undefined) fs.writeFileSync(sb.arm, JSON.stringify({ armedAt: new Date(armedAt).toISOString() }), "utf-8");
  fs.writeFileSync(path.join(sb.root, "疯狗.json"), JSON.stringify({ _lastAt: new Date(NOW).toISOString() }), "utf-8");
  const watchFile = path.join(sb.root, "看门狗.json");
  fs.writeFileSync(watchFile, JSON.stringify({ at: new Date(NOW).toLocaleString("sv-SE"), ok: true }), "utf-8");
  const suppressed = [];
  watchdog({ ledger: { active: [] } }, {
    force: true, now: NOW, boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, watchFile,
    dogFile: path.join(sb.root, "疯狗.json"), scoresFile: path.join(sb.root, "成绩.json"),
    onAlarm: () => {}, onEscalate: () => {}, noLog: true, sessionMtime: () => NOW - 60e3,
    boardStartedAt: NOW - 3600e3, bootAt: NOW - 3600e3,          // SYS-143：显式窗外（不参与本锚）
    routineFile: sb.arm, routineAnchors: sb.anchors, routineRoot: sb.work, // 沙盒：只锚本测试的落点（根=临时体系根）
  });
  const st = JSON.parse(fs.readFileSync(watchFile, "utf-8"));
  return { bites: bites(sb), suppressed: st.suppressed || [] };
}
function sbWith() {
  const sb = sandbox();
  sb.anchors = [{ role: "设计师", label: "目标对齐复核", dir: path.join("设计师", "例行产出"), re: /^目标对齐复核_\d{4}-\d{2}-\d{2}\.md$/ }];
  return sb;
}

test("SYS-145 ① 产物在位（mtime 新鲜）⇒ 不咬", () => {
  const sb = sbWith();
  fs.writeFileSync(path.join(sb.dir, "目标对齐复核_2026-09-29.md"), "x", "utf-8"); // mtime=now
  const r = run(sb, { armedAt: NOW - 8 * DAY });
  console.log(`  [读数] 在位不咬：bites=${r.bites.length} suppressed=${r.suppressed.length}`);
  assert.equal(r.bites.length, 0, "产物在位（≤7 天）不得咬");
});

test("SYS-145 ② 跳过一周（产物 mtime 8 天前）⇒ 咬信必达（变异亲杀）", () => {
  const sb = sbWith();
  const f = path.join(sb.dir, "目标对齐复核_2026-09-21.md");
  fs.writeFileSync(f, "x", "utf-8");
  fs.utimesSync(f, new Date(NOW - 8 * DAY), new Date(NOW - 8 * DAY)); // 人为「跳周」
  const r = run(sb, { armedAt: NOW - 30 * DAY });
  console.log(`  [读数] 超期必咬：bites=${r.bites.length} 咬信题=${(r.bites[0] || "").match(/re: (.*)/)?.[1] || "-"}`);
  assert.equal(r.bites.length, 1, "产物超 7 天 ⇒ 必咬");
  assert.match(r.bites[0], /目标对齐复核/, "咬信指向该角色例行产物");
});

test("SYS-145 ③ 从未产出：上膛满 7 天 ⇒ 咬；刚上膛 ⇒ 不咬（防首装误咬·留痕）", () => {
  const sb = sbWith();
  const r1 = run(sb, { armedAt: NOW - 8 * DAY });
  assert.equal(r1.bites.length, 1, "上膛满 7 天仍无产物 ⇒ 咬");
  const sb2 = sbWith();
  const r2 = run(sb2, { armedAt: NOW - 1 * DAY });
  console.log(`  [读数] 刚上膛不咬：bites=${r2.bites.length}`);
  assert.equal(r2.bites.length, 0, "上膛未满 7 天 ⇒ 不咬（防首装即误咬）");
});

test("SYS-145 ④ 首轮上膛留痕（不静默）＋旧「四精灵 fail 挂账」锚已撤（换面锚不越权）", () => {
  const sb = sbWith();
  // 旧锚素材：四精灵主题 fail >24h（换面后不得再据此咬）
  fs.writeFileSync(path.join(sb.root, "成绩.json"), JSON.stringify({
    checks: { "HY-BUG-01": { status: "fail", at: new Date(NOW - 30 * 3600e3).toISOString(), note: "" } },
  }), "utf-8");
  const r = run(sb); // 未传 armedAt ⇒ 首轮上膛
  assert.equal(r.bites.length, 0, "旧 fail 挂账锚已撤 ⇒ 不咬（改由角色例行产物锚管）");
  assert.ok(fs.existsSync(sb.arm), "首轮应写锚件（上膛）");
  assert.ok(JSON.parse(fs.readFileSync(sb.arm, "utf-8")).armedAt, "锚件含 armedAt");
});
