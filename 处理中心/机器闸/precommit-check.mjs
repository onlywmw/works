#!/usr/bin/env node
// precommit-check.mjs —— 体系仓提交前自证（2026-09-28 立·取 pre-commit/ruff/gitleaks 精华）
//
// 只查**暂存区**（快·不打扰他人）：①账本完整性 ②语法 ③密钥。
// 设计取向：**危险项 fail-closed（拦截），基础设施缺失项降级为警告**（不因环境问题卡住所有人）。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REPO = process.cwd();
// 2026-09-30 扫尾加固：大批量暂存（如归档迁移批 4000+ 件）时 diff --cached 输出超默认 1MB 缓冲 ⇒ ENOBUFS ⇒ 钩崩被误读为「自证未过」拦一切提交——maxBuffer 提至 64MB
const git = (a) => execFileSync("git", ["-C", REPO, ...a], { windowsHide: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const staged = git(["diff", "--cached", "--name-only", "-z"]).split("\0").filter(Boolean); // 2026-09-30 修：原 --name-only 默认 core.quotepath=on ⇒ 中文路径被引号+八进制转义 ⇒ ①账本检查与逐路径 fs 检查静默失配（-z 直出原始字节）
if (!staged.length) process.exit(0);

const problems = [], warns = [];

// ① 账本完整性：工单库/台账类被改时，卡数与二级标题不得减少，行数不得异常缩水
for (const f of staged) {
  if (!/(工单库[^/]*\.md|挂账登记表[^/]*\.md|台账[^/]*\.md)$/.test(f)) continue;   // SYS-204 B#19：含备份/归档变体（工单库_backup_*/工单库_归档/*）
  let head = "";
  try { head = git(["show", `HEAD:${f}`]); } catch { continue; }     // 新文件跳过
  let now;
  try { now = fs.readFileSync(f, "utf8"); } catch (e) { problems.push(`${f}：读取失败（${e.code || e.message}）——按截断疑点拦`); continue; }   // SYS-204 B#19：读失败不崩钩
  const cnt = (s, re) => (s.match(re) || []).length;
  const hCards = cnt(head, /^# (?:UPG|SYS|POL)-\d+ /gm), nCards = cnt(now, /^# (?:UPG|SYS|POL)-\d+ /gm);
  const hH2 = cnt(head, /^## /gm), nH2 = cnt(now, /^## /gm);
  if (nCards < hCards) problems.push(`${f}：卡数减少 ${hCards} → ${nCards}（疑截断）`);
  if (nH2 < hH2) problems.push(`${f}：二级标题减少 ${hH2} → ${nH2}（疑截断）`);
  if (now.split("\n").length < head.split("\n").length * 0.7) problems.push(`${f}：行数缩水 >30%（疑截断）`);
  if (!now.endsWith("\n")) problems.push(`${f}：结尾缺换行`);
}

// ② 语法：改动的 .mjs/.js 用 node --check；.py 用 py_compile
//   2026-10-01 修（设计师·归档尾批实测）：证据/归档面 = 冻结记录（含残缺历史脚本·先例 UPG-435 l2 _grab-sandbox.mjs / _refill1.mjs 引号残缺），非活代码——语法闸不适用；改它=破 dirHash（SYS-155）。账本/密钥/白名单闸仍全跑。
const EVIDENCE_RE = /(^处理中心\/归档\/|\/证据数据\/|-evidence\/)/;
for (const f of staged) {
  if (!fs.existsSync(f)) continue;
  if (EVIDENCE_RE.test(f)) continue;
  if (/\.(mjs|js)$/.test(f)) {
    try { execFileSync("node", ["--check", f], { windowsHide: true, stdio: "pipe" }); } catch (e) { problems.push(`${f}：node --check 失败\n${(e.stderr || "").toString().slice(0, 300)}`); }
  } else if (/\.py$/.test(f)) {
    try { execFileSync("python", ["-m", "py_compile", f], { windowsHide: true, stdio: "pipe" }); } catch (e) { problems.push(`${f}：py_compile 失败`); }
  }
}

// ③ 密钥：gitleaks 若在位则扫暂存（缺则降级警告）。
//    2026-10-01 接线共享配置（巡检台裁量·卫生通报）：未带 -c ⇒ 09-29 已入册的归档假阳白名单在提交闸侧失效
//    （实测：验收员 UPG-16 apksigner_verify_verbose.txt 默认 3 条 → 带 -c 0 条；白名单见 巡检台/_tools/gitleaks.toml）。
//    配置缺失则退回默认配置（不因缺配置整体跳过密钥扫描）。
const GL = ["巡检台/_tools/bin/gitleaks.exe", "C:/Users/Administrator/Desktop/灵感库/工具/gitleaks.exe"].map(p => path.resolve(REPO, p)).find(p => fs.existsSync(p));
if (GL) {
  const GLC = path.resolve(REPO, "巡检台/_tools/gitleaks.toml");
  const glArgs = ["git", "--staged", "--no-banner", "--redact"];
  if (fs.existsSync(GLC)) glArgs.push("-c", GLC);
  try { execFileSync(GL, glArgs, { windowsHide: true, cwd: REPO, stdio: "pipe" }); }
  catch (e) { problems.push(`gitleaks：暂存区疑有密钥\n${(e.stdout || "").toString().slice(0, 400)}`); }
} else warns.push("gitleaks 未找到——密钥扫描跳过");

// ④ 角色根层白名单（2026-09-30 立·根因：设计师侧「证据数据 vs 检查证据」两套名·写入面无闸）：
//    复用 layout-check 的 ROLE_RULES（单一真源，不另抄一份）——暂存区**新增/改动**的 <角色>/<首段> 越白名单即拦；删除放行（清理存量越界件必须能提交）
let ROLE_RULES = null;
try { ({ ROLE_RULES } = await import("./layout-check.mjs")); } catch (e) { problems.push(`layout-check 依赖不可用（${String(e.message || e)}）——白名单闸 fail-closed`); }   // SYS-204 B#19
for (const f of staged) {
  const [role, seg] = f.split("/");
  const rule = ROLE_RULES && ROLE_RULES[role];
  if (!rule || !seg || !fs.existsSync(f)) continue;
  if (rule.fixed.includes(seg) || (rule.pattern && rule.pattern.test(seg))) continue;
  problems.push(`${f}：${role} 根层越界（白名单见该角色手册卫生节／layout-check ROLE_RULES——确需新增先改白名单同批提交）`);
}

if (warns.length) console.log("⚠ " + warns.join("；"));

// ⑤ 复用扫（SYS-192·**warn 起步**）：新增行旁路模式（新 HttpURLConnection／Keystore／存储根／正则／基址）——
//   单源清单＝checks/单源清单.json；计次留痕＝checks/dup-radar.count.jsonl；**不 fail-closed**（7 日看误报率后再议）。
try {
  const radar = path.resolve(REPO, "处理中心/机器闸/checks/dup-radar.mjs");
  if (fs.existsSync(radar)) {
    try {
      execFileSync("node", [radar, "--staged", "--quiet"], { windowsHide: true, cwd: REPO, stdio: "pipe" });
    } catch (e) {
      const last = (e.stdout || "").toString().trim().split("\n").pop() || "有命中";
      console.log("⚠ 复用扫：" + last + "（→ 单源建议见 checks/单源清单.json）");
    }
  }
} catch { /* 雷达缺失不阻断（warn 级） */ }
// ⑥ 乱码扫（SYS-201·**warn 起步**）：暂存区件跑 checks/mojibake-scan.mjs --staged（五探针·白名单＝checks/mojibake-baseline.json）——
//   只提示不 fail-closed（7 日看误报率后再议；沿 ⑤ 复用扫先例）。确需保留 ⇒ 补基线理由（只增需理由）。
try {
  const moji = path.resolve(REPO, "处理中心/机器闸/checks/mojibake-scan.mjs");
  if (fs.existsSync(moji)) {
    try {
      execFileSync("node", [moji, "--staged", "--quiet"], { windowsHide: true, cwd: REPO, stdio: "pipe" });
    } catch (e) {
      const last = (e.stdout || "").toString().trim().split("\n").filter(Boolean).pop() || "有命中";
      console.log("⚠ 乱码扫：" + last.replace(/^乱码扫\s*/, "") + "（→ 复核后确需保留补 checks/mojibake-baseline.json 理由）");
    }
  }
} catch { /* 扫描器缺失不阻断（warn 级） */ }
if (problems.length) {
  console.error("✗ 提交前自证不过：\n   - " + problems.join("\n   - "));
  console.error("\n（确需跳过：git commit --no-verify；但账本截断类问题请先修）");
  process.exit(1);
}
console.log(`✅ 提交前自证通过（${staged.length} 件：账本完整/语法/密钥/角色根层白名单/复用扫(warn)/乱码扫(warn)）`);
