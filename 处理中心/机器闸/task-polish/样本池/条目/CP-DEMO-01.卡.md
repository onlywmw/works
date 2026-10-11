# 合成样本卡 CP-DEMO-01

> 由「样本池通道」接收侧生成（结构→合成素材拼装）；**假样本假数据复跑**，真件永不入池。
> 生成于：2026-10-07T08:39:47（卡内容与条目结构绑定·可复算）

## 一、基准样本与蓝图

- 基准样本卡：`样本任务卡_S-MERCHANT-01.md`（相对 task-polish 根）
- 蓝图：`merchant-v1`
- 条目来源：沙盒跑批产物
- 出侧闸：pass

## 二、卡点结构（白名单字段）

| 字段 | 值 |
|---|---|
| phase | WAITING_USER |
| event_seq | 12 |
| duration_ms | 8600 |
| error_code | — |
| field_name | shop_name |
| count | 1 |

## 三、合成素材（仅合成件）

| 槽位 | 文件 | sha256 |
|---|---|---|
| license | 素材/CP-DEMO-01/license.svg | a0006495b225… |
| id_front | 素材/CP-DEMO-01/id_front.svg | c811c10f22ea… |
| id_back | 素材/CP-DEMO-01/id_back.svg | e71780a862f2… |
| shop_front | 素材/CP-DEMO-01/shop_front.svg | 26f39c28b16d… |
| shop_inner | 素材/CP-DEMO-01/shop_inner.svg | 48ab7652c2ed… |

## 四、复跑协议

- 环入口：`node 处理中心/机器闸/task-polish/样本池/通道.mjs 读池 CP-DEMO-01`
- 消费：按基准样本卡蓝图在沙盒复跑；以上表合成素材替换真材料；卡点按上表结构复现（相位/事件序定位、错误码/字段名注入）。
- 只读约定：本卡与素材是环的**输入**；跑批产物落跑批侧，不写回池。
