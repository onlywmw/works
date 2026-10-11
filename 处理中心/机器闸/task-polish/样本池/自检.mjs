#!/usr/bin/env node
// POL-11 样本池·自检.mjs —— A/B 复跑：合成 PII 正例 100% 命中（拒/脱敏）／纯度量负例零误杀，
//   加池扫描（含变异亲杀）与环入口消费（假样本）。真池部分只读（演示条目随池交付）。
// 用法：node 处理中心/机器闸/task-polish/样本池/自检.mjs
// 退出码：0=全过；1=有失败（详见 stdout）
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CH = path.join(HERE, "通道.mjs");
const run = (args, pool) => spawnSync(process.execPath, [CH, ...(pool ? ["--池", pool] : []), ...args], { encoding: "utf8", windowsHide: true });
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => { if (cond) { pass++; console.log(`✅ ${name}`); } else { fail++; console.log(`❌ ${name}${detail ? " —— " + detail : ""}`); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pol11-自检-"));
const pool = path.join(tmp, "池");
const put = (name, obj) => { const f = path.join(tmp, name.replace(/[^\w\u4e00-\u9fff-]/g, "_") + ".json"); fs.writeFileSync(f, JSON.stringify(obj)); return f; };
const base = { sample: "S-MERCHANT-01", source: "sandbox" };
const ck = (o) => ({ phase: "WAITING_USER", event_seq: 12, duration_ms: 8600, error_code: null, field_name: null, count: 1, ...o });

try {
  // ── 1. 正例：合成造 PII ⇒ 100% 命中拒收 ──
  const positives = [
    ["手机号（码内嵌）", { ...base, checkpoint: ck({ error_code: "E13800138000" }) }, /手机号/],
    ["身份证号（码内嵌）", { ...base, checkpoint: ck({ error_code: "ID110101199003071234" }) }, /身份证号/],
    ["邮箱（码内嵌）", { ...base, checkpoint: ck({ error_code: "Ezhang@example.com" }) }, /邮箱/],
    ["姓名（字段值）", { ...base, checkpoint: ck({ field_name: "张三" }) }, /非 ASCII/],
    ["地址（相位值）", { ...base, checkpoint: ck({ phase: "北京市朝阳区建国路88号" }) }, /非 ASCII/],
    ["原文（长中文文本）", { ...base, checkpoint: ck({ error_code: "这是一段从对话里原样抄来的用户原文文本，含具体场景描述，绝不允许进池。" }) }, /非 ASCII/],
    ["头像/附件路径（白名单外键）", { ...base, checkpoint: ck({}), avatar: "files/photo.jpg" }, /未知字段/],
    ["图片数据块（base64）", { ...base, checkpoint: ck({ error_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==" }) }, /图片\/数据块/],
    ["令牌/密钥", { ...base, checkpoint: ck({ error_code: "sk-1234567890abcdef" }) }, /令牌\/密钥/],
    ["原文外挂（未知顶层字段）", { sample: "S-MERCHANT-01", source: "sandbox", checkpoint: ck({}), original_text: "用户的原始对话正文……" }, /未知字段/],
  ];
  for (const [name, cand, want] of positives) {
    const r = run(["上传", put("正例-" + name, cand)], pool);
    ok(`正例拒收 · ${name}`, r.status === 1 && want.test(r.stderr || ""), `rc=${r.status}`);
  }

  // ── 2. 负例：纯度量 ⇒ 零误杀全部入池 ──
  const negatives = [
    ["最小", { ...base, checkpoint: { phase: "RUNNING" } }],
    ["全字段下界", { ...base, checkpoint: ck({ phase: "CREATED", event_seq: 0, duration_ms: 0, count: 0 }) }],
    ["全字段上界", { ...base, checkpoint: ck({ phase: "DONE", event_seq: 1000000, duration_ms: 86400000, count: 1000000000, error_code: "HTTP_403", field_name: "shop_name" }) }],
    ["错误码样式", { ...base, checkpoint: ck({ phase: "FAILED", error_code: "E_SUBMIT_TIMEOUT", field_name: "title" }) }],
  ];
  const ids = [];
  for (const [name, cand] of negatives) {
    const r = run(["上传", put("负例-" + name, cand)], pool);
    const m = /入池（候选）：(CP-[A-Za-z0-9-]+)/.exec(r.stdout || "");
    ok(`负例入池 · ${name}`, r.status === 0 && !!m, `rc=${r.status}`);
    if (m) ids.push(m[1]);
  }

  // ── 3. 脱敏腿：同 PII 走 --脱敏 ⇒ 替换入库并留痕 ──
  const r3 = run(["上传", put("脱敏", { ...base, checkpoint: ck({ error_code: "E13800138000" }) }), "--脱敏"], pool);
  const m3 = /入池（候选）：(CP-[A-Za-z0-9-]+)/.exec(r3.stdout || "");
  ok("脱敏替换（--脱敏 ⇒ 入库）", r3.status === 0 && !!m3 && /已脱敏/.test(r3.stdout || ""), `rc=${r3.status}`);
  if (m3) {
    const ej = JSON.parse(fs.readFileSync(path.join(pool, "条目", m3[1] + ".json"), "utf8"));
    ok("脱敏留痕（gate.redacted 非空）", ej.gate.verdict === "redacted" && ej.gate.redacted.length > 0);
  }

  // ── 4. 接收（结构→合成卡）＋环入口消费（假样本）──
  const id0 = ids[0];
  const r4 = run(["接收", id0], pool);
  ok("合成样本卡生成", r4.status === 0 && /合成样本卡生成/.test(r4.stdout || ""));
  const r5 = run(["读池", id0], pool);
  let man = null; try { man = JSON.parse(r5.stdout); } catch { /* 下面判 */ }
  const ent = man && man.entries && man.entries[0];
  ok("环入口清单（读池）", r5.status === 0 && !!ent && ent.blueprint === "merchant-v1" && !!ent.structure && !!ent.card);
  if (ent) {
    const cardAbs = path.join(pool, ent.card);
    const cardOk = fs.existsSync(cardAbs) && fs.readFileSync(cardAbs, "utf8").includes(ent.id);
    const matsOk = (ent.materials || []).length === 5 && ent.materials.every((m) => m.synthetic && fs.existsSync(path.join(pool, m.path)) && sha(fs.readFileSync(path.join(pool, m.path))) === m.sha256);
    const baseOk = fs.existsSync(path.join(HERE, "..", ent.base_card));
    ok("环入口消费 · 卡＋合成素材＋哈希＋基准卡", cardOk && matsOk && baseOk, `card=${cardOk} mats=${matsOk} base=${baseOk}`);
  }

  // ── 5. 扫描：净池 0 命中；注入 PII ⇒ 必红；还原 ⇒ 复绿（变异亲杀）──
  ok("扫描（净池）", run(["扫描"], pool).status === 0);
  const ep = path.join(pool, "条目", id0 + ".json");
  const backup = fs.readFileSync(ep, "utf8");
  const dirty = JSON.parse(backup); dirty.checkpoint.error_code = "E13800138000";
  fs.writeFileSync(ep, JSON.stringify(dirty, null, 2));
  ok("扫描（注入手机号 ⇒ 必红）", run(["扫描"], pool).status === 1);
  fs.writeFileSync(ep, backup);
  ok("扫描（还原 ⇒ 复绿）", run(["扫描"], pool).status === 0);

  // ── 6. 真池：零真件扫描 ＋ 在读条目消费核（只读）──
  const r6 = run(["扫描"], null);
  ok("真池扫描（零真件·含素材位）", r6.status === 0, (r6.stderr || "").split("\n")[0]);
  const r7 = run(["读池"], null);
  let real = null; try { real = JSON.parse(r7.stdout); } catch { /* 下面判 */ }
  ok("真池环入口（≥1 在用条目）", r7.status === 0 && !!real && real.entries.length >= 1, `在用 ${real ? real.entries.length : "?"} 条`);
  if (real && real.entries.length) {
    const good = real.entries.every((e) => fs.existsSync(path.join(HERE, e.card)) && (e.materials || []).every((m) => fs.existsSync(path.join(HERE, m.path))));
    ok("真池条目卡＋素材在件", good);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n自检 ${pass}/${pass + fail} 通过${fail ? "（有失败）" : " · 全绿"}`);
process.exit(fail ? 1 : 0);
