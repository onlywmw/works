@echo off
chcp 65001 >nul
cd /d "%~dp0"
node 审验员\orders-overview.mjs
if exist "处理中心\验证产物\orders-overview.html" start "" "%~dp0处理中心\验证产物\orders-overview.html"
