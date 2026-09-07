# -*- coding: utf-8 -*-
"""平板 MCP tools/call（UTF-8 安全）。token 内存现取不落盘。
用法: python mcp_pad.py <tool> <args_json_file_or_-> <outfile>
同时抓 logcat 段到 <outfile去掉.json>_logcat.txt"""
import subprocess, json, sys, io, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
ADB = r"D:/Android/Sdk/platform-tools/adb.exe"
DEV = "21770d7d"

def adb(*args, text=True):
    return subprocess.run([ADB, "-s", DEV] + list(args), capture_output=True, text=text, encoding="utf-8", errors="replace")

tool, args_src, out = sys.argv[1], sys.argv[2], sys.argv[3]
args = {} if args_src == "-" else json.load(open(args_src, encoding="utf-8"))
adb("logcat", "-c")
mark = "MOVTEST_%d" % time.time_ns()
adb("shell", "log", "-p", "i", "-t", "MOVTEST", mark + " start " + tool)
token = adb("shell", "run-as", "com.mov.android", "cat", "files/mcp_token.txt").stdout.strip()
body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                   "params": {"name": tool, "arguments": args}}, ensure_ascii=False).encode("utf-8")
p = subprocess.run(["curl", "-s", "--max-time", "120", "-X", "POST", "http://127.0.0.1:18389/mcp",
                    "-H", "Authorization: Bearer " + token,
                    "-H", "Content-Type: application/json; charset=utf-8",
                    "-H", "Accept: application/json, text/event-stream",
                    "--data-binary", "@-", "-w", "\nHTTP %{http_code}"],
                   input=body, capture_output=True)
resp = p.stdout.decode("utf-8", "replace")
open(out, "w", encoding="utf-8").write(resp)
adb("shell", "log", "-p", "i", "-t", "MOVTEST", mark + " end " + tool)
log = adb("logcat", "-d", "-t", "300").stdout
open(out[:-5] if out.endswith(".json") else out + "_logcat.txt", "w", encoding="utf-8") if False else None
open((out[:-5] + "_logcat.txt") if out.endswith(".json") else (out + "_logcat.txt"), "w", encoding="utf-8").write(log)
print(resp[:600])
