param([int]$ConsolePid = 0)
$ErrorActionPreference = 'Stop'
Add-Type -Namespace RC -Name N -MemberDefinition '
[DllImport("kernel32.dll")] public static extern bool FreeConsole();
[DllImport("kernel32.dll")] public static extern bool AttachConsole(uint pid);
[DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)] public static extern IntPtr CreateFileW(string n, uint a, uint s, IntPtr sa, uint d, uint f, IntPtr t);
[DllImport("kernel32.dll")] public static extern bool GetConsoleScreenBufferInfo(IntPtr h, out CONSOLE_SCREEN_BUFFER_INFO i);
[DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)] public static extern bool ReadConsoleOutputCharacterW(IntPtr h, System.Text.StringBuilder buf, uint n, COORD pos, out uint read);
[StructLayout(LayoutKind.Sequential)] public struct COORD { public short X; public short Y; }
[StructLayout(LayoutKind.Sequential)] public struct SMALL_RECT { public short L; public short T; public short R; public short B; }
[StructLayout(LayoutKind.Sequential)] public struct CONSOLE_SCREEN_BUFFER_INFO { public COORD dwSize; public COORD dwCursorPosition; public ushort wAttributes; public SMALL_RECT srWindow; public COORD dwMaximumWindowSize; }
'
[void][RC.N]::FreeConsole()
if (-not [RC.N]::AttachConsole([uint32]$ConsolePid)) { "ATTACH_FAIL"; exit 1 }
$h = [RC.N]::CreateFileW("CONOUT`$", [uint32]2147483648 -bor [uint32]1073741824, [uint32]3, [IntPtr]::Zero, [uint32]3, [uint32]0, [IntPtr]::Zero)
if ($h -eq [IntPtr]::new(-1)) { "OPEN_FAIL"; exit 2 }
$info = New-Object RC.N+CONSOLE_SCREEN_BUFFER_INFO
[void][RC.N]::GetConsoleScreenBufferInfo($h, [ref]$info)
"size=$($info.dwSize.X)x$($info.dwSize.Y) cursor=$($info.dwCursorPosition.X),$($info.dwCursorPosition.Y)"
$bottom = [Math]::Max(0, [int]$info.dwCursorPosition.Y - 12)
for ($y = $bottom; $y -le $info.dwCursorPosition.Y; $y++) {
  $sb = New-Object System.Text.StringBuilder 200
  $r = [uint32]0
  $pos = New-Object RC.N+COORD
  $pos.X = 0; $pos.Y = [int16]$y
  if ([RC.N]::ReadConsoleOutputCharacterW($h, $sb, [uint32]120, $pos, [ref]$r)) { "[$y] " + $sb.ToString().TrimEnd() }
}
[void][RC.N]::FreeConsole()
