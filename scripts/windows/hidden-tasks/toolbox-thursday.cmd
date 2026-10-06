@echo off
cd /d E:\dev\projects\NFL_Dashboard
echo ==== %DATE% %TIME% toolbox --cadence thursday ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-thursday.log"
"C:\Program Files\nodejs\node.exe" scripts\toolbox.mjs --cadence thursday >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-thursday.log" 2>&1
set RC=%ERRORLEVEL%
echo ==== exit %RC% ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-thursday.log"
exit /b %RC%
