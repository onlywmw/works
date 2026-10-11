#!/usr/bin/env node
// UPG-551 沙盒夹具 · partner 面探针桩（审核结果可按需注入；其余请求原样代理真服务）
//
// 机制：App（debug 变体）经 mov-debug-config.json 的 partner_base_url 指向本桩（adb reverse），
//   - GET /partner/applyment/<code>  → 返回 audit-state.json 中的注入态（REJECTED/FINISH…），不碰真服务；
//   - 其余 /partner/*（媒体上传等）  → 原样转发 https://mow.kim（含 X-Account-Token 头）。
// 注入：改写 audit-state.json（或 POST /__inject {"state":"REJECTED","reason":"..."}）。
// 还原：删设备端 mov-debug-config.json 的 partner_base_url（或整个文件）→ 即回真服务；本进程 Ctrl-C。
//
// 用法：node partner-stub.mjs [--port 8392] [--state <audit-state.json>] [--log <stub-log.jsonl>] [--target https://mow.kim]
import http from "node:http";
import { readFileSync, appendFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const PORT = parseInt(arg("--port", "8392"), 10);
const STATE = path.resolve(arg("--state", path.join(DIR, "audit-state.json")));
const LOG = path.resolve(arg("--log", path.join(DIR, "stub-log.jsonl")));
// POL-4 夹具隔离：默认目标＝本地沙盒 a2a（sandbox/sandbox.config.json 的 a2aPort）；生产须显式 --target https://mow.kim
const SANDBOX_CFG = (() => {
  try { return JSON.parse(readFileSync(path.join(DIR, "sandbox", "sandbox.config.json"), "utf8")); } catch { return null; }
})();
const TARGET = arg("--target", SANDBOX_CFG ? `http://127.0.0.1:${SANDBOX_CFG.a2aPort}` : "https://mow.kim").replace(/\/$/, "");

const STATE_OK = new Set(["REJECTED", "FINISH"]);
function injected() {
  try {
    const s = JSON.parse(readFileSync(STATE, "utf8"));
    if (!STATE_OK.has(s.state)) throw new Error("state 仅 REJECTED|FINISH：" + s.state);
    return s;
  } catch (e) {
    return { state: "REJECTED", reason: "夹具缺省注入态（audit-state.json 缺失/坏：" + e.message + "）" };
  }
}
// 注入态 → /partner/applyment 应答（对齐微信进件字段名；App 侧 markWechatState 消费）
function statusBody(s) {
  if (s.state === "REJECTED") {
    return { applyment_state: "REJECTED", applyment_state_desc: "已驳回",
      reject_reason: s.reason || "夹具注入：驳回（UPG-551）", applyment_id: s.applymentId || "PROBE-551" };
  }
  return { applyment_state: "FINISH", applyment_state_desc: "已完成", applyment_id: s.applymentId || "PROBE-551" };
}
const logLine = (o) => { const t = new Date().toISOString(); const line = JSON.stringify({ t, ...o }); try { appendFileSync(LOG, line + "\n"); } catch {} console.log(line); };

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://127.0.0.1");
  if (req.method === "POST" && u.pathname === "/__inject") {
    let body = ""; for await (const c of req) body += c;
    try {
      const s = JSON.parse(body);
      if (!STATE_OK.has(s.state)) throw new Error("state 仅 REJECTED|FINISH");
      writeFileSync(STATE, JSON.stringify(s, null, 2));
      logLine({ ev: "inject", state: s.state });
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: true, ...s }));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, error: String(e.message || e) })); }
    return;
  }
  if (req.method === "GET" && u.pathname.startsWith("/partner/applyment/")) {
    const s = injected();
    logLine({ ev: "inject-hit", path: u.pathname, state: s.state });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(statusBody(s)));
    return;
  }
  // 其余：原样代理真服务（SYS-204 A#5：仅 /partner/* 路径；凭据头默认不外转——需 STUB_FORWARD_AUTH=1 或环回沙盒目标）
  if (!u.pathname.startsWith("/partner/")) {
    logLine({ ev: "reject-path", path: u.pathname });
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "本桩仅代理 /partner/* 路径" }));
    return;
  }
  try {
    const forwardAuth = process.env.STUB_FORWARD_AUTH === "1" || /^http:\/\/127\.0\.0\.1[:/]/.test(TARGET);
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      const kl = k.toLowerCase();
      if (["host", "connection", "content-length", "transfer-encoding"].includes(kl)) continue;
      if (!forwardAuth && (kl === "x-account-token" || kl === "authorization")) continue;   // SYS-204 A#5
      headers[k] = Array.isArray(v) ? v.join(",") : v;
    }
    const body = ["GET", "HEAD"].includes(req.method) ? undefined : req;
    const r = await fetch(TARGET + req.url, { method: req.method, headers, body, duplex: body ? "half" : undefined });
    logLine({ ev: "proxy", method: req.method, path: u.pathname, status: r.status });
    res.writeHead(r.status, { "content-type": r.headers.get("content-type") || "application/json" });
    const ab = await r.arrayBuffer();
    res.end(Buffer.from(ab));
  } catch (e) {
    logLine({ ev: "proxy-error", method: req.method, path: u.pathname, error: String(e.message || e) });
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "夹具代理失败：" + String(e.message || e) }));
  }
});
server.listen(PORT, "127.0.0.1", () => {
  const s = injected();
  console.log(`[partner-stub] http://127.0.0.1:${PORT} → 注入态=${s.state}｜其余代理 ${TARGET}｜state=${STATE}｜log=${LOG}`);
});
