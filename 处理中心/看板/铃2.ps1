param(
  [long]$Hwnd = 0,
  [int]$ConsolePid = 0,
  [string]$Text = ""
)
# 铃 v2：不抢焦点注入。原理（conhost 专用正门）：
#   按窗口句柄找到 conhost 进程 → AttachConsole 挂上它的控制台 → CONIN$ WriteConsoleInput
#   直接把字符写进目标窗的键盘输入缓冲——无前台切换、无焦点锁、后台可用。
#   注意：Windows Terminal 窗口不适用（ConPTY 无此入口）——工位窗须以 conhost 启动（openSeatWindow 已改）。
$ErrorActionPreference = 'Stop'
Add-Type -Namespace Win -Name Native -MemberDefinition '
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
[DllImport("kernel32.dll")] public static extern bool FreeConsole();
[DllImport("kernel32.dll")] public static extern bool AttachConsole(uint pid);
[DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern short VkKeyScanW(char ch);
[DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)] public static extern IntPtr CreateFileW(string name, uint access, uint share, IntPtr sa, uint disp, uint flags, IntPtr tmpl);
[DllImport("kernel32.dll", SetLastError=true)] public static extern bool WriteConsoleInputW(IntPtr h, INPUT_RECORD[] buf, uint n, out uint written);
[StructLayout(LayoutKind.Sequential)]
public struct KEY_EVENT_RECORD { public int bKeyDown; public ushort wRepeatCount; public ushort wVirtualKeyCode; public ushort wVirtualScanCode; public ushort UnicodeChar; public uint dwControlKeyState; }
[StructLayout(LayoutKind.Explicit)]
public struct INPUT_RECORD_UNION { [FieldOffset(0)] public KEY_EVENT_RECORD KeyEvent; }
[StructLayout(LayoutKind.Sequential)]
public struct INPUT_RECORD { public ushort EventType; public INPUT_RECORD_UNION Event; }
'
if ($Hwnd -eq 0 -and $ConsolePid -eq 0) { "NOTARGET"; exit 1 }
# SYS-58 B：允许空文本=仅回车（提交回执闭环的补回车用）；文本为空时跳过分段，仅写回车段。
$targetPid = $ConsolePid
if ($targetPid -eq 0) {
  # 兜底：按窗口反查客户端进程（不可靠，同一句柄多进程认领）——正途是开窗时记录 ConsolePid
  $client = Get-Process | Where-Object { $_.MainWindowHandle -eq [IntPtr]$Hwnd } | Select-Object -First 1
  if ($client) { $targetPid = $client.Id }
}
if ($targetPid -eq 0) { "NOPID"; exit 1 }
[void][Win.Native]::FreeConsole()
if (-not [Win.Native]::AttachConsole([uint32]$targetPid)) { "ATTACH_FAIL"; exit 2 }
try {
  $GENERIC_READ = [uint32]2147483648; $GENERIC_WRITE = [uint32]1073741824; $OPEN_EXISTING = [uint32]3
  $hCon = [Win.Native]::CreateFileW("CONIN`$", $GENERIC_READ -bor $GENERIC_WRITE, [uint32]3, [IntPtr]::Zero, $OPEN_EXISTING, [uint32]0, [IntPtr]::Zero)
  if ($hCon -eq [IntPtr]::new(-1)) { "OPEN_CONIN_FAIL"; exit 3 }
  $KEY_EVENT = [uint16]1
  # SYS-58 通道加固：分段注入 + 回车单独一段——快速整段 CONIN$ 写入会被 TUI（kimi bracketed-paste）当粘贴，
  # 回车被变换行而非提交（2026-09-12 01:50-06:17 十四铃未达现场）。分段≈拟人打字（6 字/段·30ms），回车前静 350ms。
  # PS 结构体数组嵌套字段赋值不持久（改的是副本）——必须整块构造记录再整体写入数组
  function Write-Seg([string]$s) {
    $chars = $s.ToCharArray()
    $recs = New-Object Win.Native+INPUT_RECORD[] ($chars.Length * 2)
    $i = 0
    foreach ($c in $chars) {
      # VK：回车用 VK_RETURN(0x0D)，其余用 VkKeyScanW 实测
      $vk = 0
      if ([int]$c -eq 13) { $vk = 0x0D } else { $vk = [Win.Native]::VkKeyScanW($c) -band 0xFF }
      foreach ($down in @(1, 0)) {
        $ke = New-Object Win.Native+KEY_EVENT_RECORD
        $ke.bKeyDown = $down
        $ke.wRepeatCount = 1
        $ke.wVirtualKeyCode = [uint16]$vk
        $ke.UnicodeChar = [uint16]$c
        $ke.dwControlKeyState = 0
        $u = New-Object Win.Native+INPUT_RECORD_UNION
        $u.KeyEvent = $ke
        $rec = New-Object Win.Native+INPUT_RECORD
        $rec.EventType = $KEY_EVENT
        $rec.Event = $u
        $recs[$i] = $rec
        $i++
      }
    }
    $w = [uint32]0
    if (-not [Win.Native]::WriteConsoleInputW($hCon, $recs, [uint32]$recs.Length, [ref]$w)) { "WRITE_FAIL"; exit 4 }
    return $w
  }
  $written = [uint32]0
  $segLen = 6
  for ($p = 0; $p -lt $Text.Length; $p += $segLen) {
    $n = [Math]::Min($segLen, $Text.Length - $p)
    $written += Write-Seg $Text.Substring($p, $n)
    Start-Sleep -Milliseconds 30
  }
  Start-Sleep -Milliseconds 350
  $written += Write-Seg "`r"
  "OK|$written"
} finally {
  [void][Win.Native]::FreeConsole()
}
