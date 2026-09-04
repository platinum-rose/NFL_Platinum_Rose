@echo off
title Stop Twitter Harvester
echo Stopping background Twitter Harvester processes...
powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*twitter-bookmarks-cron*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host 'Stopped PID:' $_.ProcessId }"
echo Done.
pause
