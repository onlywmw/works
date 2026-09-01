# ponytail-bench — 极简对照测量工具（程序员工作流）

> 接入日期：2026-09-02（ponytail 规则于 0027-mov AGENTS.md 第 7 条默认生效；本工具=测量/对照）
> 来源：DietrichGebert/ponytail（MIT）benchmarks 适配（loc.js 同口径）

## 用在哪

程序员**每个编码单交付前**跑一次，作为交付报告的**申报节**（与 Token 影响申报并列）：

```
📋 Code-LOC 申报：+42 / -18 / 净 +24（注释/资产产物/锁文件已排除）
```

## 怎么跑

```bash
node "程序员/ponytail-bench/loc.mjs" --diff "base..head"   # 交付 diff 净 LOC（在主仓库跑）
node "程序员/ponytail-bench/loc.mjs" --stat                # 基准参考表
node "程序员/ponytail-bench/loc.mjs" 文件...               # 单文件统计
```

- 排除面已内置：`pages/**/assets/*`（build 产物）、`.lock`、`docs/*.jsonl`（基线数据）
- `--diff` 统计的是**干净行**（非空/非注释——loc.js 同口径）

## 评判口径（不是门槛，是自检）

| 信号 | 含义 |
|---|---|
| **净 LOC 小**（≤ 目标量级） | 极简践行 ✓ |
| 删除 ≫ 增加 | 最优（删除优于新增）✓ |
| 净 LOC 大 + 有「未要求抽象/样板」 | 自查：YAGNI 阶梯哪级没爬（该不做的功能做了） |
| 安全/证据密度缩水 | ❌ 违规——极简不豁免（AGENTS.md 红线） |

## 与官方基准的关系

ponytail 官方 54% 是 5 个 toy 任务（email validator/debounce/CSV sum/React countdown/FastAPI 限流）在 Claude 上的中位数——**不同任务方差极大（0%~94%）**。本工具在我们真实工单上记录**趋势**（交付 diff 净 LOC 累计），首 5 单后由设计师出对照结论（试点观察挂账：`挂账-ponytail试点观察`）。

## 归属

- 工具：`程序员\ponytail-bench\`（本目录）
- 规则常驻：`0027-mov\AGENTS.md` 第 7 条（极简阶梯默认生效）
- 深度档：skill `ponytail`（`/ponytail`——lite/full/ultra + audit 等子技能）
