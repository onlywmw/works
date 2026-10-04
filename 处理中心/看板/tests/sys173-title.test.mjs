// SYS-173 回归锁：cmd 窗口标题带体系标签（看板/席位/临时/座态）＋解析同步＋root.mjs 幽灵路径防呆
// 跑法：node --test 处理中心/看板/tests/sys173-title.test.mjs
// 口径：标题字面（新格式）与解析（MOV- 到 〔·向后兼容旧标题）同批；看板自保单实例匹配双格式；禁只改字面不改解析。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const TESTS = path.dirname(fileURLToPath(import.meta.url));
const BOARD = path.resolve(TESTS, "..");
const SYS = path.resolve(BOARD, "..", "..");
const TAG = "〔安卓中国〕";
const eng = () => fs.readFileSync(path.join(BOARD, "engine.mjs"), "utf-8");

test("SYS-173 ① 标题写入点四件齐带体系标签", () => {
  const src = eng();
  // 席位窗开窗链（cmd + powershell 两分支）
  assert.ok(src.includes("title MOV-${role}〔安卓中国〕"), "席位窗 cmd 标题缺标签");
  assert.ok(src.includes("WindowTitle='MOV-${role}〔安卓中国〕'"), "席位窗 PS 标题缺标签");
  // 临时/worker 窗
  assert.ok(src.includes("const title = `MOV-${name}〔安卓中国〕`"), "worker 窗标题缺标签");
  // duty 窗
  assert.ok(src.includes("MOV-${role}〔安卓中国〕\\x07"), "duty 窗标题缺标签");
  // 看板窗两入口（看板-终端.cmd 为 GBK；开工.cmd 为 UTF-8）
  const kanbanCmd = new TextDecoder("gbk").decode(fs.readFileSync(path.join(BOARD, "看板-终端.cmd")));
  assert.ok(kanbanCmd.includes(`title MOV-看板${TAG}`), "看板-终端.cmd 标题缺标签");
  assert.ok(fs.readFileSync(path.join(BOARD, "开工.cmd"), "utf-8").includes(`start "MOV-看板${TAG}"`), "开工.cmd 标题缺标签");
  // 座态标题（周期覆写座位窗标题——不加会把手改字面刷回旧格式）
  assert.ok(fs.readFileSync(path.join(BOARD, "座态标题.ps1"), "utf-8").includes(`' MOV-' + $s.role + '${TAG}'`), "座态标题.ps1 缺标签");
});

test("SYS-173 ② 解析同步：席名取 MOV- 到 〔（引擎解析源码断言）＋旧格式兼容分支在位", () => {
  const src = eng();
  assert.ok(src.includes(".replace(/〔[^〕]*〕\\s*$/, \"\")"), "席名解析未剥离体系标签");
  assert.ok(src.includes(".replace(/^MOV-/, \"\")"), "MOV- 前缀剥离锚缺失（向后兼容/解析基座）");
});

test("SYS-173 ③ 看板单实例自保：匹配双格式（新 *MOV-看板* ＋ 旧 *MOV-BOARD* 兜底）", () => {
  const src = eng();
  assert.ok(src.includes("'*MOV-看板*'"), "自保匹配缺新标题模式");
  assert.ok(src.includes("'*MOV-BOARD*'"), "旧标题兜底模式被删（改名窗口期防漏）");
  assert.ok(src.includes("'*看板-终端.cmd*'"), "看板-终端.cmd 锚保留");
});

test("SYS-173 ④ root.mjs 幽灵 env 回退缺省＋告警一行；env 存在仍按 env（不漏）", () => {
  const rootMjs = path.join(SYS, "处理中心", "机器闸", "lib", "root.mjs");
  const run = (env) => spawnSync(process.execPath, ["-e",
    `import(${JSON.stringify("file:///" + rootMjs.replace(/\\/g, "/"))}).then(m=>console.log("MOV="+m.MOV))`],
    { encoding: "utf8", env: { ...process.env, ...env } });
  // 幽灵路径（不存在）⇒ 回退缺省 E:\MOV ＋ stderr 告警
  const ghost = run({ MOV_HOME: path.join(SYS, "不存在的幽灵路径") });
  assert.equal(ghost.status, 0, ghost.stderr);
  assert.match(ghost.stdout, /MOV=E:[\\/]MOV\s*$/i, "幽灵 MOV_HOME 未回退缺省");
  assert.match(ghost.stderr, /\[root\] MOV_HOME=.*不存在，回退缺省/, "幽灵路径回退未告警（禁静默）");
  // 存在的 env ⇒ 仍按 env（别把正常覆盖杀掉）
  const realDir = path.join(BOARD, "工位");
  const ok = run({ MOV_HOME: realDir });
  assert.equal(ok.status, 0, ok.stderr);
  assert.ok(ok.stdout.includes(realDir), "存在的 MOV_HOME 未被采用（env 优先语义被破坏）");
  assert.ok(!/不存在，回退缺省/.test(ok.stderr), "存在路径不得误告警");
});
