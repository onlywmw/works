// run.mjs — 看板一键生成+打开（bat 英文入口：node run.mjs）
// 避免 cmd 中文路径歧义：全部路径在 node 内（UTF-8）处理
import { execFile } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const __dir = path.dirname(fileURLToPath(import.meta.url));

// 1) E4 主生成（md + html + data.json）
await import(pathToFileURL(path.join(__dir, "审验员", "orders-overview.mjs")).href);
// 2) 前端设计版构建（覆盖 orders-overview.html）
await import(pathToFileURL(path.join(__dir, "board-build.mjs")).href);
// 3) 打开（PowerShell Start-Process — Unicode 安全）
const html = path.join(__dir, "处理中心", "验证产物", "orders-overview.html");
execFile("powershell", ["-NoProfile", "-Command", "Start-Process '" + html.replace(/'/g, "''") + "'"]);
console.log("已生成并打开 → " + html);
