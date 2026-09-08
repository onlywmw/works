# -*- coding: utf-8 -*-
"""set-status.py —— 工单卡状态写入闸（SYS-04 阶段一）

纪律从口头变代码：任何角色写卡状态必须经过本脚本。
  python 审验员/set-status.py UPG-107 --phase delivered --role dev --note "C 交付" --head 4e5a2f7c
  python 审验员/set-status.py --backfill            # 从工单表反投影回填全部卡的 status 块（基线迁移）
  python 审验员/set-status.py UPG-107 --show        # 只看当前块

内置闸（写失败=登记无效，退出码 1）：
  ① 卡定位=工单号内容匹配（禁行号）
  ② 归属校验：branch 必须含工单号小写（feat/upg107 ↔ UPG-107）——错挂拦截
  ③ phase 迁移校验：closed 必须先 merged；rejected_work 必须 --note 附注
  ④ hash 校验：--head 必须在主仓存在；phase=merged 时必须是 origin/main 祖先
  ⑤ 写前备份 _备份归档\\；写后自动 sync --sync + --check（diff≠0=报错）
"""
import argparse, datetime, io, json, os, re, subprocess, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, "工单库.md")
LIB_GLOBAL = None
REPO = r"E:\mov归档\0027-mov"

PHASES = ["registered", "dispatched", "claimed", "in_progress", "delivered",
          "accepted", "audited", "merged", "closed"]  # 主链（on_hold/obsolete 任意态可进）
# role → 块字段/表列
ROLE_FIELD = {"designer": "designer", "dev": "dev", "inspector": "inspector", "merge": "merge"}
PHASE_ROLE = {"dispatched": "designer", "claimed": "dev", "in_progress": "dev",
              "delivered": "dev", "accepted": "inspector", "audited": "inspector", "merged": "merge",
              "on_hold": "merge", "obsolete": "merge", "closed": "merge"}  # 挂起/作废/闭环落 G 列（同 UPG-101 挂单先例）

FENCE = "```status"


def die(msg):
    print(f"❌ 拒写：{msg}")
    sys.exit(1)


def git(*args):
    r = subprocess.run(["git", "-C", REPO] + list(args), capture_output=True, text=True,
                       encoding='utf-8', errors='replace')
    return r.returncode, r.stdout.strip()


def load():
    return open(LIB_GLOBAL or LIB, encoding='utf-8').read().replace("\r\n", "\n")


def save(text):
    open(LIB_GLOBAL or LIB, "w", encoding='utf-8', newline="\n").write(text)


def backup(tag):
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    dst = os.path.join(ROOT, "_备份归档", f"工单库_backup_setstatus_{tag}_{ts}.md")
    import shutil
    shutil.copyfile(LIB_GLOBAL or LIB, dst)
    return dst


def find_card(lines, ticket):
    """返回 (起行 idx, 下一卡起行 idx)；找不到 die"""
    start = -1
    for i, l in enumerate(lines):
        if re.match(rf"^# {re.escape(ticket)}\s", l):
            start = i
            break
    if start == -1:
        die(f"库中无卡 {ticket}")
    end = len(lines)
    for j in range(start + 1, len(lines)):
        if re.match(r"^# [A-Z][A-Z0-9]*-\d+\s", lines[j]):
            end = j
            break
    return start, end


def parse_block(card_lines):
    """在卡范围找 ```status 块，返回 (块起始行, 块结束行, dict) 或 (None,None,{})"""
    for i, l in enumerate(card_lines):
        if l.strip() == FENCE:
            for j in range(i + 1, len(card_lines)):
                if card_lines[j].strip() == "```":
                    kv = {}
                    for bl in card_lines[i + 1:j]:
                        m = re.match(r"^([a-z_]+):\s?(.*)$", bl.strip())
                        if m:
                            kv[m.group(1)] = m.group(2).strip()
                    return i, j, kv
            die("status 块未闭合（缺 ```）")
    return None, None, {}


def render_block(kv):
    order = ["phase", "branch", "head", "std", "delivery_id",
             "designer", "dev", "inspector", "merge", "actor", "updated_at"]
    out = [FENCE]
    for k in order:
        out.append(f"{k}: {kv.get(k, '—')}")
    out.append("```")
    return out


def sync_and_check():
    r = subprocess.run(["node", os.path.join("审验员", "sync-orders.mjs"), "--sync"],
                       cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode != 0:
        die(f"sync --sync 失败：{r.stdout[-300:]}")
    r = subprocess.run(["node", os.path.join("审验员", "sync-orders.mjs"), "--check"],
                       cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if "CHECK_OK" not in r.stdout:
        die(f"sync --check 未过（库表不一致）：{r.stdout[-400:]}")


def set_status(ticket, phase, role, note, branch, head, std, delivery_id, actor, extra_set=None):
    text = load()
    lines = text.split("\n")
    start, end = find_card(lines, ticket)
    card = lines[start:end]
    bi, bj, kv = parse_block(card)

    # 闸 ② 归属
    if branch:
        tag = ticket.lower().replace("-", "")
        if tag not in branch.lower():
            die(f"归属校验：branch={branch} 与工单号 {ticket} 不符（疑似错挂邻卡）")
    # 闸 ③ 迁移
    old_phase = kv.get("phase", "")
    if phase == "closed" and old_phase not in ("merged", "closed"):
        die(f"迁移校验：closed 必须先 merged（当前 phase={old_phase or '无'}）")
    if phase in ("rejected_work",) and not note:
        die("迁移校验：rejected_work 必须 --note 附注原因")
    # 闸 ④ hash（SYS-05 E：repo 路由——platform: works/repo: 工单系统 的卡查本仓，其余查主仓）
    if head:
        card_m = re.search(r"```status\n([\s\S]*?)```", "\n".join(card))
        st_block = card_m.group(1) if card_m else "\n".join(card)
        is_works = "repo: 工单系统" in st_block or ticket.startswith("SYS-")
        if is_works:
            rc = subprocess.run(["git", "-C", ".", "cat-file", "-t", head], capture_output=True).returncode
        else:
            rc, _ = git("cat-file", "-t", head)
        if rc != 0:
            die(f"hash 校验：{head} 在{'工单系统仓' if is_works else '主仓'}不存在")
        if phase == "merged":
            if is_works:
                rc = subprocess.run(["git", "-C", ".", "merge-base", "--is-ancestor", head, "origin/main"], capture_output=True).returncode
            else:
                rc, _ = git("merge-base", "--is-ancestor", head, "origin/main")
            if rc != 0:
                die(f"hash 校验：{head} 不在 origin/main 祖先链（未合冒充已合）")
        kv["head"] = head
    if branch:
        kv["branch"] = branch
    if std:
        kv["std"] = std
    if delivery_id:
        kv["delivery_id"] = delivery_id

    # SYS-08 S3 词表收敛（R2 补齐）：closed 仅限「明确关闭/不做」——head 已入 origin/main=已合卡唯一终态（合并自 b2）
    if phase == "closed" and head:
        import subprocess as _sp3
        for _rr in [r"E:/mov归档/0027-mov", ROOT]:
            if not os.path.isdir(_rr):
                continue
            _c1 = _sp3.run(["git", "-C", _rr, "cat-file", "-t", head], capture_output=True)
            if _c1.returncode != 0:
                continue
            _c2 = _sp3.run(["git", "-C", _rr, "merge-base", "--is-ancestor", head, "origin/main"], capture_output=True)
            if _c2.returncode == 0:
                die("词表收敛（SYS-08 S3）：head 已在 origin/main——已合卡唯一终态")
            break

    kv["phase"] = phase
    kv["actor"] = actor
    kv["updated_at"] = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    # 角色列：phase 主角色 + 显式 --role + --set k=v 多字段
    col = role or PHASE_ROLE.get(phase)
    if col:
        label = note or PHASE_LABEL(phase)
        kv[col] = label[:70]
    for kv_pair in (extra_set or []):
        k, _, v = kv_pair.partition("=")
        if k not in ("designer", "dev", "inspector", "merge", "std", "delivery_id", "branch", "head"):
            die(f"--set 字段非法：{k}")
        kv[k] = v[:70] if k in ("designer", "dev", "inspector", "merge") else v

    new_block = render_block(kv)
    if bi is None:
        # 插入位置：**状态** 行之前（无状态行则 分类 行之后/标题之后）
        ins = None
        for k, l in enumerate(card):
            if "**状态**：" in l:
                ins = k
                break
        if ins is None:
            ins = 2 if len(card) > 2 else len(card)
        card = card[:ins] + [""] + new_block + [""] + card[ins:]
    else:
        card = card[:bi] + new_block + card[bj + 1:]
    # SYS-10 批②/③：deriveStatusSummary（Python 原生实现——与 derive-status-summary.mjs 同口径，
    # label/emoji 从 registry 单源读——不在注册表=显式占位+告警，勿静默回退）
    _ENTRYY = registry()["STATUS_REGISTRY"].get(phase, {})
    if phase not in registry()["STATUS_REGISTRY"]:
        print(f"[warn] set-status: phase {phase} 不在 STATUS_REGISTRY——使用显式占位", file=sys.stderr)
        _l2 = "未知态(" + phase + ")"
    else:
        _l2 = _ENTRYY.get("label", "未知态(" + phase + ")")
    _e2 = _ENTRYY.get("emoji", "")
    _summary2 = _e2 + " " + _l2 + ((" @" + head[:12]) if head and head != "-" and head != "—" else "")

    # 插入 **状态摘要** 行
    _sum_line = "**状态摘要**：" + _summary2
    _found2 = False
    for _i2, _l2 in enumerate(card):
        if _l2.startswith("**状态摘要**："):
            card[_i2] = _sum_line
            _found2 = True
            break
    if not _found2:
        card.insert(bj + 1, "")
        card.insert(bj + 2, _sum_line)

    # status-history 追加
    _at2 = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S+08:00")
    _hm2 = "```status-history"
    _he2 = "- phase: " + phase + "   at: " + _at2 + "   head: " + (head or "NONE")
    _hb2 = -1
    for _i3, _l3 in enumerate(card):
        if _l3.startswith(_hm2):
            _hb2 = _i3
            break
    if _hb2 >= 0:
        for _i4 in range(_hb2 + 1, len(card)):
            if card[_i4].strip() == "```":
                card.insert(_i4, _he2)
                break
    else:
        card.append("")
        card.append(_hm2)
        card.append(_he2)
        card.append("```")

    lines = lines[:start] + card + lines[end:]  # 写回（所有 card 修改完成后——块/摘要/history 全含）
    b = backup(ticket)
    save("\n".join(lines))
    sync_and_check()
    print(f"✅ {ticket} → phase={phase}（块已写+表已 sync+check 通过；备份 {os.path.basename(b)}）")


_REGISTRY = None


def registry():
    """SYS-10 R1：状态主数据单源——与 derive-status-summary.mjs 共读 status-registry.json。"""
    global _REGISTRY
    if _REGISTRY is None:
        with open(os.path.join(ROOT, "审验员", "lib", "status-registry.json"), encoding="utf-8") as f:
            _REGISTRY = json.load(f)
    return _REGISTRY


# 遗留 enum 兼容（旧卡迁移形态；新 7 态一律走 registry 单源）
LEGACY_LABEL = {"dispatched": "已派单", "claimed": "已认领", "in_progress": "在施",
                "accepted": "验收通过", "audited": "审验通过",
                "closed": "已闭环", "registered": "已立卡", "on_hold": "⏸️ 挂起",
                "obsolete": "❌ 已作废"}


def PHASE_LABEL(phase):
    e = registry()["STATUS_REGISTRY"].get(phase)
    if e:
        return e["label"]
    return LEGACY_LABEL.get(phase, phase)


def backfill():
    """从工单表反投影回填全部卡的 status 块（基线迁移；已有块的卡跳过）"""
    import openpyxl
    if not os.path.exists(os.path.join(ROOT, "工单表.xlsx")):
        print("[表投影已取消 2026-09-08] 工单表不存在——backfill 不再需要，跳过")
        return 0
    wb = openpyxl.load_workbook(os.path.join(ROOT, "工单表.xlsx"), read_only=True)
    rows = list(wb.active.iter_rows(values_only=True))
    s = lambda c: (str(c) if c else "—").replace("\n", " ").strip()
    text = load()
    lines = text.split("\n")
    # 自后向前插入，行号不失效
    cards = []
    for i, l in enumerate(lines):
        m = re.match(r"^# ((?:UPG|S|W|SYS)-\d+)\s", l)
        if m:
            cards.append((i, m.group(1)))
    ends = [c[0] for c in cards[1:]] + [len(lines)]
    byno = {}
    for r in rows[2:]:
        if r[0] and str(r[0]).strip():
            byno[str(r[0]).strip()] = r

    n_done, n_skip, n_new = 0, 0, 0
    for (start, no), end in reversed(list(zip(cards, ends))):
        card = lines[start:end]
        bi, bj, kv = parse_block(card)
        if bi is not None:
            n_skip += 1
            continue
        r = byno.get(no)
        if not r:
            n_skip += 1
            continue
        D, E, F, G, I = s(r[3]), s(r[4]), s(r[5]), s(r[6]), s(r[8])
        # phase 推导（终态优先）
        if any(k in D for k in ["作废", "已销", "退役"]):
            phase = "obsolete"
        elif any(k in G for k in ["已合", "合 main", "合流"]):
            phase = "merged"
        elif "已闭环" in G or "已闭环" in F:
            phase = "closed"
        elif "挂单" in G or "挂单" in D:
            phase = "on_hold"
        elif any(k in F for k in ["通过", "复验"]):
            phase = "accepted"
        elif any(k in E for k in ["完成", "交付"]):
            phase = "delivered"
        elif any(k in E for k in ["认领", "在施"]):
            phase = "in_progress"
        elif any(k in D for k in ["已派", "派单"]):
            phase = "dispatched"
        else:
            phase = "registered"
        # branch/head 尽力而为
        low = no.lower().replace("-", "")
        rc, br = git("rev-parse", "--abbrev-ref", f"feat/{low}")
        rc2, head = git("rev-parse", "--short", f"feat/{low}")
        branch = f"feat/{low}" if rc2 == 0 else "—"
        head = head if rc2 == 0 else "—"
        kv = {"phase": phase, "branch": branch, "head": head, "std": "—",
              "delivery_id": I, "designer": D, "dev": E, "inspector": F, "merge": G,
              "actor": "sys04-backfill",
              "updated_at": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")}
        # std 从卡散文找
        mstd = re.search(rf"STD-{re.escape(no)}-v\d+", "\n".join(card))
        if mstd:
            kv["std"] = mstd.group(0)
        new_block = render_block(kv)
        ins = None
        for k, l in enumerate(card):
            if "**状态**：" in l:
                ins = k
                break
        if ins is None:
            ins = 2 if len(card) > 2 else len(card)
        card = card[:ins] + [""] + new_block + [""] + card[ins:]
        lines = lines[:start] + card + lines[end:]
        n_new += 1
    b = backup("backfill")
    save("\n".join(lines))
    sync_and_check()
    print(f"✅ 基线回填完成：新增块 {n_new} 卡，跳过（已有块/表无行）{n_skip} 卡；备份 {os.path.basename(b)}；sync check 通过")


def show(ticket):
    lines = load().split("\n")
    start, end = find_card(lines, ticket)
    _, _, kv = parse_block(lines[start:end])
    print(f"{ticket}: " + (str(kv) if kv else "无 status 块"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ticket", nargs="?")
    ap.add_argument("--phase")
    ap.add_argument("--role", choices=list(ROLE_FIELD))
    ap.add_argument("--note")
    ap.add_argument("--branch")
    ap.add_argument("--system", help="P0-4 Registry-first: 体系 id（如 ios）→ 由 registry 解析库")
    ap.add_argument("--lib", dest="adhoc_lib", help="P0-4 后门降级: 诊断/迁移/离线修复专用（--adhoc-lib 别名）")
    ap.add_argument("--adhoc-lib", dest="adhoc_lib2", help="P0-4 显式后门（诊断专用）")
    ap.add_argument("--head")
    ap.add_argument("--std")
    ap.add_argument("--delivery-id", dest="delivery_id")
    ap.add_argument("--actor", default="设计师")
    ap.add_argument("--set", dest="extra_set", action="append", default=[])
    ap.add_argument("--backfill", action="store_true")
    ap.add_argument("--show", action="store_true")
    a = ap.parse_args()
    # P0-4 Registry-first routing：--system → registry → lib（普通业务入口）
    if a.system:
        import json as _json
        reg = _json.load(open(os.path.join(ROOT, "审验员", "体系清单.json"), encoding="utf-8"))
        hit = next((s for s in reg if s.get("id") == a.system), None)
        if not hit:
            die(f"体系不存在: {a.system}（见 审验员/体系清单.json）")
        lib = os.path.normpath(os.path.join(ROOT, "..", hit["lib"].replace("../", "")))
        if not os.path.exists(lib):
            die(f"体系库不存在: {lib}")
        LIB_GLOBAL = lib
    elif a.adhoc_lib or a.adhoc_lib2:
        lib = a.adhoc_lib or a.adhoc_lib2
        LIB_GLOBAL = os.path.normpath(os.path.join(os.getcwd(), lib))
        print(f"[adhoc-lib] 诊断模式写入 {LIB_GLOBAL}（非 Registry 权威，仅迁移/离线修复用）")
    else:
        LIB_GLOBAL = None
    if a.backfill:
        backfill()
        return
    if not a.ticket:
        die("缺工单号")
    if a.show:
        show(a.ticket)
        return
    if not a.phase:
        die("缺 --phase")
    set_status(a.ticket, a.phase, a.role, a.note, a.branch, a.head, a.std, a.delivery_id, a.actor, a.extra_set)


if __name__ == "__main__":
    main()
