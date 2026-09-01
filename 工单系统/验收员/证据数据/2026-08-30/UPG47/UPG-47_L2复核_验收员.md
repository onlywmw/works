# UPG-47 主页胶囊系统 —— 验收员 L2 复核记录（2026-08-30 22:2x）

验收对象：feat/capsule-system **cf3299e + 32ba01c**（报告写 767228c+32ba01c，远端实为 cf3299e+32ba01c —— P3 申报偏差）
基底：停靠 0aa0c07（绿基线，因 origin/main 4bfddd8 编译红 —— 见挂账复核）

## 一、L1 复核（独立复跑）

| 项 | 结果 |
|---|---|
| 全量（:app:testDebugUnitTest） | 63 套件 **456 / 0 / 0**（跳过 1）；报告称 462，差 6（口径 P3） |
| WorkbenchPinsTest | 9 / 0（默认种子 3 / 坏输入容错 / 非法跳过 / v1→v2 丢弃冗余 / 迁移幂等） |
| CapsuleResolverTest | 8 / 0（BUILTIN 静态表 / **注册表实读名称-包改名不影响** / 预设链 / 停用与不可达 / REMOVED 清理） |
| pin v2 契约核物 | ✅ CapsulePin 仅 stableId/pinType/preset 三字段（无 name/icon 冗余） |
| 变异亲杀 | ✅ **M1 硬编码名称 → 「注册表实读名称」FAILED**；✅ **M2 pin.preset 不优先 → 「内置包预设兜底仍生效」FAILED**；⚠️ 模型加 name 字段变异不红 —— 「无冗余字段」无显式断言锁（P3，建议补结构断言） |

## 二、L2 真机走查（新 APK assembleDebug；21770d7d）

| 场景 | 结果 |
|---|---|
| 首页三区 | ✅ 模型 chip「DeepSeek V4 Flash · 快速」+ MCP 聚合 + 钉选（≤5）+「＋」管理口 |
| 长按菜单 | ✅ 长按钉选 → 直达执行 / 详情 / 取消钉选 |
| 直达执行 | ✅ calendar.add（有预设）长按直达 → 走执行链 → 审批弹窗（大白话 30s/同意/拒绝/同类勾选） |
| 管理弹层 | ✅ 「主页胶囊管理 · 上限 n/5 · 可排序」；当前钉选行 ▲▼✕ + 「预设·改」；添加区「内置能力都已钉选」空态 |
| 排序 | ✅ ▲ 上移「我的记忆」→ 顺序 订单→记忆→信息 实时变 |
| 删除 | ✅ ✕ 删除 calendar.add → 3/5 实时变 |
| 添加（勾选即时） | ✅ 勾选 CheckBox「我的能力」→ 4/5；再勾 → **5/5** |
| 上限拦截 | ✅ 第 6 个勾选 → 仍 **5/5**（拒绝添加；toast 因 uiautomator 抓取局限未捕获，拦截行为实证） |
| 内置开页 | ✅ 点「我的记忆」钉 → 记忆管理页打开（BUILTIN 路由） |
| 重启保留 | ✅ force-stop 重启 → 5 钉 + 顺序（记忆第 2）持久化保留 |
| 预设回填 | ⚠️ 未直接点按验回填（交汇于既有直达执行链；「预设」chip +「预设·改」在场；代码分派 BUILTIN→开页/有预设→回填/无预设→输入面板清晰） |

程序员证据：设计师\检查证据/UPG47_2026-08-30/{cap1_dock,cap2_panel,cap3_menu,cap4_memory}.png 已核存 ✅

## 三、P0 挂账复核（挂账-upg47-main基线编译红）

**确认属实**：origin/main 4bfddd8 `:app:compileDebugKotlin` **FAILED**：
- MainActivity.kt:**6707 行 `<<<<<<< HEAD` 冲突标记残留**（UPG-18 merge 未清净）
- **Unresolved references**：MarkstreamView / destroyWebViewsIn / launchCamera
- 6103bb8 尾部冲突解决不完整

处置：UPG-47 停靠 0aa0c07 绿基线合理；建议设计师修复主基线（清理冲突标记 + 尸体引用）后 capsule rebase 合入。

## 四、结论

**通过**（待设计师修复 main 基线编译红后 rebase 合入；3 条 P3 观察：462 vs 456 口径 / hash 申报 767228c vs 远端 cf3299e / 「无冗余字段」无显式断言锁）
