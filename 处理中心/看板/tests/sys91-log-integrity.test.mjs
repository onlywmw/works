// SYS-91 契约：看板日志可信面（沙盒缝单点 / 日期列 / #合成 / 真件零污染双向断言）。
// 变异锚（亲杀见交付报告 04）：
//   ① 沙盒缝断（logFileFor 忽略 opts）→ ②「真件新增合成行=0」必红；
//   ② 判据退化（leak() 恒空）→ ④ 自检必红；
//   ③ 合成时刻不标 #合成 → ③ 必红。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { sendSpriteBite, logFileFor, logLine, __testResetSpriteBite } from "../engine.mjs";

const BOARD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REAL = path.join(BOARD, "巡铃.log");
const sb = () => fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys91-"));

/** 真件泄漏判据：合成行 = 带 #合成 标记 或 测试夹具席（测试席-）行。 */
const leak = (lines) => lines.filter((l) => l.includes("#合成") || l.includes("测试席-"));
const synthCount = () => leak(fs.readFileSync(REAL, "utf-8").split("\n")).length;

test("SYS-91 ① 沙盒缝单点：opts.logFile 覆盖，kind 映射巡铃/故障", () => {
  const d = sb();
  const f = path.join(d, "x.log");
  assert.equal(logFileFor("巡铃", { logFile: f }), f, "opts.logFile 优先");
  assert.ok(logFileFor("巡铃", {}).endsWith("巡铃.log"));
  assert.ok(logFileFor("故障", {}).endsWith("故障.log"));
  logLine("巡铃", null, "写一行", { logFile: f });
  assert.ok(fs.readFileSync(f, "utf-8").includes("写一行"), "沙盒件收到该行");
});

test("SYS-91 ② 双向断言：沙盒真收咬信 > 0 且真件新增合成行 = 0", () => {
  __testResetSpriteBite();
  const d = sb();
  const log = path.join(d, "巡铃.log");
  const before = synthCount();
  const lid = sendSpriteBite("SYS-91 双向断言", "SYS-91 沙盒双向断言", {
    boxRoot: path.join(d, "邮箱"), logFile: log, cooldownMs: 0, now: Date.now() + 11 * 60e3,
  });
  assert.ok(lid && lid.startsWith("LTR-"), "沙盒信箱须真收咬信（> 0）——防「测试根本不咬了」伪装");
  assert.ok(fs.existsSync(path.join(d, "邮箱", "巡检台", "INBOX", lid + ".md")), "咬信本体落沙盒");
  assert.ok(fs.readFileSync(log, "utf-8").includes("精灵欠账咬"), "沙盒日志收到该行");
  assert.equal(synthCount(), before, "真 巡铃.log 新增合成行 = 0（沙盒缝实证·不判 sha 防活引擎恒红）");
});

test("SYS-91 ③ 日期列 + 合成标记：合成时刻 → #合成；真实钟 → 无标记", () => {
  const d = sb();
  const log = path.join(d, "巡铃.log");
  logLine("巡铃", Date.now() + 11 * 60e3, "精灵欠账咬 ← 合成时刻", { logFile: log });
  logLine("巡铃", null, "精灵欠账咬 ← 真实钟", { logFile: log });
  const [a, b] = fs.readFileSync(log, "utf-8").trim().split("\n");
  assert.match(a, /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/, "新行须带日期列 [YYYY-MM-DD HH:MM:SS]");
  assert.ok(a.endsWith("#合成"), "合成时刻行须带 #合成（未来戳可辨）");
  assert.ok(!b.includes("#合成"), "真实钟行不得带标记");
});

test("SYS-91 ④ 判据自检（变异亲杀）：注入合成行 → 判据必捕获", () => {
  assert.equal(leak(["[2026-09-26 10:00:00] 验收员 ← 1信 r=\"\""]).length, 0, "干净行不误报");
  const injected = ["[2026-09-26 18:00:00] 精灵欠账咬 ← x #合成", "[2026-09-26 18:00:01] 良性 测试席-丙 开窗冷却中"];
  assert.equal(leak(injected).length, 2, "注入合成/测试席行 → 判据须捕获（②/③ 变异自检）");
});

test("SYS-91 ⑤ 窗口计数工具：文件序 2791-2801 → 11 行·派活 6·合成 5（=净 6）", () => {
  if (!fs.existsSync(REAL)) return;
  const r = spawnSync(process.execPath, [path.join(BOARD, "日志窗口计数.mjs"), "--range", "2791-2801"], { encoding: "utf-8" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /11 行 · 派活 6 · 合成 5（=净 6）/, "SYS-90 复盘口径（验收员更正件真值）");
});
