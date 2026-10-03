# Windows Scheduled Tasks Ingestion Pipeline Restoration Report

**Date:** 2026-10-02 20:15 PT  
**Author:** Antigravity  
**Recipient:** Claude & Andy  
**Repository:** `E:\dev\projects\NFL_Dashboard` (`main` @ `8712129`)  

---

## Executive Summary

At 2026-10-01 13:32Z (Thu 6:32 AM PT), local Windows scheduled tasks on this machine began logging `TypeError: fetch failed` due to a transient local network failure. Later that day at 1:53 PM PT (20:53 UTC), Windows Update rebooted the machine. Following the restart, the NFL Dashboard scheduled tasks were not registered in Windows Task Scheduler.

All 12 scheduled tasks have been **re-registered, verified, and configured in hidden mode** (`wscript.exe run-hidden.vbs`). All network connectivity to Supabase and Twitter/X has been verified, personal Twitter cookies are confirmed **active and valid** (HTTP 200 OK), and all 5 sequential manual task runs completed with **100% success**.

---

## 1. Machine Identity & Ownership

- **Host Name:** `LAPTOP-1P2J0006`
- **OS Version:** Windows 11 Home 10.0.26300
- **User Identity:** `laptop-1p2j0006\andre`
- **Node Environment:** `v24.11.1` (PATH matches `C:\Program Files\nodejs\node.exe`)
- **Machine Role:** This machine (`LAPTOP-1P2J0006`) is the sole host for all local Windows Task Scheduler tasks and hidden `.cmd` task wrappers. The "M6" workstation setup refers to a remote Linux workstation (`E:\dev\ATLAS\services\m6-mcp`, `u11_harden_m6.sh`), NOT this Windows laptop.

---

## 2. Initial Task State (Before Restoration)

A query of Windows Task Scheduler via `Get-ScheduledTask -TaskName 'NFL*'` revealed that **0 tasks** were registered under `\` or any subfolder.

- System event logs show Windows Update completed installation and rebooted the system at `10/1/2026 1:53:11 PM PT`.
- The scheduled tasks had ceased running at that point.
- Task definitions and scripts remained intact in `scripts\setup-all-nfl-scheduled-tasks.ps1`, `scripts\windows\hidden-tasks\*.cmd`, and `scripts\windows\task-backups\20260919-231045\`.

---

## 3. Network & Node Environment Diagnostics

- **Supabase Node REST Probe:**
  ```javascript
  node -e "require('dotenv').config();fetch(process.env.SUPABASE_URL+'/rest/v1/',{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY}}).then(r=>console.log('STATUS:',r.status))"
  ```
  **Result:** `STATUS: 200 OK`
- **DNS Resolution:** `nslookup aambmuzfcojxqvbzhngp.supabase.co` resolved cleanly to Cloudflare Anycast IPs `104.18.38.10` and `172.64.149.246`.
- **Port 443 TCP Connection:** `Test-NetConnection aambmuzfcojxqvbzhngp.supabase.co -Port 443` -> `TcpTestSucceeded: True`.
- **Diagnosis:** The `TypeError: fetch failed` logged on 10/1 was a transient local network/DNS outage preceding the Windows restart, not a Supabase outage or local credential corruption.

---

## 4. Re-Registration & Task State (After Restoration)

The tasks were re-registered using:
1. `scripts\setup-all-nfl-scheduled-tasks.ps1`
2. `scripts\setup-research-intel-task.ps1`
3. `scripts\setup-twitter-bookmarks-task.ps1`
4. `scripts\setup-windows-task.ps1`
5. `scripts\windows\task-backups\20260919-231045\NFL Fantasy Waiver Sync.xml`
6. `scripts\windows\hide-nfl-task-windows.ps1` (to ensure all 12 tasks run completely windowless without console popups)

### Live Task State Table (`Get-ScheduledTask -TaskName 'NFL*'`)

| Task Name | State | Schedule / Trigger | Action | Next Run Time |
|---|---|---|---|---|
| `NFL_Dashboard_Research_Intel_Sync` | **Ready** | Every 30 mins | `wscript.exe run-hidden.vbs research-intel-sync.cmd` | 10/2/2026 8:33 PM |
| `NFL_Dashboard_Twitter_Bookmarks_Sync` | **Ready** | Every 30 mins | `wscript.exe run-hidden.vbs twitter-bookmarks-sync.cmd` | 10/2/2026 8:33 PM |
| `NFL_Dashboard_Grok_Thread_Scanner` | **Ready** | Every 60 mins | `wscript.exe run-hidden.vbs grok-thread-scanner.cmd` | 10/2/2026 8:04 PM |
| `NFL_Dashboard_Live_Odds_Sync` | **Ready** | Every 120 mins | `wscript.exe run-hidden.vbs live-odds-sync.cmd` | 10/2/2026 8:04 PM |
| `NFL_Dashboard_Live_Tracker_Builder` | **Ready** | Every 120 mins | `wscript.exe run-hidden.vbs live-tracker-builder.cmd` | 10/2/2026 8:04 PM |
| `NFL_Dashboard_Screenshot_Watcher` | **Ready** | Every 120 mins | `wscript.exe run-hidden.vbs screenshot-watcher.cmd` | 10/2/2026 10:03 PM |
| `NFL_Dashboard_Player_Availability_Sync` | **Ready** | Daily at 16:30 | `wscript.exe run-hidden.vbs player-availability-sync.cmd` | 10/3/2026 4:30 PM |
| `NFL_Dashboard_Podcast_Ingestion_Sync` | **Ready** | Daily at 06:30, 14:30 | `wscript.exe run-hidden.vbs podcast-ingestion-sync.cmd` | 10/3/2026 6:30 AM |
| `NFL_Dashboard_Daily_Intelligence_Brief` | **Ready** | Daily at 07:00 | `wscript.exe run-hidden.vbs daily-brief.cmd` | 10/3/2026 7:00 AM |
| `NFL_Dashboard_Settlement_Reconciliation` | **Ready** | Daily at 03:30 | `wscript.exe run-hidden.vbs settlement-reconciliation.cmd` | 10/3/2026 3:30 AM |
| `NFL_Dashboard_Yahoo_Survivor_Sync` | **Ready** | Daily at 10:00, 18:00 | `wscript.exe run-hidden.vbs yahoo-survivor-sync.cmd` | 10/3/2026 10:00 AM |
| `NFL Fantasy Waiver Sync` | **Ready** | Weekly (Wed 03:15) | `wscript.exe run-hidden.vbs fantasy-waiver-sync.cmd` | 10/7/2026 3:15 AM |

*Note on Daemons:* `scripts/twitter-bookmarks-cron.js --daemon` is no longer run as an unmonitored persistent daemon. It has been replaced by the self-healing 30-minute interval task `NFL_Dashboard_Twitter_Bookmarks_Sync`.

---

## 5. Twitter / X Session Health

- Both `PERSONAL_TWITTER_AUTH_TOKEN` (40 chars) and `PERSONAL_TWITTER_CT0` (160 chars) were probed directly against the live Twitter GraphQL API (`BookmarkSearchTimeline` query).
- **Result:** **HTTP 200 OK** with structured JSON timeline response.
- **Status:** **Cookies are completely valid.** Andy does **NOT** need to log in or update `.env`.
- The prior log indicating "cookies not configured" occurred because the agent code falls back to fixture sample bookmarks when `fetch()` throws a network error.

---

## 6. Verification: 5 Manual Task Runs in Sequence

All 5 manual runs were triggered using their hidden `.cmd` wrappers:

### 1. `scripts\windows\hidden-tasks\research-intel-sync.cmd`
- **Execution Log:** `logs\research-intel-sync.log`
- **Summary:**
  ```text
  [2026-10-03T03:04:10.767Z] 🚀 Running Research Intel Article Sweep...
  ResearchIntelIngestAgent start (feeds=9, lookbackHours=72)
    Fetching article bodies for 4 new notes...
    Bodies fetched: 4/4
    Backfilling article bodies for 20 earlier notes...
    Bodies backfilled: 20/20 (+26 signals)
    Inserted notes: 4 | Inserted signals: 26
  [2026-10-03T03:04:37.385Z] ✅ Research Intel Article Sweep completed successfully.
  ```

### 2. `scripts\windows\hidden-tasks\twitter-bookmarks-sync.cmd`
- **Execution Log:** `logs\twitter-bookmarks-sync.log`
- **Summary:**
  ```text
  [2026-10-03T03:05:01.653Z] 🚀 Running Twitter Bookmarks Sweep...
  [live] Fetched 300 bookmark(s) from personal Twitter account.
  [bookmark] Ingesting NFL intel from @DanGambleAI: "NFL 100% Hit Rates..."
    [vision] Found 1 media attachment(s). Running Gemini Vision OCR...
    [saved] Local vault report: .nfl\reports\twitter-bookmarks\2026-10-02-DanGambleAI-2106033434476880306.md
    [supabase] Inserted research_intel_notes row 6090 for this bookmark.
  =======================================================
    Ingestion Complete! Ingested: 12 | Skipped (Non-Target): 288
  =======================================================
  [2026-10-03T03:08:48.078Z] ✅ Twitter Bookmarks Sweep completed successfully.
  ```

### 3. `scripts\windows\hidden-tasks\grok-thread-scanner.cmd`
- **Execution Log:** `logs\grok-thread-scanner.log`
- **Summary:**
  ```text
  [result] Scanned Week 4 notes: 9 active unprocessed thread(s).
  [saved] Wrote Grok prompt packet to: E:\dev\projects\NFL_Dashboard\data\research-intel\grok-thread-prompt-latest.md
  [saved] Wrote URL list to: E:\dev\projects\NFL_Dashboard\data\research-intel\grok-thread-urls-latest.txt
  [info] Target CSV for this run: data/vault-seed/manual/grok-week04-threads/grok-twitter-picks-2026-10-02.csv
  [done] Run complete.
  ```

### 4. `scripts\windows\hidden-tasks\player-availability-sync.cmd`
- **Execution Log:** `logs\player-availability.log`
- **Summary:**
  ```text
  Player availability build complete: 1173 events, 32 teams.
  Improving 78 | Worsening 466 | Major 850
    [available] ESPN injuries API - 32 team groups; 639 parsed rows.
    [available] FantasyPros injuries API - 529 parsed rows.
    [available] Training camp snapshot - 62 availability-like item(s) from 225 camp item(s).
  Snapshot: E:\dev\projects\NFL_Dashboard\data\player-availability\player-availability-2026-10-03.json
  Markdown: E:\dev\projects\NFL_Dashboard\docs\player-availability\player-availability-latest.md
  HTML: E:\dev\projects\NFL_Dashboard\docs\player-availability\player-availability-latest.html
  ```

### 5. `scripts\windows\hidden-tasks\live-tracker-builder.cmd`
- **Execution Log:** `logs\live-tracker.log`
- **Summary:**
  ```text
  Generating Sunday Multi-Game Live Tracker for Week 4...
     ✅ Wrote Live Tracker HTML: public\live-tracker-sunday.html
     ✅ Wrote Live Tracker HTML: docs\tracked-wagers\live-tracker-sunday.html
  ```

---

## 7. Preventing Silent Repeats (Outage Analysis & Recommendation)

### Why it went unnoticed for 36 hours:
1. **Local Isolation:** Windows scheduled tasks ran only on Andy's laptop. When they failed and halted, no external service noticed because logs were only written to local `.log` files.
2. **Cloud vs. Local Divergence:** GitHub Actions workflows continued running on cloud runners, producing intermittent commits and green workflow badges, masking local worker silence.
3. **No Staleness / Dead-Man's Watchdog:** There was no probe checking `MAX(created_at)` on tables populated exclusively by local agents (`research_intel_notes` where `source LIKE 'Twitter%'`, or `player-availability` snapshots).

### Concrete Recommendation:
We recommend adding an automated staleness check:
1. **GitHub Actions Workflow: `pipeline-health-watchdog.yml`**
   - Runs every 2 hours during football season (Thursday 12:00 PM PT through Monday 11:59 PM PT).
   - Queries Supabase for:
     ```sql
     SELECT 
       MAX(CASE WHEN source LIKE 'Twitter%' THEN created_at END) as latest_twitter_bookmark,
       MAX(CASE WHEN source = 'Research Intel Sync' THEN created_at END) as latest_research_intel
     FROM research_intel_notes;
     ```
   - If `latest_twitter_bookmark` or `latest_research_intel` is older than **3 hours** during daytime hours, it triggers `agents/lib/billing-alert.js` to dispatch an urgent email alert to Andy (`andrewlrose@gmail.com`).
2. **Local Reboot Resilience:** Add an `@onstartup` or `@logon` trigger to `setup-all-nfl-scheduled-tasks.ps1` so that if Windows restarts after updates, the interval jobs start immediately upon user login.

---

## Next Steps for Claude & Andy

1. **Grok Thread Prompt:** The Grok prompt packet has been updated with 9 active Week 4 threads at `data/research-intel/grok-thread-prompt-latest.md`. If desired, run the Grok prompt through xAI to generate picks.
2. **Live Ingestion Active:** Local ingestion is fully alive. Next scheduled tasks will fire automatically according to the Task Scheduler timetable.
