# -*- coding: utf-8 -*-
import subprocess, time, sys
ADB = r"C:/Users/Administrator/platform-tools/platform-tools/adb.exe"
DEV = "emulator-5554"
x, y, out = sys.argv[1], sys.argv[2], sys.argv[3]
subprocess.run([ADB, "-s", DEV, "shell", "input", "tap", x, y])
time.sleep(0.45)
png = subprocess.run([ADB, "-s", DEV, "exec-out", "screencap", "-p"], capture_output=True).stdout
open(out, "wb").write(png)
print("saved", out, len(png))
