#!/usr/bin/env node
// -*- coding: utf-8 -*-
// MOV 邮局 · 值守循环 —— 信到自动开工（窗口内可见）
//
// 每个角色窗口跑一个值守：盯着自己的 INBOX，信一到就把「收信协议+本信路径」
// 喂给本窗口的 agent（默认 Claude Code 无头模式），实时滚动施工过程。
// 一信一 fresh session——独立性纪律由结构保证，不靠自觉。
//
// 环境变量：
//   POST_ROLE      角色名（值守-<角色>.cmd 启动器里已设）
//   POST_ROOT      邮箱树根（默认 邮局\邮箱）
//   AGENT_CMD      agent 命令（默认 claude；可换 kimi / zcode / node 存根）
//   AGENT_ARGS     附加参数（默认 --dangerously-skip-permissions；
//                  谨慎版：--permission-mode acceptEdits --allowedTools "Read Edit Write Glob Grep TodoWrite WebFetch"）
//   EXIT_WHEN_IDLE 空箱即退（测试钩子；正常值守不要设）
//   POLL_MS        轮询间隔毫秒（默认 5000）
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.POST_ROOT || path.join(HERE, "邮箱");
const ROLE = process.env.POST_ROLE || process.argv[2] || "";
const POLL = Number(process.env.POLL_MS || 5000);
const ROLES = ["设计师", "程序员", "验收员", "审验员", "巡检台"]; // 2026-09-10 补巡检台：有信箱有工位，headless 值守降级也该覆盖
if (!ROLES.includes(ROLE)) { console.log(`❌ 缺角色：设 POST_ROLE 或传参（${ROLES.join("/")}` + "）"); process.exit(1); }
const inboxDir = path.join(ROOT, ROLE, "INBOX");
const POST = path.join(HERE, "post-office.mjs");

const protocol = `你是 MOV 工单流转中心的「${ROLE}」角色 agent，正在值守信箱。刚收到一封信，请立即开工：

## 收信协议
1. 用 Read 读信件文件（信封在 --- 之间）：确认 to 是你。
2. 按 type 行事：派单=读 payload 派单文件照单施工；验收邀请=读 payload 交付报告独立验收（L1 复跑/L2 L3 证据，不信自报）；审验邀请=终审；打回=照理由修复；回执/通知=知悉并向用户转述。
3. 权威永远在盘上正式文件与工单库 status 块：信与库冲突以库为准，并向用户提示。
4. 遇到需要人拍板的事（方案取舍/预算/红线）→ 不要硬办：用 post-office 发 type=通知 的信说明情况，并 done 销信注明「需人工拍板」。
5. 【审验员专属闸门】type=审验邀请：通过 → 只发 type=通知 的「建议合 main」信（to 设计师），**绝不自行 git merge / push**；打回 → 发打回信给程序员。
6. 办完正事后必做两件事（POST_ROLE 已是 ${ROLE}，不必 --from）：
   a) 发下游信：node "${POST}" send --to <下游> --type <型> --re "<事由>" --payload <你的产物路径>
   b) 销信：node "${POST}" done <本信id> --note "<一句话结果>"
7. 一次只办这一封，办完即止（值守会自动派下一封）。

## 本信
`;

const letters = () => fs.existsSync(inboxDir) ? fs.readdirSync(inboxDir).filter(f => f.endsWith(".md")).sort() : [];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let waiting = false;

async function runAgent(letterPath) {
  const args = ["-p"];
  args.push(...(process.env.AGENT_ARGS || "--dangerously-skip-permissions").split(" ").filter(Boolean));
  args.push("--output-format", "stream-json", "--verbose", "--include-partial-messages");
  const prompt = protocol + `信件路径：${letterPath}\n开工。`;
  return new Promise((resolve) => {
    // Windows npm shim 需要 shell；prompt 走 stdin 避开引号/中文转义问题
    const child = spawn(process.env.AGENT_CMD || "claude", args, {
      shell: true, cwd: path.dirname(HERE), // cwd = 处理中心
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log("─".repeat(60));
    child.stdout.setEncoding("utf-8");
    let buf = "";
    child.stdout.on("data", (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.type === "assistant" && ev.message?.content) {
          for (const b of ev.message.content) {
            if (b.type === "text" && b.text?.trim()) console.log(`💬 ${b.text.trim()}`);
            if (b.type === "tool_use") {
              const inp = b.input || {};
              const brief = inp.command || inp.file_path || inp.pattern || inp.query || inp.path || "";
              console.log(`🔧 ${b.name}${brief ? "：" + String(brief).slice(0, 120) : ""}`);
            }
          }
        } else if (ev.type === "result") {
          console.log(`🏁 ${ev.is_error ? "出错" : "完成"}：${String(ev.result || "").slice(0, 300)}`);
        }
      }
    });
    child.stderr.on("data", (d) => process.stderr.write(d));
    child.on("close", (code) => { console.log(`（agent 退出码 ${code}）`); resolve(code); });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

// 敲窗：工位窗里有人工 agent（claude/pi/reasonix…任意）时，把「收信」打给它，不代它起 headless
import { execSync } from "node:child_process";
function ringSeat() {
  try {
    const KEY_OF = { "设计师": "designer", "程序员": "coder", "验收员": "qa", "审验员": "reviewer" };
    const seatFile = path.join(HERE, "..", "看板", "seats", `${KEY_OF[ROLE] || ROLE}.json`);
    if (!fs.existsSync(seatFile)) return false;
    const seat = JSON.parse(fs.readFileSync(seatFile, "utf-8"));
    if (seat.on !== true || !seat.hwnd) return false; // 灯未亮=无 agent 在岗，不敲空窗
    const r = execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${path.join(HERE, "..", "看板", "铃.ps1")}" -Hwnd ${seat.hwnd} -Text "收信"`,
      { encoding: "utf8", windowsHide: true }
    ).trim();
    console.log(`🔔 敲窗：${r}`);
    if (r === "OK") return true;
    // 窗不在了（hwnd 失效）——注销登记，降级 headless
    try { fs.unlinkSync(seatFile); } catch {}
    return false;
  } catch (e) { console.log(`🔔 敲窗失败：${e.message}`); return false; }
}

console.log(`📮 值守启动：${ROLE}｜邮箱：${inboxDir}`);
console.log(`   优先敲工位窗（窗内人工 agent 接活）；无工位窗时降级 headless（${process.env.AGENT_CMD || "claude"}）`);
let rungLetter = null; // 已敲过窗的信：agent 在办，不重复敲、不起 headless

while (true) {
  const list = letters();
  if (!list.length) {
    if (!waiting) { console.log(`📭 ${new Date().toLocaleTimeString("sv-SE")} 值守中，等信…`); waiting = true; }
    rungLetter = null;
    if (process.env.EXIT_WHEN_IDLE) { console.log("（EXIT_WHEN_IDLE：空箱退出）"); break; }
    await sleep(POLL);
    continue;
  }
  waiting = false;
  const file = path.join(inboxDir, list[0]);
  if (list[0] === rungLetter) { await sleep(POLL); continue; } // 已敲给窗内 agent，等它销信
  const raw = fs.readFileSync(file, "utf-8");
  const re = (raw.match(/^re:\s*(.*)$/m) || [])[1] || "";
  const from = (raw.match(/^from:\s*(.*)$/m) || [])[1] || "?";
  const type = (raw.match(/^type:\s*(.*)$/m) || [])[1] || "?";
  console.log(`\n📬 ${new Date().toLocaleTimeString("sv-SE")} 收信［${type}］${re}（来自 ${from}）`);
  if (ringSeat()) {
    console.log(`   已把「收信」敲进工位窗——窗内 agent 办完会销信（done），此信转人工线。`);
    rungLetter = list[0];
    await sleep(1000);
    continue;
  }
  console.log(`   无工位窗应答——降级 headless 唤醒 ${ROLE} agent…`);
  await runAgent(file);
  if (letters().includes(path.basename(file)))
    console.log(`⚠️ 该信仍在 INBOX——agent 没销信，人工看一眼（post done <id>）。继续等下一封。`);
  await sleep(1000);
}
