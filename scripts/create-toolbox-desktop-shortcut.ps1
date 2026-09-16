# scripts/create-toolbox-desktop-shortcut.ps1
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath 'NFL Toolbox.lnk'
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Target wscript.exe so it launches launch-toolbox.vbs completely silently (zero console window)
$Shortcut.TargetPath = 'wscript.exe'
$Shortcut.Arguments = '"E:\dev\projects\NFL_Dashboard\launch-toolbox.vbs"'
$Shortcut.WorkingDirectory = 'E:\dev\projects\NFL_Dashboard'
$Shortcut.Description = 'NFL Platinum Rose Standalone Control Center & Pipeline Toolbox'

$BravePath = 'C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe'
$EdgePath = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
if (Test-Path $BravePath) {
    $Shortcut.IconLocation = "$BravePath,0"
} elseif (Test-Path $EdgePath) {
    $Shortcut.IconLocation = "$EdgePath,0"
}

$Shortcut.Save()
Write-Host "✅ Created Desktop Shortcut targeting silent VBS launcher: $ShortcutPath"
