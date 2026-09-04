# UPG-102 派单：MainActivity 拆分·批③ 页面桥面搬移（→ pages/ 模块）

> **派单时间**：2026-09-04 ｜ **派单人**：设计师B ｜ **优先级**：P1（拆分主线·批③/共 8 批）
> **验收标准**：`STD-UPG-102-v1`（content_sha256 见冻结区文件）
> **施工口径**：拆分计划书 v1.2（`方案设计\MainActivity拆分计划书_v1.2_2026-09-03.md`）+ 蓝图（`MainActivity拆分蓝图_v1.md` §二 区域图）+ 批①先例（UPG-93 @3315bff0）+ 批②先例（UPG-98 @d11509cc 已合——形态/锚法/锚定面迁移纪律照抄）
> **串行纪律**：拆分各批同面 MainActivity——一批一派、合后再基；本批行号已按 main 顶 d11509cc（5929 行）重核

---

## 一、一句话

页面桥面（browserHandlers 注册块 + WebMcpHub.mountCallback 挂载回调）从 MainActivity 搬入 `pages/` 模块——纯搬移零逻辑改动，棘轮军规下 MainActivity 继续只出不进。

## 二、范围（行号=main@d11509cc 重核实测）

1. **搬移两块**：
   - `browserHandlers` 注册块（`MainActivity.kt:2332-2515`，browser.open/snapshot/click/fill/scroll/waitFor/detectForms/waitUser/fillForm/login/extract/markdown/back/forward 14 个 handler）→ `pages/` 模块顶层扩展（形态照批②：receiver=MainActivity，零新增 Activity 持有）。
   - `WebMcpHub.mountCallback` 挂载回调块（`:2517-2557`，web.* 工具页面挂载）→ 同上。
2. **留壳不搬**（装配点红线）：PagesBridge 装配段（`:1921-1938` 白名单实例化）、`pageToolProvider` 声明/赋值（`:49`/`:594`）、`browserHandlers` 声明（`:359`，批②已 internal）。壳内只留装配点一行调用。
3. **保真**：搬移块归一化 sha256 前后全等（批②锚法照抄：冻结 manifest 资源 + recon 对账）。
4. **internal 提升清单**：确有必要才提升，逐条记入交付报告（只增不滥）；批②教训——**提升范围含可见性口径自查**（拆前 private→拆后顶层扩展默认 public 的 3 函数事故不再犯：本批所有搬出函数一律显式 `internal fun MainActivity.`）。
5. **债务清单联动**：蓝图已知债「asset.peekPhoto/asset.credPeek 块内直呼注册表转调 vault.*（页面桥→vault 面耦合）」只记录不修（红线 11）。
6. **测试**：常驻契约锚（PagesSplitContractTest 照 MarketSplitContractTest 模式：名单/保真/唯一写点/直呼接线/军规8）+ 既有锚定面迁移（凡源码锚读 MainActivity 且涉及本批搬移段的测试一律迁移适配，**全量 0 失败才可交付**——批② 9 失败 6 类教训）+ 冷启动锚 + 真机冒烟。

## 三、红线（违反=打回）

1. **纯搬移零逻辑改动**——优化/顺手修另立单。
2. MainActivity 纯 CRLF；搬出后壳内只留装配点一行调用。
3. 军规 7/8 运行中：零新增壳内代码（装配点除外+豁免注记）；pages/ 模块零 Activity 长期持有。
4. 零行为变化三层证据：保真锚（全等）+ 契约/直呼测试（拆前绿→搬移→拆后绿）+ 真机冒烟。
5. Token/KV 两节必报（browser.* 注册链路若触及 tools 字段面须申报，预期 0/0——browserHandlers 不经 MCP tools 字段，走页面桥）。
6. **提交版=验证版**（批② §P51b 教训）：交付前全新检出（或 clean worktree）复跑编译+全量，不许「工作区对但提交版错」。
7. **锚定面迁移必须收口**：全量 0 失败=硬门槛；锚迁移逐条注释「UPG-102 锚定面迁移」注记（批② d11509cc 先例）。

## 四、测试与真机（STD-UPG-102-v1）

- 3 变异锚亲杀（保真=块内改一行必红 / 名单=多挂或漏搬必红 / 唯一写点=壳内伪搬移必红）+ 全量 0 失败基线绿（/1 口径）+ assembleDebug 绿。
- 冷启动锚：拆前后各 5 次采样取中位，Δ>10% 标红须解释。
- 真机冒烟：①侧边栏打开（PagesBridge 白名单链路）②browser.* 直呼一条（经 8389 MCP 面或页面触发）③web.* 页面挂载（打开网页页后 web.* 工具入面）——logcat/截图留证。

## 五、交付与登记

报告落 `程序员\交付报告\DELIVERY_UPG102_<日期>.md`（保真锚全等清单+3 亲杀+冷启动双侧+真机冒烟+internal 提升清单+锚迁移清单+Token/KV 两节+「已登记两个表」）；库加交付块 → sync 投影；verify-hash（红线 23）+ manifest **deliver-gen 机制产出**（standard_id 内嵌 content_sha256 交叉校验格式——UPG-98 交付先例）；DEL 绑分支头（分支头推进=重绑）。批④（chips/胶囊）待本批合 main 后再派（接口须过 UPG-89 负责人评审——计划书 v1.2 既定）。
