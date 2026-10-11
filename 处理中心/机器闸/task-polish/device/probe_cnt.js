// 页内计数（不依赖外部读管道）：resolve {n, ids}
new Promise((resolve) => {
  const orig = window.__movResolve;
  window.__movResolve = (id, json) => { try { if (orig) orig(id, json); } catch (e) {}; if (id === 'cb') { try { const o = JSON.parse(String(json)); resolve({n: (o.tasks||[]).length, count: o.count}); } catch (e) { resolve('PARSE_FAIL'); } } };
  try { window.MovPageBridge.invoke('task.list', '{}', 'cb'); } catch (e) { resolve('THROW: ' + e); }
})
