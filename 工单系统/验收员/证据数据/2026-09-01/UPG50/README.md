# UPG-50 阶段1 批次 1B 复验证据（2026-09-01 · 176606d）

**结论**：✅ 带缺陷通过（ACCEPTANCE_LOG §P21）——P2-A L2-9 2/3（WORKBENCH-CARD 挪 1C）+ P2-B pressed 视觉疑点，均设计师裁决

## 验收员自采证据
| 文件 | 项 | 内容 |
|---|---|---|
| u50-settings.png | 入口 | 设置 Sheet（55% 新形态） |
| u50-appearance.png | L2-8 继承 | 外观组件库选择页（组件分组+形态卡横铺，CHAT/SETTINGS 族可见） |
| u50-bubble-std-base/mono/bub/std-back.png | L2-9 尝试 | 我方模拟器 ui.setVariant 三态切换链——markstream room WebView 未挂载（CDP targets 无 room 页）→零视觉差，环境限制如实申报 |
| CDP 观测 | L2-2 继承 | 选择页 ✓ 选中态（6 组件）+「外观」行坐标（x_css347/y_css315 等） |

## 程序员证据像素复核（0027-mov/upg50_screens/）
- bubble 三态（std/mono/bub）两两 diff **3.20-3.32%** = 三张真实不同帧（非同图复用）✅
- L2-10 六张：明暗对 **17.10-17.33%** ✅；**pressed vs default 0.00%**（P2-B 疑点：按压视觉未体现）；disabled 1.05-1.69%
- manifest：审验.py --manifest 亲测——manifest_sha 绑定值=重算值（1fb5d7de…，_canon_manifest 口径）；E-006/007 hash_matches=True；E-001~005 stage 0 遗留（问题区在案）

## 对账
- 全量 604/1失败(sentinel CRLF)/1跳过 亲跑一致；176606d 单笔 28 文件与申报一致
- L1-14 单写点：ui.setVariant 生产调用仅 AppearanceApp.vue:254
- 混线声明：51449d3（用户反馈资产/设置面板视觉修正）非 UPG-50 范围，归属设计师确认
