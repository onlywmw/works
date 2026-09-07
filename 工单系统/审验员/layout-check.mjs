#!/usr/bin/env node
// 目录布局检查器（2026-09-02）——防「工单系统角色散落到 Desktop\MOV 根层」复发
// 用法：node 审验员/layout-check.mjs [--root <Desktop\MOV 路径>]
// 退出码：0=干净；1=检出违规
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT_ARG = process.argv[process.argv.indexOf("--root") + 1];
const SYS = path.resolve(here, "..");            // 工单系统/
const ROOT = ROOT_ARG ? path.resolve(ROOT_ARG) : path.dirname(SYS); // Desktop\MOV

// 禁止出现在根层的工单系统角色/文件（唯一权威=工单系统/）
const FORBIDDEN = [
  "设计师", "审验员", "程序员", "验收员", "处理中心",
  "工单库.md", "工单表.xlsx", "挂账登记表.md", "归档", "_备份归档",
  "调试", "upg50-ph2-cdp", "验证产物",
];
const errors = [];

for (const name of FORBIDDEN) {
  const p = path.join(ROOT, name);
  if (fs.existsSync(p)) errors.push(`根层出现工单系统内容: ${name}`);
}

// 工单系统完整性
const lib = path.join(SYS, "工单库.md");
if (!fs.existsSync(lib)) errors.push("工单库.md 缺失");
else {
  const t = fs.readFileSync(lib, "utf8");
  const cards = (t.match(/^# UPG-\d+/gm) || []).length;
  if (cards < 50) errors.push(`工单卡数异常: ${cards}（应 ≥50）`);
}
for (const d of ["设计师", "审验员", "程序员", "验收员", "处理中心"]) {
  if (!fs.existsSync(path.join(SYS, d))) errors.push(`工单系统/ 缺目录: ${d}`);
}

if (errors.length) {
  console.log("❌ LAYOUT CHECK FAIL");
  for (const e of errors) console.log("  - " + e);
  process.exit(1);
}
console.log("✅ LAYOUT CHECK PASS（根层无工单系统散落；工单系统/ 结构完整）");
