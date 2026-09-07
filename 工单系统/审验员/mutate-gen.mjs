#!/usr/bin/env node
/**
 * SYS-02 阶段二 V1 变异生成器（mutate-gen）——验证测试套件对特定代码变异的捕获能力。
 *
 * 用法：
 *   node mutate-gen.mjs --suite "<gradle 任务>" --mutation "<变异描述>" --target "<文件>" --app-path "<0027-mov 路径>"
 *
 * 变异描述（--mutation）两种形态：
 *   1. 预设模板：<template>:<arg>
 *        cond-flip:<表达式>     条件翻转（<=↔<、>=↔>、==↔!=、&&↔|| 等，按优先级取首个匹配操作符）
 *        short-circuit:<表达式> 短路替换（&&↔||）
 *        call-delete:<片段>     删除包含该片段的整行（调用删除）
 *        const-replace:old=>new 常量替换
 *   2. 显式替换：old=>new       （模板标注 manual）
 *
 * 流程：校验 → 记录基线 git status → detached worktree 隔离副本 → 应用变异（绝不碰工作区源码）
 *       → 跑 suite → 按 test XML failures/errors 判定 RED/NOT_RED → 强制清理 worktree → 复查 status 干净。
 *
 * 判定/退出码：
 *   MUTATE_<id>_RED      变异被测试捕获（failures/errors > 0）            → exit 0
 *   MUTATE_<id>_NOT_RED  变异未被捕获（测试全绿）                        → exit 1
 *   MUTATE_ERROR         变异应用失败 / 构建失败无测试结果 / worktree 污染 → exit 2
 *
 * 红线：0027-mov 只读——变异只落在临时 worktree；跑完强制清理并复核 status 与基线一致。
 */

import { execFileSync, spawnSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

// ---------------- 参数解析 ----------------

function parseArgs(argv) {
  const opts = { suite: [], mutation: null, target: null, appPath: null, outDir: null };
  let cur = null;
  for (const a of argv) {
    if (a === "--suite") { cur = "suite"; continue; }
    if (a === "--mutation") { cur = "mutation"; continue; }
    if (a === "--target") { cur = "target"; continue; }
    if (a === "--app-path") { cur = "appPath"; continue; }
    if (a === "--out-dir") { cur = "outDir"; continue; }
    // suite 收集持续到遇到下一个已知 flag；--tests 等 gradle 参数属于 suite 一部分
    if (cur === "suite") opts.suite.push(a);
    else if (cur === "mutation") opts.mutation = a;
    else if (cur === "target") opts.target = a;
    else if (cur === "appPath") opts.appPath = a;
    else if (cur === "outDir") opts.outDir = a;
  }
  return opts;
}

// ---------------- 变异解析与应用 ----------------

function parseMutation(spec) {
  const known = ["cond-flip", "short-circuit", "call-delete", "const-replace"];
  const colon = spec.indexOf(":");
  if (colon > 0 && known.includes(spec.slice(0, colon))) {
    const tpl = spec.slice(0, colon);
    const arg = spec.slice(colon + 1);
    if (tpl === "const-replace") {
      const eq = arg.indexOf("=>");
      if (eq === -1) throw new Error(`const-replace 需要 old=>new 参数，收到: ${arg}`);
      return { template: tpl, old: arg.slice(0, eq), new: arg.slice(eq + 2) };
    }
    return { template: tpl, old: arg };
  }
  const eq = spec.indexOf("=>");
  if (eq > 0) return { template: "manual", old: spec.slice(0, eq), new: spec.slice(eq + 2) };
  throw new Error(`无法解析变异描述「${spec}」——请用 <模板>:<参数> 或 old=>new`);
}

function flipOperator(expr) {
  // 先双字符后单字符，避免 < 先替换掉 <= 的 <
  const rules = [["<=", ">="], [">=", "<="], ["<", ">"], [">", "<"], ["==", "!="], ["!=", "=="], ["&&", "||"], ["||", "&&"]];
  for (const [from, to] of rules) {
    if (expr.includes(from)) return { newExpr: expr.split(from).join(to), flipped: from };
  }
  throw new Error(`cond-flip 未在表达式「${expr}」中匹配到可翻转操作符`);
}

function swapShortCircuit(expr) {
  if (expr.includes("&&")) return { newExpr: expr.split("&&").join("||"), flipped: "&&" };
  if (expr.includes("||")) return { newExpr: expr.split("||").join("&&"), flipped: "||" };
  throw new Error(`short-circuit 未在表达式「${expr}」中找到 && 或 ||`);
}

function applyMutation(src, mut) {
  switch (mut.template) {
    case "cond-flip": {
      const { newExpr, flipped } = flipOperator(mut.old);
      const count = src.split(mut.old).length - 1;
      if (count === 0) throw new Error(`cond-flip：表达式「${mut.old}」在目标中不存在`);
      mut.old = mut.old; mut.new = newExpr; mut.operator = flipped; mut.count = count;
      return src.split(mut.old).join(newExpr);
    }
    case "short-circuit": {
      const { newExpr, flipped } = swapShortCircuit(mut.old);
      const count = src.split(mut.old).length - 1;
      if (count === 0) throw new Error(`short-circuit：表达式「${mut.old}」在目标中不存在`);
      mut.new = newExpr; mut.operator = flipped; mut.count = count;
      return src.split(mut.old).join(newExpr);
    }
    case "call-delete": {
      const lines = src.split("\n");
      let found = 0;
      const kept = lines.filter((l) => {
        if (l.includes(mut.old)) { found++; return false; }
        return true;
      });
      if (found === 0) throw new Error(`call-delete：片段「${mut.old}」在目标中不存在`);
      mut.count = found; mut.new = "<删除整行>";
      return kept.join("\n");
    }
    case "const-replace":
    case "manual": {
      const count = src.split(mut.old).length - 1;
      if (count === 0) throw new Error(`替换「${mut.old}」在目标中不存在（零次应用）`);
      mut.count = count;
      return src.split(mut.old).join(mut.new);
    }
    default:
      throw new Error(`未知模板: ${mut.template}`);
  }
}

// ---------------- 工具 ----------------

function runGit(app, ...args) {
  const r = spawnSync("git", ["-C", app, ...args], { encoding: "utf8" });
  return { ok: r.status === 0, stdout: (r.stdout || "").trim(), stderr: (r.stderr || "").trim() };
}

function gitStatusSnapshot(app) {
  const r = runGit(app, "status", "--porcelain");
  if (!r.ok) throw new Error(`git status 失败: ${r.stderr}`);
  return r.stdout.split("\n").sort().join("\n");
}

function buildMutationId(targetFile, mut) {
  const base = path.basename(targetFile).replace(/\.[^.]+$/, "");
  return `${base}-${mut.template}`;
}

function resolveJavaHome() {
  if (process.env.JAVA_HOME) return process.env.JAVA_HOME;
  const candidates = [
    "C:\\Program Files\\Android\\Android Studio\\jbr",
    "C:\\Program Files\\Java",
    "C:\\Program Files\\Eclipse Adoptium",
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "bin", "java.exe"))) return c;
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// worktree 不含 local.properties（不提交），从 app-path 读 sdk.dir 注入 ANDROID_HOME
function resolveAndroidHome(appPath) {
  if (process.env.ANDROID_HOME) return process.env.ANDROID_HOME;
  try {
    const lp = fs.readFileSync(path.join(appPath, "local.properties"), "utf8");
    const m = lp.match(/^sdk\.dir\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/\\\\/g, "\\").replace(/\\:/g, ":").replace(/\\=/g, "=");
  } catch { /* 无 local.properties 或不可读 */ }
  return null;
}

// ---------------- 主流程 ----------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const missing = [];
  if (!opts.suite.length) missing.push("--suite");
  if (!opts.mutation) missing.push("--mutation");
  if (!opts.target) missing.push("--target");
  if (!opts.appPath) missing.push("--app-path");
  if (missing.length) {
    console.error(`缺少参数: ${missing.join(", ")}`);
    process.exit(2);
  }

  const appPath = path.resolve(opts.appPath);
  const suite = opts.suite.join(" ");
  const mut = parseMutation(opts.mutation);

  if (!fs.existsSync(path.join(appPath, ".git"))) {
    console.error(`app-path 不是 git 仓库: ${appPath}`);
    process.exit(2);
  }

  // target 映射到 app 相对路径（绝对路径需落在 app-path 内）
  let relTarget;
  if (path.isAbsolute(opts.target)) {
    const absT = path.resolve(opts.target);
    const ap = path.resolve(appPath);
    if (absT !== ap && !absT.startsWith(ap + path.sep)) {
      console.error(`--target 不在 app-path 内: ${opts.target}`);
      process.exit(2);
    }
    relTarget = path.relative(ap, absT);
  } else {
    relTarget = opts.target;
  }

  const id = buildMutationId(relTarget, mut);
  let baseline = null;
  try {
    baseline = gitStatusSnapshot(appPath);
  } catch (e) {
    console.error(`基线 status 获取失败: ${e.message}`);
    process.exit(2);
  }

  // 建 detached worktree 隔离副本
  const head = runGit(appPath, "rev-parse", "HEAD");
  if (!head.ok) { console.error(`rev-parse HEAD 失败: ${head.stderr}`); process.exit(2); }
  const tmpRoot = path.join(os.tmpdir(), `mvmut-${randomUUID().slice(0, 8)}`);
  const wtPath = path.join(tmpRoot, "wt");
  fs.mkdirSync(tmpRoot, { recursive: true });
  const add = runGit(appPath, "worktree", "add", "--detach", wtPath, head.stdout);
  if (!add.ok) { fs.rmSync(tmpRoot, { recursive: true, force: true }); console.error(`worktree add 失败: ${add.stderr}`); process.exit(2); }

  let status = "MUTATE_ERROR";
  let tests = { total: 0, failures: 0, errors: 0 };
  let detail = "";
  let exitCode = 2;
  let clean = false;
  let mutateApplied = false;

  try {
    const wtTarget = path.join(wtPath, relTarget);
    if (!fs.existsSync(wtTarget)) throw new Error(`变异目标在 worktree 中不存在: ${relTarget}`);
    const src = fs.readFileSync(wtTarget, "utf8");
    const mutated = applyMutation(src, mut);
    if (mutated === src) throw new Error("变异后源码未变化（零次应用）");
    fs.writeFileSync(wtTarget, mutated, "utf8");
    mutateApplied = true;

    detail = `变异已应用: ${JSON.stringify({ template: mut.template, operator: mut.operator || null, old: mut.old, new: mut.new, count: mut.count })}`;

    // 跑 suite（worktree 内）
    const gradleArgs = [...suite.split(/\s+/).filter(Boolean), "--console=plain"];
    const env = { ...process.env };
    const javaHome = resolveJavaHome();
    if (javaHome && !process.env.JAVA_HOME) env.JAVA_HOME = javaHome;
    const androidHome = resolveAndroidHome(appPath);
    if (androidHome && !process.env.ANDROID_HOME) env.ANDROID_HOME = androidHome;
    const res = await new Promise((resolve) => {
      const child = spawn(path.join(wtPath, "gradlew.bat"), gradleArgs, { cwd: wtPath, shell: true, env });
      let out = "";
      child.stdout.on("data", (d) => { out += d.toString(); });
      child.stderr.on("data", (d) => { out += d.toString(); });
      child.on("close", (code) => resolve({ code, out }));
      child.on("error", (err) => resolve({ code: -1, out: `spawn 失败: ${err.message}` }));
    });

    // 从 test XML 判定
    const resultsDir = path.join(wtPath, "app", "build", "test-results");
    const xmls = fs.existsSync(resultsDir)
      ? fs.readdirSync(resultsDir, { recursive: true }).filter((f) => f.endsWith(".xml") && f.includes("TEST-"))
      : [];
    let total = 0, failures = 0, errors = 0;
    for (const f of xmls) {
      const xmlPath = path.join(resultsDir, f);
      if (!fs.statSync(xmlPath).isFile()) continue;
      const xml = fs.readFileSync(xmlPath, "utf8");
      const suiteAttr = xml.match(/<testsuite[^>]*/);
      if (!suiteAttr) continue;
      const grab = (name) => { const m = suiteAttr[0].match(new RegExp(`${name}="(\\d+)"`)); return m ? Number(m[1]) : 0; };
      total += grab("tests"); failures += grab("failures"); errors += grab("errors");
    }
    tests = { total, failures, errors };

    // 可选：把测试 XML 复制到 --out-dir（作为交付证据，避免随 worktree 清理丢失）
    if (opts.outDir) {
      const outDirAbs = path.resolve(opts.outDir);
      fs.mkdirSync(outDirAbs, { recursive: true });
      for (const f of xmls) {
        const src = path.join(resultsDir, f);
        if (!fs.statSync(src).isFile()) continue;
        const dest = path.join(outDirAbs, path.basename(f).replace(/TEST-/, `TEST-${id}-`));
        try { fs.copyFileSync(src, dest); } catch (e) { detail += `\n⚠ XML 复制失败 ${dest}: ${e.message}`; }
      }
      detail += `\n测试 XML 已复制到 ${outDirAbs}`;
    }

    const xmlSaysRed = failures + errors > 0;
    const xmlSaysGreen = total > 0 && failures === 0 && errors === 0;
    const gradleFailed = res.code !== 0;

    if (xmlSaysRed) { status = `MUTATE_${id}_RED`; exitCode = 0; detail += `\n测试捕获变异: failures=${failures} errors=${errors}（total=${total}）`; }
    else if (xmlSaysGreen) { status = `MUTATE_${id}_NOT_RED`; exitCode = 1; detail += "\n测试全绿——变异未被捕获（NOT_RED）"; }
    else { status = "MUTATE_ERROR"; exitCode = 2; detail += `\n无有效测试结果（gradle exit=${res.code}, xml=${xmls.length}, total=${total}）`; }
    detail += `\ngradle exit=${res.code}`;
    if (!xmlSaysRed && !xmlSaysGreen) detail += `\n--- gradle 输出尾部 ---\n${res.out.split("\n").slice(-25).join("\n")}`;

    // 复查 status 干净
    const after = gitStatusSnapshot(appPath);
    clean = after === baseline;
    if (!clean) detail += `\n⚠ worktree 清理后 status 与基线不一致——工作区可能被污染！`;
  } catch (e) {
    detail = `错误: ${e.message}`;
    status = "MUTATE_ERROR";
    exitCode = 2;
  } finally {
    // 强制清理 worktree + 临时目录
    try { runGit(appPath, "worktree", "remove", "--force", wtPath); } catch { /* 忽略 */ }
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* 忽略 */ }
    if (mutateApplied) {
      try {
        const after = gitStatusSnapshot(appPath);
        clean = after === baseline;
      } catch { /* 忽略 */ }
    }
  }

  const out = { mode: "mutate-gen", id, appPath, target: relTarget, suite, mutation: mut, status, tests, clean, detail };
  console.log("═══ SYS-02 V1 mutate-gen ═══");
  console.log(`目标: ${relTarget}  suite: ${suite}`);
  console.log(`变异: ${mut.template}  ${mut.old}  →  ${mut.new}${mut.operator ? `  (翻转 ${mut.operator})` : ""}`);
  console.log(`判定: ${status}  (tests=${tests.total}, failures=${tests.failures}, errors=${tests.errors})`);
  console.log(`0027-mov 工作区干净: ${clean}`);
  console.log(detail);
  process.exit(exitCode);
}

main().catch((e) => { console.error(e); process.exit(2); });
