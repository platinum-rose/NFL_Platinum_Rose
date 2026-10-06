@echo off
cd /d E:\dev\projects\NFL_Dashboard
echo ==== %DATE% %TIME% toolbox --cadence sunday --no-launch ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-sunday.log"
"C:\Program Files\nodejs\node.exe" scripts\toolbox.mjs --cadence sunday --no-launch >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-sunday.log" 2>&1
set RC=%ERRORLEVEL%
echo ==== exit %RC% ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-sunday.log"
exit /b %RC%
