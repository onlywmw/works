# DELIVERY_UPG91_2026-09-04 · UPG-91 我的资产页注册制重排（demo v6 终版）

> 程序员：C（Claude/wmw0027）｜ 认领登记 @2026-09-04 00:3x（工单库 UPG-91 卡）｜ 结论：**重排+假数据删除+令牌迁移全落 + 契约锚 4/4 + 4 变异亲杀 + 全量 752/0/1——待验收员验收（真机实拍五场景=验收员持有）**

---

## 〇、交付绑定（SYS-01 P0-2 · 红线 23）

```yaml
delivery_id: DEL-UPG91-20260904-001
standard_id: STD-UPG-91-v1   # content_sha256=03b497ecd4dbc74ae77ab1ca0de9aab3523bacf5abbd9a8a548edb78450456ae
code_commit_sha: 34a2dda     # feat/upg91（基 main 43e5756；施工 4d1449b → R1 形态消费修复 34a2dda → 锚④强化）
artifact_sha: （R1 后 assembleDebug 绿；APK hash 验收构建时重算）
evidence_manifest_sha: 见 处理中心/delivery_UPG91_manifest.json
```

- verify-hash 交付时点 = `HASH_REJECT not-ancestor`（分支未合态必然——同前例，合后复跑=终态）。

## 一、施工内容（六件 · demo v6 终版照抄）

1. **tab 导航**（demo v6 下划线 tab 栏）：凭据（真实计数=credGrouped 字段求和）/ 证件照（0/2）/ 未上线类目灰显（tab.off）；计数=真实条目数（锚④双断言：模板插值 `{{ c.count }}`+`credGrouped.value.reduce` 求和逻辑）；点切类目。
2. **二级收缩组行**：平台组行默认收起「微信 · 1 项 ›」（`opened = ref({})` 初始空态——锚③）；点击展开明细行（label+脱敏值，hairline 分隔）；`chev` 旋转动画。
3. **点值脱敏往返**：删 👁 按钮（Icon eye 退役）——点脱敏值=`asset.credPeek`（→vault.get 审批链不变）真值显示（white-space:pre-line 多行「账号：…\n密码：…」），再点=收回 mask（`revealed` 往返态）；桥语义零改动。
4. **诚实空态**：桥空/桥不可用=纯文字「还没有任何资产」+「只存在这台设备上，读取时每次需你确认」+「添加凭据」主按钮；**`demoBridge` 假数据回落整段删除**（桥空永不演示充数——红线 18 同族根治）；浏览器预览态同样诚实空态。
5. **令牌迁移**：AssetsPage.vue 全部硬编码色值清零（#eef7f4/#1c7a5f 绿横幅**消亡**、#fff/#eceff4/#222/#999/#8a94a6/#f4f7fa/#eef1f5/#f2f4f8/#dfe4ea/#334/#98a2b3/#4c88ff/#cfd6df/#05070a 全清）——样式全走 tokens 变量（var(--text/text2/text3/line/primary/bg)）；连 CSS var fallback hex 也清除（彻底单源）。
6. **零图标**：Icon 组件 import 与全部 `<Icon>` 用法删除（用户拍板零图标纯文字线框）——**产物 Icon chunk 消失实证**（vite build 后 assets 页产物无 Icon-*.js）。

**不动**：AssetsSheet 宿主/白名单/vault.get 审批链/credPeek 桥语义/其他页面（红线 2 兑现）。

## 二、R1 修复（UPG-50 1C 组件契约——全量回归发现）

首版重排删除了 acardVariant/alistVariant 形态消费 → AppearanceContractTest L2-9（「资产页经 ui.getProfile 读唯一真相」）红。**修复**：v6 结构不弃机制——
- `acardCls`（UI-ASSETS-CARD 形态）绑 tab 条；`alistCls`（UI-ASSETS-LIST 形态）绑组行列表；
- `ui.getProfile` 形态回读恢复（onMounted，浏览器预览回落 standard）。
commit `34a2dda`——**AppearanceContractTest 零回归**。

## 三、亲杀锚（4 锚 · 全红实录）

| 锚 | 变异动作 | 结果 |
|---|---|---|
| 锚①（假数据回落恢复） | 恢复 demoBridge 函数+桥空回落调用 | AssetsPageContractTest 4 跑 **1 红**（demoBridge 标识符在场） |
| 锚②（硬编码回潮） | tabs 样式塞回 `#eef7f4/#1c7a5f` | 同套件 **1 红**（硬编码色值断言） |
| 锚③（组行默认展开） | `opened = ref({ __all: true })` | 同套件 **1 红**（opened 初始空态断言） |
| 锚④（tab 无计数） | 删模板 `{{ c.count }}` 渲染行 | 同套件 **1 红**（渲染插值+求和逻辑双断言——首版锚④断言弱被实测发现后**强化补杀**） |

还原后定向复绿 + 全量复绿。**锚④过程注记**：首版锚④仅断言求和逻辑形态，删渲染行的变异逃逸——实测暴露后强化为「渲染插值+求和逻辑」双断言（测试有效性升级在案）。

## 四、真机/模拟器走查——验收员持有（如实申报）

- 程序员侧完成：产物链（vite build+sync-pages 103 文件入库哨兵零越界）+ assembleDebug 绿 + 契约锚全绿；
- **真机实拍五场景**（有数据态/组行展开/点值往返/空态/深浅色）转验收员 L3 走查——本单开发时段真机平板被第三方应用占用（U87 时已实证），模拟器走查未覆盖 BottomSheet 交互链（AssetsSheet 75% 弹层宿主），不虚报。

## 五、测试面（XML 计数 · 2026-09-04 01:0x 统计时点）

| 面 | 结果 |
|---|---|
| 定向 | AssetsPageContractTest **4**（四锚）+ AppearanceContractTest（L2-9 形态消费）零回归 |
| 全量 | `:app:testDebugUnitTest --rerun-tasks` **103 套件 752/0/1 全绿**（0 失败基线；748[U88]+4[U91 契约]=752） |
| 构建 | vite build ✓ + sync-pages ✓（103 文件入库）+ `:app:assembleDebug` 绿 |

## 六、Token / KV 两节申报（0/0）

- **Token**：资产页为 WebView 内页面（不经 agent 工具面/提示词）——Token 0；页面减重（Icon chunk 消失）反而降低加载体积。
- **KV**：0——无新 prefs/存储面（脱敏往返为内存态）。

## 七、共享面影响清单 + 能力护栏（红线 24）

```yaml
## 能力护栏（P1-1）
共享面影响清单:
  - 共享面: 资产页面（AssetsPage.vue）+ 页面产物（assets/pages/assets/）+ UPG-50 1C 形态消费面（R1 恢复）
  - 影响下游: AssetsSheet 宿主（白名单/桥协议零改动——页面侧重排）/ AppearanceContract（形态消费恢复后零回归）/ vault.get 审批链（credPeek 桥语义不动）
  - 回归说明: 全量 752/0/1；AppearanceContractTest L2-9 零回归（R1）；UPG-50/70 组件契约套件零回归；demoBridge 删除经锚①锁定
coverage_status: FULL
```

## 八、已登记两个表

① `工单表.xlsx`（sync 投影，UPG-91 行）；② `工单库.md` UPG-91 卡交付块。报告落 `程序员\交付报告\DELIVERY_UPG91_2026-09-04.md`。

---
*程序员 C · 2026-09-04 · worktree mov-upg91 可随验收流程收*
