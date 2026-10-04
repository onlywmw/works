// 测试出口零真信 · 通检（SYS-62 交付附件·防「升用户/五号-pi」同族泄漏回潮）
// 跑法：node 处理中心/看板/tests/check-test-exit-zero.mjs
// 原理：快照「真出口」（各角色 INBOX 信件集 + 单目录通报集）→ 跑全量测试 → 对比；
//   任何新增/变动 = 测试向真邮局/真单目录发射了 → 红。故障.log 由在跑引擎合法写入，仅示警不判红。
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const TESTS = path.dirname(fileURLToPath(import.meta.url));
const BOARD = path.resolve(TESTS, "..");
const snap = () => {
  const out = {};
  const boxRoot = path.join(BOARD, "..", "邮局", "邮箱");
  for (const role of fs.readdirSync(boxRoot)) {
    try { out[`邮箱/${role}/INBOX`] = fs.readdirSync(path.join(boxRoot, role, "INBOX")).sort().join("|"); } catch {}
  }
  const danDir = path.join(BOARD, "单");
  const walk = (d, pre) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, `${pre}${e.name}/`);
      else out[`单/${pre}${e.name}`] = 1;
    }
  };
  try { walk(danDir, ""); } catch {}
  return out;
};
const before = snap();
let testCode = 0, suiteLine = "";
try {
  const so = execFileSync(process.execPath, ["--test"], { cwd: TESTS, encoding: "utf8", timeout: 900000 });
  suiteLine = (so.match(/# (tests|pass|fail) \d+/g) || []).join(" ");
} catch (e) { testCode = e.status ?? 1; suiteLine = (String(e.stdout || "") + String(e.stderr || "")).match(/# (tests|pass|fail) \d+/g)?.join(" ") || ""; }
const after = snap();
const changed = [];
for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
  if (!(k in before)) changed.push(`+${k}`);
  else if (!(k in after)) changed.push(`-${k}`);
  else if (String(before[k]) !== String(after[k])) changed.push(`~${k}`);
}
// 两面分列（审验 2zs 附记·设计师采纳）：①套件色=测试自身 ②隔离面=真出口变动
// 签名判红（合成夹具/假 pid）→ RED；真交通 → WARN 不判红
const SYNTH = /合成|测试席|五号-pi|四号-pi|六号-pi|八号-pi|九号-pi|UPG-G|LTR-TG|9999999+/;
const bad = [], warn = [];
for (const c of changed) {
  const rel = c.slice(1);
  let raw = "";
  try { raw = fs.readFileSync(path.join(BOARD, rel), "utf-8").slice(0, 600); } catch {}
  (SYNTH.test(raw) || SYNTH.test(rel) ? bad : warn).push(c);
}
console.log("── 套件色（测试自身） ──");
console.log(testCode === 0 ? `[GREEN] 全量绿 ${suiteLine}` : `[RED] 全量未绿 ${suiteLine}`);
console.log("── 隔离面（真出口） ──");
if (!changed.length) console.log("[GREEN] 真邮局各 INBOX / 真单目录通报 零变动");
else {
  if (warn.length) { console.log("[WARN] 变动非合成标记（可能为真交通·不判红）："); for (const w of warn) console.log("  " + w); }
  if (bad.length) { console.log("[RED] 合成夹具发射真出口（测试污染）："); for (const b of bad) console.log("  " + b); }
}
if (bad.length || testCode !== 0) process.exit(1);
console.log("[GREEN] 测试出口零真信（两面皆绿）");
