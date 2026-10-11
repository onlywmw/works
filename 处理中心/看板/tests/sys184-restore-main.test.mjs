// SYS-184 契约：engine 空闲回主 tick（D3）——守时窗/占用/锁/离线/版本判据/不重复构建/对账（全注入·零设备零构建）。
// 变异锚（隔离副本亲杀）：①去掉占用 skip ⇒ 用例②必红；②main 线判据判反 ⇒ 用例③必红；③无漂移也 spawn ⇒ 用例③必红。
import { test } from "node:test";
import assert from "node:assert/strict";
import { restoreMainTick, __testResetRestoreMain } from "../engine.mjs";

const envBase = { serial: "T-9", deviceVersion: "V1.1-abc12345", mainHead: "abc12345", ledgerLast: null };

test("SYS-184/⑤ tick：守时窗（30min 内不重探·force 越过）", () => {
  __testResetRestoreMain();
  const calls = [];
  const probe = () => { calls.push(1); return envBase; };
  const spawn = () => { throw new Error("不应触发"); };
  const t0 = Date.now();
  assert.equal(restoreMainTick({ probe, spawn, now: t0, intervalMs: 30 * 60e3 }).action, "skip-main");
  assert.equal(restoreMainTick({ probe, spawn, now: t0 + 60e3, intervalMs: 30 * 60e3 }).action, "skip-interval");
  assert.equal(calls.length, 1, "守时窗内不得重探");
  assert.equal(restoreMainTick({ probe, spawn, now: t0 + 60e3, intervalMs: 30 * 60e3, force: true }).action, "skip-main");
  assert.equal(calls.length, 2, "force 越过守时窗");
});

test("SYS-184/⑥ tick：占用在期/装机锁新鲜/离线 ⇒ 各自 skip（不 spawn）", () => {
  __testResetRestoreMain();
  const spawned = [];
  const spawn = (x) => spawned.push(x);
  assert.equal(restoreMainTick({ probe: () => ({ occupied: true }), spawn, force: true }).action, "skip-occupied");
  assert.equal(restoreMainTick({ probe: () => ({ locked: true }), spawn, force: true }).action, "skip-locked");
  assert.equal(restoreMainTick({ probe: () => ({ offline: true }), spawn, force: true }).action, "skip-offline");
  assert.equal(spawned.length, 0);
});

test("SYS-184/⑦ tick：main 线（含 +dirty）⇒ skip-main；漂移（旧 sha/分支标记）⇒ spawn 回主（带 serial）", () => {
  __testResetRestoreMain();
  const spawned = [];
  const spawn = (x) => spawned.push(x);
  const run = (deviceVersion, ledgerLast = null) => restoreMainTick({ probe: () => ({ ...envBase, deviceVersion, ledgerLast }), spawn, force: true });
  assert.equal(run("V1.1-abc12345").action, "skip-main");
  assert.equal(run("V1.1-abc12345+dirty").action, "skip-main");        // main 检出脏项容忍（D1 备注）
  assert.equal(run("V1.1-abc12345+upg519+dirty").action, "spawned");   // 分支标记=工作树包 ⇒ 回主
  assert.equal(run("V1.1-99999999").action, "spawned");                // 旧 sha ⇒ 回主
  assert.deepEqual(spawned, [{ serial: "T-9" }, { serial: "T-9" }], "只对有漂移的两发 spawn·带 serial");
  assert.equal(restoreMainTick({ probe: () => ({ ...envBase, deviceVersion: "" }), spawn, force: true }).action, "skip-no-version");
});

test("SYS-184/⑧ tick：对账不符随读数上报（D5）——台账 last ≠ 设备回读 ⇒ reconcile；一致 ⇒ 无", () => {
  __testResetRestoreMain();
  const spawn = () => {};
  const bad = restoreMainTick({
    probe: () => ({ ...envBase, deviceVersion: "V1.1-abc12345+upg519+dirty", ledgerLast: { versionName: "V1.1-abc12345", at: "t" } }),
    spawn, force: true,
  });
  assert.match(bad.reconcile || "", /台账 last/);
  assert.equal(bad.action, "spawned");
  __testResetRestoreMain();
  const ok = restoreMainTick({ probe: () => ({ ...envBase, ledgerLast: { versionName: "V1.1-abc12345" } }), spawn, force: true });
  assert.equal(ok.reconcile, undefined);
});
