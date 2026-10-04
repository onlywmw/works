#!/usr/bin/env node
// 证据归档器 —— 已合单证据目录迁出角色根层，归档+迁移登记（2026-09-09 用户拍板的新管理标准）
// manifest 本身不可变（红线23）；旧路径凭据按 迁移登记 追溯。
// 用法：node evidence-archive.mjs <角色> [--execute]（默认 dry-run 只列不动）
//       node evidence-archive.mjs --self-test（临时树真跑一次迁移+目录 hash 验证，自清理）
// SYS-142（2026-09-30 硬化·09-29 一件占位致 158 件终态证据整批积压案）：①归档位占位等单件失败 ⇒ 跳过并报、
//   其余照常迁移（禁整批回滚·跳过件不入登记·重跑补迁幂等）；③0 文件空壳目录 ⇒ 告警不迁移（待人工确认）。
//   退出码：0=全成/无事 ｜ 2=有跳过件（需补跑）｜ 1=硬故障（hash 不齐等）
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// EV_SYS_ROOT 仅 --self-test 用：让临时树驱动同一套代码（生产路径不受影响）
const SYS = process.env.EV_SYS_ROOT ? path.resolve(process.env.EV_SYS_ROOT) : path.resolve(HERE, "..", "..");
if (process.argv.includes("--self-test")) runSelfTest();

const role = process.argv[2];
const execute = process.argv.includes("--execute");
if (!role) { console.log("用法：node evidence-archive.mjs <角色> [--execute]｜--self-test"); process.exit(1); }
const roleDir = path.join(SYS, role);
const EV_SUB = { "设计师": "证据数据", "验收员": "证据数据", "审验员": "证据数据" }; // 证据目录所在子层（程序员=根层无子层）；2026-09-30 设计师侧归一为 证据数据（同 evidence-index）

const arcDir = path.join(SYS, "处理中心", "归档", "证据", role);
const lib = fs.readFileSync(path.join(SYS, "处理中心", "工单库.md"), "utf8").replace(/\r\n/g, "\n"); // CRLF 硬化（2026-09-11 孤儿事故：python 文本模式写库致全 CRLF→正则 0 卡→6 组误判孤儿；与 SYS-36 同族）
const DEAD = new Set(["merged", "closed", "obsolete"]);

// SYS-22：目录 hash = 文件级 walk。原实现 readFileSync(目录) 必抛 EISDIR → 该段自引入起从未成功执行
//   （登记表 hash 行计数=0 实证）。相对路径 + 目录标记 + 文件字节入 hash，按名排序保证前后可比对。
function dirHash(root) {
  const h = crypto.createHash("sha256");
  const walk = (p, rel) => {
    const ents = fs.readdirSync(p, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of ents) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { h.update(`D:${r}\0`); walk(path.join(p, e.name), r); }
      else { h.update(`F:${r}\0`); h.update(fs.readFileSync(path.join(p, e.name))); h.update("\0"); }
    }
  };
  walk(root, "");
  return h.digest("hex").slice(0, 12);
}

const phases = {};
for (const m of lib.matchAll(/^# (UPG|SYS|W|S)-(\d+)[\s\S]*?```status\n([\s\S]*?)```/gm)) {
  phases[`${m[1]}-${parseInt(m[2], 10)}`] = (m[3].match(/^phase:\s*(\S+)/m) || [])[1] || "?";
}
const dir2id = (d) => {
  const m = d.match(/^(SYS|UPG|W|S)-?(\d+)/i);
  return m ? `${m[1].toUpperCase()}-${parseInt(m[2], 10)}` : null;
};

const evDir = EV_SUB[role] ? path.join(roleDir, EV_SUB[role]) : roleDir;
// SYS-33 修（原实现恒空转）：验收员/审验员的证据子层实际布局是 <证据子层>\<date>\<TICKET> 两层，
//   原过滤器按「工单名」筛第一层（那层全是 2026-09-10 这样的日期目录）→ 恒不命中 → 候选恒空。
//   策略：第一层名可解析出工单号即候选（程序员根层布局）；否则其名形如日期则下钻一层取工单目录。
//   rel = 相对 evDir 的层级路径，归档目标保留原层级（与既有归档布局 归档/证据/<角色>/证据数据/<date>/ 一致）。
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
// SYS-142 ③：目录树是否含至少一个文件（递归；0 文件=空壳——疑似残留/占位）
const hasAnyFile = (p) => fs.readdirSync(p, { withFileTypes: true }).some((e) => e.isFile() || (e.isDirectory() && hasAnyFile(path.join(p, e.name))));
// rel 相对**角色目录**（含证据子层），使归档目标 = 归档/证据/<角色>/<rel>，与既有归档布局
// （归档/证据/验收员/证据数据/2026-08-30/…）及迁移登记的旧→新纯前缀替换一致。
const dirs = [];
const P = (parts) => parts.filter(Boolean).join("/"); // 登记/报告一律正斜杠（跨平台稳定，同既有登记行）
for (const name of fs.readdirSync(evDir)) {
  const abs = path.join(evDir, name);
  if (!isDir(abs)) continue;
  if (dir2id(name)) { dirs.push({ d: name, rel: P([EV_SUB[role], name]) }); continue; }
  if (!DATE_RE.test(name)) continue;
  for (const sub of fs.readdirSync(abs)) if (dir2id(sub) && isDir(path.join(abs, sub))) dirs.push({ d: sub, rel: P([EV_SUB[role], name, sub]) });
}
const moves = [], stay = [], orphan = [], shells = [];
for (const { d, rel } of dirs) {
  const id = dir2id(d);
  const ph = id ? phases[id] : undefined;
  if (!id || ph === undefined) orphan.push({ d, id, ph });
  else if (DEAD.has(ph)) {
    // SYS-142 ③ 空壳预检：0 文件树疑似残留/占位 ⇒ 单独告警、跳出入池（待人工确认），不阻塞其余件
    if (hasAnyFile(path.join(roleDir, rel))) moves.push({ d, rel, id, ph });
    else shells.push({ d, rel, id, ph });
  }
  else stay.push({ d, id, ph });
}
const occupied = moves.filter(m => fs.existsSync(path.join(arcDir, m.rel))); // 归档位已有同名（多为补跑前已迁过一份）
console.log(`归档（已合/闭环/作废）：${moves.length} ｜ 留守（在途）：${stay.length} ｜ 孤儿（库无卡，不动待追查）：${orphan.length}`);
if (orphan.length) orphan.forEach(o => console.log(`  ❓ 孤儿: ${o.d}（留给卫生员追查，不自动归档）`));
if (shells.length) { console.log(`  ⚠️ 空壳目录 ${shells.length} 件（0 文件·疑似残留/占位——已跳过不迁移，请人工确认后处理）：`); shells.forEach(s => console.log(`     · ${role}/${s.rel}`)); }
if (occupied.length) { console.log(`  ⚠️ 目标占位 ${occupied.length} 件（归档位已有同名，迁移将失败——需人工定名后再补跑）：`); occupied.forEach(o => console.log(`     · ${role}/${o.rel}（归档位已存在）`)); }
if (!execute) {
  if (process.argv.includes("--list")) { // 补跑前给设计师核的待迁清单（SYS-33 红线：干跑清单先报确认）
    moves.forEach(m => console.log(`  → ${m.id} [${m.ph}] ${role}/${m.rel}`));
    stay.forEach(s => console.log(`  · 留守 ${s.id} ${role}/${s.d}`));
  }
  console.log("（dry-run——加 --execute 执行迁移）");
  process.exit(0);
}

fs.mkdirSync(arcDir, { recursive: true });
const reg = path.join(SYS, "处理中心", "归档", "证据", "迁移登记.md");
// 登记行日期=本地日期。SYS-33 吸收（34 巡观察①）：原 toISOString()=UTC，UTC+ 时区跨零点补跑会把日期写成前一天。
const d0 = new Date();
const today = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, "0")}-${String(d0.getDate()).padStart(2, "0")}`;
let rows = "";
const doneMoves = []; // 已改名项——hash 不齐时整体回滚，登记不写（SYS-22「不一致→报错不推进」）
const skipped = [];   // SYS-142 ①：单件失败（占位/EPERM 等）跳过并报——不整批回滚，其余照常
const rollback = () => { for (const d of [...doneMoves].reverse()) { try { fs.renameSync(d.newP, d.oldP); } catch {} } };
const fail = (msg) => { console.log(`❌ ${msg}`); process.exit(1); };
for (const m of moves) {
  const oldP = path.join(roleDir, m.rel);
  const newP = path.join(arcDir, m.rel);
  const oldH = dirHash(oldP); // 迁移前：旧目录逐文件 hash 合并
  try { fs.mkdirSync(path.dirname(newP), { recursive: true }); fs.renameSync(oldP, newP); }
  catch (e) {
    // SYS-142 ①：占位/单件失败 ⇒ 跳过并报，其余照常（旧行为＝整批回滚——09-29 一件占位致 158 件全批积压）
    skipped.push({ ...m, why: e.code || e.message });
    console.log(`  ⏭️ 跳过 ${m.id} ${role}/${m.rel}：${e.code || ""} ${e.message}（跳过件不入登记；定名/清理后重跑补迁）`);
    continue;
  }
  const newH = dirHash(newP); // 迁移后：新位复算比对
  if (oldH !== newH) { try { fs.renameSync(newP, oldP); } catch {} rollback(); fail(`目录 hash 迁移前后不一致（${m.id}：${oldH}→${newH}）——已整体回滚，登记不写`); }
  doneMoves.push({ oldP, newP });
  rows += `| ${today} | ${m.id} | ${m.ph} | ${role}/${m.rel}/ | 归档/证据/${role}/${m.rel}/ | ${oldH}→${newH} ✅ |\n`;
}
if (rows) { // 有已迁件才写登记（全跳过 ⇒ 登记不写）
  if (!fs.existsSync(reg)) {
    fs.writeFileSync(reg, `# 证据归档迁移登记\n\n> **2026-09-09 用户拍板**：已合单证据归档出角色根层（新管理标准）；**manifest 不可变（红线23），旧路径凭据一律按本登记映射追溯**。工具：\`node 处理中心\机器闸\evidence-archive.mjs <角色> --execute\`\n\n| 日期 | 工单 | phase | 原路径 | 归档路径 |\n|---|---|---|---|---|\n${rows}`, "utf-8");
  } else {
    fs.appendFileSync(reg, rows, "utf-8");
  }
}
const movedN = doneMoves.length;
if (movedN) console.log(`✅ 迁移 ${movedN} 个目录 → ${arcDir}\n📒 迁移登记追加 → ${reg}`);
if (skipped.length) console.log(`⚠️ 跳过 ${skipped.length} 件（见上·定名/清理后重跑补迁）：${skipped.map((s) => s.id || s.d).join("、")}`);
if (!movedN && !skipped.length) console.log(`ℹ️ 无待归档（0 件）——该角色无终态单证据产出`);
console.log(`ARCHIVE_MIGRATED=${movedN}`); // SYS-33：set-status 判定用机器可读计数（禁裸子串）
process.exit(skipped.length ? 2 : 0); // SYS-142：有跳过件 ⇒ rc=2（钩子据此报红）；0=全成

// ── 自测：临时体系树真跑迁移 + 目录 hash 验证（必须实际产出 hash 行），结束清理 ──
function mkSelfTree(root) {
  fs.mkdirSync(path.join(root, "处理中心", "归档", "证据"), { recursive: true });
  fs.writeFileSync(path.join(root, "处理中心", "工单库.md"), [
    "# UPG-1 已合单样例", "", "```status", "phase: merged", "```", "",
    "# UPG-2 在途样例", "", "```status", "phase: in_progress", "```", "",
  ].join("\n"), "utf-8");
  const ev = path.join(root, "验收员", "证据数据", "UPG-1-evidence");
  fs.mkdirSync(path.join(ev, "shots"), { recursive: true });
  fs.writeFileSync(path.join(ev, "log.txt"), "证据一行\n", "utf-8");
  fs.writeFileSync(path.join(ev, "shots", "a.bin"), Buffer.from([1, 2, 3, 4, 5]));
  const stay = path.join(root, "验收员", "证据数据", "UPG-2-evidence");
  fs.mkdirSync(stay, { recursive: true });
  fs.writeFileSync(path.join(stay, "wip.txt"), "在途\n", "utf-8");
  return { ev, stay };
}
function mkSelfDatedTree(root) {
  fs.mkdirSync(path.join(root, "处理中心", "归档", "证据"), { recursive: true });
  fs.writeFileSync(path.join(root, "处理中心", "工单库.md"), [
    "# UPG-1 已合单样例", "", "```status", "phase: merged", "```", "",
    "# UPG-2 在途样例", "", "```status", "phase: in_progress", "```", "",
  ].join("\n"), "utf-8");
  // SYS-33 变异样例：验收员真实布局 = 证据数据\<date>\<TICKET>（旧码按工单名筛第一层 → 恒空）
  const ev = path.join(root, "验收员", "证据数据", "2026-01-02", "UPG-1-evidence");
  fs.mkdirSync(path.join(ev, "L2R1"), { recursive: true });
  fs.writeFileSync(path.join(ev, "log.txt"), "两层样例\n", "utf-8");
  fs.writeFileSync(path.join(ev, "L2R1", "a.bin"), Buffer.from([9, 8, 7]));
  fs.mkdirSync(path.join(root, "验收员", "证据数据", "2026-01-02", "UPG-2-evidence"), { recursive: true });
  return ev;
}
// SYS-142 ① 夹具：两件终态（一件可迁、一件被占位）——占位不再整批中止
function mkSelfTwoMerged(root) {
  fs.mkdirSync(path.join(root, "处理中心", "归档", "证据"), { recursive: true });
  fs.writeFileSync(path.join(root, "处理中心", "工单库.md"), [
    "# UPG-1 已合单样例", "", "```status", "phase: merged", "```", "",
    "# UPG-3 已合单样例", "", "```status", "phase: merged", "```", "",
  ].join("\n"), "utf-8");
  const mk = (n) => { const p = path.join(root, "验收员", "证据数据", `UPG-${n}-evidence`); fs.mkdirSync(path.join(p, "L2"), { recursive: true }); fs.writeFileSync(path.join(p, "log.txt"), `证据 ${n}\n`, "utf-8"); return p; };
  return { ev1: mk(1), ev3: mk(3) };
}
// SYS-142 ③ 夹具：终态件 A=0 文件空壳（含子目录无文件）、终态件 B=非空
function mkSelfShellTree(root) {
  fs.mkdirSync(path.join(root, "处理中心", "归档", "证据"), { recursive: true });
  fs.writeFileSync(path.join(root, "处理中心", "工单库.md"), [
    "# UPG-1 已合单样例", "", "```status", "phase: merged", "```", "",
    "# UPG-4 已合单样例", "", "```status", "phase: merged", "```", "",
  ].join("\n"), "utf-8");
  const shell = path.join(root, "验收员", "证据数据", "UPG-1-evidence");
  fs.mkdirSync(path.join(shell, "sub"), { recursive: true }); // 0 文件空壳
  const real = path.join(root, "验收员", "证据数据", "UPG-4-evidence");
  fs.mkdirSync(real, { recursive: true });
  fs.writeFileSync(path.join(real, "log.txt"), "真件\n", "utf-8");
  return { shell, real };
}
function runSelfTest() {
  const self = process.argv[1];
  let pass = 0, fail = 0;
  const t = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "✅" : "❌"} ${name}${detail ? "　" + detail : ""}`); };
  const call = (root, args) => {
    try { return { ok: true, out: execFileSync(process.execPath, [self, ...args], { env: { ...process.env, EV_SYS_ROOT: root }, encoding: "utf-8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }) }; }
    catch (e) { return { ok: false, out: String(e.stdout || "") + String(e.stderr || "") }; }
  };
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "ev-arch-st-"));
  const base2 = fs.mkdtempSync(path.join(os.tmpdir(), "ev-arch-st2-"));
  const base3 = fs.mkdtempSync(path.join(os.tmpdir(), "ev-arch-st3-"));
  const base4 = fs.mkdtempSync(path.join(os.tmpdir(), "ev-arch-st4-"));
  try {
    const fx = mkSelfTree(base);
    const dry = call(base, ["验收员"]);
    t("dry-run 列式不崩（原 EISDIR 已除）", dry.ok && /归档（已合\/闭环\/作废）：1/.test(dry.out), (dry.out.trim().split("\n")[0] || "").slice(0, 80));

    const ex = call(base, ["验收员", "--execute"]);
    const arcEv = path.join(base, "处理中心", "归档", "证据", "验收员", "证据数据", "UPG-1-evidence");
    const reg = path.join(base, "处理中心", "归档", "证据", "迁移登记.md");
    const regTxt = fs.existsSync(reg) ? fs.readFileSync(reg, "utf-8") : "";
    const hashRow = regTxt.split("\n").find((l) => /UPG-1/.test(l) && /[0-9a-f]{12}→[0-9a-f]{12}/.test(l)) || "";
    t("登记表真产出目录 hash 行（打破「加完没跑过」）", !!hashRow, hashRow.trim().slice(0, 130));
    t("迁前≡迁后（标 ✅ 非 ⚠️变）", /✅/.test(hashRow) && !/⚠️变/.test(hashRow));
    // SYS-33 吸收（34 巡观察①）：登记行日期须本地口径——UTC 口径在 UTC+ 时区跨零点会写成前一天
    const locDate = ((d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)(new Date());
    const utcDate = new Date().toISOString().slice(0, 10);
    const dateCell = (hashRow.split("|").map((s) => s.trim())[1] || "");
    t("登记行日期=本地日期（非 UTC，跨零点不写前一天）", dateCell === locDate && (locDate === utcDate || dateCell !== utcDate),
      `行日期=${dateCell} 本地=${locDate} UTC=${utcDate}`);
    t("证据目录（含子层+二进制件）整体迁至归档位且字节等价",
      fs.existsSync(path.join(arcEv, "shots", "a.bin")) && fs.readFileSync(path.join(arcEv, "shots", "a.bin")).equals(Buffer.from([1, 2, 3, 4, 5])),
      `a.bin=${fs.existsSync(path.join(arcEv, "shots", "a.bin"))}`);
    t("原位置已清空", !fs.existsSync(fx.ev));
    t("在途单留守未动", fs.existsSync(path.join(fx.stay, "wip.txt")));
    t("--execute 退出码 0 且报迁移计数", ex.ok && /迁移 1 个目录/.test(ex.out), (ex.out.trim().split("\n").pop() || "").slice(0, 90));

    // SYS-142 ① 变异亲杀：占位单件 ⇒ 跳过并报、其余件照常迁移、非零退（禁整批回滚——09-29 一件占位致 158 件积压案）
    const fx2 = mkSelfTwoMerged(base2);
    const occupied = path.join(base2, "处理中心", "归档", "证据", "验收员", "证据数据", "UPG-1-evidence");
    fs.mkdirSync(occupied, { recursive: true });
    fs.writeFileSync(path.join(occupied, "occupied.txt"), "占位挡道", "utf-8");
    const r2 = call(base2, ["验收员", "--execute"]);
    const reg2 = path.join(base2, "处理中心", "归档", "证据", "迁移登记.md");
    const regTxt2 = fs.existsSync(reg2) ? fs.readFileSync(reg2, "utf-8") : "";
    const arc3m = path.join(base2, "处理中心", "归档", "证据", "验收员", "证据数据", "UPG-3-evidence");
    t("占位单件 ⇒ 非零退且其余件照常迁移（不整批回滚）",
      !r2.ok && fs.existsSync(path.join(arc3m, "log.txt")),
      `退出非0=${!r2.ok} 其余件已迁=${fs.existsSync(path.join(arc3m, "log.txt"))}`);
    t("占位件列名报出＋原目录原地（不丢件）",
      /UPG-1/.test(r2.out) && fs.existsSync(path.join(fx2.ev1, "log.txt")),
      `已报出=${/UPG-1/.test(r2.out)} 原目录在位=${fs.existsSync(path.join(fx2.ev1, "log.txt"))}`);
    t("登记只写已迁件·占位件不入登记（登记不写口径收窄）",
      /UPG-3/.test(regTxt2) && !/UPG-1/.test(regTxt2),
      `含UPG-3=${/UPG-3/.test(regTxt2)} 含UPG-1=${/UPG-1/.test(regTxt2)}`);
    // 重跑幂等：补定名/清占位后重跑 ⇒ 仅补迁占位件、计数与登记正确
    fs.rmSync(occupied, { recursive: true, force: true });
    const r2b = call(base2, ["验收员", "--execute"]);
    const regTxt2b = fs.readFileSync(reg2, "utf-8");
    const arc1 = path.join(base2, "处理中心", "归档", "证据", "验收员", "证据数据", "UPG-1-evidence");
    const reg1Rows = regTxt2b.split("\n").filter((l) => /UPG-1/.test(l)).length;
    t("清占位重跑：仅补迁占位件（计数=1·登记恰 +1 行·幂等）",
      r2b.ok && /ARCHIVE_MIGRATED=1/.test(r2b.out) && fs.existsSync(path.join(arc1, "log.txt")) && reg1Rows === 1,
      `补迁=${fs.existsSync(path.join(arc1, "log.txt"))} 登记UPG-1行=${reg1Rows}`);
    const r2c = call(base2, ["验收员", "--execute"]);
    t("再跑幂等：0 件＋无待归档（不误报）",
      /无待归档/.test(r2c.out) && /ARCHIVE_MIGRATED=0/.test(r2c.out),
      (r2c.out.trim().split("\n")[0] || "").slice(0, 60));

    // SYS-33 变异亲杀：真实两层布局（证据数据\<date>\<TICKET>）——旧码按工单名筛第一层必空，新码须命中
    const evDated = mkSelfDatedTree(base3);
    const dry3 = call(base3, ["验收员"]);
    t("两层布局候选命中（原恒空的根因案）", dry3.ok && /归档（已合\/闭环\/作废）：1/.test(dry3.out), (dry3.out.trim().split("\n")[0] || "").slice(0, 80));
    t("dry-run 不误报迁移（无「迁移 N 个目录」行）", !/迁移 \d+ 个目录/.test(dry3.out));
    const ex3 = call(base3, ["验收员", "--execute"]);
    const arc3 = path.join(base3, "处理中心", "归档", "证据", "验收员", "证据数据", "2026-01-02", "UPG-1-evidence");
    t("两层迁移到归档保留日期层级且字节等价",
      ex3.ok && fs.existsSync(path.join(arc3, "L2R1", "a.bin")) && fs.readFileSync(path.join(arc3, "L2R1", "a.bin")).equals(Buffer.from([9, 8, 7])) && !fs.existsSync(evDated),
      `落位=${fs.existsSync(arc3)}`);
    t("--execute 报机器可读迁移计数 ARCHIVE_MIGRATED=1", /ARCHIVE_MIGRATED=1/.test(ex3.out), (ex3.out.trim().split("\n").pop() || "").slice(0, 60));
    t("在途同类（UPG-2）留守未动", fs.existsSync(path.join(base3, "验收员", "证据数据", "2026-01-02", "UPG-2-evidence")));
    const r3dup = call(base3, ["验收员", "--execute"]);
    t("重跑幂等：无待归档 + 计数 0（不误报已归档）",
      /无待归档/.test(r3dup.out) && /ARCHIVE_MIGRATED=0/.test(r3dup.out), (r3dup.out.trim().split("\n")[0] || "").slice(0, 60));

    // SYS-142 ③ 变异亲杀：0 文件空壳 ⇒ 告警不迁移；非空件照常且不误报
    const fx4 = mkSelfShellTree(base4);
    const r4 = call(base4, ["验收员", "--execute"]);
    const arc4 = path.join(base4, "处理中心", "归档", "证据", "验收员", "证据数据", "UPG-4-evidence");
    t("空壳目录告警在场（恰 1 件）且不阻塞其余件迁移",
      /空壳目录 1 件/.test(r4.out) && /UPG-1/.test(r4.out) && fs.existsSync(path.join(arc4, "log.txt")),
      `告警=${/空壳目录 1 件/.test(r4.out)} 非空件已迁=${fs.existsSync(path.join(arc4, "log.txt"))}`);
    t("空壳件未迁移（待人工确认）·非空件不误报",
      r4.ok && fs.existsSync(fx4.shell) && !fs.existsSync(path.join(base4, "处理中心", "归档", "证据", "验收员", "证据数据", "UPG-1-evidence")),
      `空壳原地=${fs.existsSync(fx4.shell)} rc0=${r4.ok}`);
  } catch (e) {
    t("self-test 全程未抛异常", false, String(e.message).slice(0, 200));
  }
  fs.rmSync(base, { recursive: true, force: true });
  fs.rmSync(base2, { recursive: true, force: true });
  fs.rmSync(base3, { recursive: true, force: true });
  fs.rmSync(base4, { recursive: true, force: true });
  console.log(fail ? `❌ self-test 结果：${pass} 过 / ${fail} 败` : `✅ self-test 全绿（${pass} 案全过）`);
  process.exit(fail ? 1 : 0);
}
