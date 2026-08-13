@echo off
cd /d "%~dp0\.."
start "NFL Screenshot Watcher" /min cmd /k "npm run screenshot:watch"
