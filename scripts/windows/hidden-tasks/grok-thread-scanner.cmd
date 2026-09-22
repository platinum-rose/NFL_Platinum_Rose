@echo off
cd /d E:\dev\projects\NFL_Dashboard
"C:\Program Files\nodejs\node.exe" scripts\scan-unprocessed-tweet-threads.mjs >> "E:\dev\projects\NFL_Dashboard\logs\grok-thread-scanner.log" 2>&1