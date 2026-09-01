# UPG-41 L2 市场页「本地」二级页化 真机补验记录

- 补验日期：2026-08-30
- 设备：小米平板 6S Pro 12.4（序列号 21770d7d，型号 24018RPACC，density=400/2.5x）
- APK：feat/upg41 分支（bb31e33，本机 gradle 构建 app-debug.apk 装机），包名 com.mov.android
- 补验来源：验收员 evidence「L2 真机走查: adb 基建异常, 待任一设备复跑（市场页本地tab->二级页->返回）」
- 判据：入口卡 + 二级页×深浅双色 + 操作链（入口→二级→下钻→返回→tab 态保留）
- 验证法：uiautomator 节点树 + PIL 像素 + 截图 13 张 三轨

## ⚠️ 补验入口姿势（环境前提，重要）

- **必须从 MainActivity 主界面初始化后进入市场页**（用户正常路径），否则桥失败：
  - `pageToolProvider` 是 MainActivity companion 可变变量（MainActivity.kt:39），默认 `{ null }`，在 MainActivity onCreate（:590）才装配为 `mcpHandlers[tool]`
  - 直接 `am start .MarketPageActivity`（MainActivity 未运行）→ 全部 market.*/ui.getPins 桥调用拿 null handler → 本地 tab「本地工具加载失败」+ 市场 tab「加载失败」
  - force-stop 后先启动 MainActivity 再进市场页 → 两个 tab 全部正常
- 判定：**非 UPG-41 回归**（环境/启动方式前提；验收员复跑需走用户路径）

## 操作链逐环验证（浅色模式）

| 环节 | 判据 | 真机证据 | 结果 |
|------|------|---------|------|
| 入口卡 | 本地 tab 收缩：概览摘要 N 类 M 工具 + 健康一句话 + 钉选快捷行≤3 + 「查看全部」双入口 | dump：`本机能力总览 30工具4来源3/5 钉选 ▲1个包不可达/未授权 钉选常用 查看全部›×2`；PIL 概览卡=品牌色(深色带) | ✅ |
| 入口→二级页 | 点「查看全部」→ 全屏二级弹层 | tap(1016,672) 整行按钮 → dump 二级页完整 DOM（概览卡+钉选槽 3/5+两空槽+三层分组）；截图 upg41_04 | ✅ |
| 二级页结构 | 概览卡+钉选槽+三层分组（内置/市场已安装/系统基础能力） | dump：内置能力[设备控制13/生活场景·12306 2/笔记·Obsidian 7 未授权]/市场已安装[暂无项目]/系统基础能力[AI 基本功 8] | ✅ |
| 工具级下钻 | 包行展开 → 工具胶囊名+说明+权限标记 | tap(950,987) 展开设备控制 → dump：calendar.add/list、camera.capture/ocrCapture 等「需确认」标记 | ✅ |
| 返回 | SubHeader back → SPA 返回 tab 态保留 | tap(176,144) 返回箭头 → PIL 概览卡消失；dump：「本地」tab selected=true，入口卡完整保留 | ✅ |
| 市场 tab | store 加载正常（环境交叉验证） | dump：推荐/热门工具/全部工具 + browser 浏览器自动化 + 安装按钮 | ✅ |

## 深浅双色

| 模式 | 入口卡 | 二级页 | 证据 |
|------|--------|--------|------|
| 浅色 | 白+s0(#f3f4f7) 背景 + 品牌色概览卡 | 同上 + 白卡片内容（PIL 白 3604>s0 1530） | upg41_03/04/05/07 |
| 深色（cmd uimode night yes） | 主色 (12,14,18)=#0c0e12 候选C + s1(#16181d) 卡片 | 三层分组完整 + 滚动底部可见系统基础能力 | upg41_08/09/10/12 |

- 深色走查：入口→二级页→滚动底部→返回，tab 态保留（「本地」selected=true，二级页元素 count=0）✅

## 判据达成

- 入口卡：✅（本地 tab 收缩，双入口可达）
- 二级页×深浅双色：✅（全屏 van-popup，两种色值段均正常渲染）
- 操作链：✅ 入口→二级→下钻→返回→tab 态保留 全链实测
- 数据面零改动：✅ 概览数据=market.localOverview 聚合读面 + ui.getPins 钉选，真机返回真实值（30工具4来源/3-5钉选）

## 结论

- **UPG-41 L2 真机补验通过**（6 项全 ✅），无 UPG-41 相关缺陷
- 环境备注：复跑市场页必须从 MainActivity 主界面进入；直接 am start MarketPageActivity 会因 pageToolProvider 未装配致桥失败（已验证非回归）
- 证据：截图 13 张 + dump 9 份存本目录
