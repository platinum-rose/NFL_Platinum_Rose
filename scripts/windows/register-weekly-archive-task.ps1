# Registers ONLY the NFL_Dashboard_Weekly_Archive task (does not touch the other NFL tasks).
# Run once in PowerShell:  powershell -ExecutionPolicy Bypass -File E:\dev\projects\NFL_Dashboard\scripts\windows\register-weekly-archive-task.ps1
# Triggers (local time): Mon 23:30 main capture · Tue 06:00 retry if a game ran late · Thu 06:00 refresh after NFL stat corrections.
$WorkingDir = "E:\dev\projects\NFL_Dashboard"
$VbsPath    = Join-Path $WorkingDir "scripts\windows\run-hidden.vbs"
$Job        = Join-Path $WorkingDir "scripts\windows\hidden-tasks\weekly-archive.cmd"
New-Item -ItemType Directory -Force -Path (Join-Path $WorkingDir "logs") | Out-Null
if (-not (Test-Path $Job)) { Write-Host "ERROR: $Job not found" -ForegroundColor Red; exit 1 }
$action   = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"{0}" "{1}"' -f $VbsPath, $Job) -WorkingDirectory $WorkingDir
$triggers = @(
  (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday   -At "23:30"),
  (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Tuesday  -At "06:00"),
  (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Thursday -At "06:00")
)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 45)
Register-ScheduledTask -TaskName "NFL_Dashboard_Weekly_Archive" -Action $action -Trigger $triggers -Settings $settings `
  -Description "End-of-week archive: ESPN finals, team post-mortem, Yahoo fantasy/survivor/pick'em, pool captures, Obsidian notes (NFL/<season>/Week NN), season CSVs. Read-only APIs; never settles the ledger." -Force | Out-Null
Write-Host "[OK] NFL_Dashboard_Weekly_Archive registered (Mon 23:30, Tue 06:00, Thu 06:00)" -ForegroundColor Green
Write-Host "Test now:  Start-ScheduledTask -TaskName NFL_Dashboard_Weekly_Archive   then check logs\weekly-archive.log"
