# infra/enable-autostart-user.ps1
# Creates a silent auto-start shortcut in the user's Windows Startup folder (requires zero admin rights).

$WshShell = New-Object -ComObject WScript.Shell
$StartupFolder = [Environment]::GetFolderPath('Startup')
$ShortcutPath = Join-Path $StartupFolder "Platinum_Rose_Twitter_Harvester.lnk"
$TargetVbs = (Resolve-Path (Join-Path $PSScriptRoot "..\Launch Twitter Harvester (Silent).vbs")).Path

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$TargetVbs`""
$Shortcut.WorkingDirectory = (Split-Path -Parent $TargetVbs)
$Shortcut.WindowStyle = 7 # Minimized/Hidden
$Shortcut.Description = "Platinum Rose Twitter Harvester Daemon"
$Shortcut.Save()

Write-Host "✅ Auto-start shortcut created successfully in your personal Startup folder!"
Write-Host "Location: $ShortcutPath"
Write-Host "The daemon will now start silently in the background on every Windows login."
