# UPG-103 MainActivity 拆分·批④ chips/胶囊面搬移（→ ui/chips/ + ui/capsule/）

> 单号：UPG-103 ｜ 优先级：P1 ｜ 分类：M2 体系/治理 ｜ 标签：M6 架构 ｜ 派单：设计师B @2026-09-04
> 依据：`MainActivity拆分蓝图_v1.md` §二/§三（批④=chips 气泡 + 主页胶囊）；`MainActivity拆分计划书_v1.2` §四批表 + 目录结构（ui/chips/ + ui/capsule/）
> STD：`STD-UPG-103-v1`（sha=ad36a5fd92356ce0b4634f8ffd8dc6093930663b86008e2b0d6db0aa978f22f0，本题冻结版）

## 一、范围（两块 · 纯搬移零逻辑改动）

基准：origin/main `cfa7d607`（UPG-102 已合）——**行号需重核**（蓝图行号为 @254d6ca 锚，搬移后整体前移，先核实再动）。

1. **chips 气泡**（蓝图 :945）——组列表两级气泡（分组展开/收起/唯一选中态）
2. **主页胶囊**（蓝图 :1352）——pin 只存 stableId/pinType/preset；局部 fun `pinServers`/`pinSchemaOf`/`readPinList`/`writePinList`（+随行连带：写路径、schema 校验、preset 应用）

目标模块：`ui/chips/` + `ui/capsule/`（新目录，命名/包结构照 UPG-93 的 `tools/` 分层先例）。

**跨面收编**：`market.uninstall` 跨面读/写胶囊 pin 列表（readPinList/writePinList）——批④收编时归位：market 侧只保留对该模块导出接口函数的调用，不直接操作胶囊内部状态（若已闭参数化则复核签名并申报零改动）。

## 二、接口契约（过 UPG-89 评审）

- 搬出模块接口挂点经 **UPG-89 契约定稿**评审（执行串行、接口并行——批④⑤输入）；接口面冲突→停下报设计师，**不许自定**
- P0 约束：Feature/Registrar **禁止长期持有 Activity**（install/register 完成即释放引用）；ToolsRegistry 防二 God File（只聚合/顺序/公共注册契约，不承载具体 handler）

## 三、红线（违反=打回）

1. **纯搬移零逻辑改动**——优化/顺手修另立单
2. MainActivity 纯 CRLF；搬出后壳内只留装配点一行调用；**装配点注释「UPG-103 装配点」**
3. 军规 7/8 运行中：零新增壳内代码（装配点除外+豁免注记）；ui/ 模块零 Activity 依赖
4. **sha256 冻结范式（本批起强制）**：拆前基线（搬移区域逐块 sha256 清单）→ 搬移后逐块全等断言常驻（UPG-93/98 范式；UPG-102 挂账落地）；契约锚=sha256 冻结清单+名单完备+唯一写点
5. **生命周期回调归属策略先定再动手**（计划书 §三 7.10）：onRequestPermissionsResult/onActivityResult 相关回调归属=搬出模块；归属漂移=打回
6. 债务清单随批附（只记录不修）；Token/KV 两节必报（预期 0/0——chips/胶囊面若触及字段申报）
7. 提交版=验证版：交付前全新检出（clean worktree）复跑编译+全量（0 失败硬门槛）
8. 冷启动锚：拆前后各 5 次采样取中位，Δ>10% 标红须解释
9. 真机冒烟三场景（STD：chips 两级气泡/主页胶囊增删持久化/market.uninstall 归位后行为一致）

## 四、测试与真机（STD-UPG-103-v1）

- 变异锚 4 组亲杀：sha256 冻结清单（块内改一行必红）/ 名单（漏搬/伪挂必红）/ 唯一写点（壳内伪搬移必红）/ 生命周期归属断言
- 定向用例：ChipsCapsuleSplitContractTest（照 UPG-93/98 契约锚范式）
- 真机 L3：三场景+冷启动（细节见 STD）

## 五、交付与登记

报告落 `程序员\交付报告\DELIVERY_UPG103_<日期>.md`（sha256 冻结清单全等表 + 4 组亲杀 + 冷启动双采样 + 真机截图 + 债务清单 + Token/KV）
DEL manifest 绑定 code=分支头/artifact=APK sha256/manifest 见案（红线 23 范式）；交付后登记两个表（先库后表，sync-orders --check 零差异）。
