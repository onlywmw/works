#!/usr/bin/env node
/**
 * SYS-02 阶段三 E1 状态单源——工单库 ⇄ 工单表 单向同步器（3A 校验器 + 3B 生成器）
 *
 * 唯一权威 = 工单库.md 每卡状态行（人只写这一处）；工单表.xlsx = 生成物（禁止手写）。
 *
 * 用法：
 *   node sync-orders.mjs --check           3A 只读校验：库状态行 vs 表内容 → diff 报告（不写表）
 *   node sync-orders.mjs --sync            3B 单向生成：库→表全量重写；生成后 --check diff=0 为成功条件
 *   node sync-orders.mjs --check --table <副本.xlsx>   对指定表文件校验（测试/迁移前演练用，只读）
 *   node sync-orders.mjs --sync  --table <副本.xlsx>   对指定表文件生成（测试用，不碰真实表）
 *
 * 红线：
 *   - 只动工单系统侧（0027-mov 零接触）
 *   - 3A --check 只读（绝不写表）；未过评审前禁止对真实表 --sync
 *   - --sync 前自动备份真实表到 _备份归档\；--table 覆盖仅用于测试副本
 *   - 表=纯生成物：写元信息行（A 列以 # 开头）标注机器生成，check 跳过该行
 *
 * 列映射（9 列，对齐现有表口径）：
 *   A 工单号 = 卡编号；B 标题 = 卡标题；C 优先级 = 状态区内联 **优先级**：X；
 *   D 设计师 / E 程序员 / F 验收员 / G 设计师(合main) = 状态区该角色最新动作段；
 *   H 备注 = 状态区首个 设计师[/\]...md 文档引用（无则 —）；I delivery_id = 状态区最后 DEL-... 编号（无则 —）
 *
 * xlsx 读写经 python openpyxl 子进程（node 无 npm/xlsx）。中文输出需 PYTHONUTF8=1（GBK 控制台可能乱码，不影响逻辑）。
 *
 * 退出码：--check  0=CHECK_OK（diff=0） 1=CHECK_DIFF（有 diff） 2=ERROR
 *        --sync   0=成功（生成后 diff=0） 2=失败
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(__dirname); // 工单系统\
const DEFAULT_LIB = path.join(ROOT, "工单库.md");
const DEFAULT_TABLE = path.join(ROOT, "工单表.xlsx");
const BACKUP_DIR = path.join(ROOT, "_备份归档");

const HEADER = ["工单号", "标题", "优先级", "设计师", "程序员", "验收员", "设计师(合main)", "备注", "delivery_id"];
const META_ROW = "# 生成: sync-orders.mjs ｜ 库→表单向投影 ｜ 禁止手工编辑 ｜ 源: 工单库.md";

// ---------------- 参数 ----------------
function parseArgs(argv) {
  const opts = { mode: null, table: DEFAULT_TABLE };
  for (const a of argv) {
    if (a === "--check") opts.mode = "check";
    else if (a === "--sync") opts.mode = "sync";
    else if (a === "--table") { opts.table = null; opts._nextTable = true; }
    else if (opts._nextTable) { opts.table = a; opts._nextTable = false; }
  }
  return opts;
}

// ---------------- 工单库解析 ----------------
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

// 角色动作锚（R1 增强：卡文本锚 + 长文本段兜底）
// 只含动作语义锚，不含纯人名（防「设计师合前抽查」误判为设计动作；人名词随动作词命中）
// 段内任一锚命中 → 从锚位置切出该角色动作子段（旧卡长状态段多角色并存也可逐个提取）
// 同 idx 多锚时保留更长锚（如 待设计师合 main > 已合 main > 合 main）
const ROLE_ANCHORS = [
  { role: "merge", re: /待设计师合 main|已合 main|合 main|合流/g },
  { role: "inspector", re: /验收员|验收通过|独立复核|复验|打回|审验/g },
  { role: "dev", re: /C 交付|C 完成|C 修复|C 批|修复交付|修复完成|M3-R2|已认领|在施|施工中|重修完成/g },
  { role: "designer", re: /出单人|方案[\s**]*[vV]\d|设计[\s]*[vV]\d|定稿|已派单|评审|裁决|拍板|规范|激活|方案完成/g },
];

const DATE_RE = /@?(\d{4}-\d{2}-\d{2})/g;
const DEL_RE = /DEL-[A-Z0-9]+-\d{8}-\d+/g;
const DOC_RE = /设计师[\\/][^\s｜|，。；）)（(]*?\.md/;

// 优先级多形态锚（R1 增强）：**优先级**：X / 优先级：X / ｜ 优先级：X / （PX· / **级别**：PX
// 只认明确的优先级/级别标注；「修复范围（P1 必修）」等缺陷等级不命中（不造值）
function extractPriority(txt) {
  const patterns = [
    /\*\*优先级\*\*：\s*([^｜|]+)/,   // 允许含空格（批 1 P0 / 批 2 P1），取到竖线前
    /(?:｜|\|)\s*优先级：\s*([^｜|]+)/,
    /(?:^|；)优先级：\s*([^｜|]+)/,
    /（(P[0-4])\s*·\s*[0-9~]/u, // 排期形态（P0·3~5 工作日）；缺陷级别（P1，L3…）不命中（不造值）
    /\*\*级别\*\*：\s*([^｜|]+)/,
  ];
  for (const re of patterns) {
    const m = txt.match(re);
    if (!m) continue;
    let v = m[1].trim().replace(/[（(].*$/, "").trim();
    if (v.startsWith("P") && /^P[0-4]$/.test(v)) return v;
    if (/^[0-4]$/.test(v)) return "P" + v;
    return v; // 非 P 形态标注（如「紧急」「批 1 P0」），照实返回不猜
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
    for (let j = idx; j < end; j++) {
      if (lines[j].includes("**状态**：")) { st = j; break; }
    }
    if (st === -1) return null;
    let endline = end;
    for (let j = st + 1; j < end; j++) {
      const l = lines[j];
      if (/^# UPG-\d+/.test(l) || /^## /.test(l)) { endline = j; break; }
      // R1：blockquote（> 遗留跟进等）与分隔线（---）非状态区内容，排除
      if (l.startsWith(">") || l.startsWith("---")) { endline = j; break; }
      if (SEC_WORDS.some((w) => l.startsWith(w))) { endline = j; break; }
    }
    return { st, endline };
  }

  function segments(text) {
    let body = text.replace(/^\*\*状态\*\*：/, "").replace(/\n/g, " ").replace(/——/g, "｜");
    return body
      .split(SEG_RE)
      .map((p) => p.trim().replace(/^[→｜。；]+/, "").trim())
      .filter((p) => p.length > 0);
  }

  function classify(seg) {
    if (FIELD_HEAD.some((f) => seg.startsWith(f))) return null;
    const head = seg.slice(0, 40);
    for (const { role, re } of ROLE_ANCHORS) {
      re.lastIndex = 0; // g flag 下 test 会移动 lastIndex，先重置
      if (re.test(head)) return role;
    }
    return null;
  }

  function actionSubsegs(seg) {
    // 段内按动作锚位置切片：锚→下一锚 的子文本作为该角色候选动作（R1 长文本段兜底）
    const markers = [];
    for (const { role, re } of ROLE_ANCHORS) {
      for (const m of seg.matchAll(re)) {
        markers.push({ idx: m.index, role, word: m[0] });
      }
    }
    if (!markers.length) return [];
    markers.sort((a, b) => a.idx - b.idx || b.word.length - a.word.length);
    const dedup = [];
    for (const mk of markers) {
      const last = dedup[dedup.length - 1];
      if (last && last.idx === mk.idx) continue;            // 同 idx 取最长锚
      if (last && mk.role === last.role && mk.idx < last.idx + last.word.length) continue; // 同角色重叠锚
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
    // 优先：整段主分类为该角色 → 完整段提取（内容完整，不劣化原有正确提取）
    segs.forEach((s, pos) => {
      if (FIELD_HEAD.some((f) => s.startsWith(f))) return;
      if (classify(s) !== role) return;
      hasWhole = true;
      const date = maxDate(s);
      if (date > bestDate || (date === bestDate && pos > bestPos)) {
        best = s.slice(0, 70); bestDate = date; bestPos = pos;
      }
    });
    if (hasWhole) return best;
    // 兜底：段内锚切片（旧卡长状态段多角色并存——如 UPG-03 merge 段内嵌「验收员通过」）
    segs.forEach((s, pos) => {
      if (FIELD_HEAD.some((f) => s.startsWith(f))) return;
      actionSubsegs(s).forEach((sub, si) => {
        if (sub.role !== role) return;
        const date = maxDate(sub.text);
        const score = pos + si / 100;
        if (date > bestDate || (date === bestDate && score > bestPos)) {
          best = sub.text; bestDate = date; bestPos = score;
        }
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
    if (!region) {
      warns.push("无状态区");
      rows.push(row); warnings.push({ no: c.no, warns }); continue;
    }
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

// ---------------- UPG-99：DEL 绑定==分支头 机器校验 ----------------
// 裁决依据（设计师 2026-09-04）：「分支头推进=交付内容变化=DEL 重绑或显式豁免注记；验收/审验/合 main 三处只认分支头」
// 口径：未合卡→code= 必须==对应仓 feat/<ticket> 分支头；已合卡（状态含「已合 main」）→code= 必须是该仓 main 祖先。
// DEL 块内同段含「豁免」→ 跳过。git/仓库不可用→跳过并明示。失败不阻断投影，但 --check 退出码非零。
const DEL_CODE_RE = new RegExp("DEL-([A-Z0-9]+)-(\\d{8})-(\\d+)[^\\n]{0,160}?code=\\**([0-9a-f]{7,40})", "g");
const MOV_REPO = "E:/mov归档/0027-mov";

function gitAt(repo, args) {
  const r = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout || "").trim(), err: (r.stderr || "").trim() };
}

function delBindingAudit(libPath) {
  const txt = fs.readFileSync(libPath, "utf8");
  const repos = [MOV_REPO, path.dirname(libPath)]; // MOV 仓优先，工单系统仓兜底（治理单如 UPG-86/92）
  const issues = [];
  let checked = 0;
  // 卡边界：「# UPG-xx」头到下一张卡头
  const cardRe = /^# (UPG-[A-Z0-9]+)/gm;
  const heads = [];
  let hm;
  while ((hm = cardRe.exec(txt)) !== null) heads.push({ no: hm[1], at: hm.index });
  for (let c = 0; c < heads.length; c++) {
    const cardTxt = txt.slice(heads[c].at, c + 1 < heads.length ? heads[c + 1].at : txt.length);
    const ticket = heads[c].no.replace("UPG-", "UPG");
    // 已合卡：验「已合 main @hash」记录的真实落点 ∈ main 祖先（rebase 重写是常态，交付时 DEL 绑定为时点记录不回头验）
    const mMerged = cardTxt.match(/已合 main[\s\S]{1,40}?([0-9a-f]{7,40})/);
    if (mMerged) {
      const mh = mMerged[1];
      let repo = null;
      for (const r of repos) {
        if (fs.existsSync(r) && gitAt(r, ["rev-parse", "--verify", `${mh}^{commit}`]).ok) { repo = r; break; }
      }
      // 存量豁免：规则 2026-09-04 起生效；此前 cherry-pick 时代合入的卡 hash 级校验必误报，跳过
      const mDate = cardTxt.match(/已合 main[^\d]{0,10}(\d{4})-(\d{2})-(\d{2})/);
      if (mDate && `${mDate[1]}-${mDate[2]}-${mDate[3]}` < "2026-09-04") {
        issues.push({ no: heads[c].no, type: "存量豁免", detail: `已合 main @${mDate[1]}-${mDate[2]}-${mDate[3]}（规则前 cherry-pick 时代），DEL 绑定校验豁免` });
        continue;
      }
      if (!repo) { issues.push({ no: heads[c].no, type: "DEL校验跳过", detail: `已合 main @${mh} 两仓均不可解析，人工核` }); continue; }
      const anc = gitAt(repo, ["merge-base", "--is-ancestor", mh, "main"]);
      if (!anc.ok) issues.push({ no: heads[c].no, type: "DEL绑定失效", detail: `已合 main @${mh} 不在 main 祖先链（${path.basename(repo)}）——合入记录不实，人工核` });
      else checked++;
      continue;
    }
    // 未合卡：DEL code= 必须 == feat/<ticket> 分支头
    DEL_CODE_RE.lastIndex = 0;
    const dm = DEL_CODE_RE.exec(cardTxt);
    if (!dm) continue; // 无 DEL 绑定（未交付）不验
    if (/豁免/.test(dm[0])) continue; // 显式豁免注记跳过
    const hash = dm[4];
    let repo = null;
    for (const r of repos) {
      if (fs.existsSync(r) && gitAt(r, ["rev-parse", "--verify", `${hash}^{commit}`]).ok) { repo = r; break; }
    }
    if (!repo) { issues.push({ no: heads[c].no, type: "DEL校验跳过", detail: `DEL code=${hash} 两仓均不可解析，人工核` }); continue; }
    const br = `feat/${heads[c].no.toLowerCase().replace("upg-", "upg")}`;
    let head = gitAt(repo, ["rev-parse", "--verify", br]).out;
    if (!head) head = gitAt(repo, ["rev-parse", "--verify", `origin/${br}`]).out;
    if (!head) { issues.push({ no: heads[c].no, type: "DEL校验跳过", detail: `${br} 分支不在（已收/未建），人工核` }); continue; }
    if (!head.startsWith(hash)) issues.push({ no: heads[c].no, type: "DEL绑定失效", detail: `未合卡 DEL code=${hash} ≠ ${br} 头 ${head.slice(0, 12)}（${path.basename(repo)}）——分支头已推进，须重绑或豁免` });
    else checked++;
  }
  return { issues, checked };
}
// ---------------- python openpyxl 桥 ----------------
const PY_READ = `
import openpyxl, json, sys
p = sys.argv[1]
wb = openpyxl.load_workbook(p)
ws = wb[wb.sheetnames[0]]
hdr = [ws.cell(1,c).value for c in range(1, ws.max_column+1)]
rows = []
for r in range(2, ws.max_row+1):
    vals = [ws.cell(r,c).value for c in range(1, ws.max_column+1)]
    if vals[0] is None: continue
    rows.append(['' if v is None else str(v) for v in vals])
print(json.dumps({'sheet': wb.sheetnames[0], 'header': hdr, 'rows': rows}, ensure_ascii=False))
`;

const PY_WRITE = `
import openpyxl, json, sys
data = json.loads(sys.stdin.read())
p = sys.argv[1]
wb = openpyxl.load_workbook(p)
if data['sheet'] in wb.sheetnames:
    ws = wb[data['sheet']]
else:
    ws = wb.active
    ws.title = data['sheet']
for c, h in enumerate(data['header'], start=1):
    ws.cell(1, c).value = h
if ws.max_row > 1:
    ws.delete_rows(2, ws.max_row - 1)
r = 2
if data.get('meta'):
    ws.cell(r, 1).value = data['meta']; r += 1
for row in data['rows']:
    for c, v in enumerate(row, start=1):
        ws.cell(r, c).value = v
    r += 1
wb.save(p)
print(json.dumps({'ok': True, 'written_rows': len(data['rows'])}, ensure_ascii=False))
`;

function runPython(code, args, input) {
  const env = { ...process.env, PYTHONUTF8: "1" };
  const res = spawnSync("python", ["-c", code, ...args], { encoding: "utf8", env, input });
  if (res.status !== 0) throw new Error(`python 失败 exit=${res.status} stderr=${(res.stderr || "").slice(0, 500)}`);
  return JSON.parse(res.stdout.trim().split("\n").pop());
}

function readTable(path) {
  const d = runPython(PY_READ, [path]);
  return { header: d.header, rows: d.rows };
}

function writeTable(path, rows, meta) {
  // rows 是对象数组（no/title/C..I）→ 转为二维数组供 openpyxl 迭代（dict 会被枚举键名）
  const rows2 = rows.map((r) => [r.no, r.title, r.C, r.D, r.E, r.F, r.G, r.H, r.I]);
  const payload = JSON.stringify({ sheet: "升级工单表", header: HEADER, meta, rows: rows2 });
  return runPython(PY_WRITE, [path], payload);
}

function backupTable(tablePath) {
  if (!fs.existsSync(tablePath)) return null;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
  const dest = path.join(BACKUP_DIR, `工单表_备份_${ts}.xlsx`);
  fs.copyFileSync(tablePath, dest);
  return dest;
}

// ---------------- diff ----------------
const COL_LABEL = { B: "标题", C: "优先级", D: "设计师", E: "程序员", F: "验收员", G: "设计师(合main)", H: "备注", I: "delivery_id" };

function diffLibVsTable(libRows, tableRows) {
  const libMap = new Map(libRows.map((r) => [r.no, r]));
  const tblMap = new Map();
  for (const r of tableRows) {
    if (typeof r[0] === "string" && r[0].startsWith("#")) continue; // 跳过元信息行
    if (r[0]) tblMap.set(r[0], r);
  }
  const issues = [];
  let compared = 0, matched = 0;
  for (const lr of libRows) {
    const tr = tblMap.get(lr.no);
    if (!tr) {
      issues.push({ no: lr.no, type: "表缺行", detail: `表=${lr.no} 无此行，库有` });
      continue;
    }
    // 表列: [0]=A 工单号 [1]=B 标题 [2]=C ... [8]=I
    const tblVals = {
      B: tr[1] || "", C: tr[2] || "", D: tr[3] || "", E: tr[4] || "",
      F: tr[5] || "", G: tr[6] || "", H: tr[7] || "", I: tr[8] || "",
    };
    const libVals = { B: lr.title, C: lr.C, D: lr.D, E: lr.E, F: lr.F, G: lr.G, H: lr.H, I: lr.I };
    compared++;
    let rowIssues = 0;
    for (const col of ["B", "C", "D", "E", "F", "G", "H", "I"]) {
      let a = (tblVals[col] || "").trim();
      const b = (libVals[col] || "").trim();
      // R1 口径归一化：I(delivery_id) 表占位符「—（合前交付，未绑定）」≡ 库「—」（均表无交付绑定，非实质差异）
      if (col === "I" && /^—（/.test(a)) a = "—";
      if (a !== b) {
        rowIssues++;
        issues.push({ no: lr.no, type: "值不一致", detail: `列${col}(${COL_LABEL[col]}) 表="${a.slice(0, 40)}" → 库="${b.slice(0, 40)}"` });
      }
    }
    if (rowIssues === 0) matched++;
  }
  for (const tno of tblMap.keys()) {
    if (!libMap.has(tno) && !tno.startsWith("#")) {
      issues.push({ no: tno, type: "库缺卡", detail: `表有 ${tno} 但库无此卡` });
    }
  }
  return { issues, compared, matched };
}

function printDiff(issues, compared) {
  console.log(`═══ SYS-02 E1 sync-orders ${issues.length === 0 ? "CHECK_OK" : "CHECK_DIFF"} ═══`);
  console.log(`对比 ${compared} 张卡`);
  if (issues.length === 0) {
    console.log("库 ⇄ 表 零差异（diff=0）——表为库的确定性投影，一致。");
    return;
  }
  console.log(`不一致 ${issues.length} 处：`);
  for (const it of issues.slice(0, 60)) {
    console.log(`  [${it.no} · ${it.type}] ${it.detail}`);
  }
  if (issues.length > 60) console.log(`  ... 其余 ${issues.length - 60} 处省略`);
}

// ---------------- main ----------------
function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.mode) {
    console.error("用法: node sync-orders.mjs --check | --sync [--table <副本.xlsx>]");
    process.exit(2);
  }

  const libPath = DEFAULT_LIB;
  const tablePath = path.resolve(opts.table);
  if (!fs.existsSync(libPath)) { console.error(`工单库不存在: ${libPath}`); process.exit(2); }
  if (!fs.existsSync(tablePath)) { console.error(`工单表不存在: ${tablePath}`); process.exit(2); }

  const { rows: libRows, warnings } = parseLib(libPath);
  const realTable = path.resolve(DEFAULT_TABLE);

  if (opts.mode === "check") {
    if (warnings.length) {
      console.log("═══ 工单库解析警告（机器不猜，人工裁决）═══");
      for (const w of warnings) console.log(`  [${w.no}] ${w.warns.join("；")}`);
      console.log("");
    }
    const { rows: tblRows } = readTable(tablePath);
    const { issues, compared } = diffLibVsTable(libRows, tblRows);
    printDiff(issues, compared);
    // UPG-99：DEL 绑定==分支头机器校验（失败计入退出码）
    const delAudit = delBindingAudit(libPath);
    if (delAudit.issues.length || delAudit.checked) {
      console.log("═══ DEL 绑定==分支头 校验（UPG-99）═══");
      console.log(`  通过 ${delAudit.checked} 条`);
      for (const i of delAudit.issues) console.log(`  [${i.no}] ${i.type}：${i.detail}`);
      console.log("");
    }
    // 退出口径：diff=0 且无「DEL绑定失效」硬红 → 0；提示性 issue（存量豁免/校验跳过·人工核类）打印不拦 commit
    const hardRed = delAudit.issues.filter(i => i.type === "DEL绑定失效").length;
    process.exit(issues.length === 0 && hardRed === 0 ? 0 : 1);
  }

  if (opts.mode === "sync") {
    const isReal = path.resolve(tablePath) === realTable;
    if (isReal) {
      const b = backupTable(realTable);
      console.log(`已备份真实表 → ${b}`);
    }
    writeTable(tablePath, libRows, META_ROW);
    console.log(`已生成 ${tablePath}：${libRows.length} 张卡（库=${libRows.length} 卡 → 表 ${libRows.length} 行）`);
    const delAuditS = delBindingAudit(libPath);
    for (const i of delAuditS.issues) console.log(`⚠ [${i.no}] ${i.type}：${i.detail}`);
    if (isReal) console.log("⚠ 红线注记：真实表已 --sync 覆盖——仅在设计评审通过后允许；3A --check 应先行且 diff=0。");
    // 成功条件 = 生成后 check diff=0
    const { rows: tblRows } = readTable(tablePath);
    const { issues, compared } = diffLibVsTable(libRows, tblRows);
    printDiff(issues, compared);
    if (issues.length !== 0) {
      console.error("FAIL：生成后 diff 非零——不满足成功条件，请人工核查（勿继续覆盖）。");
      process.exit(2);
    }
    process.exit(0);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
