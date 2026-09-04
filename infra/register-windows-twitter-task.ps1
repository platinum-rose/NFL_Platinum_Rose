# infra/register-windows-twitter-task.ps1
# Registers a Windows Scheduled Task to run the Twitter Harvester on user logon.

$TaskName = "NFL_Dashboard_Twitter_Harvester"
$ScriptPath = Join-Path $PSScriptRoot "..\scripts\twitter-bookmarks-cron.js"
$ResolvedScript = (Resolve-Path $ScriptPath).Path
$NodePath = (Get-Command node).Source

$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ResolvedScript`" --daemon" -WorkingDirectory (Split-Path -Parent $ResolvedScript | Split-Path -Parent)
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5)

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "NFL Dashboard Platinum Rose Twitter Harvester Daemon" -Force

Write-Host "✅ Successfully registered Windows Scheduled Task: $TaskName"
Write-Host "Task will start automatically on logon, or you can start it immediately with:"
Write-Host "Start-ScheduledTask -TaskName '$TaskName'"
