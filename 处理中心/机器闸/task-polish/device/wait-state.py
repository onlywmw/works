#!/usr/bin/env python3
# UPG-551 跑批轮询器：等设备任务到达指定（state, step_index）——供确定性重跑脚本化。
# 用法：python wait-state.py <task_id> <STATE|*> <step_index|*> [--timeout 180] [--serial ...]
# 退出码：0=命中；1=超时（打印末态）。
import argparse, os, sqlite3, subprocess, sys, time

p = argparse.ArgumentParser()
p.add_argument("task_id"); p.add_argument("state"); p.add_argument("step")
p.add_argument("--timeout", type=int, default=180)
p.add_argument("--serial", default="CP28A2234900560")
p.add_argument("--adb", default=r"D:/Android/Sdk/platform-tools/adb.exe")
p.add_argument("--tmp", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "_dbtmp"))
a = p.parse_args()
os.makedirs(a.tmp, exist_ok=True)
db = os.path.join(a.tmp, "task-core.db")

def pull():
    for suf in ("", "-wal"):                     # -shm 为共享内存文件·拉取易冲突；本地删旧即可
        out = subprocess.run([a.adb, "-s", a.serial, "exec-out", "run-as", "cn.mov.app",
                              "cat", "databases/task-core.db" + suf],
                             capture_output=True).stdout
        try:
            os.remove(db + suf)
        except OSError:
            pass
        with open(db + suf, "wb") as fh:
            fh.write(out)
    try:
        os.remove(db + "-shm")
    except OSError:
        pass
    c = sqlite3.connect(db)
    return c.execute("SELECT state, step_index, pending FROM task WHERE id=?", (a.task_id,)).fetchone()

end = time.time() + a.timeout
last = None
while time.time() < end:
    last = pull()
    if last and (a.state == "*" or last[0] == a.state) and (a.step == "*" or str(last[1]) == a.step):
        print(f"READY {last}"); sys.exit(0)
    time.sleep(5)
print(f"TIMEOUT last={last}")
sys.exit(1)
