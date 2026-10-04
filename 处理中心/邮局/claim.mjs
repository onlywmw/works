#!/usr/bin/env node
// 邮局·领单锁（并行施工位公共件 · 2026-09-11 用户拍板「别重复同时领同一张单子」）
//
// 用法：
//   node claim.mjs 领 <信id|单号> <工人>    → 原子占位（O_EXCL）；已被占=报占位者+时间（exit 1，请弃单）
//   node claim.mjs 查 <信id|单号>           → 看占位状态
//   node claim.mjs 放 <信id|单号> <工人>     → 释放（仅占位者本人）
//   node claim.mjs 表                        → 全部占位一览（>2h 标 stale）
// 存储：处理中心/邮局/.claims/<key>.json —— fs.openSync('wx') 原子创建 = 防双领核心（EEXIST 即输）
// 协议：**动工前必领**（先领后建 worktree）；先领者赢，后到者立即弃单去领下一张。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, ".claims");
const STALE_MS = 2 * 3600e3;
const [cmd, key, worker] = process.argv.slice(2);
fs.mkdirSync(DIR, { recursive: true });
const f = (k) => path.join(DIR, `${String(k).replace(/[^\w.-]/g, "_")}.json`);
const read = (k) => { try { return JSON.parse(fs.readFileSync(f(k), "utf8")); } catch { return null; } };

if (cmd === "领") {
  if (!key || !worker) { console.error("用法：node claim.mjs 领 <信id|单号> <工人>"); process.exit(2); }
  try {
    const fd = fs.openSync(f(key), "wx"); // 原子：已存在即 EEXIST
    fs.writeSync(fd, JSON.stringify({ key, worker, at: new Date().toLocaleString("sv-SE") }, null, 2));
    fs.closeSync(fd);
    console.log(`✅ CLAIMED：${key} ← ${worker} @${new Date().toLocaleString("sv-SE")}`);
  } catch (e) {
    if (e.code === "EEXIST") {
      const r = read(key);
      console.log(`❌ 已被领：${key} ← ${r?.worker} @${r?.at}（双领已拦——请弃单去领下一张）`);
      process.exit(1);
    }
    throw e;
  }
} else if (cmd === "查") {
  const r = read(key);
  console.log(r ? `占位：${r.key} ← ${r.worker} @${r.at}` : `未占位：${key}`);
} else if (cmd === "放") {
  const r = read(key);
  if (!r) { console.log(`未占位：${key}`); process.exit(0); }
  if (r.worker !== worker) { console.log(`❌ 非占位者（${r.worker}）不得释放`); process.exit(1); }
  fs.unlinkSync(f(key));
  console.log(`🔄 已释放：${key}（原 ${r.worker}）`);
} else if (cmd === "表") {
  const all = fs.readdirSync(DIR).filter((x) => x.endsWith(".json")).map((x) => read(x.replace(/\.json$/, ""))).filter(Boolean);
  if (!all.length) console.log("（无占位）");
  for (const r of all) {
    const age = Date.now() - Date.parse(r.at.replace(" ", "T"));
    console.log(`${r.key} ← ${r.worker} @${r.at}${age > STALE_MS ? " ⚠️stale(>2h·待人工放)" : ""}`);
  }
} else {
  console.log("用法：node claim.mjs 领|查|放|表 …（见文件头注释）");
  process.exit(2);
}
