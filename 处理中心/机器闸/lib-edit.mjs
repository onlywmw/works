#!/usr/bin/env node
// lib-edit.mjs —— 改「账本类长文件」的安全通道（2026-09-28 立·因"切片混用坐标系把工单库截成 45 行"）
//
// 取 Aider/jj/pre-commit 三家的精华，落到我们这套纯文件体系：
//   · 结构化替代自由切片：改动必须写成**独立脚本**（可评审/可重放），由本工具跑；
//   · 每步快照：改动前自动备份（时间戳），异常**自动回滚**；
//   · 改后自证：行数缩水/卡数减少/结构破损/语法错 ⇒ 一律判失败并回滚。
//
// 用法：
//   node lib-edit.mjs --file <目标文件> --py <改动脚本.py> [--expect-cards N] [--allow-shrink 0.1] [--no-rollback]
// 约定：`--py` 脚本自行读写目标文件（目标路径经环境变量 LIB_EDIT_TARGET 传入，脚本内用它，别硬编码）。
// R2 写锁（2026-10-04 工单系统重构）：与 set-status.py 同协议——<目标>.lock（O_EXCL 原子建·30s 排队·
//   15min 僵锁破锁留痕）；备份→改动→自证全程持锁；任何退出路径（含失败回滚后）释放。
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));

const opt = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const TARGET = opt("--file"), SCRIPT = opt("--py");
const EXPECT = opt("--expect-cards") ? Number(opt("--expect-cards")) : null;
const SHRINK = Number(opt("--allow-shrink", "0.1"));
const NO_ROLLBACK = process.argv.includes("--no-rollback");
if (!TARGET || !SCRIPT) { console.error("用法：--file <目标> --py <脚本.py> [--expect-cards N] [--allow-shrink 0.1]"); process.exit(2); }

// ── R2 写锁（与 set-status.py 跨语言同协议）──
const LOCK = TARGET + ".lock";
const LOCK_WAIT_SEC = Number(process.env.LIB_EDIT_LOCK_WAIT || "30");
const LOCK_STALE_SEC = 900;
function acquireLock() {
  const deadline = Date.now() + LOCK_WAIT_SEC * 1000;
  for (;;) {
    try {
      const fd = fs.openSync(LOCK, "wx");
      fs.writeSync(fd, `${process.pid} ${new Date().toISOString()}`);
      fs.closeSync(fd);
      return;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      let age = 0;
      try { age = (Date.now() - fs.statSync(LOCK).mtimeMs) / 1000; } catch {}
      if (age > LOCK_STALE_SEC) {
        const stale = `${LOCK}.stale-${Math.floor(Date.now() / 1000)}`;
        try { fs.renameSync(LOCK, stale); console.log(`⚠ 破僵锁（>${LOCK_STALE_SEC}s 未更新·疑持有者已死）→ 留痕 ${path.basename(stale)}`); } catch {}
      }
      if (Date.now() > deadline) { console.error(`✗ 写锁超时（${LOCK_WAIT_SEC}s）：${path.basename(LOCK)} 被他人持有——稍后重试`); process.exit(1); }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
    }
  }
}
const releaseLock = () => { try { fs.unlinkSync(LOCK); } catch {} };

const stat = (s) => ({
  lines: s.split("\n").length,
  cards: (s.match(/^# (?:UPG|SYS)-\d+ /gm) || []).length,
  h2: (s.match(/^## /gm) || []).length,
  endsNL: s.endsWith("\n"),
});

acquireLock(); // R2：备份→改动→自证全程持锁；下方所有退出路径 finally 释放
let lockReleased = false;
const releaseOnce = () => { if (!lockReleased) { lockReleased = true; releaseLock(); } };
process.on("exit", releaseOnce);

try {

const before = fs.readFileSync(TARGET, "utf8");
const b = stat(before);
// 备份落点固定化（2026-09-29 巡检台轮6 F1 红·目标在受闸根层时就地 .bak=越界）：统一落 处理中心/归档/_备份归档/libedit/；
// 时戳改本地（原 UTC 与本地相差 8h·显示如 1448 vs 本地 22:48·误导排查）。
const ts = (() => { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; })();
const bakDir = path.join(HERE, "..", "归档", "_备份归档", "libedit");
fs.mkdirSync(bakDir, { recursive: true });
const bak = path.join(bakDir, `${path.basename(TARGET)}.bak-${ts}`);
fs.copyFileSync(TARGET, bak);
console.log(`① 已备份：${path.basename(bak)}（改前：${b.lines} 行·${b.cards} 卡·${b.h2} 个二级标题）`);

// ② 跑改动脚本（结构化、可重放）
const r = spawnSync("python", [SCRIPT], { encoding: "utf8", env: { windowsHide: true, ...process.env, LIB_EDIT_TARGET: TARGET } });
if (r.status !== 0) {
  console.error(`✗ 改动脚本退出码 ${r.status}——回滚\n${(r.stdout || "") + (r.stderr || "")}`.slice(0, 1200));
  if (!NO_ROLLBACK) fs.copyFileSync(bak, TARGET);
  process.exit(1);
}

// ③ 改后自证
const after = fs.readFileSync(TARGET, "utf8");
const a = stat(after);
const problems = [];
if (!after.trim()) problems.push("文件为空");
if (!a.endsNL) problems.push("结尾缺换行");
if (a.lines < b.lines * (1 - SHRINK)) problems.push(`行数异常缩水：${b.lines} → ${a.lines}（阈值 ${(SHRINK * 100).toFixed(0)}%）`);
if (a.cards < b.cards) problems.push(`卡数减少：${b.cards} → ${a.cards}`);
if (EXPECT !== null && a.cards !== EXPECT) problems.push(`卡数不符：期望 ${EXPECT}·实得 ${a.cards}`);
if (a.h2 < b.h2) problems.push(`二级标题减少：${b.h2} → ${a.h2}`);

console.log(`② 自证：${a.lines} 行（Δ${a.lines - b.lines}）·${a.cards} 卡（Δ${a.cards - b.cards}）·${a.h2} 二级标题（Δ${a.h2 - b.h2}）`);
if (problems.length) {
  console.error("✗ 自证不过：\n   - " + problems.join("\n   - "));
  if (!NO_ROLLBACK) { fs.copyFileSync(bak, TARGET); console.error(`↩ 已回滚（备份保留：${path.basename(bak)}）`); }
  process.exit(1);
}
console.log(`✅ 通过（备份保留可回溯：${path.basename(bak)}）`);

} finally {
  releaseOnce();
}
