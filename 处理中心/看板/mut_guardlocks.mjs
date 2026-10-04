#!/usr/bin/env node
// SYS-51/52 守卫锁 + 挂点接线 · 变异亲杀（原地改+改回；每轮恢复原件）
// M1 去「不咬主人」守卫（role===巡检台）→ sys30 主人案必红
// M2 去「灯尸」守卫（agentPid 死 continue）→ sys30 灯尸案必红
// M3 去 serve.tick 挂点 scanClaimStale()→ sys52 接线自证案必红
// 跑法：node mut_guardlocks.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BOARD = path.dirname(fileURLToPath(import.meta.url));
const ENG = path.join(BOARD, "engine.mjs");
const orig = fs.readFileSync(ENG, "utf8");

const MUTS = [
  ["M1 去不咬主人守卫", '      if (role === "巡检台") continue; // 不咬主人\n', "      // MUT: 不咬主人守卫移除\n"],
  ["M2 去灯尸守卫", "      if (seat.agentPid) { try { process.kill(seat.agentPid, 0); } catch { continue; } } // 灯尸归看门狗\n", "      // MUT: 灯尸守卫移除\n"],
  ["M3 去 serve.tick 挂点", "        fault(\"serve.tick\", e); }", "        fault(\"serve.tick\", e); }"],
];

function run() {
  try {
    const out = execFileSync(process.execPath, ["--test", "tests/sys30-maddog.test.mjs", "tests/sys52-claim-stale.test.mjs"], { windowsHide: true, cwd: BOARD, encoding: "utf8", timeout: 120000, stdio: ["ignore", "pipe", "pipe"] });
    const m = out.match(/# fail (\d+)/);
    return { code: 0, fails: Number(m ? m[1] : 0), out };
  } catch (e) {
    const out = (e.stdout || "") + (e.stderr || "");
    const m = out.match(/# fail (\d+)/);
    return { code: e.status ?? 1, fails: Number(m ? m[1] : -1), out };
  }
}

let allKilled = true;
try {
  for (const [name, old, neu] of MUTS) {
    let mutated;
    if (name.startsWith("M3")) {
      // serve.tick 行内去 scanClaimStale();
      const lines = orig.split("\n");
      mutated = lines.map((l) => (l.includes('fault("serve.tick"') ? l.replace("scanClaimStale(); ", "") : l)).join("\n");
      if (mutated === orig) { console.log(`[SKIP? ] ${name}: 锚点未命中`); allKilled = false; continue; }
    } else {
      if (!orig.includes(old)) { console.log(`[SKIP? ] ${name}: 锚点未命中`); allKilled = false; continue; }
      mutated = orig.replace(old, neu);
    }
    fs.writeFileSync(ENG, mutated, "utf8");
    const r = run();
    const killed = r.code !== 0 && r.fails > 0;
    console.log(`[${killed ? "KILLED  " : "SURVIVED"}] ${name} (exit=${r.code} fails=${r.fails})`);
    if (!killed) allKilled = false;
  }
} finally {
  fs.writeFileSync(ENG, orig, "utf8");
}
const base = run();
console.log(`[${base.code === 0 ? "BASELINE-GREEN" : "BASELINE-RED"}] 恢复原件后基线 (exit=${base.code} fails=${base.fails})`);
process.exit(allKilled && base.code === 0 ? 0 : 1);
