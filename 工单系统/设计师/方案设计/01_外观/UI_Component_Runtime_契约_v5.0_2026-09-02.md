# UI Component Runtime 契约 v5.0（consolidated · 单一事实源）

> 设计师 @2026-09-02 ｜ **v5.0 = 合并稿**（大神点名 consolidation：v3.1→v4→v4.1→v4.2 四层引用链已暴露出不一致——本文件合并全部有效条款+评审修订，**日常开发只看本件**；旧文档（v3.1/v4/v4.1/v4.2）仅作历史追溯）。
> **评审基线**：大神 v4.2 评审（架构 ★5/契约 ★4/安全一致性 ★2 需立即修/生态 ★3/可用性 ★3/可维护 ★2/配合度 ★4）——「CI 矛盾不能带病交接」。
> ⚠️ **配套件（大神 #46 · 9.4/10）**：**Catalog+上架绑定（大神 #47 突破）**：`UI_Component_Registration_Contract_v2.0_2026-09-02.md`——UI Component ID=平台级身份（Catalog 合法清单/Registry 本机状态两层；MCP 绑 ID 不绑 impl；公共复用/贡献获新 ID）——取代 v1.0 的「provider 自定义身份」收敛；v5.0 管「怎么跑」、v2.0 管「谁合法/怎么上架/怎么被消费」。

---

## 〇、一句话

**页面只依赖 ComponentContract（永不直接依赖 impl）；实现可换、契约不能换；MCP UI 走注册制开放（统一规范、不统一创意）——本件=全部有效条款唯一权威。**

---

## 一、四件钉死（v3.1·v4·v4.1 继承）

| # | 钉死项 | 内容 |
|---|---|---|
| ① | **ComponentContract** | 八字段（component_id/props_schema/events_schema/slots_schema/state_schema/accessibility_contract/lifecycle_contract/capability）；**依赖方向：页面→Contract→impl**（页面永不 import impl 符号——工程不变式）；props/accessibility 注册校验（不一致即拒） |
| ② | **Capability Check** | required 缺失→fallback default；optional 缺失→可用但入口灰显（诚实降级链） |
| ③ | **State Ownership** | **状态属于 Component 不属于 Impl**；Impl 只收 props/state+发 events（纯渲染实现） |
| ④ | **Override Resolution** | 页面局部>区块>原子>全局>Default（CSS specificity 类比）；**同级冲突 v5.0 改「确定性≠必须报错」**（见 §四） |

## 二、MCP UI 门户开放（v4.2 → 并入）

**UI 最高原则（四条）**：任何 MCP 都可以提供 UI；任何 UI 都必须以组件身份进入 UI Registry；任何注册组件都必须遵守统一 UI Contract；Runtime 负责生命周期/主题/状态/权限/版本/兼容。

- **两种注册**：A. Existing Component Variant（core.input→vendor.xxx.input.cyber）/ B. New Component（vendor.xxx.codeEditor）
- **Token Namespace 隔离**：MCP 自己的设计语言 → 映射到 Theme System——**有自己的风格、不污染全局 token**
- **契约管什么**：接入/渲染/交互/换主题/声明能力/状态/版本/退出；**不管**：圆角 8px/阴影/像官方——统一规范不统一创意

## 三、CI 门禁（v5.0 修订 · 修正 v4.2 矛盾 · 大神①）

```text
v5.0 CI 断言（与注册制开放一致）：
  ✅ 禁止绕过 Registry 直接渲染外部组件（bypass 路径 = 0）
  ✅ 注册路径必须经过 Contract Validation + Capability Check
  ✅ externalProvider 只能通过 Registry 激活（不允许直接 DOM 注入/不允许全局 token 污染）
  ❌（旧断言作废）MCP: component registration = 0 —— MCP 可以注册，但必须走注册闸门
**安全边界：不是「不可注册」，而是「不可绕过注册制注册」。**
```

## 四、Override Resolution（v5.0 修订 · 大神③）

```text
同级重复配置：
  ① 按 provider 优先级确定性排序（BuiltIn < Developer < 用户手动选择）
  ② 冲突提示（「两个提供者都想覆盖 input，已自动选择 X，可在设置中调整」）
  ③ 报错仅剩真不可自动裁决时（两 provider 同优先级）
**确定性 + 可解释的自动裁决 > 报错**
```

## 五、分级注册（v5.0 新增 · 大神④ · 生态友好）

```text
L1 轻量注册：component_id + minimal props + 无状态 + 无自定义能力
   → 自动获得 default accessibility/lifecycle（展示型小组件/纯视觉变体）
L2 完整注册：状态/能力/事件全声明（交互复杂/业务逻辑组件）
（L1 仍过 Registry 校验——安全不减，门槛降低）
```

## 六、State Adapter 三态（v5.0 修订 · 大神② · 第一批实施）

```text
① 业务语义状态（selected/expanded/favorited）
   → 跨 impl 保留，但 Impl 注册时**必须声明语义映射**「我如何处理 expanded」
   （不声明 → Registry 注册时警告/拒绝——状态名相同≠语义可自动迁移）
② 持久化配置状态（偏好/草稿）
   → Component 层持有，impl 只读不写
③ UI 瞬态（滚动/动画帧/焦点）
   → 不迁移，remount 后重置
```

## 七、版本协商（v5.0 最小集 · 大神⑦）

```text
- impl 声明兼容的 Contract 版本范围（如 ">=1.0 <2.0"）
- Registry 只激活与当前 Contract 版本兼容的 impl
- 不兼容 impl → 自动 fallback default + 升级提示
- 多 impl 同 component_id：版本高优先 + 用户手动覆盖（升级/降级提示）
```

## 八、render-only 预览模式（v5.0 新增 · 大神⑤ · 与 U50 打通）

**Lifecycle Contract 增加模式标记 `render-only`**：

```text
挂载并渲染（真实实例保真）、不响应交互事件、State=初始/预设展示值、不注册事件监听
→ U50 预览卡基于此模式实现（防预览状态污染/交互干扰）
```


## 八-B、形态展示策略（v5.0 新增 · 防「MCP 涌入滑不过来」）

**问题**：注册制开放后，同一组件形态可能被大量 MCP 提供（3→8→20+）——「横铺+左右滑」在形态多时变成滑不完。

**分级展示规则**：

| 形态数 | 展示方式 |
|---|---|
| ≤3 | 横铺直接展示（核心交互不变） |
| 4~6 | 横滑 + **页码圆点**（一屏一页/可见全貌） |
| >6 | **点击展开网格**（2-3 列卡片：名字+预览+选中——浏览式，弃左右滑） |

**双层结构（根本解）——组件库页 ≠ 全量组件**：

```text
外观组件库（默认视图）
├─ 官方精选（≤5 个/组件，官方维护——不膨胀）
├─ 热门/最近使用（MCP 组件按使用量/最近排序——常看在前）
└─ 「组件市场」入口（全量：搜索 + 分类 + 筛选 + 安装/启用——应用商店式管理）
```

- 用户「选择疲劳」由**搜索/市场管理**解决，不是无限横滑
- 「选中即替换」核心不动——只是展示层按数量升级
- **运行时只加载已启用形态**（组件市场管理「启用集」，未启用不进选择页——性能+页面洁净双赢）

## 八-C、与「我的资产」同构（注册表模式复用）

```text
AssetKind Registry（资产）  ←同构模式→  UI Component Registry（组件）
    类目即插即用（67-A）              注册即出现（选择页=Registry Explorer）
    市场管理（启用/停用）             组件市场（启用/停用）——MCP 涌入时的管理面
```

## 九、热替换契约（v3.1 继承 · 不变）

Runtime 级 hot replace：页面不重启/允许 remount/业务状态不丢（State Ownership）/UI 瞬态按组件级策略恢复重置。

## 十、验收判据（合并 · 判据编号沿用）

V4-1 注册不破坏 / V4-2' 热替换 Runtime 级 / V4-3 回滚 / V4-4 两级正交 / **V4-5' CI 四层（v5.0 断言——bypass=0/注册过校验/仅 Registry 激活/token 无污染）** / V4-6 状态矩阵 / V4-7 契约校验 / V4-8 Capability fallback / V4-9 状态迁移（含三态） / V4-10 Override（含冲突裁决） / V4-11 命名校验 / **V5-12 分级注册（L1 轻量过校验）** / **V5-13 版本协商（fallback+提示）** / **V5-14 render-only（预览卡无交互污染）**

## 十一、模型假设注释

`<!-- v5.0 假设：①合并稿=唯一事实源（旧文档归档不参与开发——consolidation 后防再分裂）；②注册制开放=强制走注册闸门（CI 断言同步——非互补矛盾）；③分级注册假设 L1 可满足生态轻量需求（大型供应商用 L2）；④版本协商最小集假设单版本线（多版本矩阵未来再扩）；⑤render-only 假设预览卡无状态交互（U50 真实实例保真）-->`
