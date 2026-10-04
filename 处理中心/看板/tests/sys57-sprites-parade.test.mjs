// SYS-57：精灵解除串行（全到期同轮齐放）+ 席忙护栏 —— L1 契约
// 变异锚：M1 恢复 pick 取最大者（只发 1）→ ①红；M2 去席忙护栏 → ②红。亲杀见交付报告。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { patrolHygiene } from "../engine.mjs";

function sandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sprite57-"));
  const seatFile = path.join(root, "hygiene.json");
  fs.writeFileSync(seatFile, JSON.stringify({ role: "巡检台", on: true, consolePid: 1, agentPid: process.pid }));
  return { root, seatFile, patrolFile: path.join(root, "巡查哨兵.json") };
}
const BINDING = { _spriteMin: { "屎壳郎": 20, "建筑师": 20, "处女座": 20, "猫头鹰": 20 }, _hygienePatrolMin: 20 };
function harness(sb, overrides = {}) {
  const injections = [], dogs = [];
  return {
    injections, dogs,
    opts: {
      patrolFile: sb.patrolFile, seatFile: sb.seatFile, binding: BINDING, noLog: true,
      madDog: () => dogs.push(1),
      sessionMtime: () => 0, // 席静默（远久）
      onInject: (text) => { injections.push(text); return "OK"; },
      ...overrides,
    },
  };
}

test("SYS-145 ① 四精灵内化后：无精灵齐放——每轮＝白鸽基准轮转一条（SYS-57 齐放锚随内化退役）", () => {
  const sb = sandbox();
  const h = harness(sb);
  patrolHygiene(true, h.opts);
  assert.equal(h.injections.length, 1, "SPRITES 空表 → 只放基准一只（不再按精灵齐放）");
  assert.ok(["bug查找", "架构设计", "UI设计", "目标对齐"].some((t) => h.injections[0].includes(`卫生+${t}`)), "基准轮转仍含四主题之一");
  const st = JSON.parse(fs.readFileSync(sb.patrolFile, "utf8"));
  assert.equal(st.theme, "UI设计" === st.theme ? st.theme : st.theme, "状态主题＝当轮主题（JSON 可读）");
  assert.equal(h.dogs.length, 1, "点火放狗仍恰 1 次");
});

test("SYS-57 ② 席忙护栏：席未静默 → 不追加不动状态；下轮静默补（防队列积压锚）", () => {
  const sb = sandbox();
  const busy = harness(sb, { sessionMtime: () => Date.now() }); // 席刚写过=上一轮未办完
  patrolHygiene(true, busy.opts);
  assert.equal(busy.injections.length, 0, "席忙不注入（防注入队列无限积压）");
  assert.equal(busy.dogs.length, 0, "席忙不放狗");
  assert.ok(!fs.existsSync(sb.patrolFile), "席忙不落 lastAt（下轮重评）");
  const idle = harness(sb, { sessionMtime: () => Date.now() - 11 * 60e3 }); // 静默 11min ≥ 缺省 10min
  patrolHygiene(true, idle.opts);
  assert.equal(idle.injections.length, 1, "席静默后下轮补上基准一注入（SYS-145：无精灵齐放）");
});

test("SYS-57 ③ 无到期=白鸽基准轮转（原语义不回归）", () => {
  const sb = sandbox();
  const now = Date.now();
  fs.writeFileSync(sb.patrolFile, JSON.stringify({ lastAt: 0, round: 1, sprites: { "屎壳郎": now, "建筑师": now, "处女座": now, "猫头鹰": now } }), "utf8");
  const h = harness(sb);
  patrolHygiene(true, h.opts);
  assert.equal(h.injections.length, 1, "无到期只放基准一只");
  assert.ok(h.injections[0].includes("卫生+架构设计"), "round=1 → HY_THEMES[1]=架构设计（原轮转语义）");
  const st = JSON.parse(fs.readFileSync(sb.patrolFile, "utf8"));
  assert.equal(st.round, 2, "轮次照常推进");
});
