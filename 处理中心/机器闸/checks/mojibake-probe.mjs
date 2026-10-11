// mojibake-probe.mjs —— 乱码/编码探针共享模块（SYS-201·**单源**：批量闸 mojibake-scan 与 pi 写护栏 mojibake-guard 同 import 本模块）
//
// 五探针（与派单 §一B 对齐）：
//   ①无效 UTF-8（字节级·逐行 fatal 解码·含 UTF-16/UTF-32 BOM 识破）
//   ②U+FFFD 替换符（≥1 处即记）
//   ③GBK→UTF8 乱码 CJK 热字表（全文件合计 ≥3 处才判·防单字误报）
//   ④UTF8→Latin1 双字节序列（Ã/Â/æ/å… 配对 ≥2 对才判）
//   ⑤控制符（C0/C1·保留 \t\n\r·>阈值才判）
// 另：cmdRisk()＝pwsh/cmd 写入原语编码风险（写护栏用·只提示不拦）。
// 纯函数·零依赖——scan（批量遍历）与扩展（写前扫）都 import 本模块，防两处各写一份口径。

export const FFFD = "\uFFFD";
/** GBK→UTF8 乱码热字表（GBK 字节被按 latin/cp936 误解再转 UTF-8 的高频残形）。 */
export const GBK_HOTS = [
  "鐢ㄦ埛", "鏈嶅姟", "鎴愬姛", "閿欒", "鍒犻櫎", "鏂囦欢", "鏃ユ湡", "璁剧疆",
  "璇锋眰", "鍔犺浇", "缃戠粶", "绠＄悊", "杩愯", "鍏充簬", "涓婁紶", "瀹夎",
];
export const GBK_HOTS_MIN = 3;
export const LATIN_PAIR_RE = /[ÃÂÄÅÆæåä][\u0080-\u00bf\u2013\u2014\u2018\u2019\u201c\u201d\u2020\u2021\u2022\u2026\u2030\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc]/g; // 次位限 80-BF＋cp1252 标点（æ–‡ 型乱码；避让德语/法语合法变音符）
export const LATIN_PAIRS_MIN = 2;
export const CTRL_RE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g; // 保留 \t(09) \n(0a) \r(0d)
export const CTRL_MIN = 6; // >5 处才判

const clip = (s, n = 80) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);

/** 逐行过五探针（②③④⑤）；返回 [{kind, line, context}]。 */
export function probeText(text, opts = {}) {
  const findings = [];
  const lines = String(text ?? "").split("\n");
  const ctrlMin = opts.ctrlMin ?? CTRL_MIN;
  let gbkTotal = 0, latinTotal = 0, ctrlTotal = 0;
  const gbkLines = [], latinLines = [], ctrlLines = [];
  lines.forEach((line, i) => {
    const no = i + 1;
    if (line.includes(FFFD)) findings.push({ kind: "U+FFFD", line: no, context: clip(line) });
    let g = 0;
    for (const w of GBK_HOTS) { let p = 0; while ((p = line.indexOf(w, p)) >= 0) { g++; p += w.length; } }
    if (g) { gbkTotal += g; gbkLines.push(no); }
    const lm = line.match(LATIN_PAIR_RE);
    if (lm) { latinTotal += lm.length; latinLines.push(no); }
    const cm = line.match(CTRL_RE);
    if (cm) { ctrlTotal += cm.length; ctrlLines.push(no); }
  });
  if (gbkTotal >= GBK_HOTS_MIN) {
    for (const no of gbkLines.slice(0, 20)) findings.push({ kind: "GBK乱码字", line: no, context: clip(lines[no - 1]) });
  }
  if (latinTotal >= LATIN_PAIRS_MIN) {
    for (const no of latinLines.slice(0, 20)) findings.push({ kind: "UTF8-Latin1", line: no, context: clip(lines[no - 1]) });
  }
  if (ctrlTotal > ctrlMin - 1) {
    for (const no of ctrlLines.slice(0, 20)) findings.push({ kind: "控制符", line: no, context: clip(lines[no - 1]) });
  }
  return findings;
}

/** 字节级探针①：无效 UTF-8（逐行 fatal 解码定位行号；UTF-16/32 BOM ⇒ 非 UTF-8 文件）。 */
export function probeBytes(buf) {
  const findings = [];
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf ?? "");
  if (b.length >= 2 && ((b[0] === 0xff && b[1] === 0xfe) || (b[0] === 0xfe && b[1] === 0xff))) {
    return [{ kind: "无效UTF-8", line: 1, context: "UTF-16/32 BOM（非 UTF-8 文件）" }];
  }
  const dec = new TextDecoder("utf-8", { fatal: true });
  let start = 0, idx = 0;
  for (let i = 0; i <= b.length; i++) {
    if (i !== b.length && b[i] !== 0x0a) continue;
    const slice = b.subarray(start, i);
    try { dec.decode(slice); }
    catch { findings.push({ kind: "无效UTF-8", line: idx + 1, context: clip(slice.subarray(0, 48).toString("utf8")) }); }
    start = i + 1; idx++;
  }
  return findings;
}

/** 合并扫描（字节①＋文本②③④⑤）。 */
export function scanContent(buf, opts = {}) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf ?? "");
  const text = b.toString("utf8"); // 无效字节会落 U+FFFD —— 文本探针照跑（与①互为兜底）
  return [...probeBytes(b), ...probeText(text, opts)];
}

/**
 * pwsh/cmd 写入原语编码风险（写护栏·只提示不拦）。返回风险说明数组（空=无险）。
 * 抗噪口径：「>／>>」只在 pwsh/cmd 上下文计入（bash 重定向本身不涉编码·git-bash 原生 UTF-8）；
 * Set-Content/Out-File/Add-Content/Export-Csv 恒计。
 */
export function cmdRisk(cmd) {
  const s = String(cmd ?? "");
  const risks = [];
  const pwshish = /(?:^|[\\/])(?:pwsh|powershell)(?:\.exe)?\b|cmd(?:\.exe)?\s*\/c\b|\bchcp\b|-Encoding\b|Set-Content|Out-File|Add-Content|Export-Csv/i.test(s);
  if (/\bchcp\b/i.test(s) && !/\bchcp\s+65001\b/.test(s)) risks.push("chcp 非 65001（切代码页易致乱码落盘）");
  if (/-Encoding\s+(?:Default|ANSI|OEM)\b/i.test(s) || /\[(?:System\.)?Text\.Encoding\]::Default\b/i.test(s)) {
    risks.push("危险编码原语：-Encoding Default/ANSI / [Text.Encoding]::Default");
  }
  const writes = /\b(?:Set-Content|Out-File|Add-Content|Export-Csv)\b/i.test(s) || (pwshish && /[^>]>>?\s*[^\s|]/.test(s));
  if (writes && !/-Encoding\s+(utf8|utf8NoBOM|UTF8)\b/i.test(s)) {
    risks.push("写入原语未显式 -Encoding utf8（pwsh 5.1 默认 ANSI ⇒ 中文落盘即乱码）");
  }
  return risks;
}
