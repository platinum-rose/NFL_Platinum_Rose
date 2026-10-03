# 2026-10-02 20:50 PT: Claude: Week 4 intel gathering, YouTube queue, futures boards, Jay's Lock Box promo

Lane: Week 4 intel gathering (Friday night). Branch `main`. HEAD at close is this handoff's commit on top of `47eb968`.
**Next session: formatting of the Week 4 Master Intel report** (resume prompt at the bottom).

## CRITICAL
- **No wagering synthesis until intel gathering is complete** (Andy, 10/2). Card, prop stacks and synthesis wait.
- **The master pull is stale** (`data/generated/master-intel/w04-pull.json`, Thu 10/1 17:54 PT).
  - Rerun `node scripts/master-intel/pull.mjs --week 4` **on Windows** after Antigravity's YouTube/podcast runs land. The device bridge cannot reach Supabase or Google (DNS fails).
  - Then run `node agents/pick-extraction.js`. Podcast picks are only extracted automatically after the GitHub podcast workflow; `user_picks` has had **0 new EXPERT picks since 10/1 08:46 PT**.
  - Then `python3 scripts/master-intel/build.py --week 4 --date <date>`.
- **Template v2 is still awaiting Andy's approval** (from the 16:40 handoff).

## What happened this session
1. **Intel audit.**
   - Preflight: 2 stale of 23 (legacy podcast recs, promotions).
   - GitHub article feeds are healthy: about 67 articles and about 40 pick signals since the last pull.
   - Gaps found: podcasts, expert picks, bookmarks, splits, YouTube digest, survivor file.
2. **YouTube links (Supabase writes, Andy-authorized).** `podcast_episodes.youtube_url` was set on 11 rows, all previously null:
   - Sharp Football ×2
   - Sharp or Square
   - Action Network ×3: Playground, TD Show, Week 4 Betting Preview
   - The Favorites (medium-confidence match, verify about 81 min)
   - Athletic ×2: Week 4 Preview (medium-confidence, about 88 min), Lawrence
   - Even Money ×2 (audio already done)
   
   The full list with episode ids and notes is in `data/podcasts/youtube-manual-urls-2026-w04.json`: 19 videos plus the Action Network playlist. Standalone (unlinked) videos:
   - BettingPros 10 Best Bets `S1Ylt0hn3pY`, Top 10 Props `BUqjtq0xp1U`
   - SoS Pro Gamblers Hotline `Yf2eYagDYUg`
   - SportsLine props `1_4ZMa0H0Rk`
   - Cosell Week 4 pt 2 `2hBAZh-llNQ`
   - FantasyPros (low priority)
   - Flores clip (skip)
   - BettingPros Sunday live `mncrhL4zVvw` (airs Sun 10/4 9 AM PT)
   
   BettingPros `S1Ylt0hn3pY` is **not** Ep. 1083 (length and time differ), so it was deliberately not linked. Standalone videos must run via `scripts/youtube-podcast-sweep.js --urls-only --run-gemini --gemini-scope all` (the default scope `futures` skips weekly picks).
3. **Antigravity lanes:**
   - **Gemini billing.** Prompt: `handoffs/2026-10-02-1905-...`. Findings: `handoffs/2026-10-02-1915-antigravity-gemini-billing-findings.md` (key …vbGs, project `platinum-rose-gmail`, about $1/week run-rate; recommends $25 prepaid plus auto-reload and adding `ANTHROPIC_API_KEY` to GH secrets). **Andy topped up credits.**
   - **Windows tasks.** Prompt: `handoffs/2026-10-02-1950-...`. Findings: `handoffs/2026-10-02-2000-antigravity-windows-tasks-restore.md`. Root cause: a network blip, then a Windows Update reboot on 10/1 that left the tasks dead. All 12 tasks were re-registered, X cookies are valid, and bookmarks are flowing again (14 new by 20:08 PT). The Grok packet has 9 Week 4 threads.
   - **YouTube extraction is in progress (Antigravity, 20:48 PT).** It covers the 11 linked episodes plus the standalone videos. Audio-only episodes not on YouTube still need the audio path: **BettingPros Ep. 1083 (highest value)**, Move the Sticks Week 4 Matchups, and PFF.
4. **Futures (local only, no Supabase sync).**
   - Parsed BKR and BetUS 10/2 text boards, plus the never-imported BetUS 9/29 board, with `scripts/parse-futures-text.js`.
   - Hand-transcribed BEO 10/2 screenshots (SB, conference, all 8 divisions; 96 rows) into `data/futures-imports/betonline-2026-10-02.json`. The screenshot ingester needs network.
   - Report: `reports/futures/futures-line-movement-2026-10-02.md`.
   - Key reads: Bills SB BEO +650 vs. Andy's +992 (+CLV). Packers SB BEO +6600 vs. +2500 (−CLV). Packers NFC North +380 → +1100. Steelers playoffs collapsed after TNF. BetUS win-total lines moved for NE, PIT, HOU and CLE.
5. **Jay's Lock Box promo** (Andy-authorized local ledger write; backup `.bak-claude-20261002-pre-jays-lockbox`).
   - `bet_20261002_w04_jays_lockbox_promo_2team`: NE/BUF Under 48.5 + CIN −2.5, $100.
   - Recorded as `funding_type: promo_credit`, `exclude_from_bankroll: true`, cash risk $0. Odds, payout, book and ticket number are unknown (`needs_confirmation`).
   - Shown on the regenerated Live Tracker as $100 promo risk. Not synced to Supabase.

## Still missing for the Week 4 rebuild
- **Fresh pull + pick extraction:** see CRITICAL.
- **Betting splits:** zero Week 4 rows in `game_splits`. The GitHub workflow `betting-splits-ingest.yml` should run three times on Fridays but wrote nothing. Check its runs.
- **YouTube pick digest** `data/podcasts/youtube-extracted-picks-2026-w04.json`: build it from Antigravity's Gemini output, the same way as Week 3.
- **Survivor popularity** `data/survivor/pick-intel-2026-w04.json`: Week 3's was built from survivorgrid.com and Covers. Not done.
- Synthesis digest, narratives for all 15 games (held to Saturday), card (after synthesis, on Andy's go).
- Saturday: final inactives/injuries, then the roster gate.

## Guardrails (unchanged)
- No wagers or account actions. No TheOddsAPI calls.
- No Supabase or ledger writes without Andy's go.
- Narrow staging only.
- Files left uncommitted on purpose:
  - `public/` and `docs/tracked-wagers/live-tracker-sunday.html` (wager data, local)
  - Antigravity's two findings handoffs (theirs to commit)
  - The roughly 1,240 pre-existing dirty files

## Resume prompt
```
Resume Platinum Rose NFL, Week 4. HEAD = the 2026-10-02 20:50 Claude handoff commit on top of 47eb968 (main). Read HANDOFF.md, reconcile live Git, then read handoffs/2026-10-02-2050-claude-week4-intel-gather-youtube-queue-futures-handoff.md (and skim Antigravity's 2026-10-02-1915 billing and 2026-10-02-2000 Windows-tasks findings). Focus this session: FORMATTING of the Week 4 Master Intel report (scripts/master-intel/build.py, template v2 picks-first, docs/MASTER_INTEL_REPORT_FORMAT.md + RUNBOOK). First confirm whether Antigravity's YouTube/Gemini runs finished, whether `node scripts/master-intel/pull.mjs --week 4` and `node agents/pick-extraction.js` have been run on Windows (pull.json timestamp), then rebuild dist/nfl_week4_master_packet/ and work through the format with Andy. Known gaps: Week 4 splits (0 rows; check the betting-splits-ingest workflow), YouTube digest, survivor popularity file, narratives held to Saturday, no card yet. No wagering synthesis until Andy says intel is complete. Guardrails: no wagers/account actions, no TheOddsAPI, no Supabase/ledger writes without Andy's go, narrow staging only.
```
