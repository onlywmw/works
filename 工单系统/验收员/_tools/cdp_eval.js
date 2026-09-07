/* CDP eval 辅助：node cdp_eval.js <title前缀> <表达式> —— 返回 JSON 字符串 */
const http = require('http');

function getJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
}

(async () => {
  const [, , titlePrefix, expr] = process.argv;
  const targets = await getJSON('http://127.0.0.1:9222/json');
  const t = targets.find(x => x.title.startsWith(titlePrefix));
  if (!t) { console.error('NO_TARGET:' + titlePrefix); process.exit(2); }
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 1;
  const pending = {};
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
  };
  const send = (method, params) => new Promise(res => {
    pending[id] = res; ws.send(JSON.stringify({ id, method, params })); id++;
  });
  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable', {});
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  ws.close();
  console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 2));
})().catch(e => { console.error('ERR:' + e.message); process.exit(1); });
