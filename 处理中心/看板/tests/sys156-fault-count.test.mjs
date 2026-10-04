// SYS-156 夹具：fault() 计数与落盘对账（①写败不虚增 ②启动轮转归零 ③正常路径 N 行==N 计数）。
// 隔离树纪律：tmp 下复制「引擎＋依赖」成沙箱树，FAULT_LOG/故障归档/心跳全在沙箱——真 故障.log/心跳.json 零触（SYS-91 红线同口径）。
// 变异锚（④·两读数：改前虚增→改后不虚增／改前不归零→改后归零）：计数移回 append 之前＝A1；启动去归零＝A2。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const BOARD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REL = ["engine.mjs", "board-data.mjs", "值守池.mjs", path.join("lib", "envelope.mjs"), path.join("lib", "seat-thresh.mjs")]; // SYS-176：engine 新增引阈值单源 ⇒ 沙箱依赖同步

function sandbox(engineSrc) { // engineSrc=变异体源码（空=用仓内当前件）
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys156-"));
  const board = path.join(root, "处理中心", "看板");
  for (const rel of REL) {
    const dst = path.join(board, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    if (rel === "engine.mjs" && engineSrc) fs.writeFileSync(dst, engineSrc, "utf-8");
    else fs.copyFileSync(path.join(BOARD, rel), dst);
  }
  // SYS-156 O-1（合并位加注·2026-10-01）：沙箱树只含「引擎＋依赖」⇒ 引擎启动自检（机器闸/工具自检.mjs）必缺件，
  // 沙箱日志里会打「⚠️ 工具自检未过」——那是合成树噪声，与本夹具结论无关（后席免误读为夹具失败）。放空壳让其静默通过。
  const gate = path.join(root, "处理中心", "机器闸", "工具自检.mjs");
  fs.mkdirSync(path.dirname(gate), { recursive: true });
  fs.writeFileSync(gate, "", "utf-8");
  return { board, engine: path.join(board, "engine.mjs"), log: path.join(board, "故障.log"), archive: path.join(board, "故障归档") };
}
const day = () => new Date().toLocaleDateString("sv-SE");
async function loadEngine(box, { main = false } = {}) { // main=true：顶 argv 触发 IS_MAIN 启动段（cmd=status 只读，沙箱无单 ⇒ 零输出）
  const argv = process.argv;
  if (main) process.argv = [process.execPath, box.engine, "status"];
  try { return await import(pathToFileURL(box.engine).href); } finally { process.argv = argv; }
}
const lines = (p) => fs.readFileSync(p, "utf-8").split("\n").filter(Boolean).length;
const muteStderr = (fn) => { const w = process.stderr.write; const buf = []; process.stderr.write = (s) => { buf.push(String(s)); return true; }; try { fn(); } finally { process.stderr.write = w; } return buf; };

test("① 写败不虚增：append 必败（坏路径·隔离）→ 计数不动＋stderr 留痕", async () => {
  const box = sandbox();
  fs.writeFileSync(box.log, `[${day()} 00:00:00] 种子: x\n`, "utf-8");
  const m = await loadEngine(box);
  assert.equal(m.__faultCount(), 1, "起始读数=故障.log 行数");
  m.fault("正常一发", new Error("boom"));
  assert.equal(m.__faultCount(), 2, "写成功 → 计数 +1");
  assert.equal(lines(box.log), 2);
  fs.rmSync(box.log); fs.mkdirSync(box.log); // 故障.log 变目录 ⇒ append 必败
  const errs = muteStderr(() => { m.fault("写败甲", new Error("disk full")); m.fault("写败乙", new Error("disk full")); });
  assert.equal(m.__faultCount(), 2, "两发写败：计数不虚增（改后读数 2；改前读数 4 见 ④）");
  assert.equal(errs.filter((l) => l.includes("[fault]")).length, 2, "最小痕迹：每发一行 stderr（禁递归 fault）");
});

test("② 启动轮转归零：跨日旧段 → 归档含旧段＋计数=0", async () => {
  const box = sandbox();
  fs.writeFileSync(box.log, "[2020-01-01 00:00:00] 旧段甲: x\n[2020-01-01 00:00:01] 旧段乙: y\n", "utf-8");
  const m = await loadEngine(box, { main: true });
  assert.equal(m.__faultCount(), 0, "启动轮转 ⇒ 计数同步归零（改后读数 0；改前读数 2 见 ④）");
  assert.equal(fs.readFileSync(box.log, "utf-8"), "", "主文件清空、新段从 0 计");
  const seg = path.join(box.archive, "故障_20200101.log");
  assert.ok(fs.existsSync(seg), "归档件在位");
  assert.equal(lines(seg), 2, "归档含旧段两行");
});

test("③ 正常路径：N 次调用 → 故障.log 恰 N 行＋计数==N", async () => {
  const box = sandbox();
  fs.writeFileSync(box.log, "", "utf-8");
  const m = await loadEngine(box);
  for (let i = 0; i < 5; i++) m.fault(`正常${i}`, new Error("e" + i));
  assert.equal(lines(box.log), 5, "故障.log 恰 5 行");
  assert.equal(m.__faultCount(), 5, "计数==行数（心跳 faults 对账）");
});

test("④ 变异亲杀：A1 计数移回 append 之前（虚增）／A2 启动去归零（不归零）", async () => {
  const src = fs.readFileSync(path.join(BOARD, "engine.mjs"), "utf-8");
  const A1 = "try { fs.appendFileSync(target, line); if (target === FAULT_LOG) faultCount++; }";
  const A2 = "if (r) { faultCount = 0; ";
  assert.ok(src.includes(A1) && src.includes(A2), "变异锚在位（源码结构变动需同步本夹具）");
  // 改前①：先计数后写（写败静默虚增）
  const box1 = sandbox(src.replace(A1, "if (target === FAULT_LOG) faultCount++; try { fs.appendFileSync(target, line); }"));
  fs.writeFileSync(box1.log, `[${day()} 00:00:00] 种子: x\n`, "utf-8");
  const m1 = await loadEngine(box1);
  m1.fault("正常一发", new Error("boom"));
  fs.rmSync(box1.log); fs.mkdirSync(box1.log);
  muteStderr(() => { m1.fault("写败甲", new Error("x")); m1.fault("写败乙", new Error("x")); });
  assert.equal(m1.__faultCount(), 4, "改前读数：写败两发仍虚增（1+1+2=4）——①判据有区分性");
  // 改前②：只轮不零
  const box2 = sandbox(src.replace(A2, "if (r) { "));
  fs.writeFileSync(box2.log, "[2020-01-01 00:00:00] 旧段甲: x\n[2020-01-01 00:00:01] 旧段乙: y\n", "utf-8");
  const m2 = await loadEngine(box2, { main: true });
  assert.equal(m2.__faultCount(), 2, "改前读数：启动轮转后计数仍为旧段行数（不归零）——②判据有区分性");
});
