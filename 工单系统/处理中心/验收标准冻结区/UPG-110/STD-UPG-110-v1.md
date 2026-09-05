# STD-UPG-110-v1 验收标准冻结版

> 工单：UPG-110 ｜ 标题：官网容器面·批二 A 通道（MCP Streamable HTTP 活端点）｜ 本文件 = 验收「什么是合格」的**唯一正式冻结版**

---

## 头部（身份 + 完整性 · 冻结后不可改）

- **standard_id**: `STD-UPG-110-v1`
- **content_sha256**: `99b7888112d536e3a5f614060d5c1b555d6269cdf22981258178db4f59cb5c77`（= 冻结区正文哈希，非整文件哈希；按文末命令计算）
- **frozen_at**: `2026-09-05T10:50:00`
- **frozen_by**: 设计师
- **approved_by**: 审验员 ✅ 会签 @2026-09-05（证据链审验通过——STD 重算一致 99b78881/DEL manifest ok:True 交叉锚一致/生产端点独立 curl 复核+同源对账逐字段零差异）

---

## 冻结区（不可改 · 只读）

### 验收定级

| 定级 | 本单验收方式 | 验收要点 |
|---|---|---|
| L1 低 | 契约/单测 | tools/list 六工具与 capability-registry.json 同源一致（机器对账）；错误信封统一；验证戳字段在 |
| L2 中 | 生产端点实证 | 生产 URL 上 curl 实证：tools/list → 六工具；tools/call mov_site_info → 验证戳（registry_version+last_sync_time）；缓存头/限流头可见 |
| L3 高 | 安全面 | 只读（无写路径）；A 面零凭据/隐私泄露（响应体核查）；install_url 指向人操作界面 |

### 变异锚

| 锚点 | 变异动作 | 期望 |
|---|---|---|
| 同源锚 | 手改端点返回使某工具描述偏离 registry | 「六工具与 registry 同源」对账必红 |
| 验证戳锚 | 删 registry_version 字段 | 「验证戳在」断言必红 |
| 限流锚 | 移除 IP+UA 限流 | 「限流生效」用例必红 |

### 测试匹配档

| 项 | 期望 |
|---|---|
| 同源对账 | 端点 tools/list 输出 vs capability-registry.json 机器比对零差异 |
| 生产实证 | mov-ai.cn 上 curl 三连（list/call/错误路径）输出在档（含时间戳） |
| 缓存/UA | 响应头含 CDN 缓存 5min 口径；UA 约定文档化 |
| 诚实空态 | 市场 0 包时 market_catalog 返回诚实空态（与批一口径一致） |
| 部署 | systemd 服务+Caddy 挂载在案；重启窗口告知用户；回滚路径（关服务即下线） |

### 销项条件（下列全满足）

1. 三变异锚亲杀全红→还原复绿
2. 生产端点 curl 实证三连在档
3. 同源对账零差异 + 零凭据泄露核查
4. DEL 绑定+两表登记+部署记录（重启窗口/回滚）

---

## 追加说明区（任何人可加 · 不作为合格判定正向证据）

| 时间 | 作者 | 触发原因 | 说明 |
|---|---|---|---|
| 2026-09-05 | 设计师 | 立卡冻结 | 依据设计 v3 §4.5/4.6/§5 + 卡面批二行；溯源先例=market-web/scene-mcp/server.mjs（同形态） |

---

## content_sha256 生成方法（本段仅供校验 · 不属于冻结区）

```bash
python -c "import hashlib,sys; t=open(sys.argv[1],encoding='utf-8').read(); s=t.split('## 冻结区',1)[1].split('## 追加说明区',1)[0]; print(hashlib.sha256(s.encode()).hexdigest())" "STD-UPG-110-v1.md"
```
