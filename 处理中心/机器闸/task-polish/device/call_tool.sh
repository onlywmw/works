#!/usr/bin/env bash
# UPG-531 设备工具调用：call_tool.sh <wsUrl> <tool> <argsJson> [timeoutMs]
WS="$1"; TOOL="$2"; ARGS="${3:-{\}}"; TMO="${4:-60000}"
JS="$(dirname "$0")/_calljs.$$.js"
cat > "$JS" <<JSJ
new Promise((resolve) => {
  const orig = window.__movResolve;
  window.__movResolve = (id, json) => { try { if (orig) orig(id, json); } catch (e) {}; if (id === 'cb') resolve(String(json)); };
  try { window.MovPageBridge.invoke('$TOOL', JSON.stringify($ARGS), 'cb'); } catch (e) { resolve('THROW: ' + e); }
})
JSJ
node "$(dirname "$0")/cdp_call.js" "$WS" "$JS" "$TMO"
rm -f "$JS"
