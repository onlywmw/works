# MOV MainActivity 拆分蓝图 v1（UPG-93 交付物）

> 依据：拆分计划书 v1.2（大神终审 9.1/10 定稿）｜ 本蓝图 = 批①全量盘点 + 后续分批依据，每批合 main 后更新。
> 数据口径：独立扫描器（scan93.py，词法级：注释/字符串/raw string/模板 ${} 递归遮蔽）实测，三方对账闭合。

## 一、批①落地定案（2026-09-04，feat/upg93）

### 口径修正闭合（对账结论）

- 旧口径「185 个 mcpHandlers 注册点」= **172 静态命名注册 + 13 读引用/动态写入点**（`mcpHandlers[` 全文出现 185 次）。
- 前置盘点（76c91cb）169 块边界经独立扫描器逐块复核**零错位**；差异=3 个非典型 RHS 形态盘点遗漏：`approval.setMode`/`security.setApprovalMode`（函数引用）+ `memoryos.devRun`（标签 lambda `devRun@{`）——已补入。
- 动态注册循环（`for (t in BuiltinMcpTools.all() + SceneTools.all())`，3 处 `mcpHandlers[t.name]` 写入）不在 172 静态名单内，属注册面一部分，随本单搬入 `tools/BuiltinTools.kt`。

### handler 形态盘点（P0 钉·前置）

| 形态 | 数量 | 处置 |
|---|---|---|
| 纯 lambda（不捕获 provider） | 114 | 同构一次搬 |
| 带状态闭包（捕获壳内局部 provider） | 58 | provider 留壳原位声明，参数传入（见下） |
| 函数引用（`= approvalSetModeHandler`） | 2 | handler 值留壳（@2990），参数传入 |
| 标签 lambda（`devRun@{`） | 1 | 同构搬 |

### 工程形态（定案落地）

- 分域文件 `tools/<Domain>Tools.kt` = **MainActivity 扩展函数**（receiver=this）：handler 体逐字节原样（机器证明：172 块归一化 sha256 与搬移前全等，测试资源 `upg93_handlers_manifest/index` 常驻锁定）。
- `tools/ToolsRegistry.kt` = **object 只聚合**（P0-1）：registerAll 单入口按域分发，零 handler 实现、零实例持有（P0-3）。
- 壳内局部 provider（17 个）+ 局部 fun（syncModelRegistry/capsule/pinServers/pinSchemaOf/readPinList/writePinList）**原位不动**，经参数传入域函数（局部 fun 不支持 `::` 引用，lambda 包装）；`modelApiKey`（仅 model.testConnection 引用）整体搬入 ModelTools。
- 接线改写仅两处形态：`mcpHandlers[`→`handlers[`（全量）+ `this@MainActivity`→`this@registerPageTools`（1 处，ui.openMemory）。
- 可见性必要调整：**48 处 private→internal**（MainActivity 成员被搬块引用；清单入交付报告，后续可用 Host 接口收回——债务清单①）。
- 装配点：原动态循环位（provider 全就绪之后、MCP server 遍历 `mcpHandlers` 之前——**首跑错位事故：装配点误置 server 遍历后会空注册，已固化「装配顺序锚」契约测试**）。

### 搬移量

- MainActivity.kt：7666 → **6016 行**（搬出 172 注册块+动态循环+modelApiKey ≈1652 行）；
- tools/ 11 文件 1873 行（含头注/包装）：system 24 / device 53 / vault 18 / page 17 / chat 16 / memory 12 / market 11 / model 8 / biz 13 / builtin 循环 1 / 聚合 1。
- **新文件行尾约定：CRLF**（与全仓 .kt 一致；生成器全归一化后单 CRLF 写入，防 \r\r\n 双回车）。

## 二、拆分后壳内剩余区域图（批②~⑨输入）

> 行号为搬移前 @254d6ca 锚（搬移后整体前移 ~1650 行）；区域内容未动。

| 区域 | 起始锚 | 归属批 | 内容 |
|---|---|---|---|
| chips 气泡 | :945 | ④ | 组列表两级气泡 |
| 主页胶囊 | :1352 | ④ | pin 只存 stableId/pinType/preset；局部 fun pinServers/pinSchemaOf/readPinList/writePinList 在本区（批①已参数化引用，批④收编时连同搬走） |
| 模型管理 | :2352 | ⑧ | modelRowsProvider/applyModelPick 成员装配（modelStore/syncModelRegistry 壳内局部已参数化） |
| Memory OS | :2671 | ⑨ | memoryOs* 成员已 internal（批①提升），生命链只读面 |
| 页面桥 | :2906 | ③ | PagesBridge 白名单 + browserHandlers（3318-3503）+ WebMcpHub.mountCallback（3504-3543） |
| 对话模式/Agent 装配 | :4352 | ⑦ | runChat/ReactLoopAgent/预审单编排 |
| 预审单 | :5317 | ⑦ | — |
| Markwon 视图 | :6839-7028 | ⑤ | buildMathView/CodeBlock/Table 纯函数构建器 |
| 市场总览 | :7266 | ② | buildLocalOverview/启停/安装投影（market 局部已参数化） |
| 启动序列 | onCreate 尾部 | ⑥ | ⑥a 只读审计先行；MCP server boot/ext 发现/不可用工具剔除在本区 |

## 三、分批计划（计划书 §四 原序，不变）

①工具注册【本单✅】→ ②市场（market/）→ ③页面桥（pages/）→ ④chips/胶囊（接口过 UPG-89 评审）→ ⑤Markwon（同）→ ⑦Agent 装配 → ⑧模型管理 → ⑨Memory OS → ⑥启动序列（严格最后，⑥a 审计→⑥b 另立语义单）。

## 四、债务清单（红线 11：只记录不修——后续优化单弹药库）

1. **48 处 private→internal 提升**为最小必要集；终态应收窄为 Host/Bridge 接口（P0-3 方向），逐域收回。
2. `permissionGuard` 双形态：成员 nullable（@351）+ onCreate 局部（@4130）遮蔽——语义无差（同实例），可收单源。
3. `asset.peekPhoto`/`asset.credPeek` 块内直呼注册表转调 vault.*（页面桥→vault 面耦合）——可显式依赖注入。
4. `unavailableTools` 填充点散布 5 处（2239/2253/2262/2628-2629/2644-2659），与注册块分离——批⑧/设备域收口时可聚合。
5. `market.uninstall` 跨面读写胶囊 pin 列表（readPinList/writePinList）——批④收编时归位。
6. 冷启日志「注册 session.search handler」留壳原位（与实际注册点分离）——日志文案/位置可随批⑥审计。
7. 动态循环内 file.read/file.write 特判与 BuiltinMcpTools 元数据双源——可评估上收为 ToolDefinition 声明式覆盖。
8. MainActivity 残留 `mcpHandlers.putAll(ext.handlers)`（C2 外部发现段）=运行时热挂合并点，非静态注册写点——批⑥审计时评估是否显式化。

## 五、复跑入口（验收/后续批同用）

- 扫描器：`scan93.py`（注册点/读引用/provider）、`scan93b.py`（成员引用对账）——worktree 根，WIP 工装。
- 生成器：`gen93.py`（幂等：HEAD 还原 MainActivity + 删 tools/ 后可重跑；内置保真断言 172/172）。
- 契约测试：`ToolsSplitContractTest`（名单/保真/唯一写点/装配顺序/P0-3/动态循环/5 代表工具落域 7 锚）。
