@echo off
cd /d E:\dev\projects\NFL_Dashboard
"C:\Program Files\nodejs\node.exe" scripts\sync-live-market-lines.mjs >> "E:\dev\projects\NFL_Dashboard\logs\live-market-lines.log" 2>&1