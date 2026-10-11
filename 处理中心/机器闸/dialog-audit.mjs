#!/usr/bin/env node
// UPG-589 对话动作闸 · dialog-audit.mjs —— 弹窗/确认调用准入静态审计（产品仓**只读**）
//
// 口径（change=conversation-action-protocol · spec app-action-lexicon / design D5）：
//   ① 未登记调用 U：产品仓弹窗/确认调用点 − 词典台账已登记点（Web）／弹窗用件 − 已登记件（原生）
//   ② 危险色裸 hex H：弹窗调用块内的字面色值（Web `#hex`／原生 `0x…`·`Color.parseColor`）——
//      「常量」与「没有」不计（设计稿 v3：危险红 3 种写法——常量／裸写 hex／没有，本闸只查裸写）
//   ③ 回合特判 T：为单个动作写回合分支（确认态变量×动作词字面量；弹窗块内再弹窗＝二次确认特判）
//   基线只减不增：U>0、H/T 超基线、存量存活数超基线 ⇒ rc=1（巡检出声）
//   单一真源＝`设计师/卡片库/台账/动作词典台账.json`（登记表＋站点表；MD 视图由本工具 --dict-md 渲染）
//
// 用法：
//   node 处理中心/机器闸/dialog-audit.mjs                 # 一行摘要（读数＋基线差）
//   node 处理中心/机器闸/dialog-audit.mjs --list          # 加三类清单（逐件）
//   node 处理中心/机器闸/dialog-audit.mjs --json          # 机读全量（含清单/基线差）
//   node 处理中心/机器闸/dialog-audit.mjs --repo <dir>    # 产品仓根（缺省＝lib/root.mjs PRODUCT·测试隔离树用）
//   node 处理中心/机器闸/dialog-audit.mjs --dict <file>   # 词典台账 JSON（缺省＝设计师/卡片库/台账/动作词典台账.json）
//   node 处理中心/机器闸/dialog-audit.mjs --dict-md       # 由台账 JSON 渲染 MD 视图（stdout）
//   node 处理中心/机器闸/dialog-audit.mjs --suggest-baseline  # 打印当前读数对应的基线常量文本（人工改基线用）
//   node 处理中心/机器闸/dialog-audit.mjs --self-test     # 自测（注入样本⇒红／幂等／分类），rc 0/1
// 退出码：0=正常（U=0 且 H/T/存量 ≤ 基线）｜1=超基线 ｜2=用法/环境错（树/台账不完整）
// 幂等：同树两跑同值（输出无时间戳）；只读产品仓与台账（零写入）。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PRODUCT, SYS } from "./lib/root.mjs";

// ── 基线常量（2026-10-08 首跑＝盘点口径 0027-mov@65dbed90；改基线＝改常量＋注记）──
const BASELINE = {
  webSites: 15, // UPG-591 新登记 1（库面删除确认·wave0 非存量）——常量随登记增；存量只减不增口径不变
  nativeFiles: 12,
  rawHex: 1,
  turnSpecial: 2,
  legacyAlive: 23, // 口径修正（UPG-591）：存量＝wave≥1 登记项在场数（web 14＋原生 wave≥1 九件）——wave0（审批/基建/新登记）不计存量
  note: "首跑盘点 2026-10-08（Web 14 调用点｜原生 12 件｜裸hex 1｜回合特判 2｜存量存活 23＝wave≥1 面）＋UPG-591 新登记 1 站（webSites 15·wave0 不计存量）；存量只减不增；收编后经 --suggest-baseline 更新",
};

// ── 扫描面 ──
const WEB_ROOTS = ["前端设计/mov-vue/src", "tools/ms-md-server/page/src"];
const NATIVE_ROOTS = ["app/src/main/java", "app/src/main/kotlin"];
// 原生排除（非弹窗族·逐条具名理由；口径同弹层清单「排除项」）
const NATIVE_EXEMPT = [
  { file: "app/src/main/java/com/mov/android/PrivacyGateActivity.kt", reason: "整页 Activity（非弹层）" },
  { file: "app/src/main/java/com/mov/android/MarketReviewActivity.kt", reason: "整页 Activity（非弹层）" },
  { file: "app/src/main/java/com/mov/android/scan/ScanActivity.kt", reason: "整页 Activity（非弹层）" },
];
// Web 扫描形态（调用点＝单位）；tag 与 API 两类
const WEB_FORMS = [
  { form: "van-dialog", re: /<van-dialog\b[^>]*>/g },
  { form: "showConfirmDialog", re: /showConfirmDialog\s*\(/g },
  { form: "showDialog", re: /showDialog\s*\(/g },
  { form: "window.confirm", re: /window\.confirm\s*\(/g },
];
// 回合特判：确认态变量×动作词（T1）——为单动作写回合分支的机械特征
const TURN_VAR_RE = /\b(armed|confirmStep|confirmStage|confirmPhase|pendingConfirm|doubleConfirm|reConfirm)\b[^\n]*?(===|==|!==|!=)\s*['"](删除|取消|清空|移除|拒绝|解绑|退出|delete|cancel|clear|remove|reject|logout)['"]/g;

const argv = process.argv.slice(2);
const argOf = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : dflt; };
const flag = (name) => argv.includes(name);
const REPO = path.resolve(argOf("--repo", PRODUCT));
const DICT_PATH = path.resolve(argOf("--dict", path.join(SYS, "设计师/卡片库/台账/动作词典台账.json")));
const JSON_OUT = flag("--json");
const LIST = flag("--list") || JSON_OUT;
const die = (msg) => { console.error(msg); process.exit(2); };
const isComment = (line) => { const t = line.trim(); return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*"); };

/* ── 遍历 ── */
function walk(dir, out = []) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (e.name === "node_modules" || e.name === "dist" || e.name === "build" || e.name === ".git") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const relOf = (p) => path.relative(REPO, p).split(path.sep).join("/");

/* ── Web 调用点抽取 ── */
function anchorOf(text, idx, form) {
  const seg = text.slice(idx, idx + 500);
  if (form === "van-dialog") {
    const m = seg.match(/v-model:show\s*=\s*"([^"]+)"/);
    if (m) return m[1];
  }
  const t = seg.match(/\bt\(\s*'([^']+)'/);
  if (t) return t[1];
  const before = text.slice(Math.max(0, idx - 600), idx);
  const fns = [...before.matchAll(/(?:function|const)\s+([A-Za-z_$][\w$]*)\s*[=(]/g)];
  return fns.length ? fns[fns.length - 1][1] : "(未锚定)";
}
/** 取调用块（tag 到 </van-dialog>；API 到配平右括号）——裸 hex / 嵌套弹窗判定的作用域。 */
function blockOf(text, idx, form) {
  if (form === "van-dialog") {
    const end = text.indexOf("</van-dialog>", idx);
    if (end >= 0) return text.slice(idx, end);
    const gt = text.indexOf(">", idx);
    return text.slice(idx, gt >= 0 ? gt + 1 : idx + 200); // 自闭合：取到开标签末尾（不越界到后续调用）
  }
  let depth = 0, i = text.indexOf("(", idx);
  if (i < 0) return text.slice(idx, idx + 200);
  for (; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(") depth++;
    else if (ch === ")") { depth--; if (depth === 0) break; }
  }
  return text.slice(idx, i + 1);
}
function scanWeb() {
  const sites = [], rawHex = [], turnSpecial = [];
  for (const root of WEB_ROOTS) {
    for (const f of walk(path.join(REPO, root))) {
      if (!/\.(vue|js|ts|mjs)$/.test(f)) continue;
      const src = fs.readFileSync(f, "utf8");
      const rel = relOf(f);
      for (const { form, re } of WEB_FORMS) {
        for (const m of src.matchAll(re)) {
          const line = src.slice(0, m.index).split("\n").length;
          sites.push({ file: rel, line, form, anchor: anchorOf(src, m.index, form) });
          const block = blockOf(src, m.index, form);
          for (const h of block.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
            rawHex.push({ file: rel, line, form, hex: h[0], inDialogBlock: true });
          }
          // T2：弹窗块内再弹窗（二次确认特判）
          const inner = block.slice(block.indexOf(form === "van-dialog" ? ">" : "(") + 1);
          if (WEB_FORMS.some((x) => x.form !== form && inner.includes(x.form === "van-dialog" ? "<van-dialog" : `${x.form}(`))) {
            turnSpecial.push({ file: rel, line, kind: "nested-dialog", form });
          }
        }
      }
      for (const m of src.matchAll(TURN_VAR_RE)) {
        if (isComment(m[0])) continue;
        turnSpecial.push({ file: rel, line: src.slice(0, m.index).split("\n").length, kind: "action-keyed-turn", form: m[1] });
      }
    }
  }
  return { sites, rawHex, turnSpecial };
}

/* ── 原生件抽取 ── */
function scanNative() {
  const files = [];
  for (const root of NATIVE_ROOTS) {
    for (const f of walk(path.join(REPO, root))) {
      if (!/\.(kt|java)$/.test(f)) continue;
      const src = fs.readFileSync(f, "utf8");
      if (!/AlertDialog|\bDialog\b/.test(src)) continue;
      const rel = relOf(f);
      if (NATIVE_EXEMPT.some((x) => x.file === rel)) continue;
      const builderLines = [];
      src.split("\n").forEach((l, i) => {
        if (isComment(l) || /^\s*import\b/.test(l)) return;
        if (/AlertDialog\.Builder\s*\(|android\.app\.Dialog\b|(?<!Alert)\bDialog\s*\(/.test(l)) builderLines.push(i + 1);
      });
      files.push({ file: rel, sites: builderLines.length, sitesLines: builderLines });
      // ② 原生裸 hex（builder 邻近 15 行内）
      for (const ln of builderLines) {
        const seg = src.split("\n").slice(ln - 1, ln + 15).join("\n");
        for (const h of seg.matchAll(/0x[0-9a-fA-F]{6,8}|Color\.parseColor\s*\(\s*"#([0-9a-fA-F]{3,8})"/g)) {
          files[files.length - 1].rawHex = files[files.length - 1].rawHex || [];
          files[files.length - 1].rawHex.push({ line: ln, hex: h[0] });
        }
      }
    }
  }
  return files;
}

/* ── 台账合规校验（全列无空／D1 必填理由／D3 必填撤销路径／回合结构可推导） ── */
function validateDict(dict) {
  const problems = [];
  const tiers = dict.meta?.tiers || {};
  const fams = new Set(dict.meta?.families || []);
  const ids = new Set();
  for (const [i, a] of (dict.actions || []).entries()) {
    const at = `actions[${i}](${a.id || "?"})`;
    for (const k of ["id", "word", "object", "tier", "channel", "family"]) if (!a[k]) problems.push(`${at} 缺 ${k}`);
    if (!tiers[a.tier]) problems.push(`${at} 档位未知：${a.tier}`);
    else if (a.turn !== tiers[a.tier].turn) problems.push(`${at} 回合结构≠由档位推导（${a.turn} ≠ ${tiers[a.tier].turn}）`);
    if (a.tier === "D1" && !a.no_undo_reason) problems.push(`${at} D1 缺不可撤销理由`);
    if (a.tier === "D3" && !a.undo) problems.push(`${at} D3 缺撤销路径`);
    if (a.family && !fams.has(a.family)) problems.push(`${at} 族未登记：${a.family}`);
    if (![0, 1, 2].includes(a.wave)) problems.push(`${at} 波次非法：${a.wave}`);
    if (a.id) ids.add(a.id);
  }
  for (const side of ["web", "native"]) for (const s of dict.sites?.[side] || []) {
    if (!s.action || s.action === "—（基建件）") continue;
    for (const one of String(s.action).split(/\s*\/\s*/)) if (!ids.has(one)) problems.push(`sites.${side}(${s.id || s.file}) 指向未登记动作：${one}`);
  }
  return problems;
}

/* ── 台账读取与登记匹配 ── */
function loadDict() {
  if (!fs.existsSync(DICT_PATH)) die(`❌ 缺词典台账：${DICT_PATH}（先落 设计师/卡片库/台账/动作词典台账.json）`);
  try { return JSON.parse(fs.readFileSync(DICT_PATH, "utf8")); } catch (e) { die(`❌ 台账 JSON 解析失败：${e.message}`); }
}
const siteKey = (s) => `${s.file}|${s.form}|${s.anchor}`;

function audit() {
  const dict = loadDict();
  const web = scanWeb();
  const native = scanNative();
  const regWeb = new Set((dict.sites?.web || []).map(siteKey));
  const regNative = new Set((dict.sites?.native || []).map((s) => s.file));
  // 存量存活＝**登记为存量（wave≥1）且现树在场**的点——新登记（wave0）不计存量（UPG-591 口径修正）
  const legacyWeb = new Set((dict.sites?.web || []).filter((s) => (s.wave ?? 0) >= 1).map(siteKey));
  const legacyNative = new Set((dict.sites?.native || []).filter((s) => (s.wave ?? 0) >= 1).map((s) => s.file));
  const webUnreg = web.sites.filter((s) => !regWeb.has(siteKey(s)));
  const nativeUnreg = native.filter((s) => !regNative.has(s.file));
  const aliveWeb = web.sites.filter((s) => regWeb.has(siteKey(s)));
  const aliveNative = native.filter((s) => regNative.has(s.file));
  const rawHex = [...web.rawHex, ...native.flatMap((f) => (f.rawHex || []).map((h) => ({ file: f.file, ...h })))];
  const turnSpecial = web.turnSpecial;
  const legacyAlive = web.sites.filter((s) => legacyWeb.has(siteKey(s))).length + native.filter((s) => legacyNative.has(s.file)).length;
  const result = {
    repo: REPO.split(path.sep).join("/"),
    dict: relOf(DICT_PATH) || DICT_PATH,
    read: {
      webSites: web.sites.length,
      nativeFiles: native.length,
      unregistered: webUnreg.length + nativeUnreg.length,
      rawHex: rawHex.length,
      turnSpecial: turnSpecial.length,
      legacyAlive,
    },
    baseline: BASELINE,
    delta: {
      unregistered: webUnreg.length + nativeUnreg.length,
      rawHex: rawHex.length - BASELINE.rawHex,
      turnSpecial: turnSpecial.length - BASELINE.turnSpecial,
      legacyAlive: legacyAlive - BASELINE.legacyAlive,
    },
    lists: { webUnreg, nativeUnreg, rawHex, turnSpecial, webSites: web.sites, nativeFiles: native },
  };
  const over = result.read.unregistered > 0 || result.delta.rawHex > 0 || result.delta.turnSpecial > 0 || result.delta.legacyAlive > 0;
  return { result, over };
}

/* ── 输出 ── */
function printSummary(r) {
  console.log(
    `对话动作闸：Web 调用点 ${r.read.webSites} ｜ 原生件 ${r.read.nativeFiles} ｜ 未登记 ${r.read.unregistered} ｜ 裸hex ${r.read.rawHex} ｜ 回合特判 ${r.read.turnSpecial} ｜ 存量存活 ${r.read.legacyAlive} ｜ 基线差 未登记 +${r.delta.unregistered}·裸hex ${r.delta.rawHex >= 0 ? "+" : ""}${r.delta.rawHex}·特判 ${r.delta.turnSpecial >= 0 ? "+" : ""}${r.delta.turnSpecial}·存量 ${r.delta.legacyAlive >= 0 ? "+" : ""}${r.delta.legacyAlive}`
  );
}
function printLists(r) {
  const row = (o) => `  - ${o.file}:${o.line ?? "—"} ${o.form || ""} ${o.anchor || o.hex || o.kind || ""}`.trimEnd();
  for (const [name, list] of [["未登记（Web）", r.lists.webUnreg], ["未登记（原生件）", r.lists.nativeUnreg], ["裸 hex", r.lists.rawHex], ["回合特判", r.lists.turnSpecial]]) {
    console.log(`【${name}】：${list.length ? "" : "（无）"}`);
    for (const o of list.slice(0, 60)) console.log(row(o));
  }
}
function renderMd(dict) {
  const L = [];
  L.push(`# 动作词典台账（v1 镜像 · 单一真源＝\`动作词典台账.json\`）`);
  L.push("");
  L.push(`> 渲染件：\`node 处理中心/机器闸/dialog-audit.mjs --dict-md\`（**禁手改**；改行＝改 JSON）。`);
  L.push(`> 依据：change=conversation-action-protocol（对话即操作协议 v1／弹窗体系 v3）＋产品仓调用点机械扫描（${dict.meta?.scanned || ""}）。`);
  if (dict.meta?.turn_discipline) L.push(`> ${dict.meta.turn_discipline}`);
  if (dict.meta?.gate_note) L.push(`> 准入：${dict.meta.gate_note}`);
  if (dict.meta?.reconcile) L.push(`> 口径差登记：${dict.meta.reconcile}`);
  L.push("");
  L.push(`## 档位与回合结构（由档位机械派生·禁特判）`);
  L.push("");
  L.push(`| 档位 | 含义 | 回合结构 | 确认 |`);
  L.push(`|---|---|---|---|`);
  for (const [k, v] of Object.entries(dict.meta?.tiers || {})) L.push(`| ${k} | ${v.meaning} | ${v.turn} | ${v.confirm} |`);
  L.push("");
  L.push(`## 动作表（全量 v1）`);
  L.push("");
  L.push(`| 词 | 对象 | 档位 | 回合结构 | 撤销路径 | 不可撤销理由 | 主通道 | 族 | 波次 | 调用点 |`);
  L.push(`|---|---|---|---|---|---|---|---|---|---|`);
  for (const a of dict.actions || []) {
    const sites = (a.sites || []).join("；") || "—";
    L.push(`| ${a.word} | ${a.object} | ${a.tier} | ${a.turn} | ${a.undo || "—"} | ${a.no_undo_reason || "—"} | ${a.channel} | ${a.family} | ${a.wave === 0 ? "新" : a.wave} | ${sites} |`);
  }
  L.push("");
  L.push(`## 登记站点（准入闸对照面）`);
  L.push("");
  L.push(`| 侧 | 件 | 形态 | 锚 | 动作 | 族 | 波次 |`);
  L.push(`|---|---|---|---|---|---|---|`);
  for (const s of dict.sites?.web || []) L.push(`| web | ${s.file} | ${s.form} | ${s.anchor} | ${s.action} | ${s.family} | ${s.wave} |`);
  for (const s of dict.sites?.native || []) L.push(`| native | ${s.file} | 弹窗用件 | ${s.anchor} | ${s.action} | ${s.family} | ${s.wave} |`);
  L.push("");
  return L.join("\n") + "\n";
}

/* ── 自测（fixture：注入样本⇒红·幂等·分类） ── */
function selfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dialog-audit-"));
  const fail = [];
  const ok = (name, cond, detail = "") => { console.log(`${cond ? "  ✓" : "  ✗"} ${name}${detail ? "  " + detail : ""}`); if (!cond) fail.push(name); };
  const mk = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, "utf8"); };
  const repoA = path.join(tmp, "repo-a");
  mk(path.join(repoA, "前端设计/mov-vue/src/components/A.vue"), `<template>\n  <van-dialog v-model:show="aShow" />\n</template>\n<script setup>\nshowConfirmDialog({ title: t('a.title') })\n</script>\n`);
  mk(path.join(repoA, "app/src/main/java/com/mov/android/ATool.kt"), `import android.app.AlertDialog\nfun f() { AlertDialog.Builder(this).setTitle("x").show() }\n`);
  mk(path.join(repoA, "app/src/main/java/com/mov/android/PrivacyGateActivity.kt"), `import android.app.AlertDialog\nfun f() { AlertDialog.Builder(this).show() }\n`);
  const dictA = path.join(tmp, "dict-a.json");
  mk(dictA, JSON.stringify({
    meta: { tiers: { D3: { meaning: "直执＋撤销", turn: "单回合（复述随结果帧）", confirm: "不需要" } }, families: ["内容族"], scanned: "fixture" },
    actions: [{ id: "x", word: "测试", object: "件", tier: "D3", turn: "单回合（复述随结果帧）", undo: "—（fixture）", channel: "按钮·快捷键", family: "内容族", wave: 1 }],
    sites: {
      web: [{ file: "前端设计/mov-vue/src/components/A.vue", form: "van-dialog", anchor: "aShow", action: "x", family: "内容族", wave: 1 },
        { file: "前端设计/mov-vue/src/components/A.vue", form: "showConfirmDialog", anchor: "a.title", action: "x", family: "内容族", wave: 1 }],
      native: [{ file: "app/src/main/java/com/mov/android/ATool.kt", anchor: "ATool", action: "x", family: "内容族", wave: 1 }],
    },
  }, null, 2));
  const run = (repo, dict) => {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--json", "--repo", repo, "--dict", dict], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, windowsHide: true });
    return { rc: r.status, out: r.stdout || "", err: r.stderr || "" };
  };
  // ① 全登记 ⇒ rc0；原生豁免生效（整页 Activity 不计）
  const r1 = run(repoA, dictA);
  const j1 = r1.rc === 0 ? JSON.parse(r1.out) : null;
  ok("全登记树 ⇒ rc0", r1.rc === 0, `rc=${r1.rc}`);
  ok("读数：Web 2／原生 1（整页 Activity 已豁免）", j1 && j1.read.webSites === 2 && j1.read.nativeFiles === 1, j1 ? `web=${j1.read.webSites} native=${j1.read.nativeFiles}` : r1.err.slice(0, 120));
  // ② 幂等：两跑同值
  const r2 = run(repoA, dictA);
  ok("幂等：两跑 JSON 同值", r2.out === r1.out);
  // ③ 注入 1 条未登记样本 ⇒ rc≠0 且清单含它
  mk(path.join(repoA, "前端设计/mov-vue/src/components/INJ.vue"), `<script setup>\nshowConfirmDialog({ title: t('inj.title') })\n</script>\n`);
  const r3 = run(repoA, dictA);
  const j3 = r3.rc === 1 ? JSON.parse(r3.out) : null;
  ok("注入未登记 ⇒ rc1", r3.rc === 1, `rc=${r3.rc}`);
  ok("未登记清单含样本", j3 && j3.lists.webUnreg.some((s) => s.file.endsWith("INJ.vue")), j3 ? JSON.stringify(j3.lists.webUnreg) : r3.err.slice(0, 160));
  // ④ 裸 hex 注入 ⇒ 计数上升
  mk(path.join(repoA, "前端设计/mov-vue/src/components/HEX.vue"), `<script setup>\nshowConfirmDialog({ title: t('h.title'), confirmButtonColor: '#ff0000' })\n</script>\n`);
  const r4 = run(repoA, dictA);
  const j4 = r4.rc === 1 ? JSON.parse(r4.out) : null;
  ok("裸 hex 计入（1）", j4 && j4.read.rawHex === 1, j4 ? `rawHex=${j4.read.rawHex}` : r4.err.slice(0, 120));
  // ⑤ 回合特判注入 ⇒ 计数上升
  mk(path.join(repoA, "前端设计/mov-vue/src/components/TURN.vue"), `<script setup>\nif (armed === 'delete') { showConfirmDialog({ title: t('t.title') }) }\n</script>\n`);
  const r5 = run(repoA, dictA);
  const j5 = r5.rc === 1 ? JSON.parse(r5.out) : null;
  ok("回合特判计入（1）", j5 && j5.read.turnSpecial === 1, j5 ? `turnSpecial=${j5.read.turnSpecial}` : r5.err.slice(0, 120));
  // ⑥ 台账缺失 ⇒ rc2
  const r6 = run(repoA, path.join(tmp, "missing.json"));
  ok("台账缺失 ⇒ rc2", r6.rc === 2, `rc=${r6.rc}`);
  // ⑦ 台账不合规（D1 缺理由）⇒ rc1＋问题行
  const dictBad = path.join(tmp, "dict-bad.json");
  mk(dictBad, JSON.stringify({ meta: { tiers: { D1: { meaning: "x", turn: "双回合", confirm: "必须" } }, families: ["破坏族"], scanned: "fixture" }, actions: [{ id: "x.del", word: "删除", object: "物", tier: "D1", turn: "双回合", channel: "对话", family: "破坏族", wave: 1 }], sites: { web: [], native: [] } }, null, 2));
  const r7 = run(repoA, dictBad);
  const j7 = r7.rc === 1 ? JSON.parse(r7.out) : null;
  ok("台账不合规（D1 缺理由）⇒ rc1＋问题列在", r7.rc === 1 && j7 && j7.dictProblems.length > 0, j7 ? JSON.stringify(j7.dictProblems) : r7.err.slice(0, 120));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`── 自测：${fail.length ? "红 " + fail.length : "全绿"}（共 9 断言）`);
  return fail.length ? 1 : 0;
}

/* ── 主流程 ── */
const cmd = ["--json", "--list", "--dict-md", "--dict-check", "--suggest-baseline", "--self-test"].find((c) => flag(c));
if (cmd === "--self-test") process.exit(selfTest());
if (cmd === "--dict-md") { console.log(renderMd(loadDict())); process.exit(0); }
if (cmd === "--dict-check") {
  const problems = validateDict(loadDict());
  for (const p of problems) console.log(`  ✗ ${p}`);
  console.log(`台账合规：${problems.length ? "红 " + problems.length : "全绿"}（${(loadDict().actions || []).length} 动作行）`);
  process.exit(problems.length ? 1 : 0);
}
if (!fs.existsSync(REPO)) die(`❌ 产品仓不存在：${REPO}`);
const dictProblems = validateDict(loadDict());
const { result, over } = audit();
result.dictProblems = dictProblems;
if (cmd === "--suggest-baseline") {
  const rd = result.read;
  console.log(`const BASELINE = {\n  webSites: ${rd.webSites},\n  nativeFiles: ${rd.nativeFiles},\n  rawHex: ${rd.rawHex},\n  turnSpecial: ${rd.turnSpecial},\n  legacyAlive: ${rd.legacyAlive},\n  note: "（--suggest-baseline ${new Date().toISOString().slice(0, 10)} 读数）",\n};`);
} else if (cmd === "--json") {
  console.log(JSON.stringify(result, null, 2));
} else {
  printSummary(result);
  if (LIST) printLists(result);
  if (dictProblems.length) for (const p of dictProblems) console.log(`  ⚠ 台账：${p}`);
}
process.exit(over || dictProblems.length ? 1 : 0);
