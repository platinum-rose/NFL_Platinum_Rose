@echo off
rem One-time Yahoo backfill for 2026: weeks 1-4 (fantasy leagues, pickem, survivor copy) + draft results with 4 seasons of league history.
rem Read-only Yahoo API; writes data\archive and the Obsidian vault (NFL\2026\...). Safe to re-run.
cd /d E:\dev\projects\NFL_Dashboard
set LOG=E:\dev\projects\NFL_Dashboard\logs\yahoo-backfill-2026.log
echo ==== %DATE% %TIME% yahoo backfill ==== >> "%LOG%"
for %%W in (1 2 3 4) do (
  echo ---- week %%W ---- >> "%LOG%"
  "C:\Program Files\nodejs\node.exe" scripts\archive\weekly-archive.mjs --week %%W --skip-espn >> "%LOG%" 2>&1
)
echo ---- drafts (+4 seasons history) ---- >> "%LOG%"
"C:\Program Files\nodejs\node.exe" scripts\archive\yahoo-draft-results.mjs --season 2026 --history 4 >> "%LOG%" 2>&1
echo ==== done %TIME% ==== >> "%LOG%"
echo Backfill finished - see logs\yahoo-backfill-2026.log
