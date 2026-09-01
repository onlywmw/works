#!/usr/bin/env node
/* cdp_query — UPG-06 验收观测用（只读查询 room.html DOM/状态；不驱动用户操作）。
   用法: node cdp_query.js <port> <urlSubstring> "<expr>" [timeoutMs] */
'use strict';
const http = require('http');
const path = require('path');
const WS = require(path.join('C:/Users/Administrator/MOV-APP/tools/e2e', 'node_modules', 'ws'));

const port = process.argv[2];
const match = process.argv[3];
const expr = process.argv[4];
const timeout = parseInt(process.argv[5] || '15000', 10);

http.get(`http://127.0.0.1:${port}/json`, res => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => {
    const page = JSON.parse(d).find(p => p.url.includes(match));
    if (!page) { console.error('page not found: ' + match); process.exit(1); }
    const ws = new WS(page.webSocketDebuggerUrl, { perMessageDeflate: false });
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate',
        params: { expression: expr, returnByValue: true, awaitPromise: true } }));
    });
    ws.on('message', raw => {
      const m = JSON.parse(raw);
      if (m.id !== 1) return;
      if (m.error) { console.error('CDP: ' + m.error.message); process.exit(1); }
      const r = m.result;
      if (r && r.exceptionDetails) {
        console.error('JS: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text || 'err').slice(0, 500));
        process.exit(1);
      }
      console.log(JSON.stringify(r && r.result !== undefined ? r.result.value : null));
      process.exit(0);
    });
    ws.on('error', e => { console.error('ws: ' + e.message); process.exit(1); });
    setTimeout(() => { console.error('timeout'); process.exit(1); }, timeout);
  });
}).on('error', e => { console.error('http: ' + e.message); process.exit(1); });
