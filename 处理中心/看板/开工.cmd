@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -Command "[IO.File]::AppendAllText('%~dp0全席重启.log', (Get-Date).ToString('HH:mm:ss') + ' | 引擎换新（开工.cmd）' + [Environment]::NewLine)"
start "MOV-看板〔安卓中国〕" cmd /k node engine.mjs board
node engine.mjs hire
echo.
echo [OK] 看板窗 + 工位窗已开——各窗自动拉起绑定 agent 并上岗（首次约 10-20 秒，请勿关窗）。
echo 看板亮绿 = 上岗成功；20 秒后灯仍不亮 → 看对应窗内 agent 报错。
echo 换绑 agent：看板窗敲  绑定 程序员 kimi ｜ 绑定 全部 claude
pause
