# Seat detection (v4): ASCII-only content (PS 5.1 parses non-BOM files as ANSI/GBK -- no Chinese literals here).
#   primary: seats/<role>.json registry {pid,hwnd}, validated via IsWindow (title-agnostic -- claude overrides titles)
#   fallback: process commandline scan (node engine.mjs duty|agent <key>) + window title MOV-*
# Output per seat: "<pid>|MOV-<key>|0,0,0,0"
$ErrorActionPreference = 'SilentlyContinue'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$keys = @('designer', 'coder', 'qa', 'reviewer', 'hygiene')
Add-Type -Namespace Win -Name Native -MemberDefinition '[DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);'
$found = @{}
$regDir = Join-Path $here 'seats'
if (Test-Path $regDir) {
  Get-ChildItem $regDir -Filter '*.json' | ForEach-Object {
    try { $j = Get-Content $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json } catch { return }
    if ($j.on -eq $true -and $j.hwnd -and [Win.Native]::IsWindow([IntPtr][long]$j.hwnd)) { $found[$_.BaseName] = "$($j.pid)|MOV-$($_.BaseName)|$($j.agent)" }
  }
}
$procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'"
foreach ($p in $procs) {
  $cl = $p.CommandLine
  if (-not $cl) { continue }
  if ($cl -like '*engine.mjs*' -and ($cl -like '*duty*' -or $cl -like '*agent*')) {
    foreach ($k in $keys) { if ($cl -like "*$k*") { $found[$k] = "$($p.ProcessId)|MOV-$k|0,0,0,0" } }
  }
}
$found.Values | ForEach-Object { "$_" }
