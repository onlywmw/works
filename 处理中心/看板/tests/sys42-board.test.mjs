// SYS-42 看板终端重构回归测试（高度自适应折叠 + 翻页 + g 全量出口 + 表格×旅程线联动）
// 跑法：node --test 处理中心/看板/tests/sys42-board.test.mjs
// 口径：SMOKE 单帧（BW_W/BW_H 定宽高，BW_SEL/BW_PAGE/BW_FULL 定状态）——不碰在跑引擎（smoke 无杀戒）
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fitRows, boardNavigate, seatStateOf } from "../engine.mjs";
import { collect } from "../board-data.mjs";

const BOARD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENGINE = path.join(BOARD, "engine.mjs");
const strip = (s) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");

function smoke(env) {
  const out = execFileSync(process.execPath, [ENGINE, "board"], {
    env: { ...process.env, SMOKE: "1", ...env },
    cwd: BOARD, encoding: "utf8", timeout: 30000,
  });
  const lines = strip(out).split(/\r?\n/);
  const idx = lines.findIndex((l) => l.includes("（SMOKE"));
  const frame = lines.slice(0, Math.max(0, idx - 1)); // render 帧 h 行（行尾 \r\n）
  return { raw: out, lines, frame };
}
const frameH = (env) => smoke(env).frame;
const tableRows = (frame) => frame.filter((l) => /│\s*[A-Z]+-?\d+/.test(l));
const activeIds = () => { // 实盘数据无关：全量出口里「在途」段全列（不含近日完成段）
  const { lines } = smoke({ BW_FULL: "1" });
  const head = lines.find((l) => l.includes("在途")) || "";
  const n = Number((head.match(/在途 (\d+) 单/) || [])[1] || -1);
  const idx = lines.findIndex((l) => l.trim().startsWith("—— 近日完成"));
  const scope = idx >= 0 ? lines.slice(0, idx) : lines;
  const ids = scope.filter((l) => /^\s+[A-Z]+-?\d+\s\s/.test(l)).map((l) => l.trim().split(/\s+/)[0]);
  return { n, ids };
};

test("SYS-42 fitRows：行预算=「分隔+行」2 线一行；截断强制留 1 行提示（不许无声截断）", () => {
  assert.deepEqual(fitRows(-1, 5), { vis: 0, hint: 0, doneN: 0 });
  assert.deepEqual(fitRows(11, 5), { vis: 5, hint: 0, doneN: 0 }); // 全显优先（无提示）
  assert.deepEqual(fitRows(10, 5), { vis: 4, hint: 1, doneN: 0 }); // 放不满→让一行给提示
  assert.deepEqual(fitRows(7, 5), { vis: 2, hint: 1, doneN: 0 });  // 提示塞不下→再让一行
  assert.deepEqual(fitRows(13, 5, 3), { vis: 5, hint: 0, doneN: 1 }); // 余粮挂完成行（2 线一行）
});

test("SYS-42 boardNavigate：j/k 步进、PgUp/PgDn 翻页、两端不越界（高亮跟手语义）", () => {
  const T = 7, S = 3;
  let s = boardNavigate({ rowSel: 1, pageStart: 0 }, "j", T, S);
  assert.equal(s.rowSel, 2);
  s = boardNavigate(s, "up", T, S);
  assert.equal(s.rowSel, 1);
  s = boardNavigate({ rowSel: 0, pageStart: 0 }, "pagedown", T, S); // 翻页→选中跟到新页首行
  assert.deepEqual(s, { rowSel: 3, pageStart: 3 });
  s = boardNavigate(s, "pagedown", T, S); // 末页（maxStart=4）
  assert.deepEqual(s, { rowSel: 4, pageStart: 4 });
  s = boardNavigate(s, "pagedown", T, S); // 末页再翻=原地（不回跳）
  assert.deepEqual(s, { rowSel: 4, pageStart: 4 });
  s = boardNavigate(s, "pageup", T, S);
  assert.deepEqual(s, { rowSel: 1, pageStart: 1 });
  assert.deepEqual(boardNavigate({ rowSel: 2, pageStart: 0 }, "pageup", T, S), { rowSel: 2, pageStart: 0 }); // 首页再翻=原地
  assert.deepEqual(boardNavigate({ rowSel: 6, pageStart: 4 }, "j", T, S), { rowSel: 6, pageStart: 4 });      // 末行下沉=原地
});

test("SYS-42 矮窗用例 h=22：折叠一行 + 保底 3 行 + 截断显式提示 + 不截断（底框在帧内）", () => {
  const f = frameH({ BW_W: "140", BW_H: "22" });
  assert.equal(f.length, 22, "帧行数=窗口高（不许超窗）");
  assert.ok(!f.some((l) => l.includes("巡检台") && l.includes("实现方式")), "矮窗主屏也无巡检台精灵表（SYS-46 D·数据无关：工单标题含『巡检台』不连坐）");
  // SYS-144 追加项（2026-09-29 用户令）：今日表 v2（含紧凑行）整表删除——两态都不许再出现
  assert.ok(!f.some((l) => l.includes("主仓任务") || l.includes("引擎升级")), "矮窗：今日表已删（不出现该表头）");
  assert.ok(f.some((l) => l.includes("└") && l.includes("┘")), "工单表底框必须可见（不无声截断）");
  const rows = tableRows(f);
  assert.ok(rows.length >= 3, `矮窗工单表保底 3 行，实得 ${rows.length}`);
  const { n } = activeIds();
  if (rows.length < n) assert.ok(f.some((l) => l.includes(`还有 ${n - rows.length} 单 · 按 g 看全`)), "截断必须显式提示「还有 N 单 · 按 g 看全」");
});

test("用户令 2026-09-11 v2：h=34 护工单表（核心四行+另有提示）+今日统计表（主仓/引擎/main）", () => {
  const f = frameH({ BW_W: "140", BW_H: "34" });
  assert.equal(f.length, 34);
  // 2026-10-01 用户令「就两行·红绿灯」——替七列表格：主屏含巡检台节+两哨兵+红绿灯点
  assert.ok(f.some((l) => l.includes("巡检台") && l.includes("─")), "巡检台节头在主屏");
  assert.ok(f.some((l) => l.includes("白鸽")) && f.some((l) => l.includes("看门狗")), "矮窗至少核心两行");
  assert.ok(f.some((l) => l.includes("●") && l.includes("白鸽")), "白鸽红绿灯点在");
  assert.ok(f.some((l) => l.includes("●") && l.includes("看门狗")), "看门狗红绿灯点在");
  const iWk = f.findIndex((l) => l.includes("工单") && l.includes("标题"));
  const iHy = f.findIndex((l) => l.includes("─ 巡检台"));
  assert.ok(iHy < iWk && iWk >= 0, "顺序：巡检台→工单（工单最底下）");
  assert.ok(!f.some((l) => l.includes("名下有活")), "灯图例已删（81巡直令）");
  assert.ok(!f.some((l) => l.includes("⏱ 数据时刻")), "⏱ 数据时刻已删（81巡直令）");
  assert.ok(!f.some((l) => l.includes("主仓任务") || l.includes("引擎升级") || l.includes("代码行数")), "高窗：今日表已删（表头/行全无）");
  assert.ok(f.some((l) => l.includes("└") && l.includes("┘")), "底框必须可见（不无声截断）");
  const rows = tableRows(f);
  const { n } = activeIds();
  if (rows.length < n) assert.ok(f.some((l) => l.includes("还有 ") && l.includes("按 g 看全")), "有截断必须有提示");
  const d = frameH({ BW_W: "140", BW_H: "34", BW_DRAWER: "1" });
  assert.ok(d.some((l) => l.includes("巡检台") && l.includes("软件配额")), "抽屉化还原：d 帧含巡检台表+配额列（入口可达）");
});

test("SYS-146 收口后：高窗 h=60=两哨兵终态·七退役名零出现", () => {
  const f = frameH({ BW_W: "140", BW_H: "60" });
  // 2026-10-01 红绿灯两行——锚面=巡检台节（─ 巡检台 ─ 到空行）
  const head = f.findIndex((l) => l.includes("─ 巡检台"));
  assert.ok(head >= 0, "帧内定位巡检台节头");
  const sprite = f.slice(head, head + 5).join("\n");
  const roster = ["白鸽", "看门狗"];
  for (const n of roster) {
    assert.ok(sprite.includes(n), `两哨兵含 ${n}`);
  }
  for (const gone of ["啄木鸟", "金丝雀", "猫头鹰", "屎壳郎", "建筑师", "处女座", "疯狗"]) {
    assert.ok(!sprite.includes(gone), `退役名 ${gone} 不得出现在巡检台节`);
  }
  assert.ok(!f.some((l) => l.includes("实现方式")), "旧七列实现方式列已删（红绿灯替代）");
  assert.ok(!f.some((l) => l.includes("另有")), "无折叠提示");
});

test("SYS-46 用户令：选中行/漂牌反显撤除（选中逻辑保留·仅无视觉）", () => {
  const { raw, frame } = smoke({ BW_W: "140", BW_H: "30", BW_SEL: "1" });
  assert.ok(!raw.includes("\x1b[7m"), "帧内不得出现反显（两高亮已撤·用户令）");
  assert.ok(frame.length === 30, "帧完好");
  // 选中逻辑保留：boardNavigate 状态机单测在案（案 2）
});

test("SYS-54 重写：BW_PAGE 页偏移按实际可见行推导（数据无关·4/5/6/12 各态兼容）", () => {
  // SYS-54（2026-09-11·设计师卡）：原期望依赖固定单数（n=4 整页装下时「第 2 页不含第 1 张」失配；n=12 时「含第 3 张」失配）。
  // 重写=期望从帧自身推导：可见行 vs 全量清单切片 + 提示页段（p1-p2/n）+ clamp(请求页, 末页) 三段对账；
  // 两个窗口各覆盖一分支：大窗（h=34）→「整页装下·翻页无效果」；小窗（h=18）→「截断·页偏移生效」。
  const { n, ids } = activeIds();
  if (!n || n < 2) return; // 无在途=无页可翻
  const run = (h) => {
    const { frame } = smoke({ BW_W: "140", BW_H: String(h), BW_PAGE: "2", BW_SEL: "2" });
    // ⑯批前修（设计师 2026-09-12 裁定 b）：近日完成行（全 ✓ 特征）不参与在途对账——表格含该段后 rows==在途ids 恒不成立
    const isAllCheck = (l) => (l.match(/✓/g) || []).length >= 5;
    const rows = tableRows(frame).filter((l) => !isAllCheck(l)).map((l) => (l.match(/│\s*([A-Z]+-?\d+)/) || [])[1]).filter(Boolean);
    assert.ok(rows.length > 0, `h=${h} 帧内应有工单行`);
    const hint = frame.find((l) => l.includes("按 g 看全")) || "";
    const m = hint.match(/（(\d+)-(\d+)\/(\d+) 张/);
    if (m) { // 截断分支：有翻页语义——可见行必须=提示页段，页偏移=请求页2 或末页夹取
      const p1 = Number(m[1]), p2 = Number(m[2]), total = Number(m[3]);
      assert.equal(total, n, "提示总单数=全量在途数");
      assert.deepEqual(rows, ids.slice(p1 - 1, p2), `可见行=提示页段 ${p1}-${p2}（数据无关）`);
      const expectStart = Math.min(2, Math.max(0, n - rows.length));
      assert.equal(p1 - 1, expectStart, "页偏移=请求页2 或末页 clamp");
      if (expectStart > 0) assert.ok(!rows.includes(ids[0]), "页偏移生效时不含第 1 张");
    } else { // 整页装下分支：翻页无可见效果——全体可见即正确语义（旧断言此态为伪期望）
      assert.deepEqual(rows, ids, "无翻页语义时=在途全量可见（数据无关期望）");
    }
  };
  run(34); // 态A：大窗（通常整页装下）
  run(18); // 态B：小窗（通常触发截断+页偏移）
});

test("SYS-42 g 全量出口：纯文本全量清单（在途全列 + 近日完成，无 ANSI，行尾 CRLF）", () => {
  const { raw, lines } = smoke({ BW_FULL: "1" });
  assert.ok(!/\x1b\[/.test(raw), "全量清单不允许 ANSI（普通缓冲可复制）");
  assert.ok(raw.includes("\r\n") && !/[^\r]\n/.test(raw), "行尾统一 CRLF（cmd 口径，无裸 LF）");
  assert.ok(lines[0].includes("全量清单"), "带标题与时刻");
  const { n, ids } = activeIds();
  assert.ok(ids.length >= n, `在途单全列（清单 ${ids.length} ≥ 表数 ${n}）`);
  assert.ok(lines.some((l) => l.includes("近日完成")) || n === 0, "完成单区存在");
});

test("SYS-42 R1 修复锁：①职责循环不因 fullMode 连坐；⑤BW_FULL 仅 SMOKE 生效（守卫源码锁）", () => {
  const src = fs.readFileSync(ENGINE, "utf8");
  assert.ok(!/tickAll = async \(\) => \{ try \{ if \(fullMode\) return/.test(src), "tickAll 不得因 fullMode 早退（职责连坐·必修①）");
  assert.ok(/if \(frozen \|\| fullMode\) return/.test(src), "render 已有 fullMode 停帧守卫（职责与停帧分治）");
  assert.ok(/if \(smoke && process\.env\.BW_FULL\)/.test(src), "BW_FULL 必须以 smoke && 为守卫（附记⑤锁）");
});

test("SYS-47 g 收尾锁：二次触发不重复打印（!fullMode 守卫）＋ g 在冻结守卫之后（冻结态不清框选屏）", () => {
  const src = fs.readFileSync(ENGINE, "utf8");
  assert.ok(/if \(k === "g" && !fullMode\) return fullListAndExit\(\)/.test(src), "g 必须带 !fullMode 守卫（回退守卫→本断言必红：二次 g 不重复打印）");
  const iFrozen = src.indexOf("if (frozen) return; // 冻结期间");
  const iG = src.indexOf('if (k === "g" && !fullMode)');
  assert.ok(iFrozen >= 0 && iG > iFrozen, "g 必须在冻结守卫之后（冻结态按 g 不清框选屏）");
});

test("SYS-42 SMOKE 钩子不越界：非 smoke 非终端环境不触发全量出口（早退原状）", () => {
  const out = execFileSync(process.execPath, [ENGINE, "board"], {
    env: { ...process.env, SMOKE: "", BW_FULL: "1" }, cwd: BOARD, encoding: "utf8", timeout: 30000,
  });
  assert.ok(out.includes("非终端环境"), "照旧早退（钩子仅 SMOKE 生效）");
  assert.ok(!out.includes("全量清单"), "BW_FULL 不得在非 smoke 下触发");
});

test("SYS-44 R2 配额格锁（SYS-46 D 后位于抽屉帧）：值=在途构成占比；系统格按上限判", () => {
  const { raw, frame } = smoke({ BW_W: "140", BW_H: "34", BW_DRAWER: "1" });
  const D = collect({ fast: true });
  const R = D.ledger?.active || [];
  const qt = JSON.parse(fs.readFileSync(path.join(BOARD, "工位绑定.json"), "utf8"))._quota.target;
  const qSum = (qt.product || 0) + (qt.factory || 0);
  const proT = Math.round((qt.product || 0) / qSum * 100), facT = 100 - proT;
  assert.ok(raw.includes("软件配额") && raw.includes("系统配额"), "两列在场（用户直令）");
  assert.ok(!frame.join("\n").includes("通报待回"), "通报待回列已删（用户直令）");
  if (R.length) {
    const proPct = Math.round(R.filter((r) => !/^SYS/i.test(r.id)).length / R.length * 100);
    const facPct = 100 - proPct;
    const plain = frame.join("\n");
    assert.ok(plain.includes(`${proPct}%`), `软件配额格值=实况（${proPct}%）`);
    assert.ok(plain.includes(`${facPct}%`), `系统配额格值（${facPct}%）`);
    assert.ok(!plain.includes(`${proPct}%/${proT}%`), "「/目标」冗余已去（81巡用户令）");
    const ESC = String.fromCharCode(27);
    const colored = (code, t) => { const i = raw.indexOf(t); if (i < 0) return false; const back = raw.lastIndexOf(ESC + "[" + code + "m", i); return back >= 0 && i - back <= 16; };
    assert.equal(colored(32, `${proPct}%`), proPct >= proT, "软件格绿 ⇔ 达标");
    assert.equal(colored(31, `${proPct}%`), proPct < proT, "软件格红 ⇔ 未达标");
    assert.equal(colored(32, `${facPct}%`), facPct <= facT, "系统格绿 ⇔ 不超标（上限判）");
    assert.equal(colored(31, `${facPct}%`), facPct > facT, "系统格红 ⇔ 超标（旧互补否定已修）");
  }
  assert.ok(/qFacPct <= qFacT \? C\.green : C\.red/.test(fs.readFileSync(ENGINE, "utf8")), "系统格源码锁：上限判（改回 >= 互斥否定 → 本断言必红）");
});

test("SYS-46 A：席位三态判定（纯函数矩阵）", () => {
  assert.deepEqual(seatStateOf(false, 1000, null), { glyph: "⚠️", label: "挂死嫌疑" }, "进程死 → 挂死嫌疑");
  assert.equal(seatStateOf(true, 30e3, null).label, "跑动中");
  assert.equal(seatStateOf(true, 30e3, null).glyph, null, "跑动中=字形按帧轮换（⏳/⌛）");
  assert.equal(seatStateOf(true, 25 * 60e3, 21 * 60e3).label, "挂死嫌疑", "有信>20m 且活动>20m → 挂死嫌疑（跑动判据不被绕过）");
  assert.equal(seatStateOf(true, 5 * 60e3, 21 * 60e3).label, "待命", "有信>20m 但 5 分钟前有活动 → 待命");
  assert.equal(seatStateOf(true, null, 25 * 60e3).label, "挂死嫌疑", "无会话记录 + 有信>20m → 挂死嫌疑");
  assert.equal(seatStateOf(true, 5 * 60e3, null).label, "待命");
});

test("SYS-46 A→用户令：席位行含 agent 名（⏳/⌛ 字形已撤·2026-09-11）", () => {
  const f = frameH({ BW_W: "140", BW_H: "34" });
  const row = f.find((l) => l.includes("pi") && l.includes("hermes"));
  assert.ok(row, "席位行含 agent 名（实得：" + f.slice(2, 4).join(" / ") + "）");
  assert.ok(!/(⏳|⌛)/.test(row), "⏳/⌛ 字形已撤（用户令）——实得：" + row);
});
