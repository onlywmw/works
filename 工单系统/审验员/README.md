# 审验员 · AI 审验（README）

> **给第三方 AI 的审验工具**——不是抽样抽查，而是**逐一审验每个工单的证据链、挑毛病**，发现的问题登记到 `处理中心`。

## 流程（审验 → 挑毛病 → 问题进处理中心）

```
① AI 逐一审验工单证据链（查 journal / 截图 / 命令 是否构成完整可信链）
② 挑毛病：证据链断裂 / 缺证据 / 时间不合理（伪造）/ 命令含失败标记 / 内容不相关
③ 发现问题 → 登记到 `处理中心\问题区\问题区.md`（问题清单加行）
④ 设计师处理（解决 / 升级 / 打回补证）
```

## 工具：审验.py（已落地 · SYS-01 P0-3）

```bash
python 审验.py --ticket <工单号> --json    # 审验单工单证据链 + integrity_flags + integrity_review
python 审验.py --ticket <工单号>           # 文本输出
python 审验.py --list                      # 列出有证据的工单
python 审验.py --dir <证据目录> [--json]   # 对指定证据目录直接审验（构造边界用例用）
python 审验.py --manifest <manifest.json>  # 独立验证 evidence_manifest（P0-2 绑定 hash + 层B逐条）
```

输出：证据链（journal 工具调用链 + 截图 + 命令）+ **`integrity_flags`（层A 行为欺骗四分类，机器只出 flag）+ `evidence_integrity`（层B 证据对象真实性六项）** + `integrity_review`（人工裁决，默认空）+ 检查点（problems）。
**红线：`integrity_flags` 绝不自动等价「不通过」——最终判定由人工完成 `integrity_review`（status: confirmed/cleared/unresolved，reviewer/reviewed_at 必填）。**

## 审验依据（工单 ↔ 证据链映射）

`工单证据链映射.md`：工单号 → 证据目录 + 证据链（journal/截图/命令数量），AI 按此逐一审验。

## 挑出的问题 → 处理中心（问题区）

发现问题的登记格式（`处理中心\问题区\问题区.md` 问题清单加行）：
```
| 日期 | 角色 | 问题（工单 + 证据链问题 + 建议） | 设计师处理 | 状态 |
| 2026-08-18 | 审验员 | **rXX 证据链问题**：现象 → 证据 → 建议 | ⏳待设计师 | — |
```

## 审验检查点（P0-3 两层分离 · 挑什么毛病）

> 机器只出 **flag** 不当结论；每条 flag 附 `signal`（检测信号）供人工裁决。最终判定在 `integrity_review`。

### 层 A：行为欺骗（Behavioral Suspicion）—— 四分类，`integrity_flags`

| 类别（flag） | 检测信号（signal） | 异常（→ 登记问题） |
|---|---|---|
| ① `original_rerun` 原样重跑 | 多张截图时间戳批量完全相同 + 无 journal | 交付分支 vs 工单表登记 hash diff 空/极小，仅时间戳/窗口变化 |
| ② `benchmark_overfit` 基准过拟合 | 文本弱断言（存在/非空/==0 类）≥5 处且无 journal | 测试代码引用基准/产物本身；断言只查「存在」不查语义 |
| ③ `semantic_vagueness` 语义模糊化 | 报告强断言（已支持/已实现/已完成…）但无 journal 调用且无截图 | 报告描述与代码行为不一致；「已支持 X」但 X 只被 mock/固定值 |
| ④ `time_inconsistency` 时序不一致 | 截图(精确时间)早于 journal 最早工具调用 | 截图/日志时间早于工具调用；虚假时间戳 |

### 层 B：证据对象真实性（Evidence Integrity）—— 独立层，`evidence_integrity`，不混入四分类

| 项 | 判定 |
|---|---|
| file_exists | 目录有截图/命令产物 |
| hash_matches | 绑定 `evidence_manifest_sha` 重算一致（None = 无 manifest 绑定，N/A） |
| timestamp_plausible | 文件 mtime 不晚于当前 |
| producer_known | 证据路径含已知产出角色（验收员/程序员/审验员/设计师/检查证据） |
| source_path_valid | 证据目录非空（源路径有效） |
| chain_intact | journal 调用 + 截图 + 命令 三环节齐全 |

### 既有检查项（保留）

| 检查 | 异常（→ 登记问题） |
|---|---|
| 证据链断裂 | journal 无工具调用（AI 口头说没真调） |
| 缺证据 | 无截图 / 无命令 / 无 journal |
| 失败标记 | 命令含 失败/不存在/FAILED |
| 内容不相关 | 证据与工单功能无关 |
| **标准冻结对账**（SYS-01 P0-1） | 引用 `STD-<工单号>-v<n>` 冻结区 `content_sha256` 重算不一致 / 引用未冻结的散写标准。命令见 `验收标准冻结区\README.md` §六 |
| **交付绑定对账**（SYS-01 P0-2） | `delivery_id` 缺失 / 三重 hash（commit/artifact/evidence_manifest_sha）缺项 / `evidence_manifest_sha` 重算不一致（`审验.py --manifest` 自动比对）/ delivery 已标「⏳失效」仍被引用。细则见 `SYS\交付绑定规范.md` |

### 人工最终裁决（integrity_review）

- `integrity_flags`（机器）→ `integrity_review`（人工）：`status: confirmed / cleared / unresolved`，`reviewer / reviewed_at` 必填
- **关键约束**：`integrity_flags` 绝不自动等价「不通过」，最终判定由人工完成
- `unresolved` 必须归属退出：超时（3 工作日）→ 转挂账待设计师定夺（防永久挂起）

## 与工单系统结合
| 环节 | 位置 |
|---|---|
| 工单权威 | `工单流转中心\工单表.xlsx` |
| 验收证据 | `验收员\证据数据\<日期>\<工单>\` |
| **AI 审验** | `审验.py` + `工单证据链映射.md` |
| **问题落点** | `处理中心\问题区\问题区.md`（设计师处理） |

## 关键
- 审验是「逐一 + 挑毛病」，不是抽样
- 每个工单的证据链被 AI 逐环节核对（journal 调用链 → 截图时间 → 命令结果）
- 问题统一进处理中心，设计师集中处理（解决/升级/打回）

## 审验范围扩展：MCP 工具层（2026-08-18）
- 工具层大重构后，新工具层需审验：MCP 接口契约（tool/list+tool/call 正确）、错误信封、真实能力（非占位）、PII 纪律
- 审验依据：`证据链规范.md`（journal 工具调用链 + 截图 + 命令）
