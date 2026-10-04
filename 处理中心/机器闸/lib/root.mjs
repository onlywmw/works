// SYS-160：体系仓根解析「单源」（可携性硬化 Phase 1）——所有工具一律经本件取根，禁再写死盘符。
//
// 解析序（设计口径·缺省保零回归）：
//   ① `MOV_ROOT` / `MOV_PRODUCT_REPO` / `MOV_WORKSPACE` 环境变量（显式覆盖优先）
//   ② 按**脚本位置回溯**：向上找同时含 `处理中心` 与 `巡检台` 的目录（WSL 副本/改名目录同样命中）
//   ③ 缺省**原 Windows 路径**（Windows 零回归铁律：不设环境变量时行为与硬化前逐字一致）
//
// 平台缺省（②未命中且未设环境变量时）：Windows=原路径；其它平台=WSL 9p 等价位（/mnt/<盘>/…）——
// 仅为「副本外还能指到宿主」的便利缺省，判据仍以副本内相对面为准。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MARKERS = ["处理中心", "巡检台"];
const WIN_DEFAULTS = {
  SYS: "E:/MOV/安卓中国体系建设",
  PRODUCT: "E:/mov归档/0027-mov",
  WORKSPACE: "E:/mov工作区",
  MOV: "E:/MOV",
};
const OTHER_DEFAULTS = {
  SYS: "/mnt/e/MOV/安卓中国体系建设",
  PRODUCT: "/mnt/e/mov归档/0027-mov",
  WORKSPACE: "/mnt/e/mov工作区",
  MOV: "/mnt/e/MOV",
};

const isWin = process.platform === "win32";
const hasMarkers = (d) => {
  try {
    return MARKERS.every((m) => fs.existsSync(path.join(d, m)));
  } catch {
    return false;
  }
};

/** 体系仓根：环境变量 → 回溯（从脚本自身位置）→ 平台缺省。 */
export function resolveSys(fromUrl = import.meta.url, env = process.env) {
  const envRoot = String(env.MOV_ROOT || "").trim();
  if (envRoot && hasMarkers(envRoot)) return path.resolve(envRoot);
  let d = path.dirname(fileURLToPath(fromUrl));
  for (;;) {
    if (hasMarkers(d)) return d;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return path.resolve(isWin ? WIN_DEFAULTS.SYS : OTHER_DEFAULTS.SYS);
}

/**
 * 通用「带缺省的外部路径」解析：env（**须真实存在**）→ 平台缺省。
 * SYS-173 追加A（2026-10-03 备份首败根因）：env 指向**幽灵路径**（不存在）时——回退平台缺省＋**告警一行**（禁静默照收；
 * 案：MOV_HOME=C:\…\流水线（不存在）被照收 ⇒ works 备份报「无 .git」整包失败且零告警）。
 * `MOV_ROOT` 的 hasMarkers 校验在 [resolveSys]，本件不动。
 */
export function resolveExternal(envKey, winPath, otherPath) {
  const dflt = isWin
    ? path.resolve(winPath)
    : (fs.existsSync(otherPath) ? path.resolve(otherPath) : path.resolve(otherPath || winPath));
  const v = String(process.env[envKey] || "").trim();
  if (!v) return dflt;
  const p = path.resolve(v);
  if (fs.existsSync(p)) return p; // env 值存在 ⇒ 仍按 env（现状语义不变）
  console.error(`[root] ${envKey}=${v} 不存在，回退缺省 ${dflt}`); // 防呆告警（stderr）——禁静默
  return dflt;
}

export const SYS = resolveSys();
/** 产品仓（0027-mov）：MOV_PRODUCT_REPO 覆盖｜Windows=E:/mov归档/0027-mov｜其它=/mnt/e/… */
export const PRODUCT = resolveExternal("MOV_PRODUCT_REPO", WIN_DEFAULTS.PRODUCT, OTHER_DEFAULTS.PRODUCT);
/** 施工 worktree 常态根：MOV_WORKSPACE 覆盖｜Windows=E:/mov工作区｜其它=/mnt/e/… */
export const WORKSPACE = resolveExternal("MOV_WORKSPACE", WIN_DEFAULTS.WORKSPACE, OTHER_DEFAULTS.WORKSPACE);
/** E:/MOV（九库全景根·MOV看板/备份面）：MOV_HOME 覆盖 */
export const MOV = resolveExternal("MOV_HOME", WIN_DEFAULTS.MOV, OTHER_DEFAULTS.MOV);
/** 用户主目录（原 C:/Users/Administrator 硬编码面）：MOV_USER_HOME 覆盖 → os.homedir() */
export const USER_HOME = (() => {
  const v = String(process.env.MOV_USER_HOME || "").trim();
  return v ? path.resolve(v) : os.homedir();
})();

/** 体系仓内相对路径（跨平台分隔符统一为 /）。 */
export const p = (...segs) => path.join(SYS, ...segs);
export const rel = (x) => path.relative(SYS, x).split(path.sep).join("/");
/** 用于拼给 shell 的裸路径（统一正斜杠——Windows cmd 亦接受，Linux 必须）。 */
export const slash = (x) => String(x).split(path.sep).join("/") && String(x).replace(/\\/g, "/");
export const PLATFORM = `${process.platform}/${process.arch}`;
