# NFL Dashboard (Platinum Rose) — Dashboard Usage Guide

*How to start, read, and maintain the Platinum Rose dashboard. Technical terms are explained the first time they appear.*

## Starting and accessing the dashboard

- **Live site:** deployed automatically to GitHub Pages (GitHub's free website hosting) whenever code lands on the main branch — the URL path is `/platinum-rose-app/`.
- **Local development:** `npm run dev` → http://localhost:5173/platinum-rose-app/ (this runs Vite, the tool that serves the app while you work on it).
- **Login:** the auth gate uses Supabase accounts (Supabase is the cloud database service the project runs on). Betting partners get read access to shared reference notes via the public dashboard.

## What each tab shows

| Tab | What it shows / how to read it |
|---|---|
| Dashboard | The landing grid — one card per matchup with lines, movement, and signals. |
| Standings | Expert leaderboard — who among the tracked experts is actually hitting. |
| My Card | Your personal betting card for the week. ⚠️ Hand-entered data here is stored in your browser (see audit Finding 4) — use the backup feature. |
| Dev Lab | Monte Carlo simulation lab (runs thousands of simulated outcomes to estimate edges). |
| Bankroll | Bankroll management — stake sizing and balance over time. |
| Analytics | Performance analytics on your picks and the experts'. |
| Odds | Live odds center + line-movement history across the eight books. |
| Picks | Pick tracking and grading — automated grading fills in results after games. |

## Data entered manually

| Data | How to update it |
|---|---|
| Your picks / My Card | Directly in the app. **Back up regularly:** the storage layer has a built-in backup/restore ("disaster recovery") — export after any big entry session. |
| Expert picks (when not auto-extracted) | Picks tab / expert consensus entry. AI extraction from transcripts fills most of this automatically. |
| Vault reference notes (team notes, weekly signals) | Written in Obsidian under the `NFL/` folder, then synced: `node agents/obsidian-vault-sync.js` (requires the Obsidian Local REST API plugin running — a small plugin that lets programs read your vault through a local doorway). |
| Season/week overrides | Env vars like `VITE_NFL_SEASON`; schedule refresh via `npm run update-schedule`. |

## Data ingested automatically

All automation runs on **GitHub Actions** (GitHub's system for running scripts on a schedule in the cloud — their version of a cron job). The important ones:

| Workflow | Schedule (UTC) | What it updates | Where to check if it failed |
|---|---|---|---|
| `odds-ingest` / `game-odds-ingest` | hourly on game days (Sun/Mon/Thu), every 4h otherwise | Live odds + line-movement history | GitHub → Actions tab → the workflow's run log |
| `injury-ingest` | game-week mornings/evenings | Injury reports from ESPN | Actions tab; Dashboard cards missing injury badges |
| `betting-splits-ingest` | Sundays pre-game windows | Public betting split percentages | Actions tab |
| `nfl-auto-grade` / `props-auto-grade` | post-game windows | Grades finished picks | Picks tab still showing "pending" after a game |
| `pick-extraction` / `podcast-ingest` | after episodes drop | AI-extracted expert picks from transcripts (Groq Whisper first, AssemblyAI fallback, GPT-4o extraction) | Actions tab; Standings not updating |
| `x-sharp-ingest` | periodic | Sharp-account tweets via RSSHub (an open-source bridge that turns Twitter/X accounts into readable feeds) | Actions tab |
| `intel-to-vault-sync` | Sun + Wed 10:00 | Pushes fresh intel into team notes (`vault_notes` table) | Actions tab; team notes missing recent items |
| `futures-intel-report` | weekly | The futures intel HTML report | Actions tab |
| `nflverse-data-refresh` | weekly | Open-source NFL stats data | Actions tab |
| `deploy` | on every push to main | The live site itself | Actions tab; site showing old version |

## Troubleshooting / spotting stale data

- **First stop, always:** GitHub → repository → **Actions** tab. A red ✗ on a workflow is the failure; open it and read the last log lines.
- **Odds look old:** check the odds-ingest run — the most common cause is TheOddsAPI's free-tier quota (500 requests/month) running out late in the month. The app also caches odds for 10 minutes by design — that much lag is normal.
- **Picks stuck ungraded:** the auto-grade workflow runs in post-game windows — wait for the window, then check its Actions log.
- **A whole game-day with nothing updating:** GitHub Actions itself may be down (rare) — githubstatus.com; every agent can be run by hand from any machine with the repo and env vars (`node agents/<name>.js`, most support `--dry-run`).
- **Team notes missing this week's intel:** `intel-to-vault-sync` only runs Sun/Wed — mid-week gaps are normal. For an immediate refresh: `npm run ingest-research-intel` then `node agents/intel-to-vault-sync.js`.
- **"My Card" is empty on a new machine:** that data lives in the *browser*, not the cloud — restore from your storage backup file (and see audit Finding 4 for the permanent fix).
