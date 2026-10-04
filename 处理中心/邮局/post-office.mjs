#!/usr/bin/env node
// -*- coding: utf-8 -*-
// MOV 邮局 —— 四角色信件触发层（机器只出 flag，人终裁）
//
// 职责边界（勿越）：
//   邮局 = 通知层（信件的收发/回执/归档/校验）
//   工单库 = 状态层（status 块唯一权威，邮局绝不改写）
//   git = 代码层（邮局绝不碰 merge/push）
//
// 用法：
//   node post-office.mjs init                          # 建邮箱树
//   node post-office.mjs status                        # 四格邮况（谁有未读信）
//   node post-office.mjs send --to 程序员 --type 派单 --re "UPG-126 批1" \
//        --payload <文件路径> [--body "一句话"] [--from 设计师]
//   node post-office.mjs read <角色> [序号|id]          # 人看信：打印信封+payload 摘要
//   node post-office.mjs done <信id> --note "完成/打回理由" [--from 角色]  # 销信：归档+自动回执给发件人；只销 --from/POST_ROLE 本角色 INBOX 的信（SYS-12）
//   node post-office.mjs check                         # 全库信件校验（信封合法性/payload 存在/hash 一致）
//
// 环境变量 POST_ROLE：各窗口设自己的角色（防串窗误发）；send 时 --from 与之不符即拒（--force 可越，慎用）。
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { newId } from "../看板/lib/envelope.mjs"; // SYS-20：ID 生成收敛为唯一通道（本地实现已删）

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.POST_ROOT || path.join(HERE, "邮箱");
const ROLES = ["设计师", "程序员", "验收员", "审验员", "巡检台", "流水线"];
const TYPES = ["派单", "验收邀请", "审验邀请", "合并邀请", "裁决", "打回", "回执", "通知", "卫生通报", "卫生简报", "告警", "疯狗", "挂起"]; // 卫生通报=巡检台→设计师专线信型（闭环哨兵追踪，2026-09-10）；合并邀请=引擎派工合并位直写；裁决=卡单哨兵通报设计师；疯狗=疯狗哨兵咬信（有信没动静）；挂起=挂起制知会/复工信（现实条件不满足登记待命 @2026-09-10）
const ARCHIVE = path.join(ROOT, "归档");

const enc = (s) => s;
const out = (...a) => console.log(...a.map(enc));
const die = (msg) => { out(`❌ ${msg}`); process.exit(1); };
// 信件 ID 生成见 ../看板/lib/envelope.mjs newId（SYS-20 单源：本地实现已删，勿再写第三份）
const sha256 = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 16);
const inbox = (role) => path.join(ROOT, role, "INBOX");

function parseArgs(argv) {
  // 2026-09-30 04:2x 修（巡检台实测·连锁两坑）：原实现 `args[k] = argv[++i] ?? ""` 对**裸旗标**会
  //   ①无值⇒空串（假值 ⇒ 旗标看似存在实则失效）②有后续参数⇒**吞掉它**（`--inline-ack --body xxx`
  //   ⇒ body 被吃、信件空正文发出——静默失败，比报错更危险）。
  //   改：下一参数缺失或也是旗标（以 -- 开头）⇒ 判 true；否则取值。裸旗标从此按**存在**语义工作。
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const k = argv[i].slice(2);
      const nxt = argv[i + 1];
      if (nxt === undefined || nxt.startsWith("--")) args[k] = true;
      else { args[k] = nxt; i++; }
    } else args._.push(argv[i]);
  }
  return args;
}

function listLetters(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(".md")).sort();
}

function readLetter(file) {
  const raw = fs.readFileSync(file, "utf-8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const env = {};
  if (m) for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (kv) env[kv[1]] = kv[2];
  }
  return { env, body: m ? m[2].trim() : raw, file };
}

// 找信：role 给定时只扫该角色 INBOX（SYS-12——防 done 跨角色误销他人信）；不给时保留全角色扫描（兼容旧调用）
function findLetter(id, role) {
  const boxes = role ? [inbox(role)] : ROLES.map(inbox);
  for (const dir of boxes) {
    for (const f of listLetters(dir)) {
      const L = readLetter(path.join(dir, f));
      if (L.env.id === id) return { ...L, role: role || path.basename(dir), dir };
    }
  }
  for (const f of listLetters(ARCHIVE)) {
    const L = readLetter(path.join(ARCHIVE, f));
    if (L.env.id === id) return { ...L, role: "归档", dir: ARCHIVE };
  }
  return null;
}

function cmdInit() {
  for (const role of ROLES) fs.mkdirSync(inbox(role), { recursive: true });
  fs.mkdirSync(ARCHIVE, { recursive: true });
  out(`✅ 邮箱树就绪：${ROOT}`);
  out(`   ${ROLES.join(" / ")} 各含 INBOX；归档区 ${ARCHIVE}`);
}

function cmdSend(a) {
  const to = a.to, from = a.from || process.env.POST_ROLE;
  if (!to || !ROLES.includes(to)) die(`--to 必须是：${ROLES.join("/")}`);
  if (!from) die("缺发件人：用 --from 或在窗口预设 set POST_ROLE=<角色>");
  if (!ROLES.includes(from)) die(`--from 必须是：${ROLES.join("/")}`);
  if (from !== process.env.POST_ROLE && process.env.POST_ROLE && !process.argv.includes("--force"))
    die(`本窗口 POST_ROLE=${process.env.POST_ROLE}，却以 ${from} 发信——串窗了？确认无误加 --force`);
  if (!a.type || !TYPES.includes(a.type)) die(`--type 必须是：${TYPES.join("/")}`);
  if (!a.re) die("缺 --re（事由，如：UPG-126 批1 派单）");
  // 2026-09-26 反引号闸（当日三起同坑）：shell 在进脚本前就会吃掉未转义反引号段（路径/参数/文件名静默消失）。
  // 无法在脚本内拦 shell 层——修法=走 --body-file（不走 shell）；本闸拦「已转义进入脚本」的残留反引号，提示改用「」。
  // body-file 优先（文件内容原样入信·反引号合法——不经 shell）。
  // 2026-09-26 P3（审验员 LTR-20260926-175627-814-77l）：文件来源正文**豁免**反引号判定
  // （原实现把读入后的 a.body 一并拦 ⇒ 与注释/文案『或走 --body-file』不一致·把人引向死路）。
  const bodyFromFile = !!a["body-file"];
  if (bodyFromFile) {
    const bf = path.resolve(a["body-file"]);
    if (!fs.existsSync(bf)) die(`--body-file 不存在：${bf}`);
    a.body = fs.readFileSync(bf, "utf-8");
  }
  const checks = bodyFromFile ? [["--re", a.re]] : [["--body", a.body], ["--re", a.re]];
  // 2026-09-30 04:4x 空正文闸（巡检台回执 `…e98` 建议·吸取我 04:20 那封「空正文信"事故）：
  //   正文为空/纯空白 ⇒ **拒发**。理由：空正文信件在收件方看来像「对方只发了个标题」（弱证据·无法行动），
  //   且历史上它是**静默失败**的产物（参数被吞/内容被 shell 吃掉）—— 它不是合法意图，而是故障残影。
  if (bodyFromFile) {
    const b = String(a.body || "").trim();
    if (!b) die(`正文为空（--body-file 内容空白）：${path.resolve(a["body-file"])}——请写入内容或删掉该空文件。本闸 fail-closed。`);
  } else if (typeof a.body === "string") {
    if (!a.body.trim()) die("正文为空（--body 空白）——空正文信拒发（它通常是参数被吞/shell 吃字的残影，不是合法意图）。");
  } else {
    die("缺正文：请给 --body-file <文件>（推荐）或 --inline-ack --body \"…\"。");
  }

  // 2026-09-28 防呆（设计师连踩多起后立）：内联 --body 有两个不可逆风险——
  //   ①shell 先做反引号/命令替换（吃掉内容，脚本内无法察觉）②多行/引号易被转义搅乱。
  // 处置：内联 body 一律**回显实际收到的正文**（让人当场看见有没有被吃），并在有风险字符时**拒发**。
  // 2026-09-30 加固（巡检台·设计师 01:21 建议 staged）：内联 --body 在 shell 层就已被吃（脚本无法察觉）——
  //   唯一有效口径＝强制 --body-file；先行 **warn + 计次**（观察一周再转 fail-closed）；--inline-ack 显式承认可静音。
  // 2026-09-30 04:2x fail-closed 升级（巡检台同意·设计师落）：**默认拒收内联 --body**（除非 --inline-ack）。
  // 口径三条（巡检台提）：①**拒收不看内容**——shell 在进脚本前就吃掉了反引号/命令替换/重定向，脚本拿到
  //   的文本已不可信（"看起来正常"恰恰是最危险的形态）⇒ 判断依据只能是"是不是内联"本身。
  //   ②**ack 也计次**（留痕不为难合法用法）③**先记再死**（先写计次再 die，事故可追）。
  // 代价实录（5 起）：19:57／23:5x／01:17（＋体系根 4 个 0 字节件）／04:14（＋体系根 3 个 0 字节件）——
  //   第 4 类危害＝**行首 ">" 被 shell 当重定向 ⇒ 在仓库根创建零字节垃圾件**（阻 layout 根层白名单）。
  // 2026-09-30 04:2x 修（巡检台实测·我补丁的 bug）：parseArgs 对**裸旗标**取下一个参数作值（无值⇒空串·**有值⇒吃掉它**）
  //   ⇒ `!a["inline-ack"]` 永远为真（我新加的逃生口反而不可用）；既有 `!a.force` **同病**（串窗覆盖从未真正生效）。
  //   ⇒ 裸旗标一律以 `process.argv.includes` 判**存在**（不看值）。
  const INLINE_ACK = process.argv.includes("--inline-ack");
  if (!bodyFromFile && typeof a.body === "string") {
    const line = `[${new Date().toLocaleString("sv-SE")}] ${a.from} → ${a.to} | re=${String(a.re || "").slice(0, 40)} | 长度=${a.body.length} | ack=${INLINE_ACK ? "YES" : "NO"}\n`;
    try { fs.appendFileSync(path.join(HERE, "内联正文计次.log"), line); } catch {}   // ③ 先记
    if (!INLINE_ACK) {
      die("内联 --body 已停用（fail-closed）：shell 在进脚本前就会吃掉反引号/命令替换/重定向——脚本层无法察觉；2026-09-30 共 5 起事故（含两次在体系根创建 0 字节垃圾件）。请改用 --body-file <文件>（正文写文件·原样入信·反引号合法·建议长文一律走它）。确需内联：加 --inline-ack（仍会计次留痕）。");
    }
    console.error("⚠ --inline-ack：已放行内联正文（计次留痕）——shell 已展开的字符不可恢复，请核对回显内容");
  }
  if (!bodyFromFile && typeof a.body === "string") {
    const risky = /[$`!]/.test(a.body);
    if (risky) {
      die("内联 --body 含 shell 展开风险字符（$ ` !）——请改用 --body-file（正文写文件·原样入信）。本闸 fail-closed。");
    }
    if (a.body.length > 200) {
      console.log(`⚠ 内联正文 ${a.body.length} 字（建议 >200 字走 --body-file）——回显实际收到内容供你核对：`);
      console.log("─── 回显开始 ───");
      console.log(a.body);
      console.log("─── 回显结束 ───");
    }
  }
  for (const [flag, val] of checks) {
    if (typeof val === "string" && val.includes("`")) {
      const seg = val.split("`").filter((_, i) => i % 2 === 1).slice(0, 3);
      die(`${flag} 含反引号（shell 会先执行吃掉，当日已踩三起）——改用「」或走 --body-file（文件来源正文豁免本闸）。涉：${seg.map((s) => "「" + s.slice(0, 24) + "」").join("、")}`);
    }
  }
  let payloadLine = "payload: —\nsha: —";
  if (a.payload) {
    const p = path.resolve(a.payload);
    if (!fs.existsSync(p)) die(`payload 文件不存在：${p}`);
    payloadLine = `payload: ${p}\nsha: ${sha256(p)}`;
  }
  fs.mkdirSync(inbox(to), { recursive: true });
  // SYS-20 写信防覆盖：wx 独占写；EEXIST 撞名 → 重生成 ID 重试（≤3 次，仍败报错不覆盖）
  let id = "", file = "";
  for (let attempt = 1; attempt <= 3; attempt++) {
    id = newId();
    const letter = [
      "---",
      `id: ${id}`,
      `from: ${from}`,
      `to: ${to}`,
      `type: ${a.type}`,
      `re: ${a.re}`,
      `ref: ${a.ref || "—"}`, // 引用前信（SYS-13 字段常驻：带 --ref 写值；不带写 —。卫生专线处置信 ref=通报 id，哨兵据此判闭环）
      `created: ${new Date().toLocaleString("sv-SE")}`,
      `status: 未读`,
      payloadLine,
      "---",
      "",
      a.body || "",
      "",
    ].join("\n");
    file = path.join(inbox(to), `${id}.md`);
    try { fs.writeFileSync(file, letter, { encoding: "utf-8", flag: "wx" }); break; }
    catch (e) {
      if (e.code !== "EEXIST") throw e;
      if (attempt === 3) die(`信件 ID 连撞 3 次（${id}）——已停止写入（不覆盖），请重发`);
    }
  }
  // SYS-38 回复即销（用户令 2026-09-12）：非回执信 ref 指向自己 INBOX 的信 → 原信自动销（归档）——当事人语义=已处置，不留双份
  if (a.ref && a.ref !== "—") {
    try {
      const inboxDir = inbox(from);
      const hit = fs.readdirSync(inboxDir).filter((x) => x.endsWith(".md")).find((f) => {
        try { return readLetter(path.join(inboxDir, f)).env.id === a.ref; } catch { return false; }
      });
      if (hit) {
        fs.mkdirSync(ARCHIVE, { recursive: true });
        const base = hit;
        let dest = path.join(ARCHIVE, base);
        if (fs.existsSync(dest)) { const stem = base.replace(/\.md$/, ""); let n2 = 2; while (fs.existsSync(path.join(ARCHIVE, `${stem}-dup${n2}.md`))) n2++; dest = path.join(ARCHIVE, `${stem}-dup${n2}.md`); }
        fs.renameSync(path.join(inboxDir, hit), dest);
        out(`   🔒 回复即销（SYS-38）：原信 ${a.ref} 自动销归档（${path.basename(dest)}）`);
      }
    } catch {}
  }
  out(`📨 ${from} → ${to}｜${a.type}｜${a.re}`);
  out(`   信件：${file}`);
  out(`   提醒对方窗口：收信`);
}

function cmdRead(a) {
  const role = a._[0];
  if (!role || !ROLES.includes(role)) die(`用法：read <角色>　（角色：${ROLES.join("/")}}）`);
  const letters = listLetters(inbox(role));
  if (!letters.length) return out(`📭 ${role} 收件箱为空`);
  const idx = a._[1] ? letters.findIndex(f => f.includes(a._[1])) : 0;
  if (idx < 0) die(`没找到 ${a._[1]} 对应的信`);
  const L = readLetter(path.join(inbox(role), letters[idx]));
  out(`──────────────────────────────`);
  out(`📬 ${L.env.id}｜${L.env.from} → ${L.env.to}｜${L.env.type}`);
  out(`   事由：${L.env.re}`);
  out(`   时间：${L.env.created}｜状态：${L.env.status}`);
  if (L.env.payload && L.env.payload !== "—") {
    const ok = fs.existsSync(L.env.payload);
    const shaOk = ok && L.env.sha === sha256(L.env.payload);
    out(`   payload：${L.env.payload} ${ok ? (shaOk ? "✅存在且hash一致" : "⚠️存在但hash不符——文件被改过？") : "❌丢失"}`);
    if (ok) {
      out(`   ── payload 开头 ──`);
      for (const line of fs.readFileSync(L.env.payload, "utf-8").split(/\r?\n/).filter(l => l.trim()).slice(0, 25))
        out(`   │ ${line.slice(0, 110)}`);
    }
  }
  out(`   ── 正文 ──`);
  out(L.body || "   （无）");
  out(`──────────────────────────────`);
  out(`共 ${letters.length} 封未办。`);
}

function cmdDone(a) {
  const id = a._[0];
  const actor = a.from || process.env.POST_ROLE;
  if (!id || !a.note) die("用法：done <信id> --note \"完成情况/打回理由\"");
  if (!actor) die("done 需 --from <角色>（或预设 POST_ROLE）——防跨角色误销他人信箱（SYS-12）");
  if (!ROLES.includes(actor)) die(`--from 必须是：${ROLES.join("/")}`);
  const L = findLetter(id, actor);
  if (!L) die(`在 ${actor} 收件箱找不到信：${id}（他角色信箱的信一律不销——SYS-12 防误销）`);
  if (L.role === "归档") die(`该信已在归档：${id}`);
  // ★fail-closed 守卫（2026-09-28 立·第三次同型后）：卫生通报/告警类**必须先有 ref 处置信**才许销。
  // 根因：note 里写了结论 ≠ 处置（哨兵只认「ref 指向它的非回执信」）⇒ 本席三次同型犯 ⇒ 改成机器拦。
  if (["卫生通报", "告警"].includes(L.env.type)) {
    const roots = [];
    try {
      for (const r of fs.readdirSync(BOX)) {
        const inbox = path.join(BOX, r, "INBOX");
        if (fs.existsSync(inbox)) roots.push({ dir: inbox, from: r });
      }
      const arch = path.join(BOX, "归档");
      if (fs.existsSync(arch)) roots.push({ dir: arch, from: "归档" });
    } catch (_) {}
    let answered = false, seen = [];
    for (const { dir } of roots) {
      for (const fn of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
        const e = readEnv(path.join(dir, fn));
        if (!e || e.from !== actor || e.type === "回执") continue;
        const ref = String(e.ref || "");
        if (ref && ref.includes(id)) { answered = true; seen.push(e.id); }
        const mb = String(e.body || "").match(/ref[:：]\s*(LTR-\d{8}-\d{6}[^\s)]*)/);
        if (mb && mb[1].includes(id)) { answered = true; seen.push(e.id); }
      }
    }
    if (!answered) {
      die(`拒绝销信：${id}（type=${L.env.type}）**尚无 ref 处置信**——note 不算处置。
` +
          `  请先发一封 ref 指向它的非回执信（如：send --to 巡检台 --type 通知 --ref ${id} ...），再 done。
` +
          `  （依据：卫生专线只认「ref 指向该信的独立信件」；本席 2026-09-28 三次同型后立此守卫。）`);
    }
  }
  // 回执链止震（SYS-13 v2 @2026-09-10 07:05）：done 一封 type=回执 的信 → 不回投回执（回执不回执）。
  // 否则一封知悉信可三边互投振荡 5+ 轮，INBOX 噪音 >90% 是回执链。其余类型照常回投。
  const isReceipt = L.env.type === "回执";
  let receiptInfo = "";
  if (!isReceipt) {
    // SYS-38 回执归档化（用户令 2026-09-12）：done 自动回执不再投对方 INBOX——直接入归档 + 看板账（信量格「处理」行）
    // 发件人无需动作（纯知悉=状态位/文件档）+ 回执链止震语义保留；找回入口：read <角色> <id>（findLetter 含归档）／归档目录直查
    fs.mkdirSync(ARCHIVE, { recursive: true });
    let rid = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      rid = newId();
      const receipt = [
        "---",
        `id: ${rid}`,
        `from: ${L.env.to}`,
        `to: ${L.env.from}`,
        `type: 回执`,
        `re: [回执] ${L.env.re}`,
        `created: ${new Date().toLocaleString("sv-SE")}`,
        `status: 未读`,
        `payload: —`,
        `sha: —`,
        `ref: ${id}`,
        "---",
        "",
        a.note,
        "",
      ].join("\n");
      try { fs.writeFileSync(path.join(ARCHIVE, `${rid}.md`), receipt, { encoding: "utf-8", flag: "wx" }); break; }
      catch (e) {
        if (e.code !== "EEXIST") throw e;
        if (attempt === 3) die(`回执 ID 连撞 3 次（${rid}）——已停止写入（不覆盖），原信未销，请重发 done`);
      }
    }
    receiptInfo = `回执归档化（SYS-38）：回执 ${rid} 入归档（不再投 ${L.env.from} INBOX·发件人无需动作）`;
  } else {
    receiptInfo = `回执型信——已销不再回投（回执链止震 v2）`;
  }
  // 原信归档（防覆盖 SYS-17：目标同名已存在时改名 -dup2/-dup3… 顺号探测——Win/Node22 renameSync 同名静默覆盖=审计凭据丢失）
  fs.mkdirSync(ARCHIVE, { recursive: true });
  const base = path.basename(L.file);
  let dest = path.join(ARCHIVE, base), dupNote = "";
  if (fs.existsSync(dest)) {
    const stem = base.replace(/\.md$/, "");
    let n = 2;
    while (fs.existsSync(path.join(ARCHIVE, `${stem}-dup${n}.md`))) n++;
    dest = path.join(ARCHIVE, `${stem}-dup${n}.md`);
    dupNote = `｜⚠️ 归档区已有同名件——改名 ${path.basename(dest)}（两封信凭据并存，勿删）`;
  }
  fs.renameSync(L.file, dest);
  out(`✅ 已办结并归档：${id}${dupNote}`);
  out(`   ${receiptInfo}`);
}

function cmdStatus() {
  let any = false;
  out(`📮 邮局四格邮况　${new Date().toLocaleString("sv-SE")}`);
  for (const role of ROLES) {
    const letters = listLetters(inbox(role));
    any = any || letters.length > 0;
    const mark = letters.length ? `📬 ${letters.length} 封未办` : "📭 空";
    out(`  ${role.padEnd(4, "　")}｜${mark}`);
    for (const f of letters) {
      const L = readLetter(path.join(inbox(role), f));
      out(`     · ${L.env.id}［${L.env.type}］${L.env.re}（来自 ${L.env.from}）`);
    }
  }
  const archived = listLetters(ARCHIVE).length;
  out(`  ────────`);
  out(`  归档：${archived} 封｜提示：切到有信的窗口，对 agent 说「收信」`);
  if (!any) out(`  （四箱皆空——各角色无待办信）`);
}

function cmdCheck() {
  let n = 0, bad = 0;
  const scan = (dir, where) => {
    for (const f of listLetters(dir)) {
      n++;
      const L = readLetter(path.join(dir, f));
      for (const k of ["id", "from", "to", "type", "re", "created", "status"]) {
        if (!L.env[k]) { out(`⚠️ ${where}/${f} 缺字段 ${k}`); bad++; }
      }
      if (L.env.type && !TYPES.includes(L.env.type)) { out(`⚠️ ${where}/${f} 未知 type=${L.env.type}`); bad++; }
      if (L.env.payload && L.env.payload !== "—") {
        if (!fs.existsSync(L.env.payload)) { out(`⚠️ ${where}/${f} payload 丢失：${L.env.payload}`); bad++; }
        else if (L.env.sha !== sha256(L.env.payload)) { out(`⚠️ ${where}/${f} payload hash 不符（文件已被改动）`); bad++; }
      }
    }
  };
  for (const role of ROLES) scan(inbox(role), role);
  scan(ARCHIVE, "归档");
  out(bad ? `❌ ${n} 封信中 ${bad} 处异常（见上）` : `✅ ${n} 封信全部合法（信封完整/payload 在位/hash 一致）`);
  process.exit(bad ? 1 : 0);
}

// SYS-12 自测三案：隔离临时邮箱树，断言「ID 唯一 / 跨角色拒销 / 正常 done 归档+回执」
function cmdSelfTest() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "postoffice-st-"));
  const postFile = process.argv[1];
  let pass = 0, fail = 0;
  const t = (name, ok, detail) => { ok ? pass++ : fail++; out(`${ok ? "✅" : "❌"} ${name}${detail ? "　" + detail : ""}`); };
  const run = (sub, roleEnv, args, extraEnv = {}) => {
    const env = { ...process.env, POST_ROOT: path.join(base, sub), ...extraEnv };
    if (roleEnv) env.POST_ROLE = roleEnv; else delete env.POST_ROLE;
    try {
      const stdout = execFileSync(process.execPath, [postFile, ...args], { env, encoding: "utf-8", windowsHide: true });
      return { ok: true, stdout };
    } catch (e) {
      return { ok: false, stdout: (e.stdout || "") + (e.stderr || ""), status: e.status };
    }
  };
  const inDir = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => readLetter(path.join(dir, f))) : []);
  const box = (sub, role) => inDir(path.join(base, sub, role, "INBOX"));
  const arch = (sub) => inDir(path.join(base, sub, "归档"));
  const NEWID = /^LTR-\d{8}-\d{6}-\d{3}-[0-9a-z]{3}$/;

  // 案1 正案：同秒/紧接连发 2 信 → 两 ID 不同且为新格式
  const s1a = run("1", "验收员", ["send", "--from", "验收员", "--to", "程序员", "--type", "通知", "--re", "ST1-a"]);
  const s1b = run("1", "验收员", ["send", "--from", "验收员", "--to", "程序员", "--type", "通知", "--re", "ST1-b"]);
  const l1 = box("1", "程序员");
  t("案1 连发 2 信 ID 唯一", s1a.ok && s1b.ok && l1.length === 2 && NEWID.test(l1[0].env.id) && l1[0].env.id !== l1[1].env.id, `id1=${l1[0]?.env.id} id2=${l1[1]?.env.id}`);

  // 案2 反案：程序员窗口 done 验收员 INBOX 的信 → 被拒、信原样仍在；无身份 done → 报错
  const s2 = run("2", "设计师", ["send", "--from", "设计师", "--to", "验收员", "--type", "派单", "--re", "ST2"]);
  const id2 = box("2", "验收员")[0]?.env.id || "";
  const d2 = run("2", "程序员", ["done", id2, "--note", "跨角色误试"]);
  const stillThere = box("2", "验收员").some((L) => L.env.id === id2);
  t("案2 跨角色 done 被拒且信原样", s2.ok && !d2.ok && stillThere, d2.ok ? "❌误销了!" : "done 被拒✓，信仍在验收员 INBOX✓");
  const d2n = run("2", "", ["done", id2, "--note", "无身份试"]);
  t("案2b 无 --from/POST_ROLE → 报错", !d2n.ok, d2n.ok ? "❌没拦住!" : "被拒✓（需 --from 角色）");

  // 案3 正案：验收员 → 程序员，程序员正常 done → 归档 + 回执投回验收员
  const s3 = run("3", "验收员", ["send", "--from", "验收员", "--to", "程序员", "--type", "验收邀请", "--re", "ST3"]);
  const id3 = box("3", "程序员")[0]?.env.id || "";
  const d3 = run("3", "程序员", ["done", id3, "--note", "ST3 已办"]);
  const moved = arch("3").some((L) => L.env.id === id3);
  const gone = !box("3", "程序员").some((L) => L.env.id === id3);
  const rcpt = box("3", "验收员").find((L) => L.env.type === "回执" && L.env.ref === id3);
  t("案3 正常 done 归档+回执", s3.ok && d3.ok && moved && gone && !!rcpt, `归档=${moved} 原信已移=${gone} 回执=${rcpt?.env.id || "无"}`);

  // 案4 反案（SYS-13 v2 回执止震）：done 一封 type=回执 的信 → 归档成功且无新回执投出（回执不回执）
  const s4 = run("4", "设计师", ["send", "--from", "设计师", "--to", "程序员", "--type", "回执", "--re", "ST4-rcpt"]);
  const before4 = box("4", "设计师").length;
  const id4 = box("4", "程序员")[0]?.env.id || "";
  const d4 = run("4", "程序员", ["done", id4, "--note", "ST4 销回执"]);
  const moved4 = arch("4").some((L) => L.env.id === id4);
  const gone4 = !box("4", "程序员").some((L) => L.env.id === id4);
  const after4 = box("4", "设计师").length;
  t("案4 done 回执信不回投回执（v2 止震）", s4.ok && d4.ok && moved4 && gone4 && after4 === before4, `归档=${moved4} 原信已移=${gone4} 设计师箱 前=${before4} 后=${after4}（应相等=无回执投出）`);

  // 案5 归档同名防覆盖（SYS-17）：两封同 ID 信先后 done → 归档区 -dup2 两凭据并存（改前 renameSync 静默覆盖）
  const ST5 = "LTR-20260101-000000-000-zzz";
  const mk5 = (role) => {
    const d = path.join(base, "5", role, "INBOX"); fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, `${ST5}.md`), ["---", `id: ${ST5}`, "from: 设计师", `to: ${role}`, "type: 通知",
      "re: ST5 同ID双信", "created: 2026-01-01 00:00:00", "status: 未读", "payload: —", "sha: —", "ref: —", "---", "", "同ID信", ""].join("\n"), "utf-8");
  };
  mk5("程序员"); mk5("验收员");
  const d5a = run("5", "程序员", ["done", ST5, "--note", "ST5 第一封"]);
  const d5b = run("5", "验收员", ["done", ST5, "--note", "ST5 第二封"]);
  const arch5 = path.join(base, "5", "归档");
  const a5 = fs.existsSync(arch5) ? fs.readdirSync(arch5).filter((f) => f.endsWith(".md")) : [];
  t("案5 归档同名防覆盖（-dup2 两凭据并存）", d5a.ok && d5b.ok && a5.length === 2 && a5.includes(`${ST5}.md`) && a5.includes(`${ST5}-dup2.md`),
    `归档件=${a5.join(",") || "无"}｜改名提示=${/dup2/.test(d5b.stdout) ? "有" : "无"}`);

  // 案6/6b 反案（SYS-22 回执防覆盖）：钉死时钟+随机源使回执 ID 可预测，预置同 ID 占位回执 → 不得覆盖
  //   案6＝一撞即改（重试新 ID 落盘）；案6b＝三次全撞（明确报错、原信不销、占位件逐字节完整）
  const PH6 = "占位回执·逐字节完整性校验基准\n第二行\n";
  const ID6_HIT = "LTR-20260202-020202-222-000"; // newId() 钉死：时钟 2026-02-02T02:02:02.222 + 随机 0
  const ID6_NEW = "LTR-20260202-020202-222-i00"; // 重试：随机 0.5 → 23328 → base36 i00
  const pin6 = (name, seq) => {
    const f = path.join(base, name);
    fs.writeFileSync(f, [
      "const FIXED = new Date('2026-02-02T02:02:02.222').getTime();",
      "const RealDate = Date;",
      "class FakeDate extends RealDate { constructor(...a){ if(!a.length) super(FIXED); else super(...a); } static now(){ return FIXED; } }",
      "globalThis.Date = FakeDate;",
      `const seq = [${seq}]; let i = 0;`,
      "Math.random = () => seq[Math.min(i++, seq.length - 1)];",
      "",
    ].join("\n"), "utf-8");
    return `--require "${f.replace(/\\/g, "/")}"`; // NODE_OPTIONS 引号内反斜杠会被当转义符——必须正斜杠
  };
  const mk6 = (sub, phId) => {
    const toBox = path.join(base, sub, "程序员", "INBOX"), fromBox = path.join(base, sub, "设计师", "INBOX");
    fs.mkdirSync(toBox, { recursive: true }); fs.mkdirSync(fromBox, { recursive: true });
    fs.writeFileSync(path.join(toBox, "LTR-ST6-SRC.md"), ["---", "id: LTR-ST6-SRC", "from: 设计师", "to: 程序员", "type: 派单",
      "re: ST6 回执防覆盖", "ref: —", "created: 2026-02-02 02:02:02", "status: 未读", "payload: —", "sha: —", "---", "", "ST6 正文", ""].join("\n"), "utf-8");
    fs.writeFileSync(path.join(fromBox, `${phId}.md`), PH6, "utf-8"); // 发件人箱中预置同 ID 占位回执
  };
  mk6("6", ID6_HIT);
  const d6 = run("6", "程序员", ["done", "LTR-ST6-SRC", "--note", "ST6 已办"], { NODE_OPTIONS: pin6("pin6.cjs", "0,0.5") });
  const from6 = box("6", "设计师");
  const ph6ok = fs.readFileSync(path.join(base, "6", "设计师", "INBOX", `${ID6_HIT}.md`), "utf-8") === PH6;
  const newRcpt = from6.find((L) => L.env.id === ID6_NEW);
  t("案6 回执撞名 → 重试改 ID 落盘、占位件不覆盖", d6.ok && ph6ok && !!newRcpt && newRcpt.env.type === "回执" && newRcpt.env.ref === "LTR-ST6-SRC",
    `新回执=${newRcpt?.env.id || "无"}｜占位件完整=${ph6ok}`);

  mk6("6b", ID6_HIT);
  const d6b = run("6b", "程序员", ["done", "LTR-ST6-SRC", "--note", "ST6b 已办"], { NODE_OPTIONS: pin6("pin6b.cjs", "0") });
  const from6b = box("6b", "设计师");
  const ph6bok = fs.readFileSync(path.join(base, "6b", "设计师", "INBOX", `${ID6_HIT}.md`), "utf-8") === PH6;
  const srcStill = box("6b", "程序员").some((L) => L.env.id === "LTR-ST6-SRC");
  t("案6b 回执三连撞 → 报错不覆盖、原信不销", !d6b.ok && /连撞 3 次/.test(d6b.stdout) && ph6bok && from6b.length === 1 && srcStill,
    d6b.ok ? "❌没拦住!" : `报错✓ 占位件完整=${ph6bok} 发件人箱=${from6b.length}件(应1) 原信未销=${srcStill}`);

  fs.rmSync(base, { recursive: true, force: true });
  out(fail ? `❌ self-test 结果：${pass} 过 / ${fail} 败` : `✅ self-test 全绿（${pass} 案全过）`);
  process.exit(fail ? 1 : 0);
}

const [cmd, ...rest] = process.argv.slice(2);
const a = parseArgs(rest);
const actions = { init: cmdInit, send: () => cmdSend(a), read: () => cmdRead(a), done: () => cmdDone(a), status: cmdStatus, check: cmdCheck, "self-test": cmdSelfTest };
if (!actions[cmd]) {
  out("MOV 邮局 —— 用法：init | status | send | read <角色> | done <信id> --note [--from 角色] | check | self-test");
  out(`角色：${ROLES.join("/")}｜信型：${TYPES.join("/")}`);
  process.exit(cmd ? 1 : 0);
}
actions[cmd]();
