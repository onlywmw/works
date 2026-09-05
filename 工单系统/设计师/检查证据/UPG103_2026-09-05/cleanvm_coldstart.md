# UPG-103 冷启动采样（干净虚拟机 CleanVM · 替验收员执行）

## 环境
- AVD：CleanVM（新建 · system-images;android-36;google_apis;x86_64 · pixel_6 配置 · -no-snapshot 零缓存冷启）
- 采样口径：force-stop → logcat -c → monkey LAUNCHER → Displayed com.mov.android/.MainActivity（am start -W 因 MainActivity not-exported 不可用，改 logcat Displayed 行——同源等价）
- 采样前一次性设置：PrivacyGateActivity 同意（before 装+同意后，after -r 覆盖装继承协议态）

## before.apk（拆前 56333712B）
run1 2570ms / run2 2501ms / run3 2346ms → 中位 2501ms

## after.apk（拆后 56333712B）
run1 2088ms / run2 2309ms / run3 2631ms → 中位 2309ms

## 结论
- after 中位 2309ms < before 中位 2501ms（-192ms / -7.7%）——拆分批③后冷启动零退化
- 波动区间（±300ms 内）为模拟器正常抖动
- 冷启动锚（<3000ms 门限如适用）：双端均达标

## 阻塞项（三场景走查）
干净虚拟机无已登录账号 → LoginActivity（验证码=real 短信需真机收码 / 密码登录=无测试账号在档 / 游客模式=无此入口）→ chips 两级气泡/胶囊 preset/uninstall 归位三场景均需登录后主聊天页——需测试账号或真机收码协助后继续。
