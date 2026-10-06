# Registers ONLY the NFL_Dashboard_Toolbox_<Cadence> tasks (does not touch the other NFL tasks).
# Run once in PowerShell:  powershell -ExecutionPolicy Bypass -File E:\dev\projects\NFL_Dashboard\scripts\windows\register-toolbox-cadence-tasks.ps1
# Each task runs `node scripts/toolbox.mjs --cadence <day>` hidden, logging to logs\toolbox-<day>.log.
# Paid/remote side effects (approved by Andy 2026-10-06):
#   tuesday  -> Supabase games / player_stats / game_odds_snapshots + line_movements; TheOddsAPI ~3 credits/week
#   saturday -> Supabase user_bankroll_bets mirror of the placed-wagers ledger
#   all others: local builds; Thursday/Saturday market lines read Supabase odds (0 credits). No paid model calls.
$WorkingDir = "E:\dev\projects\NFL_Dashboard"
$VbsPath    = Join-Path $WorkingDir "scripts\windows\run-hidden.vbs"
$HiddenDir  = Join-Path $WorkingDir "scripts\windows\hidden-tasks"
New-Item -ItemType Directory -Force -Path (Join-Path $WorkingDir "logs") | Out-Null

$Cadences = @(
  @{ Cadence = "tuesday";      Name = "Tuesday";     At = @(@("Tuesday","10:00"));                        LimitMin = 30; Why = "schedule + nflverse stats + Supabase ingest, usage locks, projected starters, opening odds (TheOddsAPI ~3 credits), roster audit" },
  @{ Cadence = "wednesday";    Name = "Wednesday";   At = @(@("Wednesday","09:00"));                      LimitMin = 60; Why = "podcast/YouTube sweep (no Gemini), research intel + Twitter bookmarks (dry runs)" },
  @{ Cadence = "wednesday-pm"; Name = "WednesdayPM"; At = @(@("Wednesday","15:00"));                      LimitMin = 30; Why = "first practice reports, projected starters, Kalshi/Polymarket + map + coherence, Alpha packet" },
  @{ Cadence = "thursday";     Name = "Thursday";    At = @(@("Thursday","14:30"));                       LimitMin = 30; Why = "practice reports, market lines vs SuperContest (0 credits), TNF props intel" },
  @{ Cadence = "friday";       Name = "Friday";      At = @(@("Friday","15:00"));                         LimitMin = 30; Why = "final injury reports, starters, secondary matrix, Sunday props/SGPs, prediction markets, Alpha packet" },
  @{ Cadence = "saturday";     Name = "Saturday";    At = @(@("Saturday","10:00"));                       LimitMin = 20; Why = "official-pick inbox, CLV line check (0 credits), placed wagers -> Supabase bankroll mirror" },
  @{ Cadence = "sunday";       Name = "Sunday";      At = @(@("Sunday","08:30"), @("Sunday","11:45"));    LimitMin = 20; Why = "inactives (early + late window) and live tracker build; no browser launch" },
  @{ Cadence = "monday";       Name = "Monday";      At = @(@("Monday","22:30"));                         LimitMin = 15; Why = "settlement preview (dry run); weekly archive follows at 23:30" }
)

foreach ($c in $Cadences) {
  $job = Join-Path $HiddenDir ("toolbox-{0}.cmd" -f $c.Cadence)
  if (-not (Test-Path $job)) { Write-Host "ERROR: $job not found" -ForegroundColor Red; continue }
  $taskName = "NFL_Dashboard_Toolbox_{0}" -f $c.Name
  $action   = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"{0}" "{1}"' -f $VbsPath, $job) -WorkingDirectory $WorkingDir
  $triggers = @($c.At | ForEach-Object { New-ScheduledTaskTrigger -Weekly -DaysOfWeek $_[0] -At $_[1] })
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes $c.LimitMin)
  try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $triggers -Settings $settings `
      -Description ("toolbox --cadence {0}: {1}. Log: logs\toolbox-{0}.log" -f $c.Cadence, $c.Why) -Force | Out-Null
    $when = ($c.At | ForEach-Object { "{0} {1}" -f $_[0].Substring(0,3), $_[1] }) -join ", "
    Write-Host ("  [OK] {0}  ({1})" -f $taskName, $when) -ForegroundColor Green
  } catch {
    Write-Host ("  [FAIL] {0}: {1}" -f $taskName, $_.Exception.Message) -ForegroundColor Red
  }
}
Write-Host "`nTest one now:  Start-ScheduledTask -TaskName NFL_Dashboard_Toolbox_Monday   then check logs\toolbox-monday.log"
Write-Host "List them:     Get-ScheduledTask -TaskName 'NFL_Dashboard_Toolbox_*' | Get-ScheduledTaskInfo | ft TaskName,LastRunTime,LastTaskResult,NextRunTime"
