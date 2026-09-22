@echo off
cd /d E:\dev\projects\NFL_Dashboard
"C:\Program Files\nodejs\node.exe" scripts\twitter-bookmarks-cron.js >> "E:\dev\projects\NFL_Dashboard\logs\twitter-bookmarks-sync.log" 2>&1
