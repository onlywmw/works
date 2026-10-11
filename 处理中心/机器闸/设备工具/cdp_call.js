// UPG-531 设备调用器：node cdp_call.js <wsUrl> <jsExprFile> [timeoutMs]
// 在目标 WebView 页执行 JS（awaitPromise+returnByValue），打印 JSON。
const fs = require('fs');
const wsUrl = process.argv[2];
const expr = fs.readFileSync(process.argv[3], 'utf8');
const tmo = parseInt(process.argv[4] || '60000', 10);
const ws = new WebSocket(wsUrl);
let sent = false;
ws.onopen = () => {
  sent = true;
  ws.send(JSON.stringify({ id: 7, method: 'Runtime.evaluate',
    params: { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true } }));
};
ws.onmessage = (ev) => {
  const d = JSON.parse(ev.data);
  if (d.id === 7) { console.log(JSON.stringify(d.result ?? d, null, 1)); try { ws.close(); } catch (e) {} setTimeout(() => process.exit(0), 50); }
};
ws.onerror = (e) => { console.error('WS_ERR ' + (e.message || e)); process.exit(1); };
setTimeout(() => { console.error('TIMEOUT'); process.exit(2); }, tmo);
