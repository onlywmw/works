# 全球版（README）

> 设计师 @2026-09-02 ｜ MOV 全球版 = **Google Play 上架 + Google 全家桶** 的开发归档区（海外 GMS 版）。

## 文档

| 文件 | 内容 |
|---|---|
| **全球版_开发文档_2026-09-02.md** | 全家桶官方 10 条 + 双版本决策 + 衔接表 + 待决策清单 |
| **GOOGLE_PLAY上架与Billing接入调研_2026-08-29.md** | Play 上架/Billing/账号/封测详细版（官方核实，2026-08-29） |

## 核心结论（一页）

1. **双版本必需**：国内版（微信生态+自有推送）/ 海外版（GMS 版：Google 登录+FCM+AAB）——GMS 是硬依赖
2. **海外版栈**：Credential Manager+Sign in with Google（**sub 主键**/自建后端验 id_token）+ FCM data 推送（免费）+ Auto Backup（排除设备 token）+ **target API 36** + AAB（Play App Signing）
3. **Firebase 待决**：数据出境 GDPR/DPF 合规结论（Auth/Firestore 可省成本；Remote Config 10 万/日免费可单用）
4. **上架硬要求**：Data safety 表单（含 SDK 申报）/ 英文隐私政策（应用内+公开 URL）/ **账号删除双入口** / 封测 12 人 14 天

## 红线速查

| 红线 | 说明 |
|---|---|
| AAB+Play App Signing | 只能 AAB；上传密钥与签名密钥分离 |
| target API 36 | 新应用必须（2026-08-31 起；延期仅到 11-01） |
| Billing | 数字商品必须 Play Billing（15% 档） |
| 账号删除 | 应用内+外部网页双入口（冻结不算） |
| 隐私政策 | 英文版+应用内可见+公开 URL（禁 PDF） |
| 通知权限 | Android 13+ 运行时（功能语境申请） |
| GMS | 无 GMS 设备=全家桶全废（双版本结构理由） |
| 封测 | 个人账号 12 人×14 天（排期 5-6 周；组织 D-U-N-S+30 天） |
