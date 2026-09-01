# UPG-41 验收证据（验收员 @2026-08-30 亲验）
## upg41-verify.mjs: 5 组断言全绿 (入口卡/迁移完整性/下沉剔除/demo兼容/数据面复用) exit=0
## LocalOverviewPage.vue: 全屏二级页(van-popup)+SPA返回+数据面零改动(market.localOverview+ui.getPins)+总览整体下沉
## 等价性: 总览逻辑单实现在二级页, MarketPage 下沉剔除 (verify下沉剔除断言)
## Token/KV: 零新token + i18n双语 + 数据面复用 0/0
## L2真机走查: adb基建异常, 待任一设备复跑(市场页本地tab->二级页->返回)
