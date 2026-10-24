---
name: GAME_SYNTHESIS_SESSION
role: One game per session/agent — frontier-model synthesis -> side, total and prop recommendations
category: dev
docsOnly: true
created: 2026-10-23
supersedes: agents/dev/ASTRA_W06_GAME_SESSION_PROMPT.md (same rules, explicit side/total/prop outputs, generic week)
---

# Platinum Rose — single-game synthesis (sides/totals pass, props pass)

## Activation (one per game; the dispatcher fills <WEEK>, <WW>, <GAME>, <PASS>, <QUEUE>)

```text
Run the Platinum Rose Week <WEEK> game synthesis, pass <PASS>, for ONE game: <GAME>.
Repo: E:\dev\projects\NFL_Dashboard. Use ONLY the device_bash tool (repo at $HOME/mnt/dev/projects/NFL_Dashboard); never the local Read/Write/Bash tools.
Read agents/dev/GAME_SYNTHESIS_SESSION_PROMPT.md and follow it. Your packet is the entry with matchup == "<GAME>" in <QUEUE>.
No gate may stop you: note gate issues and deliver the full synthesis. Do not touch any other game.
```

Games are independent: do not read or reference another game's output.

## 1. Mission

Produce Andy's research-grade recommendation for one game, built on every intel source in the packet plus the files it points to:
- **Pass `sides`**: a recommendation on the **spread**, the **total** and the **moneyline / straight-up winner**, plus SuperContest and pool notes.
- **Pass `props`**: up to 8 **player props** priced on a real captured book row, plus Anytime-TD and First-TD candidates (Andy always wants 7e ATD 7-leg and 8a First-TD candidates, even when the playbook would cut them).

Each market gets either a pick or an honest **PASS**. A pass with a reason is better than a thin pick. These are proposals Andy reacts to; the card/ticket stage is separate.

Hard prohibitions (the only binding rules): no wagers or sportsbook clicks; no TheOddsAPI; no Supabase writes; no paid model/API calls (Gemini, AssemblyAI, OpenAI); no edits to ledgers, portfolio, official picks, wagers or bankroll files; no tickets or stakes (no `ticket`, `stake`, `wager_amount`, `bet_slip`, `payout` keys); no git add/commit/reset/clean/stash/push. The checkout is shared: write ONLY the output files in section 7. Do not rerun the roster gate (parallel agents race on its file).

## 2. Gate notes (advisory only — Andy's standing rule)

One quick pass, then record results in a "Gate notes" section and `gate_notes[]`. Never stop or shorten the run.
1. Packet `missing_inputs[]`: note each; cap any market that depends on the missing input at tier C.
2. Roster: the queue's `roster_vet` block (status, age). If not PASS or stale, treat affected players as unverified and omit their props.
3. Kickoff: if passed, write a labeled retrospective with no forward pick.
4. **Never state a player's team, role or status from memory.** Use the packet (`qb_operator_notes` first — those are Andy-confirmed — then availability/projected starters). If a player looks wrong or is missing from ESPN rosters, do one quick web search before deciding. `player-availability/latest.json` has known misclassification bugs.
5. Uncertain QB/injury/roof facts: present both scenarios when they swing the pick, write "if X is out/in", and name the official news that flips it (inactives are released 90 minutes before THAT game's kickoff — compute it from `kickoff_pt`; international games are early).
6. **Final injury designations:** the packet's availability feed often lacks Friday's official designations. Do ONE web search for the team's final (Friday) injury report for both teams (nfl.com/injuries or team site) and list every Out/Doubtful/Questionable player that matters to a pick.
7. Coaching/staff names: team dossiers are authoritative; `secondary_matchups` coverage notes can carry stale coach names — ignore those names.

## 3. Inputs (packet first; open referenced files with scoped python/jq selectors, never cat whole JSON)

- `market`: BKR current line text (Andy's paste, captured time in the source header). **Price from the NEWEST Bookmaker number available**: if the per-game BKR prop-board file (`prop_boards.bookmaker.path`, `capturedAt`) has game spread/total rows newer than the paste, use those and cite both timestamps. Then the Action Network opener (the season's line-movement baseline — label it "AN open"), SuperContest locked line. Compute opener→current movement and BKR vs contest-line gaps.
- `power_ratings`, `prediction_markets` (Kalshi/Polymarket context only, never an execution venue), FTN team context via `ftn_team_context_selector` (weekly-only by design; never request a refresh), `secondary_matchups`, team dossiers (`team_dossiers` md paths).
- `splits`: bets% vs money% (Action Network). A money-vs-bets gap of 10+ points is a sharp-money flag; say which side the money is on.
- `expert_picks_pull`, `article_selections`, `article_notes`, `pick_signals`, `news_notes`, `props_intel_articles`: verify every expert/article is about THIS matchup and THIS week before citing (drop prior-week pieces). Name experts on both sides. Analyst leads were priced at publish time: reprice against BKR and say how far the line moved.
- `youtube_picks_approved`: approved by Andy as signals. The same pick from the same show in both the audio and YouTube pipelines is ONE opinion (no consensus boost). 4th-quarter, alt-line, SGP and teaser legs are not comparable to the full-game number.
- `weather` (Open-Meteo forecast). Retractable roofs (ATL, HOU, ARI, and any others noted) decided game-day: weather is moot if closed. Stade de France is open-air.
- `prop_boards`: BKR and BetOnline per-game files are executable references; DraftKings Predictions is **reference only** (not executable). Props pass: read the board file with a python one-liner filtered to the players you consider; quote line, price, book and capturedAt. No captured row = no prop pick.

## 4. Method

- **Simulator:** `node scripts/intel/margin-simulator.mjs --selftest`, then `--home-line <BKR home spread> --total <BKR total> [--margin-adj X] [--total-adj Y]`. You supply judgment adjustments (home-positive points) with a stated reason each. **The simulator re-centres on the line you pass**, so `--margin-adj`/`--total-adj` mean "my view minus the market at that line" — for the SuperContest side, run it again with `--home-line` = the contest line and the same view expressed vs that line; soft cap 2.0, hard cap 3.0. Report baseline vs adjusted cover/over probabilities. Props, team totals, SGPs and teasers have no calibrated joint model: never present them as model probabilities.
- **Fair line:** state your fair spread and fair total, and the edge in points vs BKR (and vs the SuperContest line for the side).
- **Tiers:** `A` (strong: multiple independent signals agree, edge ≥1.5 pts or crosses a key number), `B` (solid lean), `C` (thin / conflicted / price-sensitive), `PASS`. Give the **price-sensitivity line**: the number at which the pick turns into a pass (e.g. "playable to -3 -120; pass at -3.5").
- **Card-fit flags** (help the card stage, no stakes): `supercontest_candidate` (y/n, at the contest line), `straight_up_winner` + `pool_confidence` 1–16 (BUK BUK is straight-up; confidence pools rank), `parlay_leg_ok` (y/n and why), `standalone_preferred` (y when the edge is large — the TNF lesson: don't bury the best-margin reads inside long parlays).
- **Counter-case is required** for every pick: what makes the other side right.
- Every non-trivial claim carries `[Source: path or packet field, timestamp]`. No auditable source → Ambiguity section, not the thesis.

## 5. Report structure (markdown)

1. Header: game, pass, as-of PT, kickoff, packet built_at, roster_vet status.
2. **Recommendation box** (top): one line per market — `SPREAD: <pick @ BKR line/price> | tier | fair line | edge | playable-to` ; same for `TOTAL`, `MONEYLINE/SU`; then `SuperContest`, `Pool (SU / confidence)`. Props pass: a table — player, market, line, price, book, capturedAt, projection/basis, tier, parlay_leg_ok; then ATD and First-TD candidates.
3. Game script (how the game likely plays out).
4. QB / availability (with "if out/in" scenarios).
5. Market: opener→current, BKR vs contest line, splits with sharp flags.
6. Quantitative: power ratings, FTN, secondary matchups, simulator table.
7. Expert / podcast / article agreement vs disagreement (names on both sides).
8. Counter-case per pick.
9. Ambiguity / missing data. 10. Pre-kickoff delta checklist (news or price crossings that change each pick). 11. Gate notes.

Length: 900–1600 words (sides), 700–1300 (props).

## 6. Finish

Return a summary of 8 lines or fewer: the recommendation box lines, top 2 risks, missing inputs, output paths.

## 7. Outputs (create dirs; never overwrite another game's file)

- Report: `reports/intel/games/<SEASON>-w<WW>-game-<AWAY>_at_<HOME>-<PASS>.md`
- Structured: `data/research-intel/proposed/games-w<WW>/<SEASON>-w<WW>-game-<AWAY>_at_<HOME>-<PASS>.json` with keys: `game, pass, generated_at, packet_built_at, recommendations[]` (each: `market` [spread|total|moneyline|player_prop|atd|first_td], `selection`, `line`, `price`, `book`, `captured_at`, `tier`, `fair_line`, `edge_pts`, `playable_to`, `model_prob` (sim only, null for props), `supercontest_candidate`, `straight_up_winner`, `pool_confidence`, `parlay_leg_ok`, `standalone_preferred`, `reasons[]`, `counter_case`), `adjustments{margin_adj,total_adj,reasons}`, `sim_runs`, `sources[]`, `ambiguities[]`, `delta_checklist[]`, `gate_notes[]`. No forbidden keys.
- Run log: append ONE line to `reports/intel/games/<SEASON>-w<WW>-game-RUNLOG.md`: `UTC | GAME | PASS | COMPLETE | headline picks/tiers | files`.

Do not commit; the coordinating session stages named files.
