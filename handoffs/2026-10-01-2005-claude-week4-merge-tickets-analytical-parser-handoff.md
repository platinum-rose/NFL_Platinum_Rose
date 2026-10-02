# Claude → fresh session: Week 4 merge, official TNF tickets, analytical-feed parser (2026-10-01, 8:05 PM PT)

## CRITICAL
- `main` = **3524656**, pushed, local == origin. Working tree still has Andy's pre-existing dirty/untracked work (≈206 modified, ≈977 untracked, 13 unstaged deletions); it is his — never reset/clean/stash/`add -A`.
- **5 official Week 4 tickets are in the wagers ledger** (pending): $51.37 at risk; 4 depend on TNF PIT @ CLE (kicked off 5:15 PM PT, in progress at handoff). Grade from the final ESPN box score when Andy asks.
- Supabase **writes this session** (Andy-approved): 21 backfilled `research_pick_signals` rows (Week 4 analytical feeds). Nothing else written.
- Andy enabled network egress on his Claude account: the device shell now reaches `*.supabase.co`, ESPN, Kalshi, Polymarket. **Node needs `NODE_USE_ENV_PROXY=1`** in the device shell (curl works without it). Git from the device shell: export `safe.directory='*'`, `core.filemode=false`, `core.autocrlf=true`; delete permission must be re-granted each session (git leaves `.git/*.lock`/tmp files otherwise).

## What happened this session
1. **Git reconciliation.** Windows checkout was on `main` @ 90a32eb with a stale index (251 phantom staged deletions from the old commit-tree workaround). Built the Week 4 work in a temp worktree `E:\dev\projects\NFL_Dashboard_w4` (branch `claude/week4-intel-windows-2026-10-01`), then merged everything back into the main checkout per Andy: fast-forwarded `main`, rebuilt the index from HEAD (fixes the phantom deletions), wrote the 68 incoming files, kept main's newer `roster-map-latest.json`. Merged Codex's 5622e15 (PIT@CLE market intel + Alejandro planner). Backups of the pre-merge state: local branches `backup/main-index-2026-10-01`, `backup/main-worktree-2026-10-01`.
2. **Week 4 intel refresh** (1fbc98e): section-5 builders, `master-intel/pull.mjs --week 4`, strict roster gate PASS; usage trends rebuilt W2–W3 (projected starters 42 → 102 signals, 0 teams needing manual depth).
3. **Official tickets logged** (`data/official-picks/user-placed-wagers-2026.json`, backups `.bak-claude-20261001-pre-w4-tnf` and `.bak-claude-20261001-pre-w4-bkr`; ledger is gitignored):
   | Ticket | Book | Type | Risk | Odds | To win |
   |---|---|---|---|---|---|
   | 1001392960 | BetOnline | TNF 4-leg prop parlay | $10.09 | +1150 | $116.04 |
   | 1001390385 | BetOnline | TNF 8-leg prop parlay (incl. Boswell O7.5 kicking pts) | $5.00 | +6920 | $346.00 |
   | 1001388000 | BetOnline | TNF 5-leg prop parlay | $5.00 | +12600 | $630.00 |
   | 739565346 | Bookmaker | 10-team ML/spread parlay (CLE +3.5 TNF … ATL +4 MNF) | $10.08 | +9238 | $931.18 |
   | 739527199 | Bookmaker | TNF SGP: Under 40 + CLE +3.5 | $21.20 | +226 | $47.91 |
   Open `needs_confirmation` notes: BetOnline book inferred from ticket format; odds derived from to-win/risk; BetOnline placement times not on confirmations; BKR leg 1 tagged LIVE though placed 5:05 PM. Live Tracker regenerated for Week 4.
4. **Live Tracker fix** (3524656): kicking-points prop legs now grade on the kicker's points (was stuck at 0).
5. **Analytical-feed pick extraction** (4c08af4, dc62ee0): PFF, Sharp Football, PFT, Rotowire, Walter used to skip signal extraction (`source_type: 'analytical'`). New `agents/lib/analytical-picks.js` parses every article body (no title gating) but only emits pick-shaped signals: Walter "Week N NFL Pick:" blocks, predicted scores when an article states 3+ ("Steelers 17, Browns 13."), and side/total/ML lines with an exact team name + pick language in the same sentence; no title-as-pick fallback. Wired into teaser, new-body and backfill paths; per-feed `maxBodyChars`; optional per-feed `refreshBodyDays` body re-fetch (currently unused). 10 tests in `tests/unit/analyticalPicks.test.js`. Week 4 dry run over 150 notes: 21 signals, all real (16 PFT, 2 Sharp, 3 Walter) vs ~175 junk if the skip were simply dropped. **Walter deprioritized per Andy** (paywall, won't pay): confidence 0.63 → 0.50, no re-fetch. `scripts/backfill-analytical-signals.mjs --since <ISO> [--write]` (dry run by default). Week 4 signals now **200** (window from Tue 9/29 04:00Z).

## Open items (next session)
- **Grade TNF**: 4 official tickets + BKR 10-teamer leg 1 + the three TNF AI proposal drafts (`data/official-picks/proposals/active/tnf-pit-cle-*`, never placed) from the final box score.
- **Saturday Master Intel** (runbook `docs/MASTER_INTEL_REPORT_RUNBOOK.md`): still missing BKR/BEO prop boards for the other 15 games, DK Predictions, final inactives, verified BEO game lines (M6 BEO board = 9/28 opening snapshot). Then narratives → build → export → QA. Ticket ideas stay in `reports/analysis/w1-3-deep/claude/week4-build-checklist.md`; every ticket needs Andy's go.
- **Preflight (main checkout): 4 stale of 23** — legacy podcast recs (450h), BEO futures board (222h), BKR futures board (216h), promotions (265h). SuperContest live-market row looks fresh but compares against **Week 3** locked lines (no `locked-card-week-4.json` yet).
- `pull.mjs` window starts **Mon** 04:00Z (392 signals) vs preflight Week 4 window **Tue** 04:00Z (200) — decide whether to align.
- Roster vet info: secondary-matchups manual data lists **Joey Porter Jr. under DAL** (roster: PIT) + 4 unverified players. `roster:vet --fetch` did not refetch ESPN rosters (still M6 2026-10-01T09:00Z copy).
- Player-props intel thin: 12 props, 2 games.
- Twitter/X bookmarks: no new signals since Wed 9/30 morning.
- Walter late-games page is not in his RSS (low priority now).
- Unit suite: 9 pre-existing failures in other files (e.g. `generateLiveTracker.test.js` expects cashed/burnt Week 4 tickets); not caused by this session.
- Cleanup when Andy says: retire `NFL_Dashboard_w4` — **first** `cmd /c rmdir E:\dev\projects\NFL_Dashboard_w4\node_modules` (junction to main's node_modules), then `git worktree remove`; delete branch `claude/week4-intel-windows-2026-10-01` (already merged) and, later, the two backup branches.

## Guardrails (unchanged)
No wagers/sportsbook/account actions; no TheOddsAPI calls; no Supabase writes or ledger changes without Andy's explicit go; never promote proposal drafts; stage explicit reviewed paths only — never `git add -A`/`commit -a`/reset/clean/bare stash/force-push.

## Resume prompt
Resume Platinum Rose NFL from the Windows checkout `E:\dev\projects\NFL_Dashboard` (main @ 3524656 at handoff). Read HANDOFF.md, reconcile live Git (fetch, status, ahead/behind), then read only `handoffs/2026-10-01-2005-claude-week4-merge-tickets-analytical-parser-handoff.md`. Live Git and current files override the handoff. First: if TNF PIT @ CLE is final, grade the four TNF-dependent official tickets and leg 1 of BKR #739565346 from the ESPN box score and show Andy before writing the ledger. Then continue the Week 4 Saturday Master Intel build per the runbook (capture the missing BKR/BEO prop boards, DK Predictions, inactives; narratives only when freshness + QA gates pass). Guardrails above apply.
