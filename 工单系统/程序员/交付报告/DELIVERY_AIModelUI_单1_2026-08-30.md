# UPG-27 单1 · AI 模型三级管理 UI 交付 —— 2026-08-30

- 分支：feat/ai-model-ui（worktree mov-ai-model-ui，基底 main e9aa7bc）
- commit：**0dc9318**（已 push origin；远程 ls-remote 实证）
- 设计依据：《AI模型管理通道_设计_v5_2026-08-30.md》§七/§十一 + 演示 设计师\设计预览\demo\AI模型管理_三级_demo.html

## 交付清单（对照派单）

### 一级（设置页入口）
- 「AI 模型 + DeepSeek API Key」两行 → **一行「AI 模型 ›」**（value 空=简约，无副题/当前名）；**key 并入三级**（设置页 keyDialog/credential.getKey/saveApiKey 全清）
- **空态引导**：无模型时一级行右值显示「去添加」（models.guideBtn）
- 入口：原生走 `ui.openModels`（ModelSheet 承载 model.html 三级页）；浏览器预览走前端 navigate('models')

### 二级（模型列表）
- 每行 = **模型名 + 当前✓ + ⚡快速测试（加载态 + 失败分型错误详情）+ 启用开关**（停用后默认由底层递补，刷新即见）；**不留供应商/接口小字**（旧 vendorLabel 已去）
- **唯一添加入口** `＋ 添加模型（含本地自部署）`；空态引导卡「去添加模型」

### 三级（模型设置 · 添加/编辑两态）
- **连接方式 ○云端 ○本地自部署** 先选→动态字段：
  - 云端：模型名(显示名称/可选项)/模型ID/供应商(deepseek/openai/openai-compatible)/接口地址/API Key(显示⇄隐藏)/设为当前
  - 本地：模型名/服务地址(localhost/局域网)/模型ID/设为当前——**key 不采集**
- 底部 [保存] [⚡快速测试]（编辑态）[复制模型] [删除该模型]
- **复制模型**：新 entryId + **API Key 不复制**（apiKey=''）+ 自动进入编辑页（toast「已复制，请在编辑页填写配置」）
- **删除含 key 模型确认**：「确定删除「XX」？API Key 将一并删除，不可恢复。」（真机证实）

## 约束落实
1. **只做视图层**：接 model.list/add/update/setDefault/delete/setEnabled（零新建底层）
2. **三态分离**：测试成功**不自动** enabled/current（testConn 仅刷新；代码注释+verify 锚）
3. **模型对象只存 keyName**：表单 apiKey 直传 model.add/update（底层 credentials.put），不存明文/无全局 Singleton
4. **URL 分型集中**：`urlKind()` 单一函数（new URL parse：https→cloud；http+loopback/RFC1918/10.0.2.2→local；公共明文→invalid）；保存/测试前 `validateForm()`（云 HTTPS only；本地 localhost+LAN）；**不写死 IP 段、不散落 UI**（RFC1918 规则集中）
5. **MOV tokens** 沿用（van-cell/switch/按钮体系无新增游离色）

## 真机走查（21770d7d，CDP 全链，证据 验收员\证据数据\2026-08-30\UPG27单1\ 截图 3 张）
- 二级列表 DOM：3 内置模型 +「当前默认」徽标 + 快速测试 + 唯一添加入口
- 三级云端表单：连接方式/模型名/模型 ID/厂商/接口地址/API Key（显示）/设为当前/保存/快速测试
- 切「本地自部署」→ **服务地址出现 + API Key 字段消失**（动态字段分流实证）
- **真实增**：填「Test Local Model + 192.168.1.10:11434 + llama3.2」→ 保存 → 列表出现（model.add 入库实证）
- **复制**：编辑态「复制模型」→ toast+自动进编辑页；**删除副本**：确认弹窗「…API Key 将一并删除，不可恢复。」→ 确认 → 列表消失（真删）
- **含 key 确认**：编辑 DeepSeek V4 Flash → 删除弹窗含 key 文案 → 取消（不误删）
- **setDefault 切换**：编辑 Pro →「设为当前」→ 保存 → 列表「当前默认」从 Flash → Pro 移动（修复验证：初版编辑态 setDefault 短路未生效 → **bug 修复** `editingId.value || r.id`）
- **还原**：Flash 恢复默认 + Test Local Model 已删（设备 3 内置模型原态）

## 验证
- `scripts/ai-model-ui-verify.mjs`：**27 锚全过**（一级/二级/三级/模型接线/URL 分型/i18n zh-en 对账）
- L1 全量：**57 类 424/0/0**（WebViewWarmupTest assets 红线在 commit 后消除）
- assembleDebug 绿 + 真机 install 成功
- Token/KV：0/0（纯前端视图层）

## 观察项（如实申报）
1. 复制本地模型（provider=local）底层 add 空 key 落 keyName=deepseek_key（ModelStore 现有 add 约定，非 ollama 时复用默认键）→ hasKey 误判为 true、删除提示含 key 文案——**底层语义单 4/单 5 范畴**，本单未改（视图层如实呈现底层 hasKey）
2. 删除模型**不实际清除 credentials 中的 key**（model.delete 现行为）——确认文案按派单要求写；key 物理清理建议随单 5 落地
3. 测试分型按底层 error 文本分类（5 类：net/service/model/key/loading）——持久化 connectionStatus/lastTestAt 留单 4/单 5

## 移交
- 报告 + 两表登记（工单表 UPG-27 行 + 工单库追加）；waiting 验收员 L1 复核 + L2 真机独立走查（CDP/截图）
- 挂账：0 新增（观察项不阻塞）
