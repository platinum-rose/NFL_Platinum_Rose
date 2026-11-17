@echo off
cd /d E:\dev\projects\NFL_Dashboard
"C:\Program Files\nodejs\node.exe" scripts\reconcile-settlement.mjs --dry-run >> "E:\dev\projects\NFL_Dashboard\logs\settlement-reconciliation.log" 2>&1