// device-version.mjs —— 设备包指纹解析/推导「单一真源」（SYS-184·change=device-package-governance·D1/D4）
//
// 格式（D1）：`V1.1-<shortSha>[+<branchMark>][+dirty]`
//   · 读取规则唯一化：**base sha＝`V1.1-` 后至首个 `+`**；带后缀 ⇒ 非 main 净树。
//   · 推导（fingerprintOf）与产品仓 app/build.gradle.kts 的 gitFingerprintSuffix()（UPG-523）同法：
//     branchMark＝`feat/upg523` ⇒ `+upg523`（取最后一段）；`main`／detached(HEAD)／解析失败 ⇒ 无；dirty＝`status --porcelain` 非空 ⇒ `+dirty`；
//     无 git 环境 ⇒ `V1.1-nogit+nogit`（显式可辨·不冒充 main 净树）。
// 消费者：装机.mjs（回读断言/台账/自判）· precheck-l23（--expect-device 跑前门）· engine.mjs（空闲回主）——禁各样各写（D4）。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** `V1.1-` 后至首个 `+`（无 `V1.1-` 前缀/解析失败 ⇒ ""）。 */
export function baseSha(v) {
  const s = String(v || "");
  const i = s.indexOf("V1.1-");
  if (i < 0) return "";
  return s.slice(i + 5).split("+")[0].trim();
}

/** 首个 `+` 起的后缀（净树 ⇒ ""）。 */
export function suffixOf(v) {
  const s = String(v || "");
  const i = s.indexOf("+");
  return i < 0 ? "" : s.slice(i);
}

/** 非 dirty 后缀（分支标记，如 `+upg519`）；净树/纯脏 ⇒ ""。 */
export const branchMarkOf = (v) => suffixOf(v).replace(/\+dirty/g, "");

/**
 * 设备现值 == 「main 线」形态：base＝main 短 sha 且**无分支标记**（D1 备注：`+dirty` 容忍——main 检出常态带
 * 账本/文档类脏项，构建即带 `+dirty`；真正要挡的是工作树包「带分支标记冒充 main」，即 518 案根因）。
 */
export function isMainLine(v, mainShort) {
  if (!mainShort) return false;
  return baseSha(v) === mainShort && branchMarkOf(v) === "";
}

const tryGit = (tree, args) => {
  try { return execFileSync("git", ["-C", tree, ...args], { encoding: "utf8", windowsHide: true }).trim(); }
  catch { return ""; }
};

/** 树 HEAD 短 sha（＝构建期嵌入的 `--short` 口径；无 git ⇒ ""）。 */
export function gitShort(tree) {
  return tryGit(tree, ["rev-parse", "--short", "HEAD"]);
}

/** 树 HEAD 全 sha（无 git ⇒ ""）。 */
export function gitHead(tree) {
  return tryGit(tree, ["rev-parse", "HEAD"]);
}

/** 树期望指纹（D1）——与产品仓 gitFingerprintSuffix() 同法；无 git ⇒ `V1.1-nogit+nogit`。 */
export function fingerprintOf(tree) {
  const top = tryGit(tree, ["rev-parse", "--show-toplevel"]);
  if (!top) return "V1.1-nogit+nogit";
  // 防祖先仓误命中：仅当该树自身即仓顶才算「有 git」（临时子目录/普通子目录不得冒充树指纹）
  // canon：realpath（Windows 下解 8.3 短名）+ 平台大小写归一（git 返回 C:/ 长名，os.tmpdir 可能是短名/异式）
  const canon = (p) => {
    let x = p; try { x = fs.realpathSync.native(p); } catch { x = path.resolve(p); }
    x = x.replace(/\\/g, "/").replace(/\/+$/, "");
    return process.platform === "win32" ? x.toLowerCase() : x;
  };
  if (canon(top) !== canon(tree)) return "V1.1-nogit+nogit";
  const short = gitShort(tree);
  if (!short) return "V1.1-nogit+nogit";
  const branch = tryGit(tree, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const mark = (!branch || branch === "HEAD" || branch === "main") ? "" : "+" + branch.split("/").pop();
  const dirty = tryGit(tree, ["status", "--porcelain"]) ? "+dirty" : "";
  return "V1.1-" + short + mark + dirty;
}
