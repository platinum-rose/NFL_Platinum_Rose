# scripts/props/register-dkp-cron.ps1
# Registers a scheduled task in Windows Task Scheduler to automatically run the DraftKings Prediction Markets scraper.

param(
    [string]$TaskName = "NFL_DraftKings_Prediction_Sync",
    [int]$IntervalHours = 3,
    [switch]$Overwrite = $false,
    [switch]$Force = $false
)

$RepoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$NodePath = (Get-Command node).Source
$ScriptPath = Join-Path $RepoRoot "scripts\props\cron-dkp-scrape.mjs"

Write-Host "[SETUP] Registering Windows Scheduled Task: $TaskName" -ForegroundColor Cyan
Write-Host "[REPO] Working Directory: $RepoRoot" -ForegroundColor Gray
Write-Host "[SCRIPT] Target: $ScriptPath" -ForegroundColor Gray

# Check if task already exists to prevent accidental overwrite
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask -and -not ($Overwrite -or $Force)) {
    Write-Warning "[PROTECTIVE LOCK] Scheduled task '$TaskName' already exists. Use -Overwrite or -Force to replace it."
    return
}

# Define action to run in background
$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ScriptPath`"" -WorkingDirectory $RepoRoot

# Trigger: Runs daily at 08:30 (staggered 15 min after BetOnline 08:15 and 30 min after Bookmaker 08:00), repeats every $IntervalHours hours
$Trigger = New-ScheduledTaskTrigger -Daily -At "08:30"
$Trigger.Repetition = (New-ScheduledTaskTrigger -Once -At "08:30" -RepetitionInterval (New-TimeSpan -Hours $IntervalHours) -RepetitionDuration (New-TimeSpan -Days 365)).Repetition

# Settings: Do not stop if on batteries, wake to run if sleeping
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 20)

try {
    if ($ExistingTask) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    }
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Automated DraftKings Prediction Markets Extraction for NFL Dashboard"
    Write-Host "[SUCCESS] Successfully registered scheduled task '$TaskName' to run every $IntervalHours hours." -ForegroundColor Green
    Write-Host "[INFO] To run manually at any time: npm run props:dkp:cron or 'dkp'" -ForegroundColor Yellow
} catch {
    Write-Error "Failed to register scheduled task: $_"
}
