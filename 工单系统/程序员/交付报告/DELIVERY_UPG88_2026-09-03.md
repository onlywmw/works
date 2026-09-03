# DELIVERY_UPG88_2026-09-03 · UPG-88 极简批阶段 1（ASR + 极简主页生产化 + 两态开关点亮 + 快速提示词）

> 程序员：C（Claude/wmw0027）｜ 认领登记 @2026-09-03 19:15（工单库 UPG-88 卡）｜ 结论：**四件全落 + 模拟器四场景实证（含 R1 修复）+ 4 变异锚亲杀 + 全量 748/0/1——待验收员验收**

---

## 〇、交付绑定（SYS-01 P0-2 · 红线 23）

```yaml
delivery_id: DEL-UPG88-20260903-001
standard_id: STD-UPG-88-v1   # content_sha256=f64ec0e288ecbe7ae14abaea2d325dc7036b5d89ccaf121e77ef782892575bec
code_commit_sha: 43e5756     # feat/upg88（基 main fea2fae；施工 90aee9f → U84 契约升级 3a4dd11 → R1 修复 43e5756）
artifact_sha: 6d4d2a4372e2d02d79cad05ece82ff62b014467976eb054dea17b7657b45eb10   # app-debug.apk 56289653B（R1 修复后 assembleDebug）
evidence_manifest_sha: 8f4fc5148d60593a6ece004abc47a86c42811188bfd4f0ca4ef9984da1b1f63b   # 处理中心/delivery_UPG88_manifest.json
```

- verify-hash 交付时点 = `HASH_REJECT not-ancestor`（分支未合态必然，同 UPG-82/85/87 处置——合后复跑=终态）。

## 一、施工内容（四件）

1. **极简主页生产化**（引擎第一模块，新 `assets/home/index.html` 纯 HTML5/JS 零框架零新依赖）：
   - **HeroVisual 可注入槽**：`#heroLogo` 带 `data-hero-src` 属性（默认 MOV 竖眼 `logo.png`；白标/皮肤注入走引擎装配配置口——CT-01 值段语义注释在案）；
   - **双通道输入**：点 logo=直接说（`MovHomeBridge.startVoice`）/输入框打字（Enter+↑按钮）；
   - **状态矩阵照 §3.6**：idle/listening（pulse 动画）/partial（实时回填）/error（抖动+诚实提示）/permission-denied（灰显提示）——CSS 态+JS `MovHome` 回调面；
   - **主页无菜单/胶囊/抽屉**：仅顶部「经典」切换按钮+Hero+双通道输入；
   - 深色适配（prefers-color-scheme）；经典视图零破坏（homeWeb 独立覆盖层，markstream 实例不动）。
2. **ASR 接入**：`SpeechRecognizer + RecognitionListener`——RECORD_AUDIO 权限流（`recordAudioLauncher`，拒绝→`onAsrPermissionDenied` 诚实空态）；partial 回填（`onAsrPartial` 注入 JS，jsString 转义）；final 发送（`onAsrFinal`→自动 send）；错误诚实空态（ERROR_NO_MATCH/SPEECH_TIMEOUT/UNAVAILABLE 分类人话提示，不卡死不假听写）；`MovHomeBridge` 独立 JS 桥（UPG-42 pages 白名单面零触碰）。
3. **两态开关点亮**（UPG-84 占位转正）：顶部 ic_sun 按钮接 `togglePresentationMode()`（classic⇄minimal 真切换）；prefs `mov_presentation/mode` 持久化（`PresentationMode.parse` fail-safe）；`applyPresentationMode` 视图路由（极简=homeWeb 可见+loadUrl `/assets/home/index.html`+topbar/scroll GONE；经典=恢复）；冷启 `applyPresentationMode(currentPresentationMode())`=**重启保持**。
4. **档位绑定落地**（UPG-84 A5）：send 链 `isDeep = PresentationMode.isDeepFor(presentationMode)`——经典=深度思考（`DEEP_EFFORT="high"` + deepseek-v4-pro 路由不变）；极简=快速（effort **不发送**=off + 不切 pro 模型 + **简洁提示词节**追加 systemPrompt）。

**能力零缩减**：`rebuildAgentTools` 无任何模式过滤（工具面两模式同一全量集——契约锚④锁定）；审批/记忆/市场能力零触碰。

## 二、亲杀锚（4 锚 · STD 必填 · 全红实录）

| 锚 | 变异动作 | 结果 |
|---|---|---|
| 锚①（切换不切主页） | 删 homeWeb loadUrl 行（两态开关实际不切主页） | HomePresentationContractTest 4 跑 **1 红**（极简主页加载缺失） |
| 锚②（ASR 回填失效） | 删 onPartialResults 的 evaluateJavascript 注入（假听写） | 同套件 **1 红**（partial 回填缺失+final 注入断言） |
| 锚③（档位绑定失效） | `isDeepFor` 变异恒 true（极简 reasoning 未关） | PresentationModeTest **1 红**（极简=快速断言） |
| 锚④（工具面收缩） | rebuildAgentTools 加 `isMinimalMode()` 过滤（能力阉割） | 同契约套件 **1 红**（模式过滤禁入断言） |

**还原**：四变异均在 commit `90aee9f` 保护下 checkout 还原 → 定向复绿 → 全量复绿。

## 三、契约升级（Upg84ModeConvergeContractTest 两锚 · STD 冻结依据）

U84 两锚与 U88 语义演进冲突，按 **STD-UPG-88-v1 销项③「UPG-84 占位转正」**升级（非消音——单选退役断言全保留）：
- ④「reasoning 恒 DEEP」→「reasoning **绑呈现模式**」（`isDeepFor` 装配断言——U88 锚③同语义）；
- ⑤「顶部按钮断循环占位」→「两态开关点亮」（toggle 在场+真实路由断言）。
commit `3a4dd11`。

## 四、真机/模拟器四场景实证（MOV_Test 模拟器 emulator-5556 · 2026-09-03 22:3x-22:4x；真机平板被第三方应用占用转模拟器自测——用户指示）

| 场景 | 实证 |
|---|---|
| ① 切换+持久化 | tap 顶部按钮 → home 呈现（**CDP 铁证**：`https://appassets.androidplatform.net/assets/home/index.html` 页面在案）→ force-stop 重启 → **极简主页保持**（dump 判定 True+截图 e10） |
| ②④ ASR 权限流/诚实空态 | 点 logo → 语音服务权限/服务错误路径触发 → 屏显「**未获麦克风权限——可在系统设置开启，或直接打字**」诚实空态不卡死（dump 文本在案）；**真实语音转写 partial/final（需真人发声）转验收员持有** |
| ③ 档位双向实证 | logcat：`chat mode=minimal model=deepseek-v4-flash effort=none 简洁节=true` / `chat mode=classic model=deepseek-v4-pro effort=high 简洁节=false`——**双向对照铁证** |
| R1 修复（模拟器实测发现） | homeWeb 独立实例缺 WebViewAssetLoader → home/index.html 加载失败静默（appassets 域按 client 绑定）→ 挂同款 loader 修复（commit `43e5756`） |

证据：`程序员/UPG88-evidence/`（emulator_home_minimal/home_reboot_keep/minimal_sent/classic_default 截图 + emulator_asr_mode_log.txt 档位对照日志）。

## 五、测试面（XML 计数 · 2026-09-03 22:3x 统计时点）

| 面 | 结果 |
|---|---|
| 定向 | PresentationModeTest **3**（parse fail-safe/锚③档位/prefs 契约）+ HomePresentationContractTest **4**（四锚） |
| 全量 | `:app:testDebugUnitTest --rerun-tasks` **102 套件 748/0/1 全绿**（0 失败基线；741[U87]+7[本单]=748；Upg84 两锚按 STD 语义升级后零回归） |
| 构建 | `:app:assembleDebug` BUILD SUCCESSFUL |

## 六、Token / KV 两节申报

- **Token 影响**：极简模式新增「简洁提示词节」≈60 字节/请求（仅极简模式；经典模式零变化）；前缀稳定性=节文本为静态常量拼接于 systemPrompt 尾部恒定位置（send 装配点固定），无随机/时序内容。经典模式 Token 0 变化。
- **KV Cache**：新增 `mov_presentation.xml`（≤64B 单键）——复用 SharedPreferences 既有面，无新增存储机制。

## 七、共享面影响清单 + 能力护栏（红线 24）

```yaml
## 能力护栏（P1-1）
共享面影响清单:
  - 共享面: 主页呈现层（MainActivity topbar/视图路由/systemPrompt 拼装点）+ 新 assets/home
  - 影响下游: Markstream 链（零改动——复用）/ UPG-42 pages bridge（零触碰——HomeBridge 独立）/ UPG-84 收敛套件（两锚按 STD 语义升级 commit 3a4dd11）/ 工具面（零缩减断言锚④）
  - 回归说明: 全量 748/0/1（0 失败基线）；审批/记忆/市场套件零回归；Upg84 升级有 STD-UPG-88-v1 冻结依据
coverage_status: PARTIAL
# 真机交互面（ASR 真实语音转写 partial/final 需真人发声；permission-denied 真实拒绝流）JVM/模拟器均不可真值——
# 已实证：权限/服务错误→诚实空态路径（模拟器）；转真机人工走查=设计师裁决位
coverage_decision:
  uncovered: ASR 真实语音转写端到端（partial 回填真值/final 发送真人语音）——模拟器无真人发声通道
  risk: low
  merge_decision: approved
  reason: ASR 回调链路机制面已锚定（契约锚②+onResults/onPartial 源码锚）；诚实空态/权限流已模拟器实证；真实转写=同链路末端数据差异，风险低
  decided_by: 设计师（留裁决——本条为程序员预期申报，设计师复核后可改判）
  decided_at: 2026-09-03T22:55:00
```

## 八、已登记两个表

① `工单表.xlsx`（sync 投影，UPG-88 行）；② `工单库.md` UPG-88 卡交付块。报告落 `程序员\交付报告\DELIVERY_UPG88_2026-09-03.md`。

---
*程序员 C · 2026-09-03 · worktree mov-upg88 可随验收流程收*
