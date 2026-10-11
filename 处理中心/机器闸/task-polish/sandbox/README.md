# 打磨环沙盒（POL-4）· 运行环境隔离落地件

> spec：task-polish「运行环境隔离（沙盒）」（D8）——每轮跑批：独立服务实例＋独立 DB＋专用模拟器＋**双端版本钉扎**＋夹具只碰沙盒。
> 纪律：**只动本地沙盒**；mov-web 仓只读 pin（`git archive` 导出·不建 worktree）；**mow.kim 生产面零触碰**（部署/DB/域名/env）；真机不占（专用 AVD）。

## 一、组成（单机本地）

| 件 | 端点/落点 | 说明 |
|---|---|---|
| **a2a 沙盒实例** | `http://127.0.0.1:8180`（模拟器：`10.0.2.2:8180`） | mov-web **pin `0444adc`** 只读导出 → `E:/mov工作区/pol4-sandbox/server`；uvicorn `server:app` |
| **partner 后端桩** | `127.0.0.1:8392` | `task-polish/partner-stub.mjs`：`GET /partner/applyment/*` 返回注入态；其余转发沙盒 a2a；`POST /__inject` 注入 |
| **沙盒 DB** | `E:/mov工作区/pol4-sandbox/data/a2a.db` | 独立库（重置即 `reset`）——**与生产库无任何连接** |
| **env** | `E:/mov工作区/pol4-sandbox/a2a.env`（**仓外**） | 随机盐＋`SMS_MOCK=1`/`PAY_MOCK=1`/`REALNAME_PROVIDER=manual`；`PARTNER_BASE_URL`→本地桩；LLM 上游键由操作者填 |
| **模拟器** | AVD `MOV_Test`（headless·快照 `pol4-baseline`） | `adb reverse tcp:8180` 或 `10.0.2.2:8180` 达沙盒 |

## 二、命令（全部 cwd 任意）

```bash
# 服务实例
node 处理中心/机器闸/task-polish/sandbox/sandbox.mjs provision|start|stop|reset|status
#   首次：provision（导出 pin＋铺 env 模板）→ 操作者填 LLM 上游键 → start
#   reset＝停→清数据面（DB/上传）→起（每轮归零）

# 专用模拟器（不占真机）
node 处理中心/机器闸/task-polish/sandbox/avd.mjs boot|snapshot <名>|restore <名>|reset|status|stop

# 夹具（默认＝沙盒档；--prod 才走 mow.kim 原路径）
node 处理中心/机器闸/task-polish/审核注入.mjs show|prep|pass|reject|row-reset|restore

# App 沙盒包（产品仓 worktree）
cd E:/mov工作区/mov-pol4 && ./gradlew :app:assembleDebug -Pmov.sandbox.base=http://10.0.2.2:8180
# （默认不带属性＝生产包·零回归）

# 收编自证（游离 base 黑名单）
node 处理中心/机器闸/task-polish/sandbox/base-blacklist-scan.mjs --repo <app worktree 根>
```

## 三、版本钉扎与轮次快照协议（每轮四元）

**每轮跑批 MUST 记录四元钉扎**（写入轮次报告/证据包）：

| # | 元 | 取值来源 |
|---|---|---|
| 1 | **app sha** | APK versionName 内嵌短 SHA（`V1.1-<sha>+…`；沙盒包另含构建属性指纹） |
| 2 | **server sha** | 沙盒 pin：`sandbox.mjs status` 的 `pin=`（＝`sandbox.config.json.serverPin`） |
| 3 | **DB 快照 id** | 轮前 `reset`（DB 归零）或 rdb 快照文件名+sha（数据面归零读数为准） |
| 4 | **AVD 快照 id** | `avd.mjs snapshot <轮次名>` 存/恢复；基线名 `pol4-baseline` |

**升级只进沙盒**：新 server pin ⇒ 改 `sandbox.config.json.serverPin` → `provision`（重导出）→ `reset` → 跑批；生产部署与其解耦（生产照实际发布走）。App 升级同理：新 worktree sha 构沙盒包；不动生产包。

## 四、夹具隔离（spec 条款落点）

- **audit 注入**：默认档＝沙盒（stub `/__inject` 的 probe 态＋沙盒库 `wxpay_applyments` 行态直改）；`--prod` 才走 mow.kim 服务端 `window_switch.py`（原路径保留）。
- **partner 桩**：默认目标＝沙盒 a2a（`sandbox.config.json`）；转发生产须显式 `--target https://mow.kim`。
- **生产零新增测试行**：沙盒夹具不连生产库/服务 ⇒ 对照读数＝生产 `wxpay_applyment_events` 无夹具 action 行（跑前后计数一致）。

## 五、边界与已知限度

- **红线**：本件只写本地沙盒根（`E:/mov工作区/pol4-sandbox`）＋体系仓 `task-polish/sandbox/**`；mov-web 仓只读 pin；mow.kim 零触碰。
- 已知限度（ponytail）：①沙盒 LLM 上游键需操作者填（`a2a.env`·仓外）——不填则 `/llm/*` 503 属预期；②AVD 为 arm/x86 通用镜像（与真机厂商差异在真机回评环节覆盖，spec「沙盒≠真机」条款）；③`node:sqlite` 为 Node 实验 API（夹具直改库用·换 Node 主版本需回看）。
- **验证/复核命令纪律**（2026-10-06 卫生校准）：产出重定向禁以清单名落 cwd（如 `EVIDENCE_SHA256SUMS.txt`）——一律绝对路径或 `--report-path`；cwd＝体系根时尤禁（防 0B 残影污染）。
