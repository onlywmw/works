#!/usr/bin/env node
// -*- coding: utf-8 -*-
// envelope.mjs — 发信信封单一通道（唯一 ID + 信封构造），SYS-16
//
// 根因（2026-09-10 五巡红①③）：engine 两处发信各自手写秒级 ID（LTR-YYYYMMDD-HHMMSS）
// 且 writeFileSync(路径+ID) 直写文件名——同秒同角色连发=静默覆盖丢信（无任何痕迹）；
// 手写信封又绕过 post-office，缺 ref 字段 → 哨兵盲区。收敛为唯一模块，堵死两红。
//
// ID 与 post-office 严格同构（毫秒 + 3 位 base36 随机后缀），禁止第三份实现漂移。

const pad = (n, w = 2) => String(n).padStart(w, "0");
const compact = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

// LTR-YYYYMMDD-HHMMSS-mmm-xxx（ms=毫秒 3 位，xxx=36³=46656 随机后缀）——同秒并发不撞车（SYS-17 后缀 2→3 位）
export function newId(d = new Date()) {
  const ms = pad(d.getMilliseconds(), 3);
  const suffix = Math.floor(Math.random() * 46656).toString(36).padStart(3, "0");
  return `LTR-${compact(d)}-${ms}-${suffix}`;
}

// 信封构造：frontmatter 全字段，ref 常驻（缺省 —）——哨兵据此机器可读判链路
export function buildEnvelope({ id, from, to, type, re, ref, created, payload, sha, status = "未读" }) {
  return [
    "---",
    `id: ${id}`,
    `from: ${from}`,
    `to: ${to}`,
    `type: ${type}`,
    `re: ${re}`,
    `ref: ${ref || "—"}`,
    `created: ${created || new Date().toLocaleString("sv-SE")}`,
    `status: ${status}`,
    `payload: ${payload || "—"}`,
    `sha: ${sha || "—"}`,
    "---",
  ].join("\n");
}

// 信封解析：读路径单一通道（2026-09-10 审查⑥——写收敛了读碎成五份，这是下半场）
// 返回全字段 + body（frontmatter 之后的正文）
export function parseEnvelope(raw) {
  const g = (k) => (String(raw).match(new RegExp(`^${k}:\\s*(.+)$`, "m")) || [])[1]?.trim() || "";
  return {
    id: g("id"), from: g("from"), to: g("to"), type: g("type"), re: g("re"), ref: g("ref"),
    created: g("created"), status: g("status"), payload: g("payload"), sha: g("sha"),
    body: String(raw).replace(/^---[\s\S]*?\r?\n---\r?\n?/, ""),
  };
}

// 文本内票据号（无锚，用于信件 re/正文里捞单号）；带锚的整串校验用各模块自有 TICKET_RE
export const TICKET_IN_TEXT = /(?:UPG|SYS|W|S|HMOS)-[A-Za-z0-9]+/;
