# Week 4: expert verification gate, expert blocks, per-expert picks section

**Date:** Sat 2026-10-03, ~12:30–13:00 PT · **Agent:** Claude (Cowork) · **Branch:** `main`. Follows `2026-10-03-1225-claude-week4-narratives-written-card-next-handoff.md`.
No card, publish, Supabase write, paid model or sportsbook click. Roster gate PASS after every edit.

## Andy's direction this session

- Every expert name and article must be **verified against the actual matchup** before it's included. Irrelevant articles (e.g. Week 3 Monday-night pieces) are dropped, not listed.
- Expert blocks shouldn't repeat the Bookmaker number already in the game breakdown; mention a price only when the expert's number differs.
- The Master Intel report gets a section listing **every expert's picks** (Andy chose "all their picks", best bets starred).
- Coaching staff names → repo data file `data/nfl-rosters/coaching-staff-2026.json` (not done yet).
- Coaching trends → refresh after Week 4 and add to the game breakdowns starting Week 5 (not done yet).
- Expert season records → not built this session (see open items).

## What was built

1. **`scripts/master-intel/verify_expert_rows.py`** (new). Reads `w04-pull.json` (expert registry, podcast picks, article signals), the schedule, AN openers, the BKR 10/03 board and ESPN rosters. Each candidate is `verified`, `reject` (with reasons) or `not_pick` (news, odds tables, headlines). Checks: maps to one Week 4 game; game not already played; article published after both teams' previous game; article not about a third team; side is one of the two teams; spread within 3.5 points and the same favorite/dog direction as open or current (teasers exempt; plus-money alternate lines flagged; extraction sign errors corrected only when the size matches the market); totals within 6; moneyline direction; every prop player on one of the two ESPN rosters (a prop filed under the wrong game is re-tagged by roster). Also attributes people inside outlet text (Fezzik, Ross Tucker, Doug Kezirian, Simon Hunter, Chad Millman, Brandon Anderson, Kravitz, Stuckey, Erickson; Steve Makinen / Tuley's Takes / Ben Solak from URLs) and flags best bets and contest picks.
   - Run: `python3 scripts/master-intel/verify_expert_rows.py --week 4 --date 2026-10-03` → `data/generated/master-intel/w04-expert-verified.json` (gitignored) + `reports/intel/expert-verification-2026-w04.md` (rejects with reasons).
   - Week 4 result: **257 verified, 83 rejected, 79 not picks, 3 re-tagged** (Jonathan Taylor and two Darren Waller props were filed under ARI@NYG).
2. **build.py** uses the verified file when it exists: consensus counts and prop signals come only from verified picks, rejected registry rows are dropped from the §8 registry, and a gap is printed when the file is missing. Example: NYJ@CHI consensus went from "CHI 7" to "CHI 1 (Mike Florio)". New **"⭐ Every expert's picks this week"** block at the top of the Expert Pick Registry: one collapsible table per expert (person, or outlet when no person is named), ⭐ best bet / 🏆 contest pick, game link, the pick, their words, source. A pick heard on a podcast and logged in the registry is merged into one row with both sources. Futures, win totals and parlays are left out. New narrative section icon 🎙️.
3. **Narratives:** a `### What the experts are saying` section for all 15 games, written only from verified picks, prices mentioned only where they differ from the current number. Every "Why the card leans" expert list was rebuilt from verified picks. Names removed because they weren't real Week 4 picks on that game: ESPN NFL (odds listings), VSiN (unattributed or wrong-game lines), Stuckey on NYJ@CHI, Josh Shepardson and SDQL GURU (not in the verified set), Jason Logan on TEN@BAL, Action Network on ATL@NO / LAC@SEA under. Notable change: **GB@TB's named picks lean TB** (Millman, Anderson, AN) with only Florio on GB; the block now says the projection goes against the expert majority.
4. `non-player-names.json`: added Aaron Glenn (coach) and Steve Makinen.

## Open items

- **Expert records (Andy asked):** no usable records exist yet. The app's Expert Leaderboard computes W-L only from browser localStorage. The repo has W1 and W3 pulls locally; W2 needs a read-only `pull.mjs --week 2`. Grade spreads/totals/MLs against `public/schedule.json` scores, by outlet and by person where named. A small sample, to be labelled as such. One podcast titles itself "(39-13, 75%) NFL Week 4 Best Bets": that's a self-reported record, unverified.
- **Coaching staff file** `data/nfl-rosters/coaching-staff-2026.json` (head coach + OC + DC per team, dated, sourced). Have the roster gate read it so coach names never block.
- **Coaching trends** for Week 5: refresh `scripts/build-coaching-tendency-snapshots.js` (local JSON only; the W1 snapshot went stale 10/01 and has no coordinators) and add a coaching line to each game breakdown.
- The card, then ticket names + TICKETS / SUPERCONTEST blocks (from the 1225 handoff).
- Verifier limits: article picks without a named person and without pick wording ("give me", "plays", "take", "best bet", "predicted") are treated as not picks; the Gemini podcast extraction still mis-tags some sides and games, which the line and roster checks catch but don't fix beyond re-tagging by roster and sign correction.
