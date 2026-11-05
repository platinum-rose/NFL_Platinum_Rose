# Handoff: Week 8 wrap + Week 9 TNF prep (Tue 11/03, ~2 PM PT; Claude while Andy was offsite)

Repo `E:\dev\projects\NFL_Dashboard`. Nothing committed, staged or pushed. No Supabase writes, wagers, ledger edits or paid calls. $0 spend
(the RSS fetches went through a free web fetcher).

## Done

1. **Week 8 podcast grades (Part A of the Antigravity W09 prompt):** 67-96 on 167 unique expert positions, -26.51u.
   Best: Erickson +5.61u (Woolcock 4-0, +5.02u). Worst: Brandon Anderson -11.94u, Koerner 0-7 on TD scorers. Anytime/first TD went 8-35, -17.8u.
   - `reports/intel/w08-podcast-pick-grades.md` + `.json`
   - Grader (new, works for any week): `scripts/master-intel/grade_podcast_picks.py --week N`
2. **Truncated box scores fixed:** `data/fantasy/boxscores/espn-401872930.json` and `-401872931.json` (Week 1 NYG@DAL, KC@DEN) had been cut off by a
   killed live-tracker build on 10/22. Both re-fetched from ESPN; the truncated copies are kept as `*.truncated-20261022`.
   - Root cause: `scripts/generate-live-tracker.mjs` used a plain `writeFile` for the box-score cache. It now uses `writeFileAtomic`. Backup: `.bak-claude-20261103-pre-atomicbox`.
   - Hardened `scripts/grade_defensive_boards.py`'s cache write too (utf-8, tmp + os.replace). Backup: `.bak-claude-20261103-pre-utf8`.
   - `build_player_games.py` now runs (7,908 rows). `validate_postmortem_data.py` now completes: it warns on markets the recap
     grader can't map instead of crashing (`KeyError: None`). Backup: `.bak-claude-20261103-pre-unmapped`.
   - **Andy:** re-run `node scripts/archive/weekly-archive.mjs --week 8 --refresh` on Windows to regenerate the archive manifest and vault notes.
3. **Validation findings (read-only, no ledger edits):**
   - 3 legs still say PENDING on SETTLED-loss tickets. Box-score results: PIT TD u2.5 **LOST** (3 TDs), DET FG o1.5 **WON** (2 FGs; corrected at 3 PM, the earlier '0' was a label mismatch),
     Barkley 60+ rush+rec **LOST** (54). No ticket result changes.
   - Sack legs: Van Ness and Oweh each had **1 sack**, so the recap grader (WON) is right and the `lib` grader (LOST) is wrong on sacks.
   - The recap grader can't map these markets: rushing_receiving_yards, two_plus_touchdowns, team_touchdowns, team_field_goals,
     first_touchdown_scorer, second_half_total.
4. **Read-only checks:** `docs/tracked-wagers/reconciliation-latest.*` is current (11/03 2:30 AM PT). The only open ticket is the FDP Day 4 qualifier.
   Pick'em: **no CBS BUKBUK or SimplySportsware captures for W05, W07 or W08** (W06 only partial). Yahoo is current through W08.
5. **Week 9 episode discovery:** `reports/intel/w09-episode-discovery-2026-11-03.md` + `.json` (a queue Antigravity can use).
   Extract: Sharp or Square `WbYwN5iWNGY` (Tue, JAX@BAL @0:06:00), Ross Tucker/Fezzik `kq21OfxY1Mk` (JAX@BAL @14:09),
   BettingPros `OtB_TD5uMgE` (+ short `KBxzssZwduM`). Not found yet: BettingPros Early Best Bets & Survivor, the Action Network early-lines audio,
   VSiN, Lock & Cash, Cody Brown, Move the Sticks. Ross's PICKS episode is expected Wed.
6. **TNF prep packet:** `reports/bets/2026-w09-tnf-prep-packet.md` (builder: `scratch/claude-w09-tnf/build_tnf_packet.py`).

## Flags

- `public/schedule.json` was **not** updated with Tuesday's 10 AM DK lines. Every Week 9 row is from the 11/03 03:00Z snapshot
  (JAX@BAL still 8.5/42.5). Step 7 of the prompt (line-move check) would miss the moves; use the odds-ingest/cadence numbers instead.
- `data/projected-starters/2026/latest.json` still lists **Lamar Jackson** as a BAL known starter (stale Week 1 lock) next to Fagnano.
- Sweep config has dead channels: TheProsBestBets (nothing since 2024) and Ed Feng (2021). Evan Miyakawa is college basketball. Several preferred shows have no channel ID.

## Still blocked here (needs Antigravity or Andy's Windows machine)

- Caption pulls, Parakeet ASR and the in-session pick extraction (Part B steps 3-6). YouTube isn't reachable from this session and Chrome wasn't connected.

## Update, 3:00-3:30 PM PT (second offsite block)

- **New episode:** BettingPros "Early NFL BEST BETS & Survivor Pool Picks: Week 9" `KjbSWUbYkeI` (posted 1:15 PM). Added to the discovery md/json.
- **Caption route tested:** Firecrawl's YouTube post-processor only feeds transcript text to its answer mode. There's no timestamped
  transcript, so it can't meet the `source_timestamp` rule. Extraction still needs Antigravity (yt-dlp/Parakeet on Windows).
- **schedule.json staleness, root cause and fix:** the Tuesday cadence writes the cache in step 1 (`schedule-ingest`) and only
  ingests odds in step 6, so the cache was always one snapshot behind. Added **step 6b** to `scripts/toolbox.mjs` (Tuesday): re-run
  `schedule-ingest --dry-run` (cache only: no Supabase write, no TheOddsAPI call). Backup: `.bak-claude-20261103-pre-cacherefresh`.
  Refreshed the cache now for Week 9 (all 272 games intact; backup `public/schedule.json.bak-claude-20261103-pre-oddsrefresh`).
  The newest snapshot is **1 PM PT: JAX@BAL is BAL +10 / 40.5** (was 8.5/42.5 Mon night, 9.5/41.5 at 10 AM). Also NO -1.5/42.5,
  NE -3 (back from -2.5), SF total 52.5. The TNF packet's market section is updated.
  (The VM needs `NODE_USE_ENV_PROXY=1` for node fetches; Windows doesn't.)
- **Grader fixes** (backups `*.bak-claude-20261103-*`):
  - `reports/analysis/season/claude/scripts/lib.py`: the "N.5+" threshold was parsed as N5+ ("0.5+ Sacks" read as 5+). That was the sack bug.
  - Recap grader (`reports/bets/season-recap/scripts/parse_placed.py`, `grade.py`): added rush+rec yards, 2+ TDs, first TD scorer,
    team TDs, team FGs and 2H totals.
  - Week 8 validation: **ERROR 11 -> 0**. The 20 WARNs left are the lib grader's own gaps (FDP legs without a game field, same markets).
  - The three stale PENDING legs are now graded: PIT TD u2.5 L, DET FG o1.5 **W**, Barkley 60+ L. All tickets stay losses. Ledger not edited.
- **Projected starters (proposal, not applied):** `reports/engineering/projected-starters-stale-week1-locks-2026-11-03.md`.
  Week 1 locks never expire, and 7 listed starters are IR/Out, including **Lamar, Hurts and Dart**. NYG has no valid QB row. Two-rule fix proposed.
