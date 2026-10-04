// UPG-482 契约：tokenSentinel 写盘＝原子替换 ＋ 瞬态锁容忍（重试有界 ／ 耗尽才 fault 带 code ／ 零 .tmp 残件）
// 变异锚（亲杀实录见交付报告）：
//   ①改回直写（无 tmp+rename）⇒ ①② 必红（无 rename ⇒ 注入落空/无原子序）
//   ②重试不生效（retries=0）⇒ ①（尝试数不足）②（尝试数≠6）必红
//   ③失败路径不清临时件 ⇒ ②（.tmp 残件）必红（②的注入＝rename 恒失败 ⇒ 临时件真实落盘）
//   ④fault 不带 code ⇒ ②③ 必红；⑤不把 opts 透传 fault ⇒ ④（真件零污染）必红
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tokenSentinel } from "../engine.mjs";

const BOARD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REAL_FAULT_LOG = path.join(BOARD, "故障.log");
const tmpFilesIn = (dir) => fs.readdirSync(dir).filter((f) => f.includes(".tmp-"));
const norm = (p) => String(p).replace(/\\/g, "/");

/** 注入通道：只拦目标件（含其 .tmp-<pid> 派生名）的指定动作，其它放行；记录事件序。
 *  failOn："rename"=目标锁打断替换（临时件真实落盘·可验失败清理）｜"write"=写临时件就被拒。 */
function ioInject(real, { failMatch = null, failOn = "rename", failCode = "EPERM", failN = Infinity } = {}) {
  const st = { attempts: 0, events: [] };
  const isTarget = (p) => failMatch && norm(p).startsWith(norm(failMatch));
  const boom = () => Object.assign(new Error(`${failCode}: injected`), { code: failCode });
  return {
    st,
    mkdirSync: (...a) => real.mkdirSync(...a),
    unlinkSync: (...a) => real.unlinkSync(...a),
    writeFileSync: (p, ...a) => {
      st.events.push(`write:${norm(p).split("/").pop()}`);
      if (failOn === "write" && isTarget(p) && st.attempts++ < failN) throw boom();
      const r = real.writeFileSync(p, ...a);   // 默认真写（临时件真落盘）
      if (failOn === "rename" && isTarget(p)) st.attempts++;  // 记账在「将与目标件替换」的写入上
      return r;
    },
    renameSync: (from, to) => {
      st.events.push(`rename:${norm(from).split("/").pop()}->${norm(to).split("/").pop()}`);
      if (failOn === "rename" && isTarget(from) && st.attempts <= failN) throw boom();
      return real.renameSync(from, to);
    },
  };
}

/** 沙盒：目录（board/state/log/空 home）＋固定时刻 ⇒ 三源扫描为确定空集。 */
function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mov-upg482-"));
  const empty = path.join(dir, "home"); fs.mkdirSync(empty, { recursive: true });
  return {
    dir, empty,
    board: path.join(dir, "token榜.json"),
    opts: (extra = {}) => ({ now: 1759500000000, home: empty, kimiRoot: path.join(empty, "kimi"), hermesDb: path.join(empty, "none.db"), boardFile: path.join(dir, "token榜.json"), stateFile: path.join(dir, "token哨兵.json"), logFile: path.join(dir, "故障.log"), ...extra }),
  };
}
const realFaultLines = () => { try { return fs.readFileSync(REAL_FAULT_LOG, "utf-8").split("\n").filter(Boolean).length; } catch { return 0; } };
const realBefore = realFaultLines();

test("① 可恢复瞬态锁：重试后写成功·原子替换·零 .tmp 残件（rename 被拒 2 次后放行）", () => {
  const sb = sandbox();
  const io = ioInject(fs, { failMatch: sb.board, failOn: "rename", failCode: "EPERM", failN: 2 });
  const board = tokenSentinel(true, sb.opts({ io }));
  assert.equal(io.st.attempts, 3, "应恰尝试 3 次（1 次被拒 + 2 次重试后成功）");
  const parsed = JSON.parse(fs.readFileSync(sb.board, "utf-8")); // 半截文件会在此炸
  assert.equal(parsed.day, "2025-10-03", "榜单内容完整（day 由注入 now 决定）");
  assert.equal(board.day, parsed.day, "返回对象与落盘一致");
  assert.ok(io.st.events.filter((e) => /^write:.*\.tmp-\d+/.test(e)).length >= 3, "写入一律先落临时件");
  assert.ok(io.st.events.some((e) => /^rename:token榜\.json\.tmp-\d+->token榜\.json$/.test(e)), "以 rename 替换目标件（原子序）");
  assert.deepEqual(tmpFilesIn(sb.dir), [], "零 .tmp 残件");
  assert.ok(!fs.existsSync(sb.opts().logFile) || fs.readFileSync(sb.opts().logFile, "utf-8").trim() === "", "重试成功不落 fault");
});

test("② 持续失败：恰 1 次 fault 且带 code；不抛；失败路径零 .tmp 残件", () => {
  const sb = sandbox();
  const io = ioInject(fs, { failMatch: sb.board, failOn: "rename", failCode: "EPERM", failN: Infinity });
  const board = tokenSentinel(true, sb.opts({ io })); // 不抛：该轮降级而非炸链（容忍性修法本意）
  assert.ok(board && board.day, "返回值仍在（该轮榜单内存视图可用）");
  assert.equal(io.st.attempts, 6, "重试 ≤5：总尝试 6 次（首试 + 5 重试）");
  assert.ok(!fs.existsSync(sb.board), "持续失败 ⇒ 目标件未被半截写入");
  const lines = fs.readFileSync(sb.opts().logFile, "utf-8").split("\n").filter(Boolean);
  assert.equal(lines.length, 1, "fault 恰一次（不每次重试各报）");
  assert.ok(lines[0].includes("tokenSentinel.board"), "归属正确：" + lines[0]);
  assert.ok(lines[0].includes("code=EPERM"), "错误信息带 code：" + lines[0]);
  assert.deepEqual(tmpFilesIn(sb.dir), [], "零 .tmp 残件（失败路径也清）");
});

test("③ 非瞬态错不重试：写临时件即 ENOENT ⇒ 一次即 fault（带 code）", () => {
  const sb = sandbox();
  const io = ioInject(fs, { failMatch: sb.board, failOn: "write", failCode: "ENOENT", failN: Infinity });
  tokenSentinel(true, sb.opts({ io }));
  assert.equal(io.st.attempts, 1, "非锁码不重试（重试只对瞬态锁码）");
  const line = fs.readFileSync(sb.opts().logFile, "utf-8").trim();
  assert.ok(line.includes("code=ENOENT"), "带 code：" + line);
  assert.deepEqual(tmpFilesIn(sb.dir), [], "零 .tmp 残件");
});

test("④ 真件零污染：注入跑完后 真故障.log 零新增（opts.logFile 沙盒生效）", () => {
  assert.equal(realFaultLines(), realBefore, "真 故障.log 行数不变");
});
