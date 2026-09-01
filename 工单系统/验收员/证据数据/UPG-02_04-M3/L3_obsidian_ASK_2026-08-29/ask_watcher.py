# -*- coding: utf-8 -*-
# ask_watcher.py — 轮询 MOV 审批弹窗，出现「允许本次」立即点（临时验收工具，不改仓库）
import subprocess, sys, re, time, os

ADB = os.environ.get("UI_OPS_ADB", "D:/Android/Sdk/platform-tools/adb.exe")
DEV = os.environ.get("UI_OPS_DEV", "emulator-5558")

def adb(*args):
    r = subprocess.run([ADB, "-s", DEV] + list(args), capture_output=True, text=True,
                       encoding="utf-8", errors="replace", timeout=30)
    return r.stdout

def main():
    dur = float(sys.argv[1]) if len(sys.argv) > 1 else 120
    shotdir = sys.argv[2] if len(sys.argv) > 2 else None
    end = time.time() + dur
    n = 0
    last_tap = 0
    while time.time() < end:
        adb("shell", "uiautomator", "dump", "/sdcard/askw.xml")
        xml = adb("shell", "cat", "/sdcard/askw.xml")
        m = re.search(r'text="(允许本次|允许本轮)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml)
        if not m:
            m = re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"[^>]*?text="(允许本次|允许本轮)"', xml)
            if m:
                label, x1, y1, x2, y2 = m.group(5), int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))
            else:
                time.sleep(0.8)
                continue
        else:
            label, x1, y1, x2, y2 = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5))
        if time.time() - last_tap < 2:
            time.sleep(0.5)
            continue
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        n += 1
        ts = time.strftime("%H:%M:%S")
        print(f"[{ts}] dialog#{n} label={label} center=({cx},{cy})", flush=True)
        if shotdir:
            png = os.path.join(shotdir, f"askw_{ts.replace(':','')}_dialog{n}.png")
            with open(png, "wb") as f:
                f.write(subprocess.run([ADB, "-s", DEV, "exec-out", "screencap", "-p"],
                                       capture_output=True, timeout=30).stdout)
            print(f"[{ts}] shot={png}", flush=True)
        adb("shell", "input", "tap", str(cx), str(cy))
        print(f"[{ts}] tapped", flush=True)
        last_tap = time.time()
        time.sleep(1.0)
    print(f"watcher done, {n} dialogs tapped", flush=True)

if __name__ == "__main__":
    main()
