# 巡检台·体系外心跳外哨（2026-09-11 大神评审②：不依赖引擎的最小兜底）——由 Windows 计划任务每 10 分钟调用
$ErrorActionPreference='Continue'
$bs=[string][char]92
$dir='E:'+$bs+'MOV'+$bs+'安卓中国体系建设'+$bs+'处理中心'+$bs+'看板'
$log=$dir+$bs+'心跳外哨.log'
$stamp=(Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
try {
  $hbAge=9999; try { $hbAge=((Get-Date)-(Get-Item ($dir+$bs+'心跳.json')).LastWriteTime).TotalMinutes } catch {}
  $ptAge=9999; try { $pt=$null; $pt=Get-Content ($dir+$bs+'巡查哨兵.json') -Raw -Encoding UTF8 | ConvertFrom-Json; if ($pt.lastAt) { $nowMs=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); $ptAge=($nowMs-[double]$pt.lastAt)/60000 } } catch {}
  $eng=@(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'engine\.mjs' })
  $msgs=@()
  if ($eng.Count -eq 0) { $msgs += ('引擎不在（心跳龄 '+[math]::Round($hbAge,1)+'min）') }
  elseif ($hbAge -gt 10) { $msgs += ('引擎心跳停摆 '+[math]::Round($hbAge,1)+'min') }
  if ($ptAge -gt 240 -and $hbAge -lt 10) { $msgs += ('巡查停摆 '+[math]::Round($ptAge,1)+'min（席挂或铃断）') } # 2026-09-30：基准钟 20min→3h（_hygienePatrolMin=180）⇒ 阈值 120→240min（3h 正常 + 1h 容错，防每轮误报）
  if ($msgs.Count -gt 0) {
    Add-Content -Path $log -Value ($stamp+' 外哨告警：'+($msgs -join '；'))
    # 桌面气泡（用户可见·不依赖引擎）
    try { Add-Type -AssemblyName System.Windows.Forms; $n=New-Object System.Windows.Forms.NotifyIcon; $n.Icon=[System.Drawing.SystemIcons]::Warning; $n.Visible=$true; $n.ShowBalloonTip(9000,'MOV 心跳外哨',($msgs -join '；'),'Warning'); Start-Sleep 8; $n.Dispose() } catch {}
    # 引擎死则拉（与看板守护同法）
    if ($eng.Count -eq 0) { Start-Process -FilePath ($dir+$bs+'看板-终端.cmd'); Add-Content -Path $log -Value ($stamp+' → 已拉引擎') }
  } else { Add-Content -Path $log -Value ($stamp+' ok 心跳'+[math]::Round($hbAge,1)+'min 巡查'+[math]::Round($ptAge,1)+'min') }
} catch { Add-Content -Path $log -Value ($stamp+' 外哨自身异常：'+$_.Exception.Message) }
