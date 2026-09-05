/**
 * UPG-69 WebMCP 站点试点 · mow.kim 工单工作台工具注册表
 * 契约：docs/WEBMCP_PROTOCOL_v0.1.md（v0.1 冻结——UPG-43a 起草/两单共引）
 *
 * 挂载形态：window.mov_webApi = { version, tools } —— App 侧 WebMcpHub 白名单域（mow.kim）
 * onPageFinished 后 discover() 读取；调用经 window.__movWebMcp.call(name, argsJson) 回到页面 handler。
 *
 * 3 工具（W1/W5 对账锚——增删改名=ToolsSplit 对账锚红）：
 *   mov_openTicket  写类（write=true）→ App 侧 Gatekeeper 审批（WRITE_TOOLS 登记）
 *   mov_queryTicket 只读
 *   mov_listOrders  只读（数据源=tickets 池——试点统一：订单/工单同池，source 字段区分）
 *
 * 登录态：全部走页面已登录会话（localStorage mov_account_token——不绕过认证）。
 */
(function () {
  "use strict";

  var API = "https://mow.kim/account";

  function authHeaders() {
    var t = localStorage.getItem("mov_account_token") || "";
    return { "Content-Type": "application/json", "Authorization": "Bearer " + t };
  }

  async function apiFetch(method, path, body) {
    var opt = { method: method, headers: authHeaders() };
    if (body) opt.body = JSON.stringify(body);
    var r = await fetch(API + path, opt);
    var j = await r.json().catch(function () { return { ok: false, error: "bad json" }; });
    if (!j.ok) throw new Error(j.error || ("HTTP " + r.status));
    return j;
  }

  function orderRow(t) {
    return { ticketId: "T" + t.id, title: t.title, status: t.status, source: t.source || "", createdAt: t.created_at };
  }

  window.mov_webApi = {
    version: "0.1",
    tools: {
      mov_openTicket: {
        name: "mov_openTicket",
        description: "开工单（标题/描述/来源）",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "单标题" },
            description: { type: "string", description: "问题描述" },
            source: { type: "string", description: "来源站/渠道" }
          },
          required: ["title"]
        },
        write: true,
        handler: function (args) {
          return apiFetch("POST", "/tickets", {
            title: String(args.title || "").trim(),
            description: String(args.description || "").trim(),
            source: String(args.source || "mow.kim").trim()
          }).then(function (j) {
            return { ticketId: "T" + j.id, title: j.title, status: j.status };
          });
        }
      },
      mov_queryTicket: {
        name: "mov_queryTicket",
        description: "查单（单号/状态/进度）",
        inputSchema: {
          type: "object",
          properties: { ticketId: { type: "string", description: "单号（如 T1）" } },
          required: ["ticketId"]
        },
        write: false,
        handler: function (args) {
          var id = String(args.ticketId || "").replace(/^T/i, "");
          return apiFetch("GET", "/ticket?id=" + encodeURIComponent(id)).then(function (j) {
            return { ticketId: "T" + j.ticket.id, title: j.ticket.title, description: j.ticket.description, status: j.ticket.status, source: j.ticket.source, createdAt: j.ticket.created_at };
          });
        }
      },
      mov_listOrders: {
        name: "mov_listOrders",
        description: "订单列表（最新 N 条）",
        inputSchema: {
          type: "object",
          properties: { limit: { type: "number", description: "条数（默认 10）" } },
          required: []
        },
        write: false,
        handler: function (args) {
          var n = Math.min(Math.max(parseInt(args.limit, 10) || 10, 1), 50);
          return apiFetch("GET", "/tickets?limit=" + n).then(function (j) {
            return { orders: (j.tickets || []).map(orderRow) };
          });
        }
      }
    }
  };
})();
