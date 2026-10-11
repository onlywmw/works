#!/usr/bin/env python3
# UPG-551 设备遥测导出：从设备 App 私有库拉 task-core.db（含 wal/shm）→ 导出全量 task_event（某一任务或全部）为 JSON。
# 用法：python pull-events.py --serial <机> [--task <任务id>] [--out <目录>] [--adb <adb路径>]
# 输出：<out>/task-core.db（副本）＋ <out>/events-<task或all>.json
# 说明：App 为 debug 变体时 run-as 可用；运行中拉取 wal/shm 一并带走，确保最新事件不丢。
import argparse, json, os, sqlite3, subprocess, sys

p = argparse.ArgumentParser()
p.add_argument("--serial", required=True)
p.add_argument("--task", default="all")
p.add_argument("--out", default=".")
p.add_argument("--adb", default=r"D:/Android/Sdk/platform-tools/adb.exe")
a = p.parse_args()
os.makedirs(a.out, exist_ok=True)

def sh(args, out=None):
    r = subprocess.run(args, stdout=out or subprocess.PIPE, stderr=subprocess.PIPE)
    return r

def pull(remote, local):
    r = subprocess.run([a.adb, "-s", a.serial, "exec-out", "run-as", "cn.mov.app", "cat", remote],
                       stdout=open(local, "wb"), stderr=subprocess.PIPE)
    if r.returncode != 0:
        print("拉取失败:", remote, r.stderr.decode(errors="ignore")[:200]); sys.exit(1)

db = os.path.join(a.out, "task-core.db")
for suffix in ("", "-wal", "-shm"):
    pull("databases/task-core.db" + suffix, db + suffix)

c = sqlite3.connect(db); c.row_factory = sqlite3.Row
q = "select seq,at,kind,trigger,trigger_id,from_state,to_state,note,task_id from task_event"
rows = ([dict(r) for r in c.execute(q + " where task_id=? order by seq", (a.task,))] if a.task != "all"
        else [dict(r) for r in c.execute(q + " order by seq")])
outf = os.path.join(a.out, f"events-{a.task}.json")
json.dump(rows, open(outf, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
task = c.execute("select id,goal,plan,state,step_index,updated_at from task where id=?", (a.task,)).fetchone() if a.task != "all" else None
if task:
    json.dump(dict(task), open(os.path.join(a.out, f"task-{a.task}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"OK 事件 {len(rows)} 条 → {outf}" + (f"｜任务行：{dict(task)}" if task else f"｜全部任务事件"))
