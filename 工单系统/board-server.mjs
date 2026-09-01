// board-server.mjs — 看板本地服务 v3（Hono + BoardEngine）
// 读：regenerate(E4+board-build) → 原子发布；写：/api/board/v1/* → BoardEngine
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { z } from "zod";
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { cardOp, health as engineHealth, TRANSITIONS, ERR } from "./board-engine.mjs";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.BOARD_PORT || 8787);
const BIND = process.env.BOARD_BIND || "127.0.0.1";
const WRITE_ON = process.env.BOARD_WRITE !== "off" && BIND === "127.0.0.1";
const FINAL = path.join(__dir, "处理中心", "验证产物", "orders-overview.html");
const TMP = FINAL + ".tmp";
const WRITE_TOKEN = randomBytes(32).toString("hex"); // 启动随机 256-bit

const sig = (file) => {
  try { const s = fs.statSync(file); return `${file}:${s.mtimeMs}:${s.size}`; } catch { return null; }
};
const sourceSig = () => [
  sig(path.join(__dir, "工单库.md")),
  sig(path.join(__dir, "工单表.xlsx")),
  sig(path.join(__dir, "审验员", "orders-overview.mjs")),
  sig(path.join(__dir, "board-build.mjs")),
].join("|");
let lastSig = sourceSig();
let lastHtmlMtime = 0;
let regenPromise = null;

function regenOnce() {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [path.join(__dir, "审验员", "orders-overview.mjs")], { cwd: __dir, maxBuffer: 8 * 1024 * 1024 },
      (e1) => {
        if (e1) return reject(new Error("orders-overview: " + e1.message.slice(0, 120)));
        execFile(process.execPath, [path.join(__dir, "board-build.mjs")], { cwd: __dir, env: { ...process.env, BOARD_TMP: "1" }, maxBuffer: 8 * 1024 * 1024 },
          (e2) => (e2 ? reject(new Error("board-build: " + e2.message.slice(0, 120))) : resolve()));
      });
  });
}
async function regenStable() {
  for (let i = 0; i < 3; i++) {
    await regenOnce();
    const s = sourceSig();
    if (s === lastSig) { lastSig = s; return; }
    lastSig = s;
  }
}
async function ensureFresh() {
  const s = sourceSig();
  if (s !== lastSig || !fs.existsSync(FINAL)) {
    if (!regenPromise) {
      regenPromise = (async () => { try { await regenStable(); atomicPublish(); } finally { regenPromise = null; } })();
    }
    await regenPromise;
  }
}
function atomicPublish() {
  if (!fs.existsSync(TMP)) return;
  try { fs.renameSync(TMP, FINAL); lastHtmlMtime = fs.statSync(FINAL).mtimeMs; } catch (e) { console.error("[server] publish fail:", e.message); }
}

const app = new Hono();

// CORS + OPTIONS（兼容；正式路径同源）
app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, X-Write-Token");
  c.header("Access-Control-Allow-Private-Network", "true");
  if (c.req.method === "OPTIONS") return c.body(null, 204);
  await next();
});

// 读面
app.get("/", async (c) => {
  try { await ensureFresh(); return c.html(fs.readFileSync(FINAL, "utf8").replace(/<!--WRITE-INJECT-->/, "")); }
  catch (e) { return c.text("看板生成失败：" + e.message, 500); }
});
app.get("/health", (c) => c.json({ ok: true, service: "board-server", version: "3.0.0", port: PORT, bind: BIND, htmlMtime: lastHtmlMtime }));
app.get("/api/board/v1/health", (c) => {
  const h = engineHealth(WRITE_ON, BIND);
  return c.json({ ...h, writeToken: h.writeEnabled ? WRITE_TOKEN : null });
});
app.post("/api/reject", async (c) => {
  try {
    if(!WRITE_ON) throw Object.assign(new Error("写面已关闭"), { code: ERR.WRITE_DISABLED });
    const body = RejectSchema.parse(await c.req.json());
    return c.json(await cardOp("reject", body.no));
  } catch (e) { return sendErr(c, e); }
});
app.get("/api/board/v1/capabilities", (c) => c.json({ ok: true, transitions: TRANSITIONS, operations: ["card.reject", "card.restore", "card.move"] }));

// 写面（Origin + Token 校验）
const RejectSchema = z.object({ no: z.string().regex(/^UPG-\d+[A-Z]?$/), reason: z.string().max(200).optional() });
const MoveSchema = z.object({ no: z.string().regex(/^UPG-\d+[A-Z]?$/), to: z.string(), reason: z.string().max(200).optional() });

function guardWrite(c) {
  if (!WRITE_ON) { const e = new Error("写面已关闭"); e.code = ERR.WRITE_DISABLED; throw e; }
  const origin = c.req.header("Origin") || "";
  if (origin && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin) && origin !== "null") { const e = new Error("来源不允许"); e.code = ERR.FORBIDDEN; throw e; }
  const tk = c.req.header("X-Write-Token");
  if (tk !== WRITE_TOKEN) { const e = new Error("写令牌无效"); e.code = ERR.UNAUTHORIZED; throw e; }
}
function sendErr(c, e) {
  const code = e.code || ERR.ENGINE_FAILED;
  const status = code === ERR.ENGINE_BUSY ? 409 : code === ERR.NOT_FOUND ? 404 : code === ERR.UNAUTHORIZED ? 401 : code === ERR.FORBIDDEN ? 403 : code === ERR.BAD_ARG ? 400 : 500;
  return c.json({ ok: false, code, msg: e.message }, status);
}
app.post("/api/board/v1/card.reject", async (c) => {
  try {
    guardWrite(c);
    const body = RejectSchema.parse(await c.req.json());
    return c.json(await cardOp("reject", body.no));
  } catch (e) { return sendErr(c, e); }
});
app.post("/api/board/v1/card.restore", async (c) => {
  try {
    guardWrite(c);
    const body = RejectSchema.parse(await c.req.json());
    return c.json(await cardOp("restore", body.no));
  } catch (e) { return sendErr(c, e); }
});
app.post("/api/board/v1/card.move", async (c) => {
  try {
    guardWrite(c);
    const body = MoveSchema.parse(await c.req.json());
    if (!TRANSITIONS[body.to] && !["delivering", "rejected", "queued", "assigned"].includes(body.to)) { const e = new Error("目标状态非法"); e.code = ERR.BAD_ARG; throw e; }
    return c.json({ ok: false, code: "NOT_IMPLEMENTED", msg: "card.move V1 未启用（单卡回炉/恢复为主）" }, 501);
  } catch (e) { return sendErr(c, e); }
});

app.onError((e, c) => sendErr(c, e));
app.notFound((c) => c.json({ ok: false, code: "NOT_FOUND", msg: "未知路径" }, 404));

serve({ fetch: app.fetch, port: PORT, hostname: BIND }, (info) => {
  console.log(`[board-server v3] http://${info.address}:${info.port} — Hono+BoardEngine（write=${WRITE_ON ? "on" : "off"}）`);
});
