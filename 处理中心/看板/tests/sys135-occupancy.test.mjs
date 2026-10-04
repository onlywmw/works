// SYS-135 契约：真机占用闸（占/放/查＋--force 留痕）＋ precheck ⓪ 前置占用检查（拒跑/自持/--force）＋ wm 覆盖读数判据。
// 隔离：登记件走 MOV_SYS135_REG 临时件（零真账动作）；wm 读数走注入 runner（零设备动作）；precheck 跑假序列 + 空 keys（不触真机/网络）。
// 变异锚（隔离副本亲杀）：①去掉 ⓪ 他人在用分支 ⇒ 用例②必红；②_forceLog 不落盘 ⇒ 用例③必红；③Override 行不判 ⇒ 用例④必红。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const SYS = path.resolve(import.meta.dirname, "..", "..", "..");
const TOOL = path.join(SYS, "处理中心", "机器闸", "checks", "真机占用.mjs");
const PRE = path.join(SYS, "处理中心", "机器闸", "checks", "precheck-l23.mjs");
const mkReg = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys135-")), "真机占用.json");
const NOKEYS = path.join(os.tmpdir(), "mov-sys135-no-such-keys.json");
const call = (tool, reg, args) => {
  try { return { rc: 0, out: execFileSync("node", [tool, ...args], { encoding: "utf-8", env: { ...process.env, MOV_SYS135_REG: reg } }) }; }
  catch (e) { return { rc: e.status ?? 1, out: String(e.stdout || "") + String(e.stderr || "") }; }
};
const tool = (reg, ...a) => call(TOOL, reg, a);
const pre = (reg, ...a) => call(PRE, reg, [...a, "--keys", NOKEYS]);
const readReg = (reg) => JSON.parse(fs.readFileSync(reg, "utf-8"));

test("SYS-135 ① 占/查/放：占写在案、查显示、放清空（挪清不受 adb 有无影响）", () => {
  const reg = mkReg();
  const a = tool(reg, "占", "--serial", "T-1", "--who", "甲", "--for", "10", "--why", "单测");
  assert.equal(a.rc, 0, a.out);
  assert.match(a.out, /已占用 T-1/);
  assert.equal(readReg(reg)["T-1"].who, "甲");
  assert.match(tool(reg, "查", "--serial", "T-1").out, /甲/);
  const b = tool(reg, "放", "--serial", "T-1", "--who", "甲", "--adb", "no-such-adb");
  assert.equal(b.rc, 2, "adb 不可用=环境错 rc=2（≠判据红·口径 12）");
  assert.match(b.out, /找不到可用 adb/);
  assert.match(b.out, /已放 T-1/);
  assert.equal(readReg(reg)["T-1"], undefined, "放后登记已清");
});

test("SYS-135 ② 反例·他人在用：占被拒＋precheck ⓪ 拒跑点名（rc≠0·不触设备）", () => {
  const reg = mkReg();
  tool(reg, "占", "--serial", "T-2", "--who", "甲");
  const x = tool(reg, "占", "--serial", "T-2", "--who", "乙");
  assert.notEqual(x.rc, 0);
  assert.match(x.out, /甲/);
  assert.equal(readReg(reg)["T-2"].who, "甲", "拒占后登记不动");

  const p = pre(reg, "--serial", "T-2", "--who", "乙");
  assert.notEqual(p.rc, 0);
  assert.match(p.out, /⓪ 占用检查/);
  assert.match(p.out, /他人在用/);
  assert.match(p.out, /甲/);
  assert.match(p.out, /被 ⓪ 阻塞/, "拒跑：后面的项不跑");
  assert.match(p.out, /PRECHECK L23 FAIL/);
});

test("SYS-135 ③ --force 越过：放行＋_forceLog 留痕；同名（自持）⇒ ⓪ 绿", () => {
  const reg = mkReg();
  tool(reg, "占", "--serial", "T-3", "--who", "甲");
  const x = tool(reg, "占", "--serial", "T-3", "--who", "乙", "--force");
  assert.equal(x.rc, 0, x.out);
  const log = readReg(reg)._forceLog;
  assert.equal(log.length, 1, "越过必留痕");
  assert.match(log[0].skipped.join(" "), /甲/);
  assert.equal(readReg(reg)["T-3"].who, "乙");

  const p = pre(reg, "--serial", "T-3", "--who", "乙");
  assert.match(p.out, /✅ ⓪ 占用检查 —— 自持/);
  assert.doesNotMatch(p.out, /他人在用/);
});

test("SYS-135 ④ precheck --force：越过他人在用＋留痕进 _forceLog", () => {
  const reg = mkReg();
  tool(reg, "占", "--serial", "T-4", "--who", "甲");
  const p = pre(reg, "--serial", "T-4", "--who", "乙", "--force");
  assert.match(p.out, /--force 越过他人在用/);
  assert.equal(readReg(reg)._forceLog.length, 1);
  assert.match(readReg(reg)._forceLog[0].skipped.join(" "), /甲/);
  assert.equal(readReg(reg)["T-4"].who, "甲", "越过≠夺占：原登记不动");
});

test("SYS-135 ⑤ 覆盖读数判据：Override 行 ⇒ 判残留；Physical-only ⇒ 判干净（注入 runner·零设备）", async () => {
  const M = await import(pathToFileURL(TOOL).href);
  const stub = (size, density) => (cmd, args) => ({ ok: true, out: args.includes("size") ? size : density });
  const dirty = M.wmRead("stub", "S", stub("Physical size: 720x1600\nOverride size: 720x1280", "Physical density: 320"));
  assert.equal(dirty.sizeOverride, true);
  assert.equal(dirty.densityOverride, false);
  const density = M.wmRead("stub", "S", stub("Physical size: 720x1600", "Physical density: 320\nOverride density: 240"));
  assert.equal(density.sizeOverride, false);
  assert.equal(density.densityOverride, true);
  const clean = M.wmRead("stub", "S", stub("Physical size: 720x1600", "Physical density: 320"));
  assert.equal(clean.sizeOverride || clean.densityOverride, false, "回物理值=干净");
});
