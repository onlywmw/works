# 数字人体 · 融入 MOV 架构评审稿 v2.1（冻结版）

> 版本：v2.1 ｜ 2026-09-05 ｜ v1/v2 存档留底（`数字人体_融入MOV架构_评审稿[_v2]_2026-09-05.md`）
> **大神评审 v2：8.8/10 有条件通过**——3 P0+1 P1 全部采纳生成本版：①BodyAnchorRegistry 升级为核心基础契约（§五之二）②头身拼接 Spike 改「多样本自动化验收」（§六阶段 0）③阶段 0 前置冻结最小 Registry ④新增 HumanAssetManifest 兼容契约（§五之三）；另采纳战略建议：契约层按可泛化为 Spatial Entity Runtime 设计（命名不锁死人体）
> 关联：UPG-106（数字人体 V1）

---

## 〇、一页结论

**方向可行，且不必依赖任何 SaaS**。MOV 现有体系预留了约 70% 地基（页面承载/能力注册/wardrobe 衣柜类目/商业挂点主体/UI 规范全部现成，§四已逐层取证）。技术栈全走 GitHub 可商用开源件：**three-vrm（渲染+标准骨骼）+ MakeHuman/MPFB2（等比例身体，输出 CC0）+ FLAME 2023 Open + 3DDFA_V2（人脸拟合·自有服务端 GPU）+ Hunyuan3D-2.1 + UniRig（衣柜资产生产）**。

**AI 的定位一句话**：**AI 负责「理解」与「推荐」，确定性系统负责「存储」与「执行」**——AI 永不直接改模型参数、改资产、碰支付（详见 §三之二）。

**资产观一句话**：**数字人体 = MOV 资产注册制的完整闭环——AI 是资产生产线（人脸/衣服→标准化可安装资产包），registry 是货架（wardrobe 类目+市场包机制现成），人体是装配台（换装=换资产，O(n) 入库、O(1) 替换）**。衣服/裤子/鞋子/发型/脸皆为资产公民：可安装、可替换、可溯源、可下架。

主要风险：人脸=**敏感个人信息**（自有服务端第一方处理、即用即删不落盘、不进第三方 SaaS）+ 生成式资产许可逐条核（Hunyuan3D 社区许可含月活条款/欧盟排除）。

---

## 一、前因（同 v1，略）

用户构想：数字人体 = MOV 的界面本体。裸态=人体结构体（点部位→健身内容），穿态=衣柜载体（点衣服→电商商家），头发→理发店——**每个部位=商业挂点**。形态拍板：直接 3D；AI 接入拍板：人脸照片+身材参数→自动生成等比例 3D 人体；技术栈拍板：Web（Vue+Three.js）独立页先行。（v1 §一）

---

## 二、三大诉求（同 v1，略）

①AI 一键生成人体（照片+身高/体重/围度 → 等比例 3D）②点击部位→内容/商业 ③点击即换装。（v1 §二）

---

## 三、技术栈（v2 定稿：全开源自托管）

| 环节 | 方案 | 许可 | 选型理由 |
|---|---|---|---|
| 渲染+捏人交互 | **three-vrm**（pixiv 官方） | MIT | Three.js 零摩擦；**VRM 骨骼标准化**（hips/spine/chest/upperArm…）——部位拾取映射表白捡 |
| 参数化身体 | **MakeHuman + MPFB2**（Blender 插件，活跃维护） | 输出 **CC0**（[官方 FAQ](https://static.makehumancommunity.org/makehuman/faq/can_i_sell_models_created_with_makehuman.html) 实锤：导出物全部 CC0 素材构成） | 身高/体重/围度宏参数成熟，开源界唯一真「等比例」路线 |
| 人脸→3D 头 | **FLAME 2023 Open**（CC-BY-4.0）+ **3DDFA_V2**（MIT）拟合管线，**部署在自有服务端 GPU**（第一方推理，非第三方 SaaS；照片即用即删不落盘） | 均可商用 | 手机只渲染不算图——拟合是重模型，端侧跑效果不可接受；自有服务端既保效果又守住「不进第三方」 |
| 衣柜资产生产 | **Hunyuan3D-2.1**（腾讯，PBR 纹理生产级）+ **UniRig**（清华+VAST，SIGGRAPH 2025 自动绑骨，8GB 显存） | 腾讯社区许可（可商用；⚠️ 月活条款+欧盟排除+内置资产逐条核） | 商家衣服照片→3D 资产→自动绑骨挂上人体——「点衣服→电商」的生命线 |
| 动作内容 | 中文动作库 86 条（free-exercise-db，Unlicense） | ✅ | 已备 |
| 部位注册表 | VRM 标准骨骼 + 自制 `BodyAnchorRegistry`（区域语义层） | — | 见 §五 |

**v1 方案变更**：RPM SaaS **不采用**（体型不可参数化+人脸出境+条款未核）；DECA/PIFuHD 确认不可商用维持排除；MetaHuman 不可 Web 合法导出维持排除。

---

## 三之二、AI 分层职责（本方案的核心设计）

> MOV 哲学落地：**「AI 在环，但环有闸门」**——每个 AI 层都有确定性闸门和验收标准，与审批体系（PermissionGuard/预审单）、Trace 契约、评测集体系同构。

### AI 做什么 / 不做什么（一张表）

| AI 做（理解/推荐层） | AI 不做（确定性系统做） |
|---|---|
| 听懂用户（体型话术/健身目标/自然语言意图） | 存身材参数（本机 InfoVault 加密） |
| 视觉模型算照片（人脸→FLAME 参数，自有服务端 GPU） | 渲染 3D（three-vrm 确定性渲染）+ 头身对接（Blender 工具链） |
| 分类映射（「微胖/梨形」→ 体型标签枚举） | 标签→参数（确定性映射表，可审计） |
| 推荐+讲解（动作组合/要领/组数，AI 口吻） | 记录身体数据历史（jsonl 单写点） |
| 搭配建议（衣柜组合推荐） | 执行换装（网格显隐/绑骨挂接） |
| 导购话术生成（商家内容个性化表达） | 交易（支付永不预批——商业红线） |
| 商家侧：衣服照片→3D 资产生成（Hunyuan3D） | 资产入库审核（市场审核流现有） |

### L0 感知层（AI 视觉模型，非 LLM · 自有服务端 GPU）

**数据流（端轻云重，AI 出参数、工具做对接）**：

```
手机上传照片（单独同意+加密传输）
  → 自有服务端：3DDFA_V2 拟合 → FLAME 参数/头模（AI 视觉模型的全部职责到此为止）
  → 自有服务端确定性工具链：Blender/MPFB2 把头对接到 MakeHuman 参数化身体（颈部融合，非 AI）
  → 成品 glb/VRM 回传手机 → three-vrm 渲染交互
照片即用即删不落盘；服务端只留模型产物（用户可删）
```

- **人脸照片 → FLAME 参数**：3DDFA_V2 跑在**自有服务端 GPU**（第一方推理，非第三方 SaaS）——手机算不动也不该算；拟合失败→明确报错，不硬编
- **身材照片（可选）**：同链路轮廓拟合辅助围度估算——缺省走统计表，不强制
- **对接人体 = 工具职责**：AI 只交付 FLAME 参数/头模，头身拼接由 Blender 工具链确定性完成（颈部融合属工程 spike，不用 AI 赌质量）
- 验收锚：同一照片两次拟合参数一致（确定性）；拟合结果用户可见可调；服务端照片零留存（审计项）

### L1 理解层（LLM，MOV 主场）

- **体型话术 → 标签**：「微胖」「梨形」「健身半年」→ 有限枚举标签（微胖/匀称/梨形/苹果形…），**LLM 只输出标签**，标签→MakeHuman 参数走**确定性映射表**——可审计、无幻觉
- **自然语言 → 部位路由**：「我最近腰酸」→ LLM 解析意图 → BodyAnchorRegistry 部位 id（腰/背）→ 界面点亮该部位 + 推荐对应动作
- 验收锚：话术→标签用例集（评测集既有基建复用）；意图→部位映射准确率入六指标评测

### L2 生成参数层（确定性，非 AI）

- 标签 → MakeHuman 宏参数（数值向量）→ 身体 mesh
- 头身拼接（Blender 颈部融合）——工程 spike 先行（全案最大翻车点）
- **此处零 AI**——参数链全程可复算

### L3 交互/内容层（LLM，MOV 的差异化所在）

- **动作讲解**：点部位→动作库条目 + LLM 生成「要领/常见错误/组数建议」话术（动作数据是确定的，话术是 AI 的）
- **训练计划编排**：用户目标（「减脂」「练肩」）→ AI 编排动作组合→ 走 **UPG-46 的 Plan 契约**（先出计划→用户确认→执行）——数字人体是 Plan 模式的第一个真实业务场景
- **衣柜搭配推荐**：「今天面试穿什么」→ AI 读衣柜资产元数据 → 推荐组合 → 用户点确认 → 确定性换装执行
- **商业挂点话术**：点衣服→商家内容经 AI 个性化讲解；**交易走审批门，支付永不预批**
- 全部 AI 行为过 **Trace 契约**（14 字段，不含 CoT）——可审验

### L4 记忆层（Memory OS）

- 身材档案/训练历史/穿衣偏好 → Memory OS 条目（本机，加密，「数据不出设备」原则与 vault 一致）
- AI 下次交互自动带上下文（「你上周练了肩，今天换腿？」）——这是 MOV 相对一切 SaaS 捏人工具的护城河
- 验收锚：记忆条目可读可删（用户主权）；删除后 AI 不再引用

### 红线（AI 层专属）

1. AI 输出**永不直接写**模型参数/资产/账户——一律过确定性闸门
2. 人脸/身材=敏感个人信息——自有服务端即用即删不落盘，删除机制必备，隐私政策挂现有合规体系
3. AI 推荐涉及商业内容 → 明示「推荐」性质；支付链路零 AI 预批
4. LLM 幻觉防护：体型标签/部位 id 均为有限枚举，模型输出超出枚举=拒绝执行（fail-closed，同 PermissionGuard 哲学）

---

## 三之三、物理与动感策略（2026-09-05 用户拍板：不上实时物理引擎，分三层替代）

> 结论先行：**不引实时物理引擎**（手机 WebView 跑软体物理=帧率不稳+发热+低端机崩，唯一要避免的路线）。「贴合」和「死板」是两个问题，分开解。

### 1. 衣服贴合 = 蒙皮 + 体型联动形态键（非物理）

- 衣服网格绑人体骨骼（蒙皮），身体动衣服跟动——绑骨，不是物理
- 不同体型贴合：衣服带与 MakeHuman 身体参数联动的 **blendshape（形态键）**——身体「胸围+5cm」→衣服胸部形态键同步变形；MPFB2 管线原生支持参数联动
- 实时布料解算做贴合是最差路线，游戏业不这么干

### 2. 动感（「死板」的解药）= spring bone + 待机动画（Web 零成本）

| 动感来源 | 技术 | 成本 |
|---|---|---|
| 头发/衣摆/配饰随动飘 | **VRM spring bone**（three-vrm 内置，零引入） | 几乎免费 |
| 呼吸/微晃/待机 | 骨骼 idle 动画 | 几乎免费 |
| 点部位反馈 | 部位高亮 + 镜头缓动 tween | 几乎免费 |

### 3. 真布料垂坠 = 服务端离线解算预烘焙，手机只播放

- 服务端 Blender cloth sim 把裙摆/披风离线算成动画/形态键序列 → 导出进 glb → 手机 three-vrm 直接播放
- 手机零物理开销，效果=完整物理级——「端轻云重」的又一次复用（与人脸拟合同套路）

### 4. 资产规模：组合是运行时装配的 O(n)，不是预生成的 O(n²)

- 衣服=独立 glb 资产（网格 ≤2 万面+KTX2 纹理 ≈ 2-3MB/件），挂在共享骨架上——**100 衣服+100 裤子=200 个文件（≈500MB 资源库），1 万种搭配新增存储为 0**
- 端上只加载当前穿着（本体+几件 ≈ 25MB 级）；用户已购衣服才缓存本机（wardrobe 资产类目）
- 商家上新=服务端管线增量产出一个文件，不动任何已有资产——**衣服越多，结构化路线优势越大**

---

## 四、MOV 现状契合度（带证据，逐层核实）

同 v1 §四（全部锚点 2026-09-05 抽查复核）：

- ✅ 页面承载：`BizSheet.show(activity, page)` 参数化 BottomSheet（`BizSheet.kt:14`）+ WebViewAssetLoader + MPA 构建链（mov-vue → sync-pages）
- ✅ 能力注册三步模板：ToolsRegistry 按域注册 + HostToolMeta + ApprovalRegistry（未登记 UNKNOWN→ASK fail-closed）
- ✅ **wardrobe 衣柜类目已在 AssetRegistry 注册**（`tool-orch/.../asset/AssetRegistry.kt:72-77`，PRIVATE/mcpWriteAllowed=true，灰显「未上线」）
- ✅ 商业挂点主体：biz.professions + market registry + 微信商户入驻线（支付链路已通）
- ✅ UI 规范：五态/a11y 热区 ≥44×44dp/Motion/tokens.css 硬规；先例 mov-home-orb（图形页参照）
- 锚点修正（v1 勘误）：`InfoVault.kt` 已迁 `app/src/main/kotlin/com/hermes/mov/biz/InfoVault.kt`（UPG-98 搬移；白名单 FIELD_LABELS 在 :409-424，确无身材字段）

### 分层溯源图（§七 口径 · main @origin/main 2026-09-05）

| 层 | 判定 | 证据 | 依赖声明 | 断点处置 |
|---|---|---|---|---|
| L1 用户可感知 | ✅（通道）/ 🔄（本体页未建） | BizSheet/WebViewAssetLoader/MPA 链现成（§四）；数字人体页本体=新建 | 依赖通道，新建页面 | 本单修（新建页） |
| L2 入口/桥接 | ✅ | PagesBridge 前缀白名单（biz./ui.）；ToolsRegistry 注册面 | 依赖 | 无断点 |
| L3 服务/数据 | ⚠️ 半成品 | wardrobe 类目已注册但灰显未上线（AssetRegistry.kt:75「未上线」注记）；InfoVault 白名单无身材字段；BodyAnchorRegistry 不存在 | 依赖 | 本单修（字段+注册表新建） |
| L4 运行时装配 | ✅ | ui.* 注册三步模板（PageTools.kt:121-135 先例）；渲染=WebView 内自洽 | 依赖 | 无断点 |
| L5 能力实物 | ❌ 缺失（本方案主体） | 人体生成/换装/部位拾取能力全部待建（外部开源件+胶水层） | 依赖（新建） | 本单修（外部件引入+接线） |
| L6 持久化/事实源 | ✅（机制）/ 🔄（新数据类型） | InfoVault 加密存储机制现成；身材字段=新增；记忆走 Memory OS jsonl 单写点 | 依赖机制，新增字段 | 本单修（字段扩展） |

**置信度 = L5（❌ 缺失）**——本方案主体是新建能力，地基仅解决「承载/注册/存储/商业挂点」通道问题；L5 的外部开源件可用性由 §三许可表+阶段 1 spike 双重兜底。

---

## 五、缺口（需新建）

| 缺口 | 方案 | 规模 |
|---|---|---|
| **BodyAnchorRegistry（核心基础契约，大神 P0-1）** | 不再是「部位 id 小契约」——升级为正式核心契约，见 §五之二；**阶段 0 先冻结 v0** | 契约设计 0.5-1 天 |
| **HumanAssetManifest 兼容契约（大神 P1）** | 资产上架前必过的兼容性清单，见 §五之三 | 契约设计 0.5 天 |
| 用户身材参数存储 | InfoVault 扩展字段（本机加密+显式授权）；**不落云端账号** | 字段+表 |
| 人脸数据通道 | 自有服务端第一方拟合（即用即删+单独同意+传输加密），模型产物本机存储可删 | 审批项 |
| 衣柜资产生产管线 | Hunyuan3D+UniRig 服务端 spike（出资产**必须过 §五之三兼容校验**） | 1-2 天 spike |
| 头身拼接 | Blender 颈部融合——**阶段 0 spike，验收=多样本自动化（§六）** | 最大工程风险 |

---

## 五之二、BodyAnchorRegistry 契约（大神 P0-1：升级为核心基础契约）

> **定位**：数字人体的**核心公共契约**——若只做 `boneId → bodyPart`，未来健身/服装/美发/商业各自建映射必然语义分叉。契约先行，**阶段 0 冻结 v0，阶段 1 的点击交互即基于 v0，不返工**。

### 契约结构（v0）

```text
BodyAnchor
├── id                  # 标准解剖 id（chest/waist/shoulder_l…）
├── parentId            # 层级（arm → upper_arm/forearm）
├── anatomicalRegion    # 解剖区域（标准枚举）
├── vrmBones[]          # 绑 VRM 标准骨骼（可多个/可为空=区域型）
├── meshRegions[]       # 网格区域锚（拾取命中判定）
├── interactionAnchor   # 点击/高亮/镜头聚焦点
├── domains[]           # 多域区域语义：fitness/fashion/beauty/health…
├── visibilityRules     # 显示规则（裸态/穿态/场景）
├── commercialPolicy    # 商业挂点策略（可挂/禁挂/审核级）
└── version             # 契约版本（演化追溯）
```

### 泛化注记（大神战略建议采纳）

契约层命名与结构**不锁死人体**：Anchor/Region/Compatibility/Assembly 四元组按「可泛化为 Spatial Entity Runtime」设计——未来数字衣柜/房间/设备复用同套骨架，人体只是第一个实例。**AI Runtime Pattern（§三之二）同此**：Intent→Enum→Deterministic Resolver→State/Asset/Execution 是 MOV 通用模式，不只服务本方案。

---

## 五之三、HumanAssetManifest 兼容契约（大神 P1：资产层最后一块拼图）

> **定位**：资产≠「一件衣服文件」——上架前必须声明兼容性。没有这个契约，商家资产就会长成「能生成但穿不上/穿不上还说不清为什么」的野资产。

### 契约结构（v0）

```text
HumanAssetManifest
├── assetId / assetType          # garment.top / garment.bottom / shoes / hair / accessory / body / head
├── compatibleBodySchema         # 兼容的身体 schema 版本
├── compatibleSkeleton           # 兼容骨架（VRM 标准 / 扩展）
├── requiredBones[]              # 依赖骨骼清单
├── meshSlots[]                  # 占用槽位（上装/下装/鞋…互斥判定依据）
├── bodyShapeSupport             # 体型适配范围（形态键联动参数集）
├── blendshapeSupport            # 形态键清单
├── physicsMode                  # none / springBone / prebaked
├── lod / textureFormat          # LOD 档 + KTX2 约束
├── license / source             # 许可+来源（registry 强制）
└── installPolicy                # 安装策略（私有/市场/审核级）
```

### 资产流水线（兼容性校验是强制闸）

```text
商家上传衣服照片
 → Generate（Hunyuan3D 生成网格）
 → Rig（UniRig 绑骨）
 → Validate Compatibility（对照 HumanAssetManifest 机器校验——无 manifest/校验失败=拒入）
 → Asset Review（市场审核流，现成）
 → Registry 上架
 → Install（用户衣柜）
```



## 六、分阶段落地（v2.1：大神 P0-2/P0-3 采纳——阶段 0 前置 + Spike 自动化硬验收）

### 阶段 0「地基 Spike」（2-3 天，大神 P0-3：先契约后实现）

- **BodyAnchorRegistry v0 冻结**（§五之二——阶段 1 的部位点击直接基于 v0，不留临时映射、不返工）
- **头身拼接 Spike**（全案最大工程风险前置排雷）——**验收=多样本自动化，不是「跑通一次」**（大神 P0-2）：

| 验收维度 | 必须回答 |
|---|---|
| 视觉 | 颈部接缝是否明显（截图对比在档） |
| 比例 | 头身比例是否自然（5 个不同体型输入） |
| 动画 | 转头/身体动画时头身是否裂开（idle 动画实跑） |
| 资产化 | 能否稳定导出 glb/VRM（进 three-vrm 直渲） |
| **自动化** | **给 5 个不同输入，无人工干预自动生成 5 个可运行模型**——工程师手开 Blender 调参=Spike 失败 |

- **HumanAssetManifest v0 草案**（§五之三——资产兼容闸的数据结构先定，阶段 3 管线直接挂）

### 阶段 1「3D 交互 MVP」（3-5 天）

- three-vrm + 现成 VRM 模型（VRoid 捏/CC0 资产）+ **部位点击基于 BodyAnchorRegistry v0** 出中文动作（86 条已备）+ 换装=同模型多衣服网格显隐
- 动感随阶段 1 就上：spring bone（头发/衣摆）+ 骨骼 idle 呼吸动画——防「死板」从第一天做起（§三之三）
- **性能验收锚（硬）**：真机 WebView 实测——帧率 ≥30fps、首屏加载 ≤3s、纹理 KTX2/Basis 压缩（防 WebView 内存炸）；模拟器只作开发参考，性能判定以真机为准
- **不碰真人脸上传**；交付：`人体载体/demo/human3d.html` 浏览器直开

### 阶段 2「AI 参数化」（约 1 周，拼接风险已在阶段 0 排除）

- 身材表单 + 体型话术（L1 理解层：LLM 标签 → 确定性参数表）
- 人脸服务端拟合（L0：手机上传 → 自有服务端 3DDFA_V2→FLAME → 工具链对接身体 → glb 回传；照片即用即删）
- 头身拼接=阶段 0 spike 产出的自动化管线直接复用

### 阶段 3「资产管线+商业挂点」（按商业节奏）

- 衣柜资产生产管线：**Generate（Hunyuan3D）→ Rig（UniRig）→ Validate（HumanAssetManifest 机器校验，不过=拒入）→ 市场审核 → Registry → Install**（§五之三）
- BodyAnchorRegistry 商业面开放（domains 商业挂点策略启用）
- 商家侧（biz.professions + market registry 扩展）

### 阶段 4「嵌 App」（效果确认后）
- human3d.html 进 sync-pages + `ui.openHumanBody` 三步注册 + BizSheet 承载 + Capsule 内置能力入口
- 全程合规：MainActivity 只出不进棘轮——新页走 ToolsRegistry/BizSheet，零 MainActivity 新代码

---

## 七、合规红线（先查后做，v2 收紧）

1. ❌ DECA / PIFuHD / FLAME 旧版 不能碰（非商用）
2. ✅ MakeHuman 输出=CC0（已实锤销项）；MPFB2 同链
3. ⚠️ Hunyuan3D-2.1 社区许可：可商用但**月活条款+欧盟排除+内置资产许可逐条核**（阶段 3 spike 前完成）
4. ⚠️ UniRig 模型权重许可随代码仓核实（SIGGRAPH 2025 官方仓）
5. ⚠️ **人脸/身材=敏感个人信息（生物识别）**：自有服务端第一方处理+即用即删不落盘+**单独同意**+传输加密；demo 阶段只用非真人/授权测试照片
6. ⚠️ VRM 模型资产：VRoid 产出可商用但素材级限制逐条核（只用自制/CC0 素材）
7. AI 层红线见 §三之二（闸门/枚举 fail-closed/支付零预批）

---

## 八、评审结论与采纳记录（v2 → v2.1）

**大神评审 v2：8.8/10，有条件通过「进入 Spike + 阶段 1 实施」**（2026-09-05）

| 评审点 | 结论 | v2.1 处置 |
|---|---|---|
| AI 分层职责（§三之二） | 9.5/10，建议上升为 MOV 通用 AI Runtime Pattern | 采纳——泛化注记入 §五之二 |
| P0-1 BodyAnchorRegistry 太轻 | 升级为核心基础契约 | ✅ §五之二（v0 契约结构+domains 多域语义） |
| P0-2 拼接 Spike「跑通一次」不够 | 改多样本自动化验收 | ✅ §六阶段 0 五维验收表（视觉/比例/动画/资产化/**自动化：5 输入→5 可运行模型，人工调参=失败**） |
| P0-3 阶段顺序 | 阶段 1 前冻结最小 Registry | ✅ 新增阶段 0（Registry v0 冻结+拼接 Spike+Manifest 草案） |
| P1 缺资产兼容契约 | 补 HumanAssetManifest | ✅ §五之三（契约结构+Validate 强制闸流水线） |
| 战略：契约命名别锁死人体 | Physical Digital Twin Runtime 方向 | ✅ §五之二泛化注记（Anchor/Compatibility/Assembly 可泛化） |

**v2 原 3 决策点状态**：①AI 总闸=评审认可✅ ②拼接 spike 前置=采纳并强化入阶段 0✅ ③衣柜管线 spike=采纳（阶段 3，许可核查前置不变）

~~v1 决策点 1（RPM vs FLAME）~~：v2 已定——全开源栈，RPM 不采用
~~v1 决策点 4（MakeHuman 商用确认）~~：**已销项**（输出 CC0 官方 FAQ 实锤）

**冻结声明**：v2.1 为实施冻结版——大神 3 P0+1 P1 全部落地；后续修订派生 v2.2+，不动本版。

---

## 九、已知风险与备胎

| 风险 | 备胎 |
|---|---|
| 头身拼接质量不过关 | 全 MakeHuman 身体+FLAME 仅头像展示（头身分离呈现，弱化拼接） |
| FLAME 拟合不像 | 3DDFA_V3/Deep3D（MIT）备选；实在不行=卡通化风格规避「恐怖谷」 |
| Hunyuan3D 许可核不过 | TripoSR（MIT）/TRELLIS（Microsoft，MIT）替换生成器 |
| 移动端性能 | 减面 20-40k + Draco + LOD + KTX2 纹理压缩；阶段 1 硬验收锚=真机 ≥30fps/首屏 ≤3s |
| 实时物理引擎诱惑（衣服贴合/动感） | **不引**——贴合=蒙皮+形态键，动感=spring bone+idle，布料=服务端预烘焙（§三之三） |
| VRM 风格太二次元 | 写实向备用=MakeHuman 全流程（渲染调材质） |

---

## 九之二、备选路线评估（评审预答，2026-09-05）

### 备选 A：全 AI 生成（照片+衣服 → AI 直接生成换装 2D 人像）——❌ 不做本体，✅ 做增强层

- **不做本体的原因**：①生成的是静态图，无骨骼无结构——「点部位/旋转/换装」交互全假 ②同一人体跨图一致性是生图著名难题（换 5 件衣服 5 张脸）③每次交互=一次推理调用（秒级延迟+逐次成本）④用户已拍板「2D 体验不好，直接 3D」
- **增强层定位**（保留价值）：分享图润色（3D 穿搭截图→AI 照片级海报）/ 商家详情图（2D 虚拟试衣开源件：IDM-VTON/OOTDiffusion/Kolors——许可需逐核）/ 需求验证探针（一天可出的 AI 试衣 demo 测用户买不买账）
- 一句话：**本体要结构化（3D），生图做润色（2D）**

### 备选 B：3D 高斯泼溅（3DGS）建模拆分资产——❌ 不进资产链，✅ 可做商品全息展示

- **不进资产链的原因**：3DGS=几十万团高斯椭球点云，**无网格、无骨骼、无拓扑、无「部位」语义**——不可装配、不可参数化、不可骨骼驱动；「拆分出一件上衣」正是它的弱项；Inria 原版许可研究非商用
- **可对的位置**：商家商品 360° 全息展示（绕衣服拍一圈视频→3DGS→详情页逼真查看），与网格试穿并行：详情页看 3DGS 真实感，试穿用网格版；three.js 有 MIT 渲染器可与 three-vrm 同场景共存
- **观察区**：animatable gaussian avatar（GUAVA/HRAvatar/3DGS-Avatar，ICCV/CVPR 2025）——真实感天花板，但全研究代码+许可多 NC+需训练，不押注

### 组合爆炸预答（评审必问「100 衣服×100 裤子会不会几个 G」）

3D 结构化装配是 **O(n) 线性存储**：200 件=200 个独立 glb（各 2-3MB，≈500MB 资源库），1 万种搭配新增存储=0；端上只加载当前穿着（≈25MB），用户已购才缓存本机（§三之三.4）。

---

## 十、附：证据源

- 许可原文/官方 FAQ：MakeHuman CC0（官方 FAQ+2020 许可澄清）、FLAME 2023 Open（CC-BY-4.0）、Hunyuan3D-2.1 LICENSE（社区许可，Issue #94/#254 商用确认）、DECA/PIFuHD（NC 排除）
- GitHub：pixiv/three-vrm、makehumancommunity/mpfb2、Tencent-Hunyuan/Hunyuan3D-2.1、VAST-AI-Research/UniRig
- MOV 证据：§四 文件:行号（2026-09-05 抽查复核：wardrobe 注册/BizSheet.show/PermissionRegistryData:186 全部命中；InfoVault 路径已修正）
