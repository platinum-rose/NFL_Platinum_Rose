# scripts/create-desktop-shortcut.ps1
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath 'NFL Screenshot Watcher.lnk'
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = 'E:\dev\projects\NFL_Dashboard\scripts\start-screenshot-watcher-minimized.cmd'
$Shortcut.WorkingDirectory = 'E:\dev\projects\NFL_Dashboard'
$Shortcut.Description = 'Launch real-time minimized background watcher for NFL Twitter screenshot drops'
$Shortcut.Save()

Write-Host "Created Desktop Shortcut:" $ShortcutPath
