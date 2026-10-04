import io, re

P = 'engine.mjs'
s = io.open(P, encoding='utf-8').read()

# 1) 回执闭环关闭条件：改用探针时间（含 hermes 席/DB 源）——设计师 R3 修3
old = 'if (sessionMtime(role) > ack.at && sessionProbe(role).src !== "shared") delete ringAck[role]; // R4：共享源不当席级到账证据（两hermes互洗白修）'
new = 'if (sessionProbe(role).t > ack.at && sessionProbe(role).src !== "shared") delete ringAck[role]; // R3修3/R4：以探针时间为准（含 hermes 席/DB 源；共享源不当席级到账证据）'
assert old in s, 'ack close anchor'
s = s.replace(old, new, 1)

# 2) 榜面 note 订正（R2 起 hermes 已归席）
old_note = '"note": "pi 按会话 cwd 判席（仅工位会话）；kimi 按 wd 目录名尽力归席；hermes 表无 cwd → 仅全局",'
new_note = '"note": "pi 按会话 cwd 判席（锚本体系工位）；kimi 按 wd 目录名归席（含体系标记）；hermes 经 sessions.cwd join 归席（无 cwd 行 → 全局）",'
assert old_note in s, 'note anchor'
s = s.replace(old_note, new_note, 1)

# 3) DB 读状态留痕：区分『取不到』与『真静默』
old_fn = '''  } catch (e) { fault("hermesDbSeatMtimes", e); }
  if (!opts.hermesDb) { hermesDbAt = now; hermesDbBySeat = out; }
  return out;
}'''
new_fn = '''    hermesDbState = { ok: true, at: now, err: "" };
  } catch (e) { fault("hermesDbSeatMtimes", e); hermesDbState = { ok: false, at: now, err: String(e.message || e).slice(0, 120) }; }
  if (!opts.hermesDb) { hermesDbAt = now; hermesDbBySeat = out; }
  return out;
}
let hermesDbState = { ok: true, at: 0, err: "" }; // R3补遗②：DB 读状态（『取不到』≠『真静默』——告警文案据此区分）'''
assert old_fn in s, 'db state anchor'
s = s.replace(old_fn, new_fn, 1)

old_shared = '''  return { t: hermesSessionMtime(opts), src: "shared" }; // 共享源兑底（粗粒度·调用方须降权）'''
new_shared = '''  // R3补遗②：共享兜底带原因（DB 读取失败 vs 无席级行=真静默），供闭环失败告警如实区分
  return { t: hermesSessionMtime(opts), src: "shared", why: hermesDbState.ok ? "无席级行（真静默）" : ("DB读取失败：" + hermesDbState.err) };'''
assert old_shared in s, 'shared anchor'
s = s.replace(old_shared, new_shared, 1)

# 4) 闭环失败告警带探针原因
old_alert = '''            const msg = `${role} 铃注入后补回车仍无写盘（敲了没达·席位通道）：箱内待办未消化——请核查巡铃注入/席位会话`;'''
new_alert = '''            const prWhy = (() => { try { return sessionProbe(role).why || ""; } catch { return ""; } })();
            const msg = `${role} 铃注入后补回车仍无写盘（敲了没达·席位通道）：箱内待办未消化——请核查巡铃注入/席位会话` + (prWhy ? `（探针：${prWhy}）` : "");'''
assert old_alert in s, 'alert anchor'
s = s.replace(old_alert, new_alert, 1)

# 5) SYS-89 尾件：下线日志带 _offline 留痕（若开关文件带该字段）
old_log = '''    if (!opts.noLog) try { fs.appendFileSync(path.join(HERE, "巡铃.log"), `[${new Date().toLocaleTimeString("sv-SE")}] 疯狗 已下线（哨兵开关.json: 疯狗=false）·本轮跳过\\n`); } catch {}'''
new_log = '''    if (!opts.noLog) try {
      let off = "";
      try { const swj = opts.switchFile ? JSON.parse(fs.readFileSync(opts.switchFile, "utf-8")) : JSON.parse(fs.readFileSync(SENTINEL_SWITCH_FILE, "utf-8")); const o = swj._offline; if (o) off = `（下线留痕：by=${o.by || "-"} at=${o.at || "-"} why=${o.why || "-"}）`; } catch {}
      fs.appendFileSync(path.join(HERE, "巡铃.log"), `[${new Date().toLocaleTimeString("sv-SE")}] 疯狗 已下线（哨兵开关.json: 疯狗=false）·本轮跳过${off}\\n`);
    } catch {}'''
assert old_log in s, 'offline log anchor'
s = s.replace(old_log, new_log, 1)

io.open(P, 'w', encoding='utf-8').write(s)
print('R3 三修 + 补遗 + 尾件 patched')
