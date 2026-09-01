# -*- coding: utf-8 -*-
"""executeTool 分批扫描（每批 8 个，避免单次 eval 过多同步桥调用超时）。"""
import subprocess, sys, os, json

ADB = "C:/Users/Administrator/platform-tools/platform-tools/adb.exe"
DEV = "21770d7d"
MOV = "C:/Users/Administrator/MOV-APP"
CDP_JS = os.path.join(MOV, "tools", "e2e", "cdp-eval.js")

BATCHES = [
    [("base64.encode", {"text": "hello mov"}), ("base64.decode", {"text": "aGVsbG8gbW92"}),
     ("calc.math", {"expr": "2+3*4"}), ("uuid.generate", {}), ("hash.text", {"text": "hello"}),
     ("settings.get", {"key": "SCREEN_BRIGHTNESS"}), ("battery.status", {}), ("network.info", {})],
    [("storage.info", {}), ("wifi.status", {}), ("wifi.scan", {}), ("sensor.list", {}),
     ("bluetooth.list", {}), ("location.get", {}), ("app.info", {"package": "com.hermes.android"}),
     ("app.list", {})],
    [("process.list", {}), ("file.info", {"path": "errors.jsonl"}), ("calendar.today", {}),
     ("camera.info", {}), ("memory.list", {}), ("memory.load", {"key": "test1"}),
     ("session.search", {"query": "test"}), ("search.chats", {"query": "test"})],
    [("read.logs", {}), ("code.search", {"query": "class"}), ("web.search", {"query": "mov"}),
     ("web.fetch", {"url": "https://example.com"}), ("kanban.view", {}), ("todo.list", {}),
     ("timer.list", {}), ("pb.query", {"collection": "test", "q": "x"})],
    [("clipboard.read", {}), ("qr.generate", {"text": "hello"}),
     ("camera.capture", {}), ("audio.record", {}), ("screen.capture", {})],
]

def eval_js(js):
    r = subprocess.run(["node", CDP_JS, js], capture_output=True,
                       text=True, encoding="utf-8", errors="replace", timeout=90)
    if r.returncode != 0:
        return None
    lines = r.stdout.strip().splitlines()
    if not lines:
        return None
    payload = lines[-1]
    try:
        return json.loads(json.loads(payload))
    except Exception:
        try:
            return json.loads(payload)
        except Exception:
            return None

def main():
    results = {}
    for bi, batch in enumerate(BATCHES):
        js = ("(function(){var calls=%s;var out={};"
              "for(var i=0;i<calls.length;i++){"
              "var r=B.postCmd({cmd:'executeTool',name:calls[i][0],args:calls[i][1]});"
              "out[calls[i][0]]=r;}"
              "return JSON.stringify(out);})()" % json.dumps(batch))
        d = None
        for attempt in range(3):
            d = eval_js(js)
            if d is not None:
                break
            print(f"[批{bi+1}] 第{attempt+1}次失败，重试...", file=sys.stderr)
            subprocess.run(["bash", "-c", "sleep 3"], check=False)
        if d is None:
            print(f"[批{bi+1}] 连续失败，跳过", file=sys.stderr)
            continue
        for k, v in d.items():
            results[k] = v
        print(f"[批{bi+1}] 完成 {len(d)} 工具，累计 {len(results)}", file=sys.stderr)

    print("=" * 100)
    print(f"共 {len(results)} 工具")
    for k, v in results.items():
        if not v.get("ok"):
            err = v.get("error", {})
            print(f"❌ {k:22s} | 通道拒 {err.get('code','?')}: {err.get('msg','')[:55]}")
            continue
        data = v.get("data", {})
        if not data.get("ok"):
            print(f"⚠️ {k:22s} | 执行失败: {(data.get('text') or '')[:65]}")
        else:
            print(f"✅ {k:22s} | {(data.get('text') or '')[:65].replace(chr(10),' ')}")

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                       "2026-08-17", "executeTool-scan-result.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=1)
    print(f"结果落盘: {out}")

if __name__ == "__main__":
    main()
