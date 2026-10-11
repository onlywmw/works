#!/usr/bin/env node
// redact.mjs —— 设备工具回吐脱敏过滤器（SYS-187）
//
// 用法：<工具回吐> | node redact.mjs [--raw-out <文件>]
//   两层掩码：①键名层（JSON / key=value repr：idNo/licenseNo/bankAccount/contactMobile/contactEmail/address/password/token/secret…）
//             ②值模式层兜底（18 位证件号/统一社会信用代码/16–19 位卡号/手机号/邮箱/sk- 类/Bearer）
//   原文只落本地文件：--raw-out 指定；缺省 %TEMP%\redact-raw\redact-<时间戳>-<pid>.txt
//   stderr 一行 `[redact] raw=<路径> masked=<n>`（对账用）
//   默认开；MOV_MASK=off 显式关（原样透传·stderr 警示留痕）
//   **fail-closed**：过滤器异常 ⇒ 非零退出且不输出未掩码原文（含 raw 落盘失败）
// 自测：node --test 处理中心/机器闸/设备工具/
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const KEY = "(?:id[_-]?no|id[_-]?card(?:[_-]?no)?|license[_-]?no|bank[_-]?account|bank[_-]?card|card[_-]?no|contact[_-]?mobile|mobile|phone(?:[_-]?no)?|contact[_-]?email|email|address|password|passwd|token|secret|api[_-]?key|access[_-]?key|private[_-]?key)";
const RE_JSON_KV = new RegExp(`("(?:${KEY})"\\s*:\\s*)"([^"]*)"`, "gi");
const RE_TEXT_KV = new RegExp(`\\b(${KEY})(\\s*[:=]\\s*)("[^"]*"|'[^']*'|[^\\s,;&)\\]}\\r\\n]+)`, "gi");

const stars = (n) => "*".repeat(n);
/** 默认掩码形态：保留首 2 末 2（不足 4 位全掩）；邮箱保留域名。 */
function maskValue(v) {
  const at = v.lastIndexOf("@");
  if (at > 0) return "***@" + v.slice(at + 1);
  if (v.length < 4) return stars(v.length);
  return v.slice(0, 2) + stars(v.length - 4) + v.slice(-2);
}

// 值模式层（混合文本兜底）
const PATTERNS = [
  [/\b[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g, maskValue],        // 18 位证件号
  [/\b[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}\b/g, maskValue],                                      // 统一社会信用代码
  [/\b\d{16,19}\b/g, maskValue],                                                                                // 16–19 位卡号
  [/\b1[3-9]\d{9}\b/g, maskValue],                                                                              // 手机号
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (m) => "***@" + m.slice(m.lastIndexOf("@") + 1)],         // 邮箱
  [/\bsk-[A-Za-z0-9_-]{6,}\b/g, maskValue],                                                                     // sk- 类
  [/(\bBearer\s+)[A-Za-z0-9._~+/=-]+/gi, (m, pre) => pre + "***"],                                              // Bearer
];

/** 两层掩码。返回 { masked, count }；count=掩码次数（对账用）。 */
function redactText(text) {
  let count = 0;
  // ① JSON 键名层（只掩值不动键）
  let out = text.replace(RE_JSON_KV, (m, pre, val) => { count++; return pre + '"' + maskValue(val) + '"'; });
  // ② key=value / key: value 键名层（repr、查询串）
  out = out.replace(RE_TEXT_KV, (m, key, sep, val) => {
    count++;
    const q = val[0];
    if ((q === '"' || q === "'") && val.length > 1 && val.endsWith(q)) return key + sep + q + maskValue(val.slice(1, -1)) + q;
    return key + sep + maskValue(val);
  });
  // ③ 值模式层兜底
  for (const [re, fn] of PATTERNS) out = out.replace(re, (m, ...g) => { count++; return fn(m, ...g); });
  return { masked: out, count };
}

function stamp() { return new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14); }

/** 原文只落本地文件；写失败抛错（fail-closed，不得静默丢原文）。 */
function writeRaw(text, rawOut) {
  const file = rawOut || path.join(os.tmpdir(), "redact-raw", `redact-${stamp()}-${process.pid}.txt`);
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, text);
  return file;
}

function parseArgs(argv) {
  const args = { rawOut: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--raw-out") { args.rawOut = argv[++i]; if (!args.rawOut) throw new Error("--raw-out 缺参数"); }
    else if (argv[i] === "--help" || argv[i] === "-h") { console.log("用法：<工具回吐> | node redact.mjs [--raw-out <文件>]"); process.exit(0); }
    else throw new Error("未知参数：" + argv[i]);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const off = String(process.env.MOV_MASK || "").toLowerCase() === "off";
  let buf = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("error", (e) => { console.error(`[redact] FATAL stdin: ${e.message}（fail-closed：未输出）`); process.exit(1); });
  process.stdin.on("data", (d) => { buf += d; });
  process.stdin.on("end", () => {
    try {
      const { masked, count } = off ? { masked: buf, count: 0 } : redactText(buf);
      const rawPath = buf.length ? writeRaw(buf, args.rawOut) : "-";
      process.stdout.write(masked);
      console.error(`[redact]${off ? " ⚠ MASK=off（MOV_MASK=off·原样透传·勿用于含敏感数据回吐）" : ""} raw=${rawPath} masked=${count}`);
    } catch (e) {
      console.error(`[redact] FATAL ${e.message}（fail-closed：未输出原文）`);
      process.exit(1);
    }
  });
}

main();
