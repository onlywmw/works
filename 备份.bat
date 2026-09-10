@echo off
chcp 65001 >nul
echo ================================================
echo  MOV 九库每日备份
echo  目标：C:\mov备份\（2026-09-10 拍板：主仓在 E 盘，备份投 C 盘——真第二介质；原先备份与主仓同在 E 盘=单盘双杀）
echo ================================================
set BAK=C:\mov备份
set SRC=C:\Users\Administrator\Desktop\MOV
rem 日期戳：%date% 切片在中文区域下会切出「周四」畸形目录（2026-09-10 实测事故）——改 PowerShell 取数，区域无关
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd"') do set TS=%%i
mkdir "%BAK%\%TS%" 2>nul

echo [1/3] git bundle（九库）...
rem 2026-09-10 定稿：七体系平铺根层；云服务器管理/运营中心 = 体系内部成员（独立嵌套库，归安卓中国）
for %%d in ("安卓中国体系建设" "安卓中国体系建设\云服务器管理" "安卓中国体系建设\运营中心" "ios体系建设—苹果" "pc端体系建设" "安卓全球版体系建设—谷歌" "网页体系建设" "腾讯微信生态" "鸿蒙体系建设") do (
  if exist "%SRC%\%%~d\.git" (
    echo   bundling %%~d ...
    git -C "%SRC%\%%~d" bundle create "%BAK%\%TS%\%%~nxd.bundle" --all 2>nul
  )
)
git -C "%SRC%" bundle create "%BAK%\%TS%\works.bundle" --all 2>nul

echo [2/3] 归档区 robocopy ...
robocopy "%SRC%\安卓中国体系建设\处理中心\归档" "%BAK%\%TS%\归档" /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS

echo [3/3] 关键账本 robocopy ...
robocopy "%SRC%\安卓中国体系建设\处理中心" "%BAK%\%TS%\处理中心" *.md /R:1 /W:1 /NFL /NDL /NJH /NJS

echo.
echo 备份完成 → %BAK%\%TS%\
echo 建议每周手动跑一次，或加入任务计划程序。
pause
