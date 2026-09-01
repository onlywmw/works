# UPG-27 R1 Code Mode 真机补验记录

- 补验日期：2026-08-30
- 设备：小米平板 6S Pro 12.4（序列号 21770d7d，型号 24018RPACC）
- APK：feat/upg27 分支（ca47f01，R1 修复后），包名 com.mov.android
- 判据（L2 真机四项）：code 模式真实任务 / 双门实测 / tool.help 直呼 / 塌缩自纠
- 当前呈现模式：both（presentation.mode 查询确认）

## 判据 1：双门实测（权限门 + schema 门）

**第二门（权限拦截）实测：**
```
tools/call shell.exec {"command":"echo hi"}
→ [code: APPROVAL_REQUIRED] 需要确认: 默认权限：shell.exec 超出安全范围，请求允许（requestId=req-1）
```
- 外层 shell.exec 恒 ASK（approval.mode=ask 下写类拦截）——权限门真实生效 ✅

**第一门（schema 文档）实测：**
```
tools/call tool.help {"name":"shell.exec"}
→ {ok=false, code=TOOL_NOT_FOUND, error=未知工具: shell.exec, nearSuggestions=[file.read, search, file.write]}
```
- shell.exec 不在 toolRegistry（登记层）——根因：**UPG-27 分支基底 = main 8af7da9（2026-08-29），早于批 3 清偿（2026-08-30 合 main）**；shell.exec 元数据（批3-3 hostToolMeta 含 shell）未并入本分支 → tool.help 无文档可查，属**跨批依赖**，非 UPG-27 回归
- nearSuggestions 命名空间感知近邻真实工作（TOOL_NOT_FOUND 附候选提示）

## 判据 2：tool.help 直呼（含 R1 outputHint 诚实化）

```
tools/call tool.help {"name":"file.read"}
→ {ok=true, docs=[{name=file.read, description=读取指定路径的文件内容（限沙盒根目录内，拒绝路径穿越）,
   parameters={path=文件路径}, output=（output 声明待登记——批 3 清偿在途）, permissionTier=free}]}
```
- tool.help 在面可直呼（BOTH 模式），返回真文档 ✅
- **R1 修复验证：output 恒「（output 声明待登记——批 3 清偿在途）」**，未再出现「顶层返回键含: path」输入键冒充（旧 bug 已消）✅
- permissionTier=free（file.read 只读无害）——tier 经 permissionTier 单源 ✅

## 判据 3+4：code 模式真实任务 / 塌缩自纠 —— ⏳ 阻塞

**发现项（P1 级）：code 模式无用户手控入口，两项判据无法真机执行**

证据链（feat/upg27 ca47f01 源码）：
1. `presentation.set_mode` MCP 面被铁律 1 过滤：MainActivity.kt:3713 `if (name in uiOnlyMcpTools) continue`，uiOnlyMcpTools 含 presentation.set_mode（:150）→ 实测 MCP 直调返回 `TOOL_NOT_FOUND`
2. `togglePresentationMode()`（MainActivity.kt:6467，注释「UI 按钮已移除」）**全仓库无调用点**（git log -S 确认 3da6747 引入后仅定义）
3. 「极简模式」图标按钮为占位（:826 toast「即将上线」），不切呈现模式
4. presentationMode 无 SharedPreferences 持久化，重启回 both；无 intent/debug 入口
5. 设计文档《UPG27_CodeMode设计_外发评审版》:27/:153 要求「呈现模式切换入口 uiOnly，用户手控」——**实现缺失该入口**

后果：
- 「code 模式真实任务」（AI 仅凭 SDK 节 + shell.exec 经 MCP 完成真实任务）→ 无法进入 code 模式
- 「塌缩自纠」（直呼非在面工具 → TOOL_COLLAPSED 三分语义 + AI 据指引自纠）→ BOTH 模式全量在面，无塌缩可测

## 判据达成汇总

| 判据 | 结果 | 证据 |
|------|------|------|
| 双门实测（权限门） | ✅ 通过 | shell.exec → APPROVAL_REQUIRED |
| 双门实测（schema 门） | ⚠️ 跨批依赖 | shell.exec 无元数据（分支基底早于批3），非 UPG-27 回归 |
| tool.help 直呼 | ✅ 通过 | file.read 真文档 + outputHint 诚实化（R1 修复生效） |
| code 模式真实任务 | ⏳ 阻塞 | code 模式入口缺失（发现项） |
| 塌缩自纠 | ⏳ 阻塞 | 同上 |

## 结论

- UPG-27 R1 修复项 **outputHint 诚实化** 真机验证生效 ✅
- tool.help 直呼、权限门拦截真实工作 ✅
- **发现项：code 模式用户手控入口缺失**——UPG-27 核心交付面（code 模式 SDK 节 + 塌缩语义）无入口可达，L2 四项中两项阻塞。建议设计师评估：恢复 UI 切换按钮（或补 settings 入口）后，其余两项随复验执行
