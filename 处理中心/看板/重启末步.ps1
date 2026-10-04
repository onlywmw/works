# 末步重开本席（设计师）——由同席会话以 Start-Process 拉起；
# 只按 PID 杀（不用 /T），故本脚本不会随本席窗一起被杀。
$ErrorActionPreference = "Continue"
$dir = "E:/MOV/安卓中国体系建设/处理中心/看板"
$eng = Join-Path $dir "engine.mjs"
$log = Join-Path $dir "全席重启.log"
function L($m){ Add-Content -Path $log -Value ((Get-Date).ToString("HH:mm:ss") + " | " + $m) }

Start-Sleep -Seconds 40   # 缓冲：本席先把这轮话说完
$j = $null
try { $j = Get-Content (Join-Path $dir "seats\designer.json") -Raw | ConvertFrom-Json } catch {}
$cpid = $j.consolePid
$apid = $j.agentPid
L("末步重开 设计师（kill agent=" + $apid + " console=" + $cpid + "，不带 /T）")
foreach($q in @($apid, $cpid)){
  if($q -and (Get-Process -Id $q -ErrorAction SilentlyContinue)){
    & cmd /c ("taskkill /F /PID " + $q) 2>&1 | Out-Null
    Start-Sleep -Seconds 2
  }
}
Start-Sleep -Seconds 3
& node $eng seat designer 2>&1 | Out-Null
L("  设计师 重开完成——全席重启结束（本席为新会话）")
Remove-Item (Join-Path $dir "_diag.ps1"), (Join-Path $dir "_t1.ps1"), (Join-Path $dir "_t1.txt"), (Join-Path $dir "_chk2.ps1"), (Join-Path $dir "_launch_restart.ps1") -ErrorAction SilentlyContinue
