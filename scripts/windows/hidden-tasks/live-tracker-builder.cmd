@echo off
cd /d E:\dev\projects\NFL_Dashboard
"C:\Program Files\nodejs\node.exe" scripts\generate-live-tracker.mjs >> "E:\dev\projects\NFL_Dashboard\logs\live-tracker.log" 2>&1