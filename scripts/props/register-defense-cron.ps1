# scripts/props/register-defense-cron.ps1
# Registers a scheduled task in Windows Task Scheduler to automatically run the weekly defensive prop board capture (DK defensive tab + BetOnline drop folder + merge + sheet).
#
# Safety:
#   - If the task already exists, nothing is changed unless -Overwrite (or -Force) is passed.
#   - Replacement is done in a single Register-ScheduledTask -Force call (no unregister-then-register window,
#     so a failed registration cannot leave you with no task).
#   - Every failure is terminating and exits non-zero; "[SUCCESS]" prints only after registration verifiably succeeded.
#
# Exit codes: 0 = registered, 2 = task exists and no -Overwrite/-Force given (nothing changed), 1 = failure.

param(
    [string]$TaskName = "NFL_Defensive_Boards_Sync",
    [ValidateRange(0, 59)]
    [int]$OffsetMinutes = 35,
    [switch]$Overwrite = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = 'Stop'

try {
    . (Join-Path $PSScriptRoot 'prop-scrape-schedule.ps1')
    # Defensive cadence (local time, before the offset): Wed 20:00, Thu 13:00, Fri 13:00, Sat 20:00, Sun 08:00 and 12:00.
    $PropScrapeWeeklyCadence = [ordered]@{
        Wednesday = @('20:00'); Thursday = @('13:00'); Friday = @('13:00'); Saturday = @('20:00'); Sunday = @('08:00', '12:00')
    }
    $RepoRoot = (Get-Item $PSScriptRoot).Parent.Parent.FullName
    $NodePath = (Get-Command node).Source
    $ScriptPath = Join-Path $RepoRoot "scripts\props\defense-boards-run.mjs"

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

    # Triggers: defensive cadence below, +$OffsetMinutes min (default +35, after the DKP cron at +20 so the two never share the Chrome profile).
    # Lighter than the prop cadence: defensive boards post midweek and move mostly on injury news.
    $Trigger = @(New-PropScrapeTriggers -OffsetMinutes $OffsetMinutes)

    # Settings: run on battery, run a missed occurrence when the machine is next available, 20 min hard limit.
    # (Wake-from-sleep is NOT enabled; add -WakeToRun here if you want that.)
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

    # -Force makes this an in-place replace when the task exists (and is only reachable with -Overwrite/-Force above).
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings `
        -Description "Weekly defensive prop boards (DK defensive tab, BetOnline drop folder) for NFL Dashboard" -Force | Out-Null

    # Verify, don't assume
    $Registered = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
    Write-Host "[SUCCESS] Registered scheduled task '$($Registered.TaskName)' (state: $($Registered.State)) on the weekly cadence: $(Get-PropScrapeCadenceSummary -OffsetMinutes $OffsetMinutes)." -ForegroundColor Green
    Write-Host "[INFO] To run manually at any time: npm run props:defense:run" -ForegroundColor Yellow
    exit 0
} catch {
    Write-Host "[ERROR] Failed to register scheduled task: $_" -ForegroundColor Red
    exit 1
}
