#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SYS-06 A · gen-std —— STD 冻结哈希生成器（审验.py 机器闸同款口径，强制统一）

口径（与 审验.py standard_id 名/指纹交叉校验 :397 逐字同款）：
    body = 全文.split("## 冻结区", 1)[1].split("## 追加说明区", 1)[0]
    content_sha256 = sha256(body.encode("utf-8")).hexdigest()
    （追加说明区缺失则到 EOF；Python read_text 通用换行 \r\n→\n 与机器闸一致）

用法：
    python gen-std.py <STD 文件路径>              # 输出 content_sha256 + 头部行
    python gen-std.py <STD 文件路径> --write      # 回写头部 content_sha256 行（冻结文件仅此一行被写）
    python gen-std.py --self-test                 # 内置：UPG-108 存量实算==d12222eb + 两口径差=标记串断言

红线：不改 审验.py 机器闸算法（口径以它为准）；不重写冻结文件正文（--write 只动头部 sha 行）。
"""
import hashlib
import re
import sys
from pathlib import Path


def std_content_sha256(text: str) -> str:
    """审验.py :397 同款口径：『## 冻结区』后至『## 追加说明区』/EOF 实算。"""
    body = text.split("## 冻结区", 1)[1].split("## 追加说明区", 1)[0]
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def head_sha_line(sha: str) -> str:
    return f"- **content_sha256**: `{sha}`（= 冻结区正文实算，gen-std.py SYS-06 生成）"


def rewrite_head(text: str, sha: str) -> str:
    """回写头部 content_sha256 行（只动该行；无该行则在 standard_id 行后插入）。"""
    pat = re.compile(r"(- \*\*content_sha256\*\*: `)[0-9a-fA-F]{8,64}(`[^\n]*)")
    if pat.search(text):
        return pat.sub(lambda m: m.group(1) + sha + m.group(2), text, count=1)
    sid = re.search(r"(- \*\*standard_id\*\*: `[^\n]*\n)", text)
    if sid:
        return text.replace(sid.group(1), sid.group(1) + head_sha_line(sha) + "\n", 1)
    raise SystemExit("gen-std: 头部既无 content_sha256 行也无 standard_id 行——无法回写")


def self_test(root: Path) -> bool:
    ok = True
    # ① UPG-108 存量实算 == 机器闸 d12222eb（审验.py --manifest 交叉锚）
    p108 = root / "处理中心" / "验收标准冻结区" / "UPG-108" / "STD-UPG-108-v1.md"
    v108 = std_content_sha256(p108.read_text(encoding="utf-8"))
    good108 = v108 == "d12222eb09a062e9731d7ad61979ec5f1c40271a45cdaa80d5a8f91299d9304a"
    print(f"[{'PASS' if good108 else 'FAIL'}] UPG-108 存量实算 {v108[:12]}… == 机器闸 d12222eb（口径同源实锚）")
    ok &= good108
    # ② 两口径差 = 标记串：构造临时 STD——「整文件 sha」≠「冻结区段 sha」，且段 sha 与独立手算一致
    tmp = (
        "# STD-TEST-v1\n\n## 头部（身份 + 完整性 · 冻结后不可改）\n\n"
        "- **standard_id**: `STD-TEST-v1`\n- **content_sha256**: `待生成`（= 冻结区正文实算）\n\n"
        "## 冻结区\n\n判据 T-1：示例判据。\n\n## 追加说明区\n\n追加内容不参与实算。\n"
    )
    seg = tmp.split("## 冻结区", 1)[1].split("## 追加说明区", 1)[0]
    v_seg = std_content_sha256(tmp)
    whole = hashlib.sha256(tmp.encode("utf-8")).hexdigest()
    manual = hashlib.sha256(seg.encode("utf-8")).hexdigest()
    good2 = v_seg == manual and v_seg != whole
    print(f"[{'PASS' if good2 else 'FAIL'}] 两口径差=标记串：gen={v_seg[:12]}… == 独立手算 {manual[:12]}… ≠ 整文件 {whole[:12]}…")
    ok &= good2
    # ③ 回写幂等：--write 后重算不变
    rtext = rewrite_head(tmp, v_seg)
    good3 = std_content_sha256(rtext) == v_seg and "content_sha256: 待生成" not in rtext
    print(f"[{'PASS' if good3 else 'FAIL'}] 回写幂等：write 后重算一致且占位被替换")
    ok &= good3
    print(f"结论: {'PASS' if ok else 'FAIL'}（口径以 审验.py 机器闸为准）")
    return ok


def main() -> None:
    args = sys.argv[1:]
    root = Path(__file__).resolve().parent.parent
    if args and args[0] == "--self-test":
        sys.exit(0 if self_test(root) else 1)
    if args[0] == "--scan":
        # SYS-06 C：存量 STD 口径抽查（只登记不改——头部自报 vs 标记后实算）
        fr = root / "处理中心" / "验收标准冻结区"
        n_ok = n_diff = 0
        for f in sorted(fr.rglob("STD-*.md")):
            t = f.read_text(encoding="utf-8")
            if "## 冻结区" not in t: continue
            m = re.search(r"content_sha256(\*\*)?[^0-9a-fA-F]{0,12}([0-9a-fA-F]{8,64})", t)
            claimed = (m.group(2) if m else "") or "(无自报)"
            real = std_content_sha256(t)
            hit = real.startswith(claimed) if claimed != "(无自报)" else False
            mark = "OK" if hit else "口径差"
            if hit: n_ok += 1
            else: n_diff += 1
            rel = f.relative_to(fr)
            print(f"[{mark}] {rel} 自报={str(claimed)[:12]} 实算={real[:12]}")
        print(f"结论: {n_ok} 口径一致 / {n_diff} 口径差（只登记不改——问题区处置）")
        sys.exit(0)
    if not args:
        print(__doc__)
        sys.exit(2)
    fp = Path(args[0])
    if not fp.is_file():
        print(f"gen-std: 文件不存在 {fp}")
        sys.exit(2)
    text = fp.read_text(encoding="utf-8")
    if "## 冻结区" not in text:
        print("gen-std: 文件缺『## 冻结区』标记——不是 STD 冻结版形态")
        sys.exit(2)
    sha = std_content_sha256(text)
    if "--write" in args:
        fp.write_text(rewrite_head(text, sha), encoding="utf-8")
        print(f"已回写头部 content_sha256 = {sha}")
    print(f"content_sha256 = {sha}")
    print(head_sha_line(sha))


if __name__ == "__main__":
    main()
