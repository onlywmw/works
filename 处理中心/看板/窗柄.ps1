Add-Type -Namespace Win -Name Native -MemberDefinition '[DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();'
[Win.Native]::GetConsoleWindow()
