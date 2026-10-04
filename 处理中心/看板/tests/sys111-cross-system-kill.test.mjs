// SYS-111 引擎互杀修复 回归锁（2026-09-26）——跨体系不杀 + 本体系自愈不退化 + 干跑/留痕
// 变异程序（交付证据用）：删引擎内 `if (!scopeOk(...)) continue;` → 用例①必红。
// 跑法：node --test 处理中心/看板/tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { killStaleBoards } from "../engine.mjs";

const KANBAN = path.dirname(fileURLToPath(import.meta.url)).replace(/[\/]tests$/, ""); // 看板根（=引擎 HERE·作用域基准）
const MINE = KANBAN.split(path.sep).join("\\");
const WEB = "E:\MOV\网页体系建设\处理中心\看板";
const cand = (pid, cmd) => ({ ProcessId: pid, CommandLine: cmd });

const MINE_NODE = cand(111, `"node" "${MINE}\engine.mjs" board`);
const MINE_CMD = cand(112, `cmd /c ""${MINE}\看板-终端.cmd" "`);
const WEB_NODE = cand(221, `"node" "${WEB}\engine.mjs" board`);
const WEB_CMD = cand(222, `cmd /c ""${WEB}\看板-终端.cmd" "`);

test("SYS-111 ① 跨体系不杀：异体系 board（node/cmd 两型）一律不动，本体系照回收", () => {
  const killed = [], acts = [];
  killStaleBoards({
    me: 1, host: 2, noLog: true,
    fetchCandidates: () => [MINE_NODE, MINE_CMD, WEB_NODE, WEB_CMD],
    killProc: (p) => killed.push(p),
  });
  assert.deepEqual(killed.sort(), [111, 112], "只许回收本体系两件；异体系 221/222 必须不动（旧版会误杀）");
  assert.ok(!killed.includes(221) && !killed.includes(222), "异体系 pid 不得出现在回收集");
});

test("SYS-111 ② 本体系自愈不退化：重复启动的旧板仍被回收；自身/父 pid 豁免", () => {
  const killed = [];
  killStaleBoards({ me: 111, host: 112, noLog: true, fetchCandidates: () => [MINE_NODE, MINE_CMD], killProc: (p) => killed.push(p) });
  assert.deepEqual(killed, [], "自身(111)/父(112) pid 不得自杀/杀父");
  const killed2 = [];
  killStaleBoards({ me: 999, host: 998, noLog: true, fetchCandidates: () => [MINE_NODE, MINE_CMD], killProc: (p) => killed2.push(p) });
  assert.deepEqual(killed2.sort(), [111, 112], "本体系旧板照回收（自愈语义保留）");
});

test("SYS-111 ③ 干跑：dryRun 不杀只记；边界=无路径候选（命令行缺路径）一律不动", () => {
  const killed = [], acts = [];
  killStaleBoards({ me: 1, host: 2, noLog: true, dryRun: true, fetchCandidates: () => [MINE_NODE, WEB_NODE], killProc: (p) => killed.push(p) });
  assert.deepEqual(killed, [], "dryRun 不得真杀");
  killStaleBoards({ me: 1, host: 2, noLog: true, fetchCandidates: () => [cand(333, "node engine.mjs board")], killProc: (p) => killed.push(p) });
  assert.deepEqual(killed, [], "无路径候选（命令行不含本体系看板根）⇒ 宁缺勿错不杀");
});
