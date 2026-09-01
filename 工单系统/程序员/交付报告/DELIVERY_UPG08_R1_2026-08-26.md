# DELIVERY_UPG08_R1 — 打回修复交付（2026-08-26）

> 程序员 C ｜ 分支 `feat/upg08` ｜ 提交 `848b11a`（基底 d4a194d）｜ 报告四要素：现象 → 根因 → 修法 → 复验
> 已登记两个表：工单表.xlsx 第 9 行（程序员 ✅R1 修复完成 + 备注 hash）+ 工单库.md UPG-08 状态「程序员✅修复完成，待复验」
> 规则 18 声明：**演示数据已还原且生产态已复核**（L3 演示用改表已还原，终态用真实工单表重新 sync --deploy）

---

## P1-1 sync 依赖未交付 + 缺依赖静默降级 exit=0

- **现象**：初版 sync-workbench.mjs 依赖外部 xlsx 库但无 package.json；缺依赖时 readXlsx 仅 warn 跳过，仍 exit=0 并可能空态覆盖生产 json。
- **根因**：脚本无依赖声明；xlsx 读取失败被设计为"容错"而非"阻断"。
- **修法**：① 补 `workbench-web/package.json`（声明 `xlsx ^0.18.5` + npm scripts）；② sync 启动时 require('xlsx') 失败 → **FAIL-LOUD**：打印错误、`process.exit(1)`、拒绝生成与 --deploy；③ --deploy 仅在同进程生成成功后才执行 scp。
- **复验**：`node sync-workbench.mjs`（干净环境，无 NODE_PATH/node_modules）→ 输出 FAIL-LOUD 且 `exit=1` ✓；带依赖（NODE_PATH=/tmp/node_modules）→ 生成 17907B json + 部署成功 ✓。

## P1-2 数据源路径错 → 挂账/验收记录恒空

- **现象**：初版读 `工单流转中心/挂账登记表.md` 与 `工单流转中心/ACCEPTANCE_LOG.md`——两文件实际不存在，app-backlog/app-accept 恒空。
- **根因**：挂账登记表与验收档案的真实位置分别是 `处理中心/挂账登记表.md` 和 `0027-mov/docs/ACCEPTANCE_LOG.md`（验收员唯一产出落点）。
- **修法**：sync 改读 `path.join(CENTER,'处理中心','挂账登记表.md')`；ACCEPTANCE_LOG 改 `env WORKBENCH_ACCEPT_LOG || C:/Users/Administrator/0027-mov/docs/ACCEPTANCE_LOG.md`。
- **复验**：生成 json 后 `app-backlog.backlog = 3 条`、`app-accept.events = 13 条`，均**非空** ✓。

## P1-3 L1 校验假覆盖（字符串包含检查）+ TREE 死代码

- **现象**：初版 verify 仅做"源码字符串包含"断言——函数改名/逻辑错仍可假绿；app.js 内 `const TREE` 常量未被使用（死代码）。
- **根因**：校验断言粒度停在字符串层；骨架树常量未随 JSON 驱动改造移除。
- **修法**：① verify 重写为**真实行为断言**：`node:vm` 加载 app.js（DOM/账号 token/fetch 最小 mock，fetch 回真实 workbench.json 内容）→ 真实执行 loadData→checkAuth→renderTree→route；断言侧栏/内容区真实 HTML 产出；② 校验真实 workbench.json 结构（7 一级/15 二级/五维度/name·type 合法/focus·archive 数组/敏感词零）；③ 移除 `const TREE` 死代码（app.js -1914 字符）；④ 保留禁加元素/中文残留断言。
- **复验**：`node tools/verify-workbench.mjs .` 全绿；**变异亲杀 2/2**——删 `renderTree` 定义 → app.js 加载失败必红；删 json 二级节点（app-backlog）→ 「缺二级节点」必红；恢复全绿 ✓。

## P2-1 fallback 渲染错乱（SAMPLE 结构不一致）

- **现象**：断 JSON 时 SAMPLE.tree 为平铺 sections，渲染器按 dim→children 结构取数 → 树标题 undefined。
- **根因**：SAMPLE 常量结构与 sync 产物结构不一致。
- **修法**：SAMPLE.tree 一键转换为 dim→children 嵌套（7 一级/15 二级，SAMPLE 五维数据原样保留）；另随 `--sample` 输出 `workbench.sample.json`（前端 fallback 链 workbench.json → workbench.sample.json → SAMPLE）。
- **复验**：断网 mock（fetch 抛错）vm 实测：侧栏渲染无 undefined 标题 ✓。

## P2-2 生产残留演示态

- **修法**：终态以真实工单表（含 R1 登记）重新 `sync --deploy`（17907B，真实 8 工单 + dims 31 条 + focus 5），线上已复核（OCR 截图：真实 UPG-01/UPG-02 工单行）。
- **声明**：演示数据已还原（L3 演示改的行已清空恢复），生产态已复核 ✓（规则 18）。

## P3-1 login-password 虚标

- **修法**：登录面板改为双模式 Tab（验证码登录 / 账号密码登录），密码模式接线 `/account/login-password`，不再只声明不用；错误显示统一 `j.error || j.msg`。
- **复验**：app.js 源码含 `/login-password` 接线 + tab 渲染；真实登录链路验证码路径实测通过（17679332556 登录成功渲染真实数据）。

## P3-2 focus/archive 实算

- **修法**：sync 从全量 tickets 实算——focus = P0/P1 优先的前 5 条在制；archive = 状态含「合 main/已归档/完成」的沉底；不再静态空数组。
- **复验**：生成 json focus=5 条（真实工单）；archive=0（当前工单表暂无非合main数据，属真实状态，前端空态正常）。

## 顺带收口

- **dims 四维表接入**：设计师底稿（市场/品牌/营销/基建 4 份）复制进 `workbench-web/dims/`；sync 按"表顺序映射板块"解析（含档案型板块 brand-tm/marketing-cal/infra-servers → cards）。生成 json 四维 12 板块 31 条数据 ✓。
- **脚本档案型板块盲区**：archive 型板块统一输出 cards（name/status/fields），前端 renderArchive 已支持。
- **前端兼容**：renderArchive 支持 cards/tickets/events 三形态；真机渲染（OCR）已验证品牌/市场等板块可进。

## 红线复核

- 只读视图 ✓（无写操作）；Stitch/DESIGN_v2 token ✓；不做清单 ✓；不碰市场现站（仅 /wb/）✓；敏感词 scrub（手机号打码 + password/token/密钥/验证码/sk- 打码）✓；门禁接 account-service ✓；干净环境缺依赖拒绝部署（宁可不上，不可空态覆盖生产）✓。

## 遗留

- archive 当前为空是真实数据态（工单表尚无「合 main」状态行）；后续工单推进合 main 后 sync 自动收敛。
