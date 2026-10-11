#!/usr/bin/env node
// card-clarity/release-gate.mjs —— 卡面体验闸·四件套一把跑（CLI·json＋摘要双出·可 CI/轮次复跑）
//
// 四件套：①五答检查（schema 校验器＋card-audit --five）②slop guards（确定性）③measure（渲染读数）④AI 3 秒测试（冷读→next 真值比对）
// 用法：
//   node release-gate.mjs --cards <cards.json|目录> [--render <目录>] [--judge llm|stub|cmd:…] [--base <沙盒>] [--json] [--skip-ai]
// 退出码：0=四件全过 ｜ 1=有件不过 ｜ 2=用法/环境错
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? true) : d; };
const CARDS = arg("--cards"), RENDER = arg("--render", path.join(HERE, "_gate-render")), JUDGE = arg("--judge", "llm");
const JSON_OUT = argv.includes("--json"), SKIP_AI = argv.includes("--skip-ai");
if (!CARDS) { console.error("用法：node release-gate.mjs --cards <cards> [--render <目录>] [--judge llm|stub|cmd:…] [--json]"); process.exit(2); }

const run = (script, ...args) => {
  const cmd = [path.join(HERE, script), ...args, "--json"];
  let out = "", rc = 0;
  try { out = execFileSync(process.execPath, cmd, { encoding: "utf8", windowsHide: true, maxBuffer: 1 << 24 }); } catch (e) { out = e.stdout || ""; rc = e.status ?? 1; }
  let j = null; try { j = JSON.parse(out); } catch (_) { j = { parseError: true, raw: out.slice(0, 400) }; }
  return { rc, json: j };
};

const steps = [];
// ① 五答检查（含 schema 校验）
const five = run("validate.mjs", "--cards", CARDS);
steps.push({ name: "five-check(validate)", rc: five.rc, pass: five.rc === 0, detail: { total: five.json.total, failed: five.json.failed, whitelistSource: five.json.whitelistSource } });
// ② slop
const slop = run("gates/slop.mjs", "--cards", CARDS);
steps.push({ name: "slop-guards", rc: slop.rc, pass: slop.rc === 0, detail: { total: slop.json.total, hit: slop.json.hit } });
// ③ 渲染＋measure
if (!fs.existsSync(path.join(RENDER, "dom.json"))) {
  const r = execFileSync(process.execPath, [path.join(HERE, "render.mjs"), "--cards", CARDS, "--out", RENDER], { encoding: "utf8", windowsHide: true });
  void r;
}
const meas = run("gates/measure.mjs", "--dom", path.join(RENDER, "dom.json"));
steps.push({ name: "measure", rc: meas.rc, pass: meas.rc === 0, detail: { total: meas.json.total, bad: meas.json.bad } });
// ④ AI 3 秒
if (SKIP_AI) steps.push({ name: "ai-3s", rc: 0, pass: true, skipped: true, detail: "（--skip-ai）" });
else {
  const ai = run("gates/ai3s.mjs", "--cards", CARDS, "--render", RENDER, "--judge", String(JUDGE), "--base", String(arg("--base", "http://127.0.0.1:8180")));
  steps.push({ name: "ai-3s", rc: ai.rc, pass: ai.rc === 0, detail: { judgeChannel: ai.json.judgeChannel, total: ai.json.total, passed: ai.json.passed, verdict: ai.json.verdict } });
}
const allPass = steps.every((s) => s.pass);
const result = { at: new Date().toLocaleString("sv-SE"), cards: path.resolve(CARDS), render: RENDER, steps, verdict: allPass ? "pass" : "fail" };
if (JSON_OUT) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`卡面体验闸·四件套 @ ${result.at}`);
  for (const s of steps) console.log(`  ${s.pass ? "✅" : "❌"} ${s.name}${s.skipped ? "（跳过）" : ""} — ${JSON.stringify(s.detail)}`);
  console.log(`=> ${allPass ? "全过：可发卡" : "有件不过：回炉（不过卡不起量）"}（rc=${allPass ? 0 : 1}）`);
}
process.exit(allPass ? 0 : 1);
