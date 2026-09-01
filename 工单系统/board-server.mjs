// board-server.mjs — 看板本地服务（http://localhost:8787）
// 点浏览器刷新 = 服务端检查变化 → 重新生成 → 返回最新 html（永远最新）
// 启动：node board-server.mjs（开机自启 ps1 已配）；port 8787
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.BOARD_PORT || 8787);
// 默认只绑本机（工单信息不对内网默认暴露）；显式 BOARD_BIND=0.0.0.0 才开放多机访问
const BIND = process.env.BOARD_BIND || "127.0.0.1";
const LIB = path.join(__dir, "工单库.md");
const TBL = path.join(__dir, "工单表.xlsx");
let lastMtime = "";

const mtime = () => {
  const a = (() => { try { return fs.statSync(LIB).mtimeMs; } catch { return -1; } })();
  const b = (() => { try { return fs.statSync(TBL).mtimeMs; } catch { return -1; } })();
  return a + "|" + b;
};

// 若库/表变化 → 重新生成（mjs → board）
function regen() {
  return new Promise((resolve) => {
    execFile(process.execPath, [path.join(__dir, "审验员", "orders-overview.mjs")], { cwd: __dir, maxBuffer: 8 * 1024 * 1024 }, () => {
      execFile(process.execPath, [path.join(__dir, "board-build.mjs")], { cwd: __dir, maxBuffer: 8 * 1024 * 1024 }, () => resolve());
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (url === "/" || url === "/index.html") {
    try {
      const now = mtime();
      if (now !== lastMtime) {
        lastMtime = now;
        await regen();
      }
      const html = fs.readFileSync(path.join(__dir, "处理中心", "验证产物", "orders-overview.html"), "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(html);
    } catch (e) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("看板生成失败：" + e.message);
    }
    return;
  }
  if (url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, mtime: mtime(), htmlMtime: (() => { try { return fs.statSync(path.join(__dir, "处理中心", "验证产物", "orders-overview.html")).mtimeMs; } catch { return -1; } })() }));
    return;
  }
  res.writeHead(404); res.end("not found");
});

server.listen(PORT, BIND, () => console.log(`[board-server] http://${BIND}:${PORT} — 点刷新=实时最新（变化时自动重新生成）`));
