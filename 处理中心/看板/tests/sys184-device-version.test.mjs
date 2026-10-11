// SYS-184 契约：设备包指纹解析/推导（D1 单一真源 lib/device-version.mjs）。
// 隔离：fingerprintOf 只跑临时夹具仓（零真仓动作）；纯函数无副作用。
// 变异锚（隔离副本亲杀）：①baseSha 改成取整串 ⇒ 用例①必红；②isMainLine 去掉分支标记判 ⇒ 用例②必红；③fingerprintOf 忘 +dirty ⇒ 用例③必红。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { baseSha, suffixOf, isMainLine, branchMarkOf, fingerprintOf, gitShort, gitHead } from "../../机器闸/lib/device-version.mjs";

const git = (cwd, ...a) => execFileSync("git", ["-C", cwd, ...a], { encoding: "utf-8" }).trim();
function fixture() { // 单提交临时仓（main）
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys184-dv-"));
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.email", "t@t");
  git(dir, "config", "user.name", "t");
  fs.writeFileSync(path.join(dir, "a.txt"), "1\n");
  git(dir, "add", "-A"); git(dir, "commit", "-q", "-m", "ck");
  return dir;
}

test("SYS-184/① 解析：base sha＝V1.1- 后至首个 +；后缀原样", () => {
  assert.equal(baseSha("V1.1-e2c4b167"), "e2c4b167");
  assert.equal(baseSha("V1.1-e2c4b167+upg519+dirty"), "e2c4b167");
  assert.equal(baseSha("V1.1-d7d4e8fa+dirty"), "d7d4e8fa");
  assert.equal(baseSha("V1.1-nogit+nogit"), "nogit");
  assert.equal(baseSha("V1.0"), "");
  assert.equal(baseSha(""), "");
  assert.equal(suffixOf("V1.1-e2c4b167"), "");
  assert.equal(suffixOf("V1.1-e2c4b167+upg519+dirty"), "+upg519+dirty");
  assert.equal(suffixOf("V1.1-e2c4b167+dirty"), "+dirty");
});

test("SYS-184/② isMainLine：base 同 main 头且无分支标记（+dirty 容忍）；分支标记包/异 sha 均不算", () => {
  assert.equal(isMainLine("V1.1-e2c4b167", "e2c4b167"), true);
  assert.equal(isMainLine("V1.1-e2c4b167+dirty", "e2c4b167"), true);   // main 检出带账本/文档脏项=常态
  assert.equal(isMainLine("V1.1-e2c4b167+upg519", "e2c4b167"), false);
  assert.equal(isMainLine("V1.1-e2c4b167+upg519+dirty", "e2c4b167"), false); // 518 案形态：工作树包不算 main
  assert.equal(isMainLine("V1.1-d7d4e8fa", "e2c4b167"), false);
  assert.equal(isMainLine("V1.1-e2c4b167", ""), false);
});

test("SYS-184/②b branchMarkOf：+dirty 剔除后仅剩分支标记（drill 形态非空——回主捷径不得对其生效）", () => {
  assert.equal(branchMarkOf("V1.1-e2c4b167"), "");
  assert.equal(branchMarkOf("V1.1-e2c4b167+dirty"), "");
  assert.equal(branchMarkOf("V1.1-e2c4b167+sys184-drill+dirty"), "+sys184-drill");
  assert.equal(branchMarkOf("V1.1-e2c4b167+upg519"), "+upg519");
});

test("SYS-184/③ fingerprintOf：main 净树裸 sha；脏 +dirty；工作树 +分支标记（与 UPG-523 gradle 同法）", () => {
  const repo = fixture();
  const s = gitShort(repo);
  assert.equal(fingerprintOf(repo), `V1.1-${s}`);              // main 净树
  fs.writeFileSync(path.join(repo, "b.txt"), "dirty\n");       // 未跟踪也算脏（porcelain 非空）
  assert.equal(fingerprintOf(repo), `V1.1-${s}+dirty`);        // main 脏 ⇒ +dirty（无分支标记）
  git(repo, "checkout", "-q", "-b", "feat/upg523");
  assert.equal(fingerprintOf(repo), `V1.1-${s}+upg523+dirty`); // 工作树＋脏
  git(repo, "add", "-A"); git(repo, "commit", "-q", "-m", "c2");
  const s2 = gitShort(repo);
  assert.equal(fingerprintOf(repo), `V1.1-${s2}+upg523`);      // 工作树净 ⇒ 仅分支标记
});

test("SYS-184/④ fingerprintOf：detached 无标记；非 git=V1.1-nogit+nogit（D1 显式形态）", () => {
  const repo = fixture();
  git(repo, "checkout", "-q", gitHead(repo));                  // detached：abbrev-ref=HEAD ⇒ 无标记
  assert.equal(fingerprintOf(repo), `V1.1-${gitShort(repo)}`);
  const plain = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys184-nogit-"));
  const prev = process.env.GIT_CEILING_DIRECTORIES;
  process.env.GIT_CEILING_DIRECTORIES = plain; // 阻断向上找仓（本机 Temp 位于 C:\Users\Administrator 仓内，不挡会误命中祖先仓）
  try { assert.equal(fingerprintOf(plain), "V1.1-nogit+nogit"); }
  finally { if (prev === undefined) delete process.env.GIT_CEILING_DIRECTORIES; else process.env.GIT_CEILING_DIRECTORIES = prev; }
});
