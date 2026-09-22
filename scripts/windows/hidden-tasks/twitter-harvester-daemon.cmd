@echo off
cd /d E:\dev\projects\NFL_Dashboard
"C:\Program Files\nodejs\node.exe" "E:\dev\projects\NFL_Dashboard\scripts\twitter-bookmarks-cron.js" --daemon >> "E:\dev\projects\NFL_Dashboard\logs\twitter-harvester-daemon.log" 2>&1
