@echo off
cd /d E:\dev\projects\NFL_Dashboard
"C:\Program Files\nodejs\node.exe" scripts\sync-yahoo-fantasy.mjs >> "E:\dev\projects\NFL_Dashboard\logs\waiver-sync.log" 2>&1
