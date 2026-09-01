# -*- coding: utf-8 -*-
"""ocr_shot.py — Windows 自带 OCR（Windows.Media.Ocr）封装：图片 → 文本（证据链 OCR 落盘）
用法: python ocr_shot.py <image.png> [out.txt]
行为: OCR 文本写 out.txt（默认 <image>.ocr.txt，UTF-8），stdout 打印文本
说明: 调 ocr_run.ps1；图片/输出路径自动转绝对反斜杠（WinRT StorageFile 要求）
"""
import subprocess, sys, os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
PS_SCRIPT = os.path.join(HERE, "ocr_run.ps1")


def _win_path(p):
    return os.path.normpath(os.path.abspath(p)).replace("/", "\\")


def ocr(image_path, out_path=None):
    """识别图片，文本写 out_path（默认 <image>.ocr.txt），返回文本。"""
    img_win = _win_path(image_path)
    out_win = _win_path(out_path if out_path else image_path + ".ocr.txt")
    r = subprocess.run(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
         "-File", PS_SCRIPT, img_win, out_win],
        capture_output=True, timeout=180)
    if os.path.isfile(out_win):
        with open(out_win, "r", encoding="utf-8") as f:
            text = f.read().strip()
    else:
        text = "OCR_ERROR: 输出文件未生成 (rc=%s)" % r.returncode
    return text


if __name__ == "__main__":
    img = sys.argv[1]
    if not os.path.isfile(img):
        sys.exit("图片不存在: " + img)
    out = sys.argv[2] if len(sys.argv) > 2 else img + ".ocr.txt"
    text = ocr(img, out)
    print("=== OCR 结果（落盘 %s）===" % out)
    print(text)
