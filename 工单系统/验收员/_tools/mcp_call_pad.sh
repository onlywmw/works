#!/bin/bash
# mcp_call_pad.sh <tool_name> <args_json> <outfile> — 平板 21770d7d MCP tools/call
# token 每次 run-as 现取，不落盘；logcat 段随调用采集
ADB="D:/Android/Sdk/platform-tools/adb.exe"
DEV=21770d7d
NAME="$1"; ARGS="${2:-{}}"; OUT="$3"
MARK="MOVTEST_MARK_$(date +%s%N)"
"$ADB" -s $DEV logcat -c 2>/dev/null
"$ADB" -s $DEV shell log -p i -t MOVTEST "$MARK start $NAME"
TOKEN=$("$ADB" -s $DEV shell run-as com.mov.android cat files/mcp_token.txt | tr -d '\r\n')
BODY=$(printf '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"%s","arguments":%s}}' "$NAME" "$ARGS")
curl -s --max-time 120 -X POST http://127.0.0.1:18389/mcp \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" -d "$BODY" -o "$OUT" -w "HTTP %{http_code}\n"
"$ADB" -s $DEV shell log -p i -t MOVTEST "$MARK end $NAME"
"$ADB" -s $DEV logcat -d -t 300 > "${OUT%.json}_logcat.txt" 2>/dev/null
cat "$OUT" | head -c 800; echo
