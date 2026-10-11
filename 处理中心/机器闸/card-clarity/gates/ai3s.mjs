#!/usr/bin/env node
// card-clarity/gates/ai3s.mjs —— AI 3 秒测试（冷读单问 → 对 next 真值比对）
//
// 用法：
//   node ai3s.mjs --cards <文件|目录> --render <render 目录> [--judge llm|cmd:<命令>|stub]
//                 [--base http://127.0.0.1:8180] [--token <账号令牌>] [--model deepseek-v4-pro] [--json]
// 判据：≥6 张命中 ≥5 ＝过；含糊卡（看不到 next 语义）应失分。
// judge 通道（MUST 入证：通道＋模型版本）：
//   llm  ＝ OpenAI 兼容 /llm/chat/completions（沙盒代理同形）；无 --token 且 base 为本地沙盒 ⇒ 自动 mock 铸号登录取令牌
//   cmd: ＝ 外部命令（占位符 {q}；图片路径经 --img 传环境变量 CARD_IMG）——视觉模型通道的接入点（一行）
//   stub ＝ 确定性本地启发式（无 AI·仅供管线自测；读数注明「非 AI 通道」）
// 冷读输入＝卡片**可见文字**（render 产物的 dom.json text 字段；视觉通道可用 {img} 读截图）。
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
const arg = (k, d = null) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] ?? true) : d; };
const CARDS = arg("--cards"), RENDER = arg("--render");
const JUDGE = arg("--judge", "llm"), BASE = (arg("--base", "http://127.0.0.1:8180")).replace(/\/$/, ""), MODEL = arg("--model", "deepseek-v4-pro");
const JSON_OUT = argv.includes("--json");
if (!CARDS || !RENDER) { console.error("用法：node ai3s.mjs --cards <文件|目录> --render <render 目录> [--judge llm|cmd:…|stub] [--json]"); process.exit(2); }

let LABELS = {};
try { const R = await import("file:///" + path.join(process.env.MOV_PRODUCT_ROOT || "E:/mov归档/0027-mov", "tools/ms-md-server/page/src/lib/cardRegistry.js").replace(/\\/g, "/")); LABELS = R.ACTION_LABELS || {}; } catch { LABELS = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, "")), "..", "fallback-whitelist.json"), "utf8")).labels || {}; }

function load(p) {
  const st = fs.statSync(p);
  const files = st.isDirectory() ? fs.readdirSync(p).filter((f) => f.startsWith("cards.") && f.endsWith(".json")).map((f) => path.join(p, f)) : [p];
  return files.flatMap((f) => { const j = JSON.parse(fs.readFileSync(f, "utf8")); return (Array.isArray(j) ? j : [j]); });
}

async function mintToken() {
  const post = async (p, b) => { const r = await fetch(BASE + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); return { s: r.status, j: await r.json().catch(() => ({})) }; };
  const phone = "138" + String(Date.now()).slice(-8);
  const a = await post("/account/sms", { phone });
  const code = a.j.dev_code || a.j.code;
  if (!code) throw new Error("mock 发码失败（" + a.s + "）");
  const b = await post("/account/login", { phone, code });
  const tok = b.j.token || b.j.account_token;
  if (!tok) throw new Error("mock 登录失败（" + b.s + "）");
  return tok;
}

async function judgeLlm(question, text, img, token) {
  const body = { model: MODEL, stream: false, max_tokens: 256, temperature: 0, thinking: { type: "disabled" }, messages: [{ role: "user", content: question + "\n---\n" + text }] };
  const r = await fetch(BASE + "/llm/chat/completions", { method: "POST", headers: { "content-type": "application/json", "X-Account-Token": token }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  const msg = j.choices?.[0]?.message?.content || "";
  return String(msg).trim();
}

function judgeStub(text, truthLabel) {
  // 确定性「文本冷读」通道（非 AI）：双行口径回填可见文字（判分仍走 expect 真值比对）
  const t = String(text || "").trim();
  return `情况：${t}\n行动：${t}`;
}

function judgeCmd(cmd, question, text, img) {
  const out = execFileSync(process.env.ComSpec || "cmd.exe", ["/c", cmd.replace(/\{q\}/g, "%AI3S_Q%")], { encoding: "utf8", windowsHide: true, env: { ...process.env, CARD_TEXT: text, CARD_IMG: img || "", AI3S_Q: question }, maxBuffer: 1 << 22 });
  return out.trim();
}

const cards = load(path.resolve(CARDS));
const dom = JSON.parse(fs.readFileSync(path.join(RENDER, "dom.json"), "utf8"));
const domOf = Object.fromEntries(dom.map((d) => [d.cardId, d]));
let token = arg("--token", null);
let judgeDesc = "";
if (["llm", undefined].includes(JUDGE) || JUDGE === true) { if (!token) token = await mintToken().catch((e) => { console.error("✗ 铸令牌失败：" + e.message); process.exit(2); }); judgeDesc = `llm:${BASE} model=${MODEL}（冷读输入=可见文字；视觉通道经 --judge cmd: 一行接入）`; }
else if (String(JUDGE).startsWith("cmd:")) judgeDesc = "cmd:" + String(JUDGE).slice(4);
else judgeDesc = "stub（确定性启发式·非 AI 通道）";

const Q = "只读下面这张手机卡片上显示的全部文字，用两行回答（不要解释）：\n情况：<这张卡现在是什么情况·≤12字>\n行动：<这张卡要我做什么·≤8字>";
const EXPECT = (() => { try { return JSON.parse(fs.readFileSync(path.join(path.dirname(path.resolve(CARDS)), "ai3s.expect.json"), "utf8")); } catch { try { return JSON.parse(fs.readFileSync(path.join(path.resolve(CARDS), "ai3s.expect.json"), "utf8")); } catch { return {}; } } })();
const rows = [];
for (const c of cards) {
  const d = domOf[c.cardId] || {};
  const label = LABELS[c.next] || c.next || "";
  const img = fs.existsSync(path.join(RENDER, `card-${String(c.cardId).replace(/[^\w.-]/g, "_")}.png`)) ? path.join(RENDER, `card-${String(c.cardId).replace(/[^\w.-]/g, "_")}.png`) : null;
  let answer = "";
  try {
    if (judgeDesc.startsWith("llm:")) answer = await judgeLlm(Q, d.text || "", img, token);
    else if (judgeDesc.startsWith("cmd:")) answer = judgeCmd(String(JUDGE).slice(4), Q, d.text || "", img);
    else answer = judgeStub(d.text || "", label);
  } catch (e) { answer = "（judge 失败：" + String(e.message || e).slice(0, 60) + "）"; }
  const ex = EXPECT[c.cardId] || {};
  const m = String(answer).match(/情况[:：]\s*([^\n]*)[\n\s]*行动[:：]\s*([^\n]*)/);
  const parsed = !!m;   // SYS-204 B#27：标记缺失＝解析失败（原回落全文可假过）
  const sit = parsed ? m[1] : "";
  const act = parsed ? m[2] : "";
  const groundTruthMissing = !ex.mustMention && !label;   // SYS-204 B#27：真值缺失不得默过
  const stateOk = !ex.mustMention || ex.mustMention.some((k) => sit.includes(k) || answer.includes(k));
  const actAlt = ex.actionAlt || [];
  const actOk = !label || act.includes(label) || actAlt.some((k) => act.includes(k)) || answer.includes(label);
  const pass = !!(parsed && !groundTruthMissing && answer && answer !== "（不确定）" && stateOk && actOk);
  rows.push({ cardId: c.cardId, expectedNext: c.next, expectedLabel: label, judgeAnswer: answer, situation: sit.trim(), action: act.trim(), pass });
}
const passed = rows.filter((r) => r.pass).length;
const verdict = cards.length >= 6 && passed >= 5;
if (JSON_OUT) console.log(JSON.stringify({ judgeChannel: judgeDesc, total: rows.length, passed, verdict: verdict ? "pass" : "fail", rows }, null, 2));
else {
  for (const r of rows) console.log(`${r.pass ? "✅" : "❌"} #${r.cardId} 期望「${r.expectedLabel}」→ judge「${r.judgeAnswer}」`);
  console.log(`AI 3 秒 gate（${judgeDesc}）：${rows.length} 张，${passed} 过（阈 ≥6 张 ≥5 过）⇒ ${verdict ? "过" : "回炉"}（rc=${verdict ? 0 : 1}）`);
}
process.exit(verdict ? 0 : 1);
