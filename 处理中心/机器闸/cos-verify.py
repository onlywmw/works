#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""cos-verify.py —— COS 分桶/防串/最小权限 验收探针（2026-09-28 立·v2 用官方 SDK）

背景：v1 自搓 TC3 签名器有 bug（对 COS 报"signature empty"）⇒ v2 改用官方 SDK `qcloud_cos`。
依赖：pip install cos-python-sdk-v5（本机 venv 已装）

用法：
  python cos-verify.py [--region ap-beijing] [--appid 1442545159]
                       [--ud mov-produserdata-1442545159] [--vault mov-prod-vault-1442545159]
密钥：运营中心/.secrets/SecretKey_COS子账号.csv（首行=userdata 子账号·次行=vault 子账号；第三列可为用途）
纪律：只读 + tmp/ 前缀小对象冒烟（测完即删）·不上传任何用户数据·不打印密钥明文
退出码：0=全过；1=有用例失败；2=用法/依赖缺失
"""
import argparse, csv, datetime, io, json, os, sys, urllib.request, urllib.error

try:
    from qcloud_cos import CosConfig, CosS3Client
    from qcloud_cos.cos_exception import CosServiceError
except ImportError:
    print("✗ 缺依赖：pip install cos-python-sdk-v5")
    sys.exit(2)

REGION = "ap-beijing"
KEYS = r"E:\MOV\安卓中国体系建设\运营中心\.secrets\SecretKey_COS子账号.csv"


def load_keys(path):
    rows = [r for r in csv.reader(io.open(path, encoding="utf-8-sig")) if r and r[0].strip()]
    rows = [r for r in rows if r[0].strip().lower() != "secretid"]
    if len(rows) < 2:
        raise SystemExit(f"✗ 密钥文件需两行（userdata/vault）：{path}")
    return [(rows[0][0].strip(), rows[0][1].strip()), (rows[1][0].strip(), rows[1][1].strip())]


def client(cred):
    return CosS3Client(CosConfig(Region=REGION, SecretId=cred[0], SecretKey=cred[1], Scheme="https"))



def anon_http(url):
    """裸 HTTP 无凭据请求（真匿名）→ (状态码, 说明)"""
    try:
        with urllib.request.urlopen(urllib.request.Request(url, method="GET"), timeout=12) as r:
            return r.status, "OK"
    except urllib.error.HTTPError as e:
        txt = e.read(240).decode("utf-8", "replace")
        code = "AccessDenied" if "AccessDenied" in txt else txt.split()[0][:60] if txt.split() else "HTTP-err"
        return e.code, code
    except Exception as e:  # noqa
        return -1, f"{type(e).__name__}:{str(e)[:60]}"


def code_of(fn, default="OK"):
    """执行并返回 (状态码, 说明)。COS 异常带 status_code；权限类多为 403。"""
    try:
        fn()
        return 200, default
    except CosServiceError as e:
        return e.get_status_code(), f"{e.get_error_code()}"
    except Exception as e:  # noqa
        return -1, f"{type(e).__name__}:{str(e)[:60]}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--region", default=REGION)
    ap.add_argument("--appid", default="1442545159")
    ap.add_argument("--ud", default=None)
    ap.add_argument("--vault", default=None)
    ap.add_argument("--keys", default=KEYS)
    a = ap.parse_args()
    ud = a.ud or f"mov-prod-userdata-{a.appid}"
    vault = a.vault or f"mov-prod-vault-{a.appid}"
    (ud_id, ud_key), (v_id, v_key) = load_keys(a.keys)
    cu, cv = client((ud_id, ud_key)), client((v_id, v_key))
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    tkey = f"tmp/cos-verify-{stamp}.txt"
    body = f"MOV cos-verify smoke {stamp}\n".encode()
    res = []

    def rec(name, expect, got, ok, note=""):
        res.append({"case": name, "expect": expect, "got": got, "ok": bool(ok), "note": note})
        print(f"{'PASS' if ok else 'FAIL'} | {name} | 期望 {expect} / 实得 {got} {note}")

    # 1 凭据有效（对**自己桶** HeadBucket）
    sc, cd = code_of(lambda: cu.head_bucket(Bucket=ud))
    rec("1 userdata 子账号·自桶 HeadBucket", 200, sc, sc == 200, cd)
    sc, cd = code_of(lambda: cv.head_bucket(Bucket=vault))
    rec("1b vault 子账号·自桶 HeadBucket", 200, sc, sc == 200, cd)

    # 1c 最小权限：ListBuckets（GetService）**应当被拒**
    sc, cd = code_of(lambda: cu.list_buckets())
    rec("1c 最小权限·ListBuckets 应被拒", "403", sc, sc == 403, cd)

    # 2 自桶冒烟：写/读/删
    sc, cd = code_of(lambda: cu.put_object(Bucket=ud, Key=tkey, Body=body))
    rec("2 自桶写入（tmp/）", 200, sc, sc == 200, cd)
    sc, cd = code_of(lambda: cu.get_object(Bucket=ud, Key=tkey))
    rec("2b 自桶读取", 200, sc, sc == 200, cd)
    sc, cd = code_of(lambda: cu.delete_object(Bucket=ud, Key=tkey))
    rec("2c 自桶删除", "200/204", sc, sc in (200, 204), cd)

    # 3 匿名取对象（裸 HTTP·无任何凭据）
    cu.put_object(Bucket=ud, Key=tkey, Body=body)
    sc, cd = anon_http(f"https://{ud}.cos.{REGION}.myqcloud.com/{tkey}")
    rec("3 匿名取对象被拒", 403, sc, sc == 403, cd)
    cu.delete_object(Bucket=ud, Key=tkey)

    # 4 防串：userdata 凭证写 vault 桶
    sc, cd = code_of(lambda: cu.put_object(Bucket=vault, Key=tkey, Body=body))
    rec("4 跨桶写入被拒（userdata→vault）", 403, sc, sc == 403, cd)

    # 5 防串：vault 凭证读 userdata 桶
    cu.put_object(Bucket=ud, Key=tkey, Body=body)
    sc, cd = code_of(lambda: cv.get_object(Bucket=ud, Key=tkey))
    rec("5 跨桶读取被拒（vault→userdata）", 403, sc, sc == 403, cd)
    cu.delete_object(Bucket=ud, Key=tkey)

    # 6 匿名列举被拒（禁公开 List）
    sc, cd = anon_http(f"https://{ud}.cos.{REGION}.myqcloud.com/?prefix=tmp/&max-keys=1")
    rec("6 匿名列举被拒", 403, sc, sc == 403, cd)

    ok = all(r["ok"] for r in res)
    rep = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"cos-verify-report-{stamp}.json")
    io.open(rep, "w", encoding="utf-8").write(json.dumps(
        {"at": stamp, "region": REGION, "buckets": {"userdata": ud, "vault": vault},
         "results": res, "ok": ok}, ensure_ascii=False, indent=2) + "\n")
    print(f"\n{'✅ 全部通过' if ok else '❌ 有用例未过'}（{sum(1 for r in res if r['ok'])}/{len(res)}）\n报告：{rep}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
