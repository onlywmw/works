#!/usr/bin/env node
// -*- coding: utf-8 -*-
// 取号闸 —— 工单库立卡唯一入口（2026-09-10 用户拍板。SYS-27 撞号案：人工立卡无取号机，两卡同号+status 块被劫持）
// SYS-59（2026-09-12）：立卡必填 WSJF 四因子（落 ```priority 块）+ bug 子类 ITIL 3×3——缺分即拒（fail-closed）。
// S2 统一收口（2026-09-27·用户令·方案 v3 §2.3）：①立卡/下一个=双账扫描（本账+对侧账，根治跨体系撞号——两侧曾各有一个 SYS-111）；
//   ②锁升级为全局共享锁（驿站\共享\号段锁.lock，两体系同锁=取号全局串行）；③「水位」子命令自网页侧同窗移植（只读双账对账）；
//   ④立卡后刷新 号段水位.json 投影（投影可失败不阻断——双账扫描才是真源）。
// 用法：
//   node 取号.mjs 下一个 SYS                      只读查号（扫描账本全部提及取 max+1，宁可跳号不撞号）
//   node 取号.mjs 立卡 SYS "标题" "引子备注" --bv 3 --tc 2 --rr 2 --size 5   取号+锁式原子追加卡骨架（锁文件防并发；立卡唯一入口）
//     --bv/--tc/--rr ∈ 1/2/3/5/8/13（商业价值挂北极星六轴｜时间紧迫｜风险消减/机会使能）；--size ∈ 1/2/5/8/13（档位映射 MICRO=1·小修=2·场景=5·结构=8·超大=13）
//     [--kind bug --impact 1-3 --urgency 1-3]（ITIL 3×3 → P0-P3，禁 --priority 覆盖）[--priority P0-P4]（缺省 P2）
//   测试桩：--lib <路径> 换沙盒账本
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { itilPriority } from "./lib/parse-card.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// 位置参数与带值旗标分离（旗标值不进 "引子" 文本）——SYS-59 新增四因子旗标后必须严格解析
// SYS-104 fail-closed：旗标白名单（值旗标须带值）——凡 --xxx 不在白名单一律拒收（禁静默忽略）；
// --lib / --adhoc-lib 语义=只写沙盒（真库零触·stdout 明示拦截）；指向真库直接拒收。
const VALUE_FLAGS = new Set(["--lib", "--adhoc-lib", "--lib-an", "--out", "--bv", "--tc", "--rr", "--size", "--kind", "--impact", "--urgency", "--priority"]);
const rawArgs = process.argv.slice(2);
const argv = [];
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a.startsWith("--")) {
    if (!VALUE_FLAGS.has(a)) { console.error(`❌ 拒执行：未知旗标「${a}」——已知旗标：${[...VALUE_FLAGS].join(" ")}`); process.exit(2); }
    if (rawArgs[i + 1] === undefined || rawArgs[i + 1].startsWith("--")) { console.error(`❌ 拒执行：旗标「${a}」缺值`); process.exit(2); }
    i++;
    continue;
  }
  argv.push(a);
}
const opt = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const REAL_LIB = path.join(HERE, "..", "工单库.md");
const sandboxFlag = ["--lib", "--adhoc-lib"].find((f) => process.argv.includes(f)) || null;
let SANDBOX = false;
let LIB;
if (sandboxFlag) {
  LIB = path.resolve(opt(sandboxFlag));
  if (path.resolve(LIB) === path.resolve(REAL_LIB)) {
    console.error(`❌ 拒执行：--${sandboxFlag.slice(2)} 指向真库——沙盒旗标语义=只写沙盒（真库零触）`);
    process.exit(2);
  }
  SANDBOX = true;
} else {
  LIB = REAL_LIB;
}
const PREFIXES = ["UPG", "SYS", "W", "S", "HMOS"];

// S2：对侧账/共享锁/水位投影路径一律自推（兄弟体系平铺 E:\MOV\<体系>\——SYS-66 换装纪律：不硬编码）；旗标/env 可覆盖
const CROSS_LIB = opt("--lib-an") || process.env.MOV_CROSS_LIB || path.join(HERE, "..", "..", "..", "网页体系建设", "处理中心", "工单库.md");
const STATION_LOCK_DIR = path.join(HERE, "..", "..", "..", "驿站", "共享");
const SHARED_LOCK = path.join(STATION_LOCK_DIR, "号段锁.lock"); // 瞬态互斥件（锁内串行、用毕即删），非账非信
const WATERMARK = path.join(STATION_LOCK_DIR, "号段水位.json"); // 投影（双账扫描才是真源）；仅真模式写

const maxNo = (prefix, file = LIB) => { // 全文扫（含正文提及）——宁可跳号不撞号；(?<![A-Za-z0-9-]) 防 S/W 单字母前缀误匹配（如 SHOW-12 里的 W-12）
  const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : "";
  let m = 0;
  for (const hit of raw.matchAll(new RegExp(`(?<![A-Za-z0-9-])${prefix}-(\\d+)`, "g"))) m = Math.max(m, +hit[1]);
  return m;
};
const globalNext = (prefix) => Math.max(maxNo(prefix), maxNo(prefix, CROSS_LIB)) + 1; // S2：双账扫描 max+1（对侧账缺失容错为 0）

const [sub, prefixRaw, title, ...noteParts] = argv;
const prefix = (prefixRaw || "").toUpperCase();

// ── S2：水位（自网页侧同窗移植·SYS-127 同款）——双侧全提及扫 max＋在册跳号考古＋手写号段注记过时判红（只读·默认打印·--out 落投影）──
if (sub === "水位") {
  const sides = [{ name: "AN", file: LIB }, { name: "WEB", file: CROSS_LIB }];
  const readOr = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : null);
  const res = { at: new Date().toISOString(), sides: sides.map((s) => ({ name: s.name, file: s.file, present: !!readOr(s.file) })), prefixes: {}, notes: [], rebuild: "node 处理中心/机器闸/取号.mjs 水位 [--lib <本账> --lib-an <对侧账> --out <目录>]" };
  for (const pfx of ["UPG", "SYS"]) {
    const per = sides.map((s) => ({ name: s.name, max: readOr(s.file) ? maxNo(pfx, s.file) : null }));
    const global = Math.max(0, ...per.filter((x) => x.max != null).map((x) => x.max));
    // 在册跳号（区间内无卡号头）＋命中处（各账全文提及行）
    const carded = new Set();
    for (const s of sides) { const raw = readOr(s.file); if (!raw) continue; for (const h of raw.matchAll(new RegExp("^#\\s+(" + pfx + "-\\d+)", "gm"))) carded.add(+h[1].split("-")[1]); }
    const minCarded = carded.size ? Math.min(...carded) : 1;
    const gaps = [];
    for (let n = minCarded; n <= global; n++) {
      if (carded.has(n)) continue;
      const hits = [];
      for (const s of sides) {
        const raw = readOr(s.file); if (!raw) continue;
        const lines = raw.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) if (new RegExp("(?<![A-Za-z0-9-])" + pfx + "-" + n + "\\b").test(lines[i])) { hits.push(`${s.name}:${i + 1}`); if (hits.length >= 3) break; }
        if (hits.length >= 3) break;
      }
      gaps.push({ n: pfx + "-" + n, hits });
    }
    res.prefixes[pfx] = { per, global, minCarded, water: pfx + "-" + (global + 1), gaps };
  }
  // 手写号段注记（两账头部「全局已用 max=<号>」）——注记 max < 机算全局 max ⇒ 判红「注记过时」
  for (const s of sides) {
    const raw = readOr(s.file); if (!raw) continue;
    const lines = raw.split(/\r?\n/).slice(0, 30);
    for (let i = 0; i < lines.length; i++) {
      for (const m of lines[i].matchAll(/全局已用 max=\*{0,2}((?:UPG|SYS)-(\d+))\*{0,2}/g)) {
        const pfx = m[1].split("-")[0];
        const g = res.prefixes[pfx] ? res.prefixes[pfx].global : 0;
        res.notes.push({ side: s.name, line: i + 1, note: m[1], globalMax: pfx + "-" + g, stale: +m[2] < g });
      }
    }
  }
  const md = ["# 号段水位（机生成·勿手编）", "", `> 生成：${res.at} ｜ 重建：\`${res.rebuild}\``, "> 口径：两侧全提及扫 max（同立卡口径·号不复用）；跳号=区间内无卡号头；注记过时=手写 max＜机算全局 max", ""];
  for (const pfx of ["UPG", "SYS"]) { const r = res.prefixes[pfx]; md.push(`## ${pfx}`, "", `- 水位（下一个可用）= **${r.water}** ｜ 全局 max=${pfx}-${r.global} ｜ 分账：${r.per.map((x) => `${x.name}=${x.max == null ? "缺" : pfx + "-" + x.max}`).join(" ｜ ")}`); md.push("", `- 在册跳号 ${r.gaps.length} 个（区间 ${pfx}-${r.minCarded || 1}..${pfx}-${r.global}）：${r.gaps.slice(0, 20).map((g) => g.n + (g.hits.length ? "（提及 " + g.hits.join(" ") + "）" : "")).join("、") || "—"}`); md.push(""); }
  md.push("## 手写号段注记核（注记过时=红）", "");
  for (const n of res.notes) md.push(`- [${n.stale ? "🔴 注记过时" : "✅"} ] ${n.side} L${n.line}：注记 ${n.note} ＜ 机算全局 ${n.globalMax}`);
  md.push("");
  const outDir = opt("--out");
  if (outDir) { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, "号段水位.md"), md.join("\n"), "utf-8"); fs.writeFileSync(path.join(outDir, "号段水位.json"), JSON.stringify(res, null, 2), "utf-8"); console.log(`（落 ${outDir}/号段水位.md ＋ .json）`); }
  console.log(md.join("\n"));
  if (SANDBOX) console.log(`🛡 沙盒模式：本账=沙盒账（${LIB}）——读数不映真账`);
  process.exit(0);
}

if (!sub || !PREFIXES.includes(prefix)) {
  console.error(`用法：取号.mjs 下一个 <${PREFIXES.join("|")}> ｜ 取号.mjs 立卡 <前缀> "标题" ["引子备注"]`);
  process.exit(2);
}

if (sub === "下一个") { console.log(`${prefix}-${globalNext(prefix)}`); process.exit(0); }

if (sub !== "立卡" || !title) {
  console.error(`用法：取号.mjs 立卡 ${prefix} "标题" ["引子备注"] --bv N --tc N --rr N --size N [--kind bug --impact N --urgency N] [--priority Pn]`);
  process.exit(2);
}

// SYS-59 WSJF 四因子（fail-closed：缺任一即拒，不落卡）
const FIB = new Set(["1", "2", "3", "5", "8", "13"]);
const SIZE = new Set(["1", "2", "5", "8", "13"]);
const TRI = new Set(["1", "2", "3"]);
const missing = [];
const grab = (flag, label, ok) => {
  const v = opt(flag);
  if (v === null || v === undefined || v === "") { missing.push(`${flag}（${label}）`); return null; }
  if (!ok.has(v)) { console.error(`❌ 拒立卡：${flag} 值非法「${v}」——只收 ${[...ok].join("/")}`); process.exit(1); }
  return Number(v);
};
const bv = grab("--bv", "商业价值", FIB);
const tc = grab("--tc", "时间紧迫", FIB);
const rr = grab("--rr", "风险消减/机会使能", FIB);
const size = grab("--size", "工程量", SIZE);
if (missing.length) {
  console.error(`❌ 拒立卡：缺 WSJF 必填分 ${missing.join("、")}`);
  console.error("   商业价值/时间紧迫/风险消减 ∈ 1/2/3/5/8/13；工程量 ∈ 1/2/5/8/13（档位映射 MICRO=1·小修=2·场景=5·结构=8·超大=13）");
  console.error(`   例：取号.mjs 立卡 ${prefix} "标题" "引子" --bv 3 --tc 2 --rr 2 --size 5`);
  process.exit(1);
}
const wsjf = Math.round(((bv + tc + rr) / size) * 100) / 100;
// SYS-59 bug 子类：ITIL Impact×Urgency 3×3 → P0-P3（急度管「多快灭」；WSJF 管「值不值得做」，两轴并存）
const kind = (opt("--kind") || "").trim().toLowerCase();
let itil = null;
if (kind === "bug") {
  if (opt("--priority")) { console.error("❌ 拒立卡：bug 卡优先级由 ITIL 矩阵推导，禁 --priority 覆盖（单源）"); process.exit(1); }
  const imp = grab("--impact", "ITIL 影响度", TRI);
  const urg = grab("--urgency", "ITIL 紧急度", TRI);
  if (missing.length) { console.error(`❌ 拒立卡：kind=bug 缺 ${missing.join("、")}（ITIL 3×3 必填）`); process.exit(1); }
  itil = { imp, urg, p: itilPriority(imp, urg) };
} else if (kind) {
  console.error(`❌ 拒立卡：未知 --kind「${kind}」（现支持 bug）`);
  process.exit(1);
}
const prio = itil ? itil.p : (opt("--priority") || "P2");
if (!/^P[0-4]$/.test(prio)) { console.error(`❌ 拒立卡：--priority 值非法「${prio}」（P0-P4）`); process.exit(1); }

// S2 锁式立卡：全局共享锁（驿站\共享\号段锁.lock——wx 在 NTFS 原子；两体系同锁=取号全局串行）；>60 秒=残锁强拆；最多等 10 秒
try { fs.mkdirSync(STATION_LOCK_DIR, { recursive: true }); } catch {}
const lock = SHARED_LOCK;
let fd = null;
for (let i = 0; i < 50; i++) {
  try { fd = fs.openSync(lock, "wx"); break; } catch (e) {
    if (e.code !== "EEXIST") throw e;
    try { if (Date.now() - fs.statSync(lock).mtimeMs > 60e3) { fs.rmSync(lock, { force: true }); continue; } } catch {}
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
}
if (fd === null) { console.error("❌ 取号锁占用超 10 秒——有别的立卡在进行或残锁未清，排查后重试"); process.exit(1); }

try {
  const id = `${prefix}-${globalNext(prefix)}`; // 锁内重新取号（S2 双账扫描；查号与落卡之间无窗）
  const no = id.split("-")[1];
  const now = new Date();
  const iso = now.toLocaleString("sv-SE").replace(" ", "T");
  const date = iso.slice(0, 10);
  // SYS-59 评分字段块（独立于 ```status——set-status.render_block 只重排固定键，放 status 块内会被改状态时丢弃）
  const pblk = ["```priority", `wsjf_bv: ${bv}`, `wsjf_tc: ${tc}`, `wsjf_rr: ${rr}`, `wsjf_size: ${size}`, `wsjf: ${wsjf}`,
    ...(itil ? ["kind: bug", `itil_impact: ${itil.imp}`, `itil_urgency: ${itil.urg}`] : []), `priority: ${prio}`, "```"].join("\n");
  const card = `
# ${id} ${title}

**分类**：M2 体系/治理 ｜ 标签：M3 平台/基建 ｜ **平台**：works ｜ **仓库**：（派单时填：产品仓 worktree／体系仓就地单——2026-10-02 去写死，卡点2）

\`\`\`status
phase: registered
branch: feat/${prefix.toLowerCase()}${no}
head: —
std: 简式
delivery_id: —
designer: —
dev: —
inspector: —
merge: —
actor: 设计师
updated_at: ${iso}
\`\`\`

${pblk}

**状态**：📌 **已立卡 @${date}**（引子：${noteParts.join(" ") || "（待补）"}）｜ **优先级**：${prio}

**规划件**：（change=<name>（store=mov-android） 或 豁免理由=<一句>）——**缺此行=派单质量缺陷**（2026-09-26 出件纪律·经验库 §十一）

## 范围
TODO

## 验收标准
TODO

## 红线
- 开工前核在途（串行纪律）；**交付形态**：worktree 绑定单＝不作 git commit（收口统一时点·由设计师合并位提交）／**体系仓就地单＝本仓就地 commit 交付**（先例＝2026-09-28 就地单 b495109）。〔模板禁裸单号——2026-09-30 扫尾裁定：模板自引用裸号会被取号全文扫描当 max ⇒ 号段虚跳（09-26 跳号案同病根·实验复现「模板裸号→取号虚跳」）；模板内引用一律写 commit 哈希/日期，不写「前缀-数字」〕
- **证据清单**：node 处理中心/机器闸/evidence-sums.mjs gen <证据目录> 生成 EVIDENCE_SHA256SUMS.txt（标准格式 hash␠␠path·sha256sum -c 可直接消费）。
- **交付件正文禁写会陈化的绑定值**（2026-09-28 体例·审验席三次同型后裁）：报告/证据说明的正文里**不写**报告自身 sha、证据 pin、信 id、合并 sha——一律**只写指针**（如「pin 见 SUMS 文件」「报告 sha 见信封」）；绑定值由清单承载体（DEL/SUMS/信封）承载。
- **交付登记不填 head**（2026-09-28 立·两次同型：交付方把**基点**填进 head ⇒ 卡面审计误判「已合未更新相位」并**给错药方**）：交付（delivered）时 **head 保持「—」**，head 只在**合并位**由设计师填入合并提交 sha。
- **交付冻结 patch 用 git diff HEAD --no-renames**（2026-09-28 验收席 F-2 采纳）：改名会被展开成「删旧＋增新」⇒ 与 git status -uall 逐件口径一致；**段数 MUST == 变集件数**（不等即查）。
- **改到代码面 ⇒ 交付报告必附「app 全量零新增红」读数**（2026-09-28 验收席 F-3 采纳）：省掉验收席每次代跑，防「交付面缺件」。
- **双实现同步红线**（mall 单必读·2026-09-10 立）：改动 「mall-web/**」 或 「app/src/main/assets/pages/mall/**」 的单——**改一侧 MUST 同批同步另一侧**（权威裁定＋逐页裁剪清单见 「mall-web/README.md」；漂移检查 「node scripts/mall-sync-check.mjs」，单侧漂移退出码 1）。
- **scope_extra**（超申报登记·2026-09-28 审验 F-3 采纳）：本单**超出卡面范围**的附带改动在此逐件登记（件名＋为什么），空则写「无」。
`;
  fs.appendFileSync(LIB, card, "utf-8");
  if (!SANDBOX) { // S2：水位投影随立卡刷新（真模式；失败不阻断——双账扫描才是真源）
    try {
      const cur = fs.existsSync(WATERMARK) ? JSON.parse(fs.readFileSync(WATERMARK, "utf-8")) : {};
      cur.per_prefix = cur.per_prefix || {};
      cur.per_prefix[prefix] = { max: Number(no), by: "安卓中国体系建设", at: iso };
      cur.updated_at = iso;
      fs.writeFileSync(WATERMARK, JSON.stringify(cur, null, 2) + "\n", "utf-8");
    } catch (e) { console.error(`⚠ 号段水位投影写失败（不阻断立卡）：${e.message}`); }
  }
  console.log(`✅ 立卡 ${id}：${title}（WSJF ${wsjf}·${prio}；全局锁+双账扫描 max+1${SANDBOX ? "·沙盒" : ""}）`);
  if (SANDBOX) console.log(`🛡 已拦真库写入：沙盒模式 → ${LIB}（真库 ${REAL_LIB} 零触）`); // SYS-104
} finally {
  fs.closeSync(fd);
  fs.rmSync(lock, { force: true });
}
