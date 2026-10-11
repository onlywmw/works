#!/usr/bin/env bash
# UPG-531 设备工具调用 · SYS-187 收口（自 `处理中心/机器闸/设备工具/` 取用）：
#   call_tool.sh <wsUrl> <tool> <argsJson> [timeoutMs]
# 回吐管道：cdp_call.js 输出经 redact.mjs 脱敏后才进模型（原文只落本地·stderr 一行对账）
# pipefail：cdp_call.js 失败码不被管道末段吞掉（行为同收口前）
set -o pipefail
WS="$1"; TOOL="$2"; ARGS="${3:-{\}}"; TMO="${4:-60000}"
JS="$(dirname "$0")/_calljs.$$.js"
cat > "$JS" <<JSJ
new Promise((resolve) => {
  const orig = window.__movResolve;
  window.__movResolve = (id, json) => { try { if (orig) orig(id, json); } catch (e) {}; if (id === 'cb') resolve(String(json)); };
  try { window.MovPageBridge.invoke('$TOOL', JSON.stringify($ARGS), 'cb'); } catch (e) { resolve('THROW: ' + e); }
})
JSJ
node "$(dirname "$0")/cdp_call.js" "$WS" "$JS" "$TMO" | node "$(dirname "$0")/redact.mjs"
RC=$?
rm -f "$JS"
exit $RC
