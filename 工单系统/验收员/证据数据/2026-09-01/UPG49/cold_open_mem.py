# -*- coding: utf-8 -*-
"""J7: ui.openMemory 后 0.6/1.2/1.8s 三连截图（列表出现越早, 冷启动打开越快）"""
import subprocess, time
ADB = r"C:/Users/Administrator/platform-tools/platform-tools/adb.exe"
DEV = "emulator-5554"
D = "C:/Users/Administrator/Desktop/MOV/工单系统/验收员/证据数据/2026-09-01/UPG49/"
tok = subprocess.run([ADB, "-s", DEV, "shell", "run-as", "com.mov.android", "cat", "files/mcp_token.txt"],
                     capture_output=True, text=True, encoding="utf-8", errors="replace").stdout.strip()
import urllib.request, json
body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                   "params": {"name": "ui.openMemory", "arguments": {}}}).encode()
t0 = time.time()
urllib.request.urlopen(urllib.request.Request("http://127.0.0.1:18389/mcp", data=body, headers={
    "Authorization": "Bearer " + tok, "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream"}), timeout=10).read()
for i, delay in enumerate([0.6, 1.2, 1.8]):
    d = delay - (time.time() - t0)
    if d > 0: time.sleep(d)
    png = subprocess.run([ADB, "-s", DEV, "exec-out", "screencap", "-p"], capture_output=True).stdout
    fn = D + "25-J7-cold-%02d-%dms.png" % (i + 1, int((time.time() - t0) * 1000))
    open(fn, "wb").write(png)
    print("shot", fn, len(png))
