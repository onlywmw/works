// SYS-102 席位 agent 退出自愈 + 席档写入侧规范化 回归锁（2026-09-26）
//   正控：窗活而 agent 真死 → 既有窗内重拉绑定 agent（不隐性开新窗）；负控四态：offseat / 双活窗 / 换绑中 / 窗死；
//   限流：冷却 + 每小时上限；写档：中文名/别名一律落 SEAT_KEY 英文键。
// 变异程序（交付证据用，隔离副本）：删 `if (!isAlive(Number(seat.consolePid))) continue;` → 用例「负控④窗死」必红。
// 跑法：node --test 处理中心/看板/tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { seatSelfHeal, seatFileOf, pollSeatsFull, __testResetSeatHeal } from "../engine.mjs";

const SYS_ROOT = "E:\\MOV\\安卓中国体系建设";
const BINDING = { "设计师": "pi", "程序员": "pi", "验收员": "hermes", "审验员": "hermes", "巡检台": "pi", _shell: "cmd" };

function sandbox(seats) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys102-"));
  const seatsDir = path.join(root, "seats");
  fs.mkdirSync(seatsDir, { recursive: true });
  for (const [key, seat] of Object.entries(seats || {})) fs.writeFileSync(path.join(seatsDir, `${key}.json`), JSON.stringify(seat));
  return { root, seatsDir, logFile: path.join(root, "巡铃.log") };
}
// 窗活（ALIVE）+ agent 死：SYS-88 修后的目标态
const ALIVE = 6108, DEAD = 40576;
const kill = (pid) => { if (Number(pid) !== ALIVE) throw new Error("ESRCH"); };
const seatHot = (over = {}) => ({ role: "程序员", on: true, consolePid: ALIVE, agentPid: DEAD, agent: "pi", ...over });
const opts = (sb, over = {}) => ({ seatsDir: sb.seatsDir, binding: BINDING, kill, noLog: true, now: 1_700_000_000_000, ...over });

test("SYS-102 正控：窗活而 agent 死 → 既有窗内重拉绑定 agent（不 spawn 新窗）", () => {
  __testResetSeatHeal();
  const sb = sandbox({ coder: seatHot() }); const calls = [];
  const healed = seatSelfHeal(opts(sb, { inject: (pid, text) => calls.push([pid, text]) }));
  assert.equal(calls.length, 1, "应注入一次");
  assert.deepEqual(calls[0], [ALIVE, "pi"], "注入口=本席既有窗 consolePid｜命令=绑定 agent（读 opts.binding）");
  assert.equal(healed[0].role, "程序员");
  assert.equal(JSON.parse(fs.readFileSync(path.join(sb.seatsDir, "coder.json"), "utf-8")).on, true, "自愈不改灯态（agent 起来后由 onseat 刷新）");
});

test("SYS-102 负控①：下班（offseat）不误拉", () => {
  __testResetSeatHeal();
  const sb = sandbox({ coder: seatHot({ on: false }) }); const calls = [];
  seatSelfHeal(opts(sb, { inject: (p, t) => calls.push(t) }));
  assert.equal(calls.length, 0, "未亮席不得拉起");
});

test("SYS-102 负控②：同角色双活窗不重复拉", () => {
  __testResetSeatHeal();
  const sb = sandbox({ coder: seatHot() }); const calls = [];
  seatSelfHeal(opts(sb, { windowCount: { "程序员": 2 }, inject: (p, t) => calls.push(t) }));
  assert.equal(calls.length, 0, "双活窗：人收窗优先，不重复拉起");
});

test("SYS-102 负控③：换绑中（档内 agent ≠ 现行绑定）不拉", () => {
  __testResetSeatHeal();
  const sb = sandbox({ coder: seatHot({ agent: "pi" }) }); const calls = [];
  seatSelfHeal(opts(sb, { binding: { ...BINDING, "程序员": "kimi" }, inject: (p, t) => calls.push(t) }));
  assert.equal(calls.length, 0, "换绑中不得按旧 agent 拉起（等新绑定生效/人重开席）");
});

test("SYS-102 负控④（变异锚）：窗死不得拉（不隐性开新窗）", () => {
  __testResetSeatHeal();
  const sb = sandbox({ coder: seatHot({ consolePid: 39400 }) }); const calls = [];
  seatSelfHeal(opts(sb, { inject: (p, t) => calls.push(t) }));
  assert.equal(calls.length, 0, "窗死=另一域：不得凭空拉起（开新窗是 SYS-61 可见窗三态的活）");
});

test("SYS-102 负控⑤：窗内已有 agent（全表探实证）不拉——防双开", () => {
  __testResetSeatHeal();
  const sb = sandbox({ coder: seatHot() }); const calls = [];
  seatSelfHeal(opts(sb, { windowAgent: { "程序员": "pi" }, inject: (p, t) => calls.push(t) }));
  assert.equal(calls.length, 0, "窗内已有 agent（pid 换代/误记）→ 由座探接管，不拉第二个");
});

test("SYS-102 限流：冷却 5 分钟 + 每小时上限 3 次", () => {
  __testResetSeatHeal();
  const sb = sandbox({ coder: seatHot() }); const calls = [];
  const T0 = 1_700_000_000_000, inject = (p, t) => calls.push(t);
  seatSelfHeal(opts(sb, { now: T0, inject }));
  seatSelfHeal(opts(sb, { now: T0 + 60e3, inject }));          // 冷却内
  assert.equal(calls.length, 1, "冷却内不得重复拉（分钟级风暴防）");
  for (const m of [6, 12, 18]) seatSelfHeal(opts(sb, { now: T0 + m * 60e3, inject }));
  assert.equal(calls.length, 3, "每小时上限 3 次");
  seatSelfHeal(opts(sb, { now: T0 + 24 * 60e3, inject }));
  assert.equal(calls.length, 3, "上限内不再拉（需人工介入/下小时滚动）");
  seatSelfHeal(opts(sb, { now: T0 + 61 * 60e3, inject }));
  assert.equal(calls.length, 4, "滚动 1h 后配额复原（旧记录过期）");
});

test("SYS-102-R1 TDZ 修复：import 模式无 inject → 返回 [] 且不抛（不得 Touch TDZ）", () => {
  __testResetSeatHeal();
  let r;
  assert.doesNotThrow(() => { r = seatSelfHeal({}); }, "无 inject 不得抛（旧码此处 ReferenceError: Cannot access 'healed' before initialization）");
  assert.deepEqual(r, [], "无 inject（import 复用态）→ 返回空数组，不向真窗注入");
  // 反向对照：给了 inject 则正常工作（守卫不得误伤正常路径）
  const sb = sandbox({ coder: seatHot() }); const calls = [];
  const healed = seatSelfHeal(opts(sb, { inject: (p, t) => calls.push(t) }));
  assert.equal(calls.length, 1, "有 inject：正常触发");
  assert.equal(healed.length, 1, "有 inject：返回触发清单");
});

test("SYS-102 写档规范化：中文名/别名任一形态 → SEAT_KEY 英文键（不再生中文档）", () => {
  for (const [role, key] of [["设计师", "designer"], ["程序员", "coder"], ["验收员", "qa"], ["审验员", "reviewer"], ["巡检台", "hygiene"]]) {
    assert.equal(path.basename(seatFileOf(role)), `${key}.json`, `${role} → ${key}.json（中文名入参）`);
    assert.equal(path.basename(seatFileOf(key)), `${key}.json`, `${key} → ${key}.json（英文键入参）`);
    assert.equal(path.basename(seatFileOf(role, "X:/seats")), `${key}.json`, "目录可注（测试沙盒）");
  }
  assert.ok(!/[\u4e00-\u9fff]/.test(path.basename(seatFileOf("审验员"))), "件名内不得含中文（重复档之根）");
});

test("SYS-102 联动：全表探（窗活·窗内零 agent）→ 自动触发自愈；窗内探到 agent → 不拉", () => {
  __testResetSeatHeal();
  const sb = sandbox({ coder: seatHot() }); const calls = [];
  const row = (agentPid) => JSON.stringify([{ title: "MOV-程序员〔安卓中国〕", cmdPid: ALIVE, agentPid, agent: agentPid ? "pi" : "", cmd: `cmd /k cd /d "${SYS_ROOT}\\处理中心\\看板\\工位\\程序员" && pi` }]);
  pollSeatsFull({ seatsDir: sb.seatsDir, probe: () => row(0), kill, binding: BINDING, noLog: true, inject: (p, t) => calls.push(t), procs: [] });
  assert.equal(calls.length, 1, "窗活 + 窗内零 agent（探针实证）→ 自愈注入");
  pollSeatsFull({ seatsDir: sb.seatsDir, probe: () => row(process.pid), kill, binding: BINDING, noLog: true, inject: (p, t) => calls.push(t), procs: [] });
  assert.equal(calls.length, 1, "窗内探到 agent → 不再拉（防双开）");
});
