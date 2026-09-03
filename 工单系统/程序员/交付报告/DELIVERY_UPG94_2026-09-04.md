# DELIVERY_UPG94_2026-09-04 · UPG-94 极简主页真机观感修复（dock 隐藏 + logo 去框去影 + hint 删除 + 发送钮归 token）

> 程序员：C（Claude/wmw0027）｜ 认领登记 @2026-09-04（工单库 UPG-94 卡）｜ 结论：**四件全修 + 契约锚 4 + 变异锚 2 亲杀 + 全量 106 套件 763/0/1 + 模拟器截图场景实证——待验收员验收**

---

## 〇、交付绑定（SYS-01 P0-2 · 红线 23）

```yaml
delivery_id: DEL-UPG94-20260904-001
standard_id: STD-UPG-94-v1   # content_sha256=4fca8e5dae1c9d69b27970f6f4f0e2d88b398b5af222e21b5d19043d492ada28
code_commit_sha: 746b20ec    # feat/upg94（基 main fe258949=UPG-89 已合；施工 033ecc24→index.html 修正 746b20ec）
artifact_sha: c77d3dc2e1a7a3a9（APK 全 sha 验收构建时重算；当前构建 c77d3dc2…=56289653B 量级）
evidence_manifest_sha: 7aeeea056aaf21a96f16dc1b0cdf580ef867ee189b74a1d9495657c565ca5534   # 处理中心/delivery_UPG94_manifest.json
```

- verify-hash 交付时点 = `HASH_REJECT not-ancestor`（分支未合态必然——同前例，合后复跑=终态）。

## 一、施工内容（四件）

1. **dock 隐藏**（MainActivity.kt）：dock 字段化（`dockView` 字段 + :923 构建处赋值）→ `applyPresentationMode` 极简分支补 `dockView GONE`、经典分支补 `VISIBLE`——根因=dock 从未进隐藏清单（UPG-88 交付缺件），homeWeb 又 append 在它后面，dock 飘顶。**军规 7 豁免注记**：修既有装配行的可见性路由，非新增面（纯 CRLF 保持）。
2. **logo 零装饰**（assets/home/index.html #heroLogo）：删 `border-radius: 32px` 与 `box-shadow`（含 `body.listening` 绿环投影拆除；**呼吸 scale 动画保留**）。logo.png 透明底未动。
3. **heroHint 删除**：节点 + CSS 零残留（`#heroHint` div 与样式行全删）；input placeholder 保留（功能件）。
4. **btnSend 归 token**：`var(--brand)` 薄荷绿 → **v1.2 §一 纯黑 pill**（`--pill-bg: #111111/--pill-fg: #ffffff`；深色媒体查询反转 `#f2f2f2/#111111`）。

## 二、变异锚（2 · 全红实录）

| 锚 | 变异动作 | 结果 |
|---|---|---|
| dock 路由锚 | 删 applyPresentationMode 极简分支 dock GONE 行 | MinimalHomePolishContractTest「极简分支 dock GONE 缺失（删此行本锚红）」**RED** |
| hero 装饰锚 | 还原 box-shadow/heroHint 节点 | 「heroLogo 投影回归」「heroHint 节点残留」断言 **RED**（实杀过程：注释措辞 heroHint 字面误伤→注释改述后锚口收紧；深色 pill 断言匹配实况修正——均测试侧） |

## 三、截图四场景（模拟器 emulator-5556 · MOV_Test）

| 场景 | 实证 |
|---|---|
| 极简 dock 不可见 | 极简主页 dump：texts=「MOV/经典/MOV · 点按说话/↑」——**dock 零元素**（chips/composer/hint 全不在）；截图 ev94_minimal_dockgone.png |
| 经典 dock 原样恢复 | 切回经典 → dump 恢复经典组件全集（chips/输入/对话流）；截图 ev94_classic_restored.png |
| logo 无牌无影 | CSS 层面锚（零 border-radius/box-shadow/绿环断言）+ 透明底 png 未动 |
| 无 hint | heroHint 节点+CSS 零残留断言 + placeholder 保留断言 |

（截图 2 张落 `程序员/UPG94-evidence/`；四场景完整目测走查=验收员持有。）

## 四、全量回归

| 面 | 结果 |
|---|---|
| 全量 | `:app:testDebugUnitTest --rerun-tasks` **106 套件 763/0/1 全绿**（0 失败基线；759[U89]+4[U94 契约]=763） |
| 构建 | `:app:assembleDebug` 绿（APK sha 前 16=ba3d877d） |
| CRLF | MainActivity.kt 纯 CRLF 保持 |

## 五、Token / KV 两节申报（0/0）

样式 token 迁移（--pill-bg/--pill-fg 新增 CSS 变量）与 dock 可见性路由——无 LLM/提示词/工具面变化；KV 无新增（视图态内存）。

## 六、共享面影响清单 + 能力护栏（红线 24）

```yaml
## 能力护栏（P1-1）
共享面影响清单:
  - 共享面: MainActivity applyPresentationMode（视图路由）+ dock 装配行可见性 + assets/home/index.html
  - 影响下游: 两态开关（经典⇄极简视图路由补全 dock 维度——UPG-88 隐藏清单缺件补齐）；home.html 呈现（观感修复不改引擎/桥协议）
  - 回归说明: 全量 763/0/1；HomePresentationContractTest/AssetsHomeEngineContractTest/Upg84ModeConverge 零回归；经典视图恢复原样（截图②）
coverage_status: FULL
```

## 七、已登记两个表

① `工单表.xlsx`（sync 投影，UPG-94 行）；② `工单库.md` UPG-94 卡交付块。报告落 `程序员\交付报告\DELIVERY_UPG94_2026-09-04.md`。

---
*程序员 C · 2026-09-04 · worktree mov-upg94 可随验收流程收*
