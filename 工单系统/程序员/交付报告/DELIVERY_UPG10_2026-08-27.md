# UPG-10 交付报告：工作台 sync 状态语义细分

**程序员**：C ｜ **日期**：2026-08-27 ｜ **分支**：`feat/upg10` ｜ **commit**：`c0b5a0d`
**主仓库**：`0027-mov` ｜ **worktree**：`mov-upg10`

> **已登记两个表**（先表后库）：① `工单表.xlsx` UPG-10 行程序员列 `✅C 完成` + 备注 `feat/upg10 c0b5a0d（报告 DELIVERY_UPG10_2026-08-27.md）`；② `工单库.md` UPG-10 状态改 `程序员✅完成，待验收`。
> **演示数据已还原且生产态已复核**（规则 18）：端到端演示用副本表（`WORKBENCH_CENTER` 覆盖）注入，真实工单表零接触；演示后以真实表重跑 sync 覆盖产物并 verify 复绿，演示副本已删除。生产 json 的线上重新部署待合 main 后由设计师统一执行（挂账-upg08-r1 教训：以登记后的表 sync --deploy）。

---

## 一、施工内容

| # | 改动 | 文件 |
|---|---|---|
| 1 | 新增共享纯函数模块：`deriveStatus()`（状态推导唯一实现）+ `DEFAULT_CENTER`/`ACCEPT_LOG_DEFAULT` 路径常量 | `workbench-web/lib/shared.mjs`（新增） |
| 2 | sync 接入共享推导（删除内联推导）；`CENTER`/`ACCEPT_LOG` 默认值改走常量 | `workbench-web/sync-workbench.mjs` |
| 3 | archive 锚定修正：收编条件 `/合 main\|已归档\|完成/` → `/^(合 main\|已完成)/`，「待合 main」不再误入归档 | `workbench-web/sync-workbench.mjs` |
| 4 | verify 增三块断言：数据源目录可达 / `deriveStatus` 十组 fixture / archive 不收「待合」单 | `workbench-web/tools/verify-workbench.mjs` |

### 状态推导口径（工单库已定口径逐条照录实现）

- 验收员列含「打回」→ `打回修复中`（不要求该列有 ✅，覆盖 ❌ 打回/🔨 打回修复中两种历史形态）
- 验收员列含「通过」（且有 ✅）→ `待合 main`
- 验收员列其他 ✅ → `验收中`
- 合 main 列含「已合」→ `已完成`（终态，覆盖前者）
- 设计师/程序员/审验员沿用原从前到后逐列覆盖语义

### 附带修复（工单库 UPG-10 同单附带项）

- `DEFAULT_CENTER` 由旧路径 `C:/Users/Administrator/Desktop/工单流转中心` 改为 `C:/Users/Administrator/Desktop/新MOV`（不改则下次 sync 被 fail-loud 拦死）
- verify 增加「数据源目录存在」断言（目录漂移时 fail-loud 提示，可用 `WORKBENCH_CENTER` 覆盖）

### 关键设计决策

`deriveStatus` 抽为 `lib/shared.mjs` 共享模块而非复制进 verify —— verify 的 fixture 断言 import 的就是 sync 运行时的真实代码路径，映射被改乱时 verify 必红成立（若 verify 自带一份拷贝，则改乱 sync 实现不会红 = 「用 A 证明 A」假覆盖）。

## 二、复验判据对照（验收员将按此复核，原样照录）

1. **干净环境跑 sync：缺 xlsx 必须 exit≠0 且不执行 deploy**
   ✅ 实测：worktree 无 node_modules 时 `node sync-workbench.mjs --deploy` → `[sync] FAIL-LOUD: 缺少 xlsx 依赖…拒绝生成/部署` → exit=1，无 deploy 动作。
2. **生成 json 中挂账（app-backlog）/验收记录（app-accept.events）非空**
   ✅ 实测：真实数据源路径下 sync 生成 `workbench.json` 19354 bytes；挂账登记表现存 ⏳ 待审条目 + ACCEPTANCE_LOG 时间线均被解析入 json（该判据 UPG-08 R1 已修数据源路径，本单维持验证通过）。
3. **verify：删 `renderTree` / 删 json 节点 → 必红**
   ✅ 沿用 R1 断言（vm 真实执行 app.js），未回退；本单另增变异演练见下。

## 三、L1 变异亲杀演练

- **变异**：临时把 shared.mjs 的 `/通过/ → '待合 main'` 分支改为 `'验收中'` → `node tools/verify-workbench.mjs .` → **exit=1 红**，两条断言精准命中：
  - `{"程序员":"✅ 完成","验收员":"✅ 通过@2026-08-26"} 应为「待合 main」，实得「验收中」`
  - `{"验收员":"✅ 通过@2026-08-26","设计师(合main)":"⏳待核实"} 应为「待合 main」，实得「验收中」`
- **还原**：改回原映射 → verify 全量绿（exit=0）。
- 结论：verify 对推导映射具备区分度，变异亲杀成立。

## 四、L2 端到端演示与还原（规则 18）

- 工单 L2 判据：临时把某工单验收员列改「✅ 通过」→ sync --deploy → 网站显示「待合 main」→ 还原。
- 本单执行方式：**副本表注入**（复制生产工单表到临时目录，node xlsx 将 UPG-01 验收员列改为 `✅ 通过@2026-08-26`）→ `WORKBENCH_CENTER` 指向临时目录跑 sync（本地生成层全链实证）：
  - `UPG-01 status = "待合 main"` ✔
  - `archive 不含 UPG-01`（待合不入归档）✔
- **还原**：删临时副本；真实表零接触，用默认配置重跑 sync 覆盖 `workbench.json` 为真实态（UPG-08=已完成唯一入档、focus=U02..U06）→ verify 复绿。
- deploy 说明：scp 至生产的动作不含本地可证环节且属上线变更，按流转纪律留待设计师在登记后的表基线上统一 `sync --deploy`（前端 status 为自由文本直显，新状态值无前端适配风险）。

## 五、其他证据

- 真实表现网推导抽查：UPG-01..07=设计师处理中；UPG-08=已完成且唯一入 archive；UPG-09/10=程序员处理中（blocked=true 因备注含挂账词，符合既有规则）；focus=U02..U06 按 P0 优先实算 Top5。
- `node --check` 语法绿（sync/lib/verify 三文件）。
- 环境注记：本机 npm 不可用（not found），sync 运行借主仓库已有 `node_modules/xlsx`（NODE_PATH）；workbench-web 生产构建机不受影响。package.json 声明未动。
- 中途事故与修复（透明申报）：认领登记阶段用 PowerShell `Compress-Archive` 重打包 xlsx 导致格式不被 xlsx 库识别（Unsupported ZIP）且方括号文件名 `[Content_Types].xml` 被吞；已用 node zlib 手写标准 zip 重包修复，XLSX 消费方读取对账全表仅 H11 一处差异（认领文本）。后续登记操作已固定走同一可靠链路（unzip 解包 → XML 编辑 → node 重打包 → 读取对账 → 替换）。

## 六、影响面声明

- 行为变化仅两处：验收通过工单显示「待合 main」（不再显示「验收中」）；「待合 main」不再出现在归档板块。其余状态值/字段结构不变，前端零改动兼容。
- 本单不涉 LLM 请求链路（无 Token/KV Cache 影响，工单红线适用性说明）。
