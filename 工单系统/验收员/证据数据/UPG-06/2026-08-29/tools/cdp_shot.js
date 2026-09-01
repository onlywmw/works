#!/usr/bin/env node
/* cdp_shot — UPG-06 验收观测用：CDP Page.captureScreenshot（渲染管线真实栅格化产物）。
   用法: node cdp_shot.js <port> <urlSubstring> <out.png> */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const WS = require(path.join('C:/Users/Administrator/MOV-APP/tools/e2e', 'node_modules', 'ws'));

const port = process.argv[2];
const match = process.argv[3];
const out = process.argv[4];

http.get(`http://127.0.0.1:${port}/json`, res => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => {
    const page = JSON.parse(d).find(p => p.url.includes(match));
    if (!page) { console.error('page not found: ' + match); process.exit(1); }
    const ws = new WS(page.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 64 * 1024 * 1024 });
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Page.captureScreenshot',
        params: { format: 'png', captureBeyondViewport: true } }));
    });
    ws.on('message', raw => {
      const m = JSON.parse(raw);
      if (m.id !== 2) return;
      if (m.error) { console.error('CDP: ' + m.error.message); process.exit(1); }
      fs.writeFileSync(out, Buffer.from(m.result.data, 'base64'));
      console.log('saved: ' + out);
      process.exit(0);
    });
    ws.on('error', e => { console.error('ws: ' + e.message); process.exit(1); });
    setTimeout(() => { console.error('timeout'); process.exit(1); }, 30000);
  });
}).on('error', e => { console.error('http: ' + e.message); process.exit(1); });
