#!/usr/bin/env node
// UPG-389 skinGate 双向闸·**薄壳**（处理中心/机器闸）
//
// 规则唯一真源＝`<repo>/tools/ms-md-server/page/src/lib/skinGate.mjs`（页面侧 390 与 CI 侧都 import 同一份）。
// 本壳只做：加载真源 → 跑夹具 → 报 rc。**MUST NOT 重写任何规则**（不出现规则字符串/阈值字面量）。
//
// 用法：
//   node 处理中心/机器闸/skinGate-verify.mjs [--repo <0027-mov 路径>] [--json]
// 退出码：0=双向夹具全过 ｜ 1=有红 ｜ 2=用法/环境错
//
// 纪律（派单 §四）：夹具一律内存字符串/临时树——**变异不在真仓工具与真数据上跑**；每类风险两向读数。
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { PRODUCT } from './lib/root.mjs' // SYS-160：根解析单源（缺省=原 E:/mov归档/0027-mov）

const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const REPO_GIVEN = process.argv.includes('--repo')
const REPO = path.resolve(String(opt('--repo', PRODUCT)))
if (!REPO_GIVEN) console.error('⚠ 未显式给 --repo ⇒ 默认读主树 E:/mov归档/0027-mov（若在交付树复核请显式 `--repo <worktree>`——读数点错对象＝假绿；2026-10-01 UPG-395 审验提请）')
const JSON_OUT = args.includes('--json')

const SRC = path.join(REPO, 'tools/ms-md-server/page/src/lib/skinGate.mjs')
const FIX = path.join(REPO, 'tools/ms-md-server/page/tests/skinGate.fixtures.mjs')
for (const [label, p] of [['真源', SRC], ['夹具', FIX]]) {
  if (!fs.existsSync(p)) { console.error(`❌ ${label}不存在：${p}（--repo 指对了吗）`); process.exit(2) }
}

const gate = await import(pathToFileURL(SRC).href)
const fx = await import(pathToFileURL(FIX).href)

const rows = []
const push = (kind, name, pass, reading) => rows.push({ kind, name, pass, reading })
const fmt = (r) => (r.reasons || []).map((x) => x.code).join(',') || '—'

// ① 零误杀：三份合法稿
for (const f of fx.VALID) {
  const r = gate.checkStatic(f.html, f.ctx)
  push('合法稿', f.name, r.ok === true, r.ok ? 'ok:true reasons:—' : `ok:false ${fmt(r)}`)
}
// ⑥ 槽内动态值不误杀
{
  const r = gate.checkStatic(fx.SLOT_INSIDE_OK.html, fx.SLOT_INSIDE_OK.ctx)
  push('合法稿', fx.SLOT_INSIDE_OK.name, r.ok === true, r.ok ? 'ok:true reasons:—' : `ok:false ${fmt(r)}`)
}
// ① 五类注入＋补强：必红且 code 命中
for (const c of fx.INJECT) {
  const r = gate.checkStatic(c.html, c.ctx)
  const hit = !r.ok && r.reasons.some((x) => x.code === c.code)
  push('注入必红', c.name, hit, `ok:${r.ok} 期望 code=${c.code} 实得=${fmt(r)}`)
}
// ① a11y：合法绿＋三条红
{
  const r = gate.checkA11y(fx.A11Y_OK)
  push('a11y 合法', '默认阈值样本', r.ok === true, r.ok ? 'ok:true' : fmt(r))
}
for (const c of fx.A11Y_BAD) {
  const r = gate.checkA11y(c.metrics)
  const hit = !r.ok && r.reasons.some((x) => x.code === c.code)
  push('a11y 必红', c.name, hit, `ok:${r.ok} 期望 code=${c.code} 实得=${fmt(r)}`)
}
// ④ §26 对齐（逐位一致）
for (const c of fx.SEC26) {
  const got = +gate.contrastRatio(c.fg, c.bg).toFixed(2)
  push('§26 对齐', `${c.name} ${c.fg} on ${c.bg}`, got === c.expect, `读数 ${got}（期望 ${c.expect}）`)
}

const red = rows.filter((r) => !r.pass)
const summary = { at: new Date().toLocaleString('sv-SE'), repo: REPO, total: rows.length, red: red.length }
if (JSON_OUT) {
  console.log(JSON.stringify({ summary, rows }, null, 2))
} else {
  console.log(`skinGate 双向闸（薄壳·真源 ${path.relative(process.cwd(), SRC).replace(/\\/g, '/')}）@ ${summary.at}`)
  for (const r of rows) console.log(`  ${r.pass ? '✅' : '❌'} [${r.kind}] ${r.name} —— ${r.reading}`)
  console.log(`\n合计 ${summary.total} 项，红 ${summary.red}`)
  console.log(summary.red === 0 ? '✅ 双向过（五类注入全红／合法稿零误杀／a11y 三红／§26 逐位一致）' : '❌ 有红（见上）')
}
process.exit(summary.red === 0 ? 0 : 1)
