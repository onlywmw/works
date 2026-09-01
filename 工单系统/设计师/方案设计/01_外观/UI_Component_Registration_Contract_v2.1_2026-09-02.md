# UI Component Registration Contract v2.1（Catalog + 上架绑定 · 平台级 UI 身份 · 7 点补死）

> 设计师 @2026-09-02 ｜ **大神 #47 突破性方向**：「UI Component Catalog + MCP 上架绑定」= 比 v5.0 的「provider 自定义 component_id」更清晰——**MCP 不创建匿名 UI，而是绑定/贡献标准组件编号**。
> **取代 v1.0/v2.0**（同主题升级）。配套：v5.0 Runtime Contract（怎么跑）。
> **v2.1 = v2.0 + 大神 #48（9.7/10 接近冻结）7 点补死**：P0①ID Authority ②四层身份（id/semantic_type/variant/impl）③MCP 只绑 ID+Contract Range；P1④Presentation i18n 文案契约 ⑤UISchema Version ⑥Owner/Maintainer/Lifecycle ⑦Deprecated/Suspended/Retired；+UPG-50 术语=Appearance Selection View（≠Catalog——大神 §十二）。

---

## 〇、核心原则（一句话钉死）

> **UI Component ID 是平台级 UI 身份；MCP 不创建匿名 UI。MCP 上架时必须绑定一个已注册的 UI Component ID；MCP 可以复用公共组件，也可以提交自定义组件，经 UI Component Contract 验证后获得新的 Component ID。**

**四系统串联（大神定）**：
```text
外观组件库（选外观）→ UI Component Registry（管理组件）→ MCP 市场（绑定组件）→ Runtime（运行）
```

---

## 一、两层拆开：Catalog vs Registry（大神核心）

```text
┌──────────────────────────────────┐
│  UI Component Catalog（合法清单）   │ ←「有哪些合法 UI 组件」（平台级目录）
│  UI-000001 Input   UI-000002 Button│
│  UI-000003 ListRow UI-010001 FilePicker ... │
└──────────────┬───────────────────┘
               │ install
               ↓
┌──────────────────────────────────┐
│  UI Component Registry（本机状态）  │ ←「当前设备已装/启用了哪些」（含 v1.0 四态）
│  installed / enabled / version / implementation │
└──────────────┬───────────────────┘
               ↓
          UI Runtime
```

## 二、Component ID 编号规则（身份证三属性）

```text
component_id（平台级身份——**不表达供应商**！）
  + contract_version（该 ID 当前的契约版本）
  + provider_id（提供者单独记录：core / vendor.xxx）

UI-000001~000xxx = 公共组件（官方维护）
UI-010001+        = 第三方自定义（上传并经 Validation 获得）
```

- **component_id 永不复用**（删除后 ID 作废，不重新分配）
- 版本升级同 ID（1.0→1.1→1.2——MCP 绑定不变）
- 绑定总是 `{component_id, version_range}`——**绝不绑 impl**（impl 是 Resolver 的事——与 v5.0「页面只依赖 Contract」一致性）

## 三、公共组件 vs 自定义组件（上架二选一）

```text
MCP 上架时声明 UI：
  ○ 使用公共 UI 组件 → { component_id: "UI-000002", version: "^1.2.0" }
     （天气 MCP → UI-000002 按钮 + UI-000005 信息卡 = 直接复用标准组件）
  ○ 使用我的 UI 组件 → 上传 → Validation → 获得新 ID
     （代码助手 MCP → UI-010025 → 上架绑定 UI-010025）
```

- MCP=功能提供者；UI Component=平台标准资源——**MCP 不是「自带 UI」，是「绑定/贡献 UI」**（防 MCP 生态碎片化）

## 四、MCP 安装流程（安装 MCP ≠ 安装 UI）

```text
MCP A 绑定 UI-000002 → 安装时检查 → 本机已有 → 直接复用
MCP B 绑定 UI-010025 → 安装时检查 → 本机没有 → 安装 UI Component Package
                        → Registry 注册 → 启用 → 绑定生效
（UI 本身=可安装资源）
```

## 五、与 v5.0 收敛（大神建议：不再加复杂项）

**收敛掉**：MCP provider priority 竞争 / provider 自定义 component_id 身份 / 每个 MCP 自己定义身份——
**保留**（v5.0/v1.0 有效）：ComponentContract+Presentation（九字段）/ VariantContract / UISchema / State 五值 / Selection Intent（用户选择最高）/ 四态 / render-only 七禁 / CI 断言（不可绕过 Registry）/ 版本四层 / Token Namespace。

```text
v2.0 简化后链：
  Catalog → Component ID → Component Contract → Implementation → Registry → Runtime
MCP 上架：声明需要哪些 Component ID → 安装检查 → 不存在则安装/授权 → 存在直接复用
```

## 六、UPG-50 组件库 = Catalog 的「选择视图」

```text
UI-000002 · 按钮
  [圆角] [方角] [MCP 提供的特殊形态]
UI-010025 · 文件选择器（提供者：XXX MCP）
  [标准] [紧凑] [网格]
点击 → Selected Variant → AppearanceProfile → Resolver → Runtime
```

- **每组件一行+横向形态卡依然成立**——现在「组件从哪来」被 Catalog 真正解决
- 提供者标记（公共=core / 第三方=XXX MCP）

## 七、验收（v1.0 V6-* 保留 + 新增）

V7-1 Catalog 两层（Catalog 合法清单 vs Registry 本机状态语义隔离）
V7-2 ID 编号（ID 不表达供应商；provider 另记；ID 永不复用——复用旧 ID 注册拒）
V7-3 上架绑定（MCP package 绑 component_id+版本范围；绑 impl=拒）
V7-4 公共复用（绑定 UI-000002 本机已装→直接复用零 UI 安装）
V7-5 自定义获得新 ID（上传→Validation→UI-010xxx 分配）
V7-6 UPG-50 目录渲染（每行 UI-ID·名字·形态卡·提供者标记）


---

## 九、v2.1 补死 7 点（大神 #48 · 9.7/10）

### 9.1 P0-① Component ID Authority（谁有权分配）

```text
只有 Catalog Authority 可以签发正式 component_id——Provider 不得自行生成平台正式 ID
本地开发/测试 ID 与正式 ID 命名空间隔离（dev-* / UI-*）
ID 一经签发，永久占用，不复用

生命周期：Draft ID → Validation → Catalog ID → Publish
```

### 9.2 P0-② 四层身份（ID ≠ 语义类型 ≠ 形态 ≠ 实现）

```text
component_id     = UI-000002        （平台身份——协议概念）
semantic_type    = button            （语义类型——做什么）
variant_id       = rounded/square     （形态——长什么样）
implementation_id = core.button.v3    （实现——怎么做的）
（四层正交——Variant Contract/Resolver 各管各层不再混）
```

### 9.3 P0-③ MCP 只绑 ID + Contract Range（禁绑 impl）

```json
{ "component_id": "UI-000002", "contract": ">=1.2 <2.0" }
```

- Resolver 找满足 Contract 的当前 implementation——MCP 正常工作（用户换了 impl 也无所谓）
- 特殊能力需求用 `required_capabilities` 表达——**禁止**「必须用 vendor.A 的 impl」（否则=组件供应商绑定，退化为插件绑架）

### 9.4 P1-④ Presentation 文案/i18n 契约

```text
name/description 改为可本地化资源引用：
  display_name_key / description_key / icon_asset_id
（平台 i18n/Asset Registry 处理——中文/English/日本語 由平台管，MCP 不塞最终字符串）
```

### 9.5 P1-⑤ UISchema Version

```json
{ "schema": "mov.ui", "schema_version": "1.0", "type": "button", "props": {}, "children": [] }
```

**Schema 是比实现版本更敏感的兼容边界**（第三方生态上线后核心——Runtime 按 schema_version 解析）

### 9.6 P1-⑥ Owner/Maintainer/Lifecycle（谁拥有组件）

```text
owner / maintainer / source / lifecycle_status
（MCP A 停止维护=可追踪/接管/迁移——Catalog 不成「没人管的组件坟场」）
```

### 9.7 P1-⑦ 生命周期状态（撤销/冻结机制）

```text
Catalog Status:
  Draft → Published（正常）
  Deprecated  = 还能运行，不推荐新安装
  Suspended   = 禁止新启用，可强制 fallback（发现问题即挂起）
  Retired     = 不允许运行，迁移到替代组件
```

### 9.8 术语微调（大神 §十二）

```text
Component Catalog（平台合法清单）
    ↓
Component Registry（本机已装/启用）
    ↓
Appearance Selection View ← UPG-50（用户看到的=当前可用组件+可选形态的选择界面）
（不要叫 UPG-50 = Catalog——防「市场是不是 Catalog/组件库是不是 Catalog」混词）
```

## 八、模型假设注释

`<!-- v2.0 假设：①Catalog=平台级标准目录（ID 平台分配——MCP 不匿名）；②两层（Catalog/Registry）语义隔离（「合法」 vs 「本机已装」）；③MCP 绑定编号不绑实现（impl 由 Resolver 解析——升级零 MCP 修改）；④ID 永不复用（删除作废——稳定性最大化）；⑤公共/自定义二选一（复用 or 贡献——生态碎片化防住）；⑥收敛=简化（不再加 provider 身份竞争——身份已平台化解决）-->`
