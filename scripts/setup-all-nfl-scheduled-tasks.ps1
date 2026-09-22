# scripts/setup-all-nfl-scheduled-tasks.ps1
# ═══════════════════════════════════════════════════════════════════════════════
# Unified Registration Script for NFL Dashboard Scheduled Tasks
# Configures Windows Task Scheduler tasks using hidden VBS wrappers so no console
# windows pop up or interrupt active desktop work.
# ═══════════════════════════════════════════════════════════════════════════════

$WorkingDir = "E:\dev\projects\NFL_Dashboard"
$VbsPath    = Join-Path $WorkingDir "scripts\windows\run-hidden.vbs"
$HiddenDir  = Join-Path $WorkingDir "scripts\windows\hidden-tasks"
$LogsDir    = Join-Path $WorkingDir "logs"

New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null

$TasksConfig = @(
    @{
        Name        = "NFL_Dashboard_Live_Odds_Sync"
        Script      = "live-odds-sync.cmd"
        Description = "Fetches live NFL betting odds from DraftKings/FanDuel and updates market line tracker (every 2h)."
        Type        = "Interval"
        IntervalMin = 120
        LimitMin    = 10
    },
    @{
        Name        = "NFL_Dashboard_Player_Availability_Sync"
        Script      = "player-availability-sync.cmd"
        Description = "Pulls ESPN/FantasyPros injuries and official practice reports (daily at 4:30 PM)."
        Type        = "Daily"
        AtTimes     = @("16:30")
        LimitMin    = 15
    },
    @{
        Name        = "NFL_Dashboard_Settlement_Reconciliation"
        Script      = "settlement-reconciliation.cmd"
        Description = "Reconciles user-placed bets and split ledgers against final ESPN box scores (daily at 3:30 AM)."
        Type        = "Daily"
        AtTimes     = @("03:30")
        LimitMin    = 15
    },
    @{
        Name        = "NFL_Dashboard_Live_Tracker_Builder"
        Script      = "live-tracker-builder.cmd"
        Description = "Builds and refreshes the live HTML tracker scoreboard and cheat sheets (every 2h)."
        Type        = "Interval"
        IntervalMin = 120
        LimitMin    = 10
    },
    @{
        Name        = "NFL_Dashboard_Daily_Intelligence_Brief"
        Script      = "daily-brief.cmd"
        Description = "Compiles the NFL Daily Intelligence Brief newsletter digest (daily at 7:00 AM)."
        Type        = "Daily"
        AtTimes     = @("07:00")
        LimitMin    = 15
    },
    @{
        Name        = "NFL_Dashboard_Yahoo_Survivor_Sync"
        Script      = "yahoo-survivor-sync.cmd"
        Description = "Syncs Yahoo Survival Football league entrant picks and distributions (10:00 AM & 6:00 PM)."
        Type        = "Daily"
        AtTimes     = @("10:00", "18:00")
        LimitMin    = 15
    },
    @{
        Name        = "NFL_Dashboard_Podcast_Ingestion_Sync"
        Script      = "podcast-ingestion-sync.cmd"
        Description = "Ingests NFL podcasts, transcribes audio, extracts picks, and rebuilds dossiers (6:30 AM & 2:30 PM)."
        Type        = "Daily"
        AtTimes     = @("06:30", "14:30")
        LimitMin    = 60
    },
    @{
        Name        = "NFL_Dashboard_Grok_Thread_Scanner"
        Script      = "grok-thread-scanner.cmd"
        Description = "Scans bookmarks for unparsed threads and generates Grok prompt packets (hourly, hidden mode)."
        Type        = "Interval"
        IntervalMin = 60
        LimitMin    = 15
    }
)

Write-Host "══════════════════════════════════════════════════════════════════════"
Write-Host "Registering NFL Dashboard Windows Scheduled Tasks (Hidden Mode)"
Write-Host "══════════════════════════════════════════════════════════════════════"

foreach ($cfg in $TasksConfig) {
    $job = Join-Path $HiddenDir $cfg.Script
    if (-not (Test-Path $job)) {
        Write-Host "ERROR: Script not found: $job" -ForegroundColor Red
        continue
    }

    $action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"{0}" "{1}"' -f $VbsPath, $job) -WorkingDirectory $WorkingDir

    if ($cfg.Type -eq "Interval") {
        $triggers = @(New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes $cfg.IntervalMin) -RepetitionDuration (New-TimeSpan -Days 3650))
    } elseif ($cfg.Type -eq "Daily") {
        $triggers = @($cfg.AtTimes | ForEach-Object { New-ScheduledTaskTrigger -Daily -At $_ })
    }

    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes $cfg.LimitMin)

    try {
        Register-ScheduledTask -TaskName $cfg.Name -Action $action -Trigger $triggers -Settings $settings -Description $cfg.Description -Force | Out-Null
        Write-Host "  [OK] $($cfg.Name) (Triggers: $($triggers.Count))" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] $($cfg.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nAll Tasks Registered Successfully."