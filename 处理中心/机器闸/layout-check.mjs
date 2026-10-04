#!/usr/bin/env node
// 目录布局检查器（2026-09-02）——防「工单系统角色散落到 E:\MOV 根层」复发
// 用法：node 处理中心\机器闸\layout-check.mjs [--root <E:\MOV 路径>]
// 退出码：0=干净；1=检出违规
// 2026-09-30（卫生轮28 配套）：白名单三源改为导出 + 主执行加 main 守卫——供 precommit-check 复用
// ROLE_RULES 在**提交面**复检角色根层（写入面闸；此前只在体检轮事后红）。直接跑/被 import 行为不变。
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SYS = path.resolve(here, "..", "..");            // 工单系统/

// 禁止出现在根层的工单系统角色/文件（唯一权威=工单系统/）
const FORBIDDEN = [
  "设计师", "审验员", "程序员", "验收员", "处理中心",
  "工单表.xlsx", "挂账登记表.md",
  "调试", "upg50-ph2-cdp", "验证产物",
];

// 体系根目录卫生标准（2026-09-09 定稿）：白名单外=卫生红（红线13 的机器执行）
// SYS-23 政策反转：工具痕迹目录（.reasonix 类）「就不能存在」——撤 SYS-11 的 .reasonix/reasonix.toml 登记（登记=放行，与现政策冲突）；与体检.mjs 第⑧节「存在即红」构成双闸联防（大神拍板 2026-09-10）
// SYS-31：.githooks 补登——体系仓专用 pre-commit 提交闸（sync-orders --check + card-phase-audit，core.hooksPath 已配；works 根 .githooks 正式件先例，根层哨兵首单定性 @2026-09-10）
// 报错文案直接引用本集合——与集合同口径、永不再手工脱节（SYS-11 收口根治旧硬编码漏 .git/.workbuddy 之弊）
export const SYS_WHITELIST = new Set(["README.md", "项目配置.md", ".gitignore", ".gitattributes", ".git", ".workbuddy", ".githooks", "设计师", "程序员", "验收员", "审验员", "巡检台", "处理中心", "云服务器管理", "运营中心", "MOV看板.lnk"]); // 云服务器管理/运营中心=体系内部成员·独立嵌套库（2026-09-10 用户拍板）；MOV看板.lnk=根层看板快捷方式（2026-09-12 用户拍板认领 · 2026-09-29 补登·对齐网页范本）；.gitattributes=归档面字节保真（SYS-159 在途件·2026-10-01 即时补登·巡检台卫生通报）——**本 Set 是根层哨兵的单源**（engine.mjs readSetLiteral 直读此处，改此一处哨兵同愈）
// 处理中心根层白名单（卫生要求§八 · 2026-09-09 上闸）
export const CENTER_WHITELIST = new Set(["README.md", "工单库.md", "挂账登记表.md", "运行状态.md", "工单审验状态.md", "交付清单", "汇报区", "问题区", "验收标准冻结区", "归档", "机器闸", "邮局", "看板", "验证产物", "工单库_归档"]); // 验证产物=红线26②生成物落点（orders-overview 等）；工单库_归档=2026-09-27 清洗归档区（2026-09-29 补录·用户令）
// 角色目录卫生白名单（2026-09-09 定稿·程序员样板；其余角色定稿时按同构登记）
export const ROLE_RULES = {
  "程序员": { fixed: ["README.md", "交付报告", "ponytail-bench", "_tools"], pattern: /-evidence$/i },
  "设计师": { fixed: ["README.md", "项目配置.md", "派单", "方案设计", "证据数据", "经验库", "_tools", "卡片库", "归档", "例行产出"], pattern: null }, // 五件制 2026-09-09 作者拍板；归档=2026-09-29 静态体系归档区（用户令补录·含 58 件 MANIFEST）；2026-09-30 归一：检查证据→证据数据（巡检台轮28 建议 a·与验收/审验席同名·零迁移）
  "验收员": { fixed: ["README.md", "项目配置.md", "文档", "_tools", "_selfcheck", "证据数据", "例行产出"], pattern: null }, // 六件制 2026-09-09
  "审验员": { fixed: ["README.md", "项目配置.md", "_selfcheck", "_tools", "证据数据", "例行产出"], pattern: null }, // 工具房件制 2026-09-09（根层工具文件按扩展名放行）
  "巡检台": { fixed: ["README.md", "项目配置.md", "_tools", "checks", "白鸽", "看门狗"], pattern: /^设计报告_.*.md$/ }, // 六件制 2026-09-10（主题=三主题资料包、目标=北极星+对齐清单、checks=检查项注册表——方向性资产受闸保护，误清=事故）
};

/** 跑全部布局检查，返回违规清单（空=干净）。--root 缺省=体系库所在盘的 MOV 根。 */
export function checkLayout({ root } = {}) {
  const SYS_ = SYS;
  const ROOT = root ? path.resolve(root) : path.dirname(SYS);
  const errors = [];

  for (const name of FORBIDDEN) {
    const p = path.join(ROOT, name);
    if (fs.existsSync(p)) errors.push(`根层出现工单系统内容: ${name}`);
  }

  // 工单系统完整性
  const lib = path.join(SYS_, "处理中心", "工单库.md");
  if (!fs.existsSync(lib)) errors.push("工单库.md 缺失");
  else {
    const t = fs.readFileSync(lib, "utf8");
    const cards = (t.match(/^# (?:UPG|SYS|W|S|HMOS)-\d+/gm) || []).length;
    // 防清空闸（原≥50硬阈值对新植入体系误报——2026-09-10 植入器实测）：账本有过内容（>5KB）而卡数锐减才是事故信号；新体系 0 卡正常
    if (cards < 50 && t.length > 5120) errors.push(`工单卡数异常: ${cards}（账本 ${Math.round(t.length / 1024)}KB 但卡数 <50——疑似清空事故；新体系初始 0 卡为正常）`);
  }
  for (const name of fs.readdirSync(SYS_)) {
    if (!SYS_WHITELIST.has(name)) errors.push(`体系根层越界项: ${name}（白名单=${[...SYS_WHITELIST].join("/")}——红线13）`);
    // 2026-09-30 加固（巡检台·设计师 01:21 建议）：根层 ** 名与 0 字节件=引号/重定向事故特征（体系内无合法用途·误杀风险≈0）
    if (name.includes("**")) errors.push(`体系根层通配残留名: ${name}（** 特征=命令引号/重定向事故残留——2026-09-30 立）`);
    try { const st = fs.statSync(path.join(SYS_, name)); if (st.isFile() && st.size === 0) errors.push(`体系根层 0 字节件: ${name}（疑似事故残留）`); } catch {}
  }
  for (const name of fs.readdirSync(path.join(SYS_, "处理中心"))) {
    if (!CENTER_WHITELIST.has(name)) errors.push(`处理中心根层越界: ${name}（白名单=${[...CENTER_WHITELIST].filter(x => x.includes(".")).length}文件+${[...CENTER_WHITELIST].filter(x => !x.includes(".")).length}目录，卫生要求§八）`);
  }
  for (const [role, rule] of Object.entries(ROLE_RULES)) {
    const rd = path.join(SYS_, role);
    for (const name of fs.readdirSync(rd)) {
      if (!rule.fixed.includes(name) && !(rule.pattern && rule.pattern.test(name)))
        errors.push(`角色根层越界（${role} 卫生要求§1）: ${name}（白名单见该角色手册卫生节）`);
    }
  }
  for (const d of ["设计师", "审验员", "程序员", "验收员", "处理中心"]) {
    if (!fs.existsSync(path.join(SYS_, d))) errors.push(`工单系统/ 缺目录: ${d}`);
  }
  return errors;
}

function isMain() {
  try { return fs.realpathSync(process.argv[1] || "") === fs.realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}

if (isMain()) {
  const i = process.argv.indexOf("--root");
  const errors = checkLayout({ root: i > 0 ? process.argv[i + 1] : undefined });
  if (errors.length) {
    console.log("❌ LAYOUT CHECK FAIL");
    for (const e of errors) console.log("  - " + e);
    process.exit(1);
  }
  console.log("✅ LAYOUT CHECK PASS（根层无工单系统散落；工单系统/ 结构完整）");
}
