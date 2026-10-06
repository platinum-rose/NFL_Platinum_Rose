@echo off
cd /d E:\dev\projects\NFL_Dashboard
echo ==== %DATE% %TIME% weekly-archive ==== >> "E:\dev\projects\NFL_Dashboard\logs\weekly-archive.log"
"C:\Program Files\nodejs\node.exe" scripts\archive\weekly-archive.mjs >> "E:\dev\projects\NFL_Dashboard\logs\weekly-archive.log" 2>&1
