# scripts/setup-twitter-bookmarks-task.ps1
# Registers a Windows Task Scheduler job that runs the Twitter/X bookmarks
# sweep live (writes to the local vault + Supabase research_intel_notes /
# research_pick_signals), on a repeating interval, indefinitely.
#
# Why a repeating one-shot instead of `twitter-bookmarks-cron.js --daemon`:
# a long-running daemon process can silently die (crash, machine sleep, etc.)
# and nobody notices for days. Letting Task Scheduler itself own the repeat
# interval is self-healing -- each run is a fresh, short-lived process, and
# a single missed/failed run doesn't take down future ones.
#
# Run once, from an elevated or regular PowerShell prompt (elevation not
# required for a per-user scheduled task):
#   powershell -ExecutionPolicy Bypass -File scripts\setup-twitter-bookmarks-task.ps1
#
# To change the interval later, re-run this script after editing
# $IntervalMinutes, or edit the task directly in Task Scheduler.

$TaskName = "NFL_Dashboard_Twitter_Bookmarks_Sync"
$WorkingDir = "E:\dev\projects\NFL_Dashboard"
$IntervalMinutes = 30
$NodePath = (Get-Command node).Source
$LogPath = Join-Path $WorkingDir "logs\twitter-bookmarks-sync.log"

if (-not $NodePath) {
    Write-Error "Node.exe not found in PATH."
    exit 1
}

# Ensure the logs directory exists.
New-Item -ItemType Directory -Force -Path (Join-Path $WorkingDir "logs") | Out-Null

# Wrap in cmd.exe so stdout/stderr redirect to a log file -- Task Scheduler
# doesn't capture a bare process's console output on its own.
$CmdArgument = "/c `"`"$NodePath`" scripts\twitter-bookmarks-cron.js >> `"$LogPath`" 2>&1`""

$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument $CmdArgument -WorkingDirectory $WorkingDir
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) -RepetitionDuration (New-TimeSpan -Days 3650)

$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Live Twitter/X bookmarks sweep -- captures sharp betting bookmarks into the local vault + Supabase every $IntervalMinutes minutes." -Force

Write-Host "Successfully registered Windows Task: $TaskName (runs every $IntervalMinutes minutes)"
Write-Host "Logs will append to: $LogPath"
