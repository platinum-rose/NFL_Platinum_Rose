@echo off
cd /d E:\dev\projects\NFL_Dashboard
"C:\Program Files\nodejs\node.exe" agents\podcast-ingest.js >> "E:\dev\projects\NFL_Dashboard\logs\podcast-ingest.log" 2>&1
"C:\Program Files\nodejs\node.exe" scripts\build-host-citations.js >> "E:\dev\projects\NFL_Dashboard\logs\podcast-ingest.log" 2>&1
"C:\Program Files\nodejs\node.exe" scripts\build-expert-dossiers.js >> "E:\dev\projects\NFL_Dashboard\logs\podcast-ingest.log" 2>&1
"C:\Program Files\nodejs\node.exe" scripts\build-podcast-transcript-deep-dives.js >> "E:\dev\projects\NFL_Dashboard\logs\podcast-ingest.log" 2>&1