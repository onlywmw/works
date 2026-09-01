# -*- coding: utf-8 -*-
"""UPG-49 验收造数：MCP tools/call memory.save（UTF-8 安全 body，token 现取不落盘）"""
import json, subprocess, sys, urllib.request
ADB = r"C:/Users/Administrator/platform-tools/platform-tools/adb.exe"
DEV = "emulator-5554"
items = [
    "请记住：我的猫叫元帅，它今年3岁",
    "我对花生过敏",
    "每周五下午开项目例会",
    "我家WiFi密码是homelink-2026",
]
tok = subprocess.run([ADB, "-s", DEV, "shell", "run-as", "com.mov.android", "cat", "files/mcp_token.txt"],
                     capture_output=True, text=True).stdout.strip()
for c in items:
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                       "params": {"name": "memory.save", "arguments": {"content": c}}},
                      ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request("http://127.0.0.1:18389/mcp", data=body, headers={
        "Authorization": "Bearer " + tok, "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"})
    r = urllib.request.urlopen(req, timeout=15).read().decode("utf-8")
    ok = '"isError":false' in r
    print(("OK " if ok else "FAIL ") + c)
