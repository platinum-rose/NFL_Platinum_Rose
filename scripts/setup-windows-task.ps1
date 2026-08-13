# scripts/setup-windows-task.ps1
# Registers a background scheduled task in Windows Task Scheduler
# to run the Screenshot Watcher automatically every 2 hours.

$TaskName = "NFL_Dashboard_Screenshot_Watcher"
$WorkingDir = "E:\dev\projects\NFL_Dashboard"
$NodePath = (Get-Command node).Source

if (-not $NodePath) {
    Write-Error "Node.exe not found in PATH."
    exit 1
}

$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "agents\screenshot-watcher.js" -WorkingDirectory $WorkingDir
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 2)

$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Automated background OCR scanner for dropped Twitter screenshots" -Force

Write-Host "Successfully registered Windows Task: $TaskName (runs every 2 hours)"
