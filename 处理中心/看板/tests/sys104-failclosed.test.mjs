// SYS-104 契约：写库工具 fail-closed（未知旗标拒收 + 沙盒旗标真拦）。
// 方法：运行期把**真工具件**复制到临时树（ROOT/真库=临时树）→ 对副本做破坏性复演——
//   变异真工具 ⇒ 副本同变异 ⇒ 用例必红；真库/真备份区恒零风险。
// 变异锚（亲杀见交付报告）：把「未知旗标拒收」改回静默忽略 → 用例①必红；沙盒旗标不拦真库 → 用例②必红。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const MACHINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "机器闸");
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const cpDir = (src, dst) => {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) cpDir(s, d); else fs.copyFileSync(s, d);
  }
};

/** 隔离树：真工具件复制 + 最小真库夹具（ROOT=临时树 → REAL_LIB=临时树/处理中心/工单库.md） */
function sandboxTree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys104-"));
  const machine = path.join(root, "处理中心", "机器闸");
  fs.mkdirSync(machine, { recursive: true });
  for (const f of ["取号.mjs", "set-status.py", "archive-cards.mjs"]) fs.copyFileSync(path.join(MACHINE, f), path.join(machine, f));
  cpDir(path.join(MACHINE, "lib"), path.join(machine, "lib")); // 依赖链整拷（parse-card → status-registry 等）
  // 注：不用 fs.cpSync——Node 22 (Windows) 实测递归拷贝会把本进程弄崩（exit 127/0xC0000409）
  const lib = path.join(root, "处理中心", "工单库.md");
  fs.writeFileSync(lib, "# SYS-1 夹具卡\n\n```status\nphase: dispatched\nticket: SYS-1\n```\n", "utf-8");
  return { root, machine, lib };
}
const q = (t, args) => spawnSync(process.execPath, [t.machine + "/取号.mjs", ...args], { encoding: "utf-8", cwd: t.root });
const s = (t, args) => spawnSync("python", [t.machine + "/set-status.py", ...args], { encoding: "utf-8", cwd: t.root });
const F = ["--bv", "1", "--tc", "1", "--rr", "1", "--size", "1"];

test("SYS-104 ① 未知旗标一律拒收（取号/set-status/archive-cards）·真库零写", () => {
  const t = sandboxTree();
  const h0 = sha(t.lib);
  const r1 = q(t, ["立卡", "SYS", "探针", "x", ...F, "--ad-hoc-lib", path.join(t.root, "x.md")]);
  assert.notEqual(r1.status, 0, "取号：未知旗标须非零退出");
  assert.match(r1.stderr, /未知旗标/, "取号：须明确报错");
  const r2 = s(t, ["SYS-1", "--phase", "accepted", "--ad-hoc-lib", path.join(t.root, "x.md"), "--note", "x"]);
  assert.notEqual(r2.status, 0, "set-status：未知旗标须非零退出");
  assert.match(r2.stderr + r2.stdout, /unrecognized|拒/, "set-status：须明确报错");
  const r3 = spawnSync(process.execPath, [t.machine + "/archive-cards.mjs", "--ad-hoc-lib", "x"], { encoding: "utf-8" });
  assert.notEqual(r3.status, 0, "archive-cards：未知旗标须非零退出");
  assert.equal(sha(t.lib), h0, "真库 mtime/hash 不变（夹具树）");
});

test("SYS-104 ② 沙盒旗标真拦：只写沙盒 + stdout 明示 + 真库不变（取号 --lib/--adhoc-lib）", () => {
  const t = sandboxTree();
  const h0 = sha(t.lib);
  const sbox = path.join(t.root, "沙盒.md");
  fs.writeFileSync(sbox, "# SYS-1 沙盒\n", "utf-8");
  for (const flag of ["--lib", "--adhoc-lib"]) {
    const r = q(t, ["立卡", "SYS", `沙盒_${flag}`, "x", ...F, flag, sbox]);
    assert.equal(r.status, 0, `${flag}：合法用法须成功`);
    assert.match(r.stdout, /已拦真库写入/, `${flag}：stdout 须明示拦截`);
    assert.match(r.stdout, /✅ 立卡 SYS-\d+/, "既有成功行格式不变（startsWith 兼容）");
  }
  assert.ok(fs.readFileSync(sbox, "utf-8").includes("沙盒_--adhoc-lib"), "沙盒件收到卡");
  assert.equal(sha(t.lib), h0, "真库零写");
});

test("SYS-104 ③ 沙盒旗标指向真库 → 拒收（取号/set-status）", () => {
  const t = sandboxTree();
  const h0 = sha(t.lib);
  const r1 = q(t, ["立卡", "SYS", "x", "y", ...F, "--lib", t.lib]);
  assert.notEqual(r1.status, 0, "取号：指向真库须拒");
  assert.match(r1.stderr, /指向真库/, "取号：报错可辨");
  const r2 = s(t, ["SYS-1", "--phase", "accepted", "--lib", t.lib, "--note", "x"]);
  assert.notEqual(r2.status, 0, "set-status：指向真库须拒");
  assert.match(r2.stdout + r2.stderr, /指向真库/, "set-status：报错可辨");
  assert.equal(sha(t.lib), h0, "真库零写");
});

test("SYS-104 ④ set-status 沙盒：只写沙盒 + 明示 + 不动真备份区", () => {
  const t = sandboxTree();
  const h0 = sha(t.lib);
  const sbox = path.join(t.root, "沙盒2.md");
  fs.copyFileSync(t.lib, sbox);
  const hS0 = sha(sbox);
  const r = s(t, ["SYS-1", "--phase", "accepted", "--adhoc-lib", sbox, "--note", "SYS-104 沙盒"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /已拦真库写入/, "明示拦截");
  assert.match(r.stdout, /跳过真库备份/, "沙盒不写真 归档/_备份归档");
  assert.notEqual(sha(sbox), hS0, "沙盒件已写");
  assert.equal(sha(t.lib), h0, "真库零写");
  const bakDir = path.join(t.root, "处理中心", "归档", "_备份归档");
  assert.ok(!fs.existsSync(bakDir) || fs.readdirSync(bakDir).length === 0, "真备份区零新增");
});

test("SYS-104 ⑤ 合法用法零回归（下一个/立卡/--show）", () => {
  const t = sandboxTree();
  const sbox = path.join(t.root, "沙盒3.md");
  fs.writeFileSync(sbox, "# SYS-3 老三\n\n正文提过 SYS-27\n", "utf-8");
  const r0 = q(t, ["下一个", "SYS", "--lib", sbox]);
  assert.equal(r0.status, 0);
  assert.equal(r0.stdout.trim(), "SYS-28", "查号输出须精确（程序化消费面）");
  const r1 = q(t, ["立卡", "SYS", "测试卡", "引子", ...F, "--lib", sbox]);
  assert.equal(r1.status, 0);
  assert.ok(r1.stdout.startsWith("✅ 立卡 SYS-28"), "立卡成功行格式不变（夹具 max=27 → 28）");
  const r2 = s(t, ["SYS-3", "--show", "--lib", sbox]);
  assert.equal(r2.status, 0, "只读 --show 可用");
});
