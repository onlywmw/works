# SYS-46 B：席位窗标题动效（conhost 标题级——TUI 冻结也能变）
# 读 seats/*.json（role/hwnd）+ 座态.json（SYS-46 A 引擎输出）→ SetWindowText 前缀 ⏳/💤/⚠️
# 独立小工具（铃2/座探同族）：不占引擎锁、不动 engine.mjs；座探按命令行（title MOV-）识窗，标题变更不扰动
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File 座态标题.ps1 [-Once]   （默认 30s 循环）
param([switch]$Once)
$ErrorActionPreference = 'Continue'
$bs = [string][char]92
$dir = 'E:' + $bs + 'MOV' + $bs + '安卓中国体系建设' + $bs + '处理中心' + $bs + '看板'
Add-Type -Namespace Win -Name T46 -MemberDefinition '
[DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern bool SetWindowTextW(IntPtr h, string t);'

function Update-Titles {
  $st = @{}
  try { $j = Get-Content ($dir + $bs + '座态.json') -Raw -Encoding UTF8 | ConvertFrom-Json; foreach ($s in $j.seats) { $st[$s.role] = $s } } catch {}
  $icons = @{ '跑动中' = '⏳'; '待命' = '💤'; '挂死嫌疑' = '⚠️' }
  foreach ($f in Get-ChildItem ($dir + $bs + 'seats' + $bs + '*.json')) {
    try { $s = Get-Content $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json } catch { continue }
    if (-not $s.hwnd -or -not $s.role) { continue }
    $stt = $st[$s.role]
    $label = if ($stt) { [string]$stt.label } else { '待命' }
    $icon = if ($icons.ContainsKey($label)) { $icons[$label] } else { '○' }
    # SYS-173：标题带体系标签（与开窗链同格式；座探按命令行认窗，此处只管任务栏观感）
    [void][Win.T46]::SetWindowTextW([IntPtr]$s.hwnd, ($icon + ' MOV-' + $s.role + '〔安卓中国〕'))
  }
}

if ($Once) { Update-Titles; exit 0 }
while ($true) { Update-Titles; Start-Sleep -Seconds 30 }
