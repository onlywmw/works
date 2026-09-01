# UPG-54 安全中心 —— 验收员复核记录（2026-08-31）

验收对象：feat/upg54 = **9911e67**（3 commit 47ef8c1→68a3a59→9911e67；基底 feat/upg53 a665349=53 tip，合并顺序声明成立）
测试构建：**现场 assembleDebug @13:59**（55,492,960B）装 emulator-5554（真机 21770d7d 断连，与程序员申报一致）

## 一、代码核物（8 项）

| 项 | 结果 |
|---|---|
| ① 安全入口 | ✅ 设置页「审批模式」行 →「安全」一级行（Vue SettingsPage） |
| ② 两栏+摘要 | ✅ SecurityCenter 纯函数：SecurityProfile 6 策略计分（sum/MAX_SCORE→≥0.8 S / ≥0.4 A）→ **max(用户, hardBoundaryMin()=B) 兜底**（ordinal 比较，留企业/合规口）；UxGrade=打扰度映射（never→S/记住收敛→A/sensitive_always 降一档）——**无直接调级 API**（锚①反射扫描） |
| ③ 安全状态 | ✅ 🔒 加密知情行迁入仪表盘（53 状态行演进） |
| ④ 操作保护 4 行 | ✅ 审批模式=security.setApprovalMode **单源转调 approval.setMode**（硬边界锚④）；记住偏好→UPG-53 prefs 单源；敏感确认/第三方访问=只读展示 |
| ⑤ 数据足迹 | ✅ security.footprint=审计投影查看（ApprovalAsked/Decided/ToolCall[vault.get/credential.getKey/http.post/vault.*] 倒序 20 条）；**SecurityProfile 无 audit 字段**（锚⑤=审计不可关）；敏感显示→VaultPage 消费（always_hidden 根本不显示 / view_30s setTimeout 30_000 自动掩码）；同步=local/encrypted_sync（≠对外，锚⑦） |
| ⑥ 硬边界 | ✅ 5 徽章 🔒 灰显（凭据/资金·支付/绝密数据/身份/**安全控制**） |
| ⑦ 纯函数 | ✅ 全部 JVM 可测+契约测试 9 用例 |
| Bonus | ✅ security.set* 撞 systemBaselineDeny 底线护栏归 gate（AI 误调被拦）确认 |

## 二、L1（独立复跑）

- 全量 :app:testDebugUnitTest = **67 套件 482/0/0**（跳 0；程序员报 482/0/1 的 1=跳过口径）——SecurityCenterTest 9/0
- 锚①=反射扫描「无 set*Grade API」+策略变化→等级变化；锚②=摘要必含保护+打扰、拒「得分」措辞；锚8=全放开恒守硬边界 B

## 三、变异抽杀 3/3（W1/W8/W5 全红）

| 变异 | 注入 | 结果 |
|---|---|---|
| M-W1 | 加 `fun setGrade(g: SecGrade)` | ✅ 锚1「无直接调级API」FAILED（反射扫描捕获） |
| M-W8 | max 兜底改 return user | ✅ 锚8「全放开也恒守硬边界最低B」FAILED |
| M-W5 | 摘要出现「体验得分」 | ✅ 锚2「策略摘要必含保护与打扰措辞」FAILED |

## 四、L2 模拟器（5554，真机断连与程序员申报一致）

1. 设置页「安全」一级行在场 ✅ → 点击进二级页
2. 二级仪表盘**全量在场**：两栏（A 安全等级/A 体验等级）+摘要「当前：平衡保护 · 适度打扰」+🔒 已加密保护行+「最低安全保护：B」+操作保护 4 行+数据保护 3 行+硬边界 5 徽章 ✅
3. **策略实时刷新** ✅✅：点审批模式行 → ask→never：体验等级 **A→S（少打扰）**、摘要实时更新「少打扰」、安全等级保持 **A**（计分制精确：4/10=0.4→A，max 兜底不降级）
4. **journal 单源转调** ✅：approval/policy never 落账（seq 17）——security.setApprovalMode 真正转调 approval.setMode（重启恢复权威）
5. **已还原 ask** ✅（第二次点击→每次询问+适度打扰）
6. **数据足迹展开** ✅：20 条审计投影实时呈现（审批决定 cancelled×3/**allowed-remembered**/allowed-once+审批请求 vault.get/vault.delete×3）+尾注「审计为系统基础能力，始终开启且不可关闭」
7. **30s 掩码**：代码路径核物（VaultPage.vue view_30s→setTimeout(30_000)→toast autoHidden；sensitiveDisplay 从 security.overview 单源消费）——UI 端到端 30s 完整观察=P3（编辑流较深，未走完）

## 五、并行撞车核实

- UPG-52 已由并行会话合 main（287f9e7）+ BP-03 补丁 402510d（memoryos.devRun 补登记 writeTools——我验收 52 时未发现的同型缺口，补丁合理）
- 53 已被审验员合 main（**2780961**，工单表 E43 记录「✅合入 2780961（审验通过+验收 e937fb1 落档）」）
- 54 基底=53 tip（a665349）✓ 合并顺序声明成立——54 rebase 到新 main 后可跟
- xlsx 教训已采纳：本次登记前**重读最新态**（45→50 行新形态 t="str"）+按内容定位锚（A44=UPG-54），未覆盖他人更新

## 六、结论

**通过** → 54 rebase 新 main 后可交审验员合入。
**P3×2**：30s 掩码 UI 端到端完整观察；真机 21770d7d 断连恢复后可补一轮实机走查（入口/仪表盘/足迹一致）。
