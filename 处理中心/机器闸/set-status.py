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
  ⑤ 写前备份 _备份归档\\；写后自动 sync --sync + --check（diff≠0=报错）；备份**滚动窗口**=最近 20 份（超出即剪·`--prune-backups [N]` 手动入口——2026-10-05 瘦身批3）
  ⑥ 写锁（R2·2026-10-04 工单系统重构）：读-改-写全程持锁 <库路径>.lock（O_EXCL 原子建·默认 30s 排队·15min 僵锁破锁留痕）——「写前重读」纪律闸内建；等待上限可 env SET_STATUS_LOCK_WAIT 覆盖（测试用）
  ⑦ 读回对账（R2）：写后重读——目标卡字段到位＋全卡头集合零变动（丢行/覆盖即红·真库自动回滚备份）——「写后读回」纪律闸内建（UPG-56/57/60 同型防线）
"""
import argparse, datetime, glob, hashlib, io, json, os, re, subprocess, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LIB = os.path.join(ROOT, "处理中心", "工单库.md")
LIB_GLOBAL = None
BACKUP_KEEP = 20  # 备份滚动窗口（2026-10-05 瘦身批3：存量 1595 件/1.07GB 与 git 历史 100% 冗余 → 只留最近 20 份；回滚/去重只读“最新一份”，语义不变）

CONFIG_FILE = os.path.join(ROOT, "项目配置.md")
DEFAULT_REPO = r"E:\mov归档\0027-mov"
DEFAULT_WORKS_REPO = r"E:\MOV"  # 工单系统仓（2026-09-09 体系库拆分后：SYS 票历史仍在 works 仓）


def cfg(key, default):
    """从体系根 项目配置.md 读机器可读键（行首 `键: 值`）。

    SYS-19：仓库路径属「模板植入器覆盖区」——写死在脚本里会被重植静默冲回源体系默认，
    故改为启动时从配置读取；缺键/读取失败 → 回落默认值并向 stderr 打一行警告（不静默）。
    """
    try:
        with open(CONFIG_FILE, encoding="utf-8") as f:
            text = f.read()
    except OSError:
        text = ""
    m = re.search(rf"^{re.escape(key)}:[ \t]*(\S.*?)[ \t]*$", text, re.M)
    val = m.group(1).strip().strip("`") if m else ""
    if val:
        return val
    print(f"⚠️ 项目配置.md 未取到「{key}」键——回落默认值 {default}", file=sys.stderr)
    return default


REPO = cfg("repo", DEFAULT_REPO)
WORKS_REPO = cfg("works_repo", DEFAULT_WORKS_REPO)

# Windows 无窗执行（2026-10-04 闪窗彻查修复）：本闸常被无控制台父进程调用（engine execSync／DETACHED 钩子链）——
# 控制台子程序（git/node）不加此旗标各弹一个新 CMD 窗（用户报「合工单一闪而过 cmd 窗」根因·同 2026-09-11 备份.mjs 案）。
# 注：装机 Popen 例外——它自带 DETACHED_PROCESS（与 CREATE_NO_WINDOW 互斥·本身即无窗），其子进程防护在 装机.mjs 内。
NO_WINDOW = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0

PHASES = ["registered", "dispatched", "claimed", "in_progress", "delivered",
          "accepted", "audited", "merged", "closed"]  # 主链（on_hold/obsolete 任意态可进）
# role → 块字段/表列
ROLE_FIELD = {"designer": "designer", "dev": "dev", "inspector": "inspector", "merge": "merge"}
PHASE_ROLE = {"dispatched": "designer", "claimed": "dev", "in_progress": "dev",
              "delivered": "dev", "accepted": "inspector", "audited": "inspector", "merged": "merge",
              "on_hold": "merge", "obsolete": "merge", "closed": "merge"}  # 挂起/作废/闭环落 G 列（同 UPG-101 挂单先例）

FENCE = "```status"


# ── R2 写入事务化（2026-10-04 工单系统重构·闸⑥）─────────────────────────────
# 账本写锁：跨语言协议（node 侧 lib-edit.mjs 同协议）——锁文件=<目标库路径>.lock，
# 内容=pid+时刻；O_CREAT|O_EXCL 原子建锁；排队等待；僵锁（>LOCK_STALE_SEC 无 mtime 更新）破锁留痕。
LOCK_WAIT_SEC = float(os.environ.get("SET_STATUS_LOCK_WAIT", "30"))
LOCK_STALE_SEC = 900

_ACTIVE_LOCK = None  # die() 兜底释放用（任何拒写路径不留死锁）


class LibLock:
    def __init__(self, target):
        self.path = target + ".lock"
        self.held = False

    def acquire(self):
        import time as _t
        deadline = _t.time() + LOCK_WAIT_SEC
        while _t.time() < deadline:
            try:
                fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.write(fd, f"{os.getpid()} {_t.strftime('%Y-%m-%dT%H:%M:%S')}".encode("ascii"))
                os.close(fd)
                self.held = True
                return
            except FileExistsError:
                try:
                    age = _t.time() - os.path.getmtime(self.path)
                except OSError:
                    age = 0.0
                if age > LOCK_STALE_SEC:
                    stale = f"{self.path}.stale-{int(_t.time())}"
                    try:
                        os.rename(self.path, stale)
                        print(f"⚠ 破僵锁（>{int(LOCK_STALE_SEC)}s 未更新·疑持有者已死）→ 留痕 {os.path.basename(stale)}")
                    except OSError:
                        pass
                _t.sleep(0.5)
        die(f"写锁超时（{LOCK_WAIT_SEC:g}s）：{os.path.basename(self.path)} 被他人持有——稍后重试（写前重读再战，勿绕锁强写）")

    def release(self):
        if self.held:
            self.held = False
            try:
                os.remove(self.path)
            except OSError:
                pass


def die(msg):
    global _ACTIVE_LOCK
    print(f"❌ 拒写：{msg}")
    if _ACTIVE_LOCK is not None:  # R2：任何拒写路径不留死锁
        _ACTIVE_LOCK.release()
        _ACTIVE_LOCK = None
    sys.exit(1)


def git(*args):
    r = subprocess.run(["git", "-C", REPO] + list(args), capture_output=True, text=True,
                       encoding='utf-8', errors='replace', creationflags=NO_WINDOW)
    return r.returncode, r.stdout.strip()


def load():
    return open(LIB_GLOBAL or LIB, encoding='utf-8').read().replace("\r\n", "\n")


def save(text):
    open(LIB_GLOBAL or LIB, "w", encoding='utf-8', newline="\n").write(text)


def bak_ts_key(name):
    """备份件时间键＝文件名尾 <YYYYMMDD>_<HHMMSS>（**不能按整名倒序**——tag 前缀 UPG- 恒排在 SYS- 前，会把旧件当最新：2026-10-05 瘦身批3 实测踩中）。"""
    m = re.search(r"_(\d{8})_(\d{6})\.md$", name)
    return (m.group(1) + m.group(2)) if m else ""


def prune_backups(backup_dir, keep=BACKUP_KEEP):
    """滚动窗口：仅保留时间最新 keep 份 工单库_backup_setstatus_*；返回剪除数。
    fail-quiet：剪枝异常不影响写入（备份已落盘才是硬要求）——2026-10-05 瘦身批3。"""
    try:
        items = sorted([f for f in os.listdir(backup_dir) if f.startswith("工单库_backup_setstatus_")], key=bak_ts_key, reverse=True)
    except OSError:
        return 0
    n = 0
    for f in items[keep:]:
        try:
            os.remove(os.path.join(backup_dir, f))
            n += 1
        except OSError:
            pass
    return n


def backup(tag):
    """写前备份——md5 比对无变化不备份（2026-09-09 节流）；SYS-104：沙盒模式不动真库备份区。
    SYS-194：沙盒模式改「沙盒旁备份」（<沙盒>.bak-<ts>·不写真 归档/_备份归档，但保留 ⑦ 对账回滚能力）。"""
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    src = LIB_GLOBAL or LIB
    if LIB_GLOBAL:  # SYS-104：--lib/--adhoc-lib 沙盒模式——不碰真 归档/_备份归档
        import shutil as _sh
        prev = sorted(glob.glob(glob.escape(src) + ".bak-*"))
        with open(src, "rb") as f:
            cur_md5 = hashlib.md5(f.read()).hexdigest()
        if prev:
            with open(prev[-1], "rb") as f:
                if hashlib.md5(f.read()).hexdigest() == cur_md5:
                    return prev[-1]  # 无变化不重复备份（沙盒节流）
        bak = f"{src}.bak-{ts}"
        _sh.copyfile(src, bak)
        print(f"  ○ 沙盒模式：跳过真库备份（改落沙盒旁 {os.path.basename(bak)}·真备份区零触）")
        return bak
    backup_dir = os.path.join(ROOT, "处理中心", "归档", "_备份归档")
    os.makedirs(backup_dir, exist_ok=True)

    # 找时间上最近一次备份（不得按整名倒序：tag 前缀会错序），md5 比对
    existing = sorted([f for f in os.listdir(backup_dir) if f.startswith("工单库_backup_setstatus_")], key=bak_ts_key, reverse=True)
    if existing:
        latest = os.path.join(backup_dir, existing[0])
        with open(latest, "rb") as f:
            latest_md5 = hashlib.md5(f.read()).hexdigest()
        with open(src, "rb") as f:
            current_md5 = hashlib.md5(f.read()).hexdigest()
        if current_md5 == latest_md5:
            return None  # 无变化不备份

    dst = os.path.join(backup_dir, f"工单库_backup_setstatus_{tag}_{ts}.md")
    import shutil
    shutil.copyfile(src, dst)
    n = prune_backups(backup_dir)  # 滚动窗口（fail-quiet）
    if n:
        print(f"  🧹 备份滚动：剪除 {n} 份旧备份（保留最近 {BACKUP_KEEP} 份）")
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
    order = ["phase", "branch", "head", "std", "delivery_id", "install",
             "designer", "dev", "inspector", "merge", "actor", "updated_at"]
    out = [FENCE]
    for k in order:
        out.append(f"{k}: {kv.get(k, '—')}")
    for k in ("dispatched_at", "tree_digest", "fast_delivery"):  # 2026-10-01 三闸字段：有则显
        if kv.get(k):
            out.append(f"{k}: {kv[k]}")
    out.append("```")
    return out


def find_worktree(kv, card_lines):
    """定位 worktree：① branch 派生（feat/upgN→mov-upgN·最稳·note 不会覆写 branch）② 卡文/designer 里的 worktree=<名>。
    双根探测；未定位→None（跳过·不阻断）。"""
    names = []
    br = (kv.get("branch") or "").strip()
    if br:
        names.append(br.replace("feat/", "mov-").replace("feat-", "mov-"))
    blob = "\n".join(card_lines) + "\n" + (kv.get("designer") or "")
    names += re.findall(r"worktree=([A-Za-z0-9_\-]+)", blob)
    for name in names:
        for rt in (r"C:\Users\Administrator", r"E:\mov工作区"):
            p = os.path.join(rt, name)
            if os.path.exists(os.path.join(p, ".git")):
                return p
    return None


def compute_tree_digest(wt):
    """全树摘要锚（SYS-200 归一 · 索引态无关）：单源＝机器闸/lib/tree-digest.mjs（node 子进程直调·防再分叉）。
    口径：路径集（HEAD 差异 ∪ 未跟踪）→ 逐路径工作树内容 sha256 → 清单 sha256 前16。
    `git add -N`（intent-to-add）与 untracked 两态同判；历史锚不回溯（旧口径锚与新口径不可比）。"""
    r = subprocess.run(["node", os.path.join("处理中心", "机器闸", "lib", "tree-digest.mjs"), wt],
                       cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace",
                       creationflags=NO_WINDOW)
    out = (r.stdout or "").strip()
    if r.returncode != 0 or not re.fullmatch(r"[0-9a-f]{16}", out):
        return None
    return out


def sync_and_check():
    r = subprocess.run(["node", os.path.join("处理中心", "机器闸", "sync-orders.mjs"), "--sync"],
                       cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace', creationflags=NO_WINDOW)
    if r.returncode != 0:
        die(f"sync --sync 失败：{r.stdout[-300:]}")
    r = subprocess.run(["node", os.path.join("处理中心", "机器闸", "sync-orders.mjs"), "--check"],
                       cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='replace', creationflags=NO_WINDOW)
    if "CHECK_OK" not in r.stdout:
        die(f"sync --check 未过（库表不一致）：{r.stdout[-400:]}")


def readback(ticket, want, pre_headers, bak):
    """R2 闸⑦（2026-10-04 工单系统重构）：写后读回对账。
    判据：① 目标卡重定位成功且 want 字段逐项到位；② 全卡头集合与写前完全一致（丢卡/回退/乱序即红）。
    失败处置：真库（有备份文件）自动回滚最近备份后拒写；沙盒无备份=报红人工处置。
    防线口径：UPG-56/57 行丢失、UPG-60 行回退同型——写后即验，不留隔夜账。"""
    import shutil
    text2 = load()
    lines2 = text2.split("\n")
    start = -1
    for i, l in enumerate(lines2):
        if re.match(rf"^# {re.escape(ticket)}\s", l):
            start = i
            break
    ok = start >= 0
    if ok:
        end = len(lines2)
        for j in range(start + 1, len(lines2)):
            if re.match(r"^# [A-Z][A-Z0-9]*-\d+\s", lines2[j]):
                end = j
                break
        _, _, kv2 = parse_block(lines2[start:end])
        for k, v in want.items():
            if str(kv2.get(k, "")) != str(v):
                ok = False
                break
    headers2 = [l for l in lines2 if re.match(r"^# [A-Z][A-Z0-9]*-\d+\s", l)]
    if ok and headers2 != pre_headers:
        ok = False
    if not ok:
        msg = "读回对账失败：目标字段未到位或卡头集合变动（疑丢行/覆盖·UPG-56/57/60 同型）"
        if isinstance(bak, str) and os.path.isfile(bak):
            shutil.copyfile(bak, LIB_GLOBAL or LIB)
            msg += f"——已回滚备份 {os.path.basename(bak)}"
        else:
            msg += "——无备份可回滚（沙盒/无变化路径），人工处置"
        die(msg)
    print(f"  🔒 读回对账通过：{ticket} 字段到位·卡头集合零变动（在册 {len(headers2)} 卡）")


def set_install_field(ticket, value):
    """SYS-186 版本记账：只更新 install: 字段（装机回写用·不动 phase/角色列/updated_at）。
    纪律同 set_status：持锁→备份→写→读回对账；值形如 V1.1-<sha>[+suffix+dirty]·≤70。"""
    v = (value or "").strip()
    if not v:
        die("--install 值不能为空（形如 V1.1-<sha>[+suffix+dirty]）")
    if len(v) > 70:
        die(f"--install 值超长（{len(v)}>70）:{v[:40]}…")
    if not re.match(r"^V\d+(?:\.\d+)*-\S+$", v):
        die(f"--install 值形如 V1.1-<sha>[+suffix+dirty]：{v[:48]}")
    global _ACTIVE_LOCK
    lock = LibLock(LIB_GLOBAL or LIB)
    lock.acquire()
    _ACTIVE_LOCK = lock
    lines = load().split("\n")
    start, end = find_card(lines, ticket)
    card = lines[start:end]
    bi, bj, kv = parse_block(card)
    if bi is None:
        die(f"{ticket} 无 status 块（先 set-status 立卡后才能记 install）")
    kv["install"] = v
    card = card[:bi] + render_block(kv) + card[bj + 1:]
    lines = lines[:start] + card + lines[end:]
    # SYS-194 ⑧：写前即刻重读盘面——⑦ 比对面取「disk 现态」（初始读与写之间被外部写 ⇒ 写后对账现形并回滚备份）
    expected_headers = [l for l in load().split("\n") if re.match(r"^# [A-Z][A-Z0-9]*-\d+\s", l)]
    b = backup(ticket)
    save("\n".join(lines))
    readback(ticket, {"install": v}, expected_headers, b)
    lock.release()
    _ACTIVE_LOCK = None
    print(f"📇 {ticket} install: {v}")


def set_status(ticket, phase, role, note, branch, head, std, delivery_id, actor, extra_set=None, exempt=None):
    # 闸 ⓪ 交付门（2026-09-30 05:3x 立·治「交付即填 delivery_id」连续 8 单同型的事）：
    #   体例已写进派单模板补遗，但八单仍漏（模板文本治不了执行）⇒ 改为**机器拒绝**：
    #   交付（--phase delivered）MUST 同时给 --delivery-id（形如 DEL-<单号>-<日期>-NNN），否则拒写。
    if phase == "delivered" and not (delivery_id or "").strip():
        die("交付门：--phase delivered 必须同时给 --delivery-id（形如 DEL-UPG400-20260930-001，与交付清单同号）——"
            "空交付号会在合并位/证据链上留下不可追溯的断层（2026-09-30 前已连发 8 单）。请补后重跑。")
    # 闸 ⓪' 报告存在闸（2026-10-01 立·治「交付报告缺落」——386-389 三张被催收＋440/442/444 原件位全缺，两轮同型）：
    #   交付（--phase delivered）MUST 同时存在交付报告原件（程序员/交付报告/交付报告_<单号>_*.md，≥500B 防空壳）。
    #   沙盒模式跳过本闸（不读真目录——SYS-104 全链路零真触收紧·tier C① 修复 @2026-10-04 用户令）。
    if phase == "delivered" and not LIB_GLOBAL:
        _rep = [f for f in glob.glob(os.path.join(ROOT, "程序员", "交付报告", f"交付报告_{ticket}_*.md"))
                if os.path.getsize(f) >= 500]
        if not _rep:
            die(f"报告闸：交付前须先落交付报告原件（≥500 字节·程序员/交付报告/交付报告_{ticket}_<日期>.md，含 `_R<n>_` 变体）"
                f"——先写报告再跑 set-status（2026-10-01 立·缺报告同型已 6 例）。")
    elif phase == "delivered":
        print("  ○ 沙盒模式：跳过报告闸（不读真 程序员\\交付报告——tier C① 修复 @2026-10-04）")
    # R2 闸⑥：读-改-写全程持锁——「写前重读」纪律闸内建（持锁后 load() 即最新态）
    global _ACTIVE_LOCK
    lock = LibLock(LIB_GLOBAL or LIB)
    lock.acquire()
    _ACTIVE_LOCK = lock
    text = load()
    lines = text.split("\n")
    # SYS-194 测试缝（仅沙盒 --lib 生效·生产零延时）：显式延时以确定性地构造「读后写前」并发窗口
    _delay_ms = float(os.environ.get("SET_STATUS_TEST_DELAY_MS", "0") or 0)
    if _delay_ms > 0 and LIB_GLOBAL:
        import time as _t2
        _t2.sleep(_delay_ms / 1000)
    start, end = find_card(lines, ticket)
    card = lines[start:end]
    bi, bj, kv = parse_block(card)

    # 闸 ⓪'' 树快照锚＋⓪''' 速度标旗（2026-10-01 立·治 UPG-400 两次「交付后动树」与「5 分钟超快交付无标记」）：
    #   delivered：树摘要写卡面（tree_digest）＋派单→交付 <30min 亮 fast_delivery（不拦·供验收加强）；
    #   dispatched：记 dispatched_at（速度标旗的唯一数据源）。
    if phase == "delivered":
        _wt = find_worktree(kv, card)
        if _wt:
            _dg = compute_tree_digest(_wt)
            if _dg:
                kv["tree_digest"] = _dg
            else:
                print(f"⚠ 树快照锚：{_wt} 摘要计算失败（跳过·不阻断）")
        else:
            print("⚠ 树快照锚：未定位 worktree（designer 字段无 worktree= 或路径不存在）——跳过（验收按现口径）")
        _da = (kv.get("dispatched_at") or "").strip()
        if _da:
            try:
                _t0 = datetime.datetime.strptime(_da, "%Y-%m-%dT%H:%M:%S")
                _mins = (datetime.datetime.now() - _t0).total_seconds() / 60.0
                if 0 <= _mins < 30:
                    kv["fast_delivery"] = "true"
                    print(f"⚡ 速度标旗：派单→交付 {_mins:.0f} 分钟（<30）——验收侧请追加交付自证复核")
                else:
                    kv.pop("fast_delivery", None)
            except ValueError:
                pass
    elif phase == "dispatched":
        kv["dispatched_at"] = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

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
        # 2026-10-02 卡点2 修（UPG-469/470 实证）：卡面「仓库」标注**只作优先序·不作裁决**——
        # head 实仓双查：声明面先查、另一面兜底；实仓≠标注 ⇒ 留痕（以 head 实仓为准）。治本：标注是取号骨架默认值，不可信。
        is_works = ("repo: 工单系统" in st_block or ticket.startswith("SYS-")
                    or bool(re.search(r"\*\*仓库\*\*[:：]\s*体系仓", "\n".join(card))))
        # 2026-09-28 双仓校验（SYS-133/134 案）：SYS 票历史名义在 works 仓，但"体系仓就地单"的 commit
        # 落在体系库仓（WORKS_REPO/<体系目录>）——只查 WORKS_REPO 会把真 commit 判成"不存在"。
        _cands = []
        if is_works:
            _cands.append(WORKS_REPO)
            try:
                for _d in os.listdir(WORKS_REPO):
                    _p = os.path.join(WORKS_REPO, _d)
                    if os.path.isdir(os.path.join(_p, ".git")):
                        _cands.append(_p)
            except OSError:
                pass
            _cands.append(REPO)          # 兜底：产品主仓（卡面误标「体系仓」的 worktree 单——UPG-469/470）
        else:
            _cands.append(REPO)
            _cands.append(ROOT)          # 兜底：体系仓（就地单）
        rc, _HEAD_REPO = 1, REPO
        for _r in _cands:
            if not _r or not os.path.isdir(os.path.join(_r, ".git")):
                continue
            if subprocess.run(["git", "-C", _r, "cat-file", "-t", head], capture_output=True, creationflags=NO_WINDOW).returncode == 0:
                rc, _HEAD_REPO = 0, _r
                break
        if rc == 0 and is_works != (_HEAD_REPO != REPO):
            print(f"🧭 卡面标注与 head 实仓不一致：标注＝{'体系仓' if is_works else '主仓'}·实仓＝{_HEAD_REPO}（以实仓为准·建议勘正卡面）")
        if rc != 0:
            die(f"hash 校验：{head} 在{'工单系统仓/体系库仓/主仓' if is_works else '主仓/体系仓'}均不存在")
        if phase == "merged":
            # 2026-10-02：无远端仓（体系仓）⇒ 以本仓 HEAD 为「已合」基准；有 origin/main 则照旧（远端口径）
            _has_origin = subprocess.run(["git", "-C", _HEAD_REPO, "rev-parse", "--verify", "origin/main"], capture_output=True, creationflags=NO_WINDOW).returncode == 0
            _ref = "origin/main" if _has_origin else "HEAD"
            rc = subprocess.run(["git", "-C", _HEAD_REPO, "merge-base", "--is-ancestor", head, _ref], capture_output=True, creationflags=NO_WINDOW).returncode
            if rc != 0:
                if exempt:
                    print(f"🧾 豁免通道（红线22）：{head} 不在 {_ref} 祖先链——豁免理由入册：{exempt}")
                else:
                    die(f"hash 校验：{head} 不在 {_ref} 祖先链（未合冒充已合）——确属豁免场景加 --exempt \"理由\"")
            elif not _has_origin:
                print(f"🧭 {_HEAD_REPO} 无 origin/main——就地单口径：以本仓 HEAD 为已合基准核过")
        kv["head"] = head
    if branch:
        kv["branch"] = branch
    if std:
        kv["std"] = std
    if delivery_id:
        kv["delivery_id"] = delivery_id

    kv["phase"] = phase
    kv["actor"] = actor
    kv["updated_at"] = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    # 角色列：phase 主角色 + 显式 --role + --set k=v 多字段
    col = role or PHASE_ROLE.get(phase)
    if col:
        label = note or PHASE_LABEL(phase)
        # 2026-09-26 口径（设计师裁·验收员 LTR-20260926-164336-500-l1q）：
        # accepted 与 audited 共用 inspector 列 → **工具层强制标作者**（〔验收〕/〔审验〕），
        # 免两站结论互读成对方已终审；单开列（qa:）方案待引擎串行线空闲后另单。
        if col == "inspector":
            tag = "〔验收〕" if phase == "accepted" else ("〔审验〕" if phase == "audited" else "")
            if tag and not label.startswith(tag):
                label = tag + label
        kv[col] = label[:70]
    for kv_pair in (extra_set or []):
        k, _, v = kv_pair.partition("=")
        if k not in ("designer", "dev", "inspector", "merge", "std", "delivery_id", "branch", "head", "install"):
            die(f"--set 字段非法：{k}")
        # SYS-186：install（设备实装版本名）与角色列同口径截断 ≤70
        kv[k] = v[:70] if k in ("designer", "dev", "inspector", "merge", "install") else v

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
    lines = lines[:start] + card + lines[end:]
    # SYS-194 ⑧：写前即刻重读盘面——⑦ 比对面取「disk 现态」（初始读与写之间被外部写 ⇒ 写后对账现形并回滚备份）
    expected_headers = [l for l in load().split("\n") if re.match(r"^# [A-Z][A-Z0-9]*-\d+\s", l)]
    b = backup(ticket)
    save("\n".join(lines))
    # R2 闸⑦：写后读回对账——目标卡字段到位＋全卡头集合零变动；失败=真库回滚备份后拒写
    readback(ticket,
             {**{"phase": phase}, **({"branch": branch} if branch else {}), **({"head": head} if head else {})},
             expected_headers, b)
    lock.release()
    _ACTIVE_LOCK = None
    if LIB_GLOBAL:
        # SYS-104：沙盒模式不碰真 表/Registry 面（sync 会读真库与真项目配置）——全链路零真写
        print("  ○ 沙盒模式：跳过真库表同步/校验（不碰真面）")
        print(f"✅ {ticket} → phase={phase}（沙盒：块已写；未 sync/未备份真库）")
    else:
        sync_and_check()
        print(f"✅ {ticket} → phase={phase}（块已写+表已 sync+check 通过；备份 {os.path.basename(b)}）")

    # 2026-10-05（UPG-499 静默 9h 案·ultra 版）：merged＝挂起依赖的达成事件——顺手查挂起表，依赖全达即提示可解挂（只提示·不自动解挂）
    if phase == "merged":
        try:
            _pf = os.environ.get("MOV_PARK_FILE") or os.path.join(ROOT, "处理中心", "看板", "挂起.json")
            _parks = json.load(open(_pf, encoding="utf-8")) if os.path.exists(_pf) else {}
            _all = "\n".join(lines)

            def _ph(dep):
                _b = re.search(rf"(?ms)^# {re.escape(dep)}\s.*?(?=^# |\Z)", _all)
                _m = re.search(r"(?m)^phase:\s*(\S+)", _b.group(0)) if _b else None
                return _m.group(1) if _m else "?"
            for _pid, _p in _parks.items():
                _u = str(_p.get("until") or "")
                if _pid == ticket or "合并" not in _u:
                    continue
                _deps = re.findall(r"[A-Z]+-\d+", _u)
                if ticket in _deps and all(_ph(d) in ("merged", "obsolete", "closed") for d in _deps):
                    print(f"  ⚠ 挂起依赖达成：{_pid} —— 可解挂（node 处理中心/看板/engine.mjs 解挂 {_pid}）")
        except Exception as _e:
            print(f"  （挂起复核跳过：{_e}）")

    # 2026-10-05（用户报「之前提过的问题没落实」案·UPG-519 根因）：merged＝挂账行「候 <单号>」类条件的达成事件——
    #   顺手扫 问题区/挂账登记表.md：「设计师验证」或「施工/转工单」列含「候」且未勾销的行，其引用了本单（本单刚终态＝其条件达成事件）⇒ 提示可复核销账。
    #   ★2026-10-05 复演修正：原判据是「引用他单且他单已终态」——每单刷 58 条陈年噪声、反而不放本单刚满足的行（UPG-499 复演实证）；改「引用本单」＝与 HY-BASE-27 主口径（窗口×候行）同语义。
    #   ★只提示·不自动销（台账人工裁决）；fail-quiet；沙盒跳过（不读真面）；输出上限 5 条+计数（SYS-154 摘要纪律）。
    if phase == "merged" and not LIB_GLOBAL:
        try:
            _lf = os.path.join(ROOT, "处理中心", "问题区", "挂账登记表.md")
            if os.path.exists(_lf) and "_ph" in dir():
                _rows = [l for l in open(_lf, encoding="utf-8").read().splitlines() if l.startswith("| 挂账")]
                _closed = ("✅", "已销", "已闭", "已落", "已核销")
                _hits = []
                for _r in _rows:
                    _c = _r.split("|")
                    if len(_c) < 8:
                        continue
                    _verify = (_c[6] or "").strip()      # 第6列 = 设计师验证
                    _work = (_c[7] or "").strip()          # 第7列 = 施工/转工单
                    if "候" not in _verify and "候" not in _work:
                        continue
                    if any(_m in _verify for _m in _closed):
                        continue
                    _ids = [i for i in re.findall(r"[A-Z]+-\d+", _r) if i == ticket]
                    _hit = sorted({i for i in _ids if _ph(i) in ("merged", "obsolete", "closed")})
                    if _hit:
                        _hits.append(((_c[1] or "").strip()[:26], _hit[:2], _verify[:20]))
                for _h in _hits[:5]:
                    print(f"  ⚠ 挂账可复核：{_h[0]} —— 相关单 {','.join(_h[1])} 已终态（候={_h[2]}…）·人工裁定销/改")
                if len(_hits) > 5:
                    print(f"  （另有 {len(_hits)-5} 条同型候选——台账：处理中心/问题区/挂账登记表.md）")
        except Exception as _e:
            print(f"  （挂账复核跳过：{_e}）")


def PHASE_LABEL(phase):
    return {"dispatched": "已派单", "claimed": "已认领", "in_progress": "在施",
            "delivered": "已交付", "accepted": "验收通过", "audited": "审验通过",
            "merged": "已合 main", "closed": "已闭环", "registered": "已立卡",
            "on_hold": "⏸️ 挂起", "obsolete": "❌ 已作废"}.get(phase, phase)


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
        m = re.match(r"^# ((?:UPG|SYS|POL)-\d+)\s", l)
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
    global LIB_GLOBAL  # SYS-104 根因修：原缺此声明 ⇒ --lib/--adhoc-lib 赋值只落局部变量，写路径仍走真库（T1 事故）
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
    ap.add_argument("--install", help="设备实装版本名（装机回写 install: 字段·只改该字段·SYS-186）")
    ap.add_argument("--actor", default="设计师")
    ap.add_argument("--set", dest="extra_set", action="append", default=[])
    ap.add_argument("--backfill", action="store_true")
    ap.add_argument("--show", action="store_true")
    ap.add_argument("--exempt", help="豁免理由（merged 登记跳过 hash 祖先闸——红线22 显式豁免，理由入册）")
    ap.add_argument("--prune-backups", dest="prune_backups", nargs="?", type=int, const=BACKUP_KEEP, default=None, help=f"手动剪枝：保留最近 N 份工单库备份（缺省 {BACKUP_KEEP}）后退出")
    a = ap.parse_args()
    # P0-4 Registry-first routing：--system → registry → lib（普通业务入口）
    if a.system:
        import json as _json
        reg = _json.load(open(os.path.join(ROOT, "处理中心", "机器闸", "体系清单.json"), encoding="utf-8"))
        hit = next((s for s in reg if s.get("id") == a.system), None)
        if not hit:
            die(f"体系不存在: {a.system}（见 处理中心/机器闸/体系清单.json）")
        lib = os.path.normpath(os.path.join(ROOT, "..", hit["lib"].replace("../", "")))
        if not os.path.exists(lib):
            die(f"体系库不存在: {lib}")
        LIB_GLOBAL = lib
    elif a.adhoc_lib or a.adhoc_lib2:
        lib = a.adhoc_lib or a.adhoc_lib2
        LIB_GLOBAL = os.path.normpath(os.path.join(os.getcwd(), lib))
        # SYS-104：沙盒旗标语义=只写沙盒——指向真库直接拒收（fail-closed），并 stdout 明示拦截
        if os.path.normcase(os.path.abspath(LIB_GLOBAL)) == os.path.normcase(os.path.abspath(LIB)):
            die("沙盒旗标指向真库（--lib/--adhoc-lib 语义=只写沙盒）——拒执行，真库零触")
        print(f"🛡 已拦真库写入：沙盒模式 → {LIB_GLOBAL}（真库 {LIB} 零触·非 Registry 权威，仅迁移/离线修复用）")
    else:
        LIB_GLOBAL = None
    if a.backfill:
        backfill()
        return
    if a.prune_backups is not None:
        if LIB_GLOBAL:
            print("  ○ 沙盒模式：跳过备份剪枝（不触真 归档面）")
            return
        _bd = os.path.join(ROOT, "处理中心", "归档", "_备份归档")
        _n = prune_backups(_bd, a.prune_backups)
        print(f"🧹 备份滚动：剪除 {_n} 份（保留最近 {a.prune_backups} 份）｜{_bd}")
        return
    if not a.ticket:
        die("缺工单号")
    if a.show:
        show(a.ticket)
        return
    if a.install:
        # SYS-186：安装回写专用口（只改 install: 字段——免重跑 phase 流程/其交付门）
        set_install_field(a.ticket, a.install)
        return
    if not a.phase:
        die("缺 --phase")
    set_status(a.ticket, a.phase, a.role, a.note, a.branch, a.head, a.std, a.delivery_id, a.actor, a.extra_set, exempt=a.exempt)
    # 工单资产生命周期钩子（大神三号 2026-09-09 拍板）：终态写入成功 → 自动触发产出归档
    # 原则：角色负责生产，工单负责归属，状态负责流转，归档只是终态
    if a.phase in ("merged", "closed", "obsolete"):
        # SYS-104：沙盒模式不触真 归档面（写库工具沙盒=全链路零真写）
        n_total = 0
        if LIB_GLOBAL:
            print("  ○ 沙盒模式：跳过工单资产随动（不触真 归档 面）")
        else:
            for role in ["程序员", "设计师", "验收员", "审验员"]:
                try:
                    r = subprocess.run(
                        ["node", os.path.join(ROOT, "处理中心", "机器闸", "evidence-archive.mjs"), role, "--execute"],
                        capture_output=True, text=True, timeout=60, cwd=ROOT,
                        encoding="utf-8", errors="replace",  # SYS-33：不指定 encoding 时按 Windows 本地码页(GBK)解码，
                        #   归档器吐的 UTF-8（✅📦 等）会解码抛错 → r.stdout 静默为空 → 判定再次失效（实测复现）。
                        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
                        creationflags=NO_WINDOW,
                    )
                    # SYS-33 修：原判定是裸子串 `"迁移" in r.stdout`，而归档器 N=0 时也打印「迁移 0 个目录」
                    #   ⇒ 四角色一律假报「已自动归档」（UPG-129 无证据目录也报「已归档」实证）。
                    #   改判归档器吐出的机器可读计数 ARCHIVE_MIGRATED=<n>：n>0 才是真归档，n=0 明说无待归档。
                    # SYS-142 ②：rc≠0 必显式报红（旧实现 rc=1 时 stdout 无计数行 ⇒ 仍打印「无待归档」——09-29 静默案）。
                    #   口径：仅 rc=0 且 ARCHIVE_MIGRATED=0 才可打「无待归档」；rc≠0 报 rc＋输出摘录（不阻塞状态写入）。
                    m = re.search(r"ARCHIVE_MIGRATED=(\d+)", r.stdout or "")
                    n = int(m.group(1)) if m else 0
                    if r.returncode != 0:
                        if n:
                            n_total += n
                            print(f"  📦 工单资产随动：{role} 证据已归档 {n} 件（另有未迁件）")
                        tail_lines = [ln.strip()[:100] + ("…" if len(ln.strip()) > 100 else "") for ln in (r.stdout or "").splitlines() if ln.strip()][-3:]
                        print(f"  ⚠️ 归档器异常 rc={r.returncode}——证据未全部归档，需补跑：{' ｜ '.join(tail_lines)}")
                    elif n:
                        n_total += n
                        print(f"  📦 工单资产随动：{role} 证据已归档 {n} 件")
                    else:
                        print(f"  ○ {role} 证据：无待归档")
                except Exception as e:
                    # SYS-142 ②：调用异常（超时/找不到 node 等）同样禁静默——报红不阻塞状态写入
                    print(f"  ⚠️ 归档器调用异常（{role}）：{e}——证据未归档，需人工确认")
        if n_total:
            print(f"  📦 本轮工单资产随动合计 {n_total} 件")

    # 2026-10-02：merged 相位钩子——「合了即自动出包装机」（用户报「都已经合了，为什么安装的总是旧包」的机制化收口）：
    # 异步触发 装机.mjs（工具内自判：设备已=main 现头 / 无 App 面改动 ⇒ 跳过；并发锁；无设备=N/A）。
    # 沙盒模式不触发（tier C① 修复 @2026-10-04 用户令——原实现不经 LIB_GLOBAL 判定即异步起真设备侧进程，沙盒语义破例）。
    if a.phase == "merged" and LIB_GLOBAL:
        print("   ○ 沙盒模式：跳过装机钩子（装机.mjs 不触发——tier C① 修复 @2026-10-04）")
    elif a.phase == "merged":
        try:
            _mlog = os.path.join(ROOT, "处理中心", "看板", "装机哨兵.log")
            os.makedirs(os.path.dirname(_mlog), exist_ok=True)
            _fh = open(_mlog, "ab")
            _flags = (subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP) if os.name == "nt" else 0
            subprocess.Popen(
                ["node", os.path.join(ROOT, "处理中心", "机器闸", "装机.mjs"), "--purpose", "main-align", "--by", "merge-hook",
                 "--ticket", a.ticket],  # SYS-184：设备包台账记触发源｜SYS-186：带单号 ⇒ 卡面 install: 自动回写
                cwd=ROOT, stdout=_fh, stderr=subprocess.STDOUT,
                creationflags=_flags, close_fds=True,
            )
            print("   🔧 [合并钩子] 装机.mjs 已触发（异步）→ 处理中心/看板/装机哨兵.log")
        except Exception as e:
            print(f"   ⚠ [合并钩子] 装机未触发：{e}（可手动：node 处理中心/机器闸/装机.mjs）")

if __name__ == "__main__":
    if "--exempt" in sys.argv and "--phase" in sys.argv and "merged" in sys.argv:
        i = sys.argv.index("--exempt")
        reason = sys.argv[i + 1] if i + 1 < len(sys.argv) else ""
        j = sys.argv.index("--note") if "--note" in sys.argv else -1
        stamp = f"🧾豁免合档：{reason}"
        if j > 0 and j + 1 < len(sys.argv):
            sys.argv[j + 1] = sys.argv[j + 1] + "；" + stamp
        else:
            sys.argv.extend(["--note", stamp])
    main()
