// 用法: bun cdp-eval.mjs <targetId|URL子串> <JS表达式> [--noprint]
// 通过 CDP Runtime.evaluate 在指定 WebView target 里执行 JS。
const [targetKey, expr] = process.argv.slice(2)
if (!targetKey || !expr) { console.error('need target + expr'); process.exit(1) }
const list = await fetch('http://127.0.0.1:9222/json').then(r => r.json())
const t = list.find(x => (x.url || '').includes(targetKey)) || list.find(x => x.id === targetKey)
if (!t) { console.error('target not found:', targetKey); console.error(list.map(x => x.url)); process.exit(1) }
const ws = new WebSocket(t.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
const id = 1
ws.send(JSON.stringify({
  id, method: 'Runtime.evaluate',
  params: { expression: expr, returnByValue: true, awaitPromise: true },
}))
const resp = await new Promise((res) => { ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id === id) res(m) } })
if (resp.result?.exceptionDetails) {
  console.error('EXCEPTION:', JSON.stringify(resp.result.exceptionDetails, null, 2))
} else if (!process.argv.includes('--noprint')) {
  console.log(JSON.stringify(resp.result?.result?.value ?? resp.result, null, 2))
}
ws.close()
