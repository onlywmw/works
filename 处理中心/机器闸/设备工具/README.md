# 设备工具（SYS-187 收口 · 2026-10-06）

> 本目录 = 设备工具**唯一取用源**（此前只散落于各单证据目录副本）；存量副本**豁免**不追改；此后新单从此取用。

## 件

| 件 | 用途 |
|---|---|
| `call_tool.sh <wsUrl> <tool> <argsJson> [timeoutMs]` | 设备工具调用（回吐管道 `cdp_call.js \| redact.mjs`；脚本自定位·任意 cwd 可跑） |
| `cdp_call.js <wsUrl> <jsExprFile> [timeoutMs]` | CDP 调用器（目标 WebView 执行 JS 并打印 JSON；自证据副本原样搬入） |
| `redact.mjs [--raw-out <文件>]` | 送模型回吐脱敏过滤器（stdin→stdout·两层掩码·fail-closed） |

## 纪律三条

1. **回吐走脱敏·原文只落本地**：设备工具回吐一律经 `call_tool.sh` 内建管道脱敏；原文只落本地 raw 文件（`--raw-out` 或 `%TEMP%\redact-raw\`），掩码版才进模型/证据。
2. **凭据类界面截图不进模型**：保险柜/银行卡/密码等凭据类界面截图**只存证据目录**即可，不送模型。
3. **设备工具从此取用**：新单设备工具一律从本目录取；存量证据目录副本豁免不追改（零回归面）。

## redact.mjs 行为

- **两层掩码**：键名层（JSON 与 `key=value` repr：`idNo`/`licenseNo`/`bankAccount`/`contactMobile`/`contactEmail`/`address`/`password`/`token`/`secret` 等）＋值模式层兜底（18 位证件号/统一社会信用代码/16–19 位卡号/手机号/邮箱/`sk-` 类/Bearer）。
- **掩码形态**：保留首 2 末 2（不足 4 位全掩）；邮箱保留域名（`***@example.com`）。
- **原文去向**：只落本地文件（缺省 `%TEMP%\redact-raw\`）；stderr 一行 `[redact] raw=<路径> masked=<n>`（对账）。
- **开关**：默认开；`MOV_MASK=off` 显式关（stderr 警示·留痕）——调试逃生口。
- **fail-closed**：过滤器异常（含 raw 落盘失败）⇒ 非零退出且不输出未掩码原文。
- **自测**：`node --test 处理中心/机器闸/设备工具/redact.test.mjs`（正例逐类被掩＋负例零误伤＋CLI 行为）。
