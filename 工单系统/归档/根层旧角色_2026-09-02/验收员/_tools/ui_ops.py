# -*- coding: utf-8 -*-
"""ui_ops.py — 真实 UI 操作（模拟用户点击/输入/发送，不用命令行直达）。
红线：验证真实用户体验，绝不用 CDP eval 直调 B 桥/sendMsg 等绕过 UI。

命令（-s 21770d7d 设备）:
  python ui_ops.py tap <x> <y>            点击坐标
  python ui_ops.py text <中文>            中文输入（剪贴板粘贴，模拟真实输入法）
  python ui_ops.py send <x> <y>           点发送按钮（tap 封装）
  python ui_ops.py dump                   导出当前 UI 元素（uiautomator，找输入框/按钮坐标）
  python ui_ops.py find <关键词>          找含关键词的元素坐标（uiautomator 解析）
  python ui_ops.py swipe <x1> <y1> <x2> <y2> [ms]   滑动
  python ui_ops.py key <KEYCODE>          物理键（KEYCODE_WAKEUP 等）
说明:
  - 中文输入用「剪贴板 + 粘贴」模拟真实输入（adb input text 不支持中文）
  - 粘贴需要剪贴板广播（Android 11+ 需 IME；先试剪贴板，失败提示装 ADBKeyBoard）
"""
import subprocess, sys, os, re

ADB = "C:/Users/Administrator/platform-tools/platform-tools/adb.exe"
DEV = "21770d7d"


def adb(*args):
    r = subprocess.run([ADB, "-s", DEV] + list(args), capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60)
    return r.stdout.strip()


def run():
    if len(sys.argv) < 2:
        sys.exit("用法: python ui_ops.py <tap|text|send|dump|find|swipe|key> ...")
    op = sys.argv[1]
    if op == "tap" and len(sys.argv) == 4:
        adb("shell", "input", "tap", sys.argv[2], sys.argv[3])
        print("已点击 %s,%s" % (sys.argv[2], sys.argv[3]))
    elif op == "send" and len(sys.argv) == 4:
        adb("shell", "input", "tap", sys.argv[2], sys.argv[3])
        print("已点发送 %s,%s" % (sys.argv[2], sys.argv[3]))
    elif op == "text" and len(sys.argv) >= 3:
        txt = " ".join(sys.argv[2:])
        # 中文 → 剪贴板 + 粘贴（模拟真实输入；需 Android 剪贴板广播权限）
        import base64
        b64 = base64.b64encode(txt.encode("utf-8")).decode()
        adb("shell", "am", "broadcast", "-a", "clipper.set", "-e", "text", txt)
        adb("shell", "input", "keyevent", "279")  # KEYCODE_PASTE
        print("已输入(剪贴板粘贴): %s" % txt[:20])
        print("提示: 若粘贴失败，请安装 ADBKeyBoard(支持中文 ADB 输入) 并设为默认输入法")
    elif op == "key" and len(sys.argv) >= 3:
        adb("shell", "input", "keyevent", sys.argv[2])
        print("已按 %s" % sys.argv[2])
    elif op == "swipe" and len(sys.argv) >= 6:
        adb("shell", "input", "swipe", sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5],
            sys.argv[6] if len(sys.argv) > 6 else "200")
        print("已滑动")
    elif op == "dump":
        adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
        xml = adb("shell", "cat", "/sdcard/ui.xml")
        # 输出可点击元素（text + bounds）
        for m in re.finditer(r'<node[^>]*text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml):
            t, x1, y1, x2, y2 = m.groups()
            if t:
                cx, cy = (int(x1) + int(x2)) // 2, (int(y1) + int(y2)) // 2
                print("%s @ (%s,%s)" % (t, cx, cy))
    elif op == "find" and len(sys.argv) >= 3:
        kw = sys.argv[2]
        adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
        xml = adb("shell", "cat", "/sdcard/ui.xml")
        found = False
        for m in re.finditer(r'<node[^>]*text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml):
            t, x1, y1, x2, y2 = m.groups()
            if kw in t:
                cx, cy = (int(x1) + int(x2)) // 2, (int(y1) + int(y2)) // 2
                print("找到 '%s' @ (%s,%s)" % (t, cx, cy))
                found = True
        if not found:
            print("未找到含 '%s' 的元素（先截图看当前界面）" % kw)
            sys.exit(1)
    else:
        sys.exit("未知命令: %s" % op)


if __name__ == "__main__":
    run()
