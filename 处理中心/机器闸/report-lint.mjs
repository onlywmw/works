#!/usr/bin/env node
// report-lint.mjs —— 交付报告固定槽位检查（2026-10-07 立·§50/#48 对账行；2026-10-08 增 F-2 面槽位·验收席族级提请：当日两单同款双缺）
// 2026-10-09 SYS-199 增「族名引用」体检段（引文写全件名·warn 起步·来源＝审验提请同族 4 例·挂账行 568 裁定工具化）：
//   报告正文里**族名代号**（形如 rt01/t17a/r01——实测件族名）**不带 .md／路径** ⇒ warn `⚠ 族名引用：<文件>:<行号> <片段>`；
//   同行含 `.md`（全件名在场）⇒ 整行不响。默认 rc 语义不变（warn 不阻断）；`--strict` ⇒ warn 计入 rc=1。
//   容差（自定·误报写明）：
//     ① t/r 族取两位（t0/t1 计时标签、闸名 t2 等噪声不检；rt 族 1–2 位）；② 前置 `-` 不检（check-t2-batch／信 id `…-r31` 等连字标识）；
//     ③ 前置路径分隔符（`/`\）不检（`…/raw/rt17a` 路径片段）；④ 行内含 `.md` ⇒ 整行不响（含「把 refs 存成 .md」类散文）。
//
// 语义：交付报告 MUST 含——①固定标题行「新建 vs 复用」（三席统一口径·见
//       设计师/经验库/派单模板口径补遗_2026-09-30.md §48「对账行最小格式」）；
//       ②F-2 面声明（SYS-179：rc 读数，或无 kt 变件的单写「F-2 N/A」）；
//       ③族名引用体检（SYS-199·warn）。
// 用法：
//   node 处理中心/机器闸/report-lint.mjs <报告.md> [更多…]
//   node 处理中心/机器闸/report-lint.mjs --dir 程序员/交付报告        # 全目录扫描（**仅盘点历史用**：规则 2026-10-07 生效，历史存档自然缺行，其❌不作回归读数；在办单请单文件跑）
//   node 处理中心/机器闸/report-lint.mjs --strict --dir 处理中心/汇报区   # warn 计入 rc=1（可选红·默认不阻断）
//   node 处理中心/机器闸/report-lint.mjs --self-test                  # 正案/反案自测（族名 warn＋既有槽位零回归锚）
// 谁在哪跑（SYS-199 §使用说明）：
//   · 交付席：交付前单件跑本单报告（`<报告.md>`）；全量盘点用 `--dir 程序员/交付报告`（历史❌不作回归）。
//   · 验收/审验席：结论件、回执件、合并记录落盘前单件跑（或 `--dir 处理中心/汇报区` 扫存量）。
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..");
const HEAD = "新建 vs 复用";
const HEAD2 = "F-2";
// 族名代号（实测件族名：rt01…/t01…/r01…）；容差见头部注释 ①②③④
const FAMILY_RE = /(?<![A-Za-z0-9_/\\-])((?:rt\d{1,2}[a-z]?|t\d{2}[a-z]?|r\d{2}[a-z]?))(?![A-Za-z0-9_])/g;

/** 族名引用体检：返回 [{line, tokens, snippet}]（同行含 .md ⇒ 不响）。 */
function familyRefs(text) {
  const out = [];
  text.split("\n").forEach((line, i) => {
    if (line.includes(".md")) return;
    const m = line.match(FAMILY_RE);
    if (m) out.push({ line: i + 1, tokens: [...new Set(m)], snippet: line.trim().slice(0, 60) });
  });
  return out;
}

const args = process.argv.slice(2);
const STRICT = args.includes("--strict");
const SELF_TEST = args.includes("--self-test");
const positional = args.filter((a) => !a.startsWith("--"));

function check(f) {
  const t = fs.readFileSync(f, "utf8");
  const miss = [];
  if (!t.includes(HEAD)) miss.push("「新建 vs 复用」对账行（#48）");
  if (!t.includes(HEAD2)) miss.push("F-2 面声明（SYS-179·rc 读数或「F-2 N/A（含理由）」）");
  const warns = familyRefs(t);
  for (const w of warns) console.log(`⚠ 族名引用：${f}:${w.line} ${w.snippet}`);
  console.log(
    `${miss.length === 0 ? "✅" : "❌"} ${f}${miss.length ? " —— 缺 " + miss.join("／") + "（报告不完整→打回补正）" : ""}` +
      (warns.length ? `｜族名引用 warn ${warns.length} 处` : ""),
  );
  return { ok: miss.length === 0, missing: miss.length, warns: warns.length };
}

function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "report-lint-sys199-"));
  const w = (n, s) => { const p = path.join(dir, n); fs.writeFileSync(p, s, "utf8"); return p; };
  const good = w("good.md", "# 报告\n\n## 新建 vs 复用\n\n- 新建：x\n\n## F-2 面声明\n\n- rc=0\n\n引 `rt17a 捕获串`（裸引）+ `t19a（1552B）`。\n");
  const clean = w("clean.md", "# 报告\n\n## 新建 vs 复用\n\n- 新建：x\n\n## F-2 面声明\n\n- rc=0\n\n引 `程序员/UPG600-armed-evidence/raw/rt17a-首跑562B.md:3`（全件名+行号）。\n");
  const bad = w("bad.md", "# 报告（缺槽位）\n\n内容。\n");
  const self = fileURLToPath(import.meta.url);
  const run = (a) => spawnSync(process.execPath, [self, ...a], { encoding: "utf8", windowsHide: true });
  const cases = [
    ["正案：裸引 ⇒ warn（rc=0 不阻断）", run([good]), (r, o) => r.status === 0 && /族名引用 warn 1 处/.test(o) && /rt17a|t19a/.test(o)],
    ["反案：全件名+行号 ⇒ 零响", run([clean]), (r, o) => r.status === 0 && !/^⚠ 族名引用/m.test(o)],
    ["--strict：有 warn ⇒ rc=1", run(["--strict", good]), (r) => r.status === 1],
    ["--strict：无 warn ⇒ rc=0", run(["--strict", clean]), (r) => r.status === 0],
    ["既有槽位零回归：缺行仍 rc=1", run([bad]), (r, o) => r.status === 1 && /❌/.test(o)],
  ];
  let fail = 0;
  for (const [name, r, ok] of cases) {
    const out = (r.stdout || "") + (r.stderr || "");
    const pass = r.error ? false : ok(r, out);
    console.log(`${pass ? "✅" : "❌"} ${name}`);
    if (!pass) { fail++; console.log(out.slice(0, 400)); }
  }
  console.log(fail ? `—— SYS-199 自测 ${cases.length - fail}/${cases.length}（有败）` : `—— SYS-199 自测 ${cases.length}/${cases.length} 全过`);
  process.exit(fail ? 1 : 0);
}

if (SELF_TEST) selfTest();
if (!positional.length && !args.includes("--dir")) { console.error("用法：node report-lint.mjs <报告.md...> | --dir <目录> | --strict | --self-test"); process.exit(2); }

let files = [];
if (args.includes("--dir")) {
  const d = path.isAbsolute(args[args.indexOf("--dir") + 1]) ? args[args.indexOf("--dir") + 1] : path.join(SYS, args[args.indexOf("--dir") + 1]);
  files = fs.readdirSync(d).filter((f) => f.endsWith(".md")).map((f) => path.join(d, f));
} else {
  files = positional.map((a) => (path.isAbsolute(a) ? a : path.join(process.cwd(), a)));
}

let pass = 0, bad = 0, missSlots = 0, warns = 0;
for (const f of files) {
  if (!fs.existsSync(f)) { console.log(`⚠ 不存在：${f}`); bad++; missSlots += 1; continue; }
  const r = check(f);
  if (r.ok) pass++; else { bad++; missSlots += r.missing; }
  warns += r.warns;
}
console.log(`—— 通过 ${pass}｜未过 ${bad} 件（共缺槽位 ${missSlots} 项）｜族名引用 warn ${warns} 处｜共 ${files.length}`);
process.exit(bad || (STRICT && warns) ? 1 : 0);
