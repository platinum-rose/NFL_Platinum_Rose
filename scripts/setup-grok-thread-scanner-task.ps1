# scripts/setup-grok-thread-scanner-task.ps1
# Registers a Windows Task Scheduler job that periodically scans Twitter/X
# bookmark notes, detects unparsed threads/zero-signal tweets, and generates
# the Grok prompt packet (data\research-intel\grok-thread-prompt-latest.md),
# on a repeating interval indefinitely.
#
# Run once, from an elevated or regular PowerShell prompt (elevation not
# required for a per-user scheduled task):
#   powershell -ExecutionPolicy Bypass -File scripts\setup-grok-thread-scanner-task.ps1
#
# To change the interval later, re-run this script after editing
# $IntervalMinutes, or edit the task directly in Task Scheduler.

$TaskName = "NFL_Dashboard_Grok_Thread_Scanner"
$WorkingDir = "E:\dev\projects\NFL_Dashboard"
$IntervalMinutes = 60
$NodePath = (Get-Command node).Source
$LogPath = Join-Path $WorkingDir "logs\grok-thread-scanner.log"

if (-not $NodePath) {
    Write-Error "Node.exe not found in PATH."
    exit 1
}

# Ensure the logs directory exists.
New-Item -ItemType Directory -Force -Path (Join-Path $WorkingDir "logs") | Out-Null

# Wrap in cmd.exe so stdout/stderr redirect to a log file
$CmdArgument = "/c `"`"$NodePath`" scripts\scan-unprocessed-tweet-threads.mjs >> `"$LogPath`" 2>&1`""

$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument $CmdArgument -WorkingDirectory $WorkingDir
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) -RepetitionDuration (New-TimeSpan -Days 3650)

$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Scans Twitter/X bookmark notes for unparsed threads and generates Grok prompt packets every $IntervalMinutes minutes." -Force

Write-Host "Successfully registered Windows Task: $TaskName (runs every $IntervalMinutes minutes)"
Write-Host "Logs will append to: $LogPath"
