@echo off
cd /d E:\dev\projects\NFL_Dashboard
"C:\Program Files\nodejs\node.exe" scripts\build-player-availability.js --live-injuries >> "E:\dev\projects\NFL_Dashboard\logs\player-availability.log" 2>&1