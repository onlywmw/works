// run.mjs — 看板 Launcher（P0-3 第一层：health 探测 → 死则拉起 → 打开浏览器）
// 双击 bat（node run.mjs）即可：服务活着直接开；死了拉起再开
import { spawn, execFile } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

// 连击防抖：60 秒内重复双击不弹新页（防误触/连击双开）
import os from "node:os";
import fs from "node:fs";
const LOCK = path.join(os.tmpdir(), "board-launcher.lock");
try {
  const t = Number(fs.readFileSync(LOCK, "utf8") || 0);
  if (Date.now() - t < 60000) {
    console.log("[run] 60 秒内已打开过（防抖）——不重复弹页。若页面未出现，手动访问 http://localhost:" + PORT);
    process.exit(0);
  }
} catch {}
fs.writeFileSync(LOCK, String(Date.now()));
const __dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.BOARD_PORT || 8787);
const HEALTH = `http://127.0.0.1:${PORT}/health`;

const fetchHealth = () =>
  new Promise((resolve) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => { ctrl.abort(); resolve(false); }, 2000);
    fetch(HEALTH, { signal: ctrl.signal })
      .then((r) => { clearTimeout(t); resolve(r.ok); })
      .catch(() => { clearTimeout(t); resolve(false); });
  });

const waitServer = async (times) => {
  for (let i = 0; i < times; i++) {
    if (await fetchHealth()) return true;
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
};

const alive = await fetchHealth();
if (alive) {
  console.log("[run] 看板服务已在运行 → 打开");
} else {
  console.log("[run] 服务未运行 → 拉起 board-server ...");
  const child = spawn(process.execPath, [path.join(__dir, "board-server.mjs")], {
    cwd: __dir, detached: true, stdio: "ignore", windowsHide: true,
  });
  child.unref();
  const ok = await waitServer(6); // 最多 ~5s
  if (!ok) {
    console.error("[run] 拉起失败（服务未响应）——检查：node board-server.mjs 手动启动");
    process.exit(1);
  }
  console.log("[run] 服务已拉起");
}

// 打开浏览器：Edge app 模式（同 URL 复用单窗口）；无 Edge 回退默认浏览器
const edgeWin = "CProgram Files (x86)MicrosoftEdgeApplicationmsedge.exe";
const edge64 = "CProgram FilesMicrosoftEdgeApplicationmsedge.exe";
execFile("powershell", ["-NoProfile", "-Command",
  `if (Test-Path '${edgeWin}') { Start-Process '${edgeWin}' -ArgumentList '--app=http://localhost:${PORT}' }
  elseif (Test-Path '${edge64}') { Start-Process '${edge64}' -ArgumentList '--app=http://localhost:${PORT}' }
  else { Start-Process 'http://localhost:${PORT}' }`
]);
console.log(`[run] 打开 → http://localhost:${PORT}（Edge app 窗）`);
