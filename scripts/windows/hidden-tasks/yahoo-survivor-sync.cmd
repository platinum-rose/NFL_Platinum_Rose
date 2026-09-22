@echo off
cd /d E:\dev\projects\NFL_Dashboard
"C:\Program Files\nodejs\node.exe" scripts\sync-yahoo-survivor.mjs >> "E:\dev\projects\NFL_Dashboard\logs\survivor-sync.log" 2>&1