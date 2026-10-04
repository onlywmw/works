# SYS-177 升级机制演习（隔离目录·v0.1.0 → 合成 v0.2.0）
# 跑法：powershell -ExecutionPolicy Bypass -File 处理中心\机器闸\tests\sys177-upgrade-drill.ps1
# 覆盖：①--release 版本递增＋CHANGELOG 段（在副本树上）②--check 三通道读数＋全挂明说＋零写 ③升级四类逐件报告
#       ④配置域保留 ⑤偏离检测（本地改良机制件·默认保留＋回流提示）⑥已装清单落盘 ⑦--upgrade 已最新零改动 ⑧--dry 零写
$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
# 演习卫生：清除 MOV_HOME 残留（root.mjs 对不存在路径写 stderr ⇒ PS5.1 EAP=Stop 会把原生 stderr 当异常）
Remove-Item Env:MOV_HOME -ErrorAction SilentlyContinue
$SYS = "E:\MOV\安卓中国体系建设"
$TOOL = Join-Path $SYS "处理中心\机器闸\打包分发.mjs"
$INSTALLER = Join-Path $SYS "处理中心\机器闸\install.ps1"
$ROOT = Join-Path $env:TEMP ("sys177-drill-" + [Guid]::NewGuid().ToString("N").Substring(0, 8))
$REL = Join-Path $ROOT "rel"
$INST = Join-Path $ROOT "inst"
New-Item -ItemType Directory -Force -Path $REL, $INST | Out-Null

function Ok([string]$m) { Write-Host "  ✅ $m" -ForegroundColor Green }
function Bad([string]$m) { Write-Host "  ❌ $m" -ForegroundColor Red; exit 1 }
function Info([string]$m) { Write-Host "  ·  $m" }
function Invoke-PS([string[]]$a) {   # 原生 stderr 不因 EAP=Stop 误炸（rc 自取）
  $old = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try { $out = & powershell @a 2>&1 } finally { $ErrorActionPreference = $old }
  return @{ out = ($out | Out-String); rc = $LASTEXITCODE }
}
function Run-Install([string[]]$extra) {
  $a = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $INSTALLER, "--dir", $INST, "--no-shortcut") + $extra
  return Invoke-PS $a
}
function TreeHash([string]$dir) {
  if (-not (Test-Path $dir)) { return "" }
  $h = @()
  Get-ChildItem -Recurse -File $dir | Sort-Object FullName | ForEach-Object {
    if ($_.Name -notlike "*.log" -and $_.Name -ne "心跳.json") {
      $h += ($_.FullName.Substring($dir.Length) + ":" + (Get-FileHash -Algorithm SHA256 -Path $_.FullName).Hash)
    }
  }
  return ($h -join "`n")
}

Write-Host "`n=== SYS-177 升级机制演习 @ $ROOT ===" -ForegroundColor Cyan

# ── ① 真实打包 v0.1.0（含 UPGRADE_MANIFEST） ──
Write-Host "`n[1] 打包 v0.1.0（真工具）" -ForegroundColor Cyan
& node $TOOL --version 0.1.0 --out $REL | ForEach-Object { Info $_ }
if ($LASTEXITCODE -ne 0) { Bad "打包 rc≠0" }
$V1 = Join-Path $REL "mov-ticket-0.1.0"
$M1 = Join-Path $V1 "UPGRADE_MANIFEST.json"
if (-not (Test-Path $M1)) { Bad "v0.1.0 包缺 UPGRADE_MANIFEST.json" }
$man1 = Get-Content -Raw -Encoding UTF8 $M1 | ConvertFrom-Json
$actual1 = (Get-ChildItem -Recurse -File $V1).Count
if ([int]$man1.package_files -ne $actual1) { Bad "清单件数 $($man1.package_files) ≠ 包内实际 $actual1" }
Ok "清单件数与包内一致（$actual1 件；机制 $($man1.classes.'机制')｜模板 $($man1.classes.'模板')｜配置域 $($man1.classes.'配置域')）"

# ── ② 合成 v0.2.0（机制件改动＋新件＋版本递增） ──
Write-Host "`n[2] 合成 v0.2.0（夹具）" -ForegroundColor Cyan
$V2 = Join-Path $REL "mov-ticket-0.2.0"
Copy-Item -Recurse -Force $V1 $V2
$mod = Join-Path $V2 "处理中心\看板\engine.mjs"
Add-Content -Path $mod -Value "// SYS177-drill：v0.2.0 机制件改动（合成·偏离靶）" -Encoding UTF8
$mod2 = Join-Path $V2 "处理中心/看板/board-data.mjs"
Add-Content -Path $mod2 -Value "// SYS177-drill：v0.2.0 机制件改动（合成·常规覆盖靶）" -Encoding UTF8
$newf = Join-Path $V2 "处理中心\机器闸\SYS177-new.mjs"
Set-Content -Path $newf -Value "// SYS177-drill：v0.2.0 新增件（合成）" -Encoding UTF8
(Get-Content -Raw -Encoding UTF8 (Join-Path $V2 "version.json")) -replace '"version"\s*:\s*"0\.1\.0"', '"version": "0.2.0"' |
  Set-Content -Path (Join-Path $V2 "version.json") -Encoding UTF8
# 重算清单（class 沿用 v1；新件=机制）＋SHA256SUMS
$clsMap = @{}; foreach ($f in $man1.files) { $clsMap[[string]$f.path] = [string]$f.class }
$files = Get-ChildItem -Recurse -File $V2 | Where-Object { $_.Name -notin @("UPGRADE_MANIFEST.json", "SHA256SUMS") }
$entries = @()
$V2FULL = (Get-Item $V2).FullName   # 短名（ADMINI~1）与 Get-ChildItem 长名 FullName 混用会错位——一律以 Get-Item 规范名为基准
foreach ($f in $files) {
  $relP = $f.FullName.Substring($V2FULL.Length + 1) -replace "\\", "/"
  $cls = if ($clsMap.ContainsKey($relP)) { $clsMap[$relP] } else { "机制" }
  $entries += [pscustomobject]@{ path = $relP; sha256 = (Get-FileHash -Algorithm SHA256 -Path $f.FullName).Hash.ToLower(); class = $cls }
}
$classes2 = @{}; foreach ($e in $entries) { $classes2[$e.class] = 1 + ($classes2[$e.class] -as [int]) }
$man2 = [pscustomobject]@{ name = "mov-ticket"; version = "0.2.0"; built_at = (Get-Date).ToString("s"); generator = "drill";
  count = $entries.Count; package_files = $entries.Count + 2; excludes = @("UPGRADE_MANIFEST.json", "SHA256SUMS"); classes = $classes2; files = $entries }
$man2 | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $V2 "UPGRADE_MANIFEST.json") -Encoding UTF8
$sums2 = ($entries | Sort-Object path | ForEach-Object { "$($_.sha256)  $($_.path)" }) -join "`n"
Set-Content -Path (Join-Path $V2 "SHA256SUMS") -Value ($sums2 + "`n") -Encoding UTF8
Ok "v0.2.0 夹具就绪（机制件改动 engine.mjs＋新件 SYS177-new.mjs＋版本 0.2.0）"

# ── ③ --dry 零写断言 ──
Write-Host "`n[3] --dry 零写断言" -ForegroundColor Cyan
$before = TreeHash $INST
$r = Run-Install @("--local", $V1, "--dry")
if ($r.out -notmatch "DRY") { Bad "--dry 未生效（输出无 DRY）" }
if ((TreeHash $INST) -ne $before) { Bad "--dry 改动了安装位" }
Ok "--dry 零写（安装位指纹不变）"

# ── ④ 首装 v0.1.0（写已装清单） ──
Write-Host "`n[4] 首装 v0.1.0" -ForegroundColor Cyan
$r = Run-Install @("--local", $V1)
if ($r.rc -ne 0) { Bad "首装 rc=$($r.rc)`n$($r.out)" }
$IM = Join-Path $INST ".installed-manifest.json"
if (-not (Test-Path $IM)) { Bad "首装未落 .installed-manifest.json" }
$iman = Get-Content -Raw -Encoding UTF8 $IM | ConvertFrom-Json
Ok "首装完成；已装清单 v$($iman.version)（$($iman.count) 件·基线）"

# ── ⑤ --check（--local 有新版；全通道失败明说；零写） ──
Write-Host "`n[5] --check" -ForegroundColor Cyan
$before = TreeHash $INST
$a = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $INSTALLER, "--dir", $INST, "--check", "--local", $V2)
$outA = (Invoke-PS $a).out
if ($outA -notmatch "v0\.1\.0 → v0\.2\.0") { Bad "--check 未报「v0.1.0 → v0.2.0」`n$outA" }
Ok "--check（--local）：v0.1.0 → v0.2.0＋升级命令提示"
$b = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $INSTALLER, "--dir", $INST, "--check",
  "--raw-version-url", "http://127.0.0.1:1/x", "--gh-api-url", "http://127.0.0.1:1/x", "--official-version-url", "http://127.0.0.1:1/x")
$rB = Invoke-PS $b
$outB = $rB.out
$rcB = $rB.rc
if ($outB -notmatch "全部通道不可用" -or $rcB -eq 0) { Bad "全通道失败未明说/rc=$rcB`n$outB" }
Ok "全通道失败：明说缺件＋--local 指引（rc=$rcB）"
if ((TreeHash $INST) -ne $before) { Bad "--check 改动了安装位（零写破）" }
Ok "--check 零写（安装位指纹不变）"

# ── ⑥ 造偏离：机制件本地改良＋配置域自定义 ──
Write-Host "`n[6] 造偏离（机制件＋配置域）" -ForegroundColor Cyan
Add-Content -Path (Join-Path $INST "处理中心\看板\engine.mjs") -Value "// 本地改良：drill 自加" -Encoding UTF8
Add-Content -Path (Join-Path $INST "处理中心\工单库.md") -Value "`n（本地自定义账本行）" -Encoding UTF8
Ok "已改 处理中心\机器闸\engine.mjs（机制）+ 处理中心\工单库.md（配置域）"

# ── ⑦ 升级 v0.2.0（四类报告＋保留校验） ──
Write-Host "`n[7] 升级 v0.2.0" -ForegroundColor Cyan
$r = Run-Install @("--upgrade", "--local", $V2)
$up = $r.out
Write-Host $up
if ($r.rc -ne 0) { Bad "升级 rc=$($r.rc)" }
foreach ($k in @("新增 1", "覆盖 2", "保留 20", "冲突 1")) { if ($up -notmatch [regex]::Escape($k)) { Bad "报告缺类：$k" } }
if ($up -notmatch "SYS177-new\.mjs") { Bad "报告未列新增件 SYS177-new.mjs" }
if ($up -notmatch "engine\.mjs（本机 ") { Bad "报告未把 engine.mjs 列为冲突（本地偏离）" }
if ($up -notmatch "回流") { Bad "缺回流提示" }
Ok "四类逐件报告齐（新增 1/覆盖 2/保留 20/冲突 1＋回流提示）"
$eng = Get-Content -Raw -Encoding UTF8 (Join-Path $INST "处理中心\看板\engine.mjs")
if ($eng -notmatch "本地改良：drill 自加") { Bad "偏离机制件被静默覆盖（本地改良行丢失）" }
if ($eng -match "偏离靶") { Bad "偏离件被覆盖（v0.2.0 改动行进入了本地偏离件）" }
Ok "偏离件默认保留本地（未被静默覆盖）"
$bd = Get-Content -Raw -Encoding UTF8 (Join-Path $INST "处理中心/看板/board-data.mjs")
if ($bd -notmatch "常规覆盖靶") { Bad "常规机制件未更新（覆盖靶缺失）" }
Ok "常规机制件按包更新（board-data.mjs）"
$bk = Get-ChildItem -Directory (Join-Path $INST ".upgrade-backup-*") | Select-Object -First 1
if (-not $bk -or -not (Test-Path (Join-Path $bk.FullName "处理中心/看板/board-data.mjs"))) { Bad "覆盖前旧件未备份" }
Ok "覆盖前旧件已备份（.upgrade-backup-*/处理中心/看板/board-data.mjs）"
$lib = Get-Content -Raw -Encoding UTF8 (Join-Path $INST "处理中心\工单库.md")
if ($lib -notmatch "本地自定义账本行") { Bad "配置域件被覆盖（自定义行丢失）" }
Ok "配置域保留本机（工单库.md 自定义行在）"
if (-not (Test-Path (Join-Path $INST "处理中心\机器闸\SYS177-new.mjs"))) { Bad "新增件未落地" }
$iman2 = Get-Content -Raw -Encoding UTF8 $IM | ConvertFrom-Json
if ([string]$iman2.version -ne "0.2.0") { Bad "已装清单未更新到 0.2.0（$($iman2.version)）" }
Ok "已装清单更新 v0.2.0（$($iman2.count) 件·下轮基线）"

# ── ⑧ --upgrade 已最新 ⇒ 零改动 ──
Write-Host "`n[8] --upgrade 幂等（已最新）" -ForegroundColor Cyan
$before = TreeHash $INST
$r = Run-Install @("--upgrade", "--local", $V2)
if ($r.out -notmatch "已是最新") { Bad "重复 --upgrade 未报「已是最新」`n$($r.out)" }
if ((TreeHash $INST) -ne $before) { Bad "已最新仍改动了安装位" }
Ok "已最新：零改动退出"

# ── ⑨ --release 夹具（副本树上递增版本＋CHANGELOG 段·零触碰真版本源） ──
Write-Host "`n[9] --release（夹具树）" -ForegroundColor Cyan
$RT = Join-Path $ROOT "reltest"
foreach ($d0 in @("处理中心/机器闸", "处理中心/看板", "处理中心/邮局")) { New-Item -ItemType Directory -Force -Path (Join-Path $RT $d0) | Out-Null }
Copy-Item $TOOL (Join-Path $RT "处理中心/机器闸/打包分发.mjs")
Set-Content -Encoding UTF8 -Path (Join-Path $RT "处理中心/README.md") -Value "# t"
Set-Content -Encoding UTF8 -Path (Join-Path $RT "处理中心/看板/tool-x.mjs") -Value "// x"
Set-Content -Encoding UTF8 -Path (Join-Path $RT "处理中心/邮局/post-office.mjs") -Value "// p"
Set-Content -Encoding UTF8 -Path (Join-Path $RT "处理中心/机器闸/version.json") -Value '{"name":"mov-ticket","version":"0.1.0"}'
Set-Content -Encoding UTF8 -Path (Join-Path $RT "处理中心/机器闸/CHANGELOG.md") -Value "# CHANGELOG`n`n## 0.1.0`n`n- a`n"
Set-Content -Encoding UTF8 -Path (Join-Path $RT "处理中心/机器闸/发行版README.md") -Value "# r"
Set-Content -Encoding UTF8 -Path (Join-Path $RT "处理中心/机器闸/install.ps1") -Value "# i"
& node (Join-Path $RT "处理中心/机器闸/打包分发.mjs") --release --note "drill 版本递增（夹具）" --no-zip --out (Join-Path $RT "out") | ForEach-Object { Info $_ }
if ($LASTEXITCODE -ne 0) { Bad "--release 打包 rc≠0" }
$vj = Get-Content -Raw -Encoding UTF8 (Join-Path $RT "处理中心/机器闸/version.json") | ConvertFrom-Json
if ([string]$vj.version -ne "0.1.1") { Bad "--release 未递增（$($vj.version)）" }
$cl2 = Get-Content -Raw -Encoding UTF8 (Join-Path $RT "处理中心/机器闸/CHANGELOG.md")
if ($cl2 -notmatch "## 0\.1\.1") { Bad "CHANGELOG 缺新段" }
if (-not (Test-Path (Join-Path $RT "out/mov-ticket-0.1.1/UPGRADE_MANIFEST.json"))) { Bad "--release 包缺 UPGRADE_MANIFEST" }
Ok "--release：0.1.0 → 0.1.1＋CHANGELOG 段＋包内清单（夹具树）"

Write-Host "`n=== 演习全过 ===" -ForegroundColor Green
Write-Host "  工作根：$ROOT（可人工复查后删除）"
