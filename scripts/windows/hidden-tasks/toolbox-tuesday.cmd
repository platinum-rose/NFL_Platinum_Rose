@echo off
cd /d E:\dev\projects\NFL_Dashboard
echo ==== %DATE% %TIME% toolbox --cadence tuesday ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-tuesday.log"
"C:\Program Files\nodejs\node.exe" scripts\toolbox.mjs --cadence tuesday >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-tuesday.log" 2>&1
set RC=%ERRORLEVEL%
echo ==== exit %RC% ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-tuesday.log"
exit /b %RC%
