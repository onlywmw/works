const fs = require('fs');
const p = 'C:/Users/Administrator/Desktop/MOV/工单系统/工单库.md';
let t = fs.readFileSync(p, 'utf8');
const old = '→ 📌**挂单**（挂单,未派单;推进待定,未派单）';
const neu = '→ ✅ **大神评审闭环（9.7/10 接近冻结）+ 设计终态 @2026-09-02**（v3.1 机制 + v4.2/v5.0/v2.1 体系 + 选择页 v1.2 三审——合并发送版 `01_外观\\外观UI组件体系_合并发送版_2026-09-02.md`）→ 📌 **激活 @2026-09-02（用户拍板：出工单完善验收后派活）**——**STD-UPG50-v1 冻结**（`处理中心\\验收标准冻结区\\UPG-50\\STD-UPG50-v1_2026-09-02.md`：L1-1~7 + L2-1~7 + L3 + M-U50-1~5 变异亲杀 + 测试匹配档 + 红线）｜ 派单文本 `设计师\\派单\\UPG-50_外观组件库_激活派单_2026-09-02.md`（第一阶段=输入框 3 形态+选择页骨架；**MCP 上架注册机制=后续单**）';
if (t.includes(old)) {
  t = t.replace(old, neu);
  fs.writeFileSync(p, t);
  console.log('工单库 UPG-50 已激活');
} else {
  console.log('锚未命中，实际文本：');
  const i = t.indexOf('# UPG-50 ');
  console.log(t.slice(i, i + 200));
  process.exit(1);
}
