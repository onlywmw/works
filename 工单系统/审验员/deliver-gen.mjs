#!/usr/bin/env node
/**
 * SYS-02 阶段二 V2 交付报告生成器（deliver-gen）——从结构化输入生成 DELIVERY 骨架。
 *
 * 用法：
 *   node deliver-gen.mjs --ticket <工单号> --branch <分支> --hash <code_commit_sha>
 *       [--app-path <0027-mov 路径>] [--evidence <证据文件> ...] [--tests-xml <xml> ...] [--out <输出.md>]
 *
 * 说明：
 *   - 骨架=机器只出结构（判据表/证据引用/hash 三重/测试结果汇总），结论由交付 agent/验收员填——不替人下结论。
 *   - --verify-hash 预校验：调用阶段一的 审验.py --verify-hash <branch> <hash> --repo <app-path>（复用，不重复实现 git 逻辑）。
 *     未传 --app-path 时该栏标注「未校验，人裁决」。
 *   - 测试结果从 tests XML 汇总（tests/failures/errors）。
 *
 * 红线：只写工单系统侧；0027-mov 只读（verify-hash 纯只读查询）；脚本不联网、无 secret。
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------- 参数解析 ----------------

function parseArgs(argv) {
  const opts = { ticket: null, branch: null, hash: null, appPath: null, evidence: [], testsXml: [], out: null, date: null };
  let cur = null;
  const multi = new Set(["evidence", "testsXml"]);
  for (const a of argv) {
    if (a === "--ticket") { cur = "ticket"; continue; }
    if (a === "--branch") { cur = "branch"; continue; }
    if (a === "--hash") { cur = "hash"; continue; }
    if (a === "--app-path") { cur = "appPath"; continue; }
    if (a === "--evidence") { cur = "evidence"; continue; }
    if (a === "--tests-xml") { cur = "testsXml"; continue; }
    if (a === "--out") { cur = "out"; continue; }
    if (a === "--date") { cur = "date"; continue; }
    if (cur === "ticket") opts.ticket = a;
    else if (cur === "branch") opts.branch = a;
    else if (cur === "hash") opts.hash = a;
    else if (cur === "appPath") opts.appPath = a;
    else if (cur === "evidence") opts.evidence.push(a);
    else if (cur === "testsXml") opts.testsXml.push(a);
    else if (cur === "out") opts.out = a;
    else if (cur === "date") opts.date = a;
    else if (!multi.has(cur)) { /* 未知 token 忽略 */ }
  }
  return opts;
}

// ---------------- 工具 ----------------

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 复用阶段一：审验.py --verify-hash
function verifyHashViaAudit(appPath, branch, hash) {
  const audit = path.join(__dirname, "审验.py");
  const r = spawnSync("python", ["审验.py", "--verify-hash", branch, hash, "--repo", appPath], {
    cwd: __dirname,
    encoding: "utf8",
    env: { ...process.env, PYTHONUTF8: "1" },
  });
  const out = (r.stdout || "") + (r.stderr || "");
  const m = out.match(/结果:\s*(HASH_OK|HASH_REJECT(?:\s*<[^>]+>)?)/);
  const signal = out.match(/signal:\s*(.+)/);
  return {
    result: m ? m[1].trim() : "UNKNOWN",
    signal: signal ? signal[1].trim() : out.trim().split("\n").filter(Boolean).slice(-3).join(" | "),
    exit: r.status,
  };
}

// 汇总 tests XML
function summarizeTests(xmlPaths) {
  let total = 0, failures = 0, errors = 0;
  const rows = [];
  for (const p of xmlPaths) {
    if (!fs.existsSync(p)) { rows.push({ file: p, missing: true }); continue; }
    const xml = fs.readFileSync(p, "utf8");
    const suiteAttr = xml.match(/<testsuite[^>]*/);
    if (!suiteAttr) { rows.push({ file: p, unparsed: true }); continue; }
    const grab = (name) => { const m = suiteAttr[0].match(new RegExp(`${name}="(\\d+)"`)); return m ? Number(m[1]) : 0; };
    const t = grab("tests"), f = grab("failures"), e = grab("errors");
    total += t; failures += f; errors += e;
    rows.push({ file: p, tests: t, failures: f, errors: e });
  }
  return { total, failures, errors, rows };
}

// ---------------- 骨架生成 ----------------

function buildSkeleton(o, hashRes, tests, date) {
  const L = [];
  const push = (s = "") => L.push(s);
  push(`# 交付报告 · ${o.ticket}`);
  push("");
  push(`> 类型：（待填） ｜ 日期：${date} ｜ 依据：（派单路径）`);
  push(`> 治理归属：（只动 \`Desktop\\MOV\\工单系统\` / 0027-mov 只读） ｜ 状态：✅ 已完成（交付，待验收）`);
  push("");
  push("---");
  push("");
  push("## 一、本阶段交付（N 件）");
  push("");
  push("| # | 交付 | 实现 |");
  push("|---|---|---|");
  push("| 1 | （交付件） | （实现位置） |");
  push("");
  push("## 二、验收判据核对（逐条证据）");
  push("");
  push("| 项 | 标准 | 实测证据 |");
  push("|---|---|---|");
  push("| M-1 | （标准） | ⏳ 待填 |");
  push("| M-2 | （标准） | ⏳ 待填 |");
  push("| M-3 | （标准） | ⏳ 待填 |");
  push("| M-5 | （标准） | ⏳ 待填 |");
  push("| M-6 | （标准） | ⏳ 待填 |");
  push("");
  push("## 三、证据引用");
  push("");
  if (o.evidence.length) {
    for (const ev of o.evidence) push(`- \`${ev}\` —— （说明待填）`);
  } else {
    push("（未传 --evidence，待补）");
  }
  push("");
  push("## 四、测试结果（XML 汇总）");
  push("");
  if (tests.rows.length) {
    push("| 文件 | tests | failures | errors |");
    push("|---|---|---|---|");
    for (const r of tests.rows) {
      if (r.missing) push(`| \`${r.file}\` | 缺失 | - | - |`);
      else if (r.unparsed) push(`| \`${r.file}\` | 未解析 | - | - |`);
      else push(`| \`${r.file}\` | ${r.tests} | ${r.failures} | ${r.errors} |`);
    }
    push(`| **合计** | **${tests.total}** | **${tests.failures}** | **${tests.errors}** |`);
    push("");
    push(`> 结论：${tests.failures + tests.errors > 0 ? "存在失败/错误——待交付 agent 确认是否 RED 证据" : "全绿（变异未被捕获时即 NOT_RED）"}（人裁决）`);
  } else {
    push("（未传 --tests-xml，待补）");
  }
  push("");
  push("## 五、hash 三重（交付绑定）");
  push("");
  push("| code_commit_sha | artifact_sha | evidence_manifest_sha |");
  push("|---|---|---|");
  push(`| \`${o.hash}\` | （待填） | （待填） |`);
  push("");
  push(`**E2 hash 一致性预校验**（复用 SYS-02 阶段一 \`审验.py --verify-hash\`）：`);
  push("");
  if (o.appPath) {
    push(`- 命令：\`python 审验.py --verify-hash ${o.branch} ${o.hash} --repo ${o.appPath}\``);
    push(`- 结果：**${hashRes.result}** ｜ signal：${hashRes.signal}`);
  } else {
    push("- 未传 --app-path —— 校验未执行，**人裁决**（登记前必须补跑 --verify-hash）");
  }
  push("");
  push("## 六、范围与红线遵守");
  push("");
  push("- （红线逐条对照待填）");
  push("");
  push("## 七、登记说明");
  push("");
  push("- （登记动作待填：README §六 / 挂账登记表）");
  push("");
  return L.join("\n");
}

// ---------------- 主流程 ----------------

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const missing = [];
  if (!opts.ticket) missing.push("--ticket");
  if (!opts.branch) missing.push("--branch");
  if (!opts.hash) missing.push("--hash");
  if (missing.length) { console.error(`缺少参数: ${missing.join(", ")}`); process.exit(2); }

  const date = opts.date || today();
  let hashRes = { result: "UNKNOWN", signal: "未校验", exit: null };
  if (opts.appPath) {
    try { hashRes = verifyHashViaAudit(opts.appPath, opts.branch, opts.hash); }
    catch (e) { hashRes = { result: "ERROR", signal: `调用审验.py 失败: ${e.message}`, exit: null }; }
  }

  const tests = summarizeTests(opts.testsXml);
  const md = buildSkeleton(opts, hashRes, tests, date);

  console.log("═══ SYS-02 V2 deliver-gen ═══");
  console.log(`ticket=${opts.ticket}  branch=${opts.branch}  hash=${opts.hash}`);
  console.log(`verify-hash: ${hashRes.result}${opts.appPath ? "" : "（未校验）"}`);
  console.log(`tests: total=${tests.total} failures=${tests.failures} errors=${tests.errors}`);
  console.log("--------------------------------------------------");
  console.log(md);

  if (opts.out) {
    const absOut = path.resolve(opts.out);
    fs.mkdirSync(path.dirname(absOut), { recursive: true });
    fs.writeFileSync(absOut, md + "\n", "utf8");
    console.log("--------------------------------------------------");
    console.log(`已写入: ${absOut}`);
  }
}

main();
