<#
  install.ps1 —— MOV 工单系统一键安装器（UPG-467 相位①）
  入口（cmd 一条命令）：
    powershell -c "iwr -useb https://mov-ai.cn/dl/install.ps1 | iex"        # 官网（官方入口·未上架前走占位/本地）
    powershell -c "iwr -useb https://raw.githubusercontent.com/onlywmw/works/main/install.ps1 | iex"
  带参运行（本地包/演练用·下载后执行）：
    .\install.ps1 --local <包.zip 或 目录> [--dir <安装目录>] [--dry] [--sha <sha256>]
    .\install.ps1 [--channel auto|official|github] [--official-url <u>] [--github-url <u>]
    .\install.ps1 --uninstall [--purge]
  默认：装到 %USERPROFILE%\mov-ticket；官网优先、GitHub 回落；下载件一律 SHA256 校验。
  SYS-177 增补：
    .\install.ps1 --check [--local <包>]                # 版本检查（本机 vs 通道最新·只读零写）
    .\install.ps1 --upgrade [--local <包>]               # 升级（已最新则零改动退出）
    升级=按包内 UPGRADE_MANIFEST.json 逐件判定：新增/覆盖/保留（配置域）/冲突（本地偏离·默认保留+回流提示）；
    覆盖前旧件备份到 <安装位>\.upgrade-backup-<ts>\；升级后落 <安装位>\.installed-manifest.json（逐件 sha·下轮偏离基线）。
  本脚本只做声明过的事：检测/补装运行时（winget 优先）→ 取包（SHA 校验）→ 解压 → 初始化空账本 →
  自检三步出屏（engine status／工具自检／post-office status）→ 快捷方式。禁远程执行未声明内容。
#>
$ErrorActionPreference = "Stop"
$ScriptVersion = "0.1.0"

# ---------- 参数解析（$args 手解：兼容 iex 无参与直跑带参） ----------
$Opts = @{ dir = (Join-Path $env:USERPROFILE "mov-ticket"); local = $null; sha = $null; dry = $false;
           channel = "auto"; officialUrl = $null; githubUrl = $null; uninstall = $false; purge = $false;
           noShortcut = $false; version = $ScriptVersion; check = $false; upgrade = $false;
           rawVersionUrl = $null; ghApiUrl = $null; officialVersionUrl = $null }
$argv = @($args)
for ($i = 0; $i -lt $argv.Count; $i++) {
  $a = [string]$argv[$i]
  switch -Regex ($a) {
    '^(--dir|-Dir)$'          { $i++; $Opts.dir = [string]$argv[$i] }
    '^(--local|-Local)$'      { $i++; $Opts.local = [string]$argv[$i] }
    '^(--sha|-Sha)$'          { $i++; $Opts.sha = [string]$argv[$i] }
    '^(--dry|-Dry)$'          { $Opts.dry = $true }
    '^(--channel|-Channel)$'  { $i++; $Opts.channel = [string]$argv[$i] }
    '^(--official-url)$'      { $i++; $Opts.officialUrl = [string]$argv[$i] }
    '^(--github-url)$'        { $i++; $Opts.githubUrl = [string]$argv[$i] }
    '^(--version)$'           { $i++; $Opts.version = [string]$argv[$i] }
    '^(--uninstall|-Uninstall)$' { $Opts.uninstall = $true }
    '^(--purge|-Purge)$'      { $Opts.purge = $true }
    '^(--no-shortcut)$'       { $Opts.noShortcut = $true }
    '^(--check|-Check)$'      { $Opts.check = $true }
    '^(--upgrade|-Upgrade)$'  { $Opts.upgrade = $true }
    '^(--raw-version-url)$'   { $i++; $Opts.rawVersionUrl = [string]$argv[$i] }
    '^(--gh-api-url)$'        { $i++; $Opts.ghApiUrl = [string]$argv[$i] }
    '^(--official-version-url)$' { $i++; $Opts.officialVersionUrl = [string]$argv[$i] }
  }
}
if (-not $Opts.rawVersionUrl) { $Opts.rawVersionUrl = "https://raw.githubusercontent.com/onlywmw/works/main/version.json" }
if (-not $Opts.ghApiUrl) { $Opts.ghApiUrl = "https://api.github.com/repos/onlywmw/works/releases/latest" }
if (-not $Opts.officialVersionUrl) { $Opts.officialVersionUrl = "https://mov-ai.cn/dl/version.json" }
$Ver = $Opts.version
if (-not $Opts.officialUrl) { $Opts.officialUrl = "https://mov-ai.cn/dl/mov-ticket-$Ver.zip" }
if (-not $Opts.githubUrl)   { $Opts.githubUrl   = "https://github.com/onlywmw/works/releases/latest/download/mov-ticket-$Ver.zip" }
$Dir = [System.IO.Path]::GetFullPath($Opts.dir)

function Say([string]$msg, [string]$color = "Gray") { Write-Host $msg -ForegroundColor $color }
function Die([string]$why, [string]$how) {
  Say "`n❌ 失败：$why" "Red"
  if ($how) { Say "   处理：$how" "Yellow" }
  exit 1
}

function Read-PkgVersion([string]$path) {
  # 从包目录/zip 读版本（SYS-177·只读探测）：UPGRADE_MANIFEST.json → version.json
  try {
    if ((Test-Path $path) -and -not (Get-Item $path).PSIsContainer) {
      Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
      $z = [System.IO.Compression.ZipFile]::OpenRead($path)
      try {
        foreach ($name in @("UPGRADE_MANIFEST.json", "version.json")) {
          $e = $z.Entries | Where-Object { $_.FullName -eq $name -or $_.FullName -like "*/$name" } | Select-Object -First 1
          if ($e) {
            $r = New-Object System.IO.StreamReader($e.Open())
            try { $j = ($r.ReadToEnd() | ConvertFrom-Json); if ($j.version) { return [string]$j.version } } finally { $r.Close() }
          }
        }
      } finally { $z.Dispose() }
      return $null
    }
    if (Test-Path $path) {
      foreach ($name in @("UPGRADE_MANIFEST.json", "version.json")) {
        $f = Join-Path $path $name
        if (Test-Path $f) { $j = Get-Content -Raw -Encoding UTF8 $f | ConvertFrom-Json; if ($j.version) { return [string]$j.version } }
      }
    }
  } catch { }
  return $null
}
function Cmp-Ver([string]$a, [string]$b) { # a>b ⇒ 1；a=b ⇒ 0；a<b ⇒ -1；不可比 ⇒ $null
  try { $va = [version]$a; $vb = [version]$b; if ($va -gt $vb) { return 1 } elseif ($va -eq $vb) { return 0 } else { return -1 } } catch { return $null }
}
function Invoke-Check {
  Say "MOV 工单系统 版本检查（SYS-177·只读零写）" "Cyan"
  $cur = $null
  $infoPath = Join-Path $Dir "安装信息.json"
  if (Test-Path $infoPath) { try { $cur = (Get-Content -Raw -Encoding UTF8 $infoPath | ConvertFrom-Json).version } catch { } }
  if (-not $cur) { $vp = Join-Path $Dir "version.json"; if (Test-Path $vp) { try { $cur = (Get-Content -Raw -Encoding UTF8 $vp | ConvertFrom-Json).version } catch { } } }
  Say "  本机：$(if ($cur) { 'v' + $cur + '（' + $Dir + '）' } else { '未检测到安装（' + $Dir + '）' })"
  $latest = $null; $via = $null; $fails = @()
  if ($Opts.local) {
    $lp = [System.IO.Path]::GetFullPath($Opts.local)
    if (Test-Path $lp) { $latest = Read-PkgVersion $lp; if ($latest) { $via = "--local" } else { $fails += "--local（包内未发现版本件）" } }
    else { $fails += "--local（路径不存在：$lp）" }
  }
  if (-not $latest) {
    try { $j = Invoke-RestMethod -Uri $Opts.rawVersionUrl -TimeoutSec 5; if ($j.version) { $latest = [string]$j.version; $via = "works raw" } else { $fails += "works raw（响应无 version）" } }
    catch { $fails += "works raw（$($_.Exception.Message)）" }
  }
  if (-not $latest) {
    try {
      $r = Invoke-RestMethod -Uri $Opts.ghApiUrl -Headers @{ "User-Agent" = "mov-ticket-check" } -TimeoutSec 8
      if ($r.tag_name) { $latest = ([string]$r.tag_name) -replace "^mov-ticket-v", ""; $via = "Release API" } else { $fails += "Release API（响应无 tag_name）" }
    } catch { $fails += "Release API（$($_.Exception.Message)）" }
  }
  if (-not $latest) {
    try { $j = Invoke-RestMethod -Uri $Opts.officialVersionUrl -TimeoutSec 5; if ($j.version) { $latest = [string]$j.version; $via = "官网" } else { $fails += "官网（响应无 version）" } }
    catch { $fails += "官网（$($_.Exception.Message)）" }
  }
  if (-not $latest) {
    Say ""
    Say "❌ 全部通道不可用（--local／works raw／Release API／官网）——明说缺件·禁静默：" "Red"
    foreach ($f in $fails) { Say ("   ✗ " + $f) "Yellow" }
    Say "   处理：无网/发布物未上架时用离线包：.\install.ps1 --check --local <包目录|包.zip>" "Yellow"
    exit 1
  }
  if ($cur -and (Cmp-Ver $latest $cur) -gt 0) {
    Say ""
    Say "🔔 有新版本：v$cur → v$latest（经 $via）" "Green"
    Say ("   升级：.\install.ps1 --upgrade" + $(if ($Opts.local) { " --local `"$($Opts.local)`"" } else { "" })) "Green"
  } elseif ($cur -and (Cmp-Ver $latest $cur) -eq 0) {
    Say ""
    Say "✅ 已是最新：v$cur（经 $via）" "Green"
  } else {
    Say ""
    Say "🔔 通道最新：v$latest（经 $via）——本机未检测到安装/版本不可比" "Yellow"
  }
  exit 0
}
if ($Opts.check) { Invoke-Check }

Say "MOV 工单系统 安装器 v$Ver（UPG-467 相位①·SYS-177 增补）" "Cyan"
Say "  安装目录：$Dir$(if ($Opts.dry) { '  [DRY·只预览不动盘]' })"

# ---------- ① OS/权限前置 ----------
if ([Environment]::OSVersion.Version.Major -lt 10) { Die "需要 Windows 10 及以上（当前 $([Environment]::OSVersion.Version)）" "升级系统或换机" }
if ($PSVersionTable.PSVersion.Major -lt 5) { Die "需要 PowerShell 5.1+（当前 $($PSVersionTable.PSVersion)）" "升级 PowerShell" }

# ---------- 卸载分支 ----------
if ($Opts.uninstall) {
  if (-not (Test-Path $Dir)) { Say "未发现安装（$Dir）——无需卸载" "Yellow"; exit 0 }
  if ($Opts.purge) {
    if (-not $Opts.dry) { Remove-Item -Recurse -Force $Dir }
    Say "✅ 已卸载并清空（--purge）：$Dir" "Green"
  } else {
    $bk = "$Dir.data-backup-$(Get-Date -Format yyyyMMdd-HHmmss)"
    if (-not $Opts.dry) {
      New-Item -ItemType Directory -Force -Path $bk | Out-Null
      foreach ($p in @("处理中心\工单库.md","处理中心\汇报区","处理中心\问题区","处理中心\交付清单","处理中心\归档","处理中心\验收标准冻结区","处理中心\工单库_归档")) {
        $src = Join-Path $Dir $p
        if (Test-Path $src) { Copy-Item -Recurse -Force $src (Join-Path $bk $p) }
      }
      Remove-Item -Recurse -Force $Dir
    }
    Say "✅ 已卸载（数据已备份到 $bk·要彻底清用 --purge）" "Green"
  }
  exit 0
}

# ---------- ② 运行时检测（Node/Python·缺件联网补装） ----------
function Find-Cmd([string]$name) { try { (Get-Command $name -ErrorAction Stop).Source } catch { $null } }
function Get-RuntimeVer([string]$cmd, [string[]]$probeArgs) {
  # 存在但版本探针失败（WindowsApps 商店别名/坏 shim）=视为缺件（不误判）
  $p = Find-Cmd $cmd; if (-not $p) { return $null }
  try {
    $v = (& $cmd @probeArgs 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($v)) { return $null }
    return $v
  } catch { return $null }
}
$needInstall = @()
Say "`n[1/6] 运行时检测"
$nodeVer = Get-RuntimeVer "node" @("-v")
if ($nodeVer) { Say "  ✅ Node $nodeVer（$(Find-Cmd node)）" "Green" } else { Say "  ⚠ 缺 Node.js（未在 PATH 或版本探针失败）" "Yellow"; $needInstall += @{ name = "Node.js LTS"; winget = "OpenJS.NodeJS.LTS"; url = "https://nodejs.org/" } }
$pyVer = Get-RuntimeVer "python" @("-V")
if ($pyVer) { Say "  ✅ Python $pyVer" "Green" } else { Say "  ⚠ 缺 Python 3（未在 PATH 或版本探针失败）" "Yellow"; $needInstall += @{ name = "Python 3"; winget = "Python.Python.3.12"; url = "https://www.python.org/downloads/" } }
if ($needInstall.Count -gt 0) {
  $winget = Find-Cmd winget
  if ($winget) {
    foreach ($p in $needInstall) {
      Say "  → 将补装 $($p.name)：winget install $($p.winget)" "Cyan"
      if (-not $Opts.dry) {
        & winget install --id $($p.winget) -e --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -ne 0) { Die "补装 $($p.name) 失败（winget rc=$LASTEXITCODE·网络/权限/源问题）" "手动安装：$($p.url)（装完重跑本命令）" }
      }
    }
    Say "  ✅ 运行时补齐（重开终端后 PATH 生效）" "Green"
  } else {
    Die "缺运行时（$($needInstall.name -join '、')）且本机无 winget，无法自动补装" ("请手动安装：" + (($needInstall | ForEach-Object { "$($_.name) → $($_.url)" }) -join "；") + "；装完重跑本命令")
  }
}

# ---------- ③ 取包（双通道 + SHA256 校验） ----------
Say "`n[2/6] 取包"
$tmp = Join-Path $env:TEMP ("mov-ticket-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$pkgZip = $null        # 本地 zip 路径
$useLocalDir = $null   # --local 传目录时直接拷贝
if ($Opts.local) {
  $lp = [System.IO.Path]::GetFullPath($Opts.local)
  if (-not (Test-Path $lp)) { Die "--local 路径不存在：$lp" "检查路径" }
  if ((Get-Item $lp).PSIsContainer) { $useLocalDir = $lp; Say "  ✅ 本地包（目录）：$lp" "Green" }
  else { $pkgZip = $lp; Say "  ✅ 本地包（zip）：$lp" "Green" }
} else {
  $urls = @()
  switch ($Opts.channel) {
    "official" { $urls = @($Opts.officialUrl) }
    "github"   { $urls = @($Opts.githubUrl) }
    default    { $urls = @($Opts.officialUrl, $Opts.githubUrl) }   # auto：官网优先·GitHub 回落
  }
  foreach ($u in $urls) {
    if ($Opts.dry) { Say "  [DRY] 将尝试：$u" "Cyan"; continue }
    try {
      Say "  → 尝试通道：$u" "Cyan"
      $out = Join-Path $tmp "pkg.zip"
      Invoke-WebRequest -UseBasicParsing -Uri $u -OutFile $out -TimeoutSec 60
      $pkgZip = $out; Say "  ✅ 下载成功（$([math]::Round((Get-Item $out).Length/1KB)) KB）" "Green"
      try {
        $resp = Invoke-WebRequest -UseBasicParsing -Uri "$u.sha256" -TimeoutSec 30
        $shaTxt = if ($resp.Content -is [byte[]]) { [Text.Encoding]::UTF8.GetString($resp.Content) } else { [string]$resp.Content }
        if (-not $Opts.sha) { $Opts.sha = (($shaTxt -replace "^\uFEFF", "") -split '\s+')[0] }
      } catch { }
      break
    } catch {
      Say "  ⚠ 通道不可用：$($_.Exception.Message)" "Yellow"
    }
  }
  if (-not $pkgZip -and -not $Opts.dry) { Die "双通道均不可用（官网/GitHub）" "检查网络或将包放本地后 --local <pkg.zip> 安装" }
}
# SHA256 校验（远程通道强校验；本地包＝旁挂 .sha256 或实算明示）
if ($pkgZip -and -not $Opts.dry) {
  $isLocalZip = [bool]$Opts.local
  if (-not $Opts.sha) {
    $side = "$pkgZip.sha256"
    if (Test-Path $side) { $Opts.sha = ((Get-Content $side -Raw) -split '\s+')[0] }
  }
  $got = (Get-FileHash -Algorithm SHA256 -Path $pkgZip).Hash.ToLower()
  if ($Opts.sha) {
    if ($got -ne $Opts.sha.ToLower()) { Die "SHA256 不匹配（期望 $($Opts.sha) 实得 $got）" "包可能损坏/被替换——重新下载或核对来源" }
    Say "  ✅ SHA256 校验通过" "Green"
  } elseif ($isLocalZip) {
    Say "  ⚠ 本地包未提供预期 SHA256——已实算并记录：$got" "Yellow"
  } else {
    Die "缺少预期 SHA256（下载件一律校验·未取到 .sha256 副本）" "用 --sha <64位十六进制> 显式给出"
  }
}

# ---------- ④ 解压（幂等·覆盖机制面保数据面） ----------
Say "`n[3/6] 安装到 $Dir"
$prev = $null
if (Test-Path (Join-Path $Dir "安装信息.json")) {
  try { $prev = Get-Content -Raw -Encoding UTF8 (Join-Path $Dir "安装信息.json") | ConvertFrom-Json } catch { }
}
if ($prev) { Say "  检测到已装（v$($prev.version) @ $($prev.installed_at)）——按**升级**处理：机制面更新·数据面保留" "Cyan" }
$stage = Join-Path $tmp "stage"
if (-not $Opts.dry) {
  New-Item -ItemType Directory -Force -Path $stage | Out-Null
  if ($useLocalDir) { Copy-Item -Recurse -Force (Join-Path $useLocalDir "*") $stage }
  else { Expand-Archive -Path $pkgZip -DestinationPath $stage -Force }
  # 包顶层若带 mov-ticket-<ver>/ 目录则下沉
  $inner = Get-ChildItem $stage -Directory | Where-Object { $_.Name -like "mov-ticket-*" } | Select-Object -First 1
  if ($inner -and -not (Test-Path (Join-Path $stage "处理中心"))) { $stage = $inner.FullName }
  if (-not (Test-Path (Join-Path $stage "处理中心"))) { Die "包结构异常（缺 处理中心/）" "确认用的是官方发行包" }
  New-Item -ItemType Directory -Force -Path $Dir | Out-Null
  # ---------- SYS-177：升级清单 / 已装清单 / 逐件判定 ----------
  $stagedVer = Read-PkgVersion $stage
  if ($stagedVer) { $Ver = $stagedVer }   # 包内版本为准（--version 仍可显式覆盖）
  $newManifest = $null
  $mf = Join-Path $stage "UPGRADE_MANIFEST.json"
  if (Test-Path $mf) { try { $newManifest = Get-Content -Raw -Encoding UTF8 $mf | ConvertFrom-Json } catch { $newManifest = $null } }
  $imPath = Join-Path $Dir ".installed-manifest.json"
  $prevManifest = $null
  if (Test-Path $imPath) { try { $prevManifest = Get-Content -Raw -Encoding UTF8 $imPath | ConvertFrom-Json } catch { } }
  $prevFiles = @{}
  if ($prevManifest -and $prevManifest.files) { foreach ($pp in $prevManifest.files.PSObject.Properties) { $prevFiles[[string]$pp.Name] = [string]$pp.Value } }
  function Get-Sha256Of([string]$sp) { (Get-FileHash -Algorithm SHA256 -Path $sp).Hash.ToLower() }

  if ($newManifest) {
    # --upgrade 版本守卫：已最新 ⇒ 零改动退出（不进安装位）
    if ($Opts.upgrade -and $prev -and $newManifest.version) {
      $cmpU = Cmp-Ver ([string]$newManifest.version) ([string]$prev.version)
      if ($cmpU -ne $null -and $cmpU -le 0) { Say ""; Say "✅ 已是最新（v$($prev.version)）——无需升级（零改动，未触碰安装位）" "Green"; exit 0 }
    }
    $add = New-Object System.Collections.ArrayList
    $over = New-Object System.Collections.ArrayList
    $keep = New-Object System.Collections.ArrayList
    $conf = New-Object System.Collections.ArrayList
    $same = 0
    $bkRoot = $null
    foreach ($f in $newManifest.files) {
      $rel = ([string]$f.path) -replace "/", "\"
      $dst = Join-Path $Dir $rel
      $cls = [string]$f.class
      $exists = Test-Path $dst
      if ($cls -eq "配置域") {
        if ($exists) { [void]$keep.Add("$($f.path)（配置域·保本机）"); continue }
        New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
        Copy-Item -Force (Join-Path $stage $rel) $dst
        [void]$add.Add("$($f.path)（配置域·补默认）"); continue
      }
      if (-not $exists) {
        New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
        Copy-Item -Force (Join-Path $stage $rel) $dst
        [void]$add.Add([string]$f.path); continue
      }
      $localSha = Get-Sha256Of $dst
      $pkgSha = [string]$f.sha256
      $instSha = if ($prevFiles.ContainsKey([string]$f.path)) { $prevFiles[[string]$f.path] } else { $null }
      if ($localSha -eq $pkgSha) { $same++; continue }
      if ($instSha -and ($localSha -ne $instSha)) {
        [void]$conf.Add("$($f.path)（本机 $($localSha.Substring(0,8))… vs 包内 $($pkgSha.Substring(0,8))…）"); continue
      }
      # 常规更新：旧件先备份
      if (-not $bkRoot) { $bkRoot = Join-Path $Dir (".upgrade-backup-" + (Get-Date -Format yyyyMMdd-HHmmss)); New-Item -ItemType Directory -Force -Path $bkRoot | Out-Null }
      $bk = Join-Path $bkRoot $rel
      New-Item -ItemType Directory -Force -Path (Split-Path $bk) | Out-Null
      Copy-Item -Force $dst $bk
      Copy-Item -Force (Join-Path $stage $rel) $dst
      [void]$over.Add([string]$f.path)
    }
    # 已装清单落盘（下轮偏离检测基线）
    $filesMap = @{}
    foreach ($f in $newManifest.files) { $filesMap[[string]$f.path] = [string]$f.sha256 }
    @{ version = [string]$newManifest.version; at = (Get-Date).ToString("s"); source = "UPGRADE_MANIFEST.json"; count = $filesMap.Count; files = $filesMap } |
      ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $imPath
    # 逐件变更报告（四类）
    Say ""
    Say "[3/6] 升级报告（SYS-177 四类逐件·包 v$($newManifest.version)）" "Cyan"
    Say ("  新增 " + $add.Count + "｜覆盖 " + $over.Count + "｜保留 " + $keep.Count + "｜冲突 " + $conf.Count + "｜未变 " + $same) "Green"
    foreach ($x in $add) { Say ("    + " + $x) "Green" }
    foreach ($x in $over) { Say ("    ~ " + $x) "Cyan" }
    foreach ($x in $keep) { Say ("    = " + $x) "Gray" }
    foreach ($x in $conf) { Say ("    ! " + $x) "Yellow" }
    if ($conf.Count) { Say "  ⚠ 冲突=本地偏离：默认保留本机（未覆盖）——如属通用改良请回流上游（驿站件·随下次升级下发）" "Yellow" }
    if ($bkRoot) { Say "  覆盖前旧件备份：$bkRoot" "Gray" }
  } else {
    # 旧包（无 UPGRADE_MANIFEST.json）降级路径：全量机制覆盖 + 配置域名单保留（名单=打包工具 classOf 口径镜像）
    $keepIfExists = @(
      "处理中心\工单库.md", "处理中心\问题区\README.md", "处理中心\交付清单\README.md", "处理中心\验收标准冻结区\README.md",
      "处理中心\机器闸	ool-registry.json", "处理中心\机器闸\体系清单.json", "处理中心\机器闸\shared-leaf-registry.json",
      "处理中心\机器闸\可携性豁免.json", "处理中心\机器闸\wired-audit-baseline.json", "处理中心\机器闸\stages.json"
    )
    $preserved = @{}
    foreach ($p in $keepIfExists) { $t = Join-Path $Dir $p; if (Test-Path $t) { $preserved[$p] = [System.IO.File]::ReadAllBytes($t) } }
    Copy-Item -Recurse -Force (Join-Path $stage "*") $Dir
    foreach ($p in $preserved.Keys) { [System.IO.File]::WriteAllBytes((Join-Path $Dir $p), $preserved[$p]) }
    if ($preserved.Count -gt 0) { Say "  ✅ 数据/配置域件已保护（$($preserved.Count) 件·旧包降级路径）" "Green" }
    # 已装清单：无清单旧包 ⇒ 按本包件集实算基线（供下轮偏离对比）
    $filesMap = @{}
    $rootPrefix = (Get-Item $stage).FullName.Length + 1   # 短名/长名混用防错位（ADMINI~1 vs Administrator）
    Get-ChildItem -Recurse -File $stage | ForEach-Object {
      $relF = $_.FullName.Substring($rootPrefix) -replace "\\", "/"
      if ($relF -ne "UPGRADE_MANIFEST.json" -and $relF -ne "SHA256SUMS") {
        $installed = Join-Path $Dir ($relF -replace "/", "\")
        if (Test-Path $installed) { $filesMap[$relF] = Get-Sha256Of $installed }
      }
    }
    @{ version = $Ver; at = (Get-Date).ToString("s"); source = "legacy-full-install"; count = $filesMap.Count; files = $filesMap } |
      ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $imPath
    Say "  （旧包无升级清单——按全量降级路径安装；已装清单按实装基线落盘）" "Yellow"
  }
}
# ---------- ⑤ 初始化（空账本 + 数据面目录 + 安装信息） ----------
Say "`n[4/6] 初始化空账本"
if (-not $Opts.dry) {
  foreach ($p in @("处理中心\汇报区","处理中心\问题区","处理中心\交付清单","处理中心\归档\证据","处理中心\验收标准冻结区","处理中心\验证产物","处理中心\工单库_归档","处理中心\邮局\邮箱")) {
    New-Item -ItemType Directory -Force -Path (Join-Path $Dir $p) | Out-Null
  }
  foreach ($role in @("设计师","程序员","验收员","审验员","巡检台")) {
    New-Item -ItemType Directory -Force -Path (Join-Path $Dir "处理中心\邮局\邮箱\$role\INBOX") | Out-Null
  }
  @{ name = "mov-ticket"; version = $Ver; installed_at = (Get-Date).ToString("s"); dir = $Dir } |
    ConvertTo-Json | Set-Content -Encoding UTF8 (Join-Path $Dir "安装信息.json")
  Say "  ✅ 空账本就绪（$Dir\处理中心\工单库.md）" "Green"
}

# ---------- ⑥ 自检三步 + agent 扫描 ----------
Say "`n[5/6] 自检三步"
if (-not $Opts.dry) {
  $checks = @(
    @{ name = "engine status";   cmd = @("node", "处理中心\看板\engine.mjs", "status") },
    @{ name = "工具自检";         cmd = @("node", "处理中心\机器闸\工具自检.mjs", "--sys-only") },
    @{ name = "post-office status"; cmd = @("node", "处理中心\邮局\post-office.mjs", "status") }
  )
  $allOk = $true
  foreach ($c in $checks) {
    Say ("  ── " + $c.name + " ──") "Cyan"
    Push-Location $Dir
    try { $out = & $c.cmd[0] $c.cmd[1..($c.cmd.Count-1)] 2>&1; $rc = $LASTEXITCODE } finally { Pop-Location }
    $out | Select-Object -First 8 | ForEach-Object { Say ("     " + $_) }
    if ($rc -ne 0) { $allOk = $false; Say "  ⚠ $($c.name) rc=$rc（可继续·请人工看一眼上面输出）" "Yellow" } else { Say "  ✅ $($c.name) rc=0" "Green" }
  }
  # agent 扫描（相位②件·存在即跑·缺件明说）
  $scan = Join-Path $Dir "处理中心\机器闸\agent扫描.mjs"
  if (Test-Path $scan) {
    Say "  ── agent 扫描 ──" "Cyan"
    Push-Location $Dir
    try { $out2 = & node "处理中心\机器闸\agent扫描.mjs" 2>&1; $rc2 = $LASTEXITCODE } finally { Pop-Location }
    $out2 | Select-Object -First 8 | ForEach-Object { Say ("     " + $_) }
    if ($rc2 -ne 0) { $allOk = $false; Say "  ⚠ agent 扫描 rc=$rc2（无 agent＝明说缺件·见上）" "Yellow" }
  } else {
    Say "  ⚠ 未发现 agent 扫描器（相位②件）——本机 agent 尚未接线（不静默）" "Yellow"
  }
  if (-not $allOk) { Say "`n⚠ 自检有非零项——安装已完成，但请看上面逐项输出" "Yellow" }
} else { foreach ($n in @("engine status","工具自检","post-office status")) { Say "  [DRY] 将跑：$n" "Cyan" } }

# ---------- ⑦ 快捷方式 + 下一步 ----------
Say "`n[6/6] 快捷方式与下一步"
if (-not $Opts.dry -and -not $Opts.noShortcut) {
  try {
    $lnk = Join-Path ([Environment]::GetFolderPath("Desktop")) "MOV 看板.lnk"
    $ws = New-Object -ComObject WScript.Shell
    $sc = $ws.CreateShortcut($lnk)
    $sc.TargetPath = Join-Path $Dir "处理中心\看板\看板-终端.cmd"
    $sc.WorkingDirectory = $Dir
    $sc.Description = "MOV 工单系统看板"
    $sc.Save()
    Say "  ✅ 桌面快捷方式：$lnk" "Green"
  } catch { Say "  ⚠ 快捷方式创建失败（$($_.Exception.Message)）——可手动进入 $Dir" "Yellow" }
}
Say "`n✅ 安装完成：$Dir（版本 $Ver）" "Green"
Say "   启动：cd /d `"$Dir`" && node 处理中心\看板\engine.mjs status    （或双击桌面「MOV 看板」）"
Say "   文档：$Dir\处理中心\README.md ｜ 角色卡：$Dir\处理中心\看板\工位\<角色>\AGENTS.md"
if (-not $Opts.dry) { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }
