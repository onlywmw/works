# 交付报告 · UPG-40 App 视觉风格统一 / 换肤标准 v1.1

- **交付人**：程序员 C
- **分支 / hash**：`feat/upg40` **f9e3f17**（基底 main 31769a0，已 push origin；`git ls-remote` 同 hash 实证）
- **日期**：2026-08-30 01:42
- **成果物**：换肤标准件（token 契约 + 皮肤值段），非一次性换色

---

## 一、实现（三刀）

### ① tokens.css → 契约段 + 皮肤值段（默认皮肤=候选C 冷调近黑）
- `:root`（浅色）：`--primary #0E7C5B→#23272F`、`--primary-strong #0A6649→#4A5158`、`--on-primary` 白、`--primary-text→#23272F`、`--primary-tint→rgba(35,39,47,.08)`；s0-s4/text/text2/text3/line 不动（已中性）；danger `#d92d20` **保留**（拍板④ 危险提示红保留=语义系统色）
- 语义色 mono 化：`--ok #0f8a5f→#2B3038`、`--warn #b45309→#7A4A2B`、对应 tint→中性灰 tint（浅色段）
- `[data-theme="dark"]` 全段黑色中性化：primary `#34C79A→#F1F3F5`、tint→白 tint、ok/warn→`#E4E5EA`（tint 白 12%）、danger `#ff6b5e` 保留
- **新增契约 token**：`--bubble-bg #E4E7ED` / `--bubble-text #23272F`（浅）、`#2B2D33`/`#E4E5EA`（深）——换肤标准 ⑤：新增语义场景先扩契约再进皮肤值段
- Vant 映射段（`:27-72`）零改动（值引用 tok en 自动跟随）

### ② 聊天页 token 化
- `RoomApp.vue:147/156`：`.bubble` `background #EAF0FD→var(--bubble-bg,#E4E7ED)`、`color #1F2329→var(--bubble-text,#23272F)`（fallback=候选C 皮肤值；宿主未注入即默认皮肤）
- markstream page 重建（确定性 hash）：`build → dist → 先清后放同步` app/src/main/assets/markstream/433 文件与 dist **全一致**；旧 room-*.js/css 历史残留 10 个清零；`room.html` 引用新 hash `room-C9SpPM7O.js` / `room-DZZTnaPS.css`，产物体内 `var(--bubble-bg,#e4e7ed)` 实证

### ③ 原生单源 + 收编残留
- 新建 `res/values/colors.xml`（mov_* 9 键值段=候选C）+ `res/values/themes.xml`（MOVTheme：statusBar/navigationBar/colorPrimary/colorPrimaryDark/colorAccent 全部引用 colors.xml 值段）+ Manifest 全局 `@style/MOVTheme` 挂载（覆盖登录/隐私门/MainActivity 等全 Activity）
- 5 处硬编码品牌绿收编 → `R.color.mov_primary`（`ContextCompat.getColor`）：MainActivity:720/:825、PhotoAskSheet:40、WebPageSheet:85/:125（grep 5 处接线实证）
- WorkbenchPage:257 + demo.js:93/:97 紫/绿头像 → 中性灰阶 `#80868F`/`#6B7280`
- 换肤=替换 colors.xml 值段（+tokens.css 对应值段），引用方零改动

## 二、换肤标准 v1.1（本卡核心交付物）
1. **契约固定**：tokens.css 契约 token 全集（primary 族/bubble/s0-s4/text/line/danger/ok/warn/scrim）——新增场景先扩契约
2. **皮肤=纯值段**：`:root`（浅）+ `[data-theme="dark"]`（深）两段；改皮肤只改值
3. **原生同构**：colors.xml mov_* 值段（语义名），themes.xml 引用
4. **守护**：`scripts/sync-pages.mjs` 增颜色契约校验（跑前必检，违规 exit 1）——品牌绿零命中（tokens.css/colors.xml）+ 每皮肤段契约全套 + 原生 mov_* 9 键 + RoomApp 气泡消费锚
5. **review 冻结手写页**（857df30 口径）值段手工跟随（引用/hash 不动，仅值替换）

## 三、验证（L1 全量 + 变异 4/4）
- **L1 全量**：47 类 **338/0/0**（+1 skipped SceneLiveQueryTest 环境跳过）+ `assembleDebug` 绿（rm -rf 强制重跑 XML 逐件统计）
- **变异四条亲杀**（sync-pages 校验必红→还原绿）：
  - M1 tokens.css 主色回绿 `#0E7C5B` → 红 ✓
  - M2 colors.xml mov_primary 回绿 → 红 ✓
  - M3 RoomApp 拆气泡锚（回 #EAF0FD）→ 红 ✓
  - M4 契约 token `--bubble-text` 删除 → 红 ✓
- **品牌绿终扫（生产面）**：`0E7C5B|0A6649|34C79A` = **0**；旧 rgba 绿（14,124,91/52,199,154/15,138,95）= **0**（覆盖 mov-vue/src + app/src/main + RoomApp 源 + assets 产物）
- **WebViewWarmupTest「assets 页面产物未被触碰」哨兵**：产物变更以独立 commit 入库后哨兵绿（git 工作区哨兵语义=提交纪律，非禁止产物变更）

## 四、范围说明与挂账
- **不动**：语义 danger 红色（拍板④ 保留）、tokens.css `body background:#05070a`（页外衬，不在卡点名）、夜间原生 colors（native night 分支已是黑系）
- **范围澄清**：Vue 系生产面=7 构建页+review 手写页+markstream；历史 mock（code.v3.html 等）未动（非生产消费面）
- **挂账**：环境 version 漂移（bun install 拉取依赖版本与旧构建略有差）——确定性 hash 已验证与 dist 完全一致，无功能性内容差

## 五、后续
- 验收员：L1 全量复跑 + 全仓 grep（口径见上）+ 变异 4/4 复验 + 真机对照 mock 5 屏（候选C_冷调近黑）
- 合 main 后：UPG-41 串行（同文件 MarketPage 换肤标准件已就绪可直接引用）
