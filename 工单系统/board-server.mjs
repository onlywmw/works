// board-server.mjs — 看板本地服务 v2.1（大神评审收敛版）
// http://127.0.0.1:8787 — 点刷新=实时最新（签名变化→regen→原子发布）
// 评审采纳：P0-1 regen 并发锁 / P0-2 原子发布(tmp→rename) / P1 签名=mtime+size + 稳定性二次校验
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.BOARD_PORT || 8787);
const BIND = process.env.BOARD_BIND || "127.0.0.1"; // 默认只绑本机
const LIB = path.join(__dir, "工单库.md");
const TBL = path.join(__dir, "工单表.xlsx");
const FINAL = path.join(__dir, "处理中心", "验证产物", "orders-overview.html");
const TMP = FINAL + ".tmp";

// 签名 = mtimeMs + size（大神：mtime != 内容身份——mtime+size 零成本更稳）
const sig = (file) => {
  try { const s = fs.statSync(file); return `${file}:${s.mtimeMs}:${s.size}`; }
  catch { return `${file}:missing`; }
};
const sourceSig = () => sig(LIB) + "|" + sig(TBL);

// 并发 regen 锁（P0-1）：同刻只有一个 regen；来者等同一个 Promise
let regenPromise = null;
let lastSig = sourceSig();
let lastHtmlMtime = 0;

function regenOnce() {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [path.join(__dir, "审验员", "orders-overview.mjs")], { cwd: __dir, maxBuffer: 8 * 1024 * 1024 }, (e1) => {
      if (e1) return reject(new Error("orders-overview: " + e1.message.slice(0, 120)));
      execFile(process.execPath, [path.join(__dir, "board-build.mjs")], { cwd: __dir, env: { ...process.env, BOARD_TMP: "1" }, maxBuffer: 8 * 1024 * 1024 }, (e2) => {
        if (e2) return reject(new Error("board-build: " + e2.message.slice(0, 120)));
        resolve();
      });
    });
  });
}

// 稳定性二次校验（P1）：regen 前后签名一致才发布；不一致→再生成（≤3 次）
async function regenStable() {
  for (let i = 0; i < 3; i++) {
    const a = sourceSig();
    await regenOnce();
    const b = sourceSig();
    if (a === b) { lastSig = b; return; }
    // 生成期间输入变了→丢弃本次，重来
    console.log(`[board-server] 生成期间输入变化（第 ${i + 1} 次）→ 重生成`);
  }
  lastSig = sourceSig();
}

// 原子发布（P0-2）：先写 .tmp，完成后再 rename 覆盖正式 html——浏览器永不读到半成品
function atomicPublish() {
  // Windows: rename 覆盖已存在文件 = MoveFileEx(REPLACE_EXISTING)——node fs.renameSync 支持
  fs.renameSync(TMP, FINAL);
  lastHtmlMtime = fs.statSync(FINAL).mtimeMs;
}

async function ensureFresh() {
  const now = sourceSig();
  if (now !== lastSig) {
    if (!regenPromise) {
      regenPromise = (async () => {
        try { await regenStable(); atomicPublish(); }
        finally { regenPromise = null; }
      })();
    }
    await regenPromise; // 并发请求等待同一个 regen
  }
  return FINAL;
}

const server = http.createServer(async (req, res) => {
  const url = (req.url || "/").split("?")[0];
  try {
    if (url === "/" || url === "/index.html") {
      await ensureFresh();
      const html = fs.readFileSync(FINAL, "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(html);
      return;
    }
    if (url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        ok: true, service: "board-server", port: PORT, bind: BIND,
        sourceSig: sourceSig().slice(0, 60), htmlMtime: (() => { try { return fs.statSync(FINAL).mtimeMs; } catch { return -1; } })(),
        regenInProgress: !!regenPromise,
      }));
      return;
    }
    res.writeHead(404); res.end("not found");
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("看板生成失败：" + e.message);
  }
});

server.listen(PORT, BIND, () => console.log(`[board-server v2.1] http://${BIND}:${PORT} — 签名→锁→生成→稳定校验→原子发布`));
