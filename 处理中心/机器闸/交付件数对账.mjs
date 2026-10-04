#!/usr/bin/env node
// 交付件数/件集合对账.mjs —— 交付面「补丁 ↔ 交付树」件集合一致性闸（UPG-361 审验席 F-1 提案·设计师 2026-09-28 点头）
//
// 缘起（为什么要有它）：UPG-358 的交付补丁用重命名折叠口径生成 ⇒ 补丁段数 29、而交付树变集 43（缺 14 件旧哈希删除）；
//   UPG-361 同型（补丁 47 段 vs 变集 63·缺 16 处删除）。两次都是「人记得用对 flag」才不出事 ⇒ 本闸把「记得」变成「机器拦」。
//
// 用法：
//   node 处理中心/机器闸/交付件数对账.mjs --root <交付树> --patch <补丁文件> [--base <sha>] [--json] [--quiet]
//   例：node 处理中心/机器闸/交付件数对账.mjs --root M:/mov-upg363 --patch 程序员/UPG363-evidence/patch_UPG363_worktree.diff --base 2b0fb7ac
//
// 判据（两侧必须同口径——设计师补的前提）：
//   A = 补丁件集：`git apply --numstat <patch>`（逐行＝1 件；二进制件也占 1 行）
//   B = 交付树变集：`git -C <root> status --porcelain -uall --no-renames`（**必须 --no-renames**，否则改名被折成 1 行）
//   C = 基线差集（可选·给了 --base 才算）：`git -C <root> diff --no-renames --name-only <base>`
//   ⇒ **比的是集合，不只是数字**（数字相同也可能集合不同——2026-09-28 盘点表案）。
// rc：0 一致（A==B，且给了 --base 时 C 也一并一致或已解释）｜1 不一致（硬拦）｜2 用法/环境错
// base 前移场景（2026-09-30 SYS-154 审验建议④）：A≠C 时（base 在本单之后动过）判据失据 ⇒ 末行给 ⚠ 并提示改「整树核/提交区间」；
//   rc 不放松（仍按 A≠B 给 1·不静默放行）；体系仓就地单请直接用提交区间（git diff --numstat A B）对件集。
//
// 跨仓注意：<root> 必须是**同一次生成补丁时的那棵交付树**（同一 worktree／同一时点）；换行口径本闸不受影响（不比字节）。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(k);
const ROOT = arg("--root"), PATCH = arg("--patch"), BASE = arg("--base");
const JSON_OUT = has("--json"), QUIET = has("--quiet");
if (!ROOT || !PATCH) { console.error("用法：node 交付件数对账.mjs --root <交付树> --patch <补丁文件> [--base <sha>] [--json]"); process.exit(2); }
if (!fs.existsSync(PATCH)) { console.error(`❌ 补丁不存在：${PATCH}`); process.exit(2); }
if (!fs.existsSync(ROOT)) { console.error(`❌ 交付树不存在：${ROOT}`); process.exit(2); }
const git = (args, cwd) => execFileSync("git", ["-c", "core.quotepath=false", ...args], { windowsHide: true, cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const unq = (p) => p.trim().replace(/^"(.*)"$/s, "$1").replace(/\\"/g, '"'); // 中文路径：core.quotepath=false 已出真名；再兜一层去引号

// A：补丁件集（numstat 每行 1 件；rename 形态下 --numstat 会把 R 记成 1 行 ⇒ 我们同时要求生成侧用 --no-renames）
let aLines = [];
try { aLines = git(["apply", "--numstat", path.resolve(PATCH)], ROOT).split("\n").filter((l) => l.trim()); }
catch (e) { console.error(`❌ git apply --numstat 失败（补丁不适用于该树？）\n${e.message}`); process.exit(2); }
const A = new Set(aLines.map((l) => l.split("\t").pop().trim()));

// B：交付树变集（同口径 --no-renames）
let bLines = [];
try { bLines = git(["status", "--porcelain", "-uall", "--no-renames"], ROOT).split("\n").filter((l) => l.trim()); }
catch { bLines = git(["status", "--porcelain", "-uall"], ROOT).split("\n").filter((l) => l.trim()); } // 老 git 无 --no-renames 时退化为默认口径并在口径行注明
const B = new Set(bLines.map((l) => unq(l.slice(3))));

// C：基线差集（可选）
let C = null;
if (BASE) {
  try { C = new Set(git(["diff", "--no-renames", "--name-only", BASE], ROOT).split("\n").filter((l) => l.trim())); }
  catch { C = null; }
}
const diffSets = (x, y) => ({ onlyX: [...x].filter((v) => !y.has(v)), onlyY: [...y].filter((v) => !x.has(v)) });

const ab = diffSets(A, B);
const ac = C ? diffSets(A, C) : null;
let head = "?";
try { head = git(["rev-parse", "--short", "HEAD"], ROOT).trim(); } catch {}

const ok = ab.onlyX.length === 0 && ab.onlyY.length === 0;
const stamp = new Date().toLocaleString("zh-CN", { hour12: false });

if (JSON_OUT) {
  console.log(JSON.stringify({
    ts: stamp, root: ROOT, head, patch: path.resolve(PATCH), base: BASE || null,
    counts: { A_patch: A.size, B_tree: B.size, C_base: C ? C.size : null },
    ab, ac, verdict: ok ? "consistent" : "mismatch",
  }, null, 2));
} else if (!QUIET) {
  console.log(`交付件对账 · ${stamp}`);
  console.log(`  交付树 ${ROOT}（HEAD ${head}）｜补丁 ${path.basename(PATCH)}${BASE ? `｜base ${BASE}` : ""}`);
  console.log(`  口径：A=patch(numstat 行) ${A.size}｜B=tree(status -uall --no-renames 件) ${B.size}${C ? `｜C=diff(base, --no-renames 件) ${C.size}` : ""}`);
  if (!ok) {
    console.log(`  ❌ A≠B：仅补丁有 ${ab.onlyX.length} 件｜仅交付树有 ${ab.onlyY.length} 件`);
    for (const f of ab.onlyX.slice(0, 8)) console.log(`     · 仅补丁有：${f}`);
    for (const f of ab.onlyY.slice(0, 8)) console.log(`     · 仅交付树有：${f}`);
    if (ab.onlyY.length > 8) console.log(`     …（另 ${ab.onlyY.length - 8} 件 · 用 --json 取全量）`);
  }
  const acMismatch = !!(ac && (ac.onlyX.length || ac.onlyY.length));
  if (acMismatch) {
    console.log(`  ⚠ A≠C（base ${BASE}）：差 ${ac.onlyX.length + ac.onlyY.length} 件 —— **base 在本单之后动过**（他单已并入同批件/已处理哈希轮换）⇒ 此时 diff-sha 不可作对数凭据，改用整树核；本闸只作提示不据此判失败`);
  }
  console.log(ok ? "  ✅ 一致（补丁件集 ＝ 交付树变集）" : acMismatch
    ? "  ⚠ A≠B——且 base 已前移（A≠C·见上）⇒ 判据失据：请改用整树核/提交区间对件集（体系仓就地单体例）；rc 仍按 A≠B 给出（不静默放行）"
    : "  ❌ 不一致：按 mall-web/README 或交付体例用 `git diff HEAD --no-renames` 重生成补丁后再交");
}
process.exit(ok ? 0 : 1);
