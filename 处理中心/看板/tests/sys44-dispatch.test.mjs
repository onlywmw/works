// SYS-44 派单站哨兵回归测试（就绪×空转 + SLA 滞留；HY-BASE-06 ③④ 同口径）
// 跑法：node --test 处理中心/看板/tests/sys44-dispatch.test.mjs
// 口径：沙箱 libFile/seatsDir/boxRoot/stateFile；onNotify 桩——不碰实盘、不发真信
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { scanDispatchIdle } from "../engine.mjs";

const sandbox = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys44-"));
  const seatsDir = path.join(root, "seats"), boxRoot = path.join(root, "邮箱");
  fs.mkdirSync(seatsDir, { recursive: true });
  fs.mkdirSync(path.join(boxRoot, "程序员", "INBOX"), { recursive: true });
  fs.writeFileSync(path.join(seatsDir, "coder.json"), JSON.stringify({ role: "程序员", on: true, agentPid: process.pid, consolePid: 1 }));
  return { root, seatsDir, boxRoot, libFile: path.join(root, "工单库.md"), stateFile: path.join(root, "待派哨兵.json") };
};
const card = (id, phase, note, ageMin) => `# ${id} 测试单\n\n**分类**：M2 治理 ｜ **优先级**：P2 ｜ **平台**：works\n\n\`\`\`status\nphase: ${phase}\ndesigner: ${note}\ndev: —\nupdated_at: ${new Date(Date.now() - ageMin * 60e3).toLocaleString("sv-SE").replace(" ", "T")}\n\`\`\`\n`; // 本地时戳（与实盘工单库同口径：无时区后缀=本地）
const scan = (sb, opts = {}) => { const hits = []; const st = scanDispatchIdle({ force: true, libFile: sb.libFile, seatsDir: sb.seatsDir, boxRoot: sb.boxRoot, stateFile: sb.stateFile, onNotify: (m) => hits.push(m), ...opts }); return { hits, st }; };
const setCoder = (sb, on) => fs.writeFileSync(path.join(sb.seatsDir, "coder.json"), JSON.stringify({ role: "程序员", on, agentPid: process.pid, consolePid: 1 }));

test("SYS-44 正例：就绪候派 × 在岗箱空 → 提醒信（1 封）+ 状态格数据", () => {
  const sb = sandbox();
  fs.writeFileSync(sb.libFile, card("SYS-T1", "registered", "候派——等施工窗", 10));
  const { hits, st } = scan(sb);
  assert.equal(hits.length, 1, "就绪×空转必须提醒");
  assert.ok(hits[0].includes("SYS-T1"), "信面含单号");
  assert.deepEqual(st.ready, ["SYS-T1"]);
  assert.equal(st.idle, true, "格数据：idle=true");
});

test("SYS-44 负例①：在途派单信（箱不空）→ 不报", () => {
  const sb = sandbox();
  fs.writeFileSync(sb.libFile, card("SYS-T1", "registered", "候派", 10));
  fs.writeFileSync(path.join(sb.boxRoot, "程序员", "INBOX", "LTR-X.md"), "---\nid: LTR-X\nre: SYS-T1 派单\n---\n");
  const { hits, st } = scan(sb);
  assert.equal(hits.length, 0, "在途=已发起，不得误报");
  assert.deepEqual(st.ready, [], "就绪表已剔除在途单");
});

test("SYS-44 负例②：程序员席不在岗 → 不报（防误伤）", () => {
  const sb = sandbox();
  setCoder(sb, false);
  fs.writeFileSync(sb.libFile, card("SYS-T1", "registered", "候派", 10));
  const { hits, st } = scan(sb);
  assert.equal(hits.length, 0, "SLA 内 × 席不在岗：不报");
  assert.equal(st.idle, false);
});

test("SYS-44 负例③④：未注候派 / 相位非 registered → 不报（检测条件承重）", () => {
  const sb = sandbox();
  fs.writeFileSync(sb.libFile, card("SYS-T1", "registered", "等设计评审", 10) + card("SYS-T2", "dispatched", "候派", 10));
  const { hits, st } = scan(sb);
  assert.equal(hits.length, 0, "未注候派/已派单：皆不得进就绪表");
  assert.deepEqual(st.ready, []);
});

test("SYS-44 SLA：席不在岗但就绪滞留超 30min → 照报（HY-BASE-06 ③）", () => {
  const sb = sandbox();
  setCoder(sb, false);
  fs.writeFileSync(sb.libFile, card("SYS-T1", "registered", "候派", 40));
  const { hits, st } = scan(sb);
  assert.equal(hits.length, 1, "滞留超 SLA 必须提醒");
  assert.deepEqual(st.stalled, ["SYS-T1"]);
});

test("SYS-44 降频：逐单 30min 冷却（同单不刷屏；过冷却再报）", () => {
  const sb = sandbox();
  fs.writeFileSync(sb.libFile, card("SYS-T1", "registered", "候派", 10));
  assert.equal(scan(sb).hits.length, 1, "首轮提醒");
  assert.equal(scan(sb).hits.length, 0, "30min 内同单不重复");
  assert.equal(scan(sb, { now: Date.now() + 31 * 60e3 }).hits.length, 1, "过冷却复报");
});
