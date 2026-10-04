# 座探 v2（SYS-103 §S2/S3）：扫 MOV-* 工位窗 + 窗内 agent 子进程 → JSON
#   锚点：cmd 按 'title MOV-' / 'MOV_SEAT='（WT 标签页亦可）｜powershell 按 MOV_SEAT=
#   S2 改造：**单次** WMI 全表取进程表 + 内存配对（旧版每窗 2 次子查询 ⇒ 3+2N 次 WMI ⇒ 实测 31–41s > 引擎 20s 超时）
#   S3 收窄：node 进程不再用宽匹配（旧 `pi` 会命中任意含 pi 的 node 工具子进程）→ 改具名 CLI 签名（与引擎 SYS88_SIGS 同源）；
#           同一窗多候选时取**最浅层**（最外层=离窗最近）且「进程名=agent」优先（与 SYS-88 判据一致）
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
$all = @(Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine)
$byPid = @{}; $kids = @{}
foreach ($p in $all) {
  $byPid[[int]$p.ProcessId] = $p
  $pp = [int]$p.ParentProcessId
  if (-not $kids.ContainsKey($pp)) { $kids[$pp] = New-Object System.Collections.ArrayList }
  [void]$kids[$pp].Add($p)
}
$agentPat = 'claude|reasonix|kimi|codex|gemini|zcode|opi|pi|hermes'          # 进程名锚（exact：pi.exe/hermes.exe…）
$sigPat = 'pi-coding-agent|claude-code|reasonix|codex|gemini-cli|kimi|hermes|zcode'  # S3：CLI 包签名（与 engine SYS88_SIGS 同源）
$rows = @()
foreach ($c in $all) {
  if ($c.Name -notmatch '^(cmd|powershell|pwsh)\.') { continue }
  $cl = [string]$c.CommandLine
  if ($cl -notmatch 'title MOV-' -and $cl -notmatch 'MOV_SEAT') { continue }
  if ($cl -match 'title (MOV-[^&]+)') { $title = $Matches[1].Trim() }
  elseif ($cl -match "MOV_SEAT='?([^'`">&\s]+)") { $title = 'MOV-' + $Matches[1] }
  else { continue }
  # 子/孙辈（内存配对·零额外 WMI）；depth 1=子 2=孙
  $cand = @()
  $k1 = @(); if ($kids.ContainsKey([int]$c.ProcessId)) { $k1 = @($kids[[int]$c.ProcessId]) }
  foreach ($k in $k1) {
    $cand += [pscustomobject]@{ p = $k; depth = 1 }
    if ($kids.ContainsKey([int]$k.ProcessId)) { foreach ($g in @($kids[[int]$k.ProcessId])) { $cand += [pscustomobject]@{ p = $g; depth = 2 } } }
  }
  $best = $null; $bestKey = $null
  foreach ($x in $cand) {
    $k = $x.p; $nm = [string]$k.Name; $kcl = [string]$k.CommandLine
    $exact = ""; $nodeSig = ""
    if ($nm -match "^($agentPat)\.") { $exact = $nm -replace '\.exe$', '' }
    elseif ($nm -match '^node\.' -and $kcl -match $sigPat) { $nodeSig = $Matches[0] }
    if (-not $exact -and -not $nodeSig) { continue }
    # 排序键：层浅优先 → 「进程名=agent」优先（与 SYS-88「最外层+真身签名」同口径）
    $key = "{0}|{1}" -f $x.depth, $(if ($exact) { 0 } else { 1 })
    if ($null -eq $bestKey -or $key -lt $bestKey) { $bestKey = $key; $best = [pscustomobject]@{ pid = [int]$k.ProcessId; name = $(if ($exact) { $exact } else { $nodeSig }) } }
  }
  $cmdLine = $cl; if ($cmdLine.Length -gt 400) { $cmdLine = $cmdLine.Substring(0,400) }
  $rows += [pscustomobject]@{ title = $title; cmdPid = [int]$c.ProcessId; agentPid = $(if ($best) { $best.pid } else { 0 }); agent = $(if ($best) { $best.name } else { "" }); cmd = $cmdLine }
}
if ($rows.Count -eq 0) { "[]" } else { $rows | ConvertTo-Json -Compress }
