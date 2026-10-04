@echo off
chcp 936 >nul 2>nul
title MOV-看板〔安卓中国〕
rem ── SYS-42/C 环境项：有 wt 自动转场（无 wt 原状）；窗口 <120x34 时提示建议尺寸（≤5 行） ──
rem 【编码锚】本文件为 GBK(936) 编码——改中文提示请勿另存为 UTF-8（cmd 解析 UTF-8 批处理会偶发咬行，2026-09-11 实测）
if /i "%~1"=="wt" goto :board
if defined WT_SESSION goto :board
where wt.exe >nul 2>nul
if errorlevel 1 goto :board
start "" wt.exe -w new cmd /c "%~f0" wt
exit /b

:board
set "SZ="
for /f "tokens=1,2" %%a in ('powershell -NoProfile -Command "$w=$Host.UI.RawUI.WindowSize; if($w.Width -lt 120 -or $w.Height -lt 34){ 'SMALL ' + $w.Width + 'x' + $w.Height }" 2^>nul') do if /i "%%a"=="SMALL" set "SZ=%%b"
if defined SZ (
  echo [窗口建议] 当前 %SZ%，不足 120x34：矮窗看板自动折叠（巡检台+今日 一行），工单表按预算显示行。
  echo [窗口建议] 调整：拖拽窗口右下角放大或最大化窗口，再重新运行本脚本，可获得完整看板视图。
  echo.
)
powershell -NoProfile -Command "[IO.File]::AppendAllText('%~dp0全席重启.log', (Get-Date).ToString('HH:mm:ss') + ' | 引擎换新（看板-终端.cmd）' + [Environment]::NewLine)"
chcp 65001 >nul
node "%~dp0engine.mjs" board
