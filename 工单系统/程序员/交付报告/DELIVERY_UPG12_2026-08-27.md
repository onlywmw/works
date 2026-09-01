# UPG-12 交付报告：WebView 引擎预热 + 页面加载占位

**程序员**：C ｜ **日期**：2026-08-27 ｜ **分支**：`feat/upg12` @ `ce3336f`（f36ad4b 主实现 → ce3336f 测试增强）
**依赖声明**：本分支**堆叠于 feat/upg11 之上**（引用 `PrivacyGate` 常量与合规语义）——合 main 顺序必须 **UPG-11 先、UPG-12 后**；APK=upg11 三 commit + upg12 两 commit 全量产物。
> **已登记两个表**（先表后库）；报告落 `程序员\交付报告\`。Token/KV：不涉 LLM 链路，无影响。

---

## 一、施工内容

| 批 | 内容 | 文件 |
|---|---|---|
| 批1 | `WebViewWarmup`：决策纯函数 `decide()`（JVM 可测）+ `warmIfNeeded()`（幂等 dummy WebView、仅 about:blank）+ 进程级持有防 renderer 回收 | `WebViewWarmup.kt` 新增 |
| 批1挂点 | MainActivity.onCreate consent 兜底块之后 `postWarmup(this)`——未同意分支先行 return=顺序合规第一层；warm 内部二次校验 privacy_agreed_v1=第二层 | `MainActivity.kt` 仅插一行 |
| 批2 | SettingsSheet：ProgressBar 居中悬浮 + 底色浅色对齐页面 s0=`#f3f4f7`（消色差跳变），onPageFinished 即撤 | `SettingsSheet.kt` |
| 批2 | WebPageSheet：外链页中性 spinner，onPageFinished 即撤 | `WebPageSheet.kt` |
| 红线遵守 | `assets/pages/*` 零触碰（测试内置 git 哨兵断言）；不引入远程 URL；不改 PagesBridge 白名单 | — |

## 二、⚠ 方案假设的实测修正（对设计师派单假设的申报）

工单背景假设「进程首个 WebView = 点设置页时创建」，实测源码发现 **MainActivity.onCreate :912 无条件创建 sidebarWeb 并 :956 loadUrl(sidebar.html)** ——Chromium 引擎初始化在启动期已被侧栏提前付掉。因此：

- 白屏主因实为 **renderer spawn + settings.html 解析/Vue 首帧渲染**（数百 ms 级）而非引擎 cold start；
- 批1 warmup 的真实收益 = 提前触发 renderer 导航管线预热（about:blank 轻量导航让 renderer 进程起好待命）+ 幂等一次付清；
- 设置页视觉白屏治理的主力是批2 占位（sheet 打开瞬间即见 s0 同色底+spinner，无任何空窗帧）。

不建议删批1：renderer 预热收益真实且成本≈0；如设计师判断不值，可单独摘除批1（挂点单行+文件独立，不影响批2）。

## 三、L1 验证

- `gradle :app:testDebugUnitTest :app:assembleDebug` BUILD SUCCESSFUL（236 tests 全绿含新增 8 用例），APK 出包成功。
- 变异亲杀三案（JUnit console 直跑，规避 Gradle up-to-date 假绿——upg11 已踩过）：
  - VAR-1 删预热调用 → Failures: 1 红 ✓ 还原绿
  - VAR-2 把预热挪到 consent 兜底之前 → 顺序断言红 Failures: 1 ✓ 还原绿
  - VAR-3 删 onPageFinished 占位隐藏 → 契约红 Failures: 1 ✓ 还原绿
  - 终态 OK (8 tests)

## 四、L2 真机（emulator-5554）

证据目录 `验收员\证据数据\UPG-12\`：

- `UPG12_L2_settings_loading.png`：点开设置瞬态（s0 同色底+spinner 占位可见，非纯白空窗）
- `UPG12_L2_settings_ready.png`：~3s 就绪帧，设置页完整渲染（外观/关于 V1.0/退出登录/MCP 工具市场/我的能力 控件 dump 齐全）
- `UPG12_rec_after_upg12.mp4` / `UPG12_rec_before_upg11.mp4`：同操作序列冷启→开抽屉→点设置的录屏对比素材（优化前/后），供验收员逐帧对账「白屏时长缩短」
- 抽查回归：设置页打开后功能面完整显示；市场页此前 W-02 验证已复核可开。
- `UPG12_logcat_warmup_startup.txt`：upg12 包冷启 logcat——WebViewFactory/libmonochrome 加载时间戳在启动期（02:34:01，早于任何 sheet 打开）。

## 五、L3 飞行模式 ✓

`cmd connectivity airplane-mode enable`（airplane_mode_on=1）下重进设置页：完整渲染（ui dump 特征齐全）+ 本进程 logcat 零网络错误（UnknownHost/SocketTimeout/ConnectException 计数=0）。截图 `UPG12_L3_airplane_render.png`。实验后飞行模式已关闭还原。

## 六、透明申报

1. 批2 施工面按工单点名只做 SettingsSheet/WebPageSheet 两容器；其余页面（market/model/orders 等）既有容器已有各自底色，本单为控风险未扩散，如需全覆盖另立小单。
2. 录屏对比的「逐帧量化毫秒数」因模拟器软渲染抖动不做硬数字承诺，由验收员以录屏主观时序复核为准；客观辅助=logcat 时间戳法（加载 libmonochrome 与 sheet 打开的相对时刻）已在案。
3. 模拟器 input 事件命中率低导致取证轮次偏多，属设备态问题非 App 问题（每步均有 fresh dump 对账）。
