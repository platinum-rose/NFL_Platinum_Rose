# Handoff — 2026-10-25 2:15 PM PT · Claude · W7 Sunday tracking done → NEXT: mobile Live Tracker

Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`. HEAD = the commit containing this file (pushed). Previous handoff: `handoffs/2026-10-24-2215-claude-w7-master-sent-prop-agent.md`.

## NEXT SESSION: build a mobile Live Tracker (Andy takes it on the road)

**Goal (Andy, 2:11 PM):** "build a mobile version of the Live Tracker to take on the road with me." Start by asking Andy 2–3 scoping questions (phone; how he'll open it — hosted link vs file; live-refresh needs; which sections matter on the go), then build.

What exists today:
- **Generator:** `scripts/generate-live-tracker.mjs` (10,206 lines). Run `node scripts/generate-live-tracker.mjs --week 7` with Windows node from the repo root (desktop-commander PowerShell). Writes `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html` (single self-contained page). Also `public/live-tracker-melbourne.html`, `public/test-live-tracker.html` (older variants).
- **Data in:**
  - `data/official-picks/user-placed-wagers-2026.json` — real bets, 230 entries; the generator reads it and also writes `public/user-placed-wagers-2026.json`, which is gitignored.
  - `data/official-picks/paper-wagers-2026.json` — imaginary AI card tickets, `is_paper`, 📝 section, excluded from totals; 32 W7 entries.
  - `locked-card-week-N.json` (SuperContest), fetched client-side.
- **Live data in the page:** client-side fetches of the ESPN scoreboard and summary APIs (`site.api.espn.com/.../scoreboard` and `summary?event=`), a 1-second countdown tick, and Yahoo sync / `serverBase + '/api/run'` calls (local server — won't work on the road).
- **Existing responsive bits:** viewport meta at line ~1964; `@media` at 1400/900/600 px (lines ~2611, 2614, 3014). It's a desktop dashboard (app-layout grid, cards-grid, bet cards with leg rows, burnt/cashed/paper collapsible sections, `body.live-only` filter). Expect phone pain: wide leg tables, hover tooltips, heavy DOM (one page per week, all tickets).
- **Hosting:** GitHub Pages via `.github/workflows/deploy.yml` (Vite build of the dashboard; check whether `docs/` or `public/` pages are served and at what URL). The Artifact tool is also an option for a private hosted link (it can't reach ESPN unless the page fetches client-side, and that does work in the browser).
- **Bankroll sync:** `node scripts/sync-placed-wagers-to-bankroll.mjs` after any wager change (Supabase; only for bets Andy asks to track).

Ideas to confirm with Andy (don't build until he picks):
1. **Mobile layout** inside the same generator (`--mobile` flag → `live-tracker-mobile.html`): one-column ticket list sorted by next-to-resolve, sticky header with today's P&L / open risk / to-win, tap-to-expand legs, live/burnt/won chips, paper section collapsed by default.
2. **PWA bits** (manifest + add-to-home-screen icon) for an app-like launch.
3. Strip local-server calls (Yahoo sync, `/api/run`) in mobile; keep ESPN client-side refresh.

## Done this session (Sun 10/25)

- **SuperContest report FINAL (34b0781).**
  - `scripts/master-intel/check_sc_report.py` is the format gate, run by build.py after every SC build. It checks the layout ids, spread-only text, and Pitch/Pushback on every AI pick and alternate.
  - `scripts/master-intel/pitch_scaffold.py` creates TODO stubs for SC + Master pitches.
  - `agents/dev/PITCH_PUSHBACK_AGENT.md` is the locked recipe.
  - Frozen reference: `docs/reference/supercontest-report-locked-w07.html`.
  - Format doc §8 + change log; skill steps 4b/5b.
- **Paper tracking of the AI card (2708abd →).** `scripts/paper_from_card.py --week N --date <Sun>` loads card §3/4/5/7h/7i/7e into paper-wagers; team FG legs are graded via the team kicker (ESPN roster). Skill step 6b. Weeks 5–6 were never paper-tracked (offer a backfill after W7 settles).
- **Card §7i afternoon prop stacks** A–F (A–D with SNF cap, E no-DEN/ARI receiving, F diversified), all paper-tracked.
- **Locked SC card:** `data/supercontest/locked-card-week-7.json` (CIN +2.5, GB +3.5, ATL +3.5, LV +4, ARI +4.5).
- **Real bets logged today**, plus the earlier BEO/DKP tickets from the previous summary:

| Ticket | Book | Bet | Stake | To win | Notes |
|---|---|---|---|---|---|
| 740807098 | BKR | SC 5-team parlay | $20 | $353.98 | |
| 740807158 | BKR | SC compact RR 10×$1.50 | $15 | $32.62 | |
| 740822735 | BKR | 5-team SGP pairs (GB@DET U57 + GB +4.5, KC@SEA SEA ML + O41, LAR ML -182) | $20 | $325.34 | no per-leg prices |
| 740821195 | BKR | 4-team spreads (ARI +5, GB +4, LV +3.5, KC +3.5) | $25 | $265.26 | |
| 1008926148 | BEO | 8-leg props | $5 | $410 | |
| 1008920800 | BEO | 5-leg TDs + Darnold INT | $5 | $165 | |
| 1008919809 | BEO | 4-leg ladder | $10 | $130 | |

- **Settled:** BEO 1008729493 is a **loss (-$5)**: NYJ scored 3 TDs vs team TDs Under 2.5 (MIA 28–25 final).

## Open / pending

- **Grade as games finish (ESPN API via device curl).** Manual legs:
  - SF@ATL and DAL@PHI "total FGs both teams U3.5" (paper)
  - Wil Lutz kicker points U8.5 (paper D)
  - Metcalf longest reception (paper)
  - sacks-taken legs (paper QB Pressure)
  - first-TD legs
  - Gibbs 2+ TD (BEO 1008926148) — check it grades
- **SNF KC@SEA** resolves most open tickets. **MNF DAL@PHI** legs are on the paper Perfect Lottery and the Master RR.
- **SC Season Review:** the AI five + official five grade automatically next build from the locked card.
- **Client edition** of the Master report starts Week 8 (strip names, live-ticket notes, paths).
- **BEO scraper** only parsed 3 games of props; IDP/QB-pressure markets unpriced until recaptured (Week 8 fix).
- **PDFs:** the client PDF is from the 10:20 PM Sat build; the card changed after (rebalance, §7i). Andy hasn't asked to re-send.
- **Not committed (not this session's work, left alone):** modified `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`, `docs/ANTI_PATTERNS.md`, `scripts/build-w05-quantitative-synthesis.mjs`, `scripts/props/bookmaker-sgp-dump-parse.mjs`, `scripts/run_gemini_youtube_shadow.py`, `scripts/weekly-synthesis-preflight.mjs`, and the data/survivor/player-availability/shadow-harness refreshes; untracked `.nfl/gmail-summaries/*`. Ask Andy before staging any of them.

## Rules carried forward

- Nothing is placed without Andy's approval; Claude never places bets.
- Stage named files only. Never `git add -A`, reset, clean or stash. Commit with Windows git via a message file (PowerShell eats `$`).
- Supabase writes only for bets Andy asks to track.
- No logging in or entering passwords; BetOnline/Bovada are blocked in Chrome, so don't work around that.
- Windows Python 3.14 for builds; `--date` = the capture file date.
- Roster facts come from `data/nfl-rosters/espn-full-rosters-latest.json`, never from memory. Kenneth Walker III is KC; Wil Lutz is DEN.
