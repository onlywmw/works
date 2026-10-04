@echo off
chcp 65001 >nul
set POST_ROLE=审验员
node "%~dp0值守.mjs" %*
