# UPG-25 v2 验收证据（验收员 @2026-08-30 亲验 L1）
## L1 全量: 53 套件 382 用例 / 0 失败 / 0 错误 / 1 跳过 (mov-upg25v2 2ccce25, 基底 main 3263f10)
## design_token_assert: 11/11 断言全绿 (13项规范v1硬编码清零: 字号老化/旧文本色/parseColor/PhotoAsk15dp/裸px/JS #d92d20/#7c5cff/蓝阴影/顶栏56px/tokens.js DANGER对齐)
## 变异M1亲杀: tokens.css 顶栏 46px->56px -> design_token_assert 顶栏height:56px=1 FAIL, 还原干净
## upg40 零回归: 2ccce25 中 tokens.css 零变更 + colors.xml 未触碰 (候选C皮肤值段/换肤契约未动)
## L2真机13项对照+L3换肤真机零回归: 待装机补验(UI视觉项)
