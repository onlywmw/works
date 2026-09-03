#!/usr/bin/env node
/**
 * SYS-02 阶段二 V2 交付报告生成器（deliver-gen）——从结构化输入生成 DELIVERY 骨架。
 * UPG-92 升级：manifest 硬闸化——源头合规产出 evidence manifest + 内置自检（不合规=拒绝产出，硬闸非警告）。
 *
 * 用法：
 *   node deliver-gen.mjs --ticket <工单号> --branch <分支> --hash <code_commit_sha>
 *       [--app-path <0027-mov 路径>] [--evidence <证据文件> ...] [--tests-xml <xml> ...] [--out <输出.md>]
 *       [--producer <名>] [--standard-id <STD-...>] [--delivery-id <DEL-...>] [--artifact-sha <值>]
 *       [--manifest-out <路径>] [--manifest-draft <草稿.json>] [--no-manifest]
 *   node deliver-gen.mjs --self-test    UPG-92 自测（源头合规绿 + 注入不合规红×2 + 骨架回归）
 *
 * 说明：
 *   - 骨架=机器只出结构（判据表/证据引用/hash 三重/测试结果汇总），结论由交付 agent/验收员填——不替人下结论。
 *   - --verify-hash 预校验：调用阶段一的 审验.py --verify-hash <branch> <hash> --repo <app-path>（复用，不重复实现 git 逻辑）。
 *     未传 --app-path 时该栏标注「未校验，人裁决」。
 *   - 测试结果从 tests XML 汇总（tests/failures/errors）。
 *   - manifest 硬闸（UPG-92，红线 23 机制化）：
 *     ① 源头合规——传 --evidence 即自动产出 evidence manifest：路径裸串（ROOT 相对、正斜杠、禁嵌注释）、
 *        每条 sha256 机器实算（文件=内容摘要；目录=UPG-86 口径 sorted 文件名+内容 聚合）、
 *        evidence_manifest_sha 绑定值写入（canonical JSON 重算可对账）；
 *     ② 自检内置——产出后自跑 `审验.py --manifest --json`，ok:False → 删除产出、拒绝生成交付报告、退出码 1
 *       （硬闸=拒绝，不是警告）；
 *     ③ --manifest-draft 草稿直通——草稿条目逐字过闸（机器不替人修补语义：路径嵌注释/缺 sha256=拒）。
 *
 * 红线：只写工单系统侧；0027-mov 只读（verify-hash 纯只读查询）；脚本不联网、无 secret。
 */

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname); // 工单系统\

// ---------------- 参数解析 ----------------

function parseArgs(argv) {
  const opts = {
    ticket: null, branch: null, hash: null, appPath: null, evidence: [], testsXml: [], out: null, date: null,
    producer: "程序员", standardId: null, deliveryId: null, artifactSha: null,
    manifestOut: null, manifestDraft: null, noManifest: false, selfTest: false,
  };
  let cur = null;
  const multi = new Set(["evidence", "testsXml"]);
  const flags = { "--no-manifest": "noManifest", "--self-test": "selfTest" };
  const singles = {
    "--ticket": "ticket", "--branch": "branch", "--hash": "hash", "--app-path": "appPath",
    "--evidence": "evidence", "--tests-xml": "testsXml", "--out": "out", "--date": "date",
    "--producer": "producer", "--standard-id": "standardId", "--delivery-id": "deliveryId",
    "--artifact-sha": "artifactSha", "--manifest-out": "manifestOut", "--manifest-draft": "manifestDraft",
  };
  for (const a of argv) {
    if (flags[a]) { opts[flags[a]] = true; cur = null; continue; }
    if (singles[a]) { cur = singles[a]; continue; }
    if (cur === "evidence") opts.evidence.push(a);
    else if (cur === "testsXml") opts.testsXml.push(a);
    else if (cur && !multi.has(cur)) { opts[cur] = a; cur = null; }
    else if (!multi.has(cur)) { /* 未知 token 忽略 */ }
  }
  return opts;
}

// ---------------- 工具 ----------------

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayCompact() {
  return today().replaceAll("-", "");
}

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

// 复用阶段一：审验.py --verify-hash
function verifyHashViaAudit(appPath, branch, hash) {
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

// ---------------- UPG-92：manifest 源头合规 + 内置自检硬闸 ----------------

// 路径裸串化：解析为绝对路径（相对量以 ROOT 为基准），ROOT 内 → 相对路径正斜杠；ROOT 外 → 绝对路径正斜杠。
// 只产出纯路径——说明性内容一律去 note 字段，path 绝不嵌注释。
function toBarePath(p) {
  const abs = path.isAbsolute(p) ? path.normalize(p) : path.resolve(ROOT, p);
  const rel = path.relative(ROOT, abs);
  const bare = rel && !rel.startsWith("..") && !path.isAbsolute(rel) ? rel : abs;
  return bare.split(path.sep).join("/");
}

// 目录聚合 sha256（对齐 审验.py _dir_sha256 的 UPG-86 口径：sorted 顶层文件名 + 文件内容依次摘要，不递归）。
function dirSha256(dirpath) {
  const h = crypto.createHash("sha256");
  for (const name of fs.readdirSync(dirpath).sort()) {
    const fp = path.join(dirpath, name);
    if (fs.statSync(fp).isFile()) {
      h.update(Buffer.from(name, "utf8"));
      h.update(fs.readFileSync(fp));
    }
  }
  return h.digest("hex");
}

// canonical JSON（对齐 审验.py _canon_manifest：键序递归排序/无空白/UTF-8 字面量），供 manifest_sha 重算对账。
function canonJson(o) {
  if (Array.isArray(o)) return "[" + o.map(canonJson).join(",") + "]";
  if (o && typeof o === "object") {
    return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + canonJson(o[k])).join(",") + "}";
  }
  return JSON.stringify(o);
}

function manifestSha(manifestList) {
  return sha256Hex(Buffer.from(canonJson(manifestList), "utf8"));
}

// 源头合规产出：--evidence 实文件 → 条目（path 裸串 + sha256 机器实算 + producer/created_at）。
// 文件不存在 = 源头即拒（参数错，exit 2）——机器无法对不存在的证据产出合规 manifest。
function buildEntriesFromEvidence(evidencePaths, producer, date) {
  return evidencePaths.map((p, i) => {
    const abs = path.isAbsolute(p) ? path.normalize(p) : path.resolve(ROOT, p);
    if (!fs.existsSync(abs)) {
      console.error(`MANIFEST_REJECT: 证据文件不存在（源头即拒）: ${p}`);
      process.exit(2);
    }
    const isDir = fs.statSync(abs).isDirectory();
    return {
      evidence_id: `E-${String(i + 1).padStart(3, "0")}`,
      path: toBarePath(p),
      sha256: isDir ? dirSha256(abs) : sha256Hex(fs.readFileSync(abs)),
      producer,
      created_at: date,
    };
  });
}

function defaultManifestOut(ticket) {
  return path.join(ROOT, "处理中心", `delivery_${ticket.replace(/-/g, "")}_manifest.json`);
}

// 内置自检：审验.py --manifest --json（复用，不重复实现校验逻辑）。返回 {ok, problems, recomputed, raw}。
function runManifestGate(manifestPath) {
  const r = spawnSync("python", ["审验.py", "--manifest", manifestPath, "--json"], {
    cwd: __dirname,
    encoding: "utf8",
    env: { ...process.env, PYTHONUTF8: "1" },
    maxBuffer: 64 * 1024 * 1024,
  });
  const out = (r.stdout || "").trim();
  try {
    const j = JSON.parse(out.slice(out.indexOf("{")));
    return { ok: j.ok === true, problems: j.problems || [], recomputed: j.manifest_sha_recomputed || null, raw: j };
  } catch (e) {
    return { ok: false, problems: [`自检输出解析失败: ${e.message} ｜ ${(r.stderr || out).slice(0, 200)}`], recomputed: null, raw: null };
  }
}

// 组装 + 落盘 + 过闸。不合规：删产出 + 报错 + exit 1（硬闸）。合规：返回 {path, sha, gate}。
function produceManifestWithGate(opts, date) {
  let entries;
  let draft = {};
  if (opts.manifestDraft) {
    try {
      draft = JSON.parse(fs.readFileSync(opts.manifestDraft, "utf8"));
    } catch (e) {
      console.error(`MANIFEST_REJECT: 草稿读取/解析失败: ${e.message}`);
      process.exit(2);
    }
    if (!Array.isArray(draft.evidence_manifest)) {
      console.error("MANIFEST_REJECT: 草稿缺 evidence_manifest 数组");
      process.exit(2);
    }
    entries = draft.evidence_manifest; // 逐字直通——机器不替人修补语义
  } else {
    entries = buildEntriesFromEvidence(opts.evidence, opts.producer, date);
  }
  const manifest = {
    ticket_id: opts.ticket,
    delivery_id: opts.deliveryId || `DEL-${opts.ticket.replace(/-/g, "")}-${todayCompact()}-001`,
    standard_id: opts.standardId || draft.standard_id || "（待填）",
    code_commit_sha: opts.hash,
    artifact_sha: opts.artifactSha || "（待填）",
    evidence_manifest: entries,
    evidence_manifest_sha: manifestSha(entries), // 绑定值写入——可重算对账
  };
  const outPath = path.resolve(opts.manifestOut || defaultManifestOut(opts.ticket));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  const gate = runManifestGate(outPath);
  if (!gate.ok) {
    fs.unlinkSync(outPath); // 拒绝产出——硬闸不留残件
    console.error("═══ MANIFEST_REJECT（硬闸：不合规=拒绝产出，非警告）═══");
    for (const p of gate.problems) console.error(`  - ${p}`);
    console.error(`已删除不合规产出: ${outPath}`);
    console.error("交付生成失败（exit 1）——修合规后重跑；机器产出即合规，不靠人记得跑自检");
    process.exit(1);
  }
  return { path: outPath, sha: manifest.evidence_manifest_sha, gate };
}

// ---------------- UPG-92 自测（源头合规绿 + 注入不合规红 + 骨架回归） ----------------

function selfTest() {
  const td = fs.mkdtempSync(path.join(os.tmpdir(), "deliver-gen-upg92-"));
  const cases = [];
  const run = (name, fn) => {
    try { cases.push({ name, ...fn() }); }
    catch (e) { cases.push({ name, pass: false, signal: `异常: ${e.message}` }); }
  };
  const child = (args) => spawnSync(process.execPath, [path.join(__dirname, "deliver-gen.mjs"), ...args], {
    encoding: "utf8", env: { ...process.env, PYTHONUTF8: "1" }, maxBuffer: 64 * 1024 * 1024,
  });

  // 案 1（源头合规锚）：真实证据文件 → 产出 manifest 过闸 ok:True + 绑定值可重算一致
  run("源头合规：产出 manifest 审验.py --manifest ok:True 可重算", () => {
    const ev1 = path.join(td, "ev-a.txt"); fs.writeFileSync(ev1, "证据甲\n", "utf8");
    const evDir = path.join(td, "evdir"); fs.mkdirSync(evDir);
    fs.writeFileSync(path.join(evDir, "b.txt"), "证据乙\n", "utf8");
    const mout = path.join(td, "m-good.json");
    const r = child(["--ticket", "UPG-92", "--branch", "feat/upg92", "--hash", "0".repeat(40),
      "--evidence", ev1, "--evidence", evDir, "--manifest-out", mout]);
    if (r.status !== 0) return { pass: false, signal: `exit=${r.status}: ${(r.stderr || "").slice(0, 200)}` };
    const m = JSON.parse(fs.readFileSync(mout, "utf8"));
    const recomputed = manifestSha(m.evidence_manifest);
    const bareOk = m.evidence_manifest.every((e) => !/[（）｜§]|——|sha256=/.test(e.path));
    const shaOk = m.evidence_manifest.every((e) => /^[0-9a-f]{64}$/.test(e.sha256));
    const pass = m.evidence_manifest_sha === recomputed && bareOk && shaOk;
    return { pass, signal: `绑定值重算一致=${m.evidence_manifest_sha === recomputed} 路径裸串=${bareOk} 条带sha256=${shaOk}` };
  });

  // 案 2（硬闸锚 a）：注入路径嵌注释草稿 → 拒绝产出（exit 1 + 不留残件）
  run("硬闸：注入路径嵌注释 → 拒绝产出", () => {
    const ev1 = path.join(td, "ev-a.txt");
    const draft = { evidence_manifest: [
      { evidence_id: "E-001", path: ev1.split(path.sep).join("/") + "（嵌注释）", sha256: sha256Hex(fs.readFileSync(ev1)), producer: "程序员", created_at: today() },
    ] };
    const df = path.join(td, "draft-bad-path.json"); fs.writeFileSync(df, JSON.stringify(draft), "utf8");
    const mout = path.join(td, "m-bad-path.json");
    const r = child(["--ticket", "UPG-92", "--branch", "feat/upg92", "--hash", "0".repeat(40),
      "--manifest-draft", df, "--manifest-out", mout]);
    const pass = r.status === 1 && !fs.existsSync(mout) && /MANIFEST_REJECT/.test(r.stderr || "");
    return { pass, signal: `exit=${r.status} 残件清除=${!fs.existsSync(mout)} REJECT 输出=${/MANIFEST_REJECT/.test(r.stderr || "")}` };
  });

  // 案 3（硬闸锚 b）：注入缺 sha256 草稿 → 拒绝产出
  run("硬闸：注入缺 sha256 → 拒绝产出", () => {
    const ev1 = path.join(td, "ev-a.txt");
    const draft = { evidence_manifest: [
      { evidence_id: "E-001", path: ev1.split(path.sep).join("/"), producer: "程序员", created_at: today() },
    ] };
    const df = path.join(td, "draft-bad-sha.json"); fs.writeFileSync(df, JSON.stringify(draft), "utf8");
    const mout = path.join(td, "m-bad-sha.json");
    const r = child(["--ticket", "UPG-92", "--branch", "feat/upg92", "--hash", "0".repeat(40),
      "--manifest-draft", df, "--manifest-out", mout]);
    const pass = r.status === 1 && !fs.existsSync(mout) && /MANIFEST_REJECT/.test(r.stderr || "");
    return { pass, signal: `exit=${r.status} 残件清除=${!fs.existsSync(mout)} REJECT 输出=${/MANIFEST_REJECT/.test(r.stderr || "")}` };
  });

  // 案 4（骨架回归）：无 evidence/manifest 参数 → 骨架照出、hash 三重栏「待填」、exit 0
  run("回归：骨架生成零回归（无 manifest 参数照出）", () => {
    const r = child(["--ticket", "UPG-92", "--branch", "feat/upg92", "--hash", "abc1234"]);
    const out = r.stdout || "";
    const pass = r.status === 0 && out.includes("# 交付报告 · UPG-92") && out.includes("（待填）") && !out.includes("manifest 自检");
    return { pass, signal: `exit=${r.status} 骨架标题=${out.includes("# 交付报告 · UPG-92")} 待填栏=${out.includes("（待填）")}` };
  });

  fs.rmSync(td, { recursive: true, force: true });
  const passed = cases.filter((c) => c.pass).length;
  console.log("═══ UPG-92 deliver-gen manifest 硬闸自测 ═══");
  for (const c of cases) {
    console.log(`  [${c.pass ? "PASS" : "FAIL"}] ${c.name}`);
    console.log(`        ${c.signal}`);
  }
  console.log(`结论: ${passed === cases.length ? `PASS ${passed}/${cases.length}` : `FAIL ${passed}/${cases.length}`}（机器只出 flag，人裁决）`);
  process.exit(passed === cases.length ? 0 : 1);
}

// ---------------- 骨架生成 ----------------

function buildSkeleton(o, hashRes, tests, date, manifestInfo) {
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
  push(`| \`${o.hash}\` | ${o.artifactSha ? `\`${o.artifactSha}\`` : "（待填）"} | ${manifestInfo ? `\`${manifestInfo.sha}\`` : "（待填）"} |`);
  push("");
  if (manifestInfo) {
    push(`**manifest 自检（UPG-92 内置硬闸 · 审验.py --manifest）**：ok:True ｜ 绑定值重算一致 ｜ 文件：\`${path.relative(ROOT, manifestInfo.path).split(path.sep).join("/")}\``);
    push("");
  }
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
  if (opts.selfTest) { selfTest(); return; }
  const missing = [];
  if (!opts.ticket) missing.push("--ticket");
  if (!opts.branch) missing.push("--branch");
  if (!opts.hash) missing.push("--hash");
  if (missing.length) { console.error(`缺少参数: ${missing.join(", ")}`); process.exit(2); }

  const date = opts.date || today();

  // UPG-92 硬闸：先过 manifest 闸，闸不过=交付生成失败（报告都不产出）
  let manifestInfo = null;
  if (!opts.noManifest && (opts.evidence.length || opts.manifestDraft)) {
    manifestInfo = produceManifestWithGate(opts, date);
  }

  let hashRes = { result: "UNKNOWN", signal: "未校验", exit: null };
  if (opts.appPath) {
    try { hashRes = verifyHashViaAudit(opts.appPath, opts.branch, opts.hash); }
    catch (e) { hashRes = { result: "ERROR", signal: `调用审验.py 失败: ${e.message}`, exit: null }; }
  }

  const tests = summarizeTests(opts.testsXml);
  const md = buildSkeleton(opts, hashRes, tests, date, manifestInfo);

  console.log("═══ SYS-02 V2 deliver-gen ═══");
  console.log(`ticket=${opts.ticket}  branch=${opts.branch}  hash=${opts.hash}`);
  if (manifestInfo) {
    console.log(`manifest: MANIFEST_OK（自检 ok:True 重算一致） sha=${manifestInfo.sha.slice(0, 12)}… → ${manifestInfo.path}`);
  } else {
    console.log(`manifest: 未生成（${opts.noManifest ? "--no-manifest" : "无 --evidence/--manifest-draft"}）`);
  }
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
