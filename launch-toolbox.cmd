@echo off
cd /d "%~dp0"
echo 🏈 Starting NFL Platinum Rose Standalone Toolbox App...

:: 1. Check if server is already responding
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4567/api/status' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch { exit 1 }"
if %errorlevel% neq 0 (
  start "NFL Toolbox Server" /min cmd /c "node scripts/toolbox-app-server.mjs"
  echo Waiting for server to initialize on http://127.0.0.1:4567...
  powershell -NoProfile -Command "for ($i=0; $i -lt 20; $i++) { try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4567/api/status' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch {} Start-Sleep -Milliseconds 500 }; exit 1"
  if %errorlevel% neq 0 (
    echo [ERROR] Server failed to start within 10 seconds.
    pause
    exit /b 1
  )
)

:: 2. Launch Brave in app mode (fallback to Edge)
if exist "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" (
  start "" "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --app=http://127.0.0.1:4567 --window-size=1520,960
) else if exist "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe" (
  start "" "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe" --app=http://127.0.0.1:4567 --window-size=1520,960
) else (
  start msedge --app=http://127.0.0.1:4567 || start http://127.0.0.1:4567
)
