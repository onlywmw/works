// SYS-112 契约：worktree.mjs 双判据 / 安全默认 / dry-run（隔离夹具仓·零真仓动作）。
// 变异锚（隔离副本亲杀）：①去掉 merged 判据 ⇒ 用例①必红；②dry-run 默认改真删 ⇒ 用例②必红。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const TOOL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "机器闸", "worktree.mjs");
const git = (cwd, ...a) => execFileSync("git", ["-C", cwd, ...a], { encoding: "utf-8" }).trim();
const gitq = (cwd, ...a) => execFileSync("git", ["-C", cwd, ...a], { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });

/** 夹具：临时仓 + origin/main 引用 + 三类 worktree（可清/未并入/有脏项）。 */
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys112-"));
  const repo = path.join(root, "repo");
  fs.mkdirSync(repo);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.email", "t@t");
  git(repo, "config", "user.name", "t");
  fs.writeFileSync(path.join(repo, "a.txt"), "1\n");
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "init");
  // origin/main 引用（免网络）：直接指到本地 main 尖端
  execFileSync("git", ["-C", repo, "update-ref", "refs/remotes/origin/main", "refs/heads/main"]);
  const wt = (name, extra) => {
    const p = path.join(root, name);
    git(repo, "worktree", "add", "-q", "-b", `feat/${name}`, p, "main");
    if (extra) extra(p);
    return p;
  };
  const clean = wt("wt-clean");                  // 已并入 + 零脏项 ⇒ 可清
  const unmerged = wt("wt-unmerged", (p) => { fs.writeFileSync(path.join(p, "b.txt"), "x\n"); git(p, "add", "-A"); git(p, "commit", "-q", "-m", "diverge"); });
  const dirty = wt("wt-dirty", (p) => { fs.writeFileSync(path.join(p, "c.txt"), "dirty\n"); });
  return { root, repo, clean, unmerged, dirty };
}
const run = (fixtureRepo, ...args) => {
  try { return { rc: 0, out: execFileSync("node", [TOOL, ...args, "--repo", fixtureRepo], { encoding: "utf-8" }) }; }
  catch (e) { return { rc: e.status ?? 1, out: (e.stdout || "") + (e.stderr || "") }; }
};

test("SYS-112 ① 双判据：已并入+零脏=可清；未并入 / 有脏项=保留（原因可辨）", () => {
  const f = fixture();
  const r = run(f.repo, "list", "--json");
  assert.equal(r.rc, 0, r.out);
  const j = JSON.parse(r.out);
  const byName = Object.fromEntries(j.worktrees.map((w) => [path.basename(w.path), w]));
  assert.equal(byName["wt-clean"].removable, true, "已并入+零脏 ⇒ 可清");
  assert.equal(byName["wt-unmerged"].removable, false, "未并入 ⇒ 保留");
  assert.ok(byName["wt-unmerged"].reasons.some((x) => x.includes("未并入")), "原因须含未并入");
  assert.equal(byName["wt-dirty"].removable, false, "有脏项 ⇒ 保留");
  assert.ok(byName["wt-dirty"].dirty > 0 && byName["wt-dirty"].reasons.some((x) => x.includes("脏项")), "脏项计数与原因");
  // merged/龄/ahead 三列在场
  for (const w of j.worktrees) { assert.ok("merged" in w && "ageTxt" in w && "ahead" in w, "三列齐备"); }
});

test("SYS-112 ② dry-run 默认不动手：只打印 + 目录仍在 + 输出含可清/保留计数", () => {
  const f = fixture();
  const r = run(f.repo, "prune");
  assert.equal(r.rc, 0, r.out);
  assert.match(r.out, /可清 1 \/ 保留 2/, "输出须含「可清 N / 保留 M＋原因」");
  assert.ok(fs.existsSync(f.clean), "dry-run 不得删除目录");
  assert.ok(fs.existsSync(f.unmerged) && fs.existsSync(f.dirty), "保留项不得被动");
});

test("SYS-112 ③ prune --apply：只清可清项；未并入/脏项不动", () => {
  const f = fixture();
  const r = run(f.repo, "prune", "--apply");
  assert.equal(r.rc, 0, r.out);
  assert.ok(!fs.existsSync(f.clean), "可清项应被清除");
  assert.ok(fs.existsSync(f.unmerged), "未并入项须保留");
  assert.ok(fs.existsSync(f.dirty), "脏项须保留");
  assert.match(r.out, /已清 1 \/ 失败 0 \/ 保留 2/, "报告计数");
});

test("SYS-112 ④ 安全默认 rm：未并入/脏项拒绝（rc≠0+原因）；--force 才删", () => {
  const f = fixture();
  const r1 = run(f.repo, "rm", f.unmerged);
  assert.notEqual(r1.rc, 0, "未并入无 --force 须拒");
  assert.match(r1.out, /未并入|拒绝/, "拒绝原因可辨");
  assert.ok(fs.existsSync(f.unmerged), "拒后不得删除");
  const r2 = run(f.repo, "rm", f.dirty);
  assert.notEqual(r2.rc, 0, "有脏项无 --force 须拒");
  const r3 = run(f.repo, "rm", f.unmerged, "--force");
  assert.equal(r3.rc, 0, r3.out);
  assert.ok(!fs.existsSync(f.unmerged), "--force 应强删");
  const r4 = run(f.repo, "rm", path.join(f.root, "not-registered"));
  assert.notEqual(r4.rc, 0, "未注册路径须拒（防误删）");
});
