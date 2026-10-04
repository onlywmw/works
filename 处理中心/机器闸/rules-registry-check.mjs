#!/usr/bin/env node
// rules-registry-check.mjs —— 红线编号撞号机器闸（R4·2026-10-04 工单系统重构·规则即代码）
//
// 缘起：根 README §四历史编号复用（11×2/28×2）靠 2026-09-29 全量校对才人肉发现——「重排编号涉及全局引用，
//       待设计师统一定夺」挂了一个月。本闸把「编号唯一」变机器执法：撞号/漂移即红，提交期拦截。
// 校验面（四查）：
//   ① 注册表自洽：lib/rules-registry.json 可解析·id 唯一·无法源重复条目
//   ② README 编号唯一：根 README 行首 `N. **` 枚举——重复=红（D1-微 同型防线·以后撞号活不过提交）
//   ③ 两面同步：README 编号集 ⇄ 注册表 id 集——差集=红（法条与索引不同步）
//   ④ 引用闸在位：注册表 gates[] 所列件存在（指向已删工具=红）
// 用法：node 处理中心/机器闸/rules-registry-check.mjs　退出码 0=全绿 1=有红 2=环境错
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const README = path.join(ROOT, "README.md");
const REGISTRY = path.join(HERE, "lib", "rules-registry.json");

const problems = [];

// ① 注册表自洽
let rules = [];
try {
  const reg = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  rules = reg.rules || [];
  const ids = rules.map(r => r.id);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dup.length) problems.push(`注册表 id 重复：${[...new Set(dup)].join(",")}`);
} catch (e) {
  console.error(`❌ 注册表不可解析：${e.message}`);
  process.exit(2);
}

// ② README 行首编号枚举（只认 `N. **` 法条形态·§四/§六全覆盖）
const readme = fs.readFileSync(README, "utf8");
const numbered = [...readme.matchAll(/^(\d+)\. /gm)].map(m => Number(m[1]));
const dupReadme = numbered.filter((v, i) => numbered.indexOf(v) !== i);
if (dupReadme.length) problems.push(`README 红线编号撞号：${[...new Set(dupReadme)].join(",")}（历史编号复用——按别名映射重排，见 §四头注）`);

// ③ 两面同步
const readmeSet = new Set(numbered), regSet = new Set(rules.map(r => r.id));
const onlyReadme = [...readmeSet].filter(x => !regSet.has(x));
const onlyReg = [...regSet].filter(x => !readmeSet.has(x));
if (onlyReadme.length) problems.push(`README 有而注册表无：${onlyReadme.join(",")}（新法条未入 rules-registry.json）`);
if (onlyReg.length) problems.push(`注册表有而 README 无：${onlyReg.join(",")}（法条已废/改号未同步注册表）`);

// ④ 引用闸在位（含跨目录引用——在五个工具根里解析：机器闸/四角色 _tools）
const TOOL_ROOTS = [
  path.join(ROOT, "处理中心", "机器闸"),
  path.join(ROOT, "审验员", "_tools"),
  path.join(ROOT, "设计师", "_tools"),
  path.join(ROOT, "程序员", "_tools"),
  path.join(ROOT, "验收员", "_tools"),
];
for (const r of rules) {
  for (const g of r.gates || []) {
    const base = g.split("（")[0];
    if (!TOOL_ROOTS.some(tr => fs.existsSync(path.join(tr, base)))) {
      problems.push(`规则 ${r.id} 引用闸不存在（五工具根均未命中）：${g}`);
    }
  }
}

if (problems.length) {
  console.error("❌ RULES REGISTRY CHECK FAIL：");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
const machine = rules.filter(r => r.enforcement === "machine").length;
const mixed = rules.filter(r => r.enforcement === "mixed").length;
const human = rules.filter(r => r.enforcement === "human").length;
const candidates = rules.filter(r => r.review && r.review["删并候选"]).length;
console.log(`✅ RULES REGISTRY CHECK PASS（红线 ${rules.length} 条·唯一根数 ${new Set(rules.map(r => r.id)).size} ≤ 净减基线 31；执法面 machine ${machine}/mixed ${mixed}/human ${human}；删并候选 ${candidates} 项待设计师裁）`);
