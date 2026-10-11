// 常驻工具：汇总 app/build/test-results/testDebugUnitTest 的 XML → tests/failures/errors/skipped + 红名单
// 用法：cd <主仓 or N:> && node 处理中心/机器闸/test-reds.mjs
const fs = require("fs"), path = require("path");
const dir = "app/build/test-results/testDebugUnitTest";
let T = 0, F = 0, E = 0, S = 0; const reds = [];
for (const fn of fs.readdirSync(dir).filter((x) => x.endsWith(".xml"))) {
  const x = fs.readFileSync(path.join(dir, fn), "utf8");
  const get = (k) => { const m = x.match(new RegExp(k + '="(\\d+)"')); return m ? Number(m[1]) : 0; };
  T += get("tests"); S += get("skipped"); F += get("failures"); E += get("errors");
  for (const chunk of x.split("<testcase ").slice(1)) {
    if (chunk.toLowerCase().includes("<failure") || chunk.toLowerCase().includes("<error")) {
      const cn = (chunk.match(/classname="([^"]+)"/) || [])[1] || "?";
      const nm = (chunk.match(/name="([^"]+)"/) || [])[1] || "?";
      reds.push(cn + "#" + nm);
    }
  }
}
console.log(`TOTAL tests=${T} failures=${F} errors=${E} skipped=${S}`);
console.log("RED=" + reds.length);
reds.sort().forEach((r) => console.log(r));
