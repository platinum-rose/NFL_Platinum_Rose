# Handoff 2026-11-04 4:40 PM PT: Week 8 closed, Week 9 build starts fresh (START HERE)

## Week 8 status: closed
- **Consolidated post-mortem page:** `reports/bets/season-recap/week8-post-mortem.html` (Week 4 format, rendered and checked).
  Index: `reports/analysis/week8-postmortem/w08-postmortem-summary-2026-11-04.md` (DEV: `claude/w08-postmortem-summary-2026-11-04.md`).
- Cash as tagged +$267.83 on $348.27 (A-A-A DK $609 carried it); DK-as-promo basis -$221.40. Season -$432.61 on $3,650.58.
- Placed legs regraded 154/252 (61%). AI-backed props 22/38, Andy-only props 70/105, unplaced AI props 10/29.
- Recommendation ledger Week 8 closed (D48-D56), DEV `claude/recommendation-ledger-2026.md`.

## Done this session (11/04 afternoon)
- Season-recap pipeline for W8: `ai_recs_w8.py`, `recaps_w8.py` (season-recap/), `scripts/cfg_w8.py`, `scripts/paper_w8.py`; outputs `w8legs.json`, `w8paper.json`, `work/w8/{parts,metrics}_w8.json`.
- Grader/page fixes (backups `*.bak-claude-20261104-*`): `grade.py` CITY map (city-name sides were mis-graded), `build.py` categories (rush_rec_yds, team_count),
  `gen_week.py` money bar when returns > stake, `page_week.py` signed season net.
- Wagers ledger: added Q5 (Day 5 qualifier SF+SEA ML, $2 cash), N1, N2a, N2b (FDP bonus TNF combos). Local file only, NOT Supabase.
  Backup `data/official-picks/user-placed-wagers-2026.json.bak-claude-20261104-fdp-n1n2q5`. Leg check: all trackable.
- Live Tracker rebuilt for Week 9 (`public/live-tracker-sunday.html`, `docs/tracked-wagers/live-tracker-sunday.html`). Mobile tracker not rebuilt (Andy: not needed today).
- W09 card updated with placed FDP exposure (`reports/bets/2026-w09-card.md`, "Update Wed 11/04 ~4:05 PM PT").

## Open Week 8 items (Andy decides)
1. DK booking basis for Week 8 (as tagged vs 10/27 DK-as-promo rule + DK account change).
2. OK to update 5 PENDING legs inside settled tickets (3 official: PIT TD u2.5 L, DET FG o1.5 W, Barkley 60+ L; 2 paper Lamar legs L). No ticket result changes.
3. Run on Windows: `node scripts/archive/weekly-archive.mjs --week 8 --refresh`.
4. Supabase sync of Q5/N1/N2a/N2b (needs per-change OK).
5. Paper-leg count mismatch: season-recap regrade 40-58 vs lib.py report 38-60 (not reconciled; likely grader differences).
6. Commit (Andy, scoped; never `git add -A`; the tree has many unrelated pipeline changes). Week 8 close-out batch:
   reports/bets/season-recap/{ai_recs_w8.py,recaps_w8.py,w8legs.json,w8paper.json,week8-post-mortem.html,work/w8/}
   reports/bets/season-recap/scripts/{cfg_w8.py,paper_w8.py,grade.py,build.py,gen_week.py,page_week.py}
   reports/analysis/week8-postmortem/  data/official-picks/user-placed-wagers-2026.json  reports/bets/2026-w09-card.md
   public/live-tracker-sunday.html  docs/tracked-wagers/live-tracker-sunday.html  handoffs/2026-11-04-1640-week8-closed-week9-build-START-HERE.md

## Week 9 build: where to start
- TNF JAX@BAL (Thu 11/5, 5:15 PM PT). Card: `reports/bets/2026-w09-card.md`; prep packet `reports/bets/2026-w09-tnf-prep-packet.md`.
- Existing TNF exposure (FDP): Henry ATD x2, Strange 2+ rec x2, Lawrence yds + 1+ TD, JAX ML, Tuten ATD, Rodriguez ATD + 30+ rush, Henry 40+ rush. Cash tickets avoid stacking more; promo tickets may reuse.
- Status: Tuten Q (DNP Mon-Wed, game-time); Travon Walker Q; Fagnano starts for BAL; total drifting down (Kalshi 39.5).
- Gates: Andy's prop board captures (`runbkrprops.cmd`, `rundkprops.cmd`, `runbolprops.cmd`), Thursday inactives (~3:45 PM PT), roster gate, paste every slip.
- Podcast intel: verified digest `data/podcasts/youtube-extracted-picks-2026-w09.claude-verified.json`; veracity report `reports/intel/w09-podcast-veracity-2026-11-04.md`.
  Antigravity Pass 2 prompt `agents/dev/ANTIGRAVITY_W09_PASS2_PODCAST_SWEEP.md` (Andy runs Thu night or Sat).
- Week 8 lessons to apply: rushing lane > receiving lane; cap one read at 2-3 templates; island SGP ladders 0/61 season (one ticket per game);
  master RRs 0/5 (skip); game-line parlays the only family up.
- Standing rules: leg floor -350; no full-game spreads/totals in prop parlays; no INT at BKR; ignore Exact/Bands; no wagers, ledger edits,
  Supabase writes, publication or push without Andy's per-action OK.

## Standing ticket rules (Andy accepted 11/04 4:38 PM PT; also in `reports/bets/2026-w09-card.md`)
Cash parlays only: max 3-4 legs (6+ = promo only); one read on at most 2-3 cash tickets; prefer rushing-lane legs, receiving props at the lowest rung;
no totals or same-team prop stacks on a shaky-QB game before inactives; skip master RRs.
Promo/bonus tickets (DK promos, FDP bonuses, free bets) are exempt: bigger stacks and reused legs are fine.

## Post-mortem setup tasks for the Week 9 session (agreed 11/04; Andy: do all five, starting in the fresh session)
1. Tuesday post-mortem step in `scripts/toolbox.mjs`: box-score regrade, season-recap page, fixed scorecard
   (cash net; legs/ticket vs tickets won; P&L by family; AI-backed vs Andy-only vs unplaced AI; near misses; projection MAE; cash vs promo split).
2. Machine-readable AI record: every card/ladder/proposal writes its legs to JSON at proposal time (replaces hand-built `ai_recs_wN.py`).
3. Lessons -> rules loop: each post-mortem ends with at most 3 rules; next week's post-mortem checks compliance and effect (start with the 5 cash rules above).
4. Grader cross-check: season-recap `grade.py` vs `lib.py` on every run; flag mismatches before the page builds (start with W8 40-58 vs 38-60).
5. Backfill season-recap pages for Weeks 5-7 (Andy: do all five).
First full run: Week 9 post-mortem, Tue 11/10.
