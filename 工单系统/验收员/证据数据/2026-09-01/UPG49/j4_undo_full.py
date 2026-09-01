# -*- coding: utf-8 -*-
"""J4 完整撤销序列：等待就绪→开Sheet→移除测试条目→确认→点撤销→验证恢复"""
import subprocess, time, re, json, urllib.request
ADB = r"C:/Users/Administrator/platform-tools/platform-tools/adb.exe"
DEV = "emulator-5554"
D = "C:/Users/Administrator/Desktop/MOV/工单系统/验收员/证据数据/2026-09-01/UPG49/"
def sh(*a, timeout=20):
    return subprocess.run([ADB, "-s", DEV] + list(a), capture_output=True, text=True,
                          encoding="utf-8", errors="replace", timeout=timeout)
def token():
    return sh("shell", "run-as", "com.mov.android", "cat", "files/mcp_token.txt").stdout.strip()
def mcp(name, args={}):
    body = json.dumps({"jsonrpc":"2.0","id":1,"method":"tools/call",
                       "params":{"name":name,"arguments":args}}, ensure_ascii=False).encode()
    req = urllib.request.Request("http://127.0.0.1:18389/mcp", data=body, headers={
        "Authorization":"Bearer "+token(),"Content-Type":"application/json",
        "Accept":"application/json, text/event-stream"})
    return urllib.request.urlopen(req, timeout=10).read().decode()
def dump_texts():
    sh("shell", "rm", "-f", "/sdcard/ui.xml")
    sh("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    xml = sh("shell", "cat", "/sdcard/ui.xml").stdout
    return [(m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5)))
            for m in re.finditer(r'text="([^"]+)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml)]
def tap(x, y): sh("shell", "input", "tap", str(x), str(y))

# 1) MCP 就绪重试
ok = False
for i in range(5):
    try:
        r = mcp("ui.openMemory"); ok = "ok=true" in r; break
    except Exception as e:
        print("retry", i, e); time.sleep(3)
print("openMemory:", ok)
time.sleep(2.5)
t = dump_texts()
print("count:", [x[0] for x in t if "共" in x[0]])
row = [x for x in t if "验收撤销" in x[0]]
if not row: print("ROW NOT FOUND"); raise SystemExit
y_row = (row[0][2] + row[0][4]) // 2
# 2) 移除→确认
tap(912, y_row); time.sleep(1.8)
tap(894, 1389)
# 3) 快照撤销条证据 + 点撤销（固定坐标 Sheet 底部右侧）
time.sleep(0.5)
png = sh("exec-out", "screencap", "-p", timeout=25)
open(D + "28-J4-undo-before-tap.png", "wb").write(png.stdout.encode("latin1") if isinstance(png.stdout, str) else png.stdout)
t = dump_texts()
undo = [x for x in t if x[0] == "撤销"]
print("undo btn via dump:", undo)
if undo:
    b = undo[0]; tap((b[1]+b[3])//2, (b[2]+b[4])//2)
else:
    print("fallback fixed coords"); tap(900, 2340)
time.sleep(1.8)
t = dump_texts()
print("after undo count:", [x[0] for x in t if "共" in x[0]])
print("row back:", [x[0] for x in t if "验收撤销" in x[0]])
