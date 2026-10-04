param(
  [long]$Hwnd = 0,
  [string]$Text = ""
)
# Door bell: activate the seat window by hwnd (NOT title - titles get overridden by claude),
# verify it is really in the foreground, then type the wake word + Enter.
# Safety: if another window grabbed focus in between, abort without typing (BUSY).
$ErrorActionPreference = 'Stop'
Add-Type -Namespace Win -Name Native -MemberDefinition '
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern void keybd_event(byte k, byte scan, uint flags, UIntPtr extra);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
'
if ($Hwnd -eq 0) { "NOHWND"; exit 1 }
# 前台锁解法：先按一下 ALT（让系统认为用户在交互，后台进程才被允许切前台）
[void][Win.Native]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero)
[void][Win.Native]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
[void][Win.Native]::SetForegroundWindow([IntPtr]$Hwnd)
Start-Sleep -Milliseconds 350
if ([Win.Native]::GetForegroundWindow() -ne [IntPtr]$Hwnd) { "BUSY|foreground mismatch"; exit 2 }
$ws = New-Object -ComObject WScript.Shell
$ws.SendKeys($Text + "{ENTER}")
"OK"
