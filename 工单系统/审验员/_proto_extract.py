# -*- coding: utf-8 -*-
"""sync-orders 提取逻辑原型 v2（仅探测用，非交付物）"""
import re

src = open(r"C:\Users\Administrator\Desktop\MOV\工单系统\工单库.md", encoding="utf-8").read()
lines = src.split("\n")
cards = [(i, lines[i]) for i, l in enumerate(lines) if re.match(r"^# UPG-\d+", l)]

SEC_WORDS = [
    "**背景", "**来源", "**问题", "**修法", "**验收", "**交接", "**红线", "**方案",
    "**决策点", "**施工规矩", "**根因", "**定案", "**防撞", "**级别", "**判据",
    "**范围红线", "**关键设计点", "**送审", "**与契约", "**一句话", "**施工范围",
    "**遗留", "**用户实测", "**其余", "**串行", "**交付", "**顺带纠正", "**无冲突",
    "**Token", "**认领情况", "**派单交接", "**核心方案", "**实施", "**不做清单",
    "**维持死亡", "**证伪复活", "**方法学注记", "**文档纪律", "**打回依据",
    "**重修验收", "**关联独立单", "**桥能力现状", "**达标项", "**修正项", "**差距",
    "**合格", "**结构", "**能力清单", "**安装", "**功能", "**规则", "**场景",
    "**边界", "**职责", "**契约", "**接口", "**数据结构", "**配置", "**流转",
]

FIELD_HEAD = ["**出单人**", "**日期**", "**优先级**", "**原状态**", "**来源**", "**级别**", "> "]


def status_region(idx, end):
    for j, l in enumerate(lines[idx:end]):
        if "**状态**：" in l:
            st = idx + j
            break
    else:
        return None
    endline = end
    for j in range(st + 1, end):
        l = lines[j]
        if re.match(r"^# UPG-\d+", l) or re.match(r"^## ", l):
            endline = j
            break
        if any(l.startswith(w) for w in SEC_WORDS):
            endline = j
            break
    return st, endline


SEG2 = re.compile(
    r"(?=→\s*[✅🔨❌⚠️📌🆕⏳】]+)|(?=→\s*\*\*)|(?=｜\s*[✅🔨❌⚠️📌🆕⏳】]+)|(?=｜\s*\*\*)|(?=【✅)|(?=】；)"
    r"|(?=\*\*日期\*\*)|(?=\*\*出单人\*\*)|(?=\*\*优先级\*\*)|(?= \*\*✅)|(?= \*\*🔨)|(?= \*\*❌)"
)


def segments(text):
    body = re.sub(r"^\*\*状态\*\*：", "", text)
    body = body.replace("\n", " ").replace("——", "｜")
    parts = SEG2.split(body)
    out = []
    for p in parts:
        p = p.strip().lstrip("→｜。；").strip()
        if p:
            out.append(p)
    return out


# 角色词：优先级顺序 merge > inspector > dev > designer
ROLE_WORDS = [
    ("merge", ["已合 main", "合 main", "合流", "待设计师合 main"]),
    ("inspector", ["验收员", "审验", "打回", "复验", "验收通过", "独立复核"]),
    ("dev", ["C 完成", "C 交付", "C 批", "C 修复", "程序员", "已认领", "在施", "施工中", "修复交付", "修复完成", "M3-R2"]),
    ("designer", ["方案", "设计", "定稿", "派单", "评审", "激活", "规范", "裁决", "终审", "拍板", "设计师", "大神"]),
]


def classify(seg):
    if seg.startswith("**出单人**") or seg.startswith("**日期**") or seg.startswith("**优先级**") or seg.startswith("**原状态**"):
        return None
    head = seg[:40]
    for role, words in ROLE_WORDS:
        for w in words:
            if w in head:
                return role
    return None


def pick(segs, role):
    best = None
    best_date = -1
    best_pos = -1
    for pos, s in enumerate(segs):
        if classify(s) != role:
            continue
        m = re.findall(r"@?(\d{4}-\d{2}-\d{2})", s)
        date = -1
        for d in m:
            t = int(d.replace("-", ""))
            if t > date:
                date = t
        # @ 日期最大者；同 @ 日期取最后出现
        if date > best_date or (date == best_date and pos > best_pos):
            best, best_date, best_pos = s, date, pos
    return best


out = []
for ci, (idx, title) in enumerate(cards):
    end = cards[ci + 1][0] if ci + 1 < len(cards) else len(lines)
    tno = re.match(r"^# (UPG-\d+)", title).group(1)
    ttl = re.match(r"^# UPG-\d+ (.*)", title).group(1).strip()
    r = status_region(idx, end)
    row = {"no": tno, "title": ttl, "D": "—", "E": "—", "F": "—", "G": "—", "C": "—", "H": "—", "I": "—", "warn": []}
    if r:
        st, endline = r
        txt = "\n".join(lines[st:endline])
        segs = segments(txt)
        row["_segs"] = len(segs)
        for role, col in [("designer", "D"), ("dev", "E"), ("inspector", "F"), ("merge", "G")]:
            s = pick(segs, role)
            if s:
                row[col] = s[:70]
        pm = re.search(r"\*\*优先级\*\*：([^｜|]*)", txt)
        if pm and pm.group(1).strip():
            val = pm.group(1).strip().rstrip("｜|").strip()
            m = re.match(r"^([^（(]+)", val)
            row["C"] = m.group(1).strip() if m else val
        else:
            row["warn"].append("优先级缺失")
        dm = re.findall(r"DEL-[A-Z0-9]+-\d{8}-\d+", txt)
        if dm:
            row["I"] = dm[-1]
        hp = re.search(r"设计师[\\/][^\s｜|，。；）\)]*?\.md", txt)
        if hp:
            row["H"] = hp.group(0)
        if row["D"] == "—" and row["E"] == "—" and row["F"] == "—" and row["G"] == "—":
            row["warn"].append("状态列全空")
    else:
        row["warn"].append("无状态区")
    out.append(row)

for row in out:
    w = (" ⚠" + ",".join(row["warn"])) if row["warn"] else ""
    print(
        "%s C=%-10s D=%-26s E=%-26s F=%-24s G=%-24s H=%-28s I=%-20s%s"
        % (
            row["no"],
            row["C"][:10],
            row["D"][:24],
            row["E"][:24],
            row["F"][:22],
            row["G"][:22],
            row["H"][:26],
            row["I"][:18],
            w,
        )
    )
