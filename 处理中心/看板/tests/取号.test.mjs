// 取号闸回归测试（SYS-27 撞号案 @2026-09-10）：查号 max+1、立卡原子追加、并发立卡不撞号
// 跑法：node --test 处理中心/看板/tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const QUHAO = path.join(import.meta.dirname, "..", "..", "机器闸", "取号.mjs");
// 2026-09-30 S2 适配：取号已双账扫描（本账+对侧账）——测试须把对侧账也指进沙盒（不存在路径=容错 0，恢复纯本账语义；否则会扫真·网页体系库得 SYS-154）
const run = (lib, args) => execFileSync("node", [QUHAO, ...args, "--lib", lib, "--lib-an", path.join(path.dirname(lib), "对侧沙盒不存在.md")], { encoding: "utf-8" }).trim();
const F = ["--bv", "3", "--tc", "2", "--rr", "2", "--size", "1"]; // SYS-59：立卡必填 WSJF 四因子
const mkLib = (content = "") => { const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mov-quhao-")), "工单库.md"); fs.writeFileSync(p, content, "utf-8"); return p; };

test("取号① 空仓从 1 起，全文扫描取 max+1（含正文提及）", () => {
  const lib = mkLib("# SYS-3 老三\n\n正文里提过 SYS-27 和 SYS-28 的撞号事故\n");
  assert.equal(run(lib, ["下一个", "SYS"]), "SYS-29", "正文提及也要计入（宁可跳号不撞号）");
  assert.equal(run(mkLib(""), ["下一个", "UPG"]), "UPG-1");
});

test("取号② 单字母前缀不误匹配（S/W 要词边界）", () => {
  const lib = mkLib("# SYS-5 x\n\nSHOW-12 与 REW-7 不算 S/W 系票\n");
  assert.equal(run(lib, ["下一个", "S"]), "S-1", "SHOW-12 里的 S- 不算数");
  assert.equal(run(lib, ["下一个", "SYS"]), "SYS-6");
});

test("取号③ 立卡原子追加卡骨架，连取连不撞", () => {
  const lib = mkLib("# SYS-28 已有卡\n");
  assert.equal(run(lib, ["立卡", "SYS", "测试卡甲", "引子甲", ...F]).startsWith("✅ 立卡 SYS-29"), true);
  assert.equal(run(lib, ["立卡", "SYS", "测试卡乙", ...F]).startsWith("✅ 立卡 SYS-30"), true);
  const raw = fs.readFileSync(lib, "utf-8");
  assert.ok(raw.includes("# SYS-29 测试卡甲") && raw.includes("# SYS-30 测试卡乙"), "两卡都落账");
  assert.ok(raw.includes("phase: registered") && raw.includes("branch: feat/sys30"), "卡骨架带 status 块");
  assert.ok(!fs.existsSync(lib + ".lock"), "锁文件用完即清");
});

test("取号④ 并发立卡不撞号（SYS-27 撞号案回归锁）", async () => {
  const lib = mkLib("# SYS-28 已有卡\n");
  const go = (t) => new Promise((res, rej) => execFile("node", [QUHAO, "立卡", "SYS", t, ...F, "--lib", lib, "--lib-an", path.join(path.dirname(lib), "对侧沙盒不存在.md")], (e, so) => e ? rej(e) : res(so.trim())));
  const [a, b] = await Promise.all([go("并发甲"), go("并发乙")]);
  const ids = [a.match(/SYS-\d+/)[0], b.match(/SYS-\d+/)[0]];
  assert.notEqual(ids[0], ids[1], "并发两卡必须不同号");
  const raw = fs.readFileSync(lib, "utf-8");
  for (const id of ids) assert.ok(raw.includes(`# ${id} `), `${id} 落账`);
});
