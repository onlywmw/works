# -*- coding: utf-8 -*-
"""executeTool 能力层批量扫描工具（真机测验员专用）。
用法: python scan_executetool.py  <- 通过 CDP 调用 B.postCmd executeTool 批量验证白名单工具
产出: 控制台逐工具结果 + 自动回填建议（✅可用/⚠️缺参/C占位/❌通道拒）
"""
import subprocess, sys, os, json, argparse

ADB = "C:/Users/Administrator/platform-tools/platform-tools/adb.exe"
DEV = "21770d7d"
MOV = "C:/Users/Administrator/MOV-APP"
CDP_JS = os.path.join(MOV, "tools", "e2e", "cdp-eval.js")

# 白名单 38 工具（ExecuteToolGate.VERIFY_WHITELIST）+ 推荐参数
SCAN = [
    # 纯计算/编码
    ("base64.encode", {"text": "hello mov"}),
    ("base64.decode", {"text": "aGVsbG8gbW92"}),
    ("calc.math", {"expr": "2+3*4"}),
    ("uuid.generate", {}),
    ("hash.text", {"text": "hello"}),
    # 系统查询
    ("settings.get", {"key": "SCREEN_BRIGHTNESS"}),
    ("battery.status", {}),
    ("network.info", {}),
    ("storage.info", {}),
    ("wifi.status", {}),
    ("wifi.scan", {}),
    ("sensor.list", {}),
    ("bluetooth.list", {}),
    ("location.get", {}),
    ("app.info", {"package": "com.hermes.android"}),
    ("app.list", {}),
    ("process.list", {}),
    ("file.info", {"path": "errors.jsonl"}),
    ("calendar.today", {}),
    # 媒体（白名单含，但 camera.capture/audio.record/screen.capture 有禁止前缀兜底会拒——记录差异）
    ("camera.info", {}),
    ("camera.capture", {}),
    ("audio.record", {}),
    ("screen.capture", {}),
    # 记忆/搜索
    ("memory.list", {}),
    ("memory.load", {"key": "test1"}),
    ("session.search", {"query": "test"}),
    ("search.chats", {"query": "test"}),
    ("read.logs", {}),
    ("code.search", {"query": "class"}),
    ("web.search", {"query": "mov"}),
    ("web.fetch", {"url": "https://example.com"}),
    ("kanban.view", {}),
    ("todo.list", {}),
    ("timer.list", {}),
    ("pb.query", {"collection": "test", "q": "x"}),
    ("clipboard.read", {}),
    # C 类占位（已挂账，仍验证以确认占位现象）
    ("qr.generate", {"text": "hello"}),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=None, help="结果落盘 json 路径")
    a = ap.parse_args()

    js = ("(function(){\n  var calls = %s;\n  var out = {};\n"
          "  for (var i=0;i<calls.length;i++){\n"
          "    var r = B.postCmd({cmd:'executeTool', name:calls[i][0], args:calls[i][1]});\n"
          "    out[calls[i][0]] = r;\n  }\n  return JSON.stringify(out);\n})()"
          % json.dumps(SCAN))
    r = subprocess.run(["node", CDP_JS, js], capture_output=True,
                       text=True, encoding="utf-8", errors="replace", timeout=120)
    if r.returncode != 0:
        sys.exit("CDP eval 失败: " + (r.stderr or r.stdout)[-300:])
    raw = r.stdout.strip().splitlines()
    if not raw:
        sys.exit("CDP 无输出")
    payload = raw[-1]
    # cdp-eval 返回带引号的 JSON 字符串 → 剥一层
    try:
        d = json.loads(json.loads(payload))
    except Exception:
        try:
            d = json.loads(payload)
        except Exception:
            sys.exit("解析失败: " + payload[:300])

    results = {}
    print(f"共扫描 {len(d)} 工具")
    print("=" * 100)
    for k, v in d.items():
        if not v.get("ok"):
            err = v.get("error", {})
            code = err.get("code", "?")
            msg = err.get("msg", "")[:60]
            results[k] = ("通道拒", code, msg)
            print(f"❌ {k:22s} | 通道拒 {code}: {msg}")
            continue
        data = v.get("data", {})
        if not data.get("ok"):
            txt = (data.get("text") or "")[:70]
            results[k] = ("执行失败", "", txt)
            print(f"⚠️ {k:22s} | 执行失败: {txt}")
        else:
            txt = (data.get("text") or "")[:70].replace("\n", " ")
            results[k] = ("可用", "", txt)
            print(f"✅ {k:22s} | {txt}")
    print("=" * 100)

    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=1)
        print(f"结果已落盘: {a.out}")


if __name__ == "__main__":
    main()
