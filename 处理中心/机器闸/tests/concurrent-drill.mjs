#!/usr/bin/env node
// concurrent-drill.mjs —— R2 写入事务化并发演练（2026-10-04 立·工单系统重构 R2 验收件）
//
// 演练判据（v3 R2 验收）：
//   D1 双进程并发写不同卡 → 双 rc0·两卡各自到位·旁观卡原样·卡数不变（UPG-56/57 丢行场景）
//   D2 双进程并发写同一卡 → 串行化·最终态一致·卡数不变（UPG-60 回退/覆盖场景）
//   D3 锁被他人持有且不让渡（wait 3s）→ rc1 拒写「写锁超时」
//   D4 锁短暂持有后让渡（wait 10s）→ 排队取得·rc0
//   D5 跨语言互通：python 持锁 1s → lib-edit.mjs（node）排队等待后 rc0（同协议 <目标>.lock）
// 用法：node 处理中心/机器闸/tests/concurrent-drill.mjs　退出码 0=全绿 1=有红
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATES = path.resolve(HERE, "..");
const ROOT = path.resolve(GATES, "..", "..");
const FIXTURE = path.join(HERE, "contracts", "fixture-library.md");
const TMP = path.join(HERE, ".tmp");
const ENV = { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" };

function freshSandbox(tag) {
  fs.mkdirSync(TMP, { recursive: true });
  const sb = path.join(TMP, `drill-${tag}.md`);
  fs.copyFileSync(FIXTURE, sb);
  return sb;
}
const runP = (cmd, args, env = ENV) => new Promise((res) => {
  const p = spawn(cmd, args, { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  p.stdout.on("data", d => out += d); p.stderr.on("data", d => out += d);
  p.on("close", rc => res({ rc, out }));
});
const ss = (sb, args, env) => runP("python", [path.join(GATES, "set-status.py"), ...args, "--lib", sb], env);
function blockOf(file, ticket) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const start = lines.findIndex(l => l.startsWith(`# ${ticket} `));
  if (start < 0) return null;
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) if (/^# [A-Z][A-Z0-9]*-\d+\s/.test(lines[j])) { end = j; break; }
  return lines.slice(start, end).join("\n");
}
const cards = (f) => (fs.readFileSync(f, "utf8").match(/^# (?:TST|SYS)-\d+ /gm) || []).length;

const results = [];
const t = (name, fn) => results.push({ name, pass: !!fn() });
const show = () => { for (const r of results) console.log(`${r.pass ? "✅" : "❌"} ${r.name}`);
  const bad = results.filter(r => !r.pass).length;
  console.log(`═══ 并发演练：${results.length - bad}/${results.length} 绿 ${bad ? `（${bad} 红）` : ""}═══`);
  process.exit(bad ? 1 : 0); };

// D1：双进程并发写不同卡
const sb1 = freshSandbox("d1");
const watch002 = blockOf(sb1, "SYS-99002");
const [w1, w2] = await Promise.all([
  ss(sb1, ["TST-001", "--phase", "in_progress", "--branch", "feat/tst001", "--note", "并发演练A"]),
  ss(sb1, ["TST-003", "--phase", "claimed", "--branch", "feat/tst003", "--note", "并发演练B"]),
]);
t("D1 双进程并发写不同卡→双rc0+各自到位+旁观卡原样+卡数3+读回对账在案", () =>
  w1.rc === 0 && w2.rc === 0
  && /phase:\s*in_progress/.test(blockOf(sb1, "TST-001") || "")
  && /phase:\s*claimed/.test(blockOf(sb1, "TST-003") || "")
  && blockOf(sb1, "SYS-99002") === watch002
  && cards(sb1) === 3
  && (w1.out + w2.out).includes("读回对账通过"));

// D2：双进程并发写同一卡（串行化·最终态一致）
const sb2 = freshSandbox("d2");
const [c1, c2] = await Promise.all([
  ss(sb2, ["TST-001", "--phase", "in_progress", "--branch", "feat/tst001", "--note", "同卡竞写甲"]),
  ss(sb2, ["TST-001", "--phase", "in_progress", "--branch", "feat/tst001", "--note", "同卡竞写乙"]),
]);
t("D2 同卡并发→双rc0串行化+终态in_progress+卡数3", () =>
  c1.rc === 0 && c2.rc === 0
  && /phase:\s*in_progress/.test(blockOf(sb2, "TST-001") || "")
  && cards(sb2) === 3);

// D3：锁被持有不让渡→超时拒写
const sb3 = freshSandbox("d3");
fs.writeFileSync(sb3 + ".lock", "held-by-drill");
const d3 = await ss(sb3, ["TST-001", "--phase", "in_progress", "--branch", "feat/tst001"],
  { ...ENV, SET_STATUS_LOCK_WAIT: "3" });
fs.unlinkSync(sb3 + ".lock");
t("D3 锁被持有+wait3s→rc1写锁超时", () => d3.rc === 1 && d3.out.includes("写锁超时"));

// D4：锁短暂持有后让渡→排队成功
const sb4 = freshSandbox("d4");
fs.writeFileSync(sb4 + ".lock", "held-by-drill");
setTimeout(() => { try { fs.unlinkSync(sb4 + ".lock"); } catch {} }, 1200);
const d4 = await ss(sb4, ["TST-001", "--phase", "in_progress", "--branch", "feat/tst001"],
  { ...ENV, SET_STATUS_LOCK_WAIT: "15" });
t("D4 锁1.2s让渡+wait15s→rc0排队取得", () => d4.rc === 0 && /phase:\s*in_progress/.test(blockOf(sb4, "TST-001") || ""));

// D5：跨语言互通——python 持锁 1s，node lib-edit 排队后成功
const sb5 = freshSandbox("d5");
const noop = path.join(TMP, "noop-edit.py");
fs.writeFileSync(noop, "import os\np=os.environ['LIB_EDIT_TARGET']\ns=open(p,encoding='utf-8').read()\nopen(p,'w',encoding='utf-8',newline='').write(s)\n", "utf-8");
const holder = spawn("python", ["-c",
  "import time,sys\np=sys.argv[1]\nopen(p,'w').write('py-holder')\ntime.sleep(1)\nimport os\nos.remove(p)",
  sb5 + ".lock"], { stdio: "ignore" });
const holderDone = new Promise(r => { if (holder.exitCode !== null) r(); else holder.on("close", r); });
const d5 = await runP("node", [path.join(GATES, "lib-edit.mjs"), "--file", sb5, "--py", noop],
  { ...ENV, LIB_EDIT_LOCK_WAIT: "15" });
await holderDone;
t("D5 python持锁1s→lib-edit(node)排队rc0（跨语言同协议）", () => d5.rc === 0 && d5.out.includes("✅ 通过") && cards(sb5) === 3);

// ── SYS-194 D6/D7/D8：取号并持库锁＋写前重读对账（2026-10-07 并发丢卡修复）────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const headsOf = (f) => fs.readFileSync(f, "utf8").match(/^# [A-Z][A-Z0-9]*-\d+\s/gm) || [];
const CROSS_EMPTY = path.join(TMP, "cross-empty.md");
fs.writeFileSync(CROSS_EMPTY, "", "utf8");
const quhao = (sb, tag) => runP("node", [path.join(GATES, "取号.mjs"), "立卡", "SYS", `并发冒烟${tag}`, "SYS-194 drill",
  "--bv", "3", "--tc", "2", "--rr", "2", "--size", "2", "--lib", sb, "--lib-an", CROSS_EMPTY]);

// D6：5 轮并发混跑（立卡×3 ＋ set-status×3·不同卡）——并持库锁（修后）⇒ 每轮全 rc0·卡头+3·零丢行
const sb6 = freshSandbox("d6");
const base6 = headsOf(sb6);
let d6ok = true;
const d6bad = [];
for (let r = 1; r <= 5; r++) {
  const headsBefore = headsOf(sb6);
  const rs = await Promise.all([
    quhao(sb6, `R${r}甲`), quhao(sb6, `R${r}乙`), quhao(sb6, `R${r}丙`),
    ss(sb6, ["TST-001", "--phase", "in_progress", "--branch", "feat/tst001", "--note", `D6-R${r}`]),
    ss(sb6, ["TST-003", "--phase", "in_progress", "--branch", "feat/tst003", "--note", `D6-R${r}`]),
    ss(sb6, ["SYS-99002", "--phase", "in_progress", "--note", `D6-R${r}`]),
  ]);
  const headsAfter = headsOf(sb6);
  const ok = rs.every((x) => x.rc === 0)
    && headsAfter.length === headsBefore.length + 3
    && headsBefore.every((h) => headsAfter.includes(h));
  if (!ok) { d6ok = false; d6bad.push(`轮${r}: rc=[${rs.map((x) => x.rc)}] ${headsBefore.length}->${headsAfter.length}`); }
}
t("D6 立卡×3＋set-status×3 并行×5轮→每轮全rc0+卡头+3+零丢行", () =>
  d6ok && headsOf(sb6).length === base6.length + 15 && /phase:\s*in_progress/.test(blockOf(sb6, "SYS-99002") || ""));
if (d6bad.length) console.log("   D6 失败细节：" + d6bad.join(" ｜ "));

// D7/D8 共用场景：set-status 读后（测试缝延时窗内）外部追加一张卡——模拟修前「取号 append 落在读后写前」
const EXTRA = `\n# SYS-99099 并发窗口外部追加卡\n\n**分类**：M0 测试 ｜ **平台**：works ｜ **仓库**：体系仓\n\n\`\`\`status\nphase: registered\nbranch: feat/x\nhead: —\n\`\`\`\n\n**状态**：SYS-194 并发窗口样本\n\n---\n`;
const windowRun = async (bin, tag) => {
  const sb = freshSandbox(tag);
  const p = runP("python", [bin, "TST-001", "--phase", "in_progress", "--branch", "feat/tst001", "--note", tag, "--lib", sb],
    { ...ENV, SET_STATUS_TEST_DELAY_MS: "1800" });
  await sleep(700);
  fs.appendFileSync(sb, EXTRA, "utf8");
  return { sb, r: await p };
};
const fix7 = await windowRun(path.join(GATES, "set-status.py"), "d7-fix");
t("D7 修后（⑦基线=disk现态）：窗口外部追加 ⇒ 对账红rc1＋回滚保全追加卡（零丢）", () =>
  fix7.r.rc === 1 && fix7.r.out.includes("读回对账失败")
  && fs.readFileSync(fix7.sb, "utf8").includes("# SYS-99099 "));

// D8：变异亲杀——把 ⑧ 基线回退为「旧读」（修前形态）⇒ 盲区复现（rc0＋追加卡被覆盖·丢卡）
const MUT = path.join(GATES, "set-status.mutant-194-drill.py");
const NEEDLE = "expected_headers = [l for l in load().split(\"\\n\") if re.match(r\"^# [A-Z][A-Z0-9]*-\\d+\\s\", l)]";
const MUTANT = "expected_headers = [l for l in text.split(\"\\n\") if re.match(r\"^# [A-Z][A-Z0-9]*-\\d+\\s\", l)]";
fs.writeFileSync(MUT, fs.readFileSync(path.join(GATES, "set-status.py"), "utf8").split(NEEDLE).join(MUTANT), "utf8");
const mut7 = await windowRun(MUT, "d7-mut");
fs.rmSync(MUT, { force: true });
t("D8 变异亲杀（基线回旧读）⇒ 盲区复现：rc0＋追加卡被覆盖（丢卡）", () =>
  mut7.r.rc === 0 && !fs.readFileSync(mut7.sb, "utf8").includes("# SYS-99099 "));

show();
