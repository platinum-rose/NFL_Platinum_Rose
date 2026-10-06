@echo off
cd /d E:\dev\projects\NFL_Dashboard
echo ==== %DATE% %TIME% toolbox --cadence monday ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-monday.log"
"C:\Program Files\nodejs\node.exe" scripts\toolbox.mjs --cadence monday >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-monday.log" 2>&1
set RC=%ERRORLEVEL%
echo ==== exit %RC% ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-monday.log"
exit /b %RC%
