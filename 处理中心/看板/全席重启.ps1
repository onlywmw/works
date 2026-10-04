# 用法：由独立窗（看板窗/用户终端）启动，可整席重启本文件列出的各席；
# 若从某一席的会话内启动：本席自尽会被 /T 连带杀死——本席留到最后，改用 重启末步.ps1（只按 PID 杀，不带 /T）。
$ErrorActionPreference="Continue"
$dir="E:/MOV/安卓中国体系建设/处理中心/看板"
$eng=Join-Path $dir "engine.mjs"
$log=Join-Path $dir "全席重启.log"
function L($m){ Add-Content -Path $log -Value ((Get-Date).ToString("HH:mm:ss")+" | "+$m) }

Start-Sleep -Seconds 25   # 留缓冲：发起席先把自己这轮话说完
L("全席重启开始（用户口令·活 pid 来自 seats/*.json）")
# 本席（设计师）排最后——自杀式收尾，前面几席先换新会话
$order=@(
  @{role="程序员"; key="coder"},
  @{role="验收员"; key="qa"},
  @{role="审验员"; key="reviewer"},
  @{role="巡检台"; key="hygiene"},
  @{role="设计师"; key="designer"}
)
foreach($s in $order){
  $f=Join-Path $dir ("seats\"+$s.key+".json")
  $cpid=$null
  try{ $cpid=(Get-Content $f -Raw | ConvertFrom-Json).consolePid }catch{}
  if($cpid -and (Get-Process -Id $cpid -ErrorAction SilentlyContinue)){
    L("重启 "+$s.role+"（kill 树 "+$cpid+"）")
    & cmd /c ("taskkill /T /F /PID "+$cpid) 2>&1 | Out-Null
  } else { L("重启 "+$s.role+"（窗 pid " + $cpid + " 已不在,直接开窗）") }
  Start-Sleep -Seconds 2
  & node $eng seat $s.key 2>&1 | Out-Null
  L("  "+$s.role+" 重开完成")
  Start-Sleep -Seconds 8
}
Remove-Item (Join-Path $dir "_launch_restart.ps1"),(Join-Path $dir "_diag.ps1") -ErrorAction SilentlyContinue
L("全席重启结束——各席绑定 agent 自动上岗约 10-20 秒")
