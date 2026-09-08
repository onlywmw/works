/**
 * self-test.mjs —— SYS-10 批④ · 状态机变异锚（registry JSON ↔ mjs 视图一致性）
 *
 * 承诺兑现：多文件注释「label/terminal/TRANSITIONS 改动 → 锚必红」——此前锚实体不存在。
 *
 * 三域突变检红：
 *   1. label 域：STATUS_REGISTRY 任意 phase 的 label 被改动 → 红
 *   2. terminal 域：terminal boolean 被翻转 → 红
 *   3. TRANSITIONS 域：合法迁移被删除/非法迁移被添加 → 红
 * 附加：registry JSON 文件（若存在）与 mjs 视图一致性
 */

import { STATUS_REGISTRY, TRANSITIONS, isPhase, labelOf, isTerminal, normalizeAlias, canTransition } from "./status-registry.mjs";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
let failed = 0;

function check(name, cond) {
  if (cond) { console.log(`  [PASS] ${name}`); }
  else { console.error(`  [FAIL] ${name}`); failed++; }
}

// ---- 1. label 域锚：六态 label 精确匹配（任何改动→红） ----
{
  const EXPECTED_LABELS = {
    queued: "已立卡",
    assigned: "已派单",
    delivering: "施工中",
    merged: "已合 main",
    archived: "作废/归档",
    rejected: "回炉",
  };
  console.log("[self-test] 1. label 域锚");
  for (const [phase, expectedLabel] of Object.entries(EXPECTED_LABELS)) {
    check(`${phase}.label == "${expectedLabel}"`, STATUS_REGISTRY[phase]?.label === expectedLabel);
  }
}

// ---- 2. terminal 域锚：精确布尔（翻转→红） ----
{
  const EXPECTED_TERMINAL = {
    queued: false,
    assigned: false,
    delivering: false,
    merged: true,
    archived: true,
    rejected: false,
  };
  console.log("[self-test] 2. terminal 域锚");
  for (const [phase, expectedTerminal] of Object.entries(EXPECTED_TERMINAL)) {
    check(`${phase}.terminal == ${expectedTerminal}`, STATUS_REGISTRY[phase]?.terminal === expectedTerminal);
  }
}

// ---- 3. TRANSITIONS 域锚：合法迁移全在（删→红）+ 非法迁移全拒（加→红） ----
{
  console.log("[self-test] 3. TRANSITIONS 域锚");
  // 合法迁移白名单（任何一条被删→红）
  const REQUIRED_TRANSITIONS = [
    ["queued", "assigned"],
    ["queued", "archived"],
    ["assigned", "delivering"],
    ["assigned", "archived"],
    ["delivering", "delivered"],
    ["delivering", "merged"],
    ["delivering", "rejected"],
    ["delivering", "archived"],
    ["rejected", "delivering"],
    ["rejected", "archived"],
  ];
  for (const [from, to] of REQUIRED_TRANSITIONS) {
    check(`canTransition(${from}→${to}) == true`, canTransition(from, to) === true);
  }
  // 非法迁移（任何一条放行→红）
  const FORBIDDEN = [
    ["queued", "delivered"],
    ["queued", "merged"],
    ["delivered", "delivering"],
    ["merged", "delivering"],
    ["merged", "queued"],
    ["merged", "assigned"],
    ["merged", "delivering"],
    ["archived", "delivering"],
    ["archived", "assigned"],
    ["archived", "merged"],
  ];
  for (const [from, to] of FORBIDDEN) {
    check(`canTransition(${from}→${to}) == false`, canTransition(from, to) === false);
  }
}

// ---- 4. 别名归一锚 ----
{
  console.log("[self-test] 4. 别名归一锚");
  check("normalizeAlias(dispatched)==assigned", normalizeAlias("dispatched") === "assigned");
  check("normalizeAlias(in_progress)==delivering", normalizeAlias("in_progress") === "delivering");
  check("normalizeAlias(closed)==archived", normalizeAlias("closed") === "archived");
  check("normalizeAlias(obsolete)==archived", normalizeAlias("obsolete") === "archived");
  check("normalizeAlias(cancelled)==archived", normalizeAlias("cancelled") === "archived");
}

// ---- 5. registry JSON 一致性（若 JSON 文件存在） ----
{
  const jsonPath = join(__dirname, "status-registry.json");
  if (existsSync(jsonPath)) {
    console.log("[self-test] 5. registry JSON 一致性");
    const jsonObj = JSON.parse(readFileSync(jsonPath, "utf8"));
    const reg = jsonObj.STATUS_REGISTRY || jsonObj;  // 双层主数据（SYS-10 R1）兼容平铺旧形
    for (const [phase, entry] of Object.entries(STATUS_REGISTRY)) {
      const j = reg[phase];
      check(`JSON.${phase} label 一致`, j?.label === entry.label);
      check(`JSON.${phase} terminal 一致`, j?.terminal === entry.terminal);
    }
  }
}

// ---- 6. isPhase/labelOf/isTerminal 端口函数 ----
{
  console.log("[self-test] 6. 端口函数");
  check("isPhase(merged)==true", isPhase("merged") === true);
  check("isPhase(bogus)==false", isPhase("bogus") === false);
  check("labelOf(merged)==已合 main", labelOf("merged") === "已合 main");
  check("isTerminal(merged)==true", isTerminal("merged") === true);
  check("isTerminal(delivering)==false", isTerminal("delivering") === false);
}

console.log(failed === 0 ? "\n[self-test] 全部通过" : `\n[self-test] ${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
