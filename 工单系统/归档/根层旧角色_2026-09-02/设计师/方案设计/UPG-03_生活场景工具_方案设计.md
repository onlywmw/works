# UPG-03 生活场景工具（12306 / 地图）· 方案设计

> 设计人：设计师 ｜ 日期：2026-08-26 ｜ 状态：✅ 方案完成，待派单（12306 已有实验代码，需程序员正式认领复核）｜ 优先级：P0
> 依据：老版 `scene/` 实测 15 工具（12306 ×6 + 百度地图 ×9）+ 开发文档实验结论（2026-08-26）

---

## 一、背景

老版场景工具 = **12306 车次线 ×6**（get-tickets / get-stations-code-in-city / get-station-code-of-citys / get-station-code-by-names / get-station-by-telecode / get-interline-tickets / get-train-route-stations）+ **百度地图线 ×9**（map_geocode / map_reverse_geocode / map_search_places / map_place_details / map_directions_matrix / map_directions / map_weather / map_ip_location / map_road_traffic / map_poi_extract）。新版为 0——出行/生活服务缺口。

## 二、重要实验结论（2026-08-26 实测，决定架构）

1. **12306 必须 App 内置**：市场 MCP server（mow.kim 腾讯云 IP）实测 **5/5 被 12306 风控**（HTML 拦截）；本地家庭 IP 100% 成功 → 数据中心 IP 被拉黑。**结论：`scene.trainQuery` 走 App 内置（用户设备 IP），不能 server 化**（挂账 `挂账-12306市场server化不可行`，处理中心）。
2. **百度地图 API 无数据中心 IP 限制** → 可市场 server 化（或内置，见 §四 决策点）。
3. 开发文档协议（MCP_TOOL_DEV_GUIDE.md 三条自检）实测可执行；Android 平台 `java.net.http` 不可用（编译不过）→ 统一 `HttpURLConnection`。

## 三、工具清单（第一期）

### 12306（App 内置）
| 工具 | 功能 | 说明 |
|---|---|---|
| `scene.trainQuery` | 查余票车次（车次/时间/历时/席别票价与余票） | 老版 get-tickets 移植；参数 date/fromStation/toStation（+可选过滤） |
| `scene.stationLookup` | 关键词查车站名/站码 | 配合 trainQuery（老版 get-station-code-by-names 简化） |

### 百度地图（server 或内置，待拍板）
| 工具 | 功能 | 说明 |
|---|---|---|
| `scene.mapGeocode` | 地址→经纬度 | 老版 map_geocode |
| `scene.mapSearchPlaces` | 地点搜索（POI） | 老版 map_search_places |
| `scene.mapDirections` | 路线规划（驾车/公交/步行） | 老版 map_directions |
| `scene.mapWeather` | 城市天气 | 老版 map_weather |

## 四、方案与决策点

1. **12306**：内置实现（动线：init 铸 cookie → 动态路径 `CLeftTicketUrl` → c_url 端点轮换 → 竖线解析；字段索引照老版 Ticket12306Source）。**已有实验代码**（`SceneTools.kt`，main `bce578d`，含契约测试）——程序员认领后**复核 + 正式交付**（测试/变异/真机补 L3）。
2. **地图**：
   - 前置：需 `BAIDU_MAPS_API_KEY`（老版从设置读 `BAIDU_MAPS_API_KEY`，服务器方案需用户在开发机配置）
   - 形态二选一：**A. App 内置**（快，跟随 12306 一并交付）；**B. 市场 MCP server**（验证 server 化链路，API 风控小 → 可作示范包）
   - 建议：**A 先行**（本期闭环快），B 作为后续「市场 server 示范」单
3. 输出契约 / 错误分类 / 权限（只读 harmless auto-allow）按 dev-docs.html。

## 五、验收标准

- L1：契约单测全绿 + 变异亲杀（12306 描述/参数缺栏必红）
- L2：真机 `scene.trainQuery` 真实返回车次（截图 + journal）；地图工具返回 POI 结果
- L3：AI 对话「帮我查北京到上海高铁」→ journal 里 scene.trainQuery 真实 tool_call（不能只测函数）

## 六、待用户拍板

- [ ] 百度地图 KEY：提供/配置方式（老版那台设备上的 key 还能用吗）
- [ ] 地图形态：A 内置先行（推荐）还是 B 市场 server
