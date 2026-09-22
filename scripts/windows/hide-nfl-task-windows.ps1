# Switches the NFL_Dashboard scheduled tasks to run with no console window.
# Each task's action becomes: wscript.exe run-hidden.vbs <job>.cmd
# Triggers, schedule, user and settings are left unchanged.
# Backs up every task's XML first. To undo one task:
#   Register-ScheduledTask -TaskName "<name>" -Xml (Get-Content "<backup>.xml" -Raw) -Force
# Run from a normal PowerShell window (use "Run as administrator" only if you get Access denied).

$root   = 'E:\dev\projects\NFL_Dashboard\scripts\windows'
$vbs    = Join-Path $root 'run-hidden.vbs'
$backup = Join-Path $root ('task-backups\' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $backup | Out-Null

$map = [ordered]@{
  'NFL_Dashboard_Research_Intel_Sync'   = 'research-intel-sync.cmd'
  'NFL_Dashboard_Twitter_Bookmarks_Sync' = 'twitter-bookmarks-sync.cmd'
  'NFL_Dashboard_Screenshot_Watcher'    = 'screenshot-watcher.cmd'
  'NFL_Dashboard_Twitter_Harvester'     = 'twitter-harvester-daemon.cmd'
  'NFL Fantasy Waiver Sync'             = 'fantasy-waiver-sync.cmd'
  'NFL_Dashboard_Grok_Thread_Scanner'   = 'grok-thread-scanner.cmd'
  'NFL_Dashboard_Live_Odds_Sync'        = 'live-odds-sync.cmd'
  'NFL_Dashboard_Player_Availability_Sync' = 'player-availability-sync.cmd'
  'NFL_Dashboard_Settlement_Reconciliation' = 'settlement-reconciliation.cmd'
  'NFL_Dashboard_Live_Tracker_Builder'  = 'live-tracker-builder.cmd'
  'NFL_Dashboard_Daily_Intelligence_Brief' = 'daily-brief.cmd'
  'NFL_Dashboard_Yahoo_Survivor_Sync'   = 'yahoo-survivor-sync.cmd'
  'NFL_Dashboard_Podcast_Ingestion_Sync' = 'podcast-ingestion-sync.cmd'
}

foreach ($name in $map.Keys) {
  $task = Get-ScheduledTask -TaskName $name -TaskPath '\' -ErrorAction SilentlyContinue
  if (-not $task) { Write-Host "SKIP  $name (not found)" -ForegroundColor Yellow; continue }
  Export-ScheduledTask -TaskName $name -TaskPath '\' | Out-File -Encoding Unicode (Join-Path $backup ($name + '.xml'))
  $job = Join-Path $root ('hidden-tasks\' + $map[$name])
  $action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"{0}" "{1}"' -f $vbs, $job) -WorkingDirectory 'E:\dev\projects\NFL_Dashboard'
  try {
    Set-ScheduledTask -TaskName $name -TaskPath '\' -Action $action -ErrorAction Stop | Out-Null
    Write-Host "OK    $name -> hidden ($($map[$name]))" -ForegroundColor Green
  } catch {
    Write-Host "FAIL  $name : $($_.Exception.Message)" -ForegroundColor Red
  }
}
Write-Host "Backups: $backup"
Get-ScheduledTask -TaskPath '\' | Where-Object { $map.Keys -contains $_.TaskName } |
  Select-Object TaskName, State, @{n='Action';e={ ($_.Actions | ForEach-Object { "$($_.Execute) $($_.Arguments)" }) -join ' | ' }} |
  Format-Table -AutoSize -Wrap | Out-String -Width 300 | Write-Host
