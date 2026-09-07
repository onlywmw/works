# 交付报告 · UPG-108

> 类型：（待填） ｜ 日期：2026-09-06 ｜ 依据：（派单路径）
> 治理归属：（只动 `Desktop\MOV\工单系统` / 0027-mov 只读） ｜ 状态：✅ 已完成（交付，待验收）

---

## 一、本阶段交付（N 件）

| # | 交付 | 实现 |
|---|---|---|
| 1 | （交付件） | （实现位置） |

## 二、验收判据核对（逐条证据）

| 项 | 标准 | 实测证据 |
|---|---|---|
| M-1 | （标准） | ⏳ 待填 |
| M-2 | （标准） | ⏳ 待填 |
| M-3 | （标准） | ⏳ 待填 |
| M-5 | （标准） | ⏳ 待填 |
| M-6 | （标准） | ⏳ 待填 |

## 三、证据引用

- `C:/Users/Administrator/AppData/Local/Temp/upg108-evidence/emulator-8389-loopback.txt` —— （说明待填）
- `C:/Users/Administrator/AppData/Local/Temp/upg108-evidence/emulator-8389-nonloopback.txt` —— （说明待填）
- `C:/Users/Administrator/AppData/Local/Temp/upg108-evidence/node-account-pair-test.txt` —— （说明待填）
- `C:/Users/Administrator/AppData/Local/Temp/upg108-evidence/gradle-l1-targeted.txt` —— （说明待填）
- `C:/Users/Administrator/AppData/Local/Temp/shot3.jpg` —— （说明待填）

## 四、测试结果（XML 汇总）

| 文件 | tests | failures | errors |
|---|---|---|---|
| `C:/Users/Administrator/mov-upg108/app/build/test-results/testDebugUnitTest/TEST-com.mov.android.UserProxyCoreTest.xml` | 11 | 0 | 0 |
| `C:/Users/Administrator/mov-upg108/app/build/test-results/testDebugUnitTest/TEST-com.mov.android.MiniHttpServerBindHostTest.xml` | 3 | 0 | 0 |
| `C:/Users/Administrator/mov-upg108/app/build/test-results/testDebugUnitTest/TEST-com.mov.android.UserPairManagerTest.xml` | 4 | 0 | 0 |
| **合计** | **18** | **0** | **0** |

> 结论：全绿（变异未被捕获时即 NOT_RED）（人裁决）

## 五、hash 三重（交付绑定）

| code_commit_sha | artifact_sha | evidence_manifest_sha |
|---|---|---|
| `d1d87aa1a10acef79693ac9394aa1f3157c17cc5` | （待填） | `da146924c3388463139ebdbe66eac78b045c95b661dfdf5bb3840bf8d5351eac` |

**manifest 自检（UPG-92 内置硬闸 · 审验.py --manifest）**：ok:True ｜ 绑定值重算一致 ｜ 文件：`处理中心/delivery_UPG108_manifest.json`

**E2 hash 一致性预校验**（复用 SYS-02 阶段一 `审验.py --verify-hash`）：

- 命令：`python 审验.py --verify-hash feat/upg108 d1d87aa1a10acef79693ac9394aa1f3157c17cc5 --repo C:/Users/Administrator/mov-upg108`
- 结果：**HASH_REJECT <not-ancestor>** ｜ signal：`d1d87aa1a10acef79693ac9394aa1f3157c17cc5` 不在 origin/main 祖先链（）——疑似 rebase 重写/未合内容冒充；提示: `git log --oneline feat/upg108` 取当前真 hash

## 六、范围与红线遵守

- （红线逐条对照待填）

## 六之二、施工期重大回归与自纠（强制节——UPG-94 教训：自纠不报侵蚀信任链；无也必须填「无」，删节=打回）

- （施工中是否发生过误删/误改既有功能并自纠？逐条：事实 + 影响面 + 自纠提交 + 是否已单独申报。无则填「无」）
- 视觉类追加变更（样式/尺寸/布局）：截图必须随追加更新（「截图随追加」——UPG-94 logo 追加未更新截图教训）

## 七、登记说明

- （登记动作待填：README §六 / 挂账登记表）

