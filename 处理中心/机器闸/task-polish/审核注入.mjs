#!/usr/bin/env node
// UPG-551 沙盒夹具 · 审核结果注入（通过/驳回）（测试账号限定）·POL-4 双档
//
// 机制（两档）：
//   【默认·沙盒档】本地实例——probe 态经 partner-stub（`POST /__inject`·state=REJECTED|FINISH），
//     row 态直改沙盒库 `wxpay_applyments`（+事件行）——**零 SSH、零生产面**（POL-4 夹具隔离）。
//   【--prod·生产档】mow.kim 沙盒侧「窗内对切」（`window_switch.py`：probe 覆写 + 行直改·同 UPG-557 口径）。
//   - probe = App `biz.onboardStatus` → `GET /partner/applyment/<code>` 的覆写态（REJECTED/FINISH…）；
//   - row  = 服务端进件模块行状态（提交冲突闸用；重提前复位 REJECTED 防 409）。
//
// ［UPG-557·K3 官方化 @2026-10-06］「通过」态（FINISH）注入＝**probe 直写**（官方通道·非绕过）：probe 消费侧零白名单。
// 用法：
//   node 审核注入.mjs show|prep|pass|reject|row-reset|restore        # 默认＝沙盒档（本地实例）
//   node 审核注入.mjs show --prod                                    # 生产档（SSH·原路径）
// 红线：测试账号（acc6c50…）限定；快照落 `审核注入.snapshot.json`；沙盒档不触生产；生产档密钥只走本机既有 SSH 键。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNAP = path.join(HERE, "审核注入.snapshot.json");
// SYS-203 #5：店号格式闸（防注入进 SSH 命令）+ 统一 shell 引号（免拼接）
const SHOP = (() => {
  const v = (process.env.UPG551_SHOP || "shop4ead686f0fd8").trim();
  if (!/^shop[0-9a-f]{12}$/.test(v)) {
    console.error(`UPG551_SHOP 格式非法（须 shop+12 位 hex）：${v.slice(0, 40)}`);
    process.exit(2);
  }
  return v;
})();
const q = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";   // shell 单引号包裹
const PROD = process.argv.includes("--prod");
const MODE = process.argv.slice(2).filter((a) => a !== "--prod")[0];

// ── 沙盒档接线（sandbox/) ──────────────────────────────────────────────
const SCFG = (() => { try { return JSON.parse(fs.readFileSync(path.join(HERE, "sandbox", "sandbox.config.json"), "utf8")); } catch { return null; } })();
const SANDBOX_ROOT = SCFG ? SCFG.root : null;
const STUB = SCFG ? `http://127.0.0.1:${SCFG.partnerStubPort || 8392}` : null;
const SB_DB = SANDBOX_ROOT ? path.join(SANDBOX_ROOT, "data", "a2a.db") : null;
const SB_STATE = SANDBOX_ROOT ? path.join(SANDBOX_ROOT, "data", "audit-state.json") : null;

async function sbInject(state, reason) {
  const r = await fetch(`${STUB}/__inject`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ state, reason }) });
  return await r.json();
}
function sbRowSet(status, detail) {
  // 直改沙盒库（行态＝提交冲突闸用）；并追一条事件行（与生产档事件留痕同义）
  const db = new DatabaseSync(SB_DB);
  try {
    const r = db.prepare("UPDATE wxpay_applyments SET status=?, updated_at=datetime('now') WHERE shop_id=?").run(status, SHOP);
    db.prepare("INSERT INTO wxpay_applyment_events(shop_id,from_status,to_status,action,detail,created_at) VALUES(?,?,?,?,?,datetime('now'))").run(SHOP, "", status, "sandbox-fixture", detail || "");
    return { changes: r.changes };
  } finally { db.close(); }
}
function sbRowShow() {
  const db = new DatabaseSync(SB_DB);
  try {
    const r = db.prepare("SELECT shop_id, business_code, status, updated_at FROM wxpay_applyments WHERE shop_id=?").get(SHOP);
    return r || null;
  } finally { db.close(); }
}
function sbShow() {
  const stubState = fs.existsSync(SB_STATE) ? JSON.parse(fs.readFileSync(SB_STATE, "utf8")) : null;
  const row = sbRowShow();
  return { raw: `[sandbox] probe: state=${stubState?.state ?? "—"} desc=${stubState?.reason ?? ""}\n[sandbox] row: ${row ? [row.shop_id, row.business_code, row.status].join(" | ") : "(无行)"}`, probe: stubState ? { state: stubState.state, desc: stubState.reason } : null, row: row ? { shop: row.shop_id, code: row.business_code, status: row.status } : null };
}

// ── 生产档（原 SSH 路径·--prod）────────────────────────────────────────
const KEY = process.env.MOV_DEPLOY_KEY ||
  "E:/MOV/安卓中国体系建设/云服务器管理/cert/服务器信息/ssh-ubuntu-key1.pem";
const HOST = process.env.MOV_DEPLOY_HOST || "ubuntu@62.234.55.76";
const ssh = (cmd) =>
  execFileSync("ssh", ["-i", KEY, "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=no", HOST, cmd],
    { encoding: "utf8", maxBuffer: 1 << 22, windowsHide: true });
const ws = (args) => ssh(`cd /home/ubuntu/a2a && ./venv/bin/python window_switch.py ${args}`);
const probeWrite = (state, desc) => {
  const py = [
    "import json,os",
    "p='/home/ubuntu/a2a/applyment_probe.json'",
    "try: d=json.load(open(p,encoding='utf-8'))",
    "except FileNotFoundError: d={'codes':['*'],'exclude_prefix':'MOVRAW','reject_reason':'','applyment_id':'PROBE-20261005'}",
    `d['state']=${JSON.stringify(state)}; d['state_desc']=${JSON.stringify(desc)}`,
    "open(p+'.tmp','w',encoding='utf-8').write(json.dumps(d,ensure_ascii=False,indent=2)+'\\n')",
    "os.replace(p+'.tmp',p)",
    "print('probe →', d['state'], '|', d['state_desc'])",
  ].join("\n");
  return ssh(`python3 -c "import base64;exec(base64.b64decode('${Buffer.from(py, "utf8").toString("base64")}'))"`).trim();
};
const prodShow = () => {
  const out = ws("show");
  const probe = /probe:\s*state=(\S+)\s*desc=(.*?)\s+codes=/.exec(out);
  const row = /row:\s*(\S+)\s*\|\s*(\S+)\s*\|\s*(\S+)\s*\|/.exec(out);
  return { raw: out.trim(), probe: probe ? { state: probe[1], desc: probe[2] } : null, row: row ? { shop: row[1], code: row[2], status: row[3] } : null };
};

const show = () => (PROD ? prodShow() : sbShow());
const snapshotOnce = () => {
  if (fs.existsSync(SNAP)) return JSON.parse(fs.readFileSync(SNAP, "utf8"));
  const s = show();
  const snap = { at: new Date().toISOString(), mode: PROD ? "prod" : "sandbox", probe: s.probe, row: s.row };
  fs.writeFileSync(SNAP, JSON.stringify(snap, null, 1));
  return snap;
};

(async () => {
  if (MODE === "show") console.log(show().raw);
  else if (MODE === "prep") {
    console.log("快照：" + JSON.stringify(snapshotOnce()));
    if (PROD) console.log(ws(`both ${q(SHOP)} REJECTED --reason "UPG-551 夹具：驳回注入" --desc "已驳回（UPG551 夹具·驳回注入）"`).trim());
    else { console.log(JSON.stringify(await sbInject("REJECTED", "UPG551 夹具：驳回注入"))); console.log(JSON.stringify(sbRowSet("REJECTED", "UPG551 夹具：驳回注入"))); }
  } else if (MODE === "pass") {
    snapshotOnce();
    if (PROD) { console.log(ws(`row ${q(SHOP)} REJECTED --reason "UPG-551 夹具：重提前复位"`).trim()); console.log(probeWrite("FINISH", "已完成（UPG551 夹具·通过注入）")); }
    else { console.log(JSON.stringify(sbRowSet("REJECTED", "UPG551 夹具：重提前复位"))); console.log(JSON.stringify(await sbInject("FINISH", "已完成（UPG551 夹具·通过注入）"))); }
  } else if (MODE === "reject") {
    snapshotOnce();
    if (PROD) { console.log(ws(`row ${q(SHOP)} REJECTED --reason "UPG-551 夹具：驳回注入"`).trim()); console.log(probeWrite("REJECTED", "已驳回（UPG551 夹具·驳回注入）")); }
    else { console.log(JSON.stringify(sbRowSet("REJECTED", "UPG551 夹具：驳回注入"))); console.log(JSON.stringify(await sbInject("REJECTED", "已驳回（UPG551 夹具·驳回注入）"))); }
  } else if (MODE === "row-reset") {
    if (PROD) console.log(ws(`row ${SHOP} REJECTED --reason "UPG-551 夹具：重提前行复位"`).trim());
    else console.log(JSON.stringify(sbRowSet("REJECTED", "UPG551 夹具：重提前行复位")));
  } else if (MODE === "restore") {
    const snap = JSON.parse(fs.readFileSync(SNAP, "utf8"));
    // SYS-204 A#14：快照回放先验（快照为盘上可改件）——state/店号/行状态不合即拒（防注入/脏值回放）
    const SNAP_STATES = new Set(["REJECTED", "FINISH"]);
    if (snap.probe && (typeof snap.probe.state !== "string" || !SNAP_STATES.has(snap.probe.state))) { console.error("快照 probe.state 非法——拒回放"); process.exit(2); }
    if (snap.row && (typeof snap.row.shop !== "string" || !/^shop[0-9a-f]{12}$/.test(snap.row.shop))) { console.error("快照 row.shop 非法——拒回放"); process.exit(2); }
    if (snap.row && (typeof snap.row.status !== "string" || !SNAP_STATES.has(snap.row.status))) { console.error("快照 row.status 非法——拒回放"); process.exit(2); }
    if (PROD) {
      if (snap.probe) console.log(probeWrite(snap.probe.state, snap.probe.desc));
      if (snap.row) console.log(ws(`row ${snap.row.shop} ${snap.row.status}`).trim());
      console.log("已回放快照（" + snap.at + "）");
    } else {
      if (snap.probe) console.log(JSON.stringify(await sbInject(snap.probe.state, snap.probe.desc)));
      if (snap.row) console.log(JSON.stringify(sbRowSet(snap.row.status, "快照回放")));
      console.log("已回放快照（" + snap.at + "·" + (snap.mode || "?") + "）");
    }
  } else {
    console.error("用法：node 审核注入.mjs show|prep|pass|reject|row-reset|restore [--prod]（默认＝沙盒档）");
    process.exit(2);
  }
})();
