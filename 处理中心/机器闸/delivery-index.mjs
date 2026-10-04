#!/usr/bin/env node
// 交付清单索引生成器 —— 扫描 交付清单/*.json → 人可读索引表落 汇报区\
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(HERE, "..", "..");
const CENTER = path.join(SYS, "处理中心");
const DIR = path.join(CENTER, "交付清单");
const OUT = path.join(CENTER, "汇报区", "交付清单索引.md");

const files = fs.readdirSync(DIR).filter(f => f.endsWith(".json")).sort();
const rows = files.map(f => {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf-8"));
    return {
      ticket: j.ticket_id || "—",
      del: j.delivery_id || "—",
      std: j.standard_id ? (j.standard_id.length > 30 ? j.standard_id.slice(0, 28) + "…" : j.standard_id) : "—",
      head: (j.code_commit_sha || "—").toString().slice(0, 10),
      date: j.delivered_at ? j.delivered_at.toString().slice(0, 10) : "—",
      evid: (j.evidence_manifest || []).length,
      sha: (j.evidence_manifest_sha || "").slice(0, 12),
    };
  } catch { return { ticket: "解析失败", del: f, std: "—", head: "—", date: "—", evid: 0, sha: "—" }; }
}).sort((a, b) => a.ticket.localeCompare(b.ticket));

const md = `# 交付清单索引（机器生成）

> 复跑：node 机器闸/delivery-index.mjs；manifest 凭据原文在 交付清单/，本表为速查视图。
> 共 **${rows.length}** 份交付凭据。

| 工单 | delivery_id | STD | code head | 日期 | 证据件 | manifest_sha |
|---|---|---|---|---|---|---|
${rows.map(r => `| ${r.ticket} | ${r.del} | ${r.std} | ${r.head} | ${r.date} | ${r.evid} | ${r.sha} |`).join("\n")}
`;
fs.writeFileSync(OUT, md, "utf-8");
console.log(`✅ ${OUT}（${rows.length} 份）`);
