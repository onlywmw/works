# AI Key 使用指引（脱敏 · 2026-08-18）

> **API Key 已保管在 `MOV运营中心\.secrets\env.local`（0600 权限）**，本指引说明如何用它配置 MOV 真机（解锁 AI 会话 → 补端到端验收）。
> ⚠️ **脱敏纪律**：key 明文只在 `.secrets\env.local`，不写入工单/日志/仓库/对话；`git grep sk-` 零命中。

## 一、key 位置
```
MOV运营中心\.secrets\env.local     ← DEEPSEEK_API_KEY=<值>（0600）
```

## 二、配置 MOV 真机（验收员）
MOV 走 **ModelRegistry 凭据引用式**（r85 已合，key 值入 CredentialStore 0600 文件 + 引用名）：
1. 从 `.secrets\env.local` 读 key（或用户在真机设置页配置）
2. 走 `addModel`/设置页 → key 存入 MOV 凭据存储（引用名，非明文）
3. 验证：AI 会话可用（journal 有 tool_call + 回复）

## 三、解锁的验收项（AI 会话恢复后）
| 项 | 依赖 |
|---|---|
| r62/qr、r64/audio 端到端 | AI key（端到端曾被 AI 幻觉阻塞） |
| r76/77/79/81 端到端 | AI key |
| 委派系列（r42/67） | AI key + 服务面 |

## 四、红线
- key 不落明文（除 .secrets\env.local）
- 配置后验证 AI 会话（journal tool_call 实锤）
- 用完不回显 key

## 更正（2026-08-18 验收员反馈）
- **key 实际位置**：`MOV运营中心\.secrets\env.local`（不是根目录 `.secrets`）
- 验收员请从该位置读 key（DEEPSEEK_API_KEY），配置 MOV 真机
- 其他 .env（lanzhou-night/werewolf-ai）的 key 经查 401 无效，勿用
