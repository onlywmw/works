# -*- coding: utf-8 -*-
"""ocr_batch.py — 批量 OCR（一次 PowerShell，OCR 引擎只初始化一次，处理多图 → 引擎共享）。
用法: python ocr_batch.py <img1.png> [img2.png ...]
产出: 每图 <图>.ocr.txt（UTF-8）；stdout 打印每图 OK/ERR
对比 ocr_shot.py（每图新起 PowerShell 3-5s）：本工具 N 图一次进程，引擎热后每图 <1s。
"""
import subprocess, sys, os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
PS_SCRIPT = os.path.join(HERE, "ocr_batch.ps1")


def _win(p):
    return os.path.normpath(os.path.abspath(p)).replace("/", "\\")


def ocr_batch(images):
    """一次 PowerShell 批量 OCR（分号分隔传参，避免 JSON 引号问题）。返回 (stdout, returncode)。"""
    wins = [_win(i) for i in images]
    r = subprocess.run(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
         "-File", PS_SCRIPT, ";".join(wins)],
        capture_output=True, timeout=900)
    out = r.stdout.decode("utf-8", errors="replace")
    return out, r.returncode


def _needs_ocr(img):
    """该图是否缺 .ocr.txt（需识别）。已有文本 → False（补漏语义，防证据链断）。"""
    return not os.path.isfile(img + ".ocr.txt")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--check":
        # 校验模式：只检查哪些图缺 .ocr.txt，不识别
        imgs = args[1:]
        miss = [a for a in imgs if not os.path.isfile(a)]
        if miss:
            sys.exit("图片不存在: " + ", ".join(miss))
        need = [a for a in imgs if _needs_ocr(a)]
        if need:
            print("缺 OCR 文本（%d 张）:" % len(need))
            for a in need:
                print("  " + a)
            sys.exit(1)
        print("证据完整：全部图都有 .ocr.txt")
        sys.exit(0)

    missing = [a for a in args if not os.path.isfile(a)]
    if missing:
        sys.exit("图片不存在: " + ", ".join(missing))
    if not args:
        sys.exit("用法: python ocr_batch.py <img1.png> [img2 ...]  |  --check <图...> 校验缺文本  |  --force 全识别")
    force = False
    if args[0] == "--force":
        force = True
        args = args[1:]
        if not args:
            sys.exit("用法: python ocr_batch.py --force <img1.png> [img2 ...]")
    # 补漏：默认只识别缺 .ocr.txt 的图（已有文本跳过，证据链不重跑）
    todo = args if force else [a for a in args if _needs_ocr(a)]
    skipped = len(args) - len(todo)
    if skipped:
        print("跳过 %d 张已有 .ocr.txt（补漏语义；--force 可强制重识别）" % skipped)
    if not todo:
        print("无需识别：全部图已有 .ocr.txt")
        sys.exit(0)
    out, rc = ocr_batch(todo)
    print(out.strip() if out else "rc=%s" % rc)
