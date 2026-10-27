# scripts/props/register-bkr-cron.ps1
# Registers a scheduled task in Windows Task Scheduler to automatically run the Bookmaker SGP scraper.

param(
    [string]$TaskName = "NFL_Bookmaker_SGP_Sync",
    [ValidateRange(0, 59)]
    [int]$OffsetMinutes = 0
)

. (Join-Path $PSScriptRoot 'prop-scrape-schedule.ps1')
$RepoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$NodePath = (Get-Command node).Source
$ScriptPath = Join-Path $RepoRoot "scripts\props\cron-bkr-scrape.mjs"

Write-Host "[SETUP] Registering Windows Scheduled Task: $TaskName" -ForegroundColor Cyan
Write-Host "[REPO] Working Directory: $RepoRoot" -ForegroundColor Gray
Write-Host "[SCRIPT] Target: $ScriptPath" -ForegroundColor Gray

# Define action to run in background
$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ScriptPath`"" -WorkingDirectory $RepoRoot

# Triggers: the shared weekly cadence in prop-scrape-schedule.ps1, shifted +$OffsetMinutes min (default +0);
# no intra-day repetition.
$Trigger = @(New-PropScrapeTriggers -OffsetMinutes $OffsetMinutes)

# Settings: Do not stop if on batteries, wake to run if sleeping
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 20)

try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Automated Bookmaker.eu SGP & Prop Board Extraction for NFL Dashboard"
    Write-Host "[SUCCESS] Successfully registered scheduled task '$TaskName' on the weekly cadence: $(Get-PropScrapeCadenceSummary -OffsetMinutes $OffsetMinutes)." -ForegroundColor Green
    Write-Host "[INFO] To run manually at any time: npm run props:bkr:cron" -ForegroundColor Yellow
} catch {
    Write-Error "Failed to register scheduled task: $_"
}
