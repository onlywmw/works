# Approval Capability Registry（UPG-68 · 生成物）

> 由 `ApprovalRegistryGeneratorTest` 生成（categories/semantics 人工分类 + 派生合并）；消费者=PermissionGuard（单源）+ 单 B 语义解释器。

## 触发/拦截工具登记（201 行）

| tool | category | riskLevel | approvalMode | semanticType | action | reversibility | fallback |
|---|---|---|---|---|---|---|---|
| a2a.message | sensitive | high | gate | sensitive | 执行一项系统操作 | low | 无法确定此操作 |
| account.logout | write | medium | ask | state_change | 退出登录 | medium | AI 想退出当前账号 |
| account.me | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| agent.stop | write | medium | ask | state_change | 停止当前会话 | medium | AI 想停止当前会话 |
| approval.getMode | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| approval.setMode | write | high | ask | state_change | 切换审批模式 | medium | AI 想切换审批模式（仅 UI 可操作） |
| asset.catalog | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| asset.credPeek | read | high | ask | credential_peek | 查看一组凭据明文 | high | AI 想查看一组凭据明文 |
| asset.credentials | read | medium | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| asset.peekPhoto | read | medium | ask | vault_peek | 预览证件照 | high | AI 想预览一张证件照 |
| battery.status | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| biz.bookingAction | write | high | ask | state_change | 操作一条预约 | medium | AI 想确认/拒绝/取消一条预约 |
| biz.bookingMine | read | medium | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| biz.onboardPhoto | write | high | ask | state_change | 上传商户证件照 | medium | AI 想上传一张商户证件照 |
| biz.onboardScan | write | high | ask | state_change | 识别证件并回填入驻草稿 | medium | AI 想识别证件照并自动回填入驻资料 |
| biz.onboardSet | sensitive | high | gate | sensitive | 填写入驻草稿字段 | low | AI 想填写商户入驻资料 |
| biz.onboardStart | write | medium | ask | state_change | 创建入驻草稿 | medium | AI 想开始商户入驻流程 |
| biz.onboardStatus | read | medium | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| biz.onboardSubmit | sensitive | high | gate | sensitive | 提交微信商户入驻申请 | low | AI 想提交商户入驻申请（不可撤回） |
| biz.profInfo | read | medium | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| biz.taskAction | write | high | ask | state_change | 操作一条任务 | medium | AI 想接单/完成/取消一条任务 |
| biz.taskClaim | write | medium | ask | state_change | 领取一条任务 | medium | AI 想领取一条任务 |
| biz.taskMine | read | medium | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| biz.taskOpen | write | medium | ask | state_change | 打开一条任务 | medium | AI 想打开一条任务 |
| bluetooth.off | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| bluetooth.on | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| bluetooth.status | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| brightness.get | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| brightness.set | write | low | ask | system_setting | 调亮度 | high | AI 想调整屏幕亮度 |
| calendar.add | write | medium | ask | calendar_write | 添加日程 | medium | AI 想添加一条日历日程 |
| calendar.list | write | medium | ask | calendar_read | 读取日程 | high | AI 想读取你的日程安排 |
| call.log | sensitive | high | gate | sensitive | 执行一项系统操作 | low | 无法确定此操作 |
| camera.capture | write | high | ask | camera_capture | 拍照 | medium | AI 想打开相机拍一张照片 |
| camera.ocrCapture | write | high | ask | camera_ocr | 拍照并识别文字 | medium | AI 想拍一张图并识别上面的文字 |
| causal.link | write | low | ask | causal_write | 关联因果 | medium | AI 想关联两条因果记录 |
| causal.query | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| causal.record | write | low | ask | causal_write | 记录因果 | medium | AI 想记录一条因果关系 |
| contact.read | sensitive | high | gate | sensitive | 执行一项系统操作 | low | 无法确定此操作 |
| contacts.search | sensitive | high | gate | sensitive | 执行一项系统操作 | low | 无法确定此操作 |
| credential.getKey | read | high | free | credential_read | 读取凭据 | high | AI 想读取一个 API 密钥（高危数据） |
| credential.read | system_baseline | high | gate | system_baseline | 执行一项系统操作 | low | 无法确定此操作 |
| credential.setKey | write | high | free | credential_write | 保存凭据 | medium | AI 想保存一个 API 密钥 |
| date | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| device.appLaunch | write | medium | ask | app_launch | 打开应用 | high | AI 想帮你打开一个应用 |
| device.appList | read | medium | free | system_read | 查应用列表 | high | AI 想查看已安装的应用 |
| device.network | read | low | free | system_read | 查网络状态 | high | AI 想查看网络状态 |
| device.storage | read | low | free | system_read | 查存储状态 | high | AI 想查看存储空间 |
| device.timer | write | low | ask | system_timer | 设置计时/提醒 | high | AI 想设置一个计时器 |
| device.toast | write | low | ask | ui_toast | 显示提示 | high | AI 想在屏幕上显示一条提示 |
| echo | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| error.classify | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| error.report | write | medium | ask | state_change | 上报错误 | medium | AI 想上报一条错误 |
| file.read | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| file.write | write | medium | ask | file_write | 写入文件 | low | AI 想写入一个文件 |
| goal.complete | write | medium | ask | state_change | 完成目标 | medium | AI 想完成一个目标 |
| goal.set | write | medium | ask | state_change | 设定目标 | medium | AI 想设定一个目标 |
| goal.status | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| http.download | write | medium | ask | state_change | 下载文件到本机 | medium | AI 想下载一个文件 |
| http.get | read | medium | free | read_only | 请求外部地址（只读） | high | AI 想请求一个外部地址 |
| http.post | write | high | ask | network_send | 向外发送数据 | low | AI 想把数据发送到一个外部服务器 |
| identity.read | sensitive | high | gate | sensitive | 执行一项系统操作 | low | 无法确定此操作 |
| image.info | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| image.ocr | read | medium | free | read_only | 识别图片文字 | high | AI 想识别图片里的文字 |
| keystore.read | system_baseline | high | gate | system_baseline | 执行一项系统操作 | low | 无法确定此操作 |
| location.get | sensitive | high | gate | sensitive | 执行一项系统操作 | low | 无法确定此操作 |
| location.read | sensitive | high | gate | sensitive | 执行一项系统操作 | low | 无法确定此操作 |
| market.disable | write | medium | ask | package_toggle | 停用能力包 | high | AI 想停用一个能力包 |
| market.enable | write | medium | ask | package_toggle | 启用能力包 | high | AI 想启用一个能力包 |
| market.install | write | high | ask | package_install | 安装能力包 | medium | AI 想安装一个能力包 |
| market.list | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| market.localOverview | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| market.refresh | write | medium | ask | state_change | 刷新能力市场 | medium | AI 想刷新能力市场 |
| market.status | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| market.uninstall | write | medium | ask | package_uninstall | 卸载能力包 | medium | AI 想卸载一个能力包 |
| marketAdmin.approve | write | high | ask | state_change | 审批一条市场提交 | medium | AI 想审批通过一条市场提交 |
| marketAdmin.pending | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| marketAdmin.reject | write | high | ask | state_change | 驳回一条市场提交 | medium | AI 想驳回一条市场提交 |
| md.render | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| md.renderFile | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| memory.cover | read | medium | free | memory_read | 查看记忆覆盖 | high | AI 想查看记忆覆盖情况 |
| memory.delete | write | high | ask | memory_delete | 删除记忆条目 | low | AI 想删除一条记忆（不可恢复） |
| memory.judge | read | low | free | read_only | 评估记忆质量 | high | AI 想评估记忆 |
| memory.list | read | medium | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| memory.load | read | medium | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| memory.save | write | medium | ask | memory_write | 保存记忆 | medium | AI 想记住一条信息 |
| memory.search | read | medium | free | memory_read | 检索记忆 | high | AI 想检索你的记忆 |
| memoryos.core | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| memoryos.devRun | write | medium | ask | dev_replay | 主链回放（验证通道） | high | AI 想运行 Memory OS 主链回放 |
| memoryos.retrieve | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| memoryos.semanticList | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| memoryos.timeline | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| model.add | write | medium | ask | state_change | 添加模型 | medium | AI 想添加一个模型 |
| model.delete | write | medium | ask | state_change | 删除模型 | medium | AI 想删除一个模型 |
| model.list | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| model.setDefault | write | medium | ask | state_change | 设置默认模型 | medium | AI 想设置默认模型 |
| model.setEnabled | write | medium | ask | state_change | 启用/停用模型 | medium | AI 想启用或停用模型 |
| model.testConnection | write | high | ask | state_change | 测试模型连接（发送密钥探测） | medium | AI 想测试模型连接 |
| model.update | write | medium | ask | state_change | 更新模型配置 | medium | AI 想更新模型配置 |
| model.use | write | medium | ask | state_change | 切换当前模型 | medium | AI 想切换当前模型 |
| mov.journalTail | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| mov.roomList | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| mov.subagentList | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| note.create | write | low | ask | note_write | 写便签 | medium | AI 想写一条便签 |
| notification.post | write | low | ask | message_send | 发送通知 | high | AI 想发一条系统通知 |
| obsidian.file.read | read | medium | free | note_read | 读取笔记 | high | AI 想读你的 Obsidian 笔记 |
| obsidian.file.search | read | medium | free | note_read | 检索笔记 | high | AI 想检索你的 Obsidian 笔记 |
| obsidian.file.write | write | high | ask | note_write | 写入笔记文件 | low | AI 想写入你的 Obsidian 笔记 |
| obsidian.vault.check | read | medium | free | vault_scan | 检查授权 | high | AI 想检查 Obsidian 授权状态 |
| obsidian.vault.detect | read | medium | free | vault_scan | 检测仓库 | high | AI 想检测你的 Obsidian 仓库 |
| obsidian.vault.register | write | high | ask | vault_grant | 授权访问仓库 | high | AI 想请求访问你的 Obsidian 仓库 |
| obsidian.vault.rescan | write | medium | ask | vault_scan | 扫描仓库结构 | high | AI 想扫描你的 Obsidian 仓库 |
| package.uninstall | system_baseline | high | gate | system_baseline | 执行一项系统操作 | low | 无法确定此操作 |
| payment.pay | sensitive | high | gate | sensitive | 执行一项系统操作 | low | 无法确定此操作 |
| pdf.read | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| permission.mode | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| permission.set_mode | write | high | ask | state_change | 切换权限模式 | medium | AI 想切换权限模式（仅 UI 可操作） |
| personalization.recommend | read | medium | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| personalization.refresh | write | medium | ask | state_change | 刷新个性化画像 | medium | AI 想刷新个性化画像 |
| personalization.setEnabled | write | low | ask | personalization_toggle | 开启/关闭个性化推荐 | high | AI 想切换个性化推荐开关 |
| personalization.status | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| presentation.mode | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| presentation.set_mode | write | high | ask | state_change | 切换呈现模式 | medium | AI 想切换呈现模式（仅 UI 可操作） |
| qr.scan | write | high | ask | vision_scan | 扫描二维码 | medium | AI 想扫描一个二维码 |
| room.clearAll | write | high | ask | state_change | 清除全部房间 | medium | AI 想清除全部房间（不可恢复） |
| room.create | write | medium | ask | state_change | 新建房间 | medium | AI 想新建一个房间 |
| room.delete | write | medium | ask | state_change | 删除房间 | medium | AI 想删除一个房间 |
| room.list | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| room.pin | write | medium | ask | state_change | 钉住房间 | medium | AI 想钉住一个房间 |
| room.rename | write | medium | ask | state_change | 重命名房间 | medium | AI 想重命名一个房间 |
| room.switch | write | medium | ask | state_change | 切换房间 | medium | AI 想切换房间 |
| scene.stationLookup | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| scene.trainQuery | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| screen.capture | write | high | ask | screen_shot | 截取屏幕 | medium | AI 想截取当前的屏幕画面 |
| screen.on | write | low | ask | state_change | 点亮屏幕 | medium | AI 想点亮屏幕 |
| search | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| secure.delete | system_baseline | high | gate | system_baseline | 执行一项系统操作 | low | 无法确定此操作 |
| security.footprint | read | low | free | page_bridge_security | 查看数据足迹 | high | AI 想查看数据足迹（UI 专用） |
| security.overview | read | low | free | page_bridge_security | 读取安全中心总览 | high | AI 想查看安全中心总览 |
| security.set | system_baseline | high | gate | system_baseline | 执行一项系统操作 | low | 无法确定此操作 |
| security.setApprovalMode | sensitive | high | gate | page_bridge_security | 切换审批模式 | high | AI 想切换审批模式（UI 专用） |
| security.setDataSync | sensitive | medium | gate | page_bridge_security | 切换数据同步 | high | AI 想切换数据同步（UI 专用） |
| security.setRememberEnabled | sensitive | low | gate | page_bridge_security | 切换记住偏好 | high | AI 想切换记住偏好（UI 专用） |
| security.setSensitiveDisplay | sensitive | medium | gate | page_bridge_security | 切换敏感显示 | high | AI 想切换敏感信息显示（UI 专用） |
| sensor.list | read | low | free | system_read | 查传感器 | high | AI 想查看设备传感器 |
| session.reference | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| session.search | read | medium | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| shell.exec | write | high | ask | command_exec | 执行命令 | low | AI 想执行一条命令 |
| silent.off | write | low | ask | system_setting | 关闭静音 | high | AI 想关闭静音 |
| silent.on | write | low | ask | system_setting | 开启静音 | high | AI 想开启静音 |
| sms.read | sensitive | high | gate | sensitive | 执行一项系统操作 | low | 无法确定此操作 |
| sms.recent | sensitive | high | gate | sensitive | 执行一项系统操作 | low | 无法确定此操作 |
| sms.send | sensitive | high | gate | sensitive | 执行一项系统操作 | low | 无法确定此操作 |
| spill.clean | write | medium | ask | state_change | 清理临时文件 | medium | AI 想清理临时文件 |
| spill.list | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| subagent.run | write | high | ask | state_change | 启动子代理 | medium | AI 想启动一个子代理处理任务 |
| text2image | write | high | ask | state_change | 生成图片 | medium | AI 想生成一张图片 |
| tool.help | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| torch.off | write | low | ask | device_control | 关手电 | high | AI 想关闭手电筒 |
| torch.on | write | low | ask | device_control | 开手电 | high | AI 想打开手电筒 |
| torch.status | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.getPins | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.getProfile | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.listComponents | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.openAppearance | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.openAssets | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.openMarket | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.openMarketReview | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.openMemory | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.openModels | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.openOrders | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.openSettings | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.openVault | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.openWorkbench | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| ui.prefillInput | write | low | ask | state_change | 预填输入框 | medium | AI 想预填一条输入 |
| ui.setLang | write | medium | ask | state_change | 切换语言 | medium | AI 想切换界面语言 |
| ui.setPins | write | medium | ask | state_change | 钉选工作台工具 | medium | AI 想调整工作台钉选 |
| ui.setVariant | write | medium | ask | state_change | 切换界面主题 | medium | AI 想切换界面主题 |
| usage.summary | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| vault.credDelete | write | high | ask | credential_delete | 删除平台凭据 | low | AI 想删除一组平台凭据（不可恢复） |
| vault.credPeek | read | high | free | credential_peek | 预览凭据 | high | AI 想预览一组凭据 |
| vault.credSet | write | high | ask | credential_write | 保存平台凭据 | medium | AI 想保存一组平台账号密码 |
| vault.delete | write | high | ask | vault_delete | 删除条目 | medium | AI 想删除保险柜条目（5 秒内可撤销；凭据删除不可撤销） |
| vault.get | read | high | ask | vault_read | 读取条目 | high | AI 想读取保险柜条目（内容可能敏感） |
| vault.list | read | medium | free | vault_read | 列出条目 | high | AI 想查看你的保险柜条目 |
| vault.peek | read | high | free | vault_peek | 预览条目 | high | AI 想预览保险柜条目 |
| vault.peekPhoto | read | high | free | vault_peek | 预览照片 | high | AI 想预览保险柜照片 |
| vault.restore | write | low | ask | vault_undo | 撤销最近一次删除 | high | AI 想撤销最近一次删除 |
| vault.scanPhoto | write | medium | ask | vault_read | 扫描照片 | high | AI 想查看保险柜里的照片 |
| vault.set | write | high | ask | vault_write | 保存条目 | medium | AI 想向保险柜保存一条内容 |
| vault.setPhoto | write | medium | ask | vault_write | 保存照片 | medium | AI 想保存一张照片到保险柜 |
| vibrate | write | low | ask | state_change | 震动 | medium | AI 想让手机震动一下 |
| volume.get | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| volume.set | write | low | ask | system_setting | 调音量 | high | AI 想调整音量 |
| vpn.set | system_baseline | high | gate | system_baseline | 执行一项系统操作 | low | 无法确定此操作 |
| wifi.off | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| wifi.on | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| wifi.status | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| workflow.resume | write | medium | ask | state_change | 恢复工作流 | medium | AI 想恢复一个工作流 |
| workflow.run | write | high | ask | state_change | 运行工作流 | medium | AI 想运行一个工作流 |
| workflow.status | read | low | free | read_only | 执行一项系统操作 | high | 无法确定此操作 |
| xiaomi.assist | write | medium | ask | state_change | 唤起小爱助手 | medium | AI 想唤起小爱助手 |

## 防御名单（未在面）

a2a.message, bluetooth.off, bluetooth.on, call.log, contact.read, contacts.search, credential.read, identity.read, keystore.read, location.get, location.read, package.uninstall, payment.pay, secure.delete, security.set, sms.read, sms.recent, sms.send, vpn.set, wifi.off, wifi.on
