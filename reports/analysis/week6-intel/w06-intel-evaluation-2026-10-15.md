# Week 6 intel evaluation: is it good enough for `build-w05-quantitative-synthesis.mjs --week 6`?

Written Thu 2026-10-15 ~17:55 PT (00:55Z 10/16), read-only. Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`, HEAD `ed23280` (verified; `HANDOFF.md` still points at the older 19:00Z pickup on `d968cf2`, so the 17:40 doc governs). Scratch output (fresh ESPN pull, Action Network openers) went to `/tmp/w6eval`, not the repo. Nothing was run that writes to the ledger, Supabase or the proposed/ folder. Proposed != placed.

## Verdict

**Do not run the synthesis yet.** It costs nothing: the script (230 lines) makes no network, LLM or Supabase calls. The problem is that the inputs would make the numbers wrong in two specific ways:

1. The market anchor is the Bookmaker board from 10/14 07:20Z (41 h old). Six of 14 games have moved 1 point or more on spread or total since, and CAR@PHI moved about 5 points because **Jalen Hurts is Out** (Tanner McKee starts).
2. The availability gates inside the model stop at 10/13 06:20Z. They contain no Hurts event, and they still carry stale "out" events for Mayfield, Lamar Jackson and Caleb Williams.

Rerun after the Friday injury reports with a fresh board (sequence at the bottom).

## 1. Inputs: timestamp, rows, verdict

| Input | As of | Rows | Verdict |
|---|---|---|---|
| BetOnline props, committed in `ed23280` | 10/15 23:08Z (4:08 PM PT) | 762, 14 games | PASS for TNF only. Player-tagged rows exist only for SEA@DEN (160 rows, 15 players). The other 13 games have game, half, quarter and special lines, no player rows. |
| BetOnline props, newer | 10/16 00:15Z (at kickoff) | 758 | Exists on disk, not in the `ed23280` file list. Same shape; first-quarter and targets rows partly gone. Not a pre-game price. |
| BetOnline props, older | 10/14 23:08Z | 514 | Superseded. |
| DK Predictions | 10/15 21:30Z | 779, 14 games, 248 players | PARTIAL. Only anytime, first and 2+ TD contracts (not executable odds). WAS@SF has 6 game-line rows and no TD rows. |
| Bookmaker SGP | 10/14 07:20Z | 1,455 | STALE (41 h). Sunday games have 60 rows each (game, half, quarter lines). Player props exist only for SEA@DEN (588 rows) and HOU@JAX (147). |
| Game lines (model anchor) | BKR board 10/14 07:20Z | 14 games | FAIL, stale. |
| Game lines (current) | SuperContest 10/15 21:29Z; DK/FD 10/15 19:00Z (`live-market-comparison.json`) | 14 games | PASS. BetOnline has no spread/total rows for CHI@ATL or NO@NYG, so use DK/FD for those. |
| Action Network openers | pulled just now (cutoff 10/11 5 PM PT) | 14 games | PASS; not saved to the repo. |
| ESPN status, availability layer, dossiers, digest | 10/15 21:03Z | 32 teams | STALE-ish (3.8 h): 47 injury-feed changes since (section 2). |
| Roster snapshot | 10/15 21:03Z | 2,557 players | PASS. Gate file 22:32Z: PASS, 3 UNVERIFIED names in secondary-matchups only (Travis Hunter JAX, Dominique Hampton TEN, Israel Mukuamu PIT). |
| Quant availability_gates | newest event 10/13 06:20Z | 560 events | FAIL, stale and partly wrong (section 2). |
| FTN Stats IQ | 10/13 18:14Z | 36 tables, 4,634 rows | PASS (re-exported after Week 5). |
| Secondary matchups | 10/14 14:03Z | 14 games | PASS, manual-review use only. |
| Prediction markets | 10/15 20:36Z | n/a | PASS. |
| Podcasts | no Week 6 master-intel pull | 3 extracted episodes (44 picks) in Antigravity staging | WEAK. Not ingested. `speaker_segments` empty and captions garbled, so quotes can't be verified (Team 2 validation). 3 episodes have no transcript (YouTube HTTP 429). The model uses podcasts as qualitative only, so this does not block it. |
| Experts | `expert-dossiers` 10/14 13:30Z | rolling | OK for context. |
| Articles | `article-intel-review` 10/14 16:00Z | 112 records, published 10/13 08:56Z to 10/14 15:55Z | STALE for Sunday props: nothing from Thursday or Friday. |
| Twitter | sweep 10/15 19:03Z | 343 fetched | 0 new; see section 3. |

**Reconciling the BEO numbers.** Neither earlier figure matches a file on disk. The `d968cf2` version was captured 10/15 18:20Z with 770 rows (the "20:08Z/770" in the 15:10 handoff). The `ed23280` version is 23:08Z with 762 rows (the "21:15Z/764" in the 17:40 doc). The "at least 500 rows" bar is met, but it is met by TNF alone.

**Gap for the Sunday slate:** no book capture has Sunday player-prop prices (yards, receptions) at all. DKP gives TD contracts only, BetOnline and Bookmaker give game-level lines. Any Sunday player card would rest on article prices.

## 2. QBs and injuries

Fresh ESPN pull (00:44Z) matches the 21:03Z QB picture:

| Team | QB | ESPN status |
|---|---|---|
| BAL | Lamar Jackson | Questionable |
| CHI | Caleb Williams | Questionable |
| TB | Baker Mayfield | Doubtful (depth chart shows only Jalon Daniels behind him) |
| PHI | Jalen Hurts | **Out**, McKee starts |

- `operator-confirmed-starters-2026-w06.json` still does not exist. The 15:10 handoff says "Williams probable, Jackson doubtful", which contradicts ESPN (both Questionable). **I need Andy's confirmation for BAL, CHI, TB and PHI.**
- Design gap: the availability layer's "QB flags" line only lists Questionable/Doubtful starters. A replaced starter (Hurts to McKee) shows as `ok`, so it is easy to miss. Worth a "QB replaced" flag.
- Notable changes since 21:03Z: HOU David Montgomery now Out (was Doubtful), HOU Jalen Pitre Out; SEA Jalen Milroe Out; DEN Sam Ehlinger Out; several SF OL/DL Questionable; WAS Austin Ekeler Questionable. Friday reports are not out yet, so this will move again.
- Troy Franklin: Andy reported IR on 10/14, the override was retired on 10/15 (`2d6cd79`), ESPN shows him active, and the resume doc still lists "DEN WR3 replacement for Franklin" as a gap. Needs one line from Andy on which is true. The "layer still lists Franklin as unconfirmed IR" gap is already fixed (zero mentions).

## 3. Player-props intel (`build-player-props-intel.js`, 22:32Z)

- 19 props, 9 distinct players, 2 games. All 9 are on the claimed teams in the 21:03Z roster and none is on the fresh injury feed. Roster validity is fine.
- Coverage is the problem: 18 of 19 props are SEA@DEN, which is live right now, and the 19th is a single HOU@JAX leg (Tuten rush 50+, -296). **No Sunday-slate props exist in this file.**
- It reads articles only and does not consume the BEO/DKP/Bookmaker captures. Prices are article prices ("DraftKings/FanDuel (per source article)"), not book prices.
- Quality: JSN appears five times and Nix Under three times (different lines from different writers); the one curated parlay stacks JSN Over 92.5 receiving with JSN 70+ rec/rush yards (same player twice); several "rationale" snippets are copies of neighbouring parlay legs.
- Twitter "0 ingested" is not the relevance gate. Of 343 bookmarks: 296 were skipped by the 6-day recency limit, 36 were already in the vault, 11 failed the NFL keyword check. Widening the relevance gate would recover about 11 items at most. Raising the recency limit is the lever, and I would not recommend it (those are 6+ days old). Side note for the Gemini drain: the sweep runs on roughly a 30-minute cadence (18:33Z, 19:03Z in the log) and uses Gemini Vision OCR for images. I did not check how many OCR calls it makes.

## 4. Model vs market (10/14 dry-run output)

Home-spread / total, model anchor vs newest BetOnline capture (DK/FD where BetOnline has none):

| Game | Anchor (BKR 10/14) | Now | Note |
|---|---|---|---|
| CAR@PHI | PHI +1 / 40.5 | PHI +3.5 / 38.5-39 | Hurts Out. Opened PHI -1.5. Model never saw it. |
| CHI@ATL | CHI -3 / 49.5 | CHI -1.5 / 51.5 | DK/FD |
| BUF@LV | BUF -4 / 53.5 | BUF -5.5 / 53.5 | DK/FD (BetOnline -4.5) |
| ARI@LAR | LAR -13.5 / 52 | LAR -12.5 / 51.5 | |
| BAL@CLE | BAL -5 / 41.5 | BAL -4 / 41 (FD -3.5) | |
| LAC@KC | KC -8 / 43 | KC -9 / 41.5 (DK -8.5/42.5) | |
| SEA@DEN | SEA -2.5 / 41 | SEA -2.5 / 40.5 | Live, moot. |

- Model edges are small: only ARI (56.8%) and JAX (55.1%) clear 55%; the rest sit at 50-54%. With 60% of the blend on the market that is expected, and the file itself calls it provisional and unbacktested. TNF: model SEA by 2.0 vs market 2.5, total 40.5 vs 40.5, so no edge.
- ARI's edge shrinks as the line moved 1 point toward ARI. The CAR@PHI "CAR 51.9% cover" was computed at CAR -1; at CAR -3.5 the model's own margin (CAR by 1.7) points the other way, and the features I could see (offense/defense z, tempo, SRS, secondary) have no QB-change term, so a rerun would partly drag PHI back toward the market while its team inputs still assume Hurts.
- Action Network openers agree with the story: PHI opened -1.5, CHI/ATL opened ATL +2.

## 5. Other known gaps

- DKP matchup-market check: not done (browser refused DKP; Andy checks himself). WAS@SF DKP TD rows missing. `b_vEEqWIg2c` transcript missing (and `slfl5V7gaOY`, `06-42WRzKQI`; all HTTP 429).
- Lane E: duplicate ticket 994540980 (note added), Bears exactas book (confirmed BetOnline), Week 3 credit (used on LV +4.5) and Week 5 credit (held) are resolved in the ledger. I did not re-audit reloads.
- Housekeeping for Andy on Windows: stale `.git` lock and `tmp_obj_*` files, `.bak-*` files under `data/`.

## 6. Cost and recommended sequence

- **Synthesis cost: $0.** Local computation only; a real run overwrites `data/research-intel/proposed/2026-w06-quantitative-synthesis.json` and `reports/intel/2026-w06-quantitative-synthesis.md`. `--dry-run` writes nothing.
- Recommended order, all free and read-only unless noted:
  1. Andy confirms QBs (BAL, CHI, TB, PHI) and Franklin; I create `operator-confirmed-starters-2026-w06.json`.
  2. After the Friday injury reports (evening PT) or Saturday morning: ESPN status, `roster_vet.py --week 6 --date 2026-10-18 --fetch --strict`, availability layer, digest, dossiers (the 10/14 handoff §3 chain).
  3. Andy captures a fresh Bookmaker board for `--bkr`; BetOnline and DKP Sunday captures if he wants Sunday prop context (note the BetOnline Sunday player markets may simply not be posted yet).
  4. `--dry-run`, review (SEA@DEN should be excluded; it is played), then the real run on his go.
- Also worth doing before then: add a QB-replaced flag to the availability layer and add current events to the model's availability gates.
