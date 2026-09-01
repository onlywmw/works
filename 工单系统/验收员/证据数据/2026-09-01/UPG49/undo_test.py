# -*- coding: utf-8 -*-
"""J4 撤销恢复：tap 移除→确认→抓撤销按钮→点撤销→验证行恢复（5s 窗口内闭环）"""
import subprocess, time, re
ADB = r"C:/Users/Administrator/platform-tools/platform-tools/adb.exe"
DEV = "emulator-5554"
D = "C:/Users/Administrator/Desktop/MOV/工单系统/验收员/证据数据/2026-09-01/UPG49/"
def sh(*a, timeout=15):
    return subprocess.run([ADB, "-s", DEV] + list(a), capture_output=True, text=True,
                          encoding="utf-8", errors="replace", timeout=timeout)
def dump_texts():
    sh("shell", "rm", "-f", "/sdcard/ui.xml")
    sh("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    xml = sh("shell", "cat", "/sdcard/ui.xml").stdout
    out = []
    for m in re.finditer(r'text="([^"]+)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml):
        out.append((m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5))))
    return out
def tap(x, y): sh("shell", "input", "tap", str(x), str(y))
# 0) 重开 Sheet
import urllib.request, json
tok = sh("shell", "run-as", "com.mov.android", "cat", "files/mcp_token.txt").stdout.strip()
body = json.dumps({"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"ui.openMemory","arguments":{}}}).encode()
urllib.request.urlopen(urllib.request.Request("http://127.0.0.1:18389/mcp", data=body, headers={
    "Authorization":"Bearer "+tok,"Content-Type":"application/json","Accept":"application/json, text/event-stream"}), timeout=10).read()
time.sleep(2.5)
t = dump_texts()
print("open:", [x[0] for x in t if "共" in x[0]])
# 1) 元帅行「移除」按钮（找 元帅 行 y → 移除按钮 x≈912 同行）
row = [x for x in t if "元帅" in x[0]][0]
y_row = (row[2] + row[4]) // 2
tap(912, y_row); time.sleep(1.6)
# 2) 确认弹窗「移除」
tap(894, 1389); time.sleep(1.1)
t = dump_texts()
undo = [x for x in t if "撤销" in x[0] and "已移除" not in x[0]]
bar = [x for x in t if "已移除" in x[0]]
print("undobar:", bar[:1], "undo btn:", undo[:1])
# 3) 点撤销
if undo:
    b = undo[0]; tap((b[1]+b[3])//2, (b[2]+b[4])//2); time.sleep(1.5)
    t = dump_texts()
    print("after undo:", [x[0] for x in t if "共" in x[0]], [x[0] for x in t if "元帅" in x[0]])
else:
    print("NO UNDO BTN CAPTURED")
