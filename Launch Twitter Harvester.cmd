@echo off
cd /d "%~dp0"
title Platinum Rose Twitter Harvester Daemon
echo Starting Platinum Rose Twitter Bookmarks Harvester Daemon...
start "Platinum Rose Twitter Harvester" cmd /k "npm.cmd run twitter:bookmarks:daemon"
