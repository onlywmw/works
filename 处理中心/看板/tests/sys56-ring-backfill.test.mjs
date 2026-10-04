// SYS-56：巡铃补敲（批量积压死锁修）+ 巡查跳过计数去重（同事项连投修）——L1 契约
// 变异锚：M1 去补敲分支 → ①红；M2 去间隔门（跳过计数每评估 +1）→ ③红。亲杀实录见交付报告。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ringUnreadSeats, skipEscalateStep, __testResetRing } from "../engine.mjs";

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-ring56-"));
  const boxRoot = path.join(root, "邮箱");
  const seatsDir = path.join(root, "seats");
  fs.mkdirSync(path.join(boxRoot, "程序员", "INBOX"), { recursive: true });
  fs.mkdirSync(path.join(boxRoot, "设计师", "INBOX"), { recursive: true });
  fs.mkdirSync(seatsDir, { recursive: true });
  for (const [role, key] of [["程序员", "coder"], ["设计师", "designer"]])
    fs.writeFileSync(path.join(seatsDir, `${key}.json`), JSON.stringify({ role, on: true, consolePid: 1, agentPid: process.pid }));
  return { root, boxRoot, seatsDir };
}
function letter(boxRoot, role, id, { type = "派单", re = "", created } = {}) {
  fs.writeFileSync(path.join(boxRoot, role, "INBOX", `${id}.md`),
    `---\nid: ${id}\nfrom: 设计师\nto: ${role}\ntype: ${type}\nre: ${re}\ncreated: ${created || new Date().toLocaleString("sv-SE")}\nstatus: 未读\npayload: —\nsha: —\n---\n\n测试信\n`, "utf-8");
}
const ACTIVE = () => Date.now(); // 席会话刚写过=活跃
const SILENT = () => 0;          // 席会话远久=静默
const opts = (sb, rings) => ({
  boxRoot: sb.boxRoot, seatsDir: sb.seatsDir, noPersist: true, noLog: true, noCooldown: true,
  backfillSilentMs: 10 * 60e3, // 测试短窗：N 的 per-role 结构由 SYS-56 正式实现，机制走同一分支
  onRing: (_pid, text) => { rings.push(text); return "OK"; },
});

test("SYS-56 ① 前向：箱内 2 封积压（已敲未办）+ 席静默 → 补敲「继续」（死锁修复锚）", () => {
  __testResetRing();
  const sb = sandbox(); const rings = [];
  letter(sb.boxRoot, "程序员", "LTR-B1", { re: "UPG-B1 甲单" });
  letter(sb.boxRoot, "程序员", "LTR-B2", { re: "UPG-B2 乙单" });
  const D = { ledger: { active: [{ id: "UPG-B1", phase: "dispatched" }, { id: "UPG-B2", phase: "dispatched" }] } };
  ringUnreadSeats(D, { ...opts(sb, rings), sessionMtime: ACTIVE }); // 首轮：新信照敲（席活跃不影响新信分支）
  assert.equal(rings.length, 1, "首轮新信敲 1 次");
  assert.ok(rings[0].startsWith("收信（已收到"), "首轮=新信口径");
  ringUnreadSeats(D, { ...opts(sb, rings), sessionMtime: SILENT }); // 次轮：信已敲未办 + 席静默 → 补敲
  assert.equal(rings.length, 2, "积压+静默 → 必须补敲（批积压死锁修复）");
  assert.equal(rings[1], "收信（箱内仍有 2 封未办——继续）", "补敲报文含未办数");
  ringUnreadSeats(D, { ...opts(sb, rings), sessionMtime: SILENT }); // 席仍静默：持续补敲（冷却口径由 noCooldown 关）
  assert.equal(rings.length, 3, "席仍静默 → 90s 冷却外持续补敲");
});

test("SYS-56 ② 反向三态：席活跃 / 席静默但箱空 / 只剩回执 → 不补敲", () => {
  __testResetRing();
  const sb = sandbox(); const rings = [];
  letter(sb.boxRoot, "程序员", "LTR-C1", { re: "UPG-C1 甲单" });
  const D = { ledger: { active: [{ id: "UPG-C1", phase: "dispatched" }] } };
  ringUnreadSeats(D, { ...opts(sb, rings), sessionMtime: ACTIVE });
  assert.equal(rings.length, 1, "首轮敲新信");
  ringUnreadSeats(D, { ...opts(sb, rings), sessionMtime: ACTIVE });
  assert.equal(rings.length, 1, "席活跃（<N 内有写）→ 不补敲");
  fs.unlinkSync(path.join(sb.boxRoot, "程序员", "INBOX", "LTR-C1.md"));
  ringUnreadSeats(D, { ...opts(sb, rings), sessionMtime: SILENT });
  assert.equal(rings.length, 1, "箱空 → 不补敲");
  letter(sb.boxRoot, "程序员", "LTR-C2", { type: "回执", re: "[回执] UPG-C1" });
  ringUnreadSeats(D, { ...opts(sb, rings), sessionMtime: SILENT });
  assert.equal(rings.length, 1, "只剩回执 → 不补敲（知悉类不占补敲）");
});

test("SYS-56 ③ 跳过计数按巡查间隔：同间隔内多次评估只计 1 次（同事项连投根因锁）", () => {
  const I = 20 * 60e3, t0 = Date.parse("2026-09-11T20:00:00+08:00");
  let st = { skipStreak: 0, lastSkip: "" }, esc = 0, counts = 0;
  for (let i = 0; i < 19; i++) { // 同一间隔内 19 次评估（1 分钟一评估，未跨 20min 边界；原实现→streak=19）
    const r = skipEscalateStep(st, t0 + i * 60e3, I);
    if (r.counted) { counts++; st = { skipStreak: r.streak, lastSkip: new Date(t0 + i * 60e3).toISOString() }; }
    if (r.escalate) esc++;
  }
  assert.equal(st.skipStreak, 1, "20 分钟窗口内 19 次评估只计 1 次（去连投）");
  assert.equal(counts, 1, "计数分支只走 1 次");
  assert.equal(esc, 0, "未满 6 个间隔不升级");
  for (let k = 1; k <= 5; k++) { // 再跨 5 个整间隔 → 满 6 次恰升级一次
    const at = t0 + k * I;
    const r = skipEscalateStep(st, at, I);
    assert.equal(r.counted, true, `第 ${k + 1} 个间隔应计次`);
    st = { skipStreak: r.streak, lastSkip: new Date(at).toISOString() };
    if (r.escalate) esc++;
  }
  assert.equal(st.skipStreak, 6, "满 6 个间隔（≈2h@缺省）");
  assert.equal(esc, 1, "恰升级一次（每 6 次复报语义恢复）");
});
