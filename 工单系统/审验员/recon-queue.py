# -*- coding: utf-8 -*-
"""recon-queue.py —— 工单队列对账（只读，零写入）

用途：「明明做完了还说没动手」防伪——工单表（机器投影）× 仓库（分支/祖先链）× 验收日志 三方交叉。
纪律（2026-09-05 设计师定，已知坑#9 家族）：
  - 队列/进度判定一律以工单表为准；库卡面状态行允许续行（`｜`/`→` 开头行），禁止只读尾段裸扫。
  - 本脚本只出 flag，人工裁决（机器不猜）。

用法：python 审验员/recon-queue.py   （在 工单系统/ 根目录跑）
"""
import openpyxl, subprocess, io, sys, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = r"E:\mov归档\0027-mov"  # 项目配置.md 第二节；迁移时改这里

def git(*args):
    r = subprocess.run(['git','-C',REPO]+list(args), capture_output=True, text=True, encoding='utf-8', errors='replace')
    return r.stdout.strip()

CLOSED_KW = ['已合', '合 main', '闭环', '销', '作废', '撤', '合流', '取消', '退役', '挂']

def card_state(r):
    s = lambda c: (str(c) if c else '—').replace('\n',' ')
    tid, pri, des, dev, ins, mrg = s(r[0]), s(r[2]), s(r[3]), s(r[4]), s(r[5]), s(r[6])
    closed = any(k in mrg for k in CLOSED_KW) or any(k in des for k in ['作废', '已销', '退役', '取消']) or '已闭环' in ins
    if closed: return None
    if dev.startswith('—'): st = '未施工'
    elif '完成' in dev or '交付' in dev: st = '已交付'
    else: st = '在施'
    if '通过' in ins or '复验' in ins: st += '/验过'
    return tid, pri, st, dev, ins

def main():
    log_text = git('show', 'origin/main:docs/ACCEPTANCE_LOG.md')
    wb = openpyxl.load_workbook(os.path.join(ROOT, '工单表.xlsx'), read_only=True)
    rows = list(wb.active.iter_rows(values_only=True))
    print(f"{'工单':<9}{'级':<4}{'表状态':<12}{'分支':<6}{'∈main':<7}{'日志':<5}flag")
    open_n = 0
    for r in rows[2:]:
        if not r[0] or not str(r[0]).strip(): continue
        st = card_state(r)
        if not st: continue
        tid, pri, stage, dev, ins = st
        low = tid.lower().replace('-', '')
        br = git('branch', '--list', f'feat/{low}*').split('\n')[0].strip().lstrip('* ')   # 前缀匹配（feat/w11-account-hardening 类长名），取真实分支名
        inmain = ''
        if br:
            head = git('rev-parse', br)
            if head and head != git('rev-parse', 'origin/main'):
                rc = subprocess.run(['git','-C',REPO,'merge-base','--is-ancestor',head,'origin/main'])
                inmain = '是' if rc.returncode == 0 else '否'
            elif head:
                inmain = '=顶'
        inlog = '有' if re.search(r'\b' + re.escape(tid) + r'\b', log_text) else '无'
        flag = ''
        if inmain == '是': flag = '🔴 分支已在main但表未闭环→查登记'
        elif stage == '已交付/验过': flag = '🟡 验过未合→查是否该合'
        open_n += 1
        print(f"{tid:<9}{pri:<4}{stage:<12}{('有' if br else '无'):<6}{inmain:<7}{inlog:<5}{flag}")
    print(f"\n开口卡 {open_n} 张；🔴=疑似登记缺失（优先核），🟡=流转尾段，无 flag=真开口")

if __name__ == '__main__':
    main()
