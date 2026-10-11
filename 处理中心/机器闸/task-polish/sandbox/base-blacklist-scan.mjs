#!/usr/bin/env node
// POL-4 黑名单扫描：app 源内游离服务端 base（收编验收用·rc 非 0 = 有游离）
//
// 用法：node base-blacklist-scan.mjs --repo <app worktree 根> [--allow <相对路径（可多次）>] [--json]
// 判据：
//   ①`https://mow.kim` 字面量**只**允许出现在单源 `app/src/main/java/com/mov/android/MovServerBase.kt`
//     （注释行不计·`//`/`*` 开头；业务 URL 一律走 MovServerBase.BASE 拼接）；
//   ②`BuildConfig.MOV_SERVER_BASE` 注入位在 app/build.gradle.kts 在场（防收编脱落）；
//   ③（给出 --apk 时）APK 内 BuildConfig 值读数可选核对（交验收侧复跑）。
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] ?? true : d; };
const REPO = arg("--repo");
if (!REPO) { console.error("用法：node base-blacklist-scan.mjs --repo <worktree 根> [--json]"); process.exit(2); }
const ALLOW = ["app/src/main/java/com/mov/android/MovServerBase.kt", ...argv.filter((x, i) => argv[i - 1] === "--allow")];
const SRC = path.join(REPO, "app", "src", "main");

const hits = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".kt")) {
      const rel = path.relative(REPO, p).replace(/\\/g, "/");
      if (ALLOW.includes(rel)) continue;
      fs.readFileSync(p, "utf8").split("\n").forEach((line, i) => {
        const t = line.trim();
        if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
        if (line.includes("https://mow.kim")) hits.push({ rel, line: i + 1, text: t.slice(0, 120) });
      });
    }
  }
}
walk(SRC);
const gradle = fs.readFileSync(path.join(REPO, "app", "build.gradle.kts"), "utf8");
const injected = gradle.includes("\"MOV_SERVER_BASE\"") && gradle.includes("mov.sandbox.base");
const srcExists = fs.existsSync(path.join(REPO, ALLOW[0]));

if (arg("--json")) {
  console.log(JSON.stringify({ ok: hits.length === 0 && injected && srcExists, strayHits: hits, buildConfigField: injected, singleSource: srcExists }, null, 2));
} else {
  console.log(`黑名单扫描（${REPO}）：`);
  console.log(`  单源件 ${ALLOW[0]}：${srcExists ? "在 ✅" : "缺 ❌"}`);
  console.log(`  gradle 注入位 MOV_SERVER_BASE：${injected ? "在 ✅" : "缺 ❌"}`);
  console.log(`  游离 base：${hits.length === 0 ? "0 ✅" : hits.length + " ❌"}`);
  for (const h of hits) console.log(`    ${h.rel}:${h.line}  ${h.text}`);
}
process.exit(hits.length === 0 && injected && srcExists ? 0 : 1);
