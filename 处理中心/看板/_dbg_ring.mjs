// 复现 ringUnreadSeats 的 actionable 判定（真实数据）
import { collect } from "./board-data.mjs";
import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PHASE_OWNER = { registered: "设计师", dispatched: "程序员", claimed: "程序员", in_progress: "程序员", delivered: "验收员", accepted: "审验员", audited: "设计师" };
const D = collect({ fast: true });
console.log("ledger.active:", D.ledger.active.map(r => r.id + ":" + r.phase));
const phaseMap = new Map((D.ledger?.active || []).map(r => [r.id, PHASE_OWNER[r.phase]]).filter(([, v]) => v));
console.log("phaseMap:", [...phaseMap]);
for (const role of ["设计师", "程序员", "验收员", "审验员"]) {
  const inbox = path.join(HERE, "..", "邮局", "邮箱", role, "INBOX");
  if (!fs.existsSync(inbox)) continue;
  const fresh = fs.readdirSync(inbox).filter(f => f.endsWith(".md"));
  if (!fresh.length) continue;
  console.log(`[${role}] ${fresh.length} 封：`);
  for (const f of fresh) {
    const raw = fs.readFileSync(path.join(inbox, f), "utf-8");
    const tp = (raw.match(/^type:\s*(.+)$/m) || [])[1] || "";
    const to = (raw.match(/^to:\s*(.+)$/m) || [])[1] || "";
    const re = (raw.match(/^re:\s*(.+)$/m) || [])[1] || "";
    const id = (re.match(/(?:UPG|SYS|W|S|HMOS)-[A-Za-z0-9]+/) || [])[0];
    const verdict = tp.trim() === "打回" ? "敲(打回特赦)" : (!id ? "敲(无号兜底)" : ((phaseMap.get(id) || role) === role ? "敲(相位匹配)" : "不敲(票已离站)"));
    console.log(`  ${f} type=${tp.trim()} to=${to.trim()} id=${id || "?"} → ${verdict}`);
  }
}
