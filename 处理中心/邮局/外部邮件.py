#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""外部邮件 —— MOV 对外邮箱（agent@mov-ai.cn）读写工具（零依赖·Python stdlib）。

链路：自建 Stalwart（mail.mov-ai.cn）→ 腾讯云 SES 中继（出站）／直收（入站 25）。
发信无需特殊处理：From 照写 agent@mov-ai.cn，服务器自动归一为 SES 验证地址
（信封改写 MtaStageMail.rewrite ＋ 头改写 Sieve），对方看到「MOV 管家 <agent@send.mov-ai.cn>」，
回信直达 agent@mov-ai.cn。

用法：
  python 外部邮件.py send --to wmw163@163.com --subject "你好" --body "正文"      # 或 --body-file
  python 外部邮件.py send --to a@b.com --to c@d.com --subject S --body-file msg.txt
  python 外部邮件.py inbox [--limit 10] [--folder INBOX] [--json]
  python 外部邮件.py read <序号>            # 序号=inbox 列表里的编号（1=最新）
  python 外部邮件.py folders
凭据：<体系根>/运营中心/.secrets/stalwart-admin.json（agent_account）
"""
import argparse
import email
import imaplib
import json
import os
import smtplib
import ssl
import sys
from email.header import decode_header
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

HOST = "mail.mov-ai.cn"
SMTP_PORT = 465          # implicit TLS
IMAP_PORT = 993          # implicit TLS
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SECRETS = os.path.join(ROOT, "运营中心", ".secrets", "stalwart-admin.json")


def creds():
    try:
        d = json.load(open(SECRETS, encoding="utf-8"))
    except Exception as e:
        sys.exit("读不到凭据 %s：%s" % (SECRETS, e))
    a = d.get("agent_account") or {}
    if not a.get("email") or not a.get("password"):
        sys.exit("凭据文件缺 agent_account.email/password")
    return a["email"], a["password"]


def dec(s):
    if not s:
        return ""
    try:
        out = []
        for part, enc in decode_header(s):
            out.append(part.decode(enc or "utf-8", "replace") if isinstance(part, bytes) else part)
        return "".join(out)
    except Exception:
        return str(s)


def cmd_send(a):
    user, pw = creds()
    body = open(a.body_file, encoding="utf-8").read() if a.body_file else (a.body or "")
    if not body:
        sys.exit("正文为空：给 --body 或 --body-file")
    msg = MIMEText(body, "plain", "utf-8")
    msg["From"] = a.sender or user
    msg["To"] = ", ".join(a.to)
    msg["Subject"] = a.subject or "(无主题)"
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="mov-ai.cn")
    ctx = ssl.create_default_context()
    try:
        s = smtplib.SMTP_SSL(HOST, SMTP_PORT, timeout=45, context=ctx)
        s.login(user, pw)
        s.sendmail(user, a.to, msg.as_string())
        s.quit()
    except Exception as e:
        sys.exit("发送失败：%s: %s" % (type(e).__name__, e))
    print("✅ 已提交外发 → %s（服务器自动归一身份后经腾讯云 SES 送达）" % ", ".join(a.to))


def _imap():
    user, pw = creds()
    m = imaplib.IMAP4_SSL(HOST, IMAP_PORT, timeout=45)
    m.login(user, pw)
    return m


def cmd_folders(a):
    m = _imap()
    typ, boxes = m.list()
    for b in boxes or []:
        print("  " + b.decode("utf-8", "replace"))
    m.logout()


def fetch_index(m, folder, limit):
    typ, d = m.select(folder)
    if typ != "OK":
        sys.exit("打不开文件夹 %s" % folder)
    typ, dd = m.search(None, "ALL")
    ids = dd[0].split()
    return ids[-limit:][::-1]  # 最新在前


def cmd_inbox(a):
    m = _imap()
    ids = fetch_index(m, a.folder, a.limit)
    rows = []
    for i, mid in enumerate(ids, 1):
        typ, x = m.fetch(mid, "(BODY.PEEK[HEADER.FIELDS (SUBJECT FROM DATE)])")
        h = email.message_from_bytes(x[0][1])
        rows.append({"n": i, "uid": mid.decode(), "subject": dec(h["Subject"]),
                     "from": dec(h["From"]), "date": h["Date"]})
    m.logout()
    if a.json:
        print(json.dumps(rows, ensure_ascii=False, indent=1))
        return
    if not rows:
        print("（空）")
        return
    for r in rows:
        print("%2d | %s | %s | %s" % (r["n"], r["date"], r["from"], r["subject"]))


def cmd_read(a):
    m = _imap()
    ids = fetch_index(m, a.folder, max(a.limit, a.n))
    if a.n > len(ids):
        sys.exit("序号 %d 超出（列表只有 %d 封）" % (a.n, len(ids)))
    typ, x = m.fetch(ids[a.n - 1], "(RFC822)")
    msg = email.message_from_bytes(x[0][1])
    m.logout()
    print("From: %s" % dec(msg["From"]))
    print("To:   %s" % dec(msg["To"]))
    print("Date: %s" % msg["Date"])
    print("Subj: %s" % dec(msg["Subject"]))
    print("-" * 40)
    body = ""
    for p in msg.walk():
        if p.get_content_type() == "text/plain":
            body += p.get_payload(decode=True).decode(p.get_content_charset() or "utf-8", "replace")
    print(body.strip() or "(无纯文本正文)")


def main():
    ap = argparse.ArgumentParser(description="MOV 对外邮箱工具")
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("send", help="发信")
    s.add_argument("--to", action="append", required=True)
    s.add_argument("--subject", default="")
    s.add_argument("--body", default="")
    s.add_argument("--body-file", default="")
    s.add_argument("--from", dest="sender", default="")
    s.set_defaults(fn=cmd_send)

    i = sub.add_parser("inbox", help="列收件箱")
    i.add_argument("--limit", type=int, default=10)
    i.add_argument("--folder", default="INBOX")
    i.add_argument("--json", action="store_true")
    i.set_defaults(fn=cmd_inbox)

    r = sub.add_parser("read", help="读第 n 封（1=最新）")
    r.add_argument("n", type=int)
    r.add_argument("--folder", default="INBOX")
    r.add_argument("--limit", type=int, default=100)
    r.set_defaults(fn=cmd_read)

    f = sub.add_parser("folders", help="列文件夹")
    f.set_defaults(fn=cmd_folders)

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
