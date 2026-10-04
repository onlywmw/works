#!/usr/bin/env node
// run-contracts.mjs —— R0 机器闸特征测试网（2026-10-04 立·工单系统重构 R0）
//
// 定位：**特征测试（characterization）**——固化各闸「现有 CLI 行为契约」（子命令/退出码/关键输出标记），
//       不评判对错、不修疑似 bug（R0 纪律）；后续 R1/R2/R4 改造后本套件必须保持全绿（行为零漂移）。
// 断言口径：**形状断言**（rc + 关键标记子串），非全文 golden——时间戳/计数类输出天然漂移，不纳契约。
//
// 分层（v3 R0 验收口径=CLI 全集·不只 --check 子集）：
//   A 沙盒契约（tests/contracts/fixture-library.md 复制到 tests/.tmp/·每用例新拷贝）：set-status 写闸六拒一成
//   B 沙盒契约：dispatch-lint（--file）/ delivery-drift-check（--lib）
//   C 真面只读形状：layout-check / sync-orders --check / 工具自检 --sys-only
//   D 未覆盖面与原因见 tests/README.md 覆盖表（tier C：环境依赖件）
//
// 用法：node 处理中心/机器闸/tests/run-contracts.mjs [--only A|B|C|<用例名>]
// 退出码：0=全绿 ｜ 1=有红 ｜ 2=环境错。结果审计快照落 tests/contracts/last-run.json。
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATES = path.resolve(HERE, "..");
const ROOT = path.resolve(GATES, "..", "..");
const FIXTURE = path.join(HERE, "contracts", "fixture-library.md");
const TMP = path.join(HERE, ".tmp");

const ENV = { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" };
const only = (() => { const i = process.argv.indexOf("--only"); return i > 0 ? process.argv[i + 1] : null; })();

function freshSandbox(tag) {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
  const sb = path.join(TMP, `sb-${tag}.md`);
  fs.copyFileSync(FIXTURE, sb);
  return sb;
}
function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", env: ENV, timeout: 120_000, ...opts });
  return { rc: r.status, out: `${r.stdout || ""}${r.stderr || ""}` };
}
function blockOf(file, ticket) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const start = lines.findIndex(l => l.startsWith(`# ${ticket} `));
  if (start < 0) return null;
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) if (/^# [A-Z][A-Z0-9]*-\d+\s/.test(lines[j])) { end = j; break; }
  return lines.slice(start, end).join("\n");
}
const cardCount = (file) => (fs.readFileSync(file, "utf8").match(/^# (?:TST|SYS)-\d+ /gm) || []).length;

// ---------------- 用例注册 ----------------
const CASES = [];
const t = (suite, name, fn) => CASES.push({ suite, name, fn });

// —— A 组：set-status 写闸（沙盒）——
function ss(sb, args) { return run("python", [path.join(GATES, "set-status.py"), ...args, "--lib", sb]); }

t("A", "A1 show 现存卡→rc0+phase", () => {
  const sb = freshSandbox("a1");
  const r = ss(sb, ["TST-001", "--show"]);
  return r.rc === 0 && /phase/.test(r.out);
});
t("A", "A2 show 未知卡→rc1+库中无卡", () => {
  const sb = freshSandbox("a2");
  const r = ss(sb, ["TST-999", "--show"]);
  return r.rc === 1 && r.out.includes("库中无卡");
});
t("A", "A3 错挂分支→rc1+归属校验", () => {
  const sb = freshSandbox("a3");
  const r = ss(sb, ["TST-001", "--phase", "in_progress", "--branch", "feat/zzz"]);
  return r.rc === 1 && r.out.includes("归属校验");
});
t("A", "A4 非法迁移 closed←registered→rc1+迁移校验", () => {
  const sb = freshSandbox("a4");
  const r = ss(sb, ["TST-001", "--phase", "closed"]);
  return r.rc === 1 && r.out.includes("迁移校验");
});
t("A", "A5 delivered 缺 delivery_id→rc1+交付门", () => {
  const sb = freshSandbox("a5");
  const r = ss(sb, ["TST-001", "--phase", "delivered"]);
  return r.rc === 1 && r.out.includes("交付门");
});
t("A", "A6 delivered 缺报告原件→rc1+报告闸", () => {
  const sb = freshSandbox("a6");
  const r = ss(sb, ["TST-001", "--phase", "delivered", "--delivery-id", "DEL-TST001-20261004-001"]);
  return r.rc === 1 && r.out.includes("报告闸");
});
t("A", "A7 沙盒旗标指真库→rc1+拒收（SYS-104 fail-closed）", () => {
  const r = run("python", [path.join(GATES, "set-status.py"), "TST-001", "--phase", "in_progress", "--lib", path.join("处理中心", "工单库.md")]);
  return r.rc === 1 && r.out.includes("沙盒旗标指向真库");
});
t("A", "A8 主路径写入→rc0+沙盒零真写+读回三验（目标变更/旁观卡原样/卡数不变）", () => {
  const sb = freshSandbox("a8");
  const before003 = blockOf(sb, "TST-003");
  const r = ss(sb, ["TST-001", "--phase", "in_progress", "--branch", "feat/tst001", "--note", "契约测试写入"]);
  const ok = r.rc === 0 && r.out.includes("沙盒") && r.out.includes("phase=in_progress");
  const b1 = blockOf(sb, "TST-001") || "";
  const b3 = blockOf(sb, "TST-003") || "";
  return ok
    && /phase:\s*in_progress/.test(b1) && /branch:\s*feat\/tst001/.test(b1)
    && b3 === before003
    && cardCount(sb) === 3;
});

// —— B 组：派单完整性 / 树漂移（沙盒）——
t("B", "B1 dispatch-lint 空壳卡→rc1+点名 SYS-99002（现卡头正则仅认 UPG|SYS——TST 段不可见，亦为契约）", () => {
  const sb = freshSandbox("b1");
  const r = run("node", [path.join(GATES, "dispatch-lint.mjs"), "--file", sb]);
  return r.rc === 1 && r.out.includes("SYS-99002");
});
t("B", "B2 delivery-drift 无树锚→rc0+无锚标注", () => {
  const sb = freshSandbox("b2");
  const r = run("node", [path.join(GATES, "delivery-drift-check.mjs"), "--ticket", "TST-001", "--lib", sb]);
  return r.rc === 0 && /无锚|tree_digest|干净/.test(r.out);
});

// —— C 组：真面只读形状 ——
t("C", "C1 layout-check→rc0+PASS 标记", () => {
  const r = run("node", [path.join(GATES, "layout-check.mjs")]);
  return r.rc === 0 && r.out.includes("LAYOUT CHECK PASS");
});
t("C", "C2 sync-orders --check→rc0+表模式已取消口径（现行为契约）", () => {
  const r = run("node", [path.join(GATES, "sync-orders.mjs"), "--check"]);
  return r.rc === 0 && r.out.includes("表模式已取消");
});
t("C", "C3 工具自检 --sys-only→rc0（语法闸全绿）", () => {
  const r = run("node", [path.join(GATES, "工具自检.mjs"), "--sys-only", "--quiet"]);
  return r.rc === 0;
});

// ---------------- 执行 ----------------
const sel = CASES.filter(c => !only || c.suite === only || c.name.startsWith(only));
const results = [];
for (const c of sel) {
  let pass = false, err = null;
  try { pass = !!c.fn(); } catch (e) { err = String(e); }
  results.push({ suite: c.suite, name: c.name, pass, err });
  console.log(`${pass ? "✅" : "❌"} [${c.suite}] ${c.name}${err ? "  ⟵ " + err : ""}`);
}
fs.writeFileSync(path.join(HERE, "contracts", "last-run.json"),
  JSON.stringify({ ran_at: new Date().toISOString(), total: results.length, failed: results.filter(r => !r.pass).length, results }, null, 2), "utf8");
const failed = results.filter(r => !r.pass).length;
console.log(`═══ 契约套件：${results.length - failed}/${results.length} 绿 ${failed ? `（${failed} 红）` : ""}═══`);
if (!failed) { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {} } // 全绿自清沙盒（红时保留现场诊断——核验小注②处置）
process.exit(failed ? 1 : 0);
