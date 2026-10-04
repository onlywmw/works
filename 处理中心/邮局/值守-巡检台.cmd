@echo off
chcp 65001 >nul
set POST_ROLE=巡检台
node "%~dp0值守.mjs" %*
