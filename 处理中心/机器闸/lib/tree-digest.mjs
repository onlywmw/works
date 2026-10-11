#!/usr/bin/env node
// tree-digest.mjs —— 交付树摘要锚（SYS-200 归一 · 索引态无关 · 单源）
//
// 语义：交付（set-status --phase delivered）把 worktree 全树摘要写卡面 `tree_digest`；
//       验收/审验/合并位用 delivery-drift-check.mjs 重算比对（不等 = 交付后动过树 ⇒ 红）。
// 口径（SYS-200 升级 · 2026-10-09）：**索引态无关**的内容指纹——
//   ① 路径集 = `git diff HEAD --name-only --no-renames`（含 intent-to-add 新增件）
//              ∪ `git ls-files -o --exclude-standard`（untracked 新增件）——两态并集同集（已实证）。
//   ② 逐路径取**工作树内容** sha256（缺失=DELETED·目录=DIR·可执行位带 x 标记）。
//   ③ 指纹 = sha256(排序后 `路径\t状态` 清单) 前 16 位。
//   不读 `git status` 状态行、不读 `git diff HEAD` 全文——`git add -N` 与 untracked 两态同判。
//   （旧口径把状态行 token 卷进指纹 ⇒ 索引态泄漏 ⇒ 610/612/613 三连假红；历史锚不回溯·新交付起按本口径。）
// 用法：
//   CLI：node 处理中心/机器闸/lib/tree-digest.mjs <worktree>   → 打印 16 位摘要（失败非零退出）
//   import { computeTreeDigest } from "./lib/tree-digest.mjs"  （delivery-drift-check.mjs 同引）
//   set-status.py 以子进程调本 CLI（同源防再分叉）。
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function gitNul(wt, args) {
  const buf = execFileSync("git", ["-C", wt, ...args], { windowsHide: true, maxBuffer: 1 << 28 });
  return buf.toString("utf-8").split("\0").filter(Boolean);
}

/** 交付树内容指纹（索引态无关）：sha256(排序后「路径\t内容哈希」清单) 前 16。抛错=git/IO 失败。 */
export function computeTreeDigest(wt) {
  const changed = gitNul(wt, ["diff", "HEAD", "--name-only", "--no-renames", "-z"]);
  const untracked = gitNul(wt, ["ls-files", "-o", "--exclude-standard", "-z"]);
  const paths = [...new Set([...changed, ...untracked])].sort();
  const rows = paths.map((p) => {
    const abs = path.join(wt, p);
    let state;
    try {
      const st = fs.statSync(abs);
      if (st.isDirectory()) {
        state = "DIR";
      } else {
        const h = crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
        state = "h:" + h + (st.mode & 0o111 ? "+x" : "");
      }
    } catch {
      state = "DELETED";
    }
    return p + "\t" + state;
  });
  return crypto.createHash("sha256").update(rows.join("\n"), "utf-8").digest("hex").slice(0, 16);
}

// CLI 入口（同为 set-status.py 的调用面）
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const wt = process.argv[2];
  if (!wt) {
    console.error("用法：node lib/tree-digest.mjs <worktree>");
    process.exit(2);
  }
  try {
    console.log(computeTreeDigest(wt));
  } catch (e) {
    console.error("TREE_DIGEST_ERR " + String((e && e.message) || e).slice(0, 200));
    process.exit(1);
  }
}
