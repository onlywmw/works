# 看板「回炉」按钮功能失效——问题说明（送大神评审 · 2026-09-02）

**状态**：📤 送审（用户已验证仍失败——请大神指点）
**问题**：工单看板每行「🔁 回炉」按钮——确认框正常弹出，**点确定后 `Failed to fetch`**（状态不改）。

---

## 一、功能是什么

工单看板（本地单页 + 本地 Node 服务）加了一个「回炉」操作：

```
用户点「🔁 回炉」按钮
  → confirm（已正常弹出）
  → fetch POST http://127.0.0.1:8787/api/reject  {no: "UPG-xx"}
  → 服务端改 工单库.md 状态区（写入【看板回炉】标记）
  → 服务端跑 node 审验员/sync-orders.mjs --sync（库→表 同步）
  → 前端 location.reload() 展示新状态（施工·回炉）
```

---

## 二、当前部署形态（关键）

| 项 | 值 |
|---|---|
| 看板页面 | `处理中心/验证产物/orders-overview.html`（**用户习惯双击 = file:// 打开**） |
| 本地服务 | `board-server.mjs` @ `http://127.0.0.1:8787`（默认只绑 127.0.0.1） |
| 请求 | 浏览器 `file://` 页面 → `http://127.0.0.1:8787`（**跨源**） |

---

## 三、已修复项（按顺序做过的，仍未解决）

1. **相对路径 → 绝对地址**：`fetch("http://127.0.0.1:8787/api/reject")`（原来 `/api/reject`，file:// 下会打空气）
2. **CORS 头补齐**（board-server 全响应加）：
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type`
   - `Access-Control-Allow-Private-Network: true`（Chrome/Edge PNA 预检要求——怀疑点）
3. **OPTIONS 预检**：`req.method === "OPTIONS"` → 204 返回（含上述头）
4. **库卡插入偏移**：`**状态**：` 6 字符（曾按 5 插入导致标记错位——已修）

---

## 四、服务端实证（curl 直测全部通过）

```
OPTIONS /api/reject  →  204
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type
  Access-Control-Allow-Private-Network: true

POST /api/reject {"no":"UPG-19"}  →  {"ok":true,"msg":"回炉已登记"}
  → 工单库.md 出现【看板回炉】标记 ✓
  → sync-orders --sync → CHECK_OK ✓
  → 看板重生成后 E4 判该卡 stage=delivering/rejected ✓
```

**即：服务端链路完整可用**——但浏览器（用户环境）点击仍失败。

---

## 五、疑点与初步判断（请大神重点看）

1. **file:// 页面 → http://127.0.0.1 的浏览器限制**
   - PNA（Private Network Access）头已加仍失败——**是否还有遗漏头/混合内容限制？**（Edge/Chrome 版本差异？）
   - 已知 Chrome 对 `file://` 页面（origin=null）发起的跨源请求策略较严——**CORS 头之外是否还有限制？**
2. **用户浏览器版本/策略未知**——未拿到 F12 控制台原文（仅用户口述「Failed to fetch」）
3. **排查方向质疑**：本地工具是否**不该用 file:// 打开**——是否应统一改「双击=启动服务+打开 http://127.0.0.1:8787」（同源零 CORS 问题），**file:// 仅作兜底只读预览**？

---

## 六、请大神裁决/给方案

1. 服务器端还需补哪些响应头（或其它机制）能让 file:// 页面成功 POST？
2. 或者确认方案：**取消 file:// 写路径，看板入口一律走本地服务页**（http://127.0.0.1:8787，双击 bat 自动拉起+打开）——file:// 仅只读？
3. 有无更简做法（如 form 提交/隐式 window.name 通道/iframe postMessage 中转）规避 CORS/PNA？

---

*收到大神意见后更新 v2 / 定案实施。*
