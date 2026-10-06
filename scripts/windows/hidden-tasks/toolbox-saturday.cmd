@echo off
cd /d E:\dev\projects\NFL_Dashboard
echo ==== %DATE% %TIME% toolbox --cadence saturday ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-saturday.log"
"C:\Program Files\nodejs\node.exe" scripts\toolbox.mjs --cadence saturday >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-saturday.log" 2>&1
set RC=%ERRORLEVEL%
echo ==== exit %RC% ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-saturday.log"
exit /b %RC%
