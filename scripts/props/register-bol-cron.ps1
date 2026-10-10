# scripts/props/register-bol-cron.ps1
# Registers a scheduled task in Windows Task Scheduler to automatically run the BetOnline prop scraper.

param(
    [string]$TaskName = "NFL_BetOnline_Prop_Sync",
    [int]$IntervalHours = 3
)

$RepoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
$NodePath = (Get-Command node).Source
$ScriptPath = Join-Path $RepoRoot "scripts\props\cron-bol-scrape.mjs"

Write-Host "[SETUP] Registering Windows Scheduled Task: $TaskName" -ForegroundColor Cyan
Write-Host "[REPO] Working Directory: $RepoRoot" -ForegroundColor Gray
Write-Host "[SCRIPT] Target: $ScriptPath" -ForegroundColor Gray

# Define action to run in background
$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ScriptPath`"" -WorkingDirectory $RepoRoot

# Trigger: Runs daily, repeats every $IntervalHours hours
$Trigger = New-ScheduledTaskTrigger -Daily -At "08:15"
$Trigger.Repetition = (New-ScheduledTaskTrigger -Once -At "08:15" -RepetitionInterval (New-TimeSpan -Hours $IntervalHours) -RepetitionDuration (New-TimeSpan -Days 365)).Repetition

# Settings: Do not stop if on batteries, wake to run if sleeping
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 20)

try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Automated BetOnline.ag Prop & Line Extraction for NFL Dashboard"
    Write-Host "[SUCCESS] Successfully registered scheduled task '$TaskName' to run every $IntervalHours hours." -ForegroundColor Green
    Write-Host "[INFO] To run manually at any time: npm run props:bol:cron" -ForegroundColor Yellow
} catch {
    Write-Error "Failed to register scheduled task: $_"
}
