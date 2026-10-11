#!/usr/bin/env node
// SYS-191 对话可用性闸 · tool-face-audit.mjs —— 工具面覆盖静态审计（产品仓**只读**）
//
// 口径（change=conversation-capability-parity · spec conversation-tool-face / conversation-readiness-gate）：
//   注册面 R = tools|market|pages/*.kt ＋ MainActivity*.kt 的 handlers["…"]= / mcpHandlers["…"]=
//              ＋ BuiltinMcpTools.all()/SceneTools.all() 的 name="…"（内置/场景动态）
//   进面   N = R − ToolSurfaces.UI_ONLY（安全硬墙） − 排除名单（候选 UPG-561 落·含脚本 EXEMPT 表位）
//   已描述 M = R ∩（host meta B1–B6「"…" to HostToolMetaEntry」＋ DeviceProvider ParamDef
//              ＋ ObsidianProvider obsidian.* 元数据 ＋ builtin/scene 动态定义）
//   裸奔   K = 进面内无描述/空 schema（回落「MOV 工具: <名称>」）者
//   另：browser 面（BrowserMcpTools 14 个·自带描述·经 MCP 代理挂载为 mcp__browser__*）单列读数
//   基线：BASELINE 常量内嵌（改基线＝改常量＋注记）；K > 基线.裸奔 ⇒ rc=1（巡检出声）
//
// 用法（验收/巡检一行式）：
//   node 处理中心/机器闸/tool-face-audit.mjs              # 默认一行摘要（读数＋基线差）
//   node 处理中心/机器闸/tool-face-audit.mjs --list       # 加裸奔清单（按域聚合）
//   node 处理中心/机器闸/tool-face-audit.mjs --json       # 机读全量（含清单/基线差）
//   node 处理中心/机器闸/tool-face-audit.mjs --repo <dir> # 指定产品仓根（缺省=lib/root.mjs 的 PRODUCT·测试隔离副本用）
// 示例输出（2026-10-07 首跑·0027-mov 现头）：
//   工具面覆盖：注册 269 ｜ 进面 248 ｜ 已描述 175（面内 174） ｜ 裸奔 74 ｜ UI-only 21 ｜ 排除 0 ｜ 基线差 裸奔 +0
// 退出码：0=正常（K≤基线）｜1=裸奔超基线 ｜2=用法/环境错（树不完整）
// 幂等：同树两跑同值（输出无时间戳）；只读产品仓（零写入）。
import fs from "node:fs";
import path from "node:path";
import { PRODUCT } from "./lib/root.mjs"; // SYS-160：产品仓根解析单源

// ── 基线常量（2026-10-07 首跑＝盘点口径 0027-mov@5a081882；清欠 UPG-561 后回填「裸奔 0＋豁免基数」）──
const BASELINE = {
  registered: 269,
  inFace: 232,
  described: 233,
  bare: 0,
  uiOnly: 21,
  excluded: 16,
  note: "改基线＝改常量＋注记（2026-10-07 更新：UPG-561 合并后＝清欠真值·裸奔 0＋豁免 16；初值＝盘点 269/248/175/74/21/0）",
};

// ── 排除名单/豁免表（候选 UPG-561 落；表内条目不计裸奔·计入「排除」；每项须具名理由）──
const EXEMPT = [
  // { name: "mall.http", reason: "内嵌商城页执行通道（页面桥）" },
];

// ── 参数 ──
const argv = process.argv.slice(2);
const jIdx = argv.indexOf("--repo");
const REPO = path.resolve(jIdx >= 0 ? argv[jIdx + 1] : PRODUCT);
const JSON_OUT = argv.includes("--json");
const LIST = argv.includes("--list") || JSON_OUT;
const die = (msg) => { console.error(msg); process.exit(2); };

const A = path.join(REPO, "app/src/main/java/com/mov/android");
const K = path.join(REPO, "app/src/main/kotlin/com/hermes/mov");
const read = (p) => fs.readFileSync(p, "utf8");
const mustRead = (p) => { if (!fs.existsSync(p)) die(`❌ 缺件（树不完整）：${p}`); return read(p); };
const listDir = (dir, re) => { try { return fs.readdirSync(dir).filter((f) => re.test(f)).map((f) => path.join(dir, f)); } catch { return []; } };
const scan = (files, re) => { const out = []; for (const f of files) for (const m of read(f).matchAll(re)) out.push(m[1]); return out; };
// 行注释/块注释行不进注册面（防注释样例计数）
const isComment = (line) => { const t = line.trim(); return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*"); };

// ── 注册面 R ──
const regFiles = [
  ...listDir(path.join(A, "tools"), /\.kt$/),
  ...listDir(path.join(A, "market"), /\.kt$/),
  ...listDir(path.join(A, "pages"), /\.kt$/),
  ...listDir(A, /^MainActivity.*\.kt$/),
];
const dynamicFiles = [path.join(K, "tools/BuiltinMcpTools.kt"), path.join(K, "tools/SceneTools.kt")];
const reg = new Set();
for (const f of regFiles) for (const line of read(f).split("\n")) {
  if (isComment(line)) continue;
  const m = /(?:handlers|mcpHandlers)\["([^"]+)"\]\s*=/.exec(line);
  if (m) reg.add(m[1]);
}
for (const f of dynamicFiles) for (const m of read(f).matchAll(/name\s*=\s*"([^"]+)"/g)) reg.add(m[1]);
if (!regFiles.length || !fs.existsSync(dynamicFiles[0])) die(`❌ 树不完整：${REPO}\n   缺 app/src/main/java/com/mov/android/{tools,market,pages}/ 或 kotlin/com/hermes/mov/tools/（--repo 指产品仓根）`);
if (!reg.size) die(`❌ 注册面为空（树/口径不符）：${REPO}`);

// ── 已描述面（host meta B1–B6 ＋ Device ＋ Obsidian ＋ builtin/scene）──
const described = new Set();
const metaFiles = listDir(path.join(A, "meta"), /^HostToolMetaB.*\.kt$/);
if (!metaFiles.length) die(`❌ 缺 host meta（meta/HostToolMetaB*.kt）：${path.join(A, "meta")}`);
for (const f of metaFiles) {
  for (const m of read(f).matchAll(/"([^"]+)"\s+to\s+HostToolMetaEntry/g)) described.add(m[1]);
}
for (const m of mustRead(path.join(A, "DeviceProvider.kt")).matchAll(/ParamDef\("([^"]+)"/g)) described.add(m[1]);
for (const m of mustRead(path.join(A, "ObsidianProvider.kt")).matchAll(/"(obsidian\.[a-z.]+)"/g)) described.add(m[1]);
for (const f of dynamicFiles) for (const m of read(f).matchAll(/name\s*=\s*"([^"]+)"/g)) described.add(m[1]);
if (!described.size) die(`❌ 已描述面为空（meta 未读到）：${REPO}`);

// ── 名单面：UI_ONLY（安全硬墙）＋排除名单（产品侧候选·脚本 EXEMPT 表）──
const setBlockNames = (text, varRe) => {
  const out = [];
  for (const m of text.matchAll(varRe)) {
    const block = text.slice(m.index);
    const end = block.search(/\n\s*\)\s*\n/);
    for (const s of block.slice(0, end < 0 ? block.length : end).matchAll(/"([^"]+)"/g)) out.push(s[1]);
  }
  return out;
};
const tsText = mustRead(path.join(A, "tools/ToolSurfaces.kt"));
// UPG-561 合并位修（2026-10-07）：排除名单实形＝Map<String,String>（带逐条理由·linkedMapOf）——
// 原仅认 Set<String>=setOf( 形态 ⇒ 把 16 件排除误计为裸奔（接口失配，合并位当场修）。
const mapBlockKeys = (text, varRe) => {
  const out = [];
  for (const m of text.matchAll(varRe)) {
    const block = text.slice(m.index);
    const end = block.search(/\n\s*\)\s*\n/);
    for (const s of block.slice(0, end < 0 ? block.length : end).matchAll(/"([^"]+)"\s*to\s*"/g)) out.push(s[1]);
  }
  return out;
};
const uiOnly = new Set(setBlockNames(tsText, /val\s+UI_ONLY\s*:\s*Set<String>\s*=\s*setOf\(/g));
const excluded = new Set([...EXEMPT.map((e) => e.name), ...setBlockNames(tsText, /val\s+[A-Z_]*EXCLU[A-Z_]*\s*:\s*Set<String>\s*=\s*setOf\(/g), ...mapBlockKeys(tsText, /val\s+[A-Z_]*EXCLU[A-Z_]*\s*:\s*Map<String\s*,\s*String>\s*=\s*linkedMapOf\(/g)]);
if (!uiOnly.size) die(`❌ UI_ONLY 未解析到（ToolSurfaces.kt 形状变化？）：${path.join(A, "tools/ToolSurfaces.kt")}`);

// ── browser 面（单列·不属 269 注册面）──
const browserNames = scan([path.join(K, "browser/BrowserMcpTools.kt")], /ToolMeta\(\s*"([^"]+)"/g);

// ── 读数 ──
const R = [...reg];
const uiInR = R.filter((n) => uiOnly.has(n));
const exclInR = R.filter((n) => excluded.has(n));
const inFace = R.filter((n) => !uiOnly.has(n) && !excluded.has(n));
const describedInR = R.filter((n) => described.has(n));
const describedInFace = inFace.filter((n) => described.has(n));
const bare = inFace.filter((n) => !described.has(n));
const bareByDomain = (() => {
  const m = new Map();
  for (const n of bare) { const d = n.includes(".") ? n.split(".")[0] : "(无域)"; if (!m.has(d)) m.set(d, []); m.get(d).push(n); }
  return [...m.entries()].map(([d, names]) => ({ domain: d, count: names.length, names: [...names].sort() })).sort((a, b) => b.count - a.count || (a.domain < b.domain ? -1 : 1));
})();
const delta = { registered: R.length - BASELINE.registered, inFace: inFace.length - BASELINE.inFace, described: describedInR.length - BASELINE.described, bare: bare.length - BASELINE.bare, uiOnly: uiInR.length - BASELINE.uiOnly, excluded: exclInR.length - BASELINE.excluded };
const over = bare.length > BASELINE.bare;

// ── 输出 ──
if (JSON_OUT) {
  console.log(JSON.stringify({
    repo: REPO,
    counts: { registered: R.length, inFace: inFace.length, described: describedInR.length, describedInFace: describedInFace.length, bare: bare.length, uiOnly: uiInR.length, uiOnlyTotal: uiOnly.size, excluded: exclInR.length },
    baseline: BASELINE,
    delta,
    bareByDomain,
    bare,
    uiOnly: [...uiOnly].sort(),
    uiOnlyNotRegistered: [...uiOnly].filter((n) => !reg.has(n)).sort(),
    excludedDeclared: EXEMPT,
    browser: { count: browserNames.length, names: browserNames },
    verdict: over ? "over-baseline" : "ok",
  }, null, 2));
} else {
  console.log(`工具面覆盖：注册 ${R.length} ｜ 进面 ${inFace.length} ｜ 已描述 ${describedInR.length}（面内 ${describedInFace.length}） ｜ 裸奔 ${bare.length} ｜ UI-only ${uiInR.length} ｜ 排除 ${exclInR.length} ｜ 基线差 裸奔 ${delta.bare >= 0 ? "+" : ""}${delta.bare}`);
  if (LIST) {
    console.log(`裸奔清单（按域聚合·${bare.length} 条）：`);
    for (const g of bareByDomain) console.log(`  ${g.domain}（${g.count}）：${[...g.names].sort().join("、")}`);
  } else if (over) {
    console.log("⚠ 裸奔超基线——跑 --list 取清单（按域聚合）");
  }
}
process.exit(over ? 1 : 0);
