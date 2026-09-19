# scripts/setup-research-intel-task.ps1
# Registers a Windows Task Scheduler job that runs the research-intel article
# sweep live (polls Action Network, BettingPros, Walter Football, ESPN NFL,
# VSiN, Sharp Football, Pro Football Talk, PFF, Rotowire NFL and writes into
# Supabase research_intel_notes / research_pick_signals), on a repeating
# interval, indefinitely.
#
# Why a repeating one-shot instead of a long-running daemon: same rationale
# as scripts/setup-twitter-bookmarks-task.ps1 -- a daemon process can die
# silently (crash, machine sleep) and nobody notices for days. Letting Task
# Scheduler own the repeat interval is self-healing -- each run is a fresh,
# short-lived process, and a single missed/failed run doesn't take down
# future ones.
#
# Why 30 minutes: several source feeds (VSiN especially) publish at high
# volume and mix in non-NFL content, and a plain RSS feed only exposes a
# handful of the most recent items. A slow poll risks an NFL article
# scrolling off the feed before it's ever captured, regardless of the ingest
# agent's own lookback window. 30 minutes matches the cadence already used
# for the Twitter bookmarks sync.
#
# Run once, from an elevated or regular PowerShell prompt (elevation not
# required for a per-user scheduled task):
#   powershell -ExecutionPolicy Bypass -File scripts\setup-research-intel-task.ps1
#
# To change the interval later, re-run this script after editing
# $IntervalMinutes, or edit the task directly in Task Scheduler.

$TaskName = "NFL_Dashboard_Research_Intel_Sync"
$WorkingDir = "E:\dev\projects\NFL_Dashboard"
$IntervalMinutes = 30
$NodePath = (Get-Command node).Source
$LogPath = Join-Path $WorkingDir "logs\research-intel-sync.log"

if (-not $NodePath) {
    Write-Error "Node.exe not found in PATH."
    exit 1
}

# Ensure the logs directory exists.
New-Item -ItemType Directory -Force -Path (Join-Path $WorkingDir "logs") | Out-Null

# Wrap in cmd.exe so stdout/stderr redirect to a log file -- Task Scheduler
# doesn't capture a bare process's console output on its own.
$CmdArgument = "/c `"`"$NodePath`" scripts\research-intel-cron.js >> `"$LogPath`" 2>&1`""

$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument $CmdArgument -WorkingDirectory $WorkingDir
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) -RepetitionDuration (New-TimeSpan -Days 3650)

$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Live research-intel article sweep -- captures NFL articles from 9 RSS sources into Supabase every $IntervalMinutes minutes." -Force

Write-Host "Successfully registered Windows Task: $TaskName (runs every $IntervalMinutes minutes)"
Write-Host "Logs will append to: $LogPath"
