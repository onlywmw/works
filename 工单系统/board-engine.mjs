// board-engine.mjs — BoardWriteEngine 薄壳（Hono+zod 之外的业务轮子）
// 职责：状态迁移矩阵 / 单写锁 / 审计 Ledger / 事务（备份→改库→sync→regen→ledger，失败回滚）
// 依据：BoardWriteEngine v2 定稿（2PC 简化落地：版本检测+备份回滚）

import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
export const LIB = path.join(__dir, "工单库.md");
export const TABLE = path.join(__dir, "工单表.xlsx");
const BACKUP_DIR = path.join(__dir, "_备份归档");
const LEDGER = path.join(BACKUP_DIR, "write-engine-ledger.md");

// ---------- 状态迁移矩阵（v2 §七） ----------
export const TRANSITIONS = {
  delivering: ["rejected"],           // 回炉
  rejected: ["delivering"],           // 恢复
  queued: ["assigned"],
  assigned: ["delivering"],
  merged: [],                         // 终态禁迁
  archived: [],
};
export const STAGE_NAME = { delivering: "施工/回炉", rejected: "回炉", queued: "排队", assigned: "已派", merged: "终态", archived: "作废" };

export const ERR = {
  BAD_ARG: "BAD_ARG", NOT_FOUND: "NOT_FOUND", CONFLICT: "CONFLICT",
  IDEMPOTENT_REPLAY: "IDEMPOTENT_REPLAY", ENGINE_BUSY: "ENGINE_BUSY",
  ENGINE_FAILED: "ENGINE_FAILED", ROLLBACK_FAILED: "ROLLBACK_FAILED",
  WRITE_DISABLED: "WRITE_DISABLED", UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN", PROJECTION_FAILED: "PROJECTION_FAILED",
};

// ---------- 单写锁（v2 §三） ----------
let lock = null; // { txid, op, no, startedAt }
export function lockState() { return lock; }
async function withLock(op, no, fn) {
  if (lock) { const e = new Error("引擎忙"); e.code = ERR.ENGINE_BUSY; throw e; }
  const txid = `TX-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 15)}-${Math.random().toString(36).slice(2, 6)}`;
  lock = { txid, op, no, startedAt: Date.now() };
  try { return await fn(txid); }
  finally { lock = null; }
}

// ---------- 审计 Ledger（v2 §八） ----------
function audit(rec) {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), ...rec });
    fs.appendFileSync(LEDGER, line + "\n");
  } catch (e) { console.error("[engine] audit fail:", e.message); }
}

// ---------- 事务（备份→改库→sync→regen→ledger；任一步败回滚） ----------
function stamp(date) { return `→ ⚠️ **回炉 @${date}（【看板回炉】·用户操作——回炉重修） ｜ `; }

async function runSync() {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, ["审验员/sync-orders.mjs", "--sync", "--table", "工单表.xlsx"],
      { cwd: __dir, env: { ...process.env, PYTHONUTF8: "1" }, timeout: 120000, maxBuffer: 8 * 1024 * 1024 },
      (err, so, se) => {
        if (err) { const e = new Error("sync 失败：" + (se || so || "").slice(0, 150)); e.code = ERR.PROJECTION_FAILED; return reject(e); }
        if (!/CHECK_OK/.test(so)) { const e = new Error("sync 未通过：" + so.slice(0, 150)); e.code = ERR.PROJECTION_FAILED; return reject(e); }
        resolve(so);
      });
  });
}

function apply(lib, no, op) {
  const idx = lib.indexOf("# " + no + " ");
  if (idx < 0) { const e = new Error("卡不存在"); e.code = ERR.NOT_FOUND; throw e; }
  const end = lib.indexOf("\n# ", idx + 4);
  const blk = lib.slice(idx, end < 0 ? undefined : end);
  const stPos = blk.indexOf("**状态**：");
  if (op === "reject") {
    if (blk.includes("【看板回炉】")) { const e = new Error("已是回炉状态"); e.code = ERR.CONFLICT; throw e; }
    if (stPos < 0) { const e = new Error("卡状态区缺失"); e.code = ERR.ENGINE_FAILED; throw e; }
    const mark = stamp(new Date().toISOString().slice(0, 10));
    const nb = blk.slice(0, stPos + 6) + mark + blk.slice(stPos + 6);
    return lib.slice(0, idx) + nb + lib.slice(idx + blk.length);
  }
  if (op === "restore") {
    if (!blk.includes("【看板回炉】")) { const e = new Error("非回炉状态"); e.code = ERR.CONFLICT; throw e; }
    // 精确删除状态行内的回炉标记（内嵌，非独立行）
    const nb = blk.replace(/→ ⚠️ \*\*回炉 @[^｜|]*【看板回炉】[^｜|]*[｜|] /, "");
    if (nb === blk || nb.includes("【看板回炉】")) { const e = new Error("回炉标记解析失败"); e.code = ERR.ENGINE_FAILED; throw e; }
    return lib.slice(0, idx) + nb + lib.slice(idx + blk.length);
  }
  throw Object.assign(new Error("未知操作"), { code: ERR.BAD_ARG });
}

export async function cardOp(op, no) {
  return withLock(op, no, async (txid) => {
    // 备份（事务开始）
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const libBak = path.join(BACKUP_DIR, `工单库_${txid}.bak.md`);
    const tblBak = path.join(BACKUP_DIR, `工单表_${txid}.bak.xlsx`);
    const libBefore = fs.readFileSync(LIB, "utf8");
    fs.writeFileSync(libBak, libBefore);
    fs.copyFileSync(TABLE, tblBak);

    let libAfter;
    try {
      libAfter = apply(libBefore, no, op);
    } catch (e) { fs.unlinkSync(libBak); fs.unlinkSync(tblBak); throw e; }

    try {
      fs.writeFileSync(LIB, libAfter, "utf8");
      await runSync();                    // 表投影
      // 投影产物校验 + 通知下一次 regen（版本检测由 server GET 触发）
      audit({ txid, op, no, before: op === "reject" ? "delivering" : "rejected", after: op === "reject" ? "rejected" : "delivering", result: "committed", actor: "board" });
      return { ok: true, data: { no, txid } };
    } catch (e) {
      // 回滚：恢复备份
      try {
        fs.writeFileSync(LIB, libBefore, "utf8");
        fs.copyFileSync(tblBak, TABLE);
        audit({ txid, op, no, result: "rolled_back", error_code: e.code || "ENGINE_FAILED" });
        fs.unlinkSync(libBak); fs.unlinkSync(tblBak);
        throw e;
      } catch (e2) {
        if (e2 === e) throw e;
        const crit = new Error("回滚失败：" + e2.message); crit.code = ERR.ROLLBACK_FAILED;
        audit({ txid, op, no, result: "ROLLBACK_FAILED", error_code: "ROLLBACK_FAILED" });
        throw crit;
      }
    }
  });
}

export function health(writeOn, mode, version) {
  return {
    ok: true, engine: "BoardEngine", version: "1.0.0",
    writeEnabled: writeOn, mode, txState: lock ? "busy" : "idle",
    projectionVersion: version || 0,
  };
}
