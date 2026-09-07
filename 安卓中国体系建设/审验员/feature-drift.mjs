// feature-drift.mjs — FEATURE_DRIFT_CHECK（v1.2.1 评审采纳·必改#1）
// 代码信号（App 页面/UI 结构） vs 功能树 → 只报警 WARN，不自动改树。
// 用法：node 审验员/feature-drift.mjs [<app源码根>]（默认 E:\mov归档\0027-mov）
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = process.argv[2] || "E:/mov归档/0027-mov";
const FEATURES = JSON.parse(fs.readFileSync(path.join(__dirname, "功能树.json"), "utf8"));
const paths = FEATURES.tree.map(f => f.path);

// —— 代码信号采集：现有页面/顶层路由（信号=页面存在，非功能语义）——
const signals = new Set();
function walk(dir, depth) {
  if (depth > 2) return;
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // 页面目录（assets/pages/*、ui/*）作为「页面信号」
      const rel = path.relative(APP, full).replace(/\\/g, "/");
      if (["assets/pages", "app/src/main/java/com/mov/android/ui", "app/src/main/java/com/mov/android/pages"].some(px => rel.includes(px))) {
        signals.add(e.name);
      }
      walk(full, depth + 1);
    }
  }
}
walk(path.join(APP, "app/src/main/assets/pages"), 0);
walk(path.join(APP, "app/src/main/java/com/mov/android/ui"), 0);

// —— 比对：代码有信号但功能树缺（DRIFT）——
const treeNames = new Set(paths.map(p => p.split("/").pop()));
const treeAll = new Set(paths);
const drift = [];
for (const s of signals) {
  if (!treeNames.has(s) && !treeAll.has(s)) drift.push(s);
}

console.log(`功能树版本: ${FEATURES.tree_version}（${paths.length} 路径）`);
console.log(`代码页面信号: ${signals.size} 个`);
if (drift.length) {
  console.log(`⚠️ FEATURE_DRIFT ${drift.length} 条（代码有、树无——仅报警，人工裁决是否登记功能树；退出码 0=非阻断）:`);
  for (const d of drift.sort().slice(0, 30)) console.log("  -", d);
  process.exit(0);
} else {
  console.log("✅ 无漂移（代码页面信号 ⊂ 功能树 —— 或功能树较粗，人工核对）");
  process.exit(0);
}
