$ErrorActionPreference='Continue'
$bs=[string][char]92
$dir = 'E:'+$bs+'MOV'+$bs+'安卓中国体系建设'+$bs+'处理中心'+$bs+'看板'
$log = $dir + $bs + '看板守护.log'
$stamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
$eng = @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'engine.mjs' -and $_.Name -eq 'node.exe' })
$hbAge = 9999; try { $hbAge = ((Get-Date) - (Get-Item ($dir + $bs + '心跳.json')).LastWriteTime).TotalMinutes } catch {}
if ($eng.Count -gt 0 -and $hbAge -lt 10) { Add-Content -Path $log -Value ($stamp + ' alive pid=' + $eng[0].ProcessId + ' hb=' + [math]::Round($hbAge,1) + 'min'); exit 0 }
if ($eng.Count -gt 0) { Add-Content -Path $log -Value ($stamp + ' HUNG (pid alive but hb stale ' + [math]::Round($hbAge,1) + 'min) -> kill'); foreach ($p in $eng) { try { Stop-Process -Id $p.ProcessId -Force } catch {} } ; Start-Sleep -Seconds 2 }
Add-Content -Path $log -Value ($stamp + ' DEAD -> relaunch')
Start-Process -FilePath ($dir + $bs + '看板-终端.cmd')
exit 0