// SYS-49 每日备份回归测试（跨日门纯函数 / 脚本真 bundle+sha256 对账 / 恢复演练 / 失败路径）
// 跑法：node --test 处理中心/看板/tests/sys49-backup.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { backupDue, dailyBackupTick } from "../engine.mjs";

const BOARD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(BOARD, "备份.mjs");
const git = (cwd, ...a) => execFileSync("git", ["-C", cwd, ...a], { encoding: "utf8" });

function tinyRepo() { // 两提交小仓（真 git，供真 bundle 演练）
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys49-repo-"));
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.email", "t@t");
  git(dir, "config", "user.name", "t");
  fs.writeFileSync(path.join(dir, "a.txt"), "v1\n");
  git(dir, "add", ".");
  git(dir, "commit", "-qm", "c1");
  fs.writeFileSync(path.join(dir, "b.txt"), "hello sys49\n");
  git(dir, "add", ".");
  git(dir, "commit", "-qm", "c2");
  return dir;
}
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const runBackup = (out, repos) => execFileSync(process.execPath, [SCRIPT, "--out", out, "--date", "20260911", "--repos", repos], { encoding: "utf8" });

test("跨日门 backupDue：跨日/首跑/spawn_fail 重试；当日 ok|fail|running 不重跑", () => {
  const T = "20260911";
  assert.equal(backupDue(null, T), true); // 首跑
  assert.equal(backupDue({ lastDate: "20260910", status: "ok" }, T), true); // 跨日
  assert.equal(backupDue({ lastDate: T, status: "spawn_fail" }, T), true); // 自身没起来=下个检查点重试
  assert.equal(backupDue({ lastDate: T, status: "ok" }, T), false); // 当日已产出
  assert.equal(backupDue({ lastDate: T, status: "fail" }, T), false); // 当日失败=不重跑（走可见告警）
  assert.equal(backupDue({ lastDate: T, status: "running" }, T), false); // 在跑
});

test("脚本真产出：bundle+日志+manifest+sha256 对账；bundle verify 过", () => {
  const repo = tinyRepo();
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys49-bak-"));
  runBackup(out, `tiny=${repo}`);
  const dir = path.join(out, "20260911");
  const bundle = path.join(dir, "tiny.bundle");
  assert.ok(fs.existsSync(bundle), "bundle 应产出");
  const man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf-8"));
  assert.equal(man.ok, true);
  assert.equal(man.entries[0].sha256, sha(bundle)); // sha256 摘要可核
  assert.ok(man.entries[0].heads.length >= 1, "list-heads 摘要非空");
  assert.match(fs.readFileSync(path.join(dir, "备份日志.md"), "utf-8"), /tiny\.bundle/);
  execFileSync("git", ["bundle", "verify", bundle], { encoding: "utf8" }); // 不抛=refs 完整
});

test("恢复演练：bundle → clone → 关键文件 hash 对账一致", () => {
  const repo = tinyRepo();
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys49-bak2-"));
  runBackup(out, `tiny=${repo}`);
  const clone = path.join(out, "clone");
  execFileSync("git", ["-c", "core.autocrlf=false", "clone", "-q", path.join(out, "20260911", "tiny.bundle"), clone], { encoding: "utf8" }); // -c 关闭全局 autocrlf：检出 bytes 保真，才谈得上 hash 对账
  assert.equal(git(clone, "rev-parse", "HEAD").trim(), git(repo, "rev-parse", "HEAD").trim());
  assert.equal(git(clone, "rev-list", "--count", "HEAD").trim(), "2");
  assert.equal(sha(path.join(clone, "b.txt")), sha(path.join(repo, "b.txt")));
  assert.equal(execFileSync("git", ["-C", clone, "show", "HEAD:b.txt"]).toString("utf8"), "hello sys49\n"); // blob 级内容同样对账（配置无关）
});

test("失败路径：源仓不存在 → 非零退出 + manifest.ok=false + errors 记录", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys49-bak3-"));
  let code = 0;
  try { runBackup(out, "bogus=C:/no/such/repo"); } catch (e) { code = e.status; }
  assert.notEqual(code, 0);
  const man = JSON.parse(fs.readFileSync(path.join(out, "20260911", "manifest.json"), "utf-8"));
  assert.equal(man.ok, false);
  assert.ok(man.errors.length >= 1 && man.errors[0].includes("bogus"));
});

test("收口只认新鲜 manifest：当日旧 manifest 不得把 running 误判为 ok", () => {
  const sb = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys49-fresh-"));
  const marker = path.join(sb, "m.json"), out = path.join(sb, "bak");
  const today = new Date().toLocaleDateString("sv-SE").replaceAll("-", "");
  const dir = path.join(out, today);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(marker, JSON.stringify({ lastDate: today, status: "running", startedAt: new Date(Date.now() - 60e3).toISOString() }));
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ ok: true, at: new Date(Date.now() - 120e3).toISOString() })); // 旧件（早于本轮 startedAt）
  dailyBackupTick({ marker, out, script: "unused" });
  assert.equal(JSON.parse(fs.readFileSync(marker, "utf-8")).status, "running"); // 不得误判 ok
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ ok: true, at: new Date().toISOString() })); // 本轮新鲜件
  dailyBackupTick({ marker, out, script: "unused" });
  assert.equal(JSON.parse(fs.readFileSync(marker, "utf-8")).status, "ok");
});

test("引擎例程跨日闭环（沙盒）：首日触发→manifest 收口 ok；同日不重跑；次日再触发", async () => {
  const sb = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys49-engine-"));
  const marker = path.join(sb, "m.json"), out = path.join(sb, "bak");
  const today = new Date().toLocaleDateString("sv-SE").replaceAll("-", "");
  const stub = path.join(sb, "stub.mjs"); // 桩：模拟真脚本落 manifest（真脚本已在前两组测试里真跑）
  fs.writeFileSync(stub, 'import fs from "node:fs"; import path from "node:path"; const d = path.join(process.env.SYS49_OUT, new Date().toLocaleDateString("sv-SE").replaceAll("-", "")); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, "manifest.json"), JSON.stringify({ ok: true, at: new Date().toISOString() }));', "utf-8");
  process.env.SYS49_OUT = out; // 桩经环境变量拿沙盒输出位（spawn 继承 env）
  try {
    dailyBackupTick({ marker, out, script: stub }); // 首日首检查点：应触发
    assert.equal(JSON.parse(fs.readFileSync(marker, "utf-8")).status, "running");
    const man = path.join(out, today, "manifest.json");
    const t0 = Date.now();
    while (!fs.existsSync(man) && Date.now() - t0 < 5000) await new Promise((r) => setTimeout(r, 100));
    assert.ok(fs.existsSync(man), "桩脚本应落 manifest");
    dailyBackupTick({ marker, out, script: stub }); // 收口：running→ok
    assert.equal(JSON.parse(fs.readFileSync(marker, "utf-8")).status, "ok");
    fs.rmSync(man); // 同日（含删 manifest 后）不重跑：状态仍 ok，不重新触发
    dailyBackupTick({ marker, out, script: stub });
    assert.equal(JSON.parse(fs.readFileSync(marker, "utf-8")).status, "ok");
    fs.writeFileSync(marker, JSON.stringify({ lastDate: "20200101", status: "ok" })); // 次日：跨日重触发
    dailyBackupTick({ marker, out, script: stub });
    assert.equal(JSON.parse(fs.readFileSync(marker, "utf-8")).status, "running");
  } finally { delete process.env.SYS49_OUT; }
});
