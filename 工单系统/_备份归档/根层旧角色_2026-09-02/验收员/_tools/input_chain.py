# -*- coding: utf-8 -*-
"""input_chain.py — MOV 真实 UI 中文输入链路验证（聚焦→输入→发送→证据）。

红线：CDP 仅观测（读输入框坐标），tap/输入/发送全部走真实 UI 路径。
- tap 聚焦：adb shell input tap（真实点击）
- 中文输入：ADBKeyBoard ADB_INPUT_B64 广播（真实 IME 通道，非剪贴板）
- 发送：ENTER keyevent 66（faceInput 绑定 Enter→submitIntent）

前置：
  1. 平板已装 ADBKeyBoard 并设为默认输入法：
       adb -s 21770d7d install <ADBKeyboard.apk>
       adb -s 21770d7d shell ime enable com.android.adbkeyboard/.AdbIME
       adb -s 21770d7d shell ime set com.android.adbkeyboard/.AdbIME
  2. MOV App 已打开到对话界面（hermes-shell 主页）。

用法:
  python input_chain.py "<任务文本>" [--selector #faceInput] [--send enter] [--out <数据目录>]
  --selector  输入框 DOM（默认 #faceInput 主页；房间对话用 #msgInput）
  --send      enter（默认，keyevent 66）/ tap（需 --send-x --send-y 发发送按钮坐标）
"""
import subprocess, sys, os, base64, json, argparse, time

ADB = "C:/Users/Administrator/platform-tools/platform-tools/adb.exe"
DEV = "21770d7d"
MOV = "C:/Users/Administrator/MOV-APP"
CDP_JS = os.path.join(MOV, "tools", "e2e", "cdp-eval.js")


def adb(*args):
    r = subprocess.run([ADB, "-s", DEV] + list(args), capture_output=True,
                       text=True, encoding="utf-8", errors="replace", timeout=60)
    return r.stdout.strip()


def setup_forward():
    """App 每次重启 WebView devtools remote 会变，必须重新 forward（真机标准 2.2）。

    注意：App 内可能有多个 WebView 进程（MOV 页面 + 内嵌 DeepSeek Harness 等），
    tail -1 可能选中非 MOV 页面。因此遍历所有 remote，逐个 forward 并用
    /json 探测 hermes-shell.html 页面，找到即用。
    """
    import json as _json
    import urllib.request
    raw = adb("shell", "cat", "/proc/net/unix")
    m = [ln for ln in raw.splitlines() if "webview_devtools" in ln]
    if not m:
        sys.exit("未找到 webview_devtools_remote（App 是否在前台？）")
    remotes = [ln.split()[-1].replace("@", "").strip() for ln in m]
    for remote in remotes:
        adb("forward", "tcp:9222", "localabstract:" + remote)
        time.sleep(0.8)
        try:
            with urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=3) as r:
                pages = _json.loads(r.read().decode("utf-8"))
            if any("hermes-shell.html" in (p.get("url") or "") for p in pages):
                print("CDP forward → " + remote + "（MOV 页面）")
                return
        except Exception:
            continue
    sys.exit("未能定位 hermes-shell.html 页面（多 WebView 探测失败）")


def get_input_center(selector):
    """CDP 观测：读输入框 boundingClientRect 中心坐标（不驱动任何操作）。"""
    expr = ("(function(){var e=document.querySelector('%s');if(!e)return{err:'notfound'};"
            "var r=e.getBoundingClientRect();var dpr=window.devicePixelRatio||1;"
            "return{x:Math.round((r.x+r.width/2)*dpr),y:Math.round((r.y+r.height/2)*dpr)};})()"
            % selector)
    r = subprocess.run(["node", CDP_JS, expr], capture_output=True,
                       text=True, encoding="utf-8", errors="replace", timeout=30)
    if r.returncode != 0:
        sys.exit("CDP eval 失败: " + (r.stderr or r.stdout)[-300:])
    lines = r.stdout.strip().splitlines()
    if not lines:
        sys.exit("CDP 无输出（forward 是否成功？）")
    try:
        return json.loads(lines[-1])
    except Exception:
        sys.exit("坐标解析失败: " + r.stdout[-300:])


def input_b64(txt):
    """ADBKeyBoard 中文输入：base64 变体（Android 8+ UTF-8 直传不稳，B64 稳）。"""
    b64 = base64.b64encode(txt.encode("utf-8")).decode()
    adb("shell", "am", "broadcast", "-a", "ADB_INPUT_B64", "--es", "msg", b64)


TOP_OFFSET = 78  # 物理像素：状态栏/系统栏顶部偏移（WebView 视口原点下移）


def main():
    ap = argparse.ArgumentParser(description="MOV 真实 UI 中文输入链路验证")
    ap.add_argument("task", help="任务文本（中文/英文皆可）")
    ap.add_argument("--selector", default="#faceInput", help="输入框 DOM（#faceInput / #msgInput）")
    ap.add_argument("--send", default="enter", choices=["enter", "tap"], help="发送方式")
    ap.add_argument("--send-x", type=int, default=0, help="--send tap 的发送按钮 x")
    ap.add_argument("--send-y", type=int, default=0, help="--send tap 的发送按钮 y")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                  "..", "2026-08-16", "input-chain"), help="证据落盘目录")
    a = ap.parse_args()

    setup_forward()
    c = get_input_center(a.selector)
    if c.get("err"):
        sys.exit("输入框不存在: " + a.selector)
    print("输入框中心: (%s,%s)" % (c["x"], c["y"]))

    # ① 真实 tap 聚焦（物理坐标 = CSS×dpr + 顶部系统栏偏移）
    adb("shell", "input", "tap", str(c["x"]), str(c["y"] + TOP_OFFSET))
    time.sleep(0.8)

    # ② ADBKeyBoard 中文输入（真实 IME 通道）
    input_b64(a.task)
    time.sleep(0.8)
    print("已输入: " + a.task)

    # ③ 发送
    if a.send == "enter":
        adb("shell", "input", "keyevent", "66")   # ENTER（faceInput 绑定 Enter→submitIntent）
        print("已发送（ENTER）")
    else:
        if not (a.send_x and a.send_y):
            sys.exit("--send tap 需 --send-x --send-y")
        adb("shell", "input", "tap", str(a.send_x), str(a.send_y))
        print("已发送（tap %s,%s）" % (a.send_x, a.send_y))
    time.sleep(2.0)

    # ④ 证据截图
    os.makedirs(a.out, exist_ok=True)
    snap = os.path.join(a.out, "input-chain-01-sent.png")
    with open(snap, "wb") as f:
        f.write(subprocess.run([ADB, "-s", DEV, "exec-out", "screencap", "-p"],
                               capture_output=True).stdout)
    print("证据已存: " + snap)
    print("\n链路完成。请确认：① 输入已回显 ② 发送已触发 ③ journal 出现 user_input 事件")


if __name__ == "__main__":
    main()
