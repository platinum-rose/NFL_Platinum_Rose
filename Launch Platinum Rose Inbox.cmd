@echo off
cd /d "%~dp0"
start "Platinum Rose AI Inbox Server" cmd /k "npm.cmd run official:picks:serve"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8787/"
