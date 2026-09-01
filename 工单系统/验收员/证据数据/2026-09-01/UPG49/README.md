# UPG-49 验收证据索引（2026-09-01 · L2 复核打回）

**结论**：❌ 打回（P1×2 + P2×1）——详见 `0027-mov\docs\ACCEPTANCE_LOG.md` §P20
**环境**：emulator-5554（Android 16）· main 2a13dcd 包 · lastUpdateTime 2026-09-01 15:42
**工具通道**：真实 UI tap（input tap/uiautomator）+ MCP tools/call（memory.save/ui.openMemory/ui.openMemory 产品 handler）+ run-as 底层对账

## 证据清单
| 文件 | 判据 | 内容 |
|---|---|---|
| 08/13-J1-layered-4drafts.png | J1 | 空态→4 条 DRAFT：计数行+待确认分区头（uiautomator dump 锚定） |
| 14-J6-detail.png | J6 | 详情对话框五字段+诚实占位 |
| 15-J2-promote.png | J2 | 设为重要：1/3+已记住分区前置+按钮变置顶 |
| 16/17-J3-*.png | J3 | 📌徽标+取消置顶；3/3 置顶满 |
| 18/18b-J3-*.png | J3 | 第 4 次置顶被拒（toast 瞬时未截到，行为+代码+单测锚三重佐证） |
| 19-J3-release-and-repin.png | J3 | 释额：取消→WiFi 置顶成功 |
| 20-J4-confirm-dialog.png | J4 | 确认弹窗承诺文案 |
| 21-J4-undobar.png(.ocr.txt) | J4 | 撤销条「已移除「我家WiFi…」·4s 内可撤销」+撤销按钮 |
| 22-J4-resurrect-P1bug.png | **P1-1** | 复活实证：WiFi tombstone 后 UI 复活显示 |
| 22b/22c-*.json | P1-1 | 底层仲裁：entities.json TOMBSTONE 正确/pinned 一致（纯 UI 态缺陷） |
| 23-J4-restart-clean.png | P1-1 边界 | 重启后干净（共 2 条，API 过滤 TOMBSTONE 生效） |
| 24-J5-search-nohighlight.png | **P2-1/J5** | 搜索过滤命中唯一；命中行无高亮 Span |
| 25-J7-cold-*.png | **P1-2** | 302 条首屏渲染成功（共 302 条） |
| 12-current.png + logcat_final.txt | **P1-2** | ANR 弹窗（MOV isn't responding）+ logcat「Input dispatching timed out 5002ms」ErrorId 7b8b9f0d |
| 28/29-J4-*.png | J4 | 撤销点击后行恢复（共 2 条→测试B 行回列） |
| 30-final-state.png / logcat_final.txt | J9 | 收尾态；FATAL=0、ANR×1 在档（另 2 次弹窗当时 dump 实证） |

## 造数/还原口径
- 真实数据：MCP memory.save×4（journal memory/draft，UTF-8 核对）→ 冷启动聚合种子导入
- 压测数据：手工注入 entities.json 300 条（t-perf-*，同程序员申报口径）
- **已还原**：entities.json=验收前基线（花生/元帅 ACTIVE+WiFi/例会 TOMBSTONE）、测试 journal 行清除、/data/local/tmp 临时文件清除——零残留

## 已知测试通道坑（复验者注意）
- uiautomator dump 抓不到 BottomSheetDialog 内 undoBar（21 号 OCR 可见但 dump 无节点）——撤销按钮用固定坐标（Sheet 底部 y≈2340 右侧 x≈930）
- Windows curl 命令行发中文=GBK 乱码落盘——MCP 调用必须 Python urllib + ensure_ascii=False UTF-8 body
- run-as 读 /sdcard Permission denied——中转用 /data/local/tmp + chmod 644
- 5s 撤销窗口内自动化（dump≈2.5s/轮）时序紧张——先 tap 后短 sleep 再 dump

---

# R2 复验证据追加（2026-09-01 晚 · 5640bce）

**结论**：✅ 带缺陷通过（ACCEPTANCE_LOG §P20-R2）——P1 全消，P2×2/P3×3 登记
| 文件 | 项 | 内容 |
|---|---|---|
| R2-01-removed-undobar.png | P1-1 | 移除+撤销条（R2 包） |
| R2-02-after-renderall-no-resurrect.png | P1-1 | 过期+renderAll 后不复活 ✅ |
| R2-03/04-search-*.png | P2-1a | 高亮 off-by-one 像素实证：搜索「花生」2 字命中行高亮带 **36px=单字**（应为 74px） |
| R2-05-302-windowed.png | P1-2 | 302 条窗口渲染；全程 logcat 零 ANR 零 FATAL（logcat_R2.txt） |
| R2-06/07-J8-*.png | J8 | 滚动至 23-25 条→点第 24 条置顶→renderAll 重建→像素 diff 1.4%=滚动保持 |
| logcat_R2.txt | J9 | FATAL=0 / App ANR=0 |

**环境注记**：模拟器 MOV_Test 中途重启（system_server 内存过载 2.8/3GB+swap——非 App 缺陷）；程序员真机=平板无线 adb，本复验全模拟器。
**数据还原**：entities=4 条基线+journal draft 行清空+临时文件清除（教训入 README：journal 是种子源，中文 sed 在 adb shell 失效）。

---

# R2b 复验证据追加（2026-09-01 晚 · fe04668=3751a99 patch-id 等价）

**结论**：✅ 通过（ACCEPTANCE_LOG §P20-R2b）——P2-1a 闭环，UPG-49 达待合状态
| 文件 | 项 | 内容 |
|---|---|---|
| R2b-01-badge-no-pin.png | 删📌 | 置顶行徽标纯文本+amber 0 像素+「取消置顶」按钮在场 |
| R2b-02-highlight-fixed.png | P2-1a | 搜「花生」命中行高亮带 **72px 连续单段=两字全亮**（修复前 36px） |
| logcat（本轮未新增异常） | J9 | 装机/搜索全程无新增 FATAL/ANR |

**口径**：对象=main 头 fe04668（=3751a99，patch-id 38243d84 等价实证）；全量 559/0/1 亲跑；M-1 变异亲杀（锚红还原）；DEL-002 evidence 6 条 sha 全一致；f9cad92（资产术语）混线声明——归属需设计师确认。
