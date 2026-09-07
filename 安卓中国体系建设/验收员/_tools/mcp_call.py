# -*- coding: utf-8 -*-
"""mcp_call.py — MOV 本机 MCP tools/call 辅助（验收证据采集用）。
每次调用前经 run-as 现取 token（不落盘），adb forward 失效自动重建。
用法: python mcp_call.py <tool> '<json-args>' [out_json_path]
"""
import subprocess, sys, os, json, time, urllib.request

ADB = r"D:/Android/Sdk/platform-tools/adb.exe"
DEV = "emulator-5556"
EV = r"C:/Users/Administrator/Desktop/MOV/工单系统/验收员/证据数据/UPG-02_04-M3/逐工具激活_2026-08-29"

sys.stdout.reconfigure(encoding="utf-8")


def adb(*args):
    r = subprocess.run([ADB, "-s", DEV] + list(args), capture_output=True, timeout=60)
    return r.stdout


def token():
    return adb("shell", "run-as", "com.mov.android", "cat", "files/mcp_token.txt").decode().strip()


def ensure_forward():
    adb("forward", "tcp:8389", "tcp:8389")


def call(name, args, timeout=120):
    ensure_forward()
    tok = token()
    for attempt in (1, 2):
        req = urllib.request.Request(
            "http://127.0.0.1:8389/mcp",
            data=json.dumps({"jsonrpc": "2.0", "id": int(time.time()) % 100000,
                             "method": "tools/call",
                             "params": {"name": name, "arguments": args}},
                            ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json",
                     "Authorization": "Bearer " + tok,
                     "Accept": "application/json"})
        try:
            return urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code == 401 and attempt == 1:
                tok = token()  # 重取再试一次
                continue
            return json.dumps({"http_error": e.code, "body": e.read().decode("utf-8", "replace")[:500]},
                              ensure_ascii=False)
        except Exception as e:
            return json.dumps({"transport_error": str(e)}, ensure_ascii=False)


def main():
    name = sys.argv[1]
    args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    out = sys.argv[3] if len(sys.argv) > 3 else None
    r = call(name, args)
    if out:
        path = out if os.path.isabs(out) else os.path.join(EV, out)
        payload = {"tool": name, "args": args, "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}
        try:
            payload["response"] = json.loads(r)
        except Exception:
            payload["response_raw"] = r
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=1)
    print(r[:600])


if __name__ == "__main__":
    main()
