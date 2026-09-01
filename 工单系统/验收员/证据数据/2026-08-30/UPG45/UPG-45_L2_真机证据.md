# UPG-45 L2 真机验收证据（2026-08-30 · 设备 21770d7d）

- 场景① memory.delete：journal `approval/asked`（"默认权限：memory.delete 超出安全范围，请求允许"）→ `approval/decided allowed-turn`（room-1788071604100-70fd/session.jsonl seq 2759/2760）
- 场景② obsidian.file.write：`approval/asked` ×2（1788073070354/1788073094820）+ uiautomator 捕获弹窗 UI=approval-dialog-ui.xml（alertTitle「审批请求」+ 按钮：允许本轮@354,1785 / 拒绝@1317,1785 / 允许本次@1477,1785；Message 区空=UPG-07 P1 已知现象）；点击「允许本次」→ 弹窗关闭执行
- 场景③ notification.post：36s 轮询无弹窗；journal `tool/call notification_post` 直接执行（free 直过）
- 结论：三场景 approvalMode 与 ApprovalRegistry（ask/ask/free）一致
