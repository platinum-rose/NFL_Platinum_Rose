# scripts/props/register-dkp-cron.ps1
# Registers a scheduled task in Windows Task Scheduler to automatically run the DraftKings Prediction Markets scraper.
#
# Safety:
#   - If the task already exists, nothing is changed unless -Overwrite (or -Force) is passed.
#   - Replacement is done in a single Register-ScheduledTask -Force call (no unregister-then-register window,
#     so a failed registration cannot leave you with no task).
#   - Every failure is terminating and exits non-zero; "[SUCCESS]" prints only after registration verifiably succeeded.
#
# Exit codes: 0 = registered, 2 = task exists and no -Overwrite/-Force given (nothing changed), 1 = failure.

param(
    [string]$TaskName = "NFL_DraftKings_Prediction_Sync",
    [int]$IntervalHours = 3,
    [switch]$Overwrite = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = 'Stop'

try {
    $RepoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
    $NodePath = (Get-Command node).Source
    $ScriptPath = Join-Path $RepoRoot "scripts\props\cron-dkp-scrape.mjs"

    Write-Host "[SETUP] Registering Windows Scheduled Task: $TaskName" -ForegroundColor Cyan
    Write-Host "[REPO] Working Directory: $RepoRoot" -ForegroundColor Gray
    Write-Host "[SCRIPT] Target: $ScriptPath" -ForegroundColor Gray

    # Check if task already exists to prevent accidental overwrite
    $ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($ExistingTask -and -not ($Overwrite -or $Force)) {
        Write-Warning "[PROTECTIVE LOCK] Scheduled task '$TaskName' already exists. Use -Overwrite or -Force to replace it. Nothing was changed."
        exit 2
    }

    # Define action to run in background
    $Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ScriptPath`"" -WorkingDirectory $RepoRoot

    # Trigger: daily at 08:30 (staggered 15 min after BetOnline 08:15 and 30 min after Bookmaker 08:00),
    # repeating every $IntervalHours hours
    $Trigger = New-ScheduledTaskTrigger -Daily -At "08:30"
    $Trigger.Repetition = (New-ScheduledTaskTrigger -Once -At "08:30" -RepetitionInterval (New-TimeSpan -Hours $IntervalHours) -RepetitionDuration (New-TimeSpan -Days 365)).Repetition

    # Settings: run on battery, run a missed occurrence when the machine is next available, 20 min hard limit.
    # (Wake-from-sleep is NOT enabled; add -WakeToRun here if you want that.)
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 20)

    # -Force makes this an in-place replace when the task exists (and is only reachable with -Overwrite/-Force above).
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings `
        -Description "Automated DraftKings Prediction Markets Extraction for NFL Dashboard" -Force | Out-Null

    # Verify, don't assume
    $Registered = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
    Write-Host "[SUCCESS] Registered scheduled task '$($Registered.TaskName)' (state: $($Registered.State)) to run every $IntervalHours hours." -ForegroundColor Green
    Write-Host "[INFO] To run manually at any time: npm run props:dkp:cron or 'dkp'" -ForegroundColor Yellow
    exit 0
} catch {
    Write-Host "[ERROR] Failed to register scheduled task: $_" -ForegroundColor Red
    exit 1
}
