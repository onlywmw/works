const fs = require('fs');
// CT-01 换肤标准（tokens 契约）——找到实际文件：00_令牌与组件/MOV设计规范_v2？或换肤标准 UPG-40。
// 先定位换肤标准文档
const path = 'C:/Users/Administrator/Desktop/MOV/工单系统/设计师/方案设计/00_令牌与组件';
console.log(fs.readdirSync(path).join('\n'));
