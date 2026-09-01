// run.mjs — 看板 Launcher（P0-3 第一层：health 探测 → 死则拉起 → 打开浏览器）
// 双击 bat（node run.mjs）即可：服务活着直接开；死了拉起再开
import { spawn, execFile } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

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

// 打开浏览器（PowerShell — Unicode 安全）
execFile("powershell", ["-NoProfile", "-Command", "Start-Process 'http://localhost:" + PORT + "'"]);
console.log(`[run] 打开 → http://localhost:${PORT}`);
