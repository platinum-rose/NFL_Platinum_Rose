# 2026-10-02 19:50 PT: Claude → Antigravity: restore the Windows scheduled tasks (local ingestion down since Thu AM)

Repo: `E:\dev\projects\NFL_Dashboard`, branch `main`. This is separate from the Gemini billing lane (`handoffs/2026-10-02-1905-claude-to-antigravity-gemini-billing-investigation.md`).

## Symptom
Every log written by `scripts\windows\hidden-tasks\*.cmd` stops at **2026-10-01 13:32Z (Thu 6:32 AM PT)**. The last runs before that were already failing with `TypeError: fetch failed` on Supabase calls:
- `logs\research-intel-sync.log`: `ResearchIntelIngestAgent failed: research_intel_notes check failed: TypeError: fetch failed`
- `logs\grok-thread-scanner.log`: `Failed to fetch research_intel_notes: TypeError: fetch failed`
- `logs\twitter-bookmarks-sync.log`: `Bookmark search error ... fetch failed`, then `Personal Twitter session cookies not configured or no new bookmarks. Running sample test pass...`, then `Ingested: 0`
- `logs\podcast-ingest.log`: `Failed to load feeds: TypeError: fetch failed`
- `logs\player-availability.log`, `logs\live-tracker.log`: `fetch failed`
- `logs\twitter-harvester-daemon.log`: last sweep 2026-10-01 00:21Z

The GitHub Actions feeds are fine. research-intel-ingest wrote articles to Supabase at Fri 5:18 PM PT, so Supabase itself is up. The problem is local to this machine.

Impact:
- No Twitter/X bookmarks since Wed 11:56 AM PT.
- No Grok thread packets since Wed.
- No local player-availability or Live Tracker refresh.
- No local podcast-ingest runs. You are already handling transcription separately.

## Checklist (report the result of each step)
1. **Is this the machine that runs the tasks?** The M6 workstation setup (`claude/handoff-2026-09-29-m6-dev-workstation-setup` in the DEV project) may have moved daily work to a new PC. State which machine you are on and which one owns the scheduled tasks.
2. **Task state.** In PowerShell:
   `Get-ScheduledTask -TaskName 'NFL_Dashboard*' | Get-ScheduledTaskInfo | Select TaskName,LastRunTime,LastTaskResult,NextRunTime,NumberOfMissedRuns`
   plus `(Get-ScheduledTask 'NFL_Dashboard*').State`. Expected tasks:
   - Live_Odds_Sync
   - Player_Availability_Sync
   - Settlement_Reconciliation
   - Live_Tracker_Builder
   - Daily_Intelligence_Brief
   - Yahoo_Survivor_Sync
   - Podcast_Ingestion_Sync
   - Grok_Thread_Scanner
   - Research_Intel_Sync
   - Twitter_Bookmarks_Sync
   - Screenshot_Watcher
   
   Also check how the twitter-harvester daemon and fantasy-waiver-sync are launched. Are any tasks disabled? Did they stop firing after 10/1 13:32Z? Note the LastTaskResult codes.
3. **Network from Node on this machine.** From the repo root:
   `node -e "require('dotenv').config();fetch(process.env.SUPABASE_URL+'/rest/v1/',{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY}}).then(r=>console.log(r.status)).catch(e=>console.log(e.cause||e))"`
   Report the `e.cause` code (ENOTFOUND, ECONNRESET, CERT_*, UND_ERR_CONNECT_TIMEOUT, ...). Also check:
   - `nslookup aambmuzfcojxqvbzhngp.supabase.co`
   - `Test-NetConnection aambmuzfcojxqvbzhngp.supabase.co -Port 443`
   - any VPN/proxy/firewall or IPv6 change since 9/30
   - the Node version (`node -v`) vs. what the tasks call (`C:\Program Files\nodejs\node.exe`)
4. **Fix and re-enable.** Restore connectivity, then re-register the tasks if needed with `scripts\setup-all-nfl-scheduled-tasks.ps1` plus the four standalone setup scripts:
   - `setup-research-intel-task.ps1`
   - `setup-grok-thread-scanner-task.ps1`
   - `setup-twitter-bookmarks-task.ps1`
   - `setup-windows-task.ps1` (screenshot watcher)
   
   Do not change task schedules or scripts beyond what the fix needs.
5. **Twitter/X session.** Determine whether the bookmark cookies are missing or expired (`scripts\twitter-bookmarks-cron.js` config). If Andy needs to log in to X again, give him the exact steps and stop there. Do not log in on his behalf.
6. **Verify with one manual run each, in order, and paste the summary line of each:**
   1. `scripts\windows\hidden-tasks\research-intel-sync.cmd`
   2. `twitter-bookmarks-sync.cmd`: expect real Week 4 bookmarks since 9/30, not the sample test pass.
   3. `grok-thread-scanner.cmd`: should refresh `data\research-intel\grok-thread-prompt-latest.md` for Week 4.
   4. `player-availability-sync.cmd`
   5. `live-tracker-builder.cmd`
   
   Skip `podcast-ingestion-sync.cmd` while the Gemini transcription lane is in flight, unless that lane says go.
7. **Prevent a silent repeat.** Propose (don't build without Andy's OK) a cheap alert when a local task logs `fetch failed` twice in a row or hasn't run for more than 6 hours. For example, a `feed_health` row per local task, or a "local tasks last run" line in `scripts/weekly-synthesis-preflight.mjs`.

## Guardrails
- No wagers or sportsbook account actions. No TheOddsAPI calls.
- Supabase: only the writes the restored tasks normally make. No manual table edits, no ledger or official-pick changes.
- Don't edit `.env` secrets without telling Andy what changed.
- Preserve the dirty checkout: no `git add -A`, reset, clean or stash.

## Deliverable
`handoffs/2026-10-0X-HHMM-antigravity-windows-tasks-restore.md`, containing:
- the root cause
- what was changed
- the per-task before/after table (LastRunTime, LastTaskResult)
- the manual-run results
- anything Andy must do, such as logging in to X

When the tasks are healthy, tell Claude so it can rerun the master intel pull and packet build.
