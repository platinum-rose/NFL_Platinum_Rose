@echo off
cd /d E:\dev\projects\NFL_Dashboard
echo ==== %DATE% %TIME% toolbox --cadence friday ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-friday.log"
"C:\Program Files\nodejs\node.exe" scripts\toolbox.mjs --cadence friday >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-friday.log" 2>&1
set RC=%ERRORLEVEL%
echo ==== exit %RC% ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-friday.log"
exit /b %RC%
