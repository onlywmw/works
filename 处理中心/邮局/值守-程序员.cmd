@echo off
chcp 65001 >nul
set POST_ROLE=程序员
node "%~dp0值守.mjs" %*
