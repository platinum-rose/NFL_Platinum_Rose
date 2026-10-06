@echo off
cd /d E:\dev\projects\NFL_Dashboard
echo ==== %DATE% %TIME% toolbox --cadence wednesday ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-wednesday.log"
"C:\Program Files\nodejs\node.exe" scripts\toolbox.mjs --cadence wednesday >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-wednesday.log" 2>&1
set RC=%ERRORLEVEL%
echo ==== exit %RC% ==== >> "E:\dev\projects\NFL_Dashboard\logs\toolbox-wednesday.log"
exit /b %RC%
