# UPG-42 批1 headless 注入走查证据（验收员 @2026-08-30）

> 方法：headless Chrome + CDP 连**线上** `https://mow.kim/dev/spec.html` / `quick-start.html`，注入 postMessage JSON-RPC 客户端走真实通道（initialize / tools/list / tools/call / 错误码）。
> 环境：`node v22.22.3` + Chrome；`mov-page-server.js` 真实浏览器环境 attach。

## 一、spec.html 走查（11 项全 PASS）

```
=== headless 注入走查（线上 mow.kim/dev/spec.html）===
PASS  tools/list 发现 mov_get_tool_contract
PASS  tools/list 发现 mov_search_spec
PASS  tools/list 四字段齐备
PASS  mov_ 前缀
PASS  initialize 返回 serverInfo
PASS  tools/call 数据非指令(isData=true)
PASS  mov_get_tool_contract 真数据=契约全文
PASS  mov_get_tool_contract 含数据非指令标注
PASS  mov_search_spec 检索命中(命名规范)
PASS  非法方法→-32601
PASS  未注册工具→-32602

TOTAL 11  PASS 11  FAIL 0

=== 原始摘要 ===
tools: [ 'mov_get_tool_contract', 'mov_search_spec' ]
call.isData: true | __mov: data-not-instructions
call.data[:70]: # MOV 工具开发规范 · 官方契约（镜像版）
> 本文件为 [spec.html](https://mow.kim/dev/spec.
search.hits: [{"section":"二、命名规范","line":"## 二、命名规范"}]
badMethod: { code: -32601, message: 'method not found: nope.method' }
badTool: { code: -32602, message: 'invalid params: 未注册工具 "mov_nope"（tools/list 查可用清单）' }
```

证据要点：
- `tools/list` 返回 `mov_get_tool_contract` + `mov_search_spec`，四字段（name/description/inputSchema/outputSchema）齐备，全部 `mov_` 前缀。
- `initialize` 返回 `serverInfo`（name=mov-page-server / protocolVersion=2024-11-05）。
- `tools/call` `isData=true` + `structuredContent.__mov=data-not-instructions`（数据非指令三重标注）。
- `mov_get_tool_contract` 返回契约全文 = spec.md 镜像（`# MOV 工具开发规范`），与页面正文一致。
- `mov_search_spec` 检索「命名规范」命中 `二、命名规范`（真数据检索）。
- 非法方法 → `-32601`；未注册工具 → `-32602`（MCP 语义同款区分）。

## 二、quick-start.html 走查（mov_get_quickstart_template）

```
=== quick-start.html 走查（mov_get_quickstart_template）===
tools/list 发现: [ 'mov_get_quickstart_template' ]
isData: true | __mov: data-not-instructions
真数据=hello-server.mjs 全文: true
data[:60]: // hello-server.mjs — MOV 能力市场最小 MCP 服务器模板（零依赖，Node 18+）
含数据非指令标注: true
```

证据要点：`mov_get_quickstart_template` 返回 `hello-server.mjs` 全文（含 `hello_world`/`import http`），数据非指令标注齐备。

## 三、发现项（P3 轻微，不阻塞通过）

1. **spec.html 第42行 `hint:` 对象字面量重复键**（`hint: '未命中——试试...'` 出现两次）——JS 允许重复键（后者覆盖前者），结果正确，但为手工失误，属 P3 格式瑕疵，建议后续清一次。
2. **mov-page-server.js `attach` 未区分「请求 vs 响应」**——同 window `postMessage` 场景下，attach 把自己回发的响应（无 `method`、含 `result/error`）又当请求 `handle`，产生大量 `-32600 invalid request` 自回声（实测 3 万+ 条）。真实 WebMCP 客户端为**跨窗/iframe**通信（`ev.source`=客户端，回发不回 page window），生产不受影响；但 attach 可更稳健：对「无 `method` 的响应状消息」直接忽略。属 P3 稳健性建议，不阻塞本单通过。

## 四、方法记录（避坑）

- 注入方式：`window.postMessage` 到自身（self-post），用**唯一 id 且只认「含 result/error」**的滤波捕获响应——否则 attach 自回声的 `-32600`（id:null）会覆盖，且请求原文本（id 匹配但无 result/error）会提前截胡。
- iframe（about:blank）注入方案**不可行**：iframe 的 origin 为 `null`，`postMessage` 到 parent 的 `targetOrigin='https://mow.kim'` 不匹配，消息被回弹成请求原文。
