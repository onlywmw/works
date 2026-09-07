#!/usr/bin/env node
// 临时诊断脚本（非交付物）：R1 增强后全量 diff 分类——解析器不足已消 vs 剩余=库信息缺失/表过时/表缺行
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname);
const LIB = path.join(ROOT, "工单库.md");
const TABLE = path.join(ROOT, "工单表.xlsx");

// ---------- 复制自 sync-orders.mjs（当前 R1 增强版 parseLib）----------
const SEC_WORDS = [
  "**背景", "**来源", "**问题", "**修法", "**验收", "**交接", "**红线", "**方案",
  "**决策点", "**施工规矩", "**根因", "**定案", "**防撞", "**级别", "**判据",
  "**范围红线", "**关键设计点", "**送审", "**与契约", "**一句话", "**施工范围",
  "**遗留", "**用户实测", "**其余", "**串行", "**交付", "**顺带纠正", "**无冲突",
  "**Token", "**认领情况", "**派单交接", "**核心方案", "**实施", "**不做清单",
  "**维持死亡", "**证伪复活", "**方法学注记", "**文档纪律", "**打回依据",
  "**重修验收", "**关联独立单", "**桥能力现状", "**达标项", "**修正项", "**差距",
  "**合格", "**结构", "**能力清单", "**安装", "**功能", "**规则", "**场景",
  "**边界", "**职责", "**契约", "**接口", "**数据结构", "**配置", "**流转",
];
const SEG_RE = /(?=→\s*[✅🔨❌⚠️📌🆕⏳】]+)|(?=→\s*\*\*)|(?=｜\s*[✅🔨❌⚠️📌🆕⏳】]+)|(?=｜\s*\*\*)|(?=【✅)|(?=】；)|(?=\*\*日期\*\*)|(?=\*\*出单人\*\*)|(?=\*\*优先级\*\*)|(?= \*\*✅)|(?= \*\*🔨)|(?= \*\*❌)/;
const FIELD_HEAD = ["**出单人**", "**日期**", "**优先级**", "**原状态**"];
const ROLE_ANCHORS = [
  { role: "merge", re: /待设计师合 main|已合 main|合 main|合流/g },
  { role: "inspector", re: /验收员|验收通过|独立复核|复验|打回|审验/g },
  { role: "dev", re: /C 交付|C 完成|C 修复|C 批|修复交付|修复完成|M3-R2|已认领|在施|施工中/g },
  { role: "designer", re: /出单人|方案[\s**]*[vV]\d|设计[\s]*[vV]\d|定稿|已派单|评审|裁决|拍板|规范|激活/g },
];
const DATE_RE = /@?(\d{4}-\d{2}-\d{2})/g;
const DEL_RE = /DEL-[A-Z0-9]+-\d{8}-\d+/g;
const DOC_RE = /设计师[\\/][^\s｜|，。；）)（(]*?\.md/;

function extractPriority(txt) {
  const patterns = [
    /\*\*优先级\*\*：\s*([^｜|]+)/,
    /(?:｜|\|)\s*优先级：\s*([^｜|]+)/,
    /(?:^|；)优先级：\s*([^｜|]+)/,
    /（(P[0-4])\s*·\s*[0-9~]/u,
    /\*\*级别\*\*：\s*([^｜|]+)/,
  ];
  for (const re of patterns) {
    const m = txt.match(re);
    if (!m) continue;
    let v = m[1].trim().replace(/[（(].*$/, "").trim();
    if (v.startsWith("P") && /^P[0-4]$/.test(v)) return v;
    if (/^[0-4]$/.test(v)) return "P" + v;
    return v;
  }
  return "—";
}

function parseLib(libPath) {
  const src = fs.readFileSync(libPath, "utf8").replace(/\r\n/g, "\n");
  const lines = src.split("\n");
  const cards = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^# (UPG-\d+)\s+(.*)$/);
    if (m) cards.push({ idx: i, no: m[1], title: m[2].trim() });
  }
  const endOf = (i) => (i + 1 < cards.length ? cards[i + 1].idx : lines.length);
  function statusRegion(idx, end) {
    let st = -1;
    for (let j = idx; j < end; j++) if (lines[j].includes("**状态**：")) { st = j; break; }
    if (st === -1) return null;
    let endline = end;
    for (let j = st + 1; j < end; j++) {
      const l = lines[j];
      if (/^# UPG-\d+/.test(l) || /^## /.test(l)) { endline = j; break; }
      if (l.startsWith(">") || l.startsWith("---")) { endline = j; break; }
      if (SEC_WORDS.some((w) => l.startsWith(w))) { endline = j; break; }
    }
    return { st, endline };
  }
  function segments(text) {
    let body = text.replace(/^\*\*状态\*\*：/, "").replace(/\n/g, " ").replace(/——/g, "｜");
    return body.split(SEG_RE).map((p) => p.trim().replace(/^[→｜。；]+/, "").trim()).filter((p) => p.length > 0);
  }
  function classify(seg) {
    if (FIELD_HEAD.some((f) => seg.startsWith(f))) return null;
    const head = seg.slice(0, 40);
    for (const { role, re } of ROLE_ANCHORS) {
      re.lastIndex = 0;
      if (re.test(head)) return role;
    }
    return null;
  }
  function actionSubsegs(seg) {
    const markers = [];
    for (const { role, re } of ROLE_ANCHORS) {
      for (const m of seg.matchAll(re)) markers.push({ idx: m.index, role, word: m[0] });
    }
    if (!markers.length) return [];
    markers.sort((a, b) => a.idx - b.idx || b.word.length - a.word.length);
    const dedup = [];
    for (const mk of markers) {
      const last = dedup[dedup.length - 1];
      if (last && last.idx === mk.idx) continue;
      if (last && mk.role === last.role && mk.idx < last.idx + last.word.length) continue;
      dedup.push(mk);
    }
    const out = [];
    for (let k = 0; k < dedup.length; k++) {
      const mk = dedup[k];
      const tail = seg.slice(mk.idx + mk.word.length, k + 1 < dedup.length ? dedup[k + 1].idx : seg.length)
        .trim().replace(/^[｜|→。；：]+/, "").trim();
      out.push({ role: mk.role, text: (mk.word + tail).slice(0, 70) });
    }
    return out;
  }
  function maxDate(s) {
    let date = -1;
    DATE_RE.lastIndex = 0;
    for (let m = DATE_RE.exec(s); m; m = DATE_RE.exec(s)) {
      const t = Number(m[1].replace(/-/g, ""));
      if (t > date) date = t;
    }
    return date;
  }
  function pick(segs, role) {
    let best = null, bestDate = -1, bestPos = -1, hasWhole = false;
    segs.forEach((s, pos) => {
      if (FIELD_HEAD.some((f) => s.startsWith(f))) return;
      if (classify(s) !== role) return;
      hasWhole = true;
      const date = maxDate(s);
      if (date > bestDate || (date === bestDate && pos > bestPos)) { best = s.slice(0, 70); bestDate = date; bestPos = pos; }
    });
    if (hasWhole) return best;
    segs.forEach((s, pos) => {
      if (FIELD_HEAD.some((f) => s.startsWith(f))) return;
      actionSubsegs(s).forEach((sub, si) => {
        if (sub.role !== role) return;
        const date = maxDate(sub.text);
        const score = pos + si / 100;
        if (date > bestDate || (date === bestDate && score > bestPos)) { best = sub.text; bestDate = date; bestPos = score; }
      });
    });
    return best;
  }
  const rows = [];
  const warnings = [];
  for (const c of cards) {
    const region = statusRegion(c.idx, endOf(c.idx));
    const row = { no: c.no, title: c.title, C: "—", D: "—", E: "—", F: "—", G: "—", H: "—", I: "—" };
    const warns = [];
    if (!region) { warns.push("无状态区"); rows.push(row); warnings.push({ no: c.no, warns }); continue; }
    const txt = lines.slice(region.st, region.endline).join("\n");
    const segs = segments(txt);
    for (const [role, col] of [["designer", "D"], ["dev", "E"], ["inspector", "F"], ["merge", "G"]]) {
      const s = pick(segs, role);
      if (s) row[col] = s.slice(0, 70);
    }
    row.C = extractPriority(txt);
    if (row.C === "—") warns.push("优先级缺失");
    const dm = txt.match(DEL_RE);
    if (dm) row.I = dm[dm.length - 1];
    const hp = txt.match(DOC_RE);
    if (hp) row.H = hp[0];
    if (row.D === "—" && row.E === "—" && row.F === "—" && row.G === "—") warns.push("状态列全空");
    rows.push(row);
    if (warns.length) warnings.push({ no: c.no, warns });
  }
  return { rows, warnings };
}

// ---------- 复制 readTable ----------
const PY_READ = `import openpyxl, json, sys
p = sys.argv[1]
wb = openpyxl.load_workbook(p)
ws = wb[wb.sheetnames[0]]
rows = []
for r in range(2, ws.max_row+1):
    vals = [ws.cell(r,c).value for c in range(1, ws.max_column+1)]
    if vals[0] is None: continue
    rows.append(['' if v is None else str(v) for v in vals])
print(json.dumps({'rows': rows}, ensure_ascii=False))`;
function readTable(path) {
  const env = { ...process.env, PYTHONUTF8: "1" };
  const res = spawnSync("python", ["-c", PY_READ, path], { encoding: "utf8", env });
  return JSON.parse(res.stdout.trim().split("\n").pop()).rows;
}

// ---------- 全量 diff 分类 ----------
const COL_LABEL = { B: "标题", C: "优先级", D: "设计师", E: "程序员", F: "验收员", G: "设计师(合main)", H: "备注", I: "delivery_id" };
const { rows: libRows, warnings } = parseLib(LIB);
const tblRows = readTable(TABLE);
const libMap = new Map(libRows.map((r) => [r.no, r]));
const tblMap = new Map();
for (const r of tblRows) if (!(r[0] || "").startsWith("#")) if (r[0]) tblMap.set(r[0], r);

const cat = {
  missing_row: [],
  lib_no_val_tbl_has: [],
  both_val_diff: [],
  lib_val_tbl_missing: [],
};
let compared = 0;
for (const lr of libRows) {
  const tr = tblMap.get(lr.no);
  if (!tr) { cat.missing_row.push(lr.no); continue; }
  compared++;
  const tblVals = { B: tr[1] || "", C: tr[2] || "", D: tr[3] || "", E: tr[4] || "", F: tr[5] || "", G: tr[6] || "", H: tr[7] || "", I: tr[8] || "" };
  const libVals = { B: lr.title, C: lr.C, D: lr.D, E: lr.E, F: lr.F, G: lr.G, H: lr.H, I: lr.I };
  for (const col of ["B", "C", "D", "E", "F", "G", "H", "I"]) {
    let a = (tblVals[col] || "").trim();
    const b = (libVals[col] || "").trim();
    if (col === "I" && /^—（/.test(a)) a = "—"; // 占位符归一
    if (a === b) continue;
    if (b === "—" && a !== "") cat.lib_no_val_tbl_has.push(`${lr.no}·${col}(${COL_LABEL[col]}) 表="${a.slice(0,30)}"`);
    else if (b !== "—" && a === "") cat.lib_val_tbl_missing.push(`${lr.no}·${col}(${COL_LABEL[col]}) 库="${b.slice(0,30)}"`);
    else cat.both_val_diff.push(`${lr.no}·${col}(${COL_LABEL[col]}) 表="${a.slice(0,22)}"→库="${b.slice(0,22)}"`);
  }
}
for (const tno of tblMap.keys()) if (!libMap.has(tno) && !tno.startsWith("#")) cat.both_val_diff.push(`库缺卡 ${tno}`);

console.log(`解析警告（机器不猜）:`);
for (const w of warnings) console.log(`  [${w.no}] ${w.warns.join(" / ")}`);
console.log(`对比 ${compared} 张卡`);
console.log(`A 表缺行(${cat.missing_row.length}): ${cat.missing_row.join(" ")}`);
console.log(`B 库无值·表有值(库信息缺失,不可消)(${cat.lib_no_val_tbl_has.length}):`);
cat.lib_no_val_tbl_has.forEach((x) => console.log(`   ${x}`));
console.log(`C 库有值·表空(表缺数据,sync可补)(${cat.lib_val_tbl_missing.length}):`);
cat.lib_val_tbl_missing.forEach((x) => console.log(`   ${x}`));
console.log(`D 两者有值但不同(值不一致,可消或表需刷新)(${cat.both_val_diff.length}):`);
cat.both_val_diff.forEach((x) => console.log(`   ${x}`));
console.log(`总计: ${cat.missing_row.length + cat.lib_no_val_tbl_has.length + cat.lib_val_tbl_missing.length + cat.both_val_diff.length}`);
