#!/usr/bin/env node
// UPG-551 遥测派生脚本 · task 事件史（全量）→ 四读数（纯函数·同一输入两跑同值）
//
// 口径（与《事件映射表》一致·v1）：
//   ①完成时分段：端到端=末-首事件时戳；区间按起段状态分类——WAITING_USER/WAITING_EVENT/WAITING_TIME=等人段，其余=机器段；
//   ②总触点数=用户动作（trigger∈{chat,user_confirm} 事件簇·<3s 同触发折一）＋计划外动作（未映射到声明触点步/重复动作/retry 动作）；
//   ③澄清轮数=对话日志（session.jsonl）里 AI 含问号的消息数（缺对话日志=null·不估算）；
//   ④失败/接管数=FAILED 相位进入次数（失败）＋trigger=retry 事件簇数（重试）＋剧本 waitUser 接管事件数。
//
// 用法：node task-telemetry.mjs --events <events.json> [--convo <session.jsonl>] [--blueprint onboard] [--json]
//   输入 events.json = 数组 [{seq,at,kind,trigger,trigger_id,from_state,to_state,note}]（DB task_event 全量导出）
import { readFileSync } from "node:fs";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const EV = arg("--events"); const CONVO = arg("--convo"); const AS_JSON = process.argv.includes("--json");
if (!EV) { console.error("用法：node task-telemetry.mjs --events <events.json> [--convo <session.jsonl>] [--json]"); process.exit(2); }

// 蓝图声明（v1·onboard）：步名↔id 映射＋用户触点点集（s1/s2/s3=USER；s4/s7=confirm 闸；s6=USER）
const BP = {
  onboard: {
    version: "onboard-v1(8步·驳回回流≤1)",
    names: { "上传材料": "s1", "核对资料": "s2", "把关确认": "s3", "提交进件": "s4", "等审核结果": "s5", "审核结果处理": "s6", "重新提交": "s7", "等审核结果（重提后）": "s8" },
    touchSteps: new Set(["s1", "s2", "s3", "s4", "s6", "s7"]),
  },
};
const bp = BP[arg("--blueprint", "onboard")];
if (!bp) { console.error("未知蓝图：" + arg("--blueprint", "onboard")); process.exit(2); }

const events = JSON.parse(readFileSync(EV, "utf8"))
  .slice().sort((a, b) => (a.at - b.at) || ((a.seq ?? 0) - (b.seq ?? 0)));

const WAITS = new Set(["WAITING_USER", "WAITING_EVENT", "WAITING_TIME"]);
const r1 = { e2e_ms: 0, machine_ms: 0, wait_ms: 0, wait_user_ms: 0, wait_event_ms: 0 };
if (events.length >= 2) {
  const first = events[0].at, last = events[events.length - 1].at;
  r1.e2e_ms = last - first;
  for (let i = 0; i < events.length - 1; i++) {
    const dt = events[i + 1].at - events[i].at;
    const st = events[i].to_state || "";
    if (WAITS.has(st)) {
      r1.wait_ms += dt;
      if (st === "WAITING_USER") r1.wait_user_ms += dt; else r1.wait_event_ms += dt;
    } else r1.machine_ms += dt;
  }
}

// 用户动作簇：trigger∈{chat,user_confirm}，同触发且间隔<3s 折一
const isUserEv = (e) => ["chat", "user_confirm", "create"].includes(e.trigger) && ["state", "intent", "result"].includes(e.kind);
const actions = [];
for (const e of events) {
  if (!isUserEv(e)) continue;
  const last = actions[actions.length - 1];
  // 同一用户动作可能落多条事件（create+chat 点火、intent/result/state 连发）——3s 内折一簇
  if (last && e.at - last.at < 3000) { last.evs.push(e); last.at = e.at; }
  else actions.push({ trigger: e.trigger, at: e.at, evs: [e] });
}
// 步归属：优先 trigger_id 的 intent/result-ok/result-err:<sNN>；否则从事件注记找「步骤完成：<名>」/「等待（用户）：<desc>」
const stepOfAction = (a) => {
  for (const e of a.evs) {
    const m = /(?:intent|result-ok|result-err):(s\d+)/.exec(e.trigger_id || "");
    if (m) return { step: m[1], how: "trigger_id" };
  }
  if (a.evs.some((e) => (e.trigger_id || "").startsWith("create:"))) return { step: "创任务", how: "trigger_id=create" };
  for (const e of a.evs) {
    const done = [...(e.note || "").matchAll(/步骤完成：([^；]+)/g)].map((x) => x[1].trim());
    if (done.length) { const id = bp.names[done[done.length - 1]]; return { step: id || "?", how: "note-步骤完成" }; }
    const wait = /等待（用户）：(.+)/.exec(e.note || "");
    if (wait) {
      const name = Object.keys(bp.names).find((n) => n !== "等审核结果" && wait[1].startsWith(n));
      if (name) return { step: bp.names[name], how: "note-等待用户" };
    }
  }
  return { step: null, how: "未映射" };
};
const seenSteps = new Map();
const details = [];
for (const a of actions) {
  const { step, how } = stepOfAction(a);
  const kind = ["chat", "create"].includes(a.trigger) && a.evs.some((e) => (e.trigger_id || "").startsWith("create") || e.trigger === "create") ? "ignition" : "action";
  let unplanned = null;
  if (kind === "ignition") unplanned = false;                      // 发起＝样本任务声明动作
  else if (!step) unplanned = true;                                 // 未映射＝计划外（显式）
  else if (!bp.touchSteps.has(step)) unplanned = true;              // 非声明触点步
  else { const n = (seenSteps.get(step) || 0) + 1; seenSteps.set(step, n); unplanned = n > 1; } // 同步第二次＝计划外
  details.push({ at: a.at, trigger: a.trigger, kind, step: step || "?", how, planned: !unplanned });
}

// retry 簇（失败重试读数）
const retries = [];
for (const e of events) {
  if (e.trigger !== "retry") continue;
  const last = retries[retries.length - 1];
  if (last && e.at - last.at < 3000) { last.at = e.at; last.n++; } else retries.push({ at: e.at, n: 1 });
}
// 失败：进入 FAILED 的次数（相位跃迁）
let failures = 0;
let prev = "";
for (const e of events) { if (e.to_state === "FAILED" && prev !== "FAILED") failures++; prev = e.to_state; }
// 接管：剧本 waitUser 人工接管解挂（onboard 链无剧本步·留接口）
const takeovers = events.filter((e) => (e.note || "").includes("等待人工接管")).length;

// 对话日志：AI 含问号消息数＋用户消息数
let clarifications = null, userMessages = null;
if (CONVO) {
  clarifications = 0; userMessages = 0;
  for (const line of readFileSync(CONVO, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let d; try { d = JSON.parse(line); } catch { continue; }
    if (d.type === "user/message") userMessages++;
    if (d.type === "assistant/message") {
      const text = (d.data?.message?.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
      if (/[？?]/.test(text)) clarifications++;
    }
  }
}

const out = {
  task_id: events[0]?.task_id ?? null,
  blueprint: bp.version,
  events_total: events.length,
  window: events.length ? { first_at: events[0].at, last_at: events[events.length - 1].at } : null,
  reading_1_completion: r1,
  reading_2_touchpoints: {
    total: actions.length,
    unplanned: details.filter((d) => !d.planned).length,
    detail: details,
  },
  reading_3_clarifications: { clarifications, user_messages: userMessages, source: CONVO || null },
  reading_4_failures: { failures, retries: retries.reduce((s, r) => s + r.n, 0), retry_clusters: retries.length, takeovers },
};
// 口径自检：分段和＝端到端（事件≥2）
if (events.length >= 2 && r1.machine_ms + r1.wait_ms !== r1.e2e_ms) {
  console.error(`✗ 自检失败：机器段+等人段 ≠ 端到端（${r1.machine_ms}+${r1.wait_ms} ≠ ${r1.e2e_ms}）`); process.exit(1);
}
if (AS_JSON) { console.log(JSON.stringify(out, null, 1)); }
else {
  const s = (ms) => (ms / 1000).toFixed(1) + "s";
  console.log(`任务 ${out.task_id}｜蓝图 ${out.blueprint}｜事件 ${out.events_total} 条`);
  console.log(`① 完成时分段：端到端 ${s(r1.e2e_ms)}＝机器 ${s(r1.machine_ms)}＋等人 ${s(r1.wait_ms)}（等人中：用户 ${s(r1.wait_user_ms)}／事件 ${s(r1.wait_event_ms)}）`);
  console.log(`② 总触点数 ${out.reading_2_touchpoints.total}（计划外 ${out.reading_2_touchpoints.unplanned}）`);
  for (const d of details) console.log(`   - ${new Date(d.at).toISOString()} ${d.trigger}/${d.kind} → ${d.step}（${d.how}）${d.planned ? "" : " ★计划外"}`);
  console.log(`③ 澄清轮数 ${clarifications === null ? "null（未给对话日志）" : clarifications}｜用户消息 ${userMessages}`);
  console.log(`④ 失败 ${out.reading_4_failures.failures}｜重试 ${out.reading_4_failures.retries}（簇 ${out.reading_4_failures.retry_clusters}）｜接管 ${takeovers}`);
}
