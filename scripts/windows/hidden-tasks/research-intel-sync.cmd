@echo off
cd /d E:\dev\projects\NFL_Dashboard
"C:\Program Files\nodejs\node.exe" scripts\research-intel-cron.js >> "E:\dev\projects\NFL_Dashboard\logs\research-intel-sync.log" 2>&1
