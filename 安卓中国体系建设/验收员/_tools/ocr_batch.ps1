param([string]$PathsList)
# ocr_batch.ps1 — 批量 OCR（OCR 引擎只初始化一次，循环识别多图）。用法:
#   powershell -File ocr_batch.ps1 'C:\a.png;C:\b.png'   （分号分隔，避免 JSON 引号问题）
# 产出: 每图 <图>.ocr.txt（UTF-8）；stdout 每图一行 OK/ERR
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType=WindowsRuntime]

function Await($WinRtTask, $ResultType) {
    $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.GetAwaiter().GetResult()
}

$paths = @($PathsList -split ';' | Where-Object { $_ })

# 引擎只建一次（用户语言 → 中文兜底）
$engine = $null
try { $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages() } catch {}
if ($null -eq $engine) {
    try { $lang = [Windows.Globalization.Language]::new('zh-Hans-CN'); $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang) } catch {}
}
if ($null -eq $engine) { Write-Output "OCR_ENGINE_UNAVAILABLE"; exit 1 }

foreach ($img in $paths) {
    $img = [string]$img
    $out = $img + ".ocr.txt"
    try {
        $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($img)) ([Windows.Storage.StorageFile])
        $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
        $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
        $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
        $sb = New-Object System.Text.StringBuilder
        foreach ($line in $result.Lines) { [void]$sb.AppendLine($line.Text) }
        [System.IO.File]::WriteAllText($out, $sb.ToString(), [System.Text.Encoding]::UTF8)
        Write-Output ("OK " + $img)
    } catch {
        Write-Output ("ERR " + $img + " :: " + $_.Exception.Message)
    }
}
