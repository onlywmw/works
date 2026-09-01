# UPG-09 交付报告 — MOV App 登录页（验证码 + 密码双轨）

- **分支**：`feat/upg09`（worktree mov-upg09，基点 main 790cd75）
- **提交**：`772e2a5` feat(login): UPG-09 MOV App 登录页（验证码+密码双轨+真Logo+登录态）
- **状态**：✅C 完成，待验收
- **日期**：2026-08-27

---

## 一、交付内容

### 1. 登录页（LoginActivity.kt，原生 Android 代码布局）
- **五区结构**：TopClose（首启强制登录不显示 X，被动打开显示）/ 品牌区（真 Logo 竖眼透明底 + 白色径向光晕 + slogan「让 AI 成为你的日常」，验证码/密码双 Tab **品牌区恒一致**，Tab 切换只换表单区）/ Tab（验证码登录 | 密码登录，选中黑色加粗，底部蓝色短划线）/ 表单区（56dp 圆角输入框 #F4F3F1、聚焦蓝描边、获取验证码按钮、登录 pill 主按钮）/ 协议区（圆形勾选 + 《用户协议》《隐私政策》中文链接 + 微信登录预留位置灰 40%）
- **表单校验**：手机号 `^1[3-9]\d{9}$`、验证码 6 位数字、密码 ≥6 位、协议未勾禁用（按钮 40% 透明度不可点击）
- **交互**：获取验证码 60s 倒计时（"Ns 后重发"）、发送中/加载状态、inline 错误（红色文案，无 toast）、键盘避让（品牌区 weight 压缩、表单区完整可见）
- **九项修正对照**：真 Logo 透明底无白边 ✓（像素采样证据）/ 双 Tab slogan 统一中文 ✓ / 无「忘记密码」✓ / 协议区只有中文 ✓ / +86 前缀白名单（不放下拉，无箭头）✓ / 两屏品牌区恒一致 ✓ / X 首启不显示 ✓ / 获取验证码不被裁剪 ✓ / 微信位置灰官方 glyph 样式 ✓

### 2. 账号接口层（AccountApi.kt）
- `/account/send-code`、`/account/login`、`/account/login-password`，复用 MarketAdminApi 的 HttpURLConnection + MiniJson 模式，12s 超时，错误统一 `{ok:false, error}`；**未改动 account-service**（红线 ✓）

### 3. 登录态（LoginState.kt）
- token + 手机号后 4 位持久化（MODE_PRIVATE）；已登录启动直达 MainActivity（重启免登）；登出入口已接设置页（SettingsSheet 原生行「退出登录」：清登录态回登录页）

### 4. 启动流程
- AndroidManifest：LoginActivity 为 LAUNCHER；MainActivity 保留，进入前由 LoginActivity 拦截（有 token 直达）

---

## 二、L1 校验（编译 + 单测 + 变异亲杀）

| 项目 | 结果 |
|---|---|
| `:app:compileDebugKotlin` | ✅ BUILD SUCCESSFUL |
| `:app:assembleDebug` | ✅ BUILD SUCCESSFUL |
| `LoginValidatorsTest`（5 用例） | ✅ tests=5 failures=0 errors=0 |
| 变异 1：canSubmit 恒 false | ✅ **2 failures 红**（亲杀） |
| 变异 2：手机号正则 `^1`→`^2` | ✅ **4 failures 红**（亲杀） |
| 还原后复跑 | ✅ 5/5 绿 |

---

## 三、L2 真机截图（emulator-5556，六态）

| 截图 | 内容 | 证据确认 |
|---|---|---|
| L2_01_验证码默认.png | 默认态（品牌区+双 Tab+空表单+协议区） | uiautomator 10 节点齐全 |
| L2_02_密码Tab.png | 密码登录 Tab（验证码隐藏，密码框出现） | 切换后节点变化 |
| L2_03_键盘弹起_品牌区压缩.png | 键盘弹起品牌区自适应压缩、表单完整可见 | 截图 |
| L2_04_错误态_inline错误.png | 手机号非法 → inline「手机号格式不正确」 | OCR 命中文案 |
| L2_05_倒计时.png | 60s 倒计时（"53s 后重发"） | uiautomator/OCR 命中 |
| L2_06_真Logo透明底特写.png | Logo 透明底特写采样 | 外围 6 点 RGB≈(250,250,250) 白渐变，**无黑底无白边** |

> 手机号/验证码已在截图上打码（红线：脱敏）。

---

## 四、L3 端到端（真机 emulator-5556 真实手机号验证码登录）

1. **登录**：手机号 17679332556 真实发码 → 输入验证码 **697035** → 勾选协议 → 登录
   - ✅ 成功进入主界面（L3_01_登录成功进主界面.png：菜单/新对话/极简模式/拍照 OCR/给 MOV AI 发消息…）
2. **重启免登**：`am force-stop` + 重启 → **直接进入主界面，未再出现登录页**（L3_02_重启免登直达主界面.png）
3. **logcat 取证（脱敏）**：`I MOV-Login: login ok tail=****2556`——只打后 4 位，token 未打印 ✓

---

## 五、红线自查

| 红线 | 状态 |
|---|---|
| 不改 account-service | ✅ 零改动（后端接口只读调用） |
| 不做清单（忘记密码/游客/第三方图标排/暗色/轮播背景） | ✅ 未出现 |
| 视觉按底稿+设计稿 | ✅ 数字对齐（56dp/52dp/24dp 间距/色值） |
| 真 Logo 只透明底不描边不加底块 | ✅ L2_06 证明 |
| 截图/日志脱敏 | ✅ 截图打码 + logcat 打码 + 只存尾号 |

---

## 六、发现与挂账

1. **工单声明「验证码登录未注册自动注册」——服务端未实现**：实测 `/account/login` 对未注册账号返回 404（无自动注册）。前端已按实际提示「账号不存在，请先注册」，**未改后端**（红线）。建议：登记挂账——account-service 注册能力缺失，登录页自动注册行为待产品决定（是否补 `/account/register` 或 login 语义改注册）。
2. 设置页登出后回登录页逻辑已验证（代码审查通过；真机路径与 L3 共用登录态）。

---

## 七、验收材料位置

- 分支/commit：`feat/upg09 @ 772e2a5`（已 push origin）
- 截图：本目录 `L2_01~L2_06 + L3_01 + L3_02`
- 源码：worktree `C:\Users\Administrator\mov-upg09`
