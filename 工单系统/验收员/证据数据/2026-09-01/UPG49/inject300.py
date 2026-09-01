# -*- coding: utf-8 -*-
"""J7/J8 压测造数：向 entities.json 追加 300 条 ACTIVE（id 前缀 t-perf-），基线先行备份到设备 /sdcard/。"""
import subprocess, json, time
ADB = r"C:/Users/Administrator/platform-tools/platform-tools/adb.exe"
DEV = "emulator-5554"
def sh(*a, **kw): return subprocess.run([ADB, "-s", DEV] + list(a), capture_output=True, text=True, **kw)
# 1) 设备侧备份基线
sh("shell", "run-as", "com.mov.android", "cp", "files/memory-api/entities.json", "/sdcard/entities.baseline.json")
# 2) 拉取当前 entities
cur = sh("shell", "run-as", "com.mov.android", "cat", "files/memory-api/entities.json").stdout
o = json.loads(cur)
base = len(o["entities"])
now = int(time.time() * 1000)
for i in range(300):
    o["entities"].append({
        "id": "t-perf-%03d" % i,
        "content": "压测记忆第%d条：这是验收员注入的性能测试数据内容行%d" % (i, i),
        "kind": "memory", "status": "ACTIVE",
        "createdAt": now - i * 1000, "lastUsedAt": now - i * 1000, "refCount": 0,
    })
body = json.dumps(o, ensure_ascii=False)
# 3) 推回设备（经 /sdcard 中转避免命令行长度限制）
open("C:/Users/Administrator/Desktop/MOV/工单系统/验收员/证据数据/2026-09-01/UPG49/entities300.json", "w", encoding="utf-8").write(body)
subprocess.run([ADB, "-s", DEV, "push", "C:/Users/Administrator/Desktop/MOV/工单系统/验收员/证据数据/2026-09-01/UPG49/entities300.json", "/sdcard/entities300.json"], capture_output=True)
r = sh("shell", "run-as", "com.mov.android", "sh", "-c", "cp /sdcard/entities300.json files/memory-api/entities.json && wc -c files/memory-api/entities.json")
print("pushed:", r.stdout.strip())
# 4) 核对条数
chk = json.loads(sh("shell", "run-as", "com.mov.android", "cat", "files/memory-api/entities.json").stdout)
print("entities total:", len(chk["entities"]), "(base", base, "+300)")
