// board-watch.mjs — 看板自动刷新服务（工单库/表变化 → 自动重新生成）
// 启动：node board-watch.mjs（前台）；可直接放开机启动（见 README）
// 原理：轮询 工单库.md + 工单表.xlsx 的 mtime（2s 间隔）→ 变化触发 run.mjs（去抖 3s）
// 页面侧：orders-overview.html 带 <meta refresh>（每 60s 自动重载=显示最新）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const WATCH = [
  path.join(__dir, "工单库.md"),
  path.join(__dir, "工单表.xlsx"),
];
const POLL_MS = 2000;
const DEBOUNCE_MS = 3000;

let lastRun = 0;
let dirty = false;

const snap = () => WATCH.map((f) => {
  try { return fs.statSync(f).mtimeMs; } catch { return -1; }
}).join("|");

let last = snap();
console.log("[board-watch] 监视中：工单库.md + 工单表.xlsx（变化自动生成看板）");

setInterval(() => {
  const now = snap();
  if (now !== last) {
    last = now;
    dirty = true;
  }
  if (!dirty) return;
  const t = Date.now();
  if (t - lastRun < DEBOUNCE_MS) return;
  lastRun = t;
  dirty = false;
  console.log("[board-watch] 检测到变化 → 重新生成看板 " + new Date().toLocaleTimeString());
  execFile(
    process.execPath,
    [path.join(__dir, "run.mjs")],
    { cwd: __dir, maxBuffer: 8 * 1024 * 1024 },
    (err) => {
      if (err) console.error("[board-watch] 生成失败:", err.message.slice(0, 120));
      else console.log("[board-watch] 生成完成（页面 60s 内自动刷新）");
    }
  );
}, POLL_MS);
