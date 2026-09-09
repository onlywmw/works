@echo off
chcp 65001 >nul
echo ================================================
echo  MOV 九库每日备份（大神批注 ❌ 级）
echo  目标：第二介质（当前暂用 E:\mov备份\）
echo ================================================
set BAK=E:\mov备份
set SRC=C:\Users\Administrator\Desktop\MOV
set TS=%date:~0,4%%date:~5,2%%date:~8,2%
mkdir "%BAK%\%TS%" 2>nul

echo [1/3] git bundle（九库）...
for %%d in ("安卓中国体系建设" "ios体系建设—苹果" "pc端体系建设" "云服务器管理" "安卓全球版体系建设—谷歌" "网页体系建设" "腾讯微信生态" "运营中心" "鸿蒙体系建设") do (
  if exist "%SRC%\%%~d\.git" (
    echo   bundling %%~d ...
    git -C "%SRC%\%%~d" bundle create "%BAK%\%TS%\%%~d.bundle" --all 2>nul
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
