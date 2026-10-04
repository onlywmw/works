import io

P = 'engine.mjs'
s = io.open(P, encoding='utf-8').read()
old = '''function latestSessionProbe(role, opts = {}) { // SYS-58 R3/R4：带来源标注 {t, src: own|seat|shared}
  const own = Math.max(piSessionMtime(role, opts), kimiSessionMtime(role, opts));
  if (own > 0) return { t: own, src: "own" };
  const seatMs = Math.max(hermesSeatMtime(role, opts), hermesDbSeatMtimes(opts)[role] || 0);
  if (seatMs > 0) return { t: seatMs, src: "seat" };
  // R3补遗②：共享兜底带原因（DB 读取失败 vs 无席级行=真静默），供闭环失败告警如实区分
  return { t: hermesSessionMtime(opts), src: "shared", why: hermesDbState.ok ? "无席级行（真静默）" : ("DB读取失败：" + hermesDbState.err) }; // 共享源兑底（粗粒度·调用方须降权）
}'''
assert old in s, 'probe anchor'
new = '''function latestSessionProbe(role, opts = {}) { // SYS-58 R3/R4：带来源标注 {t, src: own|seat|shared}
  // R3 修3（验收员 19:52 打回根因）：**取全源最大**，不再 own>0 早退短路——hermes 席的陈旧 pi mtime
  // 会压住鲜活的 state.db 源 → 回执闭环永远闭不了环（假『敲了没达』照旧）。
  const own = Math.max(piSessionMtime(role, opts), kimiSessionMtime(role, opts));
  const seatMs = Math.max(hermesSeatMtime(role, opts), hermesDbSeatMtimes(opts)[role] || 0);
  if (own > 0 && own >= seatMs) return { t: own, src: "own" };
  if (seatMs > 0) return { t: seatMs, src: "seat" };
  // R3补遗②：共享兜底带原因（DB 读取失败 vs 无席级行=真静默），供闭环失败告警如实区分
  return { t: hermesSessionMtime(opts), src: "shared", why: hermesDbState.ok ? "无席级行（真静默）" : ("DB读取失败：" + hermesDbState.err) }; // 共享源兑底（粗粒度·调用方须降权）
}'''
s = s.replace(old, new, 1)
io.open(P, 'w', encoding='utf-8').write(s)
print('probe max-over-sources patched (R3 rev)')
