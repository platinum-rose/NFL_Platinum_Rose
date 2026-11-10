# Handoff 2026-11-10 3:00 PM PT: Week 9 fully closed and committed; start Week 10 intel gathering (START HERE)

Repo `E:\dev\projects\NFL_Dashboard` (device_bash `$HOME/mnt/dev/projects/NFL_Dashboard`; request `E:\dev` if the folder isn't connected).
The checkout is on branch `claude/w5-prop-cards-2026-10-11`. **Commits go to `main` via a temp index** (see Git below).
Previous handoffs (DEV project): `claude/handoff-2026-11-10-1710-week9-pools-captured-START-HERE.md` (pick'em) and `claude/handoff-2026-11-10-week9-closed-week10-prep-START-HERE.md`.

## State at close

- **Week 9 is closed.**
  - Ledger: all 318 tickets are settled, and no ticket is open.
  - Results: cash +$210.12 for the week, -$222.49 for the season.
  - Post-mortem page: `reports/bets/season-recap/week9-post-mortem.html`. Summary in DEV: `claude/w09-postmortem-summary-2026-11-10.md`.
- **Rules for Week 10:**
  - R9-1: cash tickets max 6 legs; 7+ legs are promo/bonus only.
  - C2: one read on at most 2-3 cash tickets.
  - C3: prefer rushing-lane legs; receiving props at the lowest rung.
  - C4: no totals or same-team stacks on a shaky-QB game before inactives.
  - C5: skip master round robins.
  - Standing: leg floor -350; promo tickets are exempt; no wagers, ledger edits, Supabase writes or TheOddsAPI calls without Andy's per-action OK.
- **Matchup post-mortem (new this session):**
  - Report: `reports/analysis/week9-postmortem/w09-matchup-postmortem.md`, also in DEV as `claude/w09-matchup-postmortem-2026-11-10.md`. It has team grades for every Week 9 game, season unit ratings, quarterback splits, remaining strength of schedule, and a Week 10 board of model vs DraftKings.
  - Machine-readable files:
    - `reports/analysis/season/claude/out/week-09-matchup-intel.json` holds ratings and all 136 remaining games with pass, rush, protection and explosive-play edges.
    - `reports/analysis/week9-postmortem/w09-matchup-notes.json` holds hand-written carry-forward notes per team.
    - `out/week-09-matchup-intel.md` is the team-by-team list.
  - Script: `reports/analysis/season/claude/scripts/matchup_postmortem.py --week N`, run after each week. It needs the nflverse play-by-play refreshed first (`scripts/fetch-nflverse.mjs`, or download `play_by_play_2026.csv.gz` into `data/nflverse/2026/`).
- **Tuesday cadence** ran at 10:00 and exited 1. Only the post-mortem printout crashed on a cp1252 console; that is fixed in `reports/bets/season-recap/scripts/postmortem.py` (stdout set to UTF-8). The Week 10 DraftKings opening lines are in `game_odds_snapshots`, and 452 TheOddsAPI credits remain.
- **Pick'em Week 9** was captured and pushed earlier today (ac0f009b). The pool sign-ins now persist for next Tuesday's routine.

## Week 10 slate (from the schedule cache)

- **Thursday 11/12:** TNF WAS @ NYG at 5:15 PM PT.
- **Sunday 11/15:**
  - 6:30 AM PT: NE @ DET.
  - 10:00 AM: KC @ ATL, HOU @ CLE, MIN @ GB, JAX @ TEN, MIA @ IND, CAR @ NO, BUF @ NYJ.
  - 1:05 PM: SEA @ LV, LAR @ ARI.
  - 1:25 PM: SF @ DAL.
  - SNF: PIT @ CIN.
- **Monday 11/16:** MNF LAC @ BAL.
- **Byes:** CHI, DEN, PHI, TB.

**DraftKings at Tuesday's open (home line, total):**

| Game | Line | Total |
|---|---|---|
| WAS @ NYG | NYG -2.5 | 41.5 |
| NE @ DET | DET -2.5 | 51.5 |
| KC @ ATL | ATL +3.5 | 45.5 |
| HOU @ CLE | CLE +4.5 | 39.5 |
| MIN @ GB | GB -5.5 | 40.5 |
| JAX @ TEN | TEN +10.5 | 46.5 |
| MIA @ IND | IND -2.5 | 40.5 |
| CAR @ NO | NO -1.5 | 48.5 |
| BUF @ NYJ | NYJ +8.5 | 50.5 |
| SEA @ LV | LV +3.5 | 43.5 |
| LAR @ ARI | ARI +9.5 | 40.5 |
| SF @ DAL | DAL +4.5 | 55.5 |
| PIT @ CIN | CIN -3.5 | 48.5 |
| LAC @ BAL | BAL -5.5 | 38.5 |

**Quarterback situations to carry** (adjusted offensive EPA/play by starter, from the matchup post-mortem):
- MIN: Murray is OUT; Wentz has posted -0.26 over 3 starts.
- BAL: Jackson is on IR; Fagnano has posted -0.38 over 2 starts and 10 points per game.
- NYG: Dart is on IR; McCarthy is +0.04, with a 13% sack rate.
- SEA: Lock (+0.02) has been no worse than Darnold.
- ARI: Minshew (-0.10).
- CLE: Sanders (-0.21) after 1 start.
- PHI: Milton (-0.31); PHI is on bye.

**Starting leads from the matchup intel (verify against injuries and prices):**
- SF @ DAL: SF's #2 pass and #3 run offense against DAL's #32 and #32 defenses.
- HOU @ CLE: HOU's #2 pass rush against CLE's #31 protection.
- CAR @ NO: the model has CAR -3.4 against the market's NO -1.5, and NO's run defense ranks #31.
- MIN @ GB and LAC @ BAL: lean Under.
- Rushing-lane spots: CAR (Hubbard), IND (Taylor), SF, PIT, BUF.
- Fade rushing: MIN and GB, ARI, LV, TEN.

## Intel gathering: what the fresh session should do (follow the Week 9 pattern)

1. **Week 10 card skeleton:** `reports/bets/2026-w10-card.md`. Put the rules above at the top and seed it with the matchup-intel leads. Log AI picks with `ai_record.py add --week 10` (they go to `data/official-picks/ai-proposals/2026-w10.json`) at proposal time.
2. **Fair lines:** build `reports/intel/w10-model/fair-lines-w10.json`, using `reports/intel/w09-model/build_card_w09.py` as the template.
   - Inputs: the power ratings, FTN, the team-weeks CSV and market lines.
   - Add the Week 9 QB adjustments again (MIN Wentz, BAL Fagnano, NYG McCarthy, ARI Minshew, CLE Sanders). Size SEA/Lock smaller than last week's -2.5, which was too big.
   - Cross-check against `week-09-matchup-intel.json` (`games[].proj_home_margin`).
3. **Slate packet:** `python scripts/analysis/slate_prep_packet.py --week 10` -> `reports/bets/2026-w10-slate-prep-packet.md`, plus a news-checked QB notes file `reports/bets/2026-w10-slate-qb-notes.md`.
4. **TNF WAS @ NYG prep packet** (`reports/bets/2026-w10-tnf-prep-packet.md`): Wednesday and Thursday practice reports, NYG pass rush vs WAS protection, McCarthy's sack rate, Daniels, and the total of 41.5. The build plan waits for Thursday's prop captures and the ~3:45 PM PT inactives.
5. **Sources Andy runs or helps with:**
   - FTN Stats IQ export through Week 9 (Andy's Chrome). The previous drop is `data/research-intel/source-evidence/2026-11-05-ftn-stats-iq/`; rebuild the context with `--week 10`.
   - SuperContest Week 10 lines -> `data/supercontest/week-10-lines.json`.
   - Podcast sweep: the Antigravity prompt pattern in `agents/dev/ANTIGRAVITY_W09_*`, then `scripts/master-intel/youtube_digest_from_staging.py`.
   - Prop captures (`runbkrprops.cmd`, `rundkprops.cmd`, `runbolprops.cmd`; sign in to the BKR Chrome on 9222 first).
6. **Toolbox cadences:** Wednesday, Thursday and Friday run on the Windows schedule. Read their logs (`logs/toolbox-<day>.log`); don't re-run them, because that repeats Supabase writes and spends TheOddsAPI credits.
7. **Andy's fantasy (Yahoo, 5 leagues; synced 11/04, so re-sync before Sunday):**
   - Bucky Irving starts on bye in 3 leagues.
   - Caleb Williams, Odunze, Swift, Trotter and Devin Bush are also on bye.
   - Week 10 exposure: Derrick Henry with Fagnano; Josh Allen / Garrett Wilson / Breece Hall in BUF @ NYJ; Deebo and Dak in SF @ DAL.

## Git (learned the hard way)

- Build commits from `refs/heads/main` with a temporary index:
  - `GIT_INDEX_FILE=.git/index-claude-<tag> git read-tree main`, then `update-index --add -- <paths>`, then `write-tree`.
  - Then `commit-tree <tree> -p main`, `update-ref refs/heads/main`, and `git push origin main`.
  - Never use the branch HEAD.
- `git ls-remote origin refs/heads/main` before pushing, because main gets "Auto-update schedule" commits. Rebuild on top if it moved.
- Always `git -c core.fsmonitor=false`. The bridge can't delete lock files, so move a stale `.lock` to `.git/stale-*`.
- Commit only scoped paths, never `git add -A`. Leave out `*.bak-*`, `*.prev-*`, `__pycache__`, and `*.truncated-*` box scores.

## Still uncommitted (earlier sessions' scoped batches, Andy's call)

- Week 9 prep files from the 11/04-11/06 handoffs: the W9 card, slate packet, QB notes, TNF packet/plan, SC five, FDP N2 card, and SuperContest lines. Also the DK/BKR scraper fixes (`scripts/props/draftkings-prediction-dump-parse.mjs`, `cron-bkr-scrape.mjs`), the podcast digest, the FTN source evidence, and the master-intel scripts.
- `data/archive/2026/season/*.csv` and `data/archive/2026/week-09/vault/` from the pick'em archive run (the Thursday 6 AM run writes the vault).
- Cleanup the bridge can't do: `logs/.tmp-claude-w09-settle-upsert.mjs`, `logs/.tmp-claude-w09-mnf-rows.json`, and backups `data/pickem/*.bak-claude-20261110`.
