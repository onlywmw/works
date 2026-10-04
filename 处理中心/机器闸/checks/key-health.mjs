#!/usr/bin/env node
// SYS-25 key-health —— 凭证健康检查：key 死在巡检时，不死在验收链上。
//
// 输入件：处理中心\机器闸\checks\keys.local.json（gitignored 本地保密件）
//   格式契约：`_` 前缀或 updated_at/updated_by/... 为元字段（跳过）；
//   其余字段值「长得像凭证」（≥16 字符、无空白/无中文）即视为一把 key → 逐把探测。
//   当前实样只含 1 把（deepseek_key）；第二把入库即自动纳入，无需改码。
//
// 判定（三态，红线 3：不可达 ≠ key 死，必须区分报）：
//   VALID       HTTP 200        → 绿
//   INVALID     HTTP 401 / 403  → 红牌（key 失效）
//   HTTP_ERR    其它 HTTP 码    → 黄（端点异常，非 key 失效）
//   UNREACHABLE 网络/超时        → 黄（不可达，非 key 失效）
//
// SYS-171 跨件一致性（2026-10-03 假红事件后加）：`keys.local.json` 可带 `_sync` 元块（`{字段: "落点路径#变量名"}`）；
//   副本与落点**两处都探**：副本 401＋落点 200 ⇒「待同步（副本过期）」不发红；两处都失效 ⇒ 才发红；
//   两处 200 尾 4 位不一致 ⇒「待同步」（旋转中）；`_sync` 缺/落点缺 ⇒ 回退现行为（fail-open·保移植）。
//   工具**不写**任何保密件（同步只提示·人工）。
//
// 保密（红线 1）：输出只含「字段名 + HTTP 状态码」，绝不输出 key 本体（含掩码片段）。
//
// 用法（cwd 任意）：
//   node 处理中心\机器闸\checks\key-health.mjs              探测 + 报告（失效则投红牌）
//   node ... --keys <路径>                                  换输入件（自测/演练）
//   node ... --notify-to <角色>                             红牌收件人（默认 设计师）
//   node ... --from-role <角色>                             红牌发件人（默认 巡检台）
//   node ... --no-notify                                    只报不投（预检复用/自测）
//   node ... --quiet                                        只打末行结论
// 退出码：0=全绿 ｜ 1=有失效/不可达（巡检红） ｜ 2=输入件缺失或没找到可用 key（配置问题）
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..", ".."); // checks → 机器闸 → 处理中心 → 体系根
const DEFAULT_KEYS = path.join(HERE, "keys.local.json");
const POST_OFFICE = path.join(SYS, "处理中心", "邮局", "post-office.mjs");
const MAILBOX = path.join(SYS, "处理中心", "邮局", "邮箱");
const ENDPOINT = process.env.KEY_HEALTH_ENDPOINT || "https://api.deepseek.com/models";
const TIMEOUT_MS = Number(process.env.KEY_HEALTH_TIMEOUT_MS || 20000);
const RED_CARD_TAG = "[key-health]"; // 红牌 re 前缀：兼作未闭合红牌的销账标记（防重复投递）
const META = new Set(["_note", "updated_at", "updated_by", "updated_on", "note", "owner", "desc"]);

export function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) a[argv[i].slice(2)] = argv[i + 1]?.startsWith("--") ? "" : argv[++i] ?? "";
    else a._.push(argv[i]);
  }
  return a;
}

/** 元字段/非凭证值一律跳过——避免 updated_by 这类说明性字符串被误当 key 去探测（防假红）。 */
export const looksLikeKey = (v) => typeof v === "string" && v.length >= 16 && !/[\s一-龥]/.test(v);

export function readKeys(file) {
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return Object.entries(raw)
    .filter(([k, v]) => !k.startsWith("_") && !META.has(k) && looksLikeKey(v))
    .map(([name, key]) => ({ name, key }));
}

/** 单把探测：只回状态机结论，不回 key。 */
export async function probe(key) {
  try {
    const res = await fetch(ENDPOINT, {
      method: "GET",
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) return { state: "VALID", code: res.status };
    if (res.status === 401 || res.status === 403) return { state: "INVALID", code: res.status };
    return { state: "HTTP_ERR", code: res.status };
  } catch (e) {
    const timedOut = e?.name === "TimeoutError" || e?.name === "AbortError";
    return { state: "UNREACHABLE", code: null, why: timedOut ? `超时(>${TIMEOUT_MS}ms)` : "连接失败" };
  }
}

/** 逐把探测（并发）。返回 [{name, state, code, why}]，顺序与入参一致。
 *  2026-10-02（轮6 处置·巡检台收编）：UNREACHABLE 单次重试（间隔 1.5s）——治瞬时网络抖动假红（当日 19:34 记分误红先例）；
 *  持久不可达仍照报（不降阈）。 */
export async function probeAll(keys) {
  const first = await Promise.all(keys.map((k) => probe(k.key)));
  const retryIdx = first.map((r, i) => (r.state === "UNREACHABLE" ? i : -1)).filter((i) => i >= 0);
  if (retryIdx.length) {
    await new Promise((r) => setTimeout(r, 1500));
    const again = await Promise.all(retryIdx.map((i) => probe(keys[i].key)));
    retryIdx.forEach((i, j) => { if (again[j].state !== "UNREACHABLE") first[i] = again[j]; });
  }
  return keys.map((k, i) => ({ name: k.name, ...first[i] }));
}

export const LABEL = {
  VALID: "有效",
  INVALID: "失效（key 死，须换新）",
  HTTP_ERR: "端点异常（非 key 失效）",
  UNREACHABLE: "不可达（网络/超时，非 key 失效）",
};

// ==================== SYS-171：跨件一致性（`_sync` 元块·待同步 ≠ 红牌・防假红） ====================
// 背景：2026-10-03 假红事件——副本（本件）存旧值探到 401 ⇒ 投「请换新」红牌，而落点（真身）200 有效。
// 口径（巡检台给定・形 A 四点）：①副本 401＋落点 200 ⇒ 报「待同步（副本过期）」不发红；
// ②两处都失效 ⇒ 才发红；③两处 200 但尾 4 位不同 ⇒ 「待同步」（旋转中）；
// ④ `_sync` 缺／落点文件或变量缺 ⇒ 回退现行为（fail-open・保移植环境）。
// 纪律：工具**不写**任何保密件（同步只提示·人工）；输出只含字段名/状态码/尾 4 位。

/** 解析 `_sync` 元块：`{ 字段名: "落点路径#变量名" }`（`_` 前缀——现值探测已跳过，不影响键值契约）。 */
export function readSyncSpecs(file) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
    const block = raw && typeof raw._sync === "object" && raw._sync ? raw._sync : {};
    const out = {};
    for (const [name, spec] of Object.entries(block)) {
      if (typeof spec !== "string") continue;
      const i = spec.lastIndexOf("#");
      if (i <= 0 || i >= spec.length - 1) continue;
      out[name] = { file: spec.slice(0, i), varName: spec.slice(i + 1), spec };
    }
    return out;
  } catch {
    return {};
  }
}

/** 从落点文件读变量值（env 形态 `VAR=VALUE`；文件/变量缺 ⇒ null —— 回退现行为·fail-open）。 */
export function readSyncKey(spec, sysRoot = SYS) {
  if (!spec) return null;
  try {
    const p = path.isAbsolute(spec.file) ? spec.file : path.join(sysRoot, spec.file);
    if (!fs.existsSync(p)) return null;
    const text = fs.readFileSync(p, "utf-8");
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      if (line.slice(0, eq).trim() !== spec.varName) continue;
      const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      return v || null;
    }
    return null;
  } catch {
    return null;
  }
}

/** 尾 4 位（对外可见的最大粒度；绝不出全文）。 */
const tail4 = (v) => (typeof v === "string" && v.length >= 4 ? v.slice(-4) : null);

/**
 * SYS-171 判定：副本探测结果 ＋ 落点探测结果 → 结论。
 * @param syncResolved 落点是否真实解析到值（false = `_sync` 缺/落点文件或变量缺 ⇒ 回退现行为）
 * @returns { name, copy, sync, verdict, notice, tail }
 *   verdict ∈ VALID ｜ INVALID（真失效·红牌）｜ NOTICE（待同步/人工核·不红）｜ 副本异常态（HTTP_ERR/UNREACHABLE·按现行为）
 */
export function classifyKey(name, copyR, copyKey, syncR, syncKey) {
  if (!syncR || !syncKey) {
    // ④ 回退现行为：只看副本（INVALID ⇒ 红）
    return { name, copy: copyR.state, sync: null, verdict: copyR.state, notice: null, tail: tail4(copyKey) };
  }
  const c = copyR.state;
  const s = syncR.state;
  if (c === "VALID" && s === "VALID") {
    const same = tail4(copyKey) === tail4(syncKey);
    return {
      name, copy: c, sync: s, verdict: "VALID", tail: tail4(copyKey),
      notice: same ? null : "待同步（旋转中：两处均有效·尾 4 位不一致）——不发红牌",
    };
  }
  if (c === "INVALID" && s === "VALID") {
    // ① 本次假红根源场景：副本过期不报红
    return { name, copy: c, sync: s, verdict: "NOTICE", tail: tail4(syncKey), notice: "待同步（副本过期：副本失效·落点有效）——不发红牌" };
  }
  if (c === "INVALID" && s === "INVALID") {
    // ② 真失效：两处都死 ⇒ 红牌
    return { name, copy: c, sync: s, verdict: "INVALID", tail: tail4(copyKey), notice: null };
  }
  if (c === "INVALID") {
    // 副本失效但落点无法确认（异常/不可达）⇒ 不直接判死（防假红），告警待人
    return { name, copy: c, sync: s, verdict: "NOTICE", tail: null, notice: "副本失效但落点未验证（" + LABEL[s] + "）——请复跑/人工核" };
  }
  if (c === "VALID") {
    return { name, copy: c, sync: s, verdict: "VALID", tail: tail4(copyKey), notice: "落点未验证（" + LABEL[s] + "）——请人工核" };
  }
  // 副本自身异常（HTTP_ERR/UNREACHABLE）⇒ 按现行为（异常/不可达）报，不涉红牌
  return { name, copy: c, sync: s, verdict: c, tail: null, notice: "落点未验证（" + LABEL[s] + "）" };
}

/** 未闭红牌检测：目标信箱里已有 [key-health] 抬头的未读信 = 同一失效状态已通报，不重复投。 */
function hasOpenRedCard(target) {
  const dir = path.join(MAILBOX, target, "INBOX");
  if (!fs.existsSync(dir)) return false;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(dir, f), "utf-8");
    const re = (raw.match(/^re:\s*(.*)$/m) || [])[1] || "";
    const st = (raw.match(/^status:\s*(.*)$/m) || [])[1] || "";
    if (re.trim().startsWith(RED_CARD_TAG) && st.trim() === "未读") return true;
  }
  return false;
}

function sendRedCard({ target, fromRole, bad, keysFile }) {
  if (hasOpenRedCard(target)) {
    console.log(`   ↳ ${target} 信箱已有未闭合的 ${RED_CARD_TAG} 红牌——本次不重复投递（销账后如仍失效会再投）`);
    return;
  }
  const names = bad.map((b) => b.name).join("、");
  const codes = bad.map((b) => `${b.name}=${b.code ?? b.state}`).join("；");
  const body = [
    "key-health 巡检红牌（机器自动投递）。",
    "",
    `失效字段：${names}`,
    `状态码：${codes}`,
    "",
    "换新指引：",
    "  1) 把新 key 写进 处理中心\\机器闸\\checks\\keys.local.json 的对应字段（该文件 gitignored，key 本体只许落这里）；",
    "  2) 本机复跑验证：node 处理中心\\机器闸\\checks\\key-health.mjs ；",
    "  3) App 侧同步：设置 → AI 模型 → 对应卡 API Key 粘贴保存（或 debug 包 adb push mov-debug-config.json）。",
    "",
    `复现：node "${path.join(HERE, "key-health.mjs")}" --keys "${keysFile}"`,
    "本信为未闭合红牌：同一失效状态不重复投递；销账后如仍失效会再投。信内不含 key 本体（只报状态码）。",
  ].join("\n");
  try {
    // 2026-10-03（巡检台轮3 修）：内联 --body 已停用（邮局 fail-closed 政策）——改 --body-file；
    // 旧写法致红牌投递静默失败（仅 console 一行，无人知）＝安全网哑火。
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "key-health-"));
    const tmpBody = path.join(tmpDir, "body.txt");
    fs.writeFileSync(tmpBody, body, "utf-8");
    const outText = execFileSync(
      process.execPath,
      [POST_OFFICE, "send", "--from", fromRole, "--to", target, "--type", "通知",
        "--re", `${RED_CARD_TAG} 凭证失效红牌：${names}（${codes}）——请换新后重跑`,
        "--body-file", tmpBody],
      { encoding: "utf-8", windowsHide: true, cwd: SYS, env: { ...process.env, POST_ROLE: fromRole } },
    );
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    console.log(outText.trim().split("\n").map((l) => "   " + l).join("\n"));
  } catch (e) {
    console.log(`   ❌ 红牌投递失败：${String(e.message).slice(0, 200)}（报告仍有效，请人工通报）`);
  }
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const keysFile = path.resolve(a.keys || DEFAULT_KEYS);
  const target = a["notify-to"] || "设计师";
  const fromRole = a["from-role"] || "巡检台";
  const quiet = "--quiet" in a || a.quiet === "";
  const noNotify = "--no-notify" in a || a["no-notify"] === "";

  if (!fs.existsSync(keysFile)) {
    console.log(`❌ KEY HEALTH FAIL —— 输入件不存在：${keysFile}`);
    console.log(`   补法：建该文件（gitignored 本地保密件），至少含一个 key 字段，如 {"deepseek_key": "sk-..."}`);
    process.exit(2);
  }
  let keys;
  try {
    keys = readKeys(keysFile);
  } catch (e) {
    console.log(`❌ KEY HEALTH FAIL —— 输入件读不出（JSON 坏了？）：${String(e.message).slice(0, 160)}`);
    process.exit(2);
  }
  if (!keys.length) {
    console.log(`❌ KEY HEALTH FAIL —— ${path.basename(keysFile)} 里没找到疑似凭证字段（≥16 字符、无空白/中文）`);
    process.exit(2);
  }

  // SYS-171：`_sync` 落点（解析失败/缺失 ⇒ 回退现行为·fail-open）
  const syncSpecs = readSyncSpecs(keysFile);
  const syncKeys = new Map(); // name -> { spec, key|null }
  for (const k of keys) {
    const spec = syncSpecs[k.name] || null;
    syncKeys.set(k.name, { spec, key: readSyncKey(spec) });
  }

  if (!quiet) {
    console.log(`key-health 凭证健康巡检 @${new Date().toLocaleString("sv-SE")}`);
    console.log(`  输入件：${keysFile}`);
    console.log(`  端点：${ENDPOINT}（超时 ${TIMEOUT_MS}ms）｜共 ${keys.length} 把`);
    console.log(`  保密：只报字段名 + 状态码 + 尾 4 位，不含 key 本体`);
    console.log(`  跨件（SYS-171）：_sync 落点解析 ${[...syncKeys.values()].filter((s) => s.key).length}/${keys.length} 把（缺 ⇒ 回退现行为）`);
  }
  // 两处都探：副本（本件）＋ 落点（`_sync`）——副本 401/落点 200 ⇒「待同步」不发红（SYS-171）
  const copyResults = await probeAll(keys);
  const copyByName = new Map(copyResults.map((r) => [r.name, r]));
  const withSync = keys.filter((k) => syncKeys.get(k.name).key);
  const syncResults = withSync.length
    ? await probeAll(withSync.map((k) => ({ name: k.name, key: syncKeys.get(k.name).key })))
    : [];
  const syncByName = new Map(syncResults.map((r) => [r.name, r]));

  const verdicts = keys.map((k) => {
    const s = syncKeys.get(k.name);
    return classifyKey(k.name, copyByName.get(k.name), k.key, s.key ? syncByName.get(k.name) : null, s.key);
  });

  for (const v of verdicts) {
    const cr = copyByName.get(v.name);
    const sr = v.sync ? syncByName.get(v.name) : null;
    const detail = [`副本 ${v.copy}${cr && cr.code != null ? " " + cr.code : ""}${cr && cr.why ? `（${cr.why}）` : ""}`];
    if (v.sync) detail.push(`落点 ${v.sync}${sr && sr.code != null ? " " + sr.code : ""}${sr && sr.why ? `（${sr.why}）` : ""}`);
    if (v.tail) detail.push(`尾 ${v.tail}`);
    const icon = v.verdict === "VALID" ? (v.notice ? "⏳" : "✅")
      : v.verdict === "INVALID" ? "❌"
      : v.verdict === "NOTICE" ? "⏳" : "⚠️";
    console.log(`  ${icon} ${v.name} → ${detail.join("｜")}${v.notice ? ` ⇒ ${v.notice}` : ""}`);
  }

  const valid = verdicts.filter((v) => v.verdict === "VALID");
  const invalid = verdicts.filter((v) => v.verdict === "INVALID");
  const notice = verdicts.filter((v) => v.notice);                        // 待同步/人工核（含 VALID+notice 的旋转中）
  const other = verdicts.filter((v) => !["VALID", "INVALID", "NOTICE"].includes(v.verdict));

  if (!invalid.length && !other.length) {
    if (notice.length) {
      console.log(`KEY HEALTH PASS（${valid.length}/${verdicts.length} 把有效；待同步 ${notice.length}——待同步 ≠ 红牌·SYS-171）`);
      for (const v of notice) console.log(`  ⏳ ${v.name}：${v.notice ?? "见上行读数"}`);
    } else {
      console.log(`KEY HEALTH PASS（${valid.length}/${verdicts.length} 把有效）`);
    }
    process.exit(0);
  }
  console.log(`KEY HEALTH FAIL（有效 ${valid.length}/${verdicts.length}；失效 ${invalid.length}${notice.length ? `；待同步 ${notice.length}` : ""}；异常/不可达 ${other.length}）`);
  if (notice.length) {
    for (const v of notice) console.log(`  待同步（不发红牌）：${v.name} —— ${v.notice ?? "见上行读数"}`);
  }
  if (invalid.length && !noNotify) {
    console.log(`  红牌投递 → ${target}：`);
    sendRedCard({
      target, fromRole, keysFile,
      bad: invalid.map((v) => ({ name: v.name, code: copyByName.get(v.name)?.code ?? null })),
    });
  } else if (invalid.length) {
    console.log(`  （--no-notify：跳过红牌投递）`);
  }
  if (other.length) {
    console.log(`  注：异常/不可达不算 key 失效（红线 3）——先查网络/端点，别急换 key。`);
  }
  process.exit(1);
}

const selfPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === path.resolve(selfPath).toLowerCase()) {
  main();
}
