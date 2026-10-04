// SYS-59 工单重要性评分机制回归测试：取号闸 WSJF 必填 + bug ITIL 3×3 + check-priority-score 防滥
// 跑法：node --test 处理中心/看板/tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { parsePriorityBlock, itilPriority } from "../../机器闸/lib/parse-card.mjs";

const QUHAO = path.join(import.meta.dirname, "..", "..", "机器闸", "取号.mjs");
const CHECK = path.join(import.meta.dirname, "..", "..", "机器闸", "checks", "check-priority-score.mjs");
const mkLib = (content = "") => { const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mov-sys59-")), "工单库.md"); fs.writeFileSync(p, content, "utf-8"); return p; };
const run = (lib, args) => execFileSync("node", [QUHAO, ...args, "--lib", lib], { encoding: "utf-8" }).trim();
const reject = (lib, args) => { try { run(lib, args); return null; } catch (e) { return e.status; } };
const check = (lib) => { try { execFileSync("node", [CHECK, "--lib", lib, "--quiet"], { encoding: "utf-8" }); return { code: 0, out: "" }; } catch (e) { return { code: e.status, out: (e.stdout || "") + (e.stderr || "") }; } };
const F = ["--bv", "3", "--tc", "2", "--rr", "2", "--size", "1"];
const cardText = (id, date, block) => `# ${id} 构造卡\n\n**分类**：M2 体系/治理\n\n\`\`\`status\nphase: registered\nbranch: feat/x\nhead: —\nstd: 简式\ndelivery_id: —\ndesigner: —\ndev: —\ninspector: —\nmerge: —\nactor: 设计师\nupdated_at: ${date}T08:00:00\n\`\`\`\n\n${block}\n\n**状态**：📌 **已立卡 @${date}**（引子：构造）｜ **优先级**：P2\n`;
const blk = (lines) => "```priority\n" + lines.join("\n") + "\n```";

test("SYS-59① 取号闸缺 WSJF 任一分 → 拒（fail-closed·不落卡）", () => {
  const lib = mkLib("");
  assert.equal(reject(lib, ["立卡", "SYS", "缺分卡", "引子"]), 1, "全缺 → 拒");
  assert.equal(reject(lib, ["立卡", "SYS", "缺分卡", "引子", "--bv", "3", "--tc", "2", "--size", "1"]), 1, "只缺 --rr → 拒");
  assert.equal(fs.readFileSync(lib, "utf-8").includes("# SYS-"), false, "拒后库内无新卡");
});

test("SYS-59② 四因子齐 → 落卡+```priority 块字段可读（幂等：同输入同分）", () => {
  const a = mkLib(""), b = mkLib("");
  run(a, ["立卡", "SYS", "评分卡", "引子", ...F]);
  run(b, ["立卡", "SYS", "评分卡", "引子", ...F]);
  const pa = parsePriorityBlock(fs.readFileSync(a, "utf-8"));
  const pb = parsePriorityBlock(fs.readFileSync(b, "utf-8"));
  assert.deepEqual(pa, { wsjf_bv: "3", wsjf_tc: "2", wsjf_rr: "2", wsjf_size: "1", wsjf: "7", priority: "P2" }, "字段可读且值=输入");
  assert.deepEqual(pa, pb, "幂等：同因子两次立卡字段全同");
});

test("SYS-59③ 分值非法 → 拒（bv 非斐波那契 / size 无 3）", () => {
  const lib = mkLib("");
  assert.equal(reject(lib, ["立卡", "SYS", "坏分卡", "引子", "--bv", "4", "--tc", "2", "--rr", "2", "--size", "1"]), 1);
  assert.equal(reject(lib, ["立卡", "SYS", "坏分卡", "引子", "--bv", "3", "--tc", "2", "--rr", "2", "--size", "3"]), 1, "工程量档位无 3（MICRO1/小修2/场景5/结构8/超大13）");
  assert.equal(fs.readFileSync(lib, "utf-8").includes("# SYS-"), false);
});

test("SYS-59④ bug 子类 ITIL 3×3 → P0-P3 全格落卡", () => {
  for (let i = 1; i <= 3; i++) for (let u = 1; u <= 3; u++) {
    const lib = mkLib("");
    run(lib, ["立卡", "SYS", `bug卡${i}${u}`, "引子", ...F, "--kind", "bug", "--impact", String(i), "--urgency", String(u)]);
    const p = parsePriorityBlock(fs.readFileSync(lib, "utf-8"));
    assert.equal(p.kind, "bug");
    assert.equal(p.itil_impact, String(i));
    assert.equal(p.itil_urgency, String(u));
    assert.equal(p.priority, itilPriority(i, u), `impact${i}×urgency${u} → ${itilPriority(i, u)}`);
  }
});

test("SYS-59⑤ bug 缺 impact/urgency → 拒；bug 禁 --priority 覆盖", () => {
  const lib = mkLib("");
  assert.equal(reject(lib, ["立卡", "SYS", "残缺bug", "引子", ...F, "--kind", "bug"]), 1, "缺 impact/urgency → 拒");
  assert.equal(reject(lib, ["立卡", "SYS", "越权bug", "引子", ...F, "--kind", "bug", "--impact", "2", "--urgency", "2", "--priority", "P0"]), 1, "bug 优先级单源（矩阵推导），禁用 --priority");
});

test("SYS-59⑥ 机器校验：新卡缺分 → fail", () => {
  const lib = mkLib(cardText("SYS-90", "2026-09-12", "") + "\n" + cardText("SYS-91", "2026-09-12", ""));
  const r = check(lib);
  assert.equal(r.code, 1, "缺分卡必须 fail");
  assert.ok(r.out.includes("SYS-90 缺分"), "报告点名缺分卡");
});

test("SYS-59⑦ 机器校验：全 P1 分布 → fail（反「一切皆 P1」）", () => {
  const p1 = (id) => `# ${id} 全P1卡\n\n**分类**：M2 体系/治理\n\n**状态**：📌 **已立卡 @2026-09-11**（引子：构造）｜ **优先级**：P1\n`;
  const lib = mkLib(p1("SYS-92") + "\n" + p1("SYS-93") + "\n" + p1("SYS-94"));
  const r = check(lib);
  assert.equal(r.code, 1);
  assert.ok(r.out.includes("全部 P1"), "分布红线命中");
});

test("SYS-59⑧ 机器校验：正常分布 + 存量豁免 → pass", () => {
  const newok = cardText("SYS-95", "2026-09-12", blk(["wsjf_bv: 3", "wsjf_tc: 2", "wsjf_rr: 2", "wsjf_size: 1", "wsjf: 7", "priority: P2"]));
  const old = `# SYS-96 存量卡\n\n**分类**：M2 体系/治理\n\n**状态**：📌 **已立卡 @2026-09-11**（引子：构造）｜ **优先级**：P3\n`;
  const bugok = cardText("SYS-97", "2026-09-12", blk(["wsjf_bv: 2", "wsjf_tc: 2", "wsjf_rr: 2", "wsjf_size: 2", "wsjf: 3", "kind: bug", "itil_impact: 3", "itil_urgency: 3", "priority: P0"]));
  const lib = mkLib([newok, old, bugok].join("\n"));
  assert.equal(check(lib).code, 0, "合规新卡+存量无分+bug分样 → pass");
});

test("SYS-59⑨ 机器校验：值非法 / wsjf 不一致 → fail", () => {
  const bad1 = cardText("SYS-98", "2026-09-12", blk(["wsjf_bv: 4", "wsjf_tc: 2", "wsjf_rr: 2", "wsjf_size: 1", "wsjf: 8", "priority: P2"]));
  const bad2 = cardText("SYS-99", "2026-09-12", blk(["wsjf_bv: 3", "wsjf_tc: 2", "wsjf_rr: 2", "wsjf_size: 1", "wsjf: 9", "priority: P2"]));
  const r1 = check(mkLib(bad1));
  assert.equal(r1.code, 1);
  assert.ok(r1.out.includes("分值非法"), "bv=4 命中非法");
  const r2 = check(mkLib(bad2));
  assert.equal(r2.code, 1);
  assert.ok(r2.out.includes("wsjf 不一致"), "登记 9 ≠ 算得 7");
});

test("SYS-59⑩ 机器校验：只读幂等（连跑两次同结果，库文件零改写）", () => {
  const lib = mkLib(cardText("SYS-95", "2026-09-12", blk(["wsjf_bv: 3", "wsjf_tc: 2", "wsjf_rr: 2", "wsjf_size: 1", "wsjf: 7", "priority: P2"])));
  const before = fs.readFileSync(lib, "utf-8");
  assert.equal(check(lib).code, 0);
  assert.equal(check(lib).code, 0);
  assert.equal(fs.readFileSync(lib, "utf-8"), before, "校验器只读——库零改写");
});
