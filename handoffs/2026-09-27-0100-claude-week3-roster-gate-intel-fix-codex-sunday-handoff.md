# Handoff — 2026-09-27 01:00 PT — Claude (Cowork): Week 3 intel sheet roster fix + mandatory ROSTER GATE; Sunday card → Codex

## What happened
Andy stopped betting off the Week 3 intel sheet (00:10 PT) because it was never checked against current 2026 rosters.
Root causes found and fixed this session:
1. **Game narratives** (`reports/intel/master-intel-narratives-2026-w03.md`) were hand/LLM-written from memory:
   A.J. Brown as an Eagle (traded to NE, on IR), Mike Evans + Rachaad White as Buccaneers (SF / WAS), DeAndre Hopkins (on no roster),
   "Jeffrey" Simmons (Jeffery), and practice-squad QB Joey Aguilar written up as a JAX starting-QB risk. All corrected; every grade quoted in
   the narratives updated.
2. **Secondary-matchup seed lists** (`data/secondary-matchups/manual/{secondary,receiver}-roles-2026.json`) were a July depth chart:
   69 of the checkable rows had players on the wrong 2026 team. Rebuilt from live ESPN rosters + depth charts
   (`scripts/nfl-rosters/rebuild_matchup_seeds.py`; log in `scratch/w03-seed-rebuild-log.txt`). The old generator
   `scripts/build-manual-secondary-seeds.js` can no longer overwrite them.
3. **Injury dedupe** double-counted suffix variants (T.J. Tampa / T.J. Tampa Jr.; M.J. Stewart twice). Fixed in
   `agents/lib/secondary-matchup-vulnerability.js` (`playerNameKey`); ruled-out receivers (OUT/IR/PUP/doubtful) no longer listed as targets.
4. **YouTube picks:** Brandon Anderson's four Rachaad White catch props re-filed from MIN@TB to SEA@WAS.
5. **Report builder** no longer lists practice-squad players in a game's injury context.

## Secondary-matchup grades after the fix (data/secondary-matchups/latest.json, rebuilt 00:3x PT Sun)
| Matchup | Before | After |
|---|---|---|
| NYJ O vs DET D | HIGH 9.26 | HIGH 9.79 |
| TEN O vs NYG D | HIGH 7.04 | HIGH 7.32 |
| BAL O vs DAL D | MEDIUM 4.95 | **HIGH 6.15** (Hooker, Durant out) |
| DET O vs NYJ D | MEDIUM 3.75 | HIGH 6.15 |
| SF O vs ARI D | HIGH 6.08 | HIGH 6.08 (mostly depth IR) |
| PHI O vs CHI D | HIGH 5.95 | HIGH 5.95 (only Kyler Gordon is a rated absence) |
| WAS O vs SEA D | HIGH 5.25 | HIGH 5.85 (counter to SEA −7.5) |
| DAL O vs BAL D | HIGH 5.25 | **MEDIUM 3.9** (was a double count) |
| IND O vs HOU D | MEDIUM 3.6 | watch 2.4 |
Open decision for Andy (not changed): season-long IR/PUP DBs still count toward severity.

## ROSTER GATE (new, mandatory — see AGENTS.md / CLAUDE.md / WEEKLY_SYNTHESIS_SESSION_PROMPT.md)
- `python3 scripts/nfl-rosters/fetch_espn_rosters.py` → `data/nfl-rosters/espn-full-rosters-latest.json` (all 32 teams, 2,507 players incl. IR + practice squad).
- `python3 scripts/nfl-rosters/roster_vet.py --week 3 --date 2026-09-26 --fetch --strict` → must print `ROSTER VET: PASS`.
  Checks card legs, digest legs, narratives (every capitalized name must be a 2026 roster player or be in
  `data/nfl-rosters/non-player-names.json`), matchup seeds/targets, YouTube + expert picks. Card legs on OUT/IR/practice squad BLOCK.
- Runs automatically in `node scripts/weekly-synthesis-preflight.mjs` (rows "ESPN rosters 2026 (full)" + "ROSTER VET (gate)")
  and in `scripts/master-intel/build.py` (exits on BLOCK; `--allow-roster-issues` only with Andy's OK).
- Regression: `python3 scripts/nfl-rosters/test_roster_vet.py` (every Week 3 error must still BLOCK) — passes.
- Current Week 3 state: PASS, 30 card legs resolved.

## Rebuilt outputs (local only; dist/ is gitignored)
`dist/nfl_week3_master_packet/`: master + SuperContest md/html/docx/json/pdf (PDFs printed in the cloud sandbox and copied back),
plus `nfl_week3_supercontest_intelligence_summary_w2style.{md,html,docx}` (re-run; "What Breaks It" no longer truncated).

## Not done
- **Step 6:** re-check every unplaced Sunday ticket (Slot 1 Master RR first) and placed RR #739358766 against the corrected sheet → handed to Codex (prompt below).
- `scripts/props/dk-predictions-week-status.py` (from the previous session) left uncommitted: keep/drop is Andy's call.
- Untracked `scripts/props/{build-ai-matchup-packets,run-prop-audit-agent,run-prop-stack-agent}.mjs` and their tests are not from these sessions — left alone.
- Supabase sync of #739358766 not done (needs Andy's OK).

## Codex prompt (Sunday card build)
See the section "CODEX SUNDAY PROMPT" below; Andy pastes it as the first message.

---
CODEX SUNDAY PROMPT
---
You are taking over the Week 3 Sunday + MNF card build for Andy in NFL_Dashboard ("Platinum Rose"). Work in the local checkout
E:\dev\projects\NFL_Dashboard on branch main (pull first; HEAD is the commit "week3: roster gate + corrected intel" or later).
Several inputs are gitignored and exist only in that local folder (dist/, data/generated/props/, data/official-picks/user-placed-wagers-2026.json),
so do not work from a fresh clone. Kickoffs (PT): Sun 10:00 LAC@BUF, CAR@CLE, NYJ@DET, HOU@IND, KC@MIA, TEN@NYG, CIN@PIT, SEA@WAS, NE@JAX ·
13:05 ARI@SF, MIN@TB · 13:25 BAL@DAL (Rio), LV@NO · SNF 17:20 LAR@DEN · MNF Mon 17:15 PHI@CHI.

## Environment notes (added 01:25 PT after Codex's first STOP A)
- No `python3` alias in your sandbox? Use the npm wrappers, which find Python themselves: `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict`,
  `npm run roster:fetch`, `npm run roster:test`, `npm run roster:seeds`. Direct path if needed: C:\Users\andre\AppData\Local\Python\pythoncore-3.14-64\python.exe
  (or set PYTHON=<that path>; the preflight honors it). build.py: `<that python> scripts/master-intel/build.py --week 3 --date 2026-09-26`.
- Verified on this machine 01:25 PT: preflight ROSTER VET row = PASS (30 card legs); `npm run roster:test` = all regression checks pass.
- Remaining preflight STALE rows are cleared to proceed by Andy: Usage trends is complete through Week 2 (stale only by age — Week 3 games
  haven't been played); SuperContest live market isn't needed (SuperContest is out of scope today; if wanted, `npm run odds:sync-live` WITHOUT
  `--live` costs no API credits); legacy podcast recs file is legacy.
- Don't `git pull` over the dirty checkout: main already equals origin/main. Commit only your own narrow file set.
- Fresh BKR/BEO boards: Andy pastes them Sunday morning. Until then, do task 2 (case re-check) and task 3 (availability) on the Saturday-night boards
  and mark prices "Sat 22:59 BKR / 23:06 BEO — re-price pending".

## 0. Read first (in this order)
1. HANDOFF.md → "Current Pick Up Here", then handoffs/2026-09-27-0100-claude-week3-roster-gate-intel-fix-codex-sunday-handoff.md (why the intel changed)
   and handoffs/2026-09-27-0012-claude-week3-sunday-cards-reprice-intel-errors-handoff.md (card state before the fix).
2. agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md — run it in SUN mode. §7.2 hard constraints, §7.4 availability, §7.5 self-check, §10 guardrails all apply.
3. AGENTS.md → "NFL Roster Gate".

## 1. ROSTER GATE — non-negotiable
Never state a player's team, role or status from memory. 2026 rosters moved a lot (A.J. Brown NE/IR, Mike Evans SF, Rachaad White WAS,
Davante Adams LAR, Jaylen Waddle DEN, DJ Moore BUF, Kenneth Walker III KC, Kyler Murray MIN, Dexter Lawrence CIN, Deebo Samuel SF).
- Start: `node scripts/weekly-synthesis-preflight.mjs --week 3 --date 2026-09-26` (refreshes ESPN rosters if >24h, runs the vet).
- Look up any player in data/nfl-rosters/espn-full-rosters-latest.json (team + group: offense/defense/injuredReserveOrOut/practiceSquad).
- After you edit the card: `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict` must print `ROSTER VET: PASS`
  before you show Andy anything. It blocks wrong-team / off-roster / practice-squad / OUT-IR players on card legs.
- If you rebuild the intel report, build.py runs the same gate and exits on failure. Do not use --allow-roster-issues without Andy's OK.

## 2. Latest intel (corrected Sun 00:50 PT)
- Master Intel report: dist/nfl_week3_master_packet/nfl_week3_master_betting_intelligence_summary.{pdf,html,md,json}
- SuperContest report: dist/nfl_week3_master_packet/nfl_week3_supercontest_intelligence_summary.{pdf,html,md,json}
  and the Week-2-layout version ..._w2style.{md,html,docx}
- Game scripts / projections / card reasoning (roster-vetted): reports/intel/master-intel-narratives-2026-w03.md
- Weekend synthesis digest (Sat 9/26 refresh): scratch/w03-synthesis-digest-sat.md
  CAUTION: its secondary-grade notes predate the fix — BAL@DAL now reads BAL O vs DAL D **HIGH 6.15** (support for BAL) and DAL O vs BAL D
  MEDIUM 3.9 (the "counter" is gone); WAS O vs SEA D is HIGH 5.85 (stronger counter to SEA −7.5); IND O vs HOU D dropped to watch.
- Expert/article/splits pull: data/generated/master-intel/w03-pull.json · YouTube picks: data/podcasts/youtube-extracted-picks-2026-w03.json
- Recommendation ledger lives in Andy's claude.ai Project (claude/recommendation-ledger-2026.md), not in the repo; ask Andy if you need it.

## 3. Analytics
- Secondary matchups (rebuilt on 2026 rosters): data/secondary-matchups/latest.json (+ docs/secondary-matchups/secondary-matchup-vulnerability-latest.md)
- Availability: data/player-availability/latest.json (built Sat 23:30 PT). Refresh Sunday morning after inactives news:
  `npm run player-availability:live` then `npm run secondary-matchups`, then re-run the roster vet.
- Projected starters: data/projected-starters/2026/projected-starters-2026-09-26.json · usage: data/generated/player-usage-trends-2026.json
- Roster ground truth: data/nfl-rosters/espn-full-rosters-latest.json (roster-map-latest.json is a partial map; don't use it for team checks)

## 4. Lines (manual captures only — TheOddsAPI has ~11 requests left; do not call it)
- BKR full board 22:59 PT Sat: data/odds/BKR_current_lines_0926_2259 · BEO main board 23:06 PT Sat: data/odds/BEO_current_lines_0926_2306 (BEO has no MIN/TB ML)
- BKR SGP/prop capture 13:47 PT Sat: data/generated/props/bookmaker-live-2026-09-26-week3.json (per-game files alongside)
- BEO prop boards: docs/Player_Prop_Odds_Weekly/Week3/BEO_Week3_* (parsed: data/generated/props/beo-w03.json). Missing: HOU@IND, TEN@NYG, PHI@CHI.
  BKR has no TD markets for MIN@TB or PHI@CHI. DK Predictions: only CAR@CLE saved (docs/Player_Prop_Odds_Weekly/Week3/DK/).
- Anything Sunday-morning: ask Andy to paste fresh BKR/BEO boards; save as data/odds/BKR_current_lines_0927_<HHMM> / BEO_... and re-price from those.

## 5. Card state (reports/bets/2026-w03-card.md → "FOUNDATION RE-PRICE v4", all BKR naive-multiply, UNPLACED)
- Slot 1 Master RR (Andy: "everything leans into that"): CIN ML −177 · JAX ML −164 · BAL ML −178 · SF −8 −103 · LAR ML −131 · PHI ML −188 ·
  CAR/CLE U42.5 −110 · SEA −7.5 −113. 70 × $1 = $70; needs 6 of 8 to profit.
- Slot 3 Morning: CIN ML · CLE ML · SF −8 · BAL ML · LAR ML (+1709). Andy unsure on CLE ML; offered swaps TEN ML / CAR-CLE U42.5 / HOU-IND U42. Undecided.
- Slot 4 Afternoon: JAX ML · SEA −7.5 · SF −8 · TB ML −105 · LAR ML (+1959).
- Slot 5 Hybrid: TEN ML · CIN −3 · SF −8 · PHI ML (+1132).
- NOT re-priced since Sat 12:44–13:47: Prop RR, 7a/7b/7d/7e, 8a/8b, SNF island tiers 1–3.
- PLACED (do not change): BKR #739358766 Dog-ML 2-team RR TEN +121 · NYJ +252 · IND +110 · LV +165 · CLE +113 ($25). Also live from Thu:
  BKR 739211245 (pending DET ML, CIN −3, BUF ML, SEA ML, SF ML; 2 open spots — Andy skipped filling them Sat). Placed wagers: data/official-picks/user-placed-wagers-2026.json (local).
- SuperContest joint five undecided; do NOT write data/supercontest/locked-card-week-3.json unless Andy gives the five.
- Flags to confirm with Sunday inactives: Zay Flowers (Q, BKR pulled his props) → BAL ML; Puka Nacua (doubtful) → LAR ML (in Slots 1/3/4 = biggest single
  exposure); Mike Evans (Q) → SF passing; Brock Bowers (Q); DJ Moore + Keon Coleman (Q, BUF); Coker + Legette (Q, CAR); Tyjae Spears (Q); Marvin Mims (Q);
  Tyson Bagent (Q, MNF — Caleb Williams OUT).

## 6. Your tasks, in order
1. Preflight + roster gate (§1). Report STALE rows to Andy (STOP A); the roster vet has no "go anyway".
2. Step 6 of the intel fix: re-check every unplaced ticket — Slot 1 first, then Slots 3/4/5, Prop RR, 7a–7e, 8a/8b, SNF tiers — and the placed
   RR #739358766 against the corrected narratives + grades (§2). For each leg: does its stated case still hold? Name any leg whose case changed.
3. Sunday-morning availability refresh (§3) and inactives; drop/flag legs on OUT players (a player missing from the box score = LOST leg).
4. Re-price every ticket on Andy's fresh BKR/BEO pastes; run the §7.5 self-check (python, computed prices) and the roster gate.
5. Present the updated card to Andy in the §7.3 per-leg table format with what changed and why. Andy decides and places; you never place bets.
6. Update reports/bets/2026-w03-card.md (new "SUNDAY v5" section; don't delete history), write a dated handoff in handoffs/, point HANDOFF.md at it.

## 7. Standing rules / guardrails
- Leg barrier −350; flag >2 legs shorter than −200 per ticket. Underdog spreads are allowed when their matchup and price case are stated. One leg per game where possible; ≤2 legs per game on BEO multi-game.
- 2-team RRs → Bookmaker; BKR props same-game only; multi-game prop stacks → BetOnline. QB rushing/INT props need a stated matchup fit.
- Team power ratings are allowed as evidence. DK/prediction-market % never mixed with sportsbook odds without the fee/spread check.
- No bet placement or account actions; sportsbook pages read-only. Supabase writes need Andy's per-change OK. No paid model/synthesis runs.
- Git: no `git add -A`; stage narrow reviewed files; never reset/clean/stash the dirty checkout. Master Intel template v1 is locked (changes need Andy's OK + format-doc log).
