# 工单库（测试夹具·R0 特征测试专用）

> 本件=机器闸特征测试沙盒账本（R0），**非真账**——set-status / dispatch-lint / delivery-drift-check 的沙盒契约用。
> 卡号 **TST- 前缀为测试保留段**（不进取号水位扫描面·不与 UPG/SYS/W/S 真号段冲突；真账卡头正则 `[A-Z][A-Z0-9]*-\d+` 天然兼容 TST）。

## 在途

# TST-001 契约用例·主路径卡

**分类**：M0 测试 ｜ **平台**：works ｜ **仓库**：体系仓

```status
phase: registered
branch: feat/tst001
head: —
std: —
delivery_id: —
designer: —
dev: —
inspector: —
merge: —
actor: 设计师
updated_at: 2026-10-04T00:00:00
area: test
```

**状态**：📌 已立卡（R0 夹具·2026-10-04）

## 范围
夹具正文——非 TODO，供派单完整性闸的放行样例。

## 验收标准
夹具判据——非 TODO。

# SYS-99002 契约用例·空壳卡（dispatch-lint 靶·沙盒保留号）

```status
phase: in_progress
branch: feat/sys99002
head: —
std: —
delivery_id: —
designer: —
dev: —
inspector: —
merge: —
actor: 设计师
updated_at: 2026-10-04T00:00:00
area: test
```

**状态**：🔨 在施（R0 夹具·dispatch-lint 应红本卡——**SYS-99002 为测试保留号段**，仅存于本夹具与 tests/.tmp 沙盒，永不入真账/取号水位）

## 范围
TODO

## 验收标准
TODO

# TST-003 契约用例·旁观卡（不应被任何用例改动）

```status
phase: registered
branch: feat/tst003
head: —
std: —
delivery_id: —
designer: —
dev: —
inspector: —
merge: —
actor: 设计师
updated_at: 2026-10-04T00:00:00
area: test
```

**状态**：📌 已立卡（R0 夹具·旁观位——写入用例后本卡块必须原样）

## 范围
夹具正文。

## 验收标准
夹具判据。
