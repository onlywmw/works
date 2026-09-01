# DELIVERY_UPG54 安全中心（设置→安全 二级 · 等级仪表盘 + 分组策略 + 硬边界）

**程序员 C @2026-08-31** ｜ 分支 `feat/upg54` ｜ 基点 **feat/upg53 a665349**（消费 UPG-53 机制：ApprovalRemember prefs/安全状态行/豁免链——**合并顺序声明：upg53 先合 main，upg54 rebase 后 ff**）
**交付 commit**：`47ef8c1`（安全中心主体）→ `68a3a59`（锚8 源码锚强化）→ `9911e67`（UI 走查证据）
**已登记两个表**（工单表 ROW44 + 工单库 UPG-54 状态）。

---

## 一、范围 8 项落地（方案=安全中心_设计_v2 §一~§四 + 工单卡）

| # | 项 | 实现 |
|---|---|---|
| ① | 安全入口 | 设置页一级行「审批模式」升级为「安全」（icon shield）→ sheet 内二级页（复用 UPG-51 about-sub 页内导航模式） |
| ② | 两栏+摘要 | 仪表盘卡：安全等级/体验等级两栏（S/A/B 大字）+ 策略摘要「当前：平衡保护 · 适度打扰」+ 「最低安全保护：B」灰显行；**等级=结果**（SecurityCenter 无任何直接调级 API，变异锚①反射扫描+源码锚） |
| ③ | 安全状态一屏 | 🔒「本机数据已加密保护 · 一切正常」迁入二级页仪表盘（UPG-53 一级行随之移除，场景6 锚测试同步演进并申报） |
| ④ | 操作保护组（4 行） | 审批模式（点击切 ask/never → **security.setApprovalMode 单源转调 approval.setMode/setPermissionMode**——硬边界锚④：安全控制不可被体验设置绕）；敏感操作确认（只读「高风险询问」=现网 isHighRisk 语义，设计 §九「不再增加安全设置」）；第三方工具访问（只读「读取自动允许」=现网 ext enableWrite=false 语义）；自动记住安全偏好（switch → security.setRememberEnabled → prefs mov_security KEY_ENABLED=UPG-53 单源） |
| ⑤ | 数据保护组（3 行） | 数据足迹（查看›→展开审计投影最近 20 条：approval asked/decided + vault.get/credPeek/http.post 工具调用；**audit 只读不可关**——SecurityProfile 无 audit 字段锚⑤）；敏感信息显示（切换 always_hidden/view_30s → security.setSensitiveDisplay → prefs；**vault 页消费**：always_hidden 拦眼睛查看、view_30s 查看 30s 后自动重新掩码+toast）；数据同步（「本机」现状展示；点「加密同步」→ 诚实空态「即将推出」，**永不改变外发审批判定**——锚⑦同步≠对外） |
| ⑥ | 硬边界 | 5 类别 🔒 灰显徽章（凭据/资金支付/绝密数据/身份/**安全控制**——含安全控制是设计 §四 关键） |
| ⑦ | 等级聚合 | SecurityCenter 纯函数（com.hermes.dsh.security）：SecurityProfile 6 策略 + 计分制（sum/10 → ≥0.8 S / ≥0.4 A / 其余 B）+ **max(用户, 硬边界 B) 兜底**（锚⑧源码锚：securityGrade 必含 hardBoundaryMin+ordinal 表达式）+ 体验等级=打扰度映射（never=S 少打扰 / ask+记住=A / ask+不记住=B；第三方敏感始终询问降一档；摘要锚定「打扰」措辞非「得分」——锚⑨） |

## 二、L1 验证

- **全量**：`:app:testDebugUnitTest --rerun-tasks` **67 类 482 过 / 0 败 / 1 跳过**（commit 后工作区干净，WebViewWarmup 产物哨兵绿；sync-pages 77 文件 --check 幂等一致）
- **`assembleDebug` 绿** + `check-token-effect` 过（AI 面零改动：security.* 为页面桥不进 HostToolMeta/AI 工具面，Token/KV 影响=0）
- **变异 4/4 亲杀**（先 commit 后变异）：

| 变异 | 对象 | 杀伤 |
|---|---|---|
| W1 | SecurityCenter 注入 `setSecGrade` 直接调级 API | 锚① 反射扫描 → 红 |
| W3 | SecurityProfile 注入 `auditEnabled` 字段 | 锚⑤ 反射扫描 → 红 |
| W5 | uxGrade never→S 改为 →A | 锚⑨ 打扰度映射 → 红 |
| W8 | securityGrade 删 hardBoundaryMax 兜底（`return user`） | 锚⑧ 源码锚 → 红 |
| （W6 summary 打扰措辞改「干预」） | 编译级红（when 字面量），等效必杀 | ✓ |

- **新测试**：SecurityCenterTest 9 锚（①无调级 API ②摘要必含保护+打扰 ③硬边界五类别有序齐备 ④等级计算零副作用+体验字段不触碰 approvalMode ⑤profile 无 audit 字段 ⑥敏感显示无明文档+大白话值域 ⑦同步档位不影响外发三要素+加密同步不放大等级 ⑧max 兜底源码锚+三档实测 ⑨打扰度映射+摘要措辞）

## 三、ApprovalRegistry 同步

- `approval-inventory-collect.mjs` 重收集（164 工具：+vault.restore +security.*6）
- semantics.json +6 条 security.*（semanticType=page_bridge_security；**实跑 permissionTier=gate**——`security.set*` 撞 systemBaselineDeny 的 `security.set` 底线护栏：AI 误调被 gate 拦=防线纵深而非缺陷，页面直调不走 tier 不受影响； ApprovalRegistryGeneratorTest 行数快照 45-68 申报演进）
- Registry.json/.md 由生成器测试重新生成（61 rows）

## 四、L2 走查（桥注入态 Playwright + Chrome，证据 `upg54-evidence/`）

| 项 | 结果 |
|---|---|
| 一级页「安全」行（native 渲染态） | ✅ `L2_settings_l1_native.png` |
| 点击「安全」→ 二级页：仪表盘（2 栏等级 A/A + 摘要「当前：平衡保护 · 适度打扰」）+ 🔒加密行 + 操作保护 4 行 + 数据保护 3 行 + 硬边界 5 徽章 | ✅ `L2_security_center.png` + DOM 断言（dash/grades=2/summary/hbItems=5/ops/data/approval/remember/footprint/hardBoundary 全 true） |
| 数据足迹展开（审计投影 2 行示例） | ✅ `L2_footprint_expanded.png` |

**真机受限申报（如实）**：
1. 平板 21770d7d 中途断连（adb offline）、emulator-5554 app 无法启动（Binder 异常）、新 AVD 启动超时——**真机端到端（native WebView 内二级页实操作 + 策略切换实时刷新等级 + vault 页 30s 自动掩码）未能在真机完成**，UI 结构证据以桥注入态 Playwright 截图+DOM 断言交付；**留验收员真机补验**（操作路径：设置 → 安全 → 调审批模式/记住偏好 → 两栏等级实时变化；数据足迹展开；vault 页眼睛查看 30s 后自动隐藏）。
2. demo 态（浏览器直开）不显示安全行属预期（mov.native=false 走 demo groups）——走查用伪造 MovPageBridge 注入（security.overview/footprint 假响应，结构与生产桥契约一致）。

## 五、Token / KV 影响申报

- **AI 面：0**（security.* 为页面桥，不进 HostToolMeta/AI 工具面；SettingsSheet/VaultSheet 白名单为 UI 通道）
- **页面桥面**：+6 security.* handler（settings/vault 页用，不入 prompt）
- **KV**：prefs mov_security 扩展 `sensitive_display` key（≤20B）
- `check-token-effect` 过

## 六、挂账与登记

- 无新增卡外挂账（53 的 3 条仍在册待审）；security.set* 撞名 gate 为纵深增益已申报（第三节）
- 工单表.xlsx ROW44：程序员列 `✅C 完成`、备注 `feat/upg54 9911e67（报告 DELIVERY_UPG54_2026-08-31.md）`
- 工单库.md UPG-54 状态：`程序员✅完成，待验收`
- 证据：`程序员\UPG54-evidence\`（worktree `upg54-evidence/` 同步拷贝）

**待验收员**：L1 复跑+变异抽杀（建议 W1/W5/W8）+ **真机补验**（设置→安全二级页实操：策略切换→等级实时变；足迹展开；vault 30s 自动掩码）+ L3 等级聚合契约与硬边界 max 兜底复核。
