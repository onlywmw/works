#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * worktree.mjs —— 0027-mov worktree 管理收口（SYS-112）。
 *
 * 判据（**单一真源**，与巡检台 HY-BASE-16/HY-BASE-17 同文本·互指）：
 *   可清(A) = `status --porcelain` 脏项=0 **且** `merge-base --is-ancestor <HEAD> origin/main`（已并入）
 *   保留(B) = 其余（未并入 / 有脏项 / 目录已不在）——**在途 worktree 天然受保**
 *
 * 子命令：
 *   list  [--repo R] [--json]            每枚：路径/分支/HEAD/merged?/脏项/ahead/龄 + 状态列
 *   prune [--repo R] [--apply]           按双判据筛可清；**默认 dry-run 只打印**；--apply 才动手
 *                                        （git worktree remove --force → 失败降级 rm -rf → git worktree prune）
 *   rm <path> [--repo R] [--force]       安全默认：未并入或有脏项 ⇒ 拒绝（rc≠0+原因）；--force 才强删
 *   new <单号> [--repo R] [--base ref]   建 worktree + 建分支（feat/<slug>·E:/mov工作区/mov-<slug>）+ 基线提示
 *                                        **SYS-174**：非 ASCII 工作区根 ⇒ 兼保 ASCII 联结（E:/movws）并输出可复制构建口令（-p 前缀）
 *                                        （中文路径下 Android 构建必崩：cmake 3.22.1 0xC0000409——联结绕行见 处理中心/README.md）
 *
 * 输出永远含「可清 N / 保留 M＋原因」（不得一把梭·可审计）。
 */
import fs from "node:fs";
import { PRODUCT, SYS, WORKSPACE } from "./lib/root.mjs"; // SYS-160：根解析单源
import path from "node:path";
import { execFileSync } from "node:child_process";

const DEFAULT_REPO = PRODUCT; // SYS-160：产品仓默认位走根解析（MOV_PRODUCT_REPO → 平台缺省·缺省=原 E:/mov归档/0027-mov）；--repo 覆盖
const args = process.argv.slice(2);
const opt = (name, dflt = null) => { const i = args.indexOf("--" + name); return i >= 0 ? (args[i + 1] ?? true) : dflt; };
const has = (name) => args.includes("--" + name);
const sub = args[0] || "list";
const REPO = path.resolve(String(opt("repo", DEFAULT_REPO)));
const JSON_OUT = has("json");
const APPLY = has("apply");
const FORCE = has("force");

function git(cwd, argv, allowFail = false) {
  try { return execFileSync("git", ["-C", cwd, ...argv], { windowsHide: true, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch (e) { if (allowFail) return null; throw e; }
}
function gitRc(cwd, argv) {
  try { execFileSync("git", ["-C", cwd, ...argv], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }); return 0; }
  catch (e) { return e.status ?? 1; }
}
/** SYS-174：工作区根含非 ASCII 字符 ⇒ 确保 ASCII 联结存在（缺则 mklink /J），返回 ASCII 根；纯 ASCII 根返回 null。 */
function ensureAsciiLink() {
  if (!/[^\x00-\x7F]/.test(WORKSPACE)) return null;                  // ASCII 根：无需联结
  const link = process.env.MOV_WORKSPACE_ASCII || "E:\\movws";
  try {
    const cur = fs.realpathSync.native(link);
    if (canon(cur) === canon(WORKSPACE)) return link;               // 已是本工作区的联结
    console.error(`⚠ ASCII 联结 ${link} 存在但指向 ${cur}（≠ ${WORKSPACE}）——不覆盖，请人工处理`);
    return null;
  } catch { /* 不存在 ⇒ 建 */ }
  try {
    execFileSync("cmd", ["/c", "mklink", "/J", link, WORKSPACE], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    console.log(`✅ 已建 ASCII 联结：${link} → ${WORKSPACE}（SYS-174）`);
    return link;
  } catch (e) {
    console.error(`⚠ 建 ASCII 联结失败（${link}）：${String(e.message).slice(0, 120)}——请手动：cmd /c mklink /J ${link} ${WORKSPACE}`);
    return null;
  }
}
/** 路径归一（Windows 8.3 短名/长名/大小写差异——比对一律走此口径）。 */
function canon(p) {
  try { return fs.realpathSync.native(p).toLowerCase(); } catch { return path.resolve(p).toLowerCase(); }
}
/** 注册 worktree 列表（porcelain 解析）；排除主仓本身。 */
function worktrees() {
  const top = path.resolve(git(REPO, ["rev-parse", "--show-toplevel"]));
  const out = git(REPO, ["worktree", "list", "--porcelain"]);
  const blocks = out.split(/\n(?=worktree )/).map((b) => {
    const m = b.match(/^worktree (.+)$/m);
    const head = (b.match(/^HEAD ([0-9a-f]+)$/m) || [])[1] || "";
    const ref = (b.match(/^branch (.+)$/m) || [])[1] || "";
    return { path: path.resolve(m[1]), head, branch: ref.replace("refs/heads/", "") || "(detached)" };
  }).filter(Boolean).filter((w) => canon(w.path) !== canon(top));
  return blocks;
}
function adminDirOf(w) {
  // worktree 管理目录（.git/worktrees/<id>）——用作「龄」基准（创建时间）
  try {
    const common = path.resolve(git(REPO, ["rev-parse", "--git-common-dir"]));
    const id = path.basename(w.path);
    const cand = path.join(common, "worktrees", id);
    if (fs.existsSync(cand)) return cand;
  } catch {}
  return null;
}
function info(w) {
  const exists = fs.existsSync(w.path);
  let dirty = 0;
  if (exists) {
    const s = git(w.path, ["status", "--porcelain"], true);
    dirty = s === null ? -1 : s.split("\n").filter(Boolean).length; // null=status 失败（fail-closed）；空串=零脏项
  }
  const mergedRc = gitRc(REPO, ["merge-base", "--is-ancestor", w.head, "origin/main"]);
  const merged = mergedRc === 0;
  const ahead = w.head ? Number(git(REPO, ["rev-list", "--count", `origin/main..${w.head}`], true) || 0) : 0;
  let ageMs = null;
  const admin = adminDirOf(w);
  try {
    const st = fs.statSync(admin || w.path, { bigint: true });
    const born = st.birthtimeMs && st.birthtimeMs > 0n ? Number(st.birthtimeMs) : Number(st.mtimeMs);
    ageMs = Date.now() - born;
  } catch {}
  const ageTxt = ageMs == null ? "?" : ageMs >= 86400e3 ? `${Math.floor(ageMs / 86400e3)}天` : `${Math.floor(ageMs / 3600e3)}小时`;
  const clean = exists && dirty === 0;
  const removable = exists && clean && merged;
  const reasons = [];
  if (!exists) reasons.push("目录已不在（仅登记）");
  if (exists && dirty < 0) reasons.push("脏项不可判（status 失败→fail-closed）");
  if (exists && dirty > 0) reasons.push(`脏项 ${dirty}`);
  if (!merged) reasons.push("未并入 origin/main");
  return { ...w, exists, dirty, merged, ahead, ageMs, ageTxt, clean, removable, reasons };
}

function report(list) {
  const removable = list.filter((w) => w.removable);
  const kept = list.filter((w) => !w.removable);
  if (JSON_OUT) {
    console.log(JSON.stringify({ repo: REPO, removable: removable.length, kept: kept.length, worktrees: list }, null, 2));
    return { removable, kept };
  }
  console.log(`worktree 报告｜repo=${REPO}（判据：脏项=0 且 已并入 origin/main）`);
  for (const w of list) {
    const tag = w.removable ? "✅可清" : "⛔保留";
    console.log(`  ${tag}  ${w.path}`);
    console.log(`        分支=${w.branch} HEAD=${w.head.slice(0, 8)} merged=${w.merged} 脏项=${w.dirty} ahead=${w.ahead} 龄=${w.ageTxt}${w.reasons.length ? " ｜原因: " + w.reasons.join("；") : ""}`);
  }
  console.log(`\n可清 ${removable.length} / 保留 ${kept.length}${kept.length ? "＋原因: " + kept.map((w) => `${path.basename(w.path)}(${w.reasons.join("/")})`).join("、") : ""}`);
  return { removable, kept };
}

function removeWorktree(w) {
  const rc = gitRc(REPO, ["worktree", "remove", "--force", w.path]);
  let how = "git worktree remove --force";
  if (rc !== 0) { // 降级：目录级删除（残缺/锁定）
    try { fs.rmSync(w.path, { recursive: true, force: true }); how = "rm -rf 降级"; } catch (e) { return { ok: false, how, err: String(e.message || e) }; }
  }
  gitRc(REPO, ["worktree", "prune"]);
  return { ok: !fs.existsSync(w.path), how };
}

if (sub === "list") {
  report(worktrees().map(info));
} else if (sub === "prune") {
  const list = worktrees().map(info).filter((w) => w.exists);
  const { removable, kept } = report(list);
  if (!APPLY) { console.log("\n（dry-run 默认：未动手。确认后加 --apply 执行）"); process.exit(0); }
  let ok = 0, fail = 0;
  for (const w of removable) {
    const r = removeWorktree(w);
    console.log(`  ${r.ok ? "🗑 已清" : "❌ 失败"} ${w.path}（${r.how}${r.err ? "·" + r.err : ""}）`);
    r.ok ? ok++ : fail++;
  }
  console.log(`\nprune --apply 完成：已清 ${ok} / 失败 ${fail} / 保留 ${kept.length}（在途天然受保）`);
  if (fail) process.exit(1);
} else if (sub === "rm") {
  const target = args[1] && !args[1].startsWith("--") ? path.resolve(args[1]) : null;
  if (!target) { console.error("用法：worktree.mjs rm <path> [--force]"); process.exit(2); }
  const w = worktrees().map(info).find((x) => canon(x.path) === canon(target));
  if (!w) { console.error(`❌ 未注册的 worktree（拒绝路径级 rm·防误删）：${target}`); process.exit(2); }
  if (!w.removable && !FORCE) {
    console.error(`❌ 拒绝删除 ${target}——原因: ${w.reasons.join("；") || "不满足双判据"}（在途/有改动天然受保；确要强删加 --force）`);
    process.exit(1);
  }
  const r = removeWorktree(w);
  console.log(`${r.ok ? "🗑 已删" : "❌ 失败"} ${target}（${r.how}${r.expect ? "" : ""}${!w.removable ? "·--force 强删" : ""}）`);
  if (!r.ok) process.exit(1);
} else if (sub === "new") {
  const raw = args[1] && !args[1].startsWith("--") ? args[1] : null;
  if (!raw) { console.error("用法：worktree.mjs new <单号> [--base origin/main]"); process.exit(2); }
  const slug = raw.toLowerCase().replace(/[^a-z0-9]/g, "");           // UPG-317 → upg317；SYS-112 → sys112
  const branch = `feat/${slug}`;
  const wtPath = path.join(WORKSPACE, `mov-${slug}`); // SYS-160：worktree 根走根解析（原 E:/mov工作区）
  const base = String(opt("base", "origin/main"));
  if (fs.existsSync(wtPath)) { console.error(`❌ 目标已存在：${wtPath}`); process.exit(2); }
  console.log(`建 worktree：${wtPath}（分支 ${branch}·基线 ${base}）`);
  git(REPO, ["worktree", "add", "-b", branch, wtPath, base]);
  console.log(`✅ 已建 ${wtPath}`);
  // SYS-174：中文工作区根（如 E:/mov工作区）下 Gradle/CMake 必崩（cmake 3.22.1 rc=0xC0000409）——
  //  绕行＝ASCII 联结（缺则建）＋ 构建一律带 -p <ASCII 前缀>（直接 cd 中文路径会让 Gradle 把项目目录规范化回去 ⇒ 仍崩）。
  const asciiRoot = ensureAsciiLink();
  const buildTree = asciiRoot ? path.join(asciiRoot, `mov-${slug}`) : wtPath;
  console.log("基线提示（惯例）：");
  console.log(`  1) cp "${REPO}/local.properties" "${wtPath}/local.properties"`);
  console.log(`  2) **构建口令（可直接复制；中文路径下必须走 ASCII 联结 + -p）**：`);
  console.log(`     cmd /c "set JAVA_HOME=C:\\Program Files\\Android\\Android Studio\\jbr&& ${String(buildTree).replace(/\//g, "\\")}\\gradlew.bat -p ${String(buildTree).replace(/\//g, "\\")} :app:assembleDebug"`);
  console.log(`     （要点：包装器用 **ASCII 绝对路径** 叫起、项目目录用 -p 指定——**不要 cd 进联结再跑**（进程 CWD 会被内核解析回中文路径 ⇒ 仍崩））`);
  console.log(`     （基线全量：同口令改 :app:testDebugUnitTest --continue —— 对照当日基线红集）`);
  console.log(`  3) 证据落 程序员/<单号>-evidence/（清单用：node 处理中心/机器闸/evidence-sums.mjs gen <目录> —— 标准格式·sha256sum -c 可直接消费·2026-09-28 审验 F-B）`);
  console.log(`  4) 收口时：node 处理中心/机器闸/worktree.mjs prune --apply（合并完成即清）`);
} else {
  console.error("用法：worktree.mjs list|prune|rm|new …（见文件头注释）");
  process.exit(2);
}
