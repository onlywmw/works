# DELIVERY_UPG08 — mow.kim 工作台落地（Stitch 框架工程化）

> 程序员 C ｜ 2026-08-26 ｜ 分支 `feat/upg08` ｜ 提交 `f4f929d`（含基底 `505e4e3`）｜ 基点 main `790cd75`
> 已登记两个表：工单表.xlsx 第 9 行（程序员 ✅C 完成 + 备注 hash）+ 工单库.md UPG-08 状态「程序员✅完成，待验收」

---

## 交付内容

| 文件 | 说明 |
|---|---|
| `workbench-web/index.html` | 单页两栏骨架（侧栏 260px/34px 行、暖白底 + Inter + 品牌蓝、移动端抽屉） |
| `workbench-web/app.js` | 单页应用：hash 路由（#/overview、#/<板块key>）、树 7+15 全量渲染、JSON 驱动（fetch workbench.json，失败回落 SAMPLE 不白屏）、状态灯现算（blocked/待审 → 红点叶子→维度冒泡）、账号门禁（/account 验证码登录，接现有 account-service，不造账号体系） |
| `workbench-web/tools/verify-workbench.mjs` | L1 校验脚本（node，无依赖）：树 7+15 全量、禁加元素零命中、中文残留零、JSON 容错守卫 |
| `workbench-web/sync-workbench.mjs` | 同步脚本：工单表.xlsx（openpyxl 同款 xlsx 库）+ 挂账登记表.md + ACCEPTANCE_LOG.md + dims/*.md → workbench.json（含敏感词 scrub）→ `--deploy` scp 内测目录 |
| `workbench-web/workbench.json` | 真实同步产物（生成时 6826B；本地 data 有真实 8 条工单） |
| `workbench-web/reference/` | Stitch 三屏 + DESIGN_v2 副本（素材留档，画面走查对照用） |

## 设计对齐（走查 6 项差距全部闭环）

1. **三屏合并单页**：hash 路由；侧栏树按 §三 全量（7 一级 + 15 二级），mow_2/3 占位树替换
2. **禁加元素**：Create New Ticket / 铃铛 / Settings / Help 全部零命中（L1 断言）
3. **英文残留**：Active Work Items / View All / Syncing… 等零命中（L1 断言）
4. **JSON 驱动**：fetch workbench.json + 状态灯现算 + 红点上卷 + 断 JSON 回落 SAMPLE 不白屏（L1 断言 + 实测）
5. **同步脚本**：工单表.xlsx → 状态推导（按 ✅ 列归属阶段）→ workbench.json → scp 部署
6. **账号门禁 + 内测部署**：接 account-service（/account/send-code + /account/login）；仅上 **https://mow.kim/wb/** 内测子路径，未碰 mow.kim 市场现站与主域（主域切换归 mov-ai.cn 迁移线）

## 验收证据

- **L1**（全量绿 + 变异亲杀）：
  - `node tools/verify-workbench.mjs` 通过（树 7+15 / 禁加元素 0 / 中文 0 / JSON 容错在）
  - 变异 1：删 `'app-backlog'` 节点 → ✗ 缺少树节点 key（红）
  - 变异 2：注入禁加元素 bell → ✗ 命中（红）
  - 恢复 → 通过（绿）
- **L2**（真实浏览器 + 部署地址）：
  - 桌面登录前：验证码登录面板截图 ✓（OCR 见「MOV工作台 / 手机验证码登录」）
  - 375px 手机：未登录面板 + 登录后工单流转页（步进器横滑、无横向滚动）截图 ✓
  - 登录态桌面：https://mow.kim/wb/ 树全量一屏可见（OCR：总览/App建设 8在制/能力市场/品牌/营销推广/服务器基建/工单流转/挂账与问题/验收记录）✓
- **L3**（端到端）：工单表.xlsx UPG-08 行改状态（程序员 ✅C 完成 + 验收中）→ `node sync-workbench.mjs --deploy` → 网站「工单流转」页流水线/状态可见变化（截图 L3_同步后_工单流转.png）；演示数据已还原（验收员列清空）
- **账号闭环**：17679332556 完成注册（id=4，密码 Mov@2026）+ 验证码登录成功（workbench 渲染真实数据）

## 红线核对

- 只读：无任何新建/编辑/拖拽写操作（仅 JSON 展现）
- 视觉：Stitch 骨架 + DESIGN_v2 token（圆角 8/16px、暖白底、Inter、品牌蓝 primary #3B6EEB），未回归 24px
- 不做清单：三级树/图表报表/通知协作/暗色模式 一律未加
- 不碰市场现站：仅 /wb/ 子路径新增，market-web 与主域未动
- 数据脱敏：sync 含敏感词 scrub（password/密钥/token/手机号段清理），workbench.json 无凭证明文
- 登录门禁：接现有 account-service（注册/登录均由该服务处理），未自造账号体系

## 遗留说明

- dims/*.md（市场/品牌/营销/基建四维轻量表）设计师尚未产出，同步脚本按约定解析该路径，缺档输出空态（前端正常渲染空态，不白屏）——设计师补表后旧脚本即自动收敛为真实数据
- workbench.json 为同步产物（gitignore 建议），引用项目部署时以 `node sync-workbench.mjs --deploy` 为准
