#!/usr/bin/env node
// evidence-sums.mjs —— 证据清单生成/校验（标准格式：`<sha256>␠␠<相对路径>`·可被 `sha256sum -c` 直接消费）
//
// 背景（2026-09-28 审验 F-B）：EVIDENCE_SHA256SUMS.txt 此前由人工手写，格式为 `path:hash`
// ⇒ 标准 `sha256sum -c` 报格式错，复核者只能自写解析器。本工具定死格式并给出校验。
//
// 用法：
//   node evidence-sums.mjs gen   <dir> [--manifest EVIDENCE_SHA256SUMS.txt]   # 生成清单（覆盖）＋打印官方目录 pin（重录 DEL 用）
//   node evidence-sums.mjs check <dir> [--manifest EVIDENCE_SHA256SUMS.txt]   # 校验（缺件/改件/多件）
// 退出码：0=全过；1=有差异；2=用法错误
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const [cmd, dirArg, ...rest] = process.argv.slice(2);
if (!cmd || !dirArg || !["gen", "check"].includes(cmd)) {
  console.error("用法：node evidence-sums.mjs gen|check <dir> [--manifest <文件名>]");
  process.exit(2);
}
const MANIFEST = (() => { const i = rest.indexOf("--manifest"); return i >= 0 ? rest[i + 1] : "EVIDENCE_SHA256SUMS.txt"; })();
const ROOT = path.resolve(dirArg);

function walk(d) {
  return readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : (e.name === MANIFEST ? [] : [p]);
  });
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

// 官方目录 pin 口径（审验员/_tools/审验.py::_dir_sha256）：**只取顶层文件**·sorted(文件名)+内容 依次摘要。
// 用途：DEL 清单 evidence_manifest 里 E-00x 的 sha256 就是这个值；重写顶层任一文件（含本清单 SUMS 自身）都会让它陈化。
function dirPin(d) {
  const h = createHash("sha256");
  for (const name of readdirSync(d).sort()) {
    const fp = path.join(d, name);
    if (statSync(fp).isFile()) { h.update(name, "utf8"); h.update(readFileSync(fp)); }
  }
  return h.digest("hex");
}
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

const files = walk(ROOT).sort();
if (!files.length) { console.error(`✗ 目录内无可入清单的文件：${ROOT}`); process.exit(1); }

if (cmd === "gen") {
  const lines = files.map((p) => `${sha(p)}  ${rel(p)}`);
  writeFileSync(path.join(ROOT, MANIFEST), lines.join("\n") + "\n", "utf8");
  console.log(`✅ 已生成 ${MANIFEST}：${lines.length} 件（格式 hash␠␠path·标准工具可直接消费）`);
  console.log(`   自检：cd "${ROOT}" && sha256sum -c ${MANIFEST}`);
  const pin = dirPin(ROOT);
  console.log(`⚠ 顶层目录 pin（官方口径·供 DEL 清单 E-00x 用）：${pin}`);
  console.log(`   → **重建 SUMS 会让已登记的 pin 陈化**（SUMS 本身就在覆盖集里）：若本目录是某 DEL 的 E-00x，`);
  console.log(`     请同步重录清单 sha256=该 pin 并重算 evidence_manifest_sha（审验 F-3 口径，2026-09-28）。`);
} else {
  const mf = path.join(ROOT, MANIFEST);
  let raw;
  try { raw = readFileSync(mf, "utf8"); } catch { console.error(`✗ 清单不存在：${mf}`); process.exit(1); }
  const want = new Map();
  for (const [i, line] of raw.split("\n").entries()) {
    if (!line.trim()) continue;
    const m = line.match(/^([0-9a-f]{64})\s\s+(.+)$/);
    if (!m) { console.error(`✗ 第 ${i + 1} 行非标准格式（应 hash␠␠path）：${line.slice(0, 80)}`); process.exit(1); }
    want.set(m[2], m[1]);
  }
  let bad = 0;
  for (const [r, h] of want) {
    const p = path.join(ROOT, r);
    let actual;
    try { actual = sha(p); } catch { console.error(`✗ 缺件：${r}`); bad++; continue; }
    if (actual !== h) { console.error(`✗ 改动：${r}\n    清单 ${h}\n    现盘 ${actual}`); bad++; }
  }
  for (const f of files) if (!want.has(rel(f))) { console.error(`✗ 清单外多件：${rel(f)}`); bad++; }
  if (bad) { console.error(`\n✗ 校验不过：${bad} 处差异（清单 ${want.size} 件）`); process.exit(1); }
  console.log(`✅ 校验通过：${want.size} 件逐位一致（标准工具亦可：cd "${ROOT}" && sha256sum -c ${MANIFEST}）`);
}
