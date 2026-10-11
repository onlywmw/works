// SYS-204 A#16：只读指定容器（白名单）+ 常见敏感形态脱敏（防整页正文外带敏感信息）
(function () {
  var el = document.querySelector('[data-room-text], #room-text, .room-text') || document.body;
  var t = String(el.innerText || "").slice(-1200);
  t = t.replace(/(sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+|(?:\d[ -]?){11,}\d|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, "[REDACTED]");
  return JSON.stringify({ t: t });
})()
