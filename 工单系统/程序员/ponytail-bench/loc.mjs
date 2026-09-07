#!/usr/bin/env node
// ponytail-bench · loc.mjs（2026-09-02）
// 确定性代码规模测量：非空非注释 LOC。用于交付前「极简对照」申报。
// 用法：
//   node loc.mjs <file...>            # 统计文件（或整段代码字符串）
//   node loc.mjs --diff <base..head>  # 统计 git diff 的净 LOC（+增/-删/净）
//   node loc.mjs --stat               # 显示基准表（参考）
import fs from "fs";
import { execSync } from "child_process";

function countLOC(text) {
  // 与 ponytail loc.js 同口径：非空、非 //、非 #、非注释行；fenced 块优先
  const blocks = [...text.matchAll(/```[a-zA-Z0-9_+-]*\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
  const code = (blocks.length ? blocks.join("\n") : text).replace(/\/\*[\s\S]*?\*\//g, "");
  const lines = code.split("\n").map((l) => l.trim());
  return lines.filter((l) => l && !l.startsWith("//") && !l.startsWith("#") &&
    l !== "*/" && !l.startsWith("/*") && !l.startsWith("*") && !l.startsWith("<!--")).length;
}

function diffLOC(range) {
  // git diff 干净行统计：+增量行 / -删除行（过滤 diff 元数据与注释）
  const out = execSync(`git diff -U0 ${range} -- . ':(exclude)app/src/main/assets/pages/**/assets/*' ':(exclude)*.lock' ':(exclude)docs/*.jsonl' 2>/dev/null | head -c 4000000`, { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  let add = 0, del = 0;
  for (const line of out.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) add++;
    if (line.startsWith("-") && !line.startsWith("---")) del++;
  }
  return { add, del, net: add - del };
}

const args = process.argv.slice(2);
if (args[0] === "--diff" && args[1]) {
  const r = diffLOC(args[1]);
  console.log(`Code-LOC 申报：+${r.add} / -${r.del} / 净 ${r.net >= 0 ? "+" : ""}${r.net}`);
  process.exit(0);
}
if (args[0] === "--stat") {
  console.log("基准参考（ponytail 官方 5 任务中位数，Claude 系列）：");
  console.log("  baseline(no skill): 518(Haiku)/693(Sonnet)/256(Opus) 行");
  console.log("  ponytail          :  39/44/51 行");
  console.log("  → 机制=消除膨胀，非压缩；真实值以本仓库交付 diff 为准");
  process.exit(0);
}
const files = args.length ? args : ["-"];
const text = args.length ? files.map((f) => fs.readFileSync(f, "utf8")).join("\n") : fs.readFileSync(0, "utf8");
console.log("Code-LOC:", countLOC(text));
