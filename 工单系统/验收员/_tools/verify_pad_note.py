# -*- coding: utf-8 -*-
"""验证平板 obsidian 写入产物：拉取 MovTestVault 下的 .md，与期望内容逐字比对；并核对 MCP 返回 JSON 原文。"""
import subprocess, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
ADB = r"D:/Android/Sdk/platform-tools/adb.exe"
DEV = "21770d7d"
EV = r"C:/Users/Administrator/Desktop/MOV/工单系统/验收员/证据数据/UPG-02_04-M3/平板真机_2026-08-29"

def adb_out(*args):
    return subprocess.run([ADB, "-s", DEV] + list(args), capture_output=True).stdout

# 1) 目录清单（bytes 解码 utf-8）
listing = adb_out("shell", "ls /sdcard/Documents/MovTestVault/").decode("utf-8", "replace")
print("== 设备目录清单 ==")
print(listing)

md = [l.strip() for l in listing.splitlines() if l.strip().endswith(".md")]
assert md, "没有找到 .md 产物"
name = md[0]
print("目标文件:", name)

# 2) exec-out cat 拉字节（参数编码走 python，无 GBK 污染）
data = adb_out("exec-out", "cat", "/sdcard/Documents/MovTestVault/" + name)
open(EV + "/T09_产物_测试笔记.md", "wb").write(data)
content = data.decode("utf-8")
print("== 落盘产物内容 ==")
print(content)

expect = "# UPG-02 平板真机验收\n设备: Xiaomi Pad 6S Pro (21770d7d, API 36)\n闭环标记: movtest-pad-8791\nSAF 授权→登记→写入→读回→搜索→rescan。\n"
print("逐字一致:", content == expect)

# 3) MCP 返回 JSON 原文核对
for f in ["T08_file_write.json", "T09_file_read.json"]:
    d = json.load(open(EV + "/" + f, encoding="utf-8"))
    print(f, "→", d["result"]["content"][0]["text"])
